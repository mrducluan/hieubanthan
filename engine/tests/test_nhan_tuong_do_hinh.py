# -*- coding: utf-8 -*-
"""Lớp phủ đồ hình Nhân tướng (bản khắc «神相全編») — KB `nhan_tuong_do_hinh.json` + route `/v1/nhan-tuong/do-hinh`.

Viết TRƯỚC dữ liệu: toạ độ chuẩn hoá hợp lệ, id duy nhất, liên kết có thật trong KB, lời Việt qua bộ nói giảm SX-C,
chữ Hán của điểm đối chiếu được với kho nguồn, ảnh WebP có thật và khớp kích thước, route trả đúng khoá.
"""
from __future__ import annotations

import json
import re
import struct
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.kb import nhan_tuong_do_hinh as dh
from app.kb import nhan_tuong_kb as kb
from app.kb import sach_ghi
from app.main import app

GOC = Path(__file__).resolve().parents[2]
ANH = GOC / "web" / "public" / "anh" / "do-hinh"
NGUON = "than_tuong_toan_bien"
# Nhóm mà chữ trên bản khắc PHẢI có trong kho nguồn chữ của chính sách (dị thể → `han_kho`).
NHOM_DOI_CHIEU = {"cung", "ngu_quan", "ngu_nhac", "bo_vi", "luu_nien", "tai", "tam_tai", "tam_dinh", "luc_phu", "vi_khac"}
MUC = {"A", "B", "C"}


def _ds() -> list[dict]:
    return dh.tat_ca()


def _diem():
    for d in _ds():
        for p in d["diem"]:
            yield d, p


