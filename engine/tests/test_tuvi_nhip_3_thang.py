# -*- coding: utf-8 -*-
"""TV-V2 — RULES "Nhịp 3 tháng tới" (luangiai/tuvi_nhip_3_thang.py). Viết TRƯỚC hàm.

Luật công khai:
- chong_ky: Kỵ tháng cùng trục (đích hoặc xung) với Kỵ năm → can_than
- ky_xung_cung_chinh: Kỵ tháng xung Mệnh / Tài Bạch / Quan Lộc → can_than
- loc_nhap_cung_chinh: Lộc tháng vào Mệnh / Tài Bạch / Quan Lộc / Điền Trạch → thuan
- song_loc: Lộc tháng + Lộc năm cùng cung → thuan
- khoa_giai: Khoa tháng vào cung đang chồng Kỵ → thêm lý do (không đổi mức)
Có lý do can_than → can_than; không thì có lý do thuan → thuan; còn lại binh.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import lunar, tuvi_an_sao as az, tuvi_phi_hoa as ph
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_phi_hoa_kb as pkb
from app.luangiai import tuvi_nhip_3_thang as nh

SINH = {"ngay": dt.date(1990, 5, 15), "ti": 1, "gioi_tinh": "nam"}
XUNG = {"Mệnh": "Thiên Di", "Thiên Di": "Mệnh", "Tài Bạch": "Phúc Đức", "Phúc Đức": "Tài Bạch",
        "Quan Lộc": "Phu Thê", "Phu Thê": "Quan Lộc", "Tật Ách": "Phụ Mẫu", "Phụ Mẫu": "Tật Ách",
        "Điền Trạch": "Tử Nữ", "Tử Nữ": "Điền Trạch", "Nô Bộc": "Huynh Đệ", "Huynh Đệ": "Nô Bộc"}


def _ma(ly_do):
    return [x["ma"] for x in ly_do]


def test_xep_muc_chong_ky_dich_va_xung():
    nam = {"Lộc": "Nô Bộc", "Kỵ": "Tử Nữ"}
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Mệnh", "Khoa": "Phúc Đức", "Kỵ": "Tử Nữ"}, nam, XUNG)
    assert muc == "can_than" and "chong_ky" in _ma(ly)
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Mệnh", "Khoa": "Phúc Đức", "Kỵ": "Điền Trạch"}, nam, XUNG)
    assert muc == "can_than" and "chong_ky" in _ma(ly)        # Kỵ tháng ở cung xung của Kỵ năm


def test_xep_muc_ky_xung_cung_chinh():
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Thiên Di"},
                         {"Lộc": "Nô Bộc", "Kỵ": "Tật Ách"}, XUNG)
    assert muc == "can_than" and _ma(ly) == ["ky_xung_cung_chinh"]


def test_xep_muc_thuan():
    muc, ly = nh.xep_muc({"Lộc": "Điền Trạch", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Huynh Đệ"},
                         {"Lộc": "Phụ Mẫu", "Kỵ": "Tật Ách"}, XUNG)
    assert muc == "thuan" and _ma(ly) == ["loc_nhap_cung_chinh"]
    muc, ly = nh.xep_muc({"Lộc": "Phụ Mẫu", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Huynh Đệ"},
                         {"Lộc": "Phụ Mẫu", "Kỵ": "Tật Ách"}, XUNG)
    assert muc == "thuan" and _ma(ly) == ["song_loc"]


def test_xep_muc_binh_va_khoa_giai():
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Phụ Mẫu"},
                         {"Lộc": "Phúc Đức", "Kỵ": "Thiên Di"}, XUNG)
    assert muc == "binh" and ly == []
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Tử Nữ"},
                         {"Lộc": "Phúc Đức", "Kỵ": "Tử Nữ"}, XUNG)
    assert muc == "can_than" and "khoa_giai" in _ma(ly)
    # can_than thắng thuan khi cùng có
    muc, ly = nh.xep_muc({"Lộc": "Mệnh", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Thiên Di"},
                         {"Lộc": "Phúc Đức", "Kỵ": "Tật Ách"}, XUNG)
    assert muc == "can_than" and set(_ma(ly)) == {"loc_nhap_cung_chinh", "ky_xung_cung_chinh"}


def test_lap_ba_thang_trong_nam():
    r = nh.lap(SINH, dt.date(2026, 10, 19))      # âm 10/9/2026
    assert r["phai_luu_nguyet"] == "dau_quan_thai_tue"
    assert r["ngay_xem"] == "2026-10-19"
    assert [t["thang"] for t in r["thang"]] == [9, 10, 11]
    assert r["luu_nien"]["nam_am"] == 2026 and r["luu_nien"]["can_chi"] == "Bính Ngọ"
    ls = tom_tat(az.an_sao_tho(SINH["ngay"], 1, "nam", "vi-VN"))
    assert [(x["hoa"], x["sao"], x["cung_goc"]) for x in r["luu_nien"]["tu_hoa"]] == \
        [(x["hoa"], x["sao"], x["den_cung"]) for x in ph.phi_tu_can("Bính", ls["cung"])]
    t0 = r["thang"][0]
    assert t0["tu"] <= "2026-10-19" <= t0["den"]
    for t in r["thang"]:
        assert t["muc"] in ("thuan", "binh", "can_than")
        assert t["nhan_muc"] in ("Thuận", "Bình", "Cần thận trọng")
        assert t["goi_y"] and t["cau_tu_soi"] and t["cung_goc"] and t["can_chi"]
        assert len(t["tu_hoa_thang"]) == 4
        for x in t["ly_do"]:
            assert x["ma"] in ("chong_ky", "song_loc", "loc_nhap_cung_chinh", "ky_xung_cung_chinh", "khoa_giai")
            assert x["noi_dung"]
    assert "lưu nguyệt" in r["uu_tien"]["ghi_chu"]
    assert r["uu_tien"]["thu_tu"] == ["dai_han", "luu_nien", "tieu_han", "luu_nguyet"]
    assert r["luu_y"]


def test_lap_vat_sang_nam_sau():
    r = nh.lap(SINH, dt.date(2027, 1, 20))      # âm 13/12/2026 → tháng 12, Giêng, Hai năm 2027
    assert [(t["thang"], t["nam_am"]) for t in r["thang"]] == [(12, 2026), (1, 2027), (2, 2027)]
    assert r["luu_nien_sau"]["nam_am"] == 2027 and r["luu_nien_sau"]["can_chi"] == "Đinh Mùi"


def test_muc_khop_luat_tren_du_lieu_that():
    r = nh.lap(SINH, dt.date(2026, 3, 1))
    ln = {r["luu_nien"]["nam_am"]: r["luu_nien"]}
    if r.get("luu_nien_sau"):
        ln[r["luu_nien_sau"]["nam_am"]] = r["luu_nien_sau"]
    ls = tom_tat(az.an_sao_tho(SINH["ngay"], 1, "nam", "vi-VN"))
    chi = {c["ten"]: c["chi"] for c in ls["cung"]}
    xung = {a: next(b for b in chi if lunar.CHI.index(chi[b]) == (lunar.CHI.index(chi[a]) + 6) % 12) for a in chi}
    for t in r["thang"]:
        nam = {x["hoa"]: x["cung_goc"] for x in ln[t["nam_am"]]["tu_hoa"]}
        th = {x["hoa"]: x["cung_goc"] for x in t["tu_hoa_thang"]}
        muc, ly = nh.xep_muc(th, nam, xung)
        assert t["muc"] == muc and _ma(t["ly_do"]) == _ma(ly)


def test_khong_kb_van_chay(monkeypatch):
    monkeypatch.setattr(pkb, "_d", lambda: {})
    r = nh.lap(SINH, dt.date(2026, 10, 19))
    assert len(r["thang"]) == 3 and all(t["goi_y"] for t in r["thang"])


def test_phai_khac_va_phai_sai():
    r = nh.lap(SINH, dt.date(2026, 10, 19), phai="dia_chi_thang")
    assert r["phai_luu_nguyet"] == "dia_chi_thang"
    with pytest.raises(ValueError):
        nh.lap(SINH, dt.date(2026, 10, 19), phai="sai")
