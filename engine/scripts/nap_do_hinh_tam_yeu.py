# -*- coding: utf-8 -*-
"""Dựng engine/app/kb/data/phongthuy_tam_yeu_do_hinh.json và gắn `nguyen_van_doi_chieu`
vào engine/app/kb/data/phongthuy_tam_yeu.json từ kho nguồn fixtures/nguon/duong_trach_tam_yeu.json
và danh mục biểu đồ cục bộ fengshui-yangzhai-kb.

Quy tắc bản quyền (TK-2 Phương án A):
- Không đưa ảnh quét có bản quyền (JPEG) và không chép lời bạch thoại của Trần Tử Minh (2010) vào repo công khai.
- Mọi đồ hình lý thuyết, sơ đồ 64 thế nhà (Cửa × Chủ), sơ đồ 64 thế bếp (Bếp × Cửa) được mã hoá dạng dữ liệu cấu trúc
  (lưới Cửu Cung 3×3 + sơ đồ Mermaid + đối chiếu phép tính `app.calc.phongthuy.bang_huong`).
- Mọi câu `han` đều được kiểm chứng là chuỗi con khớp nguyên văn của `fixtures/nguon/duong_trach_tam_yeu.json`.
"""
from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from app.calc import phongthuy as pt  # noqa: E402

DEFAULT_DB = Path("/Users/mrducluan/aicoworker/openclaw/workspace-main/projects/fengshui-yangzhai-kb/data/fengshui_yangzhai_kb.sqlite")
NGUON_PATH = GOC / "fixtures" / "nguon" / "duong_trach_tam_yeu.json"
TAM_YEU_PATH = GOC / "app" / "kb" / "data" / "phongthuy_tam_yeu.json"
DO_HINH_OUT = GOC / "app" / "kb" / "data" / "phongthuy_tam_yeu_do_hinh.json"

# Toạ độ Hậu Thiên Bát Quái trên lưới 3×3 (hàng 0 = Nam trên cùng theo quy ước la bàn cổ; cột 0 = Đông Nam)
LUOI_POS: dict[str, tuple[int, int]] = {
    "Tốn": (0, 0),
    "Ly": (0, 1),
    "Khôn": (0, 2),
    "Chấn": (1, 0),
    "Đoài": (1, 2),
    "Cấn": (2, 0),
    "Khảm": (2, 1),
    "Càn": (2, 2),
}

HANH_QUAI: dict[str, str] = {
    "Càn": "Kim",
    "Đoài": "Kim",
    "Ly": "Hoả",
    "Chấn": "Mộc",
    "Tốn": "Mộc",
    "Khảm": "Thuỷ",
    "Cấn": "Thổ",
    "Khôn": "Thổ",
}

SINH_MAP = {
    ("Mộc", "Hoả"): "sinh",
    ("Hoả", "Thổ"): "sinh",
    ("Thổ", "Kim"): "sinh",
    ("Kim", "Thuỷ"): "sinh",
    ("Thuỷ", "Mộc"): "sinh",
}
KHAC_MAP = {
    ("Mộc", "Thổ"): "khắc",
    ("Thổ", "Thuỷ"): "khắc",
    ("Thuỷ", "Hoả"): "khắc",
    ("Hoả", "Kim"): "khắc",
    ("Kim", "Mộc"): "khắc",
}

LOAI_BIEU_DO_VI: dict[str, str] = {
    "illustrated_diagram": "Sơ đồ lý thuyết & minh hoạ nguyên lý",
    "floorplan_bazao": "Mặt bằng bố trí Môn – Chủ – Bát Táo",
    "diagram_illustration": "Đồ hình bố cục & hướng nhà",
    "star_chart": "Biểu đồ Cửu Tinh / Du Niên",
    "compass_bagua_diagram": "Sơ đồ La bàn & Bát Quái phương vị",
    "photo_illustration": "Ảnh ví dụ hình thế thực tế",
}

