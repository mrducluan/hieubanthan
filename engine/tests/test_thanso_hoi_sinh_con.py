# -*- coding: utf-8 -*-
"""Hỏi đáp Thần số — câu chọn ngày sinh cho con (tsq00170) từng ném IndexError → 500.

Câu nhắc tới "con / bé" nhưng không kèm ngày sinh, không gửi `nguoi_kia`, lại hỏi thời điểm ("ngày nào"): gói bằng chứng
rơi về con số của NGƯỜI HỎI (như tsq00169 "Nên sinh con năm nào thì tốt?") nên mốc thời gian cũng phải tính theo người hỏi,
không được đọc `ngay_nhac[0]` rỗng."""
import datetime as _dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.luangiai import hoi
from app.main import app

client = TestClient(app)
KHO = Path(__file__).resolve().parents[1] / "fixtures" / "cau_hoi" / "thanso_cau_hoi.jsonl"
CAU = [json.loads(d) for d in KHO.read_text(encoding="utf-8").splitlines() if d.strip()]
NGUOI = {"ho_ten": ["Nguyễn Văn An"], "ngay": 24, "thang": 10, "nam": 1988}
XEM = _dt.date(2026, 11, 10)
CAU_170 = next(c["cau_hoi"] for c in CAU if c["id"] == "tsq00170")


def test_tsq00170_goi_bang_chung_theo_nguoi_hoi():
    goi = hoi.goi_bang_chung(hoi.phan_loai(CAU_170), NGUOI, None, XEM)
    assert not goi.get("can_them")                     # câu chọn ngày sinh: không đòi dữ liệu người kia
    loai = [m["loai"] for m in goi["muc"]]
    assert "linh_vuc" in loai and "nam_ca_nhan" in loai
    # năm cá nhân là của người hỏi → giống hệt câu cùng loại hỏi theo năm
    goi_169 = hoi.goi_bang_chung(hoi.phan_loai("Nên sinh con năm nào thì tốt?"), NGUOI, None, XEM)
    nam = next(m for m in goi["muc"] if m["loai"] == "nam_ca_nhan")
    assert nam == next(m for m in goi_169["muc"] if m["loai"] == "nam_ca_nhan")


def test_tsq00170_endpoint_khong_500(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = client.post("/v1/thanso/hoi", json={**NGUOI, "cau_hoi": CAU_170, "ngay_xem": "2026-11-10"})
    assert r.status_code == 200, r.text[:500]


def test_ca_kho_cau_hoi_khong_nem_loi_khi_thieu_nguoi_kia():
    """Mọi câu trong kho, không gửi `nguoi_kia`: hoặc trả gói bằng chứng, hoặc xin thêm thông tin — không bao giờ ném lỗi."""
    loi = []
    for c in CAU:
        try:
            hoi.goi_bang_chung(hoi.phan_loai(c["cau_hoi"]), NGUOI, None, XEM)
        except Exception as e:  # noqa: BLE001
            loi.append((c["id"], repr(e)))
    assert not loi, loi[:10]
