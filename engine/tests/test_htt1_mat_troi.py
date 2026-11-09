# -*- coding: utf-8 -*-
"""HTT-1 — giờ mặt trời thực toàn cầu (docs/DANH-GIA-HYBRID-TWO-TIER.md mục 3.1).

  * Phương trình thời gian tính từ VSOP87 (`timebase.phuong_trinh_thoi_gian_utc`) khớp niên lịch thiên văn: cực tiểu ≈ −14,2
    phút (11/02), cực đại ≈ +16,4 phút (03/11), ≈ 0 ở 15/04 · 13/06 · 01/09 · 25/12 (sai ≤ 0,3 phút).
  * 146 thành phố trong `mui_gio.json` có toạ độ (trừ mục "khác"); kinh độ khớp múi giờ chuẩn ± 2,5 giờ (Urumqi, Madrid… vẫn trong).
  * Người sinh ở nước ngoài chọn thành phố → cờ `gio_mat_troi` như tỉnh Việt Nam; lá số KHÔNG đổi (SOLAR_TIME_ADJUST=False).
  * Công tắc `gio_sinh = "mat_troi"` (chủ dự án hỏi "làm được không", 2026-11-09): lập lá số theo giờ mặt trời thực, cờ
    `gio_sinh_mat_troi` ghi số phút dịch; thiếu kinh độ → 422; mặc định `dong_ho` giữ nguyên kết quả cũ.
"""
from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

from app.calc import mui_gio, timebase
from app.main import app

client = TestClient(app)


@pytest.mark.parametrize("ngay,phut", [
    ("2000-02-11", -14.23), ("2000-05-14", 3.7), ("2000-07-26", -6.47), ("2000-11-03", 16.45), ("1988-10-24", 15.8),
    ("2000-04-15", 0.0), ("2000-06-13", 0.0), ("2000-09-01", 0.0), ("2000-12-25", 0.0),
])
def test_phuong_trinh_thoi_gian_khop_nien_lich(ngay, phut):
    t = dt.datetime.fromisoformat(ngay + "T12:00:00")
    assert abs(timebase.phuong_trinh_thoi_gian_utc(t) - phut) <= 0.3


def test_phuong_trinh_thoi_gian_theo_ngay_dung_ham_moi():
    d = dt.date(2000, 11, 3)
    assert abs(timebase.phuong_trinh_thoi_gian(d) - 16.4) <= 0.3
    # Hà Nội 105,85°Đ, 10:45 ngày 03/11 → ≈ 11:04 (như test_noi_sinh)
    mt = timebase.gio_mat_troi_thuc(dt.datetime(1990, 11, 3, 10, 45), 105.85)
    assert mt.hour == 11 and 2 <= mt.minute <= 6


def test_gio_mat_troi_thuc_utc_theo_kinh_do():
    # New York (−74,01°): 03:15 UTC ngày 26/06 → trừ 296 phút kinh độ, EoT ≈ −2,5 → ≈ 22:16 hôm trước.
    mt = timebase.gio_mat_troi_thuc_utc(dt.datetime(1988, 6, 26, 3, 15), -74.01)
    assert mt.day == 25 and mt.hour == 22 and 14 <= mt.minute <= 18
    # Kinh độ 0, ngày EoT ≈ 0 → gần như không đổi.
    mt0 = timebase.gio_mat_troi_thuc_utc(dt.datetime(2000, 4, 15, 12, 0), 0.0)
    assert abs((mt0 - dt.datetime(2000, 4, 15, 12, 0)).total_seconds()) < 30


def test_moi_thanh_pho_co_toa_do_khop_mui_gio():
    thieu, lech = [], []
    for n in mui_gio.danh_sach():
        for t in n["thanh_pho"]:
            if t["ma"].endswith("-khac"):
                assert "kinh_do" not in t
                continue
            if "kinh_do" not in t or "vi_do" not in t:
                thieu.append(t["ma"])
                continue
            assert -180 <= t["kinh_do"] <= 180 and -90 <= t["vi_do"] <= 90
            # Múi giờ chuẩn (không giờ mùa hè) giữa tháng 1 năm 2020 so với kinh độ / 15.
            tz = dt.datetime(2020, 1, 15, 12, tzinfo=ZoneInfo(t["zone"]))
            chuan = (tz.utcoffset() - tz.dst()).total_seconds() / 3600
            if abs(chuan - t["kinh_do"] / 15) > 2.5:
                lech.append((t["ma"], chuan, t["kinh_do"]))
    assert thieu == [] and lech == []


def _an_sao(**kw) -> dict:
    r = client.post("/v1/tuvi/an-sao", json={"gender": "nam", "calendar_type": "duong", **kw})
    assert r.status_code == 200, r.text
    return r.json()


def _co(d: dict) -> dict[str, str]:
    return {c["loai"]: c["chi_tiet"] for c in d["co_canh_bao"]}


