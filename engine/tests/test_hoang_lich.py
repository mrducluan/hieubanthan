# -*- coding: utf-8 -*-
"""HL-1 — Hoàng lịch ngày (trực, hoàng/hắc đạo, nghi/kỵ, thần sát, nhị thập bát tú, giờ hoàng đạo). Test viết TRƯỚC.

Golden: fixtures/golden/hoang_lich_golden.json — oracle lunar-python 1.4.8 (MIT), giờ Bắc Kinh (UTC+8): trọn năm
2026 + mỗi 97 ngày 1940–2080. Engine chạy tz=8 phải khớp từng ô; mặc định tz=7 (Việt Nam) chỉ khác ở ngày giao tiết
sát nửa đêm (tháng đổi sớm/muộn một ngày) — có test riêng.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import hoang_lich as hl

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "hoang_lich_golden.json")
               .read_text(encoding="utf-8"))["ngay"]


def _d(s: str) -> dt.date:
    return dt.date.fromisoformat(s)


@pytest.mark.parametrize("i", range(len(G)))
def test_khop_oracle(i):
    g = G[i]
    kq = hl.ngay(_d(g["d"]), tz=8.0)
    assert kq["thang_gz"] == g["thang"], g["d"]
    assert kq["ngay_gz"] == g["ngay"]
    assert kq["truc"] == g["truc"]
    assert kq["than"] == g["than"]
    assert kq["nghi"] == [x for x in g["nghi"] if x != "无"]
    assert kq["ky"] == [x for x in g["ky"] if x != "无"]
    assert kq["cat_than"] == [x for x in g["cat"] if x != "无"]
    assert kq["hung_sat"] == [x for x in g["hung"] if x != "无"]
    assert kq["tu"] == g["tu"]
    assert f"({kq['xung']['can']}{kq['xung']['chi']})" in g["xung"]
    assert kq["sat_phuong"] == g["sat"]
    assert kq["banh_to"] == g["bt"]
    assert [kq["huong"]["hy_than"], kq["huong"]["tai_than"], kq["huong"]["phuc_than"]] == g["huong"]
    assert kq["thai_than"] == g["thai"]
    assert [x["than"] for x in kq["gio"]] == g["gio"]


def test_hom_nay_khop_anh_chu_du_an():
    """13/10/2026 (ảnh aov.cc chủ dự án gửi): Canh Thân, trực Khai, Kim Quỹ hoàng đạo, xung Giáp Dần, sát Nam."""
    kq = hl.ngay(dt.date(2026, 10, 13))
    assert kq["ngay_gz"] == "庚申" and kq["thang_gz"] == "戊戌"
    assert kq["truc"] == "开" and kq["than"] == "金匮" and kq["hoang_dao"] is True
    assert kq["xung"] == {"can": "甲", "chi": "寅"} and kq["sat_phuong"] == "南"
    assert kq["nghi"][:3] == ["嫁娶", "祭祀", "祈福"] and kq["ky"] == ["安床", "安葬"]


def test_gio_hoang_dao_moi_ngay_sau_gio():
    for k in range(400):
        d = dt.date(2025, 1, 1) + dt.timedelta(days=k)
        assert sum(1 for x in hl.ngay(d)["gio"] if x["hoang_dao"]) == 6


def test_tz_viet_lech_trung_chi_o_ngay_giao_tiet():
    """Tháng (theo tiết) theo giờ VN có thể đổi sớm hơn giờ Bắc Kinh một ngày; mọi ngày khác giống nhau."""
    lech = 0
    for k in range(366 * 3):
        d = dt.date(2025, 1, 1) + dt.timedelta(days=k)
        a, b = hl.ngay(d, tz=7.0), hl.ngay(d, tz=8.0)
        assert a["ngay_gz"] == b["ngay_gz"] and a["tu"] == b["tu"]
        if a["thang_gz"] != b["thang_gz"]:
            lech += 1
            assert hl.ngay(d + dt.timedelta(days=1), tz=7.0)["thang_gz"] == hl.ngay(d + dt.timedelta(days=1), tz=8.0)["thang_gz"]
    assert lech <= 12


def test_ly_thuan_phong():
    # Tháng Giêng mùng 1, giờ Tý = Đại an; mỗi bước +1 vòng 6.
    assert hl.ly_thuan_phong(1, 1)[0] == "dai_an"
    assert hl.ly_thuan_phong(1, 1)[1] == "luu_lien"
    assert hl.ly_thuan_phong(1, 2)[0] == "luu_lien"
    assert hl.ly_thuan_phong(2, 1)[0] == "luu_lien"
    assert hl.ly_thuan_phong(6, 30)[0] == ["dai_an", "luu_lien", "toc_hy", "xich_khau", "tieu_cat", "khong_vong"][(5 + 29) % 6]
    assert len(hl.ly_thuan_phong(12, 15)) == 12


def test_ngay_ky_dan_gian():
    assert hl.ky_dan_gian(3, 1) == ["tam_nuong"]
    assert hl.ky_dan_gian(5, 2) == ["nguyet_ky"]
    assert hl.ky_dan_gian(13, 1) == ["tam_nuong", "duong_cong"]
    assert hl.ky_dan_gian(14, 4) == ["nguyet_ky"]
    assert hl.ky_dan_gian(29, 7) == ["duong_cong"]
    assert hl.ky_dan_gian(10, 10) == []


def test_quan_he_tuoi():
    assert hl.quan_he_tuoi("申", "寅") == "xung"
    assert hl.quan_he_tuoi("申", "子") == "tam_hop"
    assert hl.quan_he_tuoi("申", "巳") == "luc_hop"
    assert hl.quan_he_tuoi("申", "亥") == "hai"
    assert hl.quan_he_tuoi("申", "申") == "trung"
    assert hl.quan_he_tuoi("申", "卯") is None
