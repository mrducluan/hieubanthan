# -*- coding: utf-8 -*-
"""MT-ĐS B2 — hỏi đáp mượn chương báo cáo đời sống (`luangiai.tuvi_doi_song` / `battu_doi_song`, RULES tất định).

Một câu hỏi về một mảng đời → mục `doi_song`: mức của mảng (Thuận lợi / Cân bằng / Cần lưu ý), tóm tắt chương và
≤ 2 hộp (điểm sáng + nên để ý, mỗi hộp kèm việc nên làm). Kiểu "có bị … không" (`lo_so`) mở bằng mức của MẢNG SỐNG
HẰNG NGÀY, không bao giờ là mức của nỗi sợ (MT-ĐS mục 2.2); hộp "nên để ý" đứng trước. Không điểm số, không câu mới —
mọi chữ lấy từ chương đã dựng (cùng KB, cùng mã kiểm chứng `ma_mau`).
"""
from __future__ import annotations

import re

NHAN_MUC = {"thuan": "thuận lợi", "can_bang": "cân bằng", "can_chu_dong": "cần lưu ý"}
TEN_MANG = {"tong_quan": "con người bạn", "su_nghiep": "công việc", "tien_bac": "tiền bạc", "tinh_cam": "tình cảm",
            "gia_dinh": "gia đình", "suc_khoe": "sức khoẻ và năng lượng", "quan_he": "quan hệ bên ngoài",
            "nha_cua": "nhà cửa", "hoc_tap": "học và nghĩ", "ngu_hanh": "năng lượng", "cuoc_doi": "các giai đoạn cuộc đời",
            "nam_nay": "năm nay", "duong_bay": "liên hệ giữa các mảng"}
# Tử vi: cung hỏi → chương; Bát tự: chủ đề → chương.
CUNG_CHUONG = {"Mệnh": "tong_quan", "Phúc Đức": "tong_quan", "Quan Lộc": "su_nghiep", "Tài Bạch": "tien_bac",
               "Điền Trạch": "nha_cua", "Phu Thê": "tinh_cam", "Tử Nữ": "gia_dinh", "Phụ Mẫu": "gia_dinh",
               "Huynh Đệ": "gia_dinh", "Tật Ách": "suc_khoe", "Nô Bộc": "quan_he", "Thiên Di": "quan_he"}
CHU_DE_CHUONG = {"tinh_cach": "tong_quan", "ngu_hanh": "ngu_hanh", "nghe_tien": "su_nghiep", "hon_nhan": "tinh_cam",
                 "gia_dinh": "gia_dinh", "con_cai": "gia_dinh", "loi_song": "suc_khoe", "hoc_hanh": "hoc_tap",
                 "quan_he": "quan_he", "phap_ly": "quan_he", "an_toan": "suc_khoe", "di_xa": "quan_he",
                 "hau_van": "cuoc_doi", "than_sat": None, "xung_hop": None, "cach_cuc": None, "tru": "gia_dinh",
                 "thap_than": None}
_TOI_DA_HOP = 2


def _chon_hop(hop: list[dict], lo_so: bool) -> list[dict]:
    """Một hộp "nên để ý" (luu_y) + một hộp điểm sáng (diem_manh / cot_loi); `lo_so` → lưu ý đứng trước. Ưu tiên hộp
    được đánh dấu cốt lõi (`tham_chieu`)."""
    def _uu_tien(ds):
        return sorted(ds, key=lambda h: 0 if h.get("tham_chieu") == "cot_loi" else 1)
    luu_y = _uu_tien([h for h in hop if h.get("loai") in ("luu_y", "thoi_diem") and h.get("noi_dung")])[:1]
    manh = _uu_tien([h for h in hop if h.get("loai") in ("diem_manh", "cot_loi", "loi_khuyen") and h.get("noi_dung")])[:1]
    ra = luu_y + manh if lo_so else manh + luu_y
    return ra[:_TOI_DA_HOP]


