# -*- coding: utf-8 -*-
"""TV-V2 — RULES định chuẩn giờ sinh: so lá số của các giờ ứng viên (giờ trước / đã nhập / sau, hoặc 12 canh)
bằng câu hỏi QUAN SÁT ĐƯỢC về những năm người dùng nhớ rõ. Mỗi năm: can năm phi tứ hoá vào lá của từng ứng
viên → hỏi về cung bị Hoá Kỵ nhập, cung bị Hoá Kỵ chiếu (xung) và cung Hoá Lộc nhập. Người dùng tự đối chiếu,
tự chọn giờ — engine không chọn giùm. Không gọi LLM, không lưu; Tật Ách hỏi về nhịp sinh hoạt, không hỏi sức khoẻ.
"""
from __future__ import annotations

import datetime as dt
import re

from app import config, ngon_ngu
from app.calc import lunar, tuvi_an_sao as az
from app.calc import tuvi_phi_hoa as ph
from app.kb import tuvi_phi_hoa_kb as kb
from app.kb import ten as _ten
from app.kb.loi import L
from app.luangiai import tuvi_hien
from app.luangiai.tuvi_phi_hoa import MANG

TOI_DA_NAM = 3
_MAC_DINH = {
    "Kỵ": "Năm {nam}, chuyện {mang} (cung {cung}) của bạn có điều gì phải bận tâm, xoay xở hay thay đổi đáng nhớ không?",
    "Lộc": "Năm {nam}, chuyện {mang} (cung {cung}) của bạn có điều gì thuận lợi, được thêm hay mở ra đáng nhớ không?",
}
LUU_Y = ["Đây là gợi ý để bạn tự đối chiếu: giờ nào có nhiều câu trả lời \"đúng\" hơn thì đáng xem kỹ hơn — "
         "không phải kết luận.",
         "Chỉ chọn những năm bạn nhớ rõ; câu hỏi nói về xu hướng của năm, không hỏi chi tiết riêng tư.",
         "Không lưu giờ sinh, năm đối chiếu hay câu trả lời của bạn."]


def khoang_gio(chi: int) -> str:
    """Khoảng giờ đồng hồ (kinh tuyến lịch) của canh giờ `chi` (0 = Tý)."""
    bd = (2 * chi - 1) % 24
    return f"{bd:02d}:00–{(bd + 1) % 24:02d}:59"


def khoang_canh(ti: int, lech_phut: int = 0) -> str:
    """Khoảng giờ của chỉ số giờ `ti` (như time_index: 0 = Tý sớm 00:00–00:59, 12 = Tý muộn 23:00–23:59),
    dời thêm `lech_phut` = giờ đồng hồ nơi sinh − giờ kinh tuyến lịch (UTC+7). lech 0 → giờ lịch."""
    if ti == 0:
        bd, dai = 0, 60
    elif ti == 12:
        bd, dai = 23 * 60, 60
    else:
        bd, dai = (2 * ti - 1) * 60, 120
    a = (bd + lech_phut) % 1440
    b = (a + dai - 1) % 1440
    return f"{a // 60:02d}:{a % 60:02d}–{b // 60:02d}:{b % 60:02d}"


def nhan_ty_muon(lech_phut: int = 0) -> str:
    """Nhãn ứng viên Tý muộn theo khoảng giờ ĐỒNG HỒ nơi sinh (lệch 0 → 23:00–23:59 như giờ lịch)."""
    return f"Giờ Tý muộn ({khoang_canh(12, lech_phut)})"


def ly_do(gio: int, phut: int, do_tin_gio: str) -> list[str]:
    """Vì sao nên định giờ: phút trong 15 phút đầu/cuối canh giờ, giờ áng chừng, hoặc không biết giờ."""
    ra = []
    lech = (gio * 60 + phut - 60) % 120               # phút tính từ đầu canh (canh bắt đầu ở giờ lẻ)
    if lech < 15 or lech >= 105:
        ra.append("gan_ranh_gio")
    if do_tin_gio == "approx":
        ra.append("ang_chung")
    if do_tin_gio == "unknown":
        ra.append("khong_biet")
    return ra


