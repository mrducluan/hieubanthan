# -*- coding: utf-8 -*-
"""EN-ALL GĐ 8 (nhóm D) — lớp HIỂN THỊ theo ngôn ngữ cho các route NĂM & TUỔI: trang năm (tổng quan, sinh con, cưới
hỏi, Tử vi năm theo tuổi), tuổi làm nhà, xông đất, hướng xấu năm, sao hạn (mẫu: `phongthuy_hien.py`, `lich_hien.py`).

`luangiai.tuoi_dan_gian` / `luangiai.nam_tong_quan` / `luangiai.trang_tuoi` đọc KB lúc nạp module và trả CÂU tiếng Việt;
các module khác (Nhà của bạn, hỏi đáp, Thời gian tới) còn đọc chính các câu đó. Nên phép tính + câu Việt giữ nguyên; ở
route, khi lượt gọi KHÔNG phải tiếng Việt, kết quả đi qua các hàm dưới đây: chữ dựng lại bằng mẫu `L()` (tệp
`kb/data/en/loi/nam_tuoi.json`) + bản phủ KB (`nam_tong_quan_kb`, `tuoi_dan_gian_kb`, `sao_han_kb`) từ MÃ / số có trong
chính kết quả — không đổi số, mã, độ dài danh sách, thứ tự (khung dữ kiện trùng bản Việt). Trường mã tên riêng
(`chi`, `can`, `phuong`, `nap_am`…, `kb/ten.KHOA_MA`) giữ chữ Việt; tên hiển thị đi qua `ten_hien`.
"""
from __future__ import annotations

import copy
import datetime as dt
import re

from app import ngon_ngu
from app.kb import nap
from app.kb import ten as _ten
from app.kb.loi import L, danh_sach, hoa_dau
from app.luangiai import lich_hien as lh
from app.luangiai import phongthuy_hien as pth

_DAN_GIAN = "tuoi_dan_gian_kb.json"
_NAM = "nam_tong_quan_kb.json"
_SH = "sao_han_kb.json"


def la_viet() -> bool:
    return ngon_ngu.la_viet()


# ------------------------------------------------------------------ tên, ngày
def _cc(s: str | None) -> str | None:
    return lh.can_chi(s)


def _con(chi: str) -> str:
    """Con giáp đời thường: "Mùi" → "Goat" (bảng tên `chi.nghia`); không có thì phiên âm."""
    m = _ten.muc("chi", chi) or {}
    return m.get("nghia") or _ten.ten("chi", chi)


def _cons(ds) -> str:
    return danh_sach([_con(c) for c in ds])


def _chi(chi: str) -> str:
    return _ten.ten("chi", chi)


def _na(ten: str) -> str:
    return _ten.ten("nap_am", ten)


def _hanh(h: str) -> str:
    return _ten.ten("hanh", h)


def _huong(h: str | None) -> str | None:
    if h == "Giữa nhà":
        return L("nt.giua_nha", "Giữa nhà")
    return _ten.ten("huong", h) if h else h


def _ngay(d: dt.date | str, nam: bool = True) -> str:
    d = dt.date.fromisoformat(d) if isinstance(d, str) else d
    return pth.ngay(d.year, d.month, d.day, nam)


_RE_DMY = re.compile(r"(\d{1,2})/(\d{1,2})/(\d{4})")


def _kb(tep: str) -> dict:
    return nap.doc(tep)


def _nguon(tep: str, vi: str) -> str:
    return ((_kb(tep).get("source") or {}).get("ten")) or vi


# ------------------------------------------------------------------ Kim lâu, Hoang ốc, Tam tai: tên Việt → nhãn
def _bang_vi(muc: str) -> dict[str, str]:
    from app.luangiai import tuoi_dan_gian as tdg  # noqa: PLC0415 — KB tiếng Việt (module đọc lúc nạp)
    return {v["ten"]: k for k, v in tdg.KB[muc].items()}


def kim_lau(vi: str | None) -> str | None:
    """"Kim lâu Thê" → "Kim Lau (spouse)" — nhãn ngắn cho bảng / danh sách."""
    if not vi:
        return vi
    ma = _bang_vi("kim_lau").get(vi)
    return L(f"nt.kl.{ma}", vi) if ma else vi


def hoang_oc(vi: str | None) -> str | None:
    if not vi:
        return vi
    ma = _bang_vi("hoang_oc").get(vi)
    return L(f"nt.ho.{ma}", vi) if ma else vi


_RE_TT = re.compile(r"^Tam tai \(năm thứ (\d)\)$")


def xau(vi: str) -> str:
    """Một mục danh sách "phạm" (Kim lâu / Hoang ốc xấu / "Tam tai (năm thứ n)") → nhãn theo ngôn ngữ."""
    m = _RE_TT.match(vi)
    if m:
        return L("nt.tam_tai_n", "Tam tai (năm thứ {n})", n=m.group(1))
    return kim_lau(vi) if vi in _bang_vi("kim_lau") else hoang_oc(vi)


def sao_han_ten(vi: str | None) -> str | None:
    if not vi:
        return vi
    from app.hoidap import chung  # noqa: PLC0415
    return chung.ten_sao_han(vi)


def _sao_o(o: dict | None, bang: str) -> dict | None:
    """Ô sao / hạn {ten, nghia?, viec?, tu_soi?, han?} → chữ theo bản phủ `sao_han_kb` (khoá theo tên Việt)."""
    if not o:
        return o
    g = (_kb(_SH).get(bang) or {}).get(o["ten"]) or {}
    o = dict(o)
    for k in ("nghia", "tu_soi"):
        if k in o:
            o[k] = g.get(k, o[k])
    if "viec" in o:
        v = g.get("viec")
        o["viec"] = list(v) if isinstance(v, list) and len(v) == len(o["viec"]) else o["viec"]
    if o.get("han"):
        o["han"] = sao_han_ten(o["han"])
    o["ten"] = sao_han_ten(o["ten"])
    return o


def _meta(d: dict, loai: str) -> dict:
    """nguon + luu_y của ba nhóm KB (dân gian / năm / sao hạn)."""
    if loai == "nam":
        if "nguon" in d:
            d["nguon"] = _nguon(_NAM, d["nguon"])
        if "luu_y" in d:
            d["luu_y"] = _kb(_NAM).get("luu_y_chung", d["luu_y"])
        return d
    if "nguon" in d:
        d["nguon"] = _nguon(_SH if loai == "sh" else _DAN_GIAN, d["nguon"])
    if "luu_y" in d:
        d["luu_y"] = L("nt.luu_y", d["luu_y"])
    if loai == "sh":
        kb = _kb(_SH)
        for k in ("cau_co_dinh", "cach_tinh"):
            if k in d:
                d[k] = kb.get(k, d[k])
    return d


