# -*- coding: utf-8 -*-
"""QTE — Thần số tiếng Anh: bản phủ `kb/data/en/thanso_*.json` + mẫu câu `loi_khuon.json` + hỏi đáp gọn `hoi_en` phải phủ
MỌI chữ hiện ra của bài đọc `/v1/thanso/luan-giai`, trang số `/v1/thanso/so/{n}` và `/v1/thanso/hoi`; bản Việt không đổi."""
from __future__ import annotations

import datetime as dt
import re

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.luangiai import hoi_en, thanso as lg
from app.main import app

client = TestClient(app)
XEM = dt.date(2026, 11, 8)
_VI = re.compile(r"[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]")
NGUOI = {"ho_ten": ["John Smith", "Johnny"], "ngay": 24, "thang": 10, "nam": 1988, "quy_uoc": "tung_phan"}
EN = {"x-ngon-ngu": "en"}


def _chuoi(x, duong=""):
    if isinstance(x, dict):
        for k, v in x.items():
            yield from _chuoi(v, f"{duong}.{k}")
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from _chuoi(v, f"{duong}[{i}]")
    elif isinstance(x, str):
        yield duong, x


def _khong_viet(d, bo_qua: tuple[str, ...] = ()):
    loi = [(p, s[:90]) for p, s in _chuoi(d) if _VI.search(s) and not p.endswith(bo_qua)]
    assert not loi, loi[:12]


def test_bai_doc_tieng_anh():
    with ngon_ngu.dung("en"):
        bc = lg.luan_giai(NGUOI["ho_ten"], 24, 10, 1988, "tung_phan")
    assert bc["cac_vi_tri"][0]["ten"] == "Life Path" and bc["chan_dung"]["mat"][0]["ten"] == "Overview"
    assert bc["cac_vi_tri"][0]["nghia"]["tu_khoa"] and bc["chieu_sau"]["nam_ca_nhan"][0]["nghia"]["chu_de"]
    _khong_viet(bc, bo_qua=(".source_id", ".school_id", ".trang_thai", ".ten_chinh", ".ten_bien_the_da_quet", ".quy_uoc_duong_doi"))


def test_route_luan_giai_theo_header():
    r = client.post("/v1/thanso/luan-giai", json={"ho_ten": ["Mary Ann Lee"], "ngay": 5, "thang": 3, "nam": 1995}, headers=EN)
    assert r.status_code == 200 and r.json()["cac_vi_tri"][1]["ten"] == "Expression"
    _khong_viet(r.json(), bo_qua=(".source_id", ".school_id", ".trang_thai", ".ten_chinh", ".ten_bien_the_da_quet", ".quy_uoc_duong_doi"))
    # cùng yêu cầu không header → tiếng Việt y cũ
    r2 = client.post("/v1/thanso/luan-giai", json={"ho_ten": ["Mary Ann Lee"], "ngay": 5, "thang": 3, "nam": 1995})
    assert r2.json()["cac_vi_tri"][1]["ten"] == "Sứ mệnh"


@pytest.mark.parametrize("so", [1, 7, 11, 33])
def test_trang_so(so):
    r = client.get(f"/v1/thanso/so/{so}", headers=EN)
    assert r.status_code == 200
    d = r.json()
    assert d["nghia"]["tu_khoa"] and d["chan_dung"]["tong_quan"]["chan_dung"] and d["linh_vuc"]["tinh_yeu"]["xu_huong"]
    _khong_viet(d, bo_qua=(".source_id", ".school_id", ".trang_thai"))
    assert client.get("/v1/thanso/so/10").status_code == 404


@pytest.mark.parametrize("cau,xu_ly,lv", [
    ("What does my life path number say about me?", "ban_than", "ban_than"),
    ("How do I behave in a relationship?", "linh_vuc", "tinh_yeu"),
    ("Should I worry about money this year?", "nam", "tai_chinh"),
    ("What is this month about for me?", "thang", None),
    ("How does my number show up at work?", "linh_vuc", "su_nghiep"),
    ("I feel stressed and tired all the time", "linh_vuc", "suc_khoe"),
    ("What does number 7 mean?", "nghia_so", None),
    ("How is the life path calculated?", "cach_tinh", None),
    ("Am I compatible with my boyfriend?", "hop_doi", "tinh_yeu"),
    ("Tell me something", "chung", "ban_than"),
])
def test_hoi_dap_tieng_anh(cau, xu_ly, lv):
    with ngon_ngu.dung("en"):
        kq = hoi_en.tra_loi(cau, NGUOI, XEM)
    assert kq["phan_loai"]["xu_ly"] == xu_ly and kq["phan_loai"]["linh_vuc"] == lv, kq["phan_loai"]
    assert len(kq["cau_tra_loi"]) > 40 and kq["hoi_tiep"]
    _khong_viet(kq, bo_qua=(".ho_ten[0]", ".ho_ten[1]"))
    assert "you will" not in kq["cau_tra_loi"].lower()


def test_an_toan_tieng_anh_dung_bo_chan_chung():
    with ngon_ngu.dung("en"):
        assert hoi_en.tra_loi("I don't want to live anymore, what do my numbers say?", NGUOI, XEM)["phan_loai"]["xu_ly"] == "an_toan"
        kq = hoi_en.tra_loi("Which lottery numbers should I play?", NGUOI, XEM)
        assert kq["phan_loai"]["xu_ly"] == "tu_choi_nhe" and kq["cau_tra_loi"]


def test_route_hoi_tieng_anh_va_viet():
    body = {"ho_ten": ["John Smith"], "ngay": 24, "thang": 10, "nam": 1988, "cau_hoi": "What is my personal year about this year?"}
    r = client.post("/v1/thanso/hoi", json=body, headers=EN)
    assert r.status_code == 200 and r.json()["ngon_ngu"] == "en" and "personal year" in r.json()["cau_tra_loi"].lower()
    assert r.json()["cau_lien_quan"] == [] and r.json()["thuat_ngu"] == []
    r2 = client.post("/v1/thanso/hoi", json={**body, "cau_hoi": "Năm nay của tôi thế nào?"})
    assert r2.status_code == 200 and "ngon_ngu" not in r2.json() and r2.json()["cau_tra_loi"]


def test_ban_viet_khong_doi():
    with ngon_ngu.dung("vi"):
        bc = lg.luan_giai(["Nguyễn Văn An"], 24, 10, 1988)
    assert bc["cac_vi_tri"][0]["ten"] == "Đường đời" and bc["chan_dung"]["mat"][0]["ten"] == "Tổng quan"
    assert bc["giai_thich_quy_uoc"]["tong_het"].startswith("Cộng một lượt")
