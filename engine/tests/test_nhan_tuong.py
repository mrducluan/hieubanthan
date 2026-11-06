# -*- coding: utf-8 -*-
"""NT-1 — Nhân tướng học (test viết TRƯỚC hàm theo quy tắc code): KB, CALC, RULES, hỏi đáp, API, an toàn, giọng văn, trang KB."""
from __future__ import annotations

import base64
import datetime as dt
import json

import pytest
from fastapi.testclient import TestClient

from app.calc import nhan_tuong as calc
from app.kb import nhan_tuong_kb as kb
from app.kb import trang
from app.luangiai import doi_song_khuon as kh
from app.luangiai import nhan_tuong as nt
from app.main import app
from app.narrative import doc_anh_mat as dam

client = TestClient(app)
XEM = dt.date(2026, 11, 6)

TL_DAY = {  # một bộ trả lời "thuận" nhiều nét + vài nét cần chăm
    "khuon_mat": "vuong", "tam_dinh": "can_doi", "sac_tong": "sang_nhuan", "cot_nhuc": "san_chac", "tran": "cao_rong_day", "nep_tran": "khong",
    "nhat_nguyet_giac": "day_can", "long_may": "thanh_dai", "dien_trach": "rong_day", "an_duong": "rong_sang", "mat_hinh": "dai_hep",
    "mat_than": "dinh_sang", "tam_bach": "khong", "le_duong": "tham_quang", "ngu_vi": "phang_sang", "son_can": "nep_ngang", "song_mui": "thang_cao",
    "chuan_dau": "tron_day", "canh_mui": "day_kin", "luong_quyen": "cao_co_thit", "nhan_trung": "sau_dai", "phap_lenh": "ro_mo",
    "mieng": "rong_khoe_len", "moi_sac": "hong_nhuan", "cam": "tron_day", "ham": "day_vung", "tai": "cao_day", "cham_cot": "noi_tron",
    "giong": "tram_vang", "net_mat": "de_gan", "dang": "vung_thang",
}


# ------------------------------------------------------------------ KB
def test_kb_du_va_khop():
    d = kb._d()
    assert d["can_doi_chieu"] is True and d["trang_thai"] == "nhap_ai"
    assert len(kb.cau_hoi()) >= 30 and len(kb.dac_diem()) >= 100 and len(kb.luu_nien()) == 100 and len(kb.bo_vi()) >= 24
    cau = {c["ma"]: {l["ma"] for l in c["lua_chon"]} for c in kb.cau_hoi()}
    for ma, dd in kb.dac_diem().items():
        assert dd["bo_vi"] in kb.bo_vi(), ma
        assert dd["truong_phai"] in kb.truong_phai(), ma
        for q, opts in dd["dieu_kien"].items():
            assert set(opts) <= cau[q], (ma, q)
        assert dd["viec"] and dd["noi_dung"] and dd["tieu_de"]
        assert dd.get("muc") in (None, "thuan", "can_bang", "can_chu_dong")
        assert set(dd["chuong"]) <= set(kb.chuong())
    # mọi lựa chọn (trừ không chắc) đều có ít nhất một đặc điểm đơn → không câu nào "hỏi rồi bỏ"
    co = {(q, o) for dd in kb.dac_diem().values() if len(dd["dieu_kien"]) == 1 for q, opts in dd["dieu_kien"].items() for o in opts}
    thieu = [(q, o) for q, opts in cau.items() for o in opts if o != "khong_chac" and (q, o) not in co]
    assert not thieu, thieu
    assert [x["tuoi"] for x in kb.luu_nien()] == list(range(1, 101))


