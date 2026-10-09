# -*- coding: utf-8 -*-
"""BM-1 — lớp lọc chữ trước khi engine trả JSON ra web (chủ dự án yêu cầu 2026-10-09).

Kho tri thức và mã giữ NGUỒN GỐC NỘI BỘ đầy đủ (thư viện, bộ đối chiếu, nhãn nháp AI, ghi chú quyết định) — cần cho
giấy phép và cho người thẩm định. Người đọc chỉ cần nguồn kiểu sách: cổ thư, trường phái. Lớp này viết lại các cụm
nội bộ thành cách ghi công khai, ngay trên chuỗi JSON đã tuần tự hoá (một chỗ, phủ mọi route).

Quy tắc:
- Chỉ thay CỤM CÓ NGỮ CẢNH trong giá trị chuỗi; không chạm khoá JSON (`am_lich_iztro`, `iztro`…) để web không vỡ.
- Thay thế không chứa `"` hay `\\` → JSON vẫn hợp lệ.
- Thêm nguồn mới vào KB mà có tên thư viện/nhãn nội bộ → thêm quy tắc ở đây; `tests/test_cong_khai.py` quét mọi trang
  kiến thức + các công cụ chính và báo nếu còn lọt.
"""
from __future__ import annotations

import re

from fastapi.responses import JSONResponse

_TS = "Thần số học Pythagoras — Hiểu Bản Thân biên soạn từ các sách thần số phổ biến"
_TUVI_KHUNG = ("An sao theo khung Tử Vi Đẩu Số; chính tinh và tứ hoá đã đối chiếu nhiều nguồn, "
               "một số phụ tinh lối Việt còn khác nhau giữa các sách.")

