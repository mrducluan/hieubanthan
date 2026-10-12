# -*- coding: utf-8 -*-
"""HN-1 — "Hôm nay của bạn": thẻ mỗi ngày (khâu QUAY LẠI của vòng tăng trưởng, docs/MUC-TIEU-TANG-TRUONG.md).
Viết TRƯỚC hàm. Chỉ ghép số đã tính (CALC) + nghĩa trong KB, không gọi LLM, không dự báo sự kiện.
"""
import datetime as dt

from fastapi.testclient import TestClient

from app.calc import lunar, thanso, thanso_mo_rong as mr
from app.luangiai import hom_nay
from app.main import app

client = TestClient(app)
SINH = (17, 5, 1990)


def test_so_ca_nhan_khop_calc():
    ngay = dt.date(2026, 10, 10)
    kq = hom_nay.the_hom_nay(*SINH, ngay)
    assert kq["ngay_ca_nhan"]["so"] == mr.ngay_ca_nhan(17, 5, 2026, 10, 10)
    assert kq["thang_ca_nhan"]["so"] == mr.thang_ca_nhan(17, 5, 2026, 10)
    assert kq["nam_ca_nhan"]["so"] == int(thanso.nam_ca_nhan(17, 5, 2026, "duong_lich"))
    assert kq["ngay_mai"]["so"] == mr.ngay_ca_nhan(17, 5, 2026, 10, 11)


def test_am_lich_va_can_chi_ngay():
    ngay = dt.date(2026, 10, 10)
    kq = hom_nay.the_hom_nay(*SINH, ngay)
    d, m, y, nhuan = lunar.solar_to_lunar(10, 10, 2026, 7.0)
    assert kq["am_lich"]["ngay"] == d and kq["am_lich"]["thang"] == m and kq["am_lich"]["nam"] == y
    assert kq["am_lich"]["can_chi_ngay"] == " ".join(lunar.can_chi_ngay(ngay))
    assert kq["am_lich"]["can_chi_nam"] == " ".join(lunar.can_chi_nam(y))


def test_moi_so_ngay_co_nghia_va_cau_tu_soi():
    goc = dt.date(2026, 1, 1)
    thay = set()
    for i in range(40):
        kq = hom_nay.the_hom_nay(*SINH, goc + dt.timedelta(days=i))
        n = kq["ngay_ca_nhan"]
        thay.add(n["so"])
        assert n["nghia"] and n["tu_soi"].endswith("?")
        assert kq["thang_ca_nhan"]["chu_de"] and kq["nam_ca_nhan"]["chu_de"]
        assert kq["ngay_mai"]["nghia"]
    assert thay == set(range(1, 10))


def test_khong_giong_phan_khong_du_bao():
    from app.narrative.hoi_van import CAM
    for i in range(9):
        kq = hom_nay.the_hom_nay(*SINH, dt.date(2026, 3, 1) + dt.timedelta(days=i))
        van = " ".join([kq["ngay_ca_nhan"]["nghia"], kq["ngay_ca_nhan"]["tu_soi"]]).lower()
        assert not [c for c in CAM if c in van]
    assert kq["trang_thai"] == "nhap_ai" and kq["nguon"]


def test_tat_dinh_va_chuyen_thang():
    a = hom_nay.the_hom_nay(*SINH, dt.date(2026, 10, 31))
    assert a == hom_nay.the_hom_nay(*SINH, dt.date(2026, 10, 31))
    assert a["ngay_mai"]["ngay"] == "2026-11-01"
    assert a["ngay_mai"]["so"] == mr.ngay_ca_nhan(17, 5, 2026, 11, 1)


def test_api():
    r = client.post("/v1/thanso/hom-nay", json={"ngay": 17, "thang": 5, "nam": 1990, "ngay_xem": "2026-10-10"})
    assert r.status_code == 200
    j = r.json()
    assert j["ngay_xem"] == "2026-10-10" and 1 <= j["ngay_ca_nhan"]["so"] <= 9
    assert client.post("/v1/thanso/hom-nay", json={"ngay": 31, "thang": 2, "nam": 1990}).status_code == 422
    # Không có ngay_xem → hôm nay theo giờ Việt Nam
    assert client.post("/v1/thanso/hom-nay", json={"ngay": 17, "thang": 5, "nam": 1990}).status_code == 200
