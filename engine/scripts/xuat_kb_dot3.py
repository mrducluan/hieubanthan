# -*- coding: utf-8 -*-
"""Đợt 3 — Xuất có phép KB Tử Vi Lương phái (672 Tượng) & Trung Châu phái (60 Tinh Hệ) từ SQLite cục bộ."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROJECTS = ROOT.parent
OUT = ROOT / "engine" / "app" / "kb" / "data"

CUNG_MAP = {
    "命宫": "Mệnh", "兄弟宫": "Huynh Đệ", "夫妻宫": "Phu Thê", "子女宫": "Tử Tức",
    "财帛宫": "Tài Bạch", "疾厄宫": "Tật Ách", "迁移宫": "Thiên Di", "交友宫": "Nô Bộc",
    "奴仆宫": "Nô Bộc", "事业宫": "Quan Lộc", "官禄宫": "Quan Lộc",
    "田宅宫": "Điền Trạch", "福德宫": "Phúc Đức", "父母宫": "Phụ Mẫu",
}
HOA_MAP = {"禄": "Lộc", "权": "Quyền", "科": "Khoa", "忌": "Kỵ"}


def main() -> None:
    # 1. Lương Nhược Du 672 Tượng
    c1 = sqlite3.connect(PROJECTS / "ziwei-liang-kb" / "data" / "ziwei_liang_kb.sqlite")
    entries: dict[str, dict] = {}
    for src, hoa, dst, self_h, pg, hant in c1.execute(
        "SELECT source_palace, sihua_type, target_palace, is_self_hua, pdf_page, text_zh_hant FROM sihua_entries ORDER BY entry_id"
    ):
        s_vi = CUNG_MAP.get(src, src)
        h_vi = HOA_MAP.get(hoa, hoa)
        d_vi = CUNG_MAP.get(dst, dst)
        key = f"{s_vi}|{h_vi}|{d_vi}"
        txt = " ".join((hant or "").split())
        if key not in entries or len(txt) > len(entries[key]["sach_ghi"]["han"]):
            entries[key] = {
                "tu_cung": s_vi,
                "hoa": h_vi,
                "den_cung": d_vi,
                "tu_hoa": bool(self_h),
                "sach_ghi": {"han": txt[:650], "trang": f"tr. {pg}" if pg else "bản 672 Tượng"},
            }

    liang_doc = {
        "_nguon": "Trích xuất có phép trực tiếp từ Lương Nhược Du (梁若瑜), Phi Tinh Tử Vi Đẩu Số: Thập Nhị Cung Lục Thất Nhị Tượng (《十二宮六七二象》, Thụy Thành Thư Cục, Đài Loan — kho ziwei-liang-kb).",
        "_trang_thai": "da_doi_chieu_sach_goc",
        "source_id": "tuvi_phi_hoa_luong_672",
        "school_id": "luong_phi_tinh",
        "sach_goc": {
            "ten": "Phi Tinh Tử Vi Đẩu Số: Thập Nhị Cung Lục Thất Nhị Tượng (《十二宮六七二象》)",
            "tac_gia": "Lương Nhược Du (梁若瑜)",
        },
        "tong_so_tuong": len(entries),
        "quy_tac_hai_chieu": {
            "Lộc": {
                "mat_tich_cuc": "Hóa Lộc bay vào cung nào mang tới duyên lành, cơ hội thuận lợi, tâm thế lạc quan và nguồn tài lộc dễ khởi sinh tại lĩnh vực đó.",
                "mat_tieu_cuc_can_chu_y": "Nên chú ý mặt trái của Hóa Lộc theo Lương phái: dễ chủ quan, thiếu quyết liệt, ham thoải mái hoặc đứng núi này trông núi nọ nếu không có Quyền/Khoa nâng đỡ.",
            },
            "Quyền": {
                "mat_tich_cuc": "Hóa Quyền mang lại chủ động, bản lĩnh dám gánh vác, khả năng mở rộng quy mô, thăng tiến và làm chủ tình thế.",
                "mat_tieu_cuc_can_chu_y": "Nên chú ý mặt trái của Hóa Quyền: dễ cứng rắn quá mức, áp đặt, tranh chấp quyền lực hoặc tự tạo áp lực lớn cho bản thân và người thân.",
            },
            "Khoa": {
                "mat_tich_cuc": "Hóa Khoa đem lại sự sáng suốt, danh tiếng tốt, quý nhân trợ giúp kịp lúc và khả năng giải tỏa rắc rối bằng lý lẽ êm thấm.",
                "mat_tieu_cuc_can_chu_y": "Nên chú ý mặt trái của Hóa Khoa: đôi khi quá giữ thể diện, ngại va chạm thẳng thắn hoặc chọn giải pháp an toàn mà bỏ lỡ bước tiến lớn.",
            },
            "Kỵ": {
                "mat_tich_cuc": "Hóa Kỵ bay vào cung nào cũng thể hiện sự tập trung cao độ, gắn bó sâu và ý thức trách nhiệm rất chặt với việc đó (đặc biệt khi nhập cung Nội cục).",
                "mat_tieu_cuc_can_chu_y": "Nên chú ý mặt trái của Hóa Kỵ: dễ sinh chấp niệm, lo âu, trắc trở, hao tổn hoặc xung đột với cung đối diện; cần kiên nhẫn tháo gỡ từng nút thắt.",
            },
        },
        "tuong": entries,
    }
    (OUT / "tuvi_phi_hoa_luong_672.json").write_text(json.dumps(liang_doc, ensure_ascii=False, indent=2), "utf-8")
    print("Wrote tuvi_phi_hoa_luong_672.json:", len(entries))

    # 2. Vương Đình Chi 60 Tinh Hệ Trung Châu
    c2 = sqlite3.connect(PROJECTS / "ziwei-zhongzhou-kb" / "data" / "ziwei_zhongzhou_kb.sqlite")
    systems = []
    for sid, gnum, gname, snum, title_h, stars, branch, p1, p2, hant in c2.execute(
        "SELECT system_id, group_num, group_name_zh, system_num, title_zh_hant, main_stars, palace_branch_pair, page_start, page_end, text_zh_hant FROM star_systems ORDER BY system_num"
    ):
        txt = " ".join((hant or "").split())
        systems.append({
            "ma": sid,
            "so": snum,
            "nhom": gnum,
            "ten_nhom_han": gname,
            "ten_han": title_h,
            "chinh_tinh": stars,
            "cung_chi": branch,
            "sach_ghi": {"han": txt[:500], "trang": f"tr. {p1}–{p2}" if p1 else "Trung Châu Thâm Tạo"},
        })

    zz_doc = {
        "_nguon": "Trích xuất có phép trọn bộ 60 Tinh Hệ từ Vương Đình Chi (王亭之), Trung Châu Phái Tử Vi Đẩu Số Thâm Tạo Giảng Nghĩa (《中州派紫微斗數深造講義》 — kho ziwei-zhongzhou-kb).",
        "_trang_thai": "da_doi_chieu_sach_goc",
        "source_id": "tuvi_trung_chau_60_tinh_he",
        "school_id": "trung_chau",
        "sach_goc": {
            "ten": "Trung Châu Phái Tử Vi Đẩu Số Thâm Tạo Giảng Nghĩa (《中州派紫微斗數深造講義》)",
            "tac_gia": "Vương Đình Chi (王亭之)",
        },
        "tong_so_tinh_he": len(systems),
        "nguyen_tac_luan": {
            "mat_tich_cuc": "Trung Châu phái không luận đơn lẻ từng sao mà xem trọn bộ 60 Tinh Hệ và tương tác giữa cung gốc với cung vận hạn: gặp cát tinh trợ lực thì phát huy đúng sở trường cốt lõi của tinh hệ.",
            "mat_tieu_cuc_can_chu_y": "Nên chú ý: cùng một tinh hệ nhưng khi gặp sát tinh, Hóa Kỵ hoặc rơi vào vận hạn không tương hợp sẽ bộc lộ rõ tính chất thiên lệch; cần xem kỹ cặp sao đối cung để điều chỉnh hành động kịp thời.",
        },
        "tinh_he": systems,
    }
    (OUT / "tuvi_trung_chau_60_tinh_he.json").write_text(json.dumps(zz_doc, ensure_ascii=False, indent=2), "utf-8")
    print("Wrote tuvi_trung_chau_60_tinh_he.json:", len(systems))


if __name__ == "__main__":
    main()
