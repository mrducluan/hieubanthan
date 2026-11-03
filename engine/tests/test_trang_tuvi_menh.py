# -*- coding: utf-8 -*-
"""AUD-P0: trang "sao X ở cung Y" có mục dữ kiện riêng — cung Mệnh (hoặc tam phương khi Y là Mệnh) có chính tinh nào,
xét đủ 12 vị trí của Tử Vi. Câu khung ở KB `su_kien_kb.json` (source_id + school_id); bảng khớp CALC; không nói tỉ lệ
người; không giọng AI."""
from __future__ import annotations

import json
from pathlib import Path

from app.calc import tuvi_vi_tri as vt
from app.kb import trang, trang_tuvi

_DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
_CUM = [c.lower() for c in json.loads((_DATA / "tuvi_doi_song_kb.json").read_text("utf-8"))["cum_cam"] if c != "khắc"]
_VONG = list(json.loads((_DATA / "tuvi_kb.json").read_text("utf-8"))["cung"])


def _muc(sao: str, cung: str) -> dict:
    t = trang_tuvi.trang_sao_cung((sao, cung), f"{trang._slug(sao)}-cung-{trang._slug(cung)}")
    ds = [m for m in t["muc"] if m.get("ma") == "su_kien_menh"]
    assert len(ds) == 1, (sao, cung)
    return ds[0]


def test_kb_co_nguon():
    kb = json.loads((_DATA / "su_kien_kb.json").read_text("utf-8"))
    assert kb["source_id"] and kb["school_id"] and kb["trang_thai"]


def test_moi_trang_sao_cung_co_muc_va_bang_khop_calc():
    for sao in vt.CHINH_TINH:
        for k, cung in enumerate(_VONG):
            m = _muc(sao, cung)
            if k:
                tt = vt.tom_tat_cung_khac(sao, k, 0)
                # Mệnh cố định → câu + link (không bảng, tránh bảng trùng giữa các trang); không cố định → bảng.
                assert ("bang" in m) == (not tt["luon_co"]), (sao, cung)
                if tt["luon_co"]:
                    assert m["xem_them"] and all(x["slug"].endswith("-cung-menh") for x in m["xem_them"])
                    continue
                so = {" · ".join(x["sao"]): x["so_vi_tri"] for x in tt["to_hop"]}
                for dong in m["bang"]["dong"]:
                    if dong[0] in so:
                        assert dong[1] == f"{so[dong[0]]}/12", (sao, cung, dong)
                if tt["luon_co"]:
                    assert all(s in m["doan"] for s in tt["luon_co"])


def test_vi_du_thai_duong_phu_the():
    m = _muc("Thái Dương", "Phu Thê")
    assert "luôn có Thiên Cơ" in m["doan"]


def test_khong_noi_ty_le_nguoi_khong_giong_ai():
    for sao in ("Tử Vi", "Thái Dương", "Phá Quân", "Thiên Lương"):
        for cung in _VONG:
            m = _muc(sao, cung)
            chu = " ".join([m["tieu_de"], m["doan"], json.dumps(m.get("bang", {}), ensure_ascii=False)]).lower()
            assert "%" not in chu and "dân số" not in chu and "người" not in m["doan"].lower()
            assert not [c for c in _CUM if c in chu], (sao, cung)
