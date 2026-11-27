# -*- coding: utf-8 -*-
"""Chặng 4.1 — Kiểm chuẩn Bộ máy CALC Chiêm tinh phương Tây với 36 mốc độc lập từ NASA JPL Horizons."""
from __future__ import annotations

import datetime as dt
import json
import math
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import (
    chiem_tinh_lich as ctl,
    chiem_tinh_natal as ctn,
    chiem_tinh_synastry as cts,
    chiem_tinh_transit as ctt,
    tietkhi,
)

GOLDEN_PATH = Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "jpl_horizons_chiem_tinh.json"


def _goc_lech(a: float, b: float) -> float:
    return abs(((a - b + 180.0) % 360.0) - 180.0)


def test_396_diem_thien_the_va_4_tram_gio_sao_khop_nasa_jpl_horizons():
    """Đối chiếu offline 36 thời điểm bất kỳ (1931–2045, giờ/phút lẻ không trùng nút lưới):
    Ngưỡng sát sai số đo được (để bắt hồi quy), không nới rộng tuỳ tiện:
    - Mặt Trời (VSOP87D rút gọn của `tietkhi`): ≤ 2″ (đo được 0,8″).
    - 8 hành tinh + Chiron (lưới DE441 lượng tử 0,001° = 3,6″, nội suy bậc ba): ≤ 8″ (đo được ≤ 5,5″).
    - Mặt Trăng (ELP2000-82 60 số hạng): ≤ 20″ (đo được 13,5″).
    - Giờ sao biểu kiến địa phương (LAST) tại Hà Nội, TP.HCM, San Jose, Sydney: ≤ 6″ (đo được 0,7″–5,2″: engine coi
      UTC = UT1, phần dư khớp DUT1 của các ngày ấy — 2000-01-01 ≈ +0,36 s = 5,3″; |DUT1| < 0,9 s nên trần lý thuyết 13,5″).
    """
    ref = json.loads(GOLDEN_PATH.read_text(encoding="utf-8"))
    assert len(ref["moc_thoi_gian"]) == 36
    assert ref["_nguon"]["he_quy_chieu"].endswith("TIME_SCALE='UTC'")
    for ma_body, bang in ref["thien_the"].items():
        nguong = {"mat_trang": 20.0, "mat_troi": 2.0}.get(ma_body, 8.0) / 3600.0
        for iso_k, jpl in bang.items():
            t_utc = dt.datetime.strptime(iso_k, "%Y-%m-%dT%H:%M:%SZ")
            lon, _ = ctl.vi_tri_hanh_tinh(ma_body, t_utc)
            err = _goc_lech(lon, jpl["lon"])
            assert err <= nguong, f"{ma_body} tại {iso_k}: lệch {err*3600:.2f}″ > {nguong*3600:.1f}″"

    for st in ref["sidereal_tram_quan_sat"]:
        t_utc = dt.datetime.strptime(st["utc"], "%Y-%m-%dT%H:%M:%SZ")
        last = ctl.gio_sao_dia_phuong_deg(t_utc, st["kinh_do"])
        err = _goc_lech(last, st["last_deg_jpl"])
        assert err <= 6.0 / 3600.0, f"LAST tại {st['tram']}: lệch {err*3600:.2f}''"


def test_natal_mui_gio_lich_su_sai_gon_1970_khuyet_gio_va_vi_do_cao():
    # 1. Sài Gòn 02/12/1970 08:30 đồng hồ chạy UTC+8 -> UTC = 00:30
    sg_1970 = ctn.lap_ban_do_natal(
        ngay_sinh=dt.date(1970, 12, 2),
        gio_sinh="08:30",
        noi_sinh="tp-ho-chi-minh",
        he_nha="placidus",
    )
    assert sg_1970["dau_vao_da_chuan"]["utc_offset"] == 8.0
    assert sg_1970["dau_vao_da_chuan"]["utc_iso"] == "1970-12-02T00:30:00Z"
    assert sg_1970["he_nha"] == "placidus"
    assert len(sg_1970["nha"]) == 12
    assert sg_1970["truc"]["asc"]["cung"] in ctl.CUNG_HOANG_DAO

    # 2. Vĩ độ cao ≥ 66° (Tromsø 69.65°N): Placidus tự động lùi an toàn về Whole Sign + bật cảnh báo
    tromso = ctn.lap_ban_do_natal(
        ngay_sinh=dt.date(1995, 6, 21),
        gio_sinh="14:00",
        vi_do=69.65,
        kinh_do=18.96,
        utc_lech=2.0,
        he_nha="placidus",
    )
    assert tromso["he_nha"] == "whole_sign"
    assert tromso["canh_bao_vi_do_cao"] is True

    # 3. Khuyết giờ sinh: không an nhà giả tạo, trả rõ biên độ Mặt Trăng 00h–24h
    khong_gio = ctn.lap_ban_do_natal(ngay_sinh=dt.date(1990, 5, 15), gio_sinh=None, noi_sinh="ha-noi")
    assert khong_gio["co_gio_sinh"] is False
    assert khong_gio["nha"] is None and khong_gio["truc"] is None
    assert khong_gio["mat_trang_bien_do_ngay"] is not None
    assert all(v["nha"] is None for v in khong_gio["thien_the"].values())


