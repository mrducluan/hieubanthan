# -*- coding: utf-8 -*-
"""TV-YBS — bộ khớp điều kiện `luangiai.tuvi_y_bo_sung` (tất định, bảo thủ: điều gì không kiểm được thì không khớp).

Lá số giả dựng tay (cùng dạng `hoidap.tuvi.tom_tat`): chi_so 0 = Dần … 11 = Sửu; Mệnh mặc định ở Sửu (chi_so 11), các
cung đi nghịch như lá thật (chi_so 10 = Huynh Đệ, 9 = Phu Thê …)."""
from __future__ import annotations

import datetime as dt

import pytest

from app.kb import tuvi_y_bo_sung as kyb
from app.luangiai import tuvi_y_bo_sung as yb

CHI = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]
CUNG = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di",
        "Nô Bộc", "Quan Lộc", "Điền Trạch", "Phúc Đức", "Phụ Mẫu"]
CHINH = set(yb.CHINH_TINH)


def _la(sao: dict[str, list] | None = None, hoa: list[tuple[str, str]] | None = None, than: str = "Mệnh",
        menh: int = 11) -> dict:
    """`sao` = {tên cung: [("Tử Vi", "Miếu") | "Tả Phù", …]}; `hoa` = [(hoá, sao)] — cung của hoá = nơi sao đứng."""
    sao = sao or {}
    cung = []
    for i in range(12):
        ten = CUNG[(menh - i) % 12]
        ds = sao.get(ten, [])
        chinh = [{"ten": s[0], "do_sang": s[1]} if isinstance(s, tuple) else {"ten": s, "do_sang": None}
                 for s in ds if (s[0] if isinstance(s, tuple) else s) in CHINH]
        phu = [s for s in ds if not isinstance(s, tuple) and s not in CHINH]
        cung.append({"chi_so": i, "ten": ten, "chi": CHI[i], "la_than": ten == than, "chinh_tinh": chinh,
                     "phu_tinh": phu})
    noi = {(s[0] if isinstance(s, tuple) else s): t for t, ds in sao.items() for s in ds}
    return {"cung": cung, "tu_hoa": [{"hoa": h, "sao": s, "cung": noi[s]} for h, s in (hoa or [])]}


def _i(la: dict, ten: str) -> int:
    return next(c["chi_so"] for c in la["cung"] if c["ten"] == ten)


def _m(ma: str) -> dict:
    m = kyb.lay(ma)
    assert m, ma
    return m


# ------------------------------------------------------------------ điều kiện cơ bản
def test_sao_o_cung():
    la = _la({"Phu Thê": [("Thất Sát", "Miếu")]})
    nc = yb.ngu_canh(la)
    assert yb.khop(_m("yb.hon.that_sat_phu_the_nhanh"), nc)
    assert yb.noi_khop(_m("yb.hon.that_sat_phu_the_nhanh"), nc) == ["Phu Thê"]
    assert not yb.khop(_m("yb.hon.that_sat_phu_the_nhanh"), yb.ngu_canh(_la({"Mệnh": [("Thất Sát", "Miếu")]})))


def test_hoa_tai_cung_va_xung_chieu():
    la = _la({"Phu Thê": [("Thiên Đồng", "Đắc")]}, hoa=[("Kỵ", "Thiên Đồng")])
    nc = yb.ngu_canh(la)
    assert yb.khop(_m("yb.hoa.ky_nghi_khong_thong"), nc)
    assert yb.noi_khop(_m("yb.hoa.ky_nghi_khong_thong"), nc) == ["Phu Thê"]
    assert not yb.khop(_m("yb.cung.tai_bach_ky_lam_cong"), nc)
    # Thất Sát ở Mệnh, Kỵ ở Thiên Di (đối diện) → "Thất Sát bị Kỵ xung"
    la2 = _la({"Mệnh": [("Thất Sát", "Miếu")], "Thiên Di": [("Cự Môn", "Vượng")]}, hoa=[("Kỵ", "Cự Môn")])
    assert yb.khop(_m("yb.cap.that_sat_ky_xung"), yb.ngu_canh(la2))
    la3 = _la({"Mệnh": [("Thất Sát", "Miếu"), ("Cự Môn", "Vượng")]}, hoa=[("Kỵ", "Cự Môn")])
    assert not yb.khop(_m("yb.cap.that_sat_ky_xung"), yb.ngu_canh(la3))     # Kỵ toạ, không xung


