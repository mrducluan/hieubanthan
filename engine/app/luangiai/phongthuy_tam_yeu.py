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
from app.calc import phongthuy_lop as _lop
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


def so_do(cua: str, chu: str | None = None, bep: str | None = None, tuoi: int | None = None, *,
          ve_sinh: str | None = None, ban_tho: str | None = None, menh: str | None = None, khac_nhom_nguoi: bool = False,
          dau_hieu: list[str] | None = None, nhieu_tang: bool = False, cua_sat_ranh: str | None = None,
          so_lop: int | None = None, lop_chu: int | None = None, cua_lech: bool | None = None) -> dict:
    """`cua`, `chu`, `bep` = quái phương vị (nhìn từ tâm nhà). `tuoi` (tuổi tròn của người đọc, nếu biết) chỉ quyết định
    có hiện ghi chép nhóm C hay không — không đổi mức nào. TY-2: `ve_sinh`, `ban_tho` (quái), `menh` (mệnh quái người chủ),
    `khac_nhom_nguoi`, `dau_hieu` (đã xác nhận), `nhieu_tang` → nguyên tắc Tam Yếu / điều Minh Kính đúng với nhà này.
    TY-2 đợt 3: `so_lop` (số lớp từ cổng vào), `lop_chu` (lớp có dãy nhà chính), `cua_lech` → `nhieu_lop` (cần `chu`);
    đây là cách đọc riêng của sách cho nhà nhiều sân — KHÔNG đổi `ket_luan` của Cửa – Chủ – Bếp."""
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
    them = {"ve_sinh": ve_sinh, "ban_tho": ban_tho, "menh": menh, "khac_nhom_nguoi": khac_nhom_nguoi, "nhieu_tang": nhieu_tang,
            "cua_sat_ranh": cua_sat_ranh}
    sach = sach_ghi_mon.phongthuy(dau_hieu=dau_hieu, cua=cua, chu=chu, bep=bep, tuoi=tuoi, them=them)
    an_c = 0
    if ngon_ngu.la_viet() and (tuoi is None or tuoi < sach_ghi_mon.TUOI_NHOM_C):
        day_du = sach_ghi_mon.phongthuy(dau_hieu=dau_hieu, cua=cua, chu=chu, bep=bep, tuoi=99, them=them)
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
        "sach_noi_bat": noi_bat(sach),
        "luu_y_tham_khao": cc["luu_y_tham_khao"],
    }
    if so_lop is not None and chu:
        ra["nhieu_lop"] = nhieu_lop(cua, chu, so_lop, lop_chu, cua_lech)
    if ngon_ngu.la_viet():
        ra.update(_them_tam_yeu(cua, chu, bep, goi_y))
    if an_c > 0 and tuoi is None:
        # Người chưa đủ 18 (tuổi đã biết) không được mời mở; chỉ người chưa cho biết tuổi mới thấy lời mời xác nhận.
        ra["nhom_c_an"] = {"so": an_c, "loi": cc["nhom_c_an"].format(n=an_c)}
    return ra


def _them_tam_yeu(cua: str, chu: str | None, bep: str | None, goi_y: list[dict]) -> dict:
    """TY-2 (chỉ bản Việt): tên thế nhà theo sách, bảng tám bếp có nhãn "sách chọn / sách dặn tránh", ba chỗ đặt bếp theo
    điều nhà đang cần. Nhãn sách lấy từ KB `nha.<cửa>_<chủ>` (bep_hop / bep_nen_tranh); mức vẫn là của engine."""
    cc = _cc()
    ra: dict = {"bep_dieu_can": {"tieu_de": cc["dieu_can_tieu_de"], "ds": bep_dieu_can(cua)}}
    if chu:
        m = nap.doc(TEP)["nha"].get(f"{cua}_{chu}") or {}
        d = du_nien(cua, chu)
        ra["the_nha"] = {"du_nien": d, "ten": cc["the_nha"]["ten"].format(dn=_ten.ten("du_nien", d)),
                         "tuong": cc["the_nha"]["tuong"].format(tuong=m["tuong"]) if m.get("tuong") else None,
                         "ba_tot": bep_ba_tot(cua, chu) if nhom_quai(cua) == nhom_quai(chu) and cua != chu else []}
        hop, tranh = set(m.get("bep_hop") or ()), set(m.get("bep_nen_tranh") or ())
        for g in goi_y:
            k = "hop" if g["quai"] in hop else "tranh" if g["quai"] in tranh else None
            if k:
                g["sach"] = k
                g["sach_nhan"] = cc["bep_sach"][k]
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


