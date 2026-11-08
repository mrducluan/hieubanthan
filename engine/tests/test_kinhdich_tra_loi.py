# -*- coding: utf-8 -*-
"""KD-V3 — lớp "trả lời theo việc" của Kinh Dịch: KB xu hướng 384 hào đủ và sạch cụm cấm; hiểu câu (kiểu · vai · chủ đề ·
dụng thần theo việc) đúng trên bộ dev viết trước; nghiêng kẹp theo mức (mức + mã hộp cũ không đổi); cùng một quẻ nhưng
câu hỏi khác → câu trả lời khác; câu về người thứ hai có hộp "Phía người kia"; không lộ câu người dùng gõ; giọng văn."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.hoidap import chung, kinhdich as kd
from app.kb import kinhdich_doi_song_kb as kb_ds, kinhdich_tra_loi_kb as kb
from app.luangiai import kinhdich_doi_song as ds, kinhdich_tra_loi as ktl
from app.main import app

client = TestClient(app)
FX = Path(__file__).resolve().parents[1] / "fixtures" / "cau_hoi" / "kinhdich_hieu_cau_dev.jsonl"
DEV = [json.loads(l) for l in FX.read_text(encoding="utf-8").splitlines() if l.strip()]
THOI = dt.datetime(2026, 11, 8, 10, 30)
KY_TE_H3 = [7, 8, 9, 8, 7, 8]


# ----------------------------------------------------------------------------- KB
def test_kb_384_hao_co_xu_huong_hop_le():
    for so in range(1, 65):
        for vt in range(1, 7):
            assert kb.xu_huong_hao(so, vt) in kb.XU_HUONG, (so, vt)
    for ma in kb.XU_HUONG:
        x = kb.xu_huong(ma)
        assert x["nghieng"] in kb.NGHIENG and x["vap"] and x["nen"] and x["y"], ma
    for k in kb.KIEU_CAU:
        assert set(kb.kieu_cau(k)["cau_dau"]) == set(kb.NGHIENG), k


def test_kb_khong_cum_cam_khong_giong_ai():
    for s in kb.moi_chuoi():
        assert not kb_ds.tim_cum_cam(s), (s, kb_ds.tim_cum_cam(s))


@pytest.mark.parametrize("han,vt,tag", [
    ("潛龍，勿用。", 1, "cho"), ("亢龍有悔。", 6, "ket"), ("比之匪人。", 3, "lui"), ("高宗伐鬼方，三年克之，小人勿用。", 3, "tien_giu")])
def test_vai_hao_tieu_bieu(han, vt, tag):
    from app.kb import kinhdich_kb as kbq
    so = next(s for s in range(1, 65) if (kbq.que_van(s) or {})["hao"][vt - 1]["han"] == han)
    assert kb.xu_huong_hao(so, vt) == tag


# ----------------------------------------------------------------------------- hiểu câu
def _hieu(cau: str) -> tuple[dict, dict, str]:
    pl = kd.phan_loai(cau)
    t = pl["cau_chuan_hoa"]
    ma = ds.chu_de_tu_cau(t)
    hc = ktl.hieu_cau(t, cau, ma)
    return hc, ktl.dung_than(hc), ma


def test_hieu_cau_bo_dev():
    """Nhãn viết TRƯỚC khi chạy engine (fixtures/cau_hoi/kinhdich_hieu_cau_dev.jsonl); ngưỡng chặn lùi."""
    dung = {"kieu": 0, "vai": 0, "chu_de": 0, "dung_than": 0}
    for r in DEV:
        hc, dt_, ma = _hieu(r["cau"])
        got = {"kieu": hc["kieu"], "vai": hc["vai"], "chu_de": ma, "dung_than": dt_["chinh"]}
        for k in dung:
            dung[k] += got[k] == r[k]
    n = len(DEV)
    assert dung["kieu"] >= 0.92 * n and dung["vai"] >= 0.96 * n and dung["chu_de"] >= 0.94 * n and dung["dung_than"] >= 0.94 * n, dung


@pytest.mark.parametrize("cau,chu_de,dung_than,vai", [
    ("Tôi đang bị bạn thân nợ 50 triệu, có đòi được không?", "tien_no", "Thê Tài", "ban_be"),   # tiền là việc, bạn là vai
    ("Con tôi năm nay thi đại học có đậu không?", "thi_cu", "Phụ Mẫu", "con"),                   # bài thi là việc, con là vai
    ("Vợ chồng tôi hay cãi nhau, có nên ly thân không?", "hon_nhan_tt", "Ứng", "vo_chong"),
    ("Mẹ tôi mổ lần này có ổn không?", "suc_khoe", "Phụ Mẫu", "cha_me"),                        # sức khoẻ CỦA MẸ → Phụ Mẫu
])
def test_dung_than_theo_viec_va_vai(cau, chu_de, dung_than, vai):
    hc, dt_, ma = _hieu(cau)
    assert (ma, dt_["chinh"], hc["vai"]) == (chu_de, dung_than, vai)
    if dung_than != kb.vai_luc_than(vai) and vai != "toi":
        assert dt_.get("vai") == kb.vai_luc_than(vai)           # người được hỏi hộ là hào phụ


def test_nghieng_kep_theo_muc():
    assert ktl.nghieng_nghia_ly("tien", "thuan") == "co"
    assert ktl.nghieng_nghia_ly("lui", "thuan") == "dieu_kien"          # chữ cát mà hào bảo lui → không nói "có"
    assert ktl.nghieng_nghia_ly("tien", "can_chu_dong") == "chua_voi"
    assert ktl.nghieng_nghia_ly("lui", "can_chu_dong") == "chua"
    assert ktl.nghieng_nghia_ly("tien", "can_bang") == "dieu_kien"
    assert ktl.nghieng_nghia_ly("cho", "can_bang") == "chua_voi"


# ----------------------------------------------------------------------------- đọc quẻ
def _doc(cau: str, vals=KY_TE_H3) -> dict:
    kq = kd.tra_loi(cau, gia_tri_hao=vals, thoi_diem=THOI, cach_ra_que="gieo_tay")
    assert kq["doc_que"], cau
    return kq


def test_cung_que_khac_cau_khac_tra_loi():
    cau = ["Tôi có nên nhận lời làm quản lý không?", "Con tôi năm nay thi đại học có đậu không?",
           "Bạn thân nợ tôi 50 triệu, có đòi được không?", "Khi nào tôi tìm được việc mới?", "Có nên mua căn hộ đang xem không?"]
    kl = [_doc(c)["doc_que"]["ket_luan"] for c in cau]
    assert len(set(kl)) == len(kl), kl
    for c, k in zip(cau, kl):
        assert "—" in k or ":" in k, k


def test_tra_loi_co_du_truong_va_hop_moi():
    kq = _doc("Con tôi năm nay thi đại học có đậu không?")
    dq = kq["doc_que"]
    tl = dq["tra_loi"]
    assert tl["kieu"] == "ket_qua" and tl["vai"] == "con" and tl["viec"] == "thi_cu"
    assert tl["nghieng"] in kb.NGHIENG and ktl.MUC_TU_NGHIENG[tl["nghieng"]] == dq["muc"]       # nghiêng không vượt mức
    assert tl["dung_than"]["chinh"] == "Phụ Mẫu" and tl["dung_than"].get("vai") == "Tử Tôn"
    assert tl["nguoi_kia"] and "con bạn" in tl["nguoi_kia"]["loi"]
    tieu_de = [h["tieu_de"] for h in dq["hop"]]
    assert "Phía con bạn" in tieu_de
    ma = [h["ma_mau"] for h in dq["hop"]]
    assert all(m.startswith("ds.kinhdich.thi_cu.") for m in ma) and len(set(ma)) == len(ma)
    assert any(".nguoi_kia.q63." in m for m in ma)
    # hộp cũ giữ mã cũ: cot_loi / luu_y / loi_khuyen / thoi_diem theo mức
    assert f"ds.kinhdich.thi_cu.cot_loi.q63.{dq['muc']}" in ma
    # đoạn mở đầu nói đúng điều hỏi, có lý do riêng
    assert kq["cau_tra_loi"].startswith("Về chuyện") and "hào đại diện cho bài thi" in kq["cau_tra_loi"]


def test_cau_nguoi_kia_doc_the_ung():
    kq = kd.tra_loi("Người ấy có thật lòng với tôi không?", gia_tri_hao=KY_TE_H3, thoi_diem=THOI, cach_ra_que="gieo_tay")
    assert kq["can_lam_ro"] and kq["can_lam_ro"]["ma"] == "tinh_cam"      # chưa rõ giới người ấy → vẫn hỏi lại trước khi gieo
    kq = kd.tra_loi("Anh ấy có thật lòng với tôi không?", gia_tri_hao=KY_TE_H3, thoi_diem=THOI, cach_ra_que="gieo_tay")
    assert kq["can_lam_ro"] is None and kq["chu_de"]["ma"] == "tinh_cam_nam"   # "anh ấy" → giới đã rõ, không hỏi lại
    tl = kq["doc_que"]["tra_loi"]
    assert tl["kieu"] == "nguoi_kia" and tl["dung_than"]["chinh"] == "Quan Quỷ"
    assert tl["nguoi_kia"] and tl["nguoi_kia"]["quan_he"] in ("ung_sinh_the", "the_sinh_ung", "ung_khac_the", "the_khac_ung", "ty_hoa", "phuc")
    assert "người ấy" in kq["doc_que"]["ket_luan"]


def test_khong_lo_chu_nguoi_dung_va_giong_van():
    la = "xyzzy quán bún bò của tôi"
    kq = _doc(f"Có nên mở {la} ở phố này không?")
    van = json.dumps(kq["doc_que"], ensure_ascii=False)
    assert "xyzzy" not in van and "bún bò" not in van
    lop = " ".join([kq["doc_que"]["ket_luan"], *(h["noi_dung"] for h in kq["doc_que"]["hop"]), *kq["doc_que"]["doan"]])
    assert not kb_ds.tim_cum_cam(lop), kb_ds.tim_cum_cam(lop)


def test_api_hieu_cau():
    r = client.post("/v1/kinhdich/hieu-cau", json={"cau_hoi": "Con tôi năm nay thi đại học có đậu không?"})
    assert r.status_code == 200
    d = r.json()
    assert d["gieo"] and d["chu_de"]["ma"] == "thi_cu" and d["kieu"] == "ket_qua" and d["vai"] == "con" and d["dung_than"] == "Phụ Mẫu"
    assert "thi đại học" not in json.dumps(d, ensure_ascii=False)
    r = client.post("/v1/kinhdich/hieu-cau", json={"cau_hoi": "Người ấy có thật lòng với tôi không?"})
    assert r.json()["can_lam_ro"]["ma"] == "tinh_cam"
    r = client.post("/v1/kinhdich/hieu-cau", json={"cau_hoi": "Anh ấy có thật lòng với tôi không?"})
    assert r.json()["can_lam_ro"] is None and r.json()["chu_de"]["ma"] == "tinh_cam_nam" and r.json()["kieu"] == "nguoi_kia"
    r = client.post("/v1/kinhdich/hieu-cau", json={"cau_hoi": "Quẻ Càn có ý nghĩa gì?"})
    assert r.json()["gieo"] is False and r.json()["loai"] == "ky_thuat"


def test_chu_de_moi_hon_nhan_tt():
    m = kb_ds.chu_de("hon_nhan_tt")
    assert m and m["hoi_dung_than"] and set(m["hanh_dong"]) == {"thuan", "can_bang", "can_chu_dong"}
    assert ds.chu_de_tu_cau(chung.chuan_hoa("Chồng tôi ngoại tình, có nên tha thứ không?")) == "hon_nhan_tt_nam"
    assert ds.chu_de_tu_cau(chung.chuan_hoa("Vợ chồng tôi hay cãi nhau, có nên ly thân không?")) == "hon_nhan_tt"
    assert ds.chu_de_tu_cau(chung.chuan_hoa("Có nên cưới vào cuối năm nay không?")) == "hon_nhan"


# ----------------------------------------------------------------------------- hướng C — AI diễn đạt phần trả lời
def test_dien_dat_khong_khoa_giu_mau(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    kq = _doc("Con tôi năm nay thi đại học có đậu không?")
    assert ktl.dien_dat(kq["doc_que"])["dien_dat"] == "mau"


def test_dien_dat_qua_kiem_va_khong_lo_cau_nguoi_dung(monkeypatch):
    from app.narrative import ai_goi
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    goi: list = []
    la = "zyxw bún bò huế của tôi ở phố Hàng Mã"
    kq = kd.tra_loi(f"Có nên mở {la} không?", gia_tri_hao=KY_TE_H3, thoi_diem=THOI, cach_ra_que="gieo_tay")
    dq = kq["doc_que"]
    nguon = "\n".join(ktl.nguon_dien_dat(dq))
    assert "zyxw" not in nguon and "Hàng Mã" not in nguon                       # câu người dùng không vào lời nhắc

    def gia(messages, **k):
        goi.append(messages)
        return nguon.split("\n")[0] + " " + " ".join(nguon.split("\n")[1:3])    # bản AI chỉ dùng ý có sẵn
    monkeypatch.setattr(ai_goi, "goi_chat", gia)
    ra = ktl.dien_dat(dq)
    assert ra["dien_dat"] == "tra_loi" and ra["tra_loi"]["van_ai"]
    assert "zyxw" not in json.dumps(goi, ensure_ascii=False) and "Kinh Dịch" in goi[0][0]["content"]
    # bản AI thêm con số / cụm doạ → bộ kiểm chặn, giữ bản mẫu
    monkeypatch.setattr(ai_goi, "goi_chat", lambda m, **k: "Bạn sẽ chắc chắn thành công trong 3 tháng tới.")
    ra2 = ktl.dien_dat(dq)
    assert ra2["dien_dat"] == "mau" and ra2.get("dien_dat_loi")
    assert "van_ai" not in (ra2.get("tra_loi") or {})
    monkeypatch.setattr(ai_goi, "goi_chat", lambda m, **k: (_ for _ in ()).throw(RuntimeError("mạng")))
    assert ktl.dien_dat(dq)["dien_dat"] == "mau"


def test_api_hoi_dien_dat_co_truong(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = client.post("/v1/kinhdich/hoi", json={"cau_hoi": "Có nên mua căn hộ đang xem không?", "cach_ra_que": "gieo_tay",
                                              "gia_tri_hao": KY_TE_H3, "dien_dat": True})
    assert r.status_code == 200 and r.json()["doc_que"]["dien_dat"] == "mau"
