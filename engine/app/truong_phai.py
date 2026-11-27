# -*- coding: utf-8 -*-
"""TP-1 — sổ TRƯỜNG PHÁI dùng chung (chủ dự án duyệt 2026-11-27).

Một nơi liệt kê mọi chỗ hai nguồn thật sự nói khác nhau và người dùng được chọn (KB `truong_phai.json`, bản phủ
`en/truong_phai.json` cho chữ). Các công tắc CŨ vẫn đi trong thân yêu cầu với tên trường như trước (không đổi tên,
không đổi mặc định) — sổ chỉ mô tả + nguồn + kiểm giá trị. Công tắc MỚI của lịch (`duong_cong`) đi theo query
`?duong_cong=` hoặc header `x-duong-cong` (mọi route lịch / Hôm nay / tuần… nhận được mà không đổi thân yêu cầu);
middleware kiểm bằng `kiem` (lạ → 422) rồi đặt biến ngữ cảnh — các hàm lịch đọc `hien_tai("duong_cong")`.

Bộ nhớ đệm có chữ (`ngon_ngu.lru`) khoá kèm `khoa()` → lượt theo sách Hiệp Kỷ không rò sang lượt mặc định.
"""
from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar

from app.kb import nap

TEP = "truong_phai.json"

# Công tắc đặt theo NGỮ CẢNH lượt gọi (query / header) — mã → (biến ngữ cảnh, giá trị mặc định).
_MAC_DINH_NGU_CANH = {"duong_cong": "lich_viet"}
_BIEN: dict[str, ContextVar[str]] = {ma: ContextVar(f"truong_phai_{ma}", default=md) for ma, md in _MAC_DINH_NGU_CANH.items()}
NGU_CANH: tuple[str, ...] = tuple(_MAC_DINH_NGU_CANH)


def so() -> dict:
    return nap.doc(TEP)


def diem(ma: str) -> dict | None:
    return next((d for d in so()["diem"] if d["ma"] == ma), None)


def gia_tri(ma: str) -> tuple[str, ...]:
    d = diem(ma)
    return tuple(x["ma"] for x in d["lua_chon"]) if d else ()


def mac_dinh(ma: str) -> str | None:
    d = diem(ma)
    if not d:
        return None
    return next((x["ma"] for x in d["lua_chon"] if x.get("mac_dinh")), None)


def kiem(ma: str, gt: str | None) -> str:
    """Giá trị hợp lệ của công tắc `ma` (rỗng → mặc định). Lạ → ValueError (route / middleware trả 422)."""
    if gt is None or gt == "":
        md = _MAC_DINH_NGU_CANH.get(ma) or mac_dinh(ma)
        if md is None:
            raise ValueError(ma)
        return md
    if gt not in gia_tri(ma):
        raise ValueError(f"{ma}={gt}")
    return gt


def hien_tai(ma: str) -> str:
    return _BIEN[ma].get()


def khoa() -> tuple[str, ...]:
    """Giá trị công tắc ngữ cảnh của lượt gọi — ghép vào khoá bộ nhớ đệm."""
    return tuple(_BIEN[m].get() for m in NGU_CANH)


def la_mac_dinh() -> bool:
    return all(_BIEN[m].get() == _MAC_DINH_NGU_CANH[m] for m in NGU_CANH)


@contextmanager
def dung(**kw: str):
    """Đặt công tắc ngữ cảnh cho một đoạn mã (route, test, tính `diem_khac`): `with truong_phai.dung(duong_cong="hiep_ky")`."""
    tok = {}
    for m, v in kw.items():
        tok[m] = _BIEN[m].set(kiem(m, v))
    try:
        yield
    finally:
        for m, t in tok.items():
            _BIEN[m].reset(t)


def dat(ma: str, gt: str):
    """Đặt công tắc cho cả lượt gọi (middleware); trả token để `bo`."""
    return _BIEN[ma].set(kiem(ma, gt))


def bo(ma: str, tok) -> None:
    _BIEN[ma].reset(tok)


def danh_sach(mon: str | None = None) -> list[dict]:
    """Sổ công khai (route GET /v1/truong-phai): bỏ trường nội bộ (`source_id`, `school_id`, `noi_gui`…)."""
    an = {"source_id", "school_id"}
    ra = []
    for d in so()["diem"]:
        if mon and d["mon"] != mon:
            continue
        ra.append({**{k: v for k, v in d.items() if k not in an | {"lua_chon"}},
                   "lua_chon": [{k: v for k, v in x.items() if k not in an} for x in d["lua_chon"]]})
    return ra


def cac_mon() -> tuple[str, ...]:
    return tuple(dict.fromkeys(d["mon"] for d in so()["diem"]))
