# -*- coding: utf-8 -*-
"""Cố vấn liên mảng Tam Tài (`POST /v1/co-van`) + Cẩm nang kinh doanh (`POST /v1/doanh-chu/cam-nang-kinh-doanh`) —
hợp đồng sau review 2026-11-26 (viết lại toàn bộ, thay bộ test "bảng chân trị 5 giây" cũ):

1. KHÔNG mức gộp: không còn `ket_luan_5_giay`; ba trụ mang mức RIÊNG (có thể null) và nêu nguồn thật. Chưa có giờ sinh →
   Nhân không chấm mức và không gắn nhãn "Bát tự"; chưa có hướng nhà → Địa không chấm mức.
2. Hiểu câu hỏi: câu về người khác / kể chuyện đã xảy ra / chưa rõ việc gì → `chuyen_huong` (không dựng ba trụ); câu tâm
   linh → dẫn hướng; khủng hoảng tiếng Anh → lời tiếng Anh có 988 (MỘT bộ chặn chung `chung.dac_biet`).
3. Dưới 16 tuổi → `chuyen_huong.duoi_tuoi`.
4. Người liên quan: bắt buộc `dong_y_tu_nguyen` (422), đủ 16 tuổi (422), ngày sinh không in lại trong đầu ra.
5. Chỉ dùng phần miễn phí: không chép tóm tắt / hộp của chương Bát tự, Tử vi (chỉ mức chương — thông tin công khai).
6. Cẩm nang: không xếp hạng mặt bằng; Thành Môn chỉ khi biết năm xây; không dẫn tên sách chưa có trong kho nguồn.
7. Bản Anh sạch chữ Việt; cùng khung với bản Việt.
"""
from __future__ import annotations

import json
import re

import pytest
from fastapi.testclient import TestClient

from app.luangiai import battu_doi_song as btd, co_van_tam_tai as cv
from app.main import app
from tests import _dau_ra as dr

_C = TestClient(app)
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_NGAY = "2026-11-26"


def _goi(cau: str, ns: str = "1990-05-15", headers: dict | None = None, **kw):
    return _C.post("/v1/co-van", json={"cau_hoi": cau, "ngay_sinh": ns, "ngay_xem": _NGAY, **kw}, headers=headers or {})


def _ket(d: dict) -> str:
    return (d.get("an_toan_chan") or {}).get("xu_ly") or (d.get("chuyen_huong") or {}).get("ly_do") or d.get("mach")


@pytest.mark.parametrize("cau,ky_vong", [
    ("Học tiếng Nhật hay tiếng Đức?", "chua_ro"),
    ("Con tôi thi trường nào", "nguoi_khac"),
    ("Chồng tôi có ngoại tình không", "nguoi_khac"),
    ("Chồng tôi vừa ngoại tình, tôi có nên ly hôn", "nguoi_khac"),
    ("Nhà có bị ma ám không", "dan_huong"),
    ("I want to kill myself tonight", "an_toan"),
    ("Tôi muốn bỏ việc ra mở quán cà phê năm nay có nên không", "su_nghiep_chuyen_viec"),
    ("Năm sau tôi có nên kết hôn không", "tinh_cam_cam_ket"),
    ("Năm nay có nên mua nhà không", "nha_cua_mat_bang"),
    ("Mình nên góp vốn mở công ty với bạn không", "gop_von_hop_tac"),
])
def test_hieu_cau_hoi_va_chuyen_huong(cau, ky_vong):
    r = _goi(cau)
    assert r.status_code == 200, r.text
    d = r.json()
    assert _ket(d) == ky_vong
    if ky_vong in ("chua_ro", "nguoi_khac", "ke_su_viec", "dan_huong", "an_toan"):
        assert "ba_tru_tam_tai" not in d


def test_khung_hoang_tieng_anh_tra_loi_tieng_anh_co_988():
    d = _goi("I want to kill myself tonight").json()
    assert "988" in d["an_toan_chan"]["cau_tra_loi"] and not _VIET.search(d["an_toan_chan"]["cau_tra_loi"])


def test_duoi_16_tuoi_chuyen_huong():
    assert _ket(_goi("Năm sau tôi có nên kết hôn không", ns="2015-03-01").json()) == "duoi_tuoi"


def test_khong_muc_gop_va_nguon_trung_thuc_khi_chua_co_gio():
    d = _goi("Năm nay có nên mua nhà không").json()
    assert "ket_luan_5_giay" not in d and "tong_quan" not in d
    nhan = d["ba_tru_tam_tai"]["nhan"]
    assert nhan["muc"] is None and "Thần số" in nhan["nguon"] and "Bát tự" not in nhan["nguon"].split("(")[0]
    # CV-2: chưa có hướng nhà → không bịa mức Địa, mà nói thiếu gì (trụ Địa vắng mặt)
    assert "dia" not in d["ba_tru_tam_tai"] and d["can_bo_sung"]["loai"] == "nha_o"


