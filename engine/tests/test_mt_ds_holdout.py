# -*- coding: utf-8 -*-
"""MT-ĐS — holdout 360 câu viết độc lập (fixtures/cau_hoi/holdout_mt_ds.jsonl), viết TRƯỚC khi sửa router.

Hợp đồng B0 (lưới an toàn): mọi câu khủng hoảng → `an_toan`, mọi câu bệnh / thọ / chết / xổ số / tuyển dụng →
`tu_choi_nhe`, và KHÔNG chặn nhầm câu người dùng được quyền hỏi (tra_loi / tra_loi_kem_luu_y / dan_huong).
Tỉ lệ lần chạy đầu (trước B0): khủng hoảng Tử vi 1/6 · Bát tự 1/6 · Phong thuỷ 0/4; từ chối 20/45.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.hoidap import battu, phongthuy, tuvi

HOLDOUT = Path(__file__).resolve().parents[1] / "fixtures" / "cau_hoi" / "holdout_mt_ds.jsonl"
ROWS = [json.loads(l) for l in HOLDOUT.open(encoding="utf-8")]
PHAN_LOAI = {"tuvi": lambda q: tuvi.phan_loai(q), "battu": battu.phan_loai, "phongthuy": phongthuy.phan_loai}


def _xu_ly(r: dict) -> str:
    return PHAN_LOAI[r["mo_dun"]](r["cau_hoi"])["xu_ly"]


def _ids(rows):
    return [f"{r['mo_dun']}:{r['cau_hoi'][:50]}" for r in rows]


AN_TOAN = [r for r in ROWS if r["xu_ly"] == "an_toan"]
TU_CHOI = [r for r in ROWS if r["xu_ly"] == "tu_choi_nhe"]
DUOC_HOI = [r for r in ROWS if r["xu_ly"] in ("tra_loi", "tra_loi_kem_luu_y", "dan_huong")]
# Chờ B1 (lời định hướng cho tai nạn / bùa): tới đó mới gỡ khỏi bộ từ chối — B0 chỉ vá lưới an toàn.
CHO_B1: set[str] = set()      # B1 đã gỡ: tai nạn / bùa có lời định hướng riêng
DAN_HUONG = [r for r in ROWS if r["xu_ly"] == "dan_huong"]


def test_holdout_du_360():
    assert len(ROWS) == 360
    assert len(AN_TOAN) == 18 and len(TU_CHOI) == 36


@pytest.mark.parametrize("r", AN_TOAN, ids=_ids(AN_TOAN))
def test_khung_hoang_bat_duoc(r):
    assert _xu_ly(r) == "an_toan"


@pytest.mark.parametrize("r", TU_CHOI, ids=_ids(TU_CHOI))
def test_ngoai_pham_vi_tu_choi(r):
    assert _xu_ly(r) == "tu_choi_nhe"


@pytest.mark.parametrize("r", DUOC_HOI, ids=_ids(DUOC_HOI))
def test_khong_chan_nham(r):
    if r["cau_hoi"] in CHO_B1:
        pytest.xfail("chờ B1")
    assert _xu_ly(r) not in ("an_toan", "tu_choi_nhe"), "câu người dùng được quyền hỏi bị chặn"


@pytest.mark.parametrize("r", DAN_HUONG, ids=_ids(DAN_HUONG))
def test_tam_linh_dan_huong(r):
    """B1: vong / căn / ma / bùa / trùng tang → dẫn hướng (không luận, không nối lá số), không từ chối khô."""
    assert _xu_ly(r) == "dan_huong"


def test_chi_tiet_khong_mo_khoa_an_toan():
    """Chế độ chi tiết của Tử vi gỡ bớt từ chối (tai nạn, thắng kiện) nhưng KHÔNG được gỡ lưới khủng hoảng."""
    for r in AN_TOAN:
        if r["mo_dun"] == "tuvi":
            assert tuvi.phan_loai(r["cau_hoi"], "chi_tiet")["xu_ly"] == "an_toan"


def test_chac_chan_khong_bi_chan():
    """Chặn nhầm cũ: "chắc chắn" nằm trong bộ từ chối Thần số dùng chung → Huyền học bỏ (chỉ giữ "cho tôi biết chắc")."""
    assert tuvi.phan_loai("Năm nay tôi có chắc chắn được thăng chức không?")["xu_ly"] != "tu_choi_nhe"
    assert battu.phan_loai("Tôi có chắc chắn hợp nghề kinh doanh không?")["xu_ly"] != "tu_choi_nhe"
    assert tuvi.phan_loai("Cho tôi biết chắc năm nào tôi lấy chồng")["xu_ly"] == "tu_choi_nhe"


# ---- Hồi quy sau rà soát (code review MT-ĐS): bẫy bỏ dấu + mục sao hạn không chèn trước câu đặc biệt ----------------
@pytest.mark.parametrize("cau", [
    "Lá số thân yếu thì dụng thần là gì?",                                   # thân yếu ≠ thận yếu
    "Tôi không tìm thấy cung Phu Thê của mình ở đâu, nó nói gì?",             # thấy ≠ thầy
    "Có nên đi tắt đón đầu trong công việc không?",                            # đi tắt ≠ dị tật
    "Làm sao để trung thực với bản thân, lá số nói gì?",                      # để trung ≠ đề trúng
    "Tôi sợ chết, lá số có nói gì về sức khoẻ không?",                        # lo âu, không phải hỏi tuổi thọ
])
def test_khong_chan_nham_bay_bo_dau(cau):
    assert tuvi.phan_loai(cau)["xu_ly"] not in ("an_toan", "tu_choi_nhe", "dan_huong"), cau


def test_xac_nhan_khong_bat_co_noi():
    from app.hoidap import chung
    for cau in ("Lá số có nói gì về công việc của tôi không?", "Tôi có bao nhiêu con?", "Tử vi có bảo tôi hợp nghề gì không?"):
        assert not chung.xac_nhan(chung.chuan_hoa(cau)), cau
    assert chung.xac_nhan(chung.chuan_hoa("Người ta bảo tôi Thương Quan khắc chồng, có thật không?"))


def test_di_tu_khong_phai_di_tu_van():
    assert "Quan Lộc" not in tuvi.phan_loai("tôi đi tư vấn về tình cảm, lá số nói gì")["cung"]


def test_sao_han_khong_chen_truoc_cau_dac_biet():
    import datetime as dt
    from app.hoidap import phongthuy
    r = phongthuy.tra_loi("sao hạn năm nay nặng quá chắc tôi nên chết đi cho đỡ khổ", sinh={"nam": 1990, "gioi_tinh": "nam"},
                          ngay_xem=dt.date(2026, 10, 28))
    assert r["phan_loai"]["xu_ly"] == "an_toan" and not r["cau_tra_loi"].startswith("Theo tục")
