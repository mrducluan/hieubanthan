# -*- coding: utf-8 -*-
"""BT-UI đợt 2 — "Tuần này của bạn" + "Hôm nay của hai người". Viết TRƯỚC hàm.

Cả hai chỉ GHÉP phép tính có sẵn (ngày cá nhân, hoàng lịch theo tuổi) với câu KB `tuan_hai_nguoi_kb.json` (nháp) — không
phép tính mới, không điểm số, không doạ, không LLM. Người thứ hai chỉ cần ngày + tháng sinh (năm chỉ để đổi lịch âm).
"""
import datetime as dt
import json
import re

import pytest

from app.calc import lunar, thanso_mo_rong as mr
from app.config import CALENDAR_MERIDIAN_TZ
from app.kb import nap
from app.luangiai import hoang_lich as hl, tuan_hai_nguoi as th

SINH = (17, 5, 1990)
XEM = dt.date(2026, 11, 10)          # thứ Ba → tuần 9/11 … 15/11
CAM = ("sẽ gặp", "tai hoạ", "xui", "đại hung", "chắc chắn", "trúng", "may rủi", "định mệnh", "phải kiêng")


def _kb():
    return nap.doc("tuan_hai_nguoi_kb.json")


def test_kb_co_nguon_va_khong_cum_cam():
    k = _kb()
    assert k["source_id"] and k["school_id"] and k["trang_thai"]
    van = json.dumps(k, ensure_ascii=False).lower()
    for c in CAM:
        assert c not in van, c


# ---------------------------------------------------------------- tuần
def test_tuan_bay_ngay_tu_thu_hai_va_khop_phep_tinh_goc():
    t = th.tuan(*SINH, XEM)
    assert t["tu"] == "2026-11-09" and t["den"] == "2026-11-15" and len(t["ngay"]) == 7
    for i, n in enumerate(t["ngay"]):
        d = dt.date(2026, 11, 9) + dt.timedelta(days=i)
        assert n["ngay"] == d.isoformat()
        assert n["so"] == mr.ngay_ca_nhan(SINH[0], SINH[1], d.year, d.month, d.day)
        goc = hl.ngay_xem(d, SINH[2], SINH[1], SINH[0])
        assert n["hoang_dao"] == goc["hoang_dao"]
        assert n["tuoi"] == goc["tuoi"]["quan_he"]["ma"]
        assert n["da_qua"] == (d < XEM) and n["hom_nay"] == (d == XEM)
    assert [n["thu"] for n in t["ngay"]][0] == "Thứ Hai" and t["ngay"][6]["thu"] == "Chủ Nhật"


def test_noi_bat_toi_da_ba_khong_lay_ngay_da_qua_va_dung_luat():
    for lech in range(0, 120, 3):
        xem = XEM + dt.timedelta(days=lech)
        t = th.tuan(*SINH, xem)
        nb = t["noi_bat"]
        assert len(nb) <= 3
        assert len({x["ngay"] for x in nb}) == len(nb)                     # mỗi ngày một dòng
        theo_ngay = {n["ngay"]: n for n in t["ngay"]}
        for x in nb:
            n = theo_ngay[x["ngay"]]
            assert not n["da_qua"]
            assert x["tieu_de"] and x["cau"] and x["can_cu"]
            if x["loai"] == "thuan":
                assert n["dep"] and n["tuoi"] != "xung"
            elif x["loai"] == "hop_tuoi":
                assert n["tuoi"] in ("tam_hop", "luc_hop")
                assert not any(y["loai"] == "thuan" for y in nb)          # chỉ thay chỗ khi tuần không có ngày thuận
            elif x["loai"] == "cham":
                assert n["tuoi"] == "xung"
            elif x["loai"] == "mo_dau":
                assert n["so"] == 1
            elif x["loai"] == "khep":
                assert n["so"] == 9
            else:
                raise AssertionError(x["loai"])
        # Ngày xung tuổi không bao giờ được gọi là ngày thuận.
        assert not any(x["loai"] == "thuan" and theo_ngay[x["ngay"]]["tuoi"] == "xung" for x in nb)
        assert t["tom_tat"]


def test_tuan_tat_dinh_va_chu_nhat_van_thuoc_tuan_do():
    assert th.tuan(*SINH, XEM) == th.tuan(*SINH, XEM)
    cn = th.tuan(*SINH, dt.date(2026, 11, 15))
    assert cn["tu"] == "2026-11-09" and cn["ngay"][6]["hom_nay"]
    assert all(x["ngay"] == "2026-11-15" for x in cn["noi_bat"])            # chỉ còn hôm nay


def test_tuan_loi_khong_doa_va_co_luu_y():
    for lech in range(0, 60, 7):
        t = th.tuan(*SINH, XEM + dt.timedelta(days=lech))
        van = json.dumps([t["noi_bat"], t["tom_tat"]], ensure_ascii=False).lower()
        for c in CAM:
            assert c not in van
        assert not re.search(r"\{[a-z_]+\}", van)                          # không còn biến chưa thay
        assert "tham khảo" in t["luu_y"]


