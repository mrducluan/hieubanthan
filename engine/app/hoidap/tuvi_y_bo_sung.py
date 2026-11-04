# -*- coding: utf-8 -*-
"""TV-YBS — "Một cách đọc thêm" trong hỏi đáp Tử vi (RULES, tất định, không LLM).

Chỉ thêm khi câu hỏi đúng loại (tình duyên · công việc / tiền · sao ở một cung · năm / giai đoạn · sức khoẻ theo thời
điểm), lá số của chính người hỏi có mục KB `tuvi_y_bo_sung` khớp (`luangiai.tuvi_y_bo_sung`), và câu không phải câu
đặc biệt (khủng hoảng, từ chối, dẫn hướng), không cần thêm dữ liệu, không phải chuyện khủng hoảng quan hệ.
  - Ý chung (`hien_thi = hop`): MỘT đoạn "Một cách đọc thêm: …" (lời đời thường + việc nên làm), mục cụ thể nhất.
  - Ý riêng trường phái (`goc_nhin_khac`): tối đa MỘT đoạn "Một trường phái khác còn đọc: …", chỉ khi luật nêu đích
    danh cung mà câu hỏi đang hỏi.
  - Câu hỏi phương pháp không gắn lá số ("xem Phu Thê có cần xem Phúc Đức không") → mục phương pháp vào câu trả lời
    kiến thức (`muc_phuong_phap`).
Mỗi mục vào gói bằng chứng mang `ma` (id KB) — bộ kiểm đầu ra AI đối chiếu được câu với nguồn. Lời KB không có con số.
"""
from __future__ import annotations

import re

from app.hoidap import chung
from app.kb import tuvi_y_bo_sung as kyb
from app.luangiai import tuvi_y_bo_sung as yb

TIEN_TO_HOP = "Một cách đọc thêm: "
TIEN_TO_GOC = "Một trường phái khác còn đọc: "
KHONG_THAY = "không thay lời bác sĩ"
THU_TU_CUNG = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di",
               "Nô Bộc", "Quan Lộc", "Điền Trạch", "Phúc Đức", "Phụ Mẫu"]

# Mảng câu hỏi → loại mục KB được dùng.
_DOI = ("sao_cung", "cap_sao", "tu_hoa_cung")
CHU_DE = {"Phu Thê": ("hon_nhan", *_DOI), "Phúc Đức": ("hon_nhan", *_DOI),
          "Quan Lộc": ("nghe_nghiep", *_DOI), "Tài Bạch": ("nghe_nghiep", *_DOI)}
_SUC_KHOE = ("suc_khoe_phong_ngua",)
# Luật thời điểm không nêu cung: mảng đời mà lời của nó nói tới (đọc từ chính `loi_doi_thuong`) — câu "năm nay công việc /
# tình duyên / tiền" chỉ nhận luật đúng mảng; câu "năm nay thế nào" (không mảng) nhận mọi luật thời điểm.
THOI_DIEM_CUNG = {
    "yb.sao.thien_dong_nhan_hoa": {"Quan Lộc", "Nô Bộc"},
    "yb.sao.that_sat_dai_han": {"Quan Lộc"},
    "yb.sao.tham_lang_tien_va_cuoc_vui": {"Tài Bạch"},
    "yb.sao.khong_kiep_nam_kinh_doanh": {"Quan Lộc", "Tài Bạch"},
    "yb.sao.hoa_linh_nam_cong_su": {"Quan Lộc", "Nô Bộc"},
    "yb.sao.khoi_viet_nam_nang_do": {"Quan Lộc"},
    "yb.hoa.xuong_ky_nam_thi": {"Quan Lộc"},
    "yb.hoa.khoa_hoac_xuong_nam_thi": {"Quan Lộc"},
    "yb.cap.sat_pha_tham_dai_han": {"Quan Lộc", "Tài Bạch"},
    "yb.hoa.quyen_loc_dai_han_lam_chu": {"Quan Lộc", "Tài Bạch"},
    "yb.hon.dai_tieu_han_hong_loan": {"Phu Thê"},
}


