# -*- coding: utf-8 -*-
"""Tầng luận giải thần số — khoá các nguyên tắc bất di bất dịch.

Cấu trúc mới (2026-08-15): mỗi vị trí có MỘT giá trị chính thức (quy tắc Y khoá)
kèm nghĩa có nguồn; độ nhạy là ghi chú, không đổi kết quả chính.
"""
from __future__ import annotations

from app.kb import store
from app.luangiai import thanso as lg


# --------------------------------------------------------------------------- #
# Kết quả chính thức đúng theo quy tắc Y khoá
# --------------------------------------------------------------------------- #
def test_ket_qua_chinh_thuc_nguyen_duc_luan() -> None:
    kq = lg.luan_giai(["Nguyễn Đức Luân"], 24, 10, 1988)
    val = {v["vi_tri"]: v["gia_tri"] for v in kq["cac_vi_tri"]}
    assert val == {"duong_doi": 33, "su_menh": 9, "linh_hon": 6, "nhan_cach": 3}


def test_ten_chinh_la_bien_the_dau() -> None:
    kq = lg.luan_giai(["Nguyễn Đức Luân", "Nguyen Duc Luan"], 24, 10, 1988)
    assert kq["ten_chinh"] == "Nguyễn Đức Luân"


# --------------------------------------------------------------------------- #
# Nguyên tắc 1 — chỉ dùng nội dung từ KB, không bịa
# --------------------------------------------------------------------------- #
def test_moi_nghia_truy_ve_nguon() -> None:
    kq = lg.luan_giai(["Nguyễn Đức Luân"], 24, 10, 1988)
    for vt in kq["cac_vi_tri"]:
        assert vt["nghia"] is not None, vt["vi_tri"]
        assert vt["nghia"]["trich_nguon"]


def test_kb_khong_co_thi_im_lang() -> None:
    assert store.nghia_so(99) is None


# --------------------------------------------------------------------------- #
# Nguyên tắc 2 — chống Barnum: mọi nghĩa BẮT BUỘC có mặt tối + phản chứng
# --------------------------------------------------------------------------- #
def test_moi_nghia_co_mat_toi_va_phan_chung() -> None:
    kq = lg.luan_giai(["Trần Thị Mai"], 15, 7, 1995)
    for vt in kq["cac_vi_tri"]:
        n = vt["nghia"]
        assert n is not None
        assert n["mat_toi"].strip(), vt["vi_tri"]
        assert n["phan_chung"].strip(), vt["vi_tri"]


def test_toan_bo_KB_khong_thieu_mat_toi() -> None:
    for gt in (1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33):
        m = store.nghia_so(gt)
        assert m is not None and m["mat_toi"].strip() and m["phan_chung"].strip()


# --------------------------------------------------------------------------- #
# Nguyên tắc 3 — độ nhạy là GHI CHÚ, không làm lung lay kết quả chính
# --------------------------------------------------------------------------- #
def test_chi_so_nhay_co_ghi_chu_nhung_van_co_gia_tri_chinh() -> None:
    kq = lg.luan_giai(["Nguyễn Đức Luân", "Nguyen Duc Luan"], 24, 10, 1988)
    for vt in kq["cac_vi_tri"]:
        # Luôn có một giá trị chính thức, dù nhạy hay không
        assert isinstance(vt["gia_tri"], int)
        if not vt["on_dinh"]:
            assert "ghi_chu_do_nhay" in vt
            assert vt["gia_tri_khac"]  # có giá trị khác dưới quy ước khác


def test_duong_doi_luon_on_dinh() -> None:
    """Đường đời chỉ phụ thuộc ngày sinh → không nhạy với cách viết tên."""
    kq = lg.luan_giai(["Nguyễn Đức Luân"], 24, 10, 1988)
    dd = next(v for v in kq["cac_vi_tri"] if v["vi_tri"] == "duong_doi")
    assert dd["on_dinh"] is True
    assert "ghi_chu_do_nhay" not in dd


def test_so_cai_duoc_danh_dau() -> None:
    kq = lg.luan_giai(["Nguyễn Đức Luân"], 24, 10, 1988)
    dd = next(v for v in kq["cac_vi_tri"] if v["vi_tri"] == "duong_doi")
    assert dd["gia_tri"] == 33
    assert dd["nghia"]["so_cai"] is True


# --------------------------------------------------------------------------- #
# Cấu trúc đầu ra
# --------------------------------------------------------------------------- #
def test_du_4_vi_tri_dung_thu_tu() -> None:
    kq = lg.luan_giai(["An"], 1, 1, 2000)
    assert [v["vi_tri"] for v in kq["cac_vi_tri"]] == \
        ["duong_doi", "su_menh", "linh_hon", "nhan_cach"]


def test_co_trich_nguon_chung_va_cach_doc() -> None:
    kq = lg.luan_giai(["An"], 1, 1, 2000)
    assert "Balliett" in kq["trich_nguon_chung"]
    assert "phản chứng" in kq["cach_doc"].lower()


def test_mo_rong_co_bieu_do_va_chi_so_phu():
    import datetime as _d
    from app.luangiai import thanso as _lg
    mr_ = _lg.luan_mo_rong("Nguyễn Đức Luân", 24, 10, 1988, _d.date(2026, 9, 30))
    assert mr_["bieu_do"]["luoi"] == [[0, 0, 1], [1, 0, 2], [2, 1, 0]]
    assert [m["ma"] for m in mr_["bieu_do"]["mui_ten"]] == ["3-5-7"]
    assert mr_["bieu_do"]["mui_ten"][0]["ten"].startswith("Mũi tên trống")
    assert mr_["so_thai_do"]["so"] == 7 and mr_["so_thai_do"]["nghia"]
    assert mr_["thang_ca_nhan"]["so"] == 8
    assert [b["so"] for b in mr_["bai_hoc_nghiep"]] == [2, 6, 8, 9]
