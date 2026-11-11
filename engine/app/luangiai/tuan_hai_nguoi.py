# -*- coding: utf-8 -*-
"""BT-UI đợt 2 — "Tuần này của bạn" + "Hôm nay của hai người" (RULES, tất định).

Chỉ GHÉP phép tính có sẵn — ngày cá nhân (`thanso_mo_rong.ngay_ca_nhan`), hoàng lịch theo tuổi (`luangiai.hoang_lich`) —
với câu khung KB `tuan_hai_nguoi_kb.json` (nháp). Không phép tính mới, không điểm số, không LLM, không lưu gì.
Người thứ hai chỉ cần ngày + tháng sinh (năm chỉ dùng để đổi ngày âm sang dương); đầu ra không mang ngày sinh của ai.
"""
from __future__ import annotations

import datetime as dt

from app.calc import lunar, phongthuy, thanso_mo_rong as mr
from app.config import CALENDAR_MERIDIAN_TZ, TZ_LICH_AM, Region, tz_lich_am
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
def _phan(s) -> str:
    """Nghĩa tháng cá nhân trong KB là {chu_de, nen, tranh} → 'Tháng biểu đạt. Hợp giao lưu…' (như thông báo sáng)."""
    if isinstance(s, dict):
        return " ".join(x if x.endswith(".") else x + "." for x in (s.get("chu_de"), s.get("nen")) if x)
    return s or ""


VUONG_TUOI = ("hai", "trung")      # vướng nhẹ với tuổi: không phải "chậm" nhưng cũng không được gọi là ngày thuận


