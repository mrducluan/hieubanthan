# -*- coding: utf-8 -*-
"""EN-3b — "Trả lời trước": đoạn MỞ ĐẦU soạn theo đúng điều được hỏi (RULES, tất định, không LLM).

Đoạn 1 của câu trả lời = điều được hỏi (gọi bằng lời thường) + mức / điều chính + một lý do + một việc nên làm, đúng mảng
và đúng mốc thời gian được hỏi. Mọi chữ lấy từ gói bằng chứng của chính câu trả lời (mục KB, mức chương đời sống, mức
từng năm, quẻ đã đọc) — module này chỉ CHỌN và GHÉP, không thêm dữ kiện. Câu đặc biệt (khủng hoảng, từ chối, dẫn hướng)
và câu thiếu dữ liệu không có đoạn mở đầu.

`dieu_hoi(t)` nhận "điều được hỏi" từ một danh mục CỐ ĐỊNH (không bao giờ chép chữ người dùng vào lời đáp): mã + nhãn
đời thường + mảng đời sống. `dat_dau(van, mo)` đặt đoạn mở đầu lên đầu và bỏ ở phần dưới những câu đã nói nguyên văn
trong đoạn mở đầu (không lặp).
"""
from __future__ import annotations

import re

from app.luangiai.hoi import _co

