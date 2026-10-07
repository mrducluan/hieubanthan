# -*- coding: utf-8 -*-
"""Hỏi đáp Tử vi (HH-2) — RULES: phân loại câu hỏi, chọn cung/sao/lớp hạn cần xem,
gói bằng chứng chỉ từ lá số (iztro, CALC) + KB; NARRATIVE: template (+ LLM có kiểm tra).

Kỷ luật từ skill `tuvi-vn` (source-skills/tuvi-vn/SKILL.md):
  - LLM không an sao, không tự tính hạn: lá số và vận hạn do engine (iztro 2.6.0) tính.
  - Không phán bệnh, thọ yểu, tai nạn, kiện tụng, con số tiền; hạn = chủ đề giai đoạn.
  - Ba lớp hạn đọc tách bạch, ưu tiên đã khoá: đại hạn > lưu niên > tiểu hạn.
  - Không xem lá số người khác khi thiếu dữ liệu/đồng ý; hợp hôn không phán "khắc".
Chế độ (quyết định 2026-09-30): tham_khao (mặc định) | chi_tiet.
"""
from __future__ import annotations

import datetime as dt
import re

from app import config
from app.calc import tuvi_an_sao as az, tuvi_cach_cuc, tuvi_do_sang_vn
from app.hoidap import chung
from app.kb import tuvi_kb as kb
from app.luangiai import hoi as _h
from app.narrative import hoi_van

CHE_DO = ("tham_khao", "chi_tiet")
THU_TU_CUNG = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di",
               "Nô Bộc", "Quan Lộc", "Điền Trạch", "Phúc Đức", "Phụ Mẫu"]
DO_SANG_CHUAN = {"Hạn": "Hãm"}          # iztro vi-VN ghi "Hạn" cho 陷 (hãm)
HOA = {"loc": "Lộc", "quyen": "Quyền", "khoa": "Khoa", "ky": "Kỵ"}
THU_TU_HOA = ["Lộc", "Quyền", "Khoa", "Kỵ"]

# ------------------------------------------------------------------ nhận diện
CUNG_KW = {
    "Mệnh": [r"cung menh", r"thu menh", r"o menh", r"toa menh", r"menh vo chinh dieu", r"menh co",
             r"tai menh", r"cu menh"],
    "Huynh Đệ": [r"huynh de"], "Phu Thê": [r"phu the"], "Tử Nữ": [r"tu nu", r"tu tuc"],
    "Tài Bạch": [r"tai bach"], "Tật Ách": [r"tat ach"], "Thiên Di": [r"thien di"],
    "Nô Bộc": [r"no boc", r"giao huu"], "Quan Lộc": [r"quan loc"], "Điền Trạch": [r"dien trach"],
    "Phúc Đức": [r"phuc duc"], "Phụ Mẫu": [r"phu mau"],
}
CHU_DE_CUNG = [   # (cung, mẫu) — câu hỏi cá nhân không nêu tên cung
    ("Phu Thê", [r"tinh duyen", r"hon nhan", r"vo chong", r"nguoi yeu", r"ket hon", r"lay chong",
                 r"lay vo", r"dao hoa", r"hong loan", r"hai doi", r"tinh yeu", r"chong toi", r"vo toi",
                 r"muon chong", r"muon vo", r"ly hon", r"tinh cam", r"lay (nguoi|ai)", r"ban doi",
                 r"nua kia", r"chong con", r"nha chong", r"nha vo", r"me chong", r"bo chong"]),
    ("Tật Ách", [r"suc khoe", r"cang thang", r"ap luc", r"nghi ngoi", r"can bang", r"met moi"]),
    ("Tài Bạch", [r"lam an", r"tien", r"tai chinh", r"giau", r"lam giau", r"thu nhap", r"tai loc", r"lua tien",
                  r"dau tu", r"no nan", r"tieu (hoang|xai|pha)", r"chi tieu"]),
    ("Điền Trạch", [r"nha cua", r"nha dat", r"bat dong san", r"mua nha", r"nha o", r"dat dai", r"tai san", r"thua ke"]),
    ("Nô Bộc", [r"dong nghiep", r"cap duoi", r"ban be", r"choi xau", r"nguoi giup do", r"quy nhan",
                r"doi tac", r"hop tac"]),
    ("Quan Lộc", [r"su nghiep", r"cong viec", r"nghe", r"lam viec", r"thang chuc", r"kinh doanh",
                  r"nha nuoc", r"tu nhan", r"lam chu", r"khoi nghiep", r"cong danh", r"hoc hanh",
                  r"thi cu", r"lam quan", r"chuc vu", r"hop nghe"]),
    ("Tử Nữ", [r"con cai", r"con toi", r"sinh con", r"co con", r"hiem muon"]),
    ("Phụ Mẫu", [r"cha me", r"bo me", r"cap tren", r"sep"]),
    ("Huynh Đệ", [r"anh chi em", r"anh em", r"chi em"]),
    ("Thiên Di", [r"di xa", r"xuat ngoai", r"nuoc ngoai", r"dinh cu", r"xa que", r"moi truong", r"du hoc"]),
    ("Phúc Đức", [r"phuc", r"dong ho", r"tam linh", r"binh an", r"to tien"]),
]
SAO_KW = {"Tử Vi": [r"sao tu vi", r"tu vi (thu|o|tai|toa|nam|cu|dong)", r"(co|nguoi co|gap) tu vi"],
          **{s: [chung.chuan_hoa(s)] for s in
             ["Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
              "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"]}}
