# -*- coding: utf-8 -*-
"""SEC-1 — kiểm thử bảo mật lớp vỏ engine.

- Khoá service-to-service: sai/thiếu khoá → 401; /health luôn mở và báo engine có đang bật khoá hay không
  (để chủ dự án tự kiểm production chỉ bằng một lần mở /health).
- Hạn mức yêu cầu theo người gọi (chống spam làm sập engine): quá hạn → 429, lời tiếng Việt; người khác không bị ảnh hưởng.
- Đầu vào: tên quá dài bị từ chối (chống gửi chuỗi khổng lồ).
- Lỗi nội bộ (iztro/Node) KHÔNG lộ chi tiết máy (đường dẫn, stderr) ra người dùng.
"""
from __future__ import annotations

import datetime as _dt

import pytest
from fastapi.testclient import TestClient

from app import gioi_han, main
from app.calc import tuvi_an_sao

c = TestClient(main.app)


def test_khoa_engine(monkeypatch):
    monkeypatch.setenv("ENGINE_API_KEY", "khoa-bi-mat-dai-hon-16")
    body = {"chieu": "duong_sang_am", "ngay": 1, "thang": 1, "nam": 2000}
    assert c.post("/v1/lich/doi", json=body).status_code == 401
    assert c.post("/v1/lich/doi", json=body, headers={"x-engine-key": "sai"}).status_code == 401
    assert c.post("/v1/lich/doi", json=body, headers={"x-engine-key": "khoa-bi-mat-dai-hon-16"}).status_code == 200
    h = c.get("/health")
    assert h.status_code == 200 and h.json()["khoa_engine"] is True


def test_health_bao_khi_tat_khoa(monkeypatch):
    monkeypatch.delenv("ENGINE_API_KEY", raising=False)
    assert c.get("/health").json()["khoa_engine"] is False


def test_han_muc_theo_nguoi_goi(monkeypatch):
    monkeypatch.setattr(gioi_han, "_chung", gioi_han.HanMuc(3))
    body = {"chieu": "duong_sang_am", "ngay": 1, "thang": 1, "nam": 2000}
    a = {"x-nguoi-goi": "203.0.113.7"}
    for _ in range(3):
        assert c.post("/v1/lich/doi", json=body, headers=a).status_code == 200
    r = c.post("/v1/lich/doi", json=body, headers=a)
    assert r.status_code == 429 and "thử lại" in r.json()["detail"]
    assert c.post("/v1/lich/doi", json=body, headers={"x-nguoi-goi": "198.51.100.9"}).status_code == 200
    assert c.get("/health", headers=a).status_code == 200          # /health không tính lượt


def test_han_muc_cua_so_truot():
    t = [0.0]
    hm = gioi_han.HanMuc(2, dong_ho=lambda: t[0])
    assert hm.xin("a") and hm.xin("a") and not hm.xin("a")
    t[0] = 61.0
    assert hm.xin("a")
    assert hm.xin(None) and hm.xin(None) and hm.xin(None)          # không có người gọi → không giới hạn ở đây


def test_ten_qua_dai_bi_tu_choi():
    r = c.post("/v1/thanso/luan-giai", json={"ho_ten": ["A" * 200], "ngay": 1, "thang": 1, "nam": 2000})
    assert r.status_code == 422


def test_loi_iztro_khong_lo_chi_tiet(monkeypatch):
    def hong(*a, **k):
        raise tuvi_an_sao.AnSaoLoi("iztro lỗi: Error at /srv/app/ziwei/an_sao.mjs:12")
    monkeypatch.setattr(tuvi_an_sao, "an_sao_tho", hong)
    r = c.post("/v1/tuvi/an-sao", json={"birth_date": "1990-05-12", "birth_time": "10:30", "gender": "nam",
                                        "noi_sinh": "ha-noi"})
    assert r.status_code == 503
    assert "/srv" not in r.text and "an_sao.mjs" not in r.text


# --------------------------------------------------------------------------- #
# SEC-2
# --------------------------------------------------------------------------- #
def test_than_qua_lon_bi_tu_choi_truoc_khi_doc():
    body = {"chieu": "duong_sang_am", "ngay": 1, "thang": 1, "nam": 2000}
    assert c.post("/v1/lich/doi", json=body, headers={"content-length": "3000000"}).status_code == 413
    assert c.post("/v1/lich/doi", json=body).status_code == 200


def test_render_thieu_khoa_thi_khong_khoi_dong(monkeypatch):
    import importlib
    monkeypatch.setenv("RENDER", "true")
    monkeypatch.delenv("ENGINE_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="ENGINE_API_KEY"):
        importlib.reload(main)
    monkeypatch.setenv("ENGINE_API_KEY", "khoa-bi-mat-dai-hon-16")
    m = importlib.reload(main)
    assert m.app.docs_url is None and m.app.openapi_url is None
    monkeypatch.delenv("RENDER")
    monkeypatch.delenv("ENGINE_API_KEY")
    importlib.reload(main)


def test_kb_status_khong_lo_dia_chi_supabase(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://abcdefghijklmnop.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "x")
    from app.kb import store

    def _hong(*_a, **_k):
        raise RuntimeError("GET https://abcdefghijklmnop.supabase.co/rest/v1/x 500")
    monkeypatch.setattr(store, "_from_supabase", _hong)
    s = str(store.chan_doan())
    assert "supabase.co" not in s and "abcdefgh" not in s


def test_loi_llm_khong_lo_dia_chi_nha_cung_cap():
    from app.narrative.ngan_sach import mo_ta_loi
    e = RuntimeError("Client error '401' for url 'https://openrouter.ai/api/v1/chat/completions'")
    assert "openrouter" not in mo_ta_loi(e) and "401" in mo_ta_loi(e)
