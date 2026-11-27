# -*- coding: utf-8 -*-
"""Chiêm tinh: lời từng thiên thể × 12 cung, Thiên Đỉnh × 12 cung và 12 Nhà phải viết riêng (không còn một câu khuôn đổi tên
cung), không dính cụm giọng AI / doạ (`cum_cam` chung mọi mảng), bản Anh không chữ Việt và không dính `cum_cam_en`."""
from __future__ import annotations

import json
import re
from itertools import combinations
from pathlib import Path

import pytest

from app.kb.tuvi_doi_song_kb import tim_cum_cam
from app.luangiai.doi_song_khuon import cum_cam_chung

KB = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_TRUONG = ("diem_sang", "nen_de_y", "viec_ung_dung")
# Dấu vết câu khuôn cũ (Chặng 4.2): không được còn ở bất kỳ ô nào.
_KHUON = ("mang sắc thái", "Nuôi dưỡng", "nên giữ nhịp điều độ để nét", "xoay quanh", "phát triển qua nét",
          "operates through", "Channel ", "pace yourself so", "centers on", "mature through")


def _doc(ten: str) -> dict:
    return json.loads((KB / ten).read_text(encoding="utf-8"))


def _ht(tien: str = "") -> dict:
    return _doc(tien + "chiem_tinh_hanh_tinh_cung_kb.json")


def _nha(tien: str = "") -> dict:
    return _doc(tien + "chiem_tinh_nha_kb.json")


def _cung(d: dict) -> list[str]:
    return list(d["cung_hoang_dao"])


def _cac_chuoi(tien: str) -> list[str]:
    d, n = _ht(tien), _nha(tien)
    ra = [o[t] for h in d["hanh_tinh"].values() for o in h["theo_cung"].values() for t in _TRUONG]
    ra += [n["nha"][k]["y_chinh"] for k in n["nha"]]
    ra += [n["truc_goc"][tr][c] for tr in ("asc", "mc") for c in _cung(d)]
    return ra


@pytest.mark.parametrize("tien", ["", "en/"])
def test_moi_thien_the_viet_rieng_tung_cung(tien):
    d = _ht(tien)
    cung = _cung(d)
    for ma, h in d["hanh_tinh"].items():
        assert set(h["theo_cung"]) == set(cung), ma
        for t in _TRUONG:
            ds = [h["theo_cung"][c][t] for c in cung]
            assert all(s.strip() for s in ds), (ma, t)
            trung = [(a, b) for a, b in combinations(range(12), 2) if ds[a] == ds[b]]
            assert not trung, (ma, t, trung)
        # Bỏ tên cung đi mà ô vẫn giống nhau = vẫn là khuôn đổi tên.
        bo_ten = []
        for c in cung:
            o = " ".join(h["theo_cung"][c][t] for t in _TRUONG)
            bo_ten.append(o.replace(d["cung_hoang_dao"][c]["ten"], "_"))
        assert len(set(bo_ten)) == 12, ma


@pytest.mark.parametrize("tien", ["", "en/"])
def test_thien_dinh_cung_moc_va_12_nha_viet_rieng(tien):
    d, n = _ht(tien), _nha(tien)
    for tr in ("asc", "mc"):
        ds = [n["truc_goc"][tr][c].split(":", 1)[1] for c in _cung(d)]
        assert len(set(ds)) == 12, tr
    y = [n["nha"][str(k)]["y_chinh"] for k in range(1, 13)]
    assert len(set(y)) == 12
    for k in range(1, 13):
        assert n["nha"][str(k)]["y_chinh"] != n["nha"][str(k)]["linh_vuc"]


@pytest.mark.parametrize("tien", ["", "en/"])
def test_khong_con_cau_khuon_cu(tien):
    for s in _cac_chuoi(tien):
        for k in _KHUON:
            assert k not in s, (k, s)


def test_ban_viet_khong_cum_cam():
    ds = cum_cam_chung()
    loi = [(c, s) for s in _cac_chuoi("") for c in tim_cum_cam(s, ds)]
    assert not loi, loi[:5]


def test_ban_anh_sach_chu_viet_va_cum_cam_en():
    mau = [re.compile(x, re.I) for x in _doc("thuat_ngu_en.json")["cum_cam_en"]]
    ten_cung = [v["ten"] for v in _ht("en/")["cung_hoang_dao"].values()]   # "Cancer" là tên cung, không phải tên bệnh
    for s in _cac_chuoi("en/"):
        assert not _VIET.search(s), s
        bo = s
        for t in ten_cung:
            bo = bo.replace(t, "_")
        for m in mau:
            assert not m.search(bo), (m.pattern, s)


@pytest.mark.parametrize("tien,trang_thai", [("", "nhap_ai_cho_duyet"), ("en/", "nhap_may")])
def test_giu_nguon_va_trang_thai(tien, trang_thai):
    for d in (_ht(tien), _nha(tien)):
        assert d["_trang_thai"] == trang_thai
        assert d["source_id"] == "bien_tap_chiem_tinh_2026" and d["school_id"] == "chiem_tinh_tay"
    for o in _nha("")["nha"].values():
        assert o["source_id"] and o["school_id"]


def test_ban_viet_va_ban_anh_cung_khung():
    vi, en = _ht(), _ht("en/")
    for ma in vi["hanh_tinh"]:
        assert set(vi["hanh_tinh"][ma]["theo_cung"]) == set(en["hanh_tinh"][ma]["theo_cung"])
        for c in vi["hanh_tinh"][ma]["theo_cung"]:
            assert set(vi["hanh_tinh"][ma]["theo_cung"][c]) == set(en["hanh_tinh"][ma]["theo_cung"][c])
    assert set(_nha()["nha"]) == set(_nha("en/")["nha"])
