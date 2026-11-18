# -*- coding: utf-8 -*-
"""Tầng CALC — nhận diện CÁCH CỤC trên một bàn Kỳ Môn đã lập (`ky_mon.ban_gio` / `ky_mon.lap_ban`). Thuần, tất định.

Chỉ nhận các cách sách nêu ĐIỀU KIỆN rõ và có ví dụ «假令…» để thử (Cảnh Hựu Độn Giáp Phù Ứng Kinh toản — quyển 705;
Yên Ba Điếu Tẩu Ca chú giải — quyển 703–704). Mỗi cách ghi tên thiên làm gốc ở `CACH[mã]["thien"]`.
Không chấm điểm, không gộp tốt xấu — việc đọc là của tầng RULES.
"""
from __future__ import annotations

from app.calc.ky_mon import CAN

KY = ("Ất", "Bính", "Đinh")
CUA_CAT = (6, 1, 8)                       # Khai, Hưu, Sinh — «開休生三門宜出其下»

# cửa (số cung gốc) → các cung nó khắc («門制其宮則為迫»)
MON_BACH = {6: (3, 4), 1: (9,), 8: (1,), 9: (6, 7), 3: (2, 8), 4: (2, 8), 2: (1,), 7: (3, 4)}
# tuần (0 = Giáp Tý … 5 = Giáp Dần) → cung trực phù tới thì «kích hình» (Vương Chương)
KICH_HINH = {0: 3, 1: 2, 2: 8, 3: 9, 4: 4, 5: 4}
# tam kỳ nhập mộ theo cung (Vương Chương: Ất → Khôn, Bính → Càn, Đinh → Càn)
KY_MO = {"Ất": 2, "Bính": 6, "Đinh": 6}
# can thiên bàn gia can địa bàn → mã cách
_CAN_GIA = {("Ất", "Tân"): "thanh_long_dao_tau", ("Tân", "Ất"): "bach_ho_xuong_cuong",
            ("Đinh", "Quý"): "chu_tuoc_dau_giang", ("Quý", "Đinh"): "dang_xa_yeu_kieu",
            ("Bính", "Canh"): "huynh_nhap_bach", ("Canh", "Bính"): "bach_nhap_huynh"}

CACH = {
    "ky_mon_hoi_hop": {"loai": "cat", "pham_vi": "cung", "thien": "煙波釣叟歌句解 (開休生 合 乙丙丁)"},
    "thien_don": {"loai": "cat", "pham_vi": "cung", "thien": "釋天遁甲"},
    "dia_don": {"loai": "cat", "pham_vi": "cung", "thien": "釋地遁甲"},
    "nhan_don": {"loai": "cat", "pham_vi": "cung", "thien": "釋人遁甲"},
    "thanh_long_phan_thu": {"loai": "cat", "pham_vi": "cung", "thien": "釋青龍反首"},
    "phi_dieu_diet_huyet": {"loai": "cat", "pham_vi": "cung", "thien": "釋飛烏跌穴"},
    "ngoc_nu_thu_mon": {"loai": "cat", "pham_vi": "cung", "thien": "三奇得使圖 (玉女守門)"},
    "thanh_long_dao_tau": {"loai": "hung", "pham_vi": "cung", "thien": "釋青龍逃走"},
    "bach_ho_xuong_cuong": {"loai": "hung", "pham_vi": "cung", "thien": "釋白虎猖狂"},
    "chu_tuoc_dau_giang": {"loai": "hung", "pham_vi": "cung", "thien": "釋朱雀投江"},
    "dang_xa_yeu_kieu": {"loai": "hung", "pham_vi": "cung", "thien": "釋螣蛇夭矯"},
    "huynh_nhap_bach": {"loai": "hung", "pham_vi": "cung", "thien": "釋熒惑入太白"},
    "bach_nhap_huynh": {"loai": "hung", "pham_vi": "cung", "thien": "釋太白入熒惑"},
    "ky_nhap_mo": {"loai": "hung", "pham_vi": "cung", "thien": "釋三奇入墓"},
    "mon_bach": {"loai": "hung", "pham_vi": "cung", "thien": "釋門迫"},
    "luc_nghi_kich_hinh": {"loai": "hung", "pham_vi": "cung", "thien": "釋六儀擊刑"},
    "phuc_ngam": {"loai": "hung", "pham_vi": "gio", "thien": "釋伏吟"},
    "phan_ngam": {"loai": "hung", "pham_vi": "gio", "thien": "釋反吟"},
    "cua_phuc_ngam": {"loai": "hung", "pham_vi": "gio", "thien": "釋伏吟"},
    "cua_phan_ngam": {"loai": "hung", "pham_vi": "gio", "thien": "釋反吟"},
    "ngu_bat_ngo": {"loai": "hung", "pham_vi": "gio", "thien": "煙波釣叟歌句解下 (五不遇時)"},
}


