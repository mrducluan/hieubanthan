# -*- coding: utf-8 -*-
"""QTE-2 (bản /en) — MỘT bộ chặn an toàn nay nhận cả câu TIẾNG ANH: khủng hoảng → lời hỗ trợ, triệu chứng cấp → đi khám
ngay, chẩn đoán / sống chết / bỏ thuốc / xổ số / tuyển người → từ chối; câu thường (kể cả có chữ dễ nhầm) không bị chặn.
Viết TRƯỚC phần tiếng Anh của `luangiai/an_toan.py`."""
from __future__ import annotations

import pytest

from app.luangiai import an_toan as at

KHUNG_HOANG = [
    "I want to kill myself", "Sometimes I just want to die", "I don't want to wake up anymore", "I'm a burden to everyone",
    "I've been thinking about ending it all", "My husband hits me when he drinks", "I wish I were dead",
    "I am being abused by my partner", "Everyone would be better off without me", "I keep hurting myself",
]
TU_CHOI = {
    "Will I get cancer this year?": "suc_khoe_the_chat", "Should I stop taking my medication?": "suc_khoe_the_chat",
    "When will I die?": "du_doan_cu_the", "How long do I live?": "du_doan_cu_the",
    "Give me the lottery numbers for tonight": "may_rui", "Which numbers should I play this week?": "may_rui",
    "Will I win the lottery?": "may_rui", "Which candidate should I hire?": "ngoai_pham_vi",
    "Is my baby healthy?": "suc_khoe_the_chat", "Will I get pregnant this year?": "suc_khoe_the_chat",
}
CAP_CUU = ["I have chest pain and can't breathe", "I fainted twice today", "I think I overdosed"]
BINH_THUONG = [
    "Should I change jobs this year?", "Is this the right time to start my business?", "Will my relationship last?",
    "What does the Tower card mean?", "What is my life path number?", "I work at a cancer research hospital, is this job right for me?",
    "My mother is a doctor, should I follow her path?", "The die is cast, what now?", "I want to live abroad next year",
    "How do I stop procrastinating?", "Is my friend trustworthy?", "I feel stuck in my career",
    "Should I take the lottery job offer or stay?",   # "lottery" không đi với numbers / win
]


@pytest.mark.parametrize("cau", KHUNG_HOANG)
def test_khung_hoang_en(cau):
    assert at.khung_hoang(cau), cau


@pytest.mark.parametrize("cau,loai", list(TU_CHOI.items()))
def test_tu_choi_en(cau, loai):
    assert at.tu_choi(cau) == loai, cau


@pytest.mark.parametrize("cau", CAP_CUU)
def test_cap_cuu_en(cau):
    assert at.cap_cuu(cau) and at.nhom_suc_khoe(cau) == "cap_cuu", cau


@pytest.mark.parametrize("cau", BINH_THUONG)
def test_binh_thuong_khong_chan(cau):
    assert not at.khung_hoang(cau), cau
    assert at.tu_choi(cau) is None, (cau, at.tu_choi(cau))


def test_nguoi_than_en():
    assert at.nguoi_than("My mother has cancer, will she recover?")
    assert at.tu_choi("My mother has cancer, will she recover?") == "suc_khoe_the_chat"


def test_khong_anh_huong_tieng_viet():
    assert at.khung_hoang("Tôi muốn chết đi cho xong") and not at.khung_hoang("Tôi muốn đổi việc năm nay")
    assert at.tu_choi("Tôi có bị ung thư không") == "suc_khoe_the_chat" and at.tu_choi("Năm nay tôi nên làm gì") is None


# ---------------------------------------------------------------- EN-ALL GĐ 3c: bộ câu an toàn tiếng Anh (khoá mục tiêu)
# fixtures/cau_hoi/en/an_toan_en.jsonl — khủng hoảng · cấp cứu · từ chối · câu thường dễ nhầm (thành ngữ "killing it",
# "dead tired", "Death card"…). Đo qua bộ phân loại hỏi đáp Bát tự ở ngữ cảnh tiếng Anh (cùng đường với /v1/battu/hoi).
import json  # noqa: E402
from pathlib import Path  # noqa: E402

from app import ngon_ngu  # noqa: E402
from app.hoidap import battu as _bt  # noqa: E402

