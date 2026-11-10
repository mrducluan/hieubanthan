# -*- coding: utf-8 -*-
"""EN-ALL giai đoạn 0 — chụp ĐẦU RA TIẾNG VIỆT của mọi route engine (golden "không hồi quy" cho đợt chuyển thể tiếng Anh).

    cd engine && PYTHONPATH=. .venv/bin/python scripts/chup_dau_ra.py            # ghi fixtures/golden/dau_ra_vi/
    PYTHONPATH=. .venv/bin/python scripts/chup_dau_ra.py --so                    # không ghi, chỉ so với golden và in lệch
    PYTHONPATH=. .venv/bin/python scripts/chup_dau_ra.py --xem hoi.tuvi.hhq00001 # in phản hồi hiện tại của MỘT lượt gọi
    PYTHONPATH=. .venv/bin/python scripts/chup_dau_ra.py --thong-ke              # mã HTTP theo nhóm (soát payload)

Lưu: mỗi nhóm một tệp `<nhóm>.json` = {mã lượt gọi: băm sha256[:24] của "mã HTTP\\n thân"}; `mau.json.gz` giữ NGUYÊN VĂN
~5 % lượt gọi (chọn tất định theo băm mã) để khi lệch xem được khác chỗ nào. Chỉ sinh lại golden khi đổi đầu ra tiếng Việt
CÓ CHỦ ĐÍCH (ghi lý do trong PR) — đợt chuyển thể tiếng Anh không được đổi.
"""
from __future__ import annotations

import argparse
import collections
import gzip
import hashlib
import json
import os
import sys
import time

# Vài danh sách trong đầu ra engine dựng từ `set` → thứ tự phụ thuộc hạt băm chuỗi của TIẾN TRÌNH (có sẵn từ trước, ghi ở
# docs/EN-TIEN-DO.md). Golden phải lặp lại được → luôn chạy với PYTHONHASHSEED=0 (tự chạy lại chính mình nếu chưa đặt).
if os.environ.get("PYTHONHASHSEED") != "0":
    os.environ["PYTHONHASHSEED"] = "0"
    os.execv(sys.executable, [sys.executable, *sys.argv])

from tests import _dau_ra as dr  # noqa: E402


def _la_mau(ma: str) -> bool:
    return int(hashlib.md5(ma.encode()).hexdigest()[:4], 16) % 20 == 0


def chay(ngon_ngu: str = "vi", loc: str | None = None, xen_ke: int = 0):
    """→ (băm theo mã, mẫu nguyên văn, mã HTTP theo mã). `xen_ke` = N > 0: chỉ lấy mẫu 1/N lượt gọi, mỗi lượt gọi bản Anh
    TRƯỚC rồi mới gọi bản Việt trong cùng tiến trình — bắt bộ nhớ đệm không tách theo ngôn ngữ (lượt Anh rò sang Việt)."""
    c = dr.may_khach()
    with dr.dong_bang():
        luot = dr.luot_goi(c)
        bam: dict[str, str] = {}
        mau: dict[str, str] = {}
        http: dict[str, int] = {}
        for lg in luot:
            ma = lg[0]
            if loc and not ma.startswith(loc):
                continue
            if xen_ke:
                if int(hashlib.md5(ma.encode()).hexdigest()[:6], 16) % xen_ke:
                    continue
                dr.goi(c, lg, "en")
            st, nd = dr.goi(c, lg, ngon_ngu)
            bam[ma] = dr.bam(st, nd)
            http[ma] = st
            if _la_mau(ma):
                mau[ma] = nd.decode("utf-8", "replace")
    return bam, mau, http


def ghi(bam: dict[str, str], mau: dict[str, str]) -> None:
    dr.THU_MUC.mkdir(parents=True, exist_ok=True)
    for cu in dr.THU_MUC.glob("*.json"):
        cu.unlink()
    theo: dict[str, dict[str, str]] = collections.defaultdict(dict)
    for ma, b in bam.items():
        theo[dr.nhom(ma)][ma] = b
    for n, d in theo.items():
        (dr.THU_MUC / f"{n}.json").write_text(json.dumps(dict(sorted(d.items())), ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    # mtime=0 → tệp gz giống hệt giữa hai lần chạy
    with open(dr.THU_MUC / "mau.json.gz", "wb") as f, gzip.GzipFile(fileobj=f, mode="wb", mtime=0) as z:
        z.write(json.dumps(dict(sorted(mau.items())), ensure_ascii=False).encode("utf-8"))


def doc_golden() -> dict[str, str]:
    ra: dict[str, str] = {}
    for p in sorted(dr.THU_MUC.glob("*.json")):
        ra.update(json.loads(p.read_text(encoding="utf-8")))
    return ra


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--so", action="store_true")
    ap.add_argument("--xem")
    ap.add_argument("--thong-ke", action="store_true")
    ap.add_argument("--ngon-ngu", default="vi")
    ap.add_argument("--xen-ke", type=int, default=0, help="lấy mẫu 1/N, gọi bản Anh trước mỗi lượt bản Việt")
    a = ap.parse_args()
    if a.xem:
        c = dr.may_khach()
        with dr.dong_bang():
            for lg in dr.luot_goi(c):
                if lg[0] == a.xem:
                    st, nd = dr.goi(c, lg, a.ngon_ngu)
                    print(st)
                    print(json.dumps(json.loads(nd), ensure_ascii=False, indent=1) if nd[:1] in (b"{", b"[") else nd.decode())
                    return 0
        print("không có lượt gọi này", file=sys.stderr)
        return 2
    t0 = time.time()
    bam, mau, http = chay(a.ngon_ngu, xen_ke=a.xen_ke)
    print(f"{len(bam)} lượt gọi, {time.time() - t0:.0f} giây", file=sys.stderr)
    if a.thong_ke:
        tk: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
        for ma, st in http.items():
            tk[dr.nhom(ma)][st] += 1
        for n, cnt in sorted(tk.items()):
            print(n, dict(cnt))
        for ma, st in http.items():
            if st >= 500 or st == 422:
                print("  !", st, ma)
        return 0
    if a.so:
        cu = doc_golden()
        if a.xen_ke:
            cu = {m: v for m, v in cu.items() if m in bam}
        lech = [m for m in sorted(set(cu) | set(bam)) if cu.get(m) != bam.get(m)]
        print(f"lệch {len(lech)}/{len(cu)}")
        for m in lech[:50]:
            print("  ", m, "thiếu ở golden" if m not in cu else "thiếu ở lần chạy" if m not in bam else "")
        return 1 if lech else 0
    ghi(bam, mau)
    print(f"đã ghi {dr.THU_MUC}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