def nam_mac_dinh(hom_nay: dt.date) -> list[int]:
    """3 năm âm lịch (Việt) gần nhất đã qua."""
    y = lunar.solar_to_lunar(hom_nay.day, hom_nay.month, hom_nay.year, config.CALENDAR_MERIDIAN_TZ)[2]
    return [y - 3, y - 2, y - 1]


def _cau(hoa: str, cung: str, nam: int) -> str:
    b = {"nam": str(nam), "cung": cung, "mang": MANG.get(cung, cung)}
    return kb.dien(kb.dinh_gio_cau_hoi(cung), **b) or kb.dien(_MAC_DINH[hoa], **b)


def _ls(sinh: dict) -> dict:
    from app.hoidap.tuvi import tom_tat          # tránh vòng import
    return tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN",
                                 tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                                 hoa_linh=sinh.get("hoa_linh", "viet"),
                                 thang_nhuan=sinh.get("thang_nhuan", "thang_sau"), lich=sinh.get("lich", "viet")))


def _nam(ls: dict, nam: int) -> dict:
    can, chi = lunar.can_chi_nam(nam)
    bay = {x["hoa"]: x for x in ph.phi_tu_can(can, ls["cung"])}
    hoi, da = [], set()
    for hoa, cung, cach in (("Kỵ", bay["Kỵ"]["den_cung"], "nhap"), ("Kỵ", bay["Kỵ"]["xung_cung"], "chieu"),
                            ("Lộc", bay["Lộc"]["den_cung"], "nhap")):
        if cung and cung not in da:
            da.add(cung)
            hoi.append({"hoa": hoa, "cung": cung, "cach": cach, "noi_dung": _cau(hoa, cung, nam)})
    return {"nam": nam, "can_chi": f"{can} {chi}", "cau_hoi": hoi}


def _menh(u: dict) -> str:
    m = u["cung_menh"]
    return f"{m['chi']} ({', '.join(m['chinh_tinh']) or 'vô chính diệu'})"


def _khac_nhau(uv: list[dict]) -> list[str]:
    if len(uv) < 2:
        return ["Chỉ có một giờ để xem: thêm giờ trước và giờ sau để so lá số."]
    ra = []
    for nhan, lay in (("Cung Mệnh", _menh), ("Cục", lambda u: u["cuc"]), ("Thân cư", lambda u: u["than_cu"])):
        gt = [lay(u) for u in uv]
        if len(set(gt)) > 1:
            ra.append(f"{nhan}: " + " · ".join(f"{u['nhan']} {v}" for u, v in zip(uv, gt)))
    if not ra:
        ra.append("Mệnh, Cục và Thân giống nhau giữa các giờ — khác biệt nằm ở vị trí các sao phụ.")
    return ra


