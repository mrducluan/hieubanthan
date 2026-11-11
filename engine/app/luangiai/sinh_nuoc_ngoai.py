# -*- coding: utf-8 -*-
"""Ý3 (2026-11-09) — cụm trang "Sinh ở nước ngoài" cho người Việt xa quê: mỗi nước một trang DỮ KIỆN TÍNH (RULES chỉ ghép
CALC có sẵn, không LLM, không ghi tay):
  - từng thành phố: múi giờ chuẩn năm xem, có giờ mùa hè không + mốc đổi giờ trong năm (zoneinfo → `calc.mui_gio`),
    lệch giờ mặt trời trung bình theo kinh độ, Nam bán cầu ngoài chí tuyến → công tắc "Mùa nơi sinh";
  - lịch sử giờ mùa hè theo vùng ở vài năm sinh mẫu (quy tắc đổi giờ của tzdata — Nga 2011/2014, Mỹ 2007, Đức 1980…);
  - ngày lịch âm Việt (UTC+7) và lịch Trung Quốc (UTC+8) lệch nhau trong năm (`calc.lunar`, Hồ Ngọc Đức).
Lời giải thích đời thường ở KB `sinh_nuoc_ngoai_kb.json`; mẫu câu có {biến} do dữ kiện điền."""
from __future__ import annotations

from app import ngon_ngu

import datetime as dt
from functools import lru_cache
from zoneinfo import ZoneInfo

from app import config
from app.calc import lunar, mui_gio
from app.kb import nap

KB = "sinh_nuoc_ngoai_kb.json"
# Thứ tự hiển thị = nước đông người Việt (QTE-1 mục 2) — chỉ nước có trong bảng múi giờ (test khoá).
MA_NUOC: tuple[str, ...] = ("us", "au", "ca", "de", "jp", "kr", "tw", "fr", "cz", "gb", "pl", "ru", "th", "la", "kh")
NAM_MAU: tuple[int, ...] = (1975, 1985, 1995, 2005, 2015)
_UTC = dt.timezone.utc


def _kb() -> dict:
    return nap.doc(KB)


def _nhan_utc(gio: float) -> str:
    dau = "−" if gio < 0 else "+"
    a = abs(gio)
    h, m = int(a), int(round((a - int(a)) * 60))
    return f"UTC{dau}{h}" + (f":{m:02d}" if m else "")


def _ten_ngan(t: dict) -> str:
    """"Sydney (New South Wales)" → "Sydney" cho câu văn; bảng vẫn hiện tên đầy đủ."""
    return str(t["ten"]).split(" (")[0]


def _dmy(d: dt.date) -> str:
    return f"{d.day:02d}/{d.month:02d}/{d.year}"


@ngon_ngu.lru(maxsize=512)
def doi_gio(zone: str, nam: int) -> tuple[dict, ...]:
    """Các mốc đổi giờ trong năm dương `nam` của vùng: [{ngay, gio, sang}] — `gio` là giờ ĐỒNG HỒ lúc đổi theo nếp cũ
    (Mỹ "02:00" cả hai chiều, Sydney vào mùa hè 02:00 / ra 03:00), `sang` = "mùa hè" | "giờ chuẩn". Quét từng ngày theo
    UTC rồi tinh tới giờ (zoneinfo quyết định — engine không chép bảng đổi giờ)."""
    tz = ZoneInfo(mui_gio.zone_tu(zone))
    ra: list[dict] = []
    bat_dau = dt.datetime(nam, 1, 1, tzinfo=_UTC)
    truoc = bat_dau.astimezone(tz)
    t = bat_dau
    while t.year == nam:
        t_sau = t + dt.timedelta(days=1)
        sau = t_sau.astimezone(tz)
        if sau.utcoffset() != truoc.utcoffset():
            # tinh tới giờ trong ngày đó
            u = t
            cu = truoc
            for _ in range(25):
                u2 = u + dt.timedelta(hours=1)
                moi = u2.astimezone(tz)
                if moi.utcoffset() != cu.utcoffset():
                    moc = (u2 + cu.utcoffset()).replace(tzinfo=None)   # giờ đồng hồ theo nếp cũ
                    ra.append({"ngay": moc.date().isoformat(), "gio": moc.strftime("%H:%M"),
                               "sang": "mùa hè" if (moi.dst() or dt.timedelta(0)) > dt.timedelta(0) else "giờ chuẩn"})
                    break
                u, cu = u2, moi
        t, truoc = t_sau, sau
    return tuple(ra)


