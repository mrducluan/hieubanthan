# -*- coding: utf-8 -*-
"""NT-1 — RULES Nhân tướng học: báo cáo "Gương mặt của bạn" (khuôn `doi_song_1`) + hỏi đáp theo bộ vị. Tất định, không LLM.

Đầu vào duy nhất: điều NGƯỜI DÙNG TỰ QUAN SÁT (`tra_loi` của khảo sát KB) — không ảnh, không nhận diện tự động trừ khi
người dùng tự bật "để máy đọc ảnh" (tầng NARRATIVE `doc_anh_mat`, mọi nhãn vẫn phải người dùng xác nhận). Tám chương:
Gương mặt bạn nói gì · Tính cách · Công việc & tiền · Tình cảm & gia đình · Sức khoẻ (SK-1) · Năm nay nhìn vào đâu (100 vị
lưu niên theo tuổi mụ) · Tướng và lá số (ngũ hình × hành Bát tự cần bù, hai cách) · Tướng tuỳ tâm sinh (việc 0 đồng).
Không điểm số, không "hung / xấu / hình khắc / thọ yểu", không xem tướng người khác. Mỗi hộp mang `phai` = trường phái
của đặc điểm (phiếu kiểm chứng ghi theo trường phái) và `ma_mau` tất định `ds.nhantuong.<chương>.<đặc điểm>`.
"""
from __future__ import annotations

import datetime as dt
import re

from app import config
from app.calc import lunar
from app.calc import nhan_tuong as calc
from app.calc import tuoi_dan_gian as tdg
from app import ngon_ngu
from app.kb import nhan_tuong_kb as kb
from app.kb import ten as _tn
from app.kb.loi import L, danh_sach
from app.luangiai import doi_song_khuon as kh
from app.luangiai import tuoi_dan_gian as tdg_luan

MO_DUN = "nhantuong"
PHAI_CHUNG = "nhan_tuong_tong_hop"
TOI_DA_HOP = 6
TOI_DA_COT_LOI = 4
SO_NAM_TOI = 3
TEN_HANH = {"kim": "Kim", "moc": "Mộc", "thuy": "Thủy", "hoa": "Hỏa", "tho": "Thổ"}
_TZ = config.TZ_LICH_AM["viet"]

_BRIDGES_EN: dict[str, dict[str, str]] = {
    "thuy": {
        "ten_en": "Water Archetype",
        "hanh_en": "Water",
        "mat_tich_cuc": "Perceptive, adaptable, and calm under pressure; listens deeply and finds flexible paths through complexity.",
        "mat_tieu_cuc": "Watch for lingering hesitation, quiet worry, or withdrawing emotionally instead of voicing needs directly.",
    },
    "moc": {
        "ten_en": "Wood Archetype",
        "hanh_en": "Wood",
        "mat_tich_cuc": "Forward-looking, decisive, and action-oriented; natural at organizing momentum and driving projects ahead.",
        "mat_tieu_cuc": "Watch for impatience with slower pacing, overcommitting to goals, or running into sustained tension.",
    },
    "hoa": {
        "ten_en": "Fire Archetype",
        "hanh_en": "Fire",
        "mat_tich_cuc": "Warm, expressive, and energizing; connects easily with people and sparks enthusiasm around new ideas.",
        "mat_tieu_cuc": "Watch for quick mood swings, losing steam on repetitive follow-through, or overpromising in excitement.",
    },
    "tho": {
        "ten_en": "Earth Archetype",
        "hanh_en": "Earth",
        "mat_tich_cuc": "Steady, reliable, and supportive; builds trust over time and keeps teams and family grounded.",
        "mat_tieu_cuc": "Watch for taking on others' worries at the expense of personal boundaries or resisting helpful routine shifts.",
    },
    "kim": {
        "ten_en": "Metal Archetype",
        "hanh_en": "Metal",
        "mat_tich_cuc": "Self-reliant, structured, and discerning; holds clear standards and executes work with precision.",
        "mat_tieu_cuc": "Watch for being overly strict with yourself or others, hesitating to ask for help, or seeming distant.",
    },
}


def _phuong_tay_bridges(nh: dict, so_do_mat: dict | None = None) -> dict:
    """Tổng hợp góc nhìn Ngũ Hành Lillian Bridges (phương Tây / Y học cổ truyền) và đối chiếu Đông – Tây."""
    from app.calc import tuong_fuzzy  # noqa: PLC0415
    from app.kb import tuong_hoc_dot4_kb  # noqa: PLC0415

    vi = ngon_ngu.la_viet()
    fuzzy = tuong_fuzzy.cau_noi_nhan_tuong(so_do_mat) if so_do_mat else None
    if fuzzy:
        hanh = fuzzy["ngu_hanh_bridges"]["hanh"]
    elif nh.get("hinh") in TEN_HANH:
        hanh = nh["hinh"]
    elif nh.get("troi") and nh["troi"][0] in TEN_HANH:
        hanh = nh["troi"][0]
    else:
        hanh = "tho"

    b_kb = tuong_hoc_dot4_kb.tra_ngu_hanh_bridges(hanh) or {}
    b_en = _BRIDGES_EN[hanh]
    ten_vi = b_kb.get("ten") or f"Tướng {TEN_HANH[hanh]} ({b_en['ten_en']})"
    ten_en = b_en["ten_en"]
    nghia = (tuong_fuzzy._NGHIA_DOI_THUONG_MAT_VI[hanh] if vi else tuong_fuzzy._NGHIA_DOI_THUONG_MAT_EN[hanh])
    tich_cuc = (b_kb.get("mat_tich_cuc") or nghia) if vi else b_en["mat_tich_cuc"]
    tieu_cuc = (b_kb.get("mat_tieu_cuc_can_chu_y") or "") if vi else b_en["mat_tieu_cuc"]
    nguon = ("Lillian Bridges — Face Reading in Chinese Medicine (tóm ý biên tập)" if vi
             else "Lillian Bridges — Face Reading in Chinese Medicine (editorial summary)")

    hanh_dong = nh.get("hinh")
    kb_dong = kb.ngu_hinh().get(hanh_dong) or kb.ngu_hinh()["pha"]
    ten_dong = kb_dong.get("ten", str(hanh_dong))
    if hanh_dong == hanh:
        trang_thai = "dong_thuan"
        dong_thuan = (
            f"Đông – Tây đồng thuận: cả Ngũ Hình cổ truyền ({ten_dong}) và Ngũ Hành Lillian Bridges ({ten_vi}) cùng chỉ về hành {TEN_HANH[hanh]}."
            if vi else
            f"East–West alignment: both Classical Five-Shape ({ten_dong}) and Lillian Bridges ({ten_en}) point to the {b_en['hanh_en']} element."
        )
    elif hanh_dong not in TEN_HANH:
        trang_thai = "bo_tro"
        dong_thuan = (
            f"Đông – Tây bổ trợ: Ngũ Hình cổ truyền cho thấy dáng mặt pha nhiều nét, trong khi góc nhìn Lillian Bridges nổi bật hướng {ten_vi}."
            if vi else
            f"East–West complement: Classical Five-Shape shows a blended form, while the Lillian Bridges lens highlights {ten_en}."
        )
    else:
        trang_thai = "bo_tro"
        dong_thuan = (
            f"Đông – Tây bổ trợ: Ngũ Hình cổ truyền nghiêng về {ten_dong}, còn góc nhìn Lillian Bridges nổi bật {ten_vi} — hai hệ bổ sung sắc thái cho nhau."
            if vi else
            f"East–West complement: Classical Five-Shape leans toward {ten_dong}, while Lillian Bridges highlights {ten_en} — both lenses add nuance."
        )

    kq = {
        "hanh": hanh,
        "ten_vi": ten_vi,
        "ten_en": ten_en,
        "nghia_doi_thuong": nghia,
        "mat_tich_cuc": tich_cuc,
        "mat_tieu_cuc": tieu_cuc,
        "dong_thuan_dong_tay": dong_thuan,
        "trang_thai_dong_thuan": trang_thai,
        "do_tin": tuong_fuzzy.DO_TIN,
        "nguon": nguon,
    }
    if fuzzy is not None:
        kq["fuzzy_bridge"] = fuzzy
    return kq


