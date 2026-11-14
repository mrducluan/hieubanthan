# -*- coding: utf-8 -*-
"""SX-C — kiểm một tệp KB chứa mục "sách xưa ghi" (xem `app/kb/sach_ghi.py`).

    cd engine && PYTHONPATH=. python scripts/kiem_sach_ghi.py app/kb/data/<tệp>.json [tệp khác …]

Thoát 1 khi còn lỗi. In số mục theo nhóm A / B / C để biết tỉ lệ."""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.kb import sach_ghi  # noqa: E402

hong = 0
for p in sys.argv[1:]:
    n, loi = sach_ghi.kiem_tep(Path(p))
    nhom = collections.Counter(m["nhom"] for _, m in sach_ghi.cac_muc(json.loads(Path(p).read_text("utf-8"))))
    print(f"{p}: {n} mục · A {nhom['A']} · B {nhom['B']} · C {nhom['C']} · lỗi {len(loi)}")
    for x in loi[:60]:
        print("  -", x)
    hong += len(loi)
sys.exit(1 if hong else 0)
