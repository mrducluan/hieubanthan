# -*- coding: utf-8 -*-
"""Tests for Face Reading CV Upgrade:
1. Auto-computing ~24/31 survey answers from `diem` + optional `dac_trung_3d` in `calc/nhan_tuong_do.py`.
2. Returning `cau_hoi_phi_anh` for the non-visual popup.
3. Merging Eastern Five-Shape + Western/Lillian Bridges Five-Element physiognomy in `luangiai/nhan_tuong.py` & API.
4. EN parity (zero Vietnamese leak, identical JSON skeleton) and zero banned words (`kiem_giong_van`).
"""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.calc import nhan_tuong_do as do
from app.kb import nhan_tuong_kb as kb
from app.luangiai import doi_song_khuon as kh
from app.luangiai import nhan_tuong as nt
from app.main import app
from tests import _dau_ra as dr
from tests.test_nhan_tuong import TL_DAY
from tests.test_nhan_tuong_do import mau

client = TestClient(app)
XEM = dt.date(2026, 11, 22)


def _diem_mau() -> dict[str, dict[str, float]]:
    return {k: {"x": v[0], "y": v[1]} for k, v in mau().items()}


FULL_3D: dict[str, float] = {
    "dien_trach": 1.30,
    "eye_aspect_ratio": 0.22,
    "tam_bach_duoi": 0.21,
    "tam_bach_tren": 0.05,
    "son_can_z": 0.06,
    "song_mui_go": 0.01,
    "song_mui_z": 0.16,
    "chuan_dau_ratio": 0.42,
    "luong_quyen_z": 0.08,
    "moi_day_ratio": 0.38,
    "cam_width_ratio": 0.58,
    "may_density": 0.45,
    "may_dai_ratio": 1.38,
    "tran_convexity_z": 0.07,
    "net_mat_smile": 0.16,
    "sac_da_cr": 136.0,
    "sac_da_luma": 150.0,
    "sac_da_cb": 115.0,
    "le_duong_delta": 8.0,
    "moi_cr": 16.0,
    "nep_tran_edge": 0.04,
}


def test_backward_compat_and_cau_hoi_phi_anh():
    kq = do.do_mat(_diem_mau(), 1.0)
    assert kq["cau_hoi_phi_anh"] == ["giong", "dang", "cot_nhuc", "cham_cot"]
    assert "dac_trung_3d" not in kq["so_do"]
    assert all(g["anh"] == "thang" for g in kq["goi_y"])


def test_auto_compute_full_3d_valid_and_no_duplicates():
    diem = {**_diem_mau(), "dinh_tai": {"x": 0.27, "y": 0.36}, "dai_tai": {"x": 0.27, "y": 0.57}}
    kq = do.do_mat(diem, 1.0, dac_trung_3d=FULL_3D)
    assert kq["cau_hoi_phi_anh"] == ["giong", "dang", "cot_nhuc", "cham_cot"]

    caus = [g["cau"] for g in kq["goi_y"]]
    assert len(caus) == len(set(caus)), "Duplicate cau in goi_y"
    assert len(caus) >= 22, f"Expected ~23-24 auto-computed answers, got {len(caus)}"

    hop_le = {c["ma"]: {l["ma"] for l in c["lua_chon"]} for c in kb.cau_hoi()}
    for g in kq["goi_y"]:
        assert g["cau"] in hop_le
        assert g["lua_chon"] in hop_le[g["cau"]], f"Invalid choice {g['cau']}={g['lua_chon']}"

    by_cau = {g["cau"]: g for g in kq["goi_y"]}
    assert by_cau["dien_trach"]["lua_chon"] == "rong_day"
    assert by_cau["mat_hinh"]["lua_chon"] == "dai_hep"
    assert by_cau["tam_bach"]["lua_chon"] == "duoi"
    assert by_cau["son_can"]["lua_chon"] == "cao_lien"
    assert by_cau["song_mui"]["lua_chon"] == "thang_cao"
    assert by_cau["chuan_dau"]["lua_chon"] == "tron_day"
    assert by_cau["luong_quyen"]["lua_chon"] == "cao_co_thit"
    assert by_cau["mieng"]["lua_chon"] == "moi_day"
    assert by_cau["cam"]["lua_chon"] == "vuong_rong"
    assert by_cau["long_may"]["lua_chon"] == "thanh_dai"
    assert by_cau["tran"]["lua_chon"] == "cao_rong_day"
    assert by_cau["net_mat"]["lua_chon"] == "de_gan"
    assert by_cau["sac_tong"]["lua_chon"] == "sang_nhuan"
    assert by_cau["le_duong"]["lua_chon"] == "day_tuoi"
    assert by_cau["moi_sac"]["lua_chon"] == "hong_nhuan"
    assert by_cau["nep_tran"]["lua_chon"] == "khong"

    # Honest low confidence for pixel ROI features
    for roi_cau in ("sac_tong", "le_duong", "moi_sac", "nep_tran"):
        assert by_cau[roi_cau]["do_tin"] == "thap"
        assert by_cau[roi_cau]["anh"] == "3d"


