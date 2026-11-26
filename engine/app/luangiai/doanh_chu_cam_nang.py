# -*- coding: utf-8 -*-
"""Chặng 2 (Mở rộng Kinh doanh) — Cẩm nang Chiến lược & Bài trí Kinh doanh Liên mảng
(`POST /v1/doanh-chu/cam-nang-kinh-doanh`).

Điều phối trực tiếp (không viết lặp phép tính):
  - Bát tự (`calc.battu`, `battu_doi_song`, `ung_dung_co_dien`): Mũi nhọn Thập thần thương trường + Phương vị/Chất liệu Dụng thần.
  - Tử vi (`tuvi_doi_song`, khi có giờ sinh): Cung Thiên Di (đánh xa vs giữ cứ điểm), Cung Nô Bộc (giao quyền nhân sự), Cung Điền Trạch (mặt bằng).
  - Phong thuỷ (`calc.phongthuy`, `calc.huyen_khong.trach_ban` + `thanh_mon`, `doanh_chu_mat_bang`): So sánh 1–3 mặt bằng ứng viên,
    khai mở Thành Môn Quyết Vận 9, bố trí Bàn Chủ cơ sở, Quầy Thu ngân, Cửa đón khách, Khu giữ tĩnh & Checklist Loan đầu thực địa.
"""
from __future__ import annotations

import datetime as dt

from app import ngon_ngu
from app.calc import battu as bt_calc, huyen_khong as hk, phongthuy as pt, tuvi_an_sao as az
from app.config import hom_nay_vn
from app.kb import nap, ten as ten_kb
from app.luangiai import (
    battu_doi_song as btd,
    doanh_chu_mat_bang as dcmb,
    tuvi_doi_song as tvd,
    ung_dung_co_dien as ud,
)

_TEP = "doanh_chu_cam_nang_kb.json"
_NORM_H = {"Kim": "Kim", "Mộc": "Mộc", "Thủy": "Thủy", "Thuỷ": "Thủy", "Hỏa": "Hỏa", "Hoả": "Hỏa", "Thổ": "Thổ"}
_SINH = {"Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim", "Kim": "Thủy", "Thủy": "Mộc"}
_KHAC = {"Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim", "Kim": "Mộc"}


def _kb() -> dict:
    return nap.doc(_TEP)


def _mui_nhon_tu_ngu_hanh(nc_hanh: str, diem_norm: dict[str, float]) -> str:
    h_troi = max(diem_norm.items(), key=lambda kv: kv[1])[0]
    if h_troi == nc_hanh:
        return "ty_kiep"
    if _SINH[nc_hanh] == h_troi:
        return "thuc_thuong"
    if _KHAC[nc_hanh] == h_troi:
        return "tai_tinh"
    return "quan_an"


