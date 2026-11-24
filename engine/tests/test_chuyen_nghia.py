# -*- coding: utf-8 -*-
"""Kho chuyển nghĩa (2026-11-18): khái niệm sách xưa → nghĩa đời nay theo lĩnh vực; Kỳ Môn là mảng đầu tiên dùng.
Kiểm: đủ khuôn, lĩnh vực hợp lệ, câu sách khớp kho nguồn (bộ kiểm SX-C), lời không phán / không bày cách hại người,
nhận diện cụm từ đời nay tất định, Kỳ Môn trả lời sách xưa đọc cho ngày nay theo đúng lĩnh vực của việc."""
import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import ky_mon as km
from app.kb import chuyen_nghia as cn
from app.kb import sach_ghi as sg
from app.luangiai import ky_mon as doc
from app.main import app

DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
KB = json.loads((DATA / "chuyen_nghia_kb.json").read_text("utf-8"))
KM = json.loads((DATA / "ky_mon_kb.json").read_text("utf-8"))
LV = set(KB["linh_vuc"])
# Lời đời nay không được hiếu chiến / phán: cạnh tranh lành mạnh, không hứa thắng.
CAM = ("đánh bại", "tiêu diệt", "hạ gục", "triệt hạ", "chơi xấu", "bôi nhọ", "chắc chắn thắng", "chắc chắn", "bách chiến bách thắng",
       "đè bẹp", "trả thù", "báo thù", "sẽ thắng", "sẽ thành công", "phá sản")


def test_khuon_va_linh_vuc():
    assert len(LV) == 10 and {"kinh_doanh", "gia_dinh", "tien_bac", "cong_danh", "suc_khoe", "con_cai", "nghe_nghiep",
                              "hoc_hanh", "ke_hoach", "ca_nhan"} == LV
    assert KB["source_id"] and KB["school_id"]
    for ma, k in KB["khai_niem"].items():
        assert k["ten_co"] and k["nghia"] and k["sach"]["han"] and k["tu_hien_dai"], ma
        assert set(k["ung_dung"]) <= LV and len(k["ung_dung"]) >= 3, ma
        assert "kinh_doanh" in k["ung_dung"], ma         # mảng đầu tiên phục vụ: kinh doanh
    assert set(KB["ranh_gioi"]) - {"chung"} <= LV


def test_cau_sach_qua_bo_kiem():
    n, loi = sg.kiem_tep(DATA / "chuyen_nghia_kb.json")
    assert n == len(KB["khai_niem"]) + 1 and not loi, loi


def _chu(x):
    if isinstance(x, dict):
        for k, v in x.items():
            if k not in ("han", "am"):
                yield from _chu(v)
    elif isinstance(x, list):
        for v in x:
            yield from _chu(v)
    elif isinstance(x, str):
        yield x


def test_loi_khong_phan_khong_hieu_chien():
    cum_cam = json.loads((DATA / "tuvi_doi_song_kb.json").read_text("utf-8"))["cum_cam"]
    sat = {m["y"] for _, m in sg.cac_muc(KB) if m.get("sat")}            # SX-C3: nghĩa sát nguyên văn — luật riêng `kiem_sat`
    for t in _chu(KB):
        if t in sat:
            assert not sg.kiem_sat(t), t
            continue
        tl = t.lower()
        assert not [c for c in CAM if c in tl], t
        assert not [c for c in cum_cam if c in tl], t
        assert not sg.kiem_loi(t), (t, sg.kiem_loi(t))


@pytest.mark.parametrize("cau,ma", [
    ("Tháng này có nên mở rộng thị trường ra miền Trung không?", "chinh_thao"),
    ("Làm sao thắng đối thủ cạnh tranh?", "dau_tung"),
    ("Hôm nào ra mắt sản phẩm thì tốt", "thuong_thu"),
    ("Giờ nào hợp gặp nhà đầu tư", "kien_quy"),
    ("Tôi muốn đòi nợ khách", "ngu_liep"),
    ("Thị trường xấu nên giữ tiền thế nào", "thu_thanh"),
    ("Có nên giành lại thị phần đã mất", "gianh_lai"),
    ("Có nên dừng dự án đang lỗ", "ket_thuc"),
    ("Đào tạo nhân viên mới lúc nào", "tri_binh"),
])
def test_nhan_dien(cau, ma):
    assert ma in [x["ma"] for x in cn.nhan_dien(cau)]


