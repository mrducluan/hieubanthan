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
    "bep_doi_cua": {"hoi": "Bếp nấu (mặt bếp sinh nhiệt, không tính bàn đảo) nhìn thẳng ra cửa chính không?", "nhom": "trong_nha"},
    "cau_thang_cua": {"hoi": "Cầu thang đối diện thẳng cửa chính không?", "nhom": "trong_nha"},
    "guong_cua_chinh": {"hoi": "Có gương chiếu thẳng vào cửa chính không?", "nhom": "trong_nha"},
    "guong_giuong": {"hoi": "Có gương đối diện giường ngủ không?", "nhom": "trong_nha"},
    "cua_doi_nhau": {"hoi": "Có hai cửa phòng đối thẳng nhau không?", "nhom": "trong_nha"},
    "xa_ngang": {"hoi": "Giường hoặc bàn làm việc nằm ngay dưới xà ngang không?", "nhom": "trong_nha"},
    "phong_ngu_tren_bep": {"hoi": "Có phòng ngủ nằm ngay trên bếp (tầng trên) không?", "nhom": "trong_nha"},
    "bep_wc": {"hoi": "Bếp sát / chung vách nhà vệ sinh không?", "nhom": "trong_nha"},
    "quay_lung_cua": {"hoi": "Chỗ ngồi làm việc quay lưng ra cửa không?", "nhom": "trong_nha"},
    "wc_giua_nha": {"hoi": "Nhà vệ sinh nằm ở giữa nhà không?", "nhom": "trong_nha"},
    # Q6 (2026-10-22, hai dấu hiệu từ luật thực hành Drive): xuyên đường sát ở căn hộ + bàn thờ dưới luồng gió.
    "cua_thong_ban_cong": {"hoi": "Mở cửa chính là nhìn thẳng ra ban công / cửa sổ lớn phía sau không?", "nhom": "trong_nha"},
    "ban_tho_gio_thoi": {"hoi": "Điều hoà hoặc quạt trần thổi thẳng vào bàn thờ không?", "nhom": "trong_nha"},
}
# Q1: dấu hiệu nhóm "veto" — đã xác nhận thì mức chương liên quan không vượt "Cân bằng" (đọc từ cờ `veto` trong KB bo_tri).
def dau_hieu_veto() -> set[str]:
    return {ma for ma in DAU_HIEU if (kb.bo_tri(ma) or {}).get("veto")}


# Q5: ba mức chi phí của việc nên làm (KB bo_tri[*].viec[*].chi_phi).
CHI_PHI = {"khong_ton": "0 đồng — kê lại, đổi thói quen", "it_tien": "Ít tiền — đèn, rèm, cây, quạt hút", "sua_chua": "Sửa chữa — vách, trần, đổi cửa"}
# Q4: hai lối giải thích dấu hiệu — "sach_xua" (KB noi_dung) / "doi_song" (KB giai_thich_hien_dai).
GocNhin = Literal["sach_xua", "doi_song"]
TEN_PHONG = {"cua_chinh": "Cửa chính", "phong_ngu_chinh": "Phòng ngủ chính", "bep": "Bếp", "ve_sinh": "Nhà vệ sinh",
             "ban_tho": "Bàn thờ", "phong_lam_viec": "Phòng làm việc"}


class DauHieuVao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    co: bool
    do_tin: float | None = Field(default=None, ge=0, le=1, description="Độ tin (model thị giác); người dùng khai = None")
    nguon: Literal["nguoi_dung", "anh", "video"] = "nguoi_dung"
    xac_nhan: bool = False


class MatBang(BaseModel):
    """Q2 — mặt bằng vẽ tay trên lưới N×N (3–12): hàng trên cùng = mặt trước nhà. Ô tô = '1'. `phong` = ô đại diện của
    từng phòng (tính phương từ tâm nhà), `ban_cong` = ô ban công / cửa sổ lớn (xét cửa chính thông thẳng ra sau)."""
    model_config = ConfigDict(extra="forbid")
    luoi: list[str] = Field(min_length=3, max_length=12)
    phong: dict[Phong, tuple[int, int]] = Field(default_factory=dict)
    ban_cong: tuple[int, int] | None = None


