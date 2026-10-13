# -*- coding: utf-8 -*-
"""HN-1 — "Hôm nay của bạn": thẻ mỗi ngày cho khâu QUAY LẠI (docs/MUC-TIEU-TANG-TRUONG.md).

Chỉ ghép: số đã tính (ngày/tháng/năm cá nhân — CALC thần số, mốc 1/1 dương lịch như trang đọc) + âm lịch và can chi
của ngày xem (CALC lịch, âm lịch Việt Nam UTC+7) + nghĩa trong KB (`thanso_chi_so_phu`, nháp AI có nhãn). Không gọi
LLM, không dự báo sự kiện. Có "ngày mai" để người dùng có lý do mở lại hôm sau.

HN-2 — "Hôm nay bạn định làm gì?": người dùng chọn ý định (mã cố định) hoặc gõ một câu; câu gõ tay chỉ dùng để
NHẬN DIỆN ý định bằng luật từ khoá (không LLM), không trả lại, không lưu. Mỗi ý định × ngày cá nhân → nhịp
(thuận / trung tính / cân nhắc), cách làm hợp nhịp, câu tự soi (KB `thanso_hom_nay`). Câu khủng hoảng → lời hỗ trợ.
Kèm ngày phổ quát, 3 câu hỏi nổi bật xoay theo ngày, và số ngày theo phái Chaldea.
"""
from __future__ import annotations

import datetime as dt

from app.calc import lunar, thanso, thanso_mo_rong as mr
from app.config import CALENDAR_MERIDIAN_TZ
from app.hoidap import chung
from app.kb import store, thanso_v2
from app.luangiai import thanso_chaldean

TOI_DA_Y_DINH = 3
# Từ khoá (đã bỏ dấu, khớp nguyên từ) → ý định. Thứ tự khoá = thứ tự ưu tiên khi đồng điểm.
TU_KHOA_Y_DINH: dict[str, list[str]] = {
    "gap_go": [r"gap", r"phong van", r"thuong luong", r"dam phan", r"ky hop dong", r"khach hang", r"doi tac",
               r"hen ca phe", r"gap mat", r"thuyet trinh"],
    "bat_dau": [r"bat dau", r"khoi dong", r"khai truong", r"mo ban", r"viec moi", r"du an moi", r"ra mat",
                r"lan dau"],
    "cong_viec": [r"cong viec", r"di lam", r"cho lam", r"co quan", r"cong ty", r"bao cao", r"deadline", r"hop",
                  r"sep", r"du an", r"nop ho so", r"ke hoach"],
    "hoc_tap": [r"hoc", r"on thi", r"di thi", r"ky thi", r"thi cu", r"kiem tra", r"doc sach", r"khoa hoc", r"bai tap", r"luan van"],
    "tinh_cam": [r"hen ho", r"nguoi yeu", r"nguoi thuong", r"crush", r"to tinh", r"ban trai", r"ban gai",
                 r"vo", r"chong", r"lam lanh", r"cai nhau"],
    "gia_dinh": [r"gia dinh", r"bo me", r"cha me", r"ong ba", r"con cai", r"dua con", r"don con", r"viec nha",
                 r"ve que", r"nha noi", r"nha ngoai", r"me con"],
    "chi_tieu": [r"mua sam", r"mua do", r"mua nha", r"mua xe", r"di cho", r"chi tieu", r"tra no", r"tien nha", r"ngan sach", r"tiet kiem", r"thanh toan"],
    "van_dong": [r"tap gym", r"gym", r"chay bo", r"tap the duc", r"yoga", r"boi", r"da bong", r"dap xe",
                 r"van dong", r"tap luyen", r"leo nui"],
    "di_chuyen": [r"di xa", r"du lich", r"cong tac", r"chuyen nha", r"bay ra", r"bay vao", r"ra san bay", r"len duong",
                  r"di da lat", r"da lat", r"di choi xa", r"ve que"],
    "nghi_ngoi": [r"nghi phep", r"nghi ngoi", r"duoc nghi", r"ngu bu", r"thu gian", r"o nha", r"cham soc ban than", r"spa", r"xem phim"],
    "sang_tao": [r"viet", r"ve tranh", r"thiet ke", r"quay video", r"lam noi dung", r"chup anh", r"sang tac",
                 r"y tuong", r"lam nhac"],
}


def _ngay(so: int) -> dict:
    return {"so": so, "nghia": thanso_v2.nghia_phu("ngay_ca_nhan", so),
            "tu_soi": thanso_v2.nghia_phu("ngay_ca_nhan_tu_soi", so)}


