# -*- coding: utf-8 -*-
"""Endpoint Phong thuỷ — /v1/phongthuy/menh-quai và /v1/phongthuy/hoi (Bát trạch, HH-4).

Chỉ cần ngày sinh (hoặc năm) + giới tính; không cần giờ. Mệnh quái đổi năm tại Lập xuân.
"""
from __future__ import annotations

import base64
import binascii
import datetime as _dt
from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, ValidationError, field_validator, model_validator

from app.calc import phongthuy as pt
from app.kb import phongthuy_kb as kbp
from app.kb import tu_dien
from app import ngon_ngu, nhat_ky
from app.kb.loi import L
from app.config import ENGINE_VERSION, hom_nay_vn
from app.hoidap import phongthuy as hoidap_pt
from app.luangiai import phongthuy_bo_cuc as bo_cuc
from app.luangiai import sach_ghi_mon
from app.luangiai import phongthuy_tuoi as pt_tuoi

router = APIRouter(prefix="/v1/phongthuy", tags=["phongthuy"])


class SinhInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    birth_date: _dt.date | None = Field(default=None, ge=_dt.date(1900, 1, 1), le=_dt.date(2100, 12, 31))
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
    # Xếp theo tên: lặp thẳng qua `set` thì thứ tự khoá đổi theo hạt băm tiến trình (PYTHONHASHSEED).
    du_nien_y = {ten: {k: v for k, v in (kbp.du_nien(ten) or {}).items() if k in ("loai", "y_nghia", "dung_cho")} for ten in sorted(set(bang.values()))}
    if not ngon_ngu.la_viet():
        from app.luangiai import phongthuy_hien  # noqa: PLC0415
        mq = {**mq, "co_canh_bao": phongthuy_hien.co_canh_bao(mq["co_canh_bao"])}
    return {"engine_version": ENGINE_VERSION, **mq, "bang_huong": bang,
            "huong_cat": [h for h, d in bang.items() if d in pt.CAT],
            "du_nien_y": du_nien_y,
            "sach_ghi": sach_ghi_mon.phongthuy(quai=mq["quai"]),      # SX-C: chín điều sách dặn cho người cung này
            "so_sanh_moc": ss, "moc_khac": len({x["quai"] for x in ss.values()}) > 1}


class DoHuongInput(BaseModel):
    """PT-V1 — độ HƯỚNG nhà đo bằng la bàn (điện thoại hoặc la bàn thật); kèm năm sinh thì xét du niên.
    LK-1: thay vì một số độ, web gửi MẪU la bàn thô (`mau`, lấy lúc giữ yên máy) — engine tính trung bình vòng, độ rung,
    mức ổn định (một bộ tính với VT-1). `mau_2` = lần đo thứ hai ở chỗ khác để bắt nhiễu sắt thép."""
    model_config = ConfigDict(extra="forbid")

    do_huong: float | None = Field(default=None, ge=0, lt=360, description="Độ của hướng nhà (mặt nhìn ra), 0 = chính Bắc")
    mau: list[float] | None = Field(default=None, min_length=1, max_length=240, description="Mẫu la bàn thô (độ, bắc từ)")
    sai_so: float | None = Field(default=None, ge=-1, le=360, description="iOS webkitCompassAccuracy (độ); −1 = chưa hiệu chỉnh")
    mau_2: list[float] | None = Field(default=None, min_length=1, max_length=240, description="Lần đo thứ hai ở chỗ khác")
    sai_so_2: float | None = Field(default=None, ge=-1, le=360)
    sinh: SinhInput | None = None

    @model_validator(mode="after")
    def _mot_nguon(self) -> "DoHuongInput":
        if (self.do_huong is None) == (self.mau is None):
            raise ValueError("cần đúng một trong hai: do_huong hoặc mau")
        if self.mau is None and (self.mau_2 is not None or self.sai_so is not None or self.sai_so_2 is not None):
            raise ValueError("mau_2 / sai_so chỉ đi cùng mau")
        if any(not (0 <= x < 360) for x in (self.mau or []) + (self.mau_2 or [])):
            raise ValueError("số độ phải trong [0, 360)")
        return self


LOI_DO = {
    "on": "Máy giữ yên tốt (rung ±{rung}°). Đây là độ rung của cảm biến, chưa phải độ chính xác — sắt thép gần cửa vẫn có thể làm lệch.",
    "giu_yen": "Số còn rung ±{rung}° — giữ máy yên hơn rồi đo lại sẽ chắc hơn.",
    "do_lai": "Số rung ±{rung}° — nhiều quá để tin. Lùi xa cửa sắt, xe, tủ lạnh rồi đo lại.",
    "hieu_chinh": "La bàn của máy chưa được hiệu chỉnh. Cầm máy vẽ hình số 8 trong không khí vài lần rồi đo lại.",
}
LOI_HAI_LAN = {
    "khop": "Hai lần đo lệch nhau {lech}° — khớp. Lấy trung bình hai lần.",
    "nhieu": "Hai lần đo lệch nhau {lech}° — có thể gần chỗ đo có sắt thép hoặc thiết bị điện. Đừng chốt số này: đo lại ở chỗ thoáng hơn, hoặc dùng cách chọn trên ảnh vệ tinh.",
}


