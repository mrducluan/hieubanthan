# -*- coding: utf-8 -*-
"""D2 (Chặng 0) — Đồng bộ 27 nhãn câu hỏi thẳng (`luan_hoi` của LH-1 / LH-2) vào Hỏi đáp Tử vi & Bát tự.

Nguyên tắc Một Nguồn Sự Thật:
  - Không tính lại, không viết luật chấm mới: đọc trực tiếp mục `luan_hoi.tra_loi` đã dựng sẵn trong báo cáo đời sống
    (`tuvi_doi_song.lap` / `battu_doi_song.lap`), giữ nguyên 100% `nhan`, `tra_loi`, `giai_thich`, `sac`, `ma_mau`, `can_cu`.
  - Hàng rào an toàn: chỉ bật ở bản tiếng Việt, câu trả lời thường của chính người xem (`not nguoi_than`, `not can_them`),
    đã biết giờ sinh thật (`not sinh.get("gio_tam")` — không phán nhãn mạnh trên giờ tạm 12:00), không phải câu hỏi ghép
    tuổi với người thứ hai cụ thể, và người xem đủ tuổi người lớn (`bc` đã tự kiểm `TUOI_NGUOI_LON`).
  - Khi câu hỏi về mảng đời sống khác (vd Sức khoẻ, Nhà cửa) không thuộc 27 câu `luan_hoi`, trả `doi_song_lien_ket` chứa
    `ma_mau` hộp chính + `chuong` để khung chat hiện nút Kiểm chứng (nuôi bảng `kiem_chung_phieu` 0017) và dẫn lên chương.
"""
from __future__ import annotations

import re
from typing import Callable

from app import ngon_ngu
from app.hoidap import chung
from app.kb import tuvi_luan_hoi_kb as kb_lh

CHUONG_5 = ("tinh_cam", "gia_dinh", "su_nghiep", "tien_bac", "quan_he")
PHAI_MON = {"tuvi": "nam_phai_viet", "battu": "tu_binh"}

_CHI_RX = r"(ty|suu|dan|mao|thin|ngo|mui|than|dau|tuat|hoi)"
_HAI_NGUOI_CU_THE = re.compile(
    rf"(\bvoi tuoi {_CHI_RX}\b|\btuoi {_CHI_RX} .{0,25}tuoi {_CHI_RX}\b|\bsinh nam (19|20)\d\d\b)"
)

