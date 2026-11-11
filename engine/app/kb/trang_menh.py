# -*- coding: utf-8 -*-
"""SEO-J — 78 trang "Sinh năm X mệnh gì" (1950–2027; NAM-1 thêm 2026–2027), dựng từ CALC + KB (chỉ ĐỌC + GHÉP, không sinh nghĩa mới).

Dữ kiện TÍNH: can chi năm (lunar.can_chi_nam), mệnh nạp âm (can_chi.nap_am), ngũ hành sinh/khắc (can_chi),
tam hợp / lục hợp / lục xung / tứ hành xung theo địa chi năm, cung phi nam–nữ (calc/phongthuy), mốc đầu năm:
Tết âm lịch Việt Nam (lịch Hồ Ngọc Đức UTC+7) và Lập xuân (tiết khí, giờ VN).
Nghĩa: hình tượng nạp âm (battu_kb.nap_am — nháp AI), ứng dụng ngũ hành dân gian (battu_kb.ngu_hanh).
Đăng ký vào `trang._TRANG` như SEO-G/H/I.
"""
from __future__ import annotations

from app import ngon_ngu

import datetime as dt

from app import config
from app.calc import can_chi as cc
from app.calc import lunar
from app.calc import phongthuy as pt
from app.calc import tietkhi as tk
from app.calc import tuoi_dan_gian as tdg
from app.calc.battu import LUC_HOP, LUC_XUNG
from app.kb import ten as _tn
from app.kb.loi import L

NAM_DAU, NAM_CUOI = 1950, 2027      # NAM-1 (2026-10-30): thêm 2026, 2027 — "sinh năm 2027 mệnh gì"
_TAM_HOP = [("Thân", "Tý", "Thìn"), ("Dần", "Ngọ", "Tuất"), ("Tỵ", "Dậu", "Sửu"), ("Hợi", "Mão", "Mùi")]
_TU_XUNG = [("Tý", "Ngọ", "Mão", "Dậu"), ("Dần", "Thân", "Tỵ", "Hợi"), ("Thìn", "Tuất", "Sửu", "Mùi")]
_PT_DAU, _PT_CUOI = 1960, 2005            # khoảng năm có trang "tuổi X hợp hướng nào" (SEO-F)


def _t():                       # tránh vòng import: trang.py nạp module này ở cuối
    from app.kb import trang
    return trang


def _kb() -> dict:
    return _t()._doc("battu_kb.json")


def _dmy(d: dt.date) -> str:
    if ngon_ngu.la_viet():
        return d.strftime("%d/%m/%Y")
    return f"{d.day} {L(f'trang_bt.thang.{d.month}', str(d.month))} {d.year}"   # EN-ALL: "6 February 2027"


def _doi(chi: str, nhom: set) -> str:
    return next(b for p in nhom if chi in p for b in p if b != chi)


# EN-ALL GĐ 3: tên riêng hiển thị theo ngôn ngữ (tiếng Việt trả nguyên chữ — kb/ten).
def _can(c: str) -> str:
    return _tn.ten("can", c)


def _chi(c: str) -> str:
    """Địa chi: bản Việt nguyên chữ; bản Anh tên con giáp ("Dragon") — người đọc tiếng Anh quen con giáp hơn pinyin."""
    return c if ngon_ngu.la_viet() else (_tn.nghia("chi", c) or _tn.ten("chi", c))


def _cc(can: str, chi: str) -> str:
    return f"{can} {chi}" if ngon_ngu.la_viet() else f"{_can(can)} {_tn.ten('chi', chi)}"