def _cham_mot_mat_bang(
    mb_in: dict,
    *,
    idx: int,
    ngay_sinh: dt.date,
    gioi_tinh: str,
    hom_nay: dt.date,
    tinh_ngay: bool,
    k: dict,
) -> dict:
    do_h = float(mb_in["do_huong"])
    nam_xay = int(mb_in["nam_xay"]) if mb_in.get("nam_xay") is not None else None
    loai_hinh = mb_in.get("loai_hinh") or "cua_hang"
    ten_diem = (mb_in.get("ten_diem") or "").strip() or (
        f"Mặt bằng #{idx}" if ngon_ngu.la_viet() else f"Candidate #{idx}"
    )

    # Tái sử dụng doanh_chu_mat_bang.kiem_tra_mat_bang (nếu không phải mặt bằng đầu thì dùng bản rút gọn không chạy lặp Kỳ Môn 60 ngày)
    if tinh_ngay:
        kq_mb = dcmb.kiem_tra_mat_bang(
            do_huong=do_h, nam_xay=nam_xay,
            ngay_sinh=ngay_sinh.day, thang_sinh=ngay_sinh.month, nam_sinh=ngay_sinh.year,
            gioi_tinh=gioi_tinh, loai_hinh=loai_hinh, ngay_bat_dau=hom_nay,
        )
    else:
        goc_fn = dcmb._ngay_khai_truong
        try:
            dcmb._ngay_khai_truong = lambda *a, **kw: {"ds": [], "cach_chon": ""}  # type: ignore[assignment]
            kq_mb = dcmb.kiem_tra_mat_bang(
                do_huong=do_h, nam_xay=nam_xay,
                ngay_sinh=ngay_sinh.day, thang_sinh=ngay_sinh.month, nam_sinh=ngay_sinh.year,
                gioi_tinh=gioi_tinh, loai_hinh=loai_hinh, ngay_bat_dau=hom_nay,
            )
        finally:
            dcmb._ngay_khai_truong = goc_fn  # type: ignore[assignment]

    # Tính Thành Môn Quyết (城門訣) từ calc.huyen_khong.thanh_mon
    info_mb = kq_mb["mat_bang"]
    van_nay = int(info_mb["van_hien_tai"])
    tm_raw = hk.thanh_mon(int(info_mb["van"] or van_nay), info_mb["son_toa"])
    tm_chon = tm_raw["chinh"] if tm_raw["chinh"]["dung_duoc"] else tm_raw["phu"] if tm_raw["phu"]["dung_duoc"] else None
    if tm_chon:
        vai_str = ("Chính Thành Môn" if tm_chon["vai"] == "chinh" else "Phó Thành Môn") if ngon_ngu.la_viet() else (
            "Primary Castle Gate" if tm_chon["vai"] == "chinh" else "Secondary Castle Gate"
        )
        loi_tm = k["thanh_mon"]["co"].format(
            vai=vai_str,
            cung=ten_kb.ten("cung_hk", tm_chon["cung"]),
            phuong=ten_kb.ten("huong", tm_chon["phuong"]),
            van=tm_raw["van"],
        )
    else:
        loi_tm = k["thanh_mon"]["khong"].format(van=tm_raw["van"])

    # Khóa xếp hạng tất định (không trả điểm số ra ngoài, chỉ để xếp mặt bằng thuận nhất lên đầu):
    # 1) Không phạm Không Vong, 2) Cửa chính thuận/cân bằng, 3) Số khu vực đạt mức "thuan", 4) Có Thành Môn đắc vận
    cua_kv = next((x for x in kq_mb["danh_sach_khu_vuc"] if x["ma"] == "cua_chinh"), {})
    so_khu_thuan = sum(1 for x in kq_mb["danh_sach_khu_vuc"] if x.get("muc") == "thuan")
    hang_khoa = (
        info_mb.get("canh_bao_ma") != "khong_vong",
        cua_kv.get("muc") == "thuan",
        so_khu_thuan,
        bool(tm_chon),
    )

    ds_ngay_kt = kq_mb["ngay_khai_truong"]
    if not ngon_ngu.la_viet() and ds_ngay_kt:
        from app.luangiai import lich_hien  # noqa: PLC0415
        ds_ngay_kt = [{**x, "can_chi": lich_hien.can_chi(x["can_chi"]) if x.get("can_chi") else ""} for x in ds_ngay_kt]

    return {
        "_hang": hang_khoa,
        "ten_diem": ten_diem,
        "loai_hinh": kq_mb["loai_hinh"],
        "do_huong": info_mb["do_huong"],
        "phuong_huong": info_mb["phuong_huong"],
        "nam_xay": nam_xay,
        "cuc_ten": info_mb["cuc_ten"],
        "canh_bao_kiem_huong": info_mb["canh_bao_kiem_huong"],
        "tong_quan": kq_mb["tong_quan"],
        "thanh_mon_quyet": {
            "co_thanh_mon": bool(tm_chon),
            "phuong_thanh_mon": ten_kb.ten("huong", tm_chon["phuong"]) if tm_chon else None,
            "luan_giai": loi_tm,
        },
        "danh_sach_khu_vuc": kq_mb["danh_sach_khu_vuc"],
        "ngay_khai_truong": ds_ngay_kt,
    }


