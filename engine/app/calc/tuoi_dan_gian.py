# -*- coding: utf-8 -*-
"""TDG-1 — Tuổi dân gian Việt: Kim lâu, Hoang ốc, Tam tai (làm nhà, cưới hỏi), hạn năm (Thái Tuế, Tuế Phá,
Tam Sát, Ngũ Hoàng, Nhị Hắc) và chọn tuổi xông đất.

CALC thuần, tất định. Quy ước (dân gian Việt phổ biến, ghi ở docs/DANH-GIA-ENGINE-HUYEN-HOC.md):
- Tuổi = tuổi MỤ theo năm âm lịch Việt: năm xem − năm sinh + 1 (năm sinh/năm xem tính theo Tết).
- Kim lâu: tuổi mụ chia 9 dư 1 (thân), 3 (thê), 6 (tử), 8 (lục súc).
- Hoang ốc: đếm tay — 10 tuổi Nhất Cát, 20 Nhì Nghi, 30 Tam Địa Sát, 40 Tứ Tấn Tài, 50 Ngũ Thọ Tử, 60 Lục Hoang
  Ốc; số lẻ đếm tiếp từ cung của hàng chục (vòng 6 cung).
- Tam tai: ba năm liên tiếp theo tam hợp của chi tuổi (Thân Tý Thìn → Dần Mão Thìn …).
- Hạn năm: Thái Tuế = phương chi năm, Tuế Phá = phương đối, Tam Sát = phương đối tam hợp của năm, Ngũ Hoàng /
  Nhị Hắc = cung của sao 5 / sao 2 trong phi tinh lưu niên (`huyen_khong.luu_nien`, mốc năm Lập xuân).
"""
from __future__ import annotations

from app.calc import can_chi as cc, huyen_khong as hk, lunar

CHI = lunar.CHI
CAN = lunar.CAN
KIM_LAU = {1: "than", 3: "the", 6: "tu", 8: "luc_suc"}
HOANG_OC = ("nhat_cat", "nhi_nghi", "tam_dia_sat", "tu_tan_tai", "ngu_tho_tu", "luc_hoang_oc")
HOANG_OC_XAU = {"tam_dia_sat", "ngu_tho_tu", "luc_hoang_oc"}
_TAM_HOP = (("Thân", "Tý", "Thìn"), ("Dần", "Ngọ", "Tuất"), ("Hợi", "Mão", "Mùi"), ("Tỵ", "Dậu", "Sửu"))
# Tam tai: nhóm tam hợp → 3 năm (theo thứ tự năm đầu → cuối)
_TAM_TAI = {_TAM_HOP[0]: ["Dần", "Mão", "Thìn"], _TAM_HOP[1]: ["Thân", "Dậu", "Tuất"],
            _TAM_HOP[2]: ["Tỵ", "Ngọ", "Mùi"], _TAM_HOP[3]: ["Hợi", "Tý", "Sửu"]}
# Tam Sát của năm: nhóm tam hợp của chi năm → phương đối với "vượng" của nhóm
_TAM_SAT = {_TAM_HOP[0]: ("Nam", ["Tỵ", "Ngọ", "Mùi"]), _TAM_HOP[1]: ("Bắc", ["Hợi", "Tý", "Sửu"]),
            _TAM_HOP[2]: ("Tây", ["Thân", "Dậu", "Tuất"]), _TAM_HOP[3]: ("Đông", ["Dần", "Mão", "Thìn"])}
PHUONG_CHI = {"Tý": "Bắc", "Sửu": "Đông Bắc", "Dần": "Đông Bắc", "Mão": "Đông", "Thìn": "Đông Nam", "Tỵ": "Đông Nam",
              "Ngọ": "Nam", "Mùi": "Tây Nam", "Thân": "Tây Nam", "Dậu": "Tây", "Tuất": "Tây Bắc", "Hợi": "Tây Bắc"}
PHUONG_CUNG = {"Khảm": "Bắc", "Cấn": "Đông Bắc", "Chấn": "Đông", "Tốn": "Đông Nam", "Ly": "Nam", "Khôn": "Tây Nam",
               "Đoài": "Tây", "Càn": "Tây Bắc", "Trung cung": "Giữa nhà"}
_LUC_HOP = {frozenset(x) for x in (("Tý", "Sửu"), ("Dần", "Hợi"), ("Mão", "Tuất"), ("Thìn", "Dậu"), ("Tỵ", "Thân"),
                                   ("Ngọ", "Mùi"))}
_LUC_HAI = {frozenset(x) for x in (("Tý", "Mùi"), ("Sửu", "Ngọ"), ("Dần", "Tỵ"), ("Mão", "Thìn"), ("Thân", "Hợi"),
                                   ("Dậu", "Tuất"))}
_HINH = {frozenset(x) for x in (("Tý", "Mão"), ("Dần", "Tỵ"), ("Tỵ", "Thân"), ("Dần", "Thân"), ("Sửu", "Tuất"),
                                ("Tuất", "Mùi"), ("Sửu", "Mùi"))}
_NGU_HOP_CAN = {frozenset(x) for x in (("Giáp", "Kỷ"), ("Ất", "Canh"), ("Bính", "Tân"), ("Đinh", "Nhâm"), ("Mậu", "Quý"))}
_HANH_CAN = dict(zip(CAN, ["Mộc", "Mộc", "Hỏa", "Hỏa", "Thổ", "Thổ", "Kim", "Kim", "Thủy", "Thủy"]))


def tuoi_mu(nam_sinh_am: int, nam_xem_am: int) -> int:
    return nam_xem_am - nam_sinh_am + 1