QUYEN_VI: dict[str, str] = {
    "导读卷": "Đạo Độc Quyển (Tổng quan)",
    "卷一": "Quyển 1 (Nền tảng & Tĩnh/Động/Biến/Hoá Trạch)",
    "卷二": "Quyển 2 (Đông Tứ Trạch & Môn – Chủ phối Bát Táo)",
    "卷三": "Quyển 3 (Tây Tứ Trạch & Môn – Chủ phối Bát Táo)",
    "卷四": "Quyển 4 (64 thế Bếp – Cửa & Quẻ Dịch ứng nghiệm)",
}


def quan_he_hanh(a: str, b: str) -> str:
    ha, hb = HANH_QUAI[a], HANH_QUAI[b]
    if ha == hb:
        return f"Tỷ hoà ({ha} – {hb})"
    if (ha, hb) in SINH_MAP:
        return f"Tương sinh ({ha} sinh {hb})"
    if (hb, ha) in SINH_MAP:
        return f"Tương sinh ({hb} sinh {ha})"
    if (ha, hb) in KHAC_MAP:
        return f"Tương khắc ({ha} khắc {hb})"
    if (hb, ha) in KHAC_MAP:
        return f"Tương khắc ({hb} khắc {ha})"
    return f"{ha} – {hb}"


def tao_luoi_3x3(nhan_a: str, quai_a: str, nhan_b: str, quai_b: str) -> list[list[str]]:
    """Tạo lưới Cửu Cung 3×3 (trên = Nam, dưới = Bắc, trái = Đông, phải = Tây)."""
    grid = [
        ["Tốn (Đông Nam)", "Ly (Nam)", "Khôn (Tây Nam)"],
        ["Chấn (Đông)", "Trung Cung", "Đoài (Tây)"],
        ["Cấn (Đông Bắc)", "Khảm (Bắc)", "Càn (Tây Bắc)"],
    ]
    ra, ca = LUOI_POS[quai_a]
    rb, cb = LUOI_POS[quai_b]
    if (ra, ca) == (rb, cb):
        grid[ra][ca] = f"{quai_a} [{nhan_a} + {nhan_b}]"
    else:
        grid[ra][ca] = f"{quai_a} [{nhan_a}]"
        grid[rb][cb] = f"{quai_b} [{nhan_b}]"
    return grid


def verify_in_nguon(han: str, thien_list: list[dict]) -> dict:
    for t in thien_list:
        flat = t["van"].replace("\n", "")
        if han in flat:
            return {"so": t["so"], "quyen": t["quyen"], "trang_pdf": t["trang_pdf"], "trang_sach": t["trang_sach"]}
    raise AssertionError(f"Câu nguyên văn không có trong fixtures/nguon/duong_trach_tam_yeu.json: {han}")


