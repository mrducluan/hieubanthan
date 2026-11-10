# -*- coding: utf-8 -*-
"""TV-YBS — RULES so điều kiện của KB `tuvi_y_bo_sung.json` với lá số (tất định, không LLM, không DB).

Giao diện công khai (dùng chung hỏi đáp + báo cáo đời sống):
  * `ngu_canh_tu_la_so(ls, gioi_tinh, nam_am_xem, nam_am_sinh, vh)` → ngữ cảnh dict: 12 cung (sao, độ sáng Nam phái, hoá
    gốc), cung an Thân, giới, và các LỚP thời gian của năm đang xem — `lop.dai_han` / `lop.luu_nien` / `lop.tieu_han`
    = {cung, tu_hoa: [{hoa, sao, cung}], thu?} (`thu` = thứ tự đại hạn theo tuổi, 0 = đại hạn đầu). `ngu_canh_nam(nc, nam)`
    = cùng lá cho một năm khác (không có tiểu hạn — chỉ biết cho năm đang xem).
  * `ngu_canh(ls, vh=None, gioi_tinh=None)` (hỏi đáp): lớp thời gian lấy THẲNG từ `vh` (`calc.tuvi_an_sao.van_han`:
    cung theo `chi_so`, tứ hoá theo tên sao của lớp) — cùng dạng ngữ cảnh.
  * `khop(m, nc) -> bool` · `chi_tiet(m, nc) -> [(lớp, cung)]` (lớp nào, cung nào làm điều kiện đúng) ·
    `noi_khop(m, nc) -> [cung]` · `tim(nc, loai=None, hien_thi=None, cung=None) -> [mục + "cung_khop" + "lop_khop"]`
    (mục cụ thể hơn trước — `do_cu_the`, hoà giữ thứ tự KB) · `tinh_duoc(m) -> (bool, lý do)`.
  Gộp hai bộ so (báo cáo đời sống + hỏi đáp, 2026-11-04) thành MỘT: giữ nghĩa bảo thủ của bộ hỏi đáp (lục cát 6 sao,
  `gap` / `khong_co_cat_tinh` xét trong phạm vi `vi_tri`, "nhiều sát hoặc Kỵ" đếm gộp ≥ 2, `nhom` mượn cung đối khi Mệnh
  vô chính diệu, `do_sang` có cả hai đầu = không ràng buộc, mục chỉ có cung / ghi chú không khớp, `hai_cung_doi` = sao
  thứ nhất toạ + sao thứ hai ở cung đối) + phần bộ báo cáo tính thêm được (`tuoi`, luật riêng `_RIENG` cho ghi chú đã rõ
  nghĩa, ý theo nhiều năm).

Nghĩa từ vựng điều kiện (`_tu_vung_dieu_kien` của KB) — chỗ KB để ngỏ, luật ở đây chốt (ghi rõ để người duyệt sửa):
  * `sao` = mọi sao CÙNG có mặt trong phạm vi; `sao_mot_trong` = ít nhất một; `sao_cap_mot_trong` = một cặp cùng một cung.
    "Hoá Lộc/Quyền/Khoa/Kỵ" là giả-sao: hoá của lớp đang xét nằm ở cung đó.
  * Phạm vi `vi_tri`: toa (mặc định) = chính cung · xung_chieu = cung đối · tam_phuong = chính cung + hai cung tam hợp ·
    giap = hai cung kề hai bên (mỗi bên một sao) · hai_cung_doi = chính cung + cung đối (với hai sao: sao đầu toạ, sao
    sau ở cung đối). Danh sách = hợp các phạm vi.
  * `cung` vắng = mọi cung; "bat_ky" = mọi cung. Có `lop` (khác gốc) và KHÔNG có điều kiện hoá → cung xét = cung của lớp
    (phải trùng `cung` nếu có). Có điều kiện hoá → hoá lấy của lớp, vị trí so với cung gốc `cung`.
  * `do_sang`: "sang" = Miếu/Vượng/Đắc · "ham" = Hãm (bảng Nam phái của engine); áp cho CHÍNH TINH trong điều kiện (không
    có chính tinh thì phụ tinh, bảng lối Việt theo chi); có cả "sang" lẫn "ham" = luật nói cả hai đầu → không ràng buộc.
  * `gap` (trong phạm vi `vi_tri`): sat_tinh = ≥ 1 lục sát · cat_tinh = ≥ 1 lục cát (Tả Hữu Xương Khúc Khôi Việt) ·
    nhieu_sat_hoac_ky = số lục sát + số Hoá Kỵ của lớp ≥ 2.
  * `lop` danh sách = một trong các lớp ("goc" = lá gốc). `tuoi` dai_han_dau / dai_han_dau_hoac_hai = đại hạn thứ 1 / 1–2.
  * `hoac` = điều kiện thay thế, thừa hưởng `cung`, `gioi_tinh`, `lop` của điều kiện chính khi tự nó không ghi.
  * `gioi_tinh` mà ngữ cảnh không biết giới → không khớp (không đoán).
Không tính (`tinh_duoc` = False, test liệt kê): `co_the_tinh` false, luật hai lá số, nguyên tắc chung không có điều kiện
riêng, `so_sanh`, `ghi_chu` chưa cơ học hoá (trừ các mục có luật riêng `_RIENG` hoặc ghi chú chỉ để giải thích
`_GHI_CHU_GIAI_THICH`), sao engine không giữ trong lá số gọn (vd Tam Thai, Bát Toạ).
"""
from __future__ import annotations

import re
from typing import Callable

from app.calc import tuvi_do_sang_vn as dsvn
from app.kb import tuvi_kb
from app.kb import tuvi_y_bo_sung as kb

LUC_CAT = ("Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt")
CHINH_TINH = ("Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
              "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân")
LUC_SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp")
HOA = ("Lộc", "Quyền", "Khoa", "Kỵ")
HOA_GIA = {f"Hoá {h}": h for h in HOA}
SANG = {"Miếu", "Vượng", "Đắc"}
HAM = {"Hãm", "Bất"}
LOP = ("goc", "dai_han", "luu_nien", "tieu_han")
# loại KB nối vào báo cáo đời sống Tử vi (phuong_phap không có điều kiện riêng của lá)
LOAI_BAO_CAO = ("sao_cung", "cap_sao", "tu_hoa_cung", "nghe_nghiep", "hon_nhan", "thoi_diem", "suc_khoe_phong_ngua")
_KHOA = {"co_the_tinh", "sao", "sao_mot_trong", "sao_cap_mot_trong", "cung", "cung_than", "vi_tri", "do_sang", "chi",
         "hoa", "hoa_tren_sao", "hoa_tren_sao_mot_trong", "vi_tri_hoa", "hoa_tat_ca", "khong_co", "khong_co_hoa",
         "khong_chinh_tinh", "khong_co_cat_tinh", "gap", "gioi_tinh", "nhom", "sao_them_tuy_chon", "lop", "tuoi", "hoac",
         "can_them", "ghi_chu"}
_TIEN_TO_THAN = "cung_than_o_"
# Ghi chú chỉ để GIẢI THÍCH, phần điều kiện đã đủ (không đổi nghĩa): tính theo điều kiện cấu trúc.
_GHI_CHU_GIAI_THICH = {"yb.sk.lo_nghi_hao_suc", "yb.sao.khong_kiep_nam_kinh_doanh", "yb.sao.cu_mon_tuoi_di_hoc",
                       "yb.cung.qua_ky_moi_cuoi"}     # đang ở lớp có Kỵ chiếu Phu Thê → "chưa vội quyết định lớn"
# Khoá điều kiện "cụ thể" — mục chỉ có cung / lớp / ghi chú (lời phương pháp) không khớp lá số, trừ "cung + lớp".
_CU_THE = ("sao", "sao_mot_trong", "sao_cap_mot_trong", "hoa", "hoa_tat_ca", "hoa_tren_sao", "hoa_tren_sao_mot_trong",
           "khong_chinh_tinh", "khong_co_cat_tinh", "khong_co", "khong_co_hoa", "gap", "chi", "do_sang", "cung_than",
           "nhom", "can_them")


def _chinh_ten() -> set[str]:
    return set(tuvi_kb.ten_chinh_tinh())


