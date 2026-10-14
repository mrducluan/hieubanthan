# -*- coding: utf-8 -*-
"""TDG-1 — tuổi làm nhà / cưới (Kim lâu, Hoang ốc, Tam tai), hạn năm (Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng,
Nhị Hắc) và tuổi xông đất. Test viết TRƯỚC hàm; đáp án từ quy tắc dân gian công bố rộng rãi (tính tay).

Quy ước (ghi ở docs/DANH-GIA-ENGINE-HUYEN-HOC.md): tuổi = tuổi MỤ theo năm âm lịch Việt (năm xem − năm sinh + 1);
Kim lâu: tuổi mụ chia 9 dư 1/3/6/8; Hoang ốc: đếm tay 10 tuổi Nhất Cát, 20 Nhì Nghi… 60 Lục Hoang Ốc, số lẻ đếm
tiếp từ cung của hàng chục; Tam tai theo tam hợp của chi tuổi.
"""
import pytest

from app.calc import tuoi_dan_gian as t


@pytest.mark.parametrize("tuoi,ma", [(37, "than"), (39, "the"), (42, "tu"), (44, "luc_suc"), (38, None), (45, None),
                                     (19, "than"), (21, "the"), (24, "tu"), (26, "luc_suc")])
def test_kim_lau(tuoi, ma):
    assert t.kim_lau(tuoi) == ma


@pytest.mark.parametrize("tuoi,cung", [(10, 0), (20, 1), (30, 2), (40, 3), (50, 4), (60, 5), (36, 2), (35, 1),
                                       (41, 4), (45, 2), (47, 4), (56, 4), (63, 2), (70, 0)])
def test_hoang_oc(tuoi, cung):
    assert t.hoang_oc(tuoi) == cung


def test_tuoi_mu():
    assert t.tuoi_mu(1990, 2026) == 37


@pytest.mark.parametrize("chi,nam", [("Tý", ["Dần", "Mão", "Thìn"]), ("Thìn", ["Dần", "Mão", "Thìn"]),
                                     ("Ngọ", ["Thân", "Dậu", "Tuất"]), ("Mão", ["Tỵ", "Ngọ", "Mùi"]),
                                     ("Dậu", ["Hợi", "Tý", "Sửu"])])
def test_tam_tai(chi, nam):
    assert t.tam_tai(chi) == nam


def test_pham_tam_tai():
    assert t.pham_tam_tai("Tý", "Dần") == 1 and t.pham_tam_tai("Tý", "Thìn") == 3
    assert t.pham_tam_tai("Tý", "Tỵ") is None


def test_han_nam_2026_binh_ngo():
    h = t.han_nam(2026)
    assert h["can_chi"] == "Bính Ngọ"
    assert h["thai_tue"]["chi"] == "Ngọ" and h["thai_tue"]["phuong"] == "Nam"
    assert h["tue_pha"]["chi"] == "Tý" and h["tue_pha"]["phuong"] == "Bắc"
    assert h["tam_sat"]["phuong"] == "Bắc" and h["tam_sat"]["chi"] == ["Hợi", "Tý", "Sửu"]
    assert h["ngu_hoang"]["cung"] == "Ly" and h["ngu_hoang"]["phuong"] == "Nam"
    assert h["nhi_hac"]["cung"] == "Càn"


def test_han_nam_2025_at_ty():
    h = t.han_nam(2025)
    assert h["ngu_hoang"]["phuong"] == "Đông Bắc" and h["tam_sat"]["phuong"] == "Đông"
    assert h["thai_tue"]["phuong"] == "Đông Nam"


def test_quan_he_chi():
    assert t.quan_he_chi("Tý", "Thân") == "tam_hop" and t.quan_he_chi("Tý", "Sửu") == "luc_hop"
    assert t.quan_he_chi("Tý", "Ngọ") == "xung" and t.quan_he_chi("Tý", "Mùi") == "hai"
    assert t.quan_he_chi("Tý", "Mão") == "hinh" and t.quan_he_chi("Tý", "Dậu") is None


def test_xong_dat_khong_xung_va_xep_hop_truoc():
    ds = t.xong_dat(2027, 1990, range(1960, 2006))
    assert ds and all(x["chi"] not in ("Sửu",) for x in ds[:5])          # năm Đinh Mùi: Sửu xung năm
    assert all("Tý" != x["chi"] for x in ds[:5])                          # chủ Canh Ngọ: Tý xung chủ
    diem = [x["diem"] for x in ds]
    assert diem == sorted(diem, reverse=True)
    assert all(not x["tam_tai"] for x in ds[:5])
