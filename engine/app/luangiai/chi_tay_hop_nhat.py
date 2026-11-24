# -*- coding: utf-8 -*-
"""Chỉ tay — ghép lời đọc hợp nhất Đông – Tây cho một / hai bàn tay (RULES, tất định). Dời khỏi `chi_tay_api.py` khi rà
soát PR #338 (2026-11-24): API chỉ kiểm đầu vào và gọi; phép đo ở `calc/chi_tay_do`; lời + ngưỡng + bảng đối chiếu gò ↔
cung ở KB `tuong_do_anh_kb.json` (mục `chi_tay`). Mọi ngưỡng do ban biên tập tự đặt (`do_tin = bien_tap_tu_dat`); tín hiệu
ba đường chỉ máy dò từ ảnh là ƯỚC LƯỢNG (`goi_y_tham_khao`) — web cho người dùng báo "chưa khớp". Chỉ bản Việt."""
from __future__ import annotations

from app.calc import chi_tay_do
from app.calc.nhan_tuong_do import kb_do_anh
from app.kb import chi_tay_kb as kb
from app.kb import chi_tay_tay_kb as kb_tay
from app.kb import tuong_hoc_dot4_kb

DO_TIN = "bien_tap_tu_dat"


def _k() -> dict:
    return kb_do_anh()["chi_tay"]


def giai_nghia_hinh_hoc(so_do: dict | None) -> list[dict]:
    """Ba chỉ số hình học / 3D mở rộng: góc mở ngón cái, ba đốt ngón giữa, độ khum lòng bàn tay."""
    if not isinstance(so_do, dict):
        return []
    k = _k()
    N, H = k["nguong"], k["hinh_hoc"]
    ra: list[dict] = []

    goc = so_do.get("goc_ngon_cai")
    if isinstance(goc, (int, float)):
        nhom = "mo_rong" if goc >= N["goc_ngon_cai"]["rong"] else "khep_than_trong" if goc <= N["goc_ngon_cai"]["gon"] else "can_bang"
        m = H["goc_ngon_cai"][nhom]
        ra.append({"ma": "goc_ngon_cai", "nhom": nhom, "ten": m["ten"].format(so=f"{goc:.0f}"), "gia_tri": round(float(goc), 1),
                   "y": m["y"], "luu_y": m["luu_y"], "do_tin": DO_TIN})

    dot = so_do.get("dot_ngon_giua")
    if isinstance(dot, dict) and all(isinstance(dot.get(x), (int, float)) for x in ("dot_goc", "dot_giua", "dot_dau")):
        dg, dgi, dd = float(dot["dot_goc"]), float(dot["dot_giua"]), float(dot["dot_dau"])
        if max(dg, dgi, dd) - min(dg, dgi, dd) <= N["dot_can_bang"]:
            nhom, so = "can_bang", 0.0
        elif dg >= dgi and dg >= dd:
            nhom, so = "dot_goc_troi", dg
        elif dgi >= dg and dgi >= dd:
            nhom, so = "dot_giua_troi", dgi
        else:
            nhom, so = "dot_dau_troi", dd
        m = H["dot_ngon_giua"][nhom]
        ra.append({"ma": "dot_ngon_giua", "nhom": nhom, "ten": m["ten"].format(so=round(so * 100)),
                   "gia_tri": {"dot_goc": round(dg, 3), "dot_giua": round(dgi, 3), "dot_dau": round(dd, 3)},
                   "y": m["y"], "luu_y": H["dot_ngon_giua"]["luu_y"], "do_tin": DO_TIN})

    c3 = so_do.get("chi_so_3d")
    if isinstance(c3, dict) and isinstance(c3.get("do_khum_long"), (int, float)):
        khum = float(c3["do_khum_long"])
        nhom = "minh_duong_trung" if khum >= N["khum_sau"] else "minh_duong_phang"
        m = H["do_khum_long_3d"][nhom]
        ra.append({"ma": "do_khum_long_3d", "nhom": nhom, "ten": m["ten"].format(so=f"{khum:.2f}"), "gia_tri": round(khum, 3),
                   "y": m["y"], "luu_y": m["luu_y"], "do_tin": DO_TIN})
    return ra


def ghep_tay_phuong_tay(kq: dict, tay: str) -> dict:
    """Lời phương Tây: Cheiro (1894, 1916) · Benham (1900) · Dale (1895) + bảy gò đối chiếu vị trí với cung bàn tay sách Đông."""
    co_ban = kb_tay.ket_qua_do_tay(kq, tay)
    kinh_dien = tuong_hoc_dot4_kb.chitay_phuong_tay()
    duong_kd = kinh_dien.get("duong_chinh") or {}
    go_kd = kinh_dien.get("bay_go") or {}
    k = _k()

    duong_chi_cv = kq.get("duong_chi_goi_y")
    duong = []
    for ma in ("tam_dao", "tri_dao", "sinh_dao", "dinh_menh"):
        muc = duong_kd.get(ma)
        if not muc:
            continue
        sg = muc.get("sach_ghi") or {}
        tin_hieu = (duong_chi_cv or {}).get(ma) if isinstance(duong_chi_cv, dict) else None
        duong.append({
            "ma": ma, "ten": muc["ten"], "mat_tich_cuc": muc["mat_tich_cuc"],
            "mat_tieu_cuc_can_chu_y": muc["mat_tieu_cuc_can_chu_y"],
            **({"trich": sg["trich"], "nguon": sg["nguon"]} if sg.get("trich") else {}),
            **({"tin_hieu_cv": tin_hieu, "do_tin_cv": "goi_y_tham_khao"} if tin_hieu else {}),
        })

    cung_dong = kb.cung_tay()
    go = []
    for ma, (ma_cung, vi_tri) in k["go_cung"].items():
        muc = go_kd.get(ma)
        if not muc:
            continue
        sg = muc.get("sach_ghi") or {}
        c = cung_dong.get(ma_cung)
        go.append({
            "ma": ma, "ten": muc["ten"], "mat_tich_cuc": muc["mat_tich_cuc"],
            "mat_tieu_cuc_can_chu_y": muc["mat_tieu_cuc_can_chu_y"],
            "cung_dong": ma_cung, "han_dong": c.get("han") if c else None, "ten_cung_dong": c.get("ten") if c else None,
            "vi_tri": vi_tri, "do_tin_doi_chieu": "bien_tap_doi_chieu_vi_tri",
            **({"trich": sg["trich"], "nguon": sg["nguon"]} if sg.get("trich") else {}),
        })

    return {
        **co_ban,
        "fuzzy_bridge": kq.get("fuzzy_bridge"),
        "duong_kinh_dien": duong,
        "bay_go_kinh_dien": go,
        "so_go_kinh_dien": len(go),
        "chi_so_mo_rong": giai_nghia_hinh_hoc(kq.get("so_do")),
        "truong_phai": list(k["truong_phai"]),
    }


