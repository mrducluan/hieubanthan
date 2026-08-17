# -*- coding: utf-8 -*-
"""Chiều sâu thần số — đỉnh cao, thử thách, năm cá nhân.

Phép tính từ engine (tất định), nghĩa từ KB chiều sâu (có nguồn). Khoá: mọi
giá trị engine sinh ra đều có nghĩa trong KB (không để lỗ hổng im lặng ngoài
ý muốn), và cấu trúc đúng.
"""
from __future__ import annotations

from app.kb import store
from app.luangiai import thanso as lg


def test_dinh_cao_du_4_giai_doan_co_nghia() -> None:
    cs = lg.luan_chieu_sau(24, 10, 1988, nam_moc=2026)
    assert len(cs["dinh_cao"]) == 4
    for p in cs["dinh_cao"]:
        assert "so" in p and "tu_tuoi" in p
        assert p["nghia"] is not None, f"KB thiếu nghĩa đỉnh cao {p['so']}"
        assert p["nghia"]["chu_de"] and p["nghia"]["bong_toi"]


def test_thu_thach_chinh_co_nghia() -> None:
    cs = lg.luan_chieu_sau(24, 10, 1988, nam_moc=2026)
    tc = cs["thu_thach_chinh"]
    assert tc["nghia"] is not None
    assert tc["nghia"]["cach_vuot"]


def test_nam_ca_nhan_du_bao_3_nam() -> None:
    cs = lg.luan_chieu_sau(24, 10, 1988, nam_moc=2026)
    assert [n["nam"] for n in cs["nam_ca_nhan"]] == [2026, 2027, 2028]
    for n in cs["nam_ca_nhan"]:
        assert 1 <= n["so"] <= 9
        assert n["nghia"] is not None, f"KB thiếu nghĩa năm cá nhân {n['so']}"
        assert n["nghia"]["nen"] and n["nghia"]["tranh"]


def test_KB_du_nghia_cho_moi_gia_tri_co_the() -> None:
    """Đỉnh cao 1-9,11,22; thử thách 0-8; năm cá nhân 1-9 — KB không được thiếu."""
    for so in (1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22):
        assert store.nghia_dinh_cao(so) is not None, f"thiếu đỉnh cao {so}"
    for so in range(0, 9):
        assert store.nghia_thu_thach(so) is not None, f"thiếu thử thách {so}"
    for so in range(1, 10):
        assert store.nghia_nam_ca_nhan(so) is not None, f"thiếu năm cá nhân {so}"


def test_thu_thach_0_noi_thang_khong_bia() -> None:
    """Thử thách 0 = ô trống — nội dung phải nói thẳng là không mang thông tin."""
    n = store.nghia_thu_thach(0)
    assert n is not None
    assert "ô trống" in n["mo_ta"] or "không" in n["y_nghia"].lower()


def test_chieu_sau_gan_vao_luan_giai() -> None:
    kq = lg.luan_giai(["Nguyễn Đức Luân"], 24, 10, 1988)
    assert "chieu_sau" in kq
    assert len(kq["chieu_sau"]["dinh_cao"]) == 4


def test_deterministic() -> None:
    a = lg.luan_chieu_sau(24, 10, 1988, nam_moc=2026)
    b = lg.luan_chieu_sau(24, 10, 1988, nam_moc=2026)
    assert a == b
