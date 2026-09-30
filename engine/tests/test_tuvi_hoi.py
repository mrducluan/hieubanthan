# -*- coding: utf-8 -*-
"""Hỏi đáp Tử vi (HH-2): phân loại, chọn cung/lớp hạn, gói bằng chứng chỉ từ lá số + KB,
2 chế độ, ranh giới (người khác / hợp hôn / sự kiện), API /v1/tuvi/hoi.

Bộ HOLDOUT dưới đây viết SAU router, không nằm trong kho câu hỏi — đo khả năng khái quát.
"""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app.hoidap import tuvi as tv
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
SINH = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
XEM = dt.date(2026, 9, 30)

HOLDOUT = [
    ("Sao Thất Sát nằm ở Tài Bạch thì kiếm tiền kiểu gì?", "sao_cung", "Tài Bạch"),
    ("Thái Âm cư Điền Trạch tốt không?", "sao_cung", "Điền Trạch"),
    ("Liêm Trinh thủ mệnh là người thế nào?", "sao_cung", "Mệnh"),
    ("Hoá Kỵ ở Quan Lộc thì công việc ra sao?", "tu_hoa_cung", "Quan Lộc"),
    ("Hóa Quyền tại Tài Bạch nghĩa là gì vậy?", "tu_hoa_cung", "Tài Bạch"),
    ("Mình muốn biết chuyện chồng con của mình theo lá số", "la_so", "Phu Thê"),
    ("Lá số của em có hợp đi du học không?", "la_so", "Thiên Di"),
    ("Tôi nên làm nghề gì theo lá số tử vi?", "la_so", "Quan Lộc"),
    ("Tôi hay tiêu hoang, tử vi nói gì?", "la_so", "Tài Bạch"),
    ("Anh chị em trong nhà tôi có giúp nhau không?", "la_so", "Huynh Đệ"),
    ("Quan hệ với bố mẹ của tôi theo lá số thế nào?", "la_so", "Phụ Mẫu"),
    ("Tôi có được cấp trên nâng đỡ không?", "la_so", "Phụ Mẫu"),
    ("Tôi là người thế nào theo tử vi?", "la_so", "Mệnh"),
    ("Năm 2028 của tôi theo tử vi ra sao?", "han", None),
    ("Vận hạn năm sau của tôi thế nào?", "han", None),
    ("Đại hạn hiện giờ của tôi ở cung nào?", "han", None),
    ("Lưu niên năm nay chiếu vào cung nào của tôi?", "han", None),
    ("Xem hạn năm nay cho tôi với", "han", None),
    ("Tử vi của vợ tôi sinh năm 1993 thế nào?", "nguoi_khac", None),
    ("Xem giúp lá số cho bạn gái tôi", "nguoi_khac", None),
    ("Tôi tuổi Mão và anh ấy tuổi Dậu có hợp tuổi không?", "hop_hon", None),
    ("Lập lá số cho con tôi sinh tháng 3 năm ngoái", "la_so_con", None),
    ("Tiểu hạn là gì?", "ky_thuat", None),
    ("Vô chính diệu nghĩa là gì?", "ky_thuat", None),
]


@pytest.mark.parametrize("cau,loai,cung", HOLDOUT)
def test_holdout_phan_loai(cau, loai, cung):
    p = tv.phan_loai(cau)
    assert p["loai"] == loai, p
    if cung:
        assert cung in p["cung"], p


@pytest.mark.parametrize("cau,xu_ly", [
    ("Lá số tôi xấu quá, tôi không muốn sống nữa.", "an_toan"),
    ("Tôi có bị ung thư không theo cung Tật Ách?", "tu_choi_nhe"),
    ("Lá số tôi năm nào chết?", "tu_choi_nhe"),
    ("Xem tử vi để chọn số lô.", "tu_choi_nhe"),
    ("Năm nay tôi có bị tai nạn không?", "tu_choi_nhe"),   # tham_khao: từ chối
])
def test_dac_biet(cau, xu_ly):
    assert tv.phan_loai(cau, "tham_khao")["xu_ly"] == xu_ly


def test_chi_tiet_su_kien_tra_loi_kem_luu_y_khong_phan_bien_co():
    out = tv.tra_loi("Năm nay tôi có bị tai nạn không?", "chi_tiet", SINH, XEM)
    assert out["phan_loai"]["loai"] == "han"
    van = out["cau_tra_loi"]
    assert "không đoán được biến cố" in van and "Xu hướng" in van
    assert hoi_van.kiem_tra_dau_ra(van, out["bang_chung"]) == []


def test_la_so_menh_co_sao_do_sang_mat_toi_tu_soi():
    out = tv.tra_loi("Tính cách của tôi theo tử vi thế nào?", "tham_khao", SINH, XEM)
    van = out["cau_tra_loi"]
    assert "Cự Môn ở cung Mệnh" in van and "Vượng" in van
    assert "Mặt tối" in van and "tự soi" in van and "Thân cư" in van
    assert out["do_phu"] == "day_du" and hoi_van.kiem_tra_dau_ra(van, out["bang_chung"]) == []
    assert any(f["loai"] == "nam_phai" for f in out["co_canh_bao"])


