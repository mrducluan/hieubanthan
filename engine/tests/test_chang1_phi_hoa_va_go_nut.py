# -*- coding: utf-8 -*-
"""Kiểm định Chặng 1 (Lát cắt 1.2):
1. Chuỗi Phi Hoá bậc 2 (`chuoi_chuyen_ky`: Kỵ chuyển Kỵ & Lộc chuyển Kỵ, phái `luong_phai_phi_tinh`) trong
   `calc/tuvi_phi_hoa.py` và `luangiai/tuvi_phi_hoa.py` — kiểm toán học từng bước trên 3 lá số thật + đối xứng VI ↔ EN.
2. Kho Gỡ Nút Đời Sống (`go_nut_doi_song_kb.json` + `en/` + `luangiai/go_nut_doi_song.py`) cho 4 mạch khuyết lớn:
   - `sau_do_vo`: Phục hồi & mở lòng sau ly hôn / chia tay
   - `khac_khau_vo_chong`: Hoà giải vợ chồng khắc khẩu, lục đục
   - `gop_von_phan_vai`: Hợp tác góp vốn & nguyên tắc phân vai
   - `go_loi_phan_doa`: Giải oan 2 mặt các cách cục hay bị thầy dọa (Vô Chính Diệu, Không Kiếp, Thất Sát, Thương Quan…)
   Nối vào `/v1/tuvi/hoi` và `/v1/battu/hoi`, sạch `cum_cam_chung`, không rò ở câu khủng hoảng/từ chối, khớp VI ↔ EN."""
from __future__ import annotations

import datetime as dt
import re

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.calc import tuvi_an_sao as az, tuvi_phi_hoa as ph_calc
from app.calc.tuvi_luu_nguyet import TU_HOA
from app.hoidap import tuvi as htv
from app.kb import tuvi_doi_song_kb as kds
from app.luangiai import doi_song_khuon as kh, tuvi_phi_hoa as ph_luan
from app.main import app
from tests import _dau_ra as dr

_CLIENT = TestClient(app)
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_LA_SO_IN = {"birth_date": "1990-05-15", "birth_time": "08:30", "gender": "nam", "noi_sinh": "ha-noi"}
_NGAY_XEM = "2026-11-10"


def test_chuoi_chuyen_ky_khop_toan_hoc_tren_3_la_so_mau_va_song_ngu():
    cam = kh.cum_cam_chung()
    ba_la = [
        (dt.date(1990, 5, 15), az.time_index(8, 30), "nam"),
        (dt.date(1988, 10, 24), az.time_index(8, 30), "nam"),
        (dt.date(1993, 2, 28), az.time_index(14, 15), "nu"),
    ]
    for ngay, ti, gt in ba_la:
        ls = htv.tom_tat(az.an_sao_tho(ngay, ti, gt, "vi-VN"))
        cung = ls["cung"]
        theo_ten = {c["ten"]: c for c in cung}
        chuoi = ph_calc.chuoi_chuyen_ky(cung)
        assert len(chuoi) >= 2
        for ch in chuoi:
            assert ch["loai"] in ("ky_chuyen_ky", "loc_chuyen_ky")
            assert ch["phai"] == "luong_phai_phi_tinh"
            c_goc = theo_ten[ch["tu_cung"]]
            c_giua = theo_ten[ch["qua_cung"]]
            assert ch["tu_cung"] != ch["qua_cung"]
            # Kiểm toán học bước 1: can cung gốc hoá đúng sao 1 rơi vào qua_cung
            idx_hoa_1 = 3 if ch["loai"] == "ky_chuyen_ky" else 0
            assert TU_HOA[c_goc["can"]][idx_hoa_1] == ch["sao_dau"]
            # Kiểm toán học bước 2 (Chuyển Kỵ): can của qua_cung hoá Kỵ đúng sao_chuyen rơi vào den_cung
            assert TU_HOA[c_giua["can"]][3] == ch["sao_chuyen"]
            c_dich = theo_ten[ch["den_cung"]]
            sao_dich = [s["ten"] for s in c_dich["chinh_tinh"]] + list(c_dich["phu_tinh"])
            assert ch["sao_chuyen"] in sao_dich

        # Kiểm tầng luận giải + đối xứng khung VI ↔ EN
        can_nam = ls["can_nam"] if "can_nam" in ls else "Canh"
        kq_vi = ph_luan.lap(ls, can_nam, nam_xem=2027)
        assert kq_vi.get("chuoi_chuyen_ky")
        for muc in kq_vi["chuoi_chuyen_ky"]:
            for truong in ("tieu_de", "nghia", "viec_nen_lam"):
                assert muc[truong] and not kds.tim_cum_cam(muc[truong], cam), muc

        with ngon_ngu.dung("en"):
            kq_en = ph_luan.lap(ls, can_nam, nam_xem=2027)
        assert dr.khung(kq_vi["chuoi_chuyen_ky"]) == dr.khung(kq_en["chuoi_chuyen_ky"])
        for muc in kq_en["chuoi_chuyen_ky"]:
            for truong in ("tieu_de", "nghia", "viec_nen_lam"):
                assert not _VIET.search(muc[truong]), f"Rò chữ Việt: {muc[truong]}"


