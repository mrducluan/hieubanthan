#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Chặng 4.3 & Chặng 5 — Tổng hợp Vòng tuần hoàn Tự Tiến Hoá `DB → KB` hàng tuần cho toàn bộ 11 mảng
(`engine/scripts/tong_hop_vong_tu_hoc.py`).

Hỗ trợ 2 chế độ đầu vào hoàn toàn tất định & KHÔNG CHỨA PII (không `user_id`, không `khoa`, không câu chữ tự do của người dùng):
  1. `--input-json <path>`: đọc tệp JSON xuất ẩn danh (tương thích ngược Chặng 4.3).
  2. `--tu-supabase`: đọc trực tiếp qua PostgREST / RPC bằng `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`:
     - RPC `ty_le_kiem_chung_ngon_ngu(p_toi_thieu=15)` (`0017` + `0034`: chỉ mã hộp, ngôn ngữ, số đúng/chưa đúng).
     - RPC `ty_le_kiem_chung_sau(p_toi_thieu=15)` (`0022`: chỉ mã hộp, số phiếu sau 30 ngày, tốt hơn / như cũ).
     - Bảng `nhat_ky_hoi` chỉ chọn các cột mã phân loại (`mo_dun,chu_de,y_dinh,do_phu,huu_ich` — TUYỆT ĐỐI KHÔNG đọc cột `cau_hoi`).
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import datetime as dt
import json
import os
from pathlib import Path
from typing import Any

import httpx

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

# Cột được phép đọc từ nhat_ky_hoi: chỉ mã phân loại tất định, cấm tuyệt đối cột văn bản tự do `cau_hoi` hay định danh.
COT_NHAT_KY_AN_TOAN = "mo_dun,chu_de,y_dinh,do_phu,huu_ich"


def suy_mo_dun_tu_ma(mau: str, loai: str = "") -> str:
    """Suy ra mô-đun từ mã hộp kiểm chứng tất định (`mau.*` / `ds.<mang>.*` / `nhip_3_thang`)."""
    m = (mau or "").strip().lower()
    if loai in ("phi_hoa", "nhip_3_thang") or m.startswith(("mau.", "ky_xung.", "loc_nhap.", "tu_hoa.")):
        return "tuvi"
    if m.startswith("ds."):
        phan = m.split(".")
        if len(phan) >= 2:
            tien_to = phan[1]
            ban_do = {
                "tuvi": "tuvi",
                "tu_vi": "tuvi",
                "battu": "battu",
                "bat_tu": "battu",
                "phongthuy": "phongthuy",
                "phong_thuy": "phongthuy",
                "kinhdich": "kinhdich",
                "kinh_dich": "kinhdich",
                "kymon": "kymon",
                "ky_mon": "kymon",
                "nhantuong": "nhantuong",
                "nhan_tuong": "nhantuong",
                "chitay": "chitay",
                "chi_tay": "chitay",
                "thanso": "thanso",
                "than_so": "thanso",
                "tarot": "tarot",
                "tam_tai": "tam_tai",
                "giao_thoa": "tam_tai",
                "chiem_tinh": "chiem_tinh",
            }
            if tien_to in ban_do:
                return ban_do[tien_to]
    return "tuvi"


