# -*- coding: utf-8 -*-
"""LH-1 — CALC: Hồng Loan / Thiên Hỷ theo địa chi của năm (thuần, tất định).

Khẩu quyết: Hồng Loan năm Tý ở cung Mão, mỗi năm lùi một cung (đi nghịch); Thiên Hỷ ở cung đối diện. Vị trí GỐC của lá số
dùng chi năm sinh, vị trí LƯU của một năm dùng chi năm đó — cùng một công thức (đối chứng 1.000 lá: `tests/test_tuvi_hong_hy.py`).
"""
from __future__ import annotations

from app.calc import lunar
from app.calc.can_chi import CHI


def hong_loan(chi_nam: str) -> str:
    return CHI[(3 - CHI.index(chi_nam)) % 12]


def thien_hy(chi_nam: str) -> str:
    return CHI[(9 - CHI.index(chi_nam)) % 12]


def nam_hy(cung: list[dict], nam_am_tu: int, so_nam: int, cac_cung: tuple[str, ...]) -> list[dict]:
    """Các năm âm lịch (từ `nam_am_tu`, `so_nam` năm) mà Hồng Loan / Thiên Hỷ LƯU tới một trong `cac_cung` của lá số.
    → [{nam, sao, cung}] theo thứ tự năm."""
    theo_chi = {c["chi"]: c["ten"] for c in cung}
    ra = []
    for k in range(so_nam):
        nam = nam_am_tu + k
        _, chi = lunar.can_chi_nam(nam)
        for sao, vi in (("Hồng Loan", hong_loan(chi)), ("Thiên Hỷ", thien_hy(chi))):
            if theo_chi.get(vi) in cac_cung:
                ra.append({"nam": nam, "sao": sao, "cung": theo_chi[vi]})
    return ra