# (mã, nhãn đời thường, mảng, mẫu trên câu đã chuẩn hoá — bỏ dấu, mở viết tắt). Thứ tự: cụ thể trước, chung sau.
# Mảng: cong_viec · tien_bac · tinh_cam · gia_dinh · con_cai · suc_khoe · hoc_hanh · nha_cua · di_xa · quan_he ·
# phap_ly · ban_than.
DIEU_HOI: list[tuple[str, str, str, list[str]]] = [
    # ---- nét bản thân (đứng trước: "bớt nóng với đồng nghiệp" là chuyện tính nóng)
    ("ten_goi", "chuyện tên gọi", "ban_than",
     [r"nghe danh", r"(doi|dat|chon) ten", r"(?<!\w)ten (toi|em|minh|con|be|goi|thuong goi)", r"biet danh", r"so ten"]),
    ("can_bang", "chuyện cân bằng cuộc sống", "suc_khoe",
     [r"can bang (cuoc song|cong viec|giua)", r"(?<!\w)can bang(?! (ngu hanh|hanh))", r"sap xep (cuoc song|thoi gian)",
      r"nhip song", r"om dom"]),
    ("tu_tin", "sự tự tin", "ban_than",
     [r"tu (tin|ti)", r"rut re", r"dam dong", r"thuyet trinh", r"noi truoc", r"so sanh (minh|ban than)", r"nhut nhat"]),
    ("tinh_khi", "chuyện tính nóng", "ban_than",
     [r"nong (nay|tinh)", r"(?<!\w)cau (gat|kinh)", r"(?<!\w)de (gian|noi nong|cau)", r"buc boi", r"(?<!\w)nong (voi|len)",
      r"tinh khi", r"kiem che", r"(?<!\w)gian (du|giu)"]),
    ("tri_hoan", "thói trì hoãn", "ban_than",
     [r"tri hoan", r"deadline", r"chan chu", r"(?<!\w)luoi", r"no viec", r"ky luat"]),
    ("tap_trung", "chuyện tập trung", "ban_than",
     [r"(khong|ko|kho|mat|thieu|it) tap trung", r"(de|hay) xao nhang", r"tap trung (kem|duoc|hon)"]),
    # ---- công việc
    ("giu_viec", "chuyện giữ việc", "cong_viec",                       # CY-1: "có mất việc / bị sa thải không"
     [r"mat viec", r"(bi )?sa thai", r"that nghiep", r"(bi )?duoi viec", r"cat giam (nhan su|nguoi)"]),
    ("doi_viec", "chuyện đổi việc, nghỉ việc", "cong_viec",
     [r"doi (viec|cong viec|nghe|cong ty|cho lam)", r"nhay viec", r"chuyen (viec|nghe|nganh|cong ty|sang)",
      r"nghi viec", r"bo viec", r"(ve|sang|qua) lam (cho|o|tai|ben)", r"sang cong ty", r"cong ty moi", r"(nop|gui) (don|ho so|cv)", r"viec (moi|khac)",
      r"tim viec", r"(o lai|tiep tuc lam) (cong ty|cho cu|o cong ty|lam|tiep).{0,40}(hay|hoac) (nghi|bo|doi|nhay|di)"]),
    ("thang_tien", "chuyện thăng tiến, làm quản lý", "cong_viec",
     [r"thang (chuc|tien)", r"len (chuc|chuc vu|cap)", r"de bat", r"(lam|len|nhan) (quan ly|lanh dao|truong|pho|giam doc)",
      r"tang luong", r"chuc vu", r"hieu (truong|pho)", r"bo nhiem"]),
    ("kinh_doanh", "chuyện kinh doanh, làm chủ", "cong_viec",
     [r"kinh doanh", r"buon ban", r"lam (chu|rieng|an rieng)", r"khoi nghiep", r"khai truong",
      r"mo (quan|tiem|cua hang|shop|cong ty|xuong|spa|salon|nha hang|cua tiem)", r"tu (mo|lam chu)", r"ban hang",
      r"don hang", r"chot (don|hop dong|deal)", r"dam phan", r"mo (them )?chi nhanh", r"(doi|chuyen) (dia diem|mat bang)",
      r"(quan|tiem|cua hang|shop) .{0,25}(vang khach|e am|it khach|ban cham|dong khach)"]),
    ("hop_tac", "chuyện góp vốn, làm ăn chung", "cong_viec",
     [r"gop von", r"hop tac", r"(?<!\w)hun ", r"doi tac", r"lam an (chung|voi)", r"chung von", r"goi von",
      r"nha dau tu"]),
    ("chon_nghe", "chuyện chọn nghề", "cong_viec",
     [r"(hop|chon|lam) (nghe|nganh)", r"nghe (gi|nao)", r"nganh (gi|nao)", r"nghe nghiep", r"huong nghiep",
      r"(van phong|ky thuat|giao tiep|ngan hang|cong chuc|nha nuoc).{0,30}(hay|hoac)", r"lam (nhan vien|cong chuc|nha nuoc)"]),
    ("dong_nghiep", "chuyện với đồng nghiệp, cấp trên", "cong_viec",
     [r"dong nghiep", r"\bsep\b", r"cap (tren|duoi)", r"(?<!\w)noi lam viec"]),
    # ---- tiền bạc
    ("dau_tu", "chuyện đầu tư", "tien_bac",
     [r"(?<!bat )dau tu", r"chung khoan", r"co phieu", r"\bcoin\b", r"tien ao", r"crypto", r"vang (mieng|nhan)?", r"bat dong san",
      r"luot song", r"cat lo", r"gong lo"]),
    ("vay_no", "chuyện vay mượn, nợ nần", "tien_bac",
     [r"(?<!\w)vay (tien|no|ngan hang|von|muon|mua|de|\d)", r"khoan (vay|no)", r"(di|cho|xin|ho so|duoc) vay",
      r"(?<!\w)no (nan|cu|xau)", r"tra no", r"doi no", r"cho (muon|vay)", r"muon tien", r"dung ten",
      r"(?<!\w)(om|gong|ganh) no", r"\bno\b \d+"]),
    ("giu_tien", "chuyện giữ tiền", "tien_bac",
     [r"giu (tien|cua)", r"tiet kiem", r"tieu (xai|tien|pha)", r"chi tieu", r"tich (luy|gop)", r"tien (vao|di) .{0,20}(ra|het)",
      r"kho giu", r"de tien", r"pha san", r"vo no", r"mat (het )?tien", r"thua lo", r"lo von", r"hao tai"]),
    # ---- tình cảm, gia đình
    ("ket_hon", "chuyện cưới hỏi, kết hôn", "tinh_cam",
     [r"ket hon", r"(?<!\w)cuoi(?! (nam|thang|tuan|doi|ngay|cung|ky))", r"lay (vo|chong)", r"dinh hon", r"dam cuoi",
      r"(?<!\w)hon nhan", r"lap gia dinh", r"thanh hon"]),
    ("vo_chong", "chuyện vợ chồng", "tinh_cam",
     [r"vo chong", r"(chong|vo) (toi|em|minh|tui)", r"ly hon", r"ly di", r"ngoai tinh", r"phu the",
      r"(?<!\w)(toi|em|minh|tui) (va|voi) (chong|vo)(?!\w)"]),
    ("tinh_duyen", "chuyện tình cảm, tình duyên", "tinh_cam",
     [r"(?<!song )(?<!trong )tinh (duyen|cam|yeu)", r"nguoi yeu", r"\bcrush\b", r"(?<!\w)e (hoai|mai|lau)", r"(?<!\w)doc than", r"dao hoa",
      r"to tinh", r"(?<!\w)yeu (ai|nhau|xa|lai|duong|duoc|nguoi)", r"(?<!\w)(dang|chua|moi|biet) yeu", r"(ban|nguoi) (trai|gai)(?! (toi|em|minh) (sinh|nam))",
      r"nguoi (cu|ay)", r"chia tay", r"quay lai", r"\bny\b", r"mau nguoi", r"(?<!\w)ghen"]),
    ("con_cai", "chuyện con cái", "con_cai",
     [r"con cai", r"sinh con", r"lam (bo me|cha me|bo|me|cha)(?!\w)", r"nuoi day", r"(co|mong|chua co|duyen) con", r"tu nu", r"nuoi con", r"(con|be) (trai|gai|nha|toi|em|minh)",
      r"(co|mang|duong|giu|du) thai\b", r"\bthai (nhi|ky|phu)\b"]),
    ("bo_me", "chuyện với bố mẹ", "gia_dinh",
     [r"(?<!\w)(bo|cha) me", r"phu mau", r"(?<!\w)(bo|me|ba|cha) (toi|em|minh)\b", r"me chong", r"nha (noi|ngoai|chong)",
      r"ong ba"]),
    ("anh_em", "chuyện anh chị em", "gia_dinh",
     [r"anh (chi )?em", r"chi em", r"(?<!\w)ae(?!\w)", r"huynh de", r"anh trai", r"chi gai", r"em (trai|gai)"]),
    # ---- sức khoẻ, bản thân
    ("giac_ngu", "chuyện giấc ngủ", "suc_khoe",
     [r"mat ngu", r"kho ngu", r"tran troc", r"giac ngu", r"ngu (khong|kem|it)"]),
    ("suc_khoe", "sức khoẻ và sức lực", "suc_khoe",
     [r"suc (khoe|luc)", r"(?<!\w)(om|benh) (vat|lat|hoai)", r"hay om", r"(?<!\w)met(?! moi nguoi)", r"kiet suc",
      r"can suc", r"duoi suc", r"giu suc", r"tat ach", r"(?<!\w)yeu (nguoi|di)", r"qua tai", r"stress", r"cang thang"]),
    ("mo_long", "chuyện mở lòng, kết nối", "quan_he",
     [r"mo long", r"co don", r"(it|khong co|kho ket) ban", r"ket ban", r"kho gan", r"nguoi moi quen", r"hoa nhap"]),
    ("tin_nguoi", "chuyện tin người", "quan_he",
     [r"(de|kho|hay) tin (nguoi|ai)", r"tin nguoi", r"bi lua", r"loi dung", r"long tot", r"\blua\b"]),
    ("tieu_nhan", "chuyện người chơi xấu (tiểu nhân)", "quan_he",
     [r"tieu nhan", r"choi xau", r"(ham|hai) (hai|nguoi)", r"tranh cong", r"noi xau", r"sau lung", r"(?<!\w)ghet"]),
    ("quy_nhan", "chuyện người giúp đỡ (quý nhân)", "quan_he",
     [r"quy nhan", r"giup (do|duoc)", r"nang do", r"ho tro", r"nho (vao|duoc)", r"nguoi giup"]),
    ("dam_me", "chuyện bạn giỏi gì, muốn gì", "ban_than",
     [r"dam me", r"thich (gi|lam gi)", r"muon gi", r"(dinh huong|muc dich|y nghia) (song|cuoc)", r"(gioi|manh) (nhat|gi|o)",
      r"the manh", r"diem manh", r"so truong", r"nang khieu", r"tai nang", r"con duong"]),
    # ---- học, đi xa, nhà, giấy tờ
    ("thi_cu", "chuyện học hành, thi cử", "hoc_hanh",
     [r"(?<!\w)thi (lai|dai hoc|do|dau|cu|tot nghiep|chung chi|ielts|toeic|cong chuc)", r"on thi", r"ky thi", r"hoc bong",
      r"\bielts\b", r"(?<!\w)hoc (hanh|van|tap|them|thac si|len|nganh|dai hoc|lai|tiep|bang)", r"thac si", r"dai hoc",
      r"van bang", r"chung chi", r"chuyen truong", r"(?<!\w)bang cap", r"luan van", r"khoa luan",
      r"(lam|nop|bao ve) do an", r"do an (tot nghiep|mon|hoc|chuyen nganh)", r"bai tap lon", r"nop bai",
      r"bao ve (luan|de tai)"]),
    ("di_xa", "chuyện đi xa, ra nước ngoài", "di_xa",
     [r"(nuoc|ra) ngoai", r"xuat ngoai", r"du hoc", r"di xa", r"xa (que|nha)", r"dinh cu", r"cong tac", r"thien di",
      r"lap nghiep", r"ve que", r"thanh pho", r"(?<!\w)que (nha|huong)", r"chuyen di", r"xuat khau lao dong",
      r"(sang|qua|di) (nhat|han|uc|my|dai loan|duc|phap|canada|singapore|chau au)(?!\w)"]),
    ("mua_nha", "chuyện mua nhà, đất", "nha_cua",
     [r"mua (nha|dat|can ho|chung cu|mieng dat|lo dat|manh dat)", r"tau (nha|dat)", r"nha (dat|rieng)", r"dien trach",
      r"bat dong san", r"(manh|lo|mieng|thua) dat.{0,25}(mua|dinh mua)", r"(dat|rut) coc"]),
    ("ban_nha", "chuyện bán nhà, đất", "nha_cua",
     [r"ban (nha|dat|can ho)", r"rao ban", r"nguoi mua"]),
    ("lam_nha", "chuyện làm nhà, sửa nhà", "nha_cua",
     [r"(lam|xay|sua|cat) nha", r"dong tho", r"khoi cong", r"(?<!\w)sua (sang|chua)"]),
    ("chuyen_nha", "chuyện chuyển nhà", "nha_cua",
     [r"chuyen (nha|cho o|den|ve)", r"don (nha|vao|ve)", r"nha moi", r"nhap trach"]),
    ("mua_xe", "chuyện mua xe", "tien_bac",
     [r"mua (xe|oto|o to)"]),
    ("kien_tung", "chuyện giấy tờ, hợp đồng, kiện tụng", "phap_ly",
     [r"(?<!\w)kien (tung|cao|ai|nguoi|doi|ra|len|nhau|hang xom)", r"(thua|thang|vu|bi|di|khoi) kien", r"(?<!\w)toa (an|xu|tuyen)", r"tranh chap", r"giay to", r"hop dong", r"phap ly", r"thua ke", r"\bvisa\b",
      r"ho so", r"(?<!\w)duyet"]),
    ("di_lai", "chuyện đi lại", "suc_khoe",
     [r"lai xe", r"di duong", r"(?<!\w)xe (co|may)", r"giao thong"]),
    ("tim_do", "chuyện tìm lại đồ, người, vật thất lạc", "ban_than",
     [r"(lam |bi )?(mat|roi|lac|trom)\b.{0,30}(tim|ve|lai)", r"tim (lai|thay)", r"(?<!\w)bi trom", r"di lac"]),
    ("thu_cung", "chuyện nuôi thú cưng", "ban_than",
     [r"nuoi (cho|meo|cun|thu cung|pet)", r"(chu|con) (cho|meo|cun)(?!\w)", r"thu cung"]),
    ("ve_gia", "chuyện về già", "ban_than",
     [r"ve gia", r"tuoi gia", r"hau van", r"an nhan", r"cuoi doi"]),
    # ---- chung (đứng sau cùng)
    ("cong_viec", "công việc", "cong_viec",
     [r"cong viec", r"su nghiep", r"di lam", r"\bviec lam\b", r"cong danh", r"quan loc", r"\blam viec\b"]),
    ("lam_giau", "chuyện tiền bạc", "tien_bac",
     [r"(?<!\w)tien(?! (giang|hanh|do|bo|si|kiep|thien))", r"tai chinh", r"(?<!che )(?<!giau )\bgiau\b(?! (giem|kin|di))", r"thu nhap", r"tai (van|loc)",
      r"(?<!\w)luong", r"lam thue", r"tai bach", r"\bcua cai\b"]),
    ("gia_dinh", "chuyện gia đình", "gia_dinh",
     [r"gia dinh", r"(?<!\w)ho hang", r"noi ngoai", r"dong ho", r"to tien", r"phuc duc", r"gia dao", r"huong hoa"]),
    ("ban_be", "chuyện bạn bè", "quan_he",
     [r"ban (be|than|cu)", r"no boc", r"giao tiep", r"cac moi quan he", r"quan he"]),
    # EN-3d (review): nét tính cách đứng SAU các chủ đề đời sống — "tiền bạc thế nào, tôi hay lo" là chuyện tiền bạc.
    ("om_viec", "chuyện ôm việc, khó từ chối", "ban_than",
     [r"om (viec|het|dom)", r"(kho|khong biet|khong dam|ngai) tu choi", r"ganh (viec|het)", r"lam ho (nguoi|viec)"]),
    ("kien_tri", "chuyện bỏ dở giữa chừng", "ban_than",
     [r"bo do", r"(khong|thieu|kem) kien tri", r"ca the ba phai", r"(hay|de) bo cuoc", r"nhanh chan", r"ba phut"]),
    ("cau_toan", "tính cầu toàn", "ban_than",
     [r"cau toan", r"hoan hao", r"ki tinh", r"ky tinh"]),
    ("lanh_dao", "chuyện làm lãnh đạo, dẫn dắt", "cong_viec",
     [r"lanh dao", r"truong nhom", r"dan dat", r"\bleader\b", r"quan ly (nhom|nguoi|doi)"]),
    # EN-3d: nét tính cách / thói quen hay hỏi (nhãn cố định, gọi tên điều người hỏi băn khoăn)
    ("lo_nghi", "chuyện hay lo nghĩ", "ban_than",
     [r"(hay|de|qua|nhieu) (lo|lo lang|lo au|nghi ngoi|suy nghi|overthinking|nghi nhieu)", r"lo xa", r"suy nghi qua nhieu",
      r"overthink"]),
    ("nhay_cam", "chuyện dễ tổn thương, nhạy cảm", "ban_than",
     [r"(de|hay|qua) (ton thuong|nhay cam|tu ai|tui than|khoc|buon)", r"de bi ton thuong", r"(hay|de) gian doi"]),
    ("do_du", "chuyện thiếu quyết đoán", "ban_than",
     [r"(thieu|khong|kem) quyet doan", r"do du", r"phan van mai", r"(kho|khong dam) quyet dinh", r"lung lung"]),
    ("ca_ne", "chuyện cả nể, sống vì người khác", "ban_than",
     [r"ca ne", r"de (mem long|xieu long)", r"mem long", r"song vi nguoi khac", r"(chieu|lam vua long) (nguoi khac|moi nguoi)",
      r"(?<!\w)ne (nguoi|moi nguoi)"]),
    ("cung_dau", "tính cứng đầu, bảo thủ", "ban_than",
     [r"cung dau", r"bao thu", r"co chap", r"(hay|de) cai", r"khong chiu nghe", r"ghe ghe"]),
    ("huong_noi", "chuyện hướng nội, ít nói", "ban_than",
     [r"huong noi", r"it noi", r"tram tinh", r"(thich|hay) (o )?mot minh", r"ngai (giao tiep|noi chuyen|gap nguoi)"]),
    ("huong_ngoai", "chuyện hướng ngoại, nói nhiều", "ban_than",
     [r"huong ngoai", r"noi nhieu", r"(hay|de) noi (leo|thang|qua)", r"thang tinh"]),
    ("ghen_ti", "chuyện ganh tị, so bì", "ban_than",
     [r"ganh ti", r"ghen ti", r"so bi", r"ti nanh"]),
    ("de_chan", "chuyện dễ chán, thiếu động lực", "ban_than",
     [r"(de|hay|nhanh) chan", r"(thieu|mat|khong co) dong luc", r"chan nan", r"uon (ao|ai)", r"luoi bieng"]),
    ("nong_voi", "chuyện nóng vội, thiếu kiên nhẫn", "ban_than",
     [r"nong voi", r"(thieu|khong|kem) kien nhan", r"(hap tap|vo vap|voi vang)"]),
    ("kiem_soat", "chuyện muốn kiểm soát", "ban_than",
     [r"kiem soat", r"(ap dat|bat nguoi khac)", r"gia truong", r"doc doan"]),
    ("so_that_bai", "chuyện sợ thất bại, ngại thay đổi", "ban_than",
     [r"so (that bai|thay doi|sai|bi che|rui ro)", r"ngai thay doi", r"(khong dam|ngai) (thu|bat dau|buoc ra)", r"vung an toan"]),
    ("nghien_viec", "chuyện làm việc quá sức", "ban_than",
     [r"nghien viec", r"tham cong tiec viec", r"lam (viec )?(qua suc|khong nghi|quen ca)", r"workaholic", r"cuong viec"]),
    ("tinh_cach", "tính cách của bạn", "ban_than",
     [r"tinh cach", r"con nguoi", r"noi tam", r"(la|kieu) nguoi (the nao|ra sao|gi)", r"ban than", r"(?<!\w)tinh (toi|em|minh)"]),
]
_THEO_MA = {ma: (ma, nhan, mang, mau) for ma, nhan, mang, mau in DIEU_HOI}
# Nét tính cách EN-3d — nhường chủ đề đời sống ở vế khác của câu.
_NET = {"om_viec", "kien_tri", "cau_toan", "lo_nghi", "nhay_cam", "do_du", "ca_ne", "cung_dau", "huong_noi", "huong_ngoai",
        "ghen_ti", "de_chan", "nong_voi", "kiem_soat", "so_that_bai", "nghien_viec"}