# ───────────────────────── TY-2 (2026-11-25): dùng hết kho sách cho đúng ngôi nhà ─────────────────────────
# Mỗi nguyên tắc Tam Yếu (`nguyen_tac`) và mỗi điều Bát Trạch Minh Kính (`minh_kinh`) đã nạp chỉ hiện khi ĐIỀU KIỆN của nó
# đúng với nhà người dùng (cửa / phòng chính / bếp / WC / bàn thờ / mệnh / dấu hiệu đã xác nhận). Điều kiện là luật tất
# định ở đây; câu "nhà bạn thì sao" lấy mẫu ở KB `cong_cu.ap` (chỉ bản Việt). Không sinh câu mới, không đổi mức nào.

DUONG = frozenset({"Càn", "Khảm", "Cấn", "Chấn"})                   # Tam Yếu: Càn Khảm Cấn Chấn dương, Khôn Tốn Ly Đoài âm
# Hành của quái / du niên theo chính sách (nguyên tắc `sao_tot_dung_cho`) — một nguồn với phép tính nhà nhiều lớp.
HANH_QUAI = _lop.HANH_QUAI
HANH_DU_NIEN = _lop.HANH_DU_NIEN
_SINH = {"Mộc": "Hoả", "Hoả": "Thổ", "Thổ": "Kim", "Kim": "Thuỷ", "Thuỷ": "Mộc"}
BA_TOT = frozenset({"Sinh Khí", "Diên Niên", "Thiên Y"})
TOT_CHINH = ("Sinh Khí", "Diên Niên", "Thiên Y")                       # ba du niên tốt lớn (bỏ Phục Vị)


def du_nien(a: str, b: str) -> str:
    """Du niên từ phía quái `a` tới phía quái `b` (cùng bảng `pt.bang_huong`)."""
    return pt.bang_huong(a)[_huong(b)]


def nhom_quai(q: str) -> str:
    return "dong" if q in pt.DONG_TU else "tay"


def quan_he_hanh(sao: str, cung: str) -> str:
    """cung_hanh · nuoi_nhau · choi_nhau — hành của du niên so với hành của phía nó rơi vào."""
    if sao == cung:
        return "cung_hanh"
    if _SINH[sao] == cung or _SINH[cung] == sao:
        return "nuoi_nhau"
    return "choi_nhau"


def _ap() -> dict:
    return _cc().get("ap") or {}


def _f(ma: str, **kw) -> str:
    return _ap()[ma].format(**kw)


def _ds(qs) -> str:
    return ", ".join(_ten.ten("huong", _huong(q)) for q in qs)


def bep_ba_tot(cua: str, chu: str) -> list[str]:
    """Phía đặt bếp làm cho ba cặp ra đủ Sinh Khí, Diên Niên, Thiên Y (thế "nhà ba tốt")."""
    cc = du_nien(cua, chu)
    return [b for b in QUAI_8 if b not in (cua, chu) and {cc, du_nien(cua, b), du_nien(chu, b)} == BA_TOT]


def bep_dieu_can(cua: str) -> list[dict]:
    """Nguyên tắc `bep_theo_dieu_can`: bếp Thiên Y / Sinh Khí / Diên Niên (tính từ cửa) gỡ ba loại việc."""
    bang = pt.bang_huong(cua)
    ra = []
    for dn in ("Thiên Y", "Sinh Khí", "Diên Niên"):
        h = next(h for h, d in bang.items() if d == dn)
        ra.append({"du_nien": dn, "quai": pt.HUONG_QUAI[h], "huong": h, "viec": _cc()["dieu_can"][dn]})
    return ra