def _ds(x) -> list:
    return [] if x is None else list(x) if isinstance(x, (list, tuple)) else [x]


def _sao_cua(m: dict) -> set[str]:
    dk = m["dieu_kien"]
    return set(_ds(dk.get("sao")) + _ds(dk.get("sao_mot_trong")) + _ds(dk.get("hoa_tren_sao"))
               + _ds(dk.get("hoa_tren_sao_mot_trong")) + [s for c in _ds(dk.get("sao_cap_mot_trong")) for s in c])


def _cung_neu(m: dict) -> set[str]:
    c = m["dieu_kien"].get("cung")
    return set() if c in (None, "bat_ky") else set(_ds(c))


def _co_lop_thoi_gian(m: dict) -> bool:
    return any(x != "goc" for x in _ds(m["dieu_kien"].get("lop")))


def _thuong(s: str) -> str:
    s = s.strip()
    return s[:1].lower() + s[1:] if s else s


def _cham(s: str) -> str:
    s = s.strip()
    return s if s.endswith((".", "!", "?", "…")) else s + "."


def loi(m: dict, tien_to: str, nc: dict | None = None, cung: str | None = None) -> str:
    """Đoạn hiển thị: tiền tố + lời đời thường + việc nên làm (+ câu không thay lời bác sĩ khi nói sức khoẻ). Lời = bản
    tự đứng được của báo cáo (`yb.loi_hien`: không "nét này" trơ trọi, đúng nửa sáng / hãm, `{mang}` theo cung khớp)."""
    cung = cung or (m.get("cung_khop") or [None])[0]
    van = (f"{tien_to}{_cham(_thuong(yb.loi_hien(m, nc, cung) or ''))} "
           f"Việc nên làm: {_cham(_thuong(yb.viec_hien(m)))}")
    if (m["loai"] == "suc_khoe_phong_ngua" or "sức khoẻ" in van or "sức khỏe" in van) and KHONG_THAY not in van:
        van += " Lời này không thay lời bác sĩ."
    return van


def _muc(m: dict, vai: str, nc: dict | None = None, cung: str | None = None) -> dict:
    tien_to = TIEN_TO_HOP if vai == "hop" else TIEN_TO_GOC
    cung = cung or (m.get("cung_khop") or [None])[0]
    dk = yb.dieu_kien_loi(m)          # review CY-1: dòng điều kiện viết lại — không lộ bản tóm tắt nguồn nội bộ
    return {"loai": "y_bo_sung", "ma": m["id"], "vai": vai, "loai_y": m["loai"], "cung_khop": m.get("cung_khop", []),
            "source_id": m["source_id"], "school_id": m["school_id"], "trang_thai": m["trang_thai"],
            "loi_doi_thuong": yb.loi_hien(m, nc, cung) or "", "viec_nen_lam": yb.viec_hien(m),
            "can_cu": "Cách đọc thêm — căn cứ: " + (dk or f"cung {cung}" if cung else dk or "lá số của bạn"),
            "doi_thuong": loi(m, tien_to, nc, cung)}


_Y_DINH_BO = ("ba_thang_toi", "chon_thoi_diem", "phan_van")
_TAP_QUAN = [r"tam tai", r"thai tue", r"kim lau", r"hoang oc", r"nam tuoi", r"sao han", r"xung tuoi"]
_HOI_VI_TRI = [r"cung nao", r"o dau", r"nam dau", r"vi tri nao", r"la gi", r"nghia la", r"y nghia (la|cua)"]
# Phụ tinh có trong luật KB (câu "Hồng Loan trong lá số của tôi" là câu về sao đó, dù bộ phân loại không tách phụ tinh)
_PHU_KD = {s: chung.chuan_hoa(s) for s in ("Hồng Loan", "Thiên Hỷ", "Lộc Tồn", "Thiên Mã", "Văn Xương", "Văn Khúc",
                                           "Tả Phù", "Hữu Bật", "Thiên Khôi", "Thiên Việt", "Kình Dương", "Đà La",
                                           "Linh Tinh", "Địa Không", "Địa Kiếp", "Cô Thần", "Quả Tú")}
