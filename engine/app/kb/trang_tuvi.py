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

from app import ngon_ngu

import re

from app.calc import tuvi_do_sang_vn as ds_vn
from app.calc import tuvi_vi_tri as vt
from app.calc.tuvi_luu_nguyet import TU_HOA
from app.kb import nap
from app.kb import ten as _tn
from app.kb.loi import L
from app.kb.loi import danh_sach as _ds_en

_HOA = ("Lộc", "Quyền", "Khoa", "Kỵ")
_SANG = ("Miếu", "Vượng", "Đắc")


def _t():                       # tránh vòng import: trang.py nạp module này ở cuối
    from app.kb import trang
    return trang


def _kb() -> dict:
    return _t()._doc("tuvi_kb.json")


def _hoa_dau(s: str) -> str:
    return s[:1].upper() + s[1:]


# ---- EN-ALL GĐ 4: tên hiển thị theo ngôn ngữ (bản Việt trả nguyên chữ — đầu ra bản Việt không đổi một byte) ----------
def ts(sao: str) -> str:
    """Tên sao hiển thị ("Tử Vi" / "Zi Wei"); "Hoá Lộc" (KB đôi khi coi hoá như một sao) → "Hua Lu"."""
    if not ngon_ngu.la_viet() and sao.startswith("Hoá ") and sao[4:] in _HOA:
        return th(sao[4:])
    return _tn.ten("sao", sao)


def tc(cung: str) -> str:
    """Tên cung hiển thị ("Mệnh" / "Life Palace")."""
    return _tn.ten("cung", cung)


tc_ngan = tc


def th(h: str) -> str:
    """Tên hoá hiển thị: bản Việt "Lộc" (khuôn câu Việt tự viết "Hoá {h}"), bản Anh "Hua Lu"."""
    if ngon_ngu.la_viet():
        return h
    return "Hua " + _tn.ten("hoa", h).split(" (")[0].strip()


def can_hien(can: str) -> str:
    return _tn.ten("can", can)


def chi_hien(chi: str) -> str:
    return _tn.ten("chi", chi)


def sang_hien(ds: str) -> str:
    """Độ sáng hiển thị ("Miếu" / "Temple") — bản Anh bỏ phần chú giải trong ngoặc để câu gọn."""
    if ngon_ngu.la_viet():
        return ds
    return _tn.ten("do_sang", ds).split(" (")[0].strip()


_HANH_CHUAN = {"Thuỷ": "Thủy", "Hoả": "Hỏa"}


def hanh(x: str) -> str:
    """Hành của sao ("Thuỷ/Mộc") — bản Anh "Water / Wood"."""
    if ngon_ngu.la_viet():
        return x
    return " / ".join(_tn.ten("hanh", _HANH_CHUAN.get(p.strip(), p.strip())) for p in x.split("/"))


_NHOM_SAO = {"Tử Phủ Vũ Tướng": "tpvt", "Cơ Nguyệt Đồng Lương": "cndl", "Cự Nhật": "cn", "Sát Phá Tham": "spt"}


def nhom_sao(n: str) -> str:
    return L(f"trang_tv.nhom.{_NHOM_SAO[n]}", n) if n in _NHOM_SAO else n


def vong_hien() -> list[str]:
    return [tc(c) for c in _vong()]


def nguon_kb(kb: dict) -> list[str]:
    return list(kb["source"].values())


def _ds_ten_chu(ds: list[str]) -> str:
    """Nối danh sách tên ĐÃ ở dạng hiển thị: bản Việt "A, B và C", bản Anh "A, B and C"."""
    if ngon_ngu.la_viet():
        return ", ".join(ds[:-1]) + " và " + ds[-1] if len(ds) > 1 else (ds[0] if ds else "")
    return _ds_en(ds)


def _chi_ds(ds: list[str]) -> str:
    return ", ".join(chi_hien(c) for c in ds)


def _bo_nhan(s: str) -> str:
    """KB viết "Sáng: …" / "Hãm: …" / "Kém sáng: …" — trang đã có nhãn riêng, bỏ để khỏi lặp."""
    return re.sub(r"^(Sáng|Hãm|Kém sáng)\s*:\s*", "", s.strip())


def _ds_ten(ds: list[str]) -> str:
    """Danh sách TÊN SAO (mã Việt) → chữ hiển thị nối "và" / "and"."""
    return _ds_ten_chu([ts(x) for x in ds])


@ngon_ngu.theo_viet
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


def _nhom_dong_cung(sao: str) -> str:
    """Gom các chi theo bộ sao đồng cung: "đứng một mình ở Tý, Ngọ; cùng Tử Vi ở Tỵ, Hợi; …"."""
    nhom: dict[tuple[str, ...], list[str]] = {}
    for chi, o in vt.bo_cuc_theo_sao(sao).items():
        nhom.setdefault(tuple(o["dong_cung"]), []).append(chi)
    phan = [L("trang_tv.dc.o", "{ai} ở {chi}",
              ai=L("trang_tv.dc.cung", "cùng {ds}", ds=_ds_ten(list(k))) if k else L("trang_tv.dc.mot_minh", "đứng một mình"),
              chi=_chi_ds(v)) for k, v in nhom.items()]
    return "; ".join(phan)


def _sang_ham(sao: str) -> tuple[list[str], list[str]]:
    bang = ds_vn.BANG.get(sao, {})
    return ([c for c in vt.CHI if bang.get(c) in _SANG], [c for c in vt.CHI if bang.get(c) == "Hãm"])


def _hoa_cua_sao(sao: str) -> list[tuple[str, str]]:
    return [(can, _HOA[i]) for can, ds in TU_HOA.items() for i, s in enumerate(ds) if s == sao]


def _ds_doi_song() -> dict:
    return _t()._doc("tuvi_doi_song_kb.json")


def theo_chi_sao(sao: str) -> list[str]:
    """12 vị trí của một chính tinh theo chi (độ sáng Nam phái + sao đồng cung + cung đối diện) — dùng ở trang sao."""
    ra = []
    for chi, o in vt.bo_cuc_theo_sao(sao).items():
        ds = ds_vn.do_sang(sao, chi)
        dong = (L("trang_tv.chi.dong_cung", "đồng cung {ds}", ds=_ds_ten(o["dong_cung"])) if o["dong_cung"]
                else L("trang_tv.chi.mot_minh", "đứng một mình (không chính tinh khác)"))
        xung = (L("trang_tv.chi.xung_co", "cung đối diện (ở {chi}) có {ds}", chi=chi_hien(o["xung_chieu_chi"]),
                  ds=_ds_ten(o["xung_chieu"])) if o["xung_chieu"]
                else L("trang_tv.chi.xung_vcd", "cung đối diện (ở {chi}) vô chính diệu", chi=chi_hien(o["xung_chieu_chi"])))
        sang = L("trang_tv.chi.sang", " ({ds})", ds=sang_hien(ds)) if ds else ""
        ra.append(L("trang_tv.chi.dong", "{chi}{sang}: {dong}; {xung}.", chi=chi_hien(chi), sang=sang, dong=dong, xung=xung))
    return ra