def test_transit_saturn_solar_return_va_synastry_khong_cham_diem():
    natal_a = ctn.lap_ban_do_natal(ngay_sinh=dt.date(1997, 3, 15), gio_sinh="09:15", noi_sinh="ha-noi")
    tr = ctt.tinh_transit(natal_a, dt.date(2026, 11, 27))
    assert tr["saturn_return"]["giai_doan"] == "lan_1_29_tuoi"
    assert tr["solar_return"]["nam"] == 2026
    # Tại thời điểm Solar Return, kinh độ Mặt Trời phải trùng kinh độ Mặt Trời lúc sinh (< 0.002°)
    t_sr = dt.datetime.strptime(tr["solar_return"]["thoi_diem_utc"], "%Y-%m-%dT%H:%M:%SZ")
    lon_sr, _ = ctl.vi_tri_hanh_tinh("mat_troi", t_sr)
    assert _goc_lech(lon_sr, natal_a["thien_the"]["mat_troi"]["kinh_do"]) < 0.002

    natal_b = ctn.lap_ban_do_natal(ngay_sinh=dt.date(1996, 9, 22), gio_sinh="18:45", noi_sinh="tp-ho-chi-minh")
    syn = cts.tinh_synastry(natal_a, natal_b)
    assert syn["khong_cham_diem"] is True and "diem" not in syn


# ---------------------------------------------------------------------------------------------------------------------
# Một bộ tính với tiết khí (không chép lại phép tính)
# ---------------------------------------------------------------------------------------------------------------------

def test_ngay_julius_va_chuong_dong_dung_chung_tietkhi():
    t = dt.datetime(1990, 5, 15, 1, 30)
    assert ctl.jd_ut(t) == tietkhi._jd(t)
    assert ctl.jde_tt(t) == tietkhi._jd(t) + tietkhi.delta_t(tietkhi._nam_thap_phan(t)) / 86400.0
    jde = ctl.jde_tt(t)
    T = (jde - 2451545.0) / 36525.0
    assert ctl.chuong_dong_va_hoang_dao(jde)[0] == tietkhi.chuong_dong(T)[0]


def test_mat_trang_khop_vi_du_47a_meeus():
    """Meeus, *Astronomical Algorithms* (2nd ed.), ví dụ 47.a: 1992-04-12 0h TD (JDE 2448724.5) — kinh độ biểu kiến
    λ = 133,167265° (= 133,162655° + Δψ 0,004610°). Chương động rút gọn 4 số hạng lệch ≤ 0,5″."""
    assert abs(ctl.kinh_do_mat_trang_jde(2448724.5) - 133.167265) * 3600 < 1.0


# ---------------------------------------------------------------------------------------------------------------------
# Placidus — đối chiếu một cách giải ĐỘC LẬP: quét kinh độ hoàng đạo + chia đôi khoảng, không dùng lặp điểm bất động
# ---------------------------------------------------------------------------------------------------------------------

def _w(x: float) -> float:
    return ((x + 180.0) % 360.0) - 180.0


