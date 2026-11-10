# -*- coding: utf-8 -*-
"""BT-UI — "Ba lá của ngày" trên /hom-nay (thay Lá bài đầu ngày). Viết TRƯỚC hàm.

Ba lá chỉ GHÉP dữ liệu đã tính / KB có sẵn — không câu mới, không random, không LLM:
  · `tarot`     — lá Tarot RIÊNG của ngày (calc.tarot.la_ngay theo ngày xem + ngày sinh), luôn xuôi;
  · `so`        — ngày cá nhân + việc nhỏ nên thử + câu hỏi thêm (đã có trong thẻ hôm nay);
  · `thoi_khac` — sáu giờ hoàng đạo kèm phút bắt đầu / kết thúc (web chỉ CHỌN giờ sắp tới theo đồng hồ, không tính),
                   ≤ 2 việc nên + ≤ 1 việc kiêng của hoàng lịch, quẻ đầu ngày;
  · `cau_cua_ngay` — đúng câu `tom_lai`.
"""
import datetime as dt
import json
import re

from app.calc import tarot as calc_tarot
from app.kb import tarot_kb
from app.kb import trang_tarot
from app.luangiai import hom_nay

SINH = (17, 5, 1990)
NGAY = dt.date(2026, 11, 10)


def _bl(sinh=SINH, ngay=NGAY, **kw):
    return hom_nay.the_hom_nay(*sinh, ngay, **kw)


def test_la_tarot_la_la_rieng_cua_ngay_luon_xuoi():
    kq = _bl()
    t = kq["ba_la"]["tarot"]
    goc = calc_tarot.la_ngay(NGAY, dt.date(SINH[2], SINH[1], SINH[0]))
    assert t["id"] == goc["id"] and t["nguoc"] is False
    l = tarot_kb.la()[t["id"]]
    assert t["ten"] == l["ten"] and t["y"] == l["y_xuoi"] and t["viec"] == l["viec"] and t["cau_tu_soi"] == l["cau_tu_soi"]
    assert 1 <= len(t["tu_khoa"]) <= 3
    assert t["duong"] == f"{trang_tarot.DUONG_CUM}/{dict(trang_tarot.ds_la_bai())[t['id']]}"
    # đủ trường để web vẽ hình lá (LaGon)
    for k in ("en", "so", "bo", "nguyen_to", "loai"):
        assert k in t


def test_la_so_chi_ghep_du_lieu_the_hom_nay():
    kq = _bl()
    s = kq["ba_la"]["so"]
    assert s["so"] == kq["ngay_ca_nhan"]["so"] and s["nghia"] == kq["ngay_ca_nhan"]["nghia"]
    assert s["viec"] == kq["viec_nho"] and s["cau_hoi"] == kq["cau_hoi_them"]


def test_la_thoi_khac_gio_co_phut_va_khop_hoang_lich():
    kq = _bl()
    tk = kq["ba_la"]["thoi_khac"]
    hl = kq["hoang_lich"]
    assert [g["chi"] for g in tk["gio"]] == [g["chi"] for g in hl["gio_hoang_dao"]]
    for g, goc in zip(tk["gio"], hl["gio_hoang_dao"]):
        assert g["khung"] == goc["khung"] and g["than"] == goc["than"]
        a, b = re.fullmatch(r"(\d\d):(\d\d)–(\d\d):(\d\d)", g["khung"]).groups()[:2], None
        assert g["tu"] == int(a[0]) * 60 + int(a[1])
        assert 0 <= g["tu"] < g["den"] <= 24 * 60
    assert tk["gio"] == sorted(tk["gio"], key=lambda g: g["tu"])
    assert tk["hoang_dao"] == hl["hoang_dao"]
    assert tk["nen"] == hl["nghi"][:2] and tk["kieng"] == hl["ky"][:1]
    q = kq["que_ngay"]
    assert tk["que"] == {"so": q["so"], "ten": q["ten"], "y": q["y_chinh"], "duong": q["duong"]}


