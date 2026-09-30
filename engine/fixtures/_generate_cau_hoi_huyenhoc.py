# -*- coding: utf-8 -*-
"""Sinh kho câu hỏi Huyền học có nhãn: fixtures/cau_hoi/huyenhoc_cau_hoi.jsonl

Tất định. Nguồn: `_cau_hoi_huyenhoc_goc.py`. Biến thể có kiểm soát như kho thần số:
goc · boi_canh · mau (nhân theo danh mục sao/cung/quẻ/can/hướng) · khong_dau.

Chạy:  python fixtures/_generate_cau_hoi_huyenhoc.py
"""
from __future__ import annotations

import hashlib
import itertools
import json
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parent
sys.path.insert(0, str(GOC))
sys.path.insert(0, str(GOC.parent))
import _cau_hoi_huyenhoc_goc as G  # noqa: E402
from _generate_cau_hoi_thanso import khong_dau  # noqa: E402
from app.calc.kinhdich_vendor import TEN  # noqa: E402

OUT = GOC / "cau_hoi" / "huyenhoc_cau_hoi.jsonl"
DANH_MUC = {"CHINH_TINH": G.CHINH_TINH, "CUNG": G.CUNG, "TU_HOA": G.TU_HOA,
            "THIEN_CAN": G.THIEN_CAN, "THAP_THAN": G.THAP_THAN, "HUONG": G.HUONG,
            "MENH_QUAI": G.MENH_QUAI, "DU_NIEN": G.DU_NIEN,
            "QUE_64": [TEN[i] for i in range(1, 65)],
            "LINH_VUC_KD": G.LINH_VUC_KD, "MUA": G.MUA}
BOI_CANH = [
    ("Em sinh năm 1995, ", {"tuvi", "battu", "phongthuy"}),
    ("Tôi là nữ, 34 tuổi, ", {"tuvi", "battu", "kinhdich"}),
    ("Mình đang làm kinh doanh, ", {"tuvi", "battu", "kinhdich", "phongthuy"}),
    ("Tôi sắp mua nhà, ", {"phongthuy", "kinhdich"}),
    ("Em đang rất rối, ", {"kinhdich", "tuvi"}),
    ("Tôi năm nay 50 tuổi, ", {"tuvi", "battu", "phongthuy"}),
]


def _bam(s: str) -> int:
    return int(hashlib.sha256(s.encode()).hexdigest(), 16)


def sinh() -> list[dict]:
    rows: list[dict] = []

    def them(cau, md, lv, cd, yd, dt, xl, cm, can, nguon):
        rows.append({"cau_hoi": cau, "mo_dun": md, "linh_vuc": lv, "chu_de": cd, "y_dinh": yd,
                     "doi_tuong": dt, "xu_ly": xl, "che_do": cm, "can": list(can),
                     "nguon_sinh": nguon})

    goc = []
    for md, lv, cd, yd, dt, xl, cm, can, ds in G.NHOM:
        for c in ds:
            them(c, md, lv, cd, yd, dt, xl, cm, can, "goc")
            goc.append(rows[-1])

    for md, lv, cd, yd, xl, can, mau, bien in G.MAU:
        for combo in itertools.product(*(DANH_MUC[b] for b in bien)):
            cau = mau.format(**dict(zip("ab", combo)))
            them(cau, md, lv, cd, yd, "ban_than", xl, "tham_khao", can, "mau")

    for r in goc:
        if r["doi_tuong"] != "ban_than" or r["xu_ly"] not in ("tra_loi", "tra_loi_kem_luu_y"):
            continue
        hop = [bc for bc, mds in BOI_CANH if r["mo_dun"] in mds]
        h = _bam(r["cau_hoi"])
        for bc in sorted({hop[h % len(hop)], hop[(h // 7) % len(hop)]}):
            them(bc + r["cau_hoi"][0].lower() + r["cau_hoi"][1:], r["mo_dun"], r["linh_vuc"],
                 r["chu_de"], r["y_dinh"], "ban_than", r["xu_ly"], r["che_do"], r["can"],
                 "boi_canh")

    for r in list(rows):
        if r["nguon_sinh"] == "goc" and (_bam(r["cau_hoi"]) % 3 == 0 or r["xu_ly"] == "an_toan"):
            them(khong_dau(r["cau_hoi"]), r["mo_dun"], r["linh_vuc"], r["chu_de"], r["y_dinh"],
                 r["doi_tuong"], r["xu_ly"], r["che_do"], r["can"], "khong_dau")

    seen, out = set(), []
    for r in rows:
        if r["cau_hoi"] not in seen:
            seen.add(r["cau_hoi"])
            out.append(r)
    return out


def main() -> None:
    rows = sinh()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        for i, r in enumerate(rows, 1):
            f.write(json.dumps({"id": f"hhq{i:05d}", **r}, ensure_ascii=False) + "\n")
    print(f"{len(rows)} câu -> {OUT}")


if __name__ == "__main__":
    main()
