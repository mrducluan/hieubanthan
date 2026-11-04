# -*- coding: utf-8 -*-
"""TV-ZW "Cùng sao Mệnh" — dựng bảng tỉ lệ tổ hợp chính tinh cung Mệnh (`app/calc/data/tuvi_sao_menh_ty_le.json`).

    python scripts/sinh_tuvi_sao_menh.py          # ghi lại bảng (chạy khi đổi mẫu hoặc khẩu quyết)
    python scripts/sinh_tuvi_sao_menh.py --kiem   # chỉ kiểm (thoát 1 nếu bảng lệch phép tính)

Mẫu: mọi ngày dương 01/01/1940–31/12/2010 × 12 canh giờ, âm lịch Việt UTC+7 — xem `app/calc/tuvi_sao_menh.py`.
Không dùng dữ liệu người dùng; mỗi thời điểm tính như nhau (không phải thống kê dân số).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from app.calc import tuvi_sao_menh as sm  # noqa: E402

MO_TA = ("Số thời điểm sinh (ngày × canh giờ) theo tổ hợp chính tinh cung Mệnh — mẫu cố định, không phải thống kê dân "
         "số. Sinh bằng scripts/sinh_tuvi_sao_menh.py; đừng sửa tay.")


def main() -> int:
    moi = sm.dem_mau()
    if "--kiem" in sys.argv:
        cu = json.loads(sm.TEP.read_text(encoding="utf-8")) if sm.TEP.exists() else {}
        ok = all(cu.get(k) == v for k, v in moi.items())
        print("Bảng khớp." if ok else "Bảng LỆCH phép tính — chạy lại không có --kiem.")
        return 0 if ok else 1
    sm.TEP.parent.mkdir(parents=True, exist_ok=True)
    sm.TEP.write_text(json.dumps({"_mo_ta": MO_TA, **moi}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Đã ghi {sm.TEP.relative_to(GOC)}: {len(moi['dem'])} tổ hợp, {moi['tong']} thời điểm.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
