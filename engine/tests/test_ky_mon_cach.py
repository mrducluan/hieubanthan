# -*- coding: utf-8 -*-
"""KM-2 — nhận diện cách cục Kỳ Môn. Golden = các ví dụ «假令…» của Cảnh Hựu Độn Giáp Phù Ứng Kinh (toản) và Yên Ba Điếu
Tẩu Ca chú giải (kho nguồn `ky_mon_co_kim_do_thu.json`, quyển 704–705) — mỗi ca ghi tên thiên."""
import pytest

from app.calc import ky_mon as km
from app.calc import ky_mon_cach as cach


def _gio(can: str, chi: str) -> int:
    return next(i for i in range(60) if km.CAN[i % 10] == can and km.CHI[i % 12] == chi)


def _ma(cuc, duong, can, chi, can_ngay=None):
    b = km.ban_gio(cuc, duong, _gio(can, chi))
    return {(c["ma"], c.get("cung")) for c in cach.nhan_dien(b, can_ngay=can_ngay)}


# (tên thiên của sách, cục, dương độn, can giờ, chi giờ, mã cách, cung)
VI_DU_SACH = [
    ("釋天遁甲", 4, True, "Ất", "Dậu", "thien_don", 1),
    ("釋天遁甲", 6, False, "Canh", "Thân", "thien_don", 9),
    ("釋地遁甲", 1, True, "Tân", "Mão", "dia_don", 2),
    ("釋地遁甲", 9, False, "Bính", "Dần", "dia_don", 8),
    ("陰遁直符活局圖 (人遁)", 7, True, "Bính", "Tý", "nhan_don", 6),
    ("釋青龍反首", 1, True, "Bính", "Dần", "thanh_long_phan_thu", 8),
    ("釋飛烏跌穴", 9, True, "Tân", "Mùi", "phi_dieu_diet_huyet", 9),
    ("釋青龍逃走", 2, False, "Kỷ", "Hợi", "thanh_long_dao_tau", 8),
    ("釋白虎猖狂", 2, False, "Nhâm", "Thân", "bach_ho_xuong_cuong", 3),
    ("釋朱雀投江", 3, False, "Nhâm", "Thân", "chu_tuoc_dau_giang", 7),
    ("釋螣蛇夭矯", 4, True, "Mậu", "Tý", "dang_xa_yeu_kieu", 1),
    ("釋太白入熒惑", 4, True, "Nhâm", "Thân", "bach_nhap_huynh", 2),
    # sách: «丁壬之日昳時» = giờ Mùi của ngày Đinh / Nhâm = Đinh Mùi (bản gõ ghi «乙巳», không phải giờ Mùi — chữ chép lệch)
    ("釋三奇入墓", 1, True, "Đinh", "Mùi", "ky_nhap_mo", 2),
    ("釋三奇入墓", 3, False, "Đinh", "Sửu", "ky_nhap_mo", 2),
    ("釋三奇入墓", 4, False, "Canh", "Dần", "ky_nhap_mo", 6),
    ("釋三奇入墓", 1, True, "Tân", "Mão", "ky_nhap_mo", 6),
    ("釋伏吟", 1, True, "Giáp", "Tý", "phuc_ngam", None),
    ("釋反吟", 1, True, "Ất", "Sửu", "phan_ngam", None),
    ("釋反吟", 1, True, "Nhâm", "Thân", "cua_phan_ngam", None),
]


@pytest.mark.parametrize("thien,cuc,duong,can,chi,ma,cung", VI_DU_SACH)
def test_vi_du_cua_sach(thien, cuc, duong, can, chi, ma, cung):
    assert (ma, cung) in _ma(cuc, duong, can, chi), thien