def nhan_dien_y_dinh(cau: str) -> list[str]:
    """Câu gõ tay → các mã ý định khớp từ khoá, nhiều từ khớp xếp trước (tối đa 3). Không khớp → []."""
    t = chung.chuan_hoa(cau)
    ma = list(TU_KHOA_Y_DINH)
    diem = {m: chung.dem(t, kw) for m, kw in TU_KHOA_Y_DINH.items()}
    co = [m for m in ma if diem[m] > 0]
    return sorted(co, key=lambda m: (-diem[m], ma.index(m)))[:TOI_DA_Y_DINH]


def _y_dinh(so_ngay: int, cac_ma: list[str]) -> list[dict]:
    ds = thanso_v2.y_dinh_hom_nay()
    kq: list[dict] = []
    for ma in cac_ma:
        if ma not in ds or any(x["ma"] == ma for x in kq):
            continue
        m = thanso_v2.y_dinh_theo_ngay(so_ngay, ma)
        if m:
            kq.append({"ma": ma, "ten": ds[ma]["ten"], "bieu_tuong": ds[ma]["bieu_tuong"], **m})
        if len(kq) == TOI_DA_Y_DINH:
            break
    return kq


def _cau_hoi_noi_bat(so_ngay: int, ngay_xem: dt.date) -> list[str]:
    kho = thanso_v2.cau_hoi_noi_bat(so_ngay)
    if not kho:
        return []
    lech = ngay_xem.toordinal() % len(kho)       # xoay theo ngày — cùng số ngày cá nhân vẫn đổi câu
    return [kho[(lech + i) % len(kho)] for i in range(min(3, len(kho)))]


def the_hom_nay(ngay: int, thang: int, nam: int, ngay_xem: dt.date,
                y_dinh: list[str] | None = None, du_dinh: str | None = None) -> dict:
    y, m, d = ngay_xem.year, ngay_xem.month, ngay_xem.day
    so_ngay = mr.ngay_ca_nhan(ngay, thang, y, m, d)
    so_thang = mr.thang_ca_nhan(ngay, thang, y, m)
    so_nam = int(thanso.nam_ca_nhan(ngay, thang, y, "duong_lich"))
    nghia_thang = thanso_v2.nghia_phu("thang_ca_nhan", so_thang) or {}
    nghia_nam = store.nghia_nam_ca_nhan(so_nam) or {}

    ad, am, ay, nhuan = lunar.solar_to_lunar(d, m, y, CALENDAR_MERIDIAN_TZ)
    mai = ngay_xem + dt.timedelta(days=1)
    so_mai = mr.ngay_ca_nhan(ngay, thang, mai.year, mai.month, mai.day)
    meta = thanso_v2.meta_phu()

    ho_tro = None
    nhan_dien: list[str] = []
    if du_dinh and du_dinh.strip():
        loai = chung.dac_biet(chung.chuan_hoa(du_dinh))
        if loai == "an_toan":
            ho_tro = thanso_v2.mau("an_toan")
        elif loai is None:
            nhan_dien = nhan_dien_y_dinh(du_dinh)
    cac_y_dinh = [] if ho_tro else _y_dinh(so_ngay, list(y_dinh or []) + nhan_dien)
    so_pq = mr.ngay_pho_quat(y, m, d)
    return {
        "ngay_xem": ngay_xem.isoformat(),
        "am_lich": {
            "ngay": ad, "thang": am, "nam": ay, "nhuan": bool(nhuan),
            "can_chi_ngay": " ".join(lunar.can_chi_ngay(ngay_xem)),
            "can_chi_thang": " ".join(lunar.can_chi_thang(am, ay)),
            "can_chi_nam": " ".join(lunar.can_chi_nam(ay)),
        },
        "ngay_ca_nhan": _ngay(so_ngay),
        "thang_ca_nhan": {"so": so_thang, "thang": m, "chu_de": nghia_thang.get("chu_de"),
                          "nen": nghia_thang.get("nen"), "tranh": nghia_thang.get("tranh")},
        "nam_ca_nhan": {"so": so_nam, "nam": y, "chu_de": nghia_nam.get("chu_de"),
                        "nen": nghia_nam.get("nen"), "tranh": nghia_nam.get("tranh")},
        "ngay_mai": {"ngay": mai.isoformat(), **_ngay(so_mai)},
        "y_dinh_hom_nay": cac_y_dinh,
        "y_dinh_nhan_dien": nhan_dien,
        "ho_tro": ho_tro,
        "danh_sach_y_dinh": thanso_v2.y_dinh_hom_nay(),
        "cau_hoi_noi_bat": _cau_hoi_noi_bat(so_ngay, ngay_xem),
        "ngay_pho_quat": {"so": so_pq, "nghia": thanso_v2.ngay_pho_quat(so_pq)},
        "chaldea": thanso_chaldean.ngay_chaldea(ngay, d),
        "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
        "trang_thai": meta["trang_thai"],
        "luu_y": "Nhịp theo thần số học để tự soi — gợi chủ đề, không dự báo việc sẽ xảy ra.",
    }
