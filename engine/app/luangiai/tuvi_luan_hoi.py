# -*- coding: utf-8 -*-
"""LH-1 — RULES "Luận theo câu hỏi" cho Luận giải Tử vi đời sống (chủ dự án duyệt 2026-11-17). Tất định, không LLM.

Bài luận cũ đi theo 12 cung; người xem thì mang CÂU HỎI tới ("hôn nhân có bền không", "hợp nghề gì", "sếp thế nào").
Lớp này thêm vào năm chương mảng đời (tình cảm · gia đình · công việc · tiền bạc · bạn bè, ra ngoài) trường `luan_hoi`:

  tra_loi    câu người ta hay hỏi → câu trả lời thẳng (câu đầu là câu trả lời) + giải thích + căn cứ + mã kiểm chứng
  nguoi      chân dung người liên quan (vợ/chồng, cha mẹ, con, anh em, sếp, bạn bè, khách) + bạn tác động tới họ / họ tới bạn
  hoa_giai   Phát huy · Cần sửa · Cảnh báo · Dân gian thường làm (tập quán, ghi rõ không nằm trong phép tính)
  dong_mang  dòng mười năm riêng của mảng (ba mức, không điểm số)
  nghe       (chương công việc) la bàn nghề theo hành của sao chính ba cung Mệnh – Quan Lộc – Tài Bạch

và trường cấp báo cáo `nguoi_quanh` (bản đồ người quanh bạn). Chỉ ĐỌC kết quả đã tính (`cham_cung`, dòng Vận hạn,
`chu_y_nam`, đường bay tứ hoá) — một bộ tính, không đổi mức nào của báo cáo. Thuật ngữ chỉ ở `can_cu`.

Ranh giới (CLAUDE.md, LH-1): nói thẳng THẾ của lá số theo cách thầy xưa đọc ("dễ hai lần đò"…), luôn kèm điều kiện và việc
nên làm; không đoán sự kiện có ngày tháng, không số con, không tuổi thọ / bệnh; người chưa đủ 18 tuổi không nhận lớp này;
chỉ bản tiếng Việt. Ngưỡng nhãn cân trên 1.000 lá mẫu (`tests/test_tuvi_luan_hoi.py`).
"""
from __future__ import annotations

from app import ngon_ngu
from app.calc import lunar
from app.calc import tuvi_hong_hy as hh
from app.calc import tuvi_phi_hoa as phi_calc
from app.kb import tuvi_doi_song_kb as kb_ds
from app.kb import tuvi_luan_hoi_kb as kb
from app.luangiai import chu_y_nam as cyn
from app.luangiai.doi_song_chung import _ma, slug

CHUONG_CUNG = {"tinh_cam": ("Phu Thê",), "gia_dinh": ("Phụ Mẫu", "Huynh Đệ", "Tử Nữ"), "su_nghiep": ("Quan Lộc",),
               "tien_bac": ("Tài Bạch",), "quan_he": ("Nô Bộc", "Thiên Di")}
TEN_MANG = {"tinh_cam": "tình cảm", "gia_dinh": "gia đình", "su_nghiep": "công việc", "tien_bac": "tiền bạc",
            "quan_he": "bạn bè, ra ngoài"}
NGUOI_CHUONG = {"tinh_cam": ("phoi_ngau",), "gia_dinh": ("cha_me", "con", "anh_em"), "su_nghiep": ("sep",),
                "quan_he": ("ban_be", "nguoi_ngoai")}
SO_NAM = 10
TUOI_TOI_THIEU = 18
SANG = ("Miếu", "Vượng", "Đắc")
# Sao sách xưa coi là "cứng" ở cung vợ chồng (duyên muộn, dễ trắc trở) và sao "hiền" (êm).
SAO_CUNG_PT = ("Thất Sát", "Phá Quân", "Tham Lang", "Liêm Trinh", "Cự Môn", "Vũ Khúc")
SAO_HIEN_PT = ("Thiên Đồng", "Thái Âm", "Thiên Phủ", "Thiên Tướng", "Thiên Lương", "Tử Vi", "Thái Dương")
SAO_DAO_HOA = ("Tham Lang", "Liêm Trinh")
DIEM_DAO = {"Hàm Trì": 1.0, "Thiên Diêu": 1.0, "Hồng Loan": 0.5, "Thiên Hỷ": 0.5}
NGUONG_DAO = 1.5
VAN_TINH = ("Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt")
TIN_DUONG = ("loc", "quyen", "khoa", "cat", "sang", "ma")
TIN_AM = ("ky", "sat", "ham", "cham", "co_qua")
_HOA_MA = {"Lộc": "loc", "Quyền": "quyen", "Khoa": "khoa", "Kỵ": "ky"}
# Sắc của từng nhãn câu trả lời (để web tô chấm ba mức — không điểm số).
SAC = {"thuan": "thuan", "can_bang": "can_bang", "can_chu_dong": "can_chu_dong",
       "mot_moi_ben": "thuan", "ben_neu_vun": "can_bang", "muon_moi_ben": "can_bang", "hai_lan_do": "can_chu_dong",
       "it_dau_hieu": "thuan", "phia_ban": "can_chu_dong", "phia_nguoi_ay": "can_chu_dong", "ca_hai": "can_chu_dong",
       "som_thuan": "thuan", "muon_thi_ben": "can_bang", "lan_dan": "can_chu_dong",
       "co": "can_bang", "khong": "can_bang", "lam_chu": "thuan", "chuyen_mon": "thuan", "to_chuc": "thuan",
       "sang": "thuan", "vua": "can_bang", "it": "can_bang", "hop_di_xa": "thuan", "o_gan_di_duoc": "can_bang",
       "nen_o_gan": "can_chu_dong", "giu_tot": "thuan", "giu_vua": "can_bang", "giu_kem": "can_chu_dong",
       "co_chuc": "thuan", "co_tieng": "thuan", "thuc_luc": "can_bang", "hop_kinh_doanh": "thuan",
       "luong_cong_them": "can_bang", "luong_on_dinh": "can_chu_dong", "deu": "can_bang", "nhieu": "thuan",
       "tu_luc": "can_bang", "hop_tac_duoc": "thuan", "can_giay_to": "can_bang", "nen_tu_lam": "can_chu_dong"}
