# -*- coding: utf-8 -*-
"""TV-ZW "Cùng sao Mệnh" — chính tinh ở cung Mệnh, tính nhanh bằng Python thuần, và tỉ lệ thời điểm sinh có cùng tổ hợp.

Tầng CALC: thuần, tất định, không LLM, không DB. Đây KHÔNG phải bộ an sao thứ hai: lá số người dùng vẫn do iztro an
(`tuvi_an_sao`); đường nhanh ở đây chỉ để ĐẾM mẫu (311.196 thời điểm, iztro mất hàng giờ) và được test khoá trùng khít
iztro trên 1.000 lá `lasotuvi_1000.json` + các ngày dễ lệch (tests/test_tuvi_sao_menh.py).

Khẩu quyết (đúng quy ước engine đang dùng cho lá số):
- Âm lịch VIỆT NAM (Hồ Ngọc Đức, UTC+7). Nửa sau tháng nhuận (ngày > 15) tính tháng sau (mặc định `thang_nhuan =
  "thang_sau"`, iztro `fix_leap`); giờ Tý muộn (23:xx, time index 12) = giờ Tý ngày hôm sau (EN-6 BI-2).
- Cung Mệnh: từ Dần đếm thuận tới tháng sinh, rồi đếm nghịch tới giờ sinh.
- Can cung Mệnh: Ngũ Hổ Độn theo can năm âm (`tuvi_phi_hoa.ngu_ho_don`); Cục = hành nạp âm can chi cung Mệnh
  (Thủy 2, Mộc 3, Kim 4, Thổ 5, Hỏa 6).
- Tử Vi: ngày âm + Cục — lấy số bù k nhỏ nhất để (ngày + k) chia hết cho Cục, thương q; từ Dần đếm thuận q − 1, rồi
  k lẻ lùi k cung, k chẵn tiến k cung. 13 chính tinh còn lại theo `tuvi_vi_tri.vi_tri_chinh_tinh`.
- Giới tính không đổi vị trí chính tinh. Cung Mệnh không có chính tinh (vô chính diệu) → mượn chính tinh cung đối diện.

Mẫu đếm: MỌI ngày dương 01/01/1940–31/12/2010 × 12 canh giờ (như `thanso_ty_le.py`: mỗi thời điểm tính như nhau —
không phải thống kê dân số thật), âm lịch Việt UTC+7 cho cả nước (lá số miền Nam 1960–1975 lập theo UTC+8 có thể rơi
tổ hợp khác ở vài ngày đầu/cuối tháng — tỉ lệ chỉ để tham khảo). Bảng dựng sẵn ở `data/tuvi_sao_menh_ty_le.json`
bằng `scripts/sinh_tuvi_sao_menh.py`; test dựng lại toàn bộ và so khớp từng số.
"""
from __future__ import annotations

import collections
import datetime as dt
import functools
import json
from pathlib import Path

from app.calc import can_chi, lunar, tuvi_phi_hoa
from app.calc.tuvi_vi_tri import CHI, CHINH_TINH, vi_tri_chinh_tinh

TU, DEN = dt.date(1940, 1, 1), dt.date(2010, 12, 31)
TZ_MAU = 7.0
TEP = Path(__file__).resolve().parent / "data" / "tuvi_sao_menh_ty_le.json"
SO_CUC = {"Thủy": 2, "Mộc": 3, "Kim": 4, "Thổ": 5, "Hỏa": 6}


def chi_menh(thang_am: int, ti: int) -> int:
    """Chỉ số chi (Tý = 0) của cung Mệnh. `thang_am` 1..13 (13 = nửa sau Chạp nhuận ≡ Giêng), `ti` 0..11."""
    return (2 + (thang_am - 1) - ti) % 12


def so_cuc(can_nam: str, i_chi_menh: int) -> int:
    chi = CHI[i_chi_menh]
    can = tuvi_phi_hoa.ngu_ho_don(can_nam, chi)
    return SO_CUC[can_chi.nap_am(can, chi)["hanh"]]