def _loi_doi_song(sao: str, cung: str, tt: str) -> list[str]:
    """SEO-K: lời đời thường riêng của ô sao × cung (KB tuvi_doi_song_kb.json, cùng nguồn với Luận giải đời sống)."""
    o = _ds_doi_song()["sao_linh_vuc"].get(sao, {}).get(cung, {}).get(tt)
    if not o:
        return []
    return [L("trang_tv.ds.manh", "Điểm mạnh: {x}", x=o["manh"]), L("trang_tv.ds.de_vap", "Dễ vấp: {x}", x=o["de_vap"]),
            L("trang_tv.ds.goi_y", "Gợi ý: {x}", x=o["loi_khuyen"])]


_KHONG_THAY_BAC_SI = "Đây là thói quen nên để ý theo quan niệm Tử vi, không phải chẩn đoán và không thay lời bác sĩ."


def _khong_thay_bac_si() -> str:
    return L("trang_tv.khong_thay_bac_si", _KHONG_THAY_BAC_SI)


# ---- TV-YBS đợt 3: ý Tử vi bổ sung (KB tuvi_y_bo_sung.json) trên trang kiến thức -----------------------------
# Bộ lọc TĨNH (chỉ sao, cung, hoá, độ sáng, chi ghi trong điều kiện) — trang kiến thức không có lá số để xét lá thật.
# Nơi đặt một ý (một nơi cho mỗi cặp, tránh lặp chữ giữa các họ trang):
#   chính tinh + cung cụ thể + sao toạ ở cung đó → "sao ở cung" · chính tinh không gắn cung → trang sao
#   hoá + cung cụ thể (không có chính tinh, hoá toạ) → "Hoá ở cung" · còn lại có cung cụ thể → trang cung.
# Bỏ qua: ý cần hai lá số, ý theo nhóm chính tinh, ý mà điều kiện thật chỉ nằm trong ghi chú (chưa cơ học hoá) hoặc
# cần so sánh / điều kiện ở cung khác, ý trải > 4 cung. Lời trang = `loi_doi_thuong` + `viec_nen_lam`, đầu dòng là
# điều kiện viết bằng lời (dựng từ `dieu_kien`). Không nêu tên người / khoá học (BM-1).
_TOI_DA_Y = 3
_BO_QUA_DK = ("hai_nguoi", "nhom", "nhom_ca_hai", "so_sanh", "can_them")
_CO_CAU_TRUC = ("sao", "sao_mot_trong", "sao_cap_mot_trong", "hoa", "hoa_tat_ca", "hoa_tren_sao",
                "hoa_tren_sao_mot_trong", "do_sang", "chi", "khong_chinh_tinh", "khong_co_cat_tinh", "gap", "hoac")
_LOP = {"dai_han": "mười năm (đại hạn)", "luu_nien": "năm (lưu niên)", "tieu_han": "tiểu hạn"}
_TUOI = {"dai_han_dau": "ở giai đoạn mười năm đầu đời",
         "dai_han_dau_hoac_hai": "ở một trong hai giai đoạn mười năm đầu đời"}
_GAP = {"sat_tinh": "gặp sát tinh", "cat_tinh": "gặp cát tinh", "nhieu_sat_hoac_ky": "gặp nhiều sát tinh hoặc Hoá Kỵ"}
_NGUON_Y = "Một trường phái Tử vi tam hợp hiện đại — ý luận đoán, ban biên tập rút ý và viết lại."
_SUC_KHOE = re.compile(r"sức khoẻ|sức khỏe|đôi mắt|\bkhám\b|cơ thể", re.I)


def _l(x) -> list:
    return [] if x is None else [x] if isinstance(x, str) else list(x)


def _ybs() -> list[dict]:
    from app.kb import tuvi_y_bo_sung as ybs
    return ybs.tat_ca()


def _sao_trong_dk(dk: dict) -> list[str]:
    ra = _l(dk.get("sao")) + _l(dk.get("sao_mot_trong")) + [s for c in dk.get("sao_cap_mot_trong") or [] for s in c]
    return list(dict.fromkeys(ra + _l(dk.get("hoa_tren_sao")) + _l(dk.get("hoa_tren_sao_mot_trong"))))


def _noi_mot(m: dict) -> list[tuple[str, object]]:
    """MỘT trang cho mỗi ý: ý khớp nhiều trang cùng họ (vd "Mệnh hoặc Quan Lộc", cặp sao) chỉ đặt ở trang đầu tiên
    (cung / sao KB ghi trước) — chữ lặp ở nhiều trang cùng họ làm giảm phần riêng (SEO-K/M)."""
    return _noi_tat_ca(m)[:1]


def _noi_tat_ca(m: dict) -> list[tuple[str, object]]:
    dk = m["dieu_kien"]
    if any(k in dk for k in _BO_QUA_DK):
        return []
    cung = [c for c in _l(dk.get("cung")) if c != "bat_ky"]
    if isinstance(dk.get("cung_than"), str):
        cung.append(dk["cung_than"])
    if "ghi_chu" in dk and not any(k in dk for k in _CO_CAU_TRUC):
        return []                                  # điều kiện thật chỉ nằm trong ghi chú
    if len(cung) > 4:
        return []
    chinh = [s for s in _sao_trong_dk(dk) if s in _kb()["chinh_tinh"]]
    toa = "toa" in _l(dk.get("vi_tri") or "toa")
    hoa = _l(dk.get("hoa")) + _l(dk.get("hoa_tat_ca"))
    if chinh and cung and toa:
        return [("sao_cung", (s, c)) for s in chinh for c in cung if c in _kb()["sao_cung"].get(s, {})]
    if chinh and not cung:
        return [("sao", s) for s in chinh]
    if cung and toa and hoa and not chinh and dk.get("vi_tri_hoa", "toa") == "toa":
        return [("hoa_cung", (h, c)) for h in hoa for c in cung if c in _kb()["tu_hoa_cung"].get(h, {})]
    return [("cung", c) for c in cung if c in _kb()["cung"]]


def noi_y_bo_sung() -> dict[str, list[tuple[str, object]]]:
    """Mã ý → các trang (loại, khoá) đặt ý đó. Ý không trang nào → không có mặt."""
    return {m["id"]: n for m in _ybs() if (n := _noi_mot(m))}


