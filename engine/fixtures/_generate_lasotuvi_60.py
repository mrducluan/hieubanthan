# -*- coding: utf-8 -*-
"""LS60 — 60 lá số mẫu từ ORACLE `lasotuvi` (MIT, doanguyen; repo github.com/doanguyen/lasotuvi). Chỉ sinh
golden, không chạy runtime; engine vẫn an sao bằng iztro. Mẫu ngẫu nhiên cố định (seed 2026), 1930–2025,
giờ Tý→Hợi (bỏ Tý muộn 23h vì hai bên khác quy ước giờ Tý), nam/nữ.

    git clone https://github.com/doanguyen/lasotuvi /tmp/lasotuvi
    python fixtures/_generate_lasotuvi_60.py /tmp/lasotuvi > fixtures/golden/lasotuvi_60.json
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

CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
MUC = {"M": "Miếu", "V": "Vượng", "Đ": "Đắc", "B": "Bình", "H": "Hãm"}

def _lap(d, ti, gt):
    db = lapDiaBan(diaBan, d.day, d.month, d.year, ti + 1, 1 if gt == "nam" else -1, True, 7)
    sao, sang = {}, {}
    for c in db.thapNhiCung[1:13]:
        chi = CHI[c.cungSo - 1]
        for s in c.cungSao:
            sao.setdefault(str(s["saoID"]), {"ten": s["saoTen"], "chi": []})["chi"].append(chi)
            if s["saoID"] <= 14 and s.get("saoDacTinh"):
                sang[f'{s["saoID"]}@{chi}'] = MUC[s["saoDacTinh"]]
    return {
        "ngay": d.isoformat(), "ti": ti, "gioi_tinh": gt,
        "menh": CHI[db.cungMenh - 1], "than": CHI[db.cungThan - 1],
        "tuan": [CHI[c.cungSo - 1] for c in db.thapNhiCung[1:13] if getattr(c, "tuanTrung", False)],
        "triet": [CHI[c.cungSo - 1] for c in db.thapNhiCung[1:13] if getattr(c, "trietLo", False)],
        "sao": sao, "do_sang": sang,
    }


random.seed(2026)
cases = []
while len(cases) < 60:
    d = dt.date(1930, 1, 1) + dt.timedelta(days=random.randrange(0, 35000))
    cases.append(_lap(d, random.randrange(0, 12), random.choice(["nam", "nu"])))

# Ngày lịch Việt (UTC+7, lasotuvi dùng Hồ Ngọc Đức) KHÁC lịch Trung Quốc (UTC+8, iztro mặc định): tháng lệch,
# ngày 30 không có bên Trung Quốc, tháng nhuận lệch. Chọn tay theo danh sách đợt lệch 1900–2100.
LECH = ["1903-02-26", "1917-04-21", "1917-05-20", "1922-07-20", "1935-02-10", "1947-04-05",
        "1968-01-29", "1984-12-25", "1985-01-30", "1985-03-13", "2007-02-17", "1995-10-10"]
lech = [_lap(dt.date.fromisoformat(x), (i * 5) % 12, "nam" if i % 2 else "nu") for i, x in enumerate(LECH)]
print(json.dumps({"_oracle": "lasotuvi (MIT, github.com/doanguyen/lasotuvi @ master) — App.lapDiaBan, timeZone 7",
                  "cases": cases, "lich_lech": lech}, ensure_ascii=False, separators=(",", ":")))
