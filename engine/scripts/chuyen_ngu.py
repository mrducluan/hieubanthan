"""QT-0 — chuyển ngữ một tệp KB sang tiếng Anh (bản phủ `data/en/<tên>.json`, NHÁP máy — `kb/nap.doc` tự gộp khi lượt gọi
là tiếng Anh, QTE-2). Chạy lúc soạn, không chạy runtime.

    OPENROUTER_API_KEY=… PYTHONPATH=. python scripts/chuyen_ngu.py app/kb/data/tu_dien.json --mang bat_tu --thu 20

- `--mang`: giới hạn bảng thuật ngữ đưa vào lời nhắc (bat_tu, tu_vi, phong_thuy, kinh_dich; bỏ trống = cả bốn).
- `--thu N`: chỉ dịch N chuỗi đầu (thử chất lượng / chi phí trước khi chạy cả tệp).
- Mô hình: env `CHUYEN_NGU_MODEL`, không có thì `OPENROUTER_MODEL`. Không trừ lượt AI của người dùng (tru_luot=False).
Chuỗi không qua bộ kiểm (`app/chuyen_ngu/kiem.py`) KHÔNG được ghi — danh sách in ra + lưu `<tên>.en.loi.json` cạnh tệp ra
để người duyệt xem. Kết quả mở PR nháp; người bản xứ duyệt rồi đổi `_trang_thai` → `da_duyet`.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from app.chuyen_ngu import quy_trinh
from app.narrative.ai_goi import goi_chat


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("tep")
    ap.add_argument("--mang", nargs="*", default=None)
    ap.add_argument("--thu", type=int, default=0)
    ap.add_argument("--ra", default=None)
    a = ap.parse_args()
    nguon = Path(a.tep)
    d = json.loads(nguon.read_text(encoding="utf-8"))
    if a.thu:
        giu = dict(list(quy_trinh.la_chuoi(d))[: a.thu])
        d = {"source_id": d.get("source_id"), "school_id": d.get("school_id")}
        for k, v in giu.items():
            quy_trinh._dat(d, k, v)  # noqa: SLF001 — dựng lại khung chỉ gồm N chuỗi đầu
    mo_hinh = os.environ.get("CHUYEN_NGU_MODEL")

    def goi(messages, **kw):
        return goi_chat(messages, mo_hinh=mo_hinh, nho=False, tru_luot=False, het_gio=120, **kw)

    kq = quy_trinh.chuyen(d, goi=goi, mang=a.mang)
    ra = Path(a.ra) if a.ra else nguon.parent / "en" / nguon.name
    ra.parent.mkdir(parents=True, exist_ok=True)
    ra.write_text(json.dumps(kq["ban_en"], ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    # Danh sách lỗi để cạnh tệp ra (không vào git — .gitignore), người duyệt xem rồi sửa tay.
    ra.with_suffix(".loi.json").write_text(json.dumps(kq["loi"], ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{kq['so']['qua']}/{kq['so']['tong']} chuỗi qua kiểm → {ra}")
    for k, l in list(kq["loi"].items())[:30]:
        print(" ✗", k, [x["ma"] for x in l])


if __name__ == "__main__":
    main()
