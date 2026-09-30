# -*- coding: utf-8 -*-
"""HH-3 — Bát tự (tứ trụ, tàng can, thập thần, đại vận). Test viết TRƯỚC.

Golden: fixtures/golden/battu.json (oracle lunar-typescript 1.8.6, sect 2, 42 ca; ca sát tiết bị
loại khi sinh để trụ năm/tháng không phụ thuộc chênh UTC+7/UTC+8). Giờ Tý bát tự:
SWITCH_AT_0000 — sinh 23:xx thuộc NGÀY HÔM ĐÓ; trụ giờ là Tý của ngày sau (dạ Tý, như sect 2).
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import battu as bt, tietkhi as tk

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "battu.json")
               .read_text(encoding="utf-8"))["cases"]
HAN_CAN = dict(zip("甲乙丙丁戊己庚辛壬癸", ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]))
HAN_CHI = dict(zip("子丑寅卯辰巳午未申酉戌亥", ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]))
HAN_TT = {"比肩": "Tỷ Kiên", "劫财": "Kiếp Tài", "食神": "Thực Thần", "伤官": "Thương Quan", "偏财": "Thiên Tài",
          "正财": "Chính Tài", "七杀": "Thất Sát", "正官": "Chính Quan", "偏印": "Thiên Ấn", "正印": "Chính Ấn",
          "日主": "Nhật chủ"}


def _gz(s: str) -> str:
    return f"{HAN_CAN[s[0]]} {HAN_CHI[s[1]]}"


def _chay(inp: dict) -> dict:
    y, m, d = (int(x) for x in inp["ngay"].split("-"))
    h, mi = (int(x) for x in inp["gio"].split(":"))
    return bt.la_so(dt.datetime(y, m, d, h, mi), inp["gioi_tinh"])


@pytest.mark.parametrize("i", range(len(G)))
def test_tu_tru_tang_can_thap_than(i):
    g, kq = G[i]["expect"], _chay(G[i]["input"])
    assert [f"{t['can']} {t['chi']}" for t in kq["tru"]] == [_gz(x) for x in g["tru"]]
    assert kq["tang_can"] == [[HAN_CAN[c] for c in x] for x in g["tang_can"]]
    assert kq["thap_than_can"] == [HAN_TT[x] for x in g["thap_than_can"]]
    assert kq["thap_than_chi"] == [[HAN_TT[t] for t in x] for x in g["thap_than_chi"]]


@pytest.mark.parametrize("i", range(len(G)))
def test_dai_van(i):
    g, kq = G[i]["expect"], _chay(G[i]["input"])
    dv = kq["dai_van"]
    assert dv["thuan"] == g["dai_van_thuan"]
    assert [f"{x['can']} {x['chi']}" for x in dv["ds"]] == [_gz(x) for x in g["dai_van"]]
    kv, gk = dv["khoi_van"], g["khoi_van"]
    nam = lambda k: k["nam"] + k["thang"] / 12 + k["ngay"] / 365          # noqa: E731
    assert abs(nam(kv) - nam(gk)) < 0.03          # chênh UTC+7/UTC+8 = 1 giờ ≈ 5 ngày tuổi vận
    ngay_goc = dt.date.fromisoformat(gk["ngay_duong"])
    assert abs((dt.date.fromisoformat(dv["ngay_khoi"]) - ngay_goc).days) <= 12


def test_lap_xuan_doi_tru_nam():
    lx = tk.thoi_diem(2024, 315) + dt.timedelta(hours=7)          # giờ Việt Nam
    truoc = bt.la_so(lx - dt.timedelta(minutes=30), "nam")["tru"][0]
    sau = bt.la_so(lx + dt.timedelta(minutes=30), "nam")["tru"][0]
    assert (truoc["can"], truoc["chi"]) == ("Quý", "Mão") and (sau["can"], sau["chi"]) == ("Giáp", "Thìn")


def test_sat_tiet_gan_co():
    lx = tk.thoi_diem(2024, 315) + dt.timedelta(hours=7)
    co = bt.la_so(lx + dt.timedelta(minutes=20), "nam")["co_canh_bao"]
    assert any(c["loai"] == "tiet_edge" for c in co)


def test_da_ty_gan_co_va_theo_chinh_sach():
    kq = bt.la_so(dt.datetime(1995, 6, 15, 23, 30), "nam")
    assert kq["tru"][2]["can"] == "Đinh"               # ngày hôm đó (SWITCH_AT_0000)
    assert any(c["loai"] == "da_ty" for c in kq["co_canh_bao"])


def test_ngu_hanh_than_vuong_thang_diem_cong_bo():
    kq = bt.la_so(dt.datetime(1990, 5, 17, 12, 30), "nam")    # Canh Ngọ · Tân Tỵ · Nhâm Ngọ · Bính Ngọ
    nh = kq["ngu_hanh"]
    assert set(nh["diem"]) == {"Kim", "Mộc", "Thủy", "Hỏa", "Thổ"}
    assert nh["diem"]["Hỏa"] == max(nh["diem"].values())
    assert kq["nhat_chu"] == {"can": "Nhâm", "ngu_hanh": "Thủy", "am_duong": "Dương"}
    th = kq["than"]
    assert th["ket_luan"] == "nhược" and 0 <= th["ti_le"] <= 1 and th["thang_diem"]


def test_dung_than_hai_cach_khong_tu_chon():
    kq = bt.la_so(dt.datetime(1990, 5, 17, 12, 30), "nam")
    d = kq["dung_than"]
    assert d["phu_uc"]["hanh"] == ["Kim", "Thủy"]      # thân nhược → Ấn, Tỷ Kiếp
    assert d["dieu_hau"]["hanh"] == ["Thủy"]           # sinh mùa hạ (tháng Tỵ)
    assert d["cach_cuc"]["ten"] and d["chon"] is None


def test_luu_nien():
    ln = bt.luu_nien(bt.la_so(dt.datetime(1990, 5, 17, 12, 30), "nam"), 2026)
    assert (ln["can"], ln["chi"]) == ("Bính", "Ngọ") and ln["thap_than"] == "Thiên Tài"
    assert ln["voi_tru_ngay"] == "phục ngâm (trùng chi)"
