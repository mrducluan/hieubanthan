# -*- coding: utf-8 -*-
"""Đợt 2A — Thần số học trường phái David A. Phillips (Số Chủ Đạo 2–11 & 22/4 + 4 Đỉnh Kim Tự Tháp).

Tầng CALC: Python thuần, tất định, không LLM, không DB.
Chỉ áp dụng công thức toán học công khai (không có bản quyền):
  - Số Chủ Đạo (Ruling Number): cộng ngang tất cả chữ số ngày/tháng/năm sinh; rút gọn dừng ở 2..9, 10, 11 hoặc 22/4
    (không có số 1 — tổng 10/19/28/37/46 dừng ở 10; không có số 33 — 33 rút về 6).
  - 4 Đỉnh Kim Tự Tháp (Four Pyramids / Peak Years):
      * 3 chân đế rút gọn về 1..9: tháng (B1), ngày (B2), năm (B3).
      * Đỉnh 1 = rút gọn 1..9 của (B1 + B2); Đỉnh 2 = rút gọn 1..9 của (B2 + B3).
      * Đỉnh 3 = (Đỉnh 1 + Đỉnh 2), giữ 10 và 11; Đỉnh 4 = (B1 + B3), giữ 10 và 11.
      * 4 mốc tuổi đỉnh: T1 = 36 − gốc(Số Chủ Đạo) (với 10→1, 11→2, 22/4→4), T2 = T1 + 9, T3 = T2 + 9, T4 = T3 + 9.
        Bất biến toán học: tại cả 4 năm mốc đỉnh, Năm Cá Nhân dương lịch luôn bằng 9.
"""
from __future__ import annotations

import datetime as _dt

from app.calc import thanso, thanso_mo_rong


def _rut_1_9(n: int) -> int:
    while n > 9:
        n = sum(int(c) for c in str(n))
    return n


def _rut_dinh_3_4(n: int) -> int:
    """Đỉnh 3 và Đỉnh 4 của Kim Tự Tháp Phillips: rút gọn về 1..9, riêng 10 và 11 giữ nguyên."""
    while n > 11:
        n = sum(int(c) for c in str(n))
    return n


def so_chu_dao(d: int, m: int, y: int) -> dict:
    """Số Chủ Đạo theo công thức Phillips: tập kết quả duy nhất gồm {2..9, 10, 11, 22/4}."""
    chu_so = [int(c) for c in f"{d}{m}{y}"]
    tong = sum(chu_so)
    chuoi = [tong]
    cur = tong
    while cur > 11 and cur != 22:
        cur = sum(int(c) for c in str(cur))
        chuoi.append(cur)
    if cur == 22:
        nhan, ma, goc = "22/4", "22/4", 4
    elif cur == 11:
        nhan, ma, goc = "11", "11", 2
    elif cur == 10:
        nhan, ma, goc = "10", "10", 1
    else:
        nhan, ma, goc = str(cur), str(cur), cur
    return {
        "so": cur,
        "ma": ma,
        "nhan": nhan,
        "goc": goc,
        "tong_goc": tong,
        "dang_day_du": f"{tong}/{nhan}" if tong != cur else nhan,
        "chuoi": chuoi,
        "cach_tinh": f"{' + '.join(map(str, chu_so))} = {' → '.join(map(str, chuoi))}" + (" (22/4)" if cur == 22 else ""),
    }


