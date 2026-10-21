# -*- coding: utf-8 -*-
"""TV-LN — lưu nguyệt (tháng hạn) Tử vi theo phái người dùng chọn. Viết TRƯỚC hàm.

Các phái (docs/LUU-NGUYET-TUVI.md):
- dau_quan_thai_tue (mặc định): Đẩu Quân từ cung lưu Thái Tuế — đếm nghịch tới tháng sinh, thuận tới giờ sinh
  = tháng Giêng, rồi thuận mỗi tháng một cung (Đẩu số toàn thư; iztro 流月).
- dau_quan_tieu_han: như trên nhưng khởi từ cung Tiểu hạn năm xem.
- tieu_han: tháng Giêng tại cung Tiểu hạn, thuận.
- luu_nien: tháng Giêng tại cung lưu niên (Thái Tuế năm xem), thuận (流年命宮順數月).
- dia_chi_thang: cung có địa chi của tháng (tháng Giêng tại Dần) (流月地支).
Chi: 0 = Tý … 11 = Hợi. Thuận = chiều kim đồng hồ trên lá số = chi tăng.
"""
import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import lunar, tuvi_luu_nguyet as ln

GOLDEN = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "luu_nguyet_iztro.json")
                    .read_text(encoding="utf-8"))
TY, SUU, DAN, MAO, THIN, TY_, NGO, MUI, THAN, DAU, TUAT, HOI = range(12)


def test_dau_quan_thai_tue_vi_du_tay():
    # Năm xem Bính Ngọ (Thái Tuế ở Ngọ), sinh tháng 4, giờ Ngọ:
    # Ngọ = tháng Giêng → nghịch tới tháng 4: Mão; Mão = giờ Tý → thuận tới giờ Ngọ: Dậu.
    assert ln.cung_thang_gieng("dau_quan_thai_tue", chi_nam_xem=NGO, chi_tieu_han=DAN, thang_sinh=4, chi_gio=NGO) == DAU
    assert ln.cung_luu_nguyet("dau_quan_thai_tue", NGO, DAN, 4, NGO, thang=1) == DAU
    assert ln.cung_luu_nguyet("dau_quan_thai_tue", NGO, DAN, 4, NGO, thang=2) == TUAT
    assert ln.cung_luu_nguyet("dau_quan_thai_tue", NGO, DAN, 4, NGO, thang=12) == THAN


def test_cac_phai_khac():
    a = dict(chi_nam_xem=NGO, chi_tieu_han=THIN, thang_sinh=4, chi_gio=NGO)
    # Đẩu Quân từ Tiểu hạn (Thìn): nghịch 3 → Sửu; thuận 6 → Mùi.
    assert ln.cung_thang_gieng("dau_quan_tieu_han", **a) == MUI
    assert ln.cung_thang_gieng("tieu_han", **a) == THIN
    assert ln.cung_thang_gieng("luu_nien", **a) == NGO
    assert ln.cung_thang_gieng("dia_chi_thang", **a) == DAN
    assert ln.cung_luu_nguyet("dia_chi_thang", NGO, THIN, 4, NGO, thang=11) == TY
    assert ln.cung_luu_nguyet("tieu_han", NGO, THIN, 4, NGO, thang=3) == NGO


def test_phai_la():
    with pytest.raises(ValueError):
        ln.cung_thang_gieng("khong_co", NGO, THIN, 4, NGO)


@pytest.mark.parametrize("thang,ngay,nhuan,tn,kq", [
    (4, 23, False, "thang_sau", 4),
    (2, 10, True, "thang_sau", 2),     # nửa đầu tháng nhuận: như tháng chính
    (2, 21, True, "thang_sau", 3),     # nửa sau: tính sang tháng sau (iztro / mặc định của dự án)
    (2, 21, True, "thang_chinh", 2),
    (12, 20, True, "thang_sau", 13),   # cộng dồn vòng 12 cung vẫn đúng (13 ≡ tháng Giêng)
])
def test_thang_tinh_thang_nhuan(thang, ngay, nhuan, tn, kq):
    assert ln.thang_tinh(thang, ngay, nhuan, tn) == kq


def test_khop_iztro_320_ca():
    """Oracle: iztro 2.6.0 (MIT) tính lưu nguyệt theo Đẩu Quân từ lưu Thái Tuế. So CÔNG THỨC trên chính âm lịch
    iztro dùng (40 lá × 17 ngày xem, gồm sinh/xem trong tháng nhuận, Tý muộn)."""
    sai = []
    for c in GOLDEN["cases"]:
        chi_nam = (c["xem_am"]["nam"] - 4) % 12
        assert (c["luu_nien"] + 2) % 12 == chi_nam, c["id"]          # lưu niên = cung chi năm xem
        s, x = c["sinh_am"], c["xem_am"]
        kq = ln.cung_luu_nguyet("dau_quan_thai_tue", chi_nam, (c["tieu_han"] + 2) % 12,
                                ln.thang_tinh(s["thang"], s["ngay"], s["nhuan"]), c["ti"] % 12,
                                thang=ln.thang_tinh(x["thang"], x["ngay"], x["nhuan"]))
        if kq != (c["luu_nguyet"] + 2) % 12:
            sai.append(c["id"] + "@" + c["ngay_xem"])
    assert not sai, sai


