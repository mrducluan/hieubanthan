# -*- coding: utf-8 -*-
"""KB-TV3 — 13 cách cục bổ sung (điều kiện theo cổ thư công cộng) + điều kiện đạt có cấu trúc (`du_kien` → `dieu_kien_dat`).
Test viết TRƯỚC. Lá số giả dựng bằng `la_gia` (chỉ để thử điều kiện, không cần đúng cấu trúc an sao)."""
from __future__ import annotations

import json
import re

import pytest

from app.calc import tuvi_cach_cuc as cc
from app.kb import tuvi_doi_song_kb as kds, tuvi_kb
from tests.test_tuvi_cach_cuc import la_gia, ma

MOI = ["dong_luong_dan_than", "liem_tuong_dong_cung", "vu_sat_dong_cung", "tu_vi_co_quan", "hoa_ky_thien_di",
       "liem_sat_duong", "cu_hoa_duong", "linh_xuong_da_vu", "loc_ton_thu_menh", "loc_ton_thu_than",
       "thien_ma_menh_di", "khoa_quyen_hoi_menh", "co_nguyet_dong_luong_ba"]

CA = [
    # (mã, Mệnh, {chi: [sao]}, {sao: hoá}, Thân)
    ("dong_luong_dan_than", "Dần", {"Dần": ["Thiên Đồng", "Thiên Lương"]}, {}, None),
    ("dong_luong_dan_than", "Thân", {"Thân": ["Thiên Đồng", "Thiên Lương"]}, {}, None),
    ("liem_tuong_dong_cung", "Tý", {"Tý": ["Liêm Trinh", "Thiên Tướng"]}, {}, None),
    ("vu_sat_dong_cung", "Mão", {"Mão": ["Vũ Khúc", "Thất Sát"]}, {}, None),
    ("tu_vi_co_quan", "Ngọ", {"Ngọ": ["Tử Vi"]}, {}, None),
    ("tu_vi_co_quan", "Mão", {"Mão": ["Tử Vi", "Tham Lang"], "Thìn": ["Tả Phù"]}, {}, None),   # Thìn ngoài tam phương
    ("hoa_ky_thien_di", "Tý", {"Ngọ": ["Thái Dương"]}, {"Thái Dương": "Kỵ"}, None),
    ("liem_sat_duong", "Dần", {"Dần": ["Liêm Trinh"], "Ngọ": ["Thất Sát"], "Tuất": ["Kình Dương"]}, {}, None),
    ("liem_sat_duong", "Sửu", {"Sửu": ["Liêm Trinh", "Thất Sát"], "Mùi": ["Kình Dương"]}, {}, None),
    ("cu_hoa_duong", "Tý", {"Tý": ["Cự Môn"], "Thìn": ["Hỏa Tinh"], "Ngọ": ["Kình Dương"]}, {}, None),
    ("linh_xuong_da_vu", "Thìn", {"Thìn": ["Vũ Khúc", "Linh Tinh"], "Tý": ["Văn Xương"], "Thân": ["Đà La"]}, {}, None),
    ("loc_ton_thu_menh", "Ngọ", {"Ngọ": ["Lộc Tồn"]}, {}, None),
    ("loc_ton_thu_than", "Ngọ", {"Tuất": ["Lộc Tồn"]}, {}, "Tuất"),
    ("thien_ma_menh_di", "Dần", {"Dần": ["Thiên Mã"]}, {}, None),
    ("thien_ma_menh_di", "Dần", {"Thân": ["Thiên Mã"]}, {}, None),
    ("khoa_quyen_hoi_menh", "Tý", {"Tý": ["Thiên Lương"], "Thìn": ["Thiên Cơ"]}, {"Thiên Lương": "Khoa", "Thiên Cơ": "Quyền"},
     None),
    ("co_nguyet_dong_luong_ba", "Thân", {"Thân": ["Thiên Cơ", "Thái Âm"], "Tý": ["Thiên Đồng"]}, {}, None),
]

