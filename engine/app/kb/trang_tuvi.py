# -*- coding: utf-8 -*-
"""SEO-H — 168 trang "sao X ở cung Y" (14 chính tinh × 12 cung), dựng từ KB Tử vi (chỉ ĐỌC + GHÉP).

Lời luận lấy nguyên từ tuvi_kb.json (sao_cung, chinh_tinh, cung, tu_hoa_cung, do_sang). Phần riêng của từng trang
là dữ kiện TÍNH được, không phải văn sinh thêm:
- độ sáng Nam phái của sao ở từng chi (calc/tuvi_do_sang_vn, đối chứng lasotuvi 156/156);
- chính tinh đồng cung và ở cung xung chiếu khi sao đứng ở từng chi (calc/tuvi_vi_tri, đối chứng 60/60 lá);
- cung xung chiếu + hai cung tam hợp của cung Y (vòng 12 cung);
- năm can nào sao được hoá Lộc/Quyền/Khoa/Kỵ (bảng tứ hoá iztro, calc/tuvi_luu_nguyet.TU_HOA).
Đăng ký vào `trang._TRANG` như SEO-G để dùng chung sitemap, bản .md, trang chủ đề.
"""
from __future__ import annotations

import re

from app.calc import tuvi_do_sang_vn as ds_vn
from app.calc import tuvi_vi_tri as vt
from app.calc.tuvi_luu_nguyet import TU_HOA

_HOA = ("Lộc", "Quyền", "Khoa", "Kỵ")
_SANG = ("Miếu", "Vượng", "Đắc")


def _t():                       # tránh vòng import: trang.py nạp module này ở cuối
    from app.kb import trang
    return trang


def _kb() -> dict:
    return _t()._doc("tuvi_kb.json")


def _hoa_dau(s: str) -> str:
    return s[:1].upper() + s[1:]


def _bo_nhan(s: str) -> str:
    """KB viết "Sáng: …" / "Hãm: …" / "Kém sáng: …" — trang đã có nhãn riêng, bỏ để khỏi lặp."""
    return re.sub(r"^(Sáng|Hãm|Kém sáng)\s*:\s*", "", s.strip())


def _ds_ten(ds: list[str]) -> str:
    return ", ".join(ds[:-1]) + " và " + ds[-1] if len(ds) > 1 else (ds[0] if ds else "")


def ds_sao_cung() -> list[tuple[tuple[str, str], str]]:
    t, kb = _t(), _kb()
    return [((sao, cung), f"{t._slug(sao)}-cung-{t._slug(cung)}")
            for sao in kb["chinh_tinh"] for cung in kb["cung"] if cung in kb["sao_cung"].get(sao, {})]


def _vong() -> list[str]:
    return list(_kb()["cung"])


def _cung_lien(cung: str) -> tuple[str, str, str]:
    """(cung xung chiếu, hai cung tam hợp) — vòng 12 cung theo thứ tự KB (Mệnh, Huynh Đệ, …, Phụ Mẫu)."""
    v = _vong()
    i = v.index(cung)
    return v[(i + 6) % 12], v[(i + 4) % 12], v[(i + 8) % 12]


def _theo_chi(sao: str, cung: str) -> list[str]:
    doi = _cung_lien(cung)[0]
    ra = []
    for chi, o in vt.bo_cuc_theo_sao(sao).items():
        ds = ds_vn.do_sang(sao, chi)
        dong = f"đồng cung {_ds_ten(o['dong_cung'])}" if o["dong_cung"] else "đứng một mình (không chính tinh khác)"
        xung = (f"cung {doi} đối diện (ở {o['xung_chieu_chi']}) có {_ds_ten(o['xung_chieu'])}" if o["xung_chieu"]
                else f"cung {doi} đối diện (ở {o['xung_chieu_chi']}) vô chính diệu")
        ra.append(f"{chi}{f' ({ds})' if ds else ''}: {dong}; {xung}.")
    return ra