def _do_tu_mau(inp: DoHuongInput) -> tuple[float, dict, dict | None]:
    """(số độ dùng để tính, khối `do`, khối `hai_lan` hoặc None)."""
    from app.calc import vi_tri_vat as vt  # noqa: PLC0415
    do = vt.do_tu_mau(inp.mau, inp.sai_so)
    hai = None
    if inp.mau_2 is not None:
        hai = vt.so_hai_lan(inp.mau, inp.mau_2, inp.sai_so, inp.sai_so_2)
        ma = "nhieu" if hai["nhieu"] else "khop"
        hai["loi"] = L(f"pt.do.hai_lan.{ma}", LOI_HAI_LAN[ma], lech=hai["lech"])
        if hai["nhieu"]:
            do = {**do, "on_dinh": "do_lai"}
        else:
            do = {**do, "do": hai["do"]}
    ma = "hieu_chinh" if do["can_hieu_chinh"] else do["on_dinh"]
    do["loi"] = L(f"pt.do.rung.{ma}", LOI_DO[ma], rung=do["rung"])
    return do["do"], do, hai


CANH_BAO_DO = {
    "khong_vong": "Độ đo nằm đúng ranh giới hai sơn (không vong) — đo lại ở vài điểm trước cửa; sai vài độ là đổi sơn.",
    "kiem_huong": "Hướng lệch tâm sơn quá 3° (kiêm hướng) — Huyền Không sẽ lập thế quái; nên đo lại cho chắc.",
    "ranh_gioi_8_huong": "Độ đo sát ranh giới giữa hai hướng — Bát trạch có thể đổi sang trạch khác; đo lại ở vài điểm.",
}


@router.post("/do-huong")
def api_do_huong(inp: DoHuongInput) -> dict:
    """Đổi độ la bàn → hướng/sơn/toạ/trạch (+ du niên hướng đó với người xem). La bàn điện thoại chịu
    nhiễu từ (thép, loa, máy tính) — luôn cho sửa tay và khuyên đo lại vài lần."""
    do_khoi, hai_lan = None, None
    if inp.mau is not None:
        do_so, do_khoi, hai_lan = _do_tu_mau(inp)
    else:
        do_so = inp.do_huong
    r = pt.do_huong(do_so)
    ra = {"engine_version": ENGINE_VERSION, **r,
          "canh_bao_y": L(f"pt.do.{r['canh_bao']}", CANH_BAO_DO[r["canh_bao"]]) if r["canh_bao"] in CANH_BAO_DO else None,
          "luu_y": L("pt.do.luu_y", "Độ đo bằng điện thoại là độ từ (bắc từ), lệch bắc thật khoảng 1° ở Việt Nam — không đáng kể "
                     "với 8 hướng, nhưng đáng kể khi sát ranh sơn. Đứng ở cửa chính, quay lưng vào nhà, giữ điện "
                     "thoại nằm ngang, tránh xa xe, cột thép, loa.")}
    if do_khoi is not None:
        ra["do"] = do_khoi
    if hai_lan is not None:
        ra["hai_lan"] = hai_lan
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
    ra["luu_y"] = (L("pt.bd.luu_y_1", "Hướng lấy từ hai điểm trên bản đồ là hướng theo bắc thật (không lệch từ), sai số khoảng 1–2° khi hai điểm cách "
                     "nhau trên 10 m. ") + (L("pt.bd.qua_gan", "Hai điểm quá gần (dưới 5 m) — chọn điểm trước mặt xa hơn cho chắc. ") if kc < 5 else "")
                   + L("pt.bd.luu_y_2", "Vẫn nên đối chiếu với la bàn ở cửa nếu đo được."))
    return ra