def _ds(xs) -> str:
    return ", ".join(xs)


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
        L("trang_bt.mn.nam_am", "Năm âm lịch {nam} kéo dài tới {ngay}", nam=nam, ngay=_dmy(tet_sau - dt.timedelta(days=1)))
        + (L("trang_bt.mn.co_nhuan", ", có tháng {n} nhuận (13 tháng).", n=nhuan) if nhuan
           else L("trang_bt.mn.khong_nhuan", ", không có tháng nhuận (12 tháng).")),
        L("trang_bt.mn.nam_tuoi", "Năm tuổi (năm cùng con giáp): ") + ", ".join(
            L("trang_bt.mn.nam_tuoi_1", "{n} ({t} tuổi mụ)", n=n, t=n - nam + 1) for n in nam_tuoi) + ".",
        L("trang_bt.mn.kim_lau", "Năm chạm Kim lâu theo tuổi mụ (dân gian thường tránh làm nhà; cưới hỏi thì Kim lâu chỉ "
                                 "xét tuổi cô dâu): ")
        + ", ".join(L("trang_bt.mn.kim_lau_1", "{n} ({t} tuổi, {kl})", n=n, t=t,
                      kl=L(f"trang_bt.mn.kl.{k}", _TEN_KIM_LAU[k])) for n, t, k in kl) + ".",
        L("trang_bt.mn.tam_tai", "Năm Tam tai (tuổi {chi} gặp năm {tt}): ", chi=_chi(chi), tt=_ds(_chi(x) for x in tt))
        + ", ".join(str(n) for n in tam_tai) + ".",
    ]


_THU_TU_CAT = ("Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị")


def _huong_tot(q: dict) -> list[str]:
    """Bốn hướng tốt (Bát trạch) của cung phi, từ tốt nhất: Sinh Khí → Thiên Y → Diên Niên → Phục Vị."""
    b = pt.bang_huong(q["quai"])
    return sorted([h for h in b if b[h] in _THU_TU_CAT], key=lambda h: _THU_TU_CAT.index(b[h]))


def _sinh_khi(q: dict) -> str:
    return _tn.ten("huong", _huong_tot(q)[0])


def _huong_tot_hien(q: dict) -> str:
    return ", ".join(_tn.ten("huong", h) for h in _huong_tot(q))


