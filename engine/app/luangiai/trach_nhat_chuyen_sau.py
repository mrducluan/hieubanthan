# -*- coding: utf-8 -*-
"""Chặng 4.3 — Tầng RULES Đối chiếu Trạch Nhật *Hiệp Kỷ Biện Phương Thư* (`luangiai/trach_nhat_chuyen_sau.py`)."""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import trach_nhat_hiep_ky as hk_calc
from app.kb import nap, ten as _tn
from app.ngon_ngu import la_viet


def _kb() -> dict:
    return nap.doc("trach_nhat_hiep_ky_kb.json")


def doi_chieu_hiep_ky(
    *,
    tu_ngay: dt.date | None = None,
    so_ngay: int = 7,
    huong_tu_tao: str | None = None,
) -> dict:
    kb = _kb()
    vi = la_viet()
    bat_dau = tu_ngay or config.hom_nay_vn()
    so_ngay = max(1, min(30, so_ngay))

    ds_ngay = []
    for i in range(so_ngay):
        d = bat_dau + dt.timedelta(days=i)
        raw = hk_calc.phan_tich_ngay_hiep_ky(d, huong_tu_tao=huong_tu_tao)
        nl = kb["ngu_loai_nhat"][raw["ngu_loai_ma"]]
        luu_y: list[str] = []
        if raw["tu_ly_tu_tuyet"] == "tu_ly":
            luu_y.append(
                "Ngày Tứ Ly (trước Xuân phân/Hạ chí/Thu phân/Đông chí 1 ngày): khí mùa phân tách, hợp nghỉ ngơi hơn khởi công lớn."
                if vi
                else "Four Separations eve (1 day before equinox/solstice): seasonal transition suited for rest rather than major launches."
            )
        elif raw["tu_ly_tu_tuyet"] == "tu_tuyet":
            luu_y.append(
                "Ngày Tứ Tuyệt (trước Lập xuân/Lập hạ/Lập thu/Lập đông 1 ngày): giao tiết cuối mùa, nên hoãn động thổ mở mang lớn."
                if vi
                else "Four Extinctions eve (1 day before seasonal start): transitional cusp — defer heavy construction if flexible."
            )

        ta = raw["thap_ac_dai_bai"]
        if ta:
            chi_loc_hien = _tn.ten("chi", ta["chi_loc"])
            if ta["da_dien_thuc"]:
                luu_y.append(
                    f"Lịch dân gian gắn nhãn Thập Ác Đại Bại, nhưng theo Hiệp Kỷ Biện Phương Thư: chi Lộc ({chi_loc_hien}) đã được Năm/Tháng điền thực nên KHÔNG rỗng — dùng bình thường."
                    if vi
                    else f"Folk almanacs label this Ten Great Defeat, yet per Xie Ji Bian Fang Shu the Salary branch ({chi_loc_hien}) is filled by the Year/Month and is NOT void."
                )
            else:
                luu_y.append(
                    f"Lộc ngày ({chi_loc_hien}) tạm rơi Tuần Không (Thập Ác Đại Bại): cân nhắc tránh mở kho xuất vốn lớn, việc thường nhật không kỵ."
                    if vi
                    else f"Day Salary ({chi_loc_hien}) sits in Void: exercise routine care on major capital outlays; everyday tasks are unaffected."
                )

        if raw["duong_cong_ky"]:
            luu_y.append(
                "Trùng ngày Dương Công Kỵ dân gian (Hiệp Kỷ quyển 36 đã biện bác sự thổi phồng; chỉ kiêng nếu gia đình có tập quán giữ lịch cũ)."
                if vi
                else "Coincides with folk Yang Gong taboo (critiqued in Xie Ji Scroll 36 as overstated; observe only if family custom prefers)."
            )

        ts = raw["tam_sat_nam"]
        phuong_ts_hien = _tn.ten("huong", ts["phuong_chinh"])
        if ts["cham_huong_dang_xet"]:
            luu_y.append(
                f"Hướng tu tạo đang xét ({phuong_ts_hien}) trùng phương Tam Sát của năm: tránh khoan đục động thổ mạnh ở phương này nếu chưa chọn giờ cát tinh chế hoá."
                if vi
                else f"Selected construction sector ({phuong_ts_hien}) matches the annual Three Sha direction: avoid heavy earthwork there without auspicious hour mitigation."
            )

        am_hien = raw["am_lich"].replace(" (nhuận)", "" if vi else " (leap)")
        ds_ngay.append({
            "ngay": raw["ngay"],
            "am_lich": am_hien,
            "can_chi_ngay": f"{_tn.ten('can', raw['can_ngay'])} {_tn.ten('chi', raw['chi_ngay'])}",
            "ngu_loai_ma": raw["ngu_loai_ma"],
            "ngu_loai_ten": nl["ten"],
            "ngu_loai_y_nghia": nl["y_nghia"],
            "phuong_tam_sat_nam": phuong_ts_hien,
            "luu_y_hiep_ky": luu_y,
        })

    return {
        "mo_dun": "trach_nhat_hiep_ky",
        "khung": kb["khung"],
        "ngay_phan_tich": ds_ngay,
        "trich_co_thu": list(kb["trich_co_thu"].values()),
    }
