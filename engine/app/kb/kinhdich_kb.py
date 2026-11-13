# -*- coding: utf-8 -*-
"""Tầng KB — Kinh Dịch (64 quẻ, bát quái, thể–dụng, dụng thần, giải thích, mẫu).

Nguồn: app/kb/data/kinhdich_kb.json (nháp AI, `can_doi_chieu`). Không có → None.
"""
from __future__ import annotations

from pathlib import Path
from app.kb import nap

_F = Path(__file__).parent / "data" / "kinhdich_kb.json"


@nap.nho
def _d() -> dict:
    return nap.doc(_F.name)


def meta() -> dict:
    d = _d()
    return {"trang_thai": d["trang_thai"], "can_doi_chieu": d["can_doi_chieu"]}


def que(so: int) -> dict | None:
    q = _d()["que"].get(str(so))
    return {**q, **meta()} if q else None


def ten_que() -> dict[int, str]:
    return {int(k): v["ten"] for k, v in _d()["que"].items()}


def the_dung(quan_he: str) -> dict | None:
    m = _d()["the_dung"].get(quan_he)
    return {**m, **meta()} if m else None


def dung_than(ten: str) -> dict | None:
    m = _d()["dung_than"].get(ten)
    return {**m, **meta()} if m else None


def giai_thich_tat_ca() -> dict:
    return _d()["giai_thich"]


def giai_thich(ma: str) -> dict | None:
    m = _d()["giai_thich"].get(ma)
    return {**m, **meta()} if m else None


def mau(ma: str) -> str | None:
    return _d()["mau"].get(ma)


def luu_y(ma: str) -> str | None:
    return _d()["luu_y"].get(ma)


# --------------------------------------------------------------------------- KB-1: lời kinh
_F_HAO = Path(__file__).parent / "data" / "kinhdich_hao.json"


@nap.nho
def _h() -> dict:
    return nap.doc(_F_HAO.name)


def _meta_hao() -> dict:
    d = _h()
    return {"trang_thai": d["trang_thai"], "can_doi_chieu": d["can_doi_chieu"],
            "source_id": d["source_id"], "school_id": d["school_id"]}


def que_van(so: int) -> dict | None:
    """Quái từ, Đại tượng, Thoán (nguyên văn + dịch), 6 hào, Dụng Cửu/Dụng Lục (Càn/Khôn)."""
    q = _h()["que"].get(str(so))
    return {**q, **_meta_hao()} if q else None


def hao(so: int, vi_tri: int) -> dict | None:
    q = _h()["que"].get(str(so))
    if not q or not 1 <= vi_tri <= 6:
        return None
    return {**q["hao"][vi_tri - 1], **_meta_hao()}


# --------------------------------------------------------------------------- KT-TT: Trình Di · Chu Hy · Tiểu tượng · loại tượng
@nap.nho
def _tn() -> dict:
    return nap.doc("kinhdich_truyen_nghia.json")


def trich_gon(s: str | None, toi_da: int = 420) -> str | None:
    """Lấy trọn câu đầu của lời giảng cho tới `toi_da` ký tự (không cắt giữa câu khi còn câu trọn)."""
    s = (s or "").strip()
    if not s:
        return None
    if len(s) <= toi_da:
        return s
    ra = ""
    for cau in __import__("re").split(r"(?<=[.!?…])\s+", s):
        if len(ra) + len(cau) + 1 > toi_da:
            break
        ra = (ra + " " + cau).strip()
    if not ra:
        ra = s[:toi_da].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return ra


def truyen_nghia(so: int, loai: str, vi_tri: int | None = None) -> dict | None:
    """Lời Trình Di (Dịch truyện), Chu Hy (Bản nghĩa) và Tiểu tượng — bản dịch Ngô Tất Tố. Chỉ có ở bản tiếng Việt."""
    from app import ngon_ngu
    if not ngon_ngu.la_viet():
        return None
    d = _tn()
    q = d["que"].get(str(so)) or {}
    if loai == "hao":
        h = (q.get("hao") or {}).get(str(vi_tri)) or {}
        goc, tt = h.get("tu") or {}, h.get("tieu_tuong") or {}
    else:
        goc, tt = q.get("quai_tu") or {}, {}
    ra = {"trinh": trich_gon(goc.get("trinh")), "chu_hy": trich_gon(goc.get("chu"))}
    if tt.get("han") and tt.get("dich"):
        ra["tieu_tuong"] = {"han": tt["han"], "dich": tt["dich"]}
    ra = {k: v for k, v in ra.items() if v}
    return {**ra, "nguoi_dich": d["nguoi_dich"]} if ra else None


def truyen_nghia_que(so: int) -> dict:
    return _tn()["que"].get(str(so)) or {}


_DA_NEU = {"cha", "mẹ", "con trai trưởng", "con gái trưởng", "con gái giữa", "con gái út", "trời", "đất", "sấm", "gió", "nước",
           "lửa", "núi", "đầm, hồ", "cây gỗ", "rồng", "chó", "dê"}        # đã nêu ở vế trước của câu — không lặp


def loai_tuong(quai: str) -> str | None:
    """Một câu loại tượng của quái theo Thuyết Quái (cho Mai Hoa: gợi ý người, vật, nơi chốn — không phải lời đoán)."""
    from app import ngon_ngu
    b = _d()["bat_quai"].get(quai) or {}
    lt = b.get("loai_tuong")
    if not lt or not ngon_ngu.la_viet():
        return None
    return _d()["mau"]["loai_tuong"].format(quai=quai, tuong=b["tuong"].lower(), duc=lt["duc"], nguoi=b["gia_dinh"].lower(),
                                            than_the=lt["than_the"], con_vat=lt["con_vat"],
                                            vat=", ".join([v for v in lt["vat"] if v not in _DA_NEU and v != b["tuong"].lower()
                                                           and v != lt["con_vat"]][:6]))
