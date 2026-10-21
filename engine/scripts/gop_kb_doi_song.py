# -*- coding: utf-8 -*-
"""LG-ĐS — gộp các mảnh KB "đời sống" vào app/kb/data/tuvi_doi_song_kb.json.

    python scripts/gop_kb_doi_song.py MANH1.json MANH2.json ...   [--thieu-van-gop]

Luật gộp (hợp nhất sâu, theo thứ tự mảnh): dict gộp đệ quy; khoá lá của mảnh GHI ĐÈ bản đang có; danh sách
(vd `cum_cam`) hợp nhất giữ thứ tự, bỏ trùng. Mọi chuỗi chuẩn hoá NFC. Mảnh nào chưa có trên đĩa → dừng (trừ khi
`--thieu-van-gop`). Sau khi gộp in số ô đã có theo từng nhóm để soát độ phủ.
"""
from __future__ import annotations

import json
import sys
import unicodedata
from pathlib import Path

KB = Path(__file__).resolve().parents[1] / "app" / "kb" / "data" / "tuvi_doi_song_kb.json"


def nfc(o):
    if isinstance(o, str):
        return unicodedata.normalize("NFC", o)
    if isinstance(o, list):
        return [nfc(x) for x in o]
    if isinstance(o, dict):
        return {nfc(k): nfc(v) for k, v in o.items()}
    return o


def gop(a, b):
    """Hợp nhất sâu b vào a (không sửa đầu vào)."""
    if isinstance(a, dict) and isinstance(b, dict):
        ra = dict(a)
        for k, v in b.items():
            ra[k] = gop(a[k], v) if k in a else v
        return ra
    if isinstance(a, list) and isinstance(b, list):
        return list(dict.fromkeys([*a, *b])) if all(isinstance(x, str) for x in [*a, *b]) else b
    return b


def do_phu(d: dict) -> dict:
    slv = d.get("sao_linh_vuc", {})
    return {
        "linh_vuc": len(d.get("linh_vuc", {})),
        "sao_linh_vuc (o sang/ham)": sum(len(n) for c in slv.values() for n in c.values()),
        "hoa_linh_vuc": sum(len(v) for v in d.get("hoa_linh_vuc", {}).values()),
        "nhom_sao_linh_vuc": sum(len(v) for v in d.get("nhom_sao_linh_vuc", {}).values()),
        "suc_khoe": len(d.get("suc_khoe", {})),
        "dai_han": len(d.get("dai_han", {})),
        "cach_cuc_doi_thuong": len(d.get("cach_cuc_doi_thuong", {})),
        "cum_cam": len(d.get("cum_cam", [])),
    }


def main(argv: list[str]) -> int:
    thieu_van_gop = "--thieu-van-gop" in argv
    manh = [Path(a) for a in argv if not a.startswith("--")]
    if not manh:
        print(__doc__)
        return 2
    thieu = [str(p) for p in manh if not p.exists()]
    if thieu and not thieu_van_gop:
        print("Chưa có mảnh:", *thieu, sep="\n  ")
        return 1
    d = json.loads(KB.read_text(encoding="utf-8")) if KB.exists() else {}
    for p in manh:
        if p.exists():
            d = gop(d, nfc(json.loads(p.read_text(encoding="utf-8"))))
            print("đã gộp", p)
    KB.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("ghi", KB)
    for k, v in do_phu(d).items():
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