# Nhãn mỗi câu có thể nhận — test đối chiếu KB có đủ ô.
NHAN = {
    "hanh_phuc": ("thuan", "can_bang", "can_chu_dong"), "ben": ("mot_moi_ben", "ben_neu_vun", "muon_moi_ben", "hai_lan_do"),
    "nguoi_thu_ba": ("it_dau_hieu", "phia_ban", "phia_nguoi_ay", "ca_hai"), "som_muon": ("som_thuan", "muon_thi_ben", "lan_dan"),
    "cha_me": ("thuan", "can_bang", "can_chu_dong"), "con_cai": ("thuan", "can_bang", "can_chu_dong"),
    "anh_em": ("thuan", "can_bang", "can_chu_dong"), "tac_dong_nha": ("co", "khong"),
    "chu_hay_cong": ("lam_chu", "chuyen_mon", "to_chuc"), "trai_nghe": ("thuan", "can_bang", "can_chu_dong"),
    "hoc_hanh": ("sang", "vua", "it"), "sep": ("thuan", "can_bang", "can_chu_dong"),
    "dong_nghiep": ("thuan", "can_bang", "can_chu_dong"), "di_xa": ("hop_di_xa", "o_gan_di_duoc", "nen_o_gan"),
    "trac_tro": ("it", "co"), "giu_tien": ("giu_tot", "giu_vua", "giu_kem"),
    "cong_danh": ("co_chuc", "co_tieng", "thuc_luc"), "kinh_doanh": ("hop_kinh_doanh", "luong_cong_them", "luong_on_dinh"),
    "giai_doan_kha": ("co", "deu"), "ban_be": ("thuan", "can_bang", "can_chu_dong"),
    "quy_nhan": ("nhieu", "co", "tu_luc"), "lam_an_chung": ("hop_tac_duoc", "can_giay_to", "nen_tu_lam"),
    "thi_phi": ("it", "co"),
}


# ------------------------------------------------------------------ đọc lá số
def _cung(ls: dict, ten: str) -> dict:
    return next(c for c in ls["cung"] if c["ten"] == ten)


def _phu(ls: dict, ten: str) -> list[str]:
    return _cung(ls, ten)["phu_tinh"]


def _chinh_that(cc: dict, ten: str) -> list[dict]:
    return [s for s in cc[ten]["chinh"] if not s["muon"]]


def _sao_dau(cc: dict, ten: str) -> dict | None:
    """Chính tinh đầu của cung (kể cả mượn từ cung đối khi cung trống)."""
    return (cc[ten]["chinh"] or [None])[0]


def _tu_chinh(ls: dict, cc: dict, ten: str) -> list[str]:
    """Cung + ba cung chiếu về (xung, hai tam hợp)."""
    return [ten, *cc[ten]["lan_can"]]


def tin_hieu(ls: dict, cc: dict, ten: str) -> list[str]:
    """Dấu hiệu của MỘT cung, theo thứ tự: thuận trước, vướng sau, trung tính (đào hoa) cuối."""
    x, phu = cc[ten], _phu(ls, ten)
    ra = [_HOA_MA[h["hoa"]] for h in x["hoa"] if h["hoa"] != "Kỵ"]
    if x["cat"]:
        ra.append("cat")
    that = _chinh_that(cc, ten)
    if any(s["do_sang"] in ("Miếu", "Vượng") for s in that):
        ra.append("sang")
    if "Thiên Mã" in phu:
        ra.append("ma")
    if any(h["hoa"] == "Kỵ" for h in x["hoa"]):
        ra.append("ky")
    if x["sat"]:
        ra.append("sat")
    if any(s["do_sang"] == "Hãm" for s in that):
        ra.append("ham")
    if x["cham"]:
        ra.append("cham")
    if any(s in phu for s in ("Cô Thần", "Quả Tú")):
        ra.append("co_qua")
    if x["dao_hoa"]:
        ra.append("dao")
    return ra


def _tin_chuong(ls: dict, cc: dict, chuong: str) -> list[str]:
    ra: list[str] = []
    for c in CHUONG_CUNG[chuong]:
        ra += [t for t in tin_hieu(ls, cc, c) if t not in ra]
    return ra


def _mo_ta(ls: dict, cc: dict, ten: str) -> str:
    """Một dòng căn cứ (thuật ngữ): sao chính + độ sáng, tứ hoá, cát / sát, Tuần Triệt của cung."""
    x = cc[ten]
    p = [f"{s['ten']} ({s['do_sang'] or 'không ghi'}{', mượn cung đối' if s['muon'] else ''})" for s in x["chinh"]] or ["vô chính diệu"]
    p += [f"Hoá {h['hoa']} ({h['sao']})" for h in x["hoa"]]
    p += x["cat"] + x["sat"] + x["dao_hoa"] + [s for s in _phu(ls, ten) if s in ("Cô Thần", "Quả Tú", "Thiên Mã")]
    p += x["tuan_triet"]
    return f"Cung {ten}: {', '.join(p)} → {kb_ds.nhan_muc(x['muc'])}"