def test_canh_bao_gio_mat_troi_cho_thanh_pho_nuoc_ngoai():
    # Madrid chạy UTC+1 nhưng kinh độ −3,7° → mặt trời chậm ~75 phút + EoT tháng 1 (−7) → 13:05 đồng hồ ≈ 11:43: Mùi → Ngọ.
    a = _an_sao(birth_date="2000-01-10", birth_time="13:05", noi_sinh="nuoc_ngoai", mui_gio="es-madrid")
    co = _co(a)
    assert "gio_mat_troi" in co and "Ngọ" in co["gio_mat_troi"] and "Madrid" in co["gio_mat_troi"]
    assert a["gio_chi_so"] == 7                       # lá số KHÔNG đổi (Mùi)
    # Sydney 14:00 giữa tháng 7: kinh độ 151,2° gần kinh tuyến 150°, EoT −6 → không đổi canh giờ → không cảnh báo.
    b = _an_sao(birth_date="1995-07-15", birth_time="14:00", noi_sinh="nuoc_ngoai", mui_gio="au-sydney")
    assert "gio_mat_troi" not in _co(b)
    # Khai múi giờ IANA (không có kinh độ) → không cảnh báo, không lỗi.
    c = _an_sao(birth_date="2000-01-10", birth_time="13:05", noi_sinh="nuoc_ngoai", mui_gio="Europe/Madrid")
    assert "gio_mat_troi" not in _co(c)


def test_cong_tac_gio_sinh_theo_mat_troi():
    a = _an_sao(birth_date="2000-01-10", birth_time="13:05", noi_sinh="nuoc_ngoai", mui_gio="es-madrid", gio_sinh="mat_troi")
    co = _co(a)
    assert a["gio_chi_so"] == 6 and "gio_sinh_mat_troi" in co and "−82 phút" in co["gio_sinh_mat_troi"]
    assert "gio_mat_troi" not in co
    # New York 23:15 EDT 25/06/1988 (ca mẫu của tài liệu Drive): giờ chuẩn 22:15 (đã trừ giờ mùa hè MỘT lần) → mặt trời 22:16
    # (kinh độ −74,01° gần kinh tuyến −75°, EoT −2,5) → Hợi; dịch +1 phút so với giờ chuẩn — không trừ giờ mùa hè lần hai.
    b = _an_sao(birth_date="1988-06-25", birth_time="23:15", noi_sinh="nuoc_ngoai", mui_gio="us-new_york", gio_sinh="mat_troi")
    assert b["gio_chi_so"] == 11 and "+1 phút so với giờ chuẩn 22:15" in _co(b)["gio_sinh_mat_troi"]
    # Los Angeles 12:30 PDT 01/07/2000: giờ chuẩn 11:30 (UTC−8, kinh tuyến 120°T), kinh độ −118,24° → +7 phút, EoT −4 → 11:33 giờ Ngọ
    # (review 2026-11-09: bản đầu dịch trước rồi trừ giờ mùa hè lần nữa → 10:33 giờ Tỵ, sai).
    la = _an_sao(birth_date="2000-07-01", birth_time="12:30", noi_sinh="nuoc_ngoai", mui_gio="us-los_angeles", gio_sinh="mat_troi")
    assert la["gio_chi_so"] == 6 and "+3 phút so với giờ chuẩn 11:30" in _co(la)["gio_sinh_mat_troi"]
    # Sài Gòn 00:20 ngày 15/06/1965 (đồng hồ UTC+8 → kinh tuyến lịch 23:20 ngày 14/06): +7 phút → 23:27, giờ Tý muộn (chỉ số 12
    # của iztro) — không trừ thêm một giờ nữa.
    sg = _an_sao(birth_date="1965-06-15", birth_time="00:20", noi_sinh="tp-ho-chi-minh", gio_sinh="mat_troi")
    assert sg["gio_chi_so"] == 12 and "+7 phút so với giờ chuẩn 23:20" in _co(sg)["gio_sinh_mat_troi"]
    # Trong nước: Điện Biên 11:05 → 10:57 giờ Tỵ (cùng số liệu với cảnh báo cũ).
    c = _an_sao(birth_date="1990-06-13", birth_time="11:05", noi_sinh="dien-bien", gio_sinh="mat_troi")
    assert c["gio_chi_so"] == 5 and "Tỵ" in _co(c)["gio_sinh_mat_troi"]
    # Mặc định đồng hồ: y như trước.
    d = _an_sao(birth_date="1990-06-13", birth_time="11:05", noi_sinh="dien-bien")
    assert d["gio_chi_so"] == 6 and "gio_sinh_mat_troi" not in _co(d)


def test_gio_sinh_mat_troi_can_kinh_do():
    r = client.post("/v1/tuvi/an-sao", json={"gender": "nam", "birth_date": "1990-06-13", "birth_time": "11:05",
                                            "noi_sinh": "nuoc_ngoai", "mui_gio": "jp-khac", "gio_sinh": "mat_troi"})
    assert r.status_code == 422
    r = client.post("/v1/tuvi/an-sao", json={"gender": "nam", "birth_date": "1990-06-13", "birth_time": "11:05",
                                            "vung": "north", "gio_sinh": "mat_troi"})
    assert r.status_code == 422


def test_bat_tu_cung_dung_gio_mat_troi_khi_chon():
    r = client.post("/v1/battu/la-so", json={"gender": "nam", "birth_date": "2000-01-10", "birth_time": "13:05",
                                             "noi_sinh": "nuoc_ngoai", "mui_gio": "es-madrid", "gio_sinh": "mat_troi"})
    assert r.status_code == 200, r.text
    assert r.json()["gio_lich"].startswith("2000-01-10T11:43")
    assert "gio_sinh_mat_troi" in {f["loai"] for f in r.json()["co_canh_bao"]}
