# -*- coding: utf-8 -*-
"""LG2 — NARRATIVE cho Luận giải toàn bộ: LLM viết lại TỪNG CHƯƠNG từ chính các đoạn RULES đã ghép.
Kiểm tra đầu ra chặn số lạ, tên sao/cung/thập thần lạ, giọng phán quyết → chương đó rơi về bản mẫu.
Không có OPENROUTER_API_KEY → giữ bản mẫu. Test viết TRƯỚC; LLM được giả lập, không gọi mạng.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.narrative import luan_giai_van as lgv

BC = {"mo_dun": "tuvi", "ket": "Kết.", "chuong": [
    {"ma": "tong_quan", "tieu_de": "Tổng quan", "cau_hoi": "?", "doan": [
        "Cung Mệnh có Tử Vi tại Ngọ, người được mô tả là tự trọng.", "Cách cục: Tử Phủ Vũ Tướng (4 sao)."]},
    {"ma": "su_nghiep", "tieu_de": "Sự nghiệp", "cau_hoi": "?", "doan": ["Quan Lộc có Thiên Phủ, giữ của tốt."]},
]}


def test_khong_key_giu_ban_mau(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    kq = lgv.dien_dat(BC)
    assert kq["dien_dat"] == "mau" and all("van_ai" not in c for c in kq["chuong"])


def test_co_key_viet_lai_tung_chuong(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "gia")
    monkeypatch.setattr(lgv, "_goi_llm", lambda tieu_de, doan, mo_dun: f"Về {tieu_de.lower()}, theo dữ liệu đã tính: " + " ".join(doan))
    kq = lgv.dien_dat(BC)
    assert kq["dien_dat"] == "ai"
    assert all(c["che_do"] == "llm" and c["van_ai"] for c in kq["chuong"])
    assert kq["chuong"][0]["doan"] == BC["chuong"][0]["doan"]          # bản gốc vẫn đi kèm để đối chiếu


def test_vi_pham_roi_ve_ban_mau_tung_chuong(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "gia")
    xau = {"Tổng quan": "Bạn sẽ chắc chắn giàu năm 2031 nhờ Tham Lang.", "Sự nghiệp": "Quan Lộc có Thiên Phủ, giữ của tốt."}
    monkeypatch.setattr(lgv, "_goi_llm", lambda tieu_de, doan, mo_dun: xau[tieu_de])
    kq = lgv.dien_dat(BC)
    c0, c1 = kq["chuong"]
    assert c0["che_do"] == "template_fallback" and "van_ai" not in c0
    assert any("2031" in l for l in c0["loi_kiem_tra"]) and any("Tham Lang" in l for l in c0["loi_kiem_tra"])
    assert any("bạn sẽ" in l for l in c0["loi_kiem_tra"])
    assert c1["che_do"] == "llm" and kq["dien_dat"] == "tron"


def test_llm_loi_khong_lam_sap(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "gia")
    def no(*a):
        raise TimeoutError("cham")
    monkeypatch.setattr(lgv, "_goi_llm", no)
    kq = lgv.dien_dat(BC)
    assert kq["dien_dat"] == "mau" and all(c["che_do"] == "template_fallback" for c in kq["chuong"])


def test_kiem_tra_chuong():
    nguon = "Cung Mệnh có Tử Vi tại Ngọ (4 sao). Thất Sát ở Quan Lộc."
    assert lgv.kiem_tra_chuong("Tử Vi ở Mệnh, 4 sao hội; Thất Sát nơi Quan Lộc.", nguon) == []
    loi = lgv.kiem_tra_chuong("Phá Quân ở Điền Trạch, năm 7.", nguon)
    assert any("Phá Quân" in l for l in loi) and any("Điền Trạch" in l for l in loi) and any("7" in l for l in loi)
    assert lgv.kiem_tra_chuong("Thương Quan lộ.", "Nhật chủ Giáp.") != []


def test_api_tra_dien_dat(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    la = {"birth_date": "1997-03-19", "birth_time": "00:30", "gender": "nam", "noi_sinh": "ha-noi"}
    c = TestClient(app)
    assert c.post("/v1/tuvi/luan-giai", json={"la_so": la}).json()["dien_dat"] == "mau"
    assert c.post("/v1/battu/luan-giai", json={"la_so": la}).json()["dien_dat"] == "mau"


def test_xem_truoc_chi_dien_dat_n_chuong_dau(monkeypatch):
    """SAO-2: bản xem trước chỉ gọi LLM cho N chương đầu (chương khoá không tốn tiền AI); chương còn lại giữ bản mẫu."""
    monkeypatch.setenv("OPENROUTER_API_KEY", "gia")
    goi = []
    monkeypatch.setattr(lgv, "_goi_llm", lambda tieu_de, doan, mo_dun: goi.append(tieu_de) or f"Về {tieu_de.lower()}: " + " ".join(doan))
    kq = lgv.dien_dat(BC, toi_da=1)
    assert goi == ["Tổng quan"]
    assert kq["chuong"][0]["che_do"] == "llm" and "van_ai" not in kq["chuong"][1]
    assert kq["chuong"][1]["che_do"] == "chua_dien_dat" and kq["dien_dat"] == "ai"   # mọi chương ĐÃ diễn đạt đều qua


def test_api_nhan_dien_dat_toi_da(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    la = {"birth_date": "1997-03-19", "birth_time": "00:30", "gender": "nam", "noi_sinh": "ha-noi"}
    c = TestClient(app)
    for duong in ("/v1/tuvi/luan-giai", "/v1/battu/luan-giai"):
        r = c.post(duong, json={"la_so": la, "dien_dat_toi_da": 1})
        assert r.status_code == 200, r.text
        assert all(ch["moi_xem"]["cau_hoi"] for ch in r.json()["chuong"])
    assert c.post("/v1/tuvi/luan-giai", json={"la_so": la, "dien_dat_toi_da": 99}).status_code == 422
