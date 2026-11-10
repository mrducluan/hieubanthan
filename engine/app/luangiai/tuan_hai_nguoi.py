# -*- coding: utf-8 -*-
"""BT-UI đợt 2 — "Tuần này của bạn" + "Hôm nay của hai người" (RULES, tất định).

Chỉ GHÉP phép tính có sẵn — ngày cá nhân (`thanso_mo_rong.ngay_ca_nhan`), hoàng lịch theo tuổi (`luangiai.hoang_lich`) —
với câu khung KB `tuan_hai_nguoi_kb.json` (nháp). Không phép tính mới, không điểm số, không LLM, không lưu gì.
Người thứ hai chỉ cần ngày + tháng sinh (năm chỉ dùng để đổi ngày âm sang dương); đầu ra không mang ngày sinh của ai.
"""
from __future__ import annotations

import datetime as dt

from app.calc import lunar, thanso_mo_rong as mr
from app.config import CALENDAR_MERIDIAN_TZ
from app.kb import nap, thanso_v2
from app.luangiai import hoang_lich as hl

THU = ("Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật")
TOI_DA_NOI_BAT = 3


def _kb() -> dict:
    return nap.doc("tuan_hai_nguoi_kb.json")


def _nghia(so: int) -> str:
    """'Ngày cá nhân 3: hợp gặp gỡ…' → 'Hợp gặp gỡ…' (bỏ tiền tố, viết hoa chữ đầu)."""
    s = thanso_v2.nghia_phu("ngay_ca_nhan", so) or ""
    s = s.split(": ", 1)[1] if ": " in s else s
    return s[:1].upper() + s[1:]


def _meta() -> dict:
    k = _kb()
    return {"nguon": k["nguon"], "source_id": k["source_id"], "school_id": k["school_id"], "trang_thai": k["trang_thai"]}


# ------------------------------------------------------------------ tuần
def tuan(ngay: int, thang: int, nam: int, ngay_xem: dt.date) -> dict:
    """Bảy ngày Thứ Hai → Chủ Nhật của tuần chứa `ngay_xem` + tối đa ba ngày đáng để ý CÒN LẠI trong tuần:
    ngày thuận nhất (lịch ghi đẹp, không xung tuổi; ưu tiên hợp tuổi — tuần không có thì ngày hợp tuổi) · ngày nên đi chậm (xung tuổi) · ngày mở đầu
    (ngày cá nhân 1) hoặc khép lại (9). Ngày xung tuổi không bao giờ là ngày thuận."""
    dau = ngay_xem - dt.timedelta(days=ngay_xem.weekday())
    ds = []
    for i in range(7):
        d = dau + dt.timedelta(days=i)
        tt = hl.tom_tat(d)
        qh = hl._quan_he(hl._calc(d)["ngay_gz"][1], hl.tuoi(nam, thang, ngay))  # noqa: SLF001 — cùng hàm với trang ngày
        ds.append({"ngay": d.isoformat(), "thu": THU[i], "so": mr.ngay_ca_nhan(ngay, thang, d.year, d.month, d.day),
                   "chu_de": None, "hoang_dao": tt["hoang_dao"], "dep": tt["dep"], "tuoi": qh["ma"] if qh else None,
                   "tuoi_ten": qh["ten"] if qh else None, "tuoi_nghia": qh["nghia"] if qh else None,
                   "kieng": bool(tt["ky_dan_gian"]), "da_qua": d < ngay_xem, "hom_nay": d == ngay_xem})
    for n in ds:
        n["chu_de"] = _nghia(n["so"])
    k = _kb()["tuan"]
    con = [n for n in ds if not n["da_qua"]]

    def dong(loai: str, n: dict, **them) -> dict:
        d = dt.date.fromisoformat(n["ngay"])
        m = k["noi_bat"][loai]
        can_cu = [f"Ngày cá nhân {n['so']}", "Ngày hoàng đạo" if n["hoang_dao"] else "Ngày hắc đạo"]
        if n["tuoi_ten"] and n["tuoi"]:
            can_cu.append(f"{n['tuoi_ten']} với tuổi bạn")
        return {"loai": loai, "ngay": n["ngay"], "thu": n["thu"],
                "tieu_de": m["tieu_de"].format(thu=n["thu"], dm=f"{d.day}/{d.month}"),
                "cau": m["cau"].format(**them) if them else m["cau"], "can_cu": can_cu}

    nb: list[dict] = []
    dep = [n for n in con if n["dep"] and n["tuoi"] != "xung"]
    if dep:
        tot = sorted(dep, key=lambda n: (n["tuoi"] not in ("tam_hop", "luc_hop"), n["ngay"]))[0]
        nb.append(dong("thuan", tot, hop=k["hop"].get(tot["tuoi"] or "", "")))
    else:
        # Tuần không có ngày lịch ghi đẹp → ngày tam hợp / lục hợp với tuổi (không vướng ngày kiêng dân gian) là ngày đáng chọn.
        hop = [n for n in con if n["tuoi"] in ("tam_hop", "luc_hop") and not n["kieng"]]
        if hop:
            nb.append(dong("hop_tuoi", hop[0], nghia=hop[0]["tuoi_nghia"]))
    xung = [n for n in con if n["tuoi"] == "xung"]
    if xung:
        nb.append(dong("cham", xung[0]))
    da = {x["ngay"] for x in nb}
    for loai, so in (("mo_dau", 1), ("khep", 9)):
        n = next((n for n in con if n["so"] == so and n["ngay"] not in da), None)
        if n and len(nb) < TOI_DA_NOI_BAT:
            nb.append(dong(loai, n))
            da.add(n["ngay"])
    nb.sort(key=lambda x: x["ngay"])
    so_dep = len(dep)
    tt_k = k["tom_tat"]
    tom_tat = (tt_k["co_dep"] if so_dep else tt_k["khong_dep"]).format(so=so_dep, xung=tt_k["xung"] if xung else tt_k["khong_xung"])
    for n in ds:                                        # trường phụ chỉ dùng để chọn dòng nổi bật
        n.pop("tuoi_nghia", None)
        n.pop("kieng", None)
    return {"tu": ds[0]["ngay"], "den": ds[6]["ngay"], "ngay": ds, "noi_bat": nb[:TOI_DA_NOI_BAT], "tom_tat": tom_tat,
            "luu_y": k["luu_y"], **_meta()}