PHU_KW = {"Hàm Trì": [r"dao hoa", r"ham tri"], "Hỏa Tinh": [r"hoa tinh"]}

CA_NHAN = [r"toi", r"cua minh", r"minh co", r"minh la", r"la so cua", r"em co", r"cua em", r"toi co"]
HOP_HON = [r"hop tuoi", r"hop hon", r"hop nhau", r"xung khac", r"ky nhau", r"xem tuoi lam an",
           r"tuoi \w+ lay (chong|vo) tuoi", r"hai la so", r"hop voi (anh|chi|co|chong|vo|nguoi)"]
CON = [r"(cho|cua) con toi", r"la so cho con", r"be nha toi", r"sinh con nam nao", r"sinh con gio",
       r"con toi sinh", r"sinh con thang", r"nen sinh con"]
NGUOI_KHAC = [r"cho (chong|vo|me|bo|ong|ba|anh|chi|em|ban gai|ban trai|ban|nguoi yeu|sep) toi",
              r"(sep|chong|vo|me|bo|nguoi yeu|ban trai|ban gai|dong nghiep) toi (tuoi|sinh|co so|la nguoi)",
              r"xem (tu vi|la so) cho (?!toi)", r"tuoi \w+ \w+, tinh cach"]
HAN = [r"dai han", r"tieu han", r"luu nien", r"nam nay", r"nam sau", r"nam toi", r"nam 20\d\d",
       r"muoi nam", r"10 nam", r"nam nao", r"khi nao", r"bao gio", r"thang nao", r"han gi",
       r"tam tai", r"thai tue", r"nam tuoi", r"van han", r"hao tai", r"hanh han"]
SU_KIEN = [r"tai nan", r"kien tung", r"mat tien", r"hao tai", r"lay chong", r"lay vo", r"co con",
           r"phat tai", r"han nang", r"thang chuc", r"ket hon"]
NAM_SAU = [r"nam sau", r"nam toi"]
TOI_KE = [r"dai han toi", r"muoi nam toi", r"10 nam toi", r"dai han sau"]
SU_KIEN_CHAN_MEM = [r"tai nan", r"thang kien"]   # chi_tiet: trả lời kèm lưu ý thay vì từ chối


def _co_ten(t: str, bang: dict[str, list[str]]) -> list[str]:
    return [k for k, m in bang.items() if chung.co(t, m)]


def _hoa_nhac(t: str) -> list[str]:
    return [v for k, v in HOA.items() if re.search(rf"(?<!\w)hoa {k}(?!\w)", t)]


def _phu_nhac(t: str) -> list[str]:
    ds = [p for p, m in PHU_KW.items() if chung.co(t, m)]
    for p in kb.ten_phu_tinh():
        if p not in ds and p not in PHU_KW and chung.co(t, [chung.chuan_hoa(p)]):
            ds.append(p)
    return ds


def _giai_thich_khop(t: str) -> list[str]:
    return [ma for ma, m in kb.giai_thich_tat_ca().items() if chung.co(t, m["tu_khoa"])]


def _nam_nhac(t: str) -> int | None:
    m = re.search(r"nam (20\d\d)", t)
    return int(m.group(1)) if m else None