# EN-3d: nhãn RÕ hơn cho đầu câu "Về …" — vẫn từ danh mục cố định (không chép chữ người dùng). Chỉ đổi NHÃN hiển thị
# khi điều cha (mã trong DIEU_HOI) đã nhận ra ở cùng vế; mã, mảng, chương giữ nguyên (định tuyến không đổi).
# (nhãn rõ, mã cha, mẫu) — thứ tự: cụ thể trước.
NHAN_RO: list[tuple[str, tuple[str, ...], list[str]]] = [
    ("chuyện ở lại hay nhảy việc", ("doi_viec",), [r"(o lai|tiep tuc) (cong ty|cho cu|o cong ty|lam|tiep).{0,40}(hay|hoac).{0,30}(nhay|doi|nghi|chuyen|bo|di)",
                                                   r"nhay viec"]),
    ("chuyện chuyển công tác", ("doi_viec", "di_xa"), [r"(xin )?chuyen cong tac", r"dieu chuyen", r"luan chuyen"]),
    ("chuyện đi công tác", ("di_xa",), [r"(di|chuyen di|dot) cong tac"]),
    ("chuyện xin việc, phỏng vấn", ("doi_viec",), [r"phong van", r"xin viec", r"(nop|gui) (don|ho so|cv)", r"tim viec"]),
    ("chuyện nghỉ việc", ("doi_viec",), [r"nghi viec", r"bo viec", r"xin nghi"]),
    ("chuyện lương, xin tăng lương", ("thang_tien", "lam_giau"), [r"(tang|len|deal|dam phan|xin) luong", r"(?<!\w)luong (thang|co|len|tang)"]),
    ("chuyện chốt đơn hàng, đàm phán", ("kinh_doanh",), [r"don hang", r"chot (don|hop dong|deal)", r"dam phan"]),
    ("chuyện mở thêm chi nhánh", ("kinh_doanh",), [r"mo (them )?chi nhanh", r"chi nhanh (moi|thu)"]),
    ("chuyện đổi địa điểm kinh doanh", ("kinh_doanh",), [r"(doi|chuyen) (dia diem|mat bang)"]),
    ("chuyện quán vắng khách", ("kinh_doanh",), [r"vang khach", r"it khach", r"e am", r"ban cham"]),
    ("chuyện gọi vốn", ("hop_tac",), [r"goi von", r"nha dau tu"]),
    ("chuyện ký hợp đồng với đối tác", ("hop_tac",), [r"hop dong", r"ky ket", r"(?<!\w)ky (ket|voi)"]),
    ("chuyện nói trước đông người", ("tu_tin",), [r"dam dong", r"dong nguoi", r"thuyet trinh", r"dien gia", r"noi truoc"]),
    ("chuyện đất hương hoả trong họ", ("gia_dinh", "kien_tung"), [r"huong hoa", r"dat (chung|cua ho|cua to|to tien)"]),
    ("chuyện đi làm ở nước ngoài", ("di_xa",), [r"xuat khau lao dong",
                                              r"(sang|qua|di) (nhat|han|uc|my|dai loan|duc|phap|canada|singapore|chau au) (lam|lao dong)",
                                              r"(lam viec|di lam) (o|tai|ben) (nuoc ngoai|nhat|han|uc|my|dai loan|duc)",
                                              r"chuyen di .{0,15}lam viec"]),
    ("chuyện luận văn, đồ án", ("thi_cu",), [r"luan van", r"khoa luan", r"(lam|nop|bao ve) do an",
                                              r"do an (tot nghiep|mon|hoc|chuyen nganh)", r"bai tap lon", r"bao ve (luan|de tai)"]),
    ("chuyện mở rộng việc làm ăn", ("kinh_doanh",), [r"mo rong", r"(them|mo them) (chi nhanh|cua hang|co so|diem ban)"]),
    ("chuyện sang nhượng quán, cửa hàng", ("kinh_doanh",), [r"sang (nhuong|lai|quan|tiem|cua hang|mat bang)"]),
    ("chuyện khai trương", ("kinh_doanh",), [r"khai truong"]),
    ("chuyện mở quán, mở cửa hàng", ("kinh_doanh",), [r"mo (quan|tiem|cua hang|shop|nha hang|spa|salon|cua tiem|xuong)",
                                                     r"ban (online|hang online)"]),
    ("chuyện vay ngân hàng", ("vay_no",), [r"vay (ngan hang|von|the chap)", r"(di|xin|ho so|duoc) vay"]),
    ("chuyện cho vay, cho mượn tiền", ("vay_no",), [r"cho (muon|vay)"]),
    ("chuyện đòi nợ", ("vay_no",), [r"doi no", r"(no|vay).{0,20}(khong|chua) tra"]),
    ("chuyện chứng khoán, cổ phiếu", ("dau_tu",), [r"chung khoan", r"co phieu"]),
    ("chuyện mua vàng", ("dau_tu",), [r"(mua|tich|tru) vang", r"vang (mieng|nhan)"]),
    ("chuyện tiền ảo", ("dau_tu",), [r"\bcoin\b", r"tien ao", r"crypto"]),
    ("chuyện tiền cọc mua nhà", ("mua_nha", "ban_nha"), [r"(dat|rut|mat|lay lai|tra) coc", r"tien coc"]),
    ("chuyện mua căn hộ chung cư", ("mua_nha",), [r"(can ho|chung cu)"]),
    ("chuyện mua đất", ("mua_nha",), [r"mua (dat|mieng dat|lo dat|manh dat)", r"(manh|lo|mieng|thua) dat"]),
    ("chuyện xin visa", ("kien_tung",), [r"\bvisa\b", r"thi thuc"]),
    ("chuyện thừa kế", ("kien_tung",), [r"thua ke", r"chia (tai san|dat|nha)"]),
    ("chuyện kiện tụng", ("kien_tung",), [r"(?<!\w)kien (tung|cao|ai|nguoi|doi|ra|len|nhau|hang xom)",
                                         r"(thua|thang|vu|bi|di|khoi) kien", r"(?<!\w)toa (an|xu|tuyen)"]),
    ("chuyện hợp đồng", ("kien_tung",), [r"hop dong", r"ky ket"]),
    ("chuyện ly hôn", ("vo_chong",), [r"ly (hon|di|than)"]),
    ("chuyện làm lành sau cãi nhau", ("vo_chong", "tinh_duyen"), [r"lam (lanh|hoa)", r"cai nhau", r"gian nhau",
                                                                   r"(?<!\w)xin loi"]),
    ("chuyện người cũ quay lại", ("tinh_duyen", "vo_chong"), [r"(nguoi yeu|ny|nguoi|vo|chong) cu", r"quay lai", r"tai hop"]),
    ("chuyện người ấy có thật lòng", ("tinh_duyen",), [r"that long", r"thuc long", r"(co|that) yeu (toi|em|minh)"]),
    ("chuyện tỏ tình", ("tinh_duyen",), [r"to tinh"]),
    ("chuyện học tiếp hay đi làm", ("thi_cu", "cong_viec"), [r"nghi hoc", r"bo hoc", r"(hoc tiep|hoc len).{0,30}(hay|hoac).{0,20}(di lam|lam)",
                                                             r"(di lam).{0,20}(hay|hoac).{0,20}hoc"]),
    ("chuyện du học", ("di_xa", "thi_cu"), [r"du hoc"]),
    ("chuyện về quê lập nghiệp", ("di_xa",), [r"ve que (lam|song|nuoi|trong|mo|lap)", r"ve que"]),
]


def _ro(c: str, ma: str) -> str | None:
    return next((n for n, cha, mau in NHAN_RO if ma in cha and _co(c, mau)), None)


def _cac(t: str) -> list[dict]:
    ra = []
    for ma, nhan, mang, mau in DIEU_HOI:
        if _co(t, mau):
            d = {"ma": ma, "nhan": nhan, "mang": mang}
            ro = _ro(t, ma)
            if ro:
                d["nhan_ro"] = ro
            ra.append(d)
    return ra