def _sao_biet() -> set[str]:
    return _chinh_ten() | set(tuvi_kb.ten_phu_tinh()) | set(HOA_GIA)


def _ds(x) -> list:
    return [] if x is None else list(x) if isinstance(x, (list, tuple)) else [x]


# ------------------------------------------------------------------ ngữ cảnh
def _lop_hoa(can: str | None, ls: dict) -> list[dict]:
    if not can:
        return []
    from app.calc import tuvi_phi_hoa as phi  # noqa: PLC0415
    return [{"hoa": x["hoa"], "sao": x["sao"], "cung": x["den_cung"]} for x in phi.phi_tu_can(can, ls["cung"])]


def ngu_canh_tu_la_so(ls: dict, gioi_tinh: str | None = None, nam_am_xem: int | None = None,
                      nam_am_sinh: int | None = None, vh: dict | None = None) -> dict:
    """Lá số gọn (`hoidap.tuvi.tom_tat`) → ngữ cảnh so điều kiện. Không có năm → chỉ lớp gốc (lop.* = None).
    `vh` (`calc.tuvi_an_sao.van_han` của năm đang xem) → thêm tiểu hạn (đại hạn / lưu niên vẫn dựng từ lá số, cùng
    luật dòng 10 năm: đại hạn chứa tuổi mụ, lưu niên = cung mang chi năm, tứ hoá theo can)."""
    cung = {}
    for c in ls["cung"]:
        cung[c["ten"]] = {"ten": c["ten"], "chi": c["chi"], "can": c.get("can"), "chi_so": c["chi_so"],
                          "chinh": [{"ten": s["ten"], "do_sang": s.get("do_sang")} for s in c["chinh_tinh"]],
                          "phu": list(c["phu_tinh"]), "dai_han": tuple(c.get("dai_han") or (0, 0))}
    thu_tu = [c["ten"] for c in sorted(ls["cung"], key=lambda c: c["chi_so"])]
    nc = {"cung": cung, "thu_tu": thu_tu, "tu_hoa": [dict(x) for x in ls["tu_hoa"]],
          "than": next((c["ten"] for c in ls["cung"] if c.get("la_than")), None), "gioi_tinh": gioi_tinh,
          "dai_han_ds": [c["ten"] for c in sorted(ls["cung"], key=lambda c: (c.get("dai_han") or (0,))[0])],
          "nam": None, "tuoi_mu": None, "nam_am_sinh": nam_am_sinh,
          "lop": {"dai_han": None, "luu_nien": None, "tieu_han": None}, "_ls": ls}
    if nam_am_xem is not None and nam_am_sinh is not None:
        nc = ngu_canh_nam(nc, nam_am_xem)
        th = (vh or {}).get("tieu_han")
        if th and th.get("cung_goc"):
            nc["lop"]["tieu_han"] = {"cung": th["cung_goc"], "tu_hoa": [], "thu": None}
    return nc


def ngu_canh(ls: dict, vh: dict | None = None, gioi_tinh: str | None = None) -> dict:
    """Hỏi đáp: lá số gọn + vận hạn iztro của năm đang xem → ngữ cảnh. Lớp = cung theo `chi_so` của `vh`, tứ hoá = bốn
    sao của lớp (Lộc, Quyền, Khoa, Kỵ) đặt ở cung sao đó đứng. Không có `vh` → chỉ lá gốc."""
    nc = ngu_canh_tu_la_so(ls, gioi_tinh)
    ten_theo_chi = {c["chi_so"]: c["ten"] for c in ls["cung"]}
    noi_sao = {s: t for t, c in nc["cung"].items() for s in [*(x["ten"] for x in c["chinh"]), *c["phu"]]}
    for lop in ("dai_han", "luu_nien", "tieu_han"):
        o = (vh or {}).get(lop)
        if not o or o.get("chi_so") not in ten_theo_chi:
            continue
        ten = ten_theo_chi[o["chi_so"]]
        hoa = [{"hoa": h, "sao": sao, "cung": noi_sao[sao]} for h, sao in zip(HOA, o.get("tu_hoa") or []) if sao in noi_sao]
        nc["lop"][lop] = {"cung": ten, "tu_hoa": hoa,
                          "thu": nc["dai_han_ds"].index(ten) if lop == "dai_han" else None,
                          **({"tu_tuoi": o["tu_tuoi"], "den_tuoi": o["den_tuoi"]} if o.get("tu_tuoi") else {})}
    return nc


def ngu_canh_nam(nc: dict, nam: int) -> dict:
    """Cùng lá số, lớp thời gian của năm âm lịch `nam` (đại hạn theo tuổi mụ, lưu niên theo chi năm, tứ hoá theo can)."""
    from app.calc import lunar  # noqa: PLC0415
    ls = nc["_ls"]
    can, chi = lunar.can_chi_nam(nam)
    tuoi = nam - nc["nam_am_sinh"] + 1 if nc.get("nam_am_sinh") is not None else None
    moi = {**nc, "nam": nam, "tuoi_mu": tuoi, "lop": {"dai_han": None, "luu_nien": None, "tieu_han": None}}
    dh = next((c for c in ls["cung"] if tuoi is not None and c["dai_han"][0] <= tuoi <= c["dai_han"][1]), None)
    if dh:
        moi["lop"]["dai_han"] = {"cung": dh["ten"], "tu_hoa": _lop_hoa(dh.get("can"), ls),
                                 "thu": nc["dai_han_ds"].index(dh["ten"]), "tu_tuoi": dh["dai_han"][0],
                                 "den_tuoi": dh["dai_han"][1]}
    ln = next((c for c in ls["cung"] if c["chi"] == chi), None)
    if ln:
        moi["lop"]["luu_nien"] = {"cung": ln["ten"], "tu_hoa": _lop_hoa(can, ls), "thu": None, "can_chi": f"{can} {chi}"}
    return moi


# ------------------------------------------------------------------ tiện ích lá
def _ke(nc: dict, ten: str, buoc: int) -> str:
    t = nc["thu_tu"]
    return t[(t.index(ten) + buoc) % 12]


def _pham_vi(nc: dict, ten: str, vi_tri) -> list[str]:
    ra: list[str] = []
    for v in _ds(vi_tri) or ["toa"]:
        them = {"toa": [ten], "xung_chieu": [_ke(nc, ten, 6)], "tam_phuong": [ten, _ke(nc, ten, 4), _ke(nc, ten, 8)],
                "hai_cung_doi": [ten, _ke(nc, ten, 6)], "giap": [_ke(nc, ten, 1), _ke(nc, ten, -1)]}[v]
        ra += [x for x in them if x not in ra]
    return ra


def _hoa_lop(nc: dict, lop: str) -> list[dict]:
    return nc["tu_hoa"] if lop == "goc" else ((nc["lop"].get(lop) or {}).get("tu_hoa") or [])


def _co_sao(nc: dict, ten: str, sao: str, hoa: list[dict]) -> bool:
    if sao in HOA_GIA:
        return any(x["hoa"] == HOA_GIA[sao] and x["cung"] == ten for x in hoa)
    c = nc["cung"][ten]
    return sao in c["phu"] or any(s["ten"] == sao for s in c["chinh"])


def sao_trong_cung(nc: dict, ten: str) -> set[str]:
    """Tên mọi sao (chính + phụ) ở cung `ten` của ngữ cảnh."""
    c = nc["cung"][ten]
    return {s["ten"] for s in c["chinh"]} | set(c["phu"])


def _o_dau(nc: dict, pv: list[str], sao: str, hoa: list[dict]) -> str | None:
    return next((t for t in pv if _co_sao(nc, t, sao, hoa)), None)


def _nhom_sang(nc: dict, ten: str, sao: str) -> str | None:
    c = nc["cung"][ten]
    ds = next((s["do_sang"] for s in c["chinh"] if s["ten"] == sao), None)
    if ds is None and sao not in _chinh_ten():
        ds = dsvn.do_sang_phu(sao, c["chi"])
    return "sang" if ds in SANG else "ham" if ds in HAM else None


def _so_cat(nc: dict, ten: str) -> int:
    return sum(s in LUC_CAT for s in nc["cung"][ten]["phu"])


