# -*- coding: utf-8 -*-
"""TV-YBS RULES — bộ so điều kiện `luangiai/tuvi_y_bo_sung.py` (viết TRƯỚC bộ so, theo quy tắc code).

Lá số dựng tay (`_la`): 12 cung theo thứ tự chuẩn từ Mệnh (Mệnh ở cung Dần, chỉ số 0 = Dần), sao đặt tay, độ sáng chính tinh
theo bảng Nam phái trừ khi ghi rõ. Mỗi loại điều kiện của `_tu_vung_dieu_kien` có ca đúng + ca sai. Mục KB không cơ học
hoá được (ghi chú, so sánh, hai người, nguyên tắc chung, sao engine không giữ) → nằm trong `CHUA_TINH` (khoá: không đoán).
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import tuvi_an_sao as az
from app.calc import tuvi_do_sang_vn as dsvn
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_y_bo_sung as kb
from app.luangiai import tuvi_y_bo_sung as yb

CHI = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]     # chỉ số 0 = Dần
THU_TU = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch",
          "Tử Nữ", "Phu Thê", "Huynh Đệ"]
CHINH = {"Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang",
         "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"}


def _la(sao: dict | None = None, hoa=(), menh: int = 0, than: str = "Mệnh") -> dict:
    """Lá số dạng `tom_tat` dựng tay. `sao` = {cung: ["Tử Vi", ("Thái Dương", "Hãm"), "Kình Dương", …]};
    `hoa` = [(hoá, sao, cung)]; Mệnh ở chỉ số `menh`; đại hạn Mệnh 2–11 rồi lần lượt theo THU_TU."""
    sao = sao or {}
    cung = []
    for k, ten in enumerate(THU_TU):
        i = (menh + k) % 12
        chinh, phu = [], []
        for s in sao.get(ten, []):
            ten_s, ds = (s if isinstance(s, tuple) else (s, None))
            if ten_s in CHINH:
                chinh.append({"ten": ten_s, "do_sang": ds or dsvn.do_sang(ten_s, CHI[i]) or "Bình"})
            else:
                phu.append(ten_s)
        cung.append({"chi_so": i, "ten": ten, "chi": CHI[i], "can": "Giáp", "la_than": ten == than,
                     "chinh_tinh": chinh, "phu_tinh": phu, "dai_han": [2 + 10 * k, 11 + 10 * k]})
    cung.sort(key=lambda c: c["chi_so"])
    return {"cung": cung, "tu_hoa": [{"hoa": h, "sao": s, "cung": c} for h, s, c in hoa], "can_nam": "Giáp",
            "cach_cuc": []}


def _m(**dk) -> dict:
    """Mục KB giả chỉ để thử một loại điều kiện."""
    return {"id": "yb.thu.x", "loai": "sao_cung", "hien_thi": "hop", "dieu_kien": {**dk, "co_the_tinh": True}}


def _nc(ls: dict, gioi_tinh: str | None = "nam", **lop) -> dict:
    nc = yb.ngu_canh_tu_la_so(ls, gioi_tinh=gioi_tinh)
    for k, v in lop.items():
        nc["lop"][k] = v
    return nc


def _lop(cung: str, hoa=(), thu: int | None = None) -> dict:
    return {"cung": cung, "tu_hoa": [{"hoa": h, "sao": s, "cung": c} for h, s, c in hoa], "thu": thu}


# ------------------------------------------------------------------ dựng ngữ cảnh từ lá số thật
def test_ngu_canh_khop_van_han_iztro():
    sinh = (dt.date(1990, 5, 15), 4, "nam")
    xem = dt.date(2026, 10, 21)
    ls = tom_tat(az.an_sao_tho(*sinh, "vi-VN"))
    vh = az.van_han(*sinh, xem)
    nam_xem = 2026
    nc = yb.ngu_canh_tu_la_so(ls, gioi_tinh="nam", nam_am_xem=nam_xem, nam_am_sinh=nam_xem - vh["tuoi_mu"] + 1, vh=vh)
    assert nc["lop"]["dai_han"]["cung"] == vh["dai_han"]["cung_goc"]
    assert nc["lop"]["luu_nien"]["cung"] == vh["luu_nien"]["cung_goc"]
    assert nc["lop"]["tieu_han"]["cung"] == vh["tieu_han"]["cung_goc"]
    # tứ hoá lớp = bốn sao của can lớp (cùng bảng iztro): thứ tự Lộc, Quyền, Khoa, Kỵ
    assert [x["sao"] for x in nc["lop"]["luu_nien"]["tu_hoa"]] == vh["luu_nien"]["tu_hoa"]
    assert [x["sao"] for x in nc["lop"]["dai_han"]["tu_hoa"]] == vh["dai_han"]["tu_hoa"]
    assert nc["than"] == next(c["ten"] for c in ls["cung"] if c["la_than"])
    # năm khác: không có tiểu hạn (chỉ biết cho năm đang xem), lưu niên theo chi năm
    n2 = yb.ngu_canh_nam(nc, 2030)
    assert n2["lop"]["tieu_han"] is None and n2["nam"] == 2030
    assert ls["cung"][[c["chi"] for c in ls["cung"]].index("Tuất")]["ten"] == n2["lop"]["luu_nien"]["cung"]


# ------------------------------------------------------------------ sao
def test_sao_cung_cung():
    ls = _la({"Thiên Di": ["Tử Vi"]})
    assert yb.khop(_m(sao=["Tử Vi"], cung="Thiên Di"), _nc(ls))
    assert not yb.khop(_m(sao=["Tử Vi"], cung="Mệnh"), _nc(ls))
    # nhiều sao phải CÙNG có mặt một cung
    ls2 = _la({"Mệnh": ["Liêm Trinh", "Thất Sát"], "Thiên Di": ["Phá Quân"]})
    assert yb.khop(_m(sao=["Liêm Trinh", "Thất Sát"], cung="Mệnh"), _nc(ls2))
    assert not yb.khop(_m(sao=["Liêm Trinh", "Phá Quân"], cung="Mệnh"), _nc(ls2))


def test_sao_mot_trong_va_cap():
    ls = _la({"Mệnh": ["Hồng Loan"], "Phu Thê": ["Liêm Trinh", "Tham Lang"]})
    assert yb.khop(_m(sao_mot_trong=["Hồng Loan", "Thiên Hỷ"], cung="Mệnh"), _nc(ls))
    assert not yb.khop(_m(sao_mot_trong=["Cô Thần", "Quả Tú"], cung="Mệnh"), _nc(ls))
    cap = [["Liêm Trinh", "Tham Lang"], ["Liêm Trinh", "Phá Quân"]]
    assert yb.khop(_m(sao_cap_mot_trong=cap, cung=["Phu Thê", "Phúc Đức"]), _nc(ls))
    assert not yb.khop(_m(sao_cap_mot_trong=[["Liêm Trinh", "Phá Quân"]], cung="Phu Thê"), _nc(ls))
    # sao + sao_mot_trong: đủ "sao" và ít nhất một của "sao_mot_trong", cùng cung
    ls2 = _la({"Phu Thê": ["Tử Vi", "Hữu Bật"]})
    assert yb.khop(_m(sao=["Tử Vi"], sao_mot_trong=["Tả Phù", "Hữu Bật"], cung="Phu Thê"), _nc(ls2))
    assert not yb.khop(_m(sao=["Tử Vi"], sao_mot_trong=["Văn Xương"], cung="Phu Thê"), _nc(ls2))


def test_cung_bat_ky_va_khong_cung():
    ls = _la({"Nô Bộc": ["Tử Vi", "Kình Dương"]})
    assert yb.khop(_m(sao=["Tử Vi"], cung="bat_ky", gap="sat_tinh"), _nc(ls))
    assert yb.khop(_m(sao=["Tử Vi"], gap="sat_tinh"), _nc(ls))             # không có cung = mọi cung
    assert not yb.khop(_m(sao=["Tử Vi"], gap="cat_tinh"), _nc(ls))


def test_cung_than():
    ls = _la({"Tài Bạch": ["Thất Sát"]}, than="Tài Bạch")
    assert yb.khop(_m(sao=["Thất Sát"], cung_than=True), _nc(ls))
    assert yb.khop(_m(cung_than="Tài Bạch"), _nc(ls))
    assert not yb.khop(_m(cung_than="Thiên Di"), _nc(ls))
    assert not yb.khop(_m(sao=["Thất Sát"], cung_than=True), _nc(_la({"Tài Bạch": ["Thất Sát"]}, than="Quan Lộc")))


def test_vi_tri_xung_tam_phuong_giap():
    # Mệnh chỉ số 0: xung chiếu = Thiên Di; tam hợp = Quan Lộc (+4), Tài Bạch (+8); giáp = Phụ Mẫu (+1), Huynh Đệ (−1)
    ls = _la({"Thiên Di": ["Cự Môn"], "Mệnh": ["Thái Dương"], "Quan Lộc": ["Thái Âm"], "Tài Bạch": ["Văn Xương"],
              "Phụ Mẫu": ["Tử Vi"], "Huynh Đệ": ["Thiên Phủ"]})
    nc = _nc(ls)
    assert yb.khop(_m(sao=["Cự Môn", "Thái Dương"], cung="Mệnh", vi_tri=["toa", "xung_chieu"]), nc)
    assert not yb.khop(_m(sao=["Cự Môn", "Thái Dương"], cung="Mệnh"), nc)           # mặc định chỉ toạ
    assert yb.khop(_m(sao=["Thái Âm"], sao_mot_trong=["Văn Xương"], cung="Mệnh", vi_tri=["toa", "tam_phuong"]), nc)
    assert not yb.khop(_m(sao=["Cự Môn"], cung="Mệnh", vi_tri="tam_phuong"), nc)    # xung chiếu không thuộc tam phương
    assert yb.khop(_m(sao=["Tử Vi", "Thiên Phủ"], cung="Mệnh", vi_tri="giap"), nc)
    ls2 = _la({"Phụ Mẫu": ["Tử Vi", "Thiên Phủ"]})                                 # cùng một bên → không phải "giáp"
    assert not yb.khop(_m(sao=["Tử Vi", "Thiên Phủ"], cung="Mệnh", vi_tri="giap"), _nc(ls2))


def test_do_sang_chinh_va_phu():
    ls = _la({"Mệnh": [("Thái Âm", "Hãm")], "Thiên Di": [("Thái Âm", "Miếu")]})
    assert yb.khop(_m(sao=["Thái Âm"], cung="Mệnh", do_sang="ham"), _nc(ls))
    assert not yb.khop(_m(sao=["Thái Âm"], cung="Mệnh", do_sang="sang"), _nc(ls))
    assert yb.khop(_m(sao=["Thái Âm"], cung="Thiên Di", do_sang="sang"), _nc(ls))
    assert yb.khop(_m(sao=["Thái Âm"], cung="Mệnh", do_sang=["sang", "ham"]), _nc(ls))
    # cả hai đầu = luật nói cả khi sáng lẫn khi hãm → không ràng buộc độ sáng (cả Bình cũng khớp; gộp với bộ hỏi đáp)
    assert yb.khop(_m(sao=["Thái Âm"], cung="Mệnh", do_sang=["sang", "ham"]), _nc(_la({"Mệnh": [("Thái Âm", "Bình")]})))
    assert not yb.khop(_m(sao=["Thái Âm"], cung="Mệnh", do_sang="sang"), _nc(_la({"Mệnh": [("Thái Âm", "Bình")]})))
    # phụ tinh: bảng lối Việt theo chi (Kình Dương đắc ở Thìn Tuất Sửu Mùi, hãm ở Dần) — Mệnh ở Dần
    ls2 = _la({"Mệnh": ["Kình Dương"]})
    assert yb.khop(_m(sao_mot_trong=["Kình Dương", "Đà La"], cung="Mệnh", do_sang="ham"), _nc(ls2))
    ls3 = _la({"Mệnh": ["Kình Dương"]}, menh=2)                                     # Mệnh ở Thìn
    assert not yb.khop(_m(sao_mot_trong=["Kình Dương"], cung="Mệnh", do_sang="ham"), _nc(ls3))
    # chính tinh trong điều kiện quyết định độ sáng (sát tinh đi kèm không xét)
    ls4 = _la({"Thiên Di": [("Thiên Tướng", "Hãm"), "Kình Dương"]})
    assert yb.khop(_m(sao=["Thiên Tướng", "Kình Dương"], cung="Thiên Di", do_sang="ham"), _nc(ls4))


def test_chi():
    ls = _la({"Mệnh": ["Tham Lang"]}, menh=10)                                      # Mệnh ở Tý
    assert yb.khop(_m(sao=["Tham Lang"], cung="Mệnh", chi=["Tý", "Hợi"]), _nc(ls))
    assert not yb.khop(_m(sao=["Tham Lang"], cung="Mệnh", chi=["Ngọ"]), _nc(ls))


# ------------------------------------------------------------------ hoá
def test_hoa_goc():
    ls = _la({"Tài Bạch": ["Vũ Khúc", "Lộc Tồn"], "Thiên Di": ["Thái Âm"]},
             hoa=[("Quyền", "Vũ Khúc", "Tài Bạch"), ("Kỵ", "Thái Âm", "Thiên Di"), ("Khoa", "Văn Xương", "Quan Lộc")])
    nc = _nc(ls)
    assert yb.khop(_m(cung="Tài Bạch", hoa="Quyền", sao_mot_trong=["Hoá Lộc", "Lộc Tồn"]), nc)
    assert not yb.khop(_m(cung="Tài Bạch", hoa="Quyền", khong_co_hoa=["Lộc"], khong_co=["Lộc Tồn"]), nc)
    assert yb.khop(_m(hoa="Kỵ", hoa_tren_sao="Thái Âm"), nc)                        # không cung: ở đâu cũng được
    assert not yb.khop(_m(hoa="Kỵ", hoa_tren_sao="Thái Dương"), nc)
    assert yb.khop(_m(hoa="Kỵ", hoa_tren_sao_mot_trong=["Thái Dương", "Thái Âm"]), nc)
    # Kỵ ở Thiên Di = xung chiếu Mệnh
    assert yb.khop(_m(cung="Mệnh", hoa="Kỵ", vi_tri_hoa="xung_chieu"), nc)
    assert not yb.khop(_m(cung="Mệnh", hoa="Kỵ"), nc)
    # tam phương của Mệnh có Khoa (Quan Lộc), không có Quyền trong tam phương? Quyền ở Tài Bạch (cũng tam phương)
    assert not yb.khop(_m(cung="Mệnh", hoa="Khoa", khong_co_hoa=["Quyền"], vi_tri=["toa", "tam_phuong"]), nc)
    assert yb.khop(_m(cung="Mệnh", hoa_tat_ca=["Khoa", "Quyền"], vi_tri=["toa", "tam_phuong"]), nc)
    assert not yb.khop(_m(cung="Mệnh", hoa_tat_ca=["Khoa", "Lộc"], vi_tri=["toa", "tam_phuong"]), nc)
    assert yb.khop(_m(cung="Mệnh", vi_tri=["toa", "tam_phuong"], khong_co_hoa=["Lộc"]), nc)


def test_hoa_gia_sao_trong_cung():
    ls = _la({"Phụ Mẫu": ["Thái Dương"]}, hoa=[("Lộc", "Thái Dương", "Phụ Mẫu")])
    assert yb.khop(_m(cung="Phụ Mẫu", sao_mot_trong=["Hoá Lộc", "Lộc Tồn"]), _nc(ls))
    assert yb.khop(_m(cung="Mệnh", khong_co=["Hoá Lộc", "Lộc Tồn"]), _nc(ls))
    assert not yb.khop(_m(cung="Phụ Mẫu", khong_co=["Hoá Lộc"]), _nc(ls))


# ------------------------------------------------------------------ vắng, gặp, nhóm, giới
def test_khong_chinh_tinh_khong_cat_gap():
    ls = _la({"Phu Thê": ["Hữu Bật"], "Quan Lộc": ["Địa Kiếp"], "Nô Bộc": ["Thiên Cơ", "Đà La"]})
    nc = _nc(ls)
    assert yb.khop(_m(sao_mot_trong=["Tả Phù", "Hữu Bật"], cung="Phu Thê", khong_chinh_tinh=True), nc)
    assert yb.khop(_m(cung="Quan Lộc", khong_chinh_tinh=True, sao_mot_trong=["Địa Không", "Địa Kiếp"]), nc)
    assert not yb.khop(_m(cung="Nô Bộc", khong_chinh_tinh=True), nc)
    assert yb.khop(_m(cung="Nô Bộc", gap="sat_tinh", khong_co_cat_tinh=True), nc)
    assert not yb.khop(_m(cung="Phu Thê", gap="sat_tinh"), nc)
    assert not yb.khop(_m(cung="Phu Thê", khong_co_cat_tinh=True), nc)
    nc2 = _nc(_la({"Nô Bộc": ["Kình Dương", "Đà La"]}))
    assert yb.khop(_m(cung="Nô Bộc", gap="nhieu_sat_hoac_ky"), nc2)
    assert not yb.khop(_m(cung="Nô Bộc", gap="nhieu_sat_hoac_ky"), nc)


def test_khong_co_than_o():
    ls = _la({"Thiên Di": ["Văn Xương"]}, hoa=[("Khoa", "Văn Xương", "Thiên Di")], than="Quan Lộc")
    m = _m(hoa="Khoa", cung="Thiên Di", khong_co=["cung_than_o_Thiên_Di"])
    assert yb.khop(m, _nc(ls))
    ls2 = _la({"Thiên Di": ["Văn Xương"]}, hoa=[("Khoa", "Văn Xương", "Thiên Di")], than="Thiên Di")
    assert not yb.khop(m, _nc(ls2))


def test_nhom_va_gioi_tinh():
    ls = _la({"Mệnh": ["Thất Sát"]})
    assert yb.khop(_m(nhom="Sát Phá Tham", cung="Mệnh", gioi_tinh="nu"), _nc(ls, "nu"))
    assert not yb.khop(_m(nhom="Sát Phá Tham", cung="Mệnh", gioi_tinh="nu"), _nc(ls, "nam"))
    assert not yb.khop(_m(nhom="Sát Phá Tham", cung="Mệnh", gioi_tinh="nu"), _nc(ls, None))   # không biết giới: không đoán
    assert not yb.khop(_m(nhom="Tử Phủ Vũ Tướng", cung="Mệnh"), _nc(ls))


# ------------------------------------------------------------------ thêm điều kiện
def test_hoac_ke_thua_cung():
    # chính: Tử Vi + Thất Sát ở Quan Lộc; hoặc: Hoá Quyền ở Quan Lộc
    m = _m(cung="Quan Lộc", sao=["Tử Vi", "Thất Sát"], hoac={"hoa": "Quyền", "cung": "Quan Lộc"})
    assert yb.khop(m, _nc(_la({"Quan Lộc": ["Tử Vi", "Thất Sát"]})))
    assert yb.khop(m, _nc(_la({"Quan Lộc": ["Vũ Khúc"]}, hoa=[("Quyền", "Vũ Khúc", "Quan Lộc")])))
    assert not yb.khop(m, _nc(_la({"Quan Lộc": ["Vũ Khúc"]})))
    # "hoặc" không ghi cung → thừa hưởng cung của điều kiện chính (Thái Dương hãm ở Hợi, trong Điền Trạch)
    m2 = _m(cung="Điền Trạch", sao_mot_trong=["Hỏa Tinh"], hoac={"sao": ["Thái Dương"], "do_sang": "ham", "chi": ["Hợi"]})
    ls = _la({"Điền Trạch": [("Thái Dương", "Hãm")]}, menh=6)      # Điền Trạch = chỉ số 9 = Hợi
    assert yb.khop(m2, _nc(ls))
    ls2 = _la({"Mệnh": [("Thái Dương", "Hãm")]}, menh=9)           # Thái Dương hãm ở Hợi nhưng ở Mệnh
    assert not yb.khop(m2, _nc(ls2))


def test_can_them():
    m = _m(sao=["Liêm Trinh"], cung="Mệnh", chi=["Dần", "Thân"],
           can_them={"cung": "Tài Bạch", "hoa_hoac_sao": ["Lộc", "Lộc Tồn"]})
    assert yb.khop(m, _nc(_la({"Mệnh": ["Liêm Trinh"], "Tài Bạch": ["Lộc Tồn"]})))
    assert yb.khop(m, _nc(_la({"Mệnh": ["Liêm Trinh"]}, hoa=[("Lộc", "Vũ Khúc", "Tài Bạch")])))
    assert not yb.khop(m, _nc(_la({"Mệnh": ["Liêm Trinh"]})))


# ------------------------------------------------------------------ lớp thời gian
def test_lop_dai_han_sao_trong_cung_han():
    ls = _la({"Điền Trạch": ["Vũ Khúc"], "Quan Lộc": ["Thất Sát"]})
    m = _m(sao=["Vũ Khúc"], cung="Điền Trạch", lop="dai_han")
    assert yb.khop(m, _nc(ls, dai_han=_lop("Điền Trạch", thu=3)))
    assert not yb.khop(m, _nc(ls, dai_han=_lop("Quan Lộc", thu=4)))
    assert not yb.khop(m, _nc(ls))                                  # không có lớp đại hạn → không xét
    assert yb.khop(_m(sao=["Thất Sát"], lop="dai_han"), _nc(ls, dai_han=_lop("Quan Lộc")))
    assert not yb.khop(_m(sao=["Thất Sát"], lop="dai_han"), _nc(ls, dai_han=_lop("Điền Trạch")))


def test_lop_luu_nien_va_hoa_cua_lop():
    ls = _la({"Thiên Di": ["Hỏa Tinh"], "Phu Thê": ["Tham Lang"], "Mệnh": ["Hồng Loan"]})
    assert yb.khop(_m(sao_mot_trong=["Hỏa Tinh", "Linh Tinh"], lop="luu_nien"), _nc(ls, luu_nien=_lop("Thiên Di")))
    assert not yb.khop(_m(sao_mot_trong=["Hỏa Tinh", "Linh Tinh"], lop="luu_nien"), _nc(ls, luu_nien=_lop("Mệnh")))
    assert yb.khop(_m(cung="Thiên Di", lop=["luu_nien", "tieu_han"]), _nc(ls, tieu_han=_lop("Thiên Di")))
    # hoá của lớp: Kỵ năm trên Văn Xương (ở đâu cũng được)
    nc = _nc(ls, luu_nien=_lop("Mệnh", hoa=[("Kỵ", "Văn Xương", "Tử Nữ")]))
    assert yb.khop(_m(hoa="Kỵ", hoa_tren_sao_mot_trong=["Văn Xương", "Văn Khúc"], lop="luu_nien"), nc)
    assert not yb.khop(_m(hoa="Kỵ", hoa_tren_sao_mot_trong=["Văn Xương"], lop="dai_han"), nc)
    # Tham Lang ở Phu Thê gốc, Kỵ của lớp ở cung đối (Quan Lộc) chiếu sang
    m = _m(sao=["Tham Lang"], cung="Phu Thê", hoa="Kỵ", vi_tri_hoa="xung_chieu", lop=["dai_han", "luu_nien"])
    assert yb.khop(m, _nc(ls, dai_han=_lop("Mệnh", hoa=[("Kỵ", "Thái Dương", "Quan Lộc")])))
    assert not yb.khop(m, _nc(ls, dai_han=_lop("Mệnh", hoa=[("Kỵ", "Thái Dương", "Phu Thê")])))
    # Hồng Loan trong cung của lớp + Kỵ của lớp ở chính cung đó
    m2 = _m(sao_mot_trong=["Hồng Loan", "Thiên Hỷ"], hoa="Kỵ", lop=["dai_han", "luu_nien"])
    assert yb.khop(m2, _nc(ls, luu_nien=_lop("Mệnh", hoa=[("Kỵ", "Cự Môn", "Mệnh")])))
    assert not yb.khop(m2, _nc(ls, luu_nien=_lop("Mệnh", hoa=[("Kỵ", "Cự Môn", "Tài Bạch")])))
    # "Hoá Khoa" giả-sao trong lớp năm = Khoa của năm rơi vào cung năm
    m3 = _m(sao_mot_trong=["Hoá Khoa", "Văn Xương", "Thiên Việt"], lop="luu_nien")
    assert yb.khop(m3, _nc(ls, luu_nien=_lop("Tài Bạch", hoa=[("Khoa", "Thái Âm", "Tài Bạch")])))
    assert not yb.khop(m3, _nc(ls, luu_nien=_lop("Tài Bạch", hoa=[("Khoa", "Thái Âm", "Mệnh")])))


def test_lop_hoa_tat_ca_trong_cung_han():
    ls = _la()
    m = _m(hoa_tat_ca=["Quyền", "Lộc"], lop="dai_han", vi_tri=["toa", "xung_chieu"])
    assert yb.khop(m, _nc(ls, dai_han=_lop("Mệnh", hoa=[("Lộc", "a", "Mệnh"), ("Quyền", "b", "Thiên Di")])))
    assert not yb.khop(m, _nc(ls, dai_han=_lop("Mệnh", hoa=[("Lộc", "a", "Mệnh"), ("Quyền", "b", "Tài Bạch")])))
    m2 = _m(hoa="Kỵ", lop="dai_han", cung=["Mệnh", "Quan Lộc"])
    assert yb.khop(m2, _nc(ls, dai_han=_lop("Tử Nữ", hoa=[("Kỵ", "x", "Quan Lộc")])))
    assert not yb.khop(m2, _nc(ls, dai_han=_lop("Tử Nữ", hoa=[("Kỵ", "x", "Tử Nữ")])))


def test_lop_goc_hoac_lop_khac():
    """`lop` là danh sách = một trong các lớp; "goc" = lá gốc."""
    ls = _la({"Phu Thê": ["Cự Môn", "Thiên Mã"]})
    m = _m(sao=["Cự Môn", "Thiên Mã"], lop=["goc", "luu_nien"])
    assert yb.khop(m, _nc(ls))
    assert yb.chi_tiet(m, _nc(ls)) == [("goc", "Phu Thê")]
    ls2 = _la({"Thiên Di": ["Cự Môn", "Thiên Mã"]})
    assert ("luu_nien", "Thiên Di") in yb.chi_tiet(m, _nc(ls2, luu_nien=_lop("Thiên Di")))


def test_tuoi_dai_han_dau():
    ls = _la({"Mệnh": ["Cự Môn"], "Phụ Mẫu": ["Thái Dương"]})
    m = _m(sao=["Cự Môn"], lop="dai_han", tuoi="dai_han_dau_hoac_hai")
    assert yb.khop(m, _nc(ls, dai_han=_lop("Mệnh", thu=0)))
    assert not yb.khop(m, _nc(ls, dai_han=_lop("Mệnh", thu=2)))
    m2 = _m(cung="Phụ Mẫu", lop="dai_han", tuoi="dai_han_dau")
    assert yb.khop(m2, _nc(ls, dai_han=_lop("Phụ Mẫu", thu=0)))
    assert not yb.khop(m2, _nc(ls, dai_han=_lop("Phụ Mẫu", thu=1)))


# ------------------------------------------------------------------ mục KB thật (luật riêng cho mục có ghi chú rõ)
def test_kb_nhat_nguyet_phan_boi():
    m = kb.lay("yb.cap.nhat_nguyet_phan_boi")
    assert yb.khop(m, _nc(_la({"Mệnh": [("Thái Dương", "Hãm")], "Thiên Di": [("Thái Âm", "Hãm")]})))
    assert not yb.khop(m, _nc(_la({"Mệnh": [("Thái Dương", "Hãm")], "Thiên Di": [("Thái Âm", "Miếu")]})))
    m2 = kb.lay("yb.cap.nhat_nguyet_phan_boi_tu_lap")
    assert yb.khop(m2, _nc(_la({"Mệnh": [("Thái Dương", "Hãm")], "Thiên Di": [("Thái Âm", "Hãm")],
                                 "Huynh Đệ": ["Kình Dương"]})))
    assert not yb.khop(m2, _nc(_la({"Mệnh": [("Thái Dương", "Hãm")], "Thiên Di": [("Thái Âm", "Hãm")]})))


def test_kb_menh_khong_loc_va_no_boc():
    m = kb.lay("yb.cung.menh_khong_loc_tu_lap")
    assert yb.khop(m, _nc(_la({"Phụ Mẫu": ["Lộc Tồn"]})))
    assert not yb.khop(m, _nc(_la({"Phụ Mẫu": ["Lộc Tồn"], "Mệnh": ["Lộc Tồn"]})))
    assert not yb.khop(m, _nc(_la()))
    m2 = kb.lay("yb.cung.no_boc_cat_hop_tac")
    assert yb.khop(m2, _nc(_la({"Nô Bộc": ["Tả Phù", "Thiên Khôi"]})))
    assert yb.khop(m2, _nc(_la(hoa=[("Lộc", "Thiên Cơ", "Nô Bộc")])))
    assert not yb.khop(m2, _nc(_la({"Nô Bộc": ["Tả Phù"]})))
    m3 = kb.lay("yb.cung.huynh_de_cat_minh_lam_chu")
    assert yb.khop(m3, _nc(_la({"Huynh Đệ": ["Văn Xương", "Văn Khúc"]}, hoa=[("Quyền", "Tử Vi", "Mệnh")])))
    assert not yb.khop(m3, _nc(_la({"Huynh Đệ": ["Văn Xương", "Văn Khúc"]})))
    m4 = kb.lay("yb.cung.no_boc_quyen_minh_loc")
    assert yb.khop(m4, _nc(_la({"Tài Bạch": ["Lộc Tồn"]}, hoa=[("Quyền", "Tử Vi", "Nô Bộc")])))
    assert not yb.khop(m4, _nc(_la(hoa=[("Quyền", "Tử Vi", "Nô Bộc")])))
    m5 = kb.lay("yb.cung.phu_mau_toi_tu_lap_som")
    assert yb.khop(m5, _nc(_la({"Phụ Mẫu": ["Địa Kiếp"]})))
    assert yb.khop(m5, _nc(_la({"Phụ Mẫu": [("Thái Dương", "Hãm")]})))
    assert not yb.khop(m5, _nc(_la({"Phụ Mẫu": ["Tử Vi", "Địa Kiếp"]})))


def test_kb_dai_tieu_han_cung_gap():
    m = kb.lay("yb.hon.dai_tieu_han_hong_loan")
    ls = _la({"Mệnh": ["Hồng Loan"], "Phu Thê": ["Thiên Hỷ"]})
    assert yb.khop(m, _nc(ls, dai_han=_lop("Mệnh"), tieu_han=_lop("Phu Thê")))
    assert not yb.khop(m, _nc(ls, dai_han=_lop("Mệnh"), tieu_han=_lop("Tài Bạch")))
    m2 = kb.lay("yb.sk.dai_tieu_han_trung_cung")
    ls2 = _la({"Tật Ách": ["Kình Dương", "Đà La"]})
    assert yb.khop(m2, _nc(ls2, dai_han=_lop("Tật Ách"), tieu_han=_lop("Tật Ách")))
    assert not yb.khop(m2, _nc(ls2, dai_han=_lop("Tật Ách"), tieu_han=_lop("Mệnh")))
    assert not yb.khop(m2, _nc(_la(), dai_han=_lop("Tật Ách"), tieu_han=_lop("Tật Ách")))
    m3 = kb.lay("yb.pp.chuan_bi_truoc_vai_nam")
    ls3 = _la({"Phúc Đức": ["Địa Không", "Địa Kiếp"]})
    nc = _nc(ls3, dai_han=_lop("Phụ Mẫu", thu=1))
    nc["dai_han_ds"] = ["Mệnh", "Phụ Mẫu", "Phúc Đức"] + nc["dai_han_ds"][3:]
    assert yb.khop(m3, nc)
    nc["dai_han_ds"] = ["Mệnh", "Phụ Mẫu", "Điền Trạch"] + nc["dai_han_ds"][3:]
    assert not yb.khop(m3, nc)


# ------------------------------------------------------------------ mục không cơ học hoá được — khoá danh sách, không đoán
CHUA_TINH = {
    # co_the_tinh = false trong KB
    "yb.sao.thai_duong_nu_nguoi_nam", "yb.sao.thien_phu_khong_hop_xong_pha", "yb.pp.vuong_phu_vuong_the",
    "yb.cung.phuc_duc_dao_hoa_ban_doi", "yb.hai.kieu_hop",
    # luật hai lá số (thuộc "Xem lá số 2 người")
    "yb.hai.phu_the_trung_menh_nguoi_kia", "yb.hai.hai_nguoi_sat_pha_tham", "yb.hai.dong_tinh_bu_nhau",
    "yb.hai.dai_han_cung_thuan",
    # nguyên tắc chung, không có điều kiện riêng của lá số (đúng với mọi người)
    "yb.pp.dai_han_chinh_luu_nien_phu", "yb.pp.menh_tot_khong_bang_han_tot", "yb.pp.cung_nam_la_chu_de",
    "yb.cung.phu_the_doc_cung_phuc_duc", "yb.hoa.khoa_nguoi_kinh_doanh",
    # ghi chú chưa cơ học hoá (cần chấm điểm giai đoạn / so sánh / định nghĩa riêng)
    "yb.pp.dau_kho_sau_thuan", "yb.pp.nam_thuan_de_chu_quan", "yb.cung.thien_di_ra_ngoai", "yb.cung.sao_dung_cho",
    "yb.cung.no_boc_tai_minh_quyen", "yb.hoa.khoa_den_muon",
    # sao engine không giữ trong lá số gọn (Tam Thai, Bát Toạ)
    "yb.sao.thien_phu_khong_tu_giai",
}


def test_danh_sach_chua_tinh_duoc():
    pham_vi = kb.theo_loai(*yb.LOAI_BAO_CAO)
    khong = {m["id"] for m in pham_vi if not yb.tinh_duoc(m)[0]}
    assert khong == CHUA_TINH & {m["id"] for m in pham_vi}, sorted(khong ^ (CHUA_TINH & {m["id"] for m in pham_vi}))
    for m in pham_vi:
        ok, ly = yb.tinh_duoc(m)
        assert ok or ly, m["id"]


def test_tim_loc_theo_loai_va_hien_thi():
    ls = _la({"Thiên Di": ["Tử Vi"], "Phu Thê": ["Thiên Cơ"]})
    ra = yb.tim(_nc(ls))
    ma = {x["id"] for x in ra}
    assert {"yb.sao.tu_vi_thien_di", "yb.hon.thien_co_phu_the_doi_y"} <= ma
    assert all(x["cung_khop"] for x in ra)
    assert {x["id"] for x in yb.tim(_nc(ls), loai=("hon_nhan",))} <= {x["id"] for x in ra if x["loai"] == "hon_nhan"}
    assert all(x["hien_thi"] == "goc_nhin_khac" for x in yb.tim(_nc(ls), hien_thi="goc_nhin_khac"))
    assert not any(x["id"] in CHUA_TINH for x in ra)
    # không bao giờ trả mục hien_thi = "khong"
    assert all(x["hien_thi"] != "khong" for x in ra)


@pytest.mark.parametrize("ma", sorted({m["id"] for m in kb.tat_ca()}))
def test_ma_mau_hop_le(ma):
    """Mã kiểm chứng `ds.<chương>.yb.<đuôi mã>` qua ràng buộc SQL 0017 (`^ds\\.[a-z0-9_]+(\\.[a-z0-9_+-]+)+$`, ≤ 60)."""
    import re
    for ch in ("tong_quan", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "suc_khoe", "quan_he", "nha_cua",
               "nam_nay", "van_han", "cuoc_doi"):
        m = yb.ma_mau(ch, ma)
        assert re.fullmatch(r"ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+", m) and len(m) <= 60, m
