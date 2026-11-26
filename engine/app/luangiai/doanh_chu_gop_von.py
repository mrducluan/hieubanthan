# -*- coding: utf-8 -*-
"""Chặng 2 — Soi bù khuyết Hội đồng Sáng lập / Đối tác Góp vốn (`POST /v1/doanh-chu/gop-von`).

Tất định 100%: đọc Tam Trụ (khi thiếu giờ sinh) hoặc Tứ Trụ (khi có giờ sinh), Mệnh quái Bát trạch và Năm cá nhân
của 2–4 người sáng lập để phân định 3 làn cốt tử:
  - `mo_thi_truong` (Mộc / Hỏa trội)
  - `kiem_soat_tai_chinh` (Kim / Thủy trội)
  - `van_hanh_hau_can` (Thổ trội)
Chỉ ra lỗ hổng hội đồng và sinh 3–4 nguyên tắc điều lệ rào chắn sát đúng tổ hợp thực tế. Không chấm điểm tốt/xấu,
không lưu dữ liệu cá nhân.
"""
from __future__ import annotations

import datetime as dt

from app.calc import battu as bt_calc, phongthuy as pt, thanso
from app.kb import nap, ten as ten_kb
from app.kb.loi import danh_sach

_TEP = "doanh_chu_gop_von_kb.json"
_HANH_CHUAN = {"Kim": "Kim", "Mộc": "Mộc", "Thủy": "Thủy", "Thuỷ": "Thủy", "Hỏa": "Hỏa", "Hoả": "Hỏa", "Thổ": "Thổ"}
_HANH_SANG_LANE = {
    "Mộc": "mo_thi_truong",
    "Hỏa": "mo_thi_truong",
    "Kim": "kiem_soat_tai_chinh",
    "Thủy": "kiem_soat_tai_chinh",
    "Thổ": "van_hanh_hau_can",
}


def _kb() -> dict:
    return nap.doc(_TEP)


def _norm_h(h: str) -> str:
    return _HANH_CHUAN.get(h, h)


def phan_tich_gop_von(sang_lap: list[dict], nganh: str = "dich_vu", nam_xem: int = 2026) -> dict:
    k = _kb()
    tong_diem = {"Kim": 0.0, "Mộc": 0.0, "Thủy": 0.0, "Hỏa": 0.0, "Thổ": 0.0}
    ds_tv = []
    lane_co: set[str] = set()

    for idx, tv in enumerate(sang_lap, start=1):
        ngay, thang, nam = int(tv["ngay"]), int(tv["thang"]), int(tv["nam"])
        gt = tv.get("gioi_tinh") or "nam"
        gio = tv.get("gio")
        co_gio = bool(gio)
        if co_gio:
            hh, mm = (int(x) for x in str(gio).split(":"))
            lich = dt.datetime(nam, thang, ngay, hh, mm)
        else:
            lich = dt.datetime(nam, thang, ngay, 12, 0)
        ls = bt_calc.la_so(lich, gioi_tinh=gt, co_gio=co_gio)
        diem_raw = ls["ngu_hanh"]["diem"]
        diem_norm = {_norm_h(hk): float(v) for hk, v in diem_raw.items()}
        for hk, v in diem_norm.items():
            tong_diem[hk] += v

        sx_tv = sorted(diem_norm.items(), key=lambda kv: kv[1], reverse=True)
        hanh_troi = sx_tv[0][0]
        lane = _HANH_SANG_LANE[hanh_troi]
        # Nếu làn chính đã có người mạnh hơn đảm nhận mà hành đứng thứ 2 của người này thuộc làn chưa ai giữ (và đạt ≥ 75% hành đầu),
        # gợi ý đảm nhận làn bổ trợ để hội đồng tự động bù khuyết sát năng lực thật.
        if lane in lane_co and len(sx_tv) > 1 and sx_tv[1][1] >= sx_tv[0][1] * 0.75:
            lane_phu = _HANH_SANG_LANE[sx_tv[1][0]]
            if lane_phu not in lane_co:
                lane = lane_phu
        lane_co.add(lane)
        mq = pt.menh_quai(nam, gt, dt.date(nam, thang, ngay))
        ncn = int(thanso.nam_ca_nhan(ngay, thang, nam_xem, "duong_lich"))
        can_ngay = ls["nhat_chu"]["can"]
        nhat_chu_str = f"{ten_kb.ten('can', can_ngay)} ({ten_kb.ten('hanh', _norm_h(ls['nhat_chu']['ngu_hanh']))})"
        lane_info = k["lane"][lane]
        ten_hien = (tv.get("ten") or "").strip() or f"Co-founder #{idx}"

        ds_tv.append({
            "ten": ten_hien,
            "nhat_chu": nhat_chu_str,
            "co_gio": co_gio,
            "menh_quai": ten_kb.ten("quai", mq["quai"]),
            "nam_ca_nhan": ncn,
            "lane_chinh": lane,
            "vai_tro_tu_nhien": lane_info["ten"],
            "diem_manh_gop_von": lane_info["diem_manh"],
            "diem_mu_can_rao": lane_info["diem_mu"],
        })

    tat_ca_lane = ("mo_thi_truong", "kiem_soat_tai_chinh", "van_hanh_hau_can")
    lane_thieu = [ln for ln in tat_ca_lane if ln not in lane_co]
    lo_hong = [k["lo_hong_theo_lane"][ln] for ln in lane_thieu]

    sx_hanh = sorted(tong_diem.items(), key=lambda kv: kv[1], reverse=True)
    hanh_manh = [ten_kb.ten("hanh", h) for h, _ in sx_hanh[:2]]
    hanh_khuyet = [ten_kb.ten("hanh", h) for h, v in sx_hanh if v <= sx_hanh[0][1] * 0.35] or [ten_kb.ten("hanh", sx_hanh[-1][0])]

    trang_thai = "can_doi" if not lane_thieu else "thien_lech"
    ten_khuyet = danh_sach([k["lane"][ln]["ten"].lower() for ln in lane_thieu]) if lane_thieu else ""
    tom_tat = k["tom_tat_hoi_dong"][trang_thai].format(khuyet=ten_khuyet)

    dieu_le = [dict(x) for x in k["dieu_le_mac_dinh"]]
    bo_sung = k.get("dieu_le_bo_sung") or {}
    ty_le = [tv.get("ty_le_du_kien") for tv in sang_lap if tv.get("ty_le_du_kien") is not None]
    if len(sang_lap) == 2 and (not ty_le or ty_le == [50, 50] or ty_le == [50.0, 50.0]):
        if "ty_le_50_50" in bo_sung:
            dieu_le.append(dict(bo_sung["ty_le_50_50"]))
    elif "kiem_soat_tai_chinh" in lane_thieu and "cung_nong_mo_rong" in bo_sung:
        dieu_le.append(dict(bo_sung["cung_nong_mo_rong"]))

    return {
        "nganh": nganh,
        "nam_xem": nam_xem,
        "tong_quan_hoi_dong": {
            "trang_thai_bu_khuyet": trang_thai,
            "nhan": k["nhan_hoi_dong"][trang_thai],
            "tom_tat": tom_tat,
            "hanh_manh": hanh_manh,
            "hanh_khuyet": hanh_khuyet,
        },
        "phan_vai_sang_lap": ds_tv,
        "lo_hong_hoi_dong": lo_hong,
        "dieu_le_rao_chan": dieu_le,
    }