def _so_sat(nc: dict, ten: str) -> int:
    return sum(s in LUC_SAT for s in nc["cung"][ten]["phu"])


def _co_hoa(hoa: list[dict], h: str, cung: list[str]) -> bool:
    return any(x["hoa"] == h and x["cung"] in cung for x in hoa)


# ------------------------------------------------------------------ một điều kiện, một lớp, một cung
def _dung_tai(dk: dict, nc: dict, lop: str, ten: str) -> bool:
    hoa = _hoa_lop(nc, lop)
    pv = _pham_vi(nc, ten, dk.get("vi_tri"))
    sao, mot, cap = _ds(dk.get("sao")), _ds(dk.get("sao_mot_trong")), _ds(dk.get("sao_cap_mot_trong"))
    muc = _ds(dk.get("do_sang"))
    muc = [] if {"sang", "ham"} <= set(muc) else muc        # luật nói cả hai đầu → không ràng buộc độ sáng

    def sang(s: str, noi: list[str]) -> bool:
        """Sao `s` có mặt trong `noi` ở độ sáng thuộc `muc` (giả-sao hoá / không ràng buộc → đúng)."""
        return not muc or s in HOA_GIA or any(_co_sao(nc, t, s, hoa) and _nhom_sang(nc, t, s) in muc for t in noi)

    vt = dk.get("vi_tri")
    if vt == "giap" and sao:
        trai, phai = _ke(nc, ten, 1), _ke(nc, ten, -1)
        if len(sao) != 2:
            return False
        a, b = sao
        if not ((_co_sao(nc, trai, a, hoa) and _co_sao(nc, phai, b, hoa))
                or (_co_sao(nc, phai, a, hoa) and _co_sao(nc, trai, b, hoa))):
            return False
    elif vt == "hai_cung_doi" and sao:
        if not (len(sao) == 2 and _co_sao(nc, ten, sao[0], hoa) and _co_sao(nc, _ke(nc, ten, 6), sao[1], hoa)):
            return False
    else:
        for s in sao:
            if _o_dau(nc, pv, s, hoa) is None or not sang(s, pv):
                return False
    if mot and not any(_o_dau(nc, pv, s, hoa) is not None and (sao or sang(s, pv)) for s in mot):
        return False
    if cap and not any(all(_co_sao(nc, ten, s, hoa) for s in c) for c in cap):
        return False
    if dk.get("chi") and nc["cung"][ten]["chi"] not in _ds(dk["chi"]):
        return False
    if dk.get("hoa"):
        noi = _pham_vi(nc, ten, dk.get("vi_tri_hoa")) if dk.get("vi_tri_hoa") else pv
        tren = _ds(dk.get("hoa_tren_sao")) + _ds(dk.get("hoa_tren_sao_mot_trong"))
        dung_hoa = [x for x in hoa if x["hoa"] == dk["hoa"] and x["cung"] in noi and (not tren or x["sao"] in tren)]
        if not dung_hoa:
            return False
        # "Thái Âm Hoá Kỵ … sáng": độ sáng của chính sao mang hoá, ở cung sao đó đứng
        if muc and tren and not sao and not any(sang(x["sao"], [x["cung"]]) for x in dung_hoa if x["cung"] in nc["cung"]):
            return False
    if dk.get("hoa_tat_ca") and not all(_co_hoa(hoa, h, pv) for h in _ds(dk["hoa_tat_ca"])):
        return False
    for s in _ds(dk.get("khong_co")):
        if s.startswith(_TIEN_TO_THAN):
            if nc["than"] == s[len(_TIEN_TO_THAN):].replace("_", " "):
                return False
        elif any(_co_sao(nc, t, s, hoa) for t in pv):
            return False
    if any(_co_hoa(hoa, h, pv) for h in _ds(dk.get("khong_co_hoa"))):
        return False
    if dk.get("khong_chinh_tinh") and nc["cung"][ten]["chinh"]:
        return False
    so_cat = sum(_so_cat(nc, t) for t in pv)
    so_sat = sum(_so_sat(nc, t) for t in pv)
    if dk.get("khong_co_cat_tinh") and so_cat:
        return False
    g = dk.get("gap")
    if g == "sat_tinh" and not so_sat:
        return False
    if g == "cat_tinh" and not so_cat:
        return False
    if g == "nhieu_sat_hoac_ky" and so_sat + sum(x["hoa"] == "Kỵ" and x["cung"] in pv for x in hoa) < 2:
        return False
    if dk.get("nhom"):                     # chính tinh của cung (vô chính diệu → mượn cung đối)
        chinh = nc["cung"][ten]["chinh"] or nc["cung"][_ke(nc, ten, 6)]["chinh"]
        if not any((tuvi_kb.chinh_tinh(s["ten"]) or {}).get("nhom") in _ds(dk["nhom"]) for s in chinh):
            return False
    if dk.get("tuoi"):
        thu = (nc["lop"].get("dai_han") or {}).get("thu")
        gioi = {"dai_han_dau": 0, "dai_han_dau_hoac_hai": 1}.get(dk["tuoi"])
        if thu is None or gioi is None or thu > gioi:
            return False
    ct = dk.get("can_them")
    if ct:
        noi = _ds(ct.get("cung"))
        muc = _ds(ct.get("hoa_hoac_sao"))
        if not any((m in HOA and _co_hoa(nc["tu_hoa"], m, [t])) or (m not in HOA and _co_sao(nc, t, m, nc["tu_hoa"]))
                   for t in noi for m in muc):
            return False
    return True


def _co_hoa_dk(dk: dict) -> bool:
    return bool(dk.get("hoa") or dk.get("hoa_tat_ca"))


def _cung_xet(dk: dict, nc: dict, lop: str) -> list[str]:
    tat = list(nc["thu_tu"])
    if "cung_than" in dk:
        ct = dk["cung_than"]
        if not nc["than"] or (isinstance(ct, str) and ct != nc["than"]):
            return []
        ds = [nc["than"]]
    elif dk.get("cung") and dk["cung"] != "bat_ky":
        ds = [c for c in _ds(dk["cung"]) if c in nc["cung"]]
    else:
        ds = tat
    if lop == "goc":
        return ds
    o = nc["lop"].get(lop)
    if not o:
        return []
    chi_hoa_tren_sao = dk.get("hoa") and (dk.get("hoa_tren_sao") or dk.get("hoa_tren_sao_mot_trong")) \
        and not (dk.get("sao") or dk.get("sao_mot_trong"))
    if _co_hoa_dk(dk) and (dk.get("cung") or chi_hoa_tren_sao):
        return ds                                    # hoá của lớp, vị trí so với cung gốc
    return [o["cung"]] if o["cung"] in ds else []


def _chi_tiet_dk(dk: dict, nc: dict, cha: dict | None = None) -> list[tuple[str, str]]:
    if cha:                                          # "hoac": thừa hưởng cung / giới / lớp của điều kiện chính
        dk = {**{k: cha[k] for k in ("cung", "cung_than", "gioi_tinh", "lop") if k in cha}, **dk}
    if dk.get("gioi_tinh") and nc.get("gioi_tinh") != dk["gioi_tinh"]:
        return []
    ra = []
    for lop in _ds(dk.get("lop")) or ["goc"]:
        for ten in _cung_xet(dk, nc, lop):
            if _dung_tai(dk, nc, lop, ten):
                ra.append((lop, ten))
    if not ra and isinstance(dk.get("hoac"), dict) and not cha:
        ra = _chi_tiet_dk(dk["hoac"], nc, dk)
    return ra


# ------------------------------------------------------------------ mục có luật riêng (ghi chú đã rõ nghĩa)
def _phan_boi(nc: dict) -> list[str]:
    """Nhật nguyệt phản bối: Thái Dương và Thái Âm đều hãm (bảng Nam phái) — cung của hai sao."""
    o = {}
    for t, c in nc["cung"].items():
        for s in c["chinh"]:
            if s["ten"] in ("Thái Dương", "Thái Âm"):
                o[s["ten"]] = (t, s["do_sang"])
    if len(o) == 2 and all(ds in HAM for _, ds in o.values()):
        return ["Mệnh"]
    return []


def _r_phan_boi(nc):
    return [("goc", t) for t in _phan_boi(nc)]