@router.get("/do-thi/{y_dinh}")
def api_do_thi(y_dinh: str) -> dict:
    """Đồ thị tri thức theo ý định (thay Apache AGE): phòng cần nhìn, dấu hiệu nên rà, sao liên quan — để web gợi câu hỏi
    khảo sát theo điều người dùng băn khoăn. Chỉ tra KB, không nhận dữ liệu nhà."""
    from app.kb import phongthuy_do_thi as do_thi  # noqa: PLC0415
    g = do_thi.theo_y_dinh(y_dinh)
    if not g:
        raise HTTPException(404, detail="Không có ý định này trong đồ thị")
    g["dau_hieu_hoi"] = {x: bo_cuc.hoi(x) for x in g["dau_hieu"] if x in bo_cuc.DAU_HIEU}
    g["ten_phong"] = {p: bo_cuc.ten_phong(p) for p in g["phong"]}
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
    """PT-V2 — gửi 1..6 ảnh nhà cho lớp đọc ảnh (tầng NARRATIVE, `narrative/doc_anh_nha.py`). Kết quả chỉ là NHÃN cần người
    dùng xác nhận (`can_xac_nhan`); web ghép vào bố cục với `nguon: anh` sau khi người dùng bấm Đúng."""
    model_config = ConfigDict(extra="forbid")

    anh: list[AnhVao] = Field(min_length=1, max_length=6)
    goc: Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)] | None = Field(default=None, description="Gợi ý góc chụp, vd 'phòng khách'")
    loai_nha: Annotated[str, StringConstraints(strip_whitespace=True, max_length=30)] | None = None
    y_dinh: Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)] | None = None

    @model_validator(mode="after")
    def _tong(self) -> "DocAnhInput":
        if sum(len(a.du_lieu) for a in self.anh) > DOC_ANH_TONG:
            raise ValueError("Tổng dung lượng ảnh quá lớn — gửi tối đa 6 ảnh, mỗi ảnh đã thu nhỏ.")
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
    return {"phong": {p: bo_cuc.ten_phong(p) for p in bo_cuc.TEN_PHONG}, "cung": list(bo_cuc.Cung9.__args__),
            "dau_hieu": [{"ma": k, **v, "hoi": bo_cuc.hoi(k)} for k, v in bo_cuc.DAU_HIEU.items()],
            "vat_huong": {k: v["tieu_de"] for k, v in bo_cuc.kb.bo_cuc()["huong_vat"].items()}}


class HoiPTInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cau_hoi: str = Field(min_length=3, max_length=500)
    sinh: SinhInput | None = None
    ngay_xem: _dt.date | None = None
    # Y6: hồ sơ nhà trên máy người hỏi (hướng + bố cục) → trả lời theo đúng nhà. Chỉ dùng trong lượt gọi, không lưu.
    # Nhận thô rồi tự kiểm khuôn ở route: hồ sơ lệch khuôn (vd mã dấu hiệu cũ) thì bỏ qua nhà, câu hỏi vẫn được trả lời.
    nha: dict | None = None


@router.post("/hoi")
def api_hoi(inp: HoiPTInput, background: BackgroundTasks) -> dict:
    nha = None
    if inp.nha is not None and len(str(inp.nha)) <= 20_000:
        try:
            n = NhaInput.model_validate(inp.nha)
        except ValidationError:
            n = None
        if n is not None:
            nha = n.model_dump(exclude_none=True)
            if n.bo_cuc is not None:
                nha["bo_cuc"] = n.bo_cuc.model_dump(exclude_none=True)
    try:
        kq = hoidap_pt.tra_loi(inp.cau_hoi.strip(), sinh=inp.sinh.sinh() if inp.sinh else None,
                               ngay_xem=inp.ngay_xem, nha=nha)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    # Câu trả lời theo nhà (hướng, vị trí phòng) không vào nhật ký như dữ liệu sinh (nhat_ky.KHOI_TU_SINH: nha_rieng).
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