KHONG = [
    ("dong_luong_dan_than", "Dần", {"Dần": ["Thiên Đồng"], "Ngọ": ["Thiên Lương"]}, {}, None),       # không đồng cung
    ("dong_luong_dan_than", "Tý", {"Tý": ["Thiên Đồng", "Thiên Lương"]}, {}, None),                  # không ở Dần/Thân
    ("liem_tuong_dong_cung", "Tý", {"Tý": ["Liêm Trinh"], "Ngọ": ["Thiên Tướng"]}, {}, None),
    ("vu_sat_dong_cung", "Thìn", {"Thìn": ["Vũ Khúc", "Thất Sát"]}, {}, None),
    ("vu_sat_dong_cung", "Mão", {"Mão": ["Vũ Khúc"], "Dậu": ["Thất Sát"]}, {}, None),
    ("tu_vi_co_quan", "Dần", {"Dần": ["Tử Vi", "Thiên Phủ"]}, {}, None),                             # có Thiên Phủ
    ("tu_vi_co_quan", "Ngọ", {"Ngọ": ["Tử Vi"], "Tuất": ["Hữu Bật"]}, {}, None),                     # Hữu Bật tam hợp
    ("tu_vi_co_quan", "Ngọ", {"Ngọ": ["Tử Vi"], "Tý": ["Tả Phù"]}, {}, None),                        # Tả Phù xung chiếu
    ("hoa_ky_thien_di", "Tý", {"Ngọ": ["Văn Xương"]}, {"Văn Xương": "Kỵ"}, None),                    # Kỵ trên phụ tinh
    ("hoa_ky_thien_di", "Tý", {"Tý": ["Thái Dương"]}, {"Thái Dương": "Kỵ"}, None),                   # Kỵ ở Mệnh
    ("liem_sat_duong", "Dần", {"Dần": ["Liêm Trinh"], "Ngọ": ["Thất Sát"], "Mão": ["Kình Dương"]}, {}, None),
    ("cu_hoa_duong", "Tý", {"Tý": ["Cự Môn"], "Ngọ": ["Kình Dương"]}, {}, None),
    ("linh_xuong_da_vu", "Thìn", {"Thìn": ["Vũ Khúc", "Linh Tinh"], "Tý": ["Văn Xương"], "Mão": ["Đà La"]}, {}, None),
    ("loc_ton_thu_menh", "Ngọ", {"Tý": ["Lộc Tồn"]}, {}, None),
    ("loc_ton_thu_than", "Ngọ", {"Ngọ": ["Lộc Tồn"]}, {}, None),                                     # Thân cư Mệnh
    ("thien_ma_menh_di", "Dần", {"Ngọ": ["Thiên Mã"]}, {}, None),                                    # tam hợp: không tính
    ("khoa_quyen_hoi_menh", "Tý", {"Tý": ["Thiên Lương"], "Thìn": ["Thiên Cơ"], "Thân": ["Vũ Khúc"]},
     {"Thiên Lương": "Khoa", "Thiên Cơ": "Quyền", "Vũ Khúc": "Lộc"}, None),                         # đủ ba là Tam Kỳ
    ("khoa_quyen_hoi_menh", "Tý", {"Tý": ["Văn Xương"], "Thìn": ["Thiên Cơ"]}, {"Văn Xương": "Khoa", "Thiên Cơ": "Quyền"},
     None),                                                                                          # Khoa trên phụ tinh
    ("co_nguyet_dong_luong_ba", "Thân", {"Thân": ["Thiên Cơ", "Thái Âm"], "Tý": ["Thiên Đồng"], "Thìn": ["Thiên Lương"]},
     {}, None),                                                                                      # đủ bốn
    ("co_nguyet_dong_luong_ba", "Thân", {"Thân": ["Thiên Cơ", "Thái Âm"]}, {}, None),                # mới hai
]


@pytest.mark.parametrize("ma_,menh,sao,hoa,than", CA)
def test_nhan_dien(ma_, menh, sao, hoa, than):
    assert ma_ in ma(la_gia(menh, sao, hoa, than))


@pytest.mark.parametrize("ma_,menh,sao,hoa,than", KHONG)
def test_khong_nhan_nham(ma_, menh, sao, hoa, than):
    assert ma_ not in ma(la_gia(menh, sao, hoa, than))


def test_cach_moi_o_cuoi_danh_sach():
    # Báo cáo lấy 2 cách đầu theo DANH_SACH → cách mới nối CUỐI, thứ tự cách cũ giữ nguyên.
    assert cc.DANH_SACH[-len(MOI):] == MOI
    assert len(cc.DANH_SACH) == 62 + len(MOI) and len(set(cc.DANH_SACH)) == len(cc.DANH_SACH)


def test_bon_sao_van_la_cach_cu():
    m = ma(la_gia("Thân", {"Thân": ["Thiên Cơ", "Thái Âm"], "Tý": ["Thiên Đồng"], "Thìn": ["Thiên Lương"]}))
    assert "co_nguyet_dong_luong" in m and "co_nguyet_dong_luong_ba" not in m


