# -*- coding: utf-8 -*-
"""EN-3b — đoạn mở đầu "trả lời trước" (`hoidap/mo_dau.py`): đoạn 1 nêu đúng điều được hỏi + mức / điều chính + một lý
do + một việc, dựng tất định từ gói bằng chứng; không lặp nguyên văn đoạn sau, không thuật ngữ trần, không trả lời có /
không cho quyết định lớn; câu khủng hoảng / từ chối / dẫn hướng không đổi."""
import datetime as dt
import re

import pytest

from app.hoidap import battu, kinhdich, mo_dau, phongthuy, tuvi
from app.luangiai.hoi import chuan_hoa_cau as ch
from app.narrative import hoi_van

XEM = dt.date(2026, 11, 1)
NGUOI = {"ho_ten": ["Nguyễn Thị Mai Anh"], "ngay": 17, "thang": 5, "nam": 1990, "quy_uoc": "tung_phan"}
SV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu"}
SB = {"lich": dt.datetime(1990, 5, 17, 12, 0), "gioi_tinh": "nu", "gio_ty": "da_ty"}
SP = {"nam": 1990, "gioi_tinh": "nu", "ngay": dt.date(1990, 5, 17), "moc_nam": "lap_xuan"}


def _hoi(md: str, cau: str) -> str:
    if md == "thanso":
        return hoi_van.tra_loi(cau, NGUOI, None, XEM, dung_llm=False)["cau_tra_loi"]
    if md == "tuvi":
        return tuvi.tra_loi(cau, "tham_khao", sinh=SV, ngay_xem=XEM)["cau_tra_loi"]
    if md == "battu":
        return battu.tra_loi(cau, sinh=SB, ngay_xem=XEM)["cau_tra_loi"]
    if md == "phongthuy":
        return phongthuy.tra_loi(cau, sinh=SP, ngay_xem=XEM)["cau_tra_loi"]
    return kinhdich.tra_loi(cau, "tu_dong", gia_tri_hao=[7, 8, 9, 7, 6, 8], thoi_diem=dt.datetime(2026, 11, 1, 9, 0),
                            cach_ra_que="gieo_tay")["cau_tra_loi"]


def _chuan(c: str) -> str:
    return " ".join(re.sub(r"[^\wÀ-ỹ ]", " ", c).lower().split())


# ------------------------------------------------------------ điều được hỏi (danh mục cố định)
@pytest.mark.parametrize("cau, ma", [
    ("Tôi tiêu xài tuỳ hứng, con số nói gì về chuyện giữ tiền?", "giu_tien"),
    ("Năm 2027 tôi có nên đổi việc không?", "doi_viec"),
    ("Mình kết hôn 7 năm chưa có con. Bát tự có nói gì về đường con cái không?", "con_cai"),
    ("Làm cách nào để tôi bớt nóng với đồng nghiệp?", "tinh_khi"),
    ("Mình đang làm kinh doanh, tôi có số xuất ngoại không?", "di_xa"),      # vế hoàn cảnh không phải điều hỏi
    ("Tôi hay bỏ cuộc, làm sao để kiên trì?", None),                        # "kiên trì" không phải "kiện"
    ("Tôi có đang che giấu con người thật không?", "tinh_cach"),             # "giấu" không phải "giàu"
    ("Thái Âm ở cung Mệnh nghĩa là gì?", None),                             # "Thái" không phải "thai"
    ("Chuyện tình cảm của tôi sao cứ dang dở hoài vậy?", "tinh_duyen"),      # "vậy" không phải "vay"
])
def test_dieu_hoi(cau, ma):
    d = mo_dau.dieu_hoi(ch(cau), cau)
    assert (d or {}).get("ma") == ma, (cau, d)


def test_dieu_hoi_uu_tien_chuong_cua_mang():
    t = "gia dinh noi ngoai co ho tro toi nhieu khong theo tu tru"
    assert mo_dau.dieu_hoi(t)["ma"] == "quy_nhan"
    assert mo_dau.dieu_hoi(t, None, "gia_dinh")["ma"] == "gia_dinh"


def test_dieu_hoi_chi_la_danh_muc_co_dinh():
    """Nhãn trong đoạn mở đầu luôn lấy từ danh mục — không bao giờ chép chữ người dùng."""
    nhan = {n for _, n, _, _ in mo_dau.DIEU_HOI}
    for cau in ("Tôi có nên cho em họ tên Hùng vay 50 triệu không?", "Số 0912345678 của tôi có hợp không?"):
        d = mo_dau.dieu_hoi(ch(cau), cau)
        assert d is None or d["nhan"] in nhan