def cac_dieu_hoi(t: str, raw: str | None = None) -> list[dict]:
    """Mọi điều được hỏi nhận ra, theo thứ tự danh mục (cụ thể trước chung). Câu kể chuyện nhiều câu (`raw` có dấu
    chấm / hỏi): xét câu CUỐI có khớp — câu hỏi thật thường đứng cuối ("Mình kết hôn 7 năm chưa có con… Bát tự có nói gì
    về đường con cái?")."""
    if raw:
        from app.luangiai.hoi import chuan_hoa_cau  # noqa: PLC0415
        # câu, rồi vế (dấu phẩy / chấm phẩy): "Mình đang làm kinh doanh, tôi có số xuất ngoại không?" — vế mở đầu là
        # hoàn cảnh, điều được hỏi ở vế sau.
        cau_ = [chuan_hoa_cau(c) for c in re.split(r"(?<=[.!?])\s+|\n+|[,;]\s*", raw.strip()) if c.strip()]
        loc = [c for c in cau_ if not _HOAN_CANH.match(c)]          # vế giới thiệu bản thân không phải điều được hỏi
        # EN-3c (review): "Tôi đang tính đổi việc, có nên không?" — vế sau chỉ là đuôi hỏi, điều được hỏi nằm ở vế "giới
        # thiệu" → khi các vế còn lại không nhận ra điều gì mà vế cuối là đuôi hỏi trơn, xét cả vế hoàn cảnh.
        if loc and not any(_cac(c) for c in loc) and _DUOI_HOI.match(loc[-1]):
            loc = cau_
        if len(loc) >= 1:
            ra = []
            for c in reversed(loc):
                ds = _cac(c)
                if ds and not ra:
                    ra = ds
                    if not all(d["ma"] in _NET for d in ds):
                        return ds
                elif ds and not all(d["ma"] in _NET for d in ds):
                    # review EN-3d: "tiền bạc thế nào, tôi hay lo lắng" — vế cuối chỉ là nét tính cách, chủ đề ở vế trước
                    return ds + ra
            return ra
    return _cac(t)


# Vế giới thiệu hoàn cảnh ("Mình 24 tuổi mới đi làm", "Em là mẹ bỉm hai con", "Tôi năm nay 52 tuổi") — không mang
# điều được hỏi.
# Đuôi hỏi trơn, không tự mang điều được hỏi ("có nên không", "được không ạ", "thế nào").
_DUOI_HOI = re.compile(r"^(co |thi )?(nen|duoc|on|hop|tot|sao)?( (khong|ko|k|chua|a|nhi|the nao|ra sao))*\s*(a|nhe|nhi)?\s*$")
_HOAN_CANH = re.compile(r"^(toi|minh|em|tui|chau|con)( (la|dang|moi|vua|nam nay|sinh|hoc|da|\d+ tuoi|nu|nam)\b)|^\d+ tuoi")


def dieu_hoi(t: str, raw: str | None = None, chuong: str | None = None) -> dict | None:
    """Điều được hỏi theo danh mục cố định: {"ma", "nhan", "mang"}; không nhận ra → None. `chuong` (chương đời sống
    phân loại của mảng đã chọn): trong các điều nhận ra, ưu tiên điều thuộc đúng chương đó (phân loại của mảng đã xét
    kỹ hơn — "gia đình nội ngoại có hỗ trợ không" là chuyện gia đình, không phải chuyện người giúp)."""
    ds = cac_dieu_hoi(t, raw)
    d0 = None
    if chuong:
        d0 = next((d for d in ds if chuong_cua(d) == chuong), None)
    d0 = d0 or (ds[0] if ds else None)
    if d0 and d0.get("nhan_ro"):
        # EN-3d: hai việc cụ thể khác mảng trong cùng câu ("vay ngân hàng mở shop") → nêu cả hai.
        kem = next((d for d in ds if d is not d0 and d["mang"] != d0["mang"] and d.get("nhan_ro")
                    and d["nhan_ro"].removeprefix("chuyện ") not in d0["nhan_ro"]), None)
        if kem:
            d0 = {**d0, "nhan_ro": f"{d0['nhan_ro']} và {kem['nhan_ro'].removeprefix('chuyện ')}"}
    return d0


# Mảng của điều được hỏi → chương báo cáo đời sống (Tử vi / Bát tự); một số mã có chương riêng.
CHUONG_THEO_MANG = {"cong_viec": "su_nghiep", "tien_bac": "tien_bac", "tinh_cam": "tinh_cam", "gia_dinh": "gia_dinh",
                    "con_cai": "gia_dinh", "suc_khoe": "suc_khoe", "hoc_hanh": "hoc_tap", "nha_cua": "nha_cua",
                    "di_xa": "quan_he", "quan_he": "quan_he", "phap_ly": None, "ban_than": "tong_quan"}
CHUONG_THEO_MA = {"ve_gia": "cuoc_doi", "tim_do": None, "dam_me": "tong_quan", "mua_xe": "tien_bac"}


def chuong_cua(dieu: dict | None) -> str | None:
    if not dieu:
        return None
    if dieu["ma"] in CHUONG_THEO_MA:
        return CHUONG_THEO_MA[dieu["ma"]]
    return CHUONG_THEO_MANG.get(dieu["mang"])


# ---------------------------------------------------------------- ghép câu
def cau(s: str | None, n: int = 1) -> str:
    """n câu đầu của `s` (cắt ở dấu chấm / hỏi / than + khoảng trắng); luôn kết bằng dấu chấm."""
    s = (s or "").strip()
    if not s:
        return ""
    ds = [c.strip() for c in re.split(r"(?<=[.!?])\s+", s) if c.strip()][:n]
    r = " ".join(ds)
    return r if r.endswith((".", "!", "?", ":")) else r + "."


def thuong(s: str) -> str:
    """Chữ đầu viết thường (giữ tên riêng viết hoa: chữ đầu viết hoa và chữ thứ hai cũng viết hoa thì giữ)."""
    s = s.strip()
    if not s:
        return s
    w = s.split()
    if len(w) > 1 and w[1][:1].isupper() and not w[1][:1].isdigit():
        return s
    return s[0].lower() + s[1:]


def bo_dau_cham(s: str) -> str:
    return s.strip().rstrip(".;: ")


def hoa(s: str) -> str:
    s = s.strip()
    return s[:1].upper() + s[1:] if s else s


def ghep(*phan: str | None) -> str:
    """Nối các vế thành câu: mỗi vế viết hoa chữ đầu, kết bằng dấu chấm."""
    out = []
    for p in phan:
        p = (p or "").strip()
        if not p:
            continue
        p = hoa(p)
        out.append(p if p.endswith((".", "!", "?", ":", "…")) else p + ".")
    return " ".join(out)


def dau_cau(dieu: dict | None, mac_dinh: str, moc: str | None = None) -> str:
    """"Về {điều được hỏi}{, mốc}" — nhãn từ danh mục cố định; không nhận ra thì dùng `mac_dinh` (tên mảng)."""
    nhan = (dieu or {}).get("nhan_ro") or (dieu or {}).get("nhan") or mac_dinh
    return f"Về {nhan}" + (f" {moc}" if moc else "")


# ---------------------------------------------------------------- đặt lên đầu, bỏ lặp
def _chuan(c: str) -> str:
    return " ".join(re.sub(r"[^\wÀ-ỹ ]", " ", c).lower().split())


def _cac_cau(van: str) -> list[str]:
    return [c for c in re.split(r"(?<=[.!?])\s+", van or "") if c.strip()]


_CHAN = (r"^Câu hỏi để tự soi", r"^Đây là góc nhìn tham khảo", r"^Bát trạch là một trường phái", r"^Lưu ý",
         r"^Lời này không thay", r"^Tham khảo văn hoá", r"^Mục này là quan niệm dân gian", r"^Phi tinh chỉ là",
         r"^Âm trạch là", r"^Màu sắc, hướng, nhóm nghề")


def _da_noi(c: str, da: str) -> bool:
    """Câu `c` (≥ 6 chữ, kể cả khi bỏ dần các tiền tố "Tiêu đề —" / "Gợi ý:") đã có nguyên văn trong đoạn mở đầu."""
    k = _chuan(c)
    if len(k.split()) >= 6 and k in da:
        return True
    for m in re.finditer(r"[:—]\s*", c[:120]):
        k2 = _chuan(c[m.end():])
        if len(k2.split()) >= 6 and k2 in da:
            return True
    return False


def so_la(mo: str | None, goi: dict) -> list[int]:
    """Con số trong đoạn mở đầu mà gói bằng chứng không có (bất biến của hỏi đáp: mọi số trong lời đáp phải có trong
    gói — `so_trong_goi`)."""
    duoc = set(goi.get("so_trong_goi") or [])
    return [int(n) for n in re.findall(r"\d+", mo or "") if int(n) not in duoc]


def dat_dau(van: str, mo: str | None, goi: dict | None = None) -> str:
    """Đặt đoạn mở đầu `mo` lên đầu `van`. Đoạn mở đầu TÓM các đoạn nó lấy chữ: câu (≥ 6 chữ) đã có nguyên văn trong
    `mo` bị bỏ ở phần dưới (không lặp); phần còn lại của đoạn đã tóm (chi tiết) dời xuống cuối thân bài, trước phần
    chân (tự soi, lưu ý, lời tham khảo) — các đoạn chưa nói tới giữ thứ tự ngay sau đoạn mở đầu. Không có `mo` → giữ
    nguyên."""
    if not mo or not van or (goi is not None and so_la(mo, goi)):
        return van
    da = _chuan(mo)
    than, sau, chan = [], [], []
    for p in van.split("\n\n"):
        if any(re.match(m, p) for m in _CHAN):
            chan.append(p)
            continue
        cac = _cac_cau(p)
        giu = [c for c in cac if not _da_noi(c, da)]
        if len(giu) == len(cac):
            (than if not chan else chan).append(p)   # đoạn chưa nói tới: giữ nguyên (cả xuống dòng bên trong)
            continue
        moi = " ".join(giu).strip()
        if not moi or re.fullmatch(r"[^.!?]{0,80}[:—]", moi) or len(moi.split()) < 4:
            continue
        # đoạn bị tóm phần lớn (≥ một nửa số câu) → phần chi tiết còn lại xuống dưới; tóm ít → giữ chỗ
        (sau if len(cac) - len(giu) >= len(cac) / 2 else (than if not chan else chan)).append(moi)
    return "\n\n".join([mo, *than, *sau, *chan])


# ---------------------------------------------------------------- câu không dựng đoạn mở đầu
# EN-3c (review độc lập): câu khủng hoảng quan hệ (ngoại tình, ly hôn, bạo hành…) — đoạn mở đầu nêu "mảng tình cảm ở mức
# thuận lợi" hay một việc vặt là lệch chủ đề, vô cảm. Không dựng đoạn mở đầu; phần thân giữ nguyên thứ tự cũ.
KHUNG_HOANG_QH = [r"ngoai tinh", r"ly (hon|di|than)", r"phan boi", r"bao (hanh|luc)", r"danh dap", r"(?<!\w)co bo",
                  r"(chong|vo|nguoi yeu|anh ay|co ay) (danh|bo roi|bo di|bo|lua doi|phan boi)( toi| em| minh)?(?!\w)",
                  r"(bi|dang bi) (danh|xam hai|hanh ha)", r"(?<!\w)cam sung", r"nguoi thu ba", r"(?<!\w)tieu tam"]


