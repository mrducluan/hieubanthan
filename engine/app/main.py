# -*- coding: utf-8 -*-
"""FastAPI — lớp vỏ mỏng của tầng CALC.

Chỉ làm ba việc: kiểm tra đầu vào, gọi hàm thuần, trả JSON kèm phiên bản.
Không DB, không LLM, không trạng thái. Nghiệp vụ nằm hết trong app/calc/.

Mọi response đều mang `engine_version` — bắt buộc để tái lập kết quả về sau.
"""
from __future__ import annotations

import datetime as _dt
import os
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from app import config, giam_sat
from app.calc import thanso, timebase
from app.kb import store as kb_store
from app.kb import trang as kb_trang
from app.config import ENGINE_VERSION, HourConfidence, Region
from app.luangiai import thanso as luangiai_thanso
from app.luangiai.hop_doi import luan_hop_doi, luan_hop_doi_tu_chi_so
from app import nhat_ky
from app.narrative import hoi_van, llm as narrative_llm
from app.battu_api import router as battu_router
from app.kinhdich_api import router as kinhdich_router
from app.lich_api import router as lich_router
from app.phongthuy_api import router as phongthuy_router
from app.tuvi_api import router as tuvi_router

giam_sat.khoi_tao()   # Sentry — chỉ bật khi có SENTRY_DSN, không gửi dữ liệu cá nhân

app = FastAPI(
    title="HieuBanThan Engine",
    version=ENGINE_VERSION,
    description="Tầng CALC — tính toán tất định, không LLM.",
)


# --------------------------------------------------------------------------- #
# Xác thực service-to-service: chỉ web (biết khoá) mới gọi được engine.
# TẮT HOÀN TOÀN khi ENGINE_API_KEY không set → dev local và test không đổi.
# Khi deploy: đặt cùng một khoá bí mật ở engine (env) và ở web (env), engine
# công khai trên internet nhưng chỉ trả lời request mang đúng khoá.
# /health được miễn để host kiểm tra sống.
# --------------------------------------------------------------------------- #
@app.middleware("http")
async def require_engine_key(request: Request, call_next):
    expected = os.environ.get("ENGINE_API_KEY")
    if expected and request.url.path != "/health":
        if request.headers.get("x-engine-key") != expected:
            return JSONResponse(
                {"detail": "Thiếu hoặc sai X-Engine-Key"}, status_code=401
            )
    return await call_next(request)


app.include_router(tuvi_router)
app.include_router(kinhdich_router)
app.include_router(battu_router)
app.include_router(phongthuy_router)
app.include_router(lich_router)


# --------------------------------------------------------------------------- #
# Sức khoẻ + cấu hình
# --------------------------------------------------------------------------- #
@app.get("/health")
def health() -> dict:
    """Báo sống, kèm trạng thái chính sách. `ty_boundary_set=False` nghĩa là
    engine chưa sẵn sàng phục vụ các phép cần can chi (tử vi, bát tự)."""
    return {
        "ok": True,
        "engine_version": ENGINE_VERSION,
        "ty_boundary_set": config.TY_BOUNDARY_POLICY is not None,
    }


@app.get("/v1/kb/trang")
def api_kb_trang() -> dict:
    """Mục lục trang kiến thức công khai (SEO-B) — chỉ trang `index=True` được đưa vào sitemap."""
    return {"engine_version": ENGINE_VERSION, "trang": kb_trang.danh_sach()}


@app.get("/v1/kb/trang/{loai}/{slug}")
def api_kb_trang_mot(loai: str, slug: str) -> dict:
    t = kb_trang.lay(loai, slug) if loai in kb_trang.LOAI else None
    if t is None:
        raise HTTPException(status_code=404, detail="Không có trang này")
    return t


@app.get("/v1/kb/status")
def kb_status() -> dict:
    """Chẩn đoán tầng KB: đang đọc từ Supabase hay file, có lỗi gì không."""
    return {"engine_version": ENGINE_VERSION, **kb_store.chan_doan()}