def _placidus_doc_lap(ramc: float, phi: float, eps: float) -> dict[int, float]:
    """Với mỗi điểm hoàng đạo λ: RA(λ), δ(λ), AD = asin(tan φ tan δ). Đỉnh nhà là nghiệm của
       nhà 11/12: wrap(RA − RAMC) − f·(90 + AD) = 0, RA ở nửa đông trên chân trời (f = 1/3, 2/3);
       nhà 2/3:   wrap(RA − RAMC − 180) + f·(90 − AD) = 0, RA ở nửa đông dưới chân trời (f = 2/3, 1/3)."""
    e, p = math.radians(eps), math.radians(phi)

    def ra_ad(lam: float) -> tuple[float, float]:
        lr = math.radians(lam)
        ra = math.degrees(math.atan2(math.sin(lr) * math.cos(e), math.cos(lr))) % 360.0
        dec = math.asin(math.sin(e) * math.sin(lr))
        return ra, math.degrees(math.asin(math.tan(p) * math.tan(dec)))

    def g(lam: float, nha: int) -> float:
        ra, ad = ra_ad(lam)
        if nha in (11, 12):
            return _w(ra - ramc) - (1 / 3 if nha == 11 else 2 / 3) * (90.0 + ad)
        return _w(ra - ramc - 180.0) + (2 / 3 if nha == 2 else 1 / 3) * (90.0 - ad)

    def hop_le(lam: float, nha: int) -> bool:
        ra, _ = ra_ad(lam)
        return 0.0 < _w(ra - ramc) < 180.0  # cả bốn đỉnh 11, 12, 2, 3 đều ở nửa phía đông

    ra = {}
    for nha in (11, 12, 2, 3):
        nghiem = []
        buoc = 0.05
        for k in range(int(360 / buoc)):
            a, b = k * buoc, (k + 1) * buoc
            ga, gb = g(a, nha), g(b, nha)
            if ga == 0.0 or (ga < 0) != (gb < 0):
                if abs(ga - gb) > 90:  # bước nhảy do quấn góc, không phải nghiệm
                    continue
                for _ in range(80):
                    m = (a + b) / 2
                    if (g(a, nha) < 0) != (g(m, nha) < 0):
                        b = m
                    else:
                        a = m
                if hop_le((a + b) / 2, nha):
                    nghiem.append((a + b) / 2)
        assert len(nghiem) == 1, (nha, nghiem)
        ra[nha] = nghiem[0]
    return ra


_CA_PLACIDUS = (
    ("xich_dao_quito", dt.datetime(2003, 8, 2, 17, 5), -0.18, -78.47),
    ("ha_noi", dt.datetime(1990, 5, 15, 1, 30), 21.0285, 105.85),
    ("sydney", dt.datetime(2012, 12, 21, 11, 12), -33.8688, 151.2093),
    ("vi_do_60_helsinki", dt.datetime(1979, 1, 30, 22, 40), 60.17, 24.94),
    ("tay_kinh_san_jose", dt.datetime(2000, 1, 1, 12, 0), 37.3382, -121.8863),
    ("tay_kinh_lima", dt.datetime(1966, 10, 9, 6, 15), -12.05, -77.04),
)


@pytest.mark.parametrize("ten,t,phi,lon", _CA_PLACIDUS, ids=[c[0] for c in _CA_PLACIDUS])
def test_placidus_khop_loi_giai_doc_lap_va_dung_thu_tu(ten, t, phi, lon):
    kq = ctl.tinh_nha_va_truc(t, phi, lon, he_nha="placidus")
    assert kq["he_nha_thuc_te"] == "placidus"
    dinh = [n["kinh_do"] for n in kq["nha"]]
    ramc = ctl.gio_sao_dia_phuong_deg(t, lon)
    eps = ctl.chuong_dong_va_hoang_dao(ctl.jde_tt(t))[1]
    doc_lap = _placidus_doc_lap(ramc, phi, eps)
    for nha, lam in doc_lap.items():
        assert abs(_w(dinh[nha - 1] - lam)) < 0.001, (ten, nha, dinh[nha - 1], lam)
        assert abs(_w(dinh[(nha + 5) % 12] - (lam + 180.0))) < 0.001, (ten, nha + 6)
    # 12 đỉnh tăng ngặt theo chiều hoàng đạo, đi đúng một vòng
    buoc = [(dinh[(i + 1) % 12] - dinh[i]) % 360.0 for i in range(12)]
    assert all(0.0 < b < 180.0 for b in buoc), (ten, buoc)
    assert abs(sum(buoc) - 360.0) < 1e-6
    # Thiên thể nằm ngay sau một đỉnh thuộc đúng nhà đó; ngay trước thì thuộc nhà trước
    for i in range(12):
        assert ctl.nha_cua_kinh_do(dinh[i] + 0.01, dinh) == i + 1
        assert ctl.nha_cua_kinh_do(dinh[i] - 0.01, dinh) == (i - 1) % 12 + 1


