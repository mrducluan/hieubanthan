# -*- coding: utf-8 -*-
"""KT-TT5 — nạp nguyên văn «Tăng San Bốc Dịch» (增刪卜易, Dã Hạc lão nhân, đời Thanh — cổ thư công cộng) vào kho nguồn.

Nguồn: Wikisource tiếng Trung, trang 增刪卜易/<chương> (wikitext thô, `action=raw`). Bản gõ lại của người dùng Wikisource
(chất lượng trang ghi 50 %) → `can_doi_chieu: true` cho tới khi so được bản khắc.

Dùng:  python scripts/nap_tang_san_boc_dich.py /thu/muc/chua/19.txt,20.txt,25.txt,26又4.txt
Chỉ nạp các chương engine đang DÙNG (kho nguồn trước, lời sau): lục hợp, lục xung, phản phục, quy hồn du hồn.
Hình quẻ trong thẻ <pre> bỏ (thay bằng dấu 〔卦〕) — chỉ giữ lời.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
CHUONG = [("19", "六合章第十九"), ("20", "六沖章第二十"), ("25", "反伏章第二十五"), ("26又4", "歸魂遊魂章第又二十六")]


def _sach(s: str) -> str:
    m = re.search(r"<onlyinclude>(.*?)</onlyinclude>", s, flags=re.S)
    s = m.group(1) if m else s
    s = re.sub(r"<pre>.*?</pre>", "〔卦〕", s, flags=re.S)
    s = re.sub(r"\{\{[^{}]*\}\}|<[^>]+>", "", s)
    return re.sub(r"\n{2,}", "\n", s).strip()


def nap(thu_muc: Path) -> dict:
    thien = []
    for so, ten in CHUONG:
        van = _sach((thu_muc / f"{so}.txt").read_text("utf-8"))
        assert len(van) > 150, (so, len(van))
        thien.append({"so": so, "ten": ten, "van": van})
    return {"_nguon": "增刪卜易 (Tăng San Bốc Dịch), Dã Hạc lão nhân soạn, Lý Văn Huy tăng san (đời Thanh). Cổ thư công cộng.",
            "ban": "Wikisource tiếng Trung, trang 增刪卜易 (bản gõ lại, phồn thể, chấm câu hiện đại; lấy 2026-11-12) — CHƯA đối "
                   "chiếu bản khắc; chỉ nạp các chương engine đang dùng",
            "can_doi_chieu": True, "source_id": "tang_san_boc_dich", "school_id": "luc_hao", "thien": thien}


if __name__ == "__main__":
    d = nap(Path(sys.argv[1]))
    (NGUON / "tang_san_boc_dich.json").write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(len(d["thien"]), "chương", sum(len(t["van"]) for t in d["thien"]), "chữ")
