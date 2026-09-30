# -*- coding: utf-8 -*-
"""SPEC-005 — an sao tử vi đầy đủ qua iztro (Node subprocess), endpoint
/v1/tuvi/an-sao. Viết TRƯỚC hàm (luật repo).

Nguồn chân lý: fixtures/golden/ziwei_golden.json (8 lá, sinh cục bộ bằng iztro
qua fixtures/_generate_ziwei_golden.mjs). So TỪNG CUNG: tên cung, can chi,
cung Thân, chính tinh + tứ hoá, phụ tinh, tạp tinh.

⚠️ Golden có trường `la_menh` nhưng generator gán nó = `isOriginalPalace` của
iztro — tức cung LAI NHÂN (来因宫), KHÔNG phải cung Mệnh (chỉ trùng ở 1/8 lá).
Không sửa golden; test đối chiếu `la_menh` của golden với `la_lai_nhan` của
engine, còn cung Mệnh kiểm riêng bằng `soulPalaceBranch` + tên cung 命宫.

Máy không có Node / chưa `npm ci` → skip rõ ràng, không fail.
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import config
from app.calc import ziwei
from app.main import app

client = TestClient(app)

GOLDEN = json.loads(
    (Path(__file__).parents[1] / "fixtures" / "golden" / "ziwei_golden.json")
    .read_text("utf-8")
)
CASES = sorted(GOLDEN["cases"])

_SAN_SANG, _LY_DO = ziwei.san_sang()
can_node = pytest.mark.skipif(
    not _SAN_SANG, reason=f"Bỏ qua an sao iztro: {_LY_DO}"
)

# timeIndex iztro → một giờ đồng hồ đại diện nằm giữa khung giờ đó.
_GIO_DAI_DIEN = {
    0: "00:30", 1: "02:00", 2: "04:00", 3: "06:00", 4: "08:00", 5: "10:00",
    6: "12:00", 7: "14:00", 8: "16:00", 9: "18:00", 10: "20:00", 11: "22:00",
    12: "23:30",
}


def _ngay(s: str) -> date:
    y, m, d = (int(x) for x in s.split("-"))
    return date(y, m, d)


def _sao(ds: list[dict], kem_tu_hoa: bool) -> list[str]:
    """Chuẩn hoá danh sách sao về đúng định dạng golden (tên zh, sort)."""
    out = []
    for s in ds:
        ten = s["ten"]
        if kem_tu_hoa and s["tu_hoa"]:
            ten += f"({s['tu_hoa']})"
        out.append(ten)
    return sorted(out)


def _so_voi_golden(la_so: dict, e: dict, case_id: str) -> None:
    assert la_so["duong_lich"] == e["solar"], case_id
    assert la_so["am_lich_zh"] == e["lunar"], case_id
    assert la_so["can_chi_zh"] == e["chineseDate"], case_id
    assert la_so["gio"]["zh"] == e["timeRange"], case_id
    assert la_so["cuc"]["zh"] == e["fiveElements"], case_id
    assert la_so["menh_chu"]["zh"] == e["soul"], case_id
    assert la_so["than_chu"]["zh"] == e["body"], case_id
    assert la_so["chi_cung_menh"]["zh"] == e["soulPalaceBranch"], case_id
    assert la_so["chi_cung_than"]["zh"] == e["bodyPalaceBranch"], case_id

    assert len(la_so["cung"]) == 12
    theo_chi = {c["chi"]["zh"]: c for c in la_so["cung"]}
    assert len(theo_chi) == 12, "12 cung phải có 12 địa chi khác nhau"
    for g in e["palaces"]:
        c = theo_chi[g["chi"]]
        ctx = f"{case_id}/{g['chi']}"
        assert c["ten_cung"]["zh"] == g["ten_cung"], ctx
        assert c["can"]["zh"] == g["can"], ctx
        assert c["la_than"] is g["la_than"], ctx
        assert c["la_lai_nhan"] is g["la_menh"], ctx   # xem docstring đầu file
        assert _sao(c["chinh_tinh"], kem_tu_hoa=True) == g["major"], ctx
        assert _sao(c["phu_tinh"], kem_tu_hoa=False) == g["minor"], ctx
        assert _sao(c["tap_tinh"], kem_tu_hoa=False) == g["adj"], ctx

    # Cung Mệnh thật: đúng một cung, tên 命宫, đúng chi cung Mệnh.
    menh = [c for c in la_so["cung"] if c["la_menh"]]
    assert len(menh) == 1, case_id
    assert menh[0]["ten_cung"]["zh"] == "命宫", case_id
    assert menh[0]["chi"]["zh"] == e["soulPalaceBranch"], case_id
    than = [c for c in la_so["cung"] if c["la_than"]]
    assert len(than) == 1 and than[0]["chi"]["zh"] == e["bodyPalaceBranch"], case_id


# ------------------------------------------------------------------ #
# 0. Thuần Python — không cần Node
# ------------------------------------------------------------------ #
@pytest.mark.parametrize("gio,ti", [
    (0, 0), (1, 1), (2, 1), (3, 2), (10, 5), (11, 6), (12, 6),
    (21, 11), (22, 11), (23, 12),
])
def test_time_index_theo_quy_uoc_iztro(gio: int, ti: int) -> None:
    """00:xx = Tý sớm (0), 23:xx = Tý muộn (12) — iztro tự sang ngày sau."""
    assert ziwei.time_index(gio) == ti


def test_time_index_tu_choi_gio_sai() -> None:
    with pytest.raises(ValueError):
        ziwei.time_index(24)


def test_chinh_sach_gio_ty_hai_module_khac_nhau() -> None:
    """Quyết định 2026-08-15: tử vi theo iztro, thần số giữ 00:00."""
    assert config.TUVI_TY_BOUNDARY is config.TyBoundary.SWITCH_AT_2300
    assert config.TY_BOUNDARY_POLICY is config.TyBoundary.SWITCH_AT_0000


def test_iztro_ghim_dung_ban_trong_lockfile() -> None:
    """package.json ghim cứng + package-lock trùng hằng IZTRO_VERSION."""
    goc = Path(ziwei.__file__).parent / "ziwei_node"
    pkg = json.loads((goc / "package.json").read_text("utf-8"))
    lock = json.loads((goc / "package-lock.json").read_text("utf-8"))
    assert pkg["dependencies"]["iztro"] == config.IZTRO_VERSION   # không ^ ~
    assert lock["packages"]["node_modules/iztro"]["version"] == config.IZTRO_VERSION


# ------------------------------------------------------------------ #
# 1. Hàm CALC — so golden từng cung
# ------------------------------------------------------------------ #
@can_node
@pytest.mark.parametrize("case_id", CASES)
def test_calc_khop_golden(case_id: str) -> None:
    ca = GOLDEN["cases"][case_id]
    inp = ca["input"]
    la_so = ziwei.an_sao(_ngay(inp["d"]), inp["ti"],
                         "nam" if inp["g"] == "male" else "nu")
    assert la_so["iztro_version"] == config.IZTRO_VERSION
    _so_voi_golden(la_so, ca["expect"], case_id)


@can_node
def test_calc_tat_dinh() -> None:
    a = ziwei.an_sao(date(1990, 5, 15), 1, "nam")
    b = ziwei.an_sao(date(1990, 5, 15), 1, "nam")
    assert a == b


@can_node
def test_calc_co_ban_dich_viet() -> None:
    la_so = ziwei.an_sao(date(1990, 5, 15), 1, "nam")
    menh = next(c for c in la_so["cung"] if c["la_menh"])
    assert menh["ten_cung"]["vi"] == "Mệnh"
    assert {s["ten_vi"] for s in menh["chinh_tinh"]} == {"Tử Vi", "Thiên Tướng"}


# ------------------------------------------------------------------ #
# 2. Endpoint — cùng golden, đi qua timebase/lịch âm như /tuan-triet
# ------------------------------------------------------------------ #
def _goi(case_id: str) -> dict:
    inp = GOLDEN["cases"][case_id]["input"]
    r = client.post("/v1/tuvi/an-sao", json={
        "birth_date": _ngay(inp["d"]).isoformat(),
        "birth_time": _GIO_DAI_DIEN[inp["ti"]],
        "gender": "nam" if inp["g"] == "male" else "nu",
        "calendar_type": "duong",
        "vung": "north",      # golden sinh không quy đổi múi giờ; miền Bắc 1970 = UTC+7
    })
    assert r.status_code == 200, r.text
    return r.json()


@can_node
@pytest.mark.parametrize("case_id", CASES)
def test_api_khop_golden(case_id: str) -> None:
    body = _goi(case_id)
    assert body["pham_vi"] == "an_sao_iztro"
    assert body["time_index"] == GOLDEN["cases"][case_id]["input"]["ti"]
    assert body["_ty_conflict"] is GOLDEN["cases"][case_id]["_ty_conflict"]
    _so_voi_golden(body["la_so"], GOLDEN["cases"][case_id]["expect"], case_id)


@can_node
def test_muon_ty_gan_co_xung_dot() -> None:
    """nam_muon_ty (23:30): tử vi sang ngày sau, thần số giữ ngày → cờ bắt buộc."""
    body = _goi("nam_muon_ty")
    assert body["_ty_conflict"] is True
    assert body["ty_boundary_tuvi"] == "switch_at_2300"
    assert body["ty_boundary_than_so"] == "switch_at_0000"
    loai = {f["loai"] for f in body["co_canh_bao"]}
    assert {"ty_conflict", "ty_edge"} <= loai
    # trụ ngày của lá số tử vi là ngày HÔM SAU (戊寅 16/6), không phải 丁丑
    assert body["la_so"]["can_chi_zh"].split()[2] == "戊寅"


@can_node
def test_som_ty_khong_co_xung_dot() -> None:
    body = _goi("nam_som_ty")
    assert body["_ty_conflict"] is False
    assert "ty_conflict" not in {f["loai"] for f in body["co_canh_bao"]}


@can_node
def test_ghi_ro_phai_trung_quoc() -> None:
    """SKILL tuvi-vn mục 1: iztro chỉ là lá số theo phái Trung Quốc."""
    body = _goi("nam_1990_suu")
    assert "Trung Quốc" in body["truong_phai_an_sao"]
    assert body["iztro_version"] == config.IZTRO_VERSION


@can_node
def test_saigon_1970_quy_doi_truoc_khi_an_sao() -> None:
    """00:30 đồng hồ Sài Gòn (UTC+8) → 23:30 hôm trước theo UTC+7 → Tý muộn."""
    r = client.post("/v1/tuvi/an-sao", json={
        "birth_date": "1970-12-02", "birth_time": "00:30",
        "gender": "nu", "vung": "south",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["duong_lich_kinh_tuyen"] == "1970-12-01"
    assert body["time_index"] == 12
    assert body["_ty_conflict"] is True
    assert {"tz_adjusted", "ty_conflict"} <= {f["loai"] for f in body["co_canh_bao"]}


@can_node
def test_am_lich_dau_vao() -> None:
    """24/10 âm Mậu Thìn → 02/12/1988 dương, lá số năm 戊辰."""
    r = client.post("/v1/tuvi/an-sao", json={
        "birth_date": "1988-10-24", "birth_time": "10:00",
        "gender": "nam", "calendar_type": "am",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["duong_lich_goc"] == "1988-12-02"
    assert body["la_so"]["can_chi_zh"].startswith("戊辰")
    assert "lich_am_lech" not in {f["loai"] for f in body["co_canh_bao"]}


# ------------------------------------------------------------------ #
# 3. Ràng buộc đầu vào (không cần Node — chặn trước khi gọi subprocess)
# ------------------------------------------------------------------ #
def test_truoc_1975_bat_buoc_vung() -> None:
    r = client.post("/v1/tuvi/an-sao", json={
        "birth_date": "1970-12-02", "birth_time": "10:00", "gender": "nu",
    })
    assert r.status_code == 422


def test_gio_sai_422() -> None:
    r = client.post("/v1/tuvi/an-sao", json={
        "birth_date": "1995-06-15", "birth_time": "24:10", "gender": "nam",
    })
    assert r.status_code == 422


def test_khong_co_node_tra_503(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ZIWEI_NODE_BIN", "/khong/ton/tai/node")
    r = client.post("/v1/tuvi/an-sao", json={
        "birth_date": "1995-06-15", "birth_time": "10:00", "gender": "nam",
    })
    assert r.status_code == 503