def test_kb_khong_ten_benh_khong_doa():
    """SK-1 + cum_cam: lớp đời thường của KB (tiêu đề, nội dung, việc, lời ngũ hình, khí sắc, mẫu) sạch cụm cấm."""
    from app.kb.tuvi_doi_song_kb import tim_cum_cam
    from app.luangiai import suc_khoe_nam as skn
    ds = kh.cum_cam_chung() + kb.cum_cam()
    van = []
    for dd in kb.dac_diem().values():
        van += [dd["tieu_de"], dd["noi_dung"], dd["viec"]]
    for x in kb.ngu_hinh().values():
        van += [x["loi"], x["hop"], x["viec"]]
    for x in kb.khi_sac().values():
        van += [x["loi"]]
    for x in kb.not_ruoi().values():
        van += [x["loi"]]
    for k, v in kb._d()["mau"].items():
        if isinstance(v, str):
            van.append(v)
        elif isinstance(v, dict):
            van += [x for x in v.values() if isinstance(x, str)]
    loi = [(c, s[:80]) for s in van for c in tim_cum_cam(s, ds)]
    assert not loi, loi[:10]
    loi_sk = [(c, s[:80]) for s in van for c in skn.kiem(s)]
    assert not loi_sk, loi_sk[:10]


# ------------------------------------------------------------------ CALC
def test_khop_dac_diem_tat_dinh_va_uu_tien():
    a = calc.khop_dac_diem(TL_DAY)
    assert a == calc.khop_dac_diem(dict(reversed(list(TL_DAY.items()))))
    assert "tam_dinh_can" in a and "chuan_dau_tron" in a and "son_can_nep" in a
    assert a.index("tam_dinh_can_chuan_dau_day") < a.index("tam_dinh_can")     # tổ hợp (ưu tiên 3) đứng trước nét đơn
    assert calc.khop_dac_diem({"tam_dinh": "khong_chac"}) == []
    assert calc.khop_dac_diem({"cau_la": "x", "tam_dinh": "can_doi"}) == ["tam_dinh_can"]


def test_ngu_hinh():
    assert calc.ngu_hinh({"khuon_mat": "vuong", "sac_tong": "trang_bech"})["hinh"] == "kim"
    assert calc.ngu_hinh({"khuon_mat": "vuong"})["hinh"] == "pha"                       # 1 điểm chưa đủ
    assert calc.ngu_hinh({"khuon_mat": "vuong", "sac_tong": "do_ung", "giong": "cao_nhanh", "dang": "nhanh_hap_tap"})["hinh"] == "hoa"
    assert calc.ngu_hinh({})["hinh"] == "pha"
    nh = calc.ngu_hinh(TL_DAY)
    assert nh["hinh"] == "tho" and nh["troi"][0] == "tho"


def test_luu_nien_nam_ta_nu_huu():
    assert calc.luu_nien(28, "nam")["ten"] == "Ấn Đường"
    assert calc.luu_nien(41, "nu")["bo_vi"] == "son_can"
    assert calc.luu_nien(1, "nam")["ben"] == "trai" and calc.luu_nien(1, "nu")["ben"] == "phai"
    assert calc.luu_nien(46, "nam")["ben"] == "trai" and calc.luu_nien(46, "nu")["ben"] == "phai"
    assert calc.luu_nien(101, "nam")["vi"] == 1 and calc.luu_nien(0, "nam") is None
    assert calc.luu_nien(76, "nam")["ten"].startswith("Vị Tý")


def test_tam_dinh_tu_diem():
    p = lambda y: {"x": 0.5, "y": y}  # noqa: E731
    r = calc.tam_dinh_tu_diem({"chan_toc": p(0.1), "an_duong": p(0.4), "chuan_dau": p(0.7), "cam": p(1.0)})
    assert r["lua_chon"] == "can_doi" and abs(r["thuong"] - 1 / 3) < 0.01
    r = calc.tam_dinh_tu_diem({"chan_toc": p(0.0), "an_duong": p(0.45), "chuan_dau": p(0.72), "cam": p(1.0)})
    assert r["lua_chon"] == "tran_dai"
    r = calc.tam_dinh_tu_diem({"chan_toc": p(0.0), "an_duong": p(0.36), "chuan_dau": p(0.72), "cam": p(0.92)})
    assert r["lua_chon"] == "cam_ngan"
    # phần giữa ngắn nhất: không có "mũi ngắn" trong khảo sát → gọi tên phần ngoài dài hơn, KHÔNG BAO GIỜ "mui_dai"
    r = calc.tam_dinh_tu_diem({"chan_toc": p(0.10), "an_duong": p(0.42), "chuan_dau": p(0.60), "cam": p(0.95)})
    assert r["lua_chon"] == "cam_dai"
    assert calc.tam_dinh_tu_diem({"chan_toc": p(0.5), "an_duong": p(0.4), "chuan_dau": p(0.7), "cam": p(1.0)}) is None


