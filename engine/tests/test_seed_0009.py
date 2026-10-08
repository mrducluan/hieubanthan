# -*- coding: utf-8 -*-
"""Migration 0009 (chân dung + quan hệ) phải khớp file KB — JSON là nguồn chân lý, SQL sinh từ nó.
Sửa KB mà quên chạy scripts/sinh_seed_thanso_v2.py thì test này đỏ."""
import json
import re
from pathlib import Path

GOC = Path(__file__).resolve().parents[2]
DATA = GOC / "engine" / "app" / "kb" / "data"
MIG = GOC / "supabase" / "migrations" / "0009_kb_thanso_chan_dung_quan_he.sql"


def _dong(khoi):
    out = {}
    for m in re.finditer(r"values \('" + khoi + r"', '([^']+)', '((?:[^']|'')*)'::jsonb", MIG.read_text(encoding="utf-8")):
        out[m.group(1)] = json.loads(m.group(2).replace("''", "'"))
    return out


def test_0009_khop_kb():
    cd = json.loads((DATA / "thanso_chan_dung.json").read_text(encoding="utf-8"))
    qh = json.loads((DATA / "thanso_quan_he.json").read_text(encoding="utf-8"))
    assert _dong("chan_dung_mat") == cd["mat"]
    assert _dong("chan_dung") == cd["so"]
    assert _dong("quan_he") == qh["quan_he"]
    assert _dong("quan_he_theo_so") == qh["theo_so"]


def test_0009_co_rollback():
    down = MIG.with_name(MIG.stem + ".down.sql").read_text(encoding="utf-8")
    assert "delete from thanso_kb_khoi" in down and "'quan_he_theo_so'" in down
