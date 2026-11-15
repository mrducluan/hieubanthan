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
from app.kb.loi import L, danh_sach
from app.luangiai import tuvi_hai_nguoi
from app.luangiai.tuvi_phi_hoa import MANG, la_viet, mang, mang_ngan, tc, th, ts

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


def _luu_y(i: int) -> str:
    return L(f"tv2.ht.luu_y.{i}", LUU_Y[i])


def vung_tu_noi_sinh(vung: Region | None, noi_sinh: str | None) -> Region | None:
    """Vùng múi giờ của người kia: `vung` khai thẳng thắng; trống mà có `noi_sinh` → suy từ tỉnh (`calc.dia_ly`, như
    đường đủ giờ). Tỉnh vắt ranh giới (Quảng Trị) → None (web hỏi thêm vùng). Tỉnh lạ → ValueError."""
    if vung is not None or not noi_sinh:
        return vung
    if noi_sinh == dia_ly.NUOC_NGOAI:
        return Region.ABROAD
    tinh = dia_ly.tra(noi_sinh)
    if tinh is None:
        raise ValueError(L("tv2.ht.loi.noi_sinh", "Nơi sinh không có trong danh sách tỉnh/thành"))
    return Region(tinh["vung"]) if tinh["vung"] else None


def _tz_viet(ngay_duong: dt.date, vung: Region | None) -> float:
    """Kinh tuyến âm lịch VIỆT nơi sinh: miền Nam 1960–1975 dùng lịch UTC+8, còn lại UTC+7."""
    if vung is Region.SOUTH:
        return config.tz_lich_am(ngay_duong, Region.SOUTH)
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


_MA_HOA = {"Lộc": "loc", "Quyền": "quyen", "Khoa": "khoa", "Kỵ": "ky"}
_AI = {"người kia": "nguoi_kia", "bạn": "ban"}


def _duong(can: str, cung: list[dict], ai: str, dung_kb: bool) -> list[dict]:
    ra = []
    for x in ph.phi_tu_can(can, cung):
        mang_ = mang(x["den_cung"]) if x["den_cung"] else (x["den_cung"] or "")
        s = kb.dien(kb.hop_tham("hoa", x["hoa"]) if dung_kb else None, cung=tc(x["den_cung"]) if x["den_cung"] else "",
                    chu_de=mang_, sao=ts(x["sao"]), hoa=th(x["hoa"]))
        if not (isinstance(s, str) and s.strip()):
            ai_ = L(f"tv2.ht.ai.{_AI[ai]}", ai) if ai in _AI else ai
            vai = _AI.get(ai, "nguoi_kia")
            s = (L(f"tv2.ht.mac.dau.{vai}", "{Ai} mang Hoá {hoa} ({sao}) vào cung {cung}: ", Ai=ai_[0].upper() + ai_[1:],
                   hoa=th(x["hoa"]), sao=ts(x["sao"]), cung=tc(x["den_cung"]) if x["den_cung"] else "None")
                 + kb.dien(L(f"tv2.ht.y.{_MA_HOA[x['hoa']]}.{vai}", _Y[x["hoa"]]), chu_de=mang_, ai=ai_))
        ra.append({"hoa": x["hoa"], "sao": x["sao"], "den_cung": x["den_cung"], "xung_cung": x["xung_cung"],
                   "nghia": s})
    return ra


_NGAN = {"Thiên Di": "đi xa"}      # nhãn ngắn đọc được trong câu ("chuyện ra ngoài" → "chuyện đi xa")


def _mang(ds: list[dict], hoa: tuple[str, ...]) -> list[str]:
    """Mảng đời sống (không tên cung) nơi các sao hoá trong `hoa` rơi vào — giữ thứ tự, không lặp."""
    ra: list[str] = []
    for x in ds:
        m = _NGAN.get(x["den_cung"] or "") or MANG.get(x["den_cung"] or "", "").split(",")[0]
        if x["hoa"] in hoa and m and m not in ra:
            ra.append(m)
    return ra


def _noi(ds: list[str]) -> str:
    return ds[0] if len(ds) == 1 else ", ".join(ds[:-1]) + " và " + ds[-1]


def _cung_mang(ds: list[dict], hoa: tuple[str, ...]) -> list[str]:
    """Như `_mang` nhưng trả MÃ cung (để ghép lời theo ngôn ngữ) — cùng thứ tự, cùng cách bỏ lặp."""
    ra: list[str] = []
    for x in ds:
        c = x["den_cung"] or ""
        if x["hoa"] in hoa and c in MANG and c not in ra:
            ra.append(c)
    return ra


