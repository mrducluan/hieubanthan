# -*- coding: utf-8 -*-
"""Chấm độ phủ 4 module Huyền học với kho fixtures/cau_hoi/huyenhoc_cau_hoi.jsonl.

  python scripts/danh_gia_huyenhoc.py            # mốc hệ hiện tại (khai báo tay, đọc code)
  python scripts/danh_gia_huyenhoc.py --v2       # chạy thật qua pipeline hỏi đáp (khi có)

Mức: day_du (đủ CALC + KB + đường xử lý) · mot_phan (có CALC, thiếu KB → LLM phải tự
suy diễn) · khong (thiếu CALC / không có endpoint hỏi đáp / thiếu đường xử lý đặc biệt).
"""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
KHO = GOC / "fixtures" / "cau_hoi" / "huyenhoc_cau_hoi.jsonl"

# Hệ trước HH-1 (sau PR #7): tử vi có lá số iztro, Kinh Dịch có cấu trúc quẻ; không KB, không Q&A.
HIEN_TAI = {
    "calc": {"tv_la_so", "tv_menh", "tv_chinh_tinh", "tv_cung", "tv_tu_hoa", "tv_dai_han",
             "tv_sat_tinh", "kd_que"},
    "kb": set(),
    "hoi_dap": set(),          # module nào có endpoint hỏi đáp
    "xu_ly": set(),
}
KB_KHOI = {"tv_menh", "tv_chinh_tinh", "tv_cung", "tv_tu_hoa", "tv_dai_han", "tv_luu_nien",
           "tv_sat_tinh", "tv_hop_hon", "kd_nghia_ly", "kd_que_nghia", "kd_the_dung",
           "kd_dung_than", "kd_luc_hao", "kd_ung_ky", "kd_vuong_suy", "bt_nhat_chu", "bt_thap_than",
           "bt_ngu_hanh", "bt_dung_than", "bt_dai_van", "bt_luu_nien", "bt_hop", "pt_bat_trach",
           "pt_duong_trach", "pt_loan_dau", "pt_huyen_khong", "pt_menh_quai", "hh_giai_thich"}


