# -*- coding: utf-8 -*-
"""HTT-2 H6 — "Soạn lại nháp → PR" cho mã hộp bị LỆCH theo ngôn ngữ (docs/DANH-GIA-HYBRID-TWO-TIER.md mục 5, chủ dự án duyệt
2026-11-09). Khung "Lệch theo ngôn ngữ" ở /quan-tri/hoc báo mã nào bản tiếng Anh được thấy "đúng" ít hơn hẳn bản Việt; người
duyệt bấm "Soạn lại nháp": máy

  1. suy từ MÃ ra CỤM chuỗi KB đã sinh hộp đó (`nguon_cua_ma`): Tarot → lá bài trong mã (`la.<id>`), Điểm giao thoa → mẫu câu
     (`mau.cung_mang.<khoá>` …); mã môn khác → chưa hỗ trợ (sửa tay trong Kho tri thức);
  2. chạy lại máy chuyển ngữ QT-0 ba lượt (chuyển ngữ → biên tập bản xứ → kiểm định có điểm + dịch ngược) CHỈ trên cụm đó,
     bộ kiểm luật cố định như mọi bản dịch (`quy_trinh.chuyen`);
  3. trả NHÁP: từng đường dẫn chuỗi với bản Anh đang dùng và bản Anh mới (+ lỗi) → web mở PR vào `kb/data/en/<tệp>` qua
     cơ chế QT-1 (nhánh `quan-tri/…`, người merge). Máy không ghi KB, không tự bật — đúng tầng HỌC.
"""
from __future__ import annotations

import json
import re
from collections.abc import Callable
from pathlib import Path

from app.chuyen_ngu import quy_trinh

_DATA = Path(__file__).parents[1] / "kb" / "data"
_LA = re.compile(r"^(dai_\d{1,2}|(gay|coc|kiem|tien)_(\d{1,2}|hoang_hau|vua|hiep_si|tieu_dong))$")
# Trong cụm lá bài, KHÔNG soạn lại tên lá (giữ tên chuẩn Waite 1910); mã / id đã bị `quy_trinh.KHOA_BO` bỏ sẵn.
_KHOA_GIU_LA = {"ten"}


def _doc(tep: str, ngon_ngu: str | None = None) -> dict | None:
    p = _DATA / ngon_ngu / tep if ngon_ngu else _DATA / tep
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def nguon_cua_ma(ma: str) -> dict | None:
    """Mã hộp → {tep, cum: [đường dẫn gốc cụm], mo_ta}. Không suy được → None (web ghi "sửa tay trong Kho tri thức")."""
    p = (ma or "").split(".")
    if len(p) < 3 or p[0] != "ds":
        return None
    if p[1] == "tarot":
        la = next((x for x in p[2:] if _LA.match(x)), None)
        if la:
            return {"tep": "tarot_kb.json", "cum": [f"la.{la}"], "mo_ta": f"lá bài {la}"}
        if len(p) > 2 and p[2] in ("tra_loi", "cau_chuyen", "tong_quan", "tung_la", "dong_chay", "ben_trong", "thoi_diem", "viec"):
            return {"tep": "tarot_kb.json", "cum": [f"chuong.{p[2]}"], "mo_ta": f"chương {p[2]} của bài đọc Tarot"}
        return None
    if p[1] == "giao_thoa":
        if len(p) >= 5 and p[3] == "mon":
            return {"tep": "giao_thoa_kb.json", "cum": [f"mau.cung_mang.{p[4]}", f"mang.{p[2]}"], "mo_ta": f"mẫu 'cùng mảng' ({p[4]}) + tên mảng {p[2]}"}
        if len(p) >= 5 and p[3] == "mang":
            return {"tep": "giao_thoa_kb.json", "cum": [f"mau.cung_mon.{p[4]}", f"mon.{p[2]}"], "mo_ta": f"mẫu 'cùng môn' ({p[4]}) + tên môn {p[2]}"}
        if len(p) >= 4 and p[3] == "lech":
            return {"tep": "giao_thoa_kb.json", "cum": ["mau.lech", f"mang.{p[2]}"], "mo_ta": f"mẫu 'chỗ chưa khớp' + tên mảng {p[2]}"}
    return None


def _lay(d, duong: str):
    o = d
    for k in duong.split("."):
        if isinstance(o, list):
            if not k.isdigit() or int(k) >= len(o):
                return None
            o = o[int(k)]
        elif isinstance(o, dict):
            if k not in o:
                return None
            o = o[k]
        else:
            return None
    return o


def _chuoi_cum(goc: dict, cum: list[str]) -> dict[str, str]:
    """Mọi lá chuỗi của cụm (đường dẫn đầy đủ → chữ Việt), bỏ khoá giữ nguyên."""
    ra: dict[str, str] = {}
    for c in cum:
        nhanh = _lay(goc, c)
        if nhanh is None:
            continue
        for duong, v in quy_trinh.la_chuoi(nhanh, c):
            if c.startswith("la.") and duong.split(".")[-1] in _KHOA_GIU_LA:
                continue
            ra[duong] = v
    return ra


def soan_lai(ma: str, ngon_ngu: str, *, goi: Callable, mang: list[str] | None = None) -> dict:
    """→ {ma, ngon_ngu, tep, cum, mo_ta, muc: [{duong, vi, hien_tai, moi, loi}], so}. `moi` = None khi máy không trả / không qua kiểm.
    Chỉ đường dẫn CÓ trong bản phủ hiện tại mới mở PR được (sửa đúng giá trị đang có — QT-1); đường dẫn thiếu → `hien_tai = None`,
    người duyệt thêm tay."""
    ng = nguon_cua_ma(ma)
    if not ng:
        return {"ma": ma, "ngon_ngu": ngon_ngu, "tep": None, "cum": [], "mo_ta": "chưa suy được cụm KB từ mã — sửa tay trong Kho tri thức",
                "muc": [], "so": {"tong": 0, "qua": 0, "kiem_dinh": "tat"}}
    goc = _doc(ng["tep"]) or {}
    phu = _doc(ng["tep"], ngon_ngu) or {}
    chuoi = _chuoi_cum(goc, ng["cum"])
    # Khung phẳng c0, c1… (không dùng đường dẫn thật: `quy_trinh.la_chuoi` bỏ khoá hệ thống như "mang", "loai" ở mọi tầng).
    khoa = {f"c{i}": duong for i, duong in enumerate(chuoi)}
    d: dict = {"source_id": goc.get("source_id"), "school_id": goc.get("school_id"), **{k: chuoi[v] for k, v in khoa.items()}}
    kq = quy_trinh.chuyen(d, goi=goi, mang=mang, kiem_dinh=True) if chuoi else {"ban_en": {}, "loi": {}, "so": {"tong": 0, "qua": 0, "kiem_dinh": "tat"}}
    muc = []
    for k, duong in khoa.items():
        moi = kq["ban_en"].get(k)
        muc.append({"duong": duong, "vi": chuoi[duong], "hien_tai": _lay(phu, duong), "moi": moi if isinstance(moi, str) else None,
                    "loi": kq["loi"].get(k, [])})
    return {"ma": ma, "ngon_ngu": ngon_ngu, "tep": f"{ngon_ngu}/{ng['tep']}", "cum": ng["cum"], "mo_ta": ng["mo_ta"], "muc": muc, "so": kq["so"]}


__all__ = ["nguon_cua_ma", "soan_lai"]
