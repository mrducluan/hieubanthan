# -*- coding: utf-8 -*-
"""EN-ALL GĐ 5 — lớp HIỂN THỊ theo ngôn ngữ cho Phong thuỷ (RULES đọc kết quả CALC, không tính lại; mẫu: `battu_hien.py`).

CALC (`calc.phongthuy`, `calc.mat_bang`, `calc.huyen_khong.thong_quan`) và phần tập quán dân gian (`luangiai.tuoi_dan_gian`,
KB đọc lúc nạp module) trả vài CÂU tiếng Việt: cờ cảnh báo mệnh quái, nhãn cặp cửa–chủ–bếp, cảnh báo mặt bằng, gợi ý hành
thông quan, tên + nghĩa hạn năm, kết luận tuổi làm nhà. Bản Việt giữ nguyên (các hàm ở đây chỉ được gọi khi lượt gọi KHÔNG
phải tiếng Việt). Bản ngôn ngữ khác: dựng lại câu bằng mẫu `L()` từ MÃ có trong chính kết quả — không đổi số, mã, độ dài
danh sách. Tên riêng (quái, hướng, sơn, du niên, sao bay, hành) giữ giá trị mã; tên hiển thị đi qua `ten_hien`.
"""
from __future__ import annotations

import copy
import re

from app.kb import nap
from app.kb import ten as _ten
from app.kb.loi import L

_CAP = {"cửa–chủ": ("pt.ccb.cua_chu", "cửa–chủ"), "cửa–bếp": ("pt.ccb.cua_bep", "cửa–bếp"),
        "chủ–bếp": ("pt.ccb.chu_bep", "chủ–bếp")}


def can_chi(s: str) -> str:
    """"Canh Tý" → "Geng Zi" (mỗi chữ là can hoặc chi)."""
    return " ".join(_ten.ten("can", t) if _ten.muc("can", t) else _ten.ten("chi", t) for t in s.split())


def huong(h: str) -> str:
    return _ten.ten("huong", h)


def ds_huong(hs) -> str:
    return L("pt.noi", ", ").join(huong(h) for h in hs)


def co_canh_bao(ds: list[dict]) -> list[dict]:
    """Cờ của `calc.phongthuy.menh_quai` (loai lap_xuan / chua_ro_ngay) → câu theo ngôn ngữ."""
    ra = []
    for c in ds or []:
        c = dict(c)
        if c.get("loai") == "lap_xuan":
            c["chi_tiet"] = L("pt.co.lap_xuan", c["chi_tiet"])
        elif c.get("loai") == "chua_ro_ngay":
            c["chi_tiet"] = (L("pt.co.chua_ro_ngay.lap_xuan", c["chi_tiet"]) if "Lập xuân" in c["chi_tiet"]
                             else L("pt.co.chua_ro_ngay.tet", c["chi_tiet"]))
        ra.append(c)
    return ra


def cap_ccb(cap: str) -> str:
    ma, vi = _CAP.get(cap, ("", cap))
    return L(ma, vi) if ma else cap


def cua_chu_bep(ccb: dict) -> dict:
    ccb = copy.deepcopy(ccb)
    for x in ccb.get("cap", []):
        x["cap"] = cap_ccb(x["cap"])
    return ccb


_KHUYET = re.compile(r"^góc hàng (\d+) cột (\d+)$")
_CB_MB = {"Tâm nhà rơi": "pt.mb.tam_ngoai", "Chưa có độ hướng": "pt.mb.chua_huong"}


def mat_bang(r: dict) -> dict:
    """Kết quả `calc.mat_bang.phan_tich` → câu cảnh báo + tên góc khuyết chưa có phương theo ngôn ngữ."""
    r = copy.deepcopy(r)
    r["canh_bao"] = [next((L(m, x) for k, m in _CB_MB.items() if x.startswith(k)), x) for x in r.get("canh_bao", [])]
    kg = []
    for x in r.get("khuyet_goc", []):
        m = _KHUYET.match(x or "")
        kg.append(L("pt.mb.goc", x, hang=m.group(1), cot=m.group(2)) if m else x)
    r["khuyet_goc"] = kg
    return r


_GOI_Y_HANH = {"Mộc": "màu xanh lá, đồ gỗ, cây xanh", "Hoả": "màu đỏ, cam, hồng; đèn ấm, ánh sáng", "Thổ": "màu vàng đất, nâu; gốm, đá",
               "Kim": "màu trắng, xám, ánh kim; kim loại tròn", "Thuỷ": "màu xanh dương, đen; kính, mặt nước nhỏ"}
_MA_HANH = {"Mộc": "moc", "Hoả": "hoa", "Thổ": "tho", "Kim": "kim", "Thuỷ": "thuy"}