DONG_CAM_QH = ("Chuyện bạn đang trải qua rất nặng lòng. Không lá số, quẻ hay con số nào quyết thay bạn việc giữ hay buông; "
               "phần dưới chỉ gợi một cách nhìn để bạn tự cân nhắc. Nếu có bạo lực hoặc bạn thấy không an toàn, hãy ưu tiên "
               "an toàn của mình và tìm một người tin cậy để cùng tính.")


def dong_cam(dieu: dict | None) -> str:
    """Câu đồng cảm cho câu khủng hoảng quan hệ; gọi tên điều được hỏi (nhãn danh mục) khi nhận ra."""
    nhan = (dieu or {}).get("nhan_ro") or ((dieu or {}).get("nhan") if (dieu or {}).get("mang") == "tinh_cam" else None)
    return DONG_CAM_QH if not nhan else DONG_CAM_QH.replace("Chuyện bạn đang", hoa(nhan) + " bạn đang", 1)


def khong_mo(t: str) -> bool:
    return _co(t, KHUNG_HOANG_QH)


# ---------------------------------------------------------------- lời cố định của đoạn mở đầu
KHONG_QUYET = "Lá số không quyết thay bạn; nó cho biết nhịp để bạn chọn cách làm và lúc làm."
KHONG_QUYET_QUE = "Quẻ không quyết thay bạn; nó cho biết thế của việc lúc này để bạn chọn cách làm."
KHONG_QUYET_SO = "Con số không quyết thay bạn; nó cho biết nhịp và điểm mạnh để bạn chọn cách làm."
# EN-3c: điều được hỏi là đầu tư → ranh giới tài chính ngay trong đoạn mở đầu (một nguồn với báo cáo đời sống).
KHONG_DAU_TU = "Đây không phải lời khuyên đầu tư; mua bán, vay, góp vốn hãy tính bằng con số thật."
_DAU_TU = [r"(?<!bat )dau tu", r"chung khoan", r"co phieu", r"\bcoin\b", r"tien ao", r"crypto", r"(mua|ban|tich|luot) vang",
           r"vang (mieng|nhan|sjc)", r"gui tiet kiem", r"luot song", r"gop von"]


def hoi_dau_tu(t: str, dieu: dict | None = None) -> bool:
    return (dieu or {}).get("ma") == "dau_tu" or _co(t, _DAU_TU)


def la_quyet_dinh(t: str) -> bool:
    """Câu hỏi một quyết định lớn ("có nên … không", "… hay …") — đoạn mở đầu không trả lời có / không."""
    from app.hoidap import hieu_cau  # noqa: PLC0415
    return hieu_cau.kieu(t) in ("co_nen", "so_sanh")


# ---------------------------------------------------------------- Tử vi · Bát tự (mức chương đời sống, mức từng năm)
_NGUON = {"tuvi": "trên lá số", "battu": "theo tứ trụ"}


# EN-3c: chương "Gia đình" gộp cha mẹ, anh em, con cái — việc nên làm phải lấy từ hộp đúng người được hỏi (mã kiểm chứng
# `ma_mau` mang cung Tử vi / nhóm thập thần Bát tự); không có hộp khớp → không nêu "Việc nên làm" (không mượn hộp người khác).
_HOP_KHOP = {"con_cai": ("tu_nu", ".thuc", "thuc_", ".thuong", "thuong_", ".con", "con_", "gio"),
             "bo_me": ("phu_mau", ".an", "an_", "nam_thang", ".me", ".cha"),
             "anh_em": ("huynh_de", "ty_kiep", ".kiep", "kiep_", ".ty", "ty_")}


def _hop_khop(ds: dict, dieu: dict | None) -> dict:
    """`ds` chỉ giữ các hộp khớp điều được hỏi khi điều đó là một người trong chương gia đình."""
    khoa = _HOP_KHOP.get((dieu or {}).get("ma") or "")
    if not khoa or ds.get("chuong") != "gia_dinh":
        return ds
    return {**ds, "hop": [h for h in ds.get("hop") or [] if any(k in (h.get("ma_mau") or "") for k in khoa)]}


def _viec_hop(ds: dict) -> str:
    for h in ds.get("hop") or []:
        v = h.get("huong_xu_ly") or h.get("loi_khuyen")
        if v:
            return cau(v)
    for h in ds.get("hop") or []:
        if h.get("loai") == "loi_khuyen" and h.get("noi_dung"):
            return cau(h["noi_dung"])
    return ""


def _ly_do(ds: dict) -> str:
    tt = ds.get("tom_tat") or ""
    if tt:
        return cau(tt)
    for h in ds.get("hop") or []:
        if h.get("noi_dung"):
            return cau(h["noi_dung"])
    return ""


def _nam_txt(sn: dict) -> tuple[str, str]:
    ds = sn["nam"]
    moc = "năm " + " và ".join(str(x["nam"]) for x in ds)
    cac = [f"năm {x['nam']} ({x['can_chi']}) {x['nhan_muc'].lower()}" for x in ds]
    s = "mức chung của " + ", ".join(cac)
    if len(ds) >= 2:
        thu = {"thuan": 2, "can_bang": 1, "can_chu_dong": 0}
        muc = {thu.get(x["muc"], 1) for x in ds}
        if len(muc) > 1:
            tot = max(ds, key=lambda x: thu.get(x["muc"], 1))
            s += f" — năm {tot['nam']} nhỉnh hơn"
        else:
            s += " — hai năm ngang nhau"
    return moc, s


def _ngu_hanh_cau(muc: list[dict]) -> tuple[str, str]:
    """Bát tự: (câu dữ kiện ngũ hành, việc bù hành thiếu) từ mục `ngu_hanh` + `hanh` đã có trong gói."""
    nh = next((m for m in muc if m.get("loai") == "ngu_hanh"), None)
    if not nh:
        return "", ""
    s = f"tứ trụ của bạn nhiều nhất hành {nh['nhieu_nhat']}"
    if nh.get("thieu"):
        s += f", thiếu hẳn hành {', '.join(nh['thieu'])}"
    kl = (nh.get("than") or {}).get("ket_luan")
    nc = next((m for m in muc if m.get("loai") == "nhat_chu"), None)
    ten_nc = f"nhật chủ {nc['can']}, " if nc else ""
    if kl:
        s += {"nhược": f"; sức tự thân yếu ({ten_nc}thân nhược)", "vượng": f"; sức tự thân mạnh ({ten_nc}thân vượng)"}.get(
            kl, f"; sức tự thân {kl}")
    th = next((m for m in muc if m.get("loai") == "hanh" and m.get("vai") == "thieu"), None)
    # EN-3c (review): ứng dụng dân gian (màu, hướng, nghề) chỉ là tham khảo — KHÔNG thành "Việc nên làm: bù hành X" (dụng
    # thần luôn trình bày hai cách, hệ thống không tự chọn hành cần bù).
    tk = ""
    if th and th.get("ung_dung"):
        tk = (f"dân gian gắn hành {th['hanh']} với {thuong(bo_dau_cham(th['ung_dung']))} — chỉ để tham khảo; nên bù hành "
              f"nào còn tuỳ cách lấy dụng thần, hai cách được trình bày bên dưới")
    return s, tk


def _dai_van_cau(muc: list[dict]) -> str:
    ht = next((m for m in muc if m.get("loai") == "dai_van" and m.get("vai") == "hien_tai"), None)
    kt = next((m for m in muc if m.get("loai") == "dai_van" and m.get("vai") != "hien_tai"), None)
    if not ht and not kt:
        return ""
    phan = []
    if ht:
        phan.append(f"giai đoạn mười năm bạn đang đi (đại vận {ht['can']} {ht['chi']}, {ht['tu_nam']}–{ht['den_nam']}) "
                    f"nghiêng về {thuong(bo_dau_cham(ht['y_tt']))}")
    if kt:
        phan.append(f"giai đoạn kế tiếp bắt đầu năm {kt['tu_nam']} (đại vận {kt['can']} {kt['chi']}), nghiêng về "
                    f"{thuong(bo_dau_cham(kt['y_tt']))}")
    return "; ".join(phan)


def _ngay_vn(iso: str) -> str:
    y, m, d = iso.split("-")
    return f"{int(d)}/{int(m)}"


def _ten_thang_am(x: dict) -> str:
    ten = {1: " (tháng Giêng)", 12: " (tháng Chạp)"}.get(x["thang"], "") if not x.get("nhuan") else ""
    return f"tháng {x['thang']}{' nhuận' if x.get('nhuan') else ''} âm{ten}"


def _thang_cau(muc: list[dict]) -> tuple[str | None, str, str]:
    """Tử vi: (mốc, câu nhịp tháng, việc) từ mục lưu nguyệt (một tháng được hỏi) hoặc nhịp 3 tháng tới."""
    ln = next((m for m in muc if m.get("loai") == "luu_nguyet" and m.get("thang")), None)
    if ln:
        ket = (ln.get("xu_huong") or {}).get("ket")
        moc = f"{_ten_thang_am(ln)} (từ {_ngay_vn(ln['tu'])} đến {_ngay_vn(ln['den'])} dương lịch)"
        return moc, (f"trên lá số, nhịp riêng của tháng này nghiêng về {ket}" if ket else ""), ""
    nh = next((m for m in muc if m.get("loai") == "nhip_3_thang" and m.get("thang")), None)
    if nh:
        ds = "; ".join(f"{_ten_thang_am(x)} — {x['nhan_muc'].lower()} ({thuong(bo_dau_cham(x['tieu_de_thang']))})"
                       for x in nh["thang"])
        can = next((x for x in nh["thang"] if x.get("muc") == "can_than"), None)
        viec = cau(can["goi_y"]) if can else ""
        return f"trong {nh['so_thang']} tháng tới", f"trên lá số, {ds}", viec
    return None, "", ""