# Thứ tự ưu tiên từ cụ thể đến tổng quát cho 27 câu hỏi đời thường (so trên chuỗi không dấu `chuan_hoa_cau`).
_MAU_27: list[tuple[str, str, list[str]]] = [
    # --- Tình cảm (5) ---
    ("tinh_cam", "nguoi_thu_ba", [
        r"nguoi thu ba", r"ke thu ba", r"ngoai tinh", r"phan boi", r"lang nhang", r"ong buom", r"tinh dich",
    ]),
    ("tinh_cam", "ben", [
        r"(mot|hai|may) doi (vo|chong)", r"hai lan do", r"dang do", r"ly di",
        r"(hon nhan|vo chong|duyen) .{0,20}(co ben|ben vung|ben lau|dut ganh|do vo)",
        r"ben vung hay .{0,20}(dang do|hai lan do|do vo)",
    ]),
    ("tinh_cam", "som_muon", [
        r"(cuoi|ket hon|lap gia dinh) som hay muon", r"nen cuoi som hay muon",
        r"tinh duyen .{0,20}lan dan", r"duong tinh .{0,20}lan dan", r"muon (chong|vo)",
        r"(bao gio|khi nao) .{0,20}(lay chong|lay vo|ket hon|co nguoi yeu|lap gia dinh)",
        r"(?<!\w)e (mai|qua|dai)(?!\w)",
    ]),
    ("tinh_cam", "nguoi_ay", [
        r"(nguoi ban doi|chong tuong lai|vo tuong lai|ban doi|nua kia) .{0,25}(la nguoi|the nao|ra sao|tinh cach|kieu nguoi)",
        r"lay (nguoi|chong|vo) nhu the nao",
    ]),
    ("tinh_cam", "hanh_phuc", [
        r"hon nhan .{0,25}(co hanh phuc|hanh phuc khong|em am khong)",
        r"doi song hon nhan .{0,20}(co hanh phuc|the nao)",
    ]),
    # --- Gia đình (4) ---
    ("gia_dinh", "tac_dong_nha", [
        r"tac dong .{0,25}(nguoi trong nha|gia dinh|vo con|bo me)",
    ]),
    ("gia_dinh", "cha_me", [
        r"(voi |cung )?(cha me|bo me) .{0,25}(duyen gan|co hop|the nao|ra sao|can luu y)",
    ]),
    ("gia_dinh", "anh_em", [
        r"anh (chi )?em .{0,25}(nho cay|hoa thuan|the nao|ra sao|co hop)",
    ]),
    ("gia_dinh", "con_cai", [
        r"duong con cai .{0,20}(the nao|ra sao)",
        r"con cai cua (toi|minh|em) (the nao|ra sao)",
    ]),
    # --- Sự nghiệp (8) ---
    ("su_nghiep", "chu_hay_cong", [
        r"lam chu hay lam (cong|thue)", r"(lam thue|di lam|lam cong) .{0,20}hay .{0,20}(mo rieng|ra rieng|lam chu|khoi nghiep)",
        r"(mo rieng|ra rieng|lam chu) hay (lam thue|lam cong|di lam)",
    ]),
    ("su_nghiep", "trai_nghe", [
        r"trai nghe", r"trai nganh", r"lam khac nganh",
    ]),
    ("su_nghiep", "nghe_hop", [
        r"hop (lam )?nghe gi", r"lam nghe gi (hop|tot|phat)", r"nghe nao hop", r"nganh nao hop",
        r"chon nghe gi", r"cong viec nao hop",
    ]),
    ("su_nghiep", "hoc_hanh", [
        r"duong hoc hanh", r"hoc hanh.{0,15}bang cap", r"bang cap cua (toi|minh|em)",
    ]),
    ("su_nghiep", "sep", [
        r"sep cua (toi|minh|em)", r"hop kieu sep nao", r"(voi |gap )?(cap tren|be tren|sep) .{0,20}(the nao|ra sao)",
    ]),
    ("su_nghiep", "dong_nghiep", [
        r"dong nghiep.{0,20}(cap duoi|voi toi|voi minh|voi em|ra sao|the nao)",
        r"cap duoi voi (toi|minh|em)",
    ]),
    ("su_nghiep", "di_xa", [
        r"(nen |hop )?(di lam xa|lam an xa|lap nghiep xa|doi moi truong)",
    ]),
    ("su_nghiep", "trac_tro", [
        r"(cong viec|su nghiep|duong quan loc) .{0,25}(co gap )?(trac tro|chong chenh|lan dan)",
    ]),
    # --- Tiền bạc (6) ---
    ("tien_bac", "kinh_doanh", [
        r"kinh doanh hay (lam luong|an luong|lam cong|di lam)",
        r"(lam luong|an luong) hay (kinh doanh|buon ban)",
    ]),
    ("tien_bac", "kiem_bang_gi", [
        r"kiem tien bang (cach|nghe|huong|con duong|gi)", r"lam gi (de )?ra tien",
    ]),
    ("tien_bac", "giu_tien", [
        r"giu (duoc )?tien", r"hay (tieu het|hao tai|hut tien|khong giu duoc tien)",
        r"lam bao nhieu tieu het",
    ]),
    ("tien_bac", "cong_danh", [
        r"cong danh.{0,15}chuc (vi|vu)", r"chuc (vi|vu) cua (toi|minh|em)",
    ]),
    ("tien_bac", "giai_doan_kha", [
        r"(giai doan|dai van|dai han|tuoi) nao .{0,25}(tien bac|tai chinh|tai loc|kinh te) .{0,20}(kha|tot|vuong|giau)",
    ]),
    ("tien_bac", "trac_tro", [
        r"(tien bac|tai chinh|tai loc) .{0,25}(co gap )?trac tro",
    ]),
    # --- Quan hệ (4) ---
    ("quan_he", "lam_an_chung", [
        r"(lam an|hun von|gop von|hop tac|mo) chung", r"hop tac lam an voi (ban|nguoi khac)",
    ]),
    ("quan_he", "thi_phi", [
        r"(gap |dinh |hay bi )?(thi phi|ke choi xau|choi xau|dam sau lung)",
    ]),
    ("quan_he", "quy_nhan", [
        r"co (nguoi giup do|quy nhan)", r"quy nhan .{0,20}(khong|o dau|the nao)",
    ]),
    ("quan_he", "ban_be", [
        r"ban be .{0,25}(co tin duoc|tot khong|chan thanh)",
    ]),
]


def _chuan_so_khop(s: str) -> str:
    return re.sub(r"\s+", " ", chung.chuan_hoa_cau(s or "")).strip(" ?!.,;:")


