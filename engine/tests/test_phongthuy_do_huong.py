# -*- coding: utf-8 -*-
"""PT-V1 — đo hướng nhà bằng la bàn điện thoại: độ của HƯỚNG (mặt nhà nhìn ra) → 8 hướng, sơn hướng,
toạ (đối diện), sơn toạ, trạch quái, cảnh báo ranh giới. Viết TRƯỚC hàm.

Quy ước: 8 hướng mỗi hướng 45°, tâm Bắc = 0° (Bắc: 337,5° ≤ d < 22,5°); 24 sơn mỗi sơn 15°, tâm Tý = 0°.
"""
import pytest
from fastapi.testclient import TestClient

from app.calc import phongthuy as pt
from app.main import app


@pytest.mark.parametrize("do,huong", [(0, "Bắc"), (22.4, "Bắc"), (22.5, "Đông Bắc"), (45, "Đông Bắc"), (90, "Đông"),
                                      (135, "Đông Nam"), (180, "Nam"), (225, "Tây Nam"), (270, "Tây"),
                                      (315, "Tây Bắc"), (337.4, "Tây Bắc"), (337.5, "Bắc"), (359.9, "Bắc")])
def test_tam_huong(do, huong):
    assert pt.huong_tu_do(do) == huong


def test_do_huong_day_du():
    r = pt.do_huong(182.0)
    assert r["huong"] == "Nam" and r["son_huong"] == "Ngọ"
    assert r["toa"] == "Bắc" and r["son_toa"] == "Tý" and r["do_toa"] == 2.0
    assert r["trach"]["quai"] == "Khảm" and r["trach"]["nhom"] == "Đông tứ trạch"
    assert r["canh_bao"] is None


def test_canh_bao_ranh_gioi_va_kiem_huong():
    assert pt.do_huong(22.6)["canh_bao"] == "ranh_gioi_8_huong"     # sát ranh Bắc/Đông Bắc (±1°)
    assert pt.do_huong(187.5)["canh_bao"] == "khong_vong"           # đúng ranh hai sơn Ngọ/Đinh
    assert pt.do_huong(185.0)["canh_bao"] == "kiem_huong"           # lệch tâm sơn > 3°


def test_chuan_hoa_goc():
    assert pt.do_huong(360.0)["huong"] == "Bắc" and pt.do_huong(-90)["huong"] == "Tây"


def test_api_do_huong_kem_du_nien():
    c = TestClient(app)
    r = c.post("/v1/phongthuy/do-huong", json={"do_huong": 135, "sinh": {"birth_year": 1990, "gender": "nam"}})
    assert r.status_code == 200
    d = r.json()
    assert d["huong"] == "Đông Nam" and d["son_huong"] == "Tốn"
    assert d["du_nien"]["du_nien"] == "Sinh Khí" and d["du_nien"]["cat"] is True   # Khảm: Đông Nam = Sinh Khí
    # Hướng Đông Nam là Sinh Khí của mệnh Khảm, nhưng nhà toạ Tây Bắc = Càn trạch (Tây tứ) → khác nhóm.
    assert d["trach"]["quai"] == "Càn" and d["hop_nhom"] is False
    r2 = c.post("/v1/phongthuy/do-huong", json={"do_huong": 400})
    assert r2.status_code == 422
    assert "du_nien" not in c.post("/v1/phongthuy/do-huong", json={"do_huong": 10}).json()