# ------------------------------------------------------------------ nhãn (luật công khai, cân trên 1.000 lá)
def diem_hon_nhan(ls: dict, cc: dict) -> int:
    """Số dấu hiệu "dễ dang dở" trừ số dấu hiệu "êm" ở cung Phu Thê (không trả ra cho người dùng)."""
    x, that = cc["Phu Thê"], _chinh_that(cc, "Phu Thê")
    d = sum(1 for s in that if s["ten"] in SAO_CUNG_PT) + sum(1 for s in that if s["do_sang"] == "Hãm")
    d += any(h["hoa"] == "Kỵ" for h in x["hoa"]) + min(len(x["sat"]), 2) + bool(x["cham"])
    d += any(s in _phu(ls, "Phu Thê") for s in ("Cô Thần", "Quả Tú"))
    d -= any(h["hoa"] in ("Lộc", "Khoa") for h in x["hoa"]) + bool(x["cat"])
    d -= any(s["ten"] in SAO_HIEN_PT and s["do_sang"] in SANG for s in that)
    return d


def nhan_ben(ls: dict, cc: dict) -> str:
    d = diem_hon_nhan(ls, cc)
    return "mot_moi_ben" if d <= 0 else "ben_neu_vun" if d == 1 else "muon_moi_ben" if d <= 3 else "hai_lan_do"


def _diem_dao(ls: dict, cc: dict, ten: str) -> float:
    return (sum(1.0 for s in _chinh_that(cc, ten) if s["ten"] in SAO_DAO_HOA)
            + sum(DIEM_DAO.get(s, 0) for s in _phu(ls, ten)))


def nhan_nguoi_thu_ba(ls: dict, cc: dict) -> str:
    a, b = _diem_dao(ls, cc, "Mệnh") >= NGUONG_DAO, _diem_dao(ls, cc, "Phu Thê") >= NGUONG_DAO
    return "ca_hai" if a and b else "phia_nguoi_ay" if b else "phia_ban" if a else "it_dau_hieu"


def nhan_som_muon(ls: dict, cc: dict) -> str:
    x = cc["Phu Thê"]
    d = (bool(x["cham"]) + any(s in _phu(ls, "Phu Thê") for s in ("Cô Thần", "Quả Tú")) + bool(x["sat"])
         + any(s["ten"] in SAO_CUNG_PT for s in _chinh_that(cc, "Phu Thê")))
    return "som_thuan" if d == 0 else "muon_thi_ben" if d <= 2 else "lan_dan"


def nhan_chu_hay_cong(ls: dict, cc: dict) -> str:
    q, m = _sao_dau(cc, "Quan Lộc"), _sao_dau(cc, "Mệnh")
    kq = (kb.lay("sao_nghe", q["ten"]) or {}).get("kieu") if q else None
    km = (kb.lay("sao_nghe", m["ten"]) or {}).get("kieu") if m else None
    quyen = any(h["hoa"] == "Quyền" for c in ("Mệnh", "Quan Lộc") for h in cc[c]["hoa"])
    if 2 * (kq == "chu") + (km == "chu") + quyen >= 2:
        return "lam_chu"
    return kq if kq in ("chuyen_mon", "to_chuc") else km if km in ("chuyen_mon", "to_chuc") else "to_chuc"


def nhan_hoc_hanh(ls: dict, cc: dict) -> str:
    cung = _tu_chinh(ls, cc, "Mệnh")
    n = sum(1 for c in cung for s in _phu(ls, c) if s in VAN_TINH) + sum(1 for c in cung for h in cc[c]["hoa"] if h["hoa"] == "Khoa")
    return "sang" if n >= 3 else "vua" if n >= 1 else "it"


def _co_ma(ls: dict) -> bool:
    return any("Thiên Mã" in _phu(ls, c) for c in ("Mệnh", "Thiên Di"))


def nhan_di_xa(ls: dict, cc: dict) -> str:
    m, ma = cc["Thiên Di"]["muc"], _co_ma(ls)
    if m == "thuan" or (ma and m == "can_bang"):
        return "hop_di_xa"
    return "nen_o_gan" if m == "can_chu_dong" and not ma else "o_gan_di_duoc"


def nhan_giu_tien(ls: dict, cc: dict) -> str:
    tai, dien = _phu(ls, "Tài Bạch"), cc["Điền Trạch"]
    co_loc = any("Lộc Tồn" in _phu(ls, c) for c in ("Tài Bạch", "Điền Trạch")) or any(h["hoa"] == "Lộc" for h in dien["hoa"])
    if any(s in tai for s in ("Địa Không", "Địa Kiếp")) or len(cc["Tài Bạch"]["sat"]) >= 2 \
            or (dien["muc"] == "can_chu_dong" and not co_loc):
        return "giu_kem"
    return "giu_tot" if dien["muc"] == "thuan" or co_loc else "giu_vua"


def nhan_cong_danh(ls: dict, cc: dict) -> str:
    hoa = {h["hoa"] for c in ("Mệnh", "Quan Lộc") for h in cc[c]["hoa"]}
    n = ("Quyền" in hoa) + ("Khoa" in hoa) + any(s in _phu(ls, "Quan Lộc") for s in ("Thiên Khôi", "Thiên Việt")) \
        + (cc["Quan Lộc"]["muc"] == "thuan")
    return "co_chuc" if "Quyền" in hoa and n >= 2 else "co_tieng" if n >= 1 else "thuc_luc"


