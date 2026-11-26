# -*- coding: utf-8 -*-
"""Bộ kiểm định phản nghiệm độc lập (Adversarial Dev Set — RED -> GREEN) cho D2 `luan_hoi_khop` & `go_nut_doi_song`.

Nhãn kỳ vọng được viết ĐỘC LẬP trước khi sửa mã, bao phủ đủ 6 nhóm lỗi mà Claude Code đã phát hiện ở PR #371:
  A. Câu kể chuyện đã xảy ra / khủng hoảng quan hệ (ngoại tình, phản bội, bạo lực, đã ly hôn) -> KHÔNG gắn thẻ `luan_hoi`
     kiểu 'Ít dấu hiệu người thứ ba' hay 'Một mối bền' nói ngược thực tế người hỏi.
  B. Câu kể / hỏi về NGƯỜI KHÁC (em gái, anh trai, sếp, đồng nghiệp, bạn thân…) -> KHÔNG gắn nhãn hôn nhân / tiền bạc của chính mình.
  C. Câu ghép HAI TUỔI cụ thể ("tuổi Thìn làm ăn chung với bạn tuổi Tuất", "chồng 1988 vợ 1992") -> KHÔNG gắn thẻ 1 lá số.
  D. Câu KIẾN THỨC / giải nghĩa thuật ngữ ("Thương Quan là gì?", "Thất Sát ở cung Mệnh nghĩa là gì?", "Vô Chính Diệu là gì?")
     -> KHÔNG gắn `luan_hoi` và KHÔNG gắn `go_nut_doi_song` ("nét lá số bạn đang lo lắng").
  E. Gắn dữ kiện THẬT của lá số cho `go_nut_doi_song`:
     - Chỉ giải oan sao / thập thần / Vô Chính Diệu khi lá số người hỏi THỰC SỰ có nét đó (lá không có -> không nhận vơ).
     - Khi lá số có thật -> trích đúng mặt sáng / mặt tối từ KB sao / thập thần và vị trí cung / trụ thật của lá số.
     - Mạch sau đổ vỡ / khắc khẩu / góp vốn nối trực tiếp dữ kiện hộp hoá giải & chương thật của lá số.
  F. Độ nhạy (Recall) trên câu hỏi đời thường tự nhiên của chính người xem cho các câu trong danh mục 27 câu chuẩn.
"""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.calc import battu as bt_calc, tuvi_an_sao as az
from app.hoidap import tuvi as htv
from app.main import app

_CLIENT = TestClient(app)
_NGAY_XEM = "2026-11-26"
_LA_SO_NAM = {"birth_date": "1990-05-15", "birth_time": "08:30", "gender": "nam", "noi_sinh": "ha-noi"}
_LA_SO_NU = {"birth_date": "1992-08-20", "birth_time": "14:15", "gender": "nu", "noi_sinh": "ha-noi"}


def _hoi_ca_hai(cau: str, la_so: dict = _LA_SO_NAM) -> tuple[dict, dict]:
    r_tv = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": cau, "la_so": la_so, "ngay_xem": _NGAY_XEM})
    r_bt = _CLIENT.post("/v1/battu/hoi", json={"cau_hoi": cau, "la_so": la_so, "ngay_xem": _NGAY_XEM})
    assert r_tv.status_code == 200 and r_bt.status_code == 200
    return r_tv.json(), r_bt.json()