def doi_song_mo(goi: dict, t: str, mon: str, raw: str | None = None) -> str | None:
    """Đoạn mở đầu Tử vi / Bát tự: điều được hỏi + mức năm (khi hỏi năm) / tháng thuận (khi hỏi khung tháng) + mức mảng
    đời sống + một lý do + một việc. Chỉ từ các mục đã có trong gói (`so_nam`, `cua_so`, `doi_song`; Bát tự thêm
    `ngu_hanh`/`hanh` khi hỏi hành, `dai_van` khi hỏi vận)."""
    muc = goi.get("muc") or []
    if goi.get("can_them") or not muc or any(m.get("loai") == "sao_han" for m in muc[:2]):
        return None
    pl = goi.get("phan_loai") or {}
    if any(m.get("loai") == "cua_so" for m in muc[:2]):
        return None                                 # EN-5: đoạn "cửa sổ quyết định" đã đứng đầu, trả lời đúng khung tháng
    ds = next((m for m in muc if m.get("loai") == "doi_song" and m.get("nhan_muc")), None)
    sn = next((m for m in muc if m.get("loai") == "so_nam" and m.get("nam")), None)
    cs = next((m for m in muc if m.get("loai") == "cua_so"), None)
    if khong_mo(t):
        return dong_cam(dieu_hoi(t, raw))           # câu trung tính, đồng cảm — không nêu mức, không "việc nên làm"
    nh_cau, nh_tk = _ngu_hanh_cau(muc) if (mon == "battu" and pl.get("chu_de") == "ngu_hanh") else ("", "")
    dv_cau = _dai_van_cau(muc) if (mon == "battu" and pl.get("loai") == "van" and re.search(r"dai van|\bvan\b", t)) else ""
    if ds and sn and ds.get("chuong") in ("nam_nay", "cuoc_doi"):
        ds = None                                   # "năm nay" của báo cáo không phải năm được hỏi
    if ds and dv_cau and ds.get("chuong") == "nam_nay" and not _co(t, [r"nam (nay|sau|toi)", r"luu nien", r"nam \d{4}"]):
        ds = None                                   # EN-3c: hỏi giai đoạn mười năm — mức "năm nay" không phải điều được hỏi
    th_moc, th_cau, th_viec = _thang_cau(muc) if mon == "tuvi" else (None, "", "")
    if not (ds or sn or cs or nh_cau or dv_cau or th_cau):
        return None
    dieu = dieu_hoi(t, raw, (ds or {}).get("chuong"))
    if ds:
        ds = _hop_khop(ds, dieu)
    nguon = _NGUON.get(mon, "trên lá số")
    moc, phan = None, []
    if nh_cau:
        phan.append(nh_cau)
    if nh_tk:
        phan.append(nh_tk)
    if dv_cau:
        phan.append(dv_cau)
    if th_cau:
        phan.append(th_cau)
        moc = th_moc
    if sn and not th_cau:
        moc, s = _nam_txt(sn)
        phan.append(f"{nguon}, {s}")
    elif cs and not th_cau:
        moc = f"trong {cs['so_thang']} tháng tới"
        th = ", ".join(x["ten"] for x in cs.get("thuan") or [])
        ch = ", ".join(x["ten"] for x in cs.get("cham") or [])
        s = f"{nguon}, " + (f"tháng thuận hơn là {th}" if th else "không tháng nào nổi hẳn")
        if ch:
            s += f"; tháng nên đi chậm là {ch}"
        phan.append(s)
    if ds:
        tt = ds.get("tom_tat") or ""
        if "ở mức" in tt:
            ly, muc_cau = "", cau(tt)
        else:
            ly = _ly_do(ds)
            muc_cau = (f"riêng mảng {ds['ten_mang']} {nguon} gốc ở mức {ds['nhan_muc']}" if (sn or cs or th_cau)
                       else f"{nguon}, mảng {ds['ten_mang']} của bạn ở mức {ds['nhan_muc']}")
        phan.append(muc_cau)
        if ly:
            phan.append(ly)
    v = th_viec or (_viec_hop(ds) if ds else "")
    if v:
        phan.append("Việc nên làm: " + thuong(v))
    if ds and ds.get("chuong") == "suc_khoe":
        # SK-1 (2026-11-04): năm nên chú ý sức khoẻ (hộp của chương, cùng hàm báo cáo) nói ngay ở đoạn mở đầu.
        from app.luangiai import suc_khoe_nam as _skn  # noqa: PLC0415
        hn = next((h for h in ds.get("hop") or [] if h.get("tieu_de") == _skn.TIEU_DE_HOP), None)
        if hn:
            phan.append(hn["noi_dung"].replace(_skn.mien_tru(), "").strip())
    cy = next((m for m in muc if m.get("ma") == "chu_y_nam" and m.get("lo_ro") and m.get("cau_nam")), None)
    if cy:
        # CY-1: câu hỏi về điều người dùng lo → năm nên chú ý của mảng nói ngay ở đoạn mở đầu (cùng mục, cùng hàm báo cáo)
        phan.append(cy["cau_nam"])
    if ds and ds.get("chuong") == "suc_khoe" or (dieu or {}).get("mang") == "suc_khoe":
        from app.kb import tuvi_doi_song_kb as _kbds  # noqa: PLC0415
        phan.append(_kbds.suc_khoe_chung())          # câu miễn trừ cố định (một nguồn với báo cáo đời sống)
    if hoi_dau_tu(t, dieu):
        phan.append(KHONG_DAU_TU)
    if la_quyet_dinh(t):
        phan.append(KHONG_QUYET)
    if dieu and ds and chuong_cua(dieu) and chuong_cua(dieu) != ds.get("chuong") and not (sn or th_cau or cs):
        dieu = None
    if dieu:
        dau = dau_cau(dieu, "", moc)
    elif dv_cau and not ds:
        dau = "Về giai đoạn mười năm của bạn"
    elif nh_cau:
        dau = "Về ngũ hành của bạn"
    elif moc and (not ds or ds.get("chuong") in ("nam_nay", "cuoc_doi")):
        dau = f"Về {moc}"
    else:
        dau = dau_cau(None, ds["ten_mang"] if ds else "việc bạn hỏi", moc)
    return f"{dau}: {thuong(ghep(*phan))}"


# ---------------------------------------------------------------- Kinh Dịch (gói đọc quẻ đời thường `doc_que`)
def que_mo(dq: dict | None, t: str, raw: str | None = None, moc: str | None = None) -> str | None:
    """Điều được hỏi + mức quẻ (theo phái đang đọc) + nghĩa của mức + hình ảnh quẻ + việc đầu của nhóm việc đúng mức.
    Mọi chữ lấy từ `doc_que` (KB `kinhdich_doi_song` + "Hiểu đơn giản" của quẻ)."""
    if khong_mo(t):
        return dong_cam(dieu_hoi(t, raw))
    if not dq or not dq.get("nhan_muc"):
        return None
    from app.luangiai import kinhdich_doi_song as kd  # noqa: PLC0415
    dieu = dieu_hoi(t, raw)
    cd = dq.get("chu_de") or {}
    ten_cd = "việc bạn hỏi" if cd.get("ma") in (None, "khac") else "chuyện " + thuong(cd["ten"].split(" (")[0])
    kl = (dq.get("ket_luan") or "").split(": ", 1)[-1]
    so = None
    for h in dq.get("hop") or []:
        m = re.search(r"\.q(\d+)\.", h.get("ma_mau") or "")
        if m:
            so = int(m.group(1))
            break
    ten = next((h["tieu_de"].split(" — ")[0] for h in dq.get("hop") or [] if h.get("loai") == "cot_loi"), "Quẻ")
    hdg = kd.hieu_don_gian(so) if so else None
    viec = next((x["viec"][0] for x in dq.get("hanh_dong") or [] if x.get("muc") == dq["muc"] and x.get("viec")), "")
    phan = [f"{thuong(ten)} nghiêng về mức {dq['nhan_muc'].lower()}", kl]
    if hdg:
        phan.append("Hiểu đơn giản: " + hdg)
    if viec:
        phan.append("Việc nên làm: " + thuong(viec))
    if moc:
        phan.append("Kinh Dịch xem thế của việc ở lúc gieo, không chấm riêng từng tháng hay từng năm — nếu đang cân "
                    "hai mốc, chọn mốc bạn chuẩn bị kịp hơn")
    if hoi_dau_tu(t, dieu):
        phan.append(KHONG_DAU_TU)
    if la_quyet_dinh(t):
        phan.append(KHONG_QUYET_QUE)
    dau = dau_cau(dieu, ten_cd, f"vào {moc}" if moc else None)
    return f"{dau}: {thuong(ghep(*phan))}"


# ---------------------------------------------------------------- Thần số (mục KB của gói, đúng con số của người hỏi)
# Điều được hỏi → câu của bảng nỗi đau (`thanso_noi_dau.json`) có các chỉ số trả lời đúng điều đó (KB, không đoán).
NOI_DAU_THEO_MA = {"doi_viec": "sn_doi_viec", "kinh_doanh": "sn_kinh_doanh", "chon_nghe": "sn_sai_nghe",
                   "giu_tien": "sn_tien_bac", "tu_tin": "bt_tu_ti", "tinh_khi": "bt_cam_xuc",
                   "dam_me": "bt_diem_manh", "bo_me": "tc_bo_me", "ten_goi": "bh_ten"}
_VI_TRI = {"duong_doi": "số chủ đạo (đường đời)", "su_menh": "số sứ mệnh", "linh_hon": "số linh hồn",
           "nhan_cach": "số nhân cách"}


