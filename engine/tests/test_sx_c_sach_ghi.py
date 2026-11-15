# -*- coding: utf-8 -*-
"""SX-C (2026-11-14) — lớp "sách xưa ghi": mọi mục KB qua bộ kiểm, khối hiển thị đúng ba nhóm, không lộ cho người chưa 18."""
from __future__ import annotations

import datetime
import json
import re
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
        k = sgm.tuvi(_cung("Tham Lang", do_sang), tuoi=30)
        mong = sum(1 for m, x in zip(kb, khi) if x in ("chung", tt) and sgm._dieu_kien_dat(m["han"], "Tham Lang", {"Tham Lang"}, set()))
        assert k["so_muc"] == mong, do_sang


def test_tuvi_cau_sach_neu_sao_kem_phai_dung_voi_cung():
    # câu nêu sao kèm → cung phải có sao đó; câu "không gặp …" → cung phải không có
    assert not sgm._dieu_kien_dat("贪狼遇火铃", "Tham Lang", {"Tham Lang"}, set())
    assert sgm._dieu_kien_dat("贪狼遇火铃", "Tham Lang", {"Tham Lang", "Hỏa Tinh"}, set())
    assert sgm._dieu_kien_dat("贪狼无煞", "Tham Lang", {"Tham Lang"}, set())
    assert not sgm._dieu_kien_dat("贪狼无煞", "Tham Lang", {"Tham Lang", "Kình Dương"}, set())
    assert not sgm._dieu_kien_dat("紫微贪狼", "Tham Lang", {"Tham Lang"}, set())        # sao chính kèm phải đồng cung
    assert sgm._dieu_kien_dat("贪狼化禄", "Tham Lang", {"Tham Lang"}, {"Lộc"})


def test_khong_biet_tuoi_thi_khong_nhan_nhom_c():
    cung = [{"ten": "Mệnh", "chinh_tinh": [{"ten": s, "do_sang_nam_phai": "Hãm"} for s in ("Thất Sát", "Phá Quân", "Cự Môn")],
             "phu_tinh": []}]
    assert "C" not in {m["nhom"] for n in (sgm.tuvi(cung) or {"nhom": []})["nhom"] for m in n["muc"]}
    assert sgm.tuoi_tu(None, datetime.date(2026, 11, 15)) is None
    assert sgm.tuoi_tu(2008, datetime.date(2026, 11, 15)) == 17          # chỉ năm sinh: tính thận trọng
    assert sgm.tuoi_tu(datetime.date(2008, 1, 2), datetime.date(2026, 11, 15)) == 18


def test_battu_chi_nhan_dieu_kien_kiem_duoc():
    assert sgm._khi_bt("", None) and sgm._khi_bt("nói chung, ai có sao này", None)
    assert sgm._khi_bt("với lá số nam", "nam") and not sgm._khi_bt("với lá số nam", "nu")
    assert not sgm._khi_bt("với lá số nữ", None)
    assert not sgm._khi_bt("khi nhật chủ vượng", "nam")                 # chưa có phép tính → không chọn


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


def test_hoi_dap_nhan_tuong_kieu_hinh_dang_dieu_bo_vi():
    from app.luangiai import nhan_tuong as nt
    r = nt.hoi("Mắt phượng là gì?", nam_sinh=1990)
    assert r["xu_ly"] == "kieu_hinh" and "Phượng nhãn" in r["cau_tra_loi"] and "鳳眼" in r["cau_tra_loi"]
    assert nt.hoi("tai lớn thì sao", nam_sinh=1990)["xu_ly"] != "kieu_hinh"          # "tai lớn" ≠ "tai lợn"
    assert nt.hoi("mắt cá chân tôi đau", nam_sinh=1990)["xu_ly"] != "kieu_hinh"
    d = nt.hoi("dáng đi nói gì về tôi", nam_sinh=1990)
    assert d["xu_ly"] == "dang_dieu" and "Sách xưa ghi" in d["cau_tra_loi"]
    b = nt.hoi("Ấn Đường rộng nghĩa là gì?", nam_sinh=1990)
    assert "Sách xưa ghi thêm về chỗ này" in b["cau_tra_loi"] and "không phải nhận xét về gương mặt bạn" in b["cau_tra_loi"]
    # câu xin xem tướng người khác vẫn bị từ chối trước khi tới kiểu hình
    assert nt.hoi("Mắt phượng của sếp tôi nói gì về anh ấy?", nam_sinh=1990)["xu_ly"] == "tu_choi_nhe"
    # câu đời thường trùng chữ với tên kiểu hình / dáng điệu không bị bắt nhầm
    for cau in ("Tôi bị đau mắt cá", "Ăn mộc nhĩ có tốt không", "Đau ở hổ khẩu bàn tay", "Tôi đang nằm viện",
                "Bé đang ngủ thì giật mình", "Hôm nay mắt say vì thức khuya"):
        assert nt.hoi(cau, nam_sinh=1990)["xu_ly"] not in ("kieu_hinh", "dang_dieu"), cau
    assert nt.hoi("Tôi muốn nâng mũi cho thành mũi rồng", nam_sinh=1990)["xu_ly"] == "phau_thuat"
    assert nt.hoi("Bé nhà tôi có mắt rắn", nam_sinh=1990)["xu_ly"] == "tu_choi_nhe"
    assert nt.hoi("nụ cười nói gì về tôi", nam_sinh=1990)["xu_ly"] == "dang_dieu"