def _r_phan_boi_tu_lap(nc):
    if not _phan_boi(nc):
        return []
    return [("goc", t) for t in ("Phụ Mẫu", "Huynh Đệ") if _so_sat(nc, t)][:1]


def _r_menh_khong_loc(nc):
    co_loc = lambda t: _co_hoa(nc["tu_hoa"], "Lộc", [t]) or "Lộc Tồn" in nc["cung"][t]["phu"]  # noqa: E731
    if co_loc("Mệnh") or not (co_loc("Phụ Mẫu") or co_loc("Điền Trạch")):
        return []
    return [("goc", "Mệnh")]


def _r_no_boc_cat(nc):
    return [("goc", "Nô Bộc")] if _so_cat(nc, "Nô Bộc") >= 2 or _co_hoa(nc["tu_hoa"], "Lộc", ["Nô Bộc"]) else []


def _r_huynh_de_cat(nc):
    return [("goc", "Huynh Đệ")] if _so_cat(nc, "Huynh Đệ") >= 2 and (
        _co_hoa(nc["tu_hoa"], "Quyền", ["Mệnh"]) or _co_hoa(nc["tu_hoa"], "Lộc", ["Mệnh"])) else []


def _r_no_boc_quyen(nc):
    tai = _co_hoa(nc["tu_hoa"], "Lộc", ["Tài Bạch"]) or "Lộc Tồn" in nc["cung"]["Tài Bạch"]["phu"]
    return [("goc", "Nô Bộc")] if tai and _co_hoa(nc["tu_hoa"], "Quyền", ["Nô Bộc"]) else []


def _r_phu_mau_toi(nc):
    c = nc["cung"]["Phụ Mẫu"]
    trong = not c["chinh"] and "Địa Kiếp" in c["phu"]
    ham = any(s["ten"] == "Thái Dương" and s["do_sang"] in HAM for s in c["chinh"])
    return [("goc", "Phụ Mẫu")] if trong or ham else []


def _cung_hai_lop(nc) -> tuple[str | None, str | None]:
    return (nc["lop"].get("dai_han") or {}).get("cung"), (nc["lop"].get("tieu_han") or {}).get("cung")


def _r_dai_tieu_hong_loan(nc):
    dh, th = _cung_hai_lop(nc)
    if not dh or not th:
        return []
    co = lambda t: any(s in nc["cung"][t]["phu"] for s in ("Hồng Loan", "Thiên Hỷ"))  # noqa: E731
    return [("dai_han", dh), ("tieu_han", th)] if co(dh) and co(th) else []


def _r_dai_tieu_trung_cung(nc):
    dh, th = _cung_hai_lop(nc)
    if not dh or dh != th:
        return []
    xau = _so_sat(nc, dh) >= 2 or _co_hoa(nc["tu_hoa"], "Kỵ", [dh])
    return [("tieu_han", dh)] if xau else []


def _r_chuan_bi_truoc(nc):
    o = nc["lop"].get("dai_han") or {}
    thu = o.get("thu")
    if thu is None or thu + 1 >= len(nc["dai_han_ds"]):
        return []
    sau = nc["dai_han_ds"][thu + 1]
    return [("dai_han", sau)] if _so_sat(nc, sau) >= 2 or _co_hoa(nc["tu_hoa"], "Kỵ", [sau]) else []


# Review CY-1 (ý "chung chung"): Hoá Kỵ của năm Kỷ / Tân luôn rơi trên Văn Khúc / Văn Xương → luật cũ khớp 99,9 % lá
# (ai cũng có năm 2029). Nay chỉ khi Kỵ đó vào cung học hành / công danh (Mệnh, Quan Lộc, Phụ Mẫu) hoặc chính cung của
# năm, và tuổi còn hay đi thi (15–35 tuổi mụ; ngữ cảnh không biết tuổi → không xét tuổi). Ý "năm thuận cho thi cử" cùng
# khung tuổi.
TUOI_THI = (15, 35)
_CUNG_HOC = ("Mệnh", "Quan Lộc", "Phụ Mẫu")


def _tuoi_thi(nc) -> bool:
    t = nc.get("tuoi_mu")
    return t is None or TUOI_THI[0] <= t <= TUOI_THI[1]


def _r_xuong_ky_thi(nc):
    ln = nc["lop"].get("luu_nien")
    if not ln or not _tuoi_thi(nc):
        return []
    noi = (*_CUNG_HOC, ln["cung"])
    return [("luu_nien", x["cung"]) for x in ln.get("tu_hoa") or []
            if x["hoa"] == "Kỵ" and x["sao"] in ("Văn Xương", "Văn Khúc") and x["cung"] in noi][:1]


def _r_khoa_xuong_thi(nc):
    ln = nc["lop"].get("luu_nien")
    if not ln or not _tuoi_thi(nc) or ln["cung"] not in nc["cung"]:
        return []
    c = ln["cung"]
    co = any(x["hoa"] == "Khoa" and x["cung"] == c for x in ln.get("tu_hoa") or []) \
        or any(s in nc["cung"][c]["phu"] for s in ("Văn Xương", "Thiên Việt"))
    return [("luu_nien", c)] if co else []


_RIENG: dict[str, Callable[[dict], list[tuple[str, str]]]] = {
    "yb.hoa.xuong_ky_nam_thi": _r_xuong_ky_thi,
    "yb.hoa.khoa_hoac_xuong_nam_thi": _r_khoa_xuong_thi,
    "yb.cap.nhat_nguyet_phan_boi": _r_phan_boi,
    "yb.cap.nhat_nguyet_phan_boi_vo_chong": _r_phan_boi,
    "yb.cap.nhat_nguyet_phan_boi_tu_lap": _r_phan_boi_tu_lap,
    "yb.cung.menh_khong_loc_tu_lap": _r_menh_khong_loc,
    "yb.cung.no_boc_cat_hop_tac": _r_no_boc_cat,
    "yb.cung.huynh_de_cat_minh_lam_chu": _r_huynh_de_cat,
    "yb.cung.no_boc_quyen_minh_loc": _r_no_boc_quyen,
    "yb.cung.phu_mau_toi_tu_lap_som": _r_phu_mau_toi,
    "yb.hon.dai_tieu_han_hong_loan": _r_dai_tieu_hong_loan,
    "yb.sk.dai_tieu_han_trung_cung": _r_dai_tieu_trung_cung,
    "yb.pp.chuan_bi_truoc_vai_nam": _r_chuan_bi_truoc,
}


# ------------------------------------------------------------------ công khai
def tinh_duoc(m: dict) -> tuple[bool, str | None]:
    """(True, None) khi engine kiểm được điều kiện; (False, lý do) khi không (không đoán)."""
    dk = m.get("dieu_kien") or {}
    if m.get("id") in _RIENG:
        return True, None
    if not dk.get("co_the_tinh"):
        return False, "co_the_tinh = false"
    if dk.get("hai_nguoi") or dk.get("nhom_ca_hai"):
        return False, "luật hai lá số"
    if dk.get("so_sanh"):
        return False, "so sánh chưa định nghĩa"
    if dk.get("ghi_chu") and m.get("id") not in _GHI_CHU_GIAI_THICH:
        return False, "ghi chú chưa cơ học hoá"
    la = set(dk) - _KHOA - {"hai_nguoi", "nhom_ca_hai", "so_sanh"}
    if la:
        return False, f"khoá lạ: {sorted(la)}"
    if not any(k in dk for k in _CU_THE) and not (dk.get("cung") not in (None, "bat_ky") and dk.get("lop")):
        return False, "nguyên tắc chung, không có điều kiện riêng của lá số"
    biet = _sao_biet()
    sao = _ds(dk.get("sao")) + _ds(dk.get("sao_mot_trong")) + [s for c in _ds(dk.get("sao_cap_mot_trong")) for s in c] \
        + [s for s in _ds(dk.get("khong_co")) if not s.startswith(_TIEN_TO_THAN)]
    alt = dk.get("hoac") if isinstance(dk.get("hoac"), dict) else {}
    sao += _ds(alt.get("sao")) + _ds(alt.get("sao_mot_trong"))
    thieu = [s for s in sao if s not in biet]
    if thieu:
        return False, f"sao engine không giữ: {thieu}"
    return True, None


