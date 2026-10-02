# -*- coding: utf-8 -*-
"""KB-2 — nhận diện cách cục Tử vi trên lá số iztro (RULES thuần, tất định). Test viết TRƯỚC.

Điều kiện từng cách công bố trong app/calc/tuvi_cach_cuc.py; nghĩa trong app/kb/data/tuvi_cach_cuc.json.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import tuvi_an_sao, tuvi_cach_cuc as cc
from app.kb import tuvi_kb

CHI_TU_DAN = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]
CUNG = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách",
        "Tài Bạch", "Tử Nữ", "Phu Thê", "Huynh Đệ"]


def la_gia(menh_chi: str, sao: dict[str, list[str]], hoa: dict[str, str] | None = None, than: str | None = None) -> dict:
    """Lá số giả: `sao` = {chi: [tên sao]}; `hoa` = {tên sao: Lộc/Quyền/Khoa/Kỵ}. Cung xếp nghịch từ Mệnh."""
    hoa = hoa or {}
    i0 = CHI_TU_DAN.index(menh_chi)
    pal = []
    for i, chi in enumerate(CHI_TU_DAN):
        ten = CUNG[(i0 - i) % 12]
        ds = sao.get(chi, [])
        mk = lambda n: {"name": n, "mutagen": hoa.get(n, ""), "brightness": "", "type": ""}  # noqa: E731
        pal.append({"index": i, "name": ten, "earthlyBranch": chi, "isBodyPalace": chi == (than or menh_chi),
                    "majorStars": [mk(n) for n in ds if n in cc.CHINH_TINH],
                    "minorStars": [mk(n) for n in ds if n not in cc.CHINH_TINH], "adjectiveStars": []})
    return {"palaces": pal}


def ma(la: dict) -> set[str]:
    return {x["ma"] for x in cc.nhan_dien(la)}


def test_vo_chinh_dieu_va_minh_chau_xuat_hai():
    la = la_gia("Mùi", {"Mão": ["Thái Dương"], "Hợi": ["Thái Âm"]})
    m = ma(la)
    assert "menh_vo_chinh_dieu" in m and "minh_chau_xuat_hai" in m


def test_tu_phu_dong_cung_va_than_menh():
    m = ma(la_gia("Dần", {"Dần": ["Tử Vi", "Thiên Phủ"]}))
    assert {"tu_phu_dong_cung", "than_menh_dong_cung"} <= m


def test_sat_pha_tham_va_that_sat_trieu_dau():
    m = ma(la_gia("Thân", {"Thân": ["Thất Sát"], "Tý": ["Phá Quân"], "Thìn": ["Tham Lang"]}))
    assert {"sat_pha_tham", "that_sat_trieu_dau"} <= m
    assert "that_sat_trieu_dau" not in ma(la_gia("Thìn", {"Thìn": ["Thất Sát"]}))


def test_giap_menh():
    m = ma(la_gia("Ngọ", {"Tỵ": ["Kình Dương", "Tả Phù"], "Mùi": ["Đà La", "Hữu Bật"]}))
    assert {"kinh_da_giap_menh", "ta_huu_giap_menh"} <= m


def test_tam_ky_va_song_loc_loc_ma():
    la = la_gia("Tý", {"Tý": ["Vũ Khúc", "Lộc Tồn", "Thiên Mã"], "Thìn": ["Thiên Cơ"], "Thân": ["Thiên Lương"]},
                hoa={"Vũ Khúc": "Lộc", "Thiên Cơ": "Quyền", "Thiên Lương": "Khoa"})
    assert {"tam_ky_gia_hoi", "song_loc", "loc_ma_giao_tri"} <= ma(la)


def test_hoa_tham_va_dao_hoa_pham_chu():
    m = ma(la_gia("Mão", {"Mão": ["Tử Vi", "Tham Lang", "Hỏa Tinh"]}))
    assert {"hoa_tham", "dao_hoa_pham_chu"} <= m


def test_sat_hoi_ghi_kem():
    la = la_gia("Ngọ", {"Ngọ": ["Tử Vi", "Kình Dương"], "Tuất": ["Hỏa Tinh"], "Tý": ["Địa Kiếp"]})
    x = next(c for c in cc.nhan_dien(la) if c["ma"] == "cuc_huong_ly_minh")
    assert set(x["sat_hoi"]) == {"Kình Dương", "Hỏa Tinh", "Địa Kiếp"}
    assert "ma_dau_doi_kiem" in ma(la)


def test_la_so_that_doi_chung_1997():
    # Lối Việt (mặc định, TV-PHAI): Mệnh Mão có Tử Tham + LINH Tinh (lasotuvi đồng ý) → Linh Tham.
    m = ma(tuvi_an_sao.an_sao_tho(dt.date(1997, 3, 19), 0, "nam"))
    assert {"dao_hoa_pham_chu", "linh_tham", "than_menh_dong_cung"} <= m and "hoa_tham" not in m
    # Trung Châu (iztro nguyên bản): Hoả Tinh ở Mão → Hoả Tham.
    assert "hoa_tham" in ma(tuvi_an_sao.an_sao_tho(dt.date(1997, 3, 19), 0, "nam", hoa_linh="trung"))


def test_moi_cach_co_nghia_trong_kb():
    for m in cc.DANH_SACH:
        k = tuvi_kb.cach_cuc(m)
        assert k and k["ten"] and k["y"] and k["nhom"] in ("cát", "hung", "trung") and k["dieu_kien"], m


@pytest.mark.parametrize("nam", [1975, 1988, 1990, 2001])
def test_khong_loi_tren_la_that(nam):
    la = tuvi_an_sao.an_sao_tho(dt.date(nam, 6, 15), 6, "nu")
    for x in cc.nhan_dien(la):
        assert x["ma"] in cc.DANH_SACH and x["cung"]


def test_api_an_sao_co_cach_cuc():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).post("/v1/tuvi/an-sao", json={"birth_date": "1997-03-19", "birth_time": "00:30",
                                                       "gender": "nam", "noi_sinh": "ha-noi"})
    d = r.json()
    ma_ = {c["ma"] for c in d["cach_cuc"]}
    assert "dao_hoa_pham_chu" in ma_
    c = next(c for c in d["cach_cuc"] if c["ma"] == "linh_tham")
    assert c["y"] and "Linh Tinh" in c["sat_hoi"]
    assert d["cach_cuc_luu_y"]


def test_hoi_tinh_cach_co_cach_cuc():
    from app.hoidap import tuvi as hd
    kq = hd.tra_loi("Cung Mệnh của tôi nói gì về tính cách?", sinh={"ngay": dt.date(1997, 3, 19), "ti": 0, "gioi_tinh": "nam"})
    assert "Cách cục" in kq["cau_tra_loi"]
