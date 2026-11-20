# -*- coding: utf-8 -*-
"""Đợt 4 — Kiểm định tích hợp Nhân Tướng (Bridges + 150 cổ thư), Chỉ Tay phương Tây, Kỳ Môn Cửu Độn & Tử Vi Tử Vân."""
from __future__ import annotations

import json
from pathlib import Path

from app.kb import sach_ghi as sg, tuong_hoc_dot4_kb as d4, tuvi_doi_song_kb as kds

_DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"


def _kiem_giong_van(path: Path, bo_qua: tuple[str, ...]) -> None:
    kb = json.loads(path.read_text("utf-8"))
    cam = kds.cum_cam()
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


def test_nhantuong_bridges_va_co_thu():
    p = _DATA / "nhantuong_ngu_hanh_va_co_thu.json"
    kb = d4.nhantuong_bridges_co_thu()
    assert set(kb["ngu_hanh_bridges"].keys()) == {"thuy", "moc", "hoa", "tho", "kim"}
    for h, muc in kb["ngu_hanh_bridges"].items():
        assert muc.get("mat_tich_cuc") and muc.get("mat_tieu_cuc_can_chu_y")
        sgh = muc.get("sach_ghi") or {}
        assert sgh.get("nguon") and "trich" not in sgh, f"sach_ghi sai ở {h} (TK-2: không chép nguyên văn)"
    giu, bo = kb["quy_tac_co_thu"], kb["quy_tac_khong_dua"]
    assert kb["tong_so_quy_tac_co_thu"] == len(giu)
    assert len(giu) + len(bo) == 150 and not {m["ma"] for m in giu} & {m["ma"] for m in bo}
    assert all(m.get("ly_do") and set(m) == {"ma", "ly_do"} for m in bo)   # quy tắc không đưa: chỉ còn mã + lý do
    assert d4.tra_ngu_hanh_bridges("moc")["ten"].startswith("Tướng Mộc")
    _kiem_giong_van(p, ("source_id", "school_id", "sach_ghi", "sach_goc", "han", "am", "chuong", "quy_tac_khong_dua"))


def test_chitay_phuong_tay_kinh_dien():
    p = _DATA / "chitay_phuong_tay_kinh_dien.json"
    kb = d4.chitay_phuong_tay()
    assert set(kb["duong_chinh"].keys()) == {"sinh_dao", "tri_dao", "tam_dao", "dinh_menh"}
    assert len(kb["bay_go"]) == 7
    for nhom in ("duong_chinh", "bay_go"):
        for ma, muc in kb[nhom].items():
            assert muc.get("mat_tich_cuc") and muc.get("mat_tieu_cuc_can_chu_y")
            assert (muc.get("sach_ghi") or {}).get("trich"), f"Thiếu trích dẫn ở {nhom}.{ma}"
    _kiem_giong_van(p, ("source_id", "school_id", "sach_ghi", "sach_goc"))


def test_kymon_bi_kip_cuu_don_va_nhan_dien():
    p = _DATA / "ky_mon_bi_kip_cuu_don.json"
    kb = d4.kymon_cuu_don()
    assert len(kb["cuu_don"]) == 9
    for ma, muc in kb["cuu_don"].items():
        assert muc.get("mat_tich_cuc") and muc.get("mat_tieu_cuc_can_chu_y")
        sgh = muc.get("sach_ghi") or {}
        assert sgh.get("han") and sgh.get("chuong") and not sg.kiem_muc(sgh), f"Câu sách Cửu Độn sai ở {ma}"
    _kiem_giong_van(p, ("source_id", "school_id", "sach_ghi", "sach_ghi_khac", "sach_goc"))

    # Kiểm thử bộ nhận diện Cửu Độn trên dữ liệu cung thực tế
    td = d4.tra_cuu_don_cung("Bính", "Đinh", "Sinh", "Cửu Thiên", 3)
    ma_td = {x["ma"] for x in td}
    assert {"thien_don", "than_don"} <= ma_td
    dd = d4.tra_cuu_don_cung("Ất", "Kỷ", "Khai", "Trực Phù", 6)
    assert any(x["ma"] == "dia_don" for x in dd)
    nd = d4.tra_cuu_don_cung("Đinh", "Mậu", "Hưu", "Thái Âm", 1)
    assert any(x["ma"] == "nhan_don" for x in nd)
    # Hiển thị: câu Hán (khớp kho nguồn) + lời Việt + nơi dẫn sách, quyển; lời đời thường ghi rõ tóm ý theo Bí Kíp.
    for x in td:
        assert x["sach_ghi"]["han"] and x["sach_ghi"]["loi"] and "quyển" in x["sach_ghi"]["nguon"]
        assert "Bí Kíp" in x["dien_giai_theo"]


def test_tuvi_tu_van_thai_tue():
    p = _DATA / "tuvi_tu_van_thai_tue.json"
    kb = d4.tuvi_tu_van()
    assert len(kb["nguyen_tac_tu_van"]) == 6
    for ma, muc in kb["nguyen_tac_tu_van"].items():
        assert muc.get("mat_tich_cuc") and muc.get("mat_tieu_cuc_can_chu_y")
        sgh = muc.get("sach_ghi") or {}
        assert sgh.get("nguon") and "trich" not in sgh, f"sach_ghi sai ở {ma} (TK-2: không chép nguyên văn)"
    _kiem_giong_van(p, ("source_id", "school_id", "sach_ghi", "sach_goc"))
