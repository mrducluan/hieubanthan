# -*- coding: utf-8 -*-
"""EN-5.3 — Thai nguyên, Mệnh cung, Thân cung, tiểu vận Bát tự (viết TRƯỚC hàm trong `calc/battu_mo_rong.py`).
Golden: `fixtures/golden/battu_cung.json` (oracle lunar-typescript, 42 ca của battu.json, sect 2)."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import battu as bt, battu_mo_rong as mr

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "battu_cung.json").read_text(encoding="utf-8"))["cases"]
HAN = dict(zip("甲乙丙丁戊己庚辛壬癸", mr.CAN)) | dict(zip("子丑寅卯辰巳午未申酉戌亥", mr.CHI))


def _vn(gz: str) -> str:
    return f"{HAN[gz[0]]} {HAN[gz[1]]}"


def _ls(inp: dict) -> dict:
    y, m, d = (int(x) for x in inp["ngay"].split("-"))
    h, mi = (int(x) for x in inp["gio"].split(":"))
    return bt.la_so(dt.datetime(y, m, d, h, mi), inp["gioi_tinh"])


def _gz(x: dict) -> str:
    return f"{x['can']} {x['chi']}"


@pytest.mark.parametrize("i", range(len(G)))
def test_khop_oracle(i):
    g = G[i]["expect"]
    ls = _ls(G[i]["input"])
    assert [_gz(t) for t in ls["tru"]] == [_vn(x) for x in g["tru"]]
    c = mr.cung_than(ls)
    assert _gz(c["thai_nguyen"]) == _vn(g["thai_nguyen"])
    assert _gz(c["menh_cung"]) == _vn(g["menh_cung"])
    assert _gz(c["than_cung"]) == _vn(g["than_cung"])
    assert [_gz(mr.tieu_van(ls, x["tuoi_mu"])) for x in g["tieu_van"]] == [_vn(x["gz"]) for x in g["tieu_van"]]


def test_nap_am_kem_theo():
    c = mr.cung_than(_ls({"ngay": "1990-05-17", "gio": "12:30", "gioi_tinh": "nam"}))
    for k in ("thai_nguyen", "menh_cung", "than_cung"):
        assert c[k]["nap_am"]


def test_tieu_van_chi_truoc_khoi_van():
    ls = _ls({"ngay": "1990-05-17", "gio": "12:30", "gioi_tinh": "nam"})
    ds = mr.cac_tieu_van(ls)
    khoi = ls["dai_van"]["ds"][0]["tu_nam"]
    assert ds and all(x["nam"] < khoi for x in ds)
    assert ds[0]["tuoi_mu"] == 1 and ds[0]["nam"] == 1990


def test_than_sat_thien_y_ham_tri():
    # Thiên Y = chi đứng trước chi tháng một cung (tháng Tỵ → Thìn); Hàm Trì là tên khác của Đào Hoa
    ts = {x["ten"]: x for x in mr.than_sat([{"can": "Giáp", "chi": "Thìn"}, {"can": "Kỷ", "chi": "Tỵ"},
                                             {"can": "Bính", "chi": "Tý"}, {"can": "Mậu", "chi": "Thìn"}])}
    assert ts["Thiên Y"]["tru"] == [0, 3]
    assert "Hàm Trì" in mr._Y["Đào Hoa"][1]


SINH = {"lich": dt.datetime(2022, 3, 5, 9, 0), "gioi_tinh": "nu"}


@pytest.mark.parametrize("cau,khoa", [("Mệnh cung của tôi là gì?", "Mệnh cung của bạn là Canh Tuất"),
                                      ("Thai nguyên của tôi?", "Thai nguyên của bạn là Quý Tỵ"),
                                      ("Tiểu vận của tôi thế nào?", "Tiểu vận của bạn"),
                                      ("Thân cung trong bát tự của tôi", "Thân cung của bạn là")])
def test_hoi_dap_cung_than(cau, khoa):
    from app.hoidap import battu as hd
    r = hd.tra_loi(cau, sinh=SINH, ngay_xem=dt.date(2026, 11, 1), dung_llm=False)
    assert r["phan_loai"]["chu_de"] == "cung_than"
    assert khoa in r["cau_tra_loi"]


def test_hoi_dap_ham_tri_la_dao_hoa():
    from app.hoidap import battu as hd
    r = hd.tra_loi("Bát tự tôi có Hàm Trì không?", sinh=SINH, ngay_xem=dt.date(2026, 11, 1), dung_llm=False)
    assert r["phan_loai"]["chu_de"] == "than_sat" and "Hàm Trì" in r["cau_tra_loi"]


@pytest.mark.parametrize("cau,khong_phai", [
    ("Bản thân cũng không biết nên làm nghề gì, tứ trụ tôi hợp nghề nào?", "cung_than"),
    ("Tôi mệnh Kim, chồng mệnh cũng Kim thì hôn nhân thế nào?", "cung_than"),
    ("Tôi sinh ở Thái Nguyên, bát tự tôi hợp nghề gì?", "cung_than"),
    ("Anh ấy có thiện ý với tôi không, tứ trụ tôi duyên thế nào?", "than_sat")])
def test_khong_bat_nham_chu_thuong(cau, khong_phai):
    """Code-review EN-5: chữ trùng khi bỏ dấu không được kéo câu sang chủ đề mới."""
    from app.hoidap import battu as hd
    assert hd.phan_loai(cau)["chu_de"] != khong_phai


@pytest.mark.parametrize("cau", ["menh cung cua toi la gi", "xem thai nguyen cua minh", "tieu van cua toi"])
def test_go_khong_dau_van_nhan(cau):
    from app.hoidap import battu as hd
    assert hd.phan_loai(cau)["chu_de"] == "cung_than"
