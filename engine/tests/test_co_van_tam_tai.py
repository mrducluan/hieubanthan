# -*- coding: utf-8 -*-
"""Kiểm định Chặng 2 — Bộ não Cố vấn Liên mảng Tam Tài (`POST /v1/co-van`) & Soi Góp Vốn Co-founder (`POST /v1/doanh-chu/gop-von`):
1. Thích nghi đủ 3 Bậc đầu vào (0% ngõ cụt): Bậc 1 chỉ ngày sinh (Tam trụ) -> Bậc 2 có giờ sinh (Tứ trụ + Tử vi/Kỵ chuyển Kỵ) -> Bậc 3 có hướng nhà/năm xây (Vận 9) hoặc đối tác.
2. Không mâu thuẫn toán học giữa Khối 1 (`ket_luan_5_giay.nhip`) và Khối 2 (`ba_tru_tam_tai`): nếu Nhân hoặc Thiên ở mức `can_chu_dong`, kết luận không bao giờ là `thuan_mo`; nếu ≥ 2 trụ `can_chu_dong` thì bắt buộc là `giu_phong_thu`.
3. Cổng an toàn khủng hoảng / y tế / cờ bạc chặn ngay từ đầu (`an_toan_chan`), không sinh chương mệnh lý.
4. Sạch `cum_cam_chung`, dung lượng gọn `< 40.000 bytes`, đối xứng khung `VI ↔ EN` và sạch chữ Việt ở bản Anh.
5. `POST /v1/doanh-chu/gop-von`: kiểm chặt đồng ý tự nguyện (PDPA), phân vai 3 làn và sinh điều khoản phá bế tắc 50–50."""
from __future__ import annotations

import json
import re

from fastapi.testclient import TestClient

from app.kb import tuvi_doi_song_kb as kds
from app.luangiai import co_van_tam_tai as cv, doi_song_khuon as kh
from app.main import app
from tests import _dau_ra as dr

_CLIENT = TestClient(app)
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_NGAY_XEM = "2026-11-26"


def _chuoi_van(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, list):
        for i in x:
            yield from _chuoi_van(i)
    elif isinstance(x, dict):
        for k, v in x.items():
            if k not in ("mo_dun", "phien_ban", "engine_version", "trang_thai", "source_id", "school_id",
                         "mach", "nhip", "ma", "muc", "hanh_ma", "loai", "loai_phep", "khu_vuc", "ma_mau",
                         "ngay_xem", "ngay", "am_lich", "thang", "lane_chinh", "trang_thai_bu_khuyet", "nganh",
                         "ma_mui_nhon", "phuong_ma", "am", "quan_he_tuoi"):
                yield from _chuoi_van(v)


def test_bang_chan_tri_tam_tai_khong_bao_gio_mau_thuan():
    cac_muc = ("thuan", "can_bang", "can_chu_dong")
    for mn in cac_muc:
        for mt in cac_muc:
            for md in cac_muc:
                kq = cv._tong_hop_nhip(mn, mt, md)
                if "can_chu_dong" in (mn, mt, md):
                    assert kq != "thuan_mo", (mn, mt, md, kq)
                if (mn, mt, md).count("can_chu_dong") >= 2:
                    assert kq == "giu_phong_thu", (mn, mt, md, kq)


