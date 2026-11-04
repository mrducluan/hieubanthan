# -*- coding: utf-8 -*-
"""TV-VONG — vòng Tuế tiền (Thái Tuế) + Tướng tiền theo lớp hạn (đại hạn, lưu niên). Viết TRƯỚC hàm.

- Tuế tiền: Tuế Kiện tại chi khởi, 11 thần sau đi thuận. Tướng tiền: Tướng Tinh tại cung đế vượng của tam hợp chi
  khởi (Thân Tý Thìn → Tý · Tỵ Dậu Sửu → Dậu · Dần Ngọ Tuất → Ngọ · Hợi Mão Mùi → Mão), đi thuận.
- Lưu niên: chi khởi = chi năm xem — iztro đã tính sẵn (yearlyDecStar) → oracle cho hàm Python.
- Đại hạn: chi khởi = chi cung đại hạn — iztro KHÔNG có → Python, đối chiếu bảng 12×12 dựng từ khẩu quyết.
- Vòng Bác sĩ không theo hạn (an từ Lộc Tồn năm sinh) → không có bản theo hạn.
Chỉ để hiển thị: không đổi mức / điểm nào.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import lunar, tuvi_an_sao as az, tuvi_vong_han as vh

GOLDEN = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "tuvi_vong_han.json")
                    .read_text(encoding="utf-8"))
CHI_DAN = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]   # chỉ số 0 = Dần


def test_tuong_tinh_tam_hop():
    assert {c: vh.tuong_tinh(c) for c in lunar.CHI} == {
        "Thân": "Tý", "Tý": "Tý", "Thìn": "Tý", "Tỵ": "Dậu", "Dậu": "Dậu", "Sửu": "Dậu",
        "Dần": "Ngọ", "Ngọ": "Ngọ", "Tuất": "Ngọ", "Hợi": "Mão", "Mão": "Mão", "Mùi": "Mão"}


@pytest.mark.parametrize("khoi", lunar.CHI)
def test_bang_12x12_khau_quyet(khoi):
    tue, tuong = vh.vong_tue_tien(khoi), vh.vong_tuong_tien(khoi)
    assert len(tue) == len(tuong) == 12
    assert {CHI_DAN[i]: t for i, t in enumerate(tue)} == GOLDEN["tue_tien"][khoi]
    assert {CHI_DAN[i]: t for i, t in enumerate(tuong)} == GOLDEN["tuong_tien"][khoi]
    assert len(set(tue)) == len(set(tuong)) == 12


def test_ten_nam_phai_vong_thai_tue():
    ten = vh.vong_tue_tien("Tý", nam_phai=True)
    assert ten[CHI_DAN.index("Tý")] == "Thái Tuế" and ten[CHI_DAN.index("Ngọ")] == "Tuế Phá"
    assert ten[CHI_DAN.index("Dậu")] == "Phúc Đức"


def test_chi_khong_hop_le():
    with pytest.raises(ValueError):
        vh.vong_tue_tien("X")
    with pytest.raises(ValueError):
        vh.vong_tuong_tien("")


SINH = (dt.date(1988, 10, 24), 4, "nam")


def test_luu_nien_khop_iztro_12_nam():
    """Oracle: vòng lưu niên của iztro (yearlyDecStar) = hàm Python với chi khởi = chi năm xem, đủ 12 chi."""
    da = set()
    for nam in range(2020, 2032):
        r = az.van_han(*SINH, dt.date(nam, 7, 1), chi_tiet=True)["luu_nien"]
        chi = lunar.can_chi_nam(lunar.solar_to_lunar(1, 7, nam, 7.0)[2])[1]
        assert r["vong_thai_tue"] == vh.vong_tue_tien(chi), nam
        assert r["vong_tuong_tien"] == vh.vong_tuong_tien(chi), nam
        assert r["vong_thai_tue_nam_phai"] == vh.vong_tue_tien(chi, nam_phai=True)
        da.add(chi)
    assert len(da) == 12


def test_dai_han_theo_chi_cung_dai_han():
    for nam in (1995, 2005, 2015, 2027, 2040):
        r = az.van_han(*SINH, dt.date(nam, 7, 1), chi_tiet=True)["dai_han"]
        assert r["vong_thai_tue"] == vh.vong_tue_tien(r["chi"])
        assert r["vong_tuong_tien"] == vh.vong_tuong_tien(r["chi"])
        assert r["vong_thai_tue_nam_phai"] == vh.vong_tue_tien(r["chi"], nam_phai=True)
        # Tuế Kiện đại hạn đứng đúng cung đại hạn
        assert r["vong_thai_tue"][r["chi_so"]] == "Tuế Kiện"


def test_khong_chi_tiet_khong_co_vong():
    r = az.van_han(*SINH, dt.date(2027, 7, 1))
    for lop in ("dai_han", "luu_nien"):
        assert not {"vong_thai_tue", "vong_tuong_tien", "vong_thai_tue_nam_phai"} & set(r[lop])


def test_api_van_han_co_vong():
    from fastapi.testclient import TestClient
    from app.main import app
    cl = TestClient(app)
    la = {"birth_date": "1988-10-24", "birth_time": "08:00", "gender": "nam", "noi_sinh": "ha-noi"}
    d = cl.post("/v1/tuvi/van-han", json={"la_so": la, "nam_xem": 2027}).json()
    for lop in ("dai_han", "luu_nien"):
        assert len(d[lop]["vong_thai_tue"]) == len(d[lop]["vong_tuong_tien"]) == 12
    assert d["dai_han"]["vong_thai_tue"][d["dai_han"]["chi_so"]] == "Tuế Kiện"
