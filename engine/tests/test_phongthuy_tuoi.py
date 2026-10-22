# -*- coding: utf-8 -*-
"""SEO-F — trang "tuổi X hợp hướng nào": engine dựng dữ liệu cho 92 trang (năm 1960–2005 × nam/nữ).
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
    assert len(ds) == 92 and ds[0]["slug"] == "tuoi-1960-nam" and ds[-1]["slug"] == "tuoi-2005-nu"
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
    # Chủ dự án chốt 1960–2005 (người tìm hướng nhà/xây nhà; bỏ hai đầu ít người tìm)
    assert c.get("/v1/phongthuy/tuoi/tuoi-1959-nam").status_code == 404
    assert c.get("/v1/phongthuy/tuoi/tuoi-2006-nu").status_code == 404
    ds = c.get("/v1/phongthuy/tuoi").json()["trang"]
    assert len(ds) == 92 and {"slug", "tieu_de", "nam", "gioi_tinh", "quai"} <= set(ds[0])


def test_tro_toi_trang_menh_gi():
    # SEO-J: mọi trang tuổi (1960–2005) trỏ sang trang "sinh năm X mệnh gì" có thật
    from app.kb import trang
    t = pt_tuoi.tuoi(1990, "nam")
    assert t["trang_menh"] == "/bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi"
    assert trang.lay("menh_nam", t["trang_menh"].rsplit("/", 1)[1]) is not None


# ---- SEO-K (chủ dự án duyệt 2026-10-21): gộp nam + nữ cùng năm vào MỘT trang (92 → 46, 308 từ bản -nam/-nu) ----
def test_gop_nam_nu_1990():
    r = pt_tuoi.tuoi_gop(1990)
    assert r["slug"] == "tuoi-1990" and r["nam"] == 1990 and r["can_chi"] == "Canh Ngọ"
    assert [g["gioi_tinh"] for g in r["gioi"]] == ["nam", "nu"]
    assert r["gioi"][0]["menh_quai"]["quai"] == "Khảm" and r["gioi"][1]["menh_quai"]["quai"] == "Cấn"
    assert r["tieu_de"] == "Tuổi Canh Ngọ 1990 hợp hướng nào? Nam mệnh Khảm, nữ mệnh Cấn"
    assert len(r["tieu_de"]) <= 70 and len(r["mo_ta"]) <= 160
    assert "Khảm" in r["tra_loi_nhanh"] and "Cấn" in r["tra_loi_nhanh"]
    assert r["huong_chung"] == []                        # Đông tứ (Khảm) vs Tây tứ (Cấn): không chung hướng tốt
    hoi = [h["hoi"] for h in r["hoi_dap"]]
    assert len(hoi) == len(set(hoi)) >= 6
    assert r["sinh_truoc_moc"]["slug"] == "tuoi-1989"


def test_gop_cung_nhom_co_huong_chung():
    r = pt_tuoi.tuoi_gop(1993)          # nam 1993 Khôn, nữ 1993 Khảm? — chỉ kiểm tính nhất quán
    tot = [set(h["huong"] for h in g["huong_tot"]) for g in r["gioi"]]
    assert set(r["huong_chung"]) == tot[0] & tot[1]


def test_gop_danh_sach_46_va_slug():
    ds = pt_tuoi.danh_sach_gop()
    assert len(ds) == 46 and ds[0]["slug"] == "tuoi-1960" and ds[-1]["slug"] == "tuoi-2005"
    assert ds[30]["quai_nam"] and ds[30]["quai_nu"]
    assert pt_tuoi.tu_slug_gop("tuoi-1990") == 1990
    assert pt_tuoi.tu_slug_gop("tuoi-1990-nam") == 1990        # slug cũ vẫn tra được (web 308 về bản gộp)
    assert pt_tuoi.tu_slug_gop("tuoi-1959") is None


def test_api_gop():
    c = TestClient(app)
    assert len(c.get("/v1/phongthuy/tuoi-gop").json()["trang"]) == 46
    r = c.get("/v1/phongthuy/tuoi-gop/tuoi-1990").json()
    assert r["slug"] == "tuoi-1990" and len(r["gioi"]) == 2
    assert c.get("/v1/phongthuy/tuoi-gop/tuoi-2050").status_code == 404