class BoCuc(BaseModel):
    """Bố cục nhà đã chuẩn hoá — đầu vào chung cho form khảo sát (hôm nay) và ảnh/video (PT-V2, PT-V4)."""
    model_config = ConfigDict(extra="forbid", title="BoCuc")
    phien_ban: Literal["0.1", "0.2"] = "0.2"
    loai_nha: Literal["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"] | None = None
    huong_nha_do: float | None = Field(default=None, ge=0, lt=360, description="Độ la bàn HƯỚNG nhà (mặt nhìn ra)")
    huong_nha: Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] | None = None
    vi_tri: dict[Phong, Cung9] = Field(default_factory=dict, description="Phương của phòng nhìn từ tâm nhà")
    huong_do: dict[VatHuong, float] = Field(default_factory=dict, description="Độ la bàn hướng vật dụng (0–360)")
    dau_hieu: dict[Literal[tuple(DAU_HIEU)], DauHieuVao] = Field(default_factory=dict)  # type: ignore[valid-type]
    mat_bang: MatBang | None = Field(default=None, description="Q2: mặt bằng vẽ tay — suy vị trí phòng, WC giữa nhà, khuyết góc, cửa thông ban công")


def json_schema() -> dict:
    return BoCuc.model_json_schema()


def _nhan(dh: DauHieuVao) -> bool:
    return dh.co and (dh.xac_nhan or dh.nguon == "nguoi_dung")


def _mat_bang(b: "BoCuc", huong_do: float | None) -> tuple[dict | None, dict[str, str], set[str]]:
    """Q2: phân tích lưới vẽ tay → (kết quả, vị trí phòng suy ra, dấu hiệu suy ra). Vị trí người dùng khai tay thắng."""
    if b.mat_bang is None:
        return None, {}, set()
    from app.calc import mat_bang as mb  # noqa: PLC0415
    r = mb.phan_tich(b.mat_bang.luoi, huong_do, {k2: tuple(v) for k2, v in b.mat_bang.phong.items()},
                     tuple(b.mat_bang.ban_cong) if b.mat_bang.ban_cong else None)
    vi_tri = {ma: x["phuong"] for ma, x in r["phuong_phong"].items() if x["phuong"]}
    dh = set()
    if r["wc_trung_cung"]:
        dh.add("wc_giua_nha")
    if r["khuyet_goc"]:
        dh.add("nha_chu_l")
    if (r.get("cua_thong_ban_cong") or {}).get("thang_hang"):
        dh.add("cua_thong_ban_cong")
    r["dau_hieu_suy_ra"] = sorted(dh)
    return r, vi_tri, dh


def _quy_tac(loai_nha: str | None, co: set[str]) -> list[dict]:
    """Q6: luật thực hành (KB quy_tac_thuc_hanh) áp dụng cho bố cục này — chỉ lọc theo điều kiện, không sinh lời mới."""
    ra = []
    for ma, q in (kb.quy_tac_thuc_hanh() or {}).items():
        if ma.startswith("_") or not isinstance(q, dict):
            continue
        ad = q.get("ap_dung") or {}
        if ad.get("luon"):
            continue                                   # luật nền (Lập xuân, sửa thói quen) — ghi ở báo cáo, không lặp từng bố cục
        if ad.get("loai_nha") and loai_nha not in ad["loai_nha"]:
            continue
        if ad.get("dau_hieu") and not (set(ad["dau_hieu"]) & co):
            continue
        if ad.get("van") or ad.get("sao"):
            continue                                   # luật Huyền Không — áp ở to_hop_cung
        if not ad.get("dau_hieu") and not ad.get("loai_nha"):
            continue
        ra.append({"ma": ma, "tieu_de": q["tieu_de"], "noi_dung": q["noi_dung"]})
    return ra