def test_gop_muc_khong_diem_so():
    assert calc.gop_muc(["thuan", "thuan"]) == "thuan"
    assert calc.gop_muc(["thuan", "can_chu_dong"]) == "can_bang"
    assert calc.gop_muc(["can_chu_dong", "can_chu_dong", "thuan"]) == "can_chu_dong"
    assert calc.gop_muc([None, "can_bang"]) == "can_bang" and calc.gop_muc([None]) is None


# ------------------------------------------------------------------ RULES: báo cáo
def test_bao_cao_khuon_doi_song():
    bc = nt.bao_cao(TL_DAY, nam_sinh=1988, gioi_tinh="nam", ngay_xem=XEM)
    assert bc["mo_dun"] == "nhantuong" and bc["phien_ban"] == "doi_song_1" and bc["phai"] == "nhan_tuong_tong_hop"
    ma = [c["ma"] for c in bc["chuong"]]
    assert ma == kb.thu_tu_chuong()
    assert kh.kiem_giong_van(bc) == [], kh.kiem_giong_van(bc)
    assert 1 <= len(bc["cot_loi"]) <= 4 and all(h.get("tu_chuong") for h in bc["cot_loi"])
    for c in bc["chuong"]:
        for h in c.get("hop", []):
            assert h["ma_mau"].startswith("ds.nhantuong.") and h.get("phai") and h["phai"] in (*kb.truong_phai(), "nhan_tuong_tong_hop")
            assert len(h["ma_mau"]) <= 60
            if h["loai"] == "luu_y":
                assert h.get("huong_xu_ly")
    # mã kiểm chứng không trùng trong một chương
    for c in bc["chuong"]:
        ms = [h["ma_mau"] for h in c.get("hop", [])]
        assert len(ms) == len(set(ms)), c["ma"]
    tq = bc["chuong"][0]
    assert tq["muc"] in ("thuan", "can_bang") and tq["hop"][0]["tieu_de"].startswith("Dáng mặt")
    assert bc["da_tinh"]["ngu_hinh"]["hinh"] == "tho" and bc["da_tinh"]["so_cau"] == len(TL_DAY)
    sk = next(c for c in bc["chuong"] if c["ma"] == "suc_khoe")
    assert sk["mien_tru"] and sk["muc"] == "can_bang"               # lệ đường thâm + sơn căn nếp (lưu ý) bên cạnh sắc sáng, môi hồng (thuận)
    assert sum(1 for h in sk["hop"] if h["loai"] == "luu_y") >= 2
    assert any("tim mạch" in h["noi_dung"] or "thận" in h["noi_dung"] for h in sk["hop"])
    nn = next(c for c in bc["chuong"] if c["ma"] == "nam_nay")
    ln = nn["luu_nien"]
    assert ln["nam_am_xem"] == 2026 and ln["tuoi_mu"] == 2026 - 1988 + 1 and ln["nam_nay"]["ten"] == "Thiếu Dương"
    assert len(ln["toi"]) == 3 and nn["hop"][0]["loai"] == "thoi_diem"
    tls = next(c for c in bc["chuong"] if c["ma"] == "tuong_va_la_so")
    assert tls["thieu"] and not tls["hop"]
    lk = next(c for c in bc["chuong"] if c["ma"] == "loi_khuyen")
    assert 3 <= len(lk["hop"]) <= 7 and all(h["loai"] == "loi_khuyen" for h in lk["hop"])


