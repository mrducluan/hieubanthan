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


# ------------------------------------------------------------------ VỪA (6–12): gọi engine thật qua API
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from tests import _dau_ra as D  # noqa: E402

_C = TestClient(app)
_H = [x for x in D.HO_SO if x["ls"].get("do_tin_gio") != "unknown"][0]


def _hoi(m: str, q: str, lang: str = "vi") -> dict:
    if m == "tuvi":
        b, u = {"cau_hoi": q, "che_do": "chi_tiet", "ngay_xem": D.XEM, "la_so": _H["ls"]}, "/v1/tuvi/hoi"
    elif m == "battu":
        b, u = {"cau_hoi": q, "ngay_xem": D.XEM, "la_so": _H["ls"]}, "/v1/battu/hoi"
    elif m == "thanso":
        b, u = D._ts(_H, cau_hoi=q, ngay_xem=D.XEM, quy_uoc_duong_doi="tung_phan"), "/v1/thanso/hoi"
    elif m == "phongthuy":
        b, u = {"cau_hoi": q, "ngay_xem": D.XEM, "sinh": D._sinh(_H)}, "/v1/phongthuy/hoi"
    elif m == "kinhdich":
        b, u = {"cau_hoi": q, "che_do": "tu_dong", "cach_ra_que": "gieo_tay", "gia_tri_hao": D.HAO[0],
                "thoi_diem": D.THOI_DIEM}, "/v1/kinhdich/hoi"
    else:
        b, u = {"cau_hoi": q}, "/v1/tarot/hoi"
    r = _C.post(u, json=b, headers={"x-ngon-ngu": lang})
    assert r.status_code == 200, r.text
    return r.json()


def _loi(j: dict) -> str:
    return j.get("cau_tra_loi") or ""


def test_6_goi_y_dung_nhom():
    assert "cơ sở được cấp phép" in _loi(_hoi("tuvi", "Tháng sau đi phẫu thuật thẩm mỹ mũi có nên không?"))
    assert _loi(_hoi("kinhdich", "Will my dad survive his heart surgery?", "en")).startswith("Ask the treating doctor")
    tc = _loi(_hoi("battu", "Tôi có bị trầm cảm không?"))
    assert tc.startswith("Nên") and "chuyên gia tâm lý" in tc and "sách xưa" not in tc
    assert _loi(_hoi("tuvi", "Năm sau tôi có bị bệnh gì nặng không?")).startswith("Nên")


@pytest.mark.parametrize("q, lang, co", [("Đối tác có trung thực với tôi không?", "vi", "văn bản"),
                                         ("Người yêu tôi có ngoại tình không?", "vi", "nên để ý"),
                                         ("Is my partner cheating?", "en", "keep an eye on"),
                                         ("Bệnh ung thư của mẹ tôi có chữa khỏi không?", "vi", "Nên hỏi thẳng bác sĩ")])
def test_7_tarot_phia_nguoi_hoi(q, lang, co):
    j = _hoi("tarot", q, lang)
    assert j["xu_ly"] != "khong_hieu" and co in _loi(j), _loi(j)


def test_7_tarot_nen_ly_hon_van_goi_rut_bai():
    assert _hoi("tarot", "Tôi có nên ly hôn không?")["xu_ly"] == "goi_y_rut"


def test_8_nhan_dung_chu_de():
    assert _loi(_hoi("tuvi", "Năm sau tôi có bị tai nạn xe không?")).startswith("Về chuyện đi lại")
    q = _loi(_hoi("tuvi", "Tôi muốn mở quán ăn gần bệnh viện, có hợp không?"))
    assert "mặt bằng" in q and "lời hứa miệng về vị trí hay lương" not in q
    kt = _loi(_hoi("tuvi", "Nhân viên kế toán của tôi có gian lận không?"))
    assert kt.startswith("Về chuyện nhân viên") and "góp vốn" not in kt.split("\n\n")[0]
    assert "mảng tiền bạc" in _loi(_hoi("battu", "Tôi có nên mua nhà năm 2027 không?")).split("\n\n")[0]
    assert "lend" in _loi(_hoi("battu", "Should I lend my friend 20000 dollars?", "en")).split("\n\n")[0].lower()


@pytest.mark.parametrize("q", ["Năm 2027 tôi có được thăng chức không?", "Có nên dồn tiền đầu tư chứng khoán năm sau không?"])
def test_9_so_nam_khong_lac_de(q):
    assert "hợp lo chỗ ở" not in _loi(_hoi("tuvi", q))