def test_co_van_tam_tai_3_bac_dau_vao_8_mach_va_an_toan():
    cam = kh.cum_cam_chung()

    # 1. Cổng khủng hoảng / cờ bạc chặn trước khi tính lá số
    r_kh = _CLIENT.post("/v1/co-van", json={
        "cau_hoi": "Tôi bế tắc quá muốn tự tử kết thúc mọi thứ",
        "ngay_sinh": "1990-05-15", "gioi_tinh": "nam", "ngay_xem": _NGAY_XEM,
    })
    assert r_kh.status_code == 200
    d_kh = r_kh.json()
    assert d_kh["an_toan_chan"]["xu_ly"] == "an_toan"
    assert d_kh["chuong"] == []
    assert "ket_luan_5_giay" not in d_kh

    # 2. Đủ 8 mạch quyết định ở Bậc 1 (chỉ ngày sinh — Tam trụ, 0% ngõ cụt)
    tam_cau = [
        ("Năm tới tôi có nên nghỉ việc ra khởi nghiệp riêng không?", "su_nghiep_chuyen_viec"),
        ("Đang có khoản tiết kiệm nên đầu tư hay giữ tiền mặt?", "tai_chinh_dau_tu"),
        ("Tôi định hùn vốn mở quán với bạn thân cần lưu ý gì?", "gop_von_hop_tac"),
        ("Gia đình định mua nhà chuyển chỗ ở cuối năm nay có hợp không?", "nha_cua_mat_bang"),
        ("Chuyện tình cảm hẹn hò năm tới có tiến tới kết hôn được không?", "tinh_cam_cam_ket"),
        ("Vợ chồng dạo này căng thẳng bất hoà vì chuyện con cái làm sao gỡ?", "gia_dao_hoa_giai"),
        ("Dạo này tôi làm việc kiệt sức mất ngủ hoài nên điều chỉnh sao?", "suc_ben_nang_luong"),
        ("Sắp tới tôi nên ưu tiên mục tiêu nào trước?", "quyet_dinh_tong_hop"),
    ]
    for cau, mach_mong_doi in tam_cau:
        r1 = _CLIENT.post("/v1/co-van", json={
            "cau_hoi": cau, "ngay_sinh": "1990-05-15", "gioi_tinh": "nam", "ngay_xem": _NGAY_XEM,
        })
        assert r1.status_code == 200, (cau, r1.text)
        d1 = r1.json()
        assert d1["mo_dun"] == "tam_tai"
        assert d1["bac_dau_vao"] == 1
        assert d1["mach"] == mach_mong_doi
        assert d1["bieu_do_ngu_hanh"]["co_gio"] is False
        assert len(d1["chuong"]) == 4
        assert len(d1["nhip_12_thang"]) == 12
        assert len(json.dumps(d1, ensure_ascii=False).encode("utf-8")) < 40_000
        for s in (d1["ket_luan_5_giay"]["cau_ket_luan"], d1["ket_luan_5_giay"]["diem_tua_chinh"], d1["ket_luan_5_giay"]["diem_can_giu"]):
            assert not kds.tim_cum_cam(s, cam), (mach_mong_doi, s)

    # 3. Bậc 2 (+ giờ sinh chính xác -> mở Bát tự Tứ trụ + Tử vi Phi hoá) & Bậc 3 (+ nhà Vận 9 + đối tác) + Song ngữ VI/EN
    payload_bac3 = {
        "cau_hoi": "Should we lease this storefront and co-found a business next quarter?",
        "ngay_sinh": "1990-05-15",
        "gioi_tinh": "nam",
        "gio_sinh": "08:30",
        "do_tin_gio": "exact",
        "noi_sinh": "ha-noi",
        "nha": {"do_huong": 180.0, "nam_xay": 2024},
        "doi_tac": {"ngay_sinh": "1992-09-20", "gioi_tinh": "nu", "vai_tro": "gop_von"},
        "che_do": "kinh_doanh",
        "ngay_xem": _NGAY_XEM,
    }
    r_vi = _CLIENT.post("/v1/co-van", json=payload_bac3)
    r_en = _CLIENT.post("/v1/co-van", json=payload_bac3, headers={"x-ngon-ngu": "en"})
    assert r_vi.status_code == 200 and r_en.status_code == 200
    d_vi, d_en = r_vi.json(), r_en.json()
    assert d_vi["bac_dau_vao"] == 3
    assert d_vi["bieu_do_ngu_hanh"]["co_gio"] is True
    assert d_vi["ung_dung_co_dien"]["khu_vuc_van_9"]
    assert dr.khung(d_vi) == dr.khung(d_en)
    for s in _chuoi_van(d_en):
        assert not _VIET.search(s), f"Rò chữ Việt ở /v1/co-van EN: {s}"


