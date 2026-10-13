# -*- coding: utf-8 -*-
"""MH-1 — dữ liệu hình minh hoạ cho trang kiến thức (web chỉ vẽ, engine quyết định vẽ gì).

Golden tính tay:
- Quẻ 1 Càn = 6 hào dương; quẻ 2 Khôn = 6 hào âm; quẻ 11 Thái = nội Càn (dưới) + ngoại Khôn (trên) → 1,1,1,0,0,0
  (hào 1 → hào 6); quẻ 63 Ký Tế = Ly dưới, Khảm trên → 1,0,1,0,1,0.
- Cung: thứ tự 12 cung đi theo vòng (Mệnh, Huynh Đệ, Phu Thê, …, Phụ Mẫu); cung Tài Bạch đứng thứ 5 (chỉ số 4).
- Thập thần so với nhật chủ: Tỷ Kiên = đồng hành cùng âm dương; Thương Quan = ta sinh, khác âm dương; Chính Quan = khắc ta,
  khác âm dương; Thiên Ấn = sinh ta, cùng âm dương.
- Nhật chủ Giáp = Mộc dương; Quý = Thủy âm.
- Số 7 → 7 đỉnh; số cái 11/22/33 đánh dấu số cái.
"""
from __future__ import annotations

from app.kb import trang


def _mh(loai: str, slug: str) -> dict:
    t = trang.lay(loai, slug)
    assert t is not None, slug
    return t["minh_hoa"]


def test_que():
    assert _mh("que", "que-1-can") == {"kieu": "que", "so": 1, "hao": [1, 1, 1, 1, 1, 1]}
    assert _mh("que", "que-2-khon")["hao"] == [0, 0, 0, 0, 0, 0]
    t = next(s for k, s in trang._ds_que() if k == "11")
    assert _mh("que", t)["hao"] == [1, 1, 1, 0, 0, 0]
    t = next(s for k, s in trang._ds_que() if k == "63")
    assert _mh("que", t)["hao"] == [1, 0, 1, 0, 1, 0]


def test_so():
    assert _mh("so", "so-7") == {"kieu": "so", "so": 7, "so_cai": False, "so_goc": 7}
    assert _mh("so", "so-22")["so_cai"] is True and _mh("so", "so-22")["so_goc"] == 4


def test_cung():
    m = _mh("cung", "cung-tai-bach")
    assert m["kieu"] == "cung" and m["chi_so"] == 4 and len(m["vong"]) == 12
    assert m["vong"][0] == "Mệnh" and m["vong"][4] == "Tài Bạch"


def test_sao():
    m = _mh("sao", "sao-tu-vi")
    assert m["kieu"] == "sao" and m["ten"] == "Tử Vi" and m["ten_han"] and m["ngu_hanh"]


def test_thap_than():
    def q(ten_slug):
        return _mh("thap_than", ten_slug)
    ds = dict(trang._ds_thap_than())
    assert q(ds["Tỷ Kiên"]) == {"kieu": "thap_than", "ten": "Tỷ Kiên", "quan_he": "dong_hanh", "cung_am_duong": True}
    assert q(ds["Thương Quan"])["quan_he"] == "ta_sinh" and q(ds["Thương Quan"])["cung_am_duong"] is False
    assert q(ds["Chính Quan"])["quan_he"] == "khac_ta" and q(ds["Chính Quan"])["cung_am_duong"] is False
    assert q(ds["Thiên Ấn"])["quan_he"] == "sinh_ta" and q(ds["Thiên Ấn"])["cung_am_duong"] is True
    assert q(ds["Chính Tài"])["quan_he"] == "ta_khac"


def test_nhat_chu():
    ds = dict(trang._ds_nhat_chu())
    assert _mh("nhat_chu", ds["Giáp"]) == {"kieu": "nhat_chu", "can": "Giáp", "hanh": "Mộc", "duong": True}
    assert _mh("nhat_chu", ds["Quý"])["hanh"] == "Thủy" and _mh("nhat_chu", ds["Quý"])["duong"] is False


def test_moi_trang_deu_co_minh_hoa():
    for m in trang.danh_sach():
        kieu = trang.lay(m["loai"], m["slug"])["minh_hoa"]["kieu"]
        # cụm thần số SEO-G dùng lại hình con số (cặp số có hình riêng)
        assert kieu == {"nghe": "so", "tinh_yeu": "so", "nam_ca_nhan": "so", "no_nghiep": "so", "so_kep": "so",
                        "menh_nam": "menh"}.get(m["loai"], m["loai"])   # SEO-J: hình mệnh nạp âm
