#!/usr/bin/env python
"""EN-ALL mục 5.3 — chấm hỏi đáp TIẾNG ANH của một mảng trên bộ câu viết độc lập (fixtures/cau_hoi/en/<mảng>_{dev,holdout}.jsonl).

Đo: định tuyến (nhãn ý định của câu ↔ phân loại engine, bảng ánh xạ dưới), xử lý an toàn (an_toan / tu_choi_nhe đúng),
mốc thời gian (năm engine đọc ↔ năm nhãn), câu trả lời có chữ Việt hay không. Holdout chỉ in TỔNG (không in từng câu).
Dùng: python scripts/cham_en.py battu [--holdout] [--sai]
"""
from __future__ import annotations

import collections
import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from tests import _dau_ra as dr  # noqa: E402

# chủ đề / loại engine Bát tự → nhãn ý định của bộ câu (một chủ đề engine có thể khớp nhiều nhãn)
ANH_XA = {
    "battu": {
        "loai": {"ky_thuat": {"ky_thuat"}, "thap_than_chung": {"ky_thuat"}, "nhat_chu_chung": {"ky_thuat"},
                 "hop": {"nguoi_khac", "tinh_cam"}, "nguoi_khac": {"nguoi_khac"}, "con": {"nguoi_khac", "gia_dinh"},
                 "sinh_con_tuoi": {"gia_dinh"}, "van": {"van"}},
        "chu_de": {"nghe_tien": {"su_nghiep", "tien_bac"}, "hon_nhan": {"tinh_cam"}, "con_cai": {"gia_dinh"},
                   "gia_dinh": {"gia_dinh"}, "ngu_hanh": {"ngu_hanh"}, "loi_song": {"suc_khoe", "ngu_hanh"},
                   "hoc_hanh": {"hoc_hanh"}, "tinh_cach": {"ban_than"}, "thap_than": {"ban_than"}, "cach_cuc": {"ban_than"},
                   "tru": {"ban_than"}, "cung_than": {"ban_than"}, "than_sat": {"ban_than"}, "than_sat_tk": {"ban_than"},
                   "hau_van": {"van"}, "quan_he": {"tinh_cam", "gia_dinh", "su_nghiep"}, "phap_ly": {"tien_bac", "su_nghiep"},
                   "di_xa": {"van", "su_nghiep"}, "an_toan": {"suc_khoe"}, "xung_hop": {"ban_than", "nguoi_khac"},
                   "suc_khoe": {"suc_khoe"}},
    },
}
ROUTE = {"battu": "/v1/battu/hoi"}


def cham(mo_dun: str, holdout: bool = False, in_sai: bool = False) -> dict:
    p = GOC / "fixtures" / "cau_hoi" / "en" / f"{mo_dun}_{'holdout' if holdout else 'dev'}.jsonl"
    cau = [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    c = dr.may_khach()
    ls = dr._ls("1990-05-17", "08:30", "nam")
    ax = ANH_XA[mo_dun]
    dem = collections.Counter()
    sai = []
    with dr.dong_bang():
        for q in cau:
            r = c.post(ROUTE[mo_dun], json={"cau_hoi": q["cau_hoi"], "la_so": ls, "ngay_xem": "2026-11-10"},
                       headers={"x-ngon-ngu": "en"}).json()
            pl = r.get("phan_loai") or {}
            dem["tong"] += 1
            xu_ly_dung = pl.get("xu_ly") in q["xu_ly"]
            if q["nhan"][0] == "dac_biet" or set(q["xu_ly"]) & {"an_toan", "tu_choi_nhe"}:
                dem["an_toan_tong"] += 1
                dem["an_toan_dung"] += xu_ly_dung
                ok = xu_ly_dung
            else:
                nhan = ax["loai"].get(pl.get("loai")) or ax["chu_de"].get(pl.get("chu_de")) or set()
                ok = bool(nhan & set(q["nhan"]))
                dem["chan_nham"] += pl.get("xu_ly") in ("an_toan", "tu_choi_nhe")
            dem["dinh_tuyen"] += ok
            if q.get("nam"):
                dem["moc_tong"] += 1
                dem["moc_dung"] += pl.get("nam_xem") == q["nam"] or str(q["nam"]) in json.dumps(r.get("cau_tra_loi"), ensure_ascii=False)
            if dr.loi_en({"t": r.get("cau_tra_loi")}, {"q": q["cau_hoi"]}):
                dem["con_chu_viet"] += 1
            if not ok:
                sai.append((q["id"], q["nhan"], pl.get("loai"), pl.get("chu_de"), pl.get("xu_ly"), q["cau_hoi"]))
    kq = {"tong": dem["tong"], "dinh_tuyen": round(dem["dinh_tuyen"] / dem["tong"], 3),
          "an_toan": f"{dem['an_toan_dung']}/{dem['an_toan_tong']}", "chan_nham": dem["chan_nham"],
          "moc_thoi_gian": f"{dem['moc_dung']}/{dem['moc_tong']}", "tra_loi_con_chu_viet": dem["con_chu_viet"]}
    if in_sai and not holdout:
        kq["sai"] = sai
    return kq


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    kq = cham(a[0] if a else "battu", "--holdout" in sys.argv, "--sai" in sys.argv)
    for s in kq.pop("sai", []):
        print(*s, sep=" | ")
    print(json.dumps(kq, ensure_ascii=False))
