# -*- coding: utf-8 -*-
"""Tiện ích dùng chung cho luận giải "đời sống" (LG-ĐS Tử vi, BT-ĐS Bát tự). Thuần, tất định, không KB, không LLM.

Tách nguyên văn từ `tuvi_doi_song` (2026-10-21) — hành vi Tử vi giữ y nguyên (test Tử vi khoá): mã mẫu, tiêu đề hộp,
tách câu, tầng HỌC (`trong_so` hạ hộp ≥ 100 phiếu & < 40% đúng; `ca_nhan` "chưa đúng" xếp cuối), bỏ khoá nội bộ `_*`.
"""
from __future__ import annotations

import re
import unicodedata

MA_MAU_RE = re.compile(r"^[a-z0-9_.+-]{3,60}$")
TOI_DA_HOP = 6


def slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s.replace("đ", "d").replace("Đ", "D"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def _hoa_dau(s: str) -> str:
    return s[:1].upper() + s[1:] if s else s


def _cau_dau(s: str) -> str:
    """Câu đầu tiên của đoạn."""
    m = re.search(r"[.!?…](\s|$)", s)
    return s[: m.end()].strip() if m else s.strip()


_DAN = re.compile(r"^(?:Trong|Với|Ở|Về|Khi|Lúc|Nếu|Quan hệ|Mỗi|Sau|Trước)(?!\w)")
_NOI = re.compile(r"\s(?:hay|hoặc|và|nhưng|nên|vì|khi|mà|để|rồi|nhất là|trong khi)\s")
_TREO = {"những", "các", "một", "của", "với", "cho", "và", "hay", "là", "được", "bị", "từ", "tới", "đến", "vào",
         "như", "mà", "ở", "trong"}


def _tieu_de(s: str, mac_dinh: str) -> str:
    """Tiêu đề hộp (≤ 60 ký tự) từ câu đầu: vế đầu; vế dẫn ngắn ("Trong công việc", "Lúc nóng") ghép thêm vế sau;
    quá dài thì cắt TRƯỚC một từ nối (hay/và/khi…) — không cắt giữa cụm, không để "…"; không cắt được → `mac_dinh`."""
    cau = re.split(r"(?<=[.!?…])\s", (s or "").strip(), maxsplit=1)[0].rstrip(".!?… ")
    phan = [p for p in re.split(r"\s*[,;:—–(]\s*", cau) if p]
    v = phan[0] if phan else ""
    if len(phan) > 1 and (len(v) < 8 or (_DAN.match(v) and len(v) < 30)):
        v = f"{v}, {phan[1]}"
    if len(v) < 8:
        return mac_dinh[:60]
    if len(v) > 60:
        cat = [m.start() for m in _NOI.finditer(v) if 18 <= m.start() <= 60]
        if not cat:
            return mac_dinh[:60]
        w = v[:cat[-1]].split()
        while len(w) > 3 and w[-1].lower() in _TREO:
            w.pop()
        v = " ".join(w)
    return v


def _ma(*phan: str) -> str:
    ma = ".".join(p for p in phan if p)
    if len(ma) > 60:            # rút gọn phần ghép "+cung" về chữ cái đầu, vẫn tất định
        ma = ".".join("+".join(x if i == 0 else "".join(w[0] for w in x.split("_")) for i, x in enumerate(p.split("+")))
                      for p in phan if p)
    return ma[:60].rstrip(".+-")


# ------------------------------------------------------------------ tự học: trọng số công khai + phiếu cá nhân
def _ap_hoc(cand: list[dict], trong_so: dict | None, ca_nhan: dict | None) -> tuple[list[dict], list[str]]:
    """Chọn ≤ TOI_DA_HOP hộp theo thứ tự ứng viên; bỏ hộp `dang_xem_lai` (đẩy sang can_cu), hộp người này bấm
    "chưa đúng" xếp cuối. → (hộp, dòng can_cu "Đang xem lại")."""
    trong_so, ca_nhan = trong_so or {}, ca_nhan or {}
    chon, xem_lai = [], []
    for h in cand:
        p = trong_so.get(h["ma_mau"])
        if p:
            dung, chua = int(p.get("dung", 0)), int(p.get("chua_dung", 0))
            tong = dung + chua
            if tong >= 30:
                h["ty_le_dung"], h["so_phieu"] = round(dung / tong, 2), tong
                h["dang_xem_lai"] = tong >= 100 and dung / tong < 0.40
        if h.get("dang_xem_lai"):
            xem_lai.append(f"Đang xem lại: {h['tieu_de']}")
            continue
        if ca_nhan.get(h["ma_mau"]) == "chua_dung":
            h["_chua_dung"] = True
        chon.append(h)
        if len(chon) == TOI_DA_HOP:
            break
    return [h for h in chon if not h.get("_chua_dung")] + [h for h in chon if h.get("_chua_dung")], xem_lai


def trong_so_xem_lai(h: dict, hoc: tuple) -> bool:
    """Hộp dự phòng cũng tôn trọng ngưỡng "đang xem lại" của bảng tỉ lệ."""
    p = (hoc[0] or {}).get(h["ma_mau"])
    if not p:
        return False
    tong = int(p.get("dung", 0)) + int(p.get("chua_dung", 0))
    return tong >= 100 and int(p.get("dung", 0)) / tong < 0.40


def _sap(cand: list[dict]) -> list[dict]:
    return sorted(cand, key=lambda h: -h["_w"])


def _cac_cau(s: str) -> list[str]:
    """Tách câu (theo ". ", "! ", "? ") — đơn vị so trùng giữa thân bài và hộp."""
    return [c.strip() for c in re.split(r"(?<=[.!?])\s+", s or "") if c.strip()]


def _sach(x):
    """Bỏ khoá nội bộ (`_w`, `_cung`, …) trước khi trả ra."""
    if isinstance(x, dict):
        return {k: _sach(v) for k, v in x.items() if not k.startswith("_")}
    if isinstance(x, list):
        return [_sach(v) for v in x]
    return x
