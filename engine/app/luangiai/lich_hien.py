# -*- coding: utf-8 -*-
"""EN-ALL GĐ 7 — lớp HIỂN THỊ theo ngôn ngữ cho phần lịch cổ truyền mà trang Hôm nay / Tuần này / khối "Đọc tiếp" ghép vào
(mẫu: `phongthuy_hien.py`, `battu_hien.py`).

`luangiai.hoang_lich` đọc KB lúc nạp module và trả TÊN Việt (trực, thần, việc nên / kiêng, giờ xuất hành, quan hệ tuổi…)
— các module kia còn so sánh chính các tên đó để quyết định (nhịp, ngày thuận). Nên phép tính và quyết định giữ nguyên
bằng tên Việt; chỉ ở BƯỚC HIỂN THỊ, tên Việt được tra ngược ra mã của KB (chữ Hán / mã) rồi đổi sang bản phủ
`kb/data/<ngôn ngữ>/hoang_lich_kb.json`. Tiếng Việt: mọi hàm trả nguyên đầu vào (bản Việt trùng từng byte).
Tên không tra được → giữ nguyên (không bịa).
"""
from __future__ import annotations

import copy
import datetime as dt
import re

from app import ngon_ngu
from app.kb import nap
from app.kb import ten as _ten
from app.kb.loi import L

TEP = "hoang_lich_kb.json"
_MUC = ("nghi_ky", "truc", "than", "ly_thuan_phong", "ky_dan_gian", "quan_he_tuoi", "nhan_tap_quan")
THU = ("Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật")
_NGUOC: dict[str, dict[str, str]] = {}


def la_viet() -> bool:
    return ngon_ngu.hien_tai() == ngon_ngu.MAC_DINH


def _nguoc(muc: str) -> dict[str, str]:
    """Tên Việt → mã KB (đọc bản Việt của KB `hoang_lich` — cùng nguồn module tính dùng)."""
    if not _NGUOC:
        from app.luangiai import hoang_lich as hl  # noqa: PLC0415
        for m in _MUC:
            bang: dict[str, str] = {}
            for k, v in hl.KB[m].items():
                bang.setdefault(v["ten"], k)
            _NGUOC[m] = bang
        _NGUOC["viec"] = {v["ten"]: str(i) for i, v in enumerate(hl.KB["viec"])}
    return _NGUOC[muc]


def _phu(muc: str, ma: str) -> dict:
    kb = nap.doc(TEP)
    if muc == "viec":
        ds = kb.get("viec") or []
        i = int(ma)
        return ds[i] if i < len(ds) else {}
    return (kb.get(muc) or {}).get(ma) or {}


def ten(muc: str, vi: str | None, truong: str = "ten") -> str | None:
    """Tên Việt của một mục KB lịch → chữ theo ngôn ngữ (trường `truong` của mục: ten / y / hop / tranh / nghia)."""
    if vi is None or la_viet():
        return vi
    ma = _nguoc(muc).get(vi)
    if ma is None:
        return vi
    return _phu(muc, ma).get(truong) or vi


def truc(vi_ten: str, truong: str = "ten") -> str:
    """Trường của trực tra theo TÊN trực Việt ("Kiến" → y / hop / tranh theo ngôn ngữ)."""
    if la_viet():
        from app.luangiai import hoang_lich as hl  # noqa: PLC0415
        ma = _nguoc("truc").get(vi_ten)
        return hl.KB["truc"][ma][truong] if ma else vi_ten
    ma = _nguoc("truc").get(vi_ten)
    if ma is None:
        return vi_ten
    return _phu("truc", ma).get(truong) or vi_ten


def ds(muc: str, ten_vi: list[str]) -> list[str]:
    return [ten(muc, x) for x in ten_vi] if not la_viet() else ten_vi


def can_chi(s: str | None) -> str | None:
    """"Canh Tý" → "Geng Zi" (mỗi chữ là can hoặc chi)."""
    if not s or la_viet():
        return s
    return " ".join(_ten.ten("can", t) if _ten.muc("can", t) else _ten.ten("chi", t) for t in s.split())


def quan_he(q: dict | None) -> dict | None:
    """Quan hệ ngày ↔ tuổi (`hoang_lich._quan_he`): {ma, ten, nghia} — mã giữ, chữ theo ngôn ngữ."""
    if not q or la_viet():
        return q
    q = dict(q)
    if q.get("ma"):
        q["ten"] = ten("quan_he_tuoi", q["ten"])
        q["nghia"] = _qh_nghia(q["ma"], q.get("nghia"))
    else:
        q["ten"] = L("lich.qh.binh.ten", "Bình thường")
        q["nghia"] = L("lich.qh.binh.nghia", "ngày không xung không hợp với tuổi bạn")
    return q


def _qh_nghia(ma: str, vi: str | None) -> str | None:
    return _phu("quan_he_tuoi", ma).get("nghia") or vi


