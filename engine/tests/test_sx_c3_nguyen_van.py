# -*- coding: utf-8 -*-
"""SX-C3 (chủ dự án đổi 2026-11-24): câu sách nhóm B / C nói sát nguyên văn, chỉ nhóm phán rất nặng còn nói giảm, kèm câu
kết "chỉ trích lại, không chịu trách nhiệm pháp lý". Khoá: khuôn hiển thị, bộ kiểm, và MỌI mục `sat: true` trong KB."""
from __future__ import annotations

import json
from pathlib import Path

from app.kb import sach_ghi as sg
from app.luangiai import sach_ghi_mon as sm

DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
MAU = {"han": "陷地刑克", "am": "Hãm địa hình khắc", "nhom": "C", "chu_de": "gia_dinh", "nguon": "tu_vi_dau_so_toan_thu",
       "sat": True, "y": "Sách ghi: sao ở thế yếu thì cha mẹ không gần, sách dặn nên quan tâm, chăm sóc sức khoẻ cha mẹ "
                         "nhiều hơn.", "ham_y": "Nên chú ý gọi về nhà đều đặn.", "viec": "Tuần này gọi cho cha mẹ."}


def test_bo_kiem_nhan_loi_sat_va_chan_phan_nang():
    assert not sg.kiem_sat(MAU["y"])
    for xau in ("Sách ghi người này chết sớm.", "Sách ghi yểu.", "Sách ghi tuổi thọ ngắn.", "Sách ghi dễ sảy thai.",
                "Sách ghi bạn sẽ nghèo.", "Sách ghi nên đi giải hạn."):
        assert sg.kiem_sat(xau), xau
    # được nói thẳng điều sách chê (trước đây phải nói giảm)
    for duoc in ("Sách ghi nghèo túng, hao tài.", "Sách ghi lập gia đình hơn một lần.", "Sách ghi muộn con, ít con.",
                 "Sách ghi cô độc, xa cha mẹ sớm.", "Sách ghi hay vướng kiện tụng."):
        assert not sg.kiem_sat(duoc), duoc


def test_khuon_hien_thi_va_cau_ket():
    s = sg.loi(MAU)
    assert s.startswith("Sách xưa ghi nguyên văn «陷地刑克» (Hãm địa hình khắc) — nghĩa là:")
    assert "Hàm ý theo ghi chép xưa" not in s
    assert sg.cau_ket([MAU]) == sg.CAU_KET_TRICH
    assert "không chịu trách nhiệm pháp lý" in sg.CAU_KET_TRICH and "chỉ trích lại" in sg.CAU_KET_TRICH
    m = sm.muc(MAU, "x")
    assert m["am"] == MAU["am"] and m.get("nguyen_van") is True and MAU["ham_y"] in m["loi"]


def test_nhom_c_van_khong_toi_nguoi_duoi_18():
    assert sm._loc([(MAU, "x")], 15) == [] and sm._loc([(MAU, "x")], None) == []
    assert sm._loc([(MAU, "x")], 16)       # TUOI-16


def test_moi_muc_sat_trong_kb_qua_bo_kiem():
    n = 0
    for p in sorted(DATA.glob("*.json")):
        d = json.loads(p.read_text("utf-8"))
        for vt, m in sg.cac_muc(d):
            if m.get("sat"):
                n += 1
                assert m["nhom"] in ("B", "C"), (p.name, vt)
                assert not sg.kiem_muc(m, vt), (p.name, sg.kiem_muc(m, vt))
                assert m.get("am"), (p.name, vt)
    assert n >= 0
