# -*- coding: utf-8 -*-
"""EN-ALL GĐ 4 — lớp HIỂN THỊ theo ngôn ngữ cho lá số Tử vi (an sao, Tuần/Triệt, vận hạn, lưu nguyệt) — RULES đọc kết
quả CALC, không tính lại (mẫu: `battu_hien.py`).

CALC (`tuvi_an_sao` / iztro vi-VN, `tuan_triet_vendor`, `tuvi_luu_nguyet`) không đọc ngôn ngữ và trả vài CHUỖI tiếng
Việt (nhãn giờ, tứ trụ, quan hệ Mệnh–Cục, kiểu Tuần/Triệt, cách tính lưu nguyệt…). Bản Việt giữ nguyên (các hàm ở đây chỉ
được gọi khi lượt gọi KHÔNG phải tiếng Việt). Bản ngôn ngữ khác: dựng lại câu bằng mẫu `L()` từ MÃ có trong chính kết quả —
không đổi số, mã, độ dài danh sách. Tên riêng (sao, cung, can, chi, độ sáng, hoá) giữ giá trị mã; tên hiển thị đi qua
`ten_hien` (kb/ten.KHOA_MA). Chuỗi ghép từ nhiều tên (tứ trụ, can chi năm) là chữ hiển thị → đổi thẳng sang tên Anh.
"""
from __future__ import annotations

import copy
import re

from app.calc import can_chi as _cc
from app.kb import ten as _ten
from app.kb.loi import L
from app.luangiai.battu_hien import _ma as ma  # noqa: F401 — mã ASCII từ tên Việt (khoá mẫu câu theo cung / hoá)

# ------------------------------------------------------------------ tên ghép


def ten_sao(x: str) -> str:
    """Tên một sao (chính / phụ / tạp diệu / sao lưu, "Hoá Lộc"…) theo ngôn ngữ."""
    if x.startswith(("Hoá ", "Hóa ")) and _ten.muc("hoa", x[4:]):
        return L("tuvi_ls.hoa_sao", x, hoa=_ten.ten("hoa", x[4:]))
    return _ten.sao_luu(x) if x.startswith(("Lưu ", "Vận ")) else _ten.ten("sao", x)


def ten_cung(x: str) -> str:
    return _ten.ten("cung", x)


def can_chi(s: str) -> str:
    """"Mậu Thìn" → "Wu Chen" (mỗi chữ là can hoặc chi)."""
    ra = []
    for t in s.split():
        ra.append(_ten.ten("can", t) if _ten.muc("can", t) else _ten.ten("chi", t))
    return " ".join(ra)


def tu_tru(s: str) -> str:
    return " - ".join(can_chi(x) for x in s.split(" - "))


def ds_ten(xs: list[str]) -> str:
    return L("tuvi_ls.noi", ", ").join(ten_sao(x) for x in xs)


# ------------------------------------------------------------------ an sao

_MENH_CUC = {"Cục sinh Mệnh": "cuc_sinh_menh", "Mệnh sinh Cục": "menh_sinh_cuc", "Mệnh khắc Cục": "menh_khac_cuc",
             "Cục khắc Mệnh": "cuc_khac_menh", "Mệnh Cục bình hoà": "binh_hoa"}


def gio(ti: int, vi: str) -> str:
    if ti == 0:
        return L("tuvi_ls.gio.ty_som", vi)
    if ti == 12:
        return L("tuvi_ls.gio.ty_muon", vi)
    return L("tuvi_ls.gio", vi, chi=_ten.ten("chi", _cc.CHI[ti % 12]))


def menh_cuc(s: str) -> str:
    ma = _MENH_CUC.get(s)
    return L(f"tuvi_ls.menh_cuc.{ma}", s) if ma else s


def am_duong(ad: dict) -> dict:
    nam = ad.get("nam_sinh", "")
    gioi = "nam" if ad.get("nhan", "").endswith("Nam") else "nu"
    return {**ad, "nhan": L("tuvi_ls.am_duong.nhan", ad.get("nhan", ""), am=_ten.ten("am_duong", nam),
                           gioi=L(f"tuvi_ls.gioi.{gioi}", gioi)),
            "ly": L(f"tuvi_ls.am_duong.ly.{'thuan' if ad.get('ly') == 'thuận' else 'nghich'}", ad.get("ly", ""))}


def la_so(d: dict) -> dict:
    """Kết quả `/v1/tuvi/an-sao` (đã dựng xong ở bản Việt) → chữ theo ngôn ngữ lượt gọi."""
    d = copy.copy(d)
    if isinstance(d.get("gio"), str):
        d["gio"] = gio(d.get("gio_chi_so", -1), d["gio"])
    if isinstance(d.get("tu_tru"), str):
        d["tu_tru"] = tu_tru(d["tu_tru"])
    if isinstance(d.get("am_duong"), dict):
        d["am_duong"] = am_duong(d["am_duong"])
    if isinstance(d.get("menh_cuc"), str):
        d["menh_cuc"] = menh_cuc(d["menh_cuc"])
    return d


