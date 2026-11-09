# -*- coding: utf-8 -*-
"""Ý4 (docs/DANH-GIA-HYBRID-TWO-TIER.md mục 8) — thước "đồng thuận liên môn" cho NGƯỜI DUYỆT.

Trên bộ lá số mẫu (1.000 đầu vào `fixtures/golden/lasotuvi_1000.json`), với mỗi mảng đời của ma trận CD-1, đếm Tử vi và
Bát tự cùng mức bao nhiêu phần trăm, so với kỳ vọng ngẫu nhiên từ phân bố biên (Σ p_tv(m)·p_bt(m)) và Cohen's kappa.
Kết quả ghi `kb/data/dong_thuan_thong_ke.json` bằng `scripts/dong_thuan_lien_mon.py` (chạy tay, ghi ngày + n); engine chỉ ĐỌC:
  - `/v1/quan-tri/dong-thuan` trả bảng cho khung "Đồng thuận liên môn" ở /quan-tri/hoc;
  - `chan_dung_tong_hop.dong_thuan` thêm câu "hiếm khi trùng" vào hộp "nhìn khác nhau" khi kappa của mảng < KAPPA_THAP.
Mảng gần ngẫu nhiên → lời "hai cách nhìn hai mặt" phải nói thật hơn; mảng kappa cao là cơ sở đặt ngưỡng hộp "cùng thấy".
Chỉ thống kê trên lá số mẫu — KHÔNG phải thống kê dân số; không đổi mức, không đổi mã hộp nào.
"""
from __future__ import annotations

import datetime as dt
from pathlib import Path

TEP = Path(__file__).parents[1] / "kb" / "data" / "dong_thuan_thong_ke.json"
MUC = ("thuan", "can_bang", "can_chu_dong")
MANG = ("cong_viec", "tien_bac", "tinh_cam", "gia_dinh", "suc_khoe", "nam_nay")
KAPPA_THAP = 0.10          # dưới mức này: hai lá số gần như độc lập ở mảng đó
KAPPA_CAO = 0.40           # từ mức này: trùng nhau đáng kể (Landis–Koch "fair/moderate")
NGUONG = {"kappa_thap": KAPPA_THAP, "kappa_cao": KAPPA_CAO, "n_toi_thieu": 200}


def thong_ke_mang(cap: list[tuple[str | None, str | None]]) -> dict:
    """`cap` = [(mức Tử vi, mức Bát tự)] một mảng; bỏ cặp thiếu một bên. → {n, cung, ti_le_cung, ngau_nhien, kappa, bien, bang}."""
    du = [(a, b) for a, b in cap if a in MUC and b in MUC]
    n = len(du)
    bang = {a: {b: 0 for b in MUC} for a in MUC}
    for a, b in du:
        bang[a][b] += 1
    if n == 0:
        return {"n": 0, "cung": 0, "ti_le_cung": None, "ngau_nhien": None, "kappa": None,
                "bien": {"tuvi": {m: 0 for m in MUC}, "battu": {m: 0 for m in MUC}}, "bang": bang}
    p_tv = {m: sum(bang[m].values()) / n for m in MUC}
    p_bt = {m: sum(bang[a][m] for a in MUC) / n for m in MUC}
    cung = sum(bang[m][m] for m in MUC)
    po = cung / n
    pe = sum(p_tv[m] * p_bt[m] for m in MUC)
    kappa = (po - pe) / (1 - pe) if pe < 1 else 0.0
    return {"n": n, "cung": cung, "ti_le_cung": round(po, 4), "ngau_nhien": round(pe, 4), "kappa": round(kappa, 4),
            "bien": {"tuvi": {m: sum(bang[m].values()) for m in MUC}, "battu": {m: sum(bang[a][m] for a in MUC) for m in MUC}},
            "bang": bang}


def nhan_kappa(kappa: float | None) -> str:
    if kappa is None:
        return "chua_du"
    if kappa < KAPPA_THAP:
        return "gan_ngau_nhien"
    if kappa < KAPPA_CAO:
        return "trung_it"
    return "trung_dang_ke"


def thong_ke(ca: list[dict]) -> dict:
    """`ca` = [{mang: {tuvi: mức|None, battu: mức|None}}] mỗi lá một dict → bảng theo mảng (không ghi tệp)."""
    ra = {}
    for mang in MANG:
        tk = thong_ke_mang([(x.get(mang, {}).get("tuvi"), x.get(mang, {}).get("battu")) for x in ca])
        tk["nhan"] = nhan_kappa(tk["kappa"])
        ra[mang] = tk
    return ra


def goi(ca: list[dict], *, nguon_la: str, sinh_boi: str) -> dict:
    return {"_sinh_boi": sinh_boi, "_ghi_chu": "Ý4 — đồng thuận Tử vi–Bát tự theo mảng trên lá số mẫu (không phải thống kê dân số). "
            "Chỉ cho người duyệt; không đổi mức / mã hộp. Sinh lại: scripts/dong_thuan_lien_mon.py",
            "ngay": dt.date.today().isoformat(), "n": len(ca), "nguon_la": nguon_la, "nguong": NGUONG, "mang": thong_ke(ca)}


def muc_hai_mon(tv: dict, bt: dict) -> dict:
    """Đọc mức 6 mảng từ hai báo cáo đời sống ĐÃ CHẤM (cùng hàm `_muc_mon` của Chân dung tổng hợp — một bộ tính)."""
    from app.luangiai import chan_dung_tong_hop as cd  # noqa: PLC0415
    return {mang: {"tuvi": cd._muc_mon(tv, "tuvi", mang), "battu": cd._muc_mon(bt, "battu", mang)} for mang in MANG}


def doc() -> dict | None:
    """Tệp thống kê đã sinh (None khi chưa có — engine không bao giờ tự sinh lúc chạy)."""
    import json  # noqa: PLC0415
    try:
        d = json.loads(TEP.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return d if isinstance(d, dict) and isinstance(d.get("mang"), dict) else None


def cua_mang(mang: str) -> dict | None:
    """Thống kê một mảng (None khi chưa có tệp / chưa đủ n) — `chan_dung_tong_hop` dùng để thêm câu "hiếm khi trùng"."""
    d = doc()
    if not d:
        return None
    tk = d["mang"].get(mang)
    if not tk or (tk.get("n") or 0) < NGUONG["n_toi_thieu"] or tk.get("kappa") is None:
        return None
    return {**tk, "n_tong": d.get("n"), "ngay": d.get("ngay")}

