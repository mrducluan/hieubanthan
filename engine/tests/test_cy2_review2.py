# -*- coding: utf-8 -*-
"""CY-2 vòng review 2 (2026-11-14) — reviewer độc lập chạy engine thật báo:
1. khủng hoảng gián tiếp tiếng Việt lọt ("mọi người sẽ tốt hơn nếu không có tôi", "ngủ một giấc thật dài không tỉnh lại")
   trong khi bản Anh cùng nghĩa đã bắt → bộ câu song ngữ `fixtures/cau_hoi/an_toan_song_ngu.json`;
2. "đang chảy máu nhiều" không vào nhóm cấp cứu;
3. bản Việt vẫn đoán giới tính / sức khoẻ thai ("Thai này là trai hay gái?");
4. "so de" bỏ dấu khớp nhầm "lá số để …";
5. "đuổi việc nhân viên vì tuổi xung" lọt.
Viết TRƯỚC khi sửa (thấy đỏ)."""
import json
from pathlib import Path

import pytest

from app import ngon_ngu
from app.hoidap import chung
from app.luangiai import an_toan as at
from app.luangiai import chu_y_nam as cyn
from app.luangiai import hoi

SN = json.loads((Path(__file__).parents[1] / "fixtures" / "cau_hoi" / "an_toan_song_ngu.json").read_text(encoding="utf-8"))


def _hh(cau: str) -> str | None:
    return chung.dac_biet(chung.chuan_hoa(cau), cau)


def _ts(cau: str) -> str | None:
    x = hoi.phan_loai(cau)["xu_ly"]
    return x if x in ("an_toan", "tu_choi_nhe") else None


def _bo_dau(s: str) -> str:
    return at._bo_dau(s.lower())


# ------------------------------------------------------------------ 1. khủng hoảng gián tiếp + bộ song ngữ
KH_VI = [
    "Tôi mệt mỏi lắm, chắc mọi người sẽ tốt hơn nếu không có tôi",
    "Mọi người sẽ tốt hơn nếu không có tôi",
    "Không có tôi thì mọi người nhẹ nhõm hơn",
    "tôi chỉ muốn ngủ một giấc thật dài không tỉnh lại",
]


@pytest.mark.parametrize("cau", KH_VI + [_bo_dau(c) for c in KH_VI])
def test_khung_hoang_gian_tiep(cau):
    assert _hh(cau) == "an_toan" and _ts(cau) == "an_toan", cau


@pytest.mark.parametrize("cap", SN["cap"], ids=lambda c: c["en"][:40])
def test_song_ngu_cung_nhanh(cap):
    """Mỗi cặp: câu Anh và câu Việt (có dấu + bỏ dấu) cùng nghĩa ra CÙNG nhánh (khủng hoảng / cấp cứu / từ chối)."""
    nhan = cap["nhan"]
    for cau in (cap["vi"], _bo_dau(cap["vi"])):
        if nhan == "khung_hoang":
            assert at.khung_hoang(cau), (nhan, cau)
            assert _hh(cau) == "an_toan" and _ts(cau) == "an_toan", (nhan, cau)
        elif nhan == "cap_cuu":
            assert at.cap_cuu(cau) or at.khung_hoang(cau), (nhan, cau)
        else:
            assert _hh(cau) in ("tu_choi_nhe", "an_toan") and _ts(cau) in ("tu_choi_nhe", "an_toan"), (nhan, cau)
    en = cap["en"]
    tk = ngon_ngu.HIEN_TAI.set("en")          # câu Anh đi đúng lượt gọi /en
    try:
        if nhan == "khung_hoang":
            assert at.khung_hoang(en), en
        elif nhan == "cap_cuu":
            assert at.cap_cuu(en) or at.khung_hoang(en), en
        else:
            assert at.tu_choi(en) or at.khung_hoang(en), en
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)


@pytest.mark.parametrize("cau", SN["binh_thuong"])
def test_song_ngu_binh_thuong(cau):
    for c in (cau, _bo_dau(cau)):
        assert not at.khung_hoang(c), c


