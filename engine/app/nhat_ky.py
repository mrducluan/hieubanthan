# -*- coding: utf-8 -*-
"""Nhật ký hỏi đáp (thần số + Huyền học) — nguyên liệu cho vòng tự cải thiện.

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


def _gui(bang: str, du_lieu: dict) -> None:
    url, key = os.environ["SUPABASE_URL"].rstrip("/"), os.environ["SUPABASE_ANON_KEY"]
    try:
        httpx.post(f"{url}/rest/v1/{bang}", timeout=5,
                   headers={"apikey": key, "Authorization": f"Bearer {key}",
                            "Content-Type": "application/json", "Prefer": "return=minimal"},
                   json=du_lieu)
    except Exception:  # noqa: BLE001 — nhật ký không được làm hỏng Q&A
        pass


def ghi(cau_hoi: str, kq: dict) -> None:
    if bat():
        _gui("thanso_hoi_nhat_ky", ban_ghi(cau_hoi, kq))


# --------------------------------------------------------------------------- #
# Huyền học (bảng huyenhoc_hoi_nhat_ky, migration 0005)
# --------------------------------------------------------------------------- #
_NAM = re.compile(r"(?<!\d)(18|19|20)\d\d(?!\d)")
_GIO = re.compile(r"(?<!\d)\d{1,2}\s*(?:h|giờ|:)\s*\d{0,2}(?!\d)")


def loc_cau_hoi_huyenhoc(s: str) -> str:
    """Như loc_cau_hoi, thêm lọc năm (sinh năm 1990) và giờ (9 giờ, 23:30)."""
    return _GIO.sub("[giờ]", _NAM.sub("[năm]", loc_cau_hoi(s)))


# Khối bằng chứng suy ra từ ngày giờ sinh (kể cả năm sinh nêu trong câu hỏi).
KHOI_TU_SINH = {"menh_quai", "tuoi_lam_nha", "tu_tru", "khoi_van", "dai_van", "luu_nien", "cac_dai_van",
                "tuoi", "han", "than_cu", "ngu_hanh", "dung_than", "tru", "tang_can", "vo_chong"}


def ban_ghi_huyenhoc(mo_dun: str, cau_hoi: str, kq: dict, co_du_lieu_sinh: bool) -> dict:
    goi, pl = kq["bang_chung"], kq["phan_loai"]
    co_du_lieu_sinh = co_du_lieu_sinh or any(m["loai"] in KHOI_TU_SINH for m in goi["muc"])
    return {
        "mo_dun": mo_dun,
        "cau_hoi_da_loc": loc_cau_hoi_huyenhoc(cau_hoi)[:400],
        "loai": pl.get("loai") or "khac",
        "xu_ly": pl.get("xu_ly") or "tra_loi",
        "che_do": pl.get("che_do"),
        "do_phu": kq["do_phu"],
        "co_du_lieu_sinh": co_du_lieu_sinh,
        "khoi": sorted({m["loai"] for m in goi["muc"]}),
        "can_them": kq["can_them"],
        "loi_kiem_tra": kq["loi_kiem_tra"],
        # Lá số / tứ trụ / mệnh quái suy ngược được ngày giờ sinh → không lưu câu trả lời.
        "cau_tra_loi": None if co_du_lieu_sinh else kq["cau_tra_loi"][:4000],
        "engine_version": ENGINE_VERSION,
    }


def ghi_huyenhoc(mo_dun: str, cau_hoi: str, kq: dict, co_du_lieu_sinh: bool) -> None:
    if bat():
        _gui("huyenhoc_hoi_nhat_ky", ban_ghi_huyenhoc(mo_dun, cau_hoi, kq, co_du_lieu_sinh))
