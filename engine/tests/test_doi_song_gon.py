# -*- coding: utf-8 -*-
"""Trục 1 "Bài đọc dài dễ đi" (2026-10-26) — báo cáo đời sống gọn hơn, KHÔNG sinh câu mới (chỉ cắt / sắp lại câu KB):

1. Thân hộp không lặp nguyên câu tiêu đề (tiêu đề = ý chính; thân = ý thêm + việc nên làm).
2. Một mã kiểm chứng (`ma_mau`) chỉ hiện MỘT lần dạng hộp đầy đủ: hộp đã ở "Điều quan trọng nhất" thì trong chương chỉ
   còn dòng tham chiếu (`tham_chieu = "cot_loi"`); trùng giữa hai chương → chương sau tham chiếu chương trước.
3. Đoạn thân chương (sau câu tóm tắt) không chép lại hộp: không câu nào chứa tiêu đề hay câu của hộp trong chương.
4. Chương "Con người bạn" không mang chip mức (như Lời khuyên, Vận hạn — VH-1), lời tóm tắt không nói "ở mức …".
Mã kiểm chứng KHÔNG đổi (ràng buộc SQL 0017/0021 — `test_kiem_chung_ma.py`).
"""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app.luangiai import ban_do_con_so, toan_bo
from app.luangiai import doi_song_khuon as kh

XEM = dt.date(2026, 10, 21)
_FX = Path(__file__).parents[1] / "fixtures" / "golden"
_TV = json.loads((_FX / "lasotuvi_60.json").read_text("utf-8"))["cases"]
_BT = json.loads((_FX / "battu_doi_song.json").read_text("utf-8"))["cases"]


def _sinh_tv(ca: dict) -> dict:
    return {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}


def _sinh_bt(ca: dict) -> dict:
    return {"lich": dt.datetime.fromisoformat(ca["lich"]), "gioi_tinh": ca["gioi_tinh"],
            "gio_ty": ca.get("gio_ty", "da_ty")}


MAI_TV = {"ngay": dt.date(1998, 3, 14), "ti": 5, "gioi_tinh": "nu"}          # hồ sơ người dùng thử của báo cáo UX
MAI_BT = {"lich": dt.datetime(1998, 3, 14, 9, 30), "gioi_tinh": "nu"}


@pytest.fixture(scope="module")
def bai() -> list[dict]:
    ds = [toan_bo.tuvi(MAI_TV, ngay_xem=XEM), toan_bo.battu(MAI_BT, ngay_xem=XEM)]
    ds += [toan_bo.tuvi(_sinh_tv(ca), ngay_xem=XEM) for ca in _TV[:12]]
    ds += [toan_bo.battu(_sinh_bt(ca), ngay_xem=XEM) for ca in _BT[:8]]
    ds.append(ban_do_con_so.bao_cao(["Trần Thị Mai"], 14, 3, 1998, XEM))
    return ds


def _chuan(s: str) -> str:
    return " ".join((s or "").lower().split()).rstrip(".!?…:; ")


def _hop_tat_ca(bc: dict):
    for h in bc.get("cot_loi") or []:
        yield "cot_loi", h
    for c in bc["chuong"]:
        for h in c.get("hop") or []:
            yield c["ma"], h


# ------------------------------------------------------------------ 1. thân hộp không lặp tiêu đề
@pytest.mark.parametrize("tieu_de, noi_dung, mong", [
    ("Tình cảm là chỗ bạn để tâm nhiều", "Tình cảm là chỗ bạn để tâm nhiều, dễ hiểu lầm vì im lặng. Khi giận, hẹn nói sau.",
     "Dễ hiểu lầm vì im lặng. Khi giận, hẹn nói sau."),
    ("Lời nói thẳng của bạn dễ bị hiểu lầm là chê",
     "Lời nói thẳng của bạn dễ bị hiểu lầm là chê, và bạn cũng hay nghi người khác.", "Bạn cũng hay nghi người khác."),
    ("Bạn làm tốt mà ít khi nói ra", "Bạn làm tốt mà ít khi nói ra, nên dễ bị bỏ qua lúc xét tăng lương.",
     "Vì vậy dễ bị bỏ qua lúc xét tăng lương."),
    ("Bạn hay đòi hỏi cao với người gần mình", "Bạn hay đòi hỏi cao với người gần mình. Nên khen trước khi góp ý.",
     "Nên khen trước khi góp ý."),
    # tiêu đề đã cắt giữa vế (bỏ từ treo "ở") → thân bắt đầu từ từ nối kế tiếp
    ("Bạn dễ căng thẳng với người cùng", "Bạn dễ căng thẳng với người cùng ở vì những nguyên tắc nhỏ trong nhà.",
     "Vì những nguyên tắc nhỏ trong nhà."),
    ("Thời trẻ bạn hay phải chuyển chỗ", "Thời trẻ bạn hay phải chuyển chỗ ở hoặc chưa có chỗ ở cố định; về sau yên.",
     "Hoặc chưa có chỗ ở cố định; về sau yên."),
    ("Tiền không tự tìm đến", "Tiền không tự tìm đến bạn; chi tiêu dễ trôi. Nên trích tiết kiệm.",
     "Chi tiêu dễ trôi. Nên trích tiết kiệm."),
    ("Anh chị em dễ so bì", "Anh chị em dễ so bì phần hơn phần thiệt, nhất là chuyện tiền. Nên bàn rõ.",
     "Nhất là chuyện tiền. Nên bàn rõ."),
    # thân trùng hẳn tiêu đề → rỗng (hộp chỉ còn tiêu đề)
    ("Bạn thẳng mà vẫn biết cách nói", "Bạn thẳng mà vẫn biết cách nói.", ""),
    # tiêu đề không phải đầu thân → giữ nguyên
    ("Bạn là người làm ăn bền bỉ", "Tháng sinh cho bạn đầu óc thực tế.", "Tháng sinh cho bạn đầu óc thực tế."),
    # tiêu đề dừng giữa một từ → không cắt
    ("Bạn lo", "Bạn lo lắng nhiều.", "Bạn lo lắng nhiều."),
])
def test_than_khong_lap_tieu_de(tieu_de, noi_dung, mong):
    assert kh.than_khong_lap_tieu_de(tieu_de, noi_dung) == mong


