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
    # KB-TV2 — đối chiếu danh mục TuViMCP (MIT); điều kiện siết theo cổ thư (xem từng nhánh dưới).
    "quan_than_khanh_hoi", "duong_luong_xuong_loc", "liem_trinh_van_vu", "dan_tri_que_tri", "nhat_chieu_loi_mon",
    "nhat_nguyet_tinh_minh", "nguyet_sinh_thuong_hai", "nhat_nguyet_chieu_bich", "co_luong_gia_hoi",
    "van_luong_chan_ky", "phu_cung_van_tinh", "tuong_tinh_dac_dia", "hoa_tinh_phan_quy", "quyen_loc_hoi_menh",
    "loc_hop_uyen_uong", "loc_ma_boi_an", "minh_loc_am_loc", "khoa_minh_loc_am", "khoa_quyen_loc_giap",
    "song_loc_giap_menh", "tai_loc_giap_ma", "quy_tinh_giap_menh", "quyen_sat_hoa_loc", "cu_phung_tu_sat",
    "menh_ly_phung_khong",
]
TU_SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh")


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

    # ---- KB-TV2 ------------------------------------------------------------------------------------
    htp = l.hoa_tp()
    trai, phai = (m - 1) % 12, (m + 1) % 12
    if "Tử Vi" in cmh and len({"Tả Phù", "Hữu Bật", "Thiên Khôi", "Thiên Việt", "Văn Xương", "Văn Khúc",
                               "Lộc Tồn"} & stp) >= 3:                      # Tử Vi thủ Mệnh, ≥ 3 cát tinh hội
        dat("quan_than_khanh_hoi", *tp)
    if {"Thái Dương", "Thiên Lương", "Văn Xương"} <= stp and ("Lộc Tồn" in stp or "Lộc" in htp):
        dat("duong_luong_xuong_loc", *tp)
    if "Liêm Trinh" in cmh and cm in ("Dần", "Thân") and {"Vũ Khúc", "Văn Xương"} <= stp:
        dat("liem_trinh_van_vu", *tp)
    if ("Thái Dương" in cmh and cm in ("Thìn", "Tỵ", "Ngọ")) or ("Thái Âm" in cmh and cm in ("Dậu", "Tuất", "Hợi")):
        dat("dan_tri_que_tri")
    if "Thái Dương" in cmh and cm == "Mão":
        dat("nhat_chieu_loi_mon")
    nd, na = l.tim("Thái Dương"), l.tim("Thái Âm")
    if nd in tp and na in tp and l.p[nd]["earthlyBranch"] == "Tỵ" and l.p[na]["earthlyBranch"] == "Dậu":
        dat("nhat_nguyet_tinh_minh", m, nd, na)
    if {"Thái Âm", "Thiên Đồng"} <= cmh and cm == "Tý":
        dat("nguyet_sinh_thuong_hai")
    dt_ = next(i for i in range(12) if l.ten(i) == "Điền Trạch")
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
        dat("tuong_tinh_dac_dia", *tp)
    hm = l.hoa(m)
    if ("Thiên Đồng" in cmh and cm == "Tuất" and hm.get("Quyền") == "Thiên Đồng") or \
            ("Cự Môn" in cmh and cm in ("Thìn", "Tuất") and hm.get("Lộc") == "Cự Môn"):
        dat("hoa_tinh_phan_quy")
    if {"Lộc", "Quyền"} <= htp and "Khoa" not in htp:                   # đủ ba hoá đã là Tam Kỳ
        dat("quyen_loc_hoi_menh", *tp)
    if "Lộc Tồn" in sm and "Lộc" in hm:
        dat("loc_hop_uyen_uong")
    if ("Lộc Tồn" in stp or "Lộc" in htp) and {"Thiên Mã", "Thiên Tướng"} <= stp:
        dat("loc_ma_boi_an", *tp)
    lh = _luc_hop(m)
    if ("Lộc" in hm and "Lộc Tồn" in l.sao(lh)) or ("Lộc Tồn" in sm and "Lộc" in l.hoa(lh)):
        dat("minh_loc_am_loc", m, lh)
    if "Khoa" in hm and _co_loc(l, lh):
        dat("khoa_minh_loc_am", m, lh)
    ht, hp = set(l.hoa(trai)) & {"Lộc", "Quyền", "Khoa"}, set(l.hoa(phai)) & {"Lộc", "Quyền", "Khoa"}
    if ht and hp and len(ht | hp) >= 2:
        dat("khoa_quyen_loc_giap", *giap)
    if ("Lộc Tồn" in l.sao(trai) and "Lộc" in l.hoa(phai)) or ("Lộc Tồn" in l.sao(phai) and "Lộc" in l.hoa(trai)):
        dat("song_loc_giap_menh", *giap)
    if "Thiên Mã" in sm and (("Vũ Khúc" in l.chinh(trai) and "Lộc" in l.hoa(phai))
                             or ("Vũ Khúc" in l.chinh(phai) and "Lộc" in l.hoa(trai))):
        dat("tai_loc_giap_ma", *giap)
    if _giap(l, "Thái Dương", "Thái Âm") or _giap(l, "Thiên Khôi", "Thiên Việt"):
        dat("quy_tinh_giap_menh", *giap)
    if "Thất Sát" in cmh and set(TU_SAT) & stp and ("Lộc Tồn" in stp or htp & {"Lộc", "Quyền"}):
        dat("quyen_sat_hoa_loc", *tp)
    if "Cự Môn" in cmh and set(TU_SAT) & sm:
        dat("cu_phung_tu_sat")
    if {"Địa Không", "Địa Kiếp"} & sm and not ({"Tử Vi", "Thiên Phủ"} & cmh) and "Lộc" not in hm:
        dat("menh_ly_phung_khong")

    sat = [s for s in LUC_SAT if s in stp]
    return [{"ma": k, "cung": [l.ten(i) for i in dict.fromkeys(co[k])], "sat_hoi": sat}
            for k in DANH_SACH if k in co]
