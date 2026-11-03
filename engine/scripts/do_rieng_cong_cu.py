# -*- coding: utf-8 -*-
"""AUD-P0 (kiểm toán SEO/GEO 2026-11) — đo "phần riêng" (cụm 6 từ chỉ có ở MỘT trang trong họ) của các họ trang do
ENGINE dựng theo tuổi / năm / cung phi — `kb/do_rieng.py` chỉ đo 13 họ trang kho tri thức. Chỉ BÁO CÁO, không tự noindex.

    python scripts/do_rieng_cong_cu.py [năm]      # năm mặc định 2027

Đo trên chữ JSON engine trả (mọi chuỗi, bỏ khoá kỹ thuật) — trang web có thể rút gọn thêm khối chung (vd AUD-Q1 rút bàn
9 cung và mùng 1 Tết trên trang tuổi còn một câu), nên số trên trang thật còn khác.
"""
from __future__ import annotations

import statistics
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.kb.do_rieng import _cum  # noqa: E402
from app.main import app  # noqa: E402

_BO = {"engine_version", "slug", "duong", "url", "trang_thai", "source_id", "school_id", "ma", "loai", "ngay_dang", "cap_nhat"}


def _chu(o) -> list[str]:
    if isinstance(o, str):
        return [o]
    if isinstance(o, dict):
        return [x for k, v in o.items() if k not in _BO for x in _chu(v)]
    if isinstance(o, list):
        return [x for v in o for x in _chu(v)]
    return []


def do(ho: dict[str, str]) -> dict:
    c = TestClient(app)
    cum = {}
    for ten, duong in ho.items():
        r = c.get(duong)
        if r.status_code == 200:
            cum[ten] = _cum(" ".join(_chu(r.json())).lower().split())
    dem = Counter(x for v in cum.values() for x in v)
    tl = {k: sum(1 for x in v if dem[x] == 1) / max(1, len(v)) for k, v in cum.items()}
    return {"so_trang": len(tl), "thap_nhat": round(min(tl.values()), 3), "trung_vi": round(statistics.median(tl.values()), 3),
            "thap": sorted(tl.items(), key=lambda x: x[1])[:3]}


def main() -> None:
    nam = int(sys.argv[1]) if len(sys.argv) > 1 else 2027
    ns = range(1960, 2006)
    from app.luangiai import phongthuy_tuoi as pt
    ho = {
        "lam_nha": {str(n): f"/v1/tuoi/lam-nha/{nam}/{n}" for n in ns},
        "xong_dat": {str(n): f"/v1/tuoi/xong-dat/{nam}/{n}" for n in ns},
        "nam_tuoi": {str(n): f"/v1/nam/{nam}/tuoi/{n}" for n in ns},
        "tuoi_huong_cu (46 trang năm, đã gộp)": {str(n): f"/v1/phongthuy/tuoi-gop/tuoi-{n}" for n in ns},
        "cung_phi (8 trang mới)": {s: f"/v1/phongthuy/cung-phi/{s}" for _, _, s in pt.CUNG_PHI},
    }
    for ten, h in ho.items():
        print(ten, do(h))


if __name__ == "__main__":
    main()
