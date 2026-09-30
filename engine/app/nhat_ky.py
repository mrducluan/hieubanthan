# -*- coding: utf-8 -*-
"""Nhật ký hỏi đáp thần số — nguyên liệu cho vòng tự cải thiện.

Quyết định chủ dự án 2026-09-30: lưu câu hỏi ĐÃ LỌC + phân loại + độ phủ + câu
trả lời. KHÔNG lưu user_id, họ tên, ngày sinh của ai. Câu hỏi được lọc ngày
tháng, số điện thoại, email, cụm giống họ tên riêng trước khi ghi.

Bật bằng env NHAT_KY_HOI=1 + SUPABASE_URL + SUPABASE_ANON_KEY (bảng
thanso_hoi_nhat_ky, migration 0004, RLS chỉ cho INSERT). Lỗi ghi không bao giờ
làm hỏng câu trả lời.
"""
from __future__ import annotations

import os
import re

import httpx

from app.config import ENGINE_VERSION

_NGAY = re.compile(r"(?<!\d)\d{1,2}\s*[/\-.]\s*\d{1,2}\s*[/\-.]\s*\d{2,4}(?!\d)")
_DT = re.compile(r"(?<!\d)(\+?84|0)\d{8,10}(?!\d)")
_EMAIL = re.compile(r"\S+@\S+\.\S+")
# 2–4 từ viết hoa liên tiếp KHÔNG ở đầu câu → nghi là họ tên riêng.
_TEN = re.compile(r"(?<=[^\s.?!]\s)((?:[A-ZĐÀ-Ỹ][\wÀ-ỹ]*\s){1,3}[A-ZĐÀ-Ỹ][\wÀ-ỹ]*)")


def loc_cau_hoi(s: str) -> str:
    s = _EMAIL.sub("[email]", s)
    s = _NGAY.sub("[ngày]", s)
    s = _DT.sub("[sđt]", s)
    return _TEN.sub("[tên]", s)


def bat() -> bool:
    return (os.environ.get("NHAT_KY_HOI", "").lower() in ("1", "true")
            and bool(os.environ.get("SUPABASE_URL")) and bool(os.environ.get("SUPABASE_ANON_KEY")))


def ban_ghi(cau_hoi: str, kq: dict) -> dict:
    goi = kq["bang_chung"]
    return {
        "cau_hoi_da_loc": loc_cau_hoi(cau_hoi)[:400],
        "linh_vuc": kq["phan_loai"]["linh_vuc"],
        "y_dinh": kq["phan_loai"]["y_dinh"],
        "doi_tuong": kq["phan_loai"]["doi_tuong"],
        "xu_ly": kq["phan_loai"]["xu_ly"],
        "do_phu": kq["do_phu"],
        "khoi": sorted({m["loai"] for m in goi["muc"]}),
        "can_them": kq["can_them"],
        "che_do": kq["che_do"],
        "loi_kiem_tra": kq["loi_kiem_tra"],
        "cau_tra_loi": kq["cau_tra_loi"][:4000],
        "engine_version": ENGINE_VERSION,
    }


def ghi(cau_hoi: str, kq: dict) -> None:
    if not bat():
        return
    url, key = os.environ["SUPABASE_URL"].rstrip("/"), os.environ["SUPABASE_ANON_KEY"]
    try:
        httpx.post(f"{url}/rest/v1/thanso_hoi_nhat_ky", timeout=5,
                   headers={"apikey": key, "Authorization": f"Bearer {key}",
                            "Content-Type": "application/json", "Prefer": "return=minimal"},
                   json=ban_ghi(cau_hoi, kq))
    except Exception:  # noqa: BLE001 — nhật ký không được làm hỏng Q&A
        pass
