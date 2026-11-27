# -*- coding: utf-8 -*-
"""CHT-1 — RULES: bảng 12 cung hoàng đạo của một năm + tra cung theo ngày sinh (lời đời thường).

Chỉ ghép kết quả `calc.cung_hoang_dao` (một bộ tính) với tên cung trong KB; không tính lại, không lưu ngày sinh.
"""
from __future__ import annotations

import datetime as dt

from app import ngon_ngu
from app.calc import cung_hoang_dao as chd
from app.kb import trang_chiem_tinh as tch
from app.kb.loi import L


def _ten(ma: str) -> str:
    return tch._ten(ma)


def _gio(t: dt.datetime) -> str:
    return tch._gio(t)


def _o(ma: str) -> dict:
    c = tch._cung(ma)
    return {"ma": ma, "slug": tch._slug_cua(ma), "ten": c["ten"], "ky_hieu": c["ky_hieu"],
            "khoang_thuong": tch.khoang_thuong(ma)}


def _utc(off: float) -> str:
    return f"UTC+{int(off)}" if off == int(off) else f"UTC+{off}"


def bang_nam(nam: int) -> dict:
    """12 cung theo thứ tự hoàng đạo với giờ Mặt Trời vào / rời cung trong năm `nam` (giờ đồng hồ miền Bắc Việt Nam)."""
    if not (chd.NAM_TU <= nam < chd.NAM_DEN):
        raise ValueError(f"chỉ tra năm {chd.NAM_TU}–{chd.NAM_DEN - 1}")
    ds = []
    for k in chd.khoang_nam(nam):
        bd, kt = chd.gio_dia_phuong(k["bat_dau_utc"]), chd.gio_dia_phuong(k["ket_thuc_utc"])
        ds.append({**_o(k["ma"]), "bat_dau": bd.strftime("%Y-%m-%dT%H:%M"), "ket_thuc": kt.strftime("%Y-%m-%dT%H:%M"),
                   "bat_dau_chu": _gio(bd), "ket_thuc_chu": _gio(kt), "utc_lech": chd.lech_gio(bd.date())})
    ba = ds[0]
    tra_loi = L("cung_hd.bang.tra_loi",
                "Mười hai cung hoàng đạo chia vòng đi của Mặt Trời thành 12 phần, mỗi phần 30°. Năm {nam}, Mặt Trời vào {ten0} "
                "(cung đầu tiên) {bd} giờ Việt Nam; mỗi cung kéo dài khoảng 29–32 ngày và ngày đổi cung xê dịch một chút theo "
                "năm, nên sinh đúng ngày giáp ranh cần xem giờ sinh.", nam=nam, ten0=ba["ten"], bd=ba["bat_dau_chu"])
    return {"nam": nam, "cung": ds, "tra_loi": tra_loi}


def tra_cuu(ngay: dt.date, gio: str | None = None, vung: str = "north") -> dict:
    """Cung Mặt Trời của một ngày sinh (+ giờ, vùng nơi sinh) kèm câu trả lời. Không lưu, không trả lại ngày giờ đã nhập
    ngoài trường `ngay` của chính câu trả lời."""
    kq = chd.tra_ngay(ngay, gio, vung)
    off = kq["utc_lech"]
    d = f"{ngay.day}/{ngay.month}/{ngay.year}" if ngon_ngu.la_viet() else ngay.strftime("%b %-d, %Y")
    ra = {**kq, "cung": _o(kq["cung"]) if kq["cung"] else None,
          "cung_truoc": _o(kq["cung_truoc"]), "cung_sau": _o(kq["cung_sau"])}
    if not kq["giap_ranh"]:
        ma = kq["cung"]
        nam_bd = ngay.year - (1 if ma == "ma_ket" and ngay.month == 1 else 0)
        k = chd.khoang_cung(nam_bd, ma)
        ra["cau"] = L("cung_hd.tra.mot", "Sinh ngày {d}: cung {ten}. Lần ấy Mặt Trời ở {ten} từ {bd} đến {kt} (giờ đồng hồ {utc}).",
                      d=d, ten=_ten(ma), bd=_gio(chd.gio_dia_phuong(k["bat_dau_utc"], vung)),
                      kt=_gio(chd.gio_dia_phuong(k["ket_thuc_utc"], vung)), utc=_utc(off))
    elif kq["cung"] is None:
        ra["cau"] = L("cung_hd.tra.giap", "Ngày {d} là ngày giáp ranh: Mặt Trời sang {sau} lúc {moc} (giờ đồng hồ {utc}). Sinh trước "
                      "giờ ấy là cung {truoc}, từ giờ ấy là cung {sau}. Nhập giờ sinh để biết chắc.",
                      d=d, sau=_ten(kq["cung_sau"]), truoc=_ten(kq["cung_truoc"]), moc=kq["moc"]["gio"], utc=_utc(off))
    else:
        ra["cau"] = L("cung_hd.tra.gio", "Sinh {gio} ngày {d}: cung {ten}. Hôm ấy Mặt Trời sang {sau} lúc {moc} (giờ đồng hồ {utc}).",
                      gio=gio, d=d, ten=_ten(kq["cung"]), sau=_ten(kq["cung_sau"]), moc=kq["moc"]["gio"], utc=_utc(off))
        if kq["sat_moc"]:
            ra["cau"] += L("cung_hd.tra.sat", " Giờ sinh cách mốc dưới 5 phút — nên lập bản đồ sao đủ giờ và nơi sinh để kiểm lại.")
    return ra