def test_bao_cao_it_du_lieu_khong_vo():
    bc = nt.bao_cao({}, ngay_xem=XEM)
    assert bc["chuong"] and bc["da_tinh"]["ngu_hinh"]["hinh"] == "pha"
    assert kh.kiem_giong_van(bc) == []
    assert any(c.get("thieu") for c in bc["chuong"])
    bc2 = nt.bao_cao({"tam_dinh": "cam_ngan"}, nam_sinh=dt.date(2000, 2, 1), gioi_tinh="nu", ngay_xem=XEM)
    assert bc2["chuong"][0]["muc"] == "can_bang"
    # 01/02/2000 trước Tết Canh Thìn (05/02/2000) → năm âm sinh 1999 → tuổi mụ 28 → Ấn Đường
    assert next(c for c in bc2["chuong"] if c["ma"] == "nam_nay")["luu_nien"]["nam_nay"]["ten"] == "Ấn Đường"


def test_bao_cao_tuong_va_la_so():
    bt = {"cach_1": {"hanh": ["Hỏa", "Thổ"]}, "cach_2": {"hanh": ["Kim"]}}
    bc = nt.bao_cao({"khuon_mat": "vuong", "sac_tong": "trang_bech"}, battu=bt, ngay_xem=XEM)   # Kim hình
    c = next(c for c in bc["chuong"] if c["ma"] == "tuong_va_la_so")
    assert len(c["hop"]) == 2
    assert "hậu thiên nuôi" in c["hop"][0]["noi_dung"] or "sinh" in c["hop"][0]["ma_mau"]     # Kim sinh Thủy? không — Kim vs Hỏa/Thổ: Thổ sinh Kim → được sinh
    assert c["hop"][1]["ma_mau"].endswith(".trung")                                              # Kim với Kim → trùng
    bc2 = nt.bao_cao({}, battu=bt, ngay_xem=XEM)
    assert not next(c for c in bc2["chuong"] if c["ma"] == "tuong_va_la_so")["hop"]              # hình pha → chỉ đoạn


def test_ap_hoc_ha_hop():
    bc0 = nt.bao_cao(TL_DAY, ngay_xem=XEM)
    m = bc0["chuong"][0]["hop"][1]["ma_mau"]
    bc = nt.bao_cao(TL_DAY, ngay_xem=XEM, trong_so={m: {"dung": 10, "chua_dung": 120}})
    assert m not in [h["ma_mau"] for h in bc["chuong"][0]["hop"]]
    assert any("Đang xem lại" in x for x in bc["chuong"][0]["can_cu"])


# ------------------------------------------------------------------ hỏi đáp
def test_hoi_bo_vi_va_not_ruoi_va_luu_nien():
    r = nt.hoi("Ấn Đường rộng nghĩa là gì?")
    assert r["bo_vi"] == "an_duong" and "Ấn Đường" in r["cau_tra_loi"] and r["vung"] == ["an_duong"] and r["xu_ly"] == "tra_loi"
    r2 = nt.hoi("an duong cua toi nghia la gi", TL_DAY)
    assert "Theo điều bạn đã tự quan sát" in r2["cau_tra_loi"] and "Ấn Đường rộng, sáng" in r2["cau_tra_loi"]
    r3 = nt.hoi("nốt ruồi ở cằm có ý nghĩa gì")
    assert r3["xu_ly"] == "not_ruoi" and "đất đai" in r3["cau_tra_loi"] and "da liễu" in r3["cau_tra_loi"]
    r4 = nt.hoi("Năm nay tôi 41 tuổi xem ở đâu?", gioi_tinh="nu")
    assert r4["xu_ly"] == "luu_nien" and "Sơn Căn" in r4["cau_tra_loi"]
    r5 = nt.hoi("cung Tài Bạch nói về gì")
    assert r5["bo_vi"] in ("chuan_dau", "canh_mui", "mieng")
    r6 = nt.hoi("mũi tôi hay bị bệnh gì không")
    assert r6["xu_ly"] in ("tu_choi_nhe", "tra_loi")        # SK-1: không đoán bệnh (chặn chung hoặc lời "không đoán bệnh")
    assert "bệnh" not in r6["cau_tra_loi"].lower() or "không đoán bệnh" in r6["cau_tra_loi"] or "đi khám" in r6["cau_tra_loi"]
    r7 = nt.hoi("xyz abc")
    assert r7["xu_ly"] == "khong_hieu" and r7["hoi_tiep"]
    # review: không gõ số → tuổi mụ từ hồ sơ (câu gợi ý của chính engine phải trả lời được)
    r8 = nt.hoi("Năm nay tuổi của tôi xem ở đâu?", nam_sinh=1988, gioi_tinh="nam", ngay_xem=XEM)
    assert r8["xu_ly"] == "luu_nien" and "tuổi mụ" in r8["cau_tra_loi"].lower()
    assert nt.hoi("Năm nay tuổi của tôi xem ở đâu?")["xu_ly"] == "khong_hieu"      # không có hồ sơ → không đoán
    # review: "cũng" (bỏ dấu = "cung") không được kéo sang nhánh 12 cung
    r9 = nt.hoi("Sơn Căn thấp cũng ảnh hưởng mệnh không?")
    assert r9["bo_vi"] == "son_can"


