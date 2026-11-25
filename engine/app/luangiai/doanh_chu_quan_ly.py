# -*- coding: utf-8 -*-
"""Quản lý nhân sự theo ngũ hành (QLNS-1, chủ dự án 2026-11-25) — RULES tất định, không gọi LLM, không lưu dữ liệu.

Chỉ ĐỌC kết quả `calc.doanh_chu.ban_do_doi_ngu` (một bộ tính) rồi ghép thêm phần người quản lý dùng được ngay:
  * `ke_hoach_30_ngay` — 4–5 việc theo tuần, mỗi việc nêu vì sao (hành mỏng / trội của nhóm, cặp cần quy ước, người bù khuyết);
  * `tinh_huong` — ≤ 3 tình huống quản lý ĐÚNG với nhóm này (chọn theo luật công khai bên dưới) kèm câu mở lời mẫu;
  * `cau_hoi_1_1` trên thẻ từng người — 2 câu hỏi cho buổi nói chuyện riêng (theo đường đời).
`ca_nhan()` dựng bản "Cách làm việc của bạn" cho chính thành viên được mời (người ấy tự xem, không gửi ai).
`danh_muc()` trả kho tình huống + vai trò 5 hành cho trang công khai (một nguồn, web không viết cứng tri thức).
Ranh giới: gợi ý phối hợp và trao đổi — không dùng tuyển chọn, đánh giá, xếp lương, kỷ luật (test chặn từ vựng)."""
from __future__ import annotations

import re

from app import ngon_ngu
from app.calc import doanh_chu as dc
from app.kb.nap import doc, nho

TROI_MO_RONG = ("Mộc", "Hỏa")
TROI_KIEM_SOAT = ("Kim", "Thổ")
DD_TU_QUYET = (1, 8, 22)
DD_OM_VIEC = (2, 6, 33)
DD_Y_TUONG = (3, 5)
DD_IT_NOI = (2, 7)
NCN_DOI_NHIP = (5, 7, 9)
_MA_HANH = {"Kim": "kim", "Mộc": "moc", "Thủy": "thuy", "Hỏa": "hoa", "Thổ": "tho"}


@nho
def kb() -> dict:
    return doc("doanh_chu_quan_ly_kb.json")


def _hanh(h: str) -> str:
    return h if ngon_ngu.la_viet() else dc._HANH_EN.get(h, h)


def _ncn(v) -> int:
    return int(v[1]) if isinstance(v, (list, tuple)) else int(v)


def _dien(s: str, **kw) -> str:
    for k, v in kw.items():
        s = s.replace("{" + k + "}", str(v))
    return s


def _noi(ten: list[str]) -> str:
    if not ten:
        return ""
    if len(ten) == 1:
        return ten[0]
    va = " và " if ngon_ngu.la_viet() else " and "
    return ", ".join(ten[:-1]) + va + ten[-1]


def _vai_tro(h: str) -> str:
    return dc._VAI_TRO_HANH[h]["vi" if ngon_ngu.la_viet() else "en"][0]


def cau_hoi_1_1(duong_doi: int) -> list[str]:
    d = kb()["dd"]
    return list((d.get(str(duong_doi)) or d["4"])["hoi"])


