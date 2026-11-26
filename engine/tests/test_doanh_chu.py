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
            if k not in ("ten", "ten_a", "ten_b", "vai_tro_hien_tai", "hanh_manh", "hanh_can_bu", "hanh_dung_than", "hanh_troi", "hanh_thieu"):
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


def test_tam_tru_khong_bom_hoa_gio_ngo_va_ho_tro_tu_tru_khi_co_gio():
    """Chặng 0: khi không biết giờ sinh, phải tính Tam Trụ (6 chữ, tổng điểm 7.0), không gán bừa giờ Ngọ 12:00 bơm Hỏa/Thổ;
    khi biết giờ sinh thật thì tính đủ Tứ Trụ (8 chữ) và đọc đúng dụng thần phù ức / điều hậu."""
    import datetime as dt
    from app.calc import battu, doanh_chu

    # Ngày 14/12/1992: Năm Nhâm Thân (Kim,Nhâm,Mậu), Tháng Nhâm Tý (Quý), Ngày Nhâm Tý (Quý)
    # Cả 3 trụ Năm - Tháng - Ngày hoàn toàn KHÔNG có chữ Hỏa nào (0.0)!
    # Bản cũ gán cứng 12:00 (Bính Ngọ -> Bính 1.0 + Đinh 0.7 = 1.7 điểm Hỏa!) làm Hỏa bị vọt giả tạo.
    ls_3 = battu.la_so(dt.datetime(1992, 12, 14, 12, 0), "nam", co_gio=False)
    assert len(ls_3["tru"]) == 3
    assert abs(sum(ls_3["ngu_hanh"]["diem"].values()) - 7.0) < 1e-6
    assert ls_3["ngu_hanh"]["diem"]["Hỏa"] == 0.0

    # Mặc định co_gio=True giữ nguyên 100% hành vi 4 trụ (không đổi bất kỳ trường nào)
    ls_4 = battu.la_so(dt.datetime(1992, 12, 14, 12, 0), "nam")
    assert len(ls_4["tru"]) == 4 and "so_tru" not in ls_4
    assert ls_4["ngu_hanh"]["diem"]["Hỏa"] == 0.7

    # Doanh chủ: thiếu giờ -> Tam Trụ (Hỏa = 0.0, cần điều hậu Hỏa tháng Tý mùa đông!)
    hs_khong_gio = doanh_chu._ho_so_co_ban(14, 12, 1992, "nam", 2027)
    assert hs_khong_gio["so_tru"] == 3
    assert hs_khong_gio["ty_le_ngu_hanh"]["Hỏa"] == 0.0
    assert "Hỏa" in hs_khong_gio["hanh_can_bu"]  # đọc đúng điều hậu / phù ức thay vì khoá chết 'can' rỗng

    # Doanh chủ: có giờ Ngọ thật -> Tứ Trụ (so_tru == 4, Hỏa > 0)
    hs_co_gio = doanh_chu._ho_so_co_ban(14, 12, 1992, "nam", 2027, gio="12:00")
    assert hs_co_gio["so_tru"] == 4
    assert hs_co_gio["ty_le_ngu_hanh"]["Hỏa"] >= 0.07

    # API /doi-ngu và /ca-nhan nhận gio tuỳ chọn và kiểm định dạng HH:MM
    payload_gio = {
        **_PAYLOAD,
        "ong_chu": {**_PAYLOAD["ong_chu"], "gio": "08:30"},
        "doi_ngu": [{**_PAYLOAD["doi_ngu"][0], "gio": "14:15"}, *_PAYLOAD["doi_ngu"][1:]],
    }
    r_ok = _CLIENT.post("/v1/doanh-chu/doi-ngu", json=payload_gio)
    assert r_ok.status_code == 200, r_ok.text
    d_ok = r_ok.json()
    assert d_ok["ong_chu"]["so_tru"] == 4
    assert d_ok["ma_tran_phoi_hop"][0]["chi_so"]["so_tru"] == 4
    assert d_ok["ma_tran_phoi_hop"][1]["chi_so"]["so_tru"] == 3

    r_cn = _CLIENT.post("/v1/doanh-chu/ca-nhan", json={"ngay": 12, "thang": 12, "nam": 1992, "gioi_tinh": "nam", "nam_xem": 2027, "gio": "08:30"})
    assert r_cn.status_code == 200 and r_cn.json()["so_tru"] == 4
    assert _CLIENT.post("/v1/doanh-chu/ca-nhan", json={"ngay": 12, "thang": 12, "nam": 1992, "gioi_tinh": "nam", "nam_xem": 2027, "gio": "25:00"}).status_code == 422

    # Kiểm đối xứng dữ kiện số & mã VI ↔ EN cho cả /doi-ngu và /ca-nhan (dùng tên rỗng + tên ASCII để kiểm 0% rò chữ Việt kể cả nhãn mặc định Owner/Member)
    payload_en_sach = {
        "ong_chu": {"ten": "", "vai_tro": "CEO", "ngay": 15, "thang": 5, "nam": 1986, "gioi_tinh": "nam", "gio": "08:30", "dong_y_tu_nguyen": True},
        "doi_ngu": [
            {"ten": "", "vai_tro": "COO", "ngay": 8, "thang": 11, "nam": 1989, "gioi_tinh": "nu", "gio": "14:15", "dong_y_tu_nguyen": True},
            {"ten": "Alex", "vai_tro": "CFO", "ngay": 22, "thang": 3, "nam": 1992, "gioi_tinh": "nam", "dong_y_tu_nguyen": True},
            {"ten": "Sam", "vai_tro": "Sales", "ngay": 19, "thang": 8, "nam": 1995, "gioi_tinh": "nu", "dong_y_tu_nguyen": True},
        ],
        "nam_xem": 2027,
        "cam_ket_thoa_thuan": True,
    }
    vi_dn = _CLIENT.post("/v1/doanh-chu/doi-ngu", json=payload_en_sach).json()
    en_dn = _CLIENT.post("/v1/doanh-chu/doi-ngu", json=payload_en_sach, headers={"x-ngon-ngu": "en"}).json()
    assert en_dn["ong_chu"]["ten"] == "Owner" and en_dn["ma_tran_phoi_hop"][0]["ten"] == "Member"
    assert vi_dn["ong_chu"]["so_tru"] == en_dn["ong_chu"]["so_tru"] == 4
    assert vi_dn["ong_chu"]["hanh_dung_than"] == en_dn["ong_chu"]["hanh_dung_than"]
    assert vi_dn["can_bang_ngu_hanh"]["ty_le_5_hanh"] == en_dn["can_bang_ngu_hanh"]["ty_le_5_hanh"]
    assert [m["muc_phoi_hop"] for m in vi_dn["ma_tran_phoi_hop"]] == [m["muc_phoi_hop"] for m in en_dn["ma_tran_phoi_hop"]]
    assert [m["chi_so"]["so_tru"] for m in vi_dn["ma_tran_phoi_hop"]] == [m["chi_so"]["so_tru"] for m in en_dn["ma_tran_phoi_hop"]]
    for s in _walk_strings(en_dn):
        assert not _VIET.search(s), f"Rò chữ Việt ở /v1/doanh-chu/doi-ngu (EN): {s}"

    vi_cn = _CLIENT.post("/v1/doanh-chu/ca-nhan", json={"ngay": 14, "thang": 12, "nam": 1992, "gioi_tinh": "nam", "nam_xem": 2027}).json()
    en_cn = _CLIENT.post("/v1/doanh-chu/ca-nhan", json={"ngay": 14, "thang": 12, "nam": 1992, "gioi_tinh": "nam", "nam_xem": 2027}, headers={"x-ngon-ngu": "en"}).json()
    assert vi_cn["so_tru"] == en_cn["so_tru"] == 3
    assert vi_cn["duong_doi"] == en_cn["duong_doi"] and vi_cn["nam_ca_nhan"] == en_cn["nam_ca_nhan"]
    for s in _walk_strings(en_cn):
        assert not _VIET.search(s), f"Rò chữ Việt ở /v1/doanh-chu/ca-nhan (EN): {s}"