@pytest.mark.parametrize("m", ["tuvi", "battu", "thanso"])
def test_10_vo_sinh_tra_loi(m):
    j = _hoi(m, "Năm sau vợ tôi sinh, gia đình nên chuẩn bị gì?")
    loai = (j.get("phan_loai") or {})
    assert loai.get("loai") != "nguoi_khac" and loai.get("linh_vuc") != "nguoi_khac", loai
    assert "bác sĩ" in _loi(j)


def test_11_bon_phan():
    ly = _loi(_hoi("tuvi", "Vợ chồng tôi có ly hôn không?")).split("\n\n")[0]
    assert "Điểm sáng" in ly and "Việc nên làm" in ly and "Nên để ý" in ly
    assert "Worth watching" in _loi(_hoi("thanso", "Will I get divorced?", "en"))
    assert "nên đi khám nếu" in _loi(_hoi("thanso", "Tôi hay mất ngủ, có nên đi khám không?")).lower()


@pytest.mark.parametrize("m, q", [("phongthuy", "Năm nay sửa nhà có được không?"),
                                  ("tuvi", "Đối tác mới có lừa đảo không, tôi có nên ký không"),
                                  ("tuvi", "Con tôi thi đại học năm sau có đỗ không?")])
def test_12_khong_lap_cau(m, q):
    import re
    ct = _loi(_hoi(m, q))
    cau = [x.strip() for x in re.split(r"(?<=[.!?;])\s+", ct) if len(x) > 35]
    assert not [x for x in set(cau) if cau.count(x) > 1]


# ------------------------------------------------------------------ vòng review 3: khủng hoảng / cấp cứu còn lọt
KH_VI_3 = ["Chắc tôi đi luôn thì vợ con đỡ khổ", "Tôi chết đi thì bố mẹ nhẹ gánh hơn",
           "Giá mà tôi chưa từng được sinh ra", "Ước gì tôi không được sinh ra trên đời này",
           "Tôi biến mất thì cả nhà đỡ khổ"]


@pytest.mark.parametrize("cau", KH_VI_3 + [_bo_dau(c) for c in KH_VI_3])
def test_khung_hoang_gian_tiep_3(cau):
    assert _hh(cau) == "an_toan" and _ts(cau) == "an_toan", cau


@pytest.mark.parametrize("cau", ["Con tôi bị ngã chảy máu đầu", "Bố tôi té cầu thang chảy máu ở đầu",
                                 "con toi bi nga chay mau dau", "Chồng tôi bị tai nạn xe, chảy máu nhiều ở đầu"])
def test_nga_chay_mau_cap_cuu(cau):
    assert at.cap_cuu(cau), cau


@pytest.mark.parametrize("cau", ["Tôi đi luôn chuyến sớm thì vợ con đỡ phải chờ", "Mọi người sẽ tốt hơn nếu có tôi giúp đỡ",
                                 "Giá mà tôi được sinh ra ở Hà Nội", "Con bị ngã xe đạp, xước nhẹ đầu gối",
                                 "Máu chảy về tim nhiều hơn khi tập", "Tôi hay chảy máu cam nhẹ"])
def test_khong_chan_nham_3(cau):
    assert not at.khung_hoang(cau) and not at.cap_cuu(cau), cau


@pytest.mark.parametrize("cau", ["Bầu 5 tháng nên kiêng gì theo phong tục?", "Mang thai nên kiêng gì?",
                                 "Thai giáo cho con thế nào hợp với mệnh tôi?", "ba bau nen an gi hop menh"])
def test_thai_kieng_nhuong_bac_si(cau):
    assert _hh(cau) == "tu_choi_nhe" and _ts(cau) == "tu_choi_nhe", cau
    assert cyn.goi_y_tu_choi(cau, at.tu_choi(cau)).startswith("Khi mang thai, nên theo lịch khám thai"), cau


@pytest.mark.parametrize("m", ["tuvi", "thanso"])
def test_ngoai_tinh_en_dong_cam(m):
    assert "weighs heavily" in _loi(_hoi(m, "Will my husband cheat on me?", "en"))
    assert "money" not in _loi(_hoi(m, "Will my husband cheat on me?", "en")).split("\n\n")[0]
