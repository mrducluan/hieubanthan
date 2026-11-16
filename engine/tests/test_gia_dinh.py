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
    assert ac and ac["quan_he"] == "tam_hop" and ac["loai"] in ("diem_sang", "hai_mat") and ac["nhom"] == "cha_me_con"
    de = cap.get(("d", "e")) or cap.get(("e", "d"))
    assert de and de["quan_he"] == "xung" and de["loai"] in ("nen_de_y", "hai_mat") and de["viec"]
    # GD-2: cặp có người dùng luôn hiện (kể cả con giáp không hợp không xung), kèm các lớp
    ab = cap.get(("a", "b")) or cap.get(("b", "a"))
    assert ab and ab["quan_he"] is None and {l["ma"] for l in ab["lop"]} >= {"chi", "menh", "can", "cung_phi"}
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


# ------------------------------------------------------------------ GD-2 (2026-11-16): nhiều lớp, lịch nhà, lá số của bạn
# Đối chiếu tay: 1990 Canh Ngọ = Lộ Bàng Thổ, 1992 Nhâm Thân = Kiếm Phong Kim → Thổ sinh Kim (thuận).
# Can Canh (Kim) – Nhâm (Thuỷ): Kim sinh Thuỷ → tương sinh (thuận). Ngọ – Thân: không hợp không xung (bình).
# Cung phi nam 1990 = Khảm, nữ 1992 = Đoài?  (không khoá tay — chỉ khoá rằng lớp có mặt và mức thuộc danh mục).
def test_gd2_lop_tung_cap():
    kq = G.bang(2027, NHA)
    cap = {frozenset((c["a"], c["b"])): c for c in kq["cap"]}
    ab = cap[frozenset(("a", "b"))]
    lop = {l["ma"]: l for l in ab["lop"]}
    assert lop["menh"]["muc"] == "thuan" and lop["can"]["muc"] == "thuan" and lop["chi"]["muc"] == "binh"
    assert all(l["muc"] in ("thuan", "binh", "de_y", "hai_mat") and l["y"] and l["nen"] and l["ten"] for l in ab["lop"])
    assert ab["nhip"] in ("thuan", "hai_mat", "de_y", "binh") and ab["tieu_de"] and ab["noi_dung"]
    assert ab["nhom"] == "vo_chong" and {m["mang"] for m in ab["mang"]} >= {"Tình cảm", "Tiền bạc", "Làm ăn chung"}
    # thiếu giới tính → không có lớp cung phi; thiếu ngày sinh → không có lớp trụ ngày / thần số
    k2 = G.bang(2027, [{"id": "a", "vai": "ban_than", "nam_sinh": 1990}, {"id": "b", "vai": "em", "nam_sinh": 1996}])
    ma = {l["ma"] for l in k2["cap"][0]["lop"]}
    assert "cung_phi" not in ma and "tru_ngay" not in ma and "than_so" not in ma


def test_gd2_lop_ngay_sinh():
    # 12/05/1990 = ngày Ất Mùi?  không khoá tay can chi; khoá: đủ ngày sinh hai người → có lớp trụ ngày + thần số,
    # và người có ngày sinh có năm cá nhân (mốc 1/1 dương như trang Hôm nay): 12+5+2027 → 1+2+5+2+0+2+7=19 → 1.
    kq = G.bang(2027, [{"id": "a", "vai": "ban_than", "nam_sinh": 1990, "ngay_sinh": "1990-05-12", "gioi_tinh": "nam"},
                       {"id": "b", "vai": "vo_chong", "nam_sinh": 1992, "ngay_sinh": "1992-08-20", "gioi_tinh": "nu"}])
    p = {x["id"]: x for x in kq["nguoi"]}
    assert p["a"]["nam_ca_nhan"]["so"] == 1 and p["a"]["nam_ca_nhan"]["chu_de"]
    assert p["a"]["nhat_chu"]["can"] and p["a"]["nap_am"]["ten"] == "Lộ Bàng Thổ"
    ma = {l["ma"] for l in kq["cap"][0]["lop"]}
    assert {"tru_ngay", "than_so"} <= ma


def test_gd2_lich_nha_5_nam():
    kq = G.bang(2027, NHA)
    ln = kq["lich_nha"]
    assert [r["nam"] for r in ln["nam"]] == [2027, 2028, 2029, 2030, 2031]
    # 2030 Canh Tuất: con 2018 (Tuất) năm tuổi; bố 1990 + mẹ 1966 (Ngọ, nhóm Dần Ngọ Tuất) Tam tai năm 3 (Thân Dậu Tuất)
    r30 = next(r for r in ln["nam"] if r["nam"] == 2030)
    theo = {(m["id"], m["ma"]) for m in r30["muc"]}
    assert ("c", "trung") in theo and ("a", "tam_tai") in theo and ("d", "tam_tai") in theo
    assert ln["goi_y"] and ln["ghi_chu"]
    # năm gợi ý (nếu có) phải là năm ít người lớn vướng nhất
    if ln["nam_nhe"]:
        it = min(r["so_nguoi_lon"] for r in ln["nam"])
        assert next(r for r in ln["nam"] if r["nam"] == ln["nam_nhe"])["so_nguoi_lon"] == it


def test_gd2_la_so_cua_ban_va_api():
    la = {"birth_date": "1990-05-12", "birth_time": "09:30", "gender": "nam", "noi_sinh": "ha-noi"}
    nha = [{**NHA[0], "ngay_sinh": "1990-05-12"}, *NHA[1:]]
    r = client.post("/v1/gia-dinh", json={"nam": 2027, "nguoi": nha, "la_so": la})
    assert r.status_code == 200, r.text
    ls = r.json()["la_so_cua_ban"]
    for mon in ("tuvi", "battu"):
        ch = {m["chuong"] for m in ls[mon]["mang"]}
        assert ch >= {"gia_dinh", "tinh_cam", "su_nghiep", "tien_bac"}
        assert all(m["tom_tat"] for m in ls[mon]["mang"])
    nn = {x["id"]: x for x in ls["nguoi_nha"]}
    assert set(nn) == {"b", "c", "d"} and all(1 <= len(x["dong"]) <= 3 and all(d["nghia"] for d in x["dong"]) for x in nn.values())
    # không gửi la_so → không có khối; lá số mà không có ban_than → 422
    assert client.post("/v1/gia-dinh", json={"nam": 2027, "nguoi": NHA}).json()["la_so_cua_ban"] is None
    assert client.post("/v1/gia-dinh", json={"nam": 2027, "nguoi": NHA[1:], "la_so": la}).status_code == 422
    for s in _chu({k: v for k, v in r.json().items() if k != "la_so_cua_ban"}):
        for c in CAM:
            assert c not in s.lower(), (c, s)
