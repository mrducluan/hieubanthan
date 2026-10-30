# -*- coding: utf-8 -*-
"""NAM-1 (hướng A, chủ dự án duyệt 2026-10-30) — trang trụ "Năm {năm}": tổng quan năm, sinh con năm X hợp tuổi bố mẹ,
cưới năm X tuổi nào (Kim lâu theo tuổi mụ cô dâu). Golden tính tay theo lịch Hồ Ngọc Đức + bảng can chi:
2027 = Đinh Mùi, nạp âm Thiên Hà Thuỷ, Tết 06/02/2027, năm âm tới 25/01/2028, không nhuận; Mùi thuộc nhóm Hợi–Mão–Mùi
(Tam tai năm Tỵ, Ngọ, Mùi → năm thứ 3); Sửu xung Mùi; Ngọ lục hợp Mùi; năm thế giới 2+0+2+7 = 11."""
import json

from fastapi.testclient import TestClient

from app.luangiai import nam_tong_quan as N
from app.main import app

client = TestClient(app)
CAM = ("đại hung", "chết", "tai hoạ", "tai họa", "xui xẻo", "giải hạn", "mất mạng", "bệnh nặng", "vật phẩm", "cúng sao",
       "dâng sao", "con số may mắn", "tuổi thọ", "đại hạn", "khắc chết", "sát phu", "điềm")


def _sach(o):
    s = json.dumps(o, ensure_ascii=False).lower()
    assert not any(c in s for c in CAM), [c for c in CAM if c in s]


def test_tong_quan_2027_golden():
    d = N.tong_quan(2027)
    assert d["can_chi"] == "Đinh Mùi" and d["con_giap"] == "Mùi"
    assert d["nap_am"]["ten"] == "Thiên Hà Thủy" and d["nap_am"]["hanh"] in ("Thủy", "Thuỷ")
    assert d["tet"] == "2027-02-06" and d["het_nam"] == "2028-01-25" and d["thang_nhuan"] == 0
    assert d["lap_xuan"] == "2027-02-04"
    assert d["so_nam_the_gioi"] == {"so": 11, "rut_gon": 2}
    assert d["nam_tuoi"] == "Mùi" and d["xung"] == "Sửu"
    assert d["tam_tai"] == {"tuoi": ["Hợi", "Mão", "Mùi"], "nam_thu": 3}
    g = {r["chi"]: r for r in d["bang_con_giap"]}
    assert len(g) == 12
    assert g["Mùi"]["quan_he"] == "trung" and g["Mùi"]["tam_tai"] == 3
    assert g["Sửu"]["quan_he"] == "xung" and g["Ngọ"]["quan_he"] == "luc_hop"
    assert g["Hợi"]["quan_he"] == "tam_hop" and g["Hợi"]["tam_tai"] == 3
    assert g["Thân"]["tam_tai"] is None
    # mỗi con giáp có năm sinh ví dụ đúng chi
    from app.calc import lunar
    for r in d["bang_con_giap"]:
        assert r["nam_sinh"] and all(lunar.can_chi_nam(n)[1] == r["chi"] for n in r["nam_sinh"])


def test_tong_quan_moc_le():
    d = N.tong_quan(2027)
    m = {x["ma"]: x for x in d["moc"]}
    assert m["tet"]["duong"] == "2027-02-06"
    assert m["ram_gieng"]["duong"] == "2027-02-20"
    assert m["giao_thua"]["duong"] == "2028-01-25"
    ngay = [x["duong"] for x in d["moc"]]
    assert ngay == sorted(ngay)


def test_tong_quan_tra_loi_va_hoi_dap():
    d = N.tong_quan(2027)
    assert "Đinh Mùi" in d["tra_loi_nhanh"] and "06/02/2027" in d["tra_loi_nhanh"]
    assert len(d["tra_loi_nhanh"].split()) <= 90
    hoi = [h["hoi"] for h in d["hoi_dap"]]
    assert any("con gì" in h for h in hoi) and any("mệnh gì" in h for h in hoi)
    assert d["han_nam"]["can_chi"] == "Đinh Mùi"
    _sach(d)


def test_tong_quan_nam_nhuan_2028():
    d = N.tong_quan(2028)                       # Mậu Thân, nhuận tháng 5
    assert d["can_chi"] == "Mậu Thân" and d["thang_nhuan"] == 5


def test_sinh_con_2027():
    d = N.sinh_con(2027)
    assert d["con"]["can_chi"] == "Đinh Mùi"
    assert d["truoc_tet"]["can_chi"] == "Bính Ngọ"             # sinh trước 06/02/2027
    bo = {x["nam_sinh"]: x for x in d["ds"]}
    assert bo[1995]["chi_quan_he"] == "tam_hop" and bo[1995]["nhom"] == "hop"
    assert bo[1990]["chi_quan_he"] == "luc_hop" and bo[1990]["nhom"] == "hop"
    assert bo[1997]["chi_quan_he"] == "xung" and bo[1997]["nhom"] == "luu_y"
    assert min(bo) == 1976 and max(bo) == 2006          # tuổi mụ bố mẹ 22–52
    assert {"Hợi", "Mão", "Ngọ"} <= set(d["chi_hop"]) and d["chi_xung"] == "Sửu"
    s = json.dumps(d, ensure_ascii=False)
    assert "bác sĩ" in s and "điểm" not in s.lower().replace("điểm tựa", "")
    _sach(d)


def test_cuoi_hoi_2027_kim_lau_co_dau():
    d = N.cuoi_hoi(2027)
    c = {x["nam_sinh"]: x for x in d["ds"]}
    assert c[1999]["tuoi_mu"] == 29 and c[1999]["kim_lau"] is None and c[1999]["duoc"]
    assert c[1998]["tuoi_mu"] == 30 and c[1998]["kim_lau"] == "Kim lâu Thê" and not c[1998]["duoc"]
    assert c[1995]["kim_lau"] == "Kim lâu Tử"
    assert c[1998]["nam_khong_pham"] == 2028                     # tuổi mụ 31 → 31 % 9 = 4
    assert min(c) == 1983 and max(c) == 2008
    assert "cô dâu" in d["tra_loi_nhanh"]
    _sach(d)


def test_api_nam():
    r = client.get("/v1/nam/2027")
    assert r.status_code == 200 and r.json()["can_chi"] == "Đinh Mùi"
    assert client.get("/v1/nam/2027/sinh-con").status_code == 200
    assert client.get("/v1/nam/2027/cuoi-hoi").status_code == 200
    assert client.get("/v1/nam/1999").status_code == 422           # bảng tuổi chỉ từ 2006
