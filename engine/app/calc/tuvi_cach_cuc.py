# -*- coding: utf-8 -*-
"""KB-2 — nhận diện cách cục Tử vi trên lá số iztro (thuần, tất định, không LLM).

Xét cung Mệnh và tam phương tứ chính (Mệnh, hai cung tam hợp, cung xung chiếu). Điều kiện mỗi cách theo
bản phổ thông của Tử Vi Đẩu Số Toàn Thư / Đẩu Số Cốt Tuỷ Phú; phần "phá cách" KHÔNG tự kết luận — chỉ
liệt kê lục sát tinh hội về (`sat_hoi`) để tầng diễn giải nói rõ "cách bị giảm khi gặp sát".
Đầu vào: lá số thô iztro (palaces[i] với i = 0 là cung Dần, chi tăng dần).

KB-TV3 — mỗi cách kèm `du_kien`: các dữ kiện ĐÃ TÍNH trên lá số (không phải lời luận), dạng có cấu trúc:
  • loai "can"  — điều kiện bắt buộc của cách đã thoả (sao nào ở cung nào, hoá nào, điều kiện phủ định);
  • loai "tang" — điểm cộng: sao chủ của cách miếu/vượng/đắc (độ sáng Nam phái), mang Hoá Lộc/Quyền/Khoa;
    Tả Hữu, Xương Khúc, Khôi Việt hội về tam phương tứ chính;
  • loai "giam" — điểm trừ: sao chủ hãm hoặc mang Hoá Kỵ; Địa Không / Địa Kiếp ở Mệnh.
Chữ hiển thị dựng ở KB (`tuvi_kb.dieu_kien_dat`, mẫu `dieu_kien_mau`). Trường này KHÔNG đổi kết luận phá cách.
"""
from __future__ import annotations

from app.calc import tuvi_do_sang_vn

CHINH_TINH = {"Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ",
              "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"}
LUC_SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp")

# Thứ tự = thứ tự hiển thị (cách lớn trước, hung sau, ghi chú cuối).
DANH_SACH = [
    "tu_phu_dong_cung", "tu_phu_vu_tuong", "phu_tuong_trieu_vien", "co_nguyet_dong_luong", "sat_pha_tham",
    "cuc_huong_ly_minh", "that_sat_trieu_dau", "that_sat_nguong_dau", "hung_tu_can_nguyen", "nhat_le_trung_thien",
    "nguyet_lang_thien_mon", "tho_tinh_nhap_mieu", "anh_tinh_nhap_mieu", "thach_trung_an_ngoc", "cu_nhat_dong_cung",
    "cu_co_dong_lam", "tham_vu_dong_hanh", "nhat_nguyet_dong_lam", "minh_chau_xuat_hai", "tam_ky_gia_hoi",
    "song_loc", "loc_ma_giao_tri", "ta_huu_dong_cung", "xuong_khuc_dong_cung", "ta_huu_giap_menh",
    "xuong_khuc_giap_menh", "khoi_viet_hoi_menh", "hoa_tham", "linh_tham", "dao_hoa_pham_chu",
    "kinh_da_giap_menh", "hoa_linh_giap_menh", "khong_kiep_giap_menh", "ma_dau_doi_kiem", "hoa_ky_thu_menh",
    "menh_vo_chinh_dieu", "than_menh_dong_cung",
    # KB-TV2 — đối chiếu danh mục TuViMCP (MIT); điều kiện siết theo cổ thư (xem từng nhánh dưới).
    "quan_than_khanh_hoi", "duong_luong_xuong_loc", "liem_trinh_van_vu", "dan_tri_que_tri", "nhat_chieu_loi_mon",
    "nhat_nguyet_tinh_minh", "nguyet_sinh_thuong_hai", "nhat_nguyet_chieu_bich", "co_luong_gia_hoi",
    "van_luong_chan_ky", "phu_cung_van_tinh", "tuong_tinh_dac_dia", "hoa_tinh_phan_quy", "quyen_loc_hoi_menh",
    "loc_hop_uyen_uong", "loc_ma_boi_an", "minh_loc_am_loc", "khoa_minh_loc_am", "khoa_quyen_loc_giap",
    "song_loc_giap_menh", "tai_loc_giap_ma", "quy_tinh_giap_menh", "quyen_sat_hoa_loc", "cu_phung_tu_sat",
    "menh_ly_phung_khong",
    # KB-TV3 — bổ sung theo cổ thư (nối CUỐI: báo cáo lấy 2 cách đầu theo thứ tự này, cách cũ giữ chỗ).
    "dong_luong_dan_than", "liem_tuong_dong_cung", "vu_sat_dong_cung", "tu_vi_co_quan", "hoa_ky_thien_di",
    "liem_sat_duong", "cu_hoa_duong", "linh_xuong_da_vu", "loc_ton_thu_menh", "loc_ton_thu_than",
    "thien_ma_menh_di", "khoa_quyen_hoi_menh", "co_nguyet_dong_luong_ba",
    # KT-N1 — Toàn Thư «定贵局»: 辅弼拱主 (nối CUỐI, cách cũ giữ chỗ).
    "phu_bat_cung_chu",
]
TU_SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh")
CNDL = ("Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương")
CAT_DOI = (("Tả Phù", "Hữu Bật"), ("Văn Xương", "Văn Khúc"), ("Thiên Khôi", "Thiên Việt"))
SANG, HAM = ("Miếu", "Vượng", "Đắc"), "Hãm"

