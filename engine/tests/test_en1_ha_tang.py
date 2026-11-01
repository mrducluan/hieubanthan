# -*- coding: utf-8 -*-
"""EN-1 hạ tầng — ngày sinh ngoài 1900–2100 → 422 (trước: 500/503), thân gửi chunked bị đếm byte thật, mục lục KB
nhanh và không đổi kết quả, ngày mặc định theo giờ VN, giới hạn số Node chạy cùng lúc."""
import datetime as dt
import time

import pytest
from fastapi.testclient import TestClient

from app import config
from app.calc import tuvi_an_sao
from app.kb import trang
from app.main import app

client = TestClient(app, raise_server_exceptions=False)


@pytest.mark.parametrize("path,body", [
    ("/v1/battu/la-so", {"birth_date": "0001-01-01", "birth_time": "08:00", "gender": "nam", "noi_sinh": "ha-noi"}),
    ("/v1/tuvi/an-sao", {"birth_date": "2400-01-01", "birth_time": "08:00", "gender": "nam", "noi_sinh": "ha-noi"}),
    ("/v1/thoi-gian-toi", {"ngay_sinh": "1890-01-01", "ngay_xem": "2026-10-30"}),
])
def test_ngay_sinh_ngoai_khoang_422(path, body):
    assert client.post(path, json=body).status_code == 422


def test_than_chunked_qua_lon_413():
    def khuc():
        for _ in range(30):
            yield b"x" * 100_000                       # 3 MB > trần 2 MB, không có content-length
    r = client.post("/v1/hoi/dac-biet", content=khuc(), headers={"content-type": "application/json"})
    assert r.status_code == 413


def test_than_chunked_nho_van_qua():
    def khuc():
        yield b'{"cau_hoi": "'
        yield "năm nay thế nào".encode()
        yield b'"}'
    r = client.post("/v1/hoi/dac-biet", content=khuc(), headers={"content-type": "application/json"})
    assert r.status_code == 200 and r.json() == {"loai": None}


def test_muc_luc_kb_nhanh_va_on_dinh():
    a = trang.danh_sach()
    t = time.perf_counter()
    b = trang.danh_sach()
    assert a == b and len(a) >= 500
    assert time.perf_counter() - t < 0.5


def test_hom_nay_vn():
    vn = dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    assert config.hom_nay_vn() == vn


def test_gioi_han_node():
    assert tuvi_an_sao._NODE_TOI_DA._initial_value >= 1
