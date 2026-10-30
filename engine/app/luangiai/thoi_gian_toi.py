# -*- coding: utf-8 -*-
"""NAM-2 (hướng B, chủ dự án duyệt 2026-10-30) — "Thời gian tới của bạn": 3 tháng tới · 12 tháng tới · năm {năm}.

RULES chỉ GHÉP — không phép tính mới, không câu mới ngoài vài câu nối (một bộ tính):
- Thần số: tháng cá nhân (`calc.thanso_mo_rong.thang_ca_nhan`) + KB `thanso_ban_do.thang_hop`; năm cá nhân (mốc 1/1
  dương, như Hôm nay / Bản đồ con số) + KB `nghia_nam_ca_nhan`.
- Tử vi (khi có giờ + giới tính): nhịp tháng âm `tuvi_nhip_3_thang.lap` (gọi 4 lượt nối nhau cho 12 tháng — cùng mã
  kiểm chứng `ds.nam_nay.thang.*` của báo cáo Tử vi); chương "Năm nay" + "Vận hạn" của `tuvi_doi_song.lap` chạy với
  ngày xem = hôm nay (năm đang đi) hoặc Tết năm đích (năm tới).
- Bát tự (khi có giờ + giới tính): tháng theo tiết `battu_doi_song.ba_thang_tiet(…, so=12)` + `muc_thang` (hai cách lấy
  dụng thần); chương "Năm nay" + "Vận hạn" của `battu_doi_song.lap` cùng ngày xem như Tử vi.
- Tập quán theo tuổi (năm âm đích): sao hạn Cửu Diệu (cần giới tính), Tam tai, Kim lâu, năm tuổi / xung (`calc.tuoi_dan_gian`)
  + hạn năm theo phương (`luangiai.tuoi_dan_gian.han_nam_luan`).

Báo cáo khuôn `doi_song_1`, 4 chương: tom_tat (3 tháng tới + tóm tắt năm — MIỄN PHÍ), muoi_hai_thang, nam, nen_tranh
(mở bằng Sao ở tầng web — `luanGiaiCoSao` mô-đun "thoi_gian", cùng công tắc/giá `luan_giai.*`). Mỗi hộp mang `nguon` +
`phai` (kiểm chứng ghi đúng phái của nguồn). Thuật ngữ chỉ ở `can_cu`. Không lưu, không LLM."""
from __future__ import annotations

import datetime as dt
import re

from app import config
from app.calc import lunar
from app.calc import thanso as tinh
from app.calc import thanso_mo_rong as mr
from app.calc import tuoi_dan_gian as t
from app.calc import tuvi_luu_nguyet as ln_calc
from app.kb import store
from app.kb import thanso_v2 as kbts
from app.luangiai import doi_song_khuon as kh
from app.luangiai import tuoi_dan_gian as tdg

TZ = config.CALENDAR_MERIDIAN_TZ
MO_DUN = "thoi_gian"
NGAY_SANG_NAM_TOI = 120          # còn ≤ 120 ngày tới Tết sau → mặc định xem năm tới
PHAI = {"thanso": "pitago", "tuvi": "nam_phai_viet", "battu": "tu_binh", "tap_quan": "dan_gian_vn", "hai_la_so": "tuvi_battu"}
_MUC_THANG_TV = {"thuan": "thuan", "binh": "can_bang", "can_than": "can_chu_dong"}
CAU_HOI = {
    "tom_tat": "Ba tháng tới nên dồn sức vào đâu, và năm tới mở ra với bạn thế nào?",
    "muoi_hai_thang": "Tháng nào trong 12 tháng tới hợp để bắt đầu việc mới, tháng nào nên đi chậm — khi ba cách xem cùng nói một ý?",
    "nam": "Năm tới xoay quanh chuyện gì với riêng bạn, và mảng nào nên chăm nhất?",
    "nen_tranh": "Năm tới nên tránh vội vàng ở chuyện nào, và việc nhỏ nào nên làm sớm?",
}


# ------------------------------------------------------------------ năm
def _nam_am(d: dt.date) -> int:
    return lunar.solar_to_lunar(d.day, d.month, d.year, TZ)[2]