def _bang_cau_chuan() -> dict[str, tuple[str, str]]:
    ra: dict[str, tuple[str, str]] = {}
    for ch in CHUONG_5:
        for muc in kb_lh.cau(ch):
            if muc.get("cau") and muc.get("ma"):
                ra[_chuan_so_khop(muc["cau"])] = (ch, muc["ma"])
    return ra


def nhan_dien_cau_luan_hoi(cau_chuan_hoa: str, cau_goc: str = "") -> tuple[str, str] | None:
    """Trả `(chuong, ma)` trong 27 câu `luan_hoi` nếu câu hỏi khớp; ngược lại `None`."""
    goc_norm = _chuan_so_khop(cau_goc or cau_chuan_hoa)
    if _HAI_NGUOI_CU_THE.search(goc_norm):
        return None
    bang = _bang_cau_chuan()
    if goc_norm in bang:
        return bang[goc_norm]
    t = _chuan_so_khop(cau_chuan_hoa) or goc_norm
    if t in bang:
        return bang[t]
    for ch, ma, ds_mau in _MAU_27:
        if chung.co(t, ds_mau):
            return (ch, ma)
    return None


def gan_vao_hoi(
    kq: dict,
    *,
    mo_dun: str,
    pl: dict,
    cau_hoi: str,
    sinh: dict | None,
    bc_ds: dict | None,
    dung_bc: Callable[[], dict | None],
    nguoi_than: bool = False,
) -> None:
    """Gắn `luan_hoi` (khi khớp 1 trong 27 câu) hoặc `doi_song_lien_ket` (khi có hộp chương đời sống) vào `kq` tại chỗ."""
    if not ngon_ngu.la_viet() or not sinh or nguoi_than or sinh.get("gio_tam"):
        return
    if pl.get("xu_ly") in chung.DAC_BIET or kq.get("can_them"):
        return

    phai = PHAI_MON.get(mo_dun, "nam_phai_viet")
    khop = nhan_dien_cau_luan_hoi(pl.get("cau_chuan_hoa") or "", cau_hoi)
    if khop is not None:
        ch_ma, cau_ma = khop
        bc = bc_ds or dung_bc()
        c = next((x for x in (bc or {}).get("chuong", []) if x.get("ma") == ch_ma), None)
        tl = next((t for t in ((c or {}).get("luan_hoi") or {}).get("tra_loi", []) if t.get("ma") == cau_ma), None)
        if c and tl and tl.get("tra_loi") and tl.get("ma_mau"):
            ghi_chu = kb_lh.chuoi("ghi_chu_thang") if tl.get("nhan") in ("muon_moi_ben", "hai_lan_do") else ""
            kq["luan_hoi"] = {
                "ma": tl["ma"],
                "cau": tl["cau"],
                "tra_loi": tl["tra_loi"],
                "giai_thich": tl.get("giai_thich") or "",
                "nhan": tl["nhan"],
                "sac": tl.get("sac") or "can_bang",
                "ma_mau": tl["ma_mau"],
                "phai": phai,
                "chuong": ch_ma,
                "ten_chuong": c.get("tieu_de") or ch_ma,
                **({"ghi_chu": ghi_chu} if ghi_chu else {}),
            }
            cu_them = [x for x in tl.get("can_cu") or [] if x]
            if cu_them:
                cu_cu = list(kq.get("can_cu") or [])
                kq["can_cu"] = list(dict.fromkeys([*cu_them, *cu_cu]))
            return

    # Câu mảng đời sống chung (không nằm trong 27 câu luan_hoi): vẫn gắn ma_mau hộp đầu + chương để Web hiện KiemChung & nhảy chương.
    goi = kq.get("bang_chung") or {}
    m_ds = next((m for m in goi.get("muc", []) if m.get("loai") == "doi_song"), None)
    if not m_ds or not m_ds.get("chuong"):
        return
    hop0 = next((h for h in (m_ds.get("hop") or []) if h.get("ma_mau")), None)
    if not hop0:
        return
    bc = bc_ds
    c = next((x for x in (bc or {}).get("chuong", []) if x.get("ma") == m_ds["chuong"]), None)
    la_sk = m_ds["chuong"] == "suc_khoe"
    kq["doi_song_lien_ket"] = {
        "chuong": m_ds["chuong"],
        "ten_chuong": (c or {}).get("tieu_de") or m_ds.get("ten_mang") or m_ds["chuong"],
        "tieu_de_hop": hop0.get("tieu_de") or "",
        **({} if la_sk else {"muc": m_ds.get("muc"), "nhan_muc": m_ds.get("nhan_muc") or ""}),
        "ma_mau": hop0["ma_mau"],
        "phai": phai,
    }
