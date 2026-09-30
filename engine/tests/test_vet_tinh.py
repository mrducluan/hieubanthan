# -*- coding: utf-8 -*-
"""Vết tính (lớp ĐÃ TÍNH trên UI — Blueprint §17): phải khớp tuyệt đối với chi_so_xac_dinh."""
import pytest

from app.calc import thanso
from app.luangiai import thanso as lg

CA = [
    ("Nguyễn Đức Luân", 24, 10, 1988),
    ("Trần Thị Thuý Vy", 1, 1, 2000),
    ("Lý Huỳnh Yến", 29, 2, 1996),
    ("Phạm Quốc Khánh", 11, 11, 1974),
]


@pytest.mark.parametrize("ten,d,m,y", CA)
def test_ket_qua_vet_khop_chi_so(ten, d, m, y):
    vet = thanso.vet_tinh(ten, d, m, y)
    chinh = thanso.chi_so_xac_dinh(ten, d, m, y)
    for vt, v in chinh.items():
        assert vet[vt]["ket_qua"] == v, vt
        # tổng các số hạng = tổng; chuỗi rút gọn bắt đầu từ tổng, kết thúc ở kết quả
        assert sum(x["so"] for x in vet[vt]["so_hang"]) == vet[vt]["tong"]
        assert vet[vt]["rut_gon"][0] == vet[vt]["tong"]
        assert vet[vt]["rut_gon"][-1] == v


def test_duong_doi_liet_ke_tung_chu_so():
    vet = thanso.vet_tinh("Nguyễn Đức Luân", 24, 10, 1988)["duong_doi"]
    assert [x["so"] for x in vet["so_hang"]] == [2, 4, 1, 0, 1, 9, 8, 8]
    assert vet["tong"] == 33 and vet["rut_gon"] == [33]
    assert vet["dien_giai"] == "2 + 4 + 1 + 0 + 1 + 9 + 8 + 8 = 33 (số cái, giữ nguyên)"


def test_linh_hon_chi_lay_nguyen_am_va_y_theo_ngu_canh():
    # "Vy": Y đứng sau V (phụ âm) và cuối âm tiết → nguyên âm. "Huỳnh": Y kề U → phụ âm.
    vy = thanso.vet_tinh("Vy", 1, 1, 2000)["linh_hon"]
    assert [x["ky_tu"] for x in vy["so_hang"]] == ["Y"]
    huynh = thanso.vet_tinh("Huỳnh", 1, 1, 2000)
    assert [x["ky_tu"] for x in huynh["linh_hon"]["so_hang"]] == ["U"]
    assert "Y" in [x["ky_tu"] for x in huynh["nhan_cach"]["so_hang"]]


def test_rut_gon_nhieu_buoc():
    vet = thanso.vet_tinh("A", 29, 9, 1999)["duong_doi"]  # 2+9+9+1+9+9+9 = 48 → 12 → 3
    assert vet["rut_gon"] == [48, 12, 3]
    assert vet["dien_giai"].endswith("= 48 → 12 → 3")


def test_luan_giai_gan_cach_tinh():
    kq = lg.luan_giai(["Nguyễn Đức Luân"], 24, 10, 1988)
    for vt in kq["cac_vi_tri"]:
        assert vt["cach_tinh"]["ket_qua"] == vt["gia_tri"]