def _lop_ngay(n: dict, c: dict, tt: dict, qh: dict | None, t_tuoi: dict | None, ngay: int, thang: int, nam: int) -> tuple[list[dict], str]:
    """TUAN-V2 — mỗi môn MỘT dòng cho một ngày, chỉ ghép hàm có sẵn (một nguồn với Hôm nay và trang ngày):
    thần số · lịch cổ truyền · tuổi · Bát tự lưu nhật · quẻ đầu ngày. `muc` chỉ có ở hai lớp lịch + tuổi (thuận / bình /
    chậm — không điểm số); ba lớp còn lại là CHỦ ĐỀ của ngày, không tốt không xấu. Trả (lớp, nhịp chung của ngày)."""
    from app.luangiai import hom_nay  # noqa: PLC0415 — tránh vòng import lúc nạp module

    d = dt.date.fromisoformat(n["ngay"])
    k = _kb()["tuan"]["lop"]
    truc = hl.KB["truc"][c["truc"]]
    kl = k["lich"]
    # "Chậm" chỉ khi sách lịch khuyên hoãn MỌI việc (诸事不宜). Ngày kiêng dân gian / chỉ làm việc ở mục Nên là ngày BÌNH
    # THƯỜNG có lời nhắc — nếu gọi cả nhóm này là "chậm" thì ~40 % số ngày mang nhãn chậm, nhãn mất nghĩa và thành doạ.
    if "诸事不宜" in c["ky"]:
        lich_muc, lich_cau = "cham", kl["hoan"]
    elif n["kieng"]:
        lich_muc, lich_cau = "binh", kl["kieng"].format(ky=", ".join(tt["ky_dan_gian"]))
    elif n["hoan"]:
        lich_muc, lich_cau = "binh", kl["nen"].format(truc=truc["ten"])
    elif n["dep"] and n["co_viec_tot"]:
        # "Thuận" của lịch = lịch ghi đẹp VÀ trang ngày có ít nhất một việc lớn tốt — MỘT định nghĩa cho nhịp, dòng nổi bật, câu tuần.
        lich_muc, lich_cau = "thuan", kl["dep"].format(hop=truc["hop"])
    else:
        lich_muc, lich_cau = "binh", kl["binh"].format(truc=truc["ten"], hop=truc["hop"])
    kt = k["tuoi"]
    cc = t_tuoi["can_chi"] if t_tuoi else ""
    vuong = n["tuoi"] in VUONG_TUOI
    # Lục hại / trùng tuổi: không gắn chip mức (câu của lớp tự nói) và ngày đó không bao giờ là "thuận".
    tuoi_muc = "cham" if n["tuoi"] == "xung" else "thuan" if n["tuoi"] in ("tam_hop", "luc_hop") else None if vuong else "binh"
    bt = hom_nay._nhip_bat_tu(ngay, thang, nam, d)  # noqa: SLF001 — đúng hàm lưu nhật của trang Hôm nay
    q = hom_nay._que_ngay(d)  # noqa: SLF001 — đúng quẻ đầu ngày của trang Hôm nay
    lop = [
        {"mon": "than_so", "ten": k["than_so"]["ten"], "nhan": k["than_so"]["nhan"].format(so=n["so"]), "cau": n["chu_de"], "muc": None},
        {"mon": "lich", "ten": kl["ten"], "nhan": (kl["nhan_hd"] if n["hoang_dao"] else kl["nhan_hac"]).format(truc=truc["ten"]),
         "cau": lich_cau, "muc": lich_muc},
        {"mon": "tuoi", "ten": kt["ten"],
         "nhan": kt["nhan"].format(ten=n["tuoi_ten"], can_chi=cc) if n["tuoi"] else kt["binh_nhan"].format(can_chi=cc),
         "cau": kt["cau"].format(nghia=qh["nghia"]) if n["tuoi"] else kt["binh_cau"], "muc": tuoi_muc},
        {"mon": "bat_tu", "ten": k["bat_tu"]["ten"], "nhan": k["bat_tu"]["nhan"].format(thap_than=bt["thap_than"], can_chi=bt["can_chi_ngay"]),
         "cau": bt.get("y_nghia") or "", "muc": None, "duong": "/bat-tu"},
        {"mon": "kinh_dich", "ten": k["kinh_dich"]["ten"], "nhan": k["kinh_dich"]["nhan"].format(ten=q["ten"]),
         "cau": q.get("y_chinh") or "", "muc": None, "duong": q.get("duong")},
    ]
    if "cham" in (lich_muc, tuoi_muc):
        nhip = "lech" if "thuan" in (lich_muc, tuoi_muc) else "cham"
    elif vuong:
        nhip = "binh"
    elif lich_muc == tuoi_muc == "thuan":
        nhip = "thuan"
    elif "thuan" in (lich_muc, tuoi_muc):
        nhip = "kha"
    else:
        nhip = "binh"
    return lop, nhip


