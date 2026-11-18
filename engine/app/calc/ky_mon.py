# -*- coding: utf-8 -*-
"""Kỳ Môn Độn Giáp — lập bàn theo GIỜ (thời gia, chuyển bàn). Tầng CALC: Python thuần, tất định, không LLM, không DB.

Nguồn quy tắc (kho nguồn `fixtures/nguon/ky_mon_co_kim_do_thu.json`, `don_giap_dien_nghia.json`):
- bảng cục theo 24 tiết × 3 nguyên: 72 đề mục của bảng 18 cục (Cổ Kim Đồ Thư Tập Thành quyển 709–712);
- địa bàn: dương độn lục nghi đi thuận, tam kỳ đi nghịch; âm độn ngược lại («陽遁順儀奇逆布，陰遁逆儀奇順行»);
- trực phù = sao của cung chứa tuần thủ, đặt lên cung can giờ; trực sử = cửa của cung ấy, mỗi giờ đi một cung
  (dương thuận, âm nghịch); cung giữa gửi Khôn («乙奇在中宮寄坤»);
- tám thần theo trực phù, dương thuận âm nghịch;
- hai phép định cục: `sach_bo` (拆補 — tiết đang đi + phù đầu của ngày) và `tri_nhuan` (置閏 — siêu thần, tiếp khí,
  đặt nhuận sau Mang chủng / Đại tuyết khi phù đầu vượt tiết từ 9 ngày: «超至九日及十餘日則當置閏 … 置閏必在芒種
  大雪之後二至之前», quyển 708 «閏奇超神接氣直指»).
Golden: bảng 18 cục × 60 giờ + hai ví dụ năm 1589 của sách (`tests/test_ky_mon_ban.py`), bộ đối chiếu ngoài
(`tests/test_ky_mon_doi_chieu.py`).
"""
from __future__ import annotations

import bisect
import datetime as dt
from functools import lru_cache

from app.calc import tietkhi
from app.calc.can_chi import CAN, CHI

# ── bảng gốc ────────────────────────────────────────────────────────────────────────────────────────────────────
NGHI_KY = ["Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý", "Đinh", "Bính", "Ất"]     # sáu nghi rồi ba kỳ, theo thứ tự bày
TUAN_THU = ["Giáp Tý", "Giáp Tuất", "Giáp Thân", "Giáp Ngọ", "Giáp Thìn", "Giáp Dần"]   # ẩn dưới Mậu … Quý
VONG = [1, 8, 3, 4, 9, 2, 7, 6]                                                 # tám cung ngoài, theo chiều kim đồng hồ
QUE = {1: ("Khảm", "Bắc"), 2: ("Khôn", "Tây Nam"), 3: ("Chấn", "Đông"), 4: ("Tốn", "Đông Nam"), 5: ("Trung", "Giữa"),
       6: ("Càn", "Tây Bắc"), 7: ("Đoài", "Tây"), 8: ("Cấn", "Đông Bắc"), 9: ("Ly", "Nam")}
SAO = {1: "Thiên Bồng", 2: "Thiên Nhuế", 3: "Thiên Xung", 4: "Thiên Phụ", 5: "Thiên Cầm", 6: "Thiên Tâm",
       7: "Thiên Trụ", 8: "Thiên Nhậm", 9: "Thiên Anh"}
CUA = {1: "Hưu", 2: "Tử", 3: "Thương", 4: "Đỗ", 6: "Khai", 7: "Kinh", 8: "Sinh", 9: "Cảnh"}
# tám thần theo thứ tự đi từ Trực Phù; sách (ví dụ 1589) gọi Câu Trần, Chu Tước ở cả hai độn — một số bản đổi thành
# Bạch Hổ, Huyền Vũ (nhất là khi âm độn): ghi ở `than_ten_khac`, không đổi vị trí.
THAN = [("phu", "Trực Phù"), ("xa", "Đằng Xà"), ("am", "Thái Âm"), ("hop", "Lục Hợp"), ("tran", "Câu Trần"),
        ("tuoc", "Chu Tước"), ("dia", "Cửu Địa"), ("thien", "Cửu Thiên")]
THAN_TEN_KHAC = {"tran": "Bạch Hổ", "tuoc": "Huyền Vũ"}
CUNG_GUI = 2                                                                    # cung giữa gửi Khôn

