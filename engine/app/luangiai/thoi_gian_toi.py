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
from app.calc import phongthuy as P
from app.calc import thanso as tinh
from app.calc import thanso_mo_rong as mr
from app.calc import tuoi_dan_gian as t
from app.calc import tuvi_luu_nguyet as ln_calc
from app.kb import store
from app.kb import thanso_v2 as kbts
from app.luangiai import doi_song_khuon as kh
from app.luangiai import thoi_gian_lop as L
from app.luangiai import tuoi_dan_gian as tdg
from app import ngon_ngu
from app.kb import nap
from app.kb import ten as _tn
from app.kb.loi import L as Lo, danh_sach

TZ = config.CALENDAR_MERIDIAN_TZ
MO_DUN = "thoi_gian"
NGAY_SANG_NAM_TOI = 120          # còn ≤ 120 ngày tới Tết sau → mặc định xem năm tới
PHAI = {"thanso": "pitago", "tuvi": "nam_phai_viet", "battu": "tu_binh", "tap_quan": "dan_gian_vn", "hai_la_so": "tuvi_battu",
        "con_giap": "dan_gian_vn", "phong_thuy": "bat_trach"}
_MUC_THANG_TV = {"thuan": "thuan", "binh": "can_bang", "can_than": "can_chu_dong"}
CAU_HOI = {
    "tom_tat": "Ba tháng tới nên dồn sức vào đâu, và năm tới mở ra với bạn thế nào?",
    "muoi_hai_thang": "Tháng nào trong 12 tháng tới hợp để bắt đầu việc mới, tháng nào nên đi chậm — khi ba cách xem cùng nói một ý?",
    "nam": "Năm tới xoay quanh chuyện gì với riêng bạn, và mảng nào nên chăm nhất?",
    "nen_tranh": "Năm tới nên tránh vội vàng ở chuyện nào, và việc nhỏ nào nên làm sớm?",
}
# EN-ALL GĐ 8: tên sao Cửu Diệu / Bát hạn hiển thị (mã vẫn là tên Việt). Bản Việt: nguyên tên.
_SAO_EN = {"La Hầu": "la_hau", "Thổ Tú": "tho_tu", "Thuỷ Diệu": "thuy_dieu", "Thủy Diệu": "thuy_dieu", "Thái Bạch": "thai_bach",
           "Thái Dương": "thai_duong", "Vân Hán": "van_han", "Kế Đô": "ke_do", "Thái Âm": "thai_am", "Mộc Đức": "moc_duc",
           "Huỳnh Tuyền": "huynh_tuyen", "Tam Kheo": "tam_kheo", "Ngũ Mộ": "ngu_mo", "Thiên Tinh": "thien_tinh", "Toán Tận": "toan_tan",
           "Thiên La": "thien_la", "Địa Võng": "dia_vong", "Diêm Vương": "diem_vuong"}


def _ten_sao(x: str | None) -> str | None:
    return Lo(f"tgt.sao.{_SAO_EN[x]}", x) if x in _SAO_EN else x


def _cau(s: str) -> str:
    return s[:1].upper() + s[1:] if s else s


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
        if not ngon_ngu.la_viet():      # EN-ALL GĐ 8: cùng phép đổi chữ trên lời tiếng Anh
            o = re.sub(r"\b[Tt]his year's\b", f"{nam}'s", o)
            o = re.sub(r"\bThis year, ", f"In {nam}, ", o)
            o = re.sub(r"\b(?:in |for )?[Tt]his year\b", lambda m: m.group(0).replace("this year", str(nam)).replace("This year", str(nam)), o)
            return re.sub(r"\b(?:[Tt]he )?(?:[Nn]ext )(?:three|3) months\b",
                          lambda m: ("The" if m.group(0)[0] == "T" else "the") + " first three months of the year", o)
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
        ra.append(_gan(kh.hop("thoi_diem", Lo("tgt.ts.thang", "Tháng {m}/{y}: {nhan}", m=_ten_thang(m, y), y=y, nhan=o['nhan'].lower()),
                              Lo("tgt.ts.hop", "Hợp {ds}.", ds=', '.join(o['hop_de'])),
                              can_cu=[Lo("tgt.ts.can_cu", "Tháng cá nhân {s} (thần số, tháng dương lịch {m}/{y})", s=s, m=m, y=y)],
                              ma=kh.ma_mau("thanso", "thang", f"so{s}", f"t{m}")), "thanso", thang=f"{m}/{y}", so=s,
                       hop_de=o["hop_de"][0]))
        m, y = (1, y + 1) if m == 12 else (m + 1, y)
    return ra


def _ten_thang(m: int, y: int) -> str:
    """Bản Việt: "11" (mẫu "Tháng {m}/{y}"); bản Anh: "Nov" (mẫu "{m} {y}")."""
    return str(m) if ngon_ngu.la_viet() else Lo(f"pt.thang_ten.{m}", str(m))


def _thang_hien(th: str) -> str:
    """"11/2026" → bản Anh "Nov 2026" (khoá tháng giữ "m/yyyy")."""
    if ngon_ngu.la_viet():
        return th
    m, y = th.split("/")
    return f"{Lo(f'pt.thang_ten.{int(m)}', m)} {y}"


def _nam_ts(ngay: int, thang: int, nam: int) -> tuple[int, dict]:
    so = int(tinh.nam_ca_nhan(ngay, thang, nam, "duong_lich"))
    return so, store.nghia_nam_ca_nhan(so) or {}


