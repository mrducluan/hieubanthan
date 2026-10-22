# -*- coding: utf-8 -*-
"""Thống kê bảng hỷ / kỵ theo cách cục (KB `battu_doi_song_kb.json` → `cach.*`) — phục vụ người rành Tử Bình duyệt.

Chạy:
    .venv/bin/python scripts/thong_ke_hy_ky.py                      # bảng hiện hành trên mẫu 300 lá
    .venv/bin/python scripts/thong_ke_hy_ky.py --de-xuat sua.json   # so với bảng đề xuất (chỉ các cách cục có trong tệp)

`sua.json` = {"<ma cách>": {"hy": [...nhóm], "ky": [...], "than_nhuoc": {"hy": [...], "ky": [...]}, ...}} — nhóm là
"Tỷ Kiếp" / "Thực Thương" / "Tài" / "Quan Sát" / "Ấn". Script chỉ ĐỌC engine (một bộ tính), không sửa KB.

In ra: mỗi cách cục chiếm bao nhiêu lá, thân mạnh/yếu, bao nhiêu % mảng đời và đại vận hai cách đọc khác nhau; với
--de-xuat: bao nhiêu % lá đổi nhãn ở từng mảng / đại vận và phân bố nhãn trước → sau.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.kb import battu_doi_song_kb as kb  # noqa: E402
from app.luangiai import battu_doi_song as bt  # noqa: E402

XEM = dt.date(2026, 10, 21)
MANG = ("tong_quan", "ngu_hanh", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh")


def mau(n: int, seed: int) -> list[dict]:
    r = random.Random(seed)
    return [{"lich": dt.datetime(r.randint(1950, 2008), r.randint(1, 12), r.randint(1, 28), r.randint(0, 23),
                                 r.choice((0, 30))), "gioi_tinh": r.choice(("nam", "nu"))} for _ in range(n)]


def doc(sinh: dict) -> dict:
    ls = bt._la_so(sinh)
    pt = bt.phan_tich(ls)
    cm = bt.cham_mang(pt, XEM.year - sinh["lich"].year)
    tgb = bt.thoi_gian_bieu(pt, XEM)
    return {"cach": pt["cach_2"]["ma"], "than": pt["than"],
            "mang": {m: (cm[m].get("muc_cach_1"), cm[m].get("muc_cach_2"), cm[m]["muc"]) for m in MANG if m in cm},
            "van": [(g["muc_cach_1"], g["muc_cach_2"], g["muc"]) for g in tgb]}


def chay(ds: list[dict]) -> list[dict]:
    return [doc(s) for s in ds]


def pct(a: int, b: int) -> str:
    return f"{100 * a / b:.0f}%" if b else "–"


def in_hien_hanh(kq: list[dict]) -> None:
    n = len(kq)
    theo = collections.defaultdict(list)
    for x in kq:
        theo[x["cach"]].append(x)
    print(f"Mẫu {n} lá (1950–2008, ngày xem {XEM}). Mảng đời = {', '.join(MANG)}.\n")
    print("| Cách cục | Số lá | Thân yếu / cân / mạnh | Mảng đời hai cách khác nhau | Đại vận hai cách khác nhau |")
    print("|---|---|---|---|---|")
    for ma in sorted(theo, key=lambda m: -len(theo[m])):
        xs = theo[ma]
        th = collections.Counter(x["than"] for x in xs)
        mk = sum(1 for x in xs for v in x["mang"].values() if v[0] and v[0] != v[1])
        mt = sum(1 for x in xs for v in x["mang"].values() if v[0])
        vk = sum(1 for x in xs for v in x["van"] if v[0] != v[1])
        vt = sum(len(x["van"]) for x in xs)
        print(f"| {ma} | {len(xs)} ({pct(len(xs), n)}) | {th['yeu']} / {th['can_bang']} / {th['manh']} | "
              f"{pct(mk, mt)} | {pct(vk, vt)} |")


def in_so_sanh(truoc: list[dict], sau: list[dict], cac_cach: set[str]) -> None:
    chon = [i for i, x in enumerate(truoc) if x["cach"] in cac_cach]
    print(f"\nSo với bảng đề xuất — {len(chon)} lá thuộc {', '.join(sorted(cac_cach))}:\n")
    print("| Mục | Lá đổi nhãn | Thuận lợi trước → sau | Cần lưu ý trước → sau |")
    print("|---|---|---|---|")
    for m in MANG:
        a = [truoc[i]["mang"][m][2] for i in chon if m in truoc[i]["mang"]]
        b = [sau[i]["mang"][m][2] for i in chon if m in sau[i]["mang"]]
        doi = sum(1 for x, y in zip(a, b) if x != y)
        ca, cb = collections.Counter(a), collections.Counter(b)
        print(f"| {m} | {pct(doi, len(a))} | {pct(ca['thuan'], len(a))} → {pct(cb['thuan'], len(b))} | "
              f"{pct(ca['can_chu_dong'], len(a))} → {pct(cb['can_chu_dong'], len(b))} |")
    a = [v[2] for i in chon for v in truoc[i]["van"]]
    b = [v[2] for i in chon for v in sau[i]["van"]]
    ca, cb = collections.Counter(a), collections.Counter(b)
    print(f"| đại vận | {pct(sum(1 for x, y in zip(a, b) if x != y), len(a))} | {pct(ca['thuan'], len(a))} → "
          f"{pct(cb['thuan'], len(b))} | {pct(ca['can_chu_dong'], len(a))} → {pct(cb['can_chu_dong'], len(b))} |")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=300)
    ap.add_argument("--seed", type=int, default=20261022)
    ap.add_argument("--de-xuat", type=Path)
    a = ap.parse_args()
    ds = mau(a.n, a.seed)
    truoc = chay(ds)
    in_hien_hanh(truoc)
    if a.de_xuat:
        sua = json.loads(a.de_xuat.read_text(encoding="utf-8"))
        goc = kb.cach

        def cach_moi(ma: str):
            o = goc(ma)
            return {**(o or {}), **sua[ma]} if ma in sua else o
        kb.cach = cach_moi
        try:
            sau = chay(ds)
        finally:
            kb.cach = goc
        in_so_sanh(truoc, sau, set(sua))


if __name__ == "__main__":
    main()
