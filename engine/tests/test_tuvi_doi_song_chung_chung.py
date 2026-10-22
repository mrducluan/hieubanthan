# -*- coding: utf-8 -*-
"""Rà "chung chung" 2026-10-21 (`docs/LUAN-GIAI-DOI-SONG.md` mục 7) — chặn tái phạm lời luận ai đọc cũng đúng.

Đo bằng `scripts/do_chung_chung_tuvi.py` trên 16 lá golden (mỗi lá thứ 4 của `lasotuvi_60.json`, đủ tuổi, đủ kiểu
Mệnh). Ngưỡng (số đo lúc chốt: 60 lá trung bình 0,048, cặp tệ nhất 0,295; trước khi sửa 0,186 / 0,50):
  (a) trung bình tỉ lệ câu trùng nguyên văn giữa hai lá "khác hẳn" (≤ 3/12 cung cùng bộ chính tinh) ≤ 0,10, cặp tệ
      nhất ≤ 0,40; không câu nào (trừ câu miễn trừ cố định) có ở ≥ 50% số lá;
  (b) không câu nào lặp nguyên văn trong một bài (trừ chương "Lời khuyên" vốn gom lại, và lặp nằm trọn trong chương
      "Năm nay" — phạm vi nhịp tháng);
  (c) không câu nào chứa cụm chung chung (KB `cum_chung_chung`); KB lời luận không chứa cụm chung chung / cụm cấm;
  (d) mỗi hộp lưu ý có hướng xử lý riêng (không phải câu dự phòng trong mã, không dùng chung cho hai mảng đời).
"""
from __future__ import annotations

import datetime as dt
import itertools
from collections import Counter

import pytest

from app.kb import tuvi_doi_song_kb as kb
from app.luangiai import toan_bo
from app.luangiai import tuvi_doi_song as ds
from scripts import do_chung_chung_tuvi as do

XEM = dt.date(2026, 10, 21)
NGUONG_TRUNG_TB, NGUONG_TRUNG_MAX = 0.10, 0.40


@pytest.fixture(scope="module")
def mau():
    la = do.chon_la(True)[::4]
    bai = [toan_bo.tuvi(s, ngay_xem=XEM) for s in la]
    return la, bai, [do._bo_sao(s) for s in la]


def test_a_khong_cau_barnum(mau):
    la, bai, bo = mau
    tap = [{x for _, _, x in do.chu_bai(b)} - do.CO_DINH for b in bai]
    ty = [len(tap[i] & tap[j]) / min(len(tap[i]), len(tap[j]))
          for i, j in itertools.combinations(range(len(bai)), 2) if do.khac_han(bo[i], bo[j])]
    assert len(ty) >= 30
    assert sum(ty) / len(ty) <= NGUONG_TRUNG_TB, sum(ty) / len(ty)
    assert max(ty) <= NGUONG_TRUNG_MAX, max(ty)
    dem = Counter(x for t in tap for x in t)
    barnum = [x for x, n in dem.items() if n >= len(bai) / 2]
    assert not barnum, barnum


def test_b_khong_lap_trong_bai(mau):
    for b in mau[1]:
        chu = do.chu_bai(b) + do.chu_bai(b, True)
        k = Counter(x for ch, _, x in chu if ch != "loi_khuyen" and x not in do.CO_DINH)
        ngoai_nam_nay = {x for ch, _, x in chu if ch != "nam_nay"}
        lap = [x for x, n in k.items() if n >= 2 and x in ngoai_nam_nay]
        assert not lap, lap


def test_c_khong_cum_chung_chung(mau):
    cum = kb.cum_chung_chung()
    assert len(cum) >= 30 and "tuỳ hoàn cảnh" in cum and "mỗi điều có cách gỡ" in cum
    for b in mau[1]:
        for ch, _, x in do.chu_bai(b):
            assert not kb.tim_cum_cam(x, cum), (ch, kb.tim_cum_cam(x, cum), x)
        for h in b["cot_loi"]:
            assert not kb.tim_cum_cam(h["noi_dung"], cum), h["noi_dung"]


def test_c_kb_loi_luan_sach():
    so = do.kb_soat(kb.cum_chung_chung())
    assert all(v == 0 for v in so.values()), so


def test_d_luu_y_co_huong_rieng(mau):
    huong_mang: dict[str, set] = {}
    for b in mau[1]:
        for c in b["chuong"]:
            for h in c["hop"]:
                if h["loai"] != "luu_y":
                    continue
                hx = h.get("huong_xu_ly") or ""
                assert hx and hx in h["noi_dung"], h
                assert hx not in ds.HUONG_DU_PHONG, (c["ma"], hx)
                if c["ma"] not in ("nam_nay", "loi_khuyen"):
                    huong_mang.setdefault(hx, set()).add(do._khoa_huong(h, c["ma"]))
    chung = {x: m for x, m in huong_mang.items() if len(m) >= 2}
    assert not chung, chung


