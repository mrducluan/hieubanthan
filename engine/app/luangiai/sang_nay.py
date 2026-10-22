# -*- coding: utf-8 -*-
"""KC-4 GĐ2 — chữ cho thông báo Web Push buổi sáng (người dùng tự bật, ≤ 1 thông báo/ngày).

Hai phần, đều tất định, không gọi LLM, không dự báo sự kiện:
- `moc_lich(ngay)`: mốc lịch chung của ngày (giờ Việt Nam) — giao tiết (12 tiết 节 mở đầu tháng theo tiết khí),
  Lập xuân, Tết âm lịch Việt. Mỗi mốc thuộc một hay nhiều NHÓM người dùng chọn nhận (`giao_tiet`, `lap_xuan_tet`).
- `goi_sang_nay(ngay, ngay_sinh)`: theo NGÀY + THÁNG sinh (không cần năm sinh — ngày/tháng cá nhân mốc 1/1 dương
  chỉ phụ thuộc ngày + tháng sinh): ngày cá nhân + câu tự soi của ngày (KB `ngay_ca_nhan_tu_soi`, như Hôm nay);
  ngày 1 dương lịch thêm "tháng cá nhân mới".
Web máy chủ gom ngày + tháng sinh của những người đã bật rồi gọi MỘT lần; engine không biết ai là ai, không lưu.
"""
from __future__ import annotations

import datetime as dt
import json
from functools import lru_cache
from pathlib import Path

from app.calc import lunar, tietkhi, thanso_mo_rong as mr
from app.config import CALENDAR_MERIDIAN_TZ
from app.kb import thanso_v2

_KB = Path(__file__).resolve().parent.parent / "kb" / "data" / "push_sang_nay.json"
_VN = dt.timedelta(hours=7)


@lru_cache(maxsize=1)
def _kb() -> dict:
    return json.loads(_KB.read_text(encoding="utf-8"))


def _ngay_tiet_vn(nam: int, kinh_do: int) -> dt.date:
    return (tietkhi.thoi_diem(nam, kinh_do) + _VN).date()


def moc_lich(ngay: dt.date) -> list[dict]:
    """Mốc lịch chung rơi đúng `ngay` (giờ VN): [{ma, nhom, tieu_de, noi_dung, duong}]. Ngày thường → []."""
    kb, mau = _kb(), _kb()["mau"]
    kq: list[dict] = []
    for kd in tietkhi.TIET:
        kd %= 360
        if _ngay_tiet_vn(ngay.year, kd) != ngay:
            continue
        t = kb["tiet"][str(kd)]
        if kd == 315:
            kq.append({"ma": "tiet.315", "nhom": ["giao_tiet", "lap_xuan_tet"], "tieu_de": mau["lap_xuan_tieu_de"],
                       "noi_dung": mau["lap_xuan_noi_dung"], "duong": mau["lap_xuan_duong"]})
        else:
            kq.append({"ma": f"tiet.{kd}", "nhom": ["giao_tiet"],
                       "tieu_de": mau["giao_tiet_tieu_de"].format(ten=t["ten"]),
                       "noi_dung": mau["giao_tiet_noi_dung"].format(chi=t["chi"]), "duong": mau["giao_tiet_duong"]})
    ad, am, ay, nhuan = lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, CALENDAR_MERIDIAN_TZ)
    if ad == 1 and am == 1 and not nhuan:
        kq.append({"ma": f"tet.{ay}", "nhom": ["lap_xuan_tet"],
                   "tieu_de": mau["tet_tieu_de"].format(can_chi=" ".join(lunar.can_chi_nam(ay))),
                   "noi_dung": mau["tet_noi_dung"], "duong": mau["tet_duong"]})
    return kq


def _ngay_thang(s: str) -> tuple[int, int] | None:
    """"dd-mm" → (ngày, tháng); sai định dạng hoặc ngày không có thật → None (29-02 hợp lệ)."""
    if len(s) != 5 or s[2] != "-" or not (s[:2].isdigit() and s[3:].isdigit()):
        return None
    d, m = int(s[:2]), int(s[3:])
    try:
        dt.date(2000, m, d)            # năm nhuận — nhận 29/02
    except ValueError:
        return None
    return d, m


def _theo_ngay_sinh(d: int, m: int, ngay: dt.date) -> dict:
    mau = _kb()["mau"]
    so = mr.ngay_ca_nhan(d, m, ngay.year, ngay.month, ngay.day)
    tu_soi = thanso_v2.nghia_phu("ngay_ca_nhan_tu_soi", so)
    thang_moi = None
    if ngay.day == 1:
        st = mr.thang_ca_nhan(d, m, ngay.year, ngay.month)
        n = thanso_v2.nghia_phu("thang_ca_nhan", st) or {}
        thang_moi = {"so": st, "tieu_de": mau["thang_moi_tieu_de"].format(so=st),
                     "noi_dung": mau["thang_moi_noi_dung"].format(chu_de=n.get("chu_de") or "", nen=n.get("nen") or "").strip(" .") + "."}
    return {"so_ngay": so, "tieu_de": mau["sang_nay_tieu_de"].format(so=so),
            "noi_dung": tu_soi if isinstance(tu_soi, str) and tu_soi else mau["sang_nay_du_phong"],
            "thang_moi": thang_moi}


def goi_sang_nay(ngay: dt.date, ngay_sinh: list[str]) -> dict:
    theo: dict[str, dict] = {}
    for s in dict.fromkeys(ngay_sinh):
        dm = _ngay_thang(s)
        if dm:
            theo[s] = _theo_ngay_sinh(*dm, ngay)
    return {"ngay_xem": ngay.isoformat(), "moc_lich": moc_lich(ngay), "theo_ngay_sinh": theo,
            "hoi_hom_qua": _kb()["hoi_hom_qua"], "luu_y": "Nhịp gợi ý để tự soi, không phải dự báo."}
