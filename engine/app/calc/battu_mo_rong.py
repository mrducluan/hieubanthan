# -*- coding: utf-8 -*-
"""VZ-3 — Bát tự mở rộng (tính thuần, tất định): nạp âm, 12 trường sinh, tuần không, thần sát,
quan hệ can chi giữa các trụ, lưu niên / lưu nguyệt.

Nạp âm, trường sinh, tuần không đối chiếu ORACLE lunar-typescript (fixtures/golden/battu_mo_rong.json).
Thần sát theo bảng công bố bên dưới (Tam Mệnh Thông Hội — Vạn Dân Anh, đời Minh; cổ thư công cộng).
Quy ước thần sát lấy từ chi năm / chi ngày: KHÔNG tính chính trụ làm gốc (vd Tướng Tinh từ chi năm chỉ
xét ba trụ còn lại) — tránh tự đánh dấu.
"""
from __future__ import annotations

from app.calc import can_chi
from app.calc.battu import CAN_NH, CHI_NH, DUONG_NHAN as _DUONG_NHAN, LOC as _LOC, TANG_CAN, cach_cuc_tbct, thap_than  # noqa: F401

CAN = can_chi.CAN
CHI = can_chi.CHI
TRUONG_SINH = ["Trường Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy",
               "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"]
# Chi khởi Trường Sinh của 10 can (Mậu theo Bính, Kỷ theo Đinh — "Hỏa Thổ đồng cung").
_KHOI_SINH = {"Giáp": "Hợi", "Ất": "Ngọ", "Bính": "Dần", "Đinh": "Dậu", "Mậu": "Dần",
              "Kỷ": "Dậu", "Canh": "Tỵ", "Tân": "Tý", "Nhâm": "Thân", "Quý": "Mão"}
TEN_TRU = ["năm", "tháng", "ngày", "giờ"]


def truong_sinh(can: str, chi: str) -> str:
    """Giai đoạn 12 trường sinh của `can` tại `chi`: can dương đi thuận, can âm đi nghịch."""
    d = (CHI.index(chi) - CHI.index(_KHOI_SINH[can])) % 12
    return TRUONG_SINH[d if can_chi.la_duong_can(can) else (-d) % 12]


def tuan_khong(can: str, chi: str) -> list[str]:
    i = can_chi.chi_so_hoa_giap(can, chi)
    dau = i - i % 10
    return [CHI[(dau + 10) % 12], CHI[(dau + 11) % 12]]


# --------------------------------------------------------------------------- thần sát
# (tên, loại, ý ngắn) — ý là tóm tắt quen dùng, KHÔNG phán; diễn giải sâu ở tầng KB.
_Y = {
    "Thiên Ất Quý Nhân": ("cát", "quý nhân phù trợ, gặp khó có người giúp"),
    "Thái Cực Quý Nhân": ("cát", "thiên hướng học hỏi, chiêm nghiệm, tôn giáo – triết học"),
    "Văn Xương": ("cát", "thông minh, thuận học hành, chữ nghĩa"),
    "Lộc Thần": ("cát", "lộc của nhật chủ — nền tài lộc, sức tự lực"),
    "Dương Nhận": ("hung", "cương mãnh, quyết liệt; dễ nóng vội, cần chế hoá"),
    "Kim Dư": ("cát", "xe vàng — hưởng phúc, được nâng đỡ, nhân duyên tốt"),
    "Hồng Diễm": ("trung", "duyên dáng, đa tình"),
    "Thiên Đức": ("cát", "phúc đức trời che, giảm hung"),
    "Nguyệt Đức": ("cát", "phúc đức tháng che, giảm hung"),
    "Đào Hoa": ("trung", "duyên, sức hút, giao tế; quá vượng dễ vướng tình cảm"),
    "Dịch Mã": ("trung", "di chuyển, thay đổi, đi xa"),
    "Hoa Cái": ("trung", "nghệ thuật, tâm linh, thích cô tịch"),
    "Tướng Tinh": ("cát", "khí chất lãnh đạo, có uy"),
    "Kiếp Sát": ("hung", "dễ hao tổn, tranh đoạt bất ngờ"),
    "Vong Thần": ("hung", "dễ thị phi, tính toán quá mức"),
    "Cô Thần": ("hung", "cô độc, thiếu chỗ dựa (xét cho nam)"),
    "Quả Tú": ("hung", "cô quạnh, duyên muộn (xét cho nữ)"),
    "Khôi Cương": ("trung", "cương nghị, quyết đoán, tính mạnh"),
}

