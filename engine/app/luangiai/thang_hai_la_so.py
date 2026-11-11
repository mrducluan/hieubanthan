# -*- coding: utf-8 -*-
"""Ý1 (HTT-2 mục 8, chủ dự án duyệt 2026-11-09) — thông báo đầu tháng "tháng này hai lá số cùng nói" cho Web Push.

Chỉ GHÉP hộp tháng của "Thời gian tới" (`thoi_gian_toi.gop_thang`: Tử vi = tháng âm chứa ngày 15 của tháng dương, Bát tự
= tháng theo tiết chứa ngày 15; mức của hộp chỉ khi hai lá số cùng mức — không chấm lại, không đổi mức môn nào):
- cùng mức → "Tử vi và Bát tự cùng thấy tháng … <mức>" + đúng VIỆC NÊN LÀM của hộp tháng;
- khác mức → "hai lá số nhìn hai mặt" (mỗi môn nhìn một mặt — lời `nhat_quan_kb.nam.mat`), việc theo mức dè dặt hơn.
Thiếu giờ sinh (không có cả hai lá) → None. Không dự báo, không doạ. Lời mẫu ở KB `push_sang_nay.json` (`mau.thang_hai_*`).
Engine không biết ai là ai, không lưu — web máy chủ (cron) chỉ gửi lá số của người đã tự tích nhận mốc này.
"""
from __future__ import annotations

import datetime as dt

from app.calc import phongthuy as P
from app.luangiai import doi_song_khuon as kh
from app.luangiai import nhat_quan
from app.luangiai import thoi_gian_lop as L
from app.luangiai import thoi_gian_toi as T
from app.luangiai.sang_nay import _kb

DUONG = "/thoi-gian-toi#lg-muoi_hai_thang"
_THU_TU = ("can_chu_dong", "can_bang", "thuan")


def lap(ngay_sinh: dt.date, hom_nay: dt.date, gioi_tinh: str | None, tv_sinh: dict | None, bt_sinh: dict | None) -> dict | None:
    if not (tv_sinh and bt_sinh):
        return None
    mau = _kb()["mau"]
    thang = f"{hom_nay.month}/{hom_nay.year}"
    ts = T._thang_ts(ngay_sinh.day, ngay_sinh.month, hom_nay, 1)
    tv = T._tv_thang(tv_sinh, hom_nay, 1, None)
    bt = T._bt_thang(bt_sinh, hom_nay, 2)        # tháng tiết đầu có thể bắt đầu trước ngày 1 → lấy 2 để phủ ngày 15
    quai = P.menh_quai(ngay_sinh.year, gioi_tinh, ngay_sinh)["quai"] if gioi_tinh else None
    lop = {thang: L.lop_thang(hom_nay.month, hom_nay.year, ngay_sinh, quai, tu_ngay=hom_nay)}
    hop = T.gop_thang(ts, tv, bt, lop)[0]
    hang = {r["ma"]: r for r in hop.get("lop", [])}
    a, b = hang.get("tuvi"), hang.get("battu")
    if not (a and a.get("muc") and b and b.get("muc")):
        return None                                   # một lá không có tháng phủ ngày 15 (biên lịch) → không báo
    muc = hop.get("muc")
    viec = hop.get("huong_xu_ly") or ""
    if muc:
        nhan = kh.NHAN_MUC[muc].lower()
        tieu_de = mau["thang_hai_cung_tieu_de"].format(thang=hom_nay.month, nhan=nhan)
        noi_dung = mau["thang_hai_cung_noi_dung"].format(nhan=nhan, tom=hop["noi_dung"].rstrip("."), viec=viec.rstrip("."))
    else:
        mat = nhat_quan.kb()["nam"]["mat"]
        thap = min((a["muc"], b["muc"]), key=_THU_TU.index)
        tieu_de = mau["thang_hai_khac_tieu_de"].format(thang=hom_nay.month)
        noi_dung = mau["thang_hai_khac_noi_dung"].format(
            tv=kh.NHAN_MUC[a["muc"]].lower(), bt=kh.NHAN_MUC[b["muc"]].lower(), mat_tv=mat["tuvi"], mat_bt=mat["battu"],
            viec=(viec or mau["thang_hai_viec_mac_dinh"][thap]).rstrip("."))
    return {"thang": thang, "cung": bool(muc), "muc": muc, "tieu_de": tieu_de.strip(), "noi_dung": " ".join(noi_dung.split()),
            "duong": DUONG, "ma_mau": hop.get("ma_mau")}
