# -*- coding: utf-8 -*-
"""EN-ALL — đo nhanh chữ tiếng Việt còn lại trong đầu ra BẢN ANH của một nhóm route (dùng khi chuyển thể từng mảng).

    cd engine && PYTHONHASHSEED=0 PYTHONPATH=. .venv/bin/python scripts/do_viet_en.py tuvi.phi_hoa tuvi.nhip_3_thang [--mau 20] [--hoi 10]

Đối số = tiền tố mã route (`tests/_dau_ra.khoa_route`). In: số lượt, số chuỗi có chữ Việt, số chuỗi khác nhau, và các chuỗi
hay gặp nhất (để biết nguồn). `--hoi N` lấy mẫu 1/N câu hỏi đáp. Thước đo chính thức vẫn là tests/test_dau_ra_en.py."""
import argparse
import collections
import json
import re
import sys

from tests import _dau_ra as dr

VN = re.compile(r"[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]", re.I)


def _chuoi(x, out, duong=""):
    if isinstance(x, str):
        if VN.search(x):
            out.append((duong, x))
    elif isinstance(x, dict):
        for k, v in x.items():
            _chuoi(v, out, f"{duong}.{k}")
    elif isinstance(x, list):
        for v in x:
            _chuoi(v, out, f"{duong}[]")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tien_to", nargs="+")
    ap.add_argument("--mau", type=int, default=25)
    ap.add_argument("--hoi", type=int, default=10)
    a = ap.parse_args()
    c = dr.may_khach()
    tk = collections.defaultdict(lambda: [0, 0])
    dem = collections.Counter()
    with dr.dong_bang():
        for lg in dr.luot_goi(c):
            r = dr.khoa_route(lg[0])
            if not any(r == t or r.startswith(t + ".") or lg[0].startswith(t) for t in a.tien_to):
                continue
            if r.startswith("hoi.") and hash(lg[0]) % a.hoi:
                continue
            st, nd = dr.goi(c, lg, "en")
            tk[r][0] += 1
            if nd[:1] not in (b"{", b"["):
                continue
            o = []
            _chuoi(json.loads(nd), o)
            tk[r][1] += len(o)
            for d, s in o:
                dem[(re.sub(r"\[\]", "", d), s[:120])] += 1
    for r, (n, s) in sorted(tk.items()):
        print(f"{r:28} luot={n:4} chuoi_viet={s:7}")
    print(f"--- {len(dem)} chuỗi khác nhau; hay gặp nhất:")
    for (d, s), n in dem.most_common(a.mau):
        print(f"{n:5}  {d}  {s}")


if __name__ == "__main__":
    sys.exit(main())
