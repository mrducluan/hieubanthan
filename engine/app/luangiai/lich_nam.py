# -*- coding: utf-8 -*-
"""SEO-L5 — "lịch âm năm X": các tháng âm lịch Việt của một năm (ngày mùng 1 dương lịch, tháng đủ/thiếu, tháng nhuận),
Tết, can chi tháng. Chỉ ghép các hàm của `calc/lunar` (Hồ Ngọc Đức, UTC+7) — không phép tính mới, không LLM."""
from __future__ import annotations

import datetime as dt

from app.calc import lunar
from app.config import CALENDAR_MERIDIAN_TZ as TZ
from app.kb.loi import L
from app.luangiai import lich_hien as lh


def _duong(d: int, m: int, y: int, nhuan: int) -> dt.date:
    dd, mm, yy = lunar.lunar_to_solar(d, m, y, nhuan, TZ)
    return dt.date(yy, mm, dd)


# SEO-O: ngày lễ / ngày giỗ theo âm lịch hay được hỏi (chỉ tháng thường, không lấy tháng nhuận). Ngày dương do
# `lunar_to_solar` tính — không bảng gõ tay.
LE_AM: tuple[tuple[str, str, int, int], ...] = (
    ("tet", "Tết Nguyên đán (mùng 1 Tết)", 1, 1),
    ("ram_gieng", "Rằm tháng Giêng (Tết Nguyên tiêu)", 15, 1),
    ("han_thuc", "Tết Hàn thực", 3, 3),
    ("gio_to", "Giỗ Tổ Hùng Vương", 10, 3),
    ("phat_dan", "Lễ Phật đản", 15, 4),
    ("doan_ngo", "Tết Đoan ngọ", 5, 5),
    ("vu_lan", "Rằm tháng Bảy (Vu Lan)", 15, 7),
    ("trung_thu", "Tết Trung thu", 15, 8),
    ("ha_nguyen", "Rằm tháng Mười (Tết Hạ nguyên)", 15, 10),
    ("ong_tao", "Ông Công Ông Táo", 23, 12),
)
THU = ("Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật")


def _thu(i: int) -> str:
    return L(f"lich.thu.{i}", THU[i])


def _cc(can: str, chi: str) -> str:
    """Can chi theo ngôn ngữ (EN-ALL GĐ 8; bản Việt: "Giáp Thìn")."""
    return lh.can_chi(f"{can} {chi}")


def _dmy(d: dt.date) -> str:
    if lh.la_viet():
        return f"{d.day:02d}/{d.month:02d}/{d.year}"
    from app.luangiai import lich_trang_hien as lth  # noqa: PLC0415
    return lth.ngay_dai(d)


def _le(nam: int, tet_sau: dt.date) -> list[dict]:
    ds = [{"ma": ma, "ten": L(f"lich.le.{ma}", ten), "am": f"{d}/{m}", "duong": (n := _duong(d, m, nam, 0)).isoformat(),
           "thu": _thu(n.weekday())} for ma, ten, d, m in LE_AM]
    gt = tet_sau - dt.timedelta(days=1)
    ds.append({"ma": "giao_thua", "ten": L("lich.le.giao_thua", "Giao thừa (ngày cuối tháng Chạp)"),
               "am": f"{(gt - _duong(1, 12, nam, 0)).days + 1}/12", "duong": gt.isoformat(), "thu": _thu(gt.weekday())})
    return sorted(ds, key=lambda x: x["duong"])


def cac_nam(tu: int, den: int) -> list[dict]:
    """Bảng ngắn nhiều năm: can chi, con giáp, Tết, tháng nhuận, số ngày của năm âm."""
    kq = []
    for n in range(tu, den + 1):
        can, chi = lunar.can_chi_nam(n)
        tet, sau = _duong(1, 1, n, 0), _duong(1, 1, n + 1, 0)
        kq.append({"nam": n, "can_chi": _cc(can, chi), "con_giap": chi, "tet": tet.isoformat(),
                   "thang_nhuan": lunar.thang_nhuan(n, TZ), "so_ngay": (sau - tet).days})
    return kq


