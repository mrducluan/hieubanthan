# -*- coding: utf-8 -*-
"""KD-V2 — Lục Hào nâng cao (`calc/luc_hao.py`). Test viết TRƯỚC, bảng tay theo Tăng San Bốc Dịch (Dã Hạc Lão Nhân):
lục thú theo can ngày, nguyên/kỵ/cừu thần, phục thần từ quẻ bản cung, hoá tiến/thoái, hồi đầu sinh khắc, nguyệt phá,
nhật phá / ám động, nhập mộ, ứng kỳ (nhịp gợi ý, không phải dự báo)."""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import kinhdich, luc_hao as lh


@pytest.mark.parametrize("can,dau,cuoi", [
    ("Giáp", "Thanh Long", "Huyền Vũ"), ("Ất", "Thanh Long", "Huyền Vũ"), ("Bính", "Chu Tước", "Thanh Long"),
    ("Đinh", "Chu Tước", "Thanh Long"), ("Mậu", "Câu Trần", "Chu Tước"), ("Kỷ", "Đằng Xà", "Câu Trần"),
    ("Canh", "Bạch Hổ", "Đằng Xà"), ("Tân", "Bạch Hổ", "Đằng Xà"), ("Nhâm", "Huyền Vũ", "Bạch Hổ"),
    ("Quý", "Huyền Vũ", "Bạch Hổ"),
])
def test_luc_thu_theo_can_ngay(can, dau, cuoi):
    ds = lh.luc_thu(can)
    assert len(ds) == 6 and ds[0] == dau and ds[5] == cuoi
    assert len(set(ds)) == 6


def test_nguyen_ky_cuu_than():
    assert lh.nguyen_than("Thê Tài") == "Tử Tôn" and lh.ky_than("Thê Tài") == "Huynh Đệ"
    assert lh.cuu_than("Thê Tài") == "Phụ Mẫu"            # cừu thần khắc nguyên thần Tử Tôn
    assert lh.nguyen_than("Quan Quỷ") == "Thê Tài" and lh.ky_than("Quan Quỷ") == "Tử Tôn"
    assert lh.nguyen_than("Phụ Mẫu") == "Quan Quỷ" and lh.ky_than("Phụ Mẫu") == "Thê Tài"
    assert lh.nguyen_than("Tử Tôn") == "Huynh Đệ" and lh.ky_than("Tử Tôn") == "Phụ Mẫu"
    assert lh.nguyen_than("Huynh Đệ") == "Phụ Mẫu" and lh.ky_than("Huynh Đệ") == "Quan Quỷ"


def test_phuc_than_que_don():
    """Thiên Sơn Độn (33, cung Càn) khuyết Tử Tôn và Thê Tài → phục dưới hào 1 (Tý) và hào 2 (Dần) của Bát thuần Càn."""
    q = kinhdich.khoi_que([8, 8, 7, 7, 7, 7])          # Cấn dưới, Càn trên
    assert q["quai_ban"]["so_king_wen"] == 33
    p = lh.phuc_than(q["quai_ban"])
    assert {x["luc_than"] for x in p} == {"Tử Tôn", "Thê Tài"}
    tt = next(x for x in p if x["luc_than"] == "Tử Tôn")
    assert tt["vi_tri"] == 1 and tt["dia_chi"] == "Tý" and tt["phi_than"] == "Phụ Mẫu"
    tai = next(x for x in p if x["luc_than"] == "Thê Tài")
    assert tai["vi_tri"] == 2 and tai["dia_chi"] == "Dần" and tai["phi_than"] == "Quan Quỷ"
    assert lh.phuc_than(kinhdich.khoi_que([7] * 6)["quai_ban"]) == []       # Bát thuần Càn đủ 5 lục thân


@pytest.mark.parametrize("goc,bien,loai", [
    ("Dần", "Mão", "tiến thần"), ("Mão", "Dần", "thoái thần"), ("Sửu", "Thìn", "tiến thần"), ("Tuất", "Sửu", "tiến thần"),
    ("Hợi", "Tý", "tiến thần"), ("Tý", "Hợi", "thoái thần"), ("Dần", "Dậu", "hồi đầu khắc"),
    ("Ngọ", "Dần", "hồi đầu sinh"), ("Dần", "Ngọ", "hoá tiết"), ("Dần", "Thìn", "hoá khắc xuất"),
    ("Tý", "Tý", "phục ngâm"), ("Tý", "Ngọ", "phản ngâm"),
])
def test_hoa_hao_dong(goc, bien, loai):
    assert lh.hoa(goc, bien)["loai"] == loai


