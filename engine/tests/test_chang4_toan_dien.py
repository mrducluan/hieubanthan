# -*- coding: utf-8 -*-
"""Chặng 4.2 & 4.3 — Kiểm thử API Chiêm tinh phương Tây, Cầu nối Đông–Tây, Trạch Nhật Hiệp Kỷ & Vòng tự học 11 mảng."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.calc import trach_nhat_hiep_ky as tnhk
from app.kb import sach_ghi
from app.main import app
from scripts import tong_hop_vong_tu_hoc as vth
from tests import _dau_ra as dr

ROOT = Path(__file__).resolve().parents[1]
NGUON = ROOT / "fixtures" / "nguon"
KB_DIR = ROOT / "app" / "kb" / "data"
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_C = TestClient(app)


def test_api_chiem_tinh_ban_do_cau_noi_dong_tay_song_ngu_va_tuoi_16():
    # Ngoài phạm vi lịch 1926–2049 -> trả 422 sạch (không 500, không ngoại suy âm thầm)
    assert _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "1920-01-01"}).status_code == 422
    assert _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "1990-05-15", "ngay_xem": "2060-01-01"}).status_code == 422

    # Dưới 16 tuổi -> chuyển hướng lịch sự
    nho = _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "2014-06-01", "ngay_xem": "2026-11-27"}).json()
    assert nho["chuyen_huong_tuoi"]["tuoi"] < 16 and "hanh_tinh" not in nho

    # Có giờ sinh + Placidus + Cầu nối Đông–Tây: song ngữ VI ↔ EN sạch chữ Việt & khớp khung
    p = {
        "ngay_sinh": "1997-03-15",
        "gio_sinh": "09:30",
        "gioi_tinh": "nu",
        "noi_sinh": "ha-noi",
        "he_nha": "placidus",
        "ngay_xem": "2026-11-27",
        "kem_cau_noi_dong_tay": True,
    }
    vi = _C.post("/v1/chiem-tinh/ban-do", json=p).json()
    en = _C.post("/v1/chiem-tinh/ban-do", json=p, headers={"x-ngon-ngu": "en"}).json()
    assert vi["co_gio_sinh"] is True
    assert len(vi["hanh_tinh"]) == 13
    assert len(vi["nha"]) == 12
    assert vi["van_han"]["saturn_return"]["giai_doan"] == "lan_1_29_tuoi"
    assert len(vi["cau_noi_dong_tay"]["bon_chieu"]) == 4
    assert "diem" not in vi  # CD-1: không chấm điểm gộp
    # Bản Anh sạch chữ Việt (trừ tên địa danh đầu vào Hà Nội nếu có trong dau_vao)
    en_kiem = {k: v for k, v in en.items() if k != "dau_vao"}
    assert not _VIET.search(json.dumps(en_kiem, ensure_ascii=False)), en_kiem
    assert dr.khung(vi) == dr.khung(en)

    # Khuyết giờ sinh -> có ghi_chu_mat_trang, không an nhà
    kg = _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "1990-05-15", "ngay_xem": "2026-11-27"}).json()
    assert kg["co_gio_sinh"] is False and kg["nha"] is None and kg["ghi_chu_mat_trang"]


def test_api_synastry_bat_buoc_dong_y_khong_in_ngay_sinh_va_khong_cham_diem():
    p = {
        "nguoi_a": {"ngay_sinh": "1992-04-18", "gio_sinh": "10:00", "noi_sinh": "ha-noi"},
        "nguoi_b": {"ngay_sinh": "1994-09-25", "gio_sinh": "15:30", "noi_sinh": "tp-ho-chi-minh"},
    }
    assert _C.post("/v1/chiem-tinh/hop-doi", json=p).status_code == 422
    vi = _C.post("/v1/chiem-tinh/hop-doi", json={**p, "dong_y_tu_nguyen": True, "ngay_xem": "2026-11-27"}).json()
    en = _C.post(
        "/v1/chiem-tinh/hop-doi",
        json={**p, "dong_y_tu_nguyen": True, "ngay_xem": "2026-11-27"},
        headers={"x-ngon-ngu": "en"},
    ).json()
    van_vi = json.dumps(vi, ensure_ascii=False)
    assert vi["khong_cham_diem"] is True and "1994" not in van_vi
    assert not _VIET.search(json.dumps(en, ensure_ascii=False))
    assert dr.khung(vi) == dr.khung(en)


def test_trach_nhat_hiep_ky_nguyen_van_tu_ly_va_api_song_ngu():
    hk_raw = sach_ghi.chuan(
        "\n".join(t.get("van", "") for t in json.loads((NGUON / "hiep_ky_bien_phuong_thu_du_bo.json").read_text("utf-8"))["thien"])
    )
    kb = json.loads((KB_DIR / "trach_nhat_hiep_ky_kb.json").read_text("utf-8"))
    for ma, item in kb["trich_co_thu"].items():
        assert sach_ghi.chuan(item["han"]) in hk_raw, ma

    # Quanh Đông chí tháng 12/2026 phải bắt đúng 1 ngày Tứ Ly
    tu_ly_days = [
        dt.date(2026, 12, d)
        for d in range(19, 24)
        if tnhk.la_tu_ly_tu_tuyet(dt.date(2026, 12, d)) == "tu_ly"
    ]
    assert len(tu_ly_days) == 1

    vi = _C.post("/v1/lich/hiep-ky-doi-chieu", json={"tu_ngay": "2026-12-19", "so_ngay": 5, "huong_tu_tao": "Bắc"}).json()
    en = _C.post(
        "/v1/lich/hiep-ky-doi-chieu",
        json={"tu_ngay": "2026-12-19", "so_ngay": 5, "huong_tu_tao": "Bắc"},
        headers={"x-ngon-ngu": "en"},
    ).json()
    assert len(vi["ngay_phan_tich"]) == 5
    # Năm 2026 Bính Ngọ (Dần Ngọ Tuất) -> Tam Sát ở phương Bắc -> cham_huong_dang_xet kích hoạt!
    assert any("Tam Sát" in " ".join(ng["luu_y_hiep_ky"]) for ng in vi["ngay_phan_tich"])
    en_no_cjk = json.loads(json.dumps(en))
    for t in en_no_cjk["trich_co_thu"]:
        t["han"] = ""
    assert not _VIET.search(json.dumps(en_no_cjk, ensure_ascii=False)), en_no_cjk
    assert dr.khung(vi) == dr.khung(en)


def test_vong_tu_hoc_hang_tuan_11_mang():
    mau = {
        "kiem_chung_phieu": [
            {"mo_dun": "chiem_tinh", "ma_mau": "ds.ct.saturn_1", "so_dung": 28, "so_chua_dung": 5},
            {"mo_dun": "tuvi", "ma_mau": "ds.tv.tai_chinh.xau", "so_dung": 10, "so_chua_dung": 25},
        ],
        "kiem_chung_sau": [
            {"mo_dun": "tam_tai", "ma_mau": "ds.tt.su_nghiep", "so_do_hon": 4, "so_nhu_cu": 14, "so_nang_hon": 2},
        ],
        "lech_ngon_ngu": [
            {"mo_dun": "chiem_tinh", "ma_mau": "ds.ct.moon", "tong_vi": 20, "tong_en": 20, "ty_le_dung_vi": 0.80, "ty_le_dung_en": 0.50},
        ],
        "cum_cau_hoi_chua_phu": [
            {"mo_dun": "chiem_tinh", "chu_de": "nghịch hành thuỷ tinh ký hợp đồng", "so_luot": 12, "diem_khop_tb": 0.42},
        ],
    }
    kq = vth.tong_hop_ung_vien(mau)
    assert kq["so_mang_ho_tro"] == 11
    assert len(kq["thuc_chung_cao"]) == 1 and kq["thuc_chung_cao"][0]["mo_dun"] == "chiem_tinh"
    assert len(kq["can_viet_lai"]) == 1 and kq["can_viet_lai"][0]["tep_kb_goi_y"] == "tuvi_doi_song_kb.json"
    assert len(kq["can_doi_hanh_dong_30_ngay"]) == 1
    assert len(kq["lech_song_ngu"]) == 1 and kq["lech_song_ngu"][0]["tep_en_can_ra"] == "en/chiem_tinh_hanh_tinh_cung_kb.json"
    assert len(kq["cum_to_mo_moi"]) == 1
    md = vth.xuat_markdown(kq)
    assert "ds.tv.tai_chinh.xau" in md
