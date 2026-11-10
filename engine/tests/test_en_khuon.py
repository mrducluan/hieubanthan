# -*- coding: utf-8 -*-
"""EN-ALL GĐ 2 — khuôn dùng chung ở bản Anh: mọi mã `L("…")` viết sẵn trong mã có chữ tiếng Anh; các hàm khuôn
(nhãn mức, cắt tiêu đề, nhất quán liên mảng, lời theo hoàn cảnh, câu năm nên chú ý) ra chữ tiếng Anh sạch; bản Việt
không đổi (golden `test_dau_ra_vi_bat_bien`)."""
import ast
import datetime as dt
import pathlib
import re

import pytest

from app import ngon_ngu
from app.kb import loi
from tests import _dau_ra as dr

APP = pathlib.Path(__file__).resolve().parents[1] / "app"
VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)


def _ma_L() -> list[tuple[str, str]]:
    ra = []
    for p in APP.rglob("*.py"):
        for n in ast.walk(ast.parse(p.read_text(encoding="utf-8"))):
            if isinstance(n, ast.Call) and getattr(n.func, "id", None) == "L" and n.args and isinstance(n.args[0], ast.Constant):
                ra.append((p.name, n.args[0].value))
    return ra


def test_moi_ma_L_co_tieng_anh():
    b = loi.bang("en")
    thieu = sorted({f"{f}:{m}" for f, m in _ma_L() if m not in b})
    assert not thieu, f"Mã L() chưa có chữ tiếng Anh (kb/data/en/loi_khuon.json hoặc en/loi/*.json): {thieu[:20]}"


def test_mau_tieng_anh_sach_va_slot_khop():
    b = loi.bang("en")
    for ma, s in b.items():
        assert isinstance(s, str) and s.strip(), ma
        assert not VIET.search(s), (ma, s)
    # slot tiếng Anh phải là tập con slot mà mã truyền vào: kiểm qua các lời gọi có chữ Việt hằng
    for p in APP.rglob("*.py"):
        for n in ast.walk(ast.parse(p.read_text(encoding="utf-8"))):
            if not (isinstance(n, ast.Call) and getattr(n.func, "id", None) == "L" and n.args and isinstance(n.args[0], ast.Constant)):
                continue
            ma = n.args[0].value
            if ma not in b:
                continue
            co = {k.arg for k in n.keywords if k.arg}
            can = set(re.findall(r"\{([a-z_][a-z0-9_]*)\}", b[ma]))
            assert can <= co, f"{p.name}: {ma} cần slot {sorted(can - co)}"


def test_khuon_doi_song_tieng_anh():
    from app.luangiai import doi_song_chung as dsc, doi_song_khuon as kh
    with ngon_ngu.dung("en"):
        assert kh.nhan_muc("can_chu_dong") == "Needs care" and kh.nhan_muc("thuan") == "Favourable"
        n = "You stay calm under pressure, and people trust you with money. Keep a written budget."
        assert kh.than_khong_lap_tieu_de("You stay calm under pressure", n) == "People trust you with money. Keep a written budget."
        t, than = kh.tach_tieu_de("You stay calm under pressure", n)
        assert t == "You stay calm under pressure, and people trust you with money" and than == "Keep a written budget."
        td = dsc._tieu_de("At work you are the one people call when a plan needs a steady hand and a clear deadline.", "x")
        assert td.startswith("At work") and len(td) <= 60 and not td.endswith((" the", " a", " and"))
        assert dsc.nhan_co("tam_tai").startswith("a Three Calamities")
    assert kh.nhan_muc("can_chu_dong") == "Cần lưu ý"


def test_nhat_quan_tieng_anh():
    from app.luangiai import nhat_quan
    with ngon_ngu.dung("en"):
        for muc in ({"tuvi": "thuan", "battu": "thuan"}, {"tuvi": "can_chu_dong", "battu": "thuan"},
                    {"tuvi": "can_bang", "battu": "can_chu_dong", "thanso": "thuan"}):
            h = nhat_quan.nam(2027, muc)
            assert h and not dr.loi_en(h), dr.loi_en(h)
            assert "2027" in h["tieu_de"]


def test_hoan_canh_tieng_anh():
    from app.luangiai import hoan_canh as hc
    with ngon_ngu.dung("en"):
        for ch in hc.CHUONG:
            for muc in hc.MUC:
                for tuoi in (20, 30, 50, 65):
                    for tt in (None, "doc_than", "co_doi"):
                        h = hc.hop(ch, muc, dt.date(2027 - tuoi, 5, 1), dt.date(2027, 5, 1), tt, "ds")
                        assert h, (ch, muc, tuoi, tt)
                        assert not dr.loi_en(h), (ch, muc, tuoi, tt, dr.loi_en(h))
                        if ch == "suc_khoe":
                            assert "doctor" in h["noi_dung"]


@pytest.mark.parametrize("mang", ["tien_bac", "cong_viec", "tinh_cam", "gia_dao", "nha_cua", "di_lai", "giay_to", "ban_be"])
def test_chu_y_nam_tieng_anh(mang):
    from app.luangiai import chu_y_nam as cy
    with ngon_ngu.dung("en"):
        ds = [{"nam": 2027, "hien_tai": True}, {"nam": 2029}, {"nam": 2031}]
        for s in (cy.cau_mang(mang, ds), cy.cau_mang(mang, ds[1:]), cy.tieu_de([mang, "tien_bac"])):
            assert not dr.loi_en({"s": s}), (mang, s)


def test_ten_hien_cho_truong_ma():
    """Trường MÃ tên riêng giữ giá trị Việt (web dùng làm khoá); bản Anh kèm `ten_hien`; bản Việt không có trường này."""
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    ls = dr._ls("1990-05-17", "08:30", "nam")
    vi = c.post("/v1/battu/la-so", json=ls).json()
    en = c.post("/v1/battu/la-so", json=ls, headers={"x-ngon-ngu": "en"}).json()
    assert "ten_hien" not in vi
    assert en["tru"] == vi["tru"]                                    # mã không đổi
    assert en["ten_hien"]["can"][vi["tru"][0]["can"]] and not VIET.search(en["ten_hien"]["can"][vi["tru"][0]["can"]])
    assert not [x for x in dr.loi_en(en) if "tru[" in x]            # can / chi của trụ đã có tên hiển thị
    assert dr.loi_en({"can": "Mậu"}) and not dr.loi_en({"can": "Mậu", "ten_hien": {"can": {"Mậu": "Wu"}}})
