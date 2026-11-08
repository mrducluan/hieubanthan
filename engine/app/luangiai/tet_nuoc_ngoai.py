# -*- coding: utf-8 -*-
"""QTE-1 tuần 2 — "Tết ở nước ngoài" cho người Việt ở Mỹ, Nhật, Úc, Canada (tầng RULES: chỉ ghép CALC + KB).

- Ngày Tết = mùng 1 tháng Giêng âm lịch VIỆT NAM (Hồ Ngọc Đức, UTC+7) — không đổi theo nơi ở; so lịch Trung Quốc (UTC+8),
  năm hai lịch lệch thì nói rõ (cộng đồng người Hoa ở nước sở tại có thể đón ngày khác).
- Giờ giao thừa Việt Nam (0 giờ mùng 1, UTC+7) quy ra giờ đồng hồ từng vùng của nước đó — múi giờ IANA (`calc.mui_gio`),
  có giờ mùa hè (Úc tháng 1–2 đang mùa hè). Gom các thành phố cùng múi giờ.
- Lời ở KB `tet_nuoc_ngoai_kb.json` (câu khung có biến); không dự báo, không phán.
"""
from __future__ import annotations

import datetime as dt
import json
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo

from app.calc import lunar, mui_gio

_KB = Path(__file__).resolve().parents[1] / "kb" / "data" / "tet_nuoc_ngoai_kb.json"
_VN = dt.timezone(dt.timedelta(hours=7))
_THU = ("Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật")


@lru_cache(maxsize=1)
def _kb() -> dict:
    return json.loads(_KB.read_text(encoding="utf-8"))


CAC_NUOC: tuple[str, ...] = tuple(json.loads(_KB.read_text(encoding="utf-8"))["nuoc"])


def _ngay_tet(nam: int, tz: float) -> dt.date:
    d, m, y = lunar.lunar_to_solar(1, 1, nam, 0, tz)
    return dt.date(y, m, d)


def nam_tet_sap_toi(hom_nay: dt.date) -> int:
    """Tết gần nhất chưa qua quá 7 ngày (đang trong tuần Tết vẫn là Tết năm nay)."""
    tet = _ngay_tet(hom_nay.year, 7)
    return hom_nay.year if hom_nay <= tet + dt.timedelta(days=7) else hom_nay.year + 1


def danh_sach() -> list[dict]:
    return [{"slug": s, "ten": v["ten"], "ma": v["ma"]} for s, v in _kb()["nuoc"].items()]


def _dmy(d: dt.date) -> str:
    return d.strftime("%d/%m/%Y")


def tet(slug: str, nam: int) -> dict:
    kb = _kb()
    if slug not in kb["nuoc"]:
        raise KeyError(slug)
    nuoc = kb["nuoc"][slug]
    tet_vn, tet_trung = _ngay_tet(nam, 7), _ngay_tet(nam, 8)
    can, chi = lunar.can_chi_nam(nam)
    giao_thua_vn = dt.datetime(tet_vn.year, tet_vn.month, tet_vn.day, tzinfo=_VN)
    dm = next(n for n in mui_gio.danh_muc() if n["ma"] == nuoc["ma"])
    gom: dict[str, dict] = {}
    for tp in dm["thanh_pho"]:
        z = tp["mui_gio"]
        if z not in gom:
            luc = giao_thua_vn.astimezone(ZoneInfo(z))
            off = luc.utcoffset().total_seconds() / 3600
            gom[z] = {"mui_gio": z, "thanh_pho": [], "ngay": luc.date().isoformat(), "gio": luc.strftime("%H:%M"),
                      "utc": off, "gio_mua_he": bool(luc.dst())}
        gom[z]["thanh_pho"].append(tp["ten"])
    vung = sorted(gom.values(), key=lambda v: -v["utc"])
    dai = vung[0]   # vùng sớm nhất (phía đông)

    def _gio_ngan(v: dict) -> str:
        d = dt.date.fromisoformat(v["ngay"])
        return f"{v['gio']} ngày {d.strftime('%d/%m')}"

    gio_tom_tat = _gio_ngan(dai) if len(vung) == 1 else \
        "; ".join(f"{_gio_ngan(v)} ({v['thanh_pho'][0].split(' (')[0]})" for v in (vung[0], vung[-1]))
    truoc = tet_vn - dt.timedelta(days=1)
    bien = {"nam": nam, "can_chi": f"{can} {chi}", "ten": nuoc["ten"], "thu_tet": _THU[tet_vn.weekday()],
            "ngay_tet": _dmy(tet_vn), "ngay_tet_trung": _dmy(tet_trung), "gio_vn_tom_tat": gio_tom_tat,
            "dem_giao_thua": f"{truoc.strftime('%d/%m')} → {_dmy(tet_vn)}"}

    def f(s: str) -> str:
        return s.format(**bien)

    lich_khac = tet_trung != tet_vn
    return {
        "slug": slug, "nam": nam, "can_chi": bien["can_chi"], "ten": nuoc["ten"], "ten_day_du": nuoc["ten_day_du"],
        "ngay_tet": tet_vn.isoformat(), "thu_tet": bien["thu_tet"], "ngay_tet_trung": tet_trung.isoformat(),
        "lich_khac": lich_khac, "ghi_chu_lich": f(kb["lich_khac"] if lich_khac else kb["lich_giong"]),
        "dem_giao_thua": bien["dem_giao_thua"], "gio_giao_thua_vn": vung,
        "tra_loi_nhanh": f(kb["tra_loi_nhanh"]), "cong_dong": nuoc["cong_dong"],
        "xong_dat": f(kb["xong_dat"]), "hoang_dao": kb["hoang_dao"],
        "hoi_dap": [{"hoi": f(h["hoi"]), "dap": f(h["dap"])} for h in kb["hoi_dap"]],
    }
