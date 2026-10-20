# -*- coding: utf-8 -*-
"""TS-V3 — Tổng hợp ba phái + đồ thị liên phái + gói ngữ cảnh (RULES, không LLM, không DB).

Thay phần "Neuro-Symbolic" của bản SQL V3 (docs/REVIEW-ENGINE-V3.md) trong kiến trúc của dự án:
  - `fn_generate_numerology_profile(ALL_SYNTHESIS)` → `ho_so()`: con số của Pitago, Chaldea, Qabalah, MỘT bộ tính
    (calc/ Python, có golden) — không có bộ tính thứ hai trong SQL.
  - `fn_resolve_3school_matrix` + `graph_edges` → `tuong_tac()`: cạnh giữa các nhóm vị trí tương đương của các phái
    (cộng hưởng / hai góc nhìn / bổ sung nợ nghiệp–số kép / nhịp thời gian), câu mẫu ở KB `thanso_do_thi.json`.
  - hàm dựng gói ngữ cảnh của bản SQL → `ngu_canh()`: ý định (phân loại + ma trận nỗi đau) + hồ sơ + nút KB kích hoạt
    + tương tác liên phái + gói bằng chứng hỏi đáp + quy tắc diễn đạt bắt buộc. Tầng NARRATIVE chỉ diễn đạt gói này.
"""
from __future__ import annotations

import collections
import datetime as dt

from app.calc import thanso, thanso_chaldean as ch, thanso_kabbalah as kc
from app.kb import store, thanso_v2 as kb
from app.luangiai import hoi, noi_dau, thanso_chaldean as lch

PHAI = ("pitago", "chaldea", "kabbalah")
TEN_VI_TRI = {
    ("pitago", "duong_doi"): "Đường đời", ("pitago", "su_menh"): "Sứ mệnh", ("pitago", "linh_hon"): "Linh hồn",
    ("pitago", "nhan_cach"): "Nhân cách", ("chaldea", "so_ten"): "Số họ tên", ("chaldea", "ten_goi"): "Số tên gọi",
    ("chaldea", "ngay_sinh"): "Số ngày sinh", ("chaldea", "duong_doi"): "Số đường đời",
    ("chaldea", "linh_hon"): "Số linh hồn", ("chaldea", "nhan_cach"): "Số nhân cách",
    ("kabbalah", "con_duong_ten"): "Con đường của tên", ("kabbalah", "sephirah_ten"): "Sephirah của tên",
    ("kabbalah", "sephirah_ngay_sinh"): "Sephirah của ngày sinh",
}


def goc(n: int) -> int:
    """Quy mọi con số (số cái, số kép, con đường 1–22, Sephirah 10) về 1–9 để so giữa các phái."""
    while n > 9:
        n = sum(int(c) for c in str(n))
    return n


def ho_so(ho_ten: list[str], ngay: int, thang: int, nam: int, quy_uoc: str = "tong_het") -> dict:
    ten = ho_ten[0]
    ten_goi = ho_ten[1] if len(ho_ten) > 1 else None
    p = thanso.chi_so_xac_dinh(ten, ngay, thang, nam, quy_uoc)
    c = ch.tinh(ten, ngay, thang, nam, ten_goi)
    k = kc.tinh(ten, ngay, thang, nam)
    return {
        "pitago": {vt: {"so": p[vt], "goc": goc(p[vt])} for vt in ("duong_doi", "su_menh", "linh_hon", "nhan_cach")},
        "chaldea": {vt: {"so": c[vt]["kep"] or c[vt]["goc"], "kep": c[vt]["kep"], "goc": c[vt]["goc"]}
                    for vt in ("so_ten", "ten_goi", "ngay_sinh", "duong_doi", "linh_hon", "nhan_cach")},
        # Qabalah: con đường 1–22 không quy về 1–9 (chữ Hebrew, không phải con số); Sephirah 1–9 so được với số gốc,
        # Sephirah 10 (Malkuth) không có số tương ứng → goc None, không tham gia so cộng hưởng.
        "kabbalah": {vt: {"so": k[ma], "goc": k[ma] if vt != "con_duong_ten" and k[ma] <= 9 else None}
                     for vt, ma in (("con_duong_ten", "con_duong"), ("sephirah_ten", "sephirah_ten"),
                                    ("sephirah_ngay_sinh", "sephirah_ngay_sinh")) if k[ma]},
    }