# ------------------------------------------------------------------ hạn năm (hướng xấu theo năm)
def han_nam(h: dict) -> dict:
    """`tuoi_dan_gian.han_nam_luan` (đầy đủ) hoặc bản gọn của trang tuổi (`trang_tuoi._han_nam_gon`)."""
    if la_viet():
        return h
    goc = h
    h = pth.han_nam(h) if "moc" in h else copy.deepcopy(h)
    if "moc" not in goc:   # bản gọn: chỉ tên + can chi
        kb = _kb(_DAN_GIAN).get("han_nam") or {}
        for x in h.get("huong_tranh", []):
            x["ten"] = (kb.get(x.get("ma")) or {}).get("ten", x["ten"])
        h["can_chi"] = _cc(goc["can_chi"])
    for x in h.get("huong_tranh", []):
        x["phuong"] = _huong(x["phuong"]) if x.get("phuong") == "Giữa nhà" else x.get("phuong")
    hk = _kb("phongthuy_huyen_khong.json").get("sao") or {}
    for x in h.get("phi_tinh", []):
        if x.get("phuong") == "Giữa nhà":
            x["phuong"] = _huong(x["phuong"])
        x["ten_sao"] = _ten.ten("sao_bay", x["ten_sao"])
        x["y_nghia"] = (hk.get(str(x["sao"])) or {}).get("y_vuong", x.get("y_nghia"))
    if "tra_loi_nhanh" in goc:
        nam, cc = goc["nam"], h["can_chi"]
        tranh = h["huong_tranh"]
        ds = L("nt.hn.noi", "; ").join(L("nt.hn.tranh_o", "{ten} ở {phuong}", ten=x["ten"], phuong=_huong(x["phuong"]))
                                       for x in tranh)
        tl = L("nt.hn.tra_loi", "Năm {nam} ({cc}), các phương truyền thống khuyên tránh động thổ, đục phá lớn: {ds}. "
               "Tính theo năm tiết khí từ Lập xuân (khoảng 4/2/{nam}).", nam=nam, cc=cc, ds=ds)
        h["tra_loi_nhanh"] = tl
        tt = next(x for x in tranh if x["ma"] == "thai_tue")
        ten_ma = {x["ma"]: x["ten"] for x in tranh}
        hd = [
            {"hoi": L("nt.hn.hd1", "Năm {nam} hướng nào xấu, không nên động thổ?", nam=nam), "dap": tl},
            {"hoi": L("nt.hn.hd2", "Năm {nam} Thái Tuế ở đâu?", nam=nam, ten=ten_ma["thai_tue"]),
             "dap": L("nt.hn.hd2_dap", "Thái Tuế năm {cc} ở phương {phuong} ({chi}); Tuế Phá ở phương đối diện.",
                      cc=cc, phuong=_huong(tt["phuong"]), chi=", ".join(_chi(c) for c in tt.get("chi", [])),
                      ten=ten_ma["thai_tue"], pha=ten_ma["tue_pha"])},
            {"hoi": L("nt.hn.hd3", "Năm {nam} Ngũ Hoàng, Nhị Hắc bay tới đâu?", nam=nam),
             "dap": L("nt.hn.noi", "; ").join(L("nt.hn.bay_toi", "{ten} bay tới phương {phuong}", ten=x["ten"], phuong=_huong(x["phuong"]))
                                             for x in tranh if x["ma"] in ("ngu_hoang", "nhi_hac")) + "."},
            {"hoi": L("nt.hn.hd4", "Đang ở sẵn nhà có cần đổi hướng không?"),
             "dap": L("nt.hn.hd4_dap", "Không. Hạn năm chỉ nhắc tránh khởi công, đục phá lớn ở các phương đó trong năm; nhà đang ở "
                      "giữ nguyên, giữ phía ấy gọn gàng, yên tĩnh là đủ.")},
        ]
        h["hoi_dap"] = hd[:len(goc.get("hoi_dap") or [])]
    return _meta(h, "dg")


# ------------------------------------------------------------------ tuổi làm nhà
def lam_nha(d: dict) -> dict:
    """`xem_tuoi_lam_nha` (đầy đủ, công cụ) hoặc bản trang SEO (`trang_tuoi.lam_nha`: bỏ `cach_tinh`, thêm `muoi_nam`)."""
    if la_viet():
        return d
    co_cach_tinh = "cach_tinh" in d
    x = pth.tuoi_lam_nha(d)            # Kim lâu / Hoang ốc / Tam tai / kết luận / năm tuổi / cách tính / năm thuận
    if not co_cach_tinh:
        x.pop("cach_tinh", None)
    nx, tuoi = d["nam_xay"], d["tuoi_mu"]
    cc = _cc(d["can_chi"])
    x["can_chi"] = cc
    x["can_chi_nam_xay"] = _cc(d["can_chi_nam_xay"])
    x["cac_nam_tam_tai"] = [_cons([c]) for c in d["cac_nam_tam_tai"]]
    tl = L("nt.ln.tra_loi", "{ket} Người sinh năm {ns} ({cc}) tính tuổi mụ {tuoi} vào năm {nam}.",
           ket=x["ket_luan"]["chu"], ns=d["nam_sinh"], cc=cc, tuoi=tuoi, nam=nx)
    if d["ket_luan"]["ma"] != "thuan" and d["nam_thuan"]:
        n0 = x["nam_thuan"][0]
        tl += L("nt.ln.nam_gan", " Năm gần nhất không phạm: {nam} ({cc}, tuổi {tuoi}).", nam=n0["nam"], cc=n0["can_chi"], tuoi=n0["tuoi_mu"])
    x["tra_loi_nhanh"] = tl
    kl = d.get("kim_lau")
    x["cuoi_hoi"] = (L("nt.ln.cuoi_kl", "Với cưới hỏi, dân gian xét Kim lâu theo tuổi mụ của cô dâu: tuổi {tuoi} phạm {kl}.",
                       tuoi=tuoi, kl=kim_lau(kl["ten"])) if kl else
                     L("nt.ln.cuoi_khong", "Với cưới hỏi, dân gian xét Kim lâu theo tuổi mụ của cô dâu: tuổi {tuoi} không phạm Kim lâu.",
                       tuoi=tuoi))
    if d.get("cach_dan_gian"):
        x["cach_dan_gian"] = _kb(_DAN_GIAN).get("cach_dan_gian", d["cach_dan_gian"])
    x["han_nam"] = han_nam(d["han_nam"])
    for y in x.get("muoi_nam") or []:
        y["can_chi"] = _cc(y["can_chi"])
        y["kim_lau"] = kim_lau(y["kim_lau"])
        y["hoang_oc"] = hoang_oc(y["hoang_oc"])
    return _meta(x, "dg")