def test_cung_lien_quan():
    x = next(c for c in cc.nhan_dien(la_gia("Tý", {"Ngọ": ["Thái Dương"]}, {"Thái Dương": "Kỵ"})) if c["ma"] == "hoa_ky_thien_di")
    assert x["cung"] == ["Thiên Di"]
    x = next(c for c in cc.nhan_dien(la_gia("Dần", {"Thân": ["Thiên Mã"]})) if c["ma"] == "thien_ma_menh_di")
    assert x["cung"] == ["Thiên Di"]
    x = next(c for c in cc.nhan_dien(la_gia("Ngọ", {"Tuất": ["Lộc Tồn"]}, than="Tuất")) if c["ma"] == "loc_ton_thu_than")
    assert x["cung"] == [la_gia("Ngọ", {}, than="Tuất")["palaces"][8]["name"]]


_CAM_DOA = re.compile(r"(?<!\w)(tai nạn|chết|tử vong|chết đuối|đuối nước|tù|hình ngục|kiện tụng|tai hoạ|tai họa|đại hung|"
                      r"xấu số|phá sản|tuyệt mệnh|hung hiểm|nguy hiểm|thảm hoạ|thắt cổ|bệnh)(?!\w)", re.I)


@pytest.mark.parametrize("m", MOI)
def test_kb_cach_moi_day_du_va_khong_doa(m):
    k = tuvi_kb.cach_cuc(m)
    assert k and k["ten"] and k["ten_han"] and k["dieu_kien"] and k["y"] and k["mat_toi"] and k["loi_khuyen"], m
    assert k["nhom"] in ("cát", "hung", "trung") and k["source_id"] and k["school_id"]
    dt_ = kds.cach_cuc_doi_thuong(m, k["ten"])
    assert dt_, m
    for van in (k["y"], k["mat_toi"], k["loi_khuyen"], dt_, k.get("co_ca") or ""):
        assert not _CAM_DOA.search(van), (m, van)
    if k["nhom"] == "hung":                       # báo cáo tách "điều cần để ý ; hướng xử lý"
        assert re.search(r";|—", dt_), m


def test_ten_cach_moi_khong_nuot_cau_hoi_cach_cu():
    # Hỏi đáp gọi tên cách (`_cach_nhac`): tên cách mới không được nằm trong tên cách cũ.
    from app.hoidap import chung
    cu = [chung.chuan_hoa(re.sub(r"\(.*?\)", "", tuvi_kb.cach_cuc(m)["ten"])) for m in cc.DANH_SACH if m not in MOI]
    for m in MOI:
        t = chung.chuan_hoa(re.sub(r"\(.*?\)", "", tuvi_kb.cach_cuc(m)["ten"])).strip()
        assert not any(re.search(rf"(?<!\w){re.escape(t)}(?!\w)", c) for c in cu), m


# ---------------------------------------------------------------------------------------------- điều kiện đạt
def _dk(la: dict, ma_: str) -> list[dict]:
    x = next(c for c in cc.nhan_dien(la) if c["ma"] == ma_)
    return tuvi_kb.dieu_kien_dat(x["du_kien"])


def _nhom(ds: list[dict], loai: str) -> list[str]:
    return [d["noi_dung"] for d in ds if d["loai"] == loai]


def test_dieu_kien_can_tang_giam():
    la = la_gia("Ngọ", {"Ngọ": ["Tử Vi", "Địa Kiếp"], "Tuất": ["Văn Xương"], "Dần": ["Thiên Khôi"]}, {"Tử Vi": "Quyền"})
    ds = _dk(la, "cuc_huong_ly_minh")
    assert _nhom(ds, "can") == ["Tử Vi ở Mệnh (Ngọ)"]
    tang = _nhom(ds, "tang")
    assert "Tử Vi miếu tại Ngọ" in tang and "Tử Vi hoá Quyền" in tang
    assert any("Văn Xương" in t for t in tang) and any("Thiên Khôi" in t for t in tang)
    assert _nhom(ds, "giam") == ["Địa Kiếp ở Mệnh (Ngọ)"]


def test_dieu_kien_ham_va_ky_tren_sao_chu():
    la = la_gia("Dần", {"Dần": ["Cự Môn", "Thiên Cơ"]}, {"Thiên Cơ": "Kỵ"})
    giam = _nhom(_dk(la, "cu_co_dong_lam"), "giam")
    assert "Thiên Cơ hãm tại Dần" in giam and "Thiên Cơ hoá Kỵ" in giam


