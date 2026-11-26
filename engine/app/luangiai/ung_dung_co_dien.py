# -*- coding: utf-8 -*-
"""Chặng 1 (nâng cấp sau rà soát thực nghiệm) — RULES tất định cho lớp 'Học thuật Cổ điển' (`ung_dung_co_dien`).

Nguyên tắc trung thực học thuật & tuân thủ quy tắc dự án (`CLAUDE.md`):
  1. Bát tự: trình bày song song HAI phép lấy Dụng thần + Cách cục nguyệt lệnh (*Tử Bình Chân Thuyên*) + thứ tự can Điều hậu
     tháng sinh (*Cùng Thông Bảo Giám*, chỉ hiển thị — không đổi phép tính Cách 1) + câu cổ thư khớp lá số. TUYỆT ĐỐI KHÔNG
     khuyên hướng nhà theo ngũ hành (tuân thủ quyết định `6b` 2026-11-04: tránh mâu thuẫn Bát trạch).
  2. Tử vi: trình bày nền tảng lập cực cổ điển có nguồn thật của lá số (quan hệ Bản mệnh Nạp âm ↔ Cục, Mệnh chủ – Thân chủ –
     cung Thân cư, Lai nhân cung khởi tứ hoá năm sinh) + câu phú cổ thư khớp cách cục. TUYỆT ĐỐI KHÔNG bịa màu sắc/hướng/
     khung giờ theo chính tinh và không gán mặc định 'Thổ'.
  3. Phong thuỷ: đọc cặp Sơn tinh – Hướng tinh từ chính bảng 81 tổ hợp (`calc.huyen_khong.to_hop_cung` + `trang_thai` theo vận:
     sao 2 Nhị Hắc ở Vận 9 là `sinh` khí, không gán nhầm là `sát`!) gắn vào ĐÚNG vị trí phòng thật trên sơ đồ nhà (`bo_cuc`).
     Khi người dùng chưa khai vị trí phòng -> chỉ nêu đúng 2 khu `huong_thu` (trước nhà) và `toa_son` (lưng nhà), không gán giả
     Toạ là phòng ngủ. Khi hướng nhà có độ lệch giữa Bát Trạch và Huyền Không -> sinh khối `doi_chieu_hai_phai`.
"""
from __future__ import annotations

import datetime as dt

from app import config, ngon_ngu
from app.calc import battu as bt_calc, battu_mo_rong as bt_mr, can_chi as cc_calc, huyen_khong as hk, lunar, phongthuy as pt, tuvi_an_sao as az, tuvi_cach_cuc as tv_cc, tuvi_phi_hoa as ph_calc
from app.hoidap import tuvi as hd_tv
from app.kb import battu_kb, nap, ten as _ten
from app.kb.loi import danh_sach
from app.luangiai import sach_xua as sx

_TEP = "ung_dung_co_dien_kb.json"
_CHU_HANH_NORM = {"Hoả": "Hỏa", "Thuỷ": "Thủy"}
_CUNG_QUAI = {v[1]: k for k, v in hk.QUAI.items()}
_PHONG_UU_TIEN = ("cua_chinh", "phong_ngu_chinh", "bep", "phong_lam_viec", "ban_tho", "ve_sinh")


def _kb() -> dict:
    return nap.doc(_TEP)


def _norm_hanh(h: str) -> str:
    return _CHU_HANH_NORM.get(h, h)


def _ten_hanh(h: str) -> str:
    hn = _norm_hanh(h)
    return hn if ngon_ngu.la_viet() else _ten.ten("hanh", hn)


def _ten_can(c: str) -> str:
    return c if ngon_ngu.la_viet() else _ten.ten("can", c)


def _ten_chi(c: str) -> str:
    return c if ngon_ngu.la_viet() else _ten.ten("chi", c)


def _ten_cung_tv(c: str) -> str:
    return c if ngon_ngu.la_viet() else _ten.ten("cung", c)


def _ten_sao_tv(s: str) -> str:
    return s if ngon_ngu.la_viet() else _ten.ten("sao", s)