def test_ngu_bat_ngo_thoi_dung_muoi_cap_cua_sach():
    """«甲日庚午時乙日辛巳時丙日壬辰時丁日癸卯時戊日甲寅時己日乙丑時庚日丙子時辛日丁酉時壬日戊申時癸日…»."""
    cap = [("Giáp", "Canh", "Ngọ"), ("Ất", "Tân", "Tỵ"), ("Bính", "Nhâm", "Thìn"), ("Đinh", "Quý", "Mão"), ("Mậu", "Giáp", "Dần"),
           ("Kỷ", "Ất", "Sửu"), ("Canh", "Bính", "Tý"), ("Tân", "Đinh", "Dậu"), ("Nhâm", "Mậu", "Thân")]
    for ngay, can, chi in cap:
        assert ("ngu_bat_ngo", None) in _ma(1, True, can, chi, can_ngay=ngay), ngay
    assert ("ngu_bat_ngo", None) not in _ma(1, True, "Canh", "Ngọ", can_ngay="Ất")
    assert ("ngu_bat_ngo", None) not in _ma(1, True, "Canh", "Ngọ")          # không biết can ngày thì không xét


def test_mon_bach_dung_bang_cua_sach():
    """«釋門迫»: Khai ở 3, 4 · Hưu ở 9 · Sinh ở 1 · Cảnh ở 6, 7 · Thương ở 8, 2 · Tử ở 1 · Kinh ở 3 (và 4 — cùng hành Mộc)."""
    assert cach.MON_BACH == {6: (3, 4), 1: (9,), 8: (1,), 9: (6, 7), 3: (2, 8), 4: (2, 8), 2: (1,), 7: (3, 4)}
    thay = set()
    for cuc in range(1, 10):
        for duong in (True, False):
            for g in range(60):
                b = km.ban_gio(cuc, duong, g)
                for c in cach.nhan_dien(b):
                    if c["ma"] == "mon_bach":
                        assert c["cung"] in cach.MON_BACH[b["cung"][c["cung"]]["cua_so"]]
                        thay.add(b["cung"][c["cung"]]["cua_so"])
    assert thay == set(cach.MON_BACH)


def test_luc_nghi_kich_hinh_theo_cung_vuong_chuong():
    """«甲子直符臨三宮甲戌直符臨二宮甲申直符臨八宮甲午直符臨九宮甲辰直符臨四宮甲寅直符臨四宮»."""
    assert cach.KICH_HINH == {0: 3, 1: 2, 2: 8, 3: 9, 4: 4, 5: 4}
    dem = 0
    for cuc in range(1, 10):
        for g in range(60):
            b = km.ban_gio(cuc, True, g)
            co = any(c["ma"] == "luc_nghi_kich_hinh" for c in cach.nhan_dien(b))
            assert co == (b["truc_phu"]["cung"] == cach.KICH_HINH[g // 10])
            dem += co
    assert dem > 20


def test_ky_mon_hoi_hop_va_ngoc_nu():
    for cuc in range(1, 10):
        for duong in (True, False):
            for g in range(0, 60, 7):
                b = km.ban_gio(cuc, duong, g)
                for c in cach.nhan_dien(b):
                    o = b["cung"].get(c.get("cung") or 0)
                    if c["ma"] == "ky_mon_hoi_hop":
                        assert o["cua_so"] in (1, 6, 8) and c["ky"] in ("Ất", "Bính", "Đinh")
                        assert c["ky"] in (o["thien_ban"], o.get("thien_ban_ky"))
                    if c["ma"] == "ngoc_nu_thu_mon":
                        assert o["dia_ban"] == "Đinh" and c["cung"] == b["truc_su"]["cung"]


def test_tat_dinh_va_khuon():
    b = km.ban_gio(5, False, 37)
    a, a2 = cach.nhan_dien(b, can_ngay="Giáp"), cach.nhan_dien(b, can_ngay="Giáp")
    assert a == a2
    for c in a:
        assert c["ma"] in cach.CACH and c["loai"] in ("cat", "hung") and c["pham_vi"] in ("cung", "gio")
        assert (c["pham_vi"] == "cung") == (c.get("cung") in range(1, 10))
    assert {m["loai"] for m in cach.CACH.values()} == {"cat", "hung"}
