# -*- coding: utf-8 -*-
"""HL-1 — "Xem ngày tốt": ghép hoàng lịch (CALC `calc/hoang_lich`) với tên Hán Việt + nghĩa đời thường (KB
`hoang_lich_kb.json`, nháp AI có nhãn). Không LLM, không dự báo sự kiện; lời lẽ theo kiểu "sách lịch cổ khuyên…",
không doạ. Tuổi người xem theo NĂM ÂM LỊCH VIỆT (mốc Tết) — cách người Việt hay nói "tuổi Dần, tuổi Mão".
"""
from __future__ import annotations

import datetime as dt
import json
from functools import lru_cache
from pathlib import Path

from app.calc import hoang_lich as hl, lunar
from app.config import CALENDAR_MERIDIAN_TZ

KB = json.loads((Path(__file__).parents[1] / "kb" / "data" / "hoang_lich_kb.json").read_text(encoding="utf-8"))
_CAN = dict(zip(hl.GAN, lunar.CAN))
_CHI = dict(zip(hl.ZHI, lunar.CHI))
_KHUNG = ["00:00–00:59", "01:00–02:59", "03:00–04:59", "05:00–06:59", "07:00–08:59", "09:00–10:59",
          "11:00–12:59", "13:00–14:59", "15:00–16:59", "17:00–18:59", "19:00–20:59", "21:00–22:59"]
TRUC_TOT = {"成", "开", "定", "满", "除"}
_VIEC = {v["ma"]: v for v in KB["viec"]}
GHI_CHU_GIO_TY = ("Giờ Tý của một ngày tính từ 23:00 đêm hôm trước đến 00:59; khung 23:00–23:59 tối nay đã thuộc giờ Tý "
                  "của ngày mai (xem ở trang ngày mai).")
LUU_Y = ("Hoàng lịch là tri thức văn hoá cổ để tham khảo khi chọn ngày, không phải lời tiên đoán. "
         "Việc quan trọng vẫn nên dựa trên chuẩn bị thực tế của bạn.")


def _gz(s: str) -> str:
    return f"{_CAN[s[0]]} {_CHI[s[1]]}"


def _nk(ma: str) -> dict:
    m = KB["nghi_ky"][ma]
    return {"ma": ma, "ten": m["ten"], "nghia": m["nghia"]}


def _ts(ma: str) -> dict:
    m = KB["than_sat"][ma]
    return {"ma": ma, "ten": m["ten"], **({"nghia": m["nghia"]} if "nghia" in m else {})}


def _phuong(ma: str) -> str:
    return KB["phuong"].get(ma, ma)


def _thai(s: str) -> str:
    """'占门碓 外东南' → 'cửa, cối giã · phía ngoài Đông Nam'; '仓库厕 房内东' → 'kho, nhà vệ sinh · trong buồng, phía Đông'."""
    vi, huong = (s.split(" ") + [""])[:2]
    vi = vi.replace("占", "")
    cho, i = [], 0
    while i < len(vi):
        for n in (2, 1):
            t = vi[i:i + n]
            if t in KB["thai_chu"]:
                if KB["thai_chu"][t] and KB["thai_chu"][t] not in cho:
                    cho.append(KB["thai_chu"][t])
                i += n
                break
        else:
            i += 1
    for tien, chu in (("房内", "trong buồng, phía"), ("外", "phía ngoài"), ("内", "trong nhà, phía")):
        if huong.startswith(tien):
            p = huong[len(tien):]
            p = KB["phuong"].get(p, p) if p else ""
            vi_tri = f"{chu} {p}".strip().rstrip(",")
            return ", ".join(cho) + f" · {vi_tri}"
    return ", ".join(cho)


def tuoi(nam_sinh: int | None, thang_sinh: int | None = None, ngay_sinh: int | None = None) -> dict | None:
    if not nam_sinh:
        return None
    nam_am = nam_sinh
    if thang_sinh and ngay_sinh:
        nam_am = lunar.solar_to_lunar(ngay_sinh, thang_sinh, nam_sinh, CALENDAR_MERIDIAN_TZ)[2]
    can, chi = lunar.can_chi_nam(nam_am)
    return {"nam_am": nam_am, "can_chi": f"{can} {chi}", "han": hl.ZHI[lunar.CHI.index(chi)],
            "uoc_luong": not (thang_sinh and ngay_sinh)}


def _quan_he(chi_ngay: str, t: dict | None) -> dict | None:
    if not t:
        return None
    q = hl.quan_he_tuoi(chi_ngay, t["han"])
    return {"ma": q, **KB["quan_he_tuoi"][q]} if q else {"ma": None, "ten": "Bình thường",
                                                          "nghia": "ngày không xung không hợp với tuổi bạn"}


