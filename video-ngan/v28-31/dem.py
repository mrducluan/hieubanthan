"""Đếm âm tiết lời đọc và ước tính thời lượng từng video (cùng công thức dung-hf.mjs).

python3 dem.py
"""
import json
import os
import re

d = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "kich-ban.json"), encoding="utf-8"))
for v in d["video"]:
    tong, ds = 0.0, []
    for c in v["canh"]:
        t = re.sub(r"\[[^\]]*\]", "", c["vo"])
        n = len([w for w in t.split() if re.search(r"\w", w)])
        p = len(re.findall(r"[.,?:!;]", t))
        tong += n / 4.1 + p * 0.18 + 0.3 + 0.55 + (1.4 if c["loai"] == "cta" else 0)
        ds.append("%s:%d" % (c["loai"], n))
    print(v["ma"], round(tong), "giây ·", " ".join(ds))
