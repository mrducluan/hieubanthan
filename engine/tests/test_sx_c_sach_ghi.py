# -*- coding: utf-8 -*-
"""SX-C (2026-11-14) — lớp "sách xưa ghi": mọi mục KB qua bộ kiểm, khối hiển thị đúng ba nhóm, không lộ cho người chưa 18."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app import ngon_ngu
from app.calc import phongthuy as pt
from app.kb import sach_ghi as sg
from app.luangiai import sach_ghi_mon as sgm

DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
TEP = sorted(p.name for p in DATA.glob("*.json") if any(True for _ in sg.cac_muc(json.loads(p.read_text("utf-8")))))
BAT_BUOC = {"tuvi_sach_ghi.json", "battu_sach_ghi.json", "nhan_tuong_sach_ghi.json", "nhan_tuong_kieu_hinh.json",
            "phongthuy_sach_ghi.json", "phongthuy_cung_menh.json"}


def test_du_cac_tep():
    assert BAT_BUOC <= set(TEP), BAT_BUOC - set(TEP)


@pytest.mark.parametrize("ten", TEP)
def test_moi_muc_qua_bo_kiem(ten):
    n, loi = sg.kiem_tep(DATA / ten)
    assert n > 0 and not loi, loi[:10]


def test_bo_kiem_chan_loi_tho_va_nhom_sai():
    goc = {"han": "眉短於目心性孤獨", "am": "Mi đoản ư mục", "y": "Người hay thu mình.", "nhom": "A", "chu_de": "tinh_net",
           "nguon": "than_tuong_toan_bien"}
    assert any("chữ nặng" in x for x in sg.kiem_muc(goc))                       # 孤 → không được nhóm A
    b = {**goc, "nhom": "B"}
    assert any("thiếu `ham_y`" in x for x in sg.kiem_muc(b))
    c = {**goc, "nhom": "C", "y": "Người này dễ chết sớm.", "ham_y": "Nên chú ý giữ sức.", "viec": "Đi khám."}
    assert any("chưa nói giảm" in x for x in sg.kiem_muc(c))
    sai = {**goc, "nhom": "B", "han": "眉短於目心性孤獨也也", "ham_y": "Nên chú ý.", "viec": "Hẹn bạn."}
    assert any("không có trong kho nguồn" in x for x in sg.kiem_muc(sai))
    tom = {"tom_y": True, "y": "Cửa và phòng chính cùng nhóm.", "nhom": "A", "chu_de": "nha_cua", "nguon": "duong_trach_tam_yeu"}
    assert sg.kiem_muc(tom) == []
    assert sg.kiem_muc({**tom, "nguon": "sach_la"})


def test_cung_menh_khop_phep_tinh():
    """Chín điều sách dặn cho từng cung: phương + du niên sách ghi phải khớp bảng du niên của engine; giếng luôn ở Sinh Khí."""
    cm = json.loads((DATA / "phongthuy_cung_menh.json").read_text("utf-8"))["cung"]
    assert set(cm) == set(pt.QUAI)
    so = 0
    for quai, ds in cm.items():
        bang = pt.bang_huong(quai)
        for m in ds:
            for p in m.get("phuong") or []:
                if p.get("du_nien"):
                    assert bang[p["phuong"]] == p["du_nien"], (quai, m["viec"], p)
                    so += 1
            if m["viec"] == "gieng":
                assert {bang[p["phuong"]] for p in m["phuong"]} == {"Sinh Khí"}, quai
    assert so >= 40


def _cung(sao: str, do_sang: str, cung: str = "Mệnh") -> list[dict]:
    return [{"ten": cung, "chinh_tinh": [{"ten": sao, "do_sang_nam_phai": do_sang}], "phu_tinh": []}]


def test_tuvi_chon_theo_do_sang():
    kb = json.loads((DATA / "tuvi_sach_ghi.json").read_text("utf-8"))["muc"]["Tham Lang"]["Mệnh"]
    khi = [m.get("khi", "chung") for m in kb]
    assert "chung" in khi
    for do_sang, tt in (("Miếu", "sang"), ("Hãm", "ham"), ("Bình", None)):
        k = sgm.tuvi(_cung("Tham Lang", do_sang))
        assert k["so_muc"] == sum(1 for x in khi if x in ("chung", tt)), do_sang


def test_ba_nhom_hien_dung_khuon_va_tre_khong_nhan_nhom_c():
    cung = [{"ten": c, "chinh_tinh": [{"ten": s, "do_sang_nam_phai": "Hãm"} for s in ("Thất Sát", "Phá Quân", "Cự Môn")]
             + [{"ten": "Thiên Phủ", "do_sang_nam_phai": "Miếu"}],
             "phu_tinh": [{"ten": "Kình Dương"}]} for c in ("Mệnh", "Phu Thê", "Tử Nữ", "Tật Ách", "Tài Bạch")]
    k = sgm.tuvi(cung, tuoi=30)
    muc = [m for n in k["nhom"] for m in n["muc"]]
    assert {m["nhom"] for m in muc} == {"A", "B", "C"}
    for m in muc:
        assert m["han"] and m["sach"] == "Tử Vi Đẩu Số Toàn Thư"
        if m["nhom"] == "C":
            assert m["loi"].startswith("Hàm ý theo ghi chép xưa: ") and m.get("viec") and "am" not in m
        if m["nhom"] == "B":
            assert "Nên chú ý" in m["loi"] and "am" not in m
        assert not sg.kiem_loi(m["loi"]), m["loi"]
    assert sg.CAU_KET in k["cau_ket"] and sg.CAU_KET_SUC_KHOE in k["cau_ket"]
    tre = sgm.tuvi(cung, tuoi=15)
    assert "C" not in {m["nhom"] for n in tre["nhom"] for m in n["muc"]}
    assert tre["so_muc"] < k["so_muc"]


def test_chi_ban_viet():
    with ngon_ngu.dung("en"):
        assert sgm.tuvi(_cung("Tham Lang", "Miếu")) is None
        assert sgm.phongthuy(quai="Khảm") is None


def test_phongthuy_theo_cung_va_dau_hieu():
    k = sgm.phongthuy(quai="Khảm", dau_hieu=["duong_dam", "minh_duong"])
    ma = [n["ma"] for n in k["nhom"]]
    assert ma[:2] == ["cung_menh", "dau_hieu"]
    assert len(k["nhom"][0]["muc"]) == 9
    assert all(m["sach"] == "Dương Trạch Thập Thư" for n in k["nhom"][:2] for m in n["muc"])
    assert sgm.phongthuy() is None


def test_nhan_tuong_theo_net_da_chon():
    k = sgm.nhan_tuong(["may_giao", "moi_hong", "khong_co_ma_nay"], tuoi=40)
    assert k["so_muc"] == 2 and {m["nhom"] for m in k["nhom"][0]["muc"]} == {"A", "C"}
    assert sgm.nhan_tuong(["may_giao"], tuoi=16) is None            # chỉ có mục nhóm C → người chưa 18 không nhận gì


def test_route_co_khoi_sach_ghi_va_khong_doi_truong_cu():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    b = {"birth_date": "1990-05-17", "birth_time": "14:30", "gender": "nam"}
    tv = client.post("/v1/tuvi/an-sao", json=b).json()
    assert tv["sach_ghi"]["so_muc"] > 5 and tv["sach_xua"] is not None
    bt = client.post("/v1/battu/la-so", json=b).json()
    assert {n["ma"] for n in bt["sach_ghi"]["nhom"]} >= {"than_sat", "tinh_net", "than_the"}
    kg = client.post("/v1/tuvi/an-sao", json={**b, "do_tin_gio": "unknown"}).json()
    assert kg["sach_ghi"] is None
