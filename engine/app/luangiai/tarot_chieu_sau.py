# -*- coding: utf-8 -*-
"""Chặng 3.3B — Chiều sâu 56 Lá Ẩn Phụ ngược & Phẩm giá nguyên tố (`POST /v1/tarot/chieu-sau`).

1. Lá Ẩn Phụ ngược (56 lá): nguyên văn công cộng Waite (1910) & Mathers (1888) + lời gỡ mở hành vi 2 mặt (0% Bunning/Pollack).
2. Lá Ẩn Chính ngược (22 lá): kế thừa `tarot_greer_nguoc.json` ở bản Việt và Waite (1910) + lời gỡ mở ở bản Anh.
3. Phẩm giá nguyên tố (`Liber LXXVIII` / `Book T`): xét tương tác nguyên tố giữa các lá liền kề trong trải bài ≥ 2 lá.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.kb import nap, tarot_kb as tkb
from app.ngon_ngu import la_viet

_WAITE_PATH = Path(__file__).resolve().parents[2] / "fixtures" / "nguon" / "tarot_waite_1910.json"

_CAP_TUONG_TRO = frozenset({frozenset({"hoa", "khi"}), frozenset({"thuy", "dat"})})
_CAP_DOI_NGHICH = frozenset({frozenset({"hoa", "thuy"}), frozenset({"khi", "dat"})})
_TEN_NT = {
    True: {"hoa": "Lửa", "thuy": "Nước", "khi": "Khí", "dat": "Đất"},
    False: {"hoa": "Fire", "thuy": "Water", "khi": "Air", "dat": "Earth"},
}


@lru_cache(maxsize=1)
def _waite_raw() -> dict:
    return json.loads(_WAITE_PATH.read_text(encoding="utf-8"))


def _kb() -> dict:
    return nap.doc("tarot_an_phu_nguoc_kb.json")


def _quan_he_hai_nt(nt_a: str, nt_b: str) -> str:
    if nt_a == nt_b:
        return "cung_nguyen_to"
    cap = frozenset({nt_a, nt_b})
    if cap in _CAP_TUONG_TRO:
        return "tuong_tro"
    if cap in _CAP_DOI_NGHICH:
        return "doi_nghich"
    return "trung_tinh"


def phan_tich_chieu_sau(ds_la: list[dict]) -> dict:
    if not ds_la or len(ds_la) > 10:
        raise ValueError("Danh sách lá bài cần từ 1 đến 10 lá.")
    kb = _kb()
    khung = kb["khung"]
    vi = la_viet()
    bo_la = tkb.la()
    greer = nap.doc("tarot_greer_nguoc.json")["la"] if vi else {}
    waite = _waite_raw()

    la_nguoc_chi_tiet: list[dict] = []
    for idx, item in enumerate(ds_la, start=1):
        cid = item["id"]
        if cid not in bo_la:
            raise ValueError(f"Không có lá bài: {cid}")
        if not item.get("nguoc"):
            continue
        card_meta = bo_la[cid]
        if cid in kb["la_an_phu"]:
            m = kb["la_an_phu"][cid]
            la_nguoc_chi_tiet.append({
                "vi_tri": idx,
                "id": cid,
                "loai": "an_phu",
                "ten": m["ten"],
                "chieu_nguoc_go_mo": m["chieu_nguoc_go_mo"],
                "viec_nho_go_nut": m["viec_nho_go_nut"],
                "cau_hoi_tu_soi": m["cau_hoi_tu_soi"],
                "trich_waite_1910_nguoc": m["trich_waite_1910_nguoc"],
                "trich_mathers_1888_nguoc": m["trich_mathers_1888_nguoc"],
            })
        else:
            w_rev = (waite.get(cid) or {}).get("y_nguoc") or (waite.get(cid) or {}).get("them_nguoc") or ""
            if vi and cid in greer:
                g = greer[cid]
                la_nguoc_chi_tiet.append({
                    "vi_tri": idx,
                    "id": cid,
                    "loai": "an_chinh",
                    "ten": card_meta["ten"],
                    "chieu_nguoc_go_mo": g["mat_tieu_cuc_can_chu_y"],
                    "viec_nho_go_nut": g["huong_chuyen_hoa"],
                    "cau_hoi_tu_soi": card_meta.get("cau_tu_soi", ""),
                    "trich_waite_1910_nguoc": w_rev,
                    "trich_mathers_1888_nguoc": None,
                })
            else:
                ten_en = card_meta.get("en", cid)
                la_nguoc_chi_tiet.append({
                    "vi_tri": idx,
                    "id": cid,
                    "loai": "an_chinh",
                    "ten": ten_en,
                    "chieu_nguoc_go_mo": f"Reversed {ten_en} invites turning its archetype inward first, pausing hasty outer reaction until inner clarity settles.",
                    "viec_nho_go_nut": "Grounding step: review one concrete assumption quietly before committing to the next move.",
                    "cau_hoi_tu_soi": f"Where is the lesson of {ten_en} asking for patience rather than force right now?",
                    "trich_waite_1910_nguoc": w_rev,
                    "trich_mathers_1888_nguoc": None,
                })

    # Phẩm giá nguyên tố giữa các cặp lá liền kề
    pham_gia_ds: list[dict] = []
    for i in range(len(ds_la) - 1):
        c1, c2 = bo_la[ds_la[i]["id"]], bo_la[ds_la[i + 1]["id"]]
        nt1, nt2 = c1["nguyen_to"], c2["nguyen_to"]
        loai_qh = _quan_he_hai_nt(nt1, nt2)
        ten1 = c1["ten"] if vi else c1["en"]
        ten2 = c2["ten"] if vi else c2["en"]
        pham_gia_ds.append({
            "cap_vi_tri": [i + 1, i + 2],
            "cap_la": f"{ten1} ↔ {ten2}",
            "cap_nguyen_to": f"{_TEN_NT[vi][nt1]} – {_TEN_NT[vi][nt2]}",
            "quan_he": loai_qh,
            "dien_giai": kb["pham_gia_chuoi"][loai_qh],
        })

    return {
        "mo_dun": "tarot_chieu_sau",
        "khung": khung,
        "tong_so_la": len(ds_la),
        "so_la_nguoc": len(la_nguoc_chi_tiet),
        "la_nguoc": la_nguoc_chi_tiet,
        "pham_gia_nguyen_to": pham_gia_ds,
        "lien_ket_menh_ly": [
            {"ten": "Đối chiếu nhịp 12 cung Tử vi" if vi else "Compare 12-Palace Zi Wei Timing", "duong": "/tu-vi"},
            {"ten": "Đối chiếu cấu trúc Ngũ hành Bát tự" if vi else "Compare BaZi Five-Element Structure", "duong": "/bat-tu"},
        ],
    }