def lam_nha_nam(d: dict) -> dict:
    if la_viet():
        return d
    x = copy.deepcopy(d)
    nam, cc = d["nam"], _cc(d["can_chi"])
    chi_n = d["can_chi"].split()[1]
    x["can_chi"] = cc
    for y in x["ds"]:
        y["can_chi"] = _cc(y["can_chi"])
        y["kim_lau"] = kim_lau(y["kim_lau"])
        y["hoang_oc"] = hoang_oc(y["hoang_oc"])
        y["xau"] = [xau(v) for v in y["xau"]]
    ten = lambda xs: ", ".join(f"{v['nam_sinh']} ({v['can_chi']})" for v in xs)  # noqa: E731
    thuan = [v for v in x["ds"] if v["thuan"]]
    tl = L("nt.lnn.tra_loi", "Năm {nam} ({cc}), trong các tuổi sinh 1960–2005 có {n} tuổi không phạm Kim lâu, Hoang ốc xấu hay "
           "Tam tai: {ds}. Các tuổi còn lại dân gian thường lùi năm hoặc mượn tuổi người nhà để đứng tên. Tuổi tính theo tuổi "
           "mụ (năm âm lịch).", nam=nam, cc=cc, n=len(thuan), ds=ten(thuan) or L("nt.khong_co", "không có"))
    x["tra_loi_nhanh"] = tl
    tt = [v for v in d["ds"] if v["tam_tai"]]
    chi_tt = sorted({v["can_chi"].split()[1] for v in tt})
    x["hoi_dap"] = [
        {"hoi": L("nt.lnn.hd1", "Năm {nam} tuổi nào làm nhà được?", nam=nam), "dap": tl},
        {"hoi": L("nt.lnn.hd2", "Năm {nam} tuổi nào phạm Kim lâu?", nam=nam),
         "dap": L("nt.lnn.hd2_dap", "{ds}. Kim lâu tính theo tuổi mụ chia 9 dư 1, 3, 6, 8.",
                  ds=ten([v for v in x["ds"] if v["kim_lau"]]) or L("nt.khong_co_hoa", "Không có"))},
        {"hoi": L("nt.lnn.hd3", "Năm {nam} tuổi nào phạm Tam tai?", nam=nam),
         "dap": (L("nt.lnn.hd3_co", "Năm {chi} là năm Tam tai của các tuổi {ds}.", chi=_con(chi_n), ds=_cons(chi_tt)) if tt
                 else L("nt.lnn.hd3_khong", "Năm {chi} không có tuổi nào trong khoảng này phạm Tam tai.", chi=_con(chi_n)))},
        {"hoi": L("nt.lnn.hd4", "Năm {nam} tuổi nào cưới được?", nam=nam),
         "dap": L("nt.lnn.hd4_dap", "Với cưới hỏi, dân gian xét Kim lâu theo tuổi mụ của cô dâu. Các tuổi không phạm Kim lâu năm "
                  "{nam}: {ds}.", nam=nam, ds=ten([v for v in x["ds"] if not v["kim_lau"]]))},
    ]
    x["cach_tinh"] = L("nt.lnn.cach_tinh", d["cach_tinh"])
    x["han_nam"] = han_nam(d["han_nam"])
    return _meta(x, "dg")


# ------------------------------------------------------------------ xông đất
_RE_LD_NAM = re.compile(r"^tuổi (\S+) (.+) với năm$")
_RE_LD_CHU = re.compile(r"^(.+) với tuổi gia chủ$")
_RE_NT_NAM = re.compile(r"^Tuổi (.+) \(xung năm (\S+)\)$")
_RE_NT_CHU = re.compile(r"^Tuổi (.+) \(xung tuổi gia chủ (\S+)\)$")
_RE_NT_TT = re.compile(r"^Tuổi (.+) \(đang trong Tam tai năm (\S+)\)$")
_RE_GIO0 = re.compile(r"giờ hoàng đạo đầu tiên là ([^\s()]+) \(([^()]+)\)")


def _nguoc(muc: str) -> dict[str, str]:
    from app.luangiai import tuoi_dan_gian as tdg  # noqa: PLC0415
    return {v: k for k, v in tdg.KB[muc].items()}


def _ly_do(s: str) -> str:
    kb = _kb(_DAN_GIAN)
    if " — " in s:
        na, loi = s.split(" — ", 1)
        ma = _nguoc("nap_am").get(loi)
        return L("nt.xd.ly_na", "{na} — {loi}", na=_na(na), loi=(kb.get("nap_am") or {}).get(ma, loi)) if ma else s
    m = _RE_LD_NAM.match(s)
    if m:
        ma = _nguoc("quan_he_chi").get(m.group(2))
        return L("nt.xd.ly_nam", "tuổi {con} {q} với năm", con=_con(m.group(1)), q=(kb.get("quan_he_chi") or {}).get(ma, m.group(2)))
    m = _RE_LD_CHU.match(s)
    if m:
        ma = _nguoc("quan_he_chi").get(m.group(1))
        return L("nt.xd.ly_chu", "{q} với tuổi gia chủ", q=(kb.get("quan_he_chi") or {}).get(ma, m.group(1)))
    ma = _nguoc("can_voi_chu").get(s)
    return (kb.get("can_voi_chu") or {}).get(ma, s) if ma else s


def _ds_chi(s: str) -> list[str]:
    return [c.strip() for c in s.split(",")]


def _nen_tranh(s: str) -> str:
    m = _RE_NT_NAM.match(s)
    if m:
        return L("nt.xd.tranh_nam", "Tuổi {ds} (xung năm {chi})", ds=_cons(_ds_chi(m.group(1))), chi=_con(m.group(2)))
    m = _RE_NT_CHU.match(s)
    if m:
        return L("nt.xd.tranh_chu", "Tuổi {ds} (xung tuổi gia chủ {chi})", ds=_cons(_ds_chi(m.group(1))), chi=_con(m.group(2)))
    m = _RE_NT_TT.match(s)
    if m:
        return L("nt.xd.tranh_tt", "Tuổi {ds} (đang trong Tam tai năm {chi})", ds=_cons(_ds_chi(m.group(1))), chi=_con(m.group(2)))
    return s


def _mung_mot(m: dict) -> dict:
    m = dict(m)
    m["can_chi"] = _cc(m["can_chi"])
    if isinstance(m.get("huong"), dict):
        m["huong"] = {k: _huong(v) if isinstance(v, str) else v for k, v in m["huong"].items()}
    if "than" in m:
        m["than"] = lh.ten("than", m["than"])
    return m


def _gio(gs: list[dict]) -> str:
    return ", ".join(L("nt.xd.gio", "{chi} ({khung})", chi=_chi(g["chi"]), khung=g["khung"]) for g in gs)


