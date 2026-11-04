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


def test_dep_nhat_khong_vuong_kieng_dan_gian():
    # 08/2027 xuất hành: ngày xếp đầu (04/08) là Tam nương → "Đẹp nhất" phải là ngày khác không vướng kiêng.
    from app.luangiai.hoang_lich import viec_thang
    for nam, th in ((2027, 8), (2026, 12), (2027, 1)):
        for v in ("xuat_hanh", "cuoi_hoi", "khai_truong"):
            d = viec_thang(v, nam, th)["dep_nhat"]
            assert d is None or not d.get("ky_dan_gian"), (v, nam, th, d)


def test_dem_viec_thang_khop_tung_trang():
    """AUD-Q3 (chủ dự án 2026-11-03): sitemap + robots trang "ngày tốt {việc} tháng" dùng số ngày tốt do engine đếm —
    MỘT nguồn: đúng `viec_thang(...)["so_ngay"]` của từng trang; tháng 12 nối sang tháng 1 năm sau."""
    ds = L.dem_viec_thang(2026, 11, 3)
    assert [(x["nam"], x["thang"]) for x in ds[:: len(L.VIEC_SEO)]] == [(2026, 11), (2026, 12), (2027, 1)]
    assert len(ds) == 3 * len(L.VIEC_SEO)
    for x in ds:
        assert x["so_ngay"] == L.viec_thang(x["ma"], x["nam"], x["thang"])["so_ngay"]
        assert x["slug"] == next(v["slug"] for v in L.VIEC_SEO if v["ma"] == x["ma"])


def test_api_dem_viec_thang():
    r = client.get("/v1/lich/viec-thang-dem/2026/11?so=2")
    assert r.status_code == 200 and len(r.json()["thang"]) == 2 * len(L.VIEC_SEO)
    assert client.get("/v1/lich/viec-thang-dem/2026/11?so=40").status_code == 422
    assert client.get("/v1/lich/viec-thang-dem/2026/13").status_code == 422
    assert client.get("/v1/lich/viec-thang-dem/2099/11?so=2").status_code == 200       # tới đúng 12/2099
    assert client.get("/v1/lich/viec-thang-dem/2099/11?so=3").status_code == 422       # vượt lịch → 422, không 500
    rong = L.viec_thang("mua_xe", 2027, 1)
    assert rong["so_ngay"] == 0 and "0 ngày" not in rong["tra_loi_nhanh"] and "chưa có ngày nào" in rong["tra_loi_nhanh"]
