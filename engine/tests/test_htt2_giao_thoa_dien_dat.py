# -*- coding: utf-8 -*-
"""HTT-2 H5 — AI diễn đạt lại hộp "Điểm giao thoa" (giao_thoa.dien_dat): bản tất định là bản chính, AI chỉ diễn đạt qua bộ kiểm
chung; thiếu khoá / tiếng Anh / không qua kiểm → giữ bản mẫu. Viết trước hàm."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.luangiai import giao_thoa
from app.main import app
from app.narrative import luan_giai_van as lgv

client = TestClient(app)
PHIEU = [{"ma": "ds.su_nghiep.e2e.thuan", "ket_qua": "dung"}, {"ma": "ds.bt.su_nghiep.e2e.thuan", "ket_qua": "dung"},
         {"ma": "ds.tien_bac.e2e.thuan", "ket_qua": "dung"}]


def test_khong_khoa_thi_ban_mau(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    kq = giao_thoa.dien_dat(giao_thoa.lap(PHIEU))
    assert kq["dien_dat"] == "mau" and "van_ai" not in kq and kq["hop"]


def test_ai_dien_dat_qua_kiem_giu_hop_tat_dinh(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    goi = []
    monkeypatch.setattr(lgv, "_goi_llm", lambda tieu_de, doan, mo_dun: (goi.append(mo_dun), "Nhìn chung: " + " ".join(doan))[1])
    goc = giao_thoa.lap(PHIEU)
    kq = giao_thoa.dien_dat(goc)
    assert kq["dien_dat"] == "ai" and kq["van_ai"].startswith("Nhìn chung") and goi == ["giao_thoa"]
    assert kq["hop"] == goc["hop"] and kq["tom_tat"] == goc["tom_tat"]        # lớp tất định không đổi


def test_ai_them_y_moi_thi_ve_ban_mau(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    monkeypatch.setattr(lgv, "_goi_llm", lambda tieu_de, doan, mo_dun: "Bạn chắc chắn sẽ trúng số 7 tỷ vào năm 2031.")
    kq = giao_thoa.dien_dat(giao_thoa.lap(PHIEU))
    assert kq["dien_dat"] == "mau" and "van_ai" not in kq


def test_tieng_anh_khong_goi_ai(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    monkeypatch.setattr(lgv, "_goi_llm", lambda *a: (_ for _ in ()).throw(AssertionError("không được gọi")))
    with ngon_ngu.dung("en"):
        kq = giao_thoa.dien_dat(giao_thoa.lap(PHIEU))
    assert kq["dien_dat"] == "mau"


def test_route_chi_dien_dat_khi_web_bat(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    monkeypatch.setattr(lgv, "_goi_llm", lambda tieu_de, doan, mo_dun: "Nhìn chung: " + " ".join(doan))
    a = client.post("/v1/giao-thoa", json={"phieu": PHIEU}).json()
    assert "dien_dat" not in a and "van_ai" not in a
    b = client.post("/v1/giao-thoa", json={"phieu": PHIEU, "dien_dat": True}).json()
    assert b["dien_dat"] == "ai" and b["van_ai"]