_QUY_NHAN = {"Giáp": ("Sửu", "Mùi"), "Mậu": ("Sửu", "Mùi"), "Canh": ("Sửu", "Mùi"), "Ất": ("Tý", "Thân"),
             "Kỷ": ("Tý", "Thân"), "Bính": ("Hợi", "Dậu"), "Đinh": ("Hợi", "Dậu"), "Nhâm": ("Mão", "Tỵ"),
             "Quý": ("Mão", "Tỵ"), "Tân": ("Ngọ", "Dần")}
_THAI_CUC = {"Giáp": ("Tý", "Ngọ"), "Ất": ("Tý", "Ngọ"), "Bính": ("Mão", "Dậu"), "Đinh": ("Mão", "Dậu"),
             "Mậu": ("Thìn", "Tuất", "Sửu", "Mùi"), "Kỷ": ("Thìn", "Tuất", "Sửu", "Mùi"),
             "Canh": ("Dần", "Hợi"), "Tân": ("Dần", "Hợi"), "Nhâm": ("Tỵ", "Thân"), "Quý": ("Tỵ", "Thân")}
_VAN_XUONG = dict(zip(CAN, ["Tỵ", "Ngọ", "Thân", "Dậu", "Thân", "Dậu", "Hợi", "Tý", "Dần", "Mão"]))
_KIM_DU = dict(zip(CAN, ["Thìn", "Tỵ", "Mùi", "Thân", "Mùi", "Thân", "Tuất", "Hợi", "Sửu", "Dần"]))
_HONG_DIEM = dict(zip(CAN, ["Ngọ", "Thân", "Dần", "Mùi", "Thìn", "Thìn", "Tuất", "Dậu", "Tý", "Thân"]))
# Theo chi tháng: Thiên Đức (can hoặc chi), Nguyệt Đức (can)
_THIEN_DUC = dict(zip(CHI, ["Tỵ", "Canh", "Đinh", "Thân", "Nhâm", "Tân", "Hợi", "Giáp", "Quý", "Dần", "Bính", "Ất"]))
_TAM_HOP_NHOM = [("Thân", "Tý", "Thìn"), ("Dần", "Ngọ", "Tuất"), ("Tỵ", "Dậu", "Sửu"), ("Hợi", "Mão", "Mùi")]
_NGUYET_DUC = {"Thân": "Nhâm", "Tý": "Nhâm", "Thìn": "Nhâm", "Dần": "Bính", "Ngọ": "Bính", "Tuất": "Bính",
               "Tỵ": "Canh", "Dậu": "Canh", "Sửu": "Canh", "Hợi": "Giáp", "Mão": "Giáp", "Mùi": "Giáp"}
# Theo nhóm tam hợp của chi gốc (năm / ngày): đào hoa, dịch mã, hoa cái, tướng tinh, kiếp sát, vong thần
_THEO_NHOM = {
    "Đào Hoa": ["Dậu", "Mão", "Ngọ", "Tý"],
    "Dịch Mã": ["Dần", "Thân", "Hợi", "Tỵ"],
    "Hoa Cái": ["Thìn", "Tuất", "Sửu", "Mùi"],
    "Tướng Tinh": ["Tý", "Ngọ", "Dậu", "Mão"],
    "Kiếp Sát": ["Tỵ", "Hợi", "Dần", "Thân"],
    "Vong Thần": ["Hợi", "Tỵ", "Thân", "Dần"],
}
_CO_QUA = {  # chi năm → (Cô Thần, Quả Tú)
    **dict.fromkeys(("Hợi", "Tý", "Sửu"), ("Dần", "Tuất")), **dict.fromkeys(("Dần", "Mão", "Thìn"), ("Tỵ", "Sửu")),
    **dict.fromkeys(("Tỵ", "Ngọ", "Mùi"), ("Thân", "Thìn")), **dict.fromkeys(("Thân", "Dậu", "Tuất"), ("Hợi", "Mùi")),
}
_KHOI_CUONG = {("Canh", "Thìn"), ("Canh", "Tuất"), ("Nhâm", "Thìn"), ("Mậu", "Tuất")}

THAN_SAT_NGUON = "Tam Mệnh Thông Hội (Vạn Dân Anh, đời Minh) — bảng tra phổ thông"