def _nhom_dong_cung(sao: str) -> str:
    """Gom các chi theo bộ sao đồng cung: "đứng một mình ở Tý, Ngọ; cùng Tử Vi ở Tỵ, Hợi; …"."""
    nhom: dict[tuple[str, ...], list[str]] = {}
    for chi, o in vt.bo_cuc_theo_sao(sao).items():
        nhom.setdefault(tuple(o["dong_cung"]), []).append(chi)
    phan = [(f"cùng {_ds_ten(list(k))}" if k else "đứng một mình") + f" ở {', '.join(v)}" for k, v in nhom.items()]
    return "; ".join(phan)


def _sang_ham(sao: str) -> tuple[list[str], list[str]]:
    bang = ds_vn.BANG.get(sao, {})
    return ([c for c in vt.CHI if bang.get(c) in _SANG], [c for c in vt.CHI if bang.get(c) == "Hãm"])


def _hoa_cua_sao(sao: str) -> list[tuple[str, str]]:
    return [(can, _HOA[i]) for can, ds in TU_HOA.items() for i, s in enumerate(ds) if s == sao]


def trang_sao_cung(k: tuple[str, str], slug: str) -> dict:
    t, kb = _t(), _kb()
    sao, cung = k
    s, c = kb["chinh_tinh"][sao], kb["cung"][cung]
    nd = kb["sao_cung"][sao][cung]
    doi, th1, th2 = _cung_lien(cung)
    sang, ham = _sang_ham(sao)
    khi_sang, khi_ham = _hoa_dau(_bo_nhan(s["khi_sang"])), _hoa_dau(_bo_nhan(s["khi_ham"]))
    tra_loi = (f"{sao} ở cung {cung}: {_t()._cau(nd)} Cung {cung} nói về {c['xem_duoc']}. "
               f"Nghĩa đậm hay nhạt tuỳ {sao} sáng hay hãm ở chi cung {cung} rơi vào, và sao nào đi cùng.")
    sang_ham = []
    if sang:
        sang_ham.append(f"Sáng (Miếu/Vượng/Đắc) ở {', '.join(sang)} — {khi_sang}")
    if ham:
        sang_ham.append(f"Hãm ở {', '.join(ham)} — {khi_ham}")
    else:
        sang_ham.append(f"{sao} không có vị trí hãm theo bảng Nam phái; khi đứng chỗ kém sáng: {khi_ham}")
    muc = [
        {"tieu_de": f"Cung {cung} nói về điều gì", "doan": f"{c['y_nghia']} {_t()._cau(_hoa_dau(c['xem_duoc']))}"},
        {"tieu_de": f"Tính chất sao {sao}", "danh_sach": [
            _t()._cau(s["tinh_chat"]), "Điểm mạnh: " + _t()._cau(s["diem_manh"]), "Mặt tối: " + _t()._cau(s["mat_toi"])]},
        {"tieu_de": f"Khi {sao} sáng, khi {sao} hãm", "danh_sach": sang_ham},
        {"tieu_de": f"{sao} ở cung {cung} theo từng vị trí", "danh_sach": _theo_chi(sao, cung),
         "doan": (f"Cung {cung} có thể rơi vào bất kỳ chi nào trong 12 chi. Khi {sao} đứng ở mỗi chi, độ sáng (bảng "
                  f"Nam phái) và các chính tinh đi cùng là cố định — dưới đây là cả 12 trường hợp.")},
        {"tieu_de": f"Tam phương tứ chính của cung {cung}",
         "doan": (f"Không đọc {sao} một mình: cung {cung} luôn xét cùng cung xung chiếu và hai cung tam hợp."),
         "danh_sach": [f"Xung chiếu — cung {doi}: {kb['cung'][doi]['y_nghia']}",
                       f"Tam hợp — cung {th1}: {kb['cung'][th1]['y_nghia']}",
                       f"Tam hợp — cung {th2}: {kb['cung'][th2]['y_nghia']}"]},
    ]
    hoa = _hoa_cua_sao(sao)
    if hoa:
        muc.append({"tieu_de": f"Khi {sao} hoá Lộc, Quyền, Khoa, Kỵ ở cung {cung}",
                    "doan": "Sinh năm có thiên can dưới đây thì sao được hoá (bảng tứ hoá dùng trên lá số Hiểu Bản Thân).",
                    "danh_sach": [f"Năm {can}: {sao} hoá {h} — {kb['tu_hoa_cung'][h][cung]}" for can, h in hoa
                                  if cung in kb["tu_hoa_cung"].get(h, {})]})
    muc.append({"tieu_de": "Câu hỏi tự soi", "danh_sach": [s["cau_tu_soi"], c["cau_tu_soi"]]})

    hoi_dap = [
        {"hoi": f"{sao} ở cung {cung} có ý nghĩa gì?", "dap": _t()._cau(nd)},
        {"hoi": f"{sao} ở cung {cung} tốt hay xấu?",
         "dap": (f"Tử vi không chia sao tốt hay xấu tuyệt đối. {sao} sáng ở {', '.join(sang) or 'không chi nào'}"
                 + (f", hãm ở {', '.join(ham)}" if ham else "") + f". Khi sáng: {khi_sang} Khi {'hãm' if ham else 'kém sáng'}: {khi_ham}")},
        {"hoi": f"{sao} ở cung {cung} đi cùng sao nào?",
         "dap": (f"Tuỳ chi: {sao} {_nhom_dong_cung(sao)}. Ngoài ra luôn xem cung {doi} xung chiếu và hai cung "
                 f"tam hợp {th1}, {th2}.")},
    ]
    if hoa:
        hoi_dap.append({"hoi": f"Năm nào {sao} hoá Lộc, Quyền, Khoa, Kỵ?",
                        "dap": _hoa_dau("; ".join(f"năm {can}: hoá {h}" for can, h in hoa)) + "."})
    v = _vong()
    i = v.index(cung)
    return {
        "loai": "sao_cung", "slug": slug,
        "tieu_de": f"{sao} ở cung {cung}: ý nghĩa, sáng hãm, sao đi cùng",
        "mo_ta": t._cat(f"{sao} ở cung {cung} trong Tử vi: {nd} Sáng hãm theo 12 chi, sao đồng cung, xung chiếu, tứ hoá."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": list(kb["source"].values()) + [
            "Vị trí chính tinh và độ sáng: tính theo khẩu quyết an sao, đối chiếu lasotuvi (MIT) 60 lá số mẫu."],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "sao", "slug": f"sao-{t._slug(sao)}"}, {"loai": "cung", "slug": f"cung-{t._slug(cung)}"},
                      {"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(doi)}"},
                      {"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(v[(i + 1) % 12])}"}],
        "minh_hoa": {"kieu": "sao_cung", "ten": sao, "ten_han": s["ten_han"], "ngu_hanh": s["ngu_hanh"],
                     "chi_so": i, "vong": v},
    }


