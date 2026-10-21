# -*- coding: utf-8 -*-
"""PT-ĐS: báo cáo "Nhà của bạn" — 5 chương đời thường từ Bát trạch + Tam yếu + Huyền Không + tuổi làm nhà; thành viên gia
đình (khác nhóm → chia hướng, hành thông quan); hình thế trước lý khí; lớp đời thường sạch giọng AI / từ doạ."""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.kb import phongthuy_doi_song_kb as kb
from app.luangiai import phongthuy_doi_song as ds
from app.main import app

client = TestClient(app)
SINH = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17), "moc_nam": "lap_xuan"}   # Khảm, Đông tứ
NGAY = dt.date(2026, 5, 20)


def _lop(bc: dict) -> str:
    phan = []
    for h in bc["cot_loi"]:
        phan += [h["tieu_de"], h["noi_dung"], h.get("huong_xu_ly") or ""]
    for c in bc["chuong"]:
        phan += [c["tieu_de"], c.get("tom_tat") or "", *c["doan"]]
        for h in c.get("hop", []):
            phan += [h["tieu_de"], h["noi_dung"], h.get("huong_xu_ly") or ""]
        for n in c.get("hanh_dong", []):
            phan += n["viec"]
    return "\n".join(phan)


def test_bao_cao_day_du():
    bc = ds.luan_giai(SINH, {"huong_do": 180, "nam_xay": 2008}, ngay_xem=NGAY)
    assert bc["phien_ban"] == "doi_song_1" and bc["mo_dun"] == "phongthuy"
    assert [c["ma"] for c in bc["chuong"]] == ["ban_hop_huong", "ngoi_nha_voi_ban", "tung_phong", "nam_nay", "viec_nen_lam"]
    assert len(bc["cot_loi"]) >= 2 and bc["ket"]
    c1, c2, c3, c4, c5 = bc["chuong"]
    assert "Khảm" in c1["tom_tat"] and any(h["loai"] == "loi_khuyen" for h in c1["hop"])
    # nhà hướng Nam: toạ Bắc = Khảm trạch (Đông tứ), Nam là Diên Niên với Khảm → thuận
    assert c2["muc"] == "thuan" and "Diên Niên" in " ".join(c2["can_cu"])
    assert bc["da_tinh"]["trach"]["quai"] == "Khảm" and bc["da_tinh"]["menh_quai"]["quai"] == "Khảm"
    # Huyền Không 2008 toạ Tý: có cục + cặp sao ở cung hướng
    assert bc["da_tinh"]["huyen_khong"]["cuc"] == "song_tinh_dao_huong" and bc["da_tinh"]["huyen_khong"]["cap_huong"]["ma"]
    # từng phòng: chưa khai bố cục → gợi ý đặt phòng theo mệnh, có 3 việc Tam yếu
    assert any(h["loai"] == "loi_khuyen" for h in c3["hop"]) and c3["goi_y_phong"]
    # năm nay: 5 phương tránh + 3 tháng
    assert len(c4["han_nam"]) == 5 and len(c4["ba_thang"]) == 3 and all(t["muc"] in kb.MUC for t in c4["ba_thang"])
    assert c4["ba_thang"][0]["chi_thang"] == "Tỵ" and c4["ba_thang"][1]["chi_thang"] == "Ngọ"
    assert any(h["loai"] == "thoi_diem" for h in c4["hop"])
    # việc nên làm: 3 nhóm, mỗi nhóm ≤ 4 việc
    assert [n["ma"] for n in c5["hanh_dong"]] == ["lam_ngay", "cho_luc", "tranh"] and all(1 <= len(n["viec"]) <= 4 for n in c5["hanh_dong"])
    van = _lop(bc)
    assert not kb.tim_cum_cam(van), kb.tim_cum_cam(van)
    assert "vật phẩm" not in van.lower().replace("không vật phẩm", "").replace("không cần mua bất kỳ vật phẩm", "")


def test_thieu_sinh_va_thieu_huong_van_tra_bao_cao():
    bc = ds.luan_giai(None, {"huong_do": 180}, ngay_xem=NGAY)
    assert bc["chuong"][0]["thieu"] == "can_sinh" and bc["chuong"][1]["muc"] is None
    assert bc["thieu"] == ["sinh", "nam_xay", "bo_cuc"]
    bc = ds.luan_giai(SINH, {}, ngay_xem=NGAY)
    assert bc["chuong"][1]["thieu"] == "can_huong" and bc["chuong"][0]["tom_tat"]
    assert len(bc["chuong"][3]["han_nam"]) == 5          # hạn năm vẫn có (không cần nhà)


