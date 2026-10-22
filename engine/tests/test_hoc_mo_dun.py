# -*- coding: utf-8 -*-
"""HỌC-ĐS — vòng tự cải thiện cho MỌI mảng dùng khuôn `doi_song_1`: hộp Phong thuỷ ("Nhà của bạn") và Kinh Dịch (đọc quẻ)
có mã kiểm chứng tất định `ds.<mảng>.*`; `ap_hoc` dùng chung hạ hộp có tỉ lệ đúng thấp (≥ 100 phiếu, < 40%) xuống
"Vì sao nói vậy" và xếp cuối hộp người xem đã bấm "chưa đúng". Máy không sinh câu mới, không sửa KB; không chữ người
dùng, không ngày sinh đi kèm phiếu. Test viết trước (quy tắc code)."""
from __future__ import annotations

import copy
import datetime as dt
import re

from fastapi.testclient import TestClient

from app.hoidap import kinhdich as kd
from app.luangiai import doi_song_khuon as kh, phongthuy_doi_song
from app.main import app

MA_DS = re.compile(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$")
NHA = {"huong_do": 180.0, "nam_xay": 2008, "theo": "cua"}
SINH = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)}
NGAY = dt.date(2026, 5, 20)


def _bc_pt():
    return phongthuy_doi_song.luan_giai(SINH, NHA, [{"vai": "vo", "nam": 1992, "gioi_tinh": "nu"}], ngay_xem=NGAY)


def _dq():
    return kd.tra_loi("Tôi có nên chuyển việc sang công ty mới không?", "tu_dong", gia_tri_hao=[7, 7, 8, 7, 7, 9],
                      thoi_diem=dt.datetime(2026, 5, 20, 10))["doc_que"]


def test_phong_thuy_moi_hop_co_ma_tat_dinh():
    a, b = _bc_pt(), _bc_pt()
    for c in a["chuong"]:
        for h in c["hop"]:
            assert MA_DS.match(h["ma_mau"]) and h["ma_mau"].startswith("ds.phongthuy.") and len(h["ma_mau"]) <= 60, h
        assert len({h["ma_mau"] for h in c["hop"]}) == len(c["hop"]), c["ma"]       # không trùng trong một chương
    assert [h["ma_mau"] for c in a["chuong"] for h in c["hop"]] == [h["ma_mau"] for c in b["chuong"] for h in c["hop"]]
    assert all(h["ma_mau"] for h in a["cot_loi"])


def test_kinh_dich_moi_hop_co_ma_tat_dinh():
    dq = _dq()
    assert dq["hop"]
    for h in dq["hop"]:
        assert MA_DS.match(h["ma_mau"]) and h["ma_mau"].startswith("ds.kinhdich.") and len(h["ma_mau"]) <= 60, h
    assert len({h["ma_mau"] for h in dq["hop"]}) == len(dq["hop"])
    assert _dq()["hop"][0]["ma_mau"] == dq["hop"][0]["ma_mau"]


def test_ap_hoc_ha_hop_va_xep_cuoi_theo_phieu():
    bc = _bc_pt()
    c = next(c for c in bc["chuong"] if len(c["hop"]) >= 2)
    ha, cuoi = c["hop"][0]["ma_mau"], c["hop"][1]["ma_mau"]
    goc = copy.deepcopy(bc)
    out = kh.ap_hoc(bc, {ha: {"dung": 20, "chua_dung": 100}, cuoi: {"dung": 40, "chua_dung": 10}}, {cuoi: "chua_dung"})
    c2 = next(x for x in out["chuong"] if x["ma"] == c["ma"])
    assert ha not in [h["ma_mau"] for h in c2["hop"]] and any("Đang xem lại" in s for s in c2["can_cu"])
    assert c2["hop"][-1]["ma_mau"] == cuoi and c2["hop"][-1]["ty_le_dung"] == 0.8 and c2["hop"][-1]["so_phieu"] == 50
    assert ha not in [h.get("ma_mau") for h in out["cot_loi"]]
    # không khoá nội bộ lọt ra; không trọng số → giữ nguyên
    assert not any(k.startswith("_") for x in out["chuong"] for h in x["hop"] for k in h)
    assert kh.ap_hoc(copy.deepcopy(goc), None, None)["chuong"] == goc["chuong"]
    # đọc quẻ (một nhóm hộp, can_cu là danh sách dict) cũng hạ được
    dq = _dq()
    m = dq["hop"][0]["ma_mau"]
    out2 = kh.ap_hoc(dq, {m: {"dung": 10, "chua_dung": 95}}, None)
    assert m not in [h["ma_mau"] for h in out2["hop"]] and any("Đang xem lại" in x["tieu_de"] for x in out2["can_cu"])


def test_api_nhan_trong_so_ca_nhan_phong_thuy_va_kinh_dich():
    cl = TestClient(app)
    r = cl.post("/v1/phongthuy/luan-giai", json={"sinh": {"birth_date": "1990-05-17", "gender": "nam"}, "nha": NHA, "ngay_xem": "2026-05-20"})
    assert r.status_code == 200
    ma = r.json()["chuong"][0]["hop"][0]["ma_mau"]
    r2 = cl.post("/v1/phongthuy/luan-giai", json={"sinh": {"birth_date": "1990-05-17", "gender": "nam"}, "nha": NHA, "ngay_xem": "2026-05-20",
                                                 "trong_so": {ma: {"dung": 5, "chua_dung": 120}}, "ca_nhan": {}})
    assert r2.status_code == 200 and ma not in [h.get("ma_mau") for h in r2.json()["chuong"][0]["hop"]]
    r3 = cl.post("/v1/kinhdich/hoi", json={"cau_hoi": "Tôi có nên chuyển việc không?", "cach_ra_que": "gieo_tay",
                                           "gia_tri_hao": [7, 7, 8, 7, 7, 9], "trong_so": {"ds.kinhdich.x.y": {"dung": 1, "chua_dung": 1}}})
    assert r3.status_code == 200 and r3.json()["doc_que"]["hop"][0]["ma_mau"].startswith("ds.kinhdich.")
    # mã sai dạng → 422 (không cho bơm chuỗi lạ qua trọng số)
    assert cl.post("/v1/phongthuy/luan-giai", json={"nha": NHA, "trong_so": {"Không Hợp Lệ": {"dung": 1, "chua_dung": 1}}}).status_code == 422
