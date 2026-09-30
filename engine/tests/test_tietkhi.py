# -*- coding: utf-8 -*-
"""HH-3 — tiết khí (kinh độ Mặt Trời, VSOP87 rút gọn + ΔT). Test viết TRƯỚC.

Oracle: lunar-typescript 1.8.6 (fixtures/golden/battu.json → tiet_khi, 667 thời điểm 1901–2099).
Sai số đo khi phát triển: lớn nhất 0,63 phút trên 4.623 thời điểm 1900–2100.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import tietkhi as tk

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "battu.json")
               .read_text(encoding="utf-8"))["tiet_khi"]
SAI_SO_PHUT = 1.5


def test_khop_oracle_moi_thoi_diem():
    lech = []
    for g in G:
        ref = dt.datetime.strptime(g["utc"], "%Y-%m-%dT%H:%M:%SZ")
        ta = tk.thoi_diem(g["nam"], g["kinh_do"])
        lech.append(abs((ta - ref).total_seconds()) / 60)
    assert max(lech) < SAI_SO_PHUT, max(lech)


def test_kinh_do_tai_thoi_diem_tiet():
    t = tk.thoi_diem(2026, 315)                     # Lập xuân 2026
    assert abs(((tk.kinh_do_mat_troi(t) - 315) + 180) % 360 - 180) < 1e-4
    vn = t + dt.timedelta(hours=7)
    assert (vn.month, vn.day, vn.hour) == (2, 4, 3)            # 04/02/2026 ~03:02 giờ VN


@pytest.mark.parametrize("goc", [0, 90, 180, 270])
def test_phan_chi_moc_quen_thuoc(goc):
    thang = {0: 3, 90: 6, 180: 9, 270: 12}[goc]
    t = tk.thoi_diem(2000, goc)
    assert t.month == thang and 19 <= t.day <= 23


def test_tiet_bao_quanh():
    t = dt.datetime(1990, 5, 17, 5, 30)             # UTC
    truoc, sau = tk.tiet_bao_quanh(t)
    assert truoc[1] == 45 and sau[1] == 75          # Lập hạ → Mang chủng
    assert truoc[0] <= t < sau[0]


def test_delta_t_hop_ly():
    assert 60 < tk.delta_t(2000) < 66 and -5 < tk.delta_t(1900) < 0
