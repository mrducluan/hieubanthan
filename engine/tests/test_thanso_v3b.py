# -*- coding: utf-8 -*-
"""TS-V3b — Cây của hai người (đường nối Sephirah hai người), thẻ hôm nay (ngày cá nhân + số nổi bật + chữ của ngày),
báo cáo ba phái (chương đầu miễn phí, mở bằng Sao ở tầng web). RULES thuần, không LLM, không DB.

Ca chuẩn Nguyễn Đức Luân 24/10/1988: Sephirah ngày sinh 6 (Tiferet), số nổi bật 6 (5 nguồn).
Người 01/01/2000: tổng chữ số ngày sinh 4 → Sephirah 4 (Chesed). Tiferet–Chesed nối thẳng bằng chữ Yod (đường 20).
"""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app.luangiai import bao_cao_ba_phai, the_ngay, thanso_kabbalah as lkb
from app.main import app

LUAN = (["Nguyễn Đức Luân"], 24, 10, 1988)
NGAY = dt.date(2026, 10, 20)
client = TestClient(app)


def test_cay_hai_nguoi_ke_nhau():
    kq = lkb.cay_hai_nguoi(6, 4)
    assert [t["so"] for t in kq["tram"]] == [6, 4] and kq["tram"][0]["ten"] == "Tiferet"
    assert [c["ten"] for c in kq["con_duong"]] == ["Yod"] and kq["con_duong"][0]["so_duong_cay"] == 20
    assert kq["con_duong"][0]["nghia"]["cau_tu_soi"]
    assert "Yod" in kq["cach_doc_rieng"] and kq["so_loi"] == 1
    assert "điểm" not in kq["cach_doc_rieng"].lower() and kq["luu_y"]


def test_cay_hai_nguoi_cung_tram_va_nhieu_loi():
    cung = lkb.cay_hai_nguoi(6, 6)
    assert cung["cung_tram"] and cung["con_duong"] == [] and "Tiferet" in cung["cach_doc_rieng"]
    xa = lkb.cay_hai_nguoi(10, 2)
    assert len(xa["con_duong"]) == 3 and xa["so_loi"] > 1 and xa["ghi_chu_loi"]
    assert xa["tram"][0]["ten"] == "Malkuth"


def test_api_cay_hai_nguoi():
    r = client.post("/v1/thanso/cay-hai-nguoi", json={"a": {"ngay": 24, "thang": 10, "nam": 1988},
                                                       "b": {"ngay": 1, "thang": 1, "nam": 2000}})
    assert r.status_code == 200 and [c["ten"] for c in r.json()["con_duong"]] == ["Yod"]
    # Người mời chỉ mang Sephirah (đã ký trong link) — không cần ngày sinh của họ.
    r = client.post("/v1/thanso/cay-hai-nguoi", json={"a": {"sephirah": 6}, "b": {"ngay": 1, "thang": 1, "nam": 2000}})
    assert r.status_code == 200 and r.json()["tram"][0]["so"] == 6
    assert client.post("/v1/thanso/cay-hai-nguoi", json={"a": {"sephirah": 11}, "b": {"sephirah": 2}}).status_code == 422
    assert client.post("/v1/thanso/cay-hai-nguoi", json={"a": {"ngay": 31, "thang": 2, "nam": 2000},
                                                          "b": {"sephirah": 2}}).status_code == 422


def test_the_ngay():
    kq = the_ngay.the_ngay(*LUAN, NGAY)
    assert kq["ngay_xem"] == "2026-10-20" and kq["ngay_ca_nhan"]["so"] == 2
    assert kq["chu_ngay"]["ten"] == "Resh" and kq["chu_ngay"]["chu"] == 20 and kq["chu_ngay"]["nghia"]["cau_tu_soi"]
    assert kq["so_noi_bat"]["goc"] == 6 and kq["so_noi_bat"]["lan"] == 5 and kq["so_noi_bat"]["tu_khoa"]
    khong_ten = the_ngay.the_ngay(None, 24, 10, 1988, NGAY)
    assert khong_ten["so_noi_bat"] is None and khong_ten["chu_ngay"]["ten"] == "Resh"