def tu_bao_cao_battu(bc: dict, sinh: dict | None = None) -> dict | None:
    """Dựng gói đối chiếu Học thuật Cổ điển cho Bát tự (không màu áo/giờ tự chế, không hướng ngũ hành trái quyết định 6b)."""
    c_nh = next((c for c in bc.get("chuong", []) if c.get("ma") == "ngu_hanh"), None)
    bd = (c_nh or {}).get("bieu_do") or {}
    ds_hanh = bd.get("hanh") or []
    if not ds_hanh:
        return None
    k = _kb()
    kb_bt = k["battu"]
    vi = ngon_ngu.la_viet()

    c1 = [_norm_hanh(x["hanh"]) for x in ds_hanh if x.get("cach_1")]
    c2 = [_norm_hanh(x["hanh"]) for x in ds_hanh if x.get("cach_2")]
    chung = [h for h in c1 if h in c2]
    fmt_ds = lambda ds: danh_sach([_ten_hanh(h) for h in ds]) if ds else ""  # noqa: E731

    if chung:
        tom_tat_dt = kb_bt["cung_can"].format(ds=fmt_ds(chung))
    elif c1 or c2:
        tom_tat_dt = kb_bt["khac_nhau"].format(c1=fmt_ds(c1) or "—", c2=fmt_ds(c2) or "—")
    else:
        tom_tat_dt = kb_bt["trung_hoa"]

    diem_hoc_thuat: list[dict] = [
        {"nhan": kb_bt["nhan_hai_cach"], "noi_dung": tom_tat_dt},
    ]
    sach_co: list[dict] = []

    if sinh and sinh.get("lich") and sinh.get("gioi_tinh"):
        try:
            ls = bt_calc.la_so(
                sinh["lich"],
                sinh["gioi_tinh"],
                gio_ty=sinh.get("gio_ty", "da_ty"),
                utc_lich=sinh.get("utc_lich", 7.0),
                nam_ban_cau=bool(sinh.get("nam_ban_cau")),
            )
            cc_raw = bt_mr.cach_cuc_tbct(ls)
            cc_kb = battu_kb.cach_cuc_tbct(cc_raw["ma"]) if cc_raw.get("ma") else None
            if vi:
                ten_cc = (cc_kb or {}).get("ten") or cc_raw.get("thap_than") or ""
            else:
                ten_kb = (cc_kb or {}).get("ten") or ""
                ten_tra = _ten.ten("cach_cuc_bt", ten_kb) if ten_kb else ""
                if ten_tra and ten_tra != ten_kb:
                    ten_cc = ten_tra
                elif cc_raw.get("thap_than"):
                    ten_cc = f"{_ten.ten('thap_than', cc_raw['thap_than'])} Pattern"
                else:
                    ten_cc = ten_kb
            if ten_cc:
                diem_hoc_thuat.append({"nhan": kb_bt["nhan_cach_cuc"], "noi_dung": ten_cc})

            can_nc = ls["nhat_chu"]["can"]
            chi_th = ls["tru"][1]["chi"]
            dh = battu_kb.dieu_hau(can_nc, chi_th) or {}
            can_dh_ds = dh.get("can") or []
            if can_dh_ds:
                nd_dh = kb_bt["noi_dung_dieu_hau"].format(
                    can=_ten_can(can_nc),
                    chi=_ten_chi(chi_th),
                    can_dh=", ".join(_ten_can(x) for x in can_dh_ds),
                )
                diem_hoc_thuat.append({"nhan": kb_bt["nhan_dieu_hau"], "noi_dung": nd_dh})
                if vi and dh.get("trich"):
                    sach_co.append({"sach": "Cùng Thông Bảo Giám", "ve": kb_bt["nhan_dieu_hau"], "nguyen_van": dh["trich"], "y": nd_dh})
            if vi:
                mr = bt_mr.mo_rong(ls)
                for m_sx in (sx.battu(ls, mr) or [])[:3]:
                    if m_sx.get("y"):
                        sach_co.append({
                            "sach": m_sx.get("sach") or "",
                            "ve": m_sx.get("ve") or "",
                            "nguyen_van": m_sx.get("han") or m_sx.get("nguyen_van") or "",
                            "y": m_sx["y"],
                        })
        except Exception:  # noqa: BLE001 — thiếu dữ liệu biên thì giữ điểm hai cách cơ bản
            pass

    ra = {
        "ma": "battu_co_dien",
        "tieu_de": k["tieu_de"]["battu"],
        "nguyen_tac_uu_tien": k["nguyen_tac_uu_tien"]["battu"],
        "tom_tat_dung_than": tom_tat_dt,
        "diem_hoc_thuat": diem_hoc_thuat,
    }
    if vi and sach_co:
        ra["sach"] = sach_co
    return ra


