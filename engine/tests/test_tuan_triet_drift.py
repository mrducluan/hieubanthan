# -*- coding: utf-8 -*-
"""Chống trôi: bản vendor phải cho kết quả Y HỆT bản gốc trong tuvi-vn/.

Bản gốc là nguồn chân lý (người dùng tự viết, tự bảo trì). Bản vendor tồn tại
chỉ để engine tự chứa đủ file khi deploy. Nếu người dùng sửa bản gốc mà quên
đồng bộ, test này đỏ — đó chính là mục đích của nó.

Chạy trên máy không có bản gốc (CI/cloud) → skip, không fail.
"""
from __future__ import annotations

import importlib.util
import itertools
from pathlib import Path

import pytest

from app.calc import tuan_triet_vendor as vendor

BAN_GOC = Path("C:/Users/mrduc/tuvi-vn/tuan_triet.py")


def _nap_ban_goc():
    spec = importlib.util.spec_from_file_location("tuan_triet_goc", BAN_GOC)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.mark.skipif(not BAN_GOC.exists(), reason="khong co ban goc tren may nay")
def test_vendor_khop_ban_goc_toan_bo_to_hop() -> None:
    goc = _nap_ban_goc()
    # Quét đại diện: 10 can × 12 chi hợp lệ (60 hoa giáp) × 3 chế độ × 2 trường phái
    cases = 0
    for can, chi in itertools.product(vendor.CAN, vendor.CHI):
        try:
            vendor.chi_so_hoa_giap(can, chi)
        except ValueError:
            continue  # tổ hợp không tồn tại trong hoa giáp
        for che_do in ("hep", "tam_hop", "tptc"):
            for tp in (None, "npl", "vvt"):
                a = vendor.phan_tich(can, chi, che_do, tp)
                b = goc.phan_tich(can, chi, che_do, tp)
                assert a == b, f"lech tai {can} {chi} {che_do} {tp}"
                cases += 1
    assert cases == 60 * 3 * 3


@pytest.mark.skipif(not BAN_GOC.exists(), reason="khong co ban goc tren may nay")
def test_vendor_khop_ca_phan_ky_va_cuc() -> None:
    goc = _nap_ban_goc()
    for gd in ("tien_van", "hau_van", None):
        for cuc in (2, 6, None):
            a = vendor.phan_tich("Mậu", "Thìn", "tam_hop", "vvt", gd, cuc)
            b = goc.phan_tich("Mậu", "Thìn", "tam_hop", "vvt", gd, cuc)
            assert a == b
