# -*- coding: utf-8 -*-
"""SEO-F — dữ liệu trang "tuổi X hợp hướng nào" (năm 1960–2005 × nam/nữ = 92 trang). Tầng RULES: ghép CALC
(mệnh quái Bát trạch, bảng du niên, can chi, nạp âm, ngày Lập xuân/Tết) với lời KB phong thuỷ. Không gọi LLM;
web chỉ hiển thị. Mặc định mốc đầu năm = Lập xuân (như công cụ Phong thuỷ); trang nêu rõ trường hợp sinh trước mốc.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import can_chi, lunar
from app.calc import phongthuy as pt
from app.calc import tietkhi as tk
from app.kb import phongthuy_kb as kb

NAM_DAU, NAM_CUOI = 1960, 2005
TEN_GIOI = {"nam": "nam", "nu": "nữ"}
THU_TU_CAT = ("Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị")
THU_TU_HUNG = ("Tuyệt Mệnh", "Ngũ Quỷ", "Lục Sát", "Hoạ Hại")
# (mã, nhóm KB, khoá) — gợi ý bố trí lấy thứ tự ưu tiên du niên từ KB.
GOI_Y = (("cua_chinh", "vi_tri_phong", "cua_chinh"), ("mieng_bep", "huong_vat", "mieng_bep"),
         ("dau_giuong", "huong_vat", "dau_giuong"), ("ban_lam_viec", "huong_vat", "ban_lam_viec"))


def tu_slug(slug: str) -> tuple[int, str] | None:
    p = slug.split("-")
    if len(p) != 3 or p[0] != "tuoi" or not p[1].isdigit() or p[2] not in TEN_GIOI:
        return None
    nam = int(p[1])
    return (nam, p[2]) if NAM_DAU <= nam <= NAM_CUOI else None


def _ngay(d, m, y) -> str:
    return dt.date(y, m, d).isoformat()


def _can_chi(nam: int) -> str:
    return " ".join(lunar.can_chi_nam(nam))


def tieu_de(nam: int, gioi_tinh: str) -> str:
    return f"Tuổi {_can_chi(nam)} {nam} {TEN_GIOI[gioi_tinh]} hợp hướng nào?"


def tuoi(nam: int, gioi_tinh: str) -> dict:
    if not NAM_DAU <= nam <= NAM_CUOI or gioi_tinh not in TEN_GIOI:
        raise ValueError(f"năm {NAM_DAU}–{NAM_CUOI}, giới tính nam/nu")
    can, chi = lunar.can_chi_nam(nam)
    mq = pt.menh_quai(nam, gioi_tinh)
    bang = pt.bang_huong(mq["quai"])
    theo_dn = {d: h for h, d in bang.items()}
    du_nien = kb._d()["du_nien"]
    huong = lambda d: {"huong": theo_dn[d], "du_nien": d, "y_nghia": du_nien[d]["y_nghia"],  # noqa: E731
                       "dung_cho": du_nien[d]["dung_cho"]}
    tot, xau = [huong(d) for d in THU_TU_CAT], [huong(d) for d in THU_TU_HUNG]
    bc = kb.bo_cuc()
    goi_y = []
    for ma, nhom, khoa in GOI_Y:
        m = bc[nhom][khoa]
        goi_y.append({"ma": ma, "tieu_de": m["tieu_de"], "noi_dung": m["noi_dung"], "nguon": m["nguon"],
                      "huong": [theo_dn[d] for d in m["uu_tien"]], "du_nien": list(m["uu_tien"])})
    lx = (tk.thoi_diem(nam, 315) + dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)).date().isoformat()
    tet_v = _ngay(*lunar.lunar_to_solar(1, 1, nam, 0, config.TZ_LICH_AM["viet"]))
    tet_t = _ngay(*lunar.lunar_to_solar(1, 1, nam, 0, config.TZ_LICH_AM["trung"]))
    truoc = pt.menh_quai(nam - 1, gioi_tinh)
    gt = TEN_GIOI[gioi_tinh]
    q, nhom = mq["quai"], mq["nhom"]
    ten_tot = ", ".join(f"{h['huong']} ({h['du_nien']})" for h in tot)
    ten_xau = ", ".join(h["huong"] for h in xau)
    tra_loi = (f"{gt.capitalize()} sinh năm {nam} ({can} {chi}) có mệnh quái {q}, thuộc {nhom}. Bốn hướng tốt: {ten_tot}; "
               f"tốt nhất là {tot[0]['huong']} ({tot[0]['du_nien']}). Bốn hướng nên tránh: {ten_xau}. "
               f"Nếu sinh trước Lập xuân ({_dmy(lx)}) thì tính theo năm {nam - 1}: mệnh {truoc['quai']}.")
    gy = {x["ma"]: x for x in goi_y}
    hd = [
        {"hoi": f"{gt.capitalize()} {nam} hợp hướng nhà nào?",
         "dap": f"Hướng nhà (cửa chính) hợp nhất là {', '.join(gy['cua_chinh']['huong'])} — theo thứ tự "
                f"{', '.join(gy['cua_chinh']['du_nien'])} của mệnh {q}. Tránh {ten_xau}."},
        {"hoi": f"Tuổi {can} {chi} {gt} nên đặt bếp hướng nào?",
         "dap": f"Theo nguyên tắc toạ hung hướng cát: thân bếp đặt ở phương xấu, miệng bếp quay về "
                f"{', '.join(gy['mieng_bep']['huong'])}."},
        {"hoi": f"{gt.capitalize()} {nam} kê đầu giường hướng nào?",
         "dap": f"Đầu giường nên quay về {', '.join(gy['dau_giuong']['huong'])} (quan niệm dân gian, ghi rõ nguồn)."},
        {"hoi": f"{gt.capitalize()} {nam} ngồi làm việc quay mặt hướng nào?",
         "dap": f"Ưu tiên quay mặt về {', '.join(gy['ban_lam_viec']['huong'])}."},
        {"hoi": f"Sinh đầu năm {nam} (tháng 1, đầu tháng 2) thì tính mệnh quái thế nào?",
         "dap": f"Bát trạch lấy mốc Lập xuân ({_dmy(lx)}): sinh trước ngày này tính theo năm {nam - 1}, mệnh "
                f"{truoc['quai']} ({truoc['nhom']}). Có sách lấy mốc Tết âm lịch ({_dmy(tet_v)} theo lịch Việt"
                + (f", {_dmy(tet_t)} theo lịch Trung Quốc" if tet_t != tet_v else "") + ") — công cụ Phong thuỷ cho bạn chọn mốc."},
        {"hoi": f"Nữ và nam cùng sinh năm {nam} có hợp hướng giống nhau không?",
         "dap": f"Không nhất thiết: mệnh quái tính khác nhau theo giới tính. {('Nữ' if gioi_tinh == 'nam' else 'Nam')} "
                f"{nam} có mệnh {pt.menh_quai(nam, 'nu' if gioi_tinh == 'nam' else 'nam')['quai']}."},
    ]
    return {
        "slug": f"tuoi-{nam}-{gioi_tinh}", "nam": nam, "gioi_tinh": gioi_tinh, "tieu_de": tieu_de(nam, gioi_tinh),
        "mo_ta": (f"{gt.capitalize()} sinh năm {nam} ({can} {chi}) mệnh quái {q} ({nhom}): 4 hướng tốt "
                  f"{', '.join(h['huong'] for h in tot)}, hướng cửa, bếp, giường, bàn làm việc theo Bát trạch."),
        "can_chi": f"{can} {chi}", "nap_am": can_chi.nap_am(can, chi),
        # SEO-J: trang "sinh năm X mệnh gì" (1950–2025 phủ trọn 1960–2005)
        "trang_menh": f"/bat-tu/menh-theo-nam/sinh-nam-{nam}-menh-gi",   # QH-URL: silo Bát tự
        "menh_quai": {"quai": q, "nhom": nhom, "so": mq["so"], **(kb.quai(q) or {})},
        "huong_tot": tot, "huong_xau": xau, "bang_huong": bang, "goi_y": goi_y,
        "moc_dau_nam": {"lap_xuan": lx, "tet_viet": tet_v, "tet_trung": tet_t, "tet_lech": tet_t != tet_v},
        "sinh_truoc_moc": {"nam_tinh": nam - 1, "quai": truoc["quai"], "nhom": truoc["nhom"],
                           "slug": f"tuoi-{nam - 1}-{gioi_tinh}" if nam - 1 >= NAM_DAU else None},
        "tra_loi_nhanh": tra_loi, "hoi_dap": hd,
        "nguon": "Bát trạch (Dương Trạch Tam Yếu) — bảng du niên; mệnh quái theo năm sinh và giới tính",
        "luu_y": [kb.luu_y("bat_trach"), kb.bo_cuc()["luu_y"]],
        **{k: v for k, v in kb.meta().items() if k in ("trang_thai", "can_doi_chieu")},
    }


def _dmy(iso: str) -> str:
    y, m, d = iso.split("-")
    return f"{int(d):02d}/{int(m):02d}/{y}"


def danh_sach() -> list[dict]:
    ds = []
    for nam in range(NAM_DAU, NAM_CUOI + 1):
        for g in TEN_GIOI:
            mq = pt.menh_quai(nam, g)
            ds.append({"slug": f"tuoi-{nam}-{g}", "nam": nam, "gioi_tinh": g, "tieu_de": tieu_de(nam, g),
                       "quai": mq["quai"], "nhom": mq["nhom"], "can_chi": _can_chi(nam)})
    return ds


# ---- SEO-K (chủ dự án duyệt 2026-10-21): một trang cho cả nam và nữ cùng năm sinh (92 → 46) --------------------
def tu_slug_gop(slug: str) -> int | None:
    """`tuoi-1990` (mới) hoặc `tuoi-1990-nam|nu` (cũ, web 308 về bản gộp) → năm sinh."""
    p = slug.split("-")
    if len(p) not in (2, 3) or p[0] != "tuoi" or not p[1].isdigit() or (len(p) == 3 and p[2] not in TEN_GIOI):
        return None
    nam = int(p[1])
    return nam if NAM_DAU <= nam <= NAM_CUOI else None


def tieu_de_gop(nam: int) -> str:
    q_nam, q_nu = pt.menh_quai(nam, "nam")["quai"], pt.menh_quai(nam, "nu")["quai"]
    return f"Tuổi {_can_chi(nam)} {nam} hợp hướng nào? Nam mệnh {q_nam}, nữ mệnh {q_nu}"


CAP_NHAT_GOP = "2026-10-22"
_RIENG = ("gioi_tinh", "menh_quai", "huong_tot", "huong_xau", "bang_huong", "goi_y", "tra_loi_nhanh")


def tuoi_gop(nam: int) -> dict:
    a, b = tuoi(nam, "nam"), tuoi(nam, "nu")
    gioi = [{k: x[k] for k in _RIENG} | {"sinh_truoc_moc": {k: v for k, v in x["sinh_truoc_moc"].items() if k != "slug"}}
            for x in (a, b)]
    tot = [[h["huong"] for h in x["huong_tot"]] for x in (a, b)]
    chung = [h for h in tot[0] if h in tot[1]]
    qa, qb = a["menh_quai"], b["menh_quai"]
    ket = (f"Vợ chồng cùng tuổi {a['can_chi']} chung hướng tốt: {', '.join(chung)}." if chung else
           f"Nam ({qa['nhom']}) và nữ ({qb['nhom']}) cùng năm không chung hướng tốt — khi hai người cùng tuổi ở chung, "
           "thường ưu tiên mệnh người trụ cột, phòng riêng theo mệnh từng người.")
    tra_loi = (f"Sinh năm {nam} ({a['can_chi']}): nam mệnh {qa['quai']} ({qa['nhom']}), hướng tốt nhất "
               f"{a['huong_tot'][0]['huong']}; nữ mệnh {qb['quai']} ({qb['nhom']}), hướng tốt nhất {b['huong_tot'][0]['huong']}. "
               f"{ket} Sinh trước Lập xuân ({_dmy(a['moc_dau_nam']['lap_xuan'])}) thì tính theo năm {nam - 1}.")
    hd, da = [], set()
    for h in a["hoi_dap"] + b["hoi_dap"]:
        if h["hoi"] not in da and not h["hoi"].startswith("Nữ và nam cùng sinh"):
            da.add(h["hoi"])
            hd.append(h)
    ta, tb = a["sinh_truoc_moc"], b["sinh_truoc_moc"]
    for h in hd:
        if h["hoi"].startswith("Sinh đầu năm"):
            h["dap"] = (f"Bát trạch lấy mốc Lập xuân ({_dmy(a['moc_dau_nam']['lap_xuan'])}): sinh trước ngày này tính theo "
                        f"năm {nam - 1} — nam mệnh {ta['quai']} ({ta['nhom']}), nữ mệnh {tb['quai']} ({tb['nhom']}). Có sách "
                        f"lấy mốc Tết âm lịch ({_dmy(a['moc_dau_nam']['tet_viet'])} theo lịch Việt) — công cụ Phong thuỷ cho bạn chọn mốc.")
    hd.append({"hoi": f"Vợ chồng cùng sinh năm {nam} nên chọn hướng nhà theo ai?",
               "dap": ket + " Công cụ Phong thuỷ cho nhập cả hai người để xem hướng chung."})
    return {
        "slug": f"tuoi-{nam}", "nam": nam, "tieu_de": tieu_de_gop(nam),
        # SEO-F đăng 2026-10-08; SEO-K gộp nam + nữ 2026-10-22 — đổi CAP_NHAT_GOP khi sửa nội dung trang.
        "ngay_dang": "2026-10-08", "cap_nhat": CAP_NHAT_GOP,
        "mo_ta": (f"Sinh năm {nam} ({a['can_chi']}): nam mệnh {qa['quai']}, nữ mệnh {qb['quai']} — 4 hướng tốt, 4 hướng "
                  f"nên tránh, hướng cửa, bếp, giường cho từng người theo Bát trạch."),
        "can_chi": a["can_chi"], "nap_am": a["nap_am"], "trang_menh": a["trang_menh"],
        "gioi": gioi, "huong_chung": chung,
        "moc_dau_nam": a["moc_dau_nam"],
        "sinh_truoc_moc": {"nam_tinh": nam - 1, "slug": f"tuoi-{nam - 1}" if nam - 1 >= NAM_DAU else None},
        "tra_loi_nhanh": tra_loi, "hoi_dap": hd,
        "nguon": a["nguon"], "luu_y": a["luu_y"],
        **{k: a[k] for k in ("trang_thai", "can_doi_chieu") if k in a},
        "minh_hoa": {"kieu": "la_ban_doi", "nam": nam, "quai_nam": qa["quai"], "quai_nu": qb["quai"],
                     "huong_tot_nam": tot[0], "huong_tot_nu": tot[1]},
    }


def danh_sach_gop() -> list[dict]:
    ra = []
    for nam in range(NAM_DAU, NAM_CUOI + 1):
        a, b = pt.menh_quai(nam, "nam"), pt.menh_quai(nam, "nu")
        ra.append({"slug": f"tuoi-{nam}", "nam": nam, "tieu_de": tieu_de_gop(nam), "can_chi": _can_chi(nam),
                   "quai_nam": a["quai"], "nhom_nam": a["nhom"], "quai_nu": b["quai"], "nhom_nu": b["nhom"]})
    return ra
