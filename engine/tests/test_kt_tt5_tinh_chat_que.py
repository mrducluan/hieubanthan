# -*- coding: utf-8 -*-
"""KT-TT5 — tính chất quẻ Lục Hào (lục xung, lục hợp, du hồn, quy hồn, biến xung ↔ hợp) theo Tăng San Bốc Dịch.

CALC chỉ NHẬN DIỆN từ nạp giáp + bát cung đã có; không đổi mức nào của bài đọc."""
import itertools
import json
from pathlib import Path

from app.calc import kinhdich, luc_hao as lh
from app.calc import kinhdich_vendor as v

_NGUON = Path(__file__).parent.parent / "fixtures" / "nguon" / "tang_san_boc_dich.json"


def _moi_que():
    for bits in itertools.product((0, 1), repeat=6):
        yield kinhdich.khoi_que([7 if b else 8 for b in bits])


def _ten(loai=None, hon=None):
    return sorted(q["quai_ban"]["so_king_wen"] for q in _moi_que()
                  if (loai is None or lh.tinh_chat_que(q)["loai"] == loai) and (hon is None or lh.tinh_chat_que(q)["hon"] == hon))


def test_muoi_que_luc_xung_tam_que_luc_hop():
    # 8 quẻ thuần + Vô Vọng (25) + Đại Tráng (34)
    assert _ten(loai="luc_xung") == sorted([1, 2, 29, 30, 51, 52, 57, 58, 25, 34])
    # Bĩ 12, Thái 11, Khốn 47, Tiết 60, Bí 22, Lữ 56, Dự 16, Phục 24
    assert _ten(loai="luc_hop") == sorted([12, 11, 47, 60, 22, 56, 16, 24])


def test_du_hon_quy_hon_theo_bat_cung():
    du, quy = _ten(hon="du_hon"), _ten(hon="quy_hon")
    assert len(du) == 8 and len(quy) == 8 and not set(du) & set(quy)
    assert 35 in du and 5 in du          # 乾宮中之火地晉，坤宮中之水天需
    assert 14 in quy and 8 in quy        # 乾宮中之火天大有，坤宮中之水地比


def test_bien_theo_vi_du_trong_sach():
    # 乾之泰: ngoại quái ba hào động — «謂之六沖變六合»
    assert lh.tinh_chat_que(kinhdich.khoi_que([7, 7, 7, 9, 9, 9]))["bien"] == "xung_hoa_hop"
    # 離卦變火山旅 (hào 1 động)
    assert lh.tinh_chat_que(kinhdich.khoi_que([9, 8, 7, 7, 8, 7]))["bien"] == "xung_hoa_hop"
    # 天地否卦變乾卦 (ba hào dưới động) — «合而變沖»
    assert lh.tinh_chat_que(kinhdich.khoi_que([6, 6, 6, 7, 7, 7]))["bien"] == "hop_hoa_xung"
    # 旅卦變賁卦 — «六合卦變六合»
    q = kinhdich.khoi_que([6, 8, 7, 9, 8, 7])
    assert q["quai_ban"]["so_king_wen"] == 56 and q["quai_bien"]["so_king_wen"] == 22
    assert lh.tinh_chat_que(q)["bien"] == "hop_hoa_hop"
    # quẻ tĩnh / quẻ thường
    assert lh.tinh_chat_que(kinhdich.khoi_que([7, 8, 7, 8, 7, 8])) == {"loai": None, "hon": None, "bien": None}


def test_trich_la_nguyen_van_va_kb_du_loi():
    from app.kb import kinhdich_tra_loi_kb as kbt
    van = "".join(t["van"] for t in json.loads(_NGUON.read_text("utf-8"))["thien"])
    for ma in ("luc_xung", "luc_hop", "du_hon", "quy_hon", "xung_hoa_hop", "hop_hoa_xung"):
        m = kbt.tinh_chat_que(ma)
        assert m and m["loi"] and m["trich"] in van, ma
    assert kbt.tinh_chat_que("chung")["trich"] in van


def test_bai_doc_co_dong_the_que_va_khong_doi_muc(monkeypatch):
    import datetime as dt
    from app.luangiai import doi_song_khuon as kh
    from app.main import app
    from fastapi.testclient import TestClient
    c = TestClient(app)
    than = {"cau_hoi": "Tôi có nên đổi việc trong năm nay không?", "che_do": "day_du", "cach_ra_que": "gieo_tay",
            "gia_tri_hao": [7, 7, 7, 9, 9, 9], "thoi_diem": "2026-11-12T09:00:00"}
    r = c.post("/v1/kinhdich/hoi", json=than)
    assert r.status_code == 200, r.text
    dq = r.json()["doc_que"]
    tc = dq["tinh_chat_que"]
    assert tc["loai"] == "luc_xung" and tc["bien"] == "xung_hoa_hop" and tc["loi"]
    assert any(tc["loi"][0] in d for d in dq["doan"])
    assert any("六沖" in x["noi_dung"] or "散而復聚" in x["noi_dung"] for x in dq["can_cu"])
    for thuat_ngu in ("lục xung", "lục hợp", "du hồn", "quy hồn", "dụng thần"):
        assert all(thuat_ngu not in s.lower() for s in tc["loi"])
    monkeypatch.setattr(lh, "tinh_chat_que", lambda q: {"loai": None, "hon": None, "bien": None})
    dq2 = c.post("/v1/kinhdich/hoi", json=than).json()["doc_que"]
    assert dq2["muc"] == dq["muc"] and [h["ma_mau"] for h in dq2["hop"]] == [h["ma_mau"] for h in dq["hop"]]
    assert not dq2.get("tinh_chat_que")
