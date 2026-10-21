# -*- coding: utf-8 -*-
"""Hỏi đáp Tử vi (HH-2) — RULES: phân loại câu hỏi, chọn cung/sao/lớp hạn cần xem,
gói bằng chứng chỉ từ lá số (iztro, CALC) + KB; NARRATIVE: template (+ LLM có kiểm tra).

Kỷ luật từ skill `tuvi-vn` (source-skills/tuvi-vn/SKILL.md):
  - LLM không an sao, không tự tính hạn: lá số và vận hạn do engine (iztro 2.6.0) tính.
  - Không phán bệnh, thọ yểu, tai nạn, kiện tụng, con số tiền; hạn = chủ đề giai đoạn.
  - Ba lớp hạn đọc tách bạch, ưu tiên đã khoá: đại hạn > lưu niên > tiểu hạn.
  - Không xem lá số người khác khi thiếu dữ liệu/đồng ý; hợp hôn không phán "khắc".
Chế độ (quyết định 2026-09-30): tham_khao (mặc định) | chi_tiet.
"""
from __future__ import annotations

import datetime as dt
import re
import unicodedata

from app import config
from app.calc import lunar, tuan_triet_vendor, tuvi_an_sao as az, tuvi_cach_cuc, tuvi_do_sang_vn
from app.calc import tuvi_luu_nguyet as ln
from app.hoidap import chung
from app.kb import tuvi_kb as kb
from app.kb import tuvi_phi_hoa_kb as pkb
from app.luangiai import hoi as _h, tuvi_luu_nguyet as lnl
from app.luangiai import tuvi_nhip_3_thang as nhip3, tuvi_phi_hoa as phl
from app.narrative import hoi_van

CHE_DO = ("tham_khao", "chi_tiet")
THU_TU_CUNG = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di",
               "Nô Bộc", "Quan Lộc", "Điền Trạch", "Phúc Đức", "Phụ Mẫu"]
DO_SANG_CHUAN = {"Hạn": "Hãm"}          # iztro vi-VN ghi "Hạn" cho 陷 (hãm)
HOA = {"loc": "Lộc", "quyen": "Quyền", "khoa": "Khoa", "ky": "Kỵ"}
THU_TU_HOA = ["Lộc", "Quyền", "Khoa", "Kỵ"]

# ------------------------------------------------------------------ nhận diện
CUNG_KW = {
    "Mệnh": [r"cung menh", r"thu menh", r"o menh", r"toa menh", r"menh vo chinh dieu", r"menh co",
             r"tai menh", r"cu menh"],
    "Huynh Đệ": [r"huynh de"], "Phu Thê": [r"phu the"], "Tử Nữ": [r"tu nu", r"tu tuc"],
    "Tài Bạch": [r"tai bach"], "Tật Ách": [r"tat ach"], "Thiên Di": [r"thien di"],
    "Nô Bộc": [r"no boc", r"giao huu"], "Quan Lộc": [r"quan loc"], "Điền Trạch": [r"dien trach"],
    "Phúc Đức": [r"phuc duc"], "Phụ Mẫu": [r"phu mau"],
}
CHU_DE_CUNG = [   # (cung, mẫu) — câu hỏi cá nhân không nêu tên cung
    ("Phu Thê", [r"tinh duyen", r"hon nhan", r"vo chong", r"nguoi yeu", r"ket hon", r"lay chong",
                 r"lay vo", r"dao hoa", r"hong loan", r"hai doi", r"tinh yeu", r"chong toi", r"vo toi",
                 r"muon chong", r"muon vo", r"ly hon", r"tinh cam", r"lay (nguoi|ai)", r"ban doi",
                 r"nua kia", r"chong con", r"nha chong", r"nha vo", r"me chong", r"bo chong"]),
    ("Tật Ách", [r"suc khoe", r"cang thang", r"ap luc", r"nghi ngoi", r"can bang", r"met moi"]),
    ("Tài Bạch", [r"lam an", r"tien", r"tai chinh", r"giau", r"lam giau", r"thu nhap", r"tai loc", r"lua tien",
                  r"dau tu", r"no nan", r"tieu (hoang|xai|pha)", r"chi tieu"]),
    ("Điền Trạch", [r"nha cua", r"nha dat", r"bat dong san", r"mua nha", r"nha o", r"dat dai", r"tai san", r"thua ke",
                    r"mua dat", r"ban dat", r"ban nha", r"xay nha", r"lam nha", r"sua nha", r"chung cu"]),
    ("Nô Bộc", [r"dong nghiep", r"cap duoi", r"ban be", r"choi xau", r"nguoi giup do", r"quy nhan",
                r"doi tac", r"hop tac"]),
    ("Quan Lộc", [r"su nghiep", r"cong viec", r"nghe", r"lam viec", r"thang chuc", r"kinh doanh",
                  r"nha nuoc", r"tu nhan", r"lam chu", r"khoi nghiep", r"cong danh", r"hoc hanh",
                  r"thi cu", r"lam quan", r"chuc vu", r"hop nghe"]),
    ("Tử Nữ", [r"con cai", r"con toi", r"sinh con", r"co con", r"hiem muon"]),
    ("Phụ Mẫu", [r"cha me", r"bo me", r"cap tren", r"sep"]),
    ("Huynh Đệ", [r"anh chi em", r"anh em", r"chi em"]),
    ("Thiên Di", [r"di xa", r"xuat ngoai", r"nuoc ngoai", r"dinh cu", r"xa que", r"moi truong", r"du hoc"]),
    ("Phúc Đức", [r"phuc", r"dong ho", r"tam linh", r"binh an", r"to tien"]),
]
SAO_KW = {"Tử Vi": [r"sao tu vi", r"tu vi (thu|o|tai|toa|nam|cu|dong)", r"(co|nguoi co|gap) tu vi", r"tu phu"],
          **{s: [chung.chuan_hoa(s)] for s in
             ["Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
              "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"]}}
SAO_KW["Thiên Phủ"] = SAO_KW["Thiên Phủ"] + [r"tu phu"]       # HH-CT2: "Tử Phủ" = Tử Vi + Thiên Phủ
PHU_KW = {"Hàm Trì": [r"dao hoa", r"ham tri"], "Hỏa Tinh": [r"hoa tinh"]}

CA_NHAN = [r"toi", r"cua minh", r"minh co", r"minh la", r"la so cua", r"em co", r"cua em", r"toi co"]
HOP_HON = [r"hop tuoi", r"hop hon", r"hop nhau", r"xung khac", r"ky nhau", r"xem tuoi lam an",
           r"tuoi \w+ lay (chong|vo) tuoi", r"hai la so", r"hop voi (anh|chi|co|chong|vo|nguoi)",
           r"tuoi \w+.{0,30}tuoi \w+.{0,30}(xung|hop|khac|ky)"]           # HH-CT2: "chồng tuổi Thân, tôi tuổi Hợi, có xung"
CON = [r"(cho|cua) con toi", r"la so cho con", r"be nha toi", r"sinh con nam nao", r"sinh con gio",
       r"con toi sinh", r"sinh con thang", r"nen sinh con",
       r"con (gai|trai) (toi|minh|em)", r"(be|con) (moi|vua) sinh"]          # HH-CT2
NGUOI_KHAC = [r"cho (chong|vo|me|bo|ong|ba|anh|chi|em|ban gai|ban trai|ban|nguoi yeu|sep) toi",
              r"(sep|chong|vo|me|bo|nguoi yeu|ban trai|ban gai|dong nghiep) toi (tuoi|sinh|co so|la nguoi)",
              r"xem (tu vi|la so) cho (?!toi)", r"tuoi \w+ \w+, tinh cach"]
HAN = [r"dai han", r"tieu han", r"luu nien", r"nam nay", r"nam sau", r"nam toi", r"nam 20\d\d",
       r"muoi nam", r"10 nam", r"nam nao", r"khi nao", r"bao gio", r"thang nao", r"han gi",
       r"tam tai", r"thai tue", r"nam tuoi", r"van han", r"hao tai", r"hanh han",
       r"thang (\d{1,2}|gieng|chap) am( lich)?"]                                   # HH-CT3
SU_KIEN = [r"tai nan", r"kien tung", r"mat tien", r"hao tai", r"lay chong", r"lay vo", r"co con",
           r"phat tai", r"han nang", r"thang chuc", r"ket hon"]
NAM_SAU = [r"nam sau", r"nam toi"]
TOI_KE = [r"dai han toi", r"muoi nam toi", r"10 nam toi", r"dai han sau"]
SU_KIEN_CHAN_MEM = [r"tai nan", r"thang kien"]   # chi_tiet: trả lời kèm lưu ý thay vì từ chối
# TV-V2: lỗ chặn riêng của câu hỏi thời điểm (bộ chung bắt "năm nào chết", chưa bắt "tháng nào tôi chết",
# "chọn ngày mổ") — chọn ngày cho việc y tế thuộc bác sĩ, không xem bằng tử vi.
TU_CHOI_TV = [r"(nam|thang|ngay|luc|khi|tuoi) nao (thi )?(toi |minh |em )?(se )?chet", r"(?<!\w)chet (nam|thang|ngay|luc) nao",
              r"(?<!\w)mo (ruot|khoi u|noi soi)(?!\w)", r"sinh mo(?!\w)",
              r"(ngay|thang|luc) .{0,20}(phau thuat|chua benh|nhap vien|dieu tri)"]
# Bỏ dấu thì "mổ" trùng "mở/mơ/mộ" ("mở xưởng", "mở để kinh doanh", "mở mắt") → cụm mổ mơ hồ chỉ xét trên câu CÒN DẤU.
TU_CHOI_TV_DAU = [r"(?<!\w)mổ (tim|mắt|u|bụng|lấy|xương|não|đẻ)(?!\w)"]

# ------------------------------------------------------------------ TV-V2: 8 ý định (KB y_dinh_hoi)
# Thứ tự = ưu tiên khi một câu khớp nhiều ý định (cụ thể trước, chung sau). Luật từ khoá công khai, không LLM.
_CON_REF = (r"(?<!\w)con (toi|minh|em|trai|gai|nha|cai)(?!\w)|(?<!\w)be (nha|toi|minh)(?!\w)|"
            r"(cua|cho|voi|giup) (con|be)(?!\w)|^con (sap|dang|hoc|thi|chon)")
