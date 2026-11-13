# -*- coding: utf-8 -*-
"""EN-ALL mục 5.2 — đầu ra TIẾNG ANH của mọi route: cùng bộ lượt gọi cố định như golden bản Việt, header `x-ngon-ngu: en`.

Mỗi phản hồi: không còn chữ Việt (trừ khoá được phép), không `{slot}` sót, không rác ghép chuỗi; và KHUNG DỮ KIỆN (đường
dẫn, kiểu, số, mã kiểm chứng, mức) giống hệt bản Việt cùng đầu vào — ngôn ngữ chỉ đổi chữ.

`CHUA_XONG` = route CHƯA chuyển thể (đang đỏ có chủ đích), ghi giai đoạn sẽ làm. Làm xong route nào → test báo "đã sạch,
xoá khỏi CHUA_XONG"; route đã sạch mà đỏ lại → hồi quy. Đây là thước đo tiến độ engine của `docs/EN-TIEN-DO.md`.
Hỏi đáp: kho câu tiếng Việt chỉ lấy mẫu 1/15 để soát chữ KHUÔN (bộ câu tiếng Anh riêng từng mảng ở mục 5.3)."""
import collections
import hashlib
import json
import os

import pytest

from tests import _dau_ra as dr

# route → giai đoạn sẽ làm (mục 6 của docs/PROMPT-EN-TOAN-BO.md)
CHUA_XONG: dict[str, int] = {
    # GĐ 2 — nền engine (tên riêng, khuôn dùng chung, danh mục)
    # GĐ 2 xong (2026-11-10): dia_ly, tu_dien, y_dinh, y_dinh.goi_mo, hoi (câu chuẩn), giao_thoa, timebase.
    # Trang kiến thức theo LOẠI (`kb.trang.<loai>`) — chuyển thể cùng giai đoạn của mảng. `kb` = mục lục /v1/kb/trang
    # (+ /v1/kb/status): sạch khi MỌI loại sạch → GĐ 11.
    "kb": 11,
    # GĐ 3 xong (2026-11-10): kb.trang.thap_than, kb.trang.nhat_chu, kb.trang.menh_nam.
    "kb.trang.dau_hieu": 5, "kb.trang.que": 6,
    "kb.trang.so": 7, "kb.trang.so_kep": 7, "kb.trang.cap_so": 7, "kb.trang.nghe": 7, "kb.trang.tinh_yeu": 7,
    "kb.trang.nam_ca_nhan": 7, "kb.trang.no_nghiep": 7, "kb.trang.la_bai": 7,
    "kb.trang.bo_vi": 8,
    # GĐ 3 — Bát tự
    # GĐ 3 xong: battu.la_so, battu.luu_nien, battu.doi_chieu_cach, battu.luan_giai, hoi.battu (2026-11-10, GĐ 3c).
    # GĐ 4 — Tử vi
    # GĐ 4 xong (lá số): tuvi (danh sách lá số mẫu), tuvi.tuan_triet, tuvi.van_han, tuvi.luu_nguyet, tuvi.dinh_gio.
    # GĐ 4 (agent B) xong: tuvi.luan_giai; tuvi.hop_tham (sạch sau bản phủ en/tuvi_y_bo_sung.json); tuvi.an_sao,
    # tuvi.la_so_mau, kb.trang.co_thu (sạch sau bản phủ đủ en/tuvi_cach_cuc.json).
    # GĐ 4 (agent E) xong: hoi.tuvi (hỏi đáp Tử vi: en_gloss._tuvi, hai lượt "bản Việt quyết", gói bằng chứng theo ngôn ngữ).
    # GĐ 4 (agent C) xong: tuvi.phi_hoa, tuvi.nhip_3_thang. tuvi.hop_tham chờ bản phủ en/tuvi_y_bo_sung.json (agent B, hộp cach_doc_them).
    # GĐ 5 — Phong thuỷ
    "phongthuy": 5, "phongthuy.bo_cuc": 5, "phongthuy.cung_phi": 5, "phongthuy.do_huong": 5, "phongthuy.do_thi": 5,
    "phongthuy.huyen_khong": 5, "phongthuy.luan_giai": 5, "phongthuy.menh_quai": 5, "phongthuy.thang_nay": 5,
    "phongthuy.viec_tuan": 5, "hoi.phongthuy": 5,
    # GĐ 6 — Kinh Dịch
    "kinhdich": 6, "kinhdich.hieu_cau": 6, "kinhdich.hoi": 6, "kinhdich.khoi_que": 6, "kinhdich.que_rieng": 6, "hoi.kinhdich": 6,
    # GĐ 7 — Thần số + Tarot đầy đủ
    "thanso.ba_goc_nhin": 7, "thanso.ban_do": 7, "thanso.cap_so": 7, "thanso.chaldea": 7, "thanso.chu_ky": 7, "thanso.do_nhay": 7,
    "thanso.doi_chieu_nam": 7, "thanso.hom_nay": 7, "thanso.hop_doi": 7, "thanso.ngu_canh": 7,
    "thanso.nhip": 7, "thanso.noi_dau": 7, "thanso.the_ngay": 7, "thanso.tong_hop": 7,
    "tarot.the": 7, "goi_y_cheo": 7, "ban_do_5_mang": 7, "thanso.tuan": 7, "thanso.hom_nay_hai": 7,
    # GĐ 8 — nhịp ngày, lịch, năm, tập quán, Nhân tướng, Chân dung, Thời gian tới
    "lich": 8, "lich.chon_ngay": 8, "lich.doi": 8, "lich.nam": 8, "lich.ngay": 8, "lich.ngay_tot": 8,
    "lich.thang": 8, "lich.thang_post": 8, "lich.viec_thang": 8, "nam": 8, "nam.cuoi_hoi": 8, "nam.sinh_con": 8, "nam.tuoi": 8,
    "tuoi.han_nam": 8, "tuoi.lam_nha": 8, "tuoi.lam_nha_nam": 8, "tuoi.sao_han": 8, "tuoi.sao_han_nam": 8, "tuoi.xong_dat": 8,
    "tuoi.xong_dat_nam": 8, "nhan_tuong": 8, "nhan_tuong.hoi": 8, "nhan_tuong.luan_giai": 8, "chan_dung": 8,
    "thoi_gian_toi": 8, "sinh_nuoc_ngoai": 8,
    # GĐ 9 — Web Push theo ngôn ngữ
    "push": 9, "push.sang_nay": 9, "push.thang_hai_la_so": 9, "push.tuan": 9,
    # GĐ 10 — tác giả / EEAT tiếng Anh
    "kb.chuyen_gia": 10,
}
# Route mà khung dữ kiện vi ↔ en CỐ Ý khác (đầu vào là CHỮ theo ngôn ngữ, hoặc quyết định đã ghi):
KHUNG_BO_QUA = {
    "hoi.thanso",        # QTE-3: bản Anh trả lời bằng `hoi_en` gọn — thay bằng bản đầy đủ ở GĐ 7
    "hoi.tuvi", "hoi.battu", "hoi.phongthuy", "hoi.kinhdich", "hoi.dac_biet", "nhan_tuong.hoi",   # câu hỏi tiếng Việt gửi bản Anh
    "tarot.hieu_cau", "tarot.hoi", "tarot.hoi_cau", "kinhdich.hieu_cau", "thanso.ngu_canh",
    "tarot.doc_bai",     # QTE-3: bản phủ tắt `truong_phai` / `viec_lv` (null) → ít hộp hơn; khôi phục ở GĐ 7
}
# Khung lệch CHƯA giải thích — phải sửa ở giai đoạn ghi kèm (ngôn ngữ không được đổi dữ kiện).
# KB-TT1: ý chính cho ảnh tóm tắt (`y_chinh`, rút từ chữ Việt của trang) + bảng năm âm lịch ở mệnh theo năm chỉ có bản Việt —
# bản Anh làm ở giai đoạn ghi kèm (ảnh `/og/y-chinh` chỉ vẽ chữ Việt).
# KT-TT (2026-11-12): lớp tri thức mới CHỈ có bản Việt — bản dịch Ngô Tất Tố (Tiểu tượng, Trình Di, Chu Hy), loại tượng
# tám quái, nghĩa sao nhỏ. Bản Anh chưa có các trường này; chuyển thể cùng giai đoạn của mảng (Tử vi GĐ 4, Kinh Dịch GĐ 6).
KHUNG_CHUA_XONG: dict[str, int] = {"kb.trang.la_bai": 7, "kb.trang.nghe": 7, "kb.trang.tinh_yeu": 7, "goi_y_cheo": 7,
                                   "kb.trang.bo_vi": 7, "kb.trang.menh_nam": 7,
                                   "kb.trang.que": 6, "kinhdich.hoi": 6}