# ------------------------------------------------------------------ tiện ích
def _nam_am(d: dt.date) -> int:
    return lunar.solar_to_lunar(d.day, d.month, d.year, _TZ)[2]


def _nhan_lua_chon(q: str, a: str) -> str:
    c = kb.cau_hoi_theo_ma().get(q) or {}
    return next((l["nhan"] for l in c.get("lua_chon", []) if l["ma"] == a), a)


def _can_cu_sach(dd: dict) -> str | None:
    s = dd.get("sach") or {}
    ten = kb.ten_nguon(s.get("nguon"))
    if s.get("trich"):
        if not ngon_ngu.la_viet():      # EN-ALL GĐ 8: bản Anh dẫn chữ Hán + ý (không phiên âm Hán Việt)
            han = f"“{s['han']}” " if s.get("han") else ""
            return L("nt.sach_trich", "Sách: {han}({ten}){y}", han=han, ten=ten, y=f" — {s['y']}" if s.get("y") else "")
        han = f"{s['han']} — " if s.get("han") else ""          # KT-NT: nguyên văn chữ Hán đã đối chiếu kho nguồn
        return f"Sách: “{han}{s['trich']}” ({ten}){' — ' + s['y'] if s.get('y') else ''}"
    if s.get("y"):
        return L("nt.sach_y", "Sách ({ten}): {y}", ten=ten, y=s["y"])
    return L("nt.nguon", "Nguồn: {ten}", ten=ten)


def _hop_tu_dac_diem(ma: str, dd: dict, chuong: str, tl: dict) -> dict:
    bv = kb.bo_vi().get(dd["bo_vi"]) or {}
    loai = "diem_manh" if dd.get("muc") == "thuan" else "luu_y" if dd.get("muc") == "can_chu_dong" else "cot_loi"
    quan_sat = "; ".join(f"{(kb.cau_hoi_theo_ma().get(q) or {}).get('hoi', q)} → “{_nhan_lua_chon(q, tl[q])}”"
                         for q in dd.get("dieu_kien", {}) if q in tl)
    can_cu = [L("nt.tu_quan_sat", "{ten} — bạn tự quan sát: {qs}", ten=bv.get('ten', dd['bo_vi']), qs=quan_sat) if quan_sat
              else bv.get("ten", ""), _can_cu_sach(dd)]
    h = kh.hop(loai, dd["tieu_de"], dd["noi_dung"], huong_xu_ly=dd.get("viec"), can_cu=[c for c in can_cu if c],
               ma=kh.ma_mau(MO_DUN, chuong, ma), muc=dd.get("muc"), phai=dd.get("truong_phai") or PHAI_CHUNG,
               bo_vi=dd["bo_vi"], vung=bv.get("vung"), he=dd.get("he"))
    return h


def _chuong_tu_dac_diem(ma_chuong: str, khop: list[str], tl: dict) -> tuple[list[dict], list[str], str | None]:
    """(hộp ≤ TOI_DA_HOP, đoạn cho phần còn lại, mức gộp) của một chương từ danh sách đặc điểm khớp."""
    dds = [(m, kb.dac_diem()[m]) for m in khop if ma_chuong in kb.dac_diem()[m].get("chuong", [])]
    hop = [_hop_tu_dac_diem(m, dd, ma_chuong, tl) for m, dd in dds[:TOI_DA_HOP]]
    doan = [f"{dd['tieu_de']}: {dd['noi_dung']}" for _, dd in dds[TOI_DA_HOP:]]
    return hop, doan, calc.gop_muc([dd.get("muc") for _, dd in dds])


def _ten_bo_vi(ma: str) -> str:
    return (kb.bo_vi().get(ma) or {}).get("ten", ma)


