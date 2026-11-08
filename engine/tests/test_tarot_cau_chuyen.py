"""TR-4 — bài đọc Tarot bám câu hỏi từ đầu tới cuối, lời thường.

Viết TRƯỚC khi sửa `luangiai/tarot.py`:
- chương "Câu chuyện các lá kể" (ngay sau "Câu trả lời"): kể các lá theo thứ tự vị trí, bằng nghĩa của lá TRONG lĩnh vực được hỏi,
  rồi một câu nối (mẫu theo nghiêng lá đầu → lá cuối), "Điểm tựa" và "Chỗ cần canh" kèm câu tự hỏi của chính lá;
- chữ HIỂN THỊ (tiêu đề, nội dung, đoạn) không còn thuật ngữ trường phái / chiêm tinh — chúng chỉ ở "Vì sao nói vậy";
- "Việc nên làm trong 72 giờ" lấy việc của lá trong ĐÚNG lĩnh vực câu hỏi (`viec_lv`), không còn việc chung chung;
- nghiêng Ác Quỷ ngược theo Waite 1910 ("Evil fatality, weakness, pettiness, blindness") = có điều kiện.
"""
from __future__ import annotations

import datetime as dt
import json
import re

import pytest

from app.calc import tarot as calc
from app.kb import tarot_kb as kb
from app.luangiai import tarot as tr
from app.luangiai.doi_song_khuon import kiem_giong_van

NGAY = dt.date(2026, 11, 8)
CAU = "Tôi có nên thay đổi công việc mới không?"
LA_ANH = [{"id": "tien_6", "nguoc": True}, {"id": "dai_1", "nguoc": False}, {"id": "kiem_hiep_si", "nguoc": True}]

# thuật ngữ chỉ được nằm ở "Vì sao nói vậy" (can_cu)
_THUAT_NGU = ("decan", "golden dawn", "book t", "phẩm giá", "marseille", "b.o.t.a", "thoth", "triệt tiêu", "°", "waite", "jodorowsky")


def _bc(la=LA_ANH, cau=CAU, tb="ba_la_thoi_gian"):
    return tr.bao_cao(tb, la, cau_hoi=cau, ngay_xem=NGAY)


def _ch(bc, ma):
    return next((c for c in bc["chuong"] if c["ma"] == ma), None)


def _chu_hien(c: dict) -> list[str]:
    ra = [c.get("tieu_de") or "", c.get("tom_tat") or "", *[d for d in c.get("doan", []) if d]]
    for h in c.get("hop", []):
        ra += [h.get("tieu_de") or "", h.get("noi_dung") or "", h.get("huong_xu_ly") or ""]
    return ra


# ------------------------------------------------------------------ chương "Câu chuyện các lá kể"
def test_cau_chuyen_dung_sau_cau_tra_loi():
    bc = _bc()
    ma = [c["ma"] for c in bc["chuong"]]
    assert ma[:2] == ["tra_loi", "cau_chuyen"]
    assert _ch(bc, "cau_chuyen")["doan_truoc"] is True    # web đặt lời kể trước các hộp


def test_cau_chuyen_ke_dung_thu_tu_va_nghia_trong_linh_vuc():
    c = _ch(_bc(), "cau_chuyen")
    ke = [d for d in c["doan"] if " — " in d]
    assert [d.split(" — ")[0] for d in ke] == ["Quá khứ", "Hiện tại", "Sắp tới"]
    # mỗi dòng là nghĩa của lá trong chuyện công việc, đúng chiều lá
    for d, v in zip(ke, LA_ANH):
        l = kb.la()[v["id"]]
        lv = (l["linh_vuc_nguoc"] if v["nguoc"] else l["linh_vuc"])["cong_viec"]
        assert lv.rstrip(".") in d
        assert ("(ngược)" in d) == v["nguoc"]


