# -*- coding: utf-8 -*-
"""KC-1 — Khuôn "bài đọc đời sống" dùng chung mọi mảng (`phien_ban = "doi_song_1"`, docs/LUAN-GIAI-DOI-SONG.md 2.3).

Một báo cáo = {phien_ban, cot_loi: [hộp], chuong: [{ma, tieu_de, muc|None, nhan_muc, tom_tat, hop, doan, can_cu, cau_tu_soi}],
ket}. Hộp = {loai ∈ cot_loi·diem_manh·luu_y·loi_khuyen·thoi_diem, tieu_de, noi_dung, huong_xu_ly?, can_cu?, ma_mau?, muc?}.
Thuật ngữ chỉ ở `can_cu` ("Vì sao nói vậy"); lớp đời thường (tiêu đề, tóm tắt, hộp, câu tự soi) phải sạch cụm giọng AI /
từ doạ — `kiem_giong_van` dùng chung cho test mọi mảng. `ma_mau` tất định dạng `ds.<mảng>.<chương>.<khoá>` để gắn kiểm
chứng "x% thấy đúng" (migration 0017 chấp nhận mọi mã `ds.*`).
"""
from __future__ import annotations

import re

PHIEN_BAN = "doi_song_1"
NHAN_MUC = {"thuan": "Thuận lợi", "can_bang": "Cân bằng", "can_chu_dong": "Cần lưu ý"}
LOAI_HOP = ("cot_loi", "diem_manh", "luu_y", "loi_khuyen", "thoi_diem")
_MA = re.compile(r"[^a-z0-9_+-]")


def ma_mau(*phan: str) -> str:
    """`ds.<mảng>.<chương>.<khoá…>` — chữ thường không dấu, ≤ 60 ký tự, tất định."""
    from app.luangiai.hoi import chuan_hoa  # noqa: PLC0415
    sach = [_MA.sub("", chuan_hoa(str(p)).replace(" ", "_")) for p in phan if p is not None and str(p) != ""]
    ma = "ds." + ".".join(s for s in sach if s)
    return ma[:60].rstrip(".+-")


def hop(loai: str, tieu_de: str, noi_dung: str, *, huong_xu_ly: str | None = None, can_cu: list[str] | None = None,
        ma: str | None = None, muc: str | None = None, **them) -> dict:
    assert loai in LOAI_HOP, loai
    h = {"loai": loai, "tieu_de": tieu_de.strip(), "noi_dung": " ".join(noi_dung.split())}
    if loai == "luu_y":
        h["huong_xu_ly"] = (huong_xu_ly or "Chậm lại một nhịp, hỏi thêm một người có kinh nghiệm trước khi quyết.").strip()
    elif huong_xu_ly:
        h["huong_xu_ly"] = huong_xu_ly.strip()
    if can_cu:
        h["can_cu"] = [c for c in can_cu if c]
    if ma:
        h["ma_mau"] = ma
    if muc:
        h["muc"] = muc
    h.update({k: v for k, v in them.items() if v is not None})
    return h


def chuong(ma: str, tieu_de: str, doan: list[str], *, hop: list[dict] | None = None, muc: str | None = None,
           tom_tat: str | None = None, can_cu: list[str] | None = None, cau_tu_soi: str | None = None, **them) -> dict:
    c = {"ma": ma, "tieu_de": tieu_de, "hop": hop or [], "doan": doan, "can_cu": can_cu or []}
    # Khoá trống không ghi (báo cáo cũ của thần số kiểm "None" không lọt ra lời văn); web coi thiếu = None.
    for k, v in (("muc", muc), ("nhan_muc", NHAN_MUC.get(muc) if muc else None), ("tom_tat", tom_tat), ("cau_tu_soi", cau_tu_soi)):
        if v is not None:
            c[k] = v
    c.update(them)
    return c


def chon_cot_loi(ds_chuong: list[dict], toi_da: int = 3, uu_tien: tuple[str, ...] = ("cot_loi", "luu_y", "thoi_diem")) -> list[dict]:
    """Mỗi chương góp tối đa một hộp (ưu tiên cốt lõi → lưu ý → thời điểm), gắn `tu_chuong` để SAO-2 cắt theo chương khoá."""
    ra: list[dict] = []
    for c in ds_chuong:
        for loai in uu_tien:
            h = next((x for x in c.get("hop", []) if x["loai"] == loai), None)
            if h:
                ra.append({**h, "tu_chuong": c["ma"], "loai_goc": h["loai"], "loai": "cot_loi"})
                break
        if len(ra) >= toi_da:
            break
    return ra


def lop_doi_thuong(bc: dict) -> list[str]:
    """Mọi chuỗi thuộc lớp đời thường của một báo cáo (hoặc một `doc_que`): tiêu đề, tóm tắt, hộp, câu tự soi, việc nên làm."""
    ra: list[str] = []

    def _hop(h: dict):
        ra.extend([h.get("tieu_de", ""), h.get("noi_dung", ""), h.get("huong_xu_ly") or ""])

    for h in bc.get("cot_loi") or []:
        _hop(h)
    for k in ("ket_luan", "tom_tat", "cau_tu_soi", "ket"):
        if isinstance(bc.get(k), str):
            ra.append(bc[k])
    for h in bc.get("hop") or []:
        _hop(h)
    for n in bc.get("hanh_dong") or []:
        ra.extend(n.get("viec", []) if isinstance(n, dict) else [])
    for c in bc.get("chuong") or []:
        ra.extend([c.get("tieu_de", ""), c.get("tom_tat") or "", c.get("cau_tu_soi") or ""])
        for h in c.get("hop", []):
            _hop(h)
        for n in c.get("hanh_dong") or []:
            ra.extend(n.get("viec", []) if isinstance(n, dict) else [])
    return [s for s in ra if s]


def cum_cam_chung() -> list[str]:
    """Hợp các danh sách `cum_cam` của mọi KB đời sống (Tử vi, Kinh Dịch, Phong thuỷ) — một bộ test giọng văn cho mọi mảng."""
    from app.kb import kinhdich_doi_song_kb, phongthuy_doi_song_kb, tuvi_doi_song_kb  # noqa: PLC0415
    ds: list[str] = []
    for c in [*tuvi_doi_song_kb.cum_cam(), *kinhdich_doi_song_kb.cum_cam(), *phongthuy_doi_song_kb.cum_cam()]:
        if c not in ds:
            ds.append(c)
    return ds


# Tên chỉ số / thuật ngữ trùng chữ với cụm giọng AI nhưng là tên riêng của mảng (không phải giọng văn) — được phép.
NGOAI_LE = {"thanso": ("sứ mệnh",)}


def kiem_giong_van(bc: dict, ds: list[str] | None = None, mo_dun: str | None = None) -> list[tuple[str, str]]:
    """→ [(cụm cấm, chuỗi chứa nó)] trên lớp đời thường. Rỗng = đạt. `mo_dun` để miễn tên chỉ số riêng (NGOAI_LE)."""
    from app.kb.tuvi_doi_song_kb import tim_cum_cam  # noqa: PLC0415
    ds = ds if ds is not None else cum_cam_chung()
    mo_dun = mo_dun or bc.get("mo_dun")
    ds = [c for c in ds if c not in NGOAI_LE.get(mo_dun or "", ())]
    loi = []
    for s in lop_doi_thuong(bc):
        for c in tim_cum_cam(s, ds):
            loi.append((c, s[:120]))
    return loi