def test_kieu_hinh_nhom_c_khong_hien_cho_nguoi_chua_18():
    kb = json.loads((DATA / "nhan_tuong_kieu_hinh.json").read_text("utf-8"))["kieu"]
    c = next(m for ds in kb.values() for m in ds if m["nhom"] == "C")
    lon = sgm.nt_kieu_hinh(f"{c['ten_viet']} là gì", tuoi=30)
    nho = sgm.nt_kieu_hinh(f"{c['ten_viet']} là gì", tuoi=15)
    assert "Hàm ý theo ghi chép xưa" in lon["loi"] and c["han"] in lon["loi"]
    assert "Hàm ý theo ghi chép xưa" not in nho["loi"] and c["han"] not in nho["loi"] and c["nhan_dang"] in nho["loi"]


def test_tam_yeu_du_64_nha_64_bep_va_du_nien_khop_phep_tinh():
    """Dương Trạch Tam Yếu (tóm ý): đủ 8 × 8 thế nhà cửa – chủ và 8 × 8 cặp bếp – cửa; du niên từng cặp = bảng du niên engine."""
    ty = json.loads((DATA / "phongthuy_tam_yeu.json").read_text("utf-8"))
    quai = list(pt.QUAI)
    assert set(ty["nha"]) == {f"{a}_{b}" for a in quai for b in quai}
    assert set(ty["bep"]) == {f"{a}_{b}" for a in quai for b in quai}
    for k, m in ty["nha"].items():
        cua, chu = k.split("_")
        assert m["du_nien"] == pt.bang_huong(cua)[pt.QUAI[chu][1]], k
        assert m.get("tom_y") is True and "han" not in m
        assert set(m.get("bep_hop", [])) <= set(quai) and set(m.get("bep_nen_tranh", [])) <= set(quai)
    for k, m in ty["bep"].items():
        bep, cua = k.split("_")
        assert m["du_nien"] == pt.bang_huong(cua)[pt.QUAI[bep][1]], k
    assert len({m["y"] for m in ty["nha"].values()}) == 64


def test_phongthuy_cua_chu_bep_lay_tam_yeu():
    k = sgm.phongthuy(cua="Càn", chu="Đoài", bep="Khôn", tuoi=40)
    n = next(x for x in k["nhom"] if x["ma"] == "cua_chu_bep")
    assert len(n["muc"]) == 2 and all(m.get("tom_y") and "han" not in m and m["sach"] == "Dương Trạch Tam Yếu" for m in n["muc"])
    assert "Sinh Khí" in n["muc"][0]["ve"]


def test_thai_san_va_ten_chung_chi_noi_dang_giu_gin():
    """SX-C2 (chủ dự án 2026-11-15): thai sản, kinh nguyệt, tên chứng hay gặp được nhắc — luôn kèm ý đi khám / giữ gìn."""
    for ten in TEP:
        for vt, m in sg.cac_muc(json.loads((DATA / ten).read_text("utf-8"))):
            t = " ".join(m.get(k) or "" for k in ("y", "ham_y", "viec")).lower()
            if any(x in t for x in ("thai", "sinh nở", "kinh nguyệt")) or re.search(r"(?<![\wÀ-ỹ])(?<!bằng )chứng (?!từ)", t):
                assert "khám" in t or "giữ gìn" in t or "giữ sức" in t, (ten, vt)


def test_do_hinh_nhom_b_c_khong_hien_phien_am():
    d = json.loads((DATA / "nhan_tuong_do_hinh.json").read_text("utf-8"))
    for h in d["do_hinh"]:
        for p in h["diem"]:
            if p.get("muc") in ("B", "C"):
                assert not p.get("am"), p["id"]
            assert not sg.kiem_loi(p["y"]), p["id"]
