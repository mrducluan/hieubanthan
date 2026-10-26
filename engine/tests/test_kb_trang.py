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
    dem = {l: sum(1 for t in ds if t["loai"] == l) for l in trang.LOAI}
    assert dem == {"so": 12, "que": 64, "sao": 14, "cung": 12, "thap_than": 10, "nhat_chu": 10,
                   # SEO-G: cụm thần số theo nhu cầu tìm kiếm
                   "cap_so": 45, "nghe": 12, "tinh_yeu": 12, "nam_ca_nhan": 9, "no_nghiep": 4,
                   "sao_cung": 168,   # SEO-H: 14 chính tinh × 12 cung
                   "hoa_cung": 48,    # SEO-I: 4 tứ hoá × 12 cung
                   "menh_nam": 76,    # SEO-J: sinh năm 1950–2025 mệnh gì
                   "so_kep": 43,      # TS-PHAI: số kép Chaldea 10–52
                   "dau_hieu": 23}    # Y5: dấu hiệu nhà ở (form Khảo sát nhà)
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
    assert r.status_code == 200 and len(r.json()["trang"]) == 562
    r = client.get("/v1/kb/trang/so/so-22")
    assert r.status_code == 200 and r.json()["slug"] == "so-22"
    assert client.get("/v1/kb/trang/so/so-10").status_code == 404
    assert client.get("/v1/kb/trang/xyz/so-1").status_code == 404


# ---- SEO-C: 12 cung Tử vi · 10 thập thần · 10 nhật chủ Bát tự ------------------------------
def test_trang_cung_ghep_kb_va_lien_sao():
    t = trang.lay("cung", "cung-phu-the")
    c = json.loads((KB / "tuvi_kb.json").read_text("utf-8"))["cung"]["Phu Thê"]
    van = json.dumps(t, ensure_ascii=False)
    for truong in ("y_nghia", "xem_duoc", "khong_tra_loi", "cau_tu_soi"):
        assert c[truong] in van
    assert "Phu Thê" in t["tieu_de"]
    # mục "14 chính tinh ở cung này" lấy nguyên câu sao_cung của KB
    sc = json.loads((KB / "tuvi_kb.json").read_text("utf-8"))["sao_cung"]["Thái Âm"]["Phu Thê"]
    assert sc in van
    assert 50 <= len(t["mo_ta"]) <= 160 and t["trang_thai"] == "nhap_ai"


def test_trang_thap_than_va_nhat_chu():
    t = trang.lay("thap_than", "chinh-quan")
    tt = json.loads((KB / "battu_kb.json").read_text("utf-8"))["thap_than"]["Chính Quan"]
    van = json.dumps(t, ensure_ascii=False)
    for truong in ("y_nghia", "tinh_cach", "khi_nhieu", "khi_thieu", "cau_tu_soi"):
        assert tt[truong].lower() in van.lower()       # chỉ viết hoa chữ đầu câu, không đổi nội dung
    n = trang.lay("nhat_chu", "nhat-chu-giap")
    nc = json.loads((KB / "battu_kb.json").read_text("utf-8"))["nhat_chu"]["Giáp"]
    van = json.dumps(n, ensure_ascii=False)
    assert nc["hinh_tuong"] in van and all(v in van for v in nc["mua"].values())
    assert "Giáp" in n["tieu_de"]
    for x in (t, n):
        assert x["hoi_dap"] and all(h["hoi"].endswith("?") for h in x["hoi_dap"])
        assert 50 <= len(x["mo_ta"]) <= 160


def test_lien_quan_loai_moi_ton_tai():
    co = {(t["loai"], t["slug"]) for t in trang.danh_sach()}
    for loai, slug in [("cung", "cung-menh"), ("thap_than", "ty-kien"), ("nhat_chu", "nhat-chu-quy")]:
        for l in trang.lay(loai, slug)["lien_quan"]:
            assert (l["loai"], l["slug"]) in co


def test_api_loai_moi():
    assert client.get("/v1/kb/trang/cung/cung-tat-ach").status_code == 200
    assert client.get("/v1/kb/trang/thap_than/that-sat").status_code == 200
    assert client.get("/v1/kb/trang/nhat_chu/nhat-chu-nham").status_code == 200
    assert client.get("/v1/kb/trang/sao_cung/thai-am-cung-phu-the").status_code == 200    # SEO-H
    assert client.get("/v1/kb/trang/cung/cung-xyz").status_code == 404


def test_so_kep_chaldea():
    t = trang.lay("so_kep", "so-kep-23")
    assert t["tieu_de"].startswith("Số kép 23 thần số Chaldea") and len(t["tieu_de"]) <= 70
    assert "số gốc 5" in t["muc"][3]["tieu_de"] and t["minh_hoa"]["so_goc"] == 5
    assert trang.lay("so_kep", "so-kep-53") is None and trang.lay("so_kep", "so-kep-9") is None
    assert {x["slug"] for x in t["lien_quan"]} == {"so-kep-22", "so-kep-24"}
