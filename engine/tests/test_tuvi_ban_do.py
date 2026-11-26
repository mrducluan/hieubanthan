# -*- coding: utf-8 -*-
"""TV-BD1 — "Bản đồ 12 cung Tử vi" (`luangiai/tuvi_ban_do.py` + `POST /v1/tuvi/ban-do`).
Viết TRƯỚC hàm (TDD).

Hợp đồng:
- Đúng 12 cung (`len(kq["o"]) == 12`), mức `muc` của từng cung khớp 100% `tuvi_doi_song.cham_cung` (một nguồn).
- Mức 10 năm tới trong `thoi_gian.nam` khớp 100% `tuvi_doi_song.dong_muoi_nam` trên 3 lá mẫu.
- Khoá SAO-2 phía máy chủ: CHỈ `nam == thoi_gian.nam_xem` được mang `y`, `nen_tranh`, `nen_lam`; mọi năm tương lai
  (`nam > nam_xem`) BẮT BUỘC `khoa: True` và KHÔNG có `y` / `nen_tranh` / `nen_lam` trong JSON.
- Cổng TUOI-16: người dưới 16 tuổi (`birth_date: "2014-05-15"`) nhận `nguoi_lon: False`, cung Phu Thê / Tử Nữ dùng lời
  phù hợp lứa tuổi (không nói vợ chồng / hôn nhân / bạn đời), không dẫn sang chương tình yêu hôn nhân.
- Không biết giờ sinh (`do_tin_gio: "unknown"`) trả HTTP 422 ở cả bản Việt và bản Anh.
- Chuỗi phi hoá 2 chặng `chuoi_chuyen_ky` (`A -> B -> C`) có `ma_mau = "ds.duong_bay.{kck|lck}.{tu}+{den}"` và
  `phai = "luong_phai_phi_tinh"`, đi qua bộ kiểm SQL `test_kiem_chung_ma._hop_le("doi_song", ...)`.
- Đối xứng song ngữ VI ↔ EN: `dr.khung(dv) == dr.khung(de)`, `dr.loi_en(de, body) == []`, sạch `cum_cam_chung()` & `cum_cam_en`.
"""
from __future__ import annotations

import datetime as dt
import re
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.calc import lunar, tuvi_an_sao as az
from app.hoidap.tuvi import tom_tat
from app.kb import nap, tuvi_doi_song_kb as kb_ds
from app.luangiai import doi_song_khuon as kh
from app.luangiai import tuvi_doi_song as tvds
from app.main import app
from app.tuvi_api import TuanTrietInput, _DauVao
from tests import _dau_ra as dr
from tests import test_kiem_chung_ma as kcm

XEM = dt.date(2026, 11, 26)
MUC = {"thuan", "can_bang", "can_chu_dong"}
MA_12 = {
    "menh", "phu_mau", "phuc_duc", "dien_trach", "quan_loc", "no_boc",
    "thien_di", "tat_ach", "tai_bach", "tu_nu", "phu_the", "huynh_de",
}
CHUONG_HOP_LE = {
    "tong_quan", "cuoc_doi", "su_nghiep", "tien_bac", "tinh_cam",
    "gia_dinh", "suc_khoe", "quan_he", "nha_cua", "duong_bay", "van_han",
}
BA_LA_MAU = (
    {"birth_date": "1988-10-24", "birth_time": "08:30", "gender": "nam", "noi_sinh": "ha-noi"},
    {"birth_date": "1990-05-17", "birth_time": "12:10", "gender": "nu", "noi_sinh": "tp-ho-chi-minh"},
    {"birth_date": "1997-03-19", "birth_time": "00:30", "gender": "nam", "noi_sinh": "da-nang"},
)
TU_DOA = re.compile(r"xui xẻo|tai hoạ|đại kỵ|chết yểu|bệnh nan y|ly hôn chắc|khắc (vợ|chồng|con)", re.I)

client = TestClient(app)


