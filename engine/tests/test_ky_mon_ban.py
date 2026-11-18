# -*- coding: utf-8 -*-
"""KM-1 — phép lập bàn Kỳ Môn theo giờ (`calc/ky_mon.py`). Viết TRƯỚC hàm.

Golden lấy từ CHÍNH sách: bảng 18 cục × 60 giờ và hai ví dụ lập bàn năm Vạn Lịch Kỷ Sửu (1589) của
《欽定古今圖書集成》 (kho nguồn `ky_mon_co_kim_do_thu.json`), rút bằng `scripts/_generate_ky_mon_golden.py`."""
import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import ky_mon as km

GOLDEN = json.loads((Path(__file__).parent.parent / "fixtures" / "golden" / "ky_mon_18_cuc.json").read_text("utf-8"))


def test_bang_cuc_theo_tiet_khop_72_de_muc_cua_sach():
    """Đầu mỗi cục sách kê bốn «tiết + nguyên» dùng cục ấy → đủ 24 tiết × 3 nguyên."""
    thay = {}
    for c in GOLDEN["cuc"]:
        for x in c["tiet"]:
            thay[(x["tiet"], x["nguyen"])] = (c["duong"], c["cuc"])
    assert len(thay) == 72
    for (tiet, nguyen), (duong, cuc) in thay.items():
        assert km.CUC_TIET[tiet][nguyen] == cuc, (tiet, nguyen)
        assert km.la_duong_don(tiet) is duong, tiet


def test_dia_ban_la_hoan_vi_chin_can():
    for duong in (True, False):
        for cuc in range(1, 10):
            db = km.dia_ban(cuc, duong)
            assert sorted(db) == list(range(1, 10)) and sorted(db.values()) == sorted(km.NGHI_KY)
            assert db[cuc] == "Mậu"


LECH = json.loads((Path(__file__).parent.parent / "fixtures" / "golden" / "ky_mon_18_cuc_lech.json").read_text("utf-8"))["lech"]


def test_18_cuc_60_gio_khop_bang_sach():
    """1.067 dòng giờ đọc được của bảng: sao trực phù + cung tới, cửa trực sử + cung tới, bốn thần, ba cặp cửa – cung.
    Ô lệch (dưới 2,5 % mỗi loại) là chữ chép lệch một ô — ghim ở `ky_mon_18_cuc_lech.json` để bắt ô lệch mới."""
    dem, lech = 0, {"sao": [], "cua": [], "sao_cung": [], "cua_cung": [], "than": [], "cua_vi": []}
    for c in GOLDEN["cuc"]:
        for h in c["hang"]:
            b = km.ban_gio(c["cuc"], c["duong"], h["gio"])
            khoa = [c["duong"], c["cuc"], h["gio"]]
            dem += 1
            if b["truc_phu"]["sao_so"] != h["sao"]:
                lech["sao"].append(khoa)
            if b["truc_su"]["cua_so"] != h["cua"]:
                lech["cua"].append(khoa)
            if b["truc_phu"]["cung_goc"] != h["sao_cung"]:
                lech["sao_cung"].append(khoa)
            if b["truc_su"]["cung_goc"] != h["cua_cung"]:
                lech["cua_cung"].append(khoa)
            vi_than = {v["than_ma"]: k for k, v in b["cung"].items() if v.get("than_ma")}
            sai = [m for m in ("thien", "dia", "am", "hop") if vi_than[m] != h["than"][m]]
            if sai:
                assert len(sai) <= 2, (khoa, sai)       # sai quy tắc thì lệch cả bốn vị trí
                lech["than"].append(khoa)
            vi_cua = {v["cua_so"]: k for k, v in b["cung"].items() if v.get("cua_so")}
            if any(vi_cua[cua] != cung for cua, cung in h["cua_vi"]):
                lech["cua_vi"].append(khoa)
    assert dem >= 1060
    assert lech["sao"] == [] and lech["cua"] == []      # tên sao trực phù, cửa trực sử: khớp mọi dòng
    for truong in ("sao_cung", "cua_cung", "than", "cua_vi"):
        assert lech[truong] == LECH[truong], truong
        assert len(lech[truong]) <= dem * 0.025, (truong, len(lech[truong]))


def _gio(ten):
    can, chi = ten.split(" ")
    return (6 * km.CAN.index(can) - 5 * km.CHI.index(chi)) % 60


