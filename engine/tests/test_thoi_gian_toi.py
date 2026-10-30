# -*- coding: utf-8 -*-
"""NAM-2 (hướng B, chủ dự án duyệt 2026-10-30) — "Thời gian tới của bạn": 3 tháng tới · 12 tháng tới · năm {năm}.

Chỉ GHÉP các RULES/CALC đã có (một bộ tính): tháng/năm cá nhân (thần số), nhịp 3 tháng Tử vi (gọi 4 lần cho 12 tháng),
chương "Năm nay" + "Vận hạn" Tử vi/Bát tự chạy với ngày xem = Tết năm đích, tháng theo tiết Bát tự, tập quán theo tuổi
(sao hạn, Tam tai, Kim lâu, năm tuổi/xung), hạn năm. Báo cáo khuôn `doi_song_1`; chương 1 (3 tháng + tóm tắt năm) miễn
phí, 3 chương sau mở bằng Sao ở tầng web (chủ dự án chốt)."""
import datetime as dt
import json

import pytest
from fastapi.testclient import TestClient

from app.calc import tuvi_an_sao as az
from app.luangiai import doi_song_khuon as kh
from app.luangiai import thoi_gian_toi as T
from app.main import app

client = TestClient(app)
HOM_NAY = dt.date(2026, 10, 30)
SINH = dt.date(1990, 5, 15)
TV = {"ngay": dt.date(1990, 5, 15), "ti": az.time_index(8, 30), "gioi_tinh": "nam", "tz_lich": 7.0, "hoa_linh": "viet",
      "thang_nhuan": "thang_sau", "lich": "viet", "luu_nguyet": "dau_quan_thai_tue"}
