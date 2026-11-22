# -*- coding: utf-8 -*-
"""Chỉ tay — route `/v1/chi-tay/*`. Lớp vỏ mỏng: tra KB, ghép lời SX-C. Không ảnh, không lưu gì.

  GET  /v1/chi-tay                    thư viện 67 hình vân (Thần Tướng Toàn Biên quyển 10) + đồ hình tám cung bàn tay
  POST /v1/chi-tay/doc                lời sách cho các vân + lựa chọn từng cung người dùng TỰ CHỌN; ngày sinh (tuỳ chọn)
                                      chỉ để biết đủ 18 tuổi (nhóm C)
  POST /v1/chi-tay/do-tay             CT-2: đo bàn tay từ 21 điểm mốc (máy người dùng tìm trên ảnh của họ — ảnh KHÔNG gửi
                                      lên), chiếu tám cung lên ảnh; bắt buộc `dong_y: true`. Không lưu toạ độ.
  POST /v1/chi-tay/luan-giai-hai-tay  Luận giải hợp nhất Đông – Tây cho 1 hoặc 2 bàn tay (Trái Tiên Thiên · Phải Hậu Thiên).
"""
from __future__ import annotations

import datetime as _dt
import math
import re
from typing import Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel, ConfigDict, Field, StrictBool, field_validator, model_validator

from app import config
from app.calc import chi_tay_do
from app.config import ENGINE_VERSION
from app.kb import chi_tay_kb as kb
from app.kb import chi_tay_tay_kb as kb_tay
from app.kb import tuong_hoc_dot4_kb
from app.luangiai import hoan_canh

router = APIRouter(prefix="/v1/chi-tay", tags=["chi-tay"])


_NGAY_SINH = Field(default=None, ge=_dt.date(1900, 1, 1), le=_dt.date(2100, 12, 31))


Phai = Literal["dong", "tay"]
PhaiDoTay = Literal["dong", "tay", "hop_nhat"]


def _kiem_diem_2d(v: list[tuple[float, float]]) -> list[tuple[float, float]]:
    if any(not (0 <= x <= 1 and 0 <= y <= 1) for x, y in v):
        raise ValueError("toạ độ phải trong khoảng 0..1")
    return v


def _kiem_diem_3d(v: list[tuple[float, float, float]] | None) -> list[tuple[float, float, float]] | None:
    if v is None:
        return None
    if len(v) != chi_tay_do.SO_DIEM:
        raise ValueError(f"diem_3d phải có đúng {chi_tay_do.SO_DIEM} điểm")
    if any(not (math.isfinite(x) and math.isfinite(y) and math.isfinite(z)) for x, y, z in v):
        raise ValueError("toạ độ 3D phải là số hữu hạn")
    return v


class DocIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    phai: Phai = "dong"
    dang_tay: str | None = Field(default=None, pattern=r"^[a-z_]{2,20}$")
    go: dict[str, str] | None = Field(default=None, max_length=7)
    van: list[str] = Field(default_factory=list, max_length=30)
    cung: dict[str, str] | None = Field(default=None, max_length=12)
    duong: dict[str, str] | None = Field(default=None, max_length=8)
    ngay_sinh: _dt.date | None = _NGAY_SINH

    @field_validator("van")
    @classmethod
    def _ma(cls, v: list[str]) -> list[str]:
        if any(not re.fullmatch(r"[a-z0-9-]{2,40}", x) for x in v):
            raise ValueError("mã vân không hợp lệ")
        return v

    @field_validator("cung")
    @classmethod
    def _cung(cls, v: dict[str, str] | None) -> dict[str, str] | None:
        if v and (loi := kb.lua_chon_hop_le(v)):
            raise ValueError("; ".join(loi))
        return v

    @model_validator(mode="after")
    def _co_mot(self) -> "DocIn":
        if self.phai == "tay":   # TK-2: phái Tây chỉ nhận dáng tay / gò / đường chỉ của chính nó
            if self.van or self.cung:
                raise ValueError("phái Tây không nhận vân / cung của sách tướng xưa")
            if loi := kb_tay.hop_le(self.dang_tay, self.go, self.duong):
                raise ValueError("; ".join(loi))
            if not self.dang_tay and not self.go and not self.duong:
                raise ValueError("cần ít nhất một lựa chọn dáng tay, gò hoặc đường chỉ")
            return self
        if self.dang_tay or self.go:
            raise ValueError("dáng tay / gò chỉ có ở phái Tây")
        if self.duong and (loi := kb.duong_hop_le(self.duong)):
            raise ValueError("; ".join(loi))
        if not self.van and not self.cung and not self.duong:
            raise ValueError("cần ít nhất một vân, một lựa chọn cung hoặc một lựa chọn đường chỉ")
        return self