def test_vi_du_1_cua_sach_sieu_than_1589():
    """«萬曆己丑年正月初二庚戌日辛巳時 … 符頭係己酉 … 雨水節上局乃超神»: Vũ thuỷ thượng nguyên → dương độn cục 9.
    (Phép tính tiết khí của engine chỉ hợp lệ từ 1860 nên bàn năm 1589 thử qua `ban_gio` với cục sách nêu.)"""
    assert km.CUC_TIET[4][0] == 9 and km.la_duong_don(4)
    b = km.ban_gio(9, True, _gio("Tân Tỵ"))
    # 戊在離己在坎庚在坤辛在震壬在巽癸在中宮 · 乙在艮丙在兌丁在乾
    assert [b["cung"][k]["dia_ban"] for k in (9, 1, 2, 3, 4, 5, 8, 7, 6)] == ["Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý", "Ất", "Bính", "Đinh"]
    assert b["tuan_thu"] == "Giáp Tuất" and b["truc_phu"]["sao"] == "Thiên Bồng" and b["truc_su"]["cua"] == "Hưu"
    # 天蓬直符加在地盤震宮順數任在巽 衝在離 輔在坤 英在兌 芮在乾 柱在坎 心在艮
    assert {k: b["cung"][k]["sao"] for k in (3, 4, 9, 2, 7, 6, 1, 8)} == {
        3: "Thiên Bồng", 4: "Thiên Nhậm", 9: "Thiên Xung", 2: "Thiên Phụ", 7: "Thiên Anh", 6: "Thiên Nhuế", 1: "Thiên Trụ", 8: "Thiên Tâm"}
    # 任帶艮之乙奇到巽 · 柱帶兌之丙奇到坎 · 心帶乾之丁奇到艮
    assert (b["cung"][4]["thien_ban"], b["cung"][1]["thien_ban"], b["cung"][8]["thien_ban"]) == ("Ất", "Bính", "Đinh")
    # 休門加地盤之艮順數生在震傷在巽杜在離景在坤死在兌驚在乾開在坎
    assert {k: b["cung"][k]["cua"] for k in (8, 3, 4, 9, 2, 7, 6, 1)} == {
        8: "Hưu", 3: "Sinh", 4: "Thương", 9: "Đỗ", 2: "Cảnh", 7: "Tử", 6: "Kinh", 1: "Khai"}
    # 直符在震宮順數螣蛇在巽太陰在離六合在坤勾陳在兌朱雀在乾九地在坎九天在艮
    assert {k: b["cung"][k]["than"] for k in (3, 4, 9, 2, 7, 6, 1, 8)} == {
        3: "Trực Phù", 4: "Đằng Xà", 9: "Thái Âm", 2: "Lục Hợp", 7: "Câu Trần", 6: "Chu Tước", 1: "Cửu Địa", 8: "Cửu Thiên"}


def test_vi_du_2_cua_sach_tri_nhuan_tiep_khi_1589():
    """«十月二十九癸卯日已交大雪 … 從十月二十日甲午為大雪超神上局 … 符已超節九日正當置閏 … 自初五日己酉至初九日癸丑
    為大雪閏奇上局 … 直到二十日甲子方作冬至上局»: đếm ngày theo chính lời sách (tháng Mười đủ 30 ngày)."""
    phu_dau, dai_tuyet = 20, 29                                   # ngày 20 và 29 tháng Mười
    assert km.co_dat_nhuan(dai_tuyet, phu_dau) and not km.co_dat_nhuan(dai_tuyet, phu_dau + 1)
    mung = lambda d: 30 + d - phu_dau                             # ngày mùng d tháng Mười một cách phù đầu bao nhiêu ngày
    assert km.xep_tri_nhuan(25 - phu_dau, 23, True) == (23, 1, False)      # 二十五日己亥大雪中局
    assert km.xep_tri_nhuan(mung(6), 23, True) == (23, 0, True)            # mùng 6 Canh Tuất: Đại tuyết nhuận, thượng
    assert km.xep_tri_nhuan(mung(10), 23, True) == (23, 1, True)           # 初十日甲寅 … 閏奇中局
    assert km.xep_tri_nhuan(mung(15), 23, True) == (23, 2, True)           # 十五日己未 … 閏奇下局
    assert km.xep_tri_nhuan(mung(20), 23, True) == (0, 0, False)           # 二十日甲子方作冬至上局
    assert km.CUC_TIET[23][0] == 4 and not km.la_duong_don(23)
    b = km.ban_gio(4, False, _gio("Mậu Dần"))
    # 戊在巽己在震庚在坤辛在坎壬在離癸在艮乙奇在中宮寄坤丙奇在乾丁奇在兌
    assert [b["cung"][k]["dia_ban"] for k in (4, 3, 2, 1, 9, 8, 5, 6, 7)] == ["Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý", "Ất", "Bính", "Đinh"]
    assert b["truc_phu"]["sao"] == "Thiên Xung" and b["truc_su"]["cua"] == "Thương"
    # 天衝直符加巽輔在離英在坤芮在兌柱在乾心在坎蓬在艮任在震
    assert {k: b["cung"][k]["sao"] for k in (4, 9, 2, 7, 6, 1, 8, 3)} == {
        4: "Thiên Xung", 9: "Thiên Phụ", 2: "Thiên Anh", 7: "Thiên Nhuế", 6: "Thiên Trụ", 1: "Thiên Tâm", 8: "Thiên Bồng", 3: "Thiên Nhậm"}
    # 芮帶中宮之乙奇到兌 · 柱帶兌之丁奇到乾 · 心帶乾之丙奇到坎
    assert b["cung"][7]["thien_ban_ky"] == "Ất" and b["cung"][6]["thien_ban"] == "Đinh" and b["cung"][1]["thien_ban"] == "Bính"
    # 傷門加艮杜在震景在巽死在離驚在坤開在兌休在乾生在坎
    assert {k: b["cung"][k]["cua"] for k in (8, 3, 4, 9, 2, 7, 6, 1)} == {
        8: "Thương", 3: "Đỗ", 4: "Cảnh", 9: "Tử", 2: "Kinh", 7: "Khai", 6: "Hưu", 1: "Sinh"}
    # 直符在巽逆行螣蛇在震太陰在艮六合在坎勾陳在乾朱雀在兌九地在坤九天在離
    assert {k: b["cung"][k]["than"] for k in (4, 3, 8, 1, 6, 7, 2, 9)} == {
        4: "Trực Phù", 3: "Đằng Xà", 8: "Thái Âm", 1: "Lục Hợp", 6: "Câu Trần", 7: "Chu Tước", 2: "Cửu Địa", 9: "Cửu Thiên"}


