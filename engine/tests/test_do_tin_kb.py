# -*- coding: utf-8 -*-
"""KT-TT6 — sổ độ tin của kho tri thức: tệp nào cũng phải vào sổ; mức `nguyen_van` phải có kho nguồn + test thật."""
import json
import re
from pathlib import Path

from app.kb import do_tin

GOC = Path(__file__).parent.parent
DATA = GOC / "app" / "kb" / "data"


def test_moi_tep_kb_deu_vao_so_va_so_khong_thua():
    tep = {p.name for p in DATA.glob("*.json")}
    assert tep - set(do_tin.SO) == set(), "tệp KB mới chưa ghi mức độ tin trong app/kb/do_tin.py"
    assert set(do_tin.SO) - tep == set(), "sổ độ tin còn tệp đã xoá"


def test_muc_hop_le_va_phan_co_that():
    for d in do_tin.bang():
        assert d["muc"] in do_tin.THANG, d
        if d["phan"]:
            kb = json.loads((DATA / d["tep"]).read_text("utf-8"))
            assert d["phan"] in kb, (d["tep"], d["phan"])


def test_nguyen_van_phai_co_kho_nguon_va_test_that():
    co = 0
    for d in do_tin.bang():
        if d["muc"] != "nguyen_van":
            assert not d["kho"] and not d["test"], d
            continue
        co += 1
        assert (GOC / "fixtures" / "nguon" / d["kho"]).is_file(), d
        tep_test, ham = d["test"].split("::")
        ma = (GOC / tep_test).read_text("utf-8")
        assert re.search(rf"^def {re.escape(ham)}\(", ma, flags=re.M), d
    assert co >= 9


def test_bao_cao_trong_docs_khop_so():
    from scripts import do_tin_kb
    doc = (GOC.parent / "docs" / "DO-TIN-KHO-TRI-THUC.md").read_text("utf-8")
    assert doc == do_tin_kb.dung(), "chạy: PYTHONPATH=. python scripts/do_tin_kb.py"


def test_so_khong_lo_ra_api():
    from app.main import app
    for r in app.routes:
        assert "do-tin" not in getattr(r, "path", "") and "do_tin_kb" not in getattr(r, "path", "")
