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

EN-6 — KHO ĐẾM CHUNG khi chạy nhiều tiến trình / nhiều máy: đặt `HAN_MUC_REDIS_URL` (https) + `HAN_MUC_REDIS_TOKEN`
(Redis REST kiểu Upstash, gọi bằng httpx có sẵn — không thêm thư viện) → `NganSachRedis` đếm theo cửa sổ CỐ ĐỊNH (giờ,
ngày) trong Redis, mọi tiến trình thấy cùng một con số. Khoá Redis chỉ chứa mã băm người gọi (muối chung suy từ token, để
các tiến trình băm ra cùng mã), không IP. Kho lỗi / chậm quá 0,5 s → lượt đó đếm trong bộ nhớ tiến trình (vẫn có trần),
không ném lỗi. Không đặt env → y như cũ. Hạn mức chống spam `app/gioi_han.py` vẫn đếm theo tiến trình (chạy trong
middleware bất đồng bộ — gọi mạng ở đó sẽ chặn vòng sự kiện; chống spam không cần chính xác tuyệt đối).
"""
from __future__ import annotations

import contextvars
import hashlib
import os
import re
import secrets
import threading
import time
from collections import deque

GIO, NGAY = 3600.0, 86400.0
NGUOI_GOI: contextvars.ContextVar[str | None] = contextvars.ContextVar("nguoi_goi", default=None)
_MUOI = secrets.token_bytes(16)       # muối ngẫu nhiên theo tiến trình (khi không có kho chung)


def mo_ta_loi(e: BaseException, toi_da: int = 120) -> str:
    """SEC-2: lời lỗi LLM để chẩn đoán — bỏ URL (lỗi httpx mang địa chỉ nhà cung cấp AI, trái BM-1)."""
    return re.sub(r"https?://\S+", "<url>", str(e))[:toi_da]


class HetLuot(Exception):
    def __init__(self, ly_do: str):
        super().__init__(f"hết lượt AI ({ly_do})")
        self.ly_do = ly_do


def _muoi() -> bytes:
    """Có kho đếm chung → muối chung (suy từ token, mọi tiến trình băm cùng một IP ra cùng mã); không có → ngẫu nhiên."""
    tk = os.environ.get("HAN_MUC_REDIS_TOKEN", "")
    return hashlib.sha256(b"hbt-han-muc|" + tk.encode()).digest()[:16] if tk else _MUOI


def bam(ip: str | None) -> str | None:
    if not ip:
        return None
    return hashlib.sha256(_muoi() + ip.strip().encode()).hexdigest()[:16]


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

class NganSachRedis:
    """Cùng giao diện `xin()` như NganSach nhưng đếm trong Redis REST (cửa sổ cố định giờ / ngày, chung mọi tiến trình)."""

    def __init__(self, url: str, token: str, gio_nguoi: int, gio_tong: int, ngay_tong: int, client=None,
                 dong_ho=time.time, cho: float = 0.5):
        import httpx  # noqa: PLC0415 — chỉ nạp khi bật kho chung
        self._url = url.rstrip("/") + "/pipeline"
        self._dau = {"Authorization": f"Bearer {token}"}
        self.gio_nguoi, self.gio_tong, self.ngay_tong = gio_nguoi, gio_tong, ngay_tong
        self._client = client or httpx.Client(timeout=cho)
        self._dong_ho = dong_ho
        self._du_phong = NganSach(gio_nguoi, gio_tong, ngay_tong)

    def __repr__(self) -> str:                      # không bao giờ in token
        return f"NganSachRedis(gio_nguoi={self.gio_nguoi}, gio_tong={self.gio_tong}, ngay_tong={self.ngay_tong})"

    def _goi(self, lenh: list[list]) -> list:
        r = self._client.post(self._url, headers=self._dau, json=lenh)
        if r.status_code >= 400:
            raise RuntimeError(f"kho đếm {r.status_code}")
        ra = r.json()
        if not isinstance(ra, list) or len(ra) != len(lenh) or any("error" in x for x in ra):
            raise RuntimeError("kho đếm trả sai dạng")
        return [x.get("result") for x in ra]

    def xin(self, ai: str | None) -> str | None:
        t = self._dong_ho()
        gio, ngay = int(t // GIO), int(t // NGAY)
        dem = [("tong_ngay", f"hbt:ai:ngay:{ngay}", self.ngay_tong, int(NGAY * 2)),
               ("tong_gio", f"hbt:ai:gio:{gio}", self.gio_tong, int(GIO * 2))]
        if ai:
            dem.append(("nguoi_goi_gio", f"hbt:ai:ng:{ai}:{gio}", self.gio_nguoi, int(GIO * 2)))
        try:
            lenh: list[list] = []
            for _, khoa, _, ttl in dem:
                lenh += [["INCR", khoa], ["EXPIRE", khoa, str(ttl), "NX"]]
            kq = self._goi(lenh)[0::2]
            for (ly_do, _, tran, _), so in zip(dem, kq):
                if int(so) > tran:
                    self._goi([["DECR", khoa] for _, khoa, _, _ in dem])     # bị từ chối → không tính lượt
                    return ly_do
            return None
        except Exception:  # noqa: BLE001 — kho lỗi / chậm: đếm trong bộ nhớ tiến trình, người dùng không thấy lỗi
            return self._du_phong.xin(ai)


def _so(ten: str, mac_dinh: int) -> int:
    try:
        return int(os.environ.get(ten, "") or mac_dinh)
    except ValueError:
        return mac_dinh


def tu_env() -> NganSach | NganSachRedis:
    han = (_so("LLM_LUOT_NGUOI_GIO", 40), _so("LLM_LUOT_TONG_GIO", 400), _so("LLM_LUOT_TONG_NGAY", 3000))
    url, tk = os.environ.get("HAN_MUC_REDIS_URL", ""), os.environ.get("HAN_MUC_REDIS_TOKEN", "")
    if url.startswith("https://") and tk:          # khoá chỉ đi qua đường mã hoá
        return NganSachRedis(url, tk, *han)
    return NganSach(*han)


_chung = tu_env()


def kiem_luot() -> None:
    """Gọi ngay trước mỗi lần gọi OpenRouter. Hết lượt → ném HetLuot (nơi gọi rơi về template)."""
    ly_do = _chung.xin(NGUOI_GOI.get())
    if ly_do:
        raise HetLuot(ly_do)