def chi_tiet(m: dict, nc: dict) -> list[tuple[str, str]]:
    """[(lớp, cung)] làm điều kiện của mục đúng trên ngữ cảnh — rỗng = không khớp / không tính được."""
    if not tinh_duoc(m)[0]:
        return []
    if m.get("id") in _RIENG:
        return _RIENG[m["id"]](nc)
    return _chi_tiet_dk(m.get("dieu_kien") or {}, nc)


def khop(m: dict, ngu_canh: dict) -> bool:
    return bool(chi_tiet(m, ngu_canh))


def noi_khop(m: dict, nc: dict) -> list[str]:
    """Tên các cung nơi điều kiện đúng (mọi lớp), theo thứ tự cung trên lá (chỉ số 0 = Dần)."""
    noi = {t for _, t in chi_tiet(m, nc)}
    return [t for t in nc["thu_tu"] if t in noi]


def do_cu_the(m: dict) -> int:
    """Độ cụ thể của luật (để xếp trong `tim`): số điều kiện cụ thể + số sao + 2 khi nêu đích danh cung."""
    dk = m.get("dieu_kien") or {}
    return sum(k in dk for k in _CU_THE) + len(_ds(dk.get("sao"))) + (2 if dk.get("cung") not in (None, "bat_ky") else 0)


def tim(ngu_canh: dict, loai: str | tuple | list | None = None, hien_thi: str | tuple | list | None = None,
        cung: list[str] | None = None) -> list[dict]:
    """Mục KB (hien_thi ≠ "khong") khớp lá số. `loai` / `hien_thi` lọc (một giá trị hoặc danh sách); `cung` = chỉ giữ
    mục có cung khớp thuộc danh sách. Mỗi mục là bản sao + `cung_khop` (theo thứ tự cung trên lá) + `lop_khop`; xếp mục
    cụ thể hơn lên trước (`do_cu_the`), hoà giữ thứ tự KB."""
    loai_ds, ht_ds = _ds(loai), _ds(hien_thi)
    ra = []
    for thu, m in enumerate(kb.tat_ca()):
        if (loai_ds and m["loai"] not in loai_ds) or (ht_ds and m["hien_thi"] not in ht_ds):
            continue
        ct = chi_tiet(m, ngu_canh)
        if cung is not None:
            ct = [x for x in ct if x[1] in cung]
        if ct:
            noi = {t for _, t in ct}
            ra.append((-do_cu_the(m), thu, {**m, "cung_khop": [t for t in ngu_canh["thu_tu"] if t in noi],
                                            "lop_khop": list(dict.fromkeys(lp for lp, _ in ct)), "_chi_tiet": ct}))
    return [x[2] for x in sorted(ra, key=lambda x: (x[0], x[1]))]


def ma_mau(chuong: str, ma: str) -> str:
    """Mã kiểm chứng của một ý: `ds.<chương>.yb.<đuôi mã KB>` (qua ràng buộc SQL 0017 `ds.*`, ≤ 60 ký tự)."""
    duoi = ma[3:] if ma.startswith("yb.") else ma
    return f"ds.{chuong}.yb.{duoi}"[:60].rstrip(".+-")


# ================================================================== nối vào báo cáo đời sống Tử vi (`tuvi_doi_song.lap`)
# Ý "hop" (ý chung): ưu tiên LÀM GIÀU hộp đang có khi `trung_voi` trỏ đúng nội dung hộp đó (trường `y_bo_sung` của hộp:
# một câu + một việc — không đụng `noi_dung`, mã kiểm chứng của hộp giữ nguyên); không có hộp trùng → hộp mới (≤ 2 / chương,
# mã `ds.<chương>.yb.<…>`). Ý thời điểm: năm đang xem → "Năm nay & 3 tháng tới"; năm sau trong mười năm → "Vận hạn".
# Ý sức khoẻ theo năm → thêm lý do vào SK-1 (`suc_khoe_nam.tuvi_nam(them=…)`) — vẫn MỘT hộp "Năm nên chú ý sức khoẻ hơn".
# Ý "goc_nhin_khac" (riêng trường phái): một khung gập / chương (`goc_nhin_khac`, ≤ 3 ý, mỗi ý một mã + phái riêng).
# Không đổi mức nào (hộp mới không mang `muc`), không vào "Điều quan trọng nhất", không vào Lời khuyên.
PHAI_GNK = "tam_hop_hien_dai"
TOI_DA_HOP_MOI, TOI_DA_LAM_GIAU, TOI_DA_GNK = 2, 2, 3
GHI_CHU_GNK = "Một trường phái khác đọc thêm như sau — tham khảo."
_UU_TIEN_LOP = {"dai_han": 3.0, "luu_nien": 2.0, "tieu_han": 1.0, "goc": 0.0}
_TEN_LOP = {"dai_han": "đại hạn", "luu_nien": "lưu niên", "tieu_han": "tiểu hạn", "goc": "lá gốc"}
_CUNG_CHUONG = {"Mệnh": "tong_quan", "Phúc Đức": "tong_quan", "Quan Lộc": "su_nghiep", "Tài Bạch": "tien_bac",
                "Điền Trạch": "nha_cua", "Phu Thê": "tinh_cam", "Phụ Mẫu": "gia_dinh", "Huynh Đệ": "gia_dinh",
                "Tử Nữ": "gia_dinh", "Tật Ách": "suc_khoe", "Nô Bộc": "quan_he", "Thiên Di": "quan_he"}
_CUNG_DAU = {"tong_quan": "Mệnh", "su_nghiep": "Quan Lộc", "tien_bac": "Tài Bạch", "tinh_cam": "Phu Thê",
             "gia_dinh": "Phụ Mẫu", "suc_khoe": "Tật Ách", "quan_he": "Nô Bộc", "nha_cua": "Điền Trạch"}
_THU_TU_NEO = ("Mệnh", "Phu Thê", "Quan Lộc", "Tài Bạch", "Thiên Di", "Phúc Đức", "Điền Trạch", "Nô Bộc", "Phụ Mẫu",
               "Tử Nữ", "Huynh Đệ", "Tật Ách")
# mục thời điểm nói về giai đoạn sau / tuổi nhỏ — đặt ở "Các giai đoạn cuộc đời" thay vì "Năm nay"
_CHUONG_RIENG = {"yb.pp.chuan_bi_truoc_vai_nam": "cuoc_doi", "yb.cung.dai_han_phu_mau_che_cho": "cuoc_doi",
                 "yb.sao.cu_mon_tuoi_di_hoc": "cuoc_doi"}
_MO_DAU_THOI = re.compile(r"^(?:Năm có nét này|Giai đoạn có nét này|Giai đoạn mười năm này|Giai đoạn này|Năm(?= \D))\s*,?\s*")


def slug_ma(ma: str) -> str:
    return (ma[3:] if ma.startswith("yb.") else ma).replace(".", "_")


def _chuong_cua(m: dict, lop: str, cung: str, nam: int | None, nam_xem: int | None) -> str | None:
    if m["id"] in _CHUONG_RIENG:
        return _CHUONG_RIENG[m["id"]]
    if lop != "goc":
        if m["loai"] == "suc_khoe_phong_ngua":
            return "suc_khoe"
        return "nam_nay" if nam == nam_xem else "van_han"
    if m["loai"] == "suc_khoe_phong_ngua":
        return "suc_khoe"
    if cung == "Tật Ách":                    # chương Sức khoẻ chỉ nói sức khoẻ
        return None
    if m["loai"] == "hon_nhan":
        return "gia_dinh" if cung in ("Phụ Mẫu", "Huynh Đệ", "Tử Nữ") else "tinh_cam"
    if m["loai"] == "nghe_nghiep":
        return "tien_bac" if cung in ("Tài Bạch", "Điền Trạch") else "su_nghiep"
    return _CUNG_CHUONG.get(cung)


def _neo(ct: list[tuple[str, str]]) -> tuple[str, str]:
    """(lớp, cung) đại diện: lớp ưu tiên đại hạn > lưu niên > tiểu hạn > gốc, rồi cung theo `_THU_TU_NEO`."""
    return min(ct, key=lambda x: (-_UU_TIEN_LOP[x[0]], _THU_TU_NEO.index(x[1]) if x[1] in _THU_TU_NEO else 99))


