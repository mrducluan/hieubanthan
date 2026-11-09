# -*- coding: utf-8 -*-
"""Ý4 — thước "đồng thuận liên môn": trên N lá số mẫu (đầu vào `fixtures/golden/lasotuvi_1000.json`: ngày, canh giờ, giới),
lập báo cáo đời sống Tử vi + Bát tự (cùng hàm sản phẩm), đọc mức 6 mảng của ma trận Chân dung tổng hợp, đếm tỉ lệ cùng mức,
kỳ vọng ngẫu nhiên và Cohen's kappa từng mảng → ghi `app/kb/data/dong_thuan_thong_ke.json` (cho người duyệt; engine chỉ đọc).

    cd engine && .venv/bin/python scripts/dong_thuan_lien_mon.py            # 1.000 lá, ghi tệp
    cd engine && .venv/bin/python scripts/dong_thuan_lien_mon.py --n 50 --khong-ghi   # thử nhanh, chỉ in

Nơi sinh mặc định Hà Nội (lá mẫu không có nơi sinh; mọi lá cùng múi giờ nên không lệch tiết khí theo nơi). Ngày xem cố định
để kết quả tái lập (các mảng "năm nay" phụ thuộc năm xem)."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import time
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

NGAY_XEM = dt.date(2026, 11, 6)
# canh giờ iztro (0 = Tý sớm … 12 = Tý muộn) → giờ đồng hồ giữa canh
_GIO = {0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12, 7: 14, 8: 16, 9: 18, 10: 20, 11: 22, 12: 23}


def dau_vao(n: int | None) -> list[tuple[dt.date, int, str]]:
    g = json.loads((GOC / "fixtures" / "golden" / "lasotuvi_1000.json").read_text("utf-8"))["cases"]
    ds = [(dt.date.fromisoformat(d), ti, "nam" if gt == 1 else "nu") for d, ti, gt, *_ in g]
    return ds[:n] if n else ds


def muc_mot_la(ngay: dt.date, ti: int, gt: str, ngay_xem: dt.date = NGAY_XEM) -> dict:
    from app.luangiai import battu_doi_song as bds  # noqa: PLC0415
    from app.luangiai import dong_thuan_thong_ke as dtk  # noqa: PLC0415
    from app.luangiai import tuvi_doi_song as tds  # noqa: PLC0415
    tv = tds.lap({"ngay": ngay, "ti": ti, "gioi_tinh": gt}, ngay_xem)
    bt = bds.lap({"lich": dt.datetime.combine(ngay, dt.time(_GIO[ti], 30)), "gioi_tinh": gt, "gio_ty": "da_ty"}, ngay_xem)
    return dtk.muc_hai_mon(tv, bt)


def chay(n: int | None, *, ghi: bool, im: bool = False) -> dict:
    from app.luangiai import dong_thuan_thong_ke as dtk  # noqa: PLC0415
    ca = []
    t0 = time.time()
    for i, (ngay, ti, gt) in enumerate(dau_vao(n), 1):
        try:
            ca.append(muc_mot_la(ngay, ti, gt))
        except Exception as e:  # noqa: BLE001 — một lá lỗi không dừng thống kê, ghi ra stderr
            print(f"bỏ lá {ngay} ti={ti} {gt}: {type(e).__name__}: {e}", file=sys.stderr)
        if not im and i % 100 == 0:
            print(f"{i} lá — {time.time() - t0:.0f}s", file=sys.stderr)
    kq = dtk.goi(ca, nguon_la="bo_la_mau_1000 (fixtures/golden, 1.000 đầu vào ngày · canh giờ · giới)", sinh_boi="scripts/dong_thuan_lien_mon.py")
    if ghi:
        dtk.TEP.write_text(json.dumps(kq, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return kq


def bang(kq: dict) -> str:
    dong = [f"{'mảng':<12}{'n':>6}{'cùng mức':>10}{'ngẫu nhiên':>12}{'kappa':>8}  nhãn"]
    for m, t in kq["mang"].items():
        if t["n"]:
            dong.append(f"{m:<12}{t['n']:>6}{t['ti_le_cung'] * 100:>9.1f}%{t['ngau_nhien'] * 100:>11.1f}%{t['kappa']:>8.3f}  {t['nhan']}")
        else:
            dong.append(f"{m:<12}{0:>6}  —")
    return "\n".join(dong)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=None, help="số lá (mặc định: cả 1.000)")
    ap.add_argument("--khong-ghi", action="store_true", help="chỉ in, không ghi app/kb/data/dong_thuan_thong_ke.json")
    a = ap.parse_args()
    kq = chay(a.n, ghi=not a.khong_ghi)
    print(bang(kq))
    print(f"n = {kq['n']} · ngày {kq['ngay']}" + ("" if a.khong_ghi else f" · đã ghi {Path('app/kb/data/dong_thuan_thong_ke.json')}"))
