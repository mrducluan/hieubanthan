# -*- coding: utf-8 -*-
"""TR-2 — Tarot trả lời ĐÚNG câu hỏi (test viết theo ca chủ dự án báo 2026-11-07: "Tôi có nên thay đổi công việc mới không?",
trải 3 lá Quá khứ – Hiện tại – Sắp tới = 6 Tiền ngược · Pháp Sư · Hiệp sĩ Kiếm ngược → bài đọc chung chung, không trả lời).

Kiểm: hiểu câu hỏi (bộ dev 260 câu + bộ holdout 150 câu ĐÓNG BĂNG, viết độc lập, không dùng để chỉnh luật), chương "Câu trả
lời" đứng đầu, nghiêng có / có điều kiện / chưa nên vội tính tất định, lá ngược đọc nghĩa ngược theo lĩnh vực, trải bài Hai
lựa chọn, hướng nhìn lật khi lá ngược, nhịp lá hoàng gia theo Book T, an toàn, câu hỏi không bị trả lại."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import tarot as calc
from app.kb import tarot_kb as kb
from app.luangiai import doi_song_khuon as kh
from app.luangiai import tarot as tr
from app.luangiai import tarot_cau_hoi as tc
from app.main import app

client = TestClient(app)
XEM = dt.date(2026, 11, 7)
CAU = Path(__file__).parents[1] / "fixtures" / "cau_hoi"
CA_ANH = [{"id": "tien_6", "nguoc": True}, {"id": "dai_1"}, {"id": "kiem_hiep_si", "nguoc": True}]
CAU_ANH = "Tôi có nên thay đổi công việc mới không?"


def _doc(ten: str) -> list[dict]:
    return [json.loads(x) for x in (CAU / ten).read_text(encoding="utf-8").splitlines() if x.strip()]


# ------------------------------------------------------------------ hiểu câu hỏi
@pytest.mark.parametrize("ten,san_yd,san_lv", [("tarot_y_dinh_dev.jsonl", 0.97, 0.92), ("tarot_y_dinh_holdout.jsonl", 0.87, 0.80)])
def test_hieu_cau_do_phu(ten, san_yd, san_lv):
    ds = _doc(ten)
    yd = sum(tc.hieu_cau(x["cau"])["y_dinh"] == x["y_dinh"] for x in ds) / len(ds)
    lv = sum(tc.hieu_cau(x["cau"])["linh_vuc"] == x["linh_vuc"] for x in ds) / len(ds)
    assert yd >= san_yd and lv >= san_lv, (ten, round(yd, 3), round(lv, 3))


@pytest.mark.parametrize("cau,yd", [
    (CAU_ANH, "quyet_dinh"), ("co nen chuyen viec khong", "quyet_dinh"), ("Có nên nói thật với chồng không?", "quyet_dinh"),
    ("Nên ở lại công ty cũ hay chuyển sang công ty mới?", "lua_chon"), ("Có nên ký hợp đồng này hay không?", "quyet_dinh"),
    ("Khi nào tôi có việc mới?", "thoi_diem"), ("Làm sao để được tăng lương?", "cach_lam"), ("Sao tôi hay bị người yêu bỏ rơi", "ly_do"),
    ("Anh ấy có yêu tôi không?", "nguoi_khac"), ("Dự án này có thành công không?", "ket_qua"), ("Điểm mạnh của tôi là gì?", "hieu_minh"),
    ("", "tong_quat"),
])
def test_hieu_cau_ca_dien_hinh(cau, yd):
    assert tc.hieu_cau(cau)["y_dinh"] == yd


def test_hieu_cau_ca_anh_va_hai_lua_chon():
    h = tc.hieu_cau(CAU_ANH)
    assert (h["linh_vuc"], h["viec"], h["goi_y_trai_bai"]) == ("cong_viec", "doi_viec", "hai_lua_chon")
    # hai lựa chọn luôn theo thứ tự đường A (giữ như cũ) – đường B (thay đổi), dù câu nói ngược
    assert tc.hieu_cau("Chuyển sang công ty mới hay ở lại công ty cũ?")["lua_chon"] == tc.hieu_cau("Ở lại công ty cũ hay chuyển sang công ty mới?")["lua_chon"]
    # chủ đề người dùng bấm thắng lĩnh vực đoán từ chữ
    assert tc.hieu_cau("Có nên đổi việc không?", "tien_bac")["linh_vuc"] == "tien_bac"


# ------------------------------------------------------------------ KB mới
def test_kb_nghia_nguoc_theo_linh_vuc_va_tra_loi_du_78_la():
    from app.kb.tuvi_doi_song_kb import tim_cum_cam
    from app.luangiai import suc_khoe_nam as skn
    ds = [c for c in kh.cum_cam_chung() + kb.cum_cam() if c not in kh.NGOAI_LE.get("tarot", ())]
    loi = []
    for ma, l in kb.la().items():
        assert set(l["linh_vuc_nguoc"]) == {"tinh_cam", "cong_viec", "tien_bac", "suc_khoe"}, ma
        assert set(l["tra_loi"]) == {"x", "n"} and l["nghieng"]["x"] in ("tien", "dieu_kien", "cho") and l["nghieng"]["n"] in ("tien", "dieu_kien", "cho"), ma
        for k in ("tinh_cam", "cong_viec", "tien_bac", "suc_khoe"):
            assert l["linh_vuc_nguoc"][k] != l["linh_vuc"][k], (ma, k)          # lá ngược không mượn nghĩa xuôi
        van = [*l["linh_vuc_nguoc"].values(), *l["tra_loi"].values()]
        loi += [(ma, c, s[:60]) for s in van for c in tim_cum_cam(s, ds)]
        loi += [(ma, c, "sk") for c in skn.kiem(l["linh_vuc_nguoc"]["suc_khoe"])]
        assert not any(x in " ".join(van).lower() for x in ("sẽ xảy ra", "chắc chắn", "định mệnh", "phá sản", "ly hôn", "tai nạn")), ma
    assert not loi, loi[:10]
    for v in kb._d()["viec_truoc_khi_quyet"].values():
        for x in (v.values() if isinstance(v, dict) else [v]):
            for s in x:
                assert not tim_cum_cam(s, ds), s


# ------------------------------------------------------------------ CALC
def test_nghieng_tong_tinh_tay():
    # Pháp Sư (tiến, ×1, giữ sức) + Hiệp sĩ Kiếm ngược (chưa nên vội, ×2, được tiếp sức ×1,25) → (1 − 2,5) / 3 = −0,5 → chưa nên vội
    assert calc.nghieng_tong([("tien", 1, "binh"), ("cho", 2, "tiep_suc")]) == {"nghieng": "cho", "diem": -0.5}
    assert calc.nghieng_tong([("tien", 1, "binh"), ("tien", 2, "bi_kim")])["nghieng"] == "tien"                 # (1 + 1,5)/3 = 0,83
    assert calc.nghieng_tong([("tien", 1, "binh"), ("cho", 1, "binh")]) == {"nghieng": "dieu_kien", "diem": 0.0}
    assert calc.nghieng_la("dai_1", False) == "tien" and calc.nghieng_la("kiem_hiep_si", True) == "cho"


def test_huong_nhin_lat_khi_la_nguoc():
    x = calc.phan_tich("ba_la_thoi_gian", [{"id": "dai_1"}, {"id": "tien_2"}, {"id": "kiem_hiep_si"}])
    n = calc.phan_tich("ba_la_thoi_gian", [{"id": "dai_1"}, {"id": "tien_2"}, {"id": "kiem_hiep_si", "nguoc": True}])
    hx = next(h for h in x["huong_nhin"] if h["vi_tri"] == 2)
    hn = next(h for h in n["huong_nhin"] if h["vi_tri"] == 2)
    assert kb.mot_la("kiem_hiep_si")["huong_nhin"] == -1
    assert hx["huong"] == -1 and hx["toi"] == 1 and not hx["lat"]
    assert hn["huong"] == 1 and hn["toi"] is None and hn["lat"]


def test_nhip_la_hoang_gia_theo_book_t():
    # Hiệp sĩ Kiếm (Book T: King of the Spirits of Air) cai 20° Kim Ngưu → 20° Song Tử = decan 3 Kim Ngưu + decan 1–2 Song Tử
    k = calc.khoang_thoi_gian("kiem_hiep_si", XEM)
    assert (k["loai"], k["cung"], k["cung_sau"], k["tu"], k["den"]) == ("hoang_gia", "kim_nguu", "song_tu", dt.date(2027, 5, 11), dt.date(2027, 6, 10))
    assert calc.khoang_thoi_gian("kiem_tieu_dong", XEM)["loai"] == "bo"           # Tiểu đồng cai một phần tư bầu trời quanh cực → nhịp bộ
    # Book T "King" (cưỡi ngựa) = Hiệp sĩ Waite: tên Thoth theo đúng lá
    assert kb.mot_la("kiem_hiep_si")["thoth_ten"].startswith("Lord of the Winds") and kb.mot_la("kiem_vua")["thoth_ten"].startswith("Prince of the Chariot")


# ------------------------------------------------------------------ bài đọc
def _bc(la=CA_ANH, tb="ba_la_thoi_gian", cau=CAU_ANH, chu_de="cong_viec"):
    return tr.bao_cao(tb, la, cau_hoi=cau, chu_de=chu_de, ngay_xem=XEM)


def test_ca_anh_tra_loi_dung_cau_hoi():
    bc = _bc()
    c = bc["chuong"][0]
    assert c["ma"] == "tra_loi" and c["muc"] == "can_chu_dong" and c["nghieng"] == "cho"
    h0 = c["hop"][0]
    assert h0["tieu_de"] == "Chưa nên vội" and "đổi sang công việc mới" in h0["noi_dung"] and "Hiệp sĩ Kiếm (ngược)" in h0["noi_dung"]
    assert "hợp đồng" in h0["huong_xu_ly"]
    # điều quan trọng nhất mở bằng câu trả lời
    assert bc["cot_loi"][0]["tu_chuong"] == "tra_loi" and bc["cot_loi"][0]["tieu_de"] == "Chưa nên vội"
    # lá ngược dùng nghĩa NGƯỢC trong công việc, không mượn nghĩa xuôi
    van = " ".join(kh.lop_doi_thuong(bc))
    assert kb.mot_la("tien_6")["linh_vuc"]["cong_viec"] not in van and kb.mot_la("tien_6")["linh_vuc_nguoc"]["cong_viec"] in van
    assert kb.mot_la("kiem_hiep_si")["linh_vuc_nguoc"]["cong_viec"] in van
    # câu "có nên" → gợi trải bài Hai lựa chọn; quyết định là của người hỏi
    assert any("Hai lựa chọn" in d for d in c["doan"]) and any("quyết định vẫn là của bạn" in d for d in c["doan"])
    assert bc["hieu_cau"]["y_dinh"] == "quyet_dinh" and bc["hieu_cau"]["nghieng"] == "cho"
    assert kh.kiem_giong_van(bc) == []
    # câu hỏi không bị trả lại ở bất kỳ đâu
    assert CAU_ANH not in json.dumps(bc, ensure_ascii=False)
    # mức hộp từng lá = nghiêng của lá (không phải sức lá bên cạnh): Hiệp sĩ Kiếm ngược được tiếp sức nhưng vẫn "chưa nên vội"
    tl = next(x for x in bc["chuong"] if x["ma"] == "tung_la")
    assert tl["hop"][2]["muc"] == "can_chu_dong" and tl["hop"][1]["muc"] == "thuan"


def test_hai_lua_chon_so_hai_duong():
    la = [{"id": "dai_9"}, {"id": "kiem_10"}, {"id": "dai_19"}, {"id": "tien_4"}, {"id": "gay_8"}]   # A = Mười Kiếm (chưa nên), B = Mặt Trời (tiến)
    bc = tr.bao_cao("hai_lua_chon", la, cau_hoi="Nên ở lại công ty cũ hay chuyển sang công ty mới?", ngay_xem=XEM)
    c = bc["chuong"][0]
    assert c["nghieng"] == "tien" and c["hop"][0]["tieu_de"] == "Đường B nghiêng hơn"
    assert any("Đường A là ở lại / giữ như cũ; đường B là thay đổi" in d for d in c["doan"])
    ma = [h["vi_tri"]["ma"] for h in c["hop"] if h.get("vi_tri")]
    assert "lua_chon_1" in ma and "lua_chon_2" in ma
    assert kh.kiem_giong_van(bc) == []


def test_khong_cau_hoi_va_nguoi_khac():
    bc = _bc(cau=None, chu_de=None)
    c = bc["chuong"][0]
    assert c["ma"] == "tra_loi" and "chưa gõ câu hỏi" in c["doan"][0] and c["hop"]
    bc = _bc(cau="Anh ấy có yêu tôi không?", chu_de=None)
    assert any("không đọc được người khác" in d for d in bc["chuong"][0]["doan"])


def test_cau_khung_hoang_dung_bo_chan_chung():
    bc = _bc(cau="Tôi muốn chết, có nên đi luôn cho xong không")
    c = bc["chuong"][0]
    assert c.get("chan") == "an_toan" and not c["hop"] and "115" in c["doan"][0]
    assert bc["cot_loi"][0]["tu_chuong"] != "tra_loi"


@pytest.mark.parametrize("tb,n", [("mot_la", 1), ("ba_la_loi_khuyen", 3), ("nam_la", 5), ("celtic", 10), ("hai_lua_chon", 5)])
def test_moi_trai_bai_co_chuong_tra_loi(tb, n):
    la = [{"id": m, "nguoc": i % 2 == 1} for i, m in enumerate(calc.BO_BAI[3:3 + n])]
    bc = tr.bao_cao(tb, la, cau_hoi="Có nên mở quán cà phê không?", ngay_xem=XEM)
    c = bc["chuong"][0]
    assert c["ma"] == "tra_loi" and c["hop"] and c["hop"][-1]["loai"] == "loi_khuyen"
    for h in c["hop"]:
        assert h["ma_mau"].startswith("ds.tarot.tra_loi.") and len(h["ma_mau"]) <= 60 and h.get("phai") in (*kb.truong_phai(), "tarot_tong_hop")
    assert kh.kiem_giong_van(bc) == []


# ------------------------------------------------------------------ hỏi đáp + API
def test_hoi_cau_co_nen():
    r = tr.hoi(CAU_ANH)
    assert r["xu_ly"] == "goi_y_rut" and r["goi_y_trai_bai"] == "hai_lua_chon"
    r = tr.hoi(CAU_ANH, trai_bai="ba_la_thoi_gian", la=CA_ANH, ngay_xem=XEM)
    assert r["xu_ly"] == "tra_loi_trai_bai" and r["nghieng"] == "cho" and r["cau_tra_loi"].startswith("Chưa nên vội")
    assert tr.hoi("Celtic Cross là trải bài gì?")["xu_ly"] == "trai_bai"
    assert tr.hoi("Lá Tháp nghĩa là gì?")["xu_ly"] == "nghia_la"


def test_api_hieu_cau_va_doc_bai():
    r = client.post("/v1/tarot/hieu-cau", json={"cau_hoi": CAU_ANH}).json()
    assert r["y_dinh"] == "quyet_dinh" and r["goi_y_trai_bai"] == "hai_lua_chon" and CAU_ANH not in json.dumps(r, ensure_ascii=False)
    r = client.post("/v1/tarot/doc-bai", json={"trai_bai": "hai_lua_chon", "la": [{"id": m} for m in calc.BO_BAI[:5]], "cau_hoi": CAU_ANH}).json()
    assert r["chuong"][0]["ma"] == "tra_loi" and r["hieu_cau"]["viec"] == "doi_viec"
    assert "hai_lua_chon" in client.get("/v1/tarot/bo-bai").json()["trai_bai"]