def test_moi_hop_than_khong_lap_tieu_de(bai):
    for bc in bai:
        for noi, h in _hop_tat_ca(bc):
            t, n = _chuan(h["tieu_de"]), _chuan(h["noi_dung"])
            assert n != t, (bc["mo_dun"], noi, h["tieu_de"])
            assert not n.startswith(t + " ") and not n.startswith(t + ","), (bc["mo_dun"], noi, h["tieu_de"], h["noi_dung"])
            if bc["mo_dun"] in ("tuvi", "battu") and (h["loai"] == "luu_y" or h.get("loai_goc") == "luu_y"):
                assert h.get("huong_xu_ly") in h["noi_dung"]          # việc nên làm vẫn nằm trong hộp


def test_cot_loi_cung_than_voi_hop_goc(bai):
    for bc in bai:
        goc = {h["ma_mau"]: h for _, h in _hop_tat_ca(bc) if h.get("ma_mau") and _ != "cot_loi"}
        for h in bc.get("cot_loi") or []:
            if h.get("ma_mau") in goc:
                assert h["noi_dung"] == goc[h["ma_mau"]]["noi_dung"] and h["tieu_de"] == goc[h["ma_mau"]]["tieu_de"]


# ------------------------------------------------------------------ 2. một mã — một hộp đầy đủ
def test_moi_ma_mau_mot_hop_day_du(bai):
    for bc in bai:
        day_du = [h["ma_mau"] for _, h in _hop_tat_ca(bc) if h.get("ma_mau") and not h.get("tham_chieu")]
        assert len(day_du) == len(set(day_du)), (bc["mo_dun"], [m for m in day_du if day_du.count(m) > 1])
        cot = {h["ma_mau"] for h in bc.get("cot_loi") or [] if h.get("ma_mau")}
        thu_tu = [c["ma"] for c in bc["chuong"]]
        da: dict[str, str] = {m: "cot_loi" for m in cot}
        for c in bc["chuong"]:
            for h in c["hop"]:
                m = h.get("ma_mau")
                if m in da:
                    assert h.get("tham_chieu") == da[m], (c["ma"], m)
                    if da[m] != "cot_loi":                    # tham chiếu luôn trỏ về chương ĐỨNG TRƯỚC
                        assert thu_tu.index(da[m]) < thu_tu.index(c["ma"])
                else:
                    assert "tham_chieu" not in h
                    if m:
                        da[m] = c["ma"]


def test_tham_chieu_giu_nguyen_ma_kiem_chung(bai):
    """Hộp tham chiếu vẫn mang mã (tầng HỌC đếm cùng một phiếu) — không thêm mã mới."""
    for bc in bai:
        for _, h in _hop_tat_ca(bc):
            if h.get("tham_chieu"):
                assert h["ma_mau"] and re.match(r"^[a-z0-9_.+-]{3,60}$", h["ma_mau"])


# ------------------------------------------------------------------ 3. đoạn thân không chép hộp
def _cau(s: str) -> list[str]:
    return [c.strip() for c in re.split(r"(?<=[.!?])\s+", s or "") if c.strip()]


def test_doan_khong_chep_hop(bai):
    for bc in bai:
        if bc["mo_dun"] not in ("tuvi", "battu"):        # Bản đồ con số: thân chương là bài viết riêng, không khuôn hộp
            continue
        for c in bc["chuong"]:
            hop = c.get("hop") or []
            tieu_de = [_chuan(h["tieu_de"]) for h in hop if len(h["tieu_de"]) >= 12]
            cau_hop = [_chuan(x) for h in hop for x in _cau(h["noi_dung"]) if len(x) >= 25]
            for d in c["doan"][1:]:
                for x in _cau(d):
                    x0 = _chuan(x)
                    assert not any(t in x0 for t in tieu_de), (bc["mo_dun"], c["ma"], x)
                    assert not any(k in x0 for k in cau_hop), (bc["mo_dun"], c["ma"], x)
            if c.get("tom_tat"):
                assert c["doan"][0] == c["tom_tat"]       # câu tóm tắt vẫn đứng đầu (lời mời SAO-2 cắt từ đây)


# ------------------------------------------------------------------ 4. "Con người bạn" không mang mức
def test_con_nguoi_ban_khong_chip_muc(bai):
    for bc in bai:
        if bc["mo_dun"] not in ("tuvi", "battu"):
            continue
        tq = next(c for c in bc["chuong"] if c["ma"] == "tong_quan")
        assert tq.get("muc") is None and tq.get("nhan_muc") is None
        assert "hai_cach_muc" not in tq
        chu = " ".join([tq["tom_tat"], *tq["doan"]]).lower()
        assert "ở mức" not in chu and "mức chung" not in chu, chu[:200]


def test_khong_cum_cam_sau_khi_gon(bai):
    for bc in bai:
        if bc["mo_dun"] not in ("tuvi", "battu"):        # Bản đồ con số có bài kiểm giọng riêng (test_doi_song_khuon)
            continue
        assert kh.kiem_giong_van(bc) == [], bc["mo_dun"]
