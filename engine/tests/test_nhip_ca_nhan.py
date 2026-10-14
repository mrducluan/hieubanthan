"""NHIP-1 — nhịp cá nhân gọn cho thẻ "Chào lại" (trang chủ) và "/ban-than": ngày, tháng, tháng tới, năm, năm tới.
Số tính tay (mốc năm cá nhân 1/1 dương như trang đọc), viết TRƯỚC hàm."""
import datetime as dt

from fastapi.testclient import TestClient

from app.luangiai.nhip_ca_nhan import nhip_ca_nhan
from app.main import app

# Sinh 12/5/1988: rút gọn ngày 12→3, tháng 5, năm 2026→10→1 ⇒ năm cá nhân 2026 = 9; 2027 (11→2) ⇒ 3+5+2 = 10→1.
SINH = (12, 5, 1988)


def test_giua_nam():
    k = nhip_ca_nhan(*SINH, dt.date(2026, 10, 14))
    assert k["ngay_ca_nhan"]["so"] == 6          # tháng 10: 9+10=19→1; ngày 14→5; 1+5 = 6
    assert k["thang_ca_nhan"] == {**k["thang_ca_nhan"], "so": 1, "thang": 10, "nam": 2026}
    assert (k["thang_toi"]["so"], k["thang_toi"]["thang"], k["thang_toi"]["nam"]) == (2, 11, 2026)   # 9+11=20→2
    assert (k["nam_ca_nhan"]["so"], k["nam_ca_nhan"]["nam"]) == (9, 2026)
    assert k["nam_ca_nhan"]["con_ngay"] == 78     # 17 (tháng 10) + 30 + 31
    assert k["nam_ca_nhan"]["tong_ngay"] == 365
    assert nhip_ca_nhan(*SINH, dt.date(2028, 3, 1))["nam_ca_nhan"]["tong_ngay"] == 366
    assert (k["nam_toi"]["so"], k["nam_toi"]["nam"]) == (1, 2027)


def test_thang_12_sang_nam_moi():
    k = nhip_ca_nhan(*SINH, dt.date(2026, 12, 31))
    assert k["nam_ca_nhan"]["con_ngay"] == 0
    assert (k["thang_toi"]["so"], k["thang_toi"]["thang"], k["thang_toi"]["nam"]) == (2, 1, 2027)   # 1+1 = 2


def test_co_nghia_va_cau_tu_soi():
    k = nhip_ca_nhan(*SINH, dt.date(2026, 10, 14))
    assert k["ngay_ca_nhan"]["nghia"] and k["ngay_ca_nhan"]["tu_soi"]
    assert k["thang_toi"]["chu_de"] and k["nam_ca_nhan"]["chu_de"]
    assert "không dự báo" in k["luu_y"]


def test_route():
    c = TestClient(app)
    r = c.post("/v1/thanso/nhip", json={"ngay": 12, "thang": 5, "nam": 1988, "ngay_xem": "2026-10-14"})
    assert r.status_code == 200 and r.json()["ngay_ca_nhan"]["so"] == 6
    assert c.post("/v1/thanso/nhip", json={"ngay": 31, "thang": 2, "nam": 1990}).status_code == 422
