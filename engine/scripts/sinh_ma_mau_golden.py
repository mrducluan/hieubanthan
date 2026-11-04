# -*- coding: utf-8 -*-
"""EN-6 — chụp toàn bộ mã kiểm chứng báo cáo đời sống 6 mảng → fixtures/golden/ma_mau_doi_song.json.

    cd engine && .venv/bin/python scripts/sinh_ma_mau_golden.py

Chỉ chạy lại khi CỐ Ý đổi mã (mất liên kết phiếu "Đúng với mình" cũ) — ghi rõ lý do trong PR. Đầu vào: tests/_ma_mau_dau_vao.py."""
from __future__ import annotations

import json
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from tests._ma_mau_dau_vao import GOLDEN, chup  # noqa: E402

if __name__ == "__main__":
    d = chup()
    (GOLDEN / "ma_mau_doi_song.json").write_text(
        json.dumps({"_ghi_chu": "EN-6 — mã kiểm chứng báo cáo đời sống (khoá phiếu người dùng). Sinh: scripts/sinh_ma_mau_golden.py",
                    **d}, ensure_ascii=False, indent=0), encoding="utf-8")
    print({k: len(v) for k, v in d.items()})
