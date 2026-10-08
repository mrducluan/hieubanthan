# -*- coding: utf-8 -*-
"""RL-1 — hạn mức lượt gọi AI (OpenRouter). Viết TRƯỚC hàm.

Web đã mở công khai: mỗi lượt AI tốn tiền thật. Engine giữ hạn mức trong bộ nhớ (một tiến trình uvicorn):
theo người gọi (IP đã băm, web chuyển qua header `x-nguoi-goi`) mỗi giờ + tổng mỗi giờ + tổng mỗi ngày.
Hết lượt → KHÔNG báo lỗi cho người dùng: lời gọi AI ném `HetLuot`, nơi gọi đã có sẵn đường rơi về template.
"""
import pytest
from fastapi.testclient import TestClient

from app.narrative import hoi_van, ngan_sach


class Dong:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


def test_gioi_han_theo_nguoi_goi_va_cua_so_truot():
    d = Dong()
    ns = ngan_sach.NganSach(gio_nguoi=2, gio_tong=100, ngay_tong=1000, dong_ho=d)
    assert ns.xin("a") is None and ns.xin("a") is None
    assert ns.xin("a") == "nguoi_goi_gio"          # người a hết lượt giờ này
    assert ns.xin("b") is None                       # người khác không bị ảnh hưởng
    d.t += 3601                                      # qua 1 giờ → a có lượt lại
    assert ns.xin("a") is None


def test_gioi_han_tong_gio_va_ngay():
    d = Dong()
    ns = ngan_sach.NganSach(gio_nguoi=100, gio_tong=3, ngay_tong=5, dong_ho=d)
    assert [ns.xin(f"n{i}") for i in range(4)] == [None, None, None, "tong_gio"]
    d.t += 3601
    assert [ns.xin(f"m{i}") for i in range(3)] == [None, None, "tong_ngay"]
    d.t += 86401
    assert ns.xin("z") is None


def test_lan_bi_tu_choi_khong_tinh_luot():
    d = Dong()
    ns = ngan_sach.NganSach(gio_nguoi=1, gio_tong=2, ngay_tong=10, dong_ho=d)
    assert ns.xin("a") is None
    for _ in range(5):
        assert ns.xin("a") == "nguoi_goi_gio"       # bị từ chối không ăn vào hạn mức tổng
    assert ns.xin("b") is None


def test_khong_ro_nguoi_goi_chi_xet_tong():
    ns = ngan_sach.NganSach(gio_nguoi=1, gio_tong=3, ngay_tong=10, dong_ho=Dong())
    assert [ns.xin(None) for _ in range(4)] == [None, None, None, "tong_gio"]


def test_bam_nguoi_goi_khong_giu_ip_tho():
    k = ngan_sach.bam("203.0.113.7")
    assert k and "203.0.113.7" not in k and k == ngan_sach.bam("203.0.113.7") and k != ngan_sach.bam("203.0.113.8")
    assert ngan_sach.bam("") is None and ngan_sach.bam(None) is None


def test_doc_han_muc_tu_env(monkeypatch):
    monkeypatch.setenv("LLM_LUOT_NGUOI_GIO", "7")
    monkeypatch.setenv("LLM_LUOT_TONG_GIO", "70")
    monkeypatch.setenv("LLM_LUOT_TONG_NGAY", "700")
    ns = ngan_sach.tu_env()
    assert (ns.gio_nguoi, ns.gio_tong, ns.ngay_tong) == (7, 70, 700)


def test_het_luot_thi_hoi_dap_roi_ve_template(monkeypatch):
    """Có khoá AI nhưng hết lượt → không gọi mạng, trả template, ghi lý do."""
    monkeypatch.setenv("OPENROUTER_API_KEY", "khoa-gia")
    monkeypatch.setattr(ngan_sach, "_chung", ngan_sach.NganSach(gio_nguoi=0, gio_tong=0, ngay_tong=0))

    def cam_goi_mang(*a, **k):
        raise AssertionError("không được gọi mạng khi hết lượt")
    monkeypatch.setattr(hoi_van.httpx, "Client", cam_goi_mang)
    r = hoi_van.tra_loi("Số đường đời của tôi nói gì?", {"ho_ten": ["Nguyễn Văn An"], "ngay": 24, "thang": 10, "nam": 1988})
    assert r["che_do"] == "template_fallback" and r["cau_tra_loi"]
    assert any("hết lượt AI" in x for x in r["loi_kiem_tra"])


def test_middleware_gan_nguoi_goi(monkeypatch):
    """Header `x-nguoi-goi` từ web → engine băm và gắn vào ngữ cảnh lời gọi."""
    from app.main import app
    thay = []
    monkeypatch.setenv("OPENROUTER_API_KEY", "khoa-gia")
    monkeypatch.setattr(ngan_sach, "_chung", ngan_sach.NganSach(gio_nguoi=1, gio_tong=100, ngay_tong=100))

    def gia_llm(goi, cau_hoi):
        ngan_sach.kiem_luot()
        thay.append(ngan_sach.NGUOI_GOI.get())
        return "x"
    monkeypatch.setattr(hoi_van, "_goi_llm", lambda g, c: gia_llm(g, c))
    c = TestClient(app)
    body = {"ho_ten": ["Nguyễn Văn An"], "ngay": 24, "thang": 10, "nam": 1988, "cau_hoi": "Số đường đời của tôi nói gì?"}
    c.post("/v1/thanso/hoi", json=body, headers={"x-nguoi-goi": "198.51.100.1"})
    r2 = c.post("/v1/thanso/hoi", json=body, headers={"x-nguoi-goi": "198.51.100.1"}).json()
    c.post("/v1/thanso/hoi", json=body, headers={"x-nguoi-goi": "198.51.100.2"})
    assert thay[0] == ngan_sach.bam("198.51.100.1") and len(thay) == 2 and thay[1] == ngan_sach.bam("198.51.100.2")
    assert r2["che_do"] == "template_fallback"


def test_luan_giai_moi_chuong_mot_luot_va_giu_nguoi_goi_qua_luong_phu(monkeypatch):
    """Luận giải toàn bộ gọi AI song song từng chương — người gọi phải đi theo vào luồng phụ."""
    from app.narrative import luan_giai_van
    monkeypatch.setenv("OPENROUTER_API_KEY", "khoa-gia")
    monkeypatch.setattr(ngan_sach, "_chung", ngan_sach.NganSach(gio_nguoi=1, gio_tong=100, ngay_tong=100))

    class Hong:
        def __init__(self, *a, **k):
            raise RuntimeError("mạng giả hỏng")
    monkeypatch.setattr(luan_giai_van.httpx, "Client", Hong)
    bc = {"mo_dun": "tuvi", "chuong": [{"tieu_de": f"C{i}", "doan": ["đoạn"]} for i in range(3)]}
    tok = ngan_sach.NGUOI_GOI.set(ngan_sach.bam("192.0.2.9"))
    try:
        kq = luan_giai_van.dien_dat(bc)
    finally:
        ngan_sach.NGUOI_GOI.reset(tok)
    loi = [c["loi_kiem_tra"][0] for c in kq["chuong"]]
    assert sum("hết lượt AI" in x for x in loi) == 2 and sum("mạng giả hỏng" in x for x in loi) == 1
    assert kq["dien_dat"] == "mau"
