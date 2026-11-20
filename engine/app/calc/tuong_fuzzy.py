# -*- coding: utf-8 -*-
"""GĐ A — Lớp cầu nối (Bridge Layer 1 → Layer 2): Từ điển điểm mốc chuẩn (Canonical Landmark Dictionary)
+ Mờ hóa chỉ số nhân trắc (Fuzzy Anthropometric Z-Score) + Phân loại Ngũ Hành Bridges (Nhân Tướng) & 4 Dạng Tay (Chỉ Tay).

Hàm thuần, tất định, 0 GPU, 0 LLM, hỗ trợ song ngữ VI/EN sạch (không rò chữ Việt ở bản EN).

GHI CHÚ ĐỘ TIN (chủ dự án giữ lớp này, 2026-11-20 — PR #320):
- Mọi NGƯỠNG ở đây (trung bình / độ lệch của từng tỉ lệ, biên z = 0,85, công thức chấm điểm mềm 5 hình tướng, ngưỡng lòng
  vuông 0,85 / ngón dài 0,82) và mọi con số `confidence` là do ban biên tập TỰ ĐẶT để chia nhóm — KHÔNG lấy từ sách của
  Lillian Bridges hay sách tay phương Tây, và CHƯA hiệu chỉnh trên ảnh thật của người dùng. `confidence` là độ xa ranh giới
  của chính các ngưỡng tự đặt, không phải xác suất đúng.
- Lời 5 hình tướng / 4 dạng tay là tóm ý của ban biên tập (sách Bridges còn bản quyền — không chép nguyên văn).
- Đầu ra luôn mang `do_tin = "bien_tap_tu_dat"` + `ghi_chu` (vi / en) nói đúng các điều trên.
- Lời văn (`_NGHIA_DOI_THUONG_*`, `_DANG_TAY`) còn nằm trong tầng CALC: chuyển sang KB không gọn (hai ngôn ngữ cùng
  bảng, test EN đọc thẳng hàm) — để nguyên, chuyển khi có đợt dọn KB Nhân tướng.
"""
from __future__ import annotations

import math

from app import ngon_ngu

# ---- Lớp 1: Từ điển ánh xạ chuẩn (Canonical Landmark Dictionary) ----------------------------------------------------
CANONICAL_FACE_LANDMARKS: dict[str, dict] = {
    "thien_trung": {"mediapipe_id": 10, "ten_vi": "Thiên Trung (Trán trên)", "ten_en": "Upper Forehead (Trichion proxy)"},
    "an_duong": {"mediapipe_id": 9, "ten_vi": "Ấn Đường (Giữa hai mày)", "ten_en": "Glabella (Seat of the Stamp)"},
    "son_can": {"mediapipe_id": 168, "ten_vi": "Sơn Căn (Gốc mũi · Cung Tật Ách)", "ten_en": "Nasal Bridge Root"},
    "chuan_dau": {"mediapipe_id": 1, "ten_vi": "Chuẩn Đầu (Đỉnh mũi · Cung Tài Bạch)", "ten_en": "Nose Tip"},
    "dia_cac": {"mediapipe_id": 152, "ten_vi": "Địa Các (Cằm · Hạ Đình)", "ten_en": "Chin (Menton)"},
    "quyen_cot": {"mediapipe_ids": [234, 454], "ten_vi": "Quyền Cốt (Hai gò má)", "ten_en": "Bizygomatic Cheekbones"},
    "gian_mon": {"mediapipe_ids": [33, 263], "ten_vi": "Gian Môn (Đuôi mắt · Thái dương)", "ten_en": "Outer Eye Corners"},
}

CANONICAL_HAND_MOUNTS: dict[str, dict] = {
    "moc_tinh": {"joints": [5, 6], "ten_vi": "Gò Mộc Tinh (Gốc ngón trỏ)", "ten_en": "Mount of Jupiter"},
    "tho_tinh": {"joints": [9, 10], "ten_vi": "Gò Thổ Tinh (Gốc ngón giữa)", "ten_en": "Mount of Saturn"},
    "thai_duong": {"joints": [13, 14], "ten_vi": "Gò Thái Dương (Gốc ngón áp út)", "ten_en": "Mount of Apollo"},
    "thuy_tinh": {"joints": [17, 18], "ten_vi": "Gò Thủy Tinh (Gốc ngón út)", "ten_en": "Mount of Mercury"},
    "kim_tinh": {"joints": [0, 1, 2], "ten_vi": "Gò Kim Tinh (Gốc ngón cái)", "ten_en": "Mount of Venus"},
    "thai_am": {"joints": [0, 17], "ten_vi": "Gò Thái Âm (Cạnh ngoài lòng tay)", "ten_en": "Mount of Luna"},
}

