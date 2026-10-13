# -*- coding: utf-8 -*-
"""HN-2 — "Hôm nay bạn định làm gì?": ý định (chọn sẵn hoặc gõ tay) × ngày cá nhân → nhịp + cách làm + câu tự soi.
Viết TRƯỚC hàm. Câu gõ tay chỉ để nhận diện ý định (luật từ khoá, không LLM) và KHÔNG được trả lại/lưu.
"""
import datetime as dt

from fastapi.testclient import TestClient

from app.calc import thanso_mo_rong as mr
from app.kb import thanso_v2 as kb
from app.luangiai import hom_nay
from app.main import app

client = TestClient(app)
SINH = (17, 5, 1990)
NGAY = dt.date(2026, 10, 13)


def test_ngay_pho_quat_tinh_tay():
    assert mr.ngay_pho_quat(2026, 10, 13) == 6        # 1+3+1+0+2+0+2+6 = 15 → 6
    assert mr.ngay_pho_quat(2025, 12, 31) == 7        # 3+1+1+2+2+0+2+5 = 16 → 7


def test_chon_y_dinh():
    kq = hom_nay.the_hom_nay(*SINH, NGAY, y_dinh=["cong_viec", "tinh_cam"])
    so = kq["ngay_ca_nhan"]["so"]
    ds = kq["y_dinh_hom_nay"]
    assert [x["ma"] for x in ds] == ["cong_viec", "tinh_cam"]
    for x in ds:
        m = kb.y_dinh_theo_ngay(so, x["ma"])
        assert x["nhip"] == m["nhip"] and x["cach_lam"] == m["cach_lam"] and x["tu_soi"].endswith("?")
        assert x["ten"] and x["bieu_tuong"]


def test_y_dinh_la_bi_bo_qua_va_toi_da_ba():
    kq = hom_nay.the_hom_nay(*SINH, NGAY, y_dinh=["xyz", "hoc_tap", "hoc_tap", "gap_go", "van_dong", "bat_dau"])
    assert [x["ma"] for x in kq["y_dinh_hom_nay"]] == ["hoc_tap", "gap_go", "van_dong"]


def test_nhan_dien_cau_go_tay():
    assert hom_nay.nhan_dien_y_dinh("Chiều nay mình có buổi phỏng vấn xin việc") == ["gap_go"]
    assert "hoc_tap" in hom_nay.nhan_dien_y_dinh("tối ôn thi môn toán")
    assert hom_nay.nhan_dien_y_dinh("đi đà lạt với gia đình") [:2] == ["di_chuyen", "gia_dinh"] or \
        set(hom_nay.nhan_dien_y_dinh("đi đà lạt với gia đình")) >= {"di_chuyen", "gia_dinh"}
    assert hom_nay.nhan_dien_y_dinh("abc xyz") == []


def test_cau_go_tay_khung_hoang_tra_ho_tro():
    kq = hom_nay.the_hom_nay(*SINH, NGAY, du_dinh="mình không muốn sống nữa")
    assert kq["ho_tro"] and "115" in kq["ho_tro"]
    assert kq["y_dinh_hom_nay"] == []


def test_cau_go_tay_khong_bi_tra_lai():
    cau = "Hôm nay mình đi gặp khách hàng Nguyễn Văn B ở quận 3"
    kq = hom_nay.the_hom_nay(*SINH, NGAY, du_dinh=cau)
    assert "Nguyễn Văn B" not in str(kq)
    assert kq["y_dinh_nhan_dien"] == ["gap_go"]


def test_cau_hoi_noi_bat_xoay_theo_ngay():
    a = hom_nay.the_hom_nay(*SINH, NGAY)
    assert len(a["cau_hoi_noi_bat"]) == 3 and all(c.endswith("?") for c in a["cau_hoi_noi_bat"])
    assert a == hom_nay.the_hom_nay(*SINH, NGAY)                       # tất định
    assert a["ngay_pho_quat"]["so"] == 6 and a["ngay_pho_quat"]["nghia"]
    assert set(a["danh_sach_y_dinh"]) == set(kb.y_dinh_hom_nay())


def test_the_chaldea_trong_ngay():
    kq = hom_nay.the_hom_nay(*SINH, NGAY)
    c = kq["chaldea"]
    assert (c["so"], c["kep"], c["so_ngay_sinh"]) == (4, 13, 8)        # ngày 13 → kép 13 → 4; sinh 17 → 8
    assert c["cong_huong"] is False and c["nghia_kep"]["bieu_tuong"]


def test_api_nhan_y_dinh_va_du_dinh():
    r = client.post("/v1/thanso/hom-nay", json={"ngay": 17, "thang": 5, "nam": 1990, "ngay_xem": "2026-10-13",
                                                 "y_dinh": ["nghi_ngoi"], "du_dinh": "tối nay đi tập gym"})
    assert r.status_code == 200
    j = r.json()
    assert [x["ma"] for x in j["y_dinh_hom_nay"]] == ["nghi_ngoi", "van_dong"]
    r = client.post("/v1/thanso/hom-nay", json={"ngay": 17, "thang": 5, "nam": 1990, "du_dinh": "x" * 201})
    assert r.status_code == 422
