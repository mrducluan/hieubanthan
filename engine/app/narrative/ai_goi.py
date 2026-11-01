# -*- coding: utf-8 -*-
"""EN-4 (mục 3) — MỘT hàm gọi AI (OpenRouter) cho mọi lớp diễn đạt: hỏi đáp, luận giải từng chương, quản trị.

- `max_tokens` luôn đặt (bản AI không dài quá nguồn).
- Thử lại MỘT lần, giãn cách, khi 429 / 5xx / hết giờ / mất kết nối; lỗi lần hai → báo lỗi, nơi gọi rơi về template.
- Nhớ kết quả theo mã băm (bản prompt + mô hình + nhiệt độ + max_tokens + tin nhắn): xem lại cùng gói đầu vào không gọi
  AI, không tốn lượt RL-1. Chỉ nhớ TRONG BỘ NHỚ tiến trình, tự hết hạn (`AI_NHO_GIAY`, mặc định 7 ngày), không ghi đĩa.
- Lượt AI (`ngan_sach.kiem_luot`) chỉ trừ khi thật sự gọi mạng.
Ảnh (đọc ảnh nhà) gọi với `nho=False` — không nhớ dữ liệu ảnh.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
import time
from collections import OrderedDict

import httpx

from app.narrative import ngan_sach as _ngan_sach

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
PHIEN_BAN_PROMPT = "2026-11-01"          # đổi khi đổi lời nhắc hệ thống → bộ nhớ cũ tự hết hiệu lực
_THU_LAI_MA = {429, 500, 502, 503, 504}
_NHO: OrderedDict[str, tuple[float, str]] = OrderedDict()
_NHO_KHOA = threading.Lock()
_NHO_TOI_DA = 1000


def _han_nho() -> float:
    try:
        return float(os.environ.get("AI_NHO_GIAY", str(7 * 24 * 3600)))
    except ValueError:
        return 7 * 24 * 3600


def xoa_nho() -> None:
    with _NHO_KHOA:
        _NHO.clear()


def _khoa(mo_hinh: str, nhiet_do: float, max_tokens: int, messages: list[dict]) -> str:
    raw = json.dumps([PHIEN_BAN_PROMPT, mo_hinh, nhiet_do, max_tokens, messages], ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def goi_chat(messages: list[dict], *, nhiet_do: float, max_tokens: int, mo_hinh: str | None = None,
             het_gio: float = 45, nho: bool = True) -> str:
    """→ nội dung trả lời (chuỗi). Lỗi mạng / HTTP lần hai, hết lượt (`HetLuot`), thiếu khoá → ném lỗi."""
    from app.narrative.llm import DEFAULT_MODEL  # noqa: PLC0415 — tránh vòng import
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise RuntimeError("Chưa cấu hình khoá AI")
    mo_hinh = mo_hinh or os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)
    k = _khoa(mo_hinh, nhiet_do, max_tokens, messages) if nho else None
    if k:
        with _NHO_KHOA:
            o = _NHO.get(k)
            if o and time.time() - o[0] < _han_nho():
                _NHO.move_to_end(k)
                return o[1]
    _ngan_sach.kiem_luot()
    for lan in range(2):
        try:
            with httpx.Client(timeout=het_gio) as c:
                r = c.post(OPENROUTER_URL, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                           json={"model": mo_hinh, "temperature": nhiet_do, "max_tokens": max_tokens,
                                 "messages": messages})
            if r.status_code in _THU_LAI_MA and lan == 0:
                time.sleep(1.5)
                continue
            r.raise_for_status()
            van = r.json()["choices"][0]["message"]["content"]
            break
        except (httpx.TimeoutException, httpx.TransportError):
            if lan == 0:
                time.sleep(1.5)
                continue
            raise
    if k:
        with _NHO_KHOA:
            _NHO[k] = (time.time(), van)
            while len(_NHO) > _NHO_TOI_DA:
                _NHO.popitem(last=False)
    return van
