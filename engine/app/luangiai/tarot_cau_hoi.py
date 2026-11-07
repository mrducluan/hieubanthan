# -*- coding: utf-8 -*-
"""TR-2 — RULES: hiểu câu hỏi Tarot (tất định, không LLM). Câu người dùng gõ → ý định + lĩnh vực + việc đang hỏi + hai lựa
chọn (nếu có) + trải bài hợp. Câu hỏi KHÔNG lưu, không trả lại nguyên văn: chỉ trả mã + nhãn từ danh mục cố định (nhãn việc
lấy từ `VIEC`, nhãn hai lựa chọn chỉ lấy khi khớp danh mục `LUA_CHON_NHAN`, không chép chữ người dùng).

Ý định (thứ tự ưu tiên khi một câu khớp nhiều mẫu):
  nguoi_khac  hỏi về lòng / ý người khác ("anh ấy có yêu tôi không")  → bài đọc chuyển về điều chính mình làm được
  lua_chon    hai đường ("ở lại hay chuyển", "A hay B")
  thoi_diem   khi nào / bao giờ / bao lâu
  cach_lam    làm sao để / nên làm gì
  ly_do       vì sao / tại sao
  quyet_dinh  có nên … không
  ket_qua     … có thành / có được / ra sao
  hieu_minh   hỏi về chính mình (điểm mạnh, đang cần gì)
  tong_quat   không có câu hỏi / không nhận ra
"""
from __future__ import annotations

import re

from app.kb import tarot_kb as kb

Y_DINH = ("nguoi_khac", "lua_chon", "thoi_diem", "cach_lam", "ly_do", "quyet_dinh", "ket_qua", "hieu_minh", "tong_quat")

# Người thứ ba hay đứng đầu câu hỏi về lòng / ý người khác.
_NGUOI = (r"(nguoi (yeu )?cu|nguoi yeu|ny( cu)?|crush|anh ay|co ay|cau ay|ban ay|em ay|nguoi ay|nguoi kia|nguoi do|"
          r"nguoi (minh|toi|em) (dang )?(thich|yeu|tim hieu|quen)|chong( (toi|em|minh|tui))?|vo( (toi|em|minh|tui))?|sep|dong nghiep|"
          r"doi tac|khach hang|nha tuyen dung|ban than|ban (trai|gai)|me( (toi|em|minh|chong))?|bo( (toi|em|minh))?|bo me( (toi|em|minh|chong))?|"
          r"chu nha|nguoi mua|nguoi ban|gia dinh (anh|co|nguoi) ay|ben kia|hang xom)")
