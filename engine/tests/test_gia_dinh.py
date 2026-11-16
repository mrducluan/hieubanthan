# -*- coding: utf-8 -*-
"""GD-1 đợt 1 (2026-11-16, chủ dự án duyệt) — "Bảng nhà mình": ghép các phép tính SẴN CÓ cho tối đa 8 người (vai + năm
sinh + giới tính, ngày sinh tuỳ chọn) theo một năm âm lịch. Viết TRƯỚC `luangiai/gia_dinh.py`.

Đối chiếu tay (năm Đinh Mùi 2027):
- Chồng 1990 (Canh Ngọ) · vợ 1992 (Nhâm Thân): Ngọ – Thân không hợp không xung → không thành cặp nổi bật.
- Con 2018 (Mậu Tuất): Ngọ – Tuất tam hợp (Dần Ngọ Tuất) → cặp bố – con là điểm sáng; Tuất – Mùi hình → con có ghi chú năm.
- Mẹ 1966 (Bính Ngọ) · Tý 1984 (Giáp Tý): Ngọ – Tý xung → cặp nên để ý.
- Tam tai năm Mùi: tuổi Thân Tý Thìn (Dần Mão Thìn là năm Tam tai của nhóm Thân Tý Thìn → năm Mùi KHÔNG) — nhóm Tỵ Dậu Sửu
  có Tam tai các năm Hợi Tý Sửu; nhóm Dần Ngọ Tuất: Thân Dậu Tuất; nhóm Hợi Mão Mùi: Tỵ Ngọ Mùi → tuổi Hợi/Mão/Mùi năm 2027
  là năm Tam tai thứ 3.
- Tuổi mụ 2027 của người 1990 = 38.
"""
import pytest
from fastapi.testclient import TestClient

from app.luangiai import gia_dinh as G
from app.main import app

client = TestClient(app)

NHA = [
    {"id": "a", "vai": "ban_than", "nam_sinh": 1990, "gioi_tinh": "nam"},
    {"id": "b", "vai": "vo_chong", "nam_sinh": 1992, "gioi_tinh": "nu"},
    {"id": "c", "vai": "con", "nam_sinh": 2018, "gioi_tinh": "nam"},
    {"id": "d", "vai": "me", "nam_sinh": 1966, "gioi_tinh": "nu"},
]
CAM = ("khắc", "xui", "đại hung", "giải hạn", "cúng", "vật phẩm", "bùa", "điểm", "sẽ bị", "chắc chắn", "tai hoạ")


def _chu(x) -> list[str]:
    if isinstance(x, str):
        return [x]
    if isinstance(x, dict):
        return [s for k, v in x.items() if k not in ("can_cu", "ma", "vai", "id", "loai", "duong") for s in _chu(v)]
    if isinstance(x, list):
        return [s for v in x for s in _chu(v)]
    return []


def test_tung_nguoi():
    kq = G.bang(2027, NHA)
    assert kq["nam"]["nam"] == 2027 and kq["nam"]["can_chi"] == "Đinh Mùi"
    p = {x["id"]: x for x in kq["nguoi"]}
    assert p["a"]["can_chi"] == "Canh Ngọ" and p["a"]["tuoi_mu"] == 38 and p["a"]["con_giap"] == "Ngọ"
    assert p["c"]["duoi_18"] is True and p["a"]["duoi_18"] is False
    assert p["a"]["sao_han"] and p["a"]["cung_phi"]["nhom"] in ("Đông tứ mệnh", "Tây tứ mệnh")
    # mỗi người đúng một việc nên làm trong năm, có chữ
    assert all(x["viec"] for x in kq["nguoi"])
    # trẻ dưới 18: lời là lời cho cha mẹ
    assert "con" in p["c"]["viec"].lower() or "bé" in p["c"]["viec"].lower()


