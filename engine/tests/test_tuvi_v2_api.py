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
        # NHIP-2: lời riêng từng tháng + học thuật tách sang can_cu
        assert {"nhan_thang", "tieu_de_thang", "chu_de_thang", "hop", "can_cu", "diem_sang", "de_y",
                "noi_tiep"} <= set(t)
    assert len({t["tieu_de_thang"] for t in r["thang"]}) == 3 and len({t["goi_y"] for t in r["thang"]}) == 3
    assert r["tom_tat_3_thang"] and len(r["cung"]) == 12
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


# ---- định giờ: khoảng giờ đồng hồ khi đồng hồ nơi sinh lệch kinh tuyến lịch ----
NAM_1965 = {"birth_date": "1965-03-10", "birth_time": "06:30", "gender": "nam", "noi_sinh": "tp-ho-chi-minh"}


def test_dinh_gio_khoang_dong_ho_mac_dinh_khong_lech():
    r = _post("dinh-gio", {"la_so": LA_SO, "nam_doi_chieu": [2024]})
    for u in r["ung_vien"]:
        assert u["khoang_gio_dong_ho"] == u["khoang_gio"] and u["lech_gio_lich"] is False


def test_dinh_gio_mien_nam_1965_utc8():
    r = _post("dinh-gio", {"la_so": NAM_1965, "nam_doi_chieu": [2024]})
    t, n, s = r["ung_vien"]
    assert n["la_gio_nhap"] and n["chi_gio"] == "Mão" and n["gio_dai_dien"] == "06:30"
    assert n["khoang_gio"] == "05:00–06:59" and n["khoang_gio_dong_ho"] == "06:00–07:59" and n["lech_gio_lich"]
    assert t["chi_gio"] == "Dần" and t["khoang_gio_dong_ho"] == "04:00–05:59"
    assert s["chi_gio"] == "Thìn" and s["khoang_gio_dong_ho"] == "08:00–09:59"


def test_dinh_gio_mien_nam_1965_12_canh():
    r = _post("dinh-gio", {"la_so": NAM_1965, "nam_doi_chieu": [2024], "tat_ca_gio": True})
    uv = r["ung_vien"]
    assert len(uv) == 12 and sum(u["la_gio_nhap"] for u in uv) == 1
    by = {u["chi_gio"]: u for u in uv}
    assert by["Mão"]["la_gio_nhap"] and by["Mão"]["gio_dai_dien"] == "06:30"
    assert by["Thìn"]["gio_dai_dien"] == "09:00" and by["Thìn"]["khoang_gio_dong_ho"] == "08:00–09:59"
    assert by["Tý"]["gio_dai_dien"] == "01:30" and by["Tý"]["khoang_gio_dong_ho"] == "01:00–01:59"
    assert all(u["dau_vao"]["birth_date"] == "1965-03-10" for u in uv)
    assert all(u["lech_gio_lich"] for u in uv)


def test_dinh_gio_12_canh_cung_ngay_ty_giua_canh():
    r = _post("dinh-gio", {"la_so": LA_SO, "nam_doi_chieu": [2024], "tat_ca_gio": True})
    uv = r["ung_vien"]
    assert [u["gio_dai_dien"] for u in uv] == ["00:30", "02:30"] + [f"{2 * i:02d}:00" for i in range(2, 12)]
    assert all(u["dau_vao"]["birth_date"] == "1990-05-15" for u in uv)
    assert uv[0]["khoang_gio"] == "00:00–00:59"


