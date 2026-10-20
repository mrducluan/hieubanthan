# -*- coding: utf-8 -*-
"""TV-V2 — CALC phi tinh tứ hoá (calc/tuvi_phi_hoa.py). Viết TRƯỚC hàm.

Oracle độc lập: hàm của iztro (FunctionalPalace.mutagedPlaces / fliesTo / selfMutaged / heavenlyStem /
isOriginalPalace) — golden `fixtures/golden/tuvi_phi_hoa_golden.json` (67 lá, sinh bằng
ziwei/_generate_phi_hoa_golden.mjs). Python tự tính lại từ bảng tứ hoá + vị trí sao trên lá số `tom_tat`.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import tuvi_an_sao as az
from app.calc import tuvi_luu_nguyet as ln
from app.calc import tuvi_phi_hoa as ph
from app.hoidap.tuvi import tom_tat

GOLDEN = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "tuvi_phi_hoa_golden.json")
                    .read_text(encoding="utf-8"))
CASES = GOLDEN["cases"]
HOA = ["Lộc", "Quyền", "Khoa", "Kỵ"]
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]


def _ngay(c: dict) -> dt.date:
    return dt.date.fromisoformat(c["ngay"])


def _ls(c: dict) -> dict:
    return tom_tat(az.an_sao_tho(_ngay(c), c["ti"], c["gioi_tinh"], "vi-VN"))


def test_golden_du_lon_va_lich_trung_khop():
    assert len(CASES) >= 24
    for c in CASES:
        d = _ngay(c)
        # golden để iztro tự đổi lịch Trung Quốc → chỉ hợp lệ khi lịch Việt = lịch Trung (cả ngày sau cho Tý muộn)
        assert not az.lich_khac(d) and not az.lich_khac(d + dt.timedelta(days=1)), c["ngay"]


def test_ngu_ho_don_vi_du_tay():
    # Giáp/Kỷ khởi Bính Dần; Ất/Canh Mậu Dần; Bính/Tân Canh Dần; Đinh/Nhâm Nhâm Dần; Mậu/Quý Giáp Dần.
    assert ph.ngu_ho_don("Giáp", "Dần") == "Bính"
    assert ph.ngu_ho_don("Kỷ", "Mão") == "Đinh"
    assert ph.ngu_ho_don("Ất", "Dần") == "Mậu"
    assert ph.ngu_ho_don("Bính", "Dần") == "Canh"
    assert ph.ngu_ho_don("Nhâm", "Dần") == "Nhâm"
    assert ph.ngu_ho_don("Quý", "Hợi") == "Quý"
    # Tý, Sửu nối tiếp sau Hợi (cùng can với Dần, Mão)
    assert ph.ngu_ho_don("Giáp", "Tý") == "Bính"
    assert ph.ngu_ho_don("Giáp", "Sửu") == "Đinh"
    with pytest.raises(ValueError):
        ph.ngu_ho_don("Giap", "Dần")


@pytest.mark.parametrize("c", CASES, ids=lambda c: f"{c['ngay']}_{c['ti']}_{c['gioi_tinh']}")
def test_ngu_ho_don_va_lai_nhan_khop_iztro(c):
    for p in c["cung"]:
        assert ph.ngu_ho_don(c["can_nam"], p["chi"]) == p["can"], (p["ten"], p["chi"])
    lai = [p for p in c["cung"] if p["la_lai_nhan"]]
    assert len(lai) == 1
    assert ph.lai_nhan(c["can_nam"]) == lai[0]["chi"]


def test_lai_nhan_bo_ty_suu():
    for can in ln.TU_HOA:
        assert ph.lai_nhan(can) not in ("Tý", "Sửu")
        assert ph.ngu_ho_don(can, ph.lai_nhan(can)) == can


@pytest.mark.parametrize("c", CASES, ids=lambda c: f"{c['ngay']}_{c['ti']}_{c['gioi_tinh']}")
def test_phi_hoa_khop_golden_100(c):
    ls = _ls(c)
    duong = ph.phi_hoa(ls["cung"])
    assert len(duong) == 48
    g = {p["ten"]: p for p in c["cung"]}
    for x in duong:
        gp = g[x["tu_cung"]]
        assert x["can"] == gp["can"]
        assert x["den_cung"] == gp["phi"][x["hoa"]], (x["tu_cung"], x["hoa"], x["sao"])
        assert x["tu_hoa"] == gp["tu_hoa"][x["hoa"]]
        assert x["tu_hoa"] == (x["den_cung"] == x["tu_cung"])
        assert x["sao"] == ln.TU_HOA[x["can"]][HOA.index(x["hoa"])]


def test_phi_hoa_cau_truc_xung_va_tuan_triet():
    c = CASES[0]
    ls = _ls(c)
    theo_ten = {p["ten"]: p for p in ls["cung"]}
    duong = ph.phi_hoa(ls["cung"])
    # thứ tự: theo thứ tự cung đầu vào, mỗi cung 4 hoá Lộc → Kỵ
    assert [x["tu_cung"] for x in duong[:4]] == [ls["cung"][0]["ten"]] * 4
    assert [x["hoa"] for x in duong[:4]] == HOA
    for x in duong:
        assert set(x) == {"tu_cung", "can", "hoa", "sao", "den_cung", "xung_cung", "tu_hoa", "den_tuan_triet"}
        den = theo_ten[x["den_cung"]]
        xung = theo_ten[x["xung_cung"]]
        assert (CHI.index(den["chi"]) + 6) % 12 == CHI.index(xung["chi"])
        assert x["den_tuan_triet"] == [s for s in ("Tuần Không", "Triệt Lộ") if s in den["phu_tinh"]]


def test_tuan_triet_dong_hai_cung():
    # tom_tat bổ sung Tuần/Triệt cho cả hai cung → mỗi sao (nếu có) xuất hiện ở đúng 2 cung liền nhau
    ls = _ls(CASES[0])
    for sao in ("Tuần Không", "Triệt Lộ"):
        co = [p["chi"] for p in ls["cung"] if sao in p["phu_tinh"]]
        assert len(co) in (0, 2)


def test_phi_tu_can():
    ls = _ls(CASES[0])
    for can in ln.TU_HOA:
        r = ph.phi_tu_can(can, ls["cung"])
        assert [x["hoa"] for x in r] == HOA
        assert [x["sao"] for x in r] == ln.TU_HOA[can]
        for x in r:
            assert x["den_cung"] is not None
            assert set(x) == {"hoa", "sao", "den_cung", "xung_cung", "den_tuan_triet"}
    # phi_tu_can của can cung nguồn = 4 đường bay của cung đó
    duong = ph.phi_hoa(ls["cung"])
    p0 = ls["cung"][3]
    r = ph.phi_tu_can(p0["can"], ls["cung"])
    assert [x["den_cung"] for x in r] == [x["den_cung"] for x in duong if x["tu_cung"] == p0["ten"]]
    with pytest.raises(ValueError):
        ph.phi_tu_can("Không", ls["cung"])


def test_dung_bang_tu_hoa_chung():
    # Không tạo bảng tứ hoá thứ hai
    assert ph.TU_HOA is ln.TU_HOA
