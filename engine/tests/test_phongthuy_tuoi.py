# -*- coding: utf-8 -*-
"""SEO-F — trang "tuổi X hợp hướng nào": engine dựng dữ liệu cho 200 trang (năm 1930–2029 × nam/nữ).
Viết TRƯỚC hàm. Mọi con số do CALC tính (mệnh quái, bảng du niên, can chi, nạp âm, ngày Lập xuân/Tết); lời
giải thích lấy từ KB phong thuỷ — web chỉ hiển thị.

Đối chiếu tay: nam 1990 (Canh Ngọ, nạp âm Lộ Bàng Thổ) → mệnh Khảm (Đông tứ mệnh):
Bắc Phục Vị · Nam Diên Niên · Đông Thiên Y · Đông Nam Sinh Khí · Tây Nam Tuyệt Mệnh · Tây Hoạ Hại · Tây Bắc Lục Sát
· Đông Bắc Ngũ Quỷ. Lập xuân 1990: 04/02; Tết Canh Ngọ (lịch Việt) 27/01/1990. Sinh trước mốc → tính năm 1989
(nam 1989 = Khôn). Nữ 1990 = Cấn.
"""
import pytest
from fastapi.testclient import TestClient

from app.luangiai import phongthuy_tuoi as pt_tuoi
from app.main import app


def test_nam_1990():
    r = pt_tuoi.tuoi(1990, "nam")
    assert r["nam"] == 1990 and r["gioi_tinh"] == "nam" and r["slug"] == "tuoi-1990-nam"
    assert r["can_chi"] == "Canh Ngọ" and r["nap_am"]["ten"] == "Lộ Bàng Thổ"
    assert r["menh_quai"]["quai"] == "Khảm" and r["menh_quai"]["nhom"] == "Đông tứ mệnh"
    tot = {h["huong"]: h["du_nien"] for h in r["huong_tot"]}
    assert tot == {"Đông Nam": "Sinh Khí", "Đông": "Thiên Y", "Nam": "Diên Niên", "Bắc": "Phục Vị"}
    assert [h["du_nien"] for h in r["huong_tot"]] == ["Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị"]   # tốt nhất trước
    assert {h["huong"] for h in r["huong_xau"]} == {"Tây Nam", "Tây", "Tây Bắc", "Đông Bắc"}
    for h in r["huong_tot"] + r["huong_xau"]:
        assert h["y_nghia"]                                   # nghĩa du niên từ KB


def test_moc_dau_nam_va_sinh_truoc_moc():
    r = pt_tuoi.tuoi(1990, "nam")
    m = r["moc_dau_nam"]
    assert m["lap_xuan"] == "1990-02-04" and m["tet_viet"] == "1990-01-27"
    assert r["sinh_truoc_moc"]["nam_tinh"] == 1989 and r["sinh_truoc_moc"]["quai"] == "Khôn"
    # 1985: Tết lịch Việt (21/01) và lịch Trung Quốc (20/02) lệch nhau gần một tháng → nêu rõ
    m85 = pt_tuoi.tuoi(1985, "nu")["moc_dau_nam"]
    assert m85["tet_viet"] == "1985-01-21" and m85["tet_trung"] == "1985-02-20" and m85["tet_lech"] is True


def test_nu_1990_va_goi_y_bo_tri():
    r = pt_tuoi.tuoi(1990, "nu")
    assert r["menh_quai"]["quai"] == "Cấn" and r["menh_quai"]["nhom"] == "Tây tứ mệnh"
    g = {x["ma"]: x for x in r["goi_y"]}
    assert set(g) == {"cua_chinh", "mieng_bep", "dau_giuong", "ban_lam_viec"}
    for x in g.values():
        assert x["huong"] and x["tieu_de"] and x["noi_dung"]
        assert set(x["huong"]) <= {h["huong"] for h in r["huong_tot"]}


def test_hoi_dap_va_tieu_de():
    r = pt_tuoi.tuoi(1990, "nam")
    assert r["tieu_de"] == "Tuổi Canh Ngọ 1990 nam hợp hướng nào?"
    assert any("hướng nhà" in h["hoi"] for h in r["hoi_dap"]) and len(r["hoi_dap"]) >= 4
    assert "Đông Nam" in r["tra_loi_nhanh"] and "Khảm" in r["tra_loi_nhanh"]


def test_pham_vi_va_danh_sach():
    ds = pt_tuoi.danh_sach()
    assert len(ds) == 200 and ds[0]["slug"] == "tuoi-1930-nam" and ds[-1]["slug"] == "tuoi-2029-nu"
    assert pt_tuoi.tu_slug("tuoi-1990-nu") == (1990, "nu")
    for sai in ("tuoi-1929-nam", "tuoi-2030-nu", "tuoi-1990-x", "abc"):
        assert pt_tuoi.tu_slug(sai) is None
    with pytest.raises(ValueError):
        pt_tuoi.tuoi(1929, "nam")


def test_api():
    c = TestClient(app)
    r = c.get("/v1/phongthuy/tuoi/tuoi-1990-nam")
    assert r.status_code == 200 and r.json()["menh_quai"]["quai"] == "Khảm"
    assert r.json()["trang_thai"] and r.json()["nguon"]
    assert c.get("/v1/phongthuy/tuoi/tuoi-1800-nam").status_code == 404
    ds = c.get("/v1/phongthuy/tuoi").json()["trang"]
    assert len(ds) == 200 and {"slug", "tieu_de", "nam", "gioi_tinh", "quai"} <= set(ds[0])
