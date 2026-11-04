# -*- coding: utf-8 -*-
"""TV-YBS — "Một cách đọc thêm" trong hỏi đáp Tử vi.

Khoá: đoạn chỉ có khi lá số khớp mục KB (`hien_thi = hop`), đứng SAU câu trả lời chính và trước phần chân; tối đa một
"Một trường phái khác còn đọc" (chỉ khi luật nêu đích danh cung đang hỏi); không bao giờ ở câu khủng hoảng / từ chối /
dẫn hướng / khủng hoảng quan hệ; mã mục nằm trong gói bằng chứng và bộ kiểm đầu ra AI chấp nhận câu; không cụm cấm;
sức khoẻ kèm "không thay lời bác sĩ". Câu hỏi phương pháp → câu trả lời kiến thức dùng mục phương pháp."""
from __future__ import annotations

import datetime as dt

import pytest

from app.hoidap import tuvi as tv
from app.hoidap import tuvi_y_bo_sung as ybs
from app.kb import tuvi_y_bo_sung as kyb
from app.narrative import hoi_van, kiem_ai
from tests.test_kb_y_bo_sung import CAM

XEM = dt.date(2026, 11, 4)
NU_90 = {"ngay": dt.date(1990, 5, 12), "ti": 4, "gioi_tinh": "nu"}      # Thiên Đồng hoá Kỵ ở Phu Thê, Thiên Lương QL
NAM_85 = {"ngay": dt.date(1985, 9, 3), "ti": 7, "gioi_tinh": "nam"}     # Thiên Cơ ở Phu Thê
NAM_78 = {"ngay": dt.date(1978, 1, 22), "ti": 2, "gioi_tinh": "nam"}    # Thất Sát cư Thân


def _hoi(cau: str, sinh: dict | None = NU_90) -> dict:
    return tv.tra_loi(cau, sinh=sinh, ngay_xem=XEM)


def _doan(kq: dict) -> list[str]:
    return [p for p in kq["cau_tra_loi"].split("\n\n") if ybs.la_doan_them(p)]


def _ma(kq: dict) -> list[str]:
    return [m["ma"] for m in kq["bang_chung"]["muc"] if m.get("loai") == "y_bo_sung"]


# ------------------------------------------------------------------ có khi khớp
@pytest.mark.parametrize("cau,sinh,ma", [
    ("Tình duyên của tôi thế nào?", NU_90, "yb.hoa.ky_nghi_khong_thong"),
    ("Tình duyên của tôi thế nào?", NAM_85, "yb.hon.thien_co_phu_the_doi_y"),
    ("Sự nghiệp của tôi ra sao?", NU_90, "yb.sao.thien_luong_phan_xu"),
    ("Sự nghiệp của tôi ra sao?", NAM_78, "yb.sao.that_sat_cung_than"),
    ("Thất Sát trong lá số của tôi nói gì?", NAM_78, "yb.sao.that_sat_cung_than"),
    ("Năm 2027 sức khoẻ của tôi thế nào?", NU_90, "yb.sk.kinh_da_nam_kham"),
    ("Mười năm tới sự nghiệp tôi ra sao?", NAM_85, "yb.hoa.ky_dai_han_chan"),
])
def test_co_doan_khi_khop(cau, sinh, ma):
    kq = _hoi(cau, sinh)
    assert _ma(kq)[0] == ma
    m = kyb.lay(ma)
    d = _doan(kq)
    assert d and d[0].startswith(ybs.TIEN_TO_HOP)
    # lời hiển thị = bản tự đứng được (`yb.loi_hien`, review CY-1: không "nét này" trơ trọi)
    loi = (m.get("loi_ro") or m["loi_doi_thuong"]).split("{mang}")[-1]
    assert loi[1:].rstrip(".") in d[0] and ybs.yb.viec_hien(m)[1:].rstrip(".") in d[0]
    assert sum(p.startswith(ybs.TIEN_TO_HOP) for p in d) == 1          # MỘT đoạn ý chung
    assert sum(p.startswith(ybs.TIEN_TO_GOC) for p in d) <= 1


