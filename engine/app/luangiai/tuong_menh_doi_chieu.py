# -*- coding: utf-8 -*-
"""Chặng 3.2 — Đối chiếu Nhịp Năm Lá Số & Dấu hiệu Tướng – Chỉ tay Đông–Tây (`POST /v1/nhan-tuong/doi-chieu-menh`).

Ba góc nhìn ĐỌC ĐỘC LẬP (không gộp điểm — CD-1, không chẩn đoán sức khoẻ/tuổi thọ, không bịa màu/giờ theo hành — 6b):
  1. Góc Mệnh năm nay: Nhật chủ Bát tự & khí Ngũ hành năm hiện tại.
  2. Góc Tướng lưu niên (*Thần Tướng Toàn Biên*): bộ vị trên gương mặt ứng với tuổi mụ hiện tại.
  3. Góc Chỉ tay Đông – Tây (*Saint-Germain 1897* & đối chiếu hai bàn tay Tiên thiên / Hậu thiên).
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import battu as bt_calc, lunar
from app.kb import nap, ten as _tn
from app.ngon_ngu import la_viet

_HANH_CHUAN = {"Thuỷ": "Thủy", "Hoả": "Hỏa", "Kim": "Kim", "Mộc": "Mộc", "Thủy": "Thủy", "Hỏa": "Hỏa", "Thổ": "Thổ"}
_CAN_HANH = {
    "Giáp": "Mộc", "Ất": "Mộc", "Bính": "Hỏa", "Đinh": "Hỏa", "Mậu": "Thổ",
    "Kỷ": "Thổ", "Canh": "Kim", "Tân": "Kim", "Nhâm": "Thủy", "Quý": "Thủy",
}
_BO_VI_EN = {
    "tai": "Ear zone",
    "tran": "Forehead zone",
    "an_duong": "Glabella (Between Brows)",
    "may": "Eyebrow zone",
    "mat": "Eye zone",
    "mui": "Nose bridge & tip",
    "go_ma": "Cheekbone zone",
    "nhan_trung": "Philtrum",
    "mieng": "Mouth zone",
    "cam": "Chin & jaw zone",
}
_BEN_HIEN = {
    True: {"trai": "bên trái", "phai": "bên phải", "giua": "chính giữa"},
    False: {"trai": "left side (traditional)", "phai": "right side (traditional)", "giua": "centerline"},
}
MUC_SAINT_GERMAIN = ("ngon_cai", "duong_tri_dao", "duong_su_nghiep", "duong_thai_duong", "tam_giac_tu_giac")


def _kb() -> dict:
    return nap.doc("tuong_menh_doi_chieu_kb.json")


def _nt_kb() -> dict:
    return nap.doc("nhan_tuong_kb.json")


def doi_chieu_tuong_menh(
    *,
    ngay_sinh: dt.date,
    gioi_tinh: str = "nam",
    gio_sinh: str | None = None,
    do_lech_hai_tay: str = "can_doi",
    muc_chi_tay: list[str] | None = None,
    ngay_xem: dt.date | None = None,
) -> dict:
    kb = _kb()
    khung = kb["khung"]
    hn = ngay_xem or config.hom_nay_vn()
    tuoi_tron = hn.year - ngay_sinh.year - ((hn.month, hn.day) < (ngay_sinh.month, ngay_sinh.day))
    if tuoi_tron < config.TUOI_NGUOI_LON:
        return {
            "mo_dun": "tuong_menh_doi_chieu",
            "chuyen_huong_tuoi": {"tuoi": tuoi_tron, "thong_bao": khung["tuoi_nho"]},
            "ranh_gioi": khung["ranh_gioi"],
        }

    # 1. Góc Mệnh năm nay (Bát tự Nhật chủ + khí năm)
    hh, mm = (int(x) for x in gio_sinh.split(":")) if gio_sinh else (12, 0)
    ls = bt_calc.la_so(
        dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, hh, mm),
        gioi_tinh=gioi_tinh,
        co_gio=bool(gio_sinh),
    )
    can_nc = ls["nhat_chu"]["can"]
    hanh_nc = _HANH_CHUAN[ls["nhat_chu"]["ngu_hanh"]]
    can_nam, chi_nam = lunar.can_chi_nam(hn.year)
    hanh_nam = _CAN_HANH[can_nam]

    goc_menh = {
        "nhan": (
            "Góc nhìn 1 · Nhịp năm trên Lá số (Bát tự)"
            if la_viet()
            else "Perspective 1 · Annual Natal Rhythm (BaZi)"
        ),
        "nam_xem": hn.year,
        "can_chi_nam": f"{_tn.ten('can', can_nam)} {_tn.ten('chi', chi_nam)}",
        "nhat_chu": f"{_tn.ten('can', can_nc)} ({_tn.ten('hanh', hanh_nc)})",
        "co_gio_sinh": bool(gio_sinh),
        "loi_nhac_nam": kb["nhip_hanh_nam"][hanh_nam],
    }

    # 2. Góc Tướng lưu niên (Thần Tướng Toàn Biên)
    tuoi_mu = max(16, min(99, hn.year - ngay_sinh.year + 1))
    nt = _nt_kb()
    ln_item = next((x for x in nt.get("luu_nien", []) if x.get("tuoi") == tuoi_mu), None)
    bo_vi_ma = (ln_item or {}).get("bo_vi", "an_duong")
    ben_ma = (ln_item or {}).get("ben") or "giua"
    if la_viet():
        bo_vi_ten = ((nt.get("bo_vi") or {}).get(bo_vi_ma) or {}).get("ten", bo_vi_ma)
        loi_ln = (
            f"Tuổi mụ {tuoi_mu} ứng với bộ vị «{ln_item['ten']}» ({ln_item.get('han', '')}) vùng {bo_vi_ten} ({_BEN_HIEN[True].get(ben_ma, ben_ma)}): "
            "nên giữ sắc diện vùng này sáng thoáng, ngủ đủ giấc và thả lỏng cơ mặt khi làm việc căng thẳng."
            if ln_item
            else f"Tuổi mụ {tuoi_mu}: giữ thần sắc vùng Ấn Đường và ánh mắt thư thái, tránh thức khuya kéo dài."
        )
    else:
        bo_vi_ten = _BO_VI_EN.get(bo_vi_ma, "facial zone")
        loi_ln = (
            f"Traditional age {tuoi_mu} corresponds to classical point ({ln_item.get('han', '')}) at the {bo_vi_ten} ({_BEN_HIEN[False].get(ben_ma, ben_ma)}): "
            "keep posture and facial tension relaxed and protect consistent rest during busy weeks."
            if ln_item
            else f"Traditional age {tuoi_mu}: keep brow and eye tension relaxed through steady sleep routines."
        )

    goc_tuong = {
        "nhan": (
            "Góc nhìn 2 · Bộ vị Lưu niên (Thần Tướng Toàn Biên)"
            if la_viet()
            else "Perspective 2 · Classical Annual Facial Zone (Shen Xiang Quan Bian)"
        ),
        "tuoi_mu": tuoi_mu,
        "bo_vi_ma": bo_vi_ma,
        "bo_vi_ten": bo_vi_ten,
        "han": (ln_item or {}).get("han", ""),
        "loi_quan_sat": loi_ln,
    }

    # 3. Góc Chỉ tay Đông – Tây (Saint-Germain 1897 + hai bàn tay)
    sg_kb = kb["saint_germain_1897"]
    chon_muc = [m for m in (muc_chi_tay or ["ngon_cai", "duong_tri_dao", "duong_su_nghiep"]) if m in sg_kb["muc"]]
    if not chon_muc:
        chon_muc = ["ngon_cai", "duong_tri_dao", "duong_su_nghiep"]
    hai_tay_ma = do_lech_hai_tay if do_lech_hai_tay in kb["hai_tay"] else "can_doi"

    goc_chi_tay = {
        "nhan": (
            "Góc nhìn 3 · Chỉ tay Đông – Tây (Saint-Germain 1897 & Hai bàn tay)"
            if la_viet()
            else "Perspective 3 · East–West Palmistry (Saint-Germain 1897 & Two-Hand Balance)"
        ),
        "sach_co_dien": sg_kb["sach"],
        "hai_tay_nhan_xet": kb["hai_tay"][hai_tay_ma],
        "diem_doi_chieu": [
            {
                "ma": m,
                "ten": sg_kb["muc"][m]["ten"],
                "nguyen_van_en": sg_kb["muc"][m]["nguyen_van_en"],
                "y_ung_dung": sg_kb["muc"][m]["y_ung_dung"],
            }
            for m in chon_muc
        ],
    }

    return {
        "mo_dun": "tuong_menh_doi_chieu",
        "khung": {
            "tieu_de": khung["tieu_de"],
            "phu_de": khung["phu_de"],
            "ranh_gioi": khung["ranh_gioi"],
        },
        "goc_menh_nam_nay": goc_menh,
        "goc_tuong_luu_nien": goc_tuong,
        "goc_chi_tay_dong_tay": goc_chi_tay,
    }