# Sao chủ của từng cách (cố định) — dùng để dựng điều kiện "can" khi cách chỉ đòi sao có mặt, và để xét điểm cộng/trừ.
# Cách có sao chủ thay đổi theo lá số (hoá, Lộc Tồn hoặc Hoá Lộc…) khai `sao=` ngay tại chỗ nhận diện.
SAO: dict[str, tuple[str, ...]] = {
    "tu_phu_dong_cung": ("Tử Vi", "Thiên Phủ"), "tu_phu_vu_tuong": ("Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng"),
    "phu_tuong_trieu_vien": ("Thiên Phủ", "Thiên Tướng"), "co_nguyet_dong_luong": CNDL,
    "sat_pha_tham": ("Thất Sát", "Phá Quân", "Tham Lang"), "cuc_huong_ly_minh": ("Tử Vi",),
    "that_sat_trieu_dau": ("Thất Sát",), "that_sat_nguong_dau": ("Thất Sát",), "hung_tu_can_nguyen": ("Liêm Trinh",),
    "nhat_le_trung_thien": ("Thái Dương",), "nguyet_lang_thien_mon": ("Thái Âm",), "tho_tinh_nhap_mieu": ("Thiên Lương",),
    "anh_tinh_nhap_mieu": ("Phá Quân",), "thach_trung_an_ngoc": ("Cự Môn",), "cu_nhat_dong_cung": ("Cự Môn", "Thái Dương"),
    "cu_co_dong_lam": ("Cự Môn", "Thiên Cơ"), "tham_vu_dong_hanh": ("Tham Lang", "Vũ Khúc"),
    "nhat_nguyet_dong_lam": ("Thái Dương", "Thái Âm"), "minh_chau_xuat_hai": ("Thái Dương", "Thái Âm"),
    "ta_huu_dong_cung": ("Tả Phù", "Hữu Bật"), "xuong_khuc_dong_cung": ("Văn Xương", "Văn Khúc"),
    "ta_huu_giap_menh": ("Tả Phù", "Hữu Bật"), "xuong_khuc_giap_menh": ("Văn Xương", "Văn Khúc"),
    "khoi_viet_hoi_menh": ("Thiên Khôi", "Thiên Việt"), "hoa_tham": ("Tham Lang", "Hỏa Tinh"),
    "linh_tham": ("Tham Lang", "Linh Tinh"), "dao_hoa_pham_chu": ("Tử Vi", "Tham Lang"),
    "kinh_da_giap_menh": ("Kình Dương", "Đà La"), "hoa_linh_giap_menh": ("Hỏa Tinh", "Linh Tinh"),
    "khong_kiep_giap_menh": ("Địa Không", "Địa Kiếp"), "ma_dau_doi_kiem": ("Kình Dương",),
    "liem_trinh_van_vu": ("Liêm Trinh", "Vũ Khúc", "Văn Xương"), "nhat_chieu_loi_mon": ("Thái Dương",),
    "nhat_nguyet_tinh_minh": ("Thái Dương", "Thái Âm"), "nguyet_sinh_thuong_hai": ("Thái Âm",),
    "nhat_nguyet_chieu_bich": ("Thái Dương", "Thái Âm"), "co_luong_gia_hoi": ("Thiên Cơ", "Thiên Lương"),
    "van_luong_chan_ky": ("Thiên Lương", "Văn Xương"), "phu_cung_van_tinh": ("Văn Xương", "Tả Phù"),
    "dong_luong_dan_than": ("Thiên Đồng", "Thiên Lương"), "liem_tuong_dong_cung": ("Liêm Trinh", "Thiên Tướng"),
    "vu_sat_dong_cung": ("Vũ Khúc", "Thất Sát"), "liem_sat_duong": ("Liêm Trinh", "Thất Sát", "Kình Dương"),
    "cu_hoa_duong": ("Cự Môn", "Hỏa Tinh", "Kình Dương"),
    "linh_xuong_da_vu": ("Linh Tinh", "Văn Xương", "Đà La", "Vũ Khúc"), "loc_ton_thu_menh": ("Lộc Tồn",),
    "loc_ton_thu_than": ("Lộc Tồn",),
}
# Cách không xét quanh trục Mệnh (điểm cộng/trừ chỉ xét sao chủ, không xét cát tinh tam phương / Không Kiếp ở Mệnh).
NGOAI_TRUC = {"nhat_nguyet_chieu_bich", "nguyet_sinh_thuong_hai"}