@pytest.mark.parametrize("d3, cau, mong", [
    ({"dien_trach": 0.55}, "dien_trach", "hep"),
    ({"eye_aspect_ratio": 0.41}, "mat_hinh", "tron_to"),
    ({"tam_bach_duoi": 0.05, "tam_bach_tren": 0.22}, "tam_bach", "tren"),
    ({"tam_bach_duoi": 0.05, "tam_bach_tren": 0.05}, "tam_bach", "khong"),
    ({"son_can_z": -0.05}, "son_can", "thap_gay"),
    ({"song_mui_go": 0.04, "song_mui_z": 0.16}, "song_mui", "go"),
    ({"song_mui_z": 0.04}, "song_mui", "thap"),
    ({"chuan_dau_ratio": 0.55}, "chuan_dau", "to_tho"),
    ({"chuan_dau_ratio": 0.25}, "chuan_dau", "nhon_mong"),
    ({"luong_quyen_z": -0.03}, "luong_quyen", "thap_phang"),
    ({"moi_day_ratio": 0.18}, "mieng", "nho_mong"),
    ({"cam_width_ratio": 0.33}, "cam", "nhon_lem"),
    ({"cam_width_ratio": 0.45}, "cam", "tron_day"),
    ({"may_density": 0.12, "may_dai_ratio": 1.40}, "long_may", "thua_nhat"),
    ({"may_density": 0.50, "may_dai_ratio": 1.00}, "long_may", "dam_ngan"),
    ({"tran_convexity_z": -0.04}, "tran", "lom_giua"),
    ({"net_mat_smile": -0.15}, "net_mat", "buon_met"),
    ({"net_mat_smile": 0.0, "net_mat_brow_down": 0.22}, "net_mat", "nghiem"),
    ({"sac_da_cr": 155.0, "sac_da_luma": 140.0, "sac_da_cb": 115.0}, "sac_tong", "do_ung"),
    ({"sac_da_cr": 130.0, "sac_da_luma": 182.0, "sac_da_cb": 122.0}, "sac_tong", "trang_bech"),
    ({"sac_da_cr": 130.0, "sac_da_luma": 98.0, "sac_da_cb": 115.0}, "sac_tong", "toi_sam"),
    ({"sac_da_cr": 130.0, "sac_da_luma": 140.0, "sac_da_cb": 102.0}, "sac_tong", "vang_xin"),
    ({"le_duong_delta": 26.0}, "le_duong", "tham_quang"),
    ({"moi_cr": 3.5}, "moi_sac", "nhat_kho"),
    ({"nep_tran_edge": 0.11}, "nep_tran", "vai_nep_lien"),
    ({"nep_tran_edge": 0.24}, "nep_tran", "nhieu_dut"),
])
def test_3d_thresholds(d3, cau, mong):
    kq = do.do_mat(_diem_mau(), 1.0, dac_trung_3d=d3)
    by_cau = {g["cau"]: g["lua_chon"] for g in kq["goi_y"]}
    assert by_cau[cau] == mong


def test_3d_respects_existing_non_vua_geometric_results():
    # Geometric: song_mui=lech, long_may=giao_nhau, mat_hinh=xech_len, mieng=khoe_cup
    d = {
        **mau(),
        "chan_mui": (0.52, 0.56),
        "may_trai": (0.48, 0.37),
        "may_phai": (0.52, 0.37),
        "mat_ngoai_trai": (0.374, 0.42 - 0.2 * 0.084),
        "mat_ngoai_phai": (0.626, 0.42 - 0.2 * 0.084),
        "mep_trai": (0.425, 0.64),
        "mep_phai": (0.575, 0.64),
    }
    kq = do.do_mat({k: {"x": v[0], "y": v[1]} for k, v in d.items()}, 1.0, dac_trung_3d=FULL_3D)
    by_cau = {g["cau"]: g["lua_chon"] for g in kq["goi_y"]}
    assert by_cau["song_mui"] == "lech"
    assert by_cau["long_may"] == "giao_nhau"
    assert by_cau["mat_hinh"] == "xech_len"
    assert by_cau["mieng"] == "khoe_cup"


def test_api_do_mat_with_3d_and_validation():
    r = client.post("/v1/nhan-tuong/do-mat", json={
        "diem": _diem_mau(), "ti_le": 1.0, "dong_y": True, "dac_trung_3d": FULL_3D,
    })
    assert r.status_code == 200
    body = r.json()
    assert body["cau_hoi_phi_anh"] == ["giong", "dang", "cot_nhuc", "cham_cot"]
    assert len(body["goi_y"]) >= 21

    # Reject non-finite values via direct call (JSON doesn't allow NaN, validator rejects inf/nan)
    with pytest.raises(ValueError):
        do.do_mat(_diem_mau(), 1.0, dac_trung_3d={"dien_trach": float("nan")})
    with pytest.raises(ValueError):
        do.do_mat(_diem_mau(), 1.0, dac_trung_3d={"dien_trach": float("inf")})


