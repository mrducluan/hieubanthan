# -*- coding: utf-8 -*-
"""Chỉ số thần số mở rộng (v2) — biểu đồ ngày sinh, mũi tên, chỉ số phụ, nghiệp,
nhịp tháng/ngày, cặp số hai người.

Tầng CALC: thuần tuý, tất định, không LLM, không DB. KHÔNG sửa bản port gốc
`thanso.py` — module này chỉ gọi lại các hàm của nó. Quy ước từng chỉ số ghi ở
docs/KIEN-TRUC-THANSO-V2.md mục 3.1; đáp án tính tay ở
fixtures/golden/thanso_mo_rong.json.

Tên gọi và ý nghĩa (vd "mũi tên quyết tâm") KHÔNG nằm ở đây — thuộc tầng KB.
CALC chỉ trả mã ("1-5-9") để KB tra.
"""
from __future__ import annotations

from app.calc import thanso

NO_NGHIEP: frozenset[int] = frozenset({13, 14, 16, 19})

# Lưới 3×3: hàng trên 3-6-9, giữa 2-5-8, dưới 1-4-7 (cột trái 1-2-3).
LUOI = [[3, 6, 9], [2, 5, 8], [1, 4, 7]]

# Thứ tự cố định để kết quả ổn định: 3 cột, 3 hàng, 2 đường chéo.
MUI_TEN: list[tuple[int, int, int]] = [
    (1, 2, 3), (1, 4, 7), (2, 5, 8), (3, 6, 9),
    (4, 5, 6), (7, 8, 9), (1, 5, 9), (3, 5, 7),
]


def _chu_so(*so: int) -> list[int]:
    return [int(c) for n in so for c in str(n)]


def chuoi_rut_gon(n: int) -> list[int]:
    """Toàn bộ chuỗi rút gọn, dừng ở 1–9 hoặc số cái. Vd 39 → [39, 12, 3]."""
    seq = [n]
    while n > 9 and n not in thanso.MASTER:
        n = sum(int(c) for c in str(n))
        seq.append(n)
    return seq


# ------------------------------------------------------------------ chỉ số phụ
def so_ngay_sinh(d: int) -> int:
    return thanso.rut_gon(d, giu_master=True)


def so_thai_do(d: int, m: int) -> int:
    return thanso.rut_gon(sum(_chu_so(d, m)), giu_master=True)


def so_truong_thanh(duong_doi: int, su_menh: int) -> int:
    return thanso.rut_gon(duong_doi + su_menh, giu_master=True)


# ------------------------------------------------------------------ nhịp thời gian
def thang_ca_nhan(d: int, m: int, nam_xem: int, thang_xem: int) -> int:
    """Năm cá nhân (mốc 1/1, như trang đọc) + tháng xem, rút về 1–9."""
    ncn = thanso.nam_ca_nhan(d, m, nam_xem, "duong_lich")
    return thanso.rut_gon(int(ncn) + thang_xem, giu_master=False)


def ngay_ca_nhan(d: int, m: int, nam_xem: int, thang_xem: int, ngay_xem: int) -> int:
    tcn = thang_ca_nhan(d, m, nam_xem, thang_xem)
    return thanso.rut_gon(tcn + thanso.rut_gon(ngay_xem, False), giu_master=False)


# ------------------------------------------------------------------ biểu đồ
def bieu_do_ngay_sinh(d: int, m: int, y: int) -> dict:
    """Đếm chữ số 1–9 trong ngày/tháng/năm sinh (bỏ số 0) và đọc mũi tên.

    mũi tên đủ   = cả ba ô của một hàng/cột/chéo đều có số
    mũi tên trống = cả ba ô đều trống
    """
    dem: dict[int, int] = {}
    for c in _chu_so(d, m, y):
        if c:
            dem[c] = dem.get(c, 0) + 1
    dem = dict(sorted(dem.items()))
    co = set(dem)
    return {
        "dem": dem,
        "luoi": [[dem.get(o, 0) for o in hang] for hang in LUOI],
        "so_thieu": [s for s in range(1, 10) if s not in co],
        "so_lap": {s: n for s, n in dem.items() if n >= 2},
        "mui_ten_du": [{"ma": "-".join(map(str, mt))}
                       for mt in MUI_TEN if all(s in co for s in mt)],
        "mui_ten_trong": [{"ma": "-".join(map(str, mt))}
                          for mt in MUI_TEN if not any(s in co for s in mt)],
    }


