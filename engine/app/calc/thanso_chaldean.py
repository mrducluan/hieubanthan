# -*- coding: utf-8 -*-
"""Thần số học phái Chaldea (Cheiro) — TS-PHAI.

Khác Pitago (`thanso.py`): chữ cái mang giá trị 1–8 theo âm (không theo thứ tự ABC, không có 9), số KÉP 10–52 có
nghĩa riêng, không giữ số cái 11/22/33 (chúng chỉ là số kép). Chia nguyên âm/phụ âm (Linh hồn/Nhân cách) dùng
đúng quy tắc Y theo âm tiết đã khoá của sản phẩm để hai phái so được với nhau.

Tầng CALC: thuần tuý, tất định, không LLM, không DB. Nghĩa số nằm ở KB `thanso_chaldean.json`.
Đáp án tính tay: fixtures/golden/thanso_chaldean.json.
"""
from __future__ import annotations

from app.calc import thanso

BANG: dict[str, int] = {
    c: so for so, chu in {
        1: "AIJQY", 2: "BKR", 3: "CGLS", 4: "DMT", 5: "EHNX", 6: "UVW", 7: "OZ", 8: "FP",
    }.items() for c in chu
}
KEP_MIN, KEP_MAX = 10, 52


def gia_tri(ch: str) -> int:
    return BANG.get(ch.upper(), 0)


def kep_goc(tong: int) -> tuple[int | None, int]:
    """(số kép, số gốc). Kép = giá trị đầu tiên của chuỗi rút gọn nằm trong 10–52; gốc = 1–9, không giữ số cái."""
    kep, n = None, tong
    while n > 9:
        if kep is None and KEP_MIN <= n <= KEP_MAX:
            kep = n
        n = sum(int(c) for c in str(n))
    return kep, n


def _so(tong: int) -> dict:
    kep, goc = kep_goc(tong)
    return {"tong": tong, "kep": kep, "goc": goc}


def _tong_ten(ten: str) -> dict[str, int]:
    tong = {"so_ten": 0, "linh_hon": 0, "nhan_cach": 0}
    for am_tiet in thanso.bo_dau(ten, True).split():
        hoa = am_tiet.upper()
        for i, c in enumerate(hoa):
            if not (c.isalpha() and c.isascii()):
                continue
            la_na = c in thanso.NGUYEN_AM or (c == "Y" and thanso.y_la_nguyen_am_tai(hoa, i))
            tong["so_ten"] += gia_tri(c)
            tong["linh_hon" if la_na else "nhan_cach"] += gia_tri(c)
    return tong


def tinh(ho_ten: str, ngay: int, thang: int, nam: int, ten_goi: str | None = None) -> dict:
    """Bộ số Chaldea: Số tên (cả họ tên), Linh hồn, Nhân cách, Tên gọi, Số ngày sinh, Số đường đời (tổng ngày sinh).

    Tên gọi = tên người khác thường gọi (phái này coi trọng nhất); không có thì lấy tiếng cuối của họ tên.
    """
    t = _tong_ten(ho_ten)
    ten_goi = (ten_goi or "").strip() or (ho_ten.split()[-1] if ho_ten.split() else "")
    return {
        **{k: _so(v) for k, v in t.items()},
        "ten_goi": {"ten": ten_goi, **_so(_tong_ten(ten_goi)["so_ten"])},
        "ngay_sinh": _so(ngay),
        "duong_doi": _so(sum(int(c) for c in f"{ngay}{thang}{nam}")),
    }


def so_ngay(ngay_xem: int) -> dict:
    """Số của một ngày trong tháng (1–31) theo Chaldea: kép nếu ≥ 10, gốc 1–9."""
    return _so(ngay_xem)
