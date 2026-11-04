# -*- coding: utf-8 -*-
"""SK-1 (2026-11-04, chủ dự án duyệt) — chính sách sức khoẻ mới: không tên bệnh → gợi HỆ CƠ QUAN + đi khám; được (và
nên) nêu NĂM nên chú ý sức khoẻ khi chỉ báo của lá số được kích hoạt, nói bằng lời phòng ngừa; luôn kèm câu không thay
lời bác sĩ. Vẫn cấm tên bệnh, "sẽ ốm / sẽ bệnh / mắc bệnh", sống chết, bỏ thuốc; triệu chứng cấp → đi khám ngay.

Test viết cho: KB một nguồn (`suc_khoe_kb.json`), RULES `luangiai/suc_khoe_nam.py` (đối chiếu ĐỘC LẬP với CALC), hộp
"Năm nên chú ý sức khoẻ hơn" ở Tử vi / Bát tự / Nhà của bạn (không đổi mức chương), hỏi đáp 5 mảng."""
from __future__ import annotations

import datetime as dt
import json
import random
import re
from pathlib import Path

import pytest

from app.calc import battu, huyen_khong as hk, lunar, tuvi_an_sao as az, tuvi_phi_hoa as phi
from app.hoidap import battu as bh, chung, kinhdich as kd, phongthuy as ph, tuvi as tv
from app.hoidap.tuvi import tom_tat
from app.kb import suc_khoe_kb as kb
from app.luangiai import an_toan, suc_khoe_nam as skn, toan_bo, tuvi_doi_song as tds, tuvi_y_bo_sung as yb
from app.narrative import hoi_van, kiem_ai

XEM = dt.date(2026, 11, 4)
_G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))["cases"]
MIEN_TRU = "không thay lời bác sĩ"
# Hệ cơ quan / việc đi khám phải xuất hiện trong câu năm (gợi ý cụ thể, không chung chung)
HE_RX = re.compile(r"hô hấp|phổi|tiêu hoá|dạ dày|gan|thận|tiết niệu|tim mạch|huyết áp|mắt|răng|xương khớp|nội tiết|"
                   r"máu|da|ruột|sức khoẻ tổng quát")
CAM = ["sẽ ốm", "sẽ bệnh", "sẽ bị bệnh", "mắc bệnh", "đổ bệnh", "ung thư", "tiểu đường", "đột quỵ", "qua đời", "chết",
       "tử vong", "bạn có bị"]


# ------------------------------------------------------------------ KB một nguồn
def test_kb_co_nguon_va_du_muc():
    d = json.loads((Path(__file__).parents[1] / "app" / "kb" / "data" / "suc_khoe_kb.json").read_text("utf-8"))
    assert d["source_id"] and d["school_id"] and d["trang_thai"] == "nhap_ai"
    for h in ("Kim", "Mộc", "Thủy", "Hỏa", "Thổ"):
        m = d["he_co_quan"][h]
        assert m["he"] and m["kham"].split()[0] in ("khám", "kiểm") and m["source_id"] and m["school_id"]
    for sao in ("Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
                "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"):
        assert kb.he_sao(sao) and d["sao_tuvi"][sao]["source_id"], sao
    for q in ("Càn", "Khôn", "Chấn", "Tốn", "Khảm", "Ly", "Cấn", "Đoài"):
        assert kb.he_quai(q), q
    assert kb.he_hanh("Hoả") == kb.he_hanh("Hỏa")             # hai kiểu viết hành
    # Hoả → tim mạch, huyết áp, mắt; Kim → hô hấp, phổi (chủ dự án nêu ví dụ)
    assert "hô hấp" in kb.he_hanh("Kim")["he"] and "phổi" in kb.he_hanh("Kim")["kham"]
    assert "huyết áp" in kb.he_hanh("Hỏa")["he"]


def test_mau_khong_cum_cam_va_co_mien_tru():
    d = json.loads((Path(__file__).parents[1] / "app" / "kb" / "data" / "suc_khoe_kb.json").read_text("utf-8"))
    for ma, s in d["mau"].items():
        assert not skn.kiem(s), (ma, skn.kiem(s))
        assert not re.search(r"(?<!\w)bệnh(?!\w)", s.replace("bác sĩ", "")) or ma.startswith("hoi_benh"), ma
    assert MIEN_TRU in kb.mien_tru() and "không phải lời đoán" in kb.mien_tru()
    assert "115" in kb.mau("cap_cuu") and "ngay" in kb.mau("cap_cuu")


