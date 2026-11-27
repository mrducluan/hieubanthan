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


# ---------------------------------------------------------------------------------------------------------------------
# Rà soát chuyên gia (R2): số liệu thế hệ khớp lịch thiên văn của chính engine, không lặp lời khuyên giữa các hành tinh
# cùng cung, thiên thể thế hệ nói rõ nghĩa riêng nằm ở nhà + góc chiếu, không còn lỗi gõ.
# ---------------------------------------------------------------------------------------------------------------------
_CA_NHAN = ("mat_troi", "mat_trang", "thuy_tinh", "kim_tinh", "hoa_tinh", "moc_tinh", "tho_tinh", "chiron")
_THE_HE = ("thien_vuong", "hai_vuong", "diem_vuong")


def _ba_gram(s: str, n: int = 3) -> set[str]:
    w = re.findall(r"\w+", s.lower())
    return {" ".join(w[i:i + n]) for i in range(len(w) - n + 1)}


@pytest.mark.parametrize("tien", ["", "en/"])
def test_cung_cap_hanh_tinh_khong_lap_loi_khuyen(tien):
    """Người có Mặt Trời, Mặt Trăng, Thổ tinh… cùng một cung không được đọc cùng một lời khuyên / cùng một điểm yếu ba lần."""
    d = _ht(tien)
    loi = []
    for c in d["cung_hoang_dao"]:
        for t in ("nen_de_y", "viec_ung_dung"):
            for a, b in combinations(_CA_NHAN, 2):
                sa, sb = d["hanh_tinh"][a]["theo_cung"][c][t], d["hanh_tinh"][b]["theo_cung"][c][t]
                ga, gb = _ba_gram(sa), _ba_gram(sb)
                if ga and gb and len(ga & gb) / min(len(ga), len(gb)) >= 0.34:
                    loi.append((c, t, a, b))
    assert not loi, loi


@pytest.mark.parametrize("tien", ["", "en/"])
def test_thien_the_the_he_noi_ro_nghia_rieng_o_nha_va_goc_chieu(tien):
    d = _ht(tien)
    tu = ("nhà", "góc chiếu") if tien == "" else ("house", "aspects")
    for ma in _THE_HE:
        for c, o in d["hanh_tinh"][ma]["theo_cung"].items():
            assert all(x in o["diem_sang"] for x in tu), (ma, c)


def test_so_nam_the_he_khop_lich_thien_van_cua_engine():
    """Câu "kéo dài khoảng … năm" của Mộc / Thổ / Thiên Vương / Hải Vương phải khớp thời gian ở lại một cung tính từ chính
    bảng lịch của engine (1925–2051), không viết theo trí nhớ."""
    import datetime as dt

    from app.calc import chiem_tinh_lich as lich

    def luu_tru(ma: str) -> list[float]:
        t, cuoi = dt.datetime(1925, 3, 1, 12), dt.datetime(2050, 12, 1)
        cao, moc = None, []
        while t < cuoi:
            lon, _ = lich.vi_tri_hanh_tinh(ma, t)
            ch = int(lon // 30) % 12
            if cao is None:
                cao = ch
            elif (ch - cao + 6) % 12 - 6 > 0:      # chỉ tính lần đầu chạm cung mới (bỏ nghịch hành quay lại)
                cao = ch
                moc.append(t)
            t += dt.timedelta(days=15)
        return [(b - a).days / 365.25 for a, b in zip(moc, moc[1:])][1:-1]

    d = _ht()["hanh_tinh"]
    mong = {"moc_tinh": (0.8, 1.3, "khoảng một năm"), "tho_tinh": (1.9, 3.2, "khoảng hai năm rưỡi"),
            "thien_vuong": (5.9, 7.6, "khoảng sáu đến bảy năm"), "hai_vuong": (11.9, 14.6, "khoảng mười hai đến mười bốn năm")}
    for ma, (thap, cao, cum) in mong.items():
        ds = sorted(luu_tru(ma))                   # nghịch hành làm vài khoảng đứt ngắn → xét trung vị, không xét cực trị
        trung_vi = ds[len(ds) // 2]
        assert ds and thap <= trung_vi <= cao and max(ds) <= cao * 1.1, (ma, trung_vi, max(ds))
        assert all(cum in o["diem_sang"] for o in d[ma]["theo_cung"].values()), ma


@pytest.mark.parametrize("tien", ["", "en/"])
def test_khong_loi_go_chu_lap_tu(tien):
    for s in _cac_chuoi(tien):
        for m in re.finditer(r"\b(\w+)\s+\1\b", s, re.I):
            assert m.group(0).lower() in ("song song", "năm năm"), (m.group(0), s)
        assert "lẹ làng" not in s and "thường thường" not in s
