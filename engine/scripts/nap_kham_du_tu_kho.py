# -*- coding: utf-8 -*-
"""Nạp ba sách kham dư bản Văn Uyên Các Tứ khố toàn thư (Kanseki Repository, nhánh WYG) vào kho nguồn:
靈城精義 (KR3g0025, Hà Phổ — Nam Đường), 催官篇 (KR3g0026, Lại Văn Tuấn — Tống), 發微論 (KR3g0027, Thái Nguyên Định — Tống).

Linh Thành Tinh Nghĩa bản Wikisource đã bị loại ở WS-1 (máy đổi giản → phồn sai chữ); bản Tứ khố ở đây là bản chép
tay của quán Tứ khố, gõ lại bởi Kanseki — dùng bản này thay.

Dùng (mỗi thư mục chứa các tệp `KR3g00NN_00x.txt` tải từ raw.githubusercontent.com/kanripo/KR3g00NN/master/):
    python scripts/nap_kham_du_tu_kho.py /thu/muc/chua/KR3g0025_KR3g0026_KR3g0027
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
NGAY = "2026-11-14"
SACH = [("linh_thanh", "KR3g0025", "靈城精義", "Linh Thành Tinh Nghĩa", "Hà Phổ (Nam Đường)"),
        ("thoi_quan", "KR3g0026", "催官篇", "Thôi Quan Thiên", "Lại Văn Tuấn (Tống)"),
        ("phat_vi", "KR3g0027", "發微論", "Phát Vi Luận", "Thái Nguyên Định (Tống)")]


def doc_quyen(tep: Path) -> tuple[str, str]:
    """Một tệp quyển → (tên quyển, chữ). Bỏ dòng thuộc tính `#`, mốc trang `<pb:…>`, dấu `¶`, khoảng trắng toàn khổ."""
    ten, van = "", []
    for dong in tep.read_text("utf-8").splitlines():
        m = re.match(r"#\+PROPERTY: JUAN (.+)", dong)
        if m:
            ten = m.group(1).strip()
        if dong.startswith("#"):
            continue
        dong = re.sub(r"<[^>]*>", "", dong).replace("¶", "").replace("　", "").strip()
        if dong:
            van.append(dong)
    return ten, "\n".join(van)


def nap(goc: Path) -> dict:
    thien, so, sach = [], 0, {}
    for ma, kr, ten_han, ten, tac in SACH:
        sach[ma] = {"ma_kho": kr, "ten_han": ten_han, "ten": ten, "tac_gia": tac}
        # tệp _000 là đề yếu (提要) của quán Tứ khố / thư mục dẫn — không phải chữ sách
        for tep in sorted((goc / kr).glob(f"{kr}_0*.txt")):
            if tep.name.endswith("_000.txt"):
                continue
            quyen, van = doc_quyen(tep)
            so += 1
            thien.append({"so": so, "sach": ma, "ten": f"{ten_han} · {quyen}", "van": van})
    return {"_nguon": "靈城精義 (Hà Phổ, Nam Đường), 催官篇 (Lại Văn Tuấn, Tống), 發微論 (Thái Nguyên Định, Tống) — "
                      "sách kham dư (hình thế, lý khí). Cổ thư công cộng.",
            "ban": f"Kanseki Repository (github.com/kanripo/KR3g0025…0027), bản Văn Uyên Các Tứ khố toàn thư (WYG), lấy {NGAY} "
                   "— bản gõ lại, không chấm câu, chú giải chữ nhỏ viết liền; CHƯA đối chiếu bản chụp",
            "can_doi_chieu": True, "source_id": "kham_du_tu_kho", "school_id": "hinh_the", "sach": sach,
            "thien": thien}


if __name__ == "__main__":
    out = nap(Path(sys.argv[1]))
    (NGUON / "kham_du_tu_kho.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print("kham_du_tu_kho", len(out["thien"]), "quyển,", sum(len(t["van"]) for t in out["thien"]), "chữ")
