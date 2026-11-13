# -*- coding: utf-8 -*-
"""EN-AI — lớp phân loại AI cho câu gõ tự do tiếng Anh (narrative/phan_loai_en.py): đọc nhãn, luật hợp nhất với bộ luật
(an toàn chỉ NÂNG, ý định chỉ khi luật độ tin thấp), rơi về luật khi lỗi / hết giờ, không chạm bản Việt. AI giả lập —
không gọi mạng."""
from __future__ import annotations

import time

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.hoidap import battu, en_gloss, tuvi
from app.luangiai import an_toan as at
from app.luangiai import nhan_ngoai
from app.main import app
from app.narrative import ai_goi
from app.narrative import phan_loai_en as pl_en

THUONG = "Should I take the plunge with the bakery idea?"          # luật: độ tin thấp (rơi về mặc định)
RO = "What does my chart say about my love life?"                  # luật: tự tin (tình duyên)
KH_LUAT = "I want to end my life, what does my chart say?"           # luật: khủng hoảng


@pytest.fixture
def en():
    tk = ngon_ngu.HIEN_TAI.set("en")
    yield
    ngon_ngu.HIEN_TAI.reset(tk)


@pytest.fixture
def ai(monkeypatch):
    """Bật lớp AI + khoá giả; `ai.tra` = chuỗi mô hình trả (hoặc Exception / hàm). Đếm số lần gọi."""
    monkeypatch.setenv("HOI_PHAN_LOAI_AI", "1")
    monkeypatch.setenv("OPENROUTER_API_KEY", "gia")
    pl_en.xoa_nho()

    class _AI:
        tra: object = '{"an_toan": "binh_thuong", "y_dinh": "khac", "nam": null}'
        goi: list = []

    def gia(messages, **kw):
        _AI.goi.append((messages, kw))
        t = _AI.tra
        if isinstance(t, Exception):
            raise t
        return t() if callable(t) else t

    _AI.goi = []
    monkeypatch.setattr(ai_goi, "goi_chat", gia)
    yield _AI
    pl_en.xoa_nho()


# ------------------------------------------------------------------ đọc nhãn (thuần)

def test_doc_nhan_hop_le():
    assert pl_en.doc_nhan('{"an_toan": "khung_hoang", "y_dinh": "tien_bac", "nam": 2027}', "battu") == {
        "an_toan": "khung_hoang", "y_dinh": "tien_bac", "nam": 2027}
    assert pl_en.doc_nhan('```json\n{"an_toan":"tu_choi:may_rui","y_dinh":"khac","nam":null}\n```', "tuvi") == {
        "an_toan": "tu_choi", "tu_choi": "may_rui"}


def test_doc_nhan_bo_nhan_ngoai_danh_muc():
    assert pl_en.doc_nhan('{"an_toan": "nguy_hiem", "y_dinh": "xo_so", "nam": 1700}', "battu") is None
    assert pl_en.doc_nhan('{"an_toan": "tu_choi:la_gi", "y_dinh": "su_nghiep", "nam": true}', "battu") == {
        "an_toan": "tu_choi", "tu_choi": "ngoai_pham_vi", "y_dinh": "su_nghiep"}
    assert pl_en.doc_nhan("Sure! This question is about money.", "battu") is None
    assert pl_en.doc_nhan("{not json}", "battu") is None
    assert pl_en.doc_nhan(None, "battu") is None  # type: ignore[arg-type]


def test_loi_nhac_chi_mang_cau_hoi():
    m = pl_en.loi_nhac("x" * 900, "battu")
    assert [x["role"] for x in m] == ["system", "user"]
    assert m[1]["content"] == "<q>" + "x" * 500 + "</q>"
    for k in pl_en.danh_muc("battu"):
        assert f"- {k}:" in m[0]["content"]


@pytest.mark.parametrize("mang", ["battu", "tuvi"])
def test_moi_chu_de_dinh_tuyen_dung(en, mang):
    """Mỗi mã chủ đề trong danh mục → cụm từ khoá → luật của mảng nhận ĐÚNG chủ đề, độ tin không còn thấp."""
    mong = {"battu": {"tinh_cach": "tinh_cach", "su_nghiep": "nghe_tien", "tien_bac": "nghe_tien", "tinh_cam": "hon_nhan",
                      "gia_dinh": "gia_dinh", "con_cai": "con_cai", "suc_khoe": "loi_song", "hoc_hanh": "hoc_hanh",
                      "di_xa": "di_xa", "nha_cua": "nghe_tien", "phap_ly": "phap_ly", "ban_be": "quan_he",
                      "hau_van": "hau_van", "ngu_hanh": "ngu_hanh", "van_nam": "van"},
            "tuvi": {"tinh_cach": "Mệnh", "su_nghiep": "Quan Lộc", "tien_bac": "Tài Bạch", "tinh_cam": "Phu Thê",
                     "gia_dinh": "Phụ Mẫu", "con_cai": "Tử Nữ", "suc_khoe": "Tật Ách", "hoc_hanh": "Quan Lộc",
                     "di_xa": "Thiên Di", "nha_cua": "Điền Trạch", "phap_ly": "Nô Bộc", "ban_be": "Nô Bộc",
                     "hau_van": "Phúc Đức", "ngu_hanh": "Mệnh", "van_nam": "han"}}[mang]
    assert set(mong) == set(en_gloss.Y_DINH_CUM[mang])
    mod = battu if mang == "battu" else tuvi
    for yd, cho in mong.items():
        with nhan_ngoai.dung(THUONG, {"y_dinh": yd, "nam": 2027 if yd == "van_nam" else None}):
            kq = mod.phan_loai(THUONG)
        assert not kq.get("do_tin_thap"), yd
        assert kq.get("y_dinh_ngoai") == yd
        if mang == "battu":
            assert (kq["loai"] if yd == "van_nam" else kq["chu_de"]) == cho, yd
        else:
            assert (kq["loai"] if yd == "van_nam" else kq["cung"][0]) == cho, yd
        if yd == "van_nam":
            assert kq["nam_xem"] == 2027


