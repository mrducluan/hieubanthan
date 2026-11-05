# -*- coding: utf-8 -*-
"""KB-TV3 — bất biến cấu trúc lá số Tử vi trên 1.000 lá engine an (đầu vào `lasotuvi_1000.json`) + độ phủ cách cục.

Chỉ số cung `i` theo iztro: i = 0 là cung Dần, chi TĂNG dần (Dần, Mão, … Sửu). Trong cách đánh số Tý = 0 thì
chi(i) = (i + 2) mod 12. Khẩu quyết an chính tinh (Đẩu Số Toàn Thư) viết theo chỉ số Tý = 0:
  • Thiên Phủ = (4 − Tử Vi) mod 12 (Tử Vi và Thiên Phủ đối xứng qua trục Dần – Thân);
  • vòng Thiên Phủ thuận: Thái Âm +1, Tham Lang +2, Cự Môn +3, Thiên Tướng +4, Thiên Lương +5, Thất Sát +6, Phá Quân +10;
  • vòng Tử Vi nghịch: Thiên Cơ −1, Thái Dương −3, Vũ Khúc −4, Thiên Đồng −5, Liêm Trinh −8.
"""
from __future__ import annotations

import datetime as dt
import json
from collections import Counter

import pytest

from app.calc import tuvi_an_sao as az, tuvi_cach_cuc as cc
from app.kb import tuvi_kb
from tests._tuvi_1000 import DAU_VAO, GOLDEN, la_1000

CHI_TU_DAN = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]
CHI_TU_TY = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
TEN_CUNG = {"Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch",
            "Tử Nữ", "Phu Thê", "Huynh Đệ"}


def _vi_tri(la: dict) -> dict[str, list[int]]:
    """tên sao → chỉ số Tý = 0 của (các) cung có sao."""
    ra: dict[str, list[int]] = {}
    for p in la["palaces"]:
        t = CHI_TU_TY.index(p["earthlyBranch"])
        for k in ("majorStars", "minorStars", "adjectiveStars"):
            for s in p[k]:
                ra.setdefault(s["name"], []).append(t)
    return ra


def test_muoi_hai_cung():
    for la in la_1000():
        p = la["palaces"]
        assert [x["earthlyBranch"] for x in p] == CHI_TU_DAN
        assert {x["name"] for x in p} == TEN_CUNG and len(p) == 12
        assert sum(x["name"] == "Mệnh" for x in p) == 1 and sum(bool(x["isBodyPalace"]) for x in p) == 1


def test_khau_quyet_chinh_tinh():
    for (d, ti, gt), la in zip(DAU_VAO, la_1000()):
        v = _vi_tri(la)
        for s in cc.CHINH_TINH:
            assert len(v[s]) == 1, (d, ti, s)
        z, f = v["Tử Vi"][0], v["Thiên Phủ"][0]
        assert f == (4 - z) % 12, (d, ti)
        for s, k in (("Thái Âm", 1), ("Tham Lang", 2), ("Cự Môn", 3), ("Thiên Tướng", 4), ("Thiên Lương", 5),
                     ("Thất Sát", 6), ("Phá Quân", 10)):
            assert v[s][0] == (f + k) % 12, (d, ti, s)
        for s, k in (("Thiên Cơ", -1), ("Thái Dương", -3), ("Vũ Khúc", -4), ("Thiên Đồng", -5), ("Liêm Trinh", -8)):
            assert v[s][0] == (z + k) % 12, (d, ti, s)
        # Sát – Phá – Tham luôn cùng một tam hợp
        assert len({v[s][0] % 4 for s in ("Thất Sát", "Phá Quân", "Tham Lang")}) == 1


def test_phu_tinh_doi_xung():
    for (d, ti, gt), la in zip(DAU_VAO, la_1000()):
        v = _vi_tri(la)
        lt = v["Lộc Tồn"][0]
        assert v["Kình Dương"] == [(lt + 1) % 12] and v["Đà La"] == [(lt - 1) % 12], (d, ti)
        assert (v["Hồng Loan"][0] - v["Thiên Hỷ"][0]) % 12 == 6, (d, ti)
        # Tả Phù (Thìn thuận theo tháng) + Hữu Bật (Tuất nghịch) đối xứng qua trục Thìn–Tuất ⇒ tổng chỉ số = Thìn + Tuất.
        assert (v["Tả Phù"][0] + v["Hữu Bật"][0]) % 12 == (4 + 10) % 12, (d, ti)
        # Văn Khúc (Thìn thuận theo giờ) + Văn Xương (Tuất nghịch) — cùng trục.
        assert (v["Văn Xương"][0] + v["Văn Khúc"][0]) % 12 == (4 + 10) % 12, (d, ti)
        # Địa Kiếp (Hợi thuận theo giờ) + Địa Không (Hợi nghịch) đối xứng qua Hợi.
        assert (v["Địa Không"][0] + v["Địa Kiếp"][0]) % 12 == (11 + 11) % 12, (d, ti)