def test_dinh_gio_23h30_tat_ca_gio_them_ty_muon():
    r = _post("dinh-gio", {"la_so": {**LA_SO, "birth_time": "23:30"}, "nam_doi_chieu": [2024], "tat_ca_gio": True})
    uv = r["ung_vien"]
    assert len(uv) == 13
    assert [u["chi_gio"] for u in uv[:12]] == list(("Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân",
                                                    "Dậu", "Tuất", "Hợi"))
    som, muon = uv[0], uv[12]
    assert som["gio_dai_dien"] == "00:30" and som["la_gio_nhap"] is False
    assert muon["nhan"] == "Giờ Tý muộn (23:00–23:59)" and muon["chi_gio"] == "Tý"
    assert muon["gio_dai_dien"] == "23:30" and muon["la_gio_nhap"] is True
    assert muon["khoang_gio"] == "23:00–23:59" and "ngày hôm sau" in muon["ghi_chu"]
    assert sum(u["la_gio_nhap"] for u in uv) == 1
    assert all(u["dau_vao"]["birth_date"] == "1990-05-15" for u in uv)
    # ±1 canh (mặc định) giữ nguyên: 3 ứng viên, giờ đã nhập là 23:30
    r = _post("dinh-gio", {"la_so": {**LA_SO, "birth_time": "23:30"}, "nam_doi_chieu": [2024]})
    assert [u["gio_dai_dien"] for u in r["ung_vien"]] == ["21:30", "23:30", "01:30"]
    assert "ghi_chu" not in r["ung_vien"][1]


# ---- định giờ: ngày theo giờ ĐỒNG HỒ + Tý muộn/sớm theo đồng hồ khi lệch giờ lịch + lý do lệch ----
def test_dinh_gio_ngay_duong_va_ly_do_lech_mac_dinh():
    r = _post("dinh-gio", {"la_so": {**LA_SO, "birth_time": "01:05"}, "nam_doi_chieu": [2024]})
    assert r["ly_do_lech"] is None
    assert [u["ngay_duong"] for u in r["ung_vien"]] == ["1990-05-14", "1990-05-15", "1990-05-15"]
    assert all(u["ngay_duong"] == u["dau_vao"]["birth_date"] for u in r["ung_vien"])


def test_dinh_gio_mien_nam_00h30_12_canh_theo_ngay_dong_ho():
    # 00:30 đồng hồ Sài Gòn 10/03/1965 (UTC+8) = 23:30 ngày 09/03 theo giờ lịch: Tý muộn của ngày hôm trước,
    # Tử vi tính sang ngày hôm sau → đúng ngày người dùng nhập. 12 canh phải là của NGÀY ĐÃ NHẬP theo đồng hồ.
    r = _post("dinh-gio", {"la_so": {**NAM_1965, "birth_time": "00:30"}, "nam_doi_chieu": [2024],
                           "tat_ca_gio": True})
    uv = r["ung_vien"]
    assert r["ly_do_lech"] == "mui_gio_lich_su"
    assert len(uv) == 12 and sum(u["la_gio_nhap"] for u in uv) == 1
    assert all(u["ngay_duong"] == "1965-03-10" for u in uv)
    ty = uv[0]
    assert ty["chi_gio"] == "Tý" and ty["la_gio_nhap"] and ty["gio_dai_dien"] == "00:30"
    assert ty["khoang_gio"] == "23:00–23:59" and ty["khoang_gio_dong_ho"] == "00:00–00:59"
    assert ty["nhan"] == "Giờ Tý muộn (00:00–00:59)"
    assert "ngày hôm sau" in ty["ghi_chu"] and "23:30 ngày 09/03/1965" in ty["ghi_chu"]
    assert "23:00–23:59" not in ty["nhan"]
    assert uv[11]["chi_gio"] == "Hợi" and uv[11]["gio_dai_dien"] == "23:00"
    # Lá Tý muộn hôm trước (giờ lịch) trùng lá Tý sớm của ngày đã nhập
    r2 = _post("dinh-gio", {"la_so": {**NAM_1965, "birth_time": "01:30"}, "nam_doi_chieu": [2024]})
    som = r2["ung_vien"][1]
    assert som["chi_gio"] == "Tý" and (som["cung_menh"], som["cuc"]) == (ty["cung_menh"], ty["cuc"])


def test_dinh_gio_mien_nam_23h30_khong_them_ty_muon():
    # 23:30 đồng hồ UTC+8 = 22:30 giờ lịch = giờ Hợi → không có ứng viên thứ 13
    r = _post("dinh-gio", {"la_so": {**NAM_1965, "birth_time": "23:30"}, "nam_doi_chieu": [2024],
                           "tat_ca_gio": True})
    uv = r["ung_vien"]
    assert len(uv) == 12 and all(u["ngay_duong"] == "1965-03-10" for u in uv)
    assert next(u for u in uv if u["la_gio_nhap"])["chi_gio"] == "Hợi"


