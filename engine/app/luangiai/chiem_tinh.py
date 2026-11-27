# -*- coding: utf-8 -*-
"""Chặng 4.2 & Chặng 5 — Tầng RULES Chiêm tinh phương Tây & Cầu nối Đông – Tây (`engine/app/luangiai/chiem_tinh.py`).

Đọc bản đồ sao Natal, Phẩm giá Ptolemy, Ma trận Nguyên tố × Phẩm chất, Vận hạn Bi-Wheel / Chu kỳ Đời, Synastry và
Composite Midpoint từ 6 tệp KB song ngữ (`chiem_tinh_*_kb.json` + `astro_east_west_bridge_kb.json`).
Tuân thủ nghiêm ngặt:
  - Cổng `TUOI-16` (< 16 tuổi → chuyển hướng lịch sự, không luận vận hạn/tình cảm).
  - Cầu nối Đông – Tây đọc riêng từng hệ toạ độ (`Bát tự` & `Tử vi` chỉ đọc chỉ số công khai miễn phí, không lộ chương khoá
    `SAO-2`, không quy đồng 5 Hành = 4 Nguyên tố, không gộp điểm `CD-1`).
  - Synastry & Composite bắt buộc có xác nhận đồng ý tự nguyện và không in lại ngày/giờ sinh của đối tác ra đầu ra.
"""
from __future__ import annotations

import datetime as dt
import unicodedata

from app import config, ngon_ngu
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
_NGUYEN_TO_CUNG = {
    "bach_duong": "lua", "su_tu": "lua", "nhan_ma": "lua",
    "kim_nguu": "dat", "xu_nu": "dat", "ma_ket": "dat",
    "song_tu": "khi", "thien_binh": "khi", "bao_binh": "khi",
    "cu_giai": "nuoc", "bo_cap": "nuoc", "song_ngu": "nuoc",
}


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
    """Cùng tiền xử lý thời gian với lá số Tử vi / Bát tự (`tuvi_api._DauVao`: múi giờ lịch sử, nơi sinh, âm lịch Việt)."""
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
    """Chính tinh cung Mệnh Tử vi — đúng đường an sao của lá số Tử vi (iztro, âm lịch Việt, giờ theo `time_index`)."""
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
    else:
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