# Ba vị trí này của ba phái là CÙNG MỘT phép cộng chữ số ngày sinh → luôn trùng gốc. Gộp thành một nguồn, không coi là
# "các phái đồng ý" (QC TS-V3). Tương tự Sephirah tên ↔ con đường tên của Qabalah (cùng tổng gematria): chỉ lấy Sephirah.
HO_NGAY_SINH = {("pitago", "duong_doi"), ("chaldea", "duong_doi"), ("kabbalah", "sephirah_ngay_sinh")}
BO_QUA = {("kabbalah", "con_duong_ten")}


def _nguon(hs: dict) -> list[tuple[str, str, int]]:
    """(phái, nhãn vị trí, số gốc) — mỗi nguồn độc lập một lần; họ ngày sinh gộp làm một nguồn "chung"."""
    ten_phai = kb.do_thi()["ten_phai"]
    out: list[tuple[str, str, int]] = []
    dd = hs["pitago"].get("duong_doi")
    if dd and dd["goc"]:
        out.append(("chung", "Đường đời (ba phái cùng một phép cộng ngày sinh)", dd["goc"]))
    for phai in PHAI:
        for vt, v in hs[phai].items():
            if (phai, vt) in HO_NGAY_SINH or (phai, vt) in BO_QUA or not v["goc"]:
                continue
            out.append((phai, f"{ten_phai[phai]} · {TEN_VI_TRI[(phai, vt)]}", v["goc"]))
    return out


def so_noi_bat(hs: dict) -> list[dict]:
    """Số gốc 1–9 lặp ở ≥ 2 nguồn độc lập thuộc ≥ 2 phái — "điểm chung" mà nhiều cách tính thật sự cùng chỉ ra."""
    gom: dict[int, list[tuple[str, str]]] = collections.defaultdict(list)
    for phai, nhan, g in _nguon(hs):
        gom[g].append((phai, nhan))
    kq = []
    for g, noi in gom.items():
        phai = sorted({p for p, _ in noi})
        if len(noi) >= 2 and len(phai) >= 2:
            n = store.nghia_so(g) or {}
            kq.append({"goc": g, "lan": len(noi), "phai": phai, "vi_tri": [x for _, x in noi],
                       "tu_khoa": n.get("tu_khoa"), "mat_toi": n.get("mat_toi"), "phan_chung": n.get("phan_chung")})
    return sorted(kq, key=lambda x: (-x["lan"], -len(x["phai"]), x["goc"]))


def _dien(mau: str, **kw) -> str:
    return mau.format(**kw)