def test_dinh_gio_mien_nam_00h30_ba_ung_vien_co_ngay():
    r = _post("dinh-gio", {"la_so": {**NAM_1965, "birth_time": "00:30"}, "nam_doi_chieu": [2024]})
    t, n, s = r["ung_vien"]
    assert [u["ngay_duong"] for u in (t, n, s)] == ["1965-03-09", "1965-03-10", "1965-03-10"]
    assert n["nhan"] == "Giờ đã nhập" and n["khoang_gio_dong_ho"] == "00:00–00:59"


def test_dinh_gio_nuoc_ngoai_ly_do_lech():
    nn = {"birth_date": "1990-07-15", "birth_time": "00:30", "gender": "nu", "noi_sinh": "nuoc_ngoai"}
    r = _post("dinh-gio", {"la_so": {**nn, "gio_mua_he": True}, "nam_doi_chieu": [2024], "tat_ca_gio": True})
    assert r["ly_do_lech"] == "gio_mua_he"
    uv = r["ung_vien"]
    assert len(uv) == 12 and all(u["ngay_duong"] == "1990-07-15" for u in uv)
    assert uv[0]["la_gio_nhap"] and uv[0]["nhan"] == "Giờ Tý muộn (00:00–00:59)"
    r = _post("dinh-gio", {"la_so": nn, "nam_doi_chieu": [2024]})
    assert r["ly_do_lech"] == "nuoc_ngoai"
    assert all(u["lech_gio_lich"] is False for u in r["ung_vien"])


def test_dinh_gio_utc9_1945_lech_hai_gio():
    # 1945-03-14 → 1945-09-02 đồng hồ UTC+9 (lệch giờ lịch 2 giờ).
    hn = {"birth_date": "1945-05-10", "gender": "nam", "noi_sinh": "ha-noi"}
    # 01:30 đồng hồ = 23:30 ngày 09/05 giờ lịch → Tý muộn hôm trước = Tý của ngày đã nhập
    r = _post("dinh-gio", {"la_so": {**hn, "birth_time": "01:30"}, "nam_doi_chieu": [2024], "tat_ca_gio": True})
    uv = r["ung_vien"]
    assert r["ly_do_lech"] == "mui_gio_lich_su" and len(uv) == 12
    assert uv[0]["la_gio_nhap"] and uv[0]["nhan"] == "Giờ Tý muộn (01:00–01:59)"
    assert uv[0]["khoang_gio_dong_ho"] == "01:00–01:59" and "23:30 ngày 09/05/1945" in uv[0]["ghi_chu"]
    assert all(u["ngay_duong"] == "1945-05-10" for u in uv[:11])
    # 00:30 đồng hồ = 22:30 ngày 09/05 giờ lịch = Hợi hôm trước → thêm riêng ở đầu (13 ứng viên)
    r = _post("dinh-gio", {"la_so": {**hn, "birth_time": "00:30"}, "nam_doi_chieu": [2024], "tat_ca_gio": True})
    uv = r["ung_vien"]
    assert len(uv) == 13 and sum(u["la_gio_nhap"] for u in uv) == 1
    assert uv[0]["la_gio_nhap"] and uv[0]["chi_gio"] == "Hợi" and "hôm trước" in uv[0]["nhan"]
    assert "22:30 ngày 09/05/1945" in uv[0]["ghi_chu"]
    # 23:30 đồng hồ = 21:30 giờ lịch = Hợi → không có Tý muộn
    r = _post("dinh-gio", {"la_so": {**hn, "birth_time": "23:30"}, "nam_doi_chieu": [2024], "tat_ca_gio": True})
    uv = r["ung_vien"]
    assert len(uv) == 12 and next(u for u in uv if u["la_gio_nhap"])["chi_gio"] == "Hợi"
    assert not any("Tý muộn" in u["nhan"] for u in uv)