_HOI_DAI_HAN = [r"dai han", r"muoi nam", r"10 nam", r"giai doan"]
_HOI_NAM = [r"(?<!\w)(?<!muoi )(?<!10 )nam (nay|sau|toi|20\d\d)", r"luu nien", r"tieu han"]


def _neu_cung(pl: dict) -> bool:
    """Câu hỏi nêu đích danh tên cung (không phải cung mặc định của bộ phân loại)."""
    from app.hoidap import tuvi  # noqa: PLC0415 — tránh vòng import
    return bool(tuvi._co_ten(pl.get("cau_chuan_hoa") or "", tuvi.CUNG_KW))


def chon(pl: dict, nc: dict) -> list[dict]:
    """Mục cần thêm (≤ 1 ý chung + ≤ 1 góc nhìn khác) cho câu đã phân loại `pl` trên ngữ cảnh lá số `nc`.
    Câu năm / giai đoạn (`loai = han`) chỉ dùng luật theo lớp hạn; câu bản mệnh chỉ dùng luật lá gốc. Sức khoẻ chỉ ở
    câu theo thời điểm có mảng Tật Ách (lời phòng ngừa, kèm câu không thay lời bác sĩ)."""
    loai_cau = pl.get("loai")
    if loai_cau not in ("la_so", "han") or pl.get("xu_ly") not in ("tra_loi", "tra_loi_kem_luu_y") \
            or pl.get("do_tin_thap"):
        return []
    from app.hoidap import mo_dau  # noqa: PLC0415
    t = pl.get("cau_chuan_hoa") or ""
    if chung.co(t, mo_dau.KHUNG_HOANG_QH):
        return []                                # chuyện nặng lòng: không chêm cách đọc khác
    if pl.get("y_dinh") in _Y_DINH_BO or pl.get("hoi_thang") or pl.get("sao_luu") or pl.get("sao_han") \
            or chung.co(t, _HOI_VI_TRI + _TAP_QUAN):
        return []                                # câu tháng / chọn ngày / phân vân / dò vị trí: đoạn thêm lạc đề
    cung_hoi = {c for c in (pl.get("cung") or [])[:2] if c in THU_TU_CUNG}
    sao_hoi = set(pl.get("sao") or []) | {s for s, k in _PHU_KD.items() if re.search(rf"(?<!\w){k}(?!\w)", t)}
    if sao_hoi and not _neu_cung(pl):           # "Thất Sát trong lá số của tôi" → cung nơi sao đứng
        cung_hoi = {t for t in nc["thu_tu"] if sao_hoi & yb.sao_trong_cung(nc, t)}
    han = loai_cau == "han"
    chi_dai_han = han and (bool(pl.get("han_toi")) or chung.co(t, _HOI_DAI_HAN) and not chung.co(t, _HOI_NAM))
    loai_dung: set[str] = set()
    for c in cung_hoi:
        loai_dung |= set(CHU_DE.get(c, ()))
    if sao_hoi:
        loai_dung |= {*_DOI, "hon_nhan", "nghe_nghiep"}
    if han:
        loai_dung = set(_SUC_KHOE) if "Tật Ách" in cung_hoi else loai_dung | {"thoi_diem"}
    if not loai_dung:
        return []

    def hop_le(m: dict, chat: bool) -> bool:
        noi = set(m.get("cung_khop", []))
        if m["id"].startswith("yb.pp."):
            return False                         # ý phương pháp: chỉ ở câu hỏi kiến thức
        if sao_hoi and not (sao_hoi & _sao_cua(m)) and not (m["loai"] == "tu_hoa_cung" and noi & cung_hoi
                                                             and _neu_cung(pl)):
            return False
        if han != _co_lop_thoi_gian(m):
            return False
        if chi_dai_han and "dai_han" not in _ds(m["dieu_kien"].get("lop")):
            return False
        if chat:                                 # góc nhìn khác: luật phải nêu đích danh cung đang hỏi
            return bool(_cung_neu(m) & cung_hoi and noi & cung_hoi)
        if han:
            if not cung_hoi - {"Mệnh"}:
                return True                      # câu năm / giai đoạn chung: mọi luật thời điểm
            if _cung_neu(m):
                return bool(_cung_neu(m) & cung_hoi)
            if m["loai"] == "thoi_diem":
                return bool(THOI_DIEM_CUNG.get(m["id"], set()) & cung_hoi)
            return True                          # loại đúng mảng (đã lọc theo CHU_DE)
        return bool(noi & cung_hoi) if cung_hoi else bool(sao_hoi)

    def cung_cua(m: dict) -> str | None:
        noi = m.get("cung_khop") or []
        return next((c for c in noi if c in cung_hoi), noi[0] if noi else None)

    ra = []
    hop = [m for m in yb.tim(nc, loai=sorted(loai_dung), hien_thi="hop")
           if hop_le(m, False) and yb.loi_hien(m, nc, cung_cua(m))]
    if hop:
        ra.append(_muc(hop[0], "hop", nc, cung_cua(hop[0])))
    goc = [m for m in yb.tim(nc, loai=sorted(loai_dung), hien_thi="goc_nhin_khac")
           if hop_le(m, True) and yb.loi_hien(m, nc, cung_cua(m))]
    if goc:
        ra.append(_muc(goc[0], "goc_nhin_khac", nc, cung_cua(goc[0])))
    return ra


