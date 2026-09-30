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


def bao_cao_v2() -> dict:
    """Hệ v2 chấm bằng CHẠY THẬT từng câu qua pipeline (không khai báo tay).

      day_du    có căn cứ KB (hoặc đúng đường xử lý đặc biệt), đúng lĩnh vực,
                câu trả lời qua được bộ kiểm tra đầu ra
      mot_phan  có căn cứ nhưng phân loại lệch lĩnh vực so với nhãn
      khong     không có mục KB nào / sai đường xử lý bắt buộc / lỗi kiểm tra
    """
    import datetime as dt  # noqa: PLC0415
    import sys  # noqa: PLC0415
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from app.narrative import hoi_van  # noqa: PLC0415

    nguoi = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988}
    kia = {"ho_ten": ["Trần Thị Mai"], "ngay": 13, "thang": 5, "nam": 1990}
    rows = [json.loads(l) for l in KHO.open(encoding="utf-8")]
    muc = collections.Counter()
    theo_lv: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    ly_do = collections.Counter()
    khoi = collections.Counter()
    for r in rows:
        kq = hoi_van.tra_loi(r["cau_hoi"], nguoi, kia, dt.date(2026, 9, 30), dung_llm=False)
        pl = kq["phan_loai"]
        for m in kq["bang_chung"]["muc"]:
            khoi[m["loai"]] += 1
        dac_biet = r["xu_ly"] in ("an_toan", "tu_choi_nhe")
        if dac_biet and pl["xu_ly"] != r["xu_ly"]:
            m_, why = "khong", f"sai đường xử lý bắt buộc {r['xu_ly']}"
        elif kq["do_phu"] != "day_du":
            m_, why = "khong", f"không có mục KB ({r['linh_vuc']})"
        elif kq["loi_kiem_tra"]:
            m_, why = "khong", "câu trả lời không qua bộ kiểm tra"
        elif pl["linh_vuc"] != r["linh_vuc"]:
            m_, why = "mot_phan", f"lệch lĩnh vực {r['linh_vuc']}→{pl['linh_vuc']}"
        else:
            m_, why = "day_du", ""
        muc[m_] += 1
        theo_lv[r["linh_vuc"]][m_] += 1
        if why:
            ly_do[why] += 1
    n = len(rows)
    return {
        "tong": n,
        "muc": {k: {"so": v, "ty_le": round(100 * v / n, 1)} for k, v in muc.items()},
        "theo_linh_vuc": {lv: dict(c) for lv, c in sorted(theo_lv.items())},
        "ly_do_hang_dau": ly_do.most_common(15),
        "khoi_kb_duoc_dung": dict(khoi.most_common()),
    }


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
    if a.kha_nang == "v2":
        out = {"v2_khong_llm": bao_cao_v2()}
    else:
        out = {"co_llm": bao_cao(HIEN_TAI, True), "khong_llm": bao_cao(HIEN_TAI, False)}
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
