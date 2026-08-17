# -*- coding: utf-8 -*-
"""Tầng RULES (3) + NARRATIVE (4) cho thần số — ghép luận từ KB.

Chuỗi: CALC (đã có) → chọn nghĩa từ KB theo độ nhạy → dựng văn.

Ba nguyên tắc bất di bất dịch:
  1. Chỉ ghép nội dung TỪ KB. Không có nghĩa trong KB thì im lặng, không bịa.
  2. Mỗi luận giải BẮT BUỘC kèm mặt tối + câu phản chứng (chống Barnum).
  3. Chỉ số KHÔNG xác định (độ nhạy ra nhiều giá trị) phải nói thẳng là chưa
     chốt được, KHÔNG chọn bừa một giá trị rồi luận như thật.

NARRATIVE ở đây là chế độ TEMPLATE (tất định, không LLM) — chạy được ngay không
cần OpenRouter. LLM chỉ là lớp tô điểm thêm về sau, và kể cả khi có LLM, nó chỉ
được diễn đạt lại các trường dưới đây, cấm thêm dữ kiện (CLAUDE.md tầng 4).
"""
from __future__ import annotations

import datetime

from app.calc import thanso
from app.config import ENGINE_VERSION
from app.kb import store

VI_TRI_THU_TU = ["duong_doi", "su_menh", "linh_hon", "nhan_cach"]
SO_NAM_DU_BAO = 3   # năm cá nhân: hiện tại + 2 năm tới


def luan_chieu_sau(ngay: int, thang: int, nam_sinh: int,
                   nam_moc: int | None = None) -> dict:
    """Chiều sâu: đỉnh cao (theo tuổi), thử thách chính, năm cá nhân sắp tới.

    Phép tính từ engine (tất định); nghĩa từ KB chiều sâu (có nguồn). Nếu KB
    chưa có nghĩa cho một giá trị → để None, tầng hiển thị im lặng, không bịa.
    """
    nam_moc = nam_moc or datetime.date.today().year
    dd = thanso.duong_doi(ngay, thang, nam_sinh)

    dinh_cao = [
        {**p, "nghia": store.nghia_dinh_cao(p["so"])}
        for p in thanso.dinh_cao(ngay, thang, nam_sinh, dd)
    ]

    tt = thanso.thu_thach(ngay, thang, nam_sinh)
    thu_thach_chinh = {
        "so": tt["thu_thach_chinh"],
        "nghia": store.nghia_thu_thach(tt["thu_thach_chinh"]),
    }

    bang = thanso.chu_ky_9_nam(ngay, thang, nam_sinh, nam_moc,
                               nam_moc + SO_NAM_DU_BAO - 1)
    nam_ca_nhan = [
        {
            "nam": r["nam"],
            "tuoi": r["tuoi_that"],
            "so": r["moc_duong_lich"],
            "nghia": store.nghia_nam_ca_nhan(r["moc_duong_lich"]),
        }
        for r in bang
    ]

    return {
        "dinh_cao": dinh_cao,
        "thu_thach_chinh": thu_thach_chinh,
        "nam_ca_nhan": nam_ca_nhan,
        "trich_nguon": store.trich_nguon_depth(),
        "cach_doc_chieu_sau": (
            "Đỉnh cao là mạch năng lượng chủ đạo của từng GIAI ĐOẠN đời (theo tuổi). "
            "Thử thách là bài học khó lặp lại. Năm cá nhân là nhịp của từng năm dương "
            "lịch. Tất cả là mẫu hình để ĐỐI CHIẾU với đời thực, không phải mệnh lệnh."
        ),
    }


def _nghia_cua(gia_tri: int) -> dict | None:
    """Lấy nghĩa một số từ KB, kèm trích nguồn. None nếu KB chưa có."""
    m = store.nghia_so(gia_tri)
    if m is None:
        return None
    src = store.nguon(m["source_id"])
    return {
        "gia_tri": gia_tri,
        "tu_khoa": m["tu_khoa"],
        "mat_toi": m["mat_toi"],          # bắt buộc (chống Barnum)
        "phan_chung": m["phan_chung"],    # bắt buộc
        "so_cai": m["so_cai"],
        "trich_nguon": src["ten"] if src else m["source_id"],
    }