def _tet(nam: int) -> dt.date:
    dd, mm, yy = lunar.lunar_to_solar(1, 1, nam, 0, TZ)
    return dt.date(yy, mm, dd)


def cac_nam(hom_nay: dt.date) -> list[int]:
    n = _nam_am(hom_nay)
    return [n, n + 1]


def nam_mac_dinh(hom_nay: dt.date) -> int:
    n = _nam_am(hom_nay)
    return n + 1 if (_tet(n + 1) - hom_nay).days <= NGAY_SANG_NAM_TOI else n


def _doi_nam(o, nam: int):
    """Chương "Năm nay" chạy cho năm TỚI: đổi chữ "năm nay" → "năm {năm}", "ba tháng tới" → "ba tháng đầu năm"."""
    if isinstance(o, str):
        o = re.sub(r"\b(Năm|năm) nay\b", lambda m: f"{m.group(1)} {nam}", o)
        return re.sub(r"\b(Ba|ba|3) tháng tới\b", lambda m: f"{'Ba' if m.group(1) == 'Ba' else 'ba'} tháng đầu năm", o)
    if isinstance(o, list):
        return [_doi_nam(x, nam) for x in o]
    if isinstance(o, dict):
        return {k: (_doi_nam(v, nam) if k not in ("ma_mau", "ma", "loai", "muc", "phai", "nguon") else v) for k, v in o.items()}
    return o


def _gan(h: dict, nguon: str, **them) -> dict:
    h = {k: v for k, v in h.items() if not k.startswith("_")}
    h.update({"nguon": nguon, "phai": PHAI[nguon], **them})
    return h


def _khong_trung_ma(hop: list[dict]) -> list[dict]:
    da: dict[str, int] = {}
    for h in hop:
        n = da.get(h["ma_mau"], 0) + 1
        da[h["ma_mau"]] = n
        if n > 1:
            h["ma_mau"] = (h["ma_mau"][:57] + f"+{n}")[:60]
    return hop


# ------------------------------------------------------------------ thần số
def _thang_ts(ngay: int, thang: int, tu: dt.date, so: int) -> list[dict]:
    van = kbts.ban_do()
    ra, m, y = [], tu.month, tu.year
    for _ in range(so):
        s = mr.thang_ca_nhan(ngay, thang, y, m)
        o = van["thang_hop"][str(s)]
        ra.append(_gan(kh.hop("thoi_diem", f"Tháng {m}/{y}: {o['nhan'].lower()}",
                              f"Hợp {', '.join(o['hop_de'])}.",
                              can_cu=[f"Tháng cá nhân {s} (thần số, tháng dương lịch {m}/{y})"],
                              ma=kh.ma_mau("thanso", "thang", f"so{s}", f"t{m}")), "thanso", thang=f"{m}/{y}", so=s))
        m, y = (1, y + 1) if m == 12 else (m + 1, y)
    return ra


def _nam_ts(ngay: int, thang: int, nam: int) -> tuple[int, dict]:
    so = int(tinh.nam_ca_nhan(ngay, thang, nam, "duong_lich"))
    return so, store.nghia_nam_ca_nhan(so) or {}


# ------------------------------------------------------------------ tập quán
def tap_quan(ngay_sinh: dt.date, nam: int, gioi_tinh: str | None) -> dict:
    nsa = tdg.nam_am_sinh(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day)
    tuoi = t.tuoi_mu(nsa, nam)
    chi_s, chi_n = t.can_chi_nam(nsa)[1], t.can_chi_nam(nam)[1]
    kl = t.kim_lau(tuoi)
    sao = t.sao_han(tuoi, gioi_tinh) if gioi_tinh else None
    han = t.bat_han(tuoi, gioi_tinh) if gioi_tinh else None
    return {"nam": nam, "can_chi_nam": " ".join(t.can_chi_nam(nam)), "tuoi_mu": tuoi, "can_chi": " ".join(t.can_chi_nam(nsa)),
            "quan_he_nam": t.quan_he_chi(chi_s, chi_n) or "binh", "tam_tai": t.pham_tam_tai(chi_s, chi_n),
            "kim_lau": tdg.KB["kim_lau"][kl]["ten"] if kl else None, "sao": sao, "han": han,
            "sao_nghia": tdg.SH["sao"][sao] if sao else None}