def xong_dat(d: dict) -> dict:
    """`xong_dat_luan` (đầy đủ, công cụ) hoặc bản trang SEO (`trang_tuoi.xong_dat`: mùng 1 gọn, thêm `tet_toi`)."""
    if la_viet():
        return d
    x = copy.deepcopy(d)
    cc_n, cc_c = _cc(d["nam"]["can_chi"]), _cc(d["chu"]["can_chi"])
    x["nam"]["can_chi"], x["chu"]["can_chi"] = cc_n, cc_c
    for h in x["tuoi_hop"]:
        h["can_chi"] = _cc(h["can_chi"])
        h["ly_do"] = [_ly_do(s) for s in h["ly_do"]]
    x["nen_tranh"] = [_nen_tranh(s) for s in d["nen_tranh"]]
    m_nt = [_RE_NT_NAM.match(d["nen_tranh"][0]), _RE_NT_CHU.match(d["nen_tranh"][1]), _RE_NT_TT.match(d["nen_tranh"][2])]
    m1 = d["mung_mot"]
    tet = dt.date.fromisoformat(m1["ngay"])
    hop = x["tuoi_hop"]
    tl = L("nt.xd.tl_dau", "Gia chủ sinh năm {ns} ({cc_c}) đón Tết {cc_n} ", ns=d["chu"]["nam_sinh"], cc_c=cc_c, cc_n=cc_n)
    tl += (L("nt.xd.tl_hop", "có thể nhờ người tuổi {ds} xông đất.", ds=", ".join(f"{h['nam_sinh']} ({h['can_chi']})" for h in hop[:3]))
           if hop else L("nt.xd.tl_khong", "chưa thấy tuổi nào hợp đủ điều kiện trong khoảng 1960–2008, nên chọn người thân thuận hoà."))
    tl += L("nt.xd.tl_tranh", " Nên tránh tuổi {xn}, tuổi {xc} và các tuổi {tt} đang Tam tai.",
            xn=_cons(_ds_chi(m_nt[0].group(1))), xc=_cons(_ds_chi(m_nt[1].group(1))), tt=_cons(_ds_chi(m_nt[2].group(1))))
    # Giờ hoàng đạo đầu tiên: bản trang SEO bỏ danh sách giờ khỏi `mung_mot` → đọc lại từ câu bản Việt (cùng lượt tính).
    g = _RE_GIO0.search(d["tra_loi_nhanh"])
    if g:
        tl += L("nt.xd.tl_gio", " Mùng 1 Tết ({ngay}) giờ hoàng đạo đầu tiên là {gio}.", ngay=_ngay(tet),
                gio=_gio([{"chi": g.group(1), "khung": g.group(2)}]))
    x["tra_loi_nhanh"] = tl
    x["mung_mot"] = _mung_mot(m1)
    if d.get("cach_chon"):
        x["cach_chon"] = L("nt.xd.cach_chon", d["cach_chon"])
    for t in x.get("tet_toi") or []:
        t["can_chi"] = _cc(t["can_chi"])
        for h in t["tuoi"]:
            h["can_chi"] = _cc(h["can_chi"])
    return _meta(x, "dg")


def xong_dat_nam(d: dict) -> dict:
    if la_viet():
        return d
    x = copy.deepcopy(d)
    nam, cc = d["nam"]["nam"], _cc(d["nam"]["can_chi"])
    x["nam"]["can_chi"] = cc
    for y in x["ds"]:
        y["can_chi"] = _cc(y["can_chi"])
        for h in y["tuoi_hop"]:
            h["can_chi"] = _cc(h["can_chi"])
    x["nen_tranh"] = [_nen_tranh(s) for s in d["nen_tranh"]]
    mn, mt = _RE_NT_NAM.match(d["nen_tranh"][0]), _RE_NT_TT.match(d["nen_tranh"][1])
    xn, chi_n, tt = _cons(_ds_chi(mn.group(1))), _con(mn.group(2)), _cons(_ds_chi(mt.group(1)))
    m1 = d["mung_mot"]
    tet = _ngay(m1["ngay"])
    tl = L("nt.xdn.tra_loi", "Tết {cc} rơi vào ngày {ngay}. Người xông đất nên tránh tuổi {xn} (xung năm {chi}) và các tuổi {tt} "
           "(đang Tam tai). Tuổi hợp còn tuỳ tuổi gia chủ — bảng dưới ghi 3 tuổi hợp nhất cho từng năm sinh gia chủ 1960–2005.",
           cc=cc, ngay=tet, xn=xn, chi=chi_n, tt=tt)
    x["tra_loi_nhanh"] = tl
    x["hoi_dap"] = [
        {"hoi": L("nt.xdn.hd1", "Tết {nam} nên chọn tuổi nào xông đất?", nam=nam), "dap": tl},
        {"hoi": L("nt.xdn.hd2", "Mùng 1 Tết {nam} là ngày nào, giờ nào tốt?", nam=nam),
         "dap": L("nt.xdn.hd2_dap", "Mùng 1 Tết {cc} là {ngay}, ngày {cc_ngay}. Giờ hoàng đạo: {gio}.", cc=cc, ngay=tet,
                  cc_ngay=_cc(m1["can_chi"]), gio=_gio(m1["gio_hoang_dao"]))},
        {"hoi": L("nt.xdn.hd3", "Tết {nam} tránh tuổi nào xông đất?", nam=nam),
         "dap": L("nt.xdn.hd3_dap", "Tuổi {xn} (xung năm {chi}); các tuổi {tt} đang Tam tai; tuổi xung với gia chủ.", xn=xn, chi=chi_n, tt=tt)},
    ]
    x["mung_mot"] = _mung_mot(m1)
    return _meta(x, "dg")


# ------------------------------------------------------------------ sao hạn
def sao_han(d: dict) -> dict:
    """`sao_han_luan` (công cụ, một người)."""
    if la_viet():
        return d
    x = copy.deepcopy(d)
    x["nam"]["can_chi"] = _cc(d["nam"]["can_chi"])
    x["nguoi"]["can_chi"] = _cc(d["nguoi"]["can_chi"])
    x["sao"] = _sao_o(d["sao"], "sao")
    x["han"] = _sao_o(d["han"], "han")
    x["kim_lau"] = kim_lau(d["kim_lau"])
    nam, tuoi = d["nam"]["nam"], d["tuoi_mu"]
    if x["sao"]:
        tl = L("nt.sh.tra_loi", "Theo tục xếp theo tuổi, {gioi} {tuoi} tuổi mụ (sinh {ns}, {cc_s}) năm {nam} ({cc_n}) gặp sao {sao}{han}. "
               "{nghia} Đó là tập quán, không tính từ lá số bạn.",
               gioi=L("nt.sh.nam", "nam") if d["nguoi"]["gioi_tinh"] == "nam" else L("nt.sh.nu", "nữ"), tuoi=tuoi,
               ns=d["nguoi"]["nam_sinh"], cc_s=x["nguoi"]["can_chi"], nam=nam, cc_n=x["nam"]["can_chi"], sao=x["sao"]["ten"],
               han=L("nt.sh.han", ", hạn {han}", han=x["han"]["ten"]) if x["han"] else "", nghia=x["sao"]["nghia"])
    else:
        tl = L("nt.sh.duoi_10", "Dưới 10 tuổi dân gian không xếp sao hạn; tuổi mụ năm {nam} là {tuoi}.", nam=nam, tuoi=tuoi)
    x["tra_loi_nhanh"] = tl
    x["hoi_dap"] = _hoi_dap_sh(d["hoi_dap"])
    return _meta(x, "sh")


