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


# ------------------------------------------------------------------ VH-1: vận hạn 10 năm (dùng chung Tử vi + Bát tự)
SO_NAM_VAN_HAN = 10
NAM_GAN_COT_LOI = 3                      # năm "Cần lưu ý" trong 3 năm tới (kể cả năm nay) → một hộp ở "Điều quan trọng nhất"
TUOI_VH_NHO, TUOI_VH_LON = 18, 35        # < 18: lời cho trẻ (cha mẹ đọc) · 18–34: tuổi trẻ · ≥ 35: tuổi lớn
CO_DAN_GIAN = ("nam_tuoi", "xung_tuoi", "va_tuoi", "tam_tai")
NHAN_CO = {"nam_tuoi": "năm tuổi", "xung_tuoi": "năm xung tuổi", "va_tuoi": "năm va tuổi", "tam_tai": "năm tam tai",
           "xung_ngay": "dễ xáo trộn chỗ ở", "hinh_ngay": "dễ va chạm với người gần"}


def giai_doan_tuoi(tuoi: int) -> str:
    """Giai đoạn đời để chọn lời "nên tránh / nên làm" hợp tuổi (không khuyên trẻ con chuyện vay, bảo lãnh)."""
    return "nho" if tuoi < TUOI_VH_NHO else "tre" if tuoi < TUOI_VH_LON else "lon"


def co_dan_gian(chi_sinh: str, chi_nam: str) -> list[str]:
    """Cờ tập quán dân gian của một năm theo chi năm sinh (chỉ ĐỌC `calc.tuoi_dan_gian`): năm tuổi (cùng chi), năm
    xung tuổi (lục xung), năm va tuổi (hình / hại), tam tai (năm thứ 1–3 theo tam hợp). Cờ KHÔNG đổi mức của năm."""
    from app.calc import tuoi_dan_gian as tdg
    qh = tdg.quan_he_chi(chi_sinh, chi_nam)
    ra = []
    if qh == "trung":
        ra.append("nam_tuoi")
    elif qh == "xung":
        ra.append("xung_tuoi")
    elif qh in ("hinh", "hai"):
        ra.append("va_tuoi")
    if tdg.pham_tam_tai(chi_sinh, chi_nam):
        ra.append("tam_tai")
    return ra


TOI_DA_VAI = {"can": 3, "thuan": 1}


def chon_hop_van_han(dong: list[dict], hoc: tuple, them: list[dict] | None = None) -> tuple[list[dict], list[str]]:
    """Hộp chương "Vận hạn & điều nên tránh" từ hộp ứng viên mỗi năm (`dong[i]["_hop"]`, mỗi mô-đun dựng sẵn, theo thứ
    tự năm) + `them` (vd hộp 12 tháng): năm "Cần lưu ý" gần nhất trước (≤ 3 mẫu), năm thuận gần nhất (1). Năm sau trùng
    MẪU (cùng mã) gộp vào hộp đã có — tiêu đề ghi các năm, không lặp câu. Rồi tầng HỌC (`_ap_hoc`) như mọi chương."""
    cand, theo_ma, dem = [], {}, {}
    for g in dong:
        for h in g.get("_hop", []):
            if h["ma_mau"] in theo_ma:
                theo_ma[h["ma_mau"]]["_nam_gop"].append(g["nam"])
                continue
            vai = h.get("_vai")
            if dem.get(vai, 0) >= TOI_DA_VAI.get(vai, 9):
                continue
            dem[vai] = dem.get(vai, 0) + 1
            h["_nam_gop"] = [g["nam"]]
            theo_ma[h["ma_mau"]] = h
            cand.append(h)
    for h in cand:
        if len(h["_nam_gop"]) > 1:
            nam = ", ".join(str(n) for n in h["_nam_gop"][:-1]) + f" và {h['_nam_gop'][-1]}"
            h["tieu_de"] = h["tieu_de"].replace(f"Năm {h['_nam_gop'][0]}", f"Năm {nam}", 1)[:60]
            h["nam_gop"] = list(h["_nam_gop"])
    return _ap_hoc(_sap(cand + list(them or [])), *hoc)


def hop_cot_loi_van_han(chuong_vh: dict | None, nam_xem: int) -> dict | None:
    """Hộp "thời điểm" cho Điều quan trọng nhất: năm "Cần lưu ý" GẦN NHẤT trong `NAM_GAN_COT_LOI` năm tới (kể cả năm
    nay) — chính hộp của chương Vận hạn (cùng mã kiểm chứng). Không có → None."""
    if not chuong_vh:
        return None
    for h in chuong_vh.get("hop", []):
        if h.get("_vai") == "can" and not h.get("_chua_dung") and not h.get("dang_xem_lai") \
                and h.get("nam", 0) < nam_xem + NAM_GAN_COT_LOI:
            return h
    return None


def co_ra(ma: str, o: dict | None) -> dict:
    """Một cờ của năm cho dòng 10 năm (web mở khi bấm năm): mã, nhãn, lời nhắc tập quán + nên tránh / nên làm (KB
    `van_han.co`). Lời cố định theo tục lệ nên KHÔNG thành hộp (hộp chỉ nói điều riêng của lá số)."""
    o = o or {}
    return {"ma": ma, "nhan": o.get("nhan") or NHAN_CO[ma], **{k: o[k] for k in ("y", "tranh", "lam") if o.get(k)}}


def them_cot_loi_van_han(cot: list[dict], ds_chuong: list[dict], nam_xem: int) -> list[dict]:
    """VH-1: năm "Cần lưu ý" gần nhất trong 3 năm tới → thêm chính hộp ấy vào Điều quan trọng nhất (`tu_chuong` =
    van_han; khoá SAO-2 thì web lọc theo chương mở như mọi hộp). Giữ luật cũ: ≤ 5 hộp, ≤ 3 hộp mỗi loại, luôn còn một
    điểm mạnh và một lưu ý — thiếu chỗ thì bỏ hộp nhẹ nhất cùng loại (hoặc loại còn dư)."""
    vh = next((c for c in ds_chuong if c["ma"] == "van_han"), None)
    h = hop_cot_loi_van_han(vh, nam_xem)
    if not h:
        return cot
    moi = {**h, "loai": "cot_loi", "loai_goc": h["loai"], "tu_chuong": "van_han"}
    cot = list(cot)
    while len(cot) >= 5 or sum(x["loai_goc"] == moi["loai_goc"] for x in cot) >= 3:
        cung_loai = [x for x in cot if x["loai_goc"] == moi["loai_goc"]]
        bo = (cung_loai[-1] if len(cung_loai) >= 3 else
              next((x for x in reversed(cot) if sum(y["loai_goc"] == x["loai_goc"] for y in cot) > 1), cot[-1]))
        cot = [x for x in cot if x is not bo]
    return [*cot, moi]