def _su_kien(cua, chu, bep, ve_sinh, ban_tho, menh, khac_nhom_nguoi, dau_hieu, nhieu_tang, cua_sat_ranh=None) -> dict:
    f = {"ranh": cua_sat_ranh, "cua": cua, "chu": chu, "bep": bep, "wc": ve_sinh, "tho": ban_tho, "menh": menh, "dh": set(dau_hieu or ()),
         "khac_nhom_nguoi": bool(khac_nhom_nguoi), "nhieu_tang": bool(nhieu_tang)}
    f["cc"] = du_nien(cua, chu) if chu else None
    f["cb"] = du_nien(cua, bep) if bep else None
    f["hb"] = du_nien(chu, bep) if chu and bep else None
    return f


def _h(q: str | None) -> str:
    return _ten.ten("huong", _huong(q)) if q else ""


def _dn(d: str | None) -> str:
    return _ten.ten("du_nien", d) if d else ""


def _nhom_ten(q: str) -> str:
    return _cc()["nhom_ten"][nhom_quai(q)]


def _r_nguyen_tac(f: dict) -> dict[str, str]:
    """mã nguyên tắc Tam Yếu → câu "ở nhà bạn" (chỉ mã có điều kiện đúng)."""
    cua, chu, bep, cc, cb, hb = f["cua"], f["chu"], f["bep"], f["cc"], f["cb"], f["hb"]
    ra: dict[str, str] = {}
    cho = [_f("cho_cua", h=_h(cua))] + ([_f("cho_chu", h=_h(chu))] if chu else []) + ([_f("cho_bep", h=_h(bep))] if bep else [])
    ra["tam_yeu"] = _f("tam_yeu", ds="; ".join(cho))
    if chu and nhom_quai(cua) != nhom_quai(chu):
        ra["hai_nhom_dong_tay"] = _f("hai_nhom", cua=_h(cua), n1=_nhom_ten(cua), chu=_h(chu), n2=_nhom_ten(chu))
    if cc in pt.CAT and cc != "Phục Vị":
        ra["bon_du_nien_tot"] = _f("du_nien_tot", dn=_dn(cc))
        hs, hc = HANH_DU_NIEN[cc], HANH_QUAI[chu]
        qh = quan_he_hanh(hs, hc)
        ra["sao_tot_dung_cho"] = _f("sao_dung_cho", dn=_dn(cc), hs=hs, h=_h(chu), hc=hc, qh=_cc()["quan_he_hanh"][qh])
        if (nhom_quai(cua) == "dong" and cc == "Sinh Khí") or (nhom_quai(cua) == "tay" and cc == "Diên Niên"):
            ra["du_nien_hop_nhom"] = _f("hang_dau", dn=_dn(cc), n=_nhom_ten(cua))
    xau = [(ten, d) for ten, d in ((_cc()["ten_cap"]["cua_chu"], cc), (_cc()["ten_cap"]["cua_bep"], cb),
                                   (_cc()["ten_cap"]["chu_bep"], hb)) if d and d not in pt.CAT]
    if xau:
        ra["bon_du_nien_xau"] = _f("du_nien_xau", ds="; ".join(f"{t[:1].lower() + t[1:]}: {_dn(d)}" for t, d in xau))
    if chu and (cua in DUONG) == (chu in DUONG):
        tinh = _cc()["am_duong"]["duong" if cua in DUONG else "am"]
        bu = [q for q in QUAI_8 if du_nien(cua, q) in pt.CAT and (q in DUONG) != (cua in DUONG)]
        hien = (_f("cung_mem_bep_bu" if (bep in DUONG) != (cua in DUONG) else "cung_mem_bep_chua", h=_h(bep)) if bep else "")
        ra["du_cung_mem"] = _f("cung_mem", cua=_h(cua), chu=_h(chu), tinh=tinh, hien=hien,
                               bu=_ds(bu) if bu else _ap()["khong_co"])
    if chu and nhom_quai(cua) == nhom_quai(chu) and cua != chu:
        if bep and cb and hb and {cc, cb, hb} == BA_TOT:
            ra["nha_ba_tot"] = _f("ba_tot_co")
        else:
            bt = bep_ba_tot(cua, chu)
            if bt:
                ra["nha_ba_tot"] = _f("ba_tot_dat", ds=_ds(bt))
    if bep:
        ra["bep_nuoi_nguoi"] = _f("bep_nuoi", h=_h(bep), dn=_dn(cb))
        if nhom_quai(bep) != nhom_quai(cua):
            ra["bep_cung_nhom"] = _f("bep_khac_nhom", h=_h(bep), nb=_nhom_ten(bep), nc=_nhom_ten(cua))
        if hb and (cb in pt.CAT) != (hb in pt.CAT):
            ra["chinh_va_phu"] = _f("chinh_phu", cb=_dn(cb), hb=_dn(hb))
        tot = [pt.HUONG_QUAI[h] for h, d in pt.bang_huong(cua).items() if d in TOT_CHINH]
        ra["bon_cho_phu"] = _f("cho_phu", ds=_ds(tot))
    ra["bep_theo_dieu_can"] = _f("dieu_can", ds="; ".join(f"{x['viec']}: {_h(x['quai'])}" for x in bep_dieu_can(cua)))
    if f["wc"]:
        d = du_nien(cua, f["wc"])
        k = "wc_ngu_quy" if d == "Ngũ Quỷ" else "wc_luc_sat" if d == "Lục Sát" else "wc_xau" if d not in pt.CAT else "wc_tot"
        ra["cua_sau_phia_xau"] = _f(k, h=_h(f["wc"]), dn=_dn(d))
    if f["menh"]:
        m = f["menh"]
        tot = [pt.HUONG_QUAI[h] for h, d in pt.bang_huong(m).items() if d in TOT_CHINH]
        k = "menh_cung_nhom" if nhom_quai(m) == nhom_quai(cua) else "menh_khac_nhom"
        ra["menh_nguoi_o"] = _f(k, q=m, nm=_nhom_ten(m), nn=_nhom_ten(cua), ds=_ds(tot))
    if f["dh"] & {"duong_dam", "song_truoc"}:
        ra["truoc_nha"] = _ap()["truoc_nha"]
    if f["ranh"]:            # VT-1 đo được cửa nằm sát ranh 8 phương (≤ 5°) — nguyên tắc "cửa gọn trong một phía"
        ra["cua_gon_mot_phia"] = _f("cua_ranh", a=_h(cua), b=_ten.ten("huong", f["ranh"]))
    return ra