def test_tu_hoa_sinh_nien_du_bon_hoa():
    for (d, ti, gt), la in zip(DAU_VAO, la_1000()):
        dem = Counter(s["mutagen"] for p in la["palaces"] for s in p["majorStars"] + p["minorStars"] if s.get("mutagen"))
        assert dem == Counter({"Lộc": 1, "Quyền": 1, "Khoa": 1, "Kỵ": 1}), (d, ti)
        l = cc._La(la)
        assert {h for i in range(12) for h in l.hoa(i)} == {"Lộc", "Quyền", "Khoa", "Kỵ"}


def test_nam_mau_nhieu_hoa_mot_cung():
    # Tuổi Mậu: Thái Âm hoá Quyền, Thiên Cơ hoá Kỵ (Hữu Bật hoá Khoa theo bảng iztro); 24/10/1988 giờ Tỵ cả ba sao cùng
    # ở Dần → một cung mang BA hoá, `_La.hoa` phải giữ đủ, không đè nhau.
    la = az.an_sao_tho(dt.date(1988, 10, 24), 5, "nam")
    l = cc._La(la)
    i = CHI_TU_DAN.index("Dần")
    assert l.hoa(i) == {"Kỵ": "Thiên Cơ", "Quyền": "Thái Âm", "Khoa": "Hữu Bật"}
    x = cc.nhan_dien(la)                                       # không lỗi, và điều kiện đạt dựng được cho mọi cách
    for c in x:
        assert tuvi_kb.dieu_kien_dat(c["du_kien"])
    # Điểm trừ/cộng tách đúng hai hoá trên hai sao cùng cung
    tat_ca = [d["noi_dung"] for c in x for d in tuvi_kb.dieu_kien_dat(c["du_kien"])]
    assert not any("Thái Âm hoá Kỵ" in t or "Thiên Cơ hoá Quyền" in t for t in tat_ca)


# ------------------------------------------------------------------------------------------- cách cục trên 1.000 lá
def test_cach_cu_khong_doi_ket_qua():
    g = json.loads((GOLDEN / "tuvi_cach_cuc_1000.json").read_text("utf-8"))
    cu = set(g["danh_sach"])
    assert cc.DANH_SACH[:len(g["danh_sach"])] == g["danh_sach"]      # thứ tự cách cũ giữ nguyên
    sai = []
    for (ngay, ti, gt, ky), la in zip(g["cases"], la_1000()):
        hien = [f"{x['ma']}|{','.join(x['cung'])}|{','.join(x['sat_hoi'])}" for x in cc.nhan_dien(la) if x["ma"] in cu]
        if hien != ky:
            sai.append((ngay, ti, gt))
    assert not sai, sai[:5]


# Cách không gặp trong 1.000 lá thì phải có một lá số THẬT làm chứng (ngày, giờ 0..11, giới tính) — tìm bằng quét
# tất định các ngày sinh rồi ghi vào đây. Hiện cả 75 cách đều gặp trong 1.000 lá (cách hiếm nhất: hoa_tinh_phan_quy 1 lá,
# tai_loc_giap_ma 2 lá) nên chưa cần lá làm chứng nào.
NHAN_CHUNG: dict[str, tuple[str, int, str]] = {}
# Cách không thể có trên lá số thật (cấu trúc an sao không cho phép) — hiện không có.
KHONG_THE: set[str] = set()


def test_do_phu_moi_cach_deu_xuat_hien():
    gap: Counter = Counter()
    for la in la_1000():
        gap.update(x["ma"] for x in cc.nhan_dien(la))
    for m, (ngay, ti, gt) in NHAN_CHUNG.items():
        assert m in {x["ma"] for x in cc.nhan_dien(az.an_sao_tho(dt.date.fromisoformat(ngay), ti, gt))}, m
        gap[m] += 1
    thieu = [m for m in cc.DANH_SACH if not gap[m] and m not in KHONG_THE]
    assert not thieu, thieu
    assert not (KHONG_THE & set(gap)), "cách ghi 'không thể' lại xuất hiện"


def test_moi_cach_gap_deu_co_dieu_kien_can():
    thieu = set()
    for la in la_1000()[:300]:
        for x in cc.nhan_dien(la):
            ds = tuvi_kb.dieu_kien_dat(x["du_kien"])
            if not any(d["loai"] == "can" for d in ds):
                thieu.add(x["ma"])
            assert all(d["noi_dung"] and "{" not in d["noi_dung"] for d in ds), x["ma"]
    assert not thieu, thieu


@pytest.mark.parametrize("ma_", ["co_nguyet_dong_luong_ba", "dong_luong_dan_than", "liem_tuong_dong_cung",
                                 "vu_sat_dong_cung", "tu_vi_co_quan"])
def test_cach_moi_dung_cung_cau_truc(ma_):
    """Cách đồng cung chỉ có thể rơi ở chi mà khẩu quyết cho phép (đối chiếu trên lá thật)."""
    cho = {"dong_luong_dan_than": {"Dần", "Thân"}, "liem_tuong_dong_cung": {"Tý", "Ngọ"},
           "vu_sat_dong_cung": {"Mão", "Dậu"}}
    for la in la_1000():
        for x in cc.nhan_dien(la):
            if x["ma"] == ma_ and ma_ in cho:
                assert cc._La(la).chi_menh in cho[ma_]