def _sinh_tu_la(la: dict) -> tuple[dict, _DauVao]:
    inp = TuanTrietInput(**la)
    dv = _DauVao(inp)
    cal = dv.tb.calendar_dt
    sinh = {
        "ngay": cal.date(),
        "ti": az.time_index(cal.hour, cal.minute),
        "gioi_tinh": inp.gender,
        "tz_lich": dv.tz_lich,
        **dv.tuy_chon,
    }
    return sinh, dv


def _moi_chuoi(x: Any, bo_qua_khoa: set[str] | None = None) -> list[str]:
    bo_qua_khoa = bo_qua_khoa or set()
    ra: list[str] = []
    if isinstance(x, dict):
        for k, v in x.items():
            if k in bo_qua_khoa:
                continue
            ra.extend(_moi_chuoi(v, bo_qua_khoa))
    elif isinstance(x, list):
        for v in x:
            ra.extend(_moi_chuoi(v, bo_qua_khoa))
    elif isinstance(x, str):
        ra.append(x)
    return ra


@pytest.fixture(scope="module")
def kq0() -> dict:
    r = client.post("/v1/tuvi/ban-do", json={"la_so": BA_LA_MAU[0], "ngay_xem": XEM.isoformat()})
    assert r.status_code == 200, r.text
    return r.json()


def test_hop_dong_12_cung(kq0: dict):
    assert kq0["phien_ban"] == "tuvi_ban_do_1"
    assert "engine_version" in kq0
    assert kq0["nguoi_lon"] is True and kq0["tuoi"] == 38
    assert len(kq0["o"]) == 12
    assert {o["ma"] for o in kq0["o"]} == MA_12
    assert {o["chi_so"] for o in kq0["o"]} == set(range(12))
    assert sum(1 for o in kq0["o"] if o["la_menh"]) == 1
    assert sum(1 for o in kq0["o"] if o["la_than"]) == 1
    assert sum(1 for o in kq0["o"] if o["la_lai_nhan"]) in (0, 1)

    for o in kq0["o"]:
        assert o["muc"] in MUC and o["nhan_muc"]
        assert o["hanh_cung"] in {"Kim", "Mộc", "Thủy", "Hỏa", "Thổ"}
        assert o["la_gi"] and o["vi_sao"]
        assert o["tam_phuong"]["xung"] in MA_12
        assert len(o["tam_phuong"]["tam_hop"]) == 2 and set(o["tam_phuong"]["tam_hop"]) <= MA_12
        assert o["tam_phuong"]["cau"]
        assert len(o["bay_cung"]) <= 4
        assert len(o["nam"]) <= 4
        assert o["chuong"] in CHUONG_HOP_LE

    assert 1 <= len(kq0["noi_bat"]) <= 3
    for n in kq0["noi_bat"]:
        assert set(n["o"]) <= MA_12 and n["cau"]


def test_muc_cung_mot_nguon_cham_cung():
    """Mức 12 cung trên bản đồ phải trùng 100% với `tuvi_doi_song.cham_cung` trên cả 3 lá mẫu."""
    for la in BA_LA_MAU:
        r = client.post("/v1/tuvi/ban-do", json={"la_so": la, "ngay_xem": XEM.isoformat()})
        assert r.status_code == 200, r.text
        bd = r.json()
        sinh, _ = _sinh_tu_la(la)
        sinh_c = az.chuan_sinh(sinh)
        ls = tom_tat(az.an_sao_tho(
            sinh_c["ngay"], sinh_c["ti"], sinh_c["gioi_tinh"], "vi-VN",
            tz_lich=sinh_c["tz_lich"], hoa_linh=sinh_c["hoa_linh"],
            thang_nhuan=sinh_c["thang_nhuan"], lich=sinh_c["lich"],
        ))
        cc = tvds.cham_cung(ls)
        for o in bd["o"]:
            assert o["muc"] == cc[o["cung"]]["muc"], (la["birth_date"], o["cung"])


