# -*- coding: utf-8 -*-
"""Endpoint Phong thuỷ — /v1/phongthuy/menh-quai và /v1/phongthuy/hoi (Bát trạch, HH-4).

Chỉ cần ngày sinh (hoặc năm) + giới tính; không cần giờ. Mệnh quái đổi năm tại Lập xuân.
"""
from __future__ import annotations

import base64
import binascii
import datetime as _dt
from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

from app.calc import phongthuy as pt
from app.kb import phongthuy_kb as kbp
from app.kb import tu_dien
from app import nhat_ky
from app.config import ENGINE_VERSION
from app.hoidap import phongthuy as hoidap_pt
from app.luangiai import phongthuy_bo_cuc as bo_cuc
from app.luangiai import phongthuy_tuoi as pt_tuoi

router = APIRouter(prefix="/v1/phongthuy", tags=["phongthuy"])


class SinhInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    birth_date: _dt.date | None = None
    birth_year: int | None = Field(default=None, ge=1860, le=2150)
    gender: Literal["nam", "nu"]
    # TP-LICH: mốc đầu năm tính mệnh quái — Lập xuân (mặc định) / Tết theo âm lịch Việt Nam / Trung Quốc.
    moc_nam: Literal["lap_xuan", "tet_viet", "tet_trung"] = "lap_xuan"

    @model_validator(mode="after")
    def _can_nam(self) -> "SinhInput":
        if self.birth_date is None and self.birth_year is None:
            raise ValueError("cần birth_date hoặc birth_year")
        return self

    def sinh(self) -> dict:
        return {"nam": self.birth_date.year if self.birth_date else self.birth_year,
                "gioi_tinh": self.gender, "ngay": self.birth_date, "moc_nam": self.moc_nam}


@router.post("/menh-quai")
def api_menh_quai(inp: SinhInput) -> dict:
    s = inp.sinh()
    mq = pt.menh_quai(s["nam"], s["gioi_tinh"], s["ngay"], s["moc_nam"])
    bang = pt.bang_huong(mq["quai"])
    # Engine tự tính cả ba mốc để người dùng thấy đổi mốc có làm khác mệnh quái không.
    ss = {m: {k: v for k, v in pt.menh_quai(s["nam"], s["gioi_tinh"], s["ngay"], m).items() if k in ("quai", "nhom", "nam_tinh")}
          for m in pt.MOC_NAM}
    # UI-PT "la bàn sống": nghĩa + "dùng cho" của 8 du niên (KB) để web đọc hướng đang quay về theo thời gian thực.
    du_nien_y = {ten: {k: v for k, v in (kbp.du_nien(ten) or {}).items() if k in ("loai", "y_nghia", "dung_cho")} for ten in set(bang.values())}
    return {"engine_version": ENGINE_VERSION, **mq, "bang_huong": bang,
            "huong_cat": [h for h, d in bang.items() if d in pt.CAT],
            "du_nien_y": du_nien_y,
            "so_sanh_moc": ss, "moc_khac": len({x["quai"] for x in ss.values()}) > 1}


class DoHuongInput(BaseModel):
    """PT-V1 — độ HƯỚNG nhà đo bằng la bàn (điện thoại hoặc la bàn thật); kèm năm sinh thì xét du niên."""
    model_config = ConfigDict(extra="forbid")

    do_huong: float = Field(ge=0, lt=360, description="Độ của hướng nhà (mặt nhìn ra), 0 = chính Bắc")
    sinh: SinhInput | None = None


CANH_BAO_DO = {
    "khong_vong": "Độ đo nằm đúng ranh giới hai sơn (không vong) — đo lại ở vài điểm trước cửa; sai vài độ là đổi sơn.",
    "kiem_huong": "Hướng lệch tâm sơn quá 3° (kiêm hướng) — Huyền Không sẽ lập thế quái; nên đo lại cho chắc.",
    "ranh_gioi_8_huong": "Độ đo sát ranh giới giữa hai hướng — Bát trạch có thể đổi sang trạch khác; đo lại ở vài điểm.",
}


