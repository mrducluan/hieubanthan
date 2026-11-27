# -*- coding: utf-8 -*-
"""CV-2 — Cố vấn Tam Tài "hiểu câu hỏi" (RULES, tất định, không LLM, không lưu chữ người dùng).

Từ MỘT câu hỏi rút ra ba thứ mà trước đây Cố vấn bỏ qua:
  - việc cụ thể (mở cửa hàng ≠ nghỉ việc ra làm riêng ≠ đầu tư …) và việc ấy có đụng tới không gian nào (mặt bằng / nhà ở);
  - kiểu câu (có nên · khi nào · so sánh …) — dùng chung `hoidap.hieu_cau.kieu`;
  - khung thời gian được hỏi ("năm sau" = năm tới, "tháng 3 năm sau", "năm 2027") — dùng chung `hoidap.hieu_cau.thoi_gian`.
Không đoán: không nhận ra việc → trả None để nơi gọi chuyển hướng như cũ.
"""
from __future__ import annotations

import datetime as dt
import re
from dataclasses import dataclass

from app.hoidap import chung, hieu_cau

# (mã việc, mạch của Cố vấn, không gian, loại hình mặt bằng, mẫu nhận diện — chữ thường, bỏ dấu). Việc cụ thể đứng trước.
_VIEC: list[tuple[str, str, str, str | None, list[str]]] = [
    ("gop_von", "gop_von_hop_tac", "khong", None, [
        r"(hun von|gop von|chung von|gop co phan|lam an chung|lam chung|co[ -]?founders?|chia co phan|chia 50|doi tac lam an)",
        r"\b(co[ -]?founders?|pool capital|split equity|equity split|business partners?|joint ventures?)\b"]),
    ("mo_rong", "su_nghiep_chuyen_viec", "mat_bang", "cua_hang", [
        r"(chi nhanh|mo them (cua hang|quan|shop|diem)|diem ban thu hai)",
        r"\b(second (store|location|branch)|new branch|open another|expand .{0,15}(store|shop|cafe)|another location)\b"]),
    ("mo_quan", "su_nghiep_chuyen_viec", "mat_bang", "quan_ca_phe", [
        r"(mo (them )?quan|quan ca phe|ca phe|quan an\b|nha hang|quan nhau|quan com|tra sua|tiem banh|quan bia)",
        r"\b(open .{0,20}(cafe|coffee|restaurant|bar|bakery)|cafe|coffee shop|restaurant)\b"]),
    ("mo_cua_hang", "su_nghiep_chuyen_viec", "mat_bang", "cua_hang", [
        r"(mo (them )?(shop|cua hang|tiem|showroom|spa|salon|studio|phong kham|phong tap|trung tam)|thue mat bang|mat bang (moi|kinh doanh)|\bshop\b|cua hang)",
        r"\b(open .{0,20}(shop|store|boutique|studio|salon|spa|clinic)|retail|storefront|commercial lease|premises)\b"]),
    ("ra_lam_rieng", "su_nghiep_chuyen_viec", "khong", None, [
        r"(ra lam rieng|lam rieng|nghi viec|bo viec|khoi nghiep|mo cong ty|kinh doanh rieng|tu kinh doanh|buon ban|kinh doanh\b|lam an\b|nghi han|tach xuong)",
        r"\b(quit my job|leave .{0,20}job|go independent|startup|start a business|own business|freelanc\w*|launch .{0,25}(company|venture))\b"]),
    ("chuyen_viec", "su_nghiep_chuyen_viec", "khong", None, [
        r"(nhay viec|chuyen viec|doi (viec|nghe)|thang chuc|giam doc|san dau nguoi|offer|su nghiep)",
        r"\b(change jobs?|new job|career|headhunter|director|promotion|job offer)\b"]),
    ("dau_tu", "tai_chinh_dau_tu", "khong", None, [
        r"(dau tu|xuong tien|giu tien|co phieu|trai phieu|gui ky han|so tiet kiem|dong tien|cong no|thu hoi no|vay them von|thanh khoan|lo dat)",
        r"\b(invest\w*|stocks|cashflow|receivables|debt|loan|liquidity|savings)\b"]),
    ("mua_nha", "nha_cua_mat_bang", "nha_o", None, [
        r"(mua nha|mua can ho|chung cu|nha pho|chuyen nha|chuyen cho o|chuyen dia diem|ra o rieng|sua nha|dat bep|xay nha)",
        r"\b(buy a (house|home|flat)|apartment|relocat\w*|move house|renovat\w*|build a house)\b"]),
    ("gia_dao", "gia_dao_hoa_giai", "khong", None, [
        r"(vo chong|gia dinh|gia dao|con cai|nuoi day con|noi ngoai|bo me va hai vo chong).{0,45}(cai nhau|luc duc|cang thang|bat hoa|bat dong|lanh nhat|chien tranh lanh|ngot ngat|xung dot|hoa giai|go nut)",
        r"(cai nhau|luc duc|cang thang|bat hoa|bat dong|ngot ngat|xung dot).{0,45}(vo chong|gia dinh|bo me|trong nha)",
        r"(chien tranh lanh|bat hoa gia dinh|mau thuan vo chong)",
        r"\b(marriage|spouse|husband|wife|family|in-laws).{0,35}(conflict|argue|friction|tension|cold war)\b"]),
    ("suc_ben", "suc_ben_nang_luong", "khong", None, [
        r"(kiet suc|met moi|mat ngu|burnout|qua tai|hut hoi|ue oai|duoi suc|chan nan|nghi phep dai|ap luc tinh than)",
        r"\b(burnout|exhausted|insomnia|stamina|overloaded|drained|overwhelmed|fatigue)\b"]),
    ("tinh_cam", "tinh_cam_cam_ket", "khong", None, [
        r"(ket hon|dang ky ket hon|cuoi hoi|giuc cuoi|tinh cam|nguoi yeu|ban trai|ban gai|hen ho|chia tay|ly hon|mo long|moi tinh)",
        r"\b(marry|wedding|relationship|dating|breakup|divorce|boyfriend|girlfriend|romance)\b"]),
]
_TOI_DA_NAM_TOI = 1          # xem được năm nay và năm tới (khớp "Thời gian tới")