def bon_dinh_kim_tu_thap(d: int, m: int, y: int, nam_xem: int | None = None,
                         ngay_xem: _dt.date | None = None) -> dict:
    """Bốn Đỉnh Kim Tự Tháp Phillips: 3 chân đế (tháng, ngày, năm), 4 đỉnh và 4 mốc tuổi (cách nhau 9 năm)."""
    scd = so_chu_dao(d, m, y)
    b1, b2, b3 = _rut_1_9(m), _rut_1_9(d), _rut_1_9(y)
    p1 = _rut_1_9(b1 + b2)
    p2 = _rut_1_9(b2 + b3)
    p3 = _rut_dinh_3_4(p1 + p2)
    p4 = _rut_dinh_3_4(b1 + b3)

    t1 = 36 - scd["goc"]
    tuoi_moc = [t1, t1 + 9, t1 + 18, t1 + 27]
    so_dinh = [p1, p2, p3, p4]
    cong_thuc = [
        f"Tháng ({b1}) + Ngày ({b2}) = {p1}",
        f"Ngày ({b2}) + Năm ({b3}) = {p2}",
        f"Đỉnh 1 ({p1}) + Đỉnh 2 ({p2}) = {p3}",
        f"Tháng ({b1}) + Năm ({b3}) = {p4}",
    ]

    tuoi_hien_tai = (nam_xem - y) if nam_xem is not None else None
    dinh_list = []
    for i in range(4):
        tuoi = tuoi_moc[i]
        tu_tuoi = 0 if i == 0 else tuoi_moc[i - 1] + 1
        den_tuoi = tuoi if i < 3 else None
        if tuoi_hien_tai is None:
            tt = None
        elif i < 3 and tuoi_hien_tai > tuoi:
            tt = "da_qua"
        elif tuoi_hien_tai < tu_tuoi:
            tt = "sap_toi"
        else:
            tt = "dang_trong"
        dinh_list.append({
            "dinh": i + 1,
            "so": so_dinh[i],
            "tuoi": tuoi,
            "nam": y + tuoi,
            "tu_tuoi": tu_tuoi,
            "den_tuoi": den_tuoi,
            "cong_thuc": cong_thuc[i],
            "trang_thai": tt,
        })

    # TUOI-1: chặng đỉnh xét theo NĂM (quy ước Phillips: mốc đỉnh rơi đúng năm cá nhân 9) — `tuoi_hien_tai` = năm xem −
    # năm sinh. Tuổi để NÓI với người đọc là tuổi tròn theo sinh nhật tại `ngay_xem` (người sinh tháng 12 xem tháng 11
    # còn kém một tuổi so với hiệu năm).
    tuoi_tron = None
    if ngay_xem is not None:
        tuoi_tron = ngay_xem.year - y - ((ngay_xem.month, ngay_xem.day) < (m, d))
    return {
        "chan_de": {"thang": b1, "ngay": b2, "nam": b3},
        "dinh": dinh_list,
        "tuoi_hien_tai": tuoi_hien_tai,
        "tuoi_tron": tuoi_tron,
        "nam_xem": nam_xem,
    }


def _kb() -> dict:
    from app.kb import nap  # noqa: PLC0415 — một hàm đọc KB (lớp phủ ngôn ngữ, nhớ theo ngôn ngữ)
    return nap.doc("thanso_phillips_kb.json")


def luan_phillips(
    ho_ten: list[str],
    d: int,
    m: int,
    y: int,
    quy_uoc_pitago: str = "tung_phan",
    nam_xem: int | None = None,
) -> dict:
    """Bài đọc hoàn chỉnh theo trường phái Phillips (Số Chủ Đạo + 4 Đỉnh Kim Tự Tháp + Biểu đồ ngày sinh + Đối chiếu Pitago)."""
    hom_nay = _dt.datetime.now(_dt.timezone(_dt.timedelta(hours=7))).date()
    nam_hien_tai = nam_xem or hom_nay.year
    ngay_xem = hom_nay if nam_hien_tai == hom_nay.year else _dt.date(nam_hien_tai, 12, 31)
    kb = _kb()
    scd = so_chu_dao(d, m, y)
    ktt = bon_dinh_kim_tu_thap(d, m, y, nam_xem=nam_hien_tai, ngay_xem=ngay_xem)
    bieu_do = thanso_mo_rong.bieu_do_ngay_sinh(d, m, y)
    dd_pitago = thanso.duong_doi(d, m, y, quy_uoc_pitago, giu_master=True)

    khac_pitago = str(dd_pitago) != scd["ma"] and not (dd_pitago == 22 and scd["ma"] == "22/4")
    if scd["ma"] == "10" and dd_pitago == 1:
        ly_do_lech = "Phái Phillips dừng ở số 10 (không dùng số 1), còn Pitago rút tiếp 1 + 0 = 1."
    elif scd["so"] == 6 and dd_pitago == 33:
        ly_do_lech = "Phái Phillips không giữ số 33 mà rút tiếp 3 + 3 = 6 (33/6), còn Pitago giữ số bậc thầy 33."
    elif khac_pitago:
        ly_do_lech = f"Phái Phillips cộng ngang tất cả chữ số ngày sinh ra {scd['dang_day_du']}, còn Pitago ({quy_uoc_pitago}) ra {dd_pitago}."
    else:
        ly_do_lech = None

    nghia_scd = kb["so_chu_dao"][scd["ma"]]
    dinh_kem_nghia = [
        {**p, "nghia": kb["dinh_cao"][str(p["so"])]}
        for p in ktt["dinh"]
    ]

    return {
        "phai": "phillips",
        "ten_phai": kb["ten_phai"],
        "gioi_thieu": kb["gioi_thieu"],
        "sach_goc": kb.get("sach_goc"),
        "ho_ten": ho_ten[0],
        "ngay_sinh": f"{d:02d}/{m:02d}/{y}",
        "so_chu_dao": {**scd, "nghia": nghia_scd},
        "kim_tu_thap": {**ktt, "dinh": dinh_kem_nghia},
        "bieu_do": bieu_do,
        "doi_chieu_pitago": {
            "so_pitago": dd_pitago,
            "so_phillips": scd["nhan"],
            "lech": khac_pitago,
            "ly_do": ly_do_lech,
        },
        "luu_y": kb["luu_y"],
    }