def _so_phan(m: dict) -> tuple[str, str, str] | None:
    """Mục bằng chứng thần số → (điều chính, điều dễ vấp, việc nên làm); None với mục không nói về chính người hỏi."""
    l = m.get("loai")
    if m.get("vai", "ban") != "ban":
        return None
    if l == "linh_vuc":
        vt = _VI_TRI.get(m.get("vi_tri") or "", "con số")
        return f"nhìn từ {vt} {m['so']} của bạn, {thuong(bo_dau_cham(m['xu_huong']))}", m.get("mat_toi", ""), m.get("goi_y", "")
    if l == "chan_dung":
        so = m["so"]
        if m.get("mat") == "cong_viec":
            return (f"số chủ đạo {so} của bạn mạnh ở {thuong(bo_dau_cham(m['the_manh']))}", m.get("cai_bay", ""),
                    f"chọn môi trường {thuong(bo_dau_cham(m['moi_truong']))}" if m.get("moi_truong") else "")
        if m.get("mat") == "tinh_cam":
            return (f"với số chủ đạo {so}, {thuong(bo_dau_cham(m['cach_yeu']))}", m.get("dau_hieu_lech", ""),
                    f"nói rõ điều bạn cần: {thuong(bo_dau_cham(m['can_duoc']))}" if m.get("can_duoc") else "")
        dm = (m.get("diem_mu") or [""])[0]
        return f"với số chủ đạo {so}, {thuong(bo_dau_cham(cau(m.get('chan_dung'))))}", dm, m.get("khi_cang_thang", "")
    if l == "thu_thach":
        return (f"thử thách chính của bạn là số {m['so']} ({thuong(bo_dau_cham(m['mo_ta']))}): "
                f"{thuong(bo_dau_cham(cau(m['y_nghia'])))}", "", m.get("cach_vuot", ""))
    if l == "o_so":
        lan = "không có" if m["so_lan"] == 0 else f"có {m['so_lan']} lần"
        return (f"ô số {m['so']} ({thuong(bo_dau_cham(m['y_nghia_o']))}) trong ngày sinh của bạn {lan}: "
                f"{thuong(bo_dau_cham(m['mo_ta']))}", "", "")
    if l == "mui_ten":
        return f"{m['ten']} trong biểu đồ ngày sinh: {thuong(bo_dau_cham(m['y_nghia']))}", m.get("mat_toi", ""), m.get("goi_y", "")
    if l == "dinh_cao" and (m.get("hien_tai") or m.get("_tiep")):
        den = f"{m['tu_tuoi']}–{m['den_tuoi']} tuổi" if m.get("den_tuoi") else f"từ {m['tu_tuoi']} tuổi"
        dang = "giai đoạn kế tiếp của bạn là" if m.get("_tiep") else "bạn đang ở"
        return (f"{dang} đỉnh cao {m['dinh']} (số {m['so']}, {den}) — {thuong(bo_dau_cham(m['chu_de']))}: "
                f"{thuong(bo_dau_cham(cau(m['y_nghia'])))}", m.get("bong_toi", ""), "")
    if l == "no_nghiep":
        return f"{m['ten']}: {thuong(bo_dau_cham(cau(m['y_nghia'])))}", "", m.get("goi_y", "")
    if l == "ngay_sinh" and m.get("noi_dung"):
        nd = re.sub(r"^[Nn]gày \d+\s*:\s*", "", m["noi_dung"])
        return f"số ngày sinh {m.get('ngay')} của bạn cho thấy {thuong(bo_dau_cham(cau(nd, 2)))}", "", ""
    if l in ("bai_hoc_nghiep", "thai_do", "truong_thanh") and m.get("noi_dung"):
        return thuong(bo_dau_cham(cau(m["noi_dung"], 2))), "", ""
    return None


def _nen_cau(nen: str) -> str:
    nen = bo_dau_cham(nen or "")
    if not nen:
        return ""
    return f"Nhịp này {thuong(nen)}" if nen.lower().startswith("hợp") else "Nên: " + thuong(nen)


_THOI = ("ngay_ca_nhan", "thang_ca_nhan", "nam_ca_nhan")


def _so_thoi(muc: list[dict], doan_fn) -> list[str] | None:
    """Câu hỏi có mốc: lời ngày / tháng / năm cá nhân của đúng mốc (nhỏ trước lớn), nguyên văn đoạn của thân bài."""
    ds = [m for loai in _THOI for m in muc if m.get("loai") == loai][:3]
    if not ds or doan_fn is None:
        return None
    ra = [doan_fn(m) for m in ds]
    return [x for x in ra if x] or None


_HOI_TRONG = [r"\btrong\b", r"thieu (so|o)", r"so (thieu|vang)", r"vang (so|mat)"]


def so_mo(goi: dict, t: str, raw: str | None = None, ngay_xem=None, dau_muc: dict | None = None,
          them: list[dict] | None = None, doan_fn=None) -> str | None:
    """Đoạn mở đầu Thần số: điều được hỏi + điều con số của chính bạn nói về nó + điều dễ vấp + một việc nên làm.

    Đoạn mở đầu VIẾT LẠI đoạn đầu của thân bài (`dau_muc` = mục làm ra đoạn đó) cho đúng điều được hỏi, nên đoạn đó
    được tóm trọn và không lặp ở dưới. `them` = mục KB của đúng điều được hỏi (bảng nỗi đau / lĩnh vực của điều hỏi,
    theo con số của chính người hỏi) mà gói chưa có — nêu MỘT câu chính lên trước."""
    muc = goi.get("muc") or []
    pl = goi.get("phan_loai") or {}
    if goi.get("can_them") or not muc or pl.get("xu_ly") not in ("tra_loi", "tra_loi_kem_luu_y") \
            or pl.get("doi_tuong") not in (None, "ban_than") or pl.get("linh_vuc") in ("ky_thuat", "hop_doi") \
            or goi.get("thu_tu_co_dinh"):            # câu bấm từ bảng nỗi đau: đã trả lời đúng chỉ số của thẻ
        return None
    if khong_mo(t):
        return dong_cam(dieu_hoi(t, raw))
    from app.hoidap import hieu_cau  # noqa: PLC0415
    dieu = dieu_hoi(t, raw)
    if hieu_cau.kieu(t) == "kien_thuc" or (not dieu and _co(t, [r"(?<!\w)(nguoi )?so (chu dao |duong doi )?\d{1,2}(?!\d)"])):
        return None                      # câu kiến thức / câu CHỈ về một con số được nêu tên: phần dưới đã trả lời thẳng
        #                                  (EN-3d: có điều được hỏi — "tôi số 1 hay nóng với đồng nghiệp" — vẫn mở đầu,
        #                                  gói đã dùng đúng con số người hỏi nêu)
    moc = None
    tg = hieu_cau.thoi_gian(t, ngay_xem or _ngay_xem(goi))
    hoi_moc = bool(tg) or _co(t, [r"(nam|thang|ngay) ca nhan", r"nam nay", r"thang nay", r"hom nay", r"ngay mai"])
    phan: list[str] = []
    ba = _so_thoi(muc, doan_fn) if hoi_moc else None
    if ba:
        if tg:
            x = tg[0]
            moc = f"tháng {x['thang']}/{x['nam']}" if x.get("thang") else f"năm {x['nam']}"
        phan += ba
        cy = next((m for m in muc if m.get("ma") == "chu_y_nam" and m.get("lo_ro") and m.get("cau_nam")), None)
        if cy:                              # CY-1: năm nên chú ý của mảng nói ngay ở đoạn mở đầu
            phan.append(bo_dau_cham(cy["cau_nam"]))
        if hoi_dau_tu(t, dieu):
            phan.append(KHONG_DAU_TU)
        if la_quyet_dinh(t):
            phan.append(KHONG_QUYET_SO)
        return f"{dau_cau(dieu, _TEN_LV.get(pl.get('linh_vuc') or '', 'con số của bạn'), moc)}: {ghep(*phan)}"
    else:
        ung = []
        if _co(t, [r"tiep theo", r"ke tiep", r"sap toi", r"sau nay"]):      # đỉnh cao TIẾP THEO (sau giai đoạn hiện tại)
            dc = [m for m in muc if m.get("loai") == "dinh_cao"]
            i = next((k for k, m in enumerate(dc) if m.get("hien_tai")), None)
            if i is not None and i + 1 < len(dc):
                ung.append({**dc[i + 1], "_tiep": True})
        if _co(t, _HOI_TRONG):              # hỏi số trống / mũi tên trống → ô / mũi tên trống trước
            ung += [m for m in muc if (m.get("loai") == "o_so" and m.get("so_lan") == 0)
                    or (m.get("loai") == "mui_ten" and m.get("trong"))]
        x_them = next((p for p in (_so_phan(m) for m in (them or [])) if p), None)
        if x_them and not ung:
            phan.append(x_them[0])          # một câu chính từ đúng điều được hỏi
        nguon = ung + ([dau_muc] if dau_muc else []) + muc
        x = next((p for p in (_so_phan(m) for m in nguon) if p), None)
        if not x:
            x = x_them
        if not x:
            return None
        chinh, vap, viec = x
        if x is not x_them or not phan:
            phan.append(chinh)
        phan += [("Dễ vấp: " + thuong(bo_dau_cham(vap))) if vap else "",
                 ("Việc nên làm: " + thuong(bo_dau_cham(viec))) if viec else ""]
    cy = next((m for m in muc if m.get("ma") == "chu_y_nam" and m.get("lo_ro") and m.get("cau_nam")), None)
    if cy:                                  # CY-1: năm nên chú ý của mảng nói ngay ở đoạn mở đầu
        phan.append(bo_dau_cham(cy["cau_nam"]))
    if (dieu or {}).get("mang") == "suc_khoe":
        phan.append("Lời này không thay lời bác sĩ hay chuyên gia tâm lý")      # câu cố định của thần số
    if hoi_dau_tu(t, dieu):
        phan.append(KHONG_DAU_TU)
    if la_quyet_dinh(t):
        phan.append(KHONG_QUYET_SO)
    dau = dau_cau(dieu, _TEN_LV.get(pl.get("linh_vuc") or "", "con số của bạn"), moc)
    return f"{dau}: {thuong(ghep(*phan))}"


_TEN_LV = {"ban_than": "con người bạn", "su_nghiep": "công việc", "tai_chinh": "chuyện tiền bạc", "tinh_yeu": "tình cảm",
           "gia_dinh": "gia đình", "con_cai": "con cái", "suc_khoe": "sức khoẻ và nhịp sống", "hoc_tap": "học tập",
           "ban_be_xa_hoi": "bạn bè và các mối quan hệ", "cuoc_song": "nhịp sống", "thoi_van": "thời điểm",
           "tam_linh": "bài học của bạn", "ten_goi": "tên gọi"}


def _ngay_xem(goi: dict):
    import datetime as _dt  # noqa: PLC0415
    from app.config import hom_nay_vn  # noqa: PLC0415
    x = goi.get("ngay_xem")
    return _dt.date.fromisoformat(x) if isinstance(x, str) else (x or hom_nay_vn())


