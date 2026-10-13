# -*- coding: utf-8 -*-
"""HL-1 — tầng ghép hoàng lịch: mọi mã đều có tên Việt trong KB, không lọt chữ Hán ra trường hiển thị,
không dùng lời doạ, chọn ngày theo việc đúng bảng nghi/kỵ, hợp tuổi theo năm sinh (Lập xuân)."""
from __future__ import annotations

import datetime as dt
import re

import pytest

from app.calc import hoang_lich as hl
from app.luangiai import hoang_lich as L

HAN = re.compile(r"[一-鿿]")
CAM = ("đại hung", "chết", "tai hoạ", "tai họa", "xui xẻo", "đen đủi", "giải hạn", "nguy hiểm", "mất mạng", "bệnh nặng")


def _chu(o, bo_qua=("han", "ma", "ma_viec")):
    if isinstance(o, dict):
        for k, v in o.items():
            if k not in bo_qua:
                yield from _chu(v, bo_qua)
    elif isinstance(o, list):
        for v in o:
            yield from _chu(v, bo_qua)
    elif isinstance(o, str):
        yield o


@pytest.mark.parametrize("k", range(0, 366, 3))
def test_khong_lot_chu_han_va_khong_doa(k):
    d = dt.date(2026, 1, 1) + dt.timedelta(days=k)
    kq = L.ngay_xem(d, nam_sinh=1990, gioi_tinh="nam")
    for s in _chu(kq):
        assert not HAN.search(s), (d, s)
        assert not any(c in s.lower() for c in CAM), (d, s)


def test_moi_ma_co_ten():
    for k in range(366 * 2):
        d = dt.date(2025, 1, 1) + dt.timedelta(days=k)
        c = hl.ngay(d)
        for m in c["nghi"] + c["ky"]:
            assert m in L.KB["nghi_ky"], m
        for m in c["cat_than"] + c["hung_sat"]:
            assert m in L.KB["than_sat"], m
        assert c["tu"] in L.KB["tu"] and c["truc"] in L.KB["truc"] and c["than"] in L.KB["than"]


def test_the_ngay_13_10_2026():
    kq = L.ngay_xem(dt.date(2026, 10, 13))
    assert kq["can_chi"]["ngay"] == "Canh Thân" and kq["can_chi"]["thang"] == "Mậu Tuất"
    assert kq["truc"]["ten"] == "Khai" and kq["than"]["ten"] == "Kim Quỹ" and kq["hoang_dao"] is True
    assert kq["xung_tuoi"]["ten"] == "Giáp Dần" and kq["sat"] == "Nam"
    assert "Cưới hỏi" in [x["ten"] for x in kq["nghi"]] and "An táng" in [x["ten"] for x in kq["ky"]]
    assert len(kq["gio_hoang_dao"]) == 6 and kq["gio_hoang_dao"][0]["khung"] == "23:00–00:59"
    assert kq["am"]["ngay"] == 4 and kq["am"]["thang"] == 9


def test_hop_tuoi_theo_lap_xuan():
    # Sinh 20/01/1990 (trước Lập xuân) → tuổi Kỷ Tỵ; ngày Hợi xung Tỵ.
    d = next(dt.date(2026, 10, 1) + dt.timedelta(days=i) for i in range(12)
             if hl.ngay(dt.date(2026, 10, 1) + dt.timedelta(days=i))["ngay_gz"][1] == "亥")
    kq = L.ngay_xem(d, nam_sinh=1990, thang_sinh=1, ngay_sinh=20)
    assert kq["tuoi"]["can_chi"] == "Kỷ Tỵ" and kq["tuoi"]["quan_he"]["ma"] == "xung"
    kq2 = L.ngay_xem(d)
    assert kq2["tuoi"] is None


def test_chon_ngay_theo_viec():
    ds = L.chon_ngay("cuoi_hoi", dt.date(2026, 11, 1), dt.date(2026, 11, 30))
    assert ds["viec"]["ten"] == "Cưới hỏi"
    assert len(ds["ngay"]) >= 1
    ma = set(next(v for v in L.KB["viec"] if v["ma"] == "cuoi_hoi")["nghi"])
    for x in ds["ngay"]:
        c = hl.ngay(dt.date.fromisoformat(x["ngay"]))
        assert ma & set(c["nghi"]) and not (ma & set(c["ky"]))
        assert c["truc"] not in ("破", "闭") and not ({"tam_nuong", "nguyet_ky", "duong_cong"} & set(c["ky_dan_gian"]))
    with pytest.raises(KeyError):
        L.chon_ngay("khong_co", dt.date(2026, 11, 1), dt.date(2026, 11, 30))


def test_chon_ngay_loai_ngay_xung_tuoi():
    ds = L.chon_ngay("khai_truong", dt.date(2026, 1, 1), dt.date(2026, 3, 31), nam_sinh=1988, thang_sinh=6, ngay_sinh=1)
    for x in ds["ngay"]:
        assert x["quan_he_tuoi"] != "xung"


def test_thang_42_o():
    t = L.thang(2026, 10)
    assert len(t["ngay"]) == 31 and t["ngay"][12]["ngay"] == "2026-10-13"
    assert t["ngay"][12]["hoang_dao"] is True and t["ngay"][12]["am"] == "4/9"


def test_ngay_mai_va_gio_sap_toi():
    kq = L.ngay_xem(dt.date(2026, 10, 13))
    assert kq["ngay_mai"]["ngay"] == "2026-10-14" and kq["ngay_mai"]["truc"]
    assert kq["ngay_tot_gan"] is None or kq["ngay_tot_gan"]["ngay"] > "2026-10-13"


def test_co_ngay_dep_trong_thang():
    t = L.thang(2026, 11)
    for n in t["ngay"]:
        c = hl.ngay(dt.date.fromisoformat(n["ngay"]))
        assert n["dep"] == bool(c["hoang_dao"] and c["truc"] in L.TRUC_TOT and not c["ky_dan_gian"])
    assert any(n["dep"] for n in t["ngay"])