@nap.nho
def y_cho_trang(loai: str, k) -> list[dict]:
    """Ý bổ sung của một trang (≤ 3 ý mỗi nhóm hiển thị, theo thứ tự KB). Nhớ theo (loại, khoá): mục lục KB gọi cho ~670 trang,
    mỗi lần duyệt 171 ý × mọi trang (`_noi_mot`) — lần gọi thứ hai của `trang.danh_sach()` từng mất 0,3–0,5 s (CI đỏ 2026-11-09)."""
    ra = {"hop": [], "goc_nhin_khac": []}
    for m in _ybs():
        if (loai, k) in _noi_mot(m) and len(ra[m["hien_thi"]]) < _TOI_DA_Y:
            ra[m["hien_thi"]].append(m)
    return ra["hop"] + ra["goc_nhin_khac"]


def _hoac(ds: list[str]) -> str:
    return ", ".join(ds[:-1]) + " hoặc " + ds[-1] if len(ds) > 1 else (ds[0] if ds else "")


def _khi(dk: dict) -> str:
    """Điều kiện tĩnh viết bằng lời theo ngôn ngữ lượt gọi (bản Việt: `_khi_vi`, không đổi; bản Anh: `_khi_en`)."""
    return _khi_vi(dk) if ngon_ngu.la_viet() else "With " + _khi_en(dk)


def _khi_vi(dk: dict) -> str:
    """Điều kiện tĩnh viết bằng lời: chủ thể (sao / hoá / cung) + nơi chốn, rồi các điều kiện phụ cách nhau dấu phẩy —
    vd "Khi Liêm Trinh và Thất Sát đồng cung, đều sáng (Miếu, Vượng, Đắc)", "Khi Tham Lang ở cung Mệnh, cung ở Tý hoặc Hợi",
    "Khi mười năm (đại hạn) đi qua cung có Thất Sát"."""
    sao, mot, cap = _l(dk.get("sao")), _l(dk.get("sao_mot_trong")), dk.get("sao_cap_mot_trong") or []
    hoa, tren = _l(dk.get("hoa")), _l(dk.get("hoa_tren_sao")) + _l(dk.get("hoa_tren_sao_mot_trong"))
    vt = _l(dk.get("vi_tri") or "toa")
    cung = [c for c in _l(dk.get("cung")) if c != "bat_ky"]
    ds = dk.get("do_sang")
    sang = ("" if ds is None else "sáng hoặc hãm" if isinstance(ds, list)
            else ("đều " if len(sao) > 1 else "") + ("sáng (Miếu, Vượng, Đắc)" if ds == "sang" else "hãm"))
    chu: list[str] = []                                  # chủ thể
    if cap:
        chu.append("cặp " + " hoặc ".join(" – ".join(c) for c in cap))
    if sao:
        # "sao" = các sao cùng có mặt, mặc định cùng cung; có ghi chú (vd nhật nguyệt phản bối) thì không khẳng định đồng cung
        dong = len(sao) > 1 and "ghi_chu" not in dk
        chu.append(_ds_ten(sao) + (" đồng cung" if dong and vt == ["toa"] else
                                   " cùng cung hoặc ở tam phương của nhau" if dong and not cung and "tam_phuong" in vt
                                   else ""))
        if sang:
            chu[-1] += ("," if chu[-1].endswith("đồng cung") else "") + " " + sang
    if mot:
        chu.append(("gặp " if chu else "có ") + _hoac(mot) + (f" {sang}" if sang and not sao and not tren else ""))
    if tren and hoa:
        chu.append(_hoac(tren) + (f" {sang}" if sang and not sao else "") + f" hoá {hoa[0]}")
    elif (hoa or dk.get("hoa_tat_ca")) and dk.get("vi_tri_hoa") != "xung_chieu":
        chu.append(("gặp " if chu else "có ") + " và ".join(f"Hoá {h}" for h in hoa or _l(dk.get("hoa_tat_ca"))))
    noi = ""
    if cung:
        ten = _hoac(cung)
        if "giap" in vt:
            noi = f"kẹp hai bên cung {ten}"
        elif "toa" not in vt and "tam_phuong" in vt:
            noi = f"ở tam phương của cung {ten}"
        else:
            them = [c for x, c in (("tam_phuong", "tam phương"), ("xung_chieu", "cung đối diện")) if x in vt]
            noi = f"ở cung {ten}" + (f" (hoặc {' và '.join(them)} của cung đó)" if them else "")
    elif dk.get("chi"):
        noi = f"ở {_hoac(_l(dk['chi']))}"
    if dk.get("cung_than") is True:
        noi = (noi + " " if noi else "") + "ở cung an Thân"
    la_cung = not chu                                    # không có sao / hoá → cung là chủ thể
    if la_cung:
        chu, noi = [f"cung Thân nằm ở {dk['cung_than']}" if isinstance(dk.get("cung_than"), str)
                    else f"cung {_hoac(cung)}"], ""
    phu: list[str] = []                                  # điều kiện phụ
    xung = dk.get("vi_tri_hoa") == "xung_chieu"
    if xung:
        phu.append("gặp Hoá " + _hoac(hoa) + " chiếu từ cung đối diện")
    if dk.get("chi") and cung:
        phu.append(f"cung ở {_hoac(_l(dk['chi']))}")
    if dk.get("khong_chinh_tinh"):
        phu.append("cung không có chính tinh")
    if dk.get("gap") in _GAP:
        phu.append(_GAP[dk["gap"]])
    vang = [s for s in _l(dk.get("khong_co")) if "_" not in s]
    if vang:
        phu.append(f"không có {', '.join(vang)} đi cùng")
    if dk.get("khong_co_hoa"):
        phu.append("không có " + ", ".join(f"Hoá {h}" for h in _l(dk["khong_co_hoa"])))
    if dk.get("khong_co_cat_tinh"):
        phu.append("không có cát tinh nào đi cùng")
    if dk.get("gioi_tinh") in ("nam", "nu"):
        gt = "ở lá số " + ("nữ" if dk["gioi_tinh"] == "nu" else "nam")
        noi, phu = (noi, phu + [gt]) if noi else (gt, phu)
    lop = " hoặc ".join(_LOP[x] for x in _l(dk.get("lop")) if x in _LOP)
    chinh = " ".join(x for x in (" ".join(chu), noi) if x)
    if lop and (la_cung or not noi):
        # "mười năm (đại hạn) đi qua cung Tật Ách" / "… đi qua cung có Thất Sát"
        cau = f"{lop} đi qua {chinh}" if la_cung else f"{lop} đi qua cung có {chinh.removeprefix('có ')}"
    else:
        cau = chinh
        if lop:
            phu.append(f"trong {lop} đi qua cung đó")
        if phu and ((la_cung and not lop) or xung or (not noi and phu[0].startswith("gặp "))):
            cau, phu = f"{cau} {phu[0]}", phu[1:]       # "cung Phu Thê gặp sát tinh", "Thất Sát gặp Hoá Kỵ chiếu…"
    if dk.get("tuoi") in _TUOI:
        phu.append(_TUOI[dk["tuoi"]])
    cau = ", ".join(x for x in (cau, *phu) if x)
    if isinstance(dk.get("hoac"), dict):
        cau += "; hoặc " + _khi_vi(dk["hoac"])[4:]
    return "Khi " + cau