def test_muc_nam_mot_nguon_dong_muoi_nam_va_khoa_sao_2():
    """Mức 10 năm tới trùng 100% `dong_muoi_nam`; CHỈ `nam == nam_xem` có `y`/`nen_tranh`/`nen_lam`; `nam > nam_xem` khoá SAO-2."""
    for la in BA_LA_MAU:
        r = client.post("/v1/tuvi/ban-do", json={"la_so": la, "ngay_xem": XEM.isoformat()})
        assert r.status_code == 200, r.text
        bd = r.json()
        sinh, _ = _sinh_tu_la(la)
        sinh_c = az.chuan_sinh(sinh)
        kw = {"tz_lich": sinh_c["tz_lich"], "thang_nhuan": sinh_c["thang_nhuan"], "lich": sinh_c["lich"]}
        ls = tom_tat(az.an_sao_tho(sinh_c["ngay"], sinh_c["ti"], sinh_c["gioi_tinh"], "vi-VN",
                                   hoa_linh=sinh_c["hoa_linh"], **kw))
        vh = az.van_han(sinh_c["ngay"], sinh_c["ti"], sinh_c["gioi_tinh"], XEM, **kw)
        nam_am_xem = lunar.solar_to_lunar(XEM.day, XEM.month, XEM.year, 7.0)[2]
        nam_am_sinh = nam_am_xem - vh["tuoi_mu"] + 1
        cc = tvds.cham_cung(ls)
        dong = {g["nam"]: g for g in tvds.dong_muoi_nam(ls, cc, nam_am_xem, nam_am_sinh, sinh_c["gioi_tinh"])}

        tg = bd["thoi_gian"]
        assert tg["nam_xem"] == nam_am_xem
        nam_map = {x["nam"]: x for x in tg["nam"]}
        assert max(nam_map) == max(dong)

        for n, g in dong.items():
            assert nam_map[n]["muc"] == g["muc"], (la["birth_date"], n)
            assert nam_map[n]["nhan_muc"] == g["nhan_muc"], (la["birth_date"], n)

        for n, x in nam_map.items():
            if n == tg["nam_xem"]:
                assert not x.get("khoa")
                assert x.get("y") == dong[n].get("y")
                assert x.get("nen_tranh") == dong[n].get("nen_tranh")
                assert x.get("nen_lam") == dong[n].get("nen_lam")
            elif n > tg["nam_xem"]:
                assert x.get("khoa") is True, (la["birth_date"], n)
                assert not ({"y", "nen_tranh", "nen_lam"} & set(x.keys())), (la["birth_date"], n, x.keys())
            else:
                assert x["qua"] is True
                assert not ({"khoa", "y", "nen_tranh", "nen_lam"} & set(x.keys()))

        for o in bd["o"]:
            for xn in o["nam"]:
                assert xn["muc"] == dong[xn["nam"]]["muc"]


def test_cong_tuoi_16_tre_em():
    """Người dưới 16 tuổi: `nguoi_lon: False`, không nói vợ chồng / hôn nhân / bạn đời ở Phu Thê & Tử Nữ."""
    tre = {"birth_date": "2014-05-15", "birth_time": "09:30", "gender": "nam", "noi_sinh": "ha-noi"}
    r = client.post("/v1/tuvi/ban-do", json={"la_so": tre, "ngay_xem": XEM.isoformat()})
    assert r.status_code == 200, r.text
    bd = r.json()
    assert bd["nguoi_lon"] is False and bd["tuoi"] < 16

    cam_tre = re.compile(r"vợ chồng|người vợ|người chồng|hôn nhân|bạn đời|đôi lứa|người yêu|cưới xin|sinh con", re.I)
    for o in bd["o"]:
        van = " ".join(o["la_gi"] + o["tam_phuong"]["cau"] + [b["cau"] for b in o["bay_cung"]] + [n["cau"] for n in o["nam"]])
        assert not cam_tre.search(van), (o["ma"], van)
    phu_the = next(o for o in bd["o"] if o["ma"] == "phu_the")
    assert phu_the["chuong"] != "tinh_cam"


def test_khong_biet_gio_tra_422():
    """Không biết giờ sinh (`do_tin_gio: "unknown"`) → 422 trên cả VI và EN (không vẽ bản đồ giờ Ngọ giả)."""
    la = {"birth_date": "1995-08-08", "birth_time": "12:00", "gender": "nam", "do_tin_gio": "unknown", "noi_sinh": "can-tho"}
    rv = client.post("/v1/tuvi/ban-do", json={"la_so": la}, headers={"x-ngon-ngu": "vi"})
    re_ = client.post("/v1/tuvi/ban-do", json={"la_so": la}, headers={"x-ngon-ngu": "en"})
    assert rv.status_code == 422 and re_.status_code == 422
    assert dr.loi_en(re_.json(), {"la_so": la}) == []


