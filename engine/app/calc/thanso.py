# -*- coding: utf-8 -*-
"""Thần số học Pythagoras — bản port của `C:/Users/mrduc/thanso-hoc/thanso.py`.

Port TRUNG THỰC: logic không đổi một chữ. Chỉ bỏ phần CLI, thêm chú thích kiểu
và đưa vào cấu trúc gói. Hành vi được khoá bằng golden dataset sinh từ bản gốc.

Đặc trưng phải giữ: hàm `do_nhay` không trả về MỘT con số mà trả về CẢ KHOẢNG
con số mà các quy ước hợp lý đều có thể cho. Đó là điểm khác biệt của bản gốc.
Bỏ nó đi thì sản phẩm thành một cỗ máy đoán bừa nghe có vẻ chắc chắn.

Tầng CALC: thuần tuý, tất định, không LLM, không DB, không trạng thái.
"""
from __future__ import annotations

import collections
import datetime
import itertools
import unicodedata

MASTER: frozenset[int] = frozenset({11, 22, 33})
NGUYEN_AM: frozenset[str] = frozenset("AEIOU")   # Y là điểm tranh cãi

CheDo = str          # "su_menh" | "linh_hon" | "nhan_cach"
QuyUocDuongDoi = str  # "tong_het" | "tung_phan"
MocNamCaNhan = str    # "sinh_nhat" | "duong_lich"


def bo_dau(s: str, d_thanh_d: bool = True) -> str:
    """Bỏ dấu tiếng Việt. Đ/đ không phải là D + dấu nên phải xử lý riêng."""
    s = s.replace("Đ", "D" if d_thanh_d else "").replace("đ", "d" if d_thanh_d else "")
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def gia_tri(ch: str) -> int:
    return (ord(ch.upper()) - 65) % 9 + 1 if ch.isalpha() and ch.isascii() else 0


def rut_gon(n: int, giu_master: bool = True) -> int:
    while n > 9 and not (giu_master and n in MASTER):
        n = sum(int(d) for d in str(n))
    return n


def chi_so_ten(
    ten: str,
    che_do: CheDo,
    d_thanh_d: bool = True,
    y_la_nguyen_am: bool = False,
    giu_master: bool = True,
) -> int:
    t = bo_dau(ten, d_thanh_d).upper()
    na = NGUYEN_AM | ({"Y"} if y_la_nguyen_am else set())
    if che_do == "su_menh":
        chon = [c for c in t if c.isalpha()]
    elif che_do == "linh_hon":
        chon = [c for c in t if c in na]
    else:
        chon = [c for c in t if c.isalpha() and c not in na]
    return rut_gon(sum(gia_tri(c) for c in chon), giu_master)


def duong_doi(
    d: int, m: int, y: int,
    quy_uoc: QuyUocDuongDoi = "tong_het",
    giu_master: bool = True,
) -> int:
    if quy_uoc == "tong_het":
        return rut_gon(sum(int(c) for c in f"{d}{m}{y}"), giu_master)
    return rut_gon(
        rut_gon(d, giu_master) + rut_gon(m, giu_master) + rut_gon(y, giu_master),
        giu_master,
    )


def do_nhay(ten_bien_the: list[str], d: int, m: int, y: int) -> dict[str, list[int]]:
    """Quét mọi tổ hợp quy ước hợp lý → tập kết quả có thể có.

    Nhiều hơn một giá trị nghĩa là chỉ số KHÔNG xác định: phải chốt quy ước
    với người dùng trước khi luận, không được tự chọn một cái rồi trình bày
    như thể nó là con số duy nhất.
    """
    kq: dict[str, set[int]] = collections.defaultdict(set)
    for ten in ten_bien_the:
        for dd, yy, gm in itertools.product([True, False], [True, False], [True, False]):
            kq["su_menh"].add(chi_so_ten(ten, "su_menh", dd, yy, gm))
            kq["linh_hon"].add(chi_so_ten(ten, "linh_hon", dd, yy, gm))
            kq["nhan_cach"].add(chi_so_ten(ten, "nhan_cach", dd, yy, gm))
    for qu, gm in itertools.product(["tong_het", "tung_phan"], [True, False]):
        kq["duong_doi"].add(duong_doi(d, m, y, qu, gm))
    return {k: sorted(v) for k, v in kq.items()}


# --------------------------------------------------------------------------- #
# Chu kỳ
# --------------------------------------------------------------------------- #
def _nhan_nam_ca_nhan(d: int, m: int, nam: int, giu_master: bool = False) -> int:
    return rut_gon(
        rut_gon(d, False) + rut_gon(m, False) + rut_gon(nam, False), giu_master
    )


