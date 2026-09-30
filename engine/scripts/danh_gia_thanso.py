# -*- coding: utf-8 -*-
"""Chấm độ phủ của hệ thần số với kho câu hỏi (fixtures/cau_hoi/thanso_cau_hoi.jsonl).

Mỗi câu hỏi được xếp một trong bốn mức:
  day_du    có đủ phép tính CALC + nội dung KB đúng lĩnh vực + đường xử lý đúng
            (an toàn / ngoài phạm vi / cần thêm dữ liệu) → trả lời có căn cứ
  mot_phan  có phép tính nhưng KB chỉ có nghĩa chung chung, không theo lĩnh vực
            → LLM phải tự suy diễn (rủi ro bịa, trái luật tầng 4)
  khong     thiếu phép tính, thiếu đầu vào (người thứ hai), hoặc không có đường
            xử lý bắt buộc (câu khủng hoảng chỉ trông vào prompt LLM)
  (khi không bật LLM: mọi câu 'tra_loi' đều thành 'khong' vì Q&A hiện tại
   không có chế độ template)

Chạy:  python scripts/danh_gia_thanso.py [--kha-nang hien_tai|v2] [--json]
"""
from __future__ import annotations

import argparse
import collections
import json
from pathlib import Path

KHO = Path(__file__).resolve().parents[1] / "fixtures" / "cau_hoi" / "thanso_cau_hoi.jsonl"

# Khả năng của hệ HIỆN TẠI (trước v2) — khai báo tay sau khi đọc code:
#   app/calc/thanso.py, app/luangiai/thanso.py, app/kb/data/*.json, app/narrative/llm.py
HIEN_TAI = {
    "calc": {"duong_doi", "su_menh", "linh_hon", "nhan_cach",
             "dinh_cao", "thu_thach", "nam_ca_nhan"},
    # KB chỉ có nghĩa CHUNG của từng số; không có đoạn nào theo lĩnh vực.
    "kb_linh_vuc": set(),
    "kb_khoi": {"duong_doi", "su_menh", "linh_hon", "nhan_cach",
                "dinh_cao", "thu_thach", "nam_ca_nhan"},
    "xu_ly": set(),            # không có đường xử lý tất định nào cho Q&A
    "nguoi_thu_hai": False,    # API /hoi chỉ nhận một người
    "template_khong_llm": False,
}


def kha_nang_v2() -> dict:
    """Khả năng của hệ v2 — đọc thẳng từ code/KB để không khai man."""
    from app.luangiai import hoi as hoi_v2   # noqa: PLC0415  (chỉ có sau v2)
    return hoi_v2.kha_nang()


def cham(r: dict, kn: dict, co_llm: bool) -> tuple[str, str]:
    xl, can = r["xu_ly"], set(r["can"])
    if xl in ("an_toan", "tu_choi_nhe"):
        return ("day_du", "") if xl in kn["xu_ly"] else (
            "khong", f"không có đường xử lý tất định '{xl}'")
    if r["doi_tuong"] in ("nguoi_khac", "hai_nguoi", "con") and not kn["nguoi_thu_hai"]:
        return "khong", "API không nhận dữ liệu người thứ hai"
    if "giai_thich" in can:
        return ("day_du", "") if "giai_thich" in kn["kb_khoi"] else (
            "khong", "KB không có mục giải thích kỹ thuật")
    thieu = can - kn["calc"]
    if thieu:
        return "khong", "thiếu phép tính: " + ",".join(sorted(thieu))
    if not co_llm and not kn["template_khong_llm"]:
        return "khong", "Q&A cần LLM, không có chế độ template"
    thieu_kb = can - kn["kb_khoi"]
    if thieu_kb:
        return "mot_phan", "KB thiếu khối: " + ",".join(sorted(thieu_kb))
    if r["linh_vuc"] not in kn["kb_linh_vuc"]:
        return "mot_phan", f"KB không có nội dung lĩnh vực '{r['linh_vuc']}'"
    return "day_du", ""


def bao_cao(kn: dict, co_llm: bool) -> dict:
    rows = [json.loads(l) for l in KHO.open(encoding="utf-8")]
    muc = collections.Counter()
    theo_lv: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    ly_do = collections.Counter()
    for r in rows:
        m, why = cham(r, kn, co_llm)
        muc[m] += 1
        theo_lv[r["linh_vuc"]][m] += 1
        if why:
            ly_do[why] += 1
    n = len(rows)
    return {
        "tong": n,
        "muc": {k: {"so": v, "ty_le": round(100 * v / n, 1)} for k, v in muc.items()},
        "theo_linh_vuc": {lv: dict(c) for lv, c in sorted(theo_lv.items())},
        "ly_do_hang_dau": ly_do.most_common(15),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kha-nang", default="hien_tai", choices=["hien_tai", "v2"])
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    kn = HIEN_TAI if a.kha_nang == "hien_tai" else kha_nang_v2()
    out = {"co_llm": bao_cao(kn, True), "khong_llm": bao_cao(kn, False)}
    if a.json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return
    for che_do, bc in out.items():
        print(f"== {che_do}: {bc['tong']} câu")
        for k in ("day_du", "mot_phan", "khong"):
            v = bc["muc"].get(k, {"so": 0, "ty_le": 0})
            print(f"  {k:9s} {v['so']:5d}  {v['ty_le']:5.1f}%")
        print("  lý do hàng đầu:")
        for why, c in bc["ly_do_hang_dau"][:10]:
            print(f"    {c:5d}  {why}")


if __name__ == "__main__":
    main()