def _r_minh_kinh(f: dict) -> dict[str, str]:
    """mã điều Minh Kính → câu "ở nhà bạn" (chỉ mã có điều kiện đúng). Minh Kính lấy MỆNH người chủ làm gốc."""
    cua, chu, bep, m = f["cua"], f["chu"], f["bep"], f["menh"]
    ra: dict[str, str] = {}
    dh = f["dh"]
    if m:
        tot = [pt.HUONG_QUAI[h] for h, d in pt.bang_huong(m).items() if d in TOT_CHINH]
        dc = du_nien(m, cua)
        ra["cong_chinh_hop_hai_be"] = _f("mk_cong", h=_h(cua), dn=_dn(dc))
        if dc not in pt.CAT:
            ra["cong_xau_kho_doi"] = _f("mk_cong_xau", h=_h(cua), dn=_dn(dc))
        if nhom_quai(m) != nhom_quai(cua):
            ra["goc_phuc"] = _f("mk_khac_nhom", nm=_nhom_ten(m), nn=_nhom_ten(cua))
            ra["menh_tren_huong_nha"] = _f("mk_theo_menh", ds=_ds(tot))
        if chu:
            dch = du_nien(m, chu)
            sk = next(h for h, d in pt.bang_huong(m).items() if d == "Sinh Khí")
            ra["dau_giuong_sinh_khi"] = _f("mk_dau_giuong", h=_ten.ten("huong", sk))
            if dch not in pt.CAT:
                ra["phong_chinh_nhuong"] = _f("mk_phong_chinh", h=_h(chu), dn=_dn(dch))
                ra["doi_giuong_de_nhat"] = _f("mk_doi_giuong", ds=_ds(tot))
        if bep:
            db = du_nien(m, bep)
            ra["be_bep_phia_xau"] = _f("mk_than_bep", h=_h(bep), dn=_dn(db))
            if db in pt.CAT:
                ra["bep_de_phia_tot"] = _f("mk_bep_de_tot", h=_h(bep), dn=_dn(db))
            ra["tien_bac_cua_bep"] = _f("mk_cua_lo", ds=_ds(tot))
        if f["wc"]:
            ra["nha_ve_sinh"] = _f("mk_wc", h=_h(f["wc"]), dn=_dn(du_nien(m, f["wc"])))
        if f["tho"]:
            ra["ban_tho_phia_tot"] = _f("mk_tho", h=_h(f["tho"]), dn=_dn(du_nien(m, f["tho"])))
    if chu and nhom_quai(cua) != nhom_quai(chu):
        ra["cong_cung_nhom_nha"] = _f("mk_cong_nhom", cua=_h(cua), chu=_h(chu))
    if chu and f["cc"] not in pt.CAT:
        ra["tam_bo_cuc_tranh"] = _f("mk_bo_cuc_tranh", cua=_h(cua), chu=_h(chu), dn=_dn(f["cc"]))
    if f["khac_nhom_nguoi"]:
        ra["phong_theo_menh"] = _ap()["mk_nguoi_khac_nhom"]
    if "xa_ngang" in dh:
        ra["giuong_duoi_xa"] = _ap()["mk_xa"]
    if dh & {"bep_doi_cua", "bep_wc"}:
        ra["bep_bon_cho_kieng"] = _ap()["mk_bep_kieng"]
    if "bep_doi_cua" in dh:
        ra["mieng_bep_bi_xoc"] = _ap()["mk_mieng_bep"]
    if dh & {"duong_dam", "nga_ba"}:
        ra["cua_doi_dien"] = _ap()["mk_cua_doi"]
    if "cua_doi_nhau" in dh:
        ra["khong_nhieu_cua"] = _ap()["mk_nhieu_cua"]
    if "nha_chu_l" in dh:
        ra["nen_vuong"] = _ap()["mk_nen"]
    if f["nhieu_tang"]:
        ra["tang_tren_tang_duoi"] = _ap()["mk_tang"]
    return ra


