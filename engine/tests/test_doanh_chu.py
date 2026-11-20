# -*- coding: utf-8 -*-
"""Kiểm định Bậc 2 & 3 Engine Doanh Chủ (`doanh_chu.py` + `POST /v1/doanh-chu/doi-ngu`)."""
from __future__ import annotations

import re

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.kb import sach_ghi as sg, tuvi_doi_song_kb as kds
from app.main import app

_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_CLIENT = TestClient(app)


_PAYLOAD = {
    "ong_chu": {"ten": "Anh Minh (CEO)", "vai_tro": "CEO", "ngay": 15, "thang": 5, "nam": 1986, "gioi_tinh": "nam", "dong_y_tu_nguyen": True},
    "doi_ngu": [
        {"ten": "Chị Lan", "vai_tro": "COO", "ngay": 8, "thang": 11, "nam": 1989, "gioi_tinh": "nu", "dong_y_tu_nguyen": True},
        {"ten": "Anh Hùng", "vai_tro": "CFO", "ngay": 22, "thang": 3, "nam": 1992, "gioi_tinh": "nam", "dong_y_tu_nguyen": True},
        {"ten": "Bạn Trang", "vai_tro": "Sales Lead", "ngay": 19, "thang": 8, "nam": 1995, "gioi_tinh": "nu", "dong_y_tu_nguyen": True},
    ],
    "nam_xem": 2027,
    "cam_ket_thoa_thuan": True,
}


def _walk_strings(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for k, v in x.items():
            if k not in ("ten", "vai_tro_hien_tai", "hanh_manh", "hanh_can_bu", "hanh_troi", "hanh_thieu"):
                yield from _walk_strings(v)
    elif isinstance(x, list):
        for v in x:
            yield from _walk_strings(v)


def test_api_doanh_chu_doi_ngu_day_du_va_giong_van():
    r = _CLIENT.post("/v1/doanh-chu/doi-ngu", json=_PAYLOAD)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["provenance"] == "bien_tap"
    assert d["nam_xem"] == 2027
    assert "tuyển dụng" in d["ranh_gioi_phap_ly"]
    assert len(d["ma_tran_phoi_hop"]) == 3
    cb = d["can_bang_ngu_hanh"]
    assert abs(sum(cb["ty_le_5_hanh"].values()) - 1.0) < 0.02
    assert cb["hanh_troi"] and cb["hanh_thieu"]

    cam = kds.cum_cam()
    cum = kds.cum_chung_chung()
    for ns in d["ma_tran_phoi_hop"]:
        assert len(ns["sau_yeu_to_cot_loi"]) == 6
        assert ns["mat_tich_cuc"]
        assert len(ns["ong_chu_can_chu_y"]) == 3
        assert len(ns["nhan_su_can_luu_y"]) == 2
    for s in _walk_strings(d):
        assert not sg.kiem_loi(s), f"Lỗi kiểm lời: {s}"
        assert not kds.tim_cum_cam(s, cam), f"Từ cấm: {s} -> {kds.tim_cum_cam(s, cam)}"
        assert not kds.tim_cum_cam(s, cum), f"Cụm chung chung: {s} -> {kds.tim_cum_cam(s, cum)}"


def test_api_doanh_chu_en_sach():
    with ngon_ngu.dung("en"):
        from app.calc import doanh_chu
        kq = doanh_chu.ban_do_doi_ngu(_PAYLOAD["ong_chu"], _PAYLOAD["doi_ngu"], nam_xem=2027)
        assert "hiring screening" in kq["ranh_gioi_phap_ly"]
        for s in _walk_strings(kq):
            assert not _VIET.search(s), f"Rò chữ Việt ở bản EN: {s}"


def test_api_doanh_chu_kiem_rang_buoc():
    bad_date = {**_PAYLOAD, "ong_chu": {**_PAYLOAD["ong_chu"], "ngay": 31, "thang": 2}}
    assert _CLIENT.post("/v1/doanh-chu/doi-ngu", json=bad_date).status_code == 422
    too_many = {**_PAYLOAD, "doi_ngu": [_PAYLOAD["doi_ngu"][0]] * 9}
    assert _CLIENT.post("/v1/doanh-chu/doi-ngu", json=too_many).status_code == 422
    empty = {**_PAYLOAD, "doi_ngu": []}
    assert _CLIENT.post("/v1/doanh-chu/doi-ngu", json=empty).status_code == 422
    no_consent = {**_PAYLOAD, "doi_ngu": [{**_PAYLOAD["doi_ngu"][0], "dong_y_tu_nguyen": False}]}
    assert _CLIENT.post("/v1/doanh-chu/doi-ngu", json=no_consent).status_code == 422
    no_agreement = {**_PAYLOAD, "cam_ket_thoa_thuan": False}
    assert _CLIENT.post("/v1/doanh-chu/doi-ngu", json=no_agreement).status_code == 422


def test_mien_tru_trach_nhiem_du_y():
    from app.calc import doanh_chu
    rg = doanh_chu.ban_do_doi_ngu(_PAYLOAD["ong_chu"], _PAYLOAD["doi_ngu"], nam_xem=2027)["ranh_gioi_phap_ly"]
    for y in ("chủ doanh nghiệp tự nhập", "thoả thuận riêng", "91/2025", "không lưu", "tham khảo", "tự chịu trách nhiệm"):
        assert y in rg, y
    with ngon_ngu.dung("en"):
        rg_en = doanh_chu.ban_do_doi_ngu(_PAYLOAD["ong_chu"], _PAYLOAD["doi_ngu"], nam_xem=2027)["ranh_gioi_phap_ly"]
    for y in ("provided by the business owner", "separate agreement", "not stored", "sole responsibility"):
        assert y in rg_en, y


def test_khong_tu_vung_sang_loc_va_ranh_gioi_lap_xuan():
    from app.calc import doanh_chu

    # 1. Cấm tuyệt đối từ vựng sa thải / sàng lọc tuyển dụng ngoài ranh_gioi_phap_ly
    kq = doanh_chu.ban_do_doi_ngu(_PAYLOAD["ong_chu"], _PAYLOAD["doi_ngu"], nam_xem=2027)
    kq_khong_rg = {k: v for k, v in kq.items() if k != "ranh_gioi_phap_ly"}
    van_ban = " ".join(_walk_strings(kq_khong_rg)).lower()
    for tu in ("sa thải", "loại hồ sơ", "sàng lọc", "tuyển dụng", "chấm điểm nhân viên", "fire", "reject candidate"):
        assert tu not in van_ban, f"Phát hiện từ vựng nhạy cảm lao động: {tu}"

    # 2. Kiểm biên Lập Xuân (20/01/1990 vẫn thuộc năm Kỷ Tỵ, 10/02/1990 sang Canh Ngọ)
    truoc_lx = doanh_chu._ho_so_co_ban(20, 1, 1990, "nam", 2027)
    sau_lx = doanh_chu._ho_so_co_ban(10, 2, 1990, "nam", 2027)
    assert truoc_lx["chi_nam"] == "Tỵ" and sau_lx["chi_nam"] == "Ngọ"

