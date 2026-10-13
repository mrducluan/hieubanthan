# -*- coding: utf-8 -*-
"""FastAPI — lớp vỏ mỏng của tầng CALC.

Chỉ làm ba việc: kiểm tra đầu vào, gọi hàm thuần, trả JSON kèm phiên bản.
Không DB, không LLM, không trạng thái. Nghiệp vụ nằm hết trong app/calc/.

Mọi response đều mang `engine_version` — bắt buộc để tái lập kết quả về sau.
"""
from __future__ import annotations

import datetime as _dt
import hmac
import os
from typing import Annotated, Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app import config, giam_sat, gioi_han
from app.cong_khai import PhanHoiCongKhai
from app.kb import tu_dien
from app.calc import thanso, timebase
from app.kb import store as kb_store
from app.kb import trang as kb_trang
from app.kb import tham_dinh as kb_tham_dinh
from app.config import ENGINE_VERSION, HourConfidence, Region
from app.luangiai import hom_nay
from app.luangiai import thanso_chaldean as luangiai_chaldea
from app.luangiai import thanso as luangiai_thanso
from app.luangiai.hop_doi import luan_hop_doi, luan_hop_doi_tu_chi_so
from app import nhat_ky
from app.narrative import hoi_van, llm as narrative_llm, ngan_sach
from app.battu_api import router as battu_router
from app.kinhdich_api import router as kinhdich_router
from app.lich_api import router as lich_router
from app.hoang_lich_api import router as hoang_lich_router
from app.phongthuy_api import router as phongthuy_router
from app.quan_tri_api import router as quan_tri_router
from app.tuvi_api import router as tuvi_router

giam_sat.khoi_tao()   # Sentry — chỉ bật khi có SENTRY_DSN, không gửi dữ liệu cá nhân