def nhan_kinh_doanh(ls: dict, cc: dict) -> str:
    giu, tai = nhan_giu_tien(ls, cc), cc["Tài Bạch"]["muc"]
    if tai == "can_chu_dong" or (giu == "giu_kem" and tai != "thuan"):
        return "luong_on_dinh"
    return "hop_kinh_doanh" if nhan_chu_hay_cong(ls, cc) == "lam_chu" else "luong_cong_them"


def _quy_nhan(ls: dict, cc: dict) -> tuple[int, str]:
    cung = _tu_chinh(ls, cc, "Mệnh")
    lon = sum(1 for c in cung for s in _phu(ls, c) if s in ("Thiên Khôi", "Thiên Việt"))
    ngang = sum(1 for c in cung for s in _phu(ls, c) if s in ("Tả Phù", "Hữu Bật"))
    return lon + ngang, "ca_hai" if lon and ngang else "lon" if lon else "ngang"


def nhan_quy_nhan(ls: dict, cc: dict) -> str:
    n = _quy_nhan(ls, cc)[0]
    return "nhieu" if n >= 3 else "co" if n >= 1 else "tu_luc"


def nhan_lam_an_chung(ls: dict, cc: dict) -> str:
    no = cc["Nô Bộc"]
    ky_no = any(h["hoa"] == "Kỵ" for h in no["hoa"])
    if no["muc"] == "can_chu_dong" or ky_no:
        return "nen_tu_lam"
    ky_tai = any(h["hoa"] == "Kỵ" for h in cc["Tài Bạch"]["hoa"])
    return "hop_tac_duoc" if no["muc"] == "thuan" and not ky_tai else "can_giay_to"


def nhan_thi_phi(ls: dict, cc: dict) -> str:
    di = cc["Thiên Di"]
    cu_ham = any(s["ten"] == "Cự Môn" and s["do_sang"] == "Hãm" for c in ("Mệnh", "Thiên Di") for s in _chinh_that(cc, c))
    return "co" if len(di["sat"]) >= 2 or any(h["hoa"] == "Kỵ" for h in di["hoa"]) or cu_ham else "it"


# ------------------------------------------------------------------ dòng mười năm theo mảng
def dong_mang(ls: dict, chuong: str, nam_am_xem: int, nam_am_sinh: int, sao_luu: dict | None,
              dong: dict[int, dict]) -> list[dict]:
    """Mười năm của MỘT mảng. Năm "nên đi chậm" = đúng các năm `chu_y_nam.tuvi_nam_cung` chọn cho cung của mảng (một
    nguồn với hộp "Năm nên chú ý…"); năm thuận = Hoá Lộc năm vào cung của mảng (và, với tình cảm, năm Hồng Loan / Thiên Hỷ
    lưu về Mệnh hoặc Phu Thê); còn lại nhịp đều."""
    cung = CHUONG_CUNG[chuong]
    cham: dict[int, list[str]] = {}
    for c in cung:
        for x in cyn.tuvi_nam_cung(ls, nam_am_xem, nam_am_sinh, c, SO_NAM, cyn.sao_luu_kho(sao_luu, c), dong=dong,
                                   mang_thuong=True):
            cham.setdefault(x["nam"], []).extend(x["can_cu"])
    hy = {}
    if chuong == "tinh_cam":
        for x in hh.nam_hy(ls["cung"], nam_am_xem, SO_NAM, ("Mệnh", "Phu Thê")):
            hy.setdefault(x["nam"], []).append(f"Năm {x['nam']}: {x['sao']} lưu về cung {x['cung']}")
    theo_chi = {c["chi"]: c["ten"] for c in ls["cung"]}
    ra = []
    for k in range(SO_NAM):
        nam = nam_am_xem + k
        can, chi = lunar.can_chi_nam(nam)
        tot = next((x for x in phi_calc.phi_tu_can(can, ls["cung"]) if x["hoa"] != "Kỵ" and x["den_cung"] in cung), None)
        if nam in cham:
            muc, ly, cu = "can_chu_dong", "can_chu_dong", cham[nam]
        elif tot:
            muc, ly = "thuan", {"Lộc": "thuan", "Quyền": "quyen", "Khoa": "khoa"}[tot["hoa"]]
            cu = [f"Năm {nam} ({can} {chi}): Hoá {tot['hoa']} năm ({tot['sao']}) nhập cung {tot['den_cung']}"] + hy.get(nam, [])
        elif nam in hy:
            muc, ly, cu = "thuan", "hy", hy[nam]
        else:
            muc, ly, cu = "can_bang", "can_bang", []
        noi = theo_chi.get(chi) in cung            # cung lưu niên của năm là cung của mảng
        if noi:
            cu = cu + [f"Năm {nam} ({can} {chi}): cung lưu niên là {theo_chi[chi]}"]
        y = kb.chuoi("dong_mang", ly)
        if noi and muc == "can_bang":
            y = kb.chuoi("dong_mang", "noi")
        ra.append({"nam": nam, "tuoi": nam - nam_am_sinh + 1, "muc": muc, "nhan_muc": kb_ds.nhan_muc(muc),
                   "y": y, "hy": nam in hy and muc != "can_chu_dong", "noi": noi, "hien_tai": k == 0, "can_cu": cu})
    return ra


def _nam(ds: list[dict], muc: str, toi_da: int = 3) -> list[int]:
    return [x["nam"] for x in ds if x["muc"] == muc][:toi_da]


def _noi(ds: list) -> str:
    return ", ".join(str(x) for x in ds)


# ------------------------------------------------------------------ người quanh bạn
def _ten_vai(ma: str, gioi_tinh: str | None) -> str:
    v = kb.vai().get(ma) or {}
    if ma == "phoi_ngau" and gioi_tinh in ("nam", "nu"):
        return v.get(f"ten_{gioi_tinh}") or v.get("ten") or ma
    return v.get("ten") or ma