def _ten_son(son: str) -> str:
    from app.kb import ten  # noqa: PLC0415
    return ten.ten("son", son)


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
            canh_bao.append({"loai": "khong_vong", "chi_tiet": L("pt.hk.khong_vong", "Toạ {do}° nằm đúng ranh giới hai sơn (không vong) — nên đo lại; bàn có thể sai hoàn toàn.", do=s['do'])})
        elif s["canh_bao"] == "kiem_huong":
            canh_bao.append({"loai": "kiem_huong", "chi_tiet": L("pt.hk.kiem_huong", "Toạ lệch {lech}° so với chính {son} (kiêm hướng, quá 3°) — lập THẾ QUÁI theo khẩu quyết Thẩm thị; kèm cục của hạ quái để so sánh.",
                                                                     lech=abs(s['lech']), son=_ten_son(toa))})
    the_quai = inp.the_quai if inp.the_quai is not None else any(c["loai"] == "kiem_huong" for c in canh_bao)
    try:
        b = hk.trach_ban(inp.nam_xay, toa, the_quai=the_quai)
        ha = hk.trach_ban(inp.nam_xay, toa) if the_quai else None
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    if ha:
        b["ha_quai"] = {"cuc": ha["cuc"], "cuc_ten": ha["cuc_ten"],
                        "cung": [{k: x[k] for k in ("cung", "son", "huong")} for x in ha["cung"]]}
        # Thế quái khớp các đồ bàn tham chiếu FS_SS1_CHART_P134 / P123–124 / P175 (golden huyen_khong_tham_thi.json, chép từ
        # bộ ghi chép fengshui-xuankong-kb), NHƯNG nguyên văn Thẩm Thị Huyền Không Học CHƯA có trong kho nguồn
        # fixtures/nguon/ → vẫn gắn cờ chưa đối chiếu nguyên văn (chủ dự án giữ thay đổi sao 5, 2026-11-20; đối chiếu lại khi có sách).
        b["the_quai_trang_thai"] = "chua_doi_chieu_nguyen_van"
        b["the_quai_ghi_chu"] = L(
            "pt.hk.the_quai_ghi_chu",
            "Bàn thế quái lập theo đồ bàn tham chiếu của phái Thẩm thị (sao 5 nhập trung giữ nguyên 5); nguyên văn sách "
            "Thẩm Thị Huyền Không Học chưa có trong kho nguồn của Hiểu Bản Thân nên còn chờ đối chiếu.")
        b["the_quai_y"] = phongthuy_kb.huyen_khong()["the_quai"]
    kb = phongthuy_kb.huyen_khong()
    nam_xem = inp.nam_xem or hk.nam_theo_lap_xuan(_bay_gio_utc())
    cung_chi_tiet = [
        {**c, "y_cap": hk.to_hop_cung(c["son"], c["huong"], b["van"], cung=c["cung"], nam=nam_xem)}
        for c in b["cung"]
    ]
    tm = hk.thanh_mon(b["van"], toa)
    if ngon_ngu.la_viet():
        tm_ra = {**tm, **({"y": kb["thanh_mon"]} if kb.get("thanh_mon") else {})}
    else:
        _h_en = {"Bắc": "North", "Đông Bắc": "Northeast", "Đông": "East", "Đông Nam": "Southeast",
                 "Nam": "South", "Tây Nam": "Southwest", "Tây": "West", "Tây Bắc": "Northwest"}
        _m_en = {
            "Nhâm": "Ren", "Tý": "Zi", "Quý": "Gui", "Sửu": "Chou", "Cấn": "Gen", "Dần": "Yin",
            "Giáp": "Jia", "Mão": "Mao", "Ất": "Yi", "Thìn": "Chen", "Tốn": "Xun", "Tỵ": "Si",
            "Bính": "Bing", "Ngọ": "Wu", "Đinh": "Ding", "Mùi": "Wei", "Khôn": "Kun", "Thân": "Shen",
            "Canh": "Geng", "Dậu": "You", "Tân": "Xin", "Tuất": "Xu", "Càn": "Qian", "Hợi": "Hai",
        }
        def _en_slot(x: dict) -> dict:
            # `cung` là MÃ để web so với ô của bàn (giữ chữ gốc như ban.cung[].cung; kb/ten.KHOA_MA gắn tên hiển thị).
            return {**x, "phuong": _h_en.get(x["phuong"], x["phuong"]), "son": _m_en.get(x["son"], x["son"])}
        tm_ra = {
            **tm,
            "toa": _m_en.get(tm["toa"], tm["toa"]),
            "huong": _m_en.get(tm["huong"], tm["huong"]),
            "chinh": _en_slot(tm["chinh"]),
            "phu": _en_slot(tm["phu"]),
            "y": {
                "ten": "Castle Gate (Cheng Men)",
                "y": "The two palaces flanking the Facing sector (primary follows He Tu pairs 1-6/2-7/3-8/4-9; secondary is the other flank). When the ruling period star flies into a Castle Gate sector, it acts as a supportive secondary intake of Qi.",
                "chinh": "Primary Castle Gate is active in this period — stronger supportive Qi intake than the secondary gate.",
                "phu": "Secondary Castle Gate is active in this period — usable as a secondary open entryway or pathway.",
                "khong_dung": "Neither flanking palace receives the ruling period star in this construction period, so Castle Gate does not apply.",
                "luu_y": "Per Shen's Xuan Kong, Castle Gate applies only when a real side door, pathway, or open intersection exists in that sector.",
            },
        }
    return {
        "engine_version": ENGINE_VERSION, **b,
        "cung": cung_chi_tiet,
        "cuc_y": kb["cuc"][b["cuc"]],
        "to_hop": [{**t, **kb["to_hop"][t["ma"]]} for t in b["to_hop"]],
        "thanh_mon": tm_ra,
        "sao_y": kb["sao"],
        "luu_nien": hk.luu_nien(nam_xem),
        "luu_y": kb["luu_y"], "nguon": kb["_nguon"], "trang_thai": kb["trang_thai"],
        "canh_bao": canh_bao,
    }


