# -*- coding: utf-8 -*-
"""TV-V2 — RULES định chuẩn giờ sinh: so lá số của các giờ ứng viên (giờ trước / đã nhập / sau, hoặc 12 canh)
bằng câu hỏi QUAN SÁT ĐƯỢC về những năm người dùng nhớ rõ. Mỗi năm: can năm phi tứ hoá vào lá của từng ứng
viên → hỏi về cung bị Hoá Kỵ nhập, cung bị Hoá Kỵ chiếu (xung) và cung Hoá Lộc nhập. Người dùng tự đối chiếu,
tự chọn giờ — engine không chọn giùm. Không gọi LLM, không lưu; Tật Ách hỏi về nhịp sinh hoạt, không hỏi sức khoẻ.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import lunar, tuvi_an_sao as az
from app.calc import tuvi_phi_hoa as ph
from app.kb import tuvi_phi_hoa_kb as kb
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
    return {"ly_do": list(ly_do_), "nam_doi_chieu": list(nam_doi_chieu), "ung_vien": ra,
            "khac_nhau": _khac_nhau(ra),
            "loi_dan": loi_dan if isinstance(loi_dan, str) and loi_dan.strip() else
            "Đọc câu hỏi của từng giờ, đánh dấu câu đúng với điều bạn nhớ; giờ khớp nhiều hơn đáng xem kỹ hơn.",
            "luu_y": luu_y or list(LUU_Y)}
