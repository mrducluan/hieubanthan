# -*- coding: utf-8 -*-
"""Q&A v2: gói bằng chứng + trả lời template (không LLM) + bộ kiểm tra LLM."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.luangiai import hoi
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
NGUOI = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988}
KIA = {"ho_ten": ["Trần Thị Mai"], "ngay": 13, "thang": 5, "nam": 1990}
NGAY_XEM = dt.date(2026, 9, 30)
KHO = [json.loads(l) for l in (Path(__file__).parents[1] / "fixtures" / "cau_hoi" /
                               "thanso_cau_hoi.jsonl").open(encoding="utf-8")]


def _hoi(cau, kia=None):
    return hoi_van.tra_loi(cau, NGUOI, kia, NGAY_XEM, dung_llm=False)


def test_khung_hoang_tra_mau_an_toan_khong_luan_so():
    out = _hoi("Tôi không muốn sống nữa.")
    assert out["phan_loai"]["xu_ly"] == "an_toan"
    assert "115" in out["cau_tra_loi"]
    assert not re.search(r"số chủ đạo|năm cá nhân", out["cau_tra_loi"])


def test_xo_so_tu_choi():
    out = _hoi("Cho tôi con số may mắn để đánh đề.")
    assert out["phan_loai"]["xu_ly"] == "tu_choi_nhe"
    assert "không" in out["cau_tra_loi"]


def test_tinh_yeu_dung_so_cua_nguoi_hoi_va_co_mat_toi():
    out = _hoi("Tôi cần gì ở một mối quan hệ?")
    muc = out["bang_chung"]["muc"]
    assert any(m["loai"] == "linh_vuc" and m["linh_vuc"] == "tinh_yeu" and m["vi_tri"] == "linh_hon"
               and m["so"] == 6 for m in muc)
    assert "Mặt tối" in out["cau_tra_loi"]
    assert all(m["source_id"] and m["school_id"] for m in muc)


def test_hop_doi_can_nguoi_kia_khi_thieu():
    out = _hoi("Tôi và người yêu có hợp nhau không?")
    assert out["can_them"] == ["nguoi_kia"]


def test_hop_doi_co_nguoi_kia():
    out = _hoi("Tôi và người yêu có hợp nhau không?", KIA)
    caps = {m["cap"] for m in out["bang_chung"]["muc"] if m["loai"] == "cap_so"}
    assert "1-6" in caps          # đường đời 33 (→6) và 1
    assert out["can_them"] == []


def test_hop_doi_tu_ngay_trong_cau():
    out = _hoi("Tôi sinh ngày 12/3/1995, anh ấy sinh 8/7/1993, có hợp không?")
    assert any(m["loai"] == "cap_so" for m in out["bang_chung"]["muc"])


def test_cap_so_neu_trong_cau():
    out = _hoi("Số chủ đạo 3 và 8 có hợp nhau không?")
    assert [m["cap"] for m in out["bang_chung"]["muc"] if m["loai"] == "cap_so"] == ["3-8"]


def test_thoi_diem_dung_nam_ca_nhan():
    out = _hoi("Năm nay của tôi thế nào?")
    ncn = [m for m in out["bang_chung"]["muc"] if m["loai"] == "nam_ca_nhan"]
    assert ncn and ncn[0]["nam"] == 2026 and ncn[0]["so"] == 8


def test_so_trong_cau_duoc_uu_tien():
    out = _hoi("Số chủ đạo 7 hợp nghề gì?")
    assert {m["so"] for m in out["bang_chung"]["muc"] if m["loai"] == "linh_vuc"} == {7}


def test_ky_thuat_tra_giai_thich():
    out = _hoi("Số 33 có được giữ nguyên không hay rút về 6?")
    assert any(m["loai"] == "giai_thich" and m["ma"] == "so_cai" for m in out["bang_chung"]["muc"])


def test_bieu_do_mui_ten():
    out = _hoi("Tôi có mũi tên nào trong biểu đồ ngày sinh?")
    assert any(m["loai"] == "mui_ten" and m["ma"] == "3-5-7" and m["trong"] for m in out["bang_chung"]["muc"])


def test_template_khong_co_so_la():
    """Mọi con số trong câu trả lời template phải có trong gói bằng chứng."""
    for cau in ["Tôi hợp với nghề gì?", "Năm nay của tôi thế nào?", "Tôi có nợ nghiệp không?",
                "Tôi và người yêu có hợp nhau không?"]:
        out = _hoi(cau, KIA)
        assert hoi_van.kiem_tra_dau_ra(out["cau_tra_loi"], out["bang_chung"]) == [], cau


def test_kiem_tra_llm_chan_so_la_va_cum_cam():
    goi = _hoi("Tôi hợp với nghề gì?")["bang_chung"]
    assert hoi_van.kiem_tra_dau_ra("Bạn sẽ chắc chắn giàu vào năm 2031.", goi) != []
    assert hoi_van.kiem_tra_dau_ra("Theo số 9 của bạn, bạn hợp việc có ý nghĩa.", goi) == []


def test_llm_vi_pham_roi_ve_template(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "gia")
    monkeypatch.setattr(hoi_van, "_goi_llm", lambda goi, cau: "Bạn sẽ chắc chắn thành công năm 2099.")
    out = hoi_van.tra_loi("Tôi hợp với nghề gì?", NGUOI, None, NGAY_XEM, dung_llm=True)
    assert out["che_do"] == "template_fallback"
    assert "2099" not in out["cau_tra_loi"]


def test_do_phu_kho_cau_hoi_khong_llm():
    """≥ 90% câu trong kho có câu trả lời có căn cứ KB (hoặc mẫu cố định) khi KHÔNG có LLM."""
    du = 0
    for r in KHO:
        out = hoi_van.tra_loi(r["cau_hoi"], NGUOI, KIA, NGAY_XEM, dung_llm=False)
        if out["do_phu"] == "day_du":
            du += 1
    assert du / len(KHO) >= 0.90, du / len(KHO)


def test_api_hoi_khong_key_van_tra_loi(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = client.post("/v1/thanso/hoi", json={**NGUOI, "cau_hoi": "Tôi hợp với nghề gì?",
                                             "ngay_xem": "2026-09-30"})
    assert r.status_code == 200
    d = r.json()
    assert d["che_do"] == "template" and d["cau_tra_loi"]
    assert d["da_bat_llm"] is False


def test_api_hoi_nguoi_kia(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = client.post("/v1/thanso/hoi", json={**NGUOI, "cau_hoi": "Tôi và người yêu có hợp nhau không?",
                                             "nguoi_kia": {"ngay": 13, "thang": 5, "nam": 1990}})
    assert r.status_code == 200 and r.json()["can_them"] == []