def _hoa_dau(s: str) -> str:
    return s[:1].upper() + s[1:]


def chan_dung(cc: dict, ma: str, gioi_tinh: str | None) -> tuple[str, str]:
    """→ (câu chân dung, cách sống hợp với người đó) từ sao chính của cung người ấy."""
    v = kb.vai()[ma]
    ten, goi = _ten_vai(ma, gioi_tinh), v["goi"]
    ds = cc[v["cung"]]["chinh"]
    if not ds:
        return kb.chuoi("chan_dung_mau", "khong").format(vai=ten, goi=goi), ""
    s = ds[0]
    o = kb.lay("sao_nguoi", s["ten"]) or {}
    if s["muon"]:
        cau = kb.chuoi("chan_dung_mau", "muon").format(goi=goi, kieu=o.get("kieu", ""))
    elif s["do_sang"] == "Hãm":
        cau = kb.chuoi("chan_dung_mau", "ham").format(vai=ten, kieu=o.get("kieu", ""), ham=o.get("ham", ""))
    else:
        cau = kb.chuoi("chan_dung_mau", "ro").format(vai=ten, kieu=o.get("kieu", ""))
    if len(ds) > 1 and not ds[1]["muon"]:
        o2 = kb.lay("sao_nguoi", ds[1]["ten"]) or {}
        if o2.get("ngan"):
            cau += " " + kb.chuoi("chan_dung_mau", "them").format(ngan=o2["ngan"])
    return _hoa_dau(cau), o.get("song", "")


def tac_dong(ls: dict, cung_nguoi: str, goi: str) -> tuple[list[str], list[str], list[str]]:
    """Đường bay tứ hoá giữa cung Mệnh và cung người ấy → (bạn với họ, họ với bạn, căn cứ)."""
    can_menh, can_ho = _cung(ls, "Mệnh").get("can"), _cung(ls, cung_nguoi).get("can")
    di, ve, cu = [], [], []
    if can_menh:
        for x in phi_calc.phi_tu_can(can_menh, ls["cung"]):
            if x["den_cung"] == cung_nguoi:
                di.append(kb.chuoi("tac_dong", "ban_voi_ho", x["hoa"]).format(goi=goi, Goi=_hoa_dau(goi)))
                cu.append(f"Can cung Mệnh ({can_menh}) phi Hoá {x['hoa']} ({x['sao']}) vào cung {cung_nguoi}")
    if can_ho:
        for x in phi_calc.phi_tu_can(can_ho, ls["cung"]):
            if x["den_cung"] == "Mệnh":
                ve.append(kb.chuoi("tac_dong", "ho_voi_ban", x["hoa"]).format(goi=goi, Goi=_hoa_dau(goi)))
                cu.append(f"Can cung {cung_nguoi} ({can_ho}) phi Hoá {x['hoa']} ({x['sao']}) vào cung Mệnh")
    return di, ve, cu


def nguoi(ls: dict, cc: dict, ma: str, gioi_tinh: str | None) -> dict:
    v = kb.vai()[ma]
    cung = v["cung"]
    cd, song = chan_dung(cc, ma, gioi_tinh)
    di, ve, cu = tac_dong(ls, cung, v["goi"])
    muc = cc[cung]["muc"]
    return {"ma": ma, "ten": _ten_vai(ma, gioi_tinh), "muc": muc, "nhan_muc": kb_ds.nhan_muc(muc), "chan_dung": cd,
            "song_chung": song, "ban_voi_ho": di, "ho_voi_ban": ve, "tu_chuong": v["chuong"],
            "can_cu": [_mo_ta(ls, cc, cung), *cu]}


# ------------------------------------------------------------------ câu trả lời
def _tl(chuong: str, ma: str, nhan: str, can_cu: list[str], tl: str | None = None, gt: str | None = None, **bien) -> dict:
    o = kb.tra_loi(ma, nhan)
    cau = next((c["cau"] for c in kb.cau(chuong) if c["ma"] == ma), "")
    t = (tl if tl is not None else o.get("tl", "")).format(**bien) if bien else (tl if tl is not None else o.get("tl", ""))
    g = (gt if gt is not None else o.get("gt", "")).format(**bien) if bien else (gt if gt is not None else o.get("gt", ""))
    return {"ma": ma, "cau": cau, "tra_loi": t.strip(), "giai_thich": g.strip(), "nhan": nhan,
            "sac": SAC.get(nhan, "can_bang"), "can_cu": [c for c in can_cu if c],
            "ma_mau": _ma("ds", chuong, "hoi", ma, nhan)}


def _do_vuong(chuong: str, tin: list[str]) -> str:
    """"Điểm đỡ: …. Điểm vướng: …." từ dấu hiệu của chương (lời đời thường)."""
    do = [kb.tin_hieu(chuong, t).get("y") for t in tin if t in TIN_DUONG]
    vuong = [kb.tin_hieu(chuong, t).get("y") for t in tin if t in TIN_AM]
    p = []
    if any(do):
        p.append(f"{kb.chuoi('nhan_tin_hieu', 'do')}: {'; '.join(x for x in do[:3] if x)}.")
    if any(vuong):
        p.append(f"{kb.chuoi('nhan_tin_hieu', 'vuong')}: {'; '.join(x for x in vuong[:3] if x)}.")
    return " ".join(p)


