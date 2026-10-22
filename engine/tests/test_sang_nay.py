"""KC-4 GĐ2 — "Sáng nay của bạn" + mốc lịch cho thông báo Web Push (viết TRƯỚC hàm).

Số tính tay, cùng mốc năm cá nhân 1/1 dương như Hôm nay (test_nhip_ca_nhan): sinh 12/5 → năm cá nhân 2026 = 9.
Mốc lịch: tiết (节) theo giờ Việt Nam — Kinh trập 2026 lúc 20:58 ngày 5/3 (giờ VN), Lập xuân 2027 lúc 08:46 ngày 4/2,
Tết Đinh Mùi 2027 = 6/2/2027 (âm lịch Việt, Hồ Ngọc Đức). Chỉ trả chữ do KB soạn + đường dẫn trong site; không lưu gì.
"""
import datetime as dt

from fastapi.testclient import TestClient

from app.luangiai.sang_nay import goi_sang_nay, moc_lich
from app.main import app


def test_ngay_thuong_khong_co_moc_lich():
    assert moc_lich(dt.date(2026, 10, 14)) == []


def test_giao_tiet_kinh_trap():
    ds = moc_lich(dt.date(2026, 3, 5))
    assert [m["ma"] for m in ds] == ["tiet.345"]
    m = ds[0]
    assert m["nhom"] == ["giao_tiet"]
    assert "Kinh trập" in m["tieu_de"] and "Mão" in m["noi_dung"]
    assert m["duong"].startswith("/") and not m["duong"].startswith("//")
    assert moc_lich(dt.date(2026, 3, 4)) == [] and moc_lich(dt.date(2026, 3, 6)) == []


def test_lap_xuan_thuoc_ca_hai_nhom_va_tet():
    lx = moc_lich(dt.date(2027, 2, 4))
    assert [m["ma"] for m in lx] == ["tiet.315"]
    assert set(lx[0]["nhom"]) == {"giao_tiet", "lap_xuan_tet"}
    tet = moc_lich(dt.date(2027, 2, 6))
    assert [m["ma"] for m in tet] == ["tet.2027"]
    assert tet[0]["nhom"] == ["lap_xuan_tet"] and "Đinh Mùi" in tet[0]["tieu_de"]


def test_sang_nay_theo_ngay_thang_sinh():
    k = goi_sang_nay(dt.date(2026, 10, 14), ["12-05"])
    r = k["theo_ngay_sinh"]["12-05"]
    assert r["so_ngay"] == 6                       # 9+10=19→1; ngày 14→5; 1+5 = 6
    assert "6" in r["tieu_de"] and r["noi_dung"]
    assert r["thang_moi"] is None                  # không phải ngày 1
    assert k["moc_lich"] == [] and k["ngay_xem"] == "2026-10-14"


def test_ngay_mot_bao_thang_ca_nhan_moi():
    r = goi_sang_nay(dt.date(2026, 11, 1), ["12-05"])["theo_ngay_sinh"]["12-05"]
    assert r["thang_moi"]["so"] == 2               # 9+11=20→2
    assert "2" in r["thang_moi"]["tieu_de"] and r["thang_moi"]["noi_dung"]


def test_ngay_sinh_sai_bi_bo_qua_va_29_02_hop_le():
    k = goi_sang_nay(dt.date(2026, 10, 14), ["31-02", "29-02", "1-5", "12-05"])
    assert set(k["theo_ngay_sinh"]) == {"29-02", "12-05"}


def test_cau_chu_khong_doa():
    cam = ["xui", "tai hoạ", "cẩn thận kẻo", "nguy hiểm", "hạn nặng", "giải hạn"]
    for d in [dt.date(2026, 3, 5), dt.date(2027, 2, 4), dt.date(2027, 2, 6), dt.date(2026, 11, 1)]:
        k = goi_sang_nay(d, ["12-05", "29-02"])
        chu = " ".join(m["tieu_de"] + " " + m["noi_dung"] for m in k["moc_lich"]) + " ".join(
            v["tieu_de"] + v["noi_dung"] + ((v["thang_moi"] or {}).get("noi_dung") or "") for v in k["theo_ngay_sinh"].values())
        assert not any(c in chu.lower() for c in cam)
    h = goi_sang_nay(dt.date(2026, 10, 14), [])["hoi_hom_qua"]
    assert "{ten}" in h["cau"] and set(h["nhip"]) == {"thuan", "trung_tinh", "can_nhac"}


def test_route():
    c = TestClient(app)
    r = c.post("/v1/push/sang-nay", json={"ngay_xem": "2026-11-01", "ngay_sinh": ["12-05"]})
    assert r.status_code == 200
    assert r.json()["theo_ngay_sinh"]["12-05"]["thang_moi"]["so"] == 2
    assert c.post("/v1/push/sang-nay", json={"ngay_xem": "2026-11-01", "ngay_sinh": ["x"]}).status_code == 422
    assert c.post("/v1/push/sang-nay", json={"ngay_xem": "2026-11-01", "ngay_sinh": ["01-01"] * 5001}).status_code == 422
    assert c.post("/v1/push/sang-nay", json={"ngay_xem": "2026-11-01", "ngay_sinh": [], "ho_ten": "A"}).status_code == 422