# Bản Anh của `_khi_vi`: cùng cấu trúc quyết định (thứ tự vế, gộp vế phụ), chữ là cụm danh từ đứng sau "With …"
# ("With Lian Zhen and Qi Sha sharing one palace, both bright …"). Vế phụ mang cờ "bắt đầu bằng gặp" của bản Việt để
# quyết định gộp vế giống hệt bản Việt.
_LOP_EN = {"dai_han": "the 10-year period", "luu_nien": "the year (annual chart)", "tieu_han": "the minor yearly limit"}
_TUOI_EN = {"dai_han_dau": "in the first 10-year period of life",
            "dai_han_dau_hoac_hai": "in one of the first two 10-year periods of life"}
_GAP_EN = {"sat_tinh": "meeting malefic stars", "cat_tinh": "meeting auspicious stars",
           "nhieu_sat_hoac_ky": "meeting several malefic stars or Hua Ji"}


def _hoac_en(ds: list[str]) -> str:
    return ", ".join(ds[:-1]) + " or " + ds[-1] if len(ds) > 1 else (ds[0] if ds else "")


def _khi_en(dk: dict) -> str:
    sao, mot, cap = _l(dk.get("sao")), _l(dk.get("sao_mot_trong")), dk.get("sao_cap_mot_trong") or []
    hoa, tren = _l(dk.get("hoa")), _l(dk.get("hoa_tren_sao")) + _l(dk.get("hoa_tren_sao_mot_trong"))
    vt = _l(dk.get("vi_tri") or "toa")
    cung = [c for c in _l(dk.get("cung")) if c != "bat_ky"]
    ds = dk.get("do_sang")
    sang = ("" if ds is None else "bright or fallen" if isinstance(ds, list)
            else ("both " if len(sao) == 2 else "all " if len(sao) > 2 else "")
            + ("bright (Temple, Prosperous or Favourable)" if ds == "sang" else "fallen (dim)"))
    S = lambda x: [ts(y) for y in x]  # noqa: E731
    chu: list[str] = []
    dong_cung = False
    if cap:
        chu.append("the pair " + " or ".join(" – ".join(S(c)) for c in cap))
    if sao:
        dong = len(sao) > 1 and "ghi_chu" not in dk
        dong_cung = dong and vt == ["toa"]
        chu.append(_ds_en(S(sao)) + (" sharing one palace" if dong_cung else
                                     " in the same palace or in each other's trine" if dong and not cung and "tam_phuong" in vt
                                     else ""))
        if sang:
            chu[-1] += ("," if dong_cung else "") + " " + sang
    if mot:
        chu.append(("meeting " if chu else "") + _hoac_en(S(mot)) + (f" {sang}" if sang and not sao and not tren else ""))
    if tren and hoa:
        chu.append(_hoac_en(S(tren)) + (f" {sang}" if sang and not sao else "") + f" carrying {th(hoa[0])}")
    elif (hoa or dk.get("hoa_tat_ca")) and dk.get("vi_tri_hoa") != "xung_chieu":
        chu.append(("meeting " if chu else "") + " and ".join(th(h) for h in hoa or _l(dk.get("hoa_tat_ca"))))
    noi = ""
    if cung:
        ten = _hoac_en([tc(c) for c in cung])
        if "giap" in vt:
            noi = f"flanking the {ten}"
        elif "toa" not in vt and "tam_phuong" in vt:
            noi = f"in the trine of the {ten}"
        else:
            them = [c for x, c in (("tam_phuong", "trine"), ("xung_chieu", "opposite palace")) if x in vt]
            noi = f"in the {ten}" + (f" (or in its {' and '.join(them)})" if them else "")
    elif dk.get("chi"):
        noi = f"in the {_hoac_en([chi_hien(c) for c in _l(dk['chi'])])} branch"
    if dk.get("cung_than") is True:
        noi = (noi + " " if noi else "") + "in the Body Palace"
    la_cung = not chu
    if la_cung:
        chu, noi = [f"the Body Palace falling in the {tc(dk['cung_than'])}" if isinstance(dk.get("cung_than"), str)
                    else f"the {_hoac_en([tc(c) for c in cung])}"], ""
    phu: list[tuple[bool, str]] = []                      # (bản Việt bắt đầu bằng "gặp ", chữ)
    xung = dk.get("vi_tri_hoa") == "xung_chieu"
    if xung:
        phu.append((True, "meeting " + _hoac_en([th(h) for h in hoa]) + " shining in from the opposite palace"))
    if dk.get("chi") and cung:
        phu.append((False, f"the palace in the {_hoac_en([chi_hien(c) for c in _l(dk['chi'])])} branch"))
    if dk.get("khong_chinh_tinh"):
        phu.append((False, "the palace holding no main star"))
    if dk.get("gap") in _GAP_EN:
        phu.append((True, _GAP_EN[dk["gap"]]))
    vang = [s_ for s_ in _l(dk.get("khong_co")) if "_" not in s_]
    if vang:
        phu.append((False, f"without {', '.join(S(vang))} alongside"))
    if dk.get("khong_co_hoa"):
        phu.append((False, "without " + ", ".join(th(h) for h in _l(dk["khong_co_hoa"]))))
    if dk.get("khong_co_cat_tinh"):
        phu.append((False, "with no auspicious star alongside"))
    if dk.get("gioi_tinh") in ("nam", "nu"):
        gt = "in a " + ("woman's" if dk["gioi_tinh"] == "nu" else "man's") + " chart"
        noi, phu = (noi, phu + [(False, gt)]) if noi else (gt, phu)
    lop = " or ".join(_LOP_EN[x] for x in _l(dk.get("lop")) if x in _LOP_EN)
    chinh = " ".join(x for x in (" ".join(chu), noi) if x)
    if lop and (la_cung or not noi):
        cau = f"{lop} passing through {chinh}" if la_cung else f"{lop} passing through a palace with {chinh}"
    else:
        cau = chinh
        if lop:
            phu.append((False, f"while {lop} passes through that palace"))
        if phu and ((la_cung and not lop) or xung or (not noi and phu[0][0])):
            cau, phu = f"{cau} {phu[0][1]}", phu[1:]
    if dk.get("tuoi") in _TUOI_EN:
        phu.append((False, _TUOI_EN[dk["tuoi"]]))
    cau = ", ".join(x for x in (cau, *(t for _, t in phu)) if x)
    if isinstance(dk.get("hoac"), dict):
        cau += "; or with " + _khi_en(dk["hoac"])
    return cau


