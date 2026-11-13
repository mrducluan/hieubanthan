# -*- coding: utf-8 -*-
"""KT-NT1 — nạp nguyên văn cổ thư Nhân tướng có trên Wikisource tiếng Trung vào kho nguồn.

  • 冰鑑 (Băng Giám, khuyết danh, đời Thanh) — 7 chương, phồn thể.
  • 心相篇 (Tâm Tướng Thiên, tương truyền Trần Đoàn) — một bài, bản Wikisource là GIẢN thể.
  • 靈樞經 · 五色第四十九 (Linh Khu, Ngũ Sắc) — bản Tứ khố toàn thư (không chấm câu), quyển 8.

Đều là bản gõ lại của người dùng Wikisource → `can_doi_chieu: true`. Ma Y, Thần Tướng Toàn Biên, Thuỷ Kính, Liễu Trang chưa có
bản điện tử tin được → chờ chủ dự án gửi bản quét (xem docs/KIEM-TOAN-TRI-THUC-2026-11.md mục 10.13).

KT-NT2 (2026-11-13) thêm bốn sách tướng thuật của Tứ khố toàn thư (子部術數類相書之屬), bản gõ lại Kanseki Repository
(Kanripo, bản Văn Uyên Các) — đã chấm lại, chất lượng tốt hơn hẳn bản OCR archive.org của Thần Tướng Toàn Biên:
  • 月波洞中記 (Nguyệt Ba Động Trung Ký) KR3g0043 · 玉管照神局 (Ngọc Quản Chiếu Thần Cục) KR3g0044
  • 太清神鑑 (Thái Thanh Thần Giám) KR3g0045 · 人倫大統賦 (Nhân Luân Đại Thống Phú, kèm chú Tiết Diên Niên) KR3g0046
Thần Tướng Toàn Biên chép lại nhiều phần của bốn sách này.

Dùng:  python scripts/nap_nhan_tuong_co_thu.py /thu/muc/wikisource /thu/muc/kanripo
  (thư mục 1 chứa 冰鑒.txt, 心相篇.txt, lk08.txt — wikitext `action=raw`;
   thư mục 2 chứa bản `git clone --depth 1 https://github.com/kanripo/KR3g004{3,4,5,6}`)
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


KANRIPO = [("nguyet_ba", "KR3g0043", "月波洞中記"), ("ngoc_quan", "KR3g0044", "玉管照神局"),
           ("thai_thanh", "KR3g0045", "太清神鑑"), ("nhan_luan", "KR3g0046", "人倫大統賦")]


def kanripo(thu_muc: Path) -> str:
    """Nối các quyển (bỏ dòng thuộc tính `#`, mốc trang `<pb:…>`, dấu `¶`, khoảng trắng toàn khổ)."""
    van = []
    for f in sorted(thu_muc.glob(f"{thu_muc.name}_0*.txt")):
        for dong in f.read_text("utf-8").splitlines():
            if dong.startswith("#"):
                continue
            dong = re.sub(r"<[^>]*>", "", dong).replace("¶", "").replace("\u3000", "").strip()
            if dong:
                van.append(dong)
    return "\n".join(van)


def nap(d: Path, kr: Path) -> dict:
    bg = bang_giam((d / "冰鑒.txt").read_text("utf-8"))
    assert len(bg) == 7, len(bg)
    tt = _sach((d / "心相篇.txt").read_text("utf-8"))
    ns = ngu_sac((d / "lk08.txt").read_text("utf-8"))
    assert len(tt) > 1500 and len(ns) > 1000
    return {"_nguon": "Cổ thư Nhân tướng công cộng: 冰鑑 (Băng Giám, đời Thanh), 心相篇 (Tâm Tướng Thiên), 靈樞經 · 五色 (Linh Khu, Ngũ Sắc), "
                       "月波洞中記, 玉管照神局, 太清神鑑, 人倫大統賦 (Tứ khố toàn thư).",
            "ban": "Wikisource tiếng Trung (bản gõ lại; Băng Giám phồn thể có chấm câu, Tâm Tướng Thiên giản thể, Linh Khu bản Tứ khố "
                   "không chấm câu; lấy 2026-11-13) — CHƯA đối chiếu bản khắc",
            "can_doi_chieu": True, "source_id": "nhan_tuong_co_thu", "school_id": "nhan_tuong",
            "kanripo": "Kanseki Repository (github.com/kanripo), bản Văn Uyên Các Tứ khố toàn thư, lấy 2026-11-13",
            "sach": {**{ma: {"ten": ten, "kanripo": ma_kr, "van": kanripo(kr / ma_kr)} for ma, ma_kr, ten in KANRIPO},
                     "bang_giam": {"ten": "冰鑑", "chuong": bg},
                     "tam_tuong_thien": {"ten": "心相篇", "van": tt},
                     "noi_kinh": {"ten": "靈樞經 · 五色第四十九", "van": ns}}}


if __name__ == "__main__":
    out = nap(Path(sys.argv[1]), Path(sys.argv[2]))
    (NGUON / "nhan_tuong_co_thu.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print("đã ghi", NGUON / "nhan_tuong_co_thu.json")
