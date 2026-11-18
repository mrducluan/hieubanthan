# -*- coding: utf-8 -*-
"""KM-1 — đối chiếu phép lập bàn Kỳ Môn với bộ đối chiếu ngoài `kinqimen` (chỉ dùng kết quả đã sinh sẵn ở
`fixtures/golden/ky_mon_doi_chieu.json`; thư viện không chạy trong engine, không phải dependency).

Chỗ bộ đối chiếu làm khác sách được ghi ở `KHAC_CO_CHU_DICH` kèm lý do — không sửa phép tính theo nó khi sách nói khác."""
import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app.calc import ky_mon as km

TEP = Path(__file__).parent.parent / "fixtures" / "golden" / "ky_mon_doi_chieu.json"
if not TEP.exists():        # golden đang được sinh (bộ đối chiếu chạy chậm) — test bật khi tệp vào repo
    pytest.skip("chưa có golden đối chiếu Kỳ Môn", allow_module_level=True)
CA = [c for c in json.loads(TEP.read_text("utf-8"))["ca"] if "loi" not in c]
H_CAN, H_CHI = "甲乙丙丁戊己庚辛壬癸", "子丑寅卯辰巳午未申酉戌亥"
H_QUE = {"坎": 1, "坤": 2, "震": 3, "巽": 4, "中": 5, "乾": 6, "兌": 7, "艮": 8, "離": 9}
H_SAO = {"蓬": 1, "芮": 2, "禽": 2, "沖": 3, "輔": 4, "心": 6, "柱": 7, "任": 8, "英": 9}     # bộ đối chiếu ghi Nhuế – Cầm chung một ô
H_CUA = {"休": 1, "死": 2, "傷": 3, "杜": 4, "開": 6, "驚": 7, "生": 8, "景": 9}
H_THAN = {"符": "phu", "蛇": "xa", "陰": "am", "合": "hop", "勾": "tran", "虎": "tran", "雀": "tuoc", "玄": "tuoc",
          "地": "dia", "天": "thien"}
H_SO = "一二三四五六七八九"
H_NGUYEN = {"上": "thuong", "中": "trung", "下": "ha"}


def _so(c, phep):
    o = c[phep]
    t = dt.datetime.fromisoformat(c["t"])
    b = km.lap_ban(t, utc=8, phep=phep, gio_ty="sang_ngay")
    m = re.match(r"([陰陽])遁(.)局(.)元", o["排局"])
    khac = []
    if (b["am_duong"], b["cuc"], b["nguyen"]) != ("duong" if m.group(1) == "陽" else "am", H_SO.index(m.group(2)) + 1, H_NGUYEN[m.group(3)]):
        khac.append("cuc")
    gio = o["干支"][-3:-1]
    if b["can_chi"]["gio"] != f"{km.CAN[H_CAN.index(gio[0])]} {km.CHI[H_CHI.index(gio[1])]}":
        khac.append("gio")
    return b, o, khac


@pytest.mark.parametrize("phep", ["sach_bo", "tri_nhuan"])
def test_dinh_cuc_va_can_chi_gio_khop_bo_doi_chieu(phep):
    lech = [c["t"] for c in CA if _so(c, phep)[2]]
    assert len(CA) >= 550
    assert len(lech) <= NGUONG[phep], (phep, len(lech), lech[:10])


# Số ca được phép lệch ở bước ĐỊNH CỤC (xem docs/KY-MON-NGUON.md mục 7 — ngày giao tiết sát nửa đêm, cách bộ đối chiếu
# đặt nhuận). Bàn của các ca ĐÃ cùng cục thì phải trùng hoàn toàn (test dưới).
NGUONG = {"sach_bo": 0, "tri_nhuan": 0}


@pytest.mark.parametrize("phep", ["sach_bo", "tri_nhuan"])
def test_ban_trung_khi_cung_cuc(phep):
    dem = 0
    for c in CA:
        b, o, khac = _so(c, phep)
        if khac:
            continue
        dem += 1
        for que, can in o["地盤"].items():
            assert b["cung"][H_QUE[que]]["dia_ban"] == km.CAN[H_CAN.index(can)], (c["t"], "dia_ban", que)
        for que, can in o["天盤"].items():
            if que != "中":
                assert b["cung"][H_QUE[que]]["thien_ban"] == km.CAN[H_CAN.index(can)], (c["t"], "thien_ban", que)
        for que, x in o["門"].items():
            assert b["cung"][H_QUE[que]]["cua_so"] == H_CUA[x], (c["t"], "cua", que)
        for que, x in o["星"].items():
            assert b["cung"][H_QUE[que]]["sao_so"] == H_SAO[x], (c["t"], "sao", que)
        for que, x in o["神"].items():
            assert b["cung"][H_QUE[que]]["than_ma"] == H_THAN[x], (c["t"], "than", que)
    assert dem >= 500
