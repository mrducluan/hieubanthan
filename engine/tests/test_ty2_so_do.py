# -*- coding: utf-8 -*-
"""TY-2 đợt 2 (2026-11-25) — MỘT bản vẽ: Khảo sát nhà đọc thẳng sơ đồ tỉ lệ (khung rộng × sâu mét + điểm 0..1 của tầng
trệt) thay lưới 6×6. Một bộ tính: phương từng chỗ = `vi_tri_vat.do_tu_khung` (như "Đứng giữa nhà"), Trung cung / khuyết góc =
`mat_bang` (như lưới cũ). Hồ sơ lưới cũ chuyển sang sơ đồ (rộng = sâu = 6, điểm = tâm ô) cho cùng kết quả."""
import itertools

import pytest

from app.calc import mat_bang as mb
from app.calc import mat_bang_khung as mk
from app.calc import phongthuy as pt
from app.calc import vi_tri_vat as vt
from app.luangiai import phongthuy_bo_cuc as bc


def test_phuong_khop_do_tu_khung():
    """Phương của một chỗ trên sơ đồ = đúng phép của "Đứng giữa nhà" (không có bản tính thứ hai)."""
    for x, y in itertools.product((0.05, 0.2, 0.8, 0.95), (0.03, 0.2, 0.8, 0.97)):
        for huong in (0.0, 137.0, 180.0, 291.5):
            r = mk.phan_tich_so_do(5, 15, {"bep": (x, y)}, huong)
            p = r["phuong_phong"]["bep"]
            assert not p["trung_cung"]
            assert p["phuong"] == pt.huong_tu_do(vt.do_tu_khung(5, 15, x, y, huong))


def test_nha_huong_nam_cua_truoc_bep_sau_wc_giua():
    r = mk.phan_tich_so_do(5, 15, {"cua_chinh": (0.5, 0.02), "bep": (0.5, 0.96), "ve_sinh": (0.5, 0.5)}, 180.0)
    pp = r["phuong_phong"]
    assert r["nguon"] == "so_do"
    assert pp["cua_chinh"]["phuong"] == "Nam" and pp["bep"]["phuong"] == "Bắc"
    assert pp["ve_sinh"]["trung_cung"] and r["wc_trung_cung"]
    assert r["khuyet_goc"] == [] and r["tam"] == [0.5, 0.5]


def test_chua_co_huong_chi_ra_trung_cung_va_khuyet():
    r = mk.phan_tich_so_do(6, 10, {"bep": (0.9, 0.9), "ve_sinh": (0.5, 0.5)}, None)
    assert r["phuong_phong"]["bep"]["phuong"] is None and r["phuong_phong"]["ve_sinh"]["phuong"] == "Trung cung"
    assert any("Chưa có độ hướng" in c for c in r["canh_bao"])


def test_khuyet_goc_tu_luoi():
    luoi = ["1100", "1100", "1111", "1111"]                      # nhà chữ L: khuyết góc trước–phải
    r = mk.phan_tich_so_do(8, 8, {}, 180.0, luoi)
    assert r["khuyet_goc"]
    assert r["tam"] == list(mk.tam_khung(luoi))


@pytest.mark.parametrize("ban_cong,thang", [((0.5, 0.98), True), ((0.95, 0.98), False)])
def test_cua_thong_ban_cong(ban_cong, thang):
    """Đo bằng mét: nhà vuông 10 × 10, ban công ở góc sau lệch ~25° → không thẳng hàng (nhà ống 5 × 15 thì chỉ ~9°)."""
    r = mk.phan_tich_so_do(10, 10, {"cua_chinh": (0.5, 0.02), "ban_cong": ban_cong}, 180.0)
    assert r["cua_thong_ban_cong"]["thang_hang"] is thang
    ma = {g["ma"] for g in mk.goi_y_dau_hieu([{"loai": "cua_chinh", "diem": (0.5, 0.02)}, {"loai": "ban_cong", "diem": ban_cong}], 10, 10)}
    assert ("cua_thong_ban_cong" in ma) is thang


def test_cua_thong_ban_cong_bi_chan_boi_phan_khong_xay():
    luoi = ["1111", "1111", "0000", "1111"]                      # hàng giữa trống (sân trong) chắn đường đi thẳng
    r = mk.phan_tich_so_do(8, 8, {"cua_chinh": (0.5, 0.02), "ban_cong": (0.5, 0.98)}, 180.0, luoi)
    assert r["cua_thong_ban_cong"]["thang_hang"] is False


def test_chuyen_luoi_cu_cung_ket_qua():
    """Hồ sơ cũ: lưới 6×6 tô kín + ô phòng → sơ đồ rộng = sâu = 6, điểm = tâm ô. Phương phòng như bản lưới."""
    luoi = ["111111"] * 6
    phong = {"cua_chinh": (0, 2), "bep": (5, 0), "phong_ngu_chinh": (1, 5), "ve_sinh": (3, 3), "ban_tho": (5, 5)}
    for huong in (0.0, 90.0, 200.0):
        cu = mb.phan_tich(luoi, huong, phong)["phuong_phong"]
        moi = mk.phan_tich_so_do(6, 6, {k: ((c + 0.5) / 6, (r + 0.5) / 6) for k, (r, c) in phong.items()}, huong)["phuong_phong"]
        assert {k: v["phuong"] for k, v in cu.items()} == {k: v["phuong"] for k, v in moi.items()}


