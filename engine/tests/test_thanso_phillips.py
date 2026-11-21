# -*- coding: utf-8 -*-
"""Đợt 2A — Kiểm định Thần số học trường phái David A. Phillips (golden, bất biến 1.000 ngày sinh, giọng văn & API)."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import thanso, thanso_phillips as tp
from app.kb import sach_ghi as sg, tuvi_doi_song_kb as kds
from app.main import app

_GOC = Path(__file__).resolve().parents[1]
_GOLDEN = json.loads((_GOC / "fixtures" / "golden" / "thanso_phillips.json").read_text("utf-8"))
_KB_PATH = _GOC / "app" / "kb" / "data" / "thanso_phillips_kb.json"
client = TestClient(app)


@pytest.mark.parametrize("ca", _GOLDEN["so_chu_dao"], ids=lambda c: c["mo_ta"])
def test_so_chu_dao_khop_golden(ca):
    r = tp.so_chu_dao(ca["ngay"], ca["thang"], ca["nam"])
    assert r["nhan"] == ca["nhan"]
    assert r["tong_goc"] == ca["tong_goc"]
    assert r["goc"] == ca["goc"]


@pytest.mark.parametrize("ca", _GOLDEN["kim_tu_thap"], ids=lambda c: c["mo_ta"])
def test_kim_tu_thap_khop_golden(ca):
    k = tp.bon_dinh_kim_tu_thap(ca["ngay"], ca["thang"], ca["nam"], nam_xem=1960)
    assert k["chan_de"] == ca["chan_de"]
    assert [p["so"] for p in k["dinh"]] == ca["dinh"]
    assert [p["tuoi"] for p in k["dinh"]] == ca["tuoi"]


def test_bat_bien_1000_ngay_sinh_nam_ca_nhan_luon_bang_9():
    """Bất biến toán học của Phillips: 11 số chủ đạo {2..9,10,11,22/4} không bao giờ ra 1 hay 33;
    và cả 4 năm mốc đỉnh Kim Tự Tháp luôn rơi đúng vào Năm Cá Nhân dương lịch số 9."""
    hop_le = {"2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "22/4"}
    d0 = dt.date(1970, 1, 1)
    for i in range(1000):
        day = d0 + dt.timedelta(days=i * 19)
        scd = tp.so_chu_dao(day.day, day.month, day.year)
        assert scd["nhan"] in hop_le
        assert scd["so"] not in (1, 33)
        k = tp.bon_dinh_kim_tu_thap(day.day, day.month, day.year)
        for p in k["dinh"]:
            ncn = thanso.nam_ca_nhan(day.day, day.month, p["nam"], "duong_lich")
            assert ncn == 9, f"{day} đỉnh {p['dinh']} năm {p['nam']}: NCN={ncn} != 9"


def test_kb_phillips_du_muc_va_khong_tu_cam():
    kb = json.loads(_KB_PATH.read_text("utf-8"))
    assert set(kb["so_chu_dao"].keys()) == {"2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "22/4"}
    assert set(kb["dinh_cao"].keys()) == {str(i) for i in range(1, 12)}
    cam, cum = kds.cum_cam(), kds.cum_chung_chung()

    def _walk(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for k, v in x.items():
                if not k.startswith("_") and k not in ("source_id", "school_id", "sach_ghi", "sach_goc"):
                    yield from _walk(v)
        elif isinstance(x, list):
            for v in x:
                yield from _walk(v)

    for s in _walk(kb):
        assert not sg.kiem_loi(s), f"Lỗi kiểm lời: {s}"
        assert not kds.tim_cum_cam(s, cam), f"Từ cấm: {s} -> {kds.tim_cum_cam(s, cam)}"
        assert not kds.tim_cum_cam(s, cum), f"Cụm chung chung: {s} -> {kds.tim_cum_cam(s, cum)}"

    for nhom in ("so_chu_dao", "dinh_cao"):
        for ma, muc in kb[nhom].items():
            sgh = muc.get("sach_ghi") or {}
            # TK-2: sách còn bản quyền → chỉ dẫn trang + tóm ý, không chép nguyên văn vào repo công khai.
            assert sgh.get("trang") and sgh.get("tom_y") and "trich" not in sgh, f"sach_ghi sai ở {nhom}.{ma}"


def test_api_thanso_phillips():
    r = client.post("/v1/thanso/phillips", json={"ho_ten": ["Nguyễn Đức Luân"], "ngay": 9, "thang": 5, "nam": 1949})
    assert r.status_code == 200
    d = r.json()
    assert d["phai"] == "phillips"
    assert d["so_chu_dao"]["nhan"] == "10"
    assert d["doi_chieu_pitago"]["lech"] is True
    assert d["doi_chieu_pitago"]["so_pitago"] == 1
    assert len(d["kim_tu_thap"]["dinh"]) == 4


def test_tuoi1_tuoi_tron_theo_sinh_nhat():
    """TUOI-1: chặng đỉnh theo năm (quy ước Phillips), tuổi nói với người đọc theo sinh nhật."""
    k = tp.bon_dinh_kim_tu_thap(19, 9, 2016, nam_xem=2026, ngay_xem=dt.date(2026, 11, 21))
    assert (k["tuoi_hien_tai"], k["tuoi_tron"]) == (10, 10)
    assert k["dinh"][0]["trang_thai"] == "dang_trong" and (k["dinh"][0]["tu_tuoi"], k["dinh"][0]["tuoi"]) == (0, 35)
    k = tp.bon_dinh_kim_tu_thap(25, 12, 2016, nam_xem=2026, ngay_xem=dt.date(2026, 11, 21))
    assert (k["tuoi_hien_tai"], k["tuoi_tron"]) == (10, 9)
