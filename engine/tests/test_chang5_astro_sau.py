# -*- coding: utf-8 -*-
"""Kiểm thử Chặng 5 — Phẩm giá Ptolemy, Ma trận 4×3, Bi-Wheel Transit, Cột mốc Đời & Lá số Composite."""
from __future__ import annotations

import re

from fastapi.testclient import TestClient

from app.calc import chiem_tinh_natal as ctn, chiem_tinh_synastry as cts
from app.main import app
from tests import _dau_ra as dr

_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_C = TestClient(app)


def test_pham_gia_ptolemy_7_hanh_tinh_co_dien_va_khong_gan_hanh_tinh_ngoai():
    assert ctn.tra_pham_gia_ptolemy("mat_troi", "su_tu") == "vuong_dia"
    assert ctn.tra_pham_gia_ptolemy("mat_troi", "bach_duong") == "vuong_ton"
    assert ctn.tra_pham_gia_ptolemy("mat_troi", "bao_binh") == "tu_dia"
    assert ctn.tra_pham_gia_ptolemy("mat_troi", "thien_binh") == "suy_dia"
    assert ctn.tra_pham_gia_ptolemy("mat_troi", "song_tu") is None
    # Thuỷ tinh tại Xử Nữ vừa Vượng địa vừa Vượng tôn; tại Song Ngư vừa Tù địa vừa Suy địa
    assert ctn.tra_pham_gia_ptolemy("thuy_tinh", "xu_nu") == "vuong_dia_kiem_vuong_ton"
    assert ctn.tra_pham_gia_ptolemy("thuy_tinh", "song_ngu") == "tu_dia_kiem_suy_dia"
    # Hành tinh ngoài, nút Mặt Trăng và Chiron tuyệt đối không gán phẩm giá Ptolemy
    for ngoai in ("thien_vuong", "hai_vuong", "diem_vuong", "la_hau", "ke_do", "chiron"):
        for cung in ("bach_duong", "bao_binh", "bo_cap", "song_ngu"):
            assert ctn.tra_pham_gia_ptolemy(ngoai, cung) is None


def test_diem_giua_vong_tron_composite_qua_moc_0_360_va_giao_hoan():
    # Qua vạch 0° Bạch Dương: 355° (Song Ngư) và 5° (Bạch Dương) -> 0.0°, KHÔNG phải 180.0°
    assert cts.diem_giua_vong_tron(355.0, 5.0) == 0.0
    assert cts.diem_giua_vong_tron(5.0, 355.0) == 0.0
    assert cts.diem_giua_vong_tron(350.0, 20.0) == 5.0
    assert cts.diem_giua_vong_tron(20.0, 350.0) == 5.0
    # Cung thường & đối xung đúng 180° phải giao hoán tuyệt đối
    assert cts.diem_giua_vong_tron(30.0, 90.0) == 60.0
    assert cts.diem_giua_vong_tron(90.0, 30.0) == 60.0
    assert cts.diem_giua_vong_tron(15.0, 195.0) == cts.diem_giua_vong_tron(195.0, 15.0) == 105.0


def test_api_ban_do_va_composite_song_ngu_day_du_du_lieu_bieu_do():
    p = {
        "ngay_sinh": "1994-09-10",  # Mặt Trời Xử Nữ, xem thêm Thuỷ tinh / hành tinh khác
        "gio_sinh": "09:30",
        "gioi_tinh": "nu",
        "noi_sinh": "ha-noi",
        "he_nha": "placidus",
        "ngay_xem": "2026-11-27",
    }
    vi = _C.post("/v1/chiem-tinh/ban-do", json=p).json()
    en = _C.post("/v1/chiem-tinh/ban-do", json=p, headers={"X-Ngon-Ngu": "en"}).json()

    assert len(vi["ma_tran_nguyen_to_pham_chat"]) == 4
    assert sum(len(o["hanh_tinh"]) for hang in vi["ma_tran_nguyen_to_pham_chat"] for o in hang) == 10
    assert len(vi["van_han"]["hanh_tinh_transit"]) == 13
    assert len(vi["van_han"]["moc_chu_ky_doi"]) >= 4
    assert len(vi["tat_ca_goc_chieu"]) >= len(vi["goc_chieu"])
    assert dr.khung(vi) == dr.khung(en)
    assert not _VIET.search(str(en))

    # Hợp đôi: có cả vòng Synastry & Bản đồ điểm giữa Composite, 0% chấm điểm, 0% rò ngày sinh
    body_hd = {
        "nguoi_a": {"ngay_sinh": "1992-03-28", "gio_sinh": "08:15", "noi_sinh": "ha-noi"},
        "nguoi_b": {"ngay_sinh": "1994-09-25", "gio_sinh": "18:45", "noi_sinh": "tp-ho-chi-minh"},
        "dong_y_tu_nguyen": True,
        "ngay_xem": "2026-11-27",
    }
    hd_vi = _C.post("/v1/chiem-tinh/hop-doi", json=body_hd).json()
    hd_en = _C.post("/v1/chiem-tinh/hop-doi", json=body_hd, headers={"X-Ngon-Ngu": "en"}).json()
    assert hd_vi["khong_cham_diem"] is True
    assert hd_vi["ban_do_composite"]["khong_cham_diem"] is True
    assert hd_vi["ban_do_composite"]["co_du_gio_hai_nguoi"] is True
    assert hd_vi["ban_do_composite"]["mat_trang_khuyet_gio"] is False
    assert len(hd_vi["ban_do_composite"]["hanh_tinh"]) == 10
    assert len(hd_vi["ban_do_composite"]["nha"]) == 12
    assert len(hd_vi["vong_synastry"]["hanh_tinh_a"]) == 10
    assert "1992-03-28" not in str(hd_vi) and "1994-09-25" not in str(hd_vi)
    assert dr.khung(hd_vi) == dr.khung(hd_en)
    assert not _VIET.search(str(hd_en))
