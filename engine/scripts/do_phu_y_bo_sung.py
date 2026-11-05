# -*- coding: utf-8 -*-
"""TV-YBS — đo độ phủ ý Tử vi bổ sung trên 1.000 lá golden (`fixtures/golden/lasotuvi_1000.json`).

    cd engine && .venv/bin/python scripts/do_phu_y_bo_sung.py [--bao-cao 60]

In: số mục trong phạm vi báo cáo, số tính được / chưa tính được (kèm lý do), mỗi mục khớp bao nhiêu lá (lá gốc + năm
2026 âm lịch); `--bao-cao N`: dựng N báo cáo đầy đủ, đếm hộp mới / làm giàu / ý "Góc nhìn khác" trung bình mỗi chương."""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from app.calc import tuvi_an_sao as az  # noqa: E402
from app.hoidap.tuvi import tom_tat  # noqa: E402
from app.kb import tuvi_y_bo_sung as kb  # noqa: E402
from app.luangiai import tuvi_doi_song as tds  # noqa: E402
from app.luangiai import tuvi_y_bo_sung as yb  # noqa: E402

XEM = dt.date(2026, 10, 21)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bao-cao", type=int, default=0)
    a = ap.parse_args()
    cases = json.loads((GOC / "fixtures" / "golden" / "lasotuvi_1000.json").read_text("utf-8"))["cases"]
    pham_vi = kb.theo_loai(*yb.LOAI_BAO_CAO)
    tinh = [m for m in pham_vi if yb.tinh_duoc(m)[0]]
    khong = [(m["id"], yb.tinh_duoc(m)[1]) for m in pham_vi if not yb.tinh_duoc(m)[0]]
    dem: collections.Counter = collections.Counter()
    for n, ti, gt, *_ in cases:
        ngay = dt.date.fromisoformat(n)
        gioi = "nam" if gt == 1 else "nu"
        ls = tom_tat(az.an_sao_tho(ngay, ti, gioi, "vi-VN"))
        vh = az.van_han(ngay, ti, gioi, XEM)
        nc = yb.ngu_canh_tu_la_so(ls, gioi, 2026, 2026 - vh["tuoi_mu"] + 1, vh)
        for m in tinh:
            if yb.khop(m, nc):
                dem[m["id"]] += 1
    print(f"Phạm vi báo cáo: {len(pham_vi)} mục · tính được {len(tinh)} · chưa tính được {len(khong)}")
    for ma, ly in khong:
        print(f"  - {ma}: {ly}")
    co = [m for m in tinh if dem[m["id"]]]
    print(f"Khớp ít nhất 1/{len(cases)} lá: {len(co)} mục · không lá nào: {len(tinh) - len(co)}")
    for m in sorted(tinh, key=lambda m: -dem[m["id"]]):
        print(f"  {dem[m['id']]:4d}  {m['hien_thi'][:3]}  {m['id']}")
    if a.bao_cao:
        moi = giau = gnk = so_ch = 0
        for n, ti, gt, *_ in cases[: a.bao_cao]:
            bc = tds.lap({"ngay": dt.date.fromisoformat(n), "ti": ti, "gioi_tinh": "nam" if gt == 1 else "nu"}, XEM)
            for c in bc["chuong"]:
                so_ch += 1
                moi += sum(".yb." in h["ma_mau"] for h in c["hop"])
                giau += sum(bool(h.get("y_bo_sung")) for h in c["hop"])
                gnk += len((c.get("goc_nhin_khac") or {}).get("y", []))
        print(f"{a.bao_cao} báo cáo: mỗi bài trung bình {moi / a.bao_cao:.1f} hộp mới · {giau / a.bao_cao:.1f} hộp làm giàu"
              f" · {gnk / a.bao_cao:.1f} ý Góc nhìn khác ({so_ch} chương)")


if __name__ == "__main__":
    main()