def ke_hoach_30_ngay(kq: dict) -> list[dict]:
    k, kh = kb(), kb()["ke_hoach"]
    tuan = k["tuan"]
    cb = kq["can_bang_ngu_hanh"]
    thieu, troi = cb["hanh_thieu"], cb["hanh_troi"]
    ds = kq["ma_tran_phoi_hop"]
    ra: list[dict] = []

    bu = k["hanh"][thieu]["bu"]
    ra.append({"tuan": tuan["1"], "ma": f"bu_truc.{_MA_HANH[thieu]}", "tieu_de": bu["tieu_de"], "viec": bu["viec"],
               "cach_do": bu["cach_do"], "vi_sao": _dien(kh["bu_truc"]["vi_sao"], hanh=_hanh(thieu), vai_tro=_vai_tro(thieu))})

    quy_che = [n["ten"] for n in ds if n["muc_phoi_hop"] == "can_quy_che_ro"]
    if quy_che:
        m = kh["quy_che"]
        ra.append({"tuan": tuan["1"], "ma": "quy_che", "tieu_de": _dien(m["tieu_de"], ten=_noi(quy_che)),
                   "viec": m["viec"], "vi_sao": m["vi_sao"], "ai": quy_che})

    bu_khuyet = [n["ten"] for n in ds if n["chi_so"].get("bu_khuyet_ngu_hanh")]
    if bu_khuyet:
        m = kh["bu_khuyet"]
        hanh_bu = _hanh(kq["ong_chu"]["hanh_can_bu"])
        ra.append({"tuan": tuan["2"], "ma": "bu_khuyet", "tieu_de": _dien(m["tieu_de"], ten=_noi(bu_khuyet[:2])),
                   "viec": _dien(m["viec"], hanh=hanh_bu), "vi_sao": m["vi_sao"], "ai": bu_khuyet[:2]})
    elif kq.get("goi_y_ghep_cap"):
        c = kq["goi_y_ghep_cap"][0]
        m = kh["ghep_cap"]
        hai = [c["ten_a"], c["ten_b"]]
        ra.append({"tuan": tuan["2"], "ma": "ghep_cap", "tieu_de": _dien(m["tieu_de"], ten=_noi(hai)),
                   "viec": m["viec"], "vi_sao": m["vi_sao"], "ai": hai})

    tr = k["hanh"][troi]["troi"]
    ra.append({"tuan": tuan["3"], "ma": f"troi_truc.{_MA_HANH[troi]}", "tieu_de": tr["tieu_de"], "viec": tr["viec"],
               "vi_sao": _dien(kh["troi_truc"]["vi_sao"], hanh=_hanh(troi), vai_tro=_vai_tro(troi))})

    m = kh["mot_mot"]
    ra.append({"tuan": tuan["4"], "ma": "mot_mot", "tieu_de": m["tieu_de"], "viec": m["viec"], "vi_sao": m["vi_sao"]})
    return ra


def _th(ma: str, ai: list[str], **kw) -> dict:
    m = kb()["tinh_huong"][ma]
    return {"ma": ma, "van_de": m["van_de"], "goc_nhin": _dien(m["goc_nhin"], **kw), "mo_loi": _dien(m["mo_loi"], **kw),
            "viec": m["viec"], "ai": ai}


def tinh_huong(kq: dict, toi_da: int = 3) -> list[dict]:
    """Luật chọn (theo thứ tự ưu tiên, mỗi luật tối đa một tình huống):
    1. phan_bien_cang — có người đường đời 1/8/22 cần quy ước trao đổi, hoặc cả người quản lý và người ấy cùng 1/8/22;
    2. hai_truc_va_cham — có người hành trội Mộc/Hỏa và có người hành trội Kim/Thổ;
    3. ban_hang_sot_quy_trinh — nhóm trội Mộc/Hỏa và mỏng Kim/Thổ;
    4. y_tuong_nhieu — có người đường đời 3/5 trong nhóm mỏng Kim/Thổ;
    5. nguoi_om_viec — có người đường đời 2/6/33;
    6. it_noi_trong_hop — có người đường đời 2/7 (chưa dùng ở luật 5);
    7. doi_nhip — có người năm cá nhân 5/7/9;
    không luật nào khớp → giu_nhip."""
    ds = kq["ma_tran_phoi_hop"]
    cb = kq["can_bang_ngu_hanh"]
    thieu, troi = cb["hanh_thieu"], cb["hanh_troi"]
    dd_chu = kq["ong_chu"]["duong_doi"]
    ra: list[dict] = []

    def them(x: dict) -> None:
        if len(ra) < toi_da:
            ra.append(x)

    cang = [n for n in ds if n["chi_so"]["duong_doi"] in DD_TU_QUYET
            and (n["muc_phoi_hop"] == "can_quy_che_ro" or dd_chu in DD_TU_QUYET)]
    if cang:
        them(_th("phan_bien_cang", [cang[0]["ten"]], ten=cang[0]["ten"]))
    mo = [n for n in ds if n["chi_so"]["hanh_manh"] in TROI_MO_RONG]
    ks = [n for n in ds if n["chi_so"]["hanh_manh"] in TROI_KIEM_SOAT]
    if mo and ks:
        them(_th("hai_truc_va_cham", [mo[0]["ten"], ks[0]["ten"]], ten_a=mo[0]["ten"], ten_b=ks[0]["ten"]))
    if troi in TROI_MO_RONG and thieu in TROI_KIEM_SOAT:
        them(_th("ban_hang_sot_quy_trinh", [], hanh_troi=_hanh(troi), hanh_thieu=_hanh(thieu)))
    if thieu in TROI_KIEM_SOAT:
        yt = [n for n in ds if n["chi_so"]["duong_doi"] in DD_Y_TUONG]
        if yt:
            them(_th("y_tuong_nhieu", [yt[0]["ten"]], ten=yt[0]["ten"], hanh_thieu=_hanh(thieu)))
    om = [n for n in ds if n["chi_so"]["duong_doi"] in DD_OM_VIEC]
    if om:
        them(_th("nguoi_om_viec", [om[0]["ten"]], ten=om[0]["ten"]))
    da = {x for t in ra for x in t["ai"]}
    it = [n for n in ds if n["chi_so"]["duong_doi"] in DD_IT_NOI and n["ten"] not in da]
    if it:
        them(_th("it_noi_trong_hop", [it[0]["ten"]], ten=it[0]["ten"]))
    dn = [n for n in ds if _ncn(n["chi_so"]["nam_ca_nhan"]) in NCN_DOI_NHIP]
    if dn:
        pha = kb()["pha"][str(_ncn(dn[0]["chi_so"]["nam_ca_nhan"]))]
        them(_th("doi_nhip", [dn[0]["ten"]], ten=dn[0]["ten"], pha=pha))
    if not ra:
        ra.append(_th("giu_nhip", []))
    return ra


