# -*- coding: utf-8 -*-
"""EN-4 (mục 3) — MỘT bộ kiểm cho mọi đầu ra AI (hỏi đáp, luận giải từng chương). AI chỉ được DIỄN ĐẠT lại nguồn
(gói bằng chứng / đoạn chương): có vi phạm thì nơi gọi bỏ bản AI, dùng bản gốc (template).

Kiểm: liên kết ra ngoài · số (chữ số và số viết bằng chữ từ "mười" trở lên) không có trong nguồn · thuật ngữ lạ (từ điển 5
mảng — tên sao, cung, quẻ, thập thần…) · cụm cấm (giọng phán + `cum_cam` KB) · từ y tế · vật phẩm / giải hạn không có trong nguồn · câu "ý mới"
(câu ≥ 10 từ mà < 25% từ nội dung có trong nguồn) · độ dài > 1,5 lần nguồn."""
from __future__ import annotations

import re
import unicodedata
from functools import lru_cache

_LIEN_KET = re.compile(r"(https?://|www\.)\S+|\b[\w-]+\.(com|vn|net|org|io|xyz|info|me)\b", re.IGNORECASE)
CAM = ["chắc chắn sẽ", "bạn sẽ", "định mệnh", "số phận đã", "không thể tránh", "bẩm sinh", "vốn dĩ", "100%", "tiền định"]
# SK-1 (2026-11-04): tên hệ cơ quan + việc đi khám ("tim mạch", "đo huyết áp", "khám phổi") nay có trong chính nguồn
# (chương sức khoẻ, hộp "Năm nên chú ý sức khoẻ hơn") nên AI DIỄN ĐẠT lại được; AI tự thêm khi nguồn không có vẫn là thêm
# dữ kiện → vi phạm. Tên bệnh, lời đoán ốm / sống chết lấy từ KB `suc_khoe_kb.cum_cam` (một nguồn với mọi bộ kiểm).
Y_TE = ["tim mạch", "huyết áp", "phẫu thuật", "xạ trị", "hoá trị", "hóa trị", "nhập viện", "uống thuốc", "kê đơn"]


def _y_te() -> list[str]:
    from app.kb import suc_khoe_kb  # noqa: PLC0415
    # SK-2: tên bệnh KB cho phép nêu cũng là "từ y tế" — AI chỉ được giữ khi CHÍNH nguồn có (không tự thêm).
    return list(dict.fromkeys([*Y_TE, *(c.lower() for c in suc_khoe_kb.cum_cam()), *suc_khoe_kb.ten_benh()]))
# Ranh giới cứng: không bán / gợi vật phẩm "hoá giải", lễ giải hạn — chỉ chặn khi nguồn không có
VAT_PHAM = ["vòng tay", "thạch anh", "tỳ hưu", "tì hưu", "linh vật", "vật phẩm", "đá phong thuỷ", "đá phong thủy",
            "bùa", "giải hạn", "cúng sao", "dâng sao", "trấn yểm", "hoá giải bằng", "hóa giải bằng", "cóc ngậm tiền",
            "thiềm thừ", "gương bát quái", "chuông gió"]
_SO_CHU = {"không": 0, "một": 1, "mốt": 1, "hai": 2, "ba": 3, "bốn": 4, "tư": 4, "năm": 5, "lăm": 5, "sáu": 6,
           "bảy": 7, "tám": 8, "chín": 9}
# "mười năm" = 10 năm (không phải 15 — 15 là "mười lăm"); hàng đơn vị không nhận "năm"
_SO_CHU_RX = re.compile(r"\b(?:(một|hai|ba|bốn|năm|sáu|bảy|tám|chín)\s+)?(mười|mươi)(?:\s+(mốt|một|hai|ba|bốn|tư|lăm|"
                        r"sáu|bảy|tám|chín)(?!\s+(mươi|trăm)))?\b", re.IGNORECASE)
_BO_TU = {"bạn", "của", "và", "là", "có", "không", "này", "đó", "cho", "với", "những", "các", "một", "được", "trong",
          "khi", "thì", "mà", "nên", "để", "cũng", "đã", "đang", "sẽ", "rất", "hơn", "như", "nhưng", "hay", "vì", "ra",
          "vào", "lại", "còn", "người", "việc", "theo", "từ", "đến", "về", "ở", "nào", "gì", "hãy", "điều", "mình"}


def _bo_dau(s: str) -> str:
    s = s.replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


_BO_TU_KD = {_bo_dau(w) for w in _BO_TU}      # so khớp trên chữ đã bỏ dấu


@lru_cache(maxsize=1)
def _thuat_ngu() -> tuple[str, ...]:
    """Thuật ngữ ≥ 2 âm tiết của từ điển 5 mảng (từ đơn như "Tuần", "Bình", "Cung", "Hướng" trùng chữ thường → bỏ)."""
    from app.kb import tu_dien  # noqa: PLC0415
    ten = {m["ten"] for m in tu_dien.tat_ca()} | {b for m in tu_dien.tat_ca() for b in m.get("bien_the", [])}
    return tuple(sorted((t for t in ten if len(t.split()) >= 2), key=len, reverse=True))


