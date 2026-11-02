# -*- coding: utf-8 -*-
"""EN-6 — hạn mức lượt AI dùng CHUNG giữa nhiều tiến trình / máy (Redis REST kiểu Upstash, chỉ bật khi đặt env).

Không đặt env → y như cũ (đếm trong bộ nhớ một tiến trình). Đặt `HAN_MUC_REDIS_URL` + `HAN_MUC_REDIS_TOKEN` → mọi tiến
trình đếm chung một kho; kho lỗi → rơi về đếm trong bộ nhớ (không ném lỗi, người dùng không thấy gì khác).
Test dùng máy chủ Redis REST GIẢ (httpx.MockTransport) — không mạng, không thư viện mới.
"""
from __future__ import annotations

import json

import httpx

from app.narrative import ngan_sach as ns


class RedisGia:
    """Đủ cho đường /pipeline của Upstash: INCR, DECR, EXPIRE (NX)."""

    def __init__(self) -> None:
        self.kho: dict[str, int] = {}
        self.het_han: dict[str, int] = {}
        self.khoa_da_thay: list[str] = []
        self.hong = False
        self.dau_xac_thuc: list[str] = []

    def __call__(self, req: httpx.Request) -> httpx.Response:
        self.dau_xac_thuc.append(req.headers.get("authorization", ""))
        if self.hong:
            return httpx.Response(503, json={"error": "hong"})
        assert req.url.path.endswith("/pipeline")
        ra = []
        for lenh in json.loads(req.content):
            ten, khoa = lenh[0].upper(), lenh[1]
            self.khoa_da_thay.append(khoa)
            if ten == "INCR":
                self.kho[khoa] = self.kho.get(khoa, 0) + 1
                ra.append({"result": self.kho[khoa]})
            elif ten == "DECR":
                self.kho[khoa] = self.kho.get(khoa, 0) - 1
                ra.append({"result": self.kho[khoa]})
            elif ten == "EXPIRE":
                if "NX" in lenh[3:] and khoa in self.het_han:
                    ra.append({"result": 0})
                else:
                    self.het_han[khoa] = int(lenh[2])
                    ra.append({"result": 1})
            else:
                ra.append({"error": f"lệnh lạ {ten}"})
        return httpx.Response(200, json=ra)


def _hai_tien_trinh(redis: RedisGia, **han):
    """Hai đối tượng = hai tiến trình engine, cùng một kho Redis."""
    def tao():
        return ns.NganSachRedis(url="https://redis.gia", token="bi-mat", gio_nguoi=han.get("gio_nguoi", 100),
                                gio_tong=han.get("gio_tong", 100), ngay_tong=han.get("ngay_tong", 100),
                                client=httpx.Client(transport=httpx.MockTransport(redis)), dong_ho=lambda: 1_000_000.0)
    return tao(), tao()


def test_tong_gio_dem_chung_giua_hai_tien_trinh():
    r = RedisGia()
    a, b = _hai_tien_trinh(r, gio_tong=3)
    assert [a.xin(None), b.xin(None), a.xin(None)] == [None, None, None]
    assert b.xin(None) == "tong_gio" and a.xin(None) == "tong_gio"


def test_moi_nguoi_dem_chung_va_nguoi_khac_khong_bi_anh_huong():
    r = RedisGia()
    a, b = _hai_tien_trinh(r, gio_nguoi=2)
    assert a.xin("nguoi1") is None and b.xin("nguoi1") is None
    assert a.xin("nguoi1") == "nguoi_goi_gio"
    assert b.xin("nguoi2") is None


def test_bi_tu_choi_thi_khong_tinh_luot():
    r = RedisGia()
    a, _ = _hai_tien_trinh(r, gio_tong=1, ngay_tong=10)
    assert a.xin(None) is None
    for _ in range(5):
        assert a.xin(None) == "tong_gio"
    assert max(v for k, v in r.kho.items() if ":ngay:" in k) == 1     # 5 lần bị chặn không ăn vào hạn mức ngày


def test_ngay_tong_chan_truoc():
    r = RedisGia()
    a, b = _hai_tien_trinh(r, ngay_tong=2, gio_tong=100)
    assert a.xin("x") is None and b.xin("y") is None
    assert a.xin("z") == "tong_ngay"


def test_khoa_co_han_va_khong_chua_ip_tho():
    r = RedisGia()
    a, _ = _hai_tien_trinh(r)
    ai = ns.bam("203.0.113.9")
    a.xin(ai)
    assert r.het_han and all(v in (3600, 86400) or v > 0 for v in r.het_han.values())
    assert not any("203.0.113.9" in k for k in r.khoa_da_thay)
    assert all(d == "Bearer bi-mat" for d in r.dau_xac_thuc)


def test_kho_loi_thi_roi_ve_dem_trong_bo_nho_khong_nem_loi():
    r = RedisGia()
    a, _ = _hai_tien_trinh(r, gio_tong=2)
    r.hong = True
    assert a.xin(None) is None and a.xin(None) is None
    assert a.xin(None) == "tong_gio"          # vẫn có trần (đếm trong bộ nhớ tiến trình)


