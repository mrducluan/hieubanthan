# -*- coding: utf-8 -*-
"""TS-V3 — luận thần số Qabalah Hermetic (RULES + NARRATIVE template, không LLM).

CALC `calc/thanso_kabbalah` ra con số; KB `thanso_kabbalah.json` cho nghĩa 22 chữ / con đường và 10 Sephirah. Mỗi số
kèm vết tính (chữ → chữ Hebrew → giá trị), nghĩa (có mặt tối + câu tự soi), độ nhạy của bảng chuyển chữ và đối chiếu
với Đường đời phái Pitago. KB thiếu mục → None, tầng hiển thị im lặng.
"""
from __future__ import annotations

from app.calc import thanso, thanso_kabbalah as kc
from app.kb import thanso_v2 as kb


def _vet(kq: dict) -> str:
    phan = [" + ".join(f"{c['chu']}={c['hebrew']}({c['so']})" for c in t["chu"]) + f" = {t['tong']}" for t in kq["theo_tu"]]
    return " · ".join(phan) + f" → tổng {kq['tong']}"


def _rut(tong: int, dich: int) -> str:
    buoc, n = [tong], tong
    while n > dich:
        n = sum(int(c) for c in str(n))
        buoc.append(n)
    return " → ".join(map(str, buoc))


def luan_kabbalah(ho_ten: list[str], ngay: int, thang: int, nam: int, quy_uoc: str = "tong_het") -> dict:
    ten = ho_ten[0]
    kq = kc.tinh(ten, ngay, thang, nam)
    dd = thanso.duong_doi(ngay, thang, nam, quy_uoc)
    goc_dd = {11: 2, 22: 4, 33: 6}.get(dd, dd)
    cac_so = [
        {"ma": "con_duong_ten", "ten": "Con đường của tên", "so": kq["con_duong"], "so_duong_cay": kq["so_duong_cay"],
         "mo_ta": (f"Gematria cả họ tên, rút về 1–22 → chữ Hebrew thứ {kq['con_duong']}"
                   + (f" ({kq['chu_con_duong']}) — con đường số {kq['so_duong_cay']} trên Cây Sự sống." if kq["con_duong"] else ".")),
         "cach_tinh": f"{_vet(kq)} → {_rut(kq['tong'], 22)}", "nghia": kb.kabbalah_chu(kq["con_duong"]),
         "khac": kq["con_duong_khac"]},
        {"ma": "sephirah_ten", "ten": "Sephirah của tên", "so": kq["sephirah_ten"],
         "mo_ta": "Cùng gematria của tên, rút về 1–10 — sắc thái bạn thể hiện ra ngoài.",
         "cach_tinh": f"Tổng {kq['tong']} → {_rut(kq['tong'], 10)}", "nghia": kb.kabbalah_sephirah(kq["sephirah_ten"])},
        {"ma": "sephirah_ngay_sinh", "ten": "Sephirah của ngày sinh", "so": kq["sephirah_ngay_sinh"],
         "mo_ta": "Cộng mọi chữ số ngày, tháng, năm sinh, rút về 1–10 — \"trạm\" bạn hay trở về.",
         "cach_tinh": f"{' + '.join(f'{ngay}{thang}{nam}')} = {kq['tong_ngay_sinh']} → {_rut(kq['tong_ngay_sinh'], 10)}",
         "nghia": kb.kabbalah_sephirah(kq["sephirah_ngay_sinh"]),
         # Sephirah 10 (Malkuth) không có số 1–9 tương ứng → không so (cùng quy ước với trang Tổng hợp).
         "pitago": {"ten": "Đường đời", "so": dd, "trung": kq["sephirah_ngay_sinh"] == goc_dd,
                    "so_sanh_duoc": kq["sephirah_ngay_sinh"] <= 9}},
    ]
    meta = kb.meta_kabbalah()
    return {
        "phai": "kabbalah",
        "ten_chinh": ten,
        "ngay_sinh": f"{ngay:02d}/{thang:02d}/{nam}",
        "gioi_thieu": kb.kabbalah_gioi_thieu(),
        "cac_so": cac_so,
        "bang_chuyen_chu": {**{k: f"{v} ({kc.GIA_TRI[v]})" for k, v in kc.CHU_GHEP.items()},
                            **{k: f"{v} ({kc.GIA_TRI[v]})" for k, v in kc.CHU_DON.items()}},
        "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
        "trang_thai": meta["trang_thai"],
        "luu_y": "Thần số học là góc nhìn văn hoá để tự soi, không phải dự báo. Ba phái tính khác nhau nên có thể ra số khác nhau.",
    }
