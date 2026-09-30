# -*- coding: utf-8 -*-
"""Hỏi đáp Phong thuỷ (HH-4). HOLDOUT viết sau router, không nằm trong kho câu hỏi."""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app.hoidap import phongthuy as ph
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
SINH = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)}
XEM = dt.date(2026, 9, 30)

HOLDOUT = [
    ("Mệnh quái Ly thì nhà hướng Đông tốt không?", "menh_quai_chung"),
    ("Diên Niên là hướng gì, ý nghĩa ra sao?", "du_nien_chung"),
    ("Cửa chính phía Nam mà bếp phía Tây thì sao?", "cua_bep"),
    ("Nhà tôi nằm cuối con đường đâm thẳng vào thì có sao?", "bo_tri"),
    ("Trước nhà có hồ nước lớn có tốt không?", "bo_tri"),
    ("Tôi hợp hướng nào để kê bàn làm việc?", "bo_tri"),
    ("Tôi sinh năm 1985, nữ, nên chọn nhà hướng nào?", "huong_ca_nhan"),
    ("Năm 2027 có nên động thổ không, Ngũ Hoàng ở đâu?", "nam"),
    ("Đặt mộ ông bà cần chú ý gì theo phong thuỷ?", "am_trach"),
    ("Mua cóc ngậm tiền để chiêu tài có được không?", "dac_biet"),
    ("Loan đầu là gì, khác lý khí ra sao?", "ky_thuat"),
    ("Hai vợ chồng tôi khác mệnh, xem hướng nhà giúp.", "hop"),
]


@pytest.mark.parametrize("cau,loai", HOLDOUT)
def test_holdout(cau, loai):
    assert ph.phan_loai(cau)["loai"] == loai


def test_huong_ca_nhan_tu_nam_sinh_trong_cau():
    out = ph.tra_loi("Tôi sinh năm 1988, nam, hợp hướng gì?", None, XEM)
    assert "Chấn" in out["cau_tra_loi"] and "Đông tứ mệnh" in out["cau_tra_loi"]
    assert any(c["loai"] == "chua_ro_ngay" for c in out["co_canh_bao"])
    assert hoi_van.kiem_tra_dau_ra(out["cau_tra_loi"], out["bang_chung"]) == []


def test_nha_huong_cu_the_voi_menh():
    out = ph.tra_loi("Nhà hướng Tây Nam có hợp với tôi không?", SINH, XEM)
    van = out["cau_tra_loi"]
    assert "Khảm" in van and "Tuyệt Mệnh" in van and "Khác nhóm" in van


def test_thieu_nam_sinh_thi_hoi():
    out = ph.tra_loi("Tôi hợp hướng nhà nào?", None, XEM)
    assert out["can_them"] == ["nam_sinh"]


def test_dan_gian_ghi_ro():
    out = ph.tra_loi("Gương đối diện giường có sao không?", None, XEM)
    assert "quan niệm dân gian" in out["cau_tra_loi"] and "Gợi ý thực tế" in out["cau_tra_loi"]


def test_sao_nam_va_tuoi_lam_nha():
    out = ph.tra_loi("Tuổi tôi năm nay có làm nhà được không?", SINH, XEM)
    van = out["cau_tra_loi"]
    assert "Ngũ Hoàng ở Nam" in van and "Kim Lâu" in van and "quan niệm dân gian" in van


def test_khong_ban_vat_pham():
    out = ph.tra_loi("Đặt vật phẩm phong thuỷ gì để trúng số?", None, XEM)
    assert out["phan_loai"]["xu_ly"] == "tu_choi_nhe" and "vật phẩm" in out["cau_tra_loi"]


def test_api():
    r = client.post("/v1/phongthuy/hoi", json={"cau_hoi": "Tôi hợp hướng nhà nào?",
                                                "sinh": {"birth_date": "1990-05-17", "gender": "nam"}})
    assert r.status_code == 200, r.text
    assert "Khảm" in r.json()["cau_tra_loi"]
    r = client.post("/v1/phongthuy/menh-quai", json={"birth_date": "1990-02-01", "gender": "nam"})
    assert r.status_code == 200 and r.json()["quai"] == "Khôn"
    r = client.post("/v1/phongthuy/hoi", json={"cau_hoi": "Tôi hợp hướng nhà nào?", "huong_tot": "Bắc"})
    assert r.status_code == 422
