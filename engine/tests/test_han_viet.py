# -*- coding: utf-8 -*-
"""Test cho pipeline chuyển thể Hán/Trung → Tiếng Việt tự nhiên (`chuyen_ngu/han_viet.py`)."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from app.chuyen_ngu import han_viet


def _mock_goi(messages, **kw):
    sys_msg = messages[0]["content"]
    inp = json.loads(messages[1]["content"].removeprefix("INPUT:\n"))
    if "biên tập trưởng" in sys_msg:
        out = {}
        for k, v in inp.items():
            if "fail_kd" in k:
                out[k] = {"trung_thanh": 0.7, "tu_nhien": 0.8, "an_toan": True, "luong_cuc": False, "ghi_chu": "lưỡng cực mờ"}
            else:
                out[k] = {"trung_thanh": 0.95, "tu_nhien": 0.95, "an_toan": True, "luong_cuc": True, "ghi_chu": ""}
        return json.dumps(out, ensure_ascii=False)
    if "biên tập viên tiếng Việt đời thường" in sys_msg:
        return json.dumps(inp, ensure_ascii=False)
    # Lượt 1
    out = {}
    for k in inp:
        if "bad_cam" in k:
            out[k] = {
                "am": "Thử nghiệm",
                "nghia_sat": "Dịch sát thử nghiệm",
                "nature_meaning": "Bạn sẽ chắc chắn gặp điều này trong đời.",
                "manh": "Có điểm sáng khi chủ động.",
                "de_vap": "Dễ vội vàng khi gặp áp lực.",
                "loi_khuyen": "Hít sâu trước khi quyết định.",
            }
        else:
            out[k] = {
                "am": "Vi nhân trung hậu lão thành",
                "nghia_sat": "Làm người đôn hậu chín chắn",
                "nature_meaning": "Bạn có xu hướng giữ chữ tín và làm việc chắc tay thay vì chạy theo bề nổi.",
                "manh": "Khi nhóm rối, sự điềm tĩnh giúp mọi người tin tưởng và giao việc lớn cho bạn.",
                "de_vap": "Vì quen làm kỹ nên đôi lúc bạn chậm chốt khi hoàn cảnh đòi hỏi xoay nhanh.",
                "loi_khuyen": "Đặt một mốc giờ rõ ràng cho việc cần quyết nhanh trong hôm nay.",
            }
    return json.dumps(out, ensure_ascii=False)


def test_chuyen_han_viet_3_luot_va_kiem_dinh():
    muc = {
        "ok_1": {"han": "為人忠厚老成", "nguon": "tu_vi_dau_so_toan_thu", "linh_vuc": "tinh_net"},
        "bad_cam": {"han": "測試", "nguon": "tu_vi_dau_so_toan_thu", "linh_vuc": "tinh_net"},
        "fail_kd": {"han": "測試二", "nguon": "tu_vi_dau_so_toan_thu", "linh_vuc": "tinh_net"},
    }
    kq = han_viet.chuyen_han_viet(muc, goi=_mock_goi, kiem_dinh=True)
    assert kq["so"] == {"tong": 3, "qua": 1, "kiem_dinh": "dat"}
    assert "ok_1" in kq["ket_qua"]
    assert kq["ket_qua"]["ok_1"]["_trang_thai"] == "nhap_may"
    assert any(l["ma"] in ("cum_cam", "kiem_ai") for l in kq["loi"]["bad_cam"])
    assert any(l["ma"] == "kiem_dinh" for l in kq["loi"]["fail_kd"])


def test_kiem_han_viet_chan_thieu_va_nhay_cam():
    assert han_viet.kiem_han_viet({"am": "a"})[0]["ma"] == "thieu_truong"
    bad = {
        "am": "Test",
        "nghia_sat": "Test",
        "nature_meaning": "Dễ rơi vào cảnh chết sớm hoặc phá sản.",
        "manh": "Khá linh hoạt.",
        "de_vap": "Dễ nóng nảy.",
        "loi_khuyen": "Giữ bình tĩnh.",
    }
    mas = {l["ma"] for l in han_viet.kiem_han_viet(bad)}
    assert "cum_cam" in mas or "cam_tu_sach_ghi" in mas


def test_doc_sqlite_tam(tmp_path: Path):
    db = tmp_path / "sample.sqlite"
    con = sqlite3.connect(db)
    con.execute("CREATE TABLE rules (rule_id TEXT, book_code TEXT, text_zh_hant TEXT, translation_vi TEXT)")
    con.execute("INSERT INTO rules VALUES ('r1', 'b1', '為人忠厚', NULL)")
    con.execute("INSERT INTO rules VALUES ('r2', 'b1', '已翻譯', 'Đã dịch')")
    con.commit()
    con.close()

    rows = han_viet.doc_sqlite(db, "rules", limit=10)
    assert list(rows.keys()) == ["r1"]
    assert rows["r1"]["han"] == "為人忠厚"
    assert rows["r1"]["nguon"] == "b1"