BT = {"lich": dt.datetime(1990, 5, 15, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}
CAM = ("đại hung", "chết", "tai hoạ", "tai họa", "xui xẻo", "giải hạn", "mất mạng", "bệnh nặng", "vật phẩm", "cúng sao",
       "con số may mắn", "tuổi thọ")
CHUONG = ["tom_tat", "muoi_hai_thang", "nam", "nen_tranh"]


def _sach(bc):
    s = json.dumps(bc, ensure_ascii=False).lower()
    assert not any(c in s for c in CAM), [c for c in CAM if c in s]
    assert kh.kiem_giong_van(bc) == []


def test_nam_mac_dinh():
    assert T.nam_mac_dinh(dt.date(2026, 10, 30)) == 2027        # Tết 2027 còn 99 ngày → năm tới
    assert T.nam_mac_dinh(dt.date(2026, 5, 1)) == 2026
    assert T.nam_mac_dinh(dt.date(2027, 1, 20)) == 2027         # trước Tết 06/02/2027: năm âm 2026, Tết gần → 2027
    assert T.cac_nam(dt.date(2026, 10, 30)) == [2026, 2027]


def test_chi_ngay_sinh():
    bc = T.lap(SINH, HOM_NAY)
    assert bc["phien_ban"] == "doi_song_1" and bc["nam"] == 2027 and bc["mo_dun"] == "thoi_gian"
    assert [c["ma"] for c in bc["chuong"]] == CHUONG
    assert set(bc["thieu"]) == {"gio_sinh", "gioi_tinh"}
    c1 = bc["chuong"][0]
    thang = [h for h in c1["hop"] if h.get("nguon") == "thanso" and h["loai"] == "thoi_diem"]
    assert [h["thang"] for h in thang] == ["10/2026", "11/2026", "12/2026"]
    assert any(h["loai"] == "cot_loi" and "2027" in h["tieu_de"] for h in c1["hop"])
    c2 = bc["chuong"][1]
    assert len([h for h in c2["hop"] if h.get("nguon") == "thanso" and h["loai"] == "thoi_diem"]) == 12
    for c in bc["chuong"]:
        assert c["moi_xem"]["cau_hoi"] and c["moi_xem"]["phut_doc"] >= 1
        for h in c["hop"]:
            assert h["ma_mau"].startswith("ds.") and len(h["ma_mau"]) <= 60
            assert h["phai"] in ("pitago", "nam_phai_viet", "tu_binh", "dan_gian_vn")
    _sach(bc)


def test_tap_quan_nam_2027():
    bc = T.lap(SINH, HOM_NAY, gioi_tinh="nam")                   # 1990 Canh Ngọ: tuổi mụ 38 năm 2027
    tq = bc["tap_quan"]
    assert tq["tuoi_mu"] == 38 and tq["sao"] == "Thổ Tú" and tq["quan_he_nam"] == "luc_hop"
    assert tq["tam_tai"] is None and tq["kim_lau"] is None
    assert "gioi_tinh" not in bc["thieu"]


def test_nam_ngoai_khung():
    with pytest.raises(ValueError):
        T.lap(SINH, HOM_NAY, nam=2030)


def test_du_la_so_nam_toi():
    bc = T.lap(SINH, HOM_NAY, gioi_tinh="nam", tv_sinh=TV, bt_sinh=BT)
    assert bc["thieu"] == []
    c1, c2, c3, c4 = bc["chuong"]
    assert len([h for h in c1["hop"] if h.get("nguon") == "tuvi" and h["loai"] == "thoi_diem"]) == 3
    tv12 = [h for h in c2["hop"] if h.get("nguon") == "tuvi" and h["loai"] == "thoi_diem"]
    assert 12 <= len(tv12) <= 14                                   # tháng nhuận tách nửa đầu / nửa sau
    assert len([h for h in c2["hop"] if h.get("nguon") == "battu"]) == 12
    s3 = json.dumps(c3, ensure_ascii=False)
    assert "năm nay" not in s3.lower() and "Năm 2027" in s3
    assert {h.get("nguon") for h in c3["hop"]} >= {"tuvi", "battu", "thanso"}
    assert all(h.get("nam", 2027) == 2027 for h in c4["hop"] if h.get("nguon") in ("tuvi", "battu"))
    _sach(bc)


def test_nam_nay_giu_chu_nam_nay():
    bc = T.lap(SINH, HOM_NAY, nam=2026, gioi_tinh="nam", tv_sinh=TV, bt_sinh=BT)
    assert bc["nam"] == 2026 and bc["chuong"][2]["tieu_de"].startswith("Năm 2026")


def test_api():
    r = client.post("/v1/thoi-gian-toi", json={"ngay_sinh": "1990-05-15", "ngay_xem": "2026-10-30"})
    assert r.status_code == 200 and r.json()["nam"] == 2027
    r = client.post("/v1/thoi-gian-toi", json={"ngay_sinh": "1990-05-15", "ngay_xem": "2026-10-30", "nam": 2031})
    assert r.status_code == 422
    r = client.post("/v1/thoi-gian-toi", json={
        "ngay_sinh": "1990-05-15", "ngay_xem": "2026-10-30", "gioi_tinh": "nam", "dien_dat_toi_da": 1,
        "la_so": {"birth_date": "1990-05-15", "birth_time": "08:30", "gender": "nam", "noi_sinh": "ha-noi"}})
    assert r.status_code == 200, r.text
    assert r.json()["thieu"] == []


def test_muc_nam_lay_tu_luu_nien_khong_phai_dai_han():
    bc = T.lap(SINH, HOM_NAY, gioi_tinh="nam", tv_sinh=TV, bt_sinh=BT)
    c1 = bc["chuong"][0]
    tv = next(h for h in c1["hop"] if h["tieu_de"].startswith("Năm 2027 theo Tử vi"))
    nam = next(h for h in bc["chuong"][2]["hop"] if h["ma_mau"].startswith("ds.nam_nay.luu_nien."))
    assert tv["muc"] == nam["muc"]
    for h in c1["hop"]:
        if h.get("nguon") == "tuvi" and h["loai"] == "thoi_diem":
            assert h["tu"] and h["den"] and "âm lịch" in h["tieu_de"]    # web hiện khoảng ngày dương từ tu/den


def test_thang_noi_bat_chi_khi_hai_cach_cung_muc():
    bc = T.lap(SINH, HOM_NAY, gioi_tinh="nam", tv_sinh=TV, bt_sinh=BT)
    hop = bc["chuong"][1]["hop"]
    nb = [h for h in hop if h["ma_mau"].startswith("ds.tgt.noi_bat")]
    tv = [h for h in hop if h["nguon"] == "tuvi" and h.get("tu")]
    bt = [h for h in hop if h["nguon"] == "battu" and h.get("tu")]
    for h in nb:
        m, y = (int(x) for x in h["thang"].split("/"))
        giua = dt.date(y, m, 15).isoformat()
        a = next(x for x in tv if x["tu"] <= giua <= x["den"])
        b = next(x for x in bt if x["tu"] <= giua <= x["den"])
        assert a["muc"] == b["muc"] == h["muc"]
    assert hop[: len(nb)] == nb
    assert T.thang_noi_bat([h for h in hop if h["nguon"] == "thanso"]) == []   # thiếu lá số → không nêu


@pytest.mark.parametrize("seed", range(24))
def test_nhieu_la_so_khong_loi(seed):
    import random
    r = random.Random(seed)
    ngay = dt.date(1940, 1, 1) + dt.timedelta(days=r.randrange(0, 365 * 85))
    gio, gt = r.randrange(24), r.choice(["nam", "nu"])
    tv = {**TV, "ngay": ngay, "ti": az.time_index(gio, 15), "gioi_tinh": gt}
    bt = {"lich": dt.datetime(ngay.year, ngay.month, ngay.day, gio, 15), "gioi_tinh": gt, "gio_ty": "da_ty"}
    hom = dt.date(2026, 1, 1) + dt.timedelta(days=r.randrange(0, 700))
    for nam in T.cac_nam(hom):
        bc = T.lap(ngay, hom, nam=nam, gioi_tinh=gt, tv_sinh=tv, bt_sinh=bt)
        assert [c["ma"] for c in bc["chuong"]] == CHUONG
        ma = [h["ma_mau"] for c in bc["chuong"] for h in c["hop"]]
        assert all(len(m) <= 60 and m.startswith("ds.") for m in ma)
        for c in bc["chuong"]:
            assert len({h["ma_mau"] for h in c["hop"]}) == len(c["hop"])
        if nam != T.cac_nam(hom)[0]:
            assert "năm nay" not in json.dumps(bc["chuong"][2:], ensure_ascii=False).lower()
        _sach(bc)


def test_tre_nho_khong_sao_han():
    bc = T.lap(dt.date(2022, 3, 1), HOM_NAY, gioi_tinh="nu")
    assert bc["tap_quan"]["sao"] is None
    _sach(bc)


def test_api_nam():
    r = client.get("/v1/thoi-gian-toi/nam")
    j = r.json()
    assert r.status_code == 200 and len(j["cac_nam"]) == 2 and j["mac_dinh"] in j["cac_nam"]
