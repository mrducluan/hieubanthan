# -*- coding: utf-8 -*-
"""KH-BL đợt 1 (2026-10-29, docs/KE-HOACH-BACKLINK-VA-KHO-TRI-THUC.md) — ba cụm trang kiến thức silo Bát tự, dựng từ
CALC + KB (chỉ ĐỌC + GHÉP, không sinh nghĩa mới):

- `nap_am`  /bat-tu/nap-am/{slug}: 30 mệnh nạp âm — chữ Hán trong tên (KB lich_kb.chu_nap_am), hình tượng (battu_kb.nap_am),
  hai can chi, bảng năm sinh 1900–2100 kèm mốc Tết (lịch Việt UTC+7), sinh khắc ngũ hành, các nạp âm cùng hành.
- `tiet_khi` /bat-tu/tiet-khi/{slug}: 24 tiết khí — kinh độ Mặt Trời, thời điểm giao tiết giờ Việt Nam 2024–2030
  (calc/tietkhi), tháng Bát tự, 3 hậu (Nguyệt lệnh), đặc điểm và đời sống (KB lich_kb.tiet_khi).
- `con_giap_nam` /bat-tu/con-giap-nam/tuoi-{chi}-nam-{năm}: 12 con giáp trong năm xem — quan hệ địa chi tuổi với năm,
  Tam tai, bảng từng năm sinh (can chi, nạp âm, tuổi mụ, Kim lâu, Hoang ốc) theo tuổi mụ âm lịch Việt.

Tục lệ luôn ghi "theo quan niệm dân gian, để tham khảo"; không phán vận, không giải hạn. Đăng ký vào `trang._TRANG`.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import can_chi as cc
from app.calc import lunar
from app.calc import tietkhi as tk
from app.calc import tuoi_dan_gian as tdg

NAM_TK = range(2024, 2031)          # năm hiện trên bảng giờ giao tiết (cố định → nội dung tất định)
NAM_CG = (2027,)                    # năm xem của cụm 12 con giáp (thêm năm mới = thêm vào đây)
NAM_SINH_CG = range(1948, 2024)     # năm sinh liệt kê trong bảng con giáp
_NAM_NA = range(1900, 2101)         # năm sinh liệt kê trong bảng nạp âm
_MENH_DAU, _MENH_CUOI = 1950, 2025  # khoảng có trang "sinh năm X mệnh gì"
_LAM_NHA = (1960, 2005)             # khoảng có trang tuổi làm nhà / xông đất theo năm sinh
_TZ = config.TZ_LICH_AM["viet"]


def _t():                       # tránh vòng import: trang.py nạp module này ở cuối
    from app.kb import trang
    return trang


def _lk() -> dict:
    return _t()._doc("lich_kb.json")


def _bt() -> dict:
    return _t()._doc("battu_kb.json")


def _tdg() -> dict:
    return _t()._doc("tuoi_dan_gian_kb.json")


def _dmy(d: dt.date) -> str:
    return d.strftime("%d/%m/%Y")


def _tet(nam: int) -> dt.date:
    return dt.date(*reversed(lunar.lunar_to_solar(1, 1, nam, 0, _TZ)))


def _hanh(h: str) -> str:            # giữ đúng chữ của calc ("Hỏa", "Thủy") như trang mệnh theo năm — một kiểu trong cụm
    return h


# ---- 30 nạp âm ------------------------------------------------------------------------------------------------------
def _cap_na() -> list[tuple[str, str, str, str, str]]:
    """(tên, hành, chữ Hán, can chi 1, can chi 2) theo thứ tự hoa giáp."""
    ra = []
    for i, (ten, hanh, han) in enumerate(cc._NAP_AM):
        a, b = 2 * i, 2 * i + 1
        ra.append((ten, hanh, han, f"{cc.CAN[a % 10]} {cc.CHI[a % 12]}", f"{cc.CAN[b % 10]} {cc.CHI[b % 12]}"))
    return ra


def ds_nap_am() -> list[tuple[str, str]]:
    return [(ten, _t()._slug(ten)) for ten, *_ in _cap_na()]


def trang_nap_am(ten: str, slug: str) -> dict:
    t, kb, lk = _t(), _bt(), _lk()
    cap = _cap_na()
    i = [x[0] for x in cap].index(ten)
    _, hanh_c, han, cc1, cc2 = cap[i]
    hanh = _hanh(hanh_c)
    m = kb["nap_am"][ten]
    nh = kb["ngu_hanh"][hanh_c] if hanh_c in kb["ngu_hanh"] else kb["ngu_hanh"][hanh]
    nam = [n for n in _NAM_NA if " ".join(lunar.can_chi_nam(n)) in (cc1, cc2)]
    sinh_ta = _hanh(next(h for h, x in cc._SINH.items() if x == hanh_c))
    ta_sinh, khac_ta = _hanh(cc._SINH[hanh_c]), _hanh(next(h for h, x in cc._KHAC.items() if x == hanh_c))
    ta_khac = _hanh(cc._KHAC[hanh_c])
    chu = [(c, *lk["chu_nap_am"][c]) for c in han if c in lk["chu_nap_am"]]
    gan = [n for n in nam if 1940 <= n <= 2040]
    nam_ds = ", ".join(str(n) for n in gan)

    tra_loi = (f"{ten} ({han}) là mệnh nạp âm hành {hanh}; từng chữ nghĩa là "
               + " – ".join(x[2].split(",")[0] for x in chu) + f", hình tượng {m['hinh_tuong']}. Đây là mệnh của hai năm {cc1} và {cc2}; "
               f"người sinh các năm {nam_ds} (tính theo Tết âm lịch) mang mệnh {ten}.")
    bang = {"cot": ["Năm sinh", "Can chi", "Bắt đầu (Tết)", "Kết thúc"],
            "dong": [[str(n), " ".join(lunar.can_chi_nam(n)), _dmy(_tet(n)), _dmy(_tet(n + 1) - dt.timedelta(days=1))]
                     for n in nam]}
    cung_hanh = [x for x in cap if x[1] == hanh_c and x[0] != ten]
    muc = [
        {"tieu_de": f"Tên {ten} nghĩa là gì",
         "doan": f"Tên gồm {len(chu)} chữ Hán {han}: " + "; ".join(f"{c} ({hv}) là {ng}" for c, hv, ng in chu)
                 + f". Ghép lại thành hình ảnh {m['hinh_tuong']}. {kb['nap_am_luu_y']}"},
        {"tieu_de": f"Sinh năm nào mệnh {ten}",
         "doan": (f"Mệnh {ten} lặp lại 60 năm một lần, ứng với hai năm liền nhau {cc1} và {cc2}. Năm âm lịch bắt đầu từ "
                  "Tết (âm lịch Việt Nam), nên người sinh tháng 1 hoặc đầu tháng 2 dương lịch cần so với ngày Tết của năm đó."),
         "bang": bang},
        {"tieu_de": f"Tính chất và mặt cần để ý",
         "danh_sach": [f"Nét tích cực theo hình tượng: {m['tinh_chat']}.", f"Mặt cần để ý: {m['mat_toi']}.",
                       f"Câu tự soi: {m['cau_tu_soi']}"]},
        {"tieu_de": f"Hành {hanh} sinh khắc thế nào",
         "danh_sach": [f"{sinh_ta} sinh {hanh}: hành nâng đỡ.", f"{hanh} sinh {ta_sinh}: hành mệnh này nuôi dưỡng.",
                       f"{khac_ta} khắc {hanh}: hành gây áp lực.", f"{hanh} khắc {ta_khac}: hành mệnh này chế ngự.",
                       f"Ứng dụng dân gian của hành {hanh}: {nh['ung_dung']}."]},
        {"tieu_de": f"Các nạp âm khác cùng hành {hanh}",
         "doan": ("Cùng một hành nhưng mỗi nạp âm là một hình ảnh riêng (lửa trên trời khác lửa trong lò, nước biển khác "
                  "nước giếng), nên sách nạp âm khi bàn hợp – khắc còn xét hình tượng chứ không chỉ so hành."),
         "danh_sach": [f"{x[0]} ({x[3]}, {x[4]}): {kb['nap_am'][x[0]]['hinh_tuong']}." for x in cung_hanh]},
    ]
    hoi_dap = [
        {"hoi": f"{ten} là mệnh gì?", "dap": f"{ten} là mệnh hành {hanh} trong nạp âm 60 hoa giáp, hình tượng {m['hinh_tuong']}."},
        {"hoi": f"Sinh năm nào thì mệnh {ten}?",
         "dap": f"Các năm {cc1} và {cc2}: " + ", ".join(str(n) for n in nam) + " — tính theo năm âm lịch (từ Tết)."},
        {"hoi": f"Mệnh {ten} hợp màu gì?",
         "dap": f"Theo ứng dụng dân gian: màu của hành {hanh} và hành {sinh_ta} (hành sinh ra {hanh}). Chỉ để tham khảo."},
        {"hoi": f"Mệnh {ten} tốt hay xấu?",
         "dap": "Nạp âm không xếp tốt xấu. Đây là hình tượng để tự soi tính cách, không dùng để kết luận số phận hay chọn bạn đời."},
    ]
    lien = [f"sinh-nam-{n}-menh-gi" for n in gan if _MENH_DAU <= n <= _MENH_CUOI]
    ds = ds_nap_am()
    return {
        "loai": "nap_am", "slug": slug,
        "tieu_de": f"{ten} là mệnh gì? Sinh năm nào, ý nghĩa {han}",
        "mo_ta": t._cat(f"{ten} ({han}) — mệnh nạp âm hành {hanh} của năm {cc1}, {cc2}: nghĩa từng chữ, năm sinh {nam_ds}, "
                        "tính chất, sinh khắc ngũ hành."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [lk["source"]["thong_hoi"], kb["source"].get("uyen_hai_tu_binh", "Uyên Hải Tử Bình"),
                  "Can chi năm theo âm lịch Việt Nam (UTC+7)."],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": ([{"loai": "menh_nam", "slug": s} for s in lien[:4]]
                      + [{"loai": "nap_am", "slug": ds[(i + d) % 30][1]} for d in (-1, 1)]),
        "lien_ket_ngoai": [{"duong": "/bat-tu", "ten": "Lập tứ trụ Bát tự từ ngày giờ sinh"}],
        "minh_hoa": {"kieu": "menh", "hanh": hanh_c, "nap_am": ten, "han": han, "can_chi": f"{cc1} · {cc2}"},
    }


# ---- 24 tiết khí ----------------------------------------------------------------------------------------------------
def _tk_thu_tu() -> list[str]:
    """Theo thứ tự trong năm Bát tự: Lập xuân → Đại hàn."""
    kb = _lk()["tiet_khi"]
    return sorted(kb, key=lambda k: (kb[k]["kinh_do"] - 315) % 360)


def ds_tiet_khi() -> list[tuple[str, str]]:
    kb = _lk()["tiet_khi"]
    return [(k, _t()._slug(kb[k]["ten"])) for k in _tk_thu_tu()]


_THANG_AM = {1: "Giêng", 12: "Chạp"}


def _gio_vn(nam: int, kd: int) -> dt.datetime:
    return tk.thoi_diem(nam, kd) + dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)


def trang_tiet_khi(ma: str, slug: str) -> dict:
    t, lk = _t(), _lk()
    kb = lk["tiet_khi"]
    m = kb[ma]
    thu = _tk_thu_tu()
    i = thu.index(ma)
    kd = m["kinh_do"]
    sau = kb[thu[(i + 1) % 24]]
    gio = [(n, _gio_vn(n, kd)) for n in NAM_TK]
    g27 = dict(gio)[2027]
    am = lunar.solar_to_lunar(g27.day, g27.month, g27.year, _TZ)
    la_tiet = m["loai"] == "tiet"
    ten = m["ten"]

    tra_loi = (f"{ten} ({m['han']}) là tiết khí thứ {i + 1} trong năm, khi Mặt Trời ở kinh độ hoàng đạo {kd}°. "
               f"{m['nghia_ten']} Năm 2027, {ten} bắt đầu lúc {g27:%H:%M} ngày {_dmy(g27.date())} (giờ Việt Nam) và kéo dài "
               f"khoảng 15 ngày tới {sau['ten']}.")
    muc = [
        {"tieu_de": f"{ten} nghĩa là gì", "doan": f"{m['nghia_ten']} {m['dac_diem']}"},
        {"tieu_de": f"Ngày giờ {ten} các năm {NAM_TK[0]}–{NAM_TK[-1]}",
         "doan": ("Thời điểm Mặt Trời đi tới kinh độ {kd}°, tính theo giờ Việt Nam (UTC+7) nên có năm lệch một ngày so với "
                  "lịch in theo giờ Bắc Kinh.").format(kd=kd),
         "bang": {"cot": ["Năm", "Giờ giao tiết", "Ngày dương lịch", "Thứ"],
                  "dong": [[str(n), f"{g:%H:%M}", _dmy(g.date()), ("Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu",
                                                                  "Thứ Bảy", "Chủ nhật")[g.weekday()]] for n, g in gio]}},
        {"tieu_de": "Vị trí trong lịch và trong Bát tự",
         "danh_sach": [
             (f"{ten} là một \"tiết\" (tiết lệnh): mở đầu tháng {m['thang']} theo tiết khí. Bát tự, phong thuỷ và hoàng lịch "
              f"đổi tháng ở thời điểm này, không đổi ở mùng 1 âm lịch." if la_tiet else
              f"{ten} là một \"khí\" (trung khí) nằm giữa tháng {m['thang']} theo tiết khí; tháng Bát tự không đổi ở đây."),
             f"Năm 2027, {ten} rơi vào ngày {am[0]} tháng {_THANG_AM.get(am[1], am[1])}{' nhuận' if am[3] else ''} âm lịch (năm {' '.join(lunar.can_chi_nam(am[2]))}).",
             f"Tiết khí trước: {kb[thu[i - 1]]['ten']}; tiết khí sau: {sau['ten']}.",
         ]},
        {"tieu_de": "Ba hậu của tiết " + ten,
         "doan": ("Sách Lễ ký · Nguyệt lệnh chia mỗi tiết khí thành ba \"hậu\", mỗi hậu khoảng 5 ngày, đặt tên theo hiện tượng "
                  "tự nhiên người xưa quan sát được."),
         "danh_sach": [f"Hậu {k + 1}: {h} — {n}." for k, (h, n) in enumerate(m["hau"])]},
        {"tieu_de": "Trong đời sống", "doan": f"{m['doi_song']} {lk['tiet_khi_luu_y']}"},
    ]
    hoi_dap = [
        {"hoi": f"{ten} là gì?", "dap": f"{ten} ({m['han']}) là tiết khí ở kinh độ Mặt Trời {kd}°. {m['nghia_ten']}"},
        {"hoi": f"{ten} năm 2027 vào ngày nào?",
         "dap": f"Lúc {g27:%H:%M} ngày {_dmy(g27.date())} theo giờ Việt Nam (khoảng ngày {am[0]}/{am[1]} âm lịch)."},
        {"hoi": f"{ten} có phải là ngày đổi tháng trong Bát tự không?",
         "dap": (f"Có. {ten} mở đầu tháng {m['thang']}; người sinh sau thời điểm giao tiết thuộc tháng {m['thang']}." if la_tiet
                 else f"Không. {ten} là trung khí, tháng Bát tự ({m['thang']}) đã bắt đầu từ tiết trước đó.")},
    ]
    ds = ds_tiet_khi()
    return {
        "loai": "tiet_khi", "slug": slug,
        "tieu_de": f"Tiết {ten} ({m['han']}) là gì? Ngày giờ {ten} 2024–2030",
        "mo_ta": t._cat(f"Tiết {ten}: ý nghĩa, ngày giờ giao tiết theo giờ Việt Nam 2024–2030, vị trí trong tháng Bát tự, "
                        "ba hậu theo Nguyệt lệnh và đời sống."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [lk["source"]["nguyet_lenh"], lk["source"]["dan_gian"],
                  "Thời điểm giao tiết tính theo kinh độ Mặt Trời, giờ Việt Nam (UTC+7)."],
        "trang_thai": lk.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "tiet_khi", "slug": ds[(i + d) % 24][1]} for d in (-1, 1)],
        "lien_ket_ngoai": [{"duong": "/lich-am/2027", "ten": "Lịch âm 2027"},
                           {"duong": "/xem-ngay-tot", "ten": "Xem ngày tốt theo hoàng lịch"}],
        "minh_hoa": {"kieu": "tiet_khi", "kinh_do": kd, "ten": ten, "tiet": la_tiet},
    }


# ---- 12 con giáp trong năm xem --------------------------------------------------------------------------------------
def _slug_chi(chi: str) -> str:
    """Tý và Tỵ bỏ dấu đều là "ty" → Tỵ viết "ti" (kiểu URL quen dùng) để không trùng đường dẫn."""
    return "ti" if chi == "Tỵ" else _t()._slug(chi)


def ds_con_giap_nam() -> list[tuple[tuple[int, str], str]]:
    return [((n, chi), f"tuoi-{_slug_chi(chi)}-nam-{n}") for n in NAM_CG for chi in lunar.CHI]


def trang_con_giap_nam(k: tuple[int, str], slug: str) -> dict:
    t, lk, kd = _t(), _lk(), _tdg()
    nam, chi = k
    can_n, chi_n = lunar.can_chi_nam(nam)
    con, con_n = lk["con_giap"][chi], lk["con_giap"][chi_n]
    qh = tdg.quan_he_chi(chi, chi_n)
    tt = tdg.pham_tam_tai(chi, chi_n)
    ds_tt = tdg.tam_tai(chi)
    na_nam = cc.nap_am(can_n, chi_n)
    hn = tdg.han_nam(nam)
    sinh = [n for n in NAM_SINH_CG if lunar.can_chi_nam(n)[1] == chi]
    dong = []
    for n in sinh:
        tm = tdg.tuoi_mu(n, nam)
        c = lunar.can_chi_nam(n)
        kl = tdg.kim_lau(tm)
        ho = kd["hoang_oc"][tdg.HOANG_OC[tdg.hoang_oc(tm)]]
        dong.append([str(n), " ".join(c), _hanh(cc.nap_am(*c)["ten"]), str(tm),
                     kd["kim_lau"][kl]["ten"] if kl else "Không", ho["ten"]])
    qh_lo = lk["quan_he_chi"][qh or "none"]
    tra_loi = (f"Năm {nam} là năm {can_n} {chi_n} (con {con_n.lower()}), mệnh {_hanh(na_nam['ten'])}, bắt đầu từ Tết "
               f"{_dmy(_tet(nam))}. Tuổi {chi} (con {con.lower()}) gặp năm {chi_n}: {qh_lo}"
               + (f" Tuổi {chi} cũng đang ở năm thứ {tt} của Tam tai ({', '.join(ds_tt)})." if tt else "")
               + " Chỉ để tham khảo.")
    muc = [
        {"tieu_de": f"Tuổi {chi} gặp năm {can_n} {chi_n}",
         "danh_sach": [f"Địa chi {chi} gặp {chi_n}: {qh_lo}",
                       (f"Tam tai: tuổi {chi} gặp Tam tai vào các năm {', '.join(ds_tt)}; năm {nam} là năm thứ {tt}."
                        if tt else f"Tam tai: tuổi {chi} gặp Tam tai vào các năm {', '.join(ds_tt)}; năm {nam} không phạm."),
                       f"Phía Thái Tuế năm {nam}: {hn['thai_tue']['phuong']}; Tuế Phá: {hn['tue_pha']['phuong']}; "
                       f"Tam Sát: {hn['tam_sat']['phuong']} — dân gian thường tránh động thổ lớn ở các phía này."]},
        {"tieu_de": f"Tuổi {chi} theo từng năm sinh trong năm {nam}",
         "doan": ("Cùng con giáp nhưng mỗi năm sinh có tuổi mụ, mệnh nạp âm và mốc làm nhà khác nhau. Tuổi mụ = năm "
                  f"{nam} − năm sinh âm lịch + 1. Kim lâu và Hoang ốc là cách đếm dân gian khi chọn năm làm nhà, cưới hỏi."),
         "bang": {"cot": ["Năm sinh", "Can chi", "Mệnh", "Tuổi mụ", "Kim lâu", "Hoang ốc"], "dong": dong}},
        {"tieu_de": f"Hiểu đúng về năm {chi_n} với tuổi {chi}",
         "doan": (f"Địa chi năm chỉ là một lớp rất chung: cả triệu người tuổi {chi} không thể cùng một vận. Muốn xem kỹ hơn, "
                  "lá số Tử vi hoặc Bát tự dùng đủ ngày giờ sinh của riêng bạn. Năm tuổi hay năm xung không phải năm xấu; "
                  "lời khuyên truyền thống chỉ là chuẩn bị kỹ việc lớn.")},
    ]
    hoi_dap = [
        {"hoi": f"Năm {nam} tuổi {chi} có tốt không?",
         "dap": f"Tuổi {chi} gặp năm {chi_n}: {qh_lo} Đây chỉ là lớp chung theo con giáp, không phải lời đoán cho riêng ai."},
        {"hoi": f"Tuổi {chi} năm {nam} có phạm Tam tai không?",
         "dap": (f"Có — năm thứ {tt} trong ba năm Tam tai ({', '.join(ds_tt)})." if tt
                 else f"Không. Tuổi {chi} gặp Tam tai vào các năm {', '.join(ds_tt)}.")},
        {"hoi": f"Người tuổi {chi} sinh năm nào bao nhiêu tuổi vào năm {nam}?",
         "dap": "; ".join(f"sinh {d[0]}: {d[3]} tuổi mụ" for d in dong[-6:]) + "."},
    ]
    i = lunar.CHI.index(chi)
    lk_ngoai = [{"duong": f"/xem-tuoi-lam-nha/{nam}/tuoi-{n}", "ten": f"Tuổi {' '.join(lunar.can_chi_nam(n))} {n} làm nhà năm {nam}"}
                for n in sinh if _LAM_NHA[0] <= n <= _LAM_NHA[1]]
    lk_ngoai += [{"duong": f"/xem-sao-han/{nam}", "ten": f"Sao hạn năm {nam} theo tuổi"},
                 {"duong": f"/tuoi-xong-dat/{nam}", "ten": f"Tuổi xông đất năm {nam}"}]
    return {
        "loai": "con_giap_nam", "slug": slug,
        "tieu_de": f"Tuổi {chi} năm {nam} {can_n} {chi_n}: hợp xung, Tam tai, tuổi mụ",
        "mo_ta": t._cat(f"Tuổi {chi} (con {con.lower()}) trong năm {nam} {can_n} {chi_n}: quan hệ hợp xung, Tam tai, tuổi mụ, "
                        "mệnh, Kim lâu và Hoang ốc theo từng năm sinh — theo quan niệm dân gian."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [kd["source"]["ten"],
                  "Tuổi mụ theo năm âm lịch Việt Nam (UTC+7)."],
        "trang_thai": kd.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "con_giap_nam", "slug": f"tuoi-{_slug_chi(lunar.CHI[(i + d) % 12])}-nam-{nam}"} for d in (-1, 1)],
        "lien_ket_ngoai": lk_ngoai,
        "minh_hoa": {"kieu": "menh", "hanh": na_nam["hanh"], "nap_am": na_nam["ten"], "han": na_nam["han"],
                     "can_chi": f"{chi} · năm {can_n} {chi_n} {nam}"},
    }


TRANG = {"nap_am": (ds_nap_am, trang_nap_am), "tiet_khi": (ds_tiet_khi, trang_tiet_khi),
         "con_giap_nam": (ds_con_giap_nam, trang_con_giap_nam)}
TEN_NGAN = {"nap_am": lambda ten: f"Mệnh {ten}",
            "tiet_khi": lambda ma: f"Tiết {_lk()['tiet_khi'][ma]['ten']}",
            "con_giap_nam": lambda k: f"Tuổi {k[1]} năm {k[0]}"}
