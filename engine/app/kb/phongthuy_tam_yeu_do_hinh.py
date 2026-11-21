# -*- coding: utf-8 -*-
"""Tầng KB — tra cứu ĐỒ HÌNH & SƠ ĐỒ Cửa – Chủ – Bếp của Dương Trạch Tam Yếu (Triệu Cửu Phong).

Chỉ TRA `phongthuy_tam_yeu_do_hinh.json` và `phongthuy_tam_yeu.json` (git là nguồn) + ghép lưới 3×3 tổng hợp.
Tuân thủ BM-1 (`app/cong_khai.py`): mọi hàm trả ra API công khai chỉ giữ tên sách, lời Việt, lưới 3×3, Mermaid
và phép tính Du Niên; KHÔNG để lọt `chart_id`, `trang_pdf`, `nguon_thien`, tên kho nội bộ hay nguyên văn OCR chưa soát.
"""
from __future__ import annotations

from app.kb import nap

TEP_DO_HINH = "phongthuy_tam_yeu_do_hinh.json"
TEP_TAM_YEU = "phongthuy_tam_yeu.json"
DUONG_CUM = "/phong-thuy/tam-yeu/do-hinh"
NGUON_HIEN_THI = "Dương Trạch Tam Yếu (Triệu Cửu Phong, đời Thanh)"

_LUOI_POS: dict[str, tuple[int, int]] = {
    "Tốn": (0, 0),
    "Ly": (0, 1),
    "Khôn": (0, 2),
    "Chấn": (1, 0),
    "Đoài": (1, 2),
    "Cấn": (2, 0),
    "Khảm": (2, 1),
    "Càn": (2, 2),
}

_KHOA_DANH_MUC = ("ma", "ten", "ten_han", "nhom", "mo_ta")
_KHOA_SO_DO_NHA = (
    "ma", "cua", "chu", "huong_cua", "huong_chu", "du_nien",
    "cung_nhom", "quan_he_ngu_hanh", "bep_hop", "bep_nen_tranh", "luoi_3x3", "mermaid",
)
_KHOA_SO_DO_BEP = (
    "ma", "bep", "cua", "huong_bep", "huong_cua", "du_nien",
    "hanh_bep", "hanh_cua", "quan_he_ngu_hanh", "luoi_3x3", "mermaid",
)


@nap.nho
def _dh() -> dict:
    try:
        d = nap.doc(TEP_DO_HINH)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


@nap.nho
def _ty() -> dict:
    try:
        d = nap.doc(TEP_TAM_YEU)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def meta() -> dict:
    d = _dh()
    tk = d.get("thong_ke") or {}
    return {
        "trang_thai": d.get("trang_thai", "nhap_ban_bien_tap"),
        "source_id": d.get("source_id", "duong_trach_tam_yeu"),
        "school_id": d.get("school_id", "bat_trach"),
        "thong_ke": {
            "so_do_hinh_ly_thuyet": int(tk.get("so_do_hinh_ly_thuyet", 0)),
            "so_do_nha": int(tk.get("so_do_nha", 0)),
            "so_do_bep": int(tk.get("so_do_bep", 0)),
            "tong_muc_luc_bieu_do": int(tk.get("tong_muc_luc_bieu_do", 0)),
        },
    }


def tat_ca() -> list[dict]:
    return _dh().get("do_hinh_ly_thuyet") or []


def danh_muc() -> list[dict]:
    """Mục lục 10 đồ hình lý thuyết (gọn, không mang cấu trúc nặng, sạch BM-1)."""
    return [
        {**{k: x[k] for k in _KHOA_DANH_MUC}, "duong": f"{DUONG_CUM}/{x['ma']}"}
        for x in tat_ca()
    ]


def chi_tiet(ma: str) -> dict | None:
    """Chi tiết một đồ hình lý thuyết (sạch BM-1: không trả trang_pdf / nguon_thien / nguyên văn OCR)."""
    x = next((item for item in tat_ca() if item["ma"] == ma), None)
    if x is None:
        return None
    return {
        "ma": x["ma"],
        "ten": x["ten"],
        "ten_han": x["ten_han"],
        "nhom": x["nhom"],
        "mo_ta": x["mo_ta"],
        "cau_truc": x["cau_truc"],
        "mermaid": x["mermaid"],
        "duong": f"{DUONG_CUM}/{x['ma']}",
        "nguon_hien_thi": NGUON_HIEN_THI,
        "trang_thai": meta()["trang_thai"],
        "khac": [item for item in danh_muc() if item["ma"] != ma],
    }


