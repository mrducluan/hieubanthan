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

from app import ngon_ngu
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
    ("doi_viec", "đổi sang công việc mới", "cong_viec", [r"(doi|chuyen|thay doi|thay) (sang )?(cong viec|viec|cho lam|cong ty|nghe)", r"cong viec moi", r"nhay viec", r"(sang|qua) (cong ty|cho) (moi|khac)", r"tim viec (moi|khac)", r"co viec( lam)? moi", r"tim duoc viec"]),
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
    for lv, r in (_RX_LV_EN if _la_tieng_anh() else _RX_LV).items():
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
                  "ket_qua": "ba_la_thoi_gian", "thoi_diem": "khi_nao", "hieu_minh": "mot_la", "nguoi_khac": "ba_la_loi_khuyen",
                  "tong_quat": "ba_la_loi_khuyen"}

# ------------------------------------------------------------------ QTE-2: câu hỏi TIẾNG ANH (bản /en) — cùng danh mục ý định / việc / lĩnh vực
_HE = r"(he|she|they|him|her|them|my (ex|partner|boyfriend|girlfriend|husband|wife|boss|crush|friend|coworker|colleague|manager|client|landlord|mother|father|mom|dad|parents|family|team))"
_MAU_EN: dict[str, list[str]] = {
    "thoi_diem": [r"\b(when|how long|how soon|by when|what (month|year|time|day)|timing|timeline|how many (months|weeks|days|years))\b"],
    "ly_do": [r"\b(why|what is the reason|what s the reason|reason)\b"],
    "cach_lam": [r"\bhow (do|can|should|could|might|would) (i|we)\b", r"\bhow to\b", r"\bwhat (should|can|could|do) (i|we) do\b", r"\b(best|right) way to\b", r"\bwhere (do|should) i (start|begin)\b"],
    "nguoi_khac_dau": [rf"^ (does|do|is|will|has|did|would|can|could) {_HE}\b"],
    "lua_chon": [r"\b(should|do) (i|we) .{1,60}\bor\b", r"\b(choose|choosing|pick|decide|deciding|torn) between\b", r"\bwhich (one|option|job|path|offer|city|choice|way)\b", r"\b(option|plan) (a|1|one)\b.*\b(option|plan) (b|2|two)\b", r"\bstay or (go|leave|move)\b", r"\b\w+ (or|vs|versus) \w+\?"],
    "quyet_dinh": [r"\bshould (i|we)\b", r"\bis it (a good idea|wise|smart|right|time|worth it|the right time) to\b", r"\bis (now|this) (a good|the right) time\b", r"\bdo i (take|accept|go|move|quit|leave|say yes)\b", r"\bgood idea\b"],
    "nguoi_khac": [rf"\b{_HE} .{{0,20}}\b(love|loves|like|likes|miss|misses|think|thinks|feel|feels|want|wants|cheat|cheating|lying|lie|come back|coming back|care|cares|interested|serious|faithful|forgive|regret|trust)\b",
                   rf"\bhow (does|do) {_HE} (feel|think)\b", rf"\bwhat (does|do) {_HE} (think|feel|want)\b", r"\bdoes (he|she) (still )?(love|like|miss|want) me\b"],
    "hieu_minh": [r"\b(what (do|am) i (need|really want|missing|holding on to|afraid of|not seeing)|my (strength|strengths|weakness|weaknesses|blind spot|purpose|lesson|energy|pattern)|who am i|what (blocks|is blocking|holds|is holding) me|about myself|what (do|should) i (learn|know) about (myself|me)|what is my)\b",
                  r"\bwhat (card|energy|message) .{0,20}(for me|today|right now)\b", r"\bwhat (do|should) i (focus on|let go of)\b"],
    "ket_qua": [r"\bwill (i|it|this|my|the|we|things)\b", r"\b(what will happen|how will .{1,40} (go|turn out|end|work out)|outcome|chances|likely|succeed|successful)\b", r"\bam i going to\b", r"\bcan i (get|win|pass|succeed|make it|afford)\b", r"\b(is|are) .{1,40} going to (work|happen|last)\b", r"\bwhat (does|is) the future\b", r"\b(this|next) (week|month|year)\b"],
}
_MAU_EN["co_nen"] = [r"\bshould (i|we)\b"]
_RX_EN = {k: [re.compile(p) for p in v] for k, v in _MAU_EN.items()}
VIEC_EN: list[tuple[str, str, str, list[str]]] = [
    ("doi_viec", "changing jobs", "cong_viec", [r"(change|changing|switch|switching|new) (jobs?|careers?|company|companies|employer)", r"job (change|hunt|search)", r"find(ing)? (a )?(new )?job", r"career change"]),
    ("nghi_viec", "leaving your current job", "cong_viec", [r"quit(ting)? (my )?job", r"resign(ing|ation)?", r"leave (my )?(job|company)", r"hand in my notice", r"walk away from (my )?job"]),
    ("nhan_viec", "accepting a job offer", "cong_viec", [r"(accept|take|taking|accepting) (the|this|a) (job )?offer", r"job offer", r"offer letter", r"get the job", r"(get|got) hired"]),
    ("phong_van", "an interview or application", "cong_viec", [r"interview", r"apply(ing)? for", r"application", r"(send|sent|submit) my (cv|resume)"]),
    ("thang_chuc", "a promotion or raise", "cong_viec", [r"promotion", r"promoted", r"(pay )?raise", r"salary (increase|bump|negotiation)", r"ask for more money"]),
    ("khoi_nghiep", "starting your own business", "cong_viec", [r"start(ing)? (my own |a )?(business|company|shop|startup|side hustle)", r"go(ing)? freelance", r"self employed", r"my own business", r"open(ing)? a (shop|cafe|store|studio)"]),
    ("hop_tac", "a partnership", "cong_viec", [r"partner(ship)? with", r"business partner", r"co founder", r"collaborat(e|ion|ing) with", r"joint venture", r"team up with"]),
    ("du_an", "a project", "cong_viec", [r"project", r"contract", r"deal", r"launch", r"proposal", r"pitch"]),
    ("hoc_thi", "studies or an exam", "cong_viec", [r"exam", r"test(s)?\b(?! result)", r"study(ing)?", r"degree", r"master s", r"phd", r"course", r"certification", r"university|college|school", r"scholarship", r"study abroad"]),
    ("dau_tu", "an investment", "tien_bac", [r"invest(ing|ment)?", r"stocks?", r"shares", r"crypto", r"bitcoin", r"real estate", r"property investment", r"portfolio"]),
    ("vay_no", "a loan or debt", "tien_bac", [r"loan", r"debt", r"mortgage", r"borrow(ing)?", r"lend(ing)?", r"credit card", r"pay off"]),
    ("mua_ban", "buying or selling something big", "tien_bac", [r"buy(ing)? (a )?(house|home|car|apartment|flat|condo)", r"sell(ing)? (my |the )?(house|home|car|apartment|flat)", r"put (an )?offer on", r"down payment"]),
    ("tiet_kiem", "saving and keeping money", "tien_bac", [r"sav(e|ing|ings)", r"budget(ing)?", r"spending", r"emergency fund", r"keep my money"]),
    ("to_tinh", "telling someone how you feel", "tinh_cam", [r"confess", r"tell (him|her|them) (how i feel|i love|i like)", r"ask (him|her|them) out", r"make a move", r"express my feelings"]),
    ("quay_lai", "getting back with an ex", "tinh_cam", [r"get(ting)? back (together|with)", r"my ex", r"reconcil(e|iation)", r"second chance", r"rekindle"]),
    ("chia_tay", "ending a relationship", "tinh_cam", [r"break(ing)? up", r"breakup", r"end (this|the|my) relationship", r"leave (him|her|them)", r"divorce", r"separate", r"let (him|her|them) go", r"walk away from (him|her)"]),
    ("ket_hon", "moving toward marriage", "tinh_cam", [r"marr(y|iage|ied)", r"propos(e|al)", r"engag(ed|ement)", r"wedding", r"move in together"]),
    ("hen_ho", "starting a relationship", "tinh_cam", [r"dat(e|ing)", r"find(ing)? (love|someone|a partner)", r"meet someone", r"new relationship", r"single", r"fall(ing)? in love", r"soulmate"]),
    ("gia_dinh", "family matters", "tinh_cam", [r"family", r"my (mother|father|mom|dad|parents|son|daughter|kids?|children|brother|sister|in laws)", r"forgive", r"having (a )?(baby|kids|children)", r"get(ting)? pregnant", r"parenting"]),
    ("chuyen_nha", "moving house", "tien_bac", [r"mov(e|ing) (house|out|to a new (place|home|apartment))", r"relocat(e|ing|ion)", r"new (apartment|flat|place to live)", r"rent(ing)? (a )?(place|apartment|flat)"]),
    ("di_xa", "moving far away or travelling", None, [r"visa", r"travel(ling|ing)?", r"trip", r"abroad", r"emigrat(e|ing|ion)", r"immigrat(e|ing|ion)", r"move (to|back to) (another|a different|a new) (country|city|state)", r"mov(e|ing) (overseas|abroad|to [a-z]+)", r"go(ing)? back home"]),
    ("suc_khoe", "your energy and health", "suc_khoe", [r"health", r"energy", r"burn ?out", r"exhausted", r"tired", r"sleep", r"insomnia", r"stress(ed)?", r"anxiety", r"anxious", r"work ?out", r"exercise", r"diet", r"rest", r"well ?being"]),
]
_RX_VIEC_EN = [(ma, nhan, lv, [re.compile(rf"(?<![a-z]){p}(?![a-z])") for p in ps]) for ma, nhan, lv, ps in VIEC_EN]
_LV_TU_EN = {
    "tinh_cam": r"love|relationship|romance|romantic|partner|boyfriend|girlfriend|husband|wife|ex|crush|dating|date|marriage|married|wedding|divorce|breakup|break up|soulmate|single|family|parents|kids|children|friend|friendship|trust|cheating|affair|heart",
    "cong_viec": r"job|work|career|boss|coworker|colleague|company|business|startup|promotion|interview|offer|project|client|contract|study|studies|exam|degree|school|university|freelance|salary|team|manager|launch",
    "tien_bac": r"money|finances?|financial|invest(ment|ing)?|stocks?|crypto|debt|loan|mortgage|savings?|budget|house|home|apartment|rent|buy|sell|income|pay|afford|wealth|rich|cash|property|car",
    "suc_khoe": r"health|healthy|energy|tired|exhausted|burnout|sleep|insomnia|stress|stressed|anxiety|anxious|depressed|mood|body|exercise|gym|diet|weight|rest|doctor|sick|illness|wellbeing|mental",
}
_RX_LV_EN = {k: re.compile(rf"(?<![a-z])({v})(?![a-z])") for k, v in _LV_TU_EN.items()}
LUA_CHON_NHAN_EN: list[tuple[str, str, str, str]] = [
    (r"stay|keep|remain|current|old job|same", r"leave|go|move|quit|change|switch|new job|new company", "staying / keeping things as they are", "changing / moving on to something new"),
    (r"employ(ed|ee|ment)|my job|corporate|work for", r"business|freelance|self employed|my own|start up|startup", "staying employed", "working for myself"),
    (r"study|studies|school|degree|master|phd|university", r"work|job|career|money", "continuing to study", "going to work"),
    (r"stay|keep|remain|work on it|try again", r"break up|leave|end it|let go|move on|divorce", "staying in the relationship", "ending it"),
    (r"buy|purchase", r"wait|rent|hold off|later", "buying now", "waiting"),
    (r"stay (home|here|put)|my (home )?country|home", r"abroad|overseas|another (country|city)|move away|emigrate", "staying where you are", "going far away"),
]