def _thanh_pho(t: dict, nam: int) -> dict:
    chuan = mui_gio.utc_chuan_nam(t["zone"], nam)
    moc = [dict(m) for m in doi_gio(t["zone"], nam)]
    lech = mui_gio.lech_mat_troi_phut(t.get("kinh_do"), chuan)
    return {
        "ma": t["ma"], "ten": t["ten"], "ten_en": t.get("ten_en"), "zone": t["zone"],
        "utc_chuan": chuan, "nhan_utc": _nhan_utc(chuan),
        "gio_mua_he": bool(moc), "doi_gio": moc,
        "kinh_do": t.get("kinh_do"), "vi_do": t.get("vi_do"),
        "lech_mat_troi_phut": lech,
        "canh_bao_mat_troi": lech is not None and abs(lech) >= mui_gio.NGUONG_CANH_BAO_PHUT,
        "nam_ban_cau": t.get("vi_do") is not None and t["vi_do"] < 0,
        "nam_ban_cau_kha_dung": mui_gio.nam_ban_cau_kha_dung(t.get("vi_do")),
    }


def _lich_su(zones: list[str], nam: int) -> list[dict]:
    ra = []
    for z in zones:
        cac_nam = []
        for n in (*NAM_MAU, nam):
            moc = doi_gio(z, n)
            cac_nam.append({"nam": n, "co": bool(moc), "utc_chuan": mui_gio.utc_chuan_nam(z, n),
                            "moc": [f"{_dmy(dt.date.fromisoformat(m['ngay']))} {m['gio']} → {m['sang']}" for m in moc]})
        ra.append({"zone": z, "cac_nam": cac_nam})
    return ra


@ngon_ngu.lru(maxsize=16)
def lich_am_lech(nam: int) -> dict:
    """Ngày dương trong năm `nam` mà âm lịch Việt (UTC+7) và lịch Trung Quốc (UTC+8) cho ngày âm khác nhau, + Tết hai lịch."""
    tz_v, tz_t = config.TZ_LICH_AM["viet"], config.TZ_LICH_AM["trung"]
    ngay_lech = []
    d = dt.date(nam, 1, 1)
    while d.year == nam:
        v = lunar.solar_to_lunar(d.day, d.month, d.year, tz_v)
        t = lunar.solar_to_lunar(d.day, d.month, d.year, tz_t)
        if v != t:
            ngay_lech.append({"ngay": d.isoformat(),
                              "am_viet": f"{v[0]}/{v[1]}{' nhuận' if v[3] else ''}",
                              "am_trung": f"{t[0]}/{t[1]}{' nhuận' if t[3] else ''}"})
        d += dt.timedelta(days=1)
    tv = lunar.lunar_to_solar(1, 1, nam, 0, tz_v)
    tt = lunar.lunar_to_solar(1, 1, nam, 0, tz_t)
    return {"nam": nam, "tet_viet": dt.date(tv[2], tv[1], tv[0]).isoformat(), "tet_trung": dt.date(tt[2], tt[1], tt[0]).isoformat(),
            "ngay_lech": ngay_lech}


def _nuoc_goc(ma: str) -> dict | None:
    if ma not in MA_NUOC:
        return None
    return next((n for n in mui_gio.danh_sach() if n["ma"] == ma), None)


def muc_luc(nam: int | None = None) -> list[dict]:
    return list(_muc_luc(nam or config.hom_nay_vn().year))


@ngon_ngu.lru(maxsize=8)
def _muc_luc(nam: int) -> tuple[dict, ...]:
    ra = []
    for ma in MA_NUOC:
        n = _nuoc_goc(ma)
        if not n:
            continue
        tp = [_thanh_pho(t, nam) for t in n["thanh_pho"]]
        utc = sorted({t["utc_chuan"] for t in tp})
        ra.append({"ma": ma, "ten": n["ten"], "ten_en": n.get("ten_en"), "so_thanh_pho": len(tp),
                   "mui_gio": [_nhan_utc(u) for u in utc], "gio_mua_he": any(t["gio_mua_he"] for t in tp),
                   "nam_ban_cau": any(t["nam_ban_cau"] for t in tp),
                   "cong_tac": {"gio_mat_troi": any(t["canh_bao_mat_troi"] for t in tp),
                                "mua_noi_sinh": any(t["nam_ban_cau_kha_dung"] for t in tp)}})
    return tuple(ra)


def _dien(mau: str, **b) -> str:
    for k, v in b.items():
        mau = mau.replace("{" + k + "}", str(v))
    return mau


def _lech_ds(ds: list[dict]) -> str:
    return ", ".join(f"{_dmy(dt.date.fromisoformat(x['ngay']))} (Việt {x['am_viet']} · Trung {x['am_trung']})" for x in ds[:6]) \
        + ("…" if len(ds) > 6 else "")


