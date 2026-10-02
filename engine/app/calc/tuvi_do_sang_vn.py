# -*- coding: utf-8 -*-
"""TV-NP — độ sáng (miếu/vượng/đắc/bình/hãm) của 14 chính tinh theo lối Việt (Nam phái).

Bảng phổ biến trong sách Tử vi Việt (dòng Thái Thứ Lang — Tử Vi Đẩu Số Tân Biên); khác bảng phái Trung
mà iztro dùng (vd Tử Vi tại Mão: Việt = Bình, iztro = Vượng). Đã đối chứng 8 điểm với lá số một trang
tử vi Việt (tests/test_do_sang_nam_phai.py); phần còn lại chờ chuyên gia duyệt. Chỉ thêm trường
`do_sang_nam_phai`, KHÔNG đổi an sao → không tăng ENGINE_VERSION.
"""
from __future__ import annotations

_M, _V, _D, _B, _H = "Miếu", "Vượng", "Đắc", "Bình", "Hãm"
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]


def _bang(**nhom: str) -> dict[str, str]:
    """nhom: muc → chuỗi chi cách nhau bởi dấu cách; chi không nêu = Bình."""
    b = dict.fromkeys(CHI, _B)
    for muc, ds in nhom.items():
        for c in ds.split():
            b[c] = {"M": _M, "V": _V, "D": _D, "H": _H, "B": _B}[muc]
    return b


BANG: dict[str, dict[str, str]] = {
    "Tử Vi": _bang(M="Tỵ Ngọ Dần Thân", V="Thìn Tuất", D="Sửu Mùi"),
    "Thiên Cơ": _bang(M="Thìn Tuất Mão Dậu", V="Tỵ Thân", D="Tý Ngọ Sửu Mùi", H="Dần Hợi"),
    "Thái Dương": _bang(M="Tỵ Ngọ", V="Dần Mão Thìn", D="Sửu Mùi", H="Thân Dậu Tuất Hợi Tý"),
    "Vũ Khúc": _bang(M="Thìn Tuất Sửu Mùi", V="Dần Thân Tý Ngọ", D="Mão Dậu", H="Tỵ Hợi"),
    "Thiên Đồng": _bang(M="Dần Thân", V="Tý", D="Mão Tỵ Hợi", H="Ngọ Dậu Thìn Tuất Sửu Mùi"),
    "Liêm Trinh": _bang(M="Thìn Tuất", V="Tý Ngọ Dần Thân", D="Sửu Mùi", H="Tỵ Hợi Mão Dậu"),
    "Thiên Phủ": _bang(M="Dần Thân Tý Ngọ", V="Thìn Tuất", D="Tỵ Hợi Mùi"),
    "Thái Âm": _bang(M="Dậu Tuất Hợi", V="Thân Tý", D="Sửu Mùi", H="Dần Mão Thìn Tỵ Ngọ"),
    "Tham Lang": _bang(M="Sửu Mùi", V="Thìn Tuất", D="Dần Thân", H="Tỵ Hợi Tý Ngọ Mão Dậu"),
    "Cự Môn": _bang(M="Mão Dậu", V="Tý Ngọ Dần", D="Thân Hợi", H="Thìn Tuất Sửu Mùi Tỵ"),
    "Thiên Tướng": _bang(M="Dần Thân", V="Thìn Tuất Tý Ngọ", D="Sửu Mùi Tỵ Hợi", H="Mão Dậu"),
    "Thiên Lương": _bang(M="Ngọ Thìn Tuất", V="Tý Mão Dần Thân", D="Sửu Mùi", H="Dậu Tỵ Hợi"),
    "Thất Sát": _bang(M="Dần Thân Tý Ngọ", V="Tỵ Hợi", D="Sửu Mùi", H="Mão Dậu Thìn Tuất"),
    "Phá Quân": _bang(M="Tý Ngọ", V="Sửu Mùi", D="Thìn Tuất", H="Mão Dậu Dần Thân Tỵ Hợi"),
}


def do_sang(sao: str, chi: str) -> str | None:
    b = BANG.get(sao)
    return b[chi] if b else None


# --------------------------------------------------------------------------- #
# TV-NP2 — độ sáng phụ tinh lối Việt. Dữ liệu chuyển từ `lasotuvi` 0.1.2 (MIT, © doanguyen,
# github.com/doanguyen/lasotuvi — DiaBan.maTranDacTinh); golden fixtures/golden/do_sang_lasotuvi.json.
# Cùng bảng đó khớp 156/156 ô chính tinh của BANG ở trên (đối chứng độc lập). Ô không nêu = sao không
# luận miếu/hãm ở cung đó (None), KHÁC với "Bình".
# --------------------------------------------------------------------------- #
def _bang_phu(**nhom: str) -> dict[str, str]:
    m = {"M": _M, "V": _V, "D": _D, "H": _H, "B": _B}
    return {c: m[muc] for muc, ds_ in nhom.items() for c in ds_.split()}


BANG_PHU: dict[str, dict[str, str]] = {
    "Đà La": _bang_phu(H="Tý Dần Mão Tỵ Ngọ Thân Dậu Hợi", D="Sửu Thìn Mùi Tuất"),
    "Kình Dương": _bang_phu(H="Tý Dần Mão Tỵ Ngọ Thân Dậu Hợi", D="Sửu Thìn Mùi Tuất"),
    "Linh Tinh": _bang_phu(H="Tý Sửu Mùi Thân Dậu Tuất Hợi", D="Dần Mão Thìn Tỵ Ngọ"),
    "Hỏa Tinh": _bang_phu(H="Tý Sửu Mùi Thân Dậu Tuất Hợi", D="Dần Mão Thìn Tỵ Ngọ"),
    "Văn Xương": _bang_phu(H="Tý Dần Thìn Ngọ Thân Dậu", D="Sửu Mão Tỵ Mùi Tuất Hợi"),
    "Văn Khúc": _bang_phu(H="Tý Dần Thìn Ngọ Thân Dậu", D="Sửu Mão Tỵ Mùi Tuất Hợi"),
    "Địa Không": _bang_phu(H="Tý Sửu Mão Thìn Ngọ Mùi Dậu Tuất", D="Dần Tỵ Thân Hợi"),
    "Địa Kiếp": _bang_phu(H="Tý Sửu Mão Thìn Ngọ Mùi Dậu Tuất", D="Dần Tỵ Thân Hợi"),
    "Hóa Kỵ": _bang_phu(D="Sửu Thìn Mùi Tuất"),
    "Đại Hao": _bang_phu(D="Dần Mão Thân Dậu"),
    "Tiểu Hao": _bang_phu(D="Dần Mão Thân Dậu"),
    "Thiên Khốc": _bang_phu(D="Tý Sửu Mão Ngọ Mùi Dậu"),
    "Thiên Hư": _bang_phu(D="Tý Sửu Mão Ngọ Mùi Dậu"),
    "Thiên Mã": _bang_phu(D="Dần Tỵ"),
    "Thiên Hình": _bang_phu(D="Dần Mão Thân Dậu"),
    "Thiên Diêu": _bang_phu(D="Dần Mão Dậu Tuất"),
}


def do_sang_phu(sao: str, chi: str) -> str | None:
    """Độ sáng lối Việt của phụ tinh / tạp diệu tại `chi`; None nếu sách không luận sao đó ở cung đó."""
    return BANG_PHU.get(sao, {}).get(chi)