def _co_webp(p: Path) -> tuple[int, int]:
    """Kích thước tệp WebP đọc thẳng từ header RIFF (venv không có PIL)."""
    b = p.read_bytes()
    assert b[:4] == b"RIFF" and b[8:12] == b"WEBP", p.name
    loai = b[12:16]
    if loai == b"VP8 ":
        w, h = struct.unpack("<HH", b[26:30])
        return w & 0x3FFF, h & 0x3FFF
    if loai == b"VP8L":
        v = struct.unpack("<I", b[21:25])[0]
        return (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
    if loai == b"VP8X":
        return int.from_bytes(b[24:27], "little") + 1, int.from_bytes(b[27:30], "little") + 1
    raise AssertionError(f"{p.name}: khối WebP lạ {loai!r}")


def test_co_du_do_hinh_toi_thieu():
    ma = {d["ma"] for d in _ds()}
    assert {"muoi-hai-cung-ngu-quan", "luu-nien-van-khi"} <= ma
    meta = dh.meta()
    assert meta["source_id"] == NGUON and meta["school_id"] and meta["can_doi_chieu"] is True
    assert meta["trang_thai"] != "da_duyet"          # không gắn "đã thẩm định"


def test_khuon_tung_do_hinh():
    thay = set()
    for d in _ds():
        assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", d["ma"]) and d["ma"] not in thay
        thay.add(d["ma"])
        for k in ("ten", "ten_han", "am", "sach", "ban_khac", "tep", "mo_ta"):
            assert isinstance(d.get(k), str) and d[k].strip(), (d["ma"], k)
        assert d["tep"] == f"{d['ma']}.webp"
        assert isinstance(d["rong"], int) and isinstance(d["cao"], int)
        nhom = [n["ma"] for n in d["nhom"]]
        assert len(nhom) == len(set(nhom)) and all(n["ten"].strip() for n in d["nhom"])
        assert d["diem"], d["ma"]
        assert {p["nhom"] for p in d["diem"]} == set(nhom), d["ma"]     # nhóm nào cũng có điểm, điểm nào cũng có nhóm


def test_toa_do_va_id():
    for d in _ds():
        ids, vt = set(), set()
        for p in d["diem"]:
            assert re.fullmatch(r"[a-z0-9_]{2,40}", p["id"]) and p["id"] not in ids, (d["ma"], p["id"])
            ids.add(p["id"])
            x, y = p["vt"]
            assert 0 < x < 1 and 0 < y < 1, (d["ma"], p["id"])
            assert round(x, 4) == x and round(y, 4) == y
            assert (x, y) not in vt, (d["ma"], p["id"], "trùng toạ độ")
            vt.add((x, y))
        # hai điểm không đè lên nhau: cách nhau ≥ 1,2 % chiều ảnh (tính theo pixel thật)
        ds = d["diem"]
        for i, a in enumerate(ds):
            for b in ds[i + 1:]:
                dx, dy = (a["vt"][0] - b["vt"][0]) * d["rong"], (a["vt"][1] - b["vt"][1]) * d["cao"]
                assert (dx * dx + dy * dy) ** 0.5 >= 0.012 * max(d["rong"], d["cao"]), (d["ma"], a["id"], b["id"])


def test_loi_viet_qua_bo_noi_giam():
    for d in _ds():
        for k in ("ten", "mo_ta", "cau_khung"):
            if d.get(k):
                assert sach_ghi.kiem_loi(d[k]) == [], (d["ma"], k, sach_ghi.kiem_loi(d[k]))
        for n in d["nhom"]:
            assert sach_ghi.kiem_loi(n["ten"]) == []
        for p in d["diem"]:
            assert 0 < len(p["ten"]) <= 40, (d["ma"], p["id"], p["ten"])
            assert 0 < len(p["y"]) <= 220, (d["ma"], p["id"], len(p["y"]))
            for k in ("ten", "y"):
                assert sach_ghi.kiem_loi(p[k]) == [], (d["ma"], p["id"], k, sach_ghi.kiem_loi(p[k]))
            assert re.search(r"[一-鿿]", p["han"]) and not re.search(r"[A-Za-zÀ-ỹ]", p["han"]), (d["ma"], p["id"])


def test_han_co_trong_kho_nguon():
    van = sach_ghi.van_nguon(NGUON)
    for d, p in _diem():
        if p["nhom"] not in NHOM_DOI_CHIEU:
            continue
        so = sach_ghi.chuan(p.get("han_kho") or p["han"])
        assert so and so in van, (d["ma"], p["id"], p["han"])


def test_lien_ket_co_that_trong_kb():
    bo_vi, cung = kb.bo_vi(), kb.cung()
    for d, p in _diem():
        lk = p.get("lien_ket")
        if not lk:
            continue
        assert lk["loai"] in ("bo_vi", "cung"), (d["ma"], p["id"])
        assert lk["ma"] in (bo_vi if lk["loai"] == "bo_vi" else cung), (d["ma"], p["id"], lk)


def test_luu_nien_khop_bang_tuoi_cua_kb():
    """Điểm lưu niên: mỗi tuổi có trong bảng `luu_nien` của KB, cùng bộ vị với liên kết, và (tuổi ≤ 75) cùng bên."""
    bang = {x["tuoi"]: x for x in kb.luu_nien()}
    da_co: dict[int, str] = {}
    d = dh.lay("luu-nien-van-khi")
    for p in d["diem"]:
        assert p.get("tuoi"), p["id"]
        for t in p["tuoi"]:
            assert t in bang, (p["id"], t)
            assert t not in da_co, (p["id"], t, da_co.get(t))        # một tuổi một điểm
            da_co[t] = p["id"]
            assert p["lien_ket"] == {"loai": "bo_vi", "ma": bang[t]["bo_vi"]}, (p["id"], t)
            if t <= 75:
                assert p["ben"] == bang[t]["ben"], (p["id"], t)
    assert len(da_co) >= 90                                           # bản khắc ghi gần đủ 99 tuổi


def test_not_ruoi_co_muc_va_nhom_c_noi_giam():
    for d, p in _diem():
        if not p["nhom"].startswith("not_ruoi"):
            assert "muc" not in p
            continue
        assert p["muc"] in MUC, (d["ma"], p["id"])
        y = p["y"]
        if p["muc"] == "A":
            assert y.startswith("Sách xưa ghi"), (d["ma"], p["id"])
        elif p["muc"] == "B":
            assert "nên chú ý" in y.lower() or "nên cẩn thận" in y.lower(), (d["ma"], p["id"])
        else:
            assert y.startswith("Sách xưa có nhắc") and "hàm ý" in y and "Nên" in y, (d["ma"], p["id"])
            assert not p.get("am"), (d["ma"], p["id"], "nhóm C không hiện phiên âm")
    for d in _ds():
        if any(p["nhom"].startswith("not_ruoi") for p in d["diem"]):
            assert d.get("cau_khung") == "Đây là ghi chép của người xưa, đọc để tham khảo, không phải lời đoán riêng cho bạn."
    # không màu đỏ / chữ phán trong lời
    for d, p in _diem():
        assert not re.search(r"hung hiểm|đại cát|đại hung", p["y"] + p["ten"], re.I)


def test_anh_webp_co_that_va_khop_kich_thuoc():
    for d in _ds():
        p = ANH / d["tep"]
        assert p.exists(), d["tep"]
        assert _co_webp(p) == (d["rong"], d["cao"]), d["tep"]
        assert max(d["rong"], d["cao"]) <= 1400 and p.stat().st_size <= 260_000, (d["tep"], p.stat().st_size)


def test_khong_co_ten_noi_bo_trong_kb_hien_thi():
    """BM-1: chữ hiển thị không nêu tên tệp nguồn / nơi lấy ảnh."""
    cam = re.compile(r"wikisource|database|sqlite|drive|SXQB|\.png|\.json", re.I)
    for d in _ds():
        chu = json.dumps({k: v for k, v in d.items() if k != "tep"}, ensure_ascii=False)
        assert not cam.search(chu), (d["ma"], cam.search(chu).group())


@pytest.fixture(scope="module")
def may():
    return TestClient(app)


def test_route_danh_muc(may):
    r = may.get("/v1/nhan-tuong/do-hinh")
    assert r.status_code == 200
    j = r.json()
    assert j["pham_vi"] == "nhan_tuong_do_hinh" and len(j["do_hinh"]) == len(_ds())
    for x in j["do_hinh"]:
        assert set(x) >= {"ma", "ten", "ten_han", "am", "tep", "rong", "cao", "so_diem", "mo_ta"}
        assert "diem" not in x and x["so_diem"] > 0
    assert "_nguon" not in json.dumps(j)


def test_route_mot_do_hinh(may):
    r = may.get("/v1/nhan-tuong/do-hinh/muoi-hai-cung-ngu-quan")
    assert r.status_code == 200
    j = r.json()
    assert j["ma"] == "muoi-hai-cung-ngu-quan" and j["nguon_hien_thi"] == "Thần Tướng Toàn Biên, bản khắc đời Minh"
    assert {"ten", "ten_han", "am", "tep", "rong", "cao", "mo_ta", "nhom", "diem", "khac"} <= set(j)
    menh = next(p for p in j["diem"] if p["id"] == "menh")
    assert menh["han"] == "命宮" and menh["lien_ket"] == {"loai": "cung", "ma": "menh"}
    assert menh["duong"].startswith("/nhan-tuong/bo-vi/")
    assert all(set(p) >= {"id", "vt", "han", "ten", "y", "nhom"} for p in j["diem"])
    # điểm có liên kết bộ vị mà KB có câu sách → mang `sach_ghi` {han, y}
    co_sach = [p for p in j["diem"] if p.get("sach_ghi")]
    assert co_sach and all(p["sach_ghi"]["han"] and p["sach_ghi"]["y"] for p in co_sach)
    assert all(x["ma"] != j["ma"] for x in j["khac"])


def test_route_ma_la_tra_404(may):
    assert may.get("/v1/nhan-tuong/do-hinh/khong-co").status_code == 404
    assert may.get("/v1/nhan-tuong/do-hinh/..%2Fx").status_code in (404, 422)
