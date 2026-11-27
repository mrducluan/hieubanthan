# -*- coding: utf-8 -*-
"""Chặng 3.1 — Tầng Chiến thuật Sự vụ tức thời (`POST /v1/co-van/su-vu`).

Phối hợp hai môn sự vụ cho một việc cụ thể sắp diễn ra, ĐỌC ĐỘC LẬP (không gộp điểm — CD-1):
  1. Kỳ Môn Thời Gia (`luangiai.ky_mon.doc_ngay` / `doc_gio`): chọn khung giờ ban ngày và hướng ngồi/xuất phát.
  2. Lục Hào Nạp Giáp (`calc.kinhdich` + `calc.luc_hao` + `luangiai.kinhdich_doi_song`): soi hào đại diện (dụng thần),
     nguyên/kỵ thần, tuần không/nguyệt phá và gợi ý ngày can chi ứng kỳ.

Tất định khi truyền `hat_giong` hoặc `gia_tri_hao`; CSPRNG khi để trống. Không LLM, không lưu DB.
"""
from __future__ import annotations

import datetime as dt
import hashlib

from app import config
from app.calc import kinhdich, ky_mon as calc_km, luc_hao as lh, vuong_suy as vs
from app.hoidap import chung as hd_chung, luan_hoi_khop as lhk
from app.kb import kinhdich_tra_loi_kb as kd_kb, nap, ten as _tn
from app.luangiai import co_van_tam_tai as cv, kinhdich_doi_song as kd_ds, ky_mon as lg_km
from app.kb.loi import L
from app.ngon_ngu import la_viet

MA_TINH_HUONG = (
    "dam_phan_thuong_vu",
    "ky_ket_hop_dong",
    "thu_hoi_cong_no",
    "ra_mat_khai_truong",
    "hoa_giai_bat_dong",
    "cho_tin_ket_qua",
)


def _kb() -> dict:
    return nap.doc("su_vu_chien_thuat_kb.json")


def _ly_do_dung_than(khung: dict, dt_viec: dict) -> str:
    """Lời "vì sao lấy hào này" dựng từ MỘT nguồn dụng thần theo việc (`kinhdich_tra_loi.dung_than_viec`)."""
    phu = ""
    if dt_viec.get("phu"):
        phu += khung["ly_do_phu"].format(ten=dt_viec.get("ten_phu", ""), lt=_tn.ten("luc_than_kd", dt_viec["phu"]))
    if dt_viec.get("ky"):
        phu += khung["ly_do_ky"].format(ten=dt_viec.get("ten_ky", ""), lt=_tn.ten("luc_than_kd", dt_viec["ky"]))
    return khung["ly_do_dung_than"].format(ten=dt_viec.get("ten", ""), chinh=_tn.ten("luc_than_kd", dt_viec["chinh"]), phu=phu)


def _gieo_tu_hat_giong(hat_giong: str) -> list[int]:
    """Sinh tất định 6 hào đồng xu (6/7/8/9, đúng phân phối 1:3:3:1 của 3 đồng xu) từ chuỗi hạt giống."""
    digest = hashlib.sha256(hat_giong.encode("utf-8")).digest()
    bang = (6, 7, 7, 7, 8, 8, 8, 9)
    return [bang[digest[i] & 7] for i in range(6)]


def _nhan_nguon_que(nguon_ma: str) -> str:
    if la_viet():
        return {
            "tay": "gieo tay (người dùng nhập 6 hào)",
            "hat_giong": "khởi quẻ tất định từ mã phiên",
            "csprng": "gieo ba đồng xu ngẫu nhiên mật mã (CSPRNG)",
        }[nguon_ma]
    return {
        "tay": "manual 6-line coin input",
        "hat_giong": "deterministic session-seed coin cast",
        "csprng": "cryptographic 3-coin cast (CSPRNG)",
    }[nguon_ma]


_CUA_EN = {
    "Khai": "Open",
    "Hưu": "Rest",
    "Sinh": "Life",
    "Thương": "Harm",
    "Đỗ": "Delusion",
    "Cảnh": "View",
    "Tử": "Stillness",
    "Kinh": "Shock",
}


def _gio_km_hien(g: dict) -> dict:
    if la_viet():
        return {
            "chi": g["chi"],
            "khung": g["khung"],
            "phuong": g["phuong"],
            "cua": g["cua"],
            "noi_bat": bool(g.get("noi_bat")),
            "ky": list(g.get("ky") or []),
            "loi": g["loi"],
        }
    chi = _tn.ten("chi", g["chi"])
    phuong = _tn.ten("huong", g["phuong"])
    cua = _CUA_EN.get(g["cua"], g["cua"])
    ky = [_tn.ten("can", k) for k in (g.get("ky") or [])]
    them_ky = f" with Three Wonders ({', '.join(ky)})" if ky else ""
    return {
        "chi": chi,
        "khung": g["khung"],
        "phuong": phuong,
        "cua": cua,
        "noi_bat": bool(g.get("noi_bat")),
        "ky": ky,
        "loi": f"{chi} hour ({g['khung']}): {phuong} direction, {cua} Door{them_ky}.",
    }


