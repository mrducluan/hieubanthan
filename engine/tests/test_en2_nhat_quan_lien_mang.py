# -*- coding: utf-8 -*-
"""EN-2 (mục 1) — lớp nhất quán liên mảng `luangiai/nhat_quan.py`: Tử vi và Bát tự cùng mức NĂM → một hộp "hai lá số
cùng thấy"; khác mức → một hộp giải thích vì sao (mỗi môn nhìn một mặt) + việc nên làm chung. Không điểm số, không đổi
mức của từng môn."""
from __future__ import annotations

import datetime as dt
import itertools

from app.luangiai import doi_song_khuon as kh
from app.luangiai import nhat_quan as nq
from app.luangiai import thoi_gian_toi as tgt

MUC = ("thuan", "can_bang", "can_chu_dong")


def test_cung_muc_thanh_diem_nhan():
    for m in MUC:
        h = nq.nam(2027, {"tuvi": m, "battu": m})
        assert h["muc"] == m and "cùng" in h["tieu_de"]
        assert h["loai"] == {"thuan": "diem_manh", "can_bang": "loi_khuyen", "can_chu_dong": "luu_y"}[m]
        assert kh.MA_MAU_RE.match(h["ma_mau"]) if hasattr(kh, "MA_MAU_RE") else h["ma_mau"].startswith("ds.")


def test_khac_muc_giai_thich_khong_chon_ben():
    for a, b in itertools.permutations(MUC, 2):
        h = nq.nam(2027, {"tuvi": a, "battu": b})
        assert h.get("muc") is None and h["loai"] == "loi_khuyen"
        nd = h["noi_dung"]
        assert "Tử vi" in nd and "Bát tự" in nd and "mặt" in nd
        assert h.get("huong_xu_ly")
        # không phán ai đúng ai sai
        assert "sai" not in nd.split() and "đúng hơn" not in nd


def test_thieu_mot_mon_thi_khong_co_hop():
    assert nq.nam(2027, {"tuvi": "thuan"}) is None
    assert nq.nam(2027, {}) is None


def test_thoi_gian_toi_co_hop_nhat_quan():
    bc = tgt.lap(dt.date(1990, 5, 15), dt.date(2026, 11, 1), 2026, "nam",
                 tv_sinh={"ngay": dt.date(1990, 5, 15), "ti": 4, "gioi_tinh": "nam"},
                 bt_sinh={"lich": dt.datetime(1990, 5, 15, 9, 0), "gioi_tinh": "nam"})
    c1 = bc["chuong"][0]
    nam_tv = next(h for h in c1["hop"] if h["ma_mau"].startswith("ds.tgt.tuvi.nam"))
    nam_bt = next(h for h in c1["hop"] if h["ma_mau"].startswith("ds.tgt.battu.nam"))
    nq_h = [h for h in c1["hop"] if h["ma_mau"].startswith("ds.tgt.nhat_quan")]
    assert len(nq_h) == 1
    if nam_tv.get("muc") == nam_bt.get("muc"):
        assert nq_h[0]["muc"] == nam_tv["muc"]
    else:
        assert nq_h[0].get("muc") is None
