# -*- coding: utf-8 -*-
"""SX-H — đo độ phủ đoạn "Sách xưa ghi gì về điều bạn hỏi" trong hỏi đáp Tử vi · Bát tự · Phong thuỷ.

    cd engine && PYTHONPATH=. python scripts/do_sach_ghi_hoi.py [--chi-tiet]

Chạy mọi câu `tra_loi` / `tra_loi_kem_luu_y` của kho có nhãn `fixtures/cau_hoi/huyenhoc_cau_hoi.jsonl` với vài hồ sơ mẫu
(người lớn, người chưa đủ 18 tuổi), đếm: tỉ lệ câu có đoạn sách xưa, số mục A/B/C, chủ đề câu hỏi không có câu sách nào.
Bất biến phải giữ (thoát 1 khi sai): người chưa đủ 18 tuổi không nhận nhóm C; mỗi câu ≤ 2 mục, ≤ 1 nhóm C; câu đặc biệt
(khủng hoảng, từ chối, dẫn hướng) không có đoạn này. Chỉ in số — không ghi câu người dùng ở đâu cả (kho câu là câu mẫu).
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.hoidap import battu, chung, phongthuy, tuvi  # noqa: E402

KHO = Path(__file__).resolve().parents[1] / "fixtures" / "cau_hoi" / "huyenhoc_cau_hoi.jsonl"
XEM = dt.date(2026, 11, 15)
HO_SO = {  # (tên, ngày sinh, giờ, giới tính)
    "lon_nam": (dt.date(1985, 3, 14), 9, "nam"),
    "lon_nu": (dt.date(1992, 10, 2), 15, "nu"),
    "tre": (dt.date(2010, 6, 20), 7, "nam"),
}


def _sinh(mon: str, ngay: dt.date, gio: int, gioi: str) -> dict:
    if mon == "tuvi":
        from app.calc import tuvi_an_sao  # noqa: PLC0415
        return {"ngay": ngay, "ti": tuvi_an_sao.time_index(gio, 0), "gioi_tinh": gioi}
    if mon == "battu":
        return {"lich": dt.datetime(ngay.year, ngay.month, ngay.day, gio, 0), "gioi_tinh": gioi}
    return {"nam": ngay.year, "gioi_tinh": gioi, "ngay": ngay}


def _hoi(mon: str, cau: str, sinh: dict) -> dict:
    if mon == "tuvi":
        return tuvi.tra_loi(cau, "tham_khao", sinh, XEM)
    if mon == "battu":
        return battu.tra_loi(cau, sinh=sinh, ngay_xem=XEM)
    return phongthuy.tra_loi(cau, sinh=sinh, ngay_xem=XEM)


def do(chi_tiet: bool = False) -> tuple[dict, list[str]]:
    cau = [json.loads(x) for x in KHO.read_text("utf-8").splitlines() if x.strip()]
    so: dict = {}
    loi: list[str] = []
    for mon in ("tuvi", "battu", "phongthuy"):
        ds = [c for c in cau if c["mo_dun"] == mon and c.get("doi_tuong") == "ban_than"
              and c.get("xu_ly") in ("tra_loi", "tra_loi_kem_luu_y")]
        for ho, (ngay, gio, gioi) in HO_SO.items():
            sinh = _sinh(mon, ngay, gio, gioi)
            co, nhom, thieu = 0, collections.Counter(), collections.Counter()
            for c in ds:
                kq = _hoi(mon, c["cau_hoi"], sinh)
                s = kq["bang_chung"].get("sach_ghi_hoi")
                pl = kq["phan_loai"]
                if s and pl.get("xu_ly") in chung.DAC_BIET:
                    loi.append(f"{mon}/{ho}: câu đặc biệt có đoạn sách xưa — {c['id']}")
                if not s:
                    thieu[c.get("chu_de") or "?"] += 1
                    continue
                co += 1
                ms = s["muc"]
                nhom.update(m["nhom"] for m in ms)
                if len(ms) > 2 or sum(m["nhom"] == "C" for m in ms) > 1:
                    loi.append(f"{mon}/{ho}: quá số mục — {c['id']}")
                if ho == "tre" and any(m["nhom"] == "C" for m in ms):
                    loi.append(f"{mon}/{ho}: người chưa đủ 18 tuổi nhận nhóm C — {c['id']}")
            k = f"{mon}.{ho}"
            so[k] = {"so_cau": len(ds), "co_sach": co, "ty_le": round(co / max(1, len(ds)), 3),
                     "nhom": dict(sorted(nhom.items()))}
            if chi_tiet:
                so[k]["chu_de_thieu"] = dict(thieu.most_common(8))
    return so, loi


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--chi-tiet", action="store_true")
    a = ap.parse_args()
    so, loi = do(a.chi_tiet)
    for k, v in so.items():
        print(f"{k:22s} {v}")
    for x in loi[:40]:
        print("LỖI", x)
    sys.exit(1 if loi else 0)


if __name__ == "__main__":
    main()
