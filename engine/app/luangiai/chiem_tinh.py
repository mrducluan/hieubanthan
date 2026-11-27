# -*- coding: utf-8 -*-
"""Chặng 4.2 — Tầng RULES Chiêm tinh phương Tây & Cầu nối Đông – Tây (`engine/app/luangiai/chiem_tinh.py`).

Đọc bản đồ sao Natal, Transit và Synastry từ 6 tệp KB song ngữ (`chiem_tinh_*_kb.json` + `astro_east_west_bridge_kb.json`).
Tuân thủ nghiêm ngặt:
  - Cổng `TUOI-16` (< 16 tuổi → chuyển hướng lịch sự, không luận vận hạn/tình cảm).
  - Cầu nối Đông – Tây đọc riêng từng hệ toạ độ (`Bát tự` & `Tử vi` chỉ đọc chỉ số công khai miễn phí, không lộ chương khoá
    `SAO-2`, không quy đồng 5 Hành = 4 Nguyên tố, không gộp điểm `CD-1`).
  - Synastry bắt buộc có xác nhận đồng ý tự nguyện và không in lại ngày sinh của đối tác ra lời văn.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import (
    battu as bt_calc,
    chiem_tinh_lich as ctl,
    chiem_tinh_natal as ctn,
    chiem_tinh_synastry as cts,
    chiem_tinh_transit as ctt,
    tuvi_an_sao as az,
)
from app.kb import nap, ten as _tn

_HANH_CHUAN = {"Thuỷ": "Thủy", "Hoả": "Hỏa", "Kim": "Kim", "Mộc": "Mộc", "Thủy": "Thủy", "Hỏa": "Hỏa", "Thổ": "Thổ"}


def _kb_ht() -> dict:
    return nap.doc("chiem_tinh_hanh_tinh_cung_kb.json")


def _kb_nha() -> dict:
    return nap.doc("chiem_tinh_nha_kb.json")


def _kb_gc() -> dict:
    return nap.doc("chiem_tinh_goc_chieu_kb.json")


def _kb_vh() -> dict:
    return nap.doc("chiem_tinh_van_han_kb.json")


def _kb_hd() -> dict:
    return nap.doc("chiem_tinh_hop_doi_kb.json")


def _kb_bridge() -> dict:
    return nap.doc("astro_east_west_bridge_kb.json")


def _loi() -> dict:
    return _kb_ht()["loi"]


def _ten_diem(ma: str, kb_ht: dict) -> str:
    if ma in kb_ht["hanh_tinh"]:
        return kb_ht["hanh_tinh"][ma]["ten"]
    if ma in ("asc", "mc"):
        return kb_ht["loi"]["ten_" + ma]
    return ma


def _dau_vao_dong(ngay_sinh: dt.date, gio_sinh: str, gioi_tinh: str, noi_sinh: str | None, vung_vn: str):
    """Cùng tiền xử lý thời gian với lá số Tử vi / Bát tự (`tuvi_api._DauVao`: múi giờ lịch sử, nơi sinh, âm lịch Việt).
    Thiếu / sai nơi sinh hoặc vùng → `None` (bên phương Đông báo thiếu, không đoán)."""
    from fastapi import HTTPException  # noqa: PLC0415

    from app.calc import dia_ly, mui_gio  # noqa: PLC0415
    from app.config import Region  # noqa: PLC0415
    from app.tuvi_api import TuanTrietInput, _DauVao  # noqa: PLC0415

    ma = (noi_sinh or "").strip()
    if ma and mui_gio.thanh_pho(ma) is not None:
        kw: dict = {"noi_sinh": dia_ly.NUOC_NGOAI, "mui_gio": ma}
    elif ma and dia_ly.tra(dia_ly._ma(ma)) is not None:
        kw = {"noi_sinh": dia_ly._ma(ma)}
    elif ma:
        return None
    else:
        kw = {"vung": Region.SOUTH if vung_vn == "south" else Region.NORTH}
    try:
        return _DauVao(TuanTrietInput(birth_date=ngay_sinh, birth_time=gio_sinh, gender=gioi_tinh, **kw))
    except HTTPException:
        return None


def _menh_tuvi(dv, gioi_tinh: str) -> dict:
    """Chính tinh cung Mệnh Tử vi — đúng đường an sao của lá số Tử vi (iztro, âm lịch Việt, giờ theo `time_index`).
    Cung Mệnh vô chính diệu → mượn cung đối diện (như các mảng khác)."""
    cal = dv.tb.calendar_dt
    ti = az.time_index(cal.hour, cal.minute)
    la = az.an_sao_tho(cal.date(), ti, gioi_tinh, "vi-VN", tz_lich=dv.tz_lich, **dv.tuy_chon)
    cung = la["palaces"]
    i = next(k for k, p in enumerate(cung) if p["name"] == "Mệnh")
    muon = not cung[i]["majorStars"]
    p = cung[(i + 6) % 12] if muon else cung[i]
    return {"sao": [x["name"] for x in p["majorStars"]], "muon": muon}


def _cau_noi_dong_tay(
    ngay_sinh: dt.date,
    gio_sinh: str | None,
    gioi_tinh: str,
    natal: dict,
    transit: dict,
    kb_ht: dict,
    noi_sinh: str | None = None,
    vung_vn: str = "north",
) -> dict:
    """CD-1: đặt hai hệ cạnh nhau, không quy đổi Ngũ hành ↔ 4 nguyên tố, không chấm điểm."""
    kb_br = _kb_bridge()
    loi = kb_br["loi"]
    gt = gioi_tinh if gioi_tinh in ("nam", "nu") else "nam"

    dv = _dau_vao_dong(ngay_sinh, gio_sinh, gt, noi_sinh, vung_vn) if gio_sinh else None
    if dv is not None:
        ls_bt = bt_calc.la_so(dv.tb.calendar_dt, gioi_tinh=gt, utc_lich=dv.utc_lich)
    else:   # chưa có giờ (hoặc thiếu nơi sinh): chỉ trụ ngày theo ngày sinh, không đọc giờ
        ls_bt = bt_calc.la_so(dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, 12, 0), gioi_tinh=gt,
                              co_gio=False)
    can_nc = _tn.ten("can", ls_bt["nhat_chu"]["can"])
    hanh_nc = _tn.ten("hanh", _HANH_CHUAN[ls_bt["nhat_chu"]["ngu_hanh"]])

    if not gio_sinh:
        tv, thieu = None, "gio"
    elif dv is None:
        tv, thieu = None, "noi_sinh"
    else:
        tv, thieu = _menh_tuvi(dv, gt), None
        if not tv["sao"]:
            tv, thieu = None, "khong_chinh_tinh"

    tom_dong = loi["dong_bat_tu"].format(can=can_nc, hanh=hanh_nc)
    if tv:
        sao = loi["noi"].join(_tn.ten("sao", x) for x in tv["sao"])
        tom_dong += loi["dong_tu_vi_muon" if tv["muon"] else "dong_tu_vi"].format(sao=sao)
    else:
        tom_dong += loi["dong_thieu_" + thieu]

    sun_c = kb_ht["cung_hoang_dao"][natal["thien_the"]["mat_troi"]["cung"]]["ten"]
    moon_c = kb_ht["cung_hoang_dao"][natal["thien_the"]["mat_trang"]["cung"]]["ten"]
    asc_c = kb_ht["cung_hoang_dao"][natal["truc"]["asc"]["cung"]]["ten"] if natal.get("truc") else None
    tom_tay = loi["tay"].format(mat_troi=sun_c, mat_trang=moon_c) + (
        loi["tay_asc"].format(asc=asc_c) if asc_c else loi["tay_khong_asc"])

    return {
        "nguyen_tac": kb_br["nguyen_tac_cau_noi"],
        "tom_tat_phuong_dong": tom_dong,
        "tom_tat_phuong_tay": tom_tay,
        "tu_vi_menh": (
            {"sao": [_tn.ten("sao", x) for x in tv["sao"]], "muon_cung_doi": tv["muon"]}
            if tv else None
        ),
        "thieu": thieu,
        "bon_chieu": [
            {"ma": k, **v} for k, v in kb_br["bon_chieu_doi_chieu"].items()
        ],
    }


def doc_ban_do_chiem_tinh(
    *,
    ngay_sinh: dt.date,
    gio_sinh: str | None = None,
    gioi_tinh: str = "nam",
    noi_sinh: str | None = None,
    vung_vn: str = "north",
    vi_do: float | None = None,
    kinh_do: float | None = None,
    utc_lech: float | None = None,
    he_nha: str = "whole_sign",
    ngay_xem: dt.date | None = None,
    kem_cau_noi_dong_tay: bool = True,
) -> dict:
    hn = ngay_xem or config.hom_nay_vn()
    tuoi = hn.year - ngay_sinh.year - ((hn.month, hn.day) < (ngay_sinh.month, ngay_sinh.day))
    if tuoi < config.TUOI_NGUOI_LON:
        return {
            "mo_dun": "chiem_tinh",
            "chuyen_huong_tuoi": {
                "tuoi": tuoi,
                "thong_bao": _loi()["tuoi_chua_du"].format(tuoi=config.TUOI_NGUOI_LON),
            },
        }

    kb_ht = _kb_ht()
    kb_nha = _kb_nha()
    kb_gc = _kb_gc()
    kb_vh = _kb_vh()

    natal = ctn.lap_ban_do_natal(
        ngay_sinh=ngay_sinh,
        gio_sinh=gio_sinh,
        noi_sinh=noi_sinh,
        vung_vn=vung_vn,
        vi_do=vi_do,
        kinh_do=kinh_do,
        utc_lech=utc_lech,
        he_nha=he_nha,
    )
    transit = ctt.tinh_transit(natal, hn)

    # Diễn giải 13 điểm thiên văn
    ds_hanh_tinh = []
    for ma in ctl.HANH_TINH_THU_TU:
        p = natal["thien_the"][ma]
        ht_meta = kb_ht["hanh_tinh"][ma]
        c_meta = kb_ht["cung_hoang_dao"][p["cung"]]
        loi_cung = ht_meta["theo_cung"][p["cung"]]
        nha_so = p["nha"]
        loi_nha = kb_nha["nha"][str(nha_so)]["y_chinh"] if nha_so else None
        ds_hanh_tinh.append({
            "ma": ma,
            "ten": ht_meta["ten"],
            "ky_hieu": ht_meta["ky_hieu"],
            "cung_ma": p["cung"],
            "cung_ten": c_meta["ten"],
            "cung_ky_hieu": c_meta["ky_hieu"],
            "do_cung": p["do_cung"],
            "kinh_do": p["kinh_do"],
            "nghich_hanh": p["nghich_hanh"],
            "nha": nha_so,
            "diem_sang": loi_cung["diem_sang"],
            "nen_de_y": loi_cung["nen_de_y"],
            "viec_ung_dung": loi_cung["viec_ung_dung"],
            "y_nha": loi_nha,
        })

    # Trục góc Asc / MC & Cảnh báo Mặt Trăng đổi cung khi khuyết giờ sinh
    truc_luan = None
    if natal["truc"]:
        asc_c = natal["truc"]["asc"]["cung"]
        mc_c = natal["truc"]["mc"]["cung"]
        truc_luan = {
            "asc": {
                **natal["truc"]["asc"],
                "cung_ten": kb_ht["cung_hoang_dao"][asc_c]["ten"],
                "dien_giai": kb_nha["truc_goc"]["asc"][asc_c],
            },
            "mc": {
                **natal["truc"]["mc"],
                "cung_ten": kb_ht["cung_hoang_dao"][mc_c]["ten"],
                "dien_giai": kb_nha["truc_goc"]["mc"][mc_c],
            },
        }

    ghi_chu_mat_trang = None
    bd_mt = natal.get("mat_trang_bien_do_ngay")
    if bd_mt:
        c0 = kb_ht["cung_hoang_dao"][bd_mt["cung_00h"]]["ten"]
        c1 = kb_ht["cung_hoang_dao"][bd_mt["cung_24h"]]["ten"]
        if bd_mt["doi_cung_trong_ngay"]:
            ghi_chu_mat_trang = kb_ht["loi"]["mat_trang_doi_cung"].format(
                c0=c0, c1=c1, d0=bd_mt["kinh_do_00h"], d1=bd_mt["kinh_do_24h"])
        else:
            ghi_chu_mat_trang = kb_ht["loi"]["mat_trang_mot_cung"].format(
                c0=c0, d0=bd_mt["kinh_do_00h"], d1=bd_mt["kinh_do_24h"])

    # Góc chiếu chính
    ds_goc = []
    for g in natal["goc_chieu"][:14]:
        lg = kb_gc["loai_goc"][g["loai"]]
        ds_goc.append({
            **g,
            "ten_diem_1": _ten_diem(g["diem_1"], kb_ht),
            "ten_diem_2": _ten_diem(g["diem_2"], kb_ht),
            "ten_loai": lg["ten"],
            "tinh_chat": lg["tinh_chat"],
            "cach_doc": lg["cach_doc"],
        })

    # Vận hạn (Saturn Return, Jupiter Return, Solar Return & Transit)
    sr_gd = transit["saturn_return"]["giai_doan"]
    sr_kb = kb_vh["saturn_return"][sr_gd]
    jr_dang = transit["jupiter_return"]["dang_trong_chu_ky"]
    van_han = {
        "ngay_xem": transit["ngay_xem"],
        "tuoi_nam": transit["tuoi_nam"],
        "saturn_return": {
            **transit["saturn_return"],
            "ten": sr_kb["ten"],
            "y_nghia": sr_kb["y_nghia"],
            "viec_nen_lam": sr_kb["viec_nen_lam"],
        },
        "jupiter_return": {
            **transit["jupiter_return"],
            "dien_giai": kb_vh["jupiter_return"]["dang_trong" if jr_dang else "binh_thuong"],
        },
        "solar_return": {
            **transit["solar_return"],
            "giai_thich": kb_vh["solar_return"]["giai_thich"],
        },
        "transit_noi_bat": [
            {
                **t,
                "ten_transit": _ten_diem(t["transit"], kb_ht),
                "ten_natal": _ten_diem(t["natal"], kb_ht),
                "ten_loai": kb_gc["loai_goc"][t["loai"]]["ten"],
                "cach_doc": kb_gc["loai_goc"][t["loai"]]["cach_doc"],
            }
            for t in transit["goc_chieu_transit"][:8]
        ],
    }

    cau_noi = (
        _cau_noi_dong_tay(ngay_sinh, gio_sinh, gioi_tinh, natal, transit, kb_ht, noi_sinh=noi_sinh, vung_vn=vung_vn)
        if kem_cau_noi_dong_tay
        else None
    )

    return {
        "mo_dun": "chiem_tinh",
        "phuong_phap_lich": kb_ht["loi"]["phuong_phap_lich"],
        "dau_vao": natal["dau_vao_da_chuan"],
        "co_gio_sinh": natal["co_gio_sinh"],
        "he_nha": {
            "ma": natal["he_nha"],
            **kb_nha["he_nha"][natal["he_nha"]],
            "canh_bao_vi_do_cao": natal["canh_bao_vi_do_cao"],
        },
        "truc": truc_luan,
        "nha": (
            [
                {
                    **n,
                    "cung_ten": kb_ht["cung_hoang_dao"][n["cung"]]["ten"],
                    "cung_ky_hieu": kb_ht["cung_hoang_dao"][n["cung"]]["ky_hieu"],
                    "ten_nha": kb_nha["nha"][str(n["so"])]["ten"],
                }
                for n in natal["nha"]
            ]
            if natal["nha"]
            else None
        ),
        "ghi_chu_mat_trang": ghi_chu_mat_trang,
        "hanh_tinh": ds_hanh_tinh,
        "goc_chieu": ds_goc,
        "phan_bo_nguyen_to": natal["phan_bo_nguyen_to"],
        "phan_bo_pham_chat": natal["phan_bo_pham_chat"],
        "van_han": van_han,
        "cau_noi_dong_tay": cau_noi,
    }


def _vi_tri_sinh(p: dict) -> dict:
    """Chuyển nguyên các trường giờ / nơi sinh có trong yêu cầu (calc tự báo `LoiNoiSinh` khi nơi lạ → API 422)."""
    kw = {k: p[k] for k in ("gio_sinh", "noi_sinh", "vi_do", "kinh_do", "utc_lech") if p.get(k) is not None}
    if p.get("vung_vn"):
        kw["vung_vn"] = p["vung_vn"]
    return kw


def doc_hop_doi_synastry(
    *,
    nguoi_a: dict,
    nguoi_b: dict,
    ngay_xem: dt.date | None = None,
) -> dict:
    hn = ngay_xem or config.hom_nay_vn()
    for p in (nguoi_a, nguoi_b):
        ns = p["ngay_sinh"]
        tuoi = hn.year - ns.year - ((hn.month, hn.day) < (ns.month, ns.day))
        if tuoi < config.TUOI_NGUOI_LON:
            raise ValueError("Cả hai người cần đủ 16 tuổi trở lên.")

    kb_ht = _kb_ht()
    kb_gc = _kb_gc()
    kb_hd = _kb_hd()

    na = ctn.lap_ban_do_natal(ngay_sinh=nguoi_a["ngay_sinh"], **_vi_tri_sinh(nguoi_a))
    nb = ctn.lap_ban_do_natal(ngay_sinh=nguoi_b["ngay_sinh"], **_vi_tri_sinh(nguoi_b))
    syn = cts.tinh_synastry(na, nb)

    chieu_da_co: dict[str, list[dict]] = {}
    for g in syn["goc_cheo"]:
        lg = kb_gc["loai_goc"][g["loai"]]
        item = {
            "nguoi_a": _ten_diem(g["nguoi_a"], kb_ht),
            "nguoi_b": _ten_diem(g["nguoi_b"], kb_ht),
            "ten_loai": lg["ten"],
            "sai_so": g["sai_so"],
            "tinh_chat": lg["tinh_chat"],
            "cach_doc": lg["cach_doc"],
        }
        chieu_da_co.setdefault(g["chieu"], []).append(item)

    cac_chieu = []
    for ma_c, meta_c in kb_hd["chieu_tuong_tac"].items():
        cac_chieu.append({
            "ma": ma_c,
            "ten": meta_c["ten"],
            "goi_y_ung_xu": meta_c["goi_y"],
            "goc_chieu": chieu_da_co.get(ma_c, [])[:4],
        })

    return {
        "mo_dun": "chiem_tinh_hop_doi",
        "khong_cham_diem": True,
        "ranh_gioi": kb_hd["ranh_gioi"],
        "cac_chieu_tuong_tac": cac_chieu,
    }