def test_thanh_vien_khac_nhom_chia_huong_va_thong_quan():
    tv = [{"vai": "vo", "nam": 1992, "gioi_tinh": "nu"}]        # nữ 1992 → Đoài (Tây tứ), Kim sinh Thuỷ
    bc = ds.luan_giai(SINH, {"huong_do": 180}, thanh_vien=tv, ngay_xem=NGAY)
    c2 = bc["chuong"][1]
    tvs = bc["da_tinh"]["thanh_vien"]
    assert tvs[0]["quai"] == "Đoài" and tvs[0]["cung_nhom_voi_chu"] is False and tvs[0]["huong_chung"] == []
    assert tvs[0]["thong_quan"]["quan_he"] == "b_sinh_a" and tvs[0]["thong_quan"]["hanh_thong_quan"] is None
    assert any("khác nhóm" in d for d in c2["doan"])
    # Chấn (nam 1991: r=2 → 11-2=9 Ly? kiểm bằng engine) — lấy một người Khôn để có thông quan Thuỷ–Thổ → Kim
    tv2 = [{"vai": "chong", "nam": 1989, "gioi_tinh": "nu"}]   # nữ 1989: r=0 → 4 → Tốn? chỉ cần engine tính được
    bc2 = ds.luan_giai(SINH, {"huong_do": 180}, thanh_vien=tv2, ngay_xem=NGAY)
    assert bc2["da_tinh"]["thanh_vien"][0]["quai"]
    cung = [t for t in ds.luan_giai(SINH, {"huong_do": 180}, thanh_vien=[{"vai": "con", "nam": 1998, "gioi_tinh": "nam"}], ngay_xem=NGAY)["da_tinh"]["thanh_vien"]]
    assert cung[0]["quai"] == "Khôn" and cung[0]["thong_quan"]["hanh_thong_quan"] == "Kim"   # Thổ khắc Thuỷ → Kim thông quan


def test_bo_cuc_doc_tung_phong_va_hinh_the_truoc():
    bo_cuc = {"huong_nha_do": 180, "vi_tri": {"cua_chinh": "Nam", "phong_ngu_chinh": "Tây", "bep": "Đông", "ve_sinh": "Trung cung"},
              "dau_hieu": {"duong_dam": {"co": True}}}
    bc = ds.luan_giai(SINH, {"bo_cuc": bo_cuc, "nam_xay": 2008}, ngay_xem=NGAY)
    c2, c3 = bc["chuong"][1], bc["chuong"][2]
    assert c2["hop"][0]["loai"] == "luu_y" and "đường đâm" in c2["hop"][0]["tieu_de"].lower()   # hình thế trước lý khí
    phong = {p["phong"]: p for p in c3["phong"]}
    assert phong["phong_ngu_chinh"]["du_nien"] == "Hoạ Hại" and phong["phong_ngu_chinh"]["muc"] == "can_chu_dong"
    assert phong["bep"]["du_nien"] == "Thiên Y" and phong["cua_chinh"]["muc"] == "thuan"
    assert all(p.get("cap_sao") for p in c3["phong"] if p["cung"] != "Trung cung")
    assert any("giữa nhà" in (h["tieu_de"] + h["noi_dung"]).lower() for h in c3["hop"] if h["loai"] == "luu_y")
    assert c3["cua_chu_bep"] and c3["cua_chu_bep"]["cap"]


def test_api_luan_giai():
    body = {"sinh": {"birth_date": "1990-05-17", "gender": "nam"}, "nha": {"huong_do": 180, "nam_xay": 2008, "theo": "cua"},
            "thanh_vien": [{"vai": "vo", "birth_year": 1992, "gender": "nu"}], "ngay_xem": "2026-05-20"}
    r = client.post("/v1/phongthuy/luan-giai", json=body)
    assert r.status_code == 200
    d = r.json()
    assert d["phien_ban"] == "doi_song_1" and len(d["chuong"]) == 5 and d["da_tinh"]["thanh_vien"][0]["quai"] == "Đoài"
    assert client.post("/v1/phongthuy/luan-giai", json={"nha": {"huong_do": 400}}).status_code == 422
    assert client.post("/v1/phongthuy/luan-giai", json={"nha": {}, "la": 1}).status_code == 422
    r = client.post("/v1/phongthuy/luan-giai", json={"nha": {"huong": "Nam"}})
    assert r.status_code == 200 and r.json()["chuong"][0]["thieu"] == "can_sinh"
