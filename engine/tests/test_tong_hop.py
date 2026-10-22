# -*- coding: utf-8 -*-
"""TS-V3 — tổng hợp hai phái (Pitago · Chaldea) + đồ thị liên phái + gói ngữ cảnh (thay
fn_assemble_llm_context_payload_v3 của bản SQL). RULES thuần, không LLM, không DB.

Ca chuẩn Nguyễn Đức Luân 24/10/1988 (đã biết từ các golden khác):
  Pitago  DD 33 (gốc 6) · SM 9 · LH 6 · NC 3
  Chaldea họ tên 8 · linh hồn 24/6 · nhân cách 29/2 · tên gọi 15/6 · ngày sinh 24/6 · đường đời 33/6
Đường đời của hai phái là CÙNG một phép cộng ngày sinh → gộp làm một nguồn "chung" (không tính là hai phái đồng ý).
→ số 6 gặp ở 5 nguồn độc lập (chung · Pitago LH · Chaldea LH · tên gọi · ngày sinh); "linh hồn" cộng hưởng;
"họ tên" và "nhân cách" là các góc nhìn khác nhau.
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
    assert dau["goc"] == 6 and dau["lan"] == 5 and dau["phai"] == ["chaldea", "chung", "pitago"]
    assert dau["tu_khoa"]
    assert all(s["lan"] >= 2 and len(s["phai"]) >= 2 for s in kq["so_noi_bat"])


def test_tuong_tac_lien_phai():
    kq = tong_hop.tong_hop(*LUAN, NGAY)
    qh = {t["nhom"]: t["quan_he"] for t in kq["tuong_tac"]}
    assert "duong_doi" not in qh and qh["linh_hon"] == "cong_huong"
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
    assert set(p["ho_so_tinh_toan"]) == {"pitago", "chaldea"}
    assert p["nut_kich_hoat"] and p["tuong_tac_lien_phai"] and p["quy_tac_bat_buoc"]
    assert p["bang_chung"]["muc"]
    # Câu khủng hoảng: không dựng ngữ cảnh luận, chỉ trả mẫu hỗ trợ.
    k = tong_hop.ngu_canh(*LUAN, "Tôi không muốn sống nữa", NGAY)
    assert k["y_dinh"]["xu_ly"] == "an_toan" and not k["tuong_tac_lien_phai"]


def test_hoi_dap_phai_tong_hop():
    nguoi = {"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988}
    th = hoi_van.tra_loi("Điểm mạnh cốt lõi của tôi là gì?", nguoi, None, NGAY, dung_llm=False, phai="tong_hop")
    assert "Điểm chung giữa các phái" in th["cau_tra_loi"] and not th["loi_kiem_tra"]
    assert th["cau_tra_loi"].count("Lần gần nhất") <= 1
    assert "Qabalah" not in th["cau_tra_loi"]


def test_api():
    c = TestClient(app)
    body = {"ho_ten": LUAN[0], "ngay": 24, "thang": 10, "nam": 1988}
    r = c.post("/v1/thanso/tong-hop", json=body)
    assert r.status_code == 200 and r.json()["so_noi_bat"][0]["goc"] == 6
    r = c.post("/v1/thanso/ngu-canh", json={**body, "cau_hoi": "Tôi hợp nghề gì?"})
    assert r.status_code == 200 and r.json()["loai"] == "ngu_canh" and "v3" not in r.text.lower().replace("ngu_canh", "")
    r = c.post("/v1/thanso/hoi", json={**body, "cau_hoi": "Điểm mạnh cốt lõi của tôi là gì?", "phai": "tong_hop"})
    assert r.status_code == 200 and "AI nháp" not in r.text


def test_chu_ky_so_chi_co_con_so():
    c = TestClient(app)
    body = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988}
    r = c.post("/v1/thanso/chu-ky-so", json=body)
    ck = r.json()["chu_ky"]
    assert ck == {"pitago": {"duong_doi": 33, "su_menh": 9, "linh_hon": 6, "nhan_cach": 3}}   # chỉ phái được góp ý
    assert "Luân" not in r.text and "1988" not in r.text and "24" not in r.text
    ch = c.post("/v1/thanso/chu-ky-so", json={**body, "phai": "chaldea"}).json()["chu_ky"]["chaldea"]
    assert set(ch) == {"so_ten", "ten_goi", "linh_hon", "nhan_cach"} and all(1 <= v <= 9 for v in ch.values())
    assert c.post("/v1/thanso/chu-ky-so", json={**body, "phai": "kabbalah"}).status_code == 422


def test_chu_ky_so_luon_qua_rang_buoc_sql():
    """Rà vòng HỌC 2026-10-22: SQL `thanso_chu_ky_hop_le` (0016) chỉ nhận Pitago 1–33, Chaldea 0–9, số nguyên. Tên không có
    nguyên âm / phụ âm (vd "Y", chỉ có số) cho chỉ số 0 → cả góp ý bị DB từ chối âm thầm. Engine bỏ khoá rỗng/0 thay vì gửi."""
    c = TestClient(app)
    for ten in (["Y"], ["Ng"], ["123"], ["Nguyễn Thị Ý"], ["Quỳnh"]):
        for phai in ("pitago", "chaldea", "tong_hop"):
            r = c.post("/v1/thanso/chu-ky-so", json={"ho_ten": ten, "ngay": 11, "thang": 10, "nam": 2004, "phai": phai})
            assert r.status_code == 200
            for p, v in r.json()["chu_ky"].items():
                lo, hi = (1, 33) if p == "pitago" else (0, 9)
                assert v and all(isinstance(x, int) and lo <= x <= hi for x in v.values()), (ten, phai, v)


def test_khong_cong_huong_gia():
    import random
    random.seed(1)
    for _ in range(200):
        d, m, y = random.randint(1, 28), random.randint(1, 12), random.randint(1950, 2010)
        kq = tong_hop.tong_hop(["Lê Văn Bình"], d, m, y, NGAY)
        assert all(t["quan_he"] == "bo_sung" for t in kq["tuong_tac"] if t["nhom"] == "duong_doi")
        # Không còn số nổi bật CHỈ nhờ họ ngày sinh: mọi số nổi bật có ít nhất một nguồn ngoài "chung".
        assert all(set(s["phai"]) - {"chung"} for s in kq["so_noi_bat"])
        assert all(s["goc"] >= 1 for s in kq["so_noi_bat"])
    assert set(tong_hop.ho_so(["Phạm Khánh"], 19, 1, 1970)) == {"pitago", "chaldea"}