# ------------------------------------------------------------------ từng chương
def _chuong_tong_quan(tl: dict, khop: list[str], nh: dict, pt_bridges: dict | None = None) -> dict:
    kbh = kb.ngu_hinh().get(nh["hinh"]) or kb.ngu_hinh()["pha"]
    diem = ", ".join(f"{_tn.ten('hanh', TEN_HANH[h])} {d}" for h, d in nh["diem"].items() if d)
    hop_nh = kh.hop("cot_loi", L("nt.dang_mat", "Dáng mặt: {ten}", ten=kbh['ten']), kbh["loi"], huong_xu_ly=kbh.get("viec"),
                    can_cu=[L("nt.dau_hieu", "Dấu hiệu {ten}: {dh}", ten=kbh['ten'], dh=kbh['dau_hieu']),
                            L("nt.diem_ngu_hinh", "Điểm theo bảng ngũ hình công khai: {diem}",
                              diem=diem or L("nt.diem_chua", "chưa có nét nào tính được")),
                            L("nt.sach_hop", "Sách: {y} ({ten})", ten=kb.ten_nguon(kbh.get('nguon')), y=kbh['hop'])],
                    ma=kh.ma_mau(MO_DUN, "tong_quan", "ngu_hinh", nh["hinh"]), phai="tam_dinh_ngu_quan", bo_vi="khuon_mat",
                    vung="toan_mat", hanh=kbh.get("hanh"))
    hop_dau = [hop_nh]
    if pt_bridges:
        from app.calc import tuong_fuzzy  # noqa: PLC0415
        vi = ngon_ngu.la_viet()
        ten_b = pt_bridges["ten_vi"] if vi else pt_bridges["ten_en"]
        tieu_de_dt = f"Góc nhìn Đông – Tây: {ten_b}" if vi else f"East–West Synthesis: {ten_b}"
        noi_dung_dt = f"{pt_bridges['dong_thuan_dong_tay']} {pt_bridges['nghia_doi_thuong']} {pt_bridges['mat_tich_cuc']}".strip()
        hop_dau.append(kh.hop(
            "cot_loi", tieu_de_dt, noi_dung_dt,
            huong_xu_ly=pt_bridges.get("mat_tieu_cuc") or None,
            can_cu=[pt_bridges["nguon"], tuong_fuzzy.GHI_CHU_VI if vi else tuong_fuzzy.GHI_CHU_EN],
            ma=kh.ma_mau(MO_DUN, "tong_quan", "dong_tay", pt_bridges["hanh"]),
            phai=PHAI_CHUNG, bo_vi="khuon_mat", vung="toan_mat", hanh=pt_bridges["hanh"],
        ))
    hop, doan, muc = _chuong_tu_dac_diem("tong_quan", khop, tl)
    c = kb.chuong()["tong_quan"]
    so = len(tl)
    tom_tat = kb.mau("muc_chuong", muc) if muc else kb.mau("khong_dau_hieu")
    return kh.chuong("tong_quan", c["tieu_de"], [str(kb.mau("mo_dau")).replace("{so}", str(so)), *doan],
                     hop=[*hop_dau, *hop][:TOI_DA_HOP + len(hop_dau)], muc=muc, tom_tat=tom_tat, cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("nt.soi.tong_quan", "Trong những nét sách xưa gọi là 'thuận', nét nào bạn đã thật sự dùng được trong năm qua?"))


def _chuong_thuong(ma: str, tl: dict, khop: list[str], cau_tu_soi: str, co_muc: bool = True) -> dict:
    hop, doan, muc = _chuong_tu_dac_diem(ma, khop, tl)
    c = kb.chuong()[ma]
    thieu = None
    if not hop:
        # Chưa trả lời câu nào về các bộ vị của chương → ghi "thiếu" (web mời bổ sung), không vỡ.
        # EN-ALL GĐ 8: chọn 4 bộ vị theo thứ tự tên bản Việt (bản Việt quyết), hiện tên theo ngôn ngữ.
        bv4 = ngon_ngu.theo_viet(lambda: [b for _, b in sorted({(_ten_bo_vi(dd["bo_vi"]), dd["bo_vi"]) for dd in kb.dac_diem().values()
                                                                 if ma in dd.get("chuong", [])})][:4])()
        ten = ", ".join(_ten_bo_vi(b) for b in bv4)
        thieu = str(kb.mau("thieu")).replace("{ten}", ten)
    tom_tat = (kb.mau("muc_chuong", muc) if muc else kb.mau("khong_dau_hieu")) if hop else None
    return kh.chuong(ma, c["tieu_de"], doan or ([] if hop else [thieu]), hop=hop, muc=muc if co_muc else None,
                     tom_tat=tom_tat, cau_hoi=c["cau_hoi"], cau_tu_soi=cau_tu_soi, thieu=thieu)


def _chuong_suc_khoe(tl: dict, khop: list[str]) -> dict:
    hop, doan, muc = _chuong_tu_dac_diem("suc_khoe", khop, tl)
    c = kb.chuong()["suc_khoe"]
    he = []
    for h in hop:
        if h.get("he") and h["he"] not in he:
            he.append(h["he"])
    from app.kb import suc_khoe_kb  # noqa: PLC0415 — SK-1: tên hệ cơ quan một nguồn
    ten_he = [((suc_khoe_kb.he_hanh(x) or {}).get("he") or x) for x in he]
    if ten_he:
        hop.insert(0, kh.hop("cot_loi", L("nt.he.tieu_de", "Hệ cơ quan nên chăm hơn"),
                             L("nt.he.noi_dung", "Theo các vùng sắc bạn thấy, sách xưa nhắc chăm: {he}. "
                               "Đây là lời phòng ngừa — có triệu chứng thì đi khám, không chờ xem tướng.", he=', '.join(ten_he)),
                             huong_xu_ly=L("nt.he.viec", "Đặt lịch khám tổng quát trong 3 tháng tới, nói với bác sĩ điều bạn đang để ý."),
                             can_cu=[L("nt.he.can_cu", "Nội Kinh (Linh Khu, Ngũ Sắc thiên): mỗi vùng mặt ứng một tạng — {he}", he="; ".join(ten_he))],
                             ma=kh.ma_mau(MO_DUN, "suc_khoe", "he", *sorted(he)), phai="y_tuong", bo_vi="khuon_mat", vung="toan_mat"))
    tom_tat = (kb.mau("muc_chuong", muc) if muc else kb.mau("khong_dau_hieu")) if hop else None
    thieu = None if hop else str(kb.mau("thieu")).replace("{ten}", L("nt.thieu_sk", "sắc da, Ấn Đường, dưới mắt, đầu mũi, môi"))
    return kh.chuong("suc_khoe", c["tieu_de"], [str(kb.mau("suc_khoe_mo")), *doan] if hop else [str(kb.mau("suc_khoe_mo")), thieu],
                     hop=hop[:TOI_DA_HOP + 1], muc=muc, tom_tat=tom_tat, cau_hoi=c["cau_hoi"], mien_tru=str(kb.mau("suc_khoe_mien_tru")),
                     cau_tu_soi=L("nt.soi.suc_khoe", "Một thói quen nào trong 30 ngày qua bạn biết là đang làm sắc mặt mình xỉn đi?"), thieu=thieu)