def tuong_tac(hs: dict, ho_ten: list[str], ngay: int, thang: int, nam: int, ngay_xem: dt.date,
              noi_bat: list[dict], quy_uoc: str = "tong_het") -> list[dict]:
    g = kb.do_thi()
    qh, ten_phai = g["quan_he"], g["ten_phai"]
    kq = []
    for ma_nhom, nhom in g["nhom"].items():
        cac = [{"phai": p, "ten": f"{ten_phai[p]} · {TEN_VI_TRI[(p, vt)]}", **hs[p][vt]}
               for p, vt in nhom["vi_tri"] if vt in hs[p] and hs[p][vt]["goc"]]
        if len(cac) < 2:
            continue
        goc_set = {x["goc"] for x in cac}
        if len(goc_set) == 1:
            s = cac[0]["goc"]
            tk = (store.nghia_so(s) or {}).get("tu_khoa", "")
            loai = "cong_huong"
            van = {k: _dien(qh[loai][k], nhom=nhom["ten"].lower(), so=s, tu_khoa=tk.lower()) for k in ("cach_doc", "goi_y")}
        else:
            loai = "khac_nhip"
            ds = ", ".join(f"{x['ten']} {x['so']}" for x in cac)
            van = {k: _dien(qh[loai][k], nhom=nhom["ten"].lower(), danh_sach=ds) for k in ("cach_doc", "goi_y")}
        kq.append({"quan_he": loai, "ten_quan_he": qh[loai]["ten"],
                   "nhom": ma_nhom, "ten_nhom": nhom["ten"], "cac_so": cac, **van})
    # Bổ sung: nợ nghiệp Pitago ↔ số kép Chaldea cùng số (giao điểm đã tính ở bài Chaldea).
    so_ch = ch.tinh(ho_ten[0], ngay, thang, nam, ho_ten[1] if len(ho_ten) > 1 else None)
    for gd in lch.giao_diem(so_ch, ho_ten[0], ngay, thang, nam):
        if gd["cung_so"] and gd["cach_dung"]:
            kq.append({"quan_he": "bo_sung", "ten_quan_he": qh["bo_sung"]["ten"],
                       "nhom": gd["ma"], "ten_nhom": gd["ten"],
                       "cac_so": [{"phai": "pitago", "ten": f"Pitago · nợ nghiệp {gd['ma']}", "so": gd["pitago_no_nghiep"],
                                   "goc": goc(gd["pitago_no_nghiep"])},
                                  {"phai": "chaldea", "ten": "Chaldea · số kép", "so": gd["chaldea_kep"],
                                   "goc": goc(gd["chaldea_kep"])}],
                       "cach_doc": _dien(qh["bo_sung"]["cach_doc"], nhom=gd["ten"], so_a=gd["pitago_no_nghiep"],
                                         so_b=gd["chaldea_kep"], cach_dung=gd["cach_dung"]),
                       "goi_y": _dien(qh["bo_sung"]["goi_y"], tu_soi=gd["tu_soi"] or "")})
    # Nhịp thời gian: năm cá nhân hiện tại trùng số nổi bật nhất.
    if noi_bat:
        ncn = int(thanso.nam_ca_nhan(ngay, thang, ngay_xem.year, "duong_lich"))
        s = noi_bat[0]["goc"]
        if ncn == s:
            kq.append({"quan_he": "nhip_thoi_gian", "ten_quan_he": qh["nhip_thoi_gian"]["ten"],
                       "nhom": "nam_ca_nhan", "ten_nhom": "Năm cá nhân",
                       "cac_so": [{"phai": "pitago", "ten": f"Năm cá nhân {ngay_xem.year}", "so": ncn, "goc": ncn}],
                       **{k: _dien(qh["nhip_thoi_gian"][k], nam=ngay_xem.year, so=s,
                                   tu_khoa=(noi_bat[0]["tu_khoa"] or "").lower()) for k in ("cach_doc", "goi_y")}})
    return kq


def tong_hop(ho_ten: list[str], ngay: int, thang: int, nam: int, ngay_xem: dt.date,
             quy_uoc: str = "tong_het") -> dict:
    hs = ho_so(ho_ten, ngay, thang, nam, quy_uoc)
    nb = so_noi_bat(hs)
    tt = tuong_tac(hs, ho_ten, ngay, thang, nam, ngay_xem, nb, quy_uoc)
    ncn = int(thanso.nam_ca_nhan(ngay, thang, ngay_xem.year, "duong_lich"))
    meta = kb.meta_do_thi()
    return {
        "phai": "tong_hop",
        "ten_chinh": ho_ten[0],
        "ngay_sinh": f"{ngay:02d}/{thang:02d}/{nam}",
        "quy_uoc_duong_doi": quy_uoc,
        "ho_so": hs,
        "so_noi_bat": nb,
        "tuong_tac": tt,
        "nhip": {"nam": ngay_xem.year, "nam_ca_nhan": ncn, "cham_net_noi_bat": bool(nb) and ncn == nb[0]["goc"]},
        "cach_doc": ("Ba phái tính từ cùng họ tên và ngày sinh bằng ba bảng khác nhau. Chỗ các phái cùng ra một số là nét "
                     "đáng đối chiếu trước; chỗ khác nhau là các góc nhìn để bạn tự chọn điều đúng với mình."),
        "ghi_chu_duong_doi": ("Đường đời của ba phái cùng là một phép cộng chữ số ngày sinh nên luôn trùng nhau — được tính "
                              "là một nguồn, không coi là ba phái cùng đồng ý."),
        "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
        "trang_thai": meta["trang_thai"],
        "luu_y": "Thần số học là góc nhìn văn hoá để tự soi, không phải dự báo.",
    }


