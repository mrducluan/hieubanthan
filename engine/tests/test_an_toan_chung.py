# -*- coding: utf-8 -*-
"""EN-1 (docs/KE-HOACH-NANG-CAP-ENGINE.md, AT-1) — MỘT bộ chặn an toàn (`luangiai/an_toan.py`) cho cả 5 mảng hỏi đáp,
`/v1/hoi/dac-biet` và ô "Hôm nay". Bộ câu đóng băng `fixtures/cau_hoi/an_toan_v1.json`: 50 câu khủng hoảng (gián tiếp,
bạo lực, xâm hại…), 46 câu cần từ chối (chẩn đoán, bỏ thuốc, tuổi chết, lô đề), 102 câu BÌNH THƯỜNG dễ bị chặn nhầm (gồm
câu do reviewer độc lập viết: "dạy/dậy", "mát/mất", "tự kỷ luật", "thầy thuốc", "bỏ thuốc lá", "đánh giá"…).
Thần số và Huyền học phải ra CÙNG kết luận."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.hoidap import chung
from app.luangiai import hoi
from app.main import app

client = TestClient(app)
BO = json.loads((Path(__file__).parents[1] / "fixtures" / "cau_hoi" / "an_toan_v1.json").read_text(encoding="utf-8"))


def _hai_ben(cau: str) -> tuple[str | None, str | None]:
    a = chung.dac_biet(chung.chuan_hoa(cau), cau)
    b = hoi.phan_loai(cau)["xu_ly"]
    return a, (b if b in ("an_toan", "tu_choi_nhe") else None)


def test_khung_hoang_bat_du_ca_hai_ben():
    sai = [(c, *_hai_ben(c)) for c in BO["khung_hoang"] if _hai_ben(c) != ("an_toan", "an_toan")]
    assert not sai, sai


def test_tu_choi_ca_hai_ben():
    sai = [(c, *_hai_ben(c)) for c in BO["tu_choi"]
           if not all(x in ("tu_choi_nhe", "an_toan") for x in _hai_ben(c))]
    assert not sai, sai


def test_cau_binh_thuong_khong_chan_nham():
    sai = [(c, *_hai_ben(c)) for c in BO["binh_thuong"] if _hai_ben(c) != (None, None)]
    assert not sai, sai


@pytest.mark.parametrize("cau", ["Em muốn chết quá", "toi muon chet", "Em chẳng muốn dạy nữa, có nên đổi nghề"])
def test_api_dac_biet_dung_cau_goc(cau):
    mong = None if "dạy" in cau else "an_toan"
    assert client.post("/v1/hoi/dac-biet", json={"cau_hoi": cau}).json()["loai"] == mong


def test_kho_cu_khong_lech_hai_ben():
    """Mọi câu trong kho có nhãn mà Huyền học xếp khủng hoảng thì Thần số cũng xếp khủng hoảng (một nguồn)."""
    d = Path(__file__).parents[1] / "fixtures" / "cau_hoi"
    lech = []
    for tep in ("thanso_cau_hoi.jsonl", "huyenhoc_cau_hoi.jsonl", "holdout_mt_ds.jsonl", "holdout_v2.jsonl"):
        for l in (d / tep).read_text(encoding="utf-8").splitlines():
            c = json.loads(l).get("cau_hoi") or json.loads(l).get("q")
            if not c:
                continue
            a, b = _hai_ben(c)
            if (a == "an_toan") != (b == "an_toan"):
                lech.append((tep, c, a, b))
    assert not lech, lech[:10]


def test_chuan_hoa_d_la():
    assert chung.chuan_hoa("Ðặng") == chung.chuan_hoa("Đặng") == "dang"