def _so_chu(s: str) -> set[int]:
    ra = set()
    for m in _SO_CHU_RX.finditer(s):
        chuc = _SO_CHU.get((m.group(1) or "").lower(), 1) if m.group(2).lower() == "mươi" else 1
        dv = _SO_CHU.get((m.group(3) or "").lower(), 0)
        ra.add(chuc * 10 + dv)
    return ra


def _tu(s: str) -> list[str]:
    return [w for w in re.findall(r"\w+", s.lower()) if len(w) >= 2 and w not in _BO_TU_KD and not w.isdigit()]


# ---- H5-en (HTT-2 mục 8, 2026-11-09): cùng MỘT hàm `kiem` cho bản tiếng Anh — danh mục tiếng Anh thay danh mục Việt khi
# ngôn ngữ lượt gọi là "en" (bộ kiểm chọn theo `ngon_ngu.hien_tai()`, nơi gọi không phải truyền gì thêm).
CAM_EN = ["you will", "destined", "fate has", "cannot be avoided", "100%", "guaranteed", "predestined", "inevitable"]
Y_TE_EN = ["cancer", "tumor", "tumour", "diabetes", "stroke", "heart attack", "depression", "surgery", "chemotherapy",
           "radiation therapy", "prescription", "medication", "hospitalised", "hospitalized", "terminal illness", "you will die",
           "miscarriage", "infertility", "dementia", "diagnosis", "diagnosed with"]
VAT_PHAM_EN = ["crystal", "amulet", "talisman", "lucky charm", "bracelet", "pi xiu", "pixiu", "feng shui item", "ritual to",
               "cleansing ritual", "remove the curse", "curse removal", "bagua mirror", "wind chime", "money frog"]
