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
from collections.abc import Callable

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


class BiCat(RuntimeError):
    """Bản AI bị cắt ở giới hạn max_tokens (finish_reason = length) — coi như lỗi, nơi gọi rơi về bản gốc."""


def goi_chat(messages: list[dict], *, nhiet_do: float, max_tokens: int, mo_hinh: str | None = None,
             het_gio: float = 45, nho: bool = True, tru_luot: bool = True,
             kiem: "Callable[[str], list] | None" = None, thu_lai: bool = True) -> str:
    """→ nội dung trả lời (chuỗi). Lỗi mạng / HTTP lần hai, hết lượt (`HetLuot`), bị cắt (`BiCat`), thiếu khoá → ném lỗi.
    `kiem` = bộ kiểm của nơi gọi — chỉ nhớ bản QUA kiểm (bản bị loại không lặp lại từ bộ nhớ). `tru_luot=False`: lời
    gọi có hạn mức riêng (quản trị), không trừ lượt AI của người dùng. Hết giờ không thử lại (đã chờ đủ lâu).
    `thu_lai=False`: lỗi lần đầu là lỗi luôn (lời gọi có hạn chót ngắn — phân loại câu hỏi, ≤ 2 giây)."""
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
    if tru_luot:
        _ngan_sach.kiem_luot()
    for lan in range(2 if thu_lai else 1):
        try:
            with httpx.Client(timeout=het_gio) as c:
                r = c.post(OPENROUTER_URL, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                           json={"model": mo_hinh, "temperature": nhiet_do, "max_tokens": max_tokens,
                                 "messages": messages})
            if r.status_code in _THU_LAI_MA and lan == 0 and thu_lai:
                time.sleep(1.5)
                continue
            r.raise_for_status()
            ch = r.json()["choices"][0]
            if ch.get("finish_reason") == "length":
                raise BiCat("bản AI bị cắt ở giới hạn độ dài")
            van = ch["message"]["content"]
            break
        except httpx.TimeoutException:
            raise
        except httpx.TransportError:
            if lan == 0 and thu_lai:
                time.sleep(1.5)
                continue
            raise
    if k and not (kiem and kiem(van)):
        with _NHO_KHOA:
            _NHO[k] = (time.time(), van)
            while len(_NHO) > _NHO_TOI_DA:
                _NHO.popitem(last=False)
    return van