TEN_CN = {"廉贞": "Liêm Trinh", "破军": "Phá Quân", "武曲": "Vũ Khúc", "太阳": "Thái Dương", "天机": "Thiên Cơ",
          "天梁": "Thiên Lương", "紫微": "Tử Vi", "太阴": "Thái Âm", "天同": "Thiên Đồng", "文昌": "Văn Xương",
          "巨门": "Cự Môn", "贪狼": "Tham Lang", "右弼": "Hữu Bật", "文曲": "Văn Khúc", "左辅": "Tả Phù"}
CAN_CN = dict(zip("甲乙丙丁戊己庚辛壬癸", ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]))


def test_tu_hoa_thang_khop_iztro():
    da = set()
    for c in GOLDEN["cases"]:
        can = CAN_CN[c["can_chi_thang"][0]]
        assert ln.tu_hoa(can) == [TEN_CN[t] for t in c["tu_hoa_thang"]], can
        da.add(can)
    assert len(da) == 10


def test_lich_thang_nam_co_nhuan():
    # 2025 (Ất Tỵ) nhuận tháng 6 theo lịch Việt Nam.
    ds = ln.cac_thang(2025, tz=7.0, thang_nhuan="thang_sau")
    nhan = [(m["thang"], m["nhuan"], m["phan"]) for m in ds]
    assert nhan[:6] == [(i, False, "ca_thang") for i in range(1, 7)]
    assert (6, True, "nua_dau") in nhan and (6, True, "nua_sau") in nhan and len(ds) == 14
    nua_sau = next(m for m in ds if m["nhuan"] and m["phan"] == "nua_sau")
    assert nua_sau["thang_tinh"] == 7 and nua_sau["tu"].day >= 1
    # QC 2026-10-21: nửa sau đếm cung như tháng 7 thì can chi (→ tứ hoá tháng) cũng là của tháng 7 (Giáp Thân).
    assert nua_sau["can_chi"] == "Giáp Thân" and nua_sau["can"] == "Giáp"
    nua_dau = next(m for m in ds if m["nhuan"] and m["phan"] == "nua_dau")
    assert nua_dau["can_chi"] == "Quý Mùi"
    assert lunar.can_chi_thang(13, 2025) == lunar.can_chi_thang(1, 2026)        # nửa sau nhuận tháng Chạp
    assert next(m for m in ln.cac_thang(2025, tz=7.0, thang_nhuan="thang_chinh") if m["nhuan"])["can_chi"] == "Quý Mùi"
    gieng = ds[0]
    assert gieng["tu"] == dt.date(2025, 1, 29) and gieng["can_chi"] == "Mậu Dần"
    assert len(ln.cac_thang(2025, tz=7.0, thang_nhuan="thang_chinh")) == 13
    assert len(ln.cac_thang(2026, tz=7.0)) == 12


CHI_CN = dict(zip("子丑寅卯辰巳午未申酉戌亥", lunar.CHI))


def test_can_chi_thang_xem_khop_iztro_ke_ca_nua_sau_thang_nhuan():
    """QC 2026-10-21 (lỗi đã sửa): iztro tính nửa sau tháng nhuận (ngày 16+) như THÁNG SAU cả cung lẫn can chi
    tháng (vd 27/6 nhuận Ất Tỵ → Giáp Thân, không phải Quý Mùi). Python trước đây đếm cung như tháng sau nhưng giữ
    can chi tháng nhuận → tứ hoá tháng lệch 80/80 ca. Đối chiếu MỌI ca xem của golden (lịch iztro = UTC+8)."""
    dem = {"ca_thang": 0, "nua_dau": 0, "nua_sau": 0}
    for c in GOLDEN["cases"]:
        x = c["xem_am"]
        t = next(m for m in ln.cac_thang(x["nam"], tz=8.0) if m["thang"] == x["thang"] and m["nhuan"] == x["nhuan"]
                 and m["ngay_am"][0] <= x["ngay"] <= m["ngay_am"][1])
        iz = f"{CAN_CN[c['can_chi_thang'][0]]} {CHI_CN[c['can_chi_thang'][1]]}"
        assert t["can_chi"] == iz and t["can"] == iz.split()[0], (c["id"], c["ngay_xem"], t["can_chi"], iz)
        assert ln.tu_hoa(t["can"]) == [TEN_CN[s] for s in c["tu_hoa_thang"]]
        dem[t["phan"]] += 1
    assert dem["nua_sau"] >= 40 and dem["nua_dau"] >= 40 and dem["ca_thang"] >= 400


def test_dong_thang_lien_mach():
    ds = ln.cac_thang(2025, tz=7.0)
    for a, b in zip(ds, ds[1:]):
        assert b["tu"] == a["den"] + dt.timedelta(days=1)


def test_meta_phai_day_du():
    assert ln.MAC_DINH == "dau_quan_thai_tue"
    for k, m in ln.PHAI.items():
        assert m["ten"] and m["cach_tinh"] and m["nguon"], k
