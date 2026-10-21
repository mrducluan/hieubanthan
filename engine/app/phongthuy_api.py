# -*- coding: utf-8 -*-
"""Endpoint Phong thuỷ — /v1/phongthuy/menh-quai và /v1/phongthuy/hoi (Bát trạch, HH-4).

Chỉ cần ngày sinh (hoặc năm) + giới tính; không cần giờ. Mệnh quái đổi năm tại Lập xuân.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.calc import phongthuy as pt
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
    return {"engine_version": ENGINE_VERSION, **mq, "bang_huong": bang,
            "huong_cat": [h for h, d in bang.items() if d in pt.CAT],
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
    """PT-V0 — luận từ bố cục nhà (form khảo sát hôm nay; ảnh/video từ PT-V2). Không lưu gì."""
    model_config = ConfigDict(extra="forbid")

    bo_cuc: bo_cuc.BoCuc
    sinh: SinhInput | None = None


@router.post("/bo-cuc")
def api_bo_cuc(inp: BoCucInput) -> dict:
    try:
        r = bo_cuc.luan(inp.bo_cuc.model_dump(exclude_none=True), inp.sinh.sinh() if inp.sinh else None)
    except ValueError as e:
        raise HTTPException(422, detail=str(e)[:300])
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


class LuanGiaiPTInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sinh: SinhInput | None = None
    nha: NhaInput
    thanh_vien: list[ThanhVienInput] = Field(default_factory=list, max_length=6)
    ngay_xem: _dt.date | None = None


@router.post("/luan-giai")
def api_luan_giai(inp: LuanGiaiPTInput) -> dict:
    from app.luangiai import phongthuy_doi_song as pt_ds  # noqa: PLC0415
    nha = inp.nha.model_dump(exclude_none=True)
    if inp.nha.bo_cuc is not None:
        nha["bo_cuc"] = inp.nha.bo_cuc.model_dump(exclude_none=True)
    tvs = [{**t.sinh(), "vai": t.vai} for t in inp.thanh_vien]
    try:
        r = pt_ds.luan_giai(inp.sinh.sinh() if inp.sinh else None, nha, tvs, inp.ngay_xem)
    except ValueError as e:
        raise HTTPException(422, detail=str(e)[:300])
    return {"engine_version": ENGINE_VERSION, **r}
