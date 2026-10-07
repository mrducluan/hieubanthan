# -*- coding: utf-8 -*-
"""TS-SAU — dòng đời & bước ngoặt (CALC). Viết TRƯỚC hàm.

Ca chuẩn 24/10/1988 (Đường đời 33), tính tay:
  M=10→1, D=24→6, Y=1988→26→8.
  Đỉnh: P1=1+6=7 · P2=6+8=14→5 · P3=7+5=12→3 · P4=1+8=9; hết P1 ở 36−6=30 tuổi.
  Thử thách: |1−6|=5 · |6−8|=2 · chính |5−2|=3 · |1−8|=7 → gắn lần lượt với P1..P4.
  Năm cá nhân (mốc dương lịch) = 6+1+rút_gọn(năm): 2019 → 1, 2026 → 8, 2018 → 9.
"""
import pytest

from app.calc import thanso_dong_doi as dd


@pytest.fixture(scope="module")
def mau():
    return dd.dong_doi(24, 10, 1988, nam_xem=2026)


def test_giai_doan_gan_thu_thach(mau):
    gd = mau["giai_doan"]
    assert [(g["dinh"], g["so"], g["thu_thach"]) for g in gd] == [(1, 7, 5), (2, 5, 2), (3, 3, 3), (4, 9, 7)]
    assert [(g["tu_tuoi"], g["den_tuoi"]) for g in gd] == [(0, 30), (31, 39), (40, 48), (49, None)]
    assert [(g["tu_nam"], g["den_nam"]) for g in gd] == [(1988, 2018), (2019, 2027), (2028, 2036), (2037, None)]


def test_chu_ky_9_nam_bat_dau_o_nam_ca_nhan_1(mau):
    bd = [c["bat_dau"] for c in mau["chu_ky"]]
    assert bd[:5] == [1992, 2001, 2010, 2019, 2028]
    assert all(b - a == 9 for a, b in zip(bd, bd[1:]))
    assert mau["chu_ky"][0]["ket_thuc"] == 2000


def test_buoc_ngoat_gom_chuyen_dinh_va_khoi_khep(mau):
    bn = mau["buoc_ngoat"]
    chuyen = [(b["nam"], b["so"]) for b in bn if b["loai"] == "chuyen_dinh"]
    assert chuyen == [(2019, 5), (2028, 3), (2037, 9)]
    khoi = [b["nam"] for b in bn if b["loai"] == "khoi_chu_ky"]
    khep = [b["nam"] for b in bn if b["loai"] == "khep_chu_ky"]
    assert 2019 in khoi and 2028 in khoi and 1992 in khoi
    assert 2018 in khep and 2027 in khep and 1991 in khep
    assert [b["nam"] for b in bn] == sorted(b["nam"] for b in bn)
    # mốc trùng năm được đánh dấu (2019: vừa chuyển đỉnh vừa mở chu kỳ)
    assert any(b["nam"] == 2019 and b["trung_moc"] for b in bn)


def test_hien_tai(mau):
    ht = mau["hien_tai"]
    assert ht == {"nam": 2026, "tuoi": 38, "dinh": 2, "nam_ca_nhan": 8}


def test_den_tuoi_gioi_han():
    kq = dd.dong_doi(24, 10, 1988, nam_xem=2026, den_tuoi=40)
    assert max(b["nam"] for b in kq["buoc_ngoat"]) <= 1988 + 40


def test_doi_chieu_nam():
    r = dd.doi_chieu_nam(24, 10, 1988, 2019)
    assert r["tuoi"] == 31
    assert r["nam_ca_nhan"] == 1
    assert r["dinh"] == 2 and r["so_dinh"] == 5 and r["thu_thach"] == 2
    # theo mốc sinh nhật: trước 24/10/2019 vẫn là năm cá nhân của 2018
    assert r["nam_ca_nhan_sinh_nhat"] == {"truoc_sinh_nhat": 9, "tu_sinh_nhat": 1}
    assert "chuyen_dinh" in r["moc"] and "khoi_chu_ky" in r["moc"]


def test_doi_chieu_nam_truoc_khi_sinh_bi_tu_choi():
    with pytest.raises(ValueError):
        dd.doi_chieu_nam(24, 10, 1988, 1980)


@pytest.mark.parametrize("ngay", [(1, 1, 1950), (29, 2, 2000), (31, 12, 1975), (11, 11, 2011)])
def test_tat_dinh_va_phu_kin(ngay):
    d, m, y = ngay
    a = dd.dong_doi(d, m, y, nam_xem=2026)
    assert a == dd.dong_doi(d, m, y, nam_xem=2026)
    gd = a["giai_doan"]
    assert gd[0]["tu_tuoi"] == 0 and gd[-1]["den_tuoi"] is None
    for x, y2 in zip(gd, gd[1:]):
        assert y2["tu_tuoi"] == x["den_tuoi"] + 1