def _quan_sat_vung(bo_vi: str, tl: dict) -> list[str]:
    """Các lựa chọn người dùng đã trả lời cho bộ vị (để chương Năm nay kể lại)."""
    ra = []
    for c in kb.cau_hoi():
        if c["bo_vi"] == bo_vi and c["ma"] in tl:
            ra.append(f"{c['hoi'].rstrip('?')}: “{_nhan_lua_chon(c['ma'], tl[c['ma']])}”")   # (câu KB đã theo ngôn ngữ)
    return ra


def _muc_vung(bo_vi: str, khop: list[str]) -> str | None:
    return calc.gop_muc([kb.dac_diem()[m].get("muc") for m in khop if kb.dac_diem()[m]["bo_vi"] == bo_vi])


def _can_cu_luu_nien(tuoi: int, ln: dict) -> str:
    return L("nt.can_cu_luu_nien", "Lưu niên vận khí bộ vị: tuổi {tuoi} → vị {vt} ({ten}). {gioi}", tuoi=tuoi, vt=ln["vi"], ten=ln['ten'],
             gioi=kb.mau('nhan_gioi_ben'))


def luu_nien_nam(tuoi_mu: int, gioi_tinh: str | None, tl: dict, khop: list[str], nam: int | None = None) -> dict | None:
    ln = calc.luu_nien(tuoi_mu, gioi_tinh)
    if not ln:
        return None
    bv = kb.bo_vi().get(ln["bo_vi"]) or {}
    return {**ln, "nam": nam, "ten_bo_vi": bv.get("ten", ln["bo_vi"]), "vung": bv.get("vung"), "vi_tri": bv.get("vi_tri", ""),
            "nhan_ben": kb.mau("nhan_ben", ln["ben"]) or "", "quan_sat": _quan_sat_vung(ln["bo_vi"], tl), "muc": _muc_vung(ln["bo_vi"], khop),
            "bai_ca": kb.bai_ca_luu_nien(tuoi_mu)}    # WS-4: câu bài ca lưu niên của sách cho đúng tuổi


def _chuong_nam_nay(tl: dict, khop: list[str], nam_sinh: dt.date | int | None, gioi_tinh: str | None, ngay_xem: dt.date) -> dict:
    c = kb.chuong()["nam_nay"]
    if nam_sinh is None:
        return kh.chuong("nam_nay", c["tieu_de"], [str(kb.mau("luu_nien_giai_thich")),
                                                    L("nt.nam_nay.can_nam_sinh", "Chương này cần năm sinh — thêm ngày sinh vào hồ sơ để biết năm nay sách xem ở vùng nào.")],
                         cau_hoi=c["cau_hoi"], thieu=L("nt.thieu.nam_sinh", "Cần năm sinh."))
    if isinstance(nam_sinh, dt.date):
        ns_am = tdg_luan.nam_am_sinh(nam_sinh.year, nam_sinh.month, nam_sinh.day)
    else:
        ns_am = int(nam_sinh)
    nam_xem_am = _nam_am(ngay_xem)
    tuoi = tdg.tuoi_mu(ns_am, nam_xem_am)
    nay = luu_nien_nam(tuoi, gioi_tinh, tl, khop, nam_xem_am)
    toi = [luu_nien_nam(tuoi + i, gioi_tinh, tl, khop, nam_xem_am + i) for i in range(1, SO_NAM_TOI + 1)]
    toi = [x for x in toi if x]
    if not nay:
        return kh.chuong("nam_nay", c["tieu_de"], [str(kb.mau("luu_nien_giai_thich"))], cau_hoi=c["cau_hoi"],
                         thieu=L("nt.thieu.tuoi", "Tuổi ngoài bảng."))
    hop = []
    if nay["quan_sat"]:
        noi_dung = str(kb.mau("nam_nay")).format(tuoi=tuoi, ten=nay["ten"], vung=nay["ten_bo_vi"], ben=nay["nhan_ben"], quan_sat="; ".join(nay["quan_sat"]))
    else:
        noi_dung = str(kb.mau("nam_nay_khong_quan_sat")).format(tuoi=tuoi, ten=nay["ten"], vung=nay["ten_bo_vi"], ben=nay["nhan_ben"])
    if nay["muc"]:
        noi_dung += " " + str(kb.mau("nam_nay_muc", nay["muc"]))
    hop.append(kh.hop("thoi_diem", L("nt.nam_nay.tieu_de", "Năm {nam} nhìn vào {vung}", nam=nam_xem_am, vung=nay['ten_bo_vi']), noi_dung, muc=nay["muc"],
                      can_cu=[_can_cu_luu_nien(tuoi, nay),
                              L("nt.tuoi_mu", "Tuổi mụ = năm âm đang xem ({nam}) − năm sinh âm ({ns}) + 1.", nam=nam_xem_am, ns=ns_am)]
                      + ([L("nt.bai_ca", "Sách xưa — {sach}: «{han}» {y}", sach=nay['bai_ca']['sach'], han=nay['bai_ca']['han'], y=nay['bai_ca']['y'])]
                         if nay.get("bai_ca") else []),
                      ma=kh.ma_mau(MO_DUN, "nam_nay", nay["bo_vi"], nay["muc"] or "khong"), phai="tam_dinh_ngu_quan",
                      bo_vi=nay["bo_vi"], vung=nay["vung"], nam=nam_xem_am, tu_tuoi=tuoi, den_tuoi=tuoi))
    doan = [str(kb.mau("luu_nien_giai_thich")),
            L("nt.ba_nam_toi", "Ba năm tới: ") + " ".join(str(kb.mau("nam_toi")).format(nam=x["nam"], tuoi=x["tuoi"], ten=x["ten"], vung=x["ten_bo_vi"] + x["nhan_ben"]) for x in toi)]
    return kh.chuong("nam_nay", c["tieu_de"], doan, hop=hop, cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("nt.soi.nam_nay", "Vùng của năm nay, bạn đã chăm nó thế nào trong tháng qua?"),
                     luu_nien={"nam_nay": nay, "toi": toi, "tuoi_mu": tuoi, "nam_am_xem": nam_xem_am})


