# -*- coding: utf-8 -*-
"""KM-1 — đối chiếu phép lập bàn Kỳ Môn với bộ đối chiếu ngoài `kinqimen` (chỉ dùng kết quả đã sinh sẵn ở
`fixtures/golden/ky_mon_doi_chieu.json`; thư viện không chạy trong engine, không phải dependency).

Kết quả (docs/KY-MON-NGUON.md mục 7):
- phép SÁCH BỔ: cục, nguyên, can chi giờ trùng mọi ca;
- phép TRÍ NHUẬN: bộ đối chiếu KHÔNG giữ nguyên nhuận — nó lấy tiết đang đi, đã qua tiết từ 9 ngày thì nhảy sang cục
  của tiết sau. Sách (quyển 708) thì đếm liên tục từng nguyên 5 ngày và chèn một tiết nhuận ở Mang chủng / Đại tuyết.
  Hai lối chỉ có thể lệch nhau ĐÚNG MỘT TIẾT, cùng nguyên — test khoá đúng điều ấy; không sửa phép tính theo nó;
- bàn (địa bàn, thiên bàn, cửa, sao, thần) dựng từ cùng một cục thì trùng mọi cung ở cả hai phép."""
import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app.calc import ky_mon as km

TEP = Path(__file__).parent.parent / "fixtures" / "golden" / "ky_mon_doi_chieu.json"
CA = [c for c in json.loads(TEP.read_text("utf-8"))["ca"] if "loi" not in c]
H_CAN, H_CHI = "甲乙丙丁戊己庚辛壬癸", "子丑寅卯辰巳午未申酉戌亥"
H_QUE = {"坎": 1, "坤": 2, "震": 3, "巽": 4, "中": 5, "乾": 6, "兌": 7, "艮": 8, "離": 9}
H_SAO = {"蓬": 1, "芮": 2, "禽": 2, "沖": 3, "輔": 4, "心": 6, "柱": 7, "任": 8, "英": 9}     # bộ đối chiếu ghi Nhuế – Cầm chung một ô
H_CUA = {"休": 1, "死": 2, "傷": 3, "杜": 4, "開": 6, "驚": 7, "生": 8, "景": 9}
H_THAN = {"符": "phu", "蛇": "xa", "陰": "am", "合": "hop", "勾": "tran", "虎": "tran", "雀": "tuoc", "玄": "tuoc",
          "地": "dia", "天": "thien"}
H_SO = "一二三四五六七八九"
H_NGUYEN = {"上": "thuong", "中": "trung", "下": "ha"}


H_TIET = "冬至 小寒 大寒 立春 雨水 驚蟄 春分 清明 穀雨 立夏 小滿 芒種 夏至 小暑 大暑 立秋 處暑 白露 秋分 寒露 霜降 立冬 小雪 大雪".split()
MA_TIET = [m for m, _ in km.TIET]


def _cuc_doi_chieu(o):
    m = re.match(r"([陰陽])遁(.)局(.)元", o["排局"])
    return m.group(1) == "陽", H_SO.index(m.group(2)) + 1, list(H_NGUYEN).index(m.group(3))


def _cua_em(c, phep):
    b = km.lap_ban(dt.datetime.fromisoformat(c["t"]), utc=8, phep=phep, gio_ty="sang_ngay")
    return b, (b["am_duong"] == "duong", b["cuc"], km.NGUYEN.index(b["nguyen"]))


# Bốn ca bộ đối chiếu tự đổi GIỜ sai (05:00 ra giờ Dần, 11:45 ra giờ Tỵ — cùng giờ đồng hồ ấy ở ngày khác nó vẫn ra
# Mão / Ngọ như mọi sách). Không theo.
GIO_DOI_CHIEU_SAI = {"2081-12-17T05:00", "2082-08-06T05:00", "2095-08-05T05:00", "2096-04-13T11:45"}


def test_bo_doi_chieu_du_ca():
    assert len(CA) >= 380 and len(CA) == len(json.loads(TEP.read_text("utf-8"))["ca"])    # không ca nào bộ đối chiếu tự lỗi


def test_sach_bo_trung_moi_ca():
    for c in CA:
        b, cuc = _cua_em(c, "sach_bo")
        o = c["sach_bo"]
        assert cuc == _cuc_doi_chieu(o), (c["t"], o["排局"])
        assert H_TIET[MA_TIET.index(b["tiet_thuc"]["ma"])] == o["節氣"], c["t"]