def test_doanh_chu_gop_von_kiem_dong_y_va_song_ngu():
    mau_sl = [
        {"ten": "Minh", "ngay": 15, "thang": 5, "nam": 1990, "gioi_tinh": "nam", "ty_le_du_kien": 50, "dong_y_tu_nguyen": True},
        {"ten": "Lan", "ngay": 20, "thang": 6, "nam": 1991, "gioi_tinh": "nu", "gio": "09:15", "ty_le_du_kien": 50, "dong_y_tu_nguyen": True},
    ]
    # Thiếu cam kết thoả thuận → 422
    r_loi = _CLIENT.post("/v1/doanh-chu/gop-von", json={"sang_lap": mau_sl, "nganh": "cong_nghe", "nam_xem": 2027, "cam_ket_thoa_thuan": False})
    assert r_loi.status_code == 422

    r_vi = _CLIENT.post("/v1/doanh-chu/gop-von", json={"sang_lap": mau_sl, "nganh": "cong_nghe", "nam_xem": 2027, "cam_ket_thoa_thuan": True})
    r_en = _CLIENT.post("/v1/doanh-chu/gop-von", json={"sang_lap": mau_sl, "nganh": "cong_nghe", "nam_xem": 2027, "cam_ket_thoa_thuan": True}, headers={"x-ngon-ngu": "en"})
    assert r_vi.status_code == 200 and r_en.status_code == 200
    gv_vi, gv_en = r_vi.json(), r_en.json()
    assert gv_vi["khong_luu_du_lieu"] is True
    assert len(gv_vi["phan_vai_sang_lap"]) == 2
    assert len(gv_vi["dieu_le_rao_chan"]) == 4  # 3 mặc định + 1 điều khoản phá thế 50–50
    assert dr.khung(gv_vi) == dr.khung(gv_en)
    for s in _chuoi_van(gv_en):
        if s not in ("Minh", "Lan"):
            assert not _VIET.search(s), f"Rò chữ Việt ở /v1/doanh-chu/gop-von EN: {s}"


def test_ca_nhan_hoa_khac_nguoi_va_khac_cau_hoi_va_trung_thuc_bac_1():
    # Cùng 1 câu hỏi nhưng 2 người sinh khác ngày/năm → Nhật chủ, tỷ lệ 5 hành, Mệnh quái và nhịp khác nhau thật
    cau = "Năm tới tôi có nên nghỉ việc ra khởi nghiệp riêng không?"
    p_a = _CLIENT.post("/v1/co-van", json={"cau_hoi": cau, "ngay_sinh": "1990-05-15", "gioi_tinh": "nam", "ngay_xem": _NGAY_XEM}).json()
    p_b = _CLIENT.post("/v1/co-van", json={"cau_hoi": cau, "ngay_sinh": "1985-11-08", "gioi_tinh": "nu", "ngay_xem": _NGAY_XEM}).json()
    assert p_a["bieu_do_ngu_hanh"] != p_b["bieu_do_ngu_hanh"]
    assert p_a["ba_tru_tam_tai"]["nhan"]["nhan_xet"] != p_b["ba_tru_tam_tai"]["nhan"]["nhan_xet"]
    assert p_a["ba_tru_tam_tai"]["dia"]["nhan_xet"] != p_b["ba_tru_tam_tai"]["dia"]["nhan_xet"]

    # Bậc 1 (chưa có giờ sinh) trung thực học thuật: không khẳng định cung Tử vi hay Kỵ chuyển Kỵ
    van_bac_1 = json.dumps(p_a["ba_tru_tam_tai"], ensure_ascii=False)
    assert "Kỵ chuyển Kỵ" not in van_bac_1 and "Tử vi Nam phái" not in json.dumps(p_a["lop_da_dung"], ensure_ascii=False)

    # Cùng 1 người nhưng hỏi 2 câu khác nhau → mạch, kết luận 5 giây và điểm tựa khác nhau thật
    p_tc = _CLIENT.post("/v1/co-van", json={
        "cau_hoi": "Gia đình định mua nhà chuyển chỗ ở cuối năm nay có hợp không?",
        "ngay_sinh": "1990-05-15", "gioi_tinh": "nam", "ngay_xem": _NGAY_XEM,
    }).json()
    assert p_a["mach"] != p_tc["mach"]
    assert p_a["ket_luan_5_giay"]["cau_ket_luan"] != p_tc["ket_luan_5_giay"]["cau_ket_luan"]