@router.post("/do-huong")
def api_do_huong(inp: DoHuongInput) -> dict:
    """Đổi độ la bàn → hướng/sơn/toạ/trạch (+ du niên hướng đó với người xem). La bàn điện thoại chịu
    nhiễu từ (thép, loa, máy tính) — luôn cho sửa tay và khuyên đo lại vài lần."""
    r = pt.do_huong(inp.do_huong)
    ra = {"engine_version": ENGINE_VERSION, **r,
          "canh_bao_y": CANH_BAO_DO.get(r["canh_bao"]) if r["canh_bao"] else None,
          "luu_y": ("Độ đo bằng điện thoại là độ từ (bắc từ), lệch bắc thật khoảng 1° ở Việt Nam — không đáng kể "
                    "với 8 hướng, nhưng đáng kể khi sát ranh sơn. Đứng ở cửa chính, quay lưng vào nhà, giữ điện "
                    "thoại nằm ngang, tránh xa xe, cột thép, loa.")}
    if inp.sinh:
        s = inp.sinh.sinh()
        mq = pt.menh_quai(s["nam"], s["gioi_tinh"], s["ngay"], s["moc_nam"])
        ra["menh_quai"] = {k: mq[k] for k in ("quai", "nhom")}
        ra["du_nien"] = pt.du_nien(mq["quai"], r["huong"])
        ra["hop_nhom"] = r["trach"]["nhom"][:6] == mq["nhom"][:6]
    return ra


class BoCucInput(BaseModel):
    """PT-V0 — luận từ bố cục nhà (form khảo sát hôm nay; ảnh/video từ PT-V2). Không lưu gì.
    Q4: `goc_nhin` chọn câu giải thích dấu hiệu đưa lên trước (sách xưa / đời sống). Q2: `bo_cuc.mat_bang` vẽ tay."""
    model_config = ConfigDict(extra="forbid")

    bo_cuc: bo_cuc.BoCuc
    sinh: SinhInput | None = None
    goc_nhin: Literal["sach_xua", "doi_song"] = "sach_xua"


@router.post("/bo-cuc")
def api_bo_cuc(inp: BoCucInput) -> dict:
    try:
        r = bo_cuc.luan(inp.bo_cuc.model_dump(exclude_none=True), inp.sinh.sinh() if inp.sinh else None, inp.goc_nhin)
    except ValueError as e:
        raise HTTPException(422, detail=str(e)[:300])
    return {"engine_version": ENGINE_VERSION, **r}


class HuongBanDoInput(BaseModel):
    """Q3 — hướng nhà từ hai điểm trên bản đồ: tâm nhà → điểm ngay trước mặt nhà (căn hộ không đo được la bàn ở cửa).
    Toạ độ chỉ dùng để tính góc, không lưu, không trả lại."""
    model_config = ConfigDict(extra="forbid")

    tam: tuple[float, float] = Field(description="(vĩ độ, kinh độ) tâm nhà")
    truoc: tuple[float, float] = Field(description="(vĩ độ, kinh độ) điểm trước mặt nhà")
    sinh: SinhInput | None = None

    @model_validator(mode="after")
    def _toa_do(self) -> "HuongBanDoInput":
        for la, lo in (self.tam, self.truoc):
            if not (-90 <= la <= 90 and -180 <= lo <= 180):
                raise ValueError("Toạ độ không hợp lệ")
        return self