def test_tam_tai_va_nam_tuoi():
    kq = G.bang(2027, [{"id": "x", "vai": "ban_than", "nam_sinh": 1999, "gioi_tinh": "nu"},     # Kỷ Mão → Tam tai năm 3
                       {"id": "y", "vai": "anh_chi", "nam_sinh": 1991, "gioi_tinh": "nam"},     # Tân Mùi → năm tuổi
                       {"id": "z", "vai": "em", "nam_sinh": 2001, "gioi_tinh": "nam"}])         # Tân Tỵ → không
    p = {x["id"]: x for x in kq["nguoi"]}
    assert p["x"]["tam_tai"] == 3 and p["y"]["tam_tai"] == 3 and p["z"]["tam_tai"] is None
    assert p["y"]["quan_he_nam"] == "trung" and p["x"]["quan_he_nam"] == "tam_hop"
    assert any(m["ma"] == "tam_tai" for m in kq["tom_tat"]["muc"])


def test_cap_noi_bat_va_lien_he():
    kq = G.bang(2027, [*NHA, {"id": "e", "vai": "anh_chi", "nam_sinh": 1984, "gioi_tinh": "nam"}])
    cap = {(c["a"], c["b"]): c for c in kq["cap"]}
    ac = cap.get(("a", "c")) or cap.get(("c", "a"))
    assert ac and ac["quan_he"] == "tam_hop" and ac["loai"] == "diem_sang" and ac["nhom"] == "cha_me_con"
    de = cap.get(("d", "e")) or cap.get(("e", "d"))
    assert de and de["quan_he"] == "xung" and de["loai"] == "nen_de_y" and de["viec"]
    assert ("a", "b") not in cap and ("b", "a") not in cap
    # cặp có người dùng đứng trước
    assert kq["cap"][0]["a"] == "a" or kq["cap"][0]["b"] == "a"


def test_huong_chung_va_viec_chung():
    kq = G.bang(2027, NHA)
    h = kq["huong"]
    assert set(h) >= {"chung", "nhom"} and all(x in ("Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc") for x in h["chung"])
    duong = [v["duong"] for v in kq["viec_chung"]]
    assert "/xem-ngay-tot" in duong[0] or any(d.startswith("/xem-ngay-tot") for d in duong)
    assert any(d.startswith("/xem-tuoi-lam-nha/2027/tuoi-") for d in duong)
    assert any(d.startswith("/tuoi-xong-dat/2027/tuoi-1990") for d in duong)


def test_khong_doa_khong_diem_khong_ten():
    kq = G.bang(2027, [*NHA, {"id": "e", "vai": "bo", "nam_sinh": 1960, "gioi_tinh": "nam"}])
    for s in _chu(kq):
        for c in CAM:
            assert c not in s.lower(), (c, s)
    assert "luu_y" in kq and "tập quán" in kq["luu_y"]


def test_thieu_gioi_tinh_va_ngay_sinh_truoc_tet():
    kq = G.bang(2027, [{"id": "a", "vai": "ban_than", "nam_sinh": 1990},
                       {"id": "b", "vai": "con", "nam_sinh": 2020, "ngay_sinh": "2020-01-10"}])   # trước Tết Canh Tý 25/01/2020
    p = {x["id"]: x for x in kq["nguoi"]}
    assert p["a"]["sao_han"] is None and p["a"]["cung_phi"] is None
    assert p["b"]["nam_am"] == 2019 and p["b"]["can_chi"] == "Kỷ Hợi"
    assert p["a"]["nam_am"] == 1990 and p["a"]["chi_nam_sinh_uoc_luong"] is True


def test_rang_buoc():
    with pytest.raises(ValueError):
        G.bang(2027, [{"id": str(i), "vai": "con", "nam_sinh": 2000} for i in range(9)])
    with pytest.raises(ValueError):
        G.bang(2027, [{"id": "a", "vai": "ban_than", "nam_sinh": 1990}, {"id": "b", "vai": "ban_than", "nam_sinh": 1991}])


def test_api():
    r = client.post("/v1/gia-dinh", json={"nam": 2027, "nguoi": NHA})
    assert r.status_code == 200, r.text
    assert len(r.json()["nguoi"]) == 4
    assert client.post("/v1/gia-dinh", json={"nguoi": NHA}).status_code == 200          # năm mặc định: năm âm hiện tại
    assert client.post("/v1/gia-dinh", json={"nguoi": [{**NHA[0], "ten": "Lan"}]}).status_code == 422   # không nhận tên
    assert client.post("/v1/gia-dinh", json={"nguoi": [{**NHA[0], "vai": "sep"}]}).status_code == 422
    assert client.post("/v1/gia-dinh", json={"nguoi": []}).status_code == 422
