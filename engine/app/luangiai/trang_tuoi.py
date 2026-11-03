# -*- coding: utf-8 -*-
"""AUD-P1 (kiểm toán SEO/GEO 2026-11) — gói dữ liệu TRANG SEO theo tuổi (GET công khai), tầng RULES, tất định.

Trang tuổi (làm nhà · xông đất · Tử vi năm theo tuổi) cũ kèm nguyên dữ kiện CHUNG của cả năm (bàn 9 cung, mùng 1 Tết
đầy đủ, câu cách tính, ý nghĩa bốn sao hoá) → 46 trang cùng năm giống nhau 88–94 % (đo `scripts/do_rieng_cong_cu.py`).
Ở đây: phần chung chỉ còn bản gọn (trang năm có bản đầy đủ, web link sang), thêm dữ kiện RIÊNG của tuổi đó:
- làm nhà: 10 năm tới của tuổi (tuổi mụ, Kim lâu, Hoang ốc, Tam tai, năm thuận) — đúng `xem_tuoi_lam_nha` từng năm;
- xông đất: tuổi hợp cho bốn Tết kế tiếp — đúng `xong_dat_luan` từng năm;
- Tử vi năm theo tuổi: 10 năm tới (quan hệ địa chi, Tam tai, Kim lâu, sao hạn hai giới) — đúng `theo_tuoi` từng năm;
  sao hạn chỉ còn tên + hạn (lời giải thích, việc nên làm ở trang sao hạn năm — giống hệt mọi tuổi cùng sao), bỏ câu
  hỏi đáp lặp nguyên câu rào chung (câu rào vẫn ở `ranh_gioi`).
Đo bằng `scripts/do_rieng_cong_cu.py` (năm 2027, phần riêng thấp nhất): làm nhà 0,07 → 0,31 · xông đất 0,04 → 0,12 ·
Tử vi theo tuổi 0,11 → 0,19. Hai họ sau còn thấp vì lời giải thích từng mối hợp / xung và lý do từng tuổi hợp lặp giữa
các tuổi cùng con giáp — đó là phần người đọc cần, không xoá để chạy theo con số.
Không phép tính mới. Công cụ (POST) vẫn dùng gói đầy đủ.
"""
from __future__ import annotations

from app.luangiai import nam_tong_quan as NTQ
from app.luangiai import tuoi_dan_gian as L

MUOI_NAM, TET_TOI, NAM_TOI = 10, 4, 10


def _han_nam_gon(h: dict) -> dict:
    return {"nam": h["nam"], "can_chi": h["can_chi"],
            "huong_tranh": [{"ma": x["ma"], "ten": x["ten"], "phuong": x["phuong"]} for x in h["huong_tranh"]]}


def lam_nha(nam: int, nam_sinh: int) -> dict:
    d = L.xem_tuoi_lam_nha(nam_sinh, nam)
    d = {k: v for k, v in d.items() if k != "cach_tinh"}
    d["han_nam"] = _han_nam_gon(d["han_nam"])
    muoi = []
    for y in range(nam, min(nam + MUOI_NAM, 2100)):
        g = L.xem_tuoi_lam_nha(nam_sinh, y)
        muoi.append({"nam": y, "can_chi": g["can_chi_nam_xay"], "tuoi_mu": g["tuoi_mu"],
                     "kim_lau": g["kim_lau"]["ten"] if g["kim_lau"] else None, "hoang_oc": g["hoang_oc"]["ten"],
                     "tam_tai": g["tam_tai"]["nam_thu"] if g["tam_tai"] else None, "thuan": g["ket_luan"]["ma"] == "thuan"})
    d["muoi_nam"] = muoi
    return d


def xong_dat(nam: int, nam_sinh: int) -> dict:
    d = L.xong_dat_luan(nam, nam_sinh)
    d = {k: v for k, v in d.items() if k != "cach_chon"}
    m = d["mung_mot"]
    d["mung_mot"] = {"ngay": m["ngay"], "can_chi": m["can_chi"], "hoang_dao": m["hoang_dao"]}
    tet = []
    for y in range(nam + 1, min(nam + 1 + TET_TOI, 2100)):
        g = L.xong_dat_luan(y, nam_sinh)
        tet.append({"nam": y, "can_chi": g["nam"]["can_chi"],
                    "tuoi": [{"nam_sinh": h["nam_sinh"], "can_chi": h["can_chi"]} for h in g["tuoi_hop"][:4]]})
    d["tet_toi"] = tet
    return d


_TEN_QH = {"tam_hop": "tam hợp", "luc_hop": "lục hợp", "trung": "năm tuổi", "xung": "xung", "hinh": "hình", "hai": "hại"}


def nam_tuoi(nam: int, nam_sinh: int) -> dict:
    d = NTQ.theo_tuoi(nam, nam_sinh)
    d["tu_hoa"] = [{"hoa": h["hoa"], "sao": h["sao"]} for h in d["tu_hoa"]]
    d["sao"] = {g: ({"ten": x["ten"], "han": x["han"]} if x else None) for g, x in d["sao"].items()}
    d["hoi_dap"] = [h for h in d["hoi_dap"] if h["dap"] != d["ranh_gioi"]]
    toi = []
    for y in range(nam + 1, min(nam + 1 + NAM_TOI, 2100)):
        g = NTQ.theo_tuoi(y, nam_sinh)
        toi.append({"nam": y, "can_chi": g["can_chi_nam"], "tuoi_mu": g["tuoi_mu"],
                    "dia_chi": _TEN_QH.get(g["quan_he"]["chi"]), "tam_tai": g["tam_tai"],
                    "kim_lau": g["kim_lau"],
                    "sao_nam": (g["sao"]["nam"] or {}).get("ten"), "sao_nu": (g["sao"]["nu"] or {}).get("ten")})
    d["nam_toi"] = toi
    return d
