# -*- coding: utf-8 -*-
"""D2 (nâng cấp sau rà soát thực nghiệm) — Đồng bộ 27 nhãn `luan_hoi` (LH-1 / LH-2) vào Hỏi đáp Tử vi & Bát tự.

Nguyên tắc thiết kế (Một Bộ Định Tuyến — Một Nguồn KB):
  1. KHÔNG viết bộ định tuyến độc lập: bám trực tiếp kết quả phân loại `pl` đã có của `hoidap.tuvi` / `hoidap.battu`,
     `hoidap.hieu_cau` (kiểu câu, người thứ hai, năm sinh) và `hoidap.mo_dau` (khủng hoảng quan hệ, bạo lực, điều hỏi).
  2. Bảng ánh xạ `(chuong, ma)` nằm trọn trong KB `tuvi_luan_hoi_kb.json -> anh_xa_hoi_dap` (kèm `cung_tv`, `chu_de_bt`,
     `vai_khac` cho phép).
  3. Mặc định KHÔNG gắn nhãn (`None`) khi có bất kỳ dấu hiệu:
     - Câu hỏi kiến thức (`hieu_cau.kieu == 'kien_thuc'`, `loai` không thuộc bản mệnh/vận hạn, hoặc độ tin thấp `hoi_lai`).
     - Câu ghép hai tuổi / nêu năm sinh người thứ hai (`_HAI_NGUOI_CU_THE`, `nguoi_thu_hai.nam_sinh`).
     - Câu kể hoặc hỏi chuyện riêng của NGƯỜI KHÁC (em gái, anh trai, chị gái, bạn thân, sếp, đồng nghiệp, con…).
     - Câu kể chuyện khủng hoảng quan hệ ĐÃ / ĐANG XẢY RA (ngoại tình, phản bội, ly thân, đã ly hôn, bạo hành — theo
       `mo_dau.khong_mo`), tránh gắn thẻ dự đoán 'Ít dấu hiệu người thứ ba' / 'Một mối bền' nói ngược thực tế người hỏi.
"""
from __future__ import annotations

import re
from typing import Callable

from app import ngon_ngu
from app.hoidap import chung, hieu_cau, mo_dau
from app.kb import tuvi_luan_hoi_kb as kb_lh

CHUONG_5 = ("tinh_cam", "gia_dinh", "su_nghiep", "tien_bac", "quan_he")
PHAI_MON = {"tuvi": "nam_phai_viet", "battu": "tu_binh"}
_LOAI_CHO_PHEP = {"tuvi": ("la_so", "han"), "battu": ("la_so", "van")}

_CHI_RX = r"(ty|suu|dan|mao|thin|ngo|mui|than|dau|tuat|hoi)"
# Ghép chuỗi thuần (không dùng rf-string với lượng từ {m,n}) để không bao giờ dính lỗi tuple .(0, 25).
_HAI_NGUOI_CU_THE = re.compile(
    r"(\bvoi tuoi " + _CHI_RX + r"\b"
    r"|\btuoi " + _CHI_RX + r"\b.{0,35}\btuoi " + _CHI_RX + r"\b"
    r"|\b(chong|vo|nguoi yeu|ny|ban|doi tac|con|bo|me)\b.{0,20}\b(sinh nam |sn |tuoi )?(19[4-9]\d|20[0-3]\d)\b)"
)
_NAM_SINH_4 = re.compile(r"\b(?:sinh nam |sn )?(19[4-9]\d|20[0-3]\d)\b")

# Chủ thể ngôi thứ ba làm chủ ngữ của biến cố / hành vi riêng (không phải hỏi trục quan hệ 'với tôi').
_CHU_THE_NGUOI_KHAC = re.compile(
    r"\b(em gai|chi gai|anh trai|em trai|anh ruot|chi ruot|em ruot|ban than|ban toi|ban minh|ban em"
    r"|sep|sep toi|sep minh|sep em|dong nghiep|con trai|con gai|con toi|con minh|con em|hang xom)"
    r"(?: (?:toi|minh|em|cua toi|cua minh|cua em))?\s+"
    r"(?:dang |vua |moi |hay |rat |qua |dinh |sap |da |bi )?"
    r"(lang nhang|ngoai tinh|phan boi|cap bo|co bo|ly di|ly hon|chia tay|bo viec|nghi viec|nhay viec"
    r"|mo quan|mo tiem|mo cong ty|ra rieng|lam bao nhieu|tieu het|hao tai|pha san|vo no|no nan|hop nghe|chon nganh)"
)