def test_placidus_ha_noi_1990_khop_so_doi_chieu():
    """Hà Nội 1990-05-15 01:30 UTC — 12 đỉnh nhà Placidus (số đối chiếu của người rà soát, cách giải bán cung)."""
    kq = ctl.tinh_nha_va_truc(dt.datetime(1990, 5, 15, 1, 30), 21.0285, 105.85, he_nha="placidus")
    mong = [99.48, 123.72, 150.28, 180.95, 214.87, 248.49, 279.48, 303.72, 330.28, 0.95, 34.87, 68.49]
    for n, m in zip(kq["nha"], mong):
        assert abs(_w(n["kinh_do"] - m)) < 0.01, (n["so"], n["kinh_do"], m)


# ---------------------------------------------------------------------------------------------------------------------
# Nơi sinh: không lặng lẽ đổi về Hà Nội
# ---------------------------------------------------------------------------------------------------------------------

def test_noi_sinh_toa_do_va_mien_mac_dinh():
    d = dt.date(1970, 12, 2)
    # Có toạ độ + múi giờ, không có tên nơi: dùng đúng toạ độ + múi giờ truyền vào
    a = ctn.giai_toa_do_va_utc(d, "08:30", vi_do=48.8566, kinh_do=2.3522, utc_lech=1.0)
    assert (a["vi_do"], a["kinh_do"], a["utc_offset"]) == (48.8566, 2.3522, 1.0)
    assert a["t_utc"] == dt.datetime(1970, 12, 2, 7, 30)
    # Không có gì, miền Nam: mặc định TP Hồ Chí Minh, đồng hồ UTC+8 (1960–1975)
    b = ctn.giai_toa_do_va_utc(d, "08:30", vung_vn="south")
    assert b["ten_noi"] == "TP Hồ Chí Minh" and b["utc_offset"] == 8.0
    assert b["t_utc"] == dt.datetime(1970, 12, 2, 0, 30)
    c = ctn.giai_toa_do_va_utc(d, "08:30")
    assert c["ten_noi"] == "Hà Nội" and c["utc_offset"] == 7.0
    # Tỉnh không có miền cố định (Quảng Trị, cắt bởi vĩ tuyến 17) theo `vung_vn`
    assert ctn.giai_toa_do_va_utc(d, "08:30", noi_sinh="quang-tri", vung_vn="south")["utc_offset"] == 8.0
    assert ctn.giai_toa_do_va_utc(d, "08:30", noi_sinh="quang-tri", vung_vn="north")["utc_offset"] == 7.0


def test_noi_sinh_nuoc_ngoai_dung_lech_chinh_xac_tzdata():
    # San Jose 1990-07-04: giờ mùa hè UTC−7
    a = ctn.giai_toa_do_va_utc(dt.date(1990, 7, 4), "10:00", noi_sinh="us-san_jose")
    assert a["utc_offset"] == -7.0 and a["t_utc"] == dt.datetime(1990, 7, 4, 17, 0)
    # Mã vùng IANA kèm toạ độ
    b = ctn.giai_toa_do_va_utc(dt.date(1990, 7, 4), "10:00", noi_sinh="Europe/Paris", vi_do=48.86, kinh_do=2.35)
    assert b["utc_offset"] == 2.0
    # Lệch lấy đúng `lech_chinh_xac` của tzdata (không phải giá trị đã làm tròn 15 phút)
    from app.calc import mui_gio
    tai = mui_gio.tai("Asia/Kathmandu", 1990, 1, 1, 12)
    k = ctn.giai_toa_do_va_utc(dt.date(1990, 1, 1), "12:00", noi_sinh="Asia/Kathmandu", vi_do=27.7, kinh_do=85.3)
    assert k["utc_offset"] == tai["lech_chinh_xac"]


@pytest.mark.parametrize("ma", ["paris", "xyz", "gn-999999999"])
def test_noi_sinh_la_bao_loi_khong_doi_ve_ha_noi(ma):
    with pytest.raises(ctn.LoiNoiSinh):
        ctn.giai_toa_do_va_utc(dt.date(1990, 1, 1), "12:00", noi_sinh=ma)


