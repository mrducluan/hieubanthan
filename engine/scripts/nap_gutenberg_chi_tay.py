# -*- coding: utf-8 -*-
"""RS-3 — nạp hai sách chỉ tay phương Tây thuộc phạm vi công cộng từ bản Project Gutenberg (đã hiệu đính tay).

    Cheiro, Palmistry for All (1916)           — Gutenberg #20480
    Mrs. J. B. Dale, Indian Palmistry (1895)   — Gutenberg #52523

Máy phiên không vào được gutenberg.org → đọc bản chép của chính Gutenberg trên Internet Archive:
    https://archive.org/stream/palmistryforall20480gut/pg20480.txt
    https://archive.org/stream/indianpalmistry52523gut/52523-0.txt
    python scripts/nap_gutenberg_chi_tay.py            # tải + ghi
    python scripts/nap_gutenberg_chi_tay.py <thư mục>  # đọc <khoá>.txt đã tải sẵn (chữ trong <pre> đã gỡ)
Chỉ dọn vỏ: bỏ đầu / cuối giấy phép Gutenberg, dấu `_` in nghiêng, khung [Illustration: …], nối dòng — KHÔNG sửa chữ sách.
Bản Gutenberg do người hiệu đính nhưng vẫn `can_doi_chieu: true` như mọi kho nguồn khác.
"""
from __future__ import annotations

import html
import json
import re
import sys
import urllib.request
from pathlib import Path

NGUON = Path(__file__).resolve().parent.parent / "fixtures" / "nguon"

SACH: dict[str, dict] = {
    "chi_tay_cheiro_palmistry_for_all": dict(
        url="https://archive.org/stream/palmistryforall20480gut/pg20480.txt", gut=20480,
        sach="Palmistry for All", tac_gia="Cheiro (William John Warner, Count Louis Hamon)", mat=1936, nam=1916,
        dung="chỉ tay phương Tây: bốn đường chính (Trí, Sinh, Vận mệnh, Tâm) và bảy gò — nguồn trích cho kho kinh điển",
        bat_dau=r"^PART I--"),
    "chi_tay_dale_indian_palmistry": dict(
        url="https://archive.org/stream/indianpalmistry52523gut/52523-0.txt", gut=52523,
        sach="Indian Palmistry", tac_gia="Mrs. J. B. Dale", mat=None, nam=1895,
        dung="bảng tra ngắn từng gò và đường theo lối cổ — nguồn trích thứ hai cho kho kinh điển",
        bat_dau=None),
}

_DAU = re.compile(r"^\s*(CHAPTER|PART)\s+([IVXLC]{1,7})\b\s*[-—.]*\s*(.*)$")
_TIEU_DE = re.compile(r"^[A-ZÀ-Þ0-9 ,.'\"()—\-;:]{6,130}$")
_MUC_DALE = re.compile(r"^No\. (\d{1,3})\.$")


def tai(ma: str) -> str:
    with urllib.request.urlopen(urllib.request.Request(SACH[ma]["url"], headers={"User-Agent": "Mozilla/5.0"}),
                                timeout=180) as r:
        t = r.read().decode("utf-8", "replace")
    m = re.search(r"<pre[^>]*>(.*?)</pre>", t, re.S)
    if not m:
        raise SystemExit(f"{ma}: không thấy <pre>")
    return html.unescape(m.group(1))


def than_sach(tho: str) -> str:
    tho = tho.replace("\r", "").lstrip("﻿")
    a = re.search(r"\*\*\* ?START OF TH[^\n]*\*\*\*", tho)
    b = re.search(r"\*\*\* ?END OF TH[^\n]*\*\*\*", tho)
    if not a or not b:
        raise SystemExit("không thấy mốc START / END của Gutenberg")
    t = tho[a.end():b.start()]
    t = re.sub(r"\[Illustration:.*?\]", "", t, flags=re.S)
    return t.replace("_", "")


def doan_van(t: str) -> list[str]:
    ra = []
    for khoi in re.split(r"\n\s*\n", t):
        x = re.sub(r"\s+", " ", khoi).strip()
        if x and not re.fullmatch(r"\d{1,4}", x):
            ra.append(x)
    return ra


def chia(doan: list[str], bat_dau: str | None) -> list[dict]:
    """Cắt theo 'PART …' / 'CHAPTER …' (Cheiro; mục lục đầu sách không tính) và theo mục 'No. n.' (Dale)."""
    ra = [{"so": "", "ten": "dau_sach", "doan": []}]
    phan, nhom = "", ""
    da_vao = bat_dau is None
    for d in doan:
        if not da_vao:
            if re.match(bat_dau, d):
                da_vao = True
            else:
                ra[-1]["doan"].append(d)
                continue
        md = _MUC_DALE.match(d)
        if md:
            ra.append({"so": (nhom + " · " if nhom else "") + f"No. {md.group(1)}", "ten": "", "doan": []})
            continue
        if bat_dau is None and _TIEU_DE.match(d) and not re.search(r"[a-z]", d):
            nhom = d.strip(" .")
            ra.append({"so": nhom, "ten": "", "doan": []})
            continue
        if ra[-1]["so"].split(" · ")[-1].startswith("No.") and not ra[-1]["ten"] and d.startswith("Name."):
            ra[-1]["ten"] = d.split("—", 1)[-1].strip(" .")
        m = _DAU.match(d)
        if m and len(d) < 90:
            if m.group(1) == "PART":
                phan = d
                ra.append({"so": d, "ten": "", "doan": []})
            else:
                ra.append({"so": (phan + " · " if phan else "") + f"Chapter {m.group(2)}", "ten": m.group(3).strip(), "doan": []})
            continue
        if not ra[-1]["ten"] and ra[-1]["so"] and _TIEU_DE.match(d):
            ra[-1]["ten"] = d
            continue
        ra[-1]["doan"].append(d)
    return [c for c in ra if c["doan"]]


def dung(ma: str, tho: str) -> dict:
    s = SACH[ma]
    chuong = chia(doan_van(than_sach(tho)), s["bat_dau"])
    mat = f", tác giả mất {s['mat']}" if s["mat"] else ""
    return {
        "_nguon": f"{s['tac_gia']}, {s['sach']} ({s['nam']}). Phạm vi công cộng: in trước 1929{mat}.",
        "ban": f"Bản Project Gutenberg #{s['gut']} (người hiệu đính, Distributed Proofreaders), chép trên Internet Archive."
               " Đã bỏ phần giấy phép Gutenberg, dấu in nghiêng và khung hình — chữ sách giữ nguyên.",
        "ngon_ngu": "en", "mang": "chi_tay", "source_id": ma, "can_doi_chieu": True, "dung_de": s["dung"],
        "so_chu": sum(len(d.split()) for c in chuong for d in c["doan"]), "chuong": chuong,
    }


def main() -> None:
    thu_muc = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    for ma in SACH:
        tho = (thu_muc / f"{ma}.txt").read_text("utf-8") if thu_muc else tai(ma)
        d = dung(ma, tho)
        (NGUON / f"{ma}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
        print(f"{ma}: {len(d['chuong'])} chương, {d['so_chu']} chữ")


if __name__ == "__main__":
    main()