def _hoi_dap_sh(vi: list[dict]) -> list[dict]:
    en = _kb(_SH).get("hoi_dap")
    return [dict(h) for h in en] if isinstance(en, list) and len(en) == len(vi) else vi


def sao_han_nam(d: dict) -> dict:
    if la_viet():
        return d
    x = copy.deepcopy(d)
    x["can_chi"] = _cc(d["can_chi"])
    for y in x["ds"]:
        y["can_chi"] = _cc(y["can_chi"])
        for k in ("nam", "nu", "han_nam", "han_nu"):
            y[k] = sao_han_ten(y[k])
    x["sao"] = [_sao_o(o, "sao") for o in d["sao"]]
    x["han"] = [_sao_o(o, "han") for o in d["han"]]
    x["tra_loi_nhanh"] = L("nt.shn.tra_loi", "Năm {nam} ({cc}) sao hạn xếp theo tuổi mụ và giới tính: bảng dưới ghi sao của từng tuổi "
                           "sinh 1960–2005 cho nam và nữ. Đây là tập quán giống nhau cho mọi người cùng tuổi, không tính từ lá số riêng.",
                           nam=d["nam"], cc=x["can_chi"])
    x["hoi_dap"] = _hoi_dap_sh(d["hoi_dap"])
    return _meta(x, "sh")


# ------------------------------------------------------------------ trang năm
_MOC = {
    "lap_xuan": "Lập xuân (năm tiết khí bắt đầu)", "tet": "Mùng 1 Tết Nguyên đán", "ram_gieng": "Rằm tháng Giêng",
    "gio_to": "Giỗ Tổ Hùng Vương (10/3 âm)", "doan_ngo": "Tết Đoan ngọ (5/5 âm)", "vu_lan": "Rằm tháng Bảy · Vu Lan",
    "trung_thu": "Tết Trung thu (15/8 âm)", "ong_tao": "Ông Công ông Táo (23 tháng Chạp)",
}


def tong_quan(d: dict) -> dict:
    if la_viet():
        return d
    x = copy.deepcopy(d)
    kb = _kb(_NAM)
    nam = d["nam"]
    chi = d["can_chi"].split()[1]
    cc = _cc(d["can_chi"])
    x["can_chi"] = cc
    x["nam_truoc_tet"]["can_chi"] = _cc(d["nam_truoc_tet"]["can_chi"])
    for k in ("con_giap", "nam_tuoi", "xung"):
        x[k] = _con(d[k])
    x["tam_tai"]["tuoi"] = [_con(c) for c in d["tam_tai"]["tuoi"]]
    x["tuoi_hop"] = [_con(c) for c in d["tuoi_hop"]]
    qh = kb.get("quan_he_nam") or {}
    for r in x["bang_con_giap"]:
        o = qh.get(r["quan_he"]) or {}
        r["nhan"], r["loi"] = o.get("nhan", r["nhan"]), o.get("loi", r["loi"])
        if r.get("loi_tam_tai"):
            r["loi_tam_tai"] = kb.get("tam_tai_loi", r["loi_tam_tai"]).replace("{nam_thu}", str(r["tam_tai"]))
    for m in x["moc"]:
        if m["ma"] == "giao_thua_don":
            m["ten"] = L("nt.moc.giao_thua_don", "Đêm Giao thừa đón Tết {nam}", nam=nam)
        elif m["ma"] == "giao_thua":
            m["ten"] = L("nt.moc.giao_thua", "Đêm Giao thừa cuối năm, đón Tết {nam}", nam=nam + 1)
        else:
            m["ten"] = L(f"nt.moc.{m['ma']}", _MOC.get(m["ma"], m["ten"]))
    x["han_nam"] = han_nam(d["han_nam"])
    na = d["nap_am"]
    tet, het, lx = _ngay(d["tet"]), _ngay(d["het_nam"]), _ngay(d["lap_xuan"])
    nh = d["thang_nhuan"]
    tt, ntt = _cons(d["tam_tai"]["tuoi"]), d["tam_tai"]["nam_thu"]
    tl = L("nt.nam.tra_loi", "Năm {nam} là năm {cc}, năm con {con}, mệnh {na} — hành {hanh}. Tết Nguyên đán rơi vào ngày {tet}; năm âm "
           "lịch kéo dài tới {het}{nhuan} Tuổi {con} gặp năm tuổi, tuổi {xung} xung năm; các tuổi {tt} ở năm Tam tai thứ {n}.",
           nam=nam, cc=cc, con=_con(chi), na=_na(na["ten"]), hanh=_hanh(na["hanh"]), tet=tet, het=het,
           nhuan=(L("nt.nam.nhuan", ", có tháng {n} nhuận.", n=nh) if nh else L("nt.nam.khong_nhuan", ", không có tháng nhuận.")),
           xung=_con(d["xung"]), tt=tt, n=ntt)
    x["tra_loi_nhanh"] = tl
    x["hoi_dap"] = [
        {"hoi": L("nt.nam.hd1", "Năm {nam} là năm con gì?", nam=nam),
         "dap": L("nt.nam.hd1_dap", "Năm {nam} là năm {cc}, năm con {con}, tính từ Tết Nguyên đán {tet} đến {het}. Người sinh trước Tết "
                  "({tet}) vẫn thuộc năm {cc_t}.", nam=nam, cc=cc, con=_con(chi), tet=tet, het=het, cc_t=x["nam_truoc_tet"]["can_chi"])},
        {"hoi": L("nt.nam.hd2", "Năm {nam} mệnh gì?", nam=nam),
         "dap": L("nt.nam.hd2_dap", "Mệnh nạp âm của năm {cc} là {na} ({han}), hành {hanh}. Mệnh này dùng chung cho mọi người sinh "
                  "trong năm âm lịch {nam}.", cc=cc, na=_na(na["ten"]), han=na["han"], hanh=_hanh(na["hanh"]), nam=nam)},
        {"hoi": L("nt.nam.hd3", "Tết {nam} là ngày nào?", nam=nam),
         "dap": L("nt.nam.hd3_dap", "Mùng 1 Tết {cc} là ngày {tet} dương lịch theo âm lịch Việt Nam. Lập xuân (mốc năm của Bát tự, "
                  "Bát trạch) là {lx}.", cc=cc, tet=tet, lx=lx)},
        {"hoi": L("nt.nam.hd4", "Năm {nam} tuổi nào phạm Tam tai?", nam=nam),
         "dap": L("nt.nam.hd4_dap", "Các tuổi {tt} — năm {con} là năm thứ {n} trong ba năm Tam tai của nhóm này. Đây là tập quán để "
                  "tham khảo khi làm việc lớn.", tt=tt, con=_con(chi), n=ntt)},
        {"hoi": L("nt.nam.hd5", "Năm {nam} tuổi nào hợp, tuổi nào xung?", nam=nam),
         "dap": L("nt.nam.hd5_dap", "Theo địa chi, tuổi {hop} tam hợp hoặc lục hợp với năm {con}; tuổi {xung} xung năm; tuổi {con} gặp "
                  "năm tuổi. Đây là quan niệm dân gian, không định sẵn chuyện tốt xấu.",
                  hop=_cons(d["tuoi_hop"]), con=_con(chi), xung=_con(d["xung"]))},
        {"hoi": L("nt.nam.hd6", "Năm {nam} có tháng nhuận không?", nam=nam),
         "dap": (L("nt.nam.hd6_co", "Có, năm âm lịch {nam} nhuận tháng {n}, cả năm 13 tháng.", nam=nam, n=nh) if nh
                 else L("nt.nam.hd6_khong", "Không, năm âm lịch {nam} có 12 tháng.", nam=nam))},
    ]
    return _meta(x, "nam")


