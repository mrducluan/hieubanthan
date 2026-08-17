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

from app.calc import thanso
from app.config import ENGINE_VERSION
from app.kb import store

VI_TRI_THU_TU = ["duong_doi", "su_menh", "linh_hon", "nhan_cach"]


def _luan_mot_vi_tri(vi_tri: str, gia_tri_co_the: list[int]) -> dict:
    """Luận một vị trí chỉ số, tôn trọng độ nhạy."""
    khung = store.khung_vi_tri(vi_tri)
    on_dinh = len(gia_tri_co_the) == 1

    nghia_list = []
    for gt in gia_tri_co_the:
        m = store.nghia_so(gt)
        if m is None:
            continue  # KB chưa có → im lặng, không bịa
        src = store.nguon(m["source_id"])
        nghia_list.append({
            "gia_tri": gt,
            "tu_khoa": m["tu_khoa"],
            "mat_toi": m["mat_toi"],          # bắt buộc
            "phan_chung": m["phan_chung"],    # bắt buộc
            "so_cai": m["so_cai"],
            "trich_nguon": src["ten"] if src else m["source_id"],
        })

    ket = {
        "vi_tri": vi_tri,
        "ten": khung["ten"] if khung else vi_tri,
        "khung": khung["khung"] if khung else "",
        "on_dinh": on_dinh,
        "gia_tri_co_the": gia_tri_co_the,
        "nghia": nghia_list,
    }
    if not on_dinh:
        ket["canh_bao"] = (
            f"Chỉ số này CHƯA xác định: ra {len(gia_tri_co_the)} giá trị "
            f"({', '.join(map(str, gia_tri_co_the))}) tuỳ quy ước phiên âm. "
            "Chưa thể luận chắc — cần chốt quy ước tên trước. Dưới đây là nghĩa "
            "của từng khả năng, không phải kết luận."
        )
    if not nghia_list:
        ket["canh_bao"] = "Kho quy tắc chưa có nghĩa cho giá trị này."
    return ket


def luan_giai(ho_ten: list[str], ngay: int, thang: int, nam: int) -> dict:
    """Luận giải thần số đầy đủ, có nguồn, chống Barnum, tôn trọng độ nhạy."""
    dn = thanso.do_nhay(ho_ten, ngay, thang, nam)

    cac_vi_tri = []
    for vt in VI_TRI_THU_TU:
        gia_tri = dn.get("duong_doi" if vt == "duong_doi" else vt, [])
        cac_vi_tri.append(_luan_mot_vi_tri(vt, gia_tri))

    so_on_dinh = sum(1 for v in cac_vi_tri if v["on_dinh"])
    return {
        "engine_version": ENGINE_VERSION,
        "ngay_sinh": f"{ngay:02d}/{thang:02d}/{nam}",
        "ten_bien_the_da_quet": ho_ten,
        "cac_vi_tri": cac_vi_tri,
        "tom_tat_do_tin": (
            f"{so_on_dinh}/4 chỉ số ổn định qua mọi quy ước. "
            f"{4 - so_on_dinh} chỉ số phụ thuộc quy ước tên — cần chốt quy ước "
            "để luận chắc."
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