def them(goi: dict, pl: dict, ls: dict | None, vh: dict | None, gioi_tinh: str | None,
         vh_toi: dict | None = None) -> None:
    """Thêm các mục "Một cách đọc thêm" vào CUỐI gói bằng chứng (sau câu trả lời chính). Câu hỏi giai đoạn mười năm TỚI
    (`vh_toi`) đọc luật đại hạn trên đại hạn kế tiếp."""
    if ls is None or goi.get("can_them") or pl.get("xu_ly") in chung.DAC_BIET:
        return
    if pl.get("han_toi"):
        if not vh or not vh_toi:
            return
        vh = {**vh, "dai_han": vh_toi["dai_han"]}
    ds = chon(pl, yb.ngu_canh(ls, vh, gioi_tinh))
    if ds:
        goi["muc"].extend(ds)
        chung.ket(goi)


# ------------------------------------------------------------------ câu hỏi phương pháp (kiến thức)
_TEN_CUNG_KD = r"(menh|huynh de|phu the|tu nu|tai bach|tat ach|thien di|no boc|quan loc|dien trach|phuc duc|phu mau)"
PHUONG_PHAP_KW: dict[str, list[str]] = {
    "yb.pp.doi_cung_tam_phuong": [
        rf"(co can|can|phai|nen|co phai) (xem|doc|coi) (ca |them |kem |luon )?(cung )?{_TEN_CUNG_KD}",
        r"(xem|doc|luan) (mot|1) cung", r"tam phuong tu chinh", r"cung doi dien .{0,20}(la gi|nghia|the nao|xem|doc)",
        r"vo chinh dieu .{0,25}muon"],
    "yb.pp.sao_doi_nghia_theo_cung": [r"(cung|mot) (sao|ngoi sao) .{0,15}(o|nam|dong) (cac |nhieu |moi )?cung khac",
                                      r"sao .{0,20}o cung khac (thi )?(nghia|khac|y nghia)"],
    "yb.pp.dai_han_chinh_luu_nien_phu": [r"dai han (va|hay|voi|so voi) (luu nien|tieu han)",
                                         r"(luu nien|tieu han) (va|hay|voi|so voi) dai han"],
    "yb.pp.menh_tot_khong_bang_han_tot": [r"menh tot (khong bang|thua) han tot",
                                          r"(la so|menh) (dep|tot) (ma|nhung) (van )?(kho|vat va|han xau|han kho)"],
    "yb.pp.cung_nam_la_chu_de": [r"cung luu nien (la gi|nghia|y nghia|noi gi|cho biet)",
                                 r"(luu nien|nam) (roi|di) vao cung .{0,25}(nghia|la gi|y nghia|noi gi)"],
    "yb.pp.cat_xu_tang_hung": [r"(cat tinh|sao tot) .{0,25}(lan|lon|chen|xen|lan voi) .{0,10}(sat tinh|sao xau|hung tinh)",
                               r"(nhieu|toan) (cat tinh|sao tot) ma (co|gap) (sat tinh|sao xau|hung tinh)"],
    "yb.pp.sat_sang_ham": [r"(sat tinh|sao xau|hung tinh) .{0,15}(mieu|vuong|dac dia|sang|ham)"],
    "yb.pp.sat_don_thu": [r"(sat tinh|sao xau|hung tinh) .{0,15}(mot minh|don thu|dung rieng|khong co sao tot)"],
    "yb.pp.thang_nhuan_tinh_thang_sau": [r"(sinh|vao) thang nhuan .{0,30}(an sao|tinh|la so|the nao|ra sao)",
                                         r"thang nhuan .{0,20}(an sao|tinh la thang)"],
    "yb.pp.tieu_han_nam_thuan_nu_nghich": [r"tieu han (la gi|tinh|khoi|di the nao|nghia la)", r"cach tinh tieu han"],
    "yb.hon.hong_hy_doi_xung": [r"hong loan (va |voi |, )?thien hy", r"thien hy (va|voi) hong loan"],
}
_QUAN_HE = {4: "cung tam hợp", 8: "cung tam hợp", 6: "cung đối diện (xung chiếu)", 1: "cung liền kề (giáp)",
            11: "cung liền kề (giáp)"}