_QH_LOI = {"trung": "năm tuổi", "xung": "tuổi xung với năm", "hinh": "tuổi hình với năm", "hai": "tuổi hại với năm"}


def _hop_tap_quan(tq: dict, nam: int, day_du: bool) -> list[dict]:
    co, ma = [], []
    if tq["quan_he_nam"] in _QH_LOI:
        co.append(_QH_LOI[tq["quan_he_nam"]])
        ma.append(tq["quan_he_nam"])
    if tq["tam_tai"]:
        co.append(f"năm thứ {tq['tam_tai']} của Tam tai")
        ma.append(f"tam_tai{tq['tam_tai']}")
    if tq["kim_lau"]:
        co.append(f"Kim lâu (tuổi mụ {tq['tuoi_mu']})")      # không nêu Thân/Thê/Tử ở bài này — tên dễ gây lo
        ma.append("kim_lau")
    cu = [f"Tuổi {tq['can_chi']}, tuổi mụ {tq['tuoi_mu']} năm {tq['can_chi_nam']}"]
    ra = []
    if co:
        ra.append(_gan(kh.hop(
            "luu_y", f"Theo tập quán năm {nam}: {co[0]}",
            f"Theo tập quán theo tuổi, năm {nam} bạn gặp {', '.join(co)}. Đây là lời nhắc giữ nếp, không phải điềm báo.",
            huong_xu_ly="Việc lớn như làm nhà, cưới hỏi: gia đình giữ tập quán thường lùi năm hoặc mượn tuổi người "
                        "thân đứng tên; việc thường ngày cứ làm theo kế hoạch.",
            can_cu=cu, ma=kh.ma_mau("tgt", "tap_quan", *ma)), "tap_quan"))
    if tq["sao"] and (day_du or not co):
        o = tq["sao_nghia"]
        nd = f"Năm {nam} theo tục xếp theo tuổi, bạn gặp sao {tq['sao']}" + (f", hạn {tq['han']}" if tq["han"] else "") \
            + f". {o['nghia']}"
        if day_du:
            nd += " Việc nên làm: " + "; ".join(v.rstrip(".") for v in o["viec"]) + "."
        ra.append(_gan(kh.hop("thoi_diem", f"Sao năm {nam} theo tục: {tq['sao']}", nd,
                              can_cu=cu + ["Sao Cửu Diệu xếp theo tuổi mụ và giới tính — giống nhau cho mọi người cùng tuổi"],
                              ma=kh.ma_mau("tgt", "sao_han", tq["sao"])), "tap_quan"))
    return ra


# ------------------------------------------------------------------ Tử vi / Bát tự
def _tv_thang(tv_sinh: dict, tu: dt.date, so_lan: int, ls: dict | None) -> list[dict]:
    from app.luangiai import tuvi_nhip_3_thang as nhip3  # noqa: PLC0415

    phai = tv_sinh.get("luu_nguyet") or ln_calc.MAC_DINH
    ra, ngay = [], tu
    for _ in range(so_lan):
        kq = nhip3.lap(tv_sinh, ngay, phai, ls=ls)
        for th in kq["thang"]:
            ten = f"Tháng {th['thang']}{' nhuận' if th['nhuan'] else ''} âm lịch"
            if th["phan"] in ("nua_dau", "nua_sau"):
                ten = f"{th['nhan_thang']} âm lịch"
            ly = th["ly_do"][0]["ma"] if th["ly_do"] else "chung"
            from app.luangiai.doi_song_chung import _ma, slug  # noqa: PLC0415
            ra.append(_gan(kh.hop("thoi_diem", ten, f"{th['tieu_de_thang']}. {th['goi_y']}", can_cu=th["can_cu"],
                                  ma=_ma("ds", "nam_nay", "thang", slug(th["cung_goc"]), th["muc"], slug(ly)),
                                  muc=_MUC_THANG_TV[th["muc"]], tu=th["tu"], den=th["den"],
                                  cau_tu_soi=th.get("cau_tu_soi")), "tuvi"))
        ngay = dt.date.fromisoformat(kq["thang"][-1]["den"]) + dt.timedelta(days=1)
    return ra