def test_vi_tri_sau_cau_chinh_truoc_phan_chan():
    for cau, sinh in [("Tình duyên của tôi thế nào?", NAM_85), ("Sự nghiệp của tôi ra sao?", NU_90),
                      ("Năm nay công việc của tôi ra sao?", NAM_85)]:
        p = _hoi(cau, sinh)["cau_tra_loi"].split("\n\n")
        i = [k for k, x in enumerate(p) if ybs.la_doan_them(x)]
        assert i and i[0] >= 1, cau                                     # không bao giờ là đoạn mở đầu
        sau = p[i[-1] + 1:]
        assert all(x.startswith(("Câu hỏi để tự soi", "Lưu ý", "Đây là góc nhìn", "Lời này không thay", "Tham khảo"))
                   for x in sau), (cau, sau)


def test_goc_nhin_khac_toi_da_mot_va_dung_cung():
    kq = _hoi("Sự nghiệp của tôi ra sao?", NU_90)
    goc = [m for m in kq["bang_chung"]["muc"] if m.get("loai") == "y_bo_sung" and m["vai"] == "goc_nhin_khac"]
    assert len(goc) == 1
    m = kyb.lay(goc[0]["ma"])
    assert m["hien_thi"] == "goc_nhin_khac" and "Quan Lộc" in (m["dieu_kien"]["cung"] if isinstance(
        m["dieu_kien"]["cung"], list) else [m["dieu_kien"]["cung"]])
    assert any(p.startswith(ybs.TIEN_TO_GOC) for p in _doan(kq))


# ------------------------------------------------------------------ không có
@pytest.mark.parametrize("cau,sinh", [
    ("Tình duyên của tôi thế nào?", NAM_78),            # lá này không khớp mục nào ở Phu Thê
    ("Tình duyên của tôi thế nào?", None),              # không lá số
    ("Tính cách của tôi thế nào?", NU_90),              # không thuộc loại câu được thêm
    ("Tiểu hạn năm nay của tôi ở cung nào?", NU_90),    # câu dò vị trí
    ("Tam tai của tôi rơi vào năm nào?", NU_90),        # tập quán
    ("3 tháng tới tôi cần để ý gì?", NU_90),
    ("Chồng tôi ngoại tình, tử vi nói gì?", NU_90),     # khủng hoảng quan hệ
    ("Tôi muốn chết, lá số tôi có gì?", NU_90),         # khủng hoảng
    ("Năm nào tôi sẽ chết?", NU_90),                    # từ chối
    ("Nhà tôi có bị vong theo không?", NU_90),          # dẫn hướng
    ("Năm nay tôi có trúng số không?", NU_90),
])
def test_khong_co_doan(cau, sinh):
    kq = _hoi(cau, sinh)
    assert not _doan(kq) and not _ma(kq)


def test_bo_cau_an_toan_khong_co_doan():
    import json
    from pathlib import Path
    bo = json.loads((Path(__file__).parents[1] / "fixtures" / "cau_hoi" / "an_toan_v1.json").read_text(encoding="utf-8"))
    cau = [c if isinstance(c, str) else (c.get("cau") or c.get("cau_hoi")) for k in ("khung_hoang", "tu_choi")
           for c in bo.get(k, [])]
    assert cau
    for c in cau:
        kq = _hoi(c)
        assert kq["phan_loai"]["xu_ly"] in ("an_toan", "tu_choi_nhe", "dan_huong"), c     # bộ chặn không đổi
        assert not _doan(kq) and not _ma(kq), c


# ------------------------------------------------------------------ lời, bằng chứng, bộ kiểm AI
def _cac_doan_mau() -> list[tuple[str, dict]]:
    ra = []
    for cau in ["Tình duyên của tôi thế nào?", "Sự nghiệp của tôi ra sao?", "Tiền bạc của tôi thế nào?",
                "Năm nay của tôi thế nào?", "Năm 2027 sức khoẻ của tôi thế nào?", "Năm nay công việc của tôi ra sao?",
                "Mười năm tới sự nghiệp tôi ra sao?"]:
        for s in (NU_90, NAM_85, NAM_78):
            kq = _hoi(cau, s)
            ra += [(p, kq) for p in _doan(kq)]
    return ra


