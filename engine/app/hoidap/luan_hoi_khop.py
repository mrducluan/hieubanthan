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


# ---------------------------------------------------------------------------------------------------------------
# "Câu hỏi về NGƯỜI KHÁC" — mặc định KHÔNG gắn thẻ lá số của người hỏi (thẻ nói về chính lá số người đang xem).
# So từng VẾ câu (tách theo dấu câu ở chữ gốc, rồi chuẩn hoá) để "Mẹ tôi mới ly hôn, hôn nhân có bền không" bắt được
# chủ thể "mẹ tôi" ở vế đầu.
_SO_HUU = r"(?:toi|minh|em|to|tui|tao|cua toi|cua minh|cua em|nha toi|nha minh|nha em)"
# Danh từ người — cần chữ sở hữu theo sau vì cũng là đại từ tự xưng ("Em muốn hỏi", "Cháu chào cô", "Con muốn hỏi").
_NGUOI_CAN_SO_HUU = (
    r"(?:me chong|bo chong|me vo|bo vo|chi dau|em dau|anh re|em re|chi chong|em chong|anh chong|chi vo|em vo|anh vo"
    r"|bo me|cha me|ba noi|ba ngoai|ong noi|ong ngoai|con trai|con gai|anh trai|em trai|chi gai|em gai"
    r"|anh ho|chi ho|em ho|ban than|ban|thang ban|con ban|dua ban|dua em|hang xom|dong nghiep|doi tac|nhan vien|khach"
    r"|bo|me|cha|ong|ba|chau|con|anh|chi|em|chu|co|di|cau|mo|thim|bac)"
)
# Danh từ người không thể là đại từ tự xưng → đứng đầu vế là đủ.
_NGUOI_DUNG_DAU = (
    # "vo / chong" bỏ dấu trùng "vỡ / vô / chống" → chỉ tính khi có chữ sở hữu / chỉ định đi kèm ("vợ tôi", "chồng ấy").
    r"(?:ban trai cu|ban gai cu|nguoi yeu cu|ny cu|chong cu|vo cu|ban trai|ban gai|nguoi yeu|ny|sep"
    r"|(?:chong|vo)(?= (?:toi|minh|em|to|tui|ay|anh ay|co ay|sap cuoi|cua toi|cua minh|cua em)\b)"
    r"|me chong|bo chong|me vo|bo vo|dua|thang(?! (?:\d+|nay|sau|toi|truoc|vua|sap|cuoi|dau|gieng|chap|hai|ba|bon|nam|bay|tam|chin|muoi|giua)\b)|con be|co be|cau be|co ban|anh ban|chi ban|ban cung (?:phong|lop|nha)"
    r"|chau ngoai|chau noi|co ay|anh ay|chi ay|ong ay|ba ay|em ay|nguoi ay|ho)"
)
# Họ hàng nhiều chữ + chữ sở hữu ở GIỮA câu ("hai vợ chồng anh trai tôi", "con gái tôi") — chủ thể là người đó, trừ khi
# đứng sau "với / cùng / và" (người hỏi làm việc cùng người đó: "góp vốn với anh trai tôi").
_HO_HANG_GIUA = re.compile(
    r"(?<!\bvoi )(?<!\bcung )(?<!\bva )\b(?:anh trai|em trai|chi gai|em gai|con trai|con gai|me chong|bo chong|me vo|bo vo"
    r"|chi dau|em dau|anh re|em re|chau ngoai|chau noi|ban than) " + "(?:toi|minh|em|to|tui)\\b")
_DEM_DAU = r"^(?:(?:cho (?:em|minh|toi|chau|con) hoi|xin hoi|thua (?:thay|co|chu|anh|chi)|ad oi|admin oi|a oi|oi|da|vang|em hoi|minh hoi)\s+)*"
_TU_THAN_DOI = re.compile(r"\bvo chong (?:toi|minh|em|chung toi|chung minh)\b")   # "vợ chồng tôi" = chính người hỏi
_TUONG_LAI = re.compile(r"\b(?:chong|vo|ban doi|nguoi yeu|nua kia|ny) tuong lai\b")
_QUAN_HE_VOI_TOI = re.compile(r"\b(?:toi|minh|em|cua toi|cua minh|cua em) (?:voi|va|cung)\b|\b(?:voi|va|cung) (?:toi|minh|em)\b")
# Câu hỏi chân dung qua cung của CHÍNH lá số ("Sếp của tôi là người thế nào", "Chồng tôi là người thế nào") vẫn là đọc
# lá số người hỏi (cung Phụ Mẫu / Phu Thê) → không tính là hỏi về người khác.
_CHAN_DUNG = re.compile(r"\b(?:la nguoi (?:the nao|ra sao|nhu the nao)|tinh cach .{0,12}(?:the nao|ra sao)|kieu nguoi (?:gi|nao))\b")
_HOI_VE = re.compile(r"\b(?:hoi|xem|coi|luan|doan|bat)(?: (?:gium|giup|ho|cho|ve|la so|tuoi|van|menh))* " + _NGUOI_CAN_SO_HUU
                     + r" " + _SO_HUU + r"\b")
