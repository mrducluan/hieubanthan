# -*- coding: utf-8 -*-
"""Phong thuỷ Bát trạch (tầng CALC, tất định) — Dương Trạch Tam Yếu (Triệu Cửu Phong) + các
quy ước năm/tuổi phổ biến ở Việt Nam.

- Mệnh quái (cung phi): theo năm sinh + giới; năm đổi tại LẬP XUÂN (tiết khí, app.calc.tietkhi).
  Nam: (11 − năm mod 9) mod 9; nữ: (năm mod 9 + 4) mod 9; 0 → 9; số 5: nam → Khôn, nữ → Cấn.
- Du niên: phép "lật hào" từ quái gốc: Phục vị → (lật hào trên) Sinh khí → (giữa) Ngũ quỷ →
  (dưới) Diên niên → (giữa) Lục sát → (trên) Hoạ hại → (giữa) Thiên y → (dưới) Tuyệt mệnh.
- Trạch quái theo phương TOẠ (đối diện hướng nhà). Cửa–Chủ–Bếp: du niên giữa các cặp phương vị.
- Sao năm: Ngũ Hoàng theo phi tinh năm (Lạc thư, bay thuận), Thái Tuế / Tuế Phá / Tam Sát theo chi năm.
- Tuổi làm nhà: Kim Lâu, Hoang Ốc, Tam Tai — QUAN NIỆM DÂN GIAN (không thuộc cổ thư phong thuỷ);
  tuổi mụ tính theo năm (chưa xét trước/sau Tết).
"""
from __future__ import annotations

import datetime as dt

from app.calc import tietkhi as tk
from app.calc.lunar import CHI

# quái: (số Lạc thư, phương, 3 hào dưới→trên, 1 = dương)
QUAI = {"Khảm": (1, "Bắc", (0, 1, 0)), "Khôn": (2, "Tây Nam", (0, 0, 0)), "Chấn": (3, "Đông", (1, 0, 0)),
        "Tốn": (4, "Đông Nam", (0, 1, 1)), "Càn": (6, "Tây Bắc", (1, 1, 1)), "Đoài": (7, "Tây", (1, 1, 0)),
        "Cấn": (8, "Đông Bắc", (0, 0, 1)), "Ly": (9, "Nam", (1, 0, 1))}
SO_QUAI = {v[0]: k for k, v in QUAI.items()}
HUONG_QUAI = {v[1]: k for k, v in QUAI.items()}
HAO_QUAI = {v[2]: k for k, v in QUAI.items()}
HUONG = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"]
DOI = {h: HUONG[(i + 4) % 8] for i, h in enumerate(HUONG)}
DONG_TU = {"Khảm", "Ly", "Chấn", "Tốn"}
CAT = ("Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị")
# (du niên, hào lật: 2 = trên, 1 = giữa, 0 = dưới) — lật tuần tự từ quái gốc
_LAT = [("Sinh Khí", 2), ("Ngũ Quỷ", 1), ("Diên Niên", 0), ("Lục Sát", 1), ("Hoạ Hại", 2),
        ("Thiên Y", 1), ("Tuyệt Mệnh", 0)]


def menh_quai(nam: int, gioi_tinh: str, ngay_sinh: dt.date | None = None) -> dict:
    """Mệnh quái. Có `ngay_sinh` thì xét mốc Lập xuân (giờ VN); không có → gắn cờ nếu cần."""
    if gioi_tinh not in ("nam", "nu"):
        raise ValueError("gioi_tinh phải là 'nam' hoặc 'nu'")
    nam_tinh, co = nam, []
    if ngay_sinh is not None:
        lx = (tk.thoi_diem(ngay_sinh.year, 315) + dt.timedelta(hours=7)).date()
        if ngay_sinh < lx:
            nam_tinh = ngay_sinh.year - 1
        elif ngay_sinh == lx:
            co.append({"loai": "lap_xuan", "chi_tiet": "Sinh đúng ngày Lập xuân — mệnh quái phụ thuộc giờ sinh."})
    else:
        co.append({"loai": "chua_ro_ngay", "chi_tiet": (
            "Chỉ có năm sinh: nếu bạn sinh trước Lập xuân (khoảng 4/2 dương lịch) thì mệnh quái tính theo năm trước.")})
    r = nam_tinh % 9
    so = (11 - r) % 9 if gioi_tinh == "nam" else (r + 4) % 9
    so = so or 9
    if so == 5:
        so = 2 if gioi_tinh == "nam" else 8
    q = SO_QUAI[so]
    return {"quai": q, "so": so, "nhom": nhom(q), "nam_tinh": nam_tinh, "co_canh_bao": co}


