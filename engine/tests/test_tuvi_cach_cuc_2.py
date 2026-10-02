# -*- coding: utf-8 -*-
"""KB-TV2 — 25 cách cục bổ sung (đối chiếu danh mục TuViMCP, MIT; điều kiện siết theo cổ thư). Test viết TRƯỚC."""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import tuvi_an_sao, tuvi_cach_cuc as cc
from app.kb import tuvi_kb
from tests.test_tuvi_cach_cuc import la_gia, ma

CA = [
    # (mã, Mệnh, {chi: [sao]}, {sao: hoá})
    ("menh_ly_phung_khong", "Tý", {"Tý": ["Thiên Đồng", "Địa Không"]}, {}),
    ("cu_phung_tu_sat", "Thìn", {"Thìn": ["Cự Môn", "Đà La"]}, {}),
    ("dan_tri_que_tri", "Tỵ", {"Tỵ": ["Thái Dương"]}, {}),
    ("dan_tri_que_tri", "Tuất", {"Tuất": ["Thái Âm"]}, {}),
    ("quan_than_khanh_hoi", "Ngọ", {"Ngọ": ["Tử Vi"], "Tuất": ["Tả Phù"], "Dần": ["Hữu Bật"], "Tý": ["Văn Xương"]}, {}),
    ("co_luong_gia_hoi", "Thìn", {"Thìn": ["Thiên Cơ", "Thiên Lương"]}, {}),
    ("van_luong_chan_ky", "Ngọ", {"Ngọ": ["Thiên Lương"], "Tuất": ["Văn Xương"]}, {}),
    ("nhat_chieu_loi_mon", "Mão", {"Mão": ["Thái Dương"]}, {}),
    ("duong_luong_xuong_loc", "Mão", {"Mão": ["Thái Dương", "Thiên Lương"], "Mùi": ["Văn Xương"], "Dậu": ["Lộc Tồn"]}, {}),
    ("nhat_nguyet_tinh_minh", "Sửu", {"Tỵ": ["Thái Dương"], "Dậu": ["Thái Âm"]}, {}),
    ("nguyet_sinh_thuong_hai", "Tý", {"Tý": ["Thái Âm", "Thiên Đồng"]}, {}),
    ("quyen_loc_hoi_menh", "Tý", {"Tý": ["Vũ Khúc"], "Thìn": ["Liêm Trinh"]}, {"Vũ Khúc": "Quyền", "Liêm Trinh": "Lộc"}),
    ("khoa_quyen_loc_giap", "Ngọ", {"Tỵ": ["Liêm Trinh"], "Mùi": ["Thiên Đồng"]}, {"Liêm Trinh": "Lộc", "Thiên Đồng": "Quyền"}),
    ("song_loc_giap_menh", "Ngọ", {"Tỵ": ["Lộc Tồn"], "Mùi": ["Liêm Trinh"]}, {"Liêm Trinh": "Lộc"}),
    ("quy_tinh_giap_menh", "Ngọ", {"Tỵ": ["Thái Dương"], "Mùi": ["Thái Âm"]}, {}),
    ("quy_tinh_giap_menh", "Ngọ", {"Tỵ": ["Thiên Khôi"], "Mùi": ["Thiên Việt"]}, {}),
    ("liem_trinh_van_vu", "Dần", {"Dần": ["Liêm Trinh"], "Ngọ": ["Vũ Khúc"], "Tuất": ["Văn Xương"]}, {}),
    ("phu_cung_van_tinh", "Tý", {"Tý": ["Văn Xương"], "Thìn": ["Tả Phù"]}, {}),
    ("quyen_sat_hoa_loc", "Dần", {"Dần": ["Thất Sát"], "Ngọ": ["Kình Dương"], "Thân": ["Lộc Tồn"]}, {}),
    ("loc_hop_uyen_uong", "Tý", {"Tý": ["Thiên Đồng", "Lộc Tồn"]}, {"Thiên Đồng": "Lộc"}),
    ("loc_ma_boi_an", "Dần", {"Dần": ["Thiên Tướng", "Thiên Mã"], "Ngọ": ["Lộc Tồn"]}, {}),
    ("hoa_tinh_phan_quy", "Tuất", {"Tuất": ["Thiên Đồng"]}, {"Thiên Đồng": "Quyền"}),
    ("hoa_tinh_phan_quy", "Thìn", {"Thìn": ["Cự Môn"]}, {"Cự Môn": "Lộc"}),
    ("tuong_tinh_dac_dia", "Sửu", {"Sửu": ["Vũ Khúc"], "Tỵ": ["Thiên Lương"]}, {"Thiên Lương": "Khoa"}),
    ("nhat_nguyet_chieu_bich", "Thìn", {"Sửu": ["Thái Dương", "Thái Âm"]}, {}),
    ("tai_loc_giap_ma", "Ngọ", {"Ngọ": ["Thiên Mã"], "Tỵ": ["Vũ Khúc"], "Mùi": ["Liêm Trinh"]}, {"Liêm Trinh": "Lộc"}),
    ("minh_loc_am_loc", "Ngọ", {"Ngọ": ["Thái Dương"], "Mùi": ["Lộc Tồn"]}, {"Thái Dương": "Lộc"}),
    ("khoa_minh_loc_am", "Dần", {"Dần": ["Tử Vi"], "Hợi": ["Lộc Tồn"]}, {"Tử Vi": "Khoa"}),
]


