# -*- coding: utf-8 -*-
"""EN-ALL GĐ 6 — hỏi đáp Kinh Dịch tiếng Anh: hiểu câu (`hoidap/en_gloss_kd`), định tuyến, an toàn (MỘT bộ chặn chung), câu
gợi ý / hỏi tiếp / hỏi lại, hai lượt "bản Việt quyết" cùng một quẻ. Câu ở đây do người viết test tự đặt (không lấy từ bộ
dev / holdout trong fixtures/cau_hoi/en)."""
import re

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.hoidap import en_gloss, en_gloss_kd, kinhdich as kd
from app.luangiai import kinhdich_doi_song as kd_ds, truc_quan
from app.main import app

HAO = [7, 8, 9, 7, 6, 8]
_VIET = re.compile(r"[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]", re.I)


@pytest.fixture
def en():
    tk = ngon_ngu.HIEN_TAI.set("en")
    yield
    ngon_ngu.HIEN_TAI.reset(tk)


def _pl(cau: str) -> dict:
    return kd.phan_loai(cau)


@pytest.mark.parametrize("cau,chu_de", [
    ("Should I take the new job offer at the agency?", "chuyen_viec"),
    ("Will my promotion come through this spring?", "thang_tien"),
    ("Thinking about opening a small cafe with my savings. Good idea?", "kinh_doanh"),
    ("My cousin borrowed 5k last year and never paid me back. Will I see that money again?", "tien_no"),
    ("Is it the right moment to buy our first home?", "mua_nha"),
    ("Will I pass the driving test next week?", "thi_cu"),
    ("My husband and I fight constantly. Is there a way to fix our marriage?", "hon_nhan_tt_nam"),
    ("Should I move overseas for work?", "di_xa"),
])
def test_chu_de_doi_song(en, cau, chu_de):
    pl = _pl(cau)
    assert pl["xu_ly"] == "tra_loi" and pl["loai"] in ("quyet_dinh", "du_doan"), pl
    assert kd_ds.chu_de_tu_cau(pl["cau_chuan_hoa"]) == chu_de, pl["cau_chuan_hoa"]


@pytest.mark.parametrize("cau,so,hao", [
    ("I cast and got hexagram 52 with line 3 changing. Thoughts on my move?", 52, 3),
    ("Drew 44 Gou about my ex. What now?", 44, None),
    ("The oracle gave me Wei Ji, Before Completion, for my project.", 64, None),
    ("Coins came out 9, 7, 7, 8, 8, 6 from the bottom. Which hexagram is that?", None, None),
])
def test_que_nguoi_hoi_da_gieo(en, cau, so, hao):
    pl = _pl(cau)
    q, h = en_gloss_kd.que_trong_cau(cau)
    assert pl["que_nhac"] and pl["que_nhac"] == q
    if so:
        assert q == so
    if hao:
        assert pl["hao_nhac"] == hao and hao in h


@pytest.mark.parametrize("cau", ["What is a nuclear hexagram?", "How do I phrase a question for the I Ching?",
                                 "What are the six relatives in Liu Yao?", "What does Hexagram 37 mean?",
                                 "Who wrote the I Ching?", "Is it okay to cast twice for the same question?"])
def test_cau_kien_thuc_khong_gieo(en, cau):
    pl = _pl(cau)
    assert pl["loai"] == "ky_thuat" and (pl.get("que_nhac") or pl.get("tu_dien") or pl.get("giai_thich")), pl


@pytest.mark.parametrize("cau,kieu,vai", [
    ("Does my girlfriend still have feelings for me?", "nguoi_kia", "nguoi_yeu"),
    ("When will I find a new job?", "khi_nao", "toi"),
    ("How should I talk to my teenage son about his grades?", "cach_lam", "con"),
    ("Should I accept the transfer my boss offered?", "co_nen", "sep"),
])
def test_kieu_va_vai(en, cau, kieu, vai):
    r = TestClient(app).post("/v1/kinhdich/hieu-cau", json={"cau_hoi": cau}, headers={"x-ngon-ngu": "en"}).json()
    assert r["kieu"] == kieu and r["vai"] == vai, r


def test_hai_lua_chon_lam_ro_truoc_khi_gieo(en):
    r = TestClient(app).post("/v1/kinhdich/hoi", json={"cau_hoi": "Should I buy or sell my apartment this year?"},
                             headers={"x-ngon-ngu": "en"}).json()
    assert r["can_them"] == ["lam_ro"] and r["que"] is None and not _VIET.search(r["cau_tra_loi"])