# ---------------------------------------------------------------- Phong thuỷ (mục KB bố trí, hướng theo mệnh quái, năm)
def _pt_bo_tri(m: dict) -> list[str]:
    """Một tình huống bố trí, viết lại cả đoạn KB theo thứ tự trả lời trước: (nhóm nên xử lý trước — chỉ khi KB gắn
    `veto`) → lý do đời sống → việc không tốn tiền làm trước → quan niệm (sách xưa / dân gian) → gợi ý thêm. Tình huống
    không `veto` không gắn nhãn tốt / xấu."""
    v0 = next((v["lam"] for v in (m.get("viec") or []) if v.get("chi_phi") == "khong_ton"), None)
    phan = ["đây là nhóm nên xử lý trước" if m.get("veto") else ""]
    if m.get("giai_thich_hien_dai"):
        phan.append(m["giai_thich_hien_dai"])
    if v0:
        phan.append("Việc không tốn tiền làm trước: " + thuong(bo_dau_cham(v0)))
    if m.get("noi_dung"):
        nhan = "Quan niệm dân gian" if m.get("nguon") == "dan_gian" else "Theo sách"
        nd = m["noi_dung"].strip()
        phan.append(nd if re.match(r"(Quan niệm|Theo|Loan đầu|Bát trạch|Dương trạch)", nd) else f"{nhan}: {nd}")
    if m.get("goi_y"):
        phan.append("Gợi ý thực tế: " + m["goi_y"].strip())
    return phan


def _trong_ngoac(x: str) -> str:
    k = re.search(r"\(([^)]+)\)", x)
    return k.group(1) if k else x


def pt_mo(goi: dict, t: str, raw: str | None = None) -> str | None:
    """Đoạn mở đầu Phong thuỷ: tình huống / hướng / năm được hỏi + kết luận + một lý do + một việc nên làm."""
    muc = goi.get("muc") or []
    pl = goi.get("phan_loai") or {}
    if goi.get("can_them") or not muc or pl.get("xu_ly") not in ("tra_loi", "tra_loi_kem_luu_y") \
            or any(m.get("loai") == "sao_han" for m in muc[:1]):
        return None
    from app.hoidap import hieu_cau  # noqa: PLC0415
    if hieu_cau.kieu(t) == "kien_thuc" and pl.get("loai") not in ("bo_tri", "nam", "huong_ca_nhan"):
        return None
    loai = pl.get("loai")
    dieu = dieu_hoi(t, raw)
    mq = next((m for m in muc if m.get("loai") == "menh_quai" and not m.get("vai")), None)
    phan: list[str] = []
    dau = None
    if loai == "bo_tri":
        bt = next((m for m in muc if m.get("loai") == "bo_tri"), None)
        if not bt:
            return None
        phan += _pt_bo_tri(bt)
        if mq and _co(t, [r"(?<!anh )huong (nao|gi)", r"quay (ve |mat )?(huong|ve)", r"xoay (ve|huong)", r"(dat|ke) .{0,20}huong"]):
            phan.append(f"Theo mệnh quái {mq['quai']} của bạn, các hướng hợp: {', '.join(mq['tot'])}")
        dau = bt["tieu_de"]                      # tên tình huống giữ nguyên chữ của KB (đầu đoạn như mục KB)
    elif loai == "huong_ca_nhan" and mq:
        dn = [m for m in muc if m.get("loai") == "du_nien" and m.get("huong")]
        tot = ", ".join(mq["tot"])
        if dn:
            for d in dn[:2]:
                kieu_h = "hướng tốt" if d.get("cat_hung") == "cát" else "hướng kém hợp"
                phan.append(f"với mệnh quái {mq['quai']} của bạn, hướng {d['huong']} là {d['ten']} — {kieu_h}: "
                            f"{thuong(bo_dau_cham(cau(d['y_nghia'])))}")
            if any(d.get("cat_hung") != "cát" for d in dn):
                phan.append(f"Hướng hợp hơn của bạn: {tot}")
                phan.append("Việc nên làm: nếu không đổi được hướng nhà, xoay bàn làm việc, đầu giường, miệng bếp về một "
                            "trong các hướng hợp đó")
            else:
                phan.append(f"Hợp dùng cho: {thuong(bo_dau_cham(dn[0]['dung_cho']))}")
            dau = "Về hướng " + " và ".join(d["huong"] for d in dn[:2])
        else:
            gy = next((m for m in muc if m.get("loai") == "goi_y_vi_tri"), None)
            phan.append(f"mệnh quái của bạn là {mq['quai']} ({mq['nhom']}); bốn hướng hợp: {tot}")
            phan.append(f"Hướng nên tránh cho cửa chính, đầu giường: {', '.join(_trong_ngoac(x) for x in mq['xau'])}")
            if gy:
                phan.append(f"Riêng {gy['doi_tuong']}: {bo_dau_cham(cau(gy['noi_dung']))}")
            dau = dau_cau(dieu, "hướng hợp với bạn")
    elif loai == "nam":
        sn = next((m for m in muc if m.get("loai") == "sao_nam"), None)
        tl = [m for m in muc if m.get("loai") == "tuoi_lam_nha"]
        moc = None
        for x in tl[:3]:
            kl, ho, tt = x["kim_lau"], x["hoang_oc"], x["tam_tai"]
            pham = [n for n in ((f"Kim lâu {kl['ten']}" if kl else ""),
                                (f"năm thứ {tt['nam_thu']} của Tam tai" if tt else "")) if n]
            ket = "theo tập quán, năm này làm nhà thuận" if x.get("ket_ma") == "thuan" else \
                "dân gian thường tránh làm nhà năm này"
            phan.append(f"năm {x['nam_xem']} bạn {x['tuoi_mu']} tuổi mụ"
                        + (f", phạm {', '.join(pham)}" if pham else ", không phạm Kim lâu, Tam tai")
                        + f", Hoang ốc {ho['ten']} — {ket}")
            if x.get("ket_ma") != "thuan" and x.get("nam_thuan"):
                nt = x["nam_thuan"][0]
                phan.append(f"Năm gần nhất không phạm: {nt['nam']} ({nt['can_chi']})")
        if tl:
            moc = "năm " + " và ".join(str(x["nam_xem"]) for x in tl[:3])
        if sn:
            ph = (f"Năm {sn['nam']}, phương nên giữ yên, không đục phá lớn: Ngũ Hoàng ở {sn['ngu_hoang']}, "
                  f"Thái Tuế ở {sn['thai_tue']}, Tam Sát ở {sn['tam_sat']}")
            hoi_phuong = _co(t, [r"huong", r"phuong", r"(?<!\w)sao (gi|nao|xau)", r"ngu hoang", r"thai tue", r"tam sat"])
            phan.insert(0, ph) if hoi_phuong else phan.append(ph)
            moc = moc or f"năm {sn['nam']}"
        if not phan:
            return None
        phan.append("Lời này theo tập quán dân gian, để bạn chọn lúc và chỗ làm cho yên tâm")
        dau = dau_cau(dieu, "việc làm nhà", moc)
    elif loai == "cua_bep":
        cb = next((m for m in muc if m.get("loai") == "cua_chu_bep"), None)
        if not cb:
            return None
        ds = "; ".join(f"{c['cap']} ({c['tu']} → {c['den']}) là {c['du_nien']}" for c in cb["cap"])
        phan.append(f"theo Bát trạch, {ds}")
        phan.append("Cùng nhóm Đông/Tây — thuận" if cb["cung_nhom"] else
                    "Khác nhóm Đông/Tây — kém thuận. Việc nên làm: xoay miệng bếp về một hướng tốt, không cần đập bếp")
        dau = "Về cửa chính và bếp"
    elif loai == "hop":
        sn = next((m for m in muc if m.get("loai") == "so_nhom"), None)
        qs = [m for m in muc if m.get("loai") == "menh_quai"]
        if not sn or len(qs) < 2:
            return None
        hai = ", ".join(f"{q.get('vai') or 'bạn'} mệnh quái {q['quai']}" for q in qs[:2])
        phan.append(f"{hai} — hai người {'cùng nhóm' if sn['cung_nhom'] else 'khác nhóm'} Đông/Tây")
        phan.append("Việc nên làm: chọn hướng nhà hợp cả hai" if sn["cung_nhom"] else
                    "Việc nên làm: hướng cửa theo người trụ cột; phòng ngủ, đầu giường, bàn làm việc chọn theo từng người")
        dau = dau_cau(dieu, "hướng nhà cho hai người")
    else:
        return None
    return f"{dau}: {thuong(ghep(*phan))}"



# Mảng của điều được hỏi → lĩnh vực KB thần số (`thanso_*` theo lĩnh vực).
LV_SO_THEO_MANG = {"suc_khoe": "suc_khoe", "tien_bac": "tai_chinh", "tinh_cam": "tinh_yeu", "gia_dinh": "gia_dinh",
                   "con_cai": "con_cai", "hoc_hanh": "hoc_tap", "quan_he": "ban_be_xa_hoi", "cong_viec": "su_nghiep",
                   "ban_than": "ban_than", "di_xa": "cuoc_song", "nha_cua": "cuoc_song"}


def so_bo_sung(goi: dict, t: str, raw: str | None, nguoi: dict, ngay_xem) -> list[dict]:
    """Thần số: điều được hỏi thuộc một lĩnh vực KHÁC lĩnh vực phân loại ("mẹ đơn thân cạn sức, sắp xếp cuộc sống" —
    phân loại Sự nghiệp, điều hỏi là sức lực) → mục KB của đúng lĩnh vực đó, theo con số của chính người hỏi (cùng hàm
    dựng gói của hỏi đáp) cho đoạn mở đầu. Không đổi gói, không đổi lĩnh vực phân loại."""
    from app.luangiai import hoi  # noqa: PLC0415
    pl = goi["phan_loai"]
    if goi.get("can_them") or pl.get("xu_ly") not in ("tra_loi", "tra_loi_kem_luu_y") \
            or pl.get("doi_tuong") not in (None, "ban_than") or pl.get("linh_vuc") in ("ky_thuat", "hop_doi", "thoi_van"):
        return []
    d = dieu_hoi(t, raw)
    lv = LV_SO_THEO_MANG.get((d or {}).get("mang"))
    if not lv or lv == pl.get("linh_vuc") or d["ma"] in NOI_DAU_THEO_MA:
        return []
    cs = hoi._chi_so_nguoi(nguoi, ngay_xem)
    them: list[dict] = []
    hoi._them_linh_vuc(them, cs, hoi.KB_LV.get(lv, lv), "ban")
    return [m for m in them[:1] if m not in goi["muc"]]
