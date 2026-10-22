# -*- coding: utf-8 -*-
"""Gói Sao "Bản đồ con số" (Luận giải toàn bộ thần số — chủ dự án chọn 2026-10-20): Tổng quan miễn phí (bạn hiếm cỡ nào,
số lặp, lời mời) + 3 chương mở bằng Sao: Nghịch lý bên trong · 12 tháng tới · Sự nghiệp & tiền bạc. RULES từ CALC + KB.

Ca Nguyễn Đức Luân 24/10/1988, rút gọn con số: DD 6 · SM 9 · LH 6 (Kết nối) · NC 3 (Biểu đạt); số ngày sinh 6;
đỉnh cao đang ở giai đoạn 2 (31–39 tuổi, số 5); năm cá nhân 2026 = 8; khép chu kỳ 2027, chuyển đỉnh 3 năm 2028.
"""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.calc import thanso_ty_le as tl
from app.luangiai import ban_do_con_so as bd
from app.main import app

LUAN = (["Nguyễn Đức Luân"], 24, 10, 1988)
NGAY = dt.date(2026, 10, 20)


def _bc(**kw):
    return bd.bao_cao(*LUAN, NGAY, quy_uoc="tung_phan", **kw)


def test_cau_truc_va_moi_xem():
    bc = _bc()
    assert bc["mo_dun"] == "thanso" and [c["ma"] for c in bc["chuong"]] == ["tong_quan", "nghich_ly", "muoi_hai_thang", "su_nghiep"]
    for c in bc["chuong"]:
        assert c["doan"] and c["moi_xem"]["cau_hoi"] and c["moi_xem"]["diem_nhan"]
        chu = " ".join(c["doan"])
        assert "Luân" not in chu and "1988" not in chu and "None" not in chu


def test_tong_quan_ban_hiem_co_nao():
    dau = " ".join(_bc()["chuong"][0]["doan"])
    t = tl.ty_le(24, 10, 1988, "tung_phan")
    assert f"Đường đời 6" in dau and f"{t['cap']['so_ngay']:,}".replace(",", ".") in dau
    assert "Số 6 xuất hiện 3 lần" in dau          # Đường đời 6 + Linh hồn 6 + Ngày sinh 24 → 6
    assert "Kết nối" in dau and "Biểu đạt" in dau  # lời mời chương bên trong/bên ngoài (chỉ nêu tên nhóm)
    assert "thiếu 3, 5, 6, 7" in dau and "không phải theo số người" in dau and "tháng then chốt" in dau


def test_nghich_ly():
    c = " ".join(_bc()["chuong"][1]["doan"])
    assert "Linh hồn 6" in c and "Nhân cách 3" in c and "Ấm áp và tự do" in c
    assert "Đường đời 6" in c and "Sứ mệnh 9" in c
    assert "Tâm linh" in c and "Gợi ý:" in c


def test_muoi_hai_thang():
    c = _bc()["chuong"][2]
    chu = " ".join(c["doan"])
    assert "Năm cá nhân 8" in chu and "10/2026" in chu and "9/2027" in chu and "10/2027" not in chu
    assert "giai đoạn 2/4" in chu and "2027" in chu
    assert "khởi sự việc mới: 11/2026" in chu and "tiền bạc, thăng tiến: 8/2027" in chu
    assert chu.count("Tháng then chốt — quan hệ, hợp tác") <= 2   # mỗi loại việc tối đa 2 tháng
    assert "Từ tháng 1/2027: năm cá nhân 9" in chu and "đầu năm dương lịch" in chu


def test_su_nghiep():
    chu = " ".join(_bc()["chuong"][3]["doan"])
    assert "giáo dục" in chu and "Sứ mệnh 9" in chu and "Nhân cách 3" in chu
    assert "Giai đoạn hiện tại 2/4 (tuổi 31–39" in chu and "Từ năm 2028 (tuổi 40): giai đoạn 3" in chu
    assert "Giai đoạn 1" not in chu and "8/2027" in chu   # chỉ giai đoạn hiện tại + kế tiếp; tháng tiền bạc


