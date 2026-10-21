# -*- coding: utf-8 -*-
"""Vectơ nhúng câu hỏi TẤT ĐỊNH (`bam512_v1`) cho kho ý định pgvector (LG-ĐS mục 4, migration 0017).

Không mô hình học máy, không thư viện mới, không gửi câu hỏi ra ngoài: câu → bỏ dấu, chữ thường → đặc trưng
  * âm tiết (trọng số 1; từ đệm hay gặp như "tôi, có, không, của" chỉ 0,25),
  * cụm 2 âm tiết liền nhau (0,8),
  * n-gram 3 ký tự trong từng âm tiết, có dấu biên `#` (0,3) — chịu được gõ sai / thiếu chữ,
→ băm ổn định bằng hashlib.blake2b (KHÔNG dùng hash() của Python — đổi theo tiến trình) vào 512 ô, dấu ± lấy từ bit
kế tiếp (giảm va chạm cộng dồn) → chuẩn hoá L2. Cùng câu → cùng vectơ trên mọi máy, mọi phiên bản Python.

Đổi cách băm = đổi `MO_HINH` (cột `mo_hinh` trong DB tách hai loại vectơ) và dựng lại kho.
Câu luôn được lọc (`nhat_ky.loc_cau_hoi_huyenhoc`: ngày, năm, giờ, số điện thoại, email, tên riêng) TRƯỚC khi nhúng;
chỗ giữ chỗ "[năm]", "[tên]"… bị bỏ khỏi đặc trưng (không để "[năm]" trùng âm tiết "năm").
"""
from __future__ import annotations

import hashlib
import math
import re
import unicodedata

MO_HINH = "bam512_v1"
SO_CHIEU = 512
_MUOI = b"hbt-bam512-v1"            # "person" của blake2b — đổi bộ băm thì đổi cả MO_HINH

W_AM_TIET, W_TU_DEM, W_CUM_2, W_NGRAM = 1.0, 0.25, 0.8, 0.3
# Từ đệm / hư từ hay gặp trong câu hỏi (đã bỏ dấu). Không phải danh sách "dừng" tuyệt đối — chỉ hạ trọng số.
TU_DEM = frozenset(
    "toi minh em anh chi ban co khong ko la gi cua va voi cho thi ma nhu the nao sao vay nhi a a ah oi"
    " duoc bi se da dang nay do kia nhung cac mot nhieu it rat lam qua hay hoac neu khi vi nen".split()
)
_GIU_CHO = re.compile(r"\[[^\]]{1,12}\]")


def loc_them(cau: str) -> str:
    """Lọc tên riêng sau "tên", "tôi là…", liên kết mạng xã hội / web, @tài khoản TRƯỚC khi nhúng / lưu kho vectơ.
    Logic chung ở `nhat_ky.loc_ten_lien_ket` (nhật ký hỏi dùng cùng bộ lọc — một nguồn); giữ tên sao / cung / quẻ."""
    from app import nhat_ky  # noqa: PLC0415
    return nhat_ky.loc_ten_lien_ket(cau or "")


def bo_dau(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.replace("đ", "d").replace("Đ", "D")


def am_tiet(cau: str) -> list[str]:
    """Âm tiết đã bỏ dấu, chữ thường, chỉ a–z0–9 (bỏ chỗ giữ chỗ của bộ lọc)."""
    s = bo_dau(_GIU_CHO.sub(" ", cau)).lower()
    return re.findall(r"[a-z0-9]+", s)


def dac_trung(cau: str) -> dict[str, float]:
    """Đặc trưng có trọng số (tách riêng để test đọc được)."""
    tt = am_tiet(cau)
    f: dict[str, float] = {}

    def cong(k: str, w: float) -> None:
        f[k] = f.get(k, 0.0) + w

    for t in tt:
        cong("w:" + t, W_TU_DEM if t in TU_DEM else W_AM_TIET)
        b = f"#{t}#"
        for i in range(len(b) - 2):
            cong("c:" + b[i:i + 3], W_NGRAM)
    for a, b2 in zip(tt, tt[1:]):
        if a in TU_DEM and b2 in TU_DEM:
            continue
        cong(f"b:{a}_{b2}", W_CUM_2)
    return f


def _bam(k: str) -> int:
    return int.from_bytes(hashlib.blake2b(k.encode("utf-8"), digest_size=8, person=_MUOI).digest(), "big")


def nhung(cau: str) -> list[float]:
    """Vectơ 512 chiều, chuẩn L2 (câu rỗng → vectơ 0)."""
    v = [0.0] * SO_CHIEU
    for k, w in dac_trung(cau).items():
        h = _bam(k)
        v[h % SO_CHIEU] += w if (h >> 9) & 1 else -w
    n = math.sqrt(sum(x * x for x in v))
    return [round(x / n, 6) for x in v] if n else v


def cos(a: list[float], b: list[float]) -> float:
    na, nb = math.sqrt(sum(x * x for x in a)), math.sqrt(sum(x * x for x in b))
    return sum(x * y for x, y in zip(a, b)) / (na * nb) if na and nb else 0.0
