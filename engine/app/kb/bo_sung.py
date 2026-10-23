# -*- coding: utf-8 -*-
"""SEO-M (chủ dự án duyệt 2026-10-23) — nội dung bổ sung cho trang kiến thức mỏng.

Nguồn là KB (git): `data/bo_sung_<loai>.json`, mỗi tệp một họ trang, có `source_id`, `school_id`, `trang_thai`.
Mỗi trang (theo slug) có thể có:
  - `muc`: mục mới {tieu_de, doan?, danh_sach?} — trả lời trước ở câu đầu của `doan`;
  - `bang`: một bảng thật {tieu_de, chu_thich?, cot: [..], dong: [[..], ..]};
  - `hoi_dap`: câu hỏi thêm (trùng câu hỏi cũ thì bỏ);
  - `trich_dan`: nguồn cổ thư/sách {sach, chuong?, nguyen_van?, phien_am?, nghia?} — nguyên văn ≤ 2 câu;
  - `y_chinh`: 3–5 ý ngắn (≤ 90 ký tự) cho ảnh infographic.
Trang thuộc chuyên gia tự viết (loại "so") → mục bổ sung gắn `bien_tap: True` để web ghi "Ban biên tập bổ sung"
(EEAT-1: không ghi chuyên gia là tác giả phần họ không viết). Không gọi LLM, không sinh nghĩa mới lúc chạy.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

THU_MUC = Path(__file__).resolve().parent / "data"
LOAI = ("thap_than", "nhat_chu", "nam_ca_nhan", "no_nghiep", "tinh_yeu", "nghe", "so", "so_kep", "cap_so", "hoa_cung")
# Họ trang do chuyên gia tự viết (EEAT-1) — phần bổ sung ghi rõ do ban biên tập soạn.
LOAI_TAC_GIA = ("so",)


@lru_cache(maxsize=None)
def doc(loai: str) -> dict | None:
    p = THU_MUC / f"bo_sung_{loai}.json"
    return json.loads(p.read_text("utf-8")) if p.exists() else None


def _nguon(td: dict) -> str:
    return td["sach"] + (f", {td['chuong']}" if td.get("chuong") else "")


def ap(t: dict) -> dict:
    """Ghép phần bổ sung (nếu có) vào trang đã dựng; không có thì trả nguyên trang."""
    kb = doc(t["loai"])
    bs = (kb or {}).get("trang", {}).get(t["slug"])
    if not bs:
        return t
    bien_tap = t["loai"] in LOAI_TAC_GIA
    them = [{**m, **({"bien_tap": True} if bien_tap else {})} for m in bs.get("muc", [])]
    if bs.get("bang"):
        b = bs["bang"]
        them.append({"tieu_de": b["tieu_de"], **({"doan": b["chu_thich"]} if b.get("chu_thich") else {}),
                     "bang": {"cot": b["cot"], "dong": b["dong"]}, **({"bien_tap": True} if bien_tap else {})})
    if bs.get("trich_dan"):
        them.append({"tieu_de": "Sách xưa nói gì", "trich_dan": bs["trich_dan"],
                     **({"bien_tap": True} if bien_tap else {})})
    # Thêm sau nội dung gốc; nếu mục cuối là "Câu hỏi tự soi" thì chèn trước nó để tự soi vẫn đứng cuối bài.
    # (Không chèn giữa các mục gốc — thứ tự mục gốc giữ nguyên.)
    muc = list(t["muc"])
    i = len(muc) - 1 if muc and muc[-1]["tieu_de"].lower().startswith("câu hỏi tự soi") else len(muc)
    t["muc"] = muc[:i] + them + muc[i:]
    co = {h["hoi"].strip().lower() for h in t["hoi_dap"]}
    t["hoi_dap"] = t["hoi_dap"] + [h for h in bs.get("hoi_dap", []) if h["hoi"].strip().lower() not in co]
    t["nguon"] = list(dict.fromkeys([*t["nguon"], *(_nguon(x) for x in bs.get("trich_dan", []))]))
    if bs.get("y_chinh"):
        t["y_chinh"] = bs["y_chinh"]
    t["trich_dan"] = bs.get("trich_dan", [])
    return t


def boc(dung):
    """Bọc hàm dựng trang: (ten, slug) → trang đã ghép bổ sung."""
    def f(*a):
        return ap(dung(*a))
    f.__wrapped__ = dung
    return f