# EN-ALL GĐ 4 — vai trong câu tóm tắt (`_gon`): mã → (chủ ngữ, sở hữu, đại từ) tiếng Anh qua `L`.
_VAI = {("năm sinh của người ấy", "của bạn"): "kia_ban", ("năm sinh của bạn", "của người ấy"): "ban_kia",
        ("cách sống của người ấy", "của bạn"): "menh_kia_ban"}


def _gon_en(ds: list[dict], ai: str, cua: str) -> str:
    """Bản tiếng Anh của `_gon`: cùng các mảng (theo mã cung), cùng thứ tự vế, ngữ pháp tiếng Anh."""
    vai = _VAI[(ai, cua)]
    ai_hoa = L(f"tv2.ht.gon.ai.{vai}", ai[0].upper() + ai[1:])
    cua_ = L(f"tv2.ht.gon.cua.{vai}", cua)          # "your" / "their"
    chinh = L(f"tv2.ht.gon.chinh.{vai}", cua)       # "you yourself" / "them personally"
    tot, ky = _cung_mang(ds, ("Lộc", "Quyền", "Khoa")), _cung_mang(ds, ("Kỵ",))
    ca_hai = [m for m in ky if m in tot]
    tot = [m for m in tot if m not in ca_hai]
    ky = [m for m in ky if m not in ca_hai]

    def _ve(ds_m: list[str]) -> str:
        con = [m for m in ds_m if m != "Mệnh"]
        phan = ([chinh] if "Mệnh" in ds_m else []) + (
            [L("tv2.ht.gon.mang", "{cua} {ds}", cua=cua_, ds=danh_sach([mang_ngan(m).lower() for m in con]))]
            if con else [])
        return danh_sach(phan)

    ve = []
    if tot:
        ve.append(L("tv2.ht.gon.tot", "{Ai} dễ đem thuận lợi tới {ve}", Ai=ai_hoa, ve=_ve(tot)))
    if ca_hai:
        ve.append(L("tv2.ht.gon.ca_hai_rieng", "riêng {ve} vừa có chỗ đỡ vừa cần nói rõ", ve=_ve(ca_hai)) if tot
                  else L("tv2.ht.gon.ca_hai", "{Ai} chạm vào {ve} vừa có chỗ đỡ vừa cần nói rõ", Ai=ai_hoa,
                         ve=_ve(ca_hai)))
    if ky:
        ve.append(L("tv2.ht.gon.ky_sau", "chỗ nên trò chuyện rõ hơn là {ve}", ve=_ve(ky)) if ve
                  else L("tv2.ht.gon.ky", "{Ai} chạm vào {ve} — chỗ nên trò chuyện rõ hơn", Ai=ai_hoa, ve=_ve(ky)))
    if not ve:
        return L("tv2.ht.gon.khong", "{Ai} ít tạo thay đổi rõ ở các mảng của {chu}.", Ai=ai_hoa, chu=cua_)
    cau = "; ".join(ve)
    return cau[0].upper() + cau[1:] + "."


def _gon(ds: list[dict], ai: str, cua: str) -> str:
    """EN-2 (P2-16): một câu đời thường theo MẢNG — Lộc/Quyền/Khoa là chỗ dễ đỡ nhau, Kỵ là chỗ nên nói rõ. Tên can,
    sao hoá, cung chỉ ở danh sách đường bay chi tiết (cho người rành Tử vi). Mảng vừa có chỗ đỡ vừa có Kỵ → nói cả hai
    trong một vế (không liệt kê hai lần); cung Mệnh nói "chính bạn / chính người ấy"."""
    if not la_viet():
        return _gon_en(ds, ai, cua)
    tot, ky = _mang(ds, ("Lộc", "Quyền", "Khoa")), _mang(ds, ("Kỵ",))
    ca_hai = [m for m in ky if m in tot]
    tot = [m for m in tot if m not in ca_hai]
    ky = [m for m in ky if m not in ca_hai]
    ai_hoa = ai[0].upper() + ai[1:]
    chu = cua.removeprefix("của ")

    def _ve(ds_m: list[str]) -> str:
        chinh = "bản thân" in ds_m
        con = [m for m in ds_m if m != "bản thân"]
        phan = ([f"chính {chu}"] if chinh else []) + ([f"chuyện {_noi(con)} {cua}"] if con else [])
        return ", ".join(phan)

    ve = []
    if tot:
        ve.append(f"{ai_hoa} dễ đem thuận lợi tới {_ve(tot)}")
    if ca_hai:
        ve.append(("riêng " if tot else f"{ai_hoa} chạm vào ") + f"{_ve(ca_hai)} vừa có chỗ đỡ vừa cần nói rõ")
    if ky:
        ve.append(f"chỗ nên trò chuyện rõ hơn là {_ve(ky)}" if ve else f"{ai_hoa} chạm vào {_ve(ky)} — chỗ nên trò "
                  "chuyện rõ hơn")
    if not ve:
        return f"{ai_hoa} ít tạo thay đổi rõ ở các mảng của {chu}."
    cau = "; ".join(ve)
    return cau[0].upper() + cau[1:] + "."


