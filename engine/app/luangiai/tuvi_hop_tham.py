# -*- coding: utf-8 -*-
"""TV-V2 — RULES "Xem lá số 2 người" (tên cũ: hợp tham hai lá số): can năm người kia phi tứ hoá vào lá số của bạn
(và ngược lại khi người kia có lá đầy đủ, cộng can cung Mệnh người kia). HN-2N (chủ dự án chốt 2026-10-21): thêm
ĐIỂM THAM KHẢO hợp – khắc 0–100 (`luangiai/tuvi_hai_nguoi.py`, luật công khai) — đảo quyết định "không chấm điểm"
của 2026-09-30 CHỈ cho phần Tử vi 2 người. Không gọi LLM, không lưu ngày sinh người kia.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import lunar
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


def nam_am_viet(ngay: dt.date, calendar_type: str = "duong", vung: Region | None = None) -> int:
    """Năm âm lịch VIỆT của ngày sinh (năm đổi tại Tết). `calendar_type="am"`: `ngay.year` là năm âm."""
    if calendar_type == "am":
        return ngay.year
    tz = config.CALENDAR_MERIDIAN_TZ
    if vung is Region.SOUTH:
        tz = config.clock_offset(ngay, Region.SOUTH)[0]     # miền Nam 1960–1975 dùng lịch UTC+8
    return lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, tz)[2]


def can_nam_viet(ngay: dt.date, calendar_type: str = "duong", vung: Region | None = None) -> str:
    """Can năm sinh theo âm lịch VIỆT (năm đổi tại Tết). `calendar_type="am"`: `ngay.year` là năm âm."""
    return lunar.can_chi_nam(nam_am_viet(ngay, calendar_type, vung))[0]


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
        ls_kia: dict | None = None, ban: dict | None = None, kia: dict | None = None) -> dict:
    """`ls_*` = hoidap.tuvi.tom_tat(lá số). `ls_kia` chỉ có khi người kia đủ giờ + giới tính + nơi sinh.
    `ban`/`kia` = {"nam_am", "gioi_tinh"} → có thì chấm điểm tham khảo (`diem`, luật tuvi_hai_nguoi)."""
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
        diem = tuvi_hai_nguoi.cham_diem(ban, kia, quan_he, vao_ban, ban_vao)
        tom.insert(0, f"Điểm tham khảo: {diem['tong']}/100 — {diem['nhan_muc']}.")
    luu_y = kb.hop_tham("luu_y")
    luu_y = [s for s in luu_y if isinstance(s, str)] if isinstance(luu_y, list) and luu_y else []
    return {"quan_he": quan_he, "nhan_quan_he": nhan, "can_nam_nguoi_kia": can_nam_kia,
            "nguoi_kia_vao_ban": vao_ban, "ban_vao_nguoi_kia": ban_vao,
            "can_menh_nguoi_kia": can_menh, "menh_nguoi_kia_vao_ban": menh_vao,
            "tom_tat": tom, "luu_y": (luu_y or [LUU_Y[0], LUU_Y[2]]) + ([LUU_Y[1]] if ls_kia is None else []),
            "diem": diem, "khong_cham_diem": diem is None}