@ngon_ngu.theo_viet
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

    # Chữ hiển thị (bản Việt = nguyên chữ). `tc` = "Giáp Thìn" / "Jia Chen"; `con` = con giáp ("Thìn" / "Dragon").
    tc, con, tc_t, con_t = _cc(can, chi), _chi(chi), _cc(can_t, chi_t), _chi(chi_t)
    tna, tna_t = _tn.ten("nap_am", ten), _tn.ten("nap_am", na_t["ten"])
    H = {x: _tn.ten("hanh", x) for x in (hanh, sinh_ta, ta_sinh, khac_ta, ta_khac)}
    qn, qu = _tn.ten("quai", q_nam["quai"]), _tn.ten("quai", q_nu["quai"])
    nn, nu_ = _tn.ten("nhom_trach", q_nam["nhom"]), _tn.ten("nhom_trach", q_nu["nhom"])
    tet_s, lx_s = _dmy(tet), _dmy(lx)

    tra_loi = L("trang_bt.mn.tra_loi",
                "Người sinh năm {nam} (tuổi {can} {chi}) mệnh {ten} ({han}) — hành {hanh}. Hình tượng: {ht}. Sinh trước Tết "
                "({tet}) thì tính tuổi {can_t} {chi_t}, mệnh {ten_t}.",
                nam=nam, can=can, chi=chi, tc=tc, con=con, ten=tna, han=na["han"], hanh=H[hanh], ht=m["hinh_tuong"],
                tet=tet_s, can_t=can_t, chi_t=chi_t, tc_t=tc_t, con_t=con_t, ten_t=tna_t)
    muc = [
        {"tieu_de": L("trang_bt.mn.la_gi", "Mệnh {ten} là gì", ten=tna),
         "doan": L("trang_bt.mn.la_gi_doan", "{ten} nghĩa là {ht}. {luu_y}", ten=tna, ht=m["hinh_tuong"], luu_y=kb["nap_am_luu_y"]),
         "danh_sach": [L("trang_bt.mn.tich_cuc", "Nét tích cực: {x}.", x=m["tinh_chat"]),
                       L("trang_bt.mn.de_y", "Mặt cần để ý: {x}.", x=m["mat_toi"])]},
        {"tieu_de": L("trang_bt.mn.ngu_hanh", "Ngũ hành của mệnh {hanh}", hanh=H[hanh]),
         "danh_sach": [L("trang_bt.mn.sinh_ta", "{a} sinh {b} — hành nâng đỡ bản mệnh.", a=H[sinh_ta], b=H[hanh]),
                       L("trang_bt.mn.ta_sinh", "{a} sinh {b} — hành bản mệnh nuôi dưỡng.", a=H[hanh], b=H[ta_sinh]),
                       L("trang_bt.mn.khac_ta", "{a} khắc {b} — hành gây áp lực cho bản mệnh.", a=H[khac_ta], b=H[hanh]),
                       L("trang_bt.mn.ta_khac", "{a} khắc {b} — hành bản mệnh chế ngự.", a=H[hanh], b=H[ta_khac])]},
        # 6b-3 (2026-11-04): BỎ hướng theo ngũ hành (Mộc → Đông…) — hướng nhà theo Bát trạch đi theo cung phi nam/nữ, có
        # thể ngược hẳn (nữ 1981 cung Cấn: Đông là Lục Sát). Hướng chỉ nêu ở mục Cung phi bên dưới.
        {"tieu_de": L("trang_bt.mn.mau_nghe", "Màu và nhóm nghề theo ngũ hành (dân gian)"),
         "doan": L("trang_bt.mn.mau_nghe_doan",
                   "Ứng dụng dân gian của ngũ hành, tham khảo khi chọn màu, đồ dùng; không thay cho sở thích và điều kiện thực "
                   "tế. Hướng nhà không chọn theo mệnh nạp âm — xem mục Cung phi bên dưới."),
         "danh_sach": [L("trang_bt.mn.mau_ban", "Hành {h} (bản mệnh): màu {mau}; nhóm nghề {nghe}.",
                         h=H[hanh], mau=nh[hanh]["mau"], nghe=nh[hanh]["nghe"]),
                       L("trang_bt.mn.mau_sinh", "Hành {h} (sinh bản mệnh): màu {mau}; nhóm nghề {nghe}.",
                         h=H[sinh_ta], mau=nh[sinh_ta]["mau"], nghe=nh[sinh_ta]["nghe"]),
                       L("trang_bt.mn.mau_khac", "Nên dùng vừa phải hành {h} (khắc bản mệnh): màu {mau}.",
                         h=H[khac_ta], mau=nh[khac_ta]["mau"])]},
        {"tieu_de": L("trang_bt.mn.hop_xung", "Tuổi hợp và tuổi xung với tuổi {chi}", chi=con),
         "doan": L("trang_bt.mn.hop_xung_doan",
                   "Theo địa chi năm sinh — quan niệm dân gian về hợp tính, không phải điều kiện để chọn bạn đời hay đối tác."),
         "danh_sach": [L("trang_bt.mn.tam_hop", "Tam hợp: {x}.", x=_ds(_chi(x) for x in tam_hop)),
                       L("trang_bt.mn.luc_hop", "Lục hợp: {x}.", x=_chi(luc_hop)),
                       L("trang_bt.mn.luc_xung", "Lục xung: {x}.", x=_chi(luc_xung)),
                       L("trang_bt.mn.tu_xung", "Tứ hành xung: {x}.", x=_ds(_chi(x) for x in tu_xung))]},
        {"tieu_de": L("trang_bt.mn.cung_phi", "Cung phi và hướng hợp người sinh năm {nam}", nam=nam),
         "doan": L("trang_bt.mn.cung_phi_doan",
                   "Bát trạch (chọn hướng nhà, hướng giường, bàn) dùng cung phi theo năm sinh và giới tính, không dùng mệnh nạp "
                   "âm — nên nam và nữ cùng năm có thể hợp hai hướng khác hẳn nhau."),
         "danh_sach": [L("trang_bt.mn.cung_nam",
                         "Nam {nam}: cung {quai} ({nhom}), hướng tốt nhất {huong}; bốn hướng tốt: {bon}.",
                         nam=nam, quai=qn, so=q_nam["so"], nhom=nn, huong=_sinh_khi(q_nam), bon=_huong_tot_hien(q_nam)),
                       L("trang_bt.mn.cung_nu",
                         "Nữ {nam}: cung {quai} ({nhom}), hướng tốt nhất {huong}; bốn hướng tốt: {bon}.",
                         nam=nam, quai=qu, so=q_nu["so"], nhom=nu_, huong=_sinh_khi(q_nu), bon=_huong_tot_hien(q_nu))]},
        {"tieu_de": L("trang_bt.mn.dau_nam", "Sinh đầu năm {nam} thì tính tuổi nào", nam=nam),
         "doan": L("trang_bt.mn.dau_nam_doan",
                   "Năm âm lịch {can} {chi} bắt đầu từ Tết ({tet}, theo âm lịch Việt Nam) — cách tính tuổi và mệnh nạp âm "
                   "phổ biến. Bát tự và Bát trạch lấy mốc Lập xuân ({lx}). Sinh trước mốc thì thuộc năm {can_t} {chi_t} "
                   "({nam_t}), mệnh {ten_t}.",
                   can=can, chi=chi, tc=tc, con=con, tet=tet_s, lx=lx_s, can_t=can_t, chi_t=chi_t, tc_t=tc_t, con_t=con_t,
                   nam_t=nam - 1, ten_t=tna_t)},
        {"tieu_de": L("trang_bt.mn.chu_y", "Những năm đáng chú ý của tuổi {can} {chi} {nam}", can=can, chi=chi, tc=tc,
                      con=con, nam=nam),
         "doan": L("trang_bt.mn.chu_y_doan",
                   "Mốc theo tập quán dân gian, tính từ năm sinh âm lịch (tuổi mụ = năm xem − năm sinh + 1). Chỉ để tham "
                   "khảo khi chọn thời điểm việc lớn; nhiều gia đình vẫn làm như thường hoặc mượn tuổi."),
         "danh_sach": _nam_dang_chu_y(nam, chi)},
        {"tieu_de": L("trang.tu_soi", "Câu hỏi tự soi"), "doan": m["cau_tu_soi"]},
    ]
    hoi_dap = [
        {"hoi": L("trang_bt.mn.h1", "Sinh năm {nam} mệnh gì?", nam=nam),
         "dap": L("trang_bt.mn.d1", "Mệnh {ten} — hành {hanh} (tuổi {can} {chi}).", ten=tna, hanh=H[hanh], can=can, chi=chi,
                  tc=tc, con=con, nam=nam)},
        {"hoi": L("trang_bt.mn.h2", "Tuổi {can} {chi} hợp màu gì?", can=can, chi=chi, tc=tc, con=con, nam=nam),
         "dap": L("trang_bt.mn.d2", "Theo ứng dụng dân gian: màu của hành {a} và hành {b} (sinh bản mệnh); dùng vừa phải màu "
                  "hành {c}.", a=H[hanh], b=H[sinh_ta], c=H[khac_ta])},
        {"hoi": L("trang_bt.mn.h3", "Tuổi {can} {chi} hợp với tuổi nào?", can=can, chi=chi, tc=tc, con=con, nam=nam),
         "dap": L("trang_bt.mn.d3", "Tam hợp {th}; lục hợp {lh}. Lục xung {lx}. Đây là quan niệm dân gian, chỉ để tham khảo.",
                  th=_ds(_chi(x) for x in tam_hop if x != chi), lh=_chi(luc_hop), lx=_chi(luc_xung))},
        {"hoi": L("trang_bt.mn.h4", "Sinh tháng 1 năm {nam} thì mệnh gì?", nam=nam),
         "dap": L("trang_bt.mn.d4", "Trước Tết ({tet}) thì thuộc năm {can_t} {chi_t}, mệnh {ten_t}; từ Tết trở đi là {ten}.",
                  tet=tet_s, can_t=can_t, chi_t=chi_t, tc_t=tc_t, con_t=con_t, ten_t=tna_t, ten=tna, nam_t=nam - 1)},
        {"hoi": L("trang_bt.mn.h5", "Người sinh năm {nam} hợp hướng nhà nào?", nam=nam),
         "dap": L("trang_bt.mn.d5", "Theo Bát trạch, hướng nhà đi theo cung phi chứ không theo mệnh {ten}: nam {nam} cung "
                  "{qn} hợp nhất hướng {hn}, nữ {nam} cung {qu} hợp nhất hướng {hu}.",
                  ten=tna, nam=nam, qn=qn, hn=_sinh_khi(q_nam), qu=qu, hu=_sinh_khi(q_nu), so_n=q_nam["so"], so_u=q_nu["so"])},
        {"hoi": L("trang_bt.mn.h6", "Mệnh {ten} và cung phi khác nhau thế nào?", ten=tna),
         "dap": L("trang_bt.mn.d6", "Mệnh nạp âm ({ten}) dùng chung cho cả nam và nữ; cung phi (nam {qn}, nữ {qu}) dùng chọn "
                  "hướng nhà.", ten=tna, qn=qn, qu=qu, so_n=q_nam["so"], so_u=q_nu["so"])},
    ]
    # AUD-Q2: trang hướng hợp tuổi gộp theo CUNG PHI → link sang trang cung của nam và của nữ (năm dùng Lập xuân như trang
    # cung; 1960–2005 như bảng mục lục).
    from app.luangiai import phongthuy_tuoi as _pt_tuoi
    lien_ket = ([{"duong": f"/phong-thuy/huong-hop-tuoi/{_pt_tuoi.CUNG_SLUG[q['quai']]}",
                  "ten": L(f"trang_bt.mn.lk_{ma}", "{gt} sinh năm {nam} cung {quai} hợp hướng nào", gt=gt, nam=nam,
                           quai=_tn.ten("quai", q["quai"]), so=q["so"])}
                 for ma, gt, q in (("nam", "Nam", q_nam), ("nu", "Nữ", q_nu))]
                if _PT_DAU <= nam <= _PT_CUOI else [])
    ln = [n for n in (nam - 1, nam + 1) if NAM_DAU <= n <= NAM_CUOI]
    src = kb["source"].get("uyen_hai_tu_binh", "Uyên Hải Tử Bình")
    return {
        "loai": "menh_nam", "slug": slug,
        "tieu_de": L("trang_bt.mn.tieu_de", "Sinh năm {nam} mệnh gì? Tuổi {can} {chi}, mệnh {ten}", nam=nam, can=can, chi=chi,
                     tc=tc, con=con, ten=tna),
        "mo_ta": t._cat(L("trang_bt.mn.mo_ta", "Sinh năm {nam} tuổi {can} {chi}, mệnh {ten} (hành {hanh}): ý nghĩa, màu hợp, "
                          "tuổi hợp – xung, cung phi nam nữ.", nam=nam, can=can, chi=chi, tc=tc, con=con, ten=tna, hanh=H[hanh])),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [src if ngon_ngu.la_viet() else L("trang_bt.mn.nguon_uhtb", src, han=src),
                  L("trang_bt.mn.nguon_lich", "Nạp âm 60 hoa giáp, can chi năm theo âm lịch Hồ Ngọc Đức (Việt Nam); Lập xuân "
                    "theo tiết khí (giờ Việt Nam)."),
                  L("trang_bt.mn.nguon_y", "Hình tượng nạp âm và ứng dụng ngũ hành: bản nháp tổng hợp quan niệm phổ thông.")],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "menh_nam", "slug": f"sinh-nam-{n}-menh-gi"} for n in ln],
        "lien_ket_ngoai": lien_ket,
        "minh_hoa": {"kieu": "menh", "hanh": hanh, "nap_am": ten, "han": na["han"], "can_chi": tc},
    }


TRANG = {"menh_nam": (ds_menh_nam, trang_menh_nam)}
TEN_NGAN = {"menh_nam": lambda n: L("trang_bt.ten_ngan.menh_nam", "Sinh năm {n} mệnh gì", n=n)}
