# -*- coding: utf-8 -*-
"""SPEC-005 — an sao tử vi đầy đủ qua iztro chạy cục bộ (Node subprocess).

Quyết định 2026-08-15: Python engine gọi iztro qua Node, KHÔNG viết lại logic an
sao. Quyết định 2026-09-30: ghim iztro bản đã sinh golden — 2.6.0 (2.5.8/2.6.0/
2.6.1 cho kết quả trùng khít 8 lá golden; 2.6.0 là bản mới nhất trên npm lúc
commit golden c173a95). Nâng bản = sinh lại golden + tăng ENGINE_VERSION.

Tầng CALC: tất định (cùng đầu vào → cùng lá số), không LLM, không DB, không mạng.
Giờ Tý tử vi theo iztro: 23:00–23:59 là giờ Tý của NGÀY HÔM SAU (time_index 12).
"""
from __future__ import annotations

import datetime as dt
import json
import os
import subprocess
from functools import lru_cache
from pathlib import Path

THU_MUC = Path(__file__).resolve().parents[2] / "ziwei"
SCRIPT = THU_MUC / "an_sao.mjs"
TIMEOUT_GIAY = 20


class AnSaoLoi(RuntimeError):
    """Không chạy được iztro (thiếu Node / thiếu node_modules / lỗi đầu vào)."""


def time_index(gio: int, phut: int) -> int:
    """Giờ đồng hồ (đã quy về kinh tuyến lịch) → chỉ số giờ của iztro.

    0 = Tý sớm 00:00–00:59 · 1 = Sửu 01–02:59 · … · 11 = Hợi 21–22:59 · 12 = Tý muộn 23:xx.
    """
    if not (0 <= gio <= 23 and 0 <= phut <= 59):
        raise ValueError("giờ/phút không hợp lệ")
    if gio == 0:
        return 0
    if gio == 23:
        return 12
    return (gio + 1) // 2


def _node() -> str:
    return os.environ.get("NODE_BIN", "node")


@lru_cache(maxsize=1)
def phien_ban_iztro() -> str:
    p = THU_MUC / "node_modules" / "iztro" / "package.json"
    if not p.exists():
        raise AnSaoLoi("Chưa cài iztro: chạy `npm ci --prefix engine/ziwei`.")
    return json.loads(p.read_text(encoding="utf-8"))["version"]


@lru_cache(maxsize=512)
def _chay(ngay: str, ti: int, gioi_tinh: str, ngon_ngu: str) -> str:
    phien_ban_iztro()   # kiểm tra đã cài
    try:
        kq = subprocess.run([_node(), str(SCRIPT)], cwd=THU_MUC, capture_output=True, text=True,
                            timeout=TIMEOUT_GIAY, check=False,
                            input=json.dumps({"ngay": ngay, "time_index": ti,
                                              "gioi_tinh": gioi_tinh, "ngon_ngu": ngon_ngu}))
    except FileNotFoundError as e:
        raise AnSaoLoi("Không tìm thấy Node.js (đặt NODE_BIN nếu không ở PATH).") from e
    except subprocess.TimeoutExpired as e:
        raise AnSaoLoi("iztro chạy quá thời gian.") from e
    if kq.returncode != 0:
        raise AnSaoLoi("iztro lỗi: " + kq.stderr.strip()[:300])
    return kq.stdout


def an_sao_tho(ngay_duong: dt.date, ti: int, gioi_tinh: str, ngon_ngu: str = "vi-VN") -> dict:
    """Lá số thô từ iztro. `ngay_duong` là ngày dương theo kinh tuyến lịch UTC+7."""
    if not 0 <= ti <= 12:
        raise ValueError("time_index phải trong 0..12")
    if gioi_tinh not in ("nam", "nu"):
        raise ValueError("gioi_tinh phải là 'nam' hoặc 'nu'")
    s = _chay(f"{ngay_duong.year}-{ngay_duong.month}-{ngay_duong.day}", ti, gioi_tinh, ngon_ngu)
    return json.loads(s)
