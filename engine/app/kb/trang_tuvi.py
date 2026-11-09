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
from app.kb import nap

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


def _ds_doi_song() -> dict:
    return _t()._doc("tuvi_doi_song_kb.json")


def theo_chi_sao(sao: str) -> list[str]:
    """12 vị trí của một chính tinh theo chi (độ sáng Nam phái + sao đồng cung + cung đối diện) — dùng ở trang sao."""
    ra = []
    for chi, o in vt.bo_cuc_theo_sao(sao).items():
        ds = ds_vn.do_sang(sao, chi)
        dong = f"đồng cung {_ds_ten(o['dong_cung'])}" if o["dong_cung"] else "đứng một mình (không chính tinh khác)"
        xung = (f"cung đối diện (ở {o['xung_chieu_chi']}) có {_ds_ten(o['xung_chieu'])}" if o["xung_chieu"]
                else f"cung đối diện (ở {o['xung_chieu_chi']}) vô chính diệu")
        ra.append(f"{chi}{f' ({ds})' if ds else ''}: {dong}; {xung}.")
    return ra


def _loi_doi_song(sao: str, cung: str, tt: str) -> list[str]:
    """SEO-K: lời đời thường riêng của ô sao × cung (KB tuvi_doi_song_kb.json, cùng nguồn với Luận giải đời sống)."""
    o = _ds_doi_song()["sao_linh_vuc"].get(sao, {}).get(cung, {}).get(tt)
    if not o:
        return []
    return [f"Điểm mạnh: {o['manh']}", f"Dễ vấp: {o['de_vap']}", f"Gợi ý: {o['loi_khuyen']}"]


_KHONG_THAY_BAC_SI = "Đây là thói quen nên để ý theo quan niệm Tử vi, không phải chẩn đoán và không thay lời bác sĩ."


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
        cau += "; hoặc " + _khi(dk["hoac"])[4:]
    return "Khi " + cau


def muc_y_bo_sung(loai: str, k) -> list[dict]:
    """0–2 mục: "Thêm một cách đọc" (ý chung) và "Góc nhìn khác (tham khảo)" (ý riêng trường phái, web hiện gập)."""
    ds = y_cho_trang(loai, k)
    ra = []
    # Không thêm đoạn dẫn chung: câu lặp ở mọi trang làm giảm phần riêng; điều kiện đã ở đầu từng dòng, lời "chưa đối
    # chiếu rộng" của nhóm góc nhìn khác do web ghi ở dòng tóm tắt khung gập.
    for hien, tieu_de in (("hop", "Thêm một cách đọc"), ("goc_nhin_khac", "Góc nhìn khác (tham khảo)")):
        y = [m for m in ds if m["hien_thi"] == hien]
        if not y:
            continue
        dong = [f"{_khi(m['dieu_kien'])}: {_cau(m['loi_doi_thuong'])} Nên làm: {_cau(m['viec_nen_lam'])}" for m in y]
        if any(m["loai"] == "suc_khoe_phong_ngua" or _SUC_KHOE.search(m["loi_doi_thuong"]) for m in y) \
                and not any(re.search(r"không thay lời bác sĩ", d) for d in dong):
            dong.append(_KHONG_THAY_BAC_SI)
        ra.append({"ma": f"y_bo_sung_{hien}", "tieu_de": tieu_de, "danh_sach": dong, "bien_tap": True,
                   **({"gap": True} if hien == "goc_nhin_khac" else {})})
    return ra


def _cau(s: str) -> str:
    s = s.strip()
    return s if s.endswith((".", "!", "?", "…")) else s + "."


def them_y_bo_sung(t: dict, loai: str, k) -> dict:
    """Chèn mục ý bổ sung trước "Câu hỏi tự soi" (mục cuối) và ghi nguồn chung một lần."""
    moi = muc_y_bo_sung(loai, k)
    if moi:
        i = next((j for j, m in enumerate(t["muc"]) if m["tieu_de"] == "Câu hỏi tự soi"), len(t["muc"]))
        t["muc"][i:i] = moi
        if _NGUON_Y not in t["nguon"]:
            t["nguon"].append(_NGUON_Y)
    return t