def test_diem_ngoai_khung_bi_tu_choi():
    with pytest.raises(ValueError):
        mk.phan_tich_so_do(5, 15, {"bep": (1.2, 0.5)}, 180.0)


BC = {"huong_nha_do": 180.0, "so_do": {"rong": 5, "sau": 15, "vat": {"cua_chinh": [0.5, 0.02], "bep": [0.5, 0.96],
                                                                    "ve_sinh": [0.5, 0.5], "ban_cong": [0.5, 0.98]}}}


def test_bo_cuc_doc_so_do():
    r = bc.luan(BC, {"nam": 1985, "gioi_tinh": "nam"})
    vt_ = {p["phong"]: p["cung"] for p in r["da_tinh"]["vi_tri"]}
    assert vt_ == {"cua_chinh": "Nam", "bep": "Bắc", "ve_sinh": "Trung cung"}
    # SD-1: sơ đồ chỉ GỢI Ý dấu hiệu — chưa xác nhận thì không luận, không trần mức
    assert r["dien_giai"]["dau_hieu"] == [] and r["veto_da_xac_nhan"] == []
    assert {g["ma"] for g in r["mat_bang"]["dau_hieu_goi_y"]} == {"wc_giua_nha", "cua_thong_ban_cong"}
    assert all(g["hoi"] for g in r["mat_bang"]["dau_hieu_goi_y"])
    assert r["mat_bang"]["nguon"] == "so_do"
    # người dùng xác nhận → luận
    xn = bc.luan({**BC, "dau_hieu": {"wc_giua_nha": {"co": True, "nguon": "nguoi_dung"}}}, None)
    assert "wc_giua_nha" in xn["veto_da_xac_nhan"]
    assert r["da_tinh"]["cua_chu_bep"] is not None


def test_bo_cuc_khai_tay_va_khong_thang_so_do():
    r = bc.luan({**BC, "vi_tri": {"bep": "Đông"},
                 "dau_hieu": {"wc_giua_nha": {"co": False, "nguon": "nguoi_dung"}}}, None)
    assert {p["phong"]: p["cung"] for p in r["da_tinh"]["vi_tri"]}["bep"] == "Đông"
    assert "wc_giua_nha" not in {d["ma"] for d in r["dien_giai"]["dau_hieu"]}


def test_bo_cuc_so_do_thang_luoi_cu():
    """Hai bản vẽ cùng gửi (máy cũ chưa chuyển hồ sơ) → sơ đồ tỉ lệ là bản dùng."""
    r = bc.luan({**BC, "mat_bang": {"luoi": ["111"] * 3, "phong": {"bep": (0, 0)}}}, None)
    assert r["mat_bang"]["nguon"] == "so_do"


def test_so_do_goi_y_cau_thang_giua_nha():
    r = bc.luan({"huong_nha_do": 90.0, "so_do": {"rong": 6, "sau": 12, "vat": {"cau_thang": [0.5, 0.5]}}}, None)
    assert "cau_thang_giua_nha" in {g["ma"] for g in r["mat_bang"]["dau_hieu_goi_y"]}
    assert r["dien_giai"]["dau_hieu"] == []


def test_wc_khai_tay_giua_nha_van_luan():
    """Người dùng tự chọn WC ở Trung cung (lưới 3×3) vẫn là lời khai — luận như cũ."""
    r = bc.luan({**BC, "vi_tri": {"ve_sinh": "Trung cung"}}, None)
    assert "wc_giua_nha" in {d["ma"] for d in r["dien_giai"]["dau_hieu"]}



def test_vi_tri_vat_nhan_ban_cong():
    """Sơ đồ "Đứng giữa nhà" nhận chỗ ban công (tầng trệt có đủ 6 chỗ) → gợi ý cửa thông ban công; route bố cục nhận `so_do`."""
    from fastapi.testclient import TestClient

    from app.main import app
    c = TestClient(app)
    vat = [{"loai": k, "diem": d} for k, d in (("cua_chinh", [0.5, 0.02]), ("phong_ngu_chinh", [0.2, 0.3]), ("bep", [0.8, 0.8]),
                                               ("ve_sinh", [0.2, 0.8]), ("ban_tho", [0.8, 0.3]), ("ban_cong", [0.5, 0.98]))]
    r = c.post("/v1/phongthuy/vi-tri-vat", json={"huong_nha_do": 180, "khung": {"rong": 10, "sau": 10}, "tang": [{"so": 1, "vat": vat}]})
    assert r.status_code == 200, r.text
    d = r.json()
    assert "cua_thong_ban_cong" in {g["ma"] for g in d["dau_hieu_goi_y"]}
    assert any(v["loai"] == "ban_cong" and v["ten"] for t in d["tang"] for v in t["vat"])
    b = c.post("/v1/phongthuy/bo-cuc", json={"bo_cuc": BC})
    assert b.status_code == 200, b.text
    assert b.json()["mat_bang"]["nguon"] == "so_do"