_TOI = r"(toi|minh|em|mik|tui|tao)"
# Mẫu theo ý định — chạy trên câu ĐÃ bỏ dấu, thường hoá, bọc khoảng trắng (`chuan_hoa_cau`).
_MAU: dict[str, list[str]] = {
    "thoi_diem": [
        r"\b(khi nao|bao gio|luc nao|chung nao|thang nao|nam nao|tuan nao|ngay nao|bao lau( nua)?|den bao gio|thoi diem nao|thoi gian nao|som nhat la)\b",
        r"\bmay (thang|nam|tuan|ngay) nua\b", r"\bbao nhieu (thang|nam|lau)\b",
    ],
    "ly_do": [r"\b(vi sao|tai sao|ly do gi|ly do nao|nguyen nhan)\b", rf"^ (sao|lam sao ma) {_TOI}\b", rf"\bsao {_TOI} (cu|hay|luon|mai|lai|toan)\b"],
    "cach_lam": [
        r"\blam (sao|the nao|cach nao|gi) (de|cho|thi|bay gio|tiep)\b", r"\b(nen|phai|can) lam (gi|sao|the nao)\b", r"\blam the nao\b",
        r"\b(cach nao|bang cach nao)\b", r"\b(nen|can|phai) (chuan bi|cai thien|thay doi) (gi|dieu gi|nhung gi)\b",
        r"\bnen bat dau tu dau\b", r"\bnen .{1,40} (the nao|ra sao|nhu the nao) (cho|de)\b", r"\blam (sao|gi) (de|cho)\b", r"^ (lam sao|lam gi)\b",
    ],
    "nguoi_khac_dau": [rf"^ (lieu |khong biet |cho (minh|em|toi) hoi )?{_NGUOI}( {_TOI}| (anh|co|ban|nguoi|cau) ay)?\b.{{0,30}}? (co|con|dang|se|da|nghi|muon|that su|thuc su|danh gia|thay|cam thay|dinh)\b(?! nen)"],
    "lua_chon": [
        r"\bhay (la )?(?!(khong|ko|k|chua|thoi|cu de|bi|lo|met|cang|ngai|qua|nghi|quen|gian|khoc|so|that bai|om|cam|dau(?! tu))\b)[a-z]+",
        r"\b(chon|nen chon) .{1,40} (hay|hoac|giua)\b", r"\bphuong an (a|1|mot)\b.*\bphuong an (b|2|hai)\b", r"\b(hoac|hoac la) .{2,40}\b(hoac|hay)\b",
    ],
    "quyet_dinh": [
        r"\bco nen\b", r"^ nen\b.*\b(khong|ko|k|chang|hay khong|chua)\b", r"\bco nen .{1,60} (khong|ko)\b", rf"(^ |\b{_TOI} )(co )?nen .{{1,60}} (khong|ko|k|hay khong|chua) ?$",
        r"\bco dung (dan|dung) khong\b", r"\bnen (hay khong|khong)\b", r"\b(da|co phai) (den )?(luc|thoi diem) (de|nen)\b", r"\bdung luc (de|chua)\b",
        rf"\b{_TOI} (co )?nen\b.*\b(khong|ko|k)\b",
    ],
    "nguoi_khac": [
        rf"\b{_NGUOI} (co|con|dang|that su|thuc su|se)? ?(con )?(yeu|thuong|nho|nghi|muon|de y|thich|ghet|gian|lua|phan boi|ngoai tinh|quan tam|that long|chan|hoi han|ghen|giau|noi xau|ung ho|hai long|dong y|nghiem tuc|tra lai|giu loi)\b",
        rf"\b{_NGUOI} nghi (gi|sao|the nao) ve {_TOI}", r"\bco (con )?(yeu|thuong|nho) (toi|em|minh) (khong|ko)",
        r"\btinh cam cua (anh ay|co ay|nguoi ay|nguoi kia|ho|nguoi cu) (danh cho|voi) (toi|em|minh)",
    ],
    "hieu_minh": [
        r"\b(bai hoc|thong diep|loi nhan|nang luong|tai nang|diem manh|diem yeu|diem mu|tiem an|ban chat|ban than toi|con nguoi toi)\b",
        rf"\b{_TOI} (dang |thuc su |that su |nen )?(mac ket|so|can|muon|thieu|luu y|biet|hop voi|la nguoi|buong|vuong|giu)\b.*\b(gi|nao|dau|the nao|ra sao)\b",
        r"\bdieu gi (dang )?(can tro|ngan|cho|doi|giu|keo)\b", r"\bla bai nao (dai dien|noi ve)\b", r"\b(co the|trai tim) .{0,20}muon noi gi\b",
        rf"\bmoi quan he cua {_TOI} voi\b", rf"^ {_TOI} co dang\b", rf"\b{_TOI} la (nguoi|kieu nguoi) (nhu )?(the nao|ra sao|gi)\b",
        rf"\b{_TOI} hop voi (kieu|nghe|cong viec|viec|nguoi) (nao|gi)\b", r"\b(nen|can) (luu y|tranh|biet) (dieu )?(gi|nhung gi)\b",
    ],
    "ket_qua": [
        r"\bco (thanh|thanh cong|duoc|dat|do|qua|on|suon se|thuan loi|tot|ket qua|toi|xong|ra|len|tang|giu duoc|vuot qua|hop|ben|lau dai|vui|loi|lai)\b.*\b(khong|ko|k|chu)\b",
        r"\b(se|lieu) .{1,60} (ra sao|the nao|nhu the nao|co .{1,30} khong)", r"\b(ra sao|the nao|nhu the nao|nhu nao|tien trien|chieu huong|xu huong|di ve dau)\b",
        r"\b(tuong lai|sap toi|thoi gian toi|nam nay|nam toi|thang nay|thang toi|tuan nay|tuan toi|sap den)\b",
        r"\bco (the|kha nang) .{1,60} (khong|ko)\b", r"\b(lieu|co) .{1,50} (khong|ko|k)\s*$",
    ],
}
_MAU["co_nen"] = [r"\bco nen\b"]          # "có nên … không" là câu quyết định của chính mình, kể cả khi nhắc tới người khác
_RX = {k: [re.compile(p) for p in v] for k, v in _MAU.items()}
_THU_TU = ("thoi_diem", "ly_do", "cach_lam", "co_nen", "nguoi_khac_dau", "lua_chon", "quyet_dinh", "nguoi_khac", "hieu_minh", "ket_qua")