_HOC = (r"hoc hanh|viec hoc|chuyen hoc|(?<!\w)hoc (nghe|dai hoc|gi|nganh|truong|them|lop)|on thi|nganh hoc|"
        r"chon nganh|chon truong|(?<!\w)thi (dai hoc|cu|chuyen cap|tot nghiep|vao|lop|hoc ky)")
_VIEC_CHON = (r"khai truong|ky (ket )?hop dong|ky ket|chuyen nha|don nha|nhap trach|dong tho|xay nha|khoi cong|"
              r"(?<!\w)cuoi(?!\w)|dam cuoi|an hoi|xuat hanh|(?<!\w)di xa|ra mat|nhan chuc|"
              r"(?<!\w)mo (cong ty|cua hang|quan|shop|tiem|van phong|doanh nghiep|chi nhanh)")
_THOI_CHON = (r"thang nao|ngay nao|khi nao|bao gio|luc nao|thoi diem|chon ngay|chon thang|ngay (dep|tot|hop)|"
              r"thang (thuan|tot|hop)")
Y_DINH_KW: dict[str, list[str]] = {
    "hoc_hanh_con": [],                                    # ghép _CON_REF + _HOC, xem _y_dinh()
    "chon_thoi_diem": [],                                  # ghép _VIEC_CHON + _THOI_CHON
    "ba_thang_toi": [r"(3|ba|hai|vai|may|mot vai) thang (toi|sap toi|nua|sau|ke tiep)", r"90 ngay",
                     r"quy (toi|nay|sau)(?!\w)", r"tung thang", r"thang nay va", r"(cac|nhung) thang (toi|sap toi)",
                     r"moi thang"],
    "tong_quan_nam": [],                                   # ghép năm + tổng quan
    "di_hay_o": [r"nghi viec", r"nhay viec", r"doi viec", r"chuyen viec", r"bo viec", r"thoi viec", r"xin nghi",
                 r"chuyen (cong ty|cho lam|nganh|sang nganh)", r"ra (ngoai )?lam rieng", r"cho lam (cu|khac|moi)",
                 r"tim (cho|viec) (lam )?(khac|moi)", r"o lai (cong ty|hay)", r"o lai hay", r"o hay di",
                 r"di hay o", r"ra ngoai lam", r"nhay (sang|cong ty)", r"giu cho lam"],
    "phan_van": [r"phan van", r"luong lu", r"dan do", r"chua quyet", r"khong biet (co )?nen", r"nen chon",
                 r"chon (ben|phuong an|cach|huong) nao", r"lua chon", r"quyet dinh (lon|quan trong|kho)"],
    "tai_van": [r"tai van", r"tien bac", r"tien nong", r"dong tien", r"tien vao", r"tien ra", r"giu tien",
                r"(?<!\w)de tien", r"tai chinh", r"chi tieu", r"kiem tien", r"van tien", r"thu nhap", r"de danh"],
    "hieu_ban_than": [r"toan dien", r"toan bo (cuoc doi|la so)", r"tong quan la so", r"tong the (cuoc doi|la so)",
                      r"tron (la so|cuoc doi)", r"ca la so", r"cuoc doi (toi|minh|em)", r"nhung chang",
                      r"chang (doi|nao)", r"hieu (ro )?ban than", r"binh giai", r"luan (toan|ca|tron|het)",
                      r"con nguoi toi", r"tu a toi z", r"tu a den z"],
}
_NAM_REF = r"(?<!\w)nam (nay|sau|toi|20\d\d|\w+ \w+ nay)|luu nien|ca nam|tron nam"
_TONG = (r"tong quan|nhin chung|ca nam|tron nam|moi mat|(nhung|cac) mang|mang nao|tong the|buc tranh|"
         r"cong viec tien bac|tong hop")
_PHAN_VAN_YEU = r"(?<!\w)(nen|co nen) .{1,40} hay (?!khong)"
# Cấu hình RULES theo ý định: loai đích, có cần ba lớp hạn / nhịp 3 tháng / trang gợi ý / checkpoint.
Y_DINH_CAU_HINH = {
    "di_hay_o": {"han": True},
    "tai_van": {"han": True},
    "hoc_hanh_con": {"han": True},
    "phan_van": {},
    "ba_thang_toi": {"loai_han": True, "nhip": True},
    "chon_thoi_diem": {"loai_han": True, "nhip": True, "trang": True},
    "tong_quan_nam": {"loai_han": True, "checkpoint": "nam"},
    "hieu_ban_than": {"checkpoint": "ban_than"},
}
_LOAI_NHAN_Y_DINH = ("la_so", "han", "ky_thuat", "la_so_con")
# Loại câu được nhận ý định GỢI Ý từ kho vectơ (hẹp hơn luật từ khoá: câu kỹ thuật "X là gì" không bao giờ đổi loại).
_LOAI_GOI_Y = ("la_so", "han")
PHI_HOA_KW = [r"phi hoa", r"phi tinh", r"duong bay", r"lai nhan", r"cung (nao )?tu hoa"]


# QA-RV: câu hỏi "sao X nằm ở đâu", "có cách cục gì", "sát tinh chiếu mệnh không".
CHINH_TINH_14 = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
                 "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"]
VI_TRI = [r"cung nao", r"o dau", r"nam dau", r"cho nao", r"vi tri nao", r"o vi tri"]
HOI_CACH = [r"cach cuc", r"co cach gi", r"cach gi dac biet", r"thuoc cach", r"cach (dep|tot|xau) khong"]
HOI_SAT = [r"sat tinh", r"hung tinh", r"sao xau", r"luc sat", r"sat chieu", r"bi sat"]
LUC_SAT = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"]
TAM_PHUONG = ["Mệnh", "Tài Bạch", "Quan Lộc", "Thiên Di"]
THANG = [r"thang \d{1,2}(?!\d)", r"thang (gieng|chap|gieng)", r"luu nguyet", r"thang nay", r"thang sau",
         r"thang toi", r"nguyet han", r"han thang", r"dau quan", r"tung thang", r"thang nao"]


def thang_hoi(t: str, ngay_xem: dt.date, nam_xem: int | None, nam_sau: bool) -> dict:
    """TV-LN — tháng âm + năm âm câu hỏi nhắc tới. `thang` None = hỏi chung cả năm.
    "tháng 3" hiểu là tháng ÂM (tử vi tính theo âm lịch); "tháng 3 dương" đổi ngày 15 của tháng dương đó ra âm."""
    ld, lm, ly, _ = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, config.CALENDAR_MERIDIAN_TZ)
    nam = nam_xem if nam_xem else ly + (1 if nam_sau else 0)
    thang, ghi_chu = None, None
    m = re.search(r"thang (\d{1,2})(?!\d)( (am|duong)( lich)?)?", t)
    if m and 1 <= int(m.group(1)) <= 12:
        thang = int(m.group(1))
        if m.group(3) == "duong":
            nd = dt.date(nam_xem or ngay_xem.year + (1 if nam_sau else 0), thang, 15)
            _, thang, nam, _ = lunar.solar_to_lunar(nd.day, nd.month, nd.year, config.CALENDAR_MERIDIAN_TZ)
            ghi_chu = f"Tháng {m.group(1)} dương lịch phần lớn thuộc tháng {thang} âm."
        elif m.group(3) != "am":
            ghi_chu = f"Tử vi tính theo âm lịch: đây là tháng {thang} ÂM."
    elif re.search(r"thang gieng", t):
        thang = 1
    elif re.search(r"thang chap", t):
        thang = 12
    elif re.search(r"thang nay", t):
        thang, nam = lm, ly
    elif re.search(r"thang (sau|toi)", t):
        thang, nam = (lm % 12) + 1, ly + (1 if lm == 12 else 0)
    return {"thang": thang, "nam_am": nam, "ghi_chu": ghi_chu}


def _sao_nhac(t: str) -> list[str]:
    """Mọi sao (chính tinh, phụ tinh trong KB, Hoá X, Tuần/Triệt, Thân) được nêu tên trong câu."""
    ds = []
    for ten in CHINH_TINH_14 + kb.ten_phu_tinh():
        if re.search(r"(?<!\w)" + re.escape(_h.chuan_hoa(ten)) + r"(?!\w)", t) and ten not in ds:
            ds.append(ten)
    for k, v in HOA.items():
        if re.search(rf"hoa {k}(?!\w)", t):
            ds.append(f"Hoá {v}")
    if re.search(r"tuan triet|tuan va triet", t):
        ds += [x for x in ("Tuần Không", "Triệt Lộ") if x not in ds]
    if re.search(r"(?<!\w)than (toi |cua toi |minh |cua minh )?(cu|o|nam|dong)|cung than", t):
        ds.append("Thân")
    return ds


def _co_ten(t: str, bang: dict[str, list[str]]) -> list[str]:
    return [k for k, m in bang.items() if chung.co(t, m)]


def _hoa_nhac(t: str) -> list[str]:
    return [v for k, v in HOA.items() if re.search(rf"(?<!\w)hoa {k}(?!\w)", t)]


def _phu_nhac(t: str) -> list[str]:
    ds = [p for p, m in PHU_KW.items() if chung.co(t, m)]
    for p in kb.ten_phu_tinh():
        if p not in ds and p not in PHU_KW and chung.co(t, [chung.chuan_hoa(p)]):
            ds.append(p)
    return ds


def _giai_thich_khop(t: str) -> list[str]:
    return [ma for ma, m in kb.giai_thich_tat_ca().items() if chung.co(t, m["tu_khoa"])]


def _cach_nhac(t: str) -> list[str]:
    """HH-CT2: cách cục được GỌI TÊN trong câu (vd "Sát Phá Tham", "Tử Phủ đồng cung") → mã trong KB cách cục."""
    ra = []
    for ma, m in kb._cc()["cach"].items():
        ten = chung.chuan_hoa(re.sub(r"\(.*?\)", "", m["ten"])).strip()
        if len(ten) >= 8 and re.search(rf"(?<!\w){re.escape(ten)}(?!\w)", t):
            ra.append(ma)
    return ra[:2]


def _nam_nhac(t: str) -> int | None:
    m = re.search(r"nam (20\d\d)", t)
    return int(m.group(1)) if m else None