def _danh_gia_viec(c: dict, viec: dict) -> str:
    """tot / binh / tranh — chỉ dựa trên bảng nghi/kỵ + trực sách lịch khuyên tránh."""
    ma = set(viec["nghi"])
    if ma & set(c["ky"]) or c["truc"] in viec["tranh_truc"] or set(c["ky_dan_gian"]) & set(viec["tranh_dan_gian"]):
        return "tranh"
    # 诸事不宜: sách khuyên hoãn mọi việc lớn · 馀事勿取: chỉ làm việc ghi ở mục Nên, việc khác để ngày khác.
    if "诸事不宜" in c["ky"] or ("馀事勿取" in c["nghi"] and not (ma & set(c["nghi"]))):
        return "tranh"
    if ma & set(c["nghi"]):
        return "tot"
    return "binh"


@lru_cache(maxsize=2048)
def _calc(d: dt.date) -> dict:
    return hl.ngay(d)


def tom_tat(d: dt.date) -> dict:
    c = _calc(d)
    return {"ngay": d.isoformat(), "am": f"{c['am']['ngay']}/{c['am']['thang']}", "can_chi": _gz(c["ngay_gz"]),
            "truc": KB["truc"][c["truc"]]["ten"], "than": KB["than"][c["than"]]["ten"], "hoang_dao": c["hoang_dao"],
            "ky_dan_gian": [KB["ky_dan_gian"][k]["ten"] for k in c["ky_dan_gian"]],
            # "Ngày đẹp" chung (RULES ở engine, web chỉ hiển thị): hoàng đạo + trực tốt + không rơi ngày kỵ dân gian.
            "dep": bool(c["hoang_dao"] and c["truc"] in TRUC_TOT and not c["ky_dan_gian"]
                        and "馀事勿取" not in c["nghi"] and "诸事不宜" not in c["ky"])}


def ngay_tot_gan(d: dt.date, viec: str | None = None, t: dict | None = None, so_ngay: int = 30) -> dict | None:
    """Ngày tốt gần nhất SAU `d`: ưu tiên ngày hoàng đạo; có việc thì phải "tot" cho việc đó; không xung tuổi."""
    v = _VIEC.get(viec) if viec else None
    for can_hoang_dao in (True, False):
        for i in range(1, so_ngay + 1):
            x = d + dt.timedelta(days=i)
            c = _calc(x)
            if t and hl.quan_he_tuoi(c["ngay_gz"][1], t["han"]) == "xung":
                continue
            if can_hoang_dao and not c["hoang_dao"]:
                continue
            ok = _danh_gia_viec(c, v) == "tot" if v else (c["truc"] in TRUC_TOT and not c["ky_dan_gian"]
                                                         and "馀事勿取" not in c["nghi"] and "诸事不宜" not in c["ky"])
            if ok:
                return {**tom_tat(x), "con_ngay": i, **({"viec": v["ten"]} if v else {})}
        if not v:
            break
    return None


def _ly_do(c: dict, v: dict) -> list[str]:
    ma = set(v["nghi"])
    ra = []
    if ma & set(c["nghi"]):
        ra.append("sách lịch ghi việc này trong mục Nên")
    if ma & set(c["ky"]):
        ra.append("sách lịch ghi việc này trong mục Kiêng")
    if c["truc"] in v["tranh_truc"]:
        ra.append(f"trực {KB['truc'][c['truc']]['ten']} — sách lịch khuyên tránh việc này")
    for k in set(c["ky_dan_gian"]) & set(v["tranh_dan_gian"]):
        ra.append(f"ngày {KB['ky_dan_gian'][k]['ten']} — dân gian thường tránh")
    if "诸事不宜" in c["ky"]:
        ra.append("sách lịch khuyên hoãn mọi việc lớn trong ngày này")
    elif "馀事勿取" in c["nghi"] and not (ma & set(c["nghi"])):
        ra.append("sách lịch khuyên chỉ làm các việc ghi ở mục Nên, việc này nên hoãn sang ngày khác")
    if not ra:
        ra.append("sách lịch không ghi riêng việc này hôm nay")
    return ra


