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
                         "nam_sinh": _vi_du_nam_sinh(c, nam),
                         # NAM-3: năm sinh có trang "Tử vi năm {nam} tuổi …" (1960–2005, như các cụm tuổi khác).
                         "nam_sinh_trang": [n for n in tdg.NAM_SINH_SEO if lunar.can_chi_nam(n)[1] == c]})
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


# ---- NAM-3 (2026-11-01, chủ dự án duyệt): "Tử vi năm {nam} tuổi {can chi}" — một trang mỗi năm sinh, gộp nam + nữ ----
# Chỉ ghép dữ kiện CHUNG theo năm sinh (giống nhau với mọi người cùng năm sinh — nói rõ trên trang): quan hệ địa chi /
# thiên can / nạp âm của tuổi với năm, Tam tai, Kim lâu + Hoang ốc (làm nhà, cưới), sao hạn Cửu Diệu + Bát hạn hai giới,
# tứ hoá của can năm (`calc.tuvi_luu_nguyet.TU_HOA`, bảng iztro) — rồi mời xem lá số riêng. Không điểm số, không dự báo.
def _can_quan_he(can_nam: str, can_nguoi: str) -> str:
    if frozenset((can_nam, can_nguoi)) in t.NGU_HOP_CAN:
        return "ngu_hop"
    return {"sinh": "sinh", "bị sinh": "bi_sinh", "khắc": "khac", "bị khắc": "bi_khac"}.get(
        cc.sinh_khac(t.HANH_CAN[can_nam], t.HANH_CAN[can_nguoi]), "binh_hoa")


_TEN_CHI = {"tam_hop": "tam hợp", "luc_hop": "lục hợp", "trung": "năm tuổi", "xung": "xung", "hinh": "hình", "hai": "hại"}


def _sao_gioi(tuoi: int, gioi: str) -> dict | None:
    ten = t.sao_han(tuoi, gioi)
    if not ten:
        return None
    o = tdg.SH["sao"][ten]
    return {"ten": ten, "han": t.bat_han(tuoi, gioi), "nghia": o["nghia"], "viec": list(o["viec"]), "tu_soi": o["tu_soi"]}


