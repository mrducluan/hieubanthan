# -*- coding: utf-8 -*-
"""API Bậc 2 & 3 cho Chủ Doanh Nghiệp: POST /v1/doanh-chu/doi-ngu."""
from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import doanh_chu
from app.luangiai import doanh_chu_cam_nang, doanh_chu_gop_von, doanh_chu_lich, doanh_chu_mat_bang, doanh_chu_quan_ly
from app.config import ENGINE_VERSION

router = APIRouter(prefix="/v1/doanh-chu", tags=["doanh-chu"])


class ThanhVienIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ten: str = Field(default="", max_length=60)
    vai_tro: str = Field(default="", max_length=60)
    nhom_viec: str = Field(
        default="",
        pattern="^(|kinh_doanh|van_hanh|tai_chinh|san_pham|marketing|doi_ngoai)$",
        description="Nhóm công việc chính tùy chọn (6 nhóm chuẩn) để gợi ý phối hợp sát thực tế hơn",
    )
    ngay: int = Field(..., ge=1, le=31)
    thang: int = Field(..., ge=1, le=12)
    nam: int = Field(..., ge=1930, le=2025)
    gioi_tinh: str = Field(default="nam", pattern="^(nam|nu)$")
    gio: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$", description="Giờ sinh HH:MM tuỳ chọn; thiếu = lập Tam Trụ chuẩn (không gán giả giờ Ngọ)")
    dong_y_tu_nguyen: bool = Field(default=False, description="Bắt buộc true cho mỗi thành viên (Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15)")


class DoiNguIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ong_chu: ThanhVienIn
    doi_ngu: list[ThanhVienIn] = Field(..., min_length=1, max_length=8)
    nam_xem: int = Field(..., ge=2020, le=2050)
    cap_quan_ly: str = Field(
        default="chu_dn",
        pattern="^(chu_dn|giam_doc|truong_nhom)$",
        description="Cấp quản lý của người xem: chu_dn (Chủ DN), giam_doc (Giám đốc bộ phận), truong_nhom (Trưởng nhóm)",
    )
    cam_ket_thoa_thuan: bool = Field(
        default=False,
        description="Chủ doanh nghiệp xác nhận đã ký thoả thuận riêng và có đồng ý của từng thành viên trước khi nhập dữ liệu",
    )


def _kiem_ngay(tv: ThanhVienIn) -> None:
    try:
        dt.date(tv.nam, tv.thang, tv.ngay)
    except ValueError as e:
        raise HTTPException(422, detail=f"Ngày sinh không hợp lệ: {tv.ngay}/{tv.thang}/{tv.nam}") from e


@router.post("/doi-ngu")
def phan_tich_doi_ngu(inp: DoiNguIn) -> dict:
    """Phân tích Bản Đồ Cân Bằng Ngũ Hành & Ma Trận Giao Tiếp 2 chiều (không lưu dữ liệu, bắt buộc đồng ý tự nguyện)."""
    if not inp.cam_ket_thoa_thuan:
        raise HTTPException(
            422,
            detail="Chủ doanh nghiệp cần xác nhận đã có thoả thuận riêng và sự đồng ý của từng thành viên (cam_ket_thoa_thuan=true).",
        )
    _kiem_ngay(inp.ong_chu)
    for tv in inp.doi_ngu:
        _kiem_ngay(tv)
        if not tv.dong_y_tu_nguyen:
            raise HTTPException(422, detail="Mỗi thành viên cần tự nguyện đồng ý (dong_y_tu_nguyen=true) theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.")
    kq = doanh_chu.ban_do_doi_ngu(
        inp.ong_chu.model_dump(),
        [tv.model_dump() for tv in inp.doi_ngu],
        nam_xem=inp.nam_xem,
        cap_quan_ly=inp.cap_quan_ly,
    )
    doanh_chu_quan_ly.lam_giau(kq)
    return {"engine_version": ENGINE_VERSION, "khong_luu_du_lieu": True, **kq}


class CaNhanIn(BaseModel):
    """Thành viên được mời tự xem "Cách làm việc của bạn" — dữ liệu chỉ đi qua lượt tính, không lưu."""
    model_config = ConfigDict(extra="forbid")

    ngay: int = Field(..., ge=1, le=31)
    thang: int = Field(..., ge=1, le=12)
    nam: int = Field(..., ge=1930, le=2025)
    gioi_tinh: str = Field(default="nam", pattern="^(nam|nu)$")
    gio: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$", description="Giờ sinh HH:MM tuỳ chọn; thiếu = lập Tam Trụ chuẩn")
    nam_xem: int = Field(..., ge=2020, le=2050)


