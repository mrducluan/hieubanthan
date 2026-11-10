# -*- coding: utf-8 -*-
"""Đầu ra engine phải GIỐNG NHAU giữa các tiến trình, bất kể hạt băm chuỗi (`PYTHONHASHSEED`).

Lỗi cũ: (1) `kb/tu_dien._mau` lặp qua `set` các cách viết của một thuật ngữ → thứ tự mẫu (và thứ tự danh sách
`thuat_ngu[].khop` trong hỏi đáp / luận giải) đổi theo tiến trình; (2) `/v1/phongthuy/menh-quai` dựng `du_nien_y` từ `set`
→ thứ tự KHOÁ đổi theo tiến trình (so băm thân phản hồi mới bắt được, so JSON đã phân tích thì không). Test chạy một nhóm lượt gọi (lấy từ bộ lượt gọi golden,
gồm những lượt từng lệch) trong hai tiến trình con với hai hạt băm khác nhau rồi so băm từng phản hồi."""
import json
import os
import subprocess
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]

# Mỗi mảng ít nhất một lượt từng lệch giữa hai hạt băm + vài lượt thường.
LUOT = [
    "hoi.tuvi.an_toan_v1.binh_thuong.5", "hoi.tuvi.huyenhoc_cau_hoi.hhq00031", "hoi.tuvi.dev_en3c.c_tv047",
    "hoi.kinhdich.huyenhoc_cau_hoi.hhq00155", "hoi.kinhdich.dev_en3c.c_kd022",
    "hoi.battu.huyenhoc_cau_hoi.hhq00200", "hoi.battu.dev_en3.d_bt039",
    "hoi.thanso.tsq00312", "hoi.thanso.tsq00001",
    "tuvi.luan_giai.hs07", "battu.luan_giai.hs04",
    "phongthuy.menh_quai.hs00", "phongthuy.menh_quai.hs07",          # thứ tự KHOÁ `du_nien_y` (dựng từ set)
]

_MA = r"""
import json, sys
from tests import _dau_ra as dr
can = set(json.loads(sys.argv[1]))
c = dr.may_khach()
ra = {}
with dr.dong_bang():
    for lg in dr.luot_goi(c):
        if lg[0] in can:
            st, nd = dr.goi(c, lg, "vi")
            ra[lg[0]] = dr.bam(st, nd)
print("KQ=" + json.dumps(ra, sort_keys=True))
"""


def _chay(hat: str) -> dict:
    env = {**os.environ, "PYTHONHASHSEED": hat, "PYTHONPATH": str(GOC)}
    env.pop("OPENROUTER_API_KEY", None)
    r = subprocess.run([sys.executable, "-c", _MA, json.dumps(LUOT)], cwd=GOC, env=env, capture_output=True, text=True,
                       timeout=600)
    assert r.returncode == 0, r.stderr[-3000:]
    dong = [d for d in r.stdout.splitlines() if d.startswith("KQ=")]
    return json.loads(dong[-1][3:])


def test_phan_hoi_giong_nhau_giua_hai_hat_bam():
    a, b = _chay("1"), _chay("2")
    assert set(a) == set(LUOT), f"thiếu lượt gọi: {sorted(set(LUOT) - set(a))}"
    lech = sorted(m for m in LUOT if a[m] != b[m])
    assert not lech, f"phản hồi đổi theo PYTHONHASHSEED: {lech}"


def test_mau_tu_dien_khong_lap_qua_set():
    """Thứ tự mẫu của từ điển = độ dài giảm dần, hoà thì tên chính trước rồi biến thể theo thứ tự trong KB."""
    from app.kb import tu_dien

    for mo_dun in sorted({m["mo_dun"] for m in tu_dien.tat_ca()}):
        theo_ma: dict[str, list[str]] = {}
        for p, m in tu_dien._mau(mo_dun):
            theo_ma.setdefault(m["ma"], []).append(p.pattern)
        for m in tu_dien.tat_ca(mo_dun):
            if m["ma"] not in theo_ma:
                continue
            cho = [f for f in dict.fromkeys([m["ten"], *m["bien_the"]])
                   if not (len(f) < 3 or f in tu_dien._BO_BIEN_THE or f.isdigit())]
            cho.sort(key=lambda f: -len(f))
            mau = [r"(?<!\w)" + tu_dien.re.escape(tu_dien._chuan(f)) + r"(?!\w)" for f in cho]
            assert theo_ma[m["ma"]] == mau, m["ma"]


def test_ly_do_ngay_theo_thu_tu_ky_dan_gian_cua_ngay():
    """Ngày phạm nhiều điều kiêng dân gian: lý do nêu theo thứ tự của NGÀY (trước đây lặp qua giao của hai `set`)."""
    from app.luangiai import hoang_lich as hl

    v = {"nghi": [], "tranh_truc": [], "tranh_dan_gian": ["tam_nuong", "nguyet_ky", "duong_cong"]}
    for thu_tu in (["duong_cong", "tam_nuong", "nguyet_ky"], ["nguyet_ky", "duong_cong", "tam_nuong"]):
        c = {"nghi": [], "ky": [], "truc": "", "ky_dan_gian": thu_tu}
        assert hl._ly_do(c, v) == [f"ngày {hl.KB['ky_dan_gian'][k]['ten']} — dân gian thường tránh" for k in thu_tu]
