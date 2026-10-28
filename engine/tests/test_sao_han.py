# -*- coding: utf-8 -*-
"""MT-ĐS B3 — sao hạn Cửu Diệu + Bát hạn theo tuổi mụ (tập quán Việt). Test viết TRƯỚC hàm.

Bảng đối chiếu 8 nguồn (lịch vạn niên, trang xem sao hạn phổ biến — xem docs/MA-TRAN-CAU-HOI-DOI-SONG.md mục 5):
- Cửu Diệu chu kỳ 9 từ tuổi 10. Nam: La Hầu, Thổ Tú, Thuỷ Diệu, Thái Bạch, Thái Dương, Vân Hán, Kế Đô, Thái Âm,
  Mộc Đức. Nữ: Kế Đô, Vân Hán, Mộc Đức, Thái Âm, Thổ Tú, La Hầu, Thái Dương, Thái Bạch, Thuỷ Diệu.
- Bát hạn: thứ tự nam Huỳnh Tuyền, Tam Kheo, Ngũ Mộ, Thiên Tinh, Toán Tận, Thiên La, Địa Võng, Diêm Vương (từ 10);
  nữ Toán Tận, Thiên Tinh, Ngũ Mộ, Tam Kheo, Huỳnh Tuyền, Diêm Vương, Địa Võng, Thiên La. KHÔNG lặp mỗi 8 tuổi —
  tục Việt lặp chu kỳ 9, tuổi tròn chục mang cùng hạn với tuổi x9 trước (19–20, 29–30…).
"""
import json

import pytest
from fastapi.testclient import TestClient

from app.calc import tuoi_dan_gian as t
from app.luangiai import tuoi_dan_gian as L
from app.main import app

client = TestClient(app)
# Ô mẫu từ nguồn ngoài (sao, hạn).
MAU = [("nam", 25, "Kế Đô", "Địa Võng"), ("nam", 40, "Thái Bạch", "Thiên Tinh"), ("nu", 33, "La Hầu", "Diêm Vương"),
       ("nu", 48, "Mộc Đức", "Tam Kheo"), ("nam", 60, "Vân Hán", "Thiên La"), ("nu", 71, "Thái Bạch", "Thiên La")]
CAM = ("chết", "tang", "tai nạn", "bệnh", "ung thư", "đại kỵ", "số đèn", "ngọn đèn", "bài khấn", "văn khấn", "hướng lễ",
       "ngày cúng", "cúng vào", "dâng sao", "vật phẩm", "đeo", "bùa", "giải hạn", "xui", "tai hoạ", "tai họa", "mất mạng")


@pytest.mark.parametrize("gioi, tuoi, sao, han", MAU)
def test_o_mau_doi_chieu(gioi, tuoi, sao, han):
    assert t.sao_han(tuoi, gioi) == sao
    assert t.bat_han(tuoi, gioi) == han


def test_cuu_dieu_bang_10_18():
    assert [t.sao_han(x, "nam") for x in range(10, 19)] == ["La Hầu", "Thổ Tú", "Thuỷ Diệu", "Thái Bạch", "Thái Dương",
                                                              "Vân Hán", "Kế Đô", "Thái Âm", "Mộc Đức"]
    assert [t.sao_han(x, "nu") for x in range(10, 19)] == ["Kế Đô", "Vân Hán", "Mộc Đức", "Thái Âm", "Thổ Tú", "La Hầu",
                                                             "Thái Dương", "Thái Bạch", "Thuỷ Diệu"]
    assert t.sao_han(19, "nam") == t.sao_han(10, "nam") == t.sao_han(82, "nam")       # chu kỳ 9