def nhom(quai: str) -> str:
    return "Đông tứ mệnh" if quai in DONG_TU else "Tây tứ mệnh"


def bang_huong(quai: str) -> dict[str, str]:
    """8 phương → du niên của người/trạch có quái `quai`."""
    hao = list(QUAI[quai][2])
    kq = {QUAI[quai][1]: "Phục Vị"}
    for ten, i in _LAT:
        hao[i] ^= 1
        kq[QUAI[HAO_QUAI[tuple(hao)]][1]] = ten
    return {h: kq[h] for h in HUONG}


def du_nien(quai: str, huong: str) -> dict:
    d = bang_huong(quai)[huong]
    return {"huong": huong, "du_nien": d, "cat": d in CAT}


def trach(huong_nha: str) -> dict:
    """Nhà hướng `huong_nha` → toạ phương đối diện → trạch quái."""
    toa = DOI[huong_nha]
    q = HUONG_QUAI[toa]
    return {"huong": huong_nha, "toa": toa, "quai": q,
            "nhom": "Đông tứ trạch" if q in DONG_TU else "Tây tứ trạch"}


def huong_tu_do(do: float) -> str:
    """Độ la bàn (0 = chính Bắc, theo chiều kim đồng hồ) → một trong 8 hướng (mỗi hướng 45°)."""
    return HUONG[int(((do % 360) + 22.5) % 360 // 45)]


def do_huong(do: float) -> dict:
    """PT-V1 — độ của HƯỚNG nhà (mặt nhà nhìn ra, đo bằng la bàn) → hướng, sơn hướng, toạ, sơn toạ, trạch.

    Cảnh báo: `khong_vong` (sát ranh hai sơn ±0,5°) · `kiem_huong` (lệch tâm sơn > 3°) ·
    `ranh_gioi_8_huong` (cách ranh hai hướng ≤ 1°, Bát trạch có thể đổi trạch)."""
    from app.calc import huyen_khong as hk  # noqa: PLC0415
    d = do % 360
    toa = (d + 180) % 360
    sh, st = hk.son_tu_do(d), hk.son_tu_do(toa)
    huong = huong_tu_do(d)
    cach_ranh = 22.5 - abs((d + 22.5) % 45 - 22.5)
    # Ranh 8 hướng luôn trùng ranh sơn → ưu tiên báo ranh 8 hướng (đổi cả trạch Bát trạch).
    canh_bao = "ranh_gioi_8_huong" if cach_ranh <= 1 else st["canh_bao"]
    return {"do_huong": round(d, 2), "huong": huong, "son_huong": sh["son"], "do_toa": round(toa, 2),
            "toa": DOI[huong], "son_toa": st["son"], "lech_tam_son": st["lech"], "canh_bao": canh_bao,
            "trach": trach(huong)}


def cua_chu_bep(cua: str, chu: str | None, bep: str | None) -> dict:
    """Du niên giữa các cặp phương vị (cửa–chủ, cửa–bếp, chủ–bếp) — Dương Trạch Tam Yếu."""
    vi = [("cửa", cua), ("chủ", chu), ("bếp", bep)]
    cap = []
    for i in range(3):
        for j in range(i + 1, 3):
            (a, ha), (b, hb) = vi[i], vi[j]
            if ha and hb:
                d = bang_huong(HUONG_QUAI[ha])[hb]
                cap.append({"cap": f"{a}–{b}", "tu": ha, "den": hb, "du_nien": d, "cat": d in CAT})
    nhom_ = {HUONG_QUAI[h] in DONG_TU for _, h in vi if h}
    return {"cap": cap, "cung_nhom": len(nhom_) == 1}


_LO_THU = ["Trung cung", "Tây Bắc", "Tây", "Đông Bắc", "Nam", "Bắc", "Tây Nam", "Đông", "Đông Nam"]
_CHI_HUONG = {"Tý": "Bắc", "Sửu": "Đông Bắc", "Dần": "Đông Bắc", "Mão": "Đông", "Thìn": "Đông Nam",
              "Tỵ": "Đông Nam", "Ngọ": "Nam", "Mùi": "Tây Nam", "Thân": "Tây Nam", "Dậu": "Tây",
              "Tuất": "Tây Bắc", "Hợi": "Tây Bắc"}
_TAM_HOP = [({"Thân", "Tý", "Thìn"}, "Nam", ("Dần", "Mão", "Thìn")),
            ({"Dần", "Ngọ", "Tuất"}, "Bắc", ("Thân", "Dậu", "Tuất")),
            ({"Tỵ", "Dậu", "Sửu"}, "Đông", ("Hợi", "Tý", "Sửu")),
            ({"Hợi", "Mão", "Mùi"}, "Tây", ("Tỵ", "Ngọ", "Mùi"))]


def chi_nam(nam: int) -> str:
    return CHI[(nam - 4) % 12]


def sao_nam(nam: int) -> dict:
    """Năm (tính từ Lập xuân): Ngũ Hoàng (phi tinh năm), Thái Tuế, Tuế Phá, Tam Sát."""
    tam = (11 - nam % 9) % 9 or 9
    k = (5 - tam) % 9
    c = chi_nam(nam)
    ts = next(h for g, h, _ in _TAM_HOP if c in g)
    return {"nam": nam, "chi": c, "sao_trung_cung": tam, "ngu_hoang": _LO_THU[k],
            "thai_tue": _CHI_HUONG[c], "tue_pha": _CHI_HUONG[CHI[(CHI.index(c) + 6) % 12]], "tam_sat": ts}


def kim_lau(tuoi_mu: int) -> dict:
    du = tuoi_mu % 9
    ten = {1: "Kim Lâu Thân", 3: "Kim Lâu Thê", 6: "Kim Lâu Tử", 8: "Kim Lâu Súc"}.get(du)
    return {"pham": ten is not None, "loai": ten, "du": du}


HOANG_OC = ["Nhất Cát", "Nhì Nghi", "Tam Địa Sát", "Tứ Tấn Tài", "Ngũ Thọ Tử", "Lục Hoang Ốc"]


def hoang_oc(tuoi_mu: int) -> dict:
    c = HOANG_OC[(tuoi_mu // 10 - 1 + tuoi_mu % 10) % 6]
    return {"cung": c, "tot": c in ("Nhất Cát", "Nhì Nghi", "Tứ Tấn Tài")}


def tam_tai(chi_sinh: str, nam: int) -> dict:
    nam_tt = next(n for g, _, n in _TAM_HOP if chi_sinh in g)
    c = chi_nam(nam)
    return {"pham": c in nam_tt, "cac_nam_chi": list(nam_tt), "chi_nam": c}


def tuoi_lam_nha(nam_sinh: int, nam_xem: int) -> dict:
    t = nam_xem - nam_sinh + 1
    return {"tuoi_mu": t, "kim_lau": kim_lau(t), "hoang_oc": hoang_oc(t),
            "tam_tai": tam_tai(chi_nam(nam_sinh), nam_xem)}
