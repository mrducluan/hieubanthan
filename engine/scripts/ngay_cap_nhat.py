# -*- coding: utf-8 -*-
"""SEO-L4 — cập nhật sổ ngày đăng / sửa thật của trang kiến thức (`app/kb/data/ngay_cap_nhat.json`).

    python scripts/ngay_cap_nhat.py            # trang đổi nội dung → sửa = hôm nay; trang mới → đăng = sửa = hôm nay
    python scripts/ngay_cap_nhat.py --kiem     # chỉ kiểm (thoát 1 nếu sổ lệch) — CI dùng qua test_ngay_cap_nhat.py
    python scripts/ngay_cap_nhat.py --khoi-tao # lần đầu: sửa = ngày git sửa gần nhất của tệp KB/mã dựng trang,
                                            #          đăng = ngày git họ trang xuất hiện lần đầu

Chạy sau MỖI lần sửa KB hoặc mã dựng trang kiến thức (chạy lại không đổi gì nếu nội dung không đổi).
"""
from __future__ import annotations

import datetime as dt
import json
import subprocess
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from app.kb import ngay_cap_nhat as ncn  # noqa: E402
from app.kb import trang  # noqa: E402

# Mã dựng trang có đổi nội dung riêng của họ trang (dùng khi --khoi-tao; về sau băm nội dung tự bắt mọi thay đổi).
MA_DUNG = {"sao": ["app/kb/trang_tuvi.py"], "sao_cung": ["app/kb/trang_tuvi.py"], "hoa_cung": ["app/kb/trang_tuvi.py"],
           "menh_nam": ["app/kb/trang_menh.py"], "dau_hieu": ["app/kb/trang_phongthuy.py"],
           "nap_am": ["app/kb/trang_lich.py"], "tiet_khi": ["app/kb/trang_lich.py"], "con_giap_nam": ["app/kb/trang_lich.py"]}


def _trang_hien_tai(ghi_tep: bool = False) -> tuple[dict[str, str], dict[str, set[str]]]:
    """{loai/slug: băm} và (khi ghi_tep) {loai/slug: các tệp KB đã đọc}."""
    tep: dict[str, set[str]] = {}
    goc_doc = trang._doc
    dang_doc: set[str] = set()
    if ghi_tep:
        def doc(ten):                                  # noqa: ANN001 — ghi lại tệp KB mỗi trang đọc
            dang_doc.add(ten)
            return goc_doc(ten)
        trang._doc = doc
    bam: dict[str, str] = {}
    try:
        for m in trang.danh_sach():
            dang_doc.clear()
            t = trang.lay(m["loai"], m["slug"])
            k = f"{m['loai']}/{m['slug']}"
            bam[k] = ncn.bam(t)
            tep[k] = set(dang_doc)
    finally:
        trang._doc = goc_doc
    return bam, tep


def _ngay_git(duong: list[str]) -> str | None:
    r = subprocess.run(["git", "log", "-1", "--format=%cs", "--", *duong], cwd=GOC, capture_output=True, text=True)
    return r.stdout.strip() or None


def _ngay_ra_mat(loai: str) -> str | None:
    """Ngày họ trang xuất hiện lần đầu trong mã dựng trang (git -S theo khoá loại) — ngày đăng thật của trang khởi tạo."""
    r = subprocess.run(["git", "log", "--reverse", "--format=%cs", "-S", f'"{loai}"', "--", "app/kb/"],
                       cwd=GOC, capture_output=True, text=True)
    return (r.stdout.split() or [None])[0]


def main(argv: list[str]) -> int:
    hom_nay = dt.date.today().isoformat()
    cu = ncn.doc_so()
    if "--khoi-tao" in argv:
        bam, tep = _trang_hien_tai(ghi_tep=True)
        moi = {}
        for k, b in bam.items():
            loai = k.split("/")[0]
            ds = [f"app/kb/data/{f}" for f in sorted(tep[k])] + MA_DUNG.get(loai, [])
            ngay = max(trang.CAP_NHAT, _ngay_git(ds) or trang.CAP_NHAT)
            dang = min(_ngay_ra_mat(loai) or trang.CAP_NHAT, ngay)
            moi[k] = {"bam": b, "dang": dang, "sua": ngay}
    else:
        bam, _ = _trang_hien_tai()
        moi, lech = {}, []
        for k, b in bam.items():
            c = cu.get(k)
            if c is None:
                moi[k] = {"bam": b, "dang": hom_nay, "sua": hom_nay}
                lech.append(f"+ {k}")
            elif c["bam"] != b:
                moi[k] = {**c, "bam": b, "sua": hom_nay}
                lech.append(f"~ {k}")
            else:
                moi[k] = c
        lech += [f"- {k}" for k in cu if k not in bam]
        if "--kiem" in argv:
            for x in lech[:30]:
                print(x)
            print(f"{len(lech)} trang lệch sổ" if lech else "Sổ ngày cập nhật khớp nội dung.")
            return 1 if lech else 0
    noi_dung = {"_ghi_chu": ("SEO-L4 — ngày đăng / sửa thật của từng trang kiến thức. KHÔNG sửa tay: chạy "
                             "`python scripts/ngay_cap_nhat.py` sau khi sửa KB hoặc mã dựng trang."),
                "trang": dict(sorted(moi.items()))}
    ncn.SO.write_text(json.dumps(noi_dung, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"Đã ghi {len(moi)} trang vào {ncn.SO.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