def _do_cu_the(m: dict) -> float:
    """Độ riêng của điều kiện (càng nhiều ràng buộc càng riêng cho lá này) — để xếp ý trong chương."""
    dk = m.get("dieu_kien") or {}
    n = sum(1 for k in dk if k not in ("co_the_tinh", "ghi_chu", "sao_them_tuy_chon", "lop"))
    n += 0.5 * len(_ds(dk.get("sao"))) + 0.25 * len(_ds(dk.get("sao_mot_trong")))
    if dk.get("cung") in (None, "bat_ky") and "cung_than" not in dk:
        n -= 1.0
    return n


def _khi(lop: str, nam: int | None, nc_nam: dict, loi: str = "") -> tuple[str, dict]:
    """Nhãn thời gian của ý thời điểm + trường hộp (`nam` / `tu_tuoi` / `den_tuoi`). Lời nói về MỘT năm ("Năm …") → nhãn
    năm dù lớp khớp mạnh nhất là đại hạn (vd "đại hạn và tiểu hạn cùng gặp …: năm đó …")."""
    if lop == "dai_han" and not (loi.startswith("Năm") and nam):
        o = nc_nam["lop"].get("dai_han") or {}
        if o.get("tu_tuoi") is not None:
            return f"Mười năm {o['tu_tuoi']}–{o['den_tuoi']} tuổi", {"tu_tuoi": o["tu_tuoi"], "den_tuoi": o["den_tuoi"]}
        return "Mười năm này", {}
    return (f"Năm {nam}" if nam else "Năm nay"), ({"nam": nam} if nam else {})


def _loi_thoi(loi: str, khi: str) -> tuple[str, str]:
    """(tiêu đề, lời) của ý thời điểm: nói thẳng mốc ("Năm 2028: thuận cho thi cử…") thay cụm chỉ trỏ chung ("Năm có nét
    này, …", "Năm thuận cho …"). Tiêu đề = mốc + vế đầu (≤ 60 ký tự, cắt ở dấu ngắt vế)."""
    moi = _MO_DAU_THOI.sub("", loi, count=1)
    moi = moi[:1].lower() + moi[1:]
    ve = re.split(r"\s*[,;:—(]\s*|\.\s", moi, maxsplit=1)[0].rstrip(". ")
    tieu = f"{khi}: {ve}" if len(f"{khi}: {ve}") <= 70 else khi
    return tieu, f"{khi}: {moi}"


def dieu_kien_loi(m: dict) -> str:
    """Dòng điều kiện viết lại ("Khi …", cùng hàm trang kiến thức `kb.trang_tuvi._khi`) — thay `y_goc_tom_tat` (bản tóm
    ý nguồn, nội bộ — review CY-1: không bao giờ ra "Vì sao nói vậy" / gói hỏi đáp). Điều kiện chỉ có cung chung chung
    → rỗng."""
    from app.kb.trang_tuvi import _khi  # noqa: PLC0415 — trang_tuvi không import mô-đun này
    try:
        s = _khi(m.get("dieu_kien") or {}).strip()
    except Exception:  # noqa: BLE001 — điều kiện lạ: bỏ dòng, không vỡ báo cáo
        return ""
    return s if len(s) > 12 else ""


def _can_cu(m: dict, lop: str, cung: str, nam: int | None, than: str | None = None) -> str:
    ten = f"cung an Thân ({cung})" if than and cung == than and cung != "Mệnh" else f"cung {cung}"
    noi = ten + (f" ({_TEN_LOP[lop]}{f' năm {nam}' if lop == 'luu_nien' and nam else ''})" if lop != "goc" else "")
    dk = dieu_kien_loi(m)
    return f"Ý bổ sung (tham khảo) — {noi}" + (f": {dk}" if dk else "")


def _sao_dk(m: dict) -> list[str]:
    dk = m.get("dieu_kien") or {}
    return _ds(dk.get("sao")) + _ds(dk.get("sao_mot_trong"))


def loi_hien(m: dict, nc: dict | None = None, cung: str | None = None) -> str | None:
    """Lời hiển thị của một ý trong BÁO CÁO / HỎI ĐÁP (trang kiến thức vẫn dùng `loi_doi_thuong` sau dòng điều kiện):
    `loi_ro` (tự đứng được — không "nét này" trơ trọi; `{mang}` = tên đời thường của cung khớp) hoặc lời gốc. Ý có hai
    đầu sáng / hãm (`loi_do_sang`) → chỉ nửa đúng với sao trong cung khớp; không xác định được → None (không hiện)."""
    hai = m.get("loi_do_sang")
    if hai:
        if not nc or not cung or cung not in nc.get("cung", {}):
            return None
        nhom = [g for g in dict.fromkeys(_nhom_sang(nc, cung, x) for x in _sao_dk(m) if _co_sao(nc, cung, x, []))
                if g]
        if not nhom:
            return None
        return " ".join(hai[g] for g in ("sang", "ham") if g in nhom)
    s = m.get("loi_ro") or m["loi_doi_thuong"]
    if "{mang}" in s:
        from app.luangiai.tuvi_doi_song import _vat  # noqa: PLC0415 — tránh vòng import
        s = s.replace("{mang}", _vat(cung) if cung else "mảng đó")
    return s


def viec_hien(m: dict) -> str:
    return m.get("viec_ro") or m["viec_nen_lam"]


# Rà "chung chung" (test_tuvi_doi_song_chung_chung): ý theo năm của MỘT sao gốc gần như ai cũng gặp trong mười năm (cung năm
# đi qua đủ 12 cung) → hộp / ý theo năm chỉ xét năm đang xem + 3 năm sau; SK-1 vẫn xét đủ mười năm như hộp năm sức khoẻ.
SO_NAM_Y = 4
# Điều kiện chỉ là "vắng" (không có hoá / sao / chính tinh / cát tinh) đúng với rất nhiều lá → chỉ làm giàu hộp đang có.
_CHI_VANG = {"khong_co", "khong_co_hoa", "khong_chinh_tinh", "khong_co_cat_tinh"}


# Review CY-1 (audit 1.000 lá golden, ý vào báo cáo ở > 60 % số lá — lời chung, ai cũng nhận): chỉ giữ ở trang kiến
# thức + hỏi đáp, không vào báo cáo; hoặc chỉ vào báo cáo khi đúng cung nói về điều ý ấy tả (điều kiện riêng của lá).
_CHI_TRANG = {"yb.cung.han_cung_co_nguoi_cuoi", "yb.pp.sat_don_thu"}
_CUNG_BAO_CAO = {"yb.hoa.ky_nghi_khong_thong": ("Mệnh", "Phúc Đức"),        # "nghĩ không thông" = nét của tâm trí
                 "yb.sao.cu_mon_sang_ham": ("Mệnh", "Quan Lộc", "Thiên Di", "Nô Bộc")}   # lời nói ở chỗ làm, ra ngoài
# lời nói về CẢ GIAI ĐOẠN ("Giai đoạn này nhiều việc phải tự chạy…") — trong báo cáo chỉ khi chính đại hạn mang sao đó
# (lớp lưu niên đi qua cung có Thất Sát / Phá Quân gần như năm nào cũng có → 67 % lá)
_LOP_BAO_CAO = {"yb.cap.sat_pha_tham_dai_han": ("dai_han",)}
# ý theo năm đi qua cung có một cặp sao phổ biến (Khôi / Việt: 4 năm đầu gần như luôn gặp — 60 % lá) → báo cáo chỉ nói
# năm đang xem và năm sau (lời gần, cụ thể), các năm khác để hỏi đáp
_NAM_GAN_BAO_CAO = {"yb.sao.khoi_viet_nam_nang_do": 2}


def _chi_vang(dk: dict) -> bool:
    cu_the = {k for k in dk if k in _CU_THE}
    return bool(cu_the) and cu_the <= _CHI_VANG


