# -*- coding: utf-8 -*-
"""NAM-1 (hướng A, chủ dự án duyệt 2026-10-30) — trang trụ "Năm {năm}": tổng quan năm, sinh con năm X hợp tuổi bố mẹ,
cưới năm X tuổi nào (Kim lâu theo tuổi mụ cô dâu). Golden tính tay theo lịch Hồ Ngọc Đức + bảng can chi:
2027 = Đinh Mùi, nạp âm Thiên Hà Thuỷ, Tết 06/02/2027, năm âm tới 25/01/2028, không nhuận; Mùi thuộc nhóm Hợi–Mão–Mùi
(Tam tai năm Tỵ, Ngọ, Mùi → năm thứ 3); Sửu xung Mùi; Ngọ lục hợp Mùi; năm thế giới 2+0+2+7 = 11."""
import json

import pytest

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


# ---- NAM-3 (2026-11-01): "Tử vi năm {nam} tuổi {can chi}" — một trang mỗi năm sinh, gộp nam + nữ mạng --------------
# Golden tính tay: 1990 Canh Ngọ, nạp âm Lộ Bàng Thổ; năm 2027 Đinh Mùi (Thiên Hà Thủy). Ngọ–Mùi lục hợp; can Đinh (Hoả)
# khắc Canh (Kim); Thổ (người) khắc Thủy (năm) → "bị khắc" xét từ năm. Tuổi mụ 38: sao nam Thổ Tú, nữ Vân Hán, hạn Ngũ
# Mộ (cả hai); Kim lâu không (38 % 9 = 2); Hoang ốc 38 → Ngũ Thọ Tử (xấu) → làm nhà "cân nhắc". Tứ hoá Đinh: Thái Âm Lộc,
# Thiên Đồng Quyền, Thiên Cơ Khoa, Cự Môn Kỵ.
def test_theo_tuoi_1990_nam_2027_golden():
    d = N.theo_tuoi(2027, 1990)
    assert d["nguoi"]["can_chi"] == "Canh Ngọ" and d["nguoi"]["nap_am"] == "Lộ Bàng Thổ" and d["tuoi_mu"] == 38
    assert d["quan_he"]["chi"] == "luc_hop" and d["quan_he"]["can"] == "khac" and d["quan_he"]["nap_am"] == "bị khắc"
    assert d["sao"]["nam"]["ten"] == "Thổ Tú" and d["sao"]["nu"]["ten"] == "Vân Hán"
    assert d["sao"]["nam"]["han"] == "Ngũ Mộ" and d["sao"]["nu"]["han"] == "Ngũ Mộ"
    assert d["sao"]["nam"]["viec"] and d["sao"]["nu"]["tu_soi"]
    assert d["lam_nha"]["thuan"] is False and "Ngũ Thọ Tử" in " ".join(d["lam_nha"]["xau"])
    assert d["kim_lau"] is None and d["tam_tai"] is None
    assert [x["sao"] for x in d["tu_hoa"]] == ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"]
    assert [x["hoa"] for x in d["tu_hoa"]] == ["Lộc", "Quyền", "Khoa", "Kỵ"]


def test_theo_tuoi_diem_nhan_va_loi():
    d = N.theo_tuoi(2027, 1990)
    dn = d["diem_nhan"]
    assert 3 <= len(dn) <= 6 and all(x["loai"] in ("thuan", "luu_y", "trung") for x in dn)
    assert dn[0]["loai"] == "thuan" and "lục hợp" in dn[0]["tieu_de"].lower()       # điểm thuận đứng đầu
    assert all(len(x["tieu_de"]) <= 60 for x in dn)
    assert "Canh Ngọ" in d["tra_loi_nhanh"] and "2027" in d["tra_loi_nhanh"] and len(d["tra_loi_nhanh"].split()) <= 90
    assert len(d["hoi_dap"]) >= 4
    _sach(d)


@pytest.mark.parametrize("ns", range(1960, 2006))
def test_theo_tuoi_moi_nam_sinh(ns):
    d = N.theo_tuoi(2027, ns)
    _sach(d)
    m = {"Mùi": "trung", "Sửu": "xung"}.get(d["nguoi"]["can_chi"].split()[1])
    if m:
        assert d["quan_he"]["chi"] == m
    if d["tam_tai"]:
        assert d["nguoi"]["can_chi"].split()[1] in ("Hợi", "Mão", "Mùi")
        assert any(x["loai"] == "luu_y" and "Tam tai" in x["tieu_de"] for x in d["diem_nhan"])


def test_theo_tuoi_trang_rieng_khac_nhau():
    """Hai năm sinh cùng con giáp vẫn khác nhau (can, nạp âm, tuổi mụ, sao) — tránh trang mỏng lặp nội dung."""
    a, b = N.theo_tuoi(2027, 1990), N.theo_tuoi(2027, 2002)
    assert a["nguoi"]["can_chi"].split()[1] == b["nguoi"]["can_chi"].split()[1] == "Ngọ"
    assert a["sao"]["nam"]["ten"] != b["sao"]["nam"]["ten"] and a["nguoi"]["nap_am"] != b["nguoi"]["nap_am"]


def test_api_theo_tuoi():
    r = client.get("/v1/nam/2027/tuoi/1990")
    assert r.status_code == 200 and r.json()["nguoi"]["can_chi"] == "Canh Ngọ"
    assert client.get("/v1/nam/2027/tuoi/2027").status_code == 422
    assert client.get("/v1/nam/2027/tuoi/1929").status_code == 422


def test_bang_con_giap_co_nam_sinh_trang():
    g = {r["chi"]: r for r in N.tong_quan(2027)["bang_con_giap"]}
    assert g["Ngọ"]["nam_sinh_trang"] == [1966, 1978, 1990, 2002]
    assert sum(len(r["nam_sinh_trang"]) for r in g.values()) == 46
    assert N.theo_tuoi(2027, 1997)["diem_nhan"][1]["tieu_de"] == "Năm Đinh trùng can tuổi bạn"


def test_kb_nam_khong_giong_ai():
    """AUD-11: chữ KB trang năm / năm theo tuổi không chứa cụm "giọng AI" của `cum_cam`.
    Bỏ các từ chuyên môn trùng danh sách (ngũ hành "khắc") — đó là thuật ngữ, không phải giọng văn."""
    from pathlib import Path

    data = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
    cum = json.loads((data / "tuvi_doi_song_kb.json").read_text(encoding="utf-8"))["cum_cam"]
    cum = [c.lower() for c in cum if c.lower() not in {"khắc"}]
    kb = json.loads((data / "nam_tong_quan_kb.json").read_text(encoding="utf-8"))

    def chu(o):
        if isinstance(o, str):
            yield o
        elif isinstance(o, dict):
            for v in o.values():
                yield from chu(v)
        elif isinstance(o, list):
            for v in o:
                yield from chu(v)

    loi = [(c, s[:80]) for s in chu(kb) for c in cum if c in s.lower()]
    assert loi == [], loi
