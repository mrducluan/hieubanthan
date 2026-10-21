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
import unicodedata
from functools import lru_cache

import httpx

from app.config import ENGINE_VERSION

_NGAY = re.compile(r"(?<!\d)\d{1,2}\s*[/\-.]\s*\d{1,2}\s*[/\-.]\s*\d{2,4}(?!\d)")
_DT = re.compile(r"(?<!\d)(\+?84|0)\d{8,10}(?!\d)")
_EMAIL = re.compile(r"\S+@\S+\.\S+")
# Chữ HOA Latin thật (gồm chữ Việt có dấu). Dải "À-Ỹ" cũ chứa cả chữ thường có dấu ("ở", "ổn") → lọc nhầm câu thường.
_HOA_CHU = "".join(c for c in map(chr, range(0x41, 0x1EFA))
                   if c.isupper() and unicodedata.name(c, "").startswith("LATIN"))
_HOA = rf"[{re.escape(_HOA_CHU)}]\w*"
# 2–4 từ viết hoa liên tiếp KHÔNG ở đầu câu → nghi là họ tên riêng.
_TEN = re.compile(rf"(?<=[^\s.?!]\s)((?:{_HOA}\s){{1,3}}{_HOA})")
# Tên riêng ngay sau từ khoá: "tên (là) Lan", "tôi / mình / em … là Hùng" — bắt cả tên MỘT chữ.
_TEN_SAU = re.compile(rf"(\b(?:[Tt]ên(?: là|:)?|(?:[Tt]ôi|[Mm]ình|[Ee]m|[Aa]nh|[Cc]hị|[Cc]on|[Cc]háu) là) )"
                      rf"({_HOA}(?: {_HOA}){{0,3}})")
# Liên kết web / mạng xã hội và @tài khoản (sau khi đã thay email).
_LIEN_KET = re.compile(r"(?i)\b(?:https?://)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|vn|net|org|me|io|co|ly|gg)"
                       r"\b\S*|(?<![\w@])@[a-z0-9_.]{3,}")
_THEM_GIU = ("Tử Vi", "Kinh Dịch", "Bát Tự", "Phong Thuỷ", "Thần Số", "Mai Hoa", "Lưu Niên", "Đại Hạn", "Tiểu Hạn",
             "Hoá Lộc", "Hoá Quyền", "Hoá Khoa", "Hoá Kỵ", "Lộc", "Quyền", "Khoa", "Kỵ", "Thân", "Tuần", "Triệt",
             "Vô Chính Diệu", "Lai Nhân", "Bát Trạch", "Huyền Không", "Pitago", "Chaldea", "Can", "Chi")


def _bo_dau(s: str) -> str:
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return s.replace("đ", "d").replace("Đ", "D").lower()


@lru_cache(maxsize=1)
def _thuat_ngu() -> frozenset[str]:
    """Tên sao / cung / quẻ / thập thần (đã bỏ dấu) — viết hoa nhưng KHÔNG phải tên người, không lọc."""
    from app.kb import battu_kb, kinhdich_kb, tuvi_kb  # noqa: PLC0415 — kb không import nhat_ky, chỉ tránh nạp sớm
    ten = [*tuvi_kb.ten_chinh_tinh(), *tuvi_kb.ten_phu_tinh(), *tuvi_kb.ten_cung(), *battu_kb.ten_thap_than(),
           *kinhdich_kb.ten_que().values(), *_THEM_GIU]
    return frozenset(_bo_dau(t) for t in ten)


def _la_thuat_ngu(cum: str, toi_thieu_tu: int = 1) -> bool:
    """Cả cụm ghép trọn từ thuật ngữ đã biết (khớp dài nhất trước)? Tên một chữ sau "tên / tôi là" phải ≥ 2 chữ
    mới giữ ("Mình là Khoa" vẫn lọc — "Khoa" vừa là tên sao vừa là tên người)."""
    tu, tn, i = _bo_dau(cum).split(), _thuat_ngu(), 0
    if len(tu) < toi_thieu_tu:
        return False
    while i < len(tu):
        for n in range(min(4, len(tu) - i), 0, -1):
            if " ".join(tu[i:i + n]) in tn:
                i += n
                break
        else:
            return False
    return True


def loc_ten_lien_ket(s: str) -> str:
    """Bỏ liên kết / @tài khoản, tên sau "tên…", "tôi là…", và cụm 2–4 chữ hoa giữa câu (trừ tên sao, cung, quẻ)."""
    s = _LIEN_KET.sub("[liên kết]", s)
    s = _TEN_SAU.sub(lambda m: m.group(0) if _la_thuat_ngu(m.group(2), 2) else f"{m.group(1)}[tên]", s)
    return _TEN.sub(lambda m: m.group(0) if _la_thuat_ngu(m.group(0)) else "[tên]", s)


def loc_cau_hoi(s: str) -> str:
    s = _EMAIL.sub("[email]", s)
    s = _NGAY.sub("[ngày]", s)
    s = _DT.sub("[sđt]", s)
    return loc_ten_lien_ket(s)


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