def _nghe(cc: dict) -> tuple[dict, dict | None, dict | None]:
    """→ (la bàn nghề, sao cung Quan Lộc, mục KB nghề của sao ấy)."""
    vi = [("Quan Lộc", "chinh"), ("Mệnh", "phu"), ("Tài Bạch", "phu")]
    cap: dict[str, str] = {}
    cu = []
    for c, lop in vi:
        s = _sao_dau(cc, c)
        o = kb.lay("sao_nghe", s["ten"]) if s else None
        if o:
            cap[o["hanh"]] = "chinh" if lop == "chinh" else cap.get(o["hanh"], "phu")
            cu.append(f"Cung {c}: {s['ten']} (hành {o['hanh']}{', mượn cung đối' if s['muon'] else ''})")
    q = _sao_dau(cc, "Quan Lộc")
    oq = kb.lay("sao_nghe", q["ten"]) if q else None
    hanh = [{"hanh": h, "nganh": n, "cap": cap.get(h, "")} for h, n in (kb.lay("hanh_nganh") or {}).items()]
    noi = next((h for h in hanh if h["cap"] == "chinh"), None) or next((h for h in hanh if h["cap"]), None)
    cau = kb.chuoi("nghe_mau", "hanh").format(hanh=noi["hanh"], nganh=noi["nganh"]) if noi else ""
    return {"hanh": hanh, "noi_bat": noi["hanh"] if noi else None, "cau": cau, "can_cu": cu}, q, oq


def _tra_loi_tinh_cam(ls: dict, cc: dict, dm: list[dict], nq: dict[str, dict]) -> list[dict]:
    ch, cu = "tinh_cam", [_mo_ta(ls, cc, "Phu Thê")]
    tin = tin_hieu(ls, cc, "Phu Thê")
    muc = cc["Phu Thê"]["muc"]
    o = kb.tra_loi("hanh_phuc", muc)
    ra = [_tl(ch, "hanh_phuc", muc, cu, gt=f"{o.get('gt', '')} {_do_vuong(ch, tin)}")]
    p = nq["phoi_ngau"]
    s = _sao_dau(cc, "Phu Thê")
    nh = (slug(s["ten"]) + ("_ham" if s["do_sang"] == "Hãm" else "")) if s else "khong"
    ra.append({**_tl(ch, "nguoi_ay", nh, p["can_cu"][:1], tl=p["chan_dung"],
                     gt=" ".join(x for x in [p["song_chung"], *p["ho_voi_ban"][:1]] if x)), "sac": muc})
    thang = kb.chuoi("ghi_chu_thang")
    b = nhan_ben(ls, cc)
    ob = kb.tra_loi("ben", b)
    ra.append(_tl(ch, "ben", b, cu, gt=f"{ob.get('gt', '')} {thang}" if b in ("muon_moi_ben", "hai_lan_do") else None))
    n3 = nhan_nguoi_thu_ba(ls, cc)
    ra.append(_tl(ch, "nguoi_thu_ba", n3, [_mo_ta(ls, cc, "Mệnh"), *cu]))
    sm = nhan_som_muon(ls, cc)
    them = []
    hy = [x["nam"] for x in dm if x["hy"]][:3]
    if hy:
        them.append(kb.chuoi("nam_hy").format(ds=_noi(hy)))
    cham = _nam(dm, "can_chu_dong")
    if cham:
        them.append(kb.chuoi("nam_cham").format(ds=_noi(cham)))
    ra.append(_tl(ch, "som_muon", sm, cu + [c for x in dm if x["hy"] for c in x["can_cu"]][:3],
                  gt=" ".join([kb.tra_loi("som_muon", sm).get("gt", ""), *them])))
    return ra


def _tra_loi_gia_dinh(ls: dict, cc: dict, nq: dict[str, dict]) -> list[dict]:
    ch, ra = "gia_dinh", []
    for ma, vai_ma in (("cha_me", "cha_me"), ("con_cai", "con"), ("anh_em", "anh_em")):
        p = nq[vai_ma]
        o = kb.tra_loi(ma, p["muc"])
        ra.append(_tl(ch, ma, p["muc"], p["can_cu"][:1], gt=" ".join(x for x in [o.get("gt", ""), p["chan_dung"]] if x)))
    di = [c for m in ("phoi_ngau", "cha_me", "con", "anh_em") if m in nq for c in nq[m]["ban_voi_ho"]]
    cu = [c for m in ("phoi_ngau", "cha_me", "con", "anh_em") if m in nq for c in nq[m]["can_cu"][1:]]
    if di:
        ra.append(_tl(ch, "tac_dong_nha", "co", cu, tl=f"{kb.tra_loi('tac_dong_nha', 'co').get('tl', '')} {di[0]}",
                      gt=" ".join(di[1:3])))
    else:
        ra.append(_tl(ch, "tac_dong_nha", "khong", ["Can cung Mệnh không phi hoá nào vào cung Phu Thê, Phụ Mẫu, Tử Nữ, Huynh Đệ"]))
    return ra


def _trac_tro(chuong: str, tin: list[str], dm: list[dict], cu: list[str]) -> dict:
    am = [t for t in tin if t in TIN_AM]
    vuong = [x for x in (kb.tin_hieu(chuong, t).get("y") for t in am) if x][:3]
    cham = _nam(dm, "can_chu_dong")
    if not vuong and not cham:
        return _tl(chuong, "trac_tro", "it", cu)
    gt = kb.chuoi("nam_cham").format(ds=_noi(cham)) if cham else ""
    if not vuong:
        return _tl(chuong, "trac_tro", "co", cu, tl=gt, gt="")
    return _tl(chuong, "trac_tro", "co", cu + [c for x in dm if x["muc"] == "can_chu_dong" for c in x["can_cu"]][:3],
               tl=kb.tra_loi("trac_tro", "co").get("tl", "").format(y="; ".join(vuong)),
               gt=" ".join(x for x in [kb.tin_hieu(chuong, am[0]).get("lam", ""), gt] if x))


