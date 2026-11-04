# -*- coding: utf-8 -*-
"""AUD-P0 (kiểm toán 2026-11): các ô SỐ gõ tay trong `bo_sung_*.json` (ngày sinh → Đường đời, can → thập thần,
tháng cá nhân, "x% số ngày 1940–2010") phải khớp phép tính của engine — MỘT bộ tính (CLAUDE.md). Hôm nay khớp hết;
test chặn KB lệch âm thầm khi calc đổi."""
from __future__ import annotations

import json
import re
from pathlib import Path

from app.calc import battu as bt
from app.calc import thanso
from app.calc import thanso_ty_le as tl
from app.kb import trang

_DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"


def _bs(ten: str) -> dict:
    return json.loads((_DATA / f"bo_sung_{ten}.json").read_text("utf-8"))["trang"]


def _so_cuoi(chu: str) -> int:
    return int(re.findall(r"\d+", chu.split("=")[-1])[-1])


def _ngay(chu: str) -> tuple[int, int, int]:
    d, m, y = re.match(r"(\d{2})/(\d{2})/(\d{4})", chu).groups()
    return int(d), int(m), int(y)


def test_bang_ngay_sinh_khop_duong_doi():
    n = 0
    for ten in ("so", "no_nghiep"):
        for slug, t in _bs(ten).items():
            b = t.get("bang")
            if not b or "Rút gọn con số (mặc định)" not in b["cot"]:
                continue
            i_rg, i_ch = b["cot"].index("Rút gọn con số (mặc định)"), b["cot"].index("Cộng hết chữ số")
            for dong in b["dong"]:
                d, m, y = _ngay(dong[0])
                assert _so_cuoi(dong[i_rg]) == thanso.duong_doi(d, m, y, "tung_phan"), (slug, dong)
                assert _so_cuoi(dong[i_ch]) == thanso.duong_doi(d, m, y, "tong_het"), (slug, dong)
                n += 1
    assert n >= 20


def test_bang_thap_than_khop_calc():
    ten_theo_slug = {s: ten for ten, s in trang._ds_thap_than()}
    n = 0
    for slug, t in _bs("thap_than").items():
        b = t["bang"]
        assert b["cot"][:2] == ["Nhật chủ", f"Can là {ten_theo_slug[slug]}"], slug
        for dong in b["dong"]:
            assert bt.thap_than(dong[0].split(" ")[0], dong[1]) == ten_theo_slug[slug], (slug, dong)
            n += 1
    assert n == 100


def test_bang_thang_ca_nhan_khop_calc():
    for slug, t in _bs("nam_ca_nhan").items():
        nam = int(slug.rsplit("-", 1)[1])
        for dong in t["bang"]["dong"]:
            thang = int(dong[0].split()[-1])
            assert int(dong[1]) == thanso.rut_gon(nam + thang, giu_master=False), (slug, dong)


# (số Đường đời, "x,y%" đúng như chữ trong bo_sung_so.json, quy ước nói trong câu — None = câu nói chung cả hai cách).
# Câu "gặp 13/14/16/19" (tổng TRUNG GIAN đi qua số kép) không phải Đường đời cuối → không thuộc bảng này.
_PHAN_TRAM = [(1, "11,1", None), (2, "4,6", "tung_phan"), (2, "1,6", "tong_het"), (3, "11,1", None),
              (4, "8,1", "tung_phan"), (4, "8,8", "tong_het"), (5, "11,1", None), (6, "10,2", "tung_phan"),
              (6, "5,4", "tong_het"), (7, "11,1", None), (8, "11,1", None), (9, "11,1", None),
              (11, "6,5", "tung_phan"), (11, "9,5", "tong_het"), (22, "3,0", "tung_phan"), (22, "2,3", "tong_het"),
              (33, "0,9", "tung_phan"), (33, "5,8", "tong_het")]


def test_phan_tram_so_ngay_khop_thanso_ty_le():
    chu = (_DATA / "bo_sung_so.json").read_text("utf-8")
    for so, pt, q in _PHAN_TRAM:
        assert f"{pt}%" in chu, (so, pt)
        gia_tri = float(pt.replace(",", "."))
        for cach in ([q] if q else ["tung_phan", "tong_het"]):
            assert abs(100 * tl.bang_duong_doi(cach).get(so, 0) - gia_tri) <= 0.05, (so, pt, cach)