@pytest.mark.parametrize("ma_,menh,sao,hoa", CA)
def test_nhan_dien(ma_, menh, sao, hoa):
    assert ma_ in ma(la_gia(menh, sao, hoa))


@pytest.mark.parametrize("ma_,menh,sao,hoa", [
    ("menh_ly_phung_khong", "Tý", {"Tý": ["Tử Vi", "Địa Kiếp"]}, {}),              # có Tử Vi giải
    ("dan_tri_que_tri", "Tý", {"Tý": ["Thái Dương"]}, {}),                         # Nhật ở Tý hãm
    ("quan_than_khanh_hoi", "Ngọ", {"Ngọ": ["Tử Vi"], "Tuất": ["Tả Phù"]}, {}),     # mới 1 cát tinh
    ("van_luong_chan_ky", "Ngọ", {"Dần": ["Thiên Lương"], "Tuất": ["Văn Xương"]}, {}),  # không sao nào ở Mệnh
    ("nhat_nguyet_tinh_minh", "Mão", {"Tỵ": ["Thái Dương"], "Dậu": ["Thái Âm"]}, {}),   # Tỵ/Dậu không chiếu Mão
    ("quy_tinh_giap_menh", "Ngọ", {"Tỵ": ["Thái Dương"], "Thân": ["Thái Âm"]}, {}),
    ("hoa_tinh_phan_quy", "Tuất", {"Tuất": ["Thiên Đồng"]}, {}),                    # không có hoá
    ("nhat_nguyet_chieu_bich", "Tý", {"Sửu": ["Thái Dương", "Thái Âm"]}, {}),         # Sửu không phải Điền Trạch
    ("minh_loc_am_loc", "Ngọ", {"Ngọ": ["Thái Dương"], "Thân": ["Lộc Tồn"]}, {"Thái Dương": "Lộc"}),
])
def test_khong_nhan_nham(ma_, menh, sao, hoa):
    assert ma_ not in ma(la_gia(menh, sao, hoa))


def test_tam_ky_bao_ham_quyen_loc():
    m = ma(la_gia("Tý", {"Tý": ["Vũ Khúc"], "Thìn": ["Liêm Trinh"], "Thân": ["Thiên Lương"]},
                  {"Vũ Khúc": "Quyền", "Liêm Trinh": "Lộc", "Thiên Lương": "Khoa"}))
    assert "tam_ky_gia_hoi" in m and "quyen_loc_hoi_menh" not in m


def test_moi_cach_moi_co_kb_va_nguon():
    moi = {c[0] for c in CA}
    assert moi <= set(cc.DANH_SACH)
    for m in moi:
        k = tuvi_kb.cach_cuc(m)
        assert k and k["ten"] and k["y"] and k["mat_toi"] and k["loi_khuyen"] and k["dieu_kien"], m
        assert k["nhom"] in ("cát", "hung", "trung")
    assert "TuViMCP" in tuvi_kb._cc()["_nguon"]


@pytest.mark.parametrize("nam", range(1960, 2010, 7))
def test_khong_loi_tren_la_that(nam):
    for ti in (0, 5, 11):
        la = tuvi_an_sao.an_sao_tho(dt.date(nam, 2 + ti % 9, 3 + ti), ti, "nam")
        for x in cc.nhan_dien(la):
            assert x["ma"] in cc.DANH_SACH and x["cung"]