# ---- SEO-I: 48 trang "Hoá X ở cung Y" -----------------------------------------------------------------------
def _slug_hoa(h: str) -> str:
    return f"hoa-{_t()._slug(h)}"


def ds_hoa_cung() -> list[tuple[tuple[str, str], str]]:
    t, kb = _t(), _kb()
    return [((h, cung), f"{_slug_hoa(h)}-cung-{t._slug(cung)}")
            for h in _HOA for cung in kb["cung"] if cung in kb["tu_hoa_cung"].get(h, {})]


def trang_hoa_cung(k: tuple[str, str], slug: str) -> dict:
    t, kb = _t(), _kb()
    h, cung = k
    th, c = kb["tu_hoa"][h], kb["cung"][cung]
    nd = kb["tu_hoa_cung"][h][cung]
    doi, th1, th2 = _cung_lien(cung)
    i_h = _HOA.index(h)
    theo_can = [(can, ds[i_h]) for can, ds in TU_HOA.items()]          # mỗi thiên can đúng một sao mang hoá này
    tra_loi = (f"Hoá {h} ở cung {cung}: {t._cau(nd)} {t._cau(th['y_nghia'])} "
               f"Hoá {h} đi theo một sao cụ thể, do thiên can năm sinh quyết định — xem bảng bên dưới.")
    muc = [
        {"tieu_de": f"Hoá {h} là gì", "doan": f"{th['y_nghia']} Lưu ý: {th['luu_y']}"},
        {"tieu_de": f"Cung {cung} nói về điều gì", "doan": f"{c['y_nghia']} {t._cau(_hoa_dau(c['xem_duoc']))}"},
        {"tieu_de": f"Năm sinh nào có Hoá {h}",
         "doan": (f"Tứ hoá theo thiên can năm sinh: mỗi can có đúng một sao hoá {h}. Hoá {h} chỉ rơi vào cung {cung} khi "
                  f"sao đó nằm ở cung {cung} trên lá số của bạn (bảng tứ hoá dùng trên lá số Hiểu Bản Thân)."),
         "danh_sach": [f"Năm {can}: {sao} hoá {h}." for can, sao in theo_can]},
        {"tieu_de": f"Tam phương tứ chính của cung {cung}",
         "doan": f"Hoá {h} ở cung {cung} cần đọc cùng cung xung chiếu và hai cung tam hợp.",
         "danh_sach": [f"Xung chiếu — cung {doi}: {kb['cung'][doi]['y_nghia']}",
                       f"Tam hợp — cung {th1}: {kb['cung'][th1]['y_nghia']}",
                       f"Tam hợp — cung {th2}: {kb['cung'][th2]['y_nghia']}"]},
        {"tieu_de": "Câu hỏi tự soi", "doan": c["cau_tu_soi"]},
    ]
    hoi_dap = [
        {"hoi": f"Hoá {h} ở cung {cung} nghĩa là gì?", "dap": t._cau(nd)},
        {"hoi": f"Năm sinh nào có Hoá {h}?",
         "dap": _hoa_dau("; ".join(f"năm {can}: {sao}" for can, sao in theo_can)) + "."},
        {"hoi": f"Hoá {h} ở cung {cung} tốt hay xấu?",
         "dap": f"{th['y_nghia']} {t._cau(th['luu_y'])} Đọc kèm sao mang hoá và độ sáng của sao đó."},
    ]
    chinh = list(kb["chinh_tinh"])
    sao_con = list(dict.fromkeys(sao for _, sao in theo_can if sao in chinh))
    v = _vong()
    return {
        "loai": "hoa_cung", "slug": slug,
        "tieu_de": f"Hoá {h} ở cung {cung}: ý nghĩa, năm sinh nào có",
        "mo_ta": t._cat(f"Hoá {h} ở cung {cung} trong Tử vi: {nd} Năm sinh nào có Hoá {h}, sao nào mang, tam phương tứ chính."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": list(kb["source"].values()) + ["Bảng tứ hoá theo thiên can: theo iztro (giữ cho Canh/Nhâm, quyết định 2026-10-02)."],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "cung", "slug": f"cung-{t._slug(cung)}"},
                      {"loai": "hoa_cung", "slug": f"{_slug_hoa(h)}-cung-{t._slug(doi)}"},
                      *({"loai": "hoa_cung", "slug": f"{_slug_hoa(x)}-cung-{t._slug(cung)}"} for x in _HOA if x != h)],
        "trang_con": {"tieu_de": f"Sao mang Hoá {h} ở cung {cung}",
                      "ds": [{"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(cung)}"} for sao in sao_con]},
        "minh_hoa": {"kieu": "hoa_cung", "hoa": h, "chi_so": v.index(cung), "vong": v},
    }


TRANG = {"sao_cung": (ds_sao_cung, trang_sao_cung), "hoa_cung": (ds_hoa_cung, trang_hoa_cung)}
TEN_NGAN = {"sao_cung": lambda k: f"{k[0]} ở cung {k[1]}", "hoa_cung": lambda k: f"Hoá {k[0]} ở cung {k[1]}"}
