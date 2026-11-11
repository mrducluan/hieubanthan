# -*- coding: utf-8 -*-
"""EN-ALL GĐ 4 — hỏi đáp Tử vi bản Anh: các lỗi thử UX đã sửa (mỗi câu khoá một lỗi)."""
from __future__ import annotations

import datetime as dt

import pytest

from app import ngon_ngu
from app.hoidap import tuvi

SINH = {"ngay": dt.date(1990, 5, 17), "ti": 4, "gioi_tinh": "nam"}
XEM = dt.date(2026, 11, 10)


def _hoi(cau: str, nn: str = "en", **kw) -> dict:
    with ngon_ngu.dung(nn):
        return tuvi.tra_loi(cau, sinh=dict(SINH), ngay_xem=XEM, **kw)


def test_khong_lap_your():
    with ngon_ngu.dung("en"):
        for q in ("what does my children palace say", "what about my love life", "what does my wealth palace say"):
            assert "your your" not in tuvi.tra_loi(q, sinh=dict(SINH), ngay_xem=XEM)["cau_tra_loi"].lower(), q


def test_do_sang_sao_tren_la_so():
    kq = _hoi("Is Tai Yin fallen in my chart?")
    assert kq["phan_loai"]["loai"] == "vi_tri_sao" and "brightness" in kq["cau_tra_loi"]


def test_hoa_o_cung_la_nghia_kb():
    kq = _hoi("What does Hua Ji in my Wealth Palace mean")
    assert kq["phan_loai"]["loai"] == "tu_hoa_cung" and kq["phan_loai"]["cung"] == ["Tài Bạch"]
    assert kq["cau_tra_loi"].startswith("Hua Ji")


def test_cau_chu_han():
    kq = _hoi("流年2027财运如何?")
    assert kq["phan_loai"]["cung"] == ["Tài Bạch"] and "2027" in kq["cau_tra_loi"]


@pytest.mark.parametrize("cau", ["con trai toi thi chuyen cap, bo me nen lam gi?", "Sát Phá Tham là cách cục như thế nào?",
                                 "mk có số giàu ko hay cả đời làm thuê ạ"])
def test_cau_tieng_viet_o_ban_anh_phan_loai_nhu_ban_viet(cau):
    with ngon_ngu.dung("vi"):
        vi = tuvi.phan_loai(cau)
    with ngon_ngu.dung("en"):
        en = tuvi.phan_loai(cau)
    assert {k: vi[k] for k in ("loai", "cung", "xu_ly", "y_dinh")} == {k: en[k] for k in ("loai", "cung", "xu_ly", "y_dinh")}


def test_lop_han_chieu_nhe():
    from app.kb.loi import bang
    assert "light eye" in bang("en")["hoi.tv.cth.ky_chieu"]


def test_la_so_nguoi_than_ngoi_thu_ba():
    kq = _hoi("what about my career next year", nguoi_than=True)
    assert kq["cau_tra_loi"].startswith("This is the chart of the family member you are viewing")
    assert all("Your" not in t["tieu_de"] for t in kq["truc_quan"][:2])
    vi = _hoi("công việc năm sau thế nào", "vi", nguoi_than=True)
    assert vi["cau_tra_loi"].startswith("Đây là lá số của người thân")
    assert not _hoi("công việc năm sau thế nào", "vi")["cau_tra_loi"].startswith("Đây là lá số của người thân")