def _quan_he_hanh(hinh: str, can: str) -> str:
    sinh = kb.ngu_hanh_sinh()
    if hinh == can:
        return "trung"
    if sinh.get(hinh) == can:
        return "sinh"
    if sinh.get(can) == hinh:
        return "duoc_sinh"
    khac = {"Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim", "Kim": "Mộc"}
    if khac.get(hinh) == can:
        return "khac"
    if khac.get(can) == hinh:
        return "bi_khac"
    return "trung_tinh"


def _chuong_tuong_la_so(nh: dict, battu: dict | None) -> dict:
    c = kb.chuong()["tuong_va_la_so"]
    if not battu:
        return kh.chuong("tuong_va_la_so", c["tieu_de"], [str(kb.mau("la_so_thieu"))], cau_hoi=c["cau_hoi"],
                         thieu=L("nt.thieu.gio_sinh", "Cần giờ sinh (Bát tự)."))
    hanh_hinh = TEN_HANH.get(nh["hinh"])
    if not hanh_hinh:
        return kh.chuong("tuong_va_la_so", c["tieu_de"], [str(kb.mau("la_so_pha"))], cau_hoi=c["cau_hoi"])
    hop = []
    for ma_cach, ten in (("cach_1", L("nt.cach_1", "cân sức (phù ức + điều hậu)")), ("cach_2", L("nt.cach_2", "theo tháng sinh (cách cục)"))):
        can = [h for h in (battu.get(ma_cach) or {}).get("hanh") or [] if h]
        if not can:
            continue
        qh = [_quan_he_hanh(hanh_hinh, h) for h in can]
        tot = "trung" if "trung" in qh else "sinh" if "sinh" in qh else "duoc_sinh" if "duoc_sinh" in qh else qh[0]
        loi = {"trung": "la_so_trung", "sinh": "la_so_sinh", "duoc_sinh": "la_so_trung_tinh", "khac": "la_so_khac",
               "bi_khac": "la_so_bi_khac", "trung_tinh": "la_so_trung_tinh"}[tot]
        can_hien = ", ".join(_tn.ten("hanh", h) for h in can)
        hinh_hien = _tn.ten("hanh", hanh_hinh)
        noi_dung = str(kb.mau("la_so_hop")).format(hinh=hinh_hien, cach=ten, can=can_hien, quan_he=kb.mau(loi))
        hop.append(kh.hop("cot_loi", L("nt.la_so.tieu_de", "Cách {so}: dáng {hinh} với hành cần bù {can}", so=ma_cach[-1], hinh=hinh_hien, can=can_hien),
                          noi_dung,
                          can_cu=[L("nt.la_so.can_cu", "Ngũ hình: {hinh} (bảng điểm công khai). Dụng thần Bát tự cách {so}: {can} — hai cách luôn trình bày, không tự chọn.",
                                    hinh=hinh_hien, so=ma_cach[-1], can=can_hien)],
                          ma=kh.ma_mau(MO_DUN, "tuong_va_la_so", ma_cach, hanh_hinh, tot), phai="tam_dinh_ngu_quan", bo_vi="khuon_mat", vung="toan_mat"))
    doan = [L("nt.la_so.doan", "Sách tướng dặn: hình là tiên thiên hiện ra ngoài, hành lá số cần là chỗ còn thiếu bên trong — hai bên hợp nhau thì nhẹ, "
              "ngược nhau thì bù bằng thói quen (màu mặc, việc làm, nhịp sống) chứ không bù bằng cách đổi gương mặt.")]
    return kh.chuong("tuong_va_la_so", c["tieu_de"], doan, hop=hop, cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("nt.soi.la_so", "Thói quen nào của bạn đang 'bù' cho điều lá số nói là thiếu?"))


def _chuong_loi_khuyen(tl: dict, khop: list[str]) -> dict:
    c = kb.chuong()["loi_khuyen"]
    hop, da = [], set()
    for m in khop:
        dd = kb.dac_diem()[m]
        v = dd.get("viec")
        if not v or v in da:
            continue
        da.add(v)
        uu = dd.get("muc") == "can_chu_dong" or "loi_khuyen" in dd.get("chuong", [])
        hop.append((0 if uu else 1, kh.hop("loi_khuyen", v, L("nt.tu_net", "Từ nét “{ten}”.", ten=dd['tieu_de']), can_cu=[_can_cu_sach(dd) or ""],
                                           ma=kh.ma_mau(MO_DUN, "loi_khuyen", m), phai=dd.get("truong_phai") or PHAI_CHUNG,
                                           bo_vi=dd["bo_vi"], vung=(kb.bo_vi().get(dd["bo_vi"]) or {}).get("vung"))))
    hop = [h for _, h in sorted(hop, key=lambda x: x[0])][:7]
    return kh.chuong("loi_khuyen", c["tieu_de"], [str(kb.mau("loi_khuyen_mo"))], hop=hop, cau_hoi=c["cau_hoi"],
                     cau_tu_soi=L("nt.soi.loi_khuyen", "Chọn MỘT việc ở trên làm trong 21 ngày — việc nào bạn thấy dễ nhất?"))


