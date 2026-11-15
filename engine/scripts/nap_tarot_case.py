# -*- coding: utf-8 -*-
"""TR-6 — nạp nguyên văn Paul Foster Case, «An Introduction to the Study of the Tarot» (New York, 1920) vào kho nguồn.

Sách: Paul Foster Case (1884–1954) đăng từng kỳ trên tạp chí *Azoth* (1916–1919), in thành sách tại New York năm 1920 —
xuất bản tại Mỹ trước 1929 → phạm vi công cộng tại Mỹ; tác giả mất 1954 (quá 50 năm theo luật Việt Nam, quá 70 năm từ 2025).
Đây là gốc của lối đọc B.O.T.A.: 22 ẩn chính gắn 22 chữ Hebrew theo thứ tự lá 0 = Aleph (trùng lối Golden Dawn KB đang dùng),
đọc theo bộ bài Waite–Smith (8 = Strength, 11 = Justice). Sách KHÔNG bàn nghĩa bói và không bàn riêng 56 ẩn phụ.

Nguồn tải: archive.org `IntroductionToTheStudyOfTheTarot` (bản gõ lại hiện đại từ bản in 1920, văn bản `_djvu.txt`).
Bản gõ lại có MỘT chú thích của người biên tập hiện đại (chú thích 5: đổi phương hướng của Lamed và Nun theo tài liệu về sau
của Case) → script BỎ chú thích ấy và hai câu phương hướng đã bị đổi; phần còn lại là chữ của bản 1920.
Một số chữ L hoa bị đọc thành F ("Fife", "Fimitless") — giữ nguyên như bản tải (không sửa tay); câu trích vào KB chọn chỗ sạch.

Dùng:  python scripts/nap_tarot_case.py <case_1920_djvu.txt>

Lấy gì:
  · chương III — bảng thuộc tính 22 chữ Hebrew: mỗi lá `chu_cai` {ten, y: [các câu thuộc tính]} (tên chữ, nghĩa chữ, hành tinh /
    cung / nguyên tố, "Intelligence" của con đường);
  · chương V–XII — phần bàn từng lá: `_chuong` giữ nguyên các đoạn, mỗi lá `doan` = danh sách [chương, số đoạn] có nhắc tên lá.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"

# 22 chữ theo thứ tự chương III ↔ lá 0…21 (Case, chương II: "Substituting the numbers of the major trumps corresponding to the Hebrew letters").
CHU = ["ALEPH", "BETH", "GIMEL", "DALETH", "HE", "VAU", "ZAIN", "CHETH", "TETH", "YOD", "KAPH", "LAMED", "MEM", "NUN", "SAMEKH",
       "AYIN", "PEH", "TZADDI", "QOPH", "RESH", "SHIN", "TAU"]
TEN_LA = ["The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant", "The Lovers", "The Chariot",
          "Strength", "The Hermit", "The Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", "The Devil", "The Tower",
          "The Star", "The Moon", "The Sun", "Judgement", "The World"]
# Cách Case gọi lá trong chương V–XII (chữ hoa đầu; "the Sun" thiên văn cũng khớp — chỉ để GOM đoạn, câu trích do người chọn).
GOI = [r"\bFool\b", r"\bMagician\b", r"\bHigh Priestess\b", r"\bEmpress\b", r"\bEmperor\b", r"\bHierophant\b", r"\bLovers\b", r"\bChariot\b",
       r"\bStrength\b", r"\bHermit\b", r"\bWheel of Fortune\b", r"\bJustice\b", r"\bHanged Man\b", r"\bDeath\b", r"\bTemperance\b",
       r"\bDevil\b", r"\bTower\b", r"\bStar\b", r"\bMoon\b", r"\bSun\b", r"\bJudge?ment\b", r"\bWorld\b"]
# Case còn gọi lá theo số thứ tự: "the twentieth Key", "the sixth trump".
THU = ["zero", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth",
       "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first"]
CHUONG = ["V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
# Hai lá Case hay gọi bằng HÌNH trên lá thay vì tên: bánh xe (lá 10), tiếng kèn / nấm mồ (lá 20).
GOI_HINH = {10: r"\b[Ww]heel\b", 20: r"\b(?:trumpet|tomb)\b"}


def chuan(s: str) -> str:
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1-\2", s)          # bản gõ lại chỉ ngắt dòng ở từ ghép có gạch ("Bhagavad-\nGita")
    s = re.sub(r"\s+", " ", s)
    return re.sub(r" ([,;:.?!)])", r"\1", s).strip()


def _bo_rac(van: str) -> str:
    van = re.sub(r"(?m)^\s*\d{1,2}\s*$", "", van)                                        # số trang đứng riêng
    van = re.sub(r"(?m)^\s*Introduction\s+to\s+the\s+Study\s+of\s+Tarot\s*$", "", van)     # đầu trang
    van = re.sub(r"(?ms)^\s*5\s+Paul\s+Case\s+in\s+1920.*?\bEd\.\s*$", "", van)            # chú thích của người biên tập HIỆN ĐẠI → bỏ
    return van


def _tach_chuong(van: str) -> dict[str, str]:
    moc = [(g.start(), g.end(), g.group(1)) for g in re.finditer(r"(?m)^\s*CHAPTER\s+([IVX]+)\s*$", van)]
    return {ten: van[het:(moc[i + 1][0] if i + 1 < len(moc) else len(van))] for i, (_, het, ten) in enumerate(moc)}


def chu_cai(ch3: str) -> list[dict]:
    """Chương III: mỗi chữ một khối, đầu khối là dòng ngắn kết thúc bằng tên chữ ("D BETH", "■» Yod")."""
    dong = ch3.split("\n")
    vt = []
    for i, d in enumerate(dong):
        t = d.strip().split()
        if t and len(d.strip()) <= 12 and t[-1].upper() in CHU and t[-1].upper() == (CHU[len(vt)] if len(vt) < 22 else ""):
            vt.append(i)
    assert len(vt) == 22, f"chỉ thấy {len(vt)} chữ ở chương III"
    ra = []
    for k, i in enumerate(vt):
        het = vt[k + 1] if k + 1 < 22 else next(j for j in range(i, len(dong)) if dong[j].startswith("Memorize"))
        khoi = "\n".join(dong[i + 1:het])
        khoi = re.sub(r"(?m)^\s*\d\s+(?:The\s+planetary|Mackey)\b.*$", "", khoi)          # chú thích chân trang (nguồn dẫn)
        y = [c.strip() for c in re.split(r"(?<=[.])\s+(?=[A-Z])", chuan(khoi)) if c.strip()]
        y = [c for c in y if not re.search(r"(?:North|South)-west\s*5", c)]              # hai câu phương hướng đã bị biên tập đổi
        ra.append({"ten": CHU[k].capitalize(), "y": y})
    return ra


def nap(tep: Path) -> dict:
    van = _bo_rac(tep.read_text("utf-8", errors="replace"))
    ch = _tach_chuong(van[van.index("frontispiece"):] if "frontispiece" in van else van)
    assert all(c in ch for c in ["III", *CHUONG]), sorted(ch)
    cc = chu_cai(ch["III"])
    chuong = {c: [chuan(d) for d in re.split(r"\n\s*\n", ch[c]) if len(chuan(d)) >= 60 and not re.match(r"\d\s", chuan(d))] for c in CHUONG}
    ra: dict = {"_nguon": {
        "sach": "Paul Foster Case (1884–1954), An Introduction to the Study of the Tarot (New York: Azoth Publishing, 1920)",
        "nam": 1920,
        "pd": "phạm vi công cộng tại Mỹ (xuất bản trước 1929); tác giả mất 1954",
        "ban": "archive.org IntroductionToTheStudyOfTheTarot — bản gõ lại hiện đại từ bản in 1920 (văn bản _djvu.txt), lấy 2026-11-14; "
               "đã bỏ chú thích của người biên tập hiện đại và hai câu phương hướng (Lamed, Nun) bị đổi theo tài liệu về sau",
        "url": ["https://archive.org/details/IntroductionToTheStudyOfTheTarot"],
        "thu_tu": "lá 0 = Aleph … lá 21 = Tau (trùng lối Golden Dawn); đọc theo bộ Waite–Smith: 8 = Strength (Teth), 11 = Justice (Lamed). "
                  "Sách chỉ bàn 22 ẩn chính, không có nghĩa bói.",
        "luu_y": "bản tải còn lỗi nhận chữ L → F ở vài chỗ (\"Fife\", \"Fimitless\"); không sửa tay"}}
    cua: dict[int, list] = {so: [] for so in range(22)}
    for c in CHUONG:
        truoc: list[int] = []
        for i, d in enumerate(chuong[c]):
            co = [so for so in range(22) if re.search(GOI[so], d) or re.search(rf"\b{THU[so]}(?: major)? (?:Key|trump)\b", d)
                  or (so in GOI_HINH and re.search(GOI_HINH[so], d))]
            co = co or truoc                      # đoạn không nêu tên lá nào → đang bàn tiếp (các) lá của đoạn trước
            for so in co:
                cua[so].append([c, i])
            truoc = co
    for so in range(22):
        ra[f"dai_{so}"] = {"so": so, "ten_en": TEN_LA[so], "chu_cai": cc[so], "doan": cua[so]}
    ra["_chuong"] = chuong
    return ra


if __name__ == "__main__":
    d = nap(Path(sys.argv[1]))
    (NGUON / "tarot_case_1920.json").write_text(json.dumps(d, ensure_ascii=False, indent=1), "utf-8")
    print(sum(1 for k in d if k.startswith("dai_")), "lá;", sum(len(v) for v in d["_chuong"].values()), "đoạn chương V–XII;",
          "ít đoạn nhất:", min((len(d[f"dai_{i}"]["doan"]), i) for i in range(22)))