@pytest.fixture(scope="module")
def do():
    """→ {route: {"n", "chu": [(mã, lỗi)], "khung": [mã], "http": [mã]}} sau khi gọi mọi lượt bằng vi + en."""
    c = dr.may_khach()
    tk: dict[str, dict] = collections.defaultdict(lambda: {"n": 0, "chu": [], "khung": [], "http": []})
    with dr.dong_bang():
        for lg in dr.luot_goi(c):
            ma = lg[0]
            if ma.startswith("hoi.") and not ma.startswith(("hoi.cau_chuan", "hoi.dac_biet")) \
                    and int(hashlib.md5(ma.encode()).hexdigest()[:4], 16) % 15:
                continue
            sv, nv = dr.goi(c, lg, "vi")
            se, ne = dr.goi(c, lg, "en")
            t = tk[dr.khoa_route(ma)]
            t["n"] += 1
            if se != sv:
                t["http"].append(f"{ma}: vi {sv} / en {se}")
                continue
            if not ne[:1] in (b"{", b"["):
                continue
            dv, de = json.loads(nv), json.loads(ne)
            loi = dr.loi_en(de, lg[3])
            if loi:
                t["chu"].append((ma, loi[0]))
            if dr.khung(dv) != dr.khung(de):
                t["khung"].append(ma)
    return dict(tk)


