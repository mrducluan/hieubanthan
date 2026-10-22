# -*- coding: utf-8 -*-
"""SEO-L2 (chủ dự án duyệt 2026-10-22) — "ngày tốt {việc} tháng M/YYYY": lọc ngày bằng đúng `chon_ngay` (không phép
tính mới), không dữ liệu cá nhân. Chỉ 6 việc người ta hay tìm có trang riêng."""
import datetime as dt
import json

from fastapi.testclient import TestClient

from app.luangiai import hoang_lich as L
from app.main import app

client = TestClient(app)


def test_viec_seo_va_slug():
    assert [v["slug"] for v in L.VIEC_SEO] == ["cuoi-hoi", "khai-truong", "nhap-trach", "dong-tho", "xuat-hanh", "mua-xe"]
    assert L.viec_tu_slug("cuoi-hoi") == "cuoi_hoi" and L.viec_tu_slug("cat-toc") is None


def test_cuoi_hoi_thang_12_2026_khop_chon_ngay():
    kq = L.viec_thang("cuoi_hoi", 2026, 12)
    goc = L.chon_ngay("cuoi_hoi", dt.date(2026, 12, 1), dt.date(2026, 12, 31))
    assert [x["ngay"] for x in kq["ngay"]] == sorted(x["ngay"] for x in goc["ngay"])      # theo thứ tự ngày
    assert kq["tieu_de"] == "Ngày tốt cưới hỏi tháng 12 năm 2026"
    assert kq["so_ngay"] == len(goc["ngay"]) and f"{kq['so_ngay']} ngày" in kq["tra_loi_nhanh"]
    assert kq["dep_nhat"]["ngay"] == goc["ngay"][0]["ngay"]                             # ngày nhiều điểm cộng nhất
    assert kq["thang_am"] and kq["hoi_dap"] and kq["viec"]["slug"] == "cuoi-hoi"
    assert "đại hung" not in json.dumps(kq, ensure_ascii=False).lower()


def test_api_viec_thang():
    r = client.get("/v1/lich/viec-thang/khai_truong/2027/1")
    assert r.status_code == 200 and r.json()["viec"]["ma"] == "khai_truong"
    assert client.get("/v1/lich/viec-thang/cat_toc/2027/1").status_code == 404
    assert client.get("/v1/lich/viec-thang/cuoi_hoi/2027/13").status_code == 422