_LA_SO_NGUOI = re.compile(r"\b(?:la so|tuoi|bat tu|tu tru|menh|so) (?:cua )?(?:" + _NGUOI_CAN_SO_HUU
                          + r"|chong|vo|ny|nguoi yeu|ban trai|ban gai|sep) " + _SO_HUU + r"\b")
_CUA_NGUOI = re.compile(r"\bcua " + _NGUOI_CAN_SO_HUU + r" " + _SO_HUU + r"\b")
_DAU_VE_SO_HUU = re.compile(_DEM_DAU + _NGUOI_CAN_SO_HUU + r"(?: (?:cu|moi|ruot|ho|lon|nho|ut|ca|thu \w+))? " + _SO_HUU + r"\b")
_DAU_VE_TRAN = re.compile(_DEM_DAU + _NGUOI_DUNG_DAU + r"\b")


_TEN_RIENG = re.compile(r"(?:^|[,.;:!?\n])[ \t]*(?:[Tt]hằng|[Cc]on bé|[Aa]nh|[Cc]hị|[Ôô]ng|[Bb]à|[Cc]ô|[Cc]hú|[Bb]ạn|[Ss]ếp|[Ll]ão|[Mm]ụ)[ \t]+(\w+)")
_KHONG_PHAI_TEN = {"Tôi", "Toi", "Mình", "Minh", "Em", "Ơi", "Oi", "Ạ", "A"}


def _co_ten_rieng(cau_goc: str) -> bool:
    """"Thằng Tuấn…", "Chị Lan…" ở đầu vế: chữ ngay sau là tên riêng VIẾT HOA (kiểm bằng isupper — dải ký tự À–Ỹ trộn
    cả chữ thường nên không dùng được trong lớp ký tự)."""
    if any(m.group(1)[:1].isupper() and m.group(1) not in _KHONG_PHAI_TEN for m in _TEN_RIENG.finditer(cau_goc or "")):
        return True
    return any(m.group(1)[:1].isupper() for m in re.finditer(r"\b(?:tên|tên là|ten)\s+(\w+)", cau_goc or ""))


def _ve(cau_goc: str) -> list[str]:
    return [v for v in (re.sub(r"\s+", " ", chung.chuan_hoa_cau(x)).strip() for x in re.split(r"[,.;:!?\n…]+", cau_goc or "")) if v]


def noi_ve_nguoi_khac(cau_goc: str, t_norm: str = "") -> bool:
    """True khi câu hỏi lấy NGƯỜI KHÁC làm chủ thể (con, cháu, cha mẹ, vợ/chồng, người yêu, sếp, bạn…). Câu hỏi QUAN HỆ
    giữa người hỏi và người đó ("tôi với bố mẹ có hợp không") và câu về "chồng/vợ tương lai" không tính."""
    if cau_goc and _co_ten_rieng(cau_goc.strip()):
        return True
    ve = _ve(cau_goc) or ([t_norm] if t_norm else [])
    for v in ve:
        v = _TU_THAN_DOI.sub("TU_THAN", v)
        if _TUONG_LAI.search(v) or _CHAN_DUNG.search(v):
            continue
        if _HOI_VE.search(v) or _CUA_NGUOI.search(v) or _HO_HANG_GIUA.search(v) or _LA_SO_NGUOI.search(v):
            return True
        if (_DAU_VE_SO_HUU.search(v) or _DAU_VE_TRAN.search(v)) and not _QUAN_HE_VOI_TOI.search(v):
            return True
    return False


def _chuan_so_khop(s: str) -> str:
    return re.sub(r"\s+", " ", chung.chuan_hoa_cau(s or "")).strip(" ?!.,;:")