# ------------------------------------------------------------------ báo cáo
def bao_cao(tra_loi: dict | None, *, nam_sinh: dt.date | int | None = None, gioi_tinh: str | None = None,
            ngay_xem: dt.date | None = None, battu: dict | None = None, trong_so: dict | None = None,
            ca_nhan: dict | None = None, so_do_mat: dict | None = None) -> dict:
    """Báo cáo khuôn `doi_song_1`. `battu` = kết quả `battu_doi_song.phan_tich` (chỉ đọc `cach_1/cach_2.hanh`) — tuỳ chọn.
    `so_do_mat` = số đo hình học từ `nhan_tuong_do.do_mat` (tuỳ chọn) để ghép cầu nối Ngũ Hành Lillian Bridges."""
    ngay_xem = ngay_xem or config.hom_nay_vn()
    tl = calc.tra_loi_sach(tra_loi)
    khop = calc.khop_dac_diem(tl)
    nh = calc.ngu_hinh(tl)
    pt_bridges = _phuong_tay_bridges(nh, so_do_mat)
    chuong = [
        _chuong_tong_quan(tl, khop, nh, pt_bridges),
        _chuong_thuong("con_nguoi", tl, khop, L("nt.soi.con_nguoi", "Người thân thiết nhất sẽ gật đầu với nét nào, lắc đầu với nét nào?"), co_muc=False),
        _chuong_thuong("cong_viec_tien", tl, khop, L("nt.soi.cong_viec_tien", "Nét 'giữ của' hay 'tiêu nhanh' — tháng vừa rồi bạn thấy mình ở đâu?")),
        _chuong_thuong("tinh_cam_gia_dinh", tl, khop, L("nt.soi.tinh_cam", "Một người trong nhà mà bạn đã lâu chưa nhìn thẳng vào mắt — là ai?")),
        _chuong_suc_khoe(tl, khop),
        _chuong_nam_nay(tl, khop, nam_sinh, gioi_tinh, ngay_xem),
        _chuong_tuong_la_so(nh, battu),
        _chuong_loi_khuyen(tl, khop),
    ]
    thu_tu = kb.thu_tu_chuong()
    chuong.sort(key=lambda c: thu_tu.index(c["ma"]) if c["ma"] in thu_tu else 99)
    # Điều quan trọng nhất: hộp ưu tiên cao nhất (đặc điểm nhiều điều kiện / mức rõ) + năm nay; tham chiếu lại trong chương.
    uu = []
    for c in chuong:
        for h in c.get("hop", []):
            if c["ma"] in ("loi_khuyen", "tuong_va_la_so"):
                continue
            diem = (2 if h.get("muc") in ("thuan", "can_chu_dong") else 0) + (1 if h["loai"] == "thoi_diem" else 0) + (1 if c["ma"] == "tong_quan" else 0)
            uu.append((-diem, len(uu), {**h, "tu_chuong": c["ma"], "loai_goc": h["loai"], "loai": "cot_loi"}))
    cot_loi = [h for _, _, h in sorted(uu)[:TOI_DA_COT_LOI]]
    ban_do = {}
    for m in khop:
        dd = kb.dac_diem()[m]
        v = (kb.bo_vi().get(dd["bo_vi"]) or {}).get("vung")
        if v:
            ban_do.setdefault(v, []).append(dd.get("muc") or "trung_tinh")
    bc = {"mo_dun": MO_DUN, "phien_ban": kh.PHIEN_BAN, "phai": PHAI_CHUNG, "trang_thai": kb.meta()["trang_thai"],
          "ten": L("nt.ten_bao_cao", "Gương mặt của bạn"), "cot_loi": cot_loi, "chuong": chuong, "ket": str(kb.mau("ket")),
          "thieu": [c["thieu"] for c in chuong if c.get("thieu")],
          "da_tinh": {"so_cau": len(tl), "so_dac_diem": len(khop), "dac_diem": khop, "ngu_hinh": {**nh, "ten": (kb.ngu_hinh().get(nh["hinh"]) or {}).get("ten")},
                      "phuong_tay_bridges": pt_bridges,
                      "ban_do": {v: calc.gop_muc([x for x in ds if x != "trung_tinh"]) or "trung_tinh" for v, ds in ban_do.items()},
                      "ngay_xem": ngay_xem.isoformat()}}
    kh.ap_hoc(bc, trong_so, ca_nhan)
    # SX-C: câu Thần Tướng Toàn Biên gắn với đúng các nét đã chọn (đã nói giảm; chưa đủ 18 tuổi bỏ nhóm C).
    from app.luangiai import sach_ghi_mon  # noqa: PLC0415
    bc["sach_ghi"] = sach_ghi_mon.nhan_tuong(khop, sach_ghi_mon.tuoi_tu(nam_sinh, ngay_xem), gioi_tinh)
    return bc


luan_giai = bao_cao


# ------------------------------------------------------------------ khảo sát (cho web)
def khao_sat() -> dict:
    """Bộ câu hỏi + bước + bộ vị (vùng vẽ) — web chỉ hiển thị. Không có gì để tính ở đây."""
    bv = {ma: {k: v for k, v in x.items() if k in ("ten", "han", "vi_tri", "vung", "cung", "nghia")} for ma, x in kb.bo_vi().items()}
    return {"buoc": kb.buoc(), "cau_hoi": kb.cau_hoi(), "bo_vi": bv, "cung": kb.cung(),
            "truong_phai": {k: {"ten": v["ten"], "ngan": v["ngan"], "mo_ta": v["mo_ta"]} for k, v in kb.truong_phai().items()},
            "ngu_hinh": {k: {"ten": v["ten"], "hanh": v["hanh"], "dau_hieu": v["dau_hieu"]} for k, v in kb.ngu_hinh().items()},
            # ANH-2: danh sách điểm mốc để web vẽ bước chấm điểm (đo do CALC nhan_tuong_do làm, web không tính).
            "diem_do": {k: kb.do_anh().get(k) for k in ("nhom", "diem", "diem_nghieng")}}


# ------------------------------------------------------------------ hỏi đáp
_TUOI = re.compile(r"(?<!\d)(?:tuoi|nam nay toi|toi)\s*(\d{1,3})\s*(?:tuoi)?(?!\d)")
_TUOI2 = re.compile(r"(\d{1,3})\s*tuoi")


def _tuoi_mu_tu_ho_so(nam_sinh: dt.date | int | None, ngay_xem: dt.date | None) -> int | None:
    """Tuổi mụ của người hỏi từ hồ sơ (không gõ số): năm âm đang xem − năm sinh âm + 1."""
    if nam_sinh is None:
        return None
    ns_am = tdg_luan.nam_am_sinh(nam_sinh.year, nam_sinh.month, nam_sinh.day) if isinstance(nam_sinh, dt.date) else int(nam_sinh)
    return tdg.tuoi_mu(ns_am, _nam_am(ngay_xem or config.hom_nay_vn()))