def _bt_thang(bt_sinh: dict, tu: dt.date, so: int) -> list[dict]:
    from app.luangiai import battu_doi_song as bt  # noqa: PLC0415

    pt = bt.phan_tich(bt._la_so(bt_sinh))
    ra = []
    for i, th in enumerate(bt.ba_thang_tiet(pt, tu, so=so), 1):
        a, b, m = bt.muc_thang(pt, th["can"], th["chi"])
        goi = bt.kb.thang(th["thap_than"]) or "hợp làm việc chính, giữ nhịp đều"
        ten = f"Từ {th['tu'].day}/{th['tu'].month} đến {th['den'].day}/{th['den'].month}"
        ra.append(_gan(kh.hop("thoi_diem", ten, f"{bt._hoa_dau(goi)}.{bt._cau_hai_cach(a, b, 'tháng này')}",
                              can_cu=[f"Lưu nguyệt (tháng theo tiết) {th['can']} {th['chi']} ({th['thap_than']}), "
                                      f"từ {th['tu'].isoformat()}"],
                              ma=bt._mm("nam_nay", f"thang{i}", bt.slug(th["thap_than"]), m), muc=m,
                              tu=th["tu"].isoformat(), den=th["den"].isoformat()), "battu"))
    return ra


def _phu(h: dict, d: dt.date) -> bool:
    return h["tu"] <= d.isoformat() <= h["den"]


def thang_noi_bat(hop: list[dict]) -> list[dict]:
    """Tháng dương lịch mà tháng âm (Tử vi) và tháng tiết (Bát tự) chứa NGÀY 15 cùng một mức Thuận lợi / Cần lưu ý →
    một hộp gộp (chỉ ghép mức đã chấm, không chấm lại). Hai cách khác mức → không nêu."""
    ts = [h for h in hop if h.get("nguon") == "thanso"]
    tv = [h for h in hop if h.get("nguon") == "tuvi" and h.get("tu")]
    bt = [h for h in hop if h.get("nguon") == "battu" and h.get("tu")]
    if not (tv and bt):
        return []
    ra = []
    for h in ts:
        m, y = (int(x) for x in h["thang"].split("/"))
        giua = dt.date(y, m, 15)
        a = next((x for x in tv if _phu(x, giua)), None)
        b = next((x for x in bt if _phu(x, giua)), None)
        if not (a and b) or a.get("muc") != b.get("muc") or a.get("muc") not in ("thuan", "can_chu_dong"):
            continue
        muc = a["muc"]
        cu = [f"Tử vi: {a['tieu_de']} — {kh.NHAN_MUC[muc].lower()}", f"Bát tự: tháng {b['tieu_de'].lower()} — "
              f"{kh.NHAN_MUC[muc].lower()}", "Hai cách cùng mức ở ngày 15 của tháng dương lịch"]
        if muc == "thuan":
            ra.append(_gan(kh.hop("diem_manh", f"Tháng {m}/{y}: hai lá số cùng thuận",
                                  f"Cả Tử vi lẫn Bát tự đều thấy tháng {m}/{y} thuận lợi. {a['noi_dung']}",
                                  can_cu=cu, ma=kh.ma_mau("tgt", "noi_bat", "thuan"), muc=muc, thang=h["thang"]), "hai_la_so"))
        else:
            ra.append(_gan(kh.hop("luu_y", f"Tháng {m}/{y}: hai lá số cùng nhắc đi chậm",
                                  f"Cả Tử vi lẫn Bát tự đều thấy tháng {m}/{y} cần lưu ý. {a['noi_dung']}",
                                  huong_xu_ly="Việc lớn trong tháng này nên chuẩn bị kỹ hơn, hỏi thêm một người có "
                                              "kinh nghiệm, để dư thời gian.",
                                  can_cu=cu, ma=kh.ma_mau("tgt", "noi_bat", "can_chu_dong"), muc=muc,
                                  thang=h["thang"]), "hai_la_so"))
    return ra


def _chuong_cua(bc: dict, ma: str) -> dict:
    return next(c for c in bc["chuong"] if c["ma"] == ma)


