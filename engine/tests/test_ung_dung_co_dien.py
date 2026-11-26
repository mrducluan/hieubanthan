# -*- coding: utf-8 -*-
"""Kiểm định Chặng 1 (Lát cắt 1.1 & 1.3):
1. Nâng số cặp sao có câu cổ thư nguyên văn đối chiếu trong `phongthuy_huyen_khong.json` (`to_hop_81`) từ 28 lên ≥ 65/81 cặp
   (100% khớp nguyên văn `phongthuy_huyen_khong_co_thu.json`, 0 câu bịa, 0 lỗi `sach_ghi.kiem_tep`).
2. Bộ quy tắc tất định `luangiai/ung_dung_co_dien.py` + KB song ngữ `ung_dung_co_dien_kb.json` (`vi` + `en/`):
   - Đọc từ dữ kiện `CALC` (hành cần thêm 2 cách Bát tự, trục hành Mệnh–Quan–Tài Tử vi, cặp sao Sơn–Hướng–Lưu niên Vận 9);
   - Thứ tự ưu tiên rõ ràng, không bao giờ mâu thuẫn hướng quay giường/bếp của Bát Trạch;
   - Sạch tuyệt đối cụm giọng AI (`cum_cam_chung`), từ doạ / mê tín / vật phẩm, dung lượng < 3 KB, khớp khung VI ↔ EN."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

from app import ngon_ngu
from app.calc import tuvi_an_sao as az
from app.kb import sach_ghi as sg, tuvi_doi_song_kb as kds
from app.luangiai import battu_doi_song as btd
from app.luangiai import doi_song_khuon as kh
from app.luangiai import phongthuy_doi_song as ptds
from app.luangiai import tuvi_doi_song as tvd
from app.luangiai import ung_dung_co_dien as ud
from tests import _dau_ra as dr

_GOC = Path(__file__).resolve().parents[1]
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_CAM_ME_TIN = ("cúng", "dâng sao", "giải hạn", "bùa", "ngải", "trấn yểm", "tỳ hưu", "thiềm thừ", "vòng đá", "mua vật phẩm",
               "phát tài chắc chắn", "giàu to", "đại hung", "chết")


def _chuoi_tat_ca(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for k, v in x.items():
            if k not in ("ma", "khu_vuc", "loai_phep", "muc_uu_tien"):
                yield from _chuoi_tat_ca(v)
    elif isinstance(x, list):
        for v in x:
            yield from _chuoi_tat_ca(v)


def test_to_hop_81_nang_len_65_cap_khop_nguyen_van_co_thu():
    kb_path = _GOC / "app" / "kb" / "data" / "phongthuy_huyen_khong.json"
    n, loi = sg.kiem_tep(kb_path)
    assert n >= 65, f"Kỳ vọng ≥ 65 cặp to_hop_81 có nguyên văn cổ thư đối chiếu, thực tế {n}"
    assert not loi, "Lỗi SX-C trong phongthuy_huyen_khong.json:\n" + "\n".join(loi)


def test_ung_dung_co_dien_battu_tuvi_phongthuy_dung_luat_va_gon_nhe():
    cam = kh.cum_cam_chung()
    ngay_xem = dt.date(2026, 11, 10)
    bc_bt = btd.lap({"lich": dt.datetime(1990, 5, 15, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}, ngay_xem)
    bc_tv = tvd.lap({"ngay": dt.date(1990, 5, 15), "ti": az.time_index(8, 30), "gioi_tinh": "nam", "tz_lich": 7.0}, ngay_xem)
    bc_pt = ptds.luan_giai({"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 15)},
                           {"huong_do": 180.0, "nam_xay": 2024, "theo": "cua"}, ngay_xem=ngay_xem)

    u_bt = ud.tu_bao_cao_battu(bc_bt)
    u_tv = ud.tu_bao_cao_tuvi(bc_tv)
    u_pt = ud.tu_bao_cao_phongthuy(bc_pt)

    for ten, goi in (("battu", u_bt), ("tuvi", u_tv), ("phongthuy", u_pt)):
        assert goi and goi["tieu_de"] and goi["nguyen_tac_uu_tien"]
        raw = json.dumps(goi, ensure_ascii=False)
        assert len(raw.encode("utf-8")) < 3500, f"{ten} quá nặng ({len(raw.encode('utf-8'))} bytes), nguy cơ chạm trần 190 KB"
        low = raw.lower()
        assert not any(c in low for c in _CAM_ME_TIN), (ten, [c for c in _CAM_ME_TIN if c in low])
        for s in _chuoi_tat_ca(goi):
            assert not kds.tim_cum_cam(s, cam), (ten, kds.tim_cum_cam(s, cam), s)

    # Phong thuỷ phải nêu rõ quy tắc phân vai không mâu thuẫn Bát Trạch (hướng quay theo Bát Trạch, ngũ hành góc phòng theo Phi Tinh)
    assert "Bát trạch" in u_pt["nguyen_tac_uu_tien"] or "hướng quay" in u_pt["nguyen_tac_uu_tien"]
    assert len(u_pt["khu_vuc_van_9"]) >= 3


def test_dieu_hoa_van9_phan_ung_dung_voi_ngu_hoang_cuu_tu_tam_that():
    # 1. Cặp có Ngũ Hoàng (5) hoặc Nhị Hắc (2) -> bắt buộc phép Kim tiết khí + giữ tĩnh, không kích động nước
    sat_5 = ud.dieu_hoa_cung_van9(son=2, huong=5, luu_nien=5, van=9, khu_vuc="cua_chinh")
    assert sat_5["loai_phep"] == "tiet_khi_kim"
    assert "tĩnh" in sat_5["ung_dung"].lower() or "kim" in sat_5["ngu_hanh_dieu_hoa"].lower()

    # 2. Hướng tinh 9 đương vận sạch (không dính 2/5) -> phép kích hoạt vượng khí Cửu Tử / Nhất Bạch
    vuong_9 = ud.dieu_hoa_cung_van9(son=1, huong=9, luu_nien=1, van=9, khu_vuc="ban_lam_viec")
    assert vuong_9["loai_phep"] == "kich_vuong_van_9"

    # 3. Cặp 3-7 / 7-3 Kim Mộc giao chiến -> phép Thuỷ thông quan (Kim sinh Thuỷ, Thuỷ sinh Mộc)
    xung_37 = ud.dieu_hoa_cung_van9(son=3, huong=7, luu_nien=6, van=9, khu_vuc="phong_khach")
    assert xung_37["loai_phep"] == "thong_quan_thuy"


def test_ung_dung_co_dien_doi_xung_khung_vi_en_khong_ro_chu_viet():
    ngay_xem = dt.date(2026, 11, 10)
    sinh_bt = {"lich": dt.datetime(1990, 5, 15, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}
    sinh_tv = {"ngay": dt.date(1990, 5, 15), "ti": az.time_index(8, 30), "gioi_tinh": "nam", "tz_lich": 7.0}
    nha = {"huong_do": 180.0, "nam_xay": 2024, "theo": "cua"}
    sinh_pt = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 15)}

    v_bt = ud.tu_bao_cao_battu(btd.lap(sinh_bt, ngay_xem))
    v_tv = ud.tu_bao_cao_tuvi(tvd.lap(sinh_tv, ngay_xem))
    v_pt = ud.tu_bao_cao_phongthuy(ptds.luan_giai(sinh_pt, nha, ngay_xem=ngay_xem))

    with ngon_ngu.dung("en"):
        e_bt = ud.tu_bao_cao_battu(btd.lap(sinh_bt, ngay_xem))
        e_tv = ud.tu_bao_cao_tuvi(tvd.lap(sinh_tv, ngay_xem))
        e_pt = ud.tu_bao_cao_phongthuy(ptds.luan_giai(sinh_pt, nha, ngay_xem=ngay_xem))

    for ten, gv, ge in (("battu", v_bt, e_bt), ("tuvi", v_tv, e_tv), ("phongthuy", v_pt, e_pt)):
        assert dr.khung(gv) == dr.khung(ge), f"Lệch khung VI ↔ EN ở {ten}"
        for s in _chuoi_tat_ca(ge):
            assert not _VIET.search(s), f"Rò chữ Việt ở {ten} (EN): {s}"
