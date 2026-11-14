# -*- coding: utf-8 -*-
"""2026-11-14 (chủ dự án quyết) — bộ chặn an toàn CÓ ÍCH, cặp bản Việt ↔ bản Anh:

- câu về người cùng làm ăn (đối tác, nhà đầu tư, chủ nhà…) có trung thực / đáng tin / lừa không → không bị chặn;
- "nhân viên của tôi có trung thực không" (một người, không chọn / loại) → không bị chặn;
- tuyển / sa thải / xếp hạng người làm thuê theo lá số → vẫn chặn, nhưng lời từ chối có việc nên làm;
- đoán giới tính thai / có thai chưa → chặn ở CẢ hai bản, kèm lời nhắc lịch khám thai;
- khủng hoảng có hành vi đã xảy ra (đã uống cả lọ thuốc…) → câu gọi cấp cứu đứng ĐẦU, ở mọi mảng;
- Thần số dẫn hướng câu tâm linh như 4 mảng Huyền học.
"""
import pytest
from fastapi.testclient import TestClient

from app.hoidap import chung
from app.luangiai import an_toan as at
from app.luangiai import chu_y_nam as cyn
from app.main import app

C = TestClient(app)
LA = {"birth_date": "1990-05-17", "birth_time": "09:30", "gender": "nam"}
ROUTE = {
    "tuvi": ("/v1/tuvi/hoi", lambda q: {"la_so": LA, "cau_hoi": q}),
    "battu": ("/v1/battu/hoi", lambda q: {"la_so": LA, "cau_hoi": q}),
    "phongthuy": ("/v1/phongthuy/hoi", lambda q: {"cau_hoi": q, "sinh": {"birth_year": 1990, "gender": "nam"}}),
    "kinhdich": ("/v1/kinhdich/hoi", lambda q: {"cau_hoi": q}),
    "thanso": ("/v1/thanso/hoi", lambda q: {"ho_ten": ["Nguyen Van An"], "ngay": 17, "thang": 5, "nam": 1990, "cau_hoi": q}),
    "tarot": ("/v1/tarot/hoi", lambda q: {"cau_hoi": q}),
}


def _hoi(mang: str, q: str, nn: str) -> dict:
    url, than = ROUTE[mang]
    r = C.post(url, json=than(q), headers={"x-ngon-ngu": nn})
    assert r.status_code == 200, r.text[:200]
    return r.json()


def _xu_ly(j: dict) -> str | None:
    return (j.get("phan_loai") or {}).get("xu_ly") or j.get("xu_ly")


def _chan(q: str, nn: str | None = None) -> str | None:
    """Bộ chặn chung; câu tiếng Anh xét trong ngữ cảnh lượt gọi tiếng Anh (như route `/en`)."""
    from app import ngon_ngu
    nn = nn or ("vi" if any(c in q for c in "ăâđêôơưàáảãạ") or q.startswith(("toi ", "con ")) else "en")
    with ngon_ngu.dung(nn):
        return chung.dac_biet(chung.chuan_hoa(q), q)


# ------------------------------------------------------------------ người cùng làm ăn: luôn được trả lời
LAM_AN = [
    ("Đối tác của tôi có trung thực không?", "Is my business partner honest with me?"),
    ("Đối tác có lừa tôi không?", "Will my co-founder betray me?"),
    ("Nhà đầu tư này có đáng tin không?", "Can I trust this investor?"),
    ("Người góp vốn có ôm tiền bỏ trốn không?", "Is my supplier going to cheat me?"),
    ("Chủ nhà có giữ chữ tín không, có lừa tiền cọc không?", "Is my landlord honest about the deposit?"),
    ("Khách hàng này có quỵt nợ không?", "Will this client scam me?"),
]


@pytest.mark.parametrize("vi,en", LAM_AN)
def test_nguoi_lam_an_khong_bi_chan(vi, en):
    for q in (vi, en):
        assert _chan(q) is None, q
        assert at.tu_choi(q) is None and not at.khung_hoang(q), q
        assert at.nguoi_lam_an(chung.chuan_hoa(q), q), q


@pytest.mark.parametrize("vi,en", [("Nhân viên của tôi có trung thực không?", "Is my employee honest?"),
                                   ("Kế toán của tôi có ăn chặn tiền không?", "Is my accountant trustworthy?")])
def test_mot_nhan_vien_trung_thuc_khong_bi_chan(vi, en):
    for q in (vi, en):
        assert _chan(q) is None, q
        assert at.nguoi_lam_an(chung.chuan_hoa(q), q), q


# ------------------------------------------------------------------ vẫn chặn, nhưng lời có việc nên làm
CHAN_CO_ICH = [
    ("Có nên tuyển nhân viên tuổi Dần không?", "Should I hire him based on his bazi?", "tuyen_dung"),
    ("Trong 3 nhân viên ai trung thực nhất?", "Which of my employees is most honest?", "xep_hang"),
    ("Tôi sống được bao lâu?", "How long will I live?", "tuoi_tho"),
    ("Tôi có nên tự bỏ thuốc huyết áp không?", "Should I stop taking my antidepressants?", "thuoc_mo"),
    ("Giá vàng năm sau có tăng không?", "Will gold prices go up next year?", "dau_tu"),
]