def _nhom(chi: str) -> int:
    return next(i for i, g in enumerate(_TAM_HOP_NHOM) if chi in g)


def than_sat(tru: list[dict]) -> list[dict]:
    """Thần sát trên 4 trụ. Mỗi mục: {ten, loai, y, tru: [chỉ số trụ có sao], goc}."""
    can = [t["can"] for t in tru]
    chi = [t["chi"] for t in tru]
    nc, cn = can[2], chi[2]
    o: dict[str, set[int]] = {}
    goc: dict[str, str] = {}

    def them(ten: str, idx: set[int], g: str) -> None:
        if idx:
            o.setdefault(ten, set()).update(idx)
            goc.setdefault(ten, g)

    them("Thiên Ất Quý Nhân", {i for i in range(4) if chi[i] in _QUY_NHAN[nc] + _QUY_NHAN[can[0]]}, "can ngày, can năm")
    them("Thái Cực Quý Nhân", {i for i in range(4) if chi[i] in _THAI_CUC[nc]}, "can ngày")
    them("Văn Xương", {i for i in range(4) if chi[i] == _VAN_XUONG[nc]}, "can ngày")
    them("Lộc Thần", {i for i in range(4) if chi[i] == _LOC[nc]}, "can ngày")
    if nc in _DUONG_NHAN:
        them("Dương Nhận", {i for i in range(4) if chi[i] == _DUONG_NHAN[nc]}, "can ngày")
    them("Kim Dư", {i for i in range(4) if chi[i] == _KIM_DU[nc]}, "can ngày")
    them("Hồng Diễm", {i for i in range(4) if chi[i] == _HONG_DIEM[nc]}, "can ngày")
    td = _THIEN_DUC[chi[1]]
    them("Thiên Đức", {i for i in range(4) if (can[i] if td in CAN else chi[i]) == td}, "chi tháng")
    them("Nguyệt Đức", {i for i in range(4) if can[i] == _NGUYET_DUC[chi[1]]}, "chi tháng")
    for ten, bang in _THEO_NHOM.items():
        for g in (0, 2):
            dich = bang[_nhom(chi[g])]
            them(ten, {i for i in range(4) if i != g and chi[i] == dich}, "chi năm, chi ngày")
    co, qua = _CO_QUA[chi[0]]
    them("Cô Thần", {i for i in range(1, 4) if chi[i] == co}, "chi năm")
    them("Quả Tú", {i for i in range(1, 4) if chi[i] == qua}, "chi năm")
    if (nc, cn) in _KHOI_CUONG:
        them("Khôi Cương", {2}, "trụ ngày")
    return [{"ten": t, "loai": _Y[t][0], "y": _Y[t][1], "tru": sorted(o[t]), "goc": goc[t]}
            for t in _Y if t in o]


# --------------------------------------------------------------------------- quan hệ can chi
_DOI = {
    "lục hợp": [("Tý", "Sửu"), ("Dần", "Hợi"), ("Mão", "Tuất"), ("Thìn", "Dậu"), ("Tỵ", "Thân"), ("Ngọ", "Mùi")],
    "lục xung": [("Tý", "Ngọ"), ("Sửu", "Mùi"), ("Dần", "Thân"), ("Mão", "Dậu"), ("Thìn", "Tuất"), ("Tỵ", "Hợi")],
    "lục hại": [("Tý", "Mùi"), ("Sửu", "Ngọ"), ("Dần", "Tỵ"), ("Mão", "Thìn"), ("Thân", "Hợi"), ("Dậu", "Tuất")],
    "tương phá": [("Tý", "Dậu"), ("Mão", "Ngọ"), ("Thìn", "Sửu"), ("Mùi", "Tuất"), ("Dần", "Hợi"), ("Tỵ", "Thân")],
    "tương hình": [("Dần", "Tỵ"), ("Tỵ", "Thân"), ("Dần", "Thân"), ("Sửu", "Tuất"), ("Tuất", "Mùi"),
                   ("Sửu", "Mùi"), ("Tý", "Mão")],
}
_TU_HINH = {"Thìn", "Ngọ", "Dậu", "Hợi"}
_HANH_TAM_HOP = ["Thủy", "Hỏa", "Kim", "Mộc"]
_TAM_HOI = [(("Dần", "Mão", "Thìn"), "Mộc"), (("Tỵ", "Ngọ", "Mùi"), "Hỏa"),
            (("Thân", "Dậu", "Tuất"), "Kim"), (("Hợi", "Tý", "Sửu"), "Thủy")]
