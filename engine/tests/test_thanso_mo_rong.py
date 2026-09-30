# -*- coding: utf-8 -*-
"""Chỉ số thần số mở rộng — test viết TRƯỚC hàm, đáp án tính tay trong golden."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.calc import thanso, thanso_mo_rong as mr

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "thanso_mo_rong.json")
               .read_text(encoding="utf-8"))
CA = G["cac_ca"]


def _ids(cs):
    return [c["ten_ca"] for c in cs]


@pytest.mark.parametrize("c", CA, ids=_ids(CA))
def test_so_ngay_sinh_thai_do_duong_doi(c):
    if "so_ngay_sinh" in c:
        assert mr.so_ngay_sinh(c["ngay"]) == c["so_ngay_sinh"]
    if "so_thai_do" in c:
        assert mr.so_thai_do(c["ngay"], c["thang"]) == c["so_thai_do"]
    assert thanso.duong_doi(c["ngay"], c["thang"], c["nam"]) == c["duong_doi"]


@pytest.mark.parametrize("c", [c for c in CA if "so_truong_thanh" in c],
                         ids=_ids([c for c in CA if "so_truong_thanh" in c]))
def test_truong_thanh(c):
    sm = thanso.gia_tri_xac_dinh(c["ho_ten"], "su_menh")
    assert sm == c["su_menh"]
    assert mr.so_truong_thanh(c["duong_doi"], sm) == c["so_truong_thanh"]


@pytest.mark.parametrize("c", [c for c in CA if "bieu_do" in c],
                         ids=_ids([c for c in CA if "bieu_do" in c]))
def test_bieu_do_ngay_sinh(c):
    bd = mr.bieu_do_ngay_sinh(c["ngay"], c["thang"], c["nam"])
    assert {str(k): v for k, v in bd["dem"].items()} == c["bieu_do"]["dem"]
    assert bd["so_thieu"] == c["bieu_do"]["so_thieu"]
    assert [m["ma"] for m in bd["mui_ten_du"]] == c["bieu_do"]["mui_ten_du"]
    assert [m["ma"] for m in bd["mui_ten_trong"]] == c["bieu_do"]["mui_ten_trong"]


def test_bieu_do_luoi_3x3():
    bd = mr.bieu_do_ngay_sinh(24, 10, 1988)
    # hàng trên 3-6-9, giữa 2-5-8, dưới 1-4-7 — mỗi ô là số lần xuất hiện
    assert bd["luoi"] == [[0, 0, 1], [1, 0, 2], [2, 1, 0]]


@pytest.mark.parametrize("c", [c for c in CA if "no_nghiep" in c],
                         ids=_ids([c for c in CA if "no_nghiep" in c]))
def test_no_nghiep_day_du(c):
    assert mr.no_nghiep(c["ho_ten"], c["ngay"], c["thang"], c["nam"]) == c["no_nghiep"]


@pytest.mark.parametrize("c", [c for c in CA if "no_nghiep_ngay_va_duong_doi" in c],
                         ids=_ids([c for c in CA if "no_nghiep_ngay_va_duong_doi" in c]))
def test_no_nghiep_chi_ngay_sinh(c):
    assert mr.no_nghiep(None, c["ngay"], c["thang"], c["nam"]) == c["no_nghiep_ngay_va_duong_doi"]


@pytest.mark.parametrize("c", [c for c in CA if "bai_hoc_nghiep" in c],
                         ids=_ids([c for c in CA if "bai_hoc_nghiep" in c]))
def test_bai_hoc_nghiep(c):
    assert mr.bai_hoc_nghiep(c["ho_ten"]) == c["bai_hoc_nghiep"]


@pytest.mark.parametrize("c", [c for c in CA if "thang_ca_nhan" in c],
                         ids=_ids([c for c in CA if "thang_ca_nhan" in c]))
def test_thang_ngay_ca_nhan(c):
    for t in c["thang_ca_nhan"]:
        assert mr.thang_ca_nhan(c["ngay"], c["thang"], t["nam"], t["thang"]) == t["so"]
    for t in c["ngay_ca_nhan"]:
        assert mr.ngay_ca_nhan(c["ngay"], c["thang"], t["nam"], t["thang"], t["ngay"]) == t["so"]


@pytest.mark.parametrize("h", G["hop_doi"], ids=[f'{h["a"]}-{h["b"]}' for h in G["hop_doi"]])
def test_cap_so(h):
    assert mr.cap_so(h["a"], h["b"]) == h["cap"]
    assert mr.cap_so(h["b"], h["a"]) == h["cap"]    # không phụ thuộc thứ tự


def test_hop_doi_hai_nguoi():
    kq = mr.hop_doi({"duong_doi": 33, "linh_hon": 6, "nhan_cach": 3},
                    {"duong_doi": 1, "linh_hon": 2, "nhan_cach": 8})
    assert kq == {"duong_doi": "1-6", "linh_hon": "2-6", "nhan_cach": "3-8"}


def test_tat_dinh_va_khong_doi_ban_port():
    """Mở rộng không được đụng tới bản port gốc (golden cũ vẫn phải xanh ở test khác)."""
    a = mr.bieu_do_ngay_sinh(1, 1, 2000)
    b = mr.bieu_do_ngay_sinh(1, 1, 2000)
    assert a == b


def test_chi_so_mo_rong_gom_du():
    kq = mr.chi_so_mo_rong("Nguyễn Đức Luân", 24, 10, 1988, nam_xem=2026, thang_xem=9, ngay_xem=30)
    assert kq["so_ngay_sinh"] == 6 and kq["so_thai_do"] == 7 and kq["so_truong_thanh"] == 6
    assert kq["thang_ca_nhan"] == 8 and kq["ngay_ca_nhan"] == 2
    assert kq["nam_ca_nhan"] == 8
    assert kq["no_nghiep"] == [] and kq["bai_hoc_nghiep"] == [2, 6, 8, 9]
    assert [m["ma"] for m in kq["bieu_do"]["mui_ten_trong"]] == ["3-5-7"]