def muc_y_bo_sung(loai: str, k) -> list[dict]:
    """0–2 mục: "Thêm một cách đọc" (ý chung) và "Góc nhìn khác (tham khảo)" (ý riêng trường phái, web hiện gập)."""
    ds = y_cho_trang(loai, k)
    ra = []
    # Không thêm đoạn dẫn chung: câu lặp ở mọi trang làm giảm phần riêng; điều kiện đã ở đầu từng dòng, lời "chưa đối
    # chiếu rộng" của nhóm góc nhìn khác do web ghi ở dòng tóm tắt khung gập.
    vi = _ybs_vi()
    for hien, tieu_de in (("hop", "Thêm một cách đọc"), ("goc_nhin_khac", "Góc nhìn khác (tham khảo)")):
        y = [m for m in ds if m["hien_thi"] == hien]
        if not y:
            continue
        dong = [L("trang_tv.ybs.dong", "{khi}: {loi} Nên làm: {viec}", khi=_khi(m["dieu_kien"]),
                  loi=_cau(m["loi_doi_thuong"]), viec=_cau(m["viec_nen_lam"])) for m in y]
        # Quyết định thêm câu "không thay lời bác sĩ" đọc trên CHỮ VIỆT (bản Anh ra cùng số dòng — khung dữ kiện giống nhau).
        yv = [vi.get(m["id"], m) for m in y]
        if any(m["loai"] == "suc_khoe_phong_ngua" or _SUC_KHOE.search(m["loi_doi_thuong"]) for m in yv) \
                and not any(re.search(r"không thay lời bác sĩ", m["loi_doi_thuong"] + " " + m["viec_nen_lam"]) for m in yv):
            dong.append(_khong_thay_bac_si())
        ra.append({"ma": f"y_bo_sung_{hien}",
                   "tieu_de": L(f"trang_tv.ybs.{hien}", tieu_de), "danh_sach": dong, "bien_tap": True,
                   **({"gap": True} if hien == "goc_nhin_khac" else {})})
    return ra


@ngon_ngu.theo_viet
def _ybs_vi() -> dict[str, dict]:
    """Ý bổ sung bản Việt theo mã — để mọi quyết định cấu trúc dựa trên chữ đọc trên chữ Việt."""
    return {m["id"]: m for m in _ybs()}


def _cau(s: str) -> str:
    s = s.strip()
    return s if s.endswith((".", "!", "?", "…")) else s + "."


def them_y_bo_sung(t: dict, loai: str, k) -> dict:
    """Chèn mục ý bổ sung trước "Câu hỏi tự soi" (mục cuối) và ghi nguồn chung một lần."""
    moi = muc_y_bo_sung(loai, k)
    if moi:
        tu_soi = L("trang.tu_soi", "Câu hỏi tự soi")
        i = next((j for j, m in enumerate(t["muc"]) if m["tieu_de"] == tu_soi), len(t["muc"]))
        t["muc"][i:i] = moi
        ny = L("trang_tv.nguon_y", _NGUON_Y)
        if ny not in t["nguon"]:
            t["nguon"].append(ny)
    return t


def _muc_su_kien_menh(sao: str, cung: str) -> dict:
    """AUD-P0: dữ kiện TÍNH riêng của trang (CALC `tuvi_vi_tri`, xét đủ 12 vị trí Tử Vi) — cung Mệnh có sao gì khi sao ở
    cung này; sao toạ Mệnh thì ba cung tam phương. Câu khung ở KB `su_kien_kb.json`."""
    t = _t()
    kb = t._doc("su_kien_kb.json")
    k = _vong().index(cung)
    S, C = ts(sao), tc(cung)
    if k == 0:
        m = kb["sao_toa_menh"]
        dong = []
        for ten, lech in m["cung"]:
            tt = vt.tom_tat_cung_khac(sao, 0, lech)
            kn = [f"{' · '.join(ts(y) for y in x['sao'])} ({x['so_vi_tri']})" for x in tt["to_hop"]]
            if tt["vo_chinh_dieu"]:
                kn.append(L("trang_tv.sk.vcd", "vô chính diệu ({n})", n=tt["vo_chinh_dieu"]))
            dong.append([ten, " · ".join(ts(y) for y in tt["luon_co"]) or m["khong_co"], "; ".join(kn)])
        return {"ma": "su_kien_menh", "tieu_de": m["tieu_de"].format(sao=S), "doan": m["doan"].format(sao=S),
                "bang": {"cot": m["cot"], "dong": dong}}
    m = kb["sao_cung_menh"]
    tt = vt.tom_tat_cung_khac(sao, k, 0)
    luon = _ds_ten(tt["luon_co"]) if not ngon_ngu.la_viet() else " và ".join(tt["luon_co"])
    doan = (m["luon_co"].format(sao=S, cung=C, luon_co=luon) if tt["luon_co"]
            else m["khong_co"].format(sao=S, cung=C))
    if tt["vo_chinh_dieu"]:
        doan += " " + m["vo_chinh_dieu"].format(n=tt["vo_chinh_dieu"])
    # Mệnh cố định một sao → bảng phân bố giống hệt ở các trang cùng sao Mệnh (trùng lặp) → chỉ câu dữ kiện + link
    # sang trang sao đó ở Mệnh; Mệnh không cố định → bảng các khả năng (thông tin riêng của cặp sao × cung này).
    dong = [[" · ".join(ts(y) for y in x["sao"]), f"{x['so_vi_tri']}/12"] for x in tt["to_hop"]]
    if tt["vo_chinh_dieu"]:
        dong.append([m["dong_vcd"], f"{tt['vo_chinh_dieu']}/12"])
    return {"ma": "su_kien_menh", "tieu_de": m["tieu_de"].format(sao=S, cung=C), "doan": doan,
            **({} if tt["luon_co"] else {"bang": {"cot": m["cot"], "dong": dong}}),
            **({"xem_them": [{"loai": "sao_cung", "slug": f"{t._slug(x)}-cung-menh"} for x in tt["luon_co"]]} if tt["luon_co"] else {})}