def test_chuoi_chuyen_ky_2_chang_va_sql_kiem_chung():
    """Chuỗi 2 chặng `chuoi_chuyen_ky` tất định, đúng toạ độ A -> B -> C và qua bộ kiểm SQL `kiem_chung_ma_hop_le`."""
    tong = 0
    for la in BA_LA_MAU:
        bd = client.post("/v1/tuvi/ban-do", json={"la_so": la, "ngay_xem": XEM.isoformat()}).json()
        for ch in bd["duong_bay"]["chuoi_chuyen_ky"]:
            tong += 1
            assert ch["loai"] in ("ky_chuyen_ky", "loc_chuyen_ky")
            assert ch["phai"] == "luong_phai_phi_tinh"
            assert re.fullmatch(r"ds\.duong_bay\.(kck|lck)\.[a-z0-9_+]+", ch["ma_mau"])
            assert len(ch["ma_mau"]) <= 60
            assert kcm._hop_le("doi_song", ch["ma_mau"], ch["phai"]), ch
            assert ch["tu"] in MA_12 and ch["qua"] in MA_12 and ch["den"] in MA_12
            assert ch["tu"] != ch["qua"] and ch["qua"] != ch["den"]
            assert ch["tieu_de"] and ch["nghia"] and ch["can_cu"]
    assert tong > 0


def test_song_ngu_vi_en_khung_va_sach():
    """Đối xứng khung dữ kiện VI ↔ EN 100%, 0 dấu Việt lọt sang EN, 0 `{slot}`, đủ `ten_hien`."""
    mau = (
        *BA_LA_MAU,
        {"birth_date": "2014-05-15", "birth_time": "09:30", "gender": "nam", "noi_sinh": "ha-noi"},
        {"birth_date": "1995-08-20", "birth_time": "10:30", "gender": "nu", "calendar_type": "am", "am_nhuan": True, "noi_sinh": "ha-noi"},
        {"birth_date": "1992-03-15", "birth_time": "07:20", "gender": "nam", "vung": "abroad", "noi_sinh": "nuoc_ngoai", "mui_gio": "us-san_jose"},
    )
    for la in mau:
        body = {"la_so": la, "ngay_xem": XEM.isoformat()}
        rv = client.post("/v1/tuvi/ban-do", json=body, headers={"x-ngon-ngu": "vi"})
        re_ = client.post("/v1/tuvi/ban-do", json=body, headers={"x-ngon-ngu": "en"})
        assert rv.status_code == 200 and re_.status_code == 200
        dv, de = rv.json(), re_.json()
        assert "ten_hien" not in dv and "ten_hien" in de
        assert dr.loi_en(de, body) == [], (la["birth_date"], dr.loi_en(de, body))
        assert dr.khung(dv) == dr.khung(de), la["birth_date"]


def test_khong_cum_cam_vi_va_en():
    """Toàn bộ chuỗi trả về sạch `cum_cam_chung()` (VI) và `cum_cam_en` (EN)."""
    cam_vi = kh.cum_cam_chung()
    cam_en = [re.compile(p, re.I) for p in (nap.doc("thuat_ngu_en.json").get("cum_cam_en") or [])]

    for la in (BA_LA_MAU[0], {"birth_date": "2014-05-15", "birth_time": "09:30", "gender": "nam", "noi_sinh": "ha-noi"}):
        body = {"la_so": la, "ngay_xem": XEM.isoformat()}
        dv = client.post("/v1/tuvi/ban-do", json=body, headers={"x-ngon-ngu": "vi"}).json()
        de = client.post("/v1/tuvi/ban-do", json=body, headers={"x-ngon-ngu": "en"}).json()

        for s in _moi_chuoi(dv):
            hit = kb_ds.tim_cum_cam(s, cam_vi)
            assert not hit, (hit, s)
            assert not TU_DOA.search(s), s

        for s in _moi_chuoi(de, bo_qua_khoa={"ten_hien"}):
            for rx in cam_en:
                assert not rx.search(s), (rx.pattern, s)