def test_mui_gio_khong_kem_toa_do_bao_loi():
    with pytest.raises(ctn.LoiNoiSinh):
        ctn.giai_toa_do_va_utc(dt.date(1990, 1, 1), "12:00", noi_sinh="Europe/Paris")
    with pytest.raises(ctn.LoiNoiSinh):
        ctn.giai_toa_do_va_utc(dt.date(1990, 1, 1), "12:00", vi_do=10.0)


def test_api_noi_sinh_la_tra_422_theo_ngon_ngu():
    from app.main import app

    c = TestClient(app)
    than = {"ngay_sinh": "1990-05-15", "gio_sinh": "08:30", "noi_sinh": "paris", "kem_cau_noi_dong_tay": False}
    vi = c.post("/v1/chiem-tinh/ban-do", json=than)
    assert vi.status_code == 422 and "Chưa tìm thấy nơi sinh" in vi.json()["detail"]
    en = c.post("/v1/chiem-tinh/ban-do", json=than, headers={"x-ngon-ngu": "en"})
    assert en.status_code == 422 and "could not find" in en.json()["detail"]
    syn = c.post("/v1/chiem-tinh/hop-doi", json={
        "nguoi_a": {"ngay_sinh": "1990-05-15", "noi_sinh": "ha-noi"},
        "nguoi_b": {"ngay_sinh": "1991-02-01", "noi_sinh": "gn-999999999"},
        "dong_y_tu_nguyen": True,
    })
    assert syn.status_code == 422


# ---------------------------------------------------------------------------------------------------------------------
# Không biết giờ sinh: góc chiếu Mặt Trăng chỉ giữ khi đúng suốt cả ngày
# ---------------------------------------------------------------------------------------------------------------------

def _dem_goc_trang_khong_giu_ca_ngay(nat: dict) -> int:
    bd = nat["mat_trang_bien_do_ngay"]
    sai = 0
    for g in nat["goc_chieu"]:
        if "mat_trang" not in (g["diem_1"], g["diem_2"]):
            continue
        khac = g["diem_2"] if g["diem_1"] == "mat_trang" else g["diem_1"]
        orb = next(o for ma, _, o, _ in ctn.GOC_CHIEU_CHINH if ma == g["loai"])
        lon_khac = nat["thien_the"][khac]["kinh_do"]
        if not all(abs(ctn._khoang_goc(m, lon_khac) - g["goc_chuan"]) <= orb + 1e-9
                   for m in (bd["kinh_do_00h"], bd["kinh_do_24h"])):
            sai += 1
    return sai


def test_khong_gio_sinh_goc_mat_trang_chi_giu_khi_dung_ca_ngay():
    tong_trang = 0
    for i in range(60):
        ns = dt.date(1950, 1, 3) + dt.timedelta(days=97 * i)
        nat = ctn.lap_ban_do_natal(ngay_sinh=ns, gio_sinh=None, noi_sinh="ha-noi")
        assert _dem_goc_trang_khong_giu_ca_ngay(nat) == 0, ns
        tong_trang += sum("mat_trang" in (g["diem_1"], g["diem_2"]) for g in nat["goc_chieu"])
    assert tong_trang > 0  # vẫn có góc Mặt Trăng đúng suốt cả ngày — không bỏ hết


def test_synastry_khong_gio_mat_trang_chi_giu_khi_dung_ca_ngay():
    a = ctn.lap_ban_do_natal(ngay_sinh=dt.date(1992, 6, 1), gio_sinh=None, noi_sinh="ha-noi")
    for i in range(40):
        b = ctn.lap_ban_do_natal(ngay_sinh=dt.date(1990, 1, 1) + dt.timedelta(days=37 * i), gio_sinh="10:00",
                                 noi_sinh="ha-noi")
        bd = a["mat_trang_bien_do_ngay"]
        for g in cts.tinh_synastry(a, b)["goc_cheo"]:
            if g["nguoi_a"] != "mat_trang":
                continue
            lon_b = b["thien_the"][g["nguoi_b"]]["kinh_do"] if g["nguoi_b"] != "asc" else b["truc"]["asc"]["kinh_do"]
            for m in (bd["kinh_do_00h"], bd["kinh_do_24h"]):
                assert abs(ctn._khoang_goc(m, lon_b) - g["goc_chuan"]) <= 5.0 + 1e-9
