# -*- coding: utf-8 -*-
"""SPEC-004a — endpoint tuần/triệt + can chi (chưa phải lá số an sao đầy đủ).

Đường đi: giờ đồng hồ → timebase (múi giờ lịch sử) → lịch âm (HND, UTC+7)
→ can chi năm → tuan_triet_vendor.phan_tich (bản sao nguyên văn engine của
người dùng — KHÔNG viết lại logic).

Phạm vi output khai báo rõ: /tuan-triet → pham_vi = "tuan_triet_only";
/an-sao (SPEC-005, iztro cục bộ) → pham_vi = "an_sao_day_du".
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app import config
from app.calc import can_chi, dia_ly, lunar, timebase, tuan_triet_vendor, tuvi_an_sao
from app.hoidap import tuvi as hoidap_tv
from app import nhat_ky
from app.config import ENGINE_VERSION, HourConfidence, Region

router = APIRouter(prefix="/v1/tuvi", tags=["tuvi"])

_NGAY_THONG_NHAT_MUI_GIO = _dt.date(1975, 6, 13)
_TET_EDGE_DAYS = 2
_CHI = ("Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi")   # sinh cách mùng 1 Tết ≤ 2 ngày → gắn cờ nhạy cảm


class TuanTrietInput(BaseModel):
    birth_date: _dt.date
    birth_time: str = Field(pattern=r"^\d{2}:\d{2}$", examples=["23:30"])
    gender: Literal["nam", "nu"]
    calendar_type: Literal["duong", "am"] = "duong"
    am_nhuan: bool = False                       # chỉ dùng khi calendar_type=am
    vung: Region | None = None                   # bắt buộc nếu sinh trước 13/06/1975 và không khai noi_sinh
    noi_sinh: str | None = Field(default=None, max_length=40,
                                 description="Mã tỉnh (GET /v1/dia-ly/tinh) hoặc 'nuoc_ngoai'")
    gio_mua_he: bool = False                     # chỉ khi sinh ở nước ngoài: giờ đồng hồ đang là giờ mùa hè
    truong_phai: Literal["npl", "vvt"] | None = None
    che_do: Literal["hep", "tam_hop", "tptc"] | None = None
    do_tin_gio: HourConfidence = HourConfidence.EXACT


class _DauVao:
    """Kết quả chuẩn bị đầu vào dùng chung cho /tuan-triet và /an-sao."""

    def __init__(self, inp: TuanTrietInput):
        gio, phut = int(inp.birth_time[:2]), int(inp.birth_time[3:])
        if gio > 23 or phut > 59:
            raise HTTPException(422, detail="Giờ sinh không hợp lệ")

        # ---- 0. Nơi sinh → vùng múi giờ / nước ngoài ------------------------
        nuoc_ngoai = inp.noi_sinh == dia_ly.NUOC_NGOAI or inp.vung is Region.ABROAD
        tinh = None
        if inp.noi_sinh and not nuoc_ngoai:
            tinh = dia_ly.tra(inp.noi_sinh)
            if tinh is None:
                raise HTTPException(422, detail="Nơi sinh không có trong danh sách tỉnh/thành")
        if inp.gio_mua_he and not nuoc_ngoai:
            raise HTTPException(422, detail="Giờ mùa hè chỉ áp dụng khi sinh ở nước ngoài")
        vung_khai = None if nuoc_ngoai else inp.vung
        if tinh and tinh["vung"]:
            if vung_khai and vung_khai.value != tinh["vung"]:
                raise HTTPException(422, detail="Vùng khai báo mâu thuẫn với nơi sinh")
            vung_khai = Region(tinh["vung"])

        # ---- 1. Âm lịch đầu vào? Đổi về dương trước đã --------------------
        # Miền Nam 1960 → 13/06/1975 dùng lịch âm tính theo UTC+8 (Tết Mậu Thân
        # 30/01/1968, miền Bắc 29/01) — ngày âm ghi trong giấy tờ thời đó theo lịch ấy.
        duong_goc = inp.birth_date
        self.lich_mien_nam = False
        if inp.calendar_type == "am":
            def _doi(tz: float) -> _dt.date:
                try:
                    d, m, y = lunar.lunar_to_solar(
                        inp.birth_date.day, inp.birth_date.month, inp.birth_date.year,
                        1 if inp.am_nhuan else 0, tz,
                    )
                except ValueError as e:
                    raise HTTPException(422, detail=str(e))
                return _dt.date(y, m, d)
            duong_goc = _doi(config.CALENDAR_MERIDIAN_TZ)
            if vung_khai is Region.SOUTH:
                tz_nam, _ = config.clock_offset(duong_goc, Region.SOUTH)
                if tz_nam != config.CALENDAR_MERIDIAN_TZ:
                    duong_goc, self.lich_mien_nam = _doi(tz_nam), True

        # ---- 2. Múi giờ lịch sử (hoặc giờ địa phương nếu sinh ở nước ngoài) -
        clock_dt = _dt.datetime(duong_goc.year, duong_goc.month, duong_goc.day, gio, phut)
        if nuoc_ngoai:
            # config.ABROAD_LOCAL_TIME: giữ giờ địa phương, chỉ bỏ giờ mùa hè.
            if inp.gio_mua_he:
                clock_dt -= _dt.timedelta(hours=1)
            tb = timebase.CalendarTime(calendar_dt=clock_dt, clock_offset=None, tz_disputed=False)
        else:
            if duong_goc < _NGAY_THONG_NHAT_MUI_GIO and vung_khai is None:
                raise HTTPException(422, detail=(
                    "Sinh trước 13/06/1975: bắt buộc khai 'vung' (north/south theo NƠI "
                    "SINH) vì hai miền dùng múi giờ khác nhau — kết quả có thể lệch cả "
                    "ngày can chi."))
            vung = vung_khai or Region.NORTH   # sau 1975 hai vùng cùng UTC+7, chọn gì cũng vậy
            tb = timebase.to_calendar_time(clock_dt, vung)
        ngay_kinh_tuyen = tb.calendar_dt.date()
        self.nuoc_ngoai, self.tinh = nuoc_ngoai, tinh

        # ---- 2. Lịch âm + can chi năm ------------------------------------
        ld, lm, ly, leap = lunar.solar_to_lunar(
            ngay_kinh_tuyen.day, ngay_kinh_tuyen.month, ngay_kinh_tuyen.year,
            config.CALENDAR_MERIDIAN_TZ,
        )
        self.duong_goc, self.tb, self.ngay_kinh_tuyen = duong_goc, tb, ngay_kinh_tuyen
        self.am = (ld, lm, ly, leap)
        self.can, self.chi = lunar.can_chi_nam(ly)
        self.flags = self._co(inp)

    def _co(self, inp: TuanTrietInput) -> list[dict]:
        tb, ngay_kinh_tuyen, ly = self.tb, self.ngay_kinh_tuyen, self.am[2]
        # ---- Cờ cảnh báo — phơi ra hết, không giấu -----------------------
        flags: list[dict] = []
        if self.nuoc_ngoai:
            flags.append({"loai": "sinh_nuoc_ngoai", "chi_tiet": (
                "Sinh ở nước ngoài: lá số lập theo giờ địa phương nơi sinh, không quy "
                "đổi về giờ Việt Nam.")})
            if inp.gio_mua_he:
                flags.append({"loai": "gio_mua_he", "chi_tiet": (
                    f"Đã trừ 1 giờ mùa hè: giờ chuẩn địa phương {tb.calendar_dt.strftime('%H:%M')}.")})
        if self.lich_mien_nam:
            flags.append({"loai": "lich_am_mien_nam", "chi_tiet": (
                "Ngày âm đổi theo lịch miền Nam thời 1960–1975 (tính theo UTC+8): "
                f"ứng với dương lịch {self.duong_goc.strftime('%d/%m/%Y')}.")})
        if self.tinh:
            mt = timebase.gio_mat_troi_thuc(tb.calendar_dt, self.tinh["kinh_do"])
            if timebase.chi_gio(mt) != timebase.chi_gio(tb.calendar_dt):
                flags.append({"loai": "gio_mat_troi", "chi_tiet": (
                    f"Theo giờ mặt trời thực ở {self.tinh['ten']} ({mt.strftime('%H:%M')}), bạn "
                    f"thuộc giờ {_CHI[timebase.chi_gio(mt)]} thay vì giờ "
                    f"{_CHI[timebase.chi_gio(tb.calendar_dt)]}. Lá số vẫn lập theo giờ đồng hồ "
                    "như phần lớn sách Việt; nếu thấy không khớp, hãy xem thêm lá số giờ kia.")})
        if tb.clock_offset is not None and tb.clock_offset != config.CALENDAR_MERIDIAN_TZ:
            flags.append({"loai": "tz_adjusted", "chi_tiet": (
                f"Đồng hồ nơi sinh chạy UTC+{tb.clock_offset:g}; đã quy đổi về kinh "
                f"tuyến lịch UTC+7: {tb.calendar_dt.strftime('%H:%M ngày %d/%m/%Y')}.")})
        if tb.tz_disputed:
            flags.append({"loai": "tz_disputed", "chi_tiet": (
                "Ngày sinh nằm trong giai đoạn nguồn sử liệu về múi giờ mâu thuẫn — "
                "cần đối chiếu cả hai giả thiết.")})
        if timebase.sat_bien_gio_ty(tb.calendar_dt):
            flags.append({"loai": "ty_edge", "chi_tiet": (
                "Giờ sinh sát ranh giới giờ Tý (23:00–00:59) — trụ ngày nhạy với "
                "sai số vài phút và với quy ước ranh giới chưa chốt.")})
        if inp.do_tin_gio is not HourConfidence.EXACT:
            flags.append({"loai": "hour_confidence",
                          "chi_tiet": f"Độ tin giờ sinh: {inp.do_tin_gio.value}."})

        # Sát Tết: cách mùng 1 âm ≤ 2 ngày (về cả hai phía) → năm can chi nhạy cảm
        try:
            d1, m1, y1 = lunar.lunar_to_solar(1, 1, ly, 0, config.CALENDAR_MERIDIAN_TZ)
            tet_nam_nay = _dt.date(y1, m1, d1)
            d2, m2, y2 = lunar.lunar_to_solar(1, 1, ly + 1, 0, config.CALENDAR_MERIDIAN_TZ)
            tet_nam_sau = _dt.date(y2, m2, d2)
            khoang = min(abs((ngay_kinh_tuyen - tet_nam_nay).days),
                         abs((tet_nam_sau - ngay_kinh_tuyen).days))
            if khoang <= _TET_EDGE_DAYS:
                flags.append({"loai": "tet_edge", "chi_tiet": (
                    f"Sinh cách mùng 1 Tết {khoang} ngày — năm can chi đổi ngay tại "
                    "ranh giới này. Sai ngày sinh một ngày là sai cả lá số.")})
        except ValueError:
            pass
        return flags


@router.post("/tuan-triet")
def api_tuan_triet(inp: TuanTrietInput) -> dict:
    dv = _DauVao(inp)
    ld, lm, ly, leap = dv.am
    can, chi = dv.can, dv.chi

    # ---- 3. Tuần/Triệt qua engine gốc (vendor nguyên văn) -----------------
    che_do = inp.che_do or (
        tuan_triet_vendor.PHAI[inp.truong_phai]["che_do"] if inp.truong_phai else "hep"
    )
    tt = tuan_triet_vendor.phan_tich(can, chi, che_do, inp.truong_phai)

    ngay_cc: str | None = None
    if config.TY_BOUNDARY_POLICY is not None:
        ngay_cc = timebase.ngay_can_chi(dv.tb.calendar_dt).isoformat()

    return {
        "engine_version": ENGINE_VERSION,
        "pham_vi": "tuan_triet_only",
        "duong_lich_goc": dv.duong_goc.isoformat(),
        "duong_lich_kinh_tuyen": dv.ngay_kinh_tuyen.isoformat(),
        "mui_gio_dong_ho": dv.tb.clock_offset,
        "am_lich": {"ngay": ld, "thang": lm, "nam": ly, "nhuan": leap},
        "can_chi_nam": {"can": can, "chi": chi},
        "gioi_tinh": inp.gender,
        "ngay_can_chi": ngay_cc,
        "ty_boundary_policy": (config.TY_BOUNDARY_POLICY.value
                               if config.TY_BOUNDARY_POLICY else None),
        "tuan_triet": tt,
        "co_canh_bao": dv.flags,
    }


def _sao(s: dict) -> dict:
    return {"ten": s["name"], "do_sang": s["brightness"] or None, "tu_hoa": s["mutagen"] or None}


def _phu(s: dict) -> dict:
    # loai = phân nhóm của iztro: soft (cát), tough (sát), lucun, tianma, flower, helper, adjective
    return {**_sao(s), "loai": s["type"]}


def _bo_sung(dv: "_DauVao", la: dict, gioi_tinh: str) -> dict:
    """VZ-1: thông tin phần giữa lá số + Tuần/Triệt Nam phái (đóng giữa hai cung)."""
    na = can_chi.nap_am(dv.can, dv.chi)
    i = tuan_triet_vendor.chi_so_hoa_giap(dv.can, dv.chi)
    tuan, triet = tuan_triet_vendor.TUAN[i // 10], tuan_triet_vendor.TRIET[i % 10]
    nam = "Dương" if can_chi.la_duong_can(dv.can) else "Âm"
    return {
        "menh_nap_am": na,
        "am_duong": {"nam_sinh": nam, "nhan": f"{nam} {'Nam' if gioi_tinh == 'nam' else 'Nữ'}",
                     "ly": can_chi.am_duong_ly(dv.can, la["earthlyBranchOfSoulPalace"])},
        "menh_cuc": can_chi.menh_cuc(na["hanh"], can_chi.hanh_cuc(la["fiveElementsClass"])),
        "tuan_triet": {"tuan": [tuan_triet_vendor.CHI[c] for c in tuan],
                       "triet": [tuan_triet_vendor.CHI[c] for c in triet]},
    }


@router.post("/an-sao")
def api_an_sao(inp: TuanTrietInput) -> dict:
    """SPEC-005 — lá số an sao đầy đủ qua iztro chạy cục bộ (Tử Vi Đẩu Số).

    Cùng đường tiền xử lý với /tuan-triet (âm→dương, múi giờ lịch sử, cờ). Giờ Tý
    tử vi THEO IZTRO (23:00 sang ngày mới, quyết định 2026-08-15) — người sinh
    23:00–23:59 luôn bị gắn cờ `ty_conflict` vì thần số/bát tự dùng quy ước khác.
    """
    dv = _DauVao(inp)
    cal = dv.tb.calendar_dt
    ti = tuvi_an_sao.time_index(cal.hour, cal.minute)
    try:
        la = tuvi_an_sao.an_sao_tho(cal.date(), ti, inp.gender, "vi-VN")
    except tuvi_an_sao.AnSaoLoi as e:
        raise HTTPException(503, detail=f"Engine an sao chưa sẵn sàng: {e}")

    flags = list(dv.flags)
    if ti == 12:
        flags.append({"loai": "ty_conflict", "chi_tiet": (
            "Sinh 23:00–23:59: tử vi (theo iztro) tính là giờ Tý của NGÀY HÔM SAU, "
            "còn thần số học/bát tự ở đây tính vẫn là ngày hôm đó. Hai phần có thể "
            "lệch ngày — đây là quy ước, không phải lỗi.")})
    flags.append({"loai": "nam_phai", "chi_tiet": (
        "An sao theo iztro (Tử Vi Đẩu Số). Chính tinh, tứ hoá khớp aov.cc; bộ phụ "
        "tinh Nam phái (Việt) chưa được đối chiếu đầy đủ. Tuần/Triệt theo lối Việt (đóng giữa "
        "hai cung) ở khoá tuan_triet.")})

    ld, lm, ly, leap = dv.am
    return {
        "engine_version": ENGINE_VERSION,
        "pham_vi": "an_sao_day_du",
        "iztro": la["iztro"],
        "duong_lich_goc": dv.duong_goc.isoformat(),
        "duong_lich_kinh_tuyen": dv.ngay_kinh_tuyen.isoformat(),
        "mui_gio_dong_ho": dv.tb.clock_offset,
        "gio_chi_so": ti,
        "gio": la["time"],
        "khoang_gio": la["timeRange"],
        "am_lich": {"ngay": ld, "thang": lm, "nam": ly, "nhuan": leap},
        "am_lich_iztro": la["lunarDate"],
        "tu_tru": la["chineseDate"],
        "can_chi_nam": {"can": dv.can, "chi": dv.chi},
        "gioi_tinh": inp.gender,
        "ngu_hanh_cuc": la["fiveElementsClass"],
        "menh_chu": la["soul"],
        "than_chu": la["body"],
        "chi_cung_menh": la["earthlyBranchOfSoulPalace"],
        "chi_cung_than": la["earthlyBranchOfBodyPalace"],
        **_bo_sung(dv, la, inp.gender),
        "cung": [{
            "ten": p["name"], "can": p["heavenlyStem"], "chi": p["earthlyBranch"],
            # isOriginalPalace của iztro là Lai nhân cung (來因宮), KHÔNG phải cung Mệnh.
            "la_menh": p["name"] == "Mệnh", "la_than": p["isBodyPalace"],
            "la_lai_nhan": p["isOriginalPalace"],
            "chinh_tinh": [_sao(x) for x in p["majorStars"]],
            "phu_tinh": [_phu(x) for x in p["minorStars"]],
            "tap_dieu": [x["name"] for x in p["adjectiveStars"]],
            "truong_sinh": p["changsheng12"], "bac_si": p["boshi12"],
            "tuong_tien": p["jiangqian12"], "tue_tien": p["suiqian12"],
            "dai_han": {"tu_tuoi": p["decadal"]["range"][0], "den_tuoi": p["decadal"]["range"][1]},
            "tieu_han_tuoi": p["ages"],
        } for p in la["palaces"]],
        "co_canh_bao": flags,
    }


class VanHanInput(BaseModel):
    """VZ-1 — lớp vận hạn phủ lên lá số: đại hạn + lưu niên (tên cung lưu, sao lưu, tứ hoá) + tiểu hạn."""
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    nam_xem: int | None = Field(default=None, ge=1900, le=2100,
                                description="Năm xem (lấy giữa năm 1/7 để chắc nằm trong năm âm đó)")
    ngay_xem: _dt.date | None = None


@router.post("/van-han")
def api_van_han(inp: VanHanInput) -> dict:
    dv = _DauVao(inp.la_so)
    cal = dv.tb.calendar_dt
    ti = tuvi_an_sao.time_index(cal.hour, cal.minute)
    if inp.ngay_xem:
        ngay = inp.ngay_xem
    elif inp.nam_xem:
        ngay = _dt.date(inp.nam_xem, 7, 1)
    else:
        ngay = _dt.datetime.now(_dt.timezone(_dt.timedelta(hours=7))).date()
    try:
        vh = tuvi_an_sao.van_han(cal.date(), ti, inp.la_so.gender, ngay, chi_tiet=True)
    except tuvi_an_sao.AnSaoLoi as e:
        raise HTTPException(503, detail=f"Engine an sao chưa sẵn sàng: {e}")
    can, chi = lunar.can_chi_nam(lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, 7.0)[2])
    return {"engine_version": ENGINE_VERSION, "ngay_xem": ngay.isoformat(), "nam_xem": ngay.year,
            "can_chi_nam_xem": f"{can} {chi}", **vh}


class HoiTVInput(BaseModel):
    """Hỏi đáp Tử vi (HH-2). `la_so` tuỳ chọn: câu hỏi chung (sao × cung, thuật ngữ) không cần."""
    model_config = ConfigDict(extra="forbid")

    cau_hoi: str = Field(min_length=3, max_length=500)
    che_do: Literal["tham_khao", "chi_tiet"] = "tham_khao"
    la_so: TuanTrietInput | None = None
    ngay_xem: _dt.date | None = Field(default=None, description="Ngày xem hạn; mặc định hôm nay (giờ VN)")


@router.post("/hoi")
def api_hoi(inp: HoiTVInput, background: BackgroundTasks) -> dict:
    """Phân loại → (lá số + vận hạn qua iztro) → gói bằng chứng KB → trả lời template."""
    sinh, flags = None, []
    if inp.la_so is not None:
        dv = _DauVao(inp.la_so)
        cal = dv.tb.calendar_dt
        ti = tuvi_an_sao.time_index(cal.hour, cal.minute)
        sinh = {"ngay": cal.date(), "ti": ti, "gioi_tinh": inp.la_so.gender}
        flags = list(dv.flags)
        if ti == 12:
            flags.append({"loai": "ty_conflict", "chi_tiet": (
                "Sinh 23:00–23:59: tử vi (theo iztro) tính là giờ Tý của NGÀY HÔM SAU — "
                "lá số có thể khác trang dùng quy ước khác.")})
    try:
        kq = hoidap_tv.tra_loi(inp.cau_hoi.strip(), inp.che_do, sinh=sinh, ngay_xem=inp.ngay_xem)
    except tuvi_an_sao.AnSaoLoi as e:
        raise HTTPException(503, detail=f"Engine an sao chưa sẵn sàng: {e}")
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    kq["co_canh_bao"] = flags + kq["co_canh_bao"]
    background.add_task(nhat_ky.ghi_huyenhoc, "tuvi", inp.cau_hoi, kq, inp.la_so is not None)
    return {"engine_version": ENGINE_VERSION, **kq}