# Việc đang hỏi — danh mục cố định (mã, nhãn hiển thị, lĩnh vực, mẫu). Mẫu dài khớp trước.
VIEC: list[tuple[str, str, str, list[str]]] = [
    ("doi_viec", "đổi sang công việc mới", "cong_viec", [r"(doi|chuyen|thay doi|thay) (sang )?(cong viec|viec|cho lam|cong ty|nghe)", r"cong viec moi", r"nhay viec", r"(sang|qua) (cong ty|cho) (moi|khac)", r"tim viec (moi|khac)"]),
    ("nghi_viec", "nghỉ việc hiện tại", "cong_viec", [r"nghi (viec|lam)", r"xin nghi", r"bo (viec|cong ty|nghe)", r"nop don (nghi|thoi viec)", r"thoi viec"]),
    ("nhan_viec", "nhận lời mời làm việc", "cong_viec", [r"(duoc|co duoc) nhan( vao lam)?", r"nhan vao lam", r"(ky|len) chinh thuc", r"qua thu viec", r"nhan (loi moi|offer|viec|cong viec|vi tri)", r"offer", r"loi moi (lam viec|cong viec)"]),
    ("phong_van", "buổi phỏng vấn / ứng tuyển", "cong_viec", [r"phong van", r"ung tuyen", r"nop (ho so|cv|don)", r"xin viec"]),
    ("thang_chuc", "thăng chức, tăng lương", "cong_viec", [r"(len|nhan) (chuc )?(truong phong|truong nhom|quan ly|giam doc|pho phong|leader)", r"nhan chuc", r"thang chuc", r"tang luong", r"len chuc", r"de bat", r"xin tang luong", r"thang tien"]),
    ("khoi_nghiep", "tự kinh doanh / khởi nghiệp", "cong_viec", [r"khoi nghiep", r"(tu )?kinh doanh", r"mo (quan|cua hang|shop|cong ty|tiem|spa|xuong|chi nhanh)", r"lam (chu|rieng|freelance)", r"buon ban", r"ban hang online"]),
    ("hop_tac", "hợp tác với người khác", "cong_viec", [r"hop tac", r"doi tac", r"lam chung", r"gop von", r"chung von", r"hun von"]),
    ("du_an", "dự án đang làm", "cong_viec", [r"du an", r"ke hoach", r"hop dong", r"ky ket", r"deal"]),
    ("hoc_thi", "học, thi cử", "cong_viec", [r"hoc (ke toan|marketing|it|lap trinh|ngoai ngu|tieng|ielts|toeic|van bang)", r"thi (do|dau|dat|truot)", r"ielts|toeic", r"(ky|di|on) thi", r"thi (cu|tot nghiep|dai hoc|cong chuc|bang lai)", r"hoc (lai|them|tiep|thac si|tien si|cao hoc|nghe|lien thong)", r"du hoc", r"chuyen nganh", r"dai hoc", r"hoc bong", r"bang cap"]),
    ("dau_tu", "khoản đầu tư", "tien_bac", [r"dau tu", r"chung khoan", r"co phieu", r"coin", r"crypto", r"\bvang\b", r"bat dong san", r"luot song"]),
    ("vay_no", "vay, nợ", "tien_bac", [r"\bvay\b", r"\bno\b", r"tra no", r"cho (ban|nguoi )?vay", r"muon tien", r"the tin dung"]),
    ("mua_ban", "mua bán tài sản lớn", "tien_bac", [r"mua (nha|xe|dat|can ho|chung cu)", r"ban (nha|xe|dat|can ho)", r"xuong tien", r"chot (mua|ban)"]),
    ("tiet_kiem", "giữ và tiết kiệm tiền", "tien_bac", [r"tiet kiem", r"giu tien", r"chi tieu", r"de danh", r"quy du phong"]),
    ("to_tinh", "ngỏ lời / tỏ tình", "tinh_cam", [r"to tinh", r"ngo loi", r"bay to", r"tan (anh|co|nguoi)", r"(noi|thu nhan) (la )?(thich|yeu)"]),
    ("quay_lai", "quay lại với người cũ", "tinh_cam", [r"quay lai", r"nguoi cu", r"nguoi yeu cu", r"ny cu", r"tai hop", r"lam lanh", r"noi lai"]),
    ("chia_tay", "dừng một mối quan hệ", "tinh_cam", [r"quen (nguoi yeu cu|nguoi cu|ny cu|anh ay|co ay)", r"chia tay", r"dung lai", r"buong (bo|tay)", r"ket thuc (moi quan he|chuyen)", r"roi xa"]),
    ("ket_hon", "tiến tới hôn nhân", "tinh_cam", [r"ket hon", r"\bcuoi\b", r"lay (chong|vo)", r"ve chung nha", r"dam hoi", r"dam ngo"]),
    ("hen_ho", "bắt đầu một mối quan hệ", "tinh_cam", [r"co (ny|nguoi yeu)", r"chu y (den|toi) (minh|toi|em)", r"buoi hen", r"hen gap", r"hen ho", r"tim hieu", r"yeu (ai|nguoi moi|lai)", r"moi quan he moi", r"(gap|tim) (duoc )?(nguoi yeu|nua kia|ai do)", r"doc than", r"\be\b"]),
    ("gia_dinh", "việc trong nhà", "tinh_cam", [r"tha thu", r"em be", r"hon nhan", r"vo chong", r"me chong", r"bo me chong", r"lam dau", r"con dau", r"gia dinh", r"bo me", r"cha me", r"con cai", r"\bcon (toi|em|minh)\b", r"nha chong", r"nha vo", r"anh chi em", r"sinh con", r"co con"]),
    ("chuyen_nha", "chuyển nhà, đổi chỗ ở", "tien_bac", [r"chuyen nha", r"chuyen (den|ve|ra) (o|song)", r"doi cho o", r"thue nha", r"ra o rieng"]),
    ("di_xa", "đi xa, sống ở nơi khác", None, [r"visa", r"du lich", r"chuyen di", r"(di|ra) (da lat|phu quoc|thai|han|nhat|uc|my|canada|chau au)", r"ve que (song|o)", r"di xa", r"(ra|di) nuoc ngoai", r"xuat khau lao dong", r"dinh cu", r"(len|vao|ra) (thanh pho|sai gon|ha noi|tp)", r"ve que"]),
    ("suc_khoe", "nhịp sống và sức khoẻ", "suc_khoe", [r"suc khoe", r"\bmet\b", r"kiet suc", r"burnout", r"giac ngu", r"mat ngu", r"cang thang", r"stress", r"tap (luyen|the duc|gym)", r"an uong", r"nghi ngoi"]),
]
_RX_VIEC = [(ma, nhan, lv, [re.compile(rf"(?<![a-z]){p}(?![a-z])") for p in ps]) for ma, nhan, lv, ps in VIEC]

