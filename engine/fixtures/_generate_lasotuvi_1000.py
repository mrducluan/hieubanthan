# -*- coding: utf-8 -*-
"""EN-6 — 1.000 lá số đối chiếu ORACLE `lasotuvi` (MIT, doanguyen) — cùng cách so với LS60 (`test_tuvi_lich_viet`),
dạng GỌN để giữ file nhỏ: chỉ các sao test đối chiếu, vị trí = chuỗi chỉ số chi (0 = Tý … b = Hợi). Seed 20261101,
1930–2025, giờ Tý→Hợi (bỏ Tý muộn — hai bên khác quy ước), nam/nữ. Chỉ sinh golden, không chạy runtime.

    git clone https://github.com/doanguyen/lasotuvi /tmp/lasotuvi
    python fixtures/_generate_lasotuvi_1000.py /tmp/lasotuvi > fixtures/golden/lasotuvi_1000.json
"""
import datetime as dt
import json
import random
import sys
import warnings

warnings.filterwarnings("ignore")
sys.path.insert(0, sys.argv[1])
from lasotuvi.App import lapDiaBan  # noqa: E402
from lasotuvi.DiaBan import diaBan  # noqa: E402

GIU = list(range(1, 15)) + [27, 51, 52, 79, 80, 96, 97, 98, 69, 70, 100, 101, 53, 54, 57, 58, 61, 62, 63, 64, 65, 66,
                            67, 73, 74, 85, 86, 87, 88, 89, 84, 71, 72]
MUC = {"M": "M", "V": "V", "Đ": "D", "B": "B", "H": "H"}
HEX = "0123456789ab"


def _lap(d, ti, gt):
    db = lapDiaBan(diaBan, d.day, d.month, d.year, ti + 1, 1 if gt == "nam" else -1, True, 7)
    sao, sang = {}, []
    for c in db.thapNhiCung[1:13]:
        chi = c.cungSo - 1
        for s in c.cungSao:
            if s["saoID"] in GIU:
                sao[s["saoID"]] = sao.get(s["saoID"], "") + HEX[chi]
            if s["saoID"] <= 14 and s.get("saoDacTinh"):
                sang.append(f'{s["saoID"]}{HEX[chi]}{MUC[s["saoDacTinh"]]}')
    return [d.isoformat(), ti, 1 if gt == "nam" else 0, HEX[db.cungMenh - 1] + HEX[db.cungThan - 1],
            ",".join(f"{k}:{''.join(sorted(v))}" for k, v in sorted(sao.items())), ",".join(sorted(sang))]


random.seed(20261101)
cases = []
while len(cases) < 1000:
    d = dt.date(1930, 1, 1) + dt.timedelta(days=random.randrange(0, 35000))
    cases.append(_lap(d, random.randrange(0, 12), random.choice(["nam", "nu"])))
print(json.dumps({"_oracle": "lasotuvi (MIT, github.com/doanguyen/lasotuvi @ master) — App.lapDiaBan, timeZone 7",
                  "_dang": "[ngày, giờ 0..11, nam=1/nữ=0, Mệnh+Thân (chỉ số chi 0=Tý…b=Hợi), 'saoID:chi…,…', 'độ sáng saoID+chi+M/V/D/B/H']",
                  "cases": cases}, ensure_ascii=False, separators=(",", ":")))