@pytest.mark.skipif(os.environ.get("DAU_RA_BO_QUA") == "1", reason="DAU_RA_BO_QUA=1")
def test_chu_tieng_anh_sach(do):
    do_ = {k for k, t in do.items() if t["chu"] or t["http"]}
    hoi_quy = sorted(do_ - set(CHUA_XONG))
    da_sach = sorted(k for k in CHUA_XONG if k in do and k not in do_)
    vang = sorted(k for k in CHUA_XONG if k not in do)
    chi_tiet = "\n".join(f"  {k}: {(do[k]['chu'] or do[k]['http'])[:2]}" for k in hoi_quy)
    assert not hoi_quy, f"Route bản Anh HỒI QUY (còn chữ Việt / slot / mã HTTP lệch):\n{chi_tiet}"
    assert not da_sach, f"Route đã sạch — xoá khỏi CHUA_XONG và cập nhật docs/EN-TIEN-DO.md: {da_sach}"
    assert not vang, f"CHUA_XONG có route không còn trong bộ lượt gọi: {vang}"


@pytest.mark.skipif(os.environ.get("DAU_RA_BO_QUA") == "1", reason="DAU_RA_BO_QUA=1")
def test_khung_du_kien_giong_ban_viet(do):
    lech = {k for k, t in do.items() if t["khung"] and k not in KHUNG_BO_QUA}
    hoi_quy = sorted(lech - set(KHUNG_CHUA_XONG))
    da_khop = sorted(k for k in KHUNG_CHUA_XONG if k not in lech)
    assert not hoi_quy, "Bản Anh đổi DỮ KIỆN (số / mã / số hộp) so với bản Việt: " + \
        "; ".join(f"{k}: {do[k]['khung'][:3]}" for k in hoi_quy)
    assert not da_khop, f"Khung đã khớp — xoá khỏi KHUNG_CHUA_XONG: {da_khop}"


def test_bo_kiem_bat_dung_loi():
    assert dr.loi_en({"a": "Cung Mệnh nói gì"}) and dr.loi_en({"a": "Hello {ten}"}) and dr.loi_en({"a": "This is None of your business, really"})
    assert not dr.loi_en({"ten_viet": "Tử Vi", "ten": "Zi Wei (Purple Star)", "tdm_ten": "L'Impératrice", "x": "physical _bien-être_; also"})
    assert not dr.loi_en({"loi": "Hello Nguyễn Đức Luân, welcome"}, {"ho_ten": ["Nguyễn Đức Luân"]})
    a, b = {"ma_mau": "ds.x", "t": "một", "n": 3}, {"ma_mau": "ds.x", "t": "one", "n": 3}
    assert dr.khung(a) == dr.khung(b) and dr.khung(a) != dr.khung({**b, "n": 4}) and dr.khung(a) != dr.khung({**b, "ma_mau": "ds.y"})
