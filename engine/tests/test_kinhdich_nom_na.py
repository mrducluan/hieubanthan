# -*- coding: utf-8 -*-
"""KD-NN — "Hiểu đơn giản" (trước gọi "Nói nôm na"): mỗi quẻ một hình ảnh đời thường, mỗi hào một tình huống cụ thể.
Lời giải nghĩa cho người không học Dịch; đi kèm (không thay) nguyên văn + dịch nghĩa. Test viết TRƯỚC.
"""
from __future__ import annotations

import pytest

from app.hoidap import kinhdich as hd
from app.kb import kinhdich_kb as kb
from app.kb import trang
from app.narrative import hoi_van

CAM_THEM = ["bệnh", "thuốc", "chữa", "có thai", "mang thai", "xổ số", "lô đề", "chết"]


def _tat_ca():
    for so in range(1, 65):
        q = kb.que_van(so)
        yield f"quẻ {so}", q["nom_na"]
        for h in q["hao"]:
            yield f"quẻ {so} hào {h['vi_tri']}", h["nom_na"]
        if q.get("dung"):
            yield f"quẻ {so} dụng", q["dung"]["nom_na"]


def test_du_64_que_384_hao_2_dung():
    ds = list(_tat_ca())
    assert len(ds) == 64 + 384 + 2
    for ten, v in ds:
        assert isinstance(v, str) and 25 <= len(v) <= 400, ten


def test_que_co_hinh_anh_va_nom_na():
    for so in range(1, 65):
        v = kb.que_van(so)["nom_na"]
        assert v.startswith("Hình ảnh:") and "Hiểu đơn giản:" in v, so


@pytest.mark.parametrize("ten,v", list(_tat_ca()))
def test_khong_giong_phan_quyet_khong_y_te(ten, v):
    thap = v.lower()
    for c in hoi_van.CAM + CAM_THEM:
        assert c not in thap, f"{ten}: '{c}'"


def test_hao_khong_trung_nhau():
    ds = [v for _, v in _tat_ca()]
    assert len(set(ds)) == len(ds)


def test_tra_loi_co_noi_nom_na_cho_hao_dong():
    # 1 hào động (Càn sơ cửu) → lời chủ là hào đó, kèm nôm na
    kq = hd.tra_loi("Tôi có nên đổi việc lúc này không?", gia_tri_hao=[9, 7, 7, 7, 7, 7])
    assert "Hiểu đơn giản: " + kb.hao(1, 1)["nom_na"] in kq["cau_tra_loi"]
    assert "Hiểu đơn giản: " + kb.que_van(1)["nom_na"].split("Hiểu đơn giản: ")[1] in kq["cau_tra_loi"]


def test_trang_que_co_muc_nom_na():
    t = trang.lay("que", "que-1-can")
    tieu_de = [m["tieu_de"] for m in t["muc"]]
    assert "Hiểu đơn giản" in tieu_de
    m = next(m for m in t["muc"] if m["tieu_de"] == "Sáu hào (hào từ)")
    assert any("Hiểu đơn giản:" in d for d in m["danh_sach"])
