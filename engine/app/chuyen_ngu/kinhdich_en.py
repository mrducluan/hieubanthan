# -*- coding: utf-8 -*-
"""QTE-1 tuần 7 — đổi KẾT QUẢ khởi quẻ (`calc.kinhdich.khoi_que`, một bộ tính) sang nhãn tiếng Anh + lời 64 quẻ từ bản phủ
`kinhdich_kb.en.json` (nháp ban biên tập, không chép bản dịch có bản quyền)."""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

_KB = Path(__file__).resolve().parents[1] / "kb" / "data" / "kinhdich_kb.en.json"
QUAI = {"Càn": ("Qian", "Heaven"), "Khôn": ("Kun", "Earth"), "Chấn": ("Zhen", "Thunder"), "Tốn": ("Xun", "Wind"),
        "Khảm": ("Kan", "Water"), "Ly": ("Li", "Fire"), "Cấn": ("Gen", "Mountain"), "Đoài": ("Dui", "Lake")}


@lru_cache(maxsize=1)
def _kb() -> dict:
    return json.loads(_KB.read_text(encoding="utf-8"))["que"]


def _slug(so: int) -> str:
    return f"{so}-{re.sub(r'[^a-z]+', '-', _kb()[str(so)]['pinyin'].lower()).strip('-')}"


def _hex(so: int) -> dict:
    e = _kb()[str(so)]
    return {"number": so, "slug": _slug(so), "name": e["ten_en"], "pinyin": e["pinyin"], "han": e["han"],
            "meaning": e["y_chinh"], "advice": e["loi_khuyen"]}


def hexagrams() -> list[dict]:
    return [_hex(i) for i in range(1, 65)]


def hexagram(slug: str) -> dict | None:
    m = re.match(r"^(\d{1,2})-", slug)
    if not m or not 1 <= int(m.group(1)) <= 64 or _slug(int(m.group(1))) != slug:
        return None
    return _hex(int(m.group(1)))


def _quai(vi: str) -> dict:
    p, img = QUAI[vi]
    return {"vi": vi, "pinyin": p, "image": img}


def que(gia_tri: list[int], q: dict) -> dict:
    """6 giá trị hào (6/7/8/9, hào 1 → 6) + kết quả `kinhdich.khoi_que` → bản tiếng Anh."""
    def day(k: str) -> dict | None:
        x = q.get(k)
        if not x:
            return None
        return {**_hex(x["so_king_wen"]), "upper": _quai(x["thuong_quai"]), "lower": _quai(x["ha_quai"])}
    return {
        "values": gia_tri,
        "lines": [{"position": i + 1, "yang": v in (7, 9), "changing": v in (6, 9)} for i, v in enumerate(gia_tri)],
        "changing_lines": [i + 1 for i, v in enumerate(gia_tri) if v in (6, 9)],
        "primary": day("quai_ban"), "changed": day("quai_bien"), "nuclear": day("quai_ho"),
    }
