# -*- coding: utf-8 -*-
"""Kiểm chứng kho nguồn & đồ hình Dương Trạch Tam Yếu (Triệu Cửu Phong, đời Thanh):
- fixtures/nguon/duong_trach_tam_yeu.json: chỉ gồm 【原文】 phồn thể, bỏ dấu câu hiện đại (CT-1), không lọt bạch thoại hiện đại.
- phongthuy_tam_yeu.json["nguyen_van_doi_chieu"] và phongthuy_tam_yeu_do_hinh.json["do_hinh_ly_thuyet"]:
  mọi câu `han` phải là chuỗi con khớp nguyên văn của kho nguồn.
- phongthuy_tam_yeu_do_hinh.json["so_do_64_nha"] & ["so_do_64_bep"]:
  đủ 64 + 64 sơ đồ lưới 3×3 và Mermaid, du niên khớp 100% phép tính app.calc.phongthuy.bang_huong.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from app.calc import phongthuy as pt

GOC = Path(__file__).resolve().parents[1]
NGUON = json.loads((GOC / "fixtures" / "nguon" / "duong_trach_tam_yeu.json").read_text("utf-8"))
TAM_YEU = json.loads((GOC / "app" / "kb" / "data" / "phongthuy_tam_yeu.json").read_text("utf-8"))
DO_HINH = json.loads((GOC / "app" / "kb" / "data" / "phongthuy_tam_yeu_do_hinh.json").read_text("utf-8"))

RE_DAU_CAU = re.compile(r"[。，、；：！？「」『』（）《》【】“”‘’—…·,.!?;:()\[\]]")
FLAT_BY_SO = {t["so"]: t["van"].replace("\n", "") for t in NGUON["thien"]}


def test_fixture_duong_trach_tam_yeu_sach_se_khong_dau_cau():
    assert NGUON["source_id"] == "duong_trach_tam_yeu"
    assert NGUON["can_doi_chieu"] is True
    assert NGUON["chuyen_phon_the_opencc"] is True
    assert len(NGUON["thien"]) >= 200
    quyens = {t["quyen"] for t in NGUON["thien"]}
    assert {"卷一", "卷二", "卷三", "卷四"} <= quyens
    bad_ocr = ("武麴", "文麴", "武典星", "夫日", "斷日", "故日", "犯坎良", "配良門", "良竈", "某官某字", "兇")
    for t in NGUON["thien"]:
        van = t["van"]
        assert not RE_DAU_CAU.search(van), f"Thiên {t['so']} còn dấu câu hiện đại"
        assert "白話提要" not in van and "白話圖解" not in van, f"Thiên {t['so']} lọt bạch thoại"
        assert "白话" not in t["ten"] and "对断" not in t["ten"], f"Tiêu đề thiên {t['so']} lọt chữ hiện đại"
        for b in bad_ocr:
            assert b not in van, f"Thiên {t['so']} còn lỗi OCR/OpenCC: {b}"
        assert len(van.replace("\n", "")) >= 12


def test_tam_yeu_nguyen_van_doi_chieu_khop_kho_nguon():
    muc = TAM_YEU["nguyen_van_doi_chieu"]
    assert len(muc) == 10
    for m in muc:
        so = m["nguon_thien"]
        assert so in FLAT_BY_SO, m["ma"]
        assert m["han"] in FLAT_BY_SO[so], (m["ma"], m["han"])
        assert not RE_DAU_CAU.search(m["han"]), m["ma"]


def test_do_hinh_ly_thuyet_khop_nguyen_van():
    ds = DO_HINH["do_hinh_ly_thuyet"]
    assert len(ds) == 10
    for d in ds:
        so = d["nguon_thien"]
        assert so in FLAT_BY_SO, d["ma"]
        assert d["han"] in FLAT_BY_SO[so], (d["ma"], d["han"])
        assert d["mermaid"].startswith("flowchart "), d["ma"]
        assert d["cau_truc"] and d["mo_ta"].strip(), d["ma"]


def test_so_do_64_nha_va_64_bep_khop_phep_tinh():
    quai = list(pt.QUAI)
    expected = {f"{a}_{b}" for a in quai for b in quai}
    assert set(DO_HINH["so_do_64_nha"]) == expected
    assert set(DO_HINH["so_do_64_bep"]) == expected

    for k, m in DO_HINH["so_do_64_nha"].items():
        cua, chu = k.split("_")
        assert m["du_nien"] == pt.bang_huong(cua)[pt.QUAI[chu][1]], k
        assert len(m["luoi_3x3"]) == 3 and all(len(row) == 3 for row in m["luoi_3x3"]), k
        flat_grid = " ".join(cell for row in m["luoi_3x3"] for cell in row)
        assert "Cửa" in flat_grid and "Chủ" in flat_grid, k
        assert m["mermaid"].startswith("flowchart "), k

    for k, m in DO_HINH["so_do_64_bep"].items():
        bep, cua = k.split("_")
        assert m["du_nien"] == pt.bang_huong(cua)[pt.QUAI[bep][1]], k
        assert len(m["luoi_3x3"]) == 3 and all(len(row) == 3 for row in m["luoi_3x3"]), k
        flat_grid = " ".join(cell for row in m["luoi_3x3"] for cell in row)
        assert "Cửa" in flat_grid and "Bếp" in flat_grid, k
        assert m["mermaid"].startswith("flowchart "), k


def test_muc_luc_bieu_do_du_va_khong_anh_ban_quyen():
    ml = DO_HINH["muc_luc_bieu_do"]
    assert len(ml) == 251
    ids = [x["chart_id"] for x in ml]
    assert len(set(ids)) == 251
    for x in ml:
        assert x["trang_pdf"] > 28 and x["mo_ta_vi"].strip()
        assert ".jpg" not in x["mo_ta_vi"].lower() and ".png" not in x["mo_ta_vi"].lower()


# ───────── API /v1/phongthuy/tam-yeu/* + kiểm lọc BM-1 đệ quy ─────────
_FORBIDDEN_API_KEYS = {
    "chart_id",
    "tham_chieu_bieu_do",
    "trang_pdf",
    "nguon_thien",
    "avg_conf",
    "do_tin",
    "can_doi_chieu",
    "han",
}
_FORBIDDEN_API_SUBSTRINGS = (
    "fengshui-yangzhai-kb",
    ".jpg",
    ".png",
    ".sqlite",
    "rapidocr",
    "opencc",
    "白话",
    "白話提要",
    "白話圖解",
)


def _assert_bm1_clean(obj, path: str = "$") -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            assert k not in _FORBIDDEN_API_KEYS, f"BM-1 lộ khoá nội bộ tại {path}.{k}"
            _assert_bm1_clean(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            _assert_bm1_clean(item, f"{path}[{i}]")
    elif isinstance(obj, str):
        low = obj.lower()
        for bad in _FORBIDDEN_API_SUBSTRINGS:
            assert bad not in low, f"BM-1 lộ chuỗi nội bộ {bad!r} tại {path}: {obj[:120]}"


def test_api_tam_yeu_do_hinh_va_chi_tiet():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    r_list = client.get("/v1/phongthuy/tam-yeu/do-hinh")
    assert r_list.status_code == 200
    body = r_list.json()
    assert body["engine_version"] and len(body["do_hinh"]) == 10
    assert body["thong_ke"]["so_do_nha"] == 64 and body["thong_ke"]["so_do_bep"] == 64
    _assert_bm1_clean(body)

    r_one = client.get("/v1/phongthuy/tam-yeu/do-hinh/tam_yeu_mon_chu_tao")
    assert r_one.status_code == 200
    one = r_one.json()
    assert one["mermaid"].startswith("flowchart ") and one["cau_truc"] and len(one["khac"]) == 9
    _assert_bm1_clean(one)

    assert client.get("/v1/phongthuy/tam-yeu/do-hinh/khong_ton_tai").status_code == 404
    assert client.get("/v1/phongthuy/tam-yeu/do-hinh/BAD-UPPER!").status_code == 404


def test_api_tam_yeu_so_do_cua_chu_bep():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    # Đủ 3 điểm Cửa – Chủ – Bếp
    r = client.get("/v1/phongthuy/tam-yeu/so-do", params={"cua": "Càn", "chu": "Đoài", "bep": "Khôn"})
    assert r.status_code == 200
    d = r.json()
    assert d["so_do_nha"]["du_nien"] == pt.bang_huong("Càn")[pt.QUAI["Đoài"][1]] == "Sinh Khí"
    assert d["so_do_bep"]["du_nien"] == pt.bang_huong("Càn")[pt.QUAI["Khôn"][1]] == "Diên Niên"
    assert d["so_do_nha"]["tom_y"] and d["so_do_bep"]["tom_y"]
    flat = " ".join(cell for row in d["luoi_tong_hop_3x3"] for cell in row)
    assert "Cửa" in flat and "Chủ" in flat and "Bếp" in flat
    assert d["mermaid_tong_hop"].startswith("flowchart ")
    _assert_bm1_clean(d)

    # Chỉ có Cửa -> trả 8 thế nhà gợi ý
    r_cua = client.get("/v1/phongthuy/tam-yeu/so-do", params={"cua": "Ly"})
    assert r_cua.status_code == 200
    d_cua = r_cua.json()
    assert len(d_cua["cac_the_nha"]) == 8
    _assert_bm1_clean(d_cua)

    # Quái sai -> 422
    assert client.get("/v1/phongthuy/tam-yeu/so-do", params={"cua": "KhongHopLe"}).status_code == 422


def test_api_tam_yeu_bieu_do_phan_trang_va_loc():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    r = client.get("/v1/phongthuy/tam-yeu/bieu-do", params={"limit": 10, "offset": 5})
    assert r.status_code == 200
    d = r.json()
    assert d["tong"] == 251 and len(d["bieu_do"]) == 10 and d["bieu_do"][0]["thu_tu"] == 6
    _assert_bm1_clean(d)

    r_f = client.get("/v1/phongthuy/tam-yeu/bieu-do", params={"loai": "floorplan_bazao", "limit": 100})
    assert r_f.status_code == 200
    df = r_f.json()
    # 64 mặt bằng chính văn (tổng 65 floorplan_bazao trong SQLite trừ YZ_SY_C0028 ở trang hướng dẫn đọc p.28)
    assert df["tong"] == 64 and len(df["bieu_do"]) == 64
    _assert_bm1_clean(df)