def build_do_hinh_ly_thuyet(thien_list: list[dict]) -> list[dict]:
    specs = [
        {
            "ma": "tam_yeu_mon_chu_tao",
            "ten": "Sơ đồ Tam Yếu: Cửa – Chủ – Bếp",
            "ten_han": "陽宅三要圖（門・主・竈）",
            "nhom": "nen_tang",
            "han": "三者何門主竈是也門乃由之路主乃冒之所竈乃食之方",
            "mo_ta": "Ba điểm quyết định của dương trạch là Cửa chính (lối khí vào), Phòng chủ (gian cao rộng làm trọng tâm) và Bếp (nguồn nuôi dưỡng). Luận nhà lấy Cửa làm mốc để xác định du niên tới Chủ và Bếp; ưu tiên Cửa–Chủ tương sinh cùng nhóm Đông/Tây, sau đó đặt Bếp hợp với Cửa và Chủ.",
            "cau_truc": {
                "truc": ["Cửa chính (Môn)", "Phòng chủ (Chủ)", "Bếp nấu (Táo)"],
                "thu_tu_xet": ["1. Định phương Cửa chính (lấy tâm cửa)", "2. Định phương Phòng chủ (gian cao rộng nhất)", "3. Tra Du Niên Cửa→Chủ (tốt/xấu)", "4. Phối Bếp (lò nấu) hợp Cửa trước, hợp Chủ sau"],
            },
            "mermaid": "flowchart LR\n  M[Cửa chính · Môn] -->|Khởi Du Niên| C[Phòng chủ · Chủ]\n  M -->|Phối Bát Táo · ưu tiên 1| T[Bếp nấu · Táo]\n  C -->|Tương sinh / tương khắc · ưu tiên 2| T",
        },
        {
            "ma": "ha_do_ngu_hanh",
            "ten": "Đồ hình Hà Đồ và số sinh thành Ngũ Hành",
            "ten_han": "河圖陰陽五行生成圖",
            "nhom": "co_so_dich_hoc",
            "han": "一六水二七火三八木四九金五十土",
            "mo_ta": "Hà Đồ đặt nền cho quan hệ số – phương – ngũ hành: 1–6 thuộc Thuỷ (Bắc), 2–7 thuộc Hoả (Nam), 3–8 thuộc Mộc (Đông), 4–9 thuộc Kim (Tây), 5–10 thuộc Thổ (Trung cung).",
            "cau_truc": {
                "cap_so": [
                    {"so": "1 - 6", "hanh": "Thuỷ", "phuong": "Bắc"},
                    {"so": "2 - 7", "hanh": "Hoả", "phuong": "Nam"},
                    {"so": "3 - 8", "hanh": "Mộc", "phuong": "Đông"},
                    {"so": "4 - 9", "hanh": "Kim", "phuong": "Tây"},
                    {"so": "5 - 10", "hanh": "Thổ", "phuong": "Trung Cung"},
                ]
            },
            "mermaid": "flowchart TB\n  N[Nam · 2-7 Hoả] --- C[Trung Cung · 5-10 Thổ]\n  D[Đông · 3-8 Mộc] --- C\n  C --- T[Tây · 4-9 Kim]\n  C --- B[Bắc · 1-6 Thuỷ]",
        },
        {
            "ma": "lac_thu_cuu_cung",
            "ten": "Đồ hình Lạc Thư Cửu Cung",
            "ten_han": "洛書九宮圖",
            "nhom": "co_so_dich_hoc",
            "han": "戴九履一左三右七二四爲肩六八爲足",
            "mo_ta": "Lạc Thư phân bố chín số quanh Trung Cung (số 5): đội 9 (Nam), đạp 1 (Bắc), trái 3 (Đông), phải 7 (Tây), vai 4–2 (Đông Nam – Tây Nam), chân 8–6 (Đông Bắc – Tây Bắc). Tổng mỗi hàng, cột, đường chéo đều bằng 15.",
            "cau_truc": {
                "ma_tran_3x3": [[4, 9, 2], [3, 5, 7], [8, 1, 6]],
                "tong_hang_cot_cheo": 15,
            },
            "mermaid": "flowchart TB\n  subgraph LacThu[Lạc Thư Cửu Cung · Tổng mỗi trục = 15]\n    R1[4 Tốn · 9 Ly · 2 Khôn]\n    R2[3 Chấn · 5 Trung · 7 Đoài]\n    R3[8 Cấn · 1 Khảm · 6 Càn]\n  end",
        },
        {
            "ma": "hau_thien_bat_quai",
            "ten": "Đồ hình Hậu Thiên Bát Quái và 8 phương vị",
            "ten_han": "後天八卦方位圖",
            "nhom": "co_so_dich_hoc",
            "han": "將羅盤旋於天井十字正中心定準二十四山向看主在某宮某字",
            "mo_ta": "Đặt la bàn tại giao điểm chữ thập giữa sân (hoặc tâm nhà) để định 8 cung Hậu Thiên Bát Quái: Khảm Bắc (Thuỷ), Ly Nam (Hoả), Chấn Đông (Mộc), Tốn Đông Nam (Mộc), Càn Tây Bắc (Kim), Đoài Tây (Kim), Cấn Đông Bắc (Thổ), Khôn Tây Nam (Thổ).",
            "cau_truc": {
                "tam_cung": [
                    {"quai": q, "phuong": pt.QUAI[q][1], "hanh": HANH_QUAI[q], "nhom": "Đông Tứ" if q in pt.DONG_TU else "Tây Tứ"}
                    for q in pt.QUAI
                ]
            },
            "mermaid": "flowchart TB\n  S[Ly · Nam · Hoả] --- M((Tâm nhà · La bàn))\n  SE[Tốn · Đông Nam · Mộc] --- M\n  SW[Khôn · Tây Nam · Thổ] --- M\n  E[Chấn · Đông · Mộc] --- M\n  W[Đoài · Tây · Kim] --- M\n  NE[Cấn · Đông Bắc · Thổ] --- M\n  N[Khảm · Bắc · Thuỷ] --- M\n  NW[Càn · Tây Bắc · Kim] --- M",
        },
        {
            "ma": "dong_tay_tu_trach",
            "ten": "Sơ đồ phân nhóm Đông Tứ Trạch và Tây Tứ Trạch",
            "ten_han": "東西四宅分組圖",
            "nhom": "bat_trach",
            "han": "乾坤艮兌四宅同東四卦交不可逢",
            "mo_ta": "Tám quẻ chia làm hai nhóm tương hợp: Đông Tứ (Khảm, Ly, Chấn, Tốn) và Tây Tứ (Càn, Khôn, Cấn, Đoài). Cửa và Chủ cùng một nhóm thì gặp 4 du niên tốt (Sinh Khí, Diên Niên, Thiên Y, Phục Vị); lẫn hai nhóm thì rơi vào 4 du niên xấu.",
            "cau_truc": {
                "dong_tu": ["Khảm", "Ly", "Chấn", "Tốn"],
                "tay_tu": ["Càn", "Khôn", "Cấn", "Đoài"],
                "quy_tac": "Cùng nhóm → Cát (Sinh Khí / Diên Niên / Thiên Y / Phục Vị); Khác nhóm → Hung (Tuyệt Mệnh / Ngũ Quỷ / Lục Sát / Hoạ Hại)",
            },
            "mermaid": "flowchart LR\n  subgraph DongTu[Đông Tứ Trạch]\n    K1[Khảm] & L1[Ly] & C1[Chấn] & T1[Tốn]\n  end\n  subgraph TayTu[Tây Tứ Trạch]\n    C2[Càn] & K2[Khôn] & G2[Cấn] & D2[Đoài]\n  end\n  DongTu -. Tránh lẫn nhóm .-> TayTu",
        },
        {
            "ma": "dai_du_nien_cuu_tinh",
            "ten": "Biểu đồ Cửu Tinh Đại Du Niên và Ngũ Hành sao",
            "ten_han": "大遊年九星吉凶五行圖",
            "nhom": "bat_trach",
            "han": "乾爲伏位即輔弼二木星也其星吉凶無定主吉彼亦吉主凶彼亦凶",
            "mo_ta": "Ánh xạ 8 Du Niên với Cửu Tinh và Ngũ Hành: Sinh Khí (Tham Lang – Mộc, Đại Cát), Diên Niên (Vũ Khúc – Kim, Cát), Thiên Y (Cự Môn – Thổ, Cát), Phục Vị (Phụ Bật – Mộc, Tiểu Cát tuỳ chủ), Hoạ Hại (Lộc Tồn – Thổ, Hung), Lục Sát (Văn Khúc – Thuỷ, Hung), Ngũ Quỷ (Liêm Trinh – Hoả, Hung), Tuyệt Mệnh (Phá Quân – Kim, Đại Hung).",
            "cau_truc": {
                "bon_cat": [
                    {"du_nien": "Sinh Khí", "sao": "Tham Lang", "hanh": "Mộc"},
                    {"du_nien": "Diên Niên", "sao": "Vũ Khúc", "hanh": "Kim"},
                    {"du_nien": "Thiên Y", "sao": "Cự Môn", "hanh": "Thổ"},
                    {"du_nien": "Phục Vị", "sao": "Phụ Bật", "hanh": "Mộc"},
                ],
                "bon_hung": [
                    {"du_nien": "Hoạ Hại", "sao": "Lộc Tồn", "hanh": "Thổ"},
                    {"du_nien": "Lục Sát", "sao": "Văn Khúc", "hanh": "Thuỷ"},
                    {"du_nien": "Ngũ Quỷ", "sao": "Liêm Trinh", "hanh": "Hoả"},
                    {"du_nien": "Tuyệt Mệnh", "sao": "Phá Quân", "hanh": "Kim"},
                ],
            },
            "mermaid": "flowchart LR\n  DN[Đại Du Niên] --> CAT[4 Cát Tinh]\n  DN --> HUNG[4 Hung Tinh]\n  CAT --> SK[Sinh Khí · Tham Lang · Mộc]\n  CAT --> DN2[Diên Niên · Vũ Khúc · Kim]\n  CAT --> TY[Thiên Y · Cự Môn · Thổ]\n  CAT --> PV[Phục Vị · Phụ Bật · Mộc]\n  HUNG --> HH[Hoạ Hại · Lộc Tồn · Thổ]\n  HUNG --> LS[Lục Sát · Văn Khúc · Thuỷ]\n  HUNG --> NQ[Ngũ Quỷ · Liêm Trinh · Hoả]\n  HUNG --> TM[Tuyệt Mệnh · Phá Quân · Kim]",
        },
        {
            "ma": "bon_loai_trach_lop_gian",
            "ten": "Sơ đồ 4 loại nhà theo lớp gian: Tĩnh – Động – Biến – Hoá Trạch",
            "ten_han": "靜動變化四宅層數圖",
            "nhom": "phan_loai_nha",
            "han": "陽宅有靜動變化四宅世人多不留心不能分清故致相混一院爲靜宅",
            "mo_ta": "Phân loại nhà theo số lớp gian có tường vách ngăn từ trước ra sau: 1 lớp là Tĩnh Trạch (khởi Du Niên trực tiếp từ Cửa), 2–5 lớp là Động Trạch (dùng Chính Ngũ Hành phiên tinh theo từng lớp), 6–10 lớp là Biến Trạch, 11–15 lớp là Hoá Trạch.",
            "cau_truc": {
                "cac_loai": [
                    {"loai": "Tĩnh Trạch", "so_lop": "1 lớp gian", "phep_tinh": "Từ Cửa chính khởi thẳng Đại Du Niên"},
                    {"loai": "Động Trạch", "so_lop": "2–5 lớp gian", "phep_tinh": "Xảo phiên Bát Quái theo Chính Ngũ Hành từng lớp"},
                    {"loai": "Biến Trạch", "so_lop": "6–10 lớp gian", "phep_tinh": "Biến tinh quá ngũ hành, chuyển cung theo tầng"},
                    {"loai": "Hoá Trạch", "so_lop": "11–15 lớp gian", "phep_tinh": "Nhà lớn nhiều lớp viện, luận hoá khí liên hoàn"},
                ]
            },
            "mermaid": "flowchart LR\n  A[1 lớp · Tĩnh Trạch] --> B[2-5 lớp · Động Trạch]\n  B --> C[6-10 lớp · Biến Trạch]\n  C --> D[11-15 lớp · Hoá Trạch]",
        },
        {
            "ma": "ngu_hanh_phien_tinh_dong_trach",
            "ten": "Sơ đồ vòng Chính Ngũ Hành phiên tinh của Động Trạch",
            "ten_han": "動宅正五行番星圖",
            "nhom": "phan_loai_nha",
            "han": "動宅至五層而止故番星只宜用正五行如巨門生武曲",
            "mo_ta": "Trong Động Trạch (2–5 lớp gian), sao truyền từ lớp trước sang lớp sau theo vòng tương sinh Chính Ngũ Hành: Cự Môn (Thổ) → Vũ Khúc (Kim) → Văn Khúc (Thuỷ) → Tham Lang (Mộc) → Liêm Trinh (Hoả) → Cự Môn (Thổ).",
            "cau_truc": {
                "vong_sinh": ["Cự Môn (Thổ)", "Vũ Khúc (Kim)", "Văn Khúc (Thuỷ)", "Tham Lang (Mộc)", "Liêm Trinh (Hoả)"]
            },
            "mermaid": "flowchart LR\n  CM[Cự Môn · Thổ] --> VK[Vũ Khúc · Kim]\n  VK --> VKH[Văn Khúc · Thuỷ]\n  VKH --> TL[Tham Lang · Mộc]\n  TL --> LT[Liêm Trinh · Hoả]\n  LT --> CM",
        },
        {
            "ma": "khai_mon_phong_thuy",
            "ten": "Sơ đồ Khai Môn – Phóng Thuỷ (Bốn chính hướng & bốn duy hướng)",
            "ten_han": "開門放水圖",
            "nhom": "ngoai_cuc",
            "han": "開門放水凡是子午卯酉四正向放水能歸正庫者固好",
            "mo_ta": "Nguyên tắc thoát nước (phóng thuỷ) cho đại trạch / công sở: bốn chính hướng Tý–Ngọ–Mão–Dậu ưu tiên quy chính khố (hoặc phương suy Ất–Tân–Đinh–Quý bên phải); bốn duy hướng Càn–Khôn–Cấn–Tốn dùng tá khố tiêu thuỷ bên trái để không xung phá dưỡng vị.",
            "cau_truc": {
                "bon_chinh_huong": ["Tý (Bắc)", "Ngọ (Nam)", "Mão (Đông)", "Dậu (Tây)"],
                "bon_duy_huong": ["Càn (Tây Bắc)", "Khôn (Tây Nam)", "Cấn (Đông Bắc)", "Tốn (Đông Nam)"],
            },
            "mermaid": "flowchart TB\n  KM[Khai Môn · Phóng Thuỷ] --> CH[Tứ Chính: Tý Ngọ Mão Dậu]\n  KM --> DH[Tứ Duy: Càn Khôn Cấn Tốn]\n  CH --> CH1[Ưu tiên Chính Khố / bên phải Ất Tân Đinh Quý]\n  DH --> DH1[Tá Khố tiêu thuỷ bên trái · tránh xung dưỡng vị]",
        },
        {
            "ma": "nha_ve_sinh_ap_hung",
            "ten": "Sơ đồ bố trí nhà vệ sinh trấn phương hung",
            "ten_han": "廁所安凶方圖",
            "nhom": "bo_tri",
            "han": "廁所宜安五鬼方諸事順利次安六煞方亦大吉",
            "mo_ta": "Nguyên tắc 'toạ hung hướng cát' cho khu vệ sinh: ưu tiên đặt tại phương Ngũ Quỷ, thứ đến Lục Sát, rồi Hoạ Hại / Tuyệt Mệnh để lấy uế trấn hung; tránh đặt khu vệ sinh vào bốn phương cát (Sinh Khí, Diên Niên, Thiên Y, Phục Vị).",
            "cau_truc": {
                "thu_tu_uu_tien_dat_wc": ["Ngũ Quỷ", "Lục Sát", "Hoạ Hại", "Tuyệt Mệnh"],
                "tranh_dat_wc": ["Sinh Khí", "Diên Niên", "Thiên Y", "Phục Vị"],
            },
            "mermaid": "flowchart LR\n  WC[Khu vệ sinh / Tạp phòng] -->|Nên đặt để trấn hung| H[Ngũ Quỷ → Lục Sát → Hoạ Hại → Tuyệt Mệnh]\n  WC -. Tránh đặt .-> C[Sinh Khí · Diên Niên · Thiên Y · Phục Vị]",
        },
    ]

    result = []
    for sp in specs:
        ref = verify_in_nguon(sp["han"], thien_list)
        result.append(
            {
                "ma": sp["ma"],
                "ten": sp["ten"],
                "ten_han": sp["ten_han"],
                "nhom": sp["nhom"],
                "han": sp["han"],
                "nguon_thien": ref["so"],
                "quyen": ref["quyen"],
                "trang_pdf": ref["trang_pdf"],
                "mo_ta": sp["mo_ta"],
                "cau_truc": sp["cau_truc"],
                "mermaid": sp["mermaid"],
            }
        )
    return result


