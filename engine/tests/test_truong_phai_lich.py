# -*- coding: utf-8 -*-
"""TP-LICH — người dùng chọn âm lịch (Việt Nam / Trung Quốc) và trường phái ở MỌI mảng; engine tự tính lại.
Viết TRƯỚC hàm. Mặc định giữ nguyên kết quả cũ (không đổi ENGINE_VERSION).

Ngày mẫu hai lịch lệch nhau (Hồ Ngọc Đức UTC+7 vs UTC+8):
  25/09/1995 dương = 2/8 nhuận Ất Hợi (lịch Việt) nhưng 1/8 nhuận (lịch Trung Quốc).
  Tết Ất Sửu 1985: lịch Việt 21/01/1985, lịch Trung Quốc 20/02/1985 → sinh 01/02/1985 là năm Ất Sửu theo lịch Việt,
  Giáp Tý theo lịch Trung Quốc; Lập xuân 1985 ≈ 04/02 nên theo Lập xuân cũng là Giáp Tý (1984).
"""
import datetime as dt

from fastapi.testclient import TestClient

from app.calc import battu, kinhdich_maihoa as mh, phongthuy as pt
from app.main import app

c = TestClient(app)


# ---------------------------------------------------------------- đổi lịch hồ sơ
def test_doi_lich_am_sang_duong_theo_lich_chon():
    goc = {"chieu": "am_sang_duong", "ngay": 1, "thang": 8, "nam": 1995, "nhuan": True}
    viet = c.post("/v1/lich/doi", json=goc).json()
    trung = c.post("/v1/lich/doi", json={**goc, "lich": "trung"}).json()
    assert viet["duong"] == {"ngay": 24, "thang": 9, "nam": 1995} and viet["lich"] == "viet"
    assert trung["duong"] == {"ngay": 25, "thang": 9, "nam": 1995} and trung["lich"] == "trung"
    # luôn trả cả hai cách đọc âm lịch của ngày dương đó để người dùng đối chiếu
    assert trung["am_viet"] == {"ngay": 2, "thang": 8, "nam": 1995, "nhuan": True}
    assert trung["am_trung_quoc"] == {"ngay": 1, "thang": 8, "nam": 1995, "nhuan": True}
    assert trung["lech_lich_trung"] is True


# ---------------------------------------------------------------- Kinh Dịch Mai Hoa
def test_mai_hoa_theo_lich_chon():
    t = dt.datetime(1995, 9, 25, 10, 0)
    v, tq = mh.khoi_que_tu_thoi_diem(t), mh.khoi_que_tu_thoi_diem(t, lich="trung")
    assert v["dau_vao"]["ngay_am"] == 2 and v["dau_vao"]["lich"] == "viet"
    assert tq["dau_vao"]["ngay_am"] == 1 and tq["dau_vao"]["lich"] == "trung"
    assert (v["thuong"], v["ha"], v["hao_dong"]) != (tq["thuong"], tq["ha"], tq["hao_dong"])


def test_mai_hoa_api_nhan_lich():
    body = {"cau_hoi": "Tôi có nên nhận lời mời làm việc này không?", "cach_ra_que": "mai_hoa",
            "thoi_diem": "1995-09-25T10:00:00"}
    v = c.post("/v1/kinhdich/hoi", json=body)
    tq = c.post("/v1/kinhdich/hoi", json={**body, "lich": "trung"})
    assert v.status_code == 200 and tq.status_code == 200, tq.text
    assert v.json()["lich"] == "viet" and tq.json()["lich"] == "trung"
    assert v.json()["que"] != tq.json()["que"]


# ---------------------------------------------------------------- Phong thuỷ: mốc năm tính mệnh quái
def test_menh_quai_moc_nam():
    d = dt.date(1985, 2, 1)
    assert pt.menh_quai(1985, "nam", d)["nam_tinh"] == 1984                          # mặc định Lập xuân
    assert pt.menh_quai(1985, "nam", d, moc_nam="lap_xuan")["nam_tinh"] == 1984
    assert pt.menh_quai(1985, "nam", d, moc_nam="tet_viet")["nam_tinh"] == 1985
    assert pt.menh_quai(1985, "nam", d, moc_nam="tet_trung")["nam_tinh"] == 1984
    assert pt.menh_quai(1985, "nam", d, moc_nam="tet_viet")["moc_nam"] == "tet_viet"
    assert {pt.menh_quai(1985, "nu", dt.date(1985, 3, 1), moc_nam=m)["nam_tinh"]
            for m in ("lap_xuan", "tet_viet", "tet_trung")} == {1985}


def test_menh_quai_api_so_sanh_moc():
    r = c.post("/v1/phongthuy/menh-quai", json={"birth_date": "1985-02-01", "gender": "nam", "moc_nam": "tet_viet"}).json()
    assert r["moc_nam"] == "tet_viet" and r["nam_tinh"] == 1985
    ss = r["so_sanh_moc"]
    assert set(ss) == {"lap_xuan", "tet_viet", "tet_trung"} and r["moc_khac"] is True
    assert ss["lap_xuan"]["quai"] != ss["tet_viet"]["quai"]
    r2 = c.post("/v1/phongthuy/menh-quai", json={"birth_date": "1985-03-01", "gender": "nam"}).json()
    assert r2["moc_nam"] == "lap_xuan" and r2["moc_khac"] is False


# ---------------------------------------------------------------- Bát tự: giờ Tý 23:00–23:59
def test_battu_gio_ty_sang_ngay_doi_tru_ngay():
    t = dt.datetime(1990, 5, 17, 23, 30)
    da = battu.la_so(t, "nam")
    sang = battu.la_so(t, "nam", gio_ty="sang_ngay")
    hom_sau = battu.la_so(dt.datetime(1990, 5, 18, 0, 30), "nam")
    assert sang["tru"][2] == hom_sau["tru"][2] != da["tru"][2]       # trụ ngày = ngày hôm sau
    assert sang["tru"][3] == da["tru"][3]                            # trụ giờ như nhau (Tý của ngày sau)
    assert sang["gio_ty"] == "sang_ngay" and da["gio_ty"] == "da_ty"
    t2 = dt.datetime(1990, 5, 17, 10, 0)
    assert battu.la_so(t2, "nam", gio_ty="sang_ngay")["tru"] == battu.la_so(t2, "nam")["tru"]


def test_battu_api_gio_ty():
    goc = {"birth_date": "1990-05-17", "birth_time": "23:30", "gender": "nam", "noi_sinh": "ha-noi"}
    da = c.post("/v1/battu/la-so", json=goc).json()
    sang = c.post("/v1/battu/la-so", json={**goc, "gio_ty": "sang_ngay"}).json()
    assert da["gio_ty"] == "da_ty" and sang["gio_ty"] == "sang_ngay"
    assert da["tru"][2] != sang["tru"][2]
    assert any(f["loai"] == "gio_ty" for f in sang["co_canh_bao"])


def test_battu_hoi_dap_theo_gio_ty():
    goc = {"birth_date": "1990-05-17", "birth_time": "23:30", "gender": "nam", "noi_sinh": "ha-noi"}
    q = "Nhật chủ của tôi là gì?"
    da = c.post("/v1/battu/hoi", json={"cau_hoi": q, "la_so": goc}).json()
    sang = c.post("/v1/battu/hoi", json={"cau_hoi": q, "la_so": {**goc, "gio_ty": "sang_ngay"}}).json()
    assert da["la_so"]["gio_ty"] == "da_ty" and sang["la_so"]["gio_ty"] == "sang_ngay"
    assert da["la_so"]["nhat_chu"] != sang["la_so"]["nhat_chu"]
