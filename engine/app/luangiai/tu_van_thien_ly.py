# -*- coding: utf-8 -*-
"""RS-3 — nối hai kho tri thức "sách hiện đại còn bản quyền, ban biên tập tóm ý" (PR #320) ra ĐÚNG chỗ chúng áp dụng.

* Tử Vân, *Đẩu Số Luận Mệnh* (`kb/data/tuvi_tu_van_thai_tue.json`) — sáu nguyên tắc, mỗi nguyên tắc chỉ hiện khi điều
  kiện của nó ĐÚNG trên lá số (đọc dữ kiện engine đã có: cung, phụ tinh, tứ hoá năm sinh, `phi_tu_can` của đại hạn / lưu
  niên — đúng hàm dòng Vận hạn dùng, không tính lại phép nào).
* Vi Thiên Lý, *Thiên Lý Mệnh Cảo* (`kb/data/battu_thien_ly_menh_cao.json`) — quy tắc theo thập thần của cách cục tháng
  sinh (Thất Sát · Thực Thần · Ấn) và theo ngoại cách hoá khí (`calc/battu_ngoai_cach`).

Chỉ thêm MỘT dòng vào `can_cu` ("Vì sao nói vậy") của chương / tiêu chí — không đổi mức, hộp, `ma_mau`, cốt lõi, lời mời
chương khoá (chương khoá chỉ giữ tiêu đề + `moi_xem`, `can_cu` bỏ hẳn ở bản xem trước). Lời Việt = `nghia_doi_thuong` +
một mặt (tích cực / nên chú ý) theo dữ kiện, có nhãn nguồn. Bản Anh: cùng số dòng (khung dữ kiện vi ↔ en như dòng Trung
Châu PR #320) nhưng chỉ nêu tên nguyên tắc — lời tóm ý chỉ có bản Việt. Điều kiện không xác định chắc → không có dòng."""
from __future__ import annotations

from app import ngon_ngu
from app.calc import lunar
from app.calc import tuvi_phi_hoa as phi_calc
from app.kb import tuong_hoc_dot4_kb as d4
from app.kb import tuvi_phai_kb

NHAN_TU_VAN = "Theo cách đọc của Tử Vân (Đẩu Số Luận Mệnh) — ban biên tập tóm ý"
NHAN_THIEN_LY = "Theo Thiên Lý Mệnh Cảo (Vi Thiên Lý) — ban biên tập tóm ý"
NHAN_TU_VAN_EN = "Ziyun (Doushu Lunming)"
NHAN_THIEN_LY_EN = "Qianli Minggao (Wei Qianli)"
_EN_DUOI = "editorial summary available in Vietnamese"

# Tên nguyên tắc ở bản Anh (không dấu Việt) — chỉ để giữ cùng số dòng căn cứ với bản Việt.
_TEN_EN = {"thai_tue_nhap_quai": "placing the other person's Tai Sui on your chart",
           "tam_dai_tien_hau_thien": "natal, decade and year transformations meeting in one palace",
           "giap_cung_va_phan_chieu": "a palace flanked on both sides",
           "song_loc_song_quyen_tai_bach": "double Lu / double Quan on the Life-Wealth-Career axis",
           "phu_the_va_phuc_duc": "reading the Spouse palace together with the Fortune palace",
           "chuyen_hoa_nang_luong_thuc_te": "turning the decade's energy into concrete work",
           "that_sat_che_kiep_cuu_tai": "Seven Killings structure",
           "thuc_than_tuoc_tho": "Eating God structure",
           "chinh_thien_an_ho_than": "Resource (Seal) structure",
           "hoa_khi_cach_dieu_kien": "transformation (hua qi) structure"}

# Cặp sao kẹp hai bên (một sao mỗi bên). Cát: Tả Hữu, Xương Khúc, Khôi Việt, Lộc Tồn + Hoá Lộc năm sinh (song Lộc giáp).
# Sát: Kình Đà, Hoả Linh, Không Kiếp.
_GIAP_CAT = (("Tả Phù", "Hữu Bật"), ("Văn Xương", "Văn Khúc"), ("Thiên Khôi", "Thiên Việt"), ("Lộc Tồn", "Hoá Lộc"))
_GIAP_SAT = (("Kình Dương", "Đà La"), ("Hỏa Tinh", "Linh Tinh"), ("Địa Không", "Địa Kiếp"))
# Cung chính xét giáp → chương hiện dòng.
GIAP_CUNG = {"Mệnh": "tong_quan", "Quan Lộc": "su_nghiep", "Tài Bạch": "tien_bac", "Điền Trạch": "nha_cua"}
TRUC_MTQ = ("Mệnh", "Tài Bạch", "Quan Lộc")
CUNG_TAM_DAI = ("Mệnh", "Tài Bạch", "Quan Lộc", "Phu Thê", "Điền Trạch")   # = CUNG_VAN_HAN của dòng Vận hạn
_SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp")
_CAT_HOA = ("Lộc", "Quyền", "Khoa")