def build_so_do_64(tam_yeu: dict, charts_rows: list[tuple]) -> tuple[dict, dict]:
    # Tạo map tìm chart_id theo tiêu đề/mô tả chứa cặp quẻ (gồm cả giản thể, phồn thể, tượng quẻ & biến thể OCR)
    han_quai_variants = {
        "Càn": ("乾", "天"),
        "Đoài": ("兑", "兌", "泽", "澤"),
        "Ly": ("离", "離", "火"),
        "Chấn": ("震", "雷"),
        "Tốn": ("巽", "风", "風"),
        "Khảm": ("坎", "水"),
        "Cấn": ("艮", "山", "良"),
        "Khôn": ("坤", "地"),
    }

    def find_chart_refs(kind: str, a: str, b: str) -> list[dict]:
        va, vb = han_quai_variants[a], han_quai_variants[b]
        pats = []
        for ha in va:
            for hb in vb:
                if kind == "nha":
                    pats.extend((f"{ha}门{hb}主", f"{ha}門{hb}主"))
                else:
                    pats.extend((f"{ha}灶配{hb}门", f"{ha}灶{hb}门", f"{ha}竈配{hb}門", f"{ha}竈{hb}門"))
        hits = []
        for cid, pdf_p, book_p, ctype, ctitle, cdesc, vol in charts_rows:
            blob = f"{ctitle or ''} {cdesc or ''}"
            if any(p in blob for p in pats):
                hits.append({"chart_id": cid, "trang_pdf": pdf_p, "trang_sach": book_p, "loai": ctype})
        return hits[:3]

    so_do_nha: dict[str, dict] = {}
    for k, m in tam_yeu["nha"].items():
        cua, chu = k.split("_")
        dn = pt.bang_huong(cua)[pt.QUAI[chu][1]]
        assert dn == m["du_nien"], (k, dn, m["du_nien"])
        cung_nhom = (cua in pt.DONG_TU) == (chu in pt.DONG_TU)
        so_do_nha[k] = {
            "ma": k,
            "cua": cua,
            "chu": chu,
            "huong_cua": pt.QUAI[cua][1],
            "huong_chu": pt.QUAI[chu][1],
            "du_nien": dn,
            "cung_nhom": cung_nhom,
            "quan_he_ngu_hanh": quan_he_hanh(cua, chu),
            "bep_hop": m.get("bep_hop", []),
            "bep_nen_tranh": m.get("bep_nen_tranh", []),
            "luoi_3x3": tao_luoi_3x3("Cửa", cua, "Chủ", chu),
            "mermaid": f"flowchart LR\n  M[Cửa: {cua} · {pt.QUAI[cua][1]}] -->|{dn}| C[Chủ: {chu} · {pt.QUAI[chu][1]}]",
            "tham_chieu_bieu_do": find_chart_refs("nha", cua, chu),
        }

    so_do_bep: dict[str, dict] = {}
    for k, m in tam_yeu["bep"].items():
        bep, cua = k.split("_")
        dn = pt.bang_huong(cua)[pt.QUAI[bep][1]]
        assert dn == m["du_nien"], (k, dn, m["du_nien"])
        so_do_bep[k] = {
            "ma": k,
            "bep": bep,
            "cua": cua,
            "huong_bep": pt.QUAI[bep][1],
            "huong_cua": pt.QUAI[cua][1],
            "du_nien": dn,
            "hanh_bep": HANH_QUAI[bep],
            "hanh_cua": HANH_QUAI[cua],
            "quan_he_ngu_hanh": quan_he_hanh(bep, cua),
            "luoi_3x3": tao_luoi_3x3("Cửa", cua, "Bếp", bep),
            "mermaid": f"flowchart LR\n  M[Cửa: {cua} · {pt.QUAI[cua][1]}] -->|{dn} · {quan_he_hanh(bep, cua)}| B[Bếp: {bep} · {pt.QUAI[bep][1]}]",
            "tham_chieu_bieu_do": find_chart_refs("bep", bep, cua),
        }
    return so_do_nha, so_do_bep