def test_hoi_khong_xem_nguoi_khac_khong_tuyen_dung_khong_sua_tuong():
    for cau in ("Sếp tôi mũi to có nghĩa gì?", "xem tướng cho bạn gái tôi", "nhìn mặt người đó có tin được không"):
        r = nt.hoi(cau)
        assert r["xu_ly"] == "tu_choi_nhe" and "chính mình" in r["cau_tra_loi"], cau
    r = nt.hoi("có nên chọn nhân viên theo tướng mặt không")
    assert r["xu_ly"] == "tu_choi_nhe" and "ngoại hình" in r["cau_tra_loi"]
    r = nt.hoi("nâng mũi có đổi được vận không")
    assert r["xu_ly"] == "phau_thuat" and "không khuyên sửa" in r["cau_tra_loi"]


def test_hoi_an_toan_dung_bo_chan_chung():
    r = nt.hoi("tôi chán sống quá, mặt tôi có tướng chết sớm không")
    assert r["xu_ly"] == "an_toan" and "tiếc" in r["cau_tra_loi"]
    r = nt.hoi("nhìn mặt tôi sống được bao lâu")
    assert r["xu_ly"] == "tu_choi_nhe"
    r = nt.hoi("mặt tôi thế này có vong theo không")
    assert r["xu_ly"] == "dan_huong"


# ------------------------------------------------------------------ NARRATIVE: đọc ảnh (mặc định tắt)
def test_doc_anh_mat_mac_dinh_tat_va_hau_xu_ly(monkeypatch):
    monkeypatch.delenv("NHAN_TUONG_DOC_ANH", raising=False)
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    r = dam.doc_anh({"anh": [{"du_lieu": "QUJD", "loai": "image/jpeg"}]})
    assert r["da_bat"] is False and r["ly_do_tat"] == "chua_bat" and r["can_xac_nhan"] is True
    tho = {"tra_loi": [{"cau": "tam_dinh", "lua_chon": "can_doi", "do_tin": 0.9}, {"cau": "tam_dinh", "lua_chon": "tran_dai", "do_tin": 0.5},
                       {"cau": "giong", "lua_chon": "tram_vang", "do_tin": 0.9},          # không đọc được từ ảnh → bỏ
                       {"cau": "mat_than", "lua_chon": "khong_chac", "do_tin": 0.9},      # không chắc → bỏ
                       {"cau": "an_duong", "lua_chon": "ma_la", "do_tin": 0.9}, {"cau": "cam", "lua_chon": "tron_day", "do_tin": 0.2}],
           "luu_y": ["Ảnh hơi tối https://x.y gọi 0901234567", "", "a", "b", "c"]}
    kq = dam.hau_xu_ly(tho)
    assert [(x["cau"], x["lua_chon"]) for x in kq["tra_loi"]] == [("tam_dinh", "can_doi")]
    assert len(kq["luu_y"]) == 3 and "http" not in kq["luu_y"][0] and "0901" not in kq["luu_y"][0]
    assert all(c["ma"] not in dam.KHONG_TU_ANH for c in dam.danh_muc())
    with pytest.raises(ValueError):
        dam.hau_xu_ly({"tra_loi": "x"})