def test_moi_xem_rieng_va_khong_lo_ma_noi_bo():
    bc = _bc()
    m = {c["ma"]: c["moi_xem"] for c in bc["chuong"]}
    assert "Linh hồn 6 × Nhân cách 3" in m["nghich_ly"]["diem_nhan"]
    assert "Năm cá nhân 8" in m["muoi_hai_thang"]["diem_nhan"] and "năm cá nhân 8" in m["muoi_hai_thang"]["cau_hoi"]
    ngoc = bd.bao_cao(["Trần Thị Bích Ngọc"], 13, 4, 1985, NGAY, quy_uoc="tung_phan")
    chu = " ".join(" ".join(c["doan"]) for c in ngoc["chuong"])
    for ma in ("ngay_sinh", "duong_doi", "su_menh"):
        assert f"({ma})" not in chu
    assert chu.count("Nợ nghiệp 13") == 1 and "Nợ nghiệp 13 — ở Ngày sinh, Đường đời" in chu
    assert not any(d.rstrip().endswith("Gợi ý:") for c in ngoc["chuong"] for d in c["doan"])
    assert " ".join(ngoc["chuong"][2]["doan"]).count("năm 2027 (tuổi 42)") == 1   # gộp mốc cùng năm
    assert "cam kết lớn để từ 1/2027" in chu                           # năm 9 + tháng khởi sự → chuẩn bị


def test_tong_het_khac_so_va_ten_khong_chu():
    assert "Đường đời 33" in " ".join(bd.bao_cao(*LUAN, NGAY, quy_uoc="tong_het")["chuong"][0]["doan"])
    bc = bd.bao_cao(["123"], 24, 10, 1988, NGAY, quy_uoc="tung_phan")
    assert all(c["doan"] for c in bc["chuong"]) and "None" not in str(bc["chuong"])


def test_api():
    c = TestClient(app)
    body = {"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988, "ngay_xem": "2026-10-20",
            "quy_uoc_duong_doi": "tung_phan", "dien_dat_toi_da": 1}
    r = c.post("/v1/thanso/ban-do-con-so", json=body)
    assert r.status_code == 200 and len(r.json()["chuong"]) == 4
    assert c.post("/v1/thanso/ban-do-con-so", json={**body, "la": 1}).status_code == 422


# ------------------------------------------------------------------ tầng HỌC (rà 2026-10-22): như Tử vi / Bát tự đời sống
def _hop(bc: dict) -> list[dict]:
    return [h for c in bc["chuong"] for h in c["hop"]]


def test_hoc_mac_dinh_y_nguyen():
    assert _bc() == _bc(trong_so={}, ca_nhan={}) == _bc(trong_so=None, ca_nhan=None)


def test_hoc_gan_ty_le_va_ha_hop():
    goc = _bc()
    c0 = next(c for c in goc["chuong"] if c["ma"] == "su_nghiep" and len(c["hop"]) >= 2)
    ma0, ma1 = c0["hop"][0]["ma_mau"], c0["hop"][1]["ma_mau"]
    b = _bc(trong_so={ma0: {"dung": 30, "chua_dung": 90}, ma1: {"dung": 24, "chua_dung": 6}})
    c = next(c for c in b["chuong"] if c["ma"] == "su_nghiep")
    assert ma0 not in [h["ma_mau"] for h in c["hop"]]                     # 120 phiếu, 25% → "đang xem lại"
    assert f"Đang xem lại: {c0['hop'][0]['tieu_de']}" in c["can_cu"]
    h1 = next(h for h in c["hop"] if h["ma_mau"] == ma1)
    assert h1["ty_le_dung"] == 0.8 and h1["so_phieu"] == 30
    assert c["doan"] == c0["doan"]                                          # không đổi lời, không sinh câu mới
    for h in _hop(b) + b["cot_loi"]:
        assert not any(k.startswith("_") for k in h)


def test_hoc_ca_nhan_xuong_cuoi():
    goc = _bc()
    c0 = next(c for c in goc["chuong"] if len(c["hop"]) >= 2)
    ma0 = c0["hop"][0]["ma_mau"]
    b = _bc(ca_nhan={ma0: "chua_dung"})
    c = next(c for c in b["chuong"] if c["ma"] == c0["ma"])
    assert [h["ma_mau"] for h in c["hop"]] == [h["ma_mau"] for h in c0["hop"][1:]] + [ma0]


def test_api_trong_so_ca_nhan():
    c = TestClient(app)
    body = {"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988, "ngay_xem": "2026-10-20",
            "quy_uoc_duong_doi": "tung_phan"}
    goc = c.post("/v1/thanso/ban-do-con-so", json=body).json()
    ma0 = goc["chuong"][1]["hop"][0]["ma_mau"]
    r = c.post("/v1/thanso/ban-do-con-so", json={**body, "trong_so": {ma0: {"dung": 1, "chua_dung": 150}},
                                                  "ca_nhan": {ma0: "chua_dung"}})
    assert r.status_code == 200, r.text
    assert ma0 not in [h["ma_mau"] for h in r.json()["chuong"][1]["hop"]]
    for bad in ({"trong_so": {"MA SAI": {"dung": 1, "chua_dung": 1}}}, {"ca_nhan": {"ds.a.b": "co_le"}}):
        assert c.post("/v1/thanso/ban-do-con-so", json={**body, **bad}).status_code == 422