class DoTayIn(BaseModel):
    """Chỉ toạ độ — không ảnh. `dong_y` phải đúng `true` (người dùng tự tích ô đồng ý `ct1`)."""
    model_config = ConfigDict(extra="forbid")
    dong_y: StrictBool
    phai: PhaiDoTay = "dong"
    tay: Literal["trai", "phai"]
    ty_le: float = Field(ge=0.2, le=5)
    diem: list[tuple[float, float]] = Field(min_length=chi_tay_do.SO_DIEM, max_length=chi_tay_do.SO_DIEM)
    diem_3d: list[tuple[float, float, float]] | None = None
    duong_chi_goi_y: dict | None = None
    ngay_sinh: _dt.date | None = _NGAY_SINH

    @field_validator("dong_y")
    @classmethod
    def _dong_y(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("cần người dùng đồng ý")
        return v

    @field_validator("diem")
    @classmethod
    def _diem(cls, v: list[tuple[float, float]]) -> list[tuple[float, float]]:
        return _kiem_diem_2d(v)

    @field_validator("diem_3d")
    @classmethod
    def _diem_3d(cls, v: list[tuple[float, float, float]] | None) -> list[tuple[float, float, float]] | None:
        return _kiem_diem_3d(v)


class MotTayIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ty_le: float = Field(ge=0.2, le=5)
    diem: list[tuple[float, float]] = Field(min_length=chi_tay_do.SO_DIEM, max_length=chi_tay_do.SO_DIEM)
    diem_3d: list[tuple[float, float, float]] | None = None
    duong_chi_goi_y: dict | None = None

    @field_validator("diem")
    @classmethod
    def _diem(cls, v: list[tuple[float, float]]) -> list[tuple[float, float]]:
        return _kiem_diem_2d(v)

    @field_validator("diem_3d")
    @classmethod
    def _diem_3d(cls, v: list[tuple[float, float, float]] | None) -> list[tuple[float, float, float]] | None:
        return _kiem_diem_3d(v)


class LuanGiaiHaiTayIn(BaseModel):
    """Đo và luận giải hợp nhất Đông – Tây cho 1 hoặc 2 bàn tay (Trái Tiên Thiên · Phải Hậu Thiên)."""
    model_config = ConfigDict(extra="forbid")
    dong_y: StrictBool
    trai: MotTayIn | None = None
    phai: MotTayIn | None = None
    van: list[str] = Field(default_factory=list, max_length=30)
    cung: dict[str, str] | None = Field(default=None, max_length=12)
    duong: dict[str, str] | None = Field(default=None, max_length=8)
    ngay_sinh: _dt.date | None = _NGAY_SINH

    @field_validator("dong_y")
    @classmethod
    def _dong_y(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("cần người dùng đồng ý")
        return v

    @field_validator("van")
    @classmethod
    def _ma(cls, v: list[str]) -> list[str]:
        if any(not re.fullmatch(r"[a-z0-9-]{2,40}", x) for x in v):
            raise ValueError("mã vân không hợp lệ")
        return v

    @field_validator("cung")
    @classmethod
    def _cung(cls, v: dict[str, str] | None) -> dict[str, str] | None:
        if v and (loi := kb.lua_chon_hop_le(v)):
            raise ValueError("; ".join(loi))
        return v

    @field_validator("duong")
    @classmethod
    def _duong(cls, v: dict[str, str] | None) -> dict[str, str] | None:
        if v and (loi := kb.duong_hop_le(v)):
            raise ValueError("; ".join(loi))
        return v

    @model_validator(mode="after")
    def _co_it_nhat_mot_tay(self) -> "LuanGiaiHaiTayIn":
        if self.trai is None and self.phai is None:
            raise ValueError("cần ít nhất một bàn tay (trai hoặc phai)")
        return self


def _tuoi(ngay_sinh: _dt.date | None) -> int | None:
    return hoan_canh.tuoi_tron(ngay_sinh, config.hom_nay_vn()) if ngay_sinh else None


def _ghep_tay_phuong_tay(kq: dict, tay: str) -> dict:
    """Ghép luận giải phương Tây: Cheiro (1894, 1916) · Benham (1900) · Dale (1895) · Baughan / 4 nguyên tố."""
    co_ban = kb_tay.ket_qua_do_tay(kq, tay)
    kinh_dien = tuong_hoc_dot4_kb.chitay_phuong_tay()
    duong_kd = kinh_dien.get("duong_chinh") or {}
    go_kd = kinh_dien.get("bay_go") or {}

    duong_chi_cv = kq.get("duong_chi_goi_y")
    goi_y_duong_kinh_dien = []
    for ma_duong in ("tam_dao", "tri_dao", "sinh_dao"):
        muc = duong_kd.get(ma_duong)
        if not muc:
            continue
        sg = muc.get("sach_ghi") or {}
        tin_hieu = (duong_chi_cv or {}).get(ma_duong) if isinstance(duong_chi_cv, dict) else None
        goi_y_duong_kinh_dien.append({
            "ma": ma_duong,
            "ten": muc["ten"],
            "mat_tich_cuc": muc["mat_tich_cuc"],
            "mat_tieu_cuc_can_chu_y": muc["mat_tieu_cuc_can_chu_y"],
            **({"trich": sg["trich"], "nguon": sg["nguon"]} if sg.get("trich") else {}),
            **({"tin_hieu_cv": tin_hieu, "do_tin_cv": "goi_y_tham_khao"} if tin_hieu else {}),
        })

    return {
        **co_ban,
        "fuzzy_bridge": kq.get("fuzzy_bridge"),
        "duong_kinh_dien": goi_y_duong_kinh_dien,
        "so_go_kinh_dien": len(go_kd),
        "truong_phai": [
            "Cheiro (Language of the Hand, 1894 · Palmistry for All, 1916)",
            "William G. Benham (The Laws of Scientific Hand Reading, 1900)",
            "Mrs. J. B. Dale (Indian Palmistry, 1895)",
            "Rosa Baughan / Hệ 4 Nguyên Tố (Thổ · Khí · Hỏa · Thủy — phân nhóm biên tập)",
        ],
    }


def _tong_hop_dong_tay(
    dong: dict | None,
    tay_pt: dict | None,
    so_sanh: dict | None,
    co_cv_duong_chi: bool,
) -> dict:
    diem_chung: list[str] = []
    if dong and dong.get("hop_le"):
        nhan_lech = [n["ten"] for n in dong.get("nhan") or [] if not n.get("vua")]
        if nhan_lech:
            diem_chung.append(f"Tướng tay phương Đông (Thần Tướng Toàn Biên) ghi nhận nổi bật: {', '.join(nhan_lech)}.")
    if tay_pt and tay_pt.get("hop_le"):
        dt = (tay_pt.get("fuzzy_bridge") or {}).get("dang_ban_tay") or {}
        if dt.get("ten"):
            diem_chung.append(f"Chỉ tay phương Tây xếp nhóm tỉ lệ gần với {dt['ten']}.")
        if tay_pt.get("to_hop") and tay_pt["to_hop"].get("ten"):
            diem_chung.append(f"Tổ hợp tỉ lệ Cheiro/Benham: {tay_pt['to_hop']['ten']}.")
    if so_sanh and so_sanh.get("nhan_xet"):
        diem_chung.append(so_sanh["nhan_xet"])

    tom_tat = (
        " ".join(diem_chung)
        if diem_chung
        else "Tỉ lệ bàn tay nằm trong dải cân đối ở cả hệ Đông (Thần Tướng Toàn Biên) và hệ Tây (Cheiro · Benham)."
    )
    ghi_chu = (
        "Tỉ lệ lòng bàn tay, ngón tay và vị trí 8 cung được đo trực tiếp từ 21 điểm mốc trên ảnh của bạn. "
        "Phân nhóm 4 Nguyên Tố (Thổ/Khí/Hỏa/Thủy) là ngưỡng biên tập tự đặt để tham khảo; "
        + ("tín hiệu 3 đường chỉ (Tâm/Trí/Sinh Đạo) trích từ ảnh chỉ là gợi ý tham khảo, không thay thế mắt bạn tự soi."
           if co_cv_duong_chi
           else "đường chỉ, độ đầy gò và sắc da cần bạn tự quan sát thêm trên tay thật.")
    )
    return {
        "tom_tat": tom_tat,
        "diem_chung": diem_chung,
        "do_tin": {
            "hinh_hoc": "do_truc_tiep_21_diem",
            "bon_nguyen_to": "bien_tap_tu_dat",
            "duong_chi_cv": "goi_y_tham_khao" if co_cv_duong_chi else "khong_co",
        },
        "ghi_chu": ghi_chu,
    }


def _tom_tat_mot_tay(kq: dict, tay: str, tuoi: int | None) -> dict:
    dong = kb.ket_qua_do_tay(kq, tay, tuoi)
    if not kq["hop_le"]:
        return {
            "tay": tay,
            "hop_le": False,
            "loi": dong["loi"],
            "loi_nhac": dong["loi_nhac"],
            "so_do": None,
            "nhan_dong": [],
            "nhan_tay": [],
            "cung": [],
            "fuzzy_bridge": None,
            "duong_chi_goi_y": None,
        }
    pt = kb_tay.ket_qua_do_tay(kq, tay)
    return {
        "tay": tay,
        "hop_le": True,
        "loi": None,
        "loi_nhac": None,
        "so_do": kq["so_do"],
        "nhan_dong": dong["nhan"],
        "nhan_tay": pt["nhan"],
        "cung": dong["cung"],
        "fuzzy_bridge": kq.get("fuzzy_bridge"),
        "duong_chi_goi_y": kq.get("duong_chi_goi_y"),
    }


@router.get("")
def api_thu_vien(phai: Phai = Query("dong")) -> dict:
    if phai == "tay":
        return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb_tay.thu_vien()}
    return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb.thu_vien()}


