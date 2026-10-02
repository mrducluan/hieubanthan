# -*- coding: utf-8 -*-
"""SPEC-005 — an sao tử vi đầy đủ qua iztro chạy cục bộ (Node subprocess).

Quyết định 2026-08-15: Python engine gọi iztro qua Node, KHÔNG viết lại logic an
sao. Quyết định 2026-09-30: ghim iztro bản đã sinh golden — 2.6.0 (2.5.8/2.6.0/
2.6.1 cho kết quả trùng khít 8 lá golden; 2.6.0 là bản mới nhất trên npm lúc
commit golden c173a95). Nâng bản = sinh lại golden + tăng ENGINE_VERSION.

Tầng CALC: tất định (cùng đầu vào → cùng lá số), không LLM, không DB, không mạng.
Giờ Tý tử vi theo iztro: 23:00–23:59 là giờ Tý của NGÀY HÔM SAU (time_index 12).
"""
from __future__ import annotations

import datetime as dt
import json
import os
import subprocess
from functools import lru_cache
from pathlib import Path

from app import config
from app.calc import lunar, tuvi_hoa_linh_vn

THU_MUC = Path(__file__).resolve().parents[2] / "ziwei"
SCRIPT = THU_MUC / "an_sao.mjs"
TIMEOUT_GIAY = 20


class AnSaoLoi(RuntimeError):
    """Không chạy được iztro (thiếu Node / thiếu node_modules / lỗi đầu vào)."""


def time_index(gio: int, phut: int) -> int:
    """Giờ đồng hồ (đã quy về kinh tuyến lịch) → chỉ số giờ của iztro.

    0 = Tý sớm 00:00–00:59 · 1 = Sửu 01–02:59 · … · 11 = Hợi 21–22:59 · 12 = Tý muộn 23:xx.
    """
    if not (0 <= gio <= 23 and 0 <= phut <= 59):
        raise ValueError("giờ/phút không hợp lệ")
    if gio == 0:
        return 0
    if gio == 23:
        return 12
    return (gio + 1) // 2


def _node() -> str:
    return os.environ.get("NODE_BIN", "node")


@lru_cache(maxsize=1)
def phien_ban_iztro() -> str:
    p = THU_MUC / "node_modules" / "iztro" / "package.json"
    if not p.exists():
        raise AnSaoLoi("Chưa cài iztro: chạy `npm ci --prefix engine/ziwei`.")
    return json.loads(p.read_text(encoding="utf-8"))["version"]


def _am(x: dt.date, tz_lich: float) -> str:
    """Âm lịch VIỆT NAM (Hồ Ngọc Đức) của ngày dương `x` theo múi giờ lịch `tz_lich`, dạng JSON cho an_sao.mjs."""
    ng, th, na, nh = lunar.solar_to_lunar(x.day, x.month, x.year, tz_lich)
    return json.dumps({"nam": na, "thang": th, "ngay": ng, "nhuan": bool(nh),
                       "so_ngay": lunar.so_ngay_thang(th, na, nh, tz_lich)})


@lru_cache(maxsize=512)
def _chay(ngay: str, ti: int, gioi_tinh: str, ngon_ngu: str, ngay_xem: str = "",
          am: str = "", am_xem: str = "", fix_leap: bool = True) -> str:
    phien_ban_iztro()   # kiểm tra đã cài
    try:
        kq = subprocess.run([_node(), str(SCRIPT)], cwd=THU_MUC, capture_output=True, text=True,
                            timeout=TIMEOUT_GIAY, check=False,
                            input=json.dumps({"ngay": ngay, "time_index": ti,
                                              "gioi_tinh": gioi_tinh, "ngon_ngu": ngon_ngu,
                                              **({"ngay_xem": ngay_xem} if ngay_xem else {}),
                                              **({"am": json.loads(am)} if am else {}),
                                              **({"am_xem": json.loads(am_xem)} if am_xem else {}),
                                              "fix_leap": fix_leap}))
    except FileNotFoundError as e:
        raise AnSaoLoi("Không tìm thấy Node.js (đặt NODE_BIN nếu không ở PATH).") from e
    except subprocess.TimeoutExpired as e:
        raise AnSaoLoi("iztro chạy quá thời gian.") from e
    if kq.returncode != 0:
        raise AnSaoLoi("iztro lỗi: " + kq.stderr.strip()[:300])
    return kq.stdout


THANG_NHUAN = ("thang_sau", "thang_chinh")   # nửa sau tháng nhuận: tính sang tháng sau (iztro) / như tháng chính
HOA_LINH = ("viet", "trung")                 # lối Việt (Nam phái) / Trung Châu (iztro)


_TEN_HOA_LINH = {"Hỏa Tinh": "Hỏa Tinh", "火星": "Hỏa Tinh", "Linh Tinh": "Linh Tinh", "铃星": "Linh Tinh"}