def thong_quan(tq: dict | None) -> dict | None:
    """`calc.huyen_khong.thong_quan` → câu gợi ý hành thông quan theo ngôn ngữ (mã hành giữ nguyên)."""
    if not tq or not tq.get("goi_y") or not tq.get("hanh_thong_quan"):
        return tq
    h = tq["hanh_thong_quan"]
    tq = dict(tq)
    tq["goi_y"] = L("pt.tq.goi_y", tq["goi_y"], hanh=_ten.ten("hanh", h),
                    vat=L(f"pt.tq.vat.{_MA_HANH.get(h, h)}", _GOI_Y_HANH.get(h, "")))
    return tq


# ------------------------------------------------------------------ tập quán dân gian (tuổi làm nhà, hạn năm)
def _tdg() -> dict:
    return nap.doc("tuoi_dan_gian_kb.json")


def han_nam(hn: dict) -> dict:
    """`luangiai.tuoi_dan_gian.han_nam_luan` → tên, nghĩa phương tránh, mốc, can chi theo ngôn ngữ (mã + phương giữ)."""
    hn = copy.deepcopy(hn)
    kb = _tdg().get("han_nam") or {}
    for x in hn.get("huong_tranh", []):
        m = kb.get(x.get("ma")) or {}
        x["ten"], x["nghia"] = m.get("ten", x["ten"]), m.get("nghia", x.get("nghia"))
    cc = can_chi(hn["can_chi"])
    m = re.search(r"khoảng 4/2/(\d+)\); Tết Việt năm .+? là (\d+)/(\d+)/(\d+)\.", hn.get("moc", ""))
    if m:
        hn["moc"] = L("pt.han_nam.moc", hn["moc"], nam=m.group(1), can_chi=cc, d=m.group(2), mo=m.group(3), y=m.group(4))
    hn["can_chi"] = cc
    return hn


def tuoi_lam_nha(tl: dict) -> dict:
    """`luangiai.tuoi_dan_gian.xem_tuoi_lam_nha` → tên / nghĩa Kim lâu, Hoang ốc, Tam tai + câu kết luận + cách tính."""
    from app.calc import tuoi_dan_gian as t  # noqa: PLC0415
    tl = copy.deepcopy(tl)
    kb = _tdg()
    for k in ("kim_lau", "hoang_oc"):
        if tl.get(k) and tl[k].get("ma") in (kb.get(k) or {}):
            tl[k] = {**tl[k], **{kk: v for kk, v in kb[k][tl[k]["ma"]].items() if kk in ("ten", "nghia")}}
    if tl.get("tam_tai"):
        tl["tam_tai"] = {**tl["tam_tai"], **{kk: v for kk, v in (kb.get("tam_tai") or {}).items() if kk in ("ten", "nghia")}}
    xau = [x for x in ((tl["kim_lau"] or {}).get("ten") if tl.get("kim_lau") else None,
                       tl["hoang_oc"]["ten"] if tl["hoang_oc"]["ma"] in t.HOANG_OC_XAU else None,
                       L("pt.tl.tam_tai", "Tam tai (năm thứ {n})", n=tl["tam_tai"]["nam_thu"]) if tl.get("tam_tai") else None) if x]
    nx, tuoi = tl["nam_xay"], tl["tuoi_mu"]
    if tl["ket_luan"]["ma"] == "thuan":
        chu = L("pt.tl.thuan", "Năm {nam} tuổi {tuoi} không phạm Kim lâu, Hoang ốc xấu hay Tam tai.", nam=nx, tuoi=tuoi)
    else:
        chu = (L("pt.tl.can_nhac", "Năm {nam} tuổi {tuoi} rơi vào {xau} — dân gian thường tránh làm nhà năm này",
                 nam=nx, tuoi=tuoi, xau=L("pt.noi", ", ").join(xau))
               + (L("pt.tl.kl_cuoi", "; với cưới hỏi, Kim lâu chỉ xét tuổi cô dâu.") if tl.get("kim_lau") else "."))
    nt = tl.get("nam_tuoi")
    if nt:
        cc_nam, cc_tuoi = can_chi(tl["can_chi_nam_xay"]), can_chi(tl["can_chi"])
        chi = cc_tuoi.split()[-1] if cc_tuoi else ""
        cau = (L("pt.tl.nam_tuoi", nt["chu"], nam=nx, cc_nam=cc_nam, cc_tuoi=cc_tuoi) if nt["ma"] == "trung"
               else L("pt.tl.xung_tuoi", nt["chu"], nam=nx, cc_nam=cc_nam, cc_tuoi=cc_tuoi, chi=chi))
        chu += " " + cau
        tl["nam_tuoi"] = {**nt, "chu": cau}
    tl["ket_luan"] = {**tl["ket_luan"], "chu": chu}
    tl["cach_tinh"] = L("pt.tl.cach_tinh", tl.get("cach_tinh", ""))
    for x in tl.get("nam_thuan", []):
        x["can_chi"] = can_chi(x["can_chi"])
    return tl