# Bát tự: mã cách cục (calc.battu.TEN_CACH) → (thập thần tra KB, chương hiện dòng).
CACH_BT = {"that_sat": ("Thất Sát", "su_nghiep"), "thuc_than": ("Thực Thần", "tien_bac"),
           "chinh_an": ("Chính Ấn", "hoc_tap"), "thien_an": ("Thiên Ấn", "hoc_tap")}


def _nt(ma: str) -> dict:
    return (d4.tuvi_tu_van().get("nguyen_tac_tu_van") or {})[ma]


def _thien_ly(ma: str) -> dict | None:
    return next((r for r in tuvi_phai_kb.tra_thien_ly_menh_cao(None) + _tl_rieng() if r["ma"] == ma), None)


def _tl_rieng() -> list[dict]:
    rules = tuvi_phai_kb._thien_ly().get("quy_tac_thap_than_va_cach_cuc") or {}   # noqa: SLF001 — cùng kho
    return [{"ma": m, **v} for m, v in rules.items()]


def _dong(nhan: str, nhan_en: str, ma: str, muc: dict, su_kien: str, mat: tuple[str, ...]) -> str:
    """Một dòng căn cứ. `mat` ⊂ {"tich_cuc", "tieu_cuc"} — mặt nào đúng với dữ kiện thì nêu mặt đó."""
    if not ngon_ngu.la_viet():
        return f"{nhan_en} — {_TEN_EN[ma]} ({_EN_DUOI})"
    loi = [muc["nghia_doi_thuong"].strip()]
    if "tich_cuc" in mat:
        loi.append(muc["mat_tich_cuc"].strip())
    if "tieu_cuc" in mat:
        loi.append(muc["mat_tieu_cuc_can_chu_y"].strip())
    return f"{nhan} — {muc['ten']}: {su_kien}. " + " ".join(loi)


# ------------------------------------------------------------------ Tử vi (Tử Vân)
def _hoa_goc(ls: dict) -> dict[str, str]:
    return {x["hoa"]: x["cung"] for x in ls["tu_hoa"]}


def _sao_trong(ls: dict, c: dict) -> set[str]:
    s = set(c["phu_tinh"])
    s.update(f"Hoá {x['hoa']}" for x in ls["tu_hoa"] if x["cung"] == c["ten"])
    return s


def _giap(ls: dict, ten: str) -> tuple[list[tuple[str, str]], list[tuple[str, str]]]:
    """→ (cặp cát kẹp, cặp sát kẹp) của cung `ten` — mỗi bên kề một sao của cặp."""
    cung = ls["cung"]
    i = next(k for k, c in enumerate(cung) if c["ten"] == ten)
    a, b = _sao_trong(ls, cung[(i - 1) % 12]), _sao_trong(ls, cung[(i + 1) % 12])

    def kep(x: str, y: str) -> bool:
        return (x in a and y in b) or (y in a and x in b)

    return [p for p in _GIAP_CAT if kep(*p)], [p for p in _GIAP_SAT if kep(*p)]


def _dai_han(ls: dict, tuoi: int) -> dict | None:
    return next((c for c in ls["cung"] if c["dai_han"][0] <= tuoi <= c["dai_han"][1]), None)


def _hoa_den(can: str, ls: dict) -> dict[str, str | None]:
    return {x["hoa"]: x["den_cung"] for x in phi_calc.phi_tu_can(can, ls["cung"])}


def _dk_giap(ls: dict) -> dict[str, str]:
    ra = {}
    for ten, ch in GIAP_CUNG.items():
        cat, sat = _giap(ls, ten)
        if not cat and not sat:
            continue
        ds = [f"{x} và {y}" for x, y in cat + sat]
        sk = f"Cung {ten} có {'; '.join(ds)} kẹp hai bên"
        mat = (("tich_cuc",) if cat else ()) + (("tieu_cuc",) if sat else ())
        ra[ch] = _dong(NHAN_TU_VAN, NHAN_TU_VAN_EN, "giap_cung_va_phan_chieu", _nt("giap_cung_va_phan_chieu"), sk, mat)
    return ra