def _nap_am_ma(q: str) -> str:
    """Quan hệ mệnh nạp âm (chữ Việt của `calc.can_chi.sinh_khac`) → mã ASCII ở bản ngôn ngữ khác."""
    return {"sinh": "sinh", "bị sinh": "bi_sinh", "khắc": "khac", "bị khắc": "bi_khac", "bình hoà": "binh_hoa"}.get(q, q)


def sinh_con(d: dict) -> dict:
    if la_viet():
        return d
    x = copy.deepcopy(d)
    k = _kb(_NAM).get("sinh_con") or {}
    nam = d["nam"]
    chi = d["con"]["can_chi"].split()[1]
    x["con"]["can_chi"] = _cc(d["con"]["can_chi"])
    x["truoc_tet"]["can_chi"] = _cc(d["truoc_tet"]["can_chi"])
    x["chi_hop"] = [_con(c) for c in d["chi_hop"]]
    x["chi_xung"] = _con(d["chi_xung"])
    for y, g in zip(x["ds"], d["ds"]):
        y["can_chi"] = _cc(g["can_chi"])
        y["chi_nhan"] = (k.get("chi") or {}).get(g["chi_quan_he"], g["chi_nhan"])
        y["nap_am_nhan"] = (k.get("nap_am") or {}).get(g["nap_am_quan_he"], g["nap_am_nhan"])
        y["nap_am_quan_he"] = _nap_am_ma(g["nap_am_quan_he"])
        y["nhom_nhan"] = (k.get("nhom") or {}).get(g["nhom"], g["nhom_nhan"])
    x["loi_nhom"] = {m: (k.get("loi_nhom") or {}).get(m, v) for m, v in d["loi_nhom"].items()}
    x["ranh_gioi"] = k.get("ranh_gioi", d["ranh_gioi"])
    tet = _ngay(d["con"]["tu"])
    con, cc, cc_t = _con(chi), x["con"]["can_chi"], x["truoc_tet"]["can_chi"]
    hop, xung = _cons(d["chi_hop"]), _con(d["chi_xung"])
    x["tra_loi_nhanh"] = L(
        "nt.sc.tra_loi", "Con sinh từ Tết {tet} đến hết năm âm lịch {nam} tuổi {cc}, mệnh {na}. Theo địa chi, bố mẹ tuổi {hop} được dân "
        "gian xem là hợp với tuổi con; tuổi {xung} xung tuổi con. Con sinh trước Tết thuộc năm {cc_t}. Đây là tập quán tham khảo — "
        "sức khoẻ của mẹ và lời khuyên của bác sĩ đi trước con giáp.",
        tet=tet, nam=nam, cc=cc, con=con, na=_na(d["con"]["nap_am"]), hop=hop, xung=xung, cc_t=cc_t)
    x["hoi_dap"] = [
        {"hoi": L("nt.sc.hd1", "Sinh con năm {nam} hợp tuổi bố mẹ nào?", nam=nam),
         "dap": L("nt.sc.hd1_dap", "Theo tam hợp, lục hợp của địa chi: bố mẹ tuổi {hop} hợp với tuổi {con} của con. Bảng trên trang ghi "
                  "từng năm sinh của bố mẹ kèm quan hệ mệnh nạp âm.", hop=hop, con=con)},
        {"hoi": L("nt.sc.hd2", "Bố mẹ tuổi {xung} sinh con năm {nam} có sao không?", xung=xung, nam=nam),
         "dap": L("nt.sc.hd2_dap", "Tuổi {xung} xung với tuổi {con} theo địa chi — dân gian hay nhắc cân nhắc. Đây chỉ là quan niệm; "
                  "tình thương và cách nuôi dạy mới quyết định sự hoà hợp trong nhà.", xung=xung, con=con)},
        {"hoi": L("nt.sc.hd3", "Sinh con năm {nam} mệnh gì?", nam=nam),
         "dap": L("nt.sc.hd3_dap", "Con sinh từ {tet} mệnh {na} (hành {hanh}); sinh trước Tết thuộc năm {cc_t}, mệnh {na_t}.",
                  tet=tet, na=_na(d["con"]["nap_am"]), hanh=_hanh(d["con"]["hanh"]), cc_t=cc_t, na_t=_na(d["truoc_tet"]["nap_am"]))},
        {"hoi": L("nt.sc.hd4", "Có nên chọn ngày sinh mổ cho con đúng tuổi đẹp?"), "dap": x["ranh_gioi"]},
    ]
    return _meta(x, "nam")


def cuoi_hoi(d: dict) -> dict:
    if la_viet():
        return d
    x = copy.deepcopy(d)
    k = _kb(_NAM).get("cuoi_hoi") or {}
    nam, cc = d["nam"], _cc(d["can_chi"])
    x["can_chi"] = cc
    for y in x["ds"]:
        y["can_chi"] = _cc(y["can_chi"])
        y["kim_lau"] = kim_lau(y["kim_lau"])
    for f in ("cach_tinh", "muon_tuoi", "ranh_gioi"):
        x[f] = k.get(f, d[f])
    duoc = [y for y in x["ds"] if y["duoc"]]
    pham = [y for y in x["ds"] if not y["duoc"]]
    ten = ", ".join(str(y["nam_sinh"]) for y in duoc)
    x["tra_loi_nhanh"] = L("nt.ch.tra_loi", "Năm {nam} ({cc}), xét Kim lâu theo tuổi mụ của cô dâu: cô dâu sinh {ds} không phạm Kim "
                           "lâu. Tuổi tính theo năm âm lịch (sinh trước Tết thuộc năm trước).", nam=nam, cc=cc, ds=ten)
    x["hoi_dap"] = [
        {"hoi": L("nt.ch.hd1", "Năm {nam} tuổi nào cưới được?", nam=nam),
         "dap": L("nt.ch.hd1_dap", "Cô dâu sinh các năm {ds} không phạm Kim lâu năm {nam}.", ds=ten, nam=nam)},
        {"hoi": L("nt.ch.hd2", "Năm {nam} tuổi nào phạm Kim lâu khi cưới?", nam=nam),
         "dap": "; ".join(L("nt.ch.pham", "{ns} ({tuoi} tuổi mụ, {kl})", ns=y["nam_sinh"], tuoi=y["tuoi_mu"], kl=y["kim_lau"])
                          for y in pham) + "."},
        {"hoi": L("nt.ch.hd3", "Kim lâu cưới tính theo tuổi ai?"), "dap": x["cach_tinh"]},
        {"hoi": L("nt.ch.hd4", "Phạm Kim lâu thì có cưới được không?"), "dap": x["muon_tuoi"] + " " + x["ranh_gioi"]},
    ]
    return _meta(x, "nam")