def nuoc(ma: str, nam: int | None = None) -> dict | None:
    n = _nuoc_goc(ma)
    if not n:
        return None
    nam = nam or config.hom_nay_vn().year
    kb = _kb()
    mau = kb["mau"]
    ten = n["ten"]
    tp = [_thanh_pho(t, nam) for t in n["thanh_pho"]]
    co_toa_do = [t for t in tp if t["lech_mat_troi_phut"] is not None]
    utc = sorted({t["utc_chuan"] for t in tp})
    zones = list(dict.fromkeys(t["zone"] for t in tp))
    co_he, khong_he = [t for t in tp if t["gio_mua_he"]], [t for t in tp if not t["gio_mua_he"]]
    canh_bao = [t for t in co_toa_do if t["canh_bao_mat_troi"]]
    mua = [t for t in tp if t["nam_ban_cau_kha_dung"]]
    la = lich_am_lech(nam)

    cau_mui_gio = (_dien(mau["mui_gio_mot"], ten=ten, utc=_nhan_utc(utc[0])) if len(utc) == 1
                   else _dien(mau["mui_gio_nhieu"], ten=ten, so=len(utc), ds=", ".join(_nhan_utc(u) for u in utc)))
    if co_he and khong_he:
        cau_he = _dien(mau["gio_mua_he_mot_phan"], ds_co=", ".join(_ten_ngan(t) for t in co_he[:4]), ds_khong=", ".join(_ten_ngan(t) for t in khong_he[:4]))
    elif co_he:
        cau_he = mau["gio_mua_he_co"]
    else:
        cau_he = _dien(mau["gio_mua_he_khong"], nam=nam)
    cau_mat_troi = (_dien(mau["mat_troi_canh_bao"], ds=", ".join(_ten_ngan(t) for t in canh_bao[:3]),
                          phut=max(abs(t["lech_mat_troi_phut"]) for t in canh_bao)) if canh_bao else mau["mat_troi_on"])
    cau_mua = _dien(mau["nam_ban_cau"], ten=ten) if mua else ""
    cau_lich = (_dien(mau["lich_am_lech"], nam=nam, so=len(la["ngay_lech"]), ds=_lech_ds(la["ngay_lech"]), ten=ten)
                if la["ngay_lech"] else _dien(mau["lich_am_khong_lech"], nam=nam))
    cau_tet = _dien(mau["lich_am_tet"], nam=nam, tet_viet=_dmy(dt.date.fromisoformat(la["tet_viet"])),
                    tet_trung=_dmy(dt.date.fromisoformat(la["tet_trung"])))

    tra_loi = " ".join(x for x in [_dien(mau["tom_tat_mo"], ten=ten), cau_mui_gio, cau_he,
                                   ("Giờ mặt trời thực: " + cau_mat_troi) if canh_bao else "",
                                   ("Mùa nơi sinh: " + cau_mua) if mua else ""] if x)
    hoi_dap = [{"hoi": _dien(h["hoi"], ten=ten),
                "dap": _dien(h["dap"], ten=ten, gio_mua_he=cau_he, mui_gio=cau_mui_gio, lich_am=f"{cau_lich} {cau_tet}", mat_troi=cau_mat_troi)}
               for h in kb["hoi_dap_mau"]]
    return {
        "ma": ma, "ten": ten, "ten_en": n.get("ten_en"), "nam": nam,
        "tieu_de": _dien(mau["tieu_de"], ten=ten), "nhan_tren": _dien(mau["nhan_tren"], ten=ten),
        "tra_loi_nhanh": tra_loi,
        "ghi_chu_nuoc": kb["nuoc"].get(ma, ""),
        "thanh_pho": tp,
        "mui_gio": [_nhan_utc(u) for u in utc],
        "lich_su_gio_mua_he": _lich_su(zones, nam),
        "nam_mau": [*NAM_MAU, nam],
        "cau": {"mui_gio": cau_mui_gio, "gio_mua_he": cau_he, "mat_troi": cau_mat_troi, "mua": cau_mua, "lich_am": cau_lich, "tet": cau_tet,
                "ket": _dien(mau["ket_noi_ket"], ten=ten)},
        "cong_tac": {"gio_mat_troi": bool(canh_bao), "mua_noi_sinh": bool(mua)},
        "lich_am": la,
        "huong_dan": list(kb["huong_dan"]),
        "hoi_dap": hoi_dap,
        "nguon": {"source_id": kb["source_id"], "school_id": kb["school_id"], "trang_thai": kb.get("_trang_thai")},
    }