def test_cam_nang_kinh_doanh_5_tru_thanh_mon_so_sanh_mat_bang_va_song_ngu():
    cam = kh.cum_cam_chung()
    payload = {
        "ngay_sinh": "1990-05-15",
        "gioi_tinh": "nam",
        "gio_sinh": "08:30",
        "nganh": "dich_vu",
        "mat_bang_ung_vien": [
            {"ten_diem": "Mặt bằng A", "loai_hinh": "quan_ca_phe", "do_huong": 135.0, "nam_xay": 2024},
            {"ten_diem": "Mặt bằng B", "loai_hinh": "quan_ca_phe", "do_huong": 270.0, "nam_xay": 2024},
        ],
        "ngay_xem": _NGAY_XEM,
    }
    r_vi = _CLIENT.post("/v1/doanh-chu/cam-nang-kinh-doanh", json=payload)
    r_en = _CLIENT.post("/v1/doanh-chu/cam-nang-kinh-doanh", json={
        **payload,
        "mat_bang_ung_vien": [
            {"ten_diem": "Site A", "loai_hinh": "quan_ca_phe", "do_huong": 135.0, "nam_xay": 2024},
            {"ten_diem": "Site B", "loai_hinh": "quan_ca_phe", "do_huong": 270.0, "nam_xay": 2024},
        ],
    }, headers={"x-ngon-ngu": "en"})
    assert r_vi.status_code == 200 and r_en.status_code == 200
    d_vi, d_en = r_vi.json(), r_en.json()
    assert d_vi["bac_phan_tich"] == 3
    assert len(d_vi["chon_dia_diem_cua_hang"]["so_sanh_mat_bang"]) == 2
    assert d_vi["chon_dia_diem_cua_hang"]["so_sanh_mat_bang"][0]["thu_tu_uu_tien"] == 1
    assert len(d_vi["chon_dia_diem_cua_hang"]["so_sanh_mat_bang"][0]["ngay_khai_truong"]) >= 1
    assert "thanh_mon_quyet" in d_vi["chon_dia_diem_cua_hang"]["so_sanh_mat_bang"][0]
    assert len(d_vi["chon_dia_diem_cua_hang"]["checklist_loan_dau_6_diem"]) == 6
    assert len(d_vi["bo_tri_van_phong_chu"]["nguyen_tac_4_diem"]) == 4
    assert len(d_vi["bo_tri_cua_hang_buon_ban"]["nguyen_tac_quay_thu_ngan_va_cua"]) == 4

    for s in _chuoi_van(d_vi):
        if len(s) > 25:
            assert not kds.tim_cum_cam(s, cam), s

    # Kiểm khung VI ↔ EN (bỏ qua key nội bộ can_cu/son_toa/son_huong nếu có khác format ngày)
    for s in _chuoi_van(d_en):
        if s not in ("Site A", "Site B"):
            assert not _VIET.search(s), f"Rò chữ Việt ở cam-nang-kinh-doanh EN: {s}"

    # Bậc 1 (không giờ sinh, không mặt bằng) vẫn trả đủ 5 trụ 0% ngõ cụt
    r_b1 = _CLIENT.post("/v1/doanh-chu/cam-nang-kinh-doanh", json={"ngay_sinh": "1990-05-15", "gioi_tinh": "nam", "ngay_xem": _NGAY_XEM})
    assert r_b1.status_code == 200
    assert r_b1.json()["bac_phan_tich"] == 1
    assert r_b1.json()["bo_tri_van_phong_chu"]["co_gio"] is False


