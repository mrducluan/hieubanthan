# -*- coding: utf-8 -*-
"""Tầng KB — SK-1 (2026-11-04): MỘT nguồn cho gợi ý sức khoẻ của mọi mảng (hệ cơ quan theo hành / sao, câu mẫu "năm
nên chú ý sức khoẻ", lời đáp câu hỏi nêu tên bệnh, cụm cấm). Nguồn: app/kb/data/suc_khoe_kb.json (nháp ban biên tập,
`source_id` + `school_id` ở gốc tệp và từng mục). Chỉ TRA, không sinh nghĩa."""
from __future__ import annotations

import re
from pathlib import Path
from app.kb import nap

_F = Path(__file__).parent / "data" / "suc_khoe_kb.json"
MIEN_TRU_MAC_DINH = ("Đây là lời nhắc phòng ngừa theo sách xưa, không phải lời đoán và không thay lời bác sĩ — có dấu "
                     "hiệu bất thường hãy đi khám ngay.")
# Hành viết hai kiểu (Hỏa/Hoả, Thủy/Thuỷ) ở các KB khác nhau → một khoá.
_HANH = {"Hoả": "Hỏa", "Thuỷ": "Thủy"}


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(_F.name)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", "hoang_de_noi_kinh"),
            "school_id": d.get("school_id", "ngu_hanh_tang_phu")}


def hanh_chuan(h: str | None) -> str | None:
    return _HANH.get(h, h) if h else None


def _benh(m: dict, co: bool) -> dict:
    """SK-2: tên vài bệnh hay gặp của hệ cơ quan — CHỈ Tử vi và Bát tự xin (`benh=True`); mảng khác không mang."""
    return {"benh": m["benh"]} if co and isinstance(m.get("benh"), str) and m["benh"].strip() else {}


def ten_benh() -> list[str]:
    """SK-2: mọi tên bệnh hay gặp KB cho phép nêu (trường `benh` của hành / sao), chữ thường, không trùng."""
    d = _d()
    ra: list[str] = []
    for nhom in ("he_co_quan", "sao_tuvi"):
        for m in (d.get(nhom) or {}).values():
            if isinstance(m, dict) and isinstance(m.get("benh"), str):
                ra += [x.strip().lower() for x in re.split(r",| and | và ", m["benh"]) if x.strip()]
    return list(dict.fromkeys(ra))


def he_hanh(hanh: str | None, benh: bool = False) -> dict | None:
    """Hành → {he, kham, hanh[, benh]} (hệ cơ quan sách xưa gắn với hành + việc đi khám)."""
    h = hanh_chuan(hanh)
    m = (_d().get("he_co_quan") or {}).get(h or "")
    return {"he": m["he"], "kham": m["kham"], "hanh": h, **_benh(m, benh)} if isinstance(m, dict) else None


def he_sao(sao: str, benh: bool = False) -> dict | None:
    """Chính tinh Tử vi → {he, kham, hanh[, benh]}."""
    m = (_d().get("sao_tuvi") or {}).get(sao)
    return {"he": m["he"], "kham": m["kham"], "hanh": m.get("hanh"), **_benh(m, benh)} if isinstance(m, dict) else None


def he_quai(quai: str | None) -> dict | None:
    """Quái (Bát quái) → {he, kham} theo Thuyết quái truyện."""
    m = (_d().get("quai_bo_phan") or {}).get(quai or "")
    return {"he": m["he"], "kham": m["kham"]} if isinstance(m, dict) else None


def sao_huyen_khong(so: int) -> dict | None:
    m = (_d().get("sao_huyen_khong") or {}).get(str(so))
    return m if isinstance(m, dict) else None


def nam_ca_nhan(so: int) -> dict | None:
    m = (_d().get("nam_ca_nhan") or {}).get(str(so))
    return m if isinstance(m, dict) else None


def mau(ma: str) -> str:
    m = (_d().get("mau") or {}).get(ma)
    if not isinstance(m, str) or not m.strip():
        return MIEN_TRU_MAC_DINH if ma == "mien_tru" else ""
    return m.strip()


def mien_tru() -> str:
    return mau("mien_tru")


def cum_cam() -> list[str]:
    return [c for c in (_d().get("cum_cam") or []) if isinstance(c, str)]


def he_cau_hoi(t_khong_dau: str) -> dict | None:
    """Câu hỏi (chữ đã bỏ dấu) nêu bệnh / bộ phận → hệ cơ quan để gợi đi khám (không nhắc lại tên bệnh)."""
    for h, ds in (_d().get("benh_he") or {}).items():
        if h.startswith("_") or not isinstance(ds, list):
            continue
        if any(re.search(r"(?<!\w)(?:" + m + r")(?!\w)", t_khong_dau or "") for m in ds):
            return he_hanh(h)
    return None