def _y_dinh(t: str) -> str | None:
    """Ý định của câu (mã trong KB y_dinh_hoi) — None nếu không khớp."""
    if re.search(_CON_REF, t) and re.search(_HOC, t):
        return "hoc_hanh_con"
    if re.search(_VIEC_CHON, t) and re.search(_THOI_CHON, t):
        return "chon_thoi_diem"
    if chung.co(t, Y_DINH_KW["ba_thang_toi"]):
        return "ba_thang_toi"
    if re.search(_NAM_REF, t) and re.search(_TONG, t):
        return "tong_quan_nam"
    for ma in ("di_hay_o", "phan_van", "tai_van"):
        if chung.co(t, Y_DINH_KW[ma]):
            return ma
    if re.search(_PHAN_VAN_YEU, t):
        return "phan_van"
    if chung.co(t, Y_DINH_KW["hieu_ban_than"]):
        return "hieu_ban_than"
    return None


def _kb_y_dinh(ma: str) -> dict | None:
    ds = pkb._lay("y_dinh_hoi")
    return next((y for y in ds if isinstance(y, dict) and y.get("ma") == ma), None) if isinstance(ds, list) else None


def phan_loai(cau_hoi: str, che_do: str = "tham_khao", y_dinh_goi_y: str | None = None) -> dict:
    """`y_dinh_goi_y` (LG-ĐS, kho vectơ pgvector): mã ý định web tìm được bằng láng giềng gần nhất — CHỈ áp khi luật
    từ khoá không nhận ra ý định nào, chỉ cho câu bản mệnh / hạn, chỉ mã trong Y_DINH_CAU_HINH, và đi SAU bộ chặn
    khủng hoảng / ngoài phạm vi (câu đặc biệt trả về trước, gợi ý bị bỏ qua)."""
    gioi_thieu, t_chinh = _h._tach_gioi_thieu(cau_hoi)
    t = chung.chuan_hoa(cau_hoi)
    if gioi_thieu and (chung.co(gioi_thieu, [r"dai han", r"luu nien", r"tieu han", r"la so", r"cung \w+"])
                       or _co_ten(gioi_thieu, CUNG_KW)):
        t_chinh = t                     # "Tôi đang ở đại hạn…" không phải lời giới thiệu
    kq = {"cau_chuan_hoa": t, "che_do": che_do, "loai": None, "xu_ly": "tra_loi",
          "cung": _co_ten(t_chinh, CUNG_KW), "sao": _co_ten(t_chinh, SAO_KW), "hoa": _hoa_nhac(t_chinh),
          "phu": _phu_nhac(t_chinh), "giai_thich": _giai_thich_khop(t_chinh),
          "ca_nhan": chung.co(t_chinh, CA_NHAN), "su_kien": chung.co(t, SU_KIEN),
          "nam_xem": _nam_nhac(t), "han_sau": chung.co(t, NAM_SAU), "han_toi": chung.co(t, TOI_KE),
          "hoi_thang": chung.co(t, THANG), "sao_tim": [], "y_dinh": None,
          "nhan_ra_y_dinh": False, "co_the_goi_y": False, "y_dinh_tu_goi_y": False}
    t_loc = t
    if che_do == "chi_tiet":
        for m in SU_KIEN_CHAN_MEM:
            t_loc = re.sub(m, " ", t_loc)
    t_dau = unicodedata.normalize("NFC", cau_hoi).lower()
    db = chung.dac_biet(t_loc) or ("tu_choi_nhe" if chung.co(t_loc, TU_CHOI_TV)
                                   or any(re.search(m, t_dau) for m in TU_CHOI_TV_DAU) else None)
    if db:
        kq.update(xu_ly=db, loai="dac_biet")
        return kq
    if chung.co(t, HOP_HON):
        kq["loai"] = "hop_hon"
    elif chung.co(t, CON):
        kq["loai"] = "la_so_con"
    elif chung.co(t, NGUOI_KHAC):
        kq["loai"] = "nguoi_khac"
    elif chung.co(t_chinh, PHI_HOA_KW) and (kq["ca_nhan"] or chung.co(t_chinh, [r"la so"])):
        kq["loai"] = "phi_hoa"
    elif chung.co(t_chinh, PHI_HOA_KW) and not kq["ca_nhan"]:
        kq["loai"] = "phi_hoa_khai_niem"
    elif kq["giai_thich"] and not kq["ca_nhan"]:
        kq["loai"] = "ky_thuat"
    elif not kq["ca_nhan"] and (cc := _cach_nhac(t_chinh)):
        kq["loai"], kq["cach_nhac"] = "cach_cuc_chung", cc
    elif chung.co(t_chinh, HOI_CACH):
        kq["loai"] = "cach_cuc_la_so"
    elif chung.co(t_chinh, HOI_SAT) and not chung.co(t_chinh, HAN):
        kq["loai"] = "sat_tinh_la_so"
    elif chung.co(t_chinh, VI_TRI) and _sao_nhac(t_chinh) and not chung.co(t_chinh, HAN):
        kq["loai"], kq["sao_tim"] = "vi_tri_sao", _sao_nhac(t_chinh)[:3]
    elif (chung.co(t_chinh, HAN) or kq["hoi_thang"]) and kq["ca_nhan"] \
            or chung.co(t_chinh, [r"dai han", r"luu nien", r"tieu han"]):
        kq["loai"] = "han"
    elif not kq["ca_nhan"] and (kq["sao"] or kq["hoa"]) and (kq["cung"] or kq["sao"]):
        kq["loai"] = "tu_hoa_cung" if kq["hoa"] and kq["cung"] else "sao_cung"
    elif not kq["ca_nhan"] and kq["phu"] and chung.co(t_chinh, [r"la gi", r"y nghia", r"nghia la"]):
        kq["loai"] = "phu_tinh"
    elif chung.co(t_chinh, HAN) and not kq["cung"]:
        kq["loai"] = "han"
    else:
        kq["loai"] = "la_so"
    if kq["loai"] == "la_so" and not kq["cung"]:
        kq["cung"] = [c for c, m in CHU_DE_CUNG if chung.co(t_chinh, m)][:2] or ["Mệnh"]
    if kq["loai"] == "la_so" and "Tật Ách" in kq["cung"]:
        kq["xu_ly"] = "tra_loi_kem_luu_y"
    if kq["loai"] == "han":
        kq["xu_ly"] = "tra_loi_kem_luu_y"
        kq["cung"] = kq["cung"] or [c for c, m in CHU_DE_CUNG if chung.co(t_chinh, m)][:1]
    yd = _y_dinh(t_chinh) or _y_dinh(t)          # ý định có thể nằm trong lời dẫn ("Mình đang phân vân…, tử vi nói gì?")
    kq["co_the_goi_y"] = yd is None and kq["loai"] in _LOAI_GOI_Y
    goi_y = yd is None and kq["co_the_goi_y"] and y_dinh_goi_y in Y_DINH_CAU_HINH
    if goi_y:
        yd = y_dinh_goi_y
    if yd in ("tai_van", "di_hay_o", "phan_van") and _co_ten(t_chinh, CUNG_KW):
        yd = None                       # "Cung Tài Bạch của tôi nói gì về tiền bạc?", "chọn người yêu hợp cung Phu
        #                                 Thê" = câu bản mệnh về cung đã nêu, không phải ý định
    if yd and _kb_y_dinh(yd) and (kq["loai"] in ("la_so", "han", "ky_thuat")
                                  or (kq["loai"] == "la_so_con" and yd == "hoc_hanh_con")):
        _ap_y_dinh(kq, yd, t_chinh)
        kq["nhan_ra_y_dinh"] = not goi_y
        kq["y_dinh_tu_goi_y"] = goi_y
    return kq


def _ap_y_dinh(kq: dict, yd: str, t: str) -> None:
    """Gắn ý định: đổi loại khi cần đọc hạn, chọn cung theo KB khi câu không nêu mảng nào."""
    ch, y = Y_DINH_CAU_HINH[yd], _kb_y_dinh(yd)
    tu_chu_de = [c for c, m in CHU_DE_CUNG if chung.co(t, m)]
    kq["y_dinh"] = yd
    if kq["loai"] in ("ky_thuat", "la_so_con"):
        kq["loai"] = "la_so"
    if ch.get("loai_han"):
        kq["loai"] = "han"
    if yd == "hieu_ban_than":
        kq["cung"] = ["Mệnh"] + [c for c in kq["cung"] if c != "Mệnh"][:1]
    elif kq["loai"] == "la_so" and (not kq["cung"] or (kq["cung"] == ["Mệnh"] and not tu_chu_de
                                                        and not _co_ten(t, CUNG_KW))):
        kq["cung"] = ([] if yd == "phan_van" else y["cung_xem"][:2]) or ["Mệnh"]
    kq["xu_ly"] = "tra_loi_kem_luu_y"


# ------------------------------------------------------------------ lá số (CALC → dạng gọn)
def tom_tat(la: dict) -> dict:
    """Lá số thô iztro (vi-VN) → dạng gọn cho RULES: cung theo tên, sao, độ sáng, tứ hoá."""
    ten_phu = set(kb.ten_phu_tinh())
    cung, tu_hoa = [], []
    for p in la["palaces"]:
        # Độ sáng chính tinh: mặc định bảng Nam phái (chốt 2026-10-01); giữ bảng phái Trung (iztro) để đối chiếu.
        chinh = [{"ten": s["name"],
                  "do_sang": tuvi_do_sang_vn.do_sang(s["name"], p["earthlyBranch"])
                  or DO_SANG_CHUAN.get(s["brightness"], s["brightness"]) or None,
                  "do_sang_trung": DO_SANG_CHUAN.get(s["brightness"], s["brightness"]) or None,
                  "tu_hoa": s["mutagen"] or None} for s in p["majorStars"]]
        phu = [s["name"] for s in p["minorStars"] + p["adjectiveStars"] if s["name"] in ten_phu]
        for s in p["majorStars"] + p["minorStars"]:
            if s["mutagen"]:
                tu_hoa.append({"hoa": s["mutagen"], "sao": s["name"], "cung": p["name"]})
        cung.append({"chi_so": p["index"], "ten": p["name"], "chi": p["earthlyBranch"],
                     "can": p["heavenlyStem"], "la_than": p["isBodyPalace"], "chinh_tinh": chinh,
                     "phu_tinh": phu, "dai_han": p["decadal"]["range"]})
    # Tuần, Triệt (Nam phái) đóng giữa HAI cung liền nhau (cặp chi chẵn–lẻ); iztro chỉ ghi sao ở một cung
    # → bổ sung cung còn lại để hỏi đáp/luận giải không bỏ sót (vd Canh Ngọ: Tuần Tuất–Hợi, Triệt Ngọ–Mùi).
    theo_chi = {c["chi"]: c for c in cung}
    for sao in ("Tuần Không", "Triệt Lộ"):
        co = [c for c in cung if sao in c["phu_tinh"]]
        if len(co) == 1 and co[0]["chi"] in tuan_triet_vendor.CHI:
            i = tuan_triet_vendor.CHI.index(co[0]["chi"])
            ban = theo_chi.get(tuan_triet_vendor.CHI[i ^ 1])
            if ban is not None and sao not in ban["phu_tinh"]:
                ban["phu_tinh"].append(sao)
    can_nam = str(la.get("chineseDate", "")).split(" ")[0]
    return {"cuc": la["fiveElementsClass"], "menh_chu": la["soul"], "than_chu": la["body"],
            "can_nam": can_nam if can_nam in lunar.CAN else None,
            "cung": cung, "tu_hoa": sorted(tu_hoa, key=lambda x: THU_TU_HOA.index(x["hoa"])),
            "cach_cuc": tuvi_cach_cuc.nhan_dien(la)}