# ------------------------------------------------------------------ đơn vị: lời gắn dữ kiện
def test_tom_tat_neu_ly_do_cua_chinh_la(mau):
    """Tóm tắt chương = mức + VÌ SAO (từ lá số), không còn câu mô tả mức dùng chung."""
    for b in mau[1]:
        for c in b["chuong"]:
            if c["ma"] in ("su_nghiep", "tinh_cam", "nha_cua"):
                assert c["tom_tat"].startswith("Chuyện ") and " ở mức " in c["tom_tat"], c["tom_tat"]
                assert ": " in c["tom_tat"] or c["tom_tat"].endswith("."), c["tom_tat"]
    tom = Counter(c["tom_tat"] for b in mau[1] for c in b["chuong"] if c["ma"] == "su_nghiep")
    assert tom.most_common(1)[0][1] <= len(mau[1]) // 3, tom


def test_ly_do_theo_muc():
    x = {"ten": "Quan Lộc", "muc": "can_chu_dong", "chinh": [{"ten": "Cự Môn", "do_sang": "Hãm", "muon": False}],
         "hoa": [{"hoa": "Kỵ", "sao": "Cự Môn"}], "cat": ["Tả Phù"], "sat": ["Kình Dương"], "cham": False, "nua": -1,
         "_lan_can_diem": [("Phu Thê", -3), ("Tài Bạch", 2), ("Mệnh", -1)]}
    cau = ds.ly_do_cau(x)
    assert cau.startswith("bạn hay bận lòng về mảng này") or cau.startswith("nét của bạn ở đây dễ lệch"), cau
    assert "người giúp" not in cau                       # cần chủ động → nói điều vướng trước
    x["nua"] = 2
    x["muc"] = "thuan"
    x["hoa"] = [{"hoa": "Lộc", "sao": "Cự Môn"}]
    assert "chuyện tài bạch" not in ds.ly_do_cau(x).lower()        # gọi tên đời thường, không tên cung
    assert any("chuyện tiền bạc" in r for r, _ in ds.ly_do(x))


def test_tuan_triet_rieng_tung_cung():
    t = {c: kb.tuan_triet(c) for c in ("Mệnh", "Phu Thê", "Tài Bạch", "Quan Lộc")}
    assert all(v and v["tuan"] and v["triet"] and v["loi_khuyen"] and v["loi_khuyen_triet"] for v in t.values())
    assert len({v["tuan"] for v in t.values()}) == 4 and len({v["loi_khuyen"] for v in t.values()}) == 4
    assert all(v["tuan"] != v["triet"] for v in t.values())


def test_dong_thoi_gian_tuoi_nho_va_khong_noi_giai_doan_da_qua():
    # 2018: giai đoạn đầu 6–15 tuổi → lời tuổi đi học; 1951 (75 tuổi): không bảo "chuẩn bị trước" cho giai đoạn đã qua
    b = toan_bo.tuvi({"ngay": dt.date(2018, 1, 30), "ti": 9, "gioi_tinh": "nu"}, ngay_xem=XEM)
    dau = b["thoi_gian_bieu"][0]
    assert dau["tu_tuoi"] <= ds.TUOI_NHO and "tuổi" in dau["mot_cau"].lower()
    assert "cưới" not in dau["mot_cau"] and "mua nhà" not in dau["mot_cau"]
    b = toan_bo.tuvi({"ngay": dt.date(1951, 5, 17), "ti": 5, "gioi_tinh": "nam"}, ngay_xem=XEM)
    cd = next(c for c in b["chuong"] if c["ma"] == "cuoc_doi")
    for h in cd["hop"]:
        if h["ma_mau"].endswith((".vap", ".manh")):
            tu = int(h["noi_dung"].split(" ")[1])
            assert tu + 9 >= b["tuoi_mu"], h["noi_dung"]
    assert len(cd["hop"]) >= 2


def test_sat_theo_cap_sao_va_pha_cach_khong_lap():
    assert kb.sat_loi_khuyen("Phu Thê", ["Kình Dương"]) != kb.sat_loi_khuyen("Phu Thê", ["Địa Kiếp"])
    assert kb.sat_loi_khuyen("Phu Thê", ["Tả Phù"]) is None
    a, b = ds.pha_cach_loi(["Kình Dương"]), ds.pha_cach_loi(["Kình Dương"], 1)
    assert a != b and "cần tự chủ nhiều hơn" in a and "cần tự chủ nhiều hơn" in b
    assert ds.pha_cach_loi([]) == ds.PHA_CACH_LOI
