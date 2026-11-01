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
    thang = [h for h in c1["hop"] if h.get("thang") and h["loai"] == "thoi_diem"]
    assert [h["thang"] for h in thang] == ["10/2026", "11/2026", "12/2026"]
    # TG-V2: không cần giờ sinh, mỗi tháng vẫn có thần số + con giáp + phong thuỷ + ngày đẹp
    for h in thang:
        assert [r["ma"] for r in h["lop"]] == ["thanso", "con_giap", "phong_thuy", "ngay_dep"]
        assert all(r["nhan"] and r["loi"] for r in h["lop"])
    assert any(h["loai"] == "cot_loi" and "2027" in h["tieu_de"] for h in c1["hop"])
    c2 = bc["chuong"][1]
    assert len([h for h in c2["hop"] if h.get("thang") and h["loai"] == "thoi_diem"]) == 12
    for c in bc["chuong"]:
        assert c["moi_xem"]["cau_hoi"] and c["moi_xem"]["phut_doc"] >= 1
        for h in c["hop"]:
            assert h["ma_mau"].startswith("ds.") and len(h["ma_mau"]) <= 60
            assert h["phai"] in ("pitago", "nam_phai_viet", "tu_binh", "dan_gian_vn")
    _sach(bc)


def test_tap_quan_nam_2027():
    bc = T.lap(SINH, HOM_NAY, gioi_tinh="nam")                   # 1990 Canh Ngọ: tuổi mụ 38 năm 2027
    tq = T.tap_quan(SINH, 2027, "nam")
    assert "tap_quan" not in bc                                    # SAO-2: không lộ ngoài chương
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
    t1 = [h for h in c1["hop"] if h.get("thang") and h["loai"] == "thoi_diem"]
    assert len(t1) == 3 and all({"tuvi", "battu"} <= {r["ma"] for r in h["lop"]} for h in t1)   # TG-V2: chương miễn phí đủ lớp
    gop = [h for h in c2["hop"] if h["loai"] == "thoi_diem" and h.get("thang")]
    assert len(gop) == 12 and all(h["nguon"] == "hai_la_so" for h in gop)          # UX: 12 hộp, mỗi hộp đủ cách xem
    for h in gop:
        assert [r["ma"] for r in h["lop"]] == ["thanso", "con_giap", "phong_thuy", "ngay_dep", "tuvi", "battu"]
        assert "giới tính" not in json.dumps(h["lop"], ensure_ascii=False)       # có giới tính → góc hợp riêng
    # năm: con giáp + phong thuỷ theo mệnh quái có trong chương 1 và chương 3
    assert any(h.get("nguon") == "phong_thuy" for h in c1["hop"]) and any(h.get("nguon") == "phong_thuy" for h in c3["hop"])
    assert any(h.get("nguon") == "con_giap" for h in c3["hop"])
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
        for r in h.get("lop", []):
            if r["ma"] == "tuvi":
                assert "âm lịch" in r["tieu"]


def test_thang_noi_bat_chi_khi_hai_cach_cung_muc():
    ts = T._thang_ts(SINH.day, SINH.month, HOM_NAY, 12)
    tv = T._tv_thang(TV, HOM_NAY, 4, None)
    bt = T._bt_thang(BT, HOM_NAY, 12)
    nb = T.thang_noi_bat(ts + tv + bt)
    for h in nb:
        m, y = (int(x) for x in h["thang"].split("/"))
        giua = dt.date(y, m, 15).isoformat()
        a = next(x for x in tv if x["tu"] <= giua <= x["den"])
        b = next(x for x in bt if x["tu"] <= giua <= x["den"])
        assert a["muc"] == b["muc"] == h["muc"]
    assert T.thang_noi_bat(ts) == []                                   # thiếu lá số → không nêu
    gop = T.gop_thang(ts, tv, bt, {})
    for g in gop:                                                      # mức hộp gộp chỉ khi hai lá số cùng mức
        m, y = (int(x) for x in g["thang"].split("/"))
        giua = dt.date(y, m, 15).isoformat()
        a = next(x for x in tv if x["tu"] <= giua <= x["den"])
        b = next(x for x in bt if x["tu"] <= giua <= x["den"])
        assert g.get("muc") == (a["muc"] if a["muc"] == b["muc"] else None)
    assert all([r["ma"] for r in g["lop"]] == ["thanso"] for g in T.gop_thang(ts, [], [], {}))


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
    assert T.tap_quan(dt.date(2022, 3, 1), 2027, "nu")["sao"] is None
    _sach(bc)