def trang_sao_cung(k: tuple[str, str], slug: str) -> dict:
    t, kb = _t(), _kb()
    sao, cung = k
    s, c = kb["chinh_tinh"][sao], kb["cung"][cung]
    S, C = ts(sao), tc(cung)
    nd = kb["sao_cung"][sao][cung]
    doi, th1, th2 = _cung_lien(cung)
    sang, ham = _sang_ham(sao)
    dsg = _ds_doi_song()
    lv = dsg["linh_vuc"].get(cung, {})
    loi_sang, loi_ham = _loi_doi_song(sao, cung, "sang"), _loi_doi_song(sao, cung, "ham")
    manh_sang = (dsg["sao_linh_vuc"].get(sao, {}).get(cung, {}).get("sang") or {}).get("manh", "")
    tra_loi = L("trang_tv.sc.tra_loi",
                "Trong Tử vi, {sao} ở cung {cung}: {nd} {manh} "
                "Nghĩa đậm hay nhạt tuỳ {sao} sáng hay hãm ở chi cung {cung} rơi vào, và sao nào đi cùng.",
                sao=S, cung=C, nd=t._cau(nd), manh=manh_sang).replace("  ", " ")
    cs = _chi_ds(sang) or L("trang_tv.sc.khong_chi", "không chi nào")
    ch = _chi_ds(ham) if ham else ""
    mo_ta_lv = (L("trang_tv.sc.lv_mo_ta", ": {x}", x=t._cau(lv["mo_ta"][:1].lower() + lv["mo_ta"][1:])) if lv.get("mo_ta")
                else ".")
    muc = [
        {"tieu_de": L("trang_tv.sc.nhac", "Cung {cung} và sao {sao} — nhắc nhanh", cung=C, sao=S),
         "doan": L("trang_tv.sc.nhac_doan", "Cung {cung} nói về {ve}{mo_ta} {sao} là chính tinh hành {hanh}: {tc}",
                   cung=C, ve=lv.get("ten_doi_thuong") or c["xem_duoc"], mo_ta=mo_ta_lv, sao=S, hanh=hanh(s["ngu_hanh"]),
                   tc=t._cau(s["tinh_chat"][:1].lower() + s["tinh_chat"][1:])),
         "xem_them": [{"loai": "cung", "slug": f"cung-{t._slug(cung)}"}, {"loai": "sao", "slug": f"sao-{t._slug(sao)}"}]},
    ]
    if loi_sang:
        muc.append({"tieu_de": L("trang_tv.sc.khi_sang", "Khi {sao} sáng ở cung {cung}", sao=S, cung=C),
                    "doan": L("trang_tv.sc.khi_sang_doan", "{sao} sáng (Miếu/Vượng/Đắc) khi cung {cung} rơi vào {chi}.",
                              sao=S, cung=C, chi=cs),
                    "danh_sach": loi_sang})
    if loi_ham:
        muc.append({"tieu_de": (L("trang_tv.sc.khi_ham", "Khi {sao} hãm ở cung {cung}", sao=S, cung=C) if ham
                                else L("trang_tv.sc.khi_kem", "Khi {sao} kém sáng ở cung {cung}", sao=S, cung=C)),
                    "doan": (L("trang_tv.sc.khi_ham_doan", "{sao} hãm khi cung {cung} rơi vào {chi}.", sao=S, cung=C, chi=ch)
                             if ham else
                             L("trang_tv.sc.khi_kem_doan",
                               "{sao} không có vị trí hãm theo bảng Nam phái; ý dưới đây dùng khi sao đứng chỗ kém sáng.",
                               sao=S)),
                    "danh_sach": loi_ham})
    if cung == "Tật Ách" and (sk := dsg["suc_khoe"].get(sao)):
        muc.append({"tieu_de": L("trang_tv.sc.tat_ach", "{sao} ở cung Tật Ách: nhịp sinh hoạt nên để ý", sao=S, cung=C),
                    "danh_sach": [L("trang_tv.sc.tat_ach_thoi_quen", "Thói quen dễ hao sức: {x}", x=sk["thoi_quen"]),
                                  L("trang_tv.sc.tat_ach_bo_phan",
                                    "Phần cơ thể sách xưa gắn với sao: {x} — nên chăm sóc phòng ngừa.", x=sk["bo_phan"]),
                                  L("trang_tv.ds.goi_y", "Gợi ý: {x}", x=sk["loi_khuyen"]), _khong_thay_bac_si()]})
    muc.append({"tieu_de": L("trang_tv.sc.di_cung", "{sao} đi cùng sao nào", sao=S),
                "doan": L("trang_tv.sc.di_cung_doan",
                          "Tuỳ chi cung {cung} rơi vào, {sao} {nhom}. Độ sáng và sao đối diện ở cả 12 "
                          "vị trí có ở trang sao {sao}.", cung=C, sao=S, nhom=_nhom_dong_cung(sao)),
                "xem_them": [{"loai": "sao", "slug": f"sao-{t._slug(sao)}"}]})
    muc.append({"tieu_de": L("trang_tv.sc.tam_phuong", "Tam phương tứ chính của cung {cung}", cung=C),
                "doan": L("trang_tv.sc.tam_phuong_doan",
                          "Không đọc {sao} một mình: cung {cung} luôn xét cùng cung xung chiếu {doi} và hai cung "
                          "tam hợp {th1}, {th2}. {sao} đứng ở chính các cung đó thì nghĩa như sau:",
                          sao=S, cung=C, doi=tc(doi), th1=tc(th1), th2=tc(th2)),
                "xem_them": [{"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(x)}"} for x in (doi, th1, th2)]})
    hoa = _hoa_cua_sao(sao)
    if hoa:
        hlv = dsg["hoa_linh_vuc"]
        muc.append({"tieu_de": L("trang_tv.sc.hoa", "Khi {sao} hoá Lộc, Quyền, Khoa, Kỵ ở cung {cung}", sao=S, cung=C),
                    "doan": L("trang_tv.sc.hoa_doan",
                              "Sinh năm có thiên can dưới đây thì sao được hoá (bảng tứ hoá dùng trên lá số Hiểu Bản Thân)."),
                    "danh_sach": [L("trang_tv.sc.hoa_dong", "Năm {can}: {sao} hoá {h} — {y}", can=can_hien(can), sao=S, h=th(h),
                                    y=(hlv.get(h, {}).get(cung) or {}).get("y") or kb["tu_hoa_cung"][h][cung])
                                  for can, h in hoa if cung in kb["tu_hoa_cung"].get(h, {})],
                    "xem_them": [{"loai": "hoa_cung", "slug": f"{_slug_hoa(h)}-cung-{t._slug(cung)}"}
                                 for h in dict.fromkeys(h for _, h in hoa)]})
    muc.append(_muc_su_kien_menh(sao, cung))
    from app.kb import trang_co_thu as tct      # TV-CTP: câu Cốt Tuỷ Phú nhắc đúng sao ở cung này
    if (ct := tct.muc_trich(sao=sao, cung=cung)):
        muc.append(ct)
    muc.append({"tieu_de": L("trang.tu_soi", "Câu hỏi tự soi"), "doan": s["cau_tu_soi"]})

    tot_xau = L("trang_tv.sc.khi_sang_ngan", "Khi sáng: {x}", x=manh_sang) if manh_sang else ""
    o_ham = (dsg["sao_linh_vuc"].get(sao, {}).get(cung, {}).get("ham") or {})
    hoi_dap = [
        {"hoi": L("trang_tv.sc.hoi_y_nghia", "{sao} ở cung {cung} có ý nghĩa gì?", sao=S, cung=C), "dap": t._cau(nd)},
        {"hoi": L("trang_tv.sc.hoi_tot_xau", "{sao} ở cung {cung} tốt hay xấu?", sao=S, cung=C),
         "dap": (L("trang_tv.sc.dap_tot_xau", "Tử vi không chia sao tốt hay xấu tuyệt đối. {sao} sáng ở {sang}", sao=S, sang=cs)
                 + (L("trang_tv.sc.dap_ham_o", ", hãm ở {ham}", ham=ch) if ham else "")
                 + f". {tot_xau}"
                 + (L("trang_tv.sc.dap_khi_ham", " Khi {kieu}: {x}",
                      kieu=L("trang_tv.sc.ham", "hãm") if ham else L("trang_tv.sc.kem_sang", "kém sáng"), x=o_ham["de_vap"])
                    if o_ham.get("de_vap") else "")).strip()},
        {"hoi": L("trang_tv.sc.hoi_di_cung", "{sao} ở cung {cung} đi cùng sao nào?", sao=S, cung=C),
         "dap": L("trang_tv.sc.dap_di_cung",
                  "Tuỳ chi: {sao} {nhom}. Ngoài ra luôn xem cung {doi} xung chiếu và hai cung tam hợp {th1}, {th2}.",
                  sao=S, nhom=_nhom_dong_cung(sao), doi=tc(doi), th1=tc(th1), th2=tc(th2))},
    ]
    if loi_sang:
        hoi_dap.append({"hoi": L("trang_tv.sc.hoi_nen_lam", "Người có {sao} ở cung {cung} nên làm gì?", sao=S, cung=C),
                        "dap": (dsg["sao_linh_vuc"][sao][cung]["sang"]["loi_khuyen"])})
    if hoa:
        hoi_dap.append({"hoi": L("trang_tv.sc.hoi_nam_hoa", "Năm nào {sao} hoá Lộc, Quyền, Khoa, Kỵ?", sao=S),
                        "dap": _hoa_dau("; ".join(L("trang_tv.sc.nam_hoa", "năm {can}: hoá {h}", can=can_hien(can), h=th(h))
                                                  for can, h in hoa)) + "."})
    v = _vong()
    i = v.index(cung)
    return them_y_bo_sung({
        "loai": "sao_cung", "slug": slug,
        "tieu_de": L("trang_tv.sc.tieu_de", "{sao} ở cung {cung}: ý nghĩa, sáng hãm, sao đi cùng", sao=S, cung=C),
        "mo_ta": t._cat(L("trang_tv.sc.mo_ta",
                          "{sao} ở cung {cung} trong Tử vi: {nd} Khi sáng, khi hãm, sao đồng cung, tam phương, tứ hoá.",
                          sao=S, cung=C, nd=nd)),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": nguon_kb(kb) + [
            L("trang_tv.sc.nguon", "Vị trí chính tinh và độ sáng: tính theo khẩu quyết an sao, đối chiếu lasotuvi (MIT) 60 lá số mẫu.")],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "sao", "slug": f"sao-{t._slug(sao)}"}, {"loai": "cung", "slug": f"cung-{t._slug(cung)}"},
                      {"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(v[(i + 1) % 12])}"},
                      {"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(v[(i - 1) % 12])}"}],
        # `ten` / `vong` là chữ hiển thị (bản Anh tiếng Anh); `ngu_hanh` là mã (web tô màu theo hành).
        "minh_hoa": {"kieu": "sao_cung", "ten": S, "ten_han": s["ten_han"], "ngu_hanh": s["ngu_hanh"],
                     "chi_so": i, "vong": vong_hien()},
    }, "sao_cung", k)


