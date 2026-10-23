# -*- coding: utf-8 -*-
"""Giám sát lỗi engine qua Sentry (hạ tầng GĐ1, docs/KIEN-TRUC-VAN-HANH.md).

Chỉ bật khi có env SENTRY_DSN. Chỉ gửi loại lỗi + stack trace + đường dẫn (không query) —
KHÔNG gửi body (ngày giờ sinh, tên, câu hỏi), cookie, header khoá, IP.
"""
from __future__ import annotations

import os

from app.config import ENGINE_VERSION

_HEADER_GIU = {"user-agent", "content-type", "content-length", "host"}


def loc_su_kien(su_kien: dict, _goi_y: dict) -> dict:
    r = su_kien.get("request")
    if isinstance(r, dict):
        for k in ("data", "cookies", "query_string", "env"):
            r.pop(k, None)
        if isinstance(r.get("url"), str):
            r["url"] = r["url"].split("?", 1)[0]
        if isinstance(r.get("headers"), dict):
            r["headers"] = {k: v for k, v in r["headers"].items() if k.lower() in _HEADER_GIU}
    for k in ("user", "extra"):
        su_kien.pop(k, None)
    # SEC-2: biến cục bộ trong khung lỗi chứa tên, ngày giờ sinh, câu hỏi → bỏ (dự phòng cho include_local_variables).
    for ex in (su_kien.get("exception") or {}).get("values") or []:
        for f in ((ex or {}).get("stacktrace") or {}).get("frames") or []:
            if isinstance(f, dict):
                f.pop("vars", None)
    return su_kien


def cau_hinh(dsn: str) -> dict:
    return {
        "dsn": dsn,
        "release": f"engine@{ENGINE_VERSION}",
        "environment": os.environ.get("SENTRY_ENVIRONMENT", "production"),
        "send_default_pii": False,
        "max_request_body_size": "never",
        "include_local_variables": False,   # SEC-2: không gửi biến cục bộ (dữ liệu người dùng) kèm stack trace
        "traces_sample_rate": 0.0,
        "before_send": loc_su_kien,
    }


def khoi_tao() -> bool:
    dsn = os.environ.get("SENTRY_DSN")
    if not dsn:
        return False
    import sentry_sdk

    sentry_sdk.init(**cau_hinh(dsn))
    return True
