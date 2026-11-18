# -*- coding: utf-8 -*-
"""Tầng KB — Kỳ Môn Độn Giáp: tám cửa, chín sao, tám thần, tam kỳ lục nghi, cách cục, việc ↔ cửa.

Chỉ TRA `ky_mon_kb.json` (git là nguồn). Câu trích là nguyên văn kho nguồn `ky_mon_co_kim_do_thu` theo khuôn SX-C
(`sach_ghi`); lời đời thường do ban biên tập viết (nháp). Không sinh nghĩa."""
from __future__ import annotations

from app.kb import nap, sach_ghi

TEP = "ky_mon_kb.json"
NGUON_HIEN_THI = "sách Kỳ Môn Độn Giáp xưa (Yên Ba Điếu Tẩu Ca, Độn Giáp Phù Ứng Kinh)"   # BM-1: kiểu sách, không nơi lấy


@nap.nho
def _d() -> dict:
    d = nap.doc(TEP)
    return d if isinstance(d, dict) else {}


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("_trang_thai", "nhap"), "source_id": d.get("source_id"), "school_id": d.get("school_id"),
            "can_doi_chieu": bool(d.get("can_doi_chieu", True)), "nguon": NGUON_HIEN_THI}


def phan(ten: str) -> dict:
    return _d().get(ten) or {}


@nap.nho
def cua_theo_so() -> dict[int, tuple[str, dict]]:
    return {m["so"]: (ma, m) for ma, m in phan("cua").items()}


@nap.nho
def sao_theo_so() -> dict[int, tuple[str, dict]]:
    return {m["so"]: (ma, m) for ma, m in phan("sao").items()}


def mau(ma: str) -> str:
    return phan("mau").get(ma, "")


def loi_sach(m: dict | None) -> str | None:
    """Câu hiển thị của một mục sách (khuôn SX-C), không phiên âm ở nhóm B."""
    return sach_ghi.loi(m, co_am=m.get("nhom") == "A") if m else None
