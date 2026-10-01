# -*- coding: utf-8 -*-
"""VZ-1 — dữ liệu bổ sung cho lá số trực quan. Test viết TRƯỚC hàm.

1. Nạp âm 60 hoa giáp khớp ORACLE lunar-typescript (fixtures/golden/can_chi.json).
2. Âm dương thuận/nghịch lý, sinh khắc Mệnh–Cục: quy tắc công khai, kiểm bằng ca tay.
3. /v1/tuvi/an-sao trả thêm Tuần/Triệt (Nam phái, nằm giữa hai cung), nạp âm, âm dương lý,
   Mệnh–Cục, loại phụ tinh. Ca đối chứng 19/03/1997 00:30 nam — lá số của một trang
   tử vi khác (ảnh chủ dự án gửi 2026-10-01): Mệnh Mão, Kim tứ cục, Giản hạ thủy,
   Âm Nam thuận lý, Cục sinh bản Mệnh, Tuần Thân–Dậu.
4. /v1/tuvi/van-han: đại hạn + lưu niên với tên cung lưu và sao lưu từng cung.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import can_chi
from app.main import app

client = TestClient(app)
G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "can_chi.json").read_text("utf-8"))

HAN_CAN = "甲乙丙丁戊己庚辛壬癸"
HAN_CHI = "子丑寅卯辰巳午未申酉戌亥"


@pytest.mark.parametrize("ca", G["nap_am"], ids=lambda c: c["can_chi"])
def test_nap_am_khop_oracle(ca):
    i = ca["chi_so"]
    can, chi = can_chi.CAN[i % 10], can_chi.CHI[i % 12]
    assert HAN_CAN[i % 10] + HAN_CHI[i % 12] == ca["can_chi"]
    assert can_chi.nap_am(can, chi)["han"] == ca["nap_am"]


@pytest.mark.parametrize("can,chi,ten,hanh", [
    ("Giáp", "Tý", "Hải Trung Kim", "Kim"),
    ("Đinh", "Sửu", "Giản Hạ Thủy", "Thủy"),
    ("Mậu", "Thìn", "Đại Lâm Mộc", "Mộc"),
    ("Canh", "Ngọ", "Lộ Bàng Thổ", "Thổ"),
    ("Quý", "Hợi", "Đại Hải Thủy", "Thủy"),
])
def test_nap_am_ten_viet(can, chi, ten, hanh):
    na = can_chi.nap_am(can, chi)
    assert (na["ten"], na["hanh"]) == (ten, hanh)


def test_nap_am_sai_cap():
    with pytest.raises(ValueError):
        can_chi.nap_am("Giáp", "Sửu")   # can dương không đi với chi âm


@pytest.mark.parametrize("can,chi_menh,ly", [
    ("Đinh", "Mão", "thuận"),   # âm–âm
    ("Giáp", "Tý", "thuận"),    # dương–dương
    ("Giáp", "Sửu", "nghịch"),
    ("Đinh", "Dần", "nghịch"),
])
def test_am_duong_ly(can, chi_menh, ly):
    assert can_chi.am_duong_ly(can, chi_menh) == ly


@pytest.mark.parametrize("menh,cuc,qh", [
    ("Thủy", "Kim", "Cục sinh Mệnh"),
    ("Kim", "Thủy", "Mệnh sinh Cục"),
    ("Mộc", "Kim", "Cục khắc Mệnh"),
    ("Kim", "Mộc", "Mệnh khắc Cục"),
    ("Hỏa", "Hỏa", "Mệnh Cục bình hoà"),
])
def test_menh_cuc(menh, cuc, qh):
    assert can_chi.menh_cuc(menh, cuc) == qh


def test_hanh_cuc():
    assert can_chi.hanh_cuc("Kim tứ cục") == "Kim"
    assert can_chi.hanh_cuc("Thủy nhị cục") == "Thủy"
    assert can_chi.hanh_cuc("Hỏa lục cục") == "Hỏa"


DOI_CHUNG = {"birth_date": "1997-03-19", "birth_time": "00:30", "gender": "nam", "noi_sinh": "ha-noi"}


@pytest.fixture(scope="module")
def la():
    r = client.post("/v1/tuvi/an-sao", json=DOI_CHUNG)
    assert r.status_code == 200, r.text
    return r.json()


def test_doi_chung_trang_khac(la):
    assert la["chi_cung_menh"] == "Mão"
    assert la["ngu_hanh_cuc"].lower().startswith("kim")
    assert la["menh_nap_am"] == {"ten": "Giản Hạ Thủy", "hanh": "Thủy", "han": "涧下水"}
    assert la["am_duong"] == {"nam_sinh": "Âm", "nhan": "Âm Nam", "ly": "thuận"}
    assert la["menh_cuc"] == "Cục sinh Mệnh"
    assert la["tuan_triet"] == {"tuan": ["Thân", "Dậu"], "triet": ["Dần", "Mão"]}
    menh = next(c for c in la["cung"] if c["la_menh"])
    assert {s["ten"] for s in menh["chinh_tinh"]} == {"Tử Vi", "Tham Lang"}


def test_phu_tinh_co_loai(la):
    loai = {s["loai"] for c in la["cung"] for s in c["phu_tinh"]}
    assert loai and loai <= {"soft", "tough", "lucun", "tianma", "flower", "helper", "adjective"}
    assert any(s["loai"] == "tough" for c in la["cung"] for s in c["phu_tinh"])


def test_van_han(la):
    r = client.post("/v1/tuvi/van-han", json={"la_so": DOI_CHUNG, "nam_xem": 2026})
    assert r.status_code == 200, r.text
    v = r.json()
    assert v["nam_xem"] == 2026 and v["can_chi_nam_xem"] == "Bính Ngọ"
    assert v["tuoi_mu"] == 30
    for lop in ("dai_han", "luu_nien"):
        assert len(v[lop]["ten_cung"]) == 12 and len(v[lop]["sao"]) == 12
        assert len(v[lop]["tu_hoa"]) == 4
        assert 0 <= v[lop]["chi_so"] < 12
    # cung lưu niên nằm ở chi của năm xem
    assert la["cung"][v["luu_nien"]["chi_so"]]["chi"] == "Ngọ"
    assert v["luu_nien"]["ten_cung"][v["luu_nien"]["chi_so"]] == "Mệnh"
    assert 0 <= v["tieu_han"]["chi_so"] < 12


def test_van_han_nam_ngoai_khoang():
    r = client.post("/v1/tuvi/van-han", json={"la_so": DOI_CHUNG, "nam_xem": 1800})
    assert r.status_code == 422
