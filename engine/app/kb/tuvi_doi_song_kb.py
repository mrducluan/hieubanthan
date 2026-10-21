# -*- coding: utf-8 -*-
"""Tầng KB — Luận giải Tử vi "đời sống" (LG-ĐS, `docs/LUAN-GIAI-DOI-SONG.md` mục 2.5).

Nguồn: app/kb/data/tuvi_doi_song_kb.json (nháp AI, `source_id` + `school_id` ở gốc tệp; mục lá có thể ghi đè).
Chỉ TRA, không sinh nghĩa. Tệp / khoá / ô chưa có → hàm trả None (RULES rơi về câu chung, không vỡ).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "tuvi_doi_song_kb.json"
SOURCE_ID, SCHOOL_ID = "tuvi_vn", "nam_phai_viet"
MUC_MAC_DINH = {"thuan": "Thuận lợi", "can_bang": "Cân bằng", "can_chu_dong": "Cần chủ động"}
CHUNG_SUC_KHOE = ("Đây là gợi ý chăm sóc theo sách xưa, không thay lời bác sĩ — có dấu hiệu bất thường hãy đi "
                  "khám.")


@lru_cache(maxsize=1)
def _d() -> dict:
    try:
        d = json.loads(_F.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _lay(*khoa: str):
    x = _d()
    for k in khoa:
        if not isinstance(x, dict):
            return None
        x = x.get(k)
        if x is None:
            return None
    return x


def _chuoi(x) -> str | None:
    return x.strip() if isinstance(x, str) and x.strip() else None


def _muc(x) -> dict | None:
    return x if isinstance(x, dict) else None


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", SOURCE_ID),
            "school_id": d.get("school_id", SCHOOL_ID)}


def linh_vuc(cung: str) -> dict | None:
    return _muc(_lay("linh_vuc", cung))


def ten_doi_thuong(cung: str) -> str | None:
    m = linh_vuc(cung)
    return _chuoi(m.get("ten_doi_thuong")) if m else None


def sao_linh_vuc(sao: str, cung: str, nhom: str) -> dict | None:
    """nhom = "sang" | "ham" → {"manh", "de_vap", "loi_khuyen"} (ô nào thiếu thì thiếu)."""
    m = _muc(_lay("sao_linh_vuc", sao, cung, nhom))
    if not m:
        return None
    return {k: _chuoi(m.get(k)) for k in ("manh", "de_vap", "loi_khuyen")}


def hoa_linh_vuc(hoa: str, cung: str) -> dict | None:
    m = _muc(_lay("hoa_linh_vuc", hoa, cung))
    return {"y": _chuoi(m.get("y")), "loi_khuyen": _chuoi(m.get("loi_khuyen"))} if m else None


def nhom_sao_linh_vuc(nhom: str, cung: str) -> dict | None:
    """nhom = "cat" | "sat" | "dao_hoa"."""
    m = _muc(_lay("nhom_sao_linh_vuc", nhom, cung))
    return {"y": _chuoi(m.get("y")), "loi_khuyen": _chuoi(m.get("loi_khuyen"))} if m else None


_CAP_SAT = {"Kình Dương": "kinh_da", "Đà La": "kinh_da", "Hỏa Tinh": "hoa_linh", "Hoả Tinh": "hoa_linh",
            "Linh Tinh": "hoa_linh", "Địa Không": "khong_kiep", "Địa Kiếp": "khong_kiep"}


def sat_loi_khuyen(cung: str, sao: list[str]) -> str | None:
    """Việc nên làm khi lục sát ở `cung`, theo cặp sao của sát tinh ĐẦU TIÊN có câu."""
    for s in sao:
        x = _chuoi(_lay("sat_loi_khuyen", cung, _CAP_SAT.get(s, "")))
        if x:
            return x
    return None


def nhom_sao_chi_tiet(sao: str) -> str | None:
    """Một vế nói rõ sao cát/sát CỤ THỂ trong cung (vd Khôi Việt → người giúp là người lớn tuổi)."""
    return _chuoi(_lay("nhom_sao_chi_tiet", sao))


def suc_khoe(ma: str) -> dict | None:
    """ma = tên chính tinh | "sat" | ... → {"bo_phan", "thoi_quen", "loi_khuyen"}."""
    m = _muc(_lay("suc_khoe", ma))
    return {k: _chuoi(m.get(k)) for k in ("bo_phan", "thoi_quen", "loi_khuyen")} if m else None


def suc_khoe_chung() -> str:
    """Câu miễn trừ — LUÔN có (KB thiếu → câu mặc định trong mã)."""
    return _chuoi(_lay("suc_khoe", "chung")) or CHUNG_SUC_KHOE


def suc_khoe_vo_chinh_dieu() -> str | None:
    return _chuoi(_lay("suc_khoe", "vo_chinh_dieu"))


def dai_han(cung: str) -> dict | None:
    """→ chu_de, nen_lam, de_vap + việc nên làm theo MỨC của giai đoạn (`thuan` / `can_bang` / `can_chu_dong`) và
    `tuoi_nho` (giai đoạn bắt đầu từ 12 tuổi trở xuống — lời cho tuổi đi học, không nói cưới xin, nhà đất)."""
    m = _muc(_lay("dai_han", cung))
    return {k: _chuoi(m.get(k)) for k in ("chu_de", "nen_lam", "de_vap", "thuan", "can_bang", "can_chu_dong",
                                          "tuoi_nho")} if m else None


def tuan_triet(cung: str) -> dict | None:
    """Tuần/Triệt đóng ở cung → {"tuan", "triet", "loi_khuyen" (Tuần), "loi_khuyen_triet"} (câu riêng từng cung)."""
    m = _muc(_lay("tuan_triet", cung))
    return {k: _chuoi(m.get(k)) for k in ("tuan", "triet", "loi_khuyen", "loi_khuyen_triet")} if m else None


def than_cu(cung: str) -> dict | None:
    """Thân cư cung → {"y", "loi_khuyen"}."""
    m = _muc(_lay("than_cu", cung))
    return {k: _chuoi(m.get(k)) for k in ("y", "loi_khuyen")} if m else None


def suc_khoe_sat(sao: str) -> dict | None:
    """Lục sát ở Tật Ách, theo từng sao → {"thoi_quen", "loi_khuyen"}."""
    m = _muc(_lay("suc_khoe", "sat_sao", sao))
    return {k: _chuoi(m.get(k)) for k in ("thoi_quen", "loi_khuyen")} if m else None


def nhan_muc(muc: str) -> str:
    return _chuoi(_lay("muc", muc)) or MUC_MAC_DINH[muc]


def cach_cuc_doi_thuong(ma: str, ten: str | None = None) -> str | None:
    """Khoá theo mã cách cục (`tuvi_cach_cuc`), chấp nhận cả tên gốc."""
    return _chuoi(_lay("cach_cuc_doi_thuong", ma)) or (_chuoi(_lay("cach_cuc_doi_thuong", ten)) if ten else None)


def cum_cam() -> list[str]:
    x = _lay("cum_cam")
    return [s.strip() for s in x if isinstance(s, str) and s.strip()] if isinstance(x, list) else []


def cum_chung_chung() -> list[str]:
    """Cụm "chung chung" (ai đọc cũng đúng, không có việc cụ thể) — lời luận đời sống không được chứa (test bắt,
    `scripts/do_chung_chung_tuvi.py` đo). Khác `cum_cam` (giọng AI / doạ)."""
    x = _lay("cum_chung_chung")
    return [s.strip() for s in x if isinstance(s, str) and s.strip()] if isinstance(x, list) else []


# Cụm ngắn trùng với từ ghép vô hại: "khắc" ≠ "khắc phục", "xui" ≠ "xui khiến". So khớp theo ranh giới âm tiết.
_NGOAI_LE = {"khắc": ("phục", "khoải", "ghi", "hoạ", "sâu", "kỷ", "khổ"), "xui": ("khiến", "giục")}
_NGOAI_LE_TRUOC = {"khắc": ("nghiêm", "khoảnh", "điêu", "chạm", "tạc", "thời"), "xui": ("giục",)}


@lru_cache(maxsize=512)
def _mau_cum(cum: str):
    import re
    sau, truoc = _NGOAI_LE.get(cum), _NGOAI_LE_TRUOC.get(cum)
    duoi = rf"(?!\s+(?:{'|'.join(sau)})(?!\w))" if sau else ""
    # look-behind cần độ dài cố định → mỗi từ đứng trước một nhánh riêng
    dau = "".join(rf"(?<!(?<!\w){t}\s)" for t in truoc) if truoc else ""
    return re.compile(rf"(?<!\w){dau}{re.escape(cum)}(?!\w){duoi}", re.IGNORECASE)


def tim_cum_cam(van: str, ds: list[str] | None = None) -> list[str]:
    """Các cụm cấm (KB `cum_cam`) có trong `van`, khớp theo ranh giới âm tiết, không phân biệt hoa thường."""
    import unicodedata
    van = unicodedata.normalize("NFC", van or "")
    return [c for c in (cum_cam() if ds is None else ds) if _mau_cum(unicodedata.normalize("NFC", c)).search(van)]