def lam_giau(kq: dict) -> dict:
    """Thêm phần quản lý vào kết quả Bản đồ đội ngũ (không đổi trường cũ)."""
    for n in kq["ma_tran_phoi_hop"]:
        n["cau_hoi_1_1"] = cau_hoi_1_1(n["chi_so"]["duong_doi"])
    kq["ke_hoach_30_ngay"] = ke_hoach_30_ngay(kq)
    kq["tinh_huong"] = tinh_huong(kq)
    return kq


def ca_nhan(ngay: int, thang: int, nam: int, gioi_tinh: str, nam_xem: int) -> dict:
    """Bản "Cách làm việc của bạn" cho chính thành viên được mời — đọc đúng hồ sơ của `calc.doanh_chu` (một bộ tính)."""
    vi = ngon_ngu.la_viet()
    hs = dc._ho_so_co_ban(ngay, thang, nam, gioi_tinh, nam_xem)
    k = kb()
    d = k["dd"].get(str(hs["duong_doi"])) or k["dd"]["4"]
    vt_ten, vt_hq = dc._VAI_TRO_HANH[hs["hanh_manh"]]["vi" if vi else "en"]
    ncn = _ncn(hs["nam_ca_nhan"])
    nhip_vi, nhip_en = dc._NHIP_NAM.get(ncn, dc._NHIP_NAM[4])
    return {
        "nhan": k["ca_nhan"],
        "hanh_manh": _hanh(hs["hanh_manh"]),
        "vai_tro_hop": vt_ten,
        "gia_tri": vt_hq,
        "duong_doi": hs["duong_doi"],
        "nam_ca_nhan": ncn,
        "nam_xem": nam_xem,
        "manh": d["manh"],
        "de_y": d["de_y"],
        "lam_tot": d["lam_tot"],
        "trao_doi": d["trao_doi"],
        "nhip_nam": nhip_vi if vi else nhip_en,
    }


_DAU_CAU = re.compile(r"(^|[.!?]\s+|[“\"]\s*)([^\W\d_])", re.U)


def _hoa_dau(s: str) -> str:
    """Viết hoa chữ đầu câu / đầu lời trích — bản ẩn danh thay tên người bằng cụm chữ thường ("người ấy")."""
    return _DAU_CAU.sub(lambda m: m.group(1) + m.group(2).upper(), s)


def danh_muc() -> dict:
    """Kho tình huống (bản ẩn danh) + vai trò 5 hành + kế hoạch mẫu 4 tuần — cho trang công khai /quan-ly-nhan-su
    và ảnh minh hoạ của trang (một nguồn: web không viết cứng tri thức)."""
    vi = ngon_ngu.la_viet()
    an = kb()["an_danh"]
    th = [{"ma": ma, "van_de": m["van_de"], "goc_nhin": _hoa_dau(_dien(m.get("goc_nhin_an") or m["goc_nhin"], **an)),
           "mo_loi": _hoa_dau(_dien(m["mo_loi"], **an)), "viec": m["viec"]}
          for ma, m in kb()["tinh_huong"].items() if ma != "giu_nhip"]
    vt = [{"hanh": _hanh(h), "vai_tro": dc._VAI_TRO_HANH[h]["vi" if vi else "en"][0],
           "gia_tri": dc._VAI_TRO_HANH[h]["vi" if vi else "en"][1]} for h in dc.HANH_5]
    return {"tinh_huong": th, "vai_tro_hanh": vt, "ke_hoach_mau": [dict(x) for x in kb()["ke_hoach_mau"]]}
