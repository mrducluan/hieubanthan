# -*- coding: utf-8 -*-
"""TK-1 — kho nguồn bổ sung 17/11/2026: tám sách tiếng Anh thuộc phạm vi công cộng (thần số, chỉ tay, Kinh Dịch bản Legge)
và sách mệnh lý bản Tứ khố đủ bộ. Mới là KHO NGUỒN: chưa đổi KB, phép tính, lời hiển thị."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

from app.kb import sach_ghi

GOC = Path(__file__).resolve().parents[1]
NGUON = GOC / "fixtures" / "nguon"
_spec = importlib.util.spec_from_file_location("nap_archive_en", GOC / "scripts" / "nap_archive_en.py")
nap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(nap)


def _doc(ten: str) -> dict:
    return json.loads((NGUON / f"{ten}.json").read_text("utf-8"))


@pytest.mark.parametrize("ma", sorted(nap.SACH))
def test_sach_tieng_anh_du_khuon_va_la_pham_vi_cong_cong(ma):
    d, s = _doc(ma), nap.SACH[ma]
    assert d["can_doi_chieu"] is True and d["ngon_ngu"] == "en" and d["source_id"] == ma
    assert s["nam"] < 1929 and s["mat"] <= 1955, "chỉ nạp sách in trước 1929, tác giả mất trên 70 năm"
    assert d["so_chu"] > 10_000 and len(d["chuong"]) >= 1
    assert all(c["doan"] and all(isinstance(x, str) and x for x in c["doan"]) for c in d["chuong"])


@pytest.mark.parametrize("ma,cum", [
    ("thanso_cheiro_book_of_numbers_1926", ["THE NUMBER 2", "compound numbers", "Chaldean"]),
    ("thanso_balliett_philosophy_1908", ["vibration", "Pythagoras"]),
    ("thanso_sepharial_kabala", ["Kabala", "unit value"]),
    ("thanso_westcott_numbers_1911", ["Monad", "Pythagoreans"]),
    ("chi_tay_cheiro_language_of_the_hand", ["Line of Head", "Line of Life", "Mount of"]),
    ("chi_tay_benham_laws_1900", ["Mount of Jupiter", "Life line", "Saturnian"]),
    ("kinhdich_legge_1899", ["Khien", "great and originating", "superior man"]),
])
def test_sach_tieng_anh_co_noi_dung_cot_loi(ma, cum):
    chu = " ".join(x for c in _doc(ma)["chuong"] for x in c["doan"]).lower()
    assert [k for k in cum if k.lower() not in chu] == []


def test_bo_don_chu_ocr_khong_sua_chu_sach():
    doan = nap.don("12\n\nCHAPTER  IV\n\nTHE  NUM-\nber of the  beast\nis here.\n\nxiv\n\nNext 漢 para")
    assert doan == ["CHAPTER IV", "THE NUMber of the beast is here.", "Next para"]
    ch = nap.chia_chuong(["tựa", "CHAPTER IV", "THE NUMBER 3", "thân"])
    assert [(c["so"], c["ten"]) for c in ch] == [("", "dau_sach"), ("Chapter IV", "THE NUMBER 3")]


def test_tam_menh_du_bo_12_quyen_va_chua_tron_ban_34_thien_dang_dung():
    du = _doc("tam_menh_thong_hoi_du_bo")
    assert len(du["thien"]) == 12 and du["can_doi_chieu"] is True
    tat = sach_ghi.chuan("".join(t["van"] for t in du["thien"]))
    thieu = [t["ten"] for t in _doc("tam_menh_thong_hoi")["thien"] if sach_ghi.chuan(t["van"])[:60] not in tat]
    assert thieu == [], f"thiên bản cũ không thấy trong bản đủ bộ: {thieu}"
    assert sach_ghi.chuan("元理賦") in tat          # quyển 12 — bản Wikisource thiếu quyển 10–12


def test_menh_ly_duong_tong_du_sau_sach():
    d = _doc("menh_ly_duong_tong")
    assert {s["ten_han"] for s in d["sach"].values()} == {"李虛中命書", "玉照定真經", "珞琭子賦注", "珞琭子三命消息賦注", "三命指迷賦", "星命總括"}
    assert all(len(t["van"]) > 500 for t in d["thien"])
