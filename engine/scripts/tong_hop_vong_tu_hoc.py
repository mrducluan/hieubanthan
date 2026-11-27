#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Chặng 4.3 — Tổng hợp Vòng tuần hoàn Tự Tiến Hoá `DB → KB` hàng tuần cho toàn bộ 11 mảng (`scripts/tong_hop_vong_tu_hoc.py`).

Đọc bản xuất ẩn danh từ các bảng tự học Supabase (`0017` `kiem_chung_phieu`, `0022` `kiem_chung_sau` & `de_xuat_luat`,
`0031` `nhat_ky_hoi`, `0034` `lech_ngon_ngu`) và gom thành danh sách ứng viên nâng cấp KB tất định để Chủ dự án duyệt:
  1. Hộp luận giải thực chứng cao (`ty_le_dung >= 0.75` và `tong_phieu >= 30`).
  2. Hộp cần biên tập lại (`ty_le_dung < 0.40` và `tong_phieu >= 30`) — chỉ đích danh tệp KB nguồn.
  3. Gợi ý hành động ít chuyển biến sau 30 ngày (`ty_le_nhu_cu >= 0.60` và `tong_phieu_sau >= 15`).
  4. Độ vênh bản phủ song ngữ VI ↔ EN (`abs(ty_le_vi - ty_le_en) >= 0.20` với mỗi bên ≥ 15 phiếu).
  5. Cụm câu hỏi người dùng hay hỏi nhưng chưa phủ sâu (`diem_khop < 0.55`, lặp lại ≥ 5 lượt).
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ANH_XA_MO_DUN_KB: dict[str, str] = {
    "tuvi": "tuvi_doi_song_kb.json",
    "battu": "battu_doi_song_kb.json",
    "phongthuy": "phongthuy_doi_song.json",
    "kinhdich": "kinhdich_tra_loi.json",
    "kymon": "ky_mon_kb.json",
    "nhantuong": "nhan_tuong_kb.json",
    "chitay": "chi_tay_kb.json",
    "thanso": "thanso_chan_dung.json",
    "tarot": "tarot_kb.json",
    "tam_tai": "co_van_tam_tai_kb.json",
    "chiem_tinh": "chiem_tinh_hanh_tinh_cung_kb.json",
}


def tong_hop_ung_vien(du_lieu: dict) -> dict:
    """Phân loại tất định dữ liệu phiếu ẩn danh hàng tuần thành 5 nhóm hành động nâng cấp KB."""
    thuc_chung_cao: list[dict] = []
    can_viet_lai: list[dict] = []
    can_doi_hanh_dong_30_ngay: list[dict] = []
    lech_song_ngu: list[dict] = []
    cum_to_mo_moi: list[dict] = []

    for p in du_lieu.get("kiem_chung_phieu", []):
        tong = int(p.get("so_dung", 0)) + int(p.get("so_chua_dung", 0))
        if tong < 30:
            continue
        ty_le = int(p.get("so_dung", 0)) / tong
        mo_dun = str(p.get("mo_dun", "chung"))
        item = {
            "mo_dun": mo_dun,
            "ma_mau": p.get("ma_mau", ""),
            "tong_phieu": tong,
            "ty_le_dung": round(ty_le, 3),
            "tep_kb_goi_y": ANH_XA_MO_DUN_KB.get(mo_dun, "go_nut_doi_song_kb.json"),
        }
        if ty_le >= 0.75:
            thuc_chung_cao.append(item)
        elif ty_le < 0.40:
            can_viet_lai.append(item)

    for s in du_lieu.get("kiem_chung_sau", []):
        do_di = int(s.get("so_do_hon", 0))
        nhu_cu = int(s.get("so_nhu_cu", 0))
        tong_sau = do_di + nhu_cu + int(s.get("so_nang_hon", 0))
        if tong_sau < 15:
            continue
        ty_le_nhu_cu = nhu_cu / tong_sau
        if ty_le_nhu_cu >= 0.60:
            mo_dun = str(s.get("mo_dun", "chung"))
            can_doi_hanh_dong_30_ngay.append({
                "mo_dun": mo_dun,
                "ma_mau": s.get("ma_mau", ""),
                "tong_phieu_sau": tong_sau,
                "ty_le_nhu_cu": round(ty_le_nhu_cu, 3),
                "tep_kb_goi_y": ANH_XA_MO_DUN_KB.get(mo_dun, "go_nut_doi_song_kb.json"),
            })

    for lg in du_lieu.get("lech_ngon_ngu", []):
        n_vi = int(lg.get("tong_vi", 0))
        n_en = int(lg.get("tong_en", 0))
        if n_vi < 15 or n_en < 15:
            continue
        tl_vi = float(lg.get("ty_le_dung_vi", 0.0))
        tl_en = float(lg.get("ty_le_dung_en", 0.0))
        do_lech = abs(tl_vi - tl_en)
        if do_lech >= 0.20:
            mo_dun = str(lg.get("mo_dun", "chung"))
            tep_goc = ANH_XA_MO_DUN_KB.get(mo_dun, "go_nut_doi_song_kb.json")
            lech_song_ngu.append({
                "mo_dun": mo_dun,
                "ma_mau": lg.get("ma_mau", ""),
                "ty_le_vi": round(tl_vi, 3),
                "ty_le_en": round(tl_en, 3),
                "do_lech": round(do_lech, 3),
                "tep_en_can_ra": f"en/{tep_goc}",
            })

    for q in du_lieu.get("cum_cau_hoi_chua_phu", []):
        so_luot = int(q.get("so_luot", 0))
        diem_khop = float(q.get("diem_khop_tb", 1.0))
        if so_luot >= 5 and diem_khop < 0.55:
            mo_dun = str(q.get("mo_dun", "chung"))
            cum_to_mo_moi.append({
                "mo_dun": mo_dun,
                "chu_de": q.get("chu_de", ""),
                "so_luot": so_luot,
                "diem_khop_tb": round(diem_khop, 3),
                "tep_kb_goi_y": ANH_XA_MO_DUN_KB.get(mo_dun, "go_nut_doi_song_kb.json"),
            })

    can_viet_lai.sort(key=lambda x: x["ty_le_dung"])
    thuc_chung_cao.sort(key=lambda x: -x["ty_le_dung"])
    cum_to_mo_moi.sort(key=lambda x: -x["so_luot"])

    return {
        "so_mang_ho_tro": len(ANH_XA_MO_DUN_KB),
        "can_viet_lai": can_viet_lai,
        "can_doi_hanh_dong_30_ngay": can_doi_hanh_dong_30_ngay,
        "lech_song_ngu": lech_song_ngu,
        "cum_to_mo_moi": cum_to_mo_moi,
        "thuc_chung_cao": thuc_chung_cao,
    }


