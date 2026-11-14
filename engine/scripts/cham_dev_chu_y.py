# -*- coding: utf-8 -*-
"""CY-2 (2026-11-14) — chấm bộ phát triển "nên chú ý" (fixtures/cau_hoi/dev_chu_y.jsonl, 120 câu Việt + 40 câu Anh, 18 chủ
đề × 6 mảng; nhãn viết TRƯỚC khi chạy engine — đây là bộ dev, không phải holdout).

Đo cho mỗi câu: không bị chặn · đúng chủ đề (mẫu tiêu điểm ở đoạn 1–2) · hai mặt (một điểm sáng + một điều nên để ý +
một việc nên làm) · câu người làm ăn có ranh giới (không đọc được lòng người kia / luật sư) và Tarot không gắn chip
có/không cho câu về người khác.

    cd engine && .venv/bin/python scripts/cham_dev_chu_y.py [--sai] [--json out.json]
"""
from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from tests import _dau_ra as dr  # noqa: E402

TEP = GOC / "fixtures" / "cau_hoi" / "dev_chu_y.jsonl"
XEM = "2026-11-10"
LS = dr._ls("1990-05-17", "08:30", "nam", noi_sinh="ha-noi")
SINH = {"birth_date": "1990-05-17", "gender": "nam"}
TS = {"ho_ten": ["Nguyễn Văn Bình"], "ngay": 17, "thang": 5, "nam": 1990}
BA_LA = [{"id": "dai_9"}, {"id": "kiem_3", "nguoc": True}, {"id": "tien_10"}]
CHAN = {"tu_choi", "an_toan", "dan_huong", "tu_choi_nhe", "khung_hoang"}
TICH = {"vi": r"[Đđ]iểm sáng|thuận|cơ hội|[Tt]huận lợi|lợi thế|[Đđ]iểm mạnh|điểm tựa|[Đđ]ang có lợi|tốt|hợp|giúp|mạnh",
        "en": r"[Bb]right|[Ss]trength|favou?r|support|good|[Hh]elps|works for you|steady|[Ss]mooth"}
CHU_Y = {"vi": r"[Nn]ên (chú ý|để ý|cẩn thận|tránh|giữ|canh)|[Cc]ần (lưu ý|canh|chú ý)|[Ll]ưu ý|[Đđ]iểm cần|[Đđ]iều cần gỡ|[Dd]ễ vấp|[Tt]ránh:|[Cc]hỗ cần canh",
         "en": r"[Ww]atch|[Cc]areful|[Cc]aution|[Mm]ind |[Aa]void|[Bb]e aware|attention"}
VIEC = {"vi": r"[Nn]ên (làm|giữ|ghi|rà|hỏi|chia|đối soát|tách|thử|dành|sắp)|[Vv]iệc (nên|cụ thể|làm)|[Hh]ãy|[Gg]ợi ý|Nên:",
        "en": r"[Tt]ry |[Kk]eep|[Ww]rite|[Ss]et|[Cc]heck|[Pp]ut|[Ss]plit|[Aa]sk|[Pp]lan|[Ss]tart|[Dd]o "}
RANH = {"vi": r"lòng người|luật sư|không đọc được|không nói được người|tự nhìn|người kia",
        "en": r"lawyer|legal advice|can.t read|cannot read|their heart|the other person|someone else"}