# ------------------------------------------------------------------ nghiệp
def _tong_ten(ten: str, che_do: str) -> int:
    """Tổng CHƯA rút gọn theo quy tắc Y khoá — cùng logic gia_tri_xac_dinh()."""
    tong = 0
    for am_tiet in thanso.bo_dau(ten, True).split():
        hoa = am_tiet.upper()
        for i, ch in enumerate(hoa):
            if not (ch.isalpha() and ch.isascii()):
                continue
            la_na = ch in thanso.NGUYEN_AM or (ch == "Y" and thanso.y_la_nguyen_am_tai(hoa, i))
            if (che_do == "su_menh"
                    or (che_do == "linh_hon" and la_na)
                    or (che_do == "nhan_cach" and not la_na)):
                tong += thanso.gia_tri(ch)
    return tong


def no_nghiep(ho_ten: str | None, d: int, m: int, y: int) -> list[dict]:
    """13/14/16/19 xuất hiện trong chuỗi rút gọn của từng vị trí.

    Không có tên → chỉ xét ngày sinh và đường đời.
    """
    tong = {"ngay_sinh": d, "duong_doi": sum(_chu_so(d, m, y))}
    if ho_ten:
        for vt in ("su_menh", "linh_hon", "nhan_cach"):
            tong[vt] = _tong_ten(ho_ten, vt)
    kq = []
    for vt, t in tong.items():
        trung = [n for n in chuoi_rut_gon(t) if n in NO_NGHIEP]
        if trung:
            kq.append({"vi_tri": vt, "so": trung[0]})
    return kq


def bai_hoc_nghiep(ho_ten: str) -> list[int]:
    """Chữ số 1–9 không xuất hiện trong giá trị chữ cái của tên."""
    co = {thanso.gia_tri(c) for c in thanso.bo_dau(ho_ten, True) if c.isalpha()}
    return [s for s in range(1, 10) if s not in co]


# ------------------------------------------------------------------ hai người
def so_goc(n: int) -> int:
    """Số cái về gốc để tra bảng cặp 1–9: 11→2, 22→4, 33→6."""
    return {11: 2, 22: 4, 33: 6}.get(n, n)


def cap_so(a: int, b: int) -> str:
    x, y = sorted((so_goc(a), so_goc(b)))
    return f"{x}-{y}"


def hop_doi(chi_so_a: dict[str, int], chi_so_b: dict[str, int]) -> dict[str, str]:
    """Cặp số theo từng vị trí có ở cả hai người (đường đời, linh hồn, nhân cách…)."""
    return {vt: cap_so(chi_so_a[vt], chi_so_b[vt])
            for vt in ("duong_doi", "linh_hon", "nhan_cach", "su_menh")
            if vt in chi_so_a and vt in chi_so_b}


# ------------------------------------------------------------------ gom
def chi_so_mo_rong(ho_ten: str | None, d: int, m: int, y: int,
                   nam_xem: int, thang_xem: int, ngay_xem: int) -> dict:
    """Mọi chỉ số v2 cho một người, tại một ngày xem."""
    dd = thanso.duong_doi(d, m, y)
    kq: dict = {
        "so_ngay_sinh": so_ngay_sinh(d),
        "so_thai_do": so_thai_do(d, m),
        "nam_ca_nhan": int(thanso.nam_ca_nhan(d, m, nam_xem, "duong_lich")),
        "thang_ca_nhan": thang_ca_nhan(d, m, nam_xem, thang_xem),
        "ngay_ca_nhan": ngay_ca_nhan(d, m, nam_xem, thang_xem, ngay_xem),
        "bieu_do": bieu_do_ngay_sinh(d, m, y),
        "no_nghiep": no_nghiep(ho_ten, d, m, y),
    }
    if ho_ten:
        kq["so_truong_thanh"] = so_truong_thanh(dd, thanso.gia_tri_xac_dinh(ho_ten, "su_menh"))
        kq["bai_hoc_nghiep"] = bai_hoc_nghiep(ho_ten)
    return kq


def ngay_pho_quat(nam_xem: int, thang_xem: int, ngay_xem: int) -> int:
    """Ngày phổ quát (chung cho mọi người): cộng mọi chữ số của ngày xem, rút về 1–9."""
    return thanso.rut_gon(sum(_chu_so(ngay_xem, thang_xem, nam_xem)), giu_master=False)
