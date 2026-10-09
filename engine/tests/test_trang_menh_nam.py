# -*- coding: utf-8 -*-
"""SEO-J — 76 trang "Sinh năm X mệnh gì" (1950–2025): can chi, mệnh nạp âm + nghĩa hình tượng (KB nháp AI),
ngũ hành sinh/khắc, màu dùng theo ngũ hành (ứng dụng dân gian, KB battu ngu_hanh), tuổi tam hợp / lục hợp /
lục xung / tứ hành xung (địa chi), cung phi nam và nữ, mốc đầu năm (Tết Việt, Lập xuân).

Tính tay 1990: Canh Ngọ — Lộ Bàng Thổ (hành Thổ). Hoả sinh Thổ, Thổ sinh Kim, Mộc khắc Thổ, Thổ khắc Thuỷ.
Tam hợp Dần–Ngọ–Tuất; lục hợp Mùi; lục xung Tý; tứ hành xung Tý–Ngọ–Mão–Dậu. Cung phi nam Khảm, nữ Cấn.
Tết Canh Ngọ: 27/01/1990; Lập xuân: 04/02/1990.
"""
from __future__ import annotations

import pytest

from app.kb import trang


def test_so_luong_va_slug():
    ds = [t for t in trang.danh_sach() if t["loai"] == "menh_nam"]
    assert len(ds) == 76
    assert {"sinh-nam-1950-menh-gi", "sinh-nam-1990-menh-gi", "sinh-nam-2025-menh-gi"} <= {t["slug"] for t in ds}
    assert trang.lay("menh_nam", "sinh-nam-1949-menh-gi") is None


def test_1990_tinh_tay():
    t = trang.lay("menh_nam", "sinh-nam-1990-menh-gi")
    assert t["tieu_de"].startswith("Sinh năm 1990 mệnh gì")
    assert "Canh Ngọ" in t["tra_loi_nhanh"] and "Lộ Bàng Thổ" in t["tra_loi_nhanh"]
    muc = {m["tieu_de"]: m for m in t["muc"]}
    sk = " ".join(next(m for k, m in muc.items() if k.startswith("Ngũ hành"))["danh_sach"])
    assert "Hỏa sinh Thổ" in sk and "Thổ sinh Kim" in sk and "Mộc khắc Thổ" in sk and "Thổ khắc Thủy" in sk
    tuoi = " ".join(next(m for k, m in muc.items() if k.startswith("Tuổi hợp"))["danh_sach"])
    assert "Dần, Ngọ, Tuất" in tuoi and "Lục hợp: Mùi" in tuoi and "Lục xung: Tý" in tuoi
    assert "Tý, Ngọ, Mão, Dậu" in tuoi
    cp = " ".join(next(m for k, m in muc.items() if k.startswith("Cung phi"))["danh_sach"])
    assert "Nam" in cp and "Khảm" in cp and "Nữ" in cp and "Cấn" in cp
    moc = next(m for k, m in muc.items() if k.startswith("Sinh đầu năm"))["doan"]
    assert "27/01/1990" in moc and "04/02/1990" in moc and "Kỷ Tỵ" in moc       # trước Tết: năm Kỷ Tỵ 1989
    assert t["minh_hoa"] == {"kieu": "menh", "hanh": "Thổ", "nap_am": "Lộ Bàng Thổ", "han": "路旁土", "can_chi": "Canh Ngọ"}
    assert t["lien_ket_ngoai"] == [{"duong": "/phong-thuy/tuoi-1990-nam", "ten": "Nam 1990 hợp hướng nào"},
                                   {"duong": "/phong-thuy/tuoi-1990-nu", "ten": "Nữ 1990 hợp hướng nào"}]


def test_nap_am_kb_du_30():
    from app.kb import battu_kb
    d = battu_kb._d()["nap_am"]
    assert len(d) == 30
    for ten, m in d.items():
        assert m["hinh_tuong"] and m["tinh_chat"] and m["mat_toi"] and m["cau_tu_soi"].endswith("?"), ten


@pytest.mark.parametrize("nam", [1950, 1975, 2000, 2025])
def test_day_du(nam):
    t = trang.lay("menh_nam", f"sinh-nam-{nam}-menh-gi")
    assert t["tra_loi_nhanh"] and len(t["muc"]) >= 5 and len(t["hoi_dap"]) >= 4 and t["nguon"]
    assert len(t["mo_ta"]) <= 160 and len(t["tieu_de"]) <= 70
    assert t["trang_thai"] == "nhap_ai"


def test_hai_nam_cung_nap_am_van_khac_nhau():
    a, b = trang.lay("menh_nam", "sinh-nam-1990-menh-gi"), trang.lay("menh_nam", "sinh-nam-1991-menh-gi")
    assert "Lộ Bàng Thổ" in a["tra_loi_nhanh"] and "Lộ Bàng Thổ" in b["tra_loi_nhanh"]
    assert a["tra_loi_nhanh"] != b["tra_loi_nhanh"]                    # can chi, tuổi hợp, cung phi khác
