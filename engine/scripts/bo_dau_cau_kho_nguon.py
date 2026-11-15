# -*- coding: utf-8 -*-
"""Bỏ dấu chấm câu thời nay khỏi kho nguồn chữ Hán (`fixtures/nguon/*.json`).

Vì sao: sách xưa không chấm câu; dấu chấm câu trên Wikisource (CC BY-SA) hay trong bản điện tử thời nay là công của người gõ /
người hiệu đính, không phải của sách. Kho nguồn chỉ giữ CHỮ SÁCH (như bản Tứ khố): bỏ ，。、；：？！「」『』《》“”… ; ngoặc
tròn đánh dấu chú → 〔…〕 (cùng quy ước chú nhỏ của các bộ nạp); giữ xuống dòng, khoảng trắng, 〔〕, ký hiệu hào ⚊⚋○ㄨ, chữ số.
Chỉ đụng chuỗi có chữ Hán ở khoá văn bản; khoá mô tả (`_nguon`, `ban`, `ghi_chu`…) giữ nguyên. Kho Tarot (tiếng Anh, sách
phạm vi công cộng) không đụng. Chạy lại không đổi gì (idempotent).

    python scripts/bo_dau_cau_kho_nguon.py            # ghi đè
    python scripts/bo_dau_cau_kho_nguon.py --kiem     # chỉ báo tệp còn dấu câu (dùng trong test)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
META = {"_nguon", "ban", "nguon", "ghi_chu", "_ghi_chu", "source_id", "school_id", "can_doi_chieu", "sach", "kho"}
DAU = re.compile(r"[，。、；：？！「」『』《》〈〉“”‘’…—．﹐﹑﹔﹕﹖﹗【】　,;:?!.\"]")
_HAN = re.compile(r"[一-鿿]")


_THUC_THE = re.compile(r"(&[A-Z]+\d+;)")      # chữ ngoài bảng mã của Kanripo (&KR0951;) — giữ nguyên dấu «;»


def bo_dau(s: str) -> str:
    ra = []
    for i, phan in enumerate(_THUC_THE.split(s)):
        if i % 2:
            ra.append(phan)
            continue
        phan = re.sub(r"[（(]", "〔", phan)
        phan = re.sub(r"[）)]", "〕", phan)
        ra.append(DAU.sub("", phan))
    return "".join(ra)


def _sua(x, khoa: str = ""):
    if isinstance(x, str):
        return bo_dau(x) if khoa not in META and not khoa.startswith("_") and _HAN.search(x) else x
    if isinstance(x, dict):
        return {k: _sua(v, k) for k, v in x.items()}
    if isinstance(x, list):
        return [_sua(v, khoa) for v in x]
    return x


def tep_chu_han() -> list[Path]:
    return [p for p in sorted(NGUON.glob("*.json")) if not p.name.startswith("tarot_")]


def con_dau(p: Path) -> int:
    d = json.loads(p.read_text("utf-8"))
    return sum(1 for a, b in zip(json.dumps(d, ensure_ascii=False), json.dumps(_sua(d), ensure_ascii=False)) if a != b) \
        if _sua(d) != d else 0


if __name__ == "__main__":
    kiem = "--kiem" in sys.argv
    for p in tep_chu_han():
        d = json.loads(p.read_text("utf-8"))
        moi = _sua(d)
        if moi != d:
            if kiem:
                print("còn dấu câu:", p.name)
            else:
                p.write_text(json.dumps(moi, ensure_ascii=False, indent=1) + "\n", "utf-8")
                print("đã bỏ dấu câu:", p.name)
