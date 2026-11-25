# -*- coding: utf-8 -*-
"""TY-2 đợt 3 — nhà nhiều lớp theo Dương Trạch Tam Yếu (Triệu Cửu Phong): tĩnh / động / biến / hoá trạch.

Sách (kho nguồn `fixtures/nguon/duong_trach_tam_yeu.json`, golden `fixtures/golden/phongthuy_nhieu_lop_sach.json`):
* một sân = tĩnh trạch (xét Cửa – Chủ – Bếp như thường); 2–5 lớp = động trạch; 6–10 = biến trạch; 11–15 = hoá trạch
  (sách dùng số Hà đồ Lạc thư — CHƯA làm, trả `lop: None`);
* sao lớp đầu (lớp 1 = cổng) = du niên từ phía nhà chính (坐山主房) tới phía hướng (đối diện nhà chính); cổng lệch một
  bên (門偏一邊) thì tính từ phía cổng;
* động trạch: lớp sau là sao do hành lớp trước sinh ra, mỗi hành một sao (巨門生武曲, 武曲生文曲, 文曲生貪狼, 貪狼生廉貞,
  廉貞生巨門);
* biến trạch: Kim, Mộc, Thổ đi đôi — vào hành đôi thì sao "trước" rồi sao "sau" (Mộc: Phụ Bật → Tham Lang; Thổ: Lộc Tồn →
  Cự Môn; Kim: Vũ Khúc → Phá Quân); lớp đầu là một sao của hành đôi thì lớp kế là sao còn lại. Sáu lớp chỉ đôi một hành,
  bảy đôi hai, tám đôi ba, chín – mười đi tiếp vòng (đoạn 20). Bảy lớp chưa có ví dụ sách kiểm toàn dãy (chỉ lớp 6).
Đánh giá nhà chính: sao rơi vào lớp nhà chính (dãy cao nhất) so với hành phía nhà chính — sao tốt và hai hành nuôi nhau /
cùng hành → thuận; sao xấu mà chọi nhau → cần chủ động; còn lại cân bằng. Tất định, không giữ trạng thái.
"""
from __future__ import annotations

from app.calc import phongthuy as pt

DOI_DIEN = {"Khảm": "Ly", "Ly": "Khảm", "Chấn": "Đoài", "Đoài": "Chấn", "Cấn": "Khôn", "Khôn": "Cấn", "Tốn": "Càn", "Càn": "Tốn"}
HANH_QUAI = {"Khảm": "Thuỷ", "Ly": "Hoả", "Chấn": "Mộc", "Tốn": "Mộc", "Càn": "Kim", "Đoài": "Kim", "Khôn": "Thổ", "Cấn": "Thổ"}
HANH_DU_NIEN = {"Sinh Khí": "Mộc", "Phục Vị": "Mộc", "Diên Niên": "Kim", "Tuyệt Mệnh": "Kim",
                "Thiên Y": "Thổ", "Hoạ Hại": "Thổ", "Ngũ Quỷ": "Hoả", "Lục Sát": "Thuỷ"}
SAO = {"Sinh Khí": "Tham Lang", "Thiên Y": "Cự Môn", "Diên Niên": "Vũ Khúc", "Phục Vị": "Phụ Bật",
       "Hoạ Hại": "Lộc Tồn", "Lục Sát": "Văn Khúc", "Ngũ Quỷ": "Liêm Trinh", "Tuyệt Mệnh": "Phá Quân"}
_SINH = {"Mộc": "Hoả", "Hoả": "Thổ", "Thổ": "Kim", "Kim": "Thuỷ", "Thuỷ": "Mộc"}
# Động trạch (và hành không đi đôi ở biến trạch): mỗi hành một sao.
DON = {"Mộc": "Sinh Khí", "Hoả": "Ngũ Quỷ", "Thổ": "Thiên Y", "Kim": "Diên Niên", "Thuỷ": "Lục Sát"}
# Biến trạch: hành đi đôi, thứ tự khi vào hành ấy.
CAP_VAO = {"Mộc": ("Phục Vị", "Sinh Khí"), "Thổ": ("Hoạ Hại", "Thiên Y"), "Kim": ("Diên Niên", "Tuyệt Mệnh")}
_BAN = {a: b for x, y in CAP_VAO.values() for a, b in ((x, y), (y, x))}


def loai(so_lop: int) -> str:
    if not 1 <= so_lop <= 15:
        raise ValueError("Số lớp nhà cần từ 1 đến 15")
    return "tinh" if so_lop == 1 else "dong" if so_lop <= 5 else "bien" if so_lop <= 10 else "hoa"


