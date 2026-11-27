# -*- coding: utf-8 -*-
"""Chặng 3.1 (& 3.2) — Kiểm thử Tầng Chiến thuật Sự vụ tức thời (Kỳ Môn · Lục Hào)."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.kb import sach_ghi
from app.luangiai import doi_song_khuon as dsk
from app.luangiai import su_vu_tuc_thoi as sv
from app.main import app
from tests import _dau_ra as dr

ROOT = Path(__file__).resolve().parents[1]
NGUON = ROOT / "fixtures" / "nguon"
KB_DIR = ROOT / "app" / "kb" / "data"
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)


def _quet_chuoi(obj, bo_qua=frozenset()):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in bo_qua:
                continue
            yield from _quet_chuoi(v, bo_qua)
    elif isinstance(obj, list):
        for x in obj:
            yield from _quet_chuoi(x, bo_qua)
    elif isinstance(obj, str):
        yield obj


def test_su_vu_kb_trich_co_thu_khop_nguyen_van_tung_chu():
    km_raw = sach_ghi.chuan(
        "\n".join(t.get("van", "") for t in json.loads((NGUON / "ky_mon_co_kim_do_thu.json").read_text("utf-8"))["thien"])
    )
    lh_raw = sach_ghi.chuan(
        "\n".join(t.get("van", "") for t in json.loads((NGUON / "tang_san_boc_dich.json").read_text("utf-8"))["thien"])
    )
    kb = json.loads((KB_DIR / "su_vu_chien_thuat_kb.json").read_text("utf-8"))
    cam = [(c, re.compile(rf"(?<!\w){re.escape(c.lower())}(?!\w)")) for c in dsk.cum_cam_chung()]
    assert len(kb["tinh_huong"]) == 6
    for ma, th in kb["tinh_huong"].items():
        h_km = sach_ghi.chuan(th["trich_ky_mon"]["han"])
        h_lh = sach_ghi.chuan(th["trich_luc_hao"]["han"])
        assert len(h_km) >= 10 and h_km in km_raw, f"Lệch nguyên văn Kỳ Môn ở {ma}: {th['trich_ky_mon']['han']}"
        assert len(h_lh) >= 6 and h_lh in lh_raw, f"Lệch nguyên văn Lục Hào ở {ma}: {th['trich_luc_hao']['han']}"
        for s in _quet_chuoi(th, bo_qua=frozenset({"han"})):
            low = s.lower()
            for c_str, pat in cam:
                assert not pat.search(low), f"Vi phạm cụm cấm '{c_str}' ở {ma}: {s}"


def test_api_su_vu_6_tinh_huong_khong_gop_diem_va_song_ngu_sach():
    client = TestClient(app)
    for ma in sv.MA_TINH_HUONG:
        payload_vi = {
            "cau_hoi": "Tuần này gặp đối tác bàn hợp đồng cung ứng hàng hoá cần chuẩn bị gì?",
            "tinh_huong": ma,
            "ngay_xem": "2026-11-28",
            "gio_xem": "09:30",
            "hat_giong": f"seed-{ma}",
        }
        r_vi = client.post("/v1/co-van/su-vu", json=payload_vi)
        assert r_vi.status_code == 200, r_vi.text
        vi = r_vi.json()
        assert vi["mo_dun"] == "su_vu_tuc_thoi"
        assert "diem" not in vi and "tong_diem" not in vi  # CD-1: tuyệt đối không gộp điểm liên môn
        assert vi["goc_ky_mon"]["trich_co_thu"]["han"]
        assert vi["goc_luc_hao"]["dung_than"]
        assert len(vi["goc_luc_hao"]["gia_tri_hao"]) == 6

        r_en = client.post(
            "/v1/co-van/su-vu",
            json={**payload_vi, "cau_hoi": "Should we finalize the supply agreement this Friday morning?"},
            headers={"x-ngon-ngu": "en"},
        )
        assert r_en.status_code == 200, r_en.text
        en = r_en.json()
        assert not _VIET.search(json.dumps(en, ensure_ascii=False)), f"Rò chữ Việt ở {ma}: {en}"
        assert dr.khung(vi) == dr.khung(en)


def test_su_vu_an_toan_va_tuoi_16():
    kq_cc = sv.xem_su_vu(cau_hoi="Tối nay đánh đề con gì ăn chắc?", tinh_huong="ra_mat_khai_truong")
    assert "an_toan_chan" in kq_cc and "goc_luc_hao" not in kq_cc

    kq_kh = sv.xem_su_vu(cau_hoi="I want to kill myself tonight", tinh_huong="hoa_giai_bat_dong")
    assert "988" in kq_kh["an_toan_chan"]["cau_tra_loi"] and not _VIET.search(kq_kh["an_toan_chan"]["cau_tra_loi"])

    kq_nk = sv.xem_su_vu(cau_hoi="Chồng tôi có ngoại tình không", tinh_huong="hoa_giai_bat_dong")
    assert kq_nk["chuyen_huong"]["ly_do"] == "nguoi_khac" and "goc_luc_hao" not in kq_nk

    kq_nho = sv.xem_su_vu(
        cau_hoi="Em muốn mở shop bán phụ kiện tuần tới",
        tinh_huong="ra_mat_khai_truong",
        ngay_xem=dt.date(2026, 11, 27),
        ngay_sinh=dt.date(2013, 5, 10),
    )
    assert kq_nho["chuyen_huong_tuoi"]["tuoi"] < 16
    assert "goc_luc_hao" not in kq_nho


def test_su_vu_dung_than_mot_nguon_kinhdich_tra_loi():
    from app.kb import kinhdich_tra_loi_kb as kd_kb
    kb = json.loads((KB_DIR / "su_vu_chien_thuat_kb.json").read_text("utf-8"))
    for ma, th in kb["tinh_huong"].items():
        assert "dung_than" not in th, f"{ma}: bảng dụng thần thứ hai — phải lấy từ kinhdich_tra_loi"
        kq = sv.xem_su_vu(cau_hoi="Cần chuẩn bị gì cho việc này tuần tới?", tinh_huong=ma,
                          ngay_xem=dt.date(2026, 12, 1), gio_xem="09:00", hat_giong=f"s-{ma}")
        assert kq["goc_luc_hao"]["dung_than"] == kd_kb.dung_than_viec(th["viec_kinh_dich"])["chinh"], ma
    assert kb["tinh_huong"]["dam_phan_thuong_vu"]["viec_kinh_dich"] == "hop_tac"
    assert kb["tinh_huong"]["cho_tin_ket_qua"]["viec_kinh_dich"] == "giay_to"
    assert kb["tinh_huong"]["hoa_giai_bat_dong"]["viec_kinh_dich"] == "tranh_chap"
    assert "起行" not in kb["tinh_huong"]["cho_tin_ket_qua"]["trich_ky_mon"]["han"]   # câu xuất hành → câu tin tức


def test_su_vu_gio_dang_xem_doc_dung_muc_cua_doc_gio():
    # 2026-12-01, việc gặp gỡ: 09:00 và 15:00 thuận, 07:00 và 13:00 nên giữ nhịp (theo luangiai.ky_mon.doc_gio)
    muc = {}
    for gio in ("07:00", "09:00", "13:00", "15:00"):
        kq = sv.xem_su_vu(cau_hoi="Cần chuẩn bị gì cho buổi gặp đối tác?", tinh_huong="dam_phan_thuong_vu",
                          ngay_xem=dt.date(2026, 12, 1), gio_xem=gio, hat_giong="abcd")
        g = kq["goc_ky_mon"]["gio_dang_xem"]
        assert g["khung"].startswith(gio), g
        muc[gio] = g["muc"]
    assert muc == {"07:00": "cham", "09:00": "thuan", "13:00": "cham", "15:00": "thuan"}


def test_su_vu_khong_gio_xem_gieo_theo_gio_hien_tai():
    kq = sv.xem_su_vu(cau_hoi="Cần chuẩn bị gì cho buổi gặp đối tác?", tinh_huong="dam_phan_thuong_vu", hat_giong="abcd")
    assert kq["goc_ky_mon"]["gio_dang_xem"] is None
    assert kq["goc_luc_hao"]["thoi_diem_gieo"][:10] == kq["goc_ky_mon"]["ngay"]


def test_api_su_vu_ngay_sinh_truoc_1930_va_loi_theo_ngon_ngu():
    client = TestClient(app)
    p = {"cau_hoi": "Cần chuẩn bị gì cho buổi ký hợp đồng?", "tinh_huong": "ky_ket_hop_dong", "hat_giong": "abcd"}
    assert client.post("/v1/co-van/su-vu", json={**p, "ngay_sinh": "1925-03-01"}).status_code == 200
    r = client.post("/v1/co-van/su-vu", json={**p, "ngay_sinh": "1890-03-01"}, headers={"x-ngon-ngu": "en"})
    assert r.status_code == 422 and not _VIET.search(r.json()["detail"])
