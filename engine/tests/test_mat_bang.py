# -*- coding: utf-8 -*-
"""Q2/Q3 — hình học mặt bằng thuần Python + hướng từ hai điểm bản đồ. Golden tính tay."""
import pytest

from app.calc import mat_bang as mb

VUONG = ["111", "111", "111"]
CHU_L = ["1100", "1100", "1111", "1111"]          # khuyết góc trên-phải (phía trước bên phải)


def test_tam_va_khung_bao():
    o = mb.doc_luoi(VUONG)
    assert mb.tam(o) == (1.5, 1.5) and mb.khung_bao(o) == (0, 0, 3, 3)
    o = mb.doc_luoi(CHU_L)
    r, c = mb.tam(o)
    assert (round(r, 3), round(c, 3)) == (2.333, 1.667)           # 12 ô: trọng tâm lệch xuống dưới – sang trái


def test_goc_va_phuong_theo_huong_nha():
    t = (1.5, 1.5)
    assert mb.goc_tu_tam(t, 0.5, 1.5) == 0            # ô phía trước → góc 0
    assert mb.goc_tu_tam(t, 1.5, 2.5) == 90           # bên phải → 90
    assert mb.goc_tu_tam(t, 2.5, 1.5) == 180
    assert mb.goc_tu_tam(t, 1.5, 0.5) == 270
    assert mb.phuong(0, 0) == "Bắc" and mb.phuong(90, 0) == "Đông"
    assert mb.phuong(0, 180) == "Nam" and mb.phuong(90, 180) == "Tây"     # nhà hướng Nam: bên phải là Tây
    assert mb.phuong(45, 180) == "Tây Nam" and mb.phuong(0, None) is None


def test_luoi_9_vuong_khong_khuyet_va_phuong_dung():
    r = mb.phan_tich(VUONG, huong_do=180)
    assert r["khuyet_goc"] == [] and all(abs(o["ti_le"] - 1) < 1e-9 for o in r["o_9"])
    ten = {(o["hang"], o["cot"]): o["phuong"] for o in r["o_9"]}
    assert ten[(1, 1)] == "Trung cung" and ten[(0, 1)] == "Nam" and ten[(2, 1)] == "Bắc"
    assert ten[(1, 2)] == "Tây" and ten[(1, 0)] == "Đông" and ten[(0, 0)] == "Đông Nam" and ten[(2, 2)] == "Tây Bắc"


def test_chu_l_khuyet_goc_truoc_phai():
    r = mb.phan_tich(CHU_L, huong_do=0)           # nhà hướng Bắc: trước-phải = Đông Bắc
    assert r["khuyet_goc"] == ["Đông Bắc"]
    o = {(x["hang"], x["cot"]): x for x in r["o_9"]}
    assert o[(0, 2)]["ti_le"] == 0 and o[(0, 2)]["khuyet"] and not o[(2, 2)]["khuyet"]
    assert r["canh_bao"] == [] and r["tam_ngoai_nha"] is False
    r2 = mb.phan_tich(CHU_L)                       # chưa có hướng → vẫn ra khuyết, không có tên phương
    assert r2["khuyet_goc"] and r2["khuyet_goc"][0].startswith("góc") and any("Chưa có độ hướng" in c for c in r2["canh_bao"])


def test_wc_trung_cung_va_cua_thong_ban_cong():
    luoi = ["11111", "11111", "11111", "11111", "11111"]
    r = mb.phan_tich(luoi, 180, phong={"ve_sinh": (2, 2), "cua_chinh": (0, 2), "bep": (4, 0)}, ban_cong=(4, 2))
    assert r["wc_trung_cung"] is True and r["phuong_phong"]["ve_sinh"]["phuong"] == "Trung cung"
    assert r["phuong_phong"]["cua_chinh"]["phuong"] == "Nam" and r["phuong_phong"]["bep"]["phuong"] == "Đông Bắc"
    assert r["cua_thong_ban_cong"]["thang_hang"] is True and r["cua_thong_ban_cong"]["lech_do"] == 0
    # lệch cột → không thẳng hàng; WC ở góc → không trung cung
    r = mb.phan_tich(luoi, 180, phong={"ve_sinh": (0, 0), "cua_chinh": (0, 2)}, ban_cong=(4, 0))
    assert r["wc_trung_cung"] is False and r["cua_thong_ban_cong"]["thang_hang"] is False
    # có ô trống chắn giữa → không "thông"
    r = mb.phan_tich(["11111", "11111", "11011", "11111", "11111"], 180, phong={"cua_chinh": (0, 2)}, ban_cong=(4, 2))
    assert r["cua_thong_ban_cong"]["thang_hang"] is False


def test_loi_dau_vao():
    with pytest.raises(ValueError):
        mb.doc_luoi(["11", "11"])
    with pytest.raises(ValueError):
        mb.doc_luoi(["111", "11", "111"])
    with pytest.raises(ValueError):
        mb.doc_luoi(["000", "010", "000"])
    with pytest.raises(ValueError):
        mb.phan_tich(VUONG, 0, phong={"bep": (5, 5)})


def test_bearing_bon_huong_chinh_va_cheo():
    assert mb.bearing(10.0, 106.0, 10.001, 106.0) == 0           # đi lên Bắc
    assert mb.bearing(10.0, 106.0, 10.0, 106.001) == 90          # sang Đông
    assert mb.bearing(10.0, 106.0, 9.999, 106.0) == 180
    assert mb.bearing(10.0, 106.0, 10.0, 105.999) == 270
    assert abs(mb.bearing(10.0, 106.0, 10.001, 106.001) - 44.56) < 0.05  # chéo: vĩ độ 10° nên bước kinh độ ngắn hơn → 44,56°
    assert 100 < mb.khoang_cach_m(10.0, 106.0, 10.001, 106.0) < 112      # ≈ 111 m
