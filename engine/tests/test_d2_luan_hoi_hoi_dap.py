# -*- coding: utf-8 -*-
"""Kiểm định Chặng 0 (Mục D2 nâng cấp): đồng bộ 27 nhãn `luan_hoi` (LH-1 / LH-2) vào Hỏi đáp Tử vi & Bát tự,
kèm mã kiểm chứng `ma_mau` nuôi ngược về DB (0017) và liên kết chương báo cáo."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.calc import tuvi_an_sao as az
from app.luangiai import battu_doi_song as btd
from app.luangiai import tuvi_doi_song as tvd
from app.main import app

_CLIENT = TestClient(app)
_NGAY_XEM = dt.date(2026, 11, 10)
_SINH_TV = {"ngay": dt.date(1990, 5, 15), "ti": az.time_index(8, 30), "gioi_tinh": "nam", "tz_lich": 7.0}
_SINH_BT = {"lich": dt.datetime(1990, 5, 15, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}
_LA_SO_IN = {"birth_date": "1990-05-15", "birth_time": "08:30", "gender": "nam", "noi_sinh": "ha-noi"}


def test_27_cau_chuan_khop_100_phan_tram_nhan_va_ma_mau_voi_bao_cao():
    """Mọi câu trong 27 câu hỏi của `tuvi_luan_hoi_kb.json` khi hỏi ở `/v1/tuvi/hoi` và `/v1/battu/hoi` đều trả về
    đúng `nhan`, `tra_loi`, `sac`, `ma_mau` và `chuong` của báo cáo 99 Sao (không bao giờ trống hay lệch lời)."""
    kb_path = Path(__file__).resolve().parents[1] / "app" / "kb" / "data" / "tuvi_luan_hoi_kb.json"
    ds_cau = json.loads(kb_path.read_text(encoding="utf-8"))["cau"]

    bc_tv = tvd.lap(_SINH_TV, _NGAY_XEM)
    bc_bt = btd.lap(_SINH_BT, _NGAY_XEM)
    map_tv = {(c["ma"], t["ma"]): (c["tieu_de"], t) for c in bc_tv["chuong"] if c.get("luan_hoi") for t in c["luan_hoi"]["tra_loi"]}
    map_bt = {(c["ma"], t["ma"]): (c["tieu_de"], t) for c in bc_bt["chuong"] if c.get("luan_hoi") for t in c["luan_hoi"]["tra_loi"]}
    assert len(map_tv) == 27 and len(map_bt) == 27

    for ch, cac_cau in ds_cau.items():
        for muc in cac_cau:
            ma = muc["ma"]
            q = muc["cau"]

            r_tv = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": q, "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM.isoformat()})
            assert r_tv.status_code == 200, (ch, ma, r_tv.text)
            lh_tv = r_tv.json().get("luan_hoi")
            assert lh_tv is not None, f"Tử vi bỏ sót câu chuẩn: ({ch}, {ma}) -> {q}"
            td_tv, goc_tv = map_tv[(ch, ma)]
            assert lh_tv["chuong"] == ch and lh_tv["ma"] == ma
            assert lh_tv["nhan"] == goc_tv["nhan"]
            assert lh_tv["tra_loi"] == goc_tv["tra_loi"]
            assert lh_tv["ma_mau"] == goc_tv["ma_mau"]
            assert lh_tv["phai"] == "nam_phai_viet"
            assert lh_tv["ten_chuong"] == td_tv

            r_bt = _CLIENT.post("/v1/battu/hoi", json={"cau_hoi": q, "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM.isoformat()})
            assert r_bt.status_code == 200, (ch, ma, r_bt.text)
            lh_bt = r_bt.json().get("luan_hoi")
            assert lh_bt is not None, f"Bát tự bỏ sót câu chuẩn: ({ch}, {ma}) -> {q}"
            td_bt, goc_bt = map_bt[(ch, ma)]
            assert lh_bt["chuong"] == ch and lh_bt["ma"] == ma
            assert lh_bt["nhan"] == goc_bt["nhan"]
            assert lh_bt["tra_loi"] == goc_bt["tra_loi"]
            assert lh_bt["ma_mau"] == goc_bt["ma_mau"]
            assert lh_bt["phai"] == "tu_binh"
            assert lh_bt["ten_chuong"] == td_bt


def test_dien_dat_doi_thuong_cung_khop_dung_nhan_bao_cao():
    """Người dùng hỏi bằng lời tự nhiên (không chép nguyên câu mẫu) vẫn khớp đúng mã `luan_hoi`."""
    mau_doi_thuong = [
        ("Mình hợp làm nghề gì nhất nhỉ?", "su_nghiep", "nghe_hop"),
        ("Em nên đi làm thuê tiếp hay tách ra mở riêng làm chủ?", "su_nghiep", "chu_hay_cong"),
        ("Số tôi có giữ được tiền không hay làm bao nhiêu tiêu hết?", "tien_bac", "giu_tien"),
        ("Vợ chồng mình một đời bền vững hay dễ hai lần đò?", "tinh_cam", "ben"),
        ("Chuyện tình cảm của em có dấu hiệu người thứ ba xen vào không?", "tinh_cam", "nguoi_thu_ba"),
        ("Tôi có nên hùn vốn làm ăn chung với bạn bè không?", "quan_he", "lam_an_chung"),
    ]
    for cau, ch_ky_vong, ma_ky_vong in mau_doi_thuong:
        d_tv = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": cau, "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM.isoformat()}).json()
        assert d_tv.get("luan_hoi", {}).get("chuong") == ch_ky_vong, (cau, d_tv.get("luan_hoi"))
        assert d_tv["luan_hoi"]["ma"] == ma_ky_vong

        d_bt = _CLIENT.post("/v1/battu/hoi", json={"cau_hoi": cau, "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM.isoformat()}).json()
        assert d_bt.get("luan_hoi", {}).get("chuong") == ch_ky_vong, (cau, d_bt.get("luan_hoi"))
        assert d_bt["luan_hoi"]["ma"] == ma_ky_vong


def test_hang_rao_an_toan_gio_tam_nguoi_than_tre_vi_thanh_nien_va_ban_anh():
    """Không bao giờ gắn nhãn `luan_hoi` khi: (1) không rõ giờ sinh (`do_tin_gio='unknown'`), (2) xem lá số người thân,
    (3) người dưới 16 tuổi, (4) câu khủng hoảng/đặc biệt, hoặc (5) bản tiếng Anh."""
    # 1. Không rõ giờ sinh -> chặn luan_hoi để tránh phán nhãn mạnh trên giờ tạm 12:00
    ls_khong_gio = {**_LA_SO_IN, "do_tin_gio": "unknown"}
    d_kg = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": "Tôi hợp nghề gì?", "la_so": ls_khong_gio, "ngay_xem": _NGAY_XEM.isoformat()}).json()
    assert "luan_hoi" not in d_kg and "doi_song_lien_ket" not in d_kg

    # 2. Xem người thân -> không gắn mã kiểm chứng cá nhân
    d_nt = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": "Tôi hợp nghề gì?", "la_so": _LA_SO_IN, "nguoi_than": True, "ngay_xem": _NGAY_XEM.isoformat()}).json()
    assert "luan_hoi" not in d_nt and "doi_song_lien_ket" not in d_nt

    # 3. Dưới 16 tuổi -> không có luan_hoi
    ls_nho = {**_LA_SO_IN, "birth_date": "2014-05-15"}
    d_nho = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": "Tôi hợp nghề gì?", "la_so": ls_nho, "ngay_xem": _NGAY_XEM.isoformat()}).json()
    assert "luan_hoi" not in d_nho

    # 4. Câu có đối tượng cụ thể thứ hai ("với tuổi Ngọ") -> không nhận nhầm thành câu bản mệnh lam_an_chung
    d_hai = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": "Tôi hợp tác làm ăn với tuổi Ngọ được không?", "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM.isoformat()}).json()
    assert "luan_hoi" not in d_hai

    # 5. Bản tiếng Anh -> không sinh trường luan_hoi tiếng Việt
    with ngon_ngu.dung("en"):
        from app.hoidap import tuvi as htv
        kq_en = htv.tra_loi("What career suits me best?", sinh=_SINH_TV, ngay_xem=_NGAY_XEM)
    assert "luan_hoi" not in kq_en and "doi_song_lien_ket" not in kq_en


def test_cau_mang_doi_song_khac_co_doi_song_lien_ket_ma_mau():
    """Câu hỏi về mảng sức khoẻ / nhà cửa (không nằm trong 27 câu luan_hoi) vẫn trả `doi_song_lien_ket` có `ma_mau` + `chuong`
    để khung chat hiện nút Kiểm chứng (0017) và dẫn về chương tương ứng."""
    d_sk = _CLIENT.post("/v1/tuvi/hoi", json={"cau_hoi": "Sức khoẻ của tôi nhìn chung thế nào?", "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM.isoformat()}).json()
    assert "luan_hoi" not in d_sk
    lk = d_sk.get("doi_song_lien_ket")
    assert lk is not None and lk["chuong"] == "suc_khoe" and lk["ma_mau"].startswith("ds.") and lk["phai"] == "nam_phai_viet"


def test_an_toan_khung_hoang_tu_choi_can_them_va_giong_van_27_cau():
    """Mọi câu khủng hoảng, từ chối, dẫn hướng tâm linh hoặc thiếu dữ liệu (`can_them`) tuyệt đối KHÔNG mang `luan_hoi` hay
    `doi_song_lien_ket`; đồng thời văn bản của toàn bộ 27 mục `luan_hoi` sạch cụm giọng AI (`cum_cam_chung`)."""
    from app.kb import tuvi_doi_song_kb as kds
    from app.luangiai import doi_song_khuon as kh

    cac_cau_chan = [
        ("Mệnh có Địa Kiếp, sống tiếp làm gì nữa, muốn chết đi cho xong", _LA_SO_IN),     # an_toan (khủng hoảng)
        ("Tôi sống được đến bao nhiêu tuổi thì chết?", _LA_SO_IN),                        # tu_choi_nhe (tuổi thọ)
        ("Nhà tôi có bị vong theo hay duyên âm không?", _LA_SO_IN),                       # dan_huong (tâm linh)
        ("Công ty tôi nên tuyển nhân viên nào trong hai ứng viên này?", _LA_SO_IN),       # tu_choi_nhe (tuyển dụng)
        ("Tôi hợp nghề gì?", None),                                                       # can_them = ['la_so']
    ]
    for cau, ls_in in cac_cau_chan:
        for url in ("/v1/tuvi/hoi", "/v1/battu/hoi"):
            body = {"cau_hoi": cau, "ngay_xem": _NGAY_XEM.isoformat(), **({"la_so": ls_in} if ls_in else {})}
            d = _CLIENT.post(url, json=body).json()
            assert "luan_hoi" not in d and "doi_song_lien_ket" not in d, (url, cau, d.keys())

    cam = kh.cum_cam_chung()
    kb_path = Path(__file__).resolve().parents[1] / "app" / "kb" / "data" / "tuvi_luan_hoi_kb.json"
    ds_cau = json.loads(kb_path.read_text(encoding="utf-8"))["cau"]
    for ch, cac_cau in ds_cau.items():
        for muc in cac_cau:
            for url in ("/v1/tuvi/hoi", "/v1/battu/hoi"):
                lh = _CLIENT.post(url, json={"cau_hoi": muc["cau"], "la_so": _LA_SO_IN, "ngay_xem": _NGAY_XEM.isoformat()}).json()["luan_hoi"]
                for truong in ("tra_loi", "giai_thich", "ghi_chu"):
                    van = lh.get(truong) or ""
                    if van:
                        assert not kds.tim_cum_cam(van, cam), (url, ch, muc["ma"], truong, van)