# ------------------------------------------------------------------ luật hợp nhất

def test_y_dinh_ai_chi_dung_khi_luat_do_tin_thap(en):
    with nhan_ngoai.dung(RO, {"y_dinh": "tien_bac"}):
        kq = battu.phan_loai(RO)
    assert kq["chu_de"] == "hon_nhan" and "y_dinh_ngoai" not in kq
    assert battu.phan_loai(THUONG).get("do_tin_thap")          # không nhãn: như cũ
    with nhan_ngoai.dung("câu khác", {"y_dinh": "tien_bac"}):   # nhãn của câu khác: không áp
        assert battu.phan_loai(THUONG).get("do_tin_thap")


def test_an_toan_chi_nang_khong_ha(en):
    with nhan_ngoai.dung(THUONG, {"an_toan": "khung_hoang"}):
        assert battu.phan_loai(THUONG)["xu_ly"] == "an_toan"
        assert tuvi.phan_loai(THUONG)["xu_ly"] == "an_toan"
    assert battu.phan_loai(KH_LUAT)["xu_ly"] == "an_toan"
    with nhan_ngoai.dung(KH_LUAT, {"an_toan": "binh_thuong", "y_dinh": "tien_bac"}):
        assert battu.phan_loai(KH_LUAT)["xu_ly"] == "an_toan"
        assert tuvi.phan_loai(KH_LUAT)["xu_ly"] == "an_toan"
        assert not at.ho_tro_mem_en(KH_LUAT)


def test_cap_cuu_tu_choi_ho_tro_mem(en):
    with nhan_ngoai.dung(THUONG, {"an_toan": "cap_cuu"}):
        assert battu.phan_loai(THUONG)["xu_ly"] == "tu_choi_nhe"
        assert at.nhom_suc_khoe(THUONG) == "cap_cuu"
    with nhan_ngoai.dung(THUONG, {"an_toan": "tu_choi", "tu_choi": "may_rui"}):
        assert tuvi.phan_loai(THUONG)["xu_ly"] == "tu_choi_nhe"
        assert at.tu_choi(THUONG) == "may_rui"
    with nhan_ngoai.dung(THUONG, {"an_toan": "ho_tro_mem", "y_dinh": "su_nghiep"}):
        kq = battu.phan_loai(THUONG)
        assert kq["xu_ly"] in ("tra_loi", "tra_loi_kem_luu_y") and kq["chu_de"] == "nghe_tien"
        assert at.ho_tro_mem_en(THUONG)
    assert not at.ho_tro_mem_en(THUONG) and at.tu_choi(THUONG) is None and not at.cap_cuu(THUONG)


# ------------------------------------------------------------------ gọi AI (giả lập): bật / tắt / lỗi / hết giờ

def test_ap_dung_bat_dung_nhan(en, ai):
    ai.tra = '{"an_toan": "binh_thuong", "y_dinh": "su_nghiep", "nam": null}'
    with pl_en.ap_dung(THUONG, "battu", True) as n:
        assert n == {"an_toan": "binh_thuong", "y_dinh": "su_nghiep"}
        assert battu.phan_loai(THUONG)["chu_de"] == "nghe_tien"
    assert battu.phan_loai(THUONG).get("do_tin_thap")       # ra khỏi lượt: nhãn hết
    kw = ai.goi[0][1]
    assert kw["het_gio"] <= 2 and kw["thu_lai"] is False and kw["nho"] is False and kw["mo_hinh"]


def test_bo_nho_ngan_khoa_bam_khong_luu_chu(en, ai):
    ai.tra = '{"an_toan": "binh_thuong", "y_dinh": "tien_bac", "nam": null}'
    pl_en.phan_loai(THUONG, "battu")
    pl_en.phan_loai(THUONG, "battu")
    assert len(ai.goi) == 1
    for k, (_, v) in pl_en._NHO.items():
        assert len(k) == 64 and "bakery" not in k and "bakery" not in str(v)


