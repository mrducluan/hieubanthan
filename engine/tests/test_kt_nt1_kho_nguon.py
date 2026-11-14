# -*- coding: utf-8 -*-
"""KT-NT1 — câu trích sách của KB Nhân tướng phải có thật trong kho nguồn cổ thư (fixtures/nguon/nhan_tuong_co_thu.json).

Sách đã có kho nguồn: Băng Giám, Tâm Tướng Thiên, Linh Khu (Ngũ Sắc) và (KT-NT2) bốn sách Tứ khố — Nguyệt Ba Động Trung
Ký, Ngọc Quản Chiếu Thần Cục, Thái Thanh Thần Giám, Nhân Luân Đại Thống Phú. KT-NT2: MỌI câu trích phải ghi một sách có kho
nguồn, có trường `han` (nguyên văn chữ Hán) và `han` là chuỗi con của nguyên văn (bỏ dấu câu, vì bản Tứ khố không chấm câu).
Ma Y, Liễu Trang, Thuỷ Kính chưa có bản gõ tin được → không được ghi làm nguồn câu trích.

KT-NT3 (2026-11-14): Thần Tướng Toàn Biên có kho nguồn riêng `than_tuong_toan_bien.json` — bản chép trong Cổ Kim Đồ Thư
Tập Thành (藝術典 quyển 631–644, Wikisource). 27 câu trích mới ghi nguồn này; 99 vị lưu niên mang chữ Hán và phải đi đúng
thứ tự bài «流年運氣部位歌» (bắt được lỗi cũ: tuổi 10–11 là Nhân Luân, 12–14 là Địa Luân — không phải Thiên Thành / Thiên Khuếch).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KHO = json.loads((ROOT / "fixtures" / "nguon" / "nhan_tuong_co_thu.json").read_text("utf-8"))
KB = json.loads((ROOT / "app" / "kb" / "data" / "nhan_tuong_kb.json").read_text("utf-8"))
TTTB = json.loads((ROOT / "fixtures" / "nguon" / "than_tuong_toan_bien.json").read_text("utf-8"))

_DAU = re.compile(r"[\s，。、；：？！「」『』“”‘’（）·,.;:?!()〔〕/]")


def _sach_tron(t: str) -> str:
    return _DAU.sub("", t)


VAN = {**{k: _sach_tron(KHO["sach"][k]["van"]) for k in ("nguyet_ba", "ngoc_quan", "thai_thanh", "nhan_luan")},
       "bang_giam": _sach_tron("".join(c["van"] for c in KHO["sach"]["bang_giam"]["chuong"])),
       "tam_tuong_thien": _sach_tron(KHO["sach"]["tam_tuong_thien"]["van"]),
       "noi_kinh": _sach_tron(KHO["sach"]["noi_kinh"]["van"]),
       "than_tuong_toan_bien": _sach_tron("".join(m["van"] for q in TTTB["quyen"] for m in q["muc"]))}


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
    assert co >= 70


def test_han_chi_o_sach_co_kho_nguon():
    """`han` chỉ đặt khi đối chiếu được — sách chưa có kho nguồn thì không ghi nguyên văn tự đoán."""
    for k, s in _cac_trich():
        if s.get("han"):
            assert s.get("nguon") in VAN, k


# ---------------------------------------------------------------- KT-NT3: Thần Tướng Toàn Biên

def _muc(ten: str) -> str:
    return next(m["van"] for q in TTTB["quyen"] for m in q["muc"] if m["ten"] == ten)


def test_kho_than_tuong_toan_bien_du_14_quyen():
    assert [q["tap_thanh"] for q in TTTB["quyen"]] == list(range(631, 645))
    assert all(q["muc"] and q["revid"] for q in TTTB["quyen"])
    assert sum(len(q["muc"]) for q in TTTB["quyen"]) >= 600
    assert TTTB["can_doi_chieu"] is True
    assert "面之三停者" in _muc("面三停") and "欲識流年運氣行" in _muc("流年運氣部位歌")
    assert "<" not in "".join(m["van"] for q in TTTB["quyen"] for m in q["muc"])          # không sót thẻ HTML


def test_cau_trich_than_tuong_toan_bien():
    n = [k for k, s in _cac_trich() if s["nguon"] == "than_tuong_toan_bien"]
    assert len(n) >= 27


def test_luu_nien_dung_thu_tu_bai_ca():
    """Tên chữ Hán của 99 vị lưu niên xuất hiện trong bài ca theo đúng thứ tự tuổi (vị trí không lùi)."""
    ca = _sach_tron(_muc("流年運氣部位歌"))
    ln = KB["luu_nien"]
    assert [x["tuoi"] for x in ln] == list(range(1, 101))
    vt = 0
    for x in ln[:99]:
        assert x.get("han"), x
        i = ca.find(x["han"], vt)
        if i < 0:                      # hai tuổi liền nhau cùng một tên (vd 1–2 天輪) → tên đã gặp ngay trước đó
            i = ca.rfind(x["han"], 0, vt + len(x["han"]))
        assert i >= 0, f"tuổi {x['tuoi']}: «{x['han']}» không đúng thứ tự trong bài ca"
        vt = max(vt, i)
    ten = {x["tuoi"]: x["ten"] for x in ln}
    assert ten[8] == ten[9] == "Thiên Luân" and ten[10] == ten[11] == "Nhân Luân"
    assert ten[12] == ten[13] == ten[14] == "Địa Luân"
    assert all(x["bo_vi"] == "tai" for x in ln[:14]) and all(x["ben"] == "phai" for x in ln[7:14])
