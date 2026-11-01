# -*- coding: utf-8 -*-
"""EN-3 (thước đo "đúng thời gian được hỏi") — câu nêu năm / hai năm / tháng → hai đoạn đầu nói đúng mốc đó, số liệu từ
phép tính sẵn có (một nguồn): Tử vi = mức từng năm của dòng Vận hạn; Thần số = năm / tháng cá nhân. Câu tự viết."""
import re

import pytest

from app.hoidap import tuvi
from app.luangiai import tuvi_doi_song as tvd
from tests.test_en3_hieu_cau_chay import XEM, chay


def _dau(s: str, n: int = 2) -> str:
    return "\n\n".join(s.split("\n\n")[:n])


@pytest.mark.parametrize("cau, nam", [
    ("Năm 2028 hay 2029 thì chuyện tiền bạc của tôi khá hơn", [2028, 2029]),
    ("Năm sau công việc của tôi thế nào", [2027]),
    ("năm 2030 tôi có nên mở công ty không", [2030]),
])
def test_tuvi_neu_dung_nam(cau, nam):
    s = chay("tuvi", cau)["cau_tra_loi"]
    for y in nam:
        assert str(y) in _dau(s), (cau, s[:300])


def test_tuvi_so_nam_cung_muc_dong_muoi_nam():
    """Mức năm trong hỏi đáp = mức dòng 10 năm của báo cáo (một nguồn)."""
    import datetime as dt
    sinh = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu"}
    bc = tvd.lap(sinh, XEM)
    dong = {d["nam"]: d["nhan_muc"] for d in next(c for c in bc["chuong"] if c["ma"] == "van_han")["dong_nam"]}
    s = chay("tuvi", "Năm 2028 hay 2029 thì chuyện tiền bạc của tôi khá hơn")["cau_tra_loi"]
    for y in (2028, 2029):
        m = re.search(rf"Năm {y} \([^)]*\) với bạn: ([^—.]+)", s)
        assert m and m.group(1).strip().lower() == dong[y].lower(), (y, s[:400])


@pytest.mark.parametrize("cau, moc", [
    ("Tháng 3 năm sau tôi có nên khai trương không", r"[Tt]háng 3"),
    ("Tháng tới tôi có nên đổi việc không", r"[Tt]háng 12"),
    ("Năm 2027 hay năm 2028 tôi nên cưới", r"2027.*2028|2028.*2027"),
])
def test_thanso_neu_dung_moc(cau, moc):
    s = chay("thanso", cau)["cau_tra_loi"]
    assert re.search(moc, _dau(s), re.S), (cau, s[:300])


def test_battu_so_nam_cung_muc_dong_muoi_nam():
    import datetime as dt
    from app.luangiai import battu_doi_song as btd
    sinh = {"lich": dt.datetime(1990, 5, 17, 12), "gioi_tinh": "nu", "gio_ty": "da_ty"}
    dong = {d["nam"]: d["nhan_muc"] for d in
            next(c for c in btd.lap(sinh, XEM)["chuong"] if c["ma"] == "van_han")["dong_nam"]}
    s = chay("battu", "Năm 2028 hay 2029 thì tôi nên mua nhà")["cau_tra_loi"]
    for y in (2028, 2029):
        m = re.search(rf"Năm {y} \([^)]*\) với bạn: ([^—.]+)", s)
        assert m and m.group(1).strip().lower() == dong[y].lower(), (y, s[:400])
        assert str(y) in _dau(s, 2)


def test_phongthuy_lam_nha_hai_nam():
    s = chay("phongthuy", "Nên khởi công làm nhà năm 2028 hay đợi sang 2029")["cau_tra_loi"]
    assert "Tuổi làm nhà năm 2028" in s and "Tuổi làm nhà năm 2029" in s, s[:500]


def test_kinhdich_neu_moc_khong_bia_muc_thang():
    s = chay("kinhdich", "Nên mở cửa hàng vào tháng 2 hay tháng 3 năm sau")["cau_tra_loi"]
    dau = _dau(s, 1)
    assert "tháng 2/2027" in dau and "tháng 3/2027" in dau and "không chấm riêng từng tháng" in dau, dau