def test_kiem_bat_cum_cam():
    assert skn.kiem("Năm 2028 bạn sẽ ốm nặng") == ["sẽ ốm"]
    assert "ung thư" in skn.kiem("dễ bị ung thư phổi")
    assert skn.kiem("Năm 2028 nên chú ý sức khoẻ bản thân hơn, nhất là đường hô hấp; đi khám phổi.") == []


def test_cau_nam_dung_mau():
    he = kb.he_hanh("Kim")
    s = skn.cau_nam(2028, he)
    assert s == "Năm 2028 nên chú ý sức khoẻ bản thân hơn, nhất là đường hô hấp, phổi; sắp xếp đi khám hô hấp, phổi vào đầu năm."
    assert skn.cau_nam([2028, 2031], he).startswith("Năm 2028 và 2031 ")
    assert "sớm" in skn.cau_nam(2026, he, hien_tai=True) and "đầu năm" not in skn.cau_nam(2026, he, hien_tai=True)
    assert "tổng quát" in skn.cau_nam(2028, None)


# ------------------------------------------------------------------ Tử vi: đối chiếu độc lập với CALC
def _ls(ca):
    return tom_tat(az.an_sao_tho(dt.date.fromisoformat(ca["ngay"]), ca["ti"], ca["gioi_tinh"], "vi-VN"))


def _ky_nhap_ta(ls, nam):
    can, _ = lunar.can_chi_nam(nam)
    ky = next(x for x in phi.phi_tu_can(can, ls["cung"]) if x["hoa"] == "Kỵ")
    return ky["den_cung"] == "Tật Ách"


@pytest.mark.parametrize("ca", _G[:30], ids=[f"{c['ngay']}-{c['ti']}" for c in _G[:30]])
def test_tuvi_ky_nam_nhap_tat_ach_luon_thanh_nam_chu_y(ca):
    ls = _ls(ca)
    nam_am_sinh = int(ca["ngay"][:4])
    ds = skn.tuvi_nam(ls, 2026, nam_am_sinh)
    nam = {x["nam"] for x in ds}
    for n in range(2026, 2036):
        if _ky_nhap_ta(ls, n):                     # chỉ báo mạnh nhất (điểm 2) → bắt buộc có năm đó
            assert n in nam, (ca["ngay"], n)
    for x in ds:
        assert x["diem"] >= skn.NGUONG_TUVI and set(x["ly_do"]) & skn._LOP_NAM and x["can_cu"]


def test_tuvi_bao_cao_co_hop_nam_va_khong_doi_muc():
    """Mọi lá có năm được kích hoạt → chương Sức khoẻ có hộp "Năm nên chú ý sức khoẻ hơn" nêu năm gần nhất + hệ cơ quan
    + việc đi khám + câu không thay lời bác sĩ; mức chương = mức cung Tật Ách đã chấm (hộp không đổi mức)."""
    co = 0
    for ca in _G[:20]:
        sinh = {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}
        bc = toan_bo.tuvi(sinh, ngay_xem=XEM)
        sk = next(c for c in bc["chuong"] if c["ma"] == "suc_khoe")
        ls = _ls(ca)
        assert sk["muc"] == tds.cham_cung(ls)["Tật Ách"]["muc"]
        nam_am_xem = lunar.solar_to_lunar(XEM.day, XEM.month, XEM.year, 7)[2]
        nam_am_sinh = nam_am_xem - bc["tuoi_mu"] + 1
        # TV-YBS: lý do thêm của năm từ KB ý bổ sung (vd cung năm có Kình / Đà) đi vào CÙNG hộp này
        them = yb.chuan_bi(ls, sinh["gioi_tinh"], nam_am_xem, nam_am_sinh)["sk"]
        ds = skn.tuvi_nam(ls, nam_am_xem, nam_am_sinh, them=them)
        h = [x for x in sk["hop"] if x["tieu_de"] == skn.TIEU_DE_HOP]
        assert len(h) <= 1                     # vẫn MỘT hộp "Năm nên chú ý sức khoẻ hơn"
        if ds:
            co += 1
            assert h, ca["ngay"]
            nd = h[0]["noi_dung"]
            assert f"Năm {ds[0]['nam']}" in nd and "khám" in nd and HE_RX.search(nd) and MIEN_TRU in nd
            assert h[0]["loai"] == "thoi_diem" and "muc" not in h[0] and h[0]["ma_mau"].startswith("ds.suc_khoe.nam.")
            assert not skn.kiem(nd)
    assert co >= 8


