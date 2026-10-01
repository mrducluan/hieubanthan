# -*- coding: utf-8 -*-
"""KB-2 — nhận diện cách cục Tử vi trên lá số iztro (thuần, tất định, không LLM).

Xét cung Mệnh và tam phương tứ chính (Mệnh, hai cung tam hợp, cung xung chiếu). Điều kiện mỗi cách theo
bản phổ thông của Tử Vi Đẩu Số Toàn Thư / Đẩu Số Cốt Tuỷ Phú; phần "phá cách" KHÔNG tự kết luận — chỉ
liệt kê lục sát tinh hội về (`sat_hoi`) để tầng diễn giải nói rõ "cách bị giảm khi gặp sát".
Đầu vào: lá số thô iztro (palaces[i] với i = 0 là cung Dần, chi tăng dần).
"""
from __future__ import annotations

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
]


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


def _giap(l: _La, a: str, b: str) -> bool:
    hai = (l.sao(l.m - 1), l.sao(l.m + 1))
    return (a in hai[0] and b in hai[1]) or (b in hai[0] and a in hai[1])


def nhan_dien(la: dict) -> list[dict]:
    """→ [{ma, cung: [tên cung liên quan], sat_hoi: [lục sát trong tam phương tứ chính]}] theo DANH_SACH."""
    l = _La(la)
    m, cm = l.m, l.chi_menh
    sm, cmh = l.sao(m), l.chinh(m)
    tp, stp = l.tp(), l.sao_tp()
    co: dict[str, list[int]] = {}

    def dat(ma: str, *cung: int) -> None:
        co[ma] = list(cung) or [m]

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
        dat("minh_chau_xuat_hai", m, l.tim("Thái Dương"), l.tim("Thái Âm"))
    if {"Lộc", "Quyền", "Khoa"} <= l.hoa_tp():
        dat("tam_ky_gia_hoi", *tp)
    if "Lộc Tồn" in stp and "Lộc" in l.hoa_tp():
        dat("song_loc", *tp)
    for i in tp:
        if "Thiên Mã" in l.sao(i) and ("Lộc Tồn" in l.sao(i) or "Lộc" in l.hoa(i)):
            dat("loc_ma_giao_tri", i)
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
        dat("hoa_ky_thu_menh")
    if not cmh:
        dat("menh_vo_chinh_dieu", m, (m + 6) % 12)
    if l.p[m].get("isBodyPalace"):
        dat("than_menh_dong_cung")

    sat = [s for s in LUC_SAT if s in stp]
    return [{"ma": k, "cung": [l.ten(i) for i in dict.fromkeys(co[k])], "sat_hoi": sat}
            for k in DANH_SACH if k in co]
