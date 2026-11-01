# -*- coding: utf-8 -*-
"""EN-6 — golden 5.000 tứ trụ + chiều đại vận (oracle lunar-typescript, sect 2, giờ Bắc Kinh → `utc_lich=8`), gồm ca
23:xx dạ Tý. Bỏ ca cách giao tiết < 3 phút (sai số tiết khí ≤ 0,63 phút)."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from app.calc import battu as bt, can_chi

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "battu_5000.json").read_text(encoding="utf-8"))["ca"]
HAN = dict(zip("甲乙丙丁戊己庚辛壬癸", can_chi.CAN)) | dict(zip("子丑寅卯辰巳午未申酉戌亥", can_chi.CHI))


def test_5000_tu_tru():
    lech = []
    for y, m, d, h, mi, gt, tru, thuan in G:
        ls = bt.la_so(dt.datetime(y, m, d, h, mi), "nam" if gt else "nu", utc_lich=8.0)
        mong = [{"can": HAN[tru[i]], "chi": HAN[tru[i + 1]]} for i in (0, 2, 4, 6)]
        if ls["tru"] != mong or ls["dai_van"]["thuan"] != bool(thuan):
            lech.append((y, m, d, h, mi, tru, ls["tru"]))
    assert len(G) == 5000
    assert sum(1 for c in G if c[3] == 23) > 300                 # có đủ ca dạ Tý
    assert lech == [], lech[:5]
