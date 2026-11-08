"""Bộ kiểm bản chuyển ngữ Việt → Anh — luật cố định, không AI. Trả danh sách lỗi {ma, chi_tiet}; rỗng = qua.

Mã lỗi: bien (biến {x} lệch) · so (con số mất / thêm) · thuat_ngu (thuật ngữ ≥ 2 âm tiết không dùng tên trong bảng) ·
cum_cam (cụm cấm tiếng Anh) · suc_khoe (nguồn có câu "không thay lời bác sĩ" mà bản Anh không có) · con_tieng_viet
(còn chữ có dấu) · do_dai (dài/ngắn bất thường so với nguồn).
"""
from __future__ import annotations

import re
import unicodedata

from app.chuyen_ngu import thuat_ngu

_BIEN = re.compile(r"\{[a-z_][a-z0-9_]*\}")
_SO = re.compile(r"\d+(?:[.,]\d+)?")
_DAU_VIET = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)
_BAC_SI = re.compile(r"bác sĩ|không thay lời|chẩn đoán", re.I)
_RANH_GIOI_EN = re.compile(r"doctor|medical|physician|health ?care professional", re.I)


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def _so(s: str) -> list[str]:
    return sorted(x.replace(",", ".") for x in _SO.findall(_BIEN.sub("", s)))


def _co_cum(van: str, cum: str) -> bool:
    return re.search(rf"(?<!\w){re.escape(cum)}(?!\w)", van, re.I) is not None


def kiem(nguon_vi: str, ban_en: str, *, mang: list[str] | None = None) -> list[dict]:
    vi, en = _nfc(nguon_vi), _nfc(ban_en)
    loi: list[dict] = []
    if sorted(_BIEN.findall(vi)) != sorted(_BIEN.findall(en)):
        loi.append({"ma": "bien", "chi_tiet": f"{_BIEN.findall(vi)} ≠ {_BIEN.findall(en)}"})
    if _so(vi) != _so(en):
        loi.append({"ma": "so", "chi_tiet": f"{_so(vi)} ≠ {_so(en)}"})
    # Thuật ngữ: chỉ ép thuật ngữ ≥ 2 âm tiết (chữ một âm tiết như "cát", "vận" là từ thường). Cùng chữ Việt ở nhiều mảng
    # (Thất Sát, Dụng thần…) → chấp nhận tên Anh của bất kỳ mảng nào.
    can: dict[str, list[str]] = {}
    for m in thuat_ngu.muc(mang):
        if len(m["vi"].split()) >= 2 and _co_cum(vi, _nfc(m["vi"])):
            can.setdefault(m["vi"], []).extend(thuat_ngu.bien_the_en(m["en"]))
    for ten, cach in can.items():
        if not any(_co_cum(en, c) for c in cach):
            loi.append({"ma": "thuat_ngu", "chi_tiet": f"{ten} → cần một trong {cach}"})
    for p in thuat_ngu.cum_cam():
        if p.search(en):
            loi.append({"ma": "cum_cam", "chi_tiet": p.pattern})
    if _BAC_SI.search(vi) and not _RANH_GIOI_EN.search(en):
        loi.append({"ma": "suc_khoe", "chi_tiet": "thiếu câu 'not medical advice / see a doctor'"})
    if _DAU_VIET.search(en):
        loi.append({"ma": "con_tieng_viet", "chi_tiet": _DAU_VIET.search(en).group(0)})
    if vi.strip():
        ti_le = len(en) / len(vi)
        if not 0.5 <= ti_le <= 1.9:
            loi.append({"ma": "do_dai", "chi_tiet": f"{ti_le:.2f}"})
    return loi
