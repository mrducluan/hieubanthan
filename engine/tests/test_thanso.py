# -*- coding: utf-8 -*-
"""Bản port phải khớp TUYỆT ĐỐI với script gốc.

Golden sinh từ `C:/Users/mrduc/thanso-hoc/thanso.py` qua
`fixtures/_generate_thanso_golden.py`. Test này thất bại nghĩa là bản port
đã lệch khỏi bản gốc — sửa bản port, không sửa golden.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.calc import thanso

GOLDEN = json.loads(
    (Path(__file__).parents[1] / "fixtures" / "golden_thanso.json").read_text("utf-8")
)


def ids(section: str) -> list[str]:
    return sorted(GOLDEN[section])


# --------------------------------------------------------------------------- #
# Hàm nền
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize("case_id", ids("chi_so_don"))
def test_bo_dau_khop_goc(case_id: str) -> None:
    case = GOLDEN["chi_so_don"][case_id]
    assert thanso.bo_dau(case["input"]["ten"], True) == case["expect"]["bo_dau"]


def test_bo_dau_xu_ly_chu_D_rieng() -> None:
    """Đ không phải D + dấu, phải xử lý riêng — dễ sai nhất khi port."""
    assert thanso.bo_dau("Đức", True) == "Duc"
    assert thanso.bo_dau("Đức", False) == "uc"


def test_gia_tri_chu_cai() -> None:
    assert thanso.gia_tri("A") == 1
    assert thanso.gia_tri("I") == 9
    assert thanso.gia_tri("J") == 1
    assert thanso.gia_tri("Z") == 8
    assert thanso.gia_tri("5") == 0          # không phải chữ cái
    assert thanso.gia_tri("ê") == 0          # không ASCII


def test_rut_gon_giu_so_cai() -> None:
    assert thanso.rut_gon(11, giu_master=True) == 11
    assert thanso.rut_gon(11, giu_master=False) == 2
    assert thanso.rut_gon(22, giu_master=True) == 22
    assert thanso.rut_gon(39, giu_master=True) == 3


# --------------------------------------------------------------------------- #
# Chỉ số, quy ước đã chốt
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize("case_id", ids("chi_so_don"))
def test_chi_so_don_khop_goc(case_id: str) -> None:
    case = GOLDEN["chi_so_don"][case_id]
    i, e = case["input"], case["expect"]
    for che_do in ("su_menh", "linh_hon", "nhan_cach"):
        assert thanso.chi_so_ten(
            i["ten"], che_do, i["d_thanh_d"], i["y_la_nguyen_am"], i["giu_master"]
        ) == e[che_do], f"{case_id}/{che_do}"

    assert thanso.duong_doi(i["d"], i["m"], i["y"], "tong_het", True) == e["duong_doi_tong_het"]
    assert thanso.duong_doi(i["d"], i["m"], i["y"], "tung_phan", True) == e["duong_doi_tung_phan"]


# --------------------------------------------------------------------------- #
# Độ nhạy — điểm khác biệt của script gốc, không được đánh mất khi port
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize("case_id", ids("do_nhay"))
def test_do_nhay_khop_goc(case_id: str) -> None:
    case = GOLDEN["do_nhay"][case_id]
    i = case["input"]
    got = thanso.do_nhay(i["ten"], i["d"], i["m"], i["y"])
    assert got == case["expect"], case_id


def test_do_nhay_luon_tra_danh_sach_da_sap_xep() -> None:
    got = thanso.do_nhay(["Nguyen Van A"], 1, 1, 1990)
    for key, values in got.items():
        assert values == sorted(values), key
        assert len(values) == len(set(values)), key


# --------------------------------------------------------------------------- #
# Chu kỳ
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize("case_id", ids("chu_ky"))
def test_chu_ky_khop_goc(case_id: str) -> None:
    case = GOLDEN["chu_ky"][case_id]
    i, e = case["input"], case["expect"]

    dd = thanso.duong_doi(i["d"], i["m"], i["y"])
    assert dd == e["duong_doi"]
    assert thanso.dinh_cao(i["d"], i["m"], i["y"], dd) == e["dinh_cao"]
    assert thanso.thu_thach(i["d"], i["m"], i["y"]) == e["thu_thach"]
    assert thanso.chu_ky_9_nam(i["d"], i["m"], i["y"], i["tu"], i["den"]) == e["bang_nam_ca_nhan"]


def test_nam_ca_nhan_hai_moc_luon_lech_dau_nam() -> None:
    """Bất biến mà tác giả gốc ghi rõ trong docstring: hai quy ước mốc không
    bao giờ trùng ở quãng đầu năm. Nếu test này hỏng, logic đã sai."""
    truoc, tu_sn = thanso.nam_ca_nhan(2, 12, 2025, "sinh_nhat")
    assert truoc != tu_sn


def test_nam_ca_nhan_tu_choi_moc_la() -> None:
    with pytest.raises(ValueError):
        thanso.nam_ca_nhan(1, 1, 2025, "moc_khong_ton_tai")


# --------------------------------------------------------------------------- #
# Tính tất định — yêu cầu của tầng CALC
# --------------------------------------------------------------------------- #
def test_deterministic() -> None:
    a = thanso.do_nhay(["Nguyễn Đức Luân"], 2, 12, 1988)
    b = thanso.do_nhay(["Nguyễn Đức Luân"], 2, 12, 1988)
    assert a == b