def _tra_loi_su_nghiep(ls: dict, cc: dict, dm: list[dict], nq: dict[str, dict], nghe: dict, q: dict | None,
                       oq: dict | None) -> list[dict]:
    ch, cu = "su_nghiep", [_mo_ta(ls, cc, "Quan Lộc")]
    viec = (oq or {}).get("viec", "")
    if not oq:
        ra = [_tl(ch, "nghe_hop", "khong", cu, tl=kb.chuoi("nghe_mau", "tl_khong"), gt=nghe["cau"])]
    else:
        mau = "tl_muon" if q["muon"] else "tl"
        m = _sao_dau(cc, "Mệnh")
        om = kb.lay("sao_nghe", m["ten"]) if m and m["ten"] != q["ten"] else None
        them = kb.chuoi("nghe_mau", "them_menh").format(viec=om["viec"]) if om else ""
        ra = [_tl(ch, "nghe_hop", slug(q["ten"]), cu + nghe["can_cu"],
                  tl=kb.chuoi("nghe_mau", mau).format(viec=viec, nganh="; ".join(oq["nganh"])),
                  gt=" ".join(x for x in [them, nghe["cau"]] if x))]
    ra.append(_tl(ch, "chu_hay_cong", nhan_chu_hay_cong(ls, cc), cu + [_mo_ta(ls, cc, "Mệnh")]))
    muc = cc["Quan Lộc"]["muc"]
    ra.append(_tl(ch, "trai_nghe", muc, cu, viec=viec or "bạn làm tốt nhất"))
    ra.append(_tl(ch, "hoc_hanh", nhan_hoc_hanh(ls, cc),
                  [f"Văn tinh và Hoá Khoa ở Mệnh và ba cung chiếu: "
                   f"{', '.join(s for c in _tu_chinh(ls, cc, 'Mệnh') for s in _phu(ls, c) if s in VAN_TINH) or 'không có'}"]))
    s = nq["sep"]
    os_ = kb.tra_loi("sep", s["muc"])
    ra.append(_tl(ch, "sep", s["muc"], s["can_cu"][:1], gt=" ".join(x for x in [s["chan_dung"], os_.get("gt", "")] if x)))
    b = cc["Nô Bộc"]["muc"]
    ra.append(_tl(ch, "dong_nghiep", b, [_mo_ta(ls, cc, "Nô Bộc")]))
    ra.append(_tl(ch, "di_xa", nhan_di_xa(ls, cc), [_mo_ta(ls, cc, "Thiên Di")]))
    ra.append(_trac_tro(ch, tin_hieu(ls, cc, "Quan Lộc"), dm, cu))
    return ra


def _tra_loi_tien_bac(ls: dict, cc: dict, dm: list[dict], tgb: list[dict], tuoi_mu: int) -> list[dict]:
    ch, cu = "tien_bac", [_mo_ta(ls, cc, "Tài Bạch")]
    s = _sao_dau(cc, "Tài Bạch")
    ra = []
    if s:
        nhom = "ham" if s["do_sang"] == "Hãm" else "sang"
        o = kb_ds.sao_linh_vuc(s["ten"], "Tài Bạch", nhom) or {}
        if o.get("manh"):
            ra.append(_tl(ch, "kiem_bang_gi", slug(s["ten"]) + ("_ham" if nhom == "ham" else ""), cu, tl=o["manh"],
                          gt=o.get("loi_khuyen", "")))
    ra.append(_tl(ch, "giu_tien", nhan_giu_tien(ls, cc), cu + [_mo_ta(ls, cc, "Điền Trạch")]))
    ra.append(_tl(ch, "cong_danh", nhan_cong_danh(ls, cc), [_mo_ta(ls, cc, "Quan Lộc")]))
    ra.append(_tl(ch, "kinh_doanh", nhan_kinh_doanh(ls, cc), cu))
    kha = [g for g in tgb if g["muc"] == "thuan" and g["den_tuoi"] >= tuoi_mu][:3]
    if kha:
        ds = "; ".join(f"tuổi {g['tu_tuoi']}–{g['den_tuoi']} ({g['nam_tu']}–{g['nam_den']})" for g in kha)
        ra.append(_tl(ch, "giai_doan_kha", "co", [f"Đại hạn cung {g['cung']} ({g['tu_tuoi']}–{g['den_tuoi']} tuổi): Thuận lợi" for g in kha],
                      ds=ds))
    else:
        ra.append(_tl(ch, "giai_doan_kha", "deu", ["Không còn đại hạn nào chấm Thuận lợi từ tuổi hiện tại"]))
    ra.append(_trac_tro(ch, tin_hieu(ls, cc, "Tài Bạch"), dm, cu))
    return ra


def _tra_loi_quan_he(ls: dict, cc: dict, nq: dict[str, dict]) -> list[dict]:
    ch = "quan_he"
    b = nq["ban_be"]
    ob = kb.tra_loi("ban_be", b["muc"])
    ra = [_tl(ch, "ban_be", b["muc"], b["can_cu"][:1], gt=" ".join(x for x in [b["chan_dung"], ob.get("gt", "")] if x))]
    n, ai = _quy_nhan(ls, cc)
    cung = _tu_chinh(ls, cc, "Mệnh")
    ds = [s for c in cung for s in _phu(ls, c) if s in ("Thiên Khôi", "Thiên Việt", "Tả Phù", "Hữu Bật")]
    ra.append(_tl(ch, "quy_nhan", nhan_quy_nhan(ls, cc), [f"Khôi, Việt, Tả, Hữu ở Mệnh và ba cung chiếu: {', '.join(ds) or 'không có'}"],
                  ai=kb.chuoi("quy_nhan_ai", ai)))
    ra.append(_tl(ch, "lam_an_chung", nhan_lam_an_chung(ls, cc), [_mo_ta(ls, cc, "Nô Bộc"), _mo_ta(ls, cc, "Tài Bạch")]))
    ra.append(_tl(ch, "thi_phi", nhan_thi_phi(ls, cc), [_mo_ta(ls, cc, "Thiên Di")]))
    return ra