def so_sanh_hai_tay(kq_trai: dict | None, kq_phai: dict | None) -> dict | None:
    """Tay trái (Tiên Thiên) ↔ tay phải (Hậu Thiên): số chênh từ `calc.chi_tay_do.chenh_hai_tay`, lời ở KB. Chênh lệch
    đo trên ảnh còn phụ thuộc góc chụp → luôn kèm `luu_y`; `muc_tuong_dong` chỉ là độ giống của số đo."""
    c = chi_tay_do.chenh_hai_tay(kq_trai, kq_phai)
    if c is None:
        return None
    k = _k()
    S = k["so_sanh"]
    ten_t, ten_p = c["ten_hanh_trai"], c["ten_hanh_phai"]
    if c["chuyen_dich_hanh"]:
        nhan_xet = S["chuyen_dich"].format(ten_t=ten_t, ten_p=ten_p)
    elif c["tong_chenh"] <= k["nguong"]["so_sanh_can_xung"]:
        nhan_xet = S["can_xung"].format(ten=ten_t or S["nhom_mac_dinh"])
    else:
        nhan_xet = S["lech_nhe"].format(ten=ten_t or S["nhom_mac_dinh"])
    # `muc_tuong_dong` (0..1) = độ giống nhau của SỐ ĐO hai tay (hình học), không phải điểm đánh giá con người.
    return {x: v for x, v in c.items() if x != "tong_chenh"} | {
        "muc_tuong_dong": round(max(0.0, min(1.0, 1.0 - c["tong_chenh"] * 1.5)), 4),
        "nhan_xet": nhan_xet, "luu_y": S["luu_y"], "do_tin": DO_TIN}


def tong_hop_dong_tay(dong: dict | None, tay_pt: dict | None, so_sanh: dict | None, co_cv_duong_chi: bool) -> dict:
    T = _k()["tong_hop"]
    diem_chung: list[str] = []
    if dong and dong.get("hop_le"):
        nhan_lech = [n["ten"] for n in dong.get("nhan") or [] if not n.get("vua")]
        if nhan_lech:
            diem_chung.append(T["dong"].format(ds=", ".join(nhan_lech)))
    if tay_pt and tay_pt.get("hop_le"):
        dt = (tay_pt.get("fuzzy_bridge") or {}).get("dang_ban_tay") or {}
        if dt.get("ten"):
            diem_chung.append(T["tay_nhom"].format(ten=dt["ten"]))
        if tay_pt.get("to_hop") and tay_pt["to_hop"].get("ten"):
            diem_chung.append(T["tay_to_hop"].format(ten=tay_pt["to_hop"]["ten"]))
    if so_sanh and so_sanh.get("nhan_xet"):
        diem_chung.append(so_sanh["nhan_xet"])
    return {
        "tom_tat": " ".join(diem_chung) if diem_chung else T["can_doi"],
        "diem_chung": diem_chung,
        "do_tin": {"hinh_hoc": "do_truc_tiep_21_diem", "bon_nguyen_to": DO_TIN,
                   "duong_chi_cv": "goi_y_tham_khao" if co_cv_duong_chi else "khong_co"},
        "ghi_chu": T["ghi_chu"] + (T["ghi_chu_cv"] if co_cv_duong_chi else T["ghi_chu_khong_cv"]),
    }


def tom_tat_mot_tay(kq: dict, tay: str, tuoi: int | None) -> dict:
    dong = kb.ket_qua_do_tay(kq, tay, tuoi)
    if not kq["hop_le"]:
        return {"tay": tay, "hop_le": False, "loi": dong["loi"], "loi_nhac": dong["loi_nhac"], "so_do": None,
                "nhan_dong": [], "nhan_tay": [], "cung": [], "fuzzy_bridge": None, "duong_chi_goi_y": None}
    pt = kb_tay.ket_qua_do_tay(kq, tay)
    return {"tay": tay, "hop_le": True, "loi": None, "loi_nhac": None, "so_do": kq["so_do"],
            "nhan_dong": dong["nhan"], "nhan_tay": pt["nhan"], "cung": dong["cung"],
            "fuzzy_bridge": kq.get("fuzzy_bridge"), "duong_chi_goi_y": kq.get("duong_chi_goi_y")}
