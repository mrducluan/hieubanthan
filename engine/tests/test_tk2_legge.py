# -*- coding: utf-8 -*-
"""TK-2 việc 4 — lời kinh 64 quẻ bản dịch James Legge (1882) cho bản /en.

Kho nguồn `fixtures/nguon/kinhdich_legge_que.json` do `scripts/nap_legge_que.py` cắt từ lớp chữ nhận dạng
`kinhdich_legge_1899.json`. Phép kiểm then chốt: chữ «divided / undivided» Legge ghi ở từng hào phải khớp vạch âm /
dương của quẻ trong bảng King Wen của engine — quẻ nào lệch, thiếu hào hay có dấu đọc hỏng phải gắn `can_soat` và
KHÔNG được vào bản hiển thị `app/kb/data/kinhdich_legge.json`.
"""
import json
import re
from pathlib import Path

import pytest

from app.calc import kinhdich_vendor as v

GOC = Path(__file__).parent.parent
SRC = json.loads((GOC / "fixtures/nguon/kinhdich_legge_que.json").read_text("utf-8"))
RAW = json.loads((GOC / "fixtures/nguon/kinhdich_legge_1899.json").read_text("utf-8"))
KB = json.loads((GOC / "app/kb/data/kinhdich_legge.json").read_text("utf-8"))
QUE = {q["so"]: q for q in SRC["que"]}
KW = {so: list(v.TRI_BITS[ha]) + list(v.TRI_BITS[th]) for ha, hang in v.KW.items() for th, so in hang.items()}
THU = {1: r"first|lowest", 2: r"second|secend", 3: r"third", 4: r"fourth", 5: r"fifth", 6: r"sixth|topmost|last|highest"}


def _chuan(s: str) -> str:
    return re.sub(r"[\s\-]+", "", s)


def test_du_64_que_moi_que_6_hao():
    assert sorted(QUE) == list(range(1, 65))
    for q in QUE.values():
        assert len(q["hao"]) == 6 and len(q["vach"]) == 6
    assert QUE[1].get("dung") and QUE[2].get("dung")


@pytest.mark.parametrize("so", range(1, 65))
def test_hao_dung_thu_tu_va_vach_khop_bang_king_wen(so):
    q = QUE[so]
    vach_ok = q["vach"] == KW[so]
    if not vach_ok:
        assert q["can_soat"], f"quẻ {so} lệch vạch nhưng không gắn can_soat"
        return
    for k, h in enumerate(q["hao"], 1):
        dau = h[:90].lower()
        assert re.search(THU[k], dau), f"quẻ {so} hào {k}: không có chữ chỉ vị trí — {h[:60]}"
        chu = "undivided" if KW[so][k - 1] else "divided"
        assert re.search(r"\b%s\b" % chu, dau), f"quẻ {so} hào {k}: phải là «{chu}»"


def test_ty_le_qua_kiem_cau_truc():
    """Số quẻ qua kiểm vạch âm dương (cố định để lần nạp lại không âm thầm tụt)."""
    qua = [so for so, q in QUE.items() if q["vach"] == KW[so]]
    assert len(qua) >= 63


def test_moi_doan_la_chuoi_con_cua_nguon():
    P = RAW["chuong"]
    for q in QUE.values():
        doan = P[q["vi_tri"]["chuong"]]["doan"]
        cap = [(q["que_tu"], q["vi_tri"].get("que_tu", []))] + list(zip(q["hao"], q["vi_tri"]["hao"]))
        if q.get("dung"):
            cap.append((q["dung"], q["vi_tri"]["dung"]))
        for van, idx in cap:
            if not van:
                continue
            assert idx, f"quẻ {q['so']}: thiếu vị trí đoạn nguồn"
            nguon = _chuan("".join(doan[i] for i in idx))
            assert _chuan(van) in nguon, f"quẻ {q['so']}: «{van[:60]}» không phải chữ của nguồn"


def test_ban_hien_thi_chi_sua_ten_que_va_chu_yogh():
    for q in QUE.values():
        h = q["hien_thi"]
        assert [re.sub(r"(?<!\w)3(?=[a-z])", "Ȝ", x) for x in q["hao"]] == h["hao"]
        goc = re.sub(r"(?<!\w)3(?=[a-z])", "Ȝ", q["que_tu"])
        thay = q["sua_ocr"]["ten_thay"]
        if thay:
            assert goc.replace(thay, q["ten_legge"], 1) == h["que_tu"]
        else:
            assert goc == h["que_tu"]


def test_kb_chi_gom_que_khong_can_soat():
    loai = {so for so, q in QUE.items() if q["can_soat"]}
    assert set(KB["que"]) == {str(so) for so in QUE if so not in loai}
    for so, x in KB["que"].items():
        assert x == QUE[int(so)]["hien_thi"]
        assert len(x["hao"]) == 6
    assert KB["source_id"] and KB["school_id"] and KB["nguoi_dich"].startswith("James Legge")
    assert SRC["so_que_can_soat"] == len(loai)


def test_que_can_soat_co_ly_do():
    for q in QUE.values():
        assert q["can_soat"] == bool(q["ly_do"])


def test_kb_khong_lo_ten_noi_bo():
    s = json.dumps(KB, ensure_ascii=False)
    assert "Internet Archive" not in s and "OCR" not in s and "nhận dạng" not in s
