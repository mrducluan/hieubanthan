# -*- coding: utf-8 -*-
"""CY-2 (2026-11-14) — lời "nên chú ý" đầy đủ chủ đề + câu người cùng làm ăn ở mọi mảng hỏi đáp (vi + en).

Chủ dự án: người dùng muốn cả mặt thuận LẪN lời nhắc "nên chú ý…" (sức khoẻ, người khác / thị phi, công việc, gia đình,
con cái, học hành, thăng tiến, tiền, nhà cửa, đi lại, ra nước ngoài, mua xe, giấy tờ…); câu "đối tác làm ăn của tôi có
trung thực không" phải được trả lời theo hướng nên chú ý / nên làm — không phán người kia, không phải lời khuyên pháp lý.
"""
import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.kb import chu_y_kb as kb
from app.luangiai import chu_y_nam as cyn

DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
MOI = ("hop_tac", "tieu_nhan", "hoc_hanh", "con_cai", "cong_danh", "xuat_ngoai", "mua_xe")
VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
XEM = dt.date(2026, 11, 10)


def _en():
    return ngon_ngu.HIEN_TAI.set("en")


def test_kb_moi_mang_du_khoi():
    d = json.loads((DATA / "chu_y_kb.json").read_text(encoding="utf-8"))
    for m in MOI:
        assert m in d["mang"], m
    for m, o in d["mang"].items():
        for k in ("ten", "viec", "viec_nay", "viec_ngan", "de_y", "ranh_gioi"):
            assert o.get(k), (m, k)
        for k in ("viec", "viec_nay", "de_y", "ranh_gioi", "pt_bo_tri"):
            assert not cyn.kiem(o.get(k) or ""), (m, k)
        assert not re.search(r"\d", o["de_y"] + o["viec"] + (o.get("pt_bo_tri") or "")), m   # không số lạ trong lời
    assert "luật sư" in d["mang"]["hop_tac"]["ranh_gioi"] and "pháp lý" in d["mang"]["hop_tac"]["ranh_gioi"]


def test_kb_ban_anh_du_va_sach_chu_viet():
    tk = _en()
    try:
        for m in kb.cac_mang():
            for x in (kb.ten(m), kb.viec(m), kb.de_y(m), kb.ranh_gioi(m)):
                assert x and not VIET.search(x), (m, x)
            if kb.pt_bo_tri(m):
                assert not VIET.search(kb.pt_bo_tri(m)), m
        for k in ("de_y", "nla_dau", "nla_nam_sinh", "nla_viec", "pt_noi"):
            assert kb.mau(k) and not VIET.search(kb.mau(k)), k
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)


@pytest.mark.parametrize("cau, mang", [
    ("Đối tác làm ăn của tôi có trung thực không?", "hop_tac"),
    ("Năm nay có bị tiểu nhân nói xấu không?", "tieu_nhan"),
    ("Con tôi thi đại học năm sau có cần chú ý gì không?", "hoc_hanh"),
    ("Năm nay tôi có được thăng chức không, nên chú ý gì?", "cong_danh"),
    ("Đi du học năm sau có rủi ro gì không?", "xuat_ngoai"),
    ("Năm nay mua xe có nên không?", "mua_xe"),
])
def test_mang_hoi_nhan_mang_moi(cau, mang):
    from app.luangiai.hoi import chuan_hoa_cau
    assert cyn.mang_hoi(chuan_hoa_cau(cau)) == mang


def test_tuvi_nguoi_lam_an_hai_mat_va_ranh_gioi():
    from app.hoidap import tuvi
    k = tuvi.tra_loi("Đối tác làm ăn của tôi có trung thực không?", "tham_khao",
                     sinh={"ngay": dt.date(1990, 5, 17), "ti": 4, "gioi_tinh": "nam"}, ngay_xem=XEM)
    d1 = k["cau_tra_loi"].split("\n\n")[0]
    assert k["phan_loai"]["xu_ly"] not in ("tu_choi", "an_toan")
    assert "không đọc được lòng người kia" in d1
    assert "Nên để ý" in d1 and "Việc nên làm" in d1 and "luật sư" in d1
    assert not re.search(r"(người kia|đối tác) (là người )?(trung thực|không trung thực|gian dối)", d1)


def test_battu_nguoi_lam_an_doc_quan_he_ben_ngoai():
    from app.hoidap import battu
    k = battu.tra_loi("Người góp vốn sinh năm 1985 có trung thực không?",
                      sinh={"lich": dt.datetime(1990, 5, 17, 8, 30), "gioi_tinh": "nam", "gio_ty": "da_ty"}, ngay_xem=XEM)
    d1 = k["cau_tra_loi"].split("\n\n")[0]
    assert "quan hệ bên ngoài" in d1
    assert "chính họ đồng ý" in d1                       # có năm sinh người kia → lá số của họ cần họ đồng ý


def test_thanso_hai_mat_cau_lo():
    from app.narrative import hoi_van
    k = hoi_van.tra_loi("Con tôi thi đại học năm sau nên chú ý gì?",
                        {"ho_ten": ["Nguyễn Văn Bình"], "ngay": 17, "thang": 5, "nam": 1990, "quy_uoc": "tung_phan"},
                        None, XEM, dung_llm=False)
    d1 = k["cau_tra_loi"].split("\n\n")[0]
    assert "Điểm mạnh của bạn" in d1 and "Nên để ý" in d1


def test_phongthuy_cau_khong_ve_nha_co_cau_noi():
    from app.hoidap import phongthuy
    k = phongthuy.tra_loi("Năm nay mua xe có nên không?", sinh={"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)},
                          ngay_xem=XEM)
    d1 = k["cau_tra_loi"].split("\n\n")[0]
    assert d1.startswith("Về chuyện mua xe") and "gợi ý bố trí" in d1 and "Nên để ý" in d1


def test_tarot_nguoi_khac_khong_chip_co_khong():
    from app.luangiai import tarot
    la = [{"id": "dai_9"}, {"id": "kiem_3", "nguoc": True}, {"id": "tien_10"}]
    bc = tarot.bao_cao("ba_la_loi_khuyen", la, cau_hoi="Đối tác làm ăn của tôi có trung thực không?", ngay_xem=XEM)
    ch = bc["chuong"][0]
    assert ch["ma"] == "tra_loi" and ch.get("muc") is None
    h0 = ch["hop"][0]
    assert h0["tieu_de"] == "Phía bạn" and "Nghiêng về" not in h0["noi_dung"]
    assert "Điểm sáng" in h0["noi_dung"] and "Chỗ cần canh" in h0["noi_dung"]
    assert any("luật sư" in d for d in ch["doan"])
    # câu có / không thường vẫn giữ chip
    bc2 = tarot.bao_cao("ba_la_loi_khuyen", la, cau_hoi="Tôi có nên đổi việc không?", ngay_xem=XEM)
    assert bc2["chuong"][0].get("muc") is not None


def test_thanso_en_nguoi_lam_an():
    from app.luangiai import hoi_en
    tk = _en()
    try:
        k = hoi_en.tra_loi("Is my business partner honest?", {"ho_ten": ["Nguyen Van Binh"], "ngay": 17, "thang": 5, "nam": 1990}, XEM)
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)
    t = k["cau_tra_loi"]
    assert k["phan_loai"]["linh_vuc"] == "su_nghiep"
    assert "another person's heart" in t and "lawyer" in t and "Worth watching" in t
    assert not VIET.search(t)