def lich_nam(nam: int) -> dict:
    nhuan = lunar.thang_nhuan(nam, TZ)
    thang = []
    for m in range(1, 13):
        for ln in ((0, 1) if m == nhuan else (0,)):
            mot = _duong(1, m, nam, ln)
            so = lunar.so_ngay_thang(m, nam, ln, TZ)
            can, chi = lunar.can_chi_thang(m, nam)
            thang.append({"thang": m, "nhuan": bool(ln), "mung_mot": mot.isoformat(), "so_ngay": so,
                          "cuoi": (mot + dt.timedelta(days=so - 1)).isoformat(), "can_chi": _cc(can, chi),
                          "ram": (mot + dt.timedelta(days=14)).isoformat()})
    can, chi = lunar.can_chi_nam(nam)
    cc = _cc(can, chi)
    tet, tet_sau = _duong(1, 1, nam, 0), _duong(1, 1, nam + 1, 0)
    dmy = _dmy
    # SEO-P: câu người ta tìm nhiều nhất là "năm X có nhuận không" → câu trả lời đứng đầu (mẫu câu theo ngôn ngữ).
    nh = next((x for x in thang if x["nhuan"]), None)
    cau_nhuan = (L("lich.nam.tl_dau_nhuan", "Năm {nam} có tháng nhuận: nhuận tháng {n} âm lịch (tháng {n} nhuận bắt đầu ngày "
                   "{ngay}), cả năm có 13 tháng âm.", nam=nam, n=nhuan, ngay=dmy(dt.date.fromisoformat(nh["mung_mot"])))
                 if nhuan else L("lich.nam.tl_dau_khong", "Năm {nam} không có tháng nhuận âm lịch, cả năm có 12 tháng âm.", nam=nam))
    tra_loi = cau_nhuan + " " + L("lich.nam.tl2", "Năm âm lịch {cc} {nam} bắt đầu từ Tết ngày {tet} và kết thúc ngày {cuoi} "
                                  "(dương lịch), dài {so} ngày.", cc=cc, nam=nam, tet=dmy(tet),
                                  cuoi=dmy(tet_sau - dt.timedelta(days=1)), so=(tet_sau - tet).days)
    hd = [
        {"hoi": L("lich.nam.h_nhuan2", "Năm {nam} có nhuận không?", nam=nam),
         "dap": (L("lich.nam.d_nhuan2", "Có. Năm {nam} âm lịch có tháng {n} nhuận, nên có 13 tháng âm.", nam=nam, n=nhuan) if nhuan
                 else L("lich.nam.d_khong_nhuan2", "Không. Năm {nam} âm lịch có 12 tháng, không có tháng nhuận.", nam=nam))
                + L("lich.nam.d_nhuan_vn", " Tính theo âm lịch Việt Nam (giờ Hà Nội).")},
        {"hoi": L("lich.nam.h_tet", "Tết âm lịch {nam} là ngày nào?", nam=nam),
         "dap": L("lich.nam.d_tet", "Mùng 1 Tết {cc} là ngày {ngay} dương lịch (theo âm lịch Việt Nam).", cc=cc, ngay=dmy(tet))},
        {"hoi": L("lich.nam.h_ram", "Rằm tháng Giêng {nam} là ngày nào?", nam=nam),
         "dap": L("lich.nam.d_ram", "Ngày {ngay} dương lịch.", ngay=dmy(dt.date.fromisoformat(thang[0]['ram'])))},
    ]
    le = _le(nam, tet_sau)
    ld = {x["ma"]: x for x in le}
    for ma, hoi in (("gio_to", L("lich.nam.h_gio_to", "Giỗ Tổ Hùng Vương {nam} (10/3 âm) là ngày nào?", nam=nam)),
                    ("vu_lan", L("lich.nam.h_vu_lan", "Rằm tháng Bảy {nam} là ngày nào?", nam=nam)),
                    ("trung_thu", L("lich.nam.h_trung_thu", "Tết Trung thu {nam} (15/8 âm) là ngày nào?", nam=nam)),
                    ("ong_tao", L("lich.nam.h_ong_tao", "Cúng ông Công ông Táo năm {cc} là ngày nào?", cc=cc))):
        x = ld[ma]
        hd.append({"hoi": hoi, "dap": L("lich.nam.d_le", "{thu}, ngày {ngay} dương lịch (ngày {am} âm lịch).", thu=x["thu"],
                                        ngay=dmy(dt.date.fromisoformat(x["duong"])), am=x["am"])})
    return {"nam": nam, "can_chi": cc, "tet": tet.isoformat(), "tet_sau": tet_sau.isoformat(),
            "thang_nhuan": nhuan, "thang": thang, "tra_loi_nhanh": tra_loi, "hoi_dap": hd, "le": le,
            "so_ngay": (tet_sau - tet).days,
            "cach_tinh": L("lich.nam.cach_tinh", "Âm lịch Việt Nam tính theo giờ Hà Nội (UTC+7) theo phép tính thiên văn: mùng 1 là "
                           "ngày có điểm sóc, tháng nhuận là tháng đầu tiên trong năm không chứa trung khí. Lịch Trung Quốc "
                           "tính theo UTC+8 nên có năm lệch một ngày hoặc một tháng.")}