KHUNG_HOANG = [
    "I asked the coins whether I should stop living. Hexagram 23 came up.",
    "Splitting Apart again. Maybe I'm meant to leave this world.",
    "My son messaged a goodbye note and isn't picking up. Cast for him?",
    "Is my life worth anything? Ask the oracle.",
    "Nobody would notice if I disappeared. What does Kan say about that?",
]
CAP_CUU = [
    "My toddler is choking on a coin right now, what does the hexagram say?",
    "There's an intruder in our flat right now. Should I cast?",
    "My grandfather fell down the stairs and can't move his legs.",
]
TU_CHOI = [
    "Which horse will win the race on Saturday, I Ching?",
    "Use the I Ching to make my ex's business collapse.",
    "Diagnose my chest rash with a hexagram.",
]
BINH_THUONG = [
    "I'm tired of fighting with my landlord. Should I just move?",
    "Will our long-distance relationship make it?",
    "Should I stop living with my parents?",
    "Is it time to let go of my old shop?",
]


@pytest.mark.parametrize("cau", KHUNG_HOANG)
def test_khung_hoang(en, cau):
    assert _pl(cau)["xu_ly"] == "an_toan"


@pytest.mark.parametrize("cau", CAP_CUU)
def test_cap_cuu(en, cau):
    from app.luangiai import an_toan as at
    assert _pl(cau)["xu_ly"] == "tu_choi_nhe" and at.cap_cuu(cau)


@pytest.mark.parametrize("cau", TU_CHOI)
def test_tu_choi(en, cau):
    assert _pl(cau)["xu_ly"] == "tu_choi_nhe"


@pytest.mark.parametrize("cau", BINH_THUONG)
def test_khong_chan_nham(en, cau):
    assert _pl(cau)["xu_ly"] == "tra_loi"


def test_loi_nguy_hiem_dung_ngu_canh(en):
    """Nguy hiểm đang xảy ra → lời "đừng gieo quẻ, gọi cứu hộ" (không phải lời của phong thuỷ)."""
    c = TestClient(app)
    for cau in ("There's an intruder in our flat right now. Should I cast?", "I smell gas in the kitchen, cast a hexagram?"):
        r = c.post("/v1/kinhdich/hoi", json={"cau_hoi": cau}, headers={"x-ngon-ngu": "en"}).json()
        assert "feng shui" not in r["cau_tra_loi"].lower() and "emergency" in r["cau_tra_loi"].lower(), r["cau_tra_loi"]


def test_cau_goi_y_dau_dinh_tuyen(en):
    ds = truc_quan.goi_y_dau("kinhdich")
    assert 4 <= len(ds) <= 6 and len(set(ds)) == len(ds)
    for c in ds:
        assert not en_gloss.la_cau_viet(c) and all(ord(ch) < 128 for ch in c), c
        pl = _pl(c)
        assert pl["xu_ly"] == "tra_loi" and not pl.get("do_tin_thap") and kd_ds.chu_de_tu_cau(pl["cau_chuan_hoa"]) != "khac", c


def test_hoi_lai_va_hoi_tiep_chi_ban_anh():
    c = TestClient(app)
    than = {"cau_hoi": "zxcv lorem ipsum", "cach_ra_que": "gieo_tay", "gia_tri_hao": HAO}
    en_ = c.post("/v1/kinhdich/hoi", json=than, headers={"x-ngon-ngu": "en"}).json()
    assert en_["hoi_lai"] and len(en_["hoi_lai"]["chon"]) == 4
    tk = ngon_ngu.HIEN_TAI.set("en")
    try:
        for x in en_["hoi_lai"]["chon"]:
            assert not _pl(x).get("do_tin_thap"), x
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)
    ro = c.post("/v1/kinhdich/hoi", json={**than, "cau_hoi": "Should I change jobs this year?"}, headers={"x-ngon-ngu": "en"}).json()
    assert not ro["hoi_lai"] and 1 <= len(ro["hoi_tiep"]) <= 3 and not any(_VIET.search(x) for x in ro["hoi_tiep"])
    vi = c.post("/v1/kinhdich/hoi", json={**than, "cau_hoi": "Tôi có nên đổi việc năm nay không?"}).json()
    assert "hoi_lai" not in vi and "hoi_tiep" not in vi


def test_hai_luot_cung_mot_que():
    """Máy gieo (không truyền sáu hào): lượt bản Việt (ghi quyết định) và lượt bản Anh đọc CÙNG một quẻ."""
    c = TestClient(app)
    for _ in range(3):
        r = c.post("/v1/kinhdich/hoi", json={"cau_hoi": "Will my job interview go well?"}, headers={"x-ngon-ngu": "en"}).json()
        ten = r["ten_hien"]["que_ten"][r["que"]["quai_ban"]["ten"]].split(" (")[0]
        assert ten in r["cau_tra_loi"], (ten, r["cau_tra_loi"][:300])
        assert not _VIET.search(r["cau_tra_loi"])


def test_cau_tieng_viet_o_ban_anh_nhu_ban_viet(en):
    cau = "Tôi có nên chuyển việc sang công ty mới không?"
    pl = _pl(cau)
    tk = ngon_ngu.HIEN_TAI.set("vi")
    try:
        vi = kd.phan_loai(cau)
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)
    assert {k: pl[k] for k in ("loai", "linh_vuc", "xu_ly")} == {k: vi[k] for k in ("loai", "linh_vuc", "xu_ly")}
