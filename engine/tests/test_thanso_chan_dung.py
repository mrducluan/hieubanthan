# -*- coding: utf-8 -*-
"""TS-SAU — chân dung 4 mặt, dòng đời, đối chiếu năm biến cố, hợp đôi theo loại quan hệ."""
import datetime

import pytest
from fastapi.testclient import TestClient

from app.calc import thanso
from app.kb import thanso_v2 as kb
from app.luangiai import hop_doi as hd
from app.luangiai import thanso as lg
from app.main import app

SO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]
MAT = ("tong_quan", "tinh_cam", "cong_viec", "bien_co")
QH = ("nguoi_yeu", "ban_be", "dong_nghiep", "sep", "gia_dinh")
LUAN = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988}
KIA = {"ngay": 13, "thang": 5, "nam": 1990}
CAM = ("chắc chắn sẽ", "định mệnh", "số phận đã an bài", "chẩn đoán", "bệnh ", "tai nạn", "chết")


# --------------------------- KB đủ và sạch --------------------------- #
@pytest.mark.parametrize("so", SO)
def test_kb_chan_dung_du_4_mat(so):
    cd = kb.chan_dung(so)
    assert cd is not None and cd["source_id"] and cd["school_id"]
    for m in MAT:
        assert m in cd and all(v for v in cd[m].values()), (so, m)
    assert len(cd["tong_quan"]["diem_manh"]) >= 3 and len(cd["tong_quan"]["diem_mu"]) >= 2
    assert len(cd["cong_viec"]["nghe"]) >= 4


@pytest.mark.parametrize("so", range(1, 10))
def test_kb_quan_he_du_5_vai(so):
    for q in QH:
        v = kb.nguoi_trong_vai(so, q)
        assert v and {"vai", "can", "tranh", "cach_noi"} <= set(v), (so, q)


def test_so_cai_quy_ve_goc_khi_tra_vai():
    assert kb.nguoi_trong_vai(33, "sep")["vai"] == kb.nguoi_trong_vai(6, "sep")["vai"]
    assert kb.nguoi_trong_vai(11, "ban_be")["vai"] == kb.nguoi_trong_vai(2, "ban_be")["vai"]


def test_kb_khong_co_tu_tien_tri_hay_y_te():
    import json
    for f in ("chan_dung", "quan_he"):
        s = json.dumps(kb._doc(f), ensure_ascii=False).lower()
        for c in CAM:
            assert c not in s, (f, c)


def test_cap_so_trung_tinh_khong_mac_dinh_la_nguoi_yeu():
    import json
    s = json.dumps(kb._doc("cap_so")["cap"], ensure_ascii=False)
    for c in ("tổ ấm", "em/anh", "lãng mạn"):
        assert c not in s


# --------------------------- chân dung --------------------------- #
def test_luan_giai_co_chan_dung_ca_nhan_hoa():
    kq = lg.luan_giai(LUAN["ho_ten"], 24, 10, 1988)
    cd = kq["chan_dung"]
    cs = thanso.chi_so_xac_dinh("Nguyễn Đức Luân", 24, 10, 1988)
    assert cd["so_truc"] == cs["duong_doi"] == 33
    assert [m["ma"] for m in cd["mat"]] == list(MAT)
    # mỗi mặt có lớp riêng từ chỉ số khác (linh hồn / sứ mệnh / thử thách) — không chỉ đường đời
    tc = next(m for m in cd["mat"] if m["ma"] == "tinh_cam")
    assert any(f"Linh hồn {cs['linh_hon']}" in x["nhan"] for x in tc["lop_them"])
    cv = next(m for m in cd["mat"] if m["ma"] == "cong_viec")
    assert any(f"Sứ mệnh {cs['su_menh']}" in x["nhan"] for x in cv["lop_them"])
    assert cd["nguon"] and cd["trang_thai"] == "nhap_ai"


def test_dong_doi_co_nghia_va_nhan_moc():
    kq = lg.luan_giai(LUAN["ho_ten"], 24, 10, 1988)
    dd = kq["chieu_sau"]["dong_doi"]
    assert len(dd["giai_doan"]) == 4
    for g in dd["giai_doan"]:
        assert g["nghia"] and g["nghia_thu_thach"]
    assert dd["buoc_ngoat"] and all(b["nhan"] for b in dd["buoc_ngoat"])
    assert dd["hien_tai"]["nam"] == datetime.date.today().year


