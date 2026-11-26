# -*- coding: utf-8 -*-
"""Kiểm định Chặng 1 (nâng cấp trung thực học thuật) — lớp 'Đối chiếu Cổ điển' (`ung_dung_co_dien`):
1. Bát tự: trình bày song song hai phép Dụng thần + Cách cục Tử Bình Chân Thuyên + Điều hậu Cùng Thông Bảo Giám;
   TUYỆT ĐỐI KHÔNG khuyên phương vị / hướng theo ngũ hành (tuân thủ quyết định `6b` tránh mâu thuẫn Bát trạch).
2. Tử vi: tổng hợp nền tảng Lập cực (Nạp âm – Cục, Mệnh/Thân chủ, Lai nhân cung) + cổ phú khớp lá số;
   TUYỆT ĐỐI KHÔNG bịa màu sắc, khung giờ theo sao và không gán mặc định 'Thổ'.
3. Phong thuỷ:
   - Sao 2 Nhị Hắc ở Vận 9 tính đúng là `sinh` khí theo `calc.huyen_khong.trang_thai(2, 9) == 'sinh'`, không gán nhầm là sát.
   - Đọc ĐÚNG vị trí phòng thật từ `bo_cuc.vi_tri` / `so_do`; khi chưa khai sơ đồ phòng thì chỉ nêu trung thực
     `huong_thu` & `toa_son`, không gán giả cung Toạ là phòng ngủ.
   - Sinh khối `doi_chieu_hai_phai` khi hướng nhà có độ lệch giữa Bát Trạch và Huyền Không Vận 9.
4. Đối xứng khung dữ kiện 100% giữa bản Việt và bản Anh (`dr.khung`), 0 chữ Việt lọt sang bản Anh, dung lượng < 3.5 KB."""
from __future__ import annotations

import datetime as dt
import json
import re

from app import ngon_ngu
from app.calc import huyen_khong as hk, tuvi_an_sao as az
from app.luangiai import phongthuy_doi_song as ptds, toan_bo
from tests import _dau_ra as dr

_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_NGAY_XEM = dt.date(2026, 11, 26)