# Dấu hiệu người hỏi KỂ SỰ VIỆC ĐÃ / ĐANG XẢY RA trong hôn nhân / tình cảm (khác câu hỏi thế lá số giả định).
_SU_VIEC_QH_DA_XAY_RA = re.compile(
    r"(\b(da|vua|moi|sau|sau khi|hau) (ly hon|ly di|chia tay|dut ganh|do vo)\b"
    r"|\bdang ly than\b|\bbi phat hien\b|\bnhieu lan roi\b|\bcap bo\b"
    r"|\b(chong|vo|nguoi yeu|ny|anh ay|co ay|ban doi)(?: (?:toi|em|minh))? "
    r"(?:da |dang |vua |hay |lai )?(ngoai tinh|phan boi|co bo|co nguoi thu ba|co nguoi khac|bo di|danh|bao hanh)\b"
    r"|\b(ngoai tinh|phan boi|co nguoi thu ba|cap bo)\b.{0,35}\bco nen (ly di|ly hon|chia tay|tha thu|giu|buong)\b)"
)
# Câu hỏi giả định / lo xa về thế lá số ("có dấu hiệu người thứ ba không", "liệu có ngoại tình không").
_CAU_HOI_THE_GIA_DINH = re.compile(
    r"(\bdau hieu\b|\blieu .{0,30}\bco\b|\bsau nay .{0,30}\bco\b|\bco chuyen (ngoai tinh|nguoi thu ba)\b)"
)


def _chuan_so_khop(s: str) -> str:
    return re.sub(r"\s+", " ", chung.chuan_hoa_cau(s or "")).strip(" ?!.,;:")


def _bang_cau_chuan() -> dict[str, tuple[str, str]]:
    ra: dict[str, tuple[str, str]] = {}
    for ch in CHUONG_5:
        for muc in kb_lh.cau(ch):
            if muc.get("cau") and muc.get("ma"):
                ra[_chuan_so_khop(muc["cau"])] = (ch, muc["ma"])
    return ra


def la_hai_nguoi_hoac_nguoi_khac(t_norm: str, goc_norm: str = "") -> bool:
    """Trả `True` nếu câu ghép hai tuổi / nêu năm sinh người kia / kể chuyện riêng của chủ thể ngôi thứ ba."""
    van = f"{goc_norm} {t_norm}".strip()
    if _HAI_NGUOI_CU_THE.search(van):
        return True
    if len(set(_NAM_SINH_4.findall(goc_norm or t_norm))) >= 2:
        return True
    nth = hieu_cau.nguoi_thu_hai(t_norm)
    if nth and (nth.get("nam_sinh") or nth.get("cac_nam_sinh")):
        return True
    if _CHU_THE_NGUOI_KHAC.search(van):
        return True
    return False


def _vai_nguoi_khac(t_norm: str) -> str | None:
    """Xác định vai người thứ hai được nhắc trong câu (bổ sung `anh_em` vào `hieu_cau.nguoi_thu_hai`)."""
    if re.search(r"\b(anh trai|em trai|chi gai|em gai|anh chi em|anh em|chi em)\b", t_norm):
        return "anh_em"
    nth = hieu_cau.nguoi_thu_hai(t_norm)
    return nth.get("quan_he") if nth else None


def la_chuyen_qh_da_xay_ra(t_norm: str, cau_goc: str = "") -> bool:
    """Trả `True` khi người dùng kể biến cố tình cảm/hôn nhân đã hoặc đang xảy ra (ngoại tình, bạo lực, đã ly hôn)."""
    if mo_dau._co(t_norm, mo_dau._BAO_LUC):
        return True
    if _SU_VIEC_QH_DA_XAY_RA.search(t_norm):
        # Ngay cả khi có từ 'có nên', đây là câu hỏi xử lý khủng hoảng đã xảy ra chứ không phải hỏi thế lá số giả định.
        if not _CAU_HOI_THE_GIA_DINH.search(t_norm) or re.search(r"\bco nen (ly di|ly hon|chia tay|buong)\b", t_norm):
            return True
    if mo_dau.khong_mo(t_norm, cau_goc) and not _CAU_HOI_THE_GIA_DINH.search(t_norm):
        # Kiểm các câu hỏi chuẩn kiểu 'một đời vợ chồng hay dễ ly dị' vẫn hợp lệ nếu không gán cho chồng/vợ hiện tại đang ngoại tình.
        if re.search(r"\b(chong|vo|nguoi yeu|ny|anh ay|co ay)\b.{0,20}\b(ngoai tinh|phan boi|co bo|ly than|danh)\b", t_norm):
            return True
    return False