# --------------------------------------------------------------------------- #
# SEO-F — trang "tuổi X hợp hướng nào" (92 trang: năm 1960–2005 × nam/nữ)
# --------------------------------------------------------------------------- #
# AUD-Q2: 8 trang cung phi + bảng năm sinh (thay 46 trang năm). RS-3 (2026-11-20): bỏ route /tuoi, /tuoi-gop (chỉ giữ cho
# lúc deploy lệch AUD-Q2; web không gọi nữa). Hàm `phongthuy_tuoi.tuoi / tuoi_gop` vẫn dùng cho test + script đo.
@router.get("/cung-phi")
def api_cung_phi_danh_sach() -> dict:
    return {"engine_version": ENGINE_VERSION, "cung": pt_tuoi.danh_sach_cung(), "tuoi": pt_tuoi.muc_luc_tuoi()}


@router.get("/cung-phi/{slug}")
def api_cung_phi(slug: str, nam_xem: int | None = Query(default=None, ge=1900, le=2150)) -> dict:
    if pt_tuoi.cung_tu_slug(slug) is None:
        raise HTTPException(404, detail="Không có cung phi này")
    return {"engine_version": ENGINE_VERSION, **pt_tuoi.cung_phi(slug, nam_xem)}


# UI-HHT: hướng chung hai người (vợ chồng, người cùng nhà) — chỉ năm sinh + giới tính, không lưu.
class _NguoiNam(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nam: int = Field(ge=1900, le=2100)
    gioi_tinh: Literal["nam", "nu"]


class _HaiCung(BaseModel):
    model_config = ConfigDict(extra="forbid")
    a: _NguoiNam
    b: _NguoiNam


@router.post("/hai-cung")
def api_hai_cung(inp: _HaiCung) -> dict:
    from app.luangiai import phongthuy_cung_chi_tiet as ct  # noqa: PLC0415
    return {"engine_version": ENGINE_VERSION, **ct.hai_cung(inp.a.nam, inp.a.gioi_tinh, inp.b.nam, inp.b.gioi_tinh)}


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
    # TY-2: mã điều người dùng tự tích ở "Nhìn quanh nhà" (Dương Trạch Thập Thư) — chỉ mã, lưu trên máy người dùng.
    quan_sat: list[Annotated[str, StringConstraints(pattern=r"^[a-z_]{3,40}$")]] = Field(default_factory=list, max_length=60)


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


_MaDauHieu = Literal[tuple(bo_cuc.DAU_HIEU)]  # type: ignore[valid-type]  — ngoài lớp: trường `bo_cuc` che tên module


class ViecTuanInput(BaseModel):
    """Y4 — thẻ "Việc 0 đồng tuần này": chỉ MÃ dấu hiệu đã khai / đã xử lý trong hồ sơ nhà trên máy. Không lưu."""
    model_config = ConfigDict(extra="forbid")

    dau_hieu: list[_MaDauHieu] = Field(default_factory=list, max_length=40)
    da_xu_ly: list[_MaDauHieu] = Field(default_factory=list, max_length=40)
    loai_nha: Literal["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"] | None = None
    ngay_xem: _dt.date | None = None
    # Hồ sơ nhà đầy đủ (BoCuc) → tính cả dấu hiệu suy từ mặt bằng / vị trí phòng như bài đọc Nhà của bạn.
    bo_cuc: _BoCuc | None = None


@router.post("/viec-tuan")
def api_viec_tuan(inp: ViecTuanInput) -> dict:
    ngay = inp.ngay_xem or _dt.datetime.now(_dt.timezone(_dt.timedelta(hours=7))).date()
    bc = inp.bo_cuc.model_dump(exclude_none=True) if inp.bo_cuc is not None else None
    try:
        return {"engine_version": ENGINE_VERSION, **bo_cuc.viec_tuan(inp.dau_hieu, inp.da_xu_ly, inp.loai_nha, ngay, bc)}
    except ValueError as e:
        raise HTTPException(422, detail=str(e)[:300])


@router.post("/thang-nay")
def api_thang_nay(inp: ThangNayInput) -> dict:
    from app.luangiai import phongthuy_doi_song as pt_ds  # noqa: PLC0415
    try:
        r = pt_ds.thang_nay(inp.model_dump(exclude_none=True, exclude={"ngay_xem"}), inp.ngay_xem)
    except ValueError as e:
        raise HTTPException(422, detail=str(e)[:300])
    return {"engine_version": ENGINE_VERSION, **r}


# --------------------------------------------------------------------------- #
# Dương Trạch Tam Yếu — tra nhanh Cửa – Chủ – Bếp + vòng 24 sơn (rà soát 2026-11-21)

_QuaiTamYeu = Literal["Càn", "Đoài", "Ly", "Chấn", "Tốn", "Khảm", "Cấn", "Khôn"]


@router.get("/tam-yeu/so-do")
def api_tam_yeu_so_do(
    cua: _QuaiTamYeu = Query(..., description="Quái phương vị cửa chính (nhìn từ tâm nhà)"),
    chu: _QuaiTamYeu | None = Query(default=None, description="Quái phương vị phòng chính"),
    bep: _QuaiTamYeu | None = Query(default=None, description="Quái phương vị bếp"),
    nam_sinh: int | None = Query(default=None, ge=1900, le=2100, description="Năm sinh người đọc — chỉ để biết có hiện ghi chép nhóm C"),
    du_18: bool = Query(default=False, description="Người đọc tự xác nhận đã đủ 16 tuổi (khi không có năm sinh)"),
    gioi_tinh: Literal["nam", "nu"] | None = Query(default=None, description="TY-2: cùng năm sinh → mệnh quái người chủ (Minh Kính)"),
    ve_sinh: _QuaiTamYeu | None = Query(default=None, description="TY-2: quái phương vị nhà vệ sinh (hồ sơ nhà)"),
    ban_tho: _QuaiTamYeu | None = Query(default=None, description="TY-2: quái phương vị bàn thờ (hồ sơ nhà)"),
) -> dict:
    """Du niên ba cặp cửa–chủ, cửa–bếp, chủ–bếp (một bộ tính với báo cáo Nhà của bạn), mức theo thang chung, gợi ý
    phía đặt bếp, việc nên làm và khối sách xưa theo khuôn SX-C (nhóm C chỉ khi người đọc đủ 16 tuổi). TY-2: thêm
    tên thế nhà, nhãn sách cho tám chỗ đặt bếp, nguyên tắc Tam Yếu / điều Minh Kính có điều kiện đúng với nhà này."""
    from app.calc import phongthuy as pt  # noqa: PLC0415
    from app.luangiai import phongthuy_tam_yeu as ty  # noqa: PLC0415
    from app.luangiai import sach_ghi_mon  # noqa: PLC0415
    tuoi = sach_ghi_mon.tuoi_tu(nam_sinh, hom_nay_vn()) if nam_sinh else (sach_ghi_mon.TUOI_NHOM_C if du_18 else None)
    menh = pt.menh_quai(nam_sinh, gioi_tinh)["quai"] if nam_sinh and gioi_tinh else None
    return {"engine_version": ENGINE_VERSION, "pham_vi": "phongthuy_tam_yeu",
            **ty.so_do(cua, chu, bep, tuoi, ve_sinh=ve_sinh, ban_tho=ban_tho, menh=menh)}


class QuanSatInput(BaseModel):
    """TY-2 — "Nhìn quanh nhà": mã điều người dùng tự tích (không chữ, không địa chỉ). Không lưu."""
    model_config = ConfigDict(extra="forbid")

    chon: list[Annotated[str, StringConstraints(pattern=r"^[a-z_]{3,40}$")]] = Field(default_factory=list, max_length=60)
    nam_sinh: int | None = Field(default=None, ge=1900, le=2100)
    du_18: bool = False


@router.get("/quan-sat")
def api_quan_sat_ds() -> dict:
    """Câu hỏi quan sát quanh nhà theo nhóm (điều Dương Trạch Thập Thư chưa gắn dấu hiệu trong nhà). Chỉ bản Việt."""
    from app.luangiai import phongthuy_quan_sat as qs  # noqa: PLC0415
    return {"engine_version": ENGINE_VERSION, **qs.danh_sach()}


@router.post("/quan-sat")
def api_quan_sat(inp: QuanSatInput) -> dict:
    """Điều đã tích → câu sách xưa theo khuôn SX-C (nhóm C chỉ khi người đọc đủ 16 tuổi). Không đổi mức nào."""
    from app.luangiai import phongthuy_quan_sat as qs  # noqa: PLC0415
    from app.luangiai import sach_ghi_mon  # noqa: PLC0415
    tuoi = (sach_ghi_mon.tuoi_tu(inp.nam_sinh, hom_nay_vn()) if inp.nam_sinh
            else (sach_ghi_mon.TUOI_NHOM_C if inp.du_18 else None))
    return {"engine_version": ENGINE_VERSION, **qs.doc(inp.chon, tuoi)}


@router.get("/tam-yeu/la-ban-24-son")
def api_tam_yeu_la_ban_24_son() -> dict:
    """Vòng 24 sơn (tên, chữ Hán, quái, phương, khoảng độ) để web vẽ mặt la bàn — web không tự tính."""
    from app.luangiai import phongthuy_tam_yeu as ty  # noqa: PLC0415
    return {"engine_version": ENGINE_VERSION, "pham_vi": "la_ban_24_son", **ty.la_ban_24_son()}


# --------------------------------------------------------------------------- #
# HG-1 — "Hỏi gì xem nấy": sáu câu hỏi → câu trả lời riêng từ hồ sơ nhà (RULES `luangiai/phongthuy_hoi_gi.py`)

class _NhaHoiGi(BaseModel):
    model_config = ConfigDict(extra="forbid")

    huong_do: float | None = Field(default=None, ge=0, lt=360)
    huong: Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] | None = None
    nam_xay: int | None = Field(default=None, ge=1864, le=2150)
    loai_nha: Literal["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"] | None = None
    bo_cuc: _BoCuc | None = None


class HoiGiInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ma: Literal["cua_chinh", "bo_cuc", "gia_dinh", "han_nam", "so_sanh", "mo_quan"]
    nha: _NhaHoiGi | None = None
    sinh: SinhInput | None = None
    nguoi_2: _NguoiNam | None = None
    ngay_xem: _dt.date | None = None


@router.get("/hoi-gi")
def api_hoi_gi_danh_muc() -> dict:
    from app.luangiai import phongthuy_hoi_gi as hg  # noqa: PLC0415
    return {"engine_version": ENGINE_VERSION, **hg.danh_muc()}


@router.post("/hoi-gi")
def api_hoi_gi(inp: HoiGiInput) -> dict:
    """Trả lời một trong sáu câu hỏi từ dữ kiện người dùng đã có (hướng, năm xây, dấu hiệu đã khai, năm sinh). Thiếu gì
    thì nêu ở `thieu` — không đoán thay. Không lưu gì; đầu ra không mang ngày sinh."""
    from app.luangiai import phongthuy_hoi_gi as hg  # noqa: PLC0415
    nha = inp.nha.model_dump(exclude_none=True) if inp.nha else {}
    try:
        r = hg.tra_loi(inp.ma, nha, inp.sinh.sinh() if inp.sinh else None,
                       inp.nguoi_2.model_dump() if inp.nguoi_2 else None, inp.ngay_xem or hom_nay_vn())
    except ValueError as e:
        raise HTTPException(422, detail=str(e)[:300])
    return {"engine_version": ENGINE_VERSION, **r}


