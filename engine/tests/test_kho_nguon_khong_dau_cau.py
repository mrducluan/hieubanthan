# -*- coding: utf-8 -*-
"""Kho nguồn chữ Hán chỉ giữ CHỮ SÁCH: dấu chấm câu thời nay (Wikisource CC BY-SA, bản điện tử hiện đại) là công của người
gõ / hiệu đính, không phải của sách — `scripts/bo_dau_cau_kho_nguon.py` bỏ đi; nạp lại sách nào cũng phải qua bước này."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

_P = Path(__file__).resolve().parents[1] / "scripts" / "bo_dau_cau_kho_nguon.py"
_spec = importlib.util.spec_from_file_location("bo_dau_cau_kho_nguon", _P)
bd = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bd)


def test_moi_kho_nguon_chu_han_khong_con_dau_cau():
    con = [p.name for p in bd.tep_chu_han() if bd._sua(d := json.loads(p.read_text("utf-8"))) != d]
    assert con == [], f"chạy scripts/bo_dau_cau_kho_nguon.py: {con}"


def test_bo_dau_giu_chu_chu_nho_va_xuong_dong():
    assert bd.bo_dau("天尊地卑，陽奇陰偶。（注：一）\n乾在內甲子") == "天尊地卑陽奇陰偶〔注一〕\n乾在內甲子"
    assert bd.bo_dau("世爲己﹐應爲人") == "世爲己應爲人"
    assert bd._sua({"_nguon": "《X》, bản gõ", "van": "甲，乙"}) == {"_nguon": "《X》, bản gõ", "van": "甲乙"}
