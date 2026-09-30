# -*- coding: utf-8 -*-
"""Vòng tự cải thiện thần số — công cụ của skill .claude/skills/thanso-tu-cai-thien.

  python scripts/vong_cai_thien.py do          # đo, ghi lịch sử, báo lùi (exit 1)
  python scripts/vong_cai_thien.py bao-cao     # lỗ hổng hàng đầu kèm ví dụ (markdown)
  python scripts/vong_cai_thien.py keo-nhat-ky # kéo câu hỏi thật chưa đáp tốt từ Supabase

Lịch sử đo: fixtures/cau_hoi/lich_su_do.jsonl (commit cùng PR để thấy xu hướng).
Ứng viên từ nhật ký: fixtures/cau_hoi/ung_vien/ (gitignore — người gắn nhãn rồi mới
chép vào _cau_hoi_goc.py).
"""
from __future__ import annotations

import collections
import datetime as dt
import json
import os
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from app.config import ENGINE_VERSION  # noqa: E402
from app.luangiai import hoi  # noqa: E402
from app.narrative import hoi_van  # noqa: E402

KHO = GOC / "fixtures" / "cau_hoi" / "thanso_cau_hoi.jsonl"
LICH_SU = GOC / "fixtures" / "cau_hoi" / "lich_su_do.jsonl"
UNG_VIEN = GOC / "fixtures" / "cau_hoi" / "ung_vien"
NGUOI = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988}
KIA = {"ho_ten": ["Trần Thị Mai"], "ngay": 13, "thang": 5, "nam": 1990}
NGAY = dt.date(2026, 9, 30)
# Lùi quá mức này so với lần đo trước = hỏng (điểm phần trăm).
DUNG_SAI = 0.5


def _kho() -> list[dict]:
    return [json.loads(l) for l in KHO.open(encoding="utf-8")]


def do_luong() -> dict:
    rows = _kho()
    n = len(rows)
    lv = dt_ = du = an_toan = an_toan_dung = nham_an_toan = tu_choi = tu_choi_dung = 0
    for r in rows:
        kq = hoi_van.tra_loi(r["cau_hoi"], NGUOI, KIA, NGAY, dung_llm=False)
        p = kq["phan_loai"]
        lv += p["linh_vuc"] == r["linh_vuc"]
        dt_ += p["doi_tuong"] == r["doi_tuong"]
        if r["xu_ly"] == "an_toan":
            an_toan += 1
            an_toan_dung += p["xu_ly"] == "an_toan"
        elif p["xu_ly"] == "an_toan":
            nham_an_toan += 1
        if r["xu_ly"] == "tu_choi_nhe":
            tu_choi += 1
            tu_choi_dung += p["xu_ly"] == "tu_choi_nhe"
        du += (kq["do_phu"] == "day_du" and not kq["loi_kiem_tra"]
               and p["linh_vuc"] == r["linh_vuc"])
    pct = lambda a, b: round(100 * a / b, 2) if b else 100.0  # noqa: E731
    return {
        "ngay": dt.date.today().isoformat(), "engine_version": ENGINE_VERSION, "so_cau": n,
        "day_du_dung_linh_vuc": pct(du, n), "linh_vuc": pct(lv, n), "doi_tuong": pct(dt_, n),
        "an_toan_recall": pct(an_toan_dung, an_toan), "an_toan_bat_nham": nham_an_toan,
        "tu_choi_recall": pct(tu_choi_dung, tu_choi),
    }


def lenh_do() -> int:
    moi = do_luong()
    cu = None
    if LICH_SU.exists():
        dong = [l for l in LICH_SU.read_text(encoding="utf-8").splitlines() if l.strip()]
        cu = json.loads(dong[-1]) if dong else None
    print(json.dumps(moi, ensure_ascii=False, indent=1))
    loi = []
    if moi["an_toan_recall"] < 100:
        loi.append("recall câu khủng hoảng < 100%")
    if cu:
        for k in ("day_du_dung_linh_vuc", "linh_vuc", "doi_tuong", "tu_choi_recall"):
            if moi[k] < cu[k] - DUNG_SAI:
                loi.append(f"{k} lùi {cu[k]} → {moi[k]}")
        if moi["so_cau"] < cu["so_cau"]:
            loi.append(f"kho câu hỏi co lại {cu['so_cau']} → {moi['so_cau']}")
    with LICH_SU.open("a", encoding="utf-8") as f:
        f.write(json.dumps(moi, ensure_ascii=False) + "\n")
    for l in loi:
        print("LÙI:", l)
    return 1 if loi else 0


def lenh_bao_cao(so_nhom: int = 12) -> None:
    sai = collections.defaultdict(list)
    for r in _kho():
        kq = hoi_van.tra_loi(r["cau_hoi"], NGUOI, KIA, NGAY, dung_llm=False)
        p = kq["phan_loai"]
        if kq["do_phu"] != "day_du":
            sai[("không căn cứ", r["linh_vuc"])].append(r["cau_hoi"])
        elif p["linh_vuc"] != r["linh_vuc"]:
            sai[(f"lệch {r['linh_vuc']}→{p['linh_vuc']}", "")].append(r["cau_hoi"])
    print("| Nhóm lỗi | Số câu | Ví dụ |\n|---|---|---|")
    for (k, lv), v in sorted(sai.items(), key=lambda x: -len(x[1]))[:so_nhom]:
        print(f"| {k} {lv} | {len(v)} | {' · '.join(v[:3])} |")


def lenh_keo_nhat_ky(gioi_han: int = 500) -> None:
    """Cần SUPABASE_URL + SUPABASE_SERVICE_KEY (service role — chỉ chạy ở máy chủ dự án)."""
    import httpx  # noqa: PLC0415
    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_KEY")
    if not (url and key):
        print("Thiếu SUPABASE_URL / SUPABASE_SERVICE_KEY — bỏ qua.")
        return
    r = httpx.get(f"{url.rstrip('/')}/rest/v1/thanso_hoi_nhat_ky", timeout=30,
                  headers={"apikey": key, "Authorization": f"Bearer {key}"},
                  params={"select": "cau_hoi_da_loc,linh_vuc,xu_ly,do_phu,huu_ich,created_at",
                          "or": "(do_phu.neq.day_du,huu_ich.is.false)",
                          "order": "created_at.desc", "limit": str(gioi_han)})
    r.raise_for_status()
    UNG_VIEN.mkdir(parents=True, exist_ok=True)
    ra = UNG_VIEN / f"{dt.date.today().isoformat()}.jsonl"
    with ra.open("w", encoding="utf-8") as f:
        for row in r.json():
            p = hoi.phan_loai(row["cau_hoi_da_loc"])
            f.write(json.dumps({**row, "du_doan": {k: p[k] for k in ("linh_vuc", "doi_tuong", "xu_ly")},
                                "nhan_dung": None}, ensure_ascii=False) + "\n")
    print(f"{len(r.json())} ứng viên -> {ra} (gắn nhãn 'nhan_dung' rồi chép vào _cau_hoi_goc.py)")


if __name__ == "__main__":
    lenh = sys.argv[1] if len(sys.argv) > 1 else "do"
    if lenh == "do":
        sys.exit(lenh_do())
    elif lenh == "bao-cao":
        lenh_bao_cao()
    elif lenh == "keo-nhat-ky":
        lenh_keo_nhat_ky()
    else:
        print(__doc__)
        sys.exit(2)
