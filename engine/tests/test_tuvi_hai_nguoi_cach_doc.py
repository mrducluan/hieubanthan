# -*- coding: utf-8 -*-
"""TV-YBS đợt 4 — "Xem lá số 2 người": ý Tử vi bổ sung (KB `tuvi_y_bo_sung.json`, nhóm hôn nhân) thành HỘP DIỄN GIẢI.

Chỉ thêm lời diễn giải (`cach_doc_them`), KHÔNG đổi điểm 0–100 (luật `hai_nguoi_1`, golden tuvi_hai_nguoi_diem.json):
  * ý hai lá số (`hai.*`): chính tinh Phu Thê của bạn trùng chính tinh Mệnh người ấy (người yêu / vợ chồng) · cả hai
    Mệnh nhóm Sát Phá Tham · một Sát Phá Tham, một Cơ Nguyệt Đồng Lương — cần đủ lá người kia;
  * ý Phu Thê từng người (`hon.*`, `cung.phu_the_*`, `sao.*_phu_the`): xét cung Phu Thê của bạn, và của người ấy khi
    đủ lá — chỉ quan hệ người yêu / vợ chồng.
Mã hộp `ds.hai.<ý>.<ai>.<quan hệ>` (loại `doi_song`, ràng buộc SQL có sẵn của 0017/0021 — không migration mới),
phái = trường phái của ý. Lời không doạ, không cụm cấm, không lộ tên người / khoá học (BM-1).
"""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app.calc import tuvi_an_sao as az
from app.hoidap.tuvi import tom_tat
from app.kb.tuvi_doi_song_kb import tim_cum_cam
from app.luangiai import tuvi_hai_nguoi as hn, tuvi_hop_tham as ht
from tests.test_kiem_chung_ma import _hop_le

CUNG = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc",
        "Điền Trạch", "Phúc Đức", "Phụ Mẫu"]
TU_DOA = ("báo động", "tử thần", "phá sản", "tai nạn", "bệnh", "chết", "tuyệt đối", "ly hôn", "chia tay", "đại kỵ",
          "không nên lấy")
BM1 = re.compile(r"Nghê|Hải Hạ|倪|tianji|Thiên Kỷ|Renhuai|bài giảng|khoá học|khóa học|yb\.", re.I)
GOLDEN = Path(__file__).parents[1] / "fixtures" / "golden" / "tuvi_hai_nguoi_diem.json"


def _ls(menh: list[str], phu_the: list[str], phu_the_phu: list[str] = (), hoa_pt: dict | None = None) -> dict:
    """Lá số gọn (dạng `tom_tat`) chỉ đủ cho bộ lọc tĩnh: chính tinh Mệnh / Phu Thê, phụ tinh, hoá ở Phu Thê."""
    cung = []
    for i, ten in enumerate(CUNG):
        chinh = menh if ten == "Mệnh" else phu_the if ten == "Phu Thê" else []
        cung.append({"chi_so": i, "ten": ten, "chi": "", "can": "", "la_than": False,
                     "chinh_tinh": [{"ten": s, "do_sang": "Miếu", "tu_hoa": (hoa_pt or {}).get(s) if ten == "Phu Thê" else None}
                                    for s in chinh],
                     "phu_tinh": list(phu_the_phu) if ten == "Phu Thê" else [], "dai_han": [0, 0]})
    tu_hoa = [{"hoa": h, "sao": s, "cung": "Phu Thê"} for s, h in (hoa_pt or {}).items()]
    return {"cung": cung, "tu_hoa": tu_hoa}


def _ma(ds):
    return {h["ma_mau"].split(".")[2] + "." + h["ma_mau"].split(".")[3] for h in ds}


def test_phu_the_cua_ban_chi_khi_doi_lua():
    ban = _ls(["Tử Vi"], ["Thiên Cơ"])
    assert "thien_co_phu_the_doi_y.ban" in _ma(hn.cach_doc_them(ban, None, "nguoi_yeu"))
    assert "thien_co_phu_the_doi_y.ban" in _ma(hn.cach_doc_them(ban, None, "vo_chong"))
    for qh in ("ban_be", "dong_nghiep", "sep", "gia_dinh"):
        assert not hn.cach_doc_them(ban, None, qh), qh


def test_phu_the_nguoi_kia_khi_du_la():
    ban, kia = _ls(["Tử Vi"], ["Thiên Lương"]), _ls(["Thái Dương"], ["Thất Sát"])
    ma = _ma(hn.cach_doc_them(ban, kia, "nguoi_yeu"))
    assert {"thien_luong_phu_the_moi_dau.ban", "that_sat_phu_the_nhanh.kia"} <= ma


def test_khong_co_va_hoa():
    # Cự Môn ở Phu Thê mà có Văn Xương đi cùng → không phải ý "thiếu sao dịu"
    assert "cu_mon_phu_the_thieu_diu.ban" not in _ma(hn.cach_doc_them(_ls([], ["Cự Môn"], ["Văn Xương"]), None, "nguoi_yeu"))
    assert "cu_mon_phu_the_thieu_diu.ban" in _ma(hn.cach_doc_them(_ls([], ["Cự Môn"]), None, "nguoi_yeu"))
    # Hoá Quyền năm sinh ở Phu Thê
    assert "phu_the_quyen_chu_dong.ban" in _ma(hn.cach_doc_them(_ls([], ["Vũ Khúc"], hoa_pt={"Vũ Khúc": "Quyền"}),
                                                               None, "vo_chong"))