# --------------------------- đối chiếu năm --------------------------- #
def test_api_doi_chieu_nam():
    c = TestClient(app)
    r = c.post("/v1/thanso/doi-chieu-nam", json={"ngay": 24, "thang": 10, "nam": 1988, "cac_nam": [2019, 2010]})
    assert r.status_code == 200
    ds = r.json()["cac_nam"]
    assert [x["nam"] for x in ds] == [2019, 2010]
    x = ds[0]
    assert x["nam_ca_nhan"] == 1 and x["nghia_nam"]["hay_gap"]
    assert x["nghia_dinh"]["chu_de"] and x["nhan_moc"]
    assert "cach_doc" in r.json()
    # năm trước khi sinh / quá nhiều năm → 422
    assert c.post("/v1/thanso/doi-chieu-nam", json={"ngay": 24, "thang": 10, "nam": 1988, "cac_nam": [1970]}).status_code == 422
    assert c.post("/v1/thanso/doi-chieu-nam", json={"ngay": 24, "thang": 10, "nam": 1988, "cac_nam": list(range(1990, 2003))}).status_code == 422


# --------------------------- hợp đôi theo quan hệ --------------------------- #
@pytest.mark.parametrize("q", QH)
def test_hop_doi_theo_quan_he_khac_nhau(q):
    kq = hd.luan_hop_doi(LUAN, KIA, quan_he=q)
    assert kq["quan_he"]["ma"] == q and kq["quan_he"]["trong_tam"]
    assert kq["trong_vai"]["b"]["vai"] == kb.nguoi_trong_vai(thanso.duong_doi(13, 5, 1990), q)["vai"]
    assert kq["trong_vai"]["a"]["vai"]


def test_hop_doi_sep_ban_la_nhan_vien():
    kq = hd.luan_hop_doi(LUAN, KIA, quan_he="sep")
    assert kq["trong_vai"]["a"]["vai_cua_ban"] == "dong_nghiep"
    assert kq["trong_vai"]["b"]["vai_cua_ban"] == "sep"


def test_hop_doi_noi_dung_doi_theo_quan_he():
    a = hd.luan_hop_doi(LUAN, KIA, quan_he="nguoi_yeu")
    b = hd.luan_hop_doi(LUAN, KIA, quan_he="dong_nghiep")
    assert a["trong_vai"] != b["trong_vai"] and a["quan_he"]["tieu_de"] != b["quan_he"]["tieu_de"]


def test_hop_doi_nhip_nam_hai_nguoi():
    kq = hd.luan_hop_doi(LUAN, KIA, quan_he="ban_be", nam_xem=2026)
    nn = kq["nhip_nam"]
    assert nn["nam"] == 2026
    assert nn["a"]["so"] == thanso.nam_ca_nhan(24, 10, 2026, "duong_lich")
    assert nn["b"]["so"] == thanso.nam_ca_nhan(13, 5, 2026, "duong_lich")
    assert nn["a"]["chu_de"] and nn["b"]["chu_de"]


def test_hop_doi_tu_chi_so_khong_co_nhip_nam():
    cs_a = thanso.chi_so_xac_dinh("Nguyễn Đức Luân", 24, 10, 1988)
    kq = hd.luan_hop_doi_tu_chi_so(cs_a, {"duong_doi": 5}, quan_he="gia_dinh")
    assert kq.get("nhip_nam") is None and kq["quan_he"]["ma"] == "gia_dinh"


def test_api_hop_doi_quan_he():
    c = TestClient(app)
    r = c.post("/v1/thanso/hop-doi", json={"a": LUAN, "b": KIA, "quan_he": "sep"})
    assert r.status_code == 200 and r.json()["quan_he"]["ma"] == "sep"
    assert c.post("/v1/thanso/hop-doi", json={"a": LUAN, "b": KIA}).json()["quan_he"]["ma"] == "nguoi_yeu"
    assert c.post("/v1/thanso/hop-doi", json={"a": LUAN, "b": KIA, "quan_he": "ke_thu"}).status_code == 422
    r2 = c.post("/v1/thanso/cap-so", json={"a": {"duong_doi": 33}, "b": {"duong_doi": 5}, "quan_he": "ban_be"})
    assert r2.status_code == 200 and r2.json()["quan_he"]["ma"] == "ban_be"
