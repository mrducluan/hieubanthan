# -*- coding: utf-8 -*-
"""GV-1 — "Khi góp vốn với người khác" (RULES, tất định). Tách từ PR #375, làm lại sau review 2026-11-26.

- Một bộ tính với Bản đồ quản lý nhân sự (DC-1): hành mạnh từng người = `calc.doanh_chu._ho_so_co_ban`, vai trò =
  `calc.doanh_chu._VAI_TRO_HANH` — không bảng hành → vai trò thứ hai.
- Mỗi người được đọc ĐỘC LẬP (không gán lại theo thứ tự nhập) → đảo danh sách cho cùng kết quả.
- Không cộng điểm ngũ hành nhiều người, không chấm điểm, không khuyên hợp tác hay không với ai; "khâu còn trống" là khâu
  chưa ai nghiêng hẳn (hành mạnh nhất hoặc hành thứ hai gần ngang).
- Lời ở KB `doanh_chu_gop_von_kb.json` (+ `en/`)."""
from __future__ import annotations

from app import ngon_ngu
from app.calc import doanh_chu as dc
from app.kb import nap
from app.kb import ten as ten_kb
from app.kb.loi import danh_sach

_TEP = "doanh_chu_gop_von_kb.json"
THU_TU_LAM = ("mo_thi_truong", "kiem_soat_tai_chinh", "van_hanh")
NGUONG_PHU = 0.75          # hành thứ hai ≥ 75 % hành mạnh nhất → người đó cũng nghiêng về khâu của hành thứ hai


def _kb() -> dict:
    return nap.doc(_TEP)


def _lam_cua_hanh(hanh: str) -> str:
    """Khâu (làn) mà hành này thuộc về — bảng ở KB bản Việt (bản phủ tiếng Anh chỉ đổi chữ, giữ danh sách hành)."""
    return next(ma for ma, v in _kb()["lam"].items() if hanh in (v.get("hanh") or []))


def phan_tich(sang_lap: list[dict], nam_xem: int) -> dict:
    vi = ngon_ngu.la_viet()
    k = _kb()
    phan_vai: list[dict] = []
    co: set[str] = set()
    for tv in sang_lap:
        hs = dc._ho_so_co_ban(int(tv["ngay"]), int(tv["thang"]), int(tv["nam"]), tv.get("gioi_tinh") or "nam", nam_xem)
        tl = hs["ty_le_ngu_hanh"]
        xep = sorted(tl, key=lambda h: (-tl[h], dc.HANH_5.index(h)))
        lam = _lam_cua_hanh(hs["hanh_manh"])
        lam_phu = None
        if tl[xep[1]] >= NGUONG_PHU * tl[xep[0]] and _lam_cua_hanh(xep[1]) != lam:
            lam_phu = _lam_cua_hanh(xep[1])
        co.update(x for x in (lam, lam_phu) if x)
        vt_ten, vt_gt = dc._VAI_TRO_HANH[hs["hanh_manh"]]["vi" if vi else "en"]
        phan_vai.append({
            "ten": (tv.get("ten") or "").strip(),
            "hanh_manh_ma": hs["hanh_manh"],
            "hanh_manh": ten_kb.ten("hanh", hs["hanh_manh"]),
            "vai_tro": vt_ten,
            "gia_tri": vt_gt,
            "lam": lam,
            "ten_lam": k["lam"][lam]["ten"],
            **({"lam_phu": lam_phu, "ten_lam_phu": k["lam"][lam_phu]["ten"]} if lam_phu else {}),
            "nen_de_y": k["lam"][lam]["nen_de_y"],
        })
    trong = [m for m in THU_TU_LAM if m not in co]
    khau = [{"ma": m, "ten": k["lam"][m]["ten"], "loi": k["khau_con_trong"][m]} for m in trong]
    tq = k["tong_quan"]["thieu" if trong else "du"]
    dieu_le = [dict(x) for x in k["dieu_le"]]
    ty_le = [tv.get("ty_le_du_kien") for tv in sang_lap]
    if len(sang_lap) == 2 and all(x is not None for x in ty_le) and abs(float(ty_le[0]) - float(ty_le[1])) < 1e-9:
        dieu_le.append({"ma": "ty_le_50_50", **k["dieu_le_them"]["ty_le_50_50"]})
    if "kiem_soat_tai_chinh" in trong:
        dieu_le.append({"ma": "thieu_tai_chinh", **k["dieu_le_them"]["thieu_tai_chinh"]})
    return {
        "nam_xem": nam_xem,
        "tong_quan": {"nhan": tq["nhan"], "tom_tat": tq["tom_tat"].format(
            khau=danh_sach([x["ten"].lower() for x in khau]) if khau else "")},
        "phan_vai": phan_vai,
        "khau_con_trong": khau,
        "dieu_le_goi_y": dieu_le,
        "ranh_gioi_phap_ly": k["ranh_gioi"],
        "nguon": k.get("_nguon", "") if vi else "",
    }
