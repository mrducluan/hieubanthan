# -*- coding: utf-8 -*-
"""Kiểm thử nâng cấp Chỉ Tay: đo mở rộng 3D + đường chỉ CV tham khảo, so sánh 2 tay (Tiên Thiên / Hậu Thiên),
và API hợp nhất Đông – Tây `/v1/chi-tay/luan-giai-hai-tay` & `/v1/chi-tay/do-tay` (`phai="hop_nhat"`)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.calc import chi_tay_do as ctd
from app.kb import chi_tay_kb as kb_dong
from app.main import app
from tests import test_chi_tay_do as _mau


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def _diem_3d_mau(khum: float = 0.012) -> list[list[float]]:
    """21 điểm worldLandmarks 3D (đơn vị mét) với lòng bàn tay hơi khum theo trục z."""
    p2 = _mau._tay()
    ra = []
    for i, (x, y) in enumerate(p2):
        # Đẩy nhẹ gốc ngón giữa (9) và áp út (13) theo trục z để tạo độ khum lòng bàn tay
        z = khum if i in (9, 13) else 0.0
        ra.append([round(x * 0.01, 5), round(y * 0.01, 5), round(z, 5)])
    return ra


_DUONG_CHI_MAU = {
    "do_ro_tong": 0.62,
    "tam_dao": {"do_ro": 0.68, "chieu_dai_uoc_luong": 0.75, "do_cong": 0.24},
    "tri_dao": {"do_ro": 0.61, "chieu_dai_uoc_luong": 0.71, "do_cong": 0.18},
    "sinh_dao": {"do_ro": 0.57, "chieu_dai_uoc_luong": 0.69, "do_cong": 0.42},
    "do_tin": "goi_y_tham_khao",
}


def test_do_tay_mo_rong_co_goc_ngon_cai_dot_ngon_va_3d():
    p = _mau._anh(_mau._tay(), "phai")
    kq = ctd.do_tay_mo_rong(p, 0.75, "phai", diem_3d=_diem_3d_mau(0.015), duong_chi_goi_y=_DUONG_CHI_MAU)
    assert kq["hop_le"] is True
    sd = kq["so_do"]
    assert 5.0 <= sd["goc_ngon_cai"] <= 90.0
    dot = sd["dot_ngon_giua"]
    assert abs(dot["dot_goc"] + dot["dot_giua"] + dot["dot_dau"] - 1.0) <= 0.01
    assert sd["chi_so_3d"]["do_khum_long"] > 0
    assert 0.5 <= sd["chi_so_3d"]["ty_le_ngon_giua_3d"] <= 1.5
    assert kq["duong_chi_goi_y"]["do_tin"] == "goi_y_tham_khao"
    assert kq["duong_chi_goi_y"]["tam_dao"]["do_ro"] == 0.68


def test_do_tay_mo_rong_anh_loi_tra_hop_le_false():
    # Truyền tay trái nhưng khai báo tay phải → mu_ban_tay
    p = _mau._anh(_mau._tay(), "trai")
    kq = ctd.do_tay_mo_rong(p, 0.75, "phai", diem_3d=_diem_3d_mau())
    assert kq["hop_le"] is False
    assert kq["loi"] == "mu_ban_tay"


def test_so_sanh_hai_tay_can_xung_va_chuyen_dich_nguyen_to():
    # Hai tay cùng hình dáng → tương đồng cao, không chuyển dịch hành
    trai = ctd.do_tay_mo_rong(_mau._anh(_mau._tay(), "trai"), 0.75, "trai")
    phai = ctd.do_tay_mo_rong(_mau._anh(_mau._tay(), "phai"), 0.75, "phai")
    ss = ctd.so_sanh_hai_tay(trai, phai)
    assert ss is not None
    assert ss["chuyen_dich_hanh"] is False
    assert ss["muc_tuong_dong"] >= 0.95
    assert ss["do_tin"] == "bien_tap_tu_dat"
    assert "Tiên Thiên" in ss["nhan_xet"]

    # Tay trái lòng dài + ngón dài (Thủy), tay phải lòng rộng vuông + ngón ngắn (Thổ) → chuyển dịch hành
    trai_thuy = ctd.do_tay_mo_rong(_mau._anh(_mau._tay(ngon=1.15, ngang=0.85), "trai"), 0.75, "trai")
    phai_tho = ctd.do_tay_mo_rong(_mau._anh(_mau._tay(ngon=0.78, ngang=1.28), "phai"), 0.75, "phai")
    ss2 = ctd.so_sanh_hai_tay(trai_thuy, phai_tho)
    assert ss2 is not None
    assert ss2["chuyen_dich_hanh"] is True
    assert ss2["hanh_trai"] != ss2["hanh_phai"]
    assert ss2["chenh_rong_long"] > 0
    assert ss2["chenh_ngon_giua"] < 0

    # Thiếu 1 tay hoặc tay lỗi → None
    assert ctd.so_sanh_hai_tay(trai, None) is None
    assert ctd.so_sanh_hai_tay({"hop_le": False}, phai) is None


def test_route_do_tay_hop_nhat_va_tuong_thich_nguoc(client):
    p_phai = _mau._anh(_mau._tay(ngon=1.15, ngang=1.15), "phai")
    # Phái hợp nhất kèm 3D và gợi ý đường chỉ CV
    r = client.post("/v1/chi-tay/do-tay", json={
        "dong_y": True,
        "phai": "hop_nhat",
        "tay": "phai",
        "ty_le": 0.75,
        "diem": p_phai,
        "diem_3d": _diem_3d_mau(),
        "duong_chi_goi_y": _DUONG_CHI_MAU,
    })
    assert r.status_code == 200
    j = r.json()
    assert j["hop_le"] is True
    assert j["phai"] == "hop_nhat"
    assert "chi_so_3d" in j["so_do"]
    assert j["duong_chi_goi_y"]["do_tin"] == "goi_y_tham_khao"
    assert j["luan_giai_dong"]["hop_le"] is True
    assert len(j["luan_giai_dong"]["cung"]) == 9
    assert j["luan_giai_tay"]["hop_le"] is True
    assert len(j["luan_giai_tay"]["duong_kinh_dien"]) == 3
    assert j["tong_hop_dong_tay"]["do_tin"]["duong_chi_cv"] == "goi_y_tham_khao"

    # Reject diem_3d sai số điểm
    bad = client.post("/v1/chi-tay/do-tay", json={
        "dong_y": True, "tay": "phai", "ty_le": 0.75, "diem": p_phai, "diem_3d": [[0.0, 0.0, 0.0]] * 5,
    })
    assert bad.status_code == 422


def test_route_luan_giai_hai_tay_day_du(client):
    p_trai = _mau._anh(_mau._tay(ngon=1.12, ngang=0.88), "trai")
    p_phai = _mau._anh(_mau._tay(ngon=0.82, ngang=1.22), "phai")
    ma_van = kb_dong.ds_van()[0]["ma"]

    r = client.post("/v1/chi-tay/luan-giai-hai-tay", json={
        "dong_y": True,
        "trai": {"ty_le": 0.75, "diem": p_trai, "diem_3d": _diem_3d_mau(0.01), "duong_chi_goi_y": _DUONG_CHI_MAU},
        "phai": {"ty_le": 0.75, "diem": p_phai, "diem_3d": _diem_3d_mau(0.016), "duong_chi_goi_y": _DUONG_CHI_MAU},
        "van": [ma_van],
        "ngay_sinh": "1992-05-10",
    })
    assert r.status_code == 200
    j = r.json()
    assert j["pham_vi"] == "chi_tay"
    assert j["tay_trai"]["hop_le"] is True
    assert j["tay_phai"]["hop_le"] is True
    assert j["so_sanh_hai_tay"] is not None
    assert j["so_sanh_hai_tay"]["do_tin"] == "bien_tap_tu_dat"
    assert j["luan_giai_dong"]["hop_le"] is True
    assert "tu_soi" in j["luan_giai_dong"]
    assert j["luan_giai_tay"]["hop_le"] is True
    assert j["luan_giai_tay"]["fuzzy_bridge"]["dang_ban_tay"]["ma"] in ("tho", "khi", "hoa", "thuy")
    assert len(j["luan_giai_tay"]["truong_phai"]) == 4
    assert j["tong_hop_dong_tay"]["tom_tat"]
    assert j["tong_hop_dong_tay"]["do_tin"]["hinh_hoc"] == "do_truc_tiep_21_diem"


def test_route_luan_giai_hai_tay_mot_tay_va_loi_dau_vao(client):
    p_trai = _mau._anh(_mau._tay(), "trai")
    r = client.post("/v1/chi-tay/luan-giai-hai-tay", json={
        "dong_y": True,
        "trai": {"ty_le": 0.75, "diem": p_trai},
    })
    assert r.status_code == 200
    j = r.json()
    assert j["tay_trai"]["hop_le"] is True
    assert j["tay_phai"] is None
    assert j["so_sanh_hai_tay"] is None
    assert j["luan_giai_dong"]["hop_le"] is True
    assert j["luan_giai_tay"]["hop_le"] is True

    # Thiếu cả 2 tay → 422
    assert client.post("/v1/chi-tay/luan-giai-hai-tay", json={"dong_y": True}).status_code == 422
    # Không đồng ý → 422
    assert client.post("/v1/chi-tay/luan-giai-hai-tay", json={
        "dong_y": False, "trai": {"ty_le": 0.75, "diem": p_trai},
    }).status_code == 422
