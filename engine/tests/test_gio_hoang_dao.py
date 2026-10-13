# -*- coding: utf-8 -*-
"""HN-3 giờ hoàng đạo — viết TRƯỚC hàm. Đối chiếu oracle lunar-typescript (fixtures/golden/gio_hoang_dao.json,
60 ngày × 12 giờ). Tầng CALC: thuần, tất định."""
import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import gio_hoang_dao as g

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "gio_hoang_dao.json").read_text(encoding="utf-8"))
HAN_CHI = dict(zip("子丑寅卯辰巳午未申酉戌亥", g.CHI))
HAN_THAN = {"青龙": "Thanh Long", "明堂": "Minh Đường", "天刑": "Thiên Hình", "朱雀": "Chu Tước", "金匮": "Kim Quỹ",
            "天德": "Bảo Quang", "白虎": "Bạch Hổ", "玉堂": "Ngọc Đường", "天牢": "Thiên Lao", "玄武": "Huyền Vũ",
            "司命": "Tư Mệnh", "勾陈": "Câu Trận"}


@pytest.mark.parametrize("ngay", G["ngay"], ids=lambda n: n["ngay"])
def test_khop_oracle(ngay):
    d = dt.date.fromisoformat(ngay["ngay"])
    assert g.chi_ngay(d) == HAN_CHI[ngay["chi_ngay"]]
    bang = g.bang_gio(d)
    for i, o in enumerate(ngay["gio"]):
        assert bang[i]["chi"] == HAN_CHI[o["chi"]]
        assert bang[i]["than"] == HAN_THAN[o["than"]]
        assert bang[i]["hoang_dao"] is o["cat"]


def test_sau_gio_hoang_dao_moi_ngay_va_khung_gio():
    ds = g.gio_hoang_dao(dt.date(2026, 10, 13))        # ngày Canh Thân
    assert [x["chi"] for x in ds] == ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"]
    assert ds[0]["tu"] == "23:00" and ds[0]["den"] == "01:00"
    assert ds[2] == {"chi": "Thìn", "tu": "07:00", "den": "09:00", "than": "Kim Quỹ", "hoang_dao": True}


def test_the_hom_nay_co_gio_hoang_dao():
    from fastapi.testclient import TestClient
    from app.main import app
    j = TestClient(app).post("/v1/thanso/hom-nay", json={"ngay": 17, "thang": 5, "nam": 1990, "ngay_xem": "2026-10-13"}).json()
    assert j["gio_hoang_dao"] == g.gio_hoang_dao(dt.date(2026, 10, 13)) and len(j["gio_hoang_dao"]) == 6