# Từ khoá lĩnh vực (khi câu không khớp việc nào) — đếm số từ khớp, nhiều nhất thắng; hoà thì lĩnh vực có từ đứng trước.
_LV_TU = {
    "tinh_cam": r"tinh cam|tinh yeu|tinh duyen|yeu|nguoi yeu|ny|crush|vo|chong|ck|vk|hon nhan|cuoi|cau hon|hen ho|buoi hen|nguoi ay|anh ay|co ay|chia tay|"
                r"quay lai|nguoi cu|anh a|anh b|nguoi phu hop|tha thu|ghen|ngoai tinh|me chong|bo me|gia dinh|con cai|em be|sinh con|doc than|ban than|tinh ban|lam dau|nha chong|nha vo",
    "cong_viec": r"cong viec|viec lam|viec moi|co viec|tim viec|di lam|cong ty|sep|dong nghiep|phong ban|truong nhom|truong phong|chuc|nghe|su nghiep|phong van|cv|offer|du an|"
                 r"khach hang|doi tac|kinh doanh|khoi nghiep|startup|freelance|van phong|hoc|ky thi|di thi|thi cu|thi dai hoc|du hoc|bang|nganh|luong|thang tien|nha dau tu|hop dong|ban hang",
    "tien_bac": r"tien|tai chinh|dau tu|chung khoan|co phieu|coin|vang|no|vay|tra no|tiet kiem|mua nha|ban nha|can ho|chung cu|dat|mua xe|xe|ngan hang|"
                r"gui tien|lai|lo|thu nhap|nha|can nha|rao ban|ban duoc|chi tieu|thue nha|tien thue|dat coc|coc|bat dong san|ve que|thanh pho|o rieng|chuyen nha",
    "suc_khoe": r"suc khoe|suc khoe|met|kiet suc|ngu|mat ngu|thuc khuya|cang thang|stress|lo au|tram cam|tam ly|tam trang|an kieng|an chay|an uong|"
                r"thuoc la|ruou|tap|gym|co the|nang luong|the duc|chay bo|de khang|cam|om|kham|bac si|dau dau|dau bung|benh|nghi ngoi|burnout|can nang|giam can",
}
_RX_LV = {k: re.compile(rf"(?<![a-z])({v})(?![a-z])") for k, v in _LV_TU.items()}


