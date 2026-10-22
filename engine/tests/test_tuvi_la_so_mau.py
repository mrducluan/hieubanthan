# -*- coding: utf-8 -*-
"""MAU6 — 6 lá số minh hoạ (nhân vật hư cấu) đọc từng bước: Mệnh–Thân → chính tinh & độ sáng → tam
phương tứ chính → cách cục → tứ hoá → đại hạn → lưu niên. Chỉ ghép từ CALC + KB (RULES), không LLM,
tất định (ngày xem cố định). Test viết TRƯỚC."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.luangiai import la_so_mau as lm
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
BUOC = ["menh_than", "chinh_tinh", "tam_phuong", "cach_cuc", "tu_hoa", "dai_han", "luu_nien"]
CHU_DE = {  # slug → cách cục tiêu biểu phải có trong lá
    "tu-phu-dong-cung": "tu_phu_dong_cung", "that-sat-trieu-dau": "that_sat_trieu_dau",
    "co-nguyet-dong-luong": "co_nguyet_dong_luong", "cu-nhat-dong-cung": "cu_nhat_dong_cung",
    "menh-vo-chinh-dieu": "menh_vo_chinh_dieu", "nhat-le-trung-thien": "nhat_le_trung_thien",
}


def test_danh_sach_6_la():
    ds = lm.danh_sach()
    assert [x["slug"] for x in ds] == list(CHU_DE)
    for x in ds:
        assert x["ten"] and x["tieu_de"] and x["mo_ta"] and x["hu_cau"] is True


@pytest.mark.parametrize("slug", list(CHU_DE))
def test_doc_tung_buoc(slug):
    d = lm.doc(slug)
    assert CHU_DE[slug] in {c["ma"] for c in d["la_so"]["cach_cuc"]}
    assert [b["ma"] for b in d["buoc"]] == BUOC
    for b in d["buoc"]:
        assert b["tieu_de"] and b["cach_doc"] and b["doan"], (slug, b["ma"])
        van = "\n".join(b["doan"])
        assert "của bạn" not in van                     # lá mẫu: nói về nhân vật, không về người đọc
        for c in hoi_van.CAM:
            assert c not in van.lower(), (slug, b["ma"], c)
        assert isinstance(b["thuat_ngu"], list)
    assert d["ngay_xem"] == lm.NGAY_XEM.isoformat()


def test_vo_chinh_dieu_noi_ro_muon_sao():
    d = lm.doc("menh-vo-chinh-dieu")
    assert "vô chính diệu" in "\n".join(d["buoc"][1]["doan"])


def test_tat_dinh():
    assert lm.doc("cu-nhat-dong-cung") == lm.doc("cu-nhat-dong-cung")


def test_api():
    r = client.get("/v1/tuvi/la-so-mau")
    assert r.status_code == 200 and len(r.json()["ds"]) == 6
    r = client.get("/v1/tuvi/la-so-mau/tu-phu-dong-cung")
    assert r.status_code == 200 and r.json()["la_so"]["cung"] and len(r.json()["buoc"]) == 7
    assert client.get("/v1/tuvi/la-so-mau/khong-co").status_code == 404


def test_luu_y_pha_cach_chi_mot_lan():
    """Lỗi đọc thấy trên ảnh chụp: ghi chú phá cách dài lặp lại ở mọi cách cục."""
    from app.kb import tuvi_kb
    van = "\n".join(lm.doc("menh-vo-chinh-dieu")["buoc"][3]["doan"])
    assert van.count(tuvi_kb.luu_y_pha_cach()) == 1


def test_hoi_dap_luu_y_pha_cach_chi_mot_lan():
    import datetime as dt
    from app.hoidap import tuvi as tv
    from app.kb import tuvi_kb
    kq = tv.tra_loi("Cung Mệnh của tôi nói gì về tính cách?", "tham_khao",
                    sinh={"ngay": dt.date(1981, 11, 6), "ti": 4, "gioi_tinh": "nu"})
    assert sum(c.count(tuvi_kb.luu_y_pha_cach()) for c in kq["can_cu"]) == 1   # căn cứ: một lần
    assert kq["cau_tra_loi"].count("Nét này dễ mờ đi") <= 1                      # thân bài: một lần
