# -*- coding: utf-8 -*-
"""QTE-1 tuần 6 — đổi KẾT QUẢ mệnh quái Bát trạch (`calc.phongthuy`, một bộ tính) sang nhãn tiếng Anh cho trang `/en`.
Không tính lại: tra tên quái, hướng, du niên (thuat_ngu_en.json) + ý nghĩa du niên tiếng Anh (bản dịch câu KB du niên, nháp)."""
from __future__ import annotations

from app.calc import phongthuy as pt
from app.chuyen_ngu import thuat_ngu

QUAI = {"Khảm": ("Kan", "坎"), "Khôn": ("Kun", "坤"), "Chấn": ("Zhen", "震"), "Tốn": ("Xun", "巽"), "Càn": ("Qian", "乾"),
        "Đoài": ("Dui", "兌"), "Cấn": ("Gen", "艮"), "Ly": ("Li", "離")}
HUONG = {"Bắc": "North", "Đông Bắc": "Northeast", "Đông": "East", "Đông Nam": "Southeast", "Nam": "South",
         "Tây Nam": "Southwest", "Tây": "West", "Tây Bắc": "Northwest"}
# Thứ tự xếp hướng tốt theo cấp (Sinh Khí > Thiên Y > Diên Niên > Phục Vị) — như bản Việt.
CAP = ("Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị", "Hoạ Hại", "Lục Sát", "Ngũ Quỷ", "Tuyệt Mệnh")
DU_NIEN_EN = {
    "Sinh Khí": ("Best direction: growth, development, reputation.", "main door, desk, the direction you face when you need energy"),
    "Thiên Y": ("Good direction: health, getting help, stability.", "bedroom of older family members, the direction the stove faces"),
    "Diên Niên": ("Good direction: harmony, lasting bonds, the couple's relationship.", "the couple's bedroom, the head of the bed"),
    "Phục Vị": ("Calm direction: stability, ease, study and reflection.", "study desk, home altar, a quiet work room"),
    "Hoạ Hại": ("Mildly unfavourable: gossip, small hiccups.", "storage, bathroom"),
    "Lục Sát": ("Unfavourable: muddle, disagreement, messy relationships.", "storage, bathroom, stairs"),
    "Ngũ Quỷ": ("Unfavourable: losses, unwelcome surprises, disputes.", "bathroom, storage; avoid the main door here"),
    "Tuyệt Mệnh": ("Least favourable: depletion, big setbacks.", "rarely used spaces; avoid the main door and the head of the bed"),
}


def _sao(vi: str) -> str:
    for m in thuat_ngu.muc(["phong_thuy"]):
        if m["vi"].casefold() == vi.casefold():
            return m["en"]
    return vi


def _huong(bang: dict[str, str]) -> list[dict]:
    ds = [{"direction": HUONG[h], "vi": h, "star": _sao(dn), "good": CAP.index(dn) < 4, "rank": CAP.index(dn),
           "meaning": DU_NIEN_EN[dn][0], "best_use": DU_NIEN_EN[dn][1]} for h, dn in bang.items()]
    return ds


def menh_quai(d: dict, ngay_sinh=None) -> dict:
    """Kết quả `/v1/phongthuy/menh-quai` (tiếng Việt) → bản tiếng Anh."""
    p, h = QUAI[d["quai"]]
    nam_lich = ngay_sinh.year if ngay_sinh else d["nam_tinh"]
    return {
        "kua": d["so"], "trigram": {"pinyin": p, "han": h, "vi": d["quai"]},
        "group": "East group" if d["nhom"].startswith("Đông") else "West group",
        "year_used": d["nam_tinh"], "before_start_of_spring": d["nam_tinh"] != nam_lich,
        "directions": _huong(d["bang_huong"]),
    }


def bang_kua() -> list[dict]:
    """Bảng 8 Kua number: bốn hướng tốt theo cấp (từ cùng bảng du niên của calc.phongthuy)."""
    ra = []
    for so in (1, 2, 3, 4, 6, 7, 8, 9):
        q = pt.SO_QUAI[so]
        bang = pt.bang_huong(q)
        tot = sorted((h for h, dn in bang.items() if CAP.index(dn) < 4), key=lambda h: CAP.index(bang[h]))
        ra.append({"kua": so, "trigram": QUAI[q][0], "han": QUAI[q][1],
                   "group": "East group" if so in (1, 3, 4, 9) else "West group", "best_directions": [HUONG[h] for h in tot]})
    return ra