def lap_cam_nang(
    *,
    ngay_sinh: dt.date,
    gioi_tinh: str = "nam",
    gio_sinh: str | None = None,
    nganh: str = "dich_vu",
    mat_bang_ung_vien: list[dict] | None = None,
    ngay_xem: dt.date | None = None,
) -> dict:
    hom_nay = ngay_xem or hom_nay_vn()
    k = _kb()
    kb_ud = nap.doc("ung_dung_co_dien_kb.json")
    co_gio = bool(gio_sinh)

    # ---- BÁT TỰ & DỤNG THẦN (Tứ trụ khi có giờ, Tam trụ khi chưa có giờ) --------------------------------------------
    if co_gio:
        hh, mm = (int(x) for x in str(gio_sinh).split(":"))
        lich_bt = dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, hh, mm)
        ls_bt = bt_calc.la_so(lich_bt, gioi_tinh=gioi_tinh, co_gio=True)
        bc_bt = btd.lap({"lich": lich_bt, "gioi_tinh": gioi_tinh, "gio_ty": "da_ty"}, hom_nay, ls=ls_bt)
        u_bt = ud.tu_bao_cao_battu(bc_bt)
        hanh_bu_goc = [
            next(hg for hg in ("Kim", "Mộc", "Thủy", "Hỏa", "Thổ") if ud._HANH_SLUG[hg] == x["hanh_ma"])
            for x in (u_bt or {}).get("hanh_ung_dung", [])
        ]
    else:
        lich_bt = dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, 12, 0)
        ls_bt = bt_calc.la_so(lich_bt, gioi_tinh=gioi_tinh, co_gio=False)
        diem_tmp = {_NORM_H[hk_k]: float(v) for hk_k, v in ls_bt["ngu_hanh"]["diem"].items()}
        sx_thieu = sorted(diem_tmp.items(), key=lambda kv: kv[1])
        hanh_bu_goc = [sx_thieu[0][0], sx_thieu[1][0]]

    diem_norm = {_NORM_H[hk_k]: float(v) for hk_k, v in ls_bt["ngu_hanh"]["diem"].items()}
    nc_can = ls_bt["nhat_chu"]["can"]
    nc_hanh = _NORM_H[ls_bt["nhat_chu"]["ngu_hanh"]]
    hanh_chinh = hanh_bu_goc[0] if hanh_bu_goc else "Thổ"
    the_hanh = kb_ud["ngu_hanh"][hanh_chinh]

    # ---- TỬ VI (Thiên Di · Nô Bộc · Điền Trạch, chỉ khi có giờ sinh chính xác) --------------------------------------
    muc_thien_di = None
    muc_no_boc = None
    muc_dien_trach = None
    if co_gio:
        hh, mm = (int(x) for x in str(gio_sinh).split(":"))
        bc_tv = tvd.lap({"ngay": ngay_sinh, "ti": az.time_index(hh, mm), "gioi_tinh": gioi_tinh, "tz_lich": 7.0}, hom_nay)
        theo_ma = {c["ma"]: c.get("muc") or "can_bang" for c in bc_tv.get("chuong", [])}
        # Chương `quan_he` phản ánh trục Thiên Di – Nô Bộc; `su_nghiep` phản ánh Quan Lộc – Thiên Di; `nha_cua` phản ánh Điền Trạch
        muc_thien_di = "danh_xa_thuan" if theo_ma.get("su_nghiep") == "thuan" or theo_ma.get("quan_he") == "thuan" else "giu_cu_diem"
        muc_no_boc = theo_ma.get("quan_he") or "can_bang"
        muc_dien_trach = theo_ma.get("nha_cua") or "can_bang"

    # ---- MỆNH QUÁI BÁT TRẠCH ----------------------------------------------------------------------------------------
    mq = pt.menh_quai(ngay_sinh.year, gioi_tinh, ngay_sinh)
    ten_quai = ten_kb.ten("quai", mq["quai"])
    bh = pt.bang_huong(mq["quai"])
    huong_tot = [ten_kb.ten("huong", p) for p, dn in bh.items() if dn in dcmb.DU_NIEN_TOT]

    # ---- 1. MỞ RỘNG THỊ TRƯỜNG --------------------------------------------------------------------------------------
    ma_mui = _mui_nhon_tu_ngu_hanh(nc_hanh, diem_norm)
    mui_info = k["mui_nhon_kinh_doanh"][ma_mui]
    pv_info = k["phuong_vi_thi_truong"][hanh_chinh]
    td_key = muc_thien_di if co_gio and muc_thien_di else "chua_co_gio"
    mo_rong_thi_truong = {
        "ma_mui_nhon": ma_mui,
        "ten_mui_nhon": mui_info["ten"],
        "chien_luoc_cot_loi": mui_info["chien_luoc"],
        "rui_ro_can_giu": mui_info["rui_ro_can_giu"],
        "phuong_vi_uu_tien": pv_info["huong_uu_tien"],
        "nganh_nghe_bo_tro_van_9": pv_info["nganh_bo_tro"],
        "goc_nhin_thien_di": k["thien_di_thi_truong"][td_key],
    }

    # ---- 2. CHỌN & SO SÁNH 1–3 ĐỊA ĐIỂM MẶT BẰNG + THÀNH MÔN QUYẾT + LOAN ĐẦU --------------------------------------
    ds_mb_ra = []
    ds_uv = (mat_bang_ung_vien or [])[:3]
    if ds_uv:
        tam = [
            _cham_mot_mat_bang(mb, idx=i + 1, ngay_sinh=ngay_sinh, gioi_tinh=gioi_tinh, hom_nay=hom_nay, tinh_ngay=False, k=k)
            for i, mb in enumerate(ds_uv)
        ]
        tam.sort(key=lambda x: x["_hang"], reverse=True)
        # Tính đủ 5 ngày khai trương + giờ Kỳ Môn cho mặt bằng đứng đầu để phản hồi nhanh < 150ms
        dau_goc = next(mb for mb in ds_uv if round(float(mb["do_huong"]) % 360.0, 1) % 360.0 == tam[0]["do_huong"])
        tam[0] = _cham_mot_mat_bang(dau_goc, idx=1, ngay_sinh=ngay_sinh, gioi_tinh=gioi_tinh, hom_nay=hom_nay, tinh_ngay=True, k=k)
        tam[0]["ten_diem"] = (dau_goc.get("ten_diem") or "").strip() or tam[0]["ten_diem"]
        for rank_idx, item in enumerate(tam, start=1):
            item.pop("_hang", None)
            item["thu_tu_uu_tien"] = rank_idx
            ds_mb_ra.append(item)

    chon_dia_diem_cua_hang = {
        "menh_quai_chu": ten_quai,
        "huong_hop_menh_chu": huong_tot,
        "so_sanh_mat_bang": ds_mb_ra,
        "checklist_loan_dau_6_diem": list(k["checklist_loan_dau_cua_hang"]),
    }

    # ---- 3. CHỌN & PHỐI HỢP NHÂN SỰ CỐT CÁN HỢP VỚI CHỦ (CHUẨN BỘ LUẬT LAO ĐỘNG) -----------------------------------
    ns_kb = k["nhan_su_cot_can"]
    manh_ghep_vai = [ns_kb["vai_can_bu"][h] for h in hanh_bu_goc[:2]]
    nb_key = muc_no_boc if co_gio and muc_no_boc else "chua_co_gio"
    phoi_hop_nhan_su = {
        "manh_ghep_vai_tro_can_bu": manh_ghep_vai,
        "cach_giao_quyen_theo_no_boc": ns_kb["no_boc_giao_quyen"][nb_key],
        "ranh_gioi_phap_ly": ns_kb["ranh_gioi_lao_dong"],
    }

    # ---- 4. BỐ TRÍ BÀN LÀM VIỆC CHỦ & VĂN PHÒNG ---------------------------------------------------------------------
    fmt_vp = {
        "quai": ten_quai,
        "huong_tot": ", ".join(huong_tot[:3]),
        "hanh_can": the_hanh["ten"],
        "mau_sac": the_hanh["mau_sac"].lower(),
        "chat_lieu": the_hanh["chat_lieu"].lower(),
        "khung_gio": the_hanh["khung_gio"],
    }
    bo_tri_van_phong = {
        "nhat_chu": f"{ten_kb.ten('can', nc_can)} ({ten_kb.ten('hanh', nc_hanh)})",
        "co_gio": co_gio,
        "hanh_bo_tro_khong_gian": the_hanh["ten"],
        "nguyen_tac_4_diem": [s.format(**fmt_vp) for s in k["bo_tri_van_phong_chu"]["nguyen_tac_4_diem"]],
    }

    # ---- 5. BÀI TRÍ KHÔNG GIAN BUÔN BÁN – CỬA HÀNG – QUẦY THU NGÂN --------------------------------------------------
    dt_key = muc_dien_trach if co_gio and muc_dien_trach else "chua_co_gio"
    bo_tri_cua_hang = {
        "nguyen_tac_quay_thu_ngan_va_cua": list(k["bo_tri_cua_hang_buon_ban"]["nguyen_tac_quay_thu_ngan"]),
        "chien_luoc_mat_bang_dien_trach": k["bo_tri_cua_hang_buon_ban"]["dien_trach_tich_san"][dt_key],
    }

    return {
        "ngay_xem": hom_nay.isoformat(),
        "nganh": nganh,
        "bac_phan_tich": 3 if ds_uv else (2 if co_gio else 1),
        "mo_rong_thi_truong": mo_rong_thi_truong,
        "chon_dia_diem_cua_hang": chon_dia_diem_cua_hang,
        "phoi_hop_nhan_su": phoi_hop_nhan_su,
        "bo_tri_van_phong_chu": bo_tri_van_phong,
        "bo_tri_cua_hang_buon_ban": bo_tri_cua_hang,
    }
