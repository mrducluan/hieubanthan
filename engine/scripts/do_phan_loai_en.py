#!/usr/bin/env python
"""EN-AI — đo lớp phân loại AI câu gõ tự do tiếng Anh (narrative/phan_loai_en.py): cùng các bộ câu của `cham_en.py`, chạy
hai lượt TẮT (chỉ luật) / BẬT (luật + AI, luật hợp nhất thật của engine) rồi in bảng trước → sau. Holdout chỉ in TỔNG.

Cần khoá thật: OPENROUTER_API_KEY (máy phát triển không có — chủ dự án chạy). Gọi AI ~1 lượt / câu (≈ 2.300 câu, mô hình
nhỏ); kết quả nhớ trong tiến trình nên mỗi câu chỉ gọi một lần cho cả hai mảng bảng.

Dùng:
  OPENROUTER_API_KEY=… python scripts/do_phan_loai_en.py                 # mô hình mặc định, hạn chót 2 giây như production
  OPENROUTER_API_KEY=… HOI_PHAN_LOAI_MODEL=openai/gpt-4.1-nano python scripts/do_phan_loai_en.py --het-gio 10
      (`--het-gio`: nới hạn chót để đo CHẤT LƯỢNG nhãn tách khỏi độ trễ; báo cáo vẫn in số câu quá 2 giây)
  … --chi battu|tuvi|an_toan   chỉ chạy một nhóm bộ câu
Không ghi tệp, không in câu của bộ holdout.
"""
from __future__ import annotations

import json
import os
import statistics
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))
sys.path.insert(0, str(GOC / "scripts"))
os.environ.setdefault("LLM_LUOT_NGUOI_GIO", "100000")     # đo hàng loạt: không chạm hạn mức RL-1 của người dùng
os.environ.setdefault("LLM_LUOT_TONG_GIO", "100000")
os.environ.setdefault("LLM_LUOT_TONG_NGAY", "100000")
os.environ.setdefault("HOI_PHAN_LOAI_NHO_GIAY", str(24 * 3600))

import cham_en  # noqa: E402

from app import ngon_ngu  # noqa: E402
from app.luangiai import an_toan as at  # noqa: E402
from app.luangiai import nhan_ngoai  # noqa: E402
from app.narrative import phan_loai_en as pl_en  # noqa: E402

EN = GOC / "fixtures" / "cau_hoi" / "en"
BO = {   # nhóm → [(tên, mảng, hàm chấm, holdout?)]
    "battu": [("battu dev", "battu", lambda: cham_en.cham("battu"), False),
              ("battu holdout (v1)", "battu", lambda: cham_en.cham("battu", holdout=True), True),
              ("battu v2 (dev)", "battu", lambda: cham_en.cham_v2(tep=str(EN / "battu_holdout_v2.jsonl")), True),
              ("battu v3 (dev)", "battu", lambda: cham_en.cham_v2(tep=str(EN / "battu_holdout_v3.jsonl")), True),
              ("battu v4 (đóng băng)", "battu", lambda: cham_en.cham_v2(tep=str(EN / "battu_holdout_v4.jsonl")), True)],
    "tuvi": [("tuvi dev", "tuvi", lambda: cham_en.cham_tuvi(), False),
             ("tuvi holdout (đóng băng)", "tuvi", lambda: cham_en.cham_tuvi(holdout=True), True)],
    "an_toan": [("an toàn en", "battu", lambda: cham_en.cham_an_toan(), False),
                ("an toàn en dev2", "battu", lambda: cham_en.cham_an_toan(tep="an_toan_en_dev2.jsonl"), False)],
}
TEP = {"battu dev": ["battu_dev.jsonl"], "battu holdout (v1)": ["battu_holdout.jsonl"],
       "battu v2 (dev)": ["battu_holdout_v2.jsonl"], "battu v3 (dev)": ["battu_holdout_v3.jsonl"],
       "battu v4 (đóng băng)": ["battu_holdout_v4.jsonl"], "tuvi dev": ["tuvi_dev.jsonl"],
       "tuvi holdout (đóng băng)": ["tuvi_holdout.jsonl"], "an toàn en": ["an_toan_en.jsonl"],
       "an toàn en dev2": ["an_toan_en_dev2.jsonl"]}
_MANG_HIEN = threading.local()
_TRE: list[float] = []
_KHONG_NHAN = [0]