def theo_tuoi(nam: int, nam_sinh: int) -> dict:
    from app.calc.tuvi_luu_nguyet import TU_HOA  # noqa: PLC0415
    k = KB["theo_tuoi"]
    can_n, chi_n = t.can_chi_nam(nam)
    can_s, chi_s = t.can_chi_nam(nam_sinh)
    na_n, na_s = cc.nap_am(can_n, chi_n), cc.nap_am(can_s, chi_s)
    tuoi = t.tuoi_mu(nam_sinh, nam)
    q_chi = t.quan_he_chi(chi_s, chi_n) or "binh"
    q_can = _can_quan_he(can_n, can_s)
    q_na = cc.sinh_khac(na_n["hanh"], na_s["hanh"])          # quan hệ của mệnh NĂM đối với mệnh NGƯỜI
    tt = t.pham_tam_tai(chi_s, chi_n)
    kl = t.kim_lau(tuoi)
    d_lam = tdg._danh_gia_nam(nam_sinh, nam)
    sao = {"nam": _sao_gioi(tuoi, "nam"), "nu": _sao_gioi(tuoi, "nu")}

    dn: list[dict] = []
    cu_chi = f"Địa chi: tuổi {chi_s} – năm {chi_n}"
    if q_chi in ("tam_hop", "luc_hop"):
        dn.append({"loai": "thuan", "tieu_de": f"Tuổi {chi_s} {_TEN_CHI[q_chi]} với năm {chi_n}", "noi_dung": k["chi"][q_chi], "can_cu": cu_chi})
    elif q_chi in ("trung", "xung", "hinh", "hai"):
        td = f"Năm {chi_n} là năm tuổi của bạn" if q_chi == "trung" else f"Tuổi {chi_s} {_TEN_CHI[q_chi]} với năm {chi_n}"
        dn.append({"loai": "luu_y", "tieu_de": td, "noi_dung": k["chi"][q_chi], "can_cu": cu_chi})
    loai_can = "thuan" if q_can in ("ngu_hop", "sinh") else "luu_y" if q_can == "khac" else "trung"
    td_can = f"Năm {can_n} trùng can tuổi bạn" if can_n == can_s else f"Can {can_n} {k['ten_can'][q_can]} can {can_s}"
    dn.append({"loai": loai_can, "tieu_de": td_can, "noi_dung": k["can"][q_can],
               "can_cu": f"Thiên can: năm {can_n} ({t.HANH_CAN[can_n]}) – tuổi {can_s} ({t.HANH_CAN[can_s]})"})
    loai_na = "thuan" if q_na == "sinh" else "luu_y" if q_na == "khắc" else "trung"
    dn.append({"loai": loai_na, "tieu_de": f"Mệnh {na_n['hanh']} của năm gặp mệnh {na_s['hanh']} của bạn",
               "noi_dung": k["nap_am"][q_na], "can_cu": f"Nạp âm: năm {na_n['ten']} – tuổi {na_s['ten']}"})
    if tt:
        dn.append({"loai": "luu_y", "tieu_de": f"Năm thứ {tt} của Tam tai", "noi_dung": KB["tam_tai_loi"].format(nam_thu=tt),
                   "can_cu": f"Tam tai tuổi {chi_s}: năm {', '.join(t.tam_tai(chi_s))}"})
    con = [x for x in d_lam["xau"] if not x.startswith("Tam tai")]
    if con:
        dn.append({"loai": "luu_y", "tieu_de": "Làm nhà, cưới hỏi năm này: nên cân nhắc",
                   "noi_dung": f"Tuổi mụ {tuoi} rơi vào {', '.join(con)} — dân gian thường lùi năm hoặc mượn tuổi người thân đứng tên; việc khác vẫn làm như thường.",
                   "can_cu": f"Tuổi mụ {tuoi}: Kim lâu chia 9 dư 1, 3, 6, 8; Hoang ốc đếm theo hàng chục"})
    if sao["nam"]:
        dn.append({"loai": "trung", "tieu_de": f"Sao năm theo tục: nam {sao['nam']['ten']}, nữ {sao['nu']['ten']}",
                   "noi_dung": "Sao hạn xếp theo tuổi mụ và giới tính, giống nhau cho mọi người cùng tuổi; mỗi sao đọc bằng việc nên làm bên dưới.",
                   "can_cu": f"Cửu Diệu theo tuổi mụ {tuoi}"})
    thu_tu = {"thuan": 0, "luu_y": 1, "trung": 2}
    dn = sorted(dn, key=lambda x: thu_tu[x["loai"]])[:6]

    tu_hoa_kb = json.loads((Path(__file__).parents[1] / "kb" / "data" / "tuvi_kb.json").read_text(encoding="utf-8"))["tu_hoa"]
    tu_hoa = [{"hoa": h, "sao": s, "y_nghia": tu_hoa_kb[h]["y_nghia"]} for h, s in zip(("Lộc", "Quyền", "Khoa", "Kỵ"), TU_HOA[can_n])]
    thuan = [x["tieu_de"] for x in dn if x["loai"] == "thuan"]
    luu_y = [x["tieu_de"] for x in dn if x["loai"] == "luu_y"]
    tra_loi = (f"Năm {nam} ({can_n} {chi_n}), người tuổi {can_s} {chi_s} sinh {nam_sinh} (mệnh {na_s['ten']}) bước vào tuổi mụ {tuoi}. "
               + (f"Điểm thuận: {thuan[0][:1].lower()}{thuan[0][1:]}. " if thuan else "")
               + (f"Điều nên để ý: {'; '.join(x[:1].lower() + x[1:] for x in luu_y[:2])}. " if luu_y else "")
               + (f"Sao theo tục: nam {sao['nam']['ten']}, nữ {sao['nu']['ten']}." if sao["nam"] else ""))
    hoi_dap = [
        {"hoi": f"Tuổi {can_s} {chi_s} {nam_sinh} năm {nam} thế nào?", "dap": tra_loi},
        {"hoi": f"Tuổi {can_s} {chi_s} năm {nam} sao gì chiếu mệnh?",
         "dap": (f"Theo tục xếp theo tuổi mụ {tuoi}: nam mạng sao {sao['nam']['ten']} (hạn {sao['nam']['han']}), nữ mạng sao "
                 f"{sao['nu']['ten']} (hạn {sao['nu']['han']}). Mỗi sao đọc bằng việc nên làm trên trang, không cần nghi lễ gì."
                 if sao["nam"] else f"Dưới 10 tuổi mụ, dân gian không xếp sao hạn.")},
        {"hoi": f"Tuổi {can_s} {chi_s} năm {nam} có phạm Tam tai, Kim lâu không?",
         "dap": (f"{'Có, năm thứ ' + str(tt) + ' của Tam tai' if tt else 'Không phạm Tam tai'}; "
                 f"{'phạm ' + tdg.KB['kim_lau'][kl]['ten'] if kl else 'không phạm Kim lâu'} (tuổi mụ {tuoi}). "
                 f"Làm nhà năm {nam}: {'thuận theo tập quán' if not d_lam['xau'] else 'dân gian thường cân nhắc (' + ', '.join(d_lam['xau']) + ')'}.")},
        {"hoi": f"Tuổi {can_s} {chi_s} hợp, kỵ gì với năm {can_n} {chi_n}?",
         "dap": f"{cu_chi}: {_TEN_CHI.get(q_chi, 'không hợp không xung')}. Thiên can {can_n}–{can_s}: {k['ten_can'][q_can]}. "
                f"Nạp âm {na_n['ten']}–{na_s['ten']}: {q_na}. Đây là quan niệm dân gian, không định sẵn chuyện tốt xấu."},
        {"hoi": "Phần đọc theo tuổi khác gì lá số riêng?", "dap": k["ranh_gioi"]},
    ]
    return {"nam": nam, "can_chi_nam": f"{can_n} {chi_n}", "nap_am_nam": na_n["ten"],
            "nguoi": {"nam_sinh": nam_sinh, "can_chi": f"{can_s} {chi_s}", "nap_am": na_s["ten"], "hanh": na_s["hanh"]},
            "tuoi_mu": tuoi, "quan_he": {"chi": q_chi, "can": q_can, "nap_am": q_na},
            "diem_nhan": dn, "sao": sao, "tam_tai": tt, "kim_lau": tdg.KB["kim_lau"][kl]["ten"] if kl else None,
            "lam_nha": {"thuan": not d_lam["xau"], "xau": d_lam["xau"], "hoang_oc": tdg.KB["hoang_oc"][d_lam["ho"]]["ten"]},
            "tu_hoa": tu_hoa, "tu_hoa_loi": k["tu_hoa"].format(can_chi=f"{can_n} {chi_n}"), "ranh_gioi": k["ranh_gioi"],
            "tra_loi_nhanh": tra_loi, "hoi_dap": hoi_dap, **_meta()}