def test_han_ba_lop_theo_thu_tu_uu_tien():
    out = tv.tra_loi("Năm nay lưu niên của tôi ra sao?", "tham_khao", SINH, XEM)
    lop = [m["lop"] for m in out["bang_chung"]["muc"] if m["loai"] == "han"]
    assert lop == ["dai_han", "luu_nien", "tieu_han"]
    assert out["van_han"]["tuoi_mu"] == 37
    assert "Xu hướng" not in out["cau_tra_loi"]           # tham_khao: không chấm thuận/nghịch


def test_dai_han_toi():
    out = tv.tra_loi("Đại hạn tới của tôi có khá hơn không?", "tham_khao", SINH, XEM)
    ke = [m for m in out["bang_chung"]["muc"] if m.get("vai") == "ke_tiep"]
    assert ke and ke[0]["tu_tuoi"] == 45 and ke[0]["cung_goc"] == "Quan Lộc"


def test_nam_cu_the():
    out = tv.tra_loi("Năm 2028 của tôi theo tử vi ra sao?", "tham_khao", SINH, XEM)
    assert out["van_han"]["luu_nien"]["chi"] == "Thân" and out["van_han"]["tuoi_mu"] == 39


def test_vo_chinh_dieu_muon_cung_doi():
    ls = tv.tom_tat(__import__("app.calc.tuvi_an_sao", fromlist=["x"]).an_sao_tho(
        dt.date(1992, 8, 21), 4, "nam", "vi-VN"))
    trong = [c for c in ls["cung"] if not c["chinh_tinh"]]
    assert trong, "lá số mẫu phải có cung vô chính diệu"
    muc: list = []
    tv._doc_cung(ls, trong[0]["ten"], muc)
    assert any(m["loai"] == "vo_chinh_dieu" for m in muc)


def test_thieu_la_so_thi_hoi_them():
    out = tv.tra_loi("Cung Phu Thê của tôi nói gì?", "tham_khao", None, XEM)
    assert out["can_them"] == ["la_so"] and "ngày sinh" in out["cau_tra_loi"]


def test_nguoi_khac_khong_luan_ma_hoi_dong_y():
    out = tv.tra_loi("Xem tử vi cho mẹ tôi.", "tham_khao", SINH, XEM)
    assert out["can_them"] == ["la_so_nguoi_kia"] and "đồng ý" in out["cau_tra_loi"]


def test_hop_hon_khong_phan_khac():
    out = tv.tra_loi("Tuổi Tý và tuổi Ngọ có kỵ nhau không?", "tham_khao", SINH, XEM)
    assert "không phán" in out["cau_tra_loi"]


def test_sao_cung_khong_can_la_so():
    out = tv.tra_loi("Tham Lang ở cung Quan Lộc có ý nghĩa gì?", "tham_khao", None, XEM)
    assert out["do_phu"] == "day_du" and not out["can_them"]
    assert "kinh doanh" in out["cau_tra_loi"]


def test_che_do_sai():
    with pytest.raises(ValueError):
        tv.tra_loi("x", "bua")


def test_api_hoi_co_la_so():
    r = client.post("/v1/tuvi/hoi", json={
        "cau_hoi": "Cung Quan Lộc của tôi nói gì về sự nghiệp?",
        "la_so": {"birth_date": "1990-05-17", "birth_time": "12:30", "gender": "nam"},
        "ngay_xem": "2026-09-30"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["phan_loai"]["loai"] == "la_so" and "Quan Lộc" in d["cau_tra_loi"]
    assert "engine_version" in d


def test_api_hoi_ty_muon_gan_co():
    r = client.post("/v1/tuvi/hoi", json={
        "cau_hoi": "Tính cách của tôi?", "che_do": "tham_khao",
        "la_so": {"birth_date": "1995-06-15", "birth_time": "23:30", "gender": "nam"}})
    assert r.status_code == 200
    assert any(f["loai"] == "ty_conflict" for f in r.json()["co_canh_bao"])


def test_api_cam_truong_la():
    r = client.post("/v1/tuvi/hoi", json={"cau_hoi": "Tính cách của tôi?", "sao_menh": "Tử Vi"})
    assert r.status_code == 422


def test_kb_du_14x12_va_tu_hoa_4x12_khong_cum_cam():
    from app.kb import tuvi_kb as kb  # noqa: PLC0415
    for s in kb.ten_chinh_tinh():
        for c in tv.THU_TU_CUNG:
            assert kb.sao_cung(s, c), (s, c)
    for h in tv.THU_TU_HOA:
        for c in tv.THU_TU_CUNG:
            assert kb.tu_hoa_cung(h, c), (h, c)
    assert len(kb.ten_chinh_tinh()) == 14 and kb.meta()["can_doi_chieu"] is True
    goc = (kb._F).read_text(encoding="utf-8").lower()
    for cum in hoi_van.CAM:
        assert cum not in goc, cum
