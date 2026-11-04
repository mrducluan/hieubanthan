# -*- coding: utf-8 -*-
"""TV-ZW "Cùng sao Mệnh" — tầng RULES: "khoảng 1 trong N thời điểm sinh có cùng sao Mệnh như bạn".

Thay ý "người nổi tiếng có lá số giống bạn" (không làm — dữ liệu cá nhân, giờ sinh ước đoán). Tỉ lệ đếm trên mẫu cố định
(`calc/tuvi_sao_menh.py`, mọi ngày 1940–2010 × 12 canh giờ) như "bạn hiếm cỡ nào" của Bản đồ con số — không phải thống
kê dân số. Lời ở KB `tuvi_cung_sao_menh_kb.json` (nháp); thuật ngữ chỉ ở `can_cu` ("Vì sao nói vậy"). Không đổi lá số,
không chấm điểm, không gợi ý ai giống ai.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.calc import tuvi_sao_menh as sm

_F = Path(__file__).resolve().parents[1] / "kb" / "data" / "tuvi_cung_sao_menh_kb.json"


@lru_cache(maxsize=1)
def _kb() -> dict:
    return json.loads(_F.read_text(encoding="utf-8"))


NGUONG_PHO_BIEN: float = _kb()["nguong_pho_bien"]


def _so_vn(x: float, chu_so: int = 1) -> str:
    return f"{x:.{chu_so}f}".replace(".", ",")


def _nghin(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def dung(sao: list[str], muon: bool) -> dict | None:
    """Dòng "Cùng sao Mệnh" cho tổ hợp chính tinh (`muon` = cung Mệnh vô chính diệu, `sao` là sao mượn). None nếu tổ hợp
    không có trong bảng (không thể xảy ra với lá số thật)."""
    t = sm.ty_le(sao, muon) if sao else None
    if t is None:
        return None
    k = _kb()
    ten = [x for x in sm.CHINH_TINH if x in sao]
    noi = " và ".join(ten)
    cum = (k["mo_ta"]["hai"] if len(ten) > 1 else k["mo_ta"]["mot"]).format(sao=noi)
    if muon:
        cum = k["mo_ta"]["muon"].format(sao=cum.replace(" ở cung Mệnh", ""))
    muc = "pho_bien" if t["ty_le"] >= NGUONG_PHO_BIEN else "it_gap"
    mot_trong = round(1 / t["ty_le"])
    bien = {"mot_trong": mot_trong, "mo_ta": cum, "mau": t["mau"], "tong": _nghin(t["tong"]), "khoa": t["khoa"],
            "so": _nghin(t["so"]), "phan_tram": _so_vn(t["ty_le"] * 100), "hang": t["hang"], "so_to_hop": t["so_to_hop"]}
    return {
        "sao": ten, "muon": muon, "khoa": t["khoa"], "ty_le": round(t["ty_le"], 5), "mot_trong": mot_trong,
        "phan_tram": bien["phan_tram"], "muc": muc, "nhan_muc": k["muc"][muc]["nhan"],
        "loi": k["muc"][muc]["loi"].format(**bien), "nhan_ngan": k["nhan_ngan"].format(**bien),
        "can_cu": k["can_cu"].format(**bien),
        "source_id": k["source_id"], "school_id": k["school_id"], "trang_thai": k["trang_thai"],
    }


def tu_la_so(la: dict) -> dict | None:
    """Từ lá số iztro thô (`tuvi_an_sao.an_sao_tho`): đọc chính tinh cung Mệnh (vô chính diệu → cung đối diện)."""
    p = la["palaces"]
    i = next(k for k, x in enumerate(p) if x["name"] == "Mệnh")
    muon = not p[i]["majorStars"]
    c = p[(i + 6) % 12] if muon else p[i]
    return dung([s["name"] for s in c["majorStars"]], muon)
