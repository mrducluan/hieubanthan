# -*- coding: utf-8 -*-
"""Gói 1C — Kiểm định 9 cách cục Kỳ Môn mở rộng từ Phù Ứng Kinh & Kỳ Môn Thống Tông + kho chuyển nghĩa."""
from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.calc import ky_mon as km
from app.calc import ky_mon_cach as kc
from app.kb import sach_ghi as sg
from app.main import app

_GOC = Path(__file__).resolve().parents[1]
_KM_KB = _GOC / "app" / "kb" / "data" / "ky_mon_kb.json"
_CN_KB = _GOC / "app" / "kb" / "data" / "chuyen_nghia_kb.json"
client = TestClient(app)


def test_9_cach_moi_khop_kb_va_sx_c():
    moi = {"van_don", "phong_don", "thien_at_phuc_cung", "thien_at_phi_cung",
           "phuc_can_cach", "phi_can_cach", "dai_cach", "hinh_cach", "tieu_cach"}
    kb = json.loads(_KM_KB.read_text("utf-8"))
    assert moi.issubset(set(kc.CACH.keys()))
    assert moi.issubset(set(kb["cach"].keys()))
    n_km, loi_km = sg.kiem_tep(_KM_KB)
    n_cn, loi_cn = sg.kiem_tep(_CN_KB)
    assert n_km >= 50 and not loi_km, loi_km
    assert n_cn >= 15 and not loi_cn, loi_cn


def test_tat_ca_9_cach_moi_xuat_hien_tren_18_cuc_60_gio():
    """Quét 18 cục × 60 giờ với mẫu can ngày để bảo đảm 9 cách cục mới đều có thể kích hoạt chuẩn xác."""
    thay: set[str] = set()
    for duong in (True, False):
        for cuc in range(1, 10):
            for gio in range(60):
                ban = km.ban_gio(cuc, duong, gio)
                for c in kc.nhan_dien(ban, can_ngay="Ất"):
                    thay.add(c["ma"])
    moi = {"van_don", "phong_don", "thien_at_phuc_cung", "thien_at_phi_cung",
           "phuc_can_cach", "phi_can_cach", "dai_cach", "hinh_cach", "tieu_cach"}
    assert moi.issubset(thay), f"Thiếu cách cục không bao giờ kích hoạt: {moi - thay}"


def test_dieu_kien_dai_hinh_tieu_cach_va_don():
    # Quét tìm một bàn có Đại Cách (Canh trên Quý) và kiểm tra đúng cung đó
    found_dai = False
    for cuc in range(1, 10):
        for gio in range(60):
            ban = km.ban_gio(cuc, True, gio)
            for c in kc.nhan_dien(ban):
                if c["ma"] == "dai_cach":
                    o = ban["cung"][c["cung"]]
                    assert "Canh" in (o["thien_ban"], o.get("thien_ban_ky")) and o["dia_ban"] == "Quý"
                    found_dai = True
                    break
            if found_dai:
                break
        if found_dai:
            break
    assert found_dai


def test_api_ky_mon_ban_van_chay_sach():
    r = client.post("/v1/ky-mon/ban", json={"thoi_diem": "2026-11-19T09:30:00", "utc": 7})
    assert r.status_code == 200
    d = r.json()
    assert len(d["doc"]["huong"]) == 8