def test_nhan_dien_cum_dai_truoc_va_tat_dinh():
    a = cn.nhan_dien("Có nên giành lại thị phần và bảo vệ thị phần không")
    assert [x["ma"] for x in a] == ["gianh_lai", "an_phuc"]
    assert a == cn.nhan_dien("Có nên giành lại thị phần và bảo vệ thị phần không")
    assert cn.nhan_dien("Hôm nay trời đẹp") == []


def test_doc_theo_linh_vuc():
    x = cn.doc("chinh_thao", "kinh_doanh")
    assert x["linh_vuc_ten"] == "Kinh doanh" and "thị trường" in x["hom_nay"]
    assert x["sach"]["han"] == "開門宜遠行征討所向通達" and "Không phải lời khuyên" not in x["ranh_gioi"] or x["ranh_gioi"]
    assert cn.doc("chinh_thao", "suc_khoe")["hom_nay"] is None    # khái niệm không bàn lĩnh vực ấy → không bịa


def test_ky_mon_moi_viec_tro_khai_niem_co_that():
    for ma, v in KM["viec"].items():
        assert v["khai_niem"] and set(v["khai_niem"]) <= set(KB["khai_niem"]), ma
        assert v["linh_vuc"] in LV, ma
        for k in v["khai_niem"]:
            assert v["linh_vuc"] in KB["khai_niem"][k]["ung_dung"], (ma, k)   # việc nào cũng có lời đời nay cho lĩnh vực của nó


def test_ky_mon_viec_kinh_doanh_tra_chuyen_nghia():
    b = km.lap_ban(dt.datetime(2026, 11, 18, 10, 30))
    for viec in ("mo_thi_truong", "ra_mat", "canh_tranh", "chinh_doi_ngu"):
        x = doc.doc_gio(b, viec)["viec"]
        assert x["chuyen_nghia"] and all(c["hom_nay"] for c in x["chuyen_nghia"])
        # Hướng chọn ra luôn có cửa nằm trong danh sách cửa của việc (không lấy cửa hung để "đánh nhau").
        if "cung" in x:
            h = next(h for h in doc.doc_gio(b, viec)["huong"] if h["cung"] == x["cung"])
            assert h["cua"]["ma"] in KM["viec"][viec]["cua"] and h["cua"]["ma"] not in ("kinh", "thuong", "tu")
    assert doc.doc_gio(b, "canh_tranh")["viec"]["nguyen_tac"]["sach"]["han"] == "從生擊死"


def test_route_viec_moi_va_danh_muc():
    c = TestClient(app)
    r = c.post("/v1/ky-mon/ban", json={"thoi_diem": "2026-11-18T10:30", "viec": "mo_thi_truong"})
    assert r.status_code == 200 and r.json()["doc"]["viec"]["chuyen_nghia"]
    dm = c.get("/v1/ky-mon/danh-muc").json()
    assert {x["ma"] for x in dm["chuyen_nghia"]} == set(KB["khai_niem"])
    assert {"mo_thi_truong", "ra_mat", "canh_tranh", "chinh_doi_ngu"} <= {x["ma"] for x in dm["viec"]}
    # BM-1: phần chuyển nghĩa không mang tên kho nguồn nội bộ (câu sách chỉ có chữ Hán, phiên âm, nghĩa)
    t = json.dumps(dm["chuyen_nghia"], ensure_ascii=False)
    assert "ky_mon_co_kim_do_thu" not in t and "nguon" not in t and "wikisource" not in t.lower()
