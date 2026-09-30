# -*- coding: utf-8 -*-
"""Sinh kho câu hỏi thần số có nhãn: fixtures/cau_hoi/thanso_cau_hoi.jsonl

Tất định (không random): chạy lại luôn ra cùng một file. Nguồn là câu hỏi gốc
soạn tay trong `_cau_hoi_goc.py`; script chỉ nhân biến thể có kiểm soát:
  - goc        câu hỏi gốc
  - boi_canh   thêm bối cảnh người hỏi ("Em là mẹ bỉm hai con, ...")
  - co_so      người hỏi tự nêu con số ("Số chủ đạo 7 hợp nghề gì?")
  - hop_doi    cặp số ("Số chủ đạo 3 và 8 có hợp nhau không?")
  - khong_dau  gõ không dấu, chữ thường — rất phổ biến, bộ định tuyến phải chịu được

Chạy:  python fixtures/_generate_cau_hoi_thanso.py
"""
from __future__ import annotations

import hashlib
import itertools
import json
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _cau_hoi_goc import BOI_CANH, MAU_CO_SO, MAU_HOP_DOI, NHOM  # noqa: E402

OUT = Path(__file__).parent / "cau_hoi" / "thanso_cau_hoi.jsonl"
SO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]


def khong_dau(s: str) -> str:
    s = s.replace("Đ", "D").replace("đ", "d")
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn").lower()


def _bam(s: str) -> int:
    return int(hashlib.sha256(s.encode()).hexdigest(), 16)


def sinh() -> list[dict]:
    rows: list[dict] = []

    def them(cau, lv, cd, yd, dt, xl, can, nguon):
        rows.append({"cau_hoi": cau, "linh_vuc": lv, "chu_de": cd, "y_dinh": yd,
                     "doi_tuong": dt, "xu_ly": xl, "can": list(can), "nguon_sinh": nguon})

    goc_rows = []
    for lv, cd, yd, dt, xl, can, cau_list in NHOM:
        for c in cau_list:
            them(c, lv, cd, yd, dt, xl, can, "goc")
            goc_rows.append(rows[-1])

    # Bối cảnh: mỗi câu gốc về bản thân nhận tối đa 2 bối cảnh hợp lĩnh vực,
    # chọn theo băm (tất định) để phân bố đều.
    ten_bc = sorted(BOI_CANH)
    for r in goc_rows:
        if r["doi_tuong"] != "ban_than" or r["xu_ly"] not in ("tra_loi", "tra_loi_kem_luu_y"):
            continue
        hop = [k for k in ten_bc if r["linh_vuc"] in BOI_CANH[k][1]]
        if not hop:
            continue
        h = _bam(r["cau_hoi"])
        chon = {hop[h % len(hop)], hop[(h // 7) % len(hop)]}
        for k in sorted(chon):
            tien_to = BOI_CANH[k][0]
            cau = tien_to + r["cau_hoi"][0].lower() + r["cau_hoi"][1:]
            them(cau, r["linh_vuc"], r["chu_de"], r["y_dinh"], "ban_than",
                 r["xu_ly"], r["can"], f"boi_canh:{k}")

    for lv, cd, yd, xl, can, mau in MAU_CO_SO:
        if "{n}" in mau:
            for n in SO:
                them(mau.format(n=n), lv, cd, yd, "ban_than", xl, can, "co_so")
        elif "{k}" in mau:
            for k in range(1, 10):
                them(mau.format(k=k), lv, cd, yd, "ban_than", xl, can, "co_so")
        elif "{d}" in mau:
            for d in range(1, 32):
                them(mau.format(d=d), lv, cd, yd, "ban_than", xl, can, "co_so")

    for mau in MAU_HOP_DOI:
        for a, b in itertools.combinations_with_replacement(SO, 2):
            them(mau.format(a=a, b=b), "hop_doi", "cap_so", "hop_nhau", "hai_nguoi",
                 "tra_loi", ["hop_doi"], "hop_doi")

    # Không dấu: 1/3 số câu (theo băm), kể cả câu an toàn — phải nhận ra
    # "toi khong muon song nua" y như có dấu.
    for r in list(rows):
        if r["nguon_sinh"] in ("goc", "co_so") and (
                _bam(r["cau_hoi"]) % 3 == 0 or r["xu_ly"] == "an_toan"):
            them(khong_dau(r["cau_hoi"]), r["linh_vuc"], r["chu_de"], r["y_dinh"],
                 r["doi_tuong"], r["xu_ly"], r["can"], "khong_dau")

    # Khử trùng lặp theo nội dung, gán id ổn định.
    seen, out = set(), []
    for r in rows:
        if r["cau_hoi"] in seen:
            continue
        seen.add(r["cau_hoi"])
        out.append(r)
    for i, r in enumerate(out, 1):
        r["id"] = f"tsq{i:05d}"
    return out


def main() -> None:
    rows = sinh()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps({"id": r.pop("id"), **r}, ensure_ascii=False) + "\n")
    print(f"{len(rows)} câu -> {OUT}")


if __name__ == "__main__":
    main()