def nhan_dien_cau_luan_hoi(
    cau_chuan_hoa: str,
    cau_goc: str = "",
    *,
    mo_dun: str | None = None,
    pl: dict | None = None,
) -> tuple[str, str] | None:
    """Trả `(chuong, ma)` trong 27 câu `luan_hoi` dựa trên bộ định tuyến `pl` + bảng KB `anh_xa_hoi_dap`."""
    goc_norm = _chuan_so_khop(cau_goc or cau_chuan_hoa)
    t = _chuan_so_khop(cau_chuan_hoa) or goc_norm
    if not t:
        return None

    # 1. Chặn hai tuổi cụ thể & chủ thể ngôi thứ ba ngay từ đầu
    if la_hai_nguoi_hoac_nguoi_khac(t, goc_norm):
        return None

    # 2. Khớp nguyên văn 1 trong 27 câu chuẩn trên thẻ / chip báo cáo
    bang = _bang_cau_chuan()
    if goc_norm in bang:
        return bang[goc_norm]
    if t in bang:
        return bang[t]

    # 3. Cổng bộ định tuyến hỏi đáp sẵn có (`pl` + `hieu_cau`)
    if hieu_cau.kieu(t) == "kien_thuc":
        return None
    if pl is not None:
        loai_ok = _LOAI_CHO_PHEP.get(mo_dun or "tuvi", ("la_so", "han", "van"))
        if pl.get("loai") not in loai_ok:
            return None
        # Bát tự chưa có cụm 'người thứ ba' trong CHU_DE nên câu 'dấu hiệu người thứ ba' rơi về do_tin_thap + tinh_cach;
        # chỉ mở cho đúng câu hỏi thế người thứ ba của chính mình, còn mọi câu do_tin_thap khác chặn sạch.
        hoi_ntb_ro = bool(re.search(r"dau hieu .{0,20}(nguoi thu ba|ke thu ba)", t))
        if pl.get("do_tin_thap") and not hoi_ntb_ro:
            return None

    vai_khac = _vai_nguoi_khac(t)
    da_xay_ra = la_chuyen_qh_da_xay_ra(t, cau_goc)
    cung_pl = set(pl.get("cung") or []) if (pl and mo_dun == "tuvi") else set()
    chu_de_pl = pl.get("chu_de") if (pl and mo_dun == "battu") else None

    for muc in kb_lh.anh_xa_hoi_dap():
        ch, ma = muc.get("chuong"), muc.get("ma")
        if not ch or not ma:
            continue
        if muc.get("chan_da_xay_ra") and da_xay_ra:
            continue
        # Kiểm vai người thứ hai trong câu có thuộc danh sách vai cho phép của câu luận hỏi này không
        cho_phep_vai = set(muc.get("vai_khac") or [])
        if vai_khac is not None and vai_khac not in cho_phep_vai:
            continue
        # Đối chiếu cung / chủ đề mà bộ định tuyến chính đã chọn
        if mo_dun == "tuvi" and cung_pl and muc.get("cung_tv"):
            if not (cung_pl & set(muc["cung_tv"])):
                continue
        if mo_dun == "battu" and chu_de_pl and muc.get("chu_de_bt"):
            if chu_de_pl not in set(muc["chu_de_bt"]):
                continue
        if ma == "quy_nhan":
            if mo_dun == "battu" and re.search(r"\b(thien at|thien duc|nguyet duc|thai cuc|van xuong|phuc tinh|quoc an)\b", t):
                continue
            if mo_dun == "tuvi" and (pl and (pl.get("phu") or pl.get("sao"))):
                continue
        ds_mau = muc.get("mau") or []
        if ds_mau and chung.co(t, ds_mau):
            return (ch, ma)
    return None