def chuan_bi(ls: dict, gioi_tinh: str | None, nam_am_xem: int, nam_am_sinh: int, vh: dict | None = None,
             so_nam: int = 10) -> dict:
    """Tìm mọi ý khớp lá số (năm đang xem + `so_nam − 1` năm sau, chỉ lớp lưu niên) — một lần cho cả báo cáo.
    Ý thành hộp / "Góc nhìn khác" chỉ trong `SO_NAM_Y` năm đầu; lý do SK-1 xét đủ `so_nam` năm.
    → {"nc", "khop": [{m, lop, cung, nam, chuong, w, nc}], "sk": {năm: [(lý do, căn cứ)]}}."""
    nc = ngu_canh_tu_la_so(ls, gioi_tinh, nam_am_xem, nam_am_sinh, vh)
    khop_ds, sk = [], {}
    for k in range(so_nam):
        nam = nam_am_xem + k
        n_k = nc if k == 0 else ngu_canh_nam(nc, nam)
        for x in tim(n_k, LOAI_BAO_CAO):
            ct = x["_chi_tiet"] if k == 0 else [c for c in x["_chi_tiet"] if c[0] == "luu_nien"]
            if k >= _NAM_GAN_BAO_CAO.get(x["id"], so_nam):
                continue
            if x["id"] in _LOP_BAO_CAO:
                ct = [c for c in ct if c[0] in _LOP_BAO_CAO[x["id"]]]
            if not ct:
                continue
            lop, cung = _neo(ct)
            m = {kk: v for kk, v in x.items() if not kk.startswith("_")}
            dk = m.get("dieu_kien") or {}
            cac_cung = list(dict.fromkeys(t for lp, t in ct if lp == lop))
            # Ý theo SAO không ghi cung (vd "Cự Môn sáng / hãm") là nét của CON NGƯỜI khi sao ở Mệnh / cung an Thân; sao
            # nằm ở cung khác → chỉ làm giàu hộp của chính sao đó (không thành hộp mới ở một chương lạc chủ đề).
            chi_lam_giau = False
            if (lop == "goc" and m["loai"] in ("sao_cung", "cap_sao", "tu_hoa_cung") and m["id"] not in _RIENG
                    and dk.get("cung") in (None, "bat_ky") and "cung_than" not in dk):
                nguoi = [t for t in cac_cung if t in ("Mệnh", nc["than"])]
                if nguoi:
                    cung = nguoi[0]             # nét của chính người xem → chương "Con người bạn"
                else:
                    chi_lam_giau = True
            if _chi_vang(dk) and m["id"] not in _RIENG:
                chi_lam_giau = True
            if m["id"] in _CHI_TRANG:
                continue
            if m["id"] in _CUNG_BAO_CAO:
                cho = [t for t in cac_cung if t in (*_CUNG_BAO_CAO[m["id"]], nc["than"])]
                if not cho:
                    continue
                cac_cung = cho
                cung = cung if cung in cho else cho[0]
            # Sức khoẻ theo lá gốc: chỉ làm giàu MỘT hộp phần cơ thể (UX v3 M3 — không hộp phần cơ thể thứ hai).
            if lop == "goc" and m["loai"] == "suc_khoe_phong_ngua" and m["hien_thi"] == "hop":
                chi_lam_giau = True
            if chi_lam_giau and m["hien_thi"] != "hop":
                continue
            if m["loai"] == "suc_khoe_phong_ngua" and m["hien_thi"] == "hop" and lop != "goc":
                if lop == "luu_nien":           # SK-1: thêm lý do của năm (một hộp sức khoẻ, không hộp thứ hai)
                    sk.setdefault(nam, []).append((slug_ma(m["id"]), _can_cu(m, lop, cung, nam, nc["than"])))
                continue                        # đại hạn đi Tật Ách: SK-1 đã có lý do `dai_han`
            if k >= SO_NAM_Y:
                continue
            ch = _chuong_cua(m, lop, cung, nam, nam_am_xem)
            if (lop == "goc" and not chi_lam_giau and m["loai"] in ("sao_cung", "cap_sao", "tu_hoa_cung")
                    and dk.get("cung") in (None, "bat_ky") and "cung_than" not in dk and m["id"] not in _RIENG):
                ch = "tong_quan"
            if not ch:
                continue
            w = _UU_TIEN_LOP[lop] + _do_cu_the(m) + (0.3 if m.get("co_trong_co_thu") else 0) \
                + (0.5 if _CUNG_DAU.get(ch) == cung else 0) - 0.05 * k
            khop_ds.append({"m": m, "lop": lop, "cung": cung, "nam": nam, "chuong": ch, "w": w, "nc": n_k,
                            "cac_cung": cac_cung, "chi_lam_giau": chi_lam_giau})
    return {"nc": nc, "khop": khop_ds, "sk": sk}


def _tim_hop_trung(ds: list[dict], x: dict) -> dict | None:
    """Hộp đang có cùng nội dung với `trung_voi` của ý (cùng sao / hoá / nhóm sao ở cùng cung, hoặc cùng cách cục, Thân cư,
    phần cơ thể, lớp thời gian của năm đang xem). Không chắc → None (ý thành hộp mới)."""
    for cung in [x["cung"], *[t for t in x.get("cac_cung") or [] if t != x["cung"]]]:
        h = _tim_hop_trung_cung(ds, x, cung)
        if h is not None:
            return h
    return None


def _tim_hop_trung_cung(ds: list[dict], x: dict, cung: str) -> dict | None:
    from app.luangiai.doi_song_chung import slug  # noqa: PLC0415
    m, lop = x["m"], x["lop"]
    tv = m.get("trung_voi") or ""
    p = tv.split(".")
    # chỉ hộp trong đúng chương của ý (ý hôn nhân ở Phúc Đức không gắn vào hộp "Con người bạn"); ý chỉ-làm-giàu thì
    # gắn vào hộp của chính sao / hoá đó ở bất kỳ chương nào
    hop = [(c, h) for c in ds for h in c.get("hop", [])
           if not h.get("dang_xem_lai") and not h.get("y_bo_sung") and h.get("ma_mau") and not h.get("_yb")
           and (x.get("chi_lam_giau") or c["ma"] == x["chuong"])]

    def tim1(dk) -> dict | None:
        return next((h for c, h in hop if dk(c, h)), None)

    if not tv:
        return None
    if lop != "goc":
        if x["chuong"] != "nam_nay":
            return None
        return tim1(lambda c, h: c["ma"] == "nam_nay" and h["ma_mau"].startswith(f"ds.nam_nay.{lop}."))
    if tv.startswith(("tuvi_doi_song_kb.sao_linh_vuc.", "tuvi_kb.sao_cung.", "tuvi_kb.chinh_tinh.")):
        sao = p[2]
        return tim1(lambda c, h: h.get("_cung") == cung and (h.get("can_cu") or [""])[0].startswith(f"{sao} ("))
    if tv.startswith(("tuvi_doi_song_kb.hoa_linh_vuc.", "tuvi_kb.tu_hoa_cung.", "tuvi_kb.tu_hoa.")) and len(p) >= 3:
        hoa = p[2]
        return tim1(lambda c, h: h.get("_cung") == cung and f".hoa_{slug(hoa)}" in h["ma_mau"])
    if tv.startswith(("tuvi_doi_song_kb.nhom_sao_linh_vuc.", "tuvi_doi_song_kb.nhom_sao_chi_tiet.", "tuvi_kb.phu_tinh.")):
        ten = p[2] if tv.startswith("tuvi_doi_song_kb.nhom_sao_linh_vuc.") else p[-1]
        nhom = ten if ten in ("sat", "cat") else "sat" if ten in LUC_SAT else "cat" if ten in LUC_CAT else \
            "dao_hoa" if ten in ("Hàm Trì", "Hồng Loan", "Thiên Hỷ", "Thiên Diêu") else None
        if not nhom:
            return None
        return tim1(lambda c, h: h.get("_cung") == cung and re.search(rf"\.{nhom}(?:\+|\.)", h["ma_mau"]))
    if tv.startswith("tuvi_cach_cuc.cach."):
        return tim1(lambda c, h: h["ma_mau"].startswith(f"ds.tong_quan.cach.{slug(p[2])}."))
    if tv.startswith("tuvi_doi_song_kb.than_cu"):
        return tim1(lambda c, h: h["ma_mau"].startswith("ds.tong_quan.than_cu."))
    if tv.startswith("tuvi_doi_song_kb.suc_khoe"):
        # hộp phần cơ thể mà "Vì sao nói vậy" có đúng sao của ý (vd Thái Dương ↔ ý về đôi mắt) — không gắn ý sang bộ phận khác
        sao = [s for s in (_ds((m.get("dieu_kien") or {}).get("sao")) + _ds((m.get("dieu_kien") or {}).get("sao_mot_trong")))]
        return tim1(lambda c, h: c["ma"] == "suc_khoe" and h["loai"] != "thoi_diem"
                    and any(cu.startswith(f"{s} (") for cu in h.get("can_cu") or [] for s in sao))
    return None