def test_cau_chuyen_cau_noi_theo_nghieng_dau_cuoi_va_goi_ten_viec():
    c = _ch(_bc(), "cau_chuyen")
    noi = next(h for h in c["hop"] if h["ma_mau"].startswith("ds.tarot.cau_chuyen.ba_la_thoi_gian.noi."))
    # 6 Tiền ngược = có điều kiện, Hiệp sĩ Kiếm ngược = chưa nên vội
    assert noi["ma_mau"] == "ds.tarot.cau_chuyen.ba_la_thoi_gian.noi.dieu_kien_cho"
    assert "đổi sang công việc mới" in noi["noi_dung"]
    assert noi["muc"] == "can_chu_dong"


def test_diem_tua_va_cho_can_canh():
    c = _ch(_bc(), "cau_chuyen")
    tua = next(h for h in c["hop"] if h["loai"] == "diem_manh")
    canh = next(h for h in c["hop"] if h["loai"] == "luu_y")
    assert tua["la"]["id"] == "dai_1" and tua["tieu_de"].startswith("Điểm tựa ở Hiện tại")
    assert canh["la"]["id"] == "kiem_hiep_si" and canh["tieu_de"].startswith("Chỗ cần canh ở Sắp tới")
    # câu tự hỏi của CHÍNH lá, đúng chiều (lá ngược dùng câu 'Hỏi mình' của nghĩa ngược)
    assert kb.la()["dai_1"]["cau_tu_soi"] in tua["noi_dung"]
    assert "tôi đang bảo vệ sự thật hay bảo vệ cái tôi?" in canh["noi_dung"]


def test_khong_co_la_tien_thi_khong_bịa_diem_tua():
    la = [{"id": "dai_16", "nguoc": False}, {"id": "kiem_10", "nguoc": False}, {"id": "kiem_9", "nguoc": False}]
    assert all(calc.nghieng_la(v["id"], v["nguoc"]) != "tien" for v in la)
    c = _ch(_bc(la), "cau_chuyen")
    assert not any(h["loai"] == "diem_manh" for h in c["hop"])


def test_cau_chuyen_celtic_chi_ke_cac_vi_tri_cot_truyen():
    ids = list(kb.la())[:10]
    c = _ch(_bc([{"id": i, "nguoc": False} for i in ids], tb="celtic"), "cau_chuyen")
    ke = [d.split(" — ")[0] for d in c["doan"] if " — " in d]
    vt = kb.trai_bai()["celtic"]["vi_tri"]
    assert ke == [vt[i]["ten"] for i in kb.trai_bai()["celtic"]["cau_chuyen"]]
    assert 4 <= len(ke) <= 6


def test_hai_lua_chon_cau_noi_theo_ket_qua_so_hai_duong():
    la = [{"id": i, "nguoc": False} for i in ("dai_0", "tien_4", "gay_3", "coc_2", "dai_19")]
    bc = _bc(la, cau="Nên ở lại công ty cũ hay chuyển sang công ty mới?", tb="hai_lua_chon")
    c = _ch(bc, "cau_chuyen")
    noi = next(h for h in c["hop"] if ".noi." in h["ma_mau"])
    assert noi["ma_mau"].startswith("ds.tarot.cau_chuyen.hai_lua_chon.noi.hai_duong_")


def test_khong_cau_hoi_van_ke_chuyen_khong_bịa_linh_vuc():
    bc = _bc(cau=None)
    c = _ch(bc, "cau_chuyen")
    ke = [d for d in c["doan"] if " — " in d]
    assert len(ke) == 3 and not any("Trong chuyện" in d for d in ke)


def test_cau_hoi_bi_chan_thi_khong_ke_chuyen():
    bc = _bc(cau="Tôi muốn chết, rút bài giúp tôi")
    c = _ch(bc, "cau_chuyen")
    assert c is None or not c.get("hop")


# ------------------------------------------------------------------ lời thường
@pytest.mark.parametrize("tb,so", [("ba_la_thoi_gian", 3), ("nam_la", 5), ("celtic", 10), ("khi_nao", 3), ("hai_lua_chon", 5)])
@pytest.mark.parametrize("nguoc", [False, True])
def test_chu_hien_thi_khong_thuat_ngu(tb, so, nguoc):
    ids = ["kiem_hiep_si", "tien_6", "dai_1", "coc_8", "gay_4", "dai_15", "kiem_3", "tien_vua", "coc_hoang_hau", "dai_17"][:so]
    bc = _bc([{"id": i, "nguoc": nguoc} for i in ids], tb=tb)
    for c in bc["chuong"]:
        for s in _chu_hien(c):
            low = s.lower()
            assert not any(t in low for t in _THUAT_NGU), (c["ma"], s)


