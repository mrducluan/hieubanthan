# -*- coding: utf-8 -*-
"""Endpoint Kinh Dịch — /v1/kinhdich/khoi-que.

Chỉ trả CẤU TRÚC quẻ, chưa luận giải (luận giải thuộc tầng KB/RULES/NARRATIVE).

Ép kỷ luật của skill kinh-dich ngay ở cửa vào:
  - chốt MỘT trường phái trước khi gieo (Nghĩa Lý / Lục Hào / Mai Hoa);
  - Lục Hào: bắt buộc chốt dụng thần trước, thiếu thì không cho gieo;
  - quẻ đến từ engine gieo (CSPRNG) hoặc người dùng gieo tay — không có trường
    nào để chọn quẻ theo số (extra="forbid").
Engine không lưu gì: câu hỏi chỉ được phản hồi lại trong meta.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import kinhdich
from app.kb import tu_dien
from app.hoidap import kinhdich as hoidap_kd
from app import nhat_ky
from app.config import ENGINE_VERSION

router = APIRouter(prefix="/v1/kinhdich", tags=["kinhdich"])

LUC_THAN = ("Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ")


class KhoiQueInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cau_hoi: str = Field(min_length=3, max_length=500)
    truong_phai: Literal["nghia_ly", "luc_hao", "mai_hoa"]
    phuong_phap: Literal["thi", "tien", "thi-vatly"] = "thi"
    dung_than: Literal[LUC_THAN] | None = None                 # type: ignore[valid-type]
    tieu_chi_sai: str | None = Field(default=None, max_length=500)
    gia_tri_hao: list[int] | None = Field(default=None, min_length=6, max_length=6)


@router.post("/khoi-que")
def api_khoi_que(inp: KhoiQueInput) -> dict:
    if inp.truong_phai == "luc_hao" and not inp.dung_than:
        raise HTTPException(422, detail=(
            "Lục Hào: phải chốt dụng thần TRƯỚC khi gieo (Phụ Mẫu / Huynh Đệ / Tử Tôn "
            "/ Thê Tài / Quan Quỷ). Chọn sau khi thấy quẻ là tự lừa."))

    if inp.gia_tri_hao is not None:
        vals = inp.gia_tri_hao
        nguon = "gieo tay (người dùng nhập)"
    else:
        vals = kinhdich.gieo(inp.phuong_phap)
        nguon = f"engine, {inp.phuong_phap}, secrets CSPRNG"

    try:
        que = kinhdich.khoi_que(vals)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))

    flags: list[dict] = []
    if not inp.tieu_chi_sai:
        flags.append({"loai": "chua_chot_tieu_chi_sai", "chi_tiet": (
            "Chưa chốt tiêu chí sai — luận đoán này không kiểm chứng được.")})
    flags.append({"loai": "chua_tinh_vuong_suy", "chi_tiet": (
        "Vượng suy theo nguyệt kiến / nhật thần và tuần không CHƯA được tính.")})

    return {
        "engine_version": ENGINE_VERSION,
        "pham_vi": "cau_truc_que",
        "meta": {
            "cau_hoi": inp.cau_hoi,
            "truong_phai": inp.truong_phai,
            "dung_than_chot_truoc": inp.dung_than,
            "tieu_chi_sai": inp.tieu_chi_sai,
            "thoi_diem": _dt.datetime.now(_dt.timezone.utc).isoformat(),
            "phuong_phap": inp.phuong_phap if inp.gia_tri_hao is None else None,
            "nguon_ngau_nhien": nguon,
            "gia_tri_hao_1_den_6": vals,
        },
        **que,
        "co_canh_bao": flags,
    }


class HoiKDInput(BaseModel):
    """Hỏi đáp Kinh Dịch. Không có trường chọn quẻ theo số (extra=forbid)."""
    model_config = ConfigDict(extra="forbid")

    cau_hoi: str = Field(min_length=3, max_length=500)
    che_do: Literal["tu_dong", "nghia_ly", "day_du"] = "tu_dong"
    cach_ra_que: Literal["may_gieo", "gieo_tay", "mai_hoa", "mai_hoa_so", "mai_hoa_phuong"] = "may_gieo"
    phuong_phap: Literal["thi", "tien", "thi-vatly"] = "thi"
    gia_tri_hao: list[int] | None = Field(default=None, min_length=6, max_length=6)
    thoi_diem: _dt.datetime | None = Field(default=None, description="Giờ Việt Nam; mặc định: bây giờ")
    # TP-LICH: âm lịch dùng cho Mai Hoa (năm/tháng/ngày âm của lúc hỏi).
    lich: Literal["viet", "trung"] = "viet"
    # KD-ĐS: chủ đề (chip) chốt dụng thần + nhóm việc; Mai Hoa theo số người dùng chọn / theo phương vị.
    # Số và phương do NGƯỜI DÙNG đưa vào theo đúng phép Mai Hoa — không phải trường chọn quẻ theo ý.
    chu_de: str | None = Field(default=None, max_length=40, pattern=r"^[a-z_]+$")
    so_mai_hoa: list[int] | None = Field(default=None, min_length=2, max_length=2)
    phuong_mai_hoa: Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] | None = None


@router.post("/hoi")
def api_hoi(inp: HoiKDInput, background: BackgroundTasks) -> dict:
    """HH-1: phân loại → chọn phái (+ dụng thần) → ra quẻ → gói bằng chứng KB → trả lời."""
    if inp.cach_ra_que == "gieo_tay" and inp.gia_tri_hao is None:
        raise HTTPException(422, detail="Gieo tay: cần 6 giá trị hào (6/7/8/9, hào 1 → 6).")
    if inp.cach_ra_que == "mai_hoa_so" and (inp.so_mai_hoa is None or any(x <= 0 or x > 9999 for x in inp.so_mai_hoa)):
        raise HTTPException(422, detail="Mai Hoa theo số: cần hai số nguyên dương (1–9999) bạn tự chọn.")
    if inp.cach_ra_que == "mai_hoa_phuong" and not inp.phuong_mai_hoa:
        raise HTTPException(422, detail="Mai Hoa theo phương vị: cần chọn phương.")
    try:
        kq = hoidap_kd.tra_loi(inp.cau_hoi.strip(), inp.che_do, gia_tri_hao=inp.gia_tri_hao,
                               thoi_diem=inp.thoi_diem.replace(tzinfo=None) if inp.thoi_diem else None,
                               phuong_phap=inp.phuong_phap, cach_ra_que=inp.cach_ra_que, lich=inp.lich,
                               chu_de=inp.chu_de, so_mai_hoa=inp.so_mai_hoa, phuong_mai_hoa=inp.phuong_mai_hoa)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    background.add_task(nhat_ky.ghi_huyenhoc, "kinhdich", inp.cau_hoi, kq, False)
    return {"engine_version": ENGINE_VERSION, **kq, "thuat_ngu": tu_dien.nhan_dien(kq.get("cau_tra_loi", ""), "kinhdich")}


@router.get("/chu-de")
def api_chu_de() -> dict:
    """KD-ĐS: danh mục chủ đề (chip) — mã, tên, dụng thần Lục Hào tương ứng."""
    from app.luangiai import kinhdich_doi_song as kd_ds  # noqa: PLC0415
    return {"engine_version": ENGINE_VERSION, "chu_de": kd_ds.danh_sach_chu_de()}