# (mẫu, thay) — chạy theo thứ tự, cụm dài trước cụm ngắn.
QUY_TAC: list[tuple[re.Pattern[str], str]] = [(re.compile(m), t) for m, t in [
    # Thần số: nhãn nguồn nội bộ của các file thanso_*.json
    (r"Bản biên soạn tham khảo \(AI nháp, 2026\) theo truyền thống Balliett–Jordan và sách thần số phổ biến"
     r"(?:; khung mục tham khảo anko-ki-maya \(MIT\))?", _TS),
    (r" — Bản nháp do AI viết, hiển thị theo quyết định chủ dự án 2026-09-30; cột trang_thai để duyệt dần\. ", ". "),
    (r"Bản nháp do AI viết, hiển thị theo quyết định chủ dự án 2026-09-30; cột trang_thai để duyệt dần\. ?", ""),
    (r"Truyền thống Pythagoras / Balliett→Jordan\. Renderings tiếng Việt — tham khảo văn hoá, không verbatim từ một "
     r"sách cụ thể, không phải dự báo\.",
     "Thần số học Pythagoras — Hiểu Bản Thân biên soạn bản tiếng Việt. Tham khảo văn hoá, không phải dự báo."),
    (r"Dòng Balliett → Jordan — Thần số học Pythagoras hiện đại, Mỹ 1905–1965 \(L\. Dow Balliett, Juno Jordan\)\.",
     "Thần số học Pythagoras hiện đại."),
    (r"Nội dung theo dòng Balliett→Jordan \(thần số học Pythagoras hiện đại, Mỹ 1905–1965\)\.",
     "Nội dung theo thần số học Pythagoras hiện đại."),
    (r"Dòng Balliett ?→ ?Jordan", "Thần số học Pythagoras hiện đại"),
    (r"(?:truyền thống |dòng )?Balliett ?[–→-] ?Jordan", "thần số học Pythagoras hiện đại"),
    # Tử vi
    (r"An sao theo iztro \(Tử Vi Đẩu Số\)\. Chính tinh, tứ hoá khớp aov\.cc; bộ phụ tinh Nam phái \(Việt\) chưa được "
     r"đối chiếu đầy đủ\.", _TUVI_KHUNG),
    (r"Lá số an bằng iztro \(khung Tử Vi Đẩu Số\); chính tinh và tứ hoá trùng các nguồn đối chiếu, bộ phụ tinh Nam "
     r"phái chưa đối chiếu đủ\.", _TUVI_KHUNG),
    (r"Bảng tứ hoá theo thiên can: theo iztro \(giữ cho Canh/Nhâm, quyết định 2026-10-02\)\.",
     "Bảng tứ hoá theo thiên can: theo bảng phổ biến của Tử Vi Đẩu Số (can Canh, Nhâm có sách ghi khác)."),
    (r"Khung Nam phái — skill tuvi-vn \(Nguyễn Phát Lộc\)", "Tử vi Nam phái (lối Việt) — theo Nguyễn Phát Lộc"),
    (r", đối chiếu lasotuvi \(MIT\) 60 lá số mẫu", ", đối chiếu với 60 lá số mẫu"),
    (r"; phần mềm iztro \(MIT\) — phổ biến nhất", " — cách phổ biến nhất"),
    (r"tử vi \(theo iztro\)", "tử vi"),
    (r" \(cách của iztro, dùng cho tử vi ở đây\)", " (cách dùng cho tử vi ở đây)"),
    # Lịch, nguồn số hoá, nhãn nháp trong ghi chú nguồn
    (r"âm lịch Hồ Ngọc Đức \(Việt Nam\)", "âm lịch Việt Nam"),
    (r" \(thuật toán Hồ Ngọc Đức\)", ""),
    (r" — ctext\.org/[\w\-/]*", ""),
    (r"; bản số hoá opencode-tianji [\d.]+, MIT", ""),
    (r"bản nháp tổng hợp quan niệm phổ thông", "tổng hợp quan niệm phổ thông"),
    (r"; nháp AI chờ (?:duyệt|thẩm định)[^.\"]*", ""),
    (r"; diễn giải là nháp AI\.?", "."),
    (r" — diễn giải là nháp AI\.?", "."),
    (r"; nháp AI, chưa đối chiếu", "; chưa đối chiếu"),
    (r" Khung mục tham khảo cấu trúc 'dossier' của anko-ki-maya \(MIT, Mahesh Koria\) — KHÔNG chép nội dung "
     r"\(bản gốc theo mulank Ấn Độ, khác trường phái\); toàn bộ văn tiếng Việt do AI biên soạn theo truyền thống "
     r"Pythagoras \(Balliett–Jordan và sách thần số phổ biến\)\.",
     " Hiểu Bản Thân biên soạn theo thần số học Pythagoras và các sách thần số phổ biến."),
    (r" Bổ sung 25 cách \(KB-TV2\): danh mục đối chiếu TuViMCP \(MIT, © 2026 Manh Ha Nguyen, "
     r"github\.com/nmhaaa3218/TuViMCP\); cổ ca", " Cổ ca"),
    (r"[;,] nháp AI chờ [^.\"]*\.", "."),
    (r" — nháp AI chờ duyệt\.", "."),
    (r"(?i:dịch nghĩa \+ ý luận): nháp AI theo lối", "Dịch nghĩa + ý luận: theo lối"),
    (r"dịch nghĩa nháp AI từ", "dịch nghĩa từ"),
    (r": nháp AI — ", ": "),
    (r"Diễn giải nháp AI, chờ đối chiếu\.", "Diễn giải tham khảo, chờ đối chiếu nguyên văn."),
    (r"nháp AI, ", ""),
    (r" Nháp AI, duyệt dần\.", ""),
    (r"Từ điển thuật ngữ dễ hiểu \(GN\) — ", "Từ điển thuật ngữ dễ hiểu — "),
    (r" \((?:[\w.]+ — )?nháp AI\)", ""),
    # Lưới an toàn: tên thư viện / bộ đối chiếu còn sót trong câu chữ (không có `_` hay `"` liền kề → không phải khoá)
    (r"(?<![\w\"])(?:thư viện |phần mềm )?iztro(?: \(MIT\))?(?![\w\"])", "phần mềm an sao"),
    (r"(?<![\w\"])(?:lasotuvi|TuViMCP|anko-ki-maya|aov\.cc)(?: \(MIT\))?(?![\w\"])", "nguồn đối chiếu"),
]] + [
    # Tên cổ thư chỉ ghi chữ Hán → thêm tên Việt (chỉ khi là NGUYÊN giá trị chuỗi).
    (re.compile(f'"{han}"'), f'"{viet} ({han})"') for han, viet in [
        ("淵海子平", "Uyên Hải Tử Bình"), ("子平真詮", "Tử Bình Chân Thuyên"), ("滴天髓", "Trích Thiên Tuỷ"),
        ("陽宅三要", "Dương Trạch Tam Yếu"), ("葬書", "Táng Thư"), ("撼龍經", "Hám Long Kinh"),
    ]
]


def loc(van_ban: str) -> str:
    for mau, thay in QUY_TAC:
        van_ban = mau.sub(thay, van_ban)
    return van_ban


class PhanHoiCongKhai(JSONResponse):
    """JSONResponse mặc định của engine: tuần tự hoá như cũ rồi lọc chữ nội bộ."""

    def render(self, content) -> bytes:  # noqa: ANN001
        return loc(super().render(content).decode("utf-8")).encode("utf-8")
