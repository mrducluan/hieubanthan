# -*- coding: utf-8 -*-
"""Đợt 2B — Kiểm định tích hợp Tarot (Mary K. Greer 2002) & Kinh Dịch Lục Hào thực chiến (Vương Hổ Ứng & Thiệu Vĩ Hoa)."""
from __future__ import annotations

import json
from pathlib import Path

from app.kb import sach_ghi as sg, tuvi_doi_song_kb as kds
from app.luangiai import tarot as lg_tarot

_DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"


def _kiem_sach_giong_van(path: Path, bo_qua_khoa: tuple[str, ...], cho_phep_tu: set[str] | None = None) -> None:
    kb = json.loads(path.read_text("utf-8"))
    bo = cho_phep_tu or set()
    cam = [w for w in kds.cum_cam() if w not in bo]
    cum = kds.cum_chung_chung()

    def _walk(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for k, v in x.items():
                if not k.startswith("_") and k not in bo_qua_khoa:
                    yield from _walk(v)
        elif isinstance(x, list):
            for v in x:
                yield from _walk(v)

    for s in _walk(kb):
        assert not sg.kiem_loi(s), f"{path.name} lỗi kiểm lời: {s}"
        assert not kds.tim_cum_cam(s, cam), f"{path.name} từ cấm: {s} -> {kds.tim_cum_cam(s, cam)}"
        assert not kds.tim_cum_cam(s, cum), f"{path.name} cụm chung chung: {s} -> {kds.tim_cum_cam(s, cum)}"


def test_tarot_greer_nguoc_du_22_an_chinh_va_trich_sach():
    p = _DATA / "tarot_greer_nguoc.json"
    kb = json.loads(p.read_text("utf-8"))
    assert len(kb["la"]) == 22
    for i in range(22):
        ma = f"dai_{i}"
        muc = kb["la"][ma]
        assert muc.get("mat_tieu_cuc_can_chu_y") and muc.get("huong_chuyen_hoa")
        sgh = muc.get("sach_ghi") or {}
        assert sgh.get("trang") and sgh.get("tom_y") and "trich" not in sgh, f"sach_ghi sai ở {ma} (TK-2: không chép nguyên văn)"
    _kiem_sach_giong_van(p, ("source_id", "school_id", "sach_ghi", "sach_goc"))


def test_tarot_bao_cao_la_nguoc_tich_hop_greer():
    bc = lg_tarot.bao_cao("ba_la_thoi_gian", [
        {"id": "dai_0", "nguoc": True},
        {"id": "dai_15", "nguoc": True},
        {"id": "dai_19", "nguoc": False},
    ])
    tung_la = next(c for c in bc["chuong"] if c["ma"] == "tung_la")
    hop0 = tung_la["hop"][0]
    assert "Nên chú ý" in hop0["noi_dung"]
    assert any("Mary K. Greer" in cc for cc in hop0["can_cu"])


def test_kinhdich_luc_hao_thuc_chien_du_muc_va_giong_van():
    from app.kb import kinhdich_kb
    p = _DATA / "kinhdich_luc_hao_thuc_chien.json"
    kb = kinhdich_kb.luc_hao_thuc_chien()
    assert len(kb["nguyen_tac"]) == 8
    assert set(kb["luc_than_thuc_chien"].keys()) == {"Quan Quỷ", "Thê Tài", "Phụ Mẫu", "Tử Tôn", "Huynh Đệ"}
    for nhom in ("nguyen_tac", "luc_than_thuc_chien"):
        for ma, muc in kb[nhom].items():
            assert muc.get("mat_tich_cuc") and muc.get("mat_tieu_cuc_can_chu_y")
            sgh = muc.get("sach_ghi") or {}
            assert sgh.get("nguon") and "han" not in sgh, f"sach_ghi sai ở {nhom}.{ma} (TK-2: không chép nguyên văn)"
    _kiem_sach_giong_van(p, ("source_id", "school_id", "sach_ghi", "sach_goc"), cho_phep_tu={"khắc"})


def test_kinhdich_goc_nhin_luc_hao_noi_song_thuc_chien():
    import datetime as dt
    from app.hoidap import kinhdich as hd

    out = hd.tra_loi("Món nợ này có đòi được không?", "tu_dong", gia_tri_hao=[7, 8, 9, 7, 8, 7],
                     thoi_diem=dt.datetime(2026, 5, 10, 10, 0))
    gn = ((out.get("doc_que") or {}).get("goc_nhin") or {}).get("luc_hao")
    assert gn and gn.get("thuc_chien_luu_y"), "Phải nối sống được thuc_chien_luu_y vào _goc_nhin_luc_hao"
    assert gn["thuc_chien_luu_y"]["dung_than"]["mat_tieu_cuc_can_chu_y"]
    assert gn["thuc_chien_luu_y"]["nguyen_tac"]["sach_ghi"]["nguon"]
    assert "han" not in gn["thuc_chien_luu_y"]["nguyen_tac"]["sach_ghi"]