def tai_du_lieu_supabase(
    supabase_url: str,
    service_role_key: str,
    *,
    client: httpx.Client | None = None,
    toi_thieu_ngon_ngu: int = 15,
    toi_thieu_sau: int = 15,
    gioi_han_nhat_ky: int = 500,
) -> dict[str, list[dict[str, Any]]]:
    """Đọc số liệu gộp ẩn danh từ Supabase REST / RPC và chuẩn hoá về cấu trúc đầu vào của `tong_hop_ung_vien`."""
    goc = supabase_url.rstrip("/")
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }
    dong_mo = client is None
    http = client or httpx.Client(timeout=25.0)
    try:
        # 1. RPC ty_le_kiem_chung_ngon_ngu (0034): [{mau, ngon_ngu, dung, chua_dung}]
        r_nn = http.post(
            f"{goc}/rest/v1/rpc/ty_le_kiem_chung_ngon_ngu",
            headers=headers,
            json={"p_toi_thieu": toi_thieu_ngon_ngu},
        )
        r_nn.raise_for_status()
        dong_nn: list[dict[str, Any]] = r_nn.json() if isinstance(r_nn.json(), list) else []

        # Gom tổng phiếu theo mã & gom cặp VI ↔ EN
        gop_ma: dict[str, dict[str, int]] = defaultdict(lambda: {"dung": 0, "chua_dung": 0})
        theo_nn: dict[str, dict[str, tuple[int, int]]] = defaultdict(dict)
        for d in dong_nn:
            mau = str(d.get("mau") or "").strip()
            nn = str(d.get("ngon_ngu") or "vi").strip().lower().split("-")[0]
            dung = int(d.get("dung") or 0)
            chua = int(d.get("chua_dung") or 0)
            if not mau:
                continue
            gop_ma[mau]["dung"] += dung
            gop_ma[mau]["chua_dung"] += chua
            cu_d, cu_c = theo_nn[mau].get(nn, (0, 0))
            theo_nn[mau][nn] = (cu_d + dung, cu_c + chua)

        kiem_chung_phieu = [
            {
                "mo_dun": suy_mo_dun_tu_ma(mau),
                "ma_mau": mau,
                "so_dung": sl["dung"],
                "so_chua_dung": sl["chua_dung"],
            }
            for mau, sl in sorted(gop_ma.items())
        ]

        lech_ngon_ngu: list[dict[str, Any]] = []
        for mau, bang_nn in sorted(theo_nn.items()):
            if "vi" in bang_nn and "en" in bang_nn:
                d_vi, c_vi = bang_nn["vi"]
                d_en, c_en = bang_nn["en"]
                t_vi, t_en = d_vi + c_vi, d_en + c_en
                if t_vi > 0 and t_en > 0:
                    lech_ngon_ngu.append({
                        "mo_dun": suy_mo_dun_tu_ma(mau),
                        "ma_mau": mau,
                        "tong_vi": t_vi,
                        "tong_en": t_en,
                        "ty_le_dung_vi": d_vi / t_vi,
                        "ty_le_dung_en": d_en / t_en,
                    })

        # 2. RPC ty_le_kiem_chung_sau (0022): [{loai, mau, so_phieu, da_lam, tot_hon, nhu_cu}]
        r_sau = http.post(
            f"{goc}/rest/v1/rpc/ty_le_kiem_chung_sau",
            headers=headers,
            json={"p_toi_thieu": toi_thieu_sau},
        )
        r_sau.raise_for_status()
        dong_sau: list[dict[str, Any]] = r_sau.json() if isinstance(r_sau.json(), list) else []
        kiem_chung_sau = []
        for s in dong_sau:
            mau = str(s.get("mau") or "").strip()
            loai = str(s.get("loai") or "")
            so_phieu = int(s.get("so_phieu") or 0)
            tot_hon = int(s.get("tot_hon") or 0)
            nhu_cu = int(s.get("nhu_cu") or 0)
            con_lai = max(0, so_phieu - tot_hon - nhu_cu)
            if mau and so_phieu > 0:
                kiem_chung_sau.append({
                    "mo_dun": suy_mo_dun_tu_ma(mau, loai),
                    "ma_mau": mau,
                    "so_do_hon": tot_hon,
                    "so_nhu_cu": nhu_cu,
                    "so_nang_hon": con_lai,
                })

        # 3. Bảng nhat_ky_hoi: CHỈ đọc cột phân loại mã tất định (TUYỆT ĐỐI không đọc cột `cau_hoi`)
        r_nk = http.get(
            f"{goc}/rest/v1/nhat_ky_hoi",
            headers=headers,
            params={
                "select": COT_NHAT_KY_AN_TOAN,
                "order": "id.desc",
                "limit": str(gioi_han_nhat_ky),
            },
        )
        cum_cau_hoi_chua_phu: list[dict[str, Any]] = []
        if r_nk.status_code == 200 and isinstance(r_nk.json(), list):
            dem_cum: dict[tuple[str, str], list[float]] = defaultdict(list)
            for row in r_nk.json():
                assert "cau_hoi" not in row, "Cấm đọc cột văn bản tự do cau_hoi"
                mo_dun = str(row.get("mo_dun") or "chung").strip().lower()
                chu_de = str(row.get("chu_de") or row.get("y_dinh") or "chua_phan_loai").strip().lower()
                do_phu = str(row.get("do_phu") or "").strip().lower()
                huu_ich = row.get("huu_ich")
                # Quy đổi mức độ phủ tất định sang điểm khớp [0..1]
                if do_phu in ("khong_phu", "thieu", "ngoai_pham_vi") or huu_ich is False:
                    diem = 0.25 if do_phu in ("khong_phu", "thieu") else 0.40
                elif do_phu in ("mot_phan", "chung"):
                    diem = 0.50
                else:
                    diem = 0.85
                dem_cum[(mo_dun, chu_de)].append(diem)
            for (mo_dun, chu_de), ds_diem in sorted(dem_cum.items()):
                cum_cau_hoi_chua_phu.append({
                    "mo_dun": mo_dun,
                    "chu_de": chu_de,
                    "so_luot": len(ds_diem),
                    "diem_khop_tb": sum(ds_diem) / len(ds_diem),
                })

        return {
            "kiem_chung_phieu": kiem_chung_phieu,
            "kiem_chung_sau": kiem_chung_sau,
            "lech_ngon_ngu": lech_ngon_ngu,
            "cum_cau_hoi_chua_phu": cum_cau_hoi_chua_phu,
        }
    finally:
        if dong_mo:
            http.close()


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
        tep_kb = ANH_XA_MO_DUN_KB.get(mo_dun, "go_nut_doi_song_kb.json")
        item = {
            "mo_dun": mo_dun,
            "ma_mau": p.get("ma_mau", ""),
            "tong_phieu": tong,
            "ty_le_dung": round(ty_le, 3),
            "tep_kb_goi_y": tep_kb,
            "duong_quan_tri": f"/quan-tri/tri-thuc/{tep_kb.removesuffix('.json')}",
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
            tep_kb = ANH_XA_MO_DUN_KB.get(mo_dun, "go_nut_doi_song_kb.json")
            can_doi_hanh_dong_30_ngay.append({
                "mo_dun": mo_dun,
                "ma_mau": s.get("ma_mau", ""),
                "tong_phieu_sau": tong_sau,
                "ty_le_nhu_cu": round(ty_le_nhu_cu, 3),
                "tep_kb_goi_y": tep_kb,
                "duong_quan_tri": f"/quan-tri/tri-thuc/{tep_kb.removesuffix('.json')}",
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
            tep_kb = ANH_XA_MO_DUN_KB.get(mo_dun, "go_nut_doi_song_kb.json")
            cum_to_mo_moi.append({
                "mo_dun": mo_dun,
                "chu_de": q.get("chu_de", ""),
                "so_luot": so_luot,
                "diem_khop_tb": round(diem_khop, 3),
                "tep_kb_goi_y": tep_kb,
                "duong_quan_tri": f"/quan-tri/tri-thuc/{tep_kb.removesuffix('.json')}",
            })

    can_viet_lai.sort(key=lambda x: x["ty_le_dung"])
    thuc_chung_cao.sort(key=lambda x: -x["ty_le_dung"])
    cum_to_mo_moi.sort(key=lambda x: -x["so_luot"])

    tong_can_xu_ly = (
        len(can_viet_lai)
        + len(can_doi_hanh_dong_30_ngay)
        + len(lech_song_ngu)
        + len(cum_to_mo_moi)
    )

    return {
        "ngay_tong_hop": dt.date.today().isoformat(),
        "so_mang_ho_tro": len(ANH_XA_MO_DUN_KB),
        "tong_can_xu_ly": tong_can_xu_ly,
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
        f"- Ngày tổng hợp: `{ket_qua.get('ngay_tong_hop', '')}`",
        f"- Tổng số mảng giám sát: **{ket_qua['so_mang_ho_tro']}**",
        f"- Tổng hạng mục cần biên tập / rà soát tuần này: **{ket_qua.get('tong_can_xu_ly', 0)}**",
        f"- Mục cần viết lại (`< 40%` đồng thuận, `≥ 30` phiếu): **{len(ket_qua['can_viet_lai'])}**",
        f"- Mục cần chỉnh hành động sau 30 ngày (`≥ 60%` chưa đổi): **{len(ket_qua['can_doi_hanh_dong_30_ngay'])}**",
        f"- Mục lệch bản dịch Anh – Việt (`≥ 20%`): **{len(ket_qua['lech_song_ngu'])}**",
        f"- Cụm câu hỏi mới chưa phủ sâu: **{len(ket_qua['cum_to_mo_moi'])}**",
        f"- Mục đạt ngưỡng thực chứng cao (`≥ 75%`): **{len(ket_qua['thuc_chung_cao'])}**",
        "",
        "> **Kỷ luật an toàn:** Báo cáo chỉ dùng mã hộp tất định & số đếm gộp ẩn danh, tuyệt đối không chứa dữ liệu cá nhân hay văn bản tự do của người dùng. Hệ thống không tự động sửa tệp KB khi chưa có Chủ dự án đọc duyệt.",
        "",
    ]
    if ket_qua["can_viet_lai"]:
        dong.append("## 1. Ưu tiên biên tập lại trong tuần (`< 40%` đồng thuận)")
        for x in ket_qua["can_viet_lai"]:
            dong.append(
                f"- `{x['ma_mau']}` ({x['mo_dun']} → `{x['tep_kb_goi_y']}` · `{x.get('duong_quan_tri', '')}`): "
                f"đồng thuận {x['ty_le_dung']*100:.1f}% trên {x['tong_phieu']} phiếu."
            )
        dong.append("")
    if ket_qua["can_doi_hanh_dong_30_ngay"]:
        dong.append("## 2. Gợi ý hành động cần làm cụ thể hơn sau 30 ngày (`≥ 60%` như cũ)")
        for x in ket_qua["can_doi_hanh_dong_30_ngay"]:
            dong.append(
                f"- `{x['ma_mau']}` ({x['mo_dun']} → `{x['tep_kb_goi_y']}`): "
                f"{x['ty_le_nhu_cu']*100:.1f}% phản hồi chưa chuyển biến trên {x['tong_phieu_sau']} phiếu sau 30 ngày."
            )
        dong.append("")
    if ket_qua["lech_song_ngu"]:
        dong.append("## 3. Độ vênh bản phủ Song ngữ VI ↔ EN (`≥ 20%`)")
        for x in ket_qua["lech_song_ngu"]:
            dong.append(
                f"- `{x['ma_mau']}` (`{x['tep_en_can_ra']}`): VI {x['ty_le_vi']*100:.1f}% vs EN {x['ty_le_en']*100:.1f}% "
                f"(lệch {x['do_lech']*100:.1f}%)."
            )
        dong.append("")
    if ket_qua["cum_to_mo_moi"]:
        dong.append("## 4. Cụm chủ đề người dùng hỏi nhiều nhưng KB chưa phủ sâu")
        for x in ket_qua["cum_to_mo_moi"]:
            dong.append(
                f"- `{x['mo_dun']}` · chủ đề `{x['chu_de']}` → gợi ý bồi đắp `{x['tep_kb_goi_y']}`: "
                f"{x['so_luot']} lượt (điểm khớp TB {x['diem_khop_tb']:.2f})."
            )
        dong.append("")
    if ket_qua["thuc_chung_cao"]:
        dong.append("## 5. Hộp luận giải đạt thực chứng cao (`≥ 75%` đồng thuận — giữ làm chuẩn)")
        for x in ket_qua["thuc_chung_cao"]:
            dong.append(
                f"- `{x['ma_mau']}` (`{x['tep_kb_goi_y']}`): {x['ty_le_dung']*100:.1f}% trên {x['tong_phieu']} phiếu."
            )
        dong.append("")
    return "\n".join(dong)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Tổng hợp ứng viên nâng cấp KB hàng tuần từ dữ liệu kiểm chứng DB.")
    nguon = ap.add_mutually_exclusive_group(required=True)
    nguon.add_argument("--input-json", type=Path, help="Đọc từ tệp JSON xuất ẩn danh.")
    nguon.add_argument("--tu-supabase", action="store_true", help="Kéo số liệu gộp ẩn danh trực tiếp từ Supabase REST.")
    ap.add_argument("--cho-phep-thieu-env", action="store_true", help="Thoát êm (code 0) nếu chưa cấu hình SUPABASE_URL/KEY.")
    ap.add_argument("--out-json", type=Path)
    ap.add_argument("--out-md", type=Path)
    args = ap.parse_args(argv)

    if args.tu_supabase:
        sb_url = os.environ.get("SUPABASE_URL", "").strip()
        sb_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        if not sb_url or not sb_key:
            if args.cho_phep_thieu_env:
                print("Bỏ qua: chưa đặt SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.")
                return 0
            raise SystemExit("Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.")
        du_lieu = tai_du_lieu_supabase(sb_url, sb_key)
    else:
        du_lieu = json.loads(args.input_json.read_text(encoding="utf-8"))

    kq = tong_hop_ung_vien(du_lieu)
    if args.out_json:
        args.out_json.parent.mkdir(parents=True, exist_ok=True)
        args.out_json.write_text(json.dumps(kq, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.out_md:
        args.out_md.parent.mkdir(parents=True, exist_ok=True)
        args.out_md.write_text(xuat_markdown(kq), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