@dataclass(frozen=True)
class Viec:
    ma: str
    mach: str
    khong_gian: str                 # "mat_bang" | "nha_o" | "khong"
    loai_hinh: str | None           # loại hình mặt bằng khi khong_gian = mat_bang


def viec(t: str) -> Viec | None:
    """`t` = câu đã `chung.chuan_hoa_cau`. None = chưa nhận ra việc nào (không rơi về việc mặc định)."""
    for ma, mach, kg, lh, mau in _VIEC:
        if chung.co(t, mau):
            return Viec(ma, mach, kg, lh)
    return None


_THANG_EN = {n: i + 1 for i, n in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"])}
_RE_THANG_EN = re.compile(r"\b(?:in |by |around |for )?(" + "|".join(_THANG_EN) + r")(?: (next year|(20[2-4]\d)))?\b")


def _moc_en(t: str, hom_nay: dt.date) -> list[dict]:
    """Mốc thời gian trong câu hỏi tiếng Anh (bộ đọc của hỏi đáp chỉ hiểu tiếng Việt): next year · this year · <tháng> [next year | năm]."""
    y0 = hom_nay.year
    if (m := _RE_THANG_EN.search(t)):
        th = _THANG_EN[m.group(1)]
        y = int(m.group(3)) if m.group(3) else (y0 + 1 if m.group(2) else (y0 if th >= hom_nay.month else y0 + 1))
        return [{"nam": y, "thang": th}]
    if re.search(r"\bnext year\b", t):
        return [{"nam": y0 + 1, "tuong_doi": "nam_sau"}]
    if re.search(r"\bthis year\b", t):
        return [{"nam": y0, "tuong_doi": "nam_nay"}]
    if (m := re.search(r"\b(20[2-4]\d)\b", t)):
        return [{"nam": int(m.group(1))}]
    return []


def khung(t: str, hom_nay: dt.date) -> dict:
    """Khung thời gian được hỏi: {"nam", "thang"|None, "mac_dinh", "ngoai_pham_vi"|None}.
    Không có mốc / mốc đã qua → 12 tháng tới (`mac_dinh`); mốc xa hơn năm tới → nói thật `ngoai_pham_vi` rồi dùng khung mặc định."""
    moc = [m for m in (hieu_cau.thoi_gian(t, hom_nay) or _moc_en(t, hom_nay)) if m["nam"] >= hom_nay.year]
    if not moc:
        return {"nam": hom_nay.year, "thang": None, "mac_dinh": True, "ngoai_pham_vi": None}
    m = moc[0]
    if m["nam"] > hom_nay.year + _TOI_DA_NAM_TOI:
        return {"nam": hom_nay.year, "thang": None, "mac_dinh": True, "ngoai_pham_vi": m["nam"]}
    thang = m.get("thang")
    if m["nam"] == hom_nay.year and thang is not None and thang < hom_nay.month:
        thang = None
    return {"nam": m["nam"], "thang": thang, "mac_dinh": False, "ngoai_pham_vi": None}


def kieu(t: str) -> str:
    """Kiểu câu: bộ nhận diện dùng chung của hỏi đáp (tiếng Việt) + vài mẫu tiếng Anh (bản `/en`)."""
    k = hieu_cau.kieu(t)
    if k != "mo_ta":
        return k
    if re.search(r"\bwhen (should|is|can|do)\b|\bwhat time\b", t):
        return "khi_nao"
    if re.search(r"\b(should i|can i|is it (ok|okay|good|wise|worth)|would it be|will it work|good idea|worth it|go well)\b", t):
        return "co_nen"
    return k


def hieu(cau_hoi: str, t: str, hom_nay: dt.date) -> dict:
    v = viec(t)
    return {"viec": v, "kieu": kieu(t), "khung": khung(t, hom_nay)}

