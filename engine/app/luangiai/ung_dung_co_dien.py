# -*- coding: utf-8 -*-
"""Chặng 1 — RULES tất định cho lớp 'Học thuật Cổ điển & Ngũ hành' (`ung_dung_co_dien`).

Đọc trực tiếp dữ kiện đã tính của từng báo cáo (Bát tự: hai cách lấy dụng thần trong `bieu_do`; Tử vi: hành chính tinh
ba cung Mệnh – Quan Lộc – Tài Bạch; Phong thuỷ: cặp sao Sơn – Hướng – Lưu niên trên trạch bàn Huyền Không) để dựng gói
ứng dụng gọn nhẹ (< 3 KB, không LLM, không vật phẩm mê tín, không mâu thuẫn hướng quay Bát trạch).
"""
from __future__ import annotations

import datetime as dt

from app.calc import huyen_khong as hk
from app.kb import nap
from app.kb.loi import danh_sach

_TEP = "ung_dung_co_dien_kb.json"
_CHU_SAO_HANH = {
    "Tử Vi": "Thổ", "Thiên Cơ": "Mộc", "Thái Dương": "Hỏa", "Vũ Khúc": "Kim",
    "Thiên Đồng": "Thủy", "Liêm Trinh": "Hỏa", "Thiên Phủ": "Thổ", "Thái Âm": "Thủy",
    "Tham Lang": "Mộc", "Cự Môn": "Thủy", "Thiên Tướng": "Thủy", "Thiên Lương": "Thổ",
    "Thất Sát": "Kim", "Phá Quân": "Thủy",
}
_CHU_HANH_NORM = {"Hoả": "Hỏa", "Thuỷ": "Thủy"}
_HANH_SLUG = {"Kim": "kim", "Mộc": "moc", "Thủy": "thuy", "Hỏa": "hoa", "Thổ": "tho"}


def _kb() -> dict:
    return nap.doc(_TEP)


def _norm_hanh(h: str) -> str:
    return _CHU_HANH_NORM.get(h, h)


def _the_hanh(k: dict, hanh: str) -> dict:
    h = _norm_hanh(hanh)
    o = k["ngu_hanh"][h]
    return {
        "hanh_ma": _HANH_SLUG[h],
        "ten_hanh": o["ten"],
        "mau_sac": o["mau_sac"],
        "chat_lieu": o["chat_lieu"],
        "phuong_vi": o["phuong_vi"],
        "khung_gio": o["khung_gio"],
        "thoi_quen": list(o["thoi_quen"]),
    }


def tu_bao_cao_battu(bc: dict) -> dict | None:
    """Dựng gói ứng dụng Ngũ hành cổ điển từ báo cáo `battu_doi_song` (giữ đúng luật hai cách không tự chọn)."""
    c_nh = next((c for c in bc.get("chuong", []) if c.get("ma") == "ngu_hanh"), None)
    bd = (c_nh or {}).get("bieu_do") or {}
    ds_hanh = bd.get("hanh") or []
    if not ds_hanh:
        return None
    k = _kb()
    c1 = [_norm_hanh(x["hanh"]) for x in ds_hanh if x.get("cach_1")]
    c2 = [_norm_hanh(x["hanh"]) for x in ds_hanh if x.get("cach_2")]
    chung = [h for h in c1 if h in c2]
    ten_h = lambda ds: danh_sach([k["ngu_hanh"][h]["ten"] for h in ds]) if ds else ""  # noqa: E731

    if chung:
        chon = chung[:2]
        ghi_chu = k["ghi_chu_hai_cach"]["cung_can"].format(ds=ten_h(chon))
    elif c1 or c2:
        chon = list(dict.fromkeys([*c1[:1], *c2[:1]]))[:2]
        ghi_chu = k["ghi_chu_hai_cach"]["khac_nhau"].format(c1=ten_h(c1) or "—", c2=ten_h(c2) or "—")
    else:
        nc = _norm_hanh(bd.get("nhat_chu") or "Thổ")
        chon = [nc]
        ghi_chu = k["ghi_chu_hai_cach"]["trung_hoa"]

    return {
        "ma": "battu_co_dien",
        "tieu_de": k["tieu_de"]["battu"],
        "nguyen_tac_uu_tien": k["nguyen_tac_uu_tien"]["battu"],
        "tom_tat_dung_than": ghi_chu,
        "hanh_ung_dung": [_the_hanh(k, h) for h in chon],
    }


def _rut_hanh_tuvi(bc: dict) -> list[str]:
    """Đọc chính tinh từ `can_cu` của các chương Mệnh (`tong_quan`), Quan Lộc (`su_nghiep`), Tài Bạch (`tien_bac`) —
    hoạt động giống hệt nhau ở cả bản Việt lẫn bản Anh nhờ quét tên sao chuẩn hoặc mã hộp `ma_mau`."""
    slug_map = {
        "tu_vi": "Thổ", "thien_co": "Mộc", "thai_duong": "Hỏa", "vu_khuc": "Kim",
        "thien_dong": "Thủy", "liem_trinh": "Hỏa", "thien_phu": "Thổ", "thai_am": "Thủy",
        "tham_lang": "Mộc", "cu_mon": "Thủy", "thien_tuong": "Thủy", "thien_luong": "Thổ",
        "that_sat": "Kim", "pha_quan": "Thủy",
    }
    hanh: list[str] = []
    for ma_ch in ("su_nghiep", "tong_quan", "tien_bac"):
        c = next((x for x in bc.get("chuong", []) if x.get("ma") == ma_ch), None)
        if not c:
            continue
        for h in c.get("hop", []):
            mm = h.get("ma_mau") or ""
            for slug, nh in slug_map.items():
                if f".{slug}." in mm and nh not in hanh:
                    hanh.append(nh)
                    break
            if len(hanh) >= 2:
                return hanh
    return hanh or ["Thổ"]


