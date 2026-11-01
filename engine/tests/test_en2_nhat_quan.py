# -*- coding: utf-8 -*-
"""EN-2 (mục 1): trong MỘT báo cáo, "năm nay" chỉ có một mức. Chương "Năm nay" (hộp lưu niên) và dòng Vận hạn của
năm đang xem phải cùng mức — trước đây hộp lưu niên lấy mức GỐC của cung lưu niên, Vận hạn chấm tứ hoá năm + đại hạn →
15/60 lá "Năm nay: Thuận lợi" mà dòng 10 năm lại "Cần lưu ý" ngay năm đó."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.luangiai import toan_bo

XEM = dt.date(2026, 10, 21)
_FX = Path(__file__).parents[1] / "fixtures" / "golden"
_TV = json.loads((_FX / "lasotuvi_60.json").read_text("utf-8"))["cases"]
_BT = json.loads((_FX / "battu_doi_song.json").read_text("utf-8"))["cases"]


def _c(bc, ma):
    return next(c for c in bc["chuong"] if c["ma"] == ma)


def _muc_nam(bc, dau):
    h = next((x for x in _c(bc, "nam_nay")["hop"] if x.get("ma_mau", "").startswith(dau) and x.get("muc")), None)
    return h and h["muc"]


@pytest.fixture(scope="module")
def bai_tv():
    return [toan_bo.tuvi({"ngay": dt.date.fromisoformat(c["ngay"]), "ti": c["ti"], "gioi_tinh": c["gioi_tinh"]},
                         ngay_xem=XEM) for c in _TV]


def test_tuvi_nam_nay_cung_muc_van_han(bai_tv):
    lech = []
    for i, bc in enumerate(bai_tv):
        dn = next(d for d in _c(bc, "van_han")["dong_nam"] if d["hien_tai"])
        m = _muc_nam(bc, "ds.nam_nay.luu_nien.")
        if m != dn["muc"]:
            lech.append((i, m, dn["muc"]))
    assert not lech, lech


def test_tuvi_tieu_han_khong_mang_chip_rieng(bai_tv):
    """Lớp tiểu hạn chỉ là chủ đề thêm — không mang chip mức riêng dễ ngược mức năm."""
    for bc in bai_tv:
        for h in _c(bc, "nam_nay")["hop"]:
            if h.get("ma_mau", "").startswith("ds.nam_nay.tieu_han."):
                assert not h.get("muc"), h


def test_battu_nam_nay_cung_muc_van_han():
    for c in _BT:
        bc = toan_bo.battu({"lich": dt.datetime.fromisoformat(c["lich"]), "gioi_tinh": c["gioi_tinh"]}, ngay_xem=XEM)
        dn = next(d for d in _c(bc, "van_han")["dong_nam"] if d["hien_tai"])
        assert _muc_nam(bc, "ds.bt.nam_nay.nam.") == dn["muc"]