# ---- Lớp 2: Mờ hóa chỉ số nhân trắc (Fuzzy Anthropometric Z-Score) --------------------------------------------------
def fuzzy_zscore(val: float, mean: float, std: float, tag_thap: str, tag_vua: str, tag_cao: str, z_bien: float = 0.85) -> dict:
    """Chuyển 1 chỉ số hình học thành {value, z_score, semantic_tag, confidence} mượt mà (không nhảy cóc if/else cứng)."""
    z = (float(val) - mean) / max(std, 1e-6)
    if z <= -z_bien:
        tag = tag_thap
        kc = abs(z) - z_bien
    elif z >= z_bien:
        tag = tag_cao
        kc = abs(z) - z_bien
    else:
        tag = tag_vua
        kc = z_bien - abs(z)
    # Độ tin cậy mượt 0.55..0.97 tăng theo khoảng cách tới ranh giới
    conf = 0.55 + 0.42 * (1.0 / (1.0 + math.exp(-2.2 * kc)))
    return {
        "value": round(float(val), 3),
        "z_score": round(z, 2),
        "semantic_tag": tag,
        "confidence": round(conf, 2),
    }


DO_TIN = "bien_tap_tu_dat"
GHI_CHU_VI = ("Ngưỡng chia nhóm và độ tin cậy ở đây do ban biên tập Hiểu Bản Thân tự đặt, không lấy từ sách và chưa hiệu chỉnh "
              "trên ảnh thật; chỉ để tham khảo.")
GHI_CHU_EN = ("The grouping thresholds and confidence values here were set by the Hieuban editorial team; they do not come from "
              "the book and have not been calibrated on real photos. For reference only.")


def _ghi_chu() -> dict:
    return {"do_tin": DO_TIN, "ghi_chu": GHI_CHU_VI if ngon_ngu.la_viet() else GHI_CHU_EN}


_NGHIA_DOI_THUONG_MAT_VI = {
    "thuy": "Gương mặt có đường nét mềm tròn, tạo cảm giác gần gũi và sâu sắc — kiểu người khéo thích nghi, lắng nghe tốt và xử lý việc bằng sự mềm mỏng.",
    "moc": "Gương mặt dáng dài gọn, đường hàm rõ — kiểu người có tầm nhìn, thích chủ động dẫn dắt và giải quyết vấn đề dứt khoát.",
    "hoa": "Gương mặt thanh thoát thuôn nhẹ về cằm, ánh nhìn nổi bật — kiểu người giàu năng lượng, giao tiếp cuốn hút và dễ truyền cảm hứng.",
    "tho": "Gương mặt đầy đặn cân đối, phần hàm vững — kiểu người thực tế, đáng tin cậy, làm việc bền bỉ và rất chu đáo với người xung quanh.",
    "kim": "Gương mặt sắc nét cân xứng, gò má gọn — kiểu người tự lập, nguyên tắc rõ ràng, có gu thẩm mỹ tinh tế và làm việc ngăn nắp.",
}

_NGHIA_DOI_THUONG_MAT_EN = {
    "thuy": "Rounded, balanced contours — typically adaptable, perceptive, and skilled at navigating complexity calmly.",
    "moc": "Elongated structure with clear jaw definition — typically forward-looking, decisive, and action-oriented.",
    "hoa": "Tapered lower face with expressive proportions — typically warm, communicative, and quick to spark momentum.",
    "tho": "Grounded, well-proportioned features with a steady jawline — typically reliable, practical, and supportive.",
    "kim": "Crisp, symmetrical contours — typically self-reliant, structured, and attentive to standards.",
}