def _bang_cau_chuan() -> dict[str, tuple[str, str]]:
    ra: dict[str, tuple[str, str]] = {}
    for ch in CHUONG_5:
        for muc in kb_lh.cau(ch):
            if muc.get("cau") and muc.get("ma"):
                ra[_chuan_so_khop(muc["cau"])] = (ch, muc["ma"])
    return ra


_CAN_CHI = re.compile(r"\b(?:giap|at|binh|dinh|mau|ky|canh|tan|nham|quy) (?:ty|suu|dan|mao|thin|ti|ngo|mui|than|dau|tuat|hoi)\b")


def la_hai_nguoi_hoac_nguoi_khac(t_norm: str, goc_norm: str = "", cau_goc: str = "") -> bool:
    """Trả `True` nếu câu ghép hai tuổi / nêu năm sinh người kia / kể chuyện riêng của chủ thể ngôi thứ ba."""
    van = f"{goc_norm} {t_norm}".strip()
    if _HAI_NGUOI_CU_THE.search(van):
        return True
    if len(set(_NAM_SINH_4.findall(goc_norm or t_norm))) >= 2:
        return True
    if len(_CAN_CHI.findall(goc_norm or t_norm)) >= 2:
        return True
    nth = hieu_cau.nguoi_thu_hai(t_norm)
    if nth and (nth.get("nam_sinh") or nth.get("cac_nam_sinh")):
        return True
    if _CHU_THE_NGUOI_KHAC.search(van):
        return True
    return noi_ve_nguoi_khac(cau_goc, t_norm) if cau_goc else False


def _vai_nguoi_khac(t_norm: str) -> str | None:
    """Xác định vai người thứ hai được nhắc trong câu (bổ sung `anh_em` vào `hieu_cau.nguoi_thu_hai`)."""
    t_norm = re.sub(r"\blam (?:sep|ong chu|ba chu)(?: cua chinh (?:minh|toi|em))?\b", " ", t_norm)   # "làm sếp của chính mình" = tự làm chủ
    if re.search(r"\b(anh trai|em trai|chi gai|em gai|anh chi em|anh em|chi em)\b(?! (dong nghiep|cong ty|trong cong ty|xa hoi|o cho lam))", t_norm):
        return "anh_em"
    nth = hieu_cau.nguoi_thu_hai(t_norm)
    return nth.get("quan_he") if nth else None


_KE_SU_VIEC = re.compile(
    r"\b(?:vua|moi|dang|da) (?:bi )?(?:ly hon|ly di|chia tay|do vo|noi xau|choi xau|bao cao sai|lua|lua dao|phan boi"
    r"|bo roi|bo di|duoi viec|cho nghi viec|mat viec|pha san|vo no|thua lo|danh)\b"
    r"|\bdang bi (?!.{0,6}\b(?:gi|sao)\b)"
    r"|\b(?:ly hon|ly di|chia tay|do vo) (?:duoc|roi|mot lan|\d+ nam)\b"
    r"|\bda (?:do vo|ly hon|ly di|chia tay|qua) mot lan\b"
    r"|\b(?:mat viec|bi duoi|pha san|vo no|bi lua) roi\b"
    r"|\b(?:vua|moi|dang|da) bi (?:\w+ ){1,3}(?:lua|choi xau|phan boi|bo|danh|cuop|quyt|noi xau|hai)\b"
    r"|\b(?:vua|moi) (?:bi )?mat (?:\d+ )?(?:trieu|ty|tien|viec|cua|nha|xe|von|het)\b"
    r"|\b(?:vua|moi|dang|da) bi (?:\w+ ){0,3}(?:mang|chui|ky luat|phat|tru luong|cat luong|che|che bai|bat nat|ep)\b"
    r"|\b(?:chia tay|ly hon|ly di|bo) (?:chong|vo|ny|nguoi yeu|ban trai|ban gai)\b"
    r"|\bdang (?:yeu|quen|tim hieu|hen ho) (?:mot|voi|nguoi|anh|chi|co|em)\b|\b(?:gia dinh|bo me|nha) (?:\w+ ){0,2}phan doi\b"
    r"|\bchua co con\b|\bhiem muon\b|\bvo sinh\b|\bsay thai\b|\b(?:moi|vua|da) cho (?:\w+ ){0,2}(?:vay|muon)\b"
    # chuyện vợ chồng / tình cảm ĐANG diễn ra ("dạo này lạnh nhạt", "cãi nhau suốt", "giận cả tuần")
    r"|\b(?:dao nay|gan day|may (?:thang|tuan|hom|nam) nay|cu|suot|lien tuc|hoai)\b.{0,30}\b(?:lanh nhat|cai nhau|gat nhau|luc duc"
    r"|it noi chuyen|bat hoa|khau chien|lech nhau|gian nhau|chien tranh lanh)\b"
    r"|\b(?:lanh nhat|cai nhau|gat nhau|luc duc|gian|lech nhau)\b.{0,20}\b(?:may (?:thang|tuan|hom) nay|dao nay|ca (?:tuan|thang)|suot)\b"
)


