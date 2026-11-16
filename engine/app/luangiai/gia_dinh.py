# -*- coding: utf-8 -*-
"""GD-1 đợt 1 (2026-11-16, chủ dự án duyệt) — "Bảng nhà mình": tối đa 8 người nhà theo một năm âm lịch.

RULES tất định, chỉ GHÉP phép tính sẵn có (không công thức mới):
  - từng người: can chi năm sinh (năm âm Việt), tuổi mụ, quan hệ con giáp với năm (`tuoi_dan_gian.quan_he_chi`), Tam tai,
    sao hạn Cửu Diệu (cần giới tính), cung phi Bát trạch (cần giới tính) → MỘT việc nên làm (KB `gia_dinh_kb.nguoi`);
  - từng cặp: quan hệ con giáp hai năm sinh → điểm sáng (tam hợp / lục hợp / cùng con giáp) hoặc nên để ý (xung / hại /
    hình), lời theo nhóm quan hệ suy từ vai (vợ chồng, cha mẹ – con, ông bà – cháu, anh em, người cùng nhà);
  - cả nhà: hướng tốt chung theo cung phi (`phongthuy.bang_huong`), lối sang công cụ đã có (chọn ngày cả nhà, tuổi làm
    nhà, tuổi xông đất).
Không chấm điểm, không xếp hạng người, không ghép Bát tự chéo (không có nguồn). Người dưới 18 tuổi nhận lời cho cha mẹ.
Engine KHÔNG nhận tên người: web gửi mã ngắn `id` + vai + năm sinh (+ giới tính, ngày sinh tuỳ chọn), không lưu gì."""
from __future__ import annotations

import datetime as dt
from itertools import combinations

from app.calc import lunar, phongthuy as pt
from app.calc import tuoi_dan_gian as t
from app.config import CALENDAR_MERIDIAN_TZ as TZ
from app.kb import nap

TOI_DA = 8
VAI = ("ban_than", "vo_chong", "con", "bo", "me", "anh_chi", "em", "ong_ba", "chau", "bo_me_ben_kia", "con_dau_re",
       "nguoi_cung_nha")
# Thế hệ nhìn từ người dùng: để suy nhóm quan hệ của một cặp bất kỳ.
_DOI = {"ong_ba": 2, "bo": 1, "me": 1, "bo_me_ben_kia": 1, "ban_than": 0, "vo_chong": 0, "anh_chi": 0, "em": 0,
        "con": -1, "con_dau_re": -1, "chau": -2}
_THUAN = ("tam_hop", "luc_hop", "trung")
_CAN_Y = ("xung", "hai", "hinh")
_THU_TU_CAP = {"xung": 0, "tam_hop": 1, "luc_hop": 2, "hai": 3, "hinh": 4, "trung": 5}


def _kb() -> dict:
    return nap.doc("gia_dinh_kb.json")


def _nam_am(d: dt.date) -> int:
    return lunar.solar_to_lunar(d.day, d.month, d.year, TZ)[2]


def nam_am_hien_tai(hom_nay: dt.date | None = None) -> int:
    from app import config  # noqa: PLC0415
    return _nam_am(hom_nay or config.hom_nay_vn())


def nhom_cap(va: str, vb: str) -> str:
    if "nguoi_cung_nha" in (va, vb):
        return "gia_dinh"
    da, db = _DOI[va], _DOI[vb]
    if {va, vb} == {"ban_than", "vo_chong"}:
        return "vo_chong"
    if abs(da - db) == 1:
        return "cha_me_con"
    if abs(da - db) == 2:
        return "ong_chau"
    return "anh_em" if da == db else "gia_dinh"


def _mot(p: dict, nam: int) -> dict:
    uoc = True
    nam_am = p["nam_sinh"]
    if p.get("ngay_sinh"):
        nam_am, uoc = _nam_am(dt.date.fromisoformat(p["ngay_sinh"])), False
    can, chi = t.can_chi_nam(nam_am)
    can_n, chi_n = t.can_chi_nam(nam)
    tuoi = t.tuoi_mu(nam_am, nam)
    qh = t.quan_he_chi(chi, chi_n)
    tt = t.pham_tam_tai(chi, chi_n)
    gt = p.get("gioi_tinh")
    # Tuổi thật (năm xem − năm sinh) < 18 → lời cho cha mẹ; không biết ngày sinh thì lệch tối đa một tuổi, nghiêng về "trẻ".
    duoi_18 = (nam - nam_am) < 18
    cung = None
    if gt in ("nam", "nu"):
        mq = pt.menh_quai(nam_am, gt, dt.date.fromisoformat(p["ngay_sinh"]) if p.get("ngay_sinh") else None)
        cung = {"quai": mq["quai"], "nhom": mq["nhom"],
                "huong_tot": [h for h, dn in pt.bang_huong(mq["quai"]).items() if dn in pt.CAT]}
    k = _kb()["nguoi"]
    ma = "tam_tai" if tt else qh if qh in ("trung", "xung", "hinh", "hai") else "hop" if qh in ("tam_hop", "luc_hop") else "binh"
    loi = k[ma]["tre_em" if duoi_18 else "nguoi_lon"].format(n=tt or "")
    nhan = [k[ma]["ten"].format(n=tt or "")]
    if tt and qh in ("trung", "xung"):
        nhan.append(k[qh]["ten"])
    return {"id": p["id"], "vai": p["vai"], "nam_sinh": p["nam_sinh"], "nam_am": nam_am, "chi_nam_sinh_uoc_luong": uoc,
            "can_chi": f"{can} {chi}", "con_giap": chi, "tuoi_mu": tuoi, "duoi_18": duoi_18,
            "quan_he_nam": qh or "binh", "tam_tai": tt, "ma": ma, "nhan": nhan, "viec": loi,
            "sao_han": t.sao_han(tuoi, gt) if gt in ("nam", "nu") else None, "cung_phi": cung,
            "can_cu": f"Tuổi {can} {chi} – năm {can_n} {chi_n}; tuổi mụ {tuoi}" + (f"; Tam tai năm thứ {tt}" if tt else "")}


