# -*- coding: utf-8 -*-
"""QTE-2 — ngữ cảnh NGÔN NGỮ của một lượt gọi engine (docs/DANH-GIA-KIEN-TRUC-DA-NGON-NGU.md mục 4).

Một biến ngữ cảnh (`contextvars`) đặt ở middleware theo header `x-ngon-ngu` (web gửi) hoặc query `?ngon_ngu=`;
không có / lạ → "vi". Mọi lớp CHỮ (KB qua `kb.nap`, bảng tên `kb.ten`, lời RULES về sau) đọc `hien_tai()`; tầng CALC
không bao giờ đọc (phép tính không phụ thuộc ngôn ngữ). Starlette chạy route đồng bộ trong threadpool có chép ngữ cảnh,
nên giá trị đi theo đúng lượt gọi (cùng cơ chế `ngan_sach.NGUOI_GOI`).
"""
from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar

MAC_DINH = "vi"
# Thứ tự = thứ tự mở theo kế hoạch QTE-1: tiếng Việt → tiếng Anh → phồn thể (mã BCP-47 chữ thường).
HO_TRO: tuple[str, ...] = ("vi", "en", "zh-hant")

HIEN_TAI: ContextVar[str] = ContextVar("ngon_ngu", default=MAC_DINH)
# Ý7 (HTT-2 mục 8, 2026-11-09): biến thể theo thị trường của cùng một ngôn ngữ ("en-us", "en-au"…) — chỉ là LỚP PHỦ MỎNG
# chồng lên bản phủ ngôn ngữ (vài mẫu câu / cách viết), KB đọc vi → en → en-us; phiếu kiểm chứng ghi đúng biến thể để
# `lech_ngon_ngu` so A/B. Chỉ nhận biến thể CÓ thư mục `kb/data/<biến thể>/`; mã lạ → không biến thể (bản gốc của ngôn ngữ).
BIEN_THE: ContextVar[str | None] = ContextVar("ngon_ngu_bien_the", default=None)


def chuan(gia_tri: str | None) -> str:
    """Chuẩn hoá mã ngôn ngữ người gọi gửi: `en`, `EN`, `en-US`, `en_GB` → "en"; `zh-Hant`, `zh-TW`, `zh-HK` → "zh-hant";
    rỗng / lạ → "vi" (không bao giờ ném lỗi — ngôn ngữ sai không được làm hỏng lượt gọi)."""
    if not gia_tri:
        return MAC_DINH
    s = gia_tri.strip().lower().replace("_", "-")[:16]
    if s in HO_TRO:
        return s
    goc = s.split("-")[0]
    if goc == "zh":
        # Giản thể không hỗ trợ (QTE-1 mục 2) → rơi về mặc định; mọi mã Hoa khác coi là phồn thể.
        return "zh-hant" if s not in ("zh-cn", "zh-hans", "zh-sg") else MAC_DINH
    return goc if goc in HO_TRO else MAC_DINH


def hien_tai() -> str:
    return HIEN_TAI.get()


def _co_thu_muc(ma: str) -> bool:
    from pathlib import Path  # noqa: PLC0415
    return (Path(__file__).parent / "kb" / "data" / ma).is_dir()


def bien_the_cua(gia_tri: str | None) -> str | None:
    """Mã biến thể hợp lệ từ chuỗi người gọi gửi: "en-US" → "en-us" nếu có thư mục bản phủ `kb/data/en-us/`; "en",
    "vi", mã lạ, biến thể chưa có thư mục → None (dùng bản gốc của ngôn ngữ)."""
    if not gia_tri:
        return None
    s = gia_tri.strip().lower().replace("_", "-")[:16]
    if "-" not in s or s in HO_TRO or chuan(s) == MAC_DINH:
        return None
    goc = s.split("-")[0]
    return s if goc == chuan(s) and _co_thu_muc(s) else None


def bien_the() -> str | None:
    """Biến thể đang dùng của lượt gọi ("en-us"…) hoặc None."""
    return BIEN_THE.get()


def ma_phieu() -> str:
    """Mã ghi vào phiếu / nhật ký: biến thể nếu có, không thì ngôn ngữ ("vi", "en", "en-us")."""
    return BIEN_THE.get() or HIEN_TAI.get()


def la_viet() -> bool:
    return HIEN_TAI.get() == MAC_DINH


@contextmanager
def dung(ngon_ngu: str | None):
    """Đặt ngôn ngữ cho một đoạn mã (test, script, lời gọi nội bộ): `with ngon_ngu.dung("en"): …`."""
    tok = HIEN_TAI.set(chuan(ngon_ngu))
    tok_bt = BIEN_THE.set(bien_the_cua(ngon_ngu))
    try:
        yield
    finally:
        BIEN_THE.reset(tok_bt)
        HIEN_TAI.reset(tok)
