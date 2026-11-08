# -*- coding: utf-8 -*-
"""KD-V3 — hai thước đo cho lớp "trả lời theo việc" của Kinh Dịch (chỉ báo cáo, không sửa gì).

1. Hiểu câu: bộ dev `fixtures/cau_hoi/kinhdich_hieu_cau_dev.jsonl` (nhãn viết TRƯỚC khi chạy engine) — kiểu câu, vai,
   chủ đề, dụng thần đúng bao nhiêu phần trăm.
2. Độ riêng: CÙNG một quẻ (gieo tay cố định) cho N câu hỏi khác nhau → lớp đời thường (câu đầu + hộp + đoạn) của hai
   câu bất kỳ giống nhau bao nhiêu (Jaccard cụm 4 chữ). "Trước" = dựng lại lớp cũ từ cùng gói (kết luận chung của mức +
   hộp chung của quẻ), "sau" = lớp hiện tại. Số thấp = bài đọc bám câu hỏi hơn.

Chạy: PYTHONPATH=. .venv/bin/python scripts/do_kinhdich_v3.py
"""
from __future__ import annotations

import datetime as dt
import itertools
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.hoidap import chung, kinhdich as k  # noqa: E402
from app.kb import kinhdich_doi_song_kb as kb  # noqa: E402
from app.luangiai import kinhdich_tra_loi as ktl  # noqa: E402

FX = Path(__file__).resolve().parents[1] / "fixtures" / "cau_hoi" / "kinhdich_hieu_cau_dev.jsonl"
QUE = {"ky_te_h3": [7, 8, 9, 8, 7, 8], "ly_h6": [7, 7, 8, 7, 7, 9], "can_tinh": [7, 7, 7, 7, 7, 7], "khon_h2": [8, 6, 8, 8, 8, 8]}
THOI = dt.datetime(2026, 11, 8, 10, 30)
CAU = ["Tôi có nên nhận lời làm quản lý không?", "Vợ chồng tôi hay cãi nhau, có nên ly thân một thời gian không?",
       "Con tôi năm nay thi đại học có đậu không?", "Bạn thân nợ tôi 50 triệu, có đòi được không?",
       "Khi nào tôi tìm được việc mới?", "Có nên mua căn hộ đang xem không?", "Hợp tác với đối tác này có lợi không?",
       "Tôi nên làm gì để được sếp cất nhắc?"]


def hieu_cau() -> dict:
    ds = [json.loads(l) for l in FX.read_text(encoding="utf-8").splitlines() if l.strip()]
    dung = {"kieu": 0, "vai": 0, "chu_de": 0, "dung_than": 0}
    sai = []
    for r in ds:
        pl = k.phan_loai(r["cau"])
        t = pl["cau_chuan_hoa"]
        from app.luangiai import kinhdich_doi_song as ds_
        cd = ds_.chu_de_tu_cau(t)
        hc = ktl.hieu_cau(t, r["cau"], cd)
        dtv = ktl.dung_than(hc)
        got = {"kieu": hc["kieu"], "vai": hc["vai"], "chu_de": cd, "dung_than": dtv["chinh"]}
        for kk in dung:
            if got[kk] == r[kk]:
                dung[kk] += 1
            else:
                sai.append((r["cau"], kk, r[kk], got[kk]))
    n = len(ds)
    return {"n": n, "ty_le": {kk: f"{v}/{n}" for kk, v in dung.items()}, "sai": sai}


def _cum(s: str, n: int = 4) -> set[str]:
    w = chung.chuan_hoa(s).split()
    return {" ".join(w[i:i + n]) for i in range(max(0, len(w) - n + 1))}


def _jac(a: set[str], b: set[str]) -> float:
    return len(a & b) / len(a | b) if (a | b) else 1.0


def _lop_sau(dq: dict) -> str:
    return " ".join([dq["ket_luan"], *(h["noi_dung"] for h in dq["hop"]), *(h.get("huong_xu_ly") or "" for h in dq["hop"]), *dq["doan"]])


def _lop_truoc(dq: dict, cd: str) -> str:
    """Lớp cũ dựng lại từ cùng gói: kết luận chung của mức + hộp không có phần riêng theo câu."""
    muc = dq["muc"]
    ten_viec = (kb.chu_de(cd) or {}).get("ten", "việc khác").split(" (")[0].lower()
    kl = f"Về việc {ten_viec}: {kb.muc(muc).get('ket_luan', '')}"
    hop = [h for h in dq["hop"] if h["loai"] in ("loi_khuyen", "thoi_diem") or h["tieu_de"] == "Điều dễ vấp"]
    doan = [d for d in dq["doan"] if not d.startswith("Hai cách đọc")]
    return " ".join([kl, kl, *(h["noi_dung"].split(". ", 1)[-1] if h["tieu_de"] == "Điều dễ vấp" else h["noi_dung"] for h in hop),
                     *(h.get("huong_xu_ly") or "" for h in hop), *doan])


def do_rieng() -> dict:
    ra = {}
    for ten, vals in QUE.items():
        truoc, sau = [], []
        for c in CAU:
            kq = k.tra_loi(c, gia_tri_hao=vals, thoi_diem=THOI, cach_ra_que="gieo_tay")
            dq = kq.get("doc_que")
            if not dq:
                continue
            truoc.append(_cum(_lop_truoc(dq, dq["chu_de"]["ma"])))
            sau.append(_cum(_lop_sau(dq)))
        jt = [_jac(a, b) for a, b in itertools.combinations(truoc, 2)]
        js = [_jac(a, b) for a, b in itertools.combinations(sau, 2)]
        ra[ten] = {"n_cau": len(sau), "giong_nhau_truoc": round(sum(jt) / len(jt), 3), "giong_nhau_sau": round(sum(js) / len(js), 3)}
    return ra


if __name__ == "__main__":
    h = hieu_cau()
    print("## Hiểu câu (bộ dev %d câu):" % h["n"], h["ty_le"])
    for s in h["sai"]:
        print("  sai:", s)
    print("## Độ giống nhau giữa các bài đọc cùng quẻ (Jaccard cụm 4 chữ; thấp = riêng hơn):")
    for ten, r in do_rieng().items():
        print(f"  {ten}: trước {r['giong_nhau_truoc']} → sau {r['giong_nhau_sau']} ({r['n_cau']} câu)")
