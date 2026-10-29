# -*- coding: utf-8 -*-
"""SEO-J — 76 trang "Sinh năm X mệnh gì" (1950–2025), dựng từ CALC + KB (chỉ ĐỌC + GHÉP, không sinh nghĩa mới).

Dữ kiện TÍNH: can chi năm (lunar.can_chi_nam), mệnh nạp âm (can_chi.nap_am), ngũ hành sinh/khắc (can_chi),
tam hợp / lục hợp / lục xung / tứ hành xung theo địa chi năm, cung phi nam–nữ (calc/phongthuy), mốc đầu năm:
Tết âm lịch Việt Nam (lịch Hồ Ngọc Đức UTC+7) và Lập xuân (tiết khí, giờ VN).
Nghĩa: hình tượng nạp âm (battu_kb.nap_am — nháp AI), ứng dụng ngũ hành dân gian (battu_kb.ngu_hanh).
Đăng ký vào `trang._TRANG` như SEO-G/H/I.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import can_chi as cc
from app.calc import lunar
from app.calc import phongthuy as pt
from app.calc import tietkhi as tk
from app.calc import tuoi_dan_gian as tdg
from app.calc.battu import LUC_HOP, LUC_XUNG

NAM_DAU, NAM_CUOI = 1950, 2025
_TAM_HOP = [("Thân", "Tý", "Thìn"), ("Dần", "Ngọ", "Tuất"), ("Tỵ", "Dậu", "Sửu"), ("Hợi", "Mão", "Mùi")]
_TU_XUNG = [("Tý", "Ngọ", "Mão", "Dậu"), ("Dần", "Thân", "Tỵ", "Hợi"), ("Thìn", "Tuất", "Sửu", "Mùi")]
_PT_DAU, _PT_CUOI = 1960, 2005            # khoảng năm có trang "tuổi X hợp hướng nào" (SEO-F)


def _t():                       # tránh vòng import: trang.py nạp module này ở cuối
    from app.kb import trang
    return trang


def _kb() -> dict:
    return _t()._doc("battu_kb.json")


def _dmy(d: dt.date) -> str:
    return d.strftime("%d/%m/%Y")


def _doi(chi: str, nhom: set) -> str:
    return next(b for p in nhom if chi in p for b in p if b != chi)


_TEN_KIM_LAU = {"than": "Kim lâu Thân", "the": "Kim lâu Thê", "tu": "Kim lâu Tử", "luc_suc": "Kim lâu Lục súc"}


def _nam_dang_chu_y(nam: int, chi: str) -> list[str]:
    """SEO-K: mốc dân gian riêng theo NĂM SINH (tính, không phải lời luận) — năm tuổi, Kim lâu, Tam tai theo tuổi mụ."""
    nam_tuoi = [nam + 12 * k for k in range(1, 8)]
    kl = [(nam + t - 1, t, tdg.kim_lau(t)) for t in range(18, 76) if tdg.kim_lau(t)]
    tt = tdg.tam_tai(chi)
    tam_tai = [n for n in range(nam + 17, nam + 75) if lunar.can_chi_nam(n)[1] in tt]
    nhuan = lunar.thang_nhuan(nam, config.TZ_LICH_AM["viet"])
    tet_sau = dt.date(*reversed(lunar.lunar_to_solar(1, 1, nam + 1, 0, config.TZ_LICH_AM["viet"])))
    return [
        f"Năm âm lịch {nam} kéo dài tới {_dmy(tet_sau - dt.timedelta(days=1))}"
        + (f", có tháng {nhuan} nhuận (13 tháng)." if nhuan else ", không có tháng nhuận (12 tháng)."),
        "Năm tuổi (năm cùng con giáp): " + ", ".join(f"{n} ({n - nam + 1} tuổi mụ)" for n in nam_tuoi) + ".",
        "Năm chạm Kim lâu theo tuổi mụ (dân gian thường tránh làm nhà, cưới hỏi): "
        + ", ".join(f"{n} ({t} tuổi, {_TEN_KIM_LAU[k]})" for n, t, k in kl) + ".",
        f"Năm Tam tai (tuổi {chi} gặp năm {', '.join(tt)}): " + ", ".join(str(n) for n in tam_tai) + ".",
    ]


def ds_menh_nam() -> list[tuple[int, str]]:
    return [(n, f"sinh-nam-{n}-menh-gi") for n in range(NAM_DAU, NAM_CUOI + 1)]


def trang_menh_nam(nam: int, slug: str) -> dict:
    t, kb = _t(), _kb()
    can, chi = lunar.can_chi_nam(nam)
    na = cc.nap_am(can, chi)
    ten, hanh = na["ten"], na["hanh"]
    m = kb["nap_am"][ten]
    nh = kb["ngu_hanh"]
    sinh_ta = next(h for h, x in cc._SINH.items() if x == hanh)
    ta_sinh = cc._SINH[hanh]
    khac_ta = next(h for h, x in cc._KHAC.items() if x == hanh)
    ta_khac = cc._KHAC[hanh]
    tam_hop = next(g for g in _TAM_HOP if chi in g)
    tu_xung = next(g for g in _TU_XUNG if chi in g)
    luc_hop, luc_xung = _doi(chi, LUC_HOP), _doi(chi, LUC_XUNG)
    q_nam, q_nu = pt.menh_quai(nam, "nam"), pt.menh_quai(nam, "nu")
    tet = dt.date(*reversed(lunar.lunar_to_solar(1, 1, nam, 0, config.TZ_LICH_AM["viet"])))
    lx = (tk.thoi_diem(nam, 315) + dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)).date()
    can_t, chi_t = lunar.can_chi_nam(nam - 1)
    na_t = cc.nap_am(can_t, chi_t)

    tra_loi = (f"Người sinh năm {nam} (tuổi {can} {chi}) mệnh {ten} ({na['han']}) — hành {hanh}. "
               f"Hình tượng: {m['hinh_tuong']}. Sinh trước Tết ({_dmy(tet)}) thì tính tuổi {can_t} {chi_t}, "
               f"mệnh {na_t['ten']}.")
    muc = [
        {"tieu_de": f"Mệnh {ten} là gì",
         "doan": f"{ten} nghĩa là {m['hinh_tuong']}. {kb['nap_am_luu_y']}",
         "danh_sach": [f"Nét tích cực: {m['tinh_chat']}.", f"Mặt cần để ý: {m['mat_toi']}."]},
        {"tieu_de": f"Ngũ hành của mệnh {hanh}",
         "danh_sach": [f"{sinh_ta} sinh {hanh} — hành nâng đỡ bản mệnh.", f"{hanh} sinh {ta_sinh} — hành bản mệnh nuôi dưỡng.",
                       f"{khac_ta} khắc {hanh} — hành gây áp lực cho bản mệnh.", f"{hanh} khắc {ta_khac} — hành bản mệnh chế ngự."]},
        {"tieu_de": f"Màu và hướng theo ngũ hành (dân gian)",
         "doan": "Ứng dụng dân gian của ngũ hành, tham khảo khi chọn màu, đồ dùng; không thay cho sở thích và điều kiện thực tế.",
         "danh_sach": [f"Hành {hanh} (bản mệnh): {nh[hanh]['ung_dung']}.", f"Hành {sinh_ta} (sinh bản mệnh): {nh[sinh_ta]['ung_dung']}.",
                       f"Nên dùng vừa phải hành {khac_ta} (khắc bản mệnh): {nh[khac_ta]['ung_dung'].split(';')[0]}."]},
        {"tieu_de": f"Tuổi hợp và tuổi xung với tuổi {chi}",
         "doan": "Theo địa chi năm sinh — quan niệm dân gian về hợp tính, không phải điều kiện để chọn bạn đời hay đối tác.",
         "danh_sach": [f"Tam hợp: {', '.join(tam_hop)}.", f"Lục hợp: {luc_hop}.", f"Lục xung: {luc_xung}.",
                       f"Tứ hành xung: {', '.join(tu_xung)}."]},
        {"tieu_de": f"Cung phi người sinh năm {nam}",
         "doan": "Bát trạch (chọn hướng nhà) dùng cung phi theo năm sinh và giới tính, không dùng mệnh nạp âm.",
         "danh_sach": [f"Nam {nam}: cung {q_nam['quai']} ({q_nam['nhom']}).", f"Nữ {nam}: cung {q_nu['quai']} ({q_nu['nhom']})."]},
        {"tieu_de": f"Sinh đầu năm {nam} thì tính tuổi nào",
         "doan": (f"Năm âm lịch {can} {chi} bắt đầu từ Tết ({_dmy(tet)}, theo âm lịch Việt Nam) — cách tính tuổi và mệnh nạp âm "
                  f"phổ biến. Bát tự và Bát trạch lấy mốc Lập xuân ({_dmy(lx)}). Sinh trước mốc thì thuộc năm {can_t} {chi_t} "
                  f"({nam - 1}), mệnh {na_t['ten']}.")},
        {"tieu_de": f"Những năm đáng chú ý của tuổi {can} {chi} {nam}",
         "doan": ("Mốc theo tập quán dân gian, tính từ năm sinh âm lịch (tuổi mụ = năm xem − năm sinh + 1). Chỉ để tham "
                  "khảo khi chọn thời điểm việc lớn; nhiều gia đình vẫn làm như thường hoặc mượn tuổi."),
         "danh_sach": _nam_dang_chu_y(nam, chi)},
        {"tieu_de": "Câu hỏi tự soi", "doan": m["cau_tu_soi"]},
    ]
    hoi_dap = [
        {"hoi": f"Sinh năm {nam} mệnh gì?", "dap": f"Mệnh {ten} — hành {hanh} (tuổi {can} {chi})."},
        {"hoi": f"Tuổi {can} {chi} hợp màu gì?",
         "dap": f"Theo ứng dụng dân gian: màu của hành {hanh} và hành {sinh_ta} (sinh bản mệnh); dùng vừa phải màu hành {khac_ta}."},
        {"hoi": f"Tuổi {can} {chi} hợp với tuổi nào?",
         "dap": f"Tam hợp {', '.join(x for x in tam_hop if x != chi)}; lục hợp {luc_hop}. Lục xung {luc_xung}. Đây là quan niệm dân gian, chỉ để tham khảo."},
        {"hoi": f"Sinh tháng 1 năm {nam} thì mệnh gì?",
         "dap": f"Trước Tết ({_dmy(tet)}) thì thuộc năm {can_t} {chi_t}, mệnh {na_t['ten']}; từ Tết trở đi là {ten}."},
        {"hoi": f"Mệnh {ten} và cung phi khác nhau thế nào?",
         "dap": f"Mệnh nạp âm ({ten}) dùng chung cho cả nam và nữ; cung phi (nam {q_nam['quai']}, nữ {q_nu['quai']}) dùng chọn hướng nhà."},
    ]
    # SEO-K: trang tuổi hợp hướng gộp nam + nữ một trang (308 từ bản -nam/-nu).
    lien_ket = ([{"duong": f"/phong-thuy/huong-hop-tuoi/tuoi-{nam}", "ten": f"Tuổi {can} {chi} {nam} hợp hướng nào"}]
                if _PT_DAU <= nam <= _PT_CUOI else [])
    ln = [n for n in (nam - 1, nam + 1) if NAM_DAU <= n <= NAM_CUOI]
    return {
        "loai": "menh_nam", "slug": slug,
        "tieu_de": f"Sinh năm {nam} mệnh gì? Tuổi {can} {chi}, mệnh {ten}",
        "mo_ta": t._cat(f"Sinh năm {nam} tuổi {can} {chi}, mệnh {ten} (hành {hanh}): ý nghĩa, màu hợp, tuổi hợp – xung, cung phi nam nữ."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [kb["source"].get("uyen_hai_tu_binh", "Uyên Hải Tử Bình"),
                  "Nạp âm 60 hoa giáp, can chi năm theo âm lịch Hồ Ngọc Đức (Việt Nam); Lập xuân theo tiết khí (giờ Việt Nam).",
                  "Hình tượng nạp âm và ứng dụng ngũ hành: bản nháp tổng hợp quan niệm phổ thông."],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        # KH-BL: link sang trang nạp âm của chính mệnh này (/bat-tu/nap-am/{slug}) — liên kết hai chiều trong silo.
        "lien_quan": ([{"loai": "menh_nam", "slug": f"sinh-nam-{n}-menh-gi"} for n in ln]
                      + [{"loai": "nap_am", "slug": t._slug(ten)}]),
        "lien_ket_ngoai": lien_ket,
        "minh_hoa": {"kieu": "menh", "hanh": hanh, "nap_am": ten, "han": na["han"], "can_chi": f"{can} {chi}"},
    }


TRANG = {"menh_nam": (ds_menh_nam, trang_menh_nam)}
TEN_NGAN = {"menh_nam": lambda n: f"Sinh năm {n} mệnh gì"}
