# -*- coding: utf-8 -*-
"""TS-V3b — thẻ hôm nay (ngày cá nhân + số nổi bật qua hai phái) và "Phái nào nói đúng về bạn?" (mỗi phái một câu).
Qabalah đã bỏ (chủ dự án 2026-10-20). RULES thuần, không LLM, không DB.

Ca chuẩn Nguyễn Đức Luân 24/10/1988: số nổi bật 6 (5 nguồn: chung · Pitago LH · Chaldea tên gọi, ngày sinh, linh hồn).
"""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.luangiai import phai_nao_dung, the_ngay
from app.main import app

LUAN = (["Nguyễn Đức Luân"], 24, 10, 1988)
NGAY = dt.date(2026, 10, 20)
client = TestClient(app)


def test_the_ngay():
    kq = the_ngay.the_ngay(*LUAN, NGAY)
    assert kq["ngay_xem"] == "2026-10-20" and kq["ngay_ca_nhan"]["so"] == 2
    assert kq["so_noi_bat"]["goc"] == 6 and kq["so_noi_bat"]["lan"] == 5 and kq["so_noi_bat"]["tu_khoa"]
    assert "chu_ngay" not in kq
    assert the_ngay.the_ngay(None, 24, 10, 1988, NGAY)["so_noi_bat"] is None


def test_api_the_ngay():
    r = client.post("/v1/thanso/the-ngay", json={"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988,
                                                 "ngay_xem": "2026-10-20"})
    assert r.status_code == 200 and r.json()["so_noi_bat"]["goc"] == 6
    assert client.post("/v1/thanso/the-ngay", json={"ngay": 1, "thang": 1, "nam": 2000, "ngay_xem": "9999-12-31"}).status_code == 422


def test_ba_goc_nhin_hai_phai():
    kq = phai_nao_dung.ba_goc_nhin(*LUAN, "su_nghiep")
    assert [g["phai"] for g in kq["goc_nhin"]] == ["pitago", "chaldea"] and kq["mat"] == "cong_viec"
    assert kq["goc_nhin"][0]["nhan"] == "Đường đời 33" and kq["goc_nhin"][1]["nhan"] == "Số tên gọi 15/6"
    assert phai_nao_dung.ba_goc_nhin(*LUAN, "su_nghiep", "tung_phan")["goc_nhin"][0]["nhan"] == "Đường đời 6"
    assert all(g["y"] and "Luân" not in g["y"] for g in kq["goc_nhin"])
    g = phai_nao_dung.ba_goc_nhin(["123"], 24, 10, 1988, None)["goc_nhin"]
    assert [x["phai"] for x in g] == ["pitago"]


def test_qabalah_da_bo():
    for duong in ("/v1/thanso/kabbalah", "/v1/thanso/cay-hai-nguoi", "/v1/thanso/bao-cao-ba-phai"):
        assert client.post(duong, json={}).status_code == 404
    r = client.post("/v1/thanso/hoi", json={"ho_ten": ["A"], "ngay": 1, "thang": 1, "nam": 2000, "cau_hoi": "Tôi là ai?",
                                             "phai": "kabbalah"})
    assert r.status_code == 422