def phuong_phap_nhac(t: str) -> list[str]:
    """Mã mục phương pháp (`hien_thi = hop`) câu hỏi đang hỏi tới — luật từ khoá công khai."""
    return [ma for ma, mau in PHUONG_PHAP_KW.items()
            if chung.co(t, mau) and (m := kyb.lay(ma)) and m["hien_thi"] == "hop"][:2]


def muc_phuong_phap(pl: dict) -> list[dict]:
    """Mục cho câu trả lời kiến thức: ý (thuật ngữ được dùng) + lời đời thường + việc nên làm; câu nêu hai cung thì thêm
    quan hệ vị trí giữa hai cung (tính từ thứ tự 12 cung, không đoán)."""
    ra = []
    for ma in pl.get("phuong_phap") or []:
        m = kyb.lay(ma)
        if not m:
            continue
        van = (f"{_cham(m['loi_doi_thuong'])} Việc nên làm: {_cham(_thuong(m['viec_nen_lam']))}")   # không lộ ý nguồn
        cung = [c for c in pl.get("cung") or [] if c in THU_TU_CUNG]
        if ma == "yb.pp.doi_cung_tam_phuong" and len(cung) >= 2:
            a, b = cung[0], cung[1]
            qh = _QUAN_HE.get((THU_TU_CUNG.index(b) - THU_TU_CUNG.index(a)) % 12)
            van += (f" Với câu của bạn: {b} là {qh} của {a}, nên khi đọc {a} cần đọc cả {b}." if qh else
                    f" Với câu của bạn: {b} không nằm trong tam phương hay cung kẹp của {a}; đọc {b} như một mảng riêng"
                    " rồi đối chiếu.")
        ra.append({"loai": "phuong_phap", "ma": ma, "noi_dung": van, "source_id": m["source_id"],
                   "school_id": m["school_id"], "trang_thai": m["trang_thai"]})
    return ra


def la_doan_them(p: str) -> bool:
    return p.startswith((TIEN_TO_HOP, TIEN_TO_GOC))


def xep_cuoi(van: str, chan: tuple[str, ...]) -> str:
    """Đoạn "Một cách đọc thêm / Một trường phái khác" đứng sau câu trả lời chính, ngay trước phần chân (tự soi, lưu ý,
    lời tham khảo) — đoạn mở đầu dời chi tiết xuống dưới không đẩy nó lên giữa bài."""
    p = van.split("\n\n")
    them_ = [x for x in p if la_doan_them(x)]
    if not them_:
        return van
    con = [x for x in p if not la_doan_them(x)]
    i = next((k for k, x in enumerate(con) if any(re.match(m, x) for m in chan)), len(con))
    return "\n\n".join(con[:i] + them_ + con[i:])
