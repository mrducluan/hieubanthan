# -*- coding: utf-8 -*-
"""KT-NT1 — nạp nguyên văn cổ thư Nhân tướng có trên Wikisource tiếng Trung vào kho nguồn.

  • 冰鑑 (Băng Giám, khuyết danh, đời Thanh) — 7 chương, phồn thể.
  • 心相篇 (Tâm Tướng Thiên, tương truyền Trần Đoàn) — một bài, bản Wikisource là GIẢN thể.
  • 靈樞經 · 五色第四十九 (Linh Khu, Ngũ Sắc) — bản Tứ khố toàn thư (không chấm câu), quyển 8.

Đều là bản gõ lại của người dùng Wikisource → `can_doi_chieu: true`. Ma Y, Thần Tướng Toàn Biên, Thuỷ Kính, Liễu Trang chưa có
bản điện tử tin được → chờ chủ dự án gửi bản quét (xem docs/KIEM-TOAN-TRI-THUC-2026-11.md mục 10.13).

Dùng:  python scripts/nap_nhan_tuong_co_thu.py /thu/muc  (chứa 冰鑒.txt, 心相篇.txt, lk08.txt — wikitext `action=raw`)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"


def _sach(s: str) -> str:
    s = re.sub(r"\{\{SK anchor\|([^}]*)\}\}", r"〔\1〕", s)
    s = re.sub(r"\{\{[^{}]*\}\}|<[^>]+>|<!--.*?-->", "", s, flags=re.S)
    s = s.replace("　", "")
    return re.sub(r"\n{2,}", "\n", s).strip()


def bang_giam(t: str) -> list[dict]:
    phan = re.split(r"====([^=]+)====", t)[1:]
    ra = [{"ten": phan[i].strip(), "van": _sach(phan[i + 1])} for i in range(0, len(phan), 2)]
    return [x for x in ra if "章" in x["ten"]]


def ngu_sac(t: str) -> str:
    v = _sach(t)
    a = v.index("〔五色第四十九〕")
    b = v.index("〔", a + 1)
    return v[a + len("〔五色第四十九〕"):b].strip()


def nap(d: Path) -> dict:
    bg = bang_giam((d / "冰鑒.txt").read_text("utf-8"))
    assert len(bg) == 7, len(bg)
    tt = _sach((d / "心相篇.txt").read_text("utf-8"))
    ns = ngu_sac((d / "lk08.txt").read_text("utf-8"))
    assert len(tt) > 1500 and len(ns) > 1000
    return {"_nguon": "Cổ thư Nhân tướng công cộng: 冰鑑 (Băng Giám, đời Thanh), 心相篇 (Tâm Tướng Thiên), 靈樞經 · 五色 (Linh Khu, Ngũ Sắc).",
            "ban": "Wikisource tiếng Trung (bản gõ lại; Băng Giám phồn thể có chấm câu, Tâm Tướng Thiên giản thể, Linh Khu bản Tứ khố "
                   "không chấm câu; lấy 2026-11-13) — CHƯA đối chiếu bản khắc",
            "can_doi_chieu": True, "source_id": "nhan_tuong_co_thu", "school_id": "nhan_tuong",
            "sach": {"bang_giam": {"ten": "冰鑑", "chuong": bg},
                     "tam_tuong_thien": {"ten": "心相篇", "van": tt},
                     "noi_kinh": {"ten": "靈樞經 · 五色第四十九", "van": ns}}}


if __name__ == "__main__":
    out = nap(Path(sys.argv[1]))
    (NGUON / "nhan_tuong_co_thu.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print("đã ghi", NGUON / "nhan_tuong_co_thu.json")