def test_nhap_mo_va_nguyet_pha():
    assert lh.mo_cua("Mộc") == "Mùi" and lh.mo_cua("Hỏa") == "Tuất" and lh.mo_cua("Kim") == "Sửu"
    assert lh.mo_cua("Thủy") == "Thìn" and lh.mo_cua("Thổ") == "Thìn"
    assert lh.nguyet_pha("Hợi", "Tỵ") is True and lh.nguyet_pha("Hợi", "Ngọ") is False


def test_am_dong_va_nhat_pha():
    tg = {"chi_thang": "Tỵ", "can_ngay": "Giáp", "chi_ngay": "Tý", "tuan_khong": ["Tuất", "Hợi"]}
    # hào Ngọ Hoả tĩnh, tháng Tỵ vượng, bị ngày Tý xung → ám động
    a = lh.trang_thai_hao("Ngọ", "Hỏa", dong=False, tg=tg)
    assert a["am_dong"] is True and a["nhat_pha"] is False
    # hào Tý Thuỷ tĩnh, tháng Tỵ tử, bị ngày Ngọ xung → nhật phá
    tg2 = {**tg, "chi_ngay": "Ngọ"}
    b = lh.trang_thai_hao("Tý", "Thủy", dong=False, tg=tg2)
    assert b["nhat_pha"] is True and b["am_dong"] is False
    # hào động không tính ám động
    assert lh.trang_thai_hao("Ngọ", "Hỏa", dong=True, tg=tg)["am_dong"] is False
    # nhập mộ ngày: hào Mộc, ngày Mùi
    assert lh.trang_thai_hao("Dần", "Mộc", dong=False, tg={**tg, "chi_ngay": "Mùi"})["nhap_mo"] is True


def test_phan_tich_du_hao_va_dung_than():
    """Quẻ Lý (10, cung Cấn) động hào 6 → Đoài; ngày Giáp Tý tháng Tỵ. Phụ Mẫu ở hào 1 (Tỵ) và hào 4 (Ngọ)."""
    q = kinhdich.khoi_que([7, 7, 8, 7, 7, 9])
    tg = {"chi_thang": "Tỵ", "can_ngay": "Giáp", "chi_ngay": "Tý", "tuan_khong": ["Tuất", "Hợi"]}
    pt = lh.phan_tich(q, tg, "Phụ Mẫu", dt.datetime(2026, 5, 20, 10, 0))
    assert [h["luc_thu"] for h in pt["hao"]] == lh.luc_thu("Giáp")
    h6 = pt["hao"][5]
    assert h6["dong"] is True and h6["dia_chi"] == "Tuất" and h6["tuan_khong"] is True
    assert h6["hoa"]["dia_chi"] == "Mùi" and h6["hoa"]["loai"] == "thoái thần"      # Tuất → Mùi (Thổ) lùi
    d = pt["dung_than"]
    assert d["ten"] == "Phụ Mẫu" and [x["vi_tri"] for x in d["vi_tri"]] == [1, 4]
    assert d["vi_tri"][1]["am_dong"] is True            # Ngọ Hoả vượng tháng Tỵ, bị ngày Tý xung → ám động
    assert d["nguyen_than"]["ten"] == "Quan Quỷ" and d["ky_than"]["ten"] == "Thê Tài" and d["cuu_than"]["ten"] == "Tử Tôn"
    assert d["phuc"] is False
    assert pt["ung_ky"] and all({"chi", "ly_do", "ngay_gan_nhat"} <= set(x) for x in pt["ung_ky"])
    # dụng thần tĩnh ở Tỵ → ứng kỳ có ngày xung (Hợi) và ngày trị (Tỵ)
    chi = {x["chi"] for x in pt["ung_ky"]}
    assert "Hợi" in chi and "Tỵ" in chi


def test_ung_ky_ngay_gan_nhat_tat_dinh():
    # 20/05/2026 là ngày Giáp Ngọ: ngày Tuất gần nhất SAU đó là 24/05/2026, ngày Thìn là 30/05/2026.
    assert lh.ngay_gan_nhat("Tuất", dt.date(2026, 5, 20)).isoformat() == "2026-05-24"
    assert lh.ngay_gan_nhat("Thìn", dt.date(2026, 5, 20)).isoformat() == "2026-05-30"
    assert lh.ngay_gan_nhat("Ngọ", dt.date(2026, 5, 20)).isoformat() == "2026-06-01"   # cùng chi → 12 ngày sau


def test_dung_than_ung_khi_khong_co_luc_than():
    q = kinhdich.khoi_que([7, 7, 8, 7, 7, 9])
    tg = {"chi_thang": "Tỵ", "can_ngay": "Giáp", "chi_ngay": "Tý", "tuan_khong": ["Tuất", "Hợi"]}
    pt = lh.phan_tich(q, tg, "Ứng", dt.datetime(2026, 5, 20))
    assert pt["dung_than"]["ten"] == "Ứng" and [x["vi_tri"] for x in pt["dung_than"]["vi_tri"]] == [2]
