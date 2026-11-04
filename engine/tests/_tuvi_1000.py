# -*- coding: utf-8 -*-
"""KB-TV3 — 1.000 lá số engine an từ đầu vào `lasotuvi_1000.json`, nạp MỘT lần cho cả phiên pytest (các test bất biến
và test cách cục dùng chung — mỗi lượt an ~40 ms)."""
from __future__ import annotations

import datetime as dt
import json
from functools import lru_cache
from pathlib import Path

from app.calc import tuvi_an_sao as az

GOLDEN = Path(__file__).resolve().parents[1] / "fixtures" / "golden"
DAU_VAO = [(dt.date.fromisoformat(n), ti, "nam" if gt == 1 else "nu")
           for n, ti, gt, *_ in json.loads((GOLDEN / "lasotuvi_1000.json").read_text("utf-8"))["cases"]]


@lru_cache(maxsize=1)
def la_1000() -> tuple[dict, ...]:
    return tuple(az.an_sao_tho(d, ti, gt) for d, ti, gt in DAU_VAO)
