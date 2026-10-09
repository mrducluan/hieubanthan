# -*- coding: utf-8 -*-
"""EEAT-1 — sổ thẩm định trang kiến thức (app/kb/data/tham_dinh.json).

Chỉ đánh dấu trang chuyên gia ĐÃ đọc và duyệt (sửa xong nội dung KB nếu cần). Trang đánh dấu sẽ hiện
"Đức Luân thẩm định · ngày", schema reviewedBy, bỏ nhãn "chờ thẩm định".

  python scripts/tham_dinh.py danh-dau <url hoặc slug> [...]  [--nguoi duc-luan] [--ngay 2026-10-10] [--ghi-chu "…"]
  python scripts/tham_dinh.py bo <url hoặc slug> [...]
  python scripts/tham_dinh.py hang-doi [--n 30]               # trang chưa duyệt theo thứ tự ưu tiên
  python scripts/tham_dinh.py thong-ke

Ví dụ: python scripts/tham_dinh.py danh-dau https://hieuban.com/kien-thuc/tu-vi/sao-tu-vi que-1-can
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.kb import tham_dinh as td  # noqa: E402
from app.kb import trang  # noqa: E402


def _tim(chuoi: str) -> tuple[str, str]:
    slug = chuoi.rstrip("/").split("/")[-1].removesuffix(".md")
    khop = [(t["loai"], t["slug"]) for t in trang.danh_sach() if t["slug"] == slug]
    if len(khop) != 1:
        raise SystemExit(f"Không xác định được trang '{chuoi}' ({len(khop)} trang trùng slug)")
    return khop[0]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="lenh", required=True)
    d = sub.add_parser("danh-dau")
    d.add_argument("trang", nargs="+")
    d.add_argument("--nguoi", default=td.CHU_BIEN)
    d.add_argument("--ngay", default=dt.date.today().isoformat())
    d.add_argument("--ghi-chu", default="")
    b = sub.add_parser("bo")
    b.add_argument("trang", nargs="+")
    h = sub.add_parser("hang-doi")
    h.add_argument("--n", type=int, default=30)
    sub.add_parser("thong-ke")
    a = ap.parse_args()

    so = td._doc_so()
    if a.lenh in ("danh-dau", "bo"):
        for c in a.trang:
            loai, slug = _tim(c)
            if a.lenh == "danh-dau":
                td.danh_dau(so, loai, slug, a.nguoi, a.ngay, a.ghi_chu)
            else:
                td.bo(so, loai, slug)
            print(f"{a.lenh}: {loai}/{slug}")
        td.ghi(so)
    elif a.lenh == "hang-doi":
        for t in td.hang_doi()[: a.n]:
            print(f"{t['loai']:<12} {t['slug']:<40} {t['tieu_de']}")
    else:
        ds = trang.danh_sach()
        dem = collections.Counter((t["loai"], t["trang_thai"]) for t in ds)
        for loai in trang.LOAI:
            print(f"{loai:<12} đã duyệt {dem[(loai, 'da_duyet')]:>4} / {dem[(loai, 'da_duyet')] + dem[(loai, 'nhap_ai')]:>4}")
        print(f"Tổng: {sum(1 for t in ds if t['trang_thai'] == 'da_duyet')}/{len(ds)} trang đã duyệt")


if __name__ == "__main__":
    main()
