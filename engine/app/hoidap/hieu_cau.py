# -*- coding: utf-8 -*-
"""EN-3 — "Hiểu câu hỏi" dùng chung 5 mảng (RULES, tất định, không LLM). Đầu vào là câu ĐÃ chuẩn hoá bằng
`chuan_hoa_cau` (bỏ dấu, mở viết tắt). Ra: kiểu câu, các mốc thời gian được hỏi, người thứ hai. Mỗi mảng dùng các ô này
để không âm thầm rơi về "bản thân" khi câu hỏi là kiến thức, so sánh hai thời điểm hay về người khác."""
from __future__ import annotations

import datetime as dt
import re

from app.luangiai.hoi import _co

KIEN_THUC = [r"(la|co nghia la|nghia la|y nghia la) gi", r"y nghia (la )?gi", r"khac (nhau|gi nhau|gi|cho nao|o dau)",
             r"giong (nhau|va khac)", r"(duoc )?tinh (sao|the nao|nhu the nao|ra sao|bang cach nao|tu dau)",
             r"cach tinh", r"duoc tinh (tu|nhu|theo|bang)", r"doc (the nao|ra sao|nhu the nao)", r"la sao\b",
             r"co (that|that su|thuc su)? ?(boi|du doan|doan) duoc", r"co (khoa hoc|co so|chinh xac) khong",
             r"khac voi .{2,40} (the nao|ra sao|cho nao|o diem nao)"]
# Câu có chủ thể là người hỏi → không phải câu kiến thức thuần ("Nhật chủ CỦA TÔI là gì").
CA_NHAN = [r"cua (toi|em|minh|tui|tao|anh|chi|chau)", r"(toi|em|minh|tui) (co|bi|la|thuoc|sinh|duoc|nen|muon|dang)",
           r"cho (toi|em|minh)", r"(la so|bat tu|tu tru|nha) (cua )?(toi|em|minh)", r"tuoi (toi|em|minh)",
           r"nam nay (toi|em|minh)", r"(huong|menh|so) (toi|em|minh)\b"]
SO_SANH = [r"(\d{4}) (hay|hoac|voi|hay la) (nam )?(\d{4})", r"thang \d{1,2} (hay|hoac|voi) (thang )?\d{1,2}",
           r"\bhay\b .{2,40}\b(nao|hon|tot hon)\b", r"nen (chon|hoc|lam|mua|o|di|mo) .{2,40} hay .{2,40}",
           r"\bhay la\b", r"so sanh"]
KHI_NAO = [r"bao gio", r"khi nao", r"luc nao", r"nam nao", r"thang nao", r"tuoi nao", r"bao lau nua"]
CO_NEN = [r"co nen", r"\bnen\b .{0,30}\bkhong\b", r"co (duoc|on|hop) khong"]

QUAN_HE = [("vo_chong", [r"chong (toi|em|minh|tui)", r"vo (toi|em|minh|tui)", r"\bchong sinh", r"\bvo sinh",
                         r"ong xa", r"ba xa", r"(chong|vo) (sn|sinh)", r"\bchong\b \d{4}", r"\bvo\b \d{4}",
                         r"hai vo chong", r"vo chong (toi|em|minh)"]),
           ("con", [r"con (trai|gai) (toi|em|minh)", r"\bcon (toi|em|minh)\b", r"\bbe (nha|nha toi)", r"chau (trai|gai)",
                    r"\bcon (trai|gai)? ?(sinh|sn)\b"]),
           ("nguoi_yeu", [r"nguoi yeu", r"ban trai", r"ban gai", r"nguoi ay", r"crush"]),
           ("cha_me", [r"\b(bo|me|ba|cha|ma) (toi|em|minh)\b", r"bo me (toi|em|minh)", r"cha me (toi|em|minh)"]),
           ("sep", [r"\bsep\b", r"cap tren", r"giam doc (toi|em|minh)"]),
           ("doi_tac", [r"doi tac", r"\bhop tac voi\b", r"gop von voi", r"lam an voi"]),
           ("ban_be", [r"ban than", r"ban (toi|em|minh)\b", r"dong nghiep"])]
_NAM = re.compile(r"(?<!\d)(19[3-9]\d|20[0-4]\d)(?!\d)")


def kieu(t: str) -> str:
    """"kien_thuc" · "so_sanh" · "khi_nao" · "co_nen" · "mo_ta"."""
    if _co(t, KIEN_THUC) and not _co(t, CA_NHAN):
        return "kien_thuc"
    if _co(t, SO_SANH):
        return "so_sanh"
    if _co(t, KHI_NAO):
        return "khi_nao"
    if _co(t, CO_NEN):
        return "co_nen"
    return "mo_ta"


def _them_thang(d: dt.date, n: int) -> tuple[int, int]:
    m = d.month - 1 + n
    return d.year + m // 12, m % 12 + 1