def test_api_nam():
    r = client.get("/v1/thoi-gian-toi/nam")
    j = r.json()
    assert r.status_code == 200 and len(j["cac_nam"]) == 2 and j["mac_dinh"] in j["cac_nam"]


def test_bat_tu_doc_dung_nam_khi_tet_truoc_lap_xuan():
    """2028: Tết 26/01 trước Lập xuân 04/02 — chương Bát tự phải là lưu niên Mậu Thân 2028, không phải Đinh Mùi 2027."""
    hom = dt.date(2027, 10, 30)
    assert T.nam_mac_dinh(hom) == 2028
    bc = T.lap(SINH, hom, gioi_tinh="nam", tv_sinh=TV, bt_sinh=BT)
    bt = [h for h in bc["chuong"][2]["hop"] if h["nguon"] == "battu"]
    s = json.dumps(bt, ensure_ascii=False)
    assert "2028 Mậu Thân" in s and "2027 Đinh Mùi" not in s
    # năm đang đi, hôm nay giữa Tết và Lập xuân: Bát tự vẫn là năm 2028
    bc = T.lap(SINH, dt.date(2028, 1, 28), nam=2028, gioi_tinh="nam", tv_sinh=TV, bt_sinh=BT)
    assert "2028 Mậu Thân" in json.dumps(bc["chuong"][2], ensure_ascii=False)
    # 05/02/2027 (sau Lập xuân, trước Tết) xem năm 2026: Bát tự là Bính Ngọ 2026
    bc = T.lap(SINH, dt.date(2027, 2, 5), nam=2026, gioi_tinh="nam", tv_sinh=TV, bt_sinh=BT)
    assert "2026 Bính Ngọ" in json.dumps(bc["chuong"][2], ensure_ascii=False)


def test_ma_tap_quan_tach_tinh_huong():
    a = T._hop_tap_quan({**T.tap_quan(SINH, 2027, "nam"), "quan_he_nam": "trung", "tam_tai": 3, "kim_lau": "x"}, 2027, False)
    b = T._hop_tap_quan({**T.tap_quan(SINH, 2027, "nam"), "quan_he_nam": "xung", "tam_tai": None, "kim_lau": None}, 2027, False)
    assert a[0]["ma_mau"] != b[0]["ma_mau"] and "tam_tai3" in a[0]["ma_mau"]
    assert "Thê" not in a[0]["noi_dung"]


def test_thang_noi_bat_tg_v2():
    """Chương 1 nêu tháng hội nhiều lớp thuận / nhiều lớp nhắc chậm (đếm lớp, không điểm số); tên tháng có trong 12
    tháng của chương 2."""
    bc = T.lap(SINH, HOM_NAY, gioi_tinh="nam", tv_sinh=TV, bt_sinh=BT)
    c1, c2 = bc["chuong"][:2]
    ds12 = {h["thang"] for h in c2["hop"] if h.get("thang") and h["loai"] == "thoi_diem"}
    for h in c1["hop"]:
        if h.get("ma_mau", "").startswith("ds.tgt.xep."):
            assert h["cac_thang"] and set(h["cac_thang"]) <= ds12
            assert "điểm" not in h["noi_dung"]
    _sach(bc)


def test_thang_xung_tuoi_vao_nen_tranh():
    bc = T.lap(SINH, HOM_NAY, gioi_tinh="nam")                   # tuổi Ngọ: tháng Tý xung (12/2026)
    c4 = bc["chuong"][3]
    h = next(x for x in c4["hop"] if x["ma_mau"].startswith("ds.tgt.xung_thang"))
    assert "12/2026" in h["noi_dung"]
