# -*- coding: utf-8 -*-
"""PT-V0 — bộ đánh giá "ảnh nhà → bố cục" (chuẩn bị cho PT-V2).

Mỗi bộ ảnh là một thư mục trong fixtures/phongthuy_anh/<ma_bo>/ gồm:
  nhan.json     bố cục gán tay (schema app/schemas/bo_cuc.schema.json) — ĐÁP ÁN
  meta.json     mã bộ, số ảnh, xác nhận đồng ý của chủ nhà, loại phòng có trong ảnh
  du_doan.json  (khi đã có PT-V2) bố cục do model thị giác trích ra
Ảnh KHÔNG nằm trong git (xem .gitignore) — để ở Drive của chủ dự án.

  python scripts/danh_gia_bo_cuc.py --kiem              # kiểm mọi nhan.json đúng schema + meta đủ trường
  python scripts/danh_gia_bo_cuc.py                     # chấm du_doan.json so với nhan.json
Tiêu chí PT-V2 (docs/LO-TRINH-PHONG-THUY-HINH-ANH.md): ≥ 90% mục đúng.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.luangiai.phongthuy_bo_cuc import DAU_HIEU, BoCuc  # noqa: E402

GOC = Path(__file__).resolve().parents[1] / "fixtures" / "phongthuy_anh"
META_CAN = ("ma_bo", "so_anh", "dong_y", "loai_phong")


def _doc(p: Path) -> dict:
    return json.loads(p.read_text(encoding="utf-8"))


def kiem(goc: Path = GOC) -> list[str]:
    loi = []
    for d in sorted(x for x in goc.iterdir() if x.is_dir()):
        try:
            BoCuc.model_validate(_doc(d / "nhan.json"))
        except Exception as e:  # noqa: BLE001
            loi.append(f"{d.name}/nhan.json: {str(e)[:200]}")
        m = _doc(d / "meta.json") if (d / "meta.json").exists() else {}
        thieu = [k for k in META_CAN if k not in m]
        if thieu:
            loi.append(f"{d.name}/meta.json thiếu: {', '.join(thieu)}")
    return loi


def cham_mot(nhan: dict, du: dict) -> dict:
    """So một bộ: dấu hiệu (có/không, chỉ xét mã có trong nhãn), vị trí phòng (đúng phương), hướng nhà (lệch độ)."""
    n, p = BoCuc.model_validate(nhan), BoCuc.model_validate(du)
    tp = fp = fn = tn = 0
    for ma, dh in n.dau_hieu.items():
        doan = p.dau_hieu.get(ma)
        co_doan = bool(doan and doan.co)
        tp += dh.co and co_doan
        fn += dh.co and not co_doan
        fp += (not dh.co) and co_doan
        tn += (not dh.co) and not co_doan
    fp += sum(1 for ma, d in p.dau_hieu.items() if d.co and ma not in n.dau_hieu)     # báo thêm thứ nhãn không có
    vt_dung = sum(1 for k, v in n.vi_tri.items() if p.vi_tri.get(k) == v)
    lech = None
    if n.huong_nha_do is not None and p.huong_nha_do is not None:
        x = abs(n.huong_nha_do - p.huong_nha_do) % 360
        lech = min(x, 360 - x)
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn, "vi_tri_dung": vt_dung, "vi_tri_tong": len(n.vi_tri),
            "lech_huong": lech}


def cham(goc: Path = GOC) -> dict:
    tong = {"tp": 0, "fp": 0, "fn": 0, "tn": 0, "vi_tri_dung": 0, "vi_tri_tong": 0, "so_bo": 0}
    for d in sorted(x for x in goc.iterdir() if x.is_dir() and (x / "du_doan.json").exists()):
        r = cham_mot(_doc(d / "nhan.json"), _doc(d / "du_doan.json"))
        for k in tong:
            if k != "so_bo":
                tong[k] += r[k]
        tong["so_bo"] += 1
    muc = tong["tp"] + tong["fp"] + tong["fn"] + tong["tn"] + tong["vi_tri_tong"]
    dung = tong["tp"] + tong["tn"] + tong["vi_tri_dung"]
    tong["ti_le_dung"] = round(dung / muc, 3) if muc else None
    tong["precision"] = round(tong["tp"] / (tong["tp"] + tong["fp"]), 3) if tong["tp"] + tong["fp"] else None
    tong["recall"] = round(tong["tp"] / (tong["tp"] + tong["fn"]), 3) if tong["tp"] + tong["fn"] else None
    tong["dat_pt_v2"] = tong["ti_le_dung"] is not None and tong["ti_le_dung"] >= 0.9
    return tong


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kiem", action="store_true")
    ap.add_argument("--goc", default=str(GOC))
    a = ap.parse_args(argv)
    goc = Path(a.goc)
    if a.kiem:
        loi = kiem(goc)
        print("\n".join(loi) or f"OK — {sum(1 for x in goc.iterdir() if x.is_dir())} bộ đúng schema")
        print(f"Danh mục dấu hiệu ({len(DAU_HIEU)}): {', '.join(DAU_HIEU)}")
        return 1 if loi else 0
    print(json.dumps(cham(goc), ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
