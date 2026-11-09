# -*- coding: utf-8 -*-
"""Tầng KB — lớp "trả lời theo việc" của Kinh Dịch (KD-V3).

Nguồn: app/kb/data/kinhdich_tra_loi.json — xu hướng 384 hào (tự rút từ chữ đoán rồi biên tập duyệt tay), khuôn câu theo
kiểu câu hỏi, dụng thần theo việc + vai, lời Thế–Ứng cho "người kia". Chỉ TRA, không sinh nghĩa; thiếu khoá → None / rỗng.
"""
from __future__ import annotations

from pathlib import Path
from app.kb import nap

_F = Path(__file__).parent / "data" / "kinhdich_tra_loi.json"
NGHIENG = ("co", "dieu_kien", "chua_voi", "chua")
XU_HUONG = ("tien", "tien_giu", "giu", "hop_tac", "cho", "than_trong", "lui", "ket")
KIEU_CAU = ("co_nen", "ket_qua", "nguoi_kia", "khi_nao", "cach_lam", "tong_quat")


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(_F.name)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _lay(*khoa):
    x = _d()
    for k in khoa:
        if not isinstance(x, dict):
            return None
        x = x.get(str(k))
        if x is None:
            return None
    return x


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", "kd_tra_loi_vn"),
            "school_id": d.get("school_id", "tong_hop_kd")}


def xu_huong_hao(so_que: int, vi_tri: int) -> str | None:
    """Xu hướng của hào `vi_tri` (1..6) quẻ `so_que` (King Wen 1..64): một trong XU_HUONG."""
    x = _lay("hao_xu_huong", f"{so_que}.{vi_tri}")
    return x if x in XU_HUONG else None


def xu_huong(ma: str) -> dict:
    m = _lay("xu_huong", ma)
    return m if isinstance(m, dict) else {}


def nghieng(ma: str) -> dict:
    m = _lay("nghieng", ma)
    return m if isinstance(m, dict) else {"nhan": ma, "muc": "can_bang"}


def kieu_cau(ma: str) -> dict:
    m = _lay("kieu_cau", ma)
    return m if isinstance(m, dict) else {}


def vai(ma: str) -> str:
    return _lay("vai", ma) or _lay("vai", "nguoi_kia") or "người kia"


def vai_luc_than(ma: str) -> str | None:
    return _lay("vai_luc_than", ma)


def dung_than_viec(ma_chu_de: str) -> dict:
    m = _lay("dung_than_viec", ma_chu_de)
    return m if isinstance(m, dict) else (_lay("dung_than_viec", "khac") or {})


def the_ung(ma: str) -> str | None:
    return _lay("the_ung", ma)


def trang_thai_nguoi_kia(ma: str) -> str | None:
    return _lay("trang_thai_nguoi_kia", ma)


def ly_do_luc_hao(ma: str) -> str | None:
    return _lay("ly_do_luc_hao", ma)


def can_go(ma: str) -> str | None:
    return _lay("can_go", ma)


def mau(ma: str) -> str:
    return _lay("mau", ma) or ""


def moi_chuoi() -> list[str]:
    """Mọi chuỗi lời (để test giọng văn / cụm cấm)."""
    ra: list[str] = []

    def di(x) -> None:
        if isinstance(x, str):
            ra.append(x)
        elif isinstance(x, dict):
            for k, v in x.items():
                if k not in ("hao_xu_huong", "_nguon"):
                    di(v)
        elif isinstance(x, list):
            for v in x:
                di(v)
    di(_d())
    return ra