def cham(r: dict, kn: dict) -> tuple[str, str]:
    if r["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        return ("day_du", "") if r["xu_ly"] in kn["xu_ly"] else ("khong", f"không có đường {r['xu_ly']}")
    if r["mo_dun"] not in kn["hoi_dap"]:
        return "khong", f"{r['mo_dun']}: chưa có hỏi đáp"
    can = set(r["can"])
    thieu = {c for c in can if c not in kn["calc"] and c not in KB_KHOI} | \
            {c for c in can if c in kn.get("calc_can", set()) and c not in kn["calc"]}
    if thieu:
        return "khong", "thiếu CALC: " + ",".join(sorted(thieu))
    thieu_kb = {c for c in can if c in KB_KHOI} - kn["kb"]
    if thieu_kb:
        return "mot_phan", "thiếu KB: " + ",".join(sorted(thieu_kb))
    return "day_du", ""


# y_dinh (nhãn) → loại câu hỏi mà module Kinh Dịch phải nhận ra
KD_LOAI = {"quyet_dinh": "quyet_dinh", "loi_khuyen": "quyet_dinh", "du_doan": "du_doan",
           "thoi_diem": "du_doan", "giai_thich": "ky_thuat", "mo_ta": "doc_nhanh"}


# chu_de (nhãn) → loại câu hỏi mà module Tử vi phải nhận ra (None = chấp nhận mọi loại có căn cứ)
TV_LOAI = {"hop_hon": {"hop_hon"}, "la_so_con": {"la_so_con"}, "la_so_nguoi_khac": {"nguoi_khac"},
           "tuvi_ky_thuat": {"ky_thuat"}, "dai_han_luu_nien": {"han"}, "han_chi_tiet": {"han"},
           "sao_cung": {"sao_cung"}, "tu_hoa_cung": {"tu_hoa_cung", "sao_cung"}}
TV_CUNG = {"phu_the": {"Phu Thê"}, "tai_bach_dien_trach": {"Tài Bạch", "Điền Trạch"},
           "tat_ach_tinh_than": {"Tật Ách"}, "quan_loc": {"Quan Lộc", "Nô Bộc", "Thiên Di", "Mệnh"}}
SINH_MAU = {"ngay": None, "ti": 6, "gioi_tinh": "nam"}


def cham_tuvi(r: dict) -> tuple[str, str]:
    import datetime as dt  # noqa: PLC0415
    sys.path.insert(0, str(GOC))
    from app.hoidap import tuvi as tv  # noqa: PLC0415
    sinh = {**SINH_MAU, "ngay": dt.date(1990, 5, 17)}
    kq = tv.tra_loi(r["cau_hoi"], r["che_do"], sinh=sinh, ngay_xem=dt.date(2026, 9, 30))
    pl = kq["phan_loai"]
    if r["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        return ("day_du", "") if pl["xu_ly"] == r["xu_ly"] else ("khong", f"sai đường {r['xu_ly']}")
    if pl["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        return "khong", f"chặn nhầm ({pl['xu_ly']})"
    if r["xu_ly"] == "can_them_du_lieu":
        return ("day_du", "") if kq["can_them"] else ("mot_phan", "lẽ ra phải hỏi thêm dữ liệu")
    if kq["do_phu"] != "day_du" or kq["loi_kiem_tra"] or kq["can_them"]:
        return "khong", "không có căn cứ KB"
    muon = TV_LOAI.get(r["chu_de"])
    if muon and pl["loai"] not in muon:
        return "mot_phan", f"lệch loại {r['chu_de']}→{pl['loai']}"
    cung = TV_CUNG.get(r["chu_de"])
    if cung and pl["loai"] == "la_so" and not cung & set(pl["cung"]):
        return "mot_phan", f"lệch cung {r['chu_de']}→{pl['cung']}"
    return "day_du", ""


BT_LOAI = {"bt_ky_thuat": {"ky_thuat"}, "thap_than": {"thap_than_chung"}, "nhat_chu_can": {"nhat_chu_chung"},
           "nhat_chu_mua": {"nhat_chu_chung"}, "bt_hop": {"hop"}, "bt_con": {"con"},
           "dai_van_luu_nien": {"van"}}


def cham_battu(r: dict) -> tuple[str, str]:
    import datetime as dt  # noqa: PLC0415
    sys.path.insert(0, str(GOC))
    from app.hoidap import battu as bh  # noqa: PLC0415
    kq = bh.tra_loi(r["cau_hoi"], sinh={"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"},
                    ngay_xem=dt.date(2026, 9, 30))
    pl = kq["phan_loai"]
    if r["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        return ("day_du", "") if pl["xu_ly"] == r["xu_ly"] else ("khong", f"sai đường {r['xu_ly']}")
    if pl["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        return "khong", f"chặn nhầm ({pl['xu_ly']})"
    if r["xu_ly"] == "can_them_du_lieu":
        return ("day_du", "") if kq["can_them"] else ("mot_phan", "lẽ ra phải hỏi thêm dữ liệu")
    if kq["do_phu"] != "day_du" or kq["loi_kiem_tra"] or kq["can_them"]:
        return "khong", "không có căn cứ KB"
    muon = BT_LOAI.get(r["chu_de"])
    if muon and pl["loai"] not in muon:
        return "mot_phan", f"lệch loại {r['chu_de']}→{pl['loai']}"
    return "day_du", ""


def cham_v2(r: dict) -> tuple[str, str] | None:
    """Chạy thật module đã có hỏi đáp. None = module chưa có (rơi về chấm khai báo)."""
    if r["mo_dun"] == "tuvi":
        return cham_tuvi(r)
    if r["mo_dun"] == "battu":
        return cham_battu(r)
    if r["mo_dun"] != "kinhdich":
        return None
    import datetime as dt  # noqa: PLC0415
    sys.path.insert(0, str(GOC))
    from app.hoidap import kinhdich as kd  # noqa: PLC0415
    kq = kd.tra_loi(r["cau_hoi"], "tu_dong", gia_tri_hao=[7, 7, 8, 7, 7, 9],
                    thoi_diem=dt.datetime(2026, 9, 30, 10, 15))
    pl = kq["phan_loai"]
    if r["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        return ("day_du", "") if pl["xu_ly"] == r["xu_ly"] else ("khong", f"sai đường {r['xu_ly']}")
    if kq["do_phu"] != "day_du" or kq["loi_kiem_tra"]:
        return "khong", "không có căn cứ KB"
    muon = KD_LOAI.get(r["y_dinh"])
    if muon and pl["loai"] not in (muon, "doc_que_da_co") and not (muon == "doc_nhanh" and r["can"] != ["kd_mai_hoa", "kd_the_dung"]):
        return "mot_phan", f"lệch loại {muon}→{pl['loai']}"
    return "day_du", ""


def main() -> None:
    v2 = "--v2" in sys.argv
    rows = [json.loads(l) for l in KHO.open(encoding="utf-8")]
    muc = collections.Counter()
    theo = collections.defaultdict(collections.Counter)
    ly_do = collections.Counter()
    for r in rows:
        kq2 = cham_v2(r) if v2 else None
        m, why = kq2 if kq2 else cham(r, HIEN_TAI)
        muc[m] += 1
        theo[r["mo_dun"]][m] += 1
        if why:
            ly_do[why] += 1
    n = len(rows)
    print(f"== {'v2 (chạy thật)' if v2 else 'Mốc'} Huyền học: {n} câu")
    for k in ("day_du", "mot_phan", "khong"):
        print(f"  {k:9s} {muc[k]:5d}  {100 * muc[k] / n:5.1f}%")
    for md, c in sorted(theo.items()):
        print(f"  {md:10s} {dict(c)}")
    for why, c in ly_do.most_common(int(next((a.split("=")[1] for a in sys.argv if a.startswith("--top=")), 8))):
        print(f"    {c:5d}  {why}")


if __name__ == "__main__":
    sys.exit(main())
