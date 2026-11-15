# -*- coding: utf-8 -*-
"""TR-6 — nạp nguyên văn Papus, «The Tarot of the Bohemians» (bản dịch Anh A. P. Morton, London 1892; in lại 1896) vào kho nguồn.

Sách: Papus (Gérard Encausse, 1865–1916), *Le Tarot des Bohémiens* (Paris 1889); bản Anh của A. P. Morton do Chapman & Hall in
1892, George Redway in lại 1896 — xuất bản trên 130 năm, tác giả mất 1916 → phạm vi công cộng.

Nguồn tải: bản quét archive.org (văn bản OCR `_djvu.txt`):
  · tarotofbohemians00papu      (Redway 1896, Brigham Young University)   ← bản CHÍNH
  · tarotofbohemians00papu_0    (Redway 1896, Library of Congress)
  · cu31924028930571            (Chapman & Hall 1892, Cornell)
OCR mỗi bản sai một kiểu (bảng hai cột lệch nhãn, chữ nghiêng đọc sai) → script chỉ GIỮ chữ mà ÍT NHẤT HAI bản quét độc lập
cho ra giống hệt nhau sau khi chuẩn hoá khoảng trắng / nối chữ ngắt dòng. Không gõ tay câu nào.

Dùng:  python scripts/nap_tarot_papus.py <byu_1896.txt> <loc_1896.txt> <cornell_1892.txt> [<wellcome_1910.txt>]
(bản thứ tư tuỳ chọn: b24884510 — Rider 1910, lần in thứ hai có sửa vài chữ; chỉ góp phiếu khi trùng chữ với một bản 1892 / 1896)

Lấy gì:
  · 56 ẩn phụ — nghĩa bói (chương XX «The Divining Tarot», Second Lesson): trường `boi`.
  · 22 ẩn chính — nghĩa bói (Third Lesson): `boi`; chữ Hebrew theo Papus (`chu_cai` — lối Pháp của Lévi: Aleph = lá 1,
    Shin = Người Khờ, Tau = Thế Giới — KHÁC lối Golden Dawn KB đang dùng); các câu mô tả hình + ý của chương riêng từng lá: `doan`.
Thứ tự Papus là thứ tự Marseille: 8 = Justice, 11 = Strength; lá Khờ không số đứng thứ 21, The Universe là lá thứ 22.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"

# (số Papus, id lá KB, tên Papus, tên chữ Hebrew Papus ghi)
AN_CHINH = [
    (1, "dai_1", "The Juggler", "Aleph"), (2, "dai_2", "The High Priestess", "Beth"), (3, "dai_3", "The Empress", "Gimel"),
    (4, "dai_4", "The Emperor", "Daleth"), (5, "dai_5", "The Pope", "He"), (6, "dai_6", "The Lovers", "Vau"),
    (7, "dai_7", "The Chariot", "Zain"), (8, "dai_11", "Justice", "Heth"), (9, "dai_9", "The Hermit", "Teth"),
    (10, "dai_10", "The Wheel of Fortune", "Yod"), (11, "dai_8", "Strength", "Kaph"), (12, "dai_12", "The Hanged Man", "Lamed"),
    (13, "dai_13", "Death", "Mem"), (14, "dai_14", "Temperance", "Nun"), (15, "dai_15", "The Devil", "Samech"),
    (16, "dai_16", "The Lightning-struck Tower", "Ayin"), (17, "dai_17", "The Stars", "Phe"), (18, "dai_18", "The Moon", "Tzaddi"),
    (19, "dai_19", "The Sun", "Qoph"), (20, "dai_20", "The Judgment", "Resh"), (21, "dai_0", "The Foolish Man", "Shin"),
    (22, "dai_21", "The Universe", "Tau"),
]
# Mốc đầu của nghĩa bói từng ẩn chính (Third Lesson) — chỉ để ĐỊNH VỊ; chữ lấy từ bản quét.
MOC_AN_CHINH = ["Male Inquirer", "Female Inquirer", "Action", "Will", "Inspiration", "Love", "Triumph", "Justice", "Prudence",
                "Fortune", "Strength", "Trials", "Death", "Temperance", "Immense", "Ruin", "Hope", "Hidden", "Material",
                "Change", "Inconsiderate", "Assured"]
CAP = ["vua", "hoang_hau", "hiep_si", "tieu_dong"] + [str(i) for i in range(1, 11)]
TEN_CAP = ["King", "Queen", "Knight", "Knave", "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"]
# Bốn bộ: (mã bộ KB, tên Papus, mốc đầu của 14 nghĩa theo thứ tự Vua → Mười) — mốc chỉ để định vị.
BO = [
    ("gay", "Sceptres", ["The King of Sceptres symbolizes", "A dark woman, a friend", "A dark young man, a friend", "A dark child, a friend",
                         "Commencement of an Enterprise", "Opposition to the commencement of the Enter", "Realization of the commencement of the Enter",
                         "Obstacles to the Enterprise", "Opposition to the obstacles. Victory", "Realization of the opposition. At last",
                         "Certain success to the Enterprise", "Opposition to its success", "Realization of success", "Uncertainty in the management of the Enter"]),
    ("coc", "Cups", ["A fair man, a friend", "A fair woman, a friend", "A young fair man, a friend", "A fair child. A messenger. Birth",
                     "Commencement of a love affair", "Opposition to this commencement. Unimport", "Realization of this commencement. The love",
                     "Serious obstacles to the love", "Opposition to the obstacles. Victory", "The obstacles triumph", "Success assured to the lovers",
                     "Partial failure of love", "Motherhood", "Uncertainty in the management of the love"]),
    ("kiem", "Swords", ["A dark, bad man", "A dark wicked woman", "A young, dark man", "A child, an enemy",
                        "Commencement of enmity", "Opposition to this commencement. The enmity", "Realization of the enmity", "Opposition to the hatred",
                        "Opposition to this opposition. The enemy", "Equilibrium of the opposition", "Success assured to the enemy",
                        "Partial opposition to this success", "Certain duration of the hatred", "Uncertainty in the enmity"]),
    ("tien", "Pentacles", ["A fair man, inimical or indifferent", "A fair woman, indifferent, or inimical", "A young, fair man. A stranger",
                           "A fair child. A messenger. A letter", "Commencement of fortune", "Opposition to this commencement. Diffi",
                           "Realization of this commencement of fortune", "Opposition of fortune", "Opposition to this opposition. A success",
                           "Realization of the opposition. Ruin", "Success assured. A large fortune", "Partial success", "Equilibrium of Equilibrium",
                           "Uncertainty in the fortune"]),
]
# Câu ghi chú chung nằm xen giữa bảng (không thuộc lá nào) — cắt khỏi nghĩa của lá đứng trước.
XEN = ["The figures generally indicate", "The figures of the Pentacles are inverse", "Knowing the meaning of one series", "As a whole, we see"]
_NHAN = (r"(?:(?:King|Queen|Knight|Knave|Ace)(?: o[fp] (?:Sceptres|Cups|Swords|Pentacles))?|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)\.")
_DAU_TRANG = r"(?:\d{2,3} THE TAROT\.?|THE DIVINING TAROT\.? ?\d{0,3}|THE SYMBOLICAL TAROT\.? ?\d{0,3}|\b\d{3}\b)"


def chuan(s: str) -> str:
    """Chuẩn hoá để so hai bản quét: nối chữ ngắt dòng, gộp khoảng trắng, bỏ khoảng trắng trước dấu câu."""
    s = s.replace("¬", "-").replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", s)
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"(\w)- (\w)", r"\1\2", s)
    s = re.sub(r" ([,;:.?!)])", r"\1", s)
    s = re.sub(r"\bEe(?=[a-z]{2})", "Re", s)          # lỗi OCR có hệ thống của kiểu chữ này: R hoa đọc thành E ("Eealization", "Eesh")
    return s.strip()


def _mem(s: str, tron_tu: bool = False) -> str:
    """Biểu thức tìm mốc, chịu được khoảng trắng thừa / dấu phẩy–chấm đọc lệch và chữ ĐẦU đọc sai của OCR ("Eealization")."""
    tu = [w for w in re.split(r"[\s,.]+", s) if w]
    return r"(?<!\w)\w" + re.escape(tu[0][1:]) + "".join(r"[\s,.]*" + re.escape(w) for w in tu[1:]) + (r"(?!\w)" if tron_tu else "")


def _cat_theo_moc(vung: str, moc: list[str], tron_tu: bool = False) -> list[str | None]:
    """Cắt `vung` thành các khúc theo dãy mốc (tuần tự). Thiếu một mốc → khúc ấy và khúc trước không tin được (None)."""
    vt, tu = [], 0
    for m in moc:
        g = re.search(_mem(m, tron_tu), vung[tu:], flags=re.I)
        vt.append((tu + g.start(), tu + g.end()) if g else None)
        if g:
            tu += g.end()
    ra: list[str | None] = []
    for i, p in enumerate(vt):
        sau = vt[i + 1] if i + 1 < len(vt) else (len(vung), len(vung))
        if p is None or sau is None:
            ra.append(None)
            continue
        ra.append(vung[p[0]:sau[0]])
    return ra


def _sach_khuc(s: str) -> str:
    s = re.sub(_DAU_TRANG, " ", s)
    for x in XEN:
        g = re.search(_mem(x), s)
        if g:
            s = s[:g.start()]
    s = re.sub(rf"(?<![\w]){_NHAN}(?=\s|$|[!\"'])", " ", s)   # nhãn "Queen." "Three." "Ace of Cups." lệch cột
    s = re.sub(r"\b(?:SCEPTRES|CUPS|SWORDS|PENTACLES)\.?\s*$", " ", s.strip())
    return _bo_duoi(chuan(s))


def _bo_duoi(s: str) -> str:
    """Bỏ rác cuối khúc: mẩu không có từ thường nào (đầu trang viết hoa, nhãn đọc hỏng), dấu chấm đôi."""
    s = re.sub(r"\.{2,}", ".", s).strip(" '|")
    while True:
        g = re.search(r"(?<=[.,]) ?([^.]*\.?)$", s)
        if not g or re.search(r"[a-z]{3}", g.group(1)) or not g.group(1).strip():
            break
        s = s[:g.start()].strip()
    return s


# Dòng đề của bốn bộ ("Creation. Enterprise. Agriculture.") — mốc đầu bộ chắc hơn tiêu đề viết hoa (OCR: "SWOKDS").
DE_BO = ["Creation Enterprise Agriculture", "Preservation Love Instruction", "Transformation Hatred", "Development Money"]


def an_phu(van: str) -> dict[str, str | None]:
    a = re.search(r"FOUR\s+SERIES\s+OF\s+THE\s+MINOR", van)
    b = re.search(r"THIRD\s+LESSON", van[a.end():]) if a else None
    if not (a and b):
        return {}
    vung = chuan(van[a.end():a.end() + b.start()])
    dau = [re.search(_mem(d), vung, flags=re.I) for d in DE_BO]
    ra: dict[str, str | None] = {}
    for i, (bo, ten, moc) in enumerate(BO):
        sau = next((d for d in dau[i + 1:] if d), None)
        if not dau[i] or (i + 1 < len(BO) and not dau[i + 1]):          # không biết bộ này hết ở đâu → bỏ cả bộ ở bản quét này
            continue
        khuc = vung[dau[i].end(): sau.start() if sau else len(vung)]
        for cap, x in zip(CAP, _cat_theo_moc(khuc, moc)):
            ra[f"{bo}_{cap}"] = _sach_khuc(x) if x else None
    return ra


def an_chinh_boi(van: str) -> dict[str, str | None]:
    a = re.search(r"Juggler\s+signifies", van)
    if not a:
        return {}
    b = re.search(r"FOURTH\s+LESSON|BASIS\s+OF\s+THE\s+APPLICATION", van[a.end():])
    vung = chuan(van[a.end():a.end() + (b.start() if b else 2500)])
    # sau "22. The Universe" các nghĩa 7–22 nằm thành một cột riêng; 1–6 nằm ngay sau tên (hoặc cũng thành cột)
    khuc = _cat_theo_moc(vung, MOC_AN_CHINH, tron_tu=True)                 # "Love" không được khớp vào "Lovers"
    ra = {}
    for (so, ma, ten, _), x in zip(AN_CHINH, khuc):
        if x:
            x = re.split(r"(?<!\w)\d ?\d?\.(?=\s|$)", re.sub(_DAU_TRANG, " ", x))[0]      # "2. The High Priestess —" của dòng kế
            x = _bo_duoi(chuan(re.sub(r"[—»]", " ", x)))
        ra[ma] = x or None
    return ra


def _cau(doan: str) -> list[str]:
    cau = [c.strip() for c in re.split(r'(?<=[.!?])\s+(?=[A-Z"(])', doan)]
    return [c for c in cau if len(c) >= 25 and c[-1] in ".!?—" and c[0].isupper()]      # bỏ mẩu câu gãy ở chỗ sang trang, chú thích số


def an_chinh_doan(van: str) -> dict[str, list[str]]:
    """Chương riêng từng ẩn chính: từ dòng "Nth Hebrew letter (Tên chữ)" tới bảng tóm tắt AFFINITIES / lá kế."""
    ten = {chu.lower(): ma for _, ma, _, chu in AN_CHINH} | {"van": "dai_6", "eesh": "dai_20"}        # OCR: Vau → Van, Resh → Eesh
    moc = [(g.start(), ten.get(g.group(1).lower())) for g in re.finditer(r"Hebrew\s+letter\s+\((\w+)\)", van)]
    ra: dict[str, list[str]] = {}
    for i, (vt, ma) in enumerate(moc):
        if not ma or ma in ra:
            continue
        khuc = van[vt:moc[i + 1][0] if i + 1 < len(moc) else vt + 12000]
        g = re.search(r"\n\s*AFFINITIES|\n\s*SIGNIFICATIONS\s*\n", khuc)
        if g:
            khuc = khuc[:g.start()]
        ra[ma] = [c for d in re.split(r"\n\s*\n", khuc)[1:] for c in _cau_doan(d)]
    return ra


def _cau_doan(d: str) -> list[str]:
    return [] if re.fullmatch(r"[\sA-Z\d.,'()\-—]+", d) else _cau(chuan(d))          # bỏ tiêu đề viết hoa, số trang


def moi_cau(van: str) -> set[str]:
    """Mọi câu của một bản quét — để xác nhận câu của bản chính (không cần đúng chương)."""
    return {c for d in re.split(r"\n\s*\n", van) for c in _cau_doan(d)}


def _bau(ds: list[str | None]) -> str | None:
    """Giá trị mà ít nhất HAI bản quét cùng cho; không có → None (bỏ lá ấy)."""
    co = [x.rstrip(" ,;.") for x in ds if x]                           # dấu câu cuối khúc hay đọc lệch → so phần chữ
    if not co:
        return None
    x, n = Counter(co).most_common(1)[0]
    if n >= 2:
        return x + "."
    # Mỗi bản sai một chữ khác nhau: bầu TỪNG TỪ khi có ≥ 3 bản cùng số từ — từ nào cũng phải được ≥ 2 bản cho giống nhau.
    tu = [c.split(" ") for c in co]
    for dai, so in Counter(len(t) for t in tu).most_common(1):
        if so < 3:
            return None
        cot = [Counter(t[i] for t in tu if len(t) == dai).most_common(1)[0] for i in range(dai)]
        return " ".join(w for w, _ in cot) + "." if all(k >= 2 for _, k in cot) else None
    return None


def nap(tep: list[Path]) -> dict:
    van = [p.read_text("utf-8", errors="replace") for p in tep]
    assert len(van) >= 2, "cần ít nhất hai bản quét để đối chiếu"
    phu, boi, doan = [an_phu(v) for v in van], [an_chinh_boi(v) for v in van], an_chinh_doan(van[0])
    khac = [moi_cau(v) for v in van[1:]]
    ra: dict = {"_nguon": {
        "sach": "Papus (Gérard Encausse, 1865–1916), The Tarot of the Bohemians: The Most Ancient Book in the World — bản dịch Anh của "
                "A. P. Morton (London: Chapman & Hall, 1892; George Redway in lại 1896), từ Le Tarot des Bohémiens (Paris, 1889)",
        "nam": 1892,
        "pd": "phạm vi công cộng: xuất bản 1892 (trên 130 năm), tác giả mất 1916; bản dịch in trước 1929 (PD tại Mỹ)",
        "ban": "archive.org tarotofbohemians00papu (Redway 1896, BYU — bản chính) · tarotofbohemians00papu_0 (Redway 1896, Library of "
               "Congress) · cu31924028930571 (Chapman & Hall 1892, Cornell) · b24884510 (Rider 1910, Wellcome — chỉ góp phiếu); văn bản "
               "OCR _djvu.txt, lấy 2026-11-14",
        "url": ["https://archive.org/details/tarotofbohemians00papu", "https://archive.org/details/tarotofbohemians00papu_0",
                "https://archive.org/details/cu31924028930571", "https://archive.org/details/b24884510"],
        "cach_lay": "chỉ giữ chữ mà ít nhất hai bản quét độc lập cho ra giống hệt nhau (scripts/nap_tarot_papus.py); không gõ tay",
        "thu_tu": "thứ tự Marseille: 8 = Justice, 11 = Strength; lá Khờ (The Foolish Man) không số, đứng thứ 21 với chữ Shin; The Universe "
                  "thứ 22 với chữ Tau. Chữ Hebrew theo lối Pháp (Lévi): Aleph = lá 1 — khác lối Golden Dawn. Sceptres = Wands; Knave = Page.",
        "so_ban_quet": len(van)}}
    thieu = []
    for so, ma, ten, chu in AN_CHINH:
        b = _bau([x.get(ma) for x in boi])
        cau = [c for c in doan.get(ma) or [] if any(c in k for k in khac)]
        if not b and not cau:
            thieu.append(ma)
            continue
        ra[ma] = {"so_papus": so, "ten_en": ten, "chu_cai": chu, **({"boi": b} if b else {}), **({"doan": cau} if cau else {})}
        if not b:
            thieu.append(f"{ma}.boi")
    for bo, ten, _ in BO:
        for cap, tc in zip(CAP, TEN_CAP):
            ma = f"{bo}_{cap}"
            b = _bau([x.get(ma) for x in phu])
            if not b:
                thieu.append(ma)
                continue
            ra[ma] = {"ten_en": f"{tc} of {ten}", "boi": b}
    ra["_thieu"] = thieu
    return ra


if __name__ == "__main__":
    d = nap([Path(a) for a in sys.argv[1:]])
    (NGUON / "tarot_papus_1892.json").write_text(json.dumps(d, ensure_ascii=False, indent=1), "utf-8")
    so = [k for k in d if not k.startswith("_")]
    print(len(so), "lá;", sum(1 for k in so if d[k].get("boi")), "có nghĩa bói;", sum(len(d[k].get("doan") or []) for k in so),
          "câu chương ẩn chính; thiếu:", d["_thieu"])