# ---- LA-UI (2026-11-16): lịch cả năm âm theo TỪNG NGÀY — dữ liệu cho component lịch (web chỉ vẽ) -------------------
def _tiet_khi(tu: dt.date, den: dt.date) -> dict[dt.date, dict]:
    """24 tiết khí rơi trong [tu, den] theo NGÀY giờ Việt Nam: {ngày: {kd, ten, nghia, gio}}."""
    from app.calc import tietkhi  # noqa: PLC0415
    from app.luangiai import hoang_lich as hl  # noqa: PLC0415
    kb = hl.KB["tiet_khi"]
    ra: dict[dt.date, dict] = {}
    for nam in range(tu.year, den.year + 1):
        for kd in range(0, 360, 15):
            t = tietkhi.thoi_diem(nam, kd) + dt.timedelta(hours=TZ)
            if tu <= t.date() <= den:
                ra[t.date()] = {"kd": kd, "ten": kb[str(kd)]["ten"], "nghia": kb[str(kd)]["nghia"],
                                "loai": kb[str(kd)]["loai"], "gio": f"{t.hour:02d}:{t.minute:02d}"}
    return ra


def _ten_thang(m: int, nhuan: bool) -> str:
    return f"Tháng {'Giêng' if m == 1 else 'Chạp' if m == 12 else m}{' nhuận' if nhuan else ''}"


def lich_ngay(nam: int) -> dict:
    """Mọi ngày của năm âm lịch `nam` (Tết → ngày trước Tết năm sau), gom theo tháng âm. Mỗi ngày: `d` dương lịch,
    `a` ngày âm, `thu` (0 = thứ Hai), `cc` can chi ngày, `hd` hoàng đạo, `th` thần, `tr` trực, `dep`/`ky` (đúng
    `hoang_lich.tom_tat` — một nguồn với trang ngày), `tiet` tiết khí giao trong ngày, `le` ngày lễ âm + dương.
    Khoá ngắn vì trang nhận ~355 ngày một lượt. Chữ tiếng Việt (component lịch hiện chỉ có ở bản Việt)."""
    from app.luangiai import hoang_lich as hl  # noqa: PLC0415
    goc = lich_nam(nam)
    tet, tet_sau = dt.date.fromisoformat(goc["tet"]), dt.date.fromisoformat(goc["tet_sau"])
    tiet = _tiet_khi(tet, tet_sau - dt.timedelta(days=1))
    le: dict[str, list[str]] = {}
    for x in goc["le"]:
        le.setdefault(x["duong"], []).append(x["ten"])
    le_duong = {k: v for k, v in hl.KB["le_duong"].items() if not k.startswith("_")}
    thang = []
    for g in goc["thang"]:
        mot = dt.date.fromisoformat(g["mung_mot"])
        ds = []
        for i in range(g["so_ngay"]):
            d = mot + dt.timedelta(days=i)
            s = lh.tom_tat_ngay(hl.tom_tat(d))
            n: dict = {"d": d.isoformat(), "a": i + 1, "thu": d.weekday(), "cc": s["can_chi"], "hd": s["hoang_dao"],
                       "th": s["than"], "tr": s["truc"]}
            if s["dep"]:
                n["dep"] = True
            if s["ky_dan_gian"]:
                n["ky"] = s["ky_dan_gian"]
            if d in tiet:
                n["tiet"] = tiet[d]["ten"]
            ten_le = le.get(n["d"], []) + ([le_duong[k]] if (k := f"{d.month:02d}-{d.day:02d}") in le_duong else [])
            if ten_le:
                n["le"] = ten_le
            ds.append(n)
        thang.append({"thang": g["thang"], "nhuan": g["nhuan"], "ten": _ten_thang(g["thang"], g["nhuan"]),
                      "can_chi": g["can_chi"], "mung_mot": g["mung_mot"], "cuoi": g["cuoi"], "so_ngay": g["so_ngay"],
                      "so_hoang_dao": sum(x["hd"] for x in ds), "so_dep": sum(x.get("dep", False) for x in ds), "ngay": ds})
    am = {n["d"]: f"{n['a']}/{t['thang']}{' nhuận' if t['nhuan'] else ''}" for t in thang for n in t["ngay"]}
    return {"nam": nam, "can_chi": goc["can_chi"], "tet": goc["tet"], "tet_sau": goc["tet_sau"], "so_ngay": goc["so_ngay"],
            "thang_nhuan": goc["thang_nhuan"], "thang": thang,
            "tiet_khi": [{"ten": v["ten"], "nghia": v["nghia"], "loai": v["loai"], "ngay": k.isoformat(), "gio": v["gio"],
                          "am": am[k.isoformat()]} for k, v in sorted(tiet.items())],
            "chu_thich": "Số vàng: ngày hoàng đạo. Sao: ngày hoàng đạo có trực tốt, không vướng kiêng dân gian (chưa xét tuổi). "
                         "Tiết khí tính theo giờ Việt Nam."}