def tu_bao_cao_tuvi(bc: dict, sinh: dict | None = None) -> dict | None:
    """Dựng gói đối chiếu Học thuật Cổ điển cho Tử vi từ nền tảng lập cực thật & cổ phú (0 màu/giờ tự chế)."""
    if not bc.get("chuong"):
        return None
    k = _kb()
    kb_tv = k["tuvi"]
    vi = ngon_ngu.la_viet()
    diem_hoc_thuat: list[dict] = []
    sach_co: list[dict] = []

    if sinh and sinh.get("ngay") and sinh.get("ti") is not None and sinh.get("gioi_tinh"):
        try:
            tho = az.an_sao_tho(
                sinh["ngay"],
                sinh["ti"],
                sinh["gioi_tinh"],
                "vi-VN",
                tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                hoa_linh=sinh.get("hoa_linh", "viet"),
                thang_nhuan=sinh.get("thang_nhuan", "thang_sau"),
                lich=sinh.get("lich", "viet"),
            )
            ls = hd_tv.tom_tat(tho)
            cc_nam_str = str(tho.get("chineseDate") or "").split(" - ")[0].strip()
            parts_nam = cc_nam_str.split(" ")
            if len(parts_nam) == 2:
                can_nam, chi_nam = parts_nam[0], parts_nam[1]
            else:
                can_nam, chi_nam = lunar.can_chi_nam(sinh["ngay"].year)
            na_info = cc_calc.nap_am(can_nam, chi_nam)
            na_ten = na_info["ten"]
            cuc_ten = str(tho.get("fiveElementsClass") or "")
            na_hien = na_ten if vi else _ten.ten("nap_am", na_ten)
            cuc_hien = cuc_ten if vi else _ten.ten("cuc", cuc_ten)
            if na_hien and cuc_hien:
                nd_lc = f"{na_hien} · {cuc_hien}"
                diem_hoc_thuat.append({"nhan": kb_tv["nhan_lap_cuc"], "noi_dung": nd_lc})

            mc_sao = str(tho.get("soul") or "")
            tc_sao = str(tho.get("body") or "")
            than_cung = next((c["ten"] for c in ls["cung"] if c.get("la_than")), "Mệnh")
            if mc_sao and tc_sao:
                diem_hoc_thuat.append({
                    "nhan": kb_tv["nhan_chu_than"],
                    "noi_dung": kb_tv["noi_dung_chu_than"].format(
                        menh_chu=_ten_sao_tv(mc_sao),
                        than_chu=_ten_sao_tv(tc_sao),
                        than_cu=_ten_cung_tv(than_cung),
                    ),
                })

            chi_lai = ph_calc.lai_nhan(can_nam)
            c_lai = next((c for c in ls["cung"] if c["chi"] == chi_lai), None)
            if c_lai:
                diem_hoc_thuat.append({
                    "nhan": kb_tv["nhan_lai_nhan"],
                    "noi_dung": kb_tv["noi_dung_lai_nhan"].format(
                        can_nam=_ten_can(can_nam),
                        cung_lai=_ten_cung_tv(c_lai["ten"]),
                        chi_lai=_ten_chi(chi_lai),
                    ),
                })

            if vi and not sinh.get("gio_tam"):
                cc_ds = tv_cc.nhan_dien(tho)
                for m_sx in (sx.tuvi(cc_ds, ls["cung"]) or [])[:3]:
                    if m_sx.get("y"):
                        sach_co.append({
                            "sach": m_sx.get("sach") or "",
                            "ve": m_sx.get("ve") or "",
                            "nguyen_van": m_sx.get("han") or m_sx.get("nguyen_van") or "",
                            "y": m_sx["y"],
                        })
        except Exception:  # noqa: BLE001
            pass

    if not diem_hoc_thuat:
        return None
    ra = {
        "ma": "tuvi_co_dien",
        "tieu_de": k["tieu_de"]["tuvi"],
        "nguyen_tac_uu_tien": k["nguyen_tac_uu_tien"]["tuvi"],
        "diem_hoc_thuat": diem_hoc_thuat,
    }
    if vi and sach_co:
        ra["sach"] = sach_co
    return ra


def _ten_tt_sao(tt: str) -> str:
    return tt if ngon_ngu.la_viet() else _ten.ten("trang_thai_sao", tt)


def _ten_phuong(p: str) -> str:
    return p if ngon_ngu.la_viet() else _ten.ten("huong", p)


def _ten_du_nien(dn: str) -> str:
    return dn if ngon_ngu.la_viet() else _ten.ten("du_nien", dn)


def _ten_quai(q: str) -> str:
    return q if ngon_ngu.la_viet() else _ten.ten("quai", q)