def _dinh_dang_goc(ds_raw: list[dict], kb_ht: dict, kb_gc: dict) -> list[dict]:
    out: list[dict] = []
    for g in ds_raw:
        lg = kb_gc["loai_goc"][g["loai"]]
        out.append({
            **g,
            "ten_diem_1": _ten_diem(g["diem_1"], kb_ht),
            "ten_diem_2": _ten_diem(g["diem_2"], kb_ht),
            "ten_loai": lg["ten"],
            "tinh_chat": lg["tinh_chat"],
            "cach_doc": lg["cach_doc"],
        })
    return out


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
    bang_pg_kb = kb_ht.get("pham_gia_ptolemy", {}).get("muc", {})

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

    # Diễn giải 13 điểm thiên văn kèm Phẩm giá Ptolemy (chỉ 7 hành tinh cổ điển)
    ds_hanh_tinh = []
    for ma in ctl.HANH_TINH_THU_TU:
        p = natal["thien_the"][ma]
        ht_meta = kb_ht["hanh_tinh"][ma]
        c_meta = kb_ht["cung_hoang_dao"][p["cung"]]
        loi_cung = ht_meta["theo_cung"][p["cung"]]
        nha_so = p["nha"]
        loi_nha = kb_nha["nha"][str(nha_so)]["y_chinh"] if nha_so else None
        pg_ma = p.get("pham_gia_ma")
        pg_obj = (
            {"ma": pg_ma, "ten": bang_pg_kb[pg_ma]["ten"], "giai_thich": bang_pg_kb[pg_ma]["giai_thich"]}
            if pg_ma and pg_ma in bang_pg_kb
            else None
        )
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
            "pham_gia": pg_obj,
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

    # Góc chiếu chính (top 14 nổi bật + toàn bộ góc chiếu cho Ma trận 13×13)
    tat_ca_goc = _dinh_dang_goc(natal["goc_chieu"], kb_ht, kb_gc)
    ds_goc = tat_ca_goc[:14]

    # Ma trận Nguyên tố × Phẩm chất đã dịch tên cung & hành tinh
    ma_tran_nt_pc_ui = []
    for nt in ("lua", "dat", "khi", "nuoc"):
        hang = []
        for pc in ("thong_linh", "kien_dinh", "linh_hoat"):
            o = natal["ma_tran_nguyen_to_pham_chat"][nt][pc]
            c_meta = kb_ht["cung_hoang_dao"][o["cung"]]
            hang.append({
                "nguyen_to": nt,
                "pham_chat": pc,
                "cung_ma": o["cung"],
                "cung_ten": c_meta["ten"],
                "cung_ky_hieu": c_meta["ky_hieu"],
                "hanh_tinh": [
                    {"ma": m, "ten": kb_ht["hanh_tinh"][m]["ten"], "ky_hieu": kb_ht["hanh_tinh"][m]["ky_hieu"]}
                    for m in o["hanh_tinh"]
                ],
            })
        ma_tran_nt_pc_ui.append(hang)

    # 13 điểm Transit lưu niên cho vòng ngoài Bi-Wheel & Cột mốc Chu kỳ Đời
    ds_ht_transit = []
    for ma in ctl.HANH_TINH_THU_TU:
        pt = transit["thien_the_transit"][ma]
        ht_meta = kb_ht["hanh_tinh"][ma]
        c_meta = kb_ht["cung_hoang_dao"][pt["cung"]]
        ds_ht_transit.append({
            "ma": ma,
            "ten": ht_meta["ten"],
            "ky_hieu": ht_meta["ky_hieu"],
            "cung_ma": pt["cung"],
            "cung_ten": c_meta["ten"],
            "cung_ky_hieu": c_meta["ky_hieu"],
            "do_cung": pt["do_cung"],
            "kinh_do": pt["kinh_do"],
            "nghich_hanh": pt["nghich_hanh"],
        })

    kb_moc = kb_vh.get("moc_chu_ky_doi", {})
    moc_doi = [
        {
            **m,
            "ten": kb_moc.get(m["ma"], {}).get("ten", m["ma"]),
            "y_nghia": kb_moc.get(m["ma"], {}).get("y_nghia", ""),
            "ky_hieu": kb_ht["hanh_tinh"][m["hanh_tinh"]]["ky_hieu"],
        }
        for m in transit.get("moc_chu_ky_doi", [])
    ]

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
                "tinh_chat": kb_gc["loai_goc"][t["loai"]]["tinh_chat"],
                "cach_doc": kb_gc["loai_goc"][t["loai"]]["cach_doc"],
            }
            for t in transit["goc_chieu_transit"][:12]
        ],
        "hanh_tinh_transit": ds_ht_transit,
        "moc_chu_ky_doi": moc_doi,
    }

    cau_noi = (
        _cau_noi_dong_tay(ngay_sinh, gio_sinh, gioi_tinh, natal, transit, kb_ht, noi_sinh=noi_sinh, vung_vn=vung_vn)
        if kem_cau_noi_dong_tay
        else None
    )

    dau_vao_out = dict(natal["dau_vao_da_chuan"])
    if not ngon_ngu.la_viet() and dau_vao_out.get("ten_noi"):
        tn = str(dau_vao_out["ten_noi"])
        if tn in ("TP. Hồ Chí Minh", "Thành phố Hồ Chí Minh"):
            dau_vao_out["ten_noi"] = "Ho Chi Minh City"
        else:
            tn_nfd = unicodedata.normalize("NFD", tn.replace("đ", "d").replace("Đ", "D"))
            dau_vao_out["ten_noi"] = "".join(ch for ch in tn_nfd if unicodedata.category(ch) != "Mn")

    return {
        "mo_dun": "chiem_tinh",
        "phuong_phap_lich": kb_ht["loi"]["phuong_phap_lich"],
        "nguon_pham_gia": kb_ht.get("pham_gia_ptolemy", {}).get("nguon_tham_chieu"),
        "dau_vao": dau_vao_out,
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
        "tat_ca_goc_chieu": tat_ca_goc,
        "phan_bo_nguyen_to": natal["phan_bo_nguyen_to"],
        "phan_bo_pham_chat": natal["phan_bo_pham_chat"],
        "ma_tran_nguyen_to_pham_chat": ma_tran_nt_pc_ui,
        "van_han": van_han,
        "cau_noi_dong_tay": cau_noi,
    }


def _vi_tri_sinh(p: dict) -> dict:
    """Chuyển nguyên các trường giờ / nơi sinh có trong yêu cầu (calc tự báo `LoiNoiSinh` khi nơi lạ → API 422)."""
    kw = {k: p[k] for k in ("gio_sinh", "noi_sinh", "vi_do", "kinh_do", "utc_lech") if p.get(k) is not None}
    if p.get("vung_vn"):
        kw["vung_vn"] = p["vung_vn"]
    return kw


