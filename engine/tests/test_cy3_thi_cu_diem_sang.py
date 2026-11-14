# -*- coding: utf-8 -*-
"""CY-3 (2026-11-14) — câu kỳ thi trả lời đúng chủ đề học hành / thi cử (cả khi hỏi về con), mỗi câu trả lời chủ đề có
ít nhất một điểm sáng, tình huống cụ thể (đòi nợ, cho vay, chăm bố mẹ già, nhà chồng) có lời nhắc + việc đúng tình huống.
Bộ phát triển: fixtures/cau_hoi/dev_chu_y.jsonl, dev_chu_y_2.jsonl (scripts/cham_dev_chu_y.py)."""
import datetime as dt
import re

from app import ngon_ngu
from app.hoidap import mo_dau

XEM = dt.date(2026, 11, 10)
SINH_TV = {"ngay": dt.date(1990, 5, 17), "ti": 4, "gioi_tinh": "nam"}
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}
PHAN = re.compile(r"sẽ (đỗ|trượt|đậu|rớt|phá sản|ly hôn|bị kiện|gặp tai nạn)|chắc chắn (đỗ|trượt)")


def _d1(k: dict) -> str:
    return k["cau_tra_loi"].split("\n\n")[0]


def test_dieu_hoi_ky_thi_cua_con_dung_truoc_con_cai():
    from app.luangiai.hoi import chuan_hoa_cau
    d = mo_dau.dieu_hoi(chuan_hoa_cau("Năm nay con tôi thi đại học có đỗ không?"), "Năm nay con tôi thi đại học có đỗ không?",
                        "gia_dinh")
    assert d["ma"] == "thi_cu" and d.get("con") and d["nhan_ro"] == mo_dau.NHAN_CON_THI
    assert mo_dau.chuong_cua(d) == "gia_dinh"


def test_tuvi_con_thi_dai_hoc():
    from app.hoidap import tuvi
    d1 = _d1(tuvi.tra_loi("Năm nay con tôi thi đại học có đỗ không?", "tham_khao", sinh=SINH_TV, ngay_xem=XEM))
    assert d1.startswith("Về chuyện học hành, thi cử của con")
    assert "mảng con cái ở mức" in d1 and "mảng việc học, thi cử ở mức" in d1
    for x in ("Điểm sáng", "Nên để ý", "Việc nên làm cho kỳ thi", "đề thi thử", "không đoán điểm hay đỗ trượt"):
        assert x in d1, x
    assert "chơi với con" not in d1 and not PHAN.search(d1)


def test_cac_mang_ky_thi_tu_than():
    from app.hoidap import battu, phongthuy, tuvi
    q = "Tôi thi IELTS năm nay có qua không?"
    for k in (tuvi.tra_loi(q, "tham_khao", sinh=SINH_TV, ngay_xem=XEM), battu.tra_loi(q, sinh=SINH_BT, ngay_xem=XEM),
              phongthuy.tra_loi(q, sinh={"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)}, ngay_xem=XEM)):
        d1 = _d1(k)
        assert d1.startswith("Về chuyện học hành, thi cử"), d1[:80]
        assert "Điểm sáng" in d1 and "Việc nên làm cho kỳ thi" in d1 and "không đoán điểm hay đỗ trượt" in d1
        assert d1.count("không đoán điểm hay đỗ trượt") == 1 and not PHAN.search(d1)


def test_en_con_thi():
    from app.hoidap import tuvi
    tk = ngon_ngu.HIEN_TAI.set("en")
    try:
        d1 = _d1(tuvi.tra_loi("Will my son pass his university entrance exam?", "tham_khao", sinh=SINH_TV, ngay_xem=XEM))
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)
    assert d1.startswith("About your child's studies and exams")
    assert "Bright spot" in d1 and "What to do for the exam" in d1 and "not a prediction of marks, pass or fail" in d1


def test_doi_tac_co_diem_sang():
    from app.hoidap import tuvi
    d1 = _d1(tuvi.tra_loi("Đối tác làm ăn của tôi có trung thực không?", "tham_khao", sinh=SINH_TV, ngay_xem=XEM))
    assert re.search(mo_dau._CO_SANG[0] + "|" + "|".join(mo_dau._CO_SANG[1:]), d1)


def test_tinh_huong_vay_muon():
    from app.hoidap import battu, tuvi
    d1 = _d1(tuvi.tra_loi("Năm nay tôi có nên cho bạn thân vay 200 triệu không?", "tham_khao", sinh=SINH_TV, ngay_xem=XEM))
    assert d1.startswith("Về chuyện cho vay") and "giấy vay" in d1 and "đến nơi mới" not in d1
    d1 = _d1(battu.tra_loi("Tôi bị người quen quỵt tiền, năm nay có đòi lại được không?", sinh=SINH_BT, ngay_xem=XEM))
    assert "chứng từ" in d1 and "không phải lời khuyên pháp lý" in d1


def test_nha_chong_khong_muon_hop_bo_me_ruot():
    from app.hoidap import battu
    d1 = _d1(battu.tra_loi("Tôi hay cãi nhau với mẹ chồng, nên chú ý gì?", sinh=SINH_BT, ngay_xem=XEM))
    assert d1.startswith("Về chuyện với mẹ chồng") and "chỗ dựa từ mẹ" not in d1 and "Việc nên làm" in d1


def test_khop_ma_khong_khop_nham():
    assert not mo_dau._khop_ma("ds.gia_dinh.tuan_triet+tu_nu.cham.vap", ".cha")
    assert mo_dau._khop_ma("ds.bt.gia_dinh.cha.manh", ".cha")
    assert mo_dau._khop_ma("ds.bt.gia_dinh.an_nhieu.manh", "an_")
    assert not mo_dau._khop_ma("ds.x.thuan_loi", "an_")


def test_lo_ngoai_tinh_co_viec_khong_doan():
    from app.narrative import hoi_van
    k = hoi_van.tra_loi("Tôi lo chồng ngoại tình, tôi nên làm gì?",
                        {"ho_ten": ["Nguyễn Văn Bình"], "ngay": 17, "thang": 5, "nam": 1990, "quy_uoc": "tung_phan"},
                        None, XEM, dung_llm=False)
    d1 = _d1(k)
    assert "Việc nên làm" in d1 and "Nên để ý" in d1
    assert not re.search(r"(chồng|vợ) (bạn )?(đang|có) ngoại tình", d1)
    # câu có dấu hiệu bạo lực: chỉ lời đồng cảm + an toàn, không khuyên "nói chuyện thẳng"
    assert "nói chuyện thẳng" not in mo_dau.dong_cam(None, "chong toi danh toi")