def _cung_ten(ls: dict, ten: str) -> dict:
    return next(c for c in ls["cung"] if c["ten"] == ten)


def _cung_doi(ls: dict, c: dict) -> dict:
    return ls["cung"][(c["chi_so"] + 6) % 12]


# ------------------------------------------------------------------ gói bằng chứng
def _m_cung(ten: str) -> dict:
    return {"loai": "cung", "ten": ten, **kb.cung(ten)}


def _m_sao_cung(sao: str, cung_: str, do_sang: str | None = None, vai: str = "kb") -> dict | None:
    nd = kb.sao_cung(sao, cung_)
    ct = kb.chinh_tinh(sao)
    if not nd or not ct:
        return None
    m = {"loai": "sao_cung", "vai": vai, "sao": sao, "cung": cung_, "noi_dung": nd,
         "tinh_chat": ct["tinh_chat"], "mat_toi": ct["mat_toi"], "cau_tu_soi": ct["cau_tu_soi"],
         **kb.meta()}
    if do_sang:
        m["do_sang"], m["do_sang_y"] = do_sang, kb.do_sang(do_sang)
        nhom = kb.nhom_do_sang(do_sang)
        if nhom:                                 # KB-TV2b: nghĩa riêng của sao khi sáng / khi hãm
            m["sac_thai"] = ct["khi_sang" if nhom == "sang" else "khi_ham"]
    return m


def _m_tu_hoa(hoa: str, cung_: str, sao: str | None = None) -> dict | None:
    nd, th = kb.tu_hoa_cung(hoa, cung_), kb.tu_hoa(hoa)
    if not nd or not th:
        return None
    return {"loai": "tu_hoa_cung", "hoa": hoa, "sao": sao, "cung": cung_, "noi_dung": nd,
            "y_nghia": th["y_nghia"], "luu_y_hoa": th["luu_y"], **kb.meta()}


def _m_phu(ten: str, cung_: str | None) -> dict | None:
    p = kb.phu_tinh(ten)
    return {"loai": "phu_tinh", "ten": ten, "cung": cung_, **p} if p else None


def _doc_cung(ls: dict, ten: str, muc: list, chinh: bool = True) -> None:
    """Một cung trong lá số: nghĩa cung + chính tinh (độ sáng) + tứ hoá + phụ tinh đáng kể."""
    c = _cung_ten(ls, ten)
    muc.append(_m_cung(ten))
    if c["chinh_tinh"]:
        for s in c["chinh_tinh"]:
            m = _m_sao_cung(s["ten"], ten, s["do_sang"], "la_so")
            if m:
                muc.append(m)
    else:
        doi = _cung_doi(ls, c)
        muc.append({"loai": "vo_chinh_dieu", "cung": ten, "muon_cung": doi["ten"],
                    "sao_muon": [s["ten"] for s in doi["chinh_tinh"]], **kb.meta()})
        for s in doi["chinh_tinh"][:2]:
            m = _m_sao_cung(s["ten"], ten, None, "muon")
            if m:
                muc.append(m)
    for x in ls["tu_hoa"]:
        if x["cung"] == ten:
            m = _m_tu_hoa(x["hoa"], ten, x["sao"])
            if m:
                muc.append(m)
    dang_ke = [p for p in c["phu_tinh"] if kb.phu_tinh(p)["nhom"] in
               ("Lục cát tinh", "Lục sát tinh", "Nhóm đào hoa", "Lộc", "Tuần/Triệt")]
    if dang_ke and chinh:
        muc.append({"loai": "phu_tinh_cung", "cung": ten,
                    "sao": [{"ten": p, **{k: v for k, v in kb.phu_tinh(p).items()
                                         if k in ("nhom", "y_nghia")}} for p in dang_ke[:5]],
                    **kb.meta()})


def _doc_menh(ls: dict, muc: list) -> None:
    menh = _cung_ten(ls, "Mệnh")
    sao = [s["ten"] for s in menh["chinh_tinh"]] or [s["ten"] for s in _cung_doi(ls, menh)["chinh_tinh"]]
    if sao:
        ct = kb.chinh_tinh(sao[0])
        muc.append({"loai": "chinh_tinh", "ten": sao[0], **ct})
        nc = kb.nhom_cach(ct["nhom"])
        if nc:
            muc.append({"loai": "nhom_cach", "nhom": ct["nhom"], "noi_dung": nc, **kb.meta()})
    # Cách cục quanh Mệnh (KB-2): tối đa 3 cách đầu theo thứ tự ưu tiên, kèm lục sát hội về.
    for c in [c for c in ls.get("cach_cuc", []) if c["ma"] != "than_menh_dong_cung"][:3]:
        k = kb.cach_cuc(c["ma"])
        if k:
            muc.append({"loai": "cach_cuc", **k, "cung_lien_quan": c["cung"], "sat_hoi": c["sat_hoi"]})
    than = next(c for c in ls["cung"] if c["la_than"])
    muc.append({"loai": "than_cu", "cung": than["ten"], "menh_chu": ls["menh_chu"],
                "than_chu": ls["than_chu"], "cuc": ls["cuc"], **kb.meta()})


def _lop_han(ls: dict, lop: str, vh: dict, che_do: str) -> dict:
    o = vh[lop]
    c = ls["cung"][o["chi_so"]]
    m = {"loai": "han", "lop": lop, "cung_goc": c["ten"], "can": o["can"], "chi": o["chi"],
         "chu_de": kb.chu_de_han(c["ten"]), "chinh_tinh": [s["ten"] for s in c["chinh_tinh"]],
         **kb.meta()}
    if lop == "dai_han":
        m["tu_tuoi"], m["den_tuoi"] = o["tu_tuoi"], o["den_tuoi"]
    if o.get("tu_hoa"):
        m["tu_hoa_lop"] = []
        for hoa, sao in zip(THU_TU_HOA, o["tu_hoa"]):
            noi = next((x["ten"] for x in ls["cung"]
                        if sao in [s["ten"] for s in x["chinh_tinh"]] or sao in x["phu_tinh"]), None)
            if hoa in ("Lộc", "Kỵ") and noi:
                m["tu_hoa_lop"].append({"hoa": hoa, "sao": sao, "cung_goc": noi})
    if che_do == "chi_tiet":
        cat = [p for p in c["phu_tinh"] if kb.phu_tinh(p)["nhom"] in ("Lục cát tinh", "Lộc")]
        sat = [p for p in c["phu_tinh"] if kb.phu_tinh(p)["nhom"] == "Lục sát tinh"]
        ky = [x["sao"] for x in ls["tu_hoa"] if x["cung"] == c["ten"] and x["hoa"] == "Kỵ"]
        diem = len(cat) - len(sat) - len(ky)
        m["xu_huong"] = {"cat": cat, "sat": sat + [f"{s} hoá Kỵ" for s in ky],
                         "ket": "thuận hơn" if diem > 0 else "nhiều thử thách hơn" if diem < 0 else "cân bằng"}
    return m


