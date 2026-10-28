# -*- coding: utf-8 -*-
"""HD-CS — khối trực quan kèm câu trả lời hỏi đáp (`truc_quan`).

Engine (RULES) dựng sẵn hình từ CHÍNH gói bằng chứng của câu trả lời; web chỉ vẽ theo `kieu`, không tự tính.
Luật: ≤ 3 khối, câu khủng hoảng / ngoài phạm vi không có hình, nhãn hiển thị không mang thuật ngữ độ sáng (miếu/hãm…)
hay chữ phán hung, sắc thái chỉ trong bộ màu không đỏ."""
from __future__ import annotations

import datetime as dt
import re

import pytest

from app.hoidap import battu, phongthuy, tuvi
from app.luangiai import truc_quan as tq
from app.narrative import hoi_van

NGAY = dt.date(2026, 10, 28)
SINH_TV = {"ngay": dt.date(1990, 5, 12), "ti": 6, "gioi_tinh": "nam", "tz_lich": 7}
SINH_BT = {"lich": dt.datetime(1990, 5, 12, 13, 0), "gioi_tinh": "nam"}
SINH_PT = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 12)}
NGUOI = {"ho_ten": ["Nguyễn Văn An"], "ngay": 12, "thang": 5, "nam": 1990, "quy_uoc": "tung_phan"}

KIEU = {"thang", "nhip", "cot", "o", "so", "chu_ky", "hai_cot", "la_ban", "cung"}
SAC = {"chinh", "hop", "trung", "nhat"}
CAM = re.compile(r"\b(Miếu|Vượng|Hãm|hung|xấu|đại kỵ|tai hoạ|điểm số|chấm điểm)\b", re.I)


def _khoi(kq: dict, kieu: str) -> dict:
    ds = [k for k in kq["truc_quan"] if k["kieu"] == kieu]
    assert ds, f"thiếu khối {kieu}: {[k['kieu'] for k in kq['truc_quan']]}"
    return ds[0]


def _chu(o) -> list[str]:
    if isinstance(o, str):
        return [o]
    if isinstance(o, dict):
        return [s for k, v in o.items() if k not in ("kieu", "sac", "muc_ma") for s in _chu(v)]
    if isinstance(o, list):
        return [s for v in o for s in _chu(v)]
    return []


def _hop_le(kq: dict) -> None:
    ds = kq["truc_quan"]
    assert isinstance(ds, list) and len(ds) <= 3
    for k in ds:
        assert k["kieu"] in KIEU
        assert k.get("tieu_de")
        for s in _chu(k):
            assert not CAM.search(s), s
        for m in k.get("muc", []):
            if "sac" in m:
                assert m["sac"] in SAC


def test_tuvi_menh_thang_do_sang():
    kq = tuvi.tra_loi("Cung Mệnh của tôi nói gì về tính cách?", "tham_khao", sinh=SINH_TV, ngay_xem=NGAY)
    _hop_le(kq)
    k = _khoi(kq, "thang")
    assert k["nac"] == list(tq.NAC_DO_SANG) and len(k["nac"]) == 5
    sao = {m["nhan"]: m for m in k["muc"]}
    assert sao["Liêm Trinh"]["vi_tri"] == 0 and sao["Tham Lang"]["vi_tri"] == 0
    assert all(m.get("giai_thich") for m in k["muc"])


def test_tuvi_ba_thang_nhip():
    kq = tuvi.tra_loi("3 tháng tới của tôi thế nào?", "tham_khao", sinh=SINH_TV, ngay_xem=NGAY)
    _hop_le(kq)
    k = _khoi(kq, "nhip")
    assert len(k["muc"]) == 3
    assert {m["muc_ma"] for m in k["muc"]} <= {"thuan", "binh", "can_than"}
    assert all(m["nhan"].startswith("Tháng") and m.get("giai_thich") for m in k["muc"])


def test_tuvi_han_o():
    kq = tuvi.tra_loi("Năm nay tiền bạc của tôi ra sao?", "tham_khao", sinh=SINH_TV, ngay_xem=NGAY)
    _hop_le(kq)
    k = _khoi(kq, "o")
    nhan = [m["nhan"] for m in k["muc"]]
    assert nhan[0] == "10 năm (35–44 tuổi)" and "Năm 2026" in nhan


def test_tuvi_kien_thuc_chung_khong_hinh_la_so():
    kq = tuvi.tra_loi("Tử Vi ở cung Mệnh nghĩa là gì?", "tham_khao", ngay_xem=NGAY)
    _hop_le(kq)
    assert not [k for k in kq["truc_quan"] if k["kieu"] == "thang"]   # không có lá số → không có độ sáng


def test_battu_ngu_hanh_cot_va_suc_than():
    kq = battu.tra_loi("Tôi thiếu hành gì?", sinh=SINH_BT, ngay_xem=NGAY)
    _hop_le(kq)
    k = _khoi(kq, "cot")
    assert [m["nhan"] for m in k["muc"]] == ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"]
    assert abs(sum(m["gia_tri"] for m in k["muc"]) - 100) <= 1
    assert {m["nhan"]: m["sac"] for m in k["muc"]}["Hỏa"] == "chinh"
    t = _khoi(kq, "thang")
    assert t["nac"] == list(tq.NAC_SUC_THAN) and t["muc"][0]["vi_tri"] == 1


