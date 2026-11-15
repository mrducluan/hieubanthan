# -*- coding: utf-8 -*-
"""Tầng KB — lớp phủ chú giải cho ĐỒ HÌNH khắc gỗ của Thần Tướng Toàn Biên (bản khắc đời Minh).

Chỉ TRA `nhan_tuong_do_hinh.json` (git là nguồn) + GHÉP đường dẫn / câu sách đã có trong KB Nhân tướng; không sinh nghĩa,
không tính toạ độ (toạ độ `vt` đo tay trên ảnh gốc, kiểm bằng ảnh vẽ chấm). Ảnh hiển thị do web tự phục vụ
(`web/public/anh/do-hinh/<ma>.webp`) — ảnh gốc giữ nguyên điểm ảnh, lớp phủ chỉ là toạ độ + chữ.
"""
from __future__ import annotations

from app.kb import nap
from app.kb import nhan_tuong_kb as kb

TEP = "nhan_tuong_do_hinh.json"
DUONG_CUM = "/nhan-tuong/do-hinh"
NGUON_HIEN_THI = "Thần Tướng Toàn Biên, bản khắc đời Minh"      # BM-1: ghi kiểu sách, không nêu nơi lấy ảnh / tên tệp
_KHOA_DANH_MUC = ("ma", "ten", "ten_han", "am", "tep", "rong", "cao", "mo_ta")


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(TEP)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ban_bien_tap"), "source_id": d.get("source_id", "than_tuong_toan_bien"),
            "school_id": d.get("school_id", "ma_y"), "can_doi_chieu": bool(d.get("can_doi_chieu", True))}


def tat_ca() -> list[dict]:
    return _d().get("do_hinh") or []


def lay(ma: str) -> dict | None:
    return next((x for x in tat_ca() if x["ma"] == ma), None)


def danh_muc() -> list[dict]:
    """Mục lục: không mang điểm (trang mục lục chỉ cần tên, ảnh, số điểm)."""
    return [{**{k: x[k] for k in _KHOA_DANH_MUC}, "so_diem": len(x["diem"]), "duong": f"{DUONG_CUM}/{x['ma']}"} for x in tat_ca()]


@nap.nho
def _slug_bo_vi() -> dict[str, str]:
    from app.kb import trang_nhan_tuong  # noqa: PLC0415 — tránh vòng nhập (trang ↔ KB)
    return dict(trang_nhan_tuong.ds_bo_vi())


@nap.nho
def _cau_sach_bo_vi() -> dict[str, dict]:
    """Bộ vị → MỘT câu sách đã có trong KB Nhân tướng (đặc điểm đầu tiên của bộ vị ấy có nguyên văn chữ Hán)."""
    ra: dict[str, dict] = {}
    for x in kb.dac_diem().values():
        s = x.get("sach") or {}
        if s.get("han") and s.get("y") and x.get("bo_vi") not in ra:
            ra[x["bo_vi"]] = {"han": s["han"], "y": s["y"], "sach": kb.ten_nguon(s.get("nguon"))}
    return ra


def _bo_vi_cua(lk: dict | None) -> str | None:
    if not lk:
        return None
    if lk["loai"] == "bo_vi":
        return lk["ma"]
    cung = kb.cung().get(lk["ma"]) or {}
    return next((b for b in cung.get("bo_vi") or [] if b in kb.bo_vi()), None)


def diem_theo_bo_vi(ma_bo_vi: str) -> dict | None:
    """Điểm đầu tiên trên các đồ hình nối thẳng tới bộ vị này (cho hỏi đáp / trang bộ vị mở đúng điểm)."""
    for d in tat_ca():
        for p in d["diem"]:
            if (p.get("lien_ket") or {}) == {"loai": "bo_vi", "ma": ma_bo_vi}:
                return {"ma": d["ma"], "diem_id": p["id"], "duong": f"{DUONG_CUM}/{d['ma']}"}
    return None


def chi_tiet(ma: str) -> dict | None:
    """Một đồ hình đủ dữ liệu cho web vẽ lớp phủ: điểm có liên kết thì kèm `duong` (trang bộ vị) + `sach_ghi` (câu sách KB)."""
    d = lay(ma)
    if d is None:
        return None
    slug, cau = _slug_bo_vi(), _cau_sach_bo_vi()
    diem = []
    for p in d["diem"]:
        q = {k: v for k, v in p.items() if k != "han_kho"}
        bv = _bo_vi_cua(p.get("lien_ket"))
        if bv and bv in slug:
            q["duong"] = f"{kb_duong_bo_vi()}/{slug[bv]}"
            if p.get("muc") is None and bv in cau:
                q["sach_ghi"] = cau[bv]
        diem.append(q)
    return {**{k: v for k, v in d.items() if k != "diem"}, "diem": diem, "duong": f"{DUONG_CUM}/{ma}",
            "nguon_hien_thi": NGUON_HIEN_THI, "trang_thai": meta()["trang_thai"],
            "khac": [x for x in danh_muc() if x["ma"] != ma]}


def kb_duong_bo_vi() -> str:
    from app.kb import trang_nhan_tuong  # noqa: PLC0415
    return trang_nhan_tuong.DUONG_CUM