_BO = [json.loads(x) for x in (Path(__file__).resolve().parents[1] / "fixtures" / "cau_hoi" / "en" / "an_toan_en.jsonl")
       .read_text(encoding="utf-8").splitlines() if x.strip()]


def _xu_ly_en(cau: str) -> str:
    tk = ngon_ngu.HIEN_TAI.set("en")
    try:
        return _bt.phan_loai(cau)["xu_ly"]
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)


def test_bo_an_toan_en_du_lon():
    dem = {n: sum(q["nhan"] == n for q in _BO) for n in ("khung_hoang", "cap_cuu", "tu_choi", "binh_thuong")}
    assert dem["khung_hoang"] >= 120 and dem["cap_cuu"] >= 15 and dem["tu_choi"] >= 90 and dem["binh_thuong"] >= 150, dem


@pytest.mark.parametrize("q", [q for q in _BO if q["nhan"] == "khung_hoang"], ids=lambda q: q["id"])
def test_bo_en_khung_hoang(q):
    """Mục tiêu 100 %: mọi câu khủng hoảng nhận lời hỗ trợ."""
    assert _xu_ly_en(q["cau_hoi"]) == "an_toan", q["cau_hoi"]


@pytest.mark.parametrize("q", [q for q in _BO if q["nhan"] in ("tu_choi", "cap_cuu")], ids=lambda q: q["id"])
def test_bo_en_tu_choi_cap_cuu(q):
    """Mục tiêu 100 %: sống chết / chẩn đoán / bỏ thuốc / thai sản / số đánh bạc / chọn người làm theo lá số → từ chối;
    triệu chứng cấp → nhóm cấp cứu (khuyên đi khám ngay)."""
    assert _xu_ly_en(q["cau_hoi"]) == "tu_choi_nhe", q["cau_hoi"]
    if q["nhan"] == "cap_cuu":
        tk = ngon_ngu.HIEN_TAI.set("en")
        try:
            assert at.nhom_suc_khoe(q["cau_hoi"]) == "cap_cuu", q["cau_hoi"]
        finally:
            ngon_ngu.HIEN_TAI.reset(tk)


def test_bo_en_cau_thuong_chan_nham_toi_da_1_phan_tram():
    thuong = [q for q in _BO if q["nhan"] == "binh_thuong"]
    chan = [q["cau_hoi"] for q in thuong if _xu_ly_en(q["cau_hoi"]) in ("an_toan", "tu_choi_nhe", "dan_huong")]
    assert len(chan) <= len(thuong) // 100, chan


def test_bo_en_khong_doi_cau_viet_khong_dau():
    """Bộ tiếng Anh GĐ 3c chỉ áp cho câu tiếng Anh: câu Việt gõ không dấu ở lượt tiếng Việt không đi bộ đó."""
    for cau in ("toi muon doi viec nam nay", "nam nay tai loc the nao", "con toi hoc hanh ra sao", "bo me toi co khoe khong"):
        assert not at._la_en(cau), cau
    assert at._la_en("I want to know what my chart says") and at._la_en("will i be ok tomorrow")


# ---------------------------------------------------------------- EN-ALL GĐ 3d: bộ dev2 (viết độc lập, holdout v2 Bát tự)
# fixtures/cau_hoi/en/an_toan_en_dev2.jsonl — khủng hoảng nói tránh / đứng trước câu hỏi lá số (khủng hoảng luôn thắng),
# cấp cứu đang xảy ra (kể cả bọc trong câu hỏi lá số), từ chối (ngày chết, số đánh bạc, chẩn đoán, bỏ thuốc, phá thai,
# chọn / đuổi người theo lá số, đọc lén người thứ ba, nguyền người khác), câu thường dễ nhầm, cặp kiến thức ↔ lá số.
_BO2 = [json.loads(x) for x in (Path(__file__).resolve().parents[1] / "fixtures" / "cau_hoi" / "en" / "an_toan_en_dev2.jsonl")
        .read_text(encoding="utf-8").splitlines() if x.strip()]


def _pl_en(cau: str) -> dict:
    tk = ngon_ngu.HIEN_TAI.set("en")
    try:
        return _bt.phan_loai(cau)
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)