def goi_bang_chung(pl: dict, ls: dict | None, vh: dict | None, vh_toi: dict | None = None,
                   lnm: dict | None = None, them: dict | None = None) -> dict:
    """`them` (TV-V2) = {"phi": tuvi_phi_hoa.lap(...), "nhip": tuvi_nhip_3_thang.lap(...)} khi đã tính."""
    them = them or {}
    goi = {"phan_loai": {k: pl.get(k) for k in ("loai", "che_do", "xu_ly", "cung", "y_dinh")},
           "muc": [], "can_them": [], "mau": None, "luu_y": None}
    muc = goi["muc"]
    if pl["xu_ly"] == "an_toan":
        goi["mau"] = _mau_chung("an_toan")
        return chung.ket(goi)
    if pl["xu_ly"] == "tu_choi_nhe":
        goi["mau"] = _mau_chung("tu_choi")
        return chung.ket(goi)
    for ma in pl["giai_thich"][:2]:
        g = kb.giai_thich(ma)
        if g:
            muc.append({"loai": "giai_thich", "ma": ma, **g})
    loai = pl["loai"]
    if loai in ("hop_hon", "la_so_con", "nguoi_khac"):
        goi["can_them"] = ["la_so_nguoi_kia"]
        goi["mau"] = kb.mau({"hop_hon": "hop_hon", "la_so_con": "con", "nguoi_khac": "nguoi_khac"}[loai])
        return chung.ket(goi)
    if loai == "ky_thuat":
        return chung.ket(goi)
    if loai == "cach_cuc_chung":
        for ma in pl.get("cach_nhac", []):
            k = kb.cach_cuc(ma)
            if k:
                muc.append({"loai": "cach_cuc", **k, "cung_lien_quan": None, "sat_hoi": []})
        return chung.ket(goi)
    if loai == "sao_cung":
        cung_ = pl["cung"] or ["Mệnh"]
        for s in pl["sao"][:2]:
            m = _m_sao_cung(s, cung_[0])
            if m:
                muc.append(m)
            if not pl["cung"] or len(pl["sao"]) == 1:
                ct = kb.chinh_tinh(s)
                muc.append({"loai": "chinh_tinh", "ten": s, **ct})
        for h in pl["hoa"][:1]:
            m = _m_tu_hoa(h, cung_[0])
            if m:
                muc.append(m)
        return chung.ket(goi)
    if loai == "tu_hoa_cung":
        for h in pl["hoa"][:2]:
            m = _m_tu_hoa(h, pl["cung"][0])
            if m:
                muc.append(m)
        muc.append(_m_cung(pl["cung"][0]))
        return chung.ket(goi)
    if loai == "phu_tinh":
        for p in pl["phu"][:2]:
            m = _m_phu(p, None)
            if m:
                muc.append(m)
        return chung.ket(goi)
    if loai == "phi_hoa_khai_niem":
        for ma in ("phi_hoa", "tu_hoa", "lai_nhan", "xung_chieu"):
            k = pkb.khai_niem(ma)
            if k:
                muc.append({"loai": "khai_niem_phi_hoa", "ma": ma, "ten": k["ten"], "giai_thich": k["giai_thich"],
                            **pkb.meta()})
        muc.append({"loai": "ghi_chu", "noi_dung": phl.PHAI["ghi_chu"]})
        return chung.ket(goi)
    if ls is None:
        goi["can_them"] = ["la_so"]
        goi["mau"] = kb.mau("can_la_so")
        return chung.ket(goi)
    if loai == "vi_tri_sao":
        _tim_sao(ls, pl["sao_tim"], muc)
        return chung.ket(goi)
    if loai == "phi_hoa":
        _doc_phi_hoa(them.get("phi"), muc)
        return chung.ket(goi)
    if loai == "cach_cuc_la_so":
        ds = ls.get("cach_cuc", [])
        for c in ds:
            k = kb.cach_cuc(c["ma"])
            if k:
                muc.append({"loai": "cach_cuc", **k, "cung_lien_quan": c["cung"], "sat_hoi": c["sat_hoi"]})
        if not any(m["loai"] == "cach_cuc" for m in muc):
            muc.append({"loai": "ghi_chu", "noi_dung": (
                f"Lá số của bạn không rơi vào cách cục nào trong {len(tuvi_cach_cuc.DANH_SACH)} cách hệ thống "
                "đang nhận diện. Không có cách đặc biệt không phải điều xấu — phần lớn lá số như vậy; "
                "nên đọc chính tinh và tam phương của từng cung.")})
        return chung.ket(goi)
    if loai == "sat_tinh_la_so":
        menh = _cung_ten(ls, "Mệnh")
        ds = []
        for ten in TAM_PHUONG:
            c = _cung_ten(ls, ten)
            sat = [p for p in c["phu_tinh"] if p in LUC_SAT]
            sat += [f"{x['sao']} hoá Kỵ" for x in ls["tu_hoa"] if x["cung"] == ten and x["hoa"] == "Kỵ"]
            if sat:
                ds.append({"cung": ten, "sao": sat})
        muc.append({"loai": "sat_chieu", "ds": ds, "menh_chinh_tinh": [s["ten"] for s in menh["chinh_tinh"]],
                    **kb.meta()})
        da = set()
        for x in ds:
            for p in x["sao"]:
                ten = p.split(" hoá ")[0] if " hoá " in p else p
                if p.endswith("hoá Kỵ"):
                    m = _m_tu_hoa("Kỵ", x["cung"], ten)
                else:
                    m = _m_phu(p, x["cung"])
                if m and (m["loai"], p) not in da:
                    da.add((m["loai"], p))
                    muc.append(m)
        return chung.ket(goi)
    if loai == "han":
        if lnm:
            th = pl.get("thang_hoi") or {}
            if th.get("ghi_chu"):
                muc.append({"loai": "ghi_chu", "noi_dung": th["ghi_chu"]})
            t = lnl.thang_cua(lnm, th["thang"]) if th.get("thang") else None
            nam = {k: lnm[k] for k in ("nam_am", "can_chi_nam", "phai", "phai_ten", "phai_cach_tinh")}
            if t:
                i = lnm["thang"].index(t)
                muc.append({"loai": "luu_nguyet", **nam, **t, "tu": t["tu"].isoformat(), "den": t["den"].isoformat(),
                            "phai_khac": {v["ten"]: v["theo_thang"][i] for k, v in lnm["so_sanh_phai"].items()
                                          if k != lnm["phai"]}, **kb.meta()})
            else:
                muc.append({"loai": "luu_nguyet_nam", **nam, "ds": [
                    {"thang": x["thang"], "nhuan": x["nhuan"], "phan": x["phan"], "cung_goc": x["cung_goc"],
                     "ket": x["xu_huong"]["ket"]} for x in lnm["thang"]], **kb.meta()})
            muc.append({"loai": "ghi_chu", "noi_dung": lnm["uu_tien"] + " Bối cảnh năm và vận ở dưới."})
        elif pl.get("hoi_thang") and not them.get("nhip"):
            muc.append({"loai": "ghi_chu", "noi_dung": (
                "Muốn xem từng tháng (lưu nguyệt), hãy mở lá số của bạn. Dưới đây là bức tranh cả năm.")})
        if pl["su_kien"]:
            muc.append({"loai": "ghi_chu", "noi_dung": kb.luu_y("han_su_kien")})
        if vh is None:
            goi["can_them"] = ["ngay_xem"]
            return chung.ket(goi)
        muc.append({"loai": "tuoi", "tuoi_mu": vh["tuoi_mu"], "ngay_xem": vh.get("ngay_xem")})
        for lop in ("dai_han", "luu_nien", "tieu_han"):
            muc.append(_lop_han(ls, lop, vh, pl["che_do"]))
        if vh_toi:
            m = _lop_han(ls, "dai_han", vh_toi, pl["che_do"])
            m["vai"] = "ke_tiep"
            muc.append(m)
        for ten in pl["cung"][:1]:
            c = _cung_ten(ls, ten)
            muc.append({"loai": "cung_trong_han", "cung": ten, "chu_de": kb.cung(ten)["xem_duoc"],
                        "chinh_tinh": [s["ten"] for s in c["chinh_tinh"]], **kb.meta()})
        if chung.co(pl["cau_chuan_hoa"], [r"nam nao", r"khi nao", r"bao gio"]) and not pl.get("y_dinh"):
            muc.append({"loai": "cac_dai_han", "ds": _cac_dai_han(ls), **kb.meta()})
        if pl.get("y_dinh"):
            _them_y_dinh(pl, ls, them, muc)
        goi["luu_y"] = kb.luu_y(pl["che_do"])
        return chung.ket(goi)
    # la_so cá nhân
    for ten in pl["cung"][:2]:
        _doc_cung(ls, ten, muc)
    if "Mệnh" in pl["cung"]:
        _doc_menh(ls, muc)
    for p in pl["phu"][:2]:
        noi = next((c["ten"] for c in ls["cung"] if p in c["phu_tinh"]), None)
        m = _m_phu(p, noi)
        if m:
            muc.append(m)
    if pl.get("y_dinh"):
        if vh is not None and Y_DINH_CAU_HINH[pl["y_dinh"]].get("han"):
            muc.append({"loai": "tuoi", "tuoi_mu": vh["tuoi_mu"], "ngay_xem": vh.get("ngay_xem")})
            for lop in ("dai_han", "luu_nien", "tieu_han"):
                muc.append(_lop_han(ls, lop, vh, pl["che_do"]))
            muc.append({"loai": "ghi_chu", "noi_dung": "Thứ tự ưu tiên khi đọc: " + lnl.UU_TIEN})
            goi["luu_y"] = kb.luu_y(pl["che_do"])
        _them_y_dinh(pl, ls, them, muc)
    if "Tật Ách" in pl["cung"]:
        goi["luu_y"] = kb.luu_y("tat_ach")
    return chung.ket(goi)


def _cac_dai_han(ls: dict) -> list[dict]:
    return [{"cung_goc": c["ten"], "tu_tuoi": c["dai_han"][0], "den_tuoi": c["dai_han"][1]}
            for c in sorted(ls["cung"], key=lambda c: c["dai_han"][0])]


# ------------------------------------------------------------------ TV-V2: bằng chứng theo ý định
_TOI_DA_DUONG = 4
_THU_TU_HOA_DUONG = {"Kỵ": 0, "Lộc": 1, "Khoa": 2, "Quyền": 3}


def _gon_duong(d: dict) -> dict:
    return {k: d[k] for k in ("tu_cung", "can", "sao", "hoa", "den_cung", "xung_cung", "tu_hoa", "nghia")}


def _duong_lien_quan(phi: dict, cung_y: list[str], yd: str) -> list[dict]:
    """Đường bay chạm các cung của ý định: tự hoá tại cung đó, bay vào, hoặc Kỵ chiếu tới; Kỵ/Lộc trước."""
    if yd == "hieu_ban_than":
        ung = [d for d in phi["duong_bay"] if d["den_cung"] is not None
               and (d["den_cung"] == "Mệnh" or (d["tu_cung"] == "Mệnh" and d["tu_hoa"]))]
    else:
        cy = set(cung_y)
        ung = [d for d in phi["duong_bay"] if d["den_cung"] is not None and (
            (d["tu_hoa"] and d["tu_cung"] in cy)
            or (not d["tu_hoa"] and d["hoa"] in ("Lộc", "Kỵ") and d["den_cung"] in cy and d["tu_cung"] != d["den_cung"])
            or (not d["tu_hoa"] and d["hoa"] == "Kỵ" and d["xung_cung"] in cy))]
    ung.sort(key=lambda d: (not d["tu_hoa"], _THU_TU_HOA_DUONG[d["hoa"]], cung_y.index(d["tu_cung"])
                            if d["tu_cung"] in cung_y else 99))
    ra, da = [], set()
    for d in ung:
        k = (d["tu_cung"], d["hoa"])
        if k not in da:
            da.add(k)
            ra.append(_gon_duong(d))
    return ra[:_TOI_DA_DUONG]