def test_tri_nhuan_do_vuot_luon_trong_khoang_hop_le():
    """Phù đầu đi trước tiết mốc nhiều nhất 14 ngày, đi sau nhiều nhất 7 ngày suốt 1890–2140 (dãy mốc đã hội tụ);
    nửa năm hè dài hơn nửa năm đông nên độ vượt có thể nhảy từ 8 lên 13 trước khi đặt nhuận."""
    _dau, moc = km._moc_tri_nhuan(7.0)
    thay_nhuan = 0
    for p, i, nhuan, j in moc:
        if 1890 <= dt.date.fromordinal(j).year <= 2139:
            assert -7 <= j - p <= 14, (dt.date.fromordinal(j), i, j - p)
            assert nhuan == (j - p >= 9)
            thay_nhuan += nhuan
    assert 80 <= thay_nhuan <= 100          # ~ một lần đặt nhuận mỗi 2,8 năm


@pytest.mark.parametrize("phep", ["sach_bo", "tri_nhuan"])
def test_ban_du_bo_va_tat_dinh(phep):
    t = dt.datetime(2026, 11, 18, 10, 30)
    a, b = km.lap_ban(t, phep=phep), km.lap_ban(t, phep=phep)
    assert a == b
    assert len([1 for v in a["cung"].values() if v.get("cua")]) == 8
    assert len([1 for v in a["cung"].values() if v.get("than")]) == 8
    assert sorted(v["sao_so"] for k, v in a["cung"].items() if k != 5) == [1, 2, 3, 4, 6, 7, 8, 9]
    assert a["cung"][5].get("cua") is None and a["cung"][5]["dia_ban"]


def test_sach_bo_theo_phu_dau_cua_ngay():
    # 18/11/2026 ngày Bính Thân, sau Lập đông: phù đầu Giáp Ngọ → thượng nguyên → âm độn cục 6
    b = km.lap_ban(dt.datetime(2026, 11, 18, 10, 30), phep="sach_bo")
    assert (b["can_chi"]["ngay"], b["phu_dau"], b["am_duong"], b["cuc"], b["nguyen"], b["tiet"]["ma"]) == (
        "Bính Thân", "Giáp Ngọ", "am", 6, "thuong", "lap_dong")


def test_gio_ty_muon_theo_hai_quy_uoc():
    t = dt.datetime(2026, 11, 18, 23, 30)
    a = km.lap_ban(t, gio_ty="da_ty")
    b = km.lap_ban(t, gio_ty="sang_ngay")
    assert a["can_chi"]["gio"] == b["can_chi"]["gio"] and a["can_chi"]["gio"].endswith("Tý")
    assert a["can_chi"]["ngay"] == "Bính Thân" and b["can_chi"]["ngay"] == "Đinh Dậu"
    assert a["ty_muon"] is True


def test_dau_vao_sai():
    with pytest.raises(ValueError):
        km.lap_ban(dt.datetime(2026, 1, 1, 10), phep="khac")
    with pytest.raises(ValueError):
        km.ban_gio(10, True, 0)
    with pytest.raises(ValueError):
        km.lap_ban(dt.datetime(1500, 1, 1, 10), phep="tri_nhuan")
