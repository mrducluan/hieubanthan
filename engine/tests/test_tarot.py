# -*- coding: utf-8 -*-
"""TR-1 — Tarot (test viết TRƯỚC hàm theo quy tắc code): KB 78 lá, CALC (xáo theo hạt giống, phẩm giá nguyên tố Book T,
hướng nhìn, nhịp số, decan → khoảng ngày), RULES (báo cáo khuôn doi_song_1, hỏi đáp, lá ngày, lá đại diện), API, an toàn,
giọng văn, trang KB, BM-1. Không LLM, không lưu, không điểm số."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import tarot as calc
from app.kb import tarot_kb as kb
from app.kb import trang
from app.luangiai import doi_song_khuon as kh
from app.luangiai import tarot as tr
from app.main import app

client = TestClient(app)
XEM = dt.date(2026, 11, 7)
GOLDEN = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "tarot.json").read_text(encoding="utf-8"))

# Celtic Cross cố định: 1 Hiệp sĩ Kiếm, 2 Tháp, 3 Nữ Tư Tế (ngược), 4 3 Cốc, 5 Mặt Trời, 6 8 Tiền, 7 Ẩn Sĩ, 8 Hoàng Hậu Gậy,
# 9 9 Kiếm (ngược), 10 10 Cốc.
CELTIC = [{"id": "kiem_hiep_si"}, {"id": "dai_16"}, {"id": "dai_2", "nguoc": True}, {"id": "coc_3"}, {"id": "dai_19"},
          {"id": "tien_8"}, {"id": "dai_9"}, {"id": "gay_hoang_hau"}, {"id": "kiem_9", "nguoc": True}, {"id": "coc_10"}]
BA_LA = [{"id": "gay_3"}, {"id": "coc_5", "nguoc": True}, {"id": "dai_17"}]


# ------------------------------------------------------------------ KB
def test_kb_du_78_la_va_du_truong():
    d = kb._d()
    assert d["can_doi_chieu"] is True and d["trang_thai"] == "nhap_ai"
    la = kb.la()
    assert len(la) == 78
    assert sum(1 for x in la.values() if x["loai"] == "an_chinh") == 22
    assert sum(1 for x in la.values() if x["loai"] == "so") == 40 and sum(1 for x in la.values() if x["loai"] == "hoang_gia") == 16
    for ma, x in la.items():
        assert x["ten"] and x["en"] and x["nguyen_to"] in kb.nguyen_to(), ma
        assert x["sac_thai"] in ("sang", "trung", "nang") and x["sac_thai_nguoc"] in ("sang", "trung", "nang"), ma
        assert x["huong_nhin"] in (-1, 0, 1, None), ma
        assert len(x["tu_khoa"]) >= 3 and len(x["tu_khoa_nguoc"]) >= 2, ma
        assert x["hinh_anh"] and x["y_xuoi"] and x["y_nguoc"] and x["viec"] and x["cau_tu_soi"], ma
        assert set(x["linh_vuc"]) >= {"tinh_cam", "cong_viec", "tien_bac", "suc_khoe"}, ma
        assert set(x["truong_phai"]) == {"rws", "thoth", "tdm", "bota"}, ma
        if x["loai"] == "an_chinh":
            assert x["chu_cai"] and x["chiem_tinh"], ma
        if x["loai"] == "so" and 2 <= x["so"] <= 10:
            assert x["decan"] and x["decan"]["cung"] in kb.cung_hoang_dao() and 1 <= x["decan"]["so"] <= 3, ma
            assert x["sephirah"], ma
    assert len(kb.trai_bai()) >= 5 and len(kb.trai_bai()["celtic"]["vi_tri"]) == 10
    for tb in kb.trai_bai().values():
        n = len(tb["vi_tri"])
        assert all(0 <= i < n and 0 <= j < n and i != j for i, j in tb["ke_can"]), tb["ten"]
    assert len(kb.cung_hoang_dao()) == 12 and all(len(c["decan"]) == 3 for c in kb.cung_hoang_dao().values())
    # 36 decan: mỗi lá số 2–10 một decan, không trùng
    dc = [(x["decan"]["cung"], x["decan"]["so"]) for x in la.values() if x.get("decan")]
    assert len(dc) == 36 and len(set(dc)) == 36


def test_kb_giong_van_sach_va_sk1():
    """Lớp đời thường của KB (tên, ý xuôi / ngược, lĩnh vực, việc, câu tự soi, mẫu) sạch cụm cấm; sức khoẻ không tên bệnh."""
    from app.kb.tuvi_doi_song_kb import tim_cum_cam
    from app.luangiai import suc_khoe_nam as skn
    ds = [c for c in kh.cum_cam_chung() + kb.cum_cam() if c not in kh.NGOAI_LE.get("tarot", ())]
    van, sk = [], []
    for x in kb.la().values():
        van += [x["ten"], x["y_xuoi"], x["y_nguoc"], x["viec"], x["cau_tu_soi"], *x["tu_khoa"], *x["tu_khoa_nguoc"]]
        van += [x["linh_vuc"][k] for k in ("tinh_cam", "cong_viec", "tien_bac")]
        van += [t.get("loi") or "" for t in x["truong_phai"].values()]
        sk.append(x["linh_vuc"]["suc_khoe"])
    for v in kb._d()["mau"].values():
        van += [v] if isinstance(v, str) else [s for s in v.values() if isinstance(s, str)]
    loi = [(c, s[:80]) for s in van + sk for c in tim_cum_cam(s, ds)]
    assert not loi, loi[:10]
    loi_sk = [(c, s[:80]) for s in sk for c in skn.kiem(s)]
    assert not loi_sk, loi_sk[:10]
    # SK-1: lời sức khoẻ không khẳng định bệnh / không "sẽ ốm"
    assert not [s for s in sk if "sẽ ốm" in s or "mắc bệnh" in s]


# ------------------------------------------------------------------ CALC
def test_bo_bai_va_xao_tat_dinh():
    assert len(calc.BO_BAI) == 78 and len(set(calc.BO_BAI)) == 78 and calc.BO_BAI[0] == "dai_0" and calc.BO_BAI[21] == "dai_21"
    a = calc.xao("hbt-test-1")
    b = calc.xao("hbt-test-1")
    assert a == b and sorted(a["thu_tu"]) == sorted(calc.BO_BAI) and len(a["nguoc"]) == 78 and a["nguon"] == "hat_giong"
    assert a["thu_tu"][:6] == GOLDEN["xao"]["hbt-test-1"]["thu_tu_6"] and a["nguoc"][:12] == GOLDEN["xao"]["hbt-test-1"]["nguoc_12"]
    assert calc.xao("hbt-test-2")["thu_tu"] != a["thu_tu"]
    c = calc.xao(None)
    assert c["nguon"] == "csprng" and sorted(c["thu_tu"]) == sorted(calc.BO_BAI)
    # không dùng lá ngược → mọi cờ False
    assert not any(calc.xao("hbt-test-1", nguoc=False)["nguoc"])


def test_pham_gia_book_t():
    g = GOLDEN["pham_gia"]
    for a, b, kq in g:
        assert calc.pham_gia(a, b) == kq, (a, b)
    # đối xứng
    for a in ("hoa", "thuy", "khi", "dat"):
        for b in ("hoa", "thuy", "khi", "dat"):
            assert calc.pham_gia(a, b) == calc.pham_gia(b, a)


def test_suc_la_hai_ben():
    # Lửa giữa, Khí + Lửa hai bên → được tiếp sức
    s = calc.suc_la("hoa", "khi", "hoa")
    assert s["suc"] == "tiep_suc" and not s["triet_tieu"]
    # Lửa giữa, Nước hai bên → bị kìm
    assert calc.suc_la("hoa", "thuy", "thuy")["suc"] == "bi_kim"
    # Lửa giữa, Khí + Đất: hai lá hai bên xung NHAU (Khí–Đất) → triệt tiêu, lá giữa không bị ảnh hưởng (Book T)
    s = calc.suc_la("hoa", "khi", "dat")
    assert s["suc"] == "binh" and s["triet_tieu"]
    # chỉ một bên
    assert calc.suc_la("thuy", "dat", None)["suc"] == "tiep_suc"
    assert calc.suc_la("thuy", None, None)["suc"] == "binh"


def test_phan_tich_trai_bai():
    pt = calc.phan_tich("celtic", CELTIC)
    assert len(pt["vi_tri"]) == 10 and pt["vi_tri"][0]["id"] == "kiem_hiep_si" and pt["vi_tri"][2]["nguoc"] is True
    assert pt["an_chinh"]["so"] == 4 and pt["an_chinh"]["muc"] == "vua"
    assert pt["nguyen_to"]["dem"] == {"hoa": 3, "thuy": 3, "khi": 2, "dat": 2} and pt["nguyen_to"]["troi"] is None   # hoà → không trội
    assert pt["nguyen_to"]["thieu"] == []
    p5 = calc.phan_tich("nam_la", [{"id": "gay_2"}, {"id": "gay_5"}, {"id": "dai_19"}, {"id": "coc_2"}, {"id": "tien_4"}])
    assert p5["nguyen_to"]["troi"] == "hoa" and p5["nguyen_to"]["thieu"] == ["khi"] and p5["an_chinh"]["muc"] == "vua"
    # cặp kề cận mang quan hệ; cặp 1×2: Khí (Hiệp sĩ Kiếm) × Lửa (Tháp) → hợp
    cap = {(c["a"], c["b"]): c["quan_he"] for c in pt["ke_can"]}
    assert cap[(0, 1)] == "hop"
    assert all(v["suc"]["suc"] in ("tiep_suc", "binh", "bi_kim") for v in pt["vi_tri"])
    # nhịp số (chỉ lá số 1–10 theo thứ tự vị trí): 3 → 8 → 9 → 10 tiến
    assert pt["so_hoc"]["day"] == [3, 8, 9, 10] and pt["so_hoc"]["xu_huong"] == "tien"
    # hướng nhìn (Marseille): Hiệp sĩ Kiếm quay trái (−1) ở tâm điểm → về lá vừa qua (vị trí 3) trên trục thời gian
    hn = {h["vi_tri"]: h for h in pt["huong_nhin"]}
    assert hn[0]["huong"] == -1 and hn[0]["toi"] == 3 and hn[0]["tren_truc"] is True
    assert hn[6]["tren_truc"] is False and hn[6]["toi"] is None
    with pytest.raises(ValueError):
        calc.phan_tich("celtic", CELTIC[:9])
    with pytest.raises(ValueError):
        calc.phan_tich("ba_la_thoi_gian", [{"id": "dai_0"}, {"id": "dai_0"}, {"id": "dai_1"}])


def test_decan_va_khoang_thoi_gian():
    g = GOLDEN["decan"]
    for ma, (cung, so, ht, tu, den) in g.items():
        d = calc.decan(ma)
        assert d["cung"] == cung and d["so"] == so and d["hanh_tinh"] == ht and d["tu"] == tu and d["den"] == den, ma
    # 3 Gậy = decan 2 Bạch Dương (31/3–10/4): xem 7/11/2026 → cửa sổ kế là 31/3–10/4/2027
    k = calc.khoang_thoi_gian("gay_3", XEM)
    assert k["loai"] == "decan" and k["tu"] == dt.date(2027, 3, 31) and k["den"] == dt.date(2027, 4, 10)
    assert k["nhip"] and "ngày" in k["nhip"]
    # đang trong cửa sổ: 2 Kiếm = decan 1 Thiên Bình (23/9–2/10)
    k = calc.khoang_thoi_gian("kiem_2", dt.date(2026, 9, 28))
    assert k["dang_trong"] is True and k["tu"] == dt.date(2026, 9, 23)
    # lá số 1 (Át) không có decan → theo bộ (nhịp), không có ngày
    k = calc.khoang_thoi_gian("coc_1", XEM)
    assert k["loai"] == "bo" and k["tu"] is None
    # Ẩn chính theo cung hoàng đạo → cửa sổ cả cung; theo hành tinh → chỉ nhịp
    k = calc.khoang_thoi_gian("dai_4", XEM)                 # Hoàng Đế — Bạch Dương
    assert k["loai"] == "cung" and k["tu"] == dt.date(2027, 3, 21)
    k = calc.khoang_thoi_gian("dai_16", XEM)                # Tháp — Hoả tinh
    assert k["loai"] == "hanh_tinh" and k["tu"] is None and k["nhip"]


def test_la_ngay_tat_dinh():
    a = calc.la_ngay(XEM)
    assert a == calc.la_ngay(XEM) and a["id"] in calc.BO_BAI and a["nguoc"] is False
    assert calc.la_ngay(XEM) != calc.la_ngay(XEM + dt.timedelta(days=1)) or calc.la_ngay(XEM + dt.timedelta(days=2)) != a
    b = calc.la_ngay(XEM, dt.date(1988, 10, 24))
    assert b == calc.la_ngay(XEM, dt.date(1988, 10, 24)) and b["id"] in calc.BO_BAI
    assert b != calc.la_ngay(XEM, dt.date(1990, 5, 17)) or calc.la_ngay(XEM, dt.date(2001, 1, 1)) != b


def test_la_dai_dien():
    # Vua / Hoàng hậu theo tuổi + giới tính; bộ theo ngũ hình gương mặt (Nhân tướng); không có ngũ hình → bộ theo "tay"
    assert calc.dai_dien(45, "nam", ngu_hinh="kim")["id"] == "kiem_vua"
    assert calc.dai_dien(45, "nu", ngu_hinh="thuy")["id"] == "coc_hoang_hau"
    assert calc.dai_dien(24, "nam", ngu_hinh="hoa")["id"] == "gay_hiep_si"
    assert calc.dai_dien(20, "nu", ngu_hinh="tho")["id"] == "tien_tieu_dong"
    assert calc.dai_dien(30, "nam", ngu_hinh="moc")["id"].startswith("gay_")
    x = calc.dai_dien(30, None, ngu_hinh=None, bo="coc")
    assert x["id"].startswith("coc_") and x["ly_do"]
    assert calc.dai_dien(None, None) is None


# ------------------------------------------------------------------ RULES: báo cáo
def test_bao_cao_khuon_doi_song():
    bc = tr.bao_cao("celtic", CELTIC, cau_hoi="Tôi có nên nhận lời hợp tác với đối tác mới không?", chu_de="cong_viec", ngay_xem=XEM)
    assert bc["mo_dun"] == "tarot" and bc["phien_ban"] == "doi_song_1" and bc["phai"] == "tarot_tong_hop"
    assert [c["ma"] for c in bc["chuong"]] == kb.thu_tu_chuong()
    assert kh.kiem_giong_van(bc) == [], kh.kiem_giong_van(bc)
    assert 1 <= len(bc["cot_loi"]) <= 4 and all(h.get("tu_chuong") for h in bc["cot_loi"])
    for c in bc["chuong"]:
        ms = [h["ma_mau"] for h in c.get("hop", [])]
        assert len(ms) == len(set(ms)), c["ma"]
        for h in c.get("hop", []):
            assert h["ma_mau"].startswith("ds.tarot.") and len(h["ma_mau"]) <= 60 and h.get("phai") in (*kb.truong_phai(), "tarot_tong_hop")
            if h["loai"] == "luu_y":
                assert h.get("huong_xu_ly")
    tl = next(c for c in bc["chuong"] if c["ma"] == "tung_la")
    assert len(tl["hop"]) == 10 and tl["hop"][2]["la"]["id"] == "dai_2" and tl["hop"][2]["la"]["nguoc"] is True
    assert "ngược" in tl["hop"][2]["tieu_de"].lower() or "ngược" in tl["hop"][2]["noi_dung"].lower()
    # mỗi hộp từng lá mang vị trí + mức sức (phẩm giá) + 4 trường phái ở "Vì sao nói vậy"
    assert tl["hop"][0]["vi_tri"]["ten"] and tl["hop"][0]["suc"] in ("tiep_suc", "binh", "bi_kim")
    assert sum(1 for s in tl["hop"][0]["can_cu"] if "Marseille" in s or "Thoth" in s or "Waite" in s or "B.O.T.A" in s) >= 2
    dc = next(c for c in bc["chuong"] if c["ma"] == "dong_chay")
    assert dc["hop"] and any(h.get("quan_he") == "xung" for h in dc["hop"]) and any("nhìn" in h["noi_dung"] for h in dc["hop"])
    td = next(c for c in bc["chuong"] if c["ma"] == "thoi_diem")
    assert td["hop"] and td["hop"][0]["loai"] == "thoi_diem" and td["hop"][0].get("tu") and "gợi ý" in (td["tom_tat"] or "").lower() + td["doan"][0].lower()
    vl = next(c for c in bc["chuong"] if c["ma"] == "viec_nen_lam")
    assert 2 <= len(vl["hop"]) <= 4 and all(h["loai"] == "loi_khuyen" for h in vl["hop"])
    # chủ đề công việc → lời lĩnh vực công việc được dùng
    assert any("công việc" in h["noi_dung"].lower() or "việc" in h["noi_dung"].lower() for h in tl["hop"])
    assert bc["da_tinh"]["trai_bai"] == "celtic" and bc["da_tinh"]["an_chinh"]["so"] == 4 and bc["cau_hoi"] is None  # câu hỏi KHÔNG trả lại
    assert bc["linh_vuc"] == "cong_viec" and len(bc["cot_loi"]) == 4


def test_bao_cao_ba_la_va_mot_la():
    bc = tr.bao_cao("ba_la_thoi_gian", BA_LA, ngay_xem=XEM)
    assert kh.kiem_giong_van(bc) == []
    tl = next(c for c in bc["chuong"] if c["ma"] == "tung_la")
    assert [h["la"]["id"] for h in tl["hop"]] == ["gay_3", "coc_5", "dai_17"]
    bc1 = tr.bao_cao("mot_la", [{"id": "dai_13"}], chu_de="tinh_cam", ngay_xem=XEM)
    assert kh.kiem_giong_van(bc1) == []
    van = " ".join(kh.lop_doi_thuong(bc1))
    assert "Tử Thần" in van and "chết" not in van.lower()
    # Tướng và lá bài: thiếu khảo sát → chương ghi thiếu, không vỡ
    assert next(c for c in bc1["chuong"] if c["ma"] == "tuong_va_la").get("thieu")


def test_bao_cao_dai_dien_tu_nhan_tuong():
    from tests.test_nhan_tuong import TL_DAY
    bc = tr.bao_cao("ba_la_thoi_gian", BA_LA, ngay_xem=XEM, nam_sinh=1988, gioi_tinh="nam", tra_loi_nhan_tuong=TL_DAY)
    c = next(c for c in bc["chuong"] if c["ma"] == "tuong_va_la")
    assert not c.get("thieu") and c["hop"] and c["hop"][0]["la"]["id"] == "tien_vua"      # Thổ hình, 39 tuổi, nam → Vua Tiền
    assert "Thổ" in " ".join(c["hop"][0]["can_cu"])


def test_hoc_ha_hop_va_phieu_ca_nhan():
    bc = tr.bao_cao("celtic", CELTIC, ngay_xem=XEM)
    tl = next(c for c in bc["chuong"] if c["ma"] == "tung_la")
    ma0, ma1 = tl["hop"][0]["ma_mau"], tl["hop"][1]["ma_mau"]
    bc2 = tr.bao_cao("celtic", CELTIC, ngay_xem=XEM, trong_so={ma0: {"dung": 10, "chua_dung": 120}}, ca_nhan={ma1: "chua_dung"})
    tl2 = next(c for c in bc2["chuong"] if c["ma"] == "tung_la")
    assert ma0 not in [h["ma_mau"] for h in tl2["hop"]] and tl2["hop"][-1]["ma_mau"] == ma1


# ------------------------------------------------------------------ RULES: hỏi đáp
def test_hoi_nghia_la_va_nguoc():
    kq = tr.hoi("Lá Tháp nghĩa là gì?")
    assert kq["xu_ly"] == "nghia_la" and kq["la"] == "dai_16" and "Tháp" in kq["cau_tra_loi"] and kq["hoi_tiep"]
    kq = tr.hoi("The Tower ngược trong tình cảm thì sao")
    assert kq["la"] == "dai_16" and kq["nguoc"] is True and kq["linh_vuc"] == "tinh_cam"
    kq = tr.hoi("3 of cups nghĩa gì")
    assert kq["la"] == "coc_3"
    kq = tr.hoi("lá ba gậy")
    assert kq["la"] == "gay_3"
    kq = tr.hoi("Hoàng hậu cốc nói về gì?")
    assert kq["la"] == "coc_hoang_hau"
    kq = tr.hoi("Celtic Cross là trải bài gì?")
    assert kq["xu_ly"] == "trai_bai" and "10" in kq["cau_tra_loi"]
    kq = tr.hoi("Lá ngược nghĩa là gì?")
    assert kq["xu_ly"] == "khai_niem"
    kq = tr.hoi("xyz abc")
    assert kq["xu_ly"] == "khong_hieu" and kq["hoi_tiep"]


def test_hoi_an_toan_va_tu_choi_dung_mot_bo_chung():
    assert tr.hoi("Tôi mệt quá, chắc tôi nên chết đi cho xong")["xu_ly"] == "an_toan"
    assert tr.hoi("Rút lá bài cho tôi số lô đề tối nay")["xu_ly"] == "tu_choi_nhe"
    assert tr.hoi("Tôi sống được bao nhiêu tuổi")["xu_ly"] == "tu_choi_nhe"
    assert tr.hoi("Nhà tôi có bị yểm bùa không")["xu_ly"] == "dan_huong"
    # Hỏi về người khác: không phán người ấy, lời chuyển về điều chính mình làm được (CY-1 — không né)
    kq = tr.hoi("Người yêu tôi có đang ngoại tình không?")
    assert kq["xu_ly"] == "nguoi_khac" and "trải bài" in kq["cau_tra_loi"].lower()
    kq = tr.hoi("Tôi có bị bệnh gì nặng không")
    assert kq["xu_ly"] in ("tu_choi_nhe", "hoi_benh")


def test_hoi_theo_trai_bai_vua_rut():
    kq = tr.hoi("lá thứ 2 nghĩa là gì", trai_bai="celtic", la=CELTIC)
    assert kq["xu_ly"] == "vi_tri" and kq["la"] == "dai_16" and "cản" in kq["cau_tra_loi"].lower()
    kq = tr.hoi("kết quả thế nào", trai_bai="celtic", la=CELTIC)
    assert kq["xu_ly"] == "vi_tri" and kq["la"] == "coc_10"


# ------------------------------------------------------------------ API
def test_api():
    r = client.get("/v1/tarot/bo-bai")
    assert r.status_code == 200 and len(r.json()["la"]) == 78 and r.json()["trai_bai"]["celtic"]["vi_tri"]
    # không lộ nhãn nháp / nguồn nội bộ (BM-1)
    assert "nhap_ai" not in json.dumps(r.json()["la"]) and "AI nháp" not in r.text
    r = client.post("/v1/tarot/xao-bai", json={"hat_giong": "abc-123", "nguoc": True})
    assert r.status_code == 200 and len(r.json()["thu_tu"]) == 78
    r2 = client.post("/v1/tarot/xao-bai", json={"hat_giong": "abc-123", "nguoc": True})
    assert r.json()["thu_tu"] == r2.json()["thu_tu"]
    r = client.post("/v1/tarot/xao-bai", json={})
    assert r.status_code == 200 and r.json()["nguon"] == "csprng"
    r = client.post("/v1/tarot/doc-bai", json={"trai_bai": "celtic", "la": CELTIC, "cau_hoi": "Việc hợp tác này nên không?", "chu_de": "cong_viec"})
    assert r.status_code == 200 and r.json()["mo_dun"] == "tarot" and len(r.json()["chuong"]) == len(kb.thu_tu_chuong())
    assert r.json().get("cau_hoi") is None
    r = client.post("/v1/tarot/doc-bai", json={"trai_bai": "celtic", "la": CELTIC[:3]})
    assert r.status_code == 422
    r = client.post("/v1/tarot/doc-bai", json={"trai_bai": "ba_la_thoi_gian", "la": [{"id": "x_1"}, {"id": "dai_0"}, {"id": "dai_1"}]})
    assert r.status_code == 422
    r = client.post("/v1/tarot/hoi", json={"cau_hoi": "Lá Ngôi Sao ngược nghĩa gì?"})
    assert r.status_code == 200 and r.json()["la"] == "dai_17"
    r = client.get("/v1/tarot/la-ngay", params={"ngay": "2026-11-07"})
    assert r.status_code == 200 and r.json()["la"]["id"] in calc.BO_BAI and r.json()["la"]["ten"]
    r = client.post("/v1/tarot/la-ngay", json={"ngay": "2026-11-07", "ngay_sinh": "1988-10-24"})
    assert r.status_code == 200 and r.json()["rieng"] is True


# ------------------------------------------------------------------ trang KB
def test_trang_la_bai():
    ds = [t for t in trang.danh_sach() if t["loai"] == "la_bai"]
    assert len(ds) == 78 and len({t["slug"] for t in ds}) == 78
    t = trang.lay("la_bai", "thap")
    assert t and t["tieu_de"].startswith("Tháp") and "Trả lời nhanh" not in t["tra_loi_nhanh"]
    assert t["minh_hoa"]["kieu"] == "la_bai" and t["minh_hoa"]["id"] == "dai_16"
    assert any(m.get("bang") for m in t["muc"]) and len(t["hoi_dap"]) >= 3
    assert "chết" not in json.dumps(t, ensure_ascii=False).lower() or "Tử Thần" in json.dumps(t, ensure_ascii=False)
    t3 = trang.lay("la_bai", "3-gay")
    assert t3 and "Three of Wands" in t3["tieu_de"] and any("31/3" in json.dumps(m, ensure_ascii=False) for m in t3["muc"])
    assert trang.lay("la_bai", "khong-co") is None
    r = client.get("/v1/kb/trang/la_bai/thap")
    assert r.status_code == 200
    assert "nhap_ai" not in r.json().get("nguon", []) and "seed" not in r.text.lower()


def test_hoi_ten_la_co_so_thang_vi_tri():
    """'Lá 3 Cốc' là lá Ba Cốc dù đang có trải bài (không phải lá thứ 3); 'lá thứ 2' vẫn là vị trí."""
    from app.luangiai import tarot as tr
    ds = [{"id": "gay_1", "nguoc": False}, {"id": "dai_16", "nguoc": False}, {"id": "coc_9", "nguoc": True}]
    k = tr.hoi("Lá 3 Cốc ngược trong tình cảm?", trai_bai="ba_la_loi_khuyen", la=ds)
    assert k["xu_ly"] == "nghia_la" and k["la"] == "coc_3" and k["nguoc"] is True
    k = tr.hoi("lá thứ 2 nghĩa gì", trai_bai="ba_la_loi_khuyen", la=ds)
    assert k["xu_ly"] == "vi_tri" and k["la"] == "dai_16" and k["vi_tri"] == 1


def test_suc_ke_mot_luat_cho_phan_tich():
    from app.calc import tarot as calc
    assert calc.suc_ke("hoa", [("a", "hoa"), ("b", "khi")])["suc"] == "tiep_suc"
    assert calc.suc_ke("hoa", [("a", "khi"), ("b", "dat")])["triet_tieu"] is True
    assert calc.suc_ke("hoa", [])["suc"] == "binh"

