# -*- coding: utf-8 -*-
"""Kiểm định Kỷ Luật Thép v2.0 (Chủ dự án chốt 2026-11-26):
1. Tách thang 7 mức trong `do_tin.py` (`luat_tom_y` cho sách hiện đại còn bản quyền ghi trang + `nhap_ai_cho_duyet`
   cho nháp AI mới chờ chủ dự án đọc duyệt).
2. Khung `doi_chieu_hai_phai` trong `ung_dung_co_dien` (Phong Thuỷ): chỉ hiện khi Bát Trạch và Huyền Không Vận 9 thật sự
   trái chiều tại hướng cửa (`bt_thuan_hk_tinh` hoặc `hk_vuong_bt_lech`), giữ trung lập hai phái, sạch `cum_cam_chung`,
   đối xứng khung `VI ↔ EN` và sạch chữ Việt ở bản Anh.
3. Ngân sách dung lượng theo từng lớp cho trần `190.000 bytes` (chừa đệm cho trần cứng DB `262.144 bytes`):
   - Toàn bài `tuvi` / `battu` `< 190.000 bytes`
   - Lớp tóm tắt nội tuyến `ung_dung_co_dien` `< 3.000 bytes` (mọi phụ lục đa phái lớn hơn ở Chặng 2+ bắt buộc tách
     tra cứu lazy-load qua cổng kiểm quyền `SAO-2`; báo cáo Liên mảng Tam Tài phải tách `mo_dun = "tam_tai"` riêng)."""
from __future__ import annotations

import datetime as dt
import gzip
import json
import re
from pathlib import Path

from app import ngon_ngu
from app.kb import do_tin, tuvi_doi_song_kb as kds
from app.luangiai import doi_song_khuon as kh, phongthuy_doi_song as ptds, ung_dung_co_dien as ud
from tests import _dau_ra as dr

_GOC = Path(__file__).resolve().parent.parent
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)


def test_do_tin_thang_7_muc_tach_ro_luat_tom_y_va_nhap_ai_cho_duyet():
    assert "luat_tom_y" in do_tin.THANG
    assert "nhap_ai_cho_duyet" in do_tin.THANG
    assert len(do_tin.THANG) == 7
    assert do_tin.muc("ung_dung_co_dien_kb.json") == "nhap_ai_cho_duyet"
    assert do_tin.muc("go_nut_doi_song_kb.json") == "nhap_ai_cho_duyet"
    assert do_tin.muc("tuvi_phi_hoa_luong_672.json") == "luat_tom_y"
    assert do_tin.muc("battu_thien_ly_menh_cao.json") == "luat_tom_y"


def test_doi_chieu_hai_phai_bat_trach_va_van_9_khi_trai_chieu_va_song_ngu():
    cam = kh.cum_cam_chung()
    ngay = dt.date(2026, 11, 10)
    sinh_kham = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 15)}  # Đông tứ mệnh (Khảm)

    # Tìm động hướng gây lệch Bát Trạch thuận / Vận 9 cần tĩnh và ngược lại trên 24 sơn Vận 9
    th_bt_thuan_hk_tinh = None
    th_hk_vuong_bt_lech = None
    for do_h in range(0, 360, 15):
        bc = ptds.luan_giai(sinh_kham, {"huong_do": float(do_h), "nam_xay": 2024, "theo": "cua"}, ngay_xem=ngay)
        dc = (bc.get("ung_dung_co_dien") or {}).get("doi_chieu_hai_phai")
        if dc and dc["loai"] == "bt_thuan_hk_tinh" and th_bt_thuan_hk_tinh is None:
            th_bt_thuan_hk_tinh = (float(do_h), bc)
        elif dc and dc["loai"] == "hk_vuong_bt_lech" and th_hk_vuong_bt_lech is None:
            th_hk_vuong_bt_lech = (float(do_h), bc)

    assert th_bt_thuan_hk_tinh is not None, "Phải có ít nhất 1 hướng nhà Bát Trạch thuận nhưng Vận 9 cần tĩnh"
    assert th_hk_vuong_bt_lech is not None, "Phải có ít nhất 1 hướng nhà Vận 9 vượng nhưng Bát Trạch khác nhóm"

    for do_h, bc_vi in (th_bt_thuan_hk_tinh, th_hk_vuong_bt_lech):
        dc_vi = bc_vi["ung_dung_co_dien"]["doi_chieu_hai_phai"]
        for k in ("tieu_de", "goc_bat_trach", "goc_huyen_khong_van_9", "cach_dung_hoa"):
            assert dc_vi[k] and not kds.tim_cum_cam(dc_vi[k], cam), (dc_vi["loai"], dc_vi[k])

        with ngon_ngu.dung("en"):
            bc_en = ptds.luan_giai(sinh_kham, {"huong_do": do_h, "nam_xay": 2024, "theo": "cua"}, ngay_xem=ngay)
        dc_en = bc_en["ung_dung_co_dien"]["doi_chieu_hai_phai"]
        assert dr.khung(dc_vi) == dr.khung(dc_en)
        for k in ("tieu_de", "goc_bat_trach", "goc_huyen_khong_van_9", "cach_dung_hoa"):
            assert not _VIET.search(dc_en[k]), f"Rò chữ Việt ở doi_chieu_hai_phai EN: {dc_en[k]}"


def test_ngan_sach_dung_luong_tung_lop_bao_ve_tran_190kb():
    mau_path = _GOC / "fixtures" / "golden" / "dau_ra_vi" / "mau.json.gz"
    mau = json.loads(gzip.open(mau_path, "rt", encoding="utf-8").read())
    for k, raw in mau.items():
        if k.startswith(("tuvi.luan_giai", "battu.luan_giai")):
            so_byte = len(raw.encode("utf-8"))
            assert so_byte < 190_000, f"{k} vượt trần cảnh báo 190 KB: {so_byte} bytes"
            d = json.loads(raw)
            if "ung_dung_co_dien" in d:
                byte_cd = len(json.dumps(d["ung_dung_co_dien"], ensure_ascii=False).encode("utf-8"))
                assert byte_cd < 3_000, f"Lớp nội tuyến ung_dung_co_dien của {k} vượt ngân sách 3 KB: {byte_cd} bytes"
