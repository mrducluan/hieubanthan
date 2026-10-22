# -*- coding: utf-8 -*-
"""CTA-1 — khối "Đọc tiếp về bạn" cuối phần xem (`luangiai/goi_y_cheo.py`, route `/v1/goi-y-cheo`) và dữ liệu thẻ
"Bản đồ 5 mảng" (`/v1/ban-do-5-mang`). Viết TRƯỚC hàm.

Hợp đồng: mỗi mảng KHÁC trang đang xem một thẻ (luận giải nhỏ 1–2 câu + câu hỏi mở + nhãn CTA + đường dẫn); chỉ ĐỌC
hàm tính/KB có sẵn; thiếu giờ / giới tính → mời nhập đúng thứ thiếu; không lặp câu giữa trang và giữa hai hồ sơ khác
hẳn; câu chính không thuật ngữ, không cụm cấm, không doạ; tất định theo ngày xem.
"""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.kb import tuvi_doi_song_kb as kb_tv
from app.luangiai import goi_y_cheo as gy
from app.main import app

XEM = dt.date(2026, 10, 21)
A = gy.HoSo(ngay=17, thang=5, nam=1990, gio="12:30", gioi_tinh="nam", ho_ten=["Nguyễn Đức Luân"], noi_sinh="ha-noi")
B = gy.HoSo(ngay=3, thang=11, nam=1984, gio="06:10", gioi_tinh="nu", ho_ten=["Trần Thị Mai"], noi_sinh="tp-ho-chi-minh")
THIEU = gy.HoSo(ngay=24, thang=10, nam=1988)                       # chỉ có ngày sinh
CA_NHAN = ["than_so", "tu_vi", "bat_tu", "phong_thuy", "hop_doi", "hom_nay"]
# Thuật ngữ không được nằm trong câu chính (chỉ ở nhãn `nhan`).
THUAT_NGU = re.compile(
    r"nhật chủ|dụng thần|thập thần|chính tinh|cung Mệnh|cung phi|Miếu|Hãm|(?<!\w)[Hh]oá (?:Lộc|Quyền|Khoa|Kỵ)|hào động|"
    r"Sinh Khí|Diên Niên|Thiên Y|Phục Vị|can chi|Đông tứ|Tây tứ|tam phương|hoàng đạo|hắc đạo|Lập xuân|"
    r"Tử Vi(?! Đẩu)|Thiên Cơ|Thái Dương|Vũ Khúc|Thiên Đồng|Liêm Trinh|Thiên Phủ|Thái Âm|Tham Lang|Cự Môn|Thiên Tướng|"
    r"Thiên Lương|Thất Sát|Phá Quân")
DOA = ["chắc chắn", "định mệnh", "số phận", "tai hoạ", "tai họa", "xui xẻo", "đại hạn xấu", "khắc", "phá sản",
       "ly hôn", "chết", "tai nạn", "hạn nặng", "giải hạn", "chỉ còn"]
TRUONG = {"mang", "ten", "bieu_tuong", "nhan", "cau", "cau_hoi", "cta", "duong", "ca_nhan", "can_them",
          "source_id", "school_id", "trang_thai"}


def _chu(the: dict) -> list[str]:
    return [the["cau"], the["cau_hoi"], the["cta"]]


# ------------------------------------------------------------------ hợp đồng
@pytest.mark.parametrize("trang", gy.MANG_TRANG)
def test_du_mang_tru_trang_dang_xem(trang):
    kq = gy.goi_y(A, trang, XEM)
    ma = [t["mang"] for t in kq["the"]]
    assert trang not in ma
    assert set(ma) == set(gy.THE) - {trang}
    assert len(ma) == len(set(ma))
    for t in kq["the"]:
        assert TRUONG <= set(t), set(TRUONG) - set(t)
        assert t["duong"].startswith("/") and "//" not in t["duong"]
        assert t["cau"] and t["cau_hoi"].endswith("?"), t
        assert t["source_id"] and t["school_id"] and t["trang_thai"] == "nhap_ai"
    assert kq["ca_nhan"] is True


def test_mang_la_bi_tu_choi():
    with pytest.raises(ValueError):
        gy.goi_y(A, "khong_co", XEM)


def test_ca_nhan_hoa_du_lieu_that():
    t = {x["mang"]: x for x in gy.goi_y(A, "kinh_dich", XEM)["the"]}
    assert t["than_so"]["nhan"] == "Đường đời 5" and t["than_so"]["ca_nhan"]
    assert "Cự Môn" in t["tu_vi"]["nhan"] and t["tu_vi"]["ca_nhan"] and t["tu_vi"]["can_them"] is None
    assert t["bat_tu"]["nhan"].startswith("Nhật chủ ")
    assert "Khảm" in t["phong_thuy"]["nhan"] and "Đông Nam" in t["phong_thuy"]["cau"]
    assert t["hom_nay"]["nhan"].startswith("Ngày cá nhân ")
    assert all(t[m]["ca_nhan"] for m in CA_NHAN)


