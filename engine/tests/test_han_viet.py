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


def test_doc_sqlite_allowlist_va_blocklist(tmp_path: Path):
    db = tmp_path / "sample.sqlite"
    con = sqlite3.connect(db)
    con.execute("CREATE TABLE rules (rule_id TEXT, source_code TEXT, text_zh_hant TEXT, translation_vi TEXT)")
    con.execute("INSERT INTO rules VALUES ('r1', 'BAZI_QLMG_HANS', '為人忠厚', NULL)")
    con.execute("INSERT INTO rules VALUES ('r2', 'BAZI_SKILL_MD', '現代筆記', NULL)")
    con.execute("INSERT INTO rules VALUES ('r3', 'FXF_NOTES_NEWTON', '現代註釋', NULL)")
    con.execute("INSERT INTO rules VALUES ('r4', 'BAZI_QLMG_HANS', '已翻譯', 'Đã dịch')")
    con.commit()
    con.close()

    rows = han_viet.doc_sqlite(db, "rules", limit=10)
    assert list(rows.keys()) == ["r1"]
    assert rows["r1"]["han"] == "為人忠厚"
    assert rows["r1"]["nguon"] == "BAZI_QLMG_HANS"

    # Explicit allow_sources overrides default
    rows_explicit = han_viet.doc_sqlite(db, "rules", limit=10, allow_sources=("BAZI_QLMG_HANS",))
    assert list(rows_explicit.keys()) == ["r1"]


def test_han_nang_va_uoc_luong():
    ok_item = {
        "am": "Thử",
        "nghia_sat": "Thử",
        "nature_meaning": "Bạn cần giữ nhịp ổn định hơn khi gặp biến động.",
        "manh": "Giúp bạn rèn sức bền trước thay đổi.",
        "de_vap": "Dễ mệt mỏi nếu gồng quá lâu.",
        "loi_khuyen": "Nghỉ ngơi đúng giờ trong tuần này.",
        "nhom": "A",
    }
    # Chữ Hán nặng (刑) không được gắn nhom="A"
    loi = han_viet.kiem_han_viet(ok_item, han_goc="刑剋孤寡")
    assert any(l["ma"] == "han_nang_sai_nhom" for l in loi)

    # Trong chuyen_han_viet, mục có chữ Hán nặng tự gắn cờ _can_duyet_nhom_c
    kq = han_viet.chuyen_han_viet(
        {"nang_1": {"han": "孤寡刑剋", "nguon": "BAZI_QLMG_HANS", "linh_vuc": "chung"}},
        goi=_mock_goi,
        kiem_dinh=True,
    )
    assert kq["ket_qua"]["nang_1"].get("_can_duyet_nhom_c") is True

    uoc = han_viet.uoc_luong_chi_phi({"a": {"han": "為人忠厚老成"}, "b": {"han": "天機入命"}}, kiem_dinh=True)
    assert uoc["so_muc"] == 2
    assert uoc["so_lo"] == 1
    assert uoc["so_luot"] == 3
    assert uoc["token_vao_uoc_luong"] > 0
    assert uoc["chi_phi_usd_uoc_luong"] >= 0


def test_kiem_han_viet_chan_loi_dau_va_nfd():
    import unicodedata
    sai_dau = {
        "am": "Thử nghiệm",
        "nghia_sat": "Dịch nghĩa cũa câu này",
        "nature_meaning": "Bạn củng cần giữ bình tĩnh.",
        "manh": "Sáng dạ.",
        "de_vap": "Dễ vội.",
        "loi_khuyen": "Nghỉ 5 phút.",
    }
    mas = {l["ma"] for l in han_viet.kiem_han_viet(sai_dau)}
    assert "loi_dau_viet" in mas

    nfd_item = {
        "am": unicodedata.normalize("NFD", "Thử nghiệm"),
        "nghia_sat": "Dịch sát nghĩa",
        "nature_meaning": "Giữ nhịp sống đều đặn.",
        "manh": "Kiên trì.",
        "de_vap": "Hơi chậm.",
        "loi_khuyen": "Đặt hẹn giờ.",
    }
    mas2 = {l["ma"] for l in han_viet.kiem_han_viet(nfd_item)}
    assert "unicode_nfd" in mas2