def test_cau_cua_ngay_la_tom_lai():
    kq = _bl()
    assert kq["ba_la"]["cau_cua_ngay"] == kq["tom_lai"]
    assert "tất định" in kq["ba_la"]["cach_chon"] or "cùng" in kq["ba_la"]["cach_chon"]


def test_tat_dinh_khong_doi_theo_y_dinh_va_doi_theo_ngay_nguoi():
    a = _bl()["ba_la"]
    assert a == _bl()["ba_la"]
    assert a == _bl(y_dinh=["cong_viec"])["ba_la"] == _bl(du_dinh="chiều nay đi phỏng vấn")["ba_la"]
    la_theo_ngay = {_bl(ngay=NGAY + dt.timedelta(days=i))["ba_la"]["tarot"]["id"] for i in range(30)}
    assert len(la_theo_ngay) >= 15
    la_theo_nguoi = {_bl(sinh=(d, 5, 1990))["ba_la"]["tarot"]["id"] for d in range(1, 29)}
    assert len(la_theo_nguoi) >= 15


def test_cau_khung_hoang_van_co_ba_la_nhung_khong_doi():
    """Câu gõ khủng hoảng chỉ đổi phần ý định (lời hỗ trợ) — ba lá là dữ liệu của ngày, giữ nguyên."""
    kq = _bl(du_dinh="tôi muốn chết")
    assert kq["ho_tro"]
    assert kq["ba_la"] == _bl()["ba_la"]


def test_khong_co_chu_doa_hay_tro_choi_may_rui():
    van = json.dumps(_bl()["ba_la"]["cach_chon"], ensure_ascii=False).lower()
    for cam in ("trúng", "thưởng", "quay", "may rủi", "ngẫu nhiên"):
        assert cam not in van


def test_api_tra_ba_la():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).post("/v1/thanso/hom-nay", json={"ngay": 17, "thang": 5, "nam": 1990, "ngay_xem": "2026-11-10"})
    assert r.status_code == 200
    bl = r.json()["ba_la"]
    assert set(bl) >= {"tarot", "so", "thoi_khac", "cau_cua_ngay", "cach_chon"}


def test_goi_y_cheo_trang_ban_than_tra_du_moi_mang():
    """BT-UI: /ban-than ("Bảy cách nhìn về bạn") xin thẻ của MỌI mảng — kể cả Thần số (trang khác bỏ mảng của chính nó)."""
    from app.luangiai import goi_y_cheo as gy
    h = gy.HoSo(17, 5, 1990, ho_ten=["Nguyễn Đức Luân"])
    kq = gy.goi_y(h, "ban_than", NGAY)
    assert [t["mang"] for t in kq["the"]] == list(gy.THE)          # thứ tự cố định, không xoay
    hn = gy.goi_y(h, "hom_nay", NGAY)["the"]
    for t in kq["the"]:                                           # câu dùng lại biến thể đã kiểm của trang Hôm nay
        if t["mang"] != "hom_nay":
            assert t["cau"] == next(x for x in hn if x["mang"] == t["mang"])["cau"]
    ts = next(t for t in kq["the"] if t["mang"] == "than_so")
    assert ts["ca_nhan"] and ts["can_them"] is None
    tv = next(t for t in kq["the"] if t["mang"] == "tu_vi")
    assert tv["can_them"]            # chưa có giờ sinh → nói rõ cần thêm gì
    du = gy.goi_y(gy.HoSo(17, 5, 1990, gio="08:30", gioi_tinh="nam", noi_sinh="ha-noi"), "ban_than", NGAY)
    assert next(t for t in du["the"] if t["mang"] == "tu_vi")["can_them"] is None


def test_api_goi_y_cheo_nhan_trang_ban_than():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).post("/v1/goi-y-cheo", json={"mang_hien_tai": "ban_than", "ngay": 17, "thang": 5, "nam": 1990, "ho_ten": ["Nguyễn Đức Luân"]})
    assert r.status_code == 200 and len(r.json()["the"]) == 8