def _cap(ds: list[dict]) -> list[dict]:
    k = _kb()
    ra = []
    for a, b in combinations(ds, 2):
        qh = t.quan_he_chi(a["con_giap"], b["con_giap"])
        if qh not in _THUAN and qh not in _CAN_Y:
            continue
        nhom = nhom_cap(a["vai"], b["vai"])
        loai = "diem_sang" if qh in _THUAN else "nen_de_y"
        ra.append({"a": a["id"], "b": b["id"], "quan_he": qh, "loai": loai, "nhom": nhom,
                   "tieu_de": k["cap"][qh]["tieu_de"], "noi_dung": k["cap"][qh]["noi_dung"], "viec": k["viec"][nhom][loai],
                   "can_cu": f"Con giáp {a['con_giap']} – {b['con_giap']}"})
    # Cặp có người dùng lên trước; trong đó cặp nên để ý trước rồi mới tới điểm sáng.
    ra.sort(key=lambda c: (0 if "ban_than" in (_vai(ds, c["a"]), _vai(ds, c["b"])) else 1, _THU_TU_CAP[c["quan_he"]]))
    return ra


def _vai(ds: list[dict], i: str) -> str:
    return next(x["vai"] for x in ds if x["id"] == i)


def _huong(ds: list[dict]) -> dict:
    k = _kb()["huong"]
    co = [x for x in ds if x["cung_phi"]]
    nhom: dict[str, list[str]] = {}
    for x in co:
        nhom.setdefault(x["cung_phi"]["nhom"], []).append(x["id"])
    if not co:
        return {"chung": [], "nhom": nhom, "loi": k["thieu"]}
    chung = [h for h in pt.HUONG if all(h in x["cung_phi"]["huong_tot"] for x in co)]
    loi = k["chung"].format(ds=", ".join(chung)) if chung else k["hai_nhom"]
    if len(co) < len(ds):
        loi += " " + k["thieu"]
    return {"chung": chung, "nhom": nhom, "loi": loi}


def _tom_tat(ds: list[dict]) -> dict:
    k = _kb()["tom_tat"]
    muc = []
    for ma, loc in (("tam_tai", lambda x: x["tam_tai"]), ("trung", lambda x: x["quan_he_nam"] == "trung"),
                    ("xung", lambda x: x["quan_he_nam"] == "xung"), ("hop", lambda x: x["quan_he_nam"] in ("tam_hop", "luc_hop"))):
        ids = [x["id"] for x in ds if loc(x)]
        if ids:
            muc.append({"ma": ma, "so": len(ids), "ids": ids, "chu": k[ma].format(so=len(ids))})
    return {"muc": muc}


def _viec_chung(ds: list[dict], nam: int) -> list[dict]:
    k = _kb()["viec_chung"]
    ra = [{"ma": "chon_ngay", "ten": k["chon_ngay"]["ten"], "mo_ta": k["chon_ngay"]["mo_ta"], "duong": "/xem-ngay-tot#chon-ngay-nhieu"}]
    nguoi_lon = sorted((x for x in ds if not x["duoi_18"]), key=lambda x: (x["vai"] not in ("ban_than", "vo_chong"), x["vai"] != "ban_than"))
    for x in nguoi_lon[:2]:
        ra.append({"ma": "lam_nha", "id": x["id"], "ten": k["lam_nha"]["ten"].format(nam=nam), "mo_ta": k["lam_nha"]["mo_ta"],
                   "duong": f"/xem-tuoi-lam-nha/{nam}/tuoi-{x['nam_am']}"})
    chu = next((x for x in ds if x["vai"] == "ban_than"), nguoi_lon[0] if nguoi_lon else None)
    if chu and not chu["duoi_18"]:
        ra.append({"ma": "xong_dat", "id": chu["id"], "ten": k["xong_dat"]["ten"].format(nam=nam), "mo_ta": k["xong_dat"]["mo_ta"],
                   "duong": f"/tuoi-xong-dat/{nam}/tuoi-{chu['nam_am']}"})
    return ra


def bang(nam: int, nguoi: list[dict]) -> dict:
    if not 1 <= len(nguoi) <= TOI_DA:
        raise ValueError(f"Cần từ 1 đến {TOI_DA} người")
    if sum(p["vai"] == "ban_than" for p in nguoi) > 1 or sum(p["vai"] == "vo_chong" for p in nguoi) > 1:
        raise ValueError("Chỉ một người cho vai bạn / vợ chồng")
    if len({p["id"] for p in nguoi}) != len(nguoi):
        raise ValueError("Mã người bị trùng")
    if any(p["vai"] not in VAI for p in nguoi):
        raise ValueError("Vai không có trong danh mục")
    ds = [_mot(p, nam) for p in nguoi]
    can, chi = t.can_chi_nam(nam)
    return {"nam": {"nam": nam, "can_chi": f"{can} {chi}"}, "nguoi": ds, "cap": _cap(ds), "huong": _huong(ds),
            "tom_tat": _tom_tat(ds), "viec_chung": _viec_chung(ds, nam), "luu_y": _kb()["luu_y"]}
