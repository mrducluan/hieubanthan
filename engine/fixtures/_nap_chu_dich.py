# -*- coding: utf-8 -*-
"""Gộp nguyên văn Chu Dịch + bản dịch Việt thành KB `app/kb/data/kinhdich_hao.json`.

Nguyên văn (Quái từ, Hào từ 384 hào, Dụng Cửu/Dụng Lục, Đại tượng, Thoán truyện): cổ thư công cộng,
bản số hoá lấy từ gói npm `opencode-tianji` 0.6.0 (MIT) — data/爻辞.json, data/tuan_xiang.json — lưu ở
fixtures/chu_dich/nguyen_van.json. Bản dịch + ý luận: nháp AI (fixtures/chu_dich/dich_*.json), chờ duyệt.
Chạy: cd engine && python fixtures/_nap_chu_dich.py
"""
import json
from pathlib import Path

G = Path(__file__).parent / "chu_dich"
RA = Path(__file__).parents[1] / "app" / "kb" / "data" / "kinhdich_hao.json"
SO = {"九": "Cửu", "六": "Lục", "初": "Sơ", "上": "Thượng", "二": "Nhị", "三": "Tam", "四": "Tứ", "五": "Ngũ"}


def ten_hao(h: str) -> str:
    return f"{SO[h[0]]} {SO[h[1]]}"


nv = json.loads((G / "nguyen_van.json").read_text("utf-8"))
dich: dict = {}
for f in sorted(G.glob("dich_*.json")):
    dich.update(json.loads(f.read_text("utf-8")))

que = {}
for so in range(1, 65):
    n, d = nv[str(so)], dich[str(so)]
    assert len(n["hao"]) == 6 == len(d["h"]), so
    q = {
        "que_tu": {"han": n["que_tu"], "dich": d["qt"]},
        "dai_tuong": {"han": n["dai_tuong"], "dich": d["dt"]},
        "thoan": {"han": n["thoan"]},
        "hao": [{"vi_tri": i + 1, "ten": ten_hao(n["ten_hao"][i]), "ten_han": n["ten_hao"][i],
                 "han": n["hao"][i], "dich": d["h"][i][0], "y": d["h"][i][1]} for i in range(6)],
    }
    if n.get("dung"):
        q["dung"] = {"han": n["dung"], "dich": d["dung"][0], "y": d["dung"][1]}
    que[str(so)] = q

RA.write_text(json.dumps({
    "_nguon": "Chu Dịch — Quái từ, Hào từ, Đại tượng, Thoán truyện (nguyên văn cổ thư công cộng; bản số hoá "
              "opencode-tianji 0.6.0, MIT). Dịch nghĩa + ý luận: nháp AI theo lối Nghĩa Lý, chờ đối chiếu.",
    "source_id": "chu_dich", "school_id": "nghia_ly",
    "trang_thai": "nhap_ai", "can_doi_chieu": True,
    "que": que,
}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print("ghi", RA, sum(len(q["hao"]) for q in que.values()), "hào")
