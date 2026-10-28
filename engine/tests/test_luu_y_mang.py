# -*- coding: utf-8 -*-
"""MT-ĐS B6 — khung "Cần lưu ý ở từng mảng hay hỏi" trong Luận giải toàn bộ Tử vi + Bát tự (chủ dự án yêu cầu: điều
người dùng hay hỏi — tiền, công danh, tình cảm, con cái, tai nạn, kiện tụng, sức khoẻ — phải có trong khung lưu ý của
bài luận, không chỉ ở hỏi đáp). Gom từ chương đã chấm (cùng KB, cùng mã kiểm chứng), KB điền chỗ chương không có
hộp. Không điểm số, không biến cố, ranh giới (bác sĩ / luật sư / không phải lời khuyên đầu tư) ghi ở từng mảng.
Viết TRƯỚC khi nối."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.luangiai import battu_doi_song as bds
from app.luangiai import doi_song_khuon as kh
from app.luangiai import luu_y_mang as lym
from app.luangiai import tuvi_doi_song as tds

MA = ["tien_bac", "cong_viec", "tinh_cam", "con_cai", "di_lai", "giay_to", "suc_khoe"]
SINH_TV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 11, 30), "gioi_tinh": "nam"}
NGAY = dt.date(2026, 10, 28)
CAM = ("tai nạn", "kiện tụng", "chết", "bệnh", "phá sản", "ly hôn", "khắc", "xui", "đại hạn", "lưu niên", "hoá kỵ", "hoá lộc",
       "tử nữ", "thiên di", "nô bộc", "quan lộc", "tài bạch", "thất sát", "thương quan", "kiếp sát")
_G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))["cases"][:12]
_GB = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "battu_doi_song.json").read_text("utf-8"))["cases"]


def _kiem(ds: list[dict], mo_dun: str) -> None:
    assert [r["ma"] for r in ds] == MA
    for r in ds:
        assert r["ten"] and r["muc"] in ("thuan", "can_bang", "can_chu_dong") and r["nhan_muc"]
        assert r["luu_y"] and r["viec"] and r["tu_chuong"], r
        assert r["luu_y"].endswith(".") and r["viec"].endswith(".")
        s = (r["ten"] + " " + r["luu_y"] + " " + r["viec"]).lower()
        assert not [c for c in CAM if c in s], (r["ma"], [c for c in CAM if c in s])
        assert len(r["luu_y"]) <= 320 and len(r["viec"]) <= 200
    ranh = {r["ma"]: r.get("ranh_gioi") for r in ds}
    assert ranh["suc_khoe"] and "bác sĩ" in ranh["suc_khoe"]
    assert ranh["giay_to"] and "luật sư" in ranh["giay_to"]
    assert ranh["tien_bac"] and "đầu tư" in ranh["tien_bac"]
    assert ranh["con_cai"] and "bác sĩ" in ranh["con_cai"]
    assert ranh["di_lai"] and "không ai nói được" in ranh["di_lai"]
    assert not kh.kiem_giong_van({"mo_dun": mo_dun, "chuong": [], "luu_y_mang": ds})


def test_tuvi_co_khung():
    bc = tds.lap(SINH_TV, NGAY)
    ds = bc["luu_y_mang"]
    _kiem(ds, "tuvi")
    chuong = {c["ma"]: c for c in bc["chuong"]}
    # mức mảng lấy từ chương / cung đã chấm — tiền bạc theo chương Tiền bạc, công việc theo chương Sự nghiệp
    assert {r["ma"]: r["muc"] for r in ds}["tien_bac"] == chuong["tien_bac"]["muc"]
    assert {r["ma"]: r["tu_chuong"] for r in ds}["cong_viec"] == "su_nghiep"
    # hộp lấy lại từ chương → cùng mã kiểm chứng (khi có)
    for r in ds:
        if r.get("ma_mau"):
            assert any(h["ma_mau"] == r["ma_mau"] for h in chuong[r["tu_chuong"]]["hop"]), r["ma_mau"]


def test_battu_co_khung():
    bc = bds.lap(SINH_BT, NGAY)
    _kiem(bc["luu_y_mang"], "battu")


@pytest.mark.parametrize("ca", _G, ids=[f"{c['ngay']}-{c['ti']}-{c['gioi_tinh']}" for c in _G])
def test_golden_tuvi(ca):
    bc = tds.lap({"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}, NGAY)
    _kiem(bc["luu_y_mang"], "tuvi")


@pytest.mark.parametrize("ca", _GB, ids=[c["id"] for c in _GB])
def test_golden_battu(ca):
    bc = bds.lap({"lich": dt.datetime.fromisoformat(ca["lich"]), "gioi_tinh": ca["gioi_tinh"], "gio_ty": ca.get("gio_ty", "da_ty")},
                 dt.date.fromisoformat(ca["ngay_xem"]))
    _kiem(bc["luu_y_mang"], "battu")


def test_kb_du_moi_muc():
    for mo_dun in ("tuvi", "battu"):
        kb = lym.kb_mang(mo_dun)
        for ma in MA:
            for muc in ("thuan", "can_bang", "can_chu_dong"):
                o = kb[ma][muc]
                assert o["luu_y"].endswith(".") and o["viec"].endswith("."), (mo_dun, ma, muc)
        assert set(kb["_ranh_gioi"]) >= {"tien_bac", "giay_to", "suc_khoe", "con_cai", "di_lai"}