TIET = [("dong_chi", "Đông chí"), ("tieu_han", "Tiểu hàn"), ("dai_han", "Đại hàn"), ("lap_xuan", "Lập xuân"),
        ("vu_thuy", "Vũ thuỷ"), ("kinh_trap", "Kinh trập"), ("xuan_phan", "Xuân phân"), ("thanh_minh", "Thanh minh"),
        ("coc_vu", "Cốc vũ"), ("lap_ha", "Lập hạ"), ("tieu_man", "Tiểu mãn"), ("mang_chung", "Mang chủng"),
        ("ha_chi", "Hạ chí"), ("tieu_thu", "Tiểu thử"), ("dai_thu", "Đại thử"), ("lap_thu", "Lập thu"),
        ("xu_thu", "Xử thử"), ("bach_lo", "Bạch lộ"), ("thu_phan", "Thu phân"), ("han_lo", "Hàn lộ"),
        ("suong_giang", "Sương giáng"), ("lap_dong", "Lập đông"), ("tieu_tuyet", "Tiểu tuyết"), ("dai_tuyet", "Đại tuyết")]
# cục của (thượng, trung, hạ) nguyên — thứ tự tiết như TIET; 12 tiết đầu dương độn, 12 tiết sau âm độn
CUC_TIET = [(1, 7, 4), (2, 8, 5), (3, 9, 6), (8, 5, 2), (9, 6, 3), (1, 7, 4), (3, 9, 6), (4, 1, 7), (5, 2, 8), (4, 1, 7),
            (5, 2, 8), (6, 3, 9), (9, 3, 6), (8, 2, 5), (7, 1, 4), (2, 5, 8), (1, 4, 7), (9, 3, 6), (7, 1, 4), (6, 9, 3),
            (5, 8, 2), (6, 9, 3), (5, 8, 2), (4, 7, 1)]
NGUYEN = ["thuong", "trung", "ha"]
PHEP = ("sach_bo", "tri_nhuan")
NGUONG_NHUAN = 9                    # «超至九日 … 則當置閏»
_NAM_DAU, _NAM_DUNG, _NAM_CUOI = 1862, 1890, 2140   # phép tính tiết khí của engine (ΔT) chỉ hợp lệ 1860–2150

def la_duong_don(tiet: int) -> bool:
    return tiet < 12


def _ten_60(i: int) -> str:
    return f"{CAN[i % 10]} {CHI[i % 12]}"


def chi_so_ngay(d: dt.date) -> int:
    """Chỉ số lục thập hoa giáp (Giáp Tý = 0) của một ngày dương lịch."""
    return (d.toordinal() + 1721425 + 49) % 60


def can_chi_ngay_ten(d: dt.date) -> str:
    return _ten_60(chi_so_ngay(d))


def dia_ban(cuc: int, duong: bool) -> dict[int, str]:
    """Cung → can của địa bàn: Mậu ở cung mang số cục; dương độn nghi thuận kỳ nghịch, âm độn ngược lại."""
    if not 1 <= cuc <= 9:
        raise ValueError("cục phải từ 1 tới 9")
    return {(cuc - 1 + (i if duong else -i)) % 9 + 1: can for i, can in enumerate(NGHI_KY)}


def _vong(cung: int) -> int:
    return VONG.index(CUNG_GUI if cung == 5 else cung)


