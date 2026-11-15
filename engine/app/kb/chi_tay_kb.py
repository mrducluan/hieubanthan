# -*- coding: utf-8 -*-
"""Tầng KB — Chỉ tay theo Thần Tướng Toàn Biên quyển 10 (bảy mươi hai hình vân tay khắc gỗ) + đồ hình tám cung bàn tay.

Chỉ TRA `chi_tay_kb.json` (git là nguồn) và GHÉP lời theo khuôn SX-C (`sach_ghi.loi`): A nói nguyên ý, B "nên chú ý" + việc,
C "Sách xưa có nhắc… Hàm ý theo ghi chép xưa…" (không phiên âm). Không sinh nghĩa, không đoán gì từ ảnh: người dùng tự soi bàn
tay của mình rồi chọn hình vân giống tay mình. Ảnh do web tự phục vụ (`/anh/chi-tay/van/<ma>.webp`, `/anh/do-hinh/<tep>`).
"""
from __future__ import annotations

from app.kb import nap
from app.kb import sach_ghi

TEP = "chi_tay_kb.json"
NGUON_HIEN_THI = "Thần Tướng Toàn Biên, quyển 10, bản khắc đời Minh"   # BM-1: kiểu sách, không nơi lấy ảnh
TUOI_NHOM_C = 18
_KHOA_VAN = ("ma", "ten", "ten_han", "am_ten", "anh", "rong", "cao", "han", "y", "nhom", "chu_de")


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


def ds_van() -> list[dict]:
    return _d().get("van") or []


def lay(ma: str) -> dict | None:
    return next((x for x in ds_van() if x["ma"] == ma), None)


def chu_de() -> list[dict]:
    co = {x["chu_de"] for x in ds_van()}
    return [c for c in _d().get("chu_de") or [] if c["ma"] in co]


def _mot(m: dict) -> dict:
    """Một vân cho thư viện: thêm câu hiển thị theo khuôn SX-C. Phiên âm chỉ ở nhóm A (âm câu nặng đọc lên vẫn nặng)."""
    ra = {k: m[k] for k in _KHOA_VAN}
    if m["nhom"] == "A":
        ra["am"] = m["am"]
    for k in ("ham_y", "viec"):
        if m.get(k):
            ra[k] = m[k]
    ra["loi"] = sach_ghi.loi(m, co_am=False)
    return ra


def thu_vien() -> dict:
    """Toàn bộ thư viện vân tay (trang công khai: nhóm C đã nói giảm, có câu kết)."""
    van = [_mot(m) for m in ds_van()]
    return {"nguon_hien_thi": NGUON_HIEN_THI, "trang_thai": meta()["trang_thai"], "chu_de": chu_de(), "van": van,
            "cau_ket": sach_ghi.CAU_KET, "do_hinh": do_hinh()}


def do_hinh() -> dict | None:
    d = _d().get("do_hinh")
    if not d:
        return None
    diem = [{k: v for k, v in p.items() if k != "sach_ghi"} | (
        {"sach_ghi": {k: v for k, v in p["sach_ghi"].items() if k != "han_kho"}} if p.get("sach_ghi") else {}) for p in d["diem"]]
    return {**{k: v for k, v in d.items() if k != "diem"}, "diem": diem, "duong": "/chi-tay", "khac": []}


def doc(ds_ma: list[str], tuoi: int | None) -> dict:
    """Lời sách xưa cho các vân NGƯỜI DÙNG TỰ CHỌN (thứ tự: A → B → C). Không biết tuổi / chưa đủ 18 → bỏ nhóm C."""
    chon = [m for ma in dict.fromkeys(ds_ma) if (m := lay(ma))]
    co_c = tuoi is not None and tuoi >= TUOI_NHOM_C
    giu = [m for m in chon if m["nhom"] != "C" or co_c]
    giu.sort(key=lambda m: "ABC".index(m["nhom"]))
    bo_c = len(chon) - len(giu)
    return {"muc": [_mot(m) for m in giu], "bo_nhom_c": bo_c, "cau_ket": sach_ghi.cau_ket(giu) if giu else "",
            "khong_ro": [ma for ma in ds_ma if not lay(ma)]}
