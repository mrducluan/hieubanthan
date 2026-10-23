# -*- coding: utf-8 -*-
"""Hạ tầng GĐ1 — giám sát lỗi (Sentry) cho engine.

Bắt buộc: TẮT hẳn khi không có SENTRY_DSN (dev, test, CI) và KHÔNG BAO GIỜ gửi dữ liệu cá nhân
(ngày giờ sinh, tên, câu hỏi nằm trong body; header khoá engine) — NĐ 13/2023.
"""
from __future__ import annotations

from app import giam_sat


def test_khong_dsn_thi_khong_bat(monkeypatch):
    monkeypatch.delenv("SENTRY_DSN", raising=False)
    assert giam_sat.khoi_tao() is False


def test_cau_hinh_khong_gui_du_lieu_ca_nhan():
    ch = giam_sat.cau_hinh("https://k@o.ingest.sentry.io/1")
    assert ch["send_default_pii"] is False
    assert ch["max_request_body_size"] == "never"
    assert ch["traces_sample_rate"] == 0.0


def test_loc_su_kien_xoa_body_header_cookie_query():
    su_kien = {
        "request": {
            "url": "https://e/v1/tuvi/an-sao?birth_date=1990-05-17",
            "query_string": "birth_date=1990-05-17",
            "data": {"birth_date": "1990-05-17", "ho_ten": "Nguyễn Văn An"},
            "headers": {"x-engine-key": "bi-mat", "user-agent": "x"},
            "cookies": {"a": "b"},
        },
        "user": {"ip_address": "1.2.3.4"},
        "extra": {"body": "1990"},
    }
    ra = giam_sat.loc_su_kien(su_kien, {})
    r = ra["request"]
    assert "data" not in r and "cookies" not in r and "query_string" not in r
    assert r["url"] == "https://e/v1/tuvi/an-sao"
    assert "x-engine-key" not in r["headers"]
    assert "user" not in ra and "extra" not in ra


def test_khong_gui_bien_cuc_bo_trong_stack_trace():
    """SEC-2: biến cục bộ (inp, cau_hoi…) chứa tên + ngày sinh → không bao giờ rời máy chủ."""
    assert giam_sat.cau_hinh("https://k@o.ingest.sentry.io/1")["include_local_variables"] is False
    su_kien = {"exception": {"values": [{"stacktrace": {"frames": [
        {"function": "api", "vars": {"inp": "{'ho_ten': ['Nguyễn Văn An'], 'nam': 1990}"}}]}}]}}
    ra = giam_sat.loc_su_kien(su_kien, {})
    assert "vars" not in ra["exception"]["values"][0]["stacktrace"]["frames"][0]