@router.post("/huong-ban-do")
def api_huong_ban_do(inp: HuongBanDoInput) -> dict:
    from app.calc import mat_bang as mb  # noqa: PLC0415
    kc = mb.khoang_cach_m(*inp.tam, *inp.truoc)
    if kc < 1:
        raise HTTPException(422, detail="Hai điểm trùng nhau — chọn điểm trước mặt nhà cách tâm ít nhất vài mét.")
    do = mb.bearing(*inp.tam, *inp.truoc)
    ra = api_do_huong(DoHuongInput(do_huong=do, sinh=inp.sinh))
    ra["khoang_cach_m"] = kc
    ra["luu_y"] = ("Hướng lấy từ hai điểm trên bản đồ là hướng theo bắc thật (không lệch từ), sai số khoảng 1–2° khi hai điểm cách "
                   "nhau trên 10 m. " + ("Hai điểm quá gần (dưới 5 m) — chọn điểm trước mặt xa hơn cho chắc. " if kc < 5 else "")
                   + "Vẫn nên đối chiếu với la bàn ở cửa nếu đo được.")
    return ra


@router.get("/do-thi/{y_dinh}")
def api_do_thi(y_dinh: str) -> dict:
    """Đồ thị tri thức theo ý định (thay Apache AGE): phòng cần nhìn, dấu hiệu nên rà, sao liên quan — để web gợi câu hỏi
    khảo sát theo điều người dùng băn khoăn. Chỉ tra KB, không nhận dữ liệu nhà."""
    from app.kb import phongthuy_do_thi as do_thi  # noqa: PLC0415
    g = do_thi.theo_y_dinh(y_dinh)
    if not g:
        raise HTTPException(404, detail="Không có ý định này trong đồ thị")
    g["dau_hieu_hoi"] = {x: bo_cuc.DAU_HIEU[x]["hoi"] for x in g["dau_hieu"] if x in bo_cuc.DAU_HIEU}
    g["ten_phong"] = {p: bo_cuc.TEN_PHONG[p] for p in g["phong"]}
    return {"engine_version": ENGINE_VERSION, **g, **do_thi.meta()}


class AnhVao(BaseModel):
    """Một ảnh nhà — base64 KHÔNG có tiền tố `data:`; chỉ đi qua lượt gọi, không ghi đĩa, không log."""
    model_config = ConfigDict(extra="forbid")

    du_lieu: str = Field(min_length=16, description="base64 của ảnh (không có tiền tố data:)")
    loai: Literal["image/jpeg", "image/png", "image/webp"]

    @field_validator("du_lieu")
    @classmethod
    def _base64(cls, v: str) -> str:
        if len(v) > DOC_ANH_MOT_ANH:
            raise ValueError("Mỗi ảnh tối đa khoảng 1,2 MB — hãy thu nhỏ ảnh trước khi gửi.")
        try:
            base64.b64decode(v, validate=True)
        except (binascii.Error, ValueError):
            raise ValueError("Dữ liệu ảnh không phải base64 hợp lệ (bỏ tiền tố data: nếu có).")
        return v


DOC_ANH_MOT_ANH, DOC_ANH_TONG = 1_600_000, 4_000_000


class DocAnhInput(BaseModel):
    """PT-V2 — gửi 1..3 ảnh nhà cho lớp đọc ảnh (tầng NARRATIVE, `narrative/doc_anh_nha.py`). Kết quả chỉ là NHÃN cần người
    dùng xác nhận (`can_xac_nhan`); web ghép vào bố cục với `nguon: anh` sau khi người dùng bấm Đúng."""
    model_config = ConfigDict(extra="forbid")

    anh: list[AnhVao] = Field(min_length=1, max_length=3)
    goc: Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)] | None = Field(default=None, description="Gợi ý góc chụp, vd 'phòng khách'")
    loai_nha: Annotated[str, StringConstraints(strip_whitespace=True, max_length=30)] | None = None
    y_dinh: Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)] | None = None

    @model_validator(mode="after")
    def _tong(self) -> "DocAnhInput":
        if sum(len(a.du_lieu) for a in self.anh) > DOC_ANH_TONG:
            raise ValueError("Tổng dung lượng ảnh quá lớn — gửi tối đa 3 ảnh, mỗi ảnh đã thu nhỏ.")
        return self


