# -*- coding: utf-8 -*-
"""Chặng 4.1 — Kiểm chuẩn Bộ máy CALC Chiêm tinh phương Tây với 36 mốc độc lập từ NASA JPL Horizons."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from app.calc import (
    chiem_tinh_lich as ctl,
    chiem_tinh_natal as ctn,
    chiem_tinh_synastry as cts,
    chiem_tinh_transit as ctt,
)

GOLDEN_PATH = Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "jpl_horizons_chiem_tinh.json"


def _goc_lech(a: float, b: float) -> float:
    return abs(((a - b + 180.0) % 360.0) - 180.0)


def test_396_diem_thien_the_va_4_tram_gio_sao_khop_nasa_jpl_horizons():
    """Đối chiếu offline 36 thời điểm bất kỳ (1931–2045, giờ/phút lẻ không trùng nút lưới):
    - Mặt Trời & 9 hành tinh / Chiron: sai số ≤ 1 phút cung (0,0167°).
    - Mặt Trăng (ELP2000-82 60 số hạng): sai số ≤ 2 phút cung (0,0333°).
    - Giờ sao biểu kiến địa phương (LAST) tại Hà Nội, TP.HCM, San Jose, Sydney: sai số ≤ 10 giây cung (0,0028°).
    """
    ref = json.loads(GOLDEN_PATH.read_text(encoding="utf-8"))
    assert len(ref["moc_thoi_gian"]) == 36
    for ma_body, bang in ref["thien_the"].items():
        nguong = 2.0 / 60.0 if ma_body == "mat_trang" else 1.0 / 60.0
        for iso_k, jpl in bang.items():
            t_utc = dt.datetime.strptime(iso_k, "%Y-%m-%dT%H:%M:%SZ")
            lon, _ = ctl.vi_tri_hanh_tinh(ma_body, t_utc)
            err = _goc_lech(lon, jpl["lon"])
            assert err <= nguong, f"{ma_body} tại {iso_k}: lệch {err*60:.3f}' > {nguong*60:.1f}'"

    for st in ref["sidereal_tram_quan_sat"]:
        t_utc = dt.datetime.strptime(st["utc"], "%Y-%m-%dT%H:%M:%SZ")
        last = ctl.gio_sao_dia_phuong_deg(t_utc, st["kinh_do"])
        err = _goc_lech(last, st["last_deg_jpl"])
        assert err <= 10.0 / 3600.0, f"LAST tại {st['tram']}: lệch {err*3600:.2f}''"


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