# ------------------------------------------------------------------ hoá giải
def hoa_giai(chuong: str, tin: list[str], dm: list[dict], nhan: dict[str, str], dieu_kien: set[str]) -> dict:
    """Phát huy (dấu hiệu thuận → việc) · Cần sửa (dấu hiệu vướng → việc) · Cảnh báo (thế đặc biệt + năm) · Dân gian."""
    def viec(ds):
        ra = []
        for t in tin:
            x = kb.tin_hieu(chuong, t).get("lam") if t in ds else None
            if x and x not in ra:
                ra.append(x)
        return ra[:3]

    phat, sua = viec(TIN_DUONG), viec((*TIN_AM, "dao"))
    canh = [kb.chuoi("canh_bao", n) for n in nhan.values() if kb.chuoi("canh_bao", n)]
    canh += [kb.chuoi("canh_bao", "nam").format(nam=n, mang=TEN_MANG[chuong]) for n in _nam(dm, "can_chu_dong", 2)]
    thuan = _nam(dm, "thuan", 2)
    if thuan:
        phat.append(kb.chuoi("canh_bao", "nam_thuan").format(nam=_noi(thuan), mang=TEN_MANG[chuong]))
    dg = [{k: v for k, v in d.items() if k in ("loi", "duong")} for d in kb.dan_gian(chuong)
          if d.get("khi") == "luon" or d.get("khi") in dieu_kien]
    return {"phat_huy": phat or [kb.chuoi("mac_dinh", "phat_huy", chuong)],
            "can_sua": sua or [kb.chuoi("mac_dinh", "can_sua", chuong)],
            "canh_bao": canh, "dan_gian": dg, "ghi_chu_dan_gian": kb.chuoi("ghi_chu_dan_gian")}


# ------------------------------------------------------------------ ghép vào báo cáo
def ap(ds_chuong: list[dict], ls: dict, cc: dict, dong: list[dict], tgb: list[dict], nam_am_xem: int, nam_am_sinh: int,
       tuoi_mu: int, gioi_tinh: str | None, sao_luu: dict | None = None) -> list[dict]:
    """Gắn `luan_hoi` vào năm chương mảng đời (sửa tại chỗ) → `nguoi_quanh` (rỗng khi không áp dụng)."""
    if not ngon_ngu.la_viet() or tuoi_mu - 1 < TUOI_TOI_THIEU or not kb.vai():
        return []
    dmap = {g["nam"]: g for g in dong}
    nq = {ma: nguoi(ls, cc, ma, gioi_tinh) for ma in kb.vai()}
    nghe, q, oq = _nghe(cc)
    for c in ds_chuong:
        ch = c["ma"]
        if ch not in CHUONG_CUNG:
            continue
        dm = dong_mang(ls, ch, nam_am_xem, nam_am_sinh, sao_luu, dmap)
        tin = _tin_chuong(ls, cc, ch)
        nhan: dict[str, str] = {}
        dk = set(t for t in tin if t in TIN_AM)
        if dk:
            dk.add("vuong")
        if ch == "tinh_cam":
            tl = _tra_loi_tinh_cam(ls, cc, dm, nq)
            nhan = {x["ma"]: x["nhan"] for x in tl if x["ma"] in ("ben", "nguoi_thu_ba")}
            if nhan_som_muon(ls, cc) != "som_thuan":
                dk.add("muon")
            dk.add(nhan["ben"])
        elif ch == "gia_dinh":
            tl = _tra_loi_gia_dinh(ls, cc, nq)
            if cc["Tử Nữ"]["muc"] == "can_chu_dong" or cc["Tử Nữ"]["cham"]:
                dk.add("con")
            if cc["Phụ Mẫu"]["muc"] == "can_chu_dong":
                dk.add("cha_me")
                nhan = {"cha_me": "it_duyen_gan"}
        elif ch == "su_nghiep":
            tl = _tra_loi_su_nghiep(ls, cc, dm, nq, nghe, q, oq)
            nhan = {x["ma"]: x["nhan"] for x in tl if x["ma"] == "di_xa"}
        elif ch == "tien_bac":
            tl = _tra_loi_tien_bac(ls, cc, dm, tgb, tuoi_mu)
            nhan = {x["ma"]: x["nhan"] for x in tl if x["ma"] == "giu_tien"}
        else:
            tl = _tra_loi_quan_he(ls, cc, nq)
            nhan = {x["ma"]: x["nhan"] for x in tl if x["ma"] == "lam_an_chung"}
            if any(x["ma"] == "thi_phi" and x["nhan"] == "co" for x in tl):
                nhan["thi_phi"] = "thi_phi"
        lh = {"tra_loi": [x for x in tl if x["tra_loi"]], "nguoi": [nq[m] for m in NGUOI_CHUONG.get(ch, ())],
              "hoa_giai": hoa_giai(ch, tin, dm, nhan, dk), "dong_mang": dm}
        if ch == "su_nghiep":
            lh["nghe"] = nghe
        c["luan_hoi"] = lh
    return list(nq.values())