@router.post("/doc-anh")
def api_doc_anh(inp: DocAnhInput) -> dict:
    """Máy đọc ảnh nhà (PT-V2): trả dấu hiệu / phòng mô hình thị giác NHÌN THẤY, tất cả `can_xac_nhan`. Không có khoá AI →
    `da_bat: false, ly_do_tat: chua_dat_khoa` (không lỗi 5xx); hết lượt RL-1 → `het_luot`; lỗi dịch vụ → `loi_dich_vu`."""
    from app.narrative import doc_anh_nha  # noqa: PLC0415
    r = doc_anh_nha.doc_anh({"anh": [{"du_lieu": a.du_lieu, "loai": a.loai} for a in inp.anh],
                             "goc": inp.goc, "loai_nha": inp.loai_nha, "y_dinh": inp.y_dinh})
    return {"engine_version": ENGINE_VERSION, **r}


@router.get("/bo-cuc/danh-muc")
def api_bo_cuc_danh_muc() -> dict:
    """Danh mục cho form khảo sát: phòng, phương, dấu hiệu quan sát được (câu hỏi), vật dụng đo hướng."""
    return {"phong": bo_cuc.TEN_PHONG, "cung": list(bo_cuc.Cung9.__args__),
            "dau_hieu": [{"ma": k, **v} for k, v in bo_cuc.DAU_HIEU.items()],
            "vat_huong": {k: v["tieu_de"] for k, v in bo_cuc.kb.bo_cuc()["huong_vat"].items()}}


class HoiPTInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cau_hoi: str = Field(min_length=3, max_length=500)
    sinh: SinhInput | None = None
    ngay_xem: _dt.date | None = None


@router.post("/hoi")
def api_hoi(inp: HoiPTInput, background: BackgroundTasks) -> dict:
    try:
        kq = hoidap_pt.tra_loi(inp.cau_hoi.strip(), sinh=inp.sinh.sinh() if inp.sinh else None,
                               ngay_xem=inp.ngay_xem)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    background.add_task(nhat_ky.ghi_huyenhoc, "phongthuy", inp.cau_hoi, kq, inp.sinh is not None)
    return {"engine_version": ENGINE_VERSION, **kq, "thuat_ngu": tu_dien.nhan_dien(kq.get("cau_tra_loi", ""), "phongthuy")}


class HuyenKhongInput(BaseModel):
    """PT-HK — hạ quái bàn Huyền Không: năm xây/nhập trạch + toạ sơn (tên 24 sơn hoặc độ la bàn)."""
    model_config = ConfigDict(extra="forbid")

    nam_xay: int = Field(ge=1864, le=2150)
    toa: str | None = Field(default=None, max_length=10, description="Toạ sơn, vd 'Tý', 'Nhâm'")
    do: float | None = Field(default=None, ge=0, lt=360, description="Độ la bàn của TOẠ (lưng nhà), 0 = chính Bắc")
    nam_xem: int | None = Field(default=None, ge=1900, le=2150)
    the_quai: bool | None = Field(default=None, description="Ép thế quái/hạ quái; mặc định: tự theo độ (lệch > 3°)")

    @model_validator(mode="after")
    def _can_toa(self) -> "HuyenKhongInput":
        if (self.toa is None) == (self.do is None):
            raise ValueError("cần đúng một trong hai: toa hoặc do")
        return self


def _bay_gio_utc() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc).replace(tzinfo=None)


