# -*- coding: utf-8 -*-
"""CLI chạy offline pipeline chuyển thể Hán/Trung → Tiếng Việt tự nhiên ("Nature Meaning").

Đọc từ kho cổ thư `projects/*-kb/data/*.sqlite` (read-only), lọc theo allowlist cổ thư,
và xuất ra tệp staging `.nhap.json` (kèm `.loi.json` cho mục không qua kiểm) — TUYỆT ĐỐI
không ghi đè thẳng vào KB live trong `app/kb/data/`.

Ví dụ ước lượng chi phí trước khi chạy thật (không gọi API):
    PYTHONPATH=. .venv/bin/python scripts/chuyen_han_viet.py \
        --db ../../bazi-kb/data/bazi_kb.sqlite --bang bazi_rules --thu 20 --uoc-luong

Ví dụ chạy thật 20 mục đầu (cần OPENROUTER_API_KEY):
    OPENROUTER_API_KEY=… PYTHONPATH=. .venv/bin/python scripts/chuyen_han_viet.py \
        --db ../../bazi-kb/data/bazi_kb.sqlite --bang bazi_rules --thu 20 \
        --ra /tmp/bazi_rules.nhap.json
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from app.chuyen_ngu import han_viet


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Chuyển thể cổ thư Hán/Trung sang Tiếng Việt tự nhiên (staging .nhap.json)")
    ap.add_argument("--db", required=True, help="Đường dẫn tới tệp .sqlite (read-only)")
    ap.add_argument("--bang", required=True, help="Tên bảng trong SQLite (vd: bazi_rules, sections, sihua_entries)")
    ap.add_argument("--nguon", nargs="*", default=None, help="Khoá chặt danh sách book_code/source_code cổ thư")
    ap.add_argument("--thu", type=int, default=20, help="Số mục đọc (mặc định 20)")
    ap.add_argument("--offset", type=int, default=0, help="Bỏ qua N mục đầu")
    ap.add_argument("--uoc-luong", action="store_true", help="Chỉ ước lượng số lô, token và chi phí USD (không gọi LLM)")
    ap.add_argument("--khong-kiem-dinh", action="store_true", help="Bỏ qua lượt 3 (chỉ chạy 2 lượt)")
    ap.add_argument("--ra", default=None, help="Đường dẫn tệp staging .nhap.json đầu ra")
    a = ap.parse_args(argv)

    muc = han_viet.doc_sqlite(
        a.db,
        a.bang,
        limit=a.thu,
        offset=a.offset,
        allow_sources=tuple(a.nguon) if a.nguon else None,
        only_classical=True,
    )
    kiem_dinh = not a.khong_kiem_dinh
    uoc = han_viet.uoc_luong_chi_phi(muc, kiem_dinh=kiem_dinh)
    print(json.dumps(uoc, ensure_ascii=False, indent=2))
    if a.uoc_luong or not muc:
        return 0

    from app.narrative.ai_goi import goi_chat  # noqa: PLC0415

    mo_hinh = os.environ.get("CHUYEN_NGU_MODEL")

    def goi(messages, **kw):
        return goi_chat(messages, mo_hinh=mo_hinh, nho=False, tru_luot=False, het_gio=120, **kw)

    kq = han_viet.chuyen_han_viet(muc, goi=goi, kiem_dinh=kiem_dinh)
    ra = Path(a.ra) if a.ra else Path("staging") / f"{Path(a.db).stem}_{a.bang}.nhap.json"
    ra.parent.mkdir(parents=True, exist_ok=True)
    ra.write_text(json.dumps(kq["ket_qua"], ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    ra.with_suffix(".loi.json").write_text(json.dumps(kq["loi"], ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{kq['so']['qua']}/{kq['so']['tong']} mục qua kiểm ({kq['so']['kiem_dinh']}) → {ra}")
    for k, l in list(kq["loi"].items())[:20]:
        print(" ✗", k, [x["ma"] for x in l])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