def ngay_xem(d: dt.date, nam_sinh: int | None = None, thang_sinh: int | None = None, ngay_sinh: int | None = None,
             gioi_tinh: str | None = None, viec: str | None = None) -> dict:
    c = _calc(d)
    t = tuoi(nam_sinh, thang_sinh, ngay_sinh)
    truc = KB["truc"][c["truc"]]
    gio = []
    for i, g in enumerate(c["gio"]):
        ltp = KB["ly_thuan_phong"][g["ly_thuan_phong"]]
        gio.append({"chi": _CHI[g["chi"]], "can_chi": f"{_CAN[g['can']]} {_CHI[g['chi']]}", "khung": _KHUNG[i],
                    "than": KB["than"][g["than"]]["ten"], "hoang_dao": g["hoang_dao"],
                    "xuat_hanh": {"ten": ltp["ten"], "tot": ltp["tot"], "nghia": ltp["nghia"]}})
    mai = d + dt.timedelta(days=1)
    viec_kq = None
    if viec in _VIEC:
        v = _VIEC[viec]
        viec_kq = {"ma_viec": viec, "ten": v["ten"], "danh_gia": _danh_gia_viec(c, v), "ly_do": _ly_do(c, v),
                   "ngay_tot_gan": ngay_tot_gan(d, viec, t, 60)}
    xc = c["xung"]
    return {
        "ngay": d.isoformat(), "thu": ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"][d.weekday()],
        "am": {**c["am"], "chu": f"{c['am']['ngay']}/{c['am']['thang']}{' nhuận' if c['am']['nhuan'] else ''}"},
        "can_chi": {"nam": _gz(c["nam_gz"]), "thang": _gz(c["thang_gz"]), "ngay": _gz(c["ngay_gz"])},
        "hoang_dao": c["hoang_dao"],
        "than": {"han": c["than"], **KB["than"][c["than"]]},
        "truc": {"han": c["truc"], "ten": truc["ten"], "y": truc["y"], "hop": truc["hop"], "tranh": truc["tranh"]},
        "tu": {"han": c["tu"], "ten": KB["tu"][c["tu"]], "tot": c["tu_cat"]},
        "nghi": [_nk(x) for x in c["nghi"]], "ky": [_nk(x) for x in c["ky"]],
        "cat_than": [_ts(x) for x in c["cat_than"]], "hung_sat": [_ts(x) for x in c["hung_sat"]],
        "xung_tuoi": {"ten": f"{_CAN[xc['can']]} {_CHI[xc['chi']]}", "chi": _CHI[xc["chi"]]},
        "sat": _phuong(c["sat_phuong"]),
        "banh_to": [KB["banh_to"][c["ngay_gz"][0]], KB["banh_to"][c["ngay_gz"][1]]],
        "huong": {"hy_than": _phuong(c["huong"]["hy_than"]), "tai_than": _phuong(c["huong"]["tai_than"]),
                  "phuc_than": _phuong(c["huong"]["phuc_than"])},
        "thai_than": _thai(c["thai_than"]),
        "gio": gio, "gio_hoang_dao": [g for g in gio if g["hoang_dao"]], "ghi_chu_gio_ty": GHI_CHU_GIO_TY,
        "ky_dan_gian": [{"ma": k, **KB["ky_dan_gian"][k]} for k in c["ky_dan_gian"]],
        "tuoi": ({**t, "quan_he": _quan_he(c["ngay_gz"][1], t)} if t else None),
        "viec": viec_kq,
        "ngay_mai": tom_tat(mai),
        "ngay_tot_gan": ngay_tot_gan(d, None, t),
        "danh_sach_viec": [{"ma": v["ma"], "ten": v["ten"]} for v in KB["viec"]],
        "nguon": KB["source"]["ten"], "source_id": KB["source_id"], "school_id": KB["school_id"],
        "trang_thai": KB["trang_thai"], "luu_y": LUU_Y,
    }


def thang(nam: int, thang_: int) -> dict:
    d = dt.date(nam, thang_, 1)
    ra = []
    while d.month == thang_:
        ra.append(tom_tat(d))
        d += dt.timedelta(days=1)
    return {"nam": nam, "thang": thang_, "ngay": ra}


