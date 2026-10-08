# -*- coding: utf-8 -*-
"""PT-V0 / PT-V3 — luận phong thuỷ từ BỐ CỤC NHÀ. Tầng RULES: không gọi LLM, mọi kết luận trỏ về mục KB có nguồn.

Đầu vào là JSON bố cục (schema `app/schemas/bo_cuc.schema.json`). Hôm nay người dùng tự khai qua form
"Khảo sát nhà"; từ PT-V2, JSON do model thị giác trích từ ảnh — luôn qua bước người dùng XÁC NHẬN: dấu hiệu
nguồn "anh"/"video" chưa xác nhận KHÔNG được luận, chỉ trả về danh sách `can_xac_nhan`.

Vị trí phòng tính theo phương nhìn từ TÂM nhà (8 phương + Trung cung). Du niên theo mệnh quái gia chủ (nếu có)
và theo trạch quái (toạ nhà) — hiện cả hai, "hợp" xét theo mệnh gia chủ, không có thì theo trạch.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.calc import phongthuy as pt
from app.kb import phongthuy_kb as kb

Cung9 = Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc", "Trung cung"]
Phong = Literal["cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho", "phong_lam_viec"]
VatHuong = Literal["mieng_bep", "dau_giuong", "ban_lam_viec"]

# Dấu hiệu QUAN SÁT ĐƯỢC (bằng mắt / ảnh) — mã trùng mục `bo_tri` trong KB; nghĩa lấy từ KB, ở đây chỉ có câu hỏi
# để hỏi người dùng (và sau này làm nhãn cho model thị giác). `tot` = dấu hiệu tốt (có thì tốt).
DAU_HIEU: dict[str, dict] = {
    "duong_dam": {"hoi": "Có con đường đâm thẳng vào cửa nhà không?", "nhom": "ngoai_canh"},
    "nga_ba": {"hoi": "Nhà nằm ngay ngã ba / ngã tư không?", "nhom": "ngoai_canh"},
    "cot_dien": {"hoi": "Có cột điện, cây to chắn ngay trước cửa không?", "nhom": "ngoai_canh"},
    "song_truoc": {"hoi": "Trước nhà có sông, hồ, mương nước không?", "nhom": "ngoai_canh"},
    "nghia_trang": {"hoi": "Nhà nhìn thẳng ra nghĩa trang, bệnh viện, nơi thờ tự lớn không?", "nhom": "ngoai_canh"},
    "minh_duong": {"hoi": "Trước cửa có khoảng sân / hiên thoáng, sạch không?", "nhom": "ngoai_canh", "tot": True},
    "no_hau": {"hoi": "Mảnh đất nở hậu (phía sau rộng hơn mặt tiền) không?", "nhom": "ngoai_canh", "tot": True},
    "nha_chu_l": {"hoi": "Nhà hình chữ L / bị khuyết một góc không?", "nhom": "hinh_nha"},
    "bep_doi_cua": {"hoi": "Bếp nhìn thẳng ra cửa chính không?", "nhom": "trong_nha"},
    "cau_thang_cua": {"hoi": "Cầu thang đối diện thẳng cửa chính không?", "nhom": "trong_nha"},
    "guong_cua_chinh": {"hoi": "Có gương chiếu thẳng vào cửa chính không?", "nhom": "trong_nha"},
    "guong_giuong": {"hoi": "Có gương đối diện giường ngủ không?", "nhom": "trong_nha"},
    "cua_doi_nhau": {"hoi": "Có hai cửa phòng đối thẳng nhau không?", "nhom": "trong_nha"},
    "xa_ngang": {"hoi": "Giường hoặc bàn làm việc nằm ngay dưới xà ngang không?", "nhom": "trong_nha"},
    "phong_ngu_tren_bep": {"hoi": "Có phòng ngủ nằm ngay trên bếp (tầng trên) không?", "nhom": "trong_nha"},
    "bep_wc": {"hoi": "Bếp sát / chung vách nhà vệ sinh không?", "nhom": "trong_nha"},
    "quay_lung_cua": {"hoi": "Chỗ ngồi làm việc quay lưng ra cửa không?", "nhom": "trong_nha"},
    "wc_giua_nha": {"hoi": "Nhà vệ sinh nằm ở giữa nhà không?", "nhom": "trong_nha"},
}
TEN_PHONG = {"cua_chinh": "Cửa chính", "phong_ngu_chinh": "Phòng ngủ chính", "bep": "Bếp", "ve_sinh": "Nhà vệ sinh",
             "ban_tho": "Bàn thờ", "phong_lam_viec": "Phòng làm việc"}


class DauHieuVao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    co: bool
    do_tin: float | None = Field(default=None, ge=0, le=1, description="Độ tin (model thị giác); người dùng khai = None")
    nguon: Literal["nguoi_dung", "anh", "video"] = "nguoi_dung"
    xac_nhan: bool = False


class BoCuc(BaseModel):
    """Bố cục nhà đã chuẩn hoá — đầu vào chung cho form khảo sát (hôm nay) và ảnh/video (PT-V2, PT-V4)."""
    model_config = ConfigDict(extra="forbid", title="BoCuc")
    phien_ban: Literal["0.1"] = "0.1"
    loai_nha: Literal["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"] | None = None
    huong_nha_do: float | None = Field(default=None, ge=0, lt=360, description="Độ la bàn HƯỚNG nhà (mặt nhìn ra)")
    huong_nha: Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] | None = None
    vi_tri: dict[Phong, Cung9] = Field(default_factory=dict, description="Phương của phòng nhìn từ tâm nhà")
    huong_do: dict[VatHuong, float] = Field(default_factory=dict, description="Độ la bàn hướng vật dụng (0–360)")
    dau_hieu: dict[Literal[tuple(DAU_HIEU)], DauHieuVao] = Field(default_factory=dict)  # type: ignore[valid-type]


def json_schema() -> dict:
    return BoCuc.model_json_schema()


def _nhan(dh: DauHieuVao) -> bool:
    return dh.co and (dh.xac_nhan or dh.nguon == "nguoi_dung")


def luan(bo_cuc: dict, sinh: dict | None) -> dict:
    """`sinh` = {"nam": int, "gioi_tinh": "nam"|"nu", "ngay": date|None} hoặc None (chỉ luận theo trạch)."""
    b = BoCuc.model_validate(bo_cuc)
    for v in b.huong_do.values():
        if not 0 <= v < 360:
            raise ValueError("Độ hướng phải trong 0 đến dưới 360")
    k = kb.bo_cuc()
    huong_nha = pt.huong_tu_do(b.huong_nha_do) if b.huong_nha_do is not None else b.huong_nha
    trach = pt.trach(huong_nha) if huong_nha else None
    mq = pt.menh_quai(sinh["nam"], sinh["gioi_tinh"], sinh.get("ngay")) if sinh else None
    bang_m = pt.bang_huong(mq["quai"]) if mq else None
    bang_t = pt.bang_huong(trach["quai"]) if trach else None

    vi_tri = []
    for phong, cung in b.vi_tri.items():
        m = k["vi_tri_phong"][phong]
        dm = bang_m.get(cung) if bang_m else None
        dt_ = bang_t.get(cung) if bang_t else None
        xet = dm or dt_
        hop = None if xet is None else (xet in pt.CAT) == (m["nen"] == "cat")
        vi_tri.append({"phong": phong, "ten": TEN_PHONG[phong], "cung": cung, "du_nien_menh": dm,
                       "du_nien_trach": dt_, "nen": m["nen"], "uu_tien": m["uu_tien"], "hop": hop,
                       "kb": f"vi_tri_phong.{phong}"})

    huong = []
    for vat, do in b.huong_do.items():
        h = pt.huong_tu_do(do)
        bang = bang_m or bang_t
        d = bang[h] if bang else None
        huong.append({"doi_tuong": vat, "do": round(do % 360, 1), "huong": h, "du_nien": d,
                      "cat": d in pt.CAT if d else None, "kb": f"huong_vat.{vat}"})

    ccb = None
    if "cua_chinh" in b.vi_tri and b.vi_tri["cua_chinh"] != "Trung cung":
        chu = b.vi_tri.get("phong_ngu_chinh")
        bep = b.vi_tri.get("bep")
        ccb = pt.cua_chu_bep(b.vi_tri["cua_chinh"], chu if chu != "Trung cung" else None,
                             bep if bep != "Trung cung" else None)

    # Dấu hiệu: chỉ luận cái đã xác nhận; suy thêm từ vị trí (WC ở trung cung).
    co = {ma for ma, dh in b.dau_hieu.items() if _nhan(dh)}
    if b.vi_tri.get("ve_sinh") == "Trung cung":
        co.add("wc_giua_nha")
    dau_hieu = []
    for ma in DAU_HIEU:
        if ma in co:
            m = kb.bo_tri(ma)
            dau_hieu.append({"ma": ma, "tot": DAU_HIEU[ma].get("tot", False), "tieu_de": m["tieu_de"],
                             "noi_dung": m["noi_dung"], "goi_y": m["goi_y"], "nguon": m["nguon"]})
    can_xn = [{"ma": ma, "hoi": DAU_HIEU[ma]["hoi"], "do_tin": dh.do_tin, "nguon": dh.nguon}
              for ma, dh in b.dau_hieu.items() if dh.co and not _nhan(dh)]

    giai_vi_tri = [{**k["vi_tri_phong"][x["phong"]], "phong": x["phong"]} for x in vi_tri]
    giai_huong = [{**k["huong_vat"][x["doi_tuong"]], "doi_tuong": x["doi_tuong"]} for x in huong]
    return {
        "da_tinh": {"huong_nha": huong_nha, "trach": trach,
                    "menh_quai": {"quai": mq["quai"], "nhom": mq["nhom"]} if mq else None,
                    "cung_nhom": (pt.nhom(mq["quai"]).split()[0] == trach["nhom"].split()[0]) if mq and trach else None,
                    "vi_tri": vi_tri, "huong": huong, "cua_chu_bep": ccb},
        "dien_giai": {"vi_tri": giai_vi_tri, "huong": giai_huong, "dau_hieu": dau_hieu},
        "tu_soi": k["tu_soi"],
        "can_xac_nhan": can_xn,
        "luu_y": k["luu_y"],
        **kb.meta(),
    }
