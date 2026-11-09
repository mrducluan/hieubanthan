# -*- coding: utf-8 -*-
"""Ý2 (DANH-GIA-HYBRID-TWO-TIER mục 8) — chương "Điều bạn đã xác nhận" trong Chân dung tổng hợp: dựng từ phiếu `ca_nhan`
của CHÍNH người xem (mã hộp, không chữ) qua lớp giao thoa; hộp giữ mã ds.giao_thoa.* + phái giao_thoa_1; < 2 phiếu Đúng →
chỉ lời mời. Chương nằm sau "Năm nay", trước "Việc nên làm" (mở bằng Sao như mọi chương sau chương 1). Viết TRƯỚC khi nối."""
from __future__ import annotations

import datetime as dt
import json

from fastapi.testclient import TestClient

from app.luangiai import chan_dung_tong_hop as cd
from app.luangiai import doi_song_khuon as kh
from app.main import app

client = TestClient(app)
XEM = dt.date(2026, 11, 6)
TV = {"ngay": dt.date(1988, 10, 24), "ti": 4, "gioi_tinh": "nam"}
BT = {"lich": dt.datetime(1988, 10, 24, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}
PHIEU = {"ds.su_nghiep.thien_co.sang.thuan": "dung", "ds.bt.su_nghiep.chinh_quan.thuan.hien_tai": "dung",
         "ds.bt.tien_bac.chinh_tai.can_chu_dong.hien_tai": "dung", "ds.tien_bac.vu_khuc.can_chu_dong": "dung"}


def _ch(bc: dict, ma: str) -> dict:
    return next(c for c in bc["chuong"] if c["ma"] == ma)


def test_vi_tri_chuong_va_khuon():
    bc = cd.lap(TV, BT, {}, XEM)
    ma = [c["ma"] for c in bc["chuong"]]
    assert ma == cd.THU_TU_CHUONG
    assert ma.index("da_xac_nhan") == ma.index("nam_nay") + 1 and ma[-1] == "loi_khuyen"
    c = _ch(bc, "da_xac_nhan")
    assert c["tieu_de"] and c["cau_tu_soi"] and "moi_xem" in c and c["so_xac_nhan"] == 0
    assert kh.kiem_giong_van(bc) == []


def test_khong_phieu_chi_loi_moi():
    bc = cd.lap(TV, BT, {}, XEM, ca_nhan=None)
    c = _ch(bc, "da_xac_nhan")
    assert c["hop"] == [] and "Đúng với mình" in c["tom_tat"]
    # một phiếu Đúng chưa đủ
    bc1 = cd.lap(TV, BT, {}, XEM, ca_nhan={"ds.su_nghiep.thien_co.sang.thuan": "dung"})
    c1 = _ch(bc1, "da_xac_nhan")
    assert c1["hop"] == [] and c1["so_xac_nhan"] == 1


def test_co_phieu_du_hop_giao_thoa_giu_ma_va_phai():
    bc = cd.lap(TV, BT, {}, XEM, ca_nhan=PHIEU)
    c = _ch(bc, "da_xac_nhan")
    assert c["so_xac_nhan"] == 4 and c["hop"]
    for h in c["hop"]:
        assert h["ma_mau"].startswith("ds.giao_thoa.") and h["phai"] == "giao_thoa_1" and h["nguon"] == "giao_thoa"
        assert h["loai"] in kh.LOAI_HOP and h["tieu_de"] and h["noi_dung"]
    # hai môn cùng xác nhận mảng công việc (luật A) + tiền bạc
    assert any(".cong_viec." in h["ma_mau"] for h in c["hop"]) and any(".tien_bac." in h["ma_mau"] for h in c["hop"])
    assert "Công việc" in c["tom_tat"] or "việc" in c["tom_tat"].lower()
    # không mã nào lặp trong cả bài; chương khác không đổi vì có phiếu (ngoài xếp lại hộp "chưa đúng")
    ma = [h["ma_mau"] for ch in bc["chuong"] for h in ch["hop"]]
    assert len(ma) == len(set(ma))
    assert kh.kiem_giong_van(bc) == []


def test_phieu_lan_chua_dung_khong_lap_net_da_phu_nhan():
    phieu = {**PHIEU, "ds.tinh_cam.tham_lang.can_bang": "dung", "ds.bt.tinh_cam.thuc_than.can_bang.hien_tai": "chua_dung"}
    bc = cd.lap(TV, BT, {}, XEM, ca_nhan=phieu)
    c = _ch(bc, "da_xac_nhan")
    assert c["so_chua_dung"] == 1 and any("chưa đúng" in d for d in c["doan"])
    # luật C: mảng tình cảm vừa đúng vừa chưa đúng → hộp "chỗ chưa khớp", không hộp "cùng nói trúng" cho tình cảm
    lech = [h for h in c["hop"] if h["ma_mau"] == "ds.giao_thoa.tinh_cam.lech"]
    assert lech and not any(h["ma_mau"].startswith("ds.giao_thoa.tinh_cam.mon.") for h in c["hop"])


def test_dau_ra_khong_mang_chu_nguoi_dung_chi_ma():
    """Phiếu chỉ là mã; đầu ra chương không chứa khoá lạ do người gọi gửi."""
    la = {"ds.su_nghiep.ok.thuan": "dung", "ds.bt.su_nghiep.ok.thuan": "dung", "toi ten la An <script>": "dung", "ds.x.y": "khong_hop_le"}
    bc = cd.lap(TV, BT, {}, XEM, ca_nhan=la)
    s = json.dumps(bc, ensure_ascii=False)
    assert "toi ten la An" not in s and "<script>" not in s
    assert _ch(bc, "da_xac_nhan")["so_xac_nhan"] == 2


def test_route_chan_dung_nhan_ca_nhan():
    r = client.post("/v1/chan-dung", json={"la_so": {"birth_date": "1988-10-24", "birth_time": "08:30", "gender": "nam", "noi_sinh": "ha-noi"},
                                         "ngay_xem": XEM.isoformat(), "ca_nhan": PHIEU})
    assert r.status_code == 200, r.text
    c = next(c for c in r.json()["chuong"] if c["ma"] == "da_xac_nhan")
    assert c["hop"] and c["hop"][0]["ma_mau"].startswith("ds.giao_thoa.")