class _La:
    def __init__(self, la: dict):
        p = la["palaces"]
        self.p = p
        self.m = next(i for i, x in enumerate(p) if x["name"] == "Mệnh")
        self.chi_menh = p[self.m]["earthlyBranch"]

    def sao(self, i: int) -> set[str]:
        x = self.p[i % 12]
        return {s["name"] for s in x["majorStars"] + x["minorStars"] + x.get("adjectiveStars", [])}

    def chinh(self, i: int) -> set[str]:
        return {s["name"] for s in self.p[i % 12]["majorStars"]}

    def hoa(self, i: int) -> dict[str, str]:
        x = self.p[i % 12]
        return {s["mutagen"]: s["name"] for s in x["majorStars"] + x["minorStars"] if s.get("mutagen")}

    def tp(self) -> list[int]:
        return [self.m, (self.m + 4) % 12, (self.m + 8) % 12, (self.m + 6) % 12]

    def sao_tp(self) -> set[str]:
        return set().union(*(self.sao(i) for i in self.tp()))

    def hoa_tp(self) -> set[str]:
        return set().union(*(set(self.hoa(i)) for i in self.tp()))

    def ten(self, i: int) -> str:
        return self.p[i % 12]["name"]

    def tim(self, ten_sao: str) -> int | None:
        return next((i for i in range(12) if ten_sao in self.sao(i)), None)


def _co_loc(l: _La, i: int) -> bool:
    """Cung có Lộc Tồn hoặc sao mang Hoá Lộc."""
    return "Lộc Tồn" in l.sao(i) or "Lộc" in l.hoa(i)


def _luc_hop(i: int) -> int:
    """Cung lục hợp (Tý–Sửu, Dần–Hợi, Mão–Tuất, Thìn–Dậu, Tỵ–Thân, Ngọ–Mùi); i = 0 là cung Dần."""
    return (-3 - i) % 12


def _giap(l: _La, a: str, b: str) -> bool:
    hai = (l.sao(l.m - 1), l.sao(l.m + 1))
    return (a in hai[0] and b in hai[1]) or (b in hai[0] and a in hai[1])




# ---------------------------------------------------------------------------------------- KB-TV3: dữ kiện điều kiện
def _f(s: str, i: int, hoa: str | None = None, vt: str | None = None) -> dict:
    """Dữ kiện: sao `s` (mang `hoa` nếu có) ở cung chỉ số `i`; `vt` ép vị trí (vd "luc_hop")."""
    f = {"kieu": "sao", "sao": s, "i": i % 12}
    if hoa:
        f["hoa"] = hoa
    if vt:
        f["vi_tri"] = vt
    return f


def _fh(l: _La, h: str, i: int, vt: str | None = None) -> dict:
    """Dữ kiện: sao mang hoá `h` ở cung `i` (cung chắc chắn có hoá đó)."""
    return _f(l.hoa(i)[h], i, h, vt)


def _ft(l: _La, s: str, ds) -> dict | None:
    """Dữ kiện: sao `s` ở cung ĐẦU TIÊN trong `ds` có sao."""
    i = next((j for j in ds if s in l.sao(j)), None)
    return None if i is None else _f(s, i)


def _fl(l: _La, ds, vt: str | None = None) -> dict | None:
    """Dữ kiện "Lộc" (Lộc Tồn hoặc Hoá Lộc) ở cung đầu tiên trong `ds` có Lộc."""
    for i in ds:
        if "Lộc Tồn" in l.sao(i):
            return _f("Lộc Tồn", i, vt=vt)
        if "Lộc" in l.hoa(i):
            return _fh(l, "Lộc", i, vt)
    return None


def _fhoa_tp(l: _La, h: str, chinh: bool = False) -> dict | None:
    """Dữ kiện: hoá `h` đầu tiên trong tam phương tứ chính (chinh=True: chỉ xét chính tinh)."""
    for i in l.tp():
        for x in l.p[i]["majorStars"] + ([] if chinh else l.p[i]["minorStars"]):
            if x.get("mutagen") == h:
                return _f(x["name"], i, h)
    return None


def _vi_tri(l: _La, i: int) -> str:
    return {0: "menh", 4: "tam_hop", 8: "tam_hop", 6: "xung", 1: "giap", 11: "giap"}.get((i - l.m) % 12, "khac")