def _viec_cho(ma: str, m: dict, loai_nha: str | None) -> list[dict]:
    """Việc nên làm theo 3 mức chi phí; căn hộ + dấu hiệu kết cấu → bỏ việc đụng kết cấu (luật khong_dap_ket_cau)."""
    viec = [dict(v) for v in (m.get("viec") or [])]
    if loai_nha == "can_ho" and ma in ("wc_giua_nha", "xa_ngang"):
        viec = [v for v in viec if v["chi_phi"] != "sua_chua" or any(t in v["lam"] for t in ("thạch cao", "chiều mở cửa", "cửa giấu", "khu khô"))]
    return viec


def luan(bo_cuc: dict, sinh: dict | None, goc_nhin: str = "sach_xua") -> dict:
    """`sinh` = {"nam": int, "gioi_tinh": "nam"|"nu", "ngay": date|None} hoặc None (chỉ luận theo trạch).
    `goc_nhin` (Q4): "sach_xua" — dấu hiệu nói theo cổ thư / dân gian; "doi_song" — nói theo ánh sáng, gió, tiếng ồn, tầm nhìn
    (cả hai đều trả về trong `giai_thich`, chỉ đổi câu đưa lên trước)."""
    b = BoCuc.model_validate(bo_cuc)
    for v in b.huong_do.values():
        if not 0 <= v < 360:
            raise ValueError("Độ hướng phải trong 0 đến dưới 360")
    if goc_nhin not in ("sach_xua", "doi_song"):
        raise ValueError("goc_nhin phải là sach_xua hoặc doi_song")
    k = kb.bo_cuc()
    huong_nha = pt.huong_tu_do(b.huong_nha_do) if b.huong_nha_do is not None else b.huong_nha
    do_cho_mb = b.huong_nha_do if b.huong_nha_do is not None else (pt.HUONG.index(b.huong_nha) * 45.0 if b.huong_nha else None)
    mat_bang, vi_tri_mb, dh_mb = _mat_bang(b, do_cho_mb)
    if vi_tri_mb:
        b.vi_tri = {**vi_tri_mb, **b.vi_tri}     # người khai tay thắng ô vẽ
    trach = pt.trach(huong_nha) if huong_nha else None
    mq = pt.menh_quai(sinh["nam"], sinh["gioi_tinh"], sinh.get("ngay"), sinh.get("moc_nam", "lap_xuan")) if sinh else None
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
    co = {ma for ma, dh in b.dau_hieu.items() if _nhan(dh)} | dh_mb
    if b.vi_tri.get("ve_sinh") == "Trung cung":
        co.add("wc_giua_nha")
    # UI-PT 4 ("Tôi đã xử lý"): người dùng khai rõ `co: false` thắng dấu hiệu máy suy từ mặt bằng / vị trí phòng
    # (đã che xà, đã dời WC…) — chỉ nguồn người dùng; nguồn ảnh/video không ghi đè.
    co -= {ma for ma, dh in b.dau_hieu.items() if not dh.co and dh.nguon == "nguoi_dung"}
    veto_ds = dau_hieu_veto()
    dau_hieu = []
    for ma in DAU_HIEU:
        if ma in co:
            m = kb.bo_tri(ma)
            xua, nay = m["noi_dung"], m.get("giai_thich_hien_dai") or m["noi_dung"]
            dau_hieu.append({"ma": ma, "tot": DAU_HIEU[ma].get("tot", False), "tieu_de": m["tieu_de"],
                             "noi_dung": nay if goc_nhin == "doi_song" else xua, "goi_y": m["goi_y"], "nguon": m["nguon"],
                             "veto": ma in veto_ds, "giai_thich": {"sach_xua": xua, "doi_song": nay},
                             "viec": _viec_cho(ma, m, b.loai_nha), "tu_mat_bang": ma in dh_mb})
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
        # Q1 / Q2 / Q6: dấu hiệu veto đã xác nhận (trần mức), mặt bằng vẽ tay, luật thực hành đang áp dụng.
        "veto_da_xac_nhan": [d["ma"] for d in dau_hieu if d["veto"]],
        "mat_bang": mat_bang,
        "quy_tac": _quy_tac(b.loai_nha, co),
        "goc_nhin": goc_nhin,
        "chi_phi": CHI_PHI,
        **kb.meta(),
    }