def _khop_tu_khoa(t: str, bang: dict) -> str | None:
    """Khoá có từ khoá dài nhất xuất hiện trong câu (so câu đã bỏ dấu, có khoảng trắng hai đầu)."""
    tot, dai = None, 0
    for ma, ds in bang.items():
        for k in ds:
            k2 = k.strip()
            if re.search(rf"(?<![a-z]){re.escape(k2)}(?![a-z])", t) and len(k2) > dai:
                tot, dai = ma, len(k2)
    return tot


def _HT_AN_DUONG() -> str:  # noqa: N802
    return L("nt.hoi.tiep.an_duong", "Ấn Đường rộng nghĩa là gì?")


def _HT_NAM_NAY() -> str:  # noqa: N802
    return L("nt.hoi.tiep.nam_nay", "Năm nay tuổi của tôi xem ở đâu?")


def hoi(cau: str, tra_loi: dict | None = None, *, nam_sinh: dt.date | int | None = None, gioi_tinh: str | None = None,
        ngay_xem: dt.date | None = None) -> dict:
    """Hỏi đáp theo bộ vị / cung / nốt ruồi / tuổi lưu niên. An toàn (khủng hoảng, bệnh, sống chết) dùng MỘT bộ chặn chung;
    xem tướng NGƯỜI KHÁC hoặc chọn người theo tướng → từ chối (luật riêng của mảng)."""
    from app.hoidap import chung  # noqa: PLC0415
    from app.kb import kinhdich_kb  # noqa: PLC0415 — mẫu an toàn / từ chối dùng chung các mảng
    from app.luangiai.hoi import chuan_hoa  # noqa: PLC0415
    goc = (cau or "").strip()
    t = chuan_hoa(goc)
    kq = {"cau_tra_loi": "", "can_cu": [], "hoi_tiep": [], "vung": [], "xu_ly": "tra_loi", "bo_vi": None}
    db = chung.dac_biet(t, goc)
    if db == "an_toan":
        kq.update(cau_tra_loi=chung.mau_an_toan(goc, kinhdich_kb.mau("an_toan") or ""), xu_ly="an_toan")
        return kq
    # Luật riêng của mảng (đứng trước lời từ chối chung): không chọn người theo tướng, không xem tướng người khác.
    if chung.co(t, [re.escape(k) for k in kb.tu_khoa("tuyen_dung")]):
        kq.update(cau_tra_loi=str(kb.mau("hoi", "tuyen_dung")), xu_ly="tu_choi_nhe")
        return kq
    if chung.co(t, [re.escape(k) for k in kb.tu_khoa("nguoi_khac")]):
        kq.update(cau_tra_loi=str(kb.mau("hoi", "nguoi_khac")), xu_ly="tu_choi_nhe")
        return kq
    if db == "tu_choi_nhe":
        kq.update(cau_tra_loi=chung.mau_tu_choi(goc, t, kinhdich_kb.mau("tu_choi") or ""), xu_ly="tu_choi_nhe")
        return kq
    if db == "dan_huong":
        kq.update(cau_tra_loi=chung.mau_dan_huong(t), xu_ly="dan_huong")
        return kq
    tl = calc.tra_loi_sach(tra_loi)
    khop = calc.khop_dac_diem(tl)
    # nốt ruồi
    if re.search(r"not ruoi|not\b|ruoi", t):
        ma = _khop_tu_khoa(t, kb.tu_khoa("not_ruoi")) or "chung"
        nr = kb.not_ruoi().get(ma) or kb.not_ruoi()["chung"]
        kq.update(cau_tra_loi=f"{nr['loi']} {kb.not_ruoi()['chung']['loi'] if ma != 'chung' else ''}".strip(),
                  can_cu=[L("nt.hoi.nguon_quan_niem", "Nguồn: {ten} — quan niệm, không phải dự báo.", ten=kb.ten_nguon(nr.get('nguon')))],
                  xu_ly="not_ruoi",
                  hoi_tiep=[L("nt.hoi.tiep.not_cam", "Nốt ruồi ở cằm?"), L("nt.hoi.tiep.not_may", "Nốt ruồi trong lông mày?")])
        return kq
    # tuổi / năm nay → lưu niên
    m = _TUOI.search(t) or _TUOI2.search(t)
    hoi_luu_nien = chung.co(t, [r"xem o dau", r"nhin vao dau", r"luu nien", r"tuoi .{0,12}(xem|nhin|bo vi|vi tri)", r"nam nay"])
    tuoi = int(m.group(1)) if m else _tuoi_mu_tu_ho_so(nam_sinh, ngay_xem) if hoi_luu_nien else None
    if tuoi and hoi_luu_nien:
        ln = luu_nien_nam(tuoi, gioi_tinh, tl, khop)
        if ln:
            cau_tl = str(kb.mau("nam_nay" if ln["quan_sat"] else "nam_nay_khong_quan_sat")).format(
                tuoi=tuoi, ten=ln["ten"], vung=ln["ten_bo_vi"], ben=ln["nhan_ben"], quan_sat="; ".join(ln["quan_sat"]))
            bc = ln.get("bai_ca")
            sach = L("nt.hoi.bai_ca", " {y} (Sách {sach} ghi: «{han}».)", y=bc['y'], sach=bc['sach'], han=bc['han']) if bc else ""      # WS-4
            kq.update(cau_tra_loi=f"{cau_tl}{sach} {kb.mau('luu_nien_giai_thich')}", vung=[ln["vung"]], bo_vi=ln["bo_vi"], xu_ly="luu_nien",
                      can_cu=[_can_cu_luu_nien(tuoi, ln)],
                      hoi_tiep=[L("nt.hoi.tiep.tuoi_sau", "Tuổi {tuoi} xem ở đâu?", tuoi=tuoi + 1), L("nt.hoi.tiep.an_duong_toi", "Ấn Đường của tôi nghĩa là gì?")])
            return kq
    # SX-C: câu hỏi nêu tên một KIỂU HÌNH sách xưa đặt ("mắt phượng", "mày kiếm"…) → bài thơ của đúng kiểu ấy (đã nói giảm).
    from app.luangiai import sach_ghi_mon  # noqa: PLC0415
    tuoi_ = sach_ghi_mon.tuoi_tu(nam_sinh, ngay_xem or config.hom_nay_vn())
    # Câu muốn sửa / phẫu thuật gương mặt ("nâng mũi thành mũi rồng") đi nhánh từ chối sửa tướng, không vào bài kiểu hình.
    sua_truoc = chung.co(t, [re.escape(k) for k in kb.tu_khoa("phau_thuat")]) or chung.co(t, [r"\bsua\b", r"\bdoi\b"])
    if not sua_truoc and (kh_ := sach_ghi_mon.nt_kieu_hinh(goc, tuoi_)):
        kq.update(cau_tra_loi=kh_["loi"], can_cu=[f"Nguồn: {kh_['sach']} — bài tả từng kiểu mày, mắt, mũi, tai, miệng."],
                  xu_ly="kieu_hinh", bo_vi=kh_["nhom"], hoi_tiep=[_HT_AN_DUONG(), _HT_NAM_NAY()])
        return kq
    # bộ vị / cung
    # Cung (tên riêng, dài) so trước bộ vị — "cung Tài Bạch" không được bắt thành "tai".
    # Chỉ khi câu có đúng chữ "cung" (so trên câu gốc còn dấu: "cũng" bỏ dấu cũng thành "cung").
    co_cung = bool(re.search(r"(?<![a-zà-ỹ])cung(?![a-zà-ỹ])", goc.lower()))
    ma_cung = _khop_tu_khoa(t, kb.tu_khoa("cung")) if co_cung else None
    ma_bv = (kb.cung()[ma_cung].get("bo_vi") or [None])[0] if ma_cung else _khop_tu_khoa(t, kb.tu_khoa("bo_vi"))
    sua = chung.co(t, [re.escape(k) for k in kb.tu_khoa("phau_thuat")])
    if sua and not ma_bv:
        kq.update(cau_tra_loi=L("nt.hoi.phau_thuat", "Mình không khuyên sửa gương mặt để 'đổi tướng'. Sách tướng xưa nói 'tướng tuỳ tâm sinh' — nét đổi theo thói quen; "
                                "chuyện thẩm mỹ là lựa chọn của bạn với bác sĩ, không liên quan tới vận."), xu_ly="phau_thuat")
        return kq
    if not ma_bv and (dd_ := sach_ghi_mon.nt_dang_dieu(goc, tuoi_)):
        kq.update(cau_tra_loi=dd_["loi"], can_cu=[f"Nguồn: {dd_['sach']} — phần bàn dáng đi, ngồi, nằm, ăn, nói, cười."],
                  xu_ly="dang_dieu", hoi_tiep=[_HT_AN_DUONG(), _HT_NAM_NAY()])
        return kq
    if not ma_bv:
        kq.update(cau_tra_loi=str(kb.mau("hoi", "khong_hieu")), xu_ly="khong_hieu",
                  hoi_tiep=[_HT_AN_DUONG(), L("nt.hoi.tiep.not_cam", "Nốt ruồi ở cằm?"), L("nt.hoi.tiep.tuoi_35", "Năm nay tuổi 35 xem ở đâu?")])
        return kq
    bv = kb.bo_vi()[ma_bv]
    kq.update(bo_vi=ma_bv, vung=[bv.get("vung")])
    # phẫu thuật / sửa tướng → không khuyên sửa
    if sua:
        kq["cau_tra_loi"] = L("nt.hoi.phau_thuat_bv", "Mình không khuyên sửa gương mặt để 'đổi tướng'. {ten}: {nghia} Sách tướng xưa nói 'tướng tuỳ tâm sinh' — "
                              "nét đổi theo thói quen; chuyện thẩm mỹ là lựa chọn của bạn với bác sĩ, không liên quan tới vận.", ten=bv['ten'], nghia=bv['nghia'])
        kq["xu_ly"] = "phau_thuat"
        return kq
    dong = [str(kb.mau("hoi", "mo_ta_bo_vi")).format(ten=bv["ten"], vi_tri=bv["vi_tri"], nghia=bv["nghia"])]
    can_cu = []
    rieng = [m2 for m2 in khop if kb.dac_diem()[m2]["bo_vi"] == ma_bv]
    if rieng:
        dong.append(str(kb.mau("hoi", "da_khao_sat")))
        for m2 in rieng[:3]:
            dd = kb.dac_diem()[m2]
            dong.append(L("nt.hoi.dac_diem", "{t} — {n} Việc nên làm: {v}", t=dd['tieu_de'], n=dd['noi_dung'], v=dd['viec']))
            can_cu.append(_can_cu_sach(dd) or "")
    else:
        dong.append(str(kb.mau("hoi", "chua_khao_sat")))
        c0 = next((c for c in kb.cau_hoi() if c["bo_vi"] == ma_bv), None)
        if c0:
            dong.append(str(kb.mau("hoi", "cach_quan_sat")).format(huong_dan=c0["huong_dan"]))
    if bv.get("he") and chung.co(t, [r"benh", r"suc khoe", r"dau", r"yeu"]):
        from app.kb import suc_khoe_kb  # noqa: PLC0415
        he = (suc_khoe_kb.he_hanh(bv["he"]) or {}).get("he") or bv["he"]
        dong.append(str(kb.mau("hoi", "khong_doan_benh")).format(he=he))
    if (them_ := sach_ghi_mon.nt_bo_vi(ma_bv, ma_cung, tuoi_)):          # SX-C: sách xưa ghi thêm về bộ vị / cung này
        dong.append(L("nt.hoi.sach_them", "Sách xưa ghi thêm về chỗ này (là lời chung của sách, không phải nhận xét về gương mặt bạn):"))
        dong += them_
    kq.update(cau_tra_loi=" ".join(dong), can_cu=[c for c in can_cu if c] or [L("nt.nguon", "Nguồn: {ten}", ten=kb.ten_nguon(kb.meta()['source_id']))],
              hoi_tiep=[L("nt.hoi.tiep.cung", "Cung {ten} nói về gì?", ten=kb.cung()[bv['cung']]['ten']) if bv.get("cung") in kb.cung() else _HT_AN_DUONG(),
                        _HT_NAM_NAY()])
    return kq