# ------------------------------------------------------------------ hai người
def kieu_cap(a: int, b: int) -> str:
    """Bốn kiểu nhịp của hai ngày cá nhân: cùng số · cùng hướng ra · cùng hướng vào · lệch nhịp (đối xứng a ↔ b)."""
    if a == b:
        return "cung_so"
    ra = set(_kb()["hai_nguoi"]["nhom_ra"])
    if (a in ra) == (b in ra):
        return "cung_ra" if a in ra else "cung_vao"
    return "lech"


def hai_nguoi(ngay: int, thang: int, kia_ngay: int, kia_thang: int, ngay_xem: dt.date, *, quan_he: str | None = None,
              kia_lich: str = "duong", kia_nam: int | None = None, kia_nhuan: bool = False) -> dict:
    if kia_lich == "am":
        if not kia_nam:
            raise ValueError("Ngày âm lịch cần năm sinh để đổi sang dương lịch")
        kia_ngay, kia_thang, _ = lunar.lunar_to_solar(kia_ngay, kia_thang, kia_nam, 1 if kia_nhuan else 0, CALENDAR_MERIDIAN_TZ)
    else:
        dt.date(kia_nam or 2000, kia_thang, kia_ngay)        # ngày không tồn tại → ValueError (2000 là năm nhuận: nhận 29/2)
    y, m, d = ngay_xem.year, ngay_xem.month, ngay_xem.day
    a = mr.ngay_ca_nhan(ngay, thang, y, m, d)
    b = mr.ngay_ca_nhan(kia_ngay, kia_thang, y, m, d)
    kieu = kieu_cap(a, b)
    k = _kb()["hai_nguoi"]
    mau = k["kieu"][kieu]
    return {"ngay_xem": ngay_xem.isoformat(), "quan_he": quan_he, "kieu": kieu,
            "ban": {"so": a, "nghia": _nghia(a)}, "nguoi_kia": {"so": b, "nghia": _nghia(b)},
            "tieu_de": mau["tieu_de"], "cau": mau["cau"].format(a=a, b=b), "viec_cung": mau["viec_cung"],
            "cau_tu_soi": mau["cau_tu_soi"], "luu_y": k["luu_y"], **_meta()}