@router.post("/huyen-khong")
def api_huyen_khong(inp: HuyenKhongInput) -> dict:
    from app.calc import huyen_khong as hk
    from app.kb import phongthuy_kb

    canh_bao = []
    toa = inp.toa
    if inp.do is not None:
        s = hk.son_tu_do(inp.do)
        toa = s["son"]
        if s["canh_bao"] == "khong_vong":
            canh_bao.append({"loai": "khong_vong", "chi_tiet": f"Toạ {s['do']}° nằm đúng ranh giới hai sơn (không vong) — nên đo lại; bàn có thể sai hoàn toàn."})
        elif s["canh_bao"] == "kiem_huong":
            canh_bao.append({"loai": "kiem_huong", "chi_tiet": f"Toạ lệch {abs(s['lech'])}° so với chính {toa} (kiêm hướng, quá 3°) — lập THẾ QUÁI theo khẩu quyết Thẩm thị; kèm cục của hạ quái để so sánh."})
    the_quai = inp.the_quai if inp.the_quai is not None else any(c["loai"] == "kiem_huong" for c in canh_bao)
    try:
        b = hk.trach_ban(inp.nam_xay, toa, the_quai=the_quai)
        ha = hk.trach_ban(inp.nam_xay, toa) if the_quai else None
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    if ha:
        b["ha_quai"] = {"cuc": ha["cuc"], "cuc_ten": ha["cuc_ten"],
                        "cung": [{k: x[k] for k in ("cung", "son", "huong")} for x in ha["cung"]]}
        # Không gói mã nguồn mở nào (MIT) lập bàn thế quái để đối chiếu — ghi rõ cho người dùng.
        b["the_quai_trang_thai"] = "chua_doi_chieu_oracle"
        b["the_quai_y"] = phongthuy_kb.huyen_khong()["the_quai"]
    kb = phongthuy_kb.huyen_khong()
    nam_xem = inp.nam_xem or hk.nam_theo_lap_xuan(_bay_gio_utc())
    return {
        "engine_version": ENGINE_VERSION, **b,
        "cuc_y": kb["cuc"][b["cuc"]],
        "to_hop": [{**t, **kb["to_hop"][t["ma"]]} for t in b["to_hop"]],
        "sao_y": kb["sao"],
        "luu_nien": hk.luu_nien(nam_xem),
        "luu_y": kb["luu_y"], "nguon": kb["_nguon"], "trang_thai": kb["trang_thai"],
        "canh_bao": canh_bao,
    }


# --------------------------------------------------------------------------- #
# SEO-F — trang "tuổi X hợp hướng nào" (92 trang: năm 1960–2005 × nam/nữ)
# --------------------------------------------------------------------------- #
@router.get("/tuoi")
def api_tuoi_danh_sach() -> dict:
    return {"engine_version": ENGINE_VERSION, "trang": pt_tuoi.danh_sach()}


@router.get("/tuoi/{slug}")
def api_tuoi(slug: str) -> dict:
    k = pt_tuoi.tu_slug(slug)
    if k is None:
        raise HTTPException(404, detail="Không có trang tuổi này")
    return {"engine_version": ENGINE_VERSION, **pt_tuoi.tuoi(*k)}


# SEO-K: trang gộp nam + nữ (46 trang). Route cũ giữ để web/CMS bản trước deploy vẫn chạy trong lúc chuyển.
@router.get("/tuoi-gop")
def api_tuoi_gop_danh_sach() -> dict:
    return {"engine_version": ENGINE_VERSION, "trang": pt_tuoi.danh_sach_gop()}


@router.get("/tuoi-gop/{slug}")
def api_tuoi_gop(slug: str) -> dict:
    nam = pt_tuoi.tu_slug_gop(slug)
    if nam is None:
        raise HTTPException(404, detail="Không có trang tuổi này")
    return {"engine_version": ENGINE_VERSION, **pt_tuoi.tuoi_gop(nam)}


# --------------------------------------------------------------------------- #
# PT-ĐS — báo cáo "Nhà của bạn" (đời thường, tất định, miễn phí)
# --------------------------------------------------------------------------- #
_BoCuc = bo_cuc.BoCuc      # tên trường `bo_cuc` che tên module khi pydantic đánh giá chú thích


class NhaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    huong_do: float | None = Field(default=None, ge=0, lt=360, description="Độ HƯỚNG nhà (mặt nhìn ra), 0 = chính Bắc")
    huong: Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] | None = None
    nam_xay: int | None = Field(default=None, ge=1864, le=2150)
    toa: str | None = Field(default=None, max_length=10)
    theo: Literal["cua", "ban_cong"] = "cua"
    bo_cuc: _BoCuc | None = None


class ThanhVienInput(SinhInput):
    vai: Literal["vo", "chong", "con", "cha_me", "khac"] = "khac"