def _dat_hoa_linh_viet(la: dict, ngay: dt.date, ti: int, gioi_tinh: str, tz_lich: float) -> None:
    """Chuyển Hoả Tinh, Linh Tinh của iztro sang vị trí lối Việt (tuvi_hoa_linh_vn)."""
    if ti == 12:                                   # Tý muộn: iztro tính sang ngày hôm sau
        ngay = ngay + dt.timedelta(days=1)
    can, chi = lunar.can_chi_nam(lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, tz_lich)[2])
    dich = dict(zip(("Hỏa Tinh", "Linh Tinh"), tuvi_hoa_linh_vn.vi_tri(can, chi, 0 if ti == 12 else ti, gioi_tinh)))
    sao = {}
    for p in la["palaces"]:
        for s in [x for x in p["minorStars"] if x["name"] in _TEN_HOA_LINH]:
            p["minorStars"].remove(s)
            sao[_TEN_HOA_LINH[s["name"]]] = {**s, "brightness": ""}   # độ sáng phái Trung không còn đúng cung mới
    for p in la["palaces"]:
        for ten, s in sao.items():
            if p["earthlyBranch"] == dich[ten] or p["earthlyBranch"] == _CHI_HAN.get(dich[ten]):
                p["minorStars"].append(s)


_CHI_HAN = dict(zip(tuvi_hoa_linh_vn.CHI, "子丑寅卯辰巳午未申酉戌亥"))


def an_sao_tho(ngay_duong: dt.date, ti: int, gioi_tinh: str, ngon_ngu: str = "vi-VN",
               tz_lich: float = config.CALENDAR_MERIDIAN_TZ, hoa_linh: str = "viet",
               thang_nhuan: str = "thang_sau") -> dict:
    """Lá số thô từ iztro. `ngay_duong` là ngày dương theo kinh tuyến lịch UTC+7; ngày âm dùng lịch VIỆT NAM
    theo `tz_lich` (7, hoặc 8 cho miền Nam 1960–1975) chứ không để iztro đổi theo lịch Trung Quốc."""
    if not 0 <= ti <= 12:
        raise ValueError("time_index phải trong 0..12")
    if gioi_tinh not in ("nam", "nu"):
        raise ValueError("gioi_tinh phải là 'nam' hoặc 'nu'")
    if hoa_linh not in HOA_LINH or thang_nhuan not in THANG_NHUAN:
        raise ValueError("hoa_linh / thang_nhuan không hợp lệ")
    la = json.loads(_chay(_d(ngay_duong), ti, gioi_tinh, ngon_ngu, am=_am(ngay_duong, tz_lich),
                          fix_leap=thang_nhuan == "thang_sau"))
    if hoa_linh == "viet":
        _dat_hoa_linh_viet(la, ngay_duong, ti, gioi_tinh, tz_lich)
    return la


def _d(x: dt.date) -> str:
    return f"{x.year}-{x.month}-{x.day}"


def van_han(ngay_duong: dt.date, ti: int, gioi_tinh: str, ngay_xem: dt.date,
            chi_tiet: bool = False, tz_lich: float = config.CALENDAR_MERIDIAN_TZ,
            thang_nhuan: str = "thang_sau") -> dict:
    """Đại hạn / tiểu hạn / lưu niên tại `ngay_xem` (iztro astro.horoscope, tên tiếng Việt).

    `chi_so` là vị trí cung trong mảng 12 cung của lá số (0 = cung Dần); `cung_goc` là tên
    cung của lá số gốc tại vị trí đó. Tuổi là tuổi mụ (đổi vào Tết âm lịch).
    """
    if not 0 <= ti <= 12:
        raise ValueError("time_index phải trong 0..12")
    if gioi_tinh not in ("nam", "nu"):
        raise ValueError("gioi_tinh phải là 'nam' hoặc 'nu'")
    la = json.loads(_chay(_d(ngay_duong), ti, gioi_tinh, "vi-VN", _d(ngay_xem),
                          am=_am(ngay_duong, tz_lich), am_xem=_am(ngay_xem, config.CALENDAR_MERIDIAN_TZ),
                          fix_leap=thang_nhuan == "thang_sau"))
    h, cung = la["horoscope"], la["palaces"]

    def _lop(o: dict, tu_hoa: bool = True) -> dict:
        m = {"chi_so": o["index"], "can": o["heavenlyStem"], "chi": o["earthlyBranch"]}
        if tu_hoa:
            m["tu_hoa"] = o["mutagen"]
        if tu_hoa and chi_tiet:
            # Tên cung lưu + sao lưu đặt theo vị trí 12 cung của lá số gốc (để vẽ lớp phủ).
            m["ten_cung"] = o.get("palaceNames", [])
            m["sao"] = [[x["name"] for x in ds] for ds in o.get("stars", [])]
        return m

    dh = cung[h["decadal"]["index"]]["decadal"]["range"]
    return {
        "tuoi_mu": h["age"]["nominalAge"],
        "dai_han": {**_lop(h["decadal"]), "tu_tuoi": dh[0], "den_tuoi": dh[1],
                    "cung_goc": cung[h["decadal"]["index"]]["name"]},
        "tieu_han": {**_lop(h["age"], False), "cung_goc": cung[h["age"]["index"]]["name"]},
        "luu_nien": {**_lop(h["yearly"]), "cung_goc": cung[h["yearly"]["index"]]["name"]},
    }
