# -*- coding: utf-8 -*-
"""SEO-B — trang kiến thức công khai dựng từ KB (chủ dự án chốt 2026-09-30):
index cả nháp AI, nhưng trạng thái nháp luôn được trả về để trang gắn nhãn.

Trang là ghép các trường KB có sẵn — không sinh nghĩa mới (tầng KB: "Cấm sinh nghĩa mới").
"""
from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.kb import trang
from app.main import app

client = TestClient(app)
KB = Path(__file__).parents[1] / "app" / "kb" / "data"


def test_danh_sach_du_ba_loai():
    ds = trang.danh_sach()
    dem = {l: sum(1 for t in ds if t["loai"] == l) for l in ("so", "que", "sao")}
    assert dem == {"so": 12, "que": 64, "sao": 14}
    assert len({(t["loai"], t["slug"]) for t in ds}) == len(ds)


def test_index_ca_nhap_nhung_giu_trang_thai(monkeypatch):
    assert all(t["index"] for t in trang.danh_sach())
    # Ý nghĩa số do chủ dự án tự viết → đã duyệt; quẻ & sao là nháp AI (trang phải gắn nhãn).
    assert trang.lay("so", "so-7")["trang_thai"] == "da_duyet"
    assert trang.lay("que", "que-1-can")["trang_thai"] == "nhap_ai"
    assert trang.lay("sao", "sao-tu-vi")["trang_thai"] == "nhap_ai"
    monkeypatch.setattr(trang, "INDEX_NHAP_AI", False)
    assert trang.lay("que", "que-1-can")["index"] is False
    assert trang.lay("so", "so-7")["index"] is True


def test_trang_so_ghep_dung_kb_khong_bia():
    t = trang.lay("so", "so-7")
    m = json.loads((KB / "thanso_meanings.json").read_text("utf-8"))["so_meanings"]["7"]
    van = json.dumps(t, ensure_ascii=False)
    for truong in ("tu_khoa", "mat_toi", "phan_chung"):
        assert m[truong] in van
    assert t["tieu_de"].startswith("Số 7")
    assert 50 <= len(t["mo_ta"]) <= 160
    assert t["tra_loi_nhanh"] and m["tu_khoa"] in t["tra_loi_nhanh"]
    assert t["hoi_dap"] and all(h["hoi"].endswith("?") for h in t["hoi_dap"])
    assert t["nguon"]


def test_so_cai_ghi_ro():
    assert "số cái" in trang.lay("so", "so-11")["tra_loi_nhanh"].lower()


def test_trang_que_va_sao():
    q = trang.lay("que", "que-1-can")
    assert "Càn" in q["tieu_de"] and "乾" in q["tieu_de"]
    assert any("Chu Dịch" in n for n in q["nguon"])
    s = trang.lay("sao", "sao-tham-lang")
    assert "Tham Lang" in s["tieu_de"]
    assert any(m["tieu_de"].startswith("Tham Lang ở 12 cung") for m in s["muc"])


def test_lien_quan_tro_toi_trang_ton_tai():
    co = {(t["loai"], t["slug"]) for t in trang.danh_sach()}
    for loai, slug in [("so", "so-1"), ("que", "que-2-khon"), ("sao", "sao-thai-duong")]:
        for l in trang.lay(loai, slug)["lien_quan"]:
            assert (l["loai"], l["slug"]) in co


def test_api():
    r = client.get("/v1/kb/trang")
    assert r.status_code == 200 and len(r.json()["trang"]) == 90
    r = client.get("/v1/kb/trang/so/so-22")
    assert r.status_code == 200 and r.json()["slug"] == "so-22"
    assert client.get("/v1/kb/trang/so/so-10").status_code == 404
    assert client.get("/v1/kb/trang/xyz/so-1").status_code == 404