def _dk_song_loc(ls: dict, tuoi: int) -> str | None:
    goc = _hoa_goc(ls)
    loc_ton = next((c["ten"] for c in ls["cung"] if "Lộc Tồn" in c["phu_tinh"]), None)
    dh = _dai_han(ls, tuoi)
    den = _hoa_den(dh["can"], ls) if dh else {}
    su = []
    quyen = False
    if goc.get("Lộc") in TRUC_MTQ and loc_ton in TRUC_MTQ:
        su.append(f"Lộc Tồn ở {loc_ton} và Hoá Lộc năm sinh ở {goc['Lộc']} cùng nằm trên trục Mệnh – Tài – Quan")
    if goc.get("Lộc") in TRUC_MTQ and den.get("Lộc") in TRUC_MTQ:
        su.append(f"Hoá Lộc năm sinh ở {goc['Lộc']}, Hoá Lộc của đại hạn đang đi rơi vào {den['Lộc']}")
    if goc.get("Quyền") in TRUC_MTQ and den.get("Quyền") in TRUC_MTQ:
        su.append(f"Hoá Quyền năm sinh ở {goc['Quyền']}, Hoá Quyền của đại hạn đang đi rơi vào {den['Quyền']}")
        quyen = True
    if not su:
        return None
    mat = ("tich_cuc", "tieu_cuc") if quyen else ("tich_cuc",)
    return _dong(NHAN_TU_VAN, NHAN_TU_VAN_EN, "song_loc_song_quyen_tai_bach", _nt("song_loc_song_quyen_tai_bach"),
                 "; ".join(su), mat)


def nam_tam_dai(ls: dict, nam_am_xem: int, nam_am_sinh: int, so_nam: int = 10) -> tuple[int, str, str] | None:
    """Năm đầu tiên trong `so_nam` năm tới mà CÙNG một hoá (Lộc / Quyền / Khoa / Kỵ) của năm sinh, đại hạn và lưu niên
    rơi vào cùng một cung chính → (năm, hoá, cung). Đọc đúng `phi_tu_can` như dòng Vận hạn."""
    goc = _hoa_goc(ls)
    for k in range(so_nam):
        nam = nam_am_xem + k
        dh = _dai_han(ls, nam - nam_am_sinh + 1)
        if not dh:
            continue
        den_dh, den_ln = _hoa_den(dh["can"], ls), _hoa_den(lunar.can_chi_nam(nam)[0], ls)
        for h in ("Lộc", "Quyền", "Khoa", "Kỵ"):
            x = goc.get(h)
            if x in CUNG_TAM_DAI and den_dh.get(h) == x and den_ln.get(h) == x:
                return nam, h, x
    return None


def _dk_tam_dai(ls: dict, nam_am_xem: int, nam_am_sinh: int) -> str | None:
    t = nam_tam_dai(ls, nam_am_xem, nam_am_sinh)
    if not t:
        return None
    nam, h, cung = t
    sk = f"Năm {nam}, Hoá {h} của năm sinh, của đại hạn và của năm ấy cùng rơi vào cung {cung}"
    return _dong(NHAN_TU_VAN, NHAN_TU_VAN_EN, "tam_dai_tien_hau_thien", _nt("tam_dai_tien_hau_thien"), sk,
                 ("tieu_cuc",) if h == "Kỵ" else ("tich_cuc",))


def _dk_phu_the(ls: dict) -> str | None:
    if _hoa_goc(ls).get("Kỵ") != "Phúc Đức":
        return None
    return _dong(NHAN_TU_VAN, NHAN_TU_VAN_EN, "phu_the_va_phuc_duc", _nt("phu_the_va_phuc_duc"),
                 "Hoá Kỵ năm sinh ở cung Phúc Đức — đọc chuyện vợ chồng cần xem cả cung này", ("tieu_cuc",))


def _dk_chuyen_hoa(ls: dict, tuoi: int) -> str | None:
    dh = _dai_han(ls, tuoi)
    if not dh:
        return None
    den = _hoa_den(dh["can"], ls)
    co = [(h, den[h]) for h in ("Lộc", "Quyền") if den.get(h) in ("Quan Lộc", "Điền Trạch")]
    if not co:
        return None
    sk = "Đại hạn đang đi đưa " + ", ".join(f"Hoá {h} vào cung {c}" for h, c in co)
    return _dong(NHAN_TU_VAN, NHAN_TU_VAN_EN, "chuyen_hoa_nang_luong_thuc_te", _nt("chuyen_hoa_nang_luong_thuc_te"), sk,
                 ("tich_cuc", "tieu_cuc"))


def tuvi_dong(ls: dict, nam_am_xem: int, nam_am_sinh: int) -> dict[str, list[str]]:
    """→ {mã chương: [dòng căn cứ]} — chỉ chương có nguyên tắc thoả điều kiện."""
    tuoi = nam_am_xem - nam_am_sinh + 1
    ra: dict[str, list[str]] = {}
    for ch, d in _dk_giap(ls).items():
        ra.setdefault(ch, []).append(d)
    for ch, d in (("tien_bac", _dk_song_loc(ls, tuoi)), ("van_han", _dk_tam_dai(ls, nam_am_xem, nam_am_sinh)),
                  ("tinh_cam", _dk_phu_the(ls)), ("loi_khuyen", _dk_chuyen_hoa(ls, tuoi))):
        if d:
            ra.setdefault(ch, []).append(d)
    return ra