def lam_giau(ds: list[dict], bs: dict) -> None:
    """Pha 1 (trước khi chọn "Điều quan trọng nhất"): ý "hop" trùng hộp đang có → `hop.y_bo_sung` = {noi_dung, viec}
    (+ một dòng "Vì sao nói vậy"). `noi_dung` và mã của hộp không đổi. Mỗi hộp nhận tối đa một ý; ≤ TOI_DA_LAM_GIAU hộp
    mỗi chương. Ý đã dùng ở đây không thành hộp mới."""
    dem: dict[str, int] = {}
    for x in sorted((x for x in bs["khop"] if x["m"]["hien_thi"] == "hop"), key=lambda x: (-x["w"], x["m"]["id"])):
        h = _tim_hop_trung(ds, x)
        if not h:
            continue
        ch = next(c["ma"] for c in ds if any(y is h for y in c.get("hop", [])))
        if dem.get(ch, 0) >= TOI_DA_LAM_GIAU:
            continue
        m = x["m"]
        cung = h.get("_cung") or x["cung"]
        loi = loi_hien(m, x["nc"], cung)
        if not loi:
            continue
        if x["lop"] != "goc":                  # ý thời điểm trong hộp năm: nói thẳng mốc ("Năm nay: …")
            loi = _loi_thoi(loi, _khi(x["lop"], x["nam"], x["nc"], loi)[0])[1]
        dem[ch] = dem.get(ch, 0) + 1
        h["y_bo_sung"] = {"noi_dung": loi, "viec": viec_hien(m), "ma": m["id"]}
        h.setdefault("can_cu", []).append(_can_cu(m, x["lop"], cung, x["nam"], x["nc"].get("than")))
        x["da_dung"] = True


_TIEU_DE_CHUNG = "Một nét nên biết thêm"


def _chuan_td(s: str) -> str:
    return " ".join(re.sub(r"[^\w ]", " ", (s or "").lower()).split())


def _y(x: dict, ch: str, phai: str | None = None) -> dict | None:
    from app.luangiai import doi_song_khuon as kh  # noqa: PLC0415
    from app.luangiai.doi_song_chung import _tieu_de  # noqa: PLC0415
    m, lop = x["m"], x["lop"]
    loi, them = loi_hien(m, x["nc"], x["cung"]), {}
    if not loi:
        return None
    tieu = _tieu_de(loi, _TIEU_DE_CHUNG)
    if lop != "goc":
        khi, them = _khi(lop, x["nam"], x["nc"], loi)
        tieu, loi = _loi_thoi(loi, khi)
    # Review CY-1: tiêu đề không được là cả thân / thân không được rỗng. Khuôn hộp (`tach_tieu_de`) lấy trọn câu đầu
    # làm tiêu đề → lời một câu thì tiêu đề = câu đó, thân = việc nên làm (không lặp ở `huong_xu_ly`).
    tieu, than = kh.tach_tieu_de(tieu, loi)
    huong = viec_hien(m)
    # EN-ALL: quyết định dựa trên chữ (thân quá ngắn / trùng tiêu đề) lấy theo bản Việt → khung bản dịch không lệch
    if kh.quyet(("y_bs_than_ngan", ch, m["id"], lop, x.get("nam")),
                len(_chuan_td(than).split()) < 4 or _chuan_td(than) == _chuan_td(tieu)):
        than, huong = huong, None
    y = {"tieu_de": tieu, "noi_dung": than, "huong_xu_ly": huong,
         "can_cu": [_can_cu(m, lop, x["cung"], x["nam"], x["nc"].get("than"))], "ma_mau": ma_mau(ch, m["id"]), **them}
    if phai:
        y["phai"] = phai
    return y


def _ghi_nam(y: dict, ns: list[int]) -> None:
    ten = "Năm " + ", ".join(map(str, ns[:-1])) + f" và {ns[-1]}"
    for k in ("tieu_de", "noi_dung"):
        y[k] = y[k].replace(f"Năm {ns[0]}", ten, 1)
    y["nam_gop"] = ns


def them_vao(ds: list[dict], bs: dict, hoc: tuple = (None, None)) -> None:
    """Pha 2 (sau "Điều quan trọng nhất"): hộp mới cho ý "hop" chưa làm giàu được (≤ 2 / chương, cuối danh sách hộp) +
    khung "Góc nhìn khác" (≤ 3 ý / chương). Luật HỌC chung (`doi_song_khuon.danh_gia_phieu`): ≥ 100 phiếu & < 40 % đúng →
    không hiện, ghi "Đang xem lại" vào `can_cu` của chương; phiếu "chưa đúng" của chính người xem → xếp cuối."""
    from app.luangiai import doi_song_khuon as kh  # noqa: PLC0415
    trong_so, ca_nhan = hoc[0] or {}, hoc[1] or {}
    theo_ch = {c["ma"]: c for c in ds}
    nhom: dict[tuple[str, str], list[dict]] = {}
    for x in sorted(bs["khop"], key=lambda x: (-x["w"], x["m"]["id"])):
        if x.get("da_dung") or x.get("chi_lam_giau") or x["chuong"] not in theo_ch:
            continue
        nhom.setdefault((x["chuong"], x["m"]["hien_thi"]), []).append(x)
    for (ch, loai), xs in nhom.items():
        c = theo_ch[ch]
        # cùng một ý ở nhiều năm (Vận hạn) → một hộp ghi các năm; mỗi ý tối đa một lần / chương
        gop: dict[str, dict] = {}
        for x in sorted(xs, key=lambda x: (x["nam"], -x["w"])):
            if x["m"]["id"] in gop:
                if ch == "van_han" and x["nam"] not in gop[x["m"]["id"]]["_nam"]:
                    gop[x["m"]["id"]]["_nam"].append(x["nam"])
            else:
                gop[x["m"]["id"]] = {**x, "_nam": [x["nam"]]}
        xs = sorted(gop.values(), key=lambda x: (-x["w"], x["m"]["id"]))
        giu, cuoi = [], []
        toi_da = TOI_DA_HOP_MOI if loai == "hop" else TOI_DA_GNK
        for x in xs:
            y = _y(x, ch, PHAI_GNK if loai == "goc_nhin_khac" else None)
            if y is None:
                continue
            if len(x.get("_nam") or []) > 1:
                _ghi_nam(y, x["_nam"][:3])
            dg = kh.danh_gia_phieu(trong_so.get(y["ma_mau"]))
            if dg:
                y["ty_le_dung"], y["so_phieu"] = dg[0], dg[1]
                if dg[2]:
                    c.setdefault("can_cu", []).append(f"Đang xem lại: {y['tieu_de']}")
                    continue
            (cuoi if ca_nhan.get(y["ma_mau"]) == "chua_dung" else giu).append(y)
            if len(giu) + len(cuoi) >= toi_da:
                break
        ds_y = giu + cuoi
        if not ds_y:
            continue
        if loai == "hop":
            # trước các hộp người này đã bấm "chưa đúng" (những hộp đó luôn đứng cuối chương)
            i = next((k for k, h in enumerate(c["hop"]) if h.get("_chua_dung")), len(c["hop"]))
            c["hop"][i:i] = [{"loai": "thoi_diem" if (y.get("nam") or y.get("tu_tuoi")) else "loi_khuyen", **y,
                              "_w": 0.0, "_ch": ch, "_yb": True} for y in ds_y]
        else:
            c["goc_nhin_khac"] = {"loai": "goc_nhin_khac", "tieu_de": "Góc nhìn khác", "ghi_chu": GHI_CHU_GNK,
                                  "y": ds_y}