def chi_tu_vi(ngay_am: int, cuc: int) -> int:
    """Chỉ số chi (Tý = 0) của sao Tử Vi theo ngày âm và Cục."""
    k = (-ngay_am) % cuc
    q = (ngay_am + k) // cuc
    vi_tri = 2 + q - 1
    return (vi_tri - k if k % 2 else vi_tri + k) % 12


def _can_nam(nam_am: int) -> str:
    return can_chi.CAN[(nam_am - 4) % 10]


def _tu_am(ngay: int, thang: int, nam: int, nhuan: int, ti: int) -> tuple[list[str], bool]:
    if nhuan and ngay > 15:
        thang += 1
    m = chi_menh(thang, ti)
    v = vi_tri_chinh_tinh(CHI[chi_tu_vi(ngay, so_cuc(_can_nam(nam), m))])
    sao = [t for t in CHINH_TINH if v[t] == CHI[m]]
    if sao:
        return sao, False
    doi = CHI[(m + 6) % 12]
    return [t for t in CHINH_TINH if v[t] == doi], True


def sao_menh(ngay_duong: dt.date, ti: int, tz_lich: float = TZ_MAU) -> dict:
    """{"sao": chính tinh cung Mệnh (hoặc cung mượn), "muon": vô chính diệu?} — `ngay_duong` theo kinh tuyến lịch,
    `ti` 0..12 như `tuvi_an_sao.time_index`."""
    if not 0 <= ti <= 12:
        raise ValueError("time_index phải trong 0..12")
    if ti == 12:
        ngay_duong, ti = ngay_duong + dt.timedelta(days=1), 0
    ng, th, na, nh = lunar.solar_to_lunar(ngay_duong.day, ngay_duong.month, ngay_duong.year, tz_lich)
    sao, muon = _tu_am(ng, th, na, nh, ti)
    return {"sao": sao, "muon": muon}


def khoa(sao: list[str], muon: bool) -> str:
    """Khoá tổ hợp: chính tinh theo thứ tự chuẩn `CHINH_TINH`, nối " + "; vô chính diệu ghi sao mượn."""
    ten = " + ".join(t for t in CHINH_TINH if t in sao)
    return f"vô chính diệu (mượn {ten})" if muon else ten


def dem_mau() -> dict:
    """Đếm tổ hợp chính tinh cung Mệnh trên mẫu (mọi ngày × 12 canh). Dùng cho script dựng bảng và test."""
    dem: collections.Counter = collections.Counter()
    d, tong = TU, 0
    while d <= DEN:
        am = lunar.solar_to_lunar(d.day, d.month, d.year, TZ_MAU)
        for ti in range(12):
            dem[khoa(*_tu_am(*am, ti))] += 1
            tong += 1
        d += dt.timedelta(days=1)
    return {"mau": f"{TU.year}–{DEN.year}", "tz_lich": TZ_MAU, "tong": tong,
            "dem": dict(sorted(dem.items(), key=lambda x: (-x[1], x[0])))}


@functools.lru_cache(maxsize=1)
def bang() -> dict:
    return json.loads(TEP.read_text(encoding="utf-8"))


@functools.lru_cache(maxsize=1)
def _hang() -> dict[str, int]:
    dem = bang()["dem"]
    ds = sorted(dem.items(), key=lambda x: (-x[1], x[0]))
    return {k: i + 1 for i, (k, _) in enumerate(ds)}


def ty_le_theo_khoa(k: str) -> dict | None:
    b = bang()
    n = b["dem"].get(k)
    if n is None:
        return None
    return {"khoa": k, "so": n, "tong": b["tong"], "ty_le": n / b["tong"], "hang": _hang()[k],
            "so_to_hop": len(b["dem"]), "mau": b["mau"]}


def ty_le(sao: list[str], muon: bool) -> dict | None:
    """Tỉ lệ thời điểm sinh trong mẫu có cùng tổ hợp; None nếu tổ hợp không có trong bảng."""
    return ty_le_theo_khoa(khoa(sao, muon))
