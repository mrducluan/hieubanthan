# -*- coding: utf-8 -*-
"""TV-V2 — 4 route /v1/tuvi/{phi-hoa, nhip-3-thang, hop-tham, dinh-gio} theo hợp đồng docs/NANG-CAP-TUVI-V2.md
mục 3. Viết TRƯỚC route. Kiểm cả lời văn: không từ doạ, không lộ tên thư viện (BM-1)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

LA_SO = {"birth_date": "1990-05-15", "birth_time": "02:30", "gender": "nam"}
TU_DOA = ("báo động", "tử thần", "phá sản", "tai nạn", "bệnh", "chết", "tuyệt đối")
NOI_BO = ("iztro", "lasotuvi", "aov.cc", "TuViMCP")


def _post(duong: str, body: dict, ma: int = 200) -> dict:
    r = client.post(f"/v1/tuvi/{duong}", json=body)
    assert r.status_code == ma, r.text
    if ma == 200:
        van = r.text.lower()
        for tu in TU_DOA:
            assert tu not in van, (duong, tu)
        for tu in NOI_BO:
            assert tu.lower() not in van, (duong, tu)
    return r.json()


def test_phi_hoa():
    r = _post("phi-hoa", {"la_so": LA_SO, "nam_xem": 2026})
    assert r["engine_version"] and r["can_nam_sinh"] == "Canh"
    assert set(r["lai_nhan"]) == {"cung", "chi", "can"} and r["lai_nhan"]["can"] == "Canh"
    assert len(r["cung"]) == 12 and len(r["duong_bay"]) == 48
    d = r["duong_bay"][0]
    assert set(d) == {"tu_cung", "can", "hoa", "sao", "den_cung", "xung_cung", "tu_hoa", "den_tuan_triet", "nghia"}
    assert d["hoa"] in ("Lộc", "Quyền", "Khoa", "Kỵ")
    assert all(x["tu_hoa"] for x in r["tu_hoa"])
    assert all(x["den_cung"] == "Mệnh" for x in r["vao_menh"])
    assert len(r["noi_bat"]) <= 8
    assert r["luu_nien"]["nam"] == 2026 and r["luu_nien"]["can_chi"] == "Bính Ngọ" and len(r["luu_nien"]["hoa"]) == 4
    assert r["phai"]["ten"] and r["luu_y"] and r["trang_thai"]


def test_phi_hoa_khong_nam_xem_va_extra():
    r = _post("phi-hoa", {"la_so": LA_SO})
    assert r["luu_nien"] is None
    _post("phi-hoa", {"la_so": LA_SO, "la": 1}, 422)


def test_nhip_3_thang():
    r = _post("nhip-3-thang", {"la_so": LA_SO, "ngay_xem": "2026-10-19"})
    assert r["ngay_xem"] == "2026-10-19" and r["phai_luu_nguyet"] == "dau_quan_thai_tue"
    assert len(r["thang"]) == 3 and [t["thang"] for t in r["thang"]] == [9, 10, 11]
    assert set(r["luu_nien"]) >= {"nam_am", "can_chi", "tu_hoa"}
    for t in r["thang"]:
        assert {"thang", "nhuan", "phan", "can_chi", "tu", "den", "cung_goc", "chu_de", "muc", "nhan_muc",
                "ly_do", "tu_hoa_thang", "goi_y", "cau_tu_soi"} <= set(t)
    assert r["uu_tien"] and r["luu_y"]
    # đổi phái lưu nguyệt đi theo la_so
    r2 = _post("nhip-3-thang", {"la_so": {**LA_SO, "luu_nguyet": "dia_chi_thang"}, "ngay_xem": "2026-10-19"})
    assert r2["phai_luu_nguyet"] == "dia_chi_thang"


def test_hop_tham_mot_chieu():
    r = _post("hop-tham", {"la_so": LA_SO, "nguoi_kia": {"birth_date": "1985-02-15"}, "quan_he": "dong_nghiep"})
    assert r["can_nam_nguoi_kia"] == "Ất"           # âm lịch Việt: Tết Ất Sửu 21/01/1985
    assert r["quan_he"] == "dong_nghiep" and r["nhan_quan_he"]
    assert len(r["nguoi_kia_vao_ban"]) == 4
    assert r["ban_vao_nguoi_kia"] is None and r["menh_nguoi_kia_vao_ban"] is None
    assert r["khong_cham_diem"] is True and r["tom_tat"] and r["luu_y"]


def test_hop_tham_hai_chieu_va_mac_dinh():
    r = _post("hop-tham", {"la_so": LA_SO, "nguoi_kia": {"birth_date": "1992-08-21", "birth_time": "08:00",
                                                         "gender": "nu", "noi_sinh": "nuoc_ngoai"}})
    assert r["quan_he"] == "nguoi_yeu"
    assert len(r["ban_vao_nguoi_kia"]) == 4 and len(r["menh_nguoi_kia_vao_ban"]) == 4
    # thiếu nơi sinh → một chiều
    r = _post("hop-tham", {"la_so": LA_SO, "nguoi_kia": {"birth_date": "1992-08-21", "birth_time": "08:00",
                                                         "gender": "nu"}})
    assert r["ban_vao_nguoi_kia"] is None
    _post("hop-tham", {"la_so": LA_SO, "nguoi_kia": {"birth_date": "1992-08-21"}, "quan_he": "ke_thu"}, 422)
    _post("hop-tham", {"la_so": LA_SO, "nguoi_kia": {"birth_date": "1992-08-21", "ten": "A"}}, 422)


def test_hop_tham_ngay_am():
    r = _post("hop-tham", {"la_so": LA_SO, "nguoi_kia": {"birth_date": "1984-12-30", "calendar_type": "am"}})
    assert r["can_nam_nguoi_kia"] == "Giáp"


def test_dinh_gio_ba_ung_vien():
    r = _post("dinh-gio", {"la_so": {**LA_SO, "birth_time": "01:05"}, "nam_doi_chieu": [2022, 2024]})
    assert r["ly_do"] == ["gan_ranh_gio"]
    assert [u["nhan"] for u in r["ung_vien"]] == ["Giờ trước", "Giờ đã nhập", "Giờ sau"]
    assert [u["chi_gio"] for u in r["ung_vien"]] == ["Tý", "Sửu", "Dần"]
    assert [u["gio_dai_dien"] for u in r["ung_vien"]] == ["23:05", "01:05", "03:05"]
    assert r["ung_vien"][0]["dau_vao"] == {"birth_date": "1990-05-14", "birth_time": "23:05", "calendar_type": "duong"}
    u = r["ung_vien"][1]
    assert u["la_gio_nhap"] and u["khoang_gio"] == "01:00–02:59" and u["cuc"] and u["than_cu"]
    assert [n["nam"] for n in u["nam"]] == [2022, 2024] and u["nam"][0]["cau_hoi"]
    assert r["khac_nhau"] and r["luu_y"]


def test_dinh_gio_12_canh_va_mac_dinh_nam():
    r = _post("dinh-gio", {"la_so": {**LA_SO, "do_tin_gio": "unknown"}, "tat_ca_gio": True})
    assert len(r["ung_vien"]) == 12
    assert [u["chi_gio"] for u in r["ung_vien"]][:3] == ["Tý", "Sửu", "Dần"]
    assert sum(u["la_gio_nhap"] for u in r["ung_vien"]) == 1
    assert next(u for u in r["ung_vien"] if u["la_gio_nhap"])["gio_dai_dien"] == "02:30"
    assert "khong_biet" in r["ly_do"]
    assert len(r["nam_doi_chieu"]) == 3


@pytest.mark.parametrize("nam", [[2020, 2021, 2022, 2023], [1800]])
def test_dinh_gio_nam_sai(nam):
    _post("dinh-gio", {"la_so": LA_SO, "nam_doi_chieu": nam}, 422)


def test_cong_khai_khong_loc_nham():
    # Lớp BM-1 không được làm hỏng tên sao / cung / khoá JSON của các route mới
    r = _post("phi-hoa", {"la_so": LA_SO})
    assert {c["ten"] for c in r["cung"]} == {"Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
                                              "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Nữ", "Phu Thê", "Huynh Đệ"}