def _la_tieng_anh() -> bool:
    return ngon_ngu.hien_tai() == "en"


def _rx_y_dinh() -> dict:
    return _RX_EN if _la_tieng_anh() else _RX


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
    RX = _rx_y_dinh()
    for ma in _THU_TU:
        if any(r.search(t) for r in RX[ma]):
            if ma == "co_nen":
                # "có nên A hay B" vẫn là hai lựa chọn
                return ("lua_chon" if any(r.search(t) for r in RX["lua_chon"]) else "quyet_dinh"), True
            return ("nguoi_khac" if ma == "nguoi_khac_dau" else ma), True
    # Không khớp mẫu nào: câu có dạng hỏi thì vẫn đọc như câu hỏi (không rơi về "chung chung").
    tu = t.split()
    if _la_tieng_anh():
        if re.search(r"^ (is|are|am|do|does|did|can|could|would|has|have) ", t) or t.strip().endswith("?"):
            return "ket_qua", False
        if re.search(r"\b(i|me|my|myself)\b", t) and re.search(r"\b(what|which|where|who)\b", t):
            return "hieu_minh", False
        return ("ket_qua", False) if len(tu) >= 5 else ("tong_quat", False)
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
    for ma, nhan, lv, rxs in (_RX_VIEC_EN if _la_tieng_anh() else _RX_VIEC):
        for r in rxs:
            m = r.search(t)
            if m and len(m.group(0)) > dai:
                tot, dai = (ma, nhan, lv), len(m.group(0))
    return tot


def lua_chon(t: str) -> list[str] | None:
    """Nhãn hai phương án [đường A, đường B] nếu câu khớp một cặp trong danh mục (A = giữ như cũ, B = thay đổi)."""
    m = re.search(r"(.{0,60})\b(?:or|vs|versus)\b(.{0,60})" if _la_tieng_anh() else r"(.{0,60})\b(?:hay|hoac|voi|va)\b(.{0,60})", t)
    if not m:
        return None
    a, b = m.group(1), m.group(2)
    for pa, pb, na, nb in (LUA_CHON_NHAN_EN if _la_tieng_anh() else LUA_CHON_NHAN):
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
