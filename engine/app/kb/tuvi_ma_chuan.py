# -*- coding: utf-8 -*-
"""TV-V2 — mã chuẩn Tử vi (MENH, TU_VI, GIAP, TY…) ↔ tên tiếng Việt dự án dùng.

Theo `0_legacy_adapter_mapping` của bộ tài liệu v2.2 (`01_hieuban_astro_kb_v2_2_complete.json`, chủ dự án gửi
2026-10-19 — tệp gốc không vào git), bổ sung tên dự án/iztro thực dùng: "Tử Nữ" (bản v2.2 ghi "Tử Tức"),
"Nô Bộc"/"Giao Hữu", "Hoả Tinh"/"Hỏa Tinh", "Tị"/"Tỵ", "Tí"/"Tý".

Dùng cho: script oracle `ziwei/oracle_v22/` (đưa lá số của dự án vào engine TypeScript v2.2 để đối chiếu) và mọi
chỗ cần mã máy đọc. KHÔNG đưa mã này vào JSON API công khai (API vẫn trả tên tiếng Việt).

Khác adapter TS có chủ ý: tên cung/can/chi không nhận ra → `ValueError` (adapter TS âm thầm trả 'MENH' / 'TY' /
'GIAP'); tên sao không có trong bảng → `None` (adapter TS tạo mã `STAR_<TÊN>`).
"""
from __future__ import annotations

import re
import unicodedata

NGUON = "hieuban_astro_kb_v2_2 · 0_legacy_adapter_mapping (bổ sung tên dự án)"

# mã → tên chuẩn của dự án (đúng chữ iztro vi-VN / tom_tat trả về)
CUNG = {
    "MENH": "Mệnh", "PHU_MAU": "Phụ Mẫu", "PHUC_DUC": "Phúc Đức", "DIEN_TRACH": "Điền Trạch",
    "QUAN_LOC": "Quan Lộc", "NO_BOC": "Nô Bộc", "THIEN_DI": "Thiên Di", "TAT_ACH": "Tật Ách",
    "TAI_BACH": "Tài Bạch", "TU_TUC": "Tử Nữ", "PHU_THE": "Phu Thê", "HUYNH_DE": "Huynh Đệ",
}
CAN = {"GIAP": "Giáp", "AT": "Ất", "BINH": "Bính", "DINH": "Đinh", "MAU": "Mậu",
       "KY": "Kỷ", "CANH": "Canh", "TAN": "Tân", "NHAM": "Nhâm", "QUY": "Quý"}
CHI = {"TY": "Tý", "SUU": "Sửu", "DAN": "Dần", "MAO": "Mão", "THIN": "Thìn", "TI": "Tỵ",
       "NGO": "Ngọ", "MUI": "Mùi", "THAN": "Thân", "DAU": "Dậu", "TUAT": "Tuất", "HOI": "Hợi"}
SAO = {
    "TU_VI": "Tử Vi", "THIEN_CO": "Thiên Cơ", "THAI_DUONG": "Thái Dương", "VU_KHUC": "Vũ Khúc",
    "THIEN_DONG": "Thiên Đồng", "LIEM_TRINH": "Liêm Trinh", "THIEN_PHU": "Thiên Phủ", "THAI_AM": "Thái Âm",
    "THAM_LANG": "Tham Lang", "CU_MON": "Cự Môn", "THIEN_TUONG": "Thiên Tướng", "THIEN_LUONG": "Thiên Lương",
    "THAT_SAT": "Thất Sát", "PHA_QUAN": "Phá Quân",
    "VAN_XUONG": "Văn Xương", "VAN_KHUC": "Văn Khúc", "TA_PHU": "Tả Phù", "HUU_BAT": "Hữu Bật",
    "THIEN_KHOI": "Thiên Khôi", "THIEN_VIET": "Thiên Việt", "LOC_TON": "Lộc Tồn", "THIEN_MA": "Thiên Mã",
    "KINH_DUONG": "Kình Dương", "DA_LA": "Đà La", "HOA_TINH": "Hỏa Tinh", "LINH_TINH": "Linh Tinh",
    "DIA_KHONG": "Địa Không", "DIA_KIEP": "Địa Kiếp",
}
CHINH_TINH = tuple(list(SAO)[:14])
HOA = {"LOC": "Lộc", "QUYEN": "Quyền", "KHOA": "Khoa", "KY": "Kỵ"}

