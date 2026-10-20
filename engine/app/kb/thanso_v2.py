# -*- coding: utf-8 -*-
"""Tầng KB — kho thần số v2 (số × lĩnh vực, cặp số, biểu đồ, chỉ số phụ,
giải thích kỹ thuật, mẫu xử lý cố định).

Nguồn: file JSON trong app/kb/data (Supabase: migration 0003, chưa bật đọc).
Nguyên tắc như store.py: không có mục trong KB → trả None, tầng trên im lặng.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_DIR = Path(__file__).parent / "data"

FILES = {
    "linh_vuc": "thanso_linh_vuc.json",
    "cap_so": "thanso_cap_so.json",
    "bieu_do": "thanso_bieu_do.json",
    "chi_so_phu": "thanso_chi_so_phu.json",
    "giai_thich": "thanso_giai_thich.json",
    "xu_ly": "thanso_xu_ly.json",
    "chan_dung": "thanso_chan_dung.json",
    "quan_he": "thanso_quan_he.json",
    "chaldean": "thanso_chaldean.json",
    "hom_nay": "thanso_hom_nay.json",
    "doi_chieu": "thanso_doi_chieu.json",
    "do_thi": "thanso_do_thi.json",
    "ban_do": "thanso_ban_do.json",
}


@lru_cache(maxsize=None)
def _doc(ten: str) -> dict:
    return json.loads((_DIR / FILES[ten]).read_text(encoding="utf-8"))


def _meta(ten: str) -> dict:
    d = _doc(ten)
    return {"source_id": d["source_id"], "school_id": d["school_id"],
            "trang_thai": d["trang_thai"], "nguon": d["source"]["ten"]}


def ten_linh_vuc(lv: str) -> str:
    return _doc("linh_vuc")["linh_vuc"].get(lv, lv)


def linh_vuc_co_noi_dung() -> set[str]:
    return set(_doc("linh_vuc")["linh_vuc"])


def nghia_linh_vuc(so: int, lv: str) -> dict | None:
    m = _doc("linh_vuc")["noi_dung"].get(str(so), {}).get(lv)
    return {**m, **_meta("linh_vuc")} if m else None


def nghia_cap(cap: str) -> dict | None:
    m = _doc("cap_so")["cap"].get(cap)
    return {**m, **_meta("cap_so")} if m else None


def nghia_o_so(so: int) -> dict | None:
    m = _doc("bieu_do")["o_so"].get(str(so))
    return {**m, **_meta("bieu_do")} if m else None


def nghia_mui_ten(ma: str, trong: bool) -> dict | None:
    m = _doc("bieu_do")["mui_ten_trong" if trong else "mui_ten_du"].get(ma)
    return {**m, **_meta("bieu_do")} if m else None


def nghia_phu(khoi: str, so: int) -> dict | str | None:
    """khoi: ngay_sinh | thai_do | truong_thanh | thang_ca_nhan | ngay_ca_nhan |
    no_nghiep | bai_hoc_nghiep."""
    return _doc("chi_so_phu").get(khoi, {}).get(str(so))


def meta_phu() -> dict:
    return _meta("chi_so_phu")


def muc_giai_thich() -> dict[str, dict]:
    return _doc("giai_thich")["muc"]


def giai_thich(ma: str) -> dict | None:
    m = muc_giai_thich().get(ma)
    return {**m, **_meta("giai_thich")} if m else None


def mau(ma: str) -> str | None:
    return _doc("xu_ly")["mau"].get(ma)


def luu_y(ma: str) -> str | None:
    return _doc("xu_ly")["luu_y"].get(ma)


def chan_dung(so: int) -> dict | None:
    """Chân dung 4 mặt theo số Đường đời (có cả số cái 11/22/33)."""
    m = _doc("chan_dung")["so"].get(str(so))
    return {**m, **_meta("chan_dung")} if m else None


def ten_mat_chan_dung() -> dict[str, str]:
    return _doc("chan_dung")["mat"]


def quan_he(ma: str) -> dict | None:
    m = _doc("quan_he")["quan_he"].get(ma)
    return {"ma": ma, **m} if m else None


def ds_quan_he() -> list[str]:
    return list(_doc("quan_he")["quan_he"])


def nguoi_trong_vai(so: int, ma_qh: str) -> dict | None:
    """Người mang số `so` trong vai `ma_qh`. Số cái quy về gốc (11→2, 22→4, 33→6)."""
    goc = {11: 2, 22: 4, 33: 6}.get(so, so)
    return _doc("quan_he")["theo_so"].get(str(goc), {}).get(ma_qh)


def meta_quan_he() -> dict:
    return _meta("quan_he")


# ------------------------------------------------------------------ phái Chaldea (TS-PHAI)
def chaldea_gioi_thieu() -> dict:
    d = _doc("chaldean")
    return {**d["gioi_thieu"], "bang_chu": d["bang_chu"]}


def chaldea_goc(so: int) -> dict | None:
    return _doc("chaldean")["goc"].get(str(so))


def chaldea_kep(so: int | None) -> dict | None:
    return _doc("chaldean")["kep"].get(str(so)) if so is not None else None


def meta_chaldea() -> dict:
    return _meta("chaldean")


# ------------------------------------------------------------------ Hôm nay: ý định trong ngày (HN-2)
def y_dinh_hom_nay() -> dict[str, dict]:
    return _doc("hom_nay")["y_dinh"]


def y_dinh_theo_ngay(so: int, ma: str) -> dict | None:
    return _doc("hom_nay")["noi_dung"].get(str(so), {}).get(ma)


def ngay_pho_quat(so: int) -> str | None:
    return _doc("hom_nay")["ngay_pho_quat"].get(str(so))


def cau_hoi_noi_bat(so: int) -> list[str]:
    return list(_doc("hom_nay")["cau_hoi_noi_bat"].get(str(so), []))


def meta_hom_nay() -> dict:
    return _meta("hom_nay")


# ------------------------------------------------------------------ TS-NOIDAU: giao điểm hai phái (13/14/16/19)
def giao_diem_phai(so: int) -> dict | None:
    m = _doc("doi_chieu")["so"].get(str(so))
    return {**m, **_meta("doi_chieu")} if m else None


# ------------------------------------------------------------------ TS-V3: đồ thị liên phái
def do_thi() -> dict:
    return _doc("do_thi")


def meta_do_thi() -> dict:
    return _meta("do_thi")



# ------------------------------------------------------------------ Bản đồ con số (gói Luận giải toàn bộ thần số)
def ban_do() -> dict:
    return _doc("ban_do")


def meta_ban_do() -> dict:
    return _meta("ban_do")