def _xuat(l: _La, f: dict) -> dict:
    """Đổi chỉ số cung → tên cung + chi + vị trí so với Mệnh (dữ kiện đã tính, chưa thành lời)."""
    f = dict(f)
    if "i" in f:
        i = f.pop("i")
        f.setdefault("vi_tri", _vi_tri(l, i))
        f["cung"], f["chi"] = l.ten(i), l.p[i]["earthlyBranch"]
    return f


def _hoa_sao(l: _La, i: int, s: str) -> str:
    return next((x["mutagen"] for x in l.p[i]["majorStars"] + l.p[i]["minorStars"]
                 if x["name"] == s and x.get("mutagen")), "")


def _tang_giam(l: _La, ma: str, sao: tuple[str, ...], can: list[dict], cung: list[int]) -> list[dict]:
    """Điểm cộng / trừ: độ sáng Nam phái + hoá của sao chủ; cát tinh đôi hội về; Không Kiếp ở Mệnh."""
    ra: list[dict] = []
    da_hoa = {(f.get("sao"), f.get("hoa")) for f in can}
    da_sao = set(sao) | {f["sao"] for f in can if f.get("sao")} | {s for f in can for s in f.get("ds", [])}
    for s in sao:
        i = next((j for j in cung if s in l.sao(j)), None)
        if i is None:
            i = l.tim(s)
        if i is None:
            continue
        chi = l.p[i]["earthlyBranch"]
        muc = tuvi_do_sang_vn.do_sang(s, chi) if s in CHINH_TINH else tuvi_do_sang_vn.do_sang_phu(s, chi)
        if muc in SANG:
            ra.append({"loai": "tang", "kieu": "sang", "sao": s, "chi": chi, "muc": muc})
        elif muc == HAM:
            ra.append({"loai": "giam", "kieu": "ham", "sao": s, "chi": chi})
        h = _hoa_sao(l, i, s)
        if h and (s, h) not in da_hoa:
            ra.append({"loai": "giam" if h == "Kỵ" else "tang", "kieu": "hoa", "sao": s, "hoa": h})
    if ma not in NGOAI_TRUC:
        stp = l.sao_tp()
        for doi in CAT_DOI:
            co_ = [s for s in doi if s in stp and s not in da_sao]
            if co_:
                ra.append({"loai": "tang", "kieu": "cat_hoi", "ds": co_})
        for s in ("Địa Không", "Địa Kiếp"):
            if s in l.sao(l.m) and s not in da_sao:
                ra.append({"loai": "giam", **_xuat(l, _f(s, l.m))})
    return ra