def _muc_cap_van9(son: int, huong: int, van: int, ten_cap_vi: str, y_vi: str, luu_y_vi: str) -> tuple[str, str]:
    """Dựng tên cặp & hướng điều hoà 0 đồng cho một khu vực dựa trên `hk.trang_thai(sao, van)` (sao 2 Vận 9 = `sinh`!)."""
    if ngon_ngu.la_viet():
        ung = f"{y_vi} {luu_y_vi}".strip()
        return ten_cap_vi, ung
    ts, th = hk.trang_thai(son, van), hk.trang_thai(huong, van)
    ten_en = f"Pair {son}-{huong}"
    if th == "vượng" or son == van:
        ung_en = f"Ruling Period {van} Qi arrives here — keep the area bright, ventilated and clear for everyday activity."
    elif th == "sinh" or ts == "sinh":
        ung_en = f"Upcoming Sheng Qi star ({son}-{huong}, Period {van}) — maintain clean, calm order; avoid heavy structural disturbance."
    elif 5 in (son, huong):
        ung_en = "Five Yellow sits in this sector — keep the space quiet, neat and free of drilling or loud renovation."
    else:
        ung_en = "Keep airflow balanced, lighting gentle and pathways uncluttered according to the room's daily function."
    return ten_en, ung_en


