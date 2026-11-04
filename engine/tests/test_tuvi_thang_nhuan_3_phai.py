# -*- coding: utf-8 -*-
"""TV-NHUAN3 — cách thứ ba tính tháng nhuận: `ca_thang_sau` = CẢ tháng nhuận tính như tháng sau. Viết TRƯỚC hàm.

Golden tính tay: fixtures/golden/tuvi_thang_nhuan_3_phai.json (quy ước, cách kẹp ngày ghi trong tệp).
Cách làm: như hai lựa chọn cũ — chỉ thay NGÀY ÂM đưa vào iztro (tháng + 1, không nhuận), mọi quy tắc an sao vẫn
của iztro. Mặc định (`thang_sau`) không đổi.
Kiểm theo lối "leap-policy validation": lựa chọn lạ bị từ chối ngay (không lặng lẽ an theo một cách khác), ba lựa
chọn khớp bảng định nghĩa viết độc lập, mỗi lựa chọn ra đủ 12 cung khác nhau.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import lunar, tuvi_an_sao as az, tuvi_luu_nguyet as ln

GOLDEN = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "tuvi_thang_nhuan_3_phai.json")
                    .read_text(encoding="utf-8"))
BA = ("thang_sau", "thang_chinh", "ca_thang_sau")
CHINH_TINH = {"Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
              "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"}


def _ngay(s: str) -> dt.date:
    return dt.date.fromisoformat(s)


def _cung_sao(la: dict, ten: str) -> str:
    return next(p["earthlyBranch"] for p in la["palaces"] for s in p["majorStars"] + p["minorStars"] if s["name"] == ten)


def test_ba_lua_chon():
    assert az.THANG_NHUAN == BA and ln.THANG_NHUAN == BA


@pytest.mark.parametrize("c", GOLDEN["ham_thuan"], ids=lambda c: f"{c['thang']}-{c['ngay']}-{c['nhuan']}")
def test_thang_tinh_ham_thuan(c):
    for tn in BA:
        assert ln.thang_tinh(c["thang"], c["ngay"], c["nhuan"], tn) == c[tn], tn


def test_ngay_golden_dung_la_thang_nhuan():
    for c in GOLDEN["cases"]:
        d = _ngay(c["duong"])
        ng, th, na, nh = lunar.solar_to_lunar(d.day, d.month, d.year, 7.0)
        assert (ng, th, na, bool(nh)) == (c["am"]["ngay"], c["am"]["thang"], c["am"]["nam"], c["am"]["nhuan"]), c["id"]


@pytest.mark.parametrize("c", GOLDEN["cases"], ids=lambda c: c["id"])
def test_la_so_khop_tinh_tay(c):
    for tn in BA:
        la = az.an_sao_tho(_ngay(c["duong"]), c["ti"], c["gioi_tinh"], thang_nhuan=tn)
        k = c["ky_vong"][tn]
        menh = next(p["earthlyBranch"] for p in la["palaces"] if p["name"] == "Mệnh")
        than = next(p["earthlyBranch"] for p in la["palaces"] if p["isBodyPalace"])
        assert (menh, than, _cung_sao(la, "Tả Phù"), _cung_sao(la, "Hữu Bật")) == \
            (k["menh"], k["than"], k["ta_phu"], k["huu_bat"]), (c["id"], tn)
        # nhãn ngày âm vẫn là ngày sinh thật (tháng nhuận), không phải tháng đã đổi để an sao
        assert la["lunarDate"] == az.an_sao_tho(_ngay(c["duong"]), c["ti"], c["gioi_tinh"])["lunarDate"]
        # năm can chi giữ năm sinh
        assert la["chineseDate"].split(" - ")[0] == \
            az.an_sao_tho(_ngay(c["duong"]), c["ti"], c["gioi_tinh"])["chineseDate"].split(" - ")[0]


def test_nua_sau_trung_khit_thang_sau_ke_ca_ngay_30():
    """Ngày 16–hết: cả hai cách đều tính tháng sau → cùng một lá (ngày 30 không kẹp về 29)."""
    for s in ("2025-08-11", "2017-08-21"):
        a = az.an_sao_tho(_ngay(s), 4, "nam", thang_nhuan="thang_sau")
        b = az.an_sao_tho(_ngay(s), 4, "nam", thang_nhuan="ca_thang_sau")
        assert a["palaces"] == b["palaces"], s


def test_nua_dau_khac_thang_sau():
    a = az.an_sao_tho(_ngay("2025-08-03"), 4, "nam", thang_nhuan="thang_sau")
    b = az.an_sao_tho(_ngay("2025-08-03"), 4, "nam", thang_nhuan="ca_thang_sau")
    assert a["palaces"] != b["palaces"]
    # ngày 10 tháng nhuận an như ngày 10 tháng 7: so với ngày 10/7 âm 2025 (Tử Vi theo ngày + Cục cùng năm)
    d, m, y = lunar.lunar_to_solar(10, 7, 2025, 0, 7.0)
    c = az.an_sao_tho(dt.date(y, m, d), 4, "nam")
    assert [(p["earthlyBranch"], p["name"], [s["name"] for s in p["majorStars"]]) for p in b["palaces"]] == \
        [(p["earthlyBranch"], p["name"], [s["name"] for s in p["majorStars"]]) for p in c["palaces"]]


def test_ngay_thuong_ba_cach_nhu_nhau():
    for tn in BA[1:]:
        assert az.an_sao_tho(dt.date(1990, 5, 17), 6, "nu", thang_nhuan=tn)["palaces"] == \
            az.an_sao_tho(dt.date(1990, 5, 17), 6, "nu")["palaces"]


@pytest.mark.parametrize("tn", BA)
@pytest.mark.parametrize("s", ["2025-08-03", "2025-08-11", "2017-08-21", "2033-12-26"])
def test_moi_lua_chon_du_12_cung_khac_nhau(tn, s):
    la = az.an_sao_tho(_ngay(s), 4, "nam", thang_nhuan=tn)
    p = la["palaces"]
    assert len(p) == 12 and len({x["earthlyBranch"] for x in p}) == 12 and len({x["name"] for x in p}) == 12
    sao = [s["name"] for x in p for s in x["majorStars"]]
    assert sorted(sao) == sorted(CHINH_TINH)


@pytest.mark.parametrize("lich", ["viet", "trung"])
def test_van_han_va_lich_trung(lich):
    d = _ngay("2025-08-03")
    la = az.an_sao_tho(d, 4, "nam", thang_nhuan="ca_thang_sau", lich=lich)
    assert next(p["earthlyBranch"] for p in la["palaces"] if p["name"] == "Mệnh") == "Thìn"
    v = az.van_han(d, 4, "nam", dt.date(2027, 7, 1), thang_nhuan="ca_thang_sau", lich=lich)
    # đại hạn khởi từ cung Mệnh của CHÍNH lá đã an theo lựa chọn này
    assert la["palaces"][v["dai_han"]["chi_so"]]["decadal"]["range"] == [v["dai_han"]["tu_tuoi"], v["dai_han"]["den_tuoi"]]


def test_nap_truoc_trung_goi_le():
    s = {"ngay": _ngay("2025-08-03"), "ti": 4, "gioi_tinh": "nam", "thang_nhuan": "ca_thang_sau"}
    az._xoa_nho()
    az.nap_truoc_sinh(s, dt.date(2027, 3, 1))
    a = az.an_sao_tho(s["ngay"], 4, "nam", thang_nhuan="ca_thang_sau")
    va = az.van_han(s["ngay"], 4, "nam", dt.date(2027, 3, 1), thang_nhuan="ca_thang_sau")
    az._xoa_nho()
    assert a == az.an_sao_tho(s["ngay"], 4, "nam", thang_nhuan="ca_thang_sau")
    assert va == az.van_han(s["ngay"], 4, "nam", dt.date(2027, 3, 1), thang_nhuan="ca_thang_sau")


# ---- leap-policy validation: lựa chọn lạ bị từ chối ngay --------------------------------------------------------
@pytest.mark.parametrize("sai", ["thangsau", "ca-thang-sau", "", "CA_THANG_SAU", None, 7])
def test_lua_chon_la_bi_tu_choi(sai):
    with pytest.raises(ValueError):
        az.an_sao_tho(_ngay("2025-08-03"), 4, "nam", thang_nhuan=sai)
    with pytest.raises(ValueError):
        ln.thang_tinh(6, 10, True, sai)
    with pytest.raises(ValueError):
        ln.cac_thang(2025, thang_nhuan=sai)


def test_api_422_va_tra_lua_chon():
    from fastapi.testclient import TestClient
    from app.main import app
    cl = TestClient(app)
    base = {"birth_date": "2025-08-03", "birth_time": "08:00", "gender": "nam", "noi_sinh": "ha-noi"}
    assert cl.post("/v1/tuvi/an-sao", json={**base, "thang_nhuan": "ca-thang-sau"}).status_code == 422
    a = cl.post("/v1/tuvi/an-sao", json=base).json()
    b = cl.post("/v1/tuvi/an-sao", json={**base, "thang_nhuan": "ca_thang_sau"}).json()
    assert b["phai"]["thang_nhuan"] == "ca_thang_sau"
    # nửa đầu tháng nhuận: hai cách cũ trùng nhau, cách mới khác → vẫn báo "sinh trong tháng nhuận" để web hiện lựa chọn
    assert a["phai"]["co_the_doi_thang_nhuan"] is False and a["phai"]["sinh_thang_nhuan"] is True
    assert next(x["chi"] for x in a["cung"] if x["la_menh"]) == "Mão"
    assert next(x["chi"] for x in b["cung"] if x["la_menh"]) == "Thìn"
    assert b["am_lich"] == a["am_lich"] == {"ngay": 10, "thang": 6, "nam": 2025, "nhuan": 1}
    c = cl.post("/v1/tuvi/an-sao", json={**base, "birth_date": "1990-05-17"}).json()
    assert c["phai"]["sinh_thang_nhuan"] is False


# ---- lưu nguyệt / nhịp 3 tháng / hỏi đáp / đời sống theo cùng lựa chọn -------------------------------------------
def test_cac_thang_ca_thang_nhuan_tinh_thang_sau():
    ds = ln.cac_thang(2025, tz=7.0, thang_nhuan="ca_thang_sau")
    assert len(ds) == 13
    t = next(m for m in ds if m["nhuan"])
    assert (t["thang"], t["phan"], t["thang_tinh"], t["ngay_am"]) == (6, "ca_thang", 7, (1, 29))
    assert t["can_chi"] == "Giáp Thân"                         # can chi tháng 7 → tứ hoá tháng theo tháng 7
    for a, b in zip(ds, ds[1:]):
        assert b["tu"] == a["den"] + dt.timedelta(days=1)


def test_luu_nguyet_thang_sinh_theo_lua_chon():
    from app.luangiai import tuvi_luu_nguyet as lnl
    s = {"ngay": _ngay("2025-08-03"), "ti": 4, "gioi_tinh": "nam"}
    assert lnl.lap_nam(s, 2027)["thang_sinh"] == 6
    r = lnl.lap_nam({**s, "thang_nhuan": "ca_thang_sau"}, 2027)
    assert r["thang_sinh"] == 7 and r["thang_nhuan"] == "ca_thang_sau"
    # Đẩu Quân: tháng sinh lùi/tiến một → tháng Giêng dời một cung
    a = lnl.lap_nam(s, 2027)["thang"][0]["chi"]
    assert lunar.CHI.index(r["thang"][0]["chi"]) == (lunar.CHI.index(a) - 1) % 12


def test_nhip_3_thang_nhan_thang_nhuan_tinh_nhu_thang_sau():
    from app.luangiai import tuvi_nhip_3_thang as nh
    s = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam", "thang_nhuan": "ca_thang_sau"}
    kq = nh.lap(s, dt.date(2025, 7, 10))
    t = next(x for x in kq["thang"] if x["nhuan"])
    assert t["thang_tinh"] == 7 and "tính như tháng 7" in t["nhan_thang"]
    assert any("Cả tháng nhuận tính như tháng 7" in x for x in t["can_cu"])


def test_hoi_dap_va_doi_song_chay_duoc():
    from app.hoidap import tuvi as hd
    from app.luangiai import tuvi_doi_song as ds
    s = {"ngay": _ngay("2025-08-03"), "ti": 4, "gioi_tinh": "nam", "thang_nhuan": "ca_thang_sau"}
    r = hd.tra_loi("Cung Mệnh của tôi thế nào?", sinh=s, ngay_xem=dt.date(2027, 3, 1))
    assert r
    bc = ds.lap(s, dt.date(2027, 3, 1))
    assert bc["chuong"]


@pytest.mark.parametrize("duong,body", [
    ("/v1/tuvi/hoi", {"cau_hoi": "Tháng tới của tôi thế nào?"}),
    ("/v1/tuvi/luan-giai", {"ngay_xem": "2027-03-01"}),
    ("/v1/tuvi/luu-nguyet", {"nam_am": 2027}),
    ("/v1/tuvi/nhip-3-thang", {"ngay_xem": "2027-03-01"}),
    ("/v1/tuvi/phi-hoa", {}),
    ("/v1/thoi-gian-toi", {"ngay_sinh": "2025-08-03", "ngay_xem": "2026-11-04"}),
])
def test_moi_route_nhan_lua_chon_moi(duong, body):
    from fastapi.testclient import TestClient
    from app.main import app
    cl = TestClient(app)
    la = {"birth_date": "2025-08-03", "birth_time": "08:00", "gender": "nam", "noi_sinh": "ha-noi",
          "thang_nhuan": "ca_thang_sau"}
    r = cl.post(duong, json={"la_so": la, **body})
    assert r.status_code == 200, r.text[:300]
