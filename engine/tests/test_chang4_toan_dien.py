# -*- coding: utf-8 -*-
"""Chặng 4.2 & 4.3 — Kiểm thử API Chiêm tinh phương Tây, Cầu nối Đông–Tây, Trạch Nhật Hiệp Kỷ & Vòng tự học 11 mảng."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.calc import trach_nhat_hiep_ky as tnhk
from app.kb import sach_ghi
from app.main import app
from scripts import tong_hop_vong_tu_hoc as vth
from tests import _dau_ra as dr

ROOT = Path(__file__).resolve().parents[1]
NGUON = ROOT / "fixtures" / "nguon"
KB_DIR = ROOT / "app" / "kb" / "data"
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_C = TestClient(app)


def test_api_chiem_tinh_ban_do_cau_noi_dong_tay_song_ngu_va_tuoi_16():
    # Ngoài phạm vi lịch 1926–2049 -> trả 422 sạch (không 500, không ngoại suy âm thầm)
    assert _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "1920-01-01"}).status_code == 422
    assert _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "1990-05-15", "ngay_xem": "2060-01-01"}).status_code == 422

    # Dưới 16 tuổi -> chuyển hướng lịch sự
    nho = _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "2014-06-01", "ngay_xem": "2026-11-27"}).json()
    assert nho["chuyen_huong_tuoi"]["tuoi"] < 16 and "hanh_tinh" not in nho

    # Có giờ sinh + Placidus + Cầu nối Đông–Tây: song ngữ VI ↔ EN sạch chữ Việt & khớp khung
    p = {
        "ngay_sinh": "1997-03-15",
        "gio_sinh": "09:30",
        "gioi_tinh": "nu",
        "noi_sinh": "ha-noi",
        "he_nha": "placidus",
        "ngay_xem": "2026-11-27",
        "kem_cau_noi_dong_tay": True,
    }
    vi = _C.post("/v1/chiem-tinh/ban-do", json=p).json()
    en = _C.post("/v1/chiem-tinh/ban-do", json=p, headers={"x-ngon-ngu": "en"}).json()
    assert vi["co_gio_sinh"] is True
    assert len(vi["hanh_tinh"]) == 13
    assert len(vi["nha"]) == 12
    assert vi["van_han"]["saturn_return"]["giai_doan"] == "lan_1_29_tuoi"
    assert len(vi["cau_noi_dong_tay"]["bon_chieu"]) == 4
    assert "diem" not in vi  # CD-1: không chấm điểm gộp
    # Bản Anh sạch chữ Việt (trừ tên địa danh đầu vào Hà Nội nếu có trong dau_vao)
    en_kiem = {k: v for k, v in en.items() if k != "dau_vao"}
    assert not _VIET.search(json.dumps(en_kiem, ensure_ascii=False)), en_kiem
    assert dr.khung(vi) == dr.khung(en)

    # Khuyết giờ sinh -> có ghi_chu_mat_trang, không an nhà
    kg = _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "1990-05-15", "ngay_xem": "2026-11-27"}).json()
    assert kg["co_gio_sinh"] is False and kg["nha"] is None and kg["ghi_chu_mat_trang"]


def test_api_synastry_bat_buoc_dong_y_khong_in_ngay_sinh_va_khong_cham_diem():
    p = {
        "nguoi_a": {"ngay_sinh": "1992-04-18", "gio_sinh": "10:00", "noi_sinh": "ha-noi"},
        "nguoi_b": {"ngay_sinh": "1994-09-25", "gio_sinh": "15:30", "noi_sinh": "tp-ho-chi-minh"},
    }
    assert _C.post("/v1/chiem-tinh/hop-doi", json=p).status_code == 422
    vi = _C.post("/v1/chiem-tinh/hop-doi", json={**p, "dong_y_tu_nguyen": True, "ngay_xem": "2026-11-27"}).json()
    en = _C.post(
        "/v1/chiem-tinh/hop-doi",
        json={**p, "dong_y_tu_nguyen": True, "ngay_xem": "2026-11-27"},
        headers={"x-ngon-ngu": "en"},
    ).json()
    van_vi = json.dumps(vi, ensure_ascii=False)
    assert vi["khong_cham_diem"] is True and "1994" not in van_vi
    assert not _VIET.search(json.dumps(en, ensure_ascii=False))
    assert dr.khung(vi) == dr.khung(en)


def test_trach_nhat_hiep_ky_nguyen_van_tu_ly_va_api_song_ngu():
    hk_raw = sach_ghi.chuan(
        "\n".join(t.get("van", "") for t in json.loads((NGUON / "hiep_ky_bien_phuong_thu_du_bo.json").read_text("utf-8"))["thien"])
    )
    kb = json.loads((KB_DIR / "trach_nhat_hiep_ky_kb.json").read_text("utf-8"))
    for ma, item in kb["trich_co_thu"].items():
        assert sach_ghi.chuan(item["han"]) in hk_raw, ma

    # Quanh Đông chí tháng 12/2026: định nghĩa của sách bắt đúng 1 ngày Tứ Ly (trường riêng `tu_ly_theo_sach`)
    tu_ly_days = [
        dt.date(2026, 12, d)
        for d in range(19, 24)
        if tnhk.la_tu_ly_theo_sach(dt.date(2026, 12, d))
    ]
    assert len(tu_ly_days) == 1

    vi = _C.post("/v1/lich/hiep-ky-doi-chieu", json={"tu_ngay": "2026-12-19", "so_ngay": 5, "huong_tu_tao": "Bắc"}).json()
    en = _C.post(
        "/v1/lich/hiep-ky-doi-chieu",
        json={"tu_ngay": "2026-12-19", "so_ngay": 5, "huong_tu_tao": "Bắc"},
        headers={"x-ngon-ngu": "en"},
    ).json()
    assert len(vi["ngay_phan_tich"]) == 5
    # Năm 2026 Bính Ngọ (Dần Ngọ Tuất) -> Tam Sát ở phương Bắc -> cham_huong_dang_xet kích hoạt!
    assert any("Tam Sát" in " ".join(ng["luu_y_hiep_ky"]) for ng in vi["ngay_phan_tich"])
    # Bản Anh nhận MÃ hướng, kết quả như gửi tên Việt
    en_ma = _C.post(
        "/v1/lich/hiep-ky-doi-chieu",
        json={"tu_ngay": "2026-12-19", "so_ngay": 5, "huong_tu_tao": "bac"},
        headers={"x-ngon-ngu": "en"},
    ).json()
    assert en_ma["ngay_phan_tich"] == en["ngay_phan_tich"]
    en_no_cjk = json.loads(json.dumps(en))
    for t in en_no_cjk["trich_co_thu"]:
        t["han"] = ""
    assert not _VIET.search(json.dumps(en_no_cjk, ensure_ascii=False)), en_no_cjk
    assert dr.khung(vi) == dr.khung(en)


def test_vong_tu_hoc_hang_tuan_11_mang():
    mau = {
        "kiem_chung_phieu": [
            {"mo_dun": "chiem_tinh", "ma_mau": "ds.ct.saturn_1", "so_dung": 28, "so_chua_dung": 5},
            {"mo_dun": "tuvi", "ma_mau": "ds.tv.tai_chinh.xau", "so_dung": 10, "so_chua_dung": 25},
        ],
        "kiem_chung_sau": [
            {"mo_dun": "tam_tai", "ma_mau": "ds.tt.su_nghiep", "so_do_hon": 4, "so_nhu_cu": 14, "so_nang_hon": 2},
        ],
        "lech_ngon_ngu": [
            {"mo_dun": "chiem_tinh", "ma_mau": "ds.ct.moon", "tong_vi": 20, "tong_en": 20, "ty_le_dung_vi": 0.80, "ty_le_dung_en": 0.50},
        ],
        "cum_cau_hoi_chua_phu": [
            {"mo_dun": "chiem_tinh", "chu_de": "nghịch hành thuỷ tinh ký hợp đồng", "so_luot": 12, "diem_khop_tb": 0.42},
        ],
    }
    kq = vth.tong_hop_ung_vien(mau)
    assert kq["so_mang_ho_tro"] == 11
    assert len(kq["thuc_chung_cao"]) == 1 and kq["thuc_chung_cao"][0]["mo_dun"] == "chiem_tinh"
    assert len(kq["can_viet_lai"]) == 1 and kq["can_viet_lai"][0]["tep_kb_goi_y"] == "tuvi_doi_song_kb.json"
    assert len(kq["can_doi_hanh_dong_30_ngay"]) == 1
    assert len(kq["lech_song_ngu"]) == 1 and kq["lech_song_ngu"][0]["tep_en_can_ra"] == "en/chiem_tinh_hanh_tinh_cung_kb.json"
    assert len(kq["cum_to_mo_moi"]) == 1
    md = vth.xuat_markdown(kq)
    assert "ds.tv.tai_chinh.xau" in md


# ---------------------------------------------------------------- Hiệp Kỷ: MỘT bộ tính với thẻ ngày (hoang_lich)
from app.calc import hoang_lich as _hl  # noqa: E402
from app.calc import lunar as _lunar  # noqa: E402


def _ngay(a: dt.date, b: dt.date):
    d = a
    while d <= b:
        yield d
        d += dt.timedelta(days=1)


def test_hiep_ky_doc_dung_gia_tri_the_ngay_2020_2025():
    for d in _ngay(dt.date(2020, 1, 1), dt.date(2025, 12, 31)):
        the = _hl.ngay(d)
        r = tnhk.phan_tich_ngay_hiep_ky(d)
        assert r["duong_cong_ky"] == ("duong_cong" in the["ky_dan_gian"]), d
        assert r["tu_ly"] == ("四离" in the["hung_sat"]), d
        assert r["chi_thang"] == _lunar.CHI[_hl.ZHI.index(the["thang_gz"][1])], d
        assert (r["am"]["ngay"], r["am"]["thang"], r["am"]["nhuan"]) == (
            the["am"]["ngay"], the["am"]["thang"], the["am"]["nhuan"]), d
        assert f"{r['can_ngay']}{r['chi_ngay']}" == "".join(
            (_lunar.CAN[_hl.GAN.index(the["ngay_gz"][0])], _lunar.CHI[_hl.ZHI.index(the["ngay_gz"][1])])), d


def test_hiep_ky_nam_doi_o_lap_xuan_cung_chi_thang():
    # 2026-02-04 là ngày Lập xuân (chưa Tết): tháng Dần thì năm phải là Ngọ (Bính Ngọ), không phải Tỵ
    r = tnhk.phan_tich_ngay_hiep_ky(dt.date(2026, 2, 4))
    assert r["chi_thang"] == "Dần" and r["chi_nam"] == "Ngọ" and r["nam_lap_xuan"] == 2026
    r = tnhk.phan_tich_ngay_hiep_ky(dt.date(2026, 2, 3))
    assert r["chi_thang"] == "Sửu" and r["chi_nam"] == "Tỵ"
    # Ngày giao tiết: chi tháng đổi TỪ NGÀY giao tiết như thẻ ngày (2020-02-04 Lập xuân)
    assert tnhk.phan_tich_ngay_hiep_ky(dt.date(2020, 2, 4))["chi_thang"] == "Dần"


def test_hiep_ky_tam_sat_canh_bao_moi_huong_trong_vung():
    # Năm Ngọ (2026 sau Lập xuân): Tam Sát phía Bắc = Hợi Tý Sửu → Tây Bắc, Bắc, Đông Bắc
    d = dt.date(2026, 6, 1)
    for h in ("Tây Bắc", "Bắc", "Đông Bắc"):
        assert tnhk.phan_tich_ngay_hiep_ky(d, h)["tam_sat_nam"]["cham_huong_dang_xet"], h
    for h in ("Nam", "Đông", "Tây", "Đông Nam", "Tây Nam"):
        assert not tnhk.phan_tich_ngay_hiep_ky(d, h)["tam_sat_nam"]["cham_huong_dang_xet"], h


def test_hiep_ky_thai_duong_va_dien_thuc():
    # Nguyệt tướng: sau Đông chí Mặt Trời ở Sửu, sau Xuân phân ở Tuất, sau Vũ thủy ở Hợi
    assert tnhk.chi_thai_duong(dt.date(2026, 1, 5)) == "Sửu"
    assert tnhk.chi_thai_duong(dt.date(2026, 3, 25)) == "Tuất"
    assert tnhk.chi_thai_duong(dt.date(2026, 3, 1)) == "Hợi"
    # Mọi ngày Thập Ác: da_dien_thuc ⇔ chi Lộc trùng chi năm / tháng / Thái Dương
    n = 0
    for d in _ngay(dt.date(2024, 1, 1), dt.date(2026, 12, 31)):
        r = tnhk.phan_tich_ngay_hiep_ky(d)
        ta = r["thap_ac_dai_bai"]
        if not ta:
            continue
        n += 1
        mong = [m for m, c in (("thai_tue", r["chi_nam"]), ("nguyet_kien", r["chi_thang"]),
                               ("thai_duong", ta["chi_thai_duong"])) if c == ta["chi_loc"]]
        assert ta["dien_thuc_boi"] == mong and ta["da_dien_thuc"] == bool(mong), d
    assert n > 50


def test_hiep_ky_am_lich_giu_chu_nhuan_ban_viet():
    # 2025 có tháng 6 nhuận (25/7/2025 → 1/6 nhuận)
    vi = _C.post("/v1/lich/hiep-ky-doi-chieu", json={"tu_ngay": "2025-07-25", "so_ngay": 1}).json()
    en = _C.post("/v1/lich/hiep-ky-doi-chieu", json={"tu_ngay": "2025-07-25", "so_ngay": 1},
                 headers={"x-ngon-ngu": "en"}).json()
    assert vi["ngay_phan_tich"][0]["am_lich"].endswith(" nhuận")
    assert en["ngay_phan_tich"][0]["am_lich"].endswith(" (leap)")


def test_hiep_ky_kb_trich_dung_quyen_va_co_nguon():
    kb = json.loads((KB_DIR / "trach_nhat_hiep_ky_kb.json").read_text("utf-8"))
    tc = kb["trich_co_thu"]
    assert "Quyển 5" in tc["thap_ac_bien_ngoa"]["sach"]          # lời án 無禄 nằm ở quyển 5 (義例), không phải quyển 36
    assert "Thông Thư" in tc["tam_sat_thong_thu"]["sach"]
    assert "không đáng ngại" not in json.dumps(kb, ensure_ascii=False)
    for nhom in ("ngu_loai_nhat", "trich_co_thu"):
        for ma, v in kb[nhom].items():
            assert v.get("source_id") and v.get("school_id"), (nhom, ma)


# ---------------------------------------------------------------- Cầu nối Đông – Tây: bên Tử vi thật sự hiện
def _menh_tuvi_api(ngay: str, gio: str, gt: str, noi: str) -> list[str]:
    la = _C.post("/v1/tuvi/an-sao", json={"birth_date": ngay, "birth_time": gio, "gender": gt, "noi_sinh": noi}).json()
    c = next(c for c in la["cung"] if c.get("la_menh"))
    return [s["ten"] for s in c["chinh_tinh"]]


def test_cau_noi_dong_tay_co_cung_menh_tu_vi_khi_co_gio():
    p = {"ngay_sinh": "1990-05-15", "gio_sinh": "14:30", "gioi_tinh": "nam", "noi_sinh": "ha-noi",
         "ngay_xem": "2026-11-27"}
    vi = _C.post("/v1/chiem-tinh/ban-do", json=p).json()["cau_noi_dong_tay"]
    assert vi["thieu"] is None and vi["tu_vi_menh"], vi
    assert "cung Mệnh Tử vi" in vi["tom_tat_phuong_dong"]
    mong = _menh_tuvi_api("1990-05-15", "14:30", "nam", "ha-noi")
    if mong:                                    # cung Mệnh có chính tinh → phải trùng lá số Tử vi
        assert vi["tu_vi_menh"]["sao"] == mong and not vi["tu_vi_menh"]["muon_cung_doi"]
    en = _C.post("/v1/chiem-tinh/ban-do", json=p, headers={"x-ngon-ngu": "en"}).json()["cau_noi_dong_tay"]
    assert "Zi Wei Life Palace" in en["tom_tat_phuong_dong"]
    assert not _VIET.search(en["tom_tat_phuong_dong"] + en["tom_tat_phuong_tay"])
    # CD-1: không có điểm số, không quy đổi
    assert "diem" not in json.dumps(vi)


def test_cau_noi_dong_tay_gio_suu_va_thieu_gio():
    # 01:00 là giờ Sửu (time_index 1) — phải trùng lá số Tử vi cùng giờ, không phải giờ Tý
    p = {"ngay_sinh": "1988-10-24", "gio_sinh": "01:00", "gioi_tinh": "nu", "noi_sinh": "ha-noi",
         "ngay_xem": "2026-11-27"}
    cn = _C.post("/v1/chiem-tinh/ban-do", json=p).json()["cau_noi_dong_tay"]
    mong = _menh_tuvi_api("1988-10-24", "01:00", "nu", "ha-noi")
    if mong:
        assert cn["tu_vi_menh"]["sao"] == mong
    kg = _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "1990-05-15", "ngay_xem": "2026-11-27"}).json()
    assert kg["cau_noi_dong_tay"]["thieu"] == "gio" and kg["cau_noi_dong_tay"]["tu_vi_menh"] is None
    assert "giờ sinh" in kg["cau_noi_dong_tay"]["tom_tat_phuong_dong"]


def test_chiem_tinh_khong_lo_ten_thu_vien():
    vi = _C.post("/v1/chiem-tinh/ban-do", json={"ngay_sinh": "1990-05-15", "ngay_xem": "2026-11-27"}).json()
    txt = vi["phuong_phap_lich"]
    for cam in ("NASA", "JPL", "DE441", "VSOP", "ELP", "Meeus"):
        assert cam not in txt