# ------------------------------------------------------------------ Bát tự
def test_battu_nam_doc_lap():
    tl = {"Mộc": 0.05, "Hỏa": 0.40, "Thổ": 0.2, "Kim": 0.2, "Thủy": 0.15}
    ds = skn.battu_nam(tl, {}, 2026, 10)
    nam = {x["nam"]: x for x in ds}
    # Mộc yếu nhất, Kim khắc Mộc: Canh Thân 2040 ngoài khung; trong 2026–2035 năm cả can lẫn chi Kim: không có →
    # chỉ "dồn thừa" Hỏa: Bính Ngọ 2026, Đinh Tỵ… (Đinh Mùi 2027 chi Thổ không tính)
    assert 2026 in nam and nam[2026]["ly_do"] == ["don_thua"] and "tim mạch" in nam[2026]["he"]["he"]
    assert all(battu.CAN_NH[(n - 4) % 10] == "Hỏa" == battu.CHI_NH[(n - 4) % 12] for n, x in nam.items()
               if x["ly_do"] == ["don_thua"])
    ds2 = skn.battu_nam({"Mộc": 0.0, "Hỏa": 0.2, "Thổ": 0.3, "Kim": 0.25, "Thủy": 0.25}, {}, 2028, 10)
    # 2030 Canh Tuất: Kim (+1) Thổ (0) → 1, chỉ tính khi năm đó Cần lưu ý; truyền vào thì có
    assert 2030 not in {x["nam"] for x in ds2}
    assert 2030 in {x["nam"] for x in skn.battu_nam({"Mộc": 0.0, "Hỏa": 0.2, "Thổ": 0.3, "Kim": 0.25, "Thủy": 0.25},
                                                   {2030: "can_chu_dong"}, 2028, 10)}


def test_battu_bao_cao_hop_nam():
    rd = random.Random(11)
    co = 0
    for _ in range(25):
        sinh = {"lich": dt.datetime(rd.randint(1950, 2005), rd.randint(1, 12), rd.randint(1, 28), rd.randint(0, 23)),
                "gioi_tinh": rd.choice(["nam", "nu"])}
        bc = toan_bo.battu(sinh, ngay_xem=XEM)
        sk = next(c for c in bc["chuong"] if c["ma"] == "suc_khoe")
        h = [x for x in sk["hop"] if x["tieu_de"] == skn.TIEU_DE_HOP]
        for x in sk["hop"]:
            assert not skn.kiem(x["noi_dung"]), x["noi_dung"]
        if h:
            co += 1
            assert re.search(r"Năm 20\d\d", h[0]["noi_dung"]) and HE_RX.search(h[0]["noi_dung"])
            assert MIEN_TRU in h[0]["noi_dung"] and h[0]["ma_mau"].startswith("ds.bt.suc_khoe.nam.")
        # lời chăm sóc theo hành nay kèm việc đi khám cụ thể
        assert any("khám" in (x.get("huong_xu_ly") or x["noi_dung"]) for x in sk["hop"])
    assert co >= 10


# ------------------------------------------------------------------ Phong thuỷ
def test_phongthuy_nam_doc_lap():
    for q in hk.QUAI:
        ds = skn.phongthuy_nam(q, 2026)
        mong = [n for n in range(2026, 2036) if hk.luu_nien(n)["cung"].get(q) in (2, 5)]
        assert [x["nam"] for x in ds] == mong, q
        for x in ds:
            assert "tiêu hoá" in x["he"]["he"]


# ------------------------------------------------------------------ hỏi đáp
SINH_TV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 11, 30), "gioi_tinh": "nam"}
SINH_PT = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)}
NGUOI = {"ho_ten": "Nguyen Van An", "ngay": 17, "thang": 5, "nam": 1990}


def _hoi(mang, cau):
    if mang == "tuvi":
        return tv.tra_loi(cau, sinh=SINH_TV, ngay_xem=XEM)
    if mang == "battu":
        return bh.tra_loi(cau, sinh=SINH_BT, ngay_xem=XEM)
    if mang == "phongthuy":
        return ph.tra_loi(cau, sinh=SINH_PT, ngay_xem=XEM)
    if mang == "kinhdich":
        return kd.tra_loi(cau)
    return hoi_van.tra_loi(cau, NGUOI, ngay_xem=XEM, dung_llm=False)


@pytest.mark.parametrize("mang", ["tuvi", "battu", "phongthuy", "thanso"])
@pytest.mark.parametrize("cau", ["Năm nào tôi cần để ý sức khoẻ?", "Tôi có bị bệnh gì không?",
                                 "Sức khoẻ năm 2027 của tôi thế nào?", "Tôi hay bị đau dạ dày, lá số nói gì?"])