# SEC-1: trang tài liệu API (/docs, /redoc, /openapi.json) chỉ mở khi chạy máy — production (Render) tắt, không phô
# bản đồ endpoint cho người dò.
_TAI_LIEU = not os.environ.get("RENDER")
app = FastAPI(
    title="HieuBanThan Engine",
    version=ENGINE_VERSION,
    description="Tầng CALC — tính toán tất định, không LLM.",
    docs_url="/docs" if _TAI_LIEU else None,
    redoc_url="/redoc" if _TAI_LIEU else None,
    openapi_url="/openapi.json" if _TAI_LIEU else None,
    default_response_class=PhanHoiCongKhai,   # BM-1: lọc chữ nội bộ khỏi mọi JSON trả ra
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
        # SEC-1: so sánh hằng thời gian (không lộ khoá qua thời gian phản hồi).
        if not hmac.compare_digest(request.headers.get("x-engine-key", "").encode(), expected.encode()):
            return JSONResponse(
                {"detail": "Thiếu hoặc sai X-Engine-Key"}, status_code=401
            )
    # RL-1: web chuyển IP người dùng qua `x-nguoi-goi` → băm ngay (hạn mức lượt AI + hạn mức yêu cầu SEC-1).
    ai = ngan_sach.bam(request.headers.get("x-nguoi-goi"))
    if request.url.path.startswith("/v1/") and not gioi_han.xin(ai):
        return JSONResponse({"detail": "Bạn thao tác quá nhanh — vui lòng chờ một phút rồi thử lại."},
                            status_code=429, headers={"Retry-After": "60"})
    tok = ngan_sach.NGUOI_GOI.set(ai)
    try:
        return await call_next(request)
    finally:
        ngan_sach.NGUOI_GOI.reset(tok)


app.include_router(tuvi_router)
app.include_router(kinhdich_router)
app.include_router(battu_router)
app.include_router(phongthuy_router)
app.include_router(lich_router)
app.include_router(hoang_lich_router)
app.include_router(quan_tri_router)


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
        # SEC-1: production phải là True (engine chỉ trả lời web có khoá). False = ai cũng gọi thẳng được.
        "khoa_engine": bool(os.environ.get("ENGINE_API_KEY")),
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


@app.get("/v1/kb/chuyen-gia/{slug}")
def api_chuyen_gia(slug: str) -> dict:
    """EEAT-1 — số trang chuyên gia làm chủ biên / tác giả / đã thẩm định (cho trang /tac-gia/{slug})."""
    hs = kb_tham_dinh.ho_so(slug)
    if hs is None:
        raise HTTPException(status_code=404, detail="Không có chuyên gia này")
    return {"engine_version": ENGINE_VERSION, **hs}


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
        if any(len(t) > 80 for t in cleaned):          # SEC-1: chặn chuỗi khổng lồ
            raise ValueError("Tên tối đa 80 ký tự")
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


class DacBietInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cau_hoi: str = Field(min_length=1, max_length=500)


@app.post("/v1/hoi/dac-biet")
def api_hoi_dac_biet(inp: DacBietInput) -> dict:
    """SAO-2: 'an_toan' (khủng hoảng) | 'tu_choi_nhe' | None — web gọi trước khi chặn vì hết lượt hỏi miễn phí, để câu
    khủng hoảng / ngoài phạm vi luôn được trả lời miễn phí. RULES thuần (cùng danh sách với hỏi đáp), không LLM."""
    from app.hoidap import chung
    return {"loai": chung.dac_biet(chung.chuan_hoa(inp.cau_hoi))}


@app.post("/v1/thanso/luan-giai")
def api_luan_giai(inp: ThanSoInput) -> dict:
    """Luận giải thần số đầy đủ — con số + nghĩa CÓ NGUỒN + mặt tối + phản chứng.

    Đây là tầng KB+RULES+NARRATIVE: chỉ ghép nội dung từ kho quy tắc, tôn trọng
    độ nhạy (chỉ số chưa xác định thì nói thẳng, không luận bừa).
    """
    inp.kiem_tra_ngay()
    return luangiai_thanso.luan_giai(inp.ho_ten, inp.ngay, inp.thang, inp.nam)


@app.post("/v1/thanso/chaldea")
def api_chaldea(inp: ThanSoInput) -> dict:
    """TS-PHAI — thần số phái Chaldea (Cheiro): số tên gọi, họ tên, ngày sinh, đường đời, linh hồn, nhân cách;
    số kép 10–52 + số gốc, nghĩa từ KB, đối chiếu với phái Pitago. Biến thể tên thứ hai = tên thường gọi."""
    inp.kiem_tra_ngay()
    return {"engine_version": ENGINE_VERSION, **luangiai_chaldea.luan_chaldea(inp.ho_ten, inp.ngay, inp.thang, inp.nam)}


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
    ho_ten: list[Annotated[str, Field(max_length=80)]] | None = Field(default=None, max_length=5)
    ngay: int = Field(ge=1, le=31)
    thang: int = Field(ge=1, le=12)
    nam: int = Field(ge=1900, le=2100)


class HoiInput(ThanSoInput):
    cau_hoi: str = Field(min_length=3, max_length=400)
    nguoi_kia: NguoiKia | None = None
    ngay_xem: _dt.date | None = Field(default=None, description="Mặc định: hôm nay")
    # TS-PHAI-2: trả lời theo phái người dùng đang xem ở /than-so.
    phai: Literal["pitago", "chaldea"] = "pitago"


@app.get("/v1/tu-dien")
def api_tu_dien(mo_dun: str | None = None) -> dict:
    """GN — từ điển thuật ngữ dễ hiểu (KB) cho trang /tu-dien và khung giải nghĩa."""
    m = tu_dien.meta()
    return {"engine_version": ENGINE_VERSION, "nguon": m["_nguon"], "trang_thai": m["trang_thai"],
            "muc": tu_dien.tat_ca(mo_dun)}


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
    kq = hoi_van.tra_loi(inp.cau_hoi.strip(), nguoi, kia, inp.ngay_xem, phai=inp.phai)
    background.add_task(nhat_ky.ghi, inp.cau_hoi, kq)
    return {"engine_version": ENGINE_VERSION, **kq, "thuat_ngu": tu_dien.nhan_dien(kq.get("cau_tra_loi", ""), "thanso")}


QuanHe = Literal["nguoi_yeu", "ban_be", "dong_nghiep", "sep", "gia_dinh"]


class HopDoiInput(BaseModel):
    """Hai người — tên không bắt buộc (không có tên → chỉ so đường đời). `quan_he`: người ấy là ai với bạn."""
    a: NguoiKia
    b: NguoiKia
    quan_he: QuanHe = "nguoi_yeu"


@app.post("/v1/thanso/hop-doi")
def api_hop_doi(inp: HopDoiInput) -> dict:
    """Hợp đôi có cấu trúc: cặp số theo vị trí + điểm hoà / điểm va / việc cùng làm. Không chấm điểm."""
    for n in (inp.a, inp.b):
        try:
            _dt.date(n.nam, n.thang, n.ngay)
        except ValueError:
            raise HTTPException(422, detail="Ngày sinh không tồn tại")
    return luan_hop_doi(inp.a.model_dump(), inp.b.model_dump(), inp.quan_he)


SoHopLe = Literal[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]


class BoSo(BaseModel):
    duong_doi: SoHopLe
    su_menh: SoHopLe | None = None
    linh_hon: SoHopLe | None = None
    nhan_cach: SoHopLe | None = None


class CapSoInput(BaseModel):
    a: BoSo
    b: BoSo
    quan_he: QuanHe = "nguoi_yeu"


@app.post("/v1/thanso/cap-so")
def api_cap_so(inp: CapSoInput) -> dict:
    """Hợp đôi từ các con số đã tính (lời mời chỉ mang số, không mang ngày sinh người mời)."""
    return luan_hop_doi_tu_chi_so(inp.a.model_dump(exclude_none=True), inp.b.model_dump(exclude_none=True),
                                  inp.quan_he)


class DoiChieuNamInput(BaseModel):
    """Ngày sinh + tối đa 12 năm có biến cố người dùng muốn đối chiếu. Không lưu."""
    ngay: int = Field(ge=1, le=31)
    thang: int = Field(ge=1, le=12)
    nam: int = Field(ge=1900, le=2100)
    cac_nam: list[int] = Field(min_length=1, max_length=12)


@app.post("/v1/thanso/doi-chieu-nam")
def api_doi_chieu_nam(inp: DoiChieuNamInput) -> dict:
    """Đặt những năm có biến cố lên trục đời: năm cá nhân, giai đoạn (đỉnh), thử thách, mốc bước ngoặt."""
    from app.calc import thanso_dong_doi
    from app.luangiai.thanso import NHAN_MOC
    try:
        _dt.date(inp.nam, inp.thang, inp.ngay)
    except ValueError:
        raise HTTPException(422, detail="Ngày sinh không tồn tại")
    ra = []
    for n in inp.cac_nam:
        if n < inp.nam or n > inp.nam + 120:
            raise HTTPException(422, detail=f"Năm {n} nằm ngoài đời người này")
        r = thanso_dong_doi.doi_chieu_nam(inp.ngay, inp.thang, inp.nam, n)
        ra.append({**r,
                   "nghia_nam": kb_store.nghia_nam_ca_nhan(r["nam_ca_nhan"]),
                   "nghia_dinh": kb_store.nghia_dinh_cao(r["so_dinh"]),
                   "nghia_thu_thach": kb_store.nghia_thu_thach(r["thu_thach"]),
                   "nhan_moc": [NHAN_MOC[m].format(so=r["so_dinh"]) for m in r["moc"]]})
    return {
        "engine_version": ENGINE_VERSION,
        "cac_nam": ra,
        "cach_doc": ("Mỗi năm được đặt lên nhịp số của bạn. Nếu nhiều biến cố rơi đúng năm mở/khép chu kỳ hay năm "
                     "chuyển giai đoạn, đó là một mẫu hình để bạn tự ngẫm — nếu không trùng, con số chưa nói gì về "
                     "những biến cố đó. Năm theo mốc dương lịch; mốc sinh nhật được ghi kèm."),
    }


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


class HomNayInput(BaseModel):
    ngay: int = Field(ge=1, le=31)
    thang: int = Field(ge=1, le=12)
    nam: int = Field(ge=1900, le=2100)
    ngay_xem: _dt.date | None = None     # trống = hôm nay theo giờ Việt Nam
    y_dinh: list[str] = Field(default_factory=list, max_length=11)   # HN-2: mã ý định chọn sẵn
    du_dinh: str | None = Field(default=None, max_length=200)        # HN-2: câu gõ tay — chỉ nhận diện, không lưu


@app.post("/v1/thanso/hom-nay")
def api_hom_nay(inp: HomNayInput) -> dict:
    """HN-1 — "Hôm nay của bạn": ngày/tháng/năm cá nhân + âm lịch, can chi ngày + câu tự soi + ngày mai."""
    try:
        _dt.date(inp.nam, inp.thang, inp.ngay)
    except ValueError:
        raise HTTPException(422, detail="Ngày không tồn tại")
    ngay_xem = inp.ngay_xem or _dt.datetime.now(_dt.timezone(_dt.timedelta(hours=7))).date()
    return {"engine_version": ENGINE_VERSION, **hom_nay.the_hom_nay(inp.ngay, inp.thang, inp.nam, ngay_xem,
                                                                          inp.y_dinh, inp.du_dinh)}


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