# --------------------------------------------------------------------------- #
# Thần số học
# --------------------------------------------------------------------------- #
class ThanSoInput(BaseModel):
    ho_ten: list[str] = Field(min_length=1, max_length=5,
                              description="Các biến thể tên: khai sinh, thường gọi…")
    ngay: int = Field(ge=1, le=31)
    thang: int = Field(ge=1, le=12)
    nam: int = Field(ge=1900, le=2100)

    @field_validator("ho_ten")
    @classmethod
    def ten_khong_rong(cls, v: list[str]) -> list[str]:
        cleaned = [t.strip() for t in v if t.strip()]
        if not cleaned:
            raise ValueError("Cần ít nhất một tên không rỗng")
        return cleaned

    def kiem_tra_ngay(self) -> None:
        try:
            _dt.date(self.nam, self.thang, self.ngay)
        except ValueError:
            raise HTTPException(422, detail=f"Ngày không tồn tại: "
                                            f"{self.ngay:02d}/{self.thang:02d}/{self.nam}")


@app.post("/v1/thanso/do-nhay")
def api_do_nhay(inp: ThanSoInput) -> dict:
    """Khoảng kết quả theo mọi quy ước hợp lý — bước G1 phía client dựa vào đây
    để bắt người dùng chốt quy ước trước khi xem luận chi tiết."""
    inp.kiem_tra_ngay()
    dn = thanso.do_nhay(inp.ho_ten, inp.ngay, inp.thang, inp.nam)
    canh_bao = [
        f"Chỉ số '{k}' KHÔNG xác định: ra {len(v)} giá trị khác nhau ({v}) "
        f"tuỳ quy ước phiên âm / cộng gộp. Phải chốt quy ước rồi mới luận."
        for k, v in dn.items() if len(v) > 1
    ] or ["Mọi quy ước cho cùng kết quả — trường hợp ổn định, hiếm."]
    return {
        "engine_version": ENGINE_VERSION,
        "ten_bien_the_da_quet": inp.ho_ten,
        "ngay_sinh": f"{inp.ngay:02d}/{inp.thang:02d}/{inp.nam}",
        "khoang_ket_qua_co_the": dn,
        "so_ket_qua_khac_nhau": {k: len(v) for k, v in dn.items()},
        "canh_bao": canh_bao,
    }


@app.post("/v1/thanso/luan-giai")
def api_luan_giai(inp: ThanSoInput) -> dict:
    """Luận giải thần số đầy đủ — con số + nghĩa CÓ NGUỒN + mặt tối + phản chứng.

    Đây là tầng KB+RULES+NARRATIVE: chỉ ghép nội dung từ kho quy tắc, tôn trọng
    độ nhạy (chỉ số chưa xác định thì nói thẳng, không luận bừa).
    """
    inp.kiem_tra_ngay()
    return luangiai_thanso.luan_giai(inp.ho_ten, inp.ngay, inp.thang, inp.nam)


@app.post("/v1/thanso/van")
def api_luan_giai_van(inp: ThanSoInput) -> dict:
    """Bản luận CHI TIẾT — văn xuôi qua LLM (nếu có key), ngược lại template.

    Dành cho gói xem sâu. LLM chỉ diễn đạt lại bản luận có cấu trúc, cấm thêm
    dữ kiện (xem app/narrative/llm.py). Lỗi LLM tự rơi về template, không sập.
    """
    inp.kiem_tra_ngay()
    reading = luangiai_thanso.luan_giai(inp.ho_ten, inp.ngay, inp.thang, inp.nam)
    return narrative_llm.dien_dat(reading)


class NguoiKia(BaseModel):
    """Người thứ hai (người yêu, con, sếp…). Tên không bắt buộc."""
    ho_ten: list[str] | None = Field(default=None, max_length=5)
    ngay: int = Field(ge=1, le=31)
    thang: int = Field(ge=1, le=12)
    nam: int = Field(ge=1900, le=2100)


class HoiInput(ThanSoInput):
    cau_hoi: str = Field(min_length=3, max_length=400)
    nguoi_kia: NguoiKia | None = None
    ngay_xem: _dt.date | None = Field(default=None, description="Mặc định: hôm nay")