# ---------------------------------------------------------------- hai người
def test_hai_nguoi_so_khop_ngay_ca_nhan_va_du_bon_truong_hop():
    a = th.hai_nguoi(17, 5, 3, 11, XEM)
    assert a["ban"]["so"] == mr.ngay_ca_nhan(17, 5, 2026, 11, 10)
    assert a["nguoi_kia"]["so"] == mr.ngay_ca_nhan(3, 11, 2026, 11, 10)
    assert a["ban"]["nghia"] and a["nguoi_kia"]["nghia"]
    thay = set()
    for ad in (17, 18):                                    # hai người A: một ngày hướng ra, một ngày hướng vào
        for d in range(1, 29):
            for m in range(1, 13):
                x = th.hai_nguoi(ad, 5, d, m, XEM)
                thay.add(x["kieu"])
                assert x["tieu_de"] and x["cau"] and x["viec_cung"] and x["cau_tu_soi"]
                assert not re.search(r"\{[a-z_]+\}", x["cau"])
                assert x["kieu"] == th.kieu_cap(x["ban"]["so"], x["nguoi_kia"]["so"])
    assert thay == {"cung_so", "cung_ra", "cung_vao", "lech"}
    assert th.kieu_cap(4, 4) == "cung_so" and th.kieu_cap(1, 5) == "cung_ra" and th.kieu_cap(2, 7) == "cung_vao"
    assert th.kieu_cap(1, 2) == th.kieu_cap(2, 1) == "lech"


def test_hai_nguoi_khong_diem_so_khong_phan_hop_khac():
    for d in range(1, 29, 3):
        x = th.hai_nguoi(17, 5, d, 8, XEM, quan_he="nguoi_yeu")
        van = json.dumps(x, ensure_ascii=False).lower()
        assert not re.search(r"\d+\s*%|\d+\s*/\s*100|điểm hợp|khắc nhau|không hợp nhau|chia tay", van)
        for c in CAM:
            assert c not in van
        assert "diem" not in x


def test_hai_nguoi_nhap_am_lich_doi_sang_duong_truoc_khi_tinh():
    # 15/8 âm lịch 1992 → ngày dương do đúng hàm đổi lịch của engine
    dd, mm, _ = lunar.lunar_to_solar(15, 8, 1992, 0, CALENDAR_MERIDIAN_TZ)
    x = th.hai_nguoi(17, 5, 15, 8, XEM, kia_lich="am", kia_nam=1992)
    assert x["nguoi_kia"]["so"] == mr.ngay_ca_nhan(dd, mm, 2026, 11, 10)
    with pytest.raises(ValueError):
        th.hai_nguoi(17, 5, 15, 8, XEM, kia_lich="am")                      # âm lịch mà thiếu năm → không đoán
    with pytest.raises(ValueError):
        th.hai_nguoi(17, 5, 31, 2, XEM)                                      # ngày không tồn tại


def test_dau_ra_khong_mang_ngay_sinh_nguoi_kia():
    x = th.hai_nguoi(17, 5, 23, 12, XEM, quan_he="ban_be")
    van = json.dumps(x, ensure_ascii=False)
    assert "23/12" not in van and "23-12" not in van and "kia_ngay" not in van


def test_api_tuan_va_hai_nguoi():
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    r = c.post("/v1/thanso/tuan", json={"ngay": 17, "thang": 5, "nam": 1990, "ngay_xem": "2026-11-10"})
    assert r.status_code == 200 and len(r.json()["ngay"]) == 7
    r = c.post("/v1/thanso/hom-nay-hai", json={"ngay": 17, "thang": 5, "kia_ngay": 3, "kia_thang": 11, "quan_he": "ban_be", "ngay_xem": "2026-11-10"})
    assert r.status_code == 200 and r.json()["kieu"] in ("cung_so", "cung_ra", "cung_vao", "lech")
    assert c.post("/v1/thanso/hom-nay-hai", json={"ngay": 17, "thang": 5, "kia_ngay": 31, "kia_thang": 2}).status_code == 422
    assert c.post("/v1/thanso/hom-nay-hai", json={"ngay": 17, "thang": 5, "kia_ngay": 3, "kia_thang": 11, "ten": "x"}).status_code == 422


# ---------------------------------------------------------------- sau rà soát độc lập (PR #248)
def test_ngay_noi_bat_khong_noi_nguoc_trang_ngay():
    """Quét 60 tuần × 3 tuổi: ngày "thuận" phải có ít nhất một việc lớn trang ngày gọi là tốt; ngày "hợp tuổi" phải hoàng đạo;
    cả hai và ngày "mở đầu" không rơi vào ngày sách lịch khuyên hoãn mọi việc / chỉ làm việc ở mục Nên."""
    import datetime as dt

    from app.luangiai import hoang_lich as hl
    from app.luangiai import tuan_hai_nguoi as th

    dem = 0
    for ns in ((15, 6, 1995), (3, 11, 1988), (28, 2, 2001)):
        for i in range(60):
            kq = th.tuan(*ns, dt.date(2026, 11, 9) + dt.timedelta(weeks=i))
            for nb in kq["noi_bat"]:
                c = hl._calc(dt.date.fromisoformat(nb["ngay"]))  # noqa: SLF001
                hoan = "诸事不宜" in c["ky"] or "馀事勿取" in c["nghi"]
                if nb["loai"] == "thuan":
                    dem += 1
                    assert any(v["danh_gia"] == "tot" for v in hl._viec_lon(c)), nb  # noqa: SLF001
                if nb["loai"] == "hop_tuoi":
                    assert c["hoang_dao"], nb
                if nb["loai"] in ("thuan", "hop_tuoi", "mo_dau"):
                    assert not hoan, nb
                if nb["loai"] in ("hop_tuoi", "mo_dau"):
                    assert not c["ky_dan_gian"], nb
            assert all(set(n) >= {"ngay", "so", "dep"} and "hoan" not in n and "viec_tot" not in n for n in kq["ngay"])
    assert dem > 20                                     # luật mới không làm mất hẳn dòng "thuận"