def linh_vuc(t: str) -> str | None:
    t = re.sub(r"\b(bai hoc|moi viec|moi thu|co the nao)\b", " ", t)
    tot, diem = None, (0, 0)
    for lv, r in _RX_LV.items():
        ds = [m for m in r.finditer(t)]
        if ds:
            d = (len(ds), -ds[0].start())
            if d > diem:
                tot, diem = lv, d
    return tot


# Hai lựa chọn hay gặp: (mẫu phương án A, mẫu phương án B, nhãn A, nhãn B). Chỉ nhãn trong danh mục mới hiện ra.
LUA_CHON_NHAN: list[tuple[str, str, str, str]] = [
    (r"o lai|tiep tuc|giu (nguyen|viec cu)|lam tiep|viec cu|cong ty cu", r"chuyen|doi|nghi|ra di|di|sang|viec moi|cong ty moi", "ở lại / giữ như cũ", "thay đổi / đi tiếp chỗ mới"),
    (r"lam thue|di lam", r"kinh doanh|khoi nghiep|lam rieng|lam chu|freelance", "đi làm thuê", "tự làm riêng"),
    (r"hoc (tiep|len|thac si|cao hoc)|di hoc|du hoc", r"di lam|lam viec|kiem tien", "học tiếp", "đi làm"),
    (r"o lai|con|giu", r"chia tay|dung|buong|roi", "ở lại trong quan hệ", "dừng lại"),
    (r"mua", r"thue|cho them|doi them", "mua ngay", "chờ thêm"),
    (r"o (que|nha|viet nam|day)", r"(ra|di) (nuoc ngoai|thanh pho|xa)|dinh cu|xuat khau", "ở lại chỗ quen", "đi xa"),
]

GOI_Y_TRAI_BAI = {"lua_chon": "hai_lua_chon", "quyet_dinh": "hai_lua_chon", "cach_lam": "ba_la_loi_khuyen", "ly_do": "nam_la",
                  "ket_qua": "ba_la_thoi_gian", "thoi_diem": "ba_la_thoi_gian", "hieu_minh": "mot_la", "nguoi_khac": "ba_la_loi_khuyen",
                  "tong_quat": "ba_la_loi_khuyen"}


def _chuan(cau: str) -> str:
    from app.luangiai.hoi import chuan_hoa_cau  # noqa: PLC0415
    return f" {chuan_hoa_cau(cau)} "


def y_dinh(t: str) -> str:
    return y_dinh_ro(t)[0]