def test_go_nut_doi_song_4_mach_khuyet_tren_tuvi_va_battu():
    cam = kh.cum_cam_chung()
    cac_ca_3_mach = [
        ("Mình vừa bước ra sau ly hôn, bao giờ mới sẵn sàng mở lòng lại?", "sau_do_vo"),
        ("Dạo này hai vợ chồng hay khắc khẩu cãi nhau vì chuyện nhỏ, làm sao hạ nhiệt?", "khac_khau_vo_chong"),
        ("Tôi định hùn vốn mở cửa hàng với bạn, nên phân vai giữ tiền thế nào?", "gop_von_phan_vai"),
    ]
    for cau, ma_mong_doi in cac_ca_3_mach:
        for url in ("/v1/tuvi/hoi", "/v1/battu/hoi"):
            r = _CLIENT.post(url, json={"cau_hoi": cau, "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM})
            assert r.status_code == 200, (url, cau, r.text)
            gn = r.json().get("go_nut_doi_song")
            assert gn is not None and gn["ma"] == ma_mong_doi, (url, cau, gn)
            assert gn.get("du_kien_la_so") and gn["tieu_de"] and gn["goc_nhin_hai_mat"] and len(gn["viec_thuc_te"]) >= 2
            for s in (gn["tieu_de"], gn["du_kien_la_so"], gn["goc_nhin_hai_mat"], *gn["viec_thuc_te"]):
                assert not kds.tim_cum_cam(s, cam), (url, ma_mong_doi, s)

    # Giải oan lá số (`go_loi_phan_doa`): chỉ gắn khi lá số người xem THỰC SỰ có sao / thập thần đó
    ls_tv = htv.tom_tat(az.an_sao_tho(dt.date(1990, 5, 15), az.time_index(8, 30), "nam", "vi-VN"))
    sao_co_that = next(
        s["ten"] for c in ls_tv["cung"] for s in c["chinh_tinh"]
        if s["ten"] in ("Thất Sát", "Phá Quân", "Liêm Trinh", "Cự Môn", "Tham Lang")
    )
    r_tv_go = _CLIENT.post(
        "/v1/tuvi/hoi",
        json={"cau_hoi": f"Thầy khác bảo lá số tôi có sao {sao_co_that} là nặng lắm phải không?", "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM},
    ).json()
    assert r_tv_go.get("go_nut_doi_song", {}).get("ma") == "go_loi_phan_doa"
    assert sao_co_that in r_tv_go["go_nut_doi_song"]["du_kien_la_so"]

    # Tìm 1 ngày sinh có Thương Quan trên tứ trụ để kiểm giải oan Bát tự gắn đúng trụ thật
    ls_bt_tq = {"birth_date": "1990-06-15", "birth_time": "12:00", "gender": "nu", "noi_sinh": "ha-noi"}
    r_bt_go = _CLIENT.post(
        "/v1/battu/hoi",
        json={"cau_hoi": "Nghe nói lá số của em có Thương Quan là trắc trở chuyện chồng con lắm hả?", "la_so": ls_bt_tq, "ngay_xem": _NGAY_XEM},
    ).json()
    if "Thương Quan" in str(r_bt_go.get("la_so", {}).get("thap_than_can")) or "Thương Quan" in str(r_bt_go.get("la_so", {}).get("tang_can_thap_than")):
        assert r_bt_go.get("go_nut_doi_song", {}).get("ma") == "go_loi_phan_doa"
        assert "Thương Quan" in r_bt_go["go_nut_doi_song"]["du_kien_la_so"]

    # Không bao giờ gắn go_nut_doi_song ở câu khủng hoảng, câu kiến thức hoặc thiếu lá số
    r_kh = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": "Sau ly hôn tôi tuyệt vọng muốn chết đi cho xong", "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM})
    assert "go_nut_doi_song" not in r_kh.json()
    r_kt = _CLIENT.post("/v1/battu/hoi", json={"cau_hoi": "Thương Quan là gì?", "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM})
    assert "go_nut_doi_song" not in r_kt.json()

    # Kiểm bản tiếng Anh hoạt động sạch chữ Việt và có du_kien_la_so tiếng Anh
    r_en = _CLIENT.post(
        "/v1/battu/hoi",
        json={"cau_hoi": "After my divorce, how should I rebuild and open up again?", "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM},
        headers={"x-ngon-ngu": "en"},
    )
    assert r_en.status_code == 200
    gn_en = r_en.json().get("go_nut_doi_song")
    assert gn_en is not None and gn_en["ma"] == "sau_do_vo" and gn_en.get("du_kien_la_so")
    for s in (gn_en["tieu_de"], gn_en["du_kien_la_so"], gn_en["goc_nhin_hai_mat"], *gn_en["viec_thuc_te"]):
        assert not _VIET.search(s), f"Rò chữ Việt ở go_nut_doi_song (EN): {s}"