def xuat_hanh(x: dict) -> dict:
    """Giờ xuất hành Lý Thuần Phong {ten, tot, nghia}."""
    if la_viet():
        return x
    x = dict(x)
    ma = _nguoc("ly_thuan_phong").get(x.get("ten", ""))
    if ma:
        p = _phu("ly_thuan_phong", ma)
        x["ten"] = p.get("ten") or x["ten"]
        x["nghia"] = p.get("nghia") or x.get("nghia")
    return x


def thu(i: int) -> str:
    """Tên ngày trong tuần (0 = Thứ Hai)."""
    return L(f"lich.thu.{i}", THU[i])


def dm(d: dt.date) -> str:
    """Ngày-tháng ngắn: "17/11" (Việt) · "17 Nov" (Anh)."""
    if la_viet():
        return f"{d.day}/{d.month}"
    return L("pt.ngay_thang", "{d}/{thang}", d=d.day, thang=L(f"pt.thang_ten.{d.month}", str(d.month)))


def tom_tat_ngay(t: dict | None) -> dict | None:
    """Kết quả `hoang_lich.tom_tat` (ngày tốt gần nhất…) → chữ theo ngôn ngữ."""
    if not t or la_viet():
        return t
    t = dict(t)
    t["can_chi"] = can_chi(t.get("can_chi"))
    t["truc"] = ten("truc", t.get("truc"))
    t["than"] = ten("than", t.get("than"))
    t["ky_dan_gian"] = ds("ky_dan_gian", list(t.get("ky_dan_gian") or []))
    t["nhan_tap_quan"] = ds("nhan_tap_quan", list(t.get("nhan_tap_quan") or []))
    if t.get("viec"):
        t["viec"] = ten("viec", t["viec"])
    return t


_LY_DO_CO_DINH = {
    "sách lịch ghi việc này trong mục Nên": "lich.ly_do.nen",
    "sách lịch ghi việc này trong mục Kiêng": "lich.ly_do.kieng",
    "sách lịch khuyên hoãn mọi việc lớn trong ngày này": "lich.ly_do.hoan",
    "sách lịch khuyên chỉ làm các việc ghi ở mục Nên, việc này nên hoãn sang ngày khác": "lich.ly_do.chi_nen",
    "sách lịch không ghi riêng việc này hôm nay": "lich.ly_do.khong_ghi",
}
_LY_DO_TRUC = re.compile(r"^trực (.+) — sách lịch khuyên tránh việc này$")
_LY_DO_DG = re.compile(r"^ngày (.+) — dân gian thường tránh$")


def hoang_lich_hom_nay(h: dict) -> dict:
    """Khối `hoang_lich` của trang Hôm nay (`hom_nay._hoang_lich`) → chữ theo ngôn ngữ. Số, mã, bool, độ dài giữ nguyên."""
    if la_viet():
        return h
    h = copy.deepcopy(h)
    truc_vi = h["truc"]
    h["truc"] = ten("truc", truc_vi)
    h["truc_y"] = truc(truc_vi, "y")
    h["than"] = ten("than", h["than"])
    for g in h.get("gio_hoang_dao") or []:
        g["than"] = ten("than", g["than"])
    for g in h.get("gio") or []:
        g["can_chi"] = can_chi(g.get("can_chi"))
        g["than"] = ten("than", g.get("than"))
        if g.get("xuat_hanh"):
            g["xuat_hanh"] = xuat_hanh(g["xuat_hanh"])
    h["xung_tuoi"] = can_chi(h.get("xung_tuoi"))
    if h.get("tuoi"):
        h["tuoi"]["can_chi"] = can_chi(h["tuoi"].get("can_chi"))
        h["tuoi"]["quan_he"] = quan_he(h["tuoi"].get("quan_he"))
    h["nghi"] = ds("nghi_ky", h.get("nghi") or [])
    h["ky"] = ds("nghi_ky", h.get("ky") or [])
    h["ky_dan_gian"] = ds("ky_dan_gian", h.get("ky_dan_gian") or [])
    h["ngay_tot_gan"] = tom_tat_ngay(h.get("ngay_tot_gan"))
    for v in h.get("viec") or []:
        v["ten"] = ten("viec", v.get("ten"))
        v["ly_do"] = [ly_do(x) for x in v.get("ly_do") or []]
        v["ngay_tot_gan"] = tom_tat_ngay(v.get("ngay_tot_gan"))
    return h


def ly_do(s: str) -> str:
    """Một dòng lý do của `hoang_lich._ly_do` → câu theo ngôn ngữ (dạng lạ giữ nguyên)."""
    if la_viet() or not isinstance(s, str):
        return s
    if s in _LY_DO_CO_DINH:
        return L(_LY_DO_CO_DINH[s], s)
    m = _LY_DO_TRUC.match(s)
    if m:
        return L("lich.ly_do.truc", s, truc=ten("truc", m.group(1)))
    m = _LY_DO_DG.match(s)
    if m:
        return L("lich.ly_do.dan_gian", s, ten=ten("ky_dan_gian", m.group(1)))
    return s
