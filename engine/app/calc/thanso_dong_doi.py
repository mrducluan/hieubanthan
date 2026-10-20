# -*- coding: utf-8 -*-
"""TS-SAU — Dòng đời & bước ngoặt (CALC thuần, tất định).

Ghép các phép tính đã có (đỉnh cao, thử thách, năm cá nhân) thành một trục thời gian:
  - 4 giai đoạn đời (đỉnh cao) kèm thử thách tương ứng (P1↔T1, P2↔T2, P3↔T chính, P4↔T4 — quy ước Decoz);
  - các chu kỳ 9 năm (bắt đầu ở năm cá nhân 1, mốc dương lịch — như phần "Năm cá nhân" của bài đọc);
  - các BƯỚC NGOẶT theo hệ số: năm chuyển đỉnh, năm mở chu kỳ (1), năm khép chu kỳ (9).
Đây là nhịp biểu tượng để ĐỐI CHIẾU với đời thật, không phải dự báo sự kiện.
"""
from __future__ import annotations

from app.calc import thanso

LOAI_MOC = ("chuyen_dinh", "khoi_chu_ky", "khep_chu_ky")


def _giai_doan(d: int, m: int, y: int, quy_uoc: str = "tong_het") -> list[dict]:
    dc = thanso.dinh_cao(d, m, y, thanso.duong_doi(d, m, y, quy_uoc))
    tt = thanso.thu_thach(d, m, y)
    gan = [tt["thu_thach_1"], tt["thu_thach_2"], tt["thu_thach_chinh"], tt["thu_thach_4"]]
    return [{**p, "thu_thach": gan[i], "tu_nam": y + p["tu_tuoi"],
             "den_nam": None if p["den_tuoi"] is None else y + p["den_tuoi"]} for i, p in enumerate(dc)]


def _dinh_o_tuoi(gd: list[dict], tuoi: int) -> dict:
    for g in gd:
        if g["den_tuoi"] is None or tuoi <= g["den_tuoi"]:
            return g
    return gd[-1]


def _ncn(d: int, m: int, nam: int) -> int:
    return thanso.nam_ca_nhan(d, m, nam, "duong_lich")  # type: ignore[return-value]


def dong_doi(d: int, m: int, y: int, nam_xem: int, den_tuoi: int = 80, quy_uoc: str = "tong_het") -> dict:
    """Trục đời từ năm sinh tới `den_tuoi` tuổi."""
    gd = _giai_doan(d, m, y, quy_uoc)
    nam_cuoi = y + den_tuoi
    moc: list[dict] = [{"nam": g["tu_nam"], "tuoi": g["tu_tuoi"], "loai": "chuyen_dinh", "so": g["so"],
                        "dinh": g["dinh"]} for g in gd[1:] if g["tu_nam"] <= nam_cuoi]
    chu_ky = []
    for n in range(y, nam_cuoi + 1):
        s = _ncn(d, m, n)
        if s == 1:
            chu_ky.append({"bat_dau": n, "ket_thuc": n + 8, "tuoi_bat_dau": n - y})
            moc.append({"nam": n, "tuoi": n - y, "loai": "khoi_chu_ky", "so": 1})
        elif s == 9:
            moc.append({"nam": n, "tuoi": n - y, "loai": "khep_chu_ky", "so": 9})
    moc.sort(key=lambda b: (b["nam"], LOAI_MOC.index(b["loai"])))
    dem: dict[int, int] = {}
    for b in moc:
        dem[b["nam"]] = dem.get(b["nam"], 0) + 1
    for b in moc:
        b["trung_moc"] = dem[b["nam"]] > 1
    tuoi = nam_xem - y
    return {
        "giai_doan": gd,
        "chu_ky": chu_ky,
        "buoc_ngoat": moc,
        "hien_tai": {"nam": nam_xem, "tuoi": tuoi, "dinh": _dinh_o_tuoi(gd, tuoi)["dinh"],
                     "nam_ca_nhan": _ncn(d, m, nam_xem)},
    }


def doi_chieu_nam(d: int, m: int, y: int, nam: int, quy_uoc: str = "tong_het") -> dict:
    """Một năm cụ thể (vd năm có biến cố) nằm ở đâu trên trục đời."""
    if nam < y:
        raise ValueError("Năm đối chiếu phải từ năm sinh trở đi")
    gd = _giai_doan(d, m, y, quy_uoc)
    tuoi = nam - y
    g = _dinh_o_tuoi(gd, tuoi)
    ncn = _ncn(d, m, nam)
    truoc, tu = thanso.nam_ca_nhan(d, m, nam, "sinh_nhat")  # type: ignore[misc]
    moc = [loai for loai, co in (("chuyen_dinh", g["tu_nam"] == nam and g["dinh"] > 1),
                                 ("khoi_chu_ky", ncn == 1), ("khep_chu_ky", ncn == 9)) if co]
    return {"nam": nam, "tuoi": tuoi, "nam_ca_nhan": ncn,
            "nam_ca_nhan_sinh_nhat": {"truoc_sinh_nhat": truoc, "tu_sinh_nhat": tu},
            "dinh": g["dinh"], "so_dinh": g["so"], "thu_thach": g["thu_thach"], "moc": moc}
