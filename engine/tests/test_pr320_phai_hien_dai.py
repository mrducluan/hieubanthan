# -*- coding: utf-8 -*-
"""PR #320 (chủ dự án quyết 2026-11-20, phương án C): hai sách Tử vi HIỆN ĐẠI còn bản quyền — Lương Nhược Du (Thập nhị cung
lục thất nhị tượng) và Vương Đình Chi (Trung Châu phái) — chỉ còn lời TÓM Ý của ban biên tập trong repo công khai: không
một chữ Hán nguyên văn, mỗi mục có điều kiện + ý chính + lĩnh vực + hướng + trang, giọng văn qua cùng bộ kiểm SX-C."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.kb import sach_ghi as sg, tuvi_doi_song_kb as kds, tuvi_phai_kb
from app.luangiai import tuvi_phi_hoa

DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
LUONG = json.loads((DATA / "tuvi_phi_hoa_luong_672.json").read_text("utf-8"))
TC = json.loads((DATA / "tuvi_trung_chau_60_tinh_he.json").read_text("utf-8"))
HAN = re.compile(r"[㐀-鿿豈-﫿]")
LINH_VUC = {"cong_viec", "tien_bac", "tinh_cam", "gia_dao", "suc_khoe", "tinh_net", "ban_be", "nha_cua", "con_cai",
            "di_lai", "hoc_hanh"}
HUONG = {"thuan", "can_chu_y", "trung_tinh"}
LINH_VUC |= {"giay_to"}
CAM, CUM = kds.cum_cam(), kds.cum_chung_chung()
TUONG = list(LUONG["tuong"].items())


@pytest.mark.parametrize("ten", ["tuvi_phi_hoa_luong_672.json", "tuvi_trung_chau_60_tinh_he.json"])
def test_khong_con_chu_han_va_ghi_ro_tom_y(ten):
    s = (DATA / ten).read_text("utf-8")
    assert not HAN.search(s), HAN.findall(s)[:5]
    d = json.loads(s)
    assert d["tom_y"] is True and d["can_doi_chieu"] is True and d["_trang_thai"] == "nhap_ban_bien_tap"
    assert "Tóm ý" in d["_nguon"] and "internet" not in d["_nguon"].lower() and "Đức Luân" not in s


def _kiem_loi(y: str) -> list[str]:
    loi = sg.kiem_loi(y) + kds.tim_cum_cam(y, CAM) + kds.tim_cum_cam(y, CUM)
    for c in ("bạn sẽ", "sẽ bị", "sẽ mắc"):
        if c in y.lower():
            loi.append(c)
    if re.search(r"\d+\s*tuổi", y):
        loi.append("số tuổi")
    return loi


@pytest.mark.parametrize("k,m", TUONG, ids=[k for k, _ in TUONG])
def test_luong_moi_tuong(k, m):
    assert k == f"{m['tu_cung']}|{m['hoa']}|{m['den_cung']}"
    assert m["tom_y"] is True and m["dieu_kien"] and m["trang"].startswith("tr.")
    assert set(m["linh_vuc"]) <= LINH_VUC and m["linh_vuc"] and m["huong"] in HUONG
    assert 15 <= len(m["y_chinh"]) <= 320
    assert not _kiem_loi(m["y_chinh"]), _kiem_loi(m["y_chinh"])
    if m["huong"] == "can_chu_y":
        assert re.search(r"(?<![\wÀ-ỹ])[Nn]ên(?![\wÀ-ỹ])", m["y_chinh"]), m["y_chinh"]      # lời "nên …" (SX-C nhóm B)
    if "suc_khoe" in m["linh_vuc"] and m["huong"] == "can_chu_y":
        assert re.search(r"khám|vận động|nghỉ|an toàn|chấn thương|dưỡng", m["y_chinh"]), m["y_chinh"]


def test_luong_dem_va_muc_khong_dua():
    assert LUONG["tong_so_tuong"] == len(LUONG["tuong"]) == 576
    assert [x["ma"] for x in LUONG["tuong_khong_dua"]] == ["muc_577_doan_ban_chung"]


@pytest.mark.parametrize("th", TC["tinh_he"], ids=[str(x["so"]) for x in TC["tinh_he"]])
def test_trung_chau_moi_tinh_he(th):
    assert th["tom_y"] is True and th["trang"].startswith("tr.") and len(th["cung_chi"]) == 2
    assert set(th["linh_vuc"]) <= LINH_VUC and th["huong"] in HUONG
    assert not _kiem_loi(th["y_chinh"]), _kiem_loi(th["y_chinh"])


def test_trung_chau_60_to_hop_khong_trung_va_sua_tieu_de():
    k = [(tuple(sorted(x["chinh_tinh"])), c) for x in TC["tinh_he"] for c in x["cung_chi"]]
    assert len(k) == 120 and len(set(k)) == 120
    assert tuvi_phai_kb.tra_tinh_he_trung_chau(["Tử Vi", "Phá Quân"], "Sửu")["so"] == 11
    assert tuvi_phai_kb.tra_tinh_he_trung_chau(["Thái Âm"], "Dậu")["so"] == 22


def test_luong_ra_nguoi_dung_bang_y_chinh_co_nhan():
    d = {"tu_cung": "Mệnh", "can": "Giáp", "hoa": "Lộc", "sao": "Liêm Trinh", "den_cung": "Quan Lộc",
         "xung_cung": "Phu Thê", "tu_hoa": False, "den_tuan_triet": []}
    nb = tuvi_phi_hoa._noi_bat("loc_nhap", {**d, "nghia": tuvi_phi_hoa.nghia_duong(d)})
    lp = nb["luong_phai_672"]["sach_ghi"]
    assert lp["y_chinh"] and lp["nhan"] == "Theo cách đọc phái Phi tinh (Lương Nhược Du) — ban biên tập tóm ý"
    assert not HAN.search(json.dumps(lp, ensure_ascii=False))
    with ngon_ngu.dung("en"):
        nb_en = tuvi_phi_hoa._noi_bat("loc_nhap", {**d, "nghia": tuvi_phi_hoa.nghia_duong(d)})
        assert "y_chinh" not in nb_en["luong_phai_672"]["sach_ghi"]


def test_trung_chau_mot_dong_can_cu_o_chuong_con_nguoi():
    from app.luangiai import tuvi_doi_song
    import datetime as dt
    co = 0
    for ti in range(0, 12, 3):
        bc = tuvi_doi_song.lap({"ngay": dt.date(1990, 5, 15), "ti": ti, "gioi_tinh": "nam"}, dt.date(2026, 11, 20))
        tq = next(c for c in bc["chuong"] if c["ma"] == "tong_quan")
        dong = [x for x in tq["can_cu"] if x.startswith("Theo Tử vi Trung Châu phái")]
        assert len(dong) <= 1 and all("tinh hệ" in x and not HAN.search(x) for x in dong)
        co += len(dong)
    assert co >= 1
