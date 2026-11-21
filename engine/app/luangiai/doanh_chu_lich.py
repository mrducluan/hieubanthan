# -*- coding: utf-8 -*-
"""Lịch quyết định 12 tháng cho chủ cơ sở / quản lý (RULES, tất định, không lưu dữ liệu). Rà soát PR #328 (2026-11-21).

MỘT bộ tính với "Thời gian tới" (TG-V2): mỗi tháng dương lịch đọc các lớp có sẵn — con giáp + phong thuỷ + ngày đẹp
(`thoi_gian_lop.lop_thang`), Bát tự theo HAI cách lấy dụng thần (`battu_doi_song.ba_thang_tiet` + `muc_thang`, chỉ khi có
giờ sinh — không đọc Bát tự theo giờ tạm), cộng tháng cá nhân thần số. Nhịp của tháng = ĐẾM lớp cùng thuận / cùng nhắc chậm
(`thoi_gian_lop.tin_hieu`, không điểm số). Lịch đi 12 tháng KỂ TỪ tháng hiện tại (giờ Việt Nam), không phải tháng 1–12 cố
định. Ngày tốt qua `doanh_chu_ngay.ngay_tot`. Lời ở KB `doanh_chu_lich_kb.json` (+ bản phủ tiếng Anh)."""
from __future__ import annotations

import datetime as dt

from app import ngon_ngu
from app.calc import battu as bt_calc
from app.calc import phongthuy as pt
from app.calc import thanso
from app.calc import thanso_mo_rong as tsmr
from app.config import hom_nay_vn
from app.kb import ten as ten_kb
from app.kb.nap import doc, nho
from app.luangiai import battu_doi_song as bt
from app.luangiai import thoi_gian_lop as tgl
from app.luangiai.doanh_chu_ngay import ngay_tot

MUC_TIEU = ("tang_truong", "ky_ket", "giu_tien", "ra_mat")
CAP = ("chu_dn", "giam_doc", "truong_nhom")
TS_THUAN = (1, 3, 5, 8)
TS_CHAM = (4, 7)
_CAN_HANH = {"Giáp": "Mộc", "Ất": "Mộc", "Bính": "Hoả", "Đinh": "Hoả", "Mậu": "Thổ", "Kỷ": "Thổ",
             "Canh": "Kim", "Tân": "Kim", "Nhâm": "Thuỷ", "Quý": "Thuỷ"}


@nho
def kb() -> dict:
    return doc("doanh_chu_lich_kb.json")


def _thang_tu(tu: dt.date) -> list[tuple[int, int]]:
    y, m = tu.year, tu.month
    ra = []
    for _ in range(12):
        ra.append((y, m))
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return ra


def _nhan(y: int, m: int) -> str:
    return f"T{m}/{y}"


