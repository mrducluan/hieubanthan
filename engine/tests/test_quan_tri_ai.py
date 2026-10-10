# -*- coding: utf-8 -*-
"""QT-3 — trợ lý AI trong trang quản trị. Viết TRƯỚC hàm.

AI chỉ là công cụ biên tập: soạn NHÁP cho một giá trị chuỗi trong kho tri thức, người quản trị đọc, sửa, rồi mới
Xuất bản (mở PR). Kiểm định chạy không cần AI (luật cố định), cho cả nháp AI lẫn chữ người viết.
Hạn mức lượt AI quản trị tách riêng với người dùng (không ăn lượt của khách).
"""
from fastapi.testclient import TestClient

from app import quan_tri_ai as qa
from app.main import app

client = TestClient(app)


def _ma(ds):
    return {c["ma"] for c in ds}


def test_kiem_dinh_bat_giong_phan_va_vung_cam():
    ds = qa.kiem_dinh("Người tuổi này chắc chắn sẽ phá sản, nên mua vật phẩm hoá giải.")
    assert {"giong_phan", "vung_cam"} <= _ma(ds)


def test_kiem_dinh_bat_lien_he_va_so_la():
    ds = qa.kiem_dinh("Gọi 0912 345 678 hoặc vào https://x.vn. Sao này sáng 7 phần.", goc="Sao này sáng.")
    assert {"lien_he", "so_la"} <= _ma(ds)


def test_kiem_dinh_so_da_co_trong_goc_khong_bao():
    assert "so_la" not in _ma(qa.kiem_dinh("Số 7 hướng nội.", goc="Số 7 thiên về nội tâm."))


def test_kiem_dinh_van_sach_khong_canh_bao():
    assert qa.kiem_dinh("Người số 7 thường được mô tả là thích suy ngẫm; mặt tối là dễ khép mình.") == []


def test_kiem_dinh_do_dai_thay_doi_manh():
    assert "do_dai" in _ma(qa.kiem_dinh("Ngắn.", goc="x" * 400))
    assert "rong" in _ma(qa.kiem_dinh("   "))


def test_kiem_dinh_khong_phan_biet_kieu_dau():
    assert "vung_cam" in _ma(qa.kiem_dinh("Nên làm lễ hóa giải."))


def test_soan_nhap_khong_co_key(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    kq = qa.soan_nhap(tep="tuvi_kb.json", duong=["sao", "tu_vi", "y_nghia"], hien_tai="abc", hanh_dong="viet_lai")
    assert kq["da_bat_llm"] is False and kq["nhap"] is None


def test_soan_nhap_goi_llm_va_kiem_dinh(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "k")
    da_goi = {}

    def gia(messages, nhiet_do):
        da_goi["messages"] = messages
        return "  Bản nháp mới, bạn sẽ giàu.  "

    monkeypatch.setattr(qa, "_goi_llm", gia)
    kq = qa.soan_nhap(tep="thanso_kb.json", duong=["so", "7", "tong_quan"], hien_tai="Số 7 nội tâm.",
                      hanh_dong="mo_rong", yeu_cau="thêm mặt tối", ngu_canh={"ten": "Số 7"})
    assert kq["da_bat_llm"] is True
    assert kq["nhap"] == "Bản nháp mới, bạn sẽ giàu."
    assert "giong_phan" in _ma(kq["kiem_dinh"])
    noi = " ".join(m["content"] for m in da_goi["messages"])
    assert "thêm mặt tối" in noi and "Số 7 nội tâm." in noi and "thanso_kb.json" in noi


def test_soan_nhap_het_luot_quan_tri(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "k")
    monkeypatch.setattr(qa, "_ngan_sach", qa.ngan_sach.NganSach(gio_nguoi=10**6, gio_tong=10**6, ngay_tong=0))
    monkeypatch.setattr(qa, "_goi_llm", lambda *a: "x")
    kq = qa.soan_nhap(tep="a.json", duong=["x"], hien_tai="a", hanh_dong="soat_loi")
    assert kq["nhap"] is None and "hết lượt" in kq["loi"]


def test_soan_nhap_hanh_dong_la_bi_tu_choi():
    import pytest
    with pytest.raises(ValueError):
        qa.soan_nhap(tep="a.json", duong=["x"], hien_tai="a", hanh_dong="xoa_het")


def test_api_kiem_dinh_va_soan_nhap(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = client.post("/v1/quan-tri/kiem-dinh", json={"muc": [{"moi": "Bạn sẽ chết sớm.", "cu": "x"}, {"moi": "Ổn."}]})
    assert r.status_code == 200
    kq = r.json()["ket_qua"]
    assert len(kq) == 2 and kq[0] and kq[1] == []
    r = client.post("/v1/quan-tri/soan-nhap", json={"tep": "a.json", "duong": ["x", 0], "hien_tai": "a", "hanh_dong": "viet_lai"})
    assert r.status_code == 200 and r.json()["da_bat_llm"] is False
    assert client.post("/v1/quan-tri/soan-nhap", json={"tep": "a.json", "duong": ["x"], "hien_tai": "a",
                                                       "hanh_dong": "khac"}).status_code == 422