# ------------------------------------------------------------ đặt lên đầu, không lặp
def test_dat_dau_bo_lap_va_doi_chi_tiet_xuong():
    van = "\n\n".join([
        "Tiền bạc — số 5 của bạn: Với tiền, số 5 thường kiếm nhanh tiêu nhanh, thích cơ hội mới. Gợi ý: Chỉ dùng một "
        "phần nhỏ định trước cho các khoản thử vận.",
        "Chân dung theo số chủ đạo 5 của bạn: thích tự do và trải nghiệm.",
        "Câu hỏi để tự soi: khoản nào bạn tiêu vì hứng?",
        "Đây là góc nhìn tham khảo văn hoá để bạn tự soi, không phải lời tiên đoán.",
    ])
    mo = ("Về chuyện giữ tiền: với tiền, số 5 thường kiếm nhanh tiêu nhanh, thích cơ hội mới. Việc nên làm: chỉ dùng "
          "một phần nhỏ định trước cho các khoản thử vận.")
    p = mo_dau.dat_dau(van, mo).split("\n\n")
    assert p[0] == mo
    assert p[1].startswith("Chân dung")                 # đoạn đã tóm trọn bị bỏ, đoạn kế lên thẳng sau mở đầu
    assert p[-2].startswith("Câu hỏi để tự soi") and p[-1].startswith("Đây là góc nhìn")
    assert len(p) == 4
    assert mo_dau.dat_dau(van, None) == van


def test_dat_dau_khong_dat_khi_co_so_la():
    goi = {"so_trong_goi": [5]}
    assert mo_dau.dat_dau("A b c.", "Về x: số 7 của bạn.", goi) == "A b c."
    assert mo_dau.dat_dau("A b c.", "Về x: số 5 của bạn.", goi).startswith("Về x")


# ------------------------------------------------------------ từng mảng
CAU_MANG = [
    ("thanso", "Tôi tiêu xài khá tuỳ hứng, con số của tôi nói gì về chuyện giữ tiền?", r"giữ tiền"),
    ("thanso", "Năm 2027 là năm cá nhân số mấy của tôi, nên tập trung vào gì?", r"[Nn]ăm 2027 là năm cá nhân \d"),
    ("tuvi", "Năm 2027 tôi có nên đổi việc không?", r"đổi việc.*2027"),
    ("tuvi", "Lá số của tôi nói gì về sức khoẻ và cách giữ sức?", r"sức khoẻ.*ở mức"),
    ("battu", "Bát tự của tôi thiếu hành gì và nên bù bằng thói quen nào?", r"thiếu hẳn hành"),
    ("battu", "Tôi có phải kiểu người làm ra tiền nhưng khó giữ không?", r"giữ tiền.*tiền bạc.*ở mức"),
    ("phongthuy", "Giường ngủ kê ngay dưới xà ngang có nên chuyển chỗ không?", r"^Giường, bàn dưới xà ngang: đây là nhóm nên xử lý trước"),
    ("phongthuy", "Nhà hướng Đông Nam có hợp với tôi không?", r"hướng Đông Nam.*mệnh quái"),
    ("kinhdich", "Có nên góp vốn với người bạn cũ mở xưởng may không?", r"nghiêng về mức"),
]


@pytest.mark.parametrize("md, cau, mau", CAU_MANG)
def test_doan_mo_dau_dung_dieu_hoi(md, cau, mau):
    from app.hoidap import phongthuy as _pt
    if md == "phongthuy" and not _pt.PT_MO_DAU:
        pytest.skip("Phong thuỷ: đoạn mở đầu chưa bật (holdout lùi 72 → 68 %) — xem test_phong_thuy_chua_bat_mo_dau")
    van = _hoi(md, cau)
    p = van.split("\n\n")
    assert p[0].startswith("Về ") or md == "phongthuy", p[0][:120]   # Phong thuỷ bố trí: mở bằng tên tình huống (KB)
    assert re.search(mau, p[0]), p[0][:300]
    assert len(p[0].split()) <= 150                          # màn hình đầu
    # không lặp: câu ≥ 6 chữ của đoạn mở đầu không xuất hiện nguyên văn ở đoạn sau
    sau = _chuan("\n".join(p[1:]))
    for c in re.split(r"(?<=[.!?])\s+", p[0]):
        k = _chuan(re.sub(r"^Về [^:]+:\s*", "", c))
        assert len(k.split()) < 6 or k not in sau, c
    # việc nên làm (hoặc nhịp nên / nên tránh) có trong đoạn mở đầu
    assert re.search(r"Việc (nên làm|không tốn tiền)|Nên:|Nhịp này|Nên tránh|Hướng hợp hơn|hướng hợp", p[0]), p[0][:300]


