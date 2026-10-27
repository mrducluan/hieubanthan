# -*- coding: utf-8 -*-
"""Vòng thử người dùng mới thứ 2 (2026-10-26, báo cáo UX v3 mục M3): trong MỘT chương (và trong "Điều quan trọng nhất")
không có hai hộp cùng tiêu đề — người mới tưởng hộp bị lặp do lỗi.

Chương Sức khoẻ Tử vi trước đây có một hộp "Phần cơ thể nên chăm sóc" cho MỖI chính tinh ở cung Tật Ách (+ một hộp
"Nhịp sức của chính bạn" theo sao cung Mệnh) → nay gộp thành MỘT hộp liệt kê mọi phần cơ thể sách xưa nhắc (chỉ ghép câu KB
`suc_khoe.*.bo_phan` đã có, không sinh câu mới); nguồn (sao, cung) nằm ở "Vì sao nói vậy"; câu "không thay lời bác sĩ" vẫn
đi kèm chương. Mã kiểm chứng của hộp gộp = mã của nguồn đầu tiên (đã có trong danh mục SQL — `test_kiem_chung_ma.py`)."""
from __future__ import annotations

import datetime as dt
import json
from collections import Counter
from pathlib import Path

import pytest

from app.kb import tuvi_doi_song_kb as kb
from app.luangiai import toan_bo
from app.luangiai import tuvi_doi_song as ds

XEM = dt.date(2026, 10, 21)
_FX = Path(__file__).parents[1] / "fixtures" / "golden"
_TV = json.loads((_FX / "lasotuvi_60.json").read_text("utf-8"))["cases"]
_BT = json.loads((_FX / "battu_doi_song.json").read_text("utf-8"))["cases"]
MAI_TV = {"ngay": dt.date(1998, 3, 14), "ti": 5, "gioi_tinh": "nu"}
MAI_BT = {"lich": dt.datetime(1998, 3, 14, 9, 30), "gioi_tinh": "nu"}


def _sinh_tv(ca: dict) -> dict:
    return {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}


def _sinh_bt(ca: dict) -> dict:
    return {"lich": dt.datetime.fromisoformat(ca["lich"]), "gioi_tinh": ca["gioi_tinh"],
            "gio_ty": ca.get("gio_ty", "da_ty")}


@pytest.fixture(scope="module")
def bai_tv() -> list[dict]:
    return [toan_bo.tuvi(MAI_TV, ngay_xem=XEM)] + [toan_bo.tuvi(_sinh_tv(ca), ngay_xem=XEM) for ca in _TV]


@pytest.fixture(scope="module")
def bai_bt() -> list[dict]:
    return [toan_bo.battu(MAI_BT, ngay_xem=XEM)] + [toan_bo.battu(_sinh_bt(ca), ngay_xem=XEM) for ca in _BT]


def _chuan(s: str) -> str:
    return " ".join((s or "").lower().split()).rstrip(".!?…:; ")


def _trung(bc: dict) -> list[tuple[str, str]]:
    ra = []
    nhom = [("cot_loi", bc.get("cot_loi") or [])] + [(c["ma"], c.get("hop") or []) for c in bc["chuong"]]
    for ma, hop in nhom:
        dem = Counter(_chuan(h.get("tieu_de", "")) for h in hop)
        ra += [(ma, t) for t, n in dem.items() if n > 1]
    return ra


def test_khong_hai_hop_cung_tieu_de_tuvi(bai_tv):
    loi = [(i, x) for i, b in enumerate(bai_tv) for x in _trung(b)]
    assert not loi, loi[:10]


def test_khong_hai_hop_cung_tieu_de_battu(bai_bt):
    loi = [(i, x) for i, b in enumerate(bai_bt) for x in _trung(b)]
    assert not loi, loi[:10]


def _hop_than_the(c: dict) -> list[dict]:
    """Hộp phần cơ thể (theo sao) — không tính hộp lục sát "Thói quen dễ hao sức" / hộp nếp chung."""
    return [h for h in c["hop"] if h["ma_mau"].split(".")[2] not in ("sat", "chung")]


def test_suc_khoe_mot_hop_than_the_du_bo_phan(bai_tv):
    for b in bai_tv:
        sk = next(c for c in b["chuong"] if c["ma"] == "suc_khoe")
        hop = _hop_than_the(sk)
        assert len(hop) <= 1, [h["tieu_de"] for h in hop]
        assert sk["mien_tru"] == kb.suc_khoe_chung() and "không thay lời bác sĩ" in sk["mien_tru"]
        if not hop:
            continue
        h = hop[0]
        # mọi nguồn trong "Vì sao nói vậy" đều có bộ phận của mình trong thân hộp (không bỏ sót nguồn nào)
        for cu in h["can_cu"]:
            sao = cu.split(" (")[0]
            bp = (kb.suc_khoe(sao) or {}).get("bo_phan")
            if bp:
                assert bp in h["noi_dung"], (bp, h["noi_dung"])
        assert ds.MA_MAU_RE.match(h["ma_mau"])


def test_suc_khoe_gop_giu_ma_nguon_dau():
    """Lá của người dùng thử (báo cáo UX): Tật Ách có hai chính tinh → một hộp, mã = mã sao đầu tiên ở Tật Ách."""
    b = toan_bo.tuvi(MAI_TV, ngay_xem=XEM)
    sk = next(c for c in b["chuong"] if c["ma"] == "suc_khoe")
    hop = _hop_than_the(sk)
    assert len(hop) == 1
    h = hop[0]
    assert len(h["can_cu"]) >= 2
    sao_dau = h["can_cu"][0].split(" (")[0]
    assert h["ma_mau"].startswith(f"ds.suc_khoe.{ds.slug(sao_dau)}.")


def test_tieu_de_trung_noi_ve_ke_cua_cau_than():
    """Hai câu KB khác nhau cùng mở bằng "Bạn điềm tĩnh, …" → hộp sau lấy thêm vế kế (chỉ cắt câu đã có)."""
    from app.luangiai import doi_song_khuon as kh

    def _hop():
        return [{"tieu_de": "Bạn điềm tĩnh", "noi_dung": "Bạn điềm tĩnh, đáng tin, biết giữ gìn.", "ma_mau": "a"},
                {"tieu_de": "Bạn điềm tĩnh", "noi_dung": "Bạn điềm tĩnh, biết tổ chức và giữ của, dễ được giao việc lớn.",
                 "ma_mau": "b"}]
    hop = _hop()
    doi = kh.tieu_de_khong_trung(hop)
    assert hop[0]["tieu_de"] == "Bạn điềm tĩnh"
    assert hop[1]["tieu_de"] == "Bạn điềm tĩnh, biết tổ chức và giữ của"
    assert doi == {("b", "Bạn điềm tĩnh"): "Bạn điềm tĩnh, biết tổ chức và giữ của"}
    bc = {"cot_loi": [dict(_hop()[1])], "chuong": [{"ma": "x", "hop": _hop(), "doan": ["x"]}]}
    kh.gon_bao_cao(bc)
    assert bc["cot_loi"][0]["tieu_de"] == "Bạn điềm tĩnh, biết tổ chức và giữ của"
    assert bc["cot_loi"][0]["noi_dung"] == bc["chuong"][0]["hop"][1]["noi_dung"] == "Dễ được giao việc lớn."
