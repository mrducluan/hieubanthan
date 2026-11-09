# -*- coding: utf-8 -*-
"""HTT-1 — tầng HỌC: phát hiện LỆCH tỉ lệ "Đúng với mình" giữa bản tiếng Việt (gốc) và bản ngôn ngữ khác của CÙNG một mã hộp.

Ý lấy từ `cron_rlhf_calibration.py` của tài liệu Drive (kiểm định hai tỉ lệ, một phía) — nhưng chỉ THỐNG KÊ và xếp hàng đợi
cho NGƯỜI DUYỆT xem lại bản chuyển ngữ; máy không viết lại lời, không ghi đè KB, không "reset prior" (quy tắc tầng HỌC).
Engine không chạm DB: web máy chủ đọc `ty_le_kiem_chung_ngon_ngu()` (migration 0034) rồi gửi các dòng vào đây.

Thuật toán (tất định): với mỗi (mã, ngôn ngữ ≠ gốc) có n_goc ≥ toi_thieu và n ≥ toi_thieu:
    p_goc = dung_goc / n_goc, p = dung / n, Δ = p_goc − p
    p_gop = (dung_goc + dung) / (n_goc + n), Z = Δ / sqrt(p_gop (1 − p_gop) (1/n_goc + 1/n)), p-value một phía = ½ erfc(Z/√2)
    lệch khi Δ > delta (mặc định 0,15) và Z ≥ z_nguong (1,96 ~ p < 0,025).
"""
from __future__ import annotations

import math

GOC = "vi"
TOI_THIEU = 100
DELTA = 0.15
Z_NGUONG = 1.96


def z_hai_ti_le(dung_goc: int, n_goc: int, dung: int, n: int) -> tuple[float, float]:
    """(Z một phía H1: p_goc > p, p-value). Không đủ dữ liệu / tỉ lệ gộp 0 hay 1 → (0, 1)."""
    if n_goc <= 0 or n <= 0:
        return 0.0, 1.0
    p_goc, p = dung_goc / n_goc, dung / n
    p_gop = (dung_goc + dung) / (n_goc + n)
    if p_gop <= 0.0 or p_gop >= 1.0:
        return 0.0, 1.0
    se = math.sqrt(p_gop * (1.0 - p_gop) * (1.0 / n_goc + 1.0 / n))
    if se == 0.0:
        return 0.0, 1.0
    z = (p_goc - p) / se
    return round(z, 4), round(0.5 * math.erfc(z / math.sqrt(2.0)), 6)


def quet(dong: list[dict], *, goc: str = GOC, toi_thieu: int = TOI_THIEU, delta: float = DELTA, z_nguong: float = Z_NGUONG) -> dict:
    """`dong` = [{mau, ngon_ngu, dung, chua_dung}] (đầu ra `ty_le_kiem_chung_ngon_ngu`). → {lech: [...], so_ma_so, so_cap_du}.
    Mỗi mục lệch: mau, ngon_ngu, n_goc, ti_le_goc, n, ti_le, delta, z, p, de_xuat (câu cho người duyệt)."""
    theo: dict[str, dict[str, tuple[int, int]]] = {}
    for d in dong:
        try:
            mau, nn = str(d["mau"]), str(d["ngon_ngu"])
            dung, chua = int(d.get("dung", 0)), int(d.get("chua_dung", 0))
        except (KeyError, TypeError, ValueError):
            continue
        if dung < 0 or chua < 0:
            continue
        a, b = theo.setdefault(mau, {}).get(nn, (0, 0))
        theo[mau][nn] = (a + dung, b + chua)
    lech: list[dict] = []
    so_ma_so = so_cap_du = 0
    for mau, nnd in theo.items():
        if goc not in nnd:
            continue
        dg, cg = nnd[goc]
        n_goc = dg + cg
        for nn, (d, c) in nnd.items():
            if nn == goc:
                continue
            so_ma_so += 1
            n = d + c
            if n_goc < toi_thieu or n < toi_thieu:
                continue
            so_cap_du += 1
            z, p = z_hai_ti_le(dg, n_goc, d, n)
            dl = dg / n_goc - d / n
            if dl > delta and z >= z_nguong:
                lech.append({"mau": mau, "ngon_ngu": nn, "n_goc": n_goc, "ti_le_goc": round(dg / n_goc, 3), "n": n,
                             "ti_le": round(d / n, 3), "delta": round(dl, 3), "z": z, "p": p,
                             "de_xuat": f"Bản {nn} của mã này được {round(d / n * 100)}% thấy đúng so với {round(dg / n_goc * 100)}% ở bản gốc "
                                        f"(n = {n} / {n_goc}, Z = {z}). Người duyệt xem lại lời bản {nn} (kb/data/{nn}/) — máy không tự sửa."})
    lech.sort(key=lambda x: (-x["delta"], x["mau"], x["ngon_ngu"]))
    return {"lech": lech, "so_ma_so": so_ma_so, "so_cap_du": so_cap_du,
            "nguong": {"goc": goc, "toi_thieu": toi_thieu, "delta": delta, "z": z_nguong}}
