# -*- coding: utf-8 -*-
"""WS-1 — kho nguồn nạp từ Wikisource tiếng Trung (bản gõ lại, `can_doi_chieu`): đúng khuôn, sạch vỏ wiki,
và những bảng engine đang dùng khớp chữ của sách."""
import json
import re
from pathlib import Path

import pytest

from app.calc import kinhdich_maihoa as mh
from app.calc import kinhdich_vendor as v

NGUON = Path(__file__).parent.parent / "fixtures" / "nguon"
# mã → số chữ tối thiểu (bảo vệ khỏi lần nạp lại bị hụt trang)
SACH = {"tang_san_boc_dich": 110_000, "hoa_chau_lam": 18_000, "mai_hoa_dich_so": 35_000, "dia_ly_bien_chinh": 9_000,
        "ham_long_kinh": 27_000, "thanh_nang_kinh": 5_500, "huyen_co_phu": 500,
        "trich_thien_tuy": 12_000, "trich_thien_tuy_xien_vi": 90_000, "than_phong_thong_khao": 140_000,
        "hoang_kim_sach": 20_000, "kinh_thi_dich_truyen": 25_000,
        "thien_ngoc_kinh_noi_truyen": 9_000, "nhan_tu_tu_tri": 13_000}
HAN = {"乾": "Càn", "坤": "Khôn", "震": "Chấn", "巽": "Tốn", "坎": "Khảm", "離": "Ly", "艮": "Cấn", "兌": "Đoài"}
CHI = dict(zip("子丑寅卯辰巳午未申酉戌亥", ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]))
HANH = {"金": "Kim", "木": "Mộc", "水": "Thủy", "火": "Hỏa", "土": "Thổ"}


def _doc(ma):
    return json.loads((NGUON / f"{ma}.json").read_text("utf-8"))


def _thien(ma, ten):
    return next(t["van"] for t in _doc(ma)["thien"] if ten in t["ten"])


@pytest.mark.parametrize("ma", sorted(SACH))
def test_dung_khuon_va_sach_vo_wiki(ma):
    d = _doc(ma)
    assert d["can_doi_chieu"] is True and d["source_id"] == ma and d["school_id"]
    assert "Wikisource" in d["ban"] and "Cổ thư công cộng" in d["_nguon"]
    assert sum(len(t["van"]) for t in d["thien"]) >= SACH[ma]
    for t in d["thien"]:
        assert t["ten"] and len(t["van"]) >= 40
        assert not re.search(r"\{\{|\}\}|\[\[|\]\]|<br|</?[a-z]+[ >]|^=+ .* =+$", t["van"], flags=re.M), (ma, t["ten"])
        # lời người gõ thời nay không nằm trong kho
        assert "錄入者" not in t["ten"] and "增訂說明" not in t["ten"] and t["ten"] != "目錄"


def test_khong_nap_sach_da_loai():
    """Đã xem và loại (bản biên tập thời nay / đổi chữ bằng máy sai): không được lọt vào kho."""
    for ma in ("ngoc_hap_ky", "ngu_hanh_tinh_ky", "binh_sa_ngoc_xich_kinh", "nhap_dia_nhan", "linh_thanh_tinh_nghia"):
        assert not (NGUON / f"{ma}.json").exists()
    # sách còn lại không dính lỗi đổi 丑 → 醜 của máy
    for ma in SACH:
        van = "".join(t["van"] for t in _doc(ma)["thien"])
        assert not re.search(r"[乙丁己辛癸]醜|吉兇", van), ma


def test_kinh_thi_dich_truyen_du_tam_cung():
    """Kinh Thị Dịch Truyện: đủ 64 quẻ theo tám cung; quẻ đầu mỗi cung là quẻ thuần."""
    ten = [t["ten"] for t in _doc("kinh_thi_dich_truyen")["thien"]]
    assert sum(1 for t in ten if re.match(r"^[\u4dc0-\u4dff]", t)) == 64


def test_bon_chuong_engine_dang_dung_van_con():
    so = {t["so"] for t in _doc("tang_san_boc_dich")["thien"]}
    assert {"19", "20", "25", "26又4"} <= so


def test_nap_giap_khop_hon_thien_giap_ty_chuong():
    """«渾天甲子章第四»: mỗi dòng «X在內：… X在外：…» khớp bảng NAPGIAP. Bản gõ chép nhầm 艮 thành 辰 ở dòng thứ ba
    (ba chi 辰午申 / 戌子寅 là của quẻ Cấn) — nhận theo vị trí, ghi lại để đối chiếu bản khắc."""
    van = _thien("tang_san_boc_dich", "渾天甲子章")
    dong = re.findall(r"^(.)在內：(.{6})。.在外[：；](.{6})。", van, flags=re.M)
    assert len(dong) == 8
    thay = 0
    for q, noi, ngoai in dong:
        if q == "辰":
            q, thay = "艮", thay + 1
        chi_noi = [CHI[c] for c in noi[0::2]]
        chi_ngoai = [CHI[c] for c in ngoai[0::2]]
        assert (chi_noi, chi_ngoai) == (list(v.NAPGIAP[HAN[q]][0]), list(v.NAPGIAP[HAN[q]][1])), q
        for c, h in zip(noi[0::2] + ngoai[0::2], noi[1::2] + ngoai[1::2]):
            assert v.CHI_NH[CHI[c]] == HANH[h]
    assert thay == 1


def test_luc_than_theo_cung_khop_luc_than_ca():
    """«六親歌章第五»: 乾兌宮金兄、土父、木財、火鬼、水子 … → hàm luc_than."""
    van = _thien("tang_san_boc_dich", "六親歌章")
    vai = {"兄": "Huynh Đệ", "父": "Phụ Mẫu", "財": "Thê Tài", "鬼": "Quan Quỷ", "子": "Tử Tôn"}
    cung_hanh = {"乾兌": "Kim", "坎": "Thủy", "坤艮": "Thổ", "離": "Hỏa", "震巽": "Mộc"}
    n = 0
    for cung, hanh in cung_hanh.items():
        m = re.search(cung + r"宮?((?:[金木水火土][兄父財鬼子][、，。]){5})", van)
        assert m, cung
        for h, vt in re.findall(r"([金木水火土])([兄父財鬼子])", m.group(1)):
            assert v.luc_than(HANH[h], hanh) == vai[vt], (cung, h, vt)
            n += 1
    assert n == 25


def test_mai_hoa_cach_khoi_que_khop_sach():
    """«卦以八除» + «爻以六除» + «年月日時起例» của Mai Hoa Dịch Số."""
    assert "如得八數整，即坤卦" in _thien("mai_hoa_dich_so", "卦以八除")
    assert mh._quai(8) == "Khôn" and mh._quai(16) == "Khôn" and mh._quai(9) == "Càn"
    assert "以重卦總數除六，以餘數作動爻" in _thien("mai_hoa_dich_so", "爻以六除")
    le = _thien("mai_hoa_dich_so", "年月日時起例")
    assert "年月日為上卦" in le and "年月日加時總數為下卦" in le and "子年一數" in le
    # Tý niên 1, tháng 1, ngày 1, giờ Tý 1: thượng = 3 → Ly; hạ = 4 → Chấn; động = 4
    q = mh.khoi_que_thoi_gian("Tý", 1, 1, "Tý")
    assert (q["thuong"], q["ha"], q["hao_dong"]) == ("Ly", "Chấn", 4)


def test_ha_do_lac_thu_trong_thanh_nang_kinh():
    van = _doc("thanh_nang_kinh")["thien"][0]["van"]
    assert "一六共宗，二七同道，三八為朋，四九為友，五十同途" in van
