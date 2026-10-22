# -*- coding: utf-8 -*-
"""TV-V2 — RULES "Xem lá số 2 người" (tên cũ: hợp tham hai lá số): can năm người kia phi tứ hoá vào lá số của bạn
(và ngược lại khi người kia có lá đầy đủ, cộng can cung Mệnh người kia). HN-2N (chủ dự án chốt 2026-10-21): thêm
ĐIỂM THAM KHẢO hợp – khắc 0–100 (`luangiai/tuvi_hai_nguoi.py`, luật công khai) — đảo quyết định "không chấm điểm"
của 2026-09-30 CHỈ cho phần Tử vi 2 người. Không gọi LLM, không lưu ngày sinh người kia.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import dia_ly, lunar
from app.calc import tuvi_phi_hoa as ph
from app.config import Region
from app.kb import tuvi_phi_hoa_kb as kb
from app.luangiai import tuvi_hai_nguoi
from app.luangiai.tuvi_phi_hoa import MANG

QUAN_HE = {"nguoi_yeu": "Người yêu", "vo_chong": "Vợ chồng", "ban_be": "Bạn bè", "dong_nghiep": "Đồng nghiệp",
           "doi_tac": "Đối tác làm ăn", "sep": "Cấp trên", "cha_me_con": "Cha mẹ – con", "gia_dinh": "Gia đình"}
MAC_DINH = "nguoi_yeu"
_Y = {
    "Lộc": "ở mảng {chu_de}, {ai} dễ đem lại thuận lợi, sự dễ chịu.",
    "Quyền": "ở mảng {chu_de}, {ai} có xu hướng chủ động, góp ý, thúc đẩy.",
    "Khoa": "ở mảng {chu_de}, {ai} dễ mang lại sự rõ ràng, lời khuyên, sự tin cậy.",
    "Kỵ": "ở mảng {chu_de}, đây là chỗ hai người dễ bận tâm hoặc kỳ vọng khác nhau — đáng trò chuyện thẳng thắn.",
}
LUU_Y = ["Điểm hợp – khắc chỉ là tham khảo theo luật dân gian và sách Tử vi, Bát trạch; đường bay cho thấy mảng nào "
         "hai người dễ hỗ trợ nhau và mảng nào nên nói chuyện rõ hơn.",
         "Chỉ có ngày sinh thì xem một chiều (can năm người kia vào lá của bạn); thêm giờ, giới tính, nơi sinh của "
         "người kia để xem hai chiều.",
         "Không lưu ngày sinh hay kết quả của người kia."]


def vung_tu_noi_sinh(vung: Region | None, noi_sinh: str | None) -> Region | None:
    """Vùng múi giờ của người kia: `vung` khai thẳng thắng; trống mà có `noi_sinh` → suy từ tỉnh (`calc.dia_ly`, như
    đường đủ giờ). Tỉnh vắt ranh giới (Quảng Trị) → None (web hỏi thêm vùng). Tỉnh lạ → ValueError."""
    if vung is not None or not noi_sinh:
        return vung
    if noi_sinh == dia_ly.NUOC_NGOAI:
        return Region.ABROAD
    tinh = dia_ly.tra(noi_sinh)
    if tinh is None:
        raise ValueError("Nơi sinh không có trong danh sách tỉnh/thành")
    return Region(tinh["vung"]) if tinh["vung"] else None


def _tz_viet(ngay_duong: dt.date, vung: Region | None) -> float:
    """Kinh tuyến âm lịch VIỆT nơi sinh: miền Nam 1960–1975 dùng lịch UTC+8, còn lại UTC+7."""
    if vung is Region.SOUTH:
        return config.clock_offset(ngay_duong, Region.SOUTH)[0]
    return config.CALENDAR_MERIDIAN_TZ


def ngay_duong_nguoi_kia(ngay: dt.date, calendar_type: str = "duong", am_nhuan: bool = False,
                         vung: Region | None = None) -> dt.date | None:
    """Ngày dương lịch của người kia (để xét mốc Lập xuân). Ngày âm đổi như `tuvi_api._DauVao` (lịch Việt, miền Nam
    1960–1975 theo UTC+8); ngày âm không có thật (vd 30 tháng thiếu) → None (chỉ còn năm âm)."""
    if calendar_type != "am":
        return ngay

    def _doi(tz: float) -> dt.date:
        d, m, y = lunar.lunar_to_solar(ngay.day, ngay.month, ngay.year, 1 if am_nhuan else 0, tz)
        return dt.date(y, m, d)

    try:
        goc = _doi(config.CALENDAR_MERIDIAN_TZ)
        if vung is Region.SOUTH and _tz_viet(goc, vung) != config.CALENDAR_MERIDIAN_TZ:
            goc = _doi(_tz_viet(goc, vung))
    except ValueError:
        return None
    return goc


def nam_am_viet(ngay: dt.date, calendar_type: str = "duong", vung: Region | None = None, lich: str = "viet",
                noi_sinh: str | None = None, am_nhuan: bool = False) -> int:
    """Năm âm lịch (đổi tại Tết) của ngày sinh người kia — theo CÙNG lịch người dùng chọn cho lá của mình (`lich`:
    "viet" mặc định / "trung" UTC+8), như đường đủ giờ (`_DauVao`). `vung` trống → suy từ `noi_sinh`.
    `calendar_type="am"`: `ngay.year` là năm âm đã nhập (lịch Việt); lịch Trung thì đổi qua ngày dương rồi tính lại."""
    vung = vung_tu_noi_sinh(vung, noi_sinh)
    duong = ngay_duong_nguoi_kia(ngay, calendar_type, am_nhuan, vung)
    if calendar_type == "am" and (lich != "trung" or duong is None):
        return ngay.year
    tz = config.TZ_LICH_AM["trung"] if lich == "trung" else _tz_viet(duong, vung)
    return lunar.solar_to_lunar(duong.day, duong.month, duong.year, tz)[2]


def can_nam_viet(ngay: dt.date, calendar_type: str = "duong", vung: Region | None = None, lich: str = "viet",
                 noi_sinh: str | None = None, am_nhuan: bool = False) -> str:
    """Can năm sinh theo `nam_am_viet` (cùng tham số)."""
    return lunar.can_chi_nam(nam_am_viet(ngay, calendar_type, vung, lich, noi_sinh, am_nhuan))[0]


def _duong(can: str, cung: list[dict], ai: str, dung_kb: bool) -> list[dict]:
    ra = []
    for x in ph.phi_tu_can(can, cung):
        mang = MANG.get(x["den_cung"] or "", x["den_cung"] or "")
        s = kb.dien(kb.hop_tham("hoa", x["hoa"]) if dung_kb else None, cung=x["den_cung"] or "", chu_de=mang,
                    sao=x["sao"], hoa=x["hoa"])
        if not (isinstance(s, str) and s.strip()):
            s = (f"{ai[0].upper() + ai[1:]} mang Hoá {x['hoa']} ({x['sao']}) vào cung {x['den_cung']}: "
                 + kb.dien(_Y[x["hoa"]], chu_de=mang, ai=ai))
        ra.append({"hoa": x["hoa"], "sao": x["sao"], "den_cung": x["den_cung"], "xung_cung": x["xung_cung"],
                   "nghia": s})
    return ra


def _gon(ds: list[dict]) -> str:
    return ", ".join(f"{x['hoa']} vào {x['den_cung']}" for x in ds)


def lap(ls_ban: dict, can_nam_ban: str, can_nam_kia: str, quan_he: str = MAC_DINH,
        ls_kia: dict | None = None, ban: dict | None = None, kia: dict | None = None,
        trong_so: dict | None = None, ca_nhan: dict | None = None) -> dict:
    """`ls_*` = hoidap.tuvi.tom_tat(lá số). `ls_kia` chỉ có khi người kia đủ giờ + giới tính + nơi sinh.
    `ban`/`kia` = {"nam_am", "gioi_tinh"} → có thì chấm điểm tham khảo (`diem`, luật tuvi_hai_nguoi). `trong_so` /
    `ca_nhan` = tầng HỌC của hộp điểm (kiểm chứng loại `hai_nguoi`) — chỉ chọn/xếp hộp, không đổi điểm."""
    if quan_he not in QUAN_HE:
        raise ValueError(f"Quan hệ không hợp lệ: {quan_he}")
    nhan = kb.hop_tham("quan_he", quan_he)
    nhan = nhan if isinstance(nhan, str) and nhan.strip() else QUAN_HE[quan_he]
    vao_ban = _duong(can_nam_kia, ls_ban["cung"], "người kia", True)
    ban_vao = menh_vao = can_menh = None
    tom = [f"Can năm {can_nam_kia} của người kia vào lá số của bạn: {_gon(vao_ban)}."]
    if ls_kia is not None:
        ban_vao = _duong(can_nam_ban, ls_kia["cung"], "bạn", False)
        can_menh = next((c["can"] for c in ls_kia["cung"] if c["ten"] == "Mệnh"), None)
        if can_menh:
            menh_vao = _duong(can_menh, ls_ban["cung"], "người kia", True)
        tom.append(f"Can năm {can_nam_ban} của bạn vào lá số người kia: {_gon(ban_vao)}.")
        if menh_vao:
            tom.append(f"Can cung Mệnh ({can_menh}) của người kia vào lá số của bạn: {_gon(menh_vao)}.")
    tom.append(f"Quan hệ {nhan.lower()}: Lộc, Khoa thường là chỗ dễ hỗ trợ nhau; Kỵ là chỗ nên trò chuyện rõ ràng "
               "hơn.")
    diem = None
    if ban is not None and kia is not None:
        diem = tuvi_hai_nguoi.cham_diem(ban, kia, quan_he, vao_ban, ban_vao, trong_so=trong_so, ca_nhan=ca_nhan)
        tom.insert(0, f"Điểm tham khảo: {diem['tong']}/100 — {diem['nhan_muc']}.")
    luu_y = kb.hop_tham("luu_y")
    luu_y = [s for s in luu_y if isinstance(s, str)] if isinstance(luu_y, list) and luu_y else []
    return {"quan_he": quan_he, "nhan_quan_he": nhan, "can_nam_nguoi_kia": can_nam_kia,
            "nguoi_kia_vao_ban": vao_ban, "ban_vao_nguoi_kia": ban_vao,
            "can_menh_nguoi_kia": can_menh, "menh_nguoi_kia_vao_ban": menh_vao,
            "tom_tat": tom, "luu_y": (luu_y or [LUU_Y[0], LUU_Y[2]]) + ([LUU_Y[1]] if ls_kia is None else []),
            "diem": diem, "khong_cham_diem": diem is None}
