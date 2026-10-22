# -*- coding: utf-8 -*-
"""TV-V2 — 4 route Tử vi mới (hợp đồng: docs/NANG-CAP-TUVI-V2.md mục 3). Không lưu gì.

- POST /v1/tuvi/phi-hoa       — phi tinh tứ hoá 12 cung (48 đường bay) + tứ hoá lưu niên tuỳ chọn
- POST /v1/tuvi/nhip-3-thang  — tháng âm hiện tại + 2 tháng sau: Thuận / Bình / Cần thận trọng theo luật công khai
- POST /v1/tuvi/hop-tham      — "Xem lá số 2 người": can năm người kia phi hoá vào lá của bạn (hai chiều nếu người kia
                                có lá đầy đủ) + điểm tham khảo hợp – khắc 0–100 (HN-2N, luangiai/tuvi_hai_nguoi.py)
- POST /v1/tuvi/dinh-gio      — so lá số giờ trước / đã nhập / sau (hoặc 12 canh) bằng câu hỏi về năm cũ

Tiền xử lý (múi giờ lịch sử, lịch, phái) dùng lại `_DauVao` của app/tuvi_api.py — không viết lại.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import lunar, tuvi_an_sao
from app import config
from app.config import ENGINE_VERSION, Region
from app.hoidap.tuvi import tom_tat
from app.luangiai import tuvi_dinh_gio, tuvi_hop_tham, tuvi_nhip_3_thang, tuvi_phi_hoa
from app.tuvi_api import TuanTrietInput, _DauVao, _loi_an_sao, _MaMau, _Phieu

router = APIRouter(prefix="/v1/tuvi", tags=["tuvi"])
_VN = _dt.timezone(_dt.timedelta(hours=7))


def _hom_nay() -> _dt.date:
    return _dt.datetime.now(_VN).date()


def _sinh(dv: _DauVao, gioi_tinh: str) -> dict:
    cal = dv.tb.calendar_dt
    return {"ngay": cal.date(), "ti": tuvi_an_sao.time_index(cal.hour, cal.minute), "gioi_tinh": gioi_tinh,
            "tz_lich": dv.tz_lich, **dv.tuy_chon}


def _la(sinh: dict) -> dict:
    return tuvi_an_sao.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN", tz_lich=sinh["tz_lich"],
                                  hoa_linh=sinh["hoa_linh"], thang_nhuan=sinh["thang_nhuan"], lich=sinh["lich"])


def _can_nam(la: dict, du_phong: str) -> str:
    """Can năm iztro dùng để an lá (đầu `chineseDate`; đã theo âm lịch Việt khi lich=viet)."""
    can = str(la.get("chineseDate", "")).split(" ")[0]
    return can if can in lunar.CAN else du_phong


# ------------------------------------------------------------------ phi hoá
class PhiHoaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    nam_xem: int | None = Field(default=None, ge=1900, le=2100, description="Năm âm lịch xem tứ hoá lưu niên")


@router.post("/phi-hoa")
def api_phi_hoa(inp: PhiHoaInput) -> dict:
    dv = _DauVao(inp.la_so)
    try:
        la = _la(_sinh(dv, inp.la_so.gender))
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    kq = tuvi_phi_hoa.lap(tom_tat(la), _can_nam(la, dv.can), inp.nam_xem)
    return {"engine_version": ENGINE_VERSION, **kq, "co_canh_bao": list(dv.flags)}


# ------------------------------------------------------------------ nhịp 3 tháng
class Nhip3ThangInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    ngay_xem: _dt.date | None = Field(default=None, description="Mặc định hôm nay (giờ Việt Nam)")


@router.post("/nhip-3-thang")
def api_nhip_3_thang(inp: Nhip3ThangInput) -> dict:
    dv = _DauVao(inp.la_so)
    try:
        kq = tuvi_nhip_3_thang.lap(_sinh(dv, inp.la_so.gender), inp.ngay_xem or _hom_nay(), inp.la_so.luu_nguyet)
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    return {"engine_version": ENGINE_VERSION, **kq, "co_canh_bao": list(dv.flags)}


# ------------------------------------------------------------------ hợp tham
class NguoiKiaInput(BaseModel):
    """Người kia: ngày sinh bắt buộc; đủ giờ + giới tính + nơi sinh → an lá đầy đủ để xem hai chiều."""
    model_config = ConfigDict(extra="forbid")

    birth_date: _dt.date
    calendar_type: Literal["duong", "am"] = "duong"
    am_nhuan: bool = False
    birth_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    gender: Literal["nam", "nu"] | None = None
    noi_sinh: str | None = Field(default=None, max_length=40)
    vung: Region | None = None


class HopThamInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    nguoi_kia: NguoiKiaInput
    quan_he: Literal["nguoi_yeu", "vo_chong", "ban_be", "dong_nghiep", "doi_tac", "sep", "cha_me_con",
                     "gia_dinh"] = "nguoi_yeu"
    # Tầng HỌC (kiểm chứng loại `hai_nguoi`, migration 0020): web máy chủ gửi — chỉ mã + số đếm, không chữ người dùng.
    trong_so: dict[_MaMau, _Phieu] | None = Field(default=None, max_length=5000)
    ca_nhan: dict[_MaMau, Literal["dung", "chua_dung"]] | None = Field(default=None, max_length=500)


@router.post("/hop-tham")
def api_hop_tham(inp: HopThamInput) -> dict:
    dv = _DauVao(inp.la_so)
    k = inp.nguoi_kia
    try:
        la = _la(_sinh(dv, inp.la_so.gender))
        ls_kia, can_kia, nam_kia, ngay_kia = None, None, None, None
        if k.birth_time and k.gender and k.noi_sinh:
            dv_k = _DauVao(TuanTrietInput(
                birth_date=k.birth_date, birth_time=k.birth_time, gender=k.gender, calendar_type=k.calendar_type,
                am_nhuan=k.am_nhuan, noi_sinh=k.noi_sinh, vung=k.vung, hoa_linh=inp.la_so.hoa_linh,
                thang_nhuan=inp.la_so.thang_nhuan, lich=inp.la_so.lich))
            la_k = _la(_sinh(dv_k, k.gender))
            ls_kia, can_kia, nam_kia, ngay_kia = tom_tat(la_k), _can_nam(la_k, dv_k.can), dv_k.am[2], dv_k.duong_goc
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    if can_kia is None:
        # QC 2026-10-21: chỉ có ngày → cùng lịch người dùng chọn (`la_so.lich`) và vùng suy từ nơi sinh, như đường đủ giờ.
        try:
            vung_k = tuvi_hop_tham.vung_tu_noi_sinh(k.vung, k.noi_sinh)
            nam_kia = tuvi_hop_tham.nam_am_viet(k.birth_date, k.calendar_type, vung_k, inp.la_so.lich,
                                                am_nhuan=k.am_nhuan)
            ngay_kia = tuvi_hop_tham.ngay_duong_nguoi_kia(k.birth_date, k.calendar_type, k.am_nhuan, vung_k)
        except ValueError as e:
            raise HTTPException(422, detail=str(e))
        can_kia = lunar.can_chi_nam(nam_kia)[0]
    # HN-2N: năm âm + giới tính hai người → điểm tham khảo (giới tính người kia tuỳ chọn: thiếu thì bỏ cung phi).
    # Ngày dương → cung phi tính năm theo Lập xuân như /phong-thuy.
    kq = tuvi_hop_tham.lap(tom_tat(la), _can_nam(la, dv.can), can_kia, inp.quan_he, ls_kia=ls_kia,
                           ban={"nam_am": dv.am[2], "gioi_tinh": inp.la_so.gender, "ngay_duong": dv.duong_goc},
                           kia={"nam_am": nam_kia, "gioi_tinh": k.gender, "ngay_duong": ngay_kia},
                           trong_so={m: v.model_dump() for m, v in inp.trong_so.items()} if inp.trong_so else None,
                           ca_nhan=inp.ca_nhan)
    return {"engine_version": ENGINE_VERSION, **kq}


# ------------------------------------------------------------------ định giờ
class DinhGioInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    nam_doi_chieu: list[int] | None = Field(default=None, max_length=3,
                                             description="Năm âm lịch bạn nhớ rõ (tối đa 3); mặc định 3 năm đã qua")
    tat_ca_gio: bool = False


GHI_CHU_TY_MUON = ("Giờ bạn nhập rơi vào Tý muộn (23:00–23:59): Tử vi tính giờ này sang ngày hôm sau, nên lá số "
                   "khác lá Tý sớm (00:00–00:59) của cùng ngày.")


def _ghi_chu_ty_muon(lech_phut: int) -> str:
    if not lech_phut:
        return GHI_CHU_TY_MUON
    return (f"Giờ bạn nhập rơi vào Tý muộn ({tuvi_dinh_gio.khoang_canh(12, lech_phut)} giờ đồng hồ): Tử vi tính "
            "giờ này sang ngày hôm sau, nên lá số khác lá Tý sớm "
            f"({tuvi_dinh_gio.khoang_canh(0, lech_phut)} giờ đồng hồ) của cùng ngày.")


def _ghi_chu_ty_muon_hom_truoc(dong_ho: _dt.datetime, cal: _dt.datetime, lech_phut: int) -> str:
    return (f"Giờ bạn nhập ({dong_ho.strftime('%H:%M')} giờ đồng hồ) theo giờ lịch là "
            f"{cal.strftime('%H:%M ngày %d/%m/%Y')} — Tý muộn. Tử vi tính Tý muộn sang ngày hôm sau, tức đúng ngày "
            f"bạn nhập, nên lá số trùng lá Tý sớm ({tuvi_dinh_gio.khoang_canh(0, lech_phut)} giờ đồng hồ) của ngày này.")


def ly_do_lech(dv: _DauVao, gio_mua_he: bool) -> str | None:
    """Vì sao đồng hồ nơi sinh lệch giờ lịch: múi giờ lịch sử trong nước (vd miền Nam 1960–1975 UTC+8), giờ mùa
    hè ở nước ngoài (đã trừ 1 giờ), hay sinh ở nước ngoài (lập theo giờ địa phương, không lệch). None = không lệch."""
    if dv.nuoc_ngoai:
        return "gio_mua_he" if gio_mua_he else "nuoc_ngoai"
    off = dv.tb.clock_offset
    return "mui_gio_lich_su" if off is not None and off != config.CALENDAR_MERIDIAN_TZ else None


def _ung_vien(inp: DinhGioInput, dv: _DauVao) -> list[dict]:
    ls_ = inp.la_so
    gio, phut = int(ls_.birth_time[:2]), int(ls_.birth_time[3:])
    ngay_nhap = dv.duong_goc                                    # ngày dương theo ĐỒNG HỒ người dùng nhập
    dong_ho = _dt.datetime(ngay_nhap.year, ngay_nhap.month, ngay_nhap.day, gio, phut)
    cal = dv.tb.calendar_dt
    ti_nhap = tuvi_an_sao.time_index(cal.hour, cal.minute)
    lech = dong_ho - cal                                        # đồng hồ − kinh tuyến lịch (múi giờ, giờ mùa hè)
    lech_phut = round(lech.total_seconds() / 60)
    if inp.tat_ca_gio:
        # 12 canh của NGÀY ĐÃ NHẬP theo đồng hồ (lá số vẫn an theo giờ lịch): Tý = giữa Tý sớm 00:30, canh khác =
        # giữa canh (giờ lịch), đổi ra đồng hồ. Canh trùng giờ đã nhập dùng đúng giờ nhập.
        goc = _dt.datetime.combine(ngay_nhap, _dt.time())
        ds = [(f"Giờ {lunar.CHI[i]}", goc + (_dt.timedelta(minutes=30) if i == 0 else _dt.timedelta(hours=2 * i))
               + lech, None) for i in range(12)]
        if cal.date() == ngay_nhap and ti_nhap < 12:
            ds[ti_nhap] = (ds[ti_nhap][0], dong_ho, None)
        elif ti_nhap == 12 and gio == 23:
            # Nhập 23:xx đồng hồ và đúng là Tý muộn theo giờ lịch → thêm ứng viên thứ 13.
            ds.append((tuvi_dinh_gio.nhan_ty_muon(lech_phut), dong_ho, _ghi_chu_ty_muon(lech_phut)))
        elif ti_nhap == 12 and cal.date() == ngay_nhap - _dt.timedelta(days=1):
            # Đồng hồ sớm hơn giờ lịch (vd 00:30 UTC+8 = 23:30 hôm trước): Tý muộn hôm trước = Tý của ngày đã nhập.
            ds[0] = (tuvi_dinh_gio.nhan_ty_muon(lech_phut), dong_ho, _ghi_chu_ty_muon_hom_truoc(dong_ho, cal, lech_phut))
        else:
            # Hiếm (đồng hồ lệch ≥ 2 giờ): giờ nhập thuộc canh của ngày hôm trước theo giờ lịch → thêm riêng.
            ds.insert(0, (f"Giờ {lunar.CHI[ti_nhap % 12]} (giờ lịch ngày hôm trước)", dong_ho,
                          f"Giờ bạn nhập theo giờ lịch là {cal.strftime('%H:%M ngày %d/%m/%Y')}."))
    else:
        ds = [("Giờ trước", dong_ho - _dt.timedelta(hours=2), None), ("Giờ đã nhập", dong_ho, None),
              ("Giờ sau", dong_ho + _dt.timedelta(hours=2), None)]
    ra = []
    for nhan, t, ghi_chu in ds:
        dau_vao = {"birth_date": t.date().isoformat(), "birth_time": t.strftime("%H:%M"), "calendar_type": "duong"}
        dv_u = _DauVao(ls_.model_copy(update={**dau_vao, "birth_date": t.date(), "am_nhuan": False}))
        u = {"nhan": nhan, "gio_dai_dien": dau_vao["birth_time"], "la_gio_nhap": t == dong_ho,
             "sinh": _sinh(dv_u, ls_.gender), "dau_vao": dau_vao, "ngay_duong": dau_vao["birth_date"],
             "lech_phut": round((t - dv_u.tb.calendar_dt).total_seconds() / 60)}
        if ghi_chu:
            u["ghi_chu"] = ghi_chu
        ra.append(u)
    return ra


@router.post("/dinh-gio")
def api_dinh_gio(inp: DinhGioInput) -> dict:
    nam = sorted(set(inp.nam_doi_chieu)) if inp.nam_doi_chieu else tuvi_dinh_gio.nam_mac_dinh(_hom_nay())
    if any(not 1900 <= n <= 2100 for n in nam):
        raise HTTPException(422, detail="Năm đối chiếu phải trong 1900–2100")
    dv = _DauVao(inp.la_so)
    cal = dv.tb.calendar_dt
    ly_do = tuvi_dinh_gio.ly_do(cal.hour, cal.minute, inp.la_so.do_tin_gio.value)
    try:
        kq = tuvi_dinh_gio.lap(_ung_vien(inp, dv), nam, ly_do)
        kq["ly_do_lech"] = ly_do_lech(dv, inp.la_so.gio_mua_he)
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    return {"engine_version": ENGINE_VERSION, **kq, "co_canh_bao": list(dv.flags)}
