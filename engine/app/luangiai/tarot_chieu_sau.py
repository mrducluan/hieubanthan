# -*- coding: utf-8 -*-
"""Chặng 3.3B — Chiều sâu lá ngược & Phẩm giá nguyên tố (`POST /v1/tarot/chieu-sau`).

1. Lá Ẩn Phụ ngược (56 lá): lời đời thường riêng từng lá trong `tarot_an_phu_nguoc_kb.json`, dịch sát nghĩa lá ngược của
   Waite (1910), Mathers (1888) là nguồn phụ. Câu trích nguyên văn nằm trong KB (test khớp kho nguồn) — module KHÔNG đọc
   `fixtures/` lúc chạy (ảnh Docker chỉ chép `app/`).
2. Lá Ẩn Chính ngược (22 lá): bản Việt kế thừa `tarot_greer_nguoc.json`; bản Anh dùng lời lá ngược của `tarot_kb`.
   Câu Waite lấy từ `tarot_kb` (trường `trich`).
3. Phẩm giá nguyên tố giữa hai lá liền kề: MỘT bộ tính `calc.tarot.pham_gia` (Book T, «Of the Dignities»).

Tên sách / trường phái chỉ nằm trong `can_cu` ("Vì sao nói vậy") — TR-4.
"""
from __future__ import annotations

from app.calc import tarot as tr_calc
from app.kb import nap, tarot_kb as tkb
from app.kb.loi import L
from app.ngon_ngu import la_viet

# Mã quan hệ hiển thị (giữ tên cũ của hợp đồng API) ← mã Book T của `calc.tarot.pham_gia`.
_MA_QH = {"manh": "cung_nguyen_to", "hop": "tuong_tro", "xung": "doi_nghich", "trung": "trung_tinh"}


def _kb() -> dict:
    return nap.doc("tarot_an_phu_nguoc_kb.json")


def _trich_waite_nguoc(card: dict) -> str:
    w = next((t for t in card.get("trich") or [] if t.get("sach") == "waite_1910"), None) or {}
    return w.get("nguyen_van_nguoc") or ""


def _can_cu_la(khung: dict, waite: str, mathers: str | None) -> list[str]:
    ra = []
    if waite:
        ra.append(khung["can_cu_waite"].format(trich=waite))
    if mathers:
        ra.append(khung["can_cu_mathers"].format(trich=mathers))
    return ra


def phan_tich_chieu_sau(ds_la: list[dict]) -> dict:
    if not ds_la or len(ds_la) > 10:
        raise ValueError(L("chang3.so_la", "Danh sách lá bài cần từ 1 đến 10 lá."))
    kb = _kb()
    khung = kb["khung"]
    vi = la_viet()
    bo_la = tkb.la()
    greer = nap.doc("tarot_greer_nguoc.json")["la"] if vi else {}
    ten_nt = tkb.nguyen_to()

    for item in ds_la:
        if item["id"] not in bo_la:
            raise ValueError(L("chang3.khong_la", "Không có lá bài: {ma}.", ma=item["id"]))

    la_nguoc_chi_tiet: list[dict] = []
    for idx, item in enumerate(ds_la, start=1):
        cid = item["id"]
        if not item.get("nguoc"):
            continue
        card = bo_la[cid]
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
                "can_cu": _can_cu_la(khung, m["trich_waite_1910_nguoc"], m["trich_mathers_1888_nguoc"]),
            })
            continue
        w_rev = _trich_waite_nguoc(card)
        if vi and cid in greer:
            g = greer[cid]
            go_mo, viec = g["mat_tieu_cuc_can_chu_y"], g["huong_chuyen_hoa"]
        else:
            go_mo, viec = card.get("y_nguoc", ""), card.get("viec", "")
        la_nguoc_chi_tiet.append({
            "vi_tri": idx,
            "id": cid,
            "loai": "an_chinh",
            "ten": card["ten"],
            "chieu_nguoc_go_mo": go_mo,
            "viec_nho_go_nut": viec,
            "cau_hoi_tu_soi": card.get("cau_tu_soi", ""),
            "trich_waite_1910_nguoc": w_rev,
            "trich_mathers_1888_nguoc": None,
            "can_cu": _can_cu_la(khung, w_rev, None),
        })

    # Phẩm giá nguyên tố giữa hai lá liền kề — một bộ tính calc.tarot.pham_gia (Book T)
    pham_gia_ds: list[dict] = []
    for i in range(len(ds_la) - 1):
        c1, c2 = bo_la[ds_la[i]["id"]], bo_la[ds_la[i + 1]["id"]]
        nt1, nt2 = c1["nguyen_to"], c2["nguyen_to"]
        qh = _MA_QH[tr_calc.pham_gia(nt1, nt2)]
        pham_gia_ds.append({
            "cap_vi_tri": [i + 1, i + 2],
            "cap_la": f"{c1['ten']} ↔ {c2['ten']}",
            "cap_nguyen_to": f"{ten_nt[nt1]['ten']} – {ten_nt[nt2]['ten']}",
            "quan_he": qh,
            "dien_giai": kb["pham_gia_chuoi"][qh],
            "can_cu": [khung["can_cu_pham_gia"]],
        })

    return {
        "mo_dun": "tarot_chieu_sau",
        "khung": {k: khung[k] for k in ("tieu_de", "phu_de", "cau_noi_menh_ly")},
        "tong_so_la": len(ds_la),
        "so_la_nguoc": len(la_nguoc_chi_tiet),
        "la_nguoc": la_nguoc_chi_tiet,
        "pham_gia_nguyen_to": pham_gia_ds,
        "lien_ket_menh_ly": [dict(x) for x in khung["lien_ket"]],
    }