def test_anh1_nhieu_goc_va_kiem_tra_mat():
    """ANH-1: ba góc chụp vào lời nhắc; kết quả kiểm ảnh của mô hình thành cờ tất định; không thấy đúng một mặt → không gợi ý."""
    msg = dam.dung_prompt({"anh": [{"du_lieu": "QUJD", "loai": "image/jpeg", "goc": "thang"},
                                   {"du_lieu": "QUJD", "loai": "image/jpeg", "goc": "nghieng_trai"},
                                   {"du_lieu": "QUJD", "loai": "image/jpeg", "goc": "nghieng_phai"},
                                   {"du_lieu": "QUJD", "loai": "image/jpeg"}]})          # ảnh thứ 4 bị bỏ
    nd = msg[1]["content"]
    assert [x["text"] for x in nd if x["type"] == "text"][1:] == ["Ảnh 1: chính diện.", "Ảnh 2: nghiêng trái.", "Ảnh 3: nghiêng phải."]
    assert sum(1 for x in nd if x["type"] == "image_url") == 3
    assert "kiem_tra" in msg[0]["content"] and "không nhận ra người đó là ai" in msg[0]["content"]
    tot = {"kiem_tra": {"thay_mat": True, "so_nguoi": 1, "nhin_thang": True, "du_sang": True},
           "tra_loi": [{"cau": "tam_dinh", "lua_chon": "can_doi", "do_tin": 0.9}], "luu_y": []}
    kq = dam.hau_xu_ly(tot)
    assert kq["kiem_tra"] == {"thay_mat": True, "so_nguoi": 1, "nhin_thang": True, "du_sang": True} and len(kq["tra_loi"]) == 1
    hai = dam.hau_xu_ly({**tot, "kiem_tra": {"thay_mat": True, "so_nguoi": 2}})
    assert hai["tra_loi"] == [] and "một mình" in hai["luu_y"][0]
    khong = dam.hau_xu_ly({**tot, "kiem_tra": {"thay_mat": False}})
    assert khong["tra_loi"] == [] and "gương mặt" in khong["luu_y"][0]
    nghieng = dam.hau_xu_ly({**tot, "kiem_tra": {"thay_mat": True, "so_nguoi": 1, "nhin_thang": False, "du_sang": False}})
    assert len(nghieng["tra_loi"]) == 1 and len(nghieng["luu_y"]) == 2
    rac = dam.hau_xu_ly({**tot, "kiem_tra": "linh tinh"})          # mô hình trả sai kiểu → coi là ổn, vẫn gợi ý
    assert rac["kiem_tra"]["thay_mat"] is True and len(rac["tra_loi"]) == 1


def test_doc_anh_mat_khong_log_anh(monkeypatch, caplog):
    import httpx
    monkeypatch.setenv("NHAN_TUONG_DOC_ANH", "1")
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    anh = base64.b64encode(b"\xff\xd8anh-rieng-tu-" * 50).decode()

    def _post(*a, **k):
        raise httpx.ConnectError("x")
    monkeypatch.setattr(httpx.Client, "post", _post)
    r = dam.doc_anh({"anh": [{"du_lieu": anh, "loai": "image/jpeg"}]})
    assert r["ly_do_tat"] == "loi_dich_vu"
    assert anh[20:60] not in caplog.text and "ConnectError" in caplog.text