def test_dieu_kien_vi_tri_tam_phuong_va_giap():
    la = la_gia("Ngọ", {"Tỵ": ["Kình Dương"], "Mùi": ["Đà La"]})
    can = _nhom(_dk(la, "kinh_da_giap_menh"), "can")
    assert any(c.startswith("Kình Dương ở") and "(Tỵ)" in c and "kề Mệnh" in c for c in can)
    la = la_gia("Dần", {"Dần": ["Liêm Trinh"], "Ngọ": ["Thất Sát"], "Thân": ["Kình Dương"]})
    can = _nhom(_dk(la, "liem_sat_duong"), "can")
    assert "Liêm Trinh ở Mệnh (Dần)" in can
    assert any("Thất Sát" in c and "tam hợp" in c for c in can) and any("Kình Dương" in c and "xung chiếu" in c for c in can)


def test_dieu_kien_dieu_kien_phu_dinh():
    can = _nhom(_dk(la_gia("Ngọ", {"Ngọ": ["Tử Vi"]}), "tu_vi_co_quan"), "can")
    assert "Tử Vi ở Mệnh (Ngọ)" in can
    assert any("Thiên Phủ" in c for c in can) and any("Tả Phù" in c and "Hữu Bật" in c for c in can)
    can = _nhom(_dk(la_gia("Mùi", {"Mão": ["Thái Dương"], "Hợi": ["Thái Âm"]}), "menh_vo_chinh_dieu"), "can")
    assert can == ["Mệnh (Mùi) không có chính tinh"]


def test_dieu_kien_hoa():
    la = la_gia("Tý", {"Tý": ["Vũ Khúc"], "Thìn": ["Liêm Trinh"], "Thân": ["Thiên Lương"]},
                {"Vũ Khúc": "Quyền", "Liêm Trinh": "Lộc", "Thiên Lương": "Khoa"})
    can = _nhom(_dk(la, "tam_ky_gia_hoi"), "can")
    assert {"Vũ Khúc hoá Quyền ở Mệnh (Tý)"} <= set(can) and len(can) == 3
    assert all("hoá" in c for c in can)
    # Hoá đã là điều kiện bắt buộc thì không lặp lại ở "Điểm cộng".
    assert not any(c in _nhom(_dk(la, "tam_ky_gia_hoi"), "tang") for c in ("Vũ Khúc hoá Quyền",))


def test_moi_dieu_kien_render_duoc_khong_lap():
    la = la_gia("Ngọ", {"Ngọ": ["Tử Vi", "Kình Dương", "Lộc Tồn"], "Tuất": ["Hỏa Tinh", "Tả Phù"], "Tý": ["Địa Kiếp"]},
                {"Tử Vi": "Khoa"})
    for x in cc.nhan_dien(la):
        ds = tuvi_kb.dieu_kien_dat(x["du_kien"])
        assert _nhom(ds, "can"), x["ma"]
        nd = [d["noi_dung"] for d in ds]
        assert len(nd) == len(set(nd)) and all(n and "{" not in n for n in nd), (x["ma"], nd)
        assert {d["loai"] for d in ds} <= {"can", "tang", "giam"}


def test_mau_dieu_kien_trong_kb():
    d = json.loads(tuvi_kb._F_CC.read_text(encoding="utf-8"))
    assert d["dieu_kien_mau"] and all(isinstance(v, str) and v for v in d["dieu_kien_mau"].values())


def test_api_tra_dieu_kien_dat():
    from fastapi.testclient import TestClient
    from app.main import app
    d = TestClient(app).post("/v1/tuvi/an-sao", json={"birth_date": "1997-03-19", "birth_time": "00:30",
                                                       "gender": "nam", "noi_sinh": "ha-noi"}).json()
    assert d["cach_cuc"]
    for c in d["cach_cuc"]:
        assert c["dieu_kien_dat"] and any(x["loai"] == "can" for x in c["dieu_kien_dat"]), c["ma"]
        assert all(set(x) == {"loai", "noi_dung"} for x in c["dieu_kien_dat"])
        assert "du_kien" not in c and isinstance(c["dieu_kien"], str)   # dữ kiện thô không ra API
    c = next(c for c in d["cach_cuc"] if c["ma"] == "dao_hoa_pham_chu")
    assert {"loai": "can", "noi_dung": "Tử Vi ở Mệnh (Mão)"} in c["dieu_kien_dat"]