_DANG_TAY = {
    "tho": {
        "ten_vi": "Bàn tay Thổ (Lòng vuông · Ngón ngắn)",
        "ten_en": "Earth Hand (Square Palm · Short Fingers)",
        "nghia_doi_thuong_vi": "Kiểu người thực tế, tay làm hàm nhai, thích việc rõ ràng sờ nắm được hơn là nói lý thuyết dài dòng.",
        "nghia_doi_thuong_en": "Practical, grounded, and hands-on; prefers tangible results over abstract theory.",
        "mat_tich_cuc_vi": "Bền bỉ, đáng tin cậy, giải quyết công việc chắc tay và giữ nhịp sống ổn định.",
        "mat_tieu_cuc_vi": "Nên chú ý: đôi khi hơi cứng nhắc trước thay đổi đột ngột hoặc ngại thử cách làm mới.",
        "mat_tich_cuc_en": "Steady, reliable, and effective at turning plans into concrete outcomes.",
        "mat_tieu_cuc_en": "Watch for reluctance to adapt when routines or plans shift abruptly.",
    },
    "khi": {
        "ten_vi": "Bàn tay Khí (Lòng vuông · Ngón dài)",
        "ten_en": "Air Hand (Square Palm · Long Fingers)",
        "nghia_doi_thuong_vi": "Kiểu người tư duy nhanh, thích phân tích, giao tiếp mạch lạc và học rất nhanh các khái niệm mới.",
        "nghia_doi_thuong_en": "Analytical, curious, and articulate; excels at ideas, systems, and communication.",
        "mat_tich_cuc_vi": "Sắc sảo về lập luận, giỏi kết nối thông tin và nhìn vấn đề đa chiều khách quan.",
        "mat_tieu_cuc_vi": "Nên chú ý: dễ suy nghĩ quá nhiều trước khi hành động hoặc hay đổi hướng khi mất hứng thú.",
        "mat_tich_cuc_en": "Clear reasoning, strong communication, and objective problem-solving.",
        "mat_tieu_cuc_en": "Watch for over-analyzing decisions instead of taking the first practical step.",
    },
    "hoa": {
        "ten_vi": "Bàn tay Hỏa (Lòng dài · Ngón ngắn)",
        "ten_en": "Fire Hand (Rectangular Palm · Short Fingers)",
        "nghia_doi_thuong_vi": "Kiểu người nhiệt huyết, quyết nhanh làm gọn, giàu năng lượng khởi xướng và thích không khí sôi nổi.",
        "nghia_doi_thuong_en": "Energetic, bold, and decisive; thrives on momentum, initiative, and leadership.",
        "mat_tich_cuc_vi": "Dám nghĩ dám làm, truyền lửa tốt cho tập thể và tạo đột phá nhanh ở giai đoạn mở đầu.",
        "mat_tieu_cuc_vi": "Nên chú ý: dễ nóng vội, thiếu kiên nhẫn với các chi tiết nhỏ lặp lại hàng ngày.",
        "mat_tich_cuc_en": "Strong initiative, contagious enthusiasm, and quick execution at launch.",
        "mat_tieu_cuc_en": "Watch for impatience with repetitive details or rushing past verification.",
    },
    "thuy": {
        "ten_vi": "Bàn tay Thủy (Lòng dài · Ngón dài)",
        "ten_en": "Water Hand (Rectangular Palm · Long Fingers)",
        "nghia_doi_thuong_vi": "Kiểu người tinh tế, giàu cảm xúc và trực giác, dễ thấu hiểu người khác và có khiếu sáng tạo nghệ thuật.",
        "nghia_doi_thuong_en": "Intuitive, empathetic, and creative; deeply attuned to nuance and human emotion.",
        "mat_tich_cuc_vi": "Đồng cảm sâu, tư duy thẩm mỹ tốt và khéo léo trong các công việc cần sự tinh tế.",
        "mat_tieu_cuc_vi": "Nên chú ý: dễ bị ảnh hưởng bởi môi trường xung quanh hoặc hay lo nghĩ quá sâu về chuyện cảm xúc.",
        "mat_tich_cuc_en": "High empathy, creative imagination, and sensitivity to subtle cues.",
        "mat_tieu_cuc_en": "Watch for absorbing external stress or letting mood steer practical boundaries.",
    },
}


