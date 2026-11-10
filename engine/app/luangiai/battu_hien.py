# -*- coding: utf-8 -*-
"""EN-ALL GĐ 3 — lớp HIỂN THỊ theo ngôn ngữ cho lá số Bát tự (RULES đọc kết quả CALC, không tính lại).

CALC `battu` / `battu_mo_rong` không đọc ngôn ngữ và trả một số CÂU tiếng Việt (ý thần sát, gốc tra, mô tả quan hệ, giải
thích cung / dụng thần, cờ cảnh báo). Bản Việt giữ nguyên (hàm này không được gọi). Bản ngôn ngữ khác: thay câu bằng mẫu
`L()` dựng lại từ MÃ có trong chính kết quả (tên sao, loại quan hệ, chỉ số trụ, can chi) — không đổi số, mã, danh sách.
Tên riêng (can, chi, hành, thần sát, loại quan hệ…) giữ giá trị mã; tên hiển thị đi qua `ten_hien` (kb/ten.KHOA_MA).
"""
from __future__ import annotations

import copy
import re
import unicodedata

from app.kb import ten as _ten
from app.kb.loi import L

TRU_EN = {"năm": ("tru.nam", "năm"), "tháng": ("tru.thang", "tháng"), "ngày": ("tru.ngay", "ngày"), "giờ": ("tru.gio", "giờ"),
          "lưu niên": ("tru.luu_nien", "lưu niên"), "đại vận": ("tru.dai_van", "đại vận")}


def _ma(s: str) -> str:
    s = unicodedata.normalize("NFD", s.replace("Đ", "D").replace("đ", "d"))
    return re.sub(r"[^a-z0-9]+", "_", "".join(c for c in s if unicodedata.category(c) != "Mn").lower()).strip("_")


def _tru(t: str) -> str:
    ma, vi = TRU_EN.get(t, ("", t))
    return L(f"battu.{ma}", vi) if ma else t


def _can_chi(x: str) -> str:
    return _ten.ten("can", x) if _ten.muc("can", x) else _ten.ten("chi", x)


def _goc(g: str) -> str:
    """"can ngày, can năm" / "nạp âm năm, hành Hỏa" / "trụ giờ, can ngày" → mẫu theo từng mảnh."""
    ra = []
    for p in [x.strip() for x in g.split(",")]:
        m = re.fullmatch(r"hành (\S+)", p)
        ra.append(L("battu.goc.hanh", p, hanh=_ten.ten("hanh", m.group(1))) if m else L(f"battu.goc.{_ma(p)}", p))
    return ", ".join(ra)


_QH = re.compile(r"^(?P<tru>.+?): (?P<gia>\S+) (?P<loai>.+?)(?P<them> \(.+\))?$")


def mo_ta_quan_he(q: dict) -> str:
    """"năm – ngày: Ngọ–Ngọ tự hình" → "Year – Day: Wu–Wu self-punishment" (dựng lại từ mã của chính mục)."""
    m = _QH.match(q.get("mo_ta", ""))
    if not m:
        return q.get("mo_ta", "")
    tru = " – ".join(_tru(t) for t in m.group("tru").split(" – "))
    gia = "–".join(_can_chi(x) for x in m.group("gia").split("–"))
    loai = _ten.ten("quan_he", m.group("loai").strip())
    them = ""
    if m.group("them"):
        t = m.group("them").strip()[1:-1]
        if t.startswith("hoá "):
            them = " " + L("battu.qh.hoa", t, hanh=_ten.ten("hanh", t[4:]))
        elif t.endswith(" cục"):
            them = " " + L("battu.qh.cuc", t, hanh=_ten.ten("hanh", t[:-4]))
        elif t.endswith(" phương"):
            them = " " + L("battu.qh.phuong", t, hanh=_ten.ten("hanh", t[:-7]))
        else:
            them = " " + L("battu.qh.hanh", t, hanh=_ten.ten("hanh", t))
    return f"{tru}: {gia} {loai}{them}"


def _co(c: dict) -> dict:
    loai, ct = c.get("loai"), c.get("chi_tiet", "")
    if loai == "tiet_edge":
        m = re.search(r"khoảng ([\d.]+) giờ", ct)
        return {**c, "chi_tiet": L("co.tiet_edge", ct, gio=m.group(1) if m else "")}
    if loai in ("gio_ty", "da_ty"):
        return {**c, "chi_tiet": L(f"co.{loai}", ct)}
    return c


def la_so(kq: dict) -> dict:
    """Bản sao kết quả `/v1/battu/la-so` với câu theo ngôn ngữ lượt gọi."""
    r = copy.deepcopy(kq)
    r["co_canh_bao"] = [_co(c) for c in r.get("co_canh_bao", [])]
    th = r.get("than") or {}
    if "thang_diem" in th:
        th["thang_diem"] = L("battu.thang_diem", th["thang_diem"])
    dt = r.get("dung_than") or {}
    if dt.get("phu_uc", {}).get("giai_thich"):
        dt["phu_uc"]["giai_thich"] = L("battu.phu_uc", dt["phu_uc"]["giai_thich"], than=_ten.ten("than_vuong", th.get("ket_luan", "")))
    dh = dt.get("dieu_hau") or {}
    if dh.get("giai_thich"):
        chi = _ten.ten("chi", r["tru"][1]["chi"])
        if dh.get("thuyet") == "nam_ban_cau":
            k = "he" if "mùa đông" in dh["giai_thich"] else "dong" if "mùa hè" in dh["giai_thich"] else "on_hoa"
            dh["giai_thich"] = L(f"battu.dieu_hau.nam_ban_cau.{k}", dh["giai_thich"], chi=chi)
        else:
            dh["giai_thich"] = L("battu.dieu_hau.can" if dh.get("hanh") else "battu.dieu_hau.on_hoa", dh["giai_thich"], chi=chi)
    mr = r.get("mo_rong") or {}
    for s in mr.get("than_sat", []):
        s["y"] = L(f"battu.than_sat.y.{_ma(s['ten'])}", s["y"])
        s["goc"] = _goc(s["goc"])
    for s in mr.get("than_sat_tham_khao", []):
        s["y"] = L(f"battu.than_sat.y.{_ma(s['ten'])}", s["y"])
        s["cach_khac"] = L(f"battu.than_sat.cach_khac.{_ma(s['ten'])}", s["cach_khac"])
        s["goc"] = _goc(s["goc"])
    for k in ("than_sat_nguon", "than_sat_tham_khao_nguon"):
        if mr.get(k):
            mr[k] = L(f"battu.nguon.{k}", mr[k])
    for q in mr.get("quan_he", []):
        q["mo_ta"] = mo_ta_quan_he(q)
    ct = mr.get("cung_than") or {}
    for k, v in list((ct.get("giai_thich") or {}).items()):
        ct["giai_thich"][k] = L(f"battu.cung_than.{k}", v)
    if ct.get("nguon"):
        ct["nguon"] = L("battu.nguon.cung_than", ct["nguon"])
    return r


def quan_he_ds(ds: list[dict]) -> list[dict]:
    """Danh sách quan hệ (vd lưu niên × tứ trụ) với mô tả theo ngôn ngữ."""
    return [{**q, "mo_ta": mo_ta_quan_he(q)} for q in ds]