def test_do_sang_nam_phai():
    sang = yb.ngu_canh(_la({"Tài Bạch": [("Liêm Trinh", "Miếu"), ("Thất Sát", "Miếu")]}))
    ham = yb.ngu_canh(_la({"Tài Bạch": [("Liêm Trinh", "Hãm"), ("Thất Sát", "Hãm")]}))
    assert yb.khop(_m("yb.cap.liem_sat_sang"), sang) and not yb.khop(_m("yb.cap.liem_sat_sang"), ham)
    assert yb.khop(_m("yb.cap.liem_sat_ham"), ham) and not yb.khop(_m("yb.cap.liem_sat_ham"), sang)
    binh = yb.ngu_canh(_la({"Tài Bạch": [("Liêm Trinh", "Bình"), ("Thất Sát", "Bình")]}))
    assert not yb.khop(_m("yb.cap.liem_sat_sang"), binh) and not yb.khop(_m("yb.cap.liem_sat_ham"), binh)


def test_khong_co_va_sao_khong_theo_doi():
    m = _m("yb.sao.cu_mon_phu_the_thieu_diu")          # Cự Môn ở Phu Thê, vắng Thiên Đồng / Việt / Xương / Khúc
    assert yb.khop(m, yb.ngu_canh(_la({"Phu Thê": [("Cự Môn", "Vượng")]})))
    assert not yb.khop(m, yb.ngu_canh(_la({"Phu Thê": [("Cự Môn", "Vượng"), "Văn Xương"]})))
    # Tam Thai / Bát Toạ không có trong lá số gọn → không biết vắng hay có → không khớp (không đoán)
    tp = _m("yb.sao.thien_phu_khong_tu_giai")
    assert not yb.khop(tp, yb.ngu_canh(_la({"Mệnh": [("Thiên Phủ", "Miếu"), "Kình Dương"]})))


def test_giap_va_hai_cung_doi():
    # Tử Phủ giáp Mệnh: một sao ở mỗi cung kẹp Mệnh
    la = _la({"Huynh Đệ": [("Tử Vi", "Miếu")], "Phụ Mẫu": [("Thiên Phủ", "Miếu")]})
    assert yb.khop(_m("yb.cap.tu_phu_giap_menh"), yb.ngu_canh(la))
    la2 = _la({"Huynh Đệ": [("Tử Vi", "Miếu"), ("Thiên Phủ", "Miếu")]})
    assert not yb.khop(_m("yb.cap.tu_phu_giap_menh"), yb.ngu_canh(la2))


def test_tam_phuong():
    # Mệnh tam phương = Mệnh, Tài Bạch, Quan Lộc; Thái Dương + Thái Âm sáng hội về
    la = _la({"Tài Bạch": [("Thái Dương", "Vượng")], "Quan Lộc": [("Thái Âm", "Miếu")]})
    assert yb.khop(_m("yb.cap.nhat_nguyet_tinh_minh_cong_tam"), yb.ngu_canh(la))
    la2 = _la({"Tài Bạch": [("Thái Dương", "Vượng")], "Phu Thê": [("Thái Âm", "Miếu")]})
    assert not yb.khop(_m("yb.cap.nhat_nguyet_tinh_minh_cong_tam"), yb.ngu_canh(la2))


