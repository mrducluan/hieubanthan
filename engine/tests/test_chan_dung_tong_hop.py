# -*- coding: utf-8 -*-
"""CD-1 — "Chân dung tổng hợp": ba cách nhìn (Tử vi · Bát tự · Nhân tướng) cùng một con người. Viết TRƯỚC khi nối.

Phương án chọn: đồng thuận THEO MẢNG ĐỜI — engine chỉ ĐỌC mức ba báo cáo đời sống đã chấm (không tính lại, không điểm
số, không đổi mức môn nào), xếp thành ma trận mảng × môn, ghép hộp "cùng thấy / nhìn khác nhau" + mượn nguyên hộp của
từng môn (giữ mã kiểm chứng gốc → phiếu "Đúng với mình" vẫn về đúng môn). Chương 1 miễn phí (ma trận + điều ba cách
cùng thấy), các chương sau mở bằng Sao ở tầng web như Thời gian tới."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.luangiai import chan_dung_tong_hop as cd
from app.luangiai import doi_song_khuon as kh
from app.main import app

client = TestClient(app)
XEM = dt.date(2026, 11, 6)
TV = {"ngay": dt.date(1988, 10, 24), "ti": 4, "gioi_tinh": "nam"}                       # 08:30 → giờ Thìn (ti 4)
BT = {"lich": dt.datetime(1988, 10, 24, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}
_G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))["cases"]
CAM = ("điểm số", "/100", "hung", "xấu", "hình khắc", "thọ yểu", "chết", "tai hoạ", "tai họa", "xui", "giải hạn",
       "vật phẩm", "cúng sao", "chẩn đoán", "sẽ ốm", "mắc bệnh")


@pytest.fixture(scope="module")
def tl_day():
    from tests.test_nhan_tuong import TL_DAY
    return TL_DAY


@pytest.fixture(scope="module")
def bc(tl_day):
    return cd.lap(TV, BT, tl_day, XEM)


# ------------------------------------------------------------------ luật đồng thuận (thuần)
def test_dong_thuan_cung_muc():
    h = cd.dong_thuan("cong_viec", {"tuvi": "thuan", "battu": "thuan", "nhantuong": "thuan"})
    assert h and h["loai"] == "diem_manh" and h["muc"] == "thuan" and "3 cách" in h["tieu_de"]
    assert h["ma_mau"] == "ds.chan_dung.cong_viec.cung.thuan.3"
    assert h["phai"] == cd.PHAI_BA_MON and h["nguon"] == "ba_mon"


def test_dong_thuan_hai_mon_cung_mot_khac():
    h = cd.dong_thuan("tien_bac", {"tuvi": "can_chu_dong", "battu": "can_chu_dong", "nhantuong": "thuan"})
    assert h and h["loai"] == "loi_khuyen" and "muc" not in h          # khác nhau → không gán mức chung
    assert "Tử vi" in h["noi_dung"] and "Bát tự" in h["noi_dung"] and "Nhân tướng" in h["noi_dung"]
    assert h["ma_mau"].startswith("ds.chan_dung.tien_bac.khac.")
    # việc nên làm theo mức dè dặt nhất
    assert h["huong_xu_ly"]


def test_dong_thuan_can_it_nhat_hai_mon():
    assert cd.dong_thuan("suc_khoe", {"tuvi": "thuan"}) is None
    assert cd.dong_thuan("suc_khoe", {"tuvi": "thuan", "battu": None, "nhantuong": None}) is None
    h = cd.dong_thuan("suc_khoe", {"tuvi": "can_bang", "battu": "can_bang", "nhantuong": None})
    assert h and h["muc"] == "can_bang" and "2 cách" in h["tieu_de"]


def test_dong_thuan_tat_dinh():
    a = cd.dong_thuan("tinh_cam", {"tuvi": "thuan", "battu": "can_bang", "nhantuong": "can_chu_dong"})
    b = cd.dong_thuan("tinh_cam", {"nhantuong": "can_chu_dong", "battu": "can_bang", "tuvi": "thuan"})
    assert a == b


# ------------------------------------------------------------------ báo cáo khuôn doi_song_1
def test_khuon_va_ma_tran(bc):
    assert bc["phien_ban"] == kh.PHIEN_BAN and bc["mo_dun"] == cd.MO_DUN and bc["phai"] == cd.PHAI_BA_MON
    assert [c["ma"] for c in bc["chuong"]] == cd.THU_TU_CHUONG
    mt = bc["ma_tran"]
    assert mt["mon"] == ["tuvi", "battu", "nhantuong"] and mt["ten_mon"]["nhantuong"] == "Nhân tướng"
    assert [d["ma"] for d in mt["dong"]] == cd.MANG_CO_MUC
    for d in mt["dong"]:
        assert d["ten"] and set(d["muc"]) == {"tuvi", "battu", "nhantuong"}
        for m in d["muc"].values():
            assert m in (None, "thuan", "can_bang", "can_chu_dong")
        assert d["dong_thuan"] in ("cung", "khac", "thieu")
    assert bc["so_mang_cung"] + bc["so_mang_khac"] <= len(cd.MANG_CO_MUC)
    assert bc["thieu"] == []
    for c in bc["chuong"]:
        assert c["tieu_de"] and isinstance(c["doan"], list) and "moi_xem" in c
        for h in c.get("hop", []):
            assert h["loai"] in kh.LOAI_HOP and h["tieu_de"] and h.get("ma_mau") and h.get("phai") and h.get("nguon")
    assert kh.kiem_giong_van(bc) == []


def test_muc_doc_tu_bao_cao_mon_khong_tinh_lai(bc, tl_day):
    """Mức trong ma trận = đúng mức chương của từng báo cáo môn (một bộ tính, không chấm lại)."""
    from app.luangiai import battu_doi_song as bds, nhan_tuong as nt, tuvi_doi_song as tds
    tv = tds.lap(TV, XEM)
    bt = bds.lap(BT, XEM)
    n = nt.bao_cao(tl_day, nam_sinh=dt.date(1988, 10, 24), gioi_tinh="nam", ngay_xem=XEM)
    muc = lambda b, ma: next((c.get("muc") for c in b["chuong"] if c["ma"] == ma), None)  # noqa: E731
    dong = {d["ma"]: d for d in bc["ma_tran"]["dong"]}
    assert dong["cong_viec"]["muc"]["tuvi"] == muc(tv, "su_nghiep")
    assert dong["tien_bac"]["muc"]["battu"] == muc(bt, "tien_bac")
    assert dong["tinh_cam"]["muc"]["nhantuong"] == muc(n, "tinh_cam_gia_dinh")
    assert dong["suc_khoe"]["muc"]["tuvi"] == muc(tv, "suc_khoe")


def test_hop_muon_giu_ma_goc(bc):
    """Hộp mượn của từng môn giữ nguyên mã kiểm chứng gốc (ds.tong_quan…, ds.bt…, ds.nhantuong…) + nguồn; hộp tổng hợp mang
    ds.chan_dung.*. Không mã nào lặp trong cả bài."""
    ma = []
    nguon = set()
    for c in bc["chuong"]:
        for h in c.get("hop", []):
            ma.append(h["ma_mau"]); nguon.add(h["nguon"])
    assert len(ma) == len(set(ma)), [m for m in ma if ma.count(m) > 1]
    assert any(m.startswith("ds.bt.") for m in ma) and any(m.startswith("ds.nhantuong.") for m in ma)
    assert any(m.startswith("ds.chan_dung.") for m in ma)
    assert any(m.startswith("ds.") and not m.startswith(("ds.bt.", "ds.nhantuong.", "ds.chan_dung.")) for m in ma)   # Tử vi
    assert {"tuvi", "battu", "nhantuong", "ba_mon"} <= nguon


def test_chuong_dau_mien_phi_du_dung_mot_minh(bc):
    """Chương 1 = ma trận + điều ba cách cùng thấy: đủ để người đọc hiểu mà không cần chương sau; `cot_loi` chỉ trỏ chương 1."""
    c1 = bc["chuong"][0]
    assert c1["ma"] == "tong_quan" and c1["hop"]
    assert all(h["tu_chuong"] == "tong_quan" for h in bc["cot_loi"])
    assert "cách" in " ".join(c1["doan"])


def test_nang_luong_tu_nhan_tuong_va_bat_tu(bc):
    c = next(c for c in bc["chuong"] if c["ma"] == "nang_luong")
    assert c["hop"] and all(h["nguon"] == "nhantuong" for h in c["hop"])
    assert any("Cách 1" in h["tieu_de"] for h in c["hop"]) and any("Cách 2" in h["tieu_de"] for h in c["hop"])


def test_nam_nay_nhat_quan(bc):
    c = next(c for c in bc["chuong"] if c["ma"] == "nam_nay")
    assert c["hop"]
    assert any(h["nguon"] == "hai_la_so" for h in c["hop"])          # EN-2 nhat_quan: Tử vi ↔ Bát tự cùng/khác mức năm


def test_khong_nhan_tuong_van_tong_hop_hai_mon():
    bc = cd.lap(TV, BT, {}, XEM)
    assert "nhan_tuong" in bc["thieu"]
    for d in bc["ma_tran"]["dong"]:
        assert d["muc"]["nhantuong"] is None and d["dong_thuan"] in ("cung", "khac")
    c = next(c for c in bc["chuong"] if c["ma"] == "nang_luong")
    assert c.get("thieu") and not any(h["nguon"] == "nhantuong" for h in c["hop"])
    assert kh.kiem_giong_van(bc) == []


def test_khong_diem_so_khong_tu_doa(bc):
    import re
    for s in kh.lop_doi_thuong(bc):
        t = s.lower()
        for c in CAM:
            assert not re.search(rf"(?<!\w){re.escape(c)}(?!\w)", t), (c, s[:100])


def test_loi_khuyen_tu_mang_can_luu_y(bc):
    c = next(c for c in bc["chuong"] if c["ma"] == "loi_khuyen")
    assert 1 <= len(c["hop"]) <= cd.TOI_DA_LOI_KHUYEN and all(h["loai"] == "loi_khuyen" for h in c["hop"])


@pytest.mark.parametrize("i", [0, 7, 19, 33, 48])
def test_nhieu_la_so_khong_loi(i, tl_day):
    ca = _G[i]
    tv = {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}
    gio = max(0, ca["ti"] * 2 - 1)
    bt = {"lich": dt.datetime.combine(tv["ngay"], dt.time(min(gio, 23), 30)), "gioi_tinh": ca["gioi_tinh"], "gio_ty": "da_ty"}
    bc = cd.lap(tv, bt, tl_day if i % 2 else {}, XEM)
    assert len(bc["chuong"]) == len(cd.THU_TU_CHUONG) and kh.kiem_giong_van(bc) == []


def test_ap_hoc_ha_hop(bc, tl_day):
    h = next(h for c in bc["chuong"] for h in c.get("hop", []) if h["ma_mau"].startswith("ds.chan_dung."))
    bc2 = cd.lap(TV, BT, tl_day, XEM, trong_so={h["ma_mau"]: {"dung": 30, "chua_dung": 90}})
    h2 = next((x for c in bc2["chuong"] for x in c.get("hop", []) if x["ma_mau"] == h["ma_mau"]), None)
    assert h2 is None or h2.get("dang_xem_lai")


# ------------------------------------------------------------------ API
LA_SO = {"birth_date": "1988-10-24", "birth_time": "08:30", "gender": "nam", "noi_sinh": "ha-noi"}


def test_api(tl_day):
    r = client.post("/v1/chan-dung", json={"la_so": LA_SO, "tra_loi": tl_day})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["mo_dun"] == "chan_dung" and d["ma_tran"]["dong"] and d["thieu"] == []
    assert all("moi_xem" in c for c in d["chuong"])
    assert client.post("/v1/chan-dung", json={"tra_loi": tl_day}).status_code == 422            # bắt buộc lá số
    r2 = client.post("/v1/chan-dung", json={"la_so": LA_SO})
    assert r2.status_code == 200 and "nhan_tuong" in r2.json()["thieu"]
    assert client.post("/v1/chan-dung", json={"la_so": LA_SO, "tra_loi": {"x": "<b>"}}).status_code == 422