def du_nien(a: str, b: str) -> str:
    return pt.bang_huong(a)[pt.QUAI[b][1]]


def cong_lech(chu: str, cua: str) -> bool:
    """Cổng không nằm ở phía đối diện nhà chính (phía hướng) = cổng lệch một bên (門偏一邊) — khớp cả 9 ví dụ sách."""
    return cua != DOI_DIEN[chu]


def sao_dau(chu: str, cua: str, cua_lech: bool | None = None) -> str:
    """Du niên lớp 1 (cổng): từ phía nhà chính — hoặc phía cổng khi cổng lệch — tới phía hướng (đối diện nhà chính).
    `cua_lech` None → tự suy (`cong_lech`)."""
    lech = cong_lech(chu, cua) if cua_lech is None else cua_lech
    return du_nien(cua if lech else chu, DOI_DIEN[chu])


def day_lop(chu: str, cua: str, so_lop: int, cua_lech: bool | None = None) -> list[str] | None:
    """Du niên của từng lớp (lớp 1 = cổng). Tĩnh trạch → []; hoá trạch → None (chưa làm)."""
    k = loai(so_lop)
    if k == "tinh":
        return []
    if k == "hoa":
        return None
    day = [sao_dau(chu, cua, cua_lech)]
    if k == "dong":
        while len(day) < so_lop:
            day.append(DON[_SINH[HANH_DU_NIEN[day[-1]]]])
        return day
    toi_da = so_lop - 5 if so_lop < 8 else 99            # 6 lớp đôi một hành, 7 đôi hai, từ 8 đôi đủ
    da_doi = 0
    if day[0] in _BAN and da_doi < toi_da:
        day.append(_BAN[day[0]])
        da_doi += 1
    while len(day) < so_lop:
        h = _SINH[HANH_DU_NIEN[day[-1]]]
        if h in CAP_VAO and da_doi < toi_da:
            day.extend(CAP_VAO[h])
            da_doi += 1
        else:
            day.append(DON[h])
    return day[:so_lop]


def quan_he(sao_hanh: str, cung_hanh: str) -> str:
    if sao_hanh == cung_hanh:
        return "ty_hoa"
    if _SINH[sao_hanh] == cung_hanh:
        return "sao_sinh_cung"
    if _SINH[cung_hanh] == sao_hanh:
        return "cung_sinh_sao"
    return "sao_khac_cung" if _SINH[_SINH[sao_hanh]] == cung_hanh else "cung_khac_sao"


_HOP = ("ty_hoa", "sao_sinh_cung", "cung_sinh_sao")


def _muc(dn: str, qh: str) -> str:
    cat, hop = dn in pt.CAT, qh in _HOP
    return "thuan" if cat and hop else "can_chu_dong" if not cat and not hop else "can_bang"


def danh_gia(chu: str, cua: str, so_lop: int, lop_chu: int | None = None, cua_lech: bool | None = None) -> dict:
    """`lop_chu` = lớp có dãy nhà chính (cao, lớn nhất), đếm từ cổng = 1. Trả dãy sao, đánh giá lớp nhà chính, các lớp
    nên làm cao, cờ nhà 'đè sát' (cặp cửa – chủ xấu nhưng sao tốt rơi đúng nhà chính)."""
    k = loai(so_lop)
    if lop_chu is not None and not 1 <= lop_chu <= so_lop:
        raise ValueError("Lớp nhà chính phải nằm trong số lớp của nhà")
    if cua_lech is None:
        cua_lech = cong_lech(chu, cua)
    day = day_lop(chu, cua, so_lop, cua_lech)
    if not day:
        return {"loai": k, "so_lop": so_lop, "lop": day, "lop_chu": None, "lop_nen_cao": [], "ap_sat": False}
    hc = HANH_QUAI[chu]
    lop = []
    for i, dn in enumerate(day, 1):
        qh = quan_he(HANH_DU_NIEN[dn], hc)
        lop.append({"so": i, "du_nien": dn, "sao": SAO[dn], "hanh": HANH_DU_NIEN[dn], "cat": dn in pt.CAT,
                    "quan_he": qh, "muc": _muc(dn, qh)})
    lc = lop[lop_chu - 1] if lop_chu else None
    return {"loai": k, "so_lop": so_lop, "cua_lech": cua_lech, "sao_dau_tu": cua if cua_lech else chu, "huong": DOI_DIEN[chu],
            "lop": lop, "lop_chu": lc, "lop_nen_cao": [x["so"] for x in lop if x["so"] > 1 and x["muc"] == "thuan"],
            "ap_sat": bool(lc and lc["muc"] == "thuan" and du_nien(cua, chu) not in pt.CAT)}
