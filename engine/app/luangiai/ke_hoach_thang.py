# -*- coding: utf-8 -*-
"""KH-1 — "Việc bạn định làm: tháng nào hợp" (RULES, tất định, không LLM) cho /thoi-gian-toi.

Người dùng chọn MỘT việc trong danh mục cố định (KB `ke_hoach_thang_kb.json`); 12 tháng dương lịch kể từ tháng này,
mỗi tháng đếm các cách xem ĐÃ CÓ (một bộ tính, không chấm lại):
- thần số: tháng cá nhân (`calc.thanso_mo_rong.thang_ca_nhan`) — hợp khi số nằm trong `so_hop` của việc (chữ lấy từ
  `thanso_ban_do.thang_hop.hop_de`);
- con giáp: chi tháng theo tiết chứa ngày 15 ↔ tuổi (`thoi_gian_lop.lop_thang`) — hợp / xung;
- sách lịch: `hoang_lich.chon_ngay(<việc>)` trong tháng, bỏ ngày đã qua, ngày kiêng dân gian, ngày xung tuổi —
  không có ngày nào → một điểm nhắc chậm;
- Tử vi / Bát tự (khi đủ giờ sinh): mức tháng chứa ngày 15, đúng hàm tháng của Thời gian tới.
Nhịp tháng = ĐẾM điểm thuận / nhắc chậm (không điểm số). Kiêng theo NĂM (Kim lâu cô dâu, tuổi làm nhà) chỉ là ghi chú
tập quán, không đổi nhịp tháng. Đầu vào chỉ ngày sinh (+ giới tính, lá số tuỳ chọn); không lưu, không trả lại ngày sinh."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from app.calc import thanso_mo_rong as mr
from app.calc import tuoi_dan_gian as t
from app.kb import thanso_v2 as kbts
from app.luangiai import hoang_lich as hl
from app.luangiai import thoi_gian_lop as L
from app.luangiai import tuoi_dan_gian as tdg

KB = json.loads((Path(__file__).parents[1] / "kb" / "data" / "ke_hoach_thang_kb.json").read_text(encoding="utf-8"))


def danh_muc() -> list[dict]:
    return [{"ma": k, "ten": v["ten"], "cau_hoi": v["cau_hoi"]} for k, v in KB["viec"].items()]


def sinh_tu_la_so(la_so) -> dict:
    """`TuanTrietInput` → tv_sinh / bt_sinh như route Thời gian tới (không biết giờ → không đọc theo giờ tạm)."""
    from app.calc import tuvi_an_sao  # noqa: PLC0415
    from app.config import HourConfidence  # noqa: PLC0415
    from app.tuvi_api import _DauVao  # noqa: PLC0415
    if la_so is None or la_so.do_tin_gio is HourConfidence.UNKNOWN:
        return {"tv_sinh": None, "bt_sinh": None}
    dv = _DauVao(la_so)
    cal = dv.tb.calendar_dt
    return {"tv_sinh": {"ngay": cal.date(), "ti": tuvi_an_sao.time_index(cal.hour, cal.minute), "gioi_tinh": la_so.gender,
                        "tz_lich": dv.tz_lich, **dv.tuy_chon, "luu_nguyet": la_so.luu_nguyet},
            "bt_sinh": {"lich": cal, "gioi_tinh": la_so.gender, "gio_ty": la_so.gio_ty, "utc_lich": dv.utc_lich}}


def _dm(iso: str) -> str:
    _, m, d = iso.split("-")
    return f"{int(d)}/{int(m)}"


def _hai_la_so(tv_sinh: dict | None, bt_sinh: dict | None, tu: dt.date) -> tuple[list[dict], list[dict]]:
    from app.luangiai import thoi_gian_toi as tgt  # noqa: PLC0415
    tv = bt = []
    if tv_sinh:
        from app.calc import tuvi_an_sao as az  # noqa: PLC0415
        from app.config import CALENDAR_MERIDIAN_TZ  # noqa: PLC0415
        from app.hoidap.tuvi import tom_tat  # noqa: PLC0415
        ls = tom_tat(az.an_sao_tho(tv_sinh["ngay"], tv_sinh["ti"], tv_sinh["gioi_tinh"], "vi-VN",
                                   tz_lich=tv_sinh.get("tz_lich", CALENDAR_MERIDIAN_TZ), hoa_linh=tv_sinh.get("hoa_linh", "viet"),
                                   thang_nhuan=tv_sinh.get("thang_nhuan", "thang_sau"), lich=tv_sinh.get("lich", "viet")))
        tv = tgt._tv_thang(tv_sinh, tu, 5, ls)
    if bt_sinh:
        bt = tgt._bt_thang(bt_sinh, tu, 13)
    return tv, bt


def _muc_15(ds: list[dict], giua: dt.date) -> str | None:
    x = next((h for h in ds if h["tu"] <= giua.isoformat() <= h["den"]), None)
    return x and x.get("muc")


def _nhip(dau: list, cham: list) -> str:
    if len(dau) >= 2 and not cham:
        return "thuan"
    if dau and not cham:
        return "duoc"
    if dau and cham:
        return "can_nhac"
    return "cham" if cham else "binh"


def _nam_luu_y(v: dict, ngay_sinh: dt.date, gioi_tinh: str | None, cac_nam_am: list[int]) -> list[str]:
    k = KB["nam"]
    nsa = tdg.nam_am_sinh(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day)
    ra = []
    if v.get("kiem_nam") == "kim_lau":
        if gioi_tinh == "nam":
            return [k["kim_lau_nam"]]
        if gioi_tinh != "nu":
            return [k["kim_lau_thieu"]]
        for n in cac_nam_am:
            tuoi = t.tuoi_mu(nsa, n)
            kl = t.kim_lau(tuoi)
            ra.append(k["kim_lau_nu"].format(nam=n, tuoi=tuoi) if kl
                      else k["kim_lau_nu_khong"].format(nam=n, tuoi=tuoi))
    elif v.get("kiem_nam") == "lam_nha":
        for n in cac_nam_am:
            x = tdg._danh_gia_nam(nsa, n)
            ra.append(k["lam_nha_xau"].format(nam=n, tuoi=x["tuoi"], xau=", ".join(x["xau"])) if x["xau"]
                      else k["lam_nha_tot"].format(nam=n, tuoi=x["tuoi"]))
    return ra


def lap(ke_hoach: str, ngay_sinh: dt.date, hom_nay: dt.date, gioi_tinh: str | None = None,
        tv_sinh: dict | None = None, bt_sinh: dict | None = None) -> dict:
    if ke_hoach not in KB["viec"]:
        raise ValueError("Việc không có trong danh mục")
    v, kd, kc = KB["viec"][ke_hoach], KB["dau"], KB["cham"]
    van = kbts.ban_do()
    tv, bt = _hai_la_so(tv_sinh, bt_sinh, hom_nay)
    thang, m, y = [], hom_nay.month, hom_nay.year
    cac_nam_am: list[int] = []
    for _ in range(12):
        s = mr.thang_ca_nhan(ngay_sinh.day, ngay_sinh.month, y, m)
        o = L.lop_thang(m, y, ngay_sinh, None, tu_ngay=hom_nay)
        cg = o["con_giap"]
        giua = dt.date(y, m, 15)
        tu = max(dt.date(y, m, 1), hom_nay)
        den = dt.date(y + (m == 12), m % 12 + 1, 1) - dt.timedelta(days=1)
        ngay = [n for n in hl.chon_ngay(v["viec_lich"], tu, den, ngay_sinh.year, ngay_sinh.month, ngay_sinh.day)["ngay"]
                if not n["ky_dan_gian"]]
        dau, cham = [], []
        if str(s) in v["so_hop"]:
            dau.append(kd["thanso"].format(so=s, hop=v["so_hop"][str(s)]))
        if cg["loai"] == "thuan":
            dau.append(kd["con_giap"].format(chi_thang=o["chi_thang"], chi_tuoi=o["chi_tuoi"]))
        elif cg["quan_he"] == "xung":
            cham.append(kc["con_giap"].format(chi_thang=o["chi_thang"], chi_tuoi=o["chi_tuoi"]))
        for ma, ds in (("tuvi", tv), ("battu", bt)):
            mc = _muc_15(ds, giua) if ds else None
            if mc == "thuan":
                dau.append(kd[ma])
            elif mc == "can_chu_dong":
                cham.append(kc[ma])
        if not ngay:
            cham.append(kc["khong_ngay"])
        nh = _nhip(dau, cham)
        thang.append({"thang": f"{m}/{y}", "so": s, "nhan_so": van["thang_hop"][str(s)]["nhan"], "chi_thang": o["chi_thang"],
                      "nhip": nh, "nhan_nhip": KB["nhip"][nh], "dau": dau, "cham": cham, "so_ngay": len(ngay),
                      "ngay": sorted(({"ngay": n["ngay"], "am": n["am"], "can_chi": n["can_chi"], "diem_cong": n["diem_cong"]}
                                      for n in ngay[:3]), key=lambda n: n["ngay"])})
        nam_am = hl._calc(giua)["am"]["nam"]
        if nam_am not in cac_nam_am:
            cac_nam_am.append(nam_am)
        m, y = (1, y + 1) if m == 12 else (m + 1, y)

    thu_tu = {x["thang"]: i for i, x in enumerate(thang)}
    thuan = sorted((x for x in thang if x["nhip"] == "thuan"), key=lambda x: (-len(x["dau"]), thu_tu[x["thang"]]))
    duoc = sorted((x for x in thang if x["nhip"] == "duoc"), key=lambda x: (-len(x["dau"]), thu_tu[x["thang"]]))
    tot = sorted((thuan or duoc)[:3], key=lambda x: thu_tu[x["thang"]])
    lui = [x for x in thang if x["nhip"] == "cham"]
    c = KB["cau"]
    ten_t = ", ".join(f"tháng {x['thang']}" for x in tot)
    tra_loi = (c["tra_loi"] if thuan else c["tra_loi_duoc"] if duoc else c["tra_loi_khong"]).format(viec=v["ten"], thang=ten_t)
    cau = [tra_loi]
    dau_tot = next((x for x in tot if x["ngay"]), None)
    if dau_tot:
        cau.append(c["ngay"].format(thang=f"tháng {dau_tot['thang']}", ds=", ".join(_dm(n["ngay"]) for n in dau_tot["ngay"])))
    if lui:
        ly = sorted({d for x in lui for d in x["cham"]})
        cau.append(c["lui"].format(thang=", ".join(f"tháng {x['thang']}" for x in lui[:4]), ly_do="; ".join(ly)))
    return {"ke_hoach": {"ma": ke_hoach, "ten": v["ten"], "cau_hoi": v["cau_hoi"]},
            "tu": hom_nay.isoformat(), "thang": thang, "tot_nhat": [{"thang": x["thang"], "dau": x["dau"], "ngay": x["ngay"]} for x in tot],
            "nen_lui": [x["thang"] for x in lui], "tra_loi": " ".join(cau),
            "viec_lam": v["viec_lam"], "ranh_gioi": v["ranh_gioi"],
            "nam_luu_y": _nam_luu_y(v, ngay_sinh, gioi_tinh, cac_nam_am),
            "tap_quan": KB["nam"]["tap_quan"] if v.get("kiem_nam") else "",
            "cach_xep": c["cach_xep"], "thieu": [] if (tv and bt) else ["gio_sinh"],
            "thieu_loi": "" if (tv and bt) else c["thieu_gio"], "ket": c["ket"],
            "nguon": "Thần số Pitago · sách lịch (Hiệp Kỷ Biện Phương Thư) · con giáp · Tử vi Nam phái · Bát tự Tử Bình",
            "trang_thai": KB["trang_thai"]}