def test_khong_lap_y_an_chinh():
    c = _ch(_bc(), "tong_quan")
    hop = next(h for h in c["hop"] if h["ma_mau"].startswith("ds.tarot.tong_quan.an_chinh"))
    assert hop["noi_dung"] not in c["doan"]


def test_dong_chay_tieu_de_loi_thuong():
    c = _ch(_bc(), "dong_chay")
    tieu = [h["tieu_de"] for h in c["hop"] if h.get("quan_he")]
    assert tieu and all(re.search(r"(kéo hai hướng|đẩy nhau mạnh lên|đỡ nhau)$", t) for t in tieu), tieu


def test_giong_van_khong_cum_cam():
    for la, cau, tb in ((LA_ANH, CAU, "ba_la_thoi_gian"), (LA_ANH, None, "ba_la_thoi_gian"),
                        ([{"id": i, "nguoc": True} for i in ("dai_13", "coc_5", "kiem_7", "tien_2", "gay_9")], "Tình cảm của tôi năm nay ra sao?", "nam_la")):
        assert kiem_giong_van(_bc(la, cau, tb)) == []


# ------------------------------------------------------------------ việc 72 giờ theo lĩnh vực
def test_moi_la_co_viec_theo_linh_vuc():
    for ma, l in kb.la().items():
        for chieu in ("x", "n"):
            for lv in ("tinh_cam", "cong_viec", "tien_bac", "suc_khoe"):
                s = l["viec_lv"][chieu][lv]
                assert 30 <= len(s) <= 140, (ma, chieu, lv, s)
                assert " sẽ " not in f" {s.lower()} "


def test_viec_72_gio_lay_dung_linh_vuc_va_chieu_la():
    c = _ch(_bc(), "viec_nen_lam")
    noi = [h["noi_dung"] for h in c["hop"]]
    mong = {v["id"]: kb.la()[v["id"]]["viec_lv"]["n" if v["nguoc"] else "x"]["cong_viec"] for v in LA_ANH}
    assert noi and all(x in mong.values() for x in noi)
    assert all(h["ma_mau"].endswith(".cong_viec") for h in c["hop"])


def test_viec_72_gio_khong_cau_hoi_giu_viec_chung():
    c = _ch(_bc(cau=None), "viec_nen_lam")
    assert all(h["noi_dung"] == kb.la()[h["la"]["id"]]["viec"] for h in c["hop"])


# ------------------------------------------------------------------ nghiêng theo Waite
def test_ac_quy_nguoc_theo_waite_la_co_dieu_kien():
    waite = json.loads((__import__("pathlib").Path(__file__).parent.parent / "fixtures/nguon/tarot_waite_1910.json").read_text(encoding="utf-8"))
    assert "weakness" in waite["dai_15"]["y_nguoc"]
    assert calc.nghieng_la("dai_15", True) == "dieu_kien"
    # 4 Gậy ngược: Waite "The meaning remains unaltered" → giữ tiến
    assert "unaltered" in waite["gay_4"]["y_nguoc"] and calc.nghieng_la("gay_4", True) == "tien"


# ------------------------------------------------------------------ hỏi đáp: lá ngược trong một lĩnh vực
def test_hoi_la_nguoc_trong_linh_vuc_doc_nghia_nguoc():
    kq = tr.hoi("Hiệp sĩ Kiếm ngược trong công việc nghĩa là gì?")
    l = kb.la()["kiem_hiep_si"]
    assert l["linh_vuc_nguoc"]["cong_viec"] in kq["cau_tra_loi"]
    assert l["linh_vuc"]["cong_viec"] not in kq["cau_tra_loi"]
    assert l["viec_lv"]["n"]["cong_viec"] in kq["cau_tra_loi"]
