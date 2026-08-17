# -*- coding: utf-8 -*-
"""Tầng luận giải thần số — khoá ba nguyên tắc bất di bất dịch.

Nếu một test ở đây đỏ, tức pipeline đã vi phạm chính triết lý "Cách B" mà dự án
chọn: chỉ ghép từ nguồn, luôn chống Barnum, không luận bừa chỉ số chưa xác định.
"""
from __future__ import annotations

from app.kb import store
from app.luangiai import thanso as lg


# --------------------------------------------------------------------------- #
# Nguyên tắc 1 — chỉ dùng nội dung từ KB, không bịa
# --------------------------------------------------------------------------- #
def test_moi_nghia_deu_truy_ve_nguon() -> None:
    kq = lg.luan_giai(["Nguyen Duc Luan"], 2, 12, 1988)
    co_nghia = False
    for vt in kq["cac_vi_tri"]:
        for n in vt["nghia"]:
            co_nghia = True
            assert n["trich_nguon"], f"nghia thieu trich_nguon: {vt['vi_tri']}"
    assert co_nghia, "phai co it nhat mot nghia"


def test_kb_khong_co_thi_im_lang() -> None:
    """Giá trị không nằm trong KB (vd 7 nếu bị xoá) → không có nghĩa, không bịa."""
    assert store.nghia_so(99) is None


# --------------------------------------------------------------------------- #
# Nguyên tắc 2 — chống Barnum: mọi nghĩa BẮT BUỘC có mặt tối + phản chứng
# --------------------------------------------------------------------------- #
def test_moi_nghia_co_mat_toi_va_phan_chung() -> None:
    kq = lg.luan_giai(["Tran Thi Mai"], 15, 7, 1995)
    for vt in kq["cac_vi_tri"]:
        for n in vt["nghia"]:
            assert n["mat_toi"].strip(), f"{vt['vi_tri']}/{n['gia_tri']} thieu mat_toi"
            assert n["phan_chung"].strip(), f"{vt['vi_tri']}/{n['gia_tri']} thieu phan_chung"


def test_toan_bo_KB_khong_co_nghia_nao_thieu_mat_toi() -> None:
    for gt in (1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33):
        m = store.nghia_so(gt)
        assert m is not None, f"KB thieu so {gt}"
        assert m["mat_toi"].strip()
        assert m["phan_chung"].strip()


# --------------------------------------------------------------------------- #
# Nguyên tắc 3 — chỉ số chưa xác định phải nói thẳng, không luận bừa
# --------------------------------------------------------------------------- #
def test_chi_so_khong_on_dinh_bi_gan_canh_bao() -> None:
    # "Nguyễn Đức Luân" có linh_hon ra 3 giá trị (4,6,22) — phải bị đánh dấu.
    kq = lg.luan_giai(["Nguyen Duc Luan", "Nguyễn Đức Luân"], 2, 12, 1988)
    linh_hon = next(v for v in kq["cac_vi_tri"] if v["vi_tri"] == "linh_hon")
    assert linh_hon["on_dinh"] is False
    assert "canh_bao" in linh_hon
    assert "CHƯA xác định" in linh_hon["canh_bao"]


def test_chi_so_on_dinh_khong_co_canh_bao_khong_xac_dinh() -> None:
    kq = lg.luan_giai(["Nguyen Duc Luan"], 2, 12, 1988)
    duong_doi = next(v for v in kq["cac_vi_tri"] if v["vi_tri"] == "duong_doi")
    # duong_doi luôn ổn định (chỉ phụ thuộc ngày sinh, không phụ thuộc tên)
    assert duong_doi["on_dinh"] is True
    assert "canh_bao" not in duong_doi


def test_so_cai_duoc_danh_dau() -> None:
    m = store.nghia_so(22)
    assert m is not None and m["so_cai"] is True
    m9 = store.nghia_so(9)
    assert m9 is not None and m9["so_cai"] is False


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
    assert "phản chứng" in kq["cach_doc"].lower() or "phan chung" in kq["cach_doc"].lower()
