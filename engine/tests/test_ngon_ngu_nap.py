# -*- coding: utf-8 -*-
"""QTE-2 (docs/DANH-GIA-KIEN-TRUC-DA-NGON-NGU.md) — ngữ cảnh ngôn ngữ của lượt gọi + MỘT hàm đọc KB có lớp phủ.

Viết TRƯỚC `app/ngon_ngu.py`, `app/kb/nap.py`. Bất biến quan trọng nhất: KHÔNG có bản phủ → `nap.doc(tệp)` y hệt
`json.loads` tệp gốc cho MỌI tệp KB (tiếng Việt không đổi một ký tự khi thêm tầng ngôn ngữ)."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.kb import nap
from app.main import app

client = TestClient(app)
DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
KB = Path(__file__).resolve().parents[1] / "app" / "kb"


# ---------------------------------------------------------------- ngôn ngữ ---------------------------------------
@pytest.mark.parametrize("vao,ra", [
    (None, "vi"), ("", "vi"), ("vi", "vi"), ("vi-VN", "vi"), ("EN", "en"), ("en-US", "en"), ("en_GB", "en"),
    ("zh-Hant", "zh-hant"), ("zh-TW", "zh-hant"), ("zh-HK", "zh-hant"), ("zh-CN", "vi"), ("zh-Hans", "vi"),
    ("fr", "vi"), ("xx-yy-zz", "vi"), ("'; drop", "vi"),
])
def test_chuan_ma_ngon_ngu(vao, ra):
    assert ngon_ngu.chuan(vao) == ra


def test_mac_dinh_la_viet_va_dung_khoi_phuc():
    assert ngon_ngu.hien_tai() == "vi" and ngon_ngu.la_viet()
    with ngon_ngu.dung("en"):
        assert ngon_ngu.hien_tai() == "en" and not ngon_ngu.la_viet()
        with ngon_ngu.dung("zh-tw"):
            assert ngon_ngu.hien_tai() == "zh-hant"
        assert ngon_ngu.hien_tai() == "en"
    assert ngon_ngu.hien_tai() == "vi"


def test_middleware_doc_header_va_query(monkeypatch):
    thay: list[str] = []

    @app.get("/_test/ngon-ngu")
    def _xem() -> dict:
        thay.append(ngon_ngu.hien_tai())
        return {"ngon_ngu": ngon_ngu.hien_tai()}

    try:
        assert client.get("/_test/ngon-ngu").json()["ngon_ngu"] == "vi"
        assert client.get("/_test/ngon-ngu", headers={"x-ngon-ngu": "en-US"}).json()["ngon_ngu"] == "en"
        assert client.get("/_test/ngon-ngu?ngon_ngu=zh-Hant").json()["ngon_ngu"] == "zh-hant"
        # header thắng query; mã lạ → vi; lượt sau không "dính" lượt trước
        assert client.get("/_test/ngon-ngu?ngon_ngu=en", headers={"x-ngon-ngu": "vi"}).json()["ngon_ngu"] == "vi"
        assert client.get("/_test/ngon-ngu", headers={"x-ngon-ngu": "klingon"}).json()["ngon_ngu"] == "vi"
        assert client.get("/_test/ngon-ngu").json()["ngon_ngu"] == "vi"
    finally:
        app.router.routes[:] = [r for r in app.router.routes if getattr(r, "path", "") != "/_test/ngon-ngu"]
    assert ngon_ngu.hien_tai() == "vi"


# ---------------------------------------------------------------- lớp phủ ----------------------------------------
def test_gop_theo_quy_tac():
    goc = {"a": "Xin chào", "so": 3, "b": {"c": "Tên", "d": ["x", "y", "z"], "e": None}, "ds": [{"t": "một"}, {"t": "hai"}]}
    phu = {"a": "Hello", "so": 99, "b": {"c": "Name", "d": ["ex", ""], "them": "no"}, "ds": [{}, {"t": "two"}], "_trang_thai": "nhap_may"}
    ra = nap.gop(goc, phu)
    assert ra == {"a": "Hello", "so": 3, "b": {"c": "Name", "d": ["ex", "y", "z"], "e": None}, "ds": [{"t": "một"}, {"t": "two"}]}
    assert goc["a"] == "Xin chào" and goc["b"]["d"] == ["x", "y", "z"]          # không sửa đối số
    assert nap.gop(goc, None) == goc and nap.gop(goc, None) is not goc            # luôn là bản sao
    assert nap.gop("vi", 5) == "vi" and nap.gop(["a"], {"0": "b"}) == ["a"]


def test_khong_co_ban_phu_thi_y_het_tep_goc():
    """Mọi tệp KB gốc: đọc qua nap ở tiếng Việt VÀ tiếng Anh (chưa có bản phủ) đều bằng json.loads tệp gốc."""
    tep = sorted(p.name for p in DATA.glob("*.json"))
    assert len(tep) > 50
    co_phu = {p.name for p in (DATA / "en").glob("*.json")} if (DATA / "en").exists() else set()
    for t in tep:
        goc = json.loads((DATA / t).read_text(encoding="utf-8"))
        assert nap.doc(t) == goc, t
        if t not in co_phu:
            with ngon_ngu.dung("en"):
                assert nap.doc(t) == goc, t


def test_ban_phu_duoc_gop_va_nho_theo_ngon_ngu(tmp_path, monkeypatch):
    monkeypatch.setattr(nap, "DATA", tmp_path)
    nap.xoa_nho()
    (tmp_path / "x.json").write_text(json.dumps({"source_id": "s", "muc": [{"ma": "a", "ten": "Tử Vi", "so": 1}]}), encoding="utf-8")
    (tmp_path / "en").mkdir()
    (tmp_path / "en" / "x.json").write_text(json.dumps({"_trang_thai": "nhap_may", "muc": [{"ten": "Zi Wei", "so": 7, "ma": "b"}]}),
                                            encoding="utf-8")
    assert nap.doc("x.json")["muc"][0] == {"ma": "a", "ten": "Tử Vi", "so": 1}
    assert nap.trang_thai_phu("x.json") is None
    with ngon_ngu.dung("en"):
        assert nap.doc("x.json")["muc"][0] == {"ma": "b", "ten": "Zi Wei", "so": 1}   # chuỗi phủ, số giữ gốc
        assert nap.trang_thai_phu("x.json") == "nhap_may"
        assert nap.co_ban_phu("x.json", "en")
    with ngon_ngu.dung("zh-hant"):
        assert nap.doc("x.json")["muc"][0]["ten"] == "Tử Vi"                           # chưa có bản phồn thể → gốc
    assert nap.doc("x.json")["muc"][0]["ten"] == "Tử Vi"                               # bộ nhớ không lẫn ngôn ngữ
    nap.xoa_nho()


def test_nho_theo_ngon_ngu_va_doi_so():
    dem = {"n": 0}

    @nap.nho
    def f(x: int) -> str:
        dem["n"] += 1
        return f"{ngon_ngu.hien_tai()}:{x}"

    assert f(1) == "vi:1" and f(1) == "vi:1" and dem["n"] == 1
    with ngon_ngu.dung("en"):
        assert f(1) == "en:1" and dem["n"] == 2
    assert f(2) == "vi:2" and dem["n"] == 3
    f.cache_clear()
    assert f(1) == "vi:1" and dem["n"] == 4


def test_tang_kb_khong_con_lru_cache_hay_doc_json_tay():
    """Mọi module tầng KB sinh CHỮ phải nhớ qua `nap.nho` và đọc tệp qua `nap.doc` — lru_cache / read_text riêng sẽ
    đóng băng ngôn ngữ đầu tiên vào bộ nhớ. Ngoại lệ: sổ hệ thống không có chữ hiển thị (`tham_dinh`, `ngay_cap_nhat`,
    `do_rieng`, `store` thần số Supabase, chính `nap`)."""
    ngoai_le = {"nap.py", "tham_dinh.py", "ngay_cap_nhat.py", "do_rieng.py", "store.py", "__init__.py"}
    vi_pham = []
    for p in sorted(KB.glob("*.py")):
        if p.name in ngoai_le:
            continue
        s = p.read_text(encoding="utf-8")
        if re.search(r"@lru_cache|functools\.lru_cache", s):
            vi_pham.append(f"{p.name}: lru_cache")
        if re.search(r"json\.loads\(\s*\(?\s*[_A-Za-z]+[^)]*\.read_text\(", s) or ".read_text(" in s:
            vi_pham.append(f"{p.name}: read_text")
    assert not vi_pham, vi_pham
