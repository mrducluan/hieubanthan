# -*- coding: utf-8 -*-
"""Tầng KB — Luận giải Bát tự "đời sống" (BT-ĐS, `docs/LUAN-GIAI-DOI-SONG.md` mục 6).

Nguồn: app/kb/data/battu_doi_song_kb.json (nháp AI, `source_id` + `school_id` ở gốc tệp — khung Tử Bình). Chỉ TRA,
không sinh nghĩa. Tệp / khoá / ô chưa có → hàm trả None hoặc rỗng (RULES rơi về câu chung trong mã, không vỡ).
Danh sách cụm "giọng AI" dùng CHUNG với Tử vi (`tuvi_doi_song_kb.cum_cam`) — một nguồn, test bắt cả hai mảng.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.kb import tuvi_doi_song_kb as _tv

_F = Path(__file__).parent / "data" / "battu_doi_song_kb.json"
SOURCE_ID, SCHOOL_ID = "tu_binh_chan_thuyen", "tu_binh"
MUC_MAC_DINH = {"thuan": "Thuận lợi", "can_bang": "Cân bằng", "can_chu_dong": "Cần lưu ý"}
THAN_MAC_DINH = {"manh": "Sức tự thân: mạnh", "yeu": "Sức tự thân: cần thêm điểm tựa", "can_bang": "Sức tự thân: cân bằng"}
CHUNG_SUC_KHOE = _tv.CHUNG_SUC_KHOE


@lru_cache(maxsize=1)
def _doc() -> dict:
    try:
        d = json.loads(_F.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _d() -> dict:
    return _doc()


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


def _chuoi_hoa(m: dict | None, *khoa: str) -> dict | None:
    return {k: _chuoi(m.get(k)) for k in khoa} if m else None


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", SOURCE_ID),
            "school_id": d.get("school_id", SCHOOL_ID)}


def nhan_muc(muc: str) -> str:
    return _chuoi(_lay("muc", muc)) or MUC_MAC_DINH[muc]


def nhan_than(than: str) -> str:
    return _chuoi(_lay("than", than)) or THAN_MAC_DINH[than]


def nhom(ten: str) -> str | None:
    """Tên đời thường của nhóm thập thần ("Tài" → "tiền bạc, thành quả nắm được")."""
    return _chuoi(_lay("nhom", ten))


def nhat_chu(can: str) -> dict | None:
    """{hinh_tuong, chan_dung, manh|yeu|can_bang: {manh, de_vap, loi_khuyen}}."""
    m = _muc(_lay("nhat_chu", can))
    if not m:
        return None
    ra = {"hinh_tuong": _chuoi(m.get("hinh_tuong")), "chan_dung": _chuoi(m.get("chan_dung")),
          "cau_tu_soi": _chuoi(m.get("cau_tu_soi"))}
    for th in ("manh", "yeu", "can_bang"):
        ra[th] = _chuoi_hoa(_muc(m.get(th)), "manh", "de_vap", "loi_khuyen")
    return ra


def noi_bat(tt: str) -> dict | None:
    return _chuoi_hoa(_muc(_lay("noi_bat", tt)), "y", "de_vap", "loi_khuyen")


def cach(ma: str) -> dict | None:
    """{ten, y, de_vap, loi_khuyen, nghe, hy, ky, than_nhuoc?, than_vuong?} — hy/ky là danh sách nhóm thập thần."""
    m = _muc(_lay("cach", ma))
    if not m:
        return None
    ra = _chuoi_hoa(m, "ten", "y", "de_vap", "loi_khuyen", "nghe")
    for k in ("hy", "ky"):
        ra[k] = [x for x in m.get(k) or [] if isinstance(x, str)]
    for k in ("than_nhuoc", "than_vuong"):
        o = _muc(m.get(k))
        if o:
            ra[k] = {kk: [x for x in o.get(kk) or [] if isinstance(x, str)] for kk in ("hy", "ky")}
    return ra


def hanh(h: str) -> dict:
    m = _muc(_lay("hanh", h)) or {}
    return {k: _chuoi(v) for k, v in m.items()}


def than_sat(ten: str) -> dict | None:
    return _chuoi_hoa(_muc(_lay("than_sat", ten)), "tieu_de", "y", "loi_khuyen")


def tinh_huong_ds(chuong: str) -> dict[str, dict]:
    m = _muc(_lay("tinh_huong", chuong)) or {}
    return {k: {"loai": _chuoi(v.get("loai")) or "diem_manh", "tieu_de": _chuoi(v.get("tieu_de")), "y": _chuoi(v.get("y")),
                "loi_khuyen": _chuoi(v.get("loi_khuyen"))} for k, v in m.items() if isinstance(v, dict)}


def tinh_huong(chuong: str, ma: str) -> dict | None:
    return tinh_huong_ds(chuong).get(ma)


def phoi_ngau(tt: str) -> dict | None:
    m = _muc(_lay("phoi_ngau", tt))
    if not m:
        return None
    return {"loai": _chuoi(m.get("loai")) or "diem_manh", "tieu_de": _chuoi(m.get("tieu_de")), "y": _chuoi(m.get("y")),
            "loi_khuyen": _chuoi(m.get("loi_khuyen"))}


def suc_khoe_than(th: str) -> dict | None:
    return _chuoi_hoa(_muc(_lay("suc_khoe", "than", th)), "y", "loi_khuyen")


def suc_khoe_can_doi() -> str | None:
    return _chuoi(_lay("suc_khoe", "can_doi"))


def suc_khoe_chung() -> str:
    """Câu miễn trừ — LUÔN có (KB thiếu → câu mặc định trong mã)."""
    return _chuoi(_lay("suc_khoe", "chung")) or CHUNG_SUC_KHOE


def van(tt: str) -> dict | None:
    return _chuoi_hoa(_muc(_lay("van", tt)), "chu_de", "nen_thuan", "de_vap", "nen_chu_dong")


def thang(tt: str) -> str | None:
    return _chuoi(_lay("thang", tt))


def nam_quan_he(loai: str) -> dict | None:
    return _chuoi_hoa(_muc(_lay("nam_quan_he", loai)), "tieu_de", "y", "loi_khuyen")


VAN_THAM_CHIEU_KHOA = ("cuoc_doi_tom", "cuoc_doi_dau", "cuoc_doi_sau", "nam_nay_tieu_de", "nam_nay_hop",
                       "nam_nay_muc", "nam_nay_tom")


def van_tham_chieu(trang_thai: str) -> dict | None:
    """Câu theo trạng thái đại vận lúc xem (`dang_di` / `chua_khoi` / `da_qua_van_cuoi`) — mẫu có biến {chu_de},
    {tu_tuoi}, {den_tuoi}, {nam_tu}, {nam_den}, {so_nam}, {so_van}, {muc}."""
    return _chuoi_hoa(_muc(_lay("van_tham_chieu", trang_thai)), *VAN_THAM_CHIEU_KHOA)


VAN_HAN_KHOA = ("nhan", "mang", "y", "tranh", "lam")


def van_han_loi(*khoa: str) -> dict | None:
    """VH-1 — lời chương "Vận hạn & điều nên tránh": `van_han.<khoá…>` → {nhan, mang, y, tranh, lam} (ô thiếu = None).
    Khoá: `thap_than.<thập thần>.can|thuan[.<tre|lon>]`, `nho.<can|thuan>`, `co.<cờ>`, `thang.<can|thuan>`."""
    m = _muc(_lay("van_han", *khoa))
    return {k: _chuoi(m.get(k)) for k in VAN_HAN_KHOA} if m else None


def tom_tat(chuong: str, muc: str) -> str | None:
    return _chuoi(_lay("tom_tat", chuong, muc))


def cau_tu_soi(chuong: str) -> str | None:
    return _chuoi(_lay("cau_tu_soi", chuong))


def cum_cam() -> list[str]:
    """Danh sách chung với Tử vi (+ cụm riêng của tệp này nếu có `cum_cam`)."""
    rieng = _lay("cum_cam")
    them = [s.strip() for s in rieng if isinstance(s, str) and s.strip()] if isinstance(rieng, list) else []
    return list(dict.fromkeys([*_tv.cum_cam(), *them]))


def doi_chieu(*khoa: str):
    """BT-DC "Cách nào đúng với mình?" — chuỗi / bảng theo khoá (None khi thiếu)."""
    x = _lay("doi_chieu", *khoa)
    return _chuoi(x) if isinstance(x, str) else x if isinstance(x, dict) else None