def phan_loai(cau_hoi: str, che_do: str = "tham_khao") -> dict:
    gioi_thieu, t_chinh = _h._tach_gioi_thieu(cau_hoi)
    t = chung.chuan_hoa(cau_hoi)
    if gioi_thieu and (chung.co(gioi_thieu, [r"dai han", r"luu nien", r"tieu han", r"la so", r"cung \w+"])
                       or _co_ten(gioi_thieu, CUNG_KW)):
        t_chinh = t                     # "Tôi đang ở đại hạn…" không phải lời giới thiệu
    kq = {"cau_chuan_hoa": t, "che_do": che_do, "loai": None, "xu_ly": "tra_loi",
          "cung": _co_ten(t_chinh, CUNG_KW), "sao": _co_ten(t_chinh, SAO_KW), "hoa": _hoa_nhac(t_chinh),
          "phu": _phu_nhac(t_chinh), "giai_thich": _giai_thich_khop(t_chinh),
          "ca_nhan": chung.co(t_chinh, CA_NHAN), "su_kien": chung.co(t, SU_KIEN),
          "nam_xem": _nam_nhac(t), "han_sau": chung.co(t, NAM_SAU), "han_toi": chung.co(t, TOI_KE)}
    t_loc = t
    if che_do == "chi_tiet":
        for m in SU_KIEN_CHAN_MEM:
            t_loc = re.sub(m, " ", t_loc)
    db = chung.dac_biet(t_loc)
    if db:
        kq.update(xu_ly=db, loai="dac_biet")
        return kq
    if chung.co(t, HOP_HON):
        kq["loai"] = "hop_hon"
    elif chung.co(t, CON):
        kq["loai"] = "la_so_con"
    elif chung.co(t, NGUOI_KHAC):
        kq["loai"] = "nguoi_khac"
    elif kq["giai_thich"] and not kq["ca_nhan"]:
        kq["loai"] = "ky_thuat"
    elif chung.co(t_chinh, HAN) and kq["ca_nhan"] or chung.co(t_chinh, [r"dai han", r"luu nien", r"tieu han"]):
        kq["loai"] = "han"
    elif not kq["ca_nhan"] and (kq["sao"] or kq["hoa"]) and (kq["cung"] or kq["sao"]):
        kq["loai"] = "tu_hoa_cung" if kq["hoa"] and kq["cung"] else "sao_cung"
    elif not kq["ca_nhan"] and kq["phu"] and chung.co(t_chinh, [r"la gi", r"y nghia", r"nghia la"]):
        kq["loai"] = "phu_tinh"
    elif chung.co(t_chinh, HAN) and not kq["cung"]:
        kq["loai"] = "han"
    else:
        kq["loai"] = "la_so"
    if kq["loai"] == "la_so" and not kq["cung"]:
        kq["cung"] = [c for c, m in CHU_DE_CUNG if chung.co(t_chinh, m)][:2] or ["Mệnh"]
    if kq["loai"] == "la_so" and "Tật Ách" in kq["cung"]:
        kq["xu_ly"] = "tra_loi_kem_luu_y"
    if kq["loai"] == "han":
        kq["xu_ly"] = "tra_loi_kem_luu_y"
        kq["cung"] = kq["cung"] or [c for c, m in CHU_DE_CUNG if chung.co(t_chinh, m)][:1]
    return kq


# ------------------------------------------------------------------ lá số (CALC → dạng gọn)
def tom_tat(la: dict) -> dict:
    """Lá số thô iztro (vi-VN) → dạng gọn cho RULES: cung theo tên, sao, độ sáng, tứ hoá."""
    ten_phu = set(kb.ten_phu_tinh())
    cung, tu_hoa = [], []
    for p in la["palaces"]:
        # Độ sáng chính tinh: mặc định bảng Nam phái (chốt 2026-10-01); giữ bảng phái Trung (iztro) để đối chiếu.
        chinh = [{"ten": s["name"],
                  "do_sang": tuvi_do_sang_vn.do_sang(s["name"], p["earthlyBranch"])
                  or DO_SANG_CHUAN.get(s["brightness"], s["brightness"]) or None,
                  "do_sang_trung": DO_SANG_CHUAN.get(s["brightness"], s["brightness"]) or None,
                  "tu_hoa": s["mutagen"] or None} for s in p["majorStars"]]
        phu = [s["name"] for s in p["minorStars"] + p["adjectiveStars"] if s["name"] in ten_phu]
        for s in p["majorStars"] + p["minorStars"]:
            if s["mutagen"]:
                tu_hoa.append({"hoa": s["mutagen"], "sao": s["name"], "cung": p["name"]})
        cung.append({"chi_so": p["index"], "ten": p["name"], "chi": p["earthlyBranch"],
                     "can": p["heavenlyStem"], "la_than": p["isBodyPalace"], "chinh_tinh": chinh,
                     "phu_tinh": phu, "dai_han": p["decadal"]["range"]})
    return {"cuc": la["fiveElementsClass"], "menh_chu": la["soul"], "than_chu": la["body"],
            "cung": cung, "tu_hoa": sorted(tu_hoa, key=lambda x: THU_TU_HOA.index(x["hoa"])),
            "cach_cuc": tuvi_cach_cuc.nhan_dien(la)}