@pytest.mark.parametrize("phep", ["sach_bo", "tri_nhuan"])
def test_can_chi_ngay_gio_trung(phep):
    """Bộ đối chiếu đổi ngày ở 23:00 — ứng với `gio_ty="sang_ngay"` của engine."""
    for c in CA:
        if c["t"] in GIO_DOI_CHIEU_SAI:
            continue
        b, _ = _cua_em(c, phep)
        ngay, gio = c[phep]["干支"][-6:-4], c[phep]["干支"][-3:-1]
        assert b["can_chi"]["ngay"] == f"{km.CAN[H_CAN.index(ngay[0])]} {km.CHI[H_CHI.index(ngay[1])]}", c["t"]
        assert b["can_chi"]["gio"] == f"{km.CAN[H_CAN.index(gio[0])]} {km.CHI[H_CHI.index(gio[1])]}", c["t"]


def test_tri_nhuan_chi_lech_dung_mot_tiet_cung_nguyen():
    trung = 0
    for c in CA:
        b, cuc = _cua_em(c, "tri_nhuan")
        o = _cuc_doi_chieu(c["tri_nhuan"])
        assert o[2] == cuc[2], (c["t"], "nguyên")                    # cùng phù đầu → cùng thượng / trung / hạ
        if o == cuc:
            trung += 1
            continue
        i = MA_TIET.index(b["tiet"]["ma"])
        ke = {(km.la_duong_don(j % 24), km.CUC_TIET[j % 24][cuc[2]], cuc[2]) for j in (i - 1, i + 1)}
        assert o in ke, (c["t"], c["tri_nhuan"]["排局"], b["tiet"]["ten"], b["cuc"])
    assert trung >= len(CA) * 0.6, trung                             # đo 2026-11-18: khoảng 70 % số ca trùng hẳn


@pytest.mark.parametrize("phep", ["sach_bo", "tri_nhuan"])
def test_ban_trung_moi_cung_khi_cung_cuc(phep):
    """Dựng bàn từ CHÍNH cục bộ đối chiếu chọn → thử phép xếp bàn trên mọi ca, kể cả ca trí nhuận hai bên khác cục.

    Một chỗ không so: khi can giờ nằm ở cung giữa VÀ trực phù là Thiên Nhuế / Thiên Cầm (bàn đứng yên — phục ngâm), bộ đối
    chiếu để chín sao đứng yên nhưng lại xoay các can thiên bàn — tự mâu thuẫn (can thiên bàn đi theo sao). Sách: can giờ ở
    cung giữa thì gửi Khôn, trực phù vốn ở Khôn nên cả bàn đứng yên. Các ca ấy vẫn so sao, cửa, thần, địa bàn."""
    bo = 0
    for c in CA:
        o = c[phep]
        duong, cuc, _ = _cuc_doi_chieu(o)
        gio = o["干支"][-3:-1]
        i_gio = next(i for i in range(60) if i % 10 == H_CAN.index(gio[0]) and i % 12 == H_CHI.index(gio[1]))
        b = km.ban_gio(cuc, duong, i_gio)
        phuc_ngam_giua = b["truc_phu"]["cung_goc"] == 5 and b["truc_phu"]["sao_so"] in (2, 5)
        bo += phuc_ngam_giua
        for que, can in o["地盤"].items():
            assert b["cung"][H_QUE[que]]["dia_ban"] == km.CAN[H_CAN.index(can)], (c["t"], "dia_ban", que)
        for que, can in o["天盤"].items():
            if que != "中" and not phuc_ngam_giua:
                assert b["cung"][H_QUE[que]]["thien_ban"] == km.CAN[H_CAN.index(can)], (c["t"], "thien_ban", que)
        for que, x in o["門"].items():
            assert b["cung"][H_QUE[que]]["cua_so"] == H_CUA[x], (c["t"], "cua", que)
        for que, x in o["星"].items():
            assert b["cung"][H_QUE[que]]["sao_so"] == H_SAO[x], (c["t"], "sao", que)
        for que, x in o["神"].items():       # bộ đối chiếu gọi 虎 / 玄 khi âm độn; sách gọi Câu Trần / Chu Tước ở cả hai độn
            assert b["cung"][H_QUE[que]]["than_ma"] == H_THAN[x], (c["t"], "than", que)
    assert bo <= len(CA) * 0.05, bo            # 2026-11-18: 10 và 14 ca trên 400
