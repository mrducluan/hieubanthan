# -*- coding: utf-8 -*-
"""Hỏi đáp Bát tự (HH-3): phân loại, gói bằng chứng từ tứ trụ + KB, dụng thần hai cách không tự
chọn, ranh giới (hợp / con / người khác), API /v1/battu/*. HOLDOUT viết sau router."""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app.hoidap import battu as bh
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
SINH = {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}
XEM = dt.date(2026, 9, 30)

HOLDOUT = [
    ("Nhật chủ Tân sinh mùa đông có yếu không?", "nhat_chu_chung", None),
    ("Người nhật chủ Bính thường ra sao?", "nhat_chu_chung", None),
    ("Thương Quan là gì trong tứ trụ?", "thap_than_chung", None),
    ("Chính Quan nghĩa là gì?", "thap_than_chung", None),
    ("Bát tự của tôi thiếu hành nào?", "la_so", "ngu_hanh"),
    ("Tôi nên chọn màu gì theo bát tự?", "la_so", "ngu_hanh"),
    ("Tôi có hợp làm kinh doanh không, tứ trụ nói gì?", "la_so", "nghe_tien"),
    ("Trụ giờ của tôi nói gì?", "la_so", "tru"),
    ("Người bạn đời của tôi theo bát tự là người thế nào?", "la_so", "hon_nhan"),
    ("Tôi có Thất Sát, có sao không?", "la_so", "thap_than"),
    ("Tính cách tôi theo bát tự?", "la_so", "tinh_cach"),
    ("Lưu niên 2027 của tôi theo bát tự?", "van", None),
    ("Tôi bắt đầu đại vận từ khi nào?", "van", None),
    ("Xem bát tự cho vợ tôi", "nguoi_khac", None),
    ("Đặt tên cho con theo ngũ hành", "con", None),
    ("Cách cục là gì?", "ky_thuat", None),
]


@pytest.mark.parametrize("cau,loai,chu_de", HOLDOUT)
def test_holdout(cau, loai, chu_de):
    p = bh.phan_loai(cau)
    assert p["loai"] == loai, p
    if chu_de:
        assert p["chu_de"] == chu_de, p


def test_dac_biet():
    assert bh.phan_loai("Bát tự nói tôi thọ bao nhiêu tuổi?")["xu_ly"] == "tu_choi_nhe"
    assert bh.phan_loai("Bát tự tôi khắc chồng khắc con, tôi muốn biến mất.")["xu_ly"] == "an_toan"


def test_dung_than_hai_cach_trong_cau_tra_loi():
    out = bh.tra_loi("Dụng thần của tôi là gì?", SINH, XEM)
    van = out["cau_tra_loi"]
    assert "Phù ức" in van and "Tử Bình Chân Thuyên" in van and "không tự chọn" in van
    assert "Nhâm" in van and hoi_van.kiem_tra_dau_ra(van, out["bang_chung"]) == []
    assert any(c["loai"] == "thang_diem" for c in out["co_canh_bao"])


def test_van_hien_tai_va_luu_nien():
    out = bh.tra_loi("Đại vận hiện tại của tôi là gì?", SINH, XEM)
    m = {x["loai"]: x for x in out["bang_chung"]["muc"]}
    # 30/9/2026: vận Ất Dậu mới bắt đầu 13/12/2026 → hiện tại vẫn Giáp Thân (đang đi theo ngày khởi vận)
    assert (m["dai_van"]["can"], m["dai_van"]["chi"]) == ("Giáp", "Thân")
    assert (m["luu_nien"]["can"], m["luu_nien"]["chi"]) == ("Bính", "Ngọ")


def test_van_nam_cu_the_theo_bang():
    out = bh.tra_loi("Đại vận năm 2027 của tôi là gì?", SINH, XEM)
    m = {x["loai"]: x for x in out["bang_chung"]["muc"]}
    assert (m["dai_van"]["can"], m["dai_van"]["chi"]) == ("Ất", "Dậu")


def test_hon_nhan_nam_xem_the_tinh():
    out = bh.tra_loi("Bát tự nói gì về hôn nhân của tôi?", SINH, XEM)
    assert "thê tinh" in out["cau_tra_loi"] and "cung phối ngẫu" in out["cau_tra_loi"]


def test_thieu_la_so():
    out = bh.tra_loi("Tôi thân vượng hay thân nhược?", None, XEM)
    assert out["can_them"] == ["la_so"]


def test_api_la_so_va_hoi():
    r = client.post("/v1/battu/la-so", json={"birth_date": "1990-05-17", "birth_time": "12:30", "gender": "nam"})
    assert r.status_code == 200, r.text
    assert [f"{t['can']} {t['chi']}" for t in r.json()["tru"]] == ["Canh Ngọ", "Tân Tỵ", "Nhâm Ngọ", "Bính Ngọ"]
    r = client.post("/v1/battu/hoi", json={"cau_hoi": "Nhật chủ Giáp là người thế nào?"})
    assert r.status_code == 200 and "cây đại thụ" in r.json()["cau_tra_loi"]
    r = client.post("/v1/battu/hoi", json={"cau_hoi": "Tính cách tôi?", "nhat_chu": "Giáp"})
    assert r.status_code == 422


def test_api_truoc_1975_mien_nam_quy_doi_gio():
    # 00:30 02/12/1970 Sài Gòn (UTC+8) → 23:30 01/12 giờ lịch → dạ Tý, trụ ngày 01/12
    r = client.post("/v1/battu/la-so", json={"birth_date": "1970-12-02", "birth_time": "00:30",
                                              "gender": "nu", "vung": "south"})
    d = r.json()
    assert d["gio_lich"].startswith("1970-12-01T23:30")
    assert any(c["loai"] == "da_ty" for c in d["co_canh_bao"])