def _cung_ten(ls: dict, ten: str) -> dict:
    return next(c for c in ls["cung"] if c["ten"] == ten)


def _cung_doi(ls: dict, c: dict) -> dict:
    return ls["cung"][(c["chi_so"] + 6) % 12]


# ------------------------------------------------------------------ gói bằng chứng
def _m_cung(ten: str) -> dict:
    return {"loai": "cung", "ten": ten, **kb.cung(ten)}


def _m_sao_cung(sao: str, cung_: str, do_sang: str | None = None, vai: str = "kb") -> dict | None:
    nd = kb.sao_cung(sao, cung_)
    ct = kb.chinh_tinh(sao)
    if not nd or not ct:
        return None
    m = {"loai": "sao_cung", "vai": vai, "sao": sao, "cung": cung_, "noi_dung": nd,
         "tinh_chat": ct["tinh_chat"], "mat_toi": ct["mat_toi"], "cau_tu_soi": ct["cau_tu_soi"],
         **kb.meta()}
    if do_sang:
        m["do_sang"], m["do_sang_y"] = do_sang, kb.do_sang(do_sang)
        nhom = kb.nhom_do_sang(do_sang)
        if nhom:                                 # KB-TV2b: nghĩa riêng của sao khi sáng / khi hãm
            m["sac_thai"] = ct["khi_sang" if nhom == "sang" else "khi_ham"]
    return m


def _m_tu_hoa(hoa: str, cung_: str, sao: str | None = None) -> dict | None:
    nd, th = kb.tu_hoa_cung(hoa, cung_), kb.tu_hoa(hoa)
    if not nd or not th:
        return None
    return {"loai": "tu_hoa_cung", "hoa": hoa, "sao": sao, "cung": cung_, "noi_dung": nd,
            "y_nghia": th["y_nghia"], "luu_y_hoa": th["luu_y"], **kb.meta()}


def _m_phu(ten: str, cung_: str | None) -> dict | None:
    p = kb.phu_tinh(ten)
    return {"loai": "phu_tinh", "ten": ten, "cung": cung_, **p} if p else None


def _doc_cung(ls: dict, ten: str, muc: list, chinh: bool = True) -> None:
    """Một cung trong lá số: nghĩa cung + chính tinh (độ sáng) + tứ hoá + phụ tinh đáng kể."""
    c = _cung_ten(ls, ten)
    muc.append(_m_cung(ten))
    if c["chinh_tinh"]:
        for s in c["chinh_tinh"]:
            m = _m_sao_cung(s["ten"], ten, s["do_sang"], "la_so")
            if m:
                muc.append(m)
    else:
        doi = _cung_doi(ls, c)
        muc.append({"loai": "vo_chinh_dieu", "cung": ten, "muon_cung": doi["ten"],
                    "sao_muon": [s["ten"] for s in doi["chinh_tinh"]], **kb.meta()})
        for s in doi["chinh_tinh"][:2]:
            m = _m_sao_cung(s["ten"], ten, None, "muon")
            if m:
                muc.append(m)
    for x in ls["tu_hoa"]:
        if x["cung"] == ten:
            m = _m_tu_hoa(x["hoa"], ten, x["sao"])
            if m:
                muc.append(m)
    dang_ke = [p for p in c["phu_tinh"] if kb.phu_tinh(p)["nhom"] in
               ("Lục cát tinh", "Lục sát tinh", "Nhóm đào hoa", "Lộc", "Tuần/Triệt")]
    if dang_ke and chinh:
        muc.append({"loai": "phu_tinh_cung", "cung": ten,
                    "sao": [{"ten": p, **{k: v for k, v in kb.phu_tinh(p).items()
                                         if k in ("nhom", "y_nghia")}} for p in dang_ke[:5]],
                    **kb.meta()})