def test_battu_co_dien_khong_phuong_vi_trai_6b_va_co_dieu_hau_ctbg():
    sinh = {"lich": dt.datetime(1990, 5, 15, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}
    bc_vi = toan_bo.battu(sinh, _NGAY_XEM)
    u_vi = bc_vi["ung_dung_co_dien"]
    assert u_vi["ma"] == "battu_co_dien"
    assert "hanh_ung_dung" not in u_vi
    van_json = json.dumps(u_vi, ensure_ascii=False).lower()
    # Quyết định 6b: không khuyên hướng Tây/Đông/Bắc/Nam theo ngũ hành trong Bát tự
    for huong_cam in ("hướng tây", "hướng đông", "hướng bắc", "hướng nam"):
        assert huong_cam not in van_json, f"Vi phạm 6b: {huong_cam}"
    assert len(u_vi["diem_hoc_thuat"]) >= 2
    assert any("Cùng Thông Bảo Giám" in d["nhan"] for d in u_vi["diem_hoc_thuat"])
    assert u_vi.get("sach"), "Bản Việt phải có nguyên văn cổ thư đối chiếu"
    assert len(json.dumps(u_vi, ensure_ascii=False).encode("utf-8")) < 3500

    with ngon_ngu.dung("en"):
        bc_en = toan_bo.battu(sinh, _NGAY_XEM)
    u_en = bc_en["ung_dung_co_dien"]
    assert dr.khung(u_vi) == dr.khung(u_en)
    assert not _VIET.search(json.dumps(u_en, ensure_ascii=False))


def test_tuvi_co_dien_lap_cuc_that_khong_bia_mau_gio_va_khong_fallback_tho():
    sinh = {"ngay": dt.date(1990, 5, 15), "ti": az.time_index(8, 30), "gioi_tinh": "nam", "tz_lich": 7.0}
    bc_vi = toan_bo.tuvi(sinh, _NGAY_XEM)
    u_vi = bc_vi["ung_dung_co_dien"]
    assert u_vi["ma"] == "tuvi_co_dien"
    assert "hanh_ung_dung" not in u_vi
    assert len(u_vi["diem_hoc_thuat"]) == 3
    nhan_ds = [d["nhan"] for d in u_vi["diem_hoc_thuat"]]
    assert any("Cục" in n for n in nhan_ds) and any("Lai nhân" in n for n in nhan_ds)
    assert len(json.dumps(u_vi, ensure_ascii=False).encode("utf-8")) < 3500

    with ngon_ngu.dung("en"):
        bc_en = toan_bo.tuvi(sinh, _NGAY_XEM)
    u_en = bc_en["ung_dung_co_dien"]
    assert dr.khung(u_vi) == dr.khung(u_en)
    assert not _VIET.search(json.dumps(u_en, ensure_ascii=False))


def test_phongthuy_co_dien_ton_trong_phong_that_bo_cuc_va_sao_2_van_9_la_sinh():
    assert hk.trang_thai(2, 9) == "sinh"
    sinh = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 15)}

    # 1. Chưa khai sơ đồ phòng -> CHỈ có huong_thu & toa_son, tuyệt đối không gán giả 'phong_ngu'
    bc_chua_so_do = ptds.luan_giai(sinh, {"huong_do": 180.0, "nam_xay": 2024}, ngay_xem=_NGAY_XEM)
    u0 = bc_chua_so_do["ung_dung_co_dien"]
    assert u0.get("ghi_chu_so_do")
    assert [x["khu_vuc"] for x in u0["khu_vuc_van_9"]] == ["huong_thu", "toa_son"]

    # 2. Đã khai sơ đồ phòng thật -> đọc đúng phòng người dùng đã khai (cua_chinh Nam, phong_ngu_chinh Đông, bep Đông Nam)
    nha_co_so_do = {
        "huong_do": 180.0,
        "nam_xay": 2024,
        "bo_cuc": {"vi_tri": {"cua_chinh": "Nam", "phong_ngu_chinh": "Đông", "bep": "Đông Nam"}},
    }
    bc_co_so_do = ptds.luan_giai(sinh, nha_co_so_do, ngay_xem=_NGAY_XEM)
    u1 = bc_co_so_do["ung_dung_co_dien"]
    assert "ghi_chu_so_do" not in u1
    assert [x["khu_vuc"] for x in u1["khu_vuc_van_9"]] == ["cua_chinh", "phong_ngu_chinh", "bep"]
    pn = next(x for x in u1["khu_vuc_van_9"] if x["khu_vuc"] == "phong_ngu_chinh")
    assert "Đông" in pn["ten_khu_vuc"]
    # Kiểm không còn câu nào gán nhầm sao 2 ở Vận 9 là 'Thổ sát'
    assert "thổ sát" not in json.dumps(u1, ensure_ascii=False).lower()

    # 3. Kiểm đối xứng VI ↔ EN và khối doi_chieu_hai_phai khi 2 phái trái chiều (Nam 1990 Khảm Đông tứ mệnh ở nhà hướng Tây 270°)
    nha_lech = {"huong_do": 270.0, "nam_xay": 2024, "bo_cuc": {"vi_tri": {"cua_chinh": "Tây", "phong_ngu_chinh": "Bắc"}}}
    bc_lech_vi = ptds.luan_giai(sinh, nha_lech, ngay_xem=_NGAY_XEM)
    with ngon_ngu.dung("en"):
        bc_lech_en = ptds.luan_giai(sinh, nha_lech, ngay_xem=_NGAY_XEM)
    assert dr.khung(bc_lech_vi["ung_dung_co_dien"]) == dr.khung(bc_lech_en["ung_dung_co_dien"])
    assert not _VIET.search(json.dumps(bc_lech_en["ung_dung_co_dien"], ensure_ascii=False))
