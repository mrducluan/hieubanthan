# -*- coding: utf-8 -*-
"""Chặng 1 (Lát cắt 1.2) — RULES tất định cho 4 Mạch Gỡ Nút Đời Sống (`go_nut_doi_song`).

Giải đáp thấu đáo, hai mặt và có việc làm thực tế cho 4 nhóm trăn trở hay bị các trang truyền thống trả lời chung chung
hoặc dọa dẫm:
  1. `sau_do_vo`: Phục hồi & mở lòng sau ly hôn / chia tay
  2. `khac_khau_vo_chong`: Hoà giải vợ chồng khắc khẩu, lục đục
  3. `gop_von_phan_vai`: Hợp tác góp vốn & nguyên tắc phân vai đối tác
  4. `go_loi_phan_doa`: Giải oan hai mặt các cách cục hay bị thầy khác phán dọa (Vô Chính Diệu, Không Kiếp, Thất Sát, Thương Quan…)
Hoạt động song ngữ VI ↔ EN qua `go_nut_doi_song_kb.json` + `en/go_nut_doi_song_kb.json`.
"""
from __future__ import annotations

import re

from app.hoidap import chung
from app.kb import nap

_TEP = "go_nut_doi_song_kb.json"

_MAU_4: list[tuple[str, list[str]]] = [
    ("go_loi_phan_doa", [
        r"vo chinh dieu", r"khong kiep", r"dia khong", r"dia kiep", r"that sat", r"thuong quan",
        r"sat phu", r"sat the", r"thay (khac )?(bao|noi|phan|doa) .{0,35}(xau|nang|kho|sat|vo chinh dieu|khong kiep|that sat|thuong quan)",
        r"\b(empty palace|seven killings|hurting officer)\b",
    ]),
    ("sau_do_vo", [
        r"sau (khi )?(ly hon|ly di|chia tay|do vo|dut ganh)", r"(da |tung |vua )(ly hon|ly di|do vo|qua mot lan do)",
        r"(tai hon|buoc nua|mo long lai|bat dau lai chuyen tinh)",
        r"\b(after (my |a )?(divorce|breakup)|remarry|open up again)\b",
    ]),
    ("khac_khau_vo_chong", [
        r"(vo chong|hai dua|nha toi|gia dao) .{0,25}(khac khau|hay cai|cai nhau|luc duc|lanh nhat|bat hoa|cang thang)",
        r"(khac khau|luc duc) .{0,20}(vo chong|gia dinh)",
        r"\b(husband|wife|spouse|partner|marriage).{0,25}(argue|clash|fight|friction)\b",
    ]),
    ("gop_von_phan_vai", [
        r"(hun von|gop von|chung von|lam an chung|mo chung|co[ -]?founder|chia co phan)",
        r"\b(pool capital|co[ -]?founder|business partner|joint venture)\b",
    ]),
]

_RIENG_DOA: list[tuple[str, list[str]]] = [
    ("vo_chinh_dieu", [r"vo chinh dieu", r"empty palace"]),
    ("khong_kiep", [r"khong kiep", r"dia khong", r"dia kiep"]),
    ("that_sat", [r"that sat", r"seven killings"]),
    ("thuong_quan", [r"thuong quan", r"hurting officer"]),
]


def _kb() -> dict:
    return nap.doc(_TEP)


def nhan_dien(cau_chuan_hoa: str, cau_goc: str = "") -> tuple[str, str | None] | None:
    """Trả `(ma_mach, ma_rieng)` nếu câu hỏi chạm đúng 1 trong 4 mạch gỡ nút đời sống."""
    gop = f"{chung.chuan_hoa_cau(cau_goc or '')} {cau_chuan_hoa or ''}".strip()
    gop = re.sub(r"\s+", " ", gop)
    for ma, ds in _MAU_4:
        if chung.co(gop, ds):
            rieng = None
            if ma == "go_loi_phan_doa":
                rieng = next((rk for rk, rm in _RIENG_DOA if chung.co(gop, rm)), None)
            return (ma, rieng)
    return None


def gan_vao_hoi(kq: dict, *, pl: dict, cau_hoi: str) -> None:
    """Gắn trường `go_nut_doi_song` khi câu trả lời thường chạm đúng 1 trong 4 mạch (tuyệt đối không gắn ở câu khủng hoảng/từ chối hoặc thiếu lá số chính mình)."""
    if pl.get("xu_ly") in chung.DAC_BIET:
        return
    ct = kq.get("can_them") or []
    if any(x != "la_so_nguoi_kia" for x in ct):
        return
    khop = nhan_dien(pl.get("cau_chuan_hoa") or "", cau_hoi)
    if not khop:
        return
    ma, rieng = khop
    m = (_kb().get("mach") or {}).get(ma)
    if not m:
        return
    goc_nhin = m["goc_nhin_hai_mat"]
    if rieng and isinstance(m.get("rieng"), dict) and m["rieng"].get(rieng):
        goc_nhin = f"{m['rieng'][rieng]} {goc_nhin}"
    kq["go_nut_doi_song"] = {
        "ma": ma,
        "tieu_de": m["tieu_de"],
        "goc_nhin_hai_mat": goc_nhin,
        "viec_thuc_te": list(m["viec_thuc_te"]),
    }
