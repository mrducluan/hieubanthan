# -*- coding: utf-8 -*-
"""Tầng RULES (3) cho Q&A thần số — phân loại câu hỏi và dựng GÓI BẰNG CHỨNG.

Không gọi LLM (CLAUDE.md: RULES cấm gọi LLM). Phân loại bằng từ khoá trên câu
đã bỏ dấu, theo thứ tự ưu tiên:
    an_toan > ngoai_pham_vi > ky_thuat > hop_doi > nguoi_khac/con > lĩnh vực

Golden: fixtures/cau_hoi/thanso_cau_hoi.jsonl (ngưỡng trong tests/test_hoi_phan_loai.py).
Mọi nội dung đưa vào gói bằng chứng đều lấy từ KB kèm source_id + school_id;
tầng NARRATIVE chỉ được diễn đạt gói này.
"""
from __future__ import annotations

import datetime as _dt
import re
import unicodedata

from app.calc import thanso, thanso_mo_rong as mr
from app.kb import store, thanso_v2 as kb

# --------------------------------------------------------------------------- #
# Chuẩn hoá
# --------------------------------------------------------------------------- #
def chuan_hoa(s: str) -> str:
    s = s.replace("Đ", "D").replace("đ", "d")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    s = s.lower()
    s = re.sub(r"(?<=[a-z])/(?=[a-z])", " ", s)          # vợ/chồng → vo chong
    s = re.sub(r"[^\w/\-\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


_RX: dict[str, re.Pattern] = {}


def _rx(m: str) -> re.Pattern:
    """Biên dịch một lần (số mẫu > bộ đệm 512 của module re)."""
    if m not in _RX:
        _RX[m] = re.compile(r"(?<!\w)" + m + r"(?!\w)")
    return _RX[m]


def _co(t: str, mau: list[str]) -> bool:
    return any(_rx(m).search(t) for m in mau)


def _dem(t: str, mau: list[str]) -> int:
    return sum(1 for m in mau if _rx(m).search(t))


# --------------------------------------------------------------------------- #
# Từ khoá
# --------------------------------------------------------------------------- #
AN_TOAN = [
    r"khong muon song", r"muon chet", r"tu tu", r"tu sat", r"bien mat khoi",
    r"ngu mot giac khong", r"khong con ly do", r"song cung chang de lam gi",
    r"song cung chang", r"thay minh vo dung", r"bao hanh", r"danh toi",
    r"bi lua het tien", r"no nan chong chat", r"giai doan cuoi",
    r"(me|bo|con|chong|vo|ong|ba|anh|chi|em) (toi |minh |em )?vua mat(?! viec| tien| tich)",
    r"con toi vua mat", r"ket lieu", r"khong thiet song",
]

TU_CHOI = {
    "may_rui": [r"danh de", r"xo so", r"ve so", r"trung so", r"lo de", r"ca cuoc", r"ca do",
                r"so may man de", r"danh lo"],
    "tuyen_dung": [r"tuyen ung vien", r"ung vien", r"sa thai nhan vien", r"nhan vien so chu dao",
                   r"nen tuyen", r"sa thai nhan vien nao"],
    "suc_khoe_the_chat": [r"benh gi", r"mac benh", r"ung thu", r"dau da day", r"vo sinh",
                          r"sinh con duoc khong", r"co nen mo vao", r"phau thuat", r"song tho", r"an gi cho hop",
                          r"suc khoe cua toi the nao", r"khoi benh"],
    "du_doan_cu_the": [r"nam nao toi chet", r"bao gio toi chet", r"khi nao toi chet", r"tai nan",
                       r"thang kien", r"cho toi biet chac", r"chac chan", r"ngay cu the",
                       r"ten gi sinh nam nao", r"may dua con", r"nam nao toi ly hon",
                       r"gia vang", r"doi nao thang", r"con bao lau"],
}

LIEN_QUAN_NGUOI = (r"(nguoi yeu|ny|crush|anh ay|co ay|ban ay|nguoi ay|ban trai|ban gai|chong|vo|"
                   r"me chong|bo chong|me vo|bo vo|me toi|bo toi|me|bo|ban than|doi tac|sep|"
                   r"dong nghiep|con gai|con trai|anh em|hai dua|hai nguoi|hai vo chong|nguoi moi quen|"
                   r"khach hang|em gai|anh trai|chi gai|nguoi nay|nguoi toi thich)")

CON = [r"con toi", r"con gai toi", r"con trai toi", r"be nha", r"cho con", r"be sinh",
       r"dat ten con", r"ten con", r"sinh con", r"hai dua con", r"con sinh", r"be trai", r"be gai",
       r"cho be", r"tinh cach be", r"con cua toi", r"ten o nha cua be"]
CON_DAC_DIEM = [r"tinh cach", r"nang khieu", r"hop hoc", r"bieu do", r"so chu dao", r"sinh ngay",
                r"hieu dong", r"buong", r"nhut nhat", r"hop nghe", r"du hoc", r"noi doi",
                r"nghien", r"thieu so", r"mui ten", r"hoc kem", r"cai", r"day thi",
                r"the nao", r"dac biet", r"xem", r"hop voi toi", r"danh nhau", r"sau nay"]

NGUOI_KHAC = [
    r"anh ay sinh", r"co ay sinh", r"ban ay sinh",
    r"sinh \d{1,2}/\d{1,2}/\d{4}.*(tinh cach|the nao|kieu|can gi|manh)",
    r"tinh cach (cua )?(sep|nguoi yeu|chong|vo|bo|me|ban|nguoi yeu cu|anh|chi|em)",
    r"(nguoi yeu|ny) (toi |em |minh )?(co that long|co phai|yeu kieu|sinh)",
    r"(chong|vo|sep|me chong|bo chong|ban than|dong nghiep|em gai|anh trai|bo|me|ban trai|nguoi yeu|crush)"
    r" (toi|em|minh|cua em|cua toi) (so chu dao|so \d|sinh|co that|la nguoi|kho tinh|co phai|yeu kieu|"
    r"can gi|co dang|co hay|hay thay|co tinh cam)",
    r"(nguoi nay|nguoi moi quen nay|nguoi moi quen|khach hang nay|dong nghiep nay|ban than toi|"
    r"nguoi toi thich) (co|la|sinh)",
    r"xem (giup )?(tinh cach|than so hoc) (cua |cho )?(sep|bo|me|nguoi yeu|nguoi yeu cu|chong|vo)",
    r"xem than so hoc cho (bo|me|chong|vo|nguoi yeu|sep)", r"xem giup tinh cach",
    r"crush cua em", r"ban than toi sinh", r"ban ay manh", r"(me|bo) (toi|chong toi) so chu dao",
]
KHONG_PHAI_NGUOI_KHAC = [r"hop (voi |nhau|hay khac|khong)", r"co hop", r"hop tinh", r"xem do hop",
                         r"lam sao de", r"toi nen", r"phai lam sao", r"toi co nen", r"toi va"]

LINH_VUC_KW: dict[str, list[str]] = {
    "tinh_yeu": [r"nguoi yeu", r"ny", r"yeu nhau", r"yeu kieu", r"toi yeu", r"em yeu", r"duoc yeu", r"yeu nguoi", r"dang yeu", r"yeu ai", r"yeu mu quang", r"yeu nhu the nao", r"tinh yeu", r"(?<!song )tinh cam", r"tinh duyen", r"crush",
                 r"lay chong", r"lay vo", r"nen cuoi", r"cuoi nhau", r"nam nao toi nen cuoi", r"ket hon", r"lam vo chong", r"ken chon", r"moi tinh", r"thich nguoi", r"hop voi nguoi", r"viec nha", r"hon nhan", r"chia tay",
                 r"nguoi cu", r"ghen", r"toxic", r"ly hon", r"tai hon", r"ngoai tinh", r"het e", r"bi e", r"e lau", r"to tinh",
                 r"doc than", r"hen ho", r"friendzone", r"cam ket", r"ra mat", r"yeu xa",
                 r"vo chong", r"chong toi", r"vo toi", r"nguoi vo", r"nguoi chong", r"moi quan he",
                 r"thao tung", r"song chung", r"lua hon nhan", r"dong gioi", r"rung dong", r"don phuong",
                 r"thu hut dung nguoi", r"nguoi phu hop", r"(khong dong y|phan doi|ngan can) nguoi yeu",
                 r"nguoi yeu khac quan diem", r"het e", r"hom hinh", r"lanh nhat",
                 r"ngon ngu tinh yeu", r"bi phan boi", r"quay lai", r"lang man", r"nguoi da co gia dinh"],
    "gia_dinh": [r"bo me", r"gia dinh", r"me chong", r"nha chong", r"nha vo", r"bo chong", r"anh chi em",
                 r"anh em", r"con ca", r"nhuong nhin em", r"o rieng", r"gia dao", r"bo toi", r"me toi",
                 r"ve que song gan", r"tai san", r"gia truong", r"ky vong cua bo me", r"con nha nguoi ta",
                 r"song chung voi bo me", r"bo me gia", r"tha thu cho bo me", r"vai tro cua toi trong",
                 r"cho dua cua ca nha", r"em ay"],
    "con_cai": [r"con toi", r"con cai", r"nuoi day", r"day con", r"cham con", r"sinh con", r"dat ten con",
                r"ten con", r"(?<!ban )be", r"con gai", r"con trai", r"sinh them con", r"con tuoi teen", r"la mang con", r"lam bo me", r"kieu bo me",
                r"lam bo me", r"(?<!cham soc )bo me the nao", r"nguoi bo tot", r"truong quoc te", r"cho con",
                r"lo lang cho con", r"kien nhan hon voi con", r"ap dat con", r"voi con(?! so)", r"con so ten o nha",
                r"ten dem", r"dat ten", r"chon ngay mo de con"],
    "su_nghiep": [r"nghe(?! thuat)", r"lam tai chinh", r"cong viec", r"viec lam", r"nghi viec", r"doi viec", r"chuyen nganh",
                  r"thang tien", r"sep", r"dong nghiep", r"kinh doanh", r"khoi nghiep", r"mo quan",
                  r"mo cong ty", r"lam an", r"su nghiep", r"lam thue", r"freelancer", r"startup",
                  r"cong ty", r"tang luong", r"sa thai", r"ban hang", r"lam giao vien", r"nganh it", r"chuyen nganh", r"nganh gi", r"su nghiep", r"nghe nghiep", r"dong nghiep", r"doi viec",
                  r"sang tao noi dung", r"lam sep", r"lam viec", r"nha nuoc", r"luat su", r"marketing",
                  r"ngan hang", r"nghe si", r"kol", r"livestream", r"nong nghiep", r"nhan su",
                  r"nghe tay trai", r"hai viec", r"cuoc hop", r"quan ly nhan vien", r"om viec",
                  r"burnout", r"nhuong quyen", r"quan ca phe", r"shop", r"thua lo", r"lam tu xa",
                  r"di lam", r"ghi nhan", r"lam o", r"nghe y", r"tu van", r"chua lanh",
                  r"kinh doanh online", r"lam viec nhom", r"lam viec mot minh", r"moi truong lam viec",
                  r"lam ky su", r"gop von", r"phong van", r"xin viec", r"hop dong", r"that nghiep", r"nop don nghi"],
    "tai_chinh": [r"(?<!thang )(?<!uu )tien", r"giau", r"tien bac", r"tai chinh", r"dau tu", r"chung khoan", r"mua nha", r"mua dat",
                  r"tien ao", r"no nan", r"dang no", r"no nhieu", r"tra het", r"vay tien", r"cho vay", r"tiet kiem", r"tieu tien", r"chi tieu", r"mua sam", r"tai loc",
                  r"cho vay", r"thu nhap", r"cho (nguoi khac|nguoi ta|ban be) vay"],
    "hoc_tap": [r"hoc tap", r"hoc hanh", r"viec hoc", r"hoc bai", r"cach hoc", r"hoc mai", r"em hoc", r"nen hoc(?! cach)", r"hoc nhom", r"hoc buoi", r"hoc truoc", r"thi cu", r"em thi", r"thi dai hoc", r"thi co do", r"ky thi", r"khi thi", r"chon nganh", r"nganh gi khi", r"hoc nganh", r"nganh cong nghe", r"hop hoc", r"dai hoc", r"khoi a", r"khoi d", r"du hoc", r"thac si",
                r"ngoai ngu", r"hoc nghe", r"on thi", r"tap trung hoc", r"ielts", r"tieng anh",
                r"tieng trung", r"diem so", r"hoc them", r"su pham", r"bo hoc", r"thi lai", r"xao nhang"],
    "suc_khoe": [r"cang thang", r"stress", r"mat ngu", r"kiet suc", r"can bang cuoc song", r"thu gian",
                 r"tram buon", r"tram cam", r"an uong", r"lo au", r"chuyen gia tam ly", r"ngu ngon",
                 r"cau gat", r"the thao", r"thoi quen(?! xau)", r"suc khoe", r"tinh than"],
    "tam_linh": [r"no nghiep", r"bai hoc nghiep", r"kiep truoc", r"luan hoi", r"can tu",
                 r"di tu", r"giac quan thu sau", r"nguoi duoc chon", r"so hiem", r"qua bao",
                 r"bai hoc cuoc doi", r"bai hoc lon nhat"],
    "ten_goi": [r"(?<!mui )ten", r"doi ten", r"nghe danh", r"ten shop", r"ten cong ty", r"so dien thoai",
                r"bien so", r"biet danh", r"doi ho", r"ten tieng anh"],
    "ban_be_xa_hoi": [r"ban be", r"(?<!cho )ban than", r"tinh ban", r"giao tiep", r"moi quan he xa hoi",
                      r"mang xa hoi", r"yeu quy", r"thuyet phuc", r"thuong hieu ca nhan", r"cong dong",
                      r"xa lanh", r"it ban", r"ghen ti", r"ban cu", r"mo rong cac moi quan he",
                      r"phat long", r"nguoi ban tot", r"choi voi"],
    "cuoc_song": [r"chuyen nha", r"chuyen vao", r"ve que", r"dinh cu", r"mua xe", r"thanh pho",
                  r"nong thon", r"so thich", r"du lich", r"nghi huu", r"thu cung", r"cuoi tuan",
                  r"tuoi gia", r"noi o", r"ve que lap nghiep", r"tang may", r"so nha"],
    "ban_than": [r"tinh cach", r"con nguoi", r"diem manh", r"diem yeu", r"tu tin", r"tu ti",
                 r"muc dich song", r"su menh", r"dam me", r"huong noi", r"huong ngoai", r"nong tinh",
                 r"cau toan", r"tri hoan", r"bo do", r"lanh dao", r"tai nang", r"nang khieu", r"ban than",
                 r"cam xuc", r"suy nghi", r"gia tri cot loi", r"kho gan", r"dang song", r"hanh phuc",
                 r"ky luat", r"quyet doan", r"kien tri", r"buong bo", r"hoan thien", r"ky nang",
                 r"thoi quen xau", r"doc sach", r"muc tieu", r"song cham", r"cung dau", r"ich ky",
                 r"da nghi", r"mo mong", r"thuc te", r"hai huoc", r"ra quyet dinh", r"che giau",
                 r"tu trach", r"linh hon", r"nhan cach", r"bieu do", r"mui ten", r"so lap",
                 r"so thieu", r"khong co so", r"nhieu so", r"sinh ngay", r"nguyen tac", r"chan",
                 r"mat dong luc", r"ly tri", r"de tin nguoi", r"mem long", r"bi hieu lam", r"khac biet",
                 r"so sanh", r"ton thuong", r"co don", r"yeu ban than", r"noi khong", r"tu lua",
                 r"sinh ra de", r"di dung huong", r"khao khat", r"hoi tiec", r"nghi cho nguoi khac",
                 r"kiem soat", r"tinh tu do", r"(?<!so )sanh", r"hay phan ung", r"phan ung the nao"],
}
# Lĩnh vực "thời vận": chỉ khi câu hỏi không nêu chủ đề nào khác.
THOI_DIEM = [r"nam nay", r"nam sau", r"nam ngoai", r"nam 20\d\d", r"thang nay", r"thang sau",
             r"hom nay", r"ngay mai", r"tuan nay", r"khi nao", r"bao gio", r"nam ca nhan",
             r"thang ca nhan", r"ngay ca nhan", r"dinh cao", r"giai doan", r"tuoi nao", r"chu ky",
             r"ba nam toi", r"nam nao", r"thang nao", r"ngay nao", r"thoi diem", r"kim tu thap",
             r"thu thach", r"tuoi \d\d", r"ve gia", r"tuoi tre", r"thoi van"]

# Hỏi CHỌN ngày/tháng tốt cho một việc ("ngày nào hợp để ký hợp đồng", "ngày mai có phải ngày tốt để tỏ tình")
# → thời vận: trả lời theo ngày/tháng/năm cá nhân; việc (hợp đồng, tỏ tình…) chỉ là bối cảnh.
CHON_THOI_DIEM = [r"giai doan nao( trong doi)?( toi)? nen", r"(ngay|thang) nao( trong (thang|nam)( nay)?)? (hop|tot)", r"co phai (la )?(ngay|thang|nam) tot",
                  r"thang nao trong nam"]

KY_THUAT_CHUNG = [r"tinh the nao", r"cach tinh", r"la gi$", r"tinh theo", r"co chinh xac",
                  r"co khoa hoc", r"co phai la mot"]

# lĩnh vực phân loại → lĩnh vực nội dung KB + vị trí số được dùng
VI_TRI_THEO_LV = {
    "ban_than": ["duong_doi", "linh_hon", "nhan_cach"],
    "tinh_yeu": ["linh_hon", "nhan_cach", "duong_doi"],
    "gia_dinh": ["duong_doi", "linh_hon"],
    "con_cai": ["duong_doi", "linh_hon"],
    "tre_em": ["duong_doi"],
    "su_nghiep": ["su_menh", "duong_doi"],
    "tai_chinh": ["su_menh", "duong_doi"],
    "hoc_tap": ["duong_doi", "su_menh"],
    "suc_khoe": ["linh_hon", "duong_doi"],
    "ban_be_xa_hoi": ["nhan_cach", "linh_hon"],
    "cuoc_song": ["duong_doi", "linh_hon"],
}
KB_LV = {"ban_than": "ban_than", "tinh_yeu": "tinh_yeu", "gia_dinh": "gia_dinh",
         "con_cai": "con_cai", "su_nghiep": "su_nghiep", "tai_chinh": "tai_chinh",
         "hoc_tap": "hoc_tap", "suc_khoe": "suc_khoe", "ban_be_xa_hoi": "ban_be_xa_hoi",
         "cuoc_song": "cuoc_song", "nguoi_khac": "ban_than", "ten_goi": "ban_than",
         "tam_linh": "ban_than", "thoi_van": "ban_than", "hop_doi": "tinh_yeu"}
TEN_VI_TRI = {"duong_doi": "số chủ đạo (đường đời)", "su_menh": "số sứ mệnh",
              "linh_hon": "số linh hồn", "nhan_cach": "số nhân cách"}
LUU_Y_THEO_LV = {"tai_chinh": "tai_chinh", "suc_khoe": "suc_khoe", "tam_linh": "tam_linh",
                 "ten_goi": "ten_goi", "con_cai": "con_cai"}


# --------------------------------------------------------------------------- #
# Trích số / ngày trong câu
# --------------------------------------------------------------------------- #
_SO = r"(11|22|33|[1-9])"


def _trich_ngay(t: str) -> list[tuple[int, int, int]]:
    out = []
    for d, m, y in re.findall(r"(?<!\d)(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})(?!\d)", t):
        try:
            _dt.date(int(y), int(m), int(d))
            out.append((int(d), int(m), int(y)))
        except ValueError:
            pass
    return out


def _trich_so(t: str) -> tuple[dict[str, int], tuple[int, int] | None]:
    so: dict[str, int] = {}
    cap = None
    m = re.search(rf"so (chu dao )?{_SO} va (so )?{_SO}(?!\d)", t)
    if m:
        cap = (int(m.group(2)), int(m.group(4)))
    m2 = re.search(rf"(chong|vo|toi|anh|em|ban trai|ban gai) (so chu dao |so ){_SO}.*"
                   rf"(chong|vo|toi|anh|em|co ay|anh ay) (so chu dao |so ){_SO}", t)
    if not cap and m2:
        cap = (int(m2.group(3)), int(m2.group(6)))
    m3 = re.search(rf"(linh hon|nhan cach|su menh) (so )?{_SO} va (linh hon |nhan cach |su menh )?(so )?{_SO}", t)
    if not cap and m3:
        cap = (int(m3.group(3)), int(m3.group(6)))
    for vt, mau in (("nam_ca_nhan", rf"nam ca nhan (so )?([1-9])"),
                    ("thang_ca_nhan", rf"thang ca nhan (so )?([1-9])"),
                    ("ngay_ca_nhan", rf"ngay ca nhan (so )?([1-9])"),
                    ("linh_hon", rf"linh hon (so )?{_SO}(?! va)"),
                    ("nhan_cach", rf"(chi so )?nhan cach (so )?{_SO}"),
                    ("su_menh", rf"su menh (so )?{_SO}(?! va)"),
                    ("duong_doi", rf"(so chu dao|duong doi|chu dao) (so )?{_SO}(?! va)(?!\d)")):
        mm = re.search(mau, t)
        if mm and not cap:
            so[vt] = int(mm.groups()[-1])
    mm = re.search(r"sinh ngay (\d{1,2})(?![/\d])", t)
    if mm and 1 <= int(mm.group(1)) <= 31:
        so["ngay_sinh"] = int(mm.group(1))
    mm = re.search(r"ngay sinh (\d{1,2})(?![/\d])", t)
    if mm and 1 <= int(mm.group(1)) <= 31:
        so["ngay_sinh"] = int(mm.group(1))
    return so, cap


# --------------------------------------------------------------------------- #
# Phân loại
# --------------------------------------------------------------------------- #
def _giai_thich_khop(t: str) -> list[str]:
    return [ma for ma, m in kb.muc_giai_thich().items()
            if any(tk in t for tk in m["tu_khoa"])]


GIOI_THIEU = (r"^(em|minh|toi|anh|chi|chau) (la|nam nay|\d+ tuoi|hoc lop|dang|vua|lam|ban hang|"
              r"sinh vien|moi di lam)")


def _tach_gioi_thieu(cau_hoi: str) -> tuple[str, str]:
    """'Em học lớp 12, tôi hợp nghề gì?' → ('em hoc lop 12', 'toi hop nghe gi')."""
    if "," in cau_hoi:
        dau, sau = cau_hoi.split(",", 1)
        if re.search(GIOI_THIEU, chuan_hoa(dau)) and chuan_hoa(sau):
            return chuan_hoa(dau), chuan_hoa(sau)
    return "", chuan_hoa(cau_hoi)


def phan_loai(cau_hoi: str) -> dict:
    gioi_thieu, t_chinh = _tach_gioi_thieu(cau_hoi)
    t = chuan_hoa(cau_hoi)
    ngay = _trich_ngay(t)
    so_nhac, cap = _trich_so(t)
    kq = {"cau_chuan_hoa": t, "gioi_thieu": gioi_thieu, "ngay_nhac": ngay, "so_nhac": so_nhac, "cap_nhac": cap,
          "giai_thich": [], "tu_choi": None}

    def xong(lv, dt, xl, yd):
        kq.update(linh_vuc=lv, doi_tuong=dt, xu_ly=xl, y_dinh=yd)
        return kq

    if _co(t, AN_TOAN):
        return xong("khung_hoang", "ban_than", "an_toan", "loi_khuyen")
    for loai, mau in TU_CHOI.items():
        if _co(t, mau):
            kq["tu_choi"] = loai
            lv = {"suc_khoe_the_chat": "suc_khoe"}.get(loai, "ngoai_pham_vi")
            dt = "nguoi_khac" if loai == "tuyen_dung" else "ban_than"
            return xong(lv, dt, "tu_choi_nhe", "du_doan")

    gt = _giai_thich_khop(t)
    kq["giai_thich"] = gt
    if gt and not _co(t, [r"toi co", r"cua toi", r"toi la", r"ten toi", r"em co"]):
        return xong("ky_thuat", "ban_than", "tra_loi", "giai_thich")

    thoi_diem = _co(t_chinh, THOI_DIEM)
    chon_thoi_diem = _co(t_chinh, CHON_THOI_DIEM)
    y_dinh = ("thoi_diem" if thoi_diem else
              "quyet_dinh" if _co(t, [r"co nen", r"nen .* hay", r"nen chon", r"nen hoc", r"nen lam gi"]) else
              "loi_khuyen" if _co(t, [r"lam sao", r"phai lam sao", r"nen lam gi", r"lam gi de"]) else
              "mo_ta")

    # Hai người
    hai_nguoi = (cap is not None or len(ngay) >= 2
                 or re.search(r"toi va (ban trai|ban gai|nguoi yeu|chong|vo|anh ay|co ay|ny|crush|nguoi ay|"
                              r"doi tac|ban than|dong nghiep|me|bo|con)[^?]*(co nen|xem|hop|cuoi|di den)|"
                              r"hai vo chong|so hai vo chong|chung toi yeu nhau|vo chong cung so", t)
                 or re.search(r"hai nguoi cung so|hop lam an chung", t)
                 or re.search(r"(hop|khac) (voi |nhau|hay khac|khong)|co hop|xem do hop|duyen no|xung khac|"
                              r"di den cuoi|hop tinh|song voi nhau|hieu nhau hon|choi voi nhau", t)
                 and re.search(r"(?<!\w)" + LIEN_QUAN_NGUOI + r"(?!\w)|toi va|va (anh|co|ban|nguoi)", t)
                 # "hợp làm sếp", "hợp với nghề gì": hỏi độ hợp NGHỀ của chính mình, không phải hai người
                 and not re.search(r"hop (lam|voi nghe|nghe|voi cong viec|voi viec|voi nganh|voi moi truong|"
                                   r"voi vi tri|voi vai tro|voi kieu)", t))
    # "Làm sao để hoà hợp với mẹ chồng" là xin cách sống chung (gia đình), không phải so cặp số.
    if hai_nguoi and cap is None and len(ngay) < 2 and re.search(r"lam sao de hoa hop voi", t):
        hai_nguoi = False
    con = _co(t, CON)
    if hai_nguoi and not (con and not re.search(r"toi va con|con toi va|hai dua", t)
                          and not re.search(r"hop (voi |nhau)|hop khong", t)):
        return xong("hop_doi", "hai_nguoi", "tra_loi", "hop_nhau")

    if con and (_co(t, CON_DAC_DIEM) or ngay) and not _co(t, [r"lam sao de toi", r"toi co nen",
                                                               r"toi la kieu", r"toi nen"]):
        return xong("con_cai", "con", "tra_loi_kem_luu_y" if _co(t, [r"dat ten", r"ten", r"sinh con",
                                                                    r"nam nao", r"ngay nao"]) else "tra_loi",
                    y_dinh)

    # "Sếp tôi số chủ đạo 8…", "Mẹ tôi số 6…": hỏi về NGƯỜI KHÁC có con số cụ thể.
    if so_nhac and re.search(r"(sep|me|bo|anh trai|chi gai|em trai|em gai|ban than|dong nghiep) (toi|minh) so", t):
        return xong("nguoi_khac", "nguoi_khac", "tra_loi", "mo_ta")
    if (_co(t, NGUOI_KHAC) or (ngay and not re.search(r"toi sinh|em sinh|minh sinh", t))) \
            and not _co(t, KHONG_PHAI_NGUOI_KHAC):
        return xong("nguoi_khac", "nguoi_khac", "tra_loi", "mo_ta")

    if chon_thoi_diem:
        return xong("thoi_van", "ban_than", "tra_loi_kem_luu_y", "thoi_diem")

    diem = {lv: _dem(t_chinh, kw) for lv, kw in LINH_VUC_KW.items()}
    # Phần giới thiệu ("Mình bán hàng online, …", "Em là mẹ bỉm hai con, …") chỉ là bối cảnh: lĩnh vực lấy theo
    # CÂU HỎI CHÍNH. Trước đây câu chính không có từ khoá thì lấy từ khoá ở phần giới thiệu → "năm nay của tôi thế
    # nào" bị đẩy sang sự nghiệp. Chỉ còn lấy theo giới thiệu khi câu chính là đuôi ngắn, không tự mang nghĩa
    # ("Tôi là con cả, có phải gánh vác hết không?") và không hỏi thời điểm.
    if max(diem.values()) == 0 and gioi_thieu and not thoi_diem and len(t_chinh.split()) <= 6:
        diem = {lv: _dem(t, kw) for lv, kw in LINH_VUC_KW.items()}
    # Ưu tiên chủ đề hẹp hơn "bản thân" khi hoà điểm
    thu_tu = ["tam_linh", "ten_goi", "tai_chinh", "suc_khoe", "hoc_tap", "con_cai", "gia_dinh",
              "ban_be_xa_hoi", "cuoc_song", "su_nghiep", "tinh_yeu", "ban_than"]
    tot = max(diem.values())
    if tot == 0:
        lv = "thoi_van" if thoi_diem else "ban_than"
    else:
        lv = next(l for l in thu_tu if diem[l] == tot)
        if lv == "ban_than" and thoi_diem and diem["ban_than"] <= 1 and not so_nhac.get("duong_doi"):
            lv = "thoi_van"
    if so_nhac.keys() & {"nam_ca_nhan", "thang_ca_nhan", "ngay_ca_nhan"} and tot <= 1 \
            and not _co(t, [r"doi viec"]):
        lv = "thoi_van"

    kem = (lv in LUU_Y_THEO_LV or (y_dinh in ("quyet_dinh", "thoi_diem") and lv not in ("thoi_van", "hoc_tap")))
    return xong(lv, "ban_than", "tra_loi_kem_luu_y" if kem else "tra_loi", y_dinh)


# --------------------------------------------------------------------------- #
# Gói bằng chứng
# --------------------------------------------------------------------------- #
def _chi_so_nguoi(nguoi: dict, ngay_xem: _dt.date) -> dict:
    """Mọi chỉ số của một người. `ho_ten` có thể thiếu (chỉ có ngày sinh)."""
    d, m, y = nguoi["ngay"], nguoi["thang"], nguoi["nam"]
    ten = (nguoi.get("ho_ten") or [None])[0]
    qu = nguoi.get("quy_uoc") or "tong_het"          # TS-V3: cách cộng Đường đời người dùng chọn
    cs: dict = {"duong_doi": thanso.duong_doi(d, m, y, qu)}
    if ten:
        cs.update({k: v for k, v in thanso.chi_so_xac_dinh(ten, d, m, y).items() if k != "duong_doi"})
    cs.update(mr.chi_so_mo_rong(ten, d, m, y, ngay_xem.year, ngay_xem.month, ngay_xem.day, qu))
    cs["dinh_cao"] = thanso.dinh_cao(d, m, y, cs["duong_doi"])
    cs["thu_thach_chinh"] = thanso.thu_thach(d, m, y)["thu_thach_chinh"]
    cs["tuoi"] = ngay_xem.year - y - ((ngay_xem.month, ngay_xem.day) < (m, d))
    return cs


def _muc_lv(so: int, lv: str, vi_tri: str | None, vai: str) -> dict | None:
    n = kb.nghia_linh_vuc(so, lv)
    if not n:
        return None
    return {"loai": "linh_vuc", "vai": vai, "vi_tri": vi_tri, "so": so, "linh_vuc": lv,
            "ten_linh_vuc": kb.ten_linh_vuc(lv), **n}


def _them_linh_vuc(muc: list, cs: dict, lv: str, vai: str, chi_vi_tri: list[str] | None = None):
    da_co: set[int] = set()
    for vt in chi_vi_tri or VI_TRI_THEO_LV.get(lv, ["duong_doi"]):
        so = cs.get(vt)
        if so is None or so in da_co:
            continue
        da_co.add(so)
        m = _muc_lv(so, lv, vt, vai)
        if m:
            muc.append(m)


# TS-SAU: câu hỏi về bản thân / tình cảm / công việc → thêm một mục từ kho chân dung (theo số chủ đạo).
CD_LV = {"ban_than": "tong_quan", "tinh_yeu": "tinh_cam", "su_nghiep": "cong_viec", "tai_chinh": "cong_viec"}


def _muc_cd(so: int, mat: str, vai: str) -> dict | None:
    cd = kb.chan_dung(so)
    if not cd:
        return None
    return {"loai": "chan_dung", "mat": mat, "so": so, "vai": vai, **cd[mat],
            **{k: cd[k] for k in ("source_id", "school_id", "trang_thai")}}


def _meta_depth() -> dict:
    return {"source_id": "balliett_jordan", "school_id": "pythagoras_vn", "trang_thai": "da_duyet",
            "nguon": store.trich_nguon_depth()}


def _them_thoi_diem(muc: list, cs: dict, t: str, ngay_xem: _dt.date, nguoi: dict):
    d, m = nguoi["ngay"], nguoi["thang"]
    cac_nam = [ngay_xem.year]
    if re.search(r"nam sau|nam toi|ba nam toi", t):
        cac_nam.append(ngay_xem.year + 1)
    if re.search(r"ba nam toi", t):
        cac_nam.append(ngay_xem.year + 2)
    for y in re.findall(r"nam (20\d\d)", t):
        cac_nam = [int(y)]
    so_nhac = re.search(r"nam ca nhan (so )?([1-9])", t)
    for nam in dict.fromkeys(cac_nam):
        so = int(so_nhac.group(2)) if so_nhac else int(thanso.nam_ca_nhan(d, m, nam, "duong_lich"))
        n = store.nghia_nam_ca_nhan(so)
        if n:
            muc.append({"loai": "nam_ca_nhan", "nam": None if so_nhac else nam, "so": so, **n,
                        **_meta_depth()})
    # "tháng sau / tháng tới" và "ngày 15 tháng sau", "ngày 3/11" → mốc xem đúng ngày được hỏi
    thang_xem = _dt.date(ngay_xem.year + (ngay_xem.month == 12), ngay_xem.month % 12 + 1, 1) \
        if re.search(r"thang (sau|toi)", t) else ngay_xem
    ngay_hoi = None
    mn = re.search(r"ngay (\d{1,2})(?:(?: thang |/)(\d{1,2}|sau|toi|nay))?(?!\d)", t)
    if mn and not re.search(r"ngay ca nhan", t):
        th = mn.group(2)
        goc = thang_xem if th in ("sau", "toi") else ngay_xem
        thang = int(th) if th and th.isdigit() else goc.month
        nam_h = goc.year + (1 if th and th.isdigit() and int(th) < ngay_xem.month else 0)
        try:
            ngay_hoi = _dt.date(nam_h, thang, int(mn.group(1)))
        except ValueError:
            ngay_hoi = None
    if ngay_hoi:
        thang_xem = ngay_hoi
    if re.search(r"thang|tuan", t):
        mm = re.search(r"thang ca nhan (so )?([1-9])", t)
        so = int(mm.group(2)) if mm else mr.thang_ca_nhan(d, m, thang_xem.year, thang_xem.month)
        n = kb.nghia_phu("thang_ca_nhan", so)
        if n:
            muc.append({"loai": "thang_ca_nhan", "thang": None if mm else thang_xem.month, "so": so,
                        **n, **kb.meta_phu()})
    if ngay_hoi or re.search(r"hom nay|ngay mai|ngay nao|ngay ca nhan|tuan nay", t):
        mm = re.search(r"ngay ca nhan (so )?([1-9])", t)
        ngay = ngay_hoi or (ngay_xem + _dt.timedelta(days=1) if "ngay mai" in t else ngay_xem)
        so = int(mm.group(2)) if mm else mr.ngay_ca_nhan(d, m, ngay.year, ngay.month, ngay.day)
        n = kb.nghia_phu("ngay_ca_nhan", so)
        if n:
            muc.append({"loai": "ngay_ca_nhan", "ngay": None if mm else ngay.isoformat(), "so": so,
                        "y_nghia": n, **kb.meta_phu()})


def _them_dinh_cao(muc: list, cs: dict, t: str):
    tuoi = cs["tuoi"]
    hien = next((p for p in cs["dinh_cao"]
                 if p["tu_tuoi"] <= tuoi and (p["den_tuoi"] is None or tuoi <= p["den_tuoi"])),
                cs["dinh_cao"][-1])
    cac = cs["dinh_cao"] if re.search(r"tuoi nao|dinh cao cuoc doi|kim tu thap|ve gia|tuoi \d\d|"
                                      r"giai doan nao|bao gio", t) else [hien]
    for p in cac:
        n = store.nghia_dinh_cao(p["so"])
        if n:
            muc.append({"loai": "dinh_cao", "dinh": p["dinh"], "so": p["so"], "tu_tuoi": p["tu_tuoi"],
                        "den_tuoi": p["den_tuoi"], "hien_tai": p is hien, **n, **_meta_depth()})
    if "thu thach" in t:
        n = store.nghia_thu_thach(cs["thu_thach_chinh"])
        if n:
            muc.append({"loai": "thu_thach", "so": cs["thu_thach_chinh"], **n, **_meta_depth()})


def _them_bieu_do(muc: list, cs: dict, t: str):
    bd = cs["bieu_do"]
    for mt in bd["mui_ten_du"]:
        n = kb.nghia_mui_ten(mt["ma"], trong=False)
        if n:
            muc.append({"loai": "mui_ten", "ma": mt["ma"], "trong": False, **n})
    for mt in bd["mui_ten_trong"]:
        n = kb.nghia_mui_ten(mt["ma"], trong=True)
        if n:
            muc.append({"loai": "mui_ten", "ma": mt["ma"], "trong": True, **n})
    hoi_so = [int(x) for x in re.findall(r"so ([1-9])(?!\d)", t)]
    for so in (hoi_so or bd["so_thieu"][:3]):
        n = kb.nghia_o_so(so)
        if not n:
            continue
        dem = bd["dem"].get(so, 0)
        muc_do = {0: "thieu", 1: "mot", 2: "hai"}.get(dem, "ba_tro_len")
        muc.append({"loai": "o_so", "so": so, "so_lan": dem, "y_nghia_o": n["y_nghia"],
                    "mo_ta": n[muc_do], **{k: n[k] for k in ("source_id", "school_id", "trang_thai", "nguon")}})


def _them_nghiep(muc: list, cs: dict, t: str, so_nhac: dict):
    if "ngay_sinh" in so_nhac:
        no = [{"vi_tri": "ngay_sinh", "so": n} for n in mr.chuoi_rut_gon(so_nhac["ngay_sinh"])
              if n in mr.NO_NGHIEP][:1]
    else:
        no = cs["no_nghiep"]
    for nn in no:
        n = kb.nghia_phu("no_nghiep", nn["so"])
        if n:
            muc.append({"loai": "no_nghiep", "vi_tri": nn["vi_tri"], "so": nn["so"], **n, **kb.meta_phu()})
    so_hoi = [int(x) for x in re.findall(r"no nghiep (1[3469])", t)]
    for s in so_hoi:
        if not any(m.get("loai") == "no_nghiep" and m["so"] == s for m in muc):
            n = kb.nghia_phu("no_nghiep", s)
            if n:
                muc.append({"loai": "no_nghiep", "vi_tri": None, "so": s, **n, **kb.meta_phu()})
    if not no and not so_hoi:
        muc.append({"loai": "khong_no_nghiep", "noi_dung": "Theo cách tính ở đây, ngày sinh và tên của "
                    "bạn không có nợ nghiệp (13, 14, 16, 19).", **kb.meta_phu()})
    for s in cs.get("bai_hoc_nghiep", [])[:3]:
        n = kb.nghia_phu("bai_hoc_nghiep", s)
        if n:
            muc.append({"loai": "bai_hoc_nghiep", "so": s, "noi_dung": n, **kb.meta_phu()})


def _them_phu(muc: list, cs: dict, t: str, lv: str, so_nhac: dict):
    if "ngay_sinh" in so_nhac or re.search(r"sinh ngay|tai nang|nang khieu|so ngay sinh", t):
        d = so_nhac.get("ngay_sinh")
        n = kb.nghia_phu("ngay_sinh", d) if d else None
        if d and n:
            muc.append({"loai": "ngay_sinh", "ngay": d, "noi_dung": n, **kb.meta_phu()})
    if lv == "su_nghiep" or re.search(r"ve sau|truong thanh|ve gia", t):
        so = cs.get("so_truong_thanh")
        n = kb.nghia_phu("truong_thanh", so) if so else None
        if n:
            muc.append({"loai": "truong_thanh", "so": so, "noi_dung": n, **kb.meta_phu()})
    if re.search(r"nguoi khac nhin|nguoi ngoai nhin|an tuong|thai do|kho gan|hieu lam", t):
        so = cs.get("so_thai_do")
        n = kb.nghia_phu("thai_do", so) if so else None
        if n:
            muc.append({"loai": "thai_do", "so": so, "noi_dung": n, **kb.meta_phu()})


def goi_bang_chung(pl: dict, nguoi: dict, nguoi_kia: dict | None, ngay_xem: _dt.date) -> dict:
    """Dựng gói bằng chứng từ phân loại + chỉ số + KB. Chỉ chứa nội dung có nguồn."""
    t, lv, dt_, xl = pl["cau_chuan_hoa"], pl["linh_vuc"], pl["doi_tuong"], pl["xu_ly"]
    goi: dict = {"phan_loai": {k: pl[k] for k in ("linh_vuc", "y_dinh", "doi_tuong", "xu_ly")},
                 "muc": [], "can_them": [], "mau": None, "luu_y": None, "so_trong_goi": []}
    if xl == "an_toan":
        goi["mau"] = kb.mau("an_toan")
        return goi
    if xl == "tu_choi_nhe":
        goi["mau"] = kb.mau(pl["tu_choi"] or "du_doan_cu_the")
        return goi

    muc = goi["muc"]
    for ma in pl["giai_thich"][:2]:
        g = kb.giai_thich(ma)
        if g:
            muc.append({"loai": "giai_thich", "ma": ma, **g})
    if lv == "ky_thuat":
        return _ket(goi)

    so_nhac = dict(pl["so_nhac"])
    cs_ban = _chi_so_nguoi(nguoi, ngay_xem)

    # --- Hai người
    if lv == "hop_doi":
        a = b = None
        if pl["cap_nhac"]:
            a, b = ({"duong_doi": pl["cap_nhac"][0]}, {"duong_doi": pl["cap_nhac"][1]})
            if re.search(r"linh hon", t):
                a, b = {"linh_hon": pl["cap_nhac"][0]}, {"linh_hon": pl["cap_nhac"][1]}
        elif len(pl["ngay_nhac"]) >= 2:
            (d1, m1, y1), (d2, m2, y2) = pl["ngay_nhac"][:2]
            a = _chi_so_nguoi({"ngay": d1, "thang": m1, "nam": y1}, ngay_xem)
            b = _chi_so_nguoi({"ngay": d2, "thang": m2, "nam": y2}, ngay_xem)
        elif nguoi_kia or pl["ngay_nhac"]:
            a = cs_ban
            if nguoi_kia:
                b = _chi_so_nguoi(nguoi_kia, ngay_xem)
            else:
                d, m, y = pl["ngay_nhac"][0]
                b = _chi_so_nguoi({"ngay": d, "thang": m, "nam": y}, ngay_xem)
        if a is None:
            goi["can_them"] = ["nguoi_kia"]
            goi["mau"] = kb.mau("can_nguoi_kia")
            return goi
        ten_vt = {"duong_doi": "số chủ đạo", "linh_hon": "số linh hồn", "nhan_cach": "số nhân cách"}
        for vt, cap in mr.hop_doi(a, b).items():
            if vt not in ten_vt:
                continue
            n = kb.nghia_cap(cap)
            if n:
                muc.append({"loai": "cap_so", "vi_tri": vt, "ten_vi_tri": ten_vt[vt], "cap": cap,
                            "so_a": a[vt], "so_b": b[vt], **n})
        ngu_canh = ("su_nghiep" if re.search(r"doi tac|lam an|sep|dong nghiep|lam kinh doanh", t)
                    else "ban_be_xa_hoi" if re.search(r"ban than|ban be|hai nguoi ban", t)
                    else "gia_dinh" if re.search(r"(?<!\w)(me|bo|anh em|con gai|con trai)(?!\w)", t)
                    else "tinh_yeu")
        gia_dinh_so = bool(pl["cap_nhac"])          # hai con số tự nêu, không phải số của người hỏi
        cap_vai = (("so_a", a), ("so_b", b)) if gia_dinh_so else (("ban", a), ("nguoi_kia", b))
        for vai, cs in cap_vai:
            if "duong_doi" in cs:
                m = _muc_lv(cs["duong_doi"], ngu_canh, "duong_doi", vai)
                if m:
                    muc.append(m)
        # TS-SAU: góc "trong vai" theo loại quan hệ (người yêu / bạn / đồng nghiệp / sếp / gia đình)
        qh = ("sep" if re.search(r"(?<!\w)sep(?!\w)|cap tren", t) else
              {"su_nghiep": "dong_nghiep", "ban_be_xa_hoi": "ban_be", "gia_dinh": "gia_dinh"}.get(ngu_canh, "nguoi_yeu"))
        # Lời "trong vai" viết cho người ĐỐI DIỆN đọc → chỉ áp cho người kia; hai số giả định thì cả hai.
        for vai, cs in cap_vai if gia_dinh_so else cap_vai[1:]:
            if "duong_doi" in cs:
                v = kb.nguoi_trong_vai(cs["duong_doi"], qh)
                if v:
                    muc.append({"loai": "trong_vai", "vai": vai, "so": cs["duong_doi"], "quan_he": qh,
                                "ten_quan_he": kb.quan_he(qh)["ten"], "vai_mo_ta": v["vai"],
                                **{k: v[k] for k in ("can", "tranh", "cach_noi")}, **kb.meta_quan_he()})
        return _ket(goi)

    # --- Người khác / con
    cs = cs_ban
    vai = "ban"
    if dt_ in ("nguoi_khac", "con"):
        vai = "nguoi_kia" if dt_ == "nguoi_khac" else "con"
        if nguoi_kia:
            cs = _chi_so_nguoi(nguoi_kia, ngay_xem)
        elif pl["ngay_nhac"]:
            d, m, y = pl["ngay_nhac"][0]
            cs = _chi_so_nguoi({"ngay": d, "thang": m, "nam": y}, ngay_xem)
        elif so_nhac:
            cs = {}
        elif re.search(r"dat ten|ten con|sinh con|nam nao|ngay nao|ngay mo|ten dem|hai ten", t):
            cs = None          # câu về đặt tên / chọn ngày sinh: không cần dữ liệu người kia
        else:
            goi["can_them"] = ["nguoi_kia"]
            goi["mau"] = kb.mau("can_nguoi_kia")
            return goi

    # Số người hỏi tự nêu trong câu → dùng số đó, không dùng số của họ.
    vi_tri_nhac = [vt for vt in ("duong_doi", "su_menh", "linh_hon", "nhan_cach") if vt in so_nhac]
    if vi_tri_nhac:
        cs = {**(cs or {}), **{vt: so_nhac[vt] for vt in vi_tri_nhac}}

    kb_lv = "tre_em" if dt_ == "con" and cs is not None else KB_LV.get(lv, "ban_than")
    if lv == "con_cai" and dt_ == "con" and cs is None:
        kb_lv = "con_cai"
        cs = cs_ban
    if cs:
        _them_linh_vuc(muc, cs, kb_lv, vai, vi_tri_nhac or None)
        if kb_lv in CD_LV and cs.get("duong_doi") and pl["y_dinh"] != "thoi_diem":
            m_cd = _muc_cd(cs["duong_doi"], CD_LV[kb_lv], vai)
            if m_cd:
                muc.insert(min(1, len(muc)), m_cd)

    if cs and "duong_doi" in cs and "bieu_do" in cs:
        if pl["y_dinh"] == "thoi_diem" or lv == "thoi_van" or \
                so_nhac.keys() & {"nam_ca_nhan", "thang_ca_nhan", "ngay_ca_nhan"}:
            nguoi_tinh = nguoi if vai == "ban" else (nguoi_kia or {"ngay": pl["ngay_nhac"][0][0],
                                                                 "thang": pl["ngay_nhac"][0][1]})
            _them_thoi_diem(muc, cs, t, ngay_xem, nguoi_tinh)
            if lv == "thoi_van":
                _them_dinh_cao(muc, cs, t)
        if re.search(r"bieu do|mui ten|so thieu|thieu so|khong co so|nhieu so|so lap|hoc kem|"
                     r"cach hoc|tri hoan|quyet tam", t) or lv == "hoc_tap":
            _them_bieu_do(muc, cs, t)
        if lv == "tam_linh" or re.search(r"no nghiep|bai hoc nghiep", t):
            _them_nghiep(muc, cs, t, so_nhac)
        _them_phu(muc, cs, t, lv, so_nhac)
    elif so_nhac.keys() & {"nam_ca_nhan", "thang_ca_nhan", "ngay_ca_nhan", "ngay_sinh"}:
        _them_thoi_diem(muc, {}, t, ngay_xem, nguoi)
        if "ngay_sinh" in so_nhac:
            _them_phu(muc, {}, t, lv, so_nhac)
            if re.search(r"no nghiep", t):
                _them_nghiep(muc, {"no_nghiep": [], "bai_hoc_nghiep": []}, t, so_nhac)

    if lv == "ten_goi":
        for ma in ("dau_tieng_viet",):
            g = kb.giai_thich(ma)
            if g and not any(m.get("ma") == ma for m in muc):
                muc.append({"loai": "giai_thich", "ma": ma, **g})
        for s in cs_ban.get("bai_hoc_nghiep", [])[:3]:
            n = kb.nghia_phu("bai_hoc_nghiep", s)
            if n:
                muc.append({"loai": "bai_hoc_nghiep", "so": s, "noi_dung": n, **kb.meta_phu()})
    if re.search(r"(?<!\d)(11|22|33)(?!\d)", t) and lv in ("tam_linh", "ban_than"):
        g = kb.giai_thich("so_cai")
        if g:
            muc.append({"loai": "giai_thich", "ma": "so_cai", **g})

    # Câu hỏi có trọng tâm kỹ thuật → khối đó lên đầu, chỉ giữ 1 đoạn tính cách chung.
    trong_tam = (re.search(r"bieu do|mui ten|so thieu|thieu so|khong co so|nhieu so|so lap", t)
                 or re.search(r"no nghiep|bai hoc nghiep", t) or lv == "thoi_van")
    if trong_tam and any(m["loai"] not in ("linh_vuc", "chan_dung") for m in muc):
        khac = [m for m in muc if m["loai"] not in ("linh_vuc", "chan_dung")]
        lv_muc = [m for m in muc if m["loai"] == "linh_vuc"]
        muc[:] = khac + lv_muc[:1]

    ma_luu_y = (LUU_Y_THEO_LV.get(lv) or ("thoi_diem" if pl["y_dinh"] == "thoi_diem" else None)
                or ("quyet_dinh" if pl["y_dinh"] == "quyet_dinh" else None))
    if dt_ == "con":
        ma_luu_y = "con_cai"
    goi["luu_y"] = kb.luu_y(ma_luu_y) if ma_luu_y else None
    return _ket(goi)


def _so_trong(x) -> set[int]:
    if isinstance(x, bool):
        return set()
    if isinstance(x, int):
        return {x}
    if isinstance(x, str):
        return {int(n) for n in re.findall(r"\d+", x)}
    if isinstance(x, dict):
        return set().union(*(_so_trong(v) for v in x.values())) if x else set()
    if isinstance(x, (list, tuple)):
        return set().union(*(_so_trong(v) for v in x)) if x else set()
    return set()


def _ket(goi: dict) -> dict:
    goi["so_trong_goi"] = sorted(_so_trong(goi["muc"]) | _so_trong(goi.get("mau")) |
                                 _so_trong(goi.get("luu_y")))
    return goi


def kha_nang() -> dict:
    """Cho scripts/danh_gia_thanso.py --kha-nang v2 (không dùng nữa: v2 chấm bằng chạy thật)."""
    return {}
