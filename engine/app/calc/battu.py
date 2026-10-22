# -*- coding: utf-8 -*-
"""Bát tự (Tứ trụ) — tầng CALC, tất định, không LLM/DB/mạng.

- Trụ năm đổi tại Lập xuân, trụ tháng đổi tại 12 tiết (节) — thời điểm từ app.calc.tietkhi.
- Trụ ngày theo ngày Julius; ranh giới giờ Tý theo TY_BOUNDARY_POLICY (đã chốt SWITCH_AT_0000):
  sinh 23:00–23:59 thuộc NGÀY HÔM ĐÓ; trụ giờ là Tý của ngày sau (dạ Tý — như lunar sect 2) → gắn cờ.
- Đại vận: thuận khi (can năm dương, nam) hoặc (can năm âm, nữ); tuổi khởi vận theo số phút tới
  tiết gần nhất (4320 phút = 1 năm, 360 = 1 tháng, 12 = 1 ngày, 1 phút = 2 giờ — cách "sect 2").
- Ngũ hành / thân vượng nhược dùng THANG ĐIỂM CÔNG BỐ Ở ĐÂY (THANG_DIEM) — một cách trong nhiều cách.
- Dụng thần: trình bày CẢ HAI hướng (phù ức / điều hậu kiểu Trích Thiên Tuỷ, cách cục theo nguyệt
  lệnh kiểu Tử Bình Chân Thuyên) và KHÔNG tự chọn (`chon` = None).
Golden: fixtures/golden/battu.json (oracle lunar-typescript, chỉ dùng khi sinh golden).
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import tietkhi as tk
from app.calc import timebase
from app.calc.kinhdich_vendor import KHAC, SINH
from app.calc.lunar import CAN, CHI

CAN_NH = ["Mộc", "Mộc", "Hỏa", "Hỏa", "Thổ", "Thổ", "Kim", "Kim", "Thủy", "Thủy"]
CHI_NH = ["Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"]
TANG_CAN = {   # bản khí → trung khí → dư khí
    "Tý": ["Quý"], "Sửu": ["Kỷ", "Quý", "Tân"], "Dần": ["Giáp", "Bính", "Mậu"], "Mão": ["Ất"],
    "Thìn": ["Mậu", "Ất", "Quý"], "Tỵ": ["Bính", "Canh", "Mậu"], "Ngọ": ["Đinh", "Kỷ"],
    "Mùi": ["Kỷ", "Đinh", "Ất"], "Thân": ["Canh", "Nhâm", "Mậu"], "Dậu": ["Tân"],
    "Tuất": ["Mậu", "Tân", "Đinh"], "Hợi": ["Nhâm", "Giáp"],
}
THANG_DIEM = {"thien_can": 1.0, "tang_can": {1: [1.0], 2: [0.7, 0.3], 3: [0.6, 0.3, 0.1]},
              "he_so_nguyet_lenh": 2.0, "vuong_tu": 0.55, "nhuoc_duoi": 0.45,
              "mo_ta": ("Mỗi thiên can 1 điểm; mỗi địa chi chia theo tàng can (1 / 0,7+0,3 / 0,6+0,3+0,1); "
                        "chi tháng (nguyệt lệnh) nhân 2. Tỉ lệ = (điểm hành nhật chủ + hành sinh nhật chủ) / tổng; "
                        "≥ 0,55 vượng, ≤ 0,45 nhược, giữa là trung hoà.")}
LUC_XUNG = {frozenset(p) for p in [("Tý", "Ngọ"), ("Sửu", "Mùi"), ("Dần", "Thân"), ("Mão", "Dậu"),
                                   ("Thìn", "Tuất"), ("Tỵ", "Hợi")]}
LUC_HOP = {frozenset(p) for p in [("Tý", "Sửu"), ("Dần", "Hợi"), ("Mão", "Tuất"), ("Thìn", "Dậu"),
                                  ("Tỵ", "Thân"), ("Ngọ", "Mùi")]}
SAT_TIET_GIO = 2          # sinh cách tiết ≤ 2 giờ → trụ tháng/năm nhạy với sai số giờ sinh


def _nh_can(c: str) -> str:
    return CAN_NH[CAN.index(c)]


def thap_than(nhat_chu: str, can: str) -> str:
    """Thập thần của `can` so với nhật chủ (ngũ hành + âm dương)."""
    a, b = CAN.index(nhat_chu), CAN.index(can)
    na, nb = CAN_NH[a], CAN_NH[b]
    cung = (a % 2) == (b % 2)
    if na == nb:
        return "Tỷ Kiên" if cung else "Kiếp Tài"
    if SINH[na] == nb:
        return "Thực Thần" if cung else "Thương Quan"
    if KHAC[na] == nb:
        return "Thiên Tài" if cung else "Chính Tài"
    if KHAC[nb] == na:
        return "Thất Sát" if cung else "Chính Quan"
    return "Thiên Ấn" if cung else "Chính Ấn"


def _gz(i: int) -> dict:
    return {"can": CAN[i % 10], "chi": CHI[i % 12]}


def _chi_so_60(can_i: int, chi_i: int) -> int:
    return (6 * can_i - 5 * chi_i) % 60


def _cong_thoi_gian(d: dt.datetime, nam: int, thang: int, ngay: int, gio: int) -> dt.datetime:
    m = d.month - 1 + thang
    y, m = d.year + nam + m // 12, m % 12 + 1
    ngay_goc = min(d.day, 28) if (m == 2 and d.day > 28) else d.day
    try:
        x = d.replace(year=y, month=m, day=ngay_goc)
    except ValueError:
        x = d.replace(year=y, month=m, day=28)
    return x + dt.timedelta(days=ngay, hours=gio)


GIO_TY = ("da_ty", "sang_ngay")


def la_so(lich: dt.datetime, gioi_tinh: str, gio_ty: str = "da_ty") -> dict:
    """`lich`: giờ sinh theo kinh tuyến lịch UTC+7 (đã quy đổi múi giờ lịch sử).

    TP-LICH — `gio_ty` cho người sinh 23:00–23:59 (người dùng chọn): "da_ty" (mặc định, chính sách đã chốt: giữ trụ
    ngày hôm đó, trụ giờ = Tý của ngày sau) hoặc "sang_ngay" (phái đổi ngày lúc 23:00: trụ ngày = ngày hôm sau).
    Trụ giờ hai phái như nhau; chỉ trụ ngày (nhật chủ) và mọi thứ suy ra từ nhật chủ đổi theo."""
    if gioi_tinh not in ("nam", "nu"):
        raise ValueError("gioi_tinh phải là 'nam' hoặc 'nu'")
    if gio_ty not in GIO_TY:
        raise ValueError(f"gio_ty phải là một trong {GIO_TY}")
    t_utc = lich - dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)
    # --- trụ năm (Lập xuân) + trụ tháng (tiết)
    nam = lich.year if t_utc >= tk.thoi_diem(lich.year, 315) else lich.year - 1
    can_nam, chi_nam = (nam - 4) % 10, (nam - 4) % 12
    (t_truoc, g_truoc), (t_sau, _) = tk.tiet_bao_quanh(t_utc)
    k = ((g_truoc - 315) % 360) // 30                    # 0 = tháng Dần
    chi_thang, can_thang = (2 + k) % 12, (can_nam * 2 + 2 + k) % 10
    # --- trụ ngày + trụ giờ
    ngay = timebase.ngay_can_chi(lich)
    sang_ngay = gio_ty == "sang_ngay" and lich.hour == 23
    if sang_ngay:
        ngay += dt.timedelta(days=1)
    i_ngay = (ngay.toordinal() + 1721425 + 49) % 60
    can_ngay, chi_ngay = i_ngay % 10, i_ngay % 12
    chi_gio = ((lich.hour + 1) // 2) % 12
    can_goc_gio = (can_ngay + 1) % 10 if lich.hour == 23 and not sang_ngay else can_ngay  # dạ Tý: Tý của ngày sau
    can_gio = ((can_goc_gio % 5) * 2 + chi_gio) % 10

    tru = [_gz(_chi_so_60(can_nam, chi_nam)), _gz(_chi_so_60(can_thang, chi_thang)),
           _gz(i_ngay), _gz(_chi_so_60(can_gio, chi_gio))]
    dm = tru[2]["can"]
    tang = [TANG_CAN[t["chi"]] for t in tru]
    kq = {
        "tru": tru,
        "nhat_chu": {"can": dm, "ngu_hanh": _nh_can(dm), "am_duong": "Dương" if can_ngay % 2 == 0 else "Âm"},
        "tang_can": tang,
        "thap_than_can": [thap_than(dm, tru[0]["can"]), thap_than(dm, tru[1]["can"]), "Nhật chủ",
                          thap_than(dm, tru[3]["can"])],
        "thap_than_chi": [[thap_than(dm, c) for c in x] for x in tang],
        "nam_bat_tu": nam,
        "gio_ty": gio_ty,
    }
    kq["ngu_hanh"] = _ngu_hanh(tru, tang)
    kq["than"] = _than(kq["nhat_chu"]["ngu_hanh"], kq["ngu_hanh"]["diem"], tru[1]["chi"])
    kq["dung_than"] = _dung_than(kq)
    kq["dai_van"] = _dai_van(lich, t_utc, t_truoc, t_sau, can_nam, gioi_tinh, can_thang, chi_thang)
    co = []
    gan = min(abs((t_utc - t_truoc).total_seconds()), abs((t_sau - t_utc).total_seconds())) / 3600
    if gan <= SAT_TIET_GIO:
        co.append({"loai": "tiet_edge", "chi_tiet": (
            f"Sinh cách tiết khí khoảng {gan:.1f} giờ — trụ tháng (và có thể trụ năm) đổi ngay tại "
            "mốc này; sai giờ sinh vài chục phút là sai trụ.")})
    if sang_ngay:
        co.append({"loai": "gio_ty", "chi_tiet": (
            "Sinh 23:00–23:59: đang xem theo phái ĐỔI NGÀY lúc 23:00 (lựa chọn của bạn) — trụ ngày là ngày hôm sau. "
            "Mặc định của hệ thống giữ trụ ngày hôm đó (dạ Tý); hai phái chỉ khác trụ ngày, trụ giờ như nhau.")})
    elif lich.hour == 23:
        co.append({"loai": "da_ty", "chi_tiet": (
            "Sinh 23:00–23:59 (dạ Tý): bát tự ở đây giữ trụ ngày HÔM ĐÓ (chính sách SWITCH_AT_0000), "
            "trụ giờ lấy Tý của ngày sau. Trường phái đổi ngày lúc 23:00 sẽ ra trụ ngày khác; "
            "tử vi (iztro) ở hệ thống này tính sang ngày mới.")})
    kq["co_canh_bao"] = co
    return kq


def _ngu_hanh(tru: list[dict], tang: list[list[str]]) -> dict:
    diem = {h: 0.0 for h in ("Kim", "Mộc", "Thủy", "Hỏa", "Thổ")}
    for t in tru:
        diem[_nh_can(t["can"])] += THANG_DIEM["thien_can"]
    for i, x in enumerate(tang):
        he_so = THANG_DIEM["he_so_nguyet_lenh"] if i == 1 else 1.0
        for c, w in zip(x, THANG_DIEM["tang_can"][len(x)]):
            diem[_nh_can(c)] += w * he_so
    diem = {h: round(v, 2) for h, v in diem.items()}
    return {"diem": diem, "thieu": [h for h, v in diem.items() if v == 0],
            "nhieu_nhat": max(diem, key=lambda h: diem[h])}


def _hanh_sinh(h: str) -> str:
    return next(a for a, b in SINH.items() if b == h)


def _than(nh: str, diem: dict, chi_thang: str) -> dict:
    ho = diem[nh] + diem[_hanh_sinh(nh)]
    ti_le = round(ho / sum(diem.values()), 3)
    ket = "vượng" if ti_le >= THANG_DIEM["vuong_tu"] else "nhược" if ti_le <= THANG_DIEM["nhuoc_duoi"] else "trung hoà"
    nl = CHI_NH[CHI.index(chi_thang)]
    return {"ti_le": ti_le, "ket_luan": ket, "dac_lenh": nl in (nh, _hanh_sinh(nh)),
            "thang_diem": THANG_DIEM["mo_ta"]}


# --------------------------------------------------------------------------- #
# KB-3b — Cách cục Tử Bình Chân Thuyên (định cách theo nguyệt lệnh)
# --------------------------------------------------------------------------- #
_TT_CACH = {"Chính Quan": "chinh_quan", "Thất Sát": "that_sat", "Chính Tài": "chinh_tai", "Thiên Tài": "thien_tai",
            "Chính Ấn": "chinh_an", "Thiên Ấn": "thien_an", "Thực Thần": "thuc_than", "Thương Quan": "thuong_quan"}
_NGUON_KHI = ["ban_khi", "trung_khi", "du_khi"]
LOC = dict(zip(CAN, ["Dần", "Mão", "Tỵ", "Ngọ", "Tỵ", "Ngọ", "Thân", "Dậu", "Hợi", "Tý"]))
DUONG_NHAN = {"Giáp": "Mão", "Bính": "Ngọ", "Mậu": "Ngọ", "Canh": "Dậu", "Nhâm": "Tý"}
TEN_CACH = {"chinh_quan": "Chính Quan cách", "that_sat": "Thất Sát cách", "chinh_tai": "Chính Tài cách",
            "thien_tai": "Thiên Tài cách", "chinh_an": "Chính Ấn cách", "thien_an": "Thiên Ấn cách",
            "thuc_than": "Thực Thần cách", "thuong_quan": "Thương Quan cách", "kien_loc": "Kiến Lộc cách",
            "duong_nhan": "Dương Nhận cách", "nguyet_kiep": "Nguyệt Kiếp cách"}


def cach_cuc_tbct(ls: dict) -> dict:
    """Cách cục theo Tử Bình Chân Thuyên: tàng can của chi tháng thấu ra can năm/tháng/giờ thì lấy can thấu
    (bản khí → trung khí → dư khí, bỏ Tỷ Kiếp); không thấu thì lấy bản khí. Bản khí là Tỷ Kiếp → Kiến Lộc /
    Dương Nhận / Nguyệt Kiếp, kèm các can thấu khác để xét dụng."""
    nc = ls["nhat_chu"]["can"]
    chi_thang = ls["tru"][1]["chi"]
    tang = TANG_CAN[chi_thang]
    lo = [ls["tru"][i]["can"] for i in (0, 1, 3)]
    tt_ban = thap_than(nc, tang[0])
    if tt_ban in ("Tỷ Kiên", "Kiếp Tài"):
        ma = ("kien_loc" if LOC[nc] == chi_thang else
              "duong_nhan" if DUONG_NHAN.get(nc) == chi_thang else "nguyet_kiep")
        khac = [{"can": c, "thap_than": thap_than(nc, c)} for c in lo if thap_than(nc, c) not in ("Tỷ Kiên", "Kiếp Tài")]
        return {"ma": ma, "can_lap_cach": tang[0], "thap_than": tt_ban, "nguon_khi": "ban_khi",
                "thau": tang[0] in lo, "chi_thang": chi_thang, "can_thau_khac": khac}
    ung = [(i, c) for i, c in enumerate(tang) if c in lo and thap_than(nc, c) not in ("Tỷ Kiên", "Kiếp Tài")]
    i, c = ung[0] if ung else (0, tang[0])
    tt = thap_than(nc, c)
    return {"ma": _TT_CACH[tt], "can_lap_cach": c, "thap_than": tt, "nguon_khi": _NGUON_KHI[i],
            "thau": bool(ung), "chi_thang": chi_thang,
            "can_thau_khac": [{"can": x, "thap_than": thap_than(nc, x)} for x in lo if x != c]}


def _dung_than(kq: dict) -> dict:
    nh, th = kq["nhat_chu"]["ngu_hanh"], kq["than"]["ket_luan"]
    if th == "nhược":
        phu = [_hanh_sinh(nh), nh]
    elif th == "vượng":
        phu = [SINH[nh], KHAC[nh], next(a for a, b in KHAC.items() if b == nh)]
    else:
        phu = []
    chi_thang = kq["tru"][1]["chi"]
    dieu = ["Thủy"] if chi_thang in ("Tỵ", "Ngọ", "Mùi") else ["Hỏa"] if chi_thang in ("Hợi", "Tý", "Sửu") else []
    cc = cach_cuc_tbct(kq)
    return {
        "phu_uc": {"hanh": phu, "nguon": "trich_thien_tuy", "giai_thich": f"thân {th}"},
        "dieu_hau": {"hanh": dieu, "nguon": "trich_thien_tuy",
                     "giai_thich": f"sinh tháng {chi_thang}" + (" — cần điều hoà khí hậu" if dieu else " — khí hậu ôn hoà")},
        "cach_cuc": {"ten": TEN_CACH[cc["ma"]], "can": cc["can_lap_cach"], **cc, "nguon": "tu_binh_chan_thuyen"},
        "chon": None,
    }


def _dai_van(lich: dt.datetime, t_utc: dt.datetime, t_truoc: dt.datetime, t_sau: dt.datetime,
             can_nam: int, gioi_tinh: str, can_thang: int, chi_thang: int) -> dict:
    thuan = (can_nam % 2 == 0) == (gioi_tinh == "nam")
    phut = int(abs(((t_sau if thuan else t_truoc) - t_utc).total_seconds()) // 60)
    nam, r = divmod(phut, 4320)
    thang, r = divmod(r, 360)
    ngay, r = divmod(r, 12)
    gio = r * 2
    khoi = _cong_thoi_gian(lich, nam, thang, ngay, gio)
    goc = _chi_so_60(can_thang, chi_thang)
    ds = []
    moc = [_cong_thoi_gian(khoi, 10 * k, 0, 0, 0).date() for k in range(9)]      # ngày bắt đầu vận 1…9
    for k in range(1, 9):
        i = (goc + k) % 60 if thuan else (goc - k) % 60
        ds.append({**_gz(i), "tu_nam": khoi.year + 10 * (k - 1), "den_nam": khoi.year + 10 * k - 1,
                   "tu_ngay": moc[k - 1].isoformat(), "den_ngay": (moc[k] - dt.timedelta(days=1)).isoformat(),
                   "tu_tuoi_thuc": nam + 10 * (k - 1)})
    return {"thuan": thuan, "khoi_van": {"nam": nam, "thang": thang, "ngay": ngay, "gio": gio},
            "ngay_khoi": khoi.date().isoformat(), "ds": ds}


def quan_he_chi(a: str, b: str) -> str:
    if a == b:
        return "phục ngâm (trùng chi)"
    if frozenset((a, b)) in LUC_XUNG:
        return "lục xung"
    if frozenset((a, b)) in LUC_HOP:
        return "lục hợp"
    return "không xung hợp"


def luu_nien(ls: dict, nam: int) -> dict:
    """Năm can chi `nam` (tính từ Lập xuân) so với nhật chủ và chi ngày."""
    g = _gz(_chi_so_60((nam - 4) % 10, (nam - 4) % 12))
    return {**g, "nam": nam, "thap_than": thap_than(ls["nhat_chu"]["can"], g["can"]),
            "ngu_hanh_can": _nh_can(g["can"]), "voi_tru_ngay": quan_he_chi(g["chi"], ls["tru"][2]["chi"])}


def dai_van_theo_ngay(ls: dict, ngay: dt.date) -> dict | None:
    """Đại vận đang đi vào NGÀY `ngay` (theo ngày khởi vận thật, không theo năm dương). None: chưa khởi vận / đã qua
    vận cuối."""
    s = ngay.isoformat()
    return next((d for d in ls["dai_van"]["ds"] if d["tu_ngay"] <= s <= d["den_ngay"]), None)


def dai_van_tai(ls: dict, nam: int) -> dict | None:
    """Đại vận của NĂM `nam` theo quy ước bảng đại vận (năm bắt đầu vận → 9 năm sau), như các phần mềm Bát tự phổ
    biến. Năm đổi vận giữa chừng thuộc vận MỚI dù vận cũ còn tới ngày `den_ngay`; hỏi "đang đi lúc này" phải dùng
    `dai_van_theo_ngay`."""
    return next((d for d in ls["dai_van"]["ds"] if d["tu_nam"] <= nam <= d["den_nam"]), None)
