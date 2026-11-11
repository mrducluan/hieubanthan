# -*- coding: utf-8 -*-
"""EN-ALL GĐ 3c — lớp HIỂN THỊ theo ngôn ngữ cho GÓI BẰNG CHỨNG của hỏi đáp Bát tự (`bang_chung` của /v1/battu/hoi).

Gói dựng ở tầng RULES với mã + chữ CALC tiếng Việt (tên trụ "ngày", can chi ghép "Canh Ngọ · Tân Tỵ", mô tả quan hệ, giải
thích dụng thần…) — lời đáp đã dựng xong từ gói này. Bản Việt không đi qua đây. Bản ngôn ngữ khác: bản sao gói với chữ
hiển thị theo ngôn ngữ đó; trường MÃ (can, chi, hành, thập thần, loại, ma_mau, mức…) giữ nguyên giá trị, tên hiển thị đi
qua `ten_hien` (kb/ten.KHOA_MA). Không đổi số, mã, độ dài danh sách.
"""
from __future__ import annotations

import copy

from app.kb import ten as _ten
from app.kb.loi import L
from app.luangiai import battu_hien as _bth


def _t(nhom: str, v):
    return _ten.ten(nhom, v) if isinstance(v, str) else v


def _cc(s):
    if not isinstance(s, str):
        return s
    return " · ".join(" ".join(_bth._can_chi(x) for x in p.split()) for p in s.split(" · "))


def _ds(nhom: str, v):
    return [_t(nhom, x) for x in v] if isinstance(v, list) else v


def _qh_chi(v: str) -> str:
    return {"phục ngâm (trùng chi)": L("hoi.bt.qh.phuc_ngam", "phục ngâm (trùng chi)"),
            "không xung hợp": L("hoi.bt.qh.khong", "không xung hợp")}.get(v) or _ten.ten("quan_he", v)


def _vi_tri(v: str) -> str:
    return {"thê tinh": L("hoi.bt.the_tinh", "thê tinh"), "phu tinh": L("hoi.bt.phu_tinh", "phu tinh")}.get(v, v)


def _than_sat(x: dict) -> None:
    ma = _bth._ma(x.get("ten", ""))
    if x.get("y"):
        x["y"] = L(f"battu.than_sat.y.{ma}", x["y"])
    if x.get("goc"):
        x["goc"] = _bth._goc(x["goc"])
    if x.get("cach_khac"):
        x["cach_khac"] = L(f"battu.than_sat.cach_khac.{ma}", x["cach_khac"])
    if x.get("phai"):
        x["phai"] = _t("sach_battu", x["phai"])
    if x.get("nhom"):
        x["nhom"] = _t("than_sat", x["nhom"])
    x["ten"] = _t("than_sat", x.get("ten"))


def _muc(m: dict) -> None:
    l = m.get("loai")
    if "tru" in m and isinstance(m["tru"], str):
        m["tru"] = _cc(m["tru"])
    if "can_chi" in m:
        m["can_chi"] = _cc(m["can_chi"])
    if "tru_ten" in m:
        m["tru_ten"] = [_bth._tru(x) for x in m["tru_ten"]]
    if l == "thap_than":
        m["ten"] = _t("thap_than", m.get("ten"))
        m["nhom"] = _t("nhom_thap_than", m.get("nhom"))
        if m.get("vi_tri"):
            m["vi_tri"] = _vi_tri(m["vi_tri"])
    elif l == "tru":
        m["ten"] = _bth._tru(m.get("ten", ""))
        if "tang_can_tt" in m:
            m["tang_can_tt"] = _ds("thap_than", m["tang_can_tt"])
    elif l == "luu_nien":
        m["voi_tru_ngay"] = _qh_chi(m.get("voi_tru_ngay", ""))
        m["ngu_hanh_can"] = _t("hanh", m.get("ngu_hanh_can"))
    elif l == "dung_than":
        if m.get("phu_uc", {}).get("giai_thich"):
            m["phu_uc"]["giai_thich"] = _bth.phu_uc_gt(m["phu_uc"])
        if m.get("dieu_hau", {}).get("giai_thich"):
            m["dieu_hau"]["giai_thich"] = _bth.dieu_hau_gt(m["dieu_hau"], m.get("thang", ""))
        m["nhat_chu"] = _t("can", m.get("nhat_chu"))
        m["thang"] = _t("chi", m.get("thang"))
    elif l == "ngu_hanh":
        m["diem_hien_thi"] = ", ".join(f"{_t('hanh', h)} {v:g}" for h, v in (m.get("diem") or {}).items())
        m["nhieu_nhat"] = _t("hanh", m.get("nhieu_nhat"))
        m["thieu"] = _ds("hanh", m.get("thieu"))
        th = m.get("than") or {}
        if th.get("thang_diem"):
            th["thang_diem"] = L("battu.thang_diem", th["thang_diem"])
    elif l == "cac_dai_van":
        m["dung_than_phu_uc"] = _ds("hanh", m.get("dung_than_phu_uc"))
    elif l in ("than_sat", "than_sat_tk"):
        for x in m.get("ds") or []:
            _than_sat(x)
        m["hoi"] = _ds("than_sat", m.get("hoi"))
        if m.get("nguon"):
            m["nguon"] = L("battu.nguon.than_sat_tham_khao_nguon", m["nguon"])
    elif l == "xung_hop":
        for x in m.get("ds") or []:
            x["mo_ta"] = _bth.mo_ta_quan_he(x)
    elif l == "cung_than":
        for k, v in list((m.get("giai_thich") or {}).items()):
            m["giai_thich"][k] = L(f"battu.cung_than.{k}", v)
    elif l == "so_nam":
        for x in m.get("nam") or []:
            x["can_chi"] = _cc(x.get("can_chi"))
    elif l == "sao_han":
        if isinstance(m.get("nam"), dict) and m["nam"].get("can_chi"):
            m["nam"]["can_chi"] = _cc(m["nam"]["can_chi"])


def goi(g: dict) -> dict:
    """Bản sao gói bằng chứng với chữ hiển thị theo ngôn ngữ của lượt gọi."""
    r = copy.deepcopy(g)
    for m in r.get("muc") or []:
        if isinstance(m, dict):
            _muc(m)
    return r