def kim_lau(tuoi: int) -> str | None:
    return KIM_LAU.get(tuoi % 9)


def hoang_oc(tuoi: int) -> int:
    """Chỉ số cung 0..5 (HOANG_OC)."""
    chuc, le = divmod(tuoi, 10)
    return (chuc - 1 + le) % 6


def _nhom(chi: str) -> tuple[str, ...]:
    return next(g for g in _TAM_HOP if chi in g)


def tam_tai(chi: str) -> list[str]:
    return _TAM_TAI[_nhom(chi)]


def pham_tam_tai(chi_tuoi: str, chi_nam: str) -> int | None:
    """1/2/3 = năm thứ mấy của tam tai; None = không phạm."""
    ds = tam_tai(chi_tuoi)
    return ds.index(chi_nam) + 1 if chi_nam in ds else None


def quan_he_chi(a: str, b: str) -> str | None:
    """xung > tam_hop > luc_hop > hai > hinh; cùng chi → 'trung'; không gì → None."""
    if (CHI.index(a) - CHI.index(b)) % 12 == 6:
        return "xung"
    if a == b:
        return "trung"
    cap = frozenset((a, b))
    if _nhom(a) == _nhom(b):
        return "tam_hop"
    if cap in _LUC_HOP:
        return "luc_hop"
    if cap in _LUC_HAI:
        return "hai"
    if cap in _HINH:
        return "hinh"
    return None


def can_chi_nam(nam_am: int) -> tuple[str, str]:
    return lunar.can_chi_nam(nam_am)


def han_nam(nam_am: int) -> dict:
    can, chi = can_chi_nam(nam_am)
    pha = CHI[(CHI.index(chi) + 6) % 12]
    phuong_sat, chi_sat = _TAM_SAT[_nhom(chi)]
    ln = hk.luu_nien(nam_am)
    cung_cua = {v: k for k, v in ln["cung"].items()}
    return {
        "nam": nam_am, "can_chi": f"{can} {chi}",
        "thai_tue": {"chi": chi, "phuong": PHUONG_CHI[chi]},
        "tue_pha": {"chi": pha, "phuong": PHUONG_CHI[pha]},
        "tam_sat": {"phuong": phuong_sat, "chi": chi_sat},
        "ngu_hoang": {"cung": cung_cua[5], "phuong": PHUONG_CUNG[cung_cua[5]]},
        "nhi_hac": {"cung": cung_cua[2], "phuong": PHUONG_CUNG[cung_cua[2]]},
        "phi_tinh": [{"cung": c, "phuong": PHUONG_CUNG[c], "sao": s} for c, s in ln["cung"].items()],
    }


_DIEM_CHI = {"tam_hop": 2, "luc_hop": 2, "trung": 0, "xung": -3, "hai": -1, "hinh": -1, None: 0}
_DIEM_NAP_AM = {"sinh": 2, "bình hoà": 1, "bị sinh": 0, "khắc": -2, "bị khắc": -1}


def danh_gia_xong_dat(nam_am: int, nam_sinh_chu: int, nam_sinh_khach: int) -> dict:
    """Các yếu tố + tổng điểm cho một tuổi xông đất (khách) với gia chủ trong năm âm `nam_am`."""
    can_n, chi_n = can_chi_nam(nam_am)
    can_c, chi_c = can_chi_nam(nam_sinh_chu)
    can_k, chi_k = can_chi_nam(nam_sinh_khach)
    na_k, na_c, na_n = cc.nap_am(can_k, chi_k), cc.nap_am(can_c, chi_c), cc.nap_am(can_n, chi_n)
    qh_nam, qh_chu = quan_he_chi(chi_k, chi_n), quan_he_chi(chi_k, chi_c)
    if frozenset((can_k, can_c)) in _NGU_HOP_CAN:
        can = "ngu_hop"
    else:
        sk = cc.sinh_khac(_HANH_CAN[can_k], _HANH_CAN[can_c])
        can = {"khắc": "khac_chu", "bị khắc": "chu_khac", "sinh": "sinh_chu", "bị sinh": "chu_sinh"}.get(sk, "binh")
    na_chu, na_nam = cc.sinh_khac(na_k["hanh"], na_c["hanh"]), cc.sinh_khac(na_k["hanh"], na_n["hanh"])
    tt = pham_tam_tai(chi_k, chi_n)
    diem = (_DIEM_CHI[qh_nam] + _DIEM_CHI[qh_chu]
            + {"ngu_hop": 1, "sinh_chu": 0.5, "khac_chu": -1, "chu_khac": -0.5}.get(can, 0)
            + _DIEM_NAP_AM[na_chu] + {"sinh": 1, "bị sinh": 1, "khắc": -1, "bị khắc": -1}.get(na_nam, 0)
            - (3 if tt else 0))
    return {"nam_sinh": nam_sinh_khach, "can_chi": f"{can_k} {chi_k}", "chi": chi_k, "nap_am": na_k["ten"],
            "hanh": na_k["hanh"], "chi_voi_nam": qh_nam, "chi_voi_chu": qh_chu, "can_voi_chu": can,
            "nap_am_voi_chu": na_chu, "nap_am_voi_nam": na_nam, "tam_tai": tt, "diem": diem}


def xong_dat(nam_am: int, nam_sinh_chu: int, cac_nam_sinh) -> list[dict]:
    ds = [danh_gia_xong_dat(nam_am, nam_sinh_chu, n) for n in cac_nam_sinh if n != nam_sinh_chu]
    return sorted(ds, key=lambda x: (-x["diem"], abs(x["nam_sinh"] - nam_sinh_chu)))