@router.post("/doc")
def api_doc(inp: DocIn) -> dict:
    if inp.phai == "tay":
        return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb_tay.doc(inp.dang_tay, inp.go, inp.duong)}
    return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb.doc(inp.van, _tuoi(inp.ngay_sinh), inp.cung, inp.duong)}


@router.post("/do-tay")
def api_do_tay(inp: DoTayIn) -> dict:
    co_mo_rong = inp.diem_3d is not None or inp.duong_chi_goi_y is not None or inp.phai == "hop_nhat"
    if co_mo_rong:
        kq = chi_tay_do.do_tay_mo_rong(
            [list(p) for p in inp.diem],
            inp.ty_le,
            inp.tay,
            diem_3d=[list(p) for p in inp.diem_3d] if inp.diem_3d else None,
            duong_chi_goi_y=inp.duong_chi_goi_y,
        )
    else:
        kq = chi_tay_do.do_tay([list(p) for p in inp.diem], inp.ty_le, inp.tay)

    if inp.phai == "tay":
        return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb_tay.ket_qua_do_tay(kq, inp.tay)}
    if inp.phai == "dong":
        return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb.ket_qua_do_tay(kq, inp.tay, _tuoi(inp.ngay_sinh))}

    # phai == "hop_nhat": hợp nhất Đông + Tây
    tuoi = _tuoi(inp.ngay_sinh)
    dong = kb.ket_qua_do_tay(kq, inp.tay, tuoi)
    tay_pt = _ghep_tay_phuong_tay(kq, inp.tay)
    tong_hop = _tong_hop_dong_tay(dong, tay_pt, None, bool(kq.get("duong_chi_goi_y")))
    return {
        "engine_version": ENGINE_VERSION,
        "pham_vi": "chi_tay",
        "phai": "hop_nhat",
        "hop_le": kq["hop_le"],
        "loi": dong["loi"],
        "loi_nhac": dong["loi_nhac"],
        "so_do": kq.get("so_do"),
        "cung": dong["cung"],
        "nhan": dong["nhan"],
        "fuzzy_bridge": kq.get("fuzzy_bridge"),
        "duong_chi_goi_y": kq.get("duong_chi_goi_y"),
        "luan_giai_dong": dong,
        "luan_giai_tay": tay_pt,
        "tong_hop_dong_tay": tong_hop,
    }