_CAN_HOP = {frozenset(p): h for p, h in [(("Giáp", "Kỷ"), "Thổ"), (("Ất", "Canh"), "Kim"), (("Bính", "Tân"), "Thủy"),
                                          (("Đinh", "Nhâm"), "Mộc"), (("Mậu", "Quý"), "Hỏa")]}
_CAN_XUNG = {frozenset(p) for p in [("Giáp", "Canh"), ("Ất", "Tân"), ("Bính", "Nhâm"), ("Đinh", "Quý")]}
CAN_XUNG = _CAN_XUNG   # HN-2N: tên công khai (cùng giá trị)
_DOI_SET = {k: {frozenset(p) for p in v} for k, v in _DOI.items()}


def _mo_ta(loai: str, ten_tru: list[str], gia: str, them: str = "") -> str:
    return f"{' – '.join(ten_tru)}: {gia} {loai}{them}"


def quan_he(tru: list[dict], ten: list[str] | None = None) -> list[dict]:
    """Quan hệ giữa các trụ (mặc định 4 trụ năm/tháng/ngày/giờ; có thể truyền thêm trụ lưu niên)."""
    ten = ten or TEN_TRU[: len(tru)]
    can = [t["can"] for t in tru]
    chi = [t["chi"] for t in tru]
    kq: list[dict] = []
    n = len(tru)
    for i in range(n):
        for j in range(i + 1, n):
            a, b = chi[i], chi[j]
            for loai, s in _DOI_SET.items():
                if frozenset((a, b)) in s:
                    kq.append({"loai": loai, "tru": [i, j], "mo_ta": _mo_ta(loai, [ten[i], ten[j]], f"{a}–{b}")})
            if a == b and a in _TU_HINH:
                kq.append({"loai": "tự hình", "tru": [i, j], "mo_ta": _mo_ta("tự hình", [ten[i], ten[j]], f"{a}–{b}")})
            p = frozenset((can[i], can[j]))
            if p in _CAN_HOP:
                kq.append({"loai": "can ngũ hợp", "tru": [i, j],
                           "mo_ta": _mo_ta("ngũ hợp", [ten[i], ten[j]], f"{can[i]}–{can[j]}", f" (hoá {_CAN_HOP[p]})")})
            if p in _CAN_XUNG:
                kq.append({"loai": "can tương xung", "tru": [i, j],
                           "mo_ta": _mo_ta("tương xung", [ten[i], ten[j]], f"{can[i]}–{can[j]}")})
    for g, hanh in zip(_TAM_HOP_NHOM, _HANH_TAM_HOP):
        idx = [i for i in range(n) if chi[i] in g]
        co = {chi[i] for i in idx}
        if len(co) == 3:
            kq.append({"loai": "tam hợp", "tru": idx, "mo_ta": _mo_ta("tam hợp", [ten[i] for i in idx], "–".join(g), f" ({hanh} cục)")})
        elif len(co) == 2 and g[1] in co:          # bán hợp phải có trung thần (Tý/Ngọ/Dậu/Mão)
            kq.append({"loai": "bán hợp", "tru": idx, "mo_ta": _mo_ta("bán hợp", [ten[i] for i in idx], "–".join(sorted(co, key=g.index)), f" ({hanh})")})
    for g, hanh in _TAM_HOI:
        idx = [i for i in range(n) if chi[i] in g]
        if len({chi[i] for i in idx}) == 3:
            kq.append({"loai": "tam hội", "tru": idx, "mo_ta": _mo_ta("tam hội", [ten[i] for i in idx], "–".join(g), f" ({hanh} phương)")})
    return kq


# --------------------------------------------------------------------------- tổng hợp
_SINH = {"Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim"}
_KHAC = {"Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim"}


def bang_hanh() -> dict:
    """Bảng ngũ hành của 10 can, 12 chi (để web tô màu, không phải tự tra)."""
    return {"can": dict(zip(CAN, CAN_NH)), "chi": dict(zip(CHI, CHI_NH))}