def _cau(ten: str) -> list[str]:
    ra = []
    for t in TEP[ten]:
        for x in (EN / t).read_text(encoding="utf-8").splitlines():
            if x.strip():
                ra.append(json.loads(x)["cau_hoi"])
    return ra


def _nap_truoc(viec: list[tuple[str, str]]) -> None:
    """Gọi AI cho mọi câu TRƯỚC khi chấm (bộ chấm đóng băng đồng hồ và tạm gỡ khoá AI) — nhãn vào bộ nhớ của lớp AI."""
    goc = pl_en._goi

    def do(cau, mang):
        t0 = time.monotonic()
        try:
            return goc(cau, mang)
        finally:
            _TRE.append(time.monotonic() - t0)
    pl_en._goi = do
    pl_en._THO = ThreadPoolExecutor(max_workers=16)
    try:
        with ThreadPoolExecutor(max_workers=8) as ex:
            for n in ex.map(lambda v: pl_en.phan_loai(v[0], v[1]), viec):
                _KHONG_NHAN[0] += n is None
    finally:
        pl_en._goi = goc


def _bat(mang: str):
    """Lượt BẬT: mọi chỗ bộ chấm phân loại / gọi route / xét cấp cứu đều thấy nhãn AI (đọc từ bộ nhớ đã nạp)."""
    os.environ["HOI_PHAN_LOAI_AI"] = "1"
    goc_pl, goc_nsk, goc_mk = cham_en._phan_loai, at.nhom_suc_khoe, cham_en.dr.may_khach

    def pl(mo_dun, cau):
        with nhan_ngoai.dung(cau, pl_en.phan_loai(cau, mo_dun)):
            return goc_pl(mo_dun, cau)

    def nsk(raw):
        with nhan_ngoai.dung(raw, pl_en.phan_loai(raw, mang)):
            return goc_nsk(raw)

    class _Khach:
        def __init__(self):
            self.c = goc_mk()

        def post(self, duong, json=None, headers=None):
            return self.c.post(duong, json=json, headers={**(headers or {}), "x-phan-loai-ai": "1"})

    cham_en._phan_loai, at.nhom_suc_khoe, cham_en.dr.may_khach = pl, nsk, _Khach

    def tra():
        cham_en._phan_loai, at.nhom_suc_khoe, cham_en.dr.may_khach = goc_pl, goc_nsk, goc_mk
        os.environ.pop("HOI_PHAN_LOAI_AI", None)
    return tra


def _gon(kq: dict) -> dict:
    return {k: v for k, v in kq.items() if not isinstance(v, (dict, list))} | (
        {"theo_loai": kq["theo_loai"]} if "theo_loai" in kq else {})


def main() -> None:
    if not os.environ.get("OPENROUTER_API_KEY"):
        sys.exit("Cần OPENROUTER_API_KEY (khoá thật) — lớp AI gọi mô hình qua OpenRouter.")
    if "--het-gio" in sys.argv:
        pl_en.HET_GIO = float(sys.argv[sys.argv.index("--het-gio") + 1])
    nhom = [sys.argv[sys.argv.index("--chi") + 1]] if "--chi" in sys.argv else list(BO)
    os.environ.pop("HOI_PHAN_LOAI_AI", None)
    viec = sorted({(c, m) for g in nhom for ten, m, _, _ in BO[g] for c in _cau(ten)})
    print(f"Mô hình: {pl_en.mo_hinh()} · hạn chót {pl_en.HET_GIO:g} s · {len(viec)} câu — đang gọi AI…", flush=True)
    tk = ngon_ngu.HIEN_TAI.set("en")
    try:
        _nap_truoc(viec)
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)
    if _TRE:
        tre = sorted(_TRE)
        print(f"Độ trễ AI: trung vị {statistics.median(tre):.2f} s · p90 {tre[int(0.9 * (len(tre) - 1))]:.2f} s · "
              f"> 2 s: {sum(t > 2 for t in tre)} / {len(tre)} · không có nhãn (lỗi / hết giờ / JSON hỏng): {_KHONG_NHAN[0]}")
    for g in nhom:
        for ten, mang, ham, _holdout in BO[g]:
            truoc = _gon(ham())
            tra = _bat(mang)
            try:
                sau = _gon(ham())
            finally:
                tra()
            print(f"\n== {ten}")
            for k in truoc:
                if truoc[k] != sau.get(k):
                    print(f"  {k}: {truoc[k]} → {sau.get(k)}")
                else:
                    print(f"  {k}: {truoc[k]}")


if __name__ == "__main__":
    main()