# ---- SEO-I: 48 trang "Hoá X ở cung Y" -----------------------------------------------------------------------
def _slug_hoa(h: str) -> str:
    return f"hoa-{_t()._slug(h)}"


@ngon_ngu.theo_viet
def ds_hoa_cung() -> list[tuple[tuple[str, str], str]]:
    t, kb = _t(), _kb()
    return [((h, cung), f"{_slug_hoa(h)}-cung-{t._slug(cung)}")
            for h in _HOA for cung in kb["cung"] if cung in kb["tu_hoa_cung"].get(h, {})]


def trang_hoa_cung(k: tuple[str, str], slug: str) -> dict:
    t, kb = _t(), _kb()
    h, cung = k
    H, C = th(h), tc(cung)
    th_, c = kb["tu_hoa"][h], kb["cung"][cung]
    nd = kb["tu_hoa_cung"][h][cung]
    doi, th1, th2 = _cung_lien(cung)
    i_h = _HOA.index(h)
    theo_can = [(can, ds[i_h]) for can, ds in TU_HOA.items()]          # mỗi thiên can đúng một sao mang hoá này
    o = _ds_doi_song()["hoa_linh_vuc"].get(h, {}).get(cung) or {}
    lv = _ds_doi_song()["linh_vuc"].get(cung, {})
    tra_loi = L("trang_tv.hc.tra_loi",
                "Hoá {h} ở cung {cung}: {nd} {y} "
                "Hoá {h} đi theo một sao cụ thể, do thiên can năm sinh quyết định — xem bảng bên dưới.",
                h=H, cung=C, nd=t._cau(nd), y=o.get("y", "")).replace("  ", " ")
    mo_ta_lv = (L("trang_tv.sc.lv_mo_ta", ": {x}", x=t._cau(lv["mo_ta"][:1].lower() + lv["mo_ta"][1:])) if lv.get("mo_ta")
                else ".")
    muc = [
        {"tieu_de": L("trang_tv.hc.nhac", "Hoá {h} và cung {cung} — nhắc nhanh", h=H, cung=C),
         "doan": L("trang_tv.hc.nhac_doan", "{y} Cung {cung} nói về {ve}{mo_ta}",
                   y=t._cau(th_["y_nghia"]), cung=C, ve=lv.get("ten_doi_thuong") or c["xem_duoc"], mo_ta=mo_ta_lv),
         "xem_them": [{"loai": "cung", "slug": f"cung-{t._slug(cung)}"}]},
    ]
    if o:
        muc.append({"tieu_de": L("trang_tv.hc.doi_thuong", "Hoá {h} ở cung {cung} trong đời thường", h=H, cung=C),
                    "danh_sach": [o["y"], L("trang_tv.ds.goi_y", "Gợi ý: {x}", x=o["loi_khuyen"])]})
    muc += [
        {"tieu_de": L("trang_tv.hc.nam_sinh", "Năm sinh nào có Hoá {h}", h=H),
         "doan": L("trang_tv.hc.nam_sinh_doan",
                   "Tứ hoá theo thiên can năm sinh: mỗi can có đúng một sao hoá {h}. Hoá {h} chỉ rơi vào cung {cung} khi "
                   "sao đó nằm ở cung {cung} trên lá số của bạn (bảng tứ hoá dùng trên lá số Hiểu Bản Thân).",
                   h=H, cung=C),
         "danh_sach": [L("trang_tv.hc.nam_sinh_dong", "Năm {can}: {sao} hoá {h}.", can=can_hien(can), sao=ts(sao), h=H)
                       for can, sao in theo_can]},
        {"tieu_de": L("trang_tv.sc.tam_phuong", "Tam phương tứ chính của cung {cung}", cung=C),
         "doan": L("trang_tv.hc.tam_phuong_doan",
                   "Hoá {h} ở cung {cung} cần đọc cùng cung xung chiếu {doi} và hai cung tam hợp {th1}, {th2}. "
                   "Hoá {h} ở chính các cung đó nghĩa như sau:", h=H, cung=C, doi=tc(doi), th1=tc(th1), th2=tc(th2)),
         "xem_them": [{"loai": "hoa_cung", "slug": f"{_slug_hoa(h)}-cung-{t._slug(x)}"} for x in (doi, th1, th2)]},
        {"tieu_de": L("trang_tv.hc.luu_y", "Lưu ý khi đọc"), "doan": t._cau(th_["luu_y"])},
    ]
    from app.kb import trang_co_thu as tct      # TV-CTP: câu Cốt Tuỷ Phú nhắc Hoá này ở cung này
    if (ct := tct.muc_trich(cung=cung, hoa=h)):
        muc.append(ct)
    hoi_dap = [
        {"hoi": L("trang_tv.hc.hoi_nghia", "Hoá {h} ở cung {cung} nghĩa là gì?", h=H, cung=C),
         "dap": f"{t._cau(nd)} {o.get('y', '')}".strip()},
        {"hoi": L("trang_tv.hc.hoi_nam_sinh", "Năm sinh nào có Hoá {h}?", h=H),
         "dap": _hoa_dau("; ".join(L("trang_tv.hc.nam_sao", "năm {can}: {sao}", can=can_hien(can), sao=ts(sao))
                                   for can, sao in theo_can)) + "."},
        {"hoi": L("trang_tv.hc.hoi_tot_xau", "Hoá {h} ở cung {cung} tốt hay xấu?", h=H, cung=C),
         "dap": L("trang_tv.hc.dap_tot_xau", "{y} {luu_y} Đọc kèm sao mang hoá và độ sáng của sao đó.",
                  y=th_["y_nghia"], luu_y=t._cau(th_["luu_y"]))},
    ]
    if o:
        hoi_dap.append({"hoi": L("trang_tv.hc.hoi_nen_lam", "Có Hoá {h} ở cung {cung} nên làm gì?", h=H, cung=C),
                        "dap": o["loi_khuyen"]})
    chinh = list(kb["chinh_tinh"])
    sao_con = list(dict.fromkeys(sao for _, sao in theo_can if sao in chinh))
    v = _vong()
    return them_y_bo_sung({
        "loai": "hoa_cung", "slug": slug,
        "tieu_de": L("trang_tv.hc.tieu_de", "Hoá {h} ở cung {cung}: ý nghĩa, năm sinh nào có", h=H, cung=C),
        "mo_ta": t._cat(L("trang_tv.hc.mo_ta",
                          "Hoá {h} ở cung {cung} trong Tử vi: {nd} Năm sinh nào có Hoá {h}, sao nào mang, tam phương tứ chính.",
                          h=H, cung=C, nd=nd)),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": nguon_kb(kb) + [L("trang_tv.hc.nguon",
                                   "Bảng tứ hoá theo thiên can: theo iztro (giữ cho Canh/Nhâm, quyết định 2026-10-02).")],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "cung", "slug": f"cung-{t._slug(cung)}"},
                      {"loai": "hoa_cung", "slug": f"{_slug_hoa(h)}-cung-{t._slug(doi)}"},
                      *({"loai": "hoa_cung", "slug": f"{_slug_hoa(x)}-cung-{t._slug(cung)}"} for x in _HOA if x != h)],
        "trang_con": {"tieu_de": L("trang_tv.hc.trang_con", "Sao mang Hoá {h} ở cung {cung}", h=H, cung=C),
                      "ds": [{"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(cung)}"} for sao in sao_con]},
        # `hoa` là mã (web tra chữ Hán theo mã); `vong` là chữ hiển thị.
        "minh_hoa": {"kieu": "hoa_cung", "hoa": h, "chi_so": v.index(cung), "vong": vong_hien()},
    }, "hoa_cung", k)


