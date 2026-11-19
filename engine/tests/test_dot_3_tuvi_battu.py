# -*- coding: utf-8 -*-
"""Đợt 3 — Kiểm định tích hợp Tử Vi Lương phái (672 Tượng), Trung Châu phái (60 Tinh Hệ) & Bát Tự (Thiên Lý Mệnh Cảo)."""
from __future__ import annotations

import json
from pathlib import Path

from app.kb import sach_ghi as sg, tuvi_doi_song_kb as kds

_DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"


def _kiem_giong_van(path: Path, bo_qua: tuple[str, ...], cho_phep: set[str] | None = None) -> None:
    kb = json.loads(path.read_text("utf-8"))
    bo = cho_phep or set()
    cam = [w for w in kds.cum_cam() if w not in bo]
    cum = kds.cum_chung_chung()

    def _walk(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for k, v in x.items():
                if not k.startswith("_") and k not in bo_qua:
                    yield from _walk(v)
        elif isinstance(x, list):
            for v in x:
                yield from _walk(v)

    for s in _walk(kb):
        assert not sg.kiem_loi(s), f"{path.name} lỗi kiểm lời: {s}"
        assert not kds.tim_cum_cam(s, cam), f"{path.name} từ cấm: {s} -> {kds.tim_cum_cam(s, cam)}"
        assert not kds.tim_cum_cam(s, cum), f"{path.name} cụm chung chung: {s} -> {kds.tim_cum_cam(s, cum)}"


def test_tuvi_luong_672_tuong():
    p = _DATA / "tuvi_phi_hoa_luong_672.json"
    kb = json.loads(p.read_text("utf-8"))
    assert kb["tong_so_tuong"] == len(kb["tuong"]) >= 570
    assert set(kb["quy_tac_hai_chieu"].keys()) == {"Lộc", "Quyền", "Khoa", "Kỵ"}
    assert "Mệnh|Lộc|Quan Lộc" in kb["tuong"]
    assert kb["tuong"]["Mệnh|Lộc|Quan Lộc"]["sach_ghi"]["han"]
    _kiem_giong_van(p, ("source_id", "school_id", "sach_ghi", "sach_goc", "tuong"))


def test_tuvi_trung_chau_60_tinh_he():
    p = _DATA / "tuvi_trung_chau_60_tinh_he.json"
    kb = json.loads(p.read_text("utf-8"))
    assert kb["tong_so_tinh_he"] == len(kb["tinh_he"]) == 60
    for th in kb["tinh_he"]:
        assert th["ma"].startswith("WTZ_SS_")
        assert th["sach_ghi"]["han"]
    _kiem_giong_van(p, ("source_id", "school_id", "sach_ghi", "sach_goc", "tinh_he"))


def test_battu_thien_ly_menh_cao():
    p = _DATA / "battu_thien_ly_menh_cao.json"
    kb = json.loads(p.read_text("utf-8"))
    assert len(kb["quy_tac_thap_than_va_cach_cuc"]) == 6
    for ma, muc in kb["quy_tac_thap_than_va_cach_cuc"].items():
        assert muc.get("mat_tich_cuc") and muc.get("mat_tieu_cuc_can_chu_y")
        assert (muc.get("sach_ghi") or {}).get("han"), f"Thiếu sach_ghi ở {ma}"
    _kiem_giong_van(p, ("source_id", "school_id", "sach_ghi", "sach_goc"), cho_phep={"khắc"})