def _doc_menh(ls: dict, muc: list) -> None:
    menh = _cung_ten(ls, "Mệnh")
    sao = [s["ten"] for s in menh["chinh_tinh"]] or [s["ten"] for s in _cung_doi(ls, menh)["chinh_tinh"]]
    if sao:
        ct = kb.chinh_tinh(sao[0])
        muc.append({"loai": "chinh_tinh", "ten": sao[0], **ct})
        nc = kb.nhom_cach(ct["nhom"])
        if nc:
            muc.append({"loai": "nhom_cach", "nhom": ct["nhom"], "noi_dung": nc, **kb.meta()})
    # Cách cục quanh Mệnh (KB-2): tối đa 3 cách đầu theo thứ tự ưu tiên, kèm lục sát hội về.
    for c in [c for c in ls.get("cach_cuc", []) if c["ma"] != "than_menh_dong_cung"][:3]:
        k = kb.cach_cuc(c["ma"])
        if k:
            muc.append({"loai": "cach_cuc", **k, "cung_lien_quan": c["cung"], "sat_hoi": c["sat_hoi"]})
    than = next(c for c in ls["cung"] if c["la_than"])
    muc.append({"loai": "than_cu", "cung": than["ten"], "menh_chu": ls["menh_chu"],
                "than_chu": ls["than_chu"], "cuc": ls["cuc"], **kb.meta()})


def _lop_han(ls: dict, lop: str, vh: dict, che_do: str) -> dict:
    o = vh[lop]
    c = ls["cung"][o["chi_so"]]
    m = {"loai": "han", "lop": lop, "cung_goc": c["ten"], "can": o["can"], "chi": o["chi"],
         "chu_de": kb.chu_de_han(c["ten"]), "chinh_tinh": [s["ten"] for s in c["chinh_tinh"]],
         **kb.meta()}
    if lop == "dai_han":
        m["tu_tuoi"], m["den_tuoi"] = o["tu_tuoi"], o["den_tuoi"]
    if o.get("tu_hoa"):
        m["tu_hoa_lop"] = []
        for hoa, sao in zip(THU_TU_HOA, o["tu_hoa"]):
            noi = next((x["ten"] for x in ls["cung"]
                        if sao in [s["ten"] for s in x["chinh_tinh"]] or sao in x["phu_tinh"]), None)
            if hoa in ("Lộc", "Kỵ") and noi:
                m["tu_hoa_lop"].append({"hoa": hoa, "sao": sao, "cung_goc": noi})
    if che_do == "chi_tiet":
        cat = [p for p in c["phu_tinh"] if kb.phu_tinh(p)["nhom"] in ("Lục cát tinh", "Lộc")]
        sat = [p for p in c["phu_tinh"] if kb.phu_tinh(p)["nhom"] == "Lục sát tinh"]
        ky = [x["sao"] for x in ls["tu_hoa"] if x["cung"] == c["ten"] and x["hoa"] == "Kỵ"]
        diem = len(cat) - len(sat) - len(ky)
        m["xu_huong"] = {"cat": cat, "sat": sat + [f"{s} hoá Kỵ" for s in ky],
                         "ket": "thuận hơn" if diem > 0 else "nhiều thử thách hơn" if diem < 0 else "cân bằng"}
    return m