def test_co_gio_muc_lay_dung_chuong_bao_cao_va_khong_chep_loi_chuong_tra_phi():
    d = _goi("Tôi muốn bỏ việc ra mở quán cà phê năm nay có nên không", gio_sinh="08:30", do_tin_gio="exact").json()
    import datetime as _dt
    bc = btd.lap({"lich": _dt.datetime(1990, 5, 15, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}, _dt.date(2026, 11, 26))
    ch = next(c for c in bc["chuong"] if c["ma"] == "su_nghiep")
    assert d["ba_tru_tam_tai"]["nhan"]["muc"] == ch["muc"]
    van = json.dumps(d, ensure_ascii=False)
    assert ch["tom_tat"] not in van
    assert all(h["noi_dung"] not in van for h in ch.get("hop", []) if len(h.get("noi_dung", "")) > 40)


def test_hai_muc_khac_nhau_thi_noi_ro_khong_chon_ben():
    # quét vài ngày sinh có giờ: khi Tử vi và Bát tự đọc NĂM hỏi khác mức, nói rõ "không chọn bên" (CV-2: không còn mức gộp)
    thay_khac = False
    for ns in ("1990-05-15", "1985-11-08", "1978-02-20", "1995-07-30", "1988-12-02", "1972-03-09"):
        d = _goi("Tôi muốn bỏ việc ra mở quán cà phê năm sau có nên không", ns=ns, gio_sinh="08:30", do_tin_gio="exact").json()
        thien = d["ba_tru_tam_tai"]["thien"]
        mon = thien["muc_tung_mon"]
        if mon["tuvi"] and mon["battu"] and mon["tuvi"] != mon["battu"]:
            thay_khac = True
            assert "không chọn bên" in thien["nhan_xet"] and thien["muc"] is None
    assert thay_khac, "bộ ngày sinh mẫu phải có ít nhất một lá hai môn đọc năm khác mức"


def test_nguoi_lien_quan_can_dong_y_du_tuoi_va_khong_in_ngay_sinh():
    co_dt = dict(doi_tac={"ngay_sinh": "1991-02-03"})
    assert _goi("góp vốn làm ăn chung với bạn", **co_dt).status_code == 422
    assert _goi("góp vốn làm ăn chung với bạn", doi_tac={"ngay_sinh": "2015-02-03", "dong_y_tu_nguyen": True}).status_code == 422
    d = _goi("góp vốn làm ăn chung với bạn", doi_tac={"ngay_sinh": "1991-02-03", "dong_y_tu_nguyen": True}).json()
    van = json.dumps(d, ensure_ascii=False)
    assert d["doi_tac"]["loi"] and "1991" not in van and "03/02" not in van
    assert "chấm hợp" in d["doi_tac"]["loi"]


def test_ban_tieng_anh_sach_va_cung_khung():
    p = {"cau_hoi": "Should I quit my job to start a cafe this year", "ngay_sinh": "1990-05-15", "ngay_xem": _NGAY,
         "gio_sinh": "08:30", "do_tin_gio": "exact", "nha": {"do_huong": 135, "nam_xay": 2010}}
    en = _C.post("/v1/co-van", json=p, headers={"x-ngon-ngu": "en"}).json()
    assert en["mach"] == "su_nghiep_chuyen_viec"
    assert not _VIET.search(json.dumps({k: v for k, v in en.items() if k != "ngay_xem"}, ensure_ascii=False))
    vi = _C.post("/v1/co-van", json={**p, "cau_hoi": "Tôi muốn bỏ việc ra mở quán cà phê năm nay có nên không"}).json()
    assert dr.khung(vi) == dr.khung(en)


def test_nhan_dien_mach_khong_doan_mac_dinh():
    assert cv.nhan_dien_mach("Học tiếng Nhật hay tiếng Đức?") is None


def test_cam_nang_khong_xep_hang_va_thanh_mon_chi_khi_co_nam_xay():
    payload = {"ngay_sinh": "1990-05-15", "gioi_tinh": "nam", "ngay_xem": _NGAY, "mat_bang_ung_vien": [
        {"ten_diem": "A", "loai_hinh": "cua_hang", "do_huong": 135, "nam_xay": 2010},
        {"ten_diem": "B", "loai_hinh": "cua_hang", "do_huong": 270},
    ]}
    d = _C.post("/v1/doanh-chu/cam-nang-kinh-doanh", json=payload).json()
    ds = d["chon_dia_diem_cua_hang"]["so_sanh_mat_bang"]
    assert [m["ten_diem"] for m in ds] == ["A", "B"] and [m["thu_tu"] for m in ds] == [1, 2]
    assert all("thu_tu_uu_tien" not in m for m in ds)
    assert ds[0]["thanh_mon_quyet"] is not None and ds[1]["thanh_mon_quyet"] is None
    en = _C.post("/v1/doanh-chu/cam-nang-kinh-doanh", json=payload, headers={"x-ngon-ngu": "en"}).json()
    for bc, ten_sach in ((d, "Thẩm"), (en, "Shen")):
        tm = bc["chon_dia_diem_cua_hang"]["so_sanh_mat_bang"][0]["thanh_mon_quyet"]["luan_giai"]
        assert ten_sach not in tm and "dòng tiền" not in tm
    van_vp = json.dumps(d["bo_tri_van_phong_chu"], ensure_ascii=False) + json.dumps(d["mo_rong_thi_truong"], ensure_ascii=False)
    assert "phuong_vi_uu_tien" not in van_vp and "tông" not in van_vp
