"""Dựng kho nguồn Tử Vi Đẩu Số Toàn Thư (紫微斗數全書, đề Trần Đoàn soạn, La Hồng Tiên biên, bản khắc đời Minh) —
cổ thư công cộng — vào engine/fixtures/nguon/tu_vi_dau_so_toan_thu.json.

Nguồn chữ: bộ dữ liệu tianzhi-classics (mã + metadata MIT) đã cắt sách theo thiên, đối chiếu bản khắc Nam Dương Đường 1600;
chỉ lấy CỔ VĂN (và chú nhỏ nguyên bản), không lấy ghi chú biên tập hiện đại của bộ dữ liệu.

    git clone --depth 1 https://github.com/zaoxu001/tianzhi-classics /tmp/tz
    python scripts/nap_tu_vi_toan_thu.py /tmp/tz
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

DICH = Path(__file__).resolve().parents[1] / "fixtures" / "nguon" / "tu_vi_dau_so_toan_thu.json"


def doc(goc: Path) -> dict:
    e = goc / "ziwei" / "entries"
    lay = lambda ten: json.loads((e / f"ziweiquanshu-{ten}.json").read_text(encoding="utf-8"))
    q1 = [{"thien": x["key"], "van": x["text"]} for x in lay("juan1")["items"]]
    an = [{"thien": x["key"], "van": x["text"], **({"chu_nho": x["note"]} if x.get("note") else {})} for x in lay("anxing")["items"]]
    cung = [{"cung": x["palace"], "sao": x.get("star"), "van": x["text"],
             **{k2: x[k1] for k1, k2 in (("branches", "theo_chi"), ("male", "nam_menh"), ("female", "nu_menh"), ("limit", "nhap_han")) if x.get(k1)}}
            for x in lay("gong")["items"]]
    q3 = [{"thien": x["key"], "van": x["text"]} for x in lay("juan3")["items"]]
    sao = [{"sao": x["key"], "mieu_vuong": x.get("miaowang_line"),
            "cau": [{"van": l["text"], **({"chu_nho": l["note"]} if l.get("note") else {})} for l in x["lines"]]}
           for x in lay("zhuxing")["items"]]
    return {"_nguon": "紫微斗數全書 (Tử Vi Đẩu Số Toàn Thư) — quyển 1 (phú, luận, chư tinh vấn đáp, cách cục), quyển 2 (an sao, luận 12 cung "
                      "từng sao), quyển 3 (đàm tinh yếu luận, hạn vận, chư tinh đồng viên). Cổ thư công cộng.",
            "ban": "bộ dữ liệu tianzhi-classics, commit 047b827 (chữ theo bản chép Wikisource; quyển 2–3 chữ giản thể; gốc bản khắc Nam Dương Đường 1600)",
            "source_id": "tu_vi_dau_so_toan_thu", "school_id": "tu_vi_dau_so",
            "quyen_1": q1, "an_sao": an, "muoi_hai_cung": cung, "quyen_3": q3, "chu_tinh_dong_vien": sao}


if __name__ == "__main__":
    d = doc(Path(sys.argv[1]))
    DICH.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print({k: len(v) for k, v in d.items() if isinstance(v, list)}, DICH.stat().st_size)
