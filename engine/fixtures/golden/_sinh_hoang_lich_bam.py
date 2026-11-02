"""EN-6 — golden hoàng lịch MỌI ngày 1930–2030 dạng BĂM theo tháng, từ lunar-python 1.4.8 (MIT, 6tail) — ORACLE.

    python -m venv /tmp/lp && /tmp/lp/bin/pip install lunar_python==1.4.8
    /tmp/lp/bin/python -I engine/fixtures/golden/_sinh_hoang_lich_bam.py engine/fixtures/golden/hoang_lich_bam.json

Mỗi ngày → một bản ghi chuẩn (cùng trường như hoang_lich_golden.json, giờ Bắc Kinh UTC+8); mỗi tháng → sha256 của danh
sách bản ghi (16 ký tự đầu). Test `tests/test_hoang_lich_bam.py` dựng ĐÚNG bản ghi chuẩn đó từ engine (tz=8) rồi so băm;
lệch tháng nào thì báo tháng đó (sinh lại bản đầy đủ của tháng bằng hàm `ngay_chuan` để so từng ngày).
Ghi chú: "无" (không có) bị bỏ khỏi danh sách nghi/kỵ/cát/hung như test 898 ngày; xung chỉ lấy can chi trong ngoặc.
"""
import datetime as dt
import hashlib
import json
import re
import sys

from lunar_python import Solar

GIO = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]
TU, DEN = dt.date(1930, 1, 1), dt.date(2030, 12, 31)


def ngay_chuan(d: dt.date) -> list:
    l = Solar.fromYmd(d.year, d.month, d.day).getLunar()
    gio = [Solar.fromYmdHms(d.year, d.month, d.day, h, 30, 0).getLunar().getTimeTianShen() for h in GIO]
    bo = lambda xs: [x for x in xs if x != "无"]  # noqa: E731
    return [d.isoformat(), l.getMonthInGanZhi(), l.getDayInGanZhi(), l.getZhiXing(), l.getDayTianShen(),
            bo(l.getDayYi()), bo(l.getDayJi()), bo(l.getDayJiShen()), bo(l.getDayXiongSha()), l.getXiu(),
            re.search(r"\((.+?)\)", l.getDayChongDesc()).group(1), l.getDaySha(),
            [l.getPengZuGan(), l.getPengZuZhi()],
            [l.getDayPositionXi(), l.getDayPositionCai(), l.getDayPositionFu()], l.getDayPositionTai(), gio]


def bam(ds: list) -> str:
    return hashlib.sha256(json.dumps(ds, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()[:16]


def main(out: str) -> None:
    thang: dict[str, list] = {}
    d = TU
    while d <= DEN:
        thang.setdefault(f"{d.year:04d}-{d.month:02d}", []).append(ngay_chuan(d))
        d += dt.timedelta(days=1)
    data = {"_nguon": "lunar-python 1.4.8 (MIT, 6tail) — giờ Bắc Kinh UTC+8, mọi ngày 1930-01-01…2030-12-31",
            "tu": TU.isoformat(), "den": DEN.isoformat(), "thang": {k: bam(v) for k, v in thang.items()}}
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=0)


if __name__ == "__main__":
    main(sys.argv[1])
