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
import json
from functools import lru_cache
from pathlib import Path

from app.calc import kinhdich, kinhdich_maihoa as mh, lunar, thanso, thanso_mo_rong as mr
from app.config import CALENDAR_MERIDIAN_TZ
from app.hoidap import chung
from app.kb import store, thanso_v2, trang
from app.luangiai import hoang_lich as hl_luan, thanso_chaldean

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


# HL-2: ý định trong ngày ↔ việc trong sách lịch (chỉ những cặp khớp nghĩa rõ).
Y_DINH_VIEC = {"bat_dau": "khai_truong", "di_chuyen": "xuat_hanh"}


def _hoang_lich(ngay_xem: dt.date, ngay: int, thang: int, nam: int, cac_y_dinh: list[str]) -> dict:
    h = hl_luan.ngay_xem(ngay_xem, nam, thang, ngay)
    viec = []
    for ma in dict.fromkeys(Y_DINH_VIEC[x] for x in cac_y_dinh if x in Y_DINH_VIEC):
        v = hl_luan.ngay_xem(ngay_xem, nam, thang, ngay, viec=ma)["viec"]
        viec.append({k: v[k] for k in ("ma_viec", "ten", "danh_gia", "ly_do", "ngay_tot_gan")})
    return {
        "truc": h["truc"]["ten"], "truc_y": h["truc"]["y"], "than": h["than"]["ten"], "hoang_dao": h["hoang_dao"],
        "gio_hoang_dao": [{"chi": g["chi"], "khung": g["khung"], "than": g["than"]} for g in h["gio_hoang_dao"]],
        "xung_tuoi": h["xung_tuoi"]["ten"],
        "tuoi": {"can_chi": h["tuoi"]["can_chi"], "quan_he": h["tuoi"]["quan_he"]} if h["tuoi"] else None,
        "nghi": [x["ten"] for x in h["nghi"][:6]], "ky": [x["ten"] for x in h["ky"][:4]],
        "ky_dan_gian": [x["ten"] for x in h["ky_dan_gian"]],
        "ngay_tot_gan": h["ngay_tot_gan"], "viec": viec,
    }


def _que_ngay(ngay_xem: dt.date) -> dict:
    """Quẻ Mai Hoa đầu ngày: khởi theo năm–tháng–ngày âm (lịch Việt) và giờ Tý — mọi người cùng một quẻ trong ngày."""
    ad, am, ay, _ = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, CALENDAR_MERIDIAN_TZ)
    m = mh.khoi_que_thoi_gian(lunar.can_chi_nam(ay)[1], am, ad, "Tý")
    q = kinhdich.khoi_que(m["gia_tri_hao"])
    so = q["quai_ban"]["so_king_wen"]
    kv = _kb_que().get(str(so), {})
    bien = q["quai_bien"]
    return {"so": so, "ten": q["quai_ban"]["ten"], "thuong": m["thuong"], "ha": m["ha"], "hao_dong": m["hao_dong"],
            "bien": ({"so": bien["so_king_wen"], "ten": bien["ten"]} if bien else None),
            "y_chinh": kv.get("y_chinh"), "loi_khuyen": kv.get("loi_khuyen"), "cau_tu_soi": kv.get("cau_tu_soi"),
            "duong": f"/kien-thuc/kinh-dich/que-{so}-{trang._slug(kv['ten'])}" if kv.get("ten") else None,
            "cach_khoi": "Mai Hoa Dịch Số: năm + tháng + ngày âm lịch → quẻ trên; cộng giờ Tý → quẻ dưới và hào động."}


@lru_cache(maxsize=1)
def _kb_que() -> dict:
    return json.loads((Path(__file__).parents[1] / "kb" / "data" / "kinhdich_kb.json").read_text(encoding="utf-8"))["que"]


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
        "hoang_lich": _hoang_lich(ngay_xem, ngay, thang, nam, [x["ma"] for x in cac_y_dinh] or list(y_dinh or [])),
        "que_ngay": _que_ngay(ngay_xem),
        "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
        "trang_thai": meta["trang_thai"],
        "luu_y": "Nhịp theo thần số học để tự soi — gợi chủ đề, không dự báo việc sẽ xảy ra.",
    }