def ban_gio(cuc: int, duong: bool, gio: int) -> dict:
    """Bàn của một giờ khi đã biết cục: `gio` = chỉ số lục thập hoa giáp của can chi giờ (Giáp Tý = 0)."""
    if not 0 <= gio < 60:
        raise ValueError("giờ phải là chỉ số 0–59")
    db = dia_ban(cuc, duong)
    vi = {can: cung for cung, can in db.items()}
    tuan, buoc = gio // 10, gio % 10
    c0 = vi[NGHI_KY[tuan]]                                    # cung chứa tuần thủ
    can_gio = CAN[gio % 10]
    c_can = c0 if can_gio == "Giáp" else vi[can_gio]          # giờ Giáp: Giáp ẩn dưới nghi của tuần
    c_su = (c0 - 1 + (buoc if duong else -buoc)) % 9 + 1      # trực sử mỗi giờ đi một cung, đếm qua cả cung giữa

    cung = {k: {"que": QUE[k][0], "phuong": QUE[k][1], "dia_ban": db[k]} for k in range(1, 10)}
    cung[5]["gui"] = CUNG_GUI
    lech_sao = _vong(c_can) - _vong(c0)
    for i, nha in enumerate(VONG):                            # sao: cả vòng xoay theo trực phù
        o = cung[VONG[(i + lech_sao) % 8]]
        o.update(sao=SAO[nha], sao_so=nha, thien_ban=db[nha])
        if nha == CUNG_GUI:                                   # Thiên Nhuế mang theo Thiên Cầm và can của cung giữa
            o.update(kem_cam=True, thien_ban_ky=db[5])
    cua_goc = CUNG_GUI if c0 == 5 else c0
    lech_cua = _vong(c_su) - _vong(cua_goc)
    for i, nha in enumerate(VONG):                            # cửa: cả vòng xoay theo trực sử
        cung[VONG[(i + lech_cua) % 8]].update(cua=CUA[nha], cua_so=nha)
    dau = _vong(c_can)
    for i, (ma, ten) in enumerate(THAN):                      # thần: từ cung trực phù, dương thuận âm nghịch
        o = cung[VONG[(dau + (i if duong else -i)) % 8]]
        o.update(than=ten, than_ma=ma)
        if ma in THAN_TEN_KHAC:
            o["than_ten_khac"] = THAN_TEN_KHAC[ma]
    chi_khong = [CHI[(10 - 2 * tuan) % 12], CHI[(11 - 2 * tuan) % 12]]
    return {"am_duong": "duong" if duong else "am", "cuc": cuc, "gio": gio,
            "tuan_thu": TUAN_THU[tuan], "tuan_nghi": NGHI_KY[tuan], "tuan_khong": chi_khong,
            "truc_phu": {"sao": SAO[c0], "sao_so": c0, "cung_goc": c_can, "cung": CUNG_GUI if c_can == 5 else c_can},
            "truc_su": {"cua": CUA[cua_goc], "cua_so": cua_goc, "cung_goc": c_su, "cung": CUNG_GUI if c_su == 5 else c_su},
            "cung": cung}


# ── tiết khí ────────────────────────────────────────────────────────────────────────────────────────────────────
@lru_cache(maxsize=512)
def _tiet_nam(nam: int) -> tuple[tuple[dt.datetime, int], ...]:
    """24 thời điểm tiết khí (UTC) rơi trong năm dương `nam`, kèm chỉ số tiết (Đông chí = 0)."""
    ds = [(tietkhi.thoi_diem(nam, (270 + 15 * i) % 360), i) for i in range(24)]
    return tuple(sorted(ds))


def tiet_tai(t_utc: dt.datetime) -> tuple[int, dt.datetime]:
    """Tiết khí đang đi tại thời điểm UTC: (chỉ số tiết, thời điểm giao tiết)."""
    ds = [x for n in (t_utc.year - 1, t_utc.year) for x in _tiet_nam(n) if x[0] <= t_utc]
    luc, i = max(ds)
    return i, luc


@lru_cache(maxsize=4)
def _moc_tri_nhuan(utc: float) -> tuple[tuple[int, ...], tuple[tuple[int, int, bool, int], ...]]:
    """Dãy mốc Mang chủng / Đại tuyết: (ngày bắt đầu thượng nguyên của tiết ấy, chỉ số tiết, có đặt nhuận, ngày giao tiết).

    Khởi từ năm `_NAM_DAU` với phù đầu gần nhất trước tiết; mọi lịch sử hợp lệ hội tụ về cùng một dãy sau lần đặt
    nhuận đầu tiên (lệch 15 ngày thì độ vượt ≥ 9 → đặt nhuận ngay), nên chỉ dùng từ `_NAM_DUNG`."""
    lech = dt.timedelta(hours=utc)
    moc, p = [], None
    for nam in range(_NAM_DAU, _NAM_CUOI + 2):
        for kd, i in ((75, 11), (255, 23)):
            j = (tietkhi.thoi_diem(nam, kd) + lech).date().toordinal()
            if p is None:
                p = j - (chi_so_ngay(dt.date.fromordinal(j)) % 15)
            nhuan = co_dat_nhuan(j, p)
            moc.append((p, i, nhuan, j))
            p += 180 + (15 if nhuan else 0)
    return tuple(m[0] for m in moc), tuple(moc)