@pytest.mark.parametrize("cach", ["tat_env", "khong_cong_tac", "viet", "cau_viet"])
def test_khong_goi_ai_khi_tat(ai, monkeypatch, cach):
    cau, cong_tac = THUONG, True
    if cach == "tat_env":
        monkeypatch.setenv("HOI_PHAN_LOAI_AI", "0")
    if cach == "khong_cong_tac":
        cong_tac = False
    tk = ngon_ngu.HIEN_TAI.set("vi" if cach == "viet" else "en")
    if cach == "cau_viet":
        cau = "Năm nay công việc của tôi thế nào?"
    try:
        with pl_en.ap_dung(cau, "battu", cong_tac) as n:
            assert n is None
    finally:
        ngon_ngu.HIEN_TAI.reset(tk)
    assert ai.goi == []


@pytest.mark.parametrize("loi", [RuntimeError("mạng"), "khong phai json", '{"an_toan": "???"}'])
def test_loi_roi_ve_luat(en, ai, loi):
    ai.tra = loi
    with pl_en.ap_dung(THUONG, "battu", True) as n:
        assert n is None
        kq = battu.phan_loai(THUONG)
    assert kq.get("do_tin_thap") and kq["xu_ly"] == "tra_loi"


def test_het_luot_rl1_roi_ve_luat(en, ai):
    from app.narrative.ngan_sach import HetLuot
    ai.tra = HetLuot("het")
    assert pl_en.phan_loai(THUONG, "battu") is None


def test_han_chot_2_giay(en, ai, monkeypatch):
    monkeypatch.setattr(pl_en, "HET_GIO", 0.2)
    ai.tra = lambda: (time.sleep(1.0), '{"an_toan": "khung_hoang"}')[1]
    t0 = time.monotonic()
    assert pl_en.phan_loai(THUONG, "battu") is None
    assert time.monotonic() - t0 < 0.8


# ------------------------------------------------------------------ route (TestClient): header công tắc + env

def _hoi(c, duong, cau, **dau):
    return c.post(duong, json={"cau_hoi": cau, "ngay_xem": "2026-11-10"}, headers={"x-ngon-ngu": "en", **dau}).json()


@pytest.mark.parametrize("duong", ["/v1/battu/hoi", "/v1/tuvi/hoi"])
def test_route_ai_nang_khung_hoang(ai, duong):
    ai.tra = '{"an_toan": "khung_hoang", "y_dinh": "khac", "nam": null}'
    c = TestClient(app)
    assert _hoi(c, duong, THUONG)["phan_loai"]["xu_ly"] != "an_toan"            # thiếu header công tắc: tắt
    assert ai.goi == []
    assert _hoi(c, duong, THUONG, **{"x-phan-loai-ai": "1"})["phan_loai"]["xu_ly"] == "an_toan"
    assert len(ai.goi) == 1
    v = c.post(duong, json={"cau_hoi": "Năm nay tôi thế nào?", "ngay_xem": "2026-11-10"},
               headers={"x-phan-loai-ai": "1"}).json()                          # bản Việt: không bao giờ gọi
    assert len(ai.goi) == 1 and v["phan_loai"]["xu_ly"] != "an_toan"


def test_route_khong_khoa_khong_loi(monkeypatch):
    monkeypatch.setenv("HOI_PHAN_LOAI_AI", "1")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = TestClient(app).post("/v1/battu/hoi", json={"cau_hoi": THUONG}, headers={"x-ngon-ngu": "en", "x-phan-loai-ai": "1"})
    assert r.status_code == 200 and r.json()["hoi_lai"]


# ------------------------------------------------------------------ câu gợi ý đầu khung (chip bản Anh)

@pytest.mark.parametrize("mang", ["battu", "tuvi"])
def test_cau_goi_y_dau_dinh_tuyen_ro(en, mang):
    """Chip bản Anh: 4–6 câu, không chữ Việt, mỗi câu luật nhận ra chủ đề (không rơi về mặc định, không bị chặn)."""
    from app.luangiai import truc_quan
    ds = truc_quan.goi_y_dau(mang)
    assert 4 <= len(ds) <= 6 and len(set(ds)) == len(ds)
    mod = battu if mang == "battu" else tuvi
    for c in ds:
        assert not en_gloss.la_cau_viet(c) and all(ord(ch) < 128 for ch in c), c
        kq = mod.phan_loai(c)
        assert kq["xu_ly"] in ("tra_loi", "tra_loi_kem_luu_y") and not kq.get("do_tin_thap"), (c, kq.get("loai"))


def test_route_goi_y_dau():
    c = TestClient(app)
    en_ds = c.get("/v1/hoi/goi-y", params={"mang": "battu"}, headers={"x-ngon-ngu": "en"}).json()["cau"]
    vi_ds = c.get("/v1/hoi/goi-y", params={"mang": "battu"}).json()["cau"]
    assert len(en_ds) == len(vi_ds) == 6 and en_ds != vi_ds
    assert c.get("/v1/hoi/goi-y", params={"mang": "la"}).json()["cau"] == []
