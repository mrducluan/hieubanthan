# -*- coding: utf-8 -*-
"""EN-6 — 1.000 lá số Tử vi đối chiếu `lasotuvi` (MIT), cùng luật so với LS60 (`test_tuvi_lich_viet._kiem`): sao an
theo năm luôn so; Mệnh/Thân, 14 chính tinh, sao theo tháng/giờ/ngày và độ sáng Nam phái so khi KHÔNG ở nửa sau tháng
nhuận (hai phái khác quy ước — mặc định engine "tính tháng sau")."""
from __future__ import annotations

import datetime as dt
import json
from collections import defaultdict
from pathlib import Path

from app.calc import lunar, tuvi_an_sao as az, tuvi_do_sang_vn as ds
from tests.test_tuvi_lich_viet import CHI, CHINH, KHAC, THEO_NAM

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_1000.json").read_text("utf-8"))["cases"]
HEX = "0123456789ab"
MUC = {"M": "Miếu", "V": "Vượng", "D": "Đắc", "B": "Bình", "H": "Hãm"}


def _cua_minh(d: dt.date, ti: int, gt: str):
    la = az.an_sao_tho(d, ti, gt, "vi-VN")
    pos = defaultdict(set)
    for p in la["palaces"]:
        for k in ("majorStars", "minorStars", "adjectiveStars"):
            for s in p[k]:
                pos[s["name"]].add(p["earthlyBranch"])
    return la, pos


def test_1000_la_so_khop_lasotuvi():
    sai = []
    for ngay, ti, gt, mt, sao_s, sang_s in G:
        d = dt.date.fromisoformat(ngay)
        sai_ca = []
        sao = {int(k): {CHI[HEX.index(x)] for x in v} for k, v in (p.split(":") for p in sao_s.split(","))}
        la, pos = _cua_minh(d, ti, "nam" if gt == 1 else "nu")
        for i, t in THEO_NAM.items():
            if pos[t] != sao.get(i, set()):
                sai_ca.append(t)
        ng, _, _, nh = lunar.solar_to_lunar(d.day, d.month, d.year, 7)
        if not (nh and ng > 15):
            menh = next(p["earthlyBranch"] for p in la["palaces"] if p["name"] == "Mệnh")
            than = next(p["earthlyBranch"] for p in la["palaces"] if p["isBodyPalace"])
            if (menh, than) != (CHI[HEX.index(mt[0])], CHI[HEX.index(mt[1])]):
                sai_ca.append("Mệnh/Thân")
            for i, t in {**CHINH, **KHAC}.items():
                if i in sao and pos[t] != sao[i]:
                    sai_ca.append(t)
            for x in filter(None, sang_s.split(",")):
                i, chi, m = int(x[:-2]), CHI[HEX.index(x[-2])], MUC[x[-1]]
                if ds.do_sang(CHINH[i], chi) != m:
                    sai_ca.append(f"độ sáng {CHINH[i]}@{chi}")
        if sai_ca:
            sai.append((ngay, ti, gt, sai_ca))
    assert len(G) == 1000
    assert sai == [], sai[:5]