def lap(ung_vien: list[dict], nam_doi_chieu: list[int], ly_do_: list[str]) -> dict:
    """`ung_vien` = [{"nhan", "gio_dai_dien", "la_gio_nhap", "sinh": {ngay, ti, gioi_tinh, …}, "dau_vao"?,
    "lech_phut"? (đồng hồ nơi sinh − kinh tuyến lịch, phút; mặc định 0), "ngay_duong"? (ngày dương theo đồng hồ
    người dùng, ISO), "ghi_chu"?}].
    `khoang_gio` = khoảng giờ theo kinh tuyến lịch UTC+7; `khoang_gio_dong_ho` = cùng canh đó trên đồng hồ nơi sinh."""
    if len(nam_doi_chieu) > TOI_DA_NAM:
        raise ValueError(f"Tối đa {TOI_DA_NAM} năm đối chiếu")
    ra = []
    for u in ung_vien:
        ls = _ls(u["sinh"])
        menh = next(c for c in ls["cung"] if c["ten"] == "Mệnh")
        ti = u["sinh"]["ti"]
        lech = int(u.get("lech_phut", 0))
        x = {"nhan": u["nhan"], "chi_gio": lunar.CHI[ti % 12], "khoang_gio": khoang_canh(ti),
             "khoang_gio_dong_ho": khoang_canh(ti, lech), "lech_gio_lich": lech != 0,
             "gio_dai_dien": u["gio_dai_dien"], "la_gio_nhap": u["la_gio_nhap"],
             "cung_menh": {"chi": menh["chi"], "chinh_tinh": [s["ten"] for s in menh["chinh_tinh"]]},
             "cuc": ls["cuc"], "than_cu": next((c["ten"] for c in ls["cung"] if c["la_than"]), None),
             "nam": [_nam(ls, n) for n in nam_doi_chieu]}
        if u.get("ngay_duong"):
            x["ngay_duong"] = u["ngay_duong"]
        if "dau_vao" in u:
            x["dau_vao"] = u["dau_vao"]
        if u.get("ghi_chu"):
            x["ghi_chu"] = u["ghi_chu"]
        ra.append(x)
    luu_y = kb.dinh_gio("luu_y")
    luu_y = [s for s in luu_y if isinstance(s, str)] if isinstance(luu_y, list) else []
    loi_dan = kb.dinh_gio("loi_dan")
    kq = {"ly_do": list(ly_do_), "nam_doi_chieu": list(nam_doi_chieu), "ung_vien": ra,
          "khac_nhau": _khac_nhau(ra),
          "loi_dan": loi_dan if isinstance(loi_dan, str) and loi_dan.strip() else
          "Đọc câu hỏi của từng giờ, đánh dấu câu đúng với điều bạn nhớ; giờ khớp nhiều hơn đáng xem kỹ hơn.",
          "luu_y": luu_y or list(LUU_Y)}
    return kq if ngon_ngu.la_viet() else _dich(kq)


# ------------------------------------------------------------------ EN-ALL GĐ 4: bản ngôn ngữ khác (lớp hiển thị)
def _nhan(s: str) -> str:
    """Nhãn ứng viên (dựng ở tuvi_v2_api) → chữ theo ngôn ngữ."""
    co_dinh = {"Giờ trước": "tuvi_ls.dg.gio_truoc", "Giờ đã nhập": "tuvi_ls.dg.gio_nhap", "Giờ sau": "tuvi_ls.dg.gio_sau"}
    if s in co_dinh:
        return L(co_dinh[s], s)
    m = re.fullmatch(r"Giờ Tý muộn \((.+)\)", s)
    if m:
        return L("tuvi_ls.dg.ty_muon", s, khoang=m.group(1))
    m = re.fullmatch(r"Giờ (\S+) \(giờ lịch ngày hôm trước\)", s)
    if m:
        return L("tuvi_ls.dg.gio_hom_truoc", s, chi=_ten.ten("chi", m.group(1)))
    m = re.fullmatch(r"Giờ (\S+)", s)
    if m and _ten.muc("chi", m.group(1)):
        return L("tuvi_ls.dg.gio", s, chi=_ten.ten("chi", m.group(1)))
    return s


def _gio_lich(s: str) -> str:
    """"23:30 ngày 31/12/1979" → "23:30 on 31/12/1979" (giữ số)."""
    return s.replace(" ngày ", " · ")


