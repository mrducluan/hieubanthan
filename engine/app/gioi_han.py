# -*- coding: utf-8 -*-
"""SEC-1 — hạn mức yêu cầu theo người gọi (chống spam làm sập engine), giữ trong bộ nhớ tiến trình.

Khác RL-1 (`narrative/ngan_sach.py`, chỉ đếm lượt gọi AI tốn tiền): đây đếm MỌI yêu cầu /v1 của một người gọi
(IP người dùng web chuyển qua `x-nguoi-goi`, đã băm có muối), cửa sổ trượt 60 giây, mặc định 120 yêu cầu/phút
(env `ENGINE_LUOT_PHUT`). Người dùng thật bấm tay không chạm ngưỡng; công cụ dò/spam bị chặn 429. Yêu cầu không mang
người gọi (trang SEO dựng phía máy chủ web) không bị giới hạn ở đây.
"""
from __future__ import annotations

import os
import threading
import time
from collections import deque

PHUT = 60.0


class HanMuc:
    def __init__(self, moi_phut: int, dong_ho=time.monotonic):
        self.moi_phut = moi_phut
        self._dong_ho = dong_ho
        self._khoa = threading.Lock()
        self._nguoi: dict[str, deque[float]] = {}

    def xin(self, ai: str | None) -> bool:
        """True = được phục vụ (đã tính lượt); False = quá hạn mức."""
        if not ai or self.moi_phut <= 0:
            return True
        with self._khoa:
            t = self._dong_ho()
            q = self._nguoi.get(ai)
            if q is None:
                if len(self._nguoi) > 50_000:          # dọn người đã im lặng để bộ nhớ không phình
                    for k in [k for k, v in self._nguoi.items() if not v or v[-1] <= t - PHUT]:
                        del self._nguoi[k]
                q = self._nguoi[ai] = deque()
            while q and q[0] <= t - PHUT:
                q.popleft()
            if len(q) >= self.moi_phut:
                return False
            q.append(t)
            return True


def _so(ten: str, mac_dinh: int) -> int:
    try:
        return int(os.environ.get(ten, "") or mac_dinh)
    except ValueError:
        return mac_dinh


_chung = HanMuc(_so("ENGINE_LUOT_PHUT", 120))


def xin(ai: str | None) -> bool:
    return _chung.xin(ai)
