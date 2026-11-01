# -*- coding: utf-8 -*-
"""EN-5.4 — câu hỏi quyết định có khung thời gian ("có nên đổi việc trong 6 tháng tới") → CỬA SỔ THÁNG (tháng thuận /
tháng nên đi chậm) từ đúng các hàm tháng của Thời gian tới; không trả lời có/không. Viết TRƯỚC `luangiai/cua_so.py`."""
from __future__ import annotations

import datetime as dt

import pytest

from app.hoidap import chung, hieu_cau
from app.luangiai import cua_so, thoi_gian_toi as tgt

H = dt.date(2026, 11, 1)


@pytest.mark.parametrize("cau,n", [("có nên đổi việc trong 6 tháng tới không", 6), ("3 tháng tới có nên chuyển nhà", 3),
                                   ("mấy tháng tới tôi có nên mua nhà", 6), ("nửa năm tới có nên khởi nghiệp", 6),
                                   ("từ giờ tới cuối năm có nên nghỉ việc", 2), ("trong 12 tháng tới tháng nào nên cưới", 12),
                                   ("sáu tháng tới", 6), ("có nên đổi việc không", None), ("năm sau có nên cưới", None),
                                   ("tháng 3 tới có nên ký hợp đồng", None), ("20 tháng tới", 12)])
def test_khung_thang(cau, n):
    assert hieu_cau.khung_thang(chung.chuan_hoa_cau(cau), H) == n


TV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
BT = {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}


@pytest.mark.parametrize("mo_dun,sinh", [("tuvi", TV), ("battu", BT)])
def test_cua_so_dung_ham_thang_cua_thoi_gian_toi(mo_dun, sinh):
    c = cua_so.lap(mo_dun, sinh, H, 6)
    assert 5 <= len(c["thang"]) <= 7
    goc = (tgt._tv_thang(sinh, H, 2, None) if mo_dun == "tuvi" else tgt._bt_thang(sinh, H, 6))
    muc_goc = {x["tu"]: x["muc"] for x in goc}
    for x in c["thang"]:
        assert x["muc"] == muc_goc[x["tu"]]                       # một bộ tính: không chấm lại
    assert {x["ten"] for x in c["thuan"]} == {x["ten"] for x in c["thang"] if x["muc"] == "thuan"}
    assert {x["ten"] for x in c["cham"]} == {x["ten"] for x in c["thang"] if x["muc"] == "can_chu_dong"}
    assert c["thang"][0]["tu"] <= H.isoformat() <= c["thang"][0]["den"] or c["thang"][0]["tu"] >= H.isoformat()


@pytest.mark.parametrize("cau", ["Có nên đổi việc trong 6 tháng tới không?", "3 tháng tới tôi có nên chuyển nhà?"])
def test_hoi_dap_tu_vi_tra_cua_so_truoc(cau):
    from app.hoidap import tuvi as tv
    r = tv.tra_loi(cau, sinh=TV, ngay_xem=H, dung_llm=False)
    assert r["bang_chung"]["muc"][0]["loai"] == "cua_so"
    van = r["cau_tra_loi"]
    assert van.startswith("Trong ")
    assert "không trả lời có hay không" in van
    for cam in ("nên đổi việc ngay", "không nên đổi", "chắc chắn"):
        assert cam not in van


def test_hoi_dap_bat_tu_tra_cua_so():
    from app.hoidap import battu as bt
    r = bt.tra_loi("Có nên khởi nghiệp trong 6 tháng tới không?", sinh=BT, ngay_xem=H, dung_llm=False)
    assert any(m["loai"] == "cua_so" for m in r["bang_chung"]["muc"])
    assert "tháng" in r["cau_tra_loi"].split("\n")[0].lower()


def test_khong_co_khung_thi_khong_chen():
    from app.hoidap import tuvi as tv
    r = tv.tra_loi("Tôi có nên đổi việc không?", sinh=TV, ngay_xem=H, dung_llm=False)
    assert not any(m["loai"] == "cua_so" for m in r["bang_chung"]["muc"])


def test_cau_khung_hoang_khong_chen():
    from app.hoidap import tuvi as tv
    r = tv.tra_loi("3 tháng tới tôi muốn chết cho xong", sinh=TV, ngay_xem=H, dung_llm=False)
    assert not any(m["loai"] == "cua_so" for m in r["bang_chung"]["muc"])


def test_loi_khong_nhac_thang_khong_co():
    m = {"so_thang": 3, "thang": [{"ten": "Tháng Dần (4/2–5/3)", "tu": "2027-02-04", "den": "2027-03-05", "muc": "can_bang"}],
         "thuan": [], "cham": []}
    s = chung.doan_cua_so(m)
    assert "tháng thuận" not in s and "đi chậm dùng" not in s
    m["cham"] = [{**m["thang"][0], "muc": "can_chu_dong"}]
    s = chung.doan_cua_so(m)
    assert "những tháng nhịp đều" in s and "đi chậm dùng" in s