def test_east_west_bridges_merge_and_so_do_mat():
    # Without so_do_mat: derives Bridges element from Eastern ngu_hinh (TL_DAY -> tho)
    bc1 = nt.luan_giai(TL_DAY, nam_sinh=1988, gioi_tinh="nam", ngay_xem=XEM)
    pt1 = bc1["da_tinh"]["phuong_tay_bridges"]
    assert pt1["hanh"] == "tho"
    assert pt1["trang_thai_dong_thuan"] == "dong_thuan"
    assert "fuzzy_bridge" not in pt1
    assert pt1["do_tin"] == "bien_tap_tu_dat"
    assert "Lillian Bridges" in pt1["nguon"]
    assert kh.kiem_giong_van(bc1) == []

    # Highlight box injected into tong_quan after Dáng mặt
    tq = next(c for c in bc1["chuong"] if c["ma"] == "tong_quan")
    assert tq["hop"][0]["tieu_de"].startswith("Dáng mặt")
    assert any("Đông – Tây" in h["tieu_de"] for h in tq["hop"])

    # With so_do_mat (elongated face -> moc), Eastern=tho vs Western=moc -> bo_tro
    so_do_moc = {"cao_rong": 1.55, "tran_ma": 0.86, "ham_ma": 0.80, "may_khoe": 0.92}
    r = client.post("/v1/nhan-tuong/luan-giai", json={
        "tra_loi": TL_DAY, "nam_sinh": 1988, "gioi_tinh": "nam", "so_do_mat": so_do_moc,
    })
    assert r.status_code == 200
    body = r.json()
    pt2 = body["da_tinh"]["phuong_tay_bridges"]
    assert pt2["hanh"] == "moc"
    assert pt2["trang_thai_dong_thuan"] == "bo_tro"
    assert pt2["fuzzy_bridge"]["ngu_hanh_bridges"]["hanh"] == "moc"
    assert kh.kiem_giong_van(body) == []

    # Deterministic
    bc_repeat = nt.bao_cao(TL_DAY, nam_sinh=1988, gioi_tinh="nam", ngay_xem=XEM, so_do_mat=so_do_moc)
    assert bc_repeat == nt.bao_cao(TL_DAY, nam_sinh=1988, gioi_tinh="nam", ngay_xem=XEM, so_do_mat=so_do_moc)


def test_en_parity_zero_vietnamese_leak():
    # 1. do_mat with dac_trung_3d in VI vs EN
    with ngon_ngu.dung("vi"):
        dm_vi = do.do_mat(_diem_mau(), 1.0, dac_trung_3d=FULL_3D)
    with ngon_ngu.dung("en"):
        dm_en = do.do_mat(_diem_mau(), 1.0, dac_trung_3d=FULL_3D)
    assert dr.loi_en(dm_en) == [], dr.loi_en(dm_en)
    # Exclude pre-existing fuzzy_bridge (whose VI-only KB fields are defined in tuong_fuzzy.py)
    assert dr.khung({k: v for k, v in dm_vi.items() if k != "fuzzy_bridge"}) == dr.khung(
        {k: v for k, v in dm_en.items() if k != "fuzzy_bridge"}
    )

    # 2. bao_cao (luan-giai) via HTTP in VI vs EN (middleware adds ten_hien + localized labels)
    r_vi = client.post("/v1/nhan-tuong/luan-giai", json={"tra_loi": TL_DAY, "nam_sinh": 1988, "gioi_tinh": "nam", "ngay_xem": XEM.isoformat()}, headers={"x-ngon-ngu": "vi"})
    r_en = client.post("/v1/nhan-tuong/luan-giai", json={"tra_loi": TL_DAY, "nam_sinh": 1988, "gioi_tinh": "nam", "ngay_xem": XEM.isoformat()}, headers={"x-ngon-ngu": "en"})
    assert r_vi.status_code == 200 and r_en.status_code == 200
    bc_vi, bc_en = r_vi.json(), r_en.json()
    assert dr.loi_en(bc_en["da_tinh"]["phuong_tay_bridges"]) == []
    assert dr.loi_en(bc_en["chuong"][0]["hop"][1]) == []
    assert dr.khung(bc_vi) == dr.khung(bc_en)

    # 3. bao_cao with so_do_mat in EN has zero Vietnamese leak in Bridges + East-West box
    so_do_moc = {"cao_rong": 1.55, "tran_ma": 0.86, "ham_ma": 0.80, "may_khoe": 0.92}
    r_en_sd = client.post("/v1/nhan-tuong/luan-giai", json={"tra_loi": TL_DAY, "nam_sinh": 1988, "gioi_tinh": "nam", "ngay_xem": XEM.isoformat(), "so_do_mat": so_do_moc}, headers={"x-ngon-ngu": "en"})
    assert r_en_sd.status_code == 200
    bc_en_sd = r_en_sd.json()
    assert dr.loi_en(bc_en_sd["da_tinh"]["phuong_tay_bridges"]) == []
    assert dr.loi_en(bc_en_sd["chuong"][0]["hop"][1]) == []
    assert "East–West" in next(c for c in bc_en_sd["chuong"] if c["ma"] == "tong_quan")["hop"][1]["tieu_de"]