def _luoi_ba_diem(cua: str, chu: str, bep: str) -> list[list[str]]:
    """Tạo lưới Cửu Cung 3×3 đặt đồng thời Cửa, Chủ và Bếp."""
    grid = [
        ["Tốn (Đông Nam)", "Ly (Nam)", "Khôn (Tây Nam)"],
        ["Chấn (Đông)", "Trung Cung", "Đoài (Tây)"],
        ["Cấn (Đông Bắc)", "Khảm (Bắc)", "Càn (Tây Bắc)"],
    ]
    buckets: dict[str, list[str]] = {}
    for nhan, q in (("Cửa", cua), ("Chủ", chu), ("Bếp", bep)):
        buckets.setdefault(q, []).append(nhan)
    for q, labels in buckets.items():
        r, c = _LUOI_POS[q]
        grid[r][c] = f"{q} [{' + '.join(labels)}]"
    return grid


def so_do_cua_chu_bep(cua: str, chu: str | None = None, bep: str | None = None) -> dict:
    """Tra sơ đồ lưới 3×3 + Mermaid + tóm ý cho tổ hợp Cửa – Chủ – Bếp (sạch BM-1)."""
    dh = _dh()
    ty = _ty()
    nha_map = dh.get("so_do_64_nha") or {}
    bep_map = dh.get("so_do_64_bep") or {}
    ty_nha = ty.get("nha") or {}
    ty_bep = ty.get("bep") or {}

    ra: dict = {
        "cua": cua,
        "nguon_hien_thi": NGUON_HIEN_THI,
    }

    if chu:
        key = f"{cua}_{chu}"
        sd = nha_map.get(key)
        if sd:
            item = {k: sd[k] for k in _KHOA_SO_DO_NHA if k in sd}
            if key in ty_nha and ty_nha[key].get("y"):
                item["tom_y"] = ty_nha[key]["y"]
            ra["so_do_nha"] = item

    if bep:
        key_b = f"{bep}_{cua}"
        sd_b = bep_map.get(key_b)
        if sd_b:
            item_b = {k: sd_b[k] for k in _KHOA_SO_DO_BEP if k in sd_b}
            if key_b in ty_bep and ty_bep[key_b].get("y"):
                item_b["tom_y"] = ty_bep[key_b]["y"]
            ra["so_do_bep"] = item_b

    if chu and bep and "so_do_nha" in ra and "so_do_bep" in ra:
        dn_nha = ra["so_do_nha"]["du_nien"]
        dn_bep = ra["so_do_bep"]["du_nien"]
        ra["luoi_tong_hop_3x3"] = _luoi_ba_diem(cua, chu, bep)
        ra["mermaid_tong_hop"] = (
            f"flowchart LR\n"
            f"  M[Cửa: {cua} · {ra['so_do_nha']['huong_cua']}] -->|{dn_nha}| C[Chủ: {chu} · {ra['so_do_nha']['huong_chu']}]\n"
            f"  M -->|{dn_bep}| B[Bếp: {bep} · {ra['so_do_bep']['huong_bep']}]\n"
            f"  C -. Phối hợp .- B"
        )

    if not chu and not bep:
        # Chưa chọn Chủ/Bếp → trả danh sách 8 thế nhà ứng với Cửa đã chọn để UI gợi ý chọn tiếp.
        ds_8 = []
        for q in _LUOI_POS:
            k = f"{cua}_{q}"
            if k in nha_map:
                sd = nha_map[k]
                ds_8.append({
                    "chu": q,
                    "huong_chu": sd["huong_chu"],
                    "du_nien": sd["du_nien"],
                    "cung_nhom": sd["cung_nhom"],
                    "quan_he_ngu_hanh": sd["quan_he_ngu_hanh"],
                })
        ra["cac_the_nha"] = ds_8

    return ra


def muc_luc_bieu_do(
    loai: str | None = None,
    quyen: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """Mục lục 251 biểu đồ minh hoạ đã làm sạch BM-1 (không chart_id, không trang_pdf, không tên kho nội bộ)."""
    ds = _dh().get("muc_luc_bieu_do") or []
    filtered = []
    for idx, x in enumerate(ds, start=1):
        if loai and x.get("loai") != loai:
            continue
        if quyen and x.get("quyen") != quyen:
            continue
        filtered.append({
            "thu_tu": idx,
            "loai": x["loai"],
            "loai_vi": x["loai_vi"],
            "quyen_vi": x["quyen_vi"],
            "trang_sach": x.get("trang_sach"),
            "mo_ta": f"{x['loai_vi']} thuộc {x['quyen_vi']}.",
        })
    tong = len(filtered)
    slice_items = filtered[offset : offset + limit]
    return {
        "tong": tong,
        "offset": offset,
        "limit": limit,
        "nguon_hien_thi": NGUON_HIEN_THI,
        "bieu_do": slice_items,
    }
