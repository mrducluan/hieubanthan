# -*- coding: utf-8 -*-
"""TV-LN — RULES lưu nguyệt: ghép cung tháng (CALC `calc.tuvi_luu_nguyet`, theo phái người dùng chọn) với lá số
và vận hạn năm. Không gọi LLM. Ưu tiên khi mâu thuẫn: đại hạn > lưu niên > tiểu hạn > lưu nguyệt (CLAUDE.md).

Mỗi tháng trả đủ góc nhìn: cung gốc + chủ đề, chính tinh + độ sáng Nam phái, phụ tinh cát/sát, Tuần/Triệt,
tam phương tứ chính, tứ hoá theo can tháng (nằm ở cung nào, có rơi vào cung tháng/tam phương không), trùng/chiếu
với cung đại hạn – lưu niên – tiểu hạn, và cung tháng theo CẢ 5 phái để người dùng so.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import lunar, tuvi_an_sao as az, tuvi_luu_nguyet as ln
from app.kb import tuvi_kb as kb

THU_TU_HOA = ["Lộc", "Quyền", "Khoa", "Kỵ"]
_GIO = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
UU_TIEN = "Đại hạn > lưu niên > tiểu hạn > lưu nguyệt — tháng chỉ tô thêm màu cho bức tranh của năm và của vận."


def _tz_am(sinh: dict) -> float:
    return az.TZ_TRUNG if sinh.get("lich", "viet") == "trung" else sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ)


def _nhom(p: str) -> str | None:
    m = kb.phu_tinh(p)
    return m["nhom"] if m else None


def lap_nam(sinh: dict, nam_am: int, phai: str = ln.MAC_DINH, ls: dict | None = None) -> dict:
    """Lưu nguyệt cả năm âm `nam_am`. `sinh` = {"ngay": date dương (kinh tuyến UTC+7), "ti": 0..12, "gioi_tinh",
    tuỳ chọn "tz_lich", "hoa_linh", "thang_nhuan", "lich"} — như hoidap.tuvi.tra_loi. `ls` = tom_tat lá số nếu đã có."""
    if phai not in ln.PHAI:
        raise ValueError(f"Phái lưu nguyệt không hợp lệ: {phai}")
    from app.hoidap.tuvi import tom_tat          # tránh vòng import (hoidap.tuvi dùng module này)

    tn = sinh.get("thang_nhuan", "thang_sau")
    lich = sinh.get("lich", "viet")
    tz_lich = sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ)
    if ls is None:
        ls = tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN", tz_lich=tz_lich,
                                   hoa_linh=sinh.get("hoa_linh", "viet"), thang_nhuan=tn, lich=lich))
    tz_xem = az.TZ_TRUNG if lich == "trung" else config.CALENDAR_MERIDIAN_TZ
    d, m, y = lunar.lunar_to_solar(1, 7, nam_am, 0, tz_xem)           # giữa năm âm: chắc chắn thuộc năm đó
    vh = az.van_han(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], dt.date(y, m, d), tz_lich=tz_lich,
                    thang_nhuan=tn, lich=lich)

    sd = sinh["ngay"]
    ld, lm, _, leap = lunar.solar_to_lunar(sd.day, sd.month, sd.year, _tz_am(sinh))
    thang_sinh = ln.thang_tinh(lm, ld, bool(leap), tn)
    chi_gio = sinh["ti"] % 12                                        # Tý muộn (12) = giờ Tý
    chi_nam = ln.CHI.index(lunar.can_chi_nam(nam_am)[1])
    chi_th = (vh["tieu_han"]["chi_so"] + 2) % 12                       # chỉ số iztro: 0 = Dần

    theo_chi = {c["chi"]: c for c in ls["cung"]}
    han_chi = {lop: ln.CHI[(vh[lop]["chi_so"] + 2) % 12] for lop in ("dai_han", "luu_nien", "tieu_han")}

    def _cung(chi: int) -> dict:
        return theo_chi[ln.CHI[chi]]

    def _tam_phuong(chi: int) -> list[int]:
        return [chi, (chi + 4) % 12, (chi + 8) % 12, (chi + 6) % 12]

    def _noi_sao(sao: str) -> dict | None:
        return next((c for c in ls["cung"] if sao in [s["ten"] for s in c["chinh_tinh"]] or sao in c["phu_tinh"]),
                    None)

    def _thang(t: dict) -> dict:
        chi = ln.cung_luu_nguyet(phai, chi_nam, chi_th, thang_sinh, chi_gio, t["thang_tinh"])
        c = _cung(chi)
        tp = _tam_phuong(chi)
        tp_chi = [ln.CHI[x] for x in tp]
        cat = [p for p in c["phu_tinh"] if _nhom(p) in ("Lục cát tinh", "Lộc")]
        sat = [p for p in c["phu_tinh"] if _nhom(p) == "Lục sát tinh"]
        ky_goc = [x["sao"] for x in ls["tu_hoa"] if x["cung"] == c["ten"] and x["hoa"] == "Kỵ"]
        th = []
        for hoa, sao in zip(THU_TU_HOA, ln.tu_hoa(t["can"])):
            noi = _noi_sao(sao)
            th.append({"hoa": hoa, "sao": sao, "cung_goc": noi["ten"] if noi else None,
                       "vao_cung_thang": bool(noi) and noi["chi"] == c["chi"],
                       "vao_tam_phuong": bool(noi) and noi["chi"] in tp_chi})
        loc_t = any(x["hoa"] == "Lộc" and x["vao_cung_thang"] for x in th)
        ky_t = any(x["hoa"] == "Kỵ" and x["vao_cung_thang"] for x in th)
        # Điểm xu hướng (công khai, như lớp hạn năm): cát + Lộc tháng − sát − Kỵ gốc − Kỵ tháng, chỉ trong cung tháng.
        diem = len(cat) + loc_t - len(sat) - len(ky_goc) - ky_t
        trung = [lop for lop, ch in han_chi.items() if ch == c["chi"]]
        chieu = [lop for lop, ch in han_chi.items() if ch in tp_chi and lop not in trung]
        return {
            "thang": t["thang"], "nhuan": t["nhuan"], "phan": t["phan"], "thang_tinh": t["thang_tinh"],
            "ngay_am": list(t["ngay_am"]), "tu": t["tu"], "den": t["den"], "can_chi": t["can_chi"],
            "chi": c["chi"], "cung_goc": c["ten"], "chu_de": kb.chu_de_han(c["ten"]),
            "chinh_tinh": [{"ten": s["ten"], "do_sang": s["do_sang"], "tu_hoa_goc": s["tu_hoa"]}
                           for s in c["chinh_tinh"]],
            "phu_tinh": {"cat": cat, "sat": sat},
            "tuan_triet": [p for p in ("Tuần Không", "Triệt Lộ") if p in c["phu_tinh"]],
            "tam_phuong": [theo_chi[x]["ten"] for x in tp_chi],
            "tu_hoa_thang": th,
            "trung": trung, "chieu": chieu,
            "xu_huong": {"cat": cat + (["Hoá Lộc tháng"] if loc_t else []),
                         "sat": sat + [f"{s} hoá Kỵ (gốc)" for s in ky_goc] + (["Hoá Kỵ tháng"] if ky_t else []),
                         "ket": "thuận hơn" if diem > 0 else "nhiều thử thách hơn" if diem < 0 else "cân bằng"},
        }

    cac = ln.cac_thang(nam_am, tz_xem, tn)
    so_sanh = {}
    for k, meta in ln.PHAI.items():
        g = ln.cung_thang_gieng(k, chi_nam, chi_th, thang_sinh, chi_gio)
        so_sanh[k] = {"ten": meta["ten"], "thang_gieng": {"chi": ln.CHI[g], "cung_goc": _cung(g)["ten"]},
                      "theo_thang": [_cung(ln.cung_luu_nguyet(k, chi_nam, chi_th, thang_sinh, chi_gio,
                                                                t["thang_tinh"]))["ten"] for t in cac]}
    can, chi_n = lunar.can_chi_nam(nam_am)
    return {
        "nam_am": nam_am, "can_chi_nam": f"{can} {chi_n}", "phai": phai, **{f"phai_{k}": v for k, v in
                                                                             ln.PHAI[phai].items()},
        "thang_sinh": thang_sinh, "gio_sinh": _GIO[chi_gio], "thang_nhuan": tn,
        "han_nam": {lop: {"chi": han_chi[lop], "cung_goc": theo_chi[han_chi[lop]]["ten"]}
                    for lop in ("dai_han", "luu_nien", "tieu_han")},
        "tuoi_mu": vh["tuoi_mu"],
        "thang": [_thang(t) for t in cac],
        "so_sanh_phai": so_sanh,
        "uu_tien": UU_TIEN,
        "luu_y": kb.luu_y("luu_nguyet") or "",
    }


def thang_cua(nam: dict, thang: int, nhuan: bool = False) -> dict | None:
    """Tháng âm `thang` trong kết quả `lap_nam` (tháng nhuận tách hai nửa → lấy nửa đầu)."""
    return next((t for t in nam["thang"] if t["thang"] == thang and t["nhuan"] == nhuan), None)