def tu_bao_cao_tuvi(bc: dict) -> dict | None:
    if not bc.get("chuong"):
        return None
    k = _kb()
    chon = _rut_hanh_tuvi(bc)[:2]
    return {
        "ma": "tuvi_co_dien",
        "tieu_de": k["tieu_de"]["tuvi"],
        "nguyen_tac_uu_tien": k["nguyen_tac_uu_tien"]["tuvi"],
        "hanh_ung_dung": [_the_hanh(k, h) for h in chon],
    }


def dieu_hoa_cung_van9(son: int, huong: int, luu_nien: int | None = None, van: int = 9, khu_vuc: str = "phong_khach") -> dict:
    """Chọn phép điều hoà Ngũ hành chính tông cho một cung có cặp sao `(son, huong)` và `luu_nien` trong Vận `van`."""
    k = _kb()
    cac_sao = {son, huong, *([luu_nien] if luu_nien else [])}
    if 5 in cac_sao or 2 in (son, huong) or luu_nien == 5:
        loai = "tiet_khi_kim"
    elif {son, huong} == {3, 7}:
        loai = "thong_quan_thuy"
    elif (son == 9 and huong in (6, 7)) or (huong == 9 and son in (6, 7)):
        loai = "dieu_hoa_hoa_kim"
    elif huong in (9, 1) and not ({son, huong} & {2, 5}):
        loai = "kich_vuong_van_9"
    elif 4 in (son, huong) and ({son, huong} & {1, 4, 9}):
        loai = "kich_van_xuong"
    else:
        loai = "giu_on_dinh"
    p = k["phep_van_9"][loai]
    return {
        "khu_vuc": khu_vuc,
        "ten_khu_vuc": k["khu_vuc_ten"].get(khu_vuc) or k["khu_vuc_ten"]["phong_khach"],
        "cap_sao": f"{son}-{huong}" + (f" (lưu niên {luu_nien})" if luu_nien and k["ngu_hanh"]["Kim"]["ten"] == "Kim" else f" (annual {luu_nien})" if luu_nien else ""),
        "loai_phep": loai,
        "ten_phep": p["ten"],
        "ngu_hanh_dieu_hoa": p["ngu_hanh_dieu_hoa"],
        "ung_dung": p["ung_dung"],
    }


def tu_bao_cao_phongthuy(bc: dict) -> dict | None:
    dt_info = bc.get("da_tinh") or {}
    b_hk = dt_info.get("huyen_khong")
    if not b_hk or not b_hk.get("cung") or not b_hk.get("cap_huong") or not b_hk.get("cap_toa"):
        return None
    k = _kb()
    ngay_str = dt_info.get("ngay_xem")
    nam_xem = dt.date.fromisoformat(ngay_str).year if isinstance(ngay_str, str) and len(ngay_str) >= 10 else 2026
    ln_map = hk.luu_nien(nam_xem)["cung"]
    van = int(b_hk.get("van") or 9)

    # Thứ tự 9 phần tử của b_hk["cung"] cố định ở cả VI và EN: Trung cung, Càn, Đoài, Cấn, Ly, Khảm, Khôn, Chấn, Tốn
    thu_tu_quai = ("Trung", "Càn", "Đoài", "Cấn", "Ly", "Khảm", "Khôn", "Chấn", "Tốn")
    cung_theo_quai = {quai: c for quai, c in zip(thu_tu_quai, b_hk["cung"])}

    ch, ct = b_hk["cap_huong"], b_hk["cap_toa"]
    qh = next((q for q, c in cung_theo_quai.items() if q != "Trung" and c["son"] == ch["son"] and c["huong"] == ch["huong"]), "Ly")
    qt = next((q for q, c in cung_theo_quai.items() if q != "Trung" and c["son"] == ct["son"] and c["huong"] == ct["huong"]), "Khảm")
    chon_kv: list[tuple[str, str]] = [(qh, "cua_chinh"), (qt, "phong_ngu")]
    cung_49 = next((q for q, c in cung_theo_quai.items() if q not in (qh, qt, "Trung") and c["huong"] in (9, 4, 1)), None)
    if cung_49:
        chon_kv.append((cung_49, "ban_lam_viec"))

    ds_kv = []
    for ten_cung, kv in chon_kv:
        c = cung_theo_quai.get(ten_cung)
        if not c:
            continue
        ds_kv.append(dieu_hoa_cung_van9(c["son"], c["huong"], ln_map.get(ten_cung), van=van, khu_vuc=kv))

    return {
        "ma": "phongthuy_co_dien",
        "tieu_de": k["tieu_de"]["phongthuy"],
        "nguyen_tac_uu_tien": k["nguyen_tac_uu_tien"]["phongthuy"],
        "khu_vuc_van_9": ds_kv,
    }