# ------------------------------------------------------------------ tập quán
def tap_quan(ngay_sinh: dt.date, nam: int, gioi_tinh: str | None, tz_lich: float | None = None) -> dict:
    nsa = tdg.nam_am_sinh(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, tz_lich)
    tuoi = t.tuoi_mu(nsa, nam)
    chi_s, chi_n = t.can_chi_nam(nsa)[1], t.can_chi_nam(nam)[1]
    kl = t.kim_lau(tuoi)
    sao = t.sao_han(tuoi, gioi_tinh) if gioi_tinh else None
    han = t.bat_han(tuoi, gioi_tinh) if gioi_tinh else None
    return {"nam": nam, "can_chi_nam": " ".join(t.can_chi_nam(nam)), "tuoi_mu": tuoi, "can_chi": " ".join(t.can_chi_nam(nsa)),
            "quan_he_nam": t.quan_he_chi(chi_s, chi_n) or "binh", "tam_tai": t.pham_tam_tai(chi_s, chi_n),
            "kim_lau": tdg.KB["kim_lau"][kl]["ten"] if kl else None, "sao": sao, "han": han,
            "sao_nghia": (tdg.SH if ngon_ngu.la_viet() else nap.doc("sao_han_kb.json"))["sao"][sao] if sao else None}


_QH_LOI = {"trung": "năm tuổi", "xung": "tuổi xung với năm", "hinh": "tuổi hình với năm", "hai": "tuổi hại với năm"}


def _can_chi(s: str) -> str:
    from app.luangiai import lich_hien  # noqa: PLC0415
    return lich_hien.can_chi(s)


