"""Chặn tái phát ReDoS (CodeQL py/polynomial-redos, py/regex-injection — PR #279).

Mỗi route hỏi đáp nhận câu hỏi ≤ 500 ký tự. Gửi các chuỗi tấn công dài đúng trần (lặp ký tự / cụm mà regex lười hay
quay lui: chữ số, khoảng trắng, "a (", "a: ! ", năm…) ở cả bản Việt lẫn bản Anh: mỗi lượt phải trả lời dưới 2 giây.
Regex mới viết theo kiểu `\\s*X…`, `(.+?) \\((.+)\\)`, `\\d+\\w*`, hay ghép chữ người dùng vào mẫu mà không `re.escape`
sẽ làm test này chậm hẳn lên trước khi tới CodeQL.
"""
import time

import pytest
from fastapi.testclient import TestClient

from app.main import app

C = TestClient(app)
LA_SO = {"birth_date": "1990-05-17", "birth_time": "09:30", "gender": "nam"}

ROUTE = {
    "tuvi": ("/v1/tuvi/hoi", lambda q: {"la_so": LA_SO, "cau_hoi": q}),
    "battu": ("/v1/battu/hoi", lambda q: {"la_so": LA_SO, "cau_hoi": q}),
    "phongthuy": ("/v1/phongthuy/hoi", lambda q: {"cau_hoi": q, "sinh": {"birth_year": 1990, "gender": "nam"}}),
    "thanso": ("/v1/thanso/hoi", lambda q: {"ho_ten": ["Nguyen Van An"], "ngay": 17, "thang": 5, "nam": 1990, "cau_hoi": q}),
    "tarot": ("/v1/tarot/hoi", lambda q: {"cau_hoi": q}),
}

TRAN = {"thanso": 400}   # trần độ dài câu hỏi của từng route (khuôn Pydantic)


def _tan_cong() -> list[str]:
    hat = ["9", " ", "a ", "a (", "a (a", "a: ! ", "a: ! a (", "! (", "x, ", "2027 ", "born 1990 ", "faces n ",
           "45 degrees ", "a hoá ", "Lộc (", "\t", "e "]
    ra = []
    for h in hat:
        s = (h * (500 // len(h) + 1))[:497]
        ra += [s + "?", "I am " + s[:490], s[:496] + "!x"]
    return ra


@pytest.mark.parametrize("mang", sorted(ROUTE))
@pytest.mark.parametrize("ngon_ngu", ["vi", "en"])
def test_hoi_khong_cham_voi_chuoi_tan_cong(mang, ngon_ngu):
    url, than = ROUTE[mang]
    cham = []
    for q in _tan_cong():
        t0 = time.perf_counter()
        r = C.post(url, json=than(q[:TRAN.get(mang, 500)]), headers={"x-ngon-ngu": ngon_ngu})
        dt = time.perf_counter() - t0
        assert r.status_code == 200, (mang, r.status_code, r.text[:200])
        if dt > 2.0:
            cham.append((round(dt, 2), q[:30]))
    assert not cham, f"{mang}/{ngon_ngu}: câu hỏi tấn công chạy chậm {cham}"
