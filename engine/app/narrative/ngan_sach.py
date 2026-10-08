# -*- coding: utf-8 -*-
"""RL-1 — hạn mức lượt gọi AI (OpenRouter), giữ trong bộ nhớ của tiến trình engine.

Web đã mở công khai, mỗi lượt AI tốn tiền thật. Ba hạn mức cửa sổ trượt (đặt qua env, có mặc định):
  - LLM_LUOT_NGUOI_GIO  — mỗi người gọi (IP đã băm) mỗi giờ        (mặc định 40)
  - LLM_LUOT_TONG_GIO   — tổng mọi người mỗi giờ                    (mặc định 400)
  - LLM_LUOT_TONG_NGAY  — tổng mọi người mỗi ngày (chặn hoá đơn)    (mặc định 3000)
Một lượt = một lần gọi OpenRouter (Luận giải toàn bộ mỗi chương một lượt).

Hết lượt: `kiem_luot()` ném `HetLuot` — mọi nơi gọi AI đã bọc try/except và rơi về bản template, nên người dùng
vẫn có câu trả lời đầy đủ, chỉ không qua AI. IP chỉ giữ dạng băm có muối ngẫu nhiên theo tiến trình, không ghi ra
đâu, mất khi khởi động lại. Engine chạy một tiến trình uvicorn (Dockerfile) nên hạn mức là chung.
"""
from __future__ import annotations

import contextvars
import hashlib
import os
import secrets
import threading
import time
from collections import deque

GIO, NGAY = 3600.0, 86400.0
NGUOI_GOI: contextvars.ContextVar[str | None] = contextvars.ContextVar("nguoi_goi", default=None)
_MUOI = secrets.token_bytes(16)


class HetLuot(Exception):
    def __init__(self, ly_do: str):
        super().__init__(f"hết lượt AI ({ly_do})")
        self.ly_do = ly_do


def bam(ip: str | None) -> str | None:
    if not ip:
        return None
    return hashlib.sha256(_MUOI + ip.strip().encode()).hexdigest()[:16]


class NganSach:
    def __init__(self, gio_nguoi: int, gio_tong: int, ngay_tong: int, dong_ho=time.monotonic):
        self.gio_nguoi, self.gio_tong, self.ngay_tong = gio_nguoi, gio_tong, ngay_tong
        self._dong_ho = dong_ho
        self._khoa = threading.Lock()
        self._gio: deque[float] = deque()
        self._ngay: deque[float] = deque()
        self._nguoi: dict[str, deque[float]] = {}

    @staticmethod
    def _cat(q: deque[float], moc: float) -> None:
        while q and q[0] <= moc:
            q.popleft()

    def xin(self, ai: str | None) -> str | None:
        """Xin một lượt. None = được (đã tính lượt); chuỗi = lý do từ chối (không tính lượt)."""
        with self._khoa:
            t = self._dong_ho()
            self._cat(self._gio, t - GIO)
            self._cat(self._ngay, t - NGAY)
            if len(self._ngay) >= self.ngay_tong:
                return "tong_ngay"
            if len(self._gio) >= self.gio_tong:
                return "tong_gio"
            q = self._nguoi.get(ai) if ai else None
            if q is not None:
                self._cat(q, t - GIO)
            if ai and len(q or ()) >= self.gio_nguoi:
                return "nguoi_goi_gio"
            if ai and q is None:
                if len(self._nguoi) > 50_000:          # dọn người đã hết hạn để bộ nhớ không phình
                    for k in [k for k, v in self._nguoi.items() if not v or v[-1] <= t - GIO]:
                        del self._nguoi[k]
                q = self._nguoi[ai] = deque()
            if q is not None:
                q.append(t)
            self._gio.append(t)
            self._ngay.append(t)
            return None

def _so(ten: str, mac_dinh: int) -> int:
    try:
        return int(os.environ.get(ten, "") or mac_dinh)
    except ValueError:
        return mac_dinh


def tu_env() -> NganSach:
    return NganSach(_so("LLM_LUOT_NGUOI_GIO", 40), _so("LLM_LUOT_TONG_GIO", 400), _so("LLM_LUOT_TONG_NGAY", 3000))


_chung = tu_env()


def kiem_luot() -> None:
    """Gọi ngay trước mỗi lần gọi OpenRouter. Hết lượt → ném HetLuot (nơi gọi rơi về template)."""
    ly_do = _chung.xin(NGUOI_GOI.get())
    if ly_do:
        raise HetLuot(ly_do)