def thoi_gian(t: str, hom_nay: dt.date) -> list[dict]:
    """Các mốc được HỎI (không phải năm sinh): [{"nam"}, {"nam", "thang"}] theo thứ tự xuất hiện, không lặp."""
    ra: list[dict] = []
    nam_tuong_doi = None
    tuong_doi = None
    if re.search(r"nam (sau|toi)(?! (dinh|sinh|la|muon|tinh|du|\d|duoc|nay))|sang nam|nam toi\b$", t):
        nam_tuong_doi, tuong_doi = hom_nay.year + 1, "nam_sau"
    elif re.search(r"nam nay\b", t):
        nam_tuong_doi, tuong_doi = hom_nay.year, "nam_nay"
    # năm tuyệt đối — bỏ năm sinh: đứng sau "sinh / sn / tuổi" (kể cả "sinh 1960 và 1963"), trong ngày dạng d/m/yyyy
    nam_tuyet = [int(m.group(1)) for m in _NAM.finditer(t)
                 if not re.search(r"(sinh|sn|sinh nam|tuoi|doi|nam sinh|ns)\s*(nam\s*)?(\d{4}\s*(va|,|hoac|voi)\s*)?$",
                                  t[:m.start()])
                 and not re.search(r"\d{1,2}[/-]\d{1,2}[/-]$", t[:m.start()])]
    thang = [int(x) for x in re.findall(r"thang (1[0-2]|[1-9])(?![\d/-])", t)]
    k = re.search(r"(ba|3|hai|2) thang (toi|sap toi|nua)\b", t)
    if k:                                  # "ba tháng tới" → ba tháng kế tiếp
        for i in range(1, (3 if k.group(1) in ("ba", "3") else 2) + 1):
            y, mm = _them_thang(hom_nay, i)
            ra.append({"nam": y, "thang": mm})
    elif re.search(r"thang (toi|sau)\b", t) and not re.search(r"(ba|hai|\d+) thang (nay|qua)", t):
        y, mm = _them_thang(hom_nay, 1)
        ra.append({"nam": y, "thang": mm})
    elif re.search(r"(?<!ba )(?<!hai )(?<!\d )thang nay\b", t):
        ra.append({"nam": hom_nay.year, "thang": hom_nay.month})
    nam_cho_thang = nam_tuyet[0] if nam_tuyet else nam_tuong_doi
    for th in thang:
        y = nam_cho_thang or (hom_nay.year if th >= hom_nay.month else hom_nay.year + 1)
        ra.append({"nam": y, "thang": th})
    if not thang:
        for y in nam_tuyet:
            ra.append({"nam": y})
        if nam_tuong_doi and not ra:
            # Mốc tương đối theo năm DƯƠNG lịch — mảng có ranh giới năm khác (Lập xuân, Tết) đổi lại bằng cờ này
            ra.append({"nam": nam_tuong_doi, "tuong_doi": tuong_doi})
    out: list[dict] = []
    for x in ra:
        if x not in out:
            out.append(x)
    return out


def nguoi_thu_hai(t: str) -> dict | None:
    """Người thứ hai trong câu: {"quan_he", "nam_sinh"?} — năm sinh lấy năm gắn với người đó ("vk sn 1993", "chồng
    tôi sinh năm 1988"); không có thì None."""
    for qh, mau in QUAN_HE:
        for m_ in mau:
            k = re.search(r"(?<!\w)" + m_ + r"(?!\w)", t)
            if not k:
                continue
            sau = t[k.start():k.start() + 40]
            ns = re.search(r"(?:sinh|sn)?\s*(?:nam\s*)?(19[3-9]\d|20[0-4]\d)", sau)
            ra = {"quan_he": qh, **({"nam_sinh": int(ns.group(1))} if ns else {})}
            cac = [int(x) for x in re.findall(r"(?:sinh|sn)\s*(?:nam\s*)?(19[3-9]\d|20[0-4]\d)", t)]
            if len(cac) >= 2:
                ra["cac_nam_sinh"] = cac
            return ra
    return None


def tu_dien_khop(cau_hoi: str, mo_dun: str, toi_da: int = 2) -> list[dict]:
    """Thuật ngữ của mảng có trong câu (từ điển KB `tu_dien.json`) — dùng trả lời câu kiến thức khi kho giải thích của
    mảng không có mục."""
    from app.kb import tu_dien  # noqa: PLC0415
    return tu_dien.nhan_dien(cau_hoi or "", mo_dun)[:toi_da]


def muc_tu_dien(ma: list[str]) -> list[dict]:
    """Mục bằng chứng `giai_thich` (cùng khuôn kho giải thích: tieu_de + noi_dung) từ mã thuật ngữ đã khớp."""
    from app.kb import tu_dien  # noqa: PLC0415
    theo_ma = {m["ma"]: m for m in tu_dien.tat_ca()}
    ra = []
    for m in (theo_ma[x] for x in ma if x in theo_ma):
        nd = (m.get("de_hieu") or "").strip()
        if m.get("vi_du"):
            nd += f" Ví dụ: {m['vi_du'].strip()}"
        if nd:
            ra.append({"loai": "giai_thich", "ma": f"tu_dien.{m['ma']}", "tieu_de": f"{m['ten']} là gì?", "noi_dung": nd})
    return ra


def la_kien_thuc_tu_dien(t: str, cau_hoi: str, mo_dun: str) -> list[dict]:
    """Câu kiến thức thuần (không "của tôi") có thuật ngữ trong từ điển → các thuật ngữ đó; không thì []."""
    return tu_dien_khop(cau_hoi, mo_dun) if kieu(t) == "kien_thuc" else []