def gan_vao_hoi(
    kq: dict,
    *,
    mo_dun: str,
    pl: dict,
    cau_hoi: str,
    sinh: dict | None,
    bc_ds: dict | None,
    dung_bc: Callable[[], dict | None],
    nguoi_than: bool = False,
) -> None:
    """Gắn `luan_hoi` (khi khớp 1 trong 27 câu) hoặc `doi_song_lien_ket` (khi có hộp chương đời sống) vào `kq` tại chỗ."""
    if not ngon_ngu.la_viet() or not sinh or nguoi_than or sinh.get("gio_tam"):
        return
    if pl.get("xu_ly") in chung.DAC_BIET or kq.get("can_them"):
        return

    phai = PHAI_MON.get(mo_dun, "nam_phai_viet")
    t_norm = _chuan_so_khop(pl.get("cau_chuan_hoa") or cau_hoi)
    goc_norm = _chuan_so_khop(cau_hoi)
    la_cau_chuan = goc_norm in _bang_cau_chuan() or t_norm in _bang_cau_chuan()
    hoi_ntb_ro = bool(re.search(r"dau hieu .{0,20}(nguoi thu ba|ke thu ba)", t_norm))

    if not la_cau_chuan and kq.get("hoi_lai") and not hoi_ntb_ro:
        return

    khop = nhan_dien_cau_luan_hoi(
        pl.get("cau_chuan_hoa") or "",
        cau_hoi,
        mo_dun=mo_dun,
        pl=None if la_cau_chuan else pl,
    )
    if khop is not None:
        ch_ma, cau_ma = khop
        bc = bc_ds or dung_bc()
        c = next((x for x in (bc or {}).get("chuong", []) if x.get("ma") == ch_ma), None)
        tl = next((t for t in ((c or {}).get("luan_hoi") or {}).get("tra_loi", []) if t.get("ma") == cau_ma), None)
        if c and tl and tl.get("tra_loi") and tl.get("ma_mau"):
            ghi_chu = kb_lh.chuoi("ghi_chu_thang") if tl.get("nhan") in ("muon_moi_ben", "hai_lan_do") else ""
            kq["luan_hoi"] = {
                "ma": tl["ma"],
                "cau": tl["cau"],
                "tra_loi": tl["tra_loi"],
                "giai_thich": tl.get("giai_thich") or "",
                "nhan": tl["nhan"],
                "sac": tl.get("sac") or "can_bang",
                "ma_mau": tl["ma_mau"],
                "phai": phai,
                "chuong": ch_ma,
                "ten_chuong": c.get("tieu_de") or ch_ma,
                **({"ghi_chu": ghi_chu} if ghi_chu else {}),
            }
            cu_them = [x for x in tl.get("can_cu") or [] if x]
            if cu_them:
                cu_cu = list(kq.get("can_cu") or [])
                kq["can_cu"] = list(dict.fromkeys([*cu_them, *cu_cu]))
            return

    # Câu mảng đời sống chung (không nằm trong 27 câu luan_hoi, không phải câu người khác / kiến thức):
    if la_hai_nguoi_hoac_nguoi_khac(t_norm, goc_norm) or hieu_cau.kieu(t_norm) == "kien_thuc":
        return
    goi = kq.get("bang_chung") or {}
    m_ds = next((m for m in goi.get("muc", []) if m.get("loai") == "doi_song"), None)
    if not m_ds or not m_ds.get("chuong"):
        return
    hop0 = next((h for h in (m_ds.get("hop") or []) if h.get("ma_mau")), None)
    if not hop0:
        return
    bc = bc_ds
    c = next((x for x in (bc or {}).get("chuong", []) if x.get("ma") == m_ds["chuong"]), None)
    la_sk = m_ds["chuong"] == "suc_khoe"
    kq["doi_song_lien_ket"] = {
        "chuong": m_ds["chuong"],
        "ten_chuong": (c or {}).get("tieu_de") or m_ds.get("ten_mang") or m_ds["chuong"],
        "tieu_de_hop": hop0.get("tieu_de") or "",
        **({} if la_sk else {"muc": m_ds.get("muc"), "nhan_muc": m_ds.get("nhan_muc") or ""}),
        "ma_mau": hop0["ma_mau"],
        "phai": phai,
    }