def tuan(ngay: int, thang: int, nam: int, ngay_xem: dt.date, gioi_tinh: str | None = None) -> dict:
    """Bảy ngày Thứ Hai → Chủ Nhật của tuần chứa `ngay_xem` + tối đa ba ngày đáng để ý CÒN LẠI trong tuần:
    ngày thuận nhất (lịch ghi đẹp, không xung tuổi; ưu tiên hợp tuổi — tuần không có thì ngày hợp tuổi) · ngày nên đi chậm (xung tuổi) · ngày mở đầu
    (ngày cá nhân 1) hoặc khép lại (9). Ngày xung tuổi không bao giờ là ngày thuận."""
    dau = ngay_xem - dt.timedelta(days=ngay_xem.weekday())
    ds = []
    tho: list[tuple] = []
    for i in range(7):
        d = dau + dt.timedelta(days=i)
        tt = hl.tom_tat(d)
        c = hl._calc(d)  # noqa: SLF001 — cùng bộ tính với trang ngày
        vl = hl._viec_lon(c)  # noqa: SLF001 — đúng luật "Việc lớn hôm nay" của trang ngày (6b)
        lon = [v["danh_gia"] for v in vl]
        t_tuoi = hl.tuoi(nam, thang, ngay)
        qh = hl._quan_he(c["ngay_gz"][1], t_tuoi)  # noqa: SLF001 — cùng hàm với trang ngày
        tho.append((c, tt, qh, vl))
        ds.append({"ngay": d.isoformat(), "thu": THU[i], "so": mr.ngay_ca_nhan(ngay, thang, d.year, d.month, d.day),
                   "chu_de": None, "hoang_dao": tt["hoang_dao"], "dep": tt["dep"], "tuoi": qh["ma"] if qh else None,
                   "tuoi_ten": qh["ten"] if qh else None, "tuoi_nghia": qh["nghia"] if qh else None,
                   "kieng": bool(tt["ky_dan_gian"]), "vuong": (qh["ma"] if qh else None) in VUONG_TUOI,
                   # Sách lịch khuyên hoãn mọi việc / chỉ làm việc ghi ở mục Nên → không gợi ý làm việc gì vào ngày này.
                   "hoan": "诸事不宜" in c["ky"] or "馀事勿取" in c["nghi"], "co_viec_tot": "tot" in lon,
                   "da_qua": d < ngay_xem, "hom_nay": d == ngay_xem})
    k = _kb()["tuan"]
    t_tuoi = hl.tuoi(nam, thang, ngay)
    for n, (c, tt, qh, vl) in zip(ds, tho):
        n["chu_de"] = _nghia(n["so"])
        # TUAN-V2: các lớp theo môn + việc hợp + giờ tốt + một câu tóm của ngày
        n["lop"], n["nhip"] = _lop_ngay(n, c, tt, qh, t_tuoi, ngay, thang, nam)
        n["viec_tot"] = [v["ten"] for v in vl if v["danh_gia"] == "tot"]
        n["gio_tot"] = [{"chi": hl._CHI[g["chi"]], "khung": hl._KHUNG[i]} for i, g in enumerate(c["gio"]) if g["hoang_dao"]]  # noqa: SLF001
        n["am"] = tt["am"]
        ky = ", ".join(tt["ky_dan_gian"])
        n["viec_luu_y"] = (k["viec_xung"] if n["tuoi"] == "xung" else k["viec_kieng"].format(ky=ky) if n["kieng"] else None) if n["viec_tot"] else None
        mau = k["tom"]
        viec = ", ".join(x.lower() for x in n["viec_tot"][:2])
        if n["nhip"] in ("cham", "lech"):
            khoa = n["nhip"]
        elif n["kieng"]:
            khoa = "kieng"              # không nêu "hợp việc X" trên ngày dân gian thường kiêng (lớp lịch cùng ngày đang nhắc kiêng)
        elif n["vuong"]:
            khoa = "vuong"
        elif viec:
            khoa = "kha_viec" if n["nhip"] == "binh" else n["nhip"] + "_viec"
        else:
            khoa = n["nhip"]
        n["tom"] = mau[khoa].format(viec=viec, ky=ky, ten=(n["tuoi_ten"] or "").lower())
    # Theo việc: ngày CÒN LẠI trong tuần sách lịch ghi tốt cho từng việc lớn (đúng luật trang ngày), bỏ ngày xung tuổi và
    # ngày dân gian thường kiêng (để khối này không nói ngược lớp lịch của chính ngày đó).
    viec_tuan = []
    for sv in hl.VIEC_SEO:
        ngay_hop = [n["ngay"] for n in ds if not n["da_qua"] and sv["ten"] in n["viec_tot"] and n["tuoi"] != "xung" and not n["kieng"]]
        if ngay_hop:
            viec_tuan.append({"ma": sv["ma"], "ten": sv["ten"], "slug": sv["slug"], "ngay": ngay_hop})
    # Mốc trong tuần: giao tiết / Lập xuân / Tết (đúng hàm mốc lịch của thông báo sáng), mùng 1, rằm, tháng cá nhân mới.
    from app.luangiai import sang_nay  # noqa: PLC0415
    moc = []
    for n, (c, *_r) in zip(ds, tho):
        d = dt.date.fromisoformat(n["ngay"])
        for m in sang_nay.moc_lich(d):                     # cùng hàm mốc với thông báo sáng; lời riêng cho cái nhìn cả tuần
            km = k["moc"]
            if m["ma"].startswith("tet."):
                moc.append({"loai": "tet", "ngay": n["ngay"], "thu": n["thu"], "cau": "",
                            "nhan": km["tet"].format(can_chi=" ".join(lunar.can_chi_nam(c["am"]["nam"])))})
            elif m["ma"] == "tiet.315":
                moc.append({"loai": "giao_tiet", "ngay": n["ngay"], "thu": n["thu"], "nhan": km["lap_xuan"], "cau": km["lap_xuan_cau"]})
            else:
                tk = sang_nay._kb()["tiet"][m["ma"].split(".", 1)[1]]  # noqa: SLF001
                moc.append({"loai": "giao_tiet", "ngay": n["ngay"], "thu": n["thu"], "nhan": km["giao_tiet"].format(ten=tk["ten"]),
                            "cau": km["giao_tiet_cau"].format(chi=tk["chi"])})
        am = c["am"]
        if am["ngay"] in (1, 15) and not any(x["loai"] == "tet" and x["ngay"] == n["ngay"] for x in moc):
            moc.append({"loai": "mung_1" if am["ngay"] == 1 else "ram", "ngay": n["ngay"], "thu": n["thu"],
                        "nhan": k["moc"]["mung_1" if am["ngay"] == 1 else "ram"].format(thang=f"{am['thang']}{' nhuận' if am.get('nhuan') else ''}"), "cau": ""})
        if d.day == 1:
            so_t = mr.thang_ca_nhan(ngay, thang, d.year, d.month)
            moc.append({"loai": "thang_ca_nhan", "ngay": n["ngay"], "thu": n["thu"], "nhan": k["moc"]["thang_ca_nhan"].format(so=so_t),
                        "cau": _phan(thanso_v2.nghia_phu("thang_ca_nhan", so_t))})
    # Phong thuỷ: sao tháng (Huyền Không) × hướng hợp mệnh quái — đúng hàm lớp phong thuỷ của "Thời gian tới"; tính ở ngày xem.
    from app.luangiai import thoi_gian_lop  # noqa: PLC0415
    quai = phongthuy.menh_quai(nam, gioi_tinh, dt.date(nam, thang, ngay))["quai"] if gioi_tinh in ("nam", "nu") else None
    pt = thoi_gian_lop.phong_thuy_thang(ngay_xem, quai)
    phong_thuy = {"ten": k["phong_thuy"]["ten"], "loi": pt["loi"], "can_cu": pt["can_cu"], "thieu_gioi_tinh": quai is None,
                  "duong": "/phong-thuy"}
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
    # "Ngày thuận" = MỘT định nghĩa với nhịp của ngày: lớp lịch thuận (đẹp + có việc lớn tốt) và tuổi không xung, không
    # hại, không trùng → nhịp thuan / kha. Ngày nhịp "thuận" (cả tuổi cũng hợp) đứng trước.
    dep = [n for n in con if n["dep"] and n["co_viec_tot"] and n["nhip"] in ("thuan", "kha")]
    if dep:
        tot = sorted(dep, key=lambda n: (n["nhip"] != "thuan", n["ngay"]))[0]
        nb.append(dong("thuan", tot, hop=k["hop"].get(tot["tuoi"] or "", "")))
    else:
        # Tuần không có ngày lịch ghi đẹp → ngày tam hợp / lục hợp với tuổi (không vướng ngày kiêng dân gian) là ngày đáng chọn.
        hop = [n for n in con if n["nhip"] == "kha" and n["tuoi"] in ("tam_hop", "luc_hop") and n["hoang_dao"] and not n["kieng"] and not n["hoan"]]
        if hop:
            nb.append(dong("hop_tuoi", hop[0], nghia=hop[0]["tuoi_nghia"]))
    xung = [n for n in con if n["tuoi"] == "xung"]
    if xung:
        nb.append(dong("cham", xung[0]))
    da = {x["ngay"] for x in nb}
    for loai, so in (("mo_dau", 1), ("khep", 9)):
        # "Hợp bắt đầu một việc nhỏ" không đặt vào ngày lịch khuyên hoãn / ngày kiêng dân gian (khép lại thì ngày nào cũng được).
        n = next((n for n in con if n["so"] == so and n["ngay"] not in da
                  and (loai == "khep" or not (n["kieng"] or n["hoan"] or n["vuong"] or n["tuoi"] == "xung"))), None)
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
        n.pop("vuong", None)
        n.pop("hoan", None)
        n.pop("co_viec_tot", None)
    return {"tu": ds[0]["ngay"], "den": ds[6]["ngay"], "ngay": ds, "noi_bat": nb[:TOI_DA_NOI_BAT], "tom_tat": tom_tat,
            "viec_tuan": viec_tuan, "viec_tuan_luu_y": k["viec_tuan"]["luu_y"], "moc": moc, "phong_thuy": phong_thuy,
            "tuoi": t_tuoi["can_chi"] if t_tuoi else None, "luu_y": k["luu_y"],
            # Chữ giao diện gắn với nghĩa (tên nhịp, tên mức, câu dẫn, ghi chú môn không vào tuần) do engine soạn — web chỉ vẽ.
            "nhan": k["nhan"], **_meta()}