def test_gioi_tinh_va_than():
    m = _m("yb.sao.that_sat_cung_than")
    assert yb.khop(m, yb.ngu_canh(_la({"Quan Lộc": [("Thất Sát", "Miếu")]}, than="Quan Lộc")))
    assert not yb.khop(m, yb.ngu_canh(_la({"Quan Lộc": [("Thất Sát", "Miếu")]}, than="Mệnh")))
    assert yb.khop(_m("yb.cung.than_quan_loc"), yb.ngu_canh(_la(than="Quan Lộc")))
    nu = _m("yb.sao.tu_vi_don_phuc_duc_nu")
    la = _la({"Phúc Đức": [("Tử Vi", "Bình")]})
    assert yb.khop(nu, yb.ngu_canh(la, gioi_tinh="nu")) and not yb.khop(nu, yb.ngu_canh(la, gioi_tinh="nam"))
    assert not yb.khop(nu, yb.ngu_canh(la))              # chưa biết giới tính → không khớp


def test_hoac_va_can_them():
    m = _m("yb.sao.tu_sat_quan_loc")                     # Tử Sát ở Quan Lộc, HOẶC Quan Lộc có Hoá Quyền
    assert yb.khop(m, yb.ngu_canh(_la({"Quan Lộc": [("Tử Vi", "Vượng"), ("Thất Sát", "Vượng")]})))
    assert yb.khop(m, yb.ngu_canh(_la({"Quan Lộc": [("Vũ Khúc", "Miếu")]}, hoa=[("Quyền", "Vũ Khúc")])))
    assert not yb.khop(m, yb.ngu_canh(_la({"Quan Lộc": [("Vũ Khúc", "Miếu")]})))
    # Mệnh không Lộc, nhưng Phụ Mẫu có Lộc Tồn (ghi chú đã cơ học hoá trong code)
    tl = _m("yb.cung.menh_khong_loc_tu_lap")
    assert yb.khop(tl, yb.ngu_canh(_la({"Phụ Mẫu": ["Lộc Tồn"]})))
    assert not yb.khop(tl, yb.ngu_canh(_la({"Tử Nữ": ["Lộc Tồn"]})))


def test_khong_khop_khi_khong_kiem_duoc():
    nc = yb.ngu_canh(_la({"Mệnh": [("Thái Dương", "Vượng")], "Thiên Di": [("Thái Âm", "Hãm")]}))
    for m in kyb.tat_ca():
        dk = m["dieu_kien"]
        if not dk.get("co_the_tinh") or dk.get("hai_nguoi") or "so_sanh" in dk or "tuoi" in dk:
            assert not yb.khop(m, nc), m["id"]
    for ma in ("yb.pp.doi_cung_tam_phuong", "yb.pp.cung_nam_la_chu_de", "yb.cung.sao_dung_cho",
               "yb.hoa.khoa_nguoi_kinh_doanh"):
        assert not yb.khop(_m(ma), nc), ma               # chỉ cung / ghi chú → lời phương pháp, không khớp lá số


# ------------------------------------------------------------------ lớp hạn
def _vh(la: dict, dai_han: str, luu_nien: str, dh_hoa=None, ln_hoa=None, tieu_han: str | None = None) -> dict:
    return {"dai_han": {"chi_so": _i(la, dai_han), "tu_hoa": dh_hoa},
            "luu_nien": {"chi_so": _i(la, luu_nien), "tu_hoa": ln_hoa},
            "tieu_han": {"chi_so": _i(la, tieu_han or luu_nien)}}


def test_lop_dai_han_luu_nien():
    la = _la({"Quan Lộc": [("Thất Sát", "Miếu")], "Tài Bạch": ["Kình Dương"]})
    m = _m("yb.sao.that_sat_dai_han")
    assert not yb.khop(m, yb.ngu_canh(la))               # không có vận hạn → luật theo lớp không khớp
    assert yb.khop(m, yb.ngu_canh(la, _vh(la, "Quan Lộc", "Mệnh")))
    assert not yb.khop(m, yb.ngu_canh(la, _vh(la, "Mệnh", "Quan Lộc")))
    kd = _m("yb.sk.kinh_da_nam_kham")
    assert yb.khop(kd, yb.ngu_canh(la, _vh(la, "Mệnh", "Tài Bạch")))
    assert not yb.khop(kd, yb.ngu_canh(la, _vh(la, "Tài Bạch", "Mệnh")))


