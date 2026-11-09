# -*- coding: utf-8 -*-
"""QT-0 — bộ kiểm bản chuyển ngữ Việt → Anh (KE-HOACH-QUOC-TE mục 11). Luật cố định, không AI: bản dịch nào vi phạm
thì không được ghi vào `*_en.json`. Viết TRƯỚC `app/chuyen_ngu/kiem.py`."""
from __future__ import annotations

import json
from pathlib import Path

from app.chuyen_ngu import kiem, thuat_ngu

DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"


def _ma(loi):
    return {l["ma"] for l in loi}


def test_bang_thuat_ngu_du_va_dung_khuon():
    d = json.loads((DATA / "thuat_ngu_en.json").read_text(encoding="utf-8"))
    assert d["source_id"] and d["school_id"]
    tu_dien = {e["ma"] for e in json.loads((DATA / "tu_dien.json").read_text(encoding="utf-8"))["muc"] if e["mo_dun"] != "thanso"}
    assert {m["ma"] for m in d["muc"]} == tu_dien          # đủ 4 mảng QTE-1, không thừa
    for m in d["muc"]:
        assert m["en"].isascii(), m                        # tên Anh không lẫn dấu tiếng Việt
        assert m["mang"] in {"tu_vi", "bat_tu", "kinh_dich", "phong_thuy"}


def test_ban_dich_tot_khong_loi():
    vi = "Nhật chủ của bạn mạnh; năm 2027 nên dồn sức vào {viec}."
    en = "Your Day Master is strong; in 2027, put your energy into {viec}."
    assert kiem.kiem(vi, en) == []


def test_mat_bien_va_so():
    vi = "Năm 2027 hợp với {viec}, khoảng 3 tháng đầu."
    en = "This year suits your plans, especially the first months."
    assert {"bien", "so"} <= _ma(kiem.kiem(vi, en))


def test_so_thap_phan_doi_dau_phay():
    assert "so" not in _ma(kiem.kiem("Tỉ lệ 1,5 lần.", "About 1.5 times."))


def test_thuat_ngu_sai_bi_bat():
    vi = "Hoá Kỵ rơi vào cung Mệnh."
    assert "thuat_ngu" in _ma(kiem.kiem(vi, "The bad star falls into your main house."))
    # Chấp nhận tên pinyin HOẶC nghĩa trong ngoặc của bảng.
    assert "thuat_ngu" not in _ma(kiem.kiem(vi, "Hua Ji lands in your Life Palace."))
    assert "thuat_ngu" not in _ma(kiem.kiem(vi, "The Obstacle transformation lands in your Life Palace."))


def test_thuat_ngu_mot_tu_khong_ep():
    # "Cát", "Hung", "Vận"… là chữ thường dùng → không ép (chỉ ép thuật ngữ ≥ 2 âm tiết).
    assert "thuat_ngu" not in _ma(kiem.kiem("Việc này cát.", "This looks favourable."))


def test_cum_cam_tieng_anh():
    loi = kiem.kiem("Năm nay nên chú ý sức khoẻ.", "This year is doomed; you will get sick. Guaranteed.")
    assert "cum_cam" in _ma(loi)


def test_suc_khoe_phai_kem_cau_ranh_gioi():
    vi = "Nên đi khám định kỳ, lời này không thay lời bác sĩ."
    assert "suc_khoe" in _ma(kiem.kiem(vi, "Get regular check-ups."))
    assert "suc_khoe" not in _ma(kiem.kiem(vi, "Get regular check-ups; this is not medical advice."))


def test_con_chu_viet_va_do_dai():
    assert "con_tieng_viet" in _ma(kiem.kiem("Bạn hợp hướng Đông.", "You suit the East direction (hướng Đông)."))
    assert "do_dai" in _ma(kiem.kiem("Bạn hợp hướng Đông và hướng Nam.", "East."))


def test_tra_thuat_ngu():
    assert thuat_ngu.en("Nhật chủ") == "Day Master"
    assert thuat_ngu.en("không có") is None
    assert "Day Master" in thuat_ngu.cho_loi_nhac(["bat_tu"])


# ---------------------------------------------------------------- quy trình chuyển ngữ (máy AI giả)
from app.chuyen_ngu import quy_trinh  # noqa: E402