def test_thanso_so_va_hai_cot():
    kq = hoi_van.tra_loi("Tôi là người thế nào?", NGUOI, None, NGAY)
    _hop_le(kq)
    s = _khoi(kq, "so")
    assert [(m["nhan"], m["gia_tri"]) for m in s["muc"]][:3] == [("Đường đời", 9), ("Linh hồn", 1), ("Nhân cách", 11)]
    h = _khoi(kq, "hai_cot")
    assert len(h["trai"]["ds"]) == 3 and h["phai"]["ds"]


def test_thanso_nam_chu_ky():
    kq = hoi_van.tra_loi("Năm nay của tôi thế nào?", NGUOI, None, NGAY)
    _hop_le(kq)
    k = _khoi(kq, "chu_ky")
    assert k["so_nac"] == 9 and k["hien_tai"] == 9 and k["nhan_hien_tai"]


def test_phongthuy_la_ban():
    kq = phongthuy.tra_loi("Hướng nhà hợp tuổi tôi?", sinh=SINH_PT, ngay_xem=NGAY)
    _hop_le(kq)
    k = _khoi(kq, "la_ban")
    assert len(k["muc"]) == 8
    hop = {m["huong"] for m in k["muc"] if m["sac"] == "hop"}
    assert hop == {"Bắc", "Đông", "Đông Nam", "Nam"}


@pytest.mark.parametrize("ham", [
    lambda: tuvi.tra_loi("Lá số của tôi xấu quá, tôi muốn biến mất.", "tham_khao", sinh=SINH_TV, ngay_xem=NGAY),
    lambda: battu.tra_loi("Bát tự tôi khắc chồng khắc con, tôi muốn biến mất.", sinh=SINH_BT, ngay_xem=NGAY),
    lambda: hoi_van.tra_loi("Tôi muốn biến mất khỏi cuộc đời này", NGUOI, None, NGAY),
])
def test_cau_dac_biet_khong_hinh(ham):
    kq = ham()
    assert kq["phan_loai"]["xu_ly"] == "an_toan"
    assert kq["truc_quan"] == []


def test_thanso_so_goc_dung_truoc_nhip_thoi_gian():
    kq = hoi_van.tra_loi("Năm nay của tôi thế nào?", NGUOI, None, NGAY)
    s = _khoi(kq, "so")
    assert s["muc"][0]["nhan"] == "Đường đời" and s["muc"][0]["sac"] == "chinh"


def test_battu_hanh_gan_nhu_khong_co_thi_mo():
    kq = battu.tra_loi("Tôi thiếu hành gì?", sinh=SINH_BT, ngay_xem=NGAY)
    assert {m["nhan"]: m["sac"] for m in _khoi(kq, "cot")["muc"]}["Mộc"] == "nhat"


# ---- HD-CS đợt 2 (hướng C): bàn 12 cung + hỏi tiếp theo tam phương

def test_tuvi_ban_cung_tam_phuong():
    kq = tuvi.tra_loi("Công việc của tôi có tốt không?", "tham_khao", sinh=SINH_TV, ngay_xem=NGAY)
    _hop_le(kq)
    assert kq["truc_quan"][0]["kieu"] == "cung"           # hình của câu hỏi về cung đứng đầu
    k = kq["truc_quan"][0]
    assert len(k["muc"]) == 12 and len({m["chi"] for m in k["muc"]}) == 12
    vai = {m["nhan"]: m["vai"] for m in k["muc"]}
    assert vai["Quan Lộc"] == "hoi"
    assert sorted(n for n, v in vai.items() if v == "tam_hop") == ["Mệnh", "Tài Bạch"]
    assert [n for n, v in vai.items() if v == "xung"] == ["Phu Thê"]
    assert k["chi_hoi"] == next(m["chi"] for m in k["muc"] if m["vai"] == "hoi")


def test_tuvi_hoi_tiep_theo_tam_phuong():
    kq = tuvi.tra_loi("Công việc của tôi có tốt không?", "tham_khao", sinh=SINH_TV, ngay_xem=NGAY)
    ht = kq["hoi_tiep"]
    assert 1 <= len(ht) <= 3 and len(set(ht)) == len(ht)
    assert tq.HOI_CUNG["Quan Lộc"] not in ht                 # không gợi lại đúng câu vừa hỏi
    assert tq.HOI_CUNG["Tài Bạch"] in ht and tq.HOI_CUNG["Phu Thê"] in ht


def test_tuvi_khong_la_so_khong_ban_cung():
    kq = tuvi.tra_loi("Cung Quan Lộc nghĩa là gì?", "tham_khao", ngay_xem=NGAY)
    assert not [k for k in kq["truc_quan"] if k["kieu"] == "cung"]


def test_hoi_tiep_rong_khi_dac_biet():
    kq = tuvi.tra_loi("Lá số của tôi xấu quá, tôi muốn biến mất.", "tham_khao", sinh=SINH_TV, ngay_xem=NGAY)
    assert kq["hoi_tiep"] == []


@pytest.mark.parametrize("cung", list(tq.HOI_CUNG))
def test_hoi_cung_dinh_tuyen_dung(cung):
    pl = tuvi.phan_loai(tq.HOI_CUNG[cung], "tham_khao")
    assert pl["cung"][:1] == [cung] and pl["xu_ly"] in ("tra_loi", "tra_loi_kem_luu_y")
