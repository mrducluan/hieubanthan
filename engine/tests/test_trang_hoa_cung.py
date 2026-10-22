# -*- coding: utf-8 -*-
"""SEO-I — 48 trang "Hoá X ở cung Y" (4 tứ hoá × 12 cung), dựng từ KB Tử vi + bảng tứ hoá theo năm can.

Phần riêng của mỗi trang được TÍNH: năm can nào sao nào mang hoá này (bảng iztro), trỏ sang trang "sao ở cung"
của đúng sao đó ở đúng cung; cung xung chiếu + tam hợp của cung Y. Lời luận lấy từ KB (tu_hoa, tu_hoa_cung, cung).
"""
from __future__ import annotations

import pytest

from app.kb import trang


def test_so_luong_va_slug():
    ds = [t for t in trang.danh_sach() if t["loai"] == "hoa_cung"]
    assert len(ds) == 48 and len({t["slug"] for t in ds}) == 48
    assert {"hoa-ky-cung-tai-bach", "hoa-loc-cung-menh", "hoa-khoa-cung-quan-loc"} <= {t["slug"] for t in ds}


def test_hoa_ky_tai_bach():
    t = trang.lay("hoa_cung", "hoa-ky-cung-tai-bach")
    assert t["tieu_de"].startswith("Hoá Kỵ ở cung Tài Bạch")
    nam = next(m for m in t["muc"] if m["tieu_de"].startswith("Năm sinh nào"))["danh_sach"]
    assert len(nam) == 10                                                  # 10 thiên can, mỗi can một sao hoá Kỵ
    assert nam[0].startswith("Năm Giáp: Thái Dương hoá Kỵ")
    assert any(x.startswith("Năm Bính: Liêm Trinh") for x in nam)
    # trỏ sang trang sao ở cung — chỉ cho chính tinh (Văn Xương/Văn Khúc không có trang)
    con = t["trang_con"]["ds"]
    assert {"loai": "sao_cung", "slug": "thai-duong-cung-tai-bach"} in [{k: c[k] for k in ("loai", "slug")} for c in con]
    assert all(trang.lay(c["loai"], c["slug"]) for c in con)
    tp = next(m for m in t["muc"] if m["tieu_de"].startswith("Tam phương tứ chính"))
    assert "Phúc Đức" in tp["doan"] and "hoa-ky-cung-phuc-duc" in {x["slug"] for x in tp["xem_them"]}                         # Tài Bạch xung Phúc Đức
    assert t["minh_hoa"]["kieu"] == "hoa_cung" and t["minh_hoa"]["hoa"] == "Kỵ"


@pytest.mark.parametrize("slug", ["hoa-loc-cung-phu-the", "hoa-quyen-cung-quan-loc", "hoa-khoa-cung-tu-nu"])
def test_day_du(slug):
    t = trang.lay("hoa_cung", slug)
    assert t["tra_loi_nhanh"] and len(t["muc"]) >= 4 and len(t["hoi_dap"]) >= 3 and t["nguon"]
    assert len(t["mo_ta"]) <= 160 and len(t["tieu_de"]) <= 70
    assert {"cung", "hoa_cung"} <= {l["loai"] for l in t["lien_quan"]}


def test_trang_cung_tro_toi_4_hoa():
    c = trang.lay("cung", "cung-tai-bach")
    assert len(c["trang_con_hoa"]["ds"]) == 4