def _them_y_dinh(pl: dict, ls: dict, them: dict, muc: list) -> None:
    yd = pl["y_dinh"]
    y, ch = _kb_y_dinh(yd), Y_DINH_CAU_HINH[yd]
    cung_y = list(dict.fromkeys([c for c in pl["cung"] if c in THU_TU_CUNG] + y["cung_xem"]))
    phi, nhip = them.get("phi"), them.get("nhip")
    if nhip:
        muc.append({"loai": "nhip_3_thang", "so_thang": 3, "ten_phai": nhip["ten_phai_luu_nguyet"],
                    "uu_tien": nhip["uu_tien"]["ghi_chu"],
                    "thang": [{k: t[k] for k in ("thang", "nhuan", "phan", "nam_am", "can_chi", "tu", "den", "cung_goc",
                                                 "muc", "nhan_muc", "tieu_de_thang", "goi_y", "cau_tu_soi")}
                              | {"ly_do": [x["noi_dung"] for x in t["ly_do"]]} for t in nhip["thang"]],
                    **pkb.meta()})
    if ch.get("trang"):
        thuan = [t for t in (nhip or {}).get("thang", []) if t["muc"] == "thuan"]
        muc.append({"loai": "goi_y_trang", "duong": "/xem-ngay-tot", "ten": "Xem ngày tốt",
                    "thang_thuan": [{"thang": t["thang"], "nhuan": t["nhuan"], "can_chi": t["can_chi"]} for t in thuan]})
    if phi and yd not in ("ba_thang_toi", "chon_thoi_diem", "tong_quan_nam"):
        m = {"loai": "phi_hoa_y_dinh", "duong": _duong_lien_quan(phi, cung_y, yd), **pkb.meta()}
        if yd == "hieu_ban_than":
            m["lai_nhan"] = phi["lai_nhan"]
        muc.append(m)
    if phi and phi.get("luu_nien") and (ch.get("han") or yd == "tong_quan_nam"):
        ln_ = phi["luu_nien"]
        muc.append({"loai": "luu_nien_phi_hoa", "can_chi": ln_["can_chi"], "hoa": ln_["hoa"],
                    "cham": [h["hoa"] for h in ln_["hoa"] if h["den_cung"] in cung_y or
                             (h["hoa"] == "Kỵ" and h["xung_cung"] in cung_y)] if yd != "tong_quan_nam" else [],
                    **pkb.meta()})
    if ch.get("checkpoint"):
        ds_cung = THU_TU_CUNG if ch["checkpoint"] == "nam" else y["cung_xem"]
        hoa_nam = {}
        for h in ((phi or {}).get("luu_nien") or {}).get("hoa", []):
            hoa_nam.setdefault(h["den_cung"], []).append(f"{h['hoa']} ({h['sao']})")
        ds = []
        for ten in ds_cung:
            c = _cung_ten(ls, ten)
            ds.append({"cung": ten, "chinh_tinh": [s["ten"] + (f" ({s['do_sang']})" if s["do_sang"] else "")
                                                   for s in c["chinh_tinh"]],
                       "hoa_nam": hoa_nam.get(ten, []) if ch["checkpoint"] == "nam" else [],
                       "chu_de": kb.cung(ten)["xem_duoc"] if ch["checkpoint"] == "ban_than" else None})
        muc.append({"loai": "cung_checkpoint", "kieu": ch["checkpoint"], "ds": ds, **kb.meta()})
        if ch["checkpoint"] == "ban_than":
            muc.append({"loai": "cac_dai_han", "ds": _cac_dai_han(ls), **kb.meta()})
    sao_trong = []
    for sao in y.get("sao_xem", []):
        noi = [c["ten"] for c in ls["cung"] if sao in [s["ten"] for s in c["chinh_tinh"]] or sao in c["phu_tinh"]]
        if noi:
            sao_trong.append({"sao": sao, "cung": " và ".join(noi)})
    muc.append({"loai": "y_dinh", "ma": yd, "ten": y["ten"], "cach_ghep": y["cach_ghep"], "cung_xem": cung_y,
                "sao_trong_la": sao_trong, "source_id": y.get("source_id"), "school_id": y.get("school_id"),
                **pkb.meta()})
    if yd == "hoc_hanh_con":
        muc.append({"loai": "ghi_chu", "noi_dung": (
            "Đây là góc nhìn từ lá số của cha mẹ về cách đồng hành với con; không đoán điểm, không chọn trường hay "
            "nghề thay con. Muốn xem kỹ hơn, hãy lập lá số của chính con.")})


def _doc_phi_hoa(phi: dict | None, muc: list) -> None:
    """Câu hỏi về đường bay tứ hoá của chính lá số (chương "Đường bay tứ hoá" của Luận giải toàn bộ)."""
    if not phi:
        return
    muc.append({"loai": "phi_hoa_tong", "lai_nhan": phi["lai_nhan"],
                "tu_hoa": [_gon_duong(d) for d in phi["tu_hoa"]],
                "vao_menh": [_gon_duong(d) for d in phi["vao_menh"] if not d["tu_hoa"]], **pkb.meta()})
    muc.append({"loai": "phi_hoa_noi_bat", "ds": [
        {"loai_noi_bat": n["loai"], "tieu_de": n["tieu_de"], "nghia": n["nghia"], "viec_nen_lam": n["viec_nen_lam"],
         "cau_tu_soi": n["cau_tu_soi"], "ghi_chu_tuan_triet": n["ghi_chu_tuan_triet"]} for n in phi["noi_bat"][:5]],
        **pkb.meta()})
    for ma in ("phi_hoa", "lai_nhan"):
        k = pkb.khai_niem(ma)
        if k:
            muc.append({"loai": "khai_niem_phi_hoa", "ma": ma, "ten": k["ten"], "giai_thich": k["giai_thich"],
                        **pkb.meta()})
    muc.append({"loai": "ghi_chu", "noi_dung": phl.PHAI["ghi_chu"]})


def _tim_sao(ls: dict, sao_tim: list[str], muc: list) -> None:
    """Định vị từng sao được hỏi trên lá số rồi đọc nghĩa của nó ĐÚNG ở cung đó."""
    for sao in sao_tim:
        if sao == "Thân":
            than = next(c for c in ls["cung"] if c["la_than"])
            muc.append({"loai": "than_cu", "cung": than["ten"], "menh_chu": ls["menh_chu"],
                        "than_chu": ls["than_chu"], "cuc": ls["cuc"], **kb.meta()})
            muc.append(_m_cung(than["ten"]))
            continue
        if sao.startswith("Hoá "):
            hoa = sao[4:]
            x = next((x for x in ls["tu_hoa"] if x["hoa"] == hoa), None)
            if x:
                muc.append({"loai": "vi_tri_sao", "sao": sao, "cung": x["cung"], "mang": x["sao"]})
                m = _m_tu_hoa(hoa, x["cung"], x["sao"])
                if m:
                    muc.append(m)
            else:
                muc.append({"loai": "vi_tri_sao", "sao": sao, "cung": None})
            continue
        cs = [c for c in ls["cung"] if sao in [s["ten"] for s in c["chinh_tinh"]] or sao in c["phu_tinh"]]
        if not cs:
            muc.append({"loai": "vi_tri_sao", "sao": sao, "cung": None})
            continue
        if len(cs) > 1:                       # Tuần/Triệt đóng giữa hai cung
            muc.append({"loai": "vi_tri_sao", "sao": sao, "cung": " và ".join(c["ten"] for c in cs),
                        "dong_cung": [s["ten"] for c in cs for s in c["chinh_tinh"]]})
            m = _m_phu(sao, " và ".join(c["ten"] for c in cs))
            if m:
                muc.append(m)
            continue
        c = cs[0]
        ct = next((s for s in c["chinh_tinh"] if s["ten"] == sao), None)
        muc.append({"loai": "vi_tri_sao", "sao": sao, "cung": c["ten"], "do_sang": ct["do_sang"] if ct else None,
                    "dong_cung": [s["ten"] for s in c["chinh_tinh"] if s["ten"] != sao]})
        m = _m_sao_cung(sao, c["ten"], ct["do_sang"], "la_so") if ct else _m_phu(sao, c["ten"])
        if m:
            muc.append(m)


def _mau_chung(ma: str) -> str:
    from app.kb import kinhdich_kb  # noqa: PLC0415 — mẫu an toàn/từ chối dùng chung Huyền học
    return kinhdich_kb.mau(ma)


# ------------------------------------------------------------------ NARRATIVE (template)
LOP_TEN = {"dai_han": "Đại hạn", "luu_nien": "Lưu niên", "tieu_han": "Tiểu hạn"}


def _ngay(d: dt.date | str) -> str:
    d = dt.date.fromisoformat(d) if isinstance(d, str) else d
    return f"{d.day}/{d.month}/{d.year}"


def _ten_thang(t: dict) -> str:
    dau = {"nua_dau": "nửa đầu ", "nua_sau": "nửa sau "}.get(t.get("phan", ""), "")
    return f"{dau}tháng {t['thang']}{' nhuận' if t['nhuan'] else ''} âm ({t['can_chi']})"


def _cau_duong(d: dict) -> str:
    if d["tu_hoa"]:
        dau = f"Cung {d['tu_cung']} tự hoá {d['hoa']} ({d['sao']})"
    else:
        dau = f"Can {d['can']} của cung {d['tu_cung']} hoá {d['sao']} {d['hoa']} vào cung {d['den_cung']}"
        if d["hoa"] == "Kỵ" and d["xung_cung"]:
            dau += f", chiếu cung {d['xung_cung']}"
    return f"{dau}: {d['nghia'].rstrip('.')}."


