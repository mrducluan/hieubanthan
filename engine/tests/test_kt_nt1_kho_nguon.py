# -*- coding: utf-8 -*-
"""KT-NT1 — câu trích sách của KB Nhân tướng phải có thật trong kho nguồn cổ thư (fixtures/nguon/nhan_tuong_co_thu.json).

Sách đã có kho nguồn: Băng Giám, Tâm Tướng Thiên, Linh Khu (Ngũ Sắc) và (KT-NT2) bốn sách Tứ khố — Nguyệt Ba Động Trung
Ký, Ngọc Quản Chiếu Thần Cục, Thái Thanh Thần Giám, Nhân Luân Đại Thống Phú. KT-NT2: MỌI câu trích phải ghi một sách có kho
nguồn, có trường `han` (nguyên văn chữ Hán) và `han` là chuỗi con của nguyên văn (bỏ dấu câu, vì bản Tứ khố không chấm câu).
Ma Y, Thần Tướng Toàn Biên, Liễu Trang, Thuỷ Kính chưa có bản gõ tin được → không được ghi làm nguồn câu trích.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KHO = json.loads((ROOT / "fixtures" / "nguon" / "nhan_tuong_co_thu.json").read_text("utf-8"))
KB = json.loads((ROOT / "app" / "kb" / "data" / "nhan_tuong_kb.json").read_text("utf-8"))

_DAU = re.compile(r"[\s，。、；：？！「」『』“”‘’（）·,.;:?!()〔〕/]")


def _sach_tron(t: str) -> str:
    return _DAU.sub("", t)


VAN = {**{k: _sach_tron(KHO["sach"][k]["van"]) for k in ("nguyet_ba", "ngoc_quan", "thai_thanh", "nhan_luan")},
       "bang_giam": _sach_tron("".join(c["van"] for c in KHO["sach"]["bang_giam"]["chuong"])),
       "tam_tuong_thien": _sach_tron(KHO["sach"]["tam_tuong_thien"]["van"]),
       "noi_kinh": _sach_tron(KHO["sach"]["noi_kinh"]["van"])}


def _cac_trich():
    for k, x in KB["dac_diem"].items():
        s = x.get("sach") or {}
        if s.get("trich"):
            yield k, s


def test_kho_nguon_du_ba_sach():
    assert [c["ten"] for c in KHO["sach"]["bang_giam"]["chuong"]] == [
        "神骨章第一", "剛柔章第二", "容貌章第三", "情態章第四", "鬚眉章第五", "聲音章第六", "氣色章第七"]
    assert "心者貌之根" in VAN["tam_tuong_thien"]
    assert "下極者心也" in VAN["noi_kinh"] and "明堂者鼻也" in VAN["noi_kinh"]
    assert KHO["can_doi_chieu"] is True
    assert "三停平等" in VAN["ngoc_quan"] and "準頭齊者心性慈" in VAN["thai_thanh"]
    assert "日角" in VAN["nguyet_ba"] and "人倫大統賦" in KHO["sach"]["nhan_luan"]["ten"]


def test_trich_cua_sach_co_kho_nguon_khop_nguyen_van():
    co = 0
    for k, s in _cac_trich():
        assert s.get("nguon") in VAN, f"{k}: nguồn {s.get('nguon')} chưa có kho nguồn"
        co += 1
        assert s.get("han"), f"{k}: thiếu nguyên văn chữ Hán"
        assert _sach_tron(s["han"]) in VAN[s["nguon"]], f"{k}: «{s['han']}» không có trong {s['nguon']}"
    assert co >= 40


def test_han_chi_o_sach_co_kho_nguon():
    """`han` chỉ đặt khi đối chiếu được — sách chưa có kho nguồn thì không ghi nguyên văn tự đoán."""
    for k, s in _cac_trich():
        if s.get("han"):
            assert s.get("nguon") in VAN, k
