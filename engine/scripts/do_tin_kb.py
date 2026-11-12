# -*- coding: utf-8 -*-
"""KT-TT6 — dựng `docs/DO-TIN-KHO-TRI-THUC.md` từ sổ `app/kb/do_tin.py` (một nguồn; test bắt quên chạy).

Dùng:  PYTHONPATH=. python scripts/do_tin_kb.py
"""
from __future__ import annotations

import collections
from pathlib import Path

from app.kb import do_tin

DOC = Path(__file__).resolve().parent.parent.parent / "docs" / "DO-TIN-KHO-TRI-THUC.md"
MANG = {"battu": "Bát tự", "tuvi": "Tử vi", "kinhdich": "Kinh Dịch", "phongthuy": "Phong thuỷ", "nhantuong": "Nhân tướng",
        "tarot": "Tarot", "thanso": "Thần số", "lich": "Lịch · tuổi · tập quán", "chung": "Liên mảng · kỹ thuật"}


def dung() -> str:
    b = do_tin.bang()
    tep = [d for d in b if not d["phan"]]
    dem = collections.Counter((d["mang"], d["muc"]) for d in tep)
    ra = ["# Độ tin của kho tri thức (KT-TT6)", "",
          "> Tệp này do `engine/scripts/do_tin_kb.py` dựng từ sổ `engine/app/kb/do_tin.py` — **không sửa tay**. Nội bộ, không hiện",
          "> cho người dùng. Mức nói \"lời này truy được về đâu\", KHÔNG phải \"đã thẩm định\" (thẩm định là việc của chuyên gia).",
          "", "## Thang năm mức", ""]
    ra += [f"- **{do_tin.TEN_MUC[m]}** (`{m}`)" for m in do_tin.THANG]
    ra += ["", "## Số tệp theo mảng", "", "| Mảng | " + " | ".join(do_tin.TEN_MUC[m] for m in do_tin.THANG) + " |",
           "|---|" + "---|" * len(do_tin.THANG)]
    for ma, ten in MANG.items():
        ra.append(f"| {ten} | " + " | ".join(str(dem[(ma, m)] or "") for m in do_tin.THANG) + " |")
    ra += ["", "## Phần đã có nguyên văn đối chiếu (test khoá)", "", "| Tệp | Phần | Kho nguồn | Test | Ghi chú |", "|---|---|---|---|---|"]
    for d in b:
        if d["muc"] == "nguyen_van":
            ra.append(f"| `{d['tep']}` | {d['phan'] or '(cả tệp)'} | `{d['kho']}` | `{d['test'].split('::')[1]}` | {d['ghi_chu']} |")
    ra += ["", "## Toàn bộ sổ", "", "| Mảng | Tệp | Phần | Mức | Ghi chú |", "|---|---|---|---|---|"]
    for ma, ten in MANG.items():
        for d in b:
            if d["mang"] == ma:
                ra.append(f"| {ten} | `{d['tep']}` | {d['phan'] or ''} | {do_tin.TEN_MUC[d['muc']]} | {d['ghi_chu']} |")
    ra += ["", "## Cách nâng mức một phần", "",
           "1. Nạp nguyên văn cổ thư công cộng vào `engine/fixtures/nguon/` (bộ nạp trong `engine/scripts/nap_*.py`).",
           "2. Thêm trường trích vào KB và viết test \"câu trích là chuỗi con nguyên văn\".",
           "3. Sửa sổ `do_tin.py` (ghi tên kho + tên test) rồi chạy lại script này.", ""]
    return "\n".join(ra)


if __name__ == "__main__":
    DOC.write_text(dung(), "utf-8")
    print("đã ghi", DOC)
