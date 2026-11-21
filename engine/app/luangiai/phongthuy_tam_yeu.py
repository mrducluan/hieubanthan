# -*- coding: utf-8 -*-
"""RULES — công cụ "Tra nhanh Cửa – Chủ – Bếp" theo Dương Trạch Tam Yếu (rà soát 2026-11-21).

Một bộ tính: du niên ba cặp cửa–chủ, cửa–bếp, chủ–bếp lấy từ `calc.phongthuy.cua_chu_bep` (cùng hàm báo cáo
Nhà của bạn và hỏi đáp dùng). Mức theo thang chung (thuan / can_bang / can_chu_dong), không điểm số. Lời ở KB
`phongthuy_tam_yeu.json` → `cong_cu` (+ bản phủ tiếng Anh). Câu sách xưa đi qua MỘT khuôn SX-C
(`sach_ghi_mon.phongthuy`): nhóm C chỉ tới người đọc đã cho biết đủ 18 tuổi, luôn kèm câu kết và lời tham khảo.
"""
from __future__ import annotations

from app import ngon_ngu
from app.calc import huyen_khong as hk
from app.calc import phongthuy as pt
from app.kb import nap
from app.kb import ten as _ten
from app.luangiai import sach_ghi_mon

TEP = "phongthuy_tam_yeu.json"
QUAI_8 = ("Khảm", "Cấn", "Chấn", "Tốn", "Ly", "Khôn", "Đoài", "Càn")
_MA_CAP = {"cửa–chủ": "cua_chu", "cửa–bếp": "cua_bep", "chủ–bếp": "chu_bep"}


def _cc() -> dict:
    return nap.doc(TEP)["cong_cu"]


def _huong(q: str) -> str:
    return pt.QUAI[q][1]


def muc_du_nien(dn: str) -> str:
    return _cc()["muc_du_nien"][dn]


def _ds_huong(hs: list[str]) -> str:
    return ", ".join(_ten.ten("huong", h) for h in hs)


def _goi_y_bep(cua: str, chu: str | None) -> list[dict]:
    """Tám phía đặt bếp, xếp theo du niên với cửa (và với phòng chính khi có): hop → tam → tranh."""
    bang_cua = pt.bang_huong(cua)
    bang_chu = pt.bang_huong(chu) if chu else None
    cc = _cc()
    ra = []
    for q in QUAI_8:
        h = _huong(q)
        dc = bang_cua[h]
        dh = bang_chu[h] if bang_chu else None
        so_cat = (dc in pt.CAT) + (bool(dh) and dh in pt.CAT)
        tong = 2 if bang_chu else 1
        loai = "hop" if so_cat == tong else "tam" if so_cat else "tranh"
        ra.append({"quai": q, "huong": h, "du_nien_cua": dc, "du_nien_chu": dh, "loai": loai,
                   "nhan": cc["bep_loai"][loai]})
    thu_tu = {"hop": 0, "tam": 1, "tranh": 2}
    return sorted(ra, key=lambda x: (thu_tu[x["loai"]], QUAI_8.index(x["quai"])))


