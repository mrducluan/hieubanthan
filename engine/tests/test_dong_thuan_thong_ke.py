# -*- coding: utf-8 -*-
"""Ý4 — thước "đồng thuận liên môn" (luangiai/dong_thuan_thong_ke + scripts/dong_thuan_lien_mon): thống kê thuần đúng số, tệp KB
đã sinh đúng cấu trúc, lệnh chạy được trên mẫu nhỏ không ghi tệp, route quản trị trả bảng, Chân dung tổng hợp thêm câu
"hiếm khi trùng" chỉ khi kappa < 0,1 (lời + căn cứ, không đổi mức / mã)."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.luangiai import chan_dung_tong_hop as cd
from app.luangiai import dong_thuan_thong_ke as dtk
from app.main import app

client = TestClient(app)


def test_thong_ke_mang_so_dung():
    cap = [("thuan", "thuan")] * 6 + [("thuan", "can_bang")] * 2 + [("can_bang", "can_bang")] * 1 + [("can_chu_dong", "thuan")] * 1 + [(None, "thuan"), ("thuan", None)]
    t = dtk.thong_ke_mang(cap)
    assert t["n"] == 10 and t["cung"] == 7 and t["ti_le_cung"] == 0.7
    # biên: tv thuận 8, cân bằng 1, chủ động 1 · bt thuận 7, cân bằng 3 → pe = .8*.7 + .1*.3 + .1*0 = 0.59
    assert t["ngau_nhien"] == 0.59
    assert t["kappa"] == round((0.7 - 0.59) / (1 - 0.59), 4)
    assert t["bang"]["thuan"]["can_bang"] == 2 and t["bien"]["battu"]["can_bang"] == 3


def test_thong_ke_rong_va_nhan():
    t = dtk.thong_ke_mang([(None, None), ("x", "thuan")])
    assert t["n"] == 0 and t["kappa"] is None
    assert dtk.nhan_kappa(None) == "chua_du" and dtk.nhan_kappa(0.05) == "gan_ngau_nhien"
    assert dtk.nhan_kappa(0.2) == "trung_it" and dtk.nhan_kappa(0.5) == "trung_dang_ke"
    assert set(dtk.thong_ke([])) == set(dtk.MANG)


def test_tep_kb_da_sinh_dung_cau_truc():
    d = json.loads(dtk.TEP.read_text(encoding="utf-8"))
    assert d["_sinh_boi"].endswith("dong_thuan_lien_mon.py") and d["ngay"] and d["n"] >= dtk.NGUONG["n_toi_thieu"]
    assert set(d["mang"]) == set(dtk.MANG)
    for m, t in d["mang"].items():
        assert t["n"] <= d["n"] and 0 <= t["ti_le_cung"] <= 1 and -1 <= t["kappa"] <= 1 and t["nhan"] in ("gan_ngau_nhien", "trung_it", "trung_dang_ke")
        assert sum(t["bien"]["tuvi"].values()) == t["n"] == sum(t["bien"]["battu"].values())
    assert dtk.cua_mang("cong_viec")["n_tong"] == d["n"]


def test_lenh_chay_mau_nho_khong_ghi(monkeypatch, tmp_path):
    from scripts import dong_thuan_lien_mon as sc
    truoc = dtk.TEP.read_bytes()
    monkeypatch.setattr(dtk, "TEP", tmp_path / "khong_ghi.json")
    kq = sc.chay(5, ghi=False, im=True)
    assert kq["n"] == 5 and set(kq["mang"]) == set(dtk.MANG) and all(t["n"] <= 5 for t in kq["mang"].values())
    assert not (tmp_path / "khong_ghi.json").exists()
    assert truoc == Path(dtk.__file__).parents[1].joinpath("kb", "data", "dong_thuan_thong_ke.json").read_bytes()   # tệp thật không bị đụng
    assert "cùng mức" in sc.bang(kq)


def test_route_quan_tri_dong_thuan(monkeypatch):
    monkeypatch.setenv("ENGINE_QUAN_TRI_KEY", "k-test")
    r = client.get("/v1/quan-tri/dong-thuan", headers={"x-quan-tri-key": "k-test"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["co"] is True and d["nguong"]["kappa_thap"] == 0.1 and d["mang"]["tien_bac"]["ten"] == "Tiền bạc"
    assert client.get("/v1/quan-tri/dong-thuan", headers={"x-quan-tri-key": "sai"}).status_code in (401, 403)


def test_chan_dung_them_cau_hiem_trung_theo_kappa(monkeypatch):
    goc = cd.dong_thuan("tien_bac", {"tuvi": "thuan", "battu": "can_chu_dong", "nhantuong": None})
    monkeypatch.setattr(dtk, "cua_mang", lambda m: {"n": 1000, "ti_le_cung": 0.33, "ngau_nhien": 0.34, "kappa": -0.01})
    h = cd.dong_thuan("tien_bac", {"tuvi": "thuan", "battu": "can_chu_dong", "nhantuong": None})
    assert "hiếm khi trùng" in h["noi_dung"] and any("kappa" in c for c in h["can_cu"])
    assert h["ma_mau"] == goc["ma_mau"] and h.get("muc") == goc.get("muc") and h["huong_xu_ly"] == goc["huong_xu_ly"]
    monkeypatch.setattr(dtk, "cua_mang", lambda m: {"n": 1000, "ti_le_cung": 0.6, "ngau_nhien": 0.34, "kappa": 0.4})
    h2 = cd.dong_thuan("tien_bac", {"tuvi": "thuan", "battu": "can_chu_dong", "nhantuong": None})
    assert "hiếm khi trùng" not in h2["noi_dung"] and any("kappa" in c for c in h2["can_cu"])
    # cùng mức → không đụng gì
    monkeypatch.setattr(dtk, "cua_mang", lambda m: pytest.fail("không được gọi khi cùng mức"))
    cd.dong_thuan("tien_bac", {"tuvi": "thuan", "battu": "thuan", "nhantuong": None})