def _goi(c, r: dict) -> dict:
    md, q, nn = r["mo_dun"], r["cau_hoi"], r["ngon_ngu"]
    h = {"x-ngon-ngu": nn}
    if md == "tuvi":
        return c.post("/v1/tuvi/hoi", json={"cau_hoi": q, "che_do": "tham_khao", "ngay_xem": XEM, "la_so": LS}, headers=h).json()
    if md == "battu":
        return c.post("/v1/battu/hoi", json={"cau_hoi": q, "ngay_xem": XEM, "la_so": LS}, headers=h).json()
    if md == "thanso":
        return c.post("/v1/thanso/hoi", json={**TS, "cau_hoi": q, "ngay_xem": XEM, "quy_uoc_duong_doi": "tung_phan"}, headers=h).json()
    if md == "phongthuy":
        return c.post("/v1/phongthuy/hoi", json={"cau_hoi": q, "ngay_xem": XEM, "sinh": SINH}, headers=h).json()
    if md == "kinhdich":
        return c.post("/v1/kinhdich/hoi", json={"cau_hoi": q, "che_do": "tu_dong", "cach_ra_que": "gieo_tay",
                                                "gia_tri_hao": [7, 9, 8, 6, 7, 8], "thoi_diem": "2026-11-10T09:30:00"}, headers=h).json()
    return c.post("/v1/tarot/doc-bai", json={"trai_bai": "ba_la_loi_khuyen", "la": BA_LA, "cau_hoi": q, "ngay_xem": XEM}, headers=h).json()


def _van(md: str, k: dict) -> tuple[str, str, str | None]:
    """(đoạn 1–2, toàn văn, xử lý)."""
    if md == "tarot":
        ch = (k.get("chuong") or [{}])[0]
        doan = list(ch.get("doan") or [])
        for x in ch.get("hop") or []:
            doan.append(" ".join(str(x.get(f) or "") for f in ("nhan", "tieu_de", "noi_dung", "huong_xu_ly")))
        dau = " ".join([str(ch.get("tom_tat") or ""), *doan[:2]])
        chip = {"thuan": "CHIP_CO", "can_chu_dong": "CHIP_KHONG"}.get(str(ch.get("muc") or ""), "")
        return dau, f"{chip} " + " ".join(doan), ch.get("chan")
    ans = k.get("cau_tra_loi") or ""
    ds = [d for d in re.split(r"\n\s*\n", ans) if d.strip()]
    return " ".join(ds[:2]), ans, (k.get("phan_loai") or {}).get("xu_ly")


def cham(in_sai: bool = False) -> dict:
    rows = [json.loads(x) for x in TEP.read_text(encoding="utf-8").splitlines()[1:] if x.strip()]
    c = dr.may_khach()
    tong = collections.Counter()
    theo = collections.defaultdict(collections.Counter)
    sai = []
    with dr.dong_bang():
        for r in rows:
            nn, md = r["ngon_ngu"], r["mo_dun"]
            try:
                k = _goi(c, r)
                dau, van, xl = _van(md, k)
            except Exception as e:  # noqa: BLE001
                dau, van, xl = "", f"LOI {e}", "loi"
            kq = {"khong_chan": xl not in CHAN and xl != "loi",
                  "chu_de": bool(re.search(r["tieu_diem"], dau)),
                  "hai_mat": bool(re.search(TICH[nn], van) and re.search(CHU_Y[nn], van) and re.search(VIEC[nn], van))}
            if r["nguoi_lam_an"]:
                kq["ranh_gioi"] = bool(re.search(RANH[nn], van)) and "CHIP_CO" not in van
            ok = all(kq.values())
            tong["n"] += 1
            tong["dat"] += ok
            for kk, v in kq.items():
                tong[kk] += v
                tong["n_" + kk] += 1
            g = f"{nn}.{md}"
            theo[g]["n"] += 1
            theo[g]["dat"] += ok
            if not ok:
                sai.append((r["id"], [kk for kk, v in kq.items() if not v], r["cau_hoi"], dau[:220]))
    if in_sai:
        for s in sai:
            print(s)
    out = {"tong": f"{tong['dat']}/{tong['n']}",
           **{kk: f"{tong[kk]}/{tong['n_' + kk]}" for kk in ("khong_chan", "chu_de", "hai_mat", "ranh_gioi")},
           "theo_mang": {g: f"{v['dat']}/{v['n']}" for g, v in sorted(theo.items())}}
    print(json.dumps(out, ensure_ascii=False, indent=1))
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--sai", action="store_true")
    ap.add_argument("--json")
    a = ap.parse_args()
    o = cham(a.sai)
    if a.json:
        Path(a.json).write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8")