# ------------------------------------------------------------------ Tử vi năm theo tuổi
_TEN_CHI = {"tam_hop": "tam hợp", "luc_hop": "lục hợp", "trung": "năm tuổi", "xung": "xung", "hinh": "hình", "hai": "hại"}
_TEN_CHI_NGUOC = {v: k for k, v in _TEN_CHI.items()}


def _qh_chi(ma: str | None) -> str:
    return L(f"nt.qh.{ma or 'binh'}", _TEN_CHI.get(ma or "", "không hợp không xung"))


def _diem_nhan(x: dict, d: dict) -> None:
    from app.calc import can_chi as cc_calc  # noqa: PLC0415 — tra bảng nạp âm (cùng hàm bản Việt), không tính mới
    k = _kb(_NAM).get("theo_tuoi") or {}
    can_n, chi_n = d["can_chi_nam"].split()
    can_s, chi_s = d["nguoi"]["can_chi"].split()
    q = d["quan_he"]
    hn, hs = cc_calc.nap_am(can_n, chi_n)["hanh"], d["nguoi"]["hanh"]
    tuoi = d["tuoi_mu"]
    for o, g in zip(x["diem_nhan"], d["diem_nhan"]):
        cu, td = g["can_cu"], g["tieu_de"]
        if cu.startswith("Địa chi"):
            qc = q["chi"]
            o["tieu_de"] = L(f"nt.tt.chi.{qc}", td, s=_con(chi_s), n=_con(chi_n))
            o["noi_dung"] = (k.get("chi") or {}).get(qc, g["noi_dung"])
            o["can_cu"] = L("nt.tt.cu_chi", "Địa chi: tuổi {s} – năm {n}", s=_con(chi_s), n=_con(chi_n))
        elif cu.startswith("Thiên can"):
            from app.calc import tuoi_dan_gian as t  # noqa: PLC0415
            o["tieu_de"] = (L("nt.tt.can_trung", td, can=_ten.ten("can", can_n)) if can_n == can_s else
                            L("nt.tt.can", td, can_n=_ten.ten("can", can_n), can_s=_ten.ten("can", can_s),
                              rel=(k.get("ten_can") or {}).get(q["can"], q["can"])))
            o["noi_dung"] = (k.get("can") or {}).get(q["can"], g["noi_dung"])
            o["can_cu"] = L("nt.tt.cu_can", cu, can_n=_ten.ten("can", can_n), h_n=_hanh(t.HANH_CAN[can_n]),
                            can_s=_ten.ten("can", can_s), h_s=_hanh(t.HANH_CAN[can_s]))
        elif cu.startswith("Nạp âm"):
            qn = q["nap_am"]
            o["tieu_de"] = L(f"nt.tt.na.{_nap_am_ma(qn)}", td, hn=_hanh(hn), hs=_hanh(hs))
            o["noi_dung"] = (k.get("nap_am") or {}).get(qn, g["noi_dung"])
            o["can_cu"] = L("nt.tt.cu_na", cu, na_n=_na(d["nap_am_nam"]), na_s=_na(d["nguoi"]["nap_am"]))
        elif cu.startswith("Tam tai"):
            ds = cu.split(": năm ", 1)[1].split(", ")
            o["tieu_de"] = L("nt.tt.tam_tai", td, n=d["tam_tai"])
            o["noi_dung"] = _kb(_NAM).get("tam_tai_loi", g["noi_dung"]).replace("{nam_thu}", str(d["tam_tai"]))
            o["can_cu"] = L("nt.tt.cu_tt", cu, s=_con(chi_s), ds=_cons(ds))
        elif cu.startswith("Tuổi mụ"):
            co_kl = bool(d.get("kim_lau"))
            con = [xau(v) for v in d["lam_nha"]["xau"] if not v.startswith("Tam tai")]
            o["tieu_de"] = L("nt.tt.ln_kl", td) if co_kl else L("nt.tt.ln", td)
            o["noi_dung"] = (L("nt.tt.ln_nd", g["noi_dung"], tuoi=tuoi, ds=danh_sach(con))
                             + (L("nt.tt.ln_nd_kl", " Với cưới hỏi, Kim lâu chỉ xét tuổi cô dâu.") if co_kl
                                else L("nt.tt.ln_nd_ho", " Hoang ốc chỉ xét khi làm nhà, không xét cưới hỏi.")))
            o["can_cu"] = L("nt.tt.cu_ln", cu, tuoi=tuoi)
        elif cu.startswith("Cửu Diệu"):
            o["tieu_de"] = L("nt.tt.sao", td, nam=sao_han_ten(d["sao"]["nam"]["ten"]), nu=sao_han_ten(d["sao"]["nu"]["ten"]))
            o["noi_dung"] = L("nt.tt.sao_nd", g["noi_dung"])
            o["can_cu"] = L("nt.tt.cu_sao", cu, tuoi=tuoi)


