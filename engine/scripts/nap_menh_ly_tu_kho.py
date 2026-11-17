# -*- coding: utf-8 -*-
"""TK-1 — nạp sách mệnh lý bản Văn Uyên Các Tứ khố toàn thư (Kanseki Repository, nhánh WYG) vào kho nguồn, ĐỦ BỘ:
三命通會 12 quyển (KR3g0042 — tệp `tam_menh_thong_hoi.json` cũ chỉ có 34 thiên engine đang dùng, giữ nguyên) và năm sách
mệnh lý Đường – Tống (李虛中命書, 玉照定真經, 珞琭子賦注, 珞琭子三命消息賦注, 三命指迷賦, 星命總括).

    python scripts/nap_menh_ly_tu_kho.py            # tải từ raw.githubusercontent.com/kanripo/<mã>/master/
Bản gõ lại của Kanseki, không chấm câu; chưa đối chiếu bản chụp → `can_doi_chieu`. Tệp _000 (đề yếu của quán Tứ khố) không nạp.
Kho nguồn trước, lời sau: chưa đổi KB / phép tính.
"""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"
NGAY = "2026-11-17"
BO = {
    "tam_menh_thong_hoi_du_bo": [("KR3g0042", "三命通會", "Tam Mệnh Thông Hội", "Vạn Dân Anh (Minh)")],
    "menh_ly_duong_tong": [
        ("KR3g0033", "", "", ""), ("KR3g0034", "", "", ""), ("KR3g0036", "", "", ""),
        ("KR3g0037", "", "", ""), ("KR3g0038", "", "", ""), ("KR3g0039", "", "", "")],
}


def _tai(u: str) -> str | None:
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=90) as r:
            return r.read().decode("utf-8")
    except Exception:
        return None


def doc_quyen(chu: str) -> tuple[str, str, str]:
    ten_sach, quyen, van = "", "", []
    for dong in chu.splitlines():
        if (m := re.match(r"#\+TITLE: (.+)", dong)):
            ten_sach = m.group(1).strip()
        if (m := re.match(r"#\+PROPERTY: JUAN (.+)", dong)):
            quyen = m.group(1).strip()
        if dong.startswith("#"):
            continue
        dong = re.sub(r"<[^>]*>", "", dong).replace("¶", "").replace("　", "").strip()
        if dong:
            van.append(dong)
    return ten_sach, quyen, "\n".join(van)


def nap(ds: list[tuple[str, str, str, str]]) -> tuple[dict, list[dict]]:
    sach, thien = {}, []
    for kr, ten_han, ten, tac in ds:
        for i in range(1, 60):
            chu = _tai(f"https://raw.githubusercontent.com/kanripo/{kr}/master/{kr}_{i:03d}.txt")
            if chu is None:
                break
            ts, quyen, van = doc_quyen(chu)
            sach.setdefault(kr, {"ma_kho": kr, "ten_han": ten_han or ts, **({"ten": ten, "tac_gia": tac} if ten else {})})
            thien.append({"so": len(thien) + 1, "sach": kr, "ten": f"{ten_han or ts} · {quyen}", "van": van})
    return sach, thien


def main() -> None:
    from bo_dau_cau_kho_nguon import _sua as bo_dau_cau
    for ma, ds in BO.items():
        sach, thien = nap(ds)
        out = {"_nguon": "、".join(s["ten_han"] for s in sach.values()) + " — sách mệnh lý (Bát tự). Cổ thư công cộng.",
               "ban": f"Kanseki Repository (github.com/kanripo/{ds[0][0]}…), bản Văn Uyên Các Tứ khố toàn thư (WYG), lấy {NGAY} "
                      "— bản gõ lại, không chấm câu, chú chữ nhỏ viết liền; CHƯA đối chiếu bản chụp",
               "can_doi_chieu": True, "source_id": ma, "school_id": "tu_binh", "sach": sach, "thien": thien}
        (NGUON / f"{ma}.json").write_text(json.dumps(bo_dau_cau(out), ensure_ascii=False, indent=1) + "\n", "utf-8")
        print(ma, len(thien), "quyển,", sum(len(t["van"]) for t in thien), "chữ;", [s["ten_han"] for s in sach.values()])


if __name__ == "__main__":
    main()
