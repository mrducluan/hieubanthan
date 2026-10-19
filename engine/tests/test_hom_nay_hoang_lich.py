# -*- coding: utf-8 -*-
"""HL-2 — Thẻ Hôm nay có hoàng lịch (trực, hoàng/hắc đạo, giờ hoàng đạo, xung/hợp tuổi) + quẻ Mai Hoa đầu ngày.
Viết TRƯỚC hàm."""
import datetime as dt

from app.calc import kinhdich_maihoa as mh, lunar
from app.luangiai import hom_nay

SINH = (17, 5, 1990)


def test_hoang_lich_tren_the():
    kq = hom_nay.the_hom_nay(*SINH, dt.date(2026, 10, 13))
    h = kq["hoang_lich"]
    assert h["truc"] == "Khai" and h["than"] == "Kim Quỹ" and h["hoang_dao"] is True
    assert [g["chi"] for g in h["gio_hoang_dao"]] == ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"]
    assert h["tuoi"]["can_chi"] == "Canh Ngọ" and h["xung_tuoi"] == "Giáp Dần"
    assert 1 <= len(h["nghi"]) <= 6 and len(h["ky"]) <= 4
    assert h["ngay_tot_gan"]["ngay"] > "2026-10-13"


def test_y_dinh_gan_viec_hoang_lich():
    kq = hom_nay.the_hom_nay(*SINH, dt.date(2026, 10, 13), ["bat_dau", "di_chuyen", "tinh_cam"])
    v = {x["ma_viec"]: x for x in kq["hoang_lich"]["viec"]}
    assert set(v) == {"khai_truong", "xuat_hanh"}
    assert v["khai_truong"]["danh_gia"] == "tot"


def test_que_dau_ngay_tat_dinh():
    d = dt.date(2026, 10, 13)
    a = hom_nay.the_hom_nay(*SINH, d)["que_ngay"]
    b = hom_nay.the_hom_nay(1, 1, 2000, d)["que_ngay"]
    assert a == b                                    # quẻ của NGÀY, giống nhau với mọi người
    ad, am, ay, _ = lunar.solar_to_lunar(13, 10, 2026, 7.0)
    m = mh.khoi_que_thoi_gian(lunar.can_chi_nam(ay)[1], am, ad, "Tý")
    assert a["hao_dong"] == m["hao_dong"] and a["ten"] and a["cau_tu_soi"] and a["so"] >= 1
    # QH-URL: link quẻ trỏ vào silo Kinh Dịch (/kinh-dich/que/…), trang KB có thật
    assert a["duong"].startswith(f"/kinh-dich/que/que-{a['so']}-")


def test_nhip_bat_tu_luu_nhat():
    """Lưu nhật Bát tự: thập thần của can ngày xem so với nhật chủ (can ngày sinh) — không cần giờ sinh."""
    from app.calc import battu
    d = dt.date(2026, 10, 13)                        # Canh Thân
    kq = hom_nay.the_hom_nay(*SINH, d)["nhip_bat_tu"]
    nhat_chu = lunar.can_chi_ngay(dt.date(1990, 5, 17))[0]
    assert kq["nhat_chu"] == nhat_chu and kq["can_chi_ngay"] == "Canh Thân"
    assert kq["thap_than"] == battu.thap_than(nhat_chu, "Canh")
    assert kq["y_nghia"] and kq["cau_tu_soi"] and kq["nhom"]