_SO_CHU_EN = {"ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16,
              "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
              "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90, "hundred": 100, "thousand": 1000}
_BO_TU_EN = {"the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for", "with", "you", "your", "it", "is", "are", "be",
             "this", "that", "as", "if", "not", "no", "but", "so", "than", "then", "there", "here", "what", "when", "how", "can",
             "will", "do", "does", "have", "has", "from", "by", "into", "about", "one", "more", "most", "very", "just", "also",
             "may", "might", "would", "could", "should", "them", "they", "their", "we", "our", "us", "he", "she", "his", "her"}


def _la_en() -> bool:
    from app import ngon_ngu  # noqa: PLC0415
    return ngon_ngu.hien_tai() == "en"


@lru_cache(maxsize=1)
def _cum_cam_en() -> tuple[re.Pattern, ...]:
    """Regex cụm cấm tiếng Anh của KB `thuat_ngu_en.json` (`cum_cam_en`: giọng phán, "accurate", giọng AI sáo, bệnh / chết,
    lô đề, lời khuyên mua bán, vật phẩm) — một nguồn với máy chuyển ngữ (QT-0)."""
    from app.kb import nap  # noqa: PLC0415
    try:
        ds = nap.doc("thuat_ngu_en.json").get("cum_cam_en") or []
    except FileNotFoundError:
        ds = []
    ra = []
    for x in ds:
        try:
            ra.append(re.compile(x, re.IGNORECASE))
        except re.error:
            continue
    return tuple(ra)


def _so_chu_en(s: str) -> set[int]:
    ra: set[int] = set()
    for w in re.findall(r"[a-z]+", s.lower()):
        if w in _SO_CHU_EN:
            ra.add(_SO_CHU_EN[w])
    return ra


def _tu_en(s: str) -> list[str]:
    return [w for w in re.findall(r"[a-z]+", s.lower()) if len(w) >= 3 and w not in _BO_TU_EN]


def _kiem_en(van: str, nguon: str, so_duoc: set[int] | None, cum_them: list[str] | None, kiem_y_moi: bool, ti_le_dai: float) -> list[str]:
    from app.narrative.hoi_van import lien_ket_la  # noqa: PLC0415
    loi: list[str] = lien_ket_la(van, nguon)
    goc = nguon.lower()
    loi += [f"liên kết lạ: {m.group(0)[:40]}" for m in _LIEN_KET.finditer(van)
            if m.group(0).lower() not in goc and not any(m.group(0)[:40] in x for x in loi)]
    so_nguon = {int(x) for x in re.findall(r"\d+", nguon)} | _so_chu_en(nguon) | set(so_duoc or ())
    loi += [f"số lạ: {n}" for n in re.findall(r"\d+", van) if int(n) not in so_nguon]
    if kiem_y_moi:
        loi += [f"số lạ (viết bằng chữ): {n}" for n in sorted(_so_chu_en(van) - so_nguon)]
    thap = van.lower()
    for c in CAM_EN + list(cum_them or []):
        if re.search(r"(?<!\w)" + re.escape(c.lower()) + r"(?!\w)", thap) and not re.search(r"(?<!\w)" + re.escape(c.lower()) + r"(?!\w)", goc):
            loi.append(f"cụm cấm: {c}")
    for rx in _cum_cam_en():
        m = rx.search(van)
        if m and not rx.search(nguon):
            loi.append(f"cụm cấm: {m.group(0)}")
    loi += [f"từ y tế: {c}" for c in Y_TE_EN if re.search(r"(?<!\w)" + re.escape(c), thap) and not re.search(r"(?<!\w)" + re.escape(c), goc)]
    loi += [f"vật phẩm: {c}" for c in VAT_PHAM_EN if re.search(r"(?<!\w)" + re.escape(c) + r"(?!\w)", thap)
            and not re.search(r"(?<!\w)" + re.escape(c) + r"(?!\w)", goc)]
    if kiem_y_moi:
        tu_nguon = set(_tu_en(nguon))
        for cau in re.split(r"(?<=[.!?…])\s+", van):
            w = _tu_en(cau)
            if len(cau.split()) >= 10 and w and sum(x in tu_nguon for x in w) / len(w) < 0.25:
                loi.append(f"câu ý mới: {cau[:60]}")
    if nguon and len(van) > ti_le_dai * len(nguon) + 80:
        loi.append(f"dài hơn {ti_le_dai} lần nguồn")
    return list(dict.fromkeys(loi))


def kiem(van: str, nguon: str, so_duoc: set[int] | None = None, cum_them: list[str] | None = None,
         kiem_y_moi: bool = True, ti_le_dai: float = 1.5, kiem_thuat_ngu: bool = True) -> list[str]:
    """Danh sách vi phạm của bản AI `van` so với `nguon` (văn bản). `so_duoc` = số được phép thêm. Nguồn là JSON mã khoá
    (gói bằng chứng chưa dựng thành câu) thì tắt `kiem_thuat_ngu` / `kiem_y_moi` — tên hiển thị không có trong JSON."""
    if _la_en():
        return _kiem_en(van, nguon, so_duoc, cum_them, kiem_y_moi, ti_le_dai)
    from app.narrative.hoi_van import lien_ket_la  # noqa: PLC0415 — bộ lọc liên kết SEC-2 (kể cả "chấm com")
    loi: list[str] = lien_ket_la(van, nguon)
    goc = nguon.lower()
    loi += [f"liên kết lạ: {m.group(0)[:40]}" for m in _LIEN_KET.finditer(van)
            if m.group(0).lower() not in goc and not any(m.group(0)[:40] in x for x in loi)]
    so_nguon = {int(x) for x in re.findall(r"\d+", nguon)} | _so_chu(nguon) | set(so_duoc or ())
    loi += [f"số lạ: {n}" for n in re.findall(r"\d+", van) if int(n) not in so_nguon]
    if kiem_y_moi:                               # số viết bằng chữ: chỉ so được với nguồn là văn bản
        loi += [f"số lạ (viết bằng chữ): {n}" for n in sorted(_so_chu(van) - so_nguon)]
    con_lai = van.lower() if kiem_thuat_ngu else ""
    for t in _thuat_ngu():                       # dài trước: "Thiên Phủ" không bị đếm thành "Thiên"
        rx = re.compile(r"(?<!\w)" + re.escape(t.lower()) + r"(?!\w)")
        if rx.search(con_lai):
            if not rx.search(goc):
                loi.append(f"thuật ngữ lạ: {t}")
            con_lai = rx.sub(" ", con_lai)
    thap = van.lower()
    for c in CAM + list(cum_them or []):
        if c.lower() in thap and c.lower() not in goc:
            loi.append(f"cụm cấm: {c}")
    loi += [f"từ y tế: {c}" for c in _y_te() if re.search(r"(?<!\w)" + re.escape(c) + r"(?!\w)", thap)
            and not re.search(r"(?<!\w)" + re.escape(c) + r"(?!\w)", goc)]
    from app.luangiai import suc_khoe_nam as _skn  # noqa: PLC0415
    loi += [f"từ y tế: gán bệnh — {c}" for c in _skn.doan_benh(thap)]      # SK-2: "dễ bị / sẽ mắc <bệnh>" luôn cấm
    loi += [f"vật phẩm: {c}" for c in VAT_PHAM if re.search(r"(?<!\w)" + re.escape(c) + r"(?!\w)", thap)
            and not re.search(r"(?<!\w)" + re.escape(c) + r"(?!\w)", goc)]
    if kiem_y_moi:
        tu_nguon = set(_tu(_bo_dau(nguon)))
        for cau in re.split(r"(?<=[.!?…])\s+", van):
            w = _tu(_bo_dau(cau))
            if len(cau.split()) >= 10 and w and sum(x in tu_nguon for x in w) / len(w) < 0.25:
                loi.append(f"câu ý mới: {cau[:60]}")
    if nguon and len(van) > ti_le_dai * len(nguon) + 80:
        loi.append(f"dài hơn {ti_le_dai} lần nguồn")
    return loi