def test_thieu_gio_va_gioi_tinh_moi_nhap_dung_thu_thieu():
    t = {x["mang"]: x for x in gy.goi_y(THIEU, "than_so", XEM)["the"]}
    assert t["tu_vi"]["can_them"] == "gio" and not t["tu_vi"]["ca_nhan"]
    assert t["phong_thuy"]["can_them"] == "gioi_tinh" and not t["phong_thuy"]["ca_nhan"]
    # Bát tự vẫn có hình ảnh ngày sinh (không cần giờ), chỉ thiếu phần sức tự thân.
    assert t["bat_tu"]["ca_nhan"] and t["bat_tu"]["can_them"] == "gio"
    assert "giờ sinh" in t["bat_tu"]["cau"]


def test_sinh_truoc_1975_thieu_noi_sinh():
    h = gy.HoSo(ngay=2, thang=3, nam=1970, gio="08:00", gioi_tinh="nam")
    t = {x["mang"]: x for x in gy.goi_y(h, "than_so", XEM)["the"]}
    assert t["tu_vi"]["can_them"] == "noi_sinh"


def test_khong_ho_so_ra_cau_chung():
    kq = gy.goi_y(None, "tu_vi", XEM)
    assert kq["ca_nhan"] is False
    for t in kq["the"]:
        assert t["ca_nhan"] is False and t["cau"] and t["cau_hoi"].endswith("?")


def test_quy_uoc_duong_doi():
    h = gy.HoSo(ngay=24, thang=10, nam=1988)
    a = {x["mang"]: x for x in gy.goi_y(h, "tu_vi", XEM)["the"]}["than_so"]
    b = {x["mang"]: x for x in gy.goi_y(gy.HoSo(ngay=24, thang=10, nam=1988, quy_uoc="tung_phan"), "tu_vi", XEM)["the"]}["than_so"]
    assert a["nhan"] == "Đường đời 33" and b["nhan"] == "Đường đời 6"


# ------------------------------------------------------------------ không lặp
def test_khong_lap_cau_giua_cac_trang():
    """Cùng hồ sơ, cùng ngày: thẻ của một mảng không lặp đúng câu ở hai trang khác nhau."""
    for m in gy.THE:
        van = [next(x for x in gy.goi_y(A, p, XEM)["the"] if x["mang"] == m) for p in gy.MANG_TRANG if p != m]
        cau = [(x["cau"], x["cau_hoi"]) for x in van]
        assert len(set(cau)) == len(cau), m


def test_khong_lap_cau_giua_hai_ho_so_khac_han():
    for p in gy.MANG_TRANG:
        ta = {x["mang"]: x["cau"] for x in gy.goi_y(A, p, XEM)["the"]}
        tb = {x["mang"]: x["cau"] for x in gy.goi_y(B, p, XEM)["the"]}
        for m in CA_NHAN:
            if m in ta:
                assert ta[m] != tb[m], (p, m)


def test_xoay_thu_tu_theo_ngay_tat_dinh():
    a1 = [x["mang"] for x in gy.goi_y(A, "tu_vi", XEM)["the"]]
    a2 = [x["mang"] for x in gy.goi_y(A, "tu_vi", XEM)["the"]]
    hom_sau = [x["mang"] for x in gy.goi_y(A, "tu_vi", XEM + dt.timedelta(days=1))["the"]]
    assert a1 == a2
    assert a1[:3] != hom_sau[:3]


# ------------------------------------------------------------------ lời văn
def _nhieu_ho_so():
    for i in range(60):
        nam = 1950 + (i * 7) % 60
        yield gy.HoSo(ngay=1 + (i * 11) % 28, thang=1 + (i * 5) % 12, nam=nam,
                      gio=f"{(i * 5) % 24:02d}:{(i * 13) % 60:02d}", gioi_tinh="nam" if i % 2 else "nu",
                      noi_sinh="ha-noi" if i % 3 else "tp-ho-chi-minh")


def test_khong_thuat_ngu_khong_cum_cam_khong_doa():
    cum = kb_tv.cum_cam()
    chung = [c.lower() for c in kb_tv.cum_chung_chung()]
    for h in [A, B, THIEU, None, *_nhieu_ho_so()]:
        for p in ("than_so", "tu_vi", "hom_nay"):
            for t in gy.goi_y(h, p, XEM)["the"]:
                assert not THUAT_NGU.search(t["cau"]), t["cau"]
                for s in _chu(t):
                    assert not kb_tv.tim_cum_cam(s, cum), (kb_tv.tim_cum_cam(s, cum), s)
                    assert not kb_tv.tim_cum_cam(s, DOA), s
                    assert not any(c in s.lower() for c in chung), s
                assert len(t["cau"]) <= 260, t["cau"]