TOI_DA_NGUYEN_TAC = 10
# Nguyên tắc có câu tính riêng cho nhà này đứng trước; câu nhắc chung (khung ba chỗ, bếp nuôi người…) đứng sau.
UU_TIEN_NGUYEN_TAC = ("cua_gon_mot_phia", "nha_ba_tot", "sao_tot_dung_cho", "du_cung_mem", "bon_du_nien_xau", "chinh_va_phu", "bep_cung_nhom",
                      "hai_nhom_dong_tay", "menh_nguoi_o", "cua_sau_phia_xau", "du_nien_hop_nhom", "truoc_nha",
                      "bep_theo_dieu_can", "bon_cho_phu", "bon_du_nien_tot", "bep_nuoi_nguoi", "tam_yeu")
TOI_DA_MINH_KINH = 8


def nhom_sach(cua: str, chu: str | None = None, bep: str | None = None, *, ve_sinh: str | None = None,
              ban_tho: str | None = None, menh: str | None = None, khac_nhom_nguoi: bool = False,
              dau_hieu: list[str] | None = None, nhieu_tang: bool = False,
              cua_sat_ranh: str | None = None) -> list[tuple[str, str, list[tuple[dict, str]]]]:
    """Nhóm câu sách cho khối "Sách xưa ghi" (khuôn SX-C `sach_ghi_mon.khoi`): nguyên tắc Tam Yếu + điều Minh Kính có điều
    kiện đúng với nhà này, mỗi mục kèm câu "ở nhà bạn" làm `ve`. Thứ tự theo KB; chỉ bản Việt (khuôn tự bỏ bản khác)."""
    if not ngon_ngu.la_viet() or not cua:
        return []
    kb = nap.doc(TEP)
    f = _su_kien(cua, chu, bep, ve_sinh, ban_tho, menh, khac_nhom_nguoi, dau_hieu, nhieu_tang, cua_sat_ranh)
    nt, mk = _r_nguyen_tac(f), _r_minh_kinh(f)
    theo_ma = {m["ma"]: m for m in kb["nguyen_tac"]}
    g1 = [(theo_ma[ma], nt[ma]) for ma in UU_TIEN_NGUYEN_TAC if ma in nt and ma in theo_ma][:TOI_DA_NGUYEN_TAC]
    g2 = [(m, mk[m["ma"]]) for m in kb["minh_kinh"] if m["ma"] in mk and m.get("con_ap_dung", True)][:TOI_DA_MINH_KINH]
    ap = _ap()
    return [x for x in (("tam_yeu_nguyen_tac", ap["ten_nhom_nguyen_tac"], g1), ("minh_kinh", ap["ten_nhom_minh_kinh"], g2)) if x[2]]