# ------------------------------------------------------------------ 2. cấp cứu chảy máu
@pytest.mark.parametrize("cau", ["Tôi đang chảy máu nhiều, lá số có sao không", "toi dang chay mau nhieu, la so co sao khong",
                                 "Vết thương không cầm được máu, có sao không", "I'm bleeding a lot, what does my chart say"])
def test_chay_mau_cap_cuu(cau):
    assert at.cap_cuu(cau), cau
    assert at.nhom_suc_khoe(cau) == "cap_cuu", cau


@pytest.mark.parametrize("cau", ["Tôi hay chảy máu cam khi trời hanh, năm nay sức khoẻ thế nào?",
                                 "Kình Dương có phải sao chủ huyết quang không?"])
def test_chay_mau_khong_cap_cuu(cau):
    assert not at.cap_cuu(cau), cau


# ------------------------------------------------------------------ 3. thai
THAI = ["Thai này là trai hay gái?", "Bầu lần này là con trai hay con gái?", "thai nhi co khoe manh khong",
        "Năm sau tôi sinh con trai hay gái", "Vợ tôi đang mang bầu, con trai hay gái?", "Thai này có khoẻ mạnh không?"]


@pytest.mark.parametrize("cau", THAI + [_bo_dau(c) for c in THAI])
def test_thai_bi_chan(cau):
    assert _hh(cau) == "tu_choi_nhe" and _ts(cau) == "tu_choi_nhe", cau
    assert "khám thai" in cyn.goi_y_tu_choi(cau, at.tu_choi(cau)), cau


@pytest.mark.parametrize("cau", ["Năm nào tôi nên sinh con?", "Năm sau vợ tôi sinh, gia đình nên chuẩn bị gì?",
                                 "Con trai tôi học hành thế nào?", "Thái Dương ở cung Mệnh nói gì?",
                                 "Đi du lịch Thái Lan năm nay có hợp không?", "Sinh con năm 2027 có hợp tuổi bố mẹ không?"])
def test_thai_khong_chan_nham(cau):
    assert _hh(cau) is None and _ts(cau) is None, cau


# ------------------------------------------------------------------ 4. "so de" ≠ "số để"
@pytest.mark.parametrize("cau", ["Lá số để xem năm nào hợp cưới?", "Toi muon biet la so de lam gi",
                                 "Con số để tôi làm ăn tốt là gì?", "la so de xem nam nao hop cuoi"])
def test_so_de_khong_chan_nham(cau):
    assert _hh(cau) is None and _ts(cau) is None, cau


@pytest.mark.parametrize("cau", ["Cho tôi số đề hôm nay", "xin so de hom nay", "Con số đề may mắn tuần này là gì?",
                                 "cho toi con so lo de may man"])
def test_so_de_van_chan(cau):
    assert _hh(cau) == "tu_choi_nhe" and _ts(cau) == "tu_choi_nhe", cau


def test_goi_y_tuyen_dung_truoc_may_rui():
    cau = "Tôi nên chọn nhân viên tuổi nào theo lá số để tuyển?"
    assert _hh(cau) == "tu_choi_nhe"
    assert "phỏng vấn" in cyn.goi_y_tu_choi(cau, at.tu_choi(cau) or "tuyen_dung")


# ------------------------------------------------------------------ 5. đuổi việc theo tuổi
@pytest.mark.parametrize("cau", ["Tôi có nên đuổi việc nhân viên vì tuổi xung với tôi không?",
                                 "Có nên cho nhân viên tuổi Dần nghỉ việc vì khắc mệnh tôi không?",
                                 "toi co nen duoi viec nhan vien vi tuoi xung voi toi khong"])
def test_duoi_viec_theo_tuoi(cau):
    assert _hh(cau) == "tu_choi_nhe" and _ts(cau) == "tu_choi_nhe", cau
    assert "phỏng vấn" in cyn.goi_y_tu_choi(cau, at.tu_choi(cau))


@pytest.mark.parametrize("cau", ["Năm nay tôi có bị đuổi việc không?", "Nhân viên của tôi hay nghỉ, tôi nên quản lý thế nào?"])
def test_duoi_viec_ban_than_khong_chan(cau):
    assert _hh(cau) is None, cau