def chon_ngay(viec: str, tu: dt.date, den: dt.date, nam_sinh: int | None = None, thang_sinh: int | None = None,
              ngay_sinh: int | None = None) -> dict:
    v = _VIEC[viec]
    t = tuoi(nam_sinh, thang_sinh, ngay_sinh)
    ra = []
    d = tu
    while d <= den:
        c = _calc(d)
        q = hl.quan_he_tuoi(c["ngay_gz"][1], t["han"]) if t else None
        if _danh_gia_viec(c, v) == "tot" and q != "xung":
            ra.append({**tom_tat(d), "quan_he_tuoi": q, "diem_cong": [x for x in (
                "hoàng đạo" if c["hoang_dao"] else None,
                f"trực {KB['truc'][c['truc']]['ten']}" if c["truc"] in TRUC_TOT else None,
                KB["quan_he_tuoi"][q]["ten"].lower() if q in ("tam_hop", "luc_hop") else None) if x]})
        d += dt.timedelta(days=1)
    ra.sort(key=lambda x: (-len(x["diem_cong"]), x["ngay"]))
    return {"viec": {"ma": viec, "ten": v["ten"]}, "tu": tu.isoformat(), "den": den.isoformat(),
            "tuoi": t, "ngay": ra, "luu_y": LUU_Y,
            "cach_chon": "Ngày có việc này trong mục Nên của sách lịch, không nằm trong mục Kiêng, trực không thuộc "
                         "nhóm sách khuyên tránh cho việc này" + (", không xung tuổi bạn" if t else "") + "."}


# ---- SEO-L2 (chủ dự án duyệt 2026-10-22): "ngày tốt {việc} tháng M/YYYY" — dùng đúng chon_ngay, không dữ liệu cá nhân --
VIEC_SEO = [{"ma": m, "slug": m.replace("_", "-"), "ten": _VIEC[m]["ten"]}
            for m in ("cuoi_hoi", "khai_truong", "nhap_trach", "dong_tho", "xuat_hanh", "mua_xe")]
_THEO_SLUG = {v["slug"]: v["ma"] for v in VIEC_SEO}


def viec_tu_slug(slug: str) -> str | None:
    return _THEO_SLUG.get(slug)


def viec_thang(viec: str, nam: int, thang_: int) -> dict:
    tu = dt.date(nam, thang_, 1)
    den = (dt.date(nam + (thang_ == 12), thang_ % 12 + 1, 1) - dt.timedelta(days=1))
    kq = chon_ngay(viec, tu, den)
    v = next(x for x in VIEC_SEO if x["ma"] == viec) if viec in _THEO_SLUG.values() else \
        {"ma": viec, "slug": viec.replace("_", "-"), "ten": _VIEC[viec]["ten"]}
    ten = v["ten"][:1].lower() + v["ten"][1:]
    ds = sorted(kq["ngay"], key=lambda x: x["ngay"])
    dmy = lambda iso: "/".join(reversed(iso.split("-")))  # noqa: E731
    am = lambda x: f"{dmy(x['ngay'])} (âm {x['am']}, {x['can_chi']})"  # noqa: E731
    l0, l1 = lunar.solar_to_lunar(1, thang_, nam, CALENDAR_MERIDIAN_TZ), lunar.solar_to_lunar(den.day, thang_, nam, CALENDAR_MERIDIAN_TZ)
    thang_am = f"từ {l0[0]}/{l0[1]}{' nhuận' if l0[3] else ''} đến {l1[0]}/{l1[1]}{' nhuận' if l1[3] else ''} âm lịch"
    dep = kq["ngay"][0] if kq["ngay"] else None
    tra_loi = (f"Tháng {thang_}/{nam} ({thang_am}) có {len(ds)} ngày tốt cho {ten} theo hoàng lịch: "
               + (", ".join(am(x) for x in ds) + "." if ds else "không có ngày nào đủ điều kiện — nên xem tháng kế tiếp.")
               + (f" Đẹp nhất: {am(dep)} — {', '.join(dep['diem_cong'])}." if dep and dep["diem_cong"] else ""))
    hd = [
        {"hoi": f"Tháng {thang_} năm {nam} ngày nào tốt để {ten}?", "dap": tra_loi},
        {"hoi": f"Chọn ngày {ten} dựa vào đâu?", "dap": kq["cach_chon"] + " Ngày nào cũng nên xem thêm có xung tuổi người chủ việc không."},
        {"hoi": f"Ngày tốt {ten} tháng {thang_}/{nam} có hợp với tuổi tôi không?",
         "dap": "Bảng này chưa xét tuổi. Nhập năm sinh trong công cụ Xem ngày tốt để bỏ các ngày xung tuổi bạn."},
    ]
    return {"viec": v, "nam": nam, "thang": thang_, "tieu_de": f"Ngày tốt {ten} tháng {thang_} năm {nam}",
            "thang_am": thang_am, "ngay": ds, "so_ngay": len(ds), "dep_nhat": dep,
            "tra_loi_nhanh": tra_loi, "hoi_dap": hd, "cach_chon": kq["cach_chon"], "luu_y": LUU_Y,
            "trang_thai": KB["trang_thai"]}