def cau_noi_nhan_tuong(so_do: dict) -> dict:
    """Layer 1 → Layer 2 cho Nhân Tướng: Fuzzy Z-Score + tự phân loại 5 Hình Tướng Ngũ Hành Lillian Bridges."""
    vi = ngon_ngu.la_viet()
    cr = float(so_do.get("cao_rong", 1.32))
    tm = float(so_do.get("tran_ma", 0.88))
    hm = float(so_do.get("ham_ma", 0.78))
    mk = float(so_do.get("may_khoe", 0.90))
    td = so_do.get("tam_dinh") or {}

    chi_so: dict[str, dict] = {
        "cao_rong": fuzzy_zscore(cr, 1.32, 0.09, "mat_ngan_tron", "mat_can_doi", "mat_dai_gon"),
        "ham_ma": fuzzy_zscore(hm, 0.78, 0.06, "ham_thon_nhon", "ham_can_doi", "ham_vuong_vung"),
        "an_duong": fuzzy_zscore(mk, 0.90, 0.14, "an_duong_hep", "an_duong_vua", "an_duong_rong_sang"),
    }
    if td and "thuong" in td:
        chi_so["thuong_dinh"] = fuzzy_zscore(float(td["thuong"]) / 100.0, 0.33, 0.04, "thuong_dinh_ngan", "thuong_dinh_can_doi", "thuong_dinh_cao_rong")

    # Chấm điểm mềm cho 5 Hình Tướng Lillian Bridges từ tỷ lệ hình học chuẩn hóa
    diem = {
        "moc": max(0.0, (cr - 1.30) * 6.0) + max(0.0, (hm - 0.76) * 4.0) + 0.4,
        "hoa": max(0.0, (tm - hm - 0.06) * 8.0) + 0.35,
        "tho": max(0.0, (hm - 0.80) * 8.0) + max(0.0, (1.34 - cr) * 3.0) + 0.35,
        "thuy": max(0.0, (1.28 - cr) * 7.0) + max(0.0, (0.82 - abs(tm - hm)) * 0.5) + 0.35,
        "kim": max(0.0, 1.2 - abs(cr - 1.33) * 6.0 - abs(hm - 0.76) * 5.0) + 0.3,
    }
    tong = sum(diem.values()) or 1.0
    xep = sorted(((k, v / tong) for k, v in diem.items()), key=lambda x: -x[1])
    hanh_chinh, ty_le = xep[0]
    conf = round(min(0.95, max(0.55, 0.52 + ty_le * 1.15)), 2)

    bridges_kb = None
    if vi:
        from app.kb import tuong_hoc_dot4_kb  # noqa: PLC0415
        bridges_kb = tuong_hoc_dot4_kb.tra_ngu_hanh_bridges(hanh_chinh)

    return {
        "provenance": "bien_tap_can_doi_chieu",
        **_ghi_chu(),
        "chi_so_fuzzy": chi_so,
        "ngu_hanh_bridges": {
            "hanh": hanh_chinh,
            "confidence": conf,
            "semantic_tag": f"hinh_tuong_{hanh_chinh}",
            "nghia_doi_thuong": _NGHIA_DOI_THUONG_MAT_VI[hanh_chinh] if vi else _NGHIA_DOI_THUONG_MAT_EN[hanh_chinh],
            **({"ten": bridges_kb["ten"], "mat_tich_cuc": bridges_kb["mat_tich_cuc"],
                "mat_tieu_cuc_can_chu_y": bridges_kb["mat_tieu_cuc_can_chu_y"],
                "sach_ghi": bridges_kb["sach_ghi"]} if (vi and bridges_kb) else {}),
        },
        "canonical_landmarks": list(CANONICAL_FACE_LANDMARKS.keys()),
    }


def cau_noi_chi_tay(so_do: dict) -> dict:
    """Layer 1 → Layer 2 cho Chỉ Tay: Fuzzy Z-Score + tự phân loại 4 Dạng Bàn Tay (Hỏa/Thổ/Khí/Thủy)."""
    vi = ngon_ngu.la_viet()
    rl = float(so_do.get("rong_long", 0.85))
    ng_giua = float((so_do.get("ngon") or {}).get("giua", 0.82))
    r24 = float(so_do.get("tro_ap_ut", 0.98))

    chi_so = {
        "rong_long": fuzzy_zscore(rl, 0.85, 0.06, "long_ban_tay_dai", "long_ban_tay_vua", "long_ban_tay_vuong_rong"),
        "ngon_giua": fuzzy_zscore(ng_giua, 0.82, 0.06, "ngon_tay_ngan", "ngon_tay_vua", "ngon_tay_dai"),
        "ty_le_2d_4d": fuzzy_zscore(r24, 0.98, 0.04, "ngon_ap_ut_dai_hon", "tro_ap_ut_can_doi", "ngon_tro_dai_hon"),
    }
    long_vuong = rl >= 0.85
    ngon_dai = ng_giua >= 0.82
    ma = ("khi" if ngon_dai else "tho") if long_vuong else ("thuy" if ngon_dai else "hoa")
    kc = min(abs(rl - 0.85) / 0.06, abs(ng_giua - 0.82) / 0.06)
    conf = round(0.58 + 0.37 * (1.0 / (1.0 + math.exp(-2.0 * kc))), 2)
    m = _DANG_TAY[ma]
    return {
        "provenance": "bien_tap_can_doi_chieu",
        **_ghi_chu(),
        "chi_so_fuzzy": chi_so,
        "dang_ban_tay": {
            "ma": ma,
            "ten": m["ten_vi"] if vi else m["ten_en"],
            "confidence": conf,
            "semantic_tag": f"ban_tay_{ma}",
            "nghia_doi_thuong": m["nghia_doi_thuong_vi"] if vi else m["nghia_doi_thuong_en"],
            "mat_tich_cuc": m["mat_tich_cuc_vi"] if vi else m["mat_tich_cuc_en"],
            "mat_tieu_cuc_can_chu_y": m["mat_tieu_cuc_vi"] if vi else m["mat_tieu_cuc_en"],
        },
        "canonical_mounts": list(CANONICAL_HAND_MOUNTS.keys()),
    }
