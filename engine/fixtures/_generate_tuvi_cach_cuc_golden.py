# -*- coding: utf-8 -*-
"""KB-TV3 — chụp kết quả nhận diện cách cục (mã, cung liên quan, lục sát hội về) trên 1.000 lá số của
`lasotuvi_1000.json` (chỉ lấy ngày giờ giới tính — lá số do engine an). Golden này khoá hành vi của các cách
ĐÃ CÓ: thêm cách mới không được đổi kết quả của cách cũ (`tests/test_tuvi_bat_bien.py`).

Sinh lại CHỈ khi cố ý đổi điều kiện một cách cũ (và ghi rõ trong PR):

    cd engine && python fixtures/_generate_tuvi_cach_cuc_golden.py > fixtures/golden/tuvi_cach_cuc_1000.json
"""
import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.calc import tuvi_an_sao as az, tuvi_cach_cuc as cc  # noqa: E402

G = json.loads((Path(__file__).parent / "golden" / "lasotuvi_1000.json").read_text("utf-8"))["cases"]
ra = []
for ngay, ti, gt, *_ in G:
    la = az.an_sao_tho(dt.date.fromisoformat(ngay), ti, "nam" if gt == 1 else "nu")
    ra.append([ngay, ti, gt, [f"{x['ma']}|{','.join(x['cung'])}|{','.join(x['sat_hoi'])}" for x in cc.nhan_dien(la)]])
print(json.dumps({"_nguon": "engine (iztro 2.6.0 + lối Việt) trên đầu vào lasotuvi_1000.json; mã|cung|sat_hoi",
                  "danh_sach": cc.DANH_SACH, "cases": ra}, ensure_ascii=False, separators=(",", ":")))