def goi_bang_chung(pl: dict, ls: dict | None, vh: dict | None, vh_toi: dict | None = None) -> dict:
    goi = {"phan_loai": {k: pl[k] for k in ("loai", "che_do", "xu_ly", "cung")},
           "muc": [], "can_them": [], "mau": None, "luu_y": None}
    muc = goi["muc"]
    if pl["xu_ly"] == "an_toan":
        goi["mau"] = _mau_chung("an_toan")
        return chung.ket(goi)
    if pl["xu_ly"] == "tu_choi_nhe":
        goi["mau"] = _mau_chung("tu_choi")
        return chung.ket(goi)
    for ma in pl["giai_thich"][:2]:
        g = kb.giai_thich(ma)
        if g:
            muc.append({"loai": "giai_thich", "ma": ma, **g})
    loai = pl["loai"]
    if loai in ("hop_hon", "la_so_con", "nguoi_khac"):
        goi["can_them"] = ["la_so_nguoi_kia"]
        goi["mau"] = kb.mau({"hop_hon": "hop_hon", "la_so_con": "con", "nguoi_khac": "nguoi_khac"}[loai])
        return chung.ket(goi)
    if loai == "ky_thuat":
        return chung.ket(goi)
    if loai == "sao_cung":
        cung_ = pl["cung"] or ["Mệnh"]
        for s in pl["sao"][:2]:
            m = _m_sao_cung(s, cung_[0])
            if m:
                muc.append(m)
            if not pl["cung"] or len(pl["sao"]) == 1:
                ct = kb.chinh_tinh(s)
                muc.append({"loai": "chinh_tinh", "ten": s, **ct})
        for h in pl["hoa"][:1]:
            m = _m_tu_hoa(h, cung_[0])
            if m:
                muc.append(m)
        return chung.ket(goi)
    if loai == "tu_hoa_cung":
        for h in pl["hoa"][:2]:
            m = _m_tu_hoa(h, pl["cung"][0])
            if m:
                muc.append(m)
        muc.append(_m_cung(pl["cung"][0]))
        return chung.ket(goi)
    if loai == "phu_tinh":
        for p in pl["phu"][:2]:
            m = _m_phu(p, None)
            if m:
                muc.append(m)
        return chung.ket(goi)
    if ls is None:
        goi["can_them"] = ["la_so"]
        goi["mau"] = kb.mau("can_la_so")
        return chung.ket(goi)
    if loai == "han":
        if pl["su_kien"]:
            muc.append({"loai": "ghi_chu", "noi_dung": kb.luu_y("han_su_kien")})
        if vh is None:
            goi["can_them"] = ["ngay_xem"]
            return chung.ket(goi)
        muc.append({"loai": "tuoi", "tuoi_mu": vh["tuoi_mu"], "ngay_xem": vh.get("ngay_xem")})
        for lop in ("dai_han", "luu_nien", "tieu_han"):
            muc.append(_lop_han(ls, lop, vh, pl["che_do"]))
        if vh_toi:
            m = _lop_han(ls, "dai_han", vh_toi, pl["che_do"])
            m["vai"] = "ke_tiep"
            muc.append(m)
        for ten in pl["cung"][:1]:
            c = _cung_ten(ls, ten)
            muc.append({"loai": "cung_trong_han", "cung": ten, "chu_de": kb.cung(ten)["xem_duoc"],
                        "chinh_tinh": [s["ten"] for s in c["chinh_tinh"]], **kb.meta()})
        if chung.co(pl["cau_chuan_hoa"], [r"nam nao", r"khi nao", r"bao gio"]):
            muc.append({"loai": "cac_dai_han", "ds": [
                {"cung_goc": c["ten"], "tu_tuoi": c["dai_han"][0], "den_tuoi": c["dai_han"][1]}
                for c in sorted(ls["cung"], key=lambda c: c["dai_han"][0])], **kb.meta()})
        goi["luu_y"] = kb.luu_y(pl["che_do"])
        return chung.ket(goi)
    # la_so cá nhân
    for ten in pl["cung"][:2]:
        _doc_cung(ls, ten, muc)
    if "Mệnh" in pl["cung"]:
        _doc_menh(ls, muc)
    for p in pl["phu"][:2]:
        noi = next((c["ten"] for c in ls["cung"] if p in c["phu_tinh"]), None)
        m = _m_phu(p, noi)
        if m:
            muc.append(m)
    if "Tật Ách" in pl["cung"]:
        goi["luu_y"] = kb.luu_y("tat_ach")
    return chung.ket(goi)


def _mau_chung(ma: str) -> str:
    from app.kb import kinhdich_kb  # noqa: PLC0415 — mẫu an toàn/từ chối dùng chung Huyền học
    return kinhdich_kb.mau(ma)


# ------------------------------------------------------------------ NARRATIVE (template)
LOP_TEN = {"dai_han": "Đại hạn", "luu_nien": "Lưu niên", "tieu_han": "Tiểu hạn"}