def _mot(ma: str, cung: int | None = None, **them) -> dict:
    return {"ma": ma, "loai": CACH[ma]["loai"], "pham_vi": CACH[ma]["pham_vi"], **({"cung": cung} if cung else {}), **them}


def nhan_dien(ban: dict, can_ngay: str | None = None) -> list[dict]:
    """Các cách cục có trên bàn `ban`. `can_ngay` (tên can) chỉ để xét «ngũ bất ngộ thời»; thiếu thì bỏ qua cách ấy.

    Thứ tự trả: cách của cả giờ trước, rồi từng cung 1 → 9 (bỏ cung giữa)."""
    kq: list[dict] = []
    cung = ban["cung"]
    gio = ban["gio"]
    phu, su = ban["truc_phu"], ban["truc_su"]
    nha_phu = 2 if phu["sao_so"] == 5 else phu["sao_so"]

    if phu["cung"] == nha_phu:
        kq.append(_mot("phuc_ngam"))
    elif phu["cung"] + nha_phu == 10:
        kq.append(_mot("phan_ngam"))
    if su["cung"] == su["cua_so"]:
        kq.append(_mot("cua_phuc_ngam"))
    elif su["cung"] + su["cua_so"] == 10:
        kq.append(_mot("cua_phan_ngam"))
    if can_ngay is not None and CAN[(CAN.index(can_ngay) + 6) % 10] == CAN[gio % 10]:
        kq.append(_mot("ngu_bat_ngo"))                    # can giờ khắc can ngày, cùng âm dương

    for k in (1, 2, 3, 4, 6, 7, 8, 9):
        o = cung[k]
        tren = [o["thien_ban"]] + ([o["thien_ban_ky"]] if o.get("thien_ban_ky") else [])
        duoi = o["dia_ban"]
        cua = o["cua_so"]
        if cua in CUA_CAT:
            for ky in KY:
                if ky in tren:
                    kq.append(_mot("ky_mon_hoi_hop", k, ky=ky))
        if cua == 8 and "Bính" in tren and duoi == "Đinh":
            kq.append(_mot("thien_don", k))
        if cua == 6 and "Ất" in tren and duoi == "Kỷ":
            kq.append(_mot("dia_don", k))
        if cua == 1 and "Đinh" in tren and o["than_ma"] == "am":
            kq.append(_mot("nhan_don", k))
        if k == phu["cung"] and duoi == "Bính":           # Giáp (ẩn dưới nghi của tuần, đi cùng trực phù) gia Bính
            kq.append(_mot("thanh_long_phan_thu", k))
        if "Bính" in tren and duoi == ban["tuan_nghi"] and k != phu["cung"]:
            kq.append(_mot("phi_dieu_diet_huyet", k))     # Bính gia lên chỗ Giáp của tuần đang ẩn
        if k == su["cung"] and duoi == "Đinh":
            kq.append(_mot("ngoc_nu_thu_mon", k))
        for tr in tren:
            if (tr, duoi) in _CAN_GIA:
                kq.append(_mot(_CAN_GIA[(tr, duoi)], k))
            if KY_MO.get(tr) == k:
                kq.append(_mot("ky_nhap_mo", k, ky=tr))
        if k in MON_BACH[cua]:
            kq.append(_mot("mon_bach", k))
        if k == phu["cung"] and KICH_HINH[gio // 10] == k:
            kq.append(_mot("luc_nghi_kich_hinh", k))
    return kq
