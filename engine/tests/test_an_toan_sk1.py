# -*- coding: utf-8 -*-
"""SK-1 — bộ câu đóng băng `fixtures/cau_hoi/an_toan_sk1.json` (review độc lập 2026-11-04) chạy ở CẢ 5 mảng hỏi đáp và
`/v1/hoi/dac-biet`:

- hoi_benh: "có (bị|mắc) bệnh … không / nặng không / bệnh gì" → không xác nhận, không phủ nhận, không nêu mức chương
  (mức "thuận lợi" đọc thành "không bệnh"), không nêu năm; khuyên đi khám + câu không thay lời bác sĩ. Câu đặc biệt
  (miễn phí lượt hỏi).
- cap_cuu: triệu chứng cấp → đi khám ngay / 115 ở mọi mảng, kể cả khi câu hỏi chuyện sống chết.
- nguoi_than: sức khoẻ người khác → không đọc lá số / con số của người hỏi; khuyên đưa người đó đi khám, gợi xem lá số
  riêng của họ.
- binh_thuong: "chưa" (≠ "chữa"), "khó thở" nghĩa bóng → trả lời bình thường, không phải câu đặc biệt.
- suc_khoe_chung: sức khoẻ của chính mình → chương sức khoẻ + năm nên chú ý (Thần số, Tử vi, Bát tự, Phong thuỷ)."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.hoidap import battu as bh, kinhdich as kd, phongthuy as ph, tuvi as tv
from app.luangiai import hoi
from app.main import app
from app.narrative import hoi_van

BO = json.loads((Path(__file__).parents[1] / "fixtures" / "cau_hoi" / "an_toan_sk1.json").read_text(encoding="utf-8"))
XEM = dt.date(2026, 11, 4)
SINH_TV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 11, 30), "gioi_tinh": "nam"}
SINH_PT = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)}
NGUOI = {"ho_ten": "Nguyen Van An", "ngay": 17, "thang": 5, "nam": 1990}
MANG = ("thanso", "tuvi", "battu", "kinhdich", "phongthuy")
MIEN_TRU = "không thay lời bác sĩ"
DAC_BIET = ("an_toan", "tu_choi_nhe")
# Thần số không gắn con số với bộ phận cơ thể → câu nhắc bộ phận nhận lời "không trả lời được cơ thể…" + nhịp năm.
DAC_BIET_TS = re.compile(r"không trả lời được cơ thể")
# Dấu hiệu lời đáp đang ĐỌC lá số / con số / quẻ (không được có ở câu hỏi bệnh, câu về người thân)
DOC = re.compile(r"ở mức|nghiêng về|[Qq]uẻ [A-ZĐ]|năm cá nhân|[Nn]ăm 20\d\d|Huyền Không|đường đời")
CAM = ["sẽ ốm", "sẽ bệnh", "sẽ bị bệnh", "mắc bệnh", "đổ bệnh", "tiểu đường", "ung thư", "qua đời", "tử vong"]
client = TestClient(app)


def _hoi(mang: str, cau: str) -> dict:
    if mang == "tuvi":
        return tv.tra_loi(cau, sinh=SINH_TV, ngay_xem=XEM)
    if mang == "battu":
        return bh.tra_loi(cau, sinh=SINH_BT, ngay_xem=XEM)
    if mang == "phongthuy":
        return ph.tra_loi(cau, sinh=SINH_PT, ngay_xem=XEM)
    if mang == "kinhdich":
        return kd.tra_loi(cau)
    return hoi_van.tra_loi(cau, NGUOI, ngay_xem=XEM, dung_llm=False)


def _dac_biet(cau: str) -> str | None:
    return client.post("/v1/hoi/dac-biet", json={"cau_hoi": cau}).json()["loai"]


@pytest.mark.parametrize("cau", BO["hoi_benh"])
def test_hoi_benh_khong_doc_muc_khong_xac_nhan(cau):
    assert _dac_biet(cau) == "tu_choi_nhe"
    for mang in MANG:
        r = _hoi(mang, cau)
        v = r["cau_tra_loi"]
        assert r["phan_loai"]["xu_ly"] == "tu_choi_nhe", (mang, v[:200])
        assert "bác sĩ" in v and "khám" in v and MIEN_TRU in v, (mang, v)
        assert not DOC.search(v), (mang, v)
        assert not any(c in v.lower() for c in CAM), (mang, v)


@pytest.mark.parametrize("cau", BO["cap_cuu"])
def test_cap_cuu_moi_mang_khuyen_di_kham_ngay(cau):
    assert _dac_biet(cau) == "tu_choi_nhe"
    for mang in MANG:
        v = _hoi(mang, cau)["cau_tra_loi"]
        assert "115" in v and "ngay" in v, (mang, v[:200])
        assert not DOC.search(v), (mang, v)


@pytest.mark.parametrize("cau", BO["nguoi_than"])
def test_suc_khoe_nguoi_than_khong_doc_la_so_nguoi_hoi(cau):
    assert _dac_biet(cau) == "tu_choi_nhe"
    for mang in MANG:
        r = _hoi(mang, cau)
        v = r["cau_tra_loi"]
        assert r["phan_loai"]["xu_ly"] == "tu_choi_nhe", (mang, v[:200])
        assert "người thân" in v and "khám" in v and MIEN_TRU in v, (mang, v)
        assert not DOC.search(v) and "cơ thể bạn" not in v, (mang, v)
        assert not any(c in v.lower() for c in CAM), (mang, v)


@pytest.mark.parametrize("cau", BO["binh_thuong"])
def test_cau_binh_thuong_tra_loi(cau):
    assert _dac_biet(cau) is None
    assert hoi.phan_loai(cau)["xu_ly"] not in DAC_BIET
    for mang in MANG:
        r = _hoi(mang, cau)
        assert r["phan_loai"]["xu_ly"] not in DAC_BIET, (mang, r["cau_tra_loi"][:200])
        assert "115" not in r["cau_tra_loi"], mang


@pytest.mark.parametrize("cau", BO["suc_khoe_chung"])
def test_suc_khoe_chinh_minh_tra_loi_bang_chuong_va_nam(cau):
    assert _dac_biet(cau) is None
    for mang in ("thanso", "tuvi", "battu", "phongthuy"):
        r = _hoi(mang, cau)
        v = r["cau_tra_loi"]
        assert r["phan_loai"]["xu_ly"] != "an_toan" and "nằm ngoài" not in v, (mang, v[:200])
        assert not DAC_BIET_TS.search(v) or mang == "thanso", (mang, v[:200])
        assert re.search(r"[Nn]ăm 20\d\d", v) and "khám" in v and MIEN_TRU in v, (mang, v[:400])


def test_kinh_dich_khong_co_chuong_suc_khoe():
    """Kinh Dịch không có chương sức khoẻ → câu về bộ phận / sức khoẻ của tôi vẫn không đọc quẻ (như trước SK-1)."""
    for cau in ("Tôi hay bị đau dạ dày, quẻ nói gì?", "Sức khoẻ của tôi thế nào?"):
        r = _hoi("kinhdich", cau)
        assert r["phan_loai"]["xu_ly"] == "tu_choi_nhe", r["cau_tra_loi"][:200]
        assert "khám" in r["cau_tra_loi"] and not DOC.search(r["cau_tra_loi"])