def test_khong_cum_cam_va_bo_kiem_ai_chap_nhan():
    ds = _cac_doan_mau()
    assert len(ds) >= 10
    for p, kq in ds:
        thuong = p.lower()
        for c in CAM + kiem_ai.CAM:
            assert c.lower() not in thuong, (c, p)
        assert hoi_van.kiem_tra_dau_ra(p, kq["bang_chung"], kq["cau_tra_loi"]) == [], p
        assert not any(ch.isdigit() for ch in p), p                     # lời KB không mang con số


def test_ma_trong_goi_bang_chung_va_goi_llm():
    kq = _hoi("Sự nghiệp của tôi ra sao?", NU_90)
    ma = _ma(kq)
    assert ma and all(kyb.lay(x) for x in ma)
    llm = tv.goi_cho_llm(kq["bang_chung"])
    assert [m["ma"] for m in llm["muc"] if m.get("ma", "").startswith("yb.")] == ma
    # căn cứ "Vì sao nói vậy" mang ý gốc (thuật ngữ được dùng ở đây)
    assert any(x.startswith("Cách đọc thêm — căn cứ:") for x in kq["can_cu"])


def test_suc_khoe_kem_khong_thay_loi_bac_si():
    for p, kq in _cac_doan_mau():
        if "sức khoẻ" in p or any(m.get("loai_y") == "suc_khoe_phong_ngua" for m in kq["bang_chung"]["muc"]
                                  if m.get("loai") == "y_bo_sung" and m.get("doi_thuong") == p):
            assert ybs.KHONG_THAY in p, p
    # đoạn dựng từ mục sức khoẻ thiếu câu → tự thêm
    m = {**kyb.lay("yb.sk.kinh_da_nam_kham"), "loi_doi_thuong": "Năm có nét này nên chú ý sức khoẻ bản thân."}
    assert ybs.KHONG_THAY in ybs.loi(m, ybs.TIEN_TO_HOP)


# ------------------------------------------------------------------ câu hỏi phương pháp
@pytest.mark.parametrize("cau,ma", [
    ("Xem Phu Thê có cần xem Phúc Đức không?", "yb.pp.doi_cung_tam_phuong"),
    ("Đại hạn và lưu niên cái nào quan trọng hơn?", "yb.pp.dai_han_chinh_luu_nien_phu"),
    ("Hồng Loan và Thiên Hỷ là gì?", "yb.hon.hong_hy_doi_xung"),
    ("Sát tinh miếu vượng khác sát tinh hãm thế nào?", "yb.pp.sat_sang_ham"),
    ("Tiểu hạn là gì, tính thế nào?", "yb.pp.tieu_han_nam_thuan_nu_nghich"),
])
def test_cau_phuong_phap(cau, ma):
    kq = tv.tra_loi(cau)                                                # không cần lá số
    assert kq["phan_loai"]["loai"] in ("ky_thuat", "phu_tinh")         # phụ tinh giữ đường cũ, thêm ý phương pháp
    assert not kq["can_them"]
    m = [x for x in kq["bang_chung"]["muc"] if x.get("loai") == "phuong_phap"]
    assert m and m[0]["ma"] == ma
    # review CY-1: bản tóm ý nguồn (`y_goc_tom_tat`) là nội bộ — câu trả lời dùng lời đời thường + việc nên làm
    assert kyb.lay(ma)["loi_doi_thuong"][:30] in kq["cau_tra_loi"]
    assert kyb.lay(ma)["y_goc_tom_tat"][:30] not in kq["cau_tra_loi"]
    assert hoi_van.kiem_tra_dau_ra(m[0]["noi_dung"], kq["bang_chung"], kq["cau_tra_loi"]) == []


def test_quan_he_hai_cung_tinh_tu_thu_tu_cung():
    kq = tv.tra_loi("Xem Phu Thê có cần xem Phúc Đức không?")
    assert "Phúc Đức là cung tam hợp của Phu Thê" in kq["cau_tra_loi"]
    kq = tv.tra_loi("Đọc cung Mệnh có cần xem cung Thiên Di không?")
    assert "Thiên Di là cung đối diện (xung chiếu) của Mệnh" in kq["cau_tra_loi"]


def test_cau_ca_nhan_khong_thanh_phuong_phap():
    pl = tv.phan_loai("Lá số của tôi có cần xem Phúc Đức không?")
    assert not pl["phuong_phap"]
