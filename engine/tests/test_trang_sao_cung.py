# -*- coding: utf-8 -*-
"""SEO-H — 168 trang "sao X ở cung Y" (14 chính tinh × 12 cung), dựng từ KB Tử vi + phép tính vị trí sao.

Không sinh nghĩa mới: lời luận lấy từ tuvi_kb.json (sao_cung, chinh_tinh, cung, tu_hoa_cung). Phần riêng của mỗi
trang được TÍNH: độ sáng Nam phái theo chi (tuvi_do_sang_vn), sao đồng cung / xung chiếu (tuvi_vi_tri), cung xung
chiếu + tam hợp của cung Y, năm can nào sao hoá gì (bảng tứ hoá iztro).
"""
from __future__ import annotations

import pytest

from app.kb import trang


def _ds():
    return [t for t in trang.danh_sach() if t["loai"] == "sao_cung"]


def test_so_luong_va_slug():
    ds = _ds()
    assert len(ds) == 168 and len({t["slug"] for t in ds}) == 168
    assert {"thai-am-cung-phu-the", "tu-vi-cung-menh", "that-sat-cung-quan-loc"} <= {t["slug"] for t in ds}


def test_trang_that_sat_menh():
    t = trang.lay("sao_cung", "that-sat-cung-menh")
    assert t["tieu_de"].startswith("Thất Sát ở cung Mệnh")
    # SEO-K: 12 vị trí theo chi dời về trang sao (tính tay: Thất Sát ở Tý một mình, đối diện Ngọ có Vũ Khúc + Thiên Phủ)
    theo_chi = next(m for m in trang.lay("sao", "sao-that-sat")["muc"] if m["tieu_de"].endswith("độ sáng và sao đi cùng"))["danh_sach"]
    ty = next(d for d in theo_chi if d.startswith("Tý"))
    assert "Vũ Khúc" in ty and "Thiên Phủ" in ty
    # cung Mệnh xung chiếu Thiên Di, tam hợp Tài Bạch + Quan Lộc
    tp = next(m for m in t["muc"] if m["tieu_de"].startswith("Tam phương tứ chính"))
    assert all(c in (tp.get("doan") or "") + " ".join(tp.get("danh_sach") or []) for c in ("Thiên Di", "Tài Bạch", "Quan Lộc"))
    assert t["minh_hoa"] == {"kieu": "sao_cung", "ten": "Thất Sát", "ten_han": "七殺", "ngu_hanh": "Kim",
                             "chi_so": 0, "vong": t["minh_hoa"]["vong"]}
    assert t["trang_thai"] == "nhap_ai"


def test_tu_hoa_chi_khi_sao_co_hoa():
    lien = trang.lay("sao_cung", "liem-trinh-cung-quan-loc")
    hoa = next(m for m in lien["muc"] if m["tieu_de"].startswith("Khi Liêm Trinh hoá"))
    s = " ".join(hoa["danh_sach"])
    assert "Giáp" in s and "Lộc" in s and "Bính" in s and "Kỵ" in s           # Giáp: Liêm Lộc · Bính: Liêm Kỵ
    sat = trang.lay("sao_cung", "that-sat-cung-quan-loc")
    assert not any(m["tieu_de"].startswith("Khi Thất Sát hoá") for m in sat["muc"])   # Thất Sát không hoá


def test_hoi_dap_dong_cung_gom_nhom():
    t = trang.lay("sao_cung", "that-sat-cung-menh")
    dap = next(h["dap"] for h in t["hoi_dap"] if "đi cùng sao nào" in h["hoi"])
    assert "Tử Vi" in dap and "Liêm Trinh" in dap and "Vũ Khúc" in dap and "một mình" in dap


@pytest.mark.parametrize("slug", ["tu-vi-cung-menh", "thien-phu-cung-tai-bach", "pha-quan-cung-phu-the"])
def test_day_du(slug):
    t = trang.lay("sao_cung", slug)
    assert t["tra_loi_nhanh"] and len(t["muc"]) >= 5 and len(t["hoi_dap"]) >= 3 and t["nguon"]
    assert len(t["mo_ta"]) <= 160 and len(t["tieu_de"]) <= 70
    loai = {l["loai"] for l in t["lien_quan"]}
    assert {"sao", "cung", "sao_cung"} <= loai


def test_khong_trung_noi_dung_giua_hai_trang_cung_sao():
    # cùng một sao, hai cung khác nhau → phần tính riêng (theo từng vị trí, tam phương) phải khác
    a, b = trang.lay("sao_cung", "thai-am-cung-menh"), trang.lay("sao_cung", "thai-am-cung-phu-the")
    ma = {m["tieu_de"]: m for m in a["muc"]}
    mb = {m["tieu_de"]: m for m in b["muc"]}
    assert ma["Khi Thái Âm sáng ở cung Mệnh"]["danh_sach"] != mb["Khi Thái Âm sáng ở cung Phu Thê"]["danh_sach"]
    assert ma["Tam phương tứ chính của cung Mệnh"]["xem_them"] != mb["Tam phương tứ chính của cung Phu Thê"]["xem_them"]


def test_trang_sao_va_cung_tro_toi_trang_con():
    sao = trang.lay("sao", "sao-thai-am")
    assert sao["trang_con"]["tieu_de"] == "Thái Âm ở từng cung"
    assert len(sao["trang_con"]["ds"]) == 12 and sao["trang_con"]["ds"][2]["tieu_de"] == "Thái Âm ở cung Phu Thê"
    cung = trang.lay("cung", "cung-phu-the")
    assert len(cung["trang_con"]["ds"]) == 14
    assert all(trang.lay(l["loai"], l["slug"]) for l in sao["trang_con"]["ds"] + cung["trang_con"]["ds"])