def du_kien(ds: list[dict] | None) -> list[dict] | None:
    """Dữ kiện điều kiện cách cục (`tuvi_cach_cuc.nhan_dien(...)[i]["du_kien"]`) với TÊN đã đổi theo ngôn ngữ (để mẫu
    câu `dieu_kien_mau` của bản phủ KB ghép ra chữ đúng ngôn ngữ). `muc` giữ nguyên — là khoá tra mẫu."""
    if not ds:
        return ds
    ra = []
    for f in ds:
        g = dict(f)
        if g.get("sao"):
            g["sao"] = ten_sao(g["sao"])
        if g.get("hoa"):
            g["hoa"] = _ten.ten("hoa", g["hoa"])
        if g.get("cung"):
            g["cung"] = ten_cung(g["cung"])
        if g.get("chi"):
            g["chi"] = _ten.ten("chi", g["chi"])
        if g.get("ds"):
            g["ds"] = [ten_sao(x) for x in g["ds"]]
        ra.append(g)
    return ra


_MUC_DK = {"Miếu": "muc.mieu", "Vượng": "muc.vuong", "Đắc": "muc.dac"}


def dieu_kien_dat(ds: list[dict] | None) -> list[dict]:
    """Như `tuvi_kb.dieu_kien_dat` (cùng thứ tự, cùng luật bỏ câu trùng — quyết định theo câu bản Việt) nhưng chữ theo
    mẫu `L()` của ngôn ngữ lượt gọi và tên riêng theo bảng tên. Mẫu bản Việt: `tuvi_cach_cuc.json` → `dieu_kien_mau`."""
    from app.kb import tuvi_kb  # noqa: PLC0415
    with _ngon_ngu_viet():
        mau_vi = tuvi_kb._cc()["dieu_kien_mau"]                   # noqa: SLF001 — chữ Việt: khoá bỏ trùng + chữ dự phòng
    ra, da = [], set()
    for loai in ("can", "tang", "giam"):
        for f in ds or []:
            if f.get("loai") != loai:
                continue
            vi = tuvi_kb._chu_dieu_kien(f, mau_vi)                  # noqa: SLF001
            if not vi or vi in da:
                continue
            da.add(vi)
            ra.append({"loai": loai, "noi_dung": _chu_dk(f, mau_vi)})
    return ra


def _ngon_ngu_viet():
    from app import ngon_ngu  # noqa: PLC0415
    return ngon_ngu.dung(ngon_ngu.MAC_DINH)


def _chu_dk(f: dict, mau_vi: dict) -> str:
    g = (du_kien([f]) or [f])[0]
    ds = L("tuvi_ls.noi", ", ").join(g.get("ds", []))
    k = g["kieu"]
    if k == "sao":
        nhan = L("tuvi_ls.dk.sao_hoa", mau_vi["sao_hoa"], sao=g["sao"], hoa=g.get("hoa", "")) if g.get("hoa") else g["sao"]
        return L(f"tuvi_ls.dk.vi_tri_{g['vi_tri']}", mau_vi.get(f"vi_tri_{g['vi_tri']}", ""), nhan=nhan,
                 cung=g.get("cung", ""), chi=g.get("chi", ""))
    if k == "sang":
        muc = L(f"tuvi_ls.dk.{_MUC_DK[f['muc']]}", f["muc"]) if f["muc"] in _MUC_DK else _ten.ten("do_sang", f["muc"]).lower()
        return L("tuvi_ls.dk.sang", mau_vi["sang"], sao=g["sao"], chi=g["chi"], muc=muc)
    return L(f"tuvi_ls.dk.{k}", mau_vi.get(k, ""), ds=ds, **{a: g[a] for a in ("sao", "hoa", "cung", "chi") if a in g})


# ------------------------------------------------------------------ Tuần / Triệt (bản sao nguyên văn engine gốc)

_PHAI_TT = {"Nguyễn Phát Lộc": "npl", "Việt Viêm Tử": "vvt"}


