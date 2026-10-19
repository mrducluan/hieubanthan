# -*- coding: utf-8 -*-
"""TS-NOIDAU — ma trận nỗi đau × câu hỏi thần số (port question_intents của bản V3 vào kiến trúc 4 tầng).

Khoá: KB đủ trường + nguồn; MỌI câu chuẩn định tuyến đúng lĩnh vực qua bộ phân loại hỏi đáp thật (bấm câu nào
cũng ra câu trả lời đúng chủ đề, không rơi vào từ chối); giá trị chỉ số = đúng CALC; gợi ý câu liên quan tất định,
không gợi ý gì cho câu khủng hoảng / ngoài phạm vi.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import thanso, thanso_mo_rong as mr
from app.luangiai import hoi, noi_dau
from app.main import app

KB = json.loads((Path(__file__).parents[1] / "app/kb/data/thanso_noi_dau.json").read_text(encoding="utf-8"))
NGAY_XEM = dt.date(2026, 10, 19)
LUAN = (["Nguyễn Đức Luân"], 24, 10, 1988)
# Lời doạ / phán định bị cấm trong câu hỏi gợi ý (CLAUDE.md: không doạ, không phán hung để giữ chân).
CAM = ["xui", "đại hạn", "tai hoạ", "tai hoạ", "chết", "phá sản", "vận hạn", "giải hạn", "chắc chắn", "sẽ mất"]


def test_kb_du_truong_va_nguon():
    assert KB["source_id"] and KB["school_id"] and KB["trang_thai"]
    ma = [q["ma"] for q in KB["cau_hoi"]]
    assert len(ma) == len(set(ma)) >= 25
    for q in KB["cau_hoi"]:
        assert q["tru"] in KB["tru"], q["ma"]
        assert q["noi_dau"] and q["cau"].endswith("?") and q["bien_the"], q["ma"]
        assert q["chi_so"] and all(c in KB["chi_so"] for c in q["chi_so"]), q["ma"]
        assert all(c in noi_dau.CHI_SO_HO_TRO for c in q["chi_so"]), q["ma"]
    for ma_tru in KB["tru"]:
        assert sum(q["tru"] == ma_tru for q in KB["cau_hoi"]) >= 5, ma_tru


def test_khong_co_loi_doa():
    for q in KB["cau_hoi"]:
        chu = f"{q['noi_dau']} {q['cau']}".lower()
        assert not any(t in chu for t in CAM), q["ma"]


@pytest.mark.parametrize("q", KB["cau_hoi"], ids=lambda q: q["ma"])
def test_cau_chuan_dinh_tuyen_dung(q):
    pl = hoi.phan_loai(q["cau"])
    assert pl["xu_ly"] not in ("an_toan", "tu_choi_nhe"), pl
    assert pl["linh_vuc"] in q["linh_vuc"], (q["cau"], pl["linh_vuc"])


def test_uu_tien_khong_phai_tien_bac():
    # Lỗi cũ: "ưu tiên" bỏ dấu thành "uu tien" → khớp từ khoá tiền → lạc sang tài chính.
    assert hoi.phan_loai("Tháng này tôi nên ưu tiên việc gì?")["linh_vuc"] == "thoi_van"
    assert hoi.phan_loai("Làm sao kiếm nhiều tiền hơn?")["linh_vuc"] == "tai_chinh"


def test_ban_do_gia_tri_dung_calc():
    bd = noi_dau.ban_do(*LUAN, NGAY_XEM)
    assert [t["ma"] for t in bd["tru"]] == list(KB["tru"])
    so = {s["ma"]: s["gia_tri"] for t in bd["tru"] for q in t["cau_hoi"] for s in q["so"]}
    assert so["duong_doi"] == 33 and so["su_menh"] == 9 and so["linh_hon"] == 6 and so["nhan_cach"] == 3
    assert so["nam_ca_nhan"] == thanso.nam_ca_nhan(24, 10, 2026, "duong_lich")
    assert so["thang_ca_nhan"] == mr.thang_ca_nhan(24, 10, 2026, 10)
    assert so["ngay_ca_nhan"] == mr.ngay_ca_nhan(24, 10, 2026, 10, 19)
    assert so["thu_thach_chinh"] == thanso.thu_thach(24, 10, 1988)["thu_thach_chinh"]
    assert so["so_vang_bieu_do"] == mr.bieu_do_ngay_sinh(24, 10, 1988)["so_thieu"]
    assert so["bai_hoc_nghiep"] == mr.bai_hoc_nghiep("Nguyễn Đức Luân")
    # Đỉnh cao hiện tại: 38 tuổi (sinh 24/10/1988, xem 19/10/2026 — chưa tới sinh nhật → 37).
    dc = thanso.dinh_cao(24, 10, 1988, 33)
    hien = next(p for p in dc if p["den_tuoi"] is None or 37 <= p["den_tuoi"])
    assert so["dinh_cao"] == hien["so"]
    assert bd["source_id"] == KB["source_id"] and bd["trang_thai"] == "nhap_ai"


def test_ban_do_khong_ten_chi_so_ngay_sinh():
    bd = noi_dau.ban_do([], 24, 10, 1988, NGAY_XEM)
    so = {s["ma"]: s["gia_tri"] for t in bd["tru"] for q in t["cau_hoi"] for s in q["so"]}
    assert so["duong_doi"] == 33 and so["su_menh"] is None and so["bai_hoc_nghiep"] is None


def test_lien_quan_tat_dinh_va_dung_chu_de():
    a = noi_dau.lien_quan("Tôi hợp nghề gì?")
    assert a == noi_dau.lien_quan("Tôi hợp nghề gì?")
    assert 1 <= len(a) <= 3
    assert a[0]["tru"] == "su_nghiep_tien_bac"
    # Không gợi lại đúng câu vừa hỏi.
    cau = KB["cau_hoi"][0]["cau"]
    assert all(x["cau"] != cau for x in noi_dau.lien_quan(cau))


def test_thang_mo_dau():
    # Năm cá nhân 2026 = 8, 2027 = 9 → tháng cá nhân 1 rơi vào 11/2026 (8+11) và 1/2027 (9+1).
    assert noi_dau.thang_mo_dau(24, 10, NGAY_XEM) == [(2026, 11), (2027, 1)]


def test_cau_tra_loi_rieng_tung_the():
    """Câu bấm từ bảng: lời đáp mở đầu bằng chỉ số đặc trưng của thẻ, không trùng câu khác cùng trụ."""
    from app.narrative import hoi_van
    nguoi = {"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988}
    dau: dict[str, set[str]] = {}
    for q in KB["cau_hoi"]:
        if q["linh_vuc"] == ["hop_doi"]:
            continue
        van = hoi_van.tra_loi(q["cau"], nguoi, None, NGAY_XEM, dung_llm=False)["cau_tra_loi"]
        mo = van.split("\n")[0]
        assert mo not in dau.setdefault(q["tru"], set()), q["ma"]
        dau[q["tru"]].add(mo)
    van = hoi_van.tra_loi("Tháng nào sắp tới thuận để tôi bắt đầu một việc mới?", nguoi, None, NGAY_XEM,
                          dung_llm=False)["cau_tra_loi"]
    assert "11/2026, 1/2027" in van


@pytest.mark.parametrize("cau", ["asdfgh qwerty", "Con tôi hợp học ngành gì?"])
def test_lien_quan_rong_khi_vo_nghia_hoac_nguoi_khac(cau):
    assert noi_dau.lien_quan(cau) == []


@pytest.mark.parametrize("cau", ["Tôi không muốn sống nữa", "Cho tôi con số đánh đề hôm nay", "Năm nào tôi chết?"])
def test_lien_quan_rong_khi_dac_biet(cau):
    assert noi_dau.lien_quan(cau) == []


def test_api_noi_dau_va_hoi_co_cau_lien_quan():
    c = TestClient(app)
    r = c.post("/v1/thanso/noi-dau", json={"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988,
                                           "ngay_xem": "2026-10-19"})
    assert r.status_code == 200, r.text
    assert len(r.json()["tru"]) == 5
    r = c.post("/v1/thanso/noi-dau", json={"ho_ten": ["A"], "ngay": 31, "thang": 2, "nam": 1990})
    assert r.status_code == 422
    r = c.post("/v1/thanso/hoi", json={"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988,
                                       "cau_hoi": "Tôi hợp nghề gì?"})
    assert r.status_code == 200
    assert r.json()["cau_lien_quan"] and r.json()["cau_lien_quan"][0]["tru"] == "su_nghiep_tien_bac"
