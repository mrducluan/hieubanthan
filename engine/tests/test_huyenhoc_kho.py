# -*- coding: utf-8 -*-
"""Cổng chặn lùi Huyền học (HH-5): chạy THẬT 4 module trên kho 2.031 câu có nhãn.

Ngưỡng là sàn, không phải mục tiêu — KHÔNG hạ để qua test (skill huyenhoc-tu-cai-thien).
Kèm: template không vi phạm bộ kiểm tra đầu ra, KB không có cụm cấm, recall khủng hoảng 100%.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
import vong_cai_thien_huyenhoc as vc  # noqa: E402

SAN = {"tuvi": 97.0, "kinhdich": 97.0, "battu": 97.0, "phongthuy": 97.0}


@pytest.fixture(scope="module")
def do():
    return vc.do_luong()["mo_dun"]


@pytest.mark.parametrize("md", sorted(SAN))
def test_san_do_phu(do, md):
    assert do[md]["day_du_pct"] >= SAN[md], do[md]


@pytest.mark.parametrize("md", sorted(SAN))
def test_khung_hoang_va_tu_choi(do, md):
    assert do[md]["recall_an_toan"] == 100.0 and do[md]["recall_tu_choi"] == 100.0
    assert do[md]["chan_nham"] == 0


def test_kb_sach():
    assert vc.kiem_kb() == {md: [] for md in vc.KB_FILES}


def test_template_khong_vi_pham_bo_kiem_tra():
    import datetime as dt  # noqa: PLC0415
    from app.hoidap import battu as bh, phongthuy as ph, tuvi as tv  # noqa: PLC0415
    from app.narrative import hoi_van  # noqa: PLC0415
    loi = []
    for r in vc._kho():
        if r["mo_dun"] == "tuvi":
            o = tv.tra_loi(r["cau_hoi"], r["che_do"], {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"},
                           dt.date(2026, 9, 30))
        elif r["mo_dun"] == "battu":
            o = bh.tra_loi(r["cau_hoi"], {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"},
                           dt.date(2026, 9, 30))
        elif r["mo_dun"] == "phongthuy":
            o = ph.tra_loi(r["cau_hoi"], {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)},
                           dt.date(2026, 9, 30))
        else:
            continue
        if hoi_van.kiem_tra_dau_ra(o["cau_tra_loi"], o["bang_chung"]):
            loi.append(r["cau_hoi"])
    assert loi == []
