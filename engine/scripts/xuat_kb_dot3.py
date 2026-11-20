# -*- coding: utf-8 -*-
"""Đợt 3 — (ĐÃ NGỪNG) xuất KB Tử vi Lương phái (672 tượng) & Trung Châu phái (60 tinh hệ) từ SQLite cục bộ.

Chủ dự án quyết (2026-11-20, PR #320 — phương án C): hai sách này là sách HIỆN ĐẠI CÒN BẢN QUYỀN (Lương Nhược Du, Vương Đình
Chi) → repo công khai KHÔNG giữ nguyên văn hay bản dịch sát. Hai tệp `tuvi_phi_hoa_luong_672.json` và
`tuvi_trung_chau_60_tinh_he.json` nay là lời TÓM Ý của ban biên tập (trường `y_chinh`, `dieu_kien`, `linh_vuc`, `huong`,
`trang`), sửa tay qua PR. Bản xuất cũ chép chữ Hán nguyên văn nên không được chạy lại; script giữ chỗ để ai mở ra biết lý do.
"""
from __future__ import annotations

import sys


def main() -> int:
    print("xuat_kb_dot3: đã ngừng — hai tệp KB Lương / Trung Châu là lời tóm ý do ban biên tập viết, sửa tay qua PR "
          "(không xuất lại nguyên văn sách còn bản quyền).", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