def _muc_su_kien_menh(sao: str, cung: str) -> dict:
    """AUD-P0: dữ kiện TÍNH riêng của trang (CALC `tuvi_vi_tri`, xét đủ 12 vị trí Tử Vi) — cung Mệnh có sao gì khi sao ở
    cung này; sao toạ Mệnh thì ba cung tam phương. Câu khung ở KB `su_kien_kb.json`."""
    t = _t()
    kb = t._doc("su_kien_kb.json")
    k = _vong().index(cung)
    if k == 0:
        m = kb["sao_toa_menh"]
        dong = []
        for ten, lech in m["cung"]:
            tt = vt.tom_tat_cung_khac(sao, 0, lech)
            kn = [f"{' · '.join(x['sao'])} ({x['so_vi_tri']})" for x in tt["to_hop"]]
            if tt["vo_chinh_dieu"]:
                kn.append(f"vô chính diệu ({tt['vo_chinh_dieu']})")
            dong.append([ten, " · ".join(tt["luon_co"]) or m["khong_co"], "; ".join(kn)])
        return {"ma": "su_kien_menh", "tieu_de": m["tieu_de"].format(sao=sao), "doan": m["doan"].format(sao=sao),
                "bang": {"cot": m["cot"], "dong": dong}}
    m = kb["sao_cung_menh"]
    tt = vt.tom_tat_cung_khac(sao, k, 0)
    luon = " và ".join(tt["luon_co"])
    doan = (m["luon_co"].format(sao=sao, cung=cung, luon_co=luon) if tt["luon_co"]
            else m["khong_co"].format(sao=sao, cung=cung))
    if tt["vo_chinh_dieu"]:
        doan += " " + m["vo_chinh_dieu"].format(n=tt["vo_chinh_dieu"])
    # Mệnh cố định một sao → bảng phân bố giống hệt ở các trang cùng sao Mệnh (trùng lặp) → chỉ câu dữ kiện + link
    # sang trang sao đó ở Mệnh; Mệnh không cố định → bảng các khả năng (thông tin riêng của cặp sao × cung này).
    dong = [[" · ".join(x["sao"]), f"{x['so_vi_tri']}/12"] for x in tt["to_hop"]]
    if tt["vo_chinh_dieu"]:
        dong.append([m["dong_vcd"], f"{tt['vo_chinh_dieu']}/12"])
    return {"ma": "su_kien_menh", "tieu_de": m["tieu_de"].format(sao=sao, cung=cung), "doan": doan,
            **({} if tt["luon_co"] else {"bang": {"cot": m["cot"], "dong": dong}}),
            **({"xem_them": [{"loai": "sao_cung", "slug": f"{t._slug(x)}-cung-menh"} for x in tt["luon_co"]]} if tt["luon_co"] else {})}