def theo_tuoi(d: dict) -> dict:
    """`nam_tong_quan.theo_tuoi` (đầy đủ) hoặc bản trang SEO (`trang_tuoi.nam_tuoi`: sao gọn, tứ hoá gọn, thêm `nam_toi`)."""
    if la_viet():
        return d
    x = copy.deepcopy(d)
    k = _kb(_NAM).get("theo_tuoi") or {}
    nam, ns, tuoi = d["nam"], d["nguoi"]["nam_sinh"], d["tuoi_mu"]
    can_n = d["can_chi_nam"].split()[0]
    chi_s = d["nguoi"]["can_chi"].split()[1]
    cc_n, cc_s = _cc(d["can_chi_nam"]), _cc(d["nguoi"]["can_chi"])
    x["can_chi_nam"], x["nguoi"]["can_chi"] = cc_n, cc_s
    x["nap_am_nam"] = _na(d["nap_am_nam"])
    x["quan_he"]["nap_am"] = _nap_am_ma(d["quan_he"]["nap_am"])
    _diem_nhan(x, d)
    x["sao"] = {g: _sao_o(o, "sao") for g, o in d["sao"].items()}
    x["kim_lau"] = kim_lau(d["kim_lau"])
    x["lam_nha"]["xau"] = [xau(v) for v in d["lam_nha"]["xau"]]
    x["lam_nha"]["hoang_oc"] = hoang_oc(d["lam_nha"]["hoang_oc"])
    th = _kb("tuvi_kb.json").get("tu_hoa") or {}
    for h in x["tu_hoa"]:
        if "y_nghia" in h:
            h["y_nghia"] = (th.get(h["hoa"]) or {}).get("y_nghia", h["y_nghia"])
    x["tu_hoa_loi"] = k.get("tu_hoa", d["tu_hoa_loi"]).replace("{can_chi}", cc_n)
    x["ranh_gioi"] = k.get("ranh_gioi", d["ranh_gioi"])
    for y in x.get("nam_toi") or []:
        y["can_chi"] = _cc(y["can_chi"])
        y["dia_chi"] = _qh_chi(_TEN_CHI_NGUOC.get(y["dia_chi"])) if y.get("dia_chi") else y.get("dia_chi")
        y["kim_lau"] = kim_lau(y["kim_lau"])
        y["sao_nam"], y["sao_nu"] = sao_han_ten(y["sao_nam"]), sao_han_ten(y["sao_nu"])
    sao = x["sao"]
    thuan = [o["tieu_de"] for o in x["diem_nhan"] if o["loai"] == "thuan"]
    luu_y = [o["tieu_de"] for o in x["diem_nhan"] if o["loai"] == "luu_y"]
    thuong = lambda s: s[:1].lower() + s[1:]  # noqa: E731
    phan = [L("nt.tt.tl_dau", "Năm {nam} ({cc_n}), người tuổi {cc_s} sinh {ns} (mệnh {na}) bước vào tuổi mụ {tuoi}.",
              nam=nam, cc_n=cc_n, cc_s=cc_s, ns=ns, na=_na(d["nguoi"]["nap_am"]), tuoi=tuoi)]
    if thuan:
        phan.append(L("nt.tt.tl_thuan", "Điểm thuận: {x}.", x=thuong(thuan[0])))
    if luu_y:
        phan.append(L("nt.tt.tl_luu_y", "Điều nên để ý: {x}.", x="; ".join(thuong(v) for v in luu_y[:3])))
    if sao["nam"]:
        phan.append(L("nt.tt.tl_sao", "Sao theo tục: nam {nam}, nữ {nu}.", nam=sao["nam"]["ten"], nu=sao["nu"]["ten"]))
    x["tra_loi_nhanh"] = " ".join(phan)
    lam = d["lam_nha"]
    tt, kl = d["tam_tai"], d["kim_lau"]
    hd = [
        {"hoi": L("nt.tt.hd1", "Tuổi {cc} năm {nam} sao gì chiếu mệnh?", cc=cc_s, nam=nam),
         "dap": (L("nt.tt.hd1_dap", "Theo tục xếp theo tuổi mụ {tuoi}: nam mạng sao {sn} (hạn {hn}), nữ mạng sao {sf} (hạn {hf}). "
                   "Mỗi sao đọc bằng việc nên làm trên trang, không cần nghi lễ gì.", tuoi=tuoi, sn=sao["nam"]["ten"],
                   hn=sao["nam"]["han"], sf=sao["nu"]["ten"], hf=sao["nu"]["han"]) if sao["nam"]
                 else L("nt.tt.hd1_duoi", "Dưới 10 tuổi mụ, dân gian không xếp sao hạn."))},
        {"hoi": L("nt.tt.hd2", "Tuổi {cc} năm {nam} có phạm Tam tai, Kim lâu không?", cc=cc_s, nam=nam),
         "dap": (L("nt.tt.hd2_tt", "Có, năm thứ {n} của Tam tai", n=tt) if tt else L("nt.tt.hd2_khong_tt", "Không phạm Tam tai"))
                + L("nt.tt.hd2_kl", "; {kl} (tuổi mụ {tuoi}). ",
                    kl=(L("nt.tt.hd2_kl_co", "phạm {kl}", kl=kim_lau(kl)) if kl else L("nt.tt.hd2_kl_khong", "không phạm Kim lâu")), tuoi=tuoi)
                + (L("nt.tt.hd2_ln_thuan", "Làm nhà năm {nam}: thuận theo tập quán.", nam=nam) if not lam["xau"] else
                   L("nt.tt.hd2_ln_xau", "Làm nhà năm {nam}: dân gian thường cân nhắc ({ds}).", nam=nam,
                     ds=", ".join(xau(v) for v in lam["xau"])))},
        {"hoi": L("nt.tt.hd3", "Tuổi {cc_s} hợp, kỵ gì với năm {cc_n}?", cc_s=cc_s, cc_n=cc_n),
         "dap": L("nt.tt.hd3_dap", "Địa chi: tuổi {s} – năm {n}: {chi}. Thiên can {can_n}–{can_s}: {can}. Nạp âm {na_n} – {na_s}: {na}. "
                  "Đây là quan niệm dân gian, không định sẵn chuyện tốt xấu.", s=_con(chi_s), n=_con(d["can_chi_nam"].split()[1]),
                  chi=_qh_chi(d["quan_he"]["chi"] if d["quan_he"]["chi"] != "binh" else None),
                  can_n=_ten.ten("can", can_n), can_s=_ten.ten("can", d["nguoi"]["can_chi"].split()[0]),
                  can=(k.get("ten_can") or {}).get(d["quan_he"]["can"], d["quan_he"]["can"]),
                  na_n=_na(d["nap_am_nam"]), na_s=_na(d["nguoi"]["nap_am"]),
                  na=L(f"nt.tt.na_rel.{_nap_am_ma(d['quan_he']['nap_am'])}", d["quan_he"]["nap_am"]))},
        {"hoi": L("nt.tt.hd4", "Phần đọc theo tuổi khác gì lá số riêng?"), "dap": x["ranh_gioi"]},
        {"hoi": L("nt.tt.hd5", "Tuổi {cc} {ns} năm {nam} tuổi mụ bao nhiêu?", cc=cc_s, ns=ns, nam=nam),
         "dap": L("nt.tt.hd5_dap", "Tuổi mụ {tuoi} (năm {nam} − năm sinh âm lịch {ns} + 1). Sinh tháng 1 hoặc đầu tháng 2 trước Tết thì "
                  "tính theo năm âm lịch trước đó.", tuoi=tuoi, nam=nam, ns=ns)},
    ]
    if len(d["hoi_dap"]) < len(hd):   # bản trang SEO bỏ câu lặp nguyên câu rào chung
        hd = [h for h in hd if h["dap"] != x["ranh_gioi"]]
    x["hoi_dap"] = hd
    return _meta(x, "nam")