_KIEN_THUC = re.compile(r"\b(?:la (?:cung|sao|cach|than) gi|la gi|nghia la gi|co nghia gi|y nghia (?:cua|la)|noi ve (?:gi|dieu gi|nhung gi))\b")
_CUA_MINH = re.compile(r"\b(?:cua (?:toi|minh|em|to|tui)|la so (?:toi|minh|em)|toi|minh)\b")


def ke_su_viec(t_norm: str) -> bool:
    """Người hỏi KỂ một biến cố đã / đang xảy ra với chính họ (ở bất kỳ mảng nào)."""
    return bool(_KE_SU_VIEC.search(t_norm))


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

    # 2. Khớp nguyên văn 1 trong 27 câu chuẩn trên thẻ / chip báo cáo
    bang = _bang_cau_chuan()
    if goc_norm in bang:
        return bang[goc_norm]
    if t in bang:
        return bang[t]
    if la_hai_nguoi_hoac_nguoi_khac(t, goc_norm, cau_goc):
        return None

    if _KIEN_THUC.search(t) and not _CUA_MINH.search(t):
        return None
    # 3. Lớp an toàn: câu kiến thức, câu khủng hoảng / đặc biệt (do nơi gọi chặn), câu không thuộc lá số của mình.
    if hieu_cau.kieu(t) == "kien_thuc":
        return None
    if pl is not None and pl.get("loai") not in _LOAI_CHO_PHEP.get(mo_dun or "tuvi", ("la_so", "han", "van")):
        return None

    if ke_su_viec(t):
        return None
    vai_khac = _vai_nguoi_khac(t)
    da_xay_ra = la_chuyen_qh_da_xay_ra(t, cau_goc)

    # 4. Khớp theo NHÓM TỪ KHOÁ trong KB (`tu_khoa`: mọi nhóm phải có ít nhất một cụm) hoặc mẫu câu cũ (`mau`). Thứ tự
    #    bảng = ưu tiên (mã cụ thể đứng trước mã chung). Không dùng cung / chủ đề của bộ định tuyến làm cổng: hai bộ phân
    #    loại khác mục đích, chặn oan nhiều hơn chặn đúng (đo trên bộ câu đóng băng `luan_hoi_chat_dev.jsonl`).
    for muc in kb_lh.anh_xa_hoi_dap():
        ch, ma = muc.get("chuong"), muc.get("ma")
        if not ch or not ma:
            continue
        if muc.get("chan_da_xay_ra") and da_xay_ra:
            continue
        cho_phep_vai = set(muc.get("vai_khac") or [])
        if vai_khac is not None and vai_khac not in cho_phep_vai:
            continue
        if ma == "quy_nhan" and re.search(r"\b(thien at|thien duc|nguyet duc|thai cuc|van xuong|phuc tinh|quoc an|ta phu|huu bat|thien khoi|thien viet)\b", t):
            continue      # hỏi tên một sao quý nhân → để hỏi đáp sao trả lời
        if muc.get("loai_tru") and chung.co(t, [r"\b" + x + r"\b" for x in muc["loai_tru"]]):
            continue
        nhom = muc.get("tu_khoa") or []
        if (nhom and all(chung.co(t, [r"\b" + x + r"\b" for x in g]) for g in nhom)) or chung.co(t, muc.get("mau") or []):
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

    # Câu mảng đời sống chung (không nằm trong 27 câu luan_hoi, không phải câu người khác / kiến thức). Bộ định tuyến chưa
    # chắc hiểu câu (`hoi_lai`) → không gắn liên kết chương (dễ dẫn sang chương không liên quan).
    if kq.get("hoi_lai"):
        return
    if la_hai_nguoi_hoac_nguoi_khac(t_norm, goc_norm, cau_hoi) or hieu_cau.kieu(t_norm) == "kien_thuc":
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
