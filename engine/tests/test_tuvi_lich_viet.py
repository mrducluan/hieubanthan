# -*- coding: utf-8 -*-
"""LS60 — 60 lá số mẫu + 12 lá rơi vào ngày lịch Việt ≠ lịch Trung Quốc, đối chiếu ORACLE `lasotuvi` (MIT).
Test viết TRƯỚC khi sửa lỗi: iztro tự đổi dương → âm theo lịch Trung Quốc (UTC+8), trong khi lá số Việt
phải dùng âm lịch Việt Nam (Hồ Ngọc Đức, UTC+7; miền Nam 1960–1975 UTC+8). 1930–2025 có 1.376 ngày lệch.

Nhóm "đồng thuận" = những thứ lasotuvi (lối Việt) và iztro tính giống nhau khi cùng một ngày âm. Khác phái đã
biết (không kiểm ở đây, ghi trong docs/DOI-CHIEU-TUVI-60.md): Hoả/Linh, Khôi/Việt, Thiên Quý, Phá Toái, Giải
Thần, Tứ hoá Khoa/Kỵ một số can. Lá rơi vào nửa sau tháng nhuận (ngày > 15) chờ chốt quy tắc tháng nhuận →
chỉ kiểm sao an theo năm.
"""
from __future__ import annotations

import datetime as dt
import json
from collections import defaultdict
from pathlib import Path

import pytest

from app.calc import lunar, tuvi_an_sao as az, tuvi_do_sang_vn as ds

_D = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
CHINH = {1: "Tử Vi", 2: "Liêm Trinh", 3: "Thiên Đồng", 4: "Vũ Khúc", 5: "Thái Dương", 6: "Thiên Cơ", 7: "Thiên Phủ",
         8: "Thái Âm", 9: "Tham Lang", 10: "Cự Môn", 11: "Thiên Tướng", 12: "Thiên Lương", 13: "Thất Sát", 14: "Phá Quân"}
# sao an theo NĂM (can/chi) — không phụ thuộc tháng/ngày/giờ
THEO_NAM = {27: "Lộc Tồn", 51: "Đà La", 52: "Kình Dương", 79: "Hồng Loan", 80: "Thiên Hỷ", 96: "Cô Thần",
            97: "Quả Tú", 98: "Thiên Mã", 69: "Thiên Khốc", 70: "Thiên Hư", 100: "Thiên Quan", 101: "Thiên Phúc"}
# sao an theo tháng / giờ / ngày / Mệnh — đồng thuận giữa hai máy
KHAC = {53: "Địa Không", 54: "Địa Kiếp", 57: "Văn Xương", 58: "Văn Khúc", 61: "Tả Phù", 62: "Hữu Bật",
        63: "Long Trì", 64: "Phụng Các", 65: "Tam Thai", 66: "Bát Tọa", 67: "Ân Quang", 73: "Thiên Hình",
        74: "Thiên Diêu", 85: "Phong Cáo", 86: "Thiên Tài", 87: "Thiên Thọ", 88: "Thiên Thương", 89: "Thiên Sứ",
        84: "Đài Phụ", 71: "Thiên Đức", 72: "Nguyệt Đức"}


def _cho_nhuan(c: dict) -> bool:
    d = dt.date.fromisoformat(c["ngay"])
    ng, _, _, nh = lunar.solar_to_lunar(d.day, d.month, d.year, 7)
    return bool(nh) and ng > 15


def _cua_minh(c: dict) -> tuple[dict, dict]:
    la = az.an_sao_tho(dt.date.fromisoformat(c["ngay"]), c["ti"], c["gioi_tinh"])
    pos = defaultdict(set)
    for p in la["palaces"]:
        for k in ("majorStars", "minorStars", "adjectiveStars"):
            for s in p[k]:
                pos[s["name"]].add(p["earthlyBranch"])
    return la, pos


def _kiem(c: dict) -> list[str]:
    la, pos = _cua_minh(c)
    sai, S = [], c["sao"]
    for i, t in THEO_NAM.items():
        if pos[t] != set(S[str(i)]["chi"]):
            sai.append(f"{t}: {sorted(pos[t])} ≠ {S[str(i)]['chi']}")
    if _cho_nhuan(c):
        return sai
    menh = next(p["earthlyBranch"] for p in la["palaces"] if p["name"] == "Mệnh")
    than = next(p["earthlyBranch"] for p in la["palaces"] if p["isBodyPalace"])
    if (menh, than) != (c["menh"], c["than"]):
        sai.append(f"Mệnh/Thân {menh}/{than} ≠ {c['menh']}/{c['than']}")
    for i, t in {**CHINH, **KHAC}.items():
        if str(i) in S and pos[t] != set(S[str(i)]["chi"]):
            sai.append(f"{t}: {sorted(pos[t])} ≠ {S[str(i)]['chi']}")
    for k, m in c["do_sang"].items():
        i, chi = k.split("@")
        if ds.do_sang(CHINH[int(i)], chi) != m:
            sai.append(f"độ sáng {CHINH[int(i)]}@{chi}")
    return sai


@pytest.mark.parametrize("c", _D["cases"], ids=lambda c: f"{c['ngay']}-{c['ti']}-{c['gioi_tinh']}")
def test_60_la_so_mau(c):
    assert _kiem(c) == []


@pytest.mark.parametrize("c", _D["lich_lech"], ids=lambda c: f"{c['ngay']}-{c['ti']}-{c['gioi_tinh']}")
def test_ngay_lich_viet_khac_lich_trung_quoc(c):
    assert _kiem(c) == []


def test_ngay_30_chi_co_o_lich_viet_khong_loi():
    la = az.an_sao_tho(dt.date(1903, 2, 26), 3, "nam")       # 30/1/1903 âm Việt; bên Trung Quốc tháng 1 chỉ 29 ngày
    assert la["palaces"]


def test_api_co_thang_nhuan_nua_sau():
    from fastapi.testclient import TestClient
    from app.main import app
    d = TestClient(app).post("/v1/tuvi/an-sao", json={
        "birth_date": "2001-06-10", "birth_time": "15:30", "gender": "nu", "noi_sinh": "ha-noi"}).json()
    co = {c["loai"]: c["chi_tiet"] for c in d["co_canh_bao"]}
    assert "thang_nhuan" in co and "tháng 4 nhuận" in co["thang_nhuan"]


def test_api_1985_dung_lich_viet():
    # 13/03/1985 = 22/2 Ất Sửu lịch Việt (lịch Trung Quốc: 22/1). Mệnh phải theo tháng 2.
    from fastapi.testclient import TestClient
    from app.main import app
    c = next(x for x in _D["lich_lech"] if x["ngay"] == "1985-03-13")
    gio = ["00:30", "01:30", "03:30", "05:30", "07:30", "09:30", "11:30", "13:30", "15:30", "17:30", "19:30", "21:30"][c["ti"]]
    d = TestClient(app).post("/v1/tuvi/an-sao", json={
        "birth_date": c["ngay"], "birth_time": gio, "gender": c["gioi_tinh"], "noi_sinh": "ha-noi"}).json()
    menh = next(x["chi"] for x in d["cung"] if x["la_menh"])
    assert menh == c["menh"]