# Cùng mẫu với Tử vi (`tuvi_api._MaMau`): web gửi bảng tỉ lệ chung mọi mảng; mã không khớp hộp nào thì không có tác dụng.
_MaMau = Annotated[str, StringConstraints(pattern=r"^[a-z0-9_.+-]{3,60}$")]


class PhieuInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dung: int = Field(ge=0, le=10_000_000)
    chua_dung: int = Field(ge=0, le=10_000_000)


class LuanGiaiPTInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sinh: SinhInput | None = None
    nha: NhaInput
    thanh_vien: list[ThanhVienInput] = Field(default_factory=list, max_length=6)
    ngay_xem: _dt.date | None = None
    # HỌC-ĐS: bảng tỉ lệ "thấy đúng" công khai theo mã (web lấy từ Supabase, ≥ 30 phiếu) + phiếu của chính người xem.
    # Chỉ hạ / xếp lại hộp — không sinh câu mới. Không chữ người dùng, không ngày sinh.
    trong_so: dict[_MaMau, PhieuInput] | None = Field(default=None, max_length=5000)
    ca_nhan: dict[_MaMau, Literal["dung", "chua_dung"]] | None = Field(default=None, max_length=500)
    # Q4 góc nhìn giải thích dấu hiệu · đồ thị tri thức: ý định chung (KC-3) → mục "Theo điều bạn đang băn khoăn".
    goc_nhin: Literal["sach_xua", "doi_song"] = "sach_xua"
    y_dinh: Annotated[str, StringConstraints(pattern=r"^[a-z_]{3,30}$")] | None = None


@router.post("/luan-giai")
def api_luan_giai(inp: LuanGiaiPTInput) -> dict:
    from app.luangiai import phongthuy_doi_song as pt_ds  # noqa: PLC0415
    nha = inp.nha.model_dump(exclude_none=True)
    if inp.nha.bo_cuc is not None:
        nha["bo_cuc"] = inp.nha.bo_cuc.model_dump(exclude_none=True)
    tvs = [{**t.sinh(), "vai": t.vai} for t in inp.thanh_vien]
    try:
        r = pt_ds.luan_giai(inp.sinh.sinh() if inp.sinh else None, nha, tvs, inp.ngay_xem, inp.goc_nhin, inp.y_dinh)
    except ValueError as e:
        raise HTTPException(422, detail=str(e)[:300])
    if inp.trong_so or inp.ca_nhan:
        from app.luangiai import doi_song_khuon as kh  # noqa: PLC0415
        kh.ap_hoc(r, {k: v.model_dump() for k, v in (inp.trong_so or {}).items()}, inp.ca_nhan)
    return {"engine_version": ENGINE_VERSION, **r}


class ThangNayInput(BaseModel):
    """KC-2 — thẻ "Tháng này nhà bạn": chỉ cần hướng (độ hoặc 8 hướng); năm xây tuỳ chọn."""
    model_config = ConfigDict(extra="forbid")

    huong_do: float | None = Field(default=None, ge=0, lt=360)
    huong: Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] | None = None
    nam_xay: int | None = Field(default=None, ge=1864, le=2150)
    toa: str | None = Field(default=None, max_length=10)
    ngay_xem: _dt.date | None = None

    @model_validator(mode="after")
    def _can_huong(self) -> "ThangNayInput":
        if self.huong_do is None and self.huong is None:
            raise ValueError("cần huong_do hoặc huong")
        return self


@router.post("/thang-nay")
def api_thang_nay(inp: ThangNayInput) -> dict:
    from app.luangiai import phongthuy_doi_song as pt_ds  # noqa: PLC0415
    try:
        r = pt_ds.thang_nay(inp.model_dump(exclude_none=True, exclude={"ngay_xem"}), inp.ngay_xem)
    except ValueError as e:
        raise HTTPException(422, detail=str(e)[:300])
    return {"engine_version": ENGINE_VERSION, **r}