def test_60_la_golden_chuoi_chuyen_ky_qua_sql():
    """Trên đủ 60 lá golden `lasotuvi_60.json`, mọi mã `chuoi_chuyen_ky` đều hợp lệ với hàm SQL `kiem_chung_ma_hop_le`."""
    from app.luangiai import tuvi_ban_do as tvbd

    tong = 0
    for ca in kcm._G60:
        sinh = {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}
        kq = tvbd.lap(sinh, sinh["ngay"], XEM)
        assert len(kq["o"]) == 12
        for ch in kq["duong_bay"]["chuoi_chuyen_ky"]:
            tong += 1
            assert kcm._hop_le("doi_song", ch["ma_mau"], ch["phai"]), ch
    assert tong >= 60


# --------------------------------------------------------------------------- review 2026-11-26: bản đồ không nói ngược
_NHIEU_LA = [
    {"birth_date": f"{y}-{m:02d}-{d:02d}", "birth_time": t, "gender": g, "noi_sinh": "ha-noi"}
    for (y, m, d, t, g) in (
        (1942, 3, 8, "06:00", "nu"), (1931, 11, 2, "14:20", "nam"), (1955, 7, 19, "23:40", "nam"),
        (1968, 2, 1, "09:15", "nu"), (1975, 12, 30, "17:05", "nam"), (1983, 6, 6, "03:30", "nu"),
        (1990, 1, 26, "23:30", "nam"), (1995, 9, 9, "11:11", "nu"), (2001, 4, 4, "20:00", "nam"),
        (2012, 8, 15, "07:45", "nu"), (2024, 2, 10, "10:00", "nam"), (1988, 10, 24, "08:30", "nam"),
    )
]
_TRE_CAM = re.compile(r"đồng nghiệp|kinh doanh|sếp|vợ chồng|hôn nhân|bạn đời|đầu tư|tài chính", re.I)


@pytest.mark.parametrize("la", _NHIEU_LA, ids=lambda la: la["birth_date"])
def test_ban_do_khong_noi_nguoc_muc_va_khoa_dung(la):
    r = client.post("/v1/tuvi/ban-do", json={"la_so": la, "ngay_xem": XEM.isoformat()})
    assert r.status_code == 200, r.text
    bd = r.json()
    cat_cau = nap.doc("tuvi_ban_do_kb.json")["mau"]["la_gi"]
    for o in bd["o"]:
        noi = " ".join(o["la_gi"])
        mau_cat = cat_cau["cat"].split("{ngan}")[1][:25]
        mau_sat = cat_cau["sat"].split("{ngan}")[1][:25]
        if o["muc"] == "can_chu_dong":
            assert mau_cat not in noi, (la, o["ma"], noi)          # không khen "dễ gặp người hỗ trợ" ở cung Cần lưu ý
        if o["muc"] == "thuan":
            assert mau_sat not in noi, (la, o["ma"], noi)
        if o["ma"] == "tat_ach":
            assert cat_cau["suc_khoe_mien_tru"] in o["la_gi"]       # SK-1: luôn kèm câu không thay lời bác sĩ
        if not bd["nguoi_lon"]:
            assert not _TRE_CAM.search(noi), (la, o["ma"], noi)
    assert all(not n.get("chi_tiet") for n in bd["thoi_gian"]["nam"])
    for n in bd["thoi_gian"]["nam"]:
        if n["nam"] > bd["thoi_gian"]["nam_xem"]:
            assert not ({"y", "nen_tranh", "nen_lam", "mang"} & set(n)), n   # SAO-2: năm khoá chỉ mức
    assert all(x["ma"] != "truc_loc_ky" for x in bd["noi_bat"])
    if not bd["nguoi_lon"]:
        assert bd["vai_doc"] == "cha_me" and bd.get("loi_vai_doc")
        assert bd["duong_bay"]["chuoi_chuyen_ky"] == []