DUONG_TUAN = "/hom-nay#tuan-nay"


def push_tuan(ngay: int, thang: int, nam: int, ngay_xem: dt.date) -> dict | None:
    """Một dòng thông báo sáng THỨ HAI (mốc Web Push `tuan_cua_toi`, migration 0036): câu tóm tắt tuần + ngày đáng để ý
    đầu tiên — đúng dữ liệu của mục "Tuần này của bạn" (một nguồn). Không phải thứ Hai → None. Không dự báo, không doạ."""
    if ngay_xem.weekday() != 0:
        return None
    t = tuan(ngay, thang, nam, ngay_xem)
    k = _kb()["tuan"]["push"]
    nb = t["noi_bat"]
    # Ưu tiên dòng tích cực (thuận / hợp tuổi), rồi mở đầu / khép lại; tuần chỉ có "ngày nên đi chậm" → không nêu ngày
    # (thông báo sáng thứ Hai không mở đầu bằng lời nhắc chậm).
    chon = (next((x for x in nb if x["loai"] in ("thuan", "hop_tuoi")), None)
            or next((x for x in nb if x["loai"] in ("mo_dau", "khep")), None))
    if chon:
        noi_dung = k["co_ngay"].format(tom_tat=t["tom_tat"], ngay=chon["tieu_de"])
    else:
        noi_dung = k["khong_ngay"].format(tom_tat=t["tom_tat"])
    return {"tieu_de": k["tieu_de"], "noi_dung": noi_dung, "duong": DUONG_TUAN}


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
              kia_lich: str = "duong", kia_nam: int | None = None, kia_nhuan: bool = False,
              kia_vung: str | None = None, kia_lich_am: str | None = None) -> dict:
    """`kia_vung` / `kia_lich_am`: đổi ngày âm của người kia theo ĐÚNG lịch lá số của họ (miền Nam 1960–1975 và lịch Trung Quốc = UTC+8)."""
    if kia_lich == "am":
        if not kia_nam:
            raise ValueError("Ngày âm lịch cần năm sinh để đổi sang dương lịch")
        nhuan = 1 if kia_nhuan else 0
        if kia_lich_am == "trung":
            tz = TZ_LICH_AM["trung"]
        else:
            tz = CALENDAR_MERIDIAN_TZ
            if kia_vung == "south":      # ngày dương gần đúng (lịch UTC+7) chỉ để biết có rơi vào giai đoạn miền Nam dùng UTC+8 không
                d0, m0, y0 = lunar.lunar_to_solar(min(kia_ngay, 29), kia_thang, kia_nam, nhuan, tz)
                tz = tz_lich_am(dt.date(y0, m0, d0), Region.SOUTH)
        kia_ngay, kia_thang, _ = lunar.lunar_to_solar(kia_ngay, kia_thang, kia_nam, nhuan, tz)
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
