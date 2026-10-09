# -*- coding: utf-8 -*-
"""DX-1 — áp kết quả từ Phòng duyệt (trang duyệt riêng của chủ biên) vào sổ thẩm định.

Phòng duyệt lưu mỗi bài một bản ghi {k: "loai/slug", kq: "dat"|"can_sua", ghi_chu, goc_nhin, luc}. Em xuất các bản ghi
ra thư mục JSON (ArtifactData list … out_dir) rồi chạy:

  python scripts/ap_duyet.py <thư mục chứa *.json> [--nguoi duc-luan]

- kq "dat"      → danh_dau(ngày = ngày anh bấm, goc_nhin nếu có; kiểm luật nội dung như CLI).
- kq "can_sua"  → KHÔNG đánh dấu; in danh sách + ghi chú để sửa KB, anh duyệt lại sau.
Bài đã đánh dấu mà nay anh bỏ dấu không tự gỡ — gỡ bằng `tham_dinh.py bo`.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.kb import tham_dinh as td  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("thu_muc")
    ap.add_argument("--nguoi", default=td.CHU_BIEN)
    a = ap.parse_args()
    so = td._doc_so()
    dat, sua, loi = [], [], []
    for f in sorted(Path(a.thu_muc).rglob("*.json")):
        d = json.loads(f.read_text("utf-8"))
        d = d.get("data", d)                       # chấp nhận cả bản ghi bọc {data: …}
        if not isinstance(d, dict) or "k" not in d or d.get("kq") not in ("dat", "can_sua"):
            continue
        loai, slug = d["k"].split("/", 1)
        if d["kq"] == "can_sua":
            sua.append((d["k"], d.get("ghi_chu", "")))
            continue
        try:
            td.danh_dau(so, loai, slug, a.nguoi, d["luc"][:10], goc_nhin=d.get("goc_nhin", ""))
            dat.append(d["k"])
        except ValueError as e:
            loi.append((d["k"], str(e)))
    td.ghi(so)
    print(f"Đã thẩm định: {len(dat)} bài")
    for k, g in sua:
        print(f"CẦN SỬA  {k}: {g}")
    for k, e in loi:
        print(f"LỖI      {k}: {e}")


if __name__ == "__main__":
    main()