def co_dat_nhuan(ngay_tiet: int, phu_dau: int) -> bool:
    """Ở Mang chủng / Đại tuyết: phù đầu thượng nguyên đi trước ngày giao tiết từ 9 ngày thì đặt nhuận (số thứ tự ngày)."""
    return ngay_tiet - phu_dau >= NGUONG_NHUAN


def xep_tri_nhuan(cach: int, tiet_moc: int, co_nhuan: bool) -> tuple[int, int, bool]:
    """Ngày cách phù đầu thượng nguyên của tiết mốc `cach` ngày → (chỉ số tiết, nguyên 0–2, đang là nguyên nhuận)."""
    if co_nhuan and 15 <= cach < 30:
        return tiet_moc, (cach % 15) // 5, True
    return (tiet_moc + (cach - (15 if co_nhuan and cach >= 30 else 0)) // 15) % 24, (cach % 15) // 5, False


def dinh_cuc(t: dt.datetime, utc: float = 7, phep: str = "sach_bo", ngay: dt.date | None = None) -> dict:
    """Định cục cho thời điểm `t` (giờ đồng hồ địa phương, múi `utc`). `ngay` = ngày dùng lấy can chi (mặc định ngày của t)."""
    if phep not in PHEP:
        raise ValueError(f"phép định cục phải là một trong {PHEP}")
    ngay = ngay or t.date()
    if not _NAM_DUNG <= ngay.year <= _NAM_CUOI:
        raise ValueError(f"chỉ lập bàn cho năm {_NAM_DUNG}–{_NAM_CUOI}")
    i_ngay = chi_so_ngay(ngay)
    t_utc = t - dt.timedelta(hours=utc)
    tiet_thuc, luc = tiet_tai(t_utc)
    nhuan = False
    if phep == "sach_bo":
        tiet, nguyen = tiet_thuc, (i_ngay % 15) // 5
    else:
        dau, moc = _moc_tri_nhuan(float(utc))
        p, i0, co_nhuan, _j = moc[bisect.bisect_right(dau, ngay.toordinal()) - 1]
        tiet, nguyen, nhuan = xep_tri_nhuan(ngay.toordinal() - p, i0, co_nhuan)
    return {"phep": phep, "am_duong": "duong" if la_duong_don(tiet) else "am", "cuc": CUC_TIET[tiet][nguyen],
            "nguyen": NGUYEN[nguyen], "nhuan": nhuan,
            "tiet": {"ma": TIET[tiet][0], "ten": TIET[tiet][1]},
            "tiet_thuc": {"ma": TIET[tiet_thuc][0], "ten": TIET[tiet_thuc][1], "giao_luc_utc": luc.isoformat()},
            "phu_dau": _ten_60(i_ngay - i_ngay % 5)}


def lap_ban(t: dt.datetime, utc: float = 7, phep: str = "sach_bo", gio_ty: str = "da_ty") -> dict:
    """Bàn Kỳ Môn của giờ chứa `t` (giờ đồng hồ địa phương).

    Giờ Tý muộn (23:00–23:59): can chi GIỜ luôn là giờ Tý của ngày hôm sau. `gio_ty="da_ty"` (mặc định, như Bát tự của
    hệ thống) giữ can chi NGÀY của hôm đó để định cục; `"sang_ngay"` lấy ngày hôm sau."""
    if gio_ty not in ("da_ty", "sang_ngay"):
        raise ValueError("gio_ty phải là da_ty hoặc sang_ngay")
    ty_muon = t.hour == 23
    ngay_gio = t.date() + dt.timedelta(days=1) if ty_muon else t.date()
    ngay = ngay_gio if gio_ty == "sang_ngay" else t.date()
    chi = ((t.hour + 1) // 2) % 12
    can = (chi_so_ngay(ngay_gio) % 10 * 2 + chi) % 10
    gio = (6 * can - 5 * chi) % 60
    dc = dinh_cuc(t, utc=utc, phep=phep, ngay=ngay)
    b = ban_gio(dc["cuc"], dc["am_duong"] == "duong", gio)
    return {**dc, **b, "can_chi": {"ngay": can_chi_ngay_ten(ngay), "gio": _ten_60(gio)}, "ty_muon": ty_muon, "gio_ty": gio_ty}