def lich_quyet_dinh_12_thang(ngay: int, thang: int, nam: int, gioi_tinh: str = "nam", gio: str | None = None,
                             cap_quan_ly: str = "chu_dn", muc_tieu: str = "tang_truong", nam_xem: int | None = None,
                             tu: dt.date | None = None) -> dict:
    k = kb()
    vi = ngon_ngu.la_viet()
    hom_nay = tu or hom_nay_vn()
    # `nam_xem` > năm hiện tại → xem trước từ tháng 1 năm ấy; còn lại đi 12 tháng kể từ tháng hiện tại.
    goc = dt.date(nam_xem, 1, 1) if nam_xem and nam_xem > hom_nay.year else hom_nay.replace(day=1)
    ns = dt.date(nam, thang, ngay)
    quai = pt.menh_quai(nam, gioi_tinh, ns)["quai"]
    viec = "khai_truong" if muc_tieu == "ra_mat" else "ky_ket"

    ptb = None
    if gio:
        h, mi = (int(x) for x in gio.split(":"))
        ptb = bt.phan_tich(bt._la_so({"lich": dt.datetime(nam, thang, ngay, h, mi), "gioi_tinh": gioi_tinh}))

    ds, dm, phong = [], [], []
    for y, m in _thang_tu(goc):
        o = tgl.lop_thang(m, y, ns, quai, tu_ngay=hom_nay)
        tcn = tsmr.thang_ca_nhan(ngay, thang, y, m)
        muc_bt = cc_hien = None
        if ptb:
            th = bt.ba_thang_tiet(ptb, dt.date(y, m, 15), so=1)[0]
            cc_hien = f"{ten_kb.ten('can', th['can'])} {ten_kb.ten('chi', th['chi'])}"
            muc_bt = bt.muc_thang(ptb, th["can"], th["chi"])[2]
        # Đếm lớp đúng như "Thời gian tới" (tgl.tin_hieu / xep_thang / tom_lai): tháng cá nhân thần số chỉ là một hàng
        # trong `lop`, không cộng vào nhịp — để nhãn nhịp và câu "Tóm lại" không bao giờ nói ngược nhau.
        tin = tgl.tin_hieu(o, None, muc_bt)
        if len(tin["dau"]) >= 2 and not tin["cham"]:
            nhip = "day_manh"
            dm.append(_nhan(y, m))
        elif len(tin["cham"]) >= 2 and not tin["dau"]:
            nhip = "phong_thu"
            phong.append(_nhan(y, m))
        else:
            nhip = "can_bang"
        nl = k["nen_lam"][nhip]
        nen = (nl.get(muc_tieu) or nl["_"]) + k["cap"].get(cap_quan_ly, "")
        den = (dt.date(y + (m == 12), m % 12 + 1, 1) - dt.timedelta(days=1))
        ngay_dep = ngay_tot(viec, max(dt.date(y, m, 1), hom_nay), den, ns, 3)
        lop = [{"ma": "thanso", "nhan": k["lop_thanso"], "tieu": k["thang_ca_nhan"][str(tcn)],
                "loai": "thuan" if tcn in TS_THUAN else "can_bang" if tcn in TS_CHAM else "trung"}]
        if ptb:
            lop.append({"ma": "battu", "nhan": k["lop_battu"], "tieu": k["bt_muc"][muc_bt].format(cc=cc_hien),
                        "loai": "thuan" if muc_bt == "thuan" else "can_bang" if muc_bt == "can_chu_dong" else "trung"})
        lop += tgl.hang_lop(o, ds[-1]["_o"] if ds else None)
        tru_t = bt_calc.la_so(dt.datetime(y, m, 15, 12, 0), gioi_tinh)["tru"][1]
        ds.append({
            "_o": o,
            "thang": m, "nam": y, "nhan_thang": _nhan(y, m),
            "can_chi_thang": cc_hien or f"{ten_kb.ten('can', tru_t['can'])} {ten_kb.ten('chi', tru_t['chi'])}",
            "hanh_thang": ten_kb.ten("hanh", _CAN_HANH[tru_t["can"]]),
            "thang_ca_nhan": tcn, "chu_de_thang": k["thang_ca_nhan"][str(tcn)],
            "nhip_thang": nhip, "nhan_nhip": k["nhip"][nhip],
            "nen_lam": nen, "nen_chu_y": k["chu_y"][nhip],
            "tom_lai": tgl.tom_lai(tin), "lop": lop, "can_cu": tgl.can_cu_lop(o),
            "ngay_dep": ngay_dep,
        })
    for x in ds:
        x.pop("_o")

    mt = k["muc_tieu"].get(muc_tieu, k["muc_tieu"]["tang_truong"])
    tong = k["tong_quan"].format(tu=_nhan(goc.year, goc.month), muc_tieu=mt["ten"].lower() if vi else mt["ten"],
                                 dm=", ".join(dm) or k["khong_co_dm"], pt=", ".join(phong) or k["khong_co_pt"])
    ho_so = {"duong_doi": thanso.duong_doi(ngay, thang, nam), "nam_ca_nhan": thanso.nam_ca_nhan(ngay, thang, goc.year, "duong_lich"),
             "co_gio": ptb is not None, "thieu_gio": None if ptb else k["thieu_gio"]}
    if ptb:
        ls = ptb.get("ls") or {}
        ho_so["nhat_chu_hanh"] = ten_kb.ten("hanh", (ls.get("nhat_chu") or {}).get("ngu_hanh", "")) or None
        ho_so["dung_than_hai_cach"] = {c: [ten_kb.ten("hanh", h) for h in ptb[c]["hanh"]] for c in ("cach_1", "cach_2")}
    return {
        "tu_thang": _nhan(goc.year, goc.month), "nam_xem": goc.year,
        "muc_tieu": {"ma": muc_tieu, **mt},
        "ho_so_nguoi_xem": ho_so,
        "tong_quan_nam": {"thang_day_manh": dm, "thang_phong_thu": phong, "nhan_dinh_nam": tong,
                          "canh_bao_chung": k["canh_bao_chung"]},
        "muoi_hai_thang": ds,
        "ranh_gioi_phap_ly": k["ranh_gioi"],
    }