def vai_tro_hanh(nh: str) -> dict[str, str]:
    """Vai của mỗi hành đối với nhật chủ: cùng hành Tỷ Kiếp, sinh ta Ấn, ta sinh Thực Thương,
    ta khắc Tài, khắc ta Quan Sát."""
    sinh_ta = next(a for a, b in _SINH.items() if b == nh)
    khac_ta = next(a for a, b in _KHAC.items() if b == nh)
    return {nh: "Tỷ Kiếp", sinh_ta: "Ấn", _SINH[nh]: "Thực Thương", _KHAC[nh]: "Tài", khac_ta: "Quan Sát"}


_MUA = {**dict.fromkeys(("Dần", "Mão", "Thìn"), "xuan"), **dict.fromkeys(("Tỵ", "Ngọ", "Mùi"), "ha"),
        **dict.fromkeys(("Thân", "Dậu", "Tuất"), "thu"), **dict.fromkeys(("Hợi", "Tý", "Sửu"), "dong")}


def dieu_hau_ctbg(ls: dict, can_dung: list[str]) -> dict:
    """Ghép vai trò cho danh sách can dụng thần điều hậu (tra từ KB Cùng Thông Bảo Giám ở tầng ngoài):
    hành, thập thần với nhật chủ, đã lộ (thấu) ở thiên can năm/tháng/giờ hay chỉ tàng trong chi."""
    nc = ls["nhat_chu"]["can"]
    lo = {ls["tru"][i]["can"] for i in (0, 1, 3)}
    tang = {c for x in ls["tang_can"] for c in x}
    return {"chi_tiet": [{"can": c, "hanh": CAN_NH[CAN.index(c)], "thap_than": thap_than(nc, c),
                          "thau": c in lo, "tang": c in tang} for c in can_dung],
            "mua": _MUA[ls["tru"][1]["chi"]]}


def mo_rong(ls: dict) -> dict:
    tru = ls["tru"]
    nc = ls["nhat_chu"]["can"]
    return {
        "nap_am": [can_chi.nap_am(t["can"], t["chi"]) for t in tru],
        "truong_sinh": [truong_sinh(nc, t["chi"]) for t in tru],          # nhật chủ tại 4 chi
        "tu_toa": [truong_sinh(t["can"], t["chi"]) for t in tru],         # can mỗi trụ ngồi trên chi của nó
        "khong_vong": {"ngay": tuan_khong(tru[2]["can"], tru[2]["chi"]), "nam": tuan_khong(tru[0]["can"], tru[0]["chi"])},
        "than_sat": than_sat(tru),
        "than_sat_nguon": THAN_SAT_NGUON,
        "quan_he": quan_he(tru),
        "bang_hanh": bang_hanh(),
        "vai_tro_hanh": vai_tro_hanh(ls["nhat_chu"]["ngu_hanh"]),
        "dai_van_thap_than": [thap_than(nc, d["can"]) for d in ls["dai_van"]["ds"]],
    }


def luu_nien(ls: dict, nam: int) -> dict:
    """Năm `nam` (can chi tính từ Lập xuân) đặt cạnh tứ trụ: thập thần, nạp âm, quan hệ với 4 trụ,
    12 lưu nguyệt (tháng tiết, khởi tháng Dần)."""
    i_can, i_chi = (nam - 4) % 10, (nam - 4) % 12
    can_n, chi_n = CAN[i_can], CHI[i_chi]
    nc = ls["nhat_chu"]["can"]
    qh = [q for q in quan_he([*ls["tru"], {"can": can_n, "chi": chi_n}], [*TEN_TRU, "lưu niên"]) if 4 in q["tru"]]
    thang = []
    for k in range(12):
        c, ch = CAN[(i_can * 2 + 2 + k) % 10], CHI[(2 + k) % 12]
        thang.append({"thang": k + 1, "can": c, "chi": ch, "thap_than": thap_than(nc, c)})
    dv = next((d for d in ls["dai_van"]["ds"] if d["tu_nam"] <= nam <= d["den_nam"]), None)
    return {"nam": nam, "can": can_n, "chi": chi_n, "thap_than": thap_than(nc, can_n),
            "thap_than_chi": thap_than(nc, TANG_CAN[chi_n][0]),
            "nap_am": can_chi.nap_am(can_n, chi_n), "truong_sinh": truong_sinh(nc, chi_n),
            "dai_van": dv and {**dv, "thap_than": thap_than(nc, dv["can"])},
            "quan_he": qh, "luu_nguyet": thang}
