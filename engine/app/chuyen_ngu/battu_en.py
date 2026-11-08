# -*- coding: utf-8 -*-
"""QTE-1 tuần 3–4 — đổi KẾT QUẢ Bát tự (đã tính bởi `calc.battu`, một bộ tính) sang nhãn tiếng Anh cho trang `/en`.

Không tính lại gì: chỉ tra bảng tên (can chi → pinyin + chữ Hán, ngũ hành, thập thần theo `thuat_ngu_en.json`) và lời Day
Master từ bản phủ `battu_kb.en.json` (nháp máy, chờ người bản xứ duyệt). Trường không có bản Anh thì bỏ, không để lẫn tiếng Việt.
"""
from __future__ import annotations

import json
import unicodedata
from functools import lru_cache
from pathlib import Path

from app.chuyen_ngu import thuat_ngu

_KB_EN = Path(__file__).resolve().parents[1] / "kb" / "data" / "battu_kb.en.json"

# can: (pinyin, Hán, hành, âm dương)
CAN = {"Giáp": ("Jia", "甲", "Wood", "Yang"), "Ất": ("Yi", "乙", "Wood", "Yin"), "Bính": ("Bing", "丙", "Fire", "Yang"),
       "Đinh": ("Ding", "丁", "Fire", "Yin"), "Mậu": ("Wu", "戊", "Earth", "Yang"), "Kỷ": ("Ji", "己", "Earth", "Yin"),
       "Canh": ("Geng", "庚", "Metal", "Yang"), "Tân": ("Xin", "辛", "Metal", "Yin"), "Nhâm": ("Ren", "壬", "Water", "Yang"),
       "Quý": ("Gui", "癸", "Water", "Yin")}
# chi: (pinyin, Hán, con giáp, hành)
CHI = {"Tý": ("Zi", "子", "Rat", "Water"), "Sửu": ("Chou", "丑", "Ox", "Earth"), "Dần": ("Yin", "寅", "Tiger", "Wood"),
       "Mão": ("Mao", "卯", "Rabbit", "Wood"), "Thìn": ("Chen", "辰", "Dragon", "Earth"), "Tỵ": ("Si", "巳", "Snake", "Fire"),
       "Ngọ": ("Wu", "午", "Horse", "Fire"), "Mùi": ("Wei", "未", "Goat", "Earth"), "Thân": ("Shen", "申", "Monkey", "Metal"),
       "Dậu": ("You", "酉", "Rooster", "Metal"), "Tuất": ("Xu", "戌", "Dog", "Earth"), "Hợi": ("Hai", "亥", "Pig", "Water")}
_HANH = {"moc": "Wood", "hoa": "Fire", "tho": "Earth", "kim": "Metal", "thuy": "Water"}
_SUC = {"vượng": "Strong", "nhược": "Weak", "trung hoà": "Balanced", "trung hòa": "Balanced"}
_CANH_BAO = {
    "sinh_nuoc_ngoai": ("born_abroad", "Born outside Vietnam: the chart uses local clock time at the place of birth."),
    "gio_mua_he": ("daylight_saving", "Daylight saving time was in effect at birth: one hour was taken off to get local standard time."),
    "mui_gio_nuoc_ngoai": ("timezone_missing", "Time zone of the birthplace not given: solar-term boundaries may be off for births near the start of a month."),
}
_THAP_THAN_THEM = {"Nhật chủ": "Day Master"}


def _khong_dau(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").replace("đ", "d").replace("Đ", "D").lower()


def hanh(vi: str) -> str:
    return _HANH.get(_khong_dau(vi), vi)


def thap_than(vi: str) -> str:
    if vi in _THAP_THAN_THEM:
        return _THAP_THAN_THEM[vi]
    for m in thuat_ngu.muc(["bat_tu"]):
        if m["vi"].casefold() == vi.casefold():
            return m["en"].split(" (")[0]
    return vi


def _can(vi: str) -> dict:
    p, h, e, yy = CAN[vi]
    return {"vi": vi, "pinyin": p, "han": h, "element": e, "yin_yang": yy}


def _chi(vi: str) -> dict:
    p, h, a, e = CHI[vi]
    return {"vi": vi, "pinyin": p, "han": h, "animal": a, "element": e}


@lru_cache(maxsize=1)
def _kb() -> dict:
    return json.loads(_KB_EN.read_text(encoding="utf-8"))


def _dm(can_vi: str) -> dict:
    e = _kb()["nhat_chu"][can_vi]
    p, h, el, yy = CAN[can_vi]
    return {"slug": e["slug"], "vi": can_vi, "pinyin": p, "han": h, "element": el, "yin_yang": yy,
            "name": f"{p} {el}", "image": e["hinh_tuong"], "nature": e["tinh_chat"], "strengths": e["diem_manh"],
            "watch_out": e["mat_toi"], "question": e["cau_tu_soi"]}


def day_masters() -> list[dict]:
    return [_dm(k) for k in CAN]


def day_master(slug: str) -> dict | None:
    return next((d for d in day_masters() if d["slug"] == slug), None)


def la_so(d: dict) -> dict:
    """Kết quả `/v1/battu/la-so` (tiếng Việt) → bản tiếng Anh."""
    ten = ("Year", "Month", "Day", "Hour")
    pillars = [{"position": ten[i], "stem": _can(t["can"]), "branch": _chi(t["chi"]),
                "hidden_stems": [_can(x) for x in d["tang_can"][i]]} for i, t in enumerate(d["tru"])]
    than = d["than"]
    dt = d["dung_than"]
    return {
        "pillars": pillars,
        "day_master": _dm(d["nhat_chu"]["can"]),
        "ten_gods_stems": [thap_than(x) for x in d["thap_than_can"]],
        "ten_gods_branches": [[thap_than(x) for x in ds] for ds in d["thap_than_chi"]],
        "elements": {hanh(k): v for k, v in d["ngu_hanh"]["diem"].items()},
        "element_missing": [hanh(x) for x in d["ngu_hanh"].get("thieu", [])],
        "element_strongest": hanh(d["ngu_hanh"]["nhieu_nhat"]),
        "strength": {"label": _SUC.get(than["ket_luan"], than["ket_luan"]), "ratio": than["ti_le"],
                     "in_season": bool(than.get("dac_lenh"))},
        "useful_god": {"balance_method": [hanh(x) for x in dt["phu_uc"]["hanh"]],
                       "climate_method": [hanh(x) for x in dt["dieu_hau"]["hanh"]]},
        "luck_pillars": [{"stem": _can(v["can"]), "branch": _chi(v["chi"]), "from_year": v["tu_nam"], "to_year": v["den_nam"],
                          "from_date": v.get("tu_ngay"), "from_age": v.get("tu_tuoi_thuc")} for v in d["dai_van"]["ds"]],
        "luck_forward": d["dai_van"]["thuan"],
        "bazi_year": d["nam_bat_tu"],
        "clock_time_used": d["gio_lich"],
        "warnings": [{"type": _CANH_BAO[w["loai"]][0], "text": _CANH_BAO[w["loai"]][1]}
                     for w in d.get("co_canh_bao", []) if w["loai"] in _CANH_BAO],
    }
