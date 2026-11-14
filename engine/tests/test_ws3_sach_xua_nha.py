# -*- coding: utf-8 -*-
"""WS-3 — "Sách xưa nói gì về nhà của bạn": câu Dương Trạch Thập Thư chọn theo mệnh quái.
Mọi câu là nguyên văn kho nguồn; lời của dòng khẩu quyết khớp bảng du niên engine (một nguồn với la bàn)."""
import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.calc import phongthuy as pt
from app.kb import phongthuy_kb
from app.luangiai import phongthuy_doi_song, phongthuy_tuoi, sach_xua

NGUON = Path(__file__).parent.parent / "fixtures" / "nguon" / "duong_trach_thap_thu.json"
VAN = "".join(t["van"] for t in json.loads(NGUON.read_text("utf-8"))["thien"])
KB = phongthuy_kb._d()["sach_xua_nha"]
HAN = dict(zip(["Càn", "Khảm", "Cấn", "Chấn", "Tốn", "Ly", "Khôn", "Đoài"], "乾坎艮震巽離坤兌"))
TAT = {"生": "Sinh Khí", "天": "Thiên Y", "延": "Diên Niên", "六": "Lục Sát", "禍": "Hoạ Hại", "五": "Ngũ Quỷ", "絕": "Tuyệt Mệnh"}


def _cac_han():
    for nhom in KB["nhom"].values():
        yield nhom["han"]
    for q in KB["quai"].values():
        yield q["han"]
    for k in ("Đông tứ mệnh", "Tây tứ mệnh"):
        yield KB["vo_chong"][k]["han"]
    yield KB["nha_nhieu_nguoi"]["han"]


def test_moi_cau_la_nguyen_van_kho_nguon():
    for han in _cac_han():
        assert han in VAN, han


@pytest.mark.parametrize("quai", list(HAN))
def test_dong_khau_quyet_khop_bang_huong_va_loi(quai):
    ds = sach_xua.phongthuy(quai)
    dn = next(x for x in ds if x["loai"] == "du_nien")
    m = re.search(rf"法曰{HAN[quai]}([生天延六禍五絕]{{7}})$", dn["han"])
    assert m
    vong = list(HAN)
    bang = pt.bang_huong(quai)
    for k, c in enumerate(m.group(1), start=1):
        dich = vong[(vong.index(quai) + k) % 8]
        assert bang[pt.QUAI[dich][1]] == TAT[c]
    for d in ("Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị"):
        h = next(h for h, x in bang.items() if x == d)
        assert f"{h} ({d})" in dn["y"]
    nhom = next(x for x in ds if x["loai"] == "nhom")
    assert nhom["han"] == KB["nhom"][pt.nhom(quai)]["han"]


@pytest.mark.parametrize("nam_chu,gt_chu,vai,nam_kia,gt_kia", [
    (1988, "nam", "vo", 1990, "nu"),      # chồng Chấn (Đông), vợ 1990 nữ Cấn (Tây)
    (1990, "nu", "chong", 1988, "nam"),   # người đọc là vợ — câu sách vẫn theo nhóm người chồng
])
def test_vo_chong_khac_nhom_cau_theo_nguoi_chong(nam_chu, gt_chu, vai, nam_kia, gt_kia):
    r = phongthuy_doi_song.luan_giai({"nam": nam_chu, "gioi_tinh": gt_chu}, {"huong": "Nam"},
                                     [{"vai": vai, "nam": nam_kia, "gioi_tinh": gt_kia}])
    vc = next(x for x in r["sach_xua"] if x["loai"] == "vo_chong")
    assert vc["han"].startswith("假如夫東四位")


def test_cung_nhom_khong_co_cau_vo_chong_khac_nguoi_khac_nhom_co_cau_chung():
    r = phongthuy_doi_song.luan_giai({"nam": 1988, "gioi_tinh": "nam"}, {"huong": "Nam"},
                                     [{"vai": "con", "nam": 1990, "gioi_tinh": "nu"}])
    loai = [x["loai"] for x in r["sach_xua"]]
    assert "vo_chong" not in loai and "nha_nhieu_nguoi" in loai


def test_khong_sinh_thi_rong_ban_anh_cung_so_cau_khong_chu_viet():
    assert phongthuy_doi_song.luan_giai(None, {"huong": "Nam"})["sach_xua"] == []
    tv = [{"vai": "chong", "nhom": "Tây tứ mệnh"}]
    vi = sach_xua.phongthuy("Khảm", tv)
    with ngon_ngu.dung("en"):
        en = sach_xua.phongthuy("Khảm", tv)
    assert [x["loai"] for x in en] == [x["loai"] for x in vi] and [x["han"] for x in en] == [x["han"] for x in vi]
    viet = re.compile(r"[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]", re.I)
    for x in en:
        assert not viet.search(x["ve"] + x["y"] + x["sach"]), x


def test_trang_cung_phi_noi_ve_nguoi_cung_khong_noi_ban():
    for slug in ("cung-kham-bac", "cung-can-tay-bac"):
        ds = phongthuy_tuoi.cung_phi(slug)["sach_xua"]
        assert len(ds) == 2 and all("bạn" not in x["ve"] + x["y"] for x in ds)
