# -*- coding: utf-8 -*-
"""QTE-2 — bảng TÊN RIÊNG theo ngôn ngữ (`kb/data/ten_en.json`): sao, cung, độ sáng, hoá, cục (Tử vi); can, chi, hành;
thập thần, 12 trạng thái (Bát tự); quái, du niên, hướng, sao bay (Phong thuỷ); 64 quẻ, bát quái (Kinh Dịch).

Tiếng Việt: trả nguyên chữ (engine vẫn tính và ghi bằng tên Việt — bảng mã chuẩn `tuvi_ma_chuan` không đổi). Ngôn ngữ
khác: tra bảng, không có thì trả chữ Việt (không bịa, không bỏ trống). Chỉ lớp HIỂN THỊ / trang kiến thức dùng; phép
tính không bao giờ gọi vào đây.
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb import nap

TEP = "ten_en.json"
# Nhóm tra cứu → đường trong tệp (nhóm chung giữa các mảng gộp nhiều bảng, bảng trước thắng).
NHOM: dict[str, tuple[tuple[str, str], ...]] = {
    "sao": (("tuvi", "chinh_tinh"), ("tuvi", "phu_tinh"), ("tuvi", "tap_dieu"), ("tuvi", "bac_si"), ("tuvi", "tuong_tien"),
            ("tuvi", "tue_tien")),
    "chinh_tinh": (("tuvi", "chinh_tinh"),), "phu_tinh": (("tuvi", "phu_tinh"),), "tap_dieu": (("tuvi", "tap_dieu"),),
    "truong_sinh": (("tuvi", "truong_sinh"), ("battu", "truong_sinh")),
    "cung": (("tuvi", "cung"),), "do_sang": (("tuvi", "do_sang"),), "hoa": (("tuvi", "hoa"),), "cuc": (("tuvi", "cuc"),),
    "can": (("can_chi", "can"),), "chi": (("can_chi", "chi"),), "hanh": (("can_chi", "hanh"),), "am_duong": (("can_chi", "am_duong"),),
    "thap_than": (("battu", "thap_than"),), "battu_khai_niem": (("battu", "khai_niem"),),
    "quai": (("phongthuy", "quai"), ("kinhdich", "bat_quai")), "du_nien": (("phongthuy", "du_nien"),),
    "huong": (("phongthuy", "huong"),), "sao_bay": (("phongthuy", "sao_bay"),),
    "que": (("kinhdich", "que_64"),), "hao": (("kinhdich", "hao"),), "kinhdich_khai_niem": (("kinhdich", "khai_niem"),),
}


def _bang() -> dict:
    return nap.doc(TEP)


def muc(nhom: str, vi: str | int) -> dict | None:
    """Mục đầy đủ {en|pinyin, han?, nghia?} của một tên Việt (hoặc số quẻ 1–64) trong nhóm; không có → None."""
    b = _bang()
    for a, c in NHOM[nhom]:
        m = (b.get(a) or {}).get(c) or {}
        if str(vi) in m:
            return m[str(vi)]
    return None


def ten(nhom: str, vi: str | int, ngon_ngu_: str | None = None) -> str:
    """Tên hiển thị theo ngôn ngữ (mặc định: ngôn ngữ của lượt gọi). Tiếng Việt → nguyên chữ; chưa có bản dịch → chữ Việt."""
    nn = ngon_ngu_ or ngon_ngu.hien_tai()
    if nn == ngon_ngu.MAC_DINH:
        return str(vi)
    m = muc(nhom, vi)
    if not m:
        return str(vi)
    if nn == "zh-hant":
        return m.get("han") or m.get("pinyin") or m.get("en") or str(vi)
    return m.get("en") or m.get("pinyin") or str(vi)


def nghia(nhom: str, vi: str | int) -> str | None:
    m = muc(nhom, vi)
    return m.get("nghia") if m else None


def sao_luu(ten_vi: str, ngon_ngu_: str | None = None) -> str:
    """Sao lưu niên / lưu đại hạn của iztro ("Lưu Lộc", "Vận Mã") → "Annual Lu Cun", "Decade Tian Ma"."""
    nn = ngon_ngu_ or ngon_ngu.hien_tai()
    if nn == ngon_ngu.MAC_DINH:
        return ten_vi
    tt = _bang()["tuvi"]["sao_luu_tien_to"]
    for vi_tt, en_tt in tt.items():
        if ten_vi.startswith(vi_tt + " "):
            goc = _GOC_LUU.get(ten_vi[len(vi_tt) + 1:])
            if goc:
                return f"{en_tt} {ten('sao', goc, nn)}"
    return ten("sao", ten_vi, nn)


# Chữ cuối của sao lưu iztro → sao gốc.
_GOC_LUU = {"Lộc": "Lộc Tồn", "Mã": "Thiên Mã", "Dương": "Kình Dương", "Đà": "Đà La", "Xương": "Văn Xương", "Khúc": "Văn Khúc",
            "Khôi": "Thiên Khôi", "Việt": "Thiên Việt", "Loan": "Hồng Loan", "Hỷ": "Thiên Hỷ"}