def xuat_markdown(ket_qua: dict) -> str:
    dong = [
        "# Báo cáo Vòng Tự Tiến Hoá Hàng Tuần (DB → KB)",
        "",
        f"- Tổng số mảng giám sát: **{ket_qua['so_mang_ho_tro']}**",
        f"- Mục cần viết lại (`< 40%` đồng thuận, `≥ 30` phiếu): **{len(ket_qua['can_viet_lai'])}**",
        f"- Mục cần chỉnh hành động sau 30 ngày (`≥ 60%` chưa đổi): **{len(ket_qua['can_doi_hanh_dong_30_ngay'])}**",
        f"- Mục lệch bản dịch Anh – Việt (`≥ 20%`): **{len(ket_qua['lech_song_ngu'])}**",
        f"- Cụm câu hỏi mới chưa phủ sâu: **{len(ket_qua['cum_to_mo_moi'])}**",
        f"- Mục đạt ngưỡng thực chứng cao (`≥ 75%`): **{len(ket_qua['thuc_chung_cao'])}**",
        "",
    ]
    if ket_qua["can_viet_lai"]:
        dong.append("## 1. Ưu tiên biên tập lại trong tuần")
        for x in ket_qua["can_viet_lai"]:
            dong.append(f"- `{x['ma_mau']}` ({x['mo_dun']} → `{x['tep_kb_goi_y']}`): đồng thuận {x['ty_le_dung']*100:.1f}% trên {x['tong_phieu']} phiếu.")
        dong.append("")
    return "\n".join(dong)


def main() -> None:
    ap = argparse.ArgumentParser(description="Tổng hợp ứng viên nâng cấp KB hàng tuần từ dữ liệu kiểm chứng DB.")
    ap.add_argument("--input-json", required=True, type=Path)
    ap.add_argument("--out-json", type=Path)
    ap.add_argument("--out-md", type=Path)
    args = ap.parse_args()

    du_lieu = json.loads(args.input_json.read_text(encoding="utf-8"))
    kq = tong_hop_ung_vien(du_lieu)
    if args.out_json:
        args.out_json.write_text(json.dumps(kq, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.out_md:
        args.out_md.write_text(xuat_markdown(kq), encoding="utf-8")


if __name__ == "__main__":
    main()