def _nut_kich_hoat(hs: dict) -> list[dict]:
    """Mục KB được dùng cho hồ sơ này (tương đương activated knowledge nodes của V3) — mỗi mục có nguồn."""
    nut = []
    for vt, v in hs["pitago"].items():
        n = store.nghia_so(v["so"])
        if n:
            nut.append({"ma": f"PYT_{vt.upper()}_{v['so']}", "phai": "pitago", "tu_khoa": n["tu_khoa"],
                        "source_id": n["source_id"], "school_id": n["school_id"]})
    for vt, v in hs["chaldea"].items():
        n = kb.chaldea_kep(v["kep"]) if v["kep"] else kb.chaldea_goc(v["goc"])
        if n:
            nut.append({"ma": f"CHA_{vt.upper()}_{v['so']}", "phai": "chaldea",
                        "tu_khoa": n.get("bieu_tuong") or n.get("ten"), **{k: kb.meta_chaldea()[k] for k in ("source_id", "school_id")}})
    for vt, v in hs["kabbalah"].items():
        n = kb.kabbalah_chu(v["so"]) if vt == "con_duong_ten" else kb.kabbalah_sephirah(v["so"])
        if n:
            nut.append({"ma": f"KAB_{vt.upper()}_{v['so']}", "phai": "kabbalah", "tu_khoa": n["ten"],
                        **{k: kb.meta_kabbalah()[k] for k in ("source_id", "school_id")}})
    return nut


def ngu_canh(ho_ten: list[str], ngay: int, thang: int, nam: int, cau_hoi: str, ngay_xem: dt.date,
             quy_uoc: str = "tong_het") -> dict:
    """Gói ngữ cảnh V3 cho tầng NARRATIVE: chỉ dữ kiện đã tính + KB có nguồn + quy tắc diễn đạt."""
    from app.narrative import hoi_van   # tránh import vòng (hoi_van dùng tong_hop cho phái tổng hợp)

    pl = hoi.phan_loai(cau_hoi)
    nguoi = {"ho_ten": ho_ten, "ngay": ngay, "thang": thang, "nam": nam, "quy_uoc": quy_uoc}
    q = noi_dau.cau_chuan(cau_hoi) or next(iter(noi_dau.lien_quan(cau_hoi, 1)), None)
    y_dinh = {"linh_vuc": pl["linh_vuc"], "xu_ly": pl["xu_ly"], "doi_tuong": pl["doi_tuong"], "y_dinh": pl["y_dinh"],
              "ma_cau": q["ma"] if q else None, "tru": q["tru"] if q else None}
    dac_biet = pl["xu_ly"] in ("an_toan", "tu_choi_nhe")
    tl = hoi_van.tra_loi(cau_hoi, nguoi, None, ngay_xem, dung_llm=False)
    th = None if dac_biet else tong_hop(ho_ten, ngay, thang, nam, ngay_xem, quy_uoc)
    return {
        "loai": "ngu_canh",
        "che_do": "tong_hop",
        "cau_hoi": cau_hoi,
        "y_dinh": y_dinh,
        "ho_so_tinh_toan": th["ho_so"] if th else {},
        "nut_kich_hoat": _nut_kich_hoat(th["ho_so"]) if th else [],
        "so_noi_bat": th["so_noi_bat"] if th else [],
        "tuong_tac_lien_phai": th["tuong_tac"] if th else [],
        "bang_chung": tl["bang_chung"],
        "quy_tac_bat_buoc": kb.do_thi()["quy_tac_dien_dat"],
    }
