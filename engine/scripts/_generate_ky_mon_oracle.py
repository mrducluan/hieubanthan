# -*- coding: utf-8 -*-
"""KM-1 — sinh golden đối chiếu cho phép lập bàn Kỳ Môn từ bộ đối chiếu NGOÀI `kinqimen` (PyPI ghi MIT, Ken Tang).

CHỈ chạy khi phát triển, trong môi trường tạm ngoài repo — `kinqimen` KHÔNG phải dependency của engine:
    python -m venv /tmp/km && /tmp/km/bin/pip install kinqimen 'ephem>=4.2'
    /tmp/km/bin/python scripts/_generate_ky_mon_oracle.py
Ghi `fixtures/golden/ky_mon_doi_chieu.json`: 600 thời điểm 1900–2099 (giờ Bắc Kinh, UTC+8) × hai phép định cục
(1 = 拆補 sách bổ, 2 = 置閏 trí nhuận). Chỉ chép KẾT QUẢ (dữ kiện), không chép mã.
"""
from __future__ import annotations

import importlib.util
import json
import random
import sys
from pathlib import Path

spec = importlib.util.find_spec("kinqimen")
sys.path.insert(0, str(Path(spec.origin).parent))      # gói import `config` theo kiểu tệp cùng thư mục
import kinqimen as kq                                   # noqa: E402

RA = Path(__file__).resolve().parent.parent / "fixtures" / "golden" / "ky_mon_doi_chieu.json"


def main() -> None:
    rd = random.Random(20261118)
    ca = []
    while len(ca) < 600:
        nam, thang, ngay = rd.randint(1900, 2099), rd.randint(1, 12), rd.randint(1, 28)
        gio, phut = rd.randint(0, 23), rd.choice([0, 15, 30, 45])
        q = kq.Qimen(nam, thang, ngay, gio, phut)
        dong = {"t": f"{nam:04d}-{thang:02d}-{ngay:02d}T{gio:02d}:{phut:02d}"}
        try:
            for ma, ten in ((1, "sach_bo"), (2, "tri_nhuan")):
                p = q.pan(ma)
                dong[ten] = {k: p[k] for k in ("干支", "旬首", "排局", "節氣", "值符值使", "天盤", "地盤", "門", "星", "神")}
        except Exception as e:                          # bộ đối chiếu có ca tự lỗi — ghi lại, không bỏ lặng
            dong["loi"] = type(e).__name__
        ca.append(dong)
    RA.write_text(json.dumps({"_nguon": "kinqimen 0.0.6.6 (PyPI, ghi giấy phép MIT) — bộ đối chiếu ngoài, chỉ kết quả. "
                                        "Giờ theo UTC+8. Sinh bằng scripts/_generate_ky_mon_oracle.py (hạt giống 20261118).",
                              "ca": ca}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    print(len(ca), sum(1 for c in ca if "loi" in c), "lỗi")


if __name__ == "__main__":
    main()
