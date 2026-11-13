# -*- coding: utf-8 -*-
"""KT-N2 — nạp các thiên của «Tam Mệnh Thông Hội» (三命通會, Vạn Dân Anh, đời Minh — cổ thư công cộng) mà engine đang dùng.

Nguồn: Kanseki Repository `KR3g0042` (bản Văn Uyên Các Tứ khố toàn thư, bản gõ đã soát).
    git clone --depth 1 https://github.com/kanripo/KR3g0042 /tmp/KR3g0042
    python scripts/nap_tam_menh.py /tmp/KR3g0042
Chỉ nạp thiên có phép tính / bảng tra engine dùng (kho nguồn trước, lời sau): thần sát (quyển 2, 3), Thai nguyên, Mệnh cung,
tiểu vận, và hai thiên quyển 6 chứa khẩu quyết Thiên Đức, Khôi Cương. Chữ 巳 bản gõ nhiều chỗ ghi 己 — giữ nguyên bản.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
# (quyển, chuỗi phải có trong TÊN thiên) — và (quyển, chuỗi phải có trong THÂN thiên) cho quyển 6
THEO_TEN = [("002", k) for k in ("論胎元", "論坐命宫", "論小運", "論將星華葢")] + [("003", "")]
THEO_THAN = [("006", "正月丁喜亥將"), ("006", "壬辰庚戌與庚辰戊戌魁罡四座神")]


def tach(f: Path) -> list[tuple[str, str]]:
    ra: list[list[str]] = []
    for dong in f.read_text("utf-8").splitlines():
        if dong.startswith("#"):
            continue
        dong = re.sub(r"<[^>]*>", "", dong).replace("¶", "")
        m = re.match(r"^[　 ]{2,}([^　 ]{2,40})$", dong)
        if m and not ra or (m and len(m.group(1)) <= 40 and re.match(r"^(論|[^\(（]{2,12}$)", m.group(1))):
            ra.append([m.group(1), ""])
        elif ra:
            ra[-1][1] += dong.replace("　", "").strip()
    return [(t, v) for t, v in ra if v]


def nap(d: Path) -> dict:
    thien = []
    for q in sorted({q for q, _ in THEO_TEN + THEO_THAN}):
        cac = tach(d / f"KR3g0042_{q}.txt")
        for ten, van in cac:
            if any(q == q0 and k in ten for q0, k in THEO_TEN) or any(q == q0 and k in van for q0, k in THEO_THAN):
                thien.append({"quyen": int(q), "ten": ten, "van": van})
    assert len(thien) >= 25, len(thien)
    return {"_nguon": "三命通會 (Tam Mệnh Thông Hội), Vạn Dân Anh soạn (đời Minh). Cổ thư công cộng.",
            "ban": "Kanseki Repository KR3g0042 — bản Văn Uyên Các Tứ khố toàn thư (bản gõ, không chấm câu; lấy 2026-11-13); "
                   "chỉ nạp các thiên engine đang dùng", "can_doi_chieu": True,
            "source_id": "tam_menh_thong_hoi", "school_id": "tu_binh", "thien": thien}


if __name__ == "__main__":
    out = nap(Path(sys.argv[1]))
    (NGUON / "tam_menh_thong_hoi.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print("đã ghi", len(out["thien"]), "thiên")
