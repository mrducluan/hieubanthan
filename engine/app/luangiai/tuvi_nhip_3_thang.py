# -*- coding: utf-8 -*-
"""TV-V2 — RULES "Nhịp 3 tháng tới": tháng âm hiện tại + 2 tháng sau (có thể vắt sang năm âm sau).

Dùng lại lưu nguyệt (`luangiai.tuvi_luu_nguyet.lap_nam`, theo phái người dùng chọn — không tính lại cung tháng)
và tứ hoá lưu niên (`calc.tuvi_an_sao.van_han`). Không gọi LLM, không lưu.

Luật công khai (mỗi tháng):
- chong_ky            Kỵ tháng cùng trục (đích hoặc xung) với Kỵ năm                    → cần thận trọng
- ky_xung_cung_chinh  Kỵ tháng xung Mệnh / Tài Bạch / Quan Lộc                          → cần thận trọng
- loc_nhap_cung_chinh Lộc tháng vào Mệnh / Tài Bạch / Quan Lộc / Điền Trạch            → thuận
- song_loc            Lộc tháng và Lộc năm cùng cung                                    → thuận
- khoa_giai           Khoa tháng vào cung đang chồng Kỵ                                 → thêm lý do, không đổi mức
Có lý do "cần thận trọng" → can_than; không thì có lý do "thuận" → thuan; còn lại binh.
Ưu tiên khi mâu thuẫn: đại hạn > lưu niên > tiểu hạn > lưu nguyệt (tháng chỉ tô thêm màu).
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import lunar, tuvi_an_sao as az, tuvi_luu_nguyet as ln
from app.kb import tuvi_phi_hoa_kb as kb
from app.luangiai import tuvi_luu_nguyet as luan_ln
from app.luangiai.tuvi_phi_hoa import CUNG_CHINH, CUNG_LOC, MANG

HOA = ("Lộc", "Quyền", "Khoa", "Kỵ")
NHAN_MUC = {"thuan": "Thuận", "binh": "Bình", "can_than": "Cần thận trọng"}
_LY_DO = {
    "chong_ky": "Hoá Kỵ của tháng ({sao}) rơi vào trục cung {cung}, nơi Hoá Kỵ của năm đã ở hoặc chiếu tới: "
                "chuyện thuộc cung này dễ dồn lại, nên làm chậm và rõ ràng.",
    "ky_xung_cung_chinh": "Hoá Kỵ của tháng ({sao}) chiếu sang cung {cung}: chuyện {mang} cần chăm chút hơn.",
    "loc_nhap_cung_chinh": "Hoá Lộc của tháng ({sao}) vào cung {cung}: {mang} có thêm thuận lợi.",
    "song_loc": "Lộc của tháng và Lộc của năm cùng ở cung {cung}: thuận lợi cộng hưởng cho {mang}.",
    "khoa_giai": "Hoá Khoa của tháng ({sao}) cũng vào cung {cung}: có thêm sự rõ ràng, người hỗ trợ để gỡ dần.",
}
_GOI_Y = {
    "thuan": "Tháng hợp để bắt đầu, đề xuất hoặc mở rộng việc đang ấp ủ; vẫn giữ nhịp đều, không dồn sức một lúc.",
    "binh": "Tháng giữ nhịp: làm tiếp việc đang dở, chăm những thói quen nhỏ, chưa cần thay đổi lớn.",
    "can_than": "Tháng nên làm chậm lại: rà kỹ giấy tờ, tiền bạc, lời hứa; quyết định lớn để thêm thời gian cân nhắc.",
}
_TU_SOI = {
    "thuan": "Điều gì mình muốn bắt đầu nếu có thêm một chút thuận lợi?",
    "binh": "Thói quen nhỏ nào, nếu giữ đều trong tháng này, sẽ giúp mình nhiều nhất?",
    "can_than": "Việc nào mình đang vội mà thật ra có thể chờ thêm vài tuần?",
}
THU_TU_UU_TIEN = ["dai_han", "luu_nien", "tieu_han", "luu_nguyet"]
LUU_Y = ["Mức Thuận / Bình / Cần thận trọng là xu hướng theo luật tứ hoá công khai, không phải lời đoán sự kiện.",
         "Lưu nguyệt có nhiều phái; kết quả theo phái bạn đang chọn trong khung Trường phái.",
         "Không lưu lá số hay kết quả này."]


def xep_muc(thang: dict, nam: dict, xung: dict) -> tuple[str, list[dict]]:
    """`thang`, `nam`: {hoa: cung_goc} của tứ hoá tháng / năm; `xung`: {cung: cung đối diện}.
    → (muc, [{"ma", "sao"?, "cung"}]) theo luật công khai ở đầu module."""
    ly: list[dict] = []
    ky_t, ky_n = thang.get("Kỵ"), nam.get("Kỵ")
    loc_t, loc_n, khoa_t = thang.get("Lộc"), nam.get("Lộc"), thang.get("Khoa")
    chong = bool(ky_t and ky_n and ky_t in (ky_n, xung.get(ky_n)))
    if chong:
        ly.append({"ma": "chong_ky", "hoa": "Kỵ", "cung": ky_t})
    if ky_t and xung.get(ky_t) in CUNG_CHINH:
        ly.append({"ma": "ky_xung_cung_chinh", "hoa": "Kỵ", "cung": xung[ky_t]})
    if chong and khoa_t and khoa_t in (ky_t, ky_n):
        ly.append({"ma": "khoa_giai", "hoa": "Khoa", "cung": khoa_t})
    if loc_t and loc_t in CUNG_LOC:
        ly.append({"ma": "loc_nhap_cung_chinh", "hoa": "Lộc", "cung": loc_t})
    if loc_t and loc_t == loc_n:
        ly.append({"ma": "song_loc", "hoa": "Lộc", "cung": loc_t})
    ma = {x["ma"] for x in ly}
    if ma & {"chong_ky", "ky_xung_cung_chinh"}:
        return "can_than", ly
    if ma & {"loc_nhap_cung_chinh", "song_loc"}:
        return "thuan", ly
    return "binh", ly


def _tz_xem(sinh: dict) -> float:
    return az.TZ_TRUNG if sinh.get("lich", "viet") == "trung" else config.CALENDAR_MERIDIAN_TZ


def _tu_hoa_nam(sinh: dict, nam_am: int, ls: dict) -> dict:
    """Tứ hoá lưu niên (iztro horoscope.yearly.mutagen, qua van_han) đặt lên cung gốc."""
    d, m, y = lunar.lunar_to_solar(1, 7, nam_am, 0, _tz_xem(sinh))        # giữa năm âm, như lap_nam
    vh = az.van_han(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], dt.date(y, m, d),
                    tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                    thang_nhuan=sinh.get("thang_nhuan", "thang_sau"), lich=sinh.get("lich", "viet"))
    can, chi = lunar.can_chi_nam(nam_am)
    ra = []
    for hoa, sao in zip(HOA, vh["luu_nien"]["tu_hoa"]):
        noi = next((c for c in ls["cung"] if sao in [s["ten"] for s in c["chinh_tinh"]] or sao in c["phu_tinh"]),
                   None)
        ra.append({"hoa": hoa, "sao": sao, "cung_goc": noi["ten"] if noi else None})
    return {"nam_am": nam_am, "can_chi": f"{can} {chi}", "tu_hoa": ra}


def _van(nhom: str, ma: str, mac_dinh: dict, **bien) -> str:
    s = kb.nhip(nhom, ma)
    if isinstance(s, dict):
        s = s.get("mo_ta") or s.get("nhan")
    return kb.dien(s if isinstance(s, str) and s.strip() else mac_dinh[ma], **bien)


def lap(sinh: dict, ngay_xem: dt.date, phai: str = ln.MAC_DINH, ls: dict | None = None) -> dict:
    """`sinh` như `luangiai.tuvi_luu_nguyet.lap_nam`. → tháng âm chứa `ngay_xem` + 2 tháng sau."""
    if phai not in ln.PHAI:
        raise ValueError(f"Phái lưu nguyệt không hợp lệ: {phai}")
    from app.hoidap.tuvi import tom_tat          # tránh vòng import

    if ls is None:
        ls = tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN",
                                   tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                                   hoa_linh=sinh.get("hoa_linh", "viet"),
                                   thang_nhuan=sinh.get("thang_nhuan", "thang_sau"), lich=sinh.get("lich", "viet")))
    nam_am = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, _tz_xem(sinh))[2]
    chi = {c["ten"]: lunar.CHI.index(c["chi"]) for c in ls["cung"]}
    xung = {a: next(b for b in chi if chi[b] == (chi[a] + 6) % 12) for a in chi}

    nam = {nam_am: luan_ln.lap_nam(sinh, nam_am, phai, ls=ls)}
    ds = [(nam_am, t) for t in nam[nam_am]["thang"]]
    i = next(k for k, (_, t) in enumerate(ds) if t["tu"] <= ngay_xem <= t["den"])
    if i + 3 > len(ds):
        nam[nam_am + 1] = luan_ln.lap_nam(sinh, nam_am + 1, phai, ls=ls)
        ds += [(nam_am + 1, t) for t in nam[nam_am + 1]["thang"]]
    luu_nien = {n: _tu_hoa_nam(sinh, n, ls) for n in nam}

    def _thang(n: int, t: dict) -> dict:
        th = [{"hoa": x["hoa"], "sao": x["sao"], "cung_goc": x["cung_goc"]} for x in t["tu_hoa_thang"]]
        muc, ly = xep_muc({x["hoa"]: x["cung_goc"] for x in th},
                          {x["hoa"]: x["cung_goc"] for x in luu_nien[n]["tu_hoa"]}, xung)
        sao_t = {x["hoa"]: x["sao"] for x in th}
        ly_do = [{"ma": x["ma"], "noi_dung": _van("ly_do", x["ma"], _LY_DO, sao=sao_t.get(x["hoa"], ""),
                                                   cung=x["cung"], mang=MANG.get(x["cung"], x["cung"]))}
                 for x in ly]
        return {"thang": t["thang"], "nhuan": t["nhuan"], "phan": t["phan"], "nam_am": n, "can_chi": t["can_chi"],
                "tu": t["tu"].isoformat(), "den": t["den"].isoformat(), "cung_goc": t["cung_goc"],
                "chu_de": t["chu_de"], "muc": muc, "nhan_muc": NHAN_MUC[muc], "ly_do": ly_do, "tu_hoa_thang": th,
                "goi_y": _van("goi_y", muc, _GOI_Y), "cau_tu_soi": _van("cau_tu_soi", muc, _TU_SOI)}

    ra = {
        "ngay_xem": ngay_xem.isoformat(), "phai_luu_nguyet": phai,
        "ten_phai_luu_nguyet": ln.PHAI[phai]["ten"],
        "luu_nien": luu_nien[nam_am],
        "thang": [_thang(n, t) for n, t in ds[i:i + 3]],
        "uu_tien": {"thu_tu": THU_TU_UU_TIEN, "ghi_chu": luan_ln.UU_TIEN, "han_nam": nam[nam_am]["han_nam"]},
        "luu_y": list(LUU_Y),
    }
    if nam_am + 1 in nam:
        ra["luu_nien_sau"] = luu_nien[nam_am + 1]
    return ra
