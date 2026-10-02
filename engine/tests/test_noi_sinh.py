# -*- coding: utf-8 -*-
"""TV-A — nơi sinh, lịch âm đầu vào, giờ mặt trời thực (chỉ cảnh báo).

Chính sách (chủ dự án chốt 2026-09-30):
  - Sinh trong nước: nơi sinh (tỉnh) quyết định vùng múi giờ lịch sử — không bắt
    người dùng tự biết "vĩ tuyến 17". Tỉnh vắt ngang vĩ tuyến 17 (Quảng Trị) thì
    trước 1975 vẫn phải hỏi vùng.
  - Sinh ở nước ngoài: lập lá số theo GIỜ ĐỊA PHƯƠNG (không quy đổi về UTC+7);
    giờ mùa hè (DST) thì trừ 1 giờ.
  - Giờ mặt trời thực theo kinh độ: KHÔNG đổi kết quả, chỉ cảnh báo khi rơi sang
    canh giờ khác.
  - Nhập ngày ÂM: miền Nam 1960–13/06/1975 dùng lịch UTC+8 đang lưu hành lúc đó
    (Tết Mậu Thân: Bắc 29/01/1968, Nam 30/01/1968).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.calc import dia_ly
from app.main import app

client = TestClient(app)


def an_sao(**kw) -> dict:
    body = {"gender": "nam", "calendar_type": "duong", **kw}
    r = client.post("/v1/tuvi/an-sao", json=body)
    assert r.status_code == 200, r.text
    return r.json()


def loai_co(d: dict) -> set[str]:
    return {c["loai"] for c in d["co_canh_bao"]}


# ---- Bảng tỉnh ---------------------------------------------------------------
def test_bang_tinh_du_63_va_dung_vung():
    ds = dia_ly.danh_sach()
    assert len(ds) == 63
    assert len({t["ma"] for t in ds}) == 63
    tra = {t["ma"]: t for t in ds}
    assert tra["ha-noi"]["vung"] == "north"
    assert tra["quang-binh"]["vung"] == "north"
    assert tra["thua-thien-hue"]["vung"] == "south"
    assert tra["tp-ho-chi-minh"]["vung"] == "south"
    assert tra["quang-tri"]["vung"] is None          # vắt ngang vĩ tuyến 17
    for t in ds:
        assert 102.0 <= t["kinh_do"] <= 109.5, t


def test_api_danh_sach_tinh():
    r = client.get("/v1/dia-ly/tinh")
    assert r.status_code == 200
    ds = r.json()["tinh"]
    assert len(ds) == 63 and {"ma", "ten", "vung"} <= set(ds[0])


# ---- Nơi sinh trong nước → vùng --------------------------------------------
def test_noi_sinh_thay_cho_vung_truoc_1975():
    # Sài Gòn 1970 (UTC+8): khai tỉnh là đủ, kết quả trùng khai vung=south.
    a = an_sao(birth_date="1970-12-02", birth_time="00:30", noi_sinh="tp-ho-chi-minh")
    b = an_sao(birth_date="1970-12-02", birth_time="00:30", vung="south")
    assert a["duong_lich_kinh_tuyen"] == b["duong_lich_kinh_tuyen"] == "1970-12-01"
    assert a["cung"] == b["cung"]


def test_tinh_vat_vi_tuyen_17_truoc_1975_van_phai_hoi_vung():
    r = client.post("/v1/tuvi/an-sao", json={
        "birth_date": "1970-12-02", "birth_time": "00:30", "gender": "nam", "noi_sinh": "quang-tri"})
    assert r.status_code == 422
    a = an_sao(birth_date="1970-12-02", birth_time="00:30", noi_sinh="quang-tri", vung="south")
    assert a["duong_lich_kinh_tuyen"] == "1970-12-01"


def test_ma_tinh_la_bi_tu_choi():
    r = client.post("/v1/tuvi/an-sao", json={
        "birth_date": "1990-05-17", "birth_time": "12:30", "gender": "nam", "noi_sinh": "atlantis"})
    assert r.status_code == 422


# ---- Nước ngoài: giờ địa phương --------------------------------------------
def test_nuoc_ngoai_dung_gio_dia_phuong():
    # Sinh 1970 ở Paris lúc 00:30: KHÔNG quy đổi (khác hẳn Sài Gòn 1970 bị lùi về 23:30).
    a = an_sao(birth_date="1970-12-02", birth_time="00:30", noi_sinh="nuoc_ngoai")
    assert a["duong_lich_kinh_tuyen"] == "1970-12-02"
    assert a["mui_gio_dong_ho"] is None
    assert "sinh_nuoc_ngoai" in loai_co(a)
    b = an_sao(birth_date="1990-05-17", birth_time="08:30", noi_sinh="nuoc_ngoai")
    c = an_sao(birth_date="1990-05-17", birth_time="08:30", vung="north")
    assert b["cung"] == c["cung"]


def test_nuoc_ngoai_gio_mua_he_tru_mot_gio():
    a = an_sao(birth_date="1990-05-17", birth_time="08:30", noi_sinh="nuoc_ngoai", gio_mua_he=True)
    b = an_sao(birth_date="1990-05-17", birth_time="07:30", noi_sinh="nuoc_ngoai")
    assert a["gio_chi_so"] == b["gio_chi_so"] == 4     # giờ Thìn (07–09)
    assert a["cung"] == b["cung"]
    assert "gio_mua_he" in loai_co(a)


def test_gio_mua_he_chi_danh_cho_nuoc_ngoai():
    r = client.post("/v1/tuvi/an-sao", json={
        "birth_date": "1990-05-17", "birth_time": "08:30", "gender": "nam",
        "noi_sinh": "ha-noi", "gio_mua_he": True})
    assert r.status_code == 422


def test_battu_cung_theo_gio_dia_phuong():
    r = client.post("/v1/battu/la-so", json={
        "birth_date": "1970-12-02", "birth_time": "00:30", "gender": "nam", "noi_sinh": "nuoc_ngoai"})
    assert r.status_code == 200, r.text
    assert r.json()["gio_lich"].startswith("1970-12-02T00:30")


# ---- Giờ mặt trời thực: chỉ cảnh báo ---------------------------------------
def test_gio_mat_troi_chi_canh_bao_khi_doi_canh_gio():
    # Điện Biên (~103°Đ): chậm ~8 phút so với kinh tuyến 105°. Ngày 13/06 phương trình
    # thời gian ≈ 0 → 11:05 đồng hồ ≈ 10:57 mặt trời: giờ Ngọ → giờ Tỵ.
    a = an_sao(birth_date="1990-06-13", birth_time="11:05", noi_sinh="dien-bien")
    b = an_sao(birth_date="1990-06-13", birth_time="11:05", vung="north")
    assert a["cung"] == b["cung"]                        # KHÔNG đổi lá số
    co = {c["loai"]: c["chi_tiet"] for c in a["co_canh_bao"]}
    assert "gio_mat_troi" in co and "Tỵ" in co["gio_mat_troi"]
    # Giữa canh giờ → không cảnh báo.
    c = an_sao(birth_date="1990-06-13", birth_time="12:00", noi_sinh="dien-bien")
    assert "gio_mat_troi" not in loai_co(c)


def test_gio_mat_troi_tinh_ca_phuong_trinh_thoi_gian():
    # Đầu tháng 11 mặt trời nhanh ~16 phút. Hà Nội (105,85°Đ) +3 phút → 10:45 đồng hồ ≈ 11:04.
    a = an_sao(birth_date="1990-11-03", birth_time="10:45", noi_sinh="ha-noi")
    co = {c["loai"]: c["chi_tiet"] for c in a["co_canh_bao"]}
    assert "gio_mat_troi" in co and "Ngọ" in co["gio_mat_troi"]


# ---- Nhập ngày âm ------------------------------------------------------------
@pytest.mark.parametrize("noi, duong", [("ha-noi", "1968-01-29"), ("tp-ho-chi-minh", "1968-01-30")])
def test_doi_lich_mung_mot_tet_mau_than_theo_mien(noi, duong):
    r = client.post("/v1/lich/doi", json={"chieu": "am_sang_duong", "ngay": 1, "thang": 1, "nam": 1968, "noi_sinh": noi})
    assert r.status_code == 200, r.text
    d = r.json()
    assert "{nam:04d}-{thang:02d}-{ngay:02d}".format(**d["duong"]) == duong
    assert d["am"] == {"ngay": 1, "thang": 1, "nam": 1968, "nhuan": False}
    assert d["can_chi_nam"] == "Mậu Thân"


def test_doi_lich_duong_sang_am_va_nhuan():
    r = client.post("/v1/lich/doi", json={"chieu": "duong_sang_am", "ngay": 24, "thang": 10, "nam": 1988})
    assert r.json()["am"] == {"ngay": 14, "thang": 9, "nam": 1988, "nhuan": False}
    # 2023 nhuận tháng 2: 22/03/2023 = mùng 1 tháng 2 nhuận.
    r = client.post("/v1/lich/doi", json={"chieu": "am_sang_duong", "ngay": 1, "thang": 2, "nam": 2023, "nhuan": True})
    assert r.status_code == 200
    assert r.json()["duong"] == {"ngay": 22, "thang": 3, "nam": 2023}


def test_doi_lich_thang_nhuan_khong_ton_tai():
    r = client.post("/v1/lich/doi", json={"chieu": "am_sang_duong", "ngay": 1, "thang": 5, "nam": 2023, "nhuan": True})
    assert r.status_code == 422


def test_an_sao_nhap_am_mien_nam_1968():
    # Mùng 1 Tết Mậu Thân theo lịch miền Nam = 30/01/1968.
    a = an_sao(birth_date="1968-01-01", birth_time="10:00", calendar_type="am", noi_sinh="tp-ho-chi-minh")
    assert a["duong_lich_goc"] == "1968-01-30"
    assert "lich_am_mien_nam" in loai_co(a)
    b = an_sao(birth_date="1968-01-01", birth_time="10:00", calendar_type="am", noi_sinh="ha-noi")
    assert b["duong_lich_goc"] == "1968-01-29"


# ---- AL: ngày âm không tồn tại + thông tin đối chiếu (test viết trước) -------------------
def test_doi_lich_ngay_30_thang_thieu_bao_ro():
    r = client.post("/v1/lich/doi", json={"chieu": "am_sang_duong", "ngay": 30, "thang": 1, "nam": 2024})
    assert r.status_code == 422
    assert "chỉ có 29 ngày" in r.json()["detail"]


def test_doi_lich_tra_can_chi_va_thang_nhuan():
    d = client.post("/v1/lich/doi", json={"chieu": "duong_sang_am", "ngay": 1, "thang": 1, "nam": 2000}).json()
    assert d["can_chi_ngay"] == "Mậu Ngọ"
    assert d["am"]["nam"] == 1999 and d["can_chi_thang"] == "Bính Tý"     # 25/11 Kỷ Mão
    assert d["thang_nhuan_nam"] is None
    d = client.post("/v1/lich/doi", json={"chieu": "am_sang_duong", "ngay": 15, "thang": 6, "nam": 2025}).json()
    assert d["thang_nhuan_nam"] == 6 and d["so_ngay_thang"] in (29, 30)


def test_an_sao_ngay_am_khong_ton_tai_422():
    r = client.post("/v1/tuvi/an-sao", json={"birth_date": "2024-01-30", "birth_time": "10:00", "gender": "nam",
                                              "calendar_type": "am", "noi_sinh": "ha-noi"})
    assert r.status_code == 422, r.text
