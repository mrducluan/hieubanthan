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
    "nap_am": (("battu", "nap_am"),), "than_sat": (("battu", "than_sat"),), "cat_hung": (("battu", "cat_hung"),),
    "quan_he": (("battu", "quan_he"),), "than_vuong": (("battu", "than_vuong"),), "cach_cuc_bt": (("battu", "cach_cuc"),),
    "nhom_thap_than": (("battu", "nhom_thap_than"),), "sach_battu": (("battu", "sach"),),
    "quai": (("phongthuy", "quai"), ("kinhdich", "bat_quai")), "du_nien": (("phongthuy", "du_nien"),),
    "huong": (("phongthuy", "huong"),), "sao_bay": (("phongthuy", "sao_bay"),),
    "que": (("kinhdich", "que_64"),), "hao": (("kinhdich", "hao"),), "kinhdich_khai_niem": (("kinhdich", "khai_niem"),),
    "tinh": (("dia_ly", "tinh"),),
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


# ------------------------------------------------------------------ EN-ALL GĐ 2: trường MÃ mang tên Việt
# Nhiều route trả tên riêng ở trường dữ liệu (`can: "Mậu"`, `chi: "Dần"`, `ngu_hanh: "Thủy"`) và web dùng chính giá trị
# đó làm KHOÁ (tô màu theo hành, đặt cung trên lá số). Đổi thẳng sang tiếng Anh sẽ gãy logic web + đổi khung dữ kiện.
# Quy ước (docs/EN-TIEN-DO.md mục 4.5): giữ giá trị MÃ như cũ; ở bản Anh, phản hồi kèm `ten_hien` = {nhóm: {mã Việt: tên
# hiển thị}} cho mọi mã có trong phản hồi; web hiển thị bằng bảng này. Trường mã được phép = danh sách TƯỜNG MINH dưới đây.
KHOA_MA: dict[str, str | tuple[str, str]] = {
    "can": "can", "chi": "chi", "ngu_hanh": "hanh", "hanh": "hanh", "am_duong": "am_duong",
    "thap_than": "thap_than", "thap_than_can": "thap_than", "thap_than_chi": "thap_than", "tang_can": "can",
    "truong_sinh": "truong_sinh", "dai_van_thap_than": "thap_than",
    # dict có KHOÁ là mã (giá trị là số / dữ kiện): {"Kim": 3.5, …}
    "diem": "hanh", "ty_le": "hanh",
    "nap_am": "nap_am", "nap_am.ten": "nap_am", "nap_am.hanh": "hanh",
    # Bát tự (GĐ 3)
    "than_sat.ten": "than_sat", "than_sat.loai": "cat_hung", "than_sat_tham_khao.ten": "than_sat",
    "than_sat_tham_khao.nhom": "than_sat", "than_sat_tham_khao.loai": "cat_hung", "quan_he.loai": "quan_he",
    "than_sat_tham_khao.phai": "sach_battu",
    "than.ket_luan": "than_vuong", "cach_cuc.ten": "cach_cuc_bt", "cach_cuc_tbct.ten": "cach_cuc_bt",
    "can_lap_cach": "can", "chi_thang": "chi", "khong_vong.ngay": "chi", "khong_vong.nam": "chi", "tu_toa": "truong_sinh",
    "ngu_hanh.nhieu_nhat": "hanh", "ngu_hanh.thieu": "hanh", "nhat_chu.ngu_hanh": "hanh", "nhat_chu.can": "can",
    # dict có khoá là mã VÀ giá trị là mã (nhóm khoá, nhóm giá trị)
    "bang_hanh.can": ("can", "hanh"), "bang_hanh.chi": ("chi", "hanh"), "vai_tro_hanh": ("hanh", "nhom_thap_than"),
}


def ten_hien(x, khoa: dict[str, str] | None = None) -> dict[str, dict[str, str]]:
    """Bảng tên hiển thị của mọi MÃ tên riêng có trong `x` (đi đệ quy), theo ngôn ngữ lượt gọi. Mã chưa có bản dịch
    không đưa vào (bộ kiểm bản Anh sẽ báo)."""
    khoa = khoa or KHOA_MA
    ra: dict[str, dict[str, str]] = {}

    def them(nhom: str, v) -> None:
        if isinstance(v, str):
            m = muc(nhom, v)
            if m:
                ra.setdefault(nhom, {})[v] = ten(nhom, v)
        elif isinstance(v, list):
            for y in v:
                them(nhom, y)
        elif isinstance(v, dict):          # dict theo mã: {"Giáp": …, "Ất": …}
            for k in v:
                them(nhom, k)

    def di(y, cha: str = "") -> None:
        if isinstance(y, dict):
            for k, v in y.items():
                n = khoa.get(f"{cha}.{k}") or khoa.get(k)
                if isinstance(n, tuple):            # dict mã → mã
                    if isinstance(v, dict):
                        for kk, vv in v.items():
                            them(n[0], kk)
                            them(n[1], vv)
                    continue
                if n:
                    them(n, v)
                if k != "ten_hien":
                    di(v, k)
        elif isinstance(y, list):
            for v in y:
                di(v, cha)

    di(x)
    return ra


def nhom_ma(khoa_: str, cha: str = "", ong: str = "") -> str | None:
    """Nhóm tên riêng của trường `khoa_` (khoá "cha.con" thắng khoá đơn) — None nếu không phải trường mã. Dict mã → mã
    (`KHOA_MA` giá trị là cặp): khoá con của nó thuộc nhóm thứ nhất (`khoa_` = mã, `cha` = tên dict), giá trị thuộc nhóm
    thứ hai (gọi với `cha` = tên dict, `ong` = ông của giá trị)."""
    n = KHOA_MA.get(f"{cha}.{khoa_}") or KHOA_MA.get(khoa_)
    if isinstance(n, tuple):
        return None
    if n:
        return n
    cap = KHOA_MA.get(f"{ong}.{cha}") or KHOA_MA.get(cha)
    return cap[1] if isinstance(cap, tuple) else None


def nhom_khoa(cha: str, ong: str = "") -> str | None:
    """Nhóm của KHOÁ trong dict theo mã (dict tên `cha`, nằm dưới `ong`)."""
    n = KHOA_MA.get(f"{ong}.{cha}") or KHOA_MA.get(cha)
    return n[0] if isinstance(n, tuple) else n


def la_ma(khoa_: str, gia_tri: str, cha: str = "", ong: str = "") -> bool:
    """`gia_tri` ở trường `khoa_` là MÃ tên riêng hợp lệ (bộ kiểm bản Anh cho phép giữ chữ Việt)."""
    n = nhom_ma(khoa_, cha, ong)
    return bool(n) and muc(n, gia_tri) is not None
