# -*- coding: utf-8 -*-
"""Bộ nạp Cổ Kim Đồ Thư Tập Thành (`scripts/nap_co_kim_do_thu.py`) — không cần mạng: HTML mẫu dựng lại đúng ba kiểu hỏng
của trang Wikisource đã gặp (bản WS-2 làm rơi ~25 đoạn, phải vá tay «猴口», «八方坑坎歌")."""
from __future__ import annotations

import importlib.util
from pathlib import Path

_P = Path(__file__).resolve().parents[1] / "scripts" / "nap_co_kim_do_thu.py"
_spec = importlib.util.spec_from_file_location("nap_co_kim_do_thu", _P)
nap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(nap)

NGAT = ('<span><span class="pagenum ws-pagenum" id="19R" data-page-number="19R"><span class="pagenum-inner">​</span></span></span>'
        '<div style="position: absolute; left: -60px;"><span><a href="#"><img alt="考證" src="x.png"></a></span></div>')


def _trang(than: str) -> str:
    return f'<div class="prp-pages-output">{than}</div><div class="licenseContainer">x</div>'


def test_chu_tran_ngoai_p_khong_bi_rot():
    t = _trang('<div class="mw-heading"><h3 id="a">猴口</h3></div>\n'
               f'猴口兩脣喜又長，人中破竹更為良。平生衣祿皆榮{NGAT}足，鶴算龜齡福壽康。\n'
               '<div class="mw-heading"><h3 id="b">鯰魚口</h3></div>\n<p>鯰魚口闊角低尖，梟薄雙脣又欠圓。</p>')
    muc = {ten: van for _, ten, van in nap.doc_quyen(t)}
    assert muc["猴口"] == "猴口兩脣喜又長人中破竹更為良平生衣祿皆榮足鶴算龜齡福壽康"   # không «考證», không 〔圖〕
    assert muc["鯰魚口"] == "鯰魚口闊角低尖梟薄雙脣又欠圓"


def test_chu_tran_xen_giua_cac_p_giu_dung_thu_tu():
    t = _trang('<div class="mw-heading"><h3 id="a">八方坑坎歌</h3></div>\n<p>丑低投軍號陣中</p><p>寅低狼傷并虎咬</p>\n'
               f'卯地有灓傷眼目{NGAT}巽地坑池官司敗\n<p>午丙有坑火災顯</p>')
    (_, _, van), = [x for x in nap.doc_quyen(t) if x[1] == "八方坑坎歌"]
    assert van.split("\n") == ["丑低投軍號陣中", "寅低狼傷并虎咬", "卯地有灓傷眼目巽地坑池官司敗", "午丙有坑火災顯"]


def test_khong_lay_chu_thich_hinh_css_va_de_muc_go_hong():
    t = _trang('<div class="mw-heading"><h3 id="a">兵符紋</h3></div><figure><img src="a.png"><figcaption>圖題</figcaption></figure>'
               '<p>兵符紋現掌中央</p>\n&lt;h3 id="金" style="x"&gt;金：<span>〈</span>花印《紋》\n'
               '<style data-mw-deduplicate="T">.mw-parser-output .ambox{border:1px}</style><p>紋帶金花印立身</p>'
               '<style>.mw-parser-output .licenseContainer{x}')
    (_, _, van), = [x for x in nap.doc_quyen(t) if x[1] == "兵符紋"]
    assert van == "兵符紋現掌中央\n紋帶金花印立身"


def test_kho_nguon_da_nap_lai_co_doan_tung_bi_rot():
    import json
    nguon = Path(__file__).resolve().parents[1] / "fixtures" / "nguon"
    tt = {t["ten"]: t["van"] for t in json.loads((nguon / "than_tuong_toan_bien.json").read_text("utf-8"))["thien"]}
    assert tt["神相全編四 · 猴口"].startswith("猴口兩脣喜又長") and "神相全編四 · 鯰魚口" in tt
    assert "眼上露堂" in tt["神相全編三 · 華蓋格"]
    dt = {t["ten"]: t["van"] for t in json.loads((nguon / "duong_trach_thap_thu.json").read_text("utf-8"))["thien"]}
    assert "巽地坑池官司敗陽短陰山出暗風" in dt["陽宅十書一 · 八方坑坎歌"]
    assert all("ghi_chu" not in t for t in json.loads((nguon / "duong_trach_thap_thu.json").read_text("utf-8"))["thien"])