def _hop_nam(c: dict, nguon: str) -> list[dict]:
    """Hộp cấp NĂM của chương "Năm nay" (bỏ hộp tháng — chương 12 tháng đã có)."""
    return [_gan(h, nguon) for h in c["hop"] if not h.get("tu") and ".thang" not in h.get("ma_mau", "")]


# ------------------------------------------------------------------ điểm vào
def lap(ngay_sinh: dt.date, hom_nay: dt.date, nam: int | None = None, gioi_tinh: str | None = None,
        tv_sinh: dict | None = None, bt_sinh: dict | None = None, trong_so: dict | None = None,
        ca_nhan: dict | None = None) -> dict:
    cho_phep = cac_nam(hom_nay)
    nam = nam or nam_mac_dinh(hom_nay)
    if nam not in cho_phep:
        raise ValueError(f"Chỉ xem được năm {cho_phep[0]} hoặc {cho_phep[1]}")
    nam_toi = nam != cho_phep[0]
    ngay_nam = _tet(nam) if nam_toi else hom_nay          # ngày xem cho chương cấp năm (Tử vi: năm âm, từ Tết)
    # Bát tự đổi năm ở Lập xuân, không ở Tết (năm Tết tháng Giêng như 2028: Tết 26/01 trước Lập xuân 04/02) → kẹp ngày xem
    # vào [ngày sau Lập xuân năm đích, ngày trước Lập xuân năm sau] (Bát tự đọc năm lúc 12:00 trưa ngày xem; giờ giao Lập
    # xuân có thể sau trưa) để chương Bát tự đọc đúng năm.
    from app.luangiai.nam_tong_quan import _lap_xuan  # noqa: PLC0415
    ngay_bt = min(max(ngay_nam, _lap_xuan(nam) + dt.timedelta(days=1)), _lap_xuan(nam + 1) - dt.timedelta(days=1))
    d, m = ngay_sinh.day, ngay_sinh.month
    thieu = ([] if tv_sinh and bt_sinh else ["gio_sinh"]) + ([] if gioi_tinh else ["gioi_tinh"])

    so_nam, ng = _nam_ts(d, m, nam)
    tq = tap_quan(ngay_sinh, nam, gioi_tinh)

    tv = bt = None
    ls = None
    if tv_sinh:
        from app.hoidap.tuvi import tom_tat  # noqa: PLC0415
        from app.calc import tuvi_an_sao as az  # noqa: PLC0415
        from app.luangiai import tuvi_doi_song as tvd  # noqa: PLC0415
        ls = tom_tat(az.an_sao_tho(tv_sinh["ngay"], tv_sinh["ti"], tv_sinh["gioi_tinh"], "vi-VN",
                                   tz_lich=tv_sinh.get("tz_lich", TZ), hoa_linh=tv_sinh.get("hoa_linh", "viet"),
                                   thang_nhuan=tv_sinh.get("thang_nhuan", "thang_sau"), lich=tv_sinh.get("lich", "viet")))
        tv = tvd.lap(tv_sinh, ngay_nam, ls=ls)
    if bt_sinh:
        from app.luangiai import battu_doi_song as btd  # noqa: PLC0415
        bt = btd.lap(bt_sinh, ngay_bt)

    # ---- chương 1: 3 tháng tới + tóm tắt năm (miễn phí)
    tom_nam = [_gan(kh.hop("cot_loi", f"Năm {nam} với bạn: {ng.get('chu_de', '').lower()}",
                           f"{ng.get('y_nghia', '')} Hợp: {ng.get('nen', '').rstrip('.').lower()}.",
                           can_cu=[f"Năm cá nhân {so_nam} — thần số, tính theo năm dương lịch {nam} (mốc 1/1)"],
                           ma=kh.ma_mau("thanso", "nam", f"so{so_nam}")), "thanso", so=so_nam)]
    tom = f"Năm {nam} là năm cá nhân {so_nam} của bạn: {ng.get('chu_de', '').lower()}."
    for bc, nguon, ten, dau in ((tv, "tuvi", "Tử vi", "ds.nam_nay.luu_nien."), (bt, "battu", "Bát tự", "ds.bt.nam_nay.nam.")):
        if bc:
            c = _doi_nam(_chuong_cua(bc, "nam_nay"), nam) if nam_toi else _chuong_cua(bc, "nam_nay")
            h = next((x for x in c["hop"] if x.get("ma_mau", "").startswith(dau) and x.get("muc")), None)
            if h:
                tom_nam.append(_gan(kh.hop("cot_loi", f"Năm {nam} theo {ten}: {kh.NHAN_MUC[h['muc']].lower()}",
                                           h["noi_dung"], can_cu=h.get("can_cu"),
                                           ma=kh.ma_mau("tgt", nguon, "nam", h["muc"]), muc=h["muc"]), nguon))
    ba_thang = _thang_ts(d, m, hom_nay, 3)
    if tv_sinh:
        ba_thang += _tv_thang(tv_sinh, hom_nay, 1, ls)
    hop1 = tom_nam + _hop_tap_quan(tq, nam, False) + ba_thang
    doan1 = [tom, "Ba tháng tới đọc theo tháng cá nhân (thần số, tháng dương lịch)"
             + (" và nhịp tháng âm của lá số Tử vi" if tv_sinh else "") + ". Đây là nhịp gợi ý để sắp việc, không phải dự báo."]
    c1 = kh.chuong("tom_tat", f"Ba tháng tới & năm {nam} tóm tắt", doan1, hop=_khong_trung_ma(hop1), tom_tat=tom,
                   cau_tu_soi="Việc nào trong ba tháng tới bạn muốn làm cho xong trước?")

    # ---- chương 2: 12 tháng tới
    hop2 = _thang_ts(d, m, hom_nay, 12)
    if tv_sinh:
        hop2 += _tv_thang(tv_sinh, hom_nay, 4, ls)[:14]
    if bt_sinh:
        hop2 += _bt_thang(bt_sinh, hom_nay, 12)
    noi_bat = thang_noi_bat(hop2)
    hop2 = noi_bat + hop2
    thuan = [h["thang"] for h in hop2 if h.get("nguon") == "thanso" and h.get("so") in (1, 8)]
    doan2 = [f"Mười hai tháng tới theo {'ba cách xem' if tv_sinh and bt_sinh else 'tháng cá nhân'}: mỗi tháng một hộp, "
             "đọc lần lượt từng cách.",
             (f"Tháng hợp khởi sự hoặc lo chuyện tiền theo tháng cá nhân: {', '.join(thuan)}." if thuan else ""),
             (f"Có {len(noi_bat)} tháng Tử vi và Bát tự cùng một mức — đọc các hộp đầu chương trước." if noi_bat else ""),
             "Khi các cách nói khác nhau, ưu tiên lớp lớn hơn (mười năm, rồi năm) trước khi xét tháng."]
    c2 = kh.chuong("muoi_hai_thang", "12 tháng tới của bạn", [x for x in doan2 if x], hop=_khong_trung_ma(hop2),
                   tom_tat=doan2[0], cau_tu_soi="Tháng nào bạn muốn để dành cho việc quan trọng nhất năm?")

    # ---- chương 3: năm đầy đủ
    nd_ts = " ".join(x for x in (ng.get("y_nghia"), f"Nên: {ng['nen']}" if ng.get("nen") else "",
                                 f"Tránh: {ng['tranh']}" if ng.get("tranh") else "",
                                 f"Chuyện hay gặp: {ng['hay_gap']}" if ng.get("hay_gap") else "") if x)
    hop3 = [_gan(kh.hop("cot_loi", f"Năm {nam}: năm cá nhân {so_nam}", nd_ts,
                        can_cu=[f"Năm cá nhân {so_nam} = ngày + tháng sinh + năm {nam}, rút gọn"],
                        ma=kh.ma_mau("thanso", "nam_day_du", f"so{so_nam}")), "thanso", so=so_nam)]
    can_cu3: list[str] = []
    for bc, nguon in ((tv, "tuvi"), (bt, "battu")):
        if bc:
            c = _chuong_cua(bc, "nam_nay")
            c = _doi_nam(c, nam) if nam_toi else c
            hop3 += _hop_nam(c, nguon)
            can_cu3 += c["can_cu"][:4]
    hop3 += _hop_tap_quan(tq, nam, True)
    doan3 = [f"Năm {nam} ghép ba lớp: năm cá nhân (thần số), lá số Tử vi và Bát tự của bạn chạy cho năm {nam}, cùng "
             "tập quán theo tuổi." if tv else f"Năm {nam} đọc theo năm cá nhân (thần số) và tập quán theo tuổi.",
             "Thêm giờ sinh để đọc thêm lá số Tử vi và Bát tự cho năm này." if not tv else ""]
    c3 = kh.chuong("nam", f"Năm {nam} của bạn", [x for x in doan3 if x], hop=_khong_trung_ma(hop3),
                   tom_tat=tom, can_cu=can_cu3, cau_tu_soi="Nếu năm này chỉ làm tốt một việc, bạn chọn việc gì?")

    # ---- chương 4: nên tránh & nên làm
    hop4: list[dict] = []
    for bc, nguon in ((tv, "tuvi"), (bt, "battu")):
        if bc:
            c = _chuong_cua(bc, "van_han")
            hop4 += [_gan(h, nguon) for h in c["hop"] if h.get("nam") == nam]
    if ng.get("tranh"):
        hop4.append(_gan(kh.hop("luu_y", f"Năm {nam} nên tránh: {ng['tranh'].rstrip('.').lower()}",
                                f"Năm cá nhân {so_nam} dễ vấp ở chỗ {ng['tranh'].rstrip('.').lower()}.",
                                huong_xu_ly=f"Nên làm: {ng.get('nen', 'giữ nhịp đều, làm từng việc')}",
                                can_cu=[f"Năm cá nhân {so_nam}"], ma=kh.ma_mau("thanso", "tranh", f"so{so_nam}")),
                         "thanso"))
    hn = tdg.han_nam_luan(nam)
    phuong = "; ".join(f"{x['ten']} ở {x['phuong']}" for x in hn["huong_tranh"])
    hop4.append(_gan(kh.hop("luu_y", f"Năm {nam}: phương nên tránh động thổ lớn",
                            f"Theo tập quán, năm {hn['can_chi']} nên tránh khởi công, đục phá lớn ở các phương: {phuong}.",
                            huong_xu_ly="Nhà đang ở giữ nguyên; phía ấy giữ gọn gàng, yên tĩnh là đủ.",
                            can_cu=[hn["moc"]], ma=kh.ma_mau("tgt", "han_nam")), "tap_quan"))
    doan4 = [f"Những điều nên tránh và nên làm trong năm {nam}, gom từ các cách xem; mỗi điều có hướng xử lý ngay trong hộp."]
    c4 = kh.chuong("nen_tranh", f"Năm {nam}: nên tránh & nên làm", doan4, hop=_khong_trung_ma(hop4), tom_tat=doan4[0],
                   cau_tu_soi="Điều gì năm nay bạn muốn làm chậm lại một nhịp?" if not nam_toi
                   else f"Điều gì năm {nam} bạn muốn làm chậm lại một nhịp?")

    from app.luangiai.toan_bo import diem_nhan, so_chu_chuong  # noqa: PLC0415
    ds = []
    for c in (c1, c2, c3, c4):
        c["moi_xem"] = {"diem_nhan": diem_nhan(c["doan"]), "cau_hoi": CAU_HOI[c["ma"]], "so_doan": len(c["doan"]),
                        "phut_doc": max(1, round(so_chu_chuong(c) / 200))}
        ds.append(c)
    bc = {"phien_ban": kh.PHIEN_BAN, "mo_dun": MO_DUN, "nam": nam, "cac_nam": cho_phep, "nam_toi": nam_toi,
          "ngay_xem": hom_nay.isoformat(), "thieu": thieu,
          "cot_loi": [], "chuong": ds,
          "nguon": "Thần số Pitago · Tử vi Nam phái · Bát tự Tử Bình · tập quán dân gian Việt Nam",
          "trang_thai": "nhap_ai", "dien_dat": "mau",
          "ket": "Đây là nhịp gợi ý để bạn tự sắp việc. Quyết định lớn vẫn dựa trên điều kiện thực tế của bạn."}
    return kh.ap_hoc(bc, trong_so, ca_nhan)