def build_muc_luc_bieu_do(charts_rows: list[tuple]) -> list[dict]:
    """Tạo mục lục mô tả tiếng Việt (không chép nguyên văn chữ Hán hiện đại / không ảnh bản quyền)
    cho toàn bộ 251 biểu đồ chính văn trong kho cục bộ fengshui-yangzhai-kb."""
    items = []
    for cid, pdf_p, book_p, ctype, ctitle, cdesc, vol in charts_rows:
        loai_vi = LOAI_BIEU_DO_VI.get(ctype, "Biểu đồ minh hoạ")
        quyen_vi = QUYEN_VI.get(vol or "", vol or "")
        items.append(
            {
                "chart_id": cid,
                "loai": ctype,
                "loai_vi": loai_vi,
                "quyen": vol or "",
                "quyen_vi": quyen_vi,
                "trang_pdf": pdf_p,
                "trang_sach": book_p,
                "mo_ta_vi": f"{loai_vi} thuộc {quyen_vi} (trang sách {book_p or pdf_p}; ảnh gốc lưu cục bộ trong kho riêng fengshui-yangzhai-kb).",
            }
        )
    return items


def main() -> None:
    nguon = json.loads(NGUON_PATH.read_text("utf-8"))
    thien_list = nguon["thien"]
    tam_yeu = json.loads(TAM_YEU_PATH.read_text("utf-8"))

    conn = sqlite3.connect(str(DEFAULT_DB))
    charts_rows = conn.execute(
        """
        SELECT c.chart_id, c.pdf_page, c.book_page, c.chart_type, c.chart_title, c.chart_description, s.volume
        FROM yangzhai_charts c
        LEFT JOIN yangzhai_sections s ON s.section_id = c.section_id
        WHERE c.pdf_page > 28
        ORDER BY c.pdf_page, c.chart_id
        """
    ).fetchall()
    conn.close()

    do_hinh_ly_thuyet = build_do_hinh_ly_thuyet(thien_list)
    so_do_64_nha, so_do_64_bep = build_so_do_64(tam_yeu, charts_rows)
    muc_luc = build_muc_luc_bieu_do(charts_rows)

    do_hinh_payload = {
        "_nguon": (
            "Hệ thống đồ hình, sơ đồ mặt bằng 64 thế nhà – 64 thế bếp và mục lục 251 biểu đồ mô tả của "
            "《陽宅三要》 (Dương Trạch Tam Yếu — Triệu Cửu Phong, đời Thanh). "
            "Mọi câu nguyên văn `han` trong `do_hinh_ly_thuyet` khớp từng chữ với `fixtures/nguon/duong_trach_tam_yeu.json`; "
            "toàn bộ 64 sơ đồ nhà và 64 sơ đồ bếp khớp phép tính `app.calc.phongthuy.bang_huong`. "
            "Không đưa ảnh quét có bản quyền vào repo công khai (ảnh lưu riêng trong kho cục bộ `fengshui-yangzhai-kb`)."
        ),
        "source_id": "duong_trach_tam_yeu",
        "school_id": "bat_trach",
        "trang_thai": "nhap_ban_bien_tap",
        "can_doi_chieu": True,
        "thong_ke": {
            "so_do_hinh_ly_thuyet": len(do_hinh_ly_thuyet),
            "so_do_nha": len(so_do_64_nha),
            "so_do_bep": len(so_do_64_bep),
            "tong_muc_luc_bieu_do": len(muc_luc),
        },
        "do_hinh_ly_thuyet": do_hinh_ly_thuyet,
        "so_do_64_nha": so_do_64_nha,
        "so_do_64_bep": so_do_64_bep,
        "muc_luc_bieu_do": muc_luc,
    }
    DO_HINH_OUT.write_text(json.dumps(do_hinh_payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # Gắn khối `nguyen_van_doi_chieu` vào phongthuy_tam_yeu.json (giữ nguyên nha/bep tom_y để không vỡ test cũ)
    tam_yeu["nguyen_van_doi_chieu"] = [
        {
            "ma": d["ma"],
            "ten": d["ten"],
            "han": d["han"],
            "nguon_thien": d["nguon_thien"],
            "quyen": d["quyen"],
            "trang_pdf": d["trang_pdf"],
            "tom_y_vi": d["mo_ta"],
        }
        for d in do_hinh_ly_thuyet
    ]
    TAM_YEU_PATH.write_text(json.dumps(tam_yeu, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    nha_linked = sum(1 for v in so_do_64_nha.values() if v["tham_chieu_bieu_do"])
    bep_linked = sum(1 for v in so_do_64_bep.values() if v["tham_chieu_bieu_do"])
    print(f"Wrote {DO_HINH_OUT}")
    print(f"  do_hinh_ly_thuyet={len(do_hinh_ly_thuyet)}, so_do_64_nha={len(so_do_64_nha)} (chart-linked={nha_linked}), so_do_64_bep={len(so_do_64_bep)} (chart-linked={bep_linked}), muc_luc_bieu_do={len(muc_luc)}")
    print(f"Updated {TAM_YEU_PATH} with nguyen_van_doi_chieu ({len(tam_yeu['nguyen_van_doi_chieu'])} mục)")


if __name__ == "__main__":
    main()
