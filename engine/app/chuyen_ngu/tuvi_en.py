# -*- coding: utf-8 -*-
"""QTE-1 tuần 5 — đổi KẾT QUẢ lá số Tử vi (đã an bởi iztro qua `/v1/tuvi/an-sao`, một bộ tính) sang nhãn tiếng Anh cho trang
`/en`. Không an sao lại: chỉ tra tên theo `thuat_ngu_en.json` (cung, sao, độ sáng, tứ hoá) + lời 14 chính tinh từ bản phủ
`tuvi_kb.en.json` (nháp máy). Sao không có trong bảng thuật ngữ thì bỏ (không để lẫn tiếng Việt).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.chuyen_ngu import thuat_ngu
from app.chuyen_ngu.battu_en import CAN, CHI, hanh

_KB = Path(__file__).resolve().parents[1] / "kb" / "data"
_TU_HOA = {"Lộc": "Hua Lu", "Quyền": "Hua Quan", "Khoa": "Hua Ke", "Kỵ": "Hua Ji"}
_CUC_SO = {"Nhị": 2, "Tam": 3, "Tứ": 4, "Ngũ": 5, "Lục": 6}


@lru_cache(maxsize=1)
def _bang() -> dict[str, str]:
    """Tên Việt (casefold) → tên Anh, chỉ mục Tử vi (đặt sau Bát tự để Thất Sát/Dụng thần… mang tên Tử vi)."""
    return {m["vi"].casefold(): m["en"] for m in thuat_ngu.muc(["tu_vi"])}


def ten(vi: str) -> str | None:
    return _bang().get(vi.casefold())


def ten_cung(vi: str) -> str | None:
    return ten("Cung Mệnh") if vi == "Mệnh" else ten(vi)


@lru_cache(maxsize=1)
def _kb_vi() -> dict:
    return json.loads((_KB / "tuvi_kb.json").read_text(encoding="utf-8"))["chinh_tinh"]


@lru_cache(maxsize=1)
def _kb_en() -> dict:
    return json.loads((_KB / "tuvi_kb.en.json").read_text(encoding="utf-8"))["chinh_tinh"]


def _star(vi: str) -> dict:
    e, v = _kb_en()[vi], _kb_vi()[vi]
    hanh_vi = v.get("ngu_hanh") or ""
    return {"slug": e["slug"], "vi": vi, "name": ten(vi), "han": v.get("ten_han"),
            "element": " / ".join(hanh(x) for x in hanh_vi.split("/") if x), "nature": e["tinh_chat"],
            "strengths": e["diem_manh"], "watch_out": e["mat_toi"], "question": e["cau_tu_soi"]}


def stars() -> list[dict]:
    return [_star(k) for k in _kb_en()]


def star(slug: str) -> dict | None:
    return next((s for s in stars() if s["slug"] == slug), None)


def _cuc(vi: str) -> str:
    # "Thổ Ngũ Cục" → "Earth 5 Bureau"
    p = vi.split()
    return f"{hanh(p[0])} {_CUC_SO.get(p[1], p[1])} Bureau" if len(p) >= 2 else vi


def la_so(d: dict) -> dict:
    """Kết quả `/v1/tuvi/an-sao` (tiếng Việt) → bản tiếng Anh."""
    def sao(s: dict) -> dict:
        ds = s.get("do_sang_nam_phai") or s.get("do_sang")
        kb = _kb_en().get(s["ten"])
        return {"vi": s["ten"], "name": ten(s["ten"]), "slug": kb["slug"] if kb else None,
                "brightness": ten(ds) if ds else None, "transformation": _TU_HOA.get(s.get("tu_hoa") or "")}

    palaces = []
    for c in d["cung"]:
        p, h, a, _ = CHI[c["chi"]]
        palaces.append({
            "vi": c["ten"], "name": ten_cung(c["ten"]), "is_life": c.get("la_menh", False), "is_body": c.get("la_than", False),
            "stem": {"vi": c["can"], "pinyin": CAN[c["can"]][0], "han": CAN[c["can"]][1]},
            "branch": {"vi": c["chi"], "pinyin": p, "han": h, "animal": a},
            "major_stars": [sao(s) for s in c["chinh_tinh"]],
            "minor_stars": [n for n in (ten(s if isinstance(s, str) else s.get("ten", "")) for s in c.get("phu_tinh", [])) if n],
            "major_period": {"from_age": c["dai_han"]["tu_tuoi"], "to_age": c["dai_han"]["den_tuoi"],
                             "from_year": c["dai_han"]["tu_nam"], "to_year": c["dai_han"]["den_nam"]} if c.get("dai_han") else None,
        })
    am = d["am_duong"]
    return {
        "palaces": palaces,
        "element_bureau": _cuc(d["ngu_hanh_cuc"]),
        "life_master": ten(d["menh_chu"]) or d["menh_chu"],
        "body_master": ten(d["than_chu"]) or d["than_chu"],
        "year": {"stem": CAN[d["can_chi_nam"]["can"]][0], "branch": CHI[d["can_chi_nam"]["chi"]][0],
                 "animal": CHI[d["can_chi_nam"]["chi"]][2]},
        "lunar_date": d["am_lich"],
        "direction": "forward" if am.get("ly") == "thuận" else "backward",
        "life_palace_stars": [_star(s["vi"]) for p in palaces if p["is_life"] for s in p["major_stars"] if s["vi"] in _kb_en()],
    }
