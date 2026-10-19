# -*- coding: utf-8 -*-
"""TV-V2 — RULES định chuẩn giờ sinh (luangiai/tuvi_dinh_gio.py). Viết TRƯỚC hàm.
Ứng viên giờ trước / đã nhập / sau (hoặc 12 canh); câu hỏi đối chiếu theo cung Kỵ lưu niên nhập + chiếu và cung
Lộc nhập của những năm người dùng nhớ rõ. Không lưu, không câu hỏi sức khoẻ."""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import lunar, tuvi_an_sao as az, tuvi_phi_hoa as ph
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_phi_hoa_kb as pkb
from app.luangiai import tuvi_dinh_gio as dg

NGAY = dt.date(1990, 5, 15)


def _uv(ti: int, nhan: str, nhap: bool = False, ngay: dt.date = NGAY) -> dict:
    return {"nhan": nhan, "gio_dai_dien": f"{(2 * ti) % 24:02d}:30", "la_gio_nhap": nhap,
            "sinh": {"ngay": ngay, "ti": ti, "gioi_tinh": "nam"}}


def test_ly_do():
    assert dg.ly_do(11, 10, "exact") == ["gan_ranh_gio"]
    assert dg.ly_do(12, 50, "exact") == ["gan_ranh_gio"]
    assert dg.ly_do(23, 5, "exact") == ["gan_ranh_gio"]
    assert dg.ly_do(12, 5, "exact") == []
    assert dg.ly_do(12, 5, "approx") == ["ang_chung"]
    assert dg.ly_do(11, 0, "unknown") == ["gan_ranh_gio", "khong_biet"]


def test_khoang_gio():
    assert dg.khoang_gio(0) == "23:00–00:59"
    assert dg.khoang_gio(6) == "11:00–12:59"
    assert dg.khoang_gio(11) == "21:00–22:59"


def test_nam_mac_dinh():
    assert dg.nam_mac_dinh(dt.date(2026, 10, 19)) == [2023, 2024, 2025]
    assert dg.nam_mac_dinh(dt.date(2026, 2, 10)) == [2022, 2023, 2024]     # trước Tết Bính Ngọ (17/02/2026)


def test_lap_ba_ung_vien():
    r = dg.lap([_uv(0, "Giờ trước"), _uv(1, "Giờ đã nhập", True), _uv(2, "Giờ sau")], [2023, 2024], ["gan_ranh_gio"])
    assert r["ly_do"] == ["gan_ranh_gio"]
    assert [u["nhan"] for u in r["ung_vien"]] == ["Giờ trước", "Giờ đã nhập", "Giờ sau"]
    assert [u["la_gio_nhap"] for u in r["ung_vien"]] == [False, True, False]
    assert [u["chi_gio"] for u in r["ung_vien"]] == ["Tý", "Sửu", "Dần"]
    for u, ti in zip(r["ung_vien"], (0, 1, 2)):
        ls = tom_tat(az.an_sao_tho(NGAY, ti, "nam", "vi-VN"))
        menh = next(c for c in ls["cung"] if c["ten"] == "Mệnh")
        assert u["cung_menh"] == {"chi": menh["chi"], "chinh_tinh": [s["ten"] for s in menh["chinh_tinh"]]}
        assert u["cuc"] == ls["cuc"]
        assert u["than_cu"] == next(c["ten"] for c in ls["cung"] if c["la_than"])
        assert [n["nam"] for n in u["nam"]] == [2023, 2024]
        for n in u["nam"]:
            can, chi = lunar.can_chi_nam(n["nam"])
            assert n["can_chi"] == f"{can} {chi}"
            bay = {x["hoa"]: x for x in ph.phi_tu_can(can, ls["cung"])}
            mong = []
            for c in (bay["Kỵ"]["den_cung"], bay["Kỵ"]["xung_cung"], bay["Lộc"]["den_cung"]):
                if c not in mong:
                    mong.append(c)
            assert [q["cung"] for q in n["cau_hoi"]] == mong
            for q in n["cau_hoi"]:
                assert q["hoa"] in ("Kỵ", "Lộc") and q["cach"] in ("nhap", "chieu")
                assert str(n["nam"]) in q["noi_dung"]
                assert "bệnh" not in q["noi_dung"].lower()
    # giờ liền kề đổi cung Mệnh → khác nhau được liệt kê
    assert any("Mệnh" in s for s in r["khac_nhau"])
    assert r["luu_y"]


def test_lap_12_canh():
    r = dg.lap([_uv(i, f"Giờ {lunar.CHI[i]}", i == 1) for i in range(12)], [2024], [])
    assert len(r["ung_vien"]) == 12
    assert len({u["cung_menh"]["chi"] for u in r["ung_vien"]}) == 12     # mỗi canh giờ một cung Mệnh


def test_nam_qua_nhieu():
    with pytest.raises(ValueError):
        dg.lap([_uv(1, "Giờ đã nhập", True)], [2020, 2021, 2022, 2023], [])


def test_khong_kb(monkeypatch):
    monkeypatch.setattr(pkb, "_d", lambda: {})
    r = dg.lap([_uv(1, "Giờ đã nhập", True)], [2024], [])
    assert r["ung_vien"][0]["nam"][0]["cau_hoi"]
    assert r["khac_nhau"]          # một ứng viên: vẫn có câu giải thích
