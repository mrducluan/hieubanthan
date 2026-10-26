# -*- coding: utf-8 -*-
"""Đồ thị tri thức Phong thuỷ theo ý định (thay Apache AGE + Cypher của bộ tài liệu Drive — 2026-10-22).

Supabase không có AGE; đồ thị này nhỏ (11 ý định · 6 phòng · 23 dấu hiệu · 9 sao) nên JSON trong git là nguồn gốc và engine
duyệt cạnh bằng Python thuần — một "câu Cypher" của Drive tương đương một lần `theo_y_dinh()` / `duong_di()` ở đây, có test.
Chỉ TRA, không sinh nghĩa. Cạnh sao ↔ sao (sinh / khắc) lấy từ ngũ hành của sao trong `calc.huyen_khong` (một nguồn).
"""
from __future__ import annotations

import json
from collections import deque
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "phongthuy_do_thi.json"
LOAI_NUT = ("y_dinh", "phong", "dau_hieu", "sao")


@lru_cache(maxsize=1)
def _d() -> dict:
    try:
        return json.loads(_F.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def _sao_sinh_khac() -> tuple[dict[int, int], dict[int, int]]:
    from app.calc.huyen_khong import HANH_SAO, KHAC, SINH  # noqa: PLC0415
    sinh = {s: next(t for t, h in HANH_SAO.items() if h == SINH[HANH_SAO[s]] and t != s and t not in (5,)) for s in range(1, 10)}
    khac = {s: next(t for t, h in HANH_SAO.items() if h == KHAC[HANH_SAO[s]] and t not in (5,)) for s in range(1, 10)}
    return sinh, khac


@lru_cache(maxsize=1)
def canh() -> list[tuple[str, str, str]]:
    """Mọi cạnh có hướng (từ, loại, tới); nút ghi dạng `loai:ma` (vd `sao:5`, `dau_hieu:xa_ngang`)."""
    d = _d()
    ra: list[tuple[str, str, str]] = []
    for y, v in (d.get("y_dinh") or {}).items():
        ra += [(f"y_dinh:{y}", "QUAN_TAM", f"phong:{p}") for p in v.get("phong", [])]
        ra += [(f"y_dinh:{y}", "CAN_XEM", f"dau_hieu:{x}") for x in v.get("dau_hieu", [])]
        ra += [(f"y_dinh:{y}", "SAO_LIEN_QUAN", f"sao:{s}") for s in v.get("sao", [])]
    for s, ds in (d.get("sao_kich_hoat") or {}).items():
        ra += [(f"sao:{s}", "KICH_HOAT", f"dau_hieu:{x}") for x in ds]
    for x, ps in (d.get("dau_hieu_phong") or {}).items():
        ra += [(f"dau_hieu:{x}", "O_PHONG", f"phong:{p}") for p in ps]
    for s, ds in (d.get("sao_lam_diu") or {}).items():
        ra += [(f"sao:{s}", "HOA_GIAI_BOI", f"sao:{t}") for t in ds]
    sinh, khac = _sao_sinh_khac()
    ra += [(f"sao:{s}", "SINH", f"sao:{t}") for s, t in sinh.items()]
    ra += [(f"sao:{s}", "KHAC", f"sao:{t}") for s, t in khac.items()]
    return ra


def nut() -> set[str]:
    ds = set()
    for a, _, b in canh():
        ds.add(a); ds.add(b)
    return ds


def lang_gieng(n: str, loai: str | None = None) -> list[tuple[str, str]]:
    """Các (loại cạnh, nút tới) đi ra từ `n`; lọc theo loại cạnh nếu cho."""
    return [(l, b) for a, l, b in canh() if a == n and (loai is None or l == loai)]


def dau_hieu_o_phong(phong: list[str]) -> set[str]:
    """Y6: dấu hiệu thường gặp ở các phòng cho (cạnh O_PHONG đảo chiều) — để hỏi đáp nêu đúng dấu hiệu đã khai của phòng đó."""
    return {ma for ma, ds in (_d().get("dau_hieu_phong") or {}).items() if set(ds) & set(phong)}


def theo_y_dinh(ma: str) -> dict | None:
    """Một "truy vấn" cho một ý định: phòng cần nhìn, dấu hiệu nên rà, sao liên quan, và sao kích hoạt từng dấu hiệu
    (2 bước: ý định → dấu hiệu ← sao). None khi ý định không có trong đồ thị."""
    y = (_d().get("y_dinh") or {}).get(ma)
    if y is None:
        return None
    kich = {}
    for x in y.get("dau_hieu", []):
        kich[x] = sorted(int(a.split(":")[1]) for a, l, b in canh() if l == "KICH_HOAT" and b == f"dau_hieu:{x}")
    return {"ma": ma, "phong": list(y.get("phong", [])), "dau_hieu": list(y.get("dau_hieu", [])), "sao": [int(s) for s in y.get("sao", [])],
            "sao_kich_hoat": kich}


def duong_di(tu: str, toi: str, toi_da: int = 4) -> list[tuple[str, str, str]] | None:
    """Đường ngắn nhất (BFS) theo cạnh có hướng, ≤ `toi_da` bước; None nếu không tới được."""
    if tu == toi:
        return []
    truoc: dict[str, tuple[str, str, str]] = {}
    q = deque([(tu, 0)])
    tham = {tu}
    while q:
        n, b = q.popleft()
        if b >= toi_da:
            continue
        for l, m in lang_gieng(n):
            if m in tham:
                continue
            tham.add(m)
            truoc[m] = (n, l, m)
            if m == toi:
                duong, x = [], m
                while x != tu:
                    e = truoc[x]
                    duong.append(e)
                    x = e[0]
                return list(reversed(duong))
            q.append((m, b + 1))
    return None


def meta() -> dict:
    d = _d()
    return {"source_id": d.get("source_id", "hbt_phongthuy_do_thi"), "school_id": d.get("school_id", "bat_trach_huyen_khong"),
            "trang_thai": d.get("trang_thai", "nhap_ai"), "loai_canh": d.get("loai_canh", {})}
