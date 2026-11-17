# -*- coding: utf-8 -*-
"""LH-2 — RULES "Luận theo câu hỏi" cho Luận giải Bát tự đời sống (cùng khuôn LH-1 của Tử vi). Tất định, không LLM.

Thêm vào năm chương mảng đời trường `luan_hoi` {tra_loi, nguoi, hoa_giai, dong_mang, nghe?} và trường cấp báo cáo
`nguoi_quanh` — hình dạng y như Tử vi (`tuvi_luan_hoi`) để web vẽ bằng cùng component. Chỉ ĐỌC số đã tính:
`phan_tich` (tỉ lệ ngũ hành theo nhóm thập thần, thân mạnh / yếu, hai cách lấy dụng thần), `cham_mang` (mức từng mảng),
dòng mười năm (lưu niên hai cách), đại vận, thần sát, quan hệ giữa các trụ. Không đổi mức / hộp nào của báo cáo.

Lục thân theo Tử Bình: chi ngày = cung vợ chồng; sao vợ (nam) = Tài, sao chồng (nữ) = Quan Sát; Ấn = cha mẹ (mẹ);
Tỷ Kiếp = anh chị em, bạn bè ngang hàng; Quan Sát = cấp trên; Thực Thương = người dưới, học trò, khách; con = Quan Sát
(nam) / Thực Thương (nữ). Nghề theo cách cục (tháng sinh); la bàn nghề theo hành của HAI cách lấy dụng thần — hành hai
cách cùng cần mới gọi là "cả hai cách cùng cần", hệ thống không chọn thay (quy tắc hai cách của BT-ĐS).

Ranh giới như LH-1 (CLAUDE.md): nhãn là THẾ của lá số, kèm điều kiện + việc nên làm; không ngày tháng sự kiện, số con,
tuổi thọ, bệnh; chưa đủ 18 tuổi không nhận; chỉ bản Việt. Ngưỡng nhãn cân trên 1.000 lá mẫu (`tests/test_battu_luan_hoi.py`).
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb import battu_doi_song_kb as kb_ds
from app.kb import nap
from app.kb import tuvi_luan_hoi_kb as kb_tv
from app.luangiai import chu_y_nam as cyn
from app.luangiai import tuvi_luan_hoi as lh
from app.luangiai.doi_song_chung import _ma, slug

_TEP = "battu_luan_hoi_kb.json"
TUOI_TOI_THIEU = 18
SO_NAM = 10
CHUONG = ("tinh_cam", "gia_dinh", "su_nghiep", "tien_bac", "quan_he")
MANG_CYN = {"tinh_cam": "tinh_cam", "gia_dinh": "gia_dao", "su_nghiep": "cong_viec", "tien_bac": "tien_bac", "quan_he": "ban_be"}
NGUOI_CHUONG = {"tinh_cam": ("phoi_ngau",), "gia_dinh": ("cha_me", "con", "anh_em"), "su_nghiep": ("sep",),
                "quan_he": ("nguoi_ngoai",)}
TT_NHOM = {"Tỷ Kiên": "Tỷ Kiếp", "Kiếp Tài": "Tỷ Kiếp", "Thực Thần": "Thực Thương", "Thương Quan": "Thực Thương",
           "Chính Tài": "Tài", "Thiên Tài": "Tài", "Chính Quan": "Quan Sát", "Thất Sát": "Quan Sát",
           "Chính Ấn": "Ấn", "Thiên Ấn": "Ấn"}
QUY_NHAN = ("Thiên Ất Quý Nhân", "Thái Cực Quý Nhân", "Thiên Đức", "Nguyệt Đức")
_XUNG, _HINH, _HOP = {"lục xung"}, {"tương hình", "tự hình", "lục hại"}, {"lục hợp", "bán hợp", "tam hợp"}
_SO = {"thuan": 1, "can_bang": 0, "can_chu_dong": -1}
# Nhãn mỗi câu có thể nhận (đối chiếu KB trong test). Cùng mã câu với Tử vi → cùng lời trừ khi KB Bát tự ghi đè.
NHAN = {**{k: v for k, v in lh.NHAN.items()}, "kiem_bang_gi": ("chinh_tai", "thien_tai", "thuc_thuong", "quan_an"),
        "quy_nhan": ("nhieu", "co", "tu_luc")}


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(_TEP)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _kb(*khoa: str):
    x = _d()
    for k in khoa:
        if not isinstance(x, dict):
            return None
        x = x.get(k)
    return x


def _chuoi(*khoa: str) -> str:
    x = _kb(*khoa)
    return x.strip() if isinstance(x, str) else ""


def _o(ma: str, nhan: str) -> dict:
    """Ô câu trả lời: KB Bát tự ghi đè, không có thì dùng ô chung của Tử vi."""
    x = _kb("tra_loi", ma, nhan)
    return x if isinstance(x, dict) else kb_tv.tra_loi(ma, nhan)


def _cau(chuong: str, ma: str) -> str:
    return next((c["cau"] for c in kb_tv.cau(chuong) if c["ma"] == ma), "")


# ------------------------------------------------------------------ đọc lá số
def sao_phoi_ngau(pt: dict) -> str:
    return "Tài" if pt["gioi_tinh"] == "nam" else "Quan Sát"


def sao_con(pt: dict) -> str:
    return "Quan Sát" if pt["gioi_tinh"] == "nam" else "Thực Thương"


def _fit(pt: dict, g: str, cach: str) -> int:
    h = pt["nhom_hanh"][g]
    co = pt["muc_do"][g] in ("dam", "vua")
    if h in pt[cach]["hanh"] and co:
        return 1
    if h in pt[cach]["ky"] and pt["muc_do"][g] == "dam":
        return -1
    return 0


def muc_nhom(pt: dict, g: str) -> str:
    """Mức của một nhóm người theo HAI cách lấy dụng thần (gộp lỏng như đại vận: cùng chiều thì giữ, ngược nhau thì cân bằng)."""
    s = _fit(pt, g, "cach_1") + _fit(pt, g, "cach_2")
    return "thuan" if s > 0 else "can_chu_dong" if s < 0 else "can_bang"


def _the(pt: dict, g: str) -> str:
    """Thế của nhóm với người xem: hop (đỡ) · nang (đậm quá sức) · mo (mờ / vắng) · vua."""
    md = pt["muc_do"][g]
    if md in ("mong", "vang"):
        return "mo"
    if md == "dam" and (pt["than"] == "yeu" or muc_nhom(pt, g) == "can_chu_dong"):
        return "nang"
    return "hop" if muc_nhom(pt, g) == "thuan" else "vua"


def _qh(pt: dict, a: int, b: int | None = None) -> set[str]:
    """Loại quan hệ địa chi (xung / hinh / hop) của trụ `a` (với trụ `b`, hoặc với bất kỳ trụ nào)."""
    ra = set()
    for q in pt["mr"]["quan_he"]:
        if q["loai"].startswith("can ") or a not in q["tru"] or (b is not None and b not in q["tru"]):
            continue
        ra |= {"xung"} if q["loai"] in _XUNG else {"hinh"} if q["loai"] in _HINH else {"hop"} if q["loai"] in _HOP else set()
    return ra


def _mo_ta_nhom(pt: dict, g: str) -> str:
    md = {"dam": "đậm", "vua": "vừa", "mong": "mỏng", "vang": "vắng"}[pt["muc_do"][g]]
    return (f"{g} (hành {pt['nhom_hanh'][g]}) chiếm {round(pt['ty_le'][g] * 100)}% điểm ngũ hành ({md}); thân {pt['ls']['than']['ket_luan']}; "
            f"cách 1 {'cần' if pt['nhom_hanh'][g] in pt['cach_1']['hanh'] else 'không cần'}, "
            f"cách 2 {'cần' if pt['nhom_hanh'][g] in pt['cach_2']['hanh'] else 'không cần'} hành này")


def _mo_ta_ngay(pt: dict) -> str:
    tru = pt["ls"]["tru"][2]
    tt = pt["ls"]["thap_than_chi"][2][0]
    qh = [q["mo_ta"] for q in pt["mr"]["quan_he"] if 2 in q["tru"] and not q["loai"].startswith("can ")]
    return f"Chi ngày {tru['chi']} (cung vợ chồng), bản khí là {tt}" + (f"; {'; '.join(qh)}" if qh else "; không xung, hình, hợp với trụ khác")


def _lo(pt: dict, *ten: str) -> bool:
    return any(pt["lo"].get(t) for t in ten)


def _co_sat(pt: dict, *ten: str) -> bool:
    return any(t in pt["than_sat"] for t in ten)


# ------------------------------------------------------------------ nhãn (luật công khai)
def diem_hon_nhan(pt: dict) -> int:
    """Dấu hiệu "dễ dang dở" trừ dấu hiệu "êm" ở cung và sao vợ chồng."""
    g, qh = sao_phoi_ngau(pt), _qh(pt, 2)
    d = 2 * ("xung" in qh) + ("hinh" in qh)
    d += pt["muc_do"][g] == "vang"
    if pt["gioi_tinh"] == "nam":
        d += _lo(pt, "Chính Tài") and _lo(pt, "Thiên Tài")              # tài tạp
        d += pt["muc_do"]["Tỷ Kiếp"] == "dam"                            # tỷ kiếp tranh tài
    else:
        d += _lo(pt, "Chính Quan") and _lo(pt, "Thất Sát")              # quan sát hỗn tạp
        d += _lo(pt, "Thương Quan") and pt["muc_do"]["Thực Thương"] == "dam"   # thương quan nặng
    d += _co_sat(pt, "Cô Thần", "Quả Tú")
    d -= "hop" in qh
    d -= muc_nhom(pt, g) == "thuan"
    return d


def nhan_ben(pt: dict) -> str:
    d = diem_hon_nhan(pt)
    return "mot_moi_ben" if d <= 0 else "ben_neu_vun" if d == 1 else "muon_moi_ben" if d == 2 else "hai_lan_do"


def nhan_nguoi_thu_ba(pt: dict) -> str:
    g = sao_phoi_ngau(pt)
    tap = (_lo(pt, "Chính Tài") and _lo(pt, "Thiên Tài")) if pt["gioi_tinh"] == "nam" else (_lo(pt, "Chính Quan") and _lo(pt, "Thất Sát"))
    a = (_co_sat(pt, "Đào Hoa") + _co_sat(pt, "Hồng Diễm") + bool(tap)) >= 2          # phía bạn: đào hoa + sao phối ngẫu tạp
    # người tranh: Tỷ Kiếp đậm, lộ ra thiên can, mà sao vợ chồng ít (lộ một can thì sao vợ chồng phải mỏng hẳn)
    lo = pt["lo"].get("Tỷ Kiên", 0) + pt["lo"].get("Kiếp Tài", 0)
    b = pt["muc_do"]["Tỷ Kiếp"] == "dam" and ((lo >= 2 and pt["muc_do"][g] in ("mong", "vua")) or (lo >= 1 and pt["muc_do"][g] == "mong"))
    return "ca_hai" if a and b else "phia_nguoi_ay" if b else "phia_ban" if a else "it_dau_hieu"


def nhan_som_muon(pt: dict) -> str:
    g, qh = sao_phoi_ngau(pt), _qh(pt, 2)
    d = (pt["muc_do"][g] == "vang") + ("xung" in qh) + ("hinh" in qh) + _co_sat(pt, "Cô Thần", "Quả Tú")
    return "som_thuan" if d == 0 else "muon_thi_ben" if d <= 2 else "lan_dan"


def ma_nghe(pt: dict) -> str:
    ma = pt["cach_2"]["ma"]
    return "ty_kiep" if ma in ("kien_loc", "duong_nhan", "nguyet_kiep") else ma


def nhan_chu_hay_cong(pt: dict) -> str:
    kieu = (_kb("cach_nghe", ma_nghe(pt)) or {}).get("kieu", "to_chuc")
    if kieu == "chu" and pt["than"] == "yeu":            # cách làm chủ mà thân yếu: sức chưa kham → theo nghề
        return "chuyen_mon"
    if kieu != "chu" and pt["than"] == "manh" and _lo(pt, "Thất Sát", "Thiên Tài", "Kiếp Tài"):
        return "lam_chu"
    return {"chu": "lam_chu"}.get(kieu, kieu)


def nhan_hoc_hanh(pt: dict, cm: dict) -> str:
    m = cm["hoc_tap"]["muc"]
    co = _co_sat(pt, "Văn Xương", "Học Đường")
    return "sang" if m == "thuan" or (co and m == "can_bang" and pt["muc_do"]["Ấn"] in ("vua", "dam")) else \
        "it" if m == "can_chu_dong" or pt["muc_do"]["Ấn"] == "vang" and pt["muc_do"]["Thực Thương"] in ("mong", "vang") else "vua"


def nhan_di_xa(pt: dict) -> str:
    ma, xung = _co_sat(pt, "Dịch Mã"), "xung" in (_qh(pt, 0, 1) | _qh(pt, 1, 2))
    if ma:
        return "hop_di_xa"
    return "nen_o_gan" if not xung and pt["than"] == "yeu" and muc_nhom(pt, "Ấn") == "thuan" else "o_gan_di_duoc"


def nhan_giu_tien(pt: dict) -> str:
    tai = pt["muc_do"]["Tài"]
    kiep = pt["muc_do"]["Tỷ Kiếp"] == "dam" and _lo(pt, "Kiếp Tài")            # kiếp tài lộ mà đậm: tiền dễ bị chia
    if kiep or (tai == "dam" and pt["than"] == "yeu"):
        return "giu_kem"
    return "giu_tot" if tai in ("vua", "dam") and pt["than"] != "yeu" else "giu_vua"


def nhan_cong_danh(pt: dict) -> str:
    co = lambda g: pt["muc_do"][g] in ("vua", "dam")  # noqa: E731
    if co("Quan Sát") and co("Ấn") and muc_nhom(pt, "Quan Sát") == "thuan":
        return "co_chuc"
    return "co_tieng" if (co("Quan Sát") and muc_nhom(pt, "Quan Sát") != "can_chu_dong") or (co("Ấn") and _lo(pt, "Chính Ấn", "Thiên Ấn")) else "thuc_luc"


def nhan_kinh_doanh(pt: dict, cm: dict) -> str:
    if cm["tien_bac"]["muc"] == "can_chu_dong" or (nhan_giu_tien(pt) == "giu_kem" and cm["tien_bac"]["muc"] != "thuan"):
        return "luong_on_dinh"
    return "hop_kinh_doanh" if nhan_chu_hay_cong(pt) == "lam_chu" else "luong_cong_them"


def nhan_kiem_bang_gi(pt: dict) -> str:
    md = pt["muc_do"]
    if md["Tài"] in ("mong", "vang"):
        return "thuc_thuong" if md["Thực Thương"] in ("vua", "dam") else "quan_an"
    if md["Thực Thương"] == "dam" and md["Tài"] != "dam":
        return "thuc_thuong"
    return "thien_tai" if pt["dem"].get("Thiên Tài", 0) > pt["dem"].get("Chính Tài", 0) else "chinh_tai"


def nhan_quy_nhan(pt: dict) -> str:
    n = sum(1 for t in QUY_NHAN if t in pt["than_sat"])
    return "nhieu" if n >= 3 else "co" if n == 2 or "Thiên Ất Quý Nhân" in pt["than_sat"] else "tu_luc"


def nhan_lam_an_chung(pt: dict) -> str:
    m = muc_nhom(pt, "Tỷ Kiếp")
    if m == "can_chu_dong" and _lo(pt, "Kiếp Tài"):
        return "nen_tu_lam"
    return "hop_tac_duoc" if m == "thuan" else "can_giay_to"


def nhan_thi_phi(pt: dict) -> str:
    return "co" if (_lo(pt, "Thương Quan") and pt["dem"].get("Chính Quan", 0) > 0) or \
        _co_sat(pt, "Kiếp Sát") and _co_sat(pt, "Vong Thần") else "it"


# ------------------------------------------------------------------ dấu hiệu của chương (cùng mã với Tử vi → cùng kho lời)
def tin_hieu(pt: dict, chuong: str) -> list[str]:
    g = {"tinh_cam": sao_phoi_ngau(pt), "gia_dinh": "Ấn", "su_nghiep": "Quan Sát", "tien_bac": "Tài", "quan_he": "Tỷ Kiếp"}[chuong]
    tru = {"tinh_cam": (2,), "gia_dinh": (1, 3), "su_nghiep": (1,), "tien_bac": (), "quan_he": (0,)}[chuong]
    f1, f2 = _fit(pt, g, "cach_1"), _fit(pt, g, "cach_2")
    qh = set().union(*(_qh(pt, t) for t in tru)) if tru else set()
    ra = []
    if f1 == 1 and f2 == 1:
        ra.append("loc")
    if any(t in pt["than_sat"] for t in QUY_NHAN):
        ra.append("cat")
    if f1 + f2 > 0:
        ra.append("sang")
    if chuong in ("su_nghiep", "quan_he") and _co_sat(pt, "Dịch Mã"):
        ra.append("ma")
    if f1 == -1 or f2 == -1:
        ra.append("ky")
    if "xung" in qh:
        ra.append("sat")
    if pt["muc_do"][g] == "dam" and pt["than"] == "yeu":
        ra.append("ham")
    if pt["muc_do"][g] in ("mong", "vang"):
        ra.append("cham")
    if chuong in ("tinh_cam", "gia_dinh", "quan_he") and _co_sat(pt, "Cô Thần", "Quả Tú"):
        ra.append("co_qua")
    if chuong == "tinh_cam" and _co_sat(pt, "Đào Hoa", "Hồng Diễm"):
        ra.append("dao")
    return ra


# ------------------------------------------------------------------ dòng mười năm theo mảng
def dong_mang(pt: dict, chuong: str, dong: list[dict]) -> list[dict]:
    """Mười năm của MỘT mảng. Năm "nên đi chậm" = đúng các năm `chu_y_nam.battu_nam` (một nguồn với hộp "Năm nên chú
    ý…"); năm thuận = thập thần can năm thuộc nhóm của mảng VÀ không cách nào thấy năm ấy cần lưu ý, ít nhất một cách
    thấy thuận; tình cảm: năm sao vợ chồng tới mà hai cách không thấy cần lưu ý → năm có duyên."""
    g = {"tinh_cam": sao_phoi_ngau(pt), "gia_dinh": "Ấn", "su_nghiep": "Quan Sát", "tien_bac": "Tài", "quan_he": "Tỷ Kiếp"}[chuong]
    cham = {x["nam"]: x["can_cu"] for x in cyn.battu_nam(pt["ls"], dong, MANG_CYN[chuong])}
    ra = []
    for d in dong[:SO_NAM]:
        nam, tt = d["nam"], d.get("_tt")
        dung_nhom = TT_NHOM.get(tt or "") == g
        hai = (d.get("muc_cach_1"), d.get("muc_cach_2"))
        hy = chuong == "tinh_cam" and dung_nhom and "can_chu_dong" not in hai and nam not in cham
        cu = [f"Năm {nam}: can năm là {tt} với nhật chủ; cách 1 {kb_ds.nhan_muc(hai[0] or 'can_bang')}, cách 2 {kb_ds.nhan_muc(hai[1] or 'can_bang')}"] if tt else []
        if nam in cham:
            muc, y, cu = "can_chu_dong", kb_tv.chuoi("dong_mang", "can_chu_dong"), cham[nam]
        elif hy:
            muc, y = "thuan", _chuoi("dong_mang", "hy")
        elif dung_nhom and "thuan" in hai and "can_chu_dong" not in hai:
            muc, y = "thuan", _chuoi("dong_mang", "thuan")
        else:
            muc, y = "can_bang", kb_tv.chuoi("dong_mang", "noi" if dung_nhom else "can_bang")
        ra.append({"nam": nam, "tuoi": d.get("tuoi"), "muc": muc, "nhan_muc": kb_ds.nhan_muc(muc), "y": y, "hy": bool(hy),
                   "noi": bool(dung_nhom), "hien_tai": bool(d.get("hien_tai")), "can_cu": cu})
    return ra


# ------------------------------------------------------------------ người quanh bạn
def _ten_vai(ma: str, gt: str) -> str:
    v = _kb("vai", ma) or {}
    return (v.get(f"ten_{gt}") if ma == "phoi_ngau" else None) or v.get("ten") or ma


def nguoi(pt: dict, cm: dict, ma: str) -> dict:
    v = _kb("vai", ma) or {}
    goi, ten = v.get("goi", ""), _ten_vai(ma, pt["gioi_tinh"])
    song, di, ve = "", [], []
    if ma == "phoi_ngau":
        g = sao_phoi_ngau(pt)
        tt = pt["ls"]["thap_than_chi"][2][0]
        o = _kb("thap_than_nguoi", tt) or {}
        cd = lh._hoa_dau(_chuoi("chan_dung_mau", "phoi_ngau").format(vai=ten, kieu=o.get("kieu", "")))
        song = o.get("song", "")
        muc = cm["tinh_cam"]["muc"]
        qh = _qh(pt, 2)
        ve = [_chuoi("tac_dong", "phoi_ngau", _the(pt, g))]
        if "xung" in qh or "hinh" in qh:
            ve.append(_chuoi("tac_dong", "phoi_ngau", "xung"))
        elif "hop" in qh:
            ve.append(_chuoi("tac_dong", "phoi_ngau", "hop_chi"))
        cu = [_mo_ta_ngay(pt), f"Sao vợ chồng: {_mo_ta_nhom(pt, g)}"]
    elif ma == "con":
        g = sao_con(pt)
        cd = _chuoi("chan_dung_mau", {"dam": "con_dam", "vua": "con_ro", "mong": "con_mong", "vang": "con_vang"}[pt["muc_do"][g]])
        muc = muc_nhom(pt, g)
        di = [_chuoi("tac_dong", "con", _the(pt, g))]
        if _qh(pt, 2, 3) & {"xung", "hinh"}:
            di.append(_chuoi("tac_dong", "con", "xung"))
            muc = "can_chu_dong" if muc != "thuan" else "can_bang"
        cu = [f"Sao con cái: {_mo_ta_nhom(pt, g)}", "Trụ giờ là cung con cái"]
    else:
        g = v["nhom"]
        cd = lh._hoa_dau(_chuoi("chan_dung_mau", {"dam": "dam", "vua": "ro", "mong": "mong", "vang": "vang"}[pt["muc_do"][g]]).format(goi=goi))
        muc = muc_nhom(pt, g)
        cau = _chuoi("tac_dong", g, _the(pt, g))
        (di if g == "Thực Thương" else ve).append(cau)
        cu = [_mo_ta_nhom(pt, g)]
    return {"ma": ma, "ten": ten, "muc": muc, "nhan_muc": kb_ds.nhan_muc(muc), "chan_dung": cd, "song_chung": song,
            "ban_voi_ho": [x for x in di if x], "ho_voi_ban": [x for x in ve if x], "tu_chuong": v.get("chuong", ""), "can_cu": cu}


# ------------------------------------------------------------------ câu trả lời
def _tl(chuong: str, ma: str, nhan: str, can_cu: list[str], tl: str | None = None, gt: str | None = None, **bien) -> dict:
    o = _o(ma, nhan)
    t = tl if tl is not None else o.get("tl", "")
    g = gt if gt is not None else o.get("gt", "")
    if bien:
        t, g = t.format(**bien), g.format(**bien)
    return {"ma": ma, "cau": _cau(chuong, ma), "tra_loi": t.strip(), "giai_thich": " ".join(g.split()), "nhan": nhan,
            "sac": lh.SAC.get(nhan, "can_bang"), "can_cu": [c for c in can_cu if c], "ma_mau": _ma("ds.bt", chuong, "hoi", ma, nhan)}


def _do_vuong(chuong: str, tin: list[str]) -> str:
    do = [kb_tv.tin_hieu(chuong, t).get("y") for t in tin if t in lh.TIN_DUONG]
    vuong = [kb_tv.tin_hieu(chuong, t).get("y") for t in tin if t in lh.TIN_AM]
    p = []
    if any(do):
        p.append(f"{kb_tv.chuoi('nhan_tin_hieu', 'do')}: {'; '.join(x for x in do[:3] if x)}.")
    if any(vuong):
        p.append(f"{kb_tv.chuoi('nhan_tin_hieu', 'vuong')}: {'; '.join(x for x in vuong[:3] if x)}.")
    return " ".join(p)


def _trac_tro(chuong: str, tin: list[str], dm: list[dict], cu: list[str]) -> dict:
    am = [t for t in tin if t in lh.TIN_AM]
    vuong = [x for x in (kb_tv.tin_hieu(chuong, t).get("y") for t in am) if x][:3]
    cham = lh._nam(dm, "can_chu_dong")
    if not vuong and not cham:
        return _tl(chuong, "trac_tro", "it", cu)
    gt = kb_tv.chuoi("nam_cham").format(ds=lh._noi(cham)) if cham else ""
    if not vuong:
        return _tl(chuong, "trac_tro", "co", cu, tl=gt, gt="")
    return _tl(chuong, "trac_tro", "co", cu + [c for x in dm if x["muc"] == "can_chu_dong" for c in x["can_cu"]][:3],
               tl=kb_tv.tra_loi("trac_tro", "co").get("tl", "").format(y="; ".join(vuong)),
               gt=" ".join(x for x in [kb_tv.tin_hieu(chuong, am[0]).get("lam", ""), gt] if x))


def la_ban_nghe(pt: dict) -> dict:
    """Năm hành: `chinh` = hành cả hai cách lấy dụng thần cùng cần; `phu` = chỉ một cách cần. Không chọn thay người xem."""
    h1, h2 = pt["cach_1"]["hanh"], pt["cach_2"]["hanh"]
    nganh = kb_tv.lay("hanh_nganh") or {}
    ten = {"Mộc": "Mộc", "Hỏa": "Hoả", "Thổ": "Thổ", "Kim": "Kim", "Thủy": "Thuỷ"}          # KB ngành dùng chính tả "Hoả, Thuỷ"
    hanh = [{"hanh": ten[h], "nganh": nganh.get(ten[h], ""), "cap": "chinh" if h in h1 and h in h2 else "phu" if h in h1 or h in h2 else ""}
            for h in ("Mộc", "Hỏa", "Thổ", "Kim", "Thủy")]
    ca_hai = [x for x in hanh if x["cap"] == "chinh"]
    mot = [x for x in hanh if x["cap"] == "phu"]
    if ca_hai:
        cau = _chuoi("nghe_mau", "hanh_ca_hai").format(hanh=", ".join(x["hanh"] for x in ca_hai), nganh=ca_hai[0]["nganh"])
    elif mot:
        cau = _chuoi("nghe_mau", "hanh_mot").format(ds=", ".join(x["hanh"] for x in mot))
    else:
        cau = ""
    return {"hanh": hanh, "noi_bat": (ca_hai or mot or [{"hanh": None}])[0]["hanh"], "cau": cau, "nhan": _kb("nghe_mau", "nhan") or {},
            "can_cu": [f"Cách 1 (cân sức): cần {', '.join(h1) or 'không rõ'}", f"Cách 2 (theo tháng sinh, {pt['cach_2']['ten']}): cần {', '.join(h2) or 'không rõ'}"]}


def _tra_loi(chuong: str, pt: dict, cm: dict, dm: list[dict], nq: dict[str, dict], tgb: list[dict], nghe: dict) -> list[dict]:
    tin = tin_hieu(pt, chuong)
    if chuong == "tinh_cam":
        g = sao_phoi_ngau(pt)
        cu = [_mo_ta_ngay(pt), f"Sao vợ chồng: {_mo_ta_nhom(pt, g)}"]
        muc, p = cm["tinh_cam"]["muc"], nq["phoi_ngau"]
        tt = pt["ls"]["thap_than_chi"][2][0]
        thang = kb_tv.chuoi("ghi_chu_thang")
        b = nhan_ben(pt)
        sm = nhan_som_muon(pt)
        them = []
        hy = [x["nam"] for x in dm if x["hy"]][:3]
        if hy:
            them.append(kb_tv.chuoi("nam_hy").format(ds=lh._noi(hy)))
        cham = lh._nam(dm, "can_chu_dong")
        if cham:
            them.append(kb_tv.chuoi("nam_cham").format(ds=lh._noi(cham)))
        return [
            _tl(chuong, "hanh_phuc", muc, cu, gt=f"{_o('hanh_phuc', muc).get('gt', '')} {_do_vuong(chuong, tin)}"),
            {**_tl(chuong, "nguoi_ay", slug(tt), cu[:1], tl=p["chan_dung"], gt=" ".join(x for x in [p["song_chung"], *p["ho_voi_ban"][:1]] if x)), "sac": muc},
            _tl(chuong, "ben", b, cu, gt=f"{_o('ben', b).get('gt', '')} {thang}" if b in ("muon_moi_ben", "hai_lan_do") else None),
            _tl(chuong, "nguoi_thu_ba", nhan_nguoi_thu_ba(pt), cu + [f"Thần sát: {', '.join(t for t in ('Đào Hoa', 'Hồng Diễm') if t in pt['than_sat']) or 'không có Đào Hoa, Hồng Diễm'}",
                                                                      f"Tỷ Kiếp: {_mo_ta_nhom(pt, 'Tỷ Kiếp')}"]),
            _tl(chuong, "som_muon", sm, cu, gt=" ".join([_o("som_muon", sm).get("gt", ""), *them])),
        ]
    if chuong == "gia_dinh":
        ra = []
        for ma, vai_ma in (("cha_me", "cha_me"), ("con_cai", "con"), ("anh_em", "anh_em")):
            p = nq[vai_ma]
            ra.append(_tl(chuong, ma, p["muc"], p["can_cu"][:1], gt=" ".join(x for x in [_o(ma, p["muc"]).get("gt", ""), p["chan_dung"]] if x)))
        # bạn → người nhà: phần vật chất bạn lo (Tài) + cách bạn với con; rồi mới tới người nhà → bạn (cha mẹ)
        di = [_chuoi("tac_dong", "Tài", _the(pt, "Tài")), *nq["con"]["ban_voi_ho"][:1], *nq["cha_me"]["ho_voi_ban"][:1]]
        ra.append(_tl(chuong, "tac_dong_nha", "co", [f"Tài: {_mo_ta_nhom(pt, 'Tài')}", *nq["con"]["can_cu"][:1], *nq["cha_me"]["can_cu"][:1]],
                      tl=f"{kb_tv.tra_loi('tac_dong_nha', 'co').get('tl', '')} {di[0]}", gt=" ".join(di[1:3])))
        return ra
    if chuong == "su_nghiep":
        ma_n = ma_nghe(pt)
        o = _kb("cach_nghe", ma_n) or {}
        cu = [f"Cách cục theo tháng sinh: {pt['cach_2']['ten']}", f"Quan Sát: {_mo_ta_nhom(pt, 'Quan Sát')}"]
        s, muc = nq["sep"], cm["su_nghiep"]["muc"]
        return [
            _tl(chuong, "nghe_hop", ma_n, cu[:1] + nghe["can_cu"], tl=_chuoi("nghe_mau", "tl").format(viec=o.get("viec", ""), nganh="; ".join(o.get("nganh", []))),
                gt=" ".join(x for x in [_chuoi("nghe_mau", "than_yeu") if o.get("kieu") == "chu" and pt["than"] == "yeu" else "", nghe["cau"]] if x)),
            _tl(chuong, "chu_hay_cong", nhan_chu_hay_cong(pt), cu[:1] + [f"Thân {pt['ls']['than']['ket_luan']}"]),
            _tl(chuong, "trai_nghe", muc, cu, viec=o.get("viec", "bạn làm tốt nhất")),
            _tl(chuong, "hoc_hanh", nhan_hoc_hanh(pt, cm), [f"Ấn: {_mo_ta_nhom(pt, 'Ấn')}",
                                                            f"Thần sát học hành: {', '.join(t for t in ('Văn Xương', 'Học Đường') if t in pt['than_sat']) or 'không có'}"]),
            _tl(chuong, "sep", s["muc"], s["can_cu"], gt=" ".join(x for x in [*s["ho_voi_ban"], _o("sep", s["muc"]).get("gt", "")] if x)),
            _tl(chuong, "dong_nghiep", muc_nhom(pt, "Tỷ Kiếp"), [f"Tỷ Kiếp: {_mo_ta_nhom(pt, 'Tỷ Kiếp')}"]),
            _tl(chuong, "di_xa", nhan_di_xa(pt), [f"Dịch Mã: {'có' if 'Dịch Mã' in pt['than_sat'] else 'không có'}; trụ năm – tháng – ngày: "
                                                  f"{'có xung' if 'xung' in (_qh(pt, 0, 1) | _qh(pt, 1, 2)) else 'không xung'}"]),
            _trac_tro(chuong, tin, dm, cu),
        ]
    if chuong == "tien_bac":
        cu = [f"Tài: {_mo_ta_nhom(pt, 'Tài')}", f"Tỷ Kiếp: {_mo_ta_nhom(pt, 'Tỷ Kiếp')}"]
        kha = [g for g in tgb if g["muc"] == "thuan" and g["den_tuoi"] >= pt["tuoi"]][:3]
        ra = [
            _tl(chuong, "kiem_bang_gi", nhan_kiem_bang_gi(pt), cu[:1] + [f"Thực Thương: {_mo_ta_nhom(pt, 'Thực Thương')}"]),
            _tl(chuong, "giu_tien", nhan_giu_tien(pt), cu),
            _tl(chuong, "cong_danh", nhan_cong_danh(pt), [f"Quan Sát: {_mo_ta_nhom(pt, 'Quan Sát')}", f"Ấn: {_mo_ta_nhom(pt, 'Ấn')}"]),
            _tl(chuong, "kinh_doanh", nhan_kinh_doanh(pt, cm), cu),
        ]
        if kha:
            ra.append(_tl(chuong, "giai_doan_kha", "co", [f"Đại vận {g['cung']} ({g['tu_tuoi']}–{g['den_tuoi']} tuổi): Thuận lợi" for g in kha],
                          ds="; ".join(f"tuổi {g['tu_tuoi']}–{g['den_tuoi']} ({g['nam_tu']}–{g['nam_den']})" for g in kha)))
        else:
            ra.append(_tl(chuong, "giai_doan_kha", "deu", ["Không còn đại vận nào hai cách cùng chấm Thuận lợi từ tuổi hiện tại"]))
        ra.append(_trac_tro(chuong, tin, dm, cu))
        return ra
    cu = [f"Tỷ Kiếp: {_mo_ta_nhom(pt, 'Tỷ Kiếp')}"]
    return [
        _tl(chuong, "ban_be", cm["quan_he"]["muc"], cu),
        _tl(chuong, "quy_nhan", nhan_quy_nhan(pt), [f"Thần sát quý nhân: {', '.join(t for t in QUY_NHAN if t in pt['than_sat']) or 'không có'}"]),
        _tl(chuong, "lam_an_chung", nhan_lam_an_chung(pt), cu),
        _tl(chuong, "thi_phi", nhan_thi_phi(pt), [f"Thương Quan lộ: {'có' if _lo(pt, 'Thương Quan') else 'không'}; Kiếp Sát, Vong Thần: "
                                                  f"{', '.join(t for t in ('Kiếp Sát', 'Vong Thần') if t in pt['than_sat']) or 'không có'}"]),
    ]


# ------------------------------------------------------------------ ghép vào báo cáo
def ap(ds_chuong: list[dict], pt: dict, cm: dict, dong: list[dict], tgb: list[dict]) -> list[dict]:
    """Gắn `luan_hoi` vào năm chương mảng đời (sửa tại chỗ) → `nguoi_quanh` (rỗng khi không áp dụng)."""
    if not ngon_ngu.la_viet() or pt.get("tuoi", 0) < TUOI_TOI_THIEU or not _kb("vai"):
        return []
    nq = {ma: nguoi(pt, cm, ma) for ma in _kb("vai")}
    nghe = la_ban_nghe(pt)
    for c in ds_chuong:
        ch = c["ma"]
        if ch not in CHUONG:
            continue
        dm = dong_mang(pt, ch, dong)
        tin = tin_hieu(pt, ch)
        tl = _tra_loi(ch, pt, cm, dm, nq, tgb, nghe)
        dk = {t for t in tin if t in lh.TIN_AM}
        if dk:
            dk.add("vuong")
        theo = {"tinh_cam": ("ben", "nguoi_thu_ba"), "su_nghiep": ("di_xa",), "tien_bac": ("giu_tien",), "quan_he": ("lam_an_chung",)}.get(ch, ())
        nhan = {x["ma"]: x["nhan"] for x in tl if x["ma"] in theo}
        if ch == "tinh_cam":
            if nhan_som_muon(pt) != "som_thuan":
                dk.add("muon")
            dk.add(nhan["ben"])
        elif ch == "gia_dinh":
            if nq["con"]["muc"] == "can_chu_dong":
                dk.add("con")
            if nq["cha_me"]["muc"] == "can_chu_dong":
                dk.add("cha_me")
                nhan = {"cha_me": "it_duyen_gan"}
        elif ch == "quan_he" and any(x["ma"] == "thi_phi" and x["nhan"] == "co" for x in tl):
            nhan["thi_phi"] = "thi_phi"
        c["luan_hoi"] = {"tra_loi": [x for x in tl if x["tra_loi"]], "nguoi": [nq[m] for m in NGUOI_CHUONG.get(ch, ())],
                         "hoa_giai": lh.hoa_giai(ch, tin, dm, nhan, dk), "dong_mang": dm, **({"nghe": nghe} if ch == "su_nghiep" else {})}
    lh.dat_cau_mau(ds_chuong)
    return list(nq.values())