def test_nguoi_kia_am_lich_theo_dung_lich_la_so():
    """Mùng 1 Tết Mậu Thân 1968: lịch miền Nam (UTC+8) và lịch Trung Quốc là 30/1, lịch Việt UTC+7 là 29/1 → ngày cá nhân lệch 1."""
    import datetime as dt

    from app.luangiai import tuan_hai_nguoi as th

    xem = dt.date(2026, 11, 10)
    goc = th.hai_nguoi(1, 1, 1, 1, xem, kia_lich="am", kia_nam=1968)["nguoi_kia"]["so"]
    nam = th.hai_nguoi(1, 1, 1, 1, xem, kia_lich="am", kia_nam=1968, kia_vung="south")["nguoi_kia"]["so"]
    trung = th.hai_nguoi(1, 1, 1, 1, xem, kia_lich="am", kia_nam=1968, kia_lich_am="trung")["nguoi_kia"]["so"]
    bac = th.hai_nguoi(1, 1, 1, 1, xem, kia_lich="am", kia_nam=1968, kia_vung="north")["nguoi_kia"]["so"]
    assert goc == bac and nam == trung and nam == goc % 9 + 1
    # Miền Nam ngoài 1960–1975 vẫn theo lịch Việt UTC+7.
    assert th.hai_nguoi(1, 1, 1, 1, xem, kia_lich="am", kia_nam=1985, kia_vung="south") == th.hai_nguoi(1, 1, 1, 1, xem, kia_lich="am", kia_nam=1985)


# ---------------------------------------------------------------- BT-UI đợt 3: thông báo sáng thứ Hai (mốc tuan_cua_toi)
def test_push_tuan_chi_thu_hai_va_cung_nguon_voi_muc_tuan():
    import datetime as dt
    import re

    from app.luangiai import tuan_hai_nguoi as th

    assert th.push_tuan(15, 6, 1995, dt.date(2026, 11, 10)) is None          # thứ Ba
    co_ngay = khong_ngay = 0
    for i in range(40):
        hai = dt.date(2026, 11, 9) + dt.timedelta(weeks=i)
        for ns in ((15, 6, 1995), (3, 11, 1988)):
            p = th.push_tuan(*ns, hai)
            t = th.tuan(*ns, hai)
            assert p and p["duong"] == "/hom-nay#tuan-nay" and p["tieu_de"] == "Tuần này của bạn"
            assert p["noi_dung"].startswith(t["tom_tat"]) and len(p["noi_dung"]) <= 220
            assert not re.search(r"\{[a-z_]+\}", p["noi_dung"])
            if t["noi_bat"]:
                co_ngay += 1
                assert any(x["tieu_de"] in p["noi_dung"] for x in t["noi_bat"])
                tot = [x for x in t["noi_bat"] if x["loai"] in ("thuan", "hop_tuoi")]
                if tot:                                   # có ngày tích cực thì thông báo nêu ngày đó, không nêu "ngày nên đi chậm"
                    assert tot[0]["tieu_de"] in p["noi_dung"]
            else:
                khong_ngay += 1
            assert not re.search(r"\d{4}|sinh", p["noi_dung"])               # không mang năm / ngày sinh
    assert co_ngay > 10


def test_api_push_tuan():
    from fastapi.testclient import TestClient

    from app.main import app

    c = TestClient(app)
    r = c.post("/v1/push/tuan", json={"ngay_xem": "2026-11-16", "nguoi": [{"ngay_sinh": "1995-06-15"}, {"ngay_sinh": "1850-01-01"}]})
    assert r.status_code == 200
    kq = r.json()["ket_qua"]
    assert kq[0]["duong"] == "/hom-nay#tuan-nay" and kq[1] is None
    assert "1995" not in r.text.replace('"ngay_xem"', "")
    r2 = c.post("/v1/push/tuan", json={"ngay_xem": "2026-11-17", "nguoi": [{"ngay_sinh": "1995-06-15"}]})
    assert r2.json()["ket_qua"] == [None]
    assert c.post("/v1/push/tuan", json={"ngay_xem": "2026-11-16", "nguoi": [{"ngay_sinh": "1995-06-15", "ten": "A"}]}).status_code == 422