def ap_tuvi(ds: list[dict], ls: dict, nam_am_xem: int, nam_am_sinh: int) -> None:
    dong = tuvi_dong(ls, nam_am_xem, nam_am_sinh)
    for c in ds:
        c["can_cu"] = list(c.get("can_cu") or []) + dong.get(c["ma"], [])


def thai_tue(ls_ban: dict, chi_kia: str) -> str | None:
    """Thái Tuế nhập quái: chi năm sinh người kia đặt lên lá số bạn. Cung ấy có Hoá Kỵ năm sinh hoặc ≥ 2 sát tinh →
    mặt nên chú ý; có Hoá Lộc năm sinh hoặc Lộc Tồn (và không vướng) → mặt tích cực; còn lại không có dòng."""
    c = next((x for x in ls_ban["cung"] if x["chi"] == chi_kia), None)
    if c is None:
        return None
    goc = _hoa_goc(ls_ban)
    sat = [s for s in c["phu_tinh"] if s in _SAT]
    if goc.get("Kỵ") == c["ten"] or len(sat) >= 2:
        vuong = (["Hoá Kỵ năm sinh"] if goc.get("Kỵ") == c["ten"] else []) + (sat if len(sat) >= 2 else [])
        sk = f"Tuổi {chi_kia} của người ấy rơi vào cung {c['ten']} của bạn, nơi có {', '.join(vuong)}"
        return _dong(NHAN_TU_VAN, NHAN_TU_VAN_EN, "thai_tue_nhap_quai", _nt("thai_tue_nhap_quai"), sk, ("tieu_cuc",))
    tot = (["Hoá Lộc năm sinh"] if goc.get("Lộc") == c["ten"] else []) + (["Lộc Tồn"] if "Lộc Tồn" in c["phu_tinh"] else [])
    if tot:
        sk = f"Tuổi {chi_kia} của người ấy rơi vào cung {c['ten']} của bạn, nơi có {', '.join(tot)}"
        return _dong(NHAN_TU_VAN, NHAN_TU_VAN_EN, "thai_tue_nhap_quai", _nt("thai_tue_nhap_quai"), sk, ("tich_cuc",))
    return None


# ------------------------------------------------------------------ Bát tự (Thiên Lý Mệnh Cảo)
def battu_dong(pt: dict) -> dict[str, list[str]]:
    """`pt` = battu_doi_song.phan_tich(...). Mặt nêu theo sức tự thân: Thất Sát / Thực Thần — thân mạnh nêu mặt tích cực,
    thân yếu nêu mặt nên chú ý; Ấn — ngược lại (thân yếu cần Ấn, thân mạnh Ấn dày dễ ỷ lại); trung hoà chỉ nêu nghĩa."""
    ra: dict[str, list[str]] = {}
    cc = pt["cach_2"]
    if cc.get("ma") in CACH_BT:
        tt, ch = CACH_BT[cc["ma"]]
        ma = tuvi_phai_kb._THAP_THAN_RULE[tt]   # noqa: SLF001 — bảng thập thần → quy tắc của chính kho
        muc = _thien_ly(ma)
        than = pt["than"]
        an = tt in ("Chính Ấn", "Thiên Ấn")
        mat = (() if than == "can_bang" else
               ("tich_cuc",) if (than == "manh") != an else ("tieu_cuc",))
        sk = f"Lá số thuộc {cc['ten']} (theo tháng sinh), thân {'mạnh' if than == 'manh' else 'yếu' if than == 'yeu' else 'trung hoà'}"
        ra.setdefault(ch, []).append(_dong(NHAN_THIEN_LY, NHAN_THIEN_LY_EN, ma, muc, sk, mat))
    ng = pt.get("ngoai_cach")
    if ng and ng.get("ma") == "hoa_khi":
        ma = "hoa_khi_cach_dieu_kien"
        ra.setdefault("ngu_hanh", []).append(
            _dong(NHAN_THIEN_LY, NHAN_THIEN_LY_EN, ma, _thien_ly(ma),
                  "Lá số có dấu hiệu cách hoá khí (can ngày hợp can kề bên, đắc tháng sinh)", ("tich_cuc", "tieu_cuc")))
    return ra


def ap_battu(ds: list[dict], pt: dict) -> None:
    dong = battu_dong(pt)
    for c in ds:
        c["can_cu"] = list(c.get("can_cu") or []) + dong.get(c["ma"], [])