def _doan(m: dict, da_co_sao: set[str] = frozenset()) -> tuple[str, str | None]:
    l = m["loai"]
    if l == "cung":
        return (f"Cung {m['ten']}: {m['y_nghia']} Cung này cho thấy {m['xem_duoc']}; "
                f"nó {m['khong_tra_loi']}.", m["cau_tu_soi"])
    if l == "sao_cung":
        dau = {"la_so": f"Trong lá số của bạn, {m['sao']} ở cung {m['cung']}",
               "muon": f"Cung {m['cung']} vô chính diệu, mượn {m['sao']} từ cung đối diện",
               "kb": f"{m['sao']} ở cung {m['cung']}"}[m["vai"]]
        s = f"{dau}"
        if m.get("do_sang"):
            s += f" ({m['do_sang']} — {m['do_sang_y']})"
        s += f": {m['noi_dung']}"
        if m.get("sac_thai"):
            s += f" {m['sac_thai']}"
        if m["sao"] not in da_co_sao:
            s += f" Nét chung của {m['sao']}: {m['tinh_chat']} Mặt tối cần để ý: {m['mat_toi']}."
        return s, m["cau_tu_soi"]
    if l == "chinh_tinh":
        return (f"{m['ten']} ({m['ten_han']}, hành {m['ngu_hanh']}): {m['tinh_chat']} Điểm mạnh: "
                f"{m['diem_manh']}. Mặt tối: {m['mat_toi']}. Biểu hiện dễ thấy: {m['bieu_hien']}.",
                m["cau_tu_soi"])
    if l == "nhom_cach":
        return m["noi_dung"], None
    if l == "cach_cuc":
        s = (f"Cách cục {m['ten']} ({m['ten_han']}) — {m['dieu_kien']} {m['y']} "
             f"Mặt tối: {m['mat_toi']} Gợi ý: {m['loi_khuyen']}")
        if m["sat_hoi"]:
            if "__pha_cach__" in da_co_sao:              # ghi chú dài chỉ nói một lần mỗi câu trả lời
                s += f" (Tam phương có {', '.join(m['sat_hoi'])} hội về — giảm cách, như lưu ý ở trên.)"
            else:
                s += f" Lưu ý: tam phương có {', '.join(m['sat_hoi'])} hội về — {kb.luu_y_pha_cach()}"
                if isinstance(da_co_sao, set):
                    da_co_sao.add("__pha_cach__")
        return s, None
    if l == "than_cu":
        return (f"Thân cư cung {m['cung']} — trọng tâm đời sống về sau nghiêng về lĩnh vực này. "
                f"Mệnh chủ {m['menh_chu']}, Thân chủ {m['than_chu']}, {m['cuc']}.", None)
    if l == "vo_chinh_dieu":
        mu = ", ".join(m["sao_muon"]) or "không có chính tinh"
        return (f"Cung {m['cung']} vô chính diệu (không có chính tinh), mượn cung {m['muon_cung']} "
                f"đối diện ({mu}) để luận — tính chất nhẹ hơn, phụ thuộc nhiều vào môi trường.", None)
    if l == "tu_hoa_cung":
        sao = f" ({m['sao']} hoá {m['hoa']})" if m.get("sao") else ""
        return f"Hoá {m['hoa']} ở cung {m['cung']}{sao}: {m['noi_dung']} {m['y_nghia']} {m['luu_y_hoa']}", None
    if l == "phu_tinh_cung":
        ds = "; ".join(f"{s['ten']} ({s['nhom']}): {s['y_nghia']}" for s in m["sao"])
        return f"Phụ tinh đáng kể ở cung {m['cung']}: {ds}", None
    if l == "phu_tinh":
        noi = f" — trong lá số của bạn nằm ở cung {m['cung']}" if m.get("cung") else ""
        return f"{m['ten']} ({m['nhom']}){noi}: {m['y_nghia']}", None
    if l == "tuoi":
        return f"Tuổi mụ tại thời điểm xem: {m['tuoi_mu']}.", None
    if l == "han":
        ten = LOP_TEN[m["lop"]] + (" kế tiếp" if m.get("vai") == "ke_tiep" else "")
        s = f"{ten}: cung {m['cung_goc']} ({m['can']} {m['chi']})"
        if m["lop"] == "dai_han":
            s += f", từ {m['tu_tuoi']} đến {m['den_tuoi']} tuổi"
        s += f". {m['chu_de']}"
        if m["chinh_tinh"]:
            s += f" Chính tinh tại cung: {', '.join(m['chinh_tinh'])}."
        for x in m.get("tu_hoa_lop", []):
            s += f" Hoá {x['hoa']} của {ten.lower()} ({x['sao']}) rơi vào cung {x['cung_goc']}."
        if m.get("xu_huong"):
            xh = m["xu_huong"]
            s += f" Xu hướng: {xh['ket']}"
            if xh["cat"] or xh["sat"]:
                s += f" (sao tốt: {', '.join(xh['cat']) or 'không'}; sao khó: {', '.join(xh['sat']) or 'không'})"
            s += "."
        return s, None
    if l == "cung_trong_han":
        ct = ", ".join(m["chinh_tinh"]) or "vô chính diệu"
        return (f"Việc bạn hỏi thuộc cung {m['cung']} ({m['chu_de']}); trong lá số gốc cung này có: {ct}. "
                "Soi chủ đề ba lớp hạn ở trên vào lĩnh vực này.", None)
    if l == "cac_dai_han":
        ds = "; ".join(f"{x['tu_tuoi']}–{x['den_tuoi']}: {x['cung_goc']}" for x in m["ds"])
        return f"Các đại hạn trong lá số: {ds}. Hệ thống không chọn 'năm tốt' thay bạn — hãy xem chủ đề từng giai đoạn.", None
    if l == "giai_thich":
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "ghi_chu":
        return m["noi_dung"], None
    return "", None


