# -*- coding: utf-8 -*-
"""EN-1 (docs/KE-HOACH-NANG-CAP-ENGINE.md) — sửa độ đúng ở lớp ghép, test viết TRƯỚC khi sửa.

DU-1 hỏi đáp Phong thuỷ tính tuổi làm nhà bằng đúng hàm của trang /xem-tuoi-lam-nha (năm âm của ngày sinh, năm âm của
ngày xem). DU-2 "năm nay" của Bát tự / phi tinh đổi ở Lập xuân. DU-3 Kim lâu không bảo đàn ông tránh cưới. DU-4 lịch âm
không bao giờ trả "ngày 0" (lỗi có sẵn của bản gốc Hồ Ngọc Đức khi sóc thật sát nửa đêm). BI-4 tên có "Ð" (U+00D0)."""
import datetime as dt

import pytest

from app.calc import lunar, thanso
from app.hoidap import battu as hd_bt, chung, phongthuy as hd_pt
from app.luangiai import tuoi_dan_gian as tdg


def test_tuoi_lam_nha_hoi_dap_trung_trang_cong_cu():
    sinh = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 1, 20), "moc_nam": "lap_xuan"}   # trước Tết: Kỷ Tỵ
    r = hd_pt.tra_loi("Năm 2026 tôi có nên làm nhà không?", sinh=sinh, ngay_xem=dt.date(2026, 11, 1))
    m = next(x for x in r["bang_chung"]["muc"] if x["loai"] == "tuoi_lam_nha")
    trang = tdg.xem_tuoi_lam_nha(1990, 2026, 1, 20)
    assert m["tuoi_mu"] == trang["tuoi_mu"] == 38
    assert (m["kim_lau"] or {}).get("ma") == (trang["kim_lau"] or {}).get("ma")


@pytest.mark.parametrize("ngay,lx,am", [(dt.date(2027, 1, 20), 2026, 2026), (dt.date(2027, 2, 5), 2027, 2026),
                                         (dt.date(2027, 2, 10), 2027, 2027), (dt.date(2026, 11, 1), 2026, 2026)])
def test_nam_nay_theo_lap_xuan_va_tet(ngay, lx, am):
    assert chung.nam_xem_hh(None, ngay, "nam nay") == (lx, am)
    assert chung.nam_xem_hh(None, ngay, "nam sau") == (lx + 1, am + 1)
    assert chung.nam_xem_hh(2030, ngay, "nam 2030") == (2030, 2030)


def test_bat_tu_nam_nay_thang_1():
    sinh = {"lich": dt.datetime(1990, 5, 10, 8), "gioi_tinh": "nam", "gio_ty": "da_ty"}
    r = hd_bt.tra_loi("Vận năm nay của tôi thế nào?", sinh=sinh, ngay_xem=dt.date(2027, 1, 20))
    s = r["cau_tra_loi"]
    assert "Lưu niên 2026: Bính Ngọ" in s and "Đinh Mùi" not in s


def test_phi_tinh_nam_nay_thang_1():
    sinh = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 10), "moc_nam": "lap_xuan"}
    r = hd_pt.tra_loi("Năm nay Ngũ Hoàng ở đâu?", sinh=sinh, ngay_xem=dt.date(2027, 1, 20))
    m = next(x for x in r["bang_chung"]["muc"] if x["loai"] == "sao_nam")
    assert m["nam"] == 2026


def test_kim_lau_khong_bao_dan_ong_tranh_cuoi():
    x = tdg.xem_tuoi_lam_nha(1990, 2026)              # tuổi mụ 37: Kim lâu
    assert x["kim_lau"]
    assert "tránh làm nhà, cưới hỏi" not in x["ket_luan"]["chu"]
    assert "cô dâu" in x["ket_luan"]["chu"]


@pytest.mark.parametrize("tz", [7.0, 8.0])
def test_lich_am_khong_co_ngay_0_toan_dai(tz):
    d = dt.date(1900, 1, 1)
    sai = []
    while d <= dt.date(2100, 12, 31):
        a = lunar.solar_to_lunar(d.day, d.month, d.year, tz)
        if not 1 <= a[0] <= 30:
            sai.append((d, a))
        d += dt.timedelta(days=1)
    assert not sai, sai[:5]


@pytest.mark.parametrize("ngay,tz", [((26, 3, 2009), 8.0), ((19, 4, 1939), 8.0), ((22, 3, 1947), 8.0),
                                     ((7, 5, 2054), 7.0), ((9, 4, 2062), 7.0)])
def test_lich_am_ngay_loi_cu_khu_hoi(ngay, tz):
    a = lunar.solar_to_lunar(*ngay, tz)
    assert a[0] in (29, 30)                              # sóc rơi ngày hôm sau → hôm nay là ngày cuối tháng trước
    y = lunar.lunar_to_solar(a[0], a[1], a[2], a[3], tz)
    assert tuple(y) == (ngay[0], ngay[1], ngay[2])


def test_ten_co_chu_eth():
    assert thanso.bo_dau("Ðặng") == thanso.bo_dau("Đặng") == "Dang"
    assert thanso.bo_dau("ɖ") == "d"