def test_bat_han_chu_ky_9_tron_chuc():
    assert [t.bat_han(x, "nam") for x in range(10, 18)] == ["Huỳnh Tuyền", "Tam Kheo", "Ngũ Mộ", "Thiên Tinh", "Toán Tận",
                                                              "Thiên La", "Địa Võng", "Diêm Vương"]
    assert [t.bat_han(x, "nu") for x in range(10, 18)] == ["Toán Tận", "Thiên Tinh", "Ngũ Mộ", "Tam Kheo", "Huỳnh Tuyền",
                                                             "Diêm Vương", "Địa Võng", "Thiên La"]
    # 19 và 20 cùng hạn, 29 và 30 cùng hạn… (dãy nguồn: Tam Kheo nam 11, 19, 20, 28, 37, 46, 55, 64, 73, 82, 91)
    assert [x for x in range(10, 95) if t.bat_han(x, "nam") == "Tam Kheo"] == [11, 19, 20, 28, 37, 46, 55, 64, 73, 82, 91]
    assert [x for x in range(10, 90) if t.bat_han(x, "nam") == "Ngũ Mộ"] == [12, 21, 29, 30, 38, 47, 56, 65, 74, 83]
    assert [x for x in range(10, 90) if t.bat_han(x, "nam") == "Diêm Vương"] == [17, 26, 35, 44, 53, 62, 71, 79, 80, 88]


def test_duoi_10_tuoi_khong_tinh():
    assert t.sao_han(9, "nam") is None and t.bat_han(5, "nu") is None


def _sach(o) -> None:
    """Mọi chữ trừ mục hỏi đáp (mục ấy phải nhắc "dâng sao / giải hạn" để nói rõ lập trường GHPGVN)."""
    o = {k: v for k, v in o.items() if k != "hoi_dap"}
    s = json.dumps(o, ensure_ascii=False).lower()
    assert not [c for c in CAM if c in s], [c for c in CAM if c in s]


def test_luan_theo_tuoi():
    kq = L.sao_han_luan(2026, 1990, "nam")
    assert kq["tuoi_mu"] == 37 and kq["sao"]["ten"] == "La Hầu" and kq["han"]["ten"] == "Tam Kheo"
    assert kq["sao"]["nghia"] and len(kq["sao"]["viec"]) == 3 and kq["sao"]["tu_soi"].endswith("?")
    assert "tập quán" in kq["cau_co_dinh"] and "không hướng dẫn nghi lễ" in kq["cau_co_dinh"]
    assert kq["kim_lau"] and kq["tam_tai"] is None            # cờ dân gian cùng năm (đọc lại calc, không tính thêm)
    assert "La Hầu" in kq["tra_loi_nhanh"]
    _sach(kq)


def test_bang_theo_nam():
    kq = L.sao_han_nam(2027)
    assert kq["nam"] == 2027 and len(kq["ds"]) == 46 and {x["nam_sinh"] for x in kq["ds"]} >= {1960, 2005}
    o = next(x for x in kq["ds"] if x["nam_sinh"] == 1990)
    assert o["tuoi_mu"] == 38 and o["nam"] == "Thổ Tú" and o["nu"] == "Vân Hán"
    assert len(kq["sao"]) == 9 and all(s["nghia"] and s["viec"] for s in kq["sao"])
    assert any("Phật giáo" in h["dap"] for h in kq["hoi_dap"])     # "có cần cúng không" → GHPGVN 2019
    _sach(kq)


def test_api():
    r = client.get("/v1/tuoi/sao-han/2027")
    assert r.status_code == 200 and r.json()["ds"]
    r = client.post("/v1/tuoi/sao-han", json={"nam": 2026, "nam_sinh": 1990, "gioi_tinh": "nu"})
    assert r.status_code == 200 and r.json()["sao"]["ten"] == "Kế Đô"
    assert client.post("/v1/tuoi/sao-han", json={"nam": 2026, "nam_sinh": 2020, "gioi_tinh": "nam"}).status_code == 200
    assert client.post("/v1/tuoi/sao-han", json={"nam": 2026, "nam_sinh": 2020, "gioi_tinh": "nam"}).json()["sao"] is None
    assert client.post("/v1/tuoi/sao-han", json={"nam": 2026, "nam_sinh": 1990, "gioi_tinh": "x"}).status_code == 422
