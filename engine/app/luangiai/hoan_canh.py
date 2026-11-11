# -*- coding: utf-8 -*-
"""EN-2 mục 5 — lời theo tuổi và hoàn cảnh (RULES, tất định, không LLM).

Một hộp "với bạn lúc này" (loại `loi_khuyen`) ở 5 chương đời sống hay hỏi — công việc, tiền bạc, tình yêu, gia đình, sức
khoẻ — chọn theo: MỨC chương đã chấm (không đổi mức) × nhóm tuổi tròn (18–24 · 25–44 · 45–59 · từ 60) × tình trạng
(độc thân / có đôi) mà NGƯỜI DÙNG TỰ CHỌN trên hồ sơ (chỉ chương tình yêu + gia đình đọc; không chọn → lời chung
"chua_noi"; không bao giờ suy đoán). Dưới 18 tuổi: không thêm hộp (lời cho trẻ đã có ở chương vận hạn).
Tình trạng chỉ đi qua lượt gọi để chọn câu, engine không lưu và KHÔNG ghi ra bất kỳ trường nào của đầu ra: mã kiểm chứng
`<tiền tố>.<chương>.hoan_canh.<mức>.<nhóm tuổi>` (chỉ dữ kiện ĐÃ TÍNH — quy tắc riêng tư (d) CLAUDE.md; phiếu "Đúng với
mình" ghi DB + đo lường không được mang tình trạng — review 2026-11-02 C1), qua regex `doi_song` của 0017.
Lời ở KB `kb/data/hoan_canh_kb.json` (source_id + school_id). Hộp sức khoẻ luôn kèm câu không thay lời bác sĩ.
Đặt ở TRƯỜNG RIÊNG của chương `loi_hoan_canh` (web hiện thành dòng "Với bạn lúc này" dưới các hộp) — không chen vào `hop`:
không tranh trần 6 hộp, không bao giờ xoá / thay hộp gắn lá số + phiếu của người dùng (review C2: chen vào `hop` thì chương
Gia đình Tử vi luôn đầy, lời không bao giờ hiện). Chương khoá SAO-2 bị web cắt còn tiêu đề → trường này không lộ. Không vào
"Điều quan trọng nhất", không đi vào lời nhắc AI diễn đạt (AI chỉ nhận đoạn + hộp).
"""
from __future__ import annotations

from app.kb.loi import L

import datetime as dt
import itertools
from pathlib import Path

from app.luangiai import doi_song_khuon as kh
from app.kb import nap

CHUONG = ("su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "suc_khoe")
CHUONG_THEO_TINH_TRANG = ("tinh_cam", "gia_dinh")
MUC = ("thuan", "can_bang", "can_chu_dong")
NHOM = ("t18_24", "t25_44", "t45_59", "t60")
TINH_TRANG = ("doc_than", "co_doi", "chua_noi")
TUOI_TOI_THIEU = 18
BAC_SI = "Đây là lời nhắc chăm sóc, không thay lời bác sĩ."

_KB = Path(__file__).resolve().parents[1] / "kb" / "data" / "hoan_canh_kb.json"


@nap.nho
def _kb() -> dict:
    return nap.doc(_KB.name)


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
    noi = o["noi_dung"]
    bac_si = L("hoan_canh.bac_si", BAC_SI)
    if chuong == "suc_khoe" and bac_si not in noi:
        noi = f"{noi} {bac_si}"
    h = {"loai": "loi_khuyen", "tieu_de": o["tieu_de"], "noi_dung": noi,
         "can_cu": [L("hoan_canh.can_cu", "Lời chọn theo mức của chương và giai đoạn tuổi — không đổi mức, không suy đoán.")],
         "_w": 0.0, "_ch": chuong}
    # Mã kiểm chứng chỉ khi MỘT mã ↔ MỘT lời (review lần 2): chương tình yêu / gia đình có ba lời theo tình trạng mà mã không
    # được mang tình trạng → chỉ lời chung ("chua_noi") nhận phiếu; hai lời kia không có nút kiểm chứng, không gộp tỉ lệ.
    if tt in (None, "chua_noi"):
        h["ma_mau"] = ".".join([tien_to, chuong, "hoan_canh", muc, nhom])
    return h


def ap(chuong_ds: list[dict], ngay_sinh: dt.date, ngay_xem: dt.date, tinh_trang: str | None, tien_to: str,
       hoc: tuple = (None, None)) -> None:
    """Gắn `loi_hoan_canh` cho 5 chương (sửa tại chỗ). Luật HỌC dùng chung (`kh.danh_gia_phieu`): ≥ 30 phiếu → gắn tỉ lệ
    đúng; ≥ 100 phiếu & < 40 % đúng → không hiện, ghi một dòng "Đang xem lại" vào `can_cu` như mọi hộp khác. Phiếu của
    chính người xem "chưa đúng" → không hiện với người đó (dòng đơn lẻ, không có chỗ "xếp cuối")."""
    trong_so, ca_nhan = hoc[0] or {}, hoc[1] or {}
    for c in chuong_ds:
        h = hop(c.get("ma", ""), c.get("muc"), ngay_sinh, ngay_xem, tinh_trang, tien_to)
        if not h:
            continue
        h.pop("_w", None)
        h.pop("_ch", None)
        if ca_nhan.get(h.get("ma_mau", "")) == "chua_dung":    # chính người xem đã bấm "chưa đúng" → không hiện lại với họ
            continue
        dg = kh.danh_gia_phieu(trong_so.get(h.get("ma_mau", "")))
        if dg:
            h["ty_le_dung"], h["so_phieu"] = dg[0], dg[1]
            if dg[2]:
                c.setdefault("can_cu", []).append(L("hop.dang_xem_lai_dong", f"Đang xem lại: {h['tieu_de']}", tieu_de=h["tieu_de"]))
                continue
        c["loi_hoan_canh"] = h