def test_hoi_suc_khoe_tra_loi_co_nam_va_mien_tru(mang, cau):
    r = _hoi(mang, cau)
    v = r["cau_tra_loi"]
    assert r["phan_loai"]["xu_ly"] != "an_toan"
    assert re.search(r"[Nn]ăm 20\d\d", v) and "khám" in v and MIEN_TRU in v, (mang, cau, v[:400])
    assert not any(re.search(r"(?<!\w)" + c + r"(?!\w)", v.lower()) for c in CAM), (mang, cau)
    assert "nằm ngoài những gì cổ học" not in v


@pytest.mark.parametrize("mang", ["tuvi", "battu", "phongthuy", "kinhdich", "thanso"])
def test_hoi_ten_benh_khong_xac_nhan_goi_he_va_di_kham(mang):
    """Câu NÊU tên bệnh: vẫn xếp từ chối (bộ an toàn đóng băng không đổi) nhưng lời đáp gợi hệ cơ quan + đi khám để
    bác sĩ kiểm tra + câu không thay lời bác sĩ; không nhắc lại tên bệnh, không có / không."""
    r = _hoi(mang, "Xem giúp tôi có bị ung thư phổi không?")
    v = r["cau_tra_loi"]
    assert r["phan_loai"]["xu_ly"] == "tu_choi_nhe"
    assert "hô hấp" in v and "bác sĩ kiểm tra" in v and MIEN_TRU in v, v
    assert "ung thư" not in v.lower()


@pytest.mark.parametrize("mang", ["tuvi", "battu", "phongthuy", "kinhdich", "thanso"])
@pytest.mark.parametrize("cau", ["Năm nào tôi chết?", "Tôi sống được bao lâu?", "Có nên bỏ thuốc huyết áp không?",
                                 "Bố tôi bị ung thư, có qua khỏi không?"])
def test_giu_tu_choi_song_chet_va_thuoc(mang, cau):
    v = _hoi(mang, cau)["cau_tra_loi"]
    assert "Năm 20" not in v and "hô hấp" not in v           # không biến câu sống chết / bỏ thuốc thành lời khám


@pytest.mark.parametrize("cau", ["Tôi đau ngực khó thở quá", "Em đang bị khó thở, xem tử vi giúp",
                                 "Con em sốt cao co giật đêm qua"])
def test_cap_cuu_khuyen_di_kham_ngay(cau):
    assert an_toan.tu_choi(cau) == "suc_khoe_the_chat" and an_toan.nhom_suc_khoe(cau) == "cap_cuu"
    for mang in ("tuvi", "battu", "thanso"):
        v = _hoi(mang, cau)["cau_tra_loi"]
        assert "115" in v and "ngay" in v, (mang, v)


def test_nhom_suc_khoe():
    assert an_toan.nhom_suc_khoe("Tôi có bị tiểu đường không") == "hoi_benh"
    assert an_toan.nhom_suc_khoe("Tôi có bị bệnh tim không") == "hoi_benh"
    assert an_toan.nhom_suc_khoe("Năm nào tôi chết") is None
    assert an_toan.nhom_suc_khoe("Có nên ngưng thuốc huyết áp không") is None
    assert an_toan.nhom_suc_khoe("Em đang mang thai, bé có bị dị tật không") is None
    assert an_toan.nhom_suc_khoe("Em bị khối u ở vú, lành hay ác") is None
    assert an_toan.nhom_suc_khoe("Thái Dương ở Tật Ách, tôi có bị bệnh tim không") == "hoi_benh"   # "thái" ≠ "thai"


def test_he_cau_hoi_khong_nham_chu_bo_dau():
    t = chung.chuan_hoa
    assert kb.he_cau_hoi(t("gần đây tôi hay lo")) is None             # gần ≠ gan
    assert kb.he_cau_hoi(t("phối hợp công việc")) is None             # phối ≠ phổi
    assert kb.he_cau_hoi(t("tìm việc mới")) is None                   # tìm ≠ tim
    assert kb.he_cau_hoi(t("tôi có bị ung thư phổi không"))["hanh"] == "Kim"
    assert kb.he_cau_hoi(t("men gan cao"))["hanh"] == "Mộc"


def test_kiem_ai_cho_he_co_quan_khi_nguon_co_va_chan_ten_benh():
    nguon = "Năm 2028 nên chú ý sức khoẻ bản thân hơn, nhất là tim mạch, huyết áp và mắt; sắp xếp đi khám tim mạch."
    assert not [x for x in kiem_ai.kiem("Năm 2028 bạn nên chú ý tim mạch, đi khám tim mạch.", nguon) if "y tế" in x]
    assert any("y tế" in x for x in kiem_ai.kiem("Năm 2028 bạn dễ bị cao huyết áp.", nguon))
    assert any("y tế" in x for x in kiem_ai.kiem("Năm 2028 bạn sẽ ốm.", nguon))
