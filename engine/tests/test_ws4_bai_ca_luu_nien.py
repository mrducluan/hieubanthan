# -*- coding: utf-8 -*-
"""WS-4 — câu bài ca lưu niên «流年運氣部位歌» (Thần Tướng Toàn Biên) cho đúng tuổi: nguyên văn khớp kho nguồn, phủ đủ
1–100 không chồng, tên bộ vị KB khớp chữ sách (tuổi 10–14 là Nhân Luân, Địa Luân), ra ở chương "Năm nay" và hỏi đáp."""
import datetime as dt
import json
from pathlib import Path

from app.kb import nhan_tuong_kb as kb
from app.luangiai import nhan_tuong

NGUON = Path(__file__).parent.parent / "fixtures" / "nguon" / "than_tuong_toan_bien.json"
BAI = next(t["van"] for t in json.loads(NGUON.read_text("utf-8"))["thien"] if t["ten"].endswith("流年運氣部位歌"))
CHANG = kb._lay("bai_ca_luu_nien")["chang"]


def test_moi_chang_la_nguyen_van_va_dung_thu_tu():
    vi_tri = []
    for c in CHANG:
        assert c["han"] in BAI, c
        assert c["y"].strip(), c
        vi_tri.append(BAI.index(c["han"]))
    assert vi_tri == sorted(vi_tri)


def test_phu_du_1_den_100_khong_chong():
    tuoi = [t for c in CHANG for t in range(c["tu"], c["den"] + 1)]
    assert tuoi == list(range(1, 101))


def test_khong_dua_cau_giong_phan():
    han = "".join(c["han"] for c in CHANG)
    for cam in ("相刑", "人驚", "禍非輕", "破敗"):
        assert cam not in han


def test_ten_bo_vi_tai_khop_chu_sach():
    ten = {x["tuoi"]: x["ten"] for x in kb.luu_nien()}
    assert "人輪十歲及十一" in BAI and "地輪朝口" in BAI
    assert ten[10] == ten[11] == "Nhân Luân"
    assert ten[12] == ten[13] == ten[14] == "Địa Luân"


def test_tuoi_qua_100_vong_lai():
    assert kb.bai_ca_luu_nien(128)["han"] == kb.bai_ca_luu_nien(28)["han"] == "二十八遇印堂平"
    assert kb.bai_ca_luu_nien(0) is None


def test_chuong_nam_nay_va_hoi_dap_co_cau_sach():
    ln = nhan_tuong.luu_nien_nam(41, "nam", {}, [])
    assert ln["bai_ca"]["han"] == "山根路遠四十一"
    c = nhan_tuong._chuong_nam_nay({}, [], 1986, "nam", dt.date(2026, 6, 1))   # tuổi mụ 41
    can_cu = " ".join(x for h in c["hop"] for x in h["can_cu"])
    assert "«山根路遠四十一»" in can_cu and "Thần Tướng Toàn Biên" in can_cu
    kq = nhan_tuong.hoi("Tuổi 28 xem ở đâu trên mặt?")
    assert "«二十八遇印堂平»" in kq["cau_tra_loi"]