def _ai_gia(ban: dict[str, str]):
    """Máy AI giả: trả đúng JSON {id: bản Anh} theo bảng `ban` (cả hai lượt)."""
    def goi(messages, **_):
        nhan = json.loads(messages[-1]["content"].split("INPUT:\n", 1)[1])
        return json.dumps({k: ban.get(v, ban.get(k, "")) for k, v in nhan.items()}, ensure_ascii=False)
    return goi


def test_la_chuoi_bo_khoa_he_thong():
    d = {"source_id": "x", "school_id": "y", "trang_thai": "nhap", "_nguon": "z",
         "muc": [{"ma": "a", "ten": "Nhật chủ", "de_hieu": "Can của ngày sinh."}]}
    la = dict(quy_trinh.la_chuoi(d))
    assert la == {"muc.0.ten": "Nhật chủ", "muc.0.de_hieu": "Can của ngày sinh."}


def test_chuyen_ghi_ban_qua_kiem_bo_ban_loi():
    d = {"source_id": "x", "school_id": "y", "muc": [
        {"ma": "a", "ten": "Nhật chủ", "de_hieu": "Năm 2027 nên dồn sức vào {viec}."},
        {"ma": "b", "ten": "Hoá Kỵ", "de_hieu": "Hoá Kỵ ở cung Mệnh."}]}
    ban = {"Nhật chủ": "Day Master", "Năm 2027 nên dồn sức vào {viec}.": "In 2027, put your energy into {viec}.",
           "Hoá Kỵ": "Hua Ji", "Hoá Kỵ ở cung Mệnh.": "A bad star sits in your main house."}
    kq = quy_trinh.chuyen(d, goi=_ai_gia(ban), mang=["tu_vi", "bat_tu"])
    assert kq["ban_en"]["muc"][0] == {"ten": "Day Master", "de_hieu": "In 2027, put your energy into {viec}."}
    assert "de_hieu" not in kq["ban_en"]["muc"][1]                       # sai thuật ngữ → không ghi
    assert kq["loi"]["muc.1.de_hieu"][0]["ma"] == "thuat_ngu"
    assert kq["ban_en"]["_trang_thai"] == "nhap_may" and kq["ban_en"]["source_id"] == "x"


def test_loi_nhac_co_bang_thuat_ngu_va_khong_doan_ngoai():
    tin = quy_trinh.loi_nhac({"k": "Nhật chủ mạnh."}, mang=["bat_tu"], luot=1)
    he = tin[0]["content"]
    assert "Nhật chủ → Day Master" in he and "do not add" in he.lower()


# ---------------------------------------------------------------- HTT-1: cấm dịch sát + cụm "giọng AI" + lượt kiểm định
def test_dich_sat_bi_bat_va_ten_chuan_khong_bi_bat():
    vi = "Mệnh Vô chính diệu: bạn dễ hoà theo môi trường."
    assert "dich_sat" in _ma(kiem.kiem(vi, "An empty destiny: you blend into your surroundings."))
    assert "dich_sat" not in _ma(kiem.kiem(vi, "An empty palace (no major star): you blend into your surroundings."))
    vi2 = "Thương Quan lộ ở trụ tháng."
    assert "dich_sat" not in _ma(kiem.kiem(vi2, "Hurting Officer shows in the month pillar."))   # tên chuẩn cộng đồng


def test_cum_giong_ai_va_dinh_menh():
    vi = "Năm 2027 nên dồn sức vào việc đã chuẩn bị."
    assert "cum_cam" in _ma(kiem.kiem(vi, "In 2027, delve into the rich tapestry of what you prepared."))
    assert "cum_cam" in _ma(kiem.kiem(vi, "You are destined to succeed in 2027 — it is inevitable."))
    assert "cum_cam" not in _ma(kiem.kiem(vi, "In 2027, put your energy into what you have already prepared."))


def _ai_gia_kiem_dinh(ban: dict[str, str], cham: dict[str, dict]):
    """Máy AI giả: lượt 1–2 trả bản Anh theo `ban`; lượt kiểm định (nhận {"vi","en"}) trả điểm theo `cham` (khoá = bản Anh)."""
    def goi(messages, **_):
        nhan = json.loads(messages[-1]["content"].split("INPUT:\n", 1)[1])
        if nhan and all(isinstance(v, dict) for v in nhan.values()):
            return json.dumps({k: cham.get(v["en"], {"trung_thanh": 1, "tu_nhien": 1, "an_toan": True, "dich_nguoc": v["vi"]})
                               for k, v in nhan.items()}, ensure_ascii=False)
        return json.dumps({k: ban.get(v, ban.get(k, "")) for k, v in nhan.items()}, ensure_ascii=False)
    return goi