@router.post("/luan-giai-hai-tay")
def api_luan_giai_hai_tay(inp: LuanGiaiHaiTayIn) -> dict:
    tuoi = _tuoi(inp.ngay_sinh)
    kq_trai = (
        chi_tay_do.do_tay_mo_rong(
            [list(p) for p in inp.trai.diem],
            inp.trai.ty_le,
            "trai",
            diem_3d=[list(p) for p in inp.trai.diem_3d] if inp.trai.diem_3d else None,
            duong_chi_goi_y=inp.trai.duong_chi_goi_y,
        )
        if inp.trai is not None
        else None
    )
    kq_phai = (
        chi_tay_do.do_tay_mo_rong(
            [list(p) for p in inp.phai.diem],
            inp.phai.ty_le,
            "phai",
            diem_3d=[list(p) for p in inp.phai.diem_3d] if inp.phai.diem_3d else None,
            duong_chi_goi_y=inp.phai.duong_chi_goi_y,
        )
        if inp.phai is not None
        else None
    )

    tay_trai_ra = _tom_tat_mot_tay(kq_trai, "trai", tuoi) if kq_trai is not None else None
    tay_phai_ra = _tom_tat_mot_tay(kq_phai, "phai", tuoi) if kq_phai is not None else None
    so_sanh = chi_tay_do.so_sanh_hai_tay(kq_trai, kq_phai)

    # Chọn bàn tay chính để xuất luận giải Đông & Tây (ưu tiên tay hợp lệ; nếu cả 2 hợp lệ ưu tiên tay phải Hậu Thiên)
    if kq_phai and kq_phai.get("hop_le"):
        kq_chinh, tay_chinh = kq_phai, "phai"
    elif kq_trai and kq_trai.get("hop_le"):
        kq_chinh, tay_chinh = kq_trai, "trai"
    else:
        kq_chinh = kq_phai or kq_trai
        tay_chinh = "phai" if kq_phai is not None else "trai"

    assert kq_chinh is not None
    dong = kb.ket_qua_do_tay(kq_chinh, tay_chinh, tuoi)
    if inp.van or inp.cung or inp.duong:
        dong["tu_soi"] = kb.doc(inp.van, tuoi, inp.cung, inp.duong)

    tay_pt = _ghep_tay_phuong_tay(kq_chinh, tay_chinh)
    co_cv = bool((kq_trai and kq_trai.get("duong_chi_goi_y")) or (kq_phai and kq_phai.get("duong_chi_goi_y")))
    tong_hop = _tong_hop_dong_tay(dong, tay_pt, so_sanh, co_cv)

    return {
        "engine_version": ENGINE_VERSION,
        "pham_vi": "chi_tay",
        "tay_trai": tay_trai_ra,
        "tay_phai": tay_phai_ra,
        "so_sanh_hai_tay": so_sanh,
        "luan_giai_dong": dong,
        "luan_giai_tay": tay_pt,
        "tong_hop_dong_tay": tong_hop,
    }