def so_do(cua: str, chu: str | None = None, bep: str | None = None, tuoi: int | None = None) -> dict:
    """`cua`, `chu`, `bep` = quái phương vị (nhìn từ tâm nhà). `tuoi` (tuổi tròn của người đọc, nếu biết) chỉ quyết định
    có hiện ghi chép nhóm C hay không — không đổi mức nào."""
    cc = _cc()
    ccb = pt.cua_chu_bep(_huong(cua), _huong(chu) if chu else None, _huong(bep) if bep else None)
    cap = []
    for x in ccb["cap"]:
        ma = _MA_CAP[x["cap"]]
        m = muc_du_nien(x["du_nien"])
        cap.append({"cap": ma, "ten": cc["ten_cap"][ma], "tu": pt.HUONG_QUAI[x["tu"]], "den": pt.HUONG_QUAI[x["den"]],
                    "du_nien": x["du_nien"], "muc": m, "loi": cc["loi_cap"][m][ma]})

    theo = {c["cap"]: c for c in cap}
    ket = None
    if cap:
        so_thuan = sum(c["muc"] != "can_chu_dong" for c in cap)
        chinh = theo.get("cua_chu") or cap[0]
        if so_thuan == len(cap):
            mk = "thuan" if all(c["muc"] == "thuan" for c in cap) or chinh["muc"] == "thuan" else "can_bang"
        elif chinh["muc"] != "can_chu_dong" or so_thuan >= 2:
            mk = "can_bang"
        else:
            mk = "can_chu_dong"
        ket = {"muc": mk, "loi": cc["ket_luan"][mk]}

    goi_y = _goi_y_bep(cua, chu)
    hop = [g["huong"] for g in goi_y if g["loai"] == "hop"]
    viec = []
    if bep:
        loai_bep = next(g["loai"] for g in goi_y if g["quai"] == bep)
        if loai_bep == "hop":
            viec.append({"chi_phi": "0", "lam": cc["viec"]["hop"]})
        else:
            huong_tot = [h for h, d in pt.bang_huong(cua).items() if d in pt.CAT and d != "Phục Vị"]
            if huong_tot:
                viec.append({"chi_phi": "0", "lam": cc["viec"]["xoay"].format(huong=_ds_huong(huong_tot[:2]))})
            if hop:
                k = "doi" if chu else "doi_cua"
                viec.append({"chi_phi": "co", "lam": cc["viec"][k].format(huong=_ds_huong(hop[:3]))})
        if "chu_bep" in theo and theo["chu_bep"]["muc"] == "can_chu_dong":
            viec.append({"chi_phi": "0", "lam": cc["viec"]["giu"]})

    can_cu = [cc["can_cu"]["cap"].format(ten_cap=c["ten"], du_nien=_ten.ten("du_nien", c["du_nien"])) for c in cap]
    if len(cap) >= 2:
        can_cu.append(cc["cung_nhom"]["co" if ccb["cung_nhom"] else "khong"])
    if bep:
        can_cu.append(cc["can_cu"]["sach_khac"])

    # SX-C: khối sách xưa (chỉ bản Việt). Đếm số mục nhóm C bị giữ lại để web mời người đọc xác nhận đủ 18 tuổi.
    sach = sach_ghi_mon.phongthuy(cua=cua, chu=chu, bep=bep, tuoi=tuoi) if (chu or bep) else None
    an_c = 0
    if ngon_ngu.la_viet() and (chu or bep) and (tuoi is None or tuoi < sach_ghi_mon.TUOI_NHOM_C):
        day_du = sach_ghi_mon.phongthuy(cua=cua, chu=chu, bep=bep, tuoi=99)
        an_c = (day_du or {}).get("so_muc", 0) - (sach or {}).get("so_muc", 0)
    ra = {
        "cua": cua, "chu": chu, "bep": bep,
        "huong": {"cua": _huong(cua), "chu": _huong(chu) if chu else None, "bep": _huong(bep) if bep else None},
        "cung_nhom": ccb["cung_nhom"] if len(cap) >= 1 else None,
        "cap": cap,
        "ket_luan": ket,
        "bep_goi_y": goi_y,
        "viec": viec,
        "can_cu": can_cu,
        "sach_ghi": sach,
        "luu_y_tham_khao": cc["luu_y_tham_khao"],
    }
    if an_c > 0 and tuoi is None:
        # Người chưa đủ 18 (tuổi đã biết) không được mời mở; chỉ người chưa cho biết tuổi mới thấy lời mời xác nhận.
        ra["nhom_c_an"] = {"so": an_c, "loi": cc["nhom_c_an"].format(n=an_c)}
    return ra


_SON_HAN: dict[str, str] = {
    "Tý": "子", "Quý": "癸", "Sửu": "丑", "Cấn": "艮", "Dần": "寅", "Giáp": "甲",
    "Mão": "卯", "Ất": "乙", "Thìn": "辰", "Tốn": "巽", "Tỵ": "巳", "Bính": "丙",
    "Ngọ": "午", "Đinh": "丁", "Mùi": "未", "Khôn": "坤", "Thân": "申", "Canh": "庚",
    "Dậu": "酉", "Tân": "辛", "Tuất": "戌", "Càn": "乾", "Hợi": "亥", "Nhâm": "壬",
}
_NGUYEN = ("dia", "thien", "nhan")


def la_ban_24_son() -> dict:
    """Vòng 24 sơn của la bàn (bảng sơn của `calc.huyen_khong`, cùng nguồn phép đo hướng `pt.do_huong`).
    Web chỉ vẽ; ngưỡng cảnh báo lấy đúng như phép đo (kiêm hướng > 3°, không vong ±0,5°, ranh 8 hướng ≤ 1°)."""
    vong = []
    for i, s in enumerate(hk.SON_24):
        info = hk.thong_tin_son(s)
        tam = (hk.son_tu_do(i * 15.0)["do"])
        vong.append({
            "stt": i, "son": s, "ky_hieu_han": _SON_HAN[s], "quai": info["quai"], "phuong": info["phuong"],
            "nguyen": _NGUYEN[info["nguyen"]], "am_duong": info["am_duong"],
            "do_tam": tam, "do_tu": (tam - 7.5) % 360.0, "do_den": (tam + 7.5) % 360.0,
        })
    return {"tong_son": 24, "buoc_do": 15.0,
            "nguong": {"kiem_huong": 3.0, "khong_vong": 0.5, "ranh_8_huong": 1.0},
            "son_24": vong}
