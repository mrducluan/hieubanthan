# -*- coding: utf-8 -*-
"""TV-LN — tầng RULES lưu nguyệt: ghép cung tháng theo phái với lá số + vận hạn năm. Viết TRƯỚC hàm.

Ca mẫu (đối chiếu tay): nam 17/05/1990 giờ Ngọ — âm 23/4 Canh Ngọ; Mệnh Hợi, Huynh Đệ Tuất, Phu Thê Dậu
(Thái Âm miếu). Năm xem 2026 Bính Ngọ: Thái Tuế ở Ngọ → Đẩu Quân (tháng Giêng) = Dậu = Phu Thê.
Tháng Giêng 2026 là Canh Dần → tứ hoá tháng Canh: Thái Dương Lộc, Vũ Khúc Quyền, Thái Âm Khoa, Thiên Đồng Kỵ.
"""
import datetime as dt

import pytest

from app.calc import tuvi_luu_nguyet as ln
from app.luangiai import tuvi_luu_nguyet as lnl

SINH = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}


@pytest.fixture(scope="module")
def nam2026():
    return lnl.lap_nam(SINH, 2026)


def test_mac_dinh_dau_quan(nam2026):
    r = nam2026
    assert r["phai"] == "dau_quan_thai_tue" and r["nam_am"] == 2026 and r["can_chi_nam"] == "Bính Ngọ"
    assert r["thang_sinh"] == 4 and r["gio_sinh"] == "Ngọ"
    t = r["thang"]
    assert len(t) == 12
    assert (t[0]["chi"], t[0]["cung_goc"]) == ("Dậu", "Phu Thê")
    assert (t[1]["chi"], t[1]["cung_goc"]) == ("Tuất", "Huynh Đệ")
    assert (t[2]["chi"], t[2]["cung_goc"]) == ("Hợi", "Mệnh")
    assert t[0]["can_chi"] == "Canh Dần" and t[0]["tu"] == dt.date(2026, 2, 17)


def test_sao_va_tu_hoa_thang(nam2026):
    g = nam2026["thang"][0]
    assert {"ten": "Thái Âm", "do_sang": "Miếu"} in [{"ten": s["ten"], "do_sang": s["do_sang"]} for s in g["chinh_tinh"]]
    th = {x["hoa"]: x for x in g["tu_hoa_thang"]}
    assert th["Khoa"]["sao"] == "Thái Âm" and th["Khoa"]["cung_goc"] == "Phu Thê" and th["Khoa"]["vao_cung_thang"]
    assert th["Kỵ"]["sao"] == "Thiên Đồng" and th["Kỵ"]["cung_goc"] == "Quan Lộc"
    assert g["tam_phuong"] == ["Phu Thê", "Quan Lộc", "Thiên Di", "Phúc Đức"] or set(g["tam_phuong"]) == {
        "Phu Thê", "Quan Lộc", "Thiên Di", "Phúc Đức"}
    assert g["chu_de"]


def test_quan_he_voi_han_nam(nam2026):
    r = nam2026
    ln_cung = r["han_nam"]["luu_nien"]["cung_goc"]
    thang_trung = [t for t in r["thang"] if "luu_nien" in t["trung"]]
    assert thang_trung and all(t["cung_goc"] == ln_cung for t in thang_trung)
    for t in r["thang"]:
        assert t["xu_huong"]["ket"] in ("thuận hơn", "nhiều thử thách hơn", "cân bằng")
        assert set(t["trung"]) <= {"dai_han", "luu_nien", "tieu_han"}


def test_so_sanh_cac_phai(nam2026):
    ss = nam2026["so_sanh_phai"]
    assert set(ss) == set(ln.PHAI)
    assert ss["dau_quan_thai_tue"]["thang_gieng"]["cung_goc"] == "Phu Thê"
    assert ss["luu_nien"]["thang_gieng"]["chi"] == "Ngọ"
    assert ss["dia_chi_thang"]["thang_gieng"]["chi"] == "Dần"
    assert ss["tieu_han"]["thang_gieng"]["cung_goc"] == nam2026["han_nam"]["tieu_han"]["cung_goc"]


@pytest.mark.parametrize("phai", list(ln.PHAI))
def test_moi_phai_tinh_dung_cong_thuc(phai):
    r = lnl.lap_nam(SINH, 2026, phai=phai)
    chi_th = ln.CHI.index(r["han_nam"]["tieu_han"]["chi"])
    for t in r["thang"]:
        mong = ln.cung_luu_nguyet(phai, ln.CHI.index("Ngọ"), chi_th, 4, 6, t["thang_tinh"])
        assert ln.CHI[mong] == t["chi"], (phai, t["thang"])


def test_nam_co_thang_nhuan_tach_hai_nua():
    r = lnl.lap_nam(SINH, 2025)
    nhuan = [t for t in r["thang"] if t["nhuan"]]
    assert [t["phan"] for t in nhuan] == ["nua_dau", "nua_sau"]
    assert nhuan[0]["chi"] != nhuan[1]["chi"]
    r2 = lnl.lap_nam({**SINH, "thang_nhuan": "thang_chinh"}, 2025)
    assert len([t for t in r2["thang"] if t["nhuan"]]) == 1


def test_thang_cu_the():
    t = lnl.thang_cua(lnl.lap_nam(SINH, 2026), 3)
    assert t["cung_goc"] == "Mệnh" and t["thang"] == 3


def test_phai_khong_hop_le():
    with pytest.raises(ValueError):
        lnl.lap_nam(SINH, 2026, phai="khong_co")


def test_api_luu_nguyet():
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    la = {"birth_date": "1990-05-17", "birth_time": "12:30", "gender": "nam", "noi_sinh": None, "vung": "north"}
    r = c.post("/v1/tuvi/luu-nguyet", json={"la_so": la, "nam_am": 2026})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["phai"] == "dau_quan_thai_tue" and d["thang"][0]["cung_goc"] == "Phu Thê"
    assert d["thang"][0]["tu"] == "2026-02-17" and set(d["cac_phai"]) == set(ln.PHAI)
    r2 = c.post("/v1/tuvi/luu-nguyet", json={"la_so": {**la, "luu_nguyet": "dia_chi_thang"}, "nam_am": 2026})
    assert r2.json()["thang"][0]["chi"] == "Dần"
    assert c.post("/v1/tuvi/luu-nguyet", json={"la_so": {**la, "luu_nguyet": "xyz"}}).status_code == 422
    an = c.post("/v1/tuvi/an-sao", json={**la, "luu_nguyet": "tieu_han"}).json()
    assert an["phai"]["luu_nguyet"] == "tieu_han"