def nam_ca_nhan(
    d: int, m: int, nam_xem: int,
    moc: MocNamCaNhan = "sinh_nhat",
    giu_master: bool = False,
) -> int | tuple[int, int]:
    """Năm cá nhân cho MỘT năm dương lịch.

    moc='duong_lich' → MỘT int cho cả năm.
    moc='sinh_nhat'  → TUPLE (truoc_sinh_nhat, tu_sinh_nhat).

    Hai quy ước LUÔN lệch nhau ở quãng đầu năm. Chọn mốc sinh nhật nghĩa là mỗi
    năm dương lịch có HAI con số — tức có hai cơ hội khớp cùng một sự kiện.
    Đó là một nhánh độ nhạy, không phải chi tiết kỹ thuật vô hại.
    """
    if moc == "duong_lich":
        return _nhan_nam_ca_nhan(d, m, nam_xem, giu_master)
    if moc != "sinh_nhat":
        raise ValueError(
            f"moc khong hop le: {moc!r} (chi nhan 'sinh_nhat' hoac 'duong_lich')"
        )
    return (
        _nhan_nam_ca_nhan(d, m, nam_xem - 1, giu_master),
        _nhan_nam_ca_nhan(d, m, nam_xem, giu_master),
    )


def dinh_cao(d: int, m: int, y: int, dd: int) -> list[dict]:
    """4 Đỉnh cao + mốc tuổi. Mốc 1 kết thúc ở 36 − số Đường đời."""
    M, D, Y = rut_gon(m, False), rut_gon(d, False), rut_gon(y, False)
    p1, p2 = rut_gon(M + D, False), rut_gon(D + Y, False)
    p3, p4 = rut_gon(p1 + p2, False), rut_gon(M + Y, False)
    het1 = 36 - rut_gon(dd, False)
    return [
        {"dinh": 1, "so": p1, "tu_tuoi": 0, "den_tuoi": het1},
        {"dinh": 2, "so": p2, "tu_tuoi": het1 + 1, "den_tuoi": het1 + 9},
        {"dinh": 3, "so": p3, "tu_tuoi": het1 + 10, "den_tuoi": het1 + 18},
        {"dinh": 4, "so": p4, "tu_tuoi": het1 + 19, "den_tuoi": None},
    ]


def thu_thach(d: int, m: int, y: int) -> dict[str, int]:
    """4 Thử thách — rút gọn về 0..8, KHÔNG có số cái."""
    M, D, Y = rut_gon(m, False), rut_gon(d, False), rut_gon(y, False)
    c1, c2 = abs(M - D), abs(D - Y)
    return {
        "thu_thach_1": c1,
        "thu_thach_2": c2,
        "thu_thach_chinh": abs(c1 - c2),
        "thu_thach_4": abs(M - Y),
    }


def chu_ky_9_nam(
    d: int, m: int, nam_sinh: int, tu_nam: int, den_nam: int,
    moc: MocNamCaNhan = "sinh_nhat",
) -> list[dict]:
    """Bảng năm cá nhân để ĐỐI CHIẾU HỒI TỐ với đời thực.

    Xuất CẢ HAI quy ước mốc cho từng năm, vì chúng không trùng nhau — che một
    trong hai là che mất một nhánh độ nhạy.
    """
    bang: list[dict] = []
    for n in range(tu_nam, den_nam + 1):
        dl = nam_ca_nhan(d, m, n, "duong_lich")
        truoc, tu_sn = nam_ca_nhan(d, m, n, "sinh_nhat")  # type: ignore[misc]
        bang.append(
            {
                "nam": n,
                "tuoi_that": n - nam_sinh,
                "tuoi_mu": n - nam_sinh + 1,
                "moc_duong_lich": dl,
                "moc_sinh_nhat": {"truoc_sinh_nhat": truoc, "tu_sinh_nhat": tu_sn},
                "hai_moc_lech": truoc != dl,
                "nam_ca_nhan": dl if moc == "duong_lich" else tu_sn,
            }
        )
    return bang


def so_nguoi_trung_chu_ky() -> dict[str, str]:
    """Chu kỳ chỉ phụ thuộc ngày+tháng sinh → 1/366 dân số có chuỗi y hệt."""
    return {
        "ty_le": "1/366",
        "uoc_tinh_toan_cau": "~22 triệu người",
        "y_nghia": (
            "Chuỗi năm cá nhân của anh trùng khít với ~22 triệu người khác, "
            "suốt đời, không lệch một năm nào."
        ),
    }


def phan_bo_duong_doi(tu_nam: int = 1950, den_nam: int = 2010) -> tuple[dict[str, str], int]:
    c: collections.Counter[int] = collections.Counter()
    ngay = datetime.date(tu_nam, 1, 1)
    het = datetime.date(den_nam, 12, 31)
    while ngay <= het:
        c[duong_doi(ngay.day, ngay.month, ngay.year)] += 1
        ngay += datetime.timedelta(days=1)
    tong = sum(c.values())
    return {str(k): f"{v / tong * 100:.1f}%" for k, v in sorted(c.items())}, tong