def _rut_gon_vong_sao(natal: dict, kb_ht: dict) -> list[dict]:
    """Trích toạ độ hoàng đạo của 10 hành tinh cho biểu đồ vòng Synastry — tuyệt đối không đính kèm ngày/giờ sinh."""
    out = []
    for ma in ctl.HANH_TINH_THU_TU[:10]:
        p = natal["thien_the"][ma]
        ht_meta = kb_ht["hanh_tinh"][ma]
        c_meta = kb_ht["cung_hoang_dao"][p["cung"]]
        out.append({
            "ma": ma,
            "ten": ht_meta["ten"],
            "ky_hieu": ht_meta["ky_hieu"],
            "cung_ma": p["cung"],
            "cung_ten": c_meta["ten"],
            "cung_ky_hieu": c_meta["ky_hieu"],
            "do_cung": p["do_cung"],
            "kinh_do": p["kinh_do"],
            "nghich_hanh": p["nghich_hanh"],
        })
    return out


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
    kb_nha = _kb_nha()
    kb_gc = _kb_gc()
    kb_hd = _kb_hd()

    na = ctn.lap_ban_do_natal(ngay_sinh=nguoi_a["ngay_sinh"], **_vi_tri_sinh(nguoi_a))
    nb = ctn.lap_ban_do_natal(ngay_sinh=nguoi_b["ngay_sinh"], **_vi_tri_sinh(nguoi_b))
    syn = cts.tinh_synastry(na, nb)
    comp = cts.tinh_composite(na, nb)

    chieu_da_co: dict[str, list[dict]] = {}
    goc_cheo_ui: list[dict] = []
    for g in syn["goc_cheo"]:
        lg = kb_gc["loai_goc"][g["loai"]]
        item = {
            "ma_a": g["nguoi_a"],
            "ma_b": g["nguoi_b"],
            "nguoi_a": _ten_diem(g["nguoi_a"], kb_ht),
            "nguoi_b": _ten_diem(g["nguoi_b"], kb_ht),
            "loai": g["loai"],
            "ten_loai": lg["ten"],
            "sai_so": g["sai_so"],
            "tinh_chat": lg["tinh_chat"],
            "cach_doc": lg["cach_doc"],
        }
        goc_cheo_ui.append(item)
        chieu_da_co.setdefault(g["chieu"], []).append(item)

    cac_chieu = []
    for ma_c, meta_c in kb_hd["chieu_tuong_tac"].items():
        cac_chieu.append({
            "ma": ma_c,
            "ten": meta_c["ten"],
            "goi_y_ung_xu": meta_c["goi_y"],
            "goc_chieu": chieu_da_co.get(ma_c, [])[:4],
        })

    # Diễn giải bản đồ điểm giữa (Composite Midpoint Chart)
    comp_kb = kb_hd.get("composite", {})
    ds_comp_ht = []
    for ma, p in comp["thien_the"].items():
        ht_meta = kb_ht["hanh_tinh"][ma]
        c_meta = kb_ht["cung_hoang_dao"][p["cung"]]
        ds_comp_ht.append({
            "ma": ma,
            "ten": ht_meta["ten"],
            "ky_hieu": ht_meta["ky_hieu"],
            "cung_ma": p["cung"],
            "cung_ten": c_meta["ten"],
            "cung_ky_hieu": c_meta["ky_hieu"],
            "do_cung": p["do_cung"],
            "kinh_do": p["kinh_do"],
            "nghich_hanh": False,
            "nha": p["nha"],
        })

    truc_comp_ui = None
    if comp["truc"]:
        ac = comp["truc"]["asc"]["cung"]
        mc = comp["truc"]["mc"]["cung"]
        truc_comp_ui = {
            "asc": {**comp["truc"]["asc"], "cung_ten": kb_ht["cung_hoang_dao"][ac]["ten"]},
            "mc": {**comp["truc"]["mc"], "cung_ten": kb_ht["cung_hoang_dao"][mc]["ten"]},
        }

    nt_sun_comp = _NGUYEN_TO_CUNG[comp["thien_the"]["mat_troi"]["cung"]]
    ban_do_composite = {
        "khong_cham_diem": True,
        "co_du_gio_hai_nguoi": comp["co_du_gio_hai_nguoi"],
        "mat_trang_khuyet_gio": comp["mat_trang_khuyet_gio"],
        "gioi_thieu": comp_kb.get("gioi_thieu", ""),
        "luu_y_khuyet_gio": comp_kb.get("luu_y_khuyet_gio") if comp["mat_trang_khuyet_gio"] else None,
        "sac_thai_mat_troi_chung": comp_kb.get("theo_nguyen_to_mat_troi", {}).get(nt_sun_comp, ""),
        "truc": truc_comp_ui,
        "nha": (
            [
                {
                    **n,
                    "cung_ten": kb_ht["cung_hoang_dao"][n["cung"]]["ten"],
                    "cung_ky_hieu": kb_ht["cung_hoang_dao"][n["cung"]]["ky_hieu"],
                    "ten_nha": kb_nha["nha"][str(n["so"])]["ten"],
                }
                for n in comp["nha"]
            ]
            if comp["nha"]
            else None
        ),
        "hanh_tinh": ds_comp_ht,
        "goc_chieu": _dinh_dang_goc(comp["goc_chieu"], kb_ht, kb_gc),
    }

    return {
        "mo_dun": "chiem_tinh_hop_doi",
        "khong_cham_diem": True,
        "ranh_gioi": kb_hd["ranh_gioi"],
        "cac_chieu_tuong_tac": cac_chieu,
        "vong_synastry": {
            "hanh_tinh_a": _rut_gon_vong_sao(na, kb_ht),
            "hanh_tinh_b": _rut_gon_vong_sao(nb, kb_ht),
            "goc_cheo": goc_cheo_ui,
        },
        "ban_do_composite": ban_do_composite,
    }
