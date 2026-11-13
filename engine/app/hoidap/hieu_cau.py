# -*- coding: utf-8 -*-
"""EN-3 — "Hiểu câu hỏi" dùng chung 5 mảng (RULES, tất định, không LLM). Đầu vào là câu ĐÃ chuẩn hoá bằng
`chuan_hoa_cau` (bỏ dấu, mở viết tắt). Ra: kiểu câu, các mốc thời gian được hỏi, người thứ hai. Mỗi mảng dùng các ô này
để không âm thầm rơi về "bản thân" khi câu hỏi là kiến thức, so sánh hai thời điểm hay về người khác."""
from __future__ import annotations

import datetime as dt
import re

from app.kb.loi import L
from app.luangiai.hoi import _co

KIEN_THUC = [r"(la|co nghia la|nghia la|y nghia la) gi", r"y nghia (la )?gi", r"khac (nhau|gi nhau|gi|cho nao|o dau)",
             r"giong (nhau|va khac)", r"(duoc )?tinh (sao|the nao|nhu the nao|ra sao|bang cach nao|tu dau)",
             r"cach tinh", r"duoc tinh (tu|nhu|theo|bang)", r"doc (the nao|ra sao|nhu the nao)", r"la sao\b",
             r"co (that|that su|thuc su)? ?(boi|du doan|doan) duoc", r"co (that |that su |thuc su )?(khoa hoc|co so|chinh xac) khong",
             r"khac voi .{2,40} (the nao|ra sao|cho nao|o diem nao)", r"khac .{2,40} o (diem|cho) nao"]
