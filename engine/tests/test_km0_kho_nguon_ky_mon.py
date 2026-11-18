# -*- coding: utf-8 -*-
"""KM-0 — kho nguồn Kỳ Môn Độn Giáp: 遁甲演義 (bản Tứ khố, Kanseki KR3g0048) và phần 奇門遁甲 của Cổ Kim Đồ Thư Tập Thành
(quyển 703–714). Đúng khuôn, đủ chữ, sạch vỏ, không chấm câu thời nay; bảng 18 cục đủ và khớp phép khởi cục
(tuần Giáp Tý: trực phù là sao gốc của cung mang số cục, trực sử là cửa gốc của cung ấy)."""
import json
import re
from pathlib import Path

import pytest

NGUON = Path(__file__).parent.parent / "fixtures" / "nguon"
_CHAM = re.compile(r"[，。、；：？！「」『』《》“”‘’]")
SACH = {
    "don_giap_dien_nghia": (4, 34_000, ["遁甲源流", "超神", "置閏", "直符", "隂陽二遁十八局"]),
    "ky_mon_co_kim_do_thu": (400, 135_000, ["陰陽逆順妙難窮", "景祐遁甲符應經纂", "遁甲穿壬", "閏奇超神接氣直指", "日家奇門"]),
}


def _doc(ma):
    return json.loads((NGUON / f"{ma}.json").read_text("utf-8"))


@pytest.mark.parametrize("ma", sorted(SACH))
def test_dung_khuon_du_chu_sach_vo(ma):
    d = _doc(ma)
    so_thien, so_chu, moc = SACH[ma]
    assert d["can_doi_chieu"] is True and d["source_id"] == ma and d["school_id"] == "ky_mon"
    assert "Cổ thư công cộng" in d["_nguon"] and "CHƯA đối chiếu" in d["ban"]
    assert len(d["thien"]) >= so_thien
    van = "".join(t["van"] for t in d["thien"])
    assert len(van) >= so_chu
    for m in moc:
        assert m in van or any(m in t["ten"] for t in d["thien"]), (ma, m)
    for t in d["thien"]:
        assert t["ten"] and t["van"].strip(), (ma, t["ten"])
        assert not re.search(r"\{\{|\}\}|\[\[|<[a-z/]|&[a-z]+;|¶|pb:|==", t["van"] + t["ten"]), (ma, t["ten"])
        assert not _CHAM.search(t["van"]), (ma, t["ten"])


def test_co_kim_do_thu_du_12_quyen_va_tong_luan():
    d = _doc("ky_mon_co_kim_do_thu")
    assert {t["quyen"] for t in d["thien"]} == set(range(703, 715)) | {745}
    assert set(d["muc_luc"]) == {str(q) for q in range(703, 715)}
    assert [t["ten"] for t in d["thien"] if t["quyen"] == 745] == ["圖書編 · 奇門遁甲總敘", "圖書編 · 奇門布局法"]


# sao gốc và cửa gốc của chín cung (cung 5 gửi cung 2 nên cửa là Tử); bản khắc viết 芮 là 內
SAO = {1: "蓬", 2: "內芮", 3: "沖衝", 4: "輔", 5: "禽", 6: "心", 7: "柱", 8: "任", 9: "英"}
CUA = {1: "休", 2: "死", 3: "傷", 4: "杜", 5: "死", 6: "開", 7: "驚", 8: "生", 9: "景"}
SO = "一二三四五六七八九"


def test_bang_18_cuc_du_va_khop_phep_khoi_cuc():
    """Sáu tuần (Giáp Tý Mậu … Giáp Dần Quý): dương độn lục nghi đi thuận từ cung mang số cục, âm độn đi nghịch —
    108 ô trực phù / trực sử đầu tuần của bảng phải đúng quy tắc ấy (quy tắc viết từ khẩu quyết, không lấy từ engine)."""
    d = _doc("ky_mon_co_kim_do_thu")
    cuc = {t["ten"].split(" · ")[-1]: t["van"] for t in d["thien"] if t["quyen"] in range(709, 713)}
    assert set(cuc) == {f"{ad}遁{s}局" for ad in "陽陰" for s in SO}
    tong = 0
    for ten, van in cuc.items():
        n, buoc = SO.index(ten[2]) + 1, (1 if ten[0] == "陽" else -1)
        dong = re.findall(r"(?:^|\n)([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])([蓬任沖衝輔英內芮柱心禽])([一二三四五六七八九])"
                          r"([休生傷杜景死驚開])([一二三四五六七八九])", van)
        tong += len(dong)
        assert len(dong) >= 50, (ten, len(dong))            # 54 giờ thường mỗi cục; vài dòng bản gõ sai khuôn
        assert dong[0][0] == "甲子" and dong[0][1] in SAO[n] and dong[0][2] == SO[n - 1] and dong[0][3] == CUA[n], (ten, dong[0])
        for i, tuan in enumerate(["甲戌", "甲申", "甲午", "甲辰", "甲寅"], start=1):
            c = (n - 1 + buoc * i) % 9 + 1
            m = re.search(rf"(?:^|\n){tuan}(.)直符(.)(.)直", van)
            assert m, (ten, tuan)
            assert m.group(1) in SAO[c] and m.group(2) == SO[c - 1] and m.group(3) == CUA[c], (ten, tuan, m.group(0))
    assert tong >= 950                                       # trên 18 × 54 = 972 dòng giờ thường
