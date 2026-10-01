# -*- coding: utf-8 -*-
"""LG — Luận giải toàn bộ (RULES): ghép báo cáo theo chương từ CHÍNH các đường hỏi đáp đã có.

Mỗi chương = một câu hỏi chuẩn chạy qua hoidap (cùng phân loại, cùng KB, cùng bộ lọc khủng hoảng /
ngày chết / bệnh / xổ số). Đoạn trùng giữa các chương bị bỏ; lời kết (hoi_van.KET) chỉ đặt một lần.
Không lưu báo cáo (quy tắc: không lưu luận giải gắn user_id). Phí: miễn phí 2 tháng thử nghiệm
(chủ dự án chốt 2026-10-01) — sau đó tầng web trừ Sao, engine chỉ báo mức phí.
"""
from __future__ import annotations

import datetime as dt

from app.hoidap import battu as hd_battu, tuvi as hd_tuvi
from app.narrative import hoi_van

PHI = {"sao": 0, "ly_do": "mien_phi_thu_nghiem"}

CHUONG_TUVI = [
    ("tong_quan", "Tổng quan bản mệnh", "Cung Mệnh của tôi nói gì về tính cách?"),
    ("su_nghiep", "Sự nghiệp", "Cung Quan Lộc của tôi nói gì về sự nghiệp?"),
    ("tien_bac", "Tiền bạc", "Cung Tài Bạch của tôi nói gì về tiền bạc?"),
    ("tinh_cam", "Tình cảm, hôn nhân", "Cung Phu Thê của tôi thế nào?"),
    ("gia_dinh", "Cha mẹ, con cái", "Cung Phụ Mẫu của tôi thế nào?"),
    ("con_cai", "Con cái, người kế tiếp", "Cung Tử Nữ của tôi thế nào?"),
    ("tinh_than", "Đời sống tinh thần, phúc đức", "Cung Phúc Đức của tôi thế nào?"),
    ("van_han", "Vận hạn hiện tại", "Đại hạn hiện tại của tôi là chủ đề gì?"),
]
CHUONG_BATTU = [
    ("tong_quan", "Nhật chủ và tính cách", "Nhật chủ của tôi là người thế nào?"),
    ("ngu_hanh", "Ngũ hành, thân vượng nhược, dụng thần", "Dụng thần của tôi là gì?"),
    ("su_nghiep", "Sự nghiệp, tiền bạc qua thập thần", "Thập thần trong lá số của tôi nói gì về sự nghiệp?"),
    ("van", "Đại vận và năm nay", "Đại vận hiện tại của tôi là gì?"),
]


def _ghep(mo_dun: str, chuong: list[tuple[str, str, str]], hoi) -> dict:
    da_co: set[str] = {hoi_van.KET}
    ds = []
    for ma, tieu_de, cau in chuong:
        kq = hoi(cau)
        doan = []
        for d in (x.strip() for x in kq["cau_tra_loi"].split("\n\n")):
            if d and d not in da_co:
                da_co.add(d)
                doan.append(d)
        ds.append({"ma": ma, "tieu_de": tieu_de, "cau_hoi": cau, "doan": doan})
    return {"mo_dun": mo_dun, "chuong": ds, "ket": hoi_van.KET, "trang_thai": "nhap_ai", "phi": PHI}


def tuvi(sinh: dict, ngay_xem: dt.date | None = None) -> dict:
    return _ghep("tuvi", CHUONG_TUVI, lambda c: hd_tuvi.tra_loi(c, "chi_tiet", sinh=sinh, ngay_xem=ngay_xem))


def battu(sinh: dict, ngay_xem: dt.date | None = None) -> dict:
    return _ghep("battu", CHUONG_BATTU, lambda c: hd_battu.tra_loi(c, sinh=sinh, ngay_xem=ngay_xem))
