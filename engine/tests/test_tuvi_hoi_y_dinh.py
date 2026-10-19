# -*- coding: utf-8 -*-
"""TV-V2 — hỏi đáp Tử vi theo 8 ý định (KB `tuvi_phi_hoa_kb.json` khoá `y_dinh_hoi`) + câu hỏi phi hoá.

Viết TRƯỚC khi nối định tuyến. RULES tất định, không LLM; giọng trung tính; vẫn chặn khủng hoảng / ngày chết /
bệnh / xổ số / tuyển dụng; ưu tiên đại hạn > lưu niên > tiểu hạn > lưu nguyệt.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.hoidap import tuvi as tv
from app.kb import tuvi_phi_hoa_kb as pkb
from app.narrative import hoi_van

SINH = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
NGAY = dt.date(2026, 10, 19)
CAM_DOA = ("tai hoạ", "tai họa", "chết", "xui xẻo", "hạn nặng", "nguy hiểm", "phá sản", "báo động", "thảm hoạ",
           "bệnh", "bắt buộc", "tai nạn")

# Holdout: viết trước router, khác câu trong kho của skill (fixtures/_cau_hoi_huyenhoc_goc.py).
HOLDOUT = [
    ("di_hay_o", "Giữ chỗ làm cũ hay nhảy sang công ty mới thì hợp với lá số tôi hơn?"),
    ("di_hay_o", "minh co nen thoi viec de tu kinh doanh khong"),
    ("tai_van", "Nửa cuối năm nay tiền bạc của tôi có ổn không?"),
    ("tai_van", "tai van cua minh thoi gian toi ra sao"),
    ("hoc_hanh_con", "Con gái tôi sắp ôn thi vào lớp 10, bố mẹ nên đồng hành sao?"),
    ("hoc_hanh_con", "be nha minh hoc hanh dao nay khong tap trung"),
    ("phan_van", "Tôi đang lưỡng lự giữa việc mua xe và để dành tiền."),
    ("phan_van", "khong biet nen chon phuong an nao, toi dan do mai"),
    ("ba_thang_toi", "Ba tháng sắp tới tôi nên lưu ý điều gì?"),
    ("ba_thang_toi", "xem giup minh van trinh tung thang"),
    ("chon_thoi_diem", "Tháng nào thuận để tôi mở quán cà phê?"),
    ("chon_thoi_diem", "nen chon ngay nao de ky hop dong thue nha"),
    ("tong_quan_nam", "Nhìn chung năm sau của tôi ra sao?"),
    ("tong_quan_nam", "tong quan nam 2027 cua toi the nao"),
    ("hieu_ban_than", "Luận giúp tôi toàn bộ lá số từ A tới Z."),
    ("hieu_ban_than", "toi muon hieu toan dien ban than qua tu vi"),
]

CAN_KHOI = {   # khối bằng chứng bắt buộc theo ý định
    "di_hay_o": {"y_dinh", "phi_hoa_y_dinh", "han"},
    "tai_van": {"y_dinh", "phi_hoa_y_dinh", "han"},
    "hoc_hanh_con": {"y_dinh", "phi_hoa_y_dinh", "han"},
    "phan_van": {"y_dinh", "phi_hoa_y_dinh"},
    "ba_thang_toi": {"y_dinh", "nhip_3_thang", "han"},
    "chon_thoi_diem": {"y_dinh", "nhip_3_thang", "goi_y_trang"},
    "tong_quan_nam": {"y_dinh", "han", "luu_nien_phi_hoa", "cung_checkpoint"},
    "hieu_ban_than": {"y_dinh", "phi_hoa_y_dinh", "cung_checkpoint"},
}


def _hoi(cau: str, che_do: str = "tham_khao") -> dict:
    return tv.tra_loi(cau, che_do, sinh=SINH, ngay_xem=NGAY)


def test_kb_co_du_8_y_dinh():
    ma = [y["ma"] for y in pkb._d()["y_dinh_hoi"]]
    assert sorted(ma) == sorted(CAN_KHOI)
    assert set(tv.Y_DINH_KW) == set(CAN_KHOI)


@pytest.mark.parametrize("yd,cau", HOLDOUT)
def test_holdout_nhan_dung_y_dinh(yd, cau):
    assert tv.phan_loai(cau)["y_dinh"] == yd


@pytest.mark.parametrize("yd,cau", HOLDOUT)
def test_goi_bang_chung_theo_y_dinh(yd, cau):
    kq = _hoi(cau)
    assert kq["phan_loai"]["y_dinh"] == yd
    co = {m["loai"] for m in kq["bang_chung"]["muc"]}
    assert CAN_KHOI[yd] <= co, (cau, CAN_KHOI[yd] - co)
    assert kq["do_phu"] == "day_du" and not kq["can_them"]
    assert hoi_van.kiem_tra_dau_ra(kq["cau_tra_loi"], kq["bang_chung"]) == []
    van = kq["cau_tra_loi"].lower()
    assert not any(t in van for t in CAM_DOA if t not in ("bệnh",)), cau


def test_phi_hoa_lien_quan_dung_cung_y_dinh():
    kq = _hoi("Tôi có nên nghỉ việc để ra làm riêng không?")
    m = next(m for m in kq["bang_chung"]["muc"] if m["loai"] == "phi_hoa_y_dinh")
    cung = set(next(y for y in pkb._d()["y_dinh_hoi"] if y["ma"] == "di_hay_o")["cung_xem"])
    assert 1 <= len(m["duong"]) <= 5
    for d in m["duong"]:
        assert {d["tu_cung"], d["den_cung"], d["xung_cung"]} & cung
        assert d["nghia"]


def test_nhip_3_thang_va_uu_tien():
    kq = _hoi("Ba tháng tới của tôi thế nào?")
    m = next(m for m in kq["bang_chung"]["muc"] if m["loai"] == "nhip_3_thang")
    assert len(m["thang"]) == 3 and all(t["nhan_muc"] in ("Thuận", "Bình", "Cần thận trọng") for t in m["thang"])
    assert "Đại hạn > lưu niên > tiểu hạn > lưu nguyệt" in kq["cau_tra_loi"]
    # đại hạn đứng trước lưu niên, trước tiểu hạn, trước nhịp tháng trong câu trả lời
    van = kq["cau_tra_loi"]
    assert van.index("Đại hạn:") < van.index("Lưu niên:") < van.index("Tiểu hạn:") < van.index("Nhịp 3 tháng")
    # ba tháng: không chen thêm lưu nguyệt một tháng lẻ ("tháng tới") dễ gây hiểu lầm
    assert not any(x["loai"] == "luu_nguyet" for x in kq["bang_chung"]["muc"])


def test_tung_thang_van_co_luu_nguyet_ca_nam():
    kq = _hoi("Xem vận từng tháng cho tôi.")
    co = {m["loai"] for m in kq["bang_chung"]["muc"]}
    assert {"luu_nguyet_nam", "nhip_3_thang"} <= co


def test_chon_thoi_diem_goi_y_xem_ngay_tot_khong_phan():
    kq = _hoi("Tháng nào tốt để tôi khai trương cửa hàng?")
    assert "/xem-ngay-tot" in kq["cau_tra_loi"]
    assert "Xem ngày tốt" in kq["cau_tra_loi"]
    assert "chắc chắn" not in kq["cau_tra_loi"].lower()


def test_hoc_hanh_con_doc_tu_la_so_cha_me_khong_doi_la_so_con():
    kq = _hoi("Việc học của con tôi năm nay ra sao theo lá số của tôi?")
    assert kq["phan_loai"]["loai"] != "la_so_con" and not kq["can_them"]
    assert "lá số của chính con" in kq["cau_tra_loi"]
    # câu không về học vẫn cần lá số của con như cũ
    assert tv.phan_loai("Con tôi sinh giờ Tý có sao không?")["loai"] == "la_so_con"
    assert tv.phan_loai("Lập lá số tử vi cho con tôi.")["y_dinh"] is None


def test_tong_quan_nam_du_12_cung():
    kq = _hoi("Tổng quan năm nay của tôi theo tử vi thế nào?")
    m = next(m for m in kq["bang_chung"]["muc"] if m["loai"] == "cung_checkpoint")
    assert len(m["ds"]) == 12
    ln = next(m for m in kq["bang_chung"]["muc"] if m["loai"] == "luu_nien_phi_hoa")
    assert [h["hoa"] for h in ln["hoa"]] == ["Lộc", "Quyền", "Khoa", "Kỵ"]


def test_hieu_ban_than_co_lai_nhan_va_menh():
    kq = _hoi("Hãy luận toàn diện lá số của tôi.")
    assert "Mệnh" in kq["phan_loai"]["cung"]
    m = next(m for m in kq["bang_chung"]["muc"] if m["loai"] == "phi_hoa_y_dinh")
    assert m.get("lai_nhan") and m["lai_nhan"]["cung"]
    assert any(m["loai"] == "cac_dai_han" for m in kq["bang_chung"]["muc"])


@pytest.mark.parametrize("cau,xu_ly", [
    ("Tháng nào tôi chết?", None),
    ("Chọn ngày nào để tôi mổ ruột thừa?", None),
    ("Ba tháng tới tôi có trúng xổ số không?", "tu_choi_nhe"),
    ("Có nên tuyển nhân viên tuổi Dần trong ba tháng tới không?", "tu_choi_nhe"),
    ("Ba tháng tới tôi muốn tự tử", "an_toan"),
])
def test_van_chan_nhu_cu(cau, xu_ly):
    pl = tv.phan_loai(cau)
    assert pl["xu_ly"] in (("an_toan", "tu_choi_nhe") if xu_ly is None else (xu_ly,))
    assert pl["loai"] == "dac_biet"


def test_khong_co_la_so_thi_hoi_la_so():
    kq = tv.tra_loi("Ba tháng tới của tôi thế nào?", ngay_xem=NGAY)
    assert kq["can_them"] == ["la_so"]


# ------------------------------------------------------------------ câu hỏi phi hoá (chương "Đường bay tứ hoá")
def test_phi_hoa_la_so():
    kq = _hoi("Đường bay tứ hoá trong lá số của tôi nói gì?")
    assert kq["phan_loai"]["loai"] == "phi_hoa"
    co = {m["loai"] for m in kq["bang_chung"]["muc"]}
    assert {"phi_hoa_noi_bat", "khai_niem_phi_hoa"} <= co
    van = kq["cau_tra_loi"]
    assert "Lai nhân" in van and "tự hoá" in van.lower() and "vào cung Mệnh" in van
    assert hoi_van.kiem_tra_dau_ra(van, kq["bang_chung"]) == []


def test_phi_tinh_la_gi_khong_can_la_so():
    kq = tv.tra_loi("Phi tinh tứ hoá là gì?", ngay_xem=NGAY)
    assert kq["phan_loai"]["loai"] == "phi_hoa_khai_niem" and not kq["can_them"]
    assert kq["do_phu"] == "day_du"


def test_tu_hoa_la_gi_van_la_ky_thuat():
    assert tv.phan_loai("Tứ hoá là gì?")["loai"] == "ky_thuat"
