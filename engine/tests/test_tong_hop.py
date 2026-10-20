# -*- coding: utf-8 -*-
"""TS-V3 — tổng hợp ba phái (Pitago · Chaldea · Qabalah) + đồ thị liên phái + gói ngữ cảnh (thay
fn_assemble_llm_context_payload_v3 của bản SQL). RULES thuần, không LLM, không DB.

Ca chuẩn Nguyễn Đức Luân 24/10/1988 (đã biết từ các golden khác):
  Pitago  DD 33 (gốc 6) · SM 9 · LH 6 · NC 3
  Chaldea họ tên 8 · linh hồn 24/6 · nhân cách 29/2 · tên gọi 15/6 · ngày sinh 24/6 · đường đời 33/6
  Qabalah con đường tên 7 · Sephirah tên 7 · Sephirah ngày sinh 6
→ số 6 lặp 7 lần ở cả 3 phái; nhóm "đường đời" và "linh hồn" cộng hưởng; "họ tên" và "nhân cách" khác nhịp.
"""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.luangiai import tong_hop
from app.main import app
from app.narrative import hoi_van

LUAN = (["Nguyễn Đức Luân"], 24, 10, 1988)
NGAY = dt.date(2026, 10, 19)


def test_so_noi_bat():
    kq = tong_hop.tong_hop(*LUAN, NGAY)
    dau = kq["so_noi_bat"][0]
    assert dau["goc"] == 6 and dau["lan"] == 7 and sorted(dau["phai"]) == ["chaldea", "kabbalah", "pitago"]
    assert dau["tu_khoa"]
    assert all(s["lan"] >= 2 and len(s["phai"]) >= 2 for s in kq["so_noi_bat"])


def test_tuong_tac_lien_phai():
    kq = tong_hop.tong_hop(*LUAN, NGAY)
    qh = {t["nhom"]: t["quan_he"] for t in kq["tuong_tac"]}
    assert qh["duong_doi"] == "cong_huong" and qh["linh_hon"] == "cong_huong"
    assert qh["ten_day_du"] == "khac_nhip" and qh["nhan_cach"] == "khac_nhip"
    for t in kq["tuong_tac"]:
        assert t["cach_doc"] and t["goi_y"] and "{" not in t["cach_doc"] + t["goi_y"]


def test_canh_bo_sung_no_nghiep_kep():
    kq = tong_hop.tong_hop(["Nguyễn Văn An"], 19, 5, 1990, NGAY)
    bs = [t for t in kq["tuong_tac"] if t["quan_he"] == "bo_sung"]
    assert bs and bs[0]["nhom"] == "ngay_sinh"


def test_nhip_cham_net_noi_bat():
    # Năm cá nhân 2026 của Luân = 8, không trùng số nổi bật 6; năm 2024 = 6 → chạm.
    assert tong_hop.tong_hop(*LUAN, NGAY)["nhip"]["cham_net_noi_bat"] is False
    assert tong_hop.tong_hop(*LUAN, dt.date(2024, 5, 1))["nhip"]["cham_net_noi_bat"] is True


def test_ngu_canh_v3():
    p = tong_hop.ngu_canh(*LUAN, "Tôi hợp nghề gì?", NGAY)
    assert p["y_dinh"]["linh_vuc"] == "su_nghiep" and p["y_dinh"]["ma_cau"] == "sn_sai_nghe"
    assert set(p["ho_so_tinh_toan"]) == {"pitago", "chaldea", "kabbalah"}
    assert p["nut_kich_hoat"] and p["tuong_tac_lien_phai"] and p["quy_tac_bat_buoc"]
    assert p["bang_chung"]["muc"]
    # Câu khủng hoảng: không dựng ngữ cảnh luận, chỉ trả mẫu hỗ trợ.
    k = tong_hop.ngu_canh(*LUAN, "Tôi không muốn sống nữa", NGAY)
    assert k["y_dinh"]["xu_ly"] == "an_toan" and not k["tuong_tac_lien_phai"]


def test_hoi_dap_phai_kabbalah_va_tong_hop():
    nguoi = {"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988}
    kb = hoi_van.tra_loi("Điểm mạnh cốt lõi của tôi là gì?", nguoi, None, NGAY, dung_llm=False, phai="kabbalah")
    assert "Qabalah" in kb["cau_tra_loi"] and "Tiferet" in kb["cau_tra_loi"]
    th = hoi_van.tra_loi("Điểm mạnh cốt lõi của tôi là gì?", nguoi, None, NGAY, dung_llm=False, phai="tong_hop")
    assert "ba phái" in th["cau_tra_loi"] and not th["loi_kiem_tra"]
    # Chủ đề Qabalah không có (năm cá nhân) → giữ Pythagoras, ghi rõ.
    nam = hoi_van.tra_loi("Năm nay của tôi thế nào?", nguoi, None, NGAY, dung_llm=False, phai="kabbalah")
    assert "theo phái Pythagoras" in nam["cau_tra_loi"]


def test_api():
    c = TestClient(app)
    body = {"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988}
    r = c.post("/v1/thanso/tong-hop", json=body)
    assert r.status_code == 200 and r.json()["so_noi_bat"][0]["goc"] == 6
    r = c.post("/v1/thanso/ngu-canh", json={**body, "cau_hoi": "Tôi hợp nghề gì?"})
    assert r.status_code == 200 and r.json()["phien_ban"] == "v3"
    r = c.post("/v1/thanso/hoi", json={**body, "cau_hoi": "Điểm mạnh cốt lõi của tôi là gì?", "phai": "kabbalah"})
    assert r.status_code == 200 and "AI nháp" not in r.text