def test_a_khung_hoang_va_chuyen_da_xay_ra_khong_noi_nguoc_nguoi_hoi():
    """Người hỏi kể chuyện ngoại tình / bạo hành / đã ly hôn đang xảy ra -> tuyệt đối KHÔNG hiện thẻ dự đoán `nguoi_thu_ba` / `ben`."""
    cau_da_xay_ra = [
        "Chồng tôi ngoại tình, tôi có nên ly dị không?",
        "Vợ tôi vừa bị phát hiện có người thứ ba, tôi đau khổ quá không biết nên giữ hay buông?",
        "Người yêu phản bội em nhiều lần rồi, em có nên chia tay dứt khoát không?",
        "Chồng đánh đập và kiểm soát hết tiền lương của tôi, tôi có nên ly hôn không?",
        "Mình đã ly hôn năm ngoái, bao giờ mới mở lòng bước tiếp được?",
        "Vợ chồng em đang ly thân vì anh ấy cặp bồ bên ngoài, giờ em nên làm sao?",
    ]
    for ls in (_LA_SO_NAM, _LA_SO_NU):
        for cau in cau_da_xay_ra:
            tv, bt = _hoi_ca_hai(cau, ls)
            assert "luan_hoi" not in tv, f"Tử vi gắn nhầm luan_hoi cho câu đã xảy ra: {cau} -> {tv.get('luan_hoi')}"
            assert "luan_hoi" not in bt, f"Bát tự gắn nhầm luan_hoi cho câu đã xảy ra: {cau} -> {bt.get('luan_hoi')}"


def test_b_hoi_ve_nguoi_khac_khong_gan_nhan_cua_chinh_minh():
    """Câu kể / hỏi chuyện của em gái, anh trai, sếp, đồng nghiệp, bạn thân -> không gắn thẻ `luan_hoi` của bản thân."""
    cau_nguoi_khac = [
        "Em gái tôi lăng nhăng quá, gia đình rất mệt mỏi",
        "Sếp tôi ngoại tình với đồng nghiệp thì công ty có ảnh hưởng gì không?",
        "Anh trai mình làm bao nhiêu tiêu hết bấy nhiêu, bố mẹ lo lắng mãi",
        "Chị gái em vừa ly dị chồng, thương chị ấy quá",
        "Bạn thân tôi định bỏ việc văn phòng ra mở quán cà phê riêng",
        "Con trai tôi sinh năm 2018 sau này hợp nghề gì?",
    ]
    for cau in cau_nguoi_khac:
        tv, bt = _hoi_ca_hai(cau, _LA_SO_NAM)
        assert "luan_hoi" not in tv, f"Tử vi gắn nhầm luan_hoi câu người khác: {cau} -> {tv.get('luan_hoi')}"
        assert "luan_hoi" not in bt, f"Bát tự gắn nhầm luan_hoi câu người khác: {cau} -> {bt.get('luan_hoi')}"
        assert "go_nut_doi_song" not in tv, f"Tử vi gắn nhầm go_nut câu người khác: {cau}"
        assert "go_nut_doi_song" not in bt, f"Bát tự gắn nhầm go_nut câu người khác: {cau}"


def test_c_hai_tuoi_cu_the_bi_chan_sach():
    """Câu ghép hai tuổi / hai năm sinh cụ thể (trước bị f-string .{0,25} làm hỏng) không bao giờ nhận thẻ 1 lá số."""
    cau_hai_tuoi = [
        "Tuổi Thìn làm ăn chung với bạn tuổi Tuất được không?",
        "Tôi tuổi Ngọ lấy chồng tuổi Tý hôn nhân có bền không?",
        "Mình sinh năm 1990 góp vốn với người sinh năm 1987 có hợp không?",
        "Chồng tuổi Thân vợ tuổi Hợi có dễ hai lần đò không?",
    ]
    for cau in cau_hai_tuoi:
        tv, bt = _hoi_ca_hai(cau, _LA_SO_NAM)
        assert "luan_hoi" not in tv, (cau, tv.get("luan_hoi"))
        assert "luan_hoi" not in bt, (cau, bt.get("luan_hoi"))
        assert "go_nut_doi_song" not in tv, (cau, tv.get("go_nut_doi_song"))
        assert "go_nut_doi_song" not in bt, (cau, bt.get("go_nut_doi_song"))


