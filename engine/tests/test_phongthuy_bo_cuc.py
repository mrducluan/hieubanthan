# -*- coding: utf-8 -*-
"""PT-V0 / PT-V3 — luận phong thuỷ từ BỐ CỤC NHÀ (JSON đã xác nhận: do người dùng khai hoặc sau này do ảnh trích ra).
Viết TRƯỚC hàm. Tầng RULES: không gọi LLM; mọi kết luận trỏ về một mục KB có nguồn.

Ca mẫu (đối chiếu tay, Bát trạch): gia chủ nam 1990 → mệnh Khảm (Đông tứ mệnh). Bảng du niên của Khảm:
Bắc Phục Vị · Nam Diên Niên · Đông Thiên Y · Đông Nam Sinh Khí · Tây Nam Tuyệt Mệnh · Tây Họa Hại · Tây Bắc Lục Sát
· Đông Bắc Ngũ Quỷ. Nhà hướng Nam (180°) → toạ Bắc → Khảm trạch (Đông tứ trạch), cùng nhóm.
"""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.luangiai import phongthuy_bo_cuc as bc
from app.main import app

SINH = {"nam": 1990, "gioi_tinh": "nam"}
BO_CUC = {
    "phien_ban": "0.1",
    "loai_nha": "nha_pho",
    "huong_nha_do": 180,
    "vi_tri": {"cua_chinh": "Nam", "phong_ngu_chinh": "Đông", "bep": "Tây", "ve_sinh": "Trung cung",
               "ban_tho": "Tây Bắc", "phong_lam_viec": "Đông Nam"},
    "huong_do": {"mieng_bep": 90, "dau_giuong": 0},
    "dau_hieu": {
        "guong_giuong": {"co": True, "xac_nhan": True},
        "xa_ngang": {"co": True, "do_tin": 0.4, "nguon": "anh"},                 # chưa xác nhận, độ tin thấp → bỏ
        "cau_thang_cua": {"co": False, "xac_nhan": True},
        "duong_dam": {"co": True, "do_tin": 0.95, "nguon": "anh", "xac_nhan": True},
    },
}


@pytest.fixture(scope="module")
def kq():
    return bc.luan(BO_CUC, SINH)


def test_da_tinh_trach_va_menh(kq):
    d = kq["da_tinh"]
    assert d["trach"]["quai"] == "Khảm" and d["trach"]["toa"] == "Bắc"
    assert d["menh_quai"]["quai"] == "Khảm" and d["cung_nhom"] is True


def test_vi_tri_phong_theo_du_nien(kq):
    p = {x["phong"]: x for x in kq["da_tinh"]["vi_tri"]}
    assert p["cua_chinh"]["du_nien_menh"] == "Diên Niên" and p["cua_chinh"]["hop"] is True
    assert p["phong_ngu_chinh"]["du_nien_menh"] == "Thiên Y" and p["phong_ngu_chinh"]["hop"] is True
    assert p["bep"]["du_nien_menh"] == "Hoạ Hại" and p["bep"]["hop"] is True      # bếp: toạ hung → hợp
    assert p["ban_tho"]["du_nien_menh"] == "Lục Sát" and p["ban_tho"]["hop"] is False
    assert p["phong_lam_viec"]["du_nien_menh"] == "Sinh Khí" and p["phong_lam_viec"]["hop"] is True
    assert p["ve_sinh"]["du_nien_menh"] is None                                    # trung cung không có du niên
    for x in kq["da_tinh"]["vi_tri"]:
        assert x["kb"].startswith("vi_tri_phong.")


def test_huong_do_mieng_bep_dau_giuong(kq):
    h = {x["doi_tuong"]: x for x in kq["da_tinh"]["huong"]}
    assert h["mieng_bep"]["huong"] == "Đông" and h["mieng_bep"]["du_nien"] == "Thiên Y" and h["mieng_bep"]["cat"]
    assert h["dau_giuong"]["huong"] == "Bắc" and h["dau_giuong"]["du_nien"] == "Phục Vị"


def test_cua_chu_bep(kq):
    ccb = kq["da_tinh"]["cua_chu_bep"]
    assert {c["cap"] for c in ccb["cap"]} == {"cửa–chủ", "cửa–bếp", "chủ–bếp"}


def test_dau_hieu_chi_lay_da_xac_nhan_hoac_tin_cao(kq):
    ma = [x["ma"] for x in kq["dien_giai"]["dau_hieu"]]
    assert "guong_giuong" in ma and "duong_dam" in ma
    assert "xa_ngang" not in ma and "cau_thang_cua" not in ma
    assert "wc_giua_nha" in ma                                    # suy từ vị trí: nhà vệ sinh ở trung cung
    assert {x["ma"] for x in kq["can_xac_nhan"]} == {"xa_ngang"}
    for x in kq["dien_giai"]["dau_hieu"]:
        assert x["tieu_de"] and x["nguon"] in ("co_thu", "dan_gian")


def test_ba_lop_va_meta(kq):
    assert set(kq) >= {"da_tinh", "dien_giai", "tu_soi", "can_xac_nhan", "luu_y", "trang_thai"}
    assert kq["tu_soi"] and kq["trang_thai"] == "nhap_ai"
    assert "vật phẩm" in kq["luu_y"]


def test_khong_co_sinh_van_luan_theo_trach():
    r = bc.luan({**BO_CUC, "vi_tri": {"bep": "Tây"}}, None)
    p = r["da_tinh"]["vi_tri"][0]
    assert r["da_tinh"]["menh_quai"] is None and p["du_nien_menh"] is None and p["du_nien_trach"] == "Hoạ Hại"


def test_schema_khop_mo_hinh():
    goc = Path(__file__).resolve().parents[1] / "app" / "schemas" / "bo_cuc.schema.json"
    assert json.loads(goc.read_text(encoding="utf-8")) == bc.json_schema()


def test_dau_hieu_la_bi_tu_choi():
    with pytest.raises(ValueError):
        bc.luan({**BO_CUC, "dau_hieu": {"khong_co_ma_nay": {"co": True, "xac_nhan": True}}}, SINH)


def test_api_bo_cuc():
    c = TestClient(app)
    r = c.post("/v1/phongthuy/bo-cuc", json={"bo_cuc": BO_CUC, "sinh": {"birth_year": 1990, "gender": "nam"}})
    assert r.status_code == 200, r.text
    assert r.json()["da_tinh"]["trach"]["quai"] == "Khảm"
    assert c.post("/v1/phongthuy/bo-cuc", json={"bo_cuc": {**BO_CUC, "huong_nha_do": 400}}).status_code == 422
    assert c.get("/v1/phongthuy/bo-cuc/danh-muc").json()["dau_hieu"]