def _luan_mot_vi_tri(vi_tri: str, gia_tri_chinh: int,
                     gia_tri_khac: list[int]) -> dict:
    """Luận một vị trí: kết quả CHÍNH theo quy tắc Y khoá, kèm ghi chú độ nhạy."""
    khung = store.khung_vi_tri(vi_tri)
    on_dinh = not gia_tri_khac  # không có giá trị khác dưới quy ước khác

    ket = {
        "vi_tri": vi_tri,
        "ten": khung["ten"] if khung else vi_tri,
        "khung": khung["khung"] if khung else "",
        "gia_tri": gia_tri_chinh,
        "nghia": _nghia_cua(gia_tri_chinh),
        "on_dinh": on_dinh,
        "gia_tri_khac": gia_tri_khac,
    }
    if not on_dinh:
        ket["ghi_chu_do_nhay"] = (
            f"Theo quy ước chính thức, chỉ số này là {gia_tri_chinh}. Nhưng dưới "
            f"quy ước phiên âm khác, nó có thể là {', '.join(map(str, gia_tri_khac))}. "
            "Nêu ra để bạn biết con số này nhạy với cách viết tên — không phải để lung lay."
        )
    if ket["nghia"] is None:
        ket["ghi_chu_do_nhay"] = "Kho quy tắc chưa có nghĩa cho giá trị này."
    return ket


def luan_giai(ho_ten: list[str], ngay: int, thang: int, nam: int) -> dict:
    """Luận giải thần số — kết quả xác định (quy tắc Y khoá) + có nguồn + chống Barnum.

    `ho_ten[0]` là tên chính (dùng cho kết quả chính thức). Các biến thể còn lại
    chỉ dùng để tính độ nhạy (ghi chú), không đổi kết quả chính.
    """
    ten_chinh = ho_ten[0]
    chinh = thanso.chi_so_xac_dinh(ten_chinh, ngay, thang, nam)

    # Độ nhạy THẬT: áp CHÍNH quy tắc khoá lên từng biến thể tên, xem có lệch không.
    # (Không dùng do_nhay vì nó gộp cả các quy ước mà quy tắc khoá đã quyết.)
    theo_bien_the = [
        thanso.chi_so_xac_dinh(t, ngay, thang, nam) for t in ho_ten
    ]

    cac_vi_tri = []
    for vt in VI_TRI_THU_TU:
        gia_tri_chinh = chinh[vt]
        gia_tri_khac = sorted(
            {c[vt] for c in theo_bien_the if c[vt] != gia_tri_chinh}
        )
        cac_vi_tri.append(_luan_mot_vi_tri(vt, gia_tri_chinh, gia_tri_khac))

    so_on_dinh = sum(1 for v in cac_vi_tri if v["on_dinh"])
    return {
        "engine_version": ENGINE_VERSION,
        "ngay_sinh": f"{ngay:02d}/{thang:02d}/{nam}",
        "ten_chinh": ten_chinh,
        "ten_bien_the_da_quet": ho_ten,
        "cac_vi_tri": cac_vi_tri,
        "chieu_sau": luan_chieu_sau(ngay, thang, nam),
        "tom_tat_do_tin": (
            f"Kết quả theo quy ước chính thức (quy tắc Y khoá). "
            f"{so_on_dinh}/4 chỉ số ổn định qua mọi cách viết tên; "
            f"{4 - so_on_dinh} chỉ số nhạy với cách viết (xem ghi chú)."
        ),
        "cach_doc": (
            "Mỗi con số đi kèm MẶT TỐI và một CÂU PHẢN CHỨNG — câu hỏi để bạn "
            "tự kiểm: nếu không trả lời được 'điều gì chứng tỏ tôi KHÔNG phải "
            "số này', thì con số đó chưa nói gì về bạn cả."
        ),
        "trich_nguon_chung": (
            "Nội dung theo dòng Balliett→Jordan (thần số học Pythagoras hiện đại, "
            "Mỹ 1905–1965). Các mô tả khác nhau tuỳ tác giả — tham khảo văn hoá, "
            "không phải dự báo."
        ),
    }