def _ung_ky_hien(ds: list[dict]) -> list[dict]:
    ra = []
    for u in ds:
        chi_hien = u["chi"] if la_viet() else _tn.ten("chi", u["chi"])
        ra.append({
            "chi": chi_hien,
            "ly_do": u["ly_do"],
            "hao": u["hao"],
            "ngay_gan_nhat": u["ngay_gan_nhat"],
            "sau_bao_nhieu_ngay": u["sau_bao_nhieu_ngay"],
        })
    return ra


def xem_su_vu(
    *,
    cau_hoi: str,
    tinh_huong: str = "dam_phan_thuong_vu",
    ngay_xem: dt.date | None = None,
    gio_xem: str | None = None,
    utc: float = 7.0,
    gia_tri_hao: list[int] | None = None,
    hat_giong: str | None = None,
    ngay_sinh: dt.date | None = None,
) -> dict:
    kb = _kb()
    khung = kb["khung"]
    # Giờ "bây giờ" theo đúng múi giờ người xem (`utc`, mặc định giờ VN): không truyền ngày → hôm nay ở múi giờ đó;
    # không truyền giờ → quẻ gieo ở giờ hiện tại (trả ra `thoi_diem_gieo`), không cố định một giờ giả.
    bay_gio = dt.datetime.now(dt.timezone(dt.timedelta(hours=utc))).replace(tzinfo=None)
    hn = ngay_xem or bay_gio.date()

    # 1. Cổng an toàn chung (khủng hoảng có 988 song ngữ, y tế cấp cứu, pháp lý hình sự, cá cược đỏ đen)
    chan = cv._kiem_an_toan(cau_hoi)
    if chan is not None:
        return {
            "mo_dun": "su_vu_tuc_thoi",
            "an_toan_chan": chan,
            "ranh_gioi": khung["ranh_gioi"],
        }

    # 2. Cổng tuổi 16+ (TUOI-16) khi có truyền ngày sinh
    if ngay_sinh is not None:
        tuoi = hn.year - ngay_sinh.year - ((hn.month, hn.day) < (ngay_sinh.month, ngay_sinh.day))
        if tuoi < config.TUOI_NGUOI_LON:
            return {
                "mo_dun": "su_vu_tuc_thoi",
                "chuyen_huong_tuoi": {
                    "tuoi": tuoi,
                    "thong_bao": khung["tuoi_nho"],
                },
                "ranh_gioi": khung["ranh_gioi"],
            }

    # 3. Cổng câu hỏi dò xét đời tư người khác hoặc kể chuyện đã qua (đồng bộ /v1/co-van)
    t_norm = hd_chung.chuan_hoa_cau(cau_hoi or "")
    if lhk.noi_ve_nguoi_khac(cau_hoi, t_norm):
        return {
            "mo_dun": "su_vu_tuc_thoi",
            "chuyen_huong": {
                "ly_do": "nguoi_khac",
                "thong_bao": (
                    "Sự vụ tức thời chỉ soi phương án hành động của chính bạn, không gieo quẻ dò xét đời tư người khác."
                    if la_viet()
                    else "Tactical readings examine your own upcoming actions and never probe a third party's private life."
                ),
            },
            "ranh_gioi": khung["ranh_gioi"],
        }

    if tinh_huong not in kb["tinh_huong"]:
        raise ValueError(L("chang3.tinh_huong", "Tình huống sự vụ không hợp lệ: {ma}.", ma=tinh_huong))
    th = kb["tinh_huong"][tinh_huong]

    # 3. Góc nhìn 1 — Kỳ Môn Thời Gia (chọn khung giờ ban ngày & hướng cho đúng việc)
    viec_km = th["viec_ky_mon"]
    km_ngay = lg_km.doc_ngay(hn, utc=utc, viec=viec_km)
    gio_tot_all = (km_ngay.get("viec") or {}).get("gio_tot") or []
    gio_ban_ngay = [g for g in gio_tot_all if not g.get("ban_dem")][:4]
    if not gio_ban_ngay:
        gio_ban_ngay = gio_tot_all[:3]

    ban_gio_chon = None
    if gio_xem:
        hh, mm = map(int, gio_xem.split(":"))
        gio_phut = (hh, mm)
        td_chon = dt.datetime(hn.year, hn.month, hn.day, hh, mm)
        ban_raw = calc_km.lap_ban(td_chon, utc=utc)
        dg = lg_km.doc_gio(ban_raw, viec=viec_km)
        g, v = dg.get("gio") or {}, dg.get("viec") or {}
        muc_gio, muc_viec = g.get("muc", "binh"), v.get("muc", "binh")
        if la_viet():
            muc_nhan, loi_viec = g.get("muc_nhan", ""), v.get("loi", "")
        else:   # bài đọc Kỳ Môn chưa có bản Anh — nhãn + lời ngắn theo MÃ mức (KB en)
            muc_nhan = khung["muc_gio_nhan"].get(muc_gio, "")
            loi_viec = khung["loi_viec_mau"].get(muc_viec, "").format(phuong=_tn.ten("huong", v.get("phuong") or ""))
        ban_gio_chon = {
            "khung": g.get("khung", ""),
            "muc": muc_gio,
            "muc_nhan": muc_nhan,
            "huong_thuan": [h if la_viet() else _tn.ten("huong", h) for h in (dg.get("huong_thuan") or [])],
            "muc_viec": muc_viec,
            "loi_viec": loi_viec,
        }
    else:
        gio_phut = (bay_gio.hour, bay_gio.minute)   # không chọn giờ → giờ hiện tại ở múi giờ người xem (ghi ở `thoi_diem_gieo`)

    goc_ky_mon = {
        "nhan": khung["nhan_ky_mon"],
        "ngay": hn.isoformat(),
        "viec_ma": viec_km,
        "gio_thuan": [_gio_km_hien(g) for g in gio_ban_ngay],
        "ghi_chu_gio": khung["chua_co_gio_tot"] if not gio_ban_ngay else None,
        "gio_dang_xem": ban_gio_chon,
        "trich_co_thu": th["trich_ky_mon"],
    }

    # 4. Góc nhìn 2 — Lục Hào Nạp Giáp (khởi quẻ + phân tích dụng thần + ứng kỳ)
    if gia_tri_hao is not None:
        if len(gia_tri_hao) != 6 or any(v not in kinhdich.GIA_TRI_HOP_LE for v in gia_tri_hao):
            raise ValueError(L("chang3.gia_tri_hao", "gia_tri_hao cần đúng 6 giá trị, mỗi giá trị là 6, 7, 8 hoặc 9."))
        vals, nguon_ma = list(gia_tri_hao), "tay"
    elif hat_giong:
        vals, nguon_ma = _gieo_tu_hat_giong(hat_giong), "hat_giong"
    else:
        vals, nguon_ma = kinhdich.gieo("tien"), "csprng"

    que = kinhdich.khoi_que(vals)
    luc_gieo = dt.datetime(hn.year, hn.month, hn.day, gio_phut[0], gio_phut[1])
    tg = vs.thoi_gian(luc_gieo)
    dt_viec = kd_kb.dung_than_viec(th["viec_kinh_dich"])   # một nguồn dụng thần theo việc (KD-V3)
    dung_than_goc = dt_viec["chinh"]
    pt = lh.phan_tich(que, tg, dung_than_goc, luc_gieo)
    gn_lh = kd_ds._goc_nhin_luc_hao(pt) or {}
    the_q = kd_ds.the_que(que)

    ten_que_ban = kd_ds.tq(que["quai_ban"]["ten"])
    ten_que_bien = kd_ds.tq(que["quai_bien"]["ten"]) if que.get("quai_bien") else None

    goc_luc_hao = {
        "nhan": khung["nhan_luc_hao"],
        "nguon_gieo": _nhan_nguon_que(nguon_ma),
        "thoi_diem_gieo": luc_gieo.strftime("%Y-%m-%d %H:%M"),
        "gia_tri_hao": vals,
        "que_ban": {
            "so": que["quai_ban"]["so_king_wen"],
            "ten": ten_que_ban,
            "hao_dong": que["hao_dong"],
        },
        "que_bien": (
            {"so": que["quai_bien"]["so_king_wen"], "ten": ten_que_bien}
            if que.get("quai_bien")
            else None
        ),
        "dung_than": _tn.ten("luc_than_kd", dung_than_goc),
        "dung_than_phu": _tn.ten("luc_than_kd", dt_viec["phu"]) if dt_viec.get("phu") else None,
        "ly_do_dung_than": _ly_do_dung_than(khung, dt_viec),
        "viec_kinh_dich": th["viec_kinh_dich"],
        "muc": gn_lh.get("muc", "can_bang"),
        "nhan_muc": gn_lh.get("nhan", ""),
        "tom_tat": gn_lh.get("tom_tat", ""),
        "can_cu": gn_lh.get("can_cu", []),
        "ung_ky": _ung_ky_hien(gn_lh.get("ung_ky", [])),
        "ung_ky_ghi_chu": khung["ung_ky_ghi_chu"],
        "the_que": the_q["can_cu"] if the_q else None,
        "trich_co_thu": th["trich_luc_hao"],
    }

    return {
        "mo_dun": "su_vu_tuc_thoi",
        "khung": {
            "tieu_de": khung["tieu_de"],
            "phu_de": khung["phu_de"],
            "ranh_gioi": khung["ranh_gioi"],
        },
        "tinh_huong": {
            "ma": tinh_huong,
            "ten": th["ten"],
            "mo_ta": th["mo_ta"],
        },
        "goc_ky_mon": goc_ky_mon,
        "goc_luc_hao": goc_luc_hao,
        "chuan_bi_thuc_te": th["chuan_bi_thuc_te"],
    }