# --------------------------------------------------------------------------- #
# VT-1 — "Đứng giữa nhà, chĩa điện thoại" + khung nhà theo tỉ lệ, nhiều tầng (2026-11-21)

class VatViTriInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    loai: Literal["cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho", "cau_thang"]
    mau: list[float] | None = Field(default=None, min_length=1, max_length=120, description="Các mẫu la bàn (độ, bắc từ) khi chĩa máy")
    sai_so: float | None = Field(default=None, ge=-1, le=360, description="iOS webkitCompassAccuracy (độ) nếu có")
    diem: tuple[float, float] | None = Field(default=None, description="Điểm chạm trên khung tỉ lệ, chuẩn hoá 0..1 (x trái→phải, y trước→sau)")
    # SD-1: chỉ gửi khi người dùng TỰ CHỈNH trên sơ đồ (giá trị máy tự điền không phải dữ kiện)
    kich_thuoc: tuple[float, float] | None = Field(default=None, description="Rộng × sâu (mét) của phòng trên sơ đồ")
    huong_cua: Literal["truoc", "phai", "sau", "trai"] | None = Field(default=None, description="Cửa phòng mở về phía nào của nhà")

    @model_validator(mode="after")
    def _mot_nguon(self) -> "VatViTriInput":
        if (self.mau is None) == (self.diem is None):
            raise ValueError("mỗi vật cần đúng một trong hai: mau (la bàn) hoặc diem (khung)")
        if self.diem is None and (self.kich_thuoc is not None or self.huong_cua is not None):
            raise ValueError("kich_thuoc / huong_cua chỉ đi với điểm trên khung")
        if self.kich_thuoc is not None and not all(0.3 <= x <= 200 for x in self.kich_thuoc):
            raise ValueError("kích thước phòng phải trong 0,3–200 m")
        if self.mau is not None and any(not (0 <= x < 360) for x in self.mau):
            raise ValueError("số độ phải trong [0, 360)")
        if self.diem is not None and not all(0 <= x <= 1 for x in self.diem):
            raise ValueError("điểm phải trong khung 0..1")
        return self


class TangViTriInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    so: int = Field(ge=1, le=6)
    vat: list[VatViTriInput] = Field(min_length=1, max_length=6)

    @model_validator(mode="after")
    def _khong_trung(self) -> "TangViTriInput":
        if len({v.loai for v in self.vat}) != len(self.vat):
            raise ValueError("mỗi loại vật chỉ một lần mỗi tầng")
        return self


class KhungNhaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rong: float = Field(gt=0, le=200)
    sau: float = Field(gt=0, le=200)
    luoi: list[str] | None = Field(default=None, min_length=3, max_length=12)


class ViTriVatInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    huong_nha_do: float | None = Field(default=None, ge=0, lt=360)
    truc_do: float | None = Field(default=None, ge=0, lt=360, description="Số độ khi áp cạnh máy dọc một bức tường dài")
    truc_mau: list[float] | None = Field(default=None, min_length=1, max_length=120, description="Các mẫu la bàn khi đo trục (thay truc_do)")
    khung: KhungNhaInput | None = None
    nam_xay: int | None = Field(default=None, ge=1864, le=2150)
    sinh: SinhInput | None = None
    du_18: bool = False
    tang: list[TangViTriInput] = Field(min_length=1, max_length=6)

    @model_validator(mode="after")
    def _khac_tang(self) -> "ViTriVatInput":
        if len({t.so for t in self.tang}) != len(self.tang):
            raise ValueError("mỗi tầng chỉ một lần")
        if self.truc_mau is not None and any(not (0 <= x < 360) for x in self.truc_mau):
            raise ValueError("số độ trục phải trong [0, 360)")
        if any(v.diem is not None for t in self.tang for v in t.vat) and self.khung is None:
            raise ValueError("có điểm trên khung thì cần kích thước khung")
        return self


@router.post("/vi-tri-vat")
def api_vi_tri_vat(inp: ViTriVatInput) -> dict:
    """Số độ la bàn (đứng giữa nhà chĩa máy) hoặc điểm trên khung tỉ lệ → phương, sơn của từng vật; Cửa – Chủ – Bếp từng
    tầng; du niên với mệnh; sao Huyền Không. Không lưu gì."""
    from app.luangiai import phongthuy_vi_tri as vtr  # noqa: PLC0415
    from app.luangiai import sach_ghi_mon  # noqa: PLC0415
    mq, tuoi = None, (sach_ghi_mon.TUOI_NHOM_C if inp.du_18 else None)
    if inp.sinh:
        s = inp.sinh.sinh()
        mq = pt.menh_quai(s["nam"], s["gioi_tinh"], s["ngay"], s["moc_nam"])["quai"]
        tuoi = sach_ghi_mon.tuoi_tu(s["ngay"] or s["nam"], hom_nay_vn())
    from app.calc import vi_tri_vat as vt  # noqa: PLC0415
    truc = vt.trung_binh_goc(inp.truc_mau)[0] if inp.truc_mau else inp.truc_do
    _RIENG_SO_DO = ("kich_thuoc", "huong_cua")
    try:
        r = vtr.phan_tich([{"so": t.so, "vat": [{k: x for k, x in v.model_dump().items() if k not in _RIENG_SO_DO} for v in t.vat]}
                           for t in inp.tang], inp.huong_nha_do, truc,
                          inp.khung.model_dump() if inp.khung else None, mq, inp.nam_xay, tuoi)
        them = _goi_y_so_do(inp)
    except ValueError as e:
        raise HTTPException(422, detail=str(e)[:300])
    return {"engine_version": ENGINE_VERSION, "pham_vi": "vi_tri_vat", **({"menh_quai": mq} if mq else {}), **r, **them}


def _goi_y_so_do(inp: "ViTriVatInput") -> dict:
    """SD-1: có sơ đồ theo tỉ lệ → tâm nhà + dấu hiệu GỢI Ý (người dùng xác nhận rồi mới vào bố cục). Không sơ đồ → {}."""
    if inp.khung is None or not any(v.diem is not None for t in inp.tang for v in t.vat):
        return {}
    from app.calc import mat_bang_khung as mk  # noqa: PLC0415
    veto = bo_cuc.dau_hieu_veto()
    ds: list[dict] = []
    for t in sorted(inp.tang, key=lambda x: x.so):
        vat = [v.model_dump(exclude_none=True) for v in t.vat if v.diem is not None]
        for g in mk.goi_y_dau_hieu(vat, inp.khung.rong, inp.khung.sau, inp.khung.luoi if t.so == 1 else None):
            if not any(x["ma"] == g["ma"] for x in ds):
                ds.append({"ma": g["ma"], "hoi": bo_cuc.hoi(g["ma"]), "tang": t.so, "can": g["can"],
                           "nen_xu_ly_truoc": g["ma"] in veto, "trang": bo_cuc.duong_trang(g["ma"])})
    return {"khung": {"tam": list(mk.tam_khung(inp.khung.luoi))}, "dau_hieu_goi_y": ds}
