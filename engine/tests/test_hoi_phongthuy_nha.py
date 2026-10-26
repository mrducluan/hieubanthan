# -*- coding: utf-8 -*-
"""Y6 (2026-10-26) — hỏi đáp Phong thuỷ đọc hồ sơ nhà người hỏi (hướng + bố cục gửi theo lượt, không lưu)."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app import nhat_ky
from app.hoidap import phongthuy as h
from app.main import app

client = TestClient(app)
NHA = {"huong": "Nam", "bo_cuc": {"loai_nha": "can_ho", "vi_tri": {"bep": "Đông Nam", "phong_ngu_chinh": "Bắc"},
                                  "dau_hieu": {"xa_ngang": {"co": True}, "bep_wc": {"co": True}, "guong_giuong": {"co": False}}}}
SINH = {"nam": 1990, "gioi_tinh": "nam", "ngay": None}


def _nha(kq):
    return next((m for m in kq["bang_chung"]["muc"] if m["loai"] == "nha_rieng"), None)


def test_cau_hoi_ve_bep_doc_dung_vi_tri_bep():
    kq = h.tra_loi("Bếp nhà tôi có sao không?", sinh=SINH, nha=NHA)
    m = _nha(kq)
    assert m and kq["bang_chung"]["muc"][0] is m and kq["phan_loai"]["theo_nha"]
    assert m["phong"][0] == {**m["phong"][0], "phong": "bep", "cung": "Đông Nam", "du_nien": "Sinh Khí", "theo": "menh", "hop": False}
    assert [d["ma"] for d in m["dau_hieu"]] == ["bep_wc"]               # dấu hiệu đã khai ở bếp, không kéo xà ngang vào
    assert "Bếp nhà bạn ở phía Đông Nam" in kq["cau_tra_loi"] and "chưa đúng cách sách dặn" in kq["cau_tra_loi"]


def test_khong_nam_sinh_thi_theo_trach_va_van_xin_nam_sinh():
    kq = h.tra_loi("Bếp nhà tôi có sao không?", nha=NHA)
    assert _nha(kq)["phong"][0]["theo"] == "trach" and kq["can_them"] == ["nam_sinh"]
    assert "theo trạch của nhà" in kq["cau_tra_loi"]


def test_dau_hieu_da_xu_ly_va_chua_khai():
    m = _nha(h.tra_loi("Gương đối diện giường có sao không?", nha=NHA))
    assert {d["ma"]: d["trang_thai"] for d in m["dau_hieu_hoi"]} == {"guong_giuong": "da_xu_ly"}
    m = _nha(h.tra_loi("Nhà vệ sinh ở giữa nhà có sao không?", nha=NHA))
    assert {d["ma"]: d["trang_thai"] for d in m["dau_hieu_hoi"]}.get("wc_giua_nha") == "chua_khai"


def test_nha_toi_chi_neu_dau_hieu_xu_ly_truoc_va_luat_can_ho():
    m = _nha(h.tra_loi("Nhà tôi có ổn không?", sinh=SINH, nha=NHA))
    assert [d["ma"] for d in m["dau_hieu"]] == ["xa_ngang"] and m["dau_hieu"][0]["veto"]
    assert m["dau_hieu"][0]["trang"] == "/phong-thuy/dau-hieu/giuong-ban-duoi-xa-ngang"
    assert [q["ma"] for q in m["quy_tac"]] == ["khong_dap_ket_cau"]
    assert m["cung_nhom"] is True


def test_cau_khong_lien_quan_nha_va_cau_dac_biet_khong_doi():
    a = h.tra_loi("Năm 2027 sửa nhà được không?", sinh=SINH, nha=NHA)
    b = h.tra_loi("Năm 2027 sửa nhà được không?", sinh=SINH)
    assert a["cau_tra_loi"] == b["cau_tra_loi"] and _nha(a) is None
    c = h.tra_loi("Bếp nhà tôi đặt vật phẩm chiêu tài gì?", nha=NHA)
    assert _nha(c) is None


def test_api_nhan_nha_va_khong_luu_cau_tra_loi():
    r = client.post("/v1/phongthuy/hoi", json={"cau_hoi": "Giường nhà tôi kê thế nào?",
                                                "sinh": {"birth_year": 1990, "gender": "nam"}, "nha": NHA})
    assert r.status_code == 200 and "Phòng ngủ chính nhà bạn ở phía Bắc" in r.json()["cau_tra_loi"]
    kq = h.tra_loi("Giường nhà tôi kê thế nào?", nha=NHA)
    assert nhat_ky.ban_ghi_huyenhoc("phongthuy", "Giường nhà tôi kê thế nào?", kq, False)["cau_tra_loi"] is None
    assert client.post("/v1/phongthuy/hoi", json={"cau_hoi": "Giường nhà tôi?", "nha": {"huong": "Giữa"}}).status_code == 422


# ---------------------------------------------------------------- Y4: việc 0 đồng tuần này
import datetime as _dt  # noqa: E402

from app.luangiai import phongthuy_bo_cuc as bc  # noqa: E402


def test_viec_tuan_uu_tien_veto_xoay_theo_tuan_va_tat_dinh():
    ds = ["guong_giuong", "xa_ngang", "wc_giua_nha", "minh_duong"]
    tuan = [bc.viec_tuan(ds, [], None, _dt.date(2026, 10, 26) + _dt.timedelta(weeks=i))["viec"]["ma"] for i in range(4)]
    assert set(tuan) == {"xa_ngang", "wc_giua_nha"}                     # còn veto → chỉ xoay trong veto
    assert tuan[0] != tuan[1]
    a = bc.viec_tuan(ds, [], None, _dt.date(2026, 10, 26))
    assert a == bc.viec_tuan(ds, [], None, _dt.date(2026, 11, 1))          # cả tuần (thứ Hai → Chủ nhật) một việc
    assert a["tu_ngay"] == "2026-10-26" and a["den_ngay"] == "2026-11-01" and a["tuan"] == "2026-W44"
    v = a["viec"]
    assert v["ma_mau"] == f"ds.phongthuy.viec_tuan.{v['ma']}" and v["trang"].startswith("/phong-thuy/dau-hieu/")
    assert v["lam"] == next(x["lam"] for x in bc.kb.bo_tri(v["ma"])["viec"] if x["chi_phi"] == "khong_ton")


def test_viec_tuan_bo_da_xu_ly_va_het_viec():
    r = bc.viec_tuan(["xa_ngang", "guong_giuong"], ["xa_ngang"], None, _dt.date(2026, 10, 26))
    assert r["viec"]["ma"] == "guong_giuong" and r["so_dau_hieu"] == 1
    assert bc.viec_tuan(["xa_ngang"], ["xa_ngang"], None, _dt.date(2026, 10, 26))["ly_do"] == "da_xu_ly_het"
    assert bc.viec_tuan([], [], None, _dt.date(2026, 10, 26))["ly_do"] == "chua_khai"
    assert bc.viec_tuan(["minh_duong"], [], None, _dt.date(2026, 10, 26))["viec"]["tot"] is True


def test_api_viec_tuan():
    r = client.post("/v1/phongthuy/viec-tuan", json={"dau_hieu": ["bep_wc"], "ngay_xem": "2026-10-28"})
    assert r.status_code == 200 and r.json()["viec"]["ma"] == "bep_wc"
    assert client.post("/v1/phongthuy/viec-tuan", json={"dau_hieu": ["khong_co"]}).status_code == 422


# ---------------------------------------------------------------- Y3: nhắc theo mùa của nhà (Web Push ngày giao tiết)
from app.luangiai import sang_nay  # noqa: E402


def test_nha_tiet_chi_ngay_giao_tiet_va_theo_thang_tiet_moi():
    giao = _dt.date(2026, 11, 7)                                         # Lập đông 2026 (giờ VN)
    assert any(m["ma"] == "tiet.225" for m in sang_nay.moc_lich(giao))
    a = sang_nay.nha_theo_tiet(giao, [{"huong": "Nam"}, {"huong_do": 181.0}, {}, {"huong": "Bắc"}])
    assert a[0] == a[1] and a[2] is None and a[3]["huong"] == "Bắc"
    assert a[0]["chi_thang"] == "Hợi" and a[0]["noi_dung"].startswith("Nhà hướng Nam, tháng Hợi phía cửa ")
    assert a[0]["duong"] == "/hom-nay#thang-nay-nha"
    assert sang_nay.nha_theo_tiet(_dt.date(2026, 11, 8), [{"huong": "Nam"}]) == [None]


def test_api_sang_nay_nhan_nha():
    r = client.post("/v1/push/sang-nay", json={"ngay_xem": "2026-11-07", "nha": [{"huong": "Đông"}]})
    assert r.status_code == 200 and r.json()["nha_tiet"][0]["huong"] == "Đông"
    r = client.post("/v1/push/sang-nay", json={"ngay_xem": "2026-11-08"})
    assert r.status_code == 200 and r.json()["nha_tiet"] == []
    assert client.post("/v1/push/sang-nay", json={"ngay_xem": "2026-11-07", "nha": [{"huong": "Giữa"}]}).status_code == 422
