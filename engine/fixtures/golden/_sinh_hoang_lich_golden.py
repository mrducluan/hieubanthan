"""Sinh golden hoàng lịch từ lunar-python 1.4.8 (MIT, 6tail) — ORACLE, không chạy runtime.

    python -m venv /tmp/lp && /tmp/lp/bin/pip install lunar_python==1.4.8
    /tmp/lp/bin/python -I engine/fixtures/golden/_sinh_hoang_lich_golden.py engine/fixtures/golden/hoang_lich_golden.json

Ghi theo GIỜ BẮC KINH (UTC+8) như oracle; test so engine với tz=8. Tháng đổi theo ngày giao tiết (节).
"""
import datetime as dt
import json
import sys

from lunar_python import Solar

GIO = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]   # giờ đại diện mỗi canh giờ Tý → Hợi


def mot_ngay(d: dt.date) -> dict:
    l = Solar.fromYmd(d.year, d.month, d.day).getLunar()
    gio = []
    for h in GIO:
        t = Solar.fromYmdHms(d.year, d.month, d.day, h, 30, 0).getLunar()
        gio.append(t.getTimeTianShen())
    return {
        "d": d.isoformat(), "thang": l.getMonthInGanZhi(), "ngay": l.getDayInGanZhi(),
        "truc": l.getZhiXing(), "than": l.getDayTianShen(),
        "nghi": l.getDayYi(), "ky": l.getDayJi(), "cat": l.getDayJiShen(), "hung": l.getDayXiongSha(),
        "tu": l.getXiu(), "xung": l.getDayChongDesc(), "sat": l.getDaySha(),
        "bt": [l.getPengZuGan(), l.getPengZuZhi()],
        "huong": [l.getDayPositionXi(), l.getDayPositionCai(), l.getDayPositionFu()],
        "thai": l.getDayPositionTai(), "gio": gio,
    }


def main(out: str) -> None:
    ngay = []
    d = dt.date(2026, 1, 1)
    while d <= dt.date(2026, 12, 31):
        ngay.append(d)
        d += dt.timedelta(days=1)
    d = dt.date(1940, 1, 3)
    while d <= dt.date(2080, 12, 31):
        if d.year != 2026:
            ngay.append(d)
        d += dt.timedelta(days=97)
    data = {"_nguon": "lunar-python 1.4.8 (MIT, 6tail) — giờ Bắc Kinh UTC+8", "ngay": [mot_ngay(x) for x in ngay]}
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main(sys.argv[1])