def test_lop_hoa_cua_lop():
    la = _la({"Quan Lộc": [("Vũ Khúc", "Miếu")], "Mệnh": [("Liêm Trinh", "Miếu")]})
    m = _m("yb.hoa.ky_dai_han_chan")                     # Kỵ của đại hạn rơi vào Mệnh / Quan Lộc
    dh = ["Phá Quân", "Cự Môn", "Thái Âm", "Liêm Trinh"]  # Kỵ = Liêm Trinh (ở Mệnh)
    assert yb.khop(m, yb.ngu_canh(la, _vh(la, "Tài Bạch", "Mệnh", dh_hoa=dh)))
    assert not yb.khop(m, yb.ngu_canh(la, _vh(la, "Tài Bạch", "Mệnh", dh_hoa=["Liêm Trinh", "Cự Môn", "Thái Âm",
                                                                                 "Phá Quân"])))


def test_cung_gap_moi_lop():
    m = _m("yb.hon.dai_tieu_han_hong_loan")              # ghi chú "cùng gặp": cả đại hạn và tiểu hạn
    la = _la({"Phu Thê": ["Hồng Loan"], "Quan Lộc": ["Thiên Hỷ"]})
    assert yb.khop(m, yb.ngu_canh(la, _vh(la, "Phu Thê", "Mệnh", tieu_han="Quan Lộc")))
    assert not yb.khop(m, yb.ngu_canh(la, _vh(la, "Phu Thê", "Mệnh", tieu_han="Mệnh")))


# ------------------------------------------------------------------ tìm + lá số thật
def test_tim_loc_va_xep():
    la = _la({"Phu Thê": [("Thất Sát", "Miếu"), "Linh Tinh"]}, hoa=[("Kỵ", "Thất Sát")])
    nc = yb.ngu_canh(la)
    ra = yb.tim(nc, loai="hon_nhan", hien_thi="hop")
    assert [m["id"] for m in ra][:1] == ["yb.hon.that_sat_phu_the_nhanh"]
    assert all(m["loai"] == "hon_nhan" and m["hien_thi"] == "hop" for m in ra)
    assert all(m["cung_khop"] for m in ra)
    assert yb.tim(nc, cung=["Tài Bạch"]) == [] or all("Tài Bạch" in m["cung_khop"] for m in yb.tim(nc, cung=["Tài Bạch"]))
    assert "cung_khop" not in kyb.lay("yb.hon.that_sat_phu_the_nhanh")    # bản sao, không sửa KB


def test_la_so_that_tat_dinh():
    from app.calc import tuvi_an_sao as az
    from app.hoidap import tuvi as tv
    d = dt.date(1990, 5, 12)
    ls = tv.tom_tat(az.an_sao_tho(d, 4, "nu", "vi-VN"))
    vh = az.van_han(d, 4, "nu", dt.date(2026, 11, 4))
    a = [m["id"] for m in yb.tim(yb.ngu_canh(ls, vh, "nu"))]
    b = [m["id"] for m in yb.tim(yb.ngu_canh(ls, vh, "nu"))]
    assert a == b and a
    # lá này: Thiên Đồng hoá Kỵ ở Phu Thê → ý "nghĩ mãi một chuyện" khớp ở Phu Thê
    nc = yb.ngu_canh(ls, vh, "nu")
    assert "Phu Thê" in yb.noi_khop(kyb.lay("yb.hoa.ky_nghi_khong_thong"), nc)


@pytest.mark.parametrize("m", kyb.tat_ca(), ids=[m["id"] for m in kyb.tat_ca()])
def test_moi_muc_chay_khong_loi(m):
    nc = yb.ngu_canh(_la({"Mệnh": [("Tử Vi", "Miếu"), "Kình Dương"], "Phu Thê": [("Thất Sát", "Hãm")]},
                         hoa=[("Kỵ", "Thất Sát")]), None, "nam")
    assert isinstance(yb.khop(m, nc), bool)