def lap(ls_ban: dict, can_nam_ban: str, can_nam_kia: str, quan_he: str = MAC_DINH,
        ls_kia: dict | None = None, ban: dict | None = None, kia: dict | None = None,
        trong_so: dict | None = None, ca_nhan: dict | None = None) -> dict:
    """`ls_*` = hoidap.tuvi.tom_tat(lá số). `ls_kia` chỉ có khi người kia đủ giờ + giới tính + nơi sinh.
    `ban`/`kia` = {"nam_am", "gioi_tinh"} → có thì chấm điểm tham khảo (`diem`, luật tuvi_hai_nguoi). `trong_so` /
    `ca_nhan` = tầng HỌC của hộp điểm (kiểm chứng loại `hai_nguoi`) — chỉ chọn/xếp hộp, không đổi điểm."""
    if quan_he not in QUAN_HE:
        raise ValueError(L("tv2.loi.quan_he", "Quan hệ không hợp lệ: {quan_he}", quan_he=quan_he))
    nhan = kb.hop_tham("quan_he", quan_he)
    nhan = nhan if isinstance(nhan, str) and nhan.strip() else L(f"tv2.ht.quan_he.{quan_he}", QUAN_HE[quan_he])
    vao_ban = _duong(can_nam_kia, ls_ban["cung"], "người kia", True)
    ban_vao = menh_vao = can_menh = None
    tom = [_gon(vao_ban, "năm sinh của người ấy", "của bạn")]
    if ls_kia is not None:
        ban_vao = _duong(can_nam_ban, ls_kia["cung"], "bạn", False)
        can_menh = next((c["can"] for c in ls_kia["cung"] if c["ten"] == "Mệnh"), None)
        if can_menh:
            menh_vao = _duong(can_menh, ls_ban["cung"], "người kia", True)
        tom.append(_gon(ban_vao, "năm sinh của bạn", "của người ấy"))
        if menh_vao:
            tom.append(_gon(menh_vao, "cách sống của người ấy", "của bạn"))
    tom.append(L("tv2.ht.ket", "Với quan hệ {quan_he}, chỗ thuận là nơi dễ đỡ nhau; chỗ nên trò chuyện rõ hơn không "
                 "phải điều xấu — là nơi hai người dễ kỳ vọng khác nhau.", quan_he=nhan.lower()))
    diem = None
    if ban is not None and kia is not None:
        diem = tuvi_hai_nguoi.cham_diem(ban, kia, quan_he, vao_ban, ban_vao, trong_so=trong_so, ca_nhan=ca_nhan)
        tom.insert(0, L("tv2.ht.diem", "Điểm tham khảo: {tong}/100 — {muc}.", tong=diem["tong"], muc=diem["nhan_muc"]))
    luu_y = kb.hop_tham("luu_y")
    luu_y = [s for s in luu_y if isinstance(s, str)] if isinstance(luu_y, list) and luu_y else []
    return {"quan_he": quan_he, "nhan_quan_he": nhan, "can_nam_nguoi_kia": can_nam_kia,
            "nguoi_kia_vao_ban": vao_ban, "ban_vao_nguoi_kia": ban_vao,
            "can_menh_nguoi_kia": can_menh, "menh_nguoi_kia_vao_ban": menh_vao,
            "tom_tat": tom, "luu_y": (luu_y or [_luu_y(0), _luu_y(2)]) + ([_luu_y(1)] if ls_kia is None else []),
            "diem": diem, "khong_cham_diem": diem is None,
            # TV-YBS đợt 4: hộp diễn giải từ ý Tử vi bổ sung (Phu Thê / Mệnh hai lá) — KHÔNG tính vào điểm.
            "cach_doc_them": tuvi_hai_nguoi.cach_doc_them(ls_ban, ls_kia, quan_he, (ban or {}).get("gioi_tinh"),
                                                          (kia or {}).get("gioi_tinh"))}
