# -*- coding: utf-8 -*-
"""TG-V2 (chủ dự án giao 2026-11-01: "12 tháng tới còn mỏng, chủ yếu thần số") — các lớp của MỖI tháng trong "Thời gian
tới của bạn", chỉ ghép CALC có sẵn (một bộ tính):

- con giáp: chi tháng theo tiết chứa ngày 15 ↔ chi năm sinh âm lịch (`tuoi_dan_gian.quan_he_chi`) — không cần giờ sinh;
- phong thuỷ: sao bay của tháng (`huyen_khong.luu_nguyet_tai`) × bốn hướng cát của mệnh quái (Bát trạch, cần giới tính);
- ngày đẹp: `hoang_lich.chon_ngay("khai_truong")` trong tháng dương, không xung tuổi, bỏ ngày kiêng dân gian;
- tháng nổi bật: ĐẾM lớp cùng thuận / cùng nhắc chậm (không điểm số, không hiển thị con số)."""
import datetime as dt
import json

from app.calc import huyen_khong as HK
from app.calc import phongthuy as P
from app.calc import tuoi_dan_gian as t
from app.luangiai import thoi_gian_lop as L

SINH = dt.date(1990, 5, 15)          # Canh Ngọ (năm âm 1990), nam → mệnh quái Khảm


def test_con_giap_thang_theo_quan_he_chi():
    for chi_t in t.CHI:
        for chi_m in t.CHI:
            o = L.con_giap_thang(chi_t, chi_m)
            q = t.quan_he_chi(chi_t, chi_m) or "binh"
            assert o["quan_he"] == q
            assert chi_m in o["nhan"] and chi_t in o["nhan"]
            assert o["loai"] == {"tam_hop": "thuan", "luc_hop": "thuan", "xung": "luu_y", "hinh": "luu_y",
                                 "hai": "luu_y"}.get(q, "trung")


def test_chi_thang_theo_tiet_chua_ngay_15():
    o = L.lop_thang(11, 2026, SINH, "Khảm")
    assert o["chi_thang"] == HK.luu_nguyet_tai(dt.date(2026, 11, 15))["chi_thang"] == "Hợi"
    assert o["con_giap"]["quan_he"] == (t.quan_he_chi("Ngọ", "Hợi") or "binh")


def test_phong_thuy_goc_hop_la_huong_cat_va_sao_tot():
    for thang in range(1, 13):
        giua = dt.date(2027, thang, 15)
        o = L.phong_thuy_thang(giua, "Khảm")
        cung = HK.luu_nguyet_tai(giua)["cung"]
        bang = P.bang_huong("Khảm")
        if o["goc_hop"]:
            g = o["goc_hop"]
            quai = next(k for k, v in HK.QUAI.items() if v[1] == g["phuong"])
            assert cung[quai] == g["sao"] and g["sao"] in (9, 1, 8)
            assert P.du_nien("Khảm", g["phuong"])["cat"] and bang[g["phuong"]] == g["du_nien"]
        yen = {HK.QUAI[k][1] for k, s in cung.items() if k != "Trung cung" and s in (5, 2)}
        assert set(o["yen"]) == yen
        assert o["loi"] and "Trung cung" not in o["loi"]


def test_phong_thuy_thieu_menh_quai_van_co_goc_yen():
    o = L.phong_thuy_thang(dt.date(2027, 3, 15), None)
    assert o["goc_hop"] is None and o["yen"]
    assert "giới tính" in o["loi"]


def test_ngay_dep_trong_thang_khong_xung_tuoi():
    ds = L.ngay_dep_thang(2026, 12, SINH)
    assert len(ds) <= 3 and ds == sorted(ds, key=lambda x: x["ngay"])
    for x in ds:
        assert x["ngay"].startswith("2026-12-") and x["quan_he_tuoi"] != "xung" and not x["ky_dan_gian"]


def test_lop_thang_du_lop():
    o = L.lop_thang(1, 2027, SINH, "Khảm")
    assert {"chi_thang", "con_giap", "phong_thuy", "ngay_dep"} <= set(o)
    rows = L.hang_lop(o)
    assert [r["ma"] for r in rows] == ["con_giap", "phong_thuy", "ngay_dep"]
    assert all(r["nhan"] and r["loi"] for r in rows)


def test_phong_thuy_nam_2027():
    o = L.phong_thuy_nam(2027, "Khảm")
    cung = HK.luu_nien(2027)["cung"]
    if o["goc_hop"]:
        quai = next(k for k, v in HK.QUAI.items() if v[1] == o["goc_hop"]["phuong"])
        assert cung[quai] in (9, 1, 8)
    assert L.phong_thuy_nam(2027, None) is None


def test_xep_thang_chi_dem_lop_khong_diem_so():
    thang = [
        {"thang": "1/2027", "dau": ["con giáp hợp tuổi", "Tử vi thuận", "Bát tự thuận"], "cham": []},
        {"thang": "2/2027", "dau": ["con giáp hợp tuổi"], "cham": []},
        {"thang": "3/2027", "dau": [], "cham": ["tháng xung tuổi", "Tử vi cần lưu ý"]},
        {"thang": "4/2027", "dau": ["Tử vi thuận", "góc hợp mệnh có sao tốt"], "cham": ["Bát tự cần lưu ý"]},
    ]
    thuan, cham = L.xep_thang(thang)
    assert [x["thang"] for x in thuan] == ["1/2027"]                     # ≥ 2 lớp thuận hơn số lớp nhắc chậm
    assert [x["thang"] for x in cham] == ["3/2027"]
    assert L.xep_thang([])[0] == []


def test_loi_sach():
    s = json.dumps([L.lop_thang(m, 2027, SINH, "Ly") for m in range(1, 13)], ensure_ascii=False).lower()
    for cam in ("đại hung", "tai hoạ", "xui", "giải hạn", "cúng", "vật phẩm", "chết", "bệnh"):
        assert cam not in s, cam


def test_ngay_dep_bo_ngay_da_qua():
    ds = L.ngay_dep_thang(2026, 11, SINH, tu_ngay=dt.date(2026, 11, 20))
    assert all(x["ngay"] >= "2026-11-20" for x in ds)
    assert L.ngay_dep_thang(2026, 11, SINH, tu_ngay=dt.date(2026, 12, 2)) == []


def test_tom_lai_chi_neu_lop_da_tinh():
    assert L.tom_lai({"dau": ["Tử vi thuận"], "cham": []}).startswith("Tóm lại: tháng thuận")
    assert "đi chậm" in L.tom_lai({"dau": [], "cham": ["tháng xung tuổi"]})
    assert "lẫn" in L.tom_lai({"dau": ["a"], "cham": ["b"]})
    assert "đều nhịp" in L.tom_lai({"dau": [], "cham": []})