@pytest.mark.parametrize("vi,en,nhom", CHAN_CO_ICH)
def test_tu_choi_kem_viec_nen_lam(vi, en, nhom):
    from app import ngon_ngu
    for q, nn in ((vi, "vi"), (en, "en")):
        assert _chan(q) == "tu_choi_nhe", q
        with ngon_ngu.dung(nn):
            gy = cyn.goi_y_tu_choi(q, at.tu_choi(q))
        assert gy, q
    j = _hoi("battu", vi, "vi")
    assert _xu_ly(j) == "tu_choi_nhe"
    assert cyn._GOI_Y_VI[nhom].split(" ")[0] in j["cau_tra_loi"], j["cau_tra_loi"]
    j = _hoi("battu", en, "en")
    assert _xu_ly(j) == "tu_choi_nhe"
    assert any(w in j["cau_tra_loi"] for w in ("interview", "Reconcile", "check", "doctor", "emergency fund")), j["cau_tra_loi"]


# ------------------------------------------------------------------ thai: chặn cả hai bản
THAI_VI = ["Con tôi trong bụng là trai hay gái?", "con toi trong bung la trai hay gai", "Tôi có thai chưa?",
           "Vợ tôi đang mang thai, là con trai hay con gái?", "Thai nhi có khoẻ không?"]
THAI_EN = ["Is my baby a boy or a girl?", "Am I pregnant?"]
THUONG = ["Sinh con năm nào hợp tuổi?", "Con trai tôi học hành thế nào?", "Khi nào tôi có con?", "Năm 2027 có nên sinh con không?",
          "Tôi uống cả lọ vitamin mỗi tháng có sao không?", "Uống thuốc ngủ có hại không?", "Tôi uống hết vỉ thuốc kháng sinh theo đơn rồi"]


@pytest.mark.parametrize("q", THAI_VI + THAI_EN)
def test_thai_bi_chan(q):
    assert _chan(q) == "tu_choi_nhe", q


def test_thai_ca_hai_ban_co_loi_kham_thai():
    j = _hoi("tarot", THAI_VI[0], "vi")
    assert _xu_ly(j) == "tu_choi_nhe" and "khám thai" in j["cau_tra_loi"]
    j = _hoi("tuvi", THAI_VI[0], "vi")
    assert "khám thai" in j["cau_tra_loi"]
    j = _hoi("tuvi", THAI_EN[0], "en")
    assert _xu_ly(j) == "tu_choi_nhe" and "antenatal" in j["cau_tra_loi"]


@pytest.mark.parametrize("q", THUONG)
def test_cau_thuong_khong_bi_chan(q):
    assert _chan(q) is None, q


# ------------------------------------------------------------------ khủng hoảng + cấp cứu: cấp cứu đứng đầu
CAP_CUU_VI = ["Tôi đã uống cả lọ thuốc ngủ", "toi da uong ca lo thuoc ngu", "Tôi vừa uống 30 viên thuốc ngủ, không muốn sống nữa",
              "Tôi đã cắt tay, máu chảy nhiều, không muốn sống nữa"]
CAP_CUU_EN = ["I want to die, I already took a whole bottle of pills", "I took a whole bottle of sleeping pills"]


@pytest.mark.parametrize("q", CAP_CUU_VI + CAP_CUU_EN)
def test_cap_cuu_ngay_nhan_dien(q):
    assert at.khung_hoang(q) and at.cap_cuu_ngay(q), q


def test_khung_hoang_khong_hanh_vi_giu_loi_cu():
    q = "Tôi không muốn sống nữa"
    assert at.khung_hoang(q) and not at.cap_cuu_ngay(q)
    assert at.loi_khung_hoang(q, "X") == "X"


@pytest.mark.parametrize("mang", sorted(ROUTE))
def test_cap_cuu_dung_dau_moi_mang(mang):
    j = _hoi(mang, CAP_CUU_VI[0], "vi")
    assert _xu_ly(j) == "an_toan"
    assert j["cau_tra_loi"].startswith("Gọi 115 ngay"), j["cau_tra_loi"][:120]
    j = _hoi(mang, CAP_CUU_EN[0], "en")
    assert _xu_ly(j) == "an_toan"
    t = j["cau_tra_loi"]
    assert t.startswith("Call emergency services now"), t[:120]
    for so in ("911", "999 (UK)", "000 (Australia)", "112 (EU)", "995 (Singapore)", "999 (Malaysia)", "111 (New Zealand)"):
        assert so in t
    assert "988" in t or "116 123" in t                       # lời hỗ trợ + đường dây hiện có vẫn theo sau


def test_cap_cuu_tieng_anh_khong_ghi_so_viet_nam():
    from app.kb import suc_khoe_kb
    from app import ngon_ngu
    with ngon_ngu.dung("en"):
        assert "115 in Vietnam" not in suc_khoe_kb.mau("cap_cuu")
    j = _hoi("tuvi", "I have chest pain and can't breathe", "en")
    assert "Vietnam" not in j["cau_tra_loi"] and "911" in j["cau_tra_loi"]


# ------------------------------------------------------------------ Thần số dẫn hướng tâm linh
def test_than_so_dan_huong_tam_linh():
    j = _hoi("thanso", "Nhà tôi có vong theo không?", "vi")
    assert _xu_ly(j) == "dan_huong"
    assert "không xem vong" in j["cau_tra_loi"]
    j = _hoi("thanso", "Nợ nghiệp của tôi là gì?", "vi")
    assert _xu_ly(j) != "dan_huong"