def tuan_triet(tt: dict) -> dict:
    """Kết quả `tuan_triet_vendor.phan_tich` → chữ theo ngôn ngữ (tuổi, trường phái, giai đoạn, cảnh báo)."""
    tt = copy.deepcopy(tt)
    if isinstance(tt.get("nam_sinh"), str):
        tt["nam_sinh"] = can_chi(tt["nam_sinh"])
    if tt.get("tuoi") in ("dương", "âm"):
        tt["tuoi"] = L(f"tuvi_ls.tt.tuoi.{'duong' if tt['tuoi'] == 'dương' else 'am'}", tt["tuoi"])
    tp = tt.get("truong_phai")
    if tp == "(không khai báo)":
        tt["truong_phai"] = L("tuvi_ls.tt.phai.khong", tp)
    elif tp in _PHAI_TT:
        tt["truong_phai"] = L(f"tuvi_ls.tt.phai.{_PHAI_TT[tp]}", tp)
    if tt.get("giai_doan") == "không phân kỳ":
        tt["giai_doan"] = L("tuvi_ls.tt.giai_doan.khong", "không phân kỳ")
    # `chi_tiet_tung_cung[].kieu` là MÃ (khung dữ kiện so giá trị) → giữ; tên hiển thị qua ten_hien (tuan_triet_kieu).
    cb = []
    for s in tt.get("canh_bao") or []:
        m = re.match(r"XUNG ĐỘT CẤU HÌNH: trường phái (.+?) dùng chế độ '(\w+)', nhưng đang chạy '(\w+)'\.", s)
        if m:
            ma = _PHAI_TT.get(m.group(1), "")
            cb.append(L("tuvi_ls.tt.xung_dot", s, phai=L(f"tuvi_ls.tt.phai.{ma}", m.group(1)),
                        che_do=L(f"tuvi_ls.tt.che_do.{m.group(2)}", m.group(2)),
                        dang=L(f"tuvi_ls.tt.che_do.{m.group(3)}", m.group(3)),
                        ghi_chu=L(f"tuvi_ls.tt.ghi_chu.{ma}", "")))
            continue
        m = re.match(r"(\d+)/12 cung nằm trong phạm vi Tuần/Triệt", s)
        if m:
            cb.append(L("tuvi_ls.tt.qua_rong", s, so=m.group(1)))
            continue
        if s.startswith("Con số 70/30"):
            cb.append(L("tuvi_ls.tt.ty_le_70_30", s))
            continue
        cb.append(s)
    tt["canh_bao"] = cb
    return tt


# ------------------------------------------------------------------ lưu nguyệt

_TEN_THANG = {"Hoá Lộc tháng": "tuvi_ls.ln.loc_thang", "Hoá Kỵ tháng": "tuvi_ls.ln.ky_thang"}


def _xu_huong_muc(x: str) -> str:
    if x in _TEN_THANG:
        return L(_TEN_THANG[x], x)
    m = re.fullmatch(r"(.+) hoá Kỵ \(gốc\)", x)
    if m:
        return L("tuvi_ls.ln.ky_goc", x, sao=ten_sao(m.group(1)))
    return ten_sao(x)


def phai_luu_nguyet(ma: str, meta: dict) -> dict:
    """Tên / cách tính / nguồn của một phái lưu nguyệt (`calc.tuvi_luu_nguyet.PHAI`) theo ngôn ngữ."""
    return {k: (L(f"tuvi_ls.ln.phai.{ma}.{k}", v) if isinstance(v, str) else v) for k, v in meta.items()}


def luu_nguyet(d: dict) -> dict:
    """Kết quả `/v1/tuvi/luu-nguyet` → chữ theo ngôn ngữ. Danh sách sao trong `xu_huong` là chữ hiển thị (web nối bằng
    dấu phẩy) → đổi sang tên Anh; `xu_huong.ket` là MÃ (web tô màu) → giữ."""
    d = copy.deepcopy(d)
    if isinstance(d.get("can_chi_nam"), str):
        d["can_chi_nam"] = can_chi(d["can_chi_nam"])
    ma = d.get("phai")
    for k in ("ten", "cach_tinh", "nguon"):
        if isinstance(d.get(f"phai_{k}"), str) and ma:
            d[f"phai_{k}"] = L(f"tuvi_ls.ln.phai.{ma}.{k}", d[f"phai_{k}"])
    for t in d.get("thang") or []:
        if isinstance(t.get("can_chi"), str):
            t["can_chi"] = can_chi(t["can_chi"])
        xh = t.get("xu_huong") or {}
        for k in ("cat", "sat"):
            if isinstance(xh.get(k), list):
                xh[k] = [_xu_huong_muc(x) for x in xh[k]]
    for k, v in (d.get("so_sanh_phai") or {}).items():
        if isinstance(v.get("ten"), str):
            v["ten"] = L(f"tuvi_ls.ln.phai.{k}.ten", v["ten"])
    if isinstance(d.get("uu_tien"), str):
        d["uu_tien"] = L("tuvi_ls.ln.uu_tien", d["uu_tien"])
    if isinstance(d.get("cac_phai"), dict):
        d["cac_phai"] = {k: phai_luu_nguyet(k, v) for k, v in d["cac_phai"].items()}
    return d
