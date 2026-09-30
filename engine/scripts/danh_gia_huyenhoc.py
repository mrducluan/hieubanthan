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


def main() -> None:
    rows = [json.loads(l) for l in KHO.open(encoding="utf-8")]
    muc = collections.Counter()
    theo = collections.defaultdict(collections.Counter)
    ly_do = collections.Counter()
    for r in rows:
        m, why = cham(r, HIEN_TAI)
        muc[m] += 1
        theo[r["mo_dun"]][m] += 1
        if why:
            ly_do[why] += 1
    n = len(rows)
    print(f"== Mốc Huyền học: {n} câu")
    for k in ("day_du", "mot_phan", "khong"):
        print(f"  {k:9s} {muc[k]:5d}  {100 * muc[k] / n:5.1f}%")
    for md, c in sorted(theo.items()):
        print(f"  {md:10s} {dict(c)}")
    for why, c in ly_do.most_common(8):
        print(f"    {c:5d}  {why}")


if __name__ == "__main__":
    sys.exit(main())