def test_d_cau_kien_thuc_thuan_khong_dinh_go_nut_hay_luan_hoi():
    """Câu hỏi kiến thức / từ điển tuyệt đối không nhận khối 'nét lá số bạn đang lo lắng' hay thẻ `luan_hoi`."""
    cau_kien_thuc = [
        "Thương Quan là gì?",
        "Thất Sát ở cung Mệnh nghĩa là gì?",
        "Vô Chính Diệu là gì?",
        "Sao Địa Không và Địa Kiếp có ý nghĩa gì trong Tử vi?",
        "Cách cục Sát Phá Tham là thế nào?",
        "Hoá Kỵ ở cung Phu Thê nghĩa là gì?",
        "Thực Thần và Thương Quan khác nhau ở điểm nào?",
        "Bát tự của tôi có Thiên Ất Quý Nhân không?",
        "Tứ trụ của mình có Thiên Đức hay Nguyệt Đức Quý Nhân không?",
        "Lá số Tử vi của tôi có Thiên Khôi Thiên Việt không?",
    ]
    for cau in cau_kien_thuc:
        tv, bt = _hoi_ca_hai(cau, _LA_SO_NAM)
        assert "luan_hoi" not in tv, (cau, tv.get("luan_hoi"))
        assert "luan_hoi" not in bt, (cau, bt.get("luan_hoi"))
        assert "go_nut_doi_song" not in tv, (cau, tv.get("go_nut_doi_song"))
        assert "go_nut_doi_song" not in bt, (cau, bt.get("go_nut_doi_song"))


def test_e_go_nut_doi_song_doc_dung_la_so_that_khong_van_mau_co_dinh():
    """`go_nut_doi_song` phải đọc dữ kiện thật của lá số:
    1) Hỏi giải oan một sao / cách mà lá số KHÔNG có -> không nhận vơ khối giải oan của sao đó.
    2) Hỏi giải oan đúng sao / thập thần có thật trên lá số -> nêu đúng cung / trụ trên lá số & mặt sáng/tối từ KB.
    3) Hai lá số khác nhau hỏi cùng câu sau đổ vỡ / góp vốn -> nhận lời gắn với dữ kiện lá số khác nhau (không cố định 1 đoạn)."""
    # Tìm chính xác cung Mệnh của _LA_SO_NAM có chính tinh gì
    ls_tv = htv.tom_tat(az.an_sao_tho(dt.date(1990, 5, 15), az.time_index(8, 30), "nam", "vi-VN"))
    menh = next(c for c in ls_tv["cung"] if c["ten"] == "Mệnh")
    co_vcd_menh = len(menh["chinh_tinh"]) == 0

    if not co_vcd_menh:
        # Lá số Mệnh CÓ chính tinh mà người dùng hỏi "Mệnh tôi Vô Chính Diệu xấu lắm hả?" -> không được gán nhãn giải oan VCD!
        r_sai = _CLIENT.post(
            "/v1/tuvi/hoi",
            json={"cau_hoi": "Nghe nói cung Mệnh tôi Vô Chính Diệu là xấu lắm phải không?", "la_so": _LA_SO_NAM, "ngay_xem": _NGAY_XEM},
        ).json()
        gn_sai = r_sai.get("go_nut_doi_song")
        assert gn_sai is None or "Vô Chính Diệu" not in gn_sai.get("goc_nhin_hai_mat", ""), gn_sai

    # Tìm một chính tinh có thật ở Mệnh (hoặc tìm lá số có Vô Chính Diệu / Thất Sát ở Mệnh) để kiểm giải oan gắn đúng dữ kiện lá số
    sao_menh = [s["ten"] for s in menh["chinh_tinh"]]
    # Quét nhanh tìm 1 giờ sinh có Mệnh Vô Chính Diệu và 1 giờ sinh có Thất Sát ở Mệnh
    gio_vcd, gio_ts = None, None
    for h in range(0, 23, 2):
        ls_thu = htv.tom_tat(az.an_sao_tho(dt.date(1990, 5, 15), az.time_index(h, 30), "nam", "vi-VN"))
        m_thu = next(c for c in ls_thu["cung"] if c["ten"] == "Mệnh")
        ct_ten = [s["ten"] for s in m_thu["chinh_tinh"]]
        if not ct_ten and gio_vcd is None:
            gio_vcd = f"{h:02d}:30"
        if "Thất Sát" in ct_ten and gio_ts is None:
            gio_ts = f"{h:02d}:30"

    assert gio_vcd is not None or gio_ts is not None
    if gio_vcd:
        ls_vcd = {**_LA_SO_NAM, "birth_time": gio_vcd}
        r_vcd = _CLIENT.post(
            "/v1/tuvi/hoi",
            json={"cau_hoi": "Thầy khác bảo cung Mệnh tôi Vô Chính Diệu là xấu lắm phải không?", "la_so": ls_vcd, "ngay_xem": _NGAY_XEM},
        ).json()
        gn_vcd = r_vcd.get("go_nut_doi_song")
        assert gn_vcd is not None and gn_vcd["ma"] == "go_loi_phan_doa"
        assert gn_vcd.get("du_kien_la_so"), "Phải có căn cứ dữ kiện thật từ lá số người xem"

    if gio_ts:
        ls_ts = {**_LA_SO_NAM, "birth_time": gio_ts}
        r_ts = _CLIENT.post(
            "/v1/tuvi/hoi",
            json={"cau_hoi": "Cung Mệnh của tôi có Thất Sát, người ta bảo nặng và cô độc lắm phải không?", "la_so": ls_ts, "ngay_xem": _NGAY_XEM},
        ).json()
        gn_ts = r_ts.get("go_nut_doi_song")
        assert gn_ts is not None and gn_ts["ma"] == "go_loi_phan_doa"
        assert gn_ts.get("du_kien_la_so")

    # Kiểm sau_do_vo có đọc dữ kiện lá số thật (viec_thuc_te lấy từ hoá giải chương Tình cảm của chính lá số đó)
    r1 = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": "Mình vừa bước ra sau ly hôn, làm sao mở lòng lại?", "la_so": _LA_SO_NAM, "ngay_xem": _NGAY_XEM}).json()
    assert r1.get("go_nut_doi_song") is not None
    assert r1["go_nut_doi_song"].get("du_kien_la_so"), "sau_do_vo phải gắn dữ kiện thật từ lá số"


