# -*- coding: utf-8 -*-
"""KT-N2 — nạp mục «男女合婚大利月» của «Hiệp Kỷ Biện Phương Thư» (協紀辨方書, 1741 — cổ thư công cộng), quyển 36 "Biện ngoa".

Nguồn: Kanseki Repository `KR3g0051` (bản Văn Uyên Các Tứ khố toàn thư, bản gõ đã soát).
    git clone --depth 1 https://github.com/kanripo/KR3g0051 /tmp/KR3g0051
    python scripts/nap_hiep_ky.py /tmp/KR3g0051
Chỉ nạp mục engine đang dẫn (tháng gả cưới đại lợi theo tuổi cô dâu — EN-5.1). Bảng nghi / kỵ của hoàng lịch đã có golden
đối chiếu oracle riêng (HL-1), không nạp lại ở đây.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
DAU, CUOI = "男女合婚大利月隂陽家言", "諸家鑾駕星曜玉皇鑾駕"


def nap(d: Path) -> dict:
    s = (d / "KR3g0051_035.txt").read_text("utf-8")
    s = re.sub(r"<[^>]*>|^#.*$|¶|　", "", s, flags=re.M)
    s = re.sub(r"\s", "", s)
    i, j = s.index(DAU), s.index(CUOI)
    van = s[i:j]
    assert 1500 < len(van) < 4000, len(van)
    return {"_nguon": "協紀辨方書 (Hiệp Kỷ Biện Phương Thư), Doãn Lộc và các quan Khâm Thiên Giám soạn theo lệnh vua Càn Long (1741). Cổ thư công cộng.",
            "ban": "Kanseki Repository KR3g0051 — bản Văn Uyên Các Tứ khố toàn thư (bản gõ, không chấm câu; lấy 2026-11-13); "
                   "chỉ nạp mục engine đang dẫn", "can_doi_chieu": True,
            "source_id": "hiep_ky_bien_phuong_thu", "school_id": "hiep_ky",
            "muc": [{"quyen": 36, "ten": "男女合婚大利月", "van": van}]}


if __name__ == "__main__":
    out = nap(Path(sys.argv[1]))
    (NGUON / "hiep_ky_bien_phuong_thu.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print("đã ghi", sum(len(m["van"]) for m in out["muc"]), "chữ")