def tu_bao_cao_phongthuy(bc: dict, bc_luan: dict | None = None, mq: dict | None = None) -> dict | None:
    """Dựng gói đối chiếu Học thuật Cổ điển cho Phong thuỷ gắn đúng phòng thật `bo_cuc` & đối chiếu 2 phái Bát Trạch – Vận 9."""
    dt_info = bc.get("da_tinh") or {}
    b_hk = dt_info.get("huyen_khong")
    if not b_hk or not b_hk.get("cung") or not b_hk.get("cap_huong") or not b_hk.get("cap_toa"):
        return None
    k = _kb()
    kb_pt = k["phongthuy"]

    ngay_str = dt_info.get("ngay_xem")
    nam_xem = (
        dt.date.fromisoformat(ngay_str).year
        if isinstance(ngay_str, str) and len(ngay_str) >= 10
        else config.hom_nay_vn().year
    )
    ln_map = hk.luu_nien(nam_xem)["cung"]
    van = int(b_hk.get("van") or 9)
    cung_theo_phuong = {c["phuong"]: c for c in b_hk["cung"] if c.get("phuong") and c.get("cung") != "Trung cung"}
    cung_theo_quai = {c["cung"]: c for c in b_hk["cung"]}

    # Đọc vị trí phòng THẬT người dùng đã khai báo trên sơ đồ (`bc_luan.da_tinh.vi_tri`)
    vi_tri_that: list[tuple[str, str]] = []
    for v in ((bc_luan or {}).get("da_tinh") or {}).get("vi_tri") or []:
        ph, phuong = v.get("phong"), v.get("cung")
        if ph in _PHONG_UU_TIEN and phuong in cung_theo_phuong:
            vi_tri_that.append((ph, phuong))
    vi_tri_that.sort(key=lambda x: _PHONG_UU_TIEN.index(x[0]))

    chua_khai = len(vi_tri_that) == 0
    ds_kv: list[dict] = []

    if not chua_khai:
        for ma_phong, phuong in vi_tri_that[:4]:
            c_hk = cung_theo_phuong[phuong]
            quai = c_hk["cung"]
            th_cap = hk.to_hop_cung(c_hk["son"], c_hk["huong"], van)
            sao_ln = ln_map.get(quai)
            ln_txt = kb_pt["luu_nien_phu"].format(sao=sao_ln) if sao_ln else ""
            tt_txt = kb_pt["trang_thai_cap"].format(
                son=c_hk["son"],
                tt_son=_ten_tt_sao(th_cap["trang_thai_son"]),
                huong=c_hk["huong"],
                tt_huong=_ten_tt_sao(th_cap["trang_thai_huong"]),
                ln=ln_txt,
            )
            ten_phep, ung = _muc_cap_van9(c_hk["son"], c_hk["huong"], van, th_cap["ten"], th_cap["y"], th_cap["luu_y"])
            mau_ten = kb_pt["ten_vi_tri"].get(ma_phong) or "{phuong}"
            ds_kv.append({
                "khu_vuc": ma_phong,
                "ten_khu_vuc": mau_ten.format(phuong=_ten_phuong(phuong)),
                "cap_sao": f"{c_hk['son']}-{c_hk['huong']}",
                "ten_phep": ten_phep,
                "ngu_hanh_dieu_hoa": tt_txt,
                "ung_dung": ung,
            })
    else:
        # Chưa khai phòng thật -> CHỈ hiển thị trung thực Hướng thủ & Toạ sơn (tuyệt đối không gán giả Toạ = phòng ngủ)
        ch, ct = b_hk["cap_huong"], b_hk["cap_toa"]
        qh = next((q for q, c in cung_theo_quai.items() if q != "Trung cung" and c["son"] == ch["son"] and c["huong"] == ch["huong"]), None)
        qt = next((q for q, c in cung_theo_quai.items() if q != "Trung cung" and c["son"] == ct["son"] and c["huong"] == ct["huong"]), None)
        for ma_vt, quai in (("huong_thu", qh), ("toa_son", qt)):
            if not quai or quai not in cung_theo_quai:
                continue
            c_hk = cung_theo_quai[quai]
            th_cap = hk.to_hop_cung(c_hk["son"], c_hk["huong"], van)
            sao_ln = ln_map.get(quai)
            ln_txt = kb_pt["luu_nien_phu"].format(sao=sao_ln) if sao_ln else ""
            tt_txt = kb_pt["trang_thai_cap"].format(
                son=c_hk["son"],
                tt_son=_ten_tt_sao(th_cap["trang_thai_son"]),
                huong=c_hk["huong"],
                tt_huong=_ten_tt_sao(th_cap["trang_thai_huong"]),
                ln=ln_txt,
            )
            ten_phep, ung = _muc_cap_van9(c_hk["son"], c_hk["huong"], van, th_cap["ten"], th_cap["y"], th_cap["luu_y"])
            ds_kv.append({
                "khu_vuc": ma_vt,
                "ten_khu_vuc": kb_pt["ten_vi_tri"][ma_vt].format(phuong=_ten_phuong(c_hk["phuong"])),
                "cap_sao": f"{c_hk['son']}-{c_hk['huong']}",
                "ten_phep": ten_phep,
                "ngu_hanh_dieu_hoa": tt_txt,
                "ung_dung": ung,
            })

    # Đối chiếu 2 phái Bát Trạch ↔ Huyền Không khi hướng nhà có độ lệch nhận định giữa mệnh chủ và thời vận
    doi_chieu = None
    mq_quai = (mq or dt_info.get("menh_quai") or {}).get("quai")
    huong_nha = dt_info.get("huong_nha")
    if mq_quai and huong_nha in pt.HUONG:
        dn_cua = pt.bang_huong(mq_quai).get(huong_nha)
        bt_thuan = dn_cua in pt.CAT
        ch_info = b_hk["cap_huong"]
        hk_muc = ch_info.get("muc")
        ten_cap_hien = ch_info["ten"] if ngon_ngu.la_viet() else f"Pair {ch_info['ma']}"
        if bt_thuan and hk_muc == "can_chu_dong":
            m_dc = kb_pt["doi_chieu"]["thuan_bt_can_hk"]
            doi_chieu = {
                "goc_bat_trach": m_dc["goc_bat_trach"].format(quai=_ten_quai(mq_quai), du_nien=_ten_du_nien(dn_cua)),
                "goc_huyen_khong": m_dc["goc_huyen_khong"].format(van=van, cap=ch_info["ma"], ten_cap=ten_cap_hien),
                "cach_dung_hoa": m_dc["cach_dung_hoa"],
            }
        elif (not bt_thuan) and hk_muc == "thuan":
            m_dc = kb_pt["doi_chieu"]["can_bt_thuan_hk"]
            doi_chieu = {
                "goc_bat_trach": m_dc["goc_bat_trach"].format(quai=_ten_quai(mq_quai), du_nien=_ten_du_nien(dn_cua)),
                "goc_huyen_khong": m_dc["goc_huyen_khong"].format(van=van, cap=ch_info["ma"], ten_cap=ten_cap_hien),
                "cach_dung_hoa": m_dc["cach_dung_hoa"].format(van=van),
            }

    ra = {
        "ma": "phongthuy_co_dien",
        "tieu_de": k["tieu_de"]["phongthuy"],
        "nguyen_tac_uu_tien": k["nguyen_tac_uu_tien"]["phongthuy"],
        **({"ghi_chu_so_do": kb_pt["chua_khai_phong"]} if chua_khai else {}),
        "khu_vuc_van_9": ds_kv,
        **({"doi_chieu_hai_phai": doi_chieu} if doi_chieu else {}),
    }
    return ra