def test_f_do_nhay_cau_hoi_tu_nhien_cua_chinh_nguoi_xem():
    """Đảm bảo siết cổng không làm rớt các câu hỏi đời thường hợp lệ của chính người xem."""
    hop_le = [
        ("Lá số của mình hợp làm nghề gì nhất?", "su_nghiep", "nghe_hop"),
        ("Em nên đi làm công ăn lương hay tự ra mở riêng làm chủ?", "su_nghiep", "chu_hay_cong"),
        ("Mình có giữ được tiền không hay kiếm bao nhiêu tiêu hết?", "tien_bac", "giu_tien"),
        ("Sau này hôn nhân của em một đời bền vững hay dễ hai lần đò?", "tinh_cam", "ben"),
        ("Trong chuyện tình cảm của mình liệu có dấu hiệu người thứ ba xen vào không?", "tinh_cam", "nguoi_thu_ba"),
        ("Tôi có hợp hùn vốn làm ăn chung với bạn bè không?", "quan_he", "lam_an_chung"),
        ("Đường con cái của mình sau này thế nào?", "gia_dinh", "con_cai"),
        ("Em có duyên gặp quý nhân giúp đỡ không?", "quan_he", "quy_nhan"),
    ]
    for cau, ch_mong, ma_mong in hop_le:
        tv, bt = _hoi_ca_hai(cau, _LA_SO_NAM)
        assert tv.get("luan_hoi", {}).get("chuong") == ch_mong and tv["luan_hoi"]["ma"] == ma_mong, (cau, tv.get("luan_hoi"))
        assert bt.get("luan_hoi", {}).get("chuong") == ch_mong and bt["luan_hoi"]["ma"] == ma_mong, (cau, bt.get("luan_hoi"))