def nhan_dien(la: dict) -> list[dict]:
    """→ [{ma, cung: [tên cung liên quan], sat_hoi: [lục sát trong tam phương tứ chính], du_kien: [dữ kiện]}]
    theo DANH_SACH. `du_kien` (KB-TV3) là trường THÊM, không đổi `ma` / `cung` / `sat_hoi`."""
    l = _La(la)
    m, cm = l.m, l.chi_menh
    sm, cmh = l.sao(m), l.chinh(m)
    tp, stp = l.tp(), l.sao_tp()
    co: dict[str, tuple[list[int], list | None, tuple | None]] = {}

    def dat(ma: str, *cung: int, can: list | None = None, sao: tuple | None = None) -> None:
        co[ma] = (list(cung) or [m], can, sao)

    if {"Tử Vi", "Thiên Phủ"} <= cmh:
        dat("tu_phu_dong_cung")
    if {"Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng"} <= set().union(*(l.chinh(i) for i in tp)):
        dat("tu_phu_vu_tuong", *tp)
    ngoai = set().union(*(l.chinh(i) for i in tp[1:]))
    if {"Thiên Phủ", "Thiên Tướng"} <= ngoai and not ({"Thiên Phủ", "Thiên Tướng"} & cmh):
        dat("phu_tuong_trieu_vien", *tp)
    if {"Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"} <= set().union(*(l.chinh(i) for i in tp)):
        dat("co_nguyet_dong_luong", *tp)
    if cmh & {"Thất Sát", "Phá Quân", "Tham Lang"}:
        dat("sat_pha_tham", *tp)
    if "Tử Vi" in cmh and cm == "Ngọ":
        dat("cuc_huong_ly_minh")
    if "Thất Sát" in cmh and cm in ("Dần", "Thân"):
        dat("that_sat_trieu_dau")
    if "Thất Sát" in cmh and cm in ("Tý", "Ngọ"):
        dat("that_sat_nguong_dau")
    if "Liêm Trinh" in cmh and cm in ("Dần", "Thân"):
        dat("hung_tu_can_nguyen")
    if "Thái Dương" in cmh and cm == "Ngọ":
        dat("nhat_le_trung_thien")
    if "Thái Âm" in cmh and cm == "Hợi":
        dat("nguyet_lang_thien_mon")
    if "Thiên Lương" in cmh and cm == "Ngọ":
        dat("tho_tinh_nhap_mieu")
    if "Phá Quân" in cmh and cm in ("Tý", "Ngọ"):
        dat("anh_tinh_nhap_mieu")
    if "Cự Môn" in cmh and cm in ("Tý", "Ngọ"):
        dat("thach_trung_an_ngoc")
    if {"Cự Môn", "Thái Dương"} <= cmh:
        dat("cu_nhat_dong_cung")
    if {"Cự Môn", "Thiên Cơ"} <= cmh:
        dat("cu_co_dong_lam")
    if {"Tham Lang", "Vũ Khúc"} <= cmh:
        dat("tham_vu_dong_hanh")
    if {"Thái Dương", "Thái Âm"} <= cmh:
        dat("nhat_nguyet_dong_lam")
    if not cmh and cm == "Mùi" and l.tim("Thái Dương") is not None and l.p[l.tim("Thái Dương")]["earthlyBranch"] == "Mão" \
            and l.tim("Thái Âm") is not None and l.p[l.tim("Thái Âm")]["earthlyBranch"] == "Hợi":
        dat("minh_chau_xuat_hai", m, l.tim("Thái Dương"), l.tim("Thái Âm"),
            can=[{"kieu": "vo_chinh", "i": m}, _f("Thái Dương", l.tim("Thái Dương")), _f("Thái Âm", l.tim("Thái Âm"))])
    if {"Lộc", "Quyền", "Khoa"} <= l.hoa_tp():
        can = [_fhoa_tp(l, h) for h in ("Lộc", "Quyền", "Khoa")]
        dat("tam_ky_gia_hoi", *tp, can=can, sao=tuple(f["sao"] for f in can))
    if "Lộc Tồn" in stp and "Lộc" in l.hoa_tp():
        can = [_ft(l, "Lộc Tồn", tp), _fhoa_tp(l, "Lộc")]
        dat("song_loc", *tp, can=can, sao=("Lộc Tồn", can[1]["sao"]))
    for i in tp:
        if "Thiên Mã" in l.sao(i) and ("Lộc Tồn" in l.sao(i) or "Lộc" in l.hoa(i)):
            can = [_f("Thiên Mã", i), _fl(l, [i])]
            dat("loc_ma_giao_tri", i, can=can, sao=("Thiên Mã", can[1]["sao"]))
            break
    if {"Tả Phù", "Hữu Bật"} <= sm:
        dat("ta_huu_dong_cung")
    if {"Văn Xương", "Văn Khúc"} <= sm:
        dat("xuong_khuc_dong_cung")
    giap = [(m - 1) % 12, m, (m + 1) % 12]
    if _giap(l, "Tả Phù", "Hữu Bật"):
        dat("ta_huu_giap_menh", *giap)
    if _giap(l, "Văn Xương", "Văn Khúc"):
        dat("xuong_khuc_giap_menh", *giap)
    if {"Thiên Khôi", "Thiên Việt"} <= stp:
        dat("khoi_viet_hoi_menh", *tp)
    if {"Tham Lang", "Hỏa Tinh"} <= sm:
        dat("hoa_tham")
    if {"Tham Lang", "Linh Tinh"} <= sm:
        dat("linh_tham")
    if {"Tử Vi", "Tham Lang"} <= cmh:
        dat("dao_hoa_pham_chu")
    if _giap(l, "Kình Dương", "Đà La"):
        dat("kinh_da_giap_menh", *giap)
    if _giap(l, "Hỏa Tinh", "Linh Tinh"):
        dat("hoa_linh_giap_menh", *giap)
    if _giap(l, "Địa Không", "Địa Kiếp"):
        dat("khong_kiep_giap_menh", *giap)
    if "Kình Dương" in sm and cm == "Ngọ":
        dat("ma_dau_doi_kiem")
    if "Kỵ" in l.hoa(m):
        dat("hoa_ky_thu_menh", can=[_fh(l, "Kỵ", m)], sao=(l.hoa(m)["Kỵ"],))
    if not cmh:
        dat("menh_vo_chinh_dieu", m, (m + 6) % 12, can=[{"kieu": "vo_chinh", "i": m}], sao=())
    if l.p[m].get("isBodyPalace"):
        dat("than_menh_dong_cung", can=[{"kieu": "than_menh", "i": m}], sao=())

    # ---- KB-TV2 ------------------------------------------------------------------------------------
    htp = l.hoa_tp()
    trai, phai = (m - 1) % 12, (m + 1) % 12
    if "Tử Vi" in cmh and {"Tả Phù", "Hữu Bật"} <= sm:          # KT-TT8 — Toàn Thư 定贵局: 紫微左右同守命
        dat("quan_than_khanh_hoi", can=[_f("Tử Vi", m), _f("Tả Phù", m), _f("Hữu Bật", m)],
            sao=("Tử Vi", "Tả Phù", "Hữu Bật"))
    if {"Thái Dương", "Thiên Lương", "Văn Xương"} <= stp and ("Lộc Tồn" in stp or "Lộc" in htp):
        can = [_ft(l, s, tp) for s in ("Thái Dương", "Thiên Lương", "Văn Xương")] + [_fl(l, tp)]
        dat("duong_luong_xuong_loc", *tp, can=can, sao=("Thái Dương", "Thiên Lương", "Văn Xương"))
    if "Liêm Trinh" in cmh and cm in ("Dần", "Thân") and {"Vũ Khúc", "Văn Xương"} <= stp:
        dat("liem_trinh_van_vu", *tp)
    if ("Thái Dương" in cmh and cm in ("Thìn", "Tỵ", "Ngọ")) or ("Thái Âm" in cmh and cm in ("Dậu", "Tuất", "Hợi")):
        dat("dan_tri_que_tri",
            sao=("Thái Dương",) if "Thái Dương" in cmh and cm in ("Thìn", "Tỵ", "Ngọ") else ("Thái Âm",))
    if "Thái Dương" in cmh and cm == "Mão":
        dat("nhat_chieu_loi_mon")
    nd, na = l.tim("Thái Dương"), l.tim("Thái Âm")
    if nd in tp and na in tp and l.p[nd]["earthlyBranch"] == "Tỵ" and l.p[na]["earthlyBranch"] == "Dậu":
        dat("nhat_nguyet_tinh_minh", m, nd, na)
    dt_ = next(i for i in range(12) if l.ten(i) == "Điền Trạch")
    if "Thái Âm" in l.chinh(dt_) and l.p[dt_]["earthlyBranch"] == "Tý":   # KT-TT8 — 定贵局: 月在子宫守田宅
        dat("nguyet_sinh_thuong_hai", dt_, can=[_f("Thái Âm", dt_)], sao=("Thái Âm",))
    if {"Thái Dương", "Thái Âm"} <= l.chinh(dt_) and l.p[dt_]["earthlyBranch"] in ("Sửu", "Mùi"):
        dat("nhat_nguyet_chieu_bich", dt_)
    if {"Thiên Cơ", "Thiên Lương"} <= cmh or (cm in ("Dần", "Thân", "Thìn", "Tuất")
                                              and {"Thiên Cơ", "Thiên Lương"} <= set().union(*(l.chinh(i) for i in tp))):
        dat("co_luong_gia_hoi", *tp)
    if ("Thiên Lương" in cmh and "Văn Xương" in stp) or ("Văn Xương" in sm and "Thiên Lương" in set().union(*(l.chinh(i) for i in tp))):
        dat("van_luong_chan_ky", *tp)
    if "Văn Xương" in sm and "Tả Phù" in stp:
        dat("phu_cung_van_tinh", *tp)
    if "Vũ Khúc" in cmh and cm in ("Sửu", "Mùi", "Dần", "Thân") and (htp & {"Lộc", "Quyền", "Khoa"} or "Lộc Tồn" in stp):
        ho = [f for h in ("Lộc", "Quyền", "Khoa") if h in htp and (f := _fhoa_tp(l, h))]
        dat("tuong_tinh_dac_dia", *tp, can=[_f("Vũ Khúc", m)] + (ho or [_ft(l, "Lộc Tồn", tp)]), sao=("Vũ Khúc",))
    hm = l.hoa(m)
    if ("Thiên Đồng" in cmh and cm == "Tuất" and hm.get("Quyền") == "Thiên Đồng") or \
            ("Cự Môn" in cmh and cm in ("Thìn", "Tuất") and hm.get("Lộc") == "Cự Môn"):
        h = "Quyền" if ("Thiên Đồng" in cmh and cm == "Tuất" and hm.get("Quyền") == "Thiên Đồng") else "Lộc"
        dat("hoa_tinh_phan_quy", can=[_fh(l, h, m)], sao=(hm[h],))
    if {"Lộc", "Quyền"} <= htp and "Khoa" not in htp:                   # đủ ba hoá đã là Tam Kỳ
        can = [_fhoa_tp(l, "Quyền"), _fhoa_tp(l, "Lộc")]
        dat("quyen_loc_hoi_menh", *tp, can=can, sao=tuple(f["sao"] for f in can))
    if "Lộc Tồn" in sm and "Lộc" in hm:
        dat("loc_hop_uyen_uong", can=[_f("Lộc Tồn", m), _fh(l, "Lộc", m)], sao=("Lộc Tồn", hm["Lộc"]))
    if ("Lộc Tồn" in stp or "Lộc" in htp) and {"Thiên Mã", "Thiên Tướng"} <= stp:
        dat("loc_ma_boi_an", *tp, can=[_fl(l, tp), _ft(l, "Thiên Mã", tp), _ft(l, "Thiên Tướng", tp)],
            sao=("Thiên Mã", "Thiên Tướng"))
    lh = _luc_hop(m)
    if ("Lộc" in hm and "Lộc Tồn" in l.sao(lh)) or ("Lộc Tồn" in sm and "Lộc" in l.hoa(lh)):
        can = [_fh(l, "Lộc", m), _f("Lộc Tồn", lh, vt="luc_hop")] if ("Lộc" in hm and "Lộc Tồn" in l.sao(lh)) \
            else [_f("Lộc Tồn", m), _fh(l, "Lộc", lh, "luc_hop")]
        dat("minh_loc_am_loc", m, lh, can=can, sao=tuple(f["sao"] for f in can))
    if "Khoa" in hm and _co_loc(l, lh):
        can = [_fh(l, "Khoa", m), _fl(l, [lh], "luc_hop")]
        dat("khoa_minh_loc_am", m, lh, can=can, sao=tuple(f["sao"] for f in can))
    ht, hp = set(l.hoa(trai)) & {"Lộc", "Quyền", "Khoa"}, set(l.hoa(phai)) & {"Lộc", "Quyền", "Khoa"}
    if ht and hp and len(ht | hp) >= 2:
        can = [_fh(l, h, i) for i, hs in ((trai, ht), (phai, hp)) for h in ("Lộc", "Quyền", "Khoa") if h in hs]
        dat("khoa_quyen_loc_giap", *giap, can=can, sao=tuple(f["sao"] for f in can))
    if ("Lộc Tồn" in l.sao(trai) and "Lộc" in l.hoa(phai)) or ("Lộc Tồn" in l.sao(phai) and "Lộc" in l.hoa(trai)):
        a, b = (trai, phai) if ("Lộc Tồn" in l.sao(trai) and "Lộc" in l.hoa(phai)) else (phai, trai)
        can = [_f("Lộc Tồn", a), _fh(l, "Lộc", b)]
        dat("song_loc_giap_menh", *giap, can=can, sao=tuple(f["sao"] for f in can))
    if "Thiên Mã" in sm and (("Vũ Khúc" in l.chinh(trai) and "Lộc" in l.hoa(phai))
                             or ("Vũ Khúc" in l.chinh(phai) and "Lộc" in l.hoa(trai))):
        a, b = (trai, phai) if ("Vũ Khúc" in l.chinh(trai) and "Lộc" in l.hoa(phai)) else (phai, trai)
        dat("tai_loc_giap_ma", *giap, can=[_f("Thiên Mã", m), _f("Vũ Khúc", a), _fh(l, "Lộc", b)],
            sao=("Thiên Mã", "Vũ Khúc"))
    if _giap(l, "Thái Dương", "Thái Âm") or _giap(l, "Thiên Khôi", "Thiên Việt"):
        doi = ("Thái Dương", "Thái Âm") if _giap(l, "Thái Dương", "Thái Âm") else ("Thiên Khôi", "Thiên Việt")
        dat("quy_tinh_giap_menh", *giap, sao=doi)
    if "Thất Sát" in cmh and set(TU_SAT) & stp and ("Lộc Tồn" in stp or htp & {"Lộc", "Quyền"}):
        cat = _ft(l, "Lộc Tồn", tp) if "Lộc Tồn" in stp else _fhoa_tp(l, "Lộc" if "Lộc" in htp else "Quyền")
        dat("quyen_sat_hoa_loc", *tp, can=[_f("Thất Sát", m)] + [_ft(l, s, tp) for s in TU_SAT if s in stp] + [cat],
            sao=("Thất Sát",))
    if "Cự Môn" in cmh and set(TU_SAT) & sm:
        dat("cu_phung_tu_sat", sao=("Cự Môn",) + tuple(s for s in TU_SAT if s in sm))
    if {"Địa Không", "Địa Kiếp"} & sm and not ({"Tử Vi", "Thiên Phủ"} & cmh) and "Lộc" not in hm:
        kk = tuple(s for s in ("Địa Không", "Địa Kiếp") if s in sm)
        dat("menh_ly_phung_khong", can=[_f(s, m) for s in kk]
            + [{"kieu": "khong_o_menh", "ds": ["Tử Vi", "Thiên Phủ", "Hoá Lộc"]}], sao=kk)

    # ---- KB-TV3 — bổ sung theo cổ thư --------------------------------------------------------------
    if {"Thiên Đồng", "Thiên Lương"} <= cmh and cm in ("Dần", "Thân"):          # Đồng Lương đồng cung Dần/Thân
        dat("dong_luong_dan_than")
    if {"Liêm Trinh", "Thiên Tướng"} <= cmh:                                    # chỉ có ở Tý/Ngọ
        dat("liem_tuong_dong_cung")
    if {"Vũ Khúc", "Thất Sát"} <= cmh and cm in ("Mão", "Dậu"):                 # Vũ Sát Mão/Dậu
        dat("vu_sat_dong_cung")
    if "Tử Vi" in cmh and "Thiên Phủ" not in cmh and not ({"Tả Phù", "Hữu Bật"} & stp):   # "cô quân"
        dat("tu_vi_co_quan", can=[_f("Tử Vi", m), {"kieu": "khong_o_menh", "ds": ["Thiên Phủ"]},
                                  {"kieu": "khong_trong_tp", "ds": ["Tả Phù", "Hữu Bật"]}], sao=("Tử Vi",))
    # KT-N1 — «辅弼拱主 紫微守命二星来拱是也，夹之亦然»: Tử Vi thủ Mệnh, Tả Phù + Hữu Bật cùng về tam phương tứ chính
    # hoặc kẹp hai bên Mệnh. Cả hai cùng Ở Mệnh là «Quân thần khánh hội» (cách riêng của sách) nên không tính ở đây.
    th = {"Tả Phù", "Hữu Bật"}
    if "Tử Vi" in cmh and not th <= sm and (th <= stp or _giap(l, "Tả Phù", "Hữu Bật")):
        vt = [next(i for i in range(12) if s_ in l.sao(i)) for s_ in ("Tả Phù", "Hữu Bật")]
        dat("phu_bat_cung_chu", *dict.fromkeys([m, *vt]), can=[_f("Tử Vi", m), _f("Tả Phù", vt[0]), _f("Hữu Bật", vt[1])],
            sao=("Tử Vi", "Tả Phù", "Hữu Bật"))
    di = (m + 6) % 12
    ky_di = next((x["name"] for x in l.p[di]["majorStars"] if x.get("mutagen") == "Kỵ"), None)
    if ky_di:                                                                   # chính tinh hoá Kỵ tại Thiên Di
        dat("hoa_ky_thien_di", di, can=[_f(ky_di, di, "Kỵ")], sao=(ky_di,))
    if {"Liêm Trinh", "Thất Sát", "Kình Dương"} <= stp:
        dat("liem_sat_duong", *tp)
    if {"Cự Môn", "Hỏa Tinh", "Kình Dương"} <= stp:
        dat("cu_hoa_duong", *tp)
    if {"Linh Tinh", "Văn Xương", "Đà La", "Vũ Khúc"} <= stp:
        dat("linh_xuong_da_vu", *tp)
    if "Lộc Tồn" in sm:
        dat("loc_ton_thu_menh")
    than = next((i for i in range(12) if l.p[i].get("isBodyPalace")), m)
    if than != m and "Lộc Tồn" in l.sao(than):
        dat("loc_ton_thu_than", than, can=[_f("Lộc Tồn", than), {"kieu": "than_cu", "i": than}])
    ma_o = [i for i in (m, di) if "Thiên Mã" in l.sao(i)]
    if ma_o:
        dat("thien_ma_menh_di", *ma_o, sao=("Thiên Mã",))
    kq = (_fhoa_tp(l, "Khoa", True), _fhoa_tp(l, "Quyền", True))
    if kq[0] and kq[1] and "Lộc" not in htp:                                    # Khoa + Quyền trên chính tinh, không Lộc
        dat("khoa_quyen_hoi_menh", *tp, can=list(kq), sao=tuple(f["sao"] for f in kq))
    co4 = set(CNDL) & set().union(*(l.chinh(i) for i in tp))
    if len(co4) == 3:                                                           # đúng 3/4 sao Cơ Nguyệt Đồng Lương
        dat("co_nguyet_dong_luong_ba", *tp,
            can=[_ft(l, s, tp) for s in CNDL if s in co4] + [{"kieu": "khong_trong_tp", "ds": [s for s in CNDL if s not in co4]}],
            sao=tuple(s for s in CNDL if s in co4))

    sat = [s for s in LUC_SAT if s in stp]
    ra = []
    for k in DANH_SACH:
        if k not in co:
            continue
        cung, can, sao = co[k]
        sao = SAO.get(k, ()) if sao is None else sao
        if can is None:
            can = [_ft(l, s, cung) or _ft(l, s, range(12)) for s in sao]
        can = [f for f in can if f]
        dk = [{"loai": "can", **_xuat(l, f)} for f in can] + _tang_giam(l, k, sao, can, cung)
        ra.append({"ma": k, "cung": [l.ten(i) for i in dict.fromkeys(cung)], "sat_hoi": sat, "du_kien": dk})
    return ra
