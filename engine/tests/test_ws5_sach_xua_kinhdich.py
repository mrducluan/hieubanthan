# -*- coding: utf-8 -*-
"""WS-5 — "Sách xưa nói gì về việc bạn hỏi": câu Tăng San Bốc Dịch theo chương ứng với việc. Câu là nguyên văn kho nguồn,
nằm đúng trong chương ghi kèm; việc nhạy cảm (sức khoẻ, con cái) không có câu; bản Anh cùng số câu."""
import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.kb import kinhdich_tra_loi_kb as kbt
from app.luangiai import sach_xua

NGUON = Path(__file__).parent.parent / "fixtures" / "nguon" / "tang_san_boc_dich.json"
VAN = "".join(t["van"] for t in json.loads(NGUON.read_text("utf-8"))["thien"])
NHOM = kbt._lay("sach_xua_viec", "nhom")


@pytest.mark.parametrize("ma", sorted(NHOM))
def test_cau_la_nguyen_van_trong_dung_chuong(ma):
    m = NHOM[ma]
    i = VAN.find(m["chuong"])
    assert i >= 0, m["chuong"]
    j = VAN.find(m["han"], i)
    assert j >= 0, (ma, m["han"])
    # câu nằm trong chương ấy: không vượt qua tiêu đề chương kế tiếp
    giua = VAN[i + len(m["chuong"]):j]
    assert not re.search(r"章第[一二三四五六七八九十百零又]+", giua), (ma, "câu nằm ở chương khác")
    assert m["y"].strip() and m["viec"]


def test_viec_hop_le_va_khong_dua_viec_nhay_cam():
    ma_viec = set(kbt._lay("dung_than_viec"))
    dung = [v for m in NHOM.values() for v in m["viec"]]
    assert set(dung) <= ma_viec and len(dung) == len(set(dung))
    for v in ("suc_khoe", "con_cai"):
        assert sach_xua.kinhdich(v) == []


def test_ban_anh_cung_so_cau_khong_chu_viet():
    viet = re.compile(r"[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]", re.I)
    for m in NHOM.values():
        for v in m["viec"]:
            vi = sach_xua.kinhdich(v)
            with ngon_ngu.dung("en"):
                en = sach_xua.kinhdich(v)
            assert len(en) == len(vi) == 1 and en[0]["han"] == vi[0]["han"]
            assert not viet.search(en[0]["ve"] + en[0]["y"] + en[0]["sach"]), en


def test_bai_doc_que_mang_cau_sach_theo_viec():
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    j = c.post("/v1/kinhdich/hoi", json={"cau_hoi": "Tôi đi Nhật làm việc có thuận không", "chu_de": "di_xa"}).json()
    s = json.dumps(j, ensure_ascii=False)
    assert "世爲出行人" in s and "Xuất hành" in s