def test_luot_kiem_dinh_chan_chuoi_khong_dat():
    d = {"source_id": "x", "school_id": "y", "muc": [
        {"ma": "a", "de_hieu": "Nhật chủ mạnh; năm 2027 nên dồn sức vào {viec}."},
        {"ma": "b", "de_hieu": "Nhật chủ yếu; nên nghỉ ngơi nhiều hơn."},
        {"ma": "c", "de_hieu": "Nhật chủ vừa; 2 năm tới nên chú ý sức khoẻ, không thay lời bác sĩ."}]}
    ban = {"Nhật chủ mạnh; năm 2027 nên dồn sức vào {viec}.": "Your Day Master is strong; in 2027, put your energy into {viec}.",
           "Nhật chủ yếu; nên nghỉ ngơi nhiều hơn.": "Your Day Master is weak; rest more.",
           "Nhật chủ vừa; 2 năm tới nên chú ý sức khoẻ, không thay lời bác sĩ.": "Your Day Master is balanced; mind your health over the next 2 years; this is not medical advice."}
    cham = {"Your Day Master is weak; rest more.": {"trung_thanh": 0.6, "tu_nhien": 0.9, "an_toan": True, "ghi_chu": "mất ý 'nhiều hơn'"},
            "Your Day Master is balanced; mind your health over the next 2 years; this is not medical advice.":
                {"trung_thanh": 1, "tu_nhien": 1, "an_toan": True, "dich_nguoc": "Nhật chủ vừa; 3 năm tới nên chú ý sức khoẻ."}}
    kq = quy_trinh.chuyen(d, goi=_ai_gia_kiem_dinh(ban, cham), mang=["bat_tu"])
    muc = kq["ban_en"]["muc"]
    assert muc[0]["de_hieu"].startswith("Your Day Master is strong") and len(muc) == 1   # mục 1, 2 không ghi gì
    assert kq["loi"]["muc.1.de_hieu"][0]["ma"] == "kiem_dinh" and "mất ý" in kq["loi"]["muc.1.de_hieu"][0]["chi_tiet"]
    assert "lệch số" in kq["loi"]["muc.2.de_hieu"][0]["chi_tiet"]
    assert kq["so"] == {"tong": 3, "qua": 1, "kiem_dinh": "dat"}


def test_luot_kiem_dinh_khong_doc_duoc_thi_khong_chan_nhung_bao():
    d = {"source_id": "x", "school_id": "y", "muc": [{"ma": "a", "de_hieu": "Nhật chủ mạnh."}]}
    kq = quy_trinh.chuyen(d, goi=_ai_gia({"Nhật chủ mạnh.": "Your Day Master is strong."}), mang=["bat_tu"])
    assert kq["ban_en"]["muc"][0]["de_hieu"] == "Your Day Master is strong." and kq["so"]["kiem_dinh"] == "khong_doc_duoc"
    kq2 = quy_trinh.chuyen(d, goi=_ai_gia({"Nhật chủ mạnh.": "Your Day Master is strong."}), mang=["bat_tu"], kiem_dinh=False)
    assert kq2["so"]["kiem_dinh"] == "tat"


def test_dich_nguoc_khong_bat_khi_nguon_viet_so_bang_chu():
    # Nguồn "ba tháng" (chữ) → dịch ngược "3 tháng" (số) không phải lỗi (review 2026-11-09).
    d = {"source_id": "x", "school_id": "y", "muc": [{"ma": "a", "de_hieu": "Ba tháng tới nên đi chậm."}]}
    ban = {"Ba tháng tới nên đi chậm.": "Go slowly over the next three months."}
    cham = {"Go slowly over the next three months.": {"trung_thanh": 1, "tu_nhien": 1, "an_toan": True, "dich_nguoc": "3 tháng tới nên đi chậm."}}
    kq = quy_trinh.chuyen(d, goi=_ai_gia_kiem_dinh(ban, cham), mang=["bat_tu"])
    assert kq["ban_en"]["muc"][0]["de_hieu"].startswith("Go slowly") and kq["loi"] == {}