def _doan(m: dict, da_co_sao: set[str] = frozenset()) -> tuple[str, str | None]:
    l = m["loai"]
    if l == "cung":
        return (f"Cung {m['ten']}: {m['y_nghia']} Cung này cho thấy {m['xem_duoc']}; "
                f"nó {m['khong_tra_loi']}.", m["cau_tu_soi"])
    if l == "sao_cung":
        dau = {"la_so": f"Trong lá số của bạn, {m['sao']} ở cung {m['cung']}",
               "muon": f"Cung {m['cung']} vô chính diệu, mượn {m['sao']} từ cung đối diện",
               "kb": f"{m['sao']} ở cung {m['cung']}"}[m["vai"]]
        s = f"{dau}"
        if m.get("do_sang"):
            s += f" ({m['do_sang']} — {m['do_sang_y']})"
        s += f": {m['noi_dung']}"
        if m.get("sac_thai"):
            s += f" {m['sac_thai']}"
        if m["sao"] not in da_co_sao:
            s += f" Nét chung của {m['sao']}: {m['tinh_chat']} Mặt tối cần để ý: {m['mat_toi']}."
        return s, m["cau_tu_soi"]
    if l == "chinh_tinh":
        return (f"{m['ten']} ({m['ten_han']}, hành {m['ngu_hanh']}): {m['tinh_chat']} Điểm mạnh: "
                f"{m['diem_manh']}. Mặt tối: {m['mat_toi']}. Biểu hiện dễ thấy: {m['bieu_hien']}.",
                m["cau_tu_soi"])
    if l == "nhom_cach":
        return m["noi_dung"], None
    if l == "cach_cuc":
        s = (f"Cách cục {m['ten']} ({m['ten_han']}) — {m['dieu_kien']} {m['y']} "
             f"Mặt tối: {m['mat_toi']} Gợi ý: {m['loi_khuyen']}")
        if m["sat_hoi"]:
            if "__pha_cach__" in da_co_sao:              # ghi chú dài chỉ nói một lần mỗi câu trả lời
                s += f" (Tam phương có {', '.join(m['sat_hoi'])} hội về — giảm cách, như lưu ý ở trên.)"
            else:
                s += f" Lưu ý: tam phương có {', '.join(m['sat_hoi'])} hội về — {kb.luu_y_pha_cach()}"
                if isinstance(da_co_sao, set):
                    da_co_sao.add("__pha_cach__")
        return s, None
    if l == "than_cu":
        return (f"Thân cư cung {m['cung']} — trọng tâm đời sống về sau nghiêng về lĩnh vực này. "
                f"Mệnh chủ {m['menh_chu']}, Thân chủ {m['than_chu']}, {m['cuc']}.", None)
    if l == "vo_chinh_dieu":
        mu = ", ".join(m["sao_muon"]) or "không có chính tinh"
        return (f"Cung {m['cung']} vô chính diệu (không có chính tinh), mượn cung {m['muon_cung']} "
                f"đối diện ({mu}) để luận — tính chất nhẹ hơn, phụ thuộc nhiều vào môi trường.", None)
    if l == "tu_hoa_cung":
        sao = f" ({m['sao']} hoá {m['hoa']})" if m.get("sao") else ""
        return f"Hoá {m['hoa']} ở cung {m['cung']}{sao}: {m['noi_dung']} {m['y_nghia']} {m['luu_y_hoa']}", None
    if l == "phu_tinh_cung":
        ds = "; ".join(f"{s['ten']} ({s['nhom']}): {s['y_nghia']}" for s in m["sao"])
        return f"Phụ tinh đáng kể ở cung {m['cung']}: {ds}", None
    if l == "phu_tinh":
        noi = f" — trong lá số của bạn nằm ở cung {m['cung']}" if m.get("cung") else ""
        return f"{m['ten']} ({m['nhom']}){noi}: {m['y_nghia']}", None
    if l == "tuoi":
        return f"Tuổi mụ tại thời điểm xem: {m['tuoi_mu']}.", None
    if l == "han":
        ten = LOP_TEN[m["lop"]] + (" kế tiếp" if m.get("vai") == "ke_tiep" else "")
        s = f"{ten}: cung {m['cung_goc']} ({m['can']} {m['chi']})"
        if m["lop"] == "dai_han":
            s += f", từ {m['tu_tuoi']} đến {m['den_tuoi']} tuổi"
        s += f". {m['chu_de']}"
        if m["chinh_tinh"]:
            s += f" Chính tinh tại cung: {', '.join(m['chinh_tinh'])}."
        for x in m.get("tu_hoa_lop", []):
            s += f" Hoá {x['hoa']} của {ten.lower()} ({x['sao']}) rơi vào cung {x['cung_goc']}."
        if m.get("xu_huong"):
            xh = m["xu_huong"]
            s += f" Xu hướng: {xh['ket']}"
            if xh["cat"] or xh["sat"]:
                s += f" (sao tốt: {', '.join(xh['cat']) or 'không'}; sao khó: {', '.join(xh['sat']) or 'không'})"
            s += "."
        return s, None
    if l == "luu_nguyet":
        ten_t = f"tháng {m['thang']}{' nhuận' if m['nhuan'] else ''} âm năm {m['can_chi_nam']}"
        if m["phan"] != "ca_thang":
            ten_t += f" ({'nửa đầu' if m['phan'] == 'nua_dau' else 'nửa sau'})"
        s = (f"Lưu nguyệt {ten_t} — từ {_ngay(m['tu'])} đến {_ngay(m['den'])} dương lịch, tháng {m['can_chi']}. "
             f"Theo phái {m['phai_ten']}, Mệnh của tháng rơi vào cung {m['cung_goc']} ({m['chi']}). {m['chu_de']}")
        if m["chinh_tinh"]:
            s += " Chính tinh tại cung: " + ", ".join(
                f"{x['ten']}" + (f" ({x['do_sang']})" if x["do_sang"] else "") for x in m["chinh_tinh"]) + "."
        else:
            s += " Cung tháng vô chính diệu — đọc thêm sao ở cung đối diện."
        if m["tuan_triet"]:
            s += f" Có {' và '.join(m['tuan_triet'])} đóng tại cung."
        for x in m["tu_hoa_thang"]:
            if x["hoa"] in ("Lộc", "Kỵ") and x["cung_goc"]:
                s += f" Hoá {x['hoa']} của tháng ({x['sao']}) ở cung {x['cung_goc']}"
                s += " — đúng cung tháng." if x["vao_cung_thang"] else (
                    " — trong tam phương của cung tháng." if x["vao_tam_phuong"] else ".")
        for lop in m["trung"]:
            s += f" Cung tháng trùng cung {LOP_TEN[lop].lower()} — chủ đề của {LOP_TEN[lop].lower()} nổi rõ trong tháng."
        for lop in m["chieu"]:
            s += f" Cung {LOP_TEN[lop].lower()} nằm trong tam phương của cung tháng."
        xh = m["xu_huong"]
        s += f" Xu hướng tháng: {xh['ket']}"
        if xh["cat"] or xh["sat"]:
            s += f" (sao tốt: {', '.join(xh['cat']) or 'không'}; sao khó: {', '.join(xh['sat']) or 'không'})"
        s += "."
        khac = sorted({v for v in m["phai_khac"].values() if v != m["cung_goc"]})
        s += (" Các phái khác đặt tháng này ở: " + "; ".join(f"{k} → {v}" for k, v in m["phai_khac"].items()) + "."
              if khac else " Cả năm phái tính tháng hạn đều ra cùng cung này.")
        return s, None
    if l == "luu_nguyet_nam":
        ds = "; ".join(f"tháng {x['thang']}{' nhuận' if x['nhuan'] else ''}"
                       f"{' (nửa sau)' if x['phan'] == 'nua_sau' else ''}: {x['cung_goc']} ({x['ket']})"
                       for x in m["ds"])
        return (f"Lưu nguyệt năm {m['can_chi_nam']} theo phái {m['phai_ten']}: {ds}. "
                "Hỏi một tháng cụ thể để xem sao, tứ hoá và cách các phái khác tính tháng đó.", None)
    if l == "cung_trong_han":
        ct = ", ".join(m["chinh_tinh"]) or "vô chính diệu"
        return (f"Việc bạn hỏi thuộc cung {m['cung']} ({m['chu_de']}); trong lá số gốc cung này có: {ct}. "
                "Soi chủ đề ba lớp hạn ở trên vào lĩnh vực này.", None)
    if l == "cac_dai_han":
        ds = "; ".join(f"{x['tu_tuoi']}–{x['den_tuoi']}: {x['cung_goc']}" for x in m["ds"])
        return f"Các đại hạn trong lá số: {ds}. Hệ thống không chọn 'năm tốt' thay bạn — hãy xem chủ đề từng giai đoạn.", None
    if l == "vi_tri_sao":
        if not m["cung"]:
            return f"Lá số của bạn không có {m['sao']} (hoặc hệ thống chưa an sao này).", None
        s = f"{m['sao']} nằm ở cung {m['cung']}"
        if m.get("mang"):
            s += f" (do {m['mang']} hoá {m['sao'][4:]})"
        if m.get("do_sang"):
            s += f", độ sáng {m['do_sang']}"
        if m.get("dong_cung"):
            s += f", đồng cung với {', '.join(m['dong_cung'])}"
        return s + ".", None
    if l == "sat_chieu":
        if not m["ds"]:
            return ("Tam phương tứ chính của Mệnh (Mệnh, Tài Bạch, Quan Lộc, Thiên Di) không có lục sát tinh "
                    "(Kình, Đà, Hỏa, Linh, Không, Kiếp) hay Hoá Kỵ.", None)
        ds = "; ".join(f"{x['cung']}: {', '.join(x['sao'])}" for x in m["ds"])
        return (f"Sát tinh trong tam phương tứ chính của Mệnh — {ds}. Sát tinh không phải điềm dữ định sẵn: "
                "chúng làm cung thêm sức ép và tính quyết liệt; gặp chính tinh sáng thì thành nghị lực, "
                "gặp chính tinh hãm thì dễ vấp — đọc tiếp nghĩa từng sao bên dưới.", None)
    if l == "nhip_3_thang":
        tom = "; ".join(f"{_ten_thang(t)} — {t['nhan_muc']}" for t in m["thang"])
        s = f"Nhịp {m['so_thang']} tháng tới (lưu nguyệt theo phái {m['ten_phai']}): {tom}."
        for t in m["thang"]:
            s += (f" {_ten_thang(t)[0].upper()}{_ten_thang(t)[1:]} (từ {_ngay(t['tu'])} đến {_ngay(t['den'])} dương lịch, "
                  f"Mệnh tháng ở cung {t['cung_goc']}): {t['nhan_muc']} — {t['tieu_de_thang'].lower()}.")
            if t["ly_do"]:
                s += " " + " ".join(t["ly_do"])
            s += f" {t['goi_y']}"
        s += f" Thứ tự ưu tiên khi đọc: {m['uu_tien']}"
        return s, m["thang"][0]["cau_tu_soi"] if m["thang"] else None
    if l == "goi_y_trang":
        s = ""
        if m["thang_thuan"]:
            s = ("Theo nhịp tứ hoá, tháng nổi lên mức Thuận trong ba tháng tới: "
                 + ", ".join(_ten_thang(t) for t in m["thang_thuan"]) + ". ")
        else:
            s = "Trong ba tháng tới chưa có tháng nào nổi lên mức Thuận theo nhịp tứ hoá — đó là tháng giữ nhịp, không phải tháng xấu. "
        return (s + f"Tử vi chỉ gợi ý nhịp tháng; muốn chọn ngày, giờ cụ thể (ngày hoàng đạo, giờ tốt, ngày nên tránh "
                f"theo tuổi), hãy dùng công cụ {m['ten']} ({m['duong']}). Thời điểm chỉ là một yếu tố, sự chuẩn bị của "
                "bạn quan trọng hơn."), None
    if l == "phi_hoa_y_dinh":
        s = ""
        if m.get("lai_nhan") and m["lai_nhan"].get("cung"):
            s = (f"Lai nhân cung của bạn là cung {m['lai_nhan']['cung']} (can {m['lai_nhan']['can']}, trùng can năm "
                 "sinh) — mảng đời bạn mang theo nhiều tâm sức nhất. ")
        if not m["duong"]:
            return (s + "Theo phái phi tinh, không có đường bay Lộc hay Kỵ nổi bật chạm vào các cung của câu hỏi này "
                    "— đọc chính tinh và ba lớp hạn là đủ."), None
        return s + "Đường bay tứ hoá liên quan (phái phi tinh): " + " ".join(_cau_duong(d) for d in m["duong"]), None
    if l == "luu_nien_phi_hoa":
        ds = ", ".join(f"Hoá {h['hoa']} ({h['sao']}) vào cung {h['den_cung']}" for h in m["hoa"] if h["den_cung"])
        s = f"Tứ hoá lưu niên năm {m['can_chi']} theo can năm: {ds}."
        if m["cham"]:
            s += " Mảng bạn hỏi có " + ", ".join(f"Hoá {h} của năm ({phl._Y_HOA[h]})" for h in m["cham"]) + "."
        return s, None
    if l == "cung_checkpoint":
        if m["kieu"] == "nam":
            ds = "; ".join(f"{x['cung']}: {', '.join(x['chinh_tinh']) or 'vô chính diệu'}"
                           + (f" — Hoá {', '.join(x['hoa_nam'])} của năm" if x["hoa_nam"] else "") for x in m["ds"])
            return f"Mười hai mảng để soi trong năm (cung gốc và chính tinh): {ds}.", None
        ds = "; ".join(f"{x['cung']} ({x['chu_de']}): {', '.join(x['chinh_tinh']) or 'vô chính diệu'}" for x in m["ds"])
        return f"Các cung chốt để hiểu toàn diện bản thân: {ds}.", None
    if l == "y_dinh":
        s = f"Cách đọc nhóm câu hỏi “{m['ten']}”: {m['cach_ghep']}"
        if m["sao_trong_la"]:
            s += " Sao nên soi cho câu này trong lá số của bạn: " + ", ".join(
                f"{x['sao']} ở {x['cung']}" for x in m["sao_trong_la"]) + "."
        return s, None
    if l == "phi_hoa_tong":
        ln_ = m["lai_nhan"]
        s = (f"Lai nhân cung của bạn là cung {ln_['cung']} (can {ln_['can']}, trùng can năm sinh)." if ln_.get("cung")
             else "")
        if m["tu_hoa"]:
            s += " Cung tự hoá trong lá số: " + "; ".join(
                f"{d['tu_cung']} tự hoá {d['hoa']} ({d['sao']})" for d in m["tu_hoa"]) + "."
        else:
            s += " Lá số không có cung nào tự hoá."
        if m["vao_menh"]:
            s += " Đường bay vào cung Mệnh: " + "; ".join(
                f"can {d['can']} của cung {d['tu_cung']} hoá {d['sao']} {d['hoa']}" for d in m["vao_menh"]) + "."
        else:
            s += " Không có đường bay nào từ cung khác vào cung Mệnh."
        return s.strip(), None
    if l == "phi_hoa_noi_bat":
        ds = " ".join(f"{x['tieu_de']}: {x['nghia']} Việc nên làm: {x['viec_nen_lam']}" for x in m["ds"])
        tt = next((x["ghi_chu_tuan_triet"] for x in m["ds"] if x["ghi_chu_tuan_triet"]), None)
        if ds and tt:
            ds += f" Lưu ý Tuần/Triệt: {tt}"
        return (f"Đường bay nổi bật — {ds}" if ds else "Lá số không có đường bay nổi bật theo luật đang dùng."), \
            (m["ds"][0]["cau_tu_soi"] if m["ds"] else None)
    if l == "khai_niem_phi_hoa":
        return f"{m['ten']}: {m['giai_thich']}", None
    if l == "giai_thich":
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "ghi_chu":
        return m["noi_dung"], None
    return "", None


