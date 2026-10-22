# -*- coding: utf-8 -*-
"""PT-81 — đủ 81 tổ hợp sơn tinh – hướng tinh CÓ THỨ TỰ (sơn = người ở & sức khoẻ, hướng = tiền bạc & công việc), mỗi tổ hợp
có nghĩa theo lĩnh vực, chỗ hợp, cách xử lý và sao kích hoạt (năm lưu niên tới cung → năm nên chủ động hơn / năm thuận).
Lời là lời cảnh báo, không doạ: không điểm số, không "cực hung", không tên bệnh, không vật phẩm hoá giải, không tiên đoán
năm/tuổi ốm. Test viết trước KB + hàm (quy tắc code)."""
from __future__ import annotations

import datetime as dt

from app.calc import huyen_khong as hk
from app.kb import phongthuy_kb
from app.kb.tuvi_doi_song_kb import tim_cum_cam
from app.luangiai import doi_song_khuon as kh, phongthuy_doi_song

LINH_VUC = {"tien_bac", "cong_viec", "gia_dao", "suc_khoe", "tam_ly"}
# Ngoài danh sách giọng AI chung: cụm doạ / tên bệnh / điểm số hay gặp trong bảng gốc (Drive) — cấm trong lớp đời thường.
CAM_THEM = ["bệnh", "cực hung", "cực xấu", "phá tài", "lừa đảo", "trộm cắp", "tang", "u bướu", "chấn thương", "phẫu thuật",
            "dao kéo", "nguy hiểm", "bộc phát", "tổn chủ", "điểm", "huyết áp", "trúng độc", "hoạ", "nạn"]


def _kb():
    return phongthuy_kb.huyen_khong()["to_hop_81"]


def _chu(m: dict) -> list[str]:
    return [m["ten"], m["y"], m["hop_cho"], m["luu_y"], *m["linh_vuc"].values()]


def test_du_81_to_hop_co_thu_tu_va_du_truong():
    t = _kb()
    assert len(t) == 81
    for s in range(1, 10):
        for h in range(1, 10):
            m = t[f"{s}-{h}"]
            assert m["ten"] and len(m["y"]) >= 40 and m["hop_cho"] and len(m["luu_y"]) >= 15, (s, h)
            assert m["nhom"] in ("thuan", "can_bang", "can_chu_dong")
            lv = m["linh_vuc"]
            assert set(lv) <= LINH_VUC and len(lv) >= 2 and all(len(v) >= 15 for v in lv.values()), (s, h)
            # cặp cần chủ động luôn nói rõ về sức khoẻ theo lối phòng ngừa (sơn tinh = người ở)
            if m["nhom"] == "can_chu_dong":
                assert "suc_khoe" in lv, (s, h)
            if "suc_khoe" in lv:
                assert "khám định kỳ" in lv["suc_khoe"] or "phòng ngừa" in lv["suc_khoe"], (s, h)
            kh_ = m["kich_hoat"]
            assert set(kh_) == {"chu_dong", "thuan"} and all(set(v) <= set(range(1, 10)) for v in kh_.values())
            assert 5 in kh_["chu_dong"] and 2 in kh_["chu_dong"]


def test_81_to_hop_khong_doa_khong_ten_benh_khong_vat_pham():
    cam = kh.cum_cam_chung()
    for ma, m in _kb().items():
        for s in _chu(m):
            assert not tim_cum_cam(s, cam), (ma, tim_cum_cam(s, cam), s)
            assert not tim_cum_cam(s, CAM_THEM), (ma, tim_cum_cam(s, CAM_THEM), s)
            assert "None" not in s


def test_dao_chieu_khac_nghia_theo_vai():
    t = _kb()
    for s in range(1, 10):
        for h in range(1, 10):
            if s == h:
                continue
            a, b = t[f"{s}-{h}"], t[f"{h}-{s}"]
            assert a["y"] != b["y"], (s, h)
            assert a["linh_vuc"] != b["linh_vuc"], (s, h)
    # cặp kinh điển: 2-5 / 5-2 đều cần chủ động; 1-4 và 4-1 thuận; 6-8 / 8-6 thuận; 3-7 / 7-3 cần chủ động
    for ma in ("2-5", "5-2", "3-7", "7-3", "5-5", "2-2"):
        assert t[ma]["nhom"] == "can_chu_dong", ma
    for ma in ("1-4", "4-1", "6-8", "8-6", "1-9", "9-1", "8-9", "9-8"):
        assert t[ma]["nhom"] == "thuan", ma


def test_to_hop_cung_dung_kb_81_va_nam_chu_y():
    x = hk.to_hop_cung(2, 5, 9)
    assert x["ma"] == "2-5" and x["muc"] == "can_chu_dong" and x["linh_vuc"]["suc_khoe"] and x["kich_hoat"]["chu_dong"]
    assert "Sơn tinh 2" in x["y"] and "hướng tinh 5" in x["y"] and "nam_chu_y" not in x
    y = hk.to_hop_cung(5, 2, 9)
    assert y["y"] != x["y"] and y["linh_vuc"] != x["linh_vuc"]
    # năm cần chú ý: sao lưu niên tới cung Khảm trong 10 năm từ 2026 — đối chiếu bằng vòng lặp độc lập
    z = hk.to_hop_cung(2, 5, 9, cung="Khảm", nam=2026)
    assert set(z["nam_chu_y"]) == {"chu_dong", "thuan"}
    mong = [n for n in range(2026, 2036) if hk.luu_nien(n)["cung"]["Khảm"] in z["kich_hoat"]["chu_dong"]]
    assert z["nam_chu_y"]["chu_dong"] == mong and mong
    assert all(2026 <= n < 2036 for n in z["nam_chu_y"]["thuan"])
    assert z["nam_chu_y"]["chu_dong"] == hk.nam_chu_y("Khảm", z["kich_hoat"], 2026)["chu_dong"]
    # cặp thuận 1-4 ở cung Tốn: năm thuận không rỗng trong 10 năm (sao 1/4/8/9 đều quay lại trong một chu kỳ 9 năm)
    w = hk.to_hop_cung(1, 4, 9, cung="Tốn", nam=2026)
    assert w["nam_chu_y"]["thuan"]


def test_bao_cao_nha_neu_nam_can_chu_dong_va_giu_giong_van():
    bc = phongthuy_doi_song.luan_giai({"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)},
                                      {"huong_do": 180.0, "nam_xay": 2008, "theo": "cua"}, ngay_xem=dt.date(2026, 5, 20))
    c2 = next(c for c in bc["chuong"] if c["ma"] == "ngoi_nha_voi_ban")
    van = " ".join(c2["doan"])
    assert "hướng tinh" in van.lower() and "sơn tinh" in van.lower()   # lĩnh vực theo vai
    assert "chủ động hơn" in van or "thuận" in van         # năm cần chú ý từ lưu niên
    assert kh.kiem_giong_van(bc) == [], kh.kiem_giong_van(bc)
    hk_ = bc["da_tinh"]["huyen_khong"]
    assert hk_ and hk_["cap_huong"]["ma"] and hk_["cap_huong"].get("nam_chu_y")