def nhieu_lop(cua: str, chu: str, so_lop: int, lop_chu: int | None = None, cua_lech: bool | None = None) -> dict:
    """TY-2 đợt 3 — nhà nhiều lớp (tĩnh / động / biến / hoá trạch): phép tính ở `calc.phongthuy_lop`, lời ở KB
    `cong_cu.nhieu_lop`. Lớp 1 = cổng; `lop_chu` = lớp có dãy nhà chính. Hoá trạch (≥ 11 lớp) chỉ nêu loại, chưa tính."""
    k = _cc()["nhieu_lop"]
    r = _lop.danh_gia(chu, cua, so_lop, lop_chu, cua_lech)
    l = k["loai"][r["loai"]]
    ra = {"loai": r["loai"], "ten_loai": l["ten"].format(n=so_lop), "y": l["y"], "so_lop": so_lop, "quy_uoc": k["quy_uoc"],
          "lop": None, "lop_chu": None, "loi_lop_chu": None, "lop_nen_cao": [], "loi_nen_cao": None, "ap_sat": None, "can_cu": []}
    if not r["lop"]:
        if r["loai"] == "tinh":
            ra["lop"] = []
        return ra
    ten_dn = lambda dn: _ten.ten("du_nien", dn)  # noqa: E731
    ra["lop"] = [{**x, "sao": k["sao"][x["du_nien"]], "ten_du_nien": ten_dn(x["du_nien"])} for x in r["lop"]]
    if r["lop_chu"]:
        x = r["lop_chu"]
        ra["lop_chu"] = {**x, "sao": k["sao"][x["du_nien"]]}
        ra["loi_lop_chu"] = k["lop_chu"][x["muc"]].format(so=x["so"], sao=k["sao"][x["du_nien"]], du_nien=ten_dn(x["du_nien"]),
                                                          quan_he=k["quan_he"][x["quan_he"]])
    else:
        ra["loi_lop_chu"] = k["chua_lop_chu"]
    ra["lop_nen_cao"] = r["lop_nen_cao"]
    ra["loi_nen_cao"] = (k["nen_cao"].format(ds=", ".join(k["lop_ten"].format(so=n) for n in r["lop_nen_cao"]))
                         if r["lop_nen_cao"] else k["khong_nen_cao"])
    if r["ap_sat"]:
        ra["ap_sat"] = k["ap_sat"]
    cc = k["can_cu"]
    ra["can_cu"] = [cc["dau"].format(tu=_ten.ten("huong", _huong(r["sao_dau_tu"])), huong=_ten.ten("huong", _huong(r["huong"])),
                                     du_nien=ten_dn(r["lop"][0]["du_nien"])),
                    cc["day"].format(ds="; ".join(f'{k["lop_ten"].format(so=x["so"])} {k["sao"][x["du_nien"]]}' for x in r["lop"])),
                    cc["luat_dong" if r["loai"] == "dong" else "luat_bien"]]
    if r["cua_lech"]:
        ra["can_cu"].append(k["cua_lech"])
    if so_lop == 7:
        ra["can_cu"].append(k["bay_lop"])
    return ra


def noi_bat(sach: dict | None, toi_da: int = 3) -> list[dict]:
    """Gói 1 — tối đa `toi_da` điều sách đáng xem trước: "Nên chú ý" (nhóm B) trước, rồi nhóm A, theo thứ tự nhóm
    engine đã xếp (nguyên tắc Tam Yếu ưu tiên trước). Không lấy nhóm C (để trong khối gập). Chỉ chọn, không viết lời mới."""
    if not sach:
        return []
    cac = [m for g in sach.get("nhom", []) for m in g.get("muc", [])]
    return ([m for m in cac if m.get("nhom") == "B"] + [m for m in cac if m.get("nhom") == "A"])[:toi_da]