def _ghi_chu(s: str) -> str:
    m = re.fullmatch(r"Giờ bạn nhập rơi vào Tý muộn \((\S+)\): .+?Tý sớm \((\S+)\) của cùng ngày\.", s)
    if m:
        return L("tuvi_ls.dg.ghi_chu.ty_muon", s, khoang=m.group(1), khoang_som=m.group(2))
    m = re.fullmatch(r"Giờ bạn nhập rơi vào Tý muộn \((\S+) giờ đồng hồ\): .+?Tý sớm \((\S+) giờ đồng hồ\) của cùng ngày\.", s)
    if m:
        return L("tuvi_ls.dg.ghi_chu.ty_muon_dong_ho", s, khoang=m.group(1), khoang_som=m.group(2))
    m = re.fullmatch(r"Giờ bạn nhập \((\S+) giờ đồng hồ\) theo giờ lịch là (.+?) — Tý muộn\. .+?Tý sớm \((\S+) giờ đồng hồ\) của ngày này\.", s)
    if m:
        return L("tuvi_ls.dg.ghi_chu.ty_muon_hom_truoc", s, dong_ho=m.group(1), lich=_gio_lich(m.group(2)),
                 khoang_som=m.group(3))
    m = re.fullmatch(r"Giờ bạn nhập theo giờ lịch là (.+)\.", s)
    if m:
        return L("tuvi_ls.dg.ghi_chu.hom_truoc", s, lich=_gio_lich(m.group(1)))
    return s


def _cau_dich(h: dict, nam: int) -> str:
    cung, ma_c = h["cung"], tuvi_hien.ma(h["cung"])
    if kb.dinh_gio_cau_hoi(cung):
        return L(f"tuvi_ls.dg.hoi.cung.{ma_c}", h["noi_dung"], nam=str(nam))
    return L(f"tuvi_ls.dg.hoi.{tuvi_hien.ma(h['hoa'])}", h["noi_dung"], nam=str(nam),
             mang=L(f"tuvi_ls.dg.mang.{ma_c}", cung), cung=_ten.ten("cung", cung))


def _khac_nhau_dich(uv: list[dict], vi: list[dict]) -> list[str]:
    """Như `_khac_nhau` (quyết định so trên giá trị bản Việt `vi`), chữ theo ngôn ngữ."""
    if len(uv) < 2:
        return [L("tuvi_ls.dg.mot_gio", "")]

    def menh(u: dict) -> str:
        m = u["cung_menh"]
        sao = ", ".join(_ten.ten("sao", x) for x in m["chinh_tinh"]) or L("tuvi_ls.dg.vo_chinh_dieu", "vô chính diệu")
        return f"{_ten.ten('chi', m['chi'])} ({sao})"

    ra = []
    for ma, lay_vi, lay in (("tuvi_ls.dg.cung_menh", _menh, menh),
                            ("tuvi_ls.dg.cuc", lambda u: u["cuc"], lambda u: _ten.ten("cuc", u["cuc"])),
                            ("tuvi_ls.dg.than_cu", lambda u: u["than_cu"], lambda u: _ten.ten("cung", u["than_cu"] or ""))):
        if len({lay_vi(u) for u in vi}) > 1:
            ra.append(f"{L(ma, '')}: " + " · ".join(f"{_nhan(u['nhan'])} → {lay(u)}" for u in uv))
    if not ra:
        ra.append(L("tuvi_ls.dg.giong_nhau", ""))
    return ra


def _dich(kq: dict) -> dict:
    vi = kq["ung_vien"]
    uv = []
    for u in vi:
        x = {**u, "nhan": _nhan(u["nhan"]),
             "nam": [{**n, "can_chi": tuvi_hien.can_chi(n["can_chi"]),
                      "cau_hoi": [{**h, "noi_dung": _cau_dich(h, n["nam"])} for h in n["cau_hoi"]]} for n in u["nam"]]}
        if u.get("ghi_chu"):
            x["ghi_chu"] = _ghi_chu(u["ghi_chu"])
        uv.append(x)
    return {**kq, "ung_vien": uv, "khac_nhau": _khac_nhau_dich(vi, vi),
            "loi_dan": L("tuvi_ls.dg.loi_dan", kq["loi_dan"]),
            "luu_y": [L(f"tuvi_ls.dg.luu_y.{i + 1}", s) for i, s in enumerate(kq["luu_y"])]}
