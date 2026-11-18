# -*- coding: utf-8 -*-
"""UI-HHT (chủ dự án 2026-11-18) — trang "hướng hợp tuổi" lấy đủ tri thức engine đã có: thứ hạng 4 hướng tốt, câu
đời thường + câu sách của từng du niên, khoảng độ 24 sơn, chín điều sách dặn (CHỈ nhóm A/B — trang công khai không biết
tuổi người đọc), vợ chồng khác nhóm, phòng vệ sinh / bàn thờ, hướng kiêng của năm chồng lên hướng tốt (chỉ thời điểm),
và tra hướng chung hai người. Test viết TRƯỚC hàm. Không phép tính mới: đúng `pt.bang_huong` / `pt.menh_quai` / `pt.sao_nam`."""
from fastapi.testclient import TestClient

from app.calc import phongthuy as pt
from app.luangiai import phongthuy_cung_chi_tiet as ct
from app.luangiai import phongthuy_tuoi as pt_tuoi
from app.main import app

client = TestClient(app)


def test_tam_huong_thu_hang_va_do():
    c = ct.chi_tiet("Khảm", 2027)
    hs = c["huong"]
    assert len(hs) == 8 and [h["hang"] for h in hs[:4]] == [1, 2, 3, 4] and all(h["hang"] is None for h in hs[4:])
    bang = pt.bang_huong("Khảm")
    for h in hs:
        assert bang[h["huong"]] == h["du_nien"] and h["cat"] == (h["du_nien"] in pt.CAT)
        assert h["mot_cau"] and len(h["son"]) == 3
    bac = next(h for h in hs if h["huong"] == "Bắc")
    assert bac["son"] == ["Nhâm", "Tý", "Quý"] and bac["do"] == {"tu": 337.5, "den": 22.5}
    dn = next(h for h in hs if h["huong"] == "Đông Nam")
    assert dn["son"] == ["Thìn", "Tốn", "Tỵ"] and dn["do"] == {"tu": 112.5, "den": 157.5}
    # Sinh Khí có câu sách nguyên văn
    assert hs[0]["du_nien"] == "Sinh Khí" and hs[0]["sach"]["han"]


def test_chin_dieu_chi_nhom_a_b():
    for q in pt.QUAI:
        k = ct.chi_tiet(q, 2027)["cung_menh"]
        assert k and k["so_muc"] >= 1
        for n in k["nhom"]:
            for m in n["muc"]:
                assert m["nhom"] in ("A", "B")


def test_nam_nay_chi_la_thoi_diem():
    c = ct.chi_tiet("Khảm", 2027)["nam_nay"]
    sn = pt.sao_nam(2027)
    assert c["nam"] == 2027 and c["ngu_hoang"] == sn["ngu_hoang"]
    tot = {h for h, d in pt.bang_huong("Khảm").items() if d in pt.CAT}
    for t in c["trung"]:
        assert t["huong"] in tot and t["sao"]
    assert "không đổi" in c["loi"]
    # 2027: Ngũ Hoàng ở Bắc = Phục Vị của Khảm → phải báo
    assert any(t["huong"] == "Bắc" and "Ngũ Hoàng" in t["sao"] for t in c["trung"])


def test_phong_khac_va_vo_chong():
    c = ct.chi_tiet("Ly", 2027)
    ma = {p["ma"] for p in c["phong_khac"]}
    assert ma == {"ve_sinh", "ban_tho"}
    xau = {h for h, d in pt.bang_huong("Ly").items() if d not in pt.CAT}
    vs = next(p for p in c["phong_khac"] if p["ma"] == "ve_sinh")
    assert set(vs["huong"]) <= xau
    assert c["vo_chong"]["han"] and c["vo_chong"]["cach_lam"]
    assert "5" in c["nam_nu"]["so_5"]


def test_cung_phi_mang_chi_tiet_khi_ban_viet():
    r = client.get("/v1/phongthuy/cung-phi/cung-kham-bac?nam_xem=2027").json()
    assert r["bo_sung_cung"]["nam_nay"]["nam"] == 2027
    assert r["thong_tin"]["tinh_chat"]
    r2 = client.get("/v1/phongthuy/cung-phi/cung-kham-bac?nam_xem=2027", headers={"x-ngon-ngu": "en"}).json()
    assert r2.get("bo_sung_cung") is None


def test_hai_cung_chung_va_lech():
    # 1990: nam Khảm (Đông), nữ Cấn (Tây) → không chung hướng tốt
    h = ct.hai_cung(1990, "nam", 1990, "nu")
    assert [x["quai"] for x in h["nguoi"]] == ["Khảm", "Cấn"] and not h["cung_nhom"] and h["huong_chung"] == []
    assert h["sach"]["han"] and len(h["huong"]) == 8
    for x in h["huong"]:
        assert x["du_nien_a"] == pt.bang_huong("Khảm")[x["huong"]] and x["du_nien_b"] == pt.bang_huong("Cấn")[x["huong"]]
    # cùng nhóm Đông: Khảm + Ly → chung 4 hướng
    h2 = ct.hai_cung(1990, "nam", 1991, "nam")
    q2 = pt.menh_quai(1991, "nam")["quai"]
    if pt.nhom(q2) == "Đông tứ mệnh":
        assert h2["cung_nhom"] and len(h2["huong_chung"]) == 4


def test_api_hai_cung():
    r = client.post("/v1/phongthuy/hai-cung", json={"a": {"nam": 1990, "gioi_tinh": "nam"}, "b": {"nam": 1992, "gioi_tinh": "nu"}})
    assert r.status_code == 200 and len(r.json()["nguoi"]) == 2
    assert client.post("/v1/phongthuy/hai-cung", json={"a": {"nam": 1800, "gioi_tinh": "nam"},
                                                       "b": {"nam": 1992, "gioi_tinh": "nu"}}).status_code == 422
    assert pt_tuoi.NAM_DAU == 1960
