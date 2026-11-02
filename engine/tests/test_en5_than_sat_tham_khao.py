# -*- coding: utf-8 -*-
"""EN-5.3 (2026-11-02) — thần sát THAM KHẢO Bát tự: Học Đường · Thiên La · Địa Võng · Kim Thần (viết TRƯỚC hàm
`battu_mo_rong.than_sat_tham_khao`). Phái chính: Tam Mệnh Thông Hội (cùng nguồn bảng thần sát hiện có); cách khác của
sách ghi ở `theo_cach_khac`. Quyết định + so sánh 3 phương án: docs/QUYET-DINH-EN5-EN6.md.

Golden:
- `than_sat_tham_khao_tay.json` — tính tay theo nguyên văn sách (6 ca, gồm ca "năm không tự tính", ngày Bính không có
  Kim Thần theo sách gốc);
- `than_sat_tham_khao.json` — 5.000 tứ trụ, oracle shunshi-bazi-core (MIT) ở những phần quy tắc TRÙNG engine.

Ràng buộc: các sao này KHÔNG vào `than_sat` (bảng đếm cát / hung của luận giải đời sống) → không đổi mức nào."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import battu_mo_rong as mr

GOLD = Path(__file__).parents[1] / "fixtures" / "golden"
TAY = json.loads((GOLD / "than_sat_tham_khao_tay.json").read_text(encoding="utf-8"))["cases"]
ORA = json.loads((GOLD / "than_sat_tham_khao.json").read_text(encoding="utf-8"))
HAN = dict(zip("甲乙丙丁戊己庚辛壬癸", mr.CAN)) | dict(zip("子丑寅卯辰巳午未申酉戌亥", mr.CHI))
TEN = ("Học Đường", "Thiên La", "Địa Võng", "Kim Thần")


def _tru(ds: list[str]) -> list[dict]:
    return [dict(zip(("can", "chi"), x.split())) for x in ds]


def _tru_han(s: str) -> list[dict]:
    return [{"can": HAN[s[i]], "chi": HAN[s[i + 1]]} for i in range(0, 8, 2)]


def _theo_ten(ds: list[dict]) -> dict[str, dict]:
    return {x["ten"]: x for x in ds}


@pytest.mark.parametrize("ca", TAY, ids=[c["ten"] for c in TAY])
def test_tinh_tay(ca):
    kq = _theo_ten(mr.than_sat_tham_khao(_tru(ca["tru"])))
    assert set(kq) == set(TEN)
    for ten, mong in ca["expect"].items():
        assert kq[ten]["tru"] == mong["tru"], ten
        assert kq[ten]["co"] is bool(mong["tru"]), ten
        assert kq[ten]["theo_cach_khac"] == mong["theo_cach_khac"], ten
        if "chinh" in mong:
            assert kq[ten]["chinh"] is mong["chinh"], ten


def test_oracle_5000():
    """Phần quy tắc oracle trùng engine: Kim Thần cách phổ thông (= `theo_cach_khac`), Địa Võng ở trụ ngày,
    Chính Học Đường ở tháng / ngày / giờ."""
    lech = []
    for t, hanh, kim, dv_ngay, chd in ORA["ca"]:
        tru = _tru_han(t)
        kq = _theo_ten(mr.than_sat_tham_khao(tru))
        assert mr.can_chi.nap_am(tru[0]["can"], tru[0]["chi"])["hanh"] == {"金": "Kim", "木": "Mộc", "水": "Thủy",
                                                                           "火": "Hỏa", "土": "Thổ"}[hanh]
        hd = kq["Học Đường"]
        if (kq["Kim Thần"]["theo_cach_khac"] != kim
                or (2 in kq["Địa Võng"]["tru"]) != bool(dv_ngay)
                or hd["chinh_tru"] != chd or hd["chinh"] is not bool(chd)
                or any(i not in hd["tru"] for i in chd)):
            lech.append(t)
    assert not lech, lech[:10]
    # golden có đủ ca dương tính để phép so có nghĩa
    assert sum(bool(c[2]) for c in ORA["ca"]) > 200 and sum(c[3] for c in ORA["ca"]) > 200
    assert sum(bool(c[4]) for c in ORA["ca"]) > 200


def test_chinh_hoc_duong_dung_mot_can_chi_moi_hanh():
    """Chính Học Đường = can chi ở nơi Trường Sinh có nạp âm cùng hành mệnh: đúng 5 can chi sách nêu."""
    gap = {}
    for h_nam, nam in (("Kim", "Giáp Tý"), ("Mộc", "Nhâm Ngọ"), ("Thủy", "Bính Tý"), ("Thổ", "Canh Ngọ"),
                       ("Hỏa", "Bính Dần")):
        for i in range(60):
            gz = f"{mr.CAN[i % 10]} {mr.CHI[i % 12]}"
            kq = _theo_ten(mr.than_sat_tham_khao(_tru([nam, gz, "Giáp Tý", "Giáp Tý"])))["Học Đường"]
            if kq["chinh"]:
                gap.setdefault(h_nam, []).append(gz)
    assert gap == {"Kim": ["Tân Tỵ"], "Mộc": ["Kỷ Hợi"], "Thủy": ["Giáp Thân"], "Thổ": ["Mậu Thân"], "Hỏa": ["Bính Dần"]}


def test_khong_vao_bang_dem_luan_giai():
    """Không đổi mức đời sống: `than_sat` (bảng đếm cát / hung) không có bốn sao này; mo_rong tách riêng."""
    from app.calc import battu as bt
    import datetime as dt
    ls = bt.la_so(dt.datetime(1990, 5, 17, 12, 30), "nam")
    m = mr.mo_rong(ls)
    assert not {x["ten"] for x in m["than_sat"]} & set(TEN)
    assert {x["ten"] for x in m["than_sat_tham_khao"]} == set(TEN)
    assert "Tam Mệnh Thông Hội" in m["than_sat_tham_khao_nguon"]


def test_loi_trung_tinh_co_nguon_va_cach_khac():
    cam = ("tai hoạ", "tai họa", "tù", "ngục", "chết", "ác tử", "hung", "xấu", "vật phẩm", "giải hạn", "cúng")
    for x in mr.than_sat_tham_khao(_tru(["Bính Dần", "Mậu Tuất", "Kỷ Hợi", "Bính Dần"])):
        assert x["loai"] in ("cát", "trung")
        for k in ("y", "cach_khac", "phai"):
            assert x[k] and not any(c in x[k].lower() for c in cam), (x["ten"], k, x[k])
        assert x["nhom"] in ("Học Đường", "Thiên La Địa Võng", "Kim Thần")


# ------------------------------------------------------------------ hỏi đáp
SINH = {"lich": dt.datetime(2022, 3, 5, 9, 0), "gioi_tinh": "nu"}   # Nhâm Dần · Nhâm Dần · Đinh Tỵ · Ất Tỵ


@pytest.mark.parametrize("cau,khoa", [
    ("Tôi có sao Học Đường không?", "Học Đường có ở trụ ngày, giờ"),
    ("Bát tự tôi có Thiên La Địa Võng không?", "không có Địa Võng"),
    ("bat tu toi co thien la dia vong khong", "Theo cách đó, bạn có ở trụ ngày, giờ"),
    ("Kim Thần trong lá số của tôi", "không có Kim Thần")])
def test_hoi_dap(cau, khoa):
    from app.hoidap import battu as hd
    r = hd.tra_loi(cau, sinh=SINH, ngay_xem=dt.date(2026, 11, 2), dung_llm=False)
    assert r["phan_loai"]["chu_de"] == "than_sat_tk"
    assert khoa in r["cau_tra_loi"]
    assert "không làm đổi mức" in r["cau_tra_loi"]


def test_hoi_dap_thien_la_noi_ro_khac_bat_han():
    from app.hoidap import battu as hd
    r = hd.tra_loi("Bát tự tôi có Thiên La không?", sinh=SINH, ngay_xem=dt.date(2026, 11, 2), dung_llm=False)
    assert "Bát hạn" in r["cau_tra_loi"]


@pytest.mark.parametrize("cau", ["Con tôi học đường nào tốt?", "Tôi mệnh Kim thân hình gầy, hợp nghề gì?",
                                 "Sống thiện là gì, tứ trụ tôi thế nào?", "Lá số tôi có sao gì tốt?"])
def test_khong_bat_nham(cau):
    from app.hoidap import battu as hd
    assert hd.phan_loai(cau)["chu_de"] != "than_sat_tk"