# Câu có chủ thể là người hỏi → không phải câu kiến thức thuần ("Nhật chủ CỦA TÔI là gì").
CA_NHAN = [r"cua (toi|em|minh|tui|tao|anh|chi|chau)", r"(voi|toi|den|ve|cho) (toi|minh|tui)\b", r"(toi|em|minh|tui) (co|bi|la|thuoc|sinh|duoc|nen|muon|dang)",
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


_SO = {"mot": 1, "hai": 2, "ba": 3, "bon": 4, "nam": 5, "sau": 6}
_VAI = r"(vo|chong|con|bo|me|ba|anh|chi|em|ong|ny|nguoi yeu|toi|minh|tui)"


def _la_nam_sinh(t: str, a: int, b: int) -> bool:
    truoc, sau = t[:a], t[b:]
    return bool(re.search(r"(sinh|sn|tuoi|doi|nam sinh|ns)\s*(nam\s*)?(\d{4}\s*(va|,|hoac|voi)\s*)?$", truoc)
                or re.search(r"\d{1,2}[/-]\d{1,2}[/-]$", truoc)
                or re.search(r"(sinh|sn)\s*(vao\s*)?(thang\s*)?\d{1,2}[/-]$", truoc)              # "sinh tháng 5/2015"
                or re.search(r"^\s*(sinh|sn)\b", sau)                               # "năm 1975 sinh"
                or (re.search(r"(?<!\w)" + _VAI + r"( (toi|minh|em|tui))?\s*$", truoc)     # "vợ tôi 1993", "tôi 1990"
                    and not re.search(r"(sinh|lay|cuoi|don|gap|de|nhan|co them) " + _VAI + r"\s*$", truoc)))  # "sinh con 2027"


def thoi_gian(t: str, hom_nay: dt.date) -> list[dict]:
    """Các mốc được HỎI (không phải năm sinh) theo thứ tự xuất hiện, không lặp: {"nam"} · {"nam", "thang"} · mốc tương
    đối mang cờ `tuong_doi` ("nam_nay" / "nam_sau") để mảng có ranh giới năm khác (Lập xuân, Tết) tự đổi. Tháng âm
    ("tháng Giêng", "tháng 2 âm") và mốc đã qua ("tháng 10 vừa rồi", "năm ngoái") không tính."""
    y0 = hom_nay.year
    nam_ev: list[tuple[int, dict]] = []                   # (vị trí, mốc năm)
    for m in _NAM.finditer(t):
        if not _la_nam_sinh(t, m.start(), m.end()):
            nam_ev.append((m.start(), {"nam": int(m.group(1))}))
    for m in re.finditer(r"(ba|hai|bon|nam|\d) nam (toi|sap toi)\b", t):          # "ba năm tới" → năm nay … +N-1
        n = _SO.get(m.group(1)) or int(m.group(1))
        nam_ev += [(m.start() + i, {"nam": y0 + i, "lech": i}) for i in range(min(n, 5))]
    for m in re.finditer(r"(mot|hai|ba|bon|nam|\d) nam nua\b", t):
        n = _SO.get(m.group(1)) or int(m.group(1))
        nam_ev.append((m.start(), {"nam": y0 + n, "lech": n}))
    if (m := re.search(r"nam sau nua", t)):
        nam_ev.append((m.start(), {"nam": y0 + 2, "lech": 2}))
    else:
        for m in re.finditer(r"nam sau|sang nam|nam toi(?! (dinh|sinh|la|muon|tinh|du|duoc|nay|co|bi|thi|da|\d))", t):
            if not re.match(r"(ba|hai|bon|nam|\d) $", t[max(0, m.start() - 4):m.start()]):
                nam_ev.append((m.start(), {"nam": y0 + 1, "tuong_doi": "nam_sau"}))
    for m in re.finditer(r"nam nay\b", t):
        nam_ev.append((m.start(), {"nam": y0, "tuong_doi": "nam_nay"}))
    nam_ev.sort(key=lambda x: x[0])

    thang_ev: list[tuple[int, dict]] = []
    for m in re.finditer(r"thang (1[0-2]|[1-9])(?![\d/-])", t):
        if re.match(r"\s*(am|vua roi|vua qua|truoc|roi)\b", t[m.end():]):          # tháng âm / đã qua
            continue
        th = int(m.group(1))
        sau = [e for p, e in nam_ev if 0 < p - m.end() <= 14]                       # "tháng 3 năm 2027 / năm sau"
        y = sau[0]["nam"] if sau else (y0 if th >= hom_nay.month else y0 + 1)
        if not sau and len([e for _, e in nam_ev if "tuong_doi" not in e]) == 1:
            y = next(e for _, e in nam_ev if "tuong_doi" not in e)["nam"]
        thang_ev.append((m.start(), {"nam": y, "thang": th}))
    for m in re.finditer(r"thang (1[0-2]|0?[1-9])[/-](20\d{2})(?!\d)", t):        # EN-3d: "tháng 1/2027"
        y, th = int(m.group(2)), int(m.group(1))
        if _la_nam_sinh(t, m.start(), m.end()) or (y, th) < (hom_nay.year, hom_nay.month):
            continue                                                              # "sinh tháng 5/2015", mốc đã qua
        thang_ev.append((m.start(), {"nam": y, "thang": th}))
    k = re.search(r"(ba|3|hai|2|may|vai|sau|6) thang (toi|sap toi|nua)\b", t)
    if k:
        n = {"ba": 3, "3": 3, "hai": 2, "2": 2}.get(k.group(1), 3)                  # "mấy / 6 tháng tới" → 3 tháng đầu
        for i in range(1, n + 1):
            yy, mm = _them_thang(hom_nay, i)
            thang_ev.append((k.start() + i, {"nam": yy, "thang": mm}))
    else:
        if (m := re.search(r"(?<!ba )(?<!hai )(?<!\d )thang nay\b", t)):
            thang_ev.append((m.start(), {"nam": y0, "thang": hom_nay.month}))
        if (m := re.search(r"thang (toi|sau)\b", t)) and not re.search(r"(ba|hai|\d+) thang (nay|qua)", t):
            yy, mm = _them_thang(hom_nay, 1)
            thang_ev.append((m.start(), {"nam": yy, "thang": mm}))
    if thang_ev:
        # năm đã dùng để ghép tháng không thành mốc riêng
        dung = {e["nam"] for _, e in thang_ev}
        nam_ev = [(p, e) for p, e in nam_ev if e["nam"] not in dung]
    ev = sorted(thang_ev + nam_ev, key=lambda x: x[0])
    out: list[dict] = []
    for _, x in ev:
        if x not in out and not any(o["nam"] == x["nam"] and o.get("thang") == x.get("thang") for o in out):
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
            sau = t[k.end():k.end() + 30]
            ns = re.match(r"\s*(?:(?:toi|minh|em)\s+)?(?:(?:sinh|sn|tuoi)\s*(?:nam\s*)?)?(19[3-9]\d|20[0-4]\d)", sau) \
                or re.search(r"(?:sinh|sn)\s*(?:nam\s*)?(19[3-9]\d|20[0-4]\d)", sau)
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
            nd += L("hoi.td.vi_du", " Ví dụ: {vd}", vd=m["vi_du"].strip())
        if nd:
            ra.append({"loai": "giai_thich", "ma": f"tu_dien.{m['ma']}", "tieu_de": L("hoi.td.la_gi", "{ten} là gì?", ten=m["ten"]),
                       "noi_dung": nd})
    return ra


def la_kien_thuc_tu_dien(t: str, cau_hoi: str, mo_dun: str) -> list[dict]:
    """Câu kiến thức thuần (không "của tôi") có thuật ngữ trong từ điển → các thuật ngữ đó; không thì []."""
    return tu_dien_khop(cau_hoi, mo_dun) if kieu(t) == "kien_thuc" else []



# EN-3 (mục 2): câu rơi về mặc định (không khớp tín hiệu nào) → mời chọn cụ thể; lời đáp mặc định vẫn hiện bên dưới.
_HOI_LAI = {
    "thanso": ["Con số của tôi nói gì về công việc?", "Con số của tôi nói gì về chuyện tiền bạc?",
               "Con số của tôi nói gì về tình yêu?", "Năm nay là năm cá nhân mấy của tôi?"],
    "tuvi": ["Công việc của tôi theo lá số thế nào?", "Tiền bạc của tôi theo lá số thế nào?",
             "Tình duyên của tôi theo lá số thế nào?", "Năm nay lá số của tôi có gì nổi bật?"],
    "battu": ["Bát tự của tôi hợp nghề gì?", "Bát tự của tôi nói gì về tiền bạc?",
              "Bát tự của tôi nói gì về hôn nhân?", "Đại vận hiện tại của tôi thế nào?"],
    "phongthuy": ["Hướng nào hợp với tôi để kê bàn làm việc?", "Bếp nên quay hướng nào cho hợp tôi?",
                  "Đầu giường nên quay hướng nào?", "Năm nay trong nhà nên giữ yên phía nào?"],
}


def hoi_lai(mo_dun: str) -> dict | None:
    ds = _HOI_LAI.get(mo_dun)
    if not ds:
        return None
    if mo_dun == "battu":
        ds = [L("hoi.hl.battu.nghe", ds[0]), L("hoi.hl.battu.tien", ds[1]), L("hoi.hl.battu.hon_nhan", ds[2]),
              L("hoi.hl.battu.dai_van", ds[3])]
    elif mo_dun == "tuvi":
        ds = [L("hoi.hl.tuvi.cong_viec", ds[0]), L("hoi.hl.tuvi.tien", ds[1]), L("hoi.hl.tuvi.tinh_duyen", ds[2]),
              L("hoi.hl.tuvi.nam_nay", ds[3])]
    elif mo_dun == "phongthuy":
        ds = [L("hoi.hl.phongthuy.ban", ds[0]), L("hoi.hl.phongthuy.bep", ds[1]), L("hoi.hl.phongthuy.giuong", ds[2]),
              L("hoi.hl.phongthuy.nam_nay", ds[3])]
    return {"cau": L("hoi.hl.cau", "Bạn muốn hỏi cụ thể về chuyện nào? Chọn một câu để có lời đáp đúng hơn:"), "chon": ds}


# ---- EN-5.4: khung thời gian của một quyết định ("có nên đổi việc trong 6 tháng tới") → số tháng cần xem (≤ 12)
_SO_THANG = {**_SO, "bay": 7, "tam": 8, "chin": 9, "muoi": 10, "muoi mot": 11, "muoi hai": 12, "may": 6, "vai": 6}


def khung_thang(t: str, hom_nay: dt.date, raw: str | None = None) -> int | None:
    """Số tháng (≤ 12) của khung "N tháng tới / mấy tháng tới / nửa năm tới / từ giờ tới cuối năm"; không có → None.
    Không đọc "ngày 5 tháng sau", "mùng 8 tháng tới" (số ngày), "sau tháng tới" (sau = sau khi) thành khung."""
    from app.hoidap import chung  # noqa: PLC0415
    if chung.khop_dau(raw, t, [r"sáu tháng (tới|sắp tới|nữa)"], []):
        return 6
    m = re.search(r"(?<!ngay )(?<!mung )(?<!mong )(?<!hom )(?<!\w)(\d{1,2}|muoi mot|muoi hai|mot|hai|ba|bon|nam|bay|tam|"
                  r"chin|muoi|may|vai) thang (toi|sap toi|nua)\b", t)
    if m:
        n = int(m.group(1)) if m.group(1).isdigit() else _SO_THANG[m.group(1)]
        return max(1, min(n, 12))
    if re.search(r"nua nam (toi|sap toi|nua|dau nam sau)", t):
        return 6
    if re.search(r"(tu (gio|nay|bay gio) (toi|den)|trong|het) (cuoi nam|nam nay)", t) and not re.search(r"\d{4}", t):
        return max(1, 12 - hom_nay.month + 1)
    return None