def test_api_the_ngay():
    r = client.post("/v1/thanso/the-ngay", json={"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988,
                                                 "ngay_xem": "2026-10-20"})
    assert r.status_code == 200 and r.json()["so_noi_bat"]["goc"] == 6
    r = client.post("/v1/thanso/the-ngay", json={"ngay": 24, "thang": 10, "nam": 1988, "ngay_xem": "2026-10-20"})
    assert r.status_code == 200 and r.json()["so_noi_bat"] is None


def test_bao_cao_ba_phai():
    bc = bao_cao_ba_phai.bao_cao(*LUAN, NGAY, phieu={"chaldea": 4, "pitago": 2, "kabbalah": 1})
    assert [c["ma"] for c in bc["chuong"]] == ["diem_chung", "pitago", "chaldea", "kabbalah", "khac_nhau", "phai_hop"]
    assert bc["mo_dun"] == "thanso3" and bc["ket"]
    for c in bc["chuong"]:
        assert c["doan"] and c["moi_xem"]["cau_hoi"] and c["moi_xem"]["so_doan"] == len(c["doan"])
        assert "1988" not in " ".join(c["doan"]) and "Luân" not in " ".join(c["doan"])
    assert "6" in bc["chuong"][0]["doan"][0]
    hop = " ".join(bc["chuong"][-1]["doan"])
    assert "Chaldea" in hop and "4/7" in hop
    chua = bao_cao_ba_phai.bao_cao(*LUAN, NGAY)
    assert "chưa" in " ".join(chua["chuong"][-1]["doan"]).lower()


def test_api_bao_cao_ba_phai_nhan_tham_so_web():
    body = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988, "ngay_xem": "2026-10-20",
            "phieu": {"pitago": 3, "chaldea": 3, "kabbalah": 1}, "dien_dat_toi_da": 1}
    r = client.post("/v1/thanso/bao-cao-ba-phai", json=body)
    assert r.status_code == 200 and len(r.json()["chuong"]) == 6
    assert "ngang nhau" in " ".join(r.json()["chuong"][-1]["doan"])
    assert client.post("/v1/thanso/bao-cao-ba-phai", json={**body, "phieu": {"vedic": 2}}).status_code == 422


def test_ba_goc_nhin():
    kq = bao_cao_ba_phai.ba_goc_nhin(*LUAN, "su_nghiep")
    assert [g["phai"] for g in kq["goc_nhin"]] == ["pitago", "chaldea", "kabbalah"]
    assert kq["goc_nhin"][0]["nhan"] == "Đường đời 33" and kq["mat"] == "cong_viec"
    assert kq["goc_nhin"][1]["nhan"] == "Số tên gọi 15/6" and kq["goc_nhin"][2]["nhan"].startswith("Con đường của tên 7")
    assert all(g["y"] and "Luân" not in g["y"] for g in kq["goc_nhin"])
    assert bao_cao_ba_phai.ba_goc_nhin(*LUAN, "tinh_yeu")["mat"] == "tinh_cam"
    assert bao_cao_ba_phai.ba_goc_nhin(*LUAN, None)["mat"] == "tong_quan"
    r = client.post("/v1/thanso/ba-goc-nhin", json={"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988,
                                                    "linh_vuc": "su_nghiep"})
    assert r.status_code == 200 and len(r.json()["goc_nhin"]) == 3


def test_ten_khong_co_chu_cai_khong_lo_none():
    bc = bao_cao_ba_phai.bao_cao(["123"], 24, 10, 1988, NGAY, phieu={"pitago": 1})
    chu = " ".join(" ".join(c["doan"]) for c in bc["chuong"])
    assert "None" not in chu and " 0 —" not in chu and all(c["doan"] for c in bc["chuong"])
    assert "đủ 7 lần" in " ".join(bc["chuong"][-1]["doan"])
    g = bao_cao_ba_phai.ba_goc_nhin(["123"], 24, 10, 1988, None)["goc_nhin"]
    assert [x["phai"] for x in g] == ["pitago"] and all("None" not in x["nhan"] for x in g)
    assert client.post("/v1/thanso/the-ngay", json={"ngay": 1, "thang": 1, "nam": 2000, "ngay_xem": "9999-12-31"}).status_code == 422