# ------------------------------------------------------------------ API
def test_api():
    r = client.get("/v1/nhan-tuong/khao-sat")
    assert r.status_code == 200 and len(r.json()["cau_hoi"]) >= 30 and r.json()["bo_vi"]["an_duong"]["vung"] == "an_duong"
    r = client.post("/v1/nhan-tuong/luan-giai", json={"tra_loi": TL_DAY, "nam_sinh": 1988, "gioi_tinh": "nam", "ngay_xem": "2026-11-06"})
    assert r.status_code == 200 and r.json()["pham_vi"] == "nhan_tuong_doi_song" and len(r.json()["chuong"]) == 8
    r = client.post("/v1/nhan-tuong/luan-giai", json={"tra_loi": {"a b": "x"}})
    assert r.status_code == 422
    r = client.post("/v1/nhan-tuong/luan-giai", json={"tra_loi": TL_DAY, "ngay_xem": "2026-11-06",
                                                       "la_so": {"birth_date": "1990-05-17", "birth_time": "08:30", "gender": "nu", "noi_sinh": "ha-noi"}})
    assert r.status_code == 200
    assert next(c for c in r.json()["chuong"] if c["ma"] == "tuong_va_la_so")["hop"]
    r = client.post("/v1/nhan-tuong/hoi", json={"cau_hoi": "Sơn Căn thấp nghĩa là gì?"})
    assert r.status_code == 200 and r.json()["bo_vi"] == "son_can"
    r = client.post("/v1/nhan-tuong/do-anh", json={"chan_toc": {"x": 0.5, "y": 0.1}, "an_duong": {"x": 0.5, "y": 0.4}, "chuan_dau": {"x": 0.5, "y": 0.7}, "cam": {"x": 0.5, "y": 1}})
    assert r.status_code == 200 and r.json()["tam_dinh"]["lua_chon"] == "can_doi"
    r = client.post("/v1/nhan-tuong/do-anh", json={"chan_toc": {"x": 0.5, "y": 0.9}, "an_duong": {"x": 0.5, "y": 0.4}, "chuan_dau": {"x": 0.5, "y": 0.7}, "cam": {"x": 0.5, "y": 1}})
    assert r.status_code == 422
    r = client.get("/v1/nhan-tuong/cau-hinh")
    assert r.status_code == 200 and r.json()["doc_anh"] is False
    anh = {"du_lieu": "QUJDREVGR0hJSktMTU5PUA==", "loai": "image/png"}
    # ANH-1: thiếu đồng ý → 422 (máy chủ không nhận ảnh sinh trắc khi chưa có thoả thuận); đủ → chưa bật thì da_bat False
    assert client.post("/v1/nhan-tuong/doc-anh", json={"anh": [anh]}).status_code == 422
    assert client.post("/v1/nhan-tuong/doc-anh", json={"anh": [anh], "dong_y": False}).status_code == 422
    r = client.post("/v1/nhan-tuong/doc-anh", json={"anh": [{**anh, "goc": "thang"}, {**anh, "goc": "nghieng_trai"}, {**anh, "goc": "nghieng_phai"}], "dong_y": True})
    assert r.status_code == 200 and r.json()["da_bat"] is False and r.json()["kiem_tra"] is None
    assert client.post("/v1/nhan-tuong/doc-anh", json={"anh": [anh] * 4, "dong_y": True}).status_code == 422
    assert client.post("/v1/nhan-tuong/doc-anh", json={"anh": [{**anh, "goc": "nghieng_trai"}, {**anh, "goc": "nghieng_trai"}], "dong_y": True}).status_code == 422
    # BM-1: không lộ tên nội bộ / Drive / mô hình
    van = json.dumps(client.post("/v1/nhan-tuong/luan-giai", json={"tra_loi": TL_DAY}).json(), ensure_ascii=False).lower()
    for cam in ("drive", "seed", "gemini", "openrouter", "mediapipe"):
        assert cam not in van, cam


# ------------------------------------------------------------------ trang kiến thức
def test_trang_bo_vi():
    ds = trang.danh_sach()
    bv = [t for t in ds if t["loai"] == "bo_vi"]
    assert len(bv) == len(kb.bo_vi()) and len({t["slug"] for t in bv}) == len(bv)
    t = trang.lay("bo_vi", "an-duong")
    assert t and t["tra_loi_nhanh"].startswith("Ấn Đường") and any(m.get("bang") for m in t["muc"]) and t["minh_hoa"]["kieu"] == "bo_vi"
    assert any(m.get("trich_dan") for m in t["muc"]) and t["hoi_dap"] and t["lien_quan"]
    assert all(len(x["tieu_de"]) <= 70 for x in bv)
    assert "Drive" not in json.dumps(t, ensure_ascii=False)
