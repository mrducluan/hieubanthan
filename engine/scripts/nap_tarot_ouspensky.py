# -*- coding: utf-8 -*-
"""TR-6 — nạp nguyên văn P. D. Ouspensky, «The Symbolism of the Tarot» (bản dịch Anh A. L. Pogossky, St. Petersburg 1913).

Sách: P. D. Ouspensky (1878–1947), *The Symbolism of the Tarot: Philosophy of Occultism in Pictures and Numbers*, dịch từ tiếng
Nga bởi A. L. Pogossky (mất 1921), Trood Printing, St. Petersburg 1913 — xuất bản trước 1929, tác giả mất 1947, dịch giả mất
1921 → phạm vi công cộng. 22 bài "bút ký" (pen-pictures), mỗi bài một ẩn chính: người kể bước vào hình lá bài và nghe "tiếng nói"
giảng nghĩa — dùng làm lớp CHIÊM NGHIỆM, không phải nghĩa bói.

Nguồn tải: hai bản gõ lại độc lập trên archive.org (văn bản `_djvu.txt`):
  · the-symbolism-of-the-tarot-ouspensky_202012   ← bản CHÍNH (chỉ có chữ của Ouspensky)
  · the-symbolism-of-the-tarot-ouspensky_202503   (bản có lời bình hiện đại của người biên tập, ký "D.T." — KHÔNG lấy lời bình)
Chỉ giữ câu mà CẢ HAI bản cùng có (so trên chữ và số, bỏ khác biệt dấu ngoặc kép / gạch nối / xuống dòng) → lời bình hiện đại và
chỗ gõ sai của riêng một bản tự rơi. Không gõ tay câu nào.

Dùng:  python scripts/nap_tarot_ouspensky.py <ban_chinh.txt> <ban_doi_chieu.txt>

Ouspensky đánh số theo cách riêng: V = The Chariot, VII = The Hierophant (đổi chỗ so với Waite), VIII = Power (Strength),
XI = Justice, X = The Wheel of Chance, XIV = Time (Temperance); các bài xếp theo cặp I–0, II–XXI, III–XX…
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"

# số La Mã Ouspensky ghi ở đầu bài → (id lá KB, tên Ouspensky đặt)
LA = {"I": ("dai_1", "The Magician"), "0": ("dai_0", "The Fool"), "II": ("dai_2", "The High Priestess"), "XXI": ("dai_21", "The World"),
      "III": ("dai_3", "The Empress"), "XX": ("dai_20", "Judgment"), "IV": ("dai_4", "The Emperor"), "XIX": ("dai_19", "The Sun"),
      "V": ("dai_7", "The Chariot"), "XVIII": ("dai_18", "The Moon"), "VI": ("dai_6", "The Lovers"), "XVII": ("dai_17", "The Star"),
      "VII": ("dai_5", "The Hierophant"), "XVI": ("dai_16", "The Tower"), "VIII": ("dai_8", "Power"), "XV": ("dai_15", "The Devil"),
      "IX": ("dai_9", "The Hermit"), "XIV": ("dai_14", "Time (Temperance)"), "X": ("dai_10", "The Wheel of Chance"),
      "XIII": ("dai_13", "Death"), "XI": ("dai_11", "Justice"), "XII": ("dai_12", "The Hanged Man")}
# chữ khoá trong tiêu đề để kiểm lại số La Mã (OCR "XIL" = XII)
KHOA = {"dai_1": "MAGICIAN", "dai_0": "FOOL", "dai_2": "PRIESTESS", "dai_21": "WORLD", "dai_3": "EMPRESS", "dai_20": "JUDGMENT",
        "dai_4": "EMPEROR", "dai_19": "SUN", "dai_7": "CHARIOT", "dai_18": "MOON", "dai_6": "LOVERS", "dai_17": "STAR",
        "dai_5": "HIEROPHANT", "dai_16": "TOWER", "dai_8": "POWER", "dai_15": "DEVIL", "dai_9": "HERMIT", "dai_14": "TEMPERANCE",
        "dai_10": "WHEEL", "dai_13": "DEATH", "dai_11": "JUSTICE", "dai_12": "HANGED"}


def chuan(s: str) -> str:
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("—", " — ").replace("--", " — ")
    s = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", s)
    s = re.sub(r"\s+", " ", s)
    return re.sub(r" ([,;:.?!)])", r"\1", s).strip()


def _khoa(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def _cau(doan: str) -> list[str]:
    return [c.strip() for c in re.split(r'(?<=[.!?])["\']?\s+(?=["\'A-Z—])', doan) if len(_khoa(c)) >= 20]


def bai(van: str) -> dict[str, list[str]]:
    """Cắt 22 bài theo dòng "CARD <số La Mã>."; mỗi bài là danh sách câu."""
    moc = [(g.start(), g.end(), g.group(1).replace("XIL", "XII")) for g in re.finditer(r"(?m)^\s*CARD\s+([0IVXL]+)\b\.?", van)]
    ra: dict[str, list[str]] = {}
    for i, (_, het, so) in enumerate(moc):
        if so not in LA or LA[so][0] in ra:
            continue
        ma = LA[so][0]
        khuc = van[het:moc[i + 1][0] if i + 1 < len(moc) else len(van)]
        dong = [d for d in khuc.split("\n")]
        than = "\n".join(d for d in dong if not re.fullmatch(r"[\sA-Z().]{0,40}", d))          # bỏ dòng tiêu đề viết hoa
        if KHOA[ma] not in khuc.upper() and ma != "dai_11":                                      # bài XI: một bản mất dòng tiêu đề
            continue
        ra[ma] = [c for d in re.split(r"\n\s*\n", than) for c in _cau(chuan(d))]
    return ra


def nap(chinh: Path, doi_chieu: Path) -> dict:
    a, b = chinh.read_text("utf-8", errors="replace"), doi_chieu.read_text("utf-8", errors="replace")
    ba = bai(a)
    co = {_khoa(c) for c in _cau(chuan(b))} | {_khoa(c) for d in re.split(r"\n\s*\n", b) for c in _cau(chuan(d))}
    tat = _khoa(chuan(b))
    ra: dict = {"_nguon": {
        "sach": "P. D. Ouspensky (1878–1947), The Symbolism of the Tarot: Philosophy of Occultism in Pictures and Numbers — bản dịch Anh "
                "của A. L. Pogossky (St. Petersburg: Trood Printing and Publishing Co., 1913)",
        "nam": 1913,
        "pd": "phạm vi công cộng: xuất bản 1913 (trước 1929), tác giả mất 1947; năm mất của dịch giả (khoảng 1921) chưa đối chiếu",
        "ban": "archive.org the-symbolism-of-the-tarot-ouspensky_202012 (bản chính) · the-symbolism-of-the-tarot-ouspensky_202503 "
               "(đối chiếu; lời bình hiện đại ký D.T. không lấy); hai bản gõ lại độc lập, văn bản _djvu.txt, lấy 2026-11-14",
        "url": ["https://archive.org/details/the-symbolism-of-the-tarot-ouspensky_202012",
                "https://archive.org/details/the-symbolism-of-the-tarot-ouspensky_202503"],
        "cach_lay": "chỉ giữ câu cả hai bản cùng có (scripts/nap_tarot_ouspensky.py); không gõ tay",
        "thu_tu": "số của Ouspensky: V = The Chariot, VII = The Hierophant, VIII = Power (Strength), XI = Justice, X = The Wheel of "
                  "Chance, XIV = Time (Temperance). Bút ký chiêm nghiệm 22 ẩn chính — không phải nghĩa bói."}}
    thieu = []
    for so, (ma, ten) in LA.items():
        cau = [c for c in ba.get(ma) or [] if _khoa(c) in co or f" {_khoa(c)} " in f" {tat} "]
        if len(cau) < 3:
            thieu.append(ma)
            continue
        ra[ma] = {"so_ouspensky": so, "ten_en": ten, "doan": cau}
    ra["_thieu"] = thieu
    return ra


if __name__ == "__main__":
    d = nap(Path(sys.argv[1]), Path(sys.argv[2]))
    (NGUON / "tarot_ouspensky_1913.json").write_text(json.dumps(d, ensure_ascii=False, indent=1), "utf-8")
    so = [k for k in d if not k.startswith("_")]
    print(len(so), "lá;", sum(len(d[k]["doan"]) for k in so), "câu; thiếu:", d["_thieu"])