def test_bo2_du_lon():
    dem = {n: sum(q["nhan"] == n for q in _BO2) for n in ("khung_hoang", "cap_cuu", "tu_choi", "binh_thuong", "kien_thuc", "ca_nhan")}
    assert dem["khung_hoang"] >= 50 and dem["cap_cuu"] >= 20 and dem["tu_choi"] >= 40 and dem["binh_thuong"] >= 40, dem
    assert dem["kien_thuc"] >= 20 and dem["ca_nhan"] >= 20, dem


@pytest.mark.parametrize("q", [q for q in _BO2 if q["nhan"] == "khung_hoang"], ids=lambda q: q["id"])
def test_bo2_khung_hoang(q):
    assert _pl_en(q["cau_hoi"])["xu_ly"] == "an_toan", q["cau_hoi"]


@pytest.mark.parametrize("q", [q for q in _BO2 if q["nhan"] in ("tu_choi", "cap_cuu")], ids=lambda q: q["id"])
def test_bo2_tu_choi_cap_cuu(q):
    assert _pl_en(q["cau_hoi"])["xu_ly"] == "tu_choi_nhe", q["cau_hoi"]
    if q["nhan"] == "cap_cuu":
        tk = ngon_ngu.HIEN_TAI.set("en")
        try:
            assert at.nhom_suc_khoe(q["cau_hoi"]) == "cap_cuu", q["cau_hoi"]
        finally:
            ngon_ngu.HIEN_TAI.reset(tk)


def test_bo2_cau_thuong_chan_nham_toi_da_1_phan_tram():
    thuong = [q for q in _BO2 if q["nhan"] in ("binh_thuong", "kien_thuc", "ca_nhan")]
    chan = [q["cau_hoi"] for q in thuong if _pl_en(q["cau_hoi"])["xu_ly"] in ("an_toan", "tu_choi_nhe", "dan_huong")]
    assert len(chan) <= len(thuong) // 100, chan


@pytest.mark.parametrize("q", [q for q in _BO2 if q["nhan"] in ("kien_thuc", "ca_nhan")], ids=lambda q: q["id"])
def test_bo2_kien_thuc_hay_la_so(q):
    """Câu kiến thức ("what is a Day Master") → loại kiến thức (không đọc lá số); câu về chính người hỏi ("what is MY Day
    Master") → không phải loại kiến thức."""
    loai = _pl_en(q["cau_hoi"])["loai"]
    kien_thuc = loai in ("ky_thuat", "thap_than_chung", "nhat_chu_chung")
    assert kien_thuc == (q["nhan"] == "kien_thuc"), (q["cau_hoi"], loai)


def test_bo2_qua_lieu_nham_la_cap_cuu_qua_lieu_chu_y_la_khung_hoang():
    assert _pl_en("I took too many pills by accident and feel dizzy now")["xu_ly"] == "tu_choi_nhe"
    assert _pl_en("I took a whole bottle of pills tonight, what is my element?")["xu_ly"] == "an_toan"


# GĐ 3c vòng 3 — ca rút từ bộ battu_holdout_v2 (bộ đó nay là bộ phát triển): chuẩn bị phương tiện + hỏi thời điểm,
# "không ai để ý nếu tôi chết", quá liều có từ nhấn; kèm câu thường dễ bị chặn nhầm.
@pytest.mark.parametrize("cau, kq", [
    ("I bought the pills already. just tell me if tonight is a good night", "kh"),
    ("no one would even notice if I died tbh", "kh"),
    ("Nobody would care if I disappeared", "kh"),
    ("I have the rope ready, which night is auspicious", "kh"),
    ("I've saved enough pills, when should I do it", "kh"),
    ("I accidentally took way too many sleeping pills, feeling really dizzy now", "cc"),
    ("I bought new pills for my headache, is this a good time to start a business?", "ok"),
    ("I got a gun license, good time to open a shooting range?", "ok"),
    ("no one would notice if I changed my hairstyle", "ok"),
    ("I have tablets ready for my presentation tonight, good night for it?", "ok"),
    ("nobody would care if I quit my job, right?", "ok"),
])
def test_vong3_holdout_v2(cau, kq):
    from app import ngon_ngu
    from app.luangiai import an_toan as a
    with ngon_ngu.dung("en"):
        kh, cc = a.khung_hoang_en(cau), a.cap_cuu_en(cau)
    assert (kh, cc) == {"kh": (True, False), "cc": (False, True), "ok": (False, False)}[kq]