TRANG = {"sao_cung": (ds_sao_cung, trang_sao_cung), "hoa_cung": (ds_hoa_cung, trang_hoa_cung)}
TEN_NGAN = {"sao_cung": lambda k: L("trang_tv.ten_ngan.sao_cung", "{sao} ở cung {cung}", sao=ts(k[0]), cung=tc(k[1])),
            "hoa_cung": lambda k: L("trang_tv.ten_ngan.hoa_cung", "Hoá {h} ở cung {cung}", h=th(k[0]), cung=tc(k[1]))}


# ------------------------------------------------------------------ EN-ALL GĐ 4 (agent D): ý chính bản Anh
def y_chinh_en(t: dict, so: int) -> list[str] | None:
    """Ý chính tiếng Anh cho trang "sao ở cung" (KB-TT1 chỉ rút từ chữ Việt). SỐ Ý do bản Việt quyết (`so` = số ý của
    trang Việt — khung dữ kiện hai ngôn ngữ phải giống nhau); chữ rút từ chính trang tiếng Anh, cùng thứ tự khe như
    `y_chinh_tu_dong._sao_cung` (không thêm dữ kiện). Không đủ ý → None."""
    import re  # noqa: PLC0415

    from app.kb import y_chinh_tu_dong as yct  # noqa: PLC0415

    if t.get("loai") != "sao_cung" or not so:
        return None

    def doan(dau: str) -> str:
        return next((m.get("doan") or "" for m in t["muc"] if m["tieu_de"].startswith(dau)), "")

    ra = []
    if m := re.match(r"In Zi Wei Dou Shu, (.+? in the .+?): (.+)", t["tra_loi_nhanh"]):
        ra.append(yct._cat(f"{m.group(1)}: {m.group(2)}"))
    if m := re.search(r"when (the .+? Palace) falls in ([^.]+)\.", doan("When ") if "bright" in doan("When ") else ""):
        ra.append(yct._cat(f"Bright when {m.group(1)} is in: {m.group(2)}"))
    if d := doan("Which stars come with"):
        ra.append(yct._cat(re.sub(r"^Depending on the branch where .+? falls, ", "", d)))
    if m := re.search(r"its opposite palace, (.+?), and its two trine palaces, (.+?)\.", doan("The trine")):
        doi, tam = (re.sub(r"\bthe ", "", x) for x in m.groups())
        ra.append(yct._cat(f"Read with the opposite {doi} and the trines {tam}"))
    if d := doan("A question to reflect on"):
        ra.append(yct._cat(d))
    ra = [y for y in dict.fromkeys(ra) if y and len(y) <= yct.TOI_DA]
    return ra[:so] if len(ra) >= so else None
