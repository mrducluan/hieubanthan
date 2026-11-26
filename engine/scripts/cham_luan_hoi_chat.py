# -*- coding: utf-8 -*-
"""Chấm thẻ "luận hỏi" + khối "gỡ nút" trong hỏi đáp Tử vi / Bát tự trên bộ câu đóng băng (nhãn viết độc lập).

Chạy: python scripts/cham_luan_hoi_chat.py [dev|holdout] [-v]
Chỉ số quan trọng nhất là GẮN SAI (thẻ hiện cho câu nhãn null): thẻ dự đoán nói ngược đời thật người hỏi."""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

GOC = Path(__file__).resolve().parents[1] / "fixtures" / "cau_hoi"
LA_SO = {"birth_date": "1990-05-15", "birth_time": "08:30", "gender": "nam", "noi_sinh": "ha-noi"}


def cham(tap: str = "dev", in_ra: bool = False) -> dict:
    c = TestClient(app)
    dong = [json.loads(x) for x in (GOC / f"luan_hoi_chat_{tap}.jsonl").read_text(encoding="utf-8").splitlines() if x.strip()]
    kq = collections.Counter()
    loi: list[str] = []
    for d in dong:
        r = c.post(f"/v1/{d['mo_dun']}/hoi", json={"cau_hoi": d["cau"], "la_so": LA_SO, "ngay_xem": "2026-11-10"}).json()
        lh = r.get("luan_hoi") or {}
        co_lh = f"{lh['chuong']}.{lh['ma']}" if lh else None
        gn = (r.get("go_nut_doi_song") or {}).get("ma")
        for ten, mong, that in (("the", d["luan_hoi"], co_lh), ("go_nut", d["go_nut"], gn)):
            if mong is None and that is None:
                kq[f"{ten}.dung_khong_gan"] += 1
            elif mong is None:
                kq[f"{ten}.GAN_SAI"] += 1
                kq[f"{ten}.GAN_SAI.{d['nhom']}"] += 1
                loi.append(f"[{ten} GẮN SAI] {d['id']} {d['nhom']}: {d['cau']} → {that}")
            elif that == mong:
                kq[f"{ten}.dung"] += 1
            elif that is None:
                kq[f"{ten}.bo_sot"] += 1
                loi.append(f"[{ten} bỏ sót] {d['id']}: {d['cau']} (cần {mong})")
            else:
                kq[f"{ten}.SAI_MA"] += 1
                loi.append(f"[{ten} SAI MÃ] {d['id']}: {d['cau']} → {that} (cần {mong})")
    if in_ra:
        print("\n".join(loi))
    return {"tap": tap, "so_cau": len(dong), **dict(sorted(kq.items()))}


if __name__ == "__main__":
    tap = next((a for a in sys.argv[1:] if not a.startswith("-")), "dev")
    print(json.dumps(cham(tap, "-v" in sys.argv), ensure_ascii=False, indent=1))