def test_kho_cham_qua_thoi_han_cung_roi_ve_bo_nho():
    def treo(req):
        raise httpx.ConnectTimeout("treo")
    a = ns.NganSachRedis(url="https://redis.gia", token="t", gio_nguoi=1, gio_tong=5, ngay_tong=5,
                         client=httpx.Client(transport=httpx.MockTransport(treo)))
    assert a.xin("p") is None and a.xin("p") == "nguoi_goi_gio"


def test_tu_env_khong_dat_thi_nhu_cu(monkeypatch):
    monkeypatch.delenv("HAN_MUC_REDIS_URL", raising=False)
    monkeypatch.delenv("HAN_MUC_REDIS_TOKEN", raising=False)
    assert type(ns.tu_env()) is ns.NganSach


def test_tu_env_dat_thi_dung_kho_chung(monkeypatch):
    monkeypatch.setenv("HAN_MUC_REDIS_URL", "https://redis.gia")
    monkeypatch.setenv("HAN_MUC_REDIS_TOKEN", "t")
    monkeypatch.setenv("HAN_MUC_MUOI", "bi-mat-rieng-0123456789")
    assert isinstance(ns.tu_env(), ns.NganSachRedis)


def test_tu_env_thieu_muoi_bi_mat_thi_khong_bat(monkeypatch):
    """Review V3: không có muối bí mật riêng thì không gửi mã băm IP sang kho ngoài."""
    monkeypatch.setenv("HAN_MUC_REDIS_URL", "https://redis.gia")
    monkeypatch.setenv("HAN_MUC_REDIS_TOKEN", "t")
    monkeypatch.delenv("HAN_MUC_MUOI", raising=False)
    assert type(ns.tu_env()) is ns.NganSach


def test_tu_env_url_khong_https_thi_khong_bat(monkeypatch):
    monkeypatch.setenv("HAN_MUC_REDIS_URL", "http://redis.gia")      # khoá đi qua đường không mã hoá → từ chối
    monkeypatch.setenv("HAN_MUC_REDIS_TOKEN", "t")
    assert type(ns.tu_env()) is ns.NganSach


def test_bam_on_dinh_giua_tien_trinh_khi_co_muoi_chung(monkeypatch):
    monkeypatch.setenv("HAN_MUC_MUOI", "bi-mat-rieng-0123456789")
    assert ns._muoi() == b"bi-mat-rieng-0123456789" and ns.bam("1.2.3.4") == ns.bam("1.2.3.4")
    monkeypatch.setenv("HAN_MUC_REDIS_TOKEN", "t")
    a = ns.bam("1.2.3.4")
    monkeypatch.setenv("HAN_MUC_REDIS_TOKEN", "token-khac")
    assert ns.bam("1.2.3.4") == a     # biết token Redis cũng không dò được: muối không suy từ token
    monkeypatch.delenv("HAN_MUC_MUOI")
    assert ns._muoi() == ns._MUOI     # không có muối chung → ngẫu nhiên theo tiến trình như cũ


def test_bam_doi_theo_ngay(monkeypatch):
    import time as _t
    monkeypatch.setenv("HAN_MUC_MUOI", "bi-mat-rieng-0123456789")
    a = ns.bam("1.2.3.4")
    goc = _t.gmtime
    monkeypatch.setattr(ns.time, "gmtime", lambda *x: goc(_t.time() + 86400))
    assert ns.bam("1.2.3.4") != a


def test_khoa_khong_lo_trong_repr():
    r = RedisGia()
    r.hong = True
    a, _ = _hai_tien_trinh(r)
    a.xin(None)
    assert "bi-mat" not in repr(a)


def test_cau_dao_kho_loi_thi_ngat_mot_luc():
    """Review V1: kho lỗi → các lượt sau không gọi kho nữa trong 60 s (không cộng dồn thời gian chờ)."""
    r = RedisGia()
    r.hong = True
    a, _ = _hai_tien_trinh(r, gio_tong=50)
    a.xin(None)
    so = len(r.dau_xac_thuc)
    for _ in range(5):
        a.xin(None)
    assert len(r.dau_xac_thuc) == so


def test_vuot_tran_ma_tra_luot_loi_van_tu_choi():
    """Review V2: INCR đã báo vượt trần thì luôn từ chối, kể cả khi lệnh trả lượt (DECR) lỗi."""
    class HongKhiDecr(RedisGia):
        def __call__(self, req):
            if b"DECR" in req.content:
                return httpx.Response(500, json={"error": "hong"})
            return super().__call__(req)
    r = HongKhiDecr()
    a, _ = _hai_tien_trinh(r, gio_tong=1)
    assert a.xin(None) is None
    assert a.xin(None) == "tong_gio"


def test_expire_loi_khong_lam_hong_luot_dem():
    class KhongNX(RedisGia):
        def __call__(self, req):
            resp = super().__call__(req)
            ra = [({"error": "ERR syntax"} if json.loads(req.content)[i][0] == "EXPIRE" else x)
                  for i, x in enumerate(resp.json())]
            return httpx.Response(200, json=ra)
    r = KhongNX()
    a, b = _hai_tien_trinh(r, gio_tong=2)
    assert a.xin(None) is None and b.xin(None) is None and a.xin(None) == "tong_gio"