def _hop_tap_quan(tq: dict, nam: int, day_du: bool) -> list[dict]:
    co, ma = [], []
    if tq["quan_he_nam"] in _QH_LOI:
        co.append(Lo(f"tgt.qh.{tq['quan_he_nam']}", _QH_LOI[tq["quan_he_nam"]]))
        ma.append(tq["quan_he_nam"])
    if tq["tam_tai"]:
        co.append(Lo("tgt.tam_tai", "năm thứ {n} của Tam tai", n=tq['tam_tai']))
        ma.append(f"tam_tai{tq['tam_tai']}")
    if tq["kim_lau"]:
        co.append(Lo("tgt.kim_lau", "Kim lâu (tuổi mụ {t})", t=tq['tuoi_mu']))      # không nêu Thân/Thê/Tử ở bài này — tên dễ gây lo
        ma.append("kim_lau")
    cu = [Lo("tgt.tq.can_cu", "Tuổi {cc}, tuổi mụ {t} năm {ccn}", cc=_can_chi(tq['can_chi']), t=tq['tuoi_mu'], ccn=_can_chi(tq['can_chi_nam']))]
    ra = []
    if co:
        ra.append(_gan(kh.hop(
            "luu_y", Lo("tgt.tq.tieu_de", "Theo tập quán năm {nam}: {x}", nam=nam, x=co[0]),
            Lo("tgt.tq.noi_dung", "Theo tập quán theo tuổi, năm {nam} bạn gặp {ds}. Đây là lời nhắc giữ nếp, không phải điềm báo.",
               nam=nam, ds=', '.join(co)),
            huong_xu_ly=Lo("tgt.tq.viec", "Việc lớn như làm nhà, cưới hỏi: gia đình giữ tập quán thường lùi năm hoặc mượn tuổi người "
                           "thân đứng tên; việc thường ngày cứ làm theo kế hoạch."),
            can_cu=cu, ma=kh.ma_mau("tgt", "tap_quan", *ma)), "tap_quan"))
    if tq["sao"] and (day_du or not co):
        o = tq["sao_nghia"]
        nd = Lo("tgt.sao.nd", "Năm {nam} theo tục xếp theo tuổi, bạn gặp sao {sao}", nam=nam, sao=_ten_sao(tq['sao'])) \
            + (Lo("tgt.sao.han", ", hạn {han}", han=_ten_sao(tq['han'])) if tq["han"] else "") + f". {o['nghia']}"
        if day_du:
            nd += Lo("tgt.sao.viec", " Việc nên làm: ") + "; ".join(v.rstrip(".") for v in o["viec"]) + "."
        ra.append(_gan(kh.hop("thoi_diem", Lo("tgt.sao.tieu_de", "Sao năm {nam} theo tục: {sao}", nam=nam, sao=_ten_sao(tq['sao'])), nd,
                              can_cu=cu + [Lo("tgt.sao.can_cu", "Sao Cửu Diệu xếp theo tuổi mụ và giới tính — giống nhau cho mọi người cùng tuổi")],
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
            if not ngon_ngu.la_viet():       # EN-ALL GĐ 8: "Lunar month 6", "Leap lunar month 6"…
                ten = nhip3.nhan_thang(th) if th["phan"] in ("nua_dau", "nua_sau") or nhip3.tinh_thang_sau(th) \
                    else (Lo("tv2.n3.thang_nhuan", "tháng {so} nhuận", so=th["thang"]) if th["nhuan"]
                          else Lo("tv2.n3.thang_am", "tháng {so}", so=th["thang"]))
                ten = ten[:1].upper() + ten[1:]
            else:
                ten = f"Tháng {th['thang']}{' nhuận' if th['nhuan'] else ''} âm lịch"
            if ngon_ngu.la_viet() and (th["phan"] in ("nua_dau", "nua_sau") or nhip3.tinh_thang_sau(th)):
                ten = f"{th['nhan_thang']} âm lịch"
            ly = th["ly_do"][0]["ma"] if th["ly_do"] else "chung"
            from app.luangiai.doi_song_chung import _ma, slug  # noqa: PLC0415
            ra.append(_gan(kh.hop("thoi_diem", ten, f"{th['tieu_de_thang']}. {th['goi_y']}", can_cu=th["can_cu"], loi=th["tieu_de_thang"],
                                  ma=_ma("ds", "nam_nay", "thang", slug(th["cung_goc"]), th["muc"], slug(ly)),
                                  muc=_MUC_THANG_TV[th["muc"]], tu=th["tu"], den=th["den"],
                                  cau_tu_soi=th.get("cau_tu_soi")), "tuvi"))
        ngay = dt.date.fromisoformat(kq["thang"][-1]["den"]) + dt.timedelta(days=1)
    return ra


def _bt_thang(bt_sinh: dict, tu: dt.date, so: int, ls: dict | None = None) -> list[dict]:
    from app.luangiai import battu_doi_song as bt  # noqa: PLC0415

    pt = bt.phan_tich({**ls, "_gioi_tinh": bt_sinh["gioi_tinh"]} if ls else bt._la_so(bt_sinh))
    ra = []
    for i, th in enumerate(bt.ba_thang_tiet(pt, tu, so=so), 1):
        a, b, m = bt.muc_thang(pt, th["can"], th["chi"])
        goi = bt.kb.thang(th["thap_than"]) or Lo("tgt.bt.goi", "hợp làm việc chính, giữ nhịp đều")
        ten = Lo("tgt.bt.ten", "Tháng {chi} ({tu}–{den})", chi=_tn.ten("chi", th['chi']), tu=_ngay_ngan(th['tu']), den=_ngay_ngan(th['den']))
        ra.append(_gan(kh.hop("thoi_diem", ten, f"{bt._hoa_dau(goi)}.{bt._cau_hai_cach(a, b, Lo('tgt.bt.thang_nay', 'tháng này'))}",
                              loi=bt._hoa_dau(goi),
                              can_cu=[Lo("tgt.bt.can_cu", "Lưu nguyệt (tháng theo tiết) {can} {chi} ({tt}), từ {tu}",
                                         can=_tn.ten("can", th['can']), chi=_tn.ten("chi", th['chi']), tt=_tn.ten("thap_than", th['thap_than']),
                                         tu=th['tu'].isoformat())],
                              ma=bt._mm("nam_nay", f"thang{i}", bt.slug(th["thap_than"]), m), muc=m,
                              tu=th["tu"].isoformat(), den=th["den"].isoformat()), "battu"))
    return ra


def _ngay_ngan(d: dt.date) -> str:
    if ngon_ngu.la_viet():
        return f"{d.day}/{d.month}"
    from app.luangiai import lich_hien  # noqa: PLC0415
    return lich_hien.dm(d)


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
        cu = [Lo("tgt.nb.cu_tv", "Tử vi: {td} — {muc}", td=a['tieu_de'], muc=kh.nhan_muc(muc).lower()),
              Lo("tgt.nb.cu_bt", "Bát tự: tháng {td} — {muc}", td=b['tieu_de'].lower() if ngon_ngu.la_viet() else b['tieu_de'],
                 muc=kh.nhan_muc(muc).lower()),
              Lo("tgt.nb.cu", "Hai cách cùng mức ở ngày 15 của tháng dương lịch")]
        th_ = Lo("tgt.ts.thang_ngan", "{m}/{y}", m=_ten_thang(m, y), y=y)
        if muc == "thuan":
            ra.append(_gan(kh.hop("diem_manh", Lo("tgt.nb.thuan_td", "Tháng {th}: hai lá số cùng thuận", th=th_),
                                  Lo("tgt.nb.thuan", "Cả Tử vi lẫn Bát tự đều thấy tháng {th} thuận lợi. {nd}", th=th_, nd=a['noi_dung']),
                                  can_cu=cu, ma=kh.ma_mau("tgt", "noi_bat", "thuan"), muc=muc, thang=h["thang"]), "hai_la_so"))
        else:
            ra.append(_gan(kh.hop("luu_y", Lo("tgt.nb.cham_td", "Tháng {th}: hai lá số cùng nhắc đi chậm", th=th_),
                                  Lo("tgt.nb.cham", "Cả Tử vi lẫn Bát tự đều thấy tháng {th} cần lưu ý. {nd}", th=th_, nd=a['noi_dung']),
                                  huong_xu_ly=Lo("tgt.nb.cham_viec", "Việc lớn trong tháng này nên chuẩn bị kỹ hơn, hỏi thêm một người có "
                                                 "kinh nghiệm, để dư thời gian."),
                                  can_cu=cu, ma=kh.ma_mau("tgt", "noi_bat", "can_chu_dong"), muc=muc,
                                  thang=h["thang"]), "hai_la_so"))
    return ra


def _thuong(x: str) -> str:
    return x[:1].lower() + x[1:]


def gop_thang(ts: list[dict], tv: list[dict], bt: list[dict], lop: dict[str, dict]) -> list[dict]:
    """TG-V2 (2026-11-01): một hộp mỗi tháng DƯƠNG LỊCH, các cách xem thành HÀNG (`lop`): thần số · con giáp · phong
    thuỷ · ngày đẹp (không cần giờ sinh) · Tử vi (tháng âm chứa ngày 15) · Bát tự (tháng tiết chứa ngày 15). Chỉ ghép câu +
    mức đã có; mức của hộp chỉ khi hai lá số cùng mức (lớp tập quán / phong thuỷ không đổi mức)."""
    ra = []
    truoc = None
    for h in ts:
        mm, yy = (int(x) for x in h["thang"].split("/"))
        giua = dt.date(yy, mm, 15)
        a = next((x for x in tv if _phu(x, giua)), None)
        b = next((x for x in bt if _phu(x, giua)), None)
        o = lop.get(h["thang"])
        hang = [{"ma": "thanso", "nhan": L.ten_lop("thanso"), "tieu": Lo("tgt.thang_ca_nhan", "Tháng cá nhân {so}", so=h['so']), "loi": h["noi_dung"]}]
        if o:
            hang += L.hang_lop(o, truoc)
            truoc = o
        if a:
            hang.append({"ma": "tuvi", "nhan": L.ten_lop("tuvi"), "tieu": a["tieu_de"], "loi": a["loi"].rstrip(".") + ".",
                         "muc": a.get("muc")})
        if b:
            hang.append({"ma": "battu", "nhan": L.ten_lop("battu"), "tieu": b["tieu_de"], "loi": b["loi"].rstrip(".") + ".",
                         "muc": b.get("muc")})
        muc = a.get("muc") if a and b and a.get("muc") == b.get("muc") else None
        cu = list(h.get("can_cu", [])) + (L.can_cu_lop(o) if o else []) + (a or {}).get("can_cu", [])[:2] \
            + (b or {}).get("can_cu", [])[:1]
        tom = L.tom_lai(L.tin_hieu(o, a and a.get("muc"), b and b.get("muc"))) if o else h["noi_dung"]
        viec = L.viec_chinh(o, h.get("hop_de")) if o else ""
        hop = _gan(kh.hop("thoi_diem", h["tieu_de"], tom, can_cu=cu,
                          ma=kh.ma_mau("tgt", "thang", f"so{h['so']}", muc or "khac"), muc=muc,
                          **({"huong_xu_ly": viec} if viec else {})),
                   "hai_la_so" if a and b else "thanso", thang=h["thang"], so=h["so"])
        hop["lop"] = hang
        ra.append(hop)
    return ra


def _doi_thuong(x: dict) -> tuple[str, str]:
    """Điểm nhấn theo tuổi (trang "Năm … theo tuổi") → lời đời thường cho báo cáo: thuật ngữ (can khắc, nạp âm…) dời
    sang "Vì sao nói vậy"; tiêu đề là câu đầu của phần lời, thân là phần còn lại (hộp không lặp tiêu đề)."""
    nd = x["noi_dung"]
    if " — " not in nd:
        return x["tieu_de"], nd
    con = nd.split(" — ", 1)[1].strip()
    dau, _, sau = con.partition(". ")
    return Lo("tgt.theo_tuoi", "Theo tuổi: ") + dau.rstrip("."), sau.strip()


def _lop_12(ngay_sinh: dt.date, tu: dt.date, quai: str | None) -> dict[str, dict]:
    ra, m, y = {}, tu.month, tu.year
    for _ in range(12):
        ra[f"{m}/{y}"] = L.lop_thang(m, y, ngay_sinh, quai, tu_ngay=tu)
        m, y = (1, y + 1) if m == 12 else (m + 1, y)
    return ra


def _hop_xep(lop: dict[str, dict], tv: list[dict], bt: list[dict]) -> list[dict]:
    """Tháng hội nhiều lớp thuận / nhiều lớp nhắc chậm trong 12 tháng (đếm lớp, không điểm số)."""
    ds = []
    for th, o in lop.items():
        mm, yy = (int(x) for x in th.split("/"))
        giua = dt.date(yy, mm, 15)
        a = next((x for x in tv if _phu(x, giua)), None)
        b = next((x for x in bt if _phu(x, giua)), None)
        ds.append(L.tin_hieu(o, a and a.get("muc"), b and b.get("muc")))
    thuan, cham = L.xep_thang(ds)
    k, ra = L._kb()["noi_bat"], []
    thu_tu = list(lop)
    for nhom, loai, td, loi, ma in ((thuan, "diem_manh", "tieu_de", "loi", "thuan"),
                                    (cham, "luu_y", "di_cham_tieu_de", "di_cham_loi", "cham")):
        if not nhom:
            continue
        nhom = sorted(nhom, key=lambda x: thu_tu.index(x["thang"]))
        ly = sorted({d for x in nhom for d in (x["dau"] if ma == "thuan" else x["cham"])})
        h = kh.hop(loai, k[td].format(ds=", ".join(_thang_hien(x["thang"]) for x in nhom)), k[loi].format(ly_do=", ".join(ly)),
                   **({"huong_xu_ly": Lo("tgt.xep.cham_viec", "Đặt mốc quan trọng trước hoặc sau những tháng này; nếu buộc làm trong tháng, "
                                         "chuẩn bị giấy tờ, người hỗ trợ và thời gian dư.")} if ma == "cham" else {}),
                   can_cu=[k["can_cu"]] + [f"{_thang_hien(x['thang'])}: {', '.join(x['dau'] if ma == 'thuan' else x['cham'])}" for x in nhom],
                   ma=kh.ma_mau("tgt", "xep", ma))
        ra.append(_gan(h, "hai_la_so" if (tv and bt) else "tap_quan", cac_thang=[x["thang"] for x in nhom]))
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
        raise ValueError(Lo("tgt.loi_nam", "Chỉ xem được năm {a} hoặc {b}", a=cho_phep[0], b=cho_phep[1]))
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
    tz_sinh = (tv_sinh or {}).get("tz_lich")              # EN-1 B9: lịch miền Nam 1960–1975 khi biết nơi sinh
    tq = tap_quan(ngay_sinh, nam, gioi_tinh, tz_sinh)

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
    tom_nam = [_gan(kh.hop("cot_loi", Lo("tgt.nam.td", "Năm {nam} với bạn: {cd}", nam=nam, cd=ng.get('chu_de', '').lower()),
                           Lo("tgt.nam.nd", "{y} Hợp: {nen}.", y=ng.get('y_nghia', ''), nen=ng.get('nen', '').rstrip('.').lower()),
                           can_cu=[Lo("tgt.nam.can_cu", "Năm cá nhân {so} — thần số, tính theo năm dương lịch {nam} (mốc 1/1)", so=so_nam, nam=nam)],
                           ma=kh.ma_mau("thanso", "nam", f"so{so_nam}")), "thanso", so=so_nam)]
    tom = Lo("tgt.nam.tom", "Năm {nam} là năm cá nhân {so} của bạn: {cd}.", nam=nam, so=so_nam, cd=ng.get('chu_de', '').lower())
    muc_nam: dict[str, str] = {}
    for bc, nguon, ten, dau in ((tv, "tuvi", Lo("tgt.ten.tuvi", "Tử vi"), "ds.nam_nay.luu_nien."),
                                (bt, "battu", Lo("tgt.ten.battu", "Bát tự"), "ds.bt.nam_nay.nam.")):
        if bc:
            c = _doi_nam(_chuong_cua(bc, "nam_nay"), nam) if nam_toi else _chuong_cua(bc, "nam_nay")
            h = next((x for x in c["hop"] if x.get("ma_mau", "").startswith(dau) and x.get("muc")), None)
            if h:
                # Thời gian tới không có khung "hai cách đọc" của bài Bát tự → nói rõ đây là hai cách TRONG Bát tự, khỏi lẫn
                # với hộp "hai lá số" (Tử vi ↔ Bát tự) ngay dưới.
                nd = h["noi_dung"].replace("Hai cách đọc ngược nhau", "Ngay trong Bát tự, hai cách đọc cũng ngược nhau")
                tom_nam.append(_gan(kh.hop("cot_loi", Lo("tgt.nam.theo", "Năm {nam} theo {ten}: {muc}", nam=nam, ten=ten,
                                                         muc=kh.nhan_muc(h['muc']).lower()),
                                           nd, can_cu=h.get("can_cu"),
                                           ma=kh.ma_mau("tgt", nguon, "nam", h["muc"]), muc=h["muc"]), nguon))
                muc_nam[nguon] = h["muc"]
    # EN-2: lớp nhất quán liên mảng — Tử vi và Bát tự cùng mức năm → điểm nhấn; khác mức → vì sao + việc nên làm chung
    from app.luangiai import nhat_quan  # noqa: PLC0415
    h_nq = nhat_quan.nam(nam, muc_nam)
    if h_nq:
        tom_nam.append(_gan(h_nq, "hai_la_so"))
    # TG-V2: lớp từng tháng (con giáp · phong thuỷ · ngày đẹp) + Tử vi / Bát tự — tính một lần cho 12 tháng
    from app.luangiai import nam_tong_quan as ntq
    from app.luangiai import nam_tuoi_hien as _nth  # noqa: PLC0415
    quai = P.menh_quai(ngay_sinh.year, gioi_tinh, ngay_sinh)["quai"] if gioi_tinh else None
    ts12 = _thang_ts(d, m, hom_nay, 12)
    tv12 = _tv_thang(tv_sinh, hom_nay, 4, ls)[:14] if tv_sinh else []
    bt12 = _bt_thang(bt_sinh, hom_nay, 12) if bt_sinh else []
    lop12 = _lop_12(ngay_sinh, hom_nay, quai)
    thang12 = gop_thang(ts12, tv12, bt12, lop12)
    xep = _hop_xep(lop12, tv12, bt12)
    nsa = tdg.nam_am_sinh(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, tz_sinh)
    # EN-ALL GĐ 8: chọn điểm nhấn + mã kiểm chứng theo chữ bản Việt (bản Việt quyết); chữ hiển thị qua đúng lớp hiển thị
    # của trang "Tử vi năm theo tuổi" (`nam_tuoi_hien.theo_tuoi`) — một nguồn chữ tiếng Anh cho cùng dữ kiện.
    tt_vi = ngon_ngu.theo_viet(ntq.theo_tuoi)(nam, nsa)
    tt = tt_vi if ngon_ngu.la_viet() else _nth.theo_tuoi(tt_vi)
    cg_nam = [_gan(kh.hop("diem_manh" if x["loai"] == "thuan" else "luu_y" if x["loai"] == "luu_y" else "loi_khuyen",
                          *_doi_thuong(x), can_cu=[x["tieu_de"], x["can_cu"]],
                          ma=kh.ma_mau("tgt", "con_giap", L.slug(v["can_cu"].split(":")[0]), v["loai"])), "con_giap")
              for x, v in zip(tt["diem_nhan"], tt_vi["diem_nhan"])
              if not v["can_cu"].startswith("Cửu Diệu") and not v["tieu_de"].startswith("Năm thứ")
              and not (v["can_cu"].startswith("Địa chi") and v["loai"] == "luu_y")]
    pt_nam = L.phong_thuy_nam(nam, quai)
    hop_pt = [_gan(kh.hop("diem_manh" if pt_nam["goc_hop"] else "loi_khuyen",
                          Lo("tgt.pt.td_hop" if pt_nam["goc_hop"] else "tgt.pt.td_tot",
                             "Năm {nam}: góc {ph} trong nhà" + (" hợp bạn nhất" if pt_nam["goc_hop"] else " đón sao tốt"),
                             nam=nam, ph=_tn.ten("huong", (pt_nam['goc_hop'] or pt_nam['goc_tot'])['phuong'])),
                          pt_nam["loi"], can_cu=[pt_nam["can_cu"]],
                          ma=kh.ma_mau("tgt", "phong_thuy", "nam", "hop" if pt_nam["goc_hop"] else "tot")), "phong_thuy")] \
        if pt_nam else []

    # ---- chương 1: 3 tháng tới + tóm tắt năm (miễn phí) — đủ lớp như chương 12 tháng, để người đọc thấy giá trị thật
    cg1 = [h for h in cg_nam if h["loai"] == "diem_manh"][:1]
    hop1 = tom_nam + xep + cg1 + hop_pt + _hop_tap_quan(tq, nam, False) + thang12[:3]
    lop_co = [Lo("tgt.lop.thanso", "thần số"), Lo("tgt.lop.con_giap", "con giáp"), Lo("tgt.lop.phong_thuy", "phong thuỷ"),
              Lo("tgt.lop.ngay_dep", "ngày đẹp")] + ([Lo("tgt.ten.tuvi", "Tử vi")] if tv_sinh else []) \
        + ([Lo("tgt.ten.battu", "Bát tự")] if bt_sinh else [])
    doan1 = [tom, Lo("tgt.c1.doan", "Mỗi tháng đọc theo {ds} và {cuoi}. Đây là nhịp gợi ý để sắp việc, không phải dự báo.",
                     ds=', '.join(lop_co[:-1]), cuoi=lop_co[-1])]
    c1 = kh.chuong("tom_tat", Lo("tgt.c1.td", "Ba tháng tới & năm {nam} tóm tắt", nam=nam), doan1, hop=_khong_trung_ma(hop1), tom_tat=tom,
                   cau_tu_soi=Lo("tgt.c1.soi", "Việc nào trong ba tháng tới bạn muốn làm cho xong trước?"))

    # ---- chương 2: 12 tháng tới
    noi_bat = thang_noi_bat(ts12 + tv12 + bt12)
    hop2 = noi_bat + thang12
    thuan = [h["thang"] for h in ts12 if h.get("so") in (1, 8)]
    hop_tuoi = [k for k, o in lop12.items() if o["con_giap"]["loai"] == "thuan"]
    doan2 = [Lo("tgt.c2.doan", "Mười hai tháng tới, mỗi tháng dương lịch một hộp ghép {n} cách xem: {ds}. "
                "Tử vi lấy tháng âm, Bát tự và con giáp lấy tháng theo tiết chứa ngày 15 của tháng.", n=len(lop_co), ds=', '.join(lop_co)),
             (Lo("tgt.c2.thuan", "Tháng hợp khởi sự hoặc lo chuyện tiền theo tháng cá nhân: {ds}.", ds=', '.join(_thang_hien(x) for x in thuan))
              if thuan else ""),
             (Lo("tgt.c2.hop_tuoi", "Tháng hợp tuổi bạn theo con giáp: {ds}.", ds=', '.join(_thang_hien(x) for x in hop_tuoi)) if hop_tuoi else ""),
             (Lo("tgt.c2.noi_bat", "Có {n} tháng Tử vi và Bát tự cùng một mức — đọc các hộp đầu chương trước.", n=len(noi_bat)) if noi_bat else ""),
             (Lo("tgt.c2.them_gio", "Thêm giờ sinh để mỗi tháng có thêm nhịp lá số Tử vi và Bát tự của riêng bạn.") if not tv_sinh else ""),
             Lo("tgt.c2.uu_tien", "Khi các cách nói khác nhau, ưu tiên lớp lớn hơn (mười năm, rồi năm) trước khi xét tháng.")]
    c2 = kh.chuong("muoi_hai_thang", Lo("tgt.c2.td", "12 tháng tới của bạn"), [x for x in doan2 if x], hop=_khong_trung_ma(hop2),
                   tom_tat=doan2[0], cau_tu_soi=Lo("tgt.c2.soi", "Tháng nào bạn muốn để dành cho việc quan trọng nhất năm?"))

    # ---- chương 3: năm đầy đủ
    nd_ts = " ".join(x for x in (ng.get("y_nghia"), Lo("tgt.c3.nen", "Nên: {x}", x=ng['nen']) if ng.get("nen") else "",
                                 Lo("tgt.c3.tranh", "Tránh: {x}", x=ng['tranh']) if ng.get("tranh") else "",
                                 Lo("tgt.c3.hay_gap", "Chuyện hay gặp: {x}", x=ng['hay_gap']) if ng.get("hay_gap") else "") if x)
    hop3 = [_gan(kh.hop("cot_loi", Lo("tgt.c3.ts_td", "Năm {nam}: năm cá nhân {so}", nam=nam, so=so_nam), nd_ts,
                        can_cu=[Lo("tgt.c3.ts_cu", "Năm cá nhân {so} = ngày + tháng sinh + năm {nam}, rút gọn", so=so_nam, nam=nam)],
                        ma=kh.ma_mau("thanso", "nam_day_du", f"so{so_nam}")), "thanso", so=so_nam)]
    can_cu3: list[str] = []
    for bc, nguon in ((tv, "tuvi"), (bt, "battu")):
        if bc:
            c = _chuong_cua(bc, "nam_nay")
            c = _doi_nam(c, nam) if nam_toi else c
            hop3 += _hop_nam(c, nguon)
            can_cu3 += c["can_cu"][:4]
            # SK-1 (2026-11-04): năm đích nằm trong "Năm nên chú ý sức khoẻ hơn" của chương Sức khoẻ (cùng hàm báo cáo)
            from app.luangiai import suc_khoe_nam as skn  # noqa: PLC0415
            sk = next((x for x in _chuong_cua(bc, "suc_khoe")["hop"]
                       if x.get("tieu_de") == skn.tieu_de_hop() and nam in (x.get("cac_nam") or [])), None)
            if sk:
                hop3.append(_gan(sk, nguon))
            # CY-1: năm đích nằm trong "Năm nên chú ý {mảng} hơn" của các chương mảng đời (cùng hàm báo cáo)
            from app.luangiai import chu_y_nam as cyn  # noqa: PLC0415
            for h_cy in [h for c in bc["chuong"] for h in c.get("hop") or [] if h.get("chu_y")]:
                x = cyn.hop_nam_dich(h_cy, nam)
                if x:
                    hop3.append(_gan(x, nguon))
    # CY-1: năm cá nhân của năm đích có chủ đề một mảng đời (KB chu_y_kb) → lời nhắc chủ động (không cần giờ sinh)
    from app.luangiai import chu_y_nam as cyn  # noqa: PLC0415
    if nam - ngay_sinh.year >= cyn.TUOI_TOI_THIEU:
        theo_ts = {m: cyn.thanso_nam({nam: so_nam}, m) for m in cyn.MANG_VAN_HAN}
        co_ts = [m for m, v in theo_ts.items() if v]
        if co_ts:
            h_ts = cyn.hop_chuong({m: theo_ts[m] for m in co_ts},
                                  kh.ma_mau("thanso", "nam_day_du", "chu_y", "+".join(co_ts), f"so{so_nam}"),
                                  lambda loai, td, nd, cu, ma, _w, **k: kh.hop(loai, td, nd, can_cu=cu, ma=ma, **k))
            if h_ts:
                hop3.append(_gan(h_ts, "thanso"))
    hop3 += cg_nam + hop_pt + _hop_tap_quan(tq, nam, True)
    doan3 = [Lo("tgt.c3.doan_du", "Năm {nam} ghép các lớp: năm cá nhân (thần số), lá số Tử vi và Bát tự của bạn chạy cho năm {nam}, con "
                "giáp và mệnh theo tuổi, góc nhà hợp bạn theo phong thuỷ, cùng tập quán theo tuổi.", nam=nam) if tv else
             Lo("tgt.c3.doan_gon", "Năm {nam} đọc theo năm cá nhân (thần số), con giáp và mệnh theo tuổi, góc nhà hợp bạn theo phong thuỷ và "
                "tập quán theo tuổi.", nam=nam),
             Lo("tgt.c3.them_gio", "Thêm giờ sinh để đọc thêm lá số Tử vi và Bát tự cho năm này.") if not tv else ""]
    c3 = kh.chuong("nam", Lo("tgt.c3.td", "Năm {nam} của bạn", nam=nam), [x for x in doan3 if x], hop=_khong_trung_ma(hop3),
                   tom_tat=Lo("tgt.c3.tom_du", "Cả năm {nam} nhìn từ ba cách xem và tập quán theo tuổi.", nam=nam) if tv
                   else Lo("tgt.c3.tom_gon", "Cả năm {nam} nhìn từ năm cá nhân và tập quán theo tuổi.", nam=nam),
                   can_cu=can_cu3, cau_tu_soi=Lo("tgt.c3.soi", "Nếu năm này chỉ làm tốt một việc, bạn chọn việc gì?"))

    # ---- chương 4: nên tránh & nên làm
    hop4: list[dict] = []
    for bc, nguon in ((tv, "tuvi"), (bt, "battu")):
        if bc:
            c = _chuong_cua(bc, "van_han")
            hop4 += [_gan(h, nguon) for h in c["hop"] if h.get("nam") == nam]
    if ng.get("tranh"):
        hop4.append(_gan(kh.hop("luu_y", Lo("tgt.c4.tranh_td", "Năm {nam} nên tránh: {x}", nam=nam, x=ng['tranh'].rstrip('.').lower()),
                                Lo("tgt.c4.tranh", "Năm cá nhân {so} dễ vấp ở chỗ {x}.", so=so_nam, x=ng['tranh'].rstrip('.').lower()),
                                huong_xu_ly=Lo("tgt.c4.nen", "Nên làm: {x}", x=ng.get('nen', Lo("tgt.c4.nen_md", "giữ nhịp đều, làm từng việc"))),
                                can_cu=[Lo("tgt.c4.cu", "Năm cá nhân {so}", so=so_nam)], ma=kh.ma_mau("thanso", "tranh", f"so{so_nam}")),
                         "thanso"))
    xung = [k for k, o in lop12.items() if o["con_giap"]["quan_he"] == "xung"]
    if xung:
        cg = next(iter(lop12.values()))
        xung_h = ', '.join(_thang_hien(x) for x in xung)
        hop4.append(_gan(kh.hop("luu_y", Lo("tgt.c4.xung_td", "Tháng xung tuổi {chi} trong 12 tháng tới: {ds}", chi=_tn.ten("chi", cg['chi_tuoi']), ds=xung_h),
                                Lo("tgt.c4.xung", "Theo con giáp, {ds} là tháng xung tuổi bạn — dân gian nhắc đi chậm với việc lớn.", ds=xung_h),
                                huong_xu_ly=Lo("tgt.c4.xung_viec", "Ký kết, chuyển nhà, khởi công nên đặt ngoài những tháng này; nếu buộc làm, chọn "
                                               "ngày đẹp trong tháng và đọc kỹ giấy tờ."),
                                can_cu=[Lo("tgt.c4.xung_cu", "Tháng theo tiết chứa ngày 15 có chi đối xung với tuổi {chi}", chi=_tn.ten("chi", cg['chi_tuoi']))],
                                ma=kh.ma_mau("tgt", "xung_thang", L.slug(cg["chi_tuoi"]))), "con_giap"))
    hn = tdg.han_nam_luan(nam)
    if ngon_ngu.la_viet():
        phuong = "; ".join(f"{x['ten']} ở {x['phuong']}" for x in hn["huong_tranh"])
        moc = hn["moc"]
    else:       # EN-ALL GĐ 8: tên hạn năm từ bản phủ KB tập quán, phương theo bảng tên; mốc tính lại ở câu tiếng Anh
        hk = nap.doc("tuoi_dan_gian_kb.json")["han_nam"]
        phuong = "; ".join(Lo("tgt.c4.han_o", "{ten} ở {ph}", ten=hk.get(x["ma"], {}).get("ten") or x["ten"], ph=_tn.ten("huong", x["phuong"]))
                           for x in hn["huong_tranh"])
        from app.luangiai.nam_tong_quan import _lap_xuan  # noqa: PLC0415
        moc = Lo("tgt.c4.moc", "Tính theo năm tiết khí từ Lập xuân ({ngay})", ngay=_ngay_ngan(_lap_xuan(nam)))
    hop4.append(_gan(kh.hop("luu_y", Lo("tgt.c4.han_td", "Năm {nam}: phương nên tránh động thổ lớn", nam=nam),
                            Lo("tgt.c4.han", "Theo tập quán, năm {cc} nên tránh khởi công, đục phá lớn ở các phương: {ph}.",
                               cc=_can_chi(hn['can_chi']), ph=phuong),
                            huong_xu_ly=Lo("tgt.c4.han_viec", "Nhà đang ở giữ nguyên; phía ấy giữ gọn gàng, yên tĩnh là đủ."),
                            can_cu=[moc], ma=kh.ma_mau("tgt", "han_nam")), "tap_quan"))
    doan4 = [Lo("tgt.c4.doan", "Những điều nên tránh và nên làm trong năm {nam}, gom từ các cách xem; mỗi điều có hướng xử lý ngay trong hộp.", nam=nam)]
    c4 = kh.chuong("nen_tranh", Lo("tgt.c4.td", "Năm {nam}: nên tránh & nên làm", nam=nam), doan4, hop=_khong_trung_ma(hop4), tom_tat=doan4[0],
                   cau_tu_soi=Lo("tgt.c4.soi_nay", "Điều gì năm nay bạn muốn làm chậm lại một nhịp?") if not nam_toi
                   else Lo("tgt.c4.soi_nam", "Điều gì năm {nam} bạn muốn làm chậm lại một nhịp?", nam=nam))

    from app.luangiai.toan_bo import diem_nhan, so_chu_chuong  # noqa: PLC0415
    ds = []
    for c in (c1, c2, c3, c4):
        c["moi_xem"] = {"diem_nhan": diem_nhan(c["doan"]), "cau_hoi": Lo(f"tgt.cau_hoi.{c['ma']}", CAU_HOI[c["ma"]]), "so_doan": len(c["doan"]),
                        "phut_doc": max(1, round(so_chu_chuong(c) / 200))}
        ds.append(c)
    bc = {"phien_ban": kh.PHIEN_BAN, "mo_dun": MO_DUN, "nam": nam, "cac_nam": cho_phep, "nam_toi": nam_toi,
          "ngay_xem": hom_nay.isoformat(), "thieu": thieu,
          "cot_loi": [], "chuong": ds,
          "nguon": Lo("tgt.nguon", "Thần số Pitago · Tử vi Nam phái · Bát tự Tử Bình · tập quán dân gian Việt Nam"),
          "trang_thai": "nhap_ai", "dien_dat": "mau",
          "ket": Lo("tgt.ket", "Đây là nhịp gợi ý để bạn tự sắp việc. Quyết định lớn vẫn dựa trên điều kiện thực tế của bạn.")}
    return kh.ap_hoc(bc, trong_so, ca_nhan)