@app.post("/v1/thanso/hoi")
def api_hoi(inp: HoiInput, background: BackgroundTasks) -> dict:
    """Q&A v2 — phân loại câu hỏi (RULES) → gói bằng chứng từ KB → diễn đạt.

    Chạy được KHÔNG cần LLM (template). Có key OpenRouter thì LLM chỉ diễn đạt
    lại gói bằng chứng, qua bộ kiểm tra; vi phạm → rơi về template.
    Xem docs/KIEN-TRUC-THANSO-V2.md.
    """
    inp.kiem_tra_ngay()
    kia = None
    if inp.nguoi_kia:
        try:
            _dt.date(inp.nguoi_kia.nam, inp.nguoi_kia.thang, inp.nguoi_kia.ngay)
        except ValueError:
            raise HTTPException(422, detail="Ngày sinh người thứ hai không tồn tại")
        kia = inp.nguoi_kia.model_dump()
    nguoi = {"ho_ten": inp.ho_ten, "ngay": inp.ngay, "thang": inp.thang, "nam": inp.nam}
    kq = hoi_van.tra_loi(inp.cau_hoi.strip(), nguoi, kia, inp.ngay_xem)
    background.add_task(nhat_ky.ghi, inp.cau_hoi, kq)
    return {"engine_version": ENGINE_VERSION, **kq}


class HopDoiInput(BaseModel):
    """Hai người — tên không bắt buộc (không có tên → chỉ so đường đời)."""
    a: NguoiKia
    b: NguoiKia


@app.post("/v1/thanso/hop-doi")
def api_hop_doi(inp: HopDoiInput) -> dict:
    """Hợp đôi có cấu trúc: cặp số theo vị trí + điểm hoà / điểm va / việc cùng làm. Không chấm điểm."""
    for n in (inp.a, inp.b):
        try:
            _dt.date(n.nam, n.thang, n.ngay)
        except ValueError:
            raise HTTPException(422, detail="Ngày sinh không tồn tại")
    return luan_hop_doi(inp.a.model_dump(), inp.b.model_dump())


SoHopLe = Literal[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]


class BoSo(BaseModel):
    duong_doi: SoHopLe
    su_menh: SoHopLe | None = None
    linh_hon: SoHopLe | None = None
    nhan_cach: SoHopLe | None = None


class CapSoInput(BaseModel):
    a: BoSo
    b: BoSo


@app.post("/v1/thanso/cap-so")
def api_cap_so(inp: CapSoInput) -> dict:
    """Hợp đôi từ các con số đã tính (lời mời chỉ mang số, không mang ngày sinh người mời)."""
    return luan_hop_doi_tu_chi_so(inp.a.model_dump(exclude_none=True), inp.b.model_dump(exclude_none=True))


class ChuKyInput(BaseModel):
    ngay: int = Field(ge=1, le=31)
    thang: int = Field(ge=1, le=12)
    nam: int = Field(ge=1900, le=2100)
    tu_nam: int = Field(ge=1900, le=2100)
    den_nam: int = Field(ge=1900, le=2100)

    @field_validator("den_nam")
    @classmethod
    def khoang_hop_le(cls, v: int, info) -> int:
        tu = info.data.get("tu_nam")
        if tu is not None and (v < tu or v - tu > 30):
            raise ValueError("Khoảng năm không hợp lệ (tối đa 30 năm)")
        return v


@app.post("/v1/thanso/chu-ky")
def api_chu_ky(inp: ChuKyInput) -> dict:
    """Bảng năm cá nhân, đỉnh cao, thử thách — để đối chiếu hồi tố."""
    try:
        _dt.date(inp.nam, inp.thang, inp.ngay)
    except ValueError:
        raise HTTPException(422, detail="Ngày không tồn tại")
    dd = thanso.duong_doi(inp.ngay, inp.thang, inp.nam)
    return {
        "engine_version": ENGINE_VERSION,
        "ngay_sinh": f"{inp.ngay:02d}/{inp.thang:02d}/{inp.nam}",
        "duong_doi": dd,
        "dinh_cao": thanso.dinh_cao(inp.ngay, inp.thang, inp.nam, dd),
        "thu_thach": thanso.thu_thach(inp.ngay, inp.thang, inp.nam),
        "bang_nam_ca_nhan": thanso.chu_ky_9_nam(
            inp.ngay, inp.thang, inp.nam, inp.tu_nam, inp.den_nam
        ),
        "trung_chu_ky": thanso.so_nguoi_trung_chu_ky(),
        "canh_bao": [
            "Chu kỳ 9 năm là TIỀN ĐỊNH từ ngày+tháng sinh — nó không phải dự báo, "
            "mà là một mẫu hình lặp có thể ĐỐI CHIẾU HỒI TỐ với đời thực."
        ],
    }


