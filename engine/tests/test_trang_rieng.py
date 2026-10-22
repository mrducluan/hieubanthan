# -*- coding: utf-8 -*-
"""SEO-K (chủ dự án duyệt 2026-10-21) — trang lập trình phải có đủ phần RIÊNG.

- Khối dùng chung (tính chất sao, nghĩa cung, tam phương) thành một câu + link sang trang gốc, không chép nguyên đoạn.
- Trang "sao ở cung" / "Hoá ở cung" thêm lời đời thường riêng từng ô sao × cung (KB tuvi_doi_song_kb.json — đã có, nháp AI).
- 12 vị trí theo chi (giống nhau ở 12 cung của cùng một sao) dời về trang sao.
- Trang có phần riêng < 20 % (cụm 6 từ chỉ có ở trang đó trong cùng họ) và chưa thẩm định → index=false (vẫn giữ link, .md).
"""
from __future__ import annotations

import statistics

from app.kb import trang
from app.kb import do_rieng


def test_sao_cung_co_loi_doi_thuong_rieng():
    t = trang.lay("sao_cung", "tu-vi-cung-menh")
    tieu = [m["tieu_de"] for m in t["muc"]]
    assert "Khi Tử Vi sáng ở cung Mệnh" in tieu and "Khi Tử Vi hãm ở cung Mệnh" in tieu
    sang = next(m for m in t["muc"] if m["tieu_de"] == "Khi Tử Vi sáng ở cung Mệnh")
    assert any("chốt hướng đi" in d for d in sang["danh_sach"])
    # khối chung chỉ còn một câu + link sang trang gốc
    xem = [x for m in t["muc"] for x in m.get("xem_them", [])]
    assert {"loai": "cung", "slug": "cung-menh"} in [{k: x[k] for k in ("loai", "slug")} for x in xem]
    assert {"loai": "sao", "slug": "sao-tu-vi"} in [{k: x[k] for k in ("loai", "slug")} for x in xem]
    assert all(x["tieu_de"] for x in xem)
    assert not any(m["tieu_de"].endswith("theo từng vị trí") for m in t["muc"])


def test_tam_phuong_tro_sang_cung_cung_sao():
    t = trang.lay("sao_cung", "that-sat-cung-menh")
    tp = next(m for m in t["muc"] if m["tieu_de"].startswith("Tam phương tứ chính"))
    slugs = {x["slug"] for x in tp["xem_them"]}
    assert slugs == {"that-sat-cung-thien-di", "that-sat-cung-tai-bach", "that-sat-cung-quan-loc"}


def test_tat_ach_co_cau_khong_thay_bac_si():
    t = trang.lay("sao_cung", "thai-am-cung-tat-ach")
    chu = " ".join(" ".join(m.get("danh_sach") or []) + (m.get("doan") or "") for m in t["muc"])
    assert "không thay lời bác sĩ" in chu


def test_trang_sao_co_12_vi_tri():
    s = trang.lay("sao", "sao-that-sat")
    m = next(m for m in s["muc"] if m["tieu_de"] == "Thất Sát ở 12 chi: độ sáng và sao đi cùng")
    assert len(m["danh_sach"]) == 12
    ty = next(d for d in m["danh_sach"] if d.startswith("Tý"))
    assert "Vũ Khúc" in ty and "Thiên Phủ" in ty          # cung đối diện (Ngọ) có Vũ Khúc + Thiên Phủ


def test_hoa_cung_co_loi_doi_thuong():
    t = trang.lay("hoa_cung", "hoa-loc-cung-menh")
    m = next(m for m in t["muc"] if m["tieu_de"] == "Hoá Lộc ở cung Mệnh trong đời thường")
    assert any("dễ mến" in d for d in m["danh_sach"])


def test_ty_le_rieng_tang_va_chinh_sach_index():
    tl = do_rieng.ty_le()
    for loai, toi_thieu in (("sao_cung", 0.30), ("hoa_cung", 0.22), ("menh_nam", 0.30)):
        r = [v for (l, _), v in tl.items() if l == loai]
        assert statistics.median(r) >= toi_thieu, loai      # trước SEO-K: 0,09 / 0,10 / 0,19
    ds = trang.danh_sach()
    for t in ds:
        thap = tl.get((t["loai"], t["slug"]), 1.0) < do_rieng.NGUONG
        if thap and t["trang_thai"] != "da_duyet":
            assert t["index"] is False, t["slug"]
        if not thap:
            assert t["index"] is True, t["slug"]


def test_trang_noindex_van_lay_duoc():
    tl = do_rieng.ty_le()
    thap = [k for k, v in tl.items() if v < do_rieng.NGUONG]
    for loai, slug in thap[:3]:
        assert trang.lay(loai, slug)["index"] in (False, True)