def van_template(goi: dict) -> str:
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    doan, soi = [], []
    da_co_sao = {m["ten"] for m in goi["muc"] if m["loai"] == "chinh_tinh"}
    for m in goi["muc"]:
        d, s = _doan(m, da_co_sao)
        if d:
            doan.append(d)
        if s and not soi:
            soi.append(s)
    if goi["mau"]:
        doan.append(goi["mau"])
    if soi:
        doan.append("Câu hỏi để tự soi: " + soi[0])
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(hoi_van.KET)
    return "\n\n".join(doan)


# ------------------------------------------------------------------ điểm vào
def _cong_nam(d: dt.date, n: int) -> dt.date:
    try:
        return d.replace(year=d.year + n)
    except ValueError:
        return d.replace(year=d.year + n, day=28)


def tra_loi(cau_hoi: str, che_do: str = "tham_khao", sinh: dict | None = None,
            ngay_xem: dt.date | None = None, dung_llm: bool = False, y_dinh_goi_y: str | None = None) -> dict:
    """`sinh` = {"ngay": date (dương, kinh tuyến UTC+7), "ti": 0..12, "gioi_tinh": "nam"|"nu"}.
    `y_dinh_goi_y`: xem phan_loai (mã lạ / câu đặc biệt / từ khoá đã nhận ra → bỏ qua)."""
    if che_do not in CHE_DO:
        raise ValueError(f"che_do phải là một trong {CHE_DO}")
    pl = phan_loai(cau_hoi, che_do, y_dinh_goi_y=y_dinh_goi_y)
    ls = vh = vh_toi = lnm = None
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    can_la_so = pl["loai"] in ("la_so", "han", "vi_tri_sao", "cach_cuc_la_so", "sat_tinh_la_so", "phi_hoa")
    yd = pl.get("y_dinh")
    ch = Y_DINH_CAU_HINH.get(yd, {})
    them: dict = {}
    if sinh and can_la_so:
        ls = tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN",
                                     tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                                     hoa_linh=sinh.get("hoa_linh", "viet"),
                                     thang_nhuan=sinh.get("thang_nhuan", "thang_sau"),
                                     lich=sinh.get("lich", "viet")))
        if pl["loai"] == "han" or ch.get("han"):
            xem = ngay_xem
            if pl["nam_xem"]:
                xem = dt.date(pl["nam_xem"], 7, 1)
            elif pl["han_sau"]:
                xem = _cong_nam(ngay_xem, 1)
            vh = {**az.van_han(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], xem,
                                tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                                thang_nhuan=sinh.get("thang_nhuan", "thang_sau"),
                                lich=sinh.get("lich", "viet")), "ngay_xem": xem.isoformat()}
            if pl["han_toi"]:
                buoc = vh["dai_han"]["den_tuoi"] - vh["tuoi_mu"] + 1
                vh_toi = az.van_han(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], _cong_nam(xem, buoc),
                                    tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                                    thang_nhuan=sinh.get("thang_nhuan", "thang_sau"),
                                    lich=sinh.get("lich", "viet"))
        if pl["loai"] == "han" and pl["hoi_thang"] and not ch.get("nhip"):
            pl["thang_hoi"] = thang_hoi(pl["cau_chuan_hoa"], ngay_xem, pl["nam_xem"], pl["han_sau"])
            lnm = lnl.lap_nam(sinh, pl["thang_hoi"]["nam_am"], sinh.get("luu_nguyet", ln.MAC_DINH), ls=ls)
        elif yd == "ba_thang_toi" and chung.co(pl["cau_chuan_hoa"], [r"tung thang", r"moi thang"]):
            pl["thang_hoi"] = thang_hoi("", ngay_xem, pl["nam_xem"], pl["han_sau"])
            lnm = lnl.lap_nam(sinh, pl["thang_hoi"]["nam_am"], sinh.get("luu_nguyet", ln.MAC_DINH), ls=ls)
        if ch.get("nhip"):
            them["nhip"] = nhip3.lap(sinh, ngay_xem, sinh.get("luu_nguyet", ln.MAC_DINH), ls=ls)
        if (yd or pl["loai"] == "phi_hoa") and ls.get("can_nam"):
            xem_phi = dt.date.fromisoformat(vh["ngay_xem"]) if vh else ngay_xem
            nam_am = lunar.solar_to_lunar(xem_phi.day, xem_phi.month, xem_phi.year, config.CALENDAR_MERIDIAN_TZ)[2]
            them["phi"] = phl.lap(ls, ls["can_nam"], nam_am if (ch.get("han") or yd == "tong_quan_nam") else None)
    goi = goi_bang_chung(pl, ls, vh, vh_toi, lnm, them)
    van = van_template(goi)
    che_do_van, loi = "template", []
    if dung_llm and goi["muc"] and not goi["can_them"]:
        try:
            v = hoi_van._goi_llm(goi, cau_hoi)
            loi = hoi_van.kiem_tra_dau_ra(v, goi)
            che_do_van, van = ("llm", v) if not loi else ("template_fallback", van)
        except Exception as e:  # noqa: BLE001
            che_do_van, loi = "template_fallback", [f"llm lỗi: {str(e)[:120]}"]
    co = []
    if ls is not None:
        co.append({"loai": "nam_phai", "chi_tiet": kb.luu_y("iztro")})
    dac_biet = pl["xu_ly"] in ("an_toan", "tu_choi_nhe") or bool(goi["can_them"])
    return {"phan_loai": goi["phan_loai"], "van_han": vh, "bang_chung": goi, "cau_tra_loi": van,
            "che_do_van": che_do_van, "loi_kiem_tra": loi, "can_them": goi["can_them"],
            "co_canh_bao": co, "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong",
            # LG-ĐS: web chỉ tra kho vectơ khi co_the_goi_y (từ khoá không nhận ra, câu bản mệnh/hạn, không đặc biệt).
            "nhan_ra_y_dinh": bool(pl.get("nhan_ra_y_dinh")), "co_the_goi_y": bool(pl.get("co_the_goi_y")),
            "y_dinh_tu_goi_y": bool(pl.get("y_dinh_tu_goi_y"))}
