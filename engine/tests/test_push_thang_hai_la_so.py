# -*- coding: utf-8 -*-
"""Ý1 (HTT-2 mục 8) — thông báo đầu tháng "tháng này hai lá số cùng nói" (viết TRƯỚC hàm).

Chỉ GHÉP đúng hàm tháng của "Thời gian tới" (`thoi_gian_toi.gop_thang`: Tử vi = tháng âm chứa ngày 15, Bát tự = tháng
tiết chứa ngày 15, mức hộp chỉ khi hai lá số cùng mức) — một bộ tính, không chấm lại. Cùng mức → một câu + một việc;
khác mức → câu "hai lá số nhìn hai mặt" (mỗi môn nhìn một mặt, không chọn bên). Thiếu giờ sinh → không có thông báo.
Không dự báo, không doạ; đường dẫn trong site; không lưu gì.
"""
import datetime as dt
import json

from fastapi.testclient import TestClient

from app.calc import tuvi_an_sao as az
from app.luangiai import doi_song_khuon as kh
from app.luangiai import thang_hai_la_so as M
from app.luangiai import thoi_gian_toi as T
from app.main import app

client = TestClient(app)
SINH = dt.date(1990, 5, 15)
TV = {"ngay": SINH, "ti": az.time_index(8, 30), "gioi_tinh": "nam", "tz_lich": 7.0, "hoa_linh": "viet",
      "thang_nhuan": "thang_sau", "lich": "viet", "luu_nguyet": "dau_quan_thai_tue"}
BT = {"lich": dt.datetime(1990, 5, 15, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}
CAM = ("xui", "tai hoạ", "tai họa", "nguy hiểm", "hạn nặng", "giải hạn", "chết", "bệnh", "chắc chắn", "sẽ gặp", "điềm")


def _thang(ngay: dt.date):
    """Tháng dương chứa `ngay` theo đúng `gop_thang` của Thời gian tới (chuẩn so sánh)."""
    ts = T._thang_ts(SINH.day, SINH.month, ngay, 1)
    tv = T._tv_thang(TV, ngay, 1, None)
    bt = T._bt_thang(BT, ngay, 2)
    return T.gop_thang(ts, tv, bt, {ts[0]["thang"]: T.L.lop_thang(ngay.month, ngay.year, SINH, None, tu_ngay=ngay)})[0]


def test_thieu_la_so_khong_co_thong_bao():
    assert M.lap(SINH, dt.date(2026, 11, 1), "nam", None, None) is None
    assert M.lap(SINH, dt.date(2026, 11, 1), "nam", TV, None) is None
    assert M.lap(SINH, dt.date(2026, 11, 1), "nam", None, BT) is None


def test_khop_dung_hop_thang_cua_thoi_gian_toi_12_thang():
    """Mức (cùng / khác) và lời việc phải là của CHÍNH hộp tháng trong Thời gian tới — không chấm lại."""
    d = dt.date(2026, 11, 1)
    so_cung = 0
    for _ in range(12):
        chuan = _thang(d)
        r = M.lap(SINH, d, "nam", TV, BT)
        assert r is not None
        assert r["thang"] == f"{d.month}/{d.year}" and r["duong"].startswith("/thoi-gian-toi")
        assert r["muc"] == chuan.get("muc") and r["cung"] == (chuan.get("muc") is not None)
        if r["cung"]:
            so_cung += 1
            assert "Tử vi và Bát tự cùng thấy" in r["tieu_de"] and kh.NHAN_MUC[r["muc"]].lower() in r["tieu_de"]
            # việc nên làm = đúng việc của hộp tháng
            assert chuan.get("huong_xu_ly", "") in r["noi_dung"]
        else:
            assert "hai mặt" in r["tieu_de"]
            assert "Tử vi" in r["noi_dung"] and "Bát tự" in r["noi_dung"]
        s = json.dumps(r, ensure_ascii=False).lower()
        assert not any(c in s for c in CAM), [c for c in CAM if c in s]
        assert len(r["tieu_de"]) <= 80 and 40 <= len(r["noi_dung"]) <= 320
        d = dt.date(d.year + (d.month == 12), d.month % 12 + 1, 1)
    # 12 tháng không thể toàn một nhánh với lá số này (mức ba bậc, hai lá độc lập) — bảo đảm cả hai lời đều được kiểm
    assert 0 < so_cung < 12


def test_tat_dinh():
    a = M.lap(SINH, dt.date(2026, 11, 1), "nam", TV, BT)
    b = M.lap(SINH, dt.date(2026, 11, 1), "nam", TV, BT)
    assert a == b


def test_route():
    la_so = {"birth_date": "1990-05-15", "birth_time": "08:30", "gender": "nam", "noi_sinh": "ha-noi"}
    r = client.post("/v1/push/thang-hai-la-so", json={"ngay_xem": "2026-11-01", "nguoi": [
        {"la_so": la_so}, {"la_so": {**la_so, "do_tin_gio": "unknown"}}]})
    assert r.status_code == 200, r.text
    kq = r.json()["ket_qua"]
    assert len(kq) == 2 and kq[1] is None                      # không biết giờ → không đọc theo giờ tạm
    assert kq[0]["thang"] == "11/2026" and kq[0]["tieu_de"] and kq[0]["noi_dung"]
    assert kq[0]["duong"] == "/thoi-gian-toi#lg-muoi_hai_thang"
    # giống hệt gọi trực tiếp (một bộ tính)
    truc_tiep = M.lap(SINH, dt.date(2026, 11, 1), "nam", TV, BT)
    assert kq[0]["muc"] == truc_tiep["muc"] and kq[0]["tieu_de"] == truc_tiep["tieu_de"]
    assert client.post("/v1/push/thang-hai-la-so", json={"ngay_xem": "2026-11-01", "nguoi": [{"la_so": la_so}] * 201}).status_code == 422
    assert client.post("/v1/push/thang-hai-la-so", json={"ngay_xem": "2026-11-01", "nguoi": [], "x": 1}).status_code == 422
    # lá số lỗi (giờ sai) → phần tử null, không hỏng cả lượt
    r2 = client.post("/v1/push/thang-hai-la-so", json={"ngay_xem": "2026-11-01", "nguoi": [{"la_so": {**la_so, "birth_time": "25:00"}}, {"la_so": la_so}]})
    assert r2.status_code == 200 and r2.json()["ket_qua"][0] is None and r2.json()["ket_qua"][1] is not None
