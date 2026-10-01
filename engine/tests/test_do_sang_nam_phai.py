# -*- coding: utf-8 -*-
"""TV-NP — độ sáng 14 chính tinh theo lối Việt (Nam phái). Test viết TRƯỚC.

Đối chứng độc lập: lá số một trang tử vi Việt chủ dự án gửi (19/03/1997 00:30 nam) ghi
Tử Vi (B) Mão, Tham Lang (H) Mão, Thiên Tướng (Đ) Tỵ, Thiên Lương (M) Ngọ, Liêm Trinh (Đ) Mùi,
Thất Sát (Đ) Mùi, Cự Môn (H) Thìn, Thiên Đồng (H) Tuất.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.calc import tuvi_do_sang_vn as ds
from app.main import app

CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]


def test_bang_du_14_sao_12_chi():
    assert len(ds.BANG) == 14
    for sao, b in ds.BANG.items():
        assert set(b) == set(CHI), sao
        assert set(b.values()) <= {"Miếu", "Vượng", "Đắc", "Bình", "Hãm"}, sao


@pytest.mark.parametrize("sao,chi,muc", [
    ("Tử Vi", "Mão", "Bình"), ("Tham Lang", "Mão", "Hãm"), ("Thiên Tướng", "Tỵ", "Đắc"),
    ("Thiên Lương", "Ngọ", "Miếu"), ("Liêm Trinh", "Mùi", "Đắc"), ("Thất Sát", "Mùi", "Đắc"),
    ("Cự Môn", "Thìn", "Hãm"), ("Thiên Đồng", "Tuất", "Hãm"),
])
def test_doi_chung_la_so_viet(sao, chi, muc):
    assert ds.do_sang(sao, chi) == muc


def test_tu_vi_thien_phu_khong_ham():
    assert "Hãm" not in ds.BANG["Tử Vi"].values() and "Hãm" not in ds.BANG["Thiên Phủ"].values()


def test_api_tra_ca_hai_bang():
    r = TestClient(app).post("/v1/tuvi/an-sao", json={"birth_date": "1997-03-19", "birth_time": "00:30",
                                                       "gender": "nam", "noi_sinh": "ha-noi"})
    menh = next(c for c in r.json()["cung"] if c["la_menh"])
    tv = next(s for s in menh["chinh_tinh"] if s["ten"] == "Tử Vi")
    assert tv["do_sang_nam_phai"] == "Bình" and tv["do_sang"] == "Vượng"   # Nam phái vs iztro (phái Trung)
