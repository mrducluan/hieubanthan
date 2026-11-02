# -*- coding: utf-8 -*-
"""EN-2 mục 5 — lời theo tuổi và hoàn cảnh (RULES, tất định, không LLM).

Một hộp "với bạn lúc này" (loại `loi_khuyen`) ở 5 chương đời sống hay hỏi — công việc, tiền bạc, tình yêu, gia đình, sức
khoẻ — chọn theo: MỨC chương đã chấm (không đổi mức) × nhóm tuổi tròn (18–24 · 25–44 · 45–59 · từ 60) × tình trạng
(độc thân / có đôi) mà NGƯỜI DÙNG TỰ CHỌN trên hồ sơ (chỉ chương tình yêu + gia đình đọc; không chọn → lời chung
"chua_noi"; không bao giờ suy đoán). Dưới 18 tuổi: không thêm hộp (lời cho trẻ đã có ở chương vận hạn).
Tình trạng chỉ đi qua lượt gọi để chọn câu, engine không lưu. Lời ở KB `kb/data/hoan_canh_kb.json` (source_id + school_id).
Mã kiểm chứng `<tiền tố>.<chương>.hoan_canh.<mức>.<nhóm>[.<tình trạng>]` — qua regex `doi_song` của 0017 (không migration).
"""
from __future__ import annotations

import datetime as dt
import itertools
import json
from functools import lru_cache
from pathlib import Path

from app.luangiai import doi_song_khuon as kh

CHUONG = ("su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "suc_khoe")
CHUONG_THEO_TINH_TRANG = ("tinh_cam", "gia_dinh")
MUC = ("thuan", "can_bang", "can_chu_dong")
NHOM = ("t18_24", "t25_44", "t45_59", "t60")
TINH_TRANG = ("doc_than", "co_doi", "chua_noi")
TUOI_TOI_THIEU = 18

_KB = Path(__file__).resolve().parents[1] / "kb" / "data" / "hoan_canh_kb.json"


@lru_cache(maxsize=1)
def _kb() -> dict:
    return json.loads(_KB.read_text(encoding="utf-8"))


def meta() -> dict:
    return _kb()["_meta"]


def tuoi_tron(ngay_sinh: dt.date, ngay_xem: dt.date) -> int:
    return ngay_xem.year - ngay_sinh.year - ((ngay_xem.month, ngay_xem.day) < (ngay_sinh.month, ngay_sinh.day))


def nhom_tuoi(tuoi: int) -> str | None:
    if tuoi < TUOI_TOI_THIEU:
        return None
    if tuoi < 25:
        return "t18_24"
    if tuoi < 45:
        return "t25_44"
    if tuoi < 60:
        return "t45_59"
    return "t60"


def _tt(chuong: str, tinh_trang: str | None) -> str | None:
    if chuong not in CHUONG_THEO_TINH_TRANG:
        return None
    return tinh_trang if tinh_trang in ("doc_than", "co_doi") else "chua_noi"


def loi(chuong: str, muc: str, nhom: str, tinh_trang: str | None = None) -> dict | None:
    o = _kb()["chuong"].get(chuong, {}).get(muc, {}).get(nhom)
    tt = _tt(chuong, tinh_trang)
    if o is not None and tt:
        o = o.get(tt)
    return o


def moi_to_hop():
    """Mọi (chương, mức, nhóm, tình trạng) phải có lời — dùng cho test."""
    for ch, muc, nhom in itertools.product(CHUONG, MUC, NHOM):
        for tt in (TINH_TRANG if ch in CHUONG_THEO_TINH_TRANG else ("chua_noi",)):
            yield ch, muc, nhom, tt


def hop(chuong: str, muc: str | None, ngay_sinh: dt.date, ngay_xem: dt.date, tinh_trang: str | None,
        tien_to: str) -> dict | None:
    """Hộp hoàn cảnh cho một chương, hoặc None (chương không thuộc 5 chương, chương không mang mức, dưới 18 tuổi)."""
    nhom = nhom_tuoi(tuoi_tron(ngay_sinh, ngay_xem))
    if chuong not in CHUONG or muc not in MUC or nhom is None:
        return None
    tt = _tt(chuong, tinh_trang)
    o = loi(chuong, muc, nhom, tt)
    if not o:
        return None
    ma = ".".join([tien_to, chuong, "hoan_canh", muc, nhom] + ([tt] if tt else []))
    return {"loai": "loi_khuyen", "tieu_de": o["tieu_de"], "noi_dung": o["noi_dung"],
            "can_cu": ["Lời chọn theo mức của chương, nhóm tuổi" + (" và tình trạng bạn tự chọn" if tt and tt != "chua_noi"
                                                                    else "") + " — không đổi mức, không suy đoán."],
            "ma_mau": ma, "hoan_canh": {"nhom_tuoi": nhom, "tinh_trang": tt}, "_w": 0.0, "_ch": chuong}


def ap(chuong_ds: list[dict], ngay_sinh: dt.date, ngay_xem: dt.date, tinh_trang: str | None, tien_to: str,
       hoc: tuple = (None, None), toi_da_hop: int = 6) -> None:
    """Thêm hộp hoàn cảnh vào cuối 5 chương (sửa tại chỗ). Chương đã đủ `toi_da_hop` → thay hộp NHẸ NHẤT không phải
    "lưu ý" (trọng số `_w` nhỏ nhất, hoà thì hộp đứng sau) để giữ trần số hộp — lời lưu ý luôn được giữ.
    `hoc` = (trong_so, ca_nhan): áp lại đúng luật HỌC dùng chung cho chương vừa thêm (hộp người xem bấm "chưa đúng" vẫn
    xếp cuối; hộp hoàn cảnh có tỉ lệ đúng thấp cũng rời lớp đời thường như mọi hộp khác)."""
    for c in chuong_ds:
        h = hop(c.get("ma", ""), c.get("muc"), ngay_sinh, ngay_xem, tinh_trang, tien_to)
        if not h:
            continue
        ds = c.setdefault("hop", [])
        if len(ds) < toi_da_hop:
            ds.append(h)
            continue
        ung_vien = [i for i, x in enumerate(ds) if x.get("loai") != "luu_y"]
        if not ung_vien:
            continue
        bo = min(ung_vien, key=lambda i: (float(ds[i].get("_w") or 0.0), -i))
        del ds[bo]
        ds.append(h)
    for c in chuong_ds:
        if any(".hoan_canh." in (x.get("ma_mau") or "") for x in c.get("hop", [])):
            kh.ap_hoc(c, *hoc)