# Tên khác (ngoài tên chuẩn, mã, slug snake_case, camelCase — các dạng đó sinh tự động bên dưới).
_KHAC = {
    "CUNG": {"Cung Mệnh": "MENH", "Giao Hữu": "NO_BOC", "Tử Tức": "TU_TUC"},
    "CAN": {"G.": "GIAP", "Ấ.": "AT", "B.": "BINH", "Đ.": "DINH", "M.": "MAU", "K.": "KY", "C.": "CANH",
            "T.": "TAN", "N.": "NHAM", "Q.": "QUY"},
    "CHI": {"Tí": "TY", "Tị": "TI", "Mẹo": "MAO"},
    "SAO": {"Hoả Tinh": "HOA_TINH"},
    "HOA": {"Hóa Lộc": "LOC", "Hoá Lộc": "LOC", "Hóa Quyền": "QUYEN", "Hoá Quyền": "QUYEN",
            "Hóa Khoa": "KHOA", "Hoá Khoa": "KHOA", "Hóa Kỵ": "KY", "Hoá Kỵ": "KY"},
}


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s).strip()


def _khong_dau(s: str) -> str:
    s = unicodedata.normalize("NFD", s.replace("Đ", "D").replace("đ", "d"))
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")


def _camel(ma: str) -> str:
    a, *b = ma.lower().split("_")
    return a + "".join(x.capitalize() for x in b)


def _bang(nhom: str, chuan: dict[str, str]) -> dict[str, str]:
    """Bảng tra (khoá đã casefold) → mã: tên chuẩn, mã, slug snake_case, camelCase, không dấu, tên khác."""
    t: dict[str, str] = {}
    for ma, ten in chuan.items():
        for k in (ten, ma, ma.lower(), _camel(ma), _khong_dau(ten)):
            t.setdefault(_nfc(k).casefold(), ma)
    for k, ma in _KHAC.get(nhom, {}).items():
        t[_nfc(k).casefold()] = ma
        t.setdefault(_khong_dau(_nfc(k)).casefold(), ma)
    return t


_TRA = {n: _bang(n, b) for n, b in (("CUNG", CUNG), ("CAN", CAN), ("CHI", CHI), ("SAO", SAO), ("HOA", HOA))}
# Mã chi "TY" (Tý) và "TI" (Tỵ): bỏ dấu cả "Tý" lẫn "Tỵ" đều ra "Ty" → dạng không dấu "ty" chỉ hiểu là Tý (như v2.2).
_TRA["CHI"]["ty"] = "TY"
_TRA["CHI"]["ti"] = "TI"
# Can "Kỷ" bỏ dấu = "Ky" trùng mã hoá Kỵ ở nhóm khác — mỗi nhóm có bảng riêng nên không lẫn.


def _ma(nhom: str, ten: str | None) -> str | None:
    if not isinstance(ten, str) or not ten.strip():
        return None
    k = _nfc(ten).casefold()
    if k in _TRA[nhom]:
        return _TRA[nhom][k]
    return _TRA[nhom].get(re.sub(r"\s+", " ", k))


def _bat_buoc(nhom: str, ten: str | None) -> str:
    ma = _ma(nhom, ten)
    if ma is None:
        raise ValueError(f"Không nhận ra tên {nhom.lower()}: {ten!r}")
    return ma


def ma_cung(ten: str) -> str:
    return _bat_buoc("CUNG", ten)


def ma_can(ten: str) -> str:
    return _bat_buoc("CAN", ten)


def ma_chi(ten: str) -> str:
    return _bat_buoc("CHI", ten)


def ma_hoa(ten: str) -> str:
    return _bat_buoc("HOA", ten)


def ma_sao(ten: str) -> str | None:
    """Mã sao; sao ngoài bảng (tạp diệu, Tuần/Triệt…) → None."""
    return _ma("SAO", ten)


def ten_cung(ma: str) -> str:
    return CUNG[ma]


def ten_can(ma: str) -> str:
    return CAN[ma]


def ten_chi(ma: str) -> str:
    return CHI[ma]


def ten_sao(ma: str) -> str:
    return SAO[ma]


def ten_hoa(ma: str) -> str:
    return HOA[ma]


def cung_sang_ma(cung: list[dict]) -> list[dict]:
    """12 cung dạng `hoidap.tuvi.tom_tat(...)["cung"]` → PalaceInput của engine v2.2
    ({palaceCode, branch, stem, stars, hasTuan, hasTriet}); chỉ giữ sao có mã (chính tinh + lục cát/sát…)."""
    ra = []
    for c in cung:
        ten = [s["ten"] if isinstance(s, dict) else s for s in c.get("chinh_tinh", [])] + list(c.get("phu_tinh", []))
        ra.append({"palaceCode": ma_cung(c["ten"]), "branch": ma_chi(c["chi"]),
                   **({"stem": ma_can(c["can"])} if c.get("can") else {}),
                   "stars": [m for m in (ma_sao(s) for s in ten) if m],
                   "hasTuan": "Tuần Không" in c.get("phu_tinh", []),
                   "hasTriet": "Triệt Lộ" in c.get("phu_tinh", [])})
    return ra
