# -*- coding: utf-8 -*-
"""TK-2 việc 5 — bài từ «Tiêu Thị Dịch Lâm» cho bài đọc quẻ: đủ 64 × 64, khớp kho nguồn, không đưa bài có chữ nặng."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

from app.kb import kinhdich_dich_lam as dl
from app.kb import kinhdich_kb as kbq
from app.kb import sach_ghi

GOC = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("nap_dich_lam", GOC / "scripts" / "nap_dich_lam.py")
nap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(nap)


def test_kb_la_ban_cat_cua_kho_nguon_va_du_4096_bai():
    kb = json.loads((GOC / "app/kb/data/kinhdich_dich_lam.json").read_text("utf-8"))
    assert kb == nap.dung(), "chạy scripts/nap_dich_lam.py"
    assert len(kb["tu"]) == 64 and all(len(b) == 64 for b in kb["tu"].values())
    import re
    nguon = sach_ghi.chuan(re.sub(r"〔[^〕]*〕", "", "".join(t["van"] for t in json.loads(nap.NGUON.read_text("utf-8"))["thien"])))   # bỏ chú chữ nhỏ như bộ cắt
    assert all(len(v) >= 8 and sach_ghi.chuan(v) in nguon for b in kb["tu"].values() for v in b.values())


def test_thu_tu_ten_que_khop_bang_que_cua_engine():
    """Tên 64 phần trong sách phải đúng thứ tự Văn Vương engine dùng (so chữ Hán tên quẻ, cho phép dị thể của bản Tứ khố)."""
    di_the = {"剥": "剝", "兊": "兌", "㢲": "巽", "恒": "恆", "无妄": "無妄"}
    ten = json.loads((GOC / "app/kb/data/kinhdich_dich_lam.json").read_text("utf-8"))["ten_han"]
    lech = []
    for so in range(1, 65):
        han = ((kbq.que_van(so) or {}).get("ten_han") or (kbq.que(so) or {}).get("ten_han") or (kbq.que(so) or {}).get("han") or "")
        t = ten[so - 1]
        if han and not (t in han or di_the.get(t, t) in han or han in t):
            lech.append((so, t, han))
    assert lech == []


def test_tra_bai_theo_que_bien_va_khong_bien():
    assert dl.nguyen_van(1, 1).startswith("道陟多阪")            # 乾之乾
    assert dl.nguyen_van(1, 2).startswith("招殃來螫")            # 乾之坤
    assert dl.nguyen_van(2) == dl.nguyen_van(2, 2)               # không hào động → bài của chính quẻ
    assert dl.nguyen_van(2, 2).startswith("不風不雨白日皎皎")
    b = dl.bai(2)
    assert b == {"han": dl.nguyen_van(2), "tu": "坤", "den": "坤", "co_bien": False}
    assert dl.bai(1, 2) is None, "乾之坤 có chữ 殃 / 病 / 傷 — bài nặng không trả"
    assert dl.nguyen_van(65) is None and dl.bai(0) is None


def test_khong_bai_nao_duoc_tra_ma_con_chu_nang():
    co = [dl.bai(a, b) for a in range(1, 65) for b in range(1, 65)]
    tra = [x for x in co if x]
    assert all(not sach_ghi._HAN_NANG.search(x["han"]) for x in tra)
    assert 1200 < len(tra) < 4096