def test_hai_la_so():
    # Phu Thê bạn có Thái Âm, Mệnh người ấy có Thái Âm → gần hình mẫu
    ma = _ma(hn.cach_doc_them(_ls(["Tử Vi"], ["Thái Âm"]), _ls(["Thái Âm"], ["Vũ Khúc"]), "nguoi_yeu"))
    assert "phu_the_trung_menh_nguoi_kia.hai" in ma
    # chỉ chiều ngược (Phu Thê người ấy trùng Mệnh bạn) → không dùng lời "người ấy gần hình mẫu của bạn"
    assert "phu_the_trung_menh_nguoi_kia.hai" not in _ma(
        hn.cach_doc_them(_ls(["Thái Âm"], ["Vũ Khúc"]), _ls(["Tử Vi"], ["Thái Âm"]), "nguoi_yeu"))
    # hai Mệnh Sát Phá Tham — mọi quan hệ
    for qh in ("nguoi_yeu", "dong_nghiep"):
        assert "hai_nguoi_sat_pha_tham.hai" in _ma(hn.cach_doc_them(_ls(["Thất Sát"], []), _ls(["Tham Lang"], []), qh))
    # một Sát Phá Tham, một Cơ Nguyệt Đồng Lương → bù nhau
    assert "dong_tinh_bu_nhau.hai" in _ma(hn.cach_doc_them(_ls(["Phá Quân"], []), _ls(["Thiên Đồng"], []), "ban_be"))
    # thiếu lá người kia → không ý hai lá số
    assert not {m for m in _ma(hn.cach_doc_them(_ls(["Thất Sát"], []), None, "nguoi_yeu")) if m.endswith(".hai")}


def test_khuon_hop_ma_va_loi():
    ds = hn.cach_doc_them(_ls(["Thất Sát"], ["Thiên Tướng"]), _ls(["Tham Lang"], ["Thiên Cơ"]), "vo_chong")
    assert 1 <= len(ds) <= hn.TOI_DA_CACH_DOC
    for h in ds:
        assert set(h) >= {"loai", "nhan", "tieu_de", "noi_dung", "huong_xu_ly", "can_cu", "ma_mau", "phai"}
        assert h["loai"] == "loi_khuyen" and h["can_cu"]
        assert _hop_le("doi_song", h["ma_mau"], h["phai"]), h["ma_mau"]
        assert len(h["ma_mau"]) <= 60
        van = " ".join([h["nhan"], h["tieu_de"], h["noi_dung"], h["huong_xu_ly"], *h["can_cu"]])
        assert not tim_cum_cam(van), tim_cum_cam(van)
        assert not any(t in van.lower() for t in TU_DOA), van
        assert not BM1.search(van), van
    assert len({h["tieu_de"] for h in ds}) == len(ds)                 # không hai hộp cùng tiêu đề


@pytest.fixture(scope="module")
def hai_la():
    a = tom_tat(az.an_sao_tho(dt.date(1990, 5, 15), 1, "nam", "vi-VN"))
    b = tom_tat(az.an_sao_tho(dt.date(1992, 8, 21), 4, "nu", "vi-VN"))
    return a, b


def test_lap_them_hop_khong_doi_diem(hai_la):
    a, b = hai_la
    ban, kia = {"nam_am": 1990, "gioi_tinh": "nam"}, {"nam_am": 1992, "gioi_tinh": "nu"}
    for qh in hn.CUNG_TRONG_TAM:
        kq = ht.lap(a, "Canh", "Nhâm", qh, ls_kia=b, ban=ban, kia=kia)
        vao_ban = ht._duong("Nhâm", a["cung"], "người kia", True)
        ban_vao = ht._duong("Canh", b["cung"], "bạn", False)
        assert kq["diem"] == hn.cham_diem(ban, kia, qh, vao_ban, ban_vao)
        assert isinstance(kq["cach_doc_them"], list)
        assert all(h["ma_mau"].startswith("ds.hai.") and h["ma_mau"].endswith("." + qh) for h in kq["cach_doc_them"])
    assert ht.lap(a, "Canh", "Nhâm", "sep")["cach_doc_them"] == []      # cấp trên: không ý Phu Thê, thiếu lá kia


def test_golden_diem_khong_doi():
    """Điểm 0–100 giữ nguyên luật `hai_nguoi_1`: golden tính tay vẫn khớp (test_tuvi_hai_nguoi.test_golden làm chi
    tiết), phiên bản luật không đổi."""
    g = json.loads(GOLDEN.read_text("utf-8"))
    assert hn.PHIEN_BAN_DIEM == g["phien_ban"] == "hai_nguoi_1" and g["ca"]
    assert hn.TRONG_SO == {"menh": 20, "can": 15, "chi": 20, "cung_phi": 15, "tu_vi": 30}


def test_api_tra_cach_doc_them():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).post("/v1/tuvi/hop-tham", json={
        "la_so": {"birth_date": "1990-05-15", "birth_time": "01:30", "gender": "nam", "noi_sinh": "ha-noi"},
        "nguoi_kia": {"birth_date": "1992-08-21", "birth_time": "07:30", "gender": "nu", "noi_sinh": "ha-noi"},
        "quan_he": "vo_chong"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert "cach_doc_them" in d and d["diem"]["phien_ban"] == "hai_nguoi_1"
