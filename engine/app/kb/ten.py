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
            ("tuvi", "tue_tien"), ("tuvi", "thai_tue_vn"), ("tuvi", "sao_luu"), ("tuvi", "hoa_sao")),
    "chinh_tinh": (("tuvi", "chinh_tinh"),), "phu_tinh": (("tuvi", "phu_tinh"),), "tap_dieu": (("tuvi", "tap_dieu"),),
    "truong_sinh": (("tuvi", "truong_sinh"), ("battu", "truong_sinh")),
    "cung": (("tuvi", "cung"),), "do_sang": (("tuvi", "do_sang"), ("tuvi", "do_sang_nam_phai")), "hoa": (("tuvi", "hoa"),), "cuc": (("tuvi", "cuc"),),
    "can": (("can_chi", "can"),), "chi": (("can_chi", "chi"),), "hanh": (("can_chi", "hanh"),), "am_duong": (("can_chi", "am_duong"),),
    "thap_than": (("battu", "thap_than"),), "battu_khai_niem": (("battu", "khai_niem"),),
    "nap_am": (("battu", "nap_am"),), "than_sat": (("battu", "than_sat"),), "cat_hung": (("battu", "cat_hung"),),
    "quan_he": (("battu", "quan_he"),), "than_vuong": (("battu", "than_vuong"),), "cach_cuc_bt": (("battu", "cach_cuc"),),
    "nhom_thap_than": (("battu", "nhom_thap_than"),), "sach_battu": (("battu", "sach"),),
    "quai": (("phongthuy", "quai"), ("kinhdich", "bat_quai")), "du_nien": (("phongthuy", "du_nien"),),
    "huong": (("phongthuy", "huong"),), "sao_bay": (("phongthuy", "sao_bay"),), "nhom_trach": (("phongthuy", "nhom"),),
    "que": (("kinhdich", "que_64"),), "hao": (("kinhdich", "hao"),), "kinhdich_khai_niem": (("kinhdich", "khai_niem"),),
    "tinh": (("dia_ly", "tinh"),),
    # EN-ALL GĐ 4 (Tử vi): nguồn Tuần/Triệt, kết luận xu hướng lưu nguyệt (mã web tô màu).
    "tuan_triet": (("tuvi", "tuan_triet"),), "tuan_triet_kieu": (("tuvi", "tuan_triet_kieu"),),
    "xu_huong_tuvi": (("tuvi", "xu_huong"),),
    # EN-ALL GĐ 3c — nhóm GỘP cho trường mã dùng chung khoá nhưng khác bảng tên: nhãn mục hình hỏi đáp (`muc.nhan`: hành ở
    # cột năm hành Bát tự, cung ở bàn 12 cung Tử vi) và loại trong danh sách gói bằng chứng Bát tự (`ds.loai`: quan hệ
    # can chi ở mục xung hợp, cát/hung ở mục thần sát).
    "nhan_hinh": (("can_chi", "hanh"), ("tuvi", "cung")),
    "loai_bt": (("battu", "quan_he"), ("battu", "cat_hung")),
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
    "bieu_do.nhat_chu": "hanh",
    # dict có khoá là mã VÀ giá trị là mã (nhóm khoá, nhóm giá trị)
    "bang_hanh.can": ("can", "hanh"), "bang_hanh.chi": ("chi", "hanh"), "vai_tro_hanh": ("hanh", "nhom_thap_than"),
    # EN-ALL GĐ 3c — hỏi đáp: nhãn mục hình (khối `truc_quan`), loại trong danh sách gói bằng chứng (nhóm gộp ở `NHOM`)
    "muc.nhan": "nhan_hinh", "ds.loai": "loai_bt",
    # EN-ALL GĐ 4 — Tử vi (lá số, vận hạn, lưu nguyệt, định giờ). Khoá "cha.con" khi tên trường chung chung (`ten`, `tu_hoa`,
    # `sao`…); khoá đơn khi tên trường chỉ Tử vi dùng. Giá trị: sao / cung / độ sáng / hoá / cục / chi theo bảng `tuvi`.
    "cung.ten": "cung", "chinh_tinh.ten": "sao", "phu_tinh.ten": "sao", "do_sang": "do_sang", "do_sang_nam_phai": "do_sang",
    "chinh_tinh.tu_hoa": "hoa", "phu_tinh.tu_hoa": "hoa", "tu_hoa_goc": "hoa", "cung.tap_dieu": "sao",
    "bac_si": "sao", "tuong_tien": "sao", "tue_tien": "sao", "thai_tue_nam_phai": "sao", "do_sang_phu": ("sao", "do_sang"),
    "cung_lien_quan": "cung", "sat_hoi": "sao", "cach_cuc.nhom": "cat_hung",
    "menh_chu": "sao", "than_chu": "sao", "chi_cung_menh": "chi", "chi_cung_than": "chi", "ngu_hanh_cuc": "cuc",
    "tuan_triet.tuan": "chi", "tuan_triet.triet": "chi", "tuan_dong_tai": "chi", "triet_dong_tai": "chi",
    "cung_KHONG_bi_anh_huong": "chi", "chi_tiet_tung_cung.cung": "chi", "chi_tiet_tung_cung.nguon": "tuan_triet", "chi_tiet_tung_cung.kieu": "tuan_triet_kieu",
    "am_duong.nam_sinh": "am_duong", "menh_nap_am.ten": "nap_am",
    "cung_goc": "cung", "ten_cung": "cung", "dai_han.tu_hoa": "sao", "luu_nien.tu_hoa": "sao", "dai_han.sao": "sao",
    "luu_nien.sao": "sao", "tu_hoa_sao.cung": "cung", "tu_hoa_sao.sao": "sao", "vong_thai_tue": "sao",
    "vong_thai_tue_nam_phai": "sao", "vong_tuong_tien": "sao",
    "phu_tinh.cat": "sao", "phu_tinh.sat": "sao", "tam_phuong": "cung", "tu_hoa_thang.hoa": "hoa", "tu_hoa_thang.sao": "sao",
    "thang.tuan_triet": "sao", "xu_huong.ket": "xu_huong_tuvi", "theo_thang": "cung",
    "gio_sinh": "chi", "chi_gio": "chi", "ung_vien.cuc": "cuc", "cung_menh.chinh_tinh": "sao", "cau_hoi.cung": "cung",
    "cau_hoi.hoa": "hoa", "than_cu": "cung", "cung_sao_menh.sao": "sao",
    # EN-ALL GĐ 4 — trang kiến thức Tử vi: hình minh hoạ "Hoá ở cung" (web tra chữ Hán theo mã hoá).
    "minh_hoa.hoa": "hoa",
    # EN-ALL GĐ 4 (agent C) — phi hoá / nhịp 3 tháng / xem lá số 2 người: đường bay {hoa, sao, can, tu_cung, den_cung,
    # xung_cung, den_tuan_triet} nằm trong các danh sách dưới đây; mã cung / can ở trường riêng của các route này.
    "tu_cung": "cung", "den_cung": "cung", "xung_cung": "cung", "den_tuan_triet": "sao", "can_nam_sinh": "can",
    "can_nam_nguoi_kia": "can", "can_menh_nguoi_kia": "can", "lai_nhan.cung": "cung", "tieu_diem": "cung",
    "diem_sang": "cung", "de_y": "cung", "hop.cung": "cung",
    "duong_bay.hoa": "hoa", "duong_bay.sao": "sao", "tu_hoa.hoa": "hoa", "tu_hoa.sao": "sao", "vao_menh.hoa": "hoa",
    "vao_menh.sao": "sao", "duong.hoa": "hoa", "duong.sao": "sao", "hoa.hoa": "hoa", "hoa.sao": "sao",
    "nguoi_kia_vao_ban.hoa": "hoa", "nguoi_kia_vao_ban.sao": "sao", "ban_vao_nguoi_kia.hoa": "hoa",
    "ban_vao_nguoi_kia.sao": "sao", "menh_nguoi_kia_vao_ban.hoa": "hoa", "menh_nguoi_kia_vao_ban.sao": "sao",
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