def van_template(goi: dict) -> str:
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    doan, soi = [], []
    da_co_sao = {m["ten"] for m in goi["muc"] if m["loai"] == "chinh_tinh"}
    for m in goi["muc"]:
        d, s = _doan(m, da_co_sao)
        if d:
            doan.append(d)
        if s and not soi:
            soi.append(s)
    if goi["mau"]:
        doan.append(goi["mau"])
    if soi:
        doan.append("Câu hỏi để tự soi: " + soi[0])
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(hoi_van.KET)
    return "\n\n".join(doan)


# ------------------------------------------------------------------ điểm vào
def _cong_nam(d: dt.date, n: int) -> dt.date:
    try:
        return d.replace(year=d.year + n)
    except ValueError:
        return d.replace(year=d.year + n, day=28)


def tra_loi(cau_hoi: str, che_do: str = "tham_khao", sinh: dict | None = None,
            ngay_xem: dt.date | None = None, dung_llm: bool = False) -> dict:
    """`sinh` = {"ngay": date (dương, kinh tuyến UTC+7), "ti": 0..12, "gioi_tinh": "nam"|"nu"}."""
    if che_do not in CHE_DO:
        raise ValueError(f"che_do phải là một trong {CHE_DO}")
    pl = phan_loai(cau_hoi, che_do)
    ls = vh = vh_toi = None
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    can_la_so = pl["loai"] in ("la_so", "han")
    if sinh and can_la_so:
        ls = tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN",
                                     tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                                     hoa_linh=sinh.get("hoa_linh", "viet"),
                                     thang_nhuan=sinh.get("thang_nhuan", "thang_sau"),
                                     lich=sinh.get("lich", "viet")))
        if pl["loai"] == "han":
            xem = ngay_xem
            if pl["nam_xem"]:
                xem = dt.date(pl["nam_xem"], 7, 1)
            elif pl["han_sau"]:
                xem = _cong_nam(ngay_xem, 1)
            vh = {**az.van_han(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], xem,
                                tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                                thang_nhuan=sinh.get("thang_nhuan", "thang_sau"),
                                lich=sinh.get("lich", "viet")), "ngay_xem": xem.isoformat()}
            if pl["han_toi"]:
                buoc = vh["dai_han"]["den_tuoi"] - vh["tuoi_mu"] + 1
                vh_toi = az.van_han(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], _cong_nam(xem, buoc),
                                    tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                                    thang_nhuan=sinh.get("thang_nhuan", "thang_sau"),
                                    lich=sinh.get("lich", "viet"))
    goi = goi_bang_chung(pl, ls, vh, vh_toi)
    van = van_template(goi)
    che_do_van, loi = "template", []
    if dung_llm and goi["muc"] and not goi["can_them"]:
        try:
            v = hoi_van._goi_llm(goi, cau_hoi)
            loi = hoi_van.kiem_tra_dau_ra(v, goi)
            che_do_van, van = ("llm", v) if not loi else ("template_fallback", van)
        except Exception as e:  # noqa: BLE001
            che_do_van, loi = "template_fallback", [f"llm lỗi: {str(e)[:120]}"]
    co = []
    if ls is not None:
        co.append({"loai": "nam_phai", "chi_tiet": kb.luu_y("iztro")})
    dac_biet = pl["xu_ly"] in ("an_toan", "tu_choi_nhe") or bool(goi["can_them"])
    return {"phan_loai": goi["phan_loai"], "van_han": vh, "bang_chung": goi, "cau_tra_loi": van,
            "che_do_van": che_do_van, "loi_kiem_tra": loi, "can_them": goi["can_them"],
            "co_canh_bao": co, "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong"}