def muc_doi_song(bc: dict | None, chuong: str | None, lo_so: bool = False) -> dict | None:
    """→ mục `doi_song` từ báo cáo `bc` (kết quả `lap()` của mô-đun đời sống) cho chương `chuong`; None khi không có."""
    if not bc or not chuong:
        return None
    c = next((x for x in bc.get("chuong", []) if x.get("ma") == chuong), None)
    if not c or not (c.get("tom_tat") or c.get("hop")):
        return None
    hop = _chon_hop(c.get("hop") or [], lo_so)
    gon = [{k: h[k] for k in ("loai", "tieu_de", "noi_dung", "huong_xu_ly", "loi_khuyen", "ma_mau", "can_cu") if h.get(k)}
           for h in hop]
    return {"loai": "doi_song", "chuong": chuong, "ten_mang": TEN_MANG.get(chuong, chuong), "muc": c.get("muc"),
            "nhan_muc": NHAN_MUC.get(c.get("muc") or "", ""), "tom_tat": c.get("tom_tat") or "", "hop": gon,
            "lo_so": lo_so, "can_cu_ds": [x for h in gon for x in h.get("can_cu", [])],
            "source_id": bc.get("source_id"), "school_id": bc.get("school_id")}


def _chuan(c: str) -> str:
    return " ".join(re.sub(r"[^\wÀ-ỹ ]", " ", c).lower().split())


def _cau(van: str) -> list[str]:
    return [c.strip() for c in re.split(r"(?<=[.!?])\s+", van or "") if c.strip()]


def doan_doi_song(m: dict, da_noi: str = "") -> str:
    """Lời đời thường của mục: mức mảng (khi có) → tóm tắt → hộp.

    `da_noi` = phần câu trả lời đã có phía trên (lời KB của cung/sao/thập thần). Hộp mượn từ chương đời sống cùng nguồn
    KB nên hay lặp nguyên câu (HD-CS rà lại 2026-10-29): câu nào đã nói thì bỏ; tiêu đề hộp đã nói thì chỉ giữ việc nên làm."""
    phan = []
    truoc = _chuan(da_noi)
    da = {_chuan(c) for c in _cau(da_noi)}

    def moi(c: str) -> bool:
        k = _chuan(c)
        return not k or (k not in da and (len(k.split()) < 8 or k not in truoc))

    # Chương gộp nhiều cung (Tiền bạc = Tài Bạch + Điền Trạch) đã nêu mức từng phần trong tóm tắt → không thêm câu mức chung
    # (tránh "đang ở mức thuận lợi" rồi "tiền bạc ở mức cân bằng").
    if m.get("nhan_muc") and "ở mức" not in (m.get("tom_tat") or ""):
        phan.append(f"Mảng {m['ten_mang']} của bạn đang ở mức {m['nhan_muc']}.")
    if m.get("tom_tat"):
        phan.append(m["tom_tat"])
    for h in m.get("hop", []):
        nhan = "Nên để ý" if h["loai"] in ("luu_y", "thoi_diem") else "Điểm sáng"
        viec = h.get("huong_xu_ly") or h.get("loi_khuyen")
        if viec and viec in h["noi_dung"]:
            viec = None
        viec = " ".join(c for c in _cau(viec or "") if moi(c)) or None
        than = " ".join(c for c in _cau(h["noi_dung"]) if moi(c))
        if not than and not viec:
            continue
        td = _chuan(h["tieu_de"])
        if len(td.split()) >= 5 and td in truoc:       # ý chính đã nói phía trên → chỉ giữ phần chưa nói
            s = f"{nhan}: {than}" if than else f"{nhan} — việc nên làm: {viec}"
            if than and viec:
                s += f" Việc nên làm: {viec}"
            phan.append(s)
            continue
        s = f"{nhan} — {h['tieu_de']}" + (f": {than}" if than else ".")
        if viec:
            s += f" Việc nên làm: {viec}"
        phan.append(s)
    return " ".join(phan)