def test_kb_co_nguon_va_phai():
    d = json.loads((Path(gy.__file__).parents[1] / "kb" / "data" / "goi_y_cheo_kb.json").read_text("utf-8"))
    assert d["trang_thai"] == "nhap_ai" and d["source_id"] and d["school_id"]
    for ma in gy.THE:
        m = d["mang"][ma]
        assert m["source_id"] and m["school_id"], ma
        assert len(m["mo_dau"]) >= 3 and len(set(m["mo_dau"])) == len(m["mo_dau"]), ma
        assert len(m["cau_hoi"]) >= 3 and len(set(m["cau_hoi"])) == len(m["cau_hoi"]), ma
        assert all(c.endswith("?") for c in m["cau_hoi"]), ma


# ------------------------------------------------------------------ Bản đồ 5 mảng
def test_ban_do_du_5_manh_khong_ngay_sinh():
    bd = gy.ban_do_5_mang(A, XEM)
    assert bd["duong_doi"]["so"] == 5 and bd["duong_doi"]["tu_khoa"]
    assert bd["nhat_chu"]["nhan"] and bd["nhat_chu"]["hinh_tuong"]
    assert bd["sao_menh"]["nhan"] == "Cự Môn"
    assert bd["cung_phi"]["quai"] == "Khảm" and bd["cung_phi"]["huong"] == "Đông Nam"
    assert bd["que_ngay"]["ten"]
    van = json.dumps(bd, ensure_ascii=False)
    for s in ("1990", "17/05", "05-17", "Canh Ngọ", "12:30"):
        assert s not in van, s
    d = bd["doan"]
    assert len(d["lua_chon"]) == 3 and len(set(d["lua_chon"])) == 3 and d["dung"] in d["lua_chon"]
    assert d["dung"] == 5
    assert gy.ban_do_5_mang(A, XEM) == bd                      # tất định


def test_ban_do_thieu_gio_gioi_tinh():
    bd = gy.ban_do_5_mang(THIEU, XEM)
    assert bd["sao_menh"] is None and bd["cung_phi"] is None
    assert bd["duong_doi"]["so"] == 33 and bd["nhat_chu"]["nhan"]
    assert bd["so_manh"] == 3


def test_doan_lua_chon_moi_so():
    for so in [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]:
        ds = gy.lua_chon_doan(so)
        assert len(ds) == 3 and len(set(ds)) == 3 and so in ds
        assert all(1 <= x <= 33 for x in ds)


# ------------------------------------------------------------------ API
def test_api_goi_y_cheo():
    c = TestClient(app)
    r = c.post("/v1/goi-y-cheo", json={"mang_hien_tai": "tu_vi", "ngay": 17, "thang": 5, "nam": 1990, "gio": "12:30",
                                       "gioi_tinh": "nam", "noi_sinh": "ha-noi", "ho_ten": ["Nguyễn Đức Luân"],
                                       "quy_uoc_duong_doi": "tung_phan", "ngay_xem": "2026-10-21"})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["engine_version"] and len(j["the"]) == len(gy.THE) - 1
    assert c.post("/v1/goi-y-cheo", json={"mang_hien_tai": "tu_vi"}).status_code == 200      # chưa có hồ sơ → câu chung
    assert c.post("/v1/goi-y-cheo", json={"mang_hien_tai": "la"}).status_code == 422
    assert c.post("/v1/goi-y-cheo", json={"mang_hien_tai": "tu_vi", "ngay": 31, "thang": 2, "nam": 1990}).status_code == 422
    assert c.post("/v1/goi-y-cheo", json={"mang_hien_tai": "tu_vi", "ngay": 1, "thang": 2, "nam": 1990,
                                          "gio": "25:00"}).status_code == 422


def test_api_ban_do():
    c = TestClient(app)
    r = c.post("/v1/ban-do-5-mang", json={"ngay": 17, "thang": 5, "nam": 1990, "gio": "12:30", "gioi_tinh": "nam",
                                         "noi_sinh": "ha-noi", "ngay_xem": "2026-10-21"})
    assert r.status_code == 200, r.text
    assert r.json()["sao_menh"]["nhan"] == "Cự Môn"
    assert c.post("/v1/ban-do-5-mang", json={"thang": 5, "nam": 1990}).status_code == 422