# --------------------------------------------------------------------------- #
# Nền thời gian — dùng chung cho tử vi / bát tự về sau
# --------------------------------------------------------------------------- #
class TimebaseInput(BaseModel):
    ngay: int = Field(ge=1, le=31)
    thang: int = Field(ge=1, le=12)
    nam: int = Field(ge=1900, le=2100)
    gio: int = Field(ge=0, le=23)
    phut: int = Field(ge=0, le=59, default=0)
    vung: Region = Field(description="north | south — theo NƠI SINH")
    do_tin_gio: HourConfidence = HourConfidence.EXACT


@app.post("/v1/timebase/resolve")
def api_timebase(inp: TimebaseInput) -> dict:
    """Quy đổi giờ đồng hồ lúc sinh → giờ kinh tuyến lịch, kèm mọi cờ cảnh báo.

    Đây là hiện thân của cổng G0: mọi hiệu chỉnh phải được PHƠI RA cho người
    dùng xác nhận, không được âm thầm áp dụng.
    """
    try:
        clock_dt = _dt.datetime(inp.nam, inp.thang, inp.ngay, inp.gio, inp.phut)
    except ValueError:
        raise HTTPException(422, detail="Ngày giờ không tồn tại")

    kq = timebase.to_calendar_time(clock_dt, inp.vung)

    flags: list[dict] = []
    if kq.clock_offset != config.CALENDAR_MERIDIAN_TZ:
        flags.append({
            "loai": "tz_adjusted",
            "chi_tiet": f"Đồng hồ lúc sinh chạy UTC+{kq.clock_offset:g}; giờ theo "
                        f"kinh tuyến lịch (UTC+7) là "
                        f"{kq.calendar_dt.strftime('%H:%M ngày %d/%m/%Y')}.",
        })
    if kq.tz_disputed:
        flags.append({
            "loai": "tz_disputed",
            "chi_tiet": "Ngày sinh nằm trong giai đoạn các nguồn sử liệu về múi giờ "
                        "mâu thuẫn. Kết quả cần được đối chiếu cả hai giả thiết.",
        })
    if timebase.sat_bien_gio_ty(kq.calendar_dt):
        flags.append({
            "loai": "ty_edge",
            "chi_tiet": "Giờ sinh sát ranh giới giờ Tý (23:00–00:59) — trụ ngày "
                        "nhạy với sai số vài phút.",
        })
    if inp.do_tin_gio is not HourConfidence.EXACT:
        flags.append({
            "loai": "hour_confidence",
            "chi_tiet": f"Độ tin giờ sinh: {inp.do_tin_gio.value}. Nên đối chiếu "
                        "các canh giờ lân cận thay vì tin một lá số duy nhất.",
        })

    ngay_cc: str | None = None
    if config.TY_BOUNDARY_POLICY is not None:
        ngay_cc = timebase.ngay_can_chi(kq.calendar_dt).isoformat()

    return {
        "engine_version": ENGINE_VERSION,
        "dong_ho_luc_sinh": clock_dt.isoformat(),
        "mui_gio_dong_ho": kq.clock_offset,
        "gio_kinh_tuyen_lich": kq.calendar_dt.isoformat(),
        "ngay_can_chi": ngay_cc,
        "ty_boundary_policy": (config.TY_BOUNDARY_POLICY.value
                               if config.TY_BOUNDARY_POLICY else None),
        "co_canh_bao": flags,
    }