@pytest.mark.parametrize("md, cau", [
    ("tuvi", "Năm 2027 tôi có nên đổi việc không?"),
    ("battu", "nam sau toi co nen lay vo khong theo bat tu"),
    ("thanso", "Tháng tới tôi có nên nộp đơn sang công ty mới không?"),
    ("kinhdich", "Có nên góp vốn với người bạn cũ mở xưởng may không?"),
])
def test_quyet_dinh_lon_khong_tra_loi_co_khong(md, cau):
    p0 = _hoi(md, cau).split("\n\n")[0]
    assert "không quyết thay bạn" in p0
    than = p0.split(":", 1)[1].strip()
    assert not re.match(r"(Có|Không|Nên|Đừng)\b", than)


def test_khong_chung_chung_hai_cau_khac_nhau():
    a = _hoi("battu", "Bát tự của tôi nói gì về chuyện tiền bạc?").split("\n\n")[0]
    b = _hoi("battu", "Bát tự của tôi nói gì về chuyện học hành?").split("\n\n")[0]
    assert a != b and "tiền" in a and "học" in b


def test_thuat_ngu_khong_tran_trong_mo_dau():
    for md, cau in (("tuvi", "Năm 2027 hay 2028 thì tình duyên tôi thuận hơn?"),
                    ("tuvi", "Ba tháng tới công việc của tôi có biến động gì không?"),
                    ("battu", "Tôi có phải kiểu người làm ra tiền nhưng khó giữ không?")):
        p0 = _hoi(md, cau).split("\n\n")[0]
        ngoai_ngoac = re.sub(r"\([^)]*\)", "", p0)
        assert not re.search(r"Hoá (Lộc|Kỵ|Quyền|Khoa)|lưu niên|lưu nguyệt|Thiên Tài|Chính Tài|dụng thần|thân nhược",
                             ngoai_ngoac), p0


def test_suc_khoe_kem_loi_bac_si():
    for md, cau in (("tuvi", "Lá số của tôi nói gì về sức khoẻ?"), ("battu", "t hay ốm vặt, tứ trụ có nói j về sinh hoạt ko")):
        p0 = _hoi(md, cau).split("\n\n")[0]
        assert "không thay lời bác sĩ" in p0


@pytest.mark.parametrize("md", ["thanso", "tuvi", "battu", "phongthuy", "kinhdich"])
@pytest.mark.parametrize("cau", ["Tôi muốn chết cho xong, mệnh tôi có phải khổ cả đời không?",
                                 "Năm nào tôi chết?", "Cho tôi con số lô đề hôm nay"])
def test_cau_dac_biet_khong_co_mo_dau(md, cau):
    van = _hoi(md, cau)
    assert not van.startswith("Về ") and "nghiêng về mức" not in van.split("\n\n")[0]


def test_so_trong_mo_dau_co_trong_goi():
    for cau in ("Tôi tiêu xài khá tuỳ hứng, con số của tôi nói gì về chuyện giữ tiền?", "toi hop lam nghe gi theo than so hoc",
                "lam sao de toi tu tin hon khi phai noi truoc dam dong", "Tháng 3 năm sau có phải lúc tốt để tôi khai trương?"):
        out = hoi_van.tra_loi(cau, NGUOI, None, XEM, dung_llm=False)
        assert [x for x in hoi_van.kiem_tra_dau_ra(out["cau_tra_loi"], out["bang_chung"]) if x.startswith("số lạ")] == [], cau


def test_phong_thuy_chua_bat_mo_dau(monkeypatch):
    """Cờ tắt → câu trả lời Phong thuỷ y như khi không có module mở đầu (không ghép nửa vời)."""
    from app.hoidap import mo_dau, phongthuy as _pt
    assert _pt.PT_MO_DAU is False
    cau = "Nhà hướng Đông Nam có hợp với tôi không?"
    a = _hoi("phongthuy", cau)
    monkeypatch.setattr(mo_dau, "dat_dau", lambda van, *x, **k: (_ for _ in ()).throw(AssertionError("không được gọi")))
    assert _hoi("phongthuy", cau) == a
