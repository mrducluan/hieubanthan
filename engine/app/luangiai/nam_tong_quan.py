# -*- coding: utf-8 -*-
"""NAM-1 (hướng A, chủ dự án duyệt 2026-10-30) — trang trụ "Năm {năm}" + hai trang con có nhu cầu tìm kiếm:
"Sinh con năm {năm} hợp tuổi bố mẹ" và "Cưới năm {năm} tuổi nào" (Kim lâu theo tuổi mụ cô dâu — chủ dự án chốt).

Chỉ ĐỌC + GHÉP các phép tính có sẵn: lịch âm Việt (`luangiai.lich_nam`, Hồ Ngọc Đức UTC+7), can chi / nạp âm
(`calc.can_chi`), quan hệ địa chi + Tam tai + Kim lâu (`calc.tuoi_dan_gian`), hạn năm (`luangiai.tuoi_dan_gian`),
Lập xuân (`calc.tietkhi`), rút gọn số (`calc.thanso`). Lời ở KB `nam_tong_quan_kb.json` (nháp). Không LLM, không điểm
số, không dự báo; lời lẽ "dân gian thường…", kèm ranh giới (bác sĩ, điều kiện gia đình)."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from app import config
from app.calc import can_chi as cc
from app.calc import lunar, thanso, tietkhi as tk
from app.calc import tuoi_dan_gian as t
from app.luangiai import lich_nam as ln
from app.luangiai import tuoi_dan_gian as tdg

KB = json.loads((Path(__file__).parents[1] / "kb" / "data" / "nam_tong_quan_kb.json").read_text(encoding="utf-8"))
TZ = config.CALENDAR_MERIDIAN_TZ
# Năm sinh bố mẹ (sinh con) và cô dâu (cưới) — dải tuổi mụ thường gặp: bố mẹ 22–52, cô dâu 20–45.
TUOI_BO_ME = (22, 52)
TUOI_CO_DAU = (20, 45)
_TEN_QH = {"tam_hop": "tam hợp", "luc_hop": "lục hợp", "trung": "năm tuổi", "xung": "xung", "hinh": "hình", "hai": "hại"}


def _meta() -> dict:
    return {"nguon": KB["source"]["ten"], "source_id": KB["source_id"], "school_id": KB["school_id"],
            "trang_thai": KB["trang_thai"], "luu_y": KB["luu_y_chung"]}


def _dmy(d: dt.date) -> str:
    return d.strftime("%d/%m/%Y")


def _am(d: int, m: int, nam: int) -> dt.date:
    dd, mm, yy = lunar.lunar_to_solar(d, m, nam, 0, TZ)
    return dt.date(yy, mm, dd)


def _lap_xuan(nam: int) -> dt.date:
    return (tk.thoi_diem(nam, 315) + dt.timedelta(hours=TZ)).date()


def _vi_du_nam_sinh(chi: str, nam: int) -> list[int]:
    """Năm sinh mang con giáp `chi` trong 1950…năm − 1 (mới nhất trước, tối đa 5)."""
    return [n for n in range(nam - 1, 1949, -1) if lunar.can_chi_nam(n)[1] == chi][:5]


def _moc(nam: int, tet: dt.date, tet_sau: dt.date) -> list[dict]:
    ds = [
        ("lap_xuan", "Lập xuân (năm tiết khí bắt đầu)", _lap_xuan(nam)),
        ("tet", "Mùng 1 Tết Nguyên đán", tet),
        ("ram_gieng", "Rằm tháng Giêng", _am(15, 1, nam)),
        ("gio_to", "Giỗ Tổ Hùng Vương (10/3 âm)", _am(10, 3, nam)),
        ("doan_ngo", "Tết Đoan ngọ (5/5 âm)", _am(5, 5, nam)),
        ("vu_lan", "Rằm tháng Bảy · Vu Lan", _am(15, 7, nam)),
        ("trung_thu", "Tết Trung thu (15/8 âm)", _am(15, 8, nam)),
        ("ong_tao", "Ông Công ông Táo (23 tháng Chạp)", _am(23, 12, nam)),
        ("giao_thua", "Ngày cuối năm âm lịch (đêm Giao thừa)", tet_sau - dt.timedelta(days=1)),
    ]
    return sorted(({"ma": m, "ten": ten, "duong": d.isoformat()} for m, ten, d in ds), key=lambda x: x["duong"])


def _co_ban(nam: int) -> dict:
    can, chi = t.can_chi_nam(nam)
    lich = ln.lich_nam(nam)
    tet, tet_sau = dt.date.fromisoformat(lich["tet"]), dt.date.fromisoformat(lich["tet_sau"])
    return {"can": can, "chi": chi, "na": cc.nap_am(can, chi), "tet": tet, "tet_sau": tet_sau,
            "nhuan": lich["thang_nhuan"] or 0}


def tong_quan(nam: int) -> dict:
    b = _co_ban(nam)
    can, chi, na, tet, tet_sau = b["can"], b["chi"], b["na"], b["tet"], b["tet_sau"]
    xung = t.CHI[(t.CHI.index(chi) + 6) % 12]
    tam_tai_tuoi = next((list(g) for g in t._TAM_HOP if t.pham_tam_tai(g[0], chi)), [])
    nam_thu = t.pham_tam_tai(tam_tai_tuoi[0], chi) if tam_tai_tuoi else None
    tong_so = sum(int(x) for x in str(nam))
    so = {"so": thanso.rut_gon(tong_so, giu_master=True), "rut_gon": thanso.rut_gon(tong_so, giu_master=False)}
    qh_kb = KB["quan_he_nam"]
    con_giap = []
    for c in t.CHI:
        qh = t.quan_he_chi(c, chi)
        tt = t.pham_tam_tai(c, chi)
        o = qh_kb[qh or "binh"]
        con_giap.append({"chi": c, "quan_he": qh or "binh", "nhan": o["nhan"], "loi": o["loi"], "tam_tai": tt,
                         "loi_tam_tai": KB["tam_tai_loi"].format(nam_thu=tt) if tt else None,
                         "nam_sinh": _vi_du_nam_sinh(c, nam)})
    tuoi_hop = [r["chi"] for r in con_giap if r["quan_he"] in ("tam_hop", "luc_hop")]
    lx = _lap_xuan(nam)
    tra_loi = (f"Năm {nam} là năm {can} {chi}, mệnh {na['ten']} — hành {na['hanh']}. "
               f"Tết Nguyên đán rơi vào ngày {_dmy(tet)}; năm âm lịch kéo dài tới {_dmy(tet_sau - dt.timedelta(days=1))}"
               + (f", có tháng {b['nhuan']} nhuận." if b["nhuan"] else ", không có tháng nhuận.")
               + f" Tuổi {chi} gặp năm tuổi, tuổi {xung} xung năm; các tuổi {', '.join(tam_tai_tuoi)} ở năm Tam tai thứ {nam_thu}.")
    hoi_dap = [
        {"hoi": f"Năm {nam} là năm con gì?",
         "dap": f"Năm {nam} là năm {can} {chi}, tính từ Tết Nguyên đán {_dmy(tet)} đến {_dmy(tet_sau - dt.timedelta(days=1))}. "
                f"Người sinh trước Tết ({_dmy(tet)}) vẫn thuộc năm {' '.join(t.can_chi_nam(nam - 1))}."},
        {"hoi": f"Năm {nam} mệnh gì?",
         "dap": f"Mệnh nạp âm của năm {can} {chi} là {na['ten']} ({na['han']}), hành {na['hanh']}. Mệnh này dùng chung cho mọi người sinh trong năm âm lịch {nam}."},
        {"hoi": f"Tết {nam} là ngày nào?",
         "dap": f"Mùng 1 Tết {can} {chi} là ngày {_dmy(tet)} dương lịch theo âm lịch Việt Nam. Lập xuân (mốc năm của Bát tự, Bát trạch) là {_dmy(lx)}."},
        {"hoi": f"Năm {nam} tuổi nào phạm Tam tai?",
         "dap": f"Các tuổi {', '.join(tam_tai_tuoi)} — năm {chi} là năm thứ {nam_thu} trong ba năm Tam tai của nhóm này. Đây là tập quán để tham khảo khi làm việc lớn."},
        {"hoi": f"Năm {nam} tuổi nào hợp, tuổi nào xung?",
         "dap": f"Theo địa chi, tuổi {', '.join(tuoi_hop)} tam hợp hoặc lục hợp với năm {chi}; tuổi {xung} xung năm; tuổi {chi} gặp năm tuổi. Đây là quan niệm dân gian, không định sẵn chuyện tốt xấu."},
        {"hoi": f"Năm {nam} có tháng nhuận không?",
         "dap": (f"Có, năm âm lịch {nam} nhuận tháng {b['nhuan']}, cả năm 13 tháng." if b["nhuan"]
                 else f"Không, năm âm lịch {nam} có 12 tháng.")},
    ]
    return {"nam": nam, "can_chi": f"{can} {chi}", "can": can, "con_giap": chi,
            "nap_am": {"ten": na["ten"], "hanh": na["hanh"], "han": na["han"]},
            "tet": tet.isoformat(), "het_nam": (tet_sau - dt.timedelta(days=1)).isoformat(),
            "lap_xuan": lx.isoformat(), "thang_nhuan": b["nhuan"],
            "nam_truoc_tet": {"nam": nam - 1, "can_chi": " ".join(t.can_chi_nam(nam - 1))},
            "so_nam_the_gioi": so, "nam_tuoi": chi, "xung": xung,
            "tam_tai": {"tuoi": tam_tai_tuoi, "nam_thu": nam_thu}, "tuoi_hop": tuoi_hop,
            "bang_con_giap": con_giap, "moc": _moc(nam, tet, tet_sau), "han_nam": tdg.han_nam_luan(nam),
            "tra_loi_nhanh": tra_loi, "hoi_dap": hoi_dap, **_meta()}


def sinh_con(nam: int) -> dict:
    """Con sinh trong năm âm `nam` × tuổi bố/mẹ (tuổi mụ 22–52): quan hệ địa chi + nạp âm. Chỉ nhóm hợp / bình / nên
    cân nhắc theo địa chi (không cộng điểm); nạp âm ghi kèm để đọc, không đổi nhóm."""
    b = _co_ban(nam)
    can, chi, na, tet = b["can"], b["chi"], b["na"], b["tet"]
    k = KB["sinh_con"]
    can_t, chi_t = t.can_chi_nam(nam - 1)
    na_t = cc.nap_am(can_t, chi_t)
    ds = []
    for ns in range(nam - TUOI_BO_ME[1] + 1, nam - TUOI_BO_ME[0] + 2):
        cb, chb = t.can_chi_nam(ns)
        nab = cc.nap_am(cb, chb)
        qh = t.quan_he_chi(chb, chi) or "binh"
        nhom = "hop" if qh in ("tam_hop", "luc_hop") else "luu_y" if qh == "xung" else "binh"
        sk = cc.sinh_khac(na["hanh"], nab["hanh"])
        ds.append({"nam_sinh": ns, "can_chi": f"{cb} {chb}", "nap_am": nab["ten"], "chi_quan_he": qh,
                   "chi_nhan": k["chi"][qh], "nap_am_quan_he": sk, "nap_am_nhan": k["nap_am"][sk],
                   "nhom": nhom, "nhom_nhan": k["nhom"][nhom]})
    chi_hop = [c for c in t.CHI if (t.quan_he_chi(c, chi) or "") in ("tam_hop", "luc_hop")]
    chi_xung = t.CHI[(t.CHI.index(chi) + 6) % 12]
    tra_loi = (f"Con sinh từ Tết {_dmy(tet)} đến hết năm âm lịch {nam} tuổi {can} {chi}, mệnh {na['ten']}. Theo địa chi, "
               f"bố mẹ tuổi {', '.join(chi_hop)} được dân gian xem là hợp với tuổi con; tuổi {chi_xung} xung tuổi con. "
               f"Con sinh trước Tết thuộc năm {can_t} {chi_t}. Đây là tập quán tham khảo — sức khoẻ của mẹ và lời khuyên "
               f"của bác sĩ đi trước con giáp.")
    hoi_dap = [
        {"hoi": f"Sinh con năm {nam} hợp tuổi bố mẹ nào?",
         "dap": f"Theo tam hợp, lục hợp của địa chi: bố mẹ tuổi {', '.join(chi_hop)} hợp với tuổi {chi} của con. Bảng dưới ghi từng năm sinh của bố mẹ kèm quan hệ mệnh nạp âm."},
        {"hoi": f"Bố mẹ tuổi {chi_xung} sinh con năm {nam} có sao không?",
         "dap": f"Tuổi {chi_xung} xung với tuổi {chi} theo địa chi — dân gian hay nhắc cân nhắc. Đây chỉ là quan niệm; tình thương và cách nuôi dạy mới quyết định sự hoà hợp trong nhà."},
        {"hoi": f"Sinh con năm {nam} mệnh gì?",
         "dap": f"Con sinh từ {_dmy(tet)} mệnh {na['ten']} (hành {na['hanh']}); sinh trước Tết thuộc năm {can_t} {chi_t}, mệnh {na_t['ten']}."},
        {"hoi": "Có nên chọn ngày sinh mổ cho con đúng tuổi đẹp?", "dap": k["ranh_gioi"]},
    ]
    return {"nam": nam, "con": {"can_chi": f"{can} {chi}", "nap_am": na["ten"], "hanh": na["hanh"], "tu": tet.isoformat(),
                                "den": (b["tet_sau"] - dt.timedelta(days=1)).isoformat()},
            "truoc_tet": {"nam": nam - 1, "can_chi": f"{can_t} {chi_t}", "nap_am": na_t["ten"]},
            "chi_hop": chi_hop, "chi_xung": chi_xung, "ds": ds, "loi_nhom": k["loi_nhom"], "ranh_gioi": k["ranh_gioi"],
            "tra_loi_nhanh": tra_loi, "hoi_dap": hoi_dap, **_meta()}


def cuoi_hoi(nam: int) -> dict:
    """Cưới năm âm `nam`: Kim lâu theo tuổi mụ CÔ DÂU (chủ dự án chốt 2026-10-30), cô dâu tuổi mụ 20–45. Tuổi phạm
    → năm gần nhất không phạm (để gia đình tự sắp)."""
    b = _co_ban(nam)
    can, chi, tet = b["can"], b["chi"], b["tet"]
    k = KB["cuoi_hoi"]
    ds = []
    for ns in range(nam - TUOI_CO_DAU[1] + 1, nam - TUOI_CO_DAU[0] + 2):
        tuoi = t.tuoi_mu(ns, nam)
        kl = t.kim_lau(tuoi)
        sau = next((n for n in range(nam + 1, nam + 4) if not t.kim_lau(t.tuoi_mu(ns, n))), None) if kl else None
        ds.append({"nam_sinh": ns, "can_chi": " ".join(t.can_chi_nam(ns)), "tuoi_mu": tuoi,
                   "kim_lau": tdg.KB["kim_lau"][kl]["ten"] if kl else None, "duoc": not kl, "nam_khong_pham": sau})
    duoc = [x for x in ds if x["duoc"]]
    pham = [x for x in ds if not x["duoc"]]
    ten = lambda xs: ", ".join(str(x["nam_sinh"]) for x in xs)  # noqa: E731
    hay = [x for x in duoc if 22 <= x["tuoi_mu"] <= 35]         # độ tuổi cưới hay gặp — bảng đủ 20–45
    tra_loi = (f"Năm {nam} ({can} {chi}), xét Kim lâu theo tuổi mụ của cô dâu: trong độ tuổi hay cưới, cô dâu sinh "
               f"{ten(hay)} không phạm Kim lâu. Bảng dưới ghi đủ các tuổi sinh {ds[0]['nam_sinh']}–{ds[-1]['nam_sinh']}; "
               f"tuổi tính theo năm âm lịch (sinh trước Tết thuộc năm trước).")
    hoi_dap = [
        {"hoi": f"Năm {nam} tuổi nào cưới được?", "dap": f"Cô dâu sinh các năm {ten(duoc)} không phạm Kim lâu năm {nam}."},
        {"hoi": f"Năm {nam} tuổi nào phạm Kim lâu khi cưới?",
         "dap": "; ".join(f"{x['nam_sinh']} ({x['tuoi_mu']} tuổi mụ, {x['kim_lau']})" for x in pham) + "."},
        {"hoi": "Kim lâu cưới tính theo tuổi ai?", "dap": k["cach_tinh"]},
        {"hoi": "Phạm Kim lâu thì có cưới được không?", "dap": k["muon_tuoi"] + " " + k["ranh_gioi"]},
    ]
    return {"nam": nam, "can_chi": f"{can} {chi}", "tet": tet.isoformat(), "ds": ds, "so_duoc": len(duoc),
            "cach_tinh": k["cach_tinh"], "muon_tuoi": k["muon_tuoi"], "ranh_gioi": k["ranh_gioi"],
            "tra_loi_nhanh": tra_loi, "hoi_dap": hoi_dap, **_meta()}