def y_dinh_ro(t: str) -> tuple[str, bool]:
    """Ý định của câu đã chuẩn hoá (bọc khoảng trắng). Câu kể chuyện dài: chỉ xét câu hỏi cuối (sau dấu chấm / phẩy cuối)."""
    """(ý định, khớp mẫu rõ hay chỉ đoán theo dạng câu)."""
    if not t.strip():
        return "tong_quat", False
    for ma in _THU_TU:
        if any(r.search(t) for r in _RX[ma]):
            if ma == "co_nen":
                # "có nên A hay B" vẫn là hai lựa chọn
                return ("lua_chon" if any(r.search(t) for r in _RX["lua_chon"]) else "quyet_dinh"), True
            return ("nguoi_khac" if ma == "nguoi_khac_dau" else ma), True
    # Không khớp mẫu nào: câu có dạng hỏi thì vẫn đọc như câu hỏi (không rơi về "chung chung").
    tu = t.split()
    if re.search(r"\b(khong|ko|k|chua|chang|nhi|ha)\s*(a|vay|nhi|day)?\s*$", t):
        return "ket_qua", False
    if re.search(rf"\b{_TOI}\b", t) and re.search(r"\b(gi|nao|dau|sao|ai)\b", t):
        return "hieu_minh", False
    if len(tu) >= 5:
        return "ket_qua", False
    return "tong_quat", False


def viec(t: str) -> tuple[str | None, str | None, str | None]:
    """(mã việc, nhãn, lĩnh vực) — việc khớp mẫu dài nhất."""
    tot, dai = (None, None, None), 0
    for ma, nhan, lv, rxs in _RX_VIEC:
        for r in rxs:
            m = r.search(t)
            if m and len(m.group(0)) > dai:
                tot, dai = (ma, nhan, lv), len(m.group(0))
    return tot


def lua_chon(t: str) -> list[str] | None:
    """Nhãn hai phương án [đường A, đường B] nếu câu khớp một cặp trong danh mục (A = giữ như cũ, B = thay đổi)."""
    m = re.search(r"(.{0,60})\b(?:hay|hoac|voi|va)\b(.{0,60})", t)
    if not m:
        return None
    a, b = m.group(1), m.group(2)
    for pa, pb, na, nb in LUA_CHON_NHAN:
        if re.search(rf"\b({pa})\b", a) and re.search(rf"\b({pb})\b", b):
            return [na, nb]
        if re.search(rf"\b({pb})\b", a) and re.search(rf"\b({pa})\b", b):
            return [na, nb]          # luôn theo thứ tự đường A (giữ như cũ) – đường B (thay đổi) của trải bài
    return None


def hieu_cau(cau: str | None, chu_de: str | None = None) -> dict:
    """{y_dinh, linh_vuc, chu_de, viec, nhan_viec, lua_chon, goi_y_trai_bai, co_cau}. Không chứa chữ người dùng."""
    t = _chuan(cau or "")
    yd, ro = y_dinh_ro(t)
    ma_viec, nhan, lv = viec(t)
    cd = kb.chu_de()
    if chu_de == "ban_than" and lv is None:
        lv = linh_vuc(t)
    if chu_de in cd and not (chu_de == "ban_than" and lv):
        lv_cd = cd[chu_de]["linh_vuc"]
        # chủ đề người dùng bấm thắng lĩnh vực đoán từ chữ; việc chỉ giữ khi cùng lĩnh vực
        if lv and lv != lv_cd:
            ma_viec, nhan = None, None
        lv = lv_cd
    elif not lv:
        lv = linh_vuc(t)
    if chu_de not in cd:
        chu_de = next((ma for ma, x in cd.items() if x["linh_vuc"] == lv and ma not in ("gia_dinh", "ban_than")), None) if lv else None
    lc = lua_chon(t) if yd == "lua_chon" else None
    return {"y_dinh": yd, "linh_vuc": lv, "chu_de": chu_de, "viec": ma_viec, "nhan_viec": nhan, "lua_chon": lc,
            "goi_y_trai_bai": GOI_Y_TRAI_BAI[yd], "co_cau": bool((cau or "").strip()), "ro": ro}