def trang_sao_cung(k: tuple[str, str], slug: str) -> dict:
    t, kb = _t(), _kb()
    sao, cung = k
    s, c = kb["chinh_tinh"][sao], kb["cung"][cung]
    nd = kb["sao_cung"][sao][cung]
    doi, th1, th2 = _cung_lien(cung)
    sang, ham = _sang_ham(sao)
    dsg = _ds_doi_song()
    lv = dsg["linh_vuc"].get(cung, {})
    loi_sang, loi_ham = _loi_doi_song(sao, cung, "sang"), _loi_doi_song(sao, cung, "ham")
    manh_sang = (dsg["sao_linh_vuc"].get(sao, {}).get(cung, {}).get("sang") or {}).get("manh", "")
    tra_loi = (f"Trong Tử vi, {sao} ở cung {cung}: {t._cau(nd)} {manh_sang} "
               f"Nghĩa đậm hay nhạt tuỳ {sao} sáng hay hãm ở chi cung {cung} rơi vào, và sao nào đi cùng.").replace("  ", " ")
    cs, ch = (", ".join(sang) or "không chi nào"), (", ".join(ham) if ham else "")
    muc = [
        {"tieu_de": f"Cung {cung} và sao {sao} — nhắc nhanh",
         "doan": (f"Cung {cung} nói về {lv.get('ten_doi_thuong') or c['xem_duoc']}"
                  f"{': ' + t._cau(lv['mo_ta'][:1].lower() + lv['mo_ta'][1:]) if lv.get('mo_ta') else '.'} "
                  f"{sao} là chính tinh hành {s['ngu_hanh']}: {t._cau(s['tinh_chat'][:1].lower() + s['tinh_chat'][1:])}"),
         "xem_them": [{"loai": "cung", "slug": f"cung-{t._slug(cung)}"}, {"loai": "sao", "slug": f"sao-{t._slug(sao)}"}]},
    ]
    if loi_sang:
        muc.append({"tieu_de": f"Khi {sao} sáng ở cung {cung}",
                    "doan": f"{sao} sáng (Miếu/Vượng/Đắc) khi cung {cung} rơi vào {cs}.", "danh_sach": loi_sang})
    if loi_ham:
        muc.append({"tieu_de": f"Khi {sao} hãm ở cung {cung}" if ham else f"Khi {sao} kém sáng ở cung {cung}",
                    "doan": (f"{sao} hãm khi cung {cung} rơi vào {ch}." if ham else
                             f"{sao} không có vị trí hãm theo bảng Nam phái; ý dưới đây dùng khi sao đứng chỗ kém sáng."),
                    "danh_sach": loi_ham})
    if cung == "Tật Ách" and (sk := dsg["suc_khoe"].get(sao)):
        muc.append({"tieu_de": f"{sao} ở cung Tật Ách: nhịp sinh hoạt nên để ý",
                    "danh_sach": [f"Thói quen dễ hao sức: {sk['thoi_quen']}",
                                  f"Phần cơ thể sách xưa gắn với sao: {sk['bo_phan']} — nên chăm sóc phòng ngừa.",
                                  f"Gợi ý: {sk['loi_khuyen']}", _KHONG_THAY_BAC_SI]})
    muc.append({"tieu_de": f"{sao} đi cùng sao nào",
                "doan": (f"Tuỳ chi cung {cung} rơi vào, {sao} {_nhom_dong_cung(sao)}. Độ sáng và sao đối diện ở cả 12 "
                         f"vị trí có ở trang sao {sao}."),
                "xem_them": [{"loai": "sao", "slug": f"sao-{t._slug(sao)}"}]})
    muc.append({"tieu_de": f"Tam phương tứ chính của cung {cung}",
                "doan": (f"Không đọc {sao} một mình: cung {cung} luôn xét cùng cung xung chiếu {doi} và hai cung "
                         f"tam hợp {th1}, {th2}. {sao} đứng ở chính các cung đó thì nghĩa như sau:"),
                "xem_them": [{"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(x)}"} for x in (doi, th1, th2)]})
    hoa = _hoa_cua_sao(sao)
    if hoa:
        hlv = dsg["hoa_linh_vuc"]
        muc.append({"tieu_de": f"Khi {sao} hoá Lộc, Quyền, Khoa, Kỵ ở cung {cung}",
                    "doan": "Sinh năm có thiên can dưới đây thì sao được hoá (bảng tứ hoá dùng trên lá số Hiểu Bản Thân).",
                    "danh_sach": [f"Năm {can}: {sao} hoá {h} — {(hlv.get(h, {}).get(cung) or {}).get('y') or kb['tu_hoa_cung'][h][cung]}"
                                  for can, h in hoa if cung in kb["tu_hoa_cung"].get(h, {})],
                    "xem_them": [{"loai": "hoa_cung", "slug": f"{_slug_hoa(h)}-cung-{t._slug(cung)}"}
                                 for h in dict.fromkeys(h for _, h in hoa)]})
    muc.append(_muc_su_kien_menh(sao, cung))
    from app.kb import trang_co_thu as tct      # TV-CTP: câu Cốt Tuỷ Phú nhắc đúng sao ở cung này
    if (ct := tct.muc_trich(sao=sao, cung=cung)):
        muc.append(ct)
    muc.append({"tieu_de": "Câu hỏi tự soi", "doan": s["cau_tu_soi"]})

    tot_xau = f"Khi sáng: {manh_sang}" if manh_sang else ""
    o_ham = (dsg["sao_linh_vuc"].get(sao, {}).get(cung, {}).get("ham") or {})
    hoi_dap = [
        {"hoi": f"{sao} ở cung {cung} có ý nghĩa gì?", "dap": t._cau(nd)},
        {"hoi": f"{sao} ở cung {cung} tốt hay xấu?",
         "dap": (f"Tử vi không chia sao tốt hay xấu tuyệt đối. {sao} sáng ở {cs}" + (f", hãm ở {ch}" if ham else "")
                 + f". {tot_xau}" + (f" Khi {'hãm' if ham else 'kém sáng'}: {o_ham['de_vap']}" if o_ham.get("de_vap") else "")).strip()},
        {"hoi": f"{sao} ở cung {cung} đi cùng sao nào?",
         "dap": (f"Tuỳ chi: {sao} {_nhom_dong_cung(sao)}. Ngoài ra luôn xem cung {doi} xung chiếu và hai cung "
                 f"tam hợp {th1}, {th2}.")},
    ]
    if loi_sang:
        hoi_dap.append({"hoi": f"Người có {sao} ở cung {cung} nên làm gì?",
                        "dap": (dsg["sao_linh_vuc"][sao][cung]["sang"]["loi_khuyen"])})
    if hoa:
        hoi_dap.append({"hoi": f"Năm nào {sao} hoá Lộc, Quyền, Khoa, Kỵ?",
                        "dap": _hoa_dau("; ".join(f"năm {can}: hoá {h}" for can, h in hoa)) + "."})
    v = _vong()
    i = v.index(cung)
    return them_y_bo_sung({
        "loai": "sao_cung", "slug": slug,
        "tieu_de": f"{sao} ở cung {cung}: ý nghĩa, sáng hãm, sao đi cùng",
        "mo_ta": t._cat(f"{sao} ở cung {cung} trong Tử vi: {nd} Khi sáng, khi hãm, sao đồng cung, tam phương, tứ hoá."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": list(kb["source"].values()) + [
            "Vị trí chính tinh và độ sáng: tính theo khẩu quyết an sao, đối chiếu lasotuvi (MIT) 60 lá số mẫu."],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "sao", "slug": f"sao-{t._slug(sao)}"}, {"loai": "cung", "slug": f"cung-{t._slug(cung)}"},
                      {"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(v[(i + 1) % 12])}"},
                      {"loai": "sao_cung", "slug": f"{t._slug(sao)}-cung-{t._slug(v[(i - 1) % 12])}"}],
        "minh_hoa": {"kieu": "sao_cung", "ten": sao, "ten_han": s["ten_han"], "ngu_hanh": s["ngu_hanh"],
                     "chi_so": i, "vong": v},
    }, "sao_cung", k)


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
    o = _ds_doi_song()["hoa_linh_vuc"].get(h, {}).get(cung) or {}
    lv = _ds_doi_song()["linh_vuc"].get(cung, {})
    tra_loi = (f"Hoá {h} ở cung {cung}: {t._cau(nd)} {o.get('y', '')} "
               f"Hoá {h} đi theo một sao cụ thể, do thiên can năm sinh quyết định — xem bảng bên dưới.").replace("  ", " ")
    muc = [
        {"tieu_de": f"Hoá {h} và cung {cung} — nhắc nhanh",
         "doan": (f"{t._cau(th['y_nghia'])} Cung {cung} nói về {lv.get('ten_doi_thuong') or c['xem_duoc']}"
                  f"{': ' + t._cau(lv['mo_ta'][:1].lower() + lv['mo_ta'][1:]) if lv.get('mo_ta') else '.'}"),
         "xem_them": [{"loai": "cung", "slug": f"cung-{t._slug(cung)}"}]},
    ]
    if o:
        muc.append({"tieu_de": f"Hoá {h} ở cung {cung} trong đời thường",
                    "danh_sach": [o["y"], f"Gợi ý: {o['loi_khuyen']}"]})
    muc += [
        {"tieu_de": f"Năm sinh nào có Hoá {h}",
         "doan": (f"Tứ hoá theo thiên can năm sinh: mỗi can có đúng một sao hoá {h}. Hoá {h} chỉ rơi vào cung {cung} khi "
                  f"sao đó nằm ở cung {cung} trên lá số của bạn (bảng tứ hoá dùng trên lá số Hiểu Bản Thân)."),
         "danh_sach": [f"Năm {can}: {sao} hoá {h}." for can, sao in theo_can]},
        {"tieu_de": f"Tam phương tứ chính của cung {cung}",
         "doan": (f"Hoá {h} ở cung {cung} cần đọc cùng cung xung chiếu {doi} và hai cung tam hợp {th1}, {th2}. "
                  f"Hoá {h} ở chính các cung đó nghĩa như sau:"),
         "xem_them": [{"loai": "hoa_cung", "slug": f"{_slug_hoa(h)}-cung-{t._slug(x)}"} for x in (doi, th1, th2)]},
        {"tieu_de": "Lưu ý khi đọc", "doan": t._cau(th["luu_y"])},
    ]
    from app.kb import trang_co_thu as tct      # TV-CTP: câu Cốt Tuỷ Phú nhắc Hoá này ở cung này
    if (ct := tct.muc_trich(cung=cung, hoa=h)):
        muc.append(ct)
    hoi_dap = [
        {"hoi": f"Hoá {h} ở cung {cung} nghĩa là gì?", "dap": f"{t._cau(nd)} {o.get('y', '')}".strip()},
        {"hoi": f"Năm sinh nào có Hoá {h}?",
         "dap": _hoa_dau("; ".join(f"năm {can}: {sao}" for can, sao in theo_can)) + "."},
        {"hoi": f"Hoá {h} ở cung {cung} tốt hay xấu?",
         "dap": f"{th['y_nghia']} {t._cau(th['luu_y'])} Đọc kèm sao mang hoá và độ sáng của sao đó."},
    ]
    if o:
        hoi_dap.append({"hoi": f"Có Hoá {h} ở cung {cung} nên làm gì?", "dap": o["loi_khuyen"]})
    chinh = list(kb["chinh_tinh"])
    sao_con = list(dict.fromkeys(sao for _, sao in theo_can if sao in chinh))
    v = _vong()
    return them_y_bo_sung({
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
    }, "hoa_cung", k)


TRANG = {"sao_cung": (ds_sao_cung, trang_sao_cung), "hoa_cung": (ds_hoa_cung, trang_hoa_cung)}
TEN_NGAN = {"sao_cung": lambda k: f"{k[0]} ở cung {k[1]}", "hoa_cung": lambda k: f"Hoá {k[0]} ở cung {k[1]}"}