@router.post("/ca-nhan")
def api_ca_nhan(inp: CaNhanIn) -> dict:
    try:
        dt.date(inp.nam, inp.thang, inp.ngay)
    except ValueError as e:
        raise HTTPException(422, detail="Ngày sinh không hợp lệ.") from e
    kq = doanh_chu_quan_ly.ca_nhan(inp.ngay, inp.thang, inp.nam, inp.gioi_tinh, inp.nam_xem, inp.gio)
    return {"engine_version": ENGINE_VERSION, "khong_luu_du_lieu": True, **kq}


@router.get("/tinh-huong")
def api_tinh_huong() -> dict:
    """Kho tình huống quản lý + vai trò 5 hành cho trang công khai (một nguồn)."""
    return {"engine_version": ENGINE_VERSION, **doanh_chu_quan_ly.danh_muc()}


class Lich12ThangIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ngay: int = Field(..., ge=1, le=31)
    thang: int = Field(..., ge=1, le=12)
    nam: int = Field(..., ge=1930, le=2025)
    gioi_tinh: str = Field(default="nam", pattern="^(nam|nu)$")
    gio: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$", description="Giờ sinh HH:MM; thiếu = không đọc lớp Bát tự")
    nam_xem: int | None = Field(default=None, ge=2020, le=2050, description="Bỏ trống = 12 tháng kể từ tháng hiện tại")
    cap_quan_ly: str = Field(default="chu_dn", pattern="^(chu_dn|giam_doc|truong_nhom)$")
    muc_tieu: str = Field(default="tang_truong", pattern="^(tang_truong|ky_ket|giu_tien|ra_mat)$")


@router.post("/lich-12-thang")
def api_lich_12_thang(inp: Lich12ThangIn) -> dict:
    """Lịch Quyết Định 12 Tháng cho Chủ DN / Quản lý (Bát Tự + Thần Số + Hoàng Lịch, không lưu dữ liệu)."""
    try:
        dt.date(inp.nam, inp.thang, inp.ngay)
    except ValueError as e:
        raise HTTPException(422, detail=f"Ngày sinh không hợp lệ: {inp.ngay}/{inp.thang}/{inp.nam}") from e
    kq = doanh_chu_lich.lich_quyet_dinh_12_thang(
        ngay=inp.ngay,
        thang=inp.thang,
        nam=inp.nam,
        gioi_tinh=inp.gioi_tinh,
        gio=inp.gio,
        nam_xem=inp.nam_xem,
        cap_quan_ly=inp.cap_quan_ly,
        muc_tieu=inp.muc_tieu,
    )
    return {"engine_version": ENGINE_VERSION, "khong_luu_du_lieu": True, **kq}


class MatBangIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    do_huong: float = Field(..., ge=0.0, lt=360.0)
    nam_xay: int | None = Field(default=None, ge=1864, le=2043, description="Bỏ trống = không rõ năm xây (không lập bàn)")
    ngay_sinh: int = Field(..., ge=1, le=31)
    thang_sinh: int = Field(..., ge=1, le=12)
    nam_sinh: int = Field(..., ge=1930, le=2025)
    gioi_tinh: str = Field(default="nam", pattern="^(nam|nu)$")
    loai_hinh: str = Field(default="van_phong", pattern="^(van_phong|cua_hang|quan_ca_phe|xuong_kho)$")


@router.post("/mat-bang")
def api_mat_bang(inp: MatBangIn) -> dict:
    """Kiểm tra Mặt Bằng & 5 Ngày Khai Trương (Huyền Không + Mệnh Quái + Hoàng Lịch, không lưu dữ liệu)."""
    try:
        dt.date(inp.nam_sinh, inp.thang_sinh, inp.ngay_sinh)
    except ValueError as e:
        raise HTTPException(422, detail="ngay_sinh_khong_hop_le") from e
    kq = doanh_chu_mat_bang.kiem_tra_mat_bang(
        do_huong=inp.do_huong,
        nam_xay=inp.nam_xay,
        ngay_sinh=inp.ngay_sinh,
        thang_sinh=inp.thang_sinh,
        nam_sinh=inp.nam_sinh,
        gioi_tinh=inp.gioi_tinh,
        loai_hinh=inp.loai_hinh,
    )
    return {"engine_version": ENGINE_VERSION, "khong_luu_du_lieu": True, **kq}


class SangLapIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ten: str = Field(default="", max_length=60)
    ngay: int = Field(..., ge=1, le=31)
    thang: int = Field(..., ge=1, le=12)
    nam: int = Field(..., ge=1930, le=2025)
    gioi_tinh: str = Field(default="nam", pattern="^(nam|nu)$")
    gio: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    ty_le_du_kien: float | None = Field(default=None, ge=0.0, le=100.0)
    dong_y_tu_nguyen: bool = Field(default=False)


class GopVonIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sang_lap: list[SangLapIn] = Field(..., min_length=2, max_length=4)
    nganh: str = Field(default="dich_vu", pattern="^(dich_vu|thuong_mai|cong_nghe|san_xuat)$")
    nam_xem: int = Field(default=2026, ge=2020, le=2050)
    cam_ket_thoa_thuan: bool = Field(default=False)


@router.post("/gop-von")
def api_gop_von(inp: GopVonIn) -> dict:
    """Chặng 2 — Soi bù khuyết Co-founder & Phân vai Góp vốn (2–4 người sáng lập, không lưu dữ liệu)."""
    if not inp.cam_ket_thoa_thuan:
        raise HTTPException(
            422,
            detail="Cần xác nhận đã có thoả thuận riêng và sự đồng ý của các thành viên sáng lập (cam_ket_thoa_thuan=true).",
        )
    for tv in inp.sang_lap:
        try:
            dt.date(tv.nam, tv.thang, tv.ngay)
        except ValueError as e:
            raise HTTPException(422, detail=f"Ngày sinh không hợp lệ: {tv.ngay}/{tv.thang}/{tv.nam}") from e
        if not tv.dong_y_tu_nguyen:
            raise HTTPException(422, detail="Mỗi thành viên sáng lập cần tự nguyện đồng ý (dong_y_tu_nguyen=true).")
    kq = doanh_chu_gop_von.phan_tich_gop_von(
        [tv.model_dump() for tv in inp.sang_lap],
        nganh=inp.nganh,
        nam_xem=inp.nam_xem,
    )
    return {"engine_version": ENGINE_VERSION, "khong_luu_du_lieu": True, **kq}


class MatBangUngVienIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ten_diem: str = Field(default="", max_length=80)
    loai_hinh: str = Field(default="cua_hang", pattern="^(van_phong|cua_hang|quan_ca_phe|xuong_kho)$")
    do_huong: float = Field(..., ge=0.0, lt=360.0)
    nam_xay: int | None = Field(default=None, ge=1864, le=2043)


class CamNangKinhDoanhIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ngay_sinh: dt.date
    gioi_tinh: str = Field(default="nam", pattern="^(nam|nu)$")
    gio_sinh: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    nganh: str = Field(default="dich_vu", pattern="^(dich_vu|thuong_mai|cong_nghe|san_xuat)$")
    mat_bang_ung_vien: list[MatBangUngVienIn] = Field(default_factory=list, max_length=3)
    ngay_xem: dt.date | None = None


@router.post("/cam-nang-kinh-doanh")
def api_cam_nang_kinh_doanh(inp: CamNangKinhDoanhIn) -> dict:
    """Chặng 2 — Cẩm nang Chiến lược Kinh doanh 5 Trụ: Mở rộng thị trường, So sánh 1–3 địa điểm & Thành Môn Quyết,
    Phối hợp nhân sự cốt cán, Bố trí văn phòng chủ & Bài trí cửa hàng buôn bán (không lưu dữ liệu)."""
    if not (1930 <= inp.ngay_sinh.year <= 2025):
        raise HTTPException(422, detail="Năm sinh cần nằm trong khoảng 1930–2025.")
    kq = doanh_chu_cam_nang.lap_cam_nang(
        ngay_sinh=inp.ngay_sinh,
        gioi_tinh=inp.gioi_tinh,
        gio_sinh=inp.gio_sinh,
        nganh=inp.nganh,
        mat_bang_ung_vien=[m.model_dump() for m in inp.mat_bang_ung_vien],
        ngay_xem=inp.ngay_xem,
    )
    return {"engine_version": ENGINE_VERSION, "khong_luu_du_lieu": True, **kq}


