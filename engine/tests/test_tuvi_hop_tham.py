# -*- coding: utf-8 -*-
"""TV-V2 — RULES "Xem lá số 2 người" (tên cũ hợp tham hai lá số, luangiai/tuvi_hop_tham.py). Viết TRƯỚC hàm.
Can năm người kia theo âm lịch VIỆT (đổi năm tại Tết). HN-2N: có `ban`/`kia` thì kèm điểm tham khảo (luật chi tiết
ở test_tuvi_hai_nguoi.py); không có thì `diem` = None như cũ."""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import tuvi_an_sao as az, tuvi_phi_hoa as ph
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_phi_hoa_kb as pkb
from app.luangiai import tuvi_hop_tham as ht

TU_DOA = ("báo động", "tử thần", "phá sản", "tai nạn", "bệnh", "chết", "tuyệt đối")


@pytest.fixture(scope="module")
def ls_a():
    return tom_tat(az.an_sao_tho(dt.date(1990, 5, 15), 1, "nam", "vi-VN"))


@pytest.fixture(scope="module")
def ls_b():
    return tom_tat(az.an_sao_tho(dt.date(1992, 8, 21), 4, "nu", "vi-VN"))


def test_can_nam_viet_doi_tai_tet():
    # Tết Canh Ngọ 1990 = 27/01/1990 → 26/01/1990 vẫn là Kỷ Tỵ
    assert ht.can_nam_viet(dt.date(1990, 1, 26)) == "Kỷ"
    assert ht.can_nam_viet(dt.date(1990, 1, 27)) == "Canh"
    # 1985: Tết Việt 21/01, Tết Trung Quốc 20/02 → 15/02/1985 lịch Việt đã sang Ất Sửu
    assert ht.can_nam_viet(dt.date(1985, 2, 15)) == "Ất"
    # ngày âm: năm âm lấy thẳng
    assert ht.can_nam_viet(dt.date(1984, 12, 30), calendar_type="am") == "Giáp"
    assert ht.nam_am_viet(dt.date(1990, 1, 26)) == 1989 and ht.nam_am_viet(dt.date(1990, 1, 27)) == 1990
    assert ht.nam_am_viet(dt.date(1984, 12, 30), calendar_type="am") == 1984


def test_mot_chieu(ls_a):
    r = ht.lap(ls_a, "Canh", "Ất", "ban_be")
    assert r["quan_he"] == "ban_be" and r["nhan_quan_he"] == "Bạn bè"
    assert r["can_nam_nguoi_kia"] == "Ất"
    assert r["diem"] is None and r["khong_cham_diem"] is True      # không đưa năm/giới tính → chưa chấm
    kq = ph.phi_tu_can("Ất", ls_a["cung"])
    assert [(x["hoa"], x["sao"], x["den_cung"], x["xung_cung"]) for x in r["nguoi_kia_vao_ban"]] == \
        [(x["hoa"], x["sao"], x["den_cung"], x["xung_cung"]) for x in kq]
    assert all(x["nghia"] for x in r["nguoi_kia_vao_ban"])
    assert r["ban_vao_nguoi_kia"] is None and r["menh_nguoi_kia_vao_ban"] is None
    assert r["tom_tat"] and r["luu_y"]


def test_hai_chieu(ls_a, ls_b):
    r = ht.lap(ls_a, "Canh", "Nhâm", "nguoi_yeu", ls_kia=ls_b)
    assert len(r["ban_vao_nguoi_kia"]) == 4
    assert [x["den_cung"] for x in r["ban_vao_nguoi_kia"]] == \
        [x["den_cung"] for x in ph.phi_tu_can("Canh", ls_b["cung"])]
    can_menh = next(c["can"] for c in ls_b["cung"] if c["ten"] == "Mệnh")
    assert r["can_menh_nguoi_kia"] == can_menh
    assert [x["den_cung"] for x in r["menh_nguoi_kia_vao_ban"]] == \
        [x["den_cung"] for x in ph.phi_tu_can(can_menh, ls_a["cung"])]


def test_quan_he_mac_dinh_va_sai(ls_a):
    assert ht.lap(ls_a, "Canh", "Ất")["quan_he"] == "nguoi_yeu"
    with pytest.raises(ValueError):
        ht.lap(ls_a, "Canh", "Ất", "ke_thu")
    assert set(ht.QUAN_HE) == {"nguoi_yeu", "vo_chong", "ban_be", "dong_nghiep", "doi_tac", "sep",
                               "cha_me_con", "gia_dinh"}


def _chuoi(x):
    if isinstance(x, str):
        return [x]
    if isinstance(x, dict):
        return [s for v in x.values() for s in _chuoi(v)]
    if isinstance(x, list):
        return [s for v in x for s in _chuoi(v)]
    return []


def test_co_diem_tham_khao(ls_a, ls_b):
    ban, kia = {"nam_am": 1990, "gioi_tinh": "nam"}, {"nam_am": 1992, "gioi_tinh": "nu"}
    mot = ht.lap(ls_a, "Canh", "Nhâm", "nguoi_yeu", ban=ban, kia=kia)
    hai = ht.lap(ls_a, "Canh", "Nhâm", "nguoi_yeu", ls_kia=ls_b, ban=ban, kia=kia)
    for r in (mot, hai):
        assert r["khong_cham_diem"] is False and 0 <= r["diem"]["tong"] <= 100
        assert r["tom_tat"][0].startswith(f"Điểm tham khảo: {r['diem']['tong']}/100")
    assert mot["diem"]["hai_chieu"] is False and hai["diem"]["hai_chieu"] is True
    tv = next(t for t in hai["diem"]["tieu_chi"] if t["ma"] == "tu_vi")
    assert any("Can năm Canh của bạn" in s for s in tv["can_cu"])


def test_trung_tinh_khong_doa(ls_a, ls_b):
    for q in ht.QUAN_HE:
        r = ht.lap(ls_a, "Canh", "Nhâm", q, ls_kia=ls_b, ban={"nam_am": 1990, "gioi_tinh": "nam"},
                   kia={"nam_am": 1992, "gioi_tinh": "nu"})
        bo = {"luu_y", "diem"}
        chu = _chuoi({k: v for k, v in r.items() if k not in bo})
        d = r["diem"]
        chu += [d["nhan_muc"], d["mo_ta_muc"], d["loi_dan"], *d["goi_y"], *(t["giai_thich"] for t in d["tieu_chi"])]
        for s in chu:
            for tu in TU_DOA:
                assert tu not in s.lower(), (tu, s)
            assert "không chấm điểm" not in s.lower()


def test_khong_kb(ls_a, monkeypatch):
    monkeypatch.setattr(pkb, "_d", lambda: {})
    r = ht.lap(ls_a, "Canh", "Ất", "sep")
    assert r["nhan_quan_he"] == "Cấp trên" and all(x["nghia"] for x in r["nguoi_kia_vao_ban"])
