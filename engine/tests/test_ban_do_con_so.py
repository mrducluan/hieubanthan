# -*- coding: utf-8 -*-
"""Gói Sao "Bản đồ con số" (Luận giải toàn bộ thần số — chủ dự án chọn 2026-10-20): Tổng quan miễn phí (bạn hiếm cỡ nào,
số lặp, lời mời) + 3 chương mở bằng Sao: Nghịch lý bên trong · 12 tháng tới · Sự nghiệp & tiền bạc. RULES từ CALC + KB.

Ca Nguyễn Đức Luân 24/10/1988, rút gọn con số: DD 6 · SM 9 · LH 6 (Kết nối) · NC 3 (Biểu đạt); số ngày sinh 6;
đỉnh cao đang ở giai đoạn 2 (31–39 tuổi, số 5); năm cá nhân 2026 = 8; khép chu kỳ 2027, chuyển đỉnh 3 năm 2028.
"""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.calc import thanso_ty_le as tl
from app.luangiai import ban_do_con_so as bd
from app.main import app

LUAN = (["Nguyễn Đức Luân"], 24, 10, 1988)
NGAY = dt.date(2026, 10, 20)


def _bc(**kw):
    return bd.bao_cao(*LUAN, NGAY, quy_uoc="tung_phan", **kw)


def test_cau_truc_va_moi_xem():
    bc = _bc()
    assert bc["mo_dun"] == "thanso" and [c["ma"] for c in bc["chuong"]] == ["tong_quan", "nghich_ly", "muoi_hai_thang", "su_nghiep"]
    for c in bc["chuong"]:
        assert c["doan"] and c["moi_xem"]["cau_hoi"] and c["moi_xem"]["diem_nhan"]
        chu = " ".join(c["doan"])
        assert "Luân" not in chu and "1988" not in chu and "None" not in chu


def test_tong_quan_ban_hiem_co_nao():
    dau = " ".join(_bc()["chuong"][0]["doan"])
    t = tl.ty_le(24, 10, 1988, "tung_phan")
    assert f"Đường đời 6" in dau and f"{t['cap']['so_ngay']:,}".replace(",", ".") in dau
    assert "Số 6 xuất hiện 2 lần" in dau          # Đường đời 6 + Linh hồn 6
    assert "Kết nối" in dau and "Biểu đạt" in dau  # lời mời chương nghịch lý (chỉ nêu tên nhóm)


def test_nghich_ly():
    c = " ".join(_bc()["chuong"][1]["doan"])
    assert "Linh hồn 6" in c and "Nhân cách 3" in c and "Ấm áp và tự do" in c
    assert "Đường đời 6" in c and "Sứ mệnh 9" in c
    assert "thiếu số 3, 5, 6, 7" in c and "Tâm linh" in c


def test_muoi_hai_thang():
    c = _bc()["chuong"][2]
    chu = " ".join(c["doan"])
    assert "Năm cá nhân 8" in chu and "10/2026" in chu and "9/2027" in chu and "10/2027" not in chu
    assert "giai đoạn 2/4" in chu and "2027" in chu
    assert "Khởi sự việc mới:" in chu and "Tiền bạc, thăng tiến:" in chu


def test_su_nghiep():
    chu = " ".join(_bc()["chuong"][3]["doan"])
    assert "Giáo dục" in chu and "Sứ mệnh 9" in chu
    assert "31–39" in chu and "40–48" in chu and "49+" in chu


def test_tong_het_khac_so_va_ten_khong_chu():
    assert "Đường đời 33" in " ".join(bd.bao_cao(*LUAN, NGAY, quy_uoc="tong_het")["chuong"][0]["doan"])
    bc = bd.bao_cao(["123"], 24, 10, 1988, NGAY, quy_uoc="tung_phan")
    assert all(c["doan"] for c in bc["chuong"]) and "None" not in str(bc["chuong"])


def test_api():
    c = TestClient(app)
    body = {"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988, "ngay_xem": "2026-10-20",
            "quy_uoc_duong_doi": "tung_phan", "dien_dat_toi_da": 1}
    r = c.post("/v1/thanso/ban-do-con-so", json=body)
    assert r.status_code == 200 and len(r.json()["chuong"]) == 4
    assert c.post("/v1/thanso/ban-do-con-so", json={**body, "la": 1}).status_code == 422
