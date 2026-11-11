# -*- coding: utf-8 -*-
"""Hỏi đáp Tử vi (HH-2) — RULES: phân loại câu hỏi, chọn cung/sao/lớp hạn cần xem,
gói bằng chứng chỉ từ lá số (iztro, CALC) + KB; NARRATIVE: template (+ LLM có kiểm tra).

Kỷ luật từ skill `tuvi-vn` (source-skills/tuvi-vn/SKILL.md):
  - LLM không an sao, không tự tính hạn: lá số và vận hạn do engine (iztro 2.6.0) tính.
  - Không phán thọ yểu, tai nạn, kiện tụng, con số tiền; hạn = chủ đề giai đoạn. Sức khoẻ (SK-1, 2026-11-04): không
    tên bệnh, không chẩn đoán — được gợi hệ cơ quan + đi khám và năm nên chú ý sức khoẻ (lời phòng ngừa).
  - Ba lớp hạn đọc tách bạch, ưu tiên đã khoá: đại hạn > lưu niên > tiểu hạn.
  - Không xem lá số người khác khi thiếu dữ liệu/đồng ý; hợp hôn không phán "khắc".
Chế độ (quyết định 2026-09-30): tham_khao (mặc định) | chi_tiet.
"""
from __future__ import annotations

import datetime as dt
import re
import unicodedata

from app import config, ngon_ngu
from app.calc import lunar, tuan_triet_vendor, tuvi_an_sao as az, tuvi_cach_cuc, tuvi_do_sang_vn
from app.calc import tuvi_luu_nguyet as ln
from app.hoidap import chung, en_gloss, hieu_cau, mo_dau, doi_song_muc as dsm
from app.hoidap import tuvi_y_bo_sung as ybs
from app.kb import tuvi_doi_song_kb as kds
from app.kb import tuvi_kb as kb
from app.kb import tuvi_phi_hoa_kb as pkb
from app.kb import ten as _ten
from app.kb.loi import L
from app.luangiai import hoi as _h, tuvi_luu_nguyet as lnl
from app.luangiai import tuvi_nhip_3_thang as nhip3, tuvi_phi_hoa as phl
from app.luangiai import truc_quan, tuvi_sao_luu as tvsl, tuvi_the_cung as the_cung
from app.luangiai import tuvi_hien as _th
from app.luangiai.truc_quan import L3, NGUOI_THAN
from app.narrative import hoi_van
from app.narrative.ngan_sach import mo_ta_loi

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
CHU_DE_CUNG = [   # (cung, mẫu) — câu hỏi cá nhân không nêu tên cung; thứ tự = ưu tiên khi khớp nhiều cung
    ("Tử Nữ", [r"con cai", r"con toi", r"sinh con", r"co con", r"hiem muon", r"may con", r"con trai", r"con gai",
               r"co thai", r"mang thai", r"sinh no", r"tin vui", r"tu tuc", r"dua con", r"con sau nay", r"bat hieu",
               r"co hieu", r"con (minh|em) sinh", r"con (minh|em|toi) \d{4}"]),
    ("Phu Thê", [r"tinh duyen", r"hon nhan", r"vo chong", r"nguoi yeu", r"ket hon", r"lay chong",
                 r"lay vo", r"dao hoa", r"hong loan", r"hai doi", r"tinh yeu", r"chong toi", r"vo toi",
                 r"muon chong", r"muon vo", r"ly hon", r"lay duoc (chong|vo)", r"(chong|vo) (em|minh)", r"dam cuoi", r"cuoi hoi",
                 r"(?<!\w)cuoi(?! (nam|thang|tuan|cung|ngo|hem|ky|doi|gio|ngay|chieu|duong|nha|dong|toa|day))", r"tinh cam", r"lay (nguoi|ai)", r"ban doi",
                 r"nua kia", r"chong con", r"nha chong", r"nha vo", r"me chong", r"bo chong",
                 # MT-ĐS B1: mấy đời chồng, phản bội, lập gia đình muộn, chồng bỏ, cô đơn, người thương
                 r"doi (chong|vo)", r"phan boi", r"ngoai tinh", r"lap gia dinh", r"chia tay", r"co don",
                 r"nguoi thuong", r"(chong|vo) bo", r"(?<!\w)e (mai|qua|dai)", r"nguoi cu", r"(?<!\w)ny(?!\w)",
                 r"co ai (thuong|yeu)"]),
    # MT-ĐS B1: pháp lý / giấy tờ / tiểu nhân / đối tác → Nô Bộc (+ Quan Lộc khi là việc làm)
    ("Nô Bộc", [r"dong nghiep", r"cap duoi", r"ban be", r"choi xau", r"nguoi giup do", r"quy nhan",
                r"doi tac", r"hop tac", r"hun hap", r"gop von", r"tieu nhan", r"ham hai", r"bi lua", r"lua dao",
                r"(bi|di|dang|chuyen|vu|dinh|thang|thua|hay) kien(?!\w)", r"kien (tung|cao|doi|nhau|ai)", r"tranh chap", r"hop dong", r"giay to", r"loi dung",
                r"nguoi xau", r"co doc", r"khong ai giup", r"dung ten"]),
    # MT-ĐS B1: an toàn / đi lại → Thiên Di (+ Tật Ách khi nói sức khoẻ) — kiểu "có bị … không" trả lời bằng mảng
    # đi lại, không bằng biến cố (luu_y lo_so).
    ("Thiên Di", [r"tai nan", r"di lai", r"di duong", r"chay xe", r"lai xe", r"duong dai", r"xe may", r"an toan",
                  r"bi thuong", r"gap chuyen", r"di phuot", r"di xa", r"xuat ngoai", r"nuoc ngoai", r"dinh cu",
                  r"xa que", r"du hoc", r"lap nghiep", r"len thanh pho", r"phuong nao", r"tha huong",
                  r"xuat khau lao dong", r"di (nhat|han|duc|my|uc|canada|dai loan)", r"sang (nhat|han|duc|my|uc|canada|nuoc)",
                  r"bay sang", r"xuat hanh", r"doi cho o", r"(o|lam an|lam viec|song) xa(?! hoa)", r"xa nha"]),
    ("Tật Ách", [r"suc khoe", r"cang thang", r"ap luc", r"nghi ngoi", r"can bang", r"met moi", r"mat ngu", r"hay om",
                 r"om (yeu|dau)", r"dao keo", r"di kham", r"tai uong", r"yeu (hon|di)",
                 # SK-1: câu sức khoẻ chung, bộ phận ("có bị bệnh gì", "hay đau dạ dày", "kham suc khoe")
                 r"(?<!\w)benh (gi|tat)", r"mac benh", r"dau (da day|bung|dau|lung|khop)", r"tieu hoa", r"kham (tong quat|dinh ky)"]),
    ("Tài Bạch", [r"lam an", r"tien", r"tai chinh", r"giau", r"lam giau", r"thu nhap", r"tai loc", r"lua tien",
                  r"dau tu", r"no nan", r"tieu (hoang|xai|pha)", r"chi tieu",
                  # CY-1: lo chuyện tiền ("có bị phá sản / vỡ nợ / mất tiền không")
                  r"pha san", r"vo no", r"mat (het )?tien", r"thua lo", r"lo von", r"hao tai"]),
    ("Điền Trạch", [r"nha cua", r"nha dat", r"bat dong san", r"mua nha", r"nha o", r"dat dai", r"tai san", r"thua ke",
                    r"mua dat", r"ban dat", r"ban nha", r"xay nha", r"lam nha", r"sua nha", r"chung cu"]),
    ("Quan Lộc", [r"su nghiep", r"cong viec", r"nghe", r"lam viec", r"thang chuc", r"kinh doanh",
                  r"nha nuoc", r"tu nhan", r"lam chu", r"khoi nghiep", r"cong danh", r"hoc hanh",
                  r"thi cu", r"lam quan", r"chuc vu", r"hop nghe", r"(?<!bat )tu toi", r"(bi|ngoi|vao|dinh) tu(?!\w)", r"di tu (khong|ko|toi|day|ra)", r"phap luat", r"phap ly",
                  r"thi (do|dau|lai|dai hoc|cong chuc|khoi|vao|lop)", r"hoc (thac si|them|muon|gioi|dot|khoi)",
                  r"khoi (a|b|c|d)(?!\w)", r"nhan chuc", r"mat viec", r"doi viec", r"cong chuc", r"van xuong", r"hoa khoa",
                  r"thi cong chuc", r"thi dau", r"dau cong chuc",
                  # EN-3c: ngành nghề, đổi / tìm việc, học lên hay đi làm — đều là chuyện công danh
                  r"(?<!chon )(?<!hoc )nganh(?! hoc)", r"cao hoc", r"hoc tiep", r"(?<!\w)di lam(?! xa)",
                  r"(chuyen|nhay|nghi|bo|xin|tim) viec", r"viec (moi|lam)", r"hieu (truong|pho)", r"giao vien", r"khai truong",
                  r"mo (cua hang|quan|tiem|shop|cong ty|xuong)"]),
    ("Phụ Mẫu", [r"cha me", r"bo me", r"cap tren", r"sep", r"(?<!\w)bo (toi|em|minh)", r"(?<!\w)me (toi|em|minh)",
                 r"(?<!\w)ba (toi|em|minh)", r"(?<!\w)ong (toi|em|minh)", r"xa cha me", r"cham bo", r"cham me"]),
    ("Huynh Đệ", [r"anh chi em", r"anh em", r"chi em", r"anh trai", r"em trai", r"chi gai", r"em gai", r"con ut"]),
    ("Điền Trạch", [r"nha rieng", r"o tro", r"doi nha", r"mua duoc nha", r"chuyen nha"]),
    ("Phúc Đức", [r"phuc", r"dong ho", r"binh an", r"to tien", r"hau van", r"tuoi gia", r"ve gia", r"an nhan", r"duong gia",
                  r"ve huu", r"nghi huu", r"con chau"]),
]
# MT-ĐS B1: kiểu "có bị … không" / "có số … không" → trả lời bằng mảng sống hằng ngày + lưu ý `lo_so` (không có/không).
LO_SO = [r"co bi .{0,30}(khong|ko|k)(?!\w)", r"co (gap|dinh|vuong|hay bi|phai|bi) .{0,30}(khong|ko|k)(?!\w)", r"so (bi|hay bi|phai)",
         r"(so|sợ) qua", r"lo qua", r"co nguy hiem", r"hay gap chuyen", r"xui"]
# MT-ĐS B1: hợp tuổi làm ăn / góp vốn (không phải hôn nhân) và sinh con hợp tuổi bố mẹ → mẫu riêng (không an lá số).
_CHI = r"(ty|suu|dan|mao|thin|ngo|mui|than|dau|tuat|hoi)"
HOP_LAM_AN = [rf"tuoi {_CHI}.{{0,40}}tuoi {_CHI}.{{0,40}}(lam viec chung|lam chung|lam an|hop tac|gop von)",  # EN-3c
              r"xem tuoi lam an", rf"(hop tac|hun hap|hun von|gop von|lam an|ky hop dong|dung ten|chung von) .{{0,40}}tuoi {_CHI}(?!\w)",
              rf"tuoi {_CHI} .{{0,40}}(hop tac|hun hap|hun von|gop von|lam an|lam ban|chung von)", rf"tuoi {_CHI} .{{0,30}}(lam ban|choi voi)"]
SINH_CON_TUOI = [r"sinh con nam (nao|\d{4}|tuoi|\w+ )", r"(co nen|nen) sinh con(?! gio)", rf"con tuoi {_CHI} .{{0,25}}(bo|me|cha|ba) tuoi",
                 r"sinh con .{0,25}(hop|xung|khac|kieng)", r"sinh nam \w+ co (khac|xung|hop)", r"(?<!\w)de con nam"]
SAO_KW = {"Tử Vi": [r"sao tu vi", r"tu vi (thu|o|tai|toa|nam|cu|dong)", r"(co|nguoi co|gap) tu vi", r"tu phu"],
          **{s: [chung.chuan_hoa(s)] for s in
             ["Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
              "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"]}}
SAO_KW["Thiên Phủ"] = SAO_KW["Thiên Phủ"] + [r"tu phu"]       # HH-CT2: "Tử Phủ" = Tử Vi + Thiên Phủ
PHU_KW = {"Hàm Trì": [r"dao hoa", r"ham tri"], "Hỏa Tinh": [r"hoa tinh"]}

CA_NHAN = [r"toi", r"cua minh", r"minh co", r"minh la", r"la so cua", r"em co", r"cua em", r"toi co"]
HOP_HON = [r"hop tuoi", r"hop hon", r"hop nhau", r"xung khac", r"ky nhau", r"xem tuoi lam an",
           r"tuoi \w+ lay (chong|vo) tuoi", r"hai la so", r"hop voi (anh|chi|co|chong|vo|nguoi)",
           r"tuoi \w+.{0,30}tuoi \w+.{0,30}(xung|hop|khac|ky)",
           r"(chong|vo|nguoi yeu|ny) (toi|em|minh) (voi|va) (toi|em|minh)\b.{0,30}hop",     # EN-3c: "ck e với e … có hợp"
           # EN-3c: hai tuổi + một người bạn đời ("tôi tuổi Thìn, người yêu tuổi Tuất, có nên cưới")
           rf"(nguoi yeu|\bny\b|vo|chong|ban trai|ban gai) .{{0,12}}tuoi {_CHI}.{{0,50}}(cuoi|lay|hop|xung|khac|ket hon)",
           rf"tuoi {_CHI}.{{0,30}}(nguoi yeu|\bny\b|vo|chong|ban trai|ban gai) .{{0,12}}tuoi {_CHI}"]           # HH-CT2: "chồng tuổi Thân, tôi tuổi Hợi, có xung"
CON = [r"(cho|cua) con toi", r"la so cho con", r"be nha toi", r"sinh con nam nao", r"sinh con gio",
       r"con toi sinh", r"sinh con thang", r"nen sinh con",
       r"con (gai|trai) (toi|minh|em)", r"(be|con) (moi|vua) sinh",          # HH-CT2
       r"(lap|xem|an|coi) la so (cho|cua) (con|be)"]                            # EN-3c
NGUOI_KHAC = [r"cho (chong|vo|me|bo|ong|ba|anh|chi|em|ban gai|ban trai|ban|nguoi yeu|sep) toi",
              r"(sep|chong|vo|me|bo|nguoi yeu|ban trai|ban gai|dong nghiep) toi (tuoi|sinh|co so|la nguoi)",
              r"xem (tu vi|la so) cho (?!toi)", r"tuoi \w+ \w+, tinh cach",
              r"(chong|vo|bo|me|sep|nguoi yeu|ban trai|ban gai) toi (nam nay|nam sau|nam toi) (co |bi |gap )?(han|xui|tot|the nao)",
              r"(chong|vo|bo|me|sep|nguoi yeu|ban trai|ban gai) toi (co |bi |gap )han"]
HAN = [r"dai han", r"tieu han", r"luu nien", r"nam nay", r"nam sau", r"nam toi", r"nam 20\d\d",
       r"muoi nam", r"10 nam", r"nam nao", r"khi nao", r"bao gio", r"thang nao", r"han gi",
       r"tam tai", r"thai tue", r"nam tuoi", r"van han", r"hao tai", r"hanh han",
       r"thang (\d{1,2}|gieng|chap) am( lich)?"]                                   # HH-CT3
# EN-5.2: câu hỏi về sao lưu năm ("năm nay có Kình Đà lưu không", "Tang Môn Bạch Hổ năm nay ở đâu"). Sau code-review:
# "da la" trùng "đã là", "sao lưu" trùng "tại sao lưu ý / vì sao lưu niên" → gõ có dấu thì so trên chữ có dấu.
_SAO_LUU_TEN_CD = r"(kình dương|đà la|kình đà|lộc tồn|thiên mã|tang môn|bạch hổ|thái tuế|khôi việt|xương khúc)"
_SAO_LUU_TEN_KD = r"(kinh duong|kinh da|loc ton|thien ma|tang mon|bach ho|thai tue|khoi viet|xuong khuc)"
_NAM_RX = r"(năm nay|năm sau|năm tới|năm 20\d\d)"
SAO_LUU_CD = [_SAO_LUU_TEN_CD + r"\W{0,3}lưu", r"(?<!\w)lưu (kình|đà|lộc|mã|tang môn|bạch hổ|thái tuế|khôi|xương)",
              r"(?<!vì )(?<!tại )(?<!làm )sao lưu(?! ý)", _SAO_LUU_TEN_CD + r".{0,25}" + _NAM_RX,
              _NAM_RX + r".{0,25}" + _SAO_LUU_TEN_CD]
SAO_LUU_KW = [_SAO_LUU_TEN_KD + r"\W{0,3}luu", r"da la luu|luu da la",
              r"(?<!\w)luu (kinh|loc|ma|tang mon|bach ho|thai tue|khoi|xuong)", r"(?<!vi )(?<!tai )(?<!lam )sao luu(?! y)",
              _SAO_LUU_TEN_KD + r".{0,25}(nam nay|nam sau|nam toi|nam 20\d\d)",
              r"(nam nay|nam sau|nam toi|nam 20\d\d).{0,25}" + _SAO_LUU_TEN_KD]
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
# EN-3c: "tôi với bố mẹ / sếp có hợp nhau không" là câu về cung người thân trên lá số của chính mình, không phải hợp hôn.
_NGUOI_NHA = [r"(bo|cha) me", r"(?<!\w)(bo|me|ba|cha) (toi|em|minh)", r"anh (chi )?em", r"\bsep\b", r"cap tren",
              r"dong nghiep", r"con (toi|minh|em)"]
_BAN_DOI = [r"vo chong", r"(chong|vo) (toi|em|minh)", r"nguoi yeu", r"\bny\b", r"ban (trai|gai)", r"lay (chong|vo)",
            r"ket hon", r"cuoi", r"tuoi \w+ lay"]
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
            ghi_chu = L("hoi.tv.thang_duong", "Tháng {d} dương lịch phần lớn thuộc tháng {a} âm.", d=m.group(1), a=thang)
        elif m.group(3) != "am":
            ghi_chu = L("hoi.tv.thang_am", "Tử vi tính theo âm lịch: đây là tháng {a} ÂM.", a=thang)
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
    khủng hoảng / ngoài phạm vi (câu đặc biệt trả về trước, gợi ý bị bỏ qua).

    EN-ALL GĐ 4: câu tiếng Anh → cụm từ khoá tiếng Việt (`en_gloss`, dịch ý) rồi đi đúng luật bên dưới; bộ chặn an toàn
    xét trên CÂU GỐC tiếng Anh (`luangiai/an_toan`, một bộ cho mọi ngôn ngữ)."""
    goc = cau_hoi
    if not ngon_ngu.la_viet():
        if en_gloss.la_cau_viet(goc):      # câu gõ tiếng Việt ở bản Anh → phân loại đúng như bản Việt (KB tên Việt)
            with ngon_ngu.dung(ngon_ngu.MAC_DINH):
                return phan_loai(goc, che_do, y_dinh_goi_y)
        cau_hoi = en_gloss.gloss(goc, "tuvi") or goc
    gioi_thieu, t_chinh = _h._tach_gioi_thieu(cau_hoi)
    t = chung.chuan_hoa_cau(cau_hoi)
    if gioi_thieu and (chung.co(gioi_thieu, [r"dai han", r"luu nien", r"tieu han", r"la so", r"cung \w+"])
                       or _co_ten(gioi_thieu, CUNG_KW)):
        t_chinh = t                     # "Tôi đang ở đại hạn…" không phải lời giới thiệu
    kq = {"cau_chuan_hoa": t, "cau_goc": goc, "che_do": che_do, "loai": None, "xu_ly": "tra_loi",
          "cung": _co_ten(t_chinh, CUNG_KW), "sao": _co_ten(t_chinh, SAO_KW), "hoa": _hoa_nhac(t_chinh),
          "phu": _phu_nhac(t_chinh), "giai_thich": _giai_thich_khop(t_chinh),
          "ca_nhan": chung.co(t_chinh, CA_NHAN), "su_kien": chung.co(t, SU_KIEN),
          "nam_xem": _nam_nhac(t), "han_sau": chung.co(t, NAM_SAU), "han_toi": chung.co(t, TOI_KE),
          "hoi_thang": chung.co(t, THANG), "sao_tim": [], "y_dinh": None,
          "phuong_phap": [] if chung.co(t_chinh, CA_NHAN) else ybs.phuong_phap_nhac(t_chinh),
          "nhan_ra_y_dinh": False, "co_the_goi_y": False, "y_dinh_tu_goi_y": False}
    t_loc = t
    if che_do == "chi_tiet":
        for m in SU_KIEN_CHAN_MEM:
            t_loc = re.sub(m, " ", t_loc)
    t_dau = unicodedata.normalize("NFC", cau_hoi).lower()
    if goc == cau_hoi:
        db = chung.dac_biet(t_loc, cau_hoi)
    else:       # câu đã dịch ý: xét câu gốc (bộ tiếng Anh) trước, rồi cụm đã dịch
        db = chung.dac_biet(chung.chuan_hoa_cau(goc), goc) or chung.dac_biet(t_loc, cau_hoi)
    db = db or ("tu_choi_nhe" if chung.co(t_loc, TU_CHOI_TV) or any(re.search(m, t_dau) for m in TU_CHOI_TV_DAU) else None)
    if db:
        kq.update(xu_ly=db, loai="dac_biet")
        return kq
    kq["lo_so"] = chung.co(t_chinh, LO_SO)
    kq["sao_han"] = chung.sao_han_hoi(t)
    td_en = en_gloss.tu_dien_kien_thuc(goc, "tuvi") if goc != cau_hoi and not kq["giai_thich"] else []
    if td_en:
        kq["loai"], kq["tu_dien"] = "ky_thuat", td_en     # GĐ 4: câu kiến thức tiếng Anh → từ điển, không đọc lá số
    elif chung.co(t, SINH_CON_TUOI):
        kq["loai"] = "sinh_con_tuoi"
    elif chung.co(t, [r"xem (tu vi|la so) cho (?!toi|minh|em\b)\w+"]) and chung.co(t, NGUOI_KHAC) and not chung.co(t, CON):
        kq["loai"] = "nguoi_khac"     # EN-3c: "xem tử vi cho chồng tôi tuổi Ngọ … làm ăn" — người khác, không phải hợp tuổi
    elif chung.co(t, HOP_LAM_AN):
        kq["loai"] = "hop_lam_an"
    elif chung.co(t, HOP_HON) and not (chung.co(t, _NGUOI_NHA) and not chung.co(t, _BAN_DOI)):
        kq["loai"] = "hop_hon"
    elif chung.co(t, CON):
        kq["loai"] = "la_so_con"
    elif chung.co(t, NGUOI_KHAC):
        kq["loai"] = "nguoi_khac"
    elif chung.co(t_chinh, PHI_HOA_KW) and (kq["ca_nhan"] or chung.co(t_chinh, [r"la so"])):
        kq["loai"] = "phi_hoa"
    elif chung.co(t_chinh, PHI_HOA_KW) and not kq["ca_nhan"]:
        kq["loai"] = "phi_hoa_khai_niem"
    elif (kq["giai_thich"] or kq["phuong_phap"] and not (kq["sao"] or kq["hoa"] or kq["phu"])) and not kq["ca_nhan"]:
        kq["loai"] = "ky_thuat"     # TV-YBS: câu hỏi phương pháp ("xem Phu Thê có cần xem Phúc Đức") → kiến thức
    elif chung.khop_dau(cau_hoi, t_chinh, SAO_LUU_CD, SAO_LUU_KW) \
            and not chung.co(t_chinh, [r"la gi", r"nghia la", r"y nghia"]):
        kq["loai"], kq["sao_luu"] = "han", True
    elif not kq["ca_nhan"] and (cc := _cach_nhac(t_chinh)):
        kq["loai"], kq["cach_nhac"] = "cach_cuc_chung", cc
    elif chung.co(t_chinh, HOI_CACH):
        kq["loai"] = "cach_cuc_la_so"
    elif chung.co(t_chinh, HOI_SAT) and not chung.co(t_chinh, HAN):
        kq["loai"] = "sat_tinh_la_so"
    elif chung.co(t_chinh, VI_TRI) and _sao_nhac(t_chinh) and not chung.co(t_chinh, HAN):
        kq["loai"], kq["sao_tim"] = "vi_tri_sao", _sao_nhac(t_chinh)[:3]
    elif not (kq["sao"] or kq["hoa"] or kq["phu"]) and (td := hieu_cau.la_kien_thuc_tu_dien(t_chinh, cau_hoi, "tuvi")):
        kq["loai"], kq["tu_dien"] = "ky_thuat", [m["ma"] for m in td]     # EN-3: câu kiến thức → từ điển, không lá số
    elif (chung.co(t_chinh, HAN) or kq["hoi_thang"]) and kq["ca_nhan"] \
            or chung.co(t_chinh, [r"dai han", r"luu nien", r"tieu han"]):
        kq["loai"] = "han"
    elif not kq["ca_nhan"] and (kq["sao"] or kq["hoa"]) and (kq["cung"] or kq["sao"]):
        kq["loai"] = "tu_hoa_cung" if kq["hoa"] and kq["cung"] else "sao_cung"
    elif not kq["ca_nhan"] and kq["phu"] and chung.co(t_chinh, [r"la gi", r"y nghia", r"nghia la", r"la (sao|cung|cach) gi"]):
        kq["loai"] = "phu_tinh"
    elif chung.co(t_chinh, HAN) and not kq["cung"]:
        kq["loai"] = "han"
    else:
        kq["loai"] = "la_so"
    if kq["loai"] == "la_so" and not kq["cung"]:
        kq["cung"] = [c for c, m in CHU_DE_CUNG if chung.co(t_chinh, m)][:2]
        kq["do_tin_thap"] = not kq["cung"] and not (kq["sao"] or kq["hoa"] or kq["phu"])   # EN-3: mời chọn cụ thể
        kq["cung"] = kq["cung"] or ["Mệnh"]
    # EN-3c: cung trọng tâm mặc định của loại câu khi câu không nêu tên cung (hợp hôn → Phu Thê; sát tinh → Mệnh)
    if kq["loai"] == "hop_hon" and not kq["cung"]:
        kq["cung"] = ["Phu Thê"]
    if kq["loai"] == "sat_tinh_la_so" and not kq["cung"]:
        kq["cung"] = ["Mệnh"]
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
    if yd and not kq.get("tu_dien") and _kb_y_dinh(yd) and (kq["loai"] in ("la_so", "han", "ky_thuat")
                                  or (kq["loai"] == "la_so_con" and yd == "hoc_hanh_con")):
        _ap_y_dinh(kq, yd, t_chinh)
        kq["do_tin_thap"] = False
        kq["nhan_ra_y_dinh"] = not goi_y
        kq["y_dinh_tu_goi_y"] = goi_y
    return kq


def _ap_y_dinh(kq: dict, yd: str, t: str) -> None:
    """Gắn ý định: đổi loại khi cần đọc hạn, chọn cung theo KB khi câu không nêu mảng nào."""
    ch, y = Y_DINH_CAU_HINH[yd], _kb_y_dinh(yd)
    tu_chu_de = [c for c, m in CHU_DE_CUNG if chung.co(t, m)]
    kq["y_dinh"] = yd
    # EN-3c: câu nêu năm sinh / lá số RIÊNG của con ("con gái tôi sinh 2018", "lá số bé") → giữ la_so_con (đọc lá của
    # con khi có dữ liệu), chỉ gắn ý định; câu chung "con tôi học hành" mới đọc cung Tử Nữ trên lá của người hỏi.
    if kq["loai"] == "la_so_con" and chung.co(t, [r"sinh (nam )?(19|20)\d\d", r"la so (cua |cho )?(be|con)",
                                                   r"(con|be) (trai|gai)? ?(toi |minh |em )?(sinh|sn) (19|20)\d\d"]):
        pass
    elif kq["loai"] in ("ky_thuat", "la_so_con"):
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


def _loi(van: list[str | None]) -> str:
    return " ".join(x.strip() for x in van if x and x.strip())


# Lục sát hội về cách cục → lúc nào nét đẹp của cách mờ đi, nói bằng lời thường (theo cặp sao).
_LUC_PHA = {"Kình Dương": "bạn va chạm, giằng co với người khác", "Đà La": "việc kéo dài, dây dưa",
            "Hỏa Tinh": "bạn nóng vội", "Hoả Tinh": "bạn nóng vội", "Linh Tinh": "bạn lo ngầm mà không nói ra",
            "Địa Không": "kế hoạch đổ giữa chừng", "Địa Kiếp": "tiền hụt bất ngờ"}


def _noi(ds: list[str]) -> str:
    return ds[0] if len(ds) == 1 else ", ".join(ds[:-1]) + L("hoi.tv.hoac", " hoặc ") + ds[-1]


def _doc_cung(ls: dict, ten: str, muc: list, chinh: bool = True) -> None:
    """Một cung trong lá số: nghĩa cung + chính tinh (độ sáng) + tứ hoá + phụ tinh đáng kể.
    Lá của CHÍNH người hỏi → mỗi mục kèm `doi_thuong` (lời đời thường nói về người xem, `luangiai.tuvi_the_cung`);
    câu trả lời template hiện `doi_thuong`, đoạn kỹ thuật cũ chuyển vào `can_cu` ("Vì sao nói vậy")."""
    c = _cung_ten(ls, ten)
    muc.append({**_m_cung(ten), "doi_thuong": ""})           # định nghĩa cung: chỉ ở căn cứ
    if c["chinh_tinh"]:
        for s in c["chinh_tinh"]:
            m = _m_sao_cung(s["ten"], ten, s["do_sang"], "la_so")
            if m:
                lo = the_cung.loi_sao_cung(s["ten"], ten, s["do_sang"]) or {}
                muc.append({**m, "doi_thuong": _loi([lo.get("thuong_thay"), lo.get("nen_lam")])})
    else:
        doi = _cung_doi(ls, c)
        t, tm = the_cung.ten_mang(ten), the_cung.ten_mang(doi["ten"])
        vo = (L3("hoi.tv.vo.menh", "Bạn ít bị đóng khuôn: tính cách của bạn đổi theo nơi mình sống và người mình gặp.",
                 "Người này ít bị đóng khuôn: tính cách đổi theo nơi mình sống và người mình gặp.")
              if ten == "Mệnh"
              else L("hoi.tv.vo.cung", "Chuyện {t} của bạn ít có khuôn sẵn; nó chịu ảnh hưởng nhiều từ {ai} và người xung quanh.",
                     t=t, ai=L("hoi.tv.vo.chinh_ban", "chính bạn") if doi["ten"] == "Mệnh"
                     else L("hoi.tv.vo.chuyen", "chuyện {tm}", tm=tm)))
        muc.append({"loai": "vo_chinh_dieu", "cung": ten, "muon_cung": doi["ten"],
                    "sao_muon": [s["ten"] for s in doi["chinh_tinh"]], "doi_thuong": vo, **kb.meta()})
        for s in doi["chinh_tinh"][:2]:
            m = _m_sao_cung(s["ten"], ten, None, "muon")
            if m:
                lo = the_cung.loi_sao_cung(s["ten"], ten, s["do_sang"], muon_tu=doi["ten"]) or {}
                muc.append({**m, "doi_thuong": _loi([lo.get("thuong_thay"), lo.get("nen_lam")])})
    for x in ls["tu_hoa"]:
        if x["cung"] == ten:
            m = _m_tu_hoa(x["hoa"], ten, x["sao"])
            if m:
                muc.append({**m, "doi_thuong": m["noi_dung"]})
    dang_ke = [p for p in c["phu_tinh"] if kb.phu_tinh(p)["nhom"] in
               ("Lục cát tinh", "Lục sát tinh", "Nhóm đào hoa", "Lộc", "Tuần/Triệt")]
    if dang_ke and chinh:
        ds = [{"ten": p, **{k: v for k, v in kb.phu_tinh(p).items() if k in ("nhom", "y_nghia")}} for p in dang_ke[:5]]
        muc.append({"loai": "phu_tinh_cung", "cung": ten, "sao": ds,
                    "doi_thuong": the_cung.loi_phu_tinh(ten, ds) or "", **kb.meta()})


def _doc_menh(ls: dict, muc: list) -> None:
    menh = _cung_ten(ls, "Mệnh")
    sao = [s["ten"] for s in menh["chinh_tinh"]] or [s["ten"] for s in _cung_doi(ls, menh)["chinh_tinh"]]
    if sao:
        ct = kb.chinh_tinh(sao[0])
        muc.append({"loai": "chinh_tinh", "ten": sao[0], **ct,
                    "doi_thuong": L3("hoi.tv.ban_bh", "Bạn {bh}.", "Người này {bh}.", bh=ct["bieu_hien"].rstrip(". "))})
        nc = kb.nhom_cach(ct["nhom"])
        if nc:
            muc.append({"loai": "nhom_cach", "nhom": ct["nhom"], "noi_dung": nc, **kb.meta(),
                        "doi_thuong": L("hoi.tv.nhom_cach", "Kiểu việc và nhịp sống hợp với bạn {nc}", nc=nc.split(":", 1)[-1].strip())})
    # Cách cục quanh Mệnh (KB-2): tối đa 3 cách đầu theo thứ tự ưu tiên, kèm lục sát hội về.
    pha = False
    for c in [c for c in ls.get("cach_cuc", []) if c["ma"] != "than_menh_dong_cung"][:3]:
        k = kb.cach_cuc(c["ma"])
        if k:
            van = [kds.cach_cuc_doi_thuong(c["ma"], k.get("ten")) or k["y"], k.get("loi_khuyen")]
            if c["sat_hoi"] and not pha:
                pha = True
                luc = list(dict.fromkeys(L(f"hoi.tv.luc_pha.{_ma_ascii(s)}", _LUC_PHA[s]) for s in c["sat_hoi"] if s in _LUC_PHA))
                if luc:
                    van.append(L("hoi.tv.mo_di", "Nét này dễ mờ đi mỗi khi {ds}.", ds=_noi(luc)))
            muc.append({"loai": "cach_cuc", **k, "cung_lien_quan": c["cung"], "sat_hoi": c["sat_hoi"],
                        "doi_thuong": _loi(van)})
    than = next(c for c in ls["cung"] if c["la_than"])
    tc = kds.than_cu(than["ten"]) or {}
    muc.append({"loai": "than_cu", "cung": than["ten"], "menh_chu": ls["menh_chu"],
                "than_chu": ls["than_chu"], "cuc": ls["cuc"], **kb.meta(),
                "doi_thuong": _loi([tc.get("y"), tc.get("loi_khuyen")])})


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


_LOAI_KIEN_THUC = ("ky_thuat", "phu_tinh", "sao_cung", "tu_hoa_cung", "cach_cuc_chung", "phi_hoa_khai_niem")


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
        from app.luangiai import suc_khoe_nam as skn  # noqa: PLC0415
        goi["mau"] = chung.mau_tu_choi(pl.get("cau_goc"), pl["cau_chuan_hoa"], _mau_chung("tu_choi"),
                                       skn.tuvi_he(ls) if ls else None)
        return chung.ket(goi)
    if pl["xu_ly"] == "dan_huong":
        goi["mau"] = chung.mau_dan_huong(pl["cau_chuan_hoa"])
        return chung.ket(goi)
    if pl["loai"] in ("hop_lam_an", "sinh_con_tuoi"):
        goi["mau"] = kb.mau(pl["loai"])
        goi["can_them"] = ["la_so_nguoi_kia"] if pl["loai"] == "hop_lam_an" else ["tuoi_cha_me"]
        return chung.ket(goi)
    for ma in pl["giai_thich"][:2]:
        g = kb.giai_thich(ma)
        if g:
            muc.append({"loai": "giai_thich", "ma": ma, **g})
    if pl.get("tu_dien"):
        muc += hieu_cau.muc_tu_dien(pl["tu_dien"])
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
        muc.append({"loai": "ghi_chu", "noi_dung": L("hoi.tv.phai_phi_tinh", phl.PHAI["ghi_chu"])})
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
            muc.append({"loai": "ghi_chu", "noi_dung": L(
                "hoi.tv.khong_cach", "Lá số của bạn không rơi vào cách cục nào trong {n} cách hệ thống "
                "đang nhận diện. Không có cách đặc biệt không phải điều xấu — phần lớn lá số như vậy; "
                "nên đọc chính tinh và tam phương của từng cung.", n=len(tuvi_cach_cuc.DANH_SACH))})
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
            muc.append({"loai": "ghi_chu", "noi_dung": lnm["uu_tien"] + L("hoi.tv.boi_canh", " Bối cảnh năm và vận ở dưới.")})
        elif pl.get("hoi_thang") and not them.get("nhip"):
            muc.append({"loai": "ghi_chu", "noi_dung": L(
                "hoi.tv.mo_la_so_thang", "Muốn xem từng tháng (lưu nguyệt), hãy mở lá số của bạn. Dưới đây là bức tranh cả năm.")})
        if vh is None:
            goi["can_them"] = ["ngay_xem"]
            return chung.ket(goi)
        if them.get("sao_luu"):                          # EN-5.2: câu hỏi thẳng về sao lưu → trả lời trước
            x = them["sao_luu"]
            muc.append({"loai": "sao_luu", "nam": x["nam"], "can_chi": f"{x['can']} {x['chi']}", "muc": x["muc"],
                        "hoi": tvsl.ma_hoi(pl["cau_chuan_hoa"], _raw(pl)),
                        "kep_loc": x["kep_loc"], "can_cu": x["can_cu"]})
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
                        "chinh_tinh": [s["ten"] for s in c["chinh_tinh"]], "soi": _soi_cung_han(ls, ten, vh),
                        "ngan": kb.chu_de_han_ngan(ten) or ten, **kb.meta()})
        if chung.co(pl["cau_chuan_hoa"], [r"nam nao", r"khi nao", r"bao gio"]) and not pl.get("y_dinh"):
            muc.append({"loai": "cac_dai_han", "ds": _cac_dai_han(ls), **kb.meta()})
        if pl.get("y_dinh"):
            _them_y_dinh(pl, ls, them, muc)
        goi["luu_y"] = kb.luu_y(pl["che_do"])
        if pl["su_kien"] or pl.get("lo_so"):          # MT-ĐS B1: câu "có bị … không" → ranh giới đứng cuối, không mở đầu
            goi["luu_y"] = kb.luu_y("han_su_kien" if pl["su_kien"] else "lo_so") + " " + goi["luu_y"]
        if "Phu Thê" in pl["cung"] and chung.co(pl["cau_chuan_hoa"], HON_NHAN_NHAN):
            goi["luu_y"] = kb.luu_y("hon_nhan") + " " + goi["luu_y"]
        if "Tài Bạch" in pl["cung"] or "Điền Trạch" in pl["cung"]:
            if chung.co(pl["cau_chuan_hoa"], [r"dau tu", r"(?<!\w)vay", r"gop von", r"mua (dat|nha)", r"chung khoan", r"ban (dat|nha)"]):
                goi["luu_y"] = kb.luu_y("tien_bac") + " " + goi["luu_y"]
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
            muc.append({"loai": "ghi_chu", "noi_dung": L("hoi.tv.thu_tu", "Thứ tự ưu tiên khi đọc: ")
                        + L("tuvi_ls.ln.uu_tien", lnl.UU_TIEN)})
            goi["luu_y"] = kb.luu_y(pl["che_do"])
        _them_y_dinh(pl, ls, them, muc)
    if pl["su_kien"] or pl.get("lo_so"):
        goi["luu_y"] = kb.luu_y("han_su_kien" if pl["su_kien"] else "lo_so")
    if "Tài Bạch" in pl["cung"] and chung.co(pl["cau_chuan_hoa"], [r"dau tu", r"vay", r"gop von", r"mua (dat|nha)", r"chung khoan"]):
        goi["luu_y"] = kb.luu_y("tien_bac")
    if "Nô Bộc" in pl["cung"] and chung.co(pl["cau_chuan_hoa"], [r"kien", r"tranh chap", r"hop dong", r"giay to", r"tu toi", r"phap"]):
        goi["luu_y"] = kb.luu_y("phap_ly")
    if "Phu Thê" in pl["cung"] and chung.co(pl["cau_chuan_hoa"], HON_NHAN_NHAN):
        goi["luu_y"] = kb.luu_y("hon_nhan")
    if "Tật Ách" in pl["cung"]:
        goi["luu_y"] = kb.luu_y("tat_ach")
    return chung.ket(goi)


# MT-ĐS B1: câu hôn nhân mang nhãn số phận ("mấy đời chồng", "sát chồng", "bị bỏ") → lưu ý không đếm, không "khắc".
HON_NHAN_NHAN = [r"doi (chong|vo)", r"ly hon", r"phan boi", r"(chong|vo) bo", r"bo roi", r"sat (chong|vo)", r"khac (chong|vo)",
                 r"ngoai tinh", r"co don ca doi", r"e (mai|dai|ca doi)"]
_TAM_PHUONG_BUOC = (4, 8)


def _soi_cung_han(ls: dict, ten: str, vh: dict) -> list[dict]:
    """MT-ĐS B1 — soi cung hỏi vào ba lớp hạn bằng dữ kiện đã an: lớp hạn đi đúng cung (`trung`), Hoá Lộc / Hoá Kỵ của lớp
    rơi đúng cung (`loc_vao` / `ky_vao`) hay chiếu vào qua tam phương / xung chiếu (`loc_chieu` / `ky_chieu`). Chỉ đọc
    `vh[lop]` (iztro) + tên sao trong 12 cung — không điểm số."""
    i_hoi = THU_TU_CUNG.index(ten)
    chieu = {THU_TU_CUNG[(i_hoi + b) % 12] for b in (4, 6, 8)}
    ra = []
    for lop in ("dai_han", "luu_nien", "tieu_han"):
        o = vh[lop]
        cung_lop = ls["cung"][o["chi_so"]]["ten"]
        qh = []
        if cung_lop == ten:
            qh.append("trung")
        for hoa, sao in zip(THU_TU_HOA, o.get("tu_hoa") or []):
            if hoa not in ("Lộc", "Kỵ"):
                continue
            noi = next((x["ten"] for x in ls["cung"]
                        if sao in [s["ten"] for s in x["chinh_tinh"]] or sao in x["phu_tinh"]), None)
            if noi == ten:
                qh.append("loc_vao" if hoa == "Lộc" else "ky_vao")
            elif noi in chieu:
                qh.append("loc_chieu" if hoa == "Lộc" else "ky_chieu")
        ra.append({"lop": lop, "cung_lop": cung_lop, "quan_he": qh})
    return ra


_LAP_CACHE: dict[tuple, dict] = {}
_LAP_CACHE_MAX = 64


def _lap_doi_song(sinh: dict, ngay_xem: dt.date, ls: dict, vh: dict | None) -> dict:
    """Báo cáo đời sống cho hỏi đáp: nhớ 64 lượt gần nhất theo (hồ sơ, ngày xem) — người dùng hỏi nhiều câu liên tiếp
    không dựng lại 12 chương; `vh` đã tính ở tra_loi (câu hạn, cùng ngày xem) thì không gọi lại iztro."""
    from app.luangiai import tuvi_doi_song as tds  # noqa: PLC0415 — tránh vòng import
    from app import ngon_ngu  # noqa: PLC0415 — EN-ALL: khoá đệm kèm ngôn ngữ (báo cáo có chữ theo ngôn ngữ)
    k = (sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], sinh.get("tz_lich"), sinh.get("hoa_linh"), sinh.get("thang_nhuan"),
         sinh.get("lich"), sinh.get("luu_nguyet"), ngay_xem, ngon_ngu.hien_tai(), ngon_ngu.bien_the())
    if k in _LAP_CACHE:
        return _LAP_CACHE[k]
    bc = tds.lap(sinh, ngay_xem, ls=ls, vh=vh if vh and vh.get("ngay_xem") == ngay_xem.isoformat() else None)
    if len(_LAP_CACHE) >= _LAP_CACHE_MAX:
        _LAP_CACHE.pop(next(iter(_LAP_CACHE)))
    _LAP_CACHE[k] = bc
    return bc


def _them_doi_song(goi: dict, pl: dict, sinh: dict, ngay_xem: dt.date, ls: dict, vh: dict | None = None) -> dict | None:
    """MT-ĐS B2: mượn chương báo cáo đời sống cho mảng của câu hỏi (cung hỏi → chương; hạn không cung → "Năm nay").
    Kiểu "có bị … không" đặt mục này LÊN ĐẦU (mở bằng mức của mảng sống hằng ngày). Lỗi dựng báo cáo → bỏ qua, câu trả
    lời vẫn như cũ."""
    cung = pl["cung"][0] if pl["cung"] else None
    chuong = dsm.CUNG_CHUONG.get(cung) if cung else ("nam_nay" if pl["loai"] == "han" else None)
    # EN-3b: câu không chỉ ra cung (hoặc chỉ "Năm nay") mà điều được hỏi rõ một mảng → mượn chương của mảng đó.
    cd = None
    if chuong in (None, "nam_nay"):
        cd = mo_dau.chuong_cua(mo_dau.dieu_hoi(pl["cau_chuan_hoa"], _raw(pl), chuong))
    if not chuong and not cd:
        return None
    try:
        bc = _lap_doi_song(sinh, ngay_xem, ls, vh)
    except Exception:  # noqa: BLE001 — báo cáo đời sống là lớp thêm, không được làm hỏng hỏi đáp
        return None
    m = (dsm.muc_doi_song(bc, cd, lo_so=bool(pl.get("lo_so"))) if cd and cd != chuong else None) \
        or dsm.muc_doi_song(bc, chuong, lo_so=bool(pl.get("lo_so")))
    if not m:
        return bc
    if pl.get("lo_so"):
        goi["muc"].insert(0, m)
    else:
        goi["muc"].append(m)
    if m.get("chuong") == "suc_khoe" and (g := chung.muc_suc_khoe_hoi(pl["cau_chuan_hoa"])):   # SK-1: bộ phận → đi khám
        goi["muc"].insert(goi["muc"].index(m) + 1, g)
    chung.ket(goi)
    return bc


def _them_chu_y(goi: dict, pl: dict, sinh: dict, ngay_xem: dt.date, ls: dict, bc: dict | None) -> None:
    """CY-1: câu hỏi về điều người dùng lo ở một mảng → năm nên chú ý của mảng (đọc lại hộp báo cáo — cùng hàm; báo cáo
    không có hộp của mảng thì tính bằng `chu_y_nam.tuvi_nam`)."""
    from app.luangiai import chu_y_nam as cyn  # noqa: PLC0415
    tz = sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ)
    nam_am_xem = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, config.CALENDAR_MERIDIAN_TZ)[2]
    nam_am_sinh = lunar.solar_to_lunar(sinh["ngay"].day, sinh["ngay"].month, sinh["ngay"].year, tz)[2]

    def tinh(mg: str) -> list[dict]:
        x = cyn.tu_bao_cao((bc or {}).get("chuong"), mg, nam_am_xem)
        return x if x is not None else cyn.tuvi_nam(ls, nam_am_xem, nam_am_sinh, mg)

    chung.them_chu_y(goi, pl, tinh, nam_am_xem, L("hoi.tv.theo_la_so", "Theo lá số Tử vi"), ("sao_han",),
                     chung.nam_hoi_hh(pl["cau_chuan_hoa"], ngay_xem, "am"))


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
        muc.append({"loai": "goi_y_trang", "duong": "/xem-ngay-tot", "ten": L("hoi.tv.xem_ngay_tot", "Xem ngày tốt"),
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
            sao_trong.append({"sao": sao, "cung": _va().join(_tc(c) for c in noi) if not ngon_ngu.la_viet() else " và ".join(noi)})
    muc.append({"loai": "y_dinh", "ma": yd, "ten": L(f"hoi.tv.yd.ten.{yd}", y["ten"]),
                "cach_ghep": L(f"hoi.tv.yd.cach_ghep.{yd}", y["cach_ghep"]), "cung_xem": cung_y,
                "sao_trong_la": sao_trong, "source_id": y.get("source_id"), "school_id": y.get("school_id"),
                **pkb.meta()})
    if yd == "hoc_hanh_con":
        muc.append({"loai": "ghi_chu", "noi_dung": L(
            "hoi.tv.hoc_con", "Đây là góc nhìn từ lá số của cha mẹ về cách đồng hành với con; không đoán điểm, không chọn "
            "trường hay nghề thay con. Muốn xem kỹ hơn, hãy lập lá số của chính con.")})


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
    muc.append({"loai": "ghi_chu", "noi_dung": L("hoi.tv.phai_phi_tinh", phl.PHAI["ghi_chu"])})


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
LOP_TEN_THUONG = {"dai_han": "Giai đoạn mười năm", "luu_nien": "Năm đang xem", "tieu_han": "Nhịp phụ của năm"}


# EN-ALL GĐ 4 — tên riêng / nhãn trong lời đáp theo ngôn ngữ (bản Việt: nguyên chữ — mọi hàm dưới là hàm đồng nhất).
def _ts(x):
    """Tên sao (chính / phụ / "Hoá Lộc" / "X hoá Kỵ" / "X (Hãm)") theo ngôn ngữ."""
    if not isinstance(x, str) or ngon_ngu.la_viet():
        return x
    m = re.fullmatch(r"(.+?) hoá (Lộc|Quyền|Khoa|Kỵ)", x)
    if m:
        return L("hoi.tv.sao_hoa", "{sao} hoá {hoa}", sao=_th.ten_sao(m.group(1)), hoa=_ten.ten("hoa", m.group(2)))
    m = re.fullmatch(r"(.+?) \((.+)\)", x)
    if m:
        return f"{_th.ten_sao(m.group(1))} ({_ten.ten('do_sang', m.group(2))})"
    return _th.ten_sao(x)


def _tc(x):
    """Tên cung (cả "A và B" — Tuần/Triệt đóng giữa hai cung) theo ngôn ngữ."""
    if not isinstance(x, str) or ngon_ngu.la_viet():
        return x
    return _va().join(_ten.ten("cung", c) for c in x.split(" và "))


def _thoa(x):
    return _ten.ten("hoa", x) if isinstance(x, str) else x


def _tsang(x):
    return _ten.ten("do_sang", x) if isinstance(x, str) else x


def _tcc(s):
    """Can chi ("Bính Ngọ") theo ngôn ngữ."""
    return s if not isinstance(s, str) or ngon_ngu.la_viet() else _th.can_chi(s)


def _va() -> str:
    return L("hoi.tv.va", " và ")


def _dss(ds: list[str]) -> str:
    return ", ".join(_ts(x) for x in ds)


def _nhom_sao(n: str) -> str:
    """Nhóm phụ tinh / chính tinh (KB giữ mã Việt để so) → nhãn theo ngôn ngữ."""
    return L(f"hoi.tv.nhom.{_ma_ascii(n)}", n) if isinstance(n, str) else n


def _ma_ascii(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", chung.chuan_hoa(s)).strip("_")


def _lop_ten(lop: str) -> str:
    return L(f"hoi.tv.lop.{lop}", LOP_TEN[lop])


def _lop_thuong(lop: str) -> str:
    return L(f"hoi.tv.lop_thuong.{lop}", LOP_TEN_THUONG[lop])


def _ngay(d: dt.date | str) -> str:
    d = dt.date.fromisoformat(d) if isinstance(d, str) else d
    return f"{d.day}/{d.month}/{d.year}"


def _ten_thang(t: dict) -> str:
    """Nửa sau tháng nhuận mang can chi tháng sau → ghi "tính như tháng sau" ngay cạnh can chi (QC 2026-10-21)."""
    dau = {"nua_dau": L("hoi.tv.nua_dau", "nửa đầu "), "nua_sau": L("hoi.tv.nua_sau", "nửa sau ")}.get(t.get("phan", ""), "")
    nhu = L("hoi.tv.tinh_nhu", "tính như {t}, ", t=nhip3.nua_sau_nhu(t["thang"])) \
        if t.get("phan") == "nua_sau" or nhip3.tinh_thang_sau(t) else ""
    return L("hoi.tv.ten_thang", "{dau}tháng {thang}{nhuan} âm ({nhu}{can_chi})", dau=dau, thang=t["thang"],
             nhuan=L("hoi.tv.nhuan", " nhuận") if t["nhuan"] else "", nhu=nhu, can_chi=_tcc(t["can_chi"]))


def _cau_duong(d: dict) -> str:
    if d["tu_hoa"]:
        dau = L("hoi.tv.duong.tu_hoa", "Cung {cung} tự hoá {hoa} ({sao})", cung=_tc(d["tu_cung"]), hoa=_thoa(d["hoa"]),
                sao=_ts(d["sao"]))
    else:
        dau = L("hoi.tv.duong.bay", "Can {can} của cung {tu} hoá {sao} {hoa} vào cung {den}", can=_ten.ten("can", d["can"]),
                tu=_tc(d["tu_cung"]), sao=_ts(d["sao"]), hoa=_thoa(d["hoa"]), den=_tc(d["den_cung"]))
        if d["hoa"] == "Kỵ" and d["xung_cung"]:
            dau += L("hoi.tv.duong.chieu", ", chiếu cung {cung}", cung=_tc(d["xung_cung"]))
    return f"{dau}: {d['nghia'].rstrip('.')}."


def _xh(ket: str) -> str:
    return _ten.ten("xu_huong_tuvi", ket) if isinstance(ket, str) else ket


def _xu_huong(xh: dict) -> str:
    s = ""
    if xh["cat"] or xh["sat"]:
        s = L("hoi.tv.xu_huong.sao", " (sao tốt: {cat}; sao khó: {sat})", cat=_dss(xh["cat"]) or L("hoi.tv.khong", "không"),
              sat=_dss(xh["sat"]) or L("hoi.tv.khong", "không"))
    return s


def _doan(m: dict, da_co_sao: set[str] = frozenset()) -> tuple[str, str | None]:
    l = m["loai"]
    if l == "cung":
        return (L("hoi.tv.cung", "Cung {ten}: {y} Cung này cho thấy {xem}; nó {khong}.", ten=_tc(m["ten"]), y=m["y_nghia"],
                  xem=m["xem_duoc"], khong=m["khong_tra_loi"]), m["cau_tu_soi"])
    if l == "sao_cung":
        sao, cung_ = _ts(m["sao"]), _tc(m["cung"])
        dau = {"la_so": L3("hoi.tv.sc.la_so", "Trong lá số của bạn, {sao} ở cung {cung}", "Trong lá số này, {sao} ở cung {cung}",
                           sao=sao, cung=cung_),
               "muon": L("hoi.tv.sc.muon", "Cung {cung} vô chính diệu, mượn {sao} từ cung đối diện", sao=sao, cung=cung_),
               "kb": L("hoi.tv.sc.kb", "{sao} ở cung {cung}", sao=sao, cung=cung_)}[m["vai"]]
        s = f"{dau}"
        if m.get("do_sang"):
            s += f" ({_tsang(m['do_sang'])} — {m['do_sang_y']})"
        s += f": {m['noi_dung']}"
        if m.get("sac_thai"):
            s += f" {m['sac_thai']}"
        if m["sao"] not in da_co_sao:
            s += L("hoi.tv.sc.net", " Nét chung của {sao}: {tc} Mặt tối cần để ý: {mt}.", sao=sao, tc=m["tinh_chat"],
                   mt=m["mat_toi"])
        return s, m["cau_tu_soi"]
    if l == "chinh_tinh":
        return (L("hoi.tv.ct", "{ten} ({han}, hành {hanh}): {tc} Điểm mạnh: {dm}. Mặt tối: {mt}. Biểu hiện dễ thấy: {bh}.",
                  ten=_ts(m["ten"]), han=m["ten_han"], hanh=_ten.ten("hanh", m["ngu_hanh"]), tc=m["tinh_chat"],
                  dm=m["diem_manh"], mt=m["mat_toi"], bh=m["bieu_hien"]), m["cau_tu_soi"])
    if l == "nhom_cach":
        return m["noi_dung"], None
    if l == "cach_cuc":
        s = L("hoi.tv.cc", "Cách cục {ten} ({han}) — {dk} {y} Mặt tối: {mt} Gợi ý: {lk}", ten=m["ten"], han=m["ten_han"],
              dk=m["dieu_kien"], y=m["y"], mt=m["mat_toi"], lk=m["loi_khuyen"])
        if m["sat_hoi"]:
            if "__pha_cach__" in da_co_sao:              # ghi chú dài chỉ nói một lần mỗi câu trả lời
                s += L("hoi.tv.cc.sat_lai", " (Tam phương có {ds} hội về — giảm cách, như lưu ý ở trên.)", ds=_dss(m["sat_hoi"]))
            else:
                s += L("hoi.tv.cc.sat", " Lưu ý: tam phương có {ds} hội về — {lp}", ds=_dss(m["sat_hoi"]),
                       lp=kb.luu_y_pha_cach())
                if isinstance(da_co_sao, set):
                    da_co_sao.add("__pha_cach__")
        return s, None
    if l == "than_cu":
        return (L("hoi.tv.than_cu", "Thân cư cung {cung} — trọng tâm đời sống về sau nghiêng về lĩnh vực này. "
                  "Mệnh chủ {mc}, Thân chủ {tc}, {cuc}.", cung=_tc(m["cung"]), mc=_ts(m["menh_chu"]), tc=_ts(m["than_chu"]),
                  cuc=_ten.ten("cuc", m["cuc"])), None)
    if l == "vo_chinh_dieu":
        mu = _dss(m["sao_muon"]) or L("hoi.tv.vcd.khong", "không có chính tinh")
        return (L("hoi.tv.vcd", "Cung {cung} vô chính diệu (không có chính tinh), mượn cung {muon} "
                  "đối diện ({mu}) để luận — tính chất nhẹ hơn, phụ thuộc nhiều vào môi trường.", cung=_tc(m["cung"]),
                  muon=_tc(m["muon_cung"]), mu=mu), None)
    if l == "tu_hoa_cung":
        sao = L("hoi.tv.thc.sao", " ({sao} hoá {hoa})", sao=_ts(m["sao"]), hoa=_thoa(m["hoa"])) if m.get("sao") else ""
        return (L("hoi.tv.thc", "Hoá {hoa} ở cung {cung}{sao}: {nd} {y} {lu}", hoa=_thoa(m["hoa"]), cung=_tc(m["cung"]), sao=sao,
                  nd=m["noi_dung"], y=m["y_nghia"], lu=m["luu_y_hoa"]), None)
    if l == "phu_tinh_cung":
        ds = "; ".join(f"{_ts(s['ten'])} ({_nhom_sao(s['nhom'])}): {s['y_nghia']}" for s in m["sao"])
        return L("hoi.tv.ptc", "Phụ tinh đáng kể ở cung {cung}: {ds}", cung=_tc(m["cung"]), ds=ds), None
    if l == "phu_tinh":
        noi = L("hoi.tv.pt.noi", " — trong lá số của bạn nằm ở cung {cung}", cung=_tc(m["cung"])) if m.get("cung") else ""
        return f"{_ts(m['ten'])} ({_nhom_sao(m['nhom'])}){noi}: {m['y_nghia']}", None
    if l == "tuoi":
        return L3("hoi.tv.tuoi", "Tuổi mụ tại thời điểm xem: {t}.", "Tuổi mụ của chủ lá số tại thời điểm xem: {t}.",
                  t=m["tuoi_mu"]), None
    if l == "han":
        # MT-ĐS B1: lời thường trước, thuật ngữ trong ngoặc — "Giai đoạn 10 năm (đại hạn) 35–44 tuổi đi qua chủ đề …"
        ke = m.get("vai") == "ke_tiep"
        ngan = kb.chu_de_han_ngan(m["cung_goc"]) or m["chu_de"]
        cg, cc_ = _tc(m["cung_goc"]), _tcc(f"{m['can']} {m['chi']}")
        if m["lop"] == "dai_han":
            s = (L("hoi.tv.han.dai_ke", "Giai đoạn mười năm kế tiếp (đại hạn kế tiếp) từ {tu} đến {den} tuổi đi qua chủ đề "
                   "{ngan} — cung {cung} ({cc})", tu=m["tu_tuoi"], den=m["den_tuoi"], ngan=ngan, cung=cg, cc=cc_) if ke
                 else L("hoi.tv.han.dai", "Giai đoạn mười năm (đại hạn) từ {tu} đến {den} tuổi đi qua chủ đề {ngan} — cung "
                        "{cung} ({cc})", tu=m["tu_tuoi"], den=m["den_tuoi"], ngan=ngan, cung=cg, cc=cc_))
        else:
            s = L("hoi.tv.han.lop", "{thuong} ({ten}) đặt chủ đề {ngan} — cung {cung} ({cc})", thuong=_lop_thuong(m["lop"]),
                  ten=L(f"hoi.tv.lop_thuong_nho.{m['lop']}", LOP_TEN[m["lop"]].lower()), ngan=ngan, cung=cg, cc=cc_)
        s += (L("hoi.tv.han.ct", ", chính tinh {ds}.", ds=_dss(m["chinh_tinh"])) if m["chinh_tinh"]
              else L("hoi.tv.han.khong_ct", ", cung không có chính tinh."))
        for x in m.get("tu_hoa_lop", []):
            s += L("hoi.tv.han.hoa", " Trong {gd} này, Hoá {hoa} ({sao}) rơi vào cung {cung} — mảng {mang}: {ket}.",
                   gd=L("hoi.tv.gd", "giai đoạn") if m["lop"] == "dai_han" else L("hoi.tv.nam", "năm"),
                   hoa=_thoa(x["hoa"]), sao=_ts(x["sao"]), cung=_tc(x["cung_goc"]),
                   mang=kb.chu_de_han_ngan(x["cung_goc"]) or _tc(x["cung_goc"]),
                   ket=L("hoi.tv.han.loc", "thuận, có cái vào") if x["hoa"] == "Lộc" else L("hoi.tv.han.ky", "cần để ý hơn"))
        if m.get("xu_huong"):
            xh = m["xu_huong"]
            s += L("hoi.tv.han.xh", " Xu hướng: {ket}", ket=_xh(xh["ket"])) + _xu_huong(xh) + "."
        return s, None
    if l == "luu_nguyet":
        ten_t = L("hoi.tv.ln.ten", "tháng {thang}{nhuan} âm năm {cc}", thang=m["thang"],
                  nhuan=L("hoi.tv.nhuan", " nhuận") if m["nhuan"] else "", cc=_tcc(m["can_chi_nam"]))
        if m["phan"] != "ca_thang":
            ten_t += L("hoi.tv.ln.nua", " ({nua})", nua=L("hoi.tv.ln.nua_dau", "nửa đầu") if m["phan"] == "nua_dau"
                       else L("hoi.tv.ln.nua_sau", "nửa sau"))
        s = L("hoi.tv.ln.dau", "Lưu nguyệt {ten} — từ {tu} đến {den} dương lịch, tháng {cc}. Theo phái {phai}, Mệnh của tháng "
              "rơi vào cung {cung} ({chi}). {cd}", ten=ten_t, tu=_ngay(m["tu"]), den=_ngay(m["den"]), cc=_tcc(m["can_chi"]),
              phai=m["phai_ten"], cung=_tc(m["cung_goc"]), chi=_ten.ten("chi", m["chi"]), cd=m["chu_de"])
        if m["chinh_tinh"]:
            s += L("hoi.tv.ln.ct", " Chính tinh tại cung: {ds}.", ds=", ".join(
                f"{_ts(x['ten'])}" + (f" ({_tsang(x['do_sang'])})" if x["do_sang"] else "") for x in m["chinh_tinh"]))
        else:
            s += L("hoi.tv.ln.vcd", " Cung tháng vô chính diệu — đọc thêm sao ở cung đối diện.")
        if m["tuan_triet"]:
            s += L("hoi.tv.ln.tt", " Có {ds} đóng tại cung.", ds=_va().join(_ts(x) for x in m["tuan_triet"]))
        for x in m["tu_hoa_thang"]:
            if x["hoa"] in ("Lộc", "Kỵ") and x["cung_goc"]:
                s += L("hoi.tv.ln.hoa", " Hoá {hoa} của tháng ({sao}) ở cung {cung}", hoa=_thoa(x["hoa"]), sao=_ts(x["sao"]),
                       cung=_tc(x["cung_goc"]))
                s += L("hoi.tv.ln.dung", " — đúng cung tháng.") if x["vao_cung_thang"] else (
                    L("hoi.tv.ln.tam", " — trong tam phương của cung tháng.") if x["vao_tam_phuong"] else ".")
        for lop in m["trung"]:
            s += L("hoi.tv.ln.trung", " Cung tháng trùng cung {lop} — chủ đề của {lop} nổi rõ trong tháng.",
                   lop=L(f"hoi.tv.lop_thuong_nho.{lop}", LOP_TEN[lop].lower()))
        for lop in m["chieu"]:
            s += L("hoi.tv.ln.chieu", " Cung {lop} nằm trong tam phương của cung tháng.",
                   lop=L(f"hoi.tv.lop_thuong_nho.{lop}", LOP_TEN[lop].lower()))
        xh = m["xu_huong"]
        s += L("hoi.tv.ln.xh", " Xu hướng tháng: {ket}", ket=_xh(xh["ket"])) + _xu_huong(xh) + "."
        khac = sorted({v for v in m["phai_khac"].values() if v != m["cung_goc"]})
        s += (L("hoi.tv.ln.phai", " Các phái khác đặt tháng này ở: {ds}.", ds="; ".join(
            f"{k} → {_tc(v)}" for k, v in m["phai_khac"].items()))
              if khac else L("hoi.tv.ln.cung_phai", " Cả năm phái tính tháng hạn đều ra cùng cung này."))
        return s, None
    if l == "sao_luu":
        doc_ma = m.get("hoi") or list(tvsl._CHINH)
        chinh = [x for x in m["muc"] if x["ma"] in doc_ma]
        khac = [x for x in m["muc"] if x["ma"] not in doc_ma]
        ds = " ".join(L("hoi.tv.sl.muc", "{loi} ({ten} ở cung {cung}.) Nên: {nen}", loi=x["loi"], ten=x["ten"],
                        cung=_va().join(_tc(c) for c in x["cac_cung"]), nen=x["nen_lam"][:1].lower() + x["nen_lam"][1:])
                      for x in chinh)
        s = L("hoi.tv.sl.dau", "Sao lưu năm {nam} ({cc}) trên lá số của bạn: {ds}", nam=m["nam"], cc=_tcc(m["can_chi"]), ds=ds)
        if m["kep_loc"] and {"kinh", "da", "loc"} & set(doc_ma):
            s += " " + m["kep_loc"]
        cy = tvsl.cau_chu_y([x for x in m["muc"] if x["ma"] in doc_ma and x["ma"] in tvsl._CHU_Y
                             and x["cung"] in tvsl.CUNG_CHU_Y], str(m["nam"]))
        if cy:
            s += " " + cy
        if khac:
            s += L("hoi.tv.sl.khac", " Các sao lưu khác năm này: {ds}.", ds="; ".join(
                L("hoi.tv.sl.khac_muc", "{ten} ở cung {cung}", ten=x["ten"], cung=_va().join(_tc(c) for c in x["cac_cung"]))
                for x in khac))
        return s + L("hoi.tv.sl.ket", " Sao lưu chỉ đọc thêm cho năm, không đổi mức của năm (đại hạn và lưu niên vẫn đứng "
                     "trước)."), None
    if l == "luu_nguyet_nam":
        ds = "; ".join(L("hoi.tv.lnn.muc", "tháng {thang}{nhuan}{nua}: {cung} ({ket})", thang=x["thang"],
                         nhuan=L("hoi.tv.nhuan", " nhuận") if x["nhuan"] else "",
                         nua=L("hoi.tv.lnn.nua_sau", " (nửa sau)") if x["phan"] == "nua_sau" else "",
                         cung=_tc(x["cung_goc"]), ket=_xh(x["ket"]))
                       for x in m["ds"])
        return (L("hoi.tv.lnn", "Lưu nguyệt năm {cc} theo phái {phai}: {ds}. Hỏi một tháng cụ thể để xem sao, tứ hoá và cách "
                  "các phái khác tính tháng đó.", cc=_tcc(m["can_chi_nam"]), phai=m["phai_ten"], ds=ds), None)
    if l == "cung_trong_han":
        ct = _dss(m["chinh_tinh"]) or L("hoi.tv.cth.khong", "không có chính tinh (đọc theo cung đối diện)")
        s = L3("hoi.tv.cth", "Việc bạn hỏi thuộc mảng {mang} (cung {cung}); trong lá số gốc cung này có: {ct}.",
               "Việc được hỏi thuộc mảng {mang} (cung {cung}); trong lá số gốc cung này có: {ct}.",
              mang=m.get("ngan") or _tc(m["cung"]), cung=_tc(m["cung"]), ct=ct)
        cham = []
        for x in m.get("soi") or []:
            gd = (L("hoi.tv.cth.gd_dai", "giai đoạn mười năm này") if x["lop"] == "dai_han"
                  else L("hoi.tv.cth.gd_nam", "năm đang xem") if x["lop"] == "luu_nien"
                  else L("hoi.tv.cth.gd_tieu", "nhịp phụ của năm"))
            for q in x["quan_he"]:
                cham.append({"trung": L("hoi.tv.cth.trung", "{gd} đi đúng vào mảng này — nó là điểm nổi của {gd}", gd=gd),
                             "loc_vao": L("hoi.tv.cth.loc_vao", "Hoá Lộc của {gd} rơi đúng mảng này — thuận, có cái vào, hợp "
                                          "làm việc đã định từ lâu", gd=gd),
                             "ky_vao": L("hoi.tv.cth.ky_vao", "Hoá Kỵ của {gd} rơi đúng mảng này — cần để ý hơn: rà kỹ, đi "
                                         "chậm, không ôm thêm", gd=gd),
                             "loc_chieu": L("hoi.tv.cth.loc_chieu", "Hoá Lộc của {gd} chiếu vào mảng này (tam phương / xung "
                                            "chiếu) — thuận nhẹ", gd=gd),
                             "ky_chieu": L("hoi.tv.cth.ky_chieu", "Hoá Kỵ của {gd} chiếu vào mảng này (tam phương / xung "
                                           "chiếu) — để ý nhẹ", gd=gd)}[q])
        if cham:
            s += L("hoi.tv.cth.soi", " Soi vào ba lớp hạn: {ds}.", ds="; ".join(cham))
        elif m.get("soi"):
            s += L("hoi.tv.cth.khong_cham", " Ba lớp hạn không chạm thẳng vào mảng này — nó không phải điểm nổi của giai đoạn, "
                   "nhịp của nó đi theo lá số gốc ở trên.")
        return s, None
    if l == "cac_dai_han":
        ds = "; ".join(f"{x['tu_tuoi']}–{x['den_tuoi']}: {_tc(x['cung_goc'])}" for x in m["ds"])
        return L("hoi.tv.cdh", "Các đại hạn trong lá số: {ds}. Hệ thống không chọn 'năm tốt' thay bạn — hãy xem chủ đề từng "
                 "giai đoạn.", ds=ds), None
    if l == "vi_tri_sao":
        if not m["cung"]:
            return L("hoi.tv.vts.khong", "Lá số của bạn không có {sao} (hoặc hệ thống chưa an sao này).", sao=_ts(m["sao"])), None
        s = L("hoi.tv.vts", "{sao} nằm ở cung {cung}", sao=_ts(m["sao"]), cung=_tc(m["cung"]))
        if m.get("mang"):
            s += L("hoi.tv.vts.mang", " (do {mang} hoá {hoa})", mang=_ts(m["mang"]), hoa=_thoa(m["sao"][4:]))
        if m.get("do_sang"):
            s += L("hoi.tv.vts.sang", ", độ sáng {ds}", ds=_tsang(m["do_sang"]))
        if m.get("dong_cung"):
            s += L("hoi.tv.vts.dong", ", đồng cung với {ds}", ds=_dss(m["dong_cung"]))
        return s + ".", None
    if l == "sat_chieu":
        if not m["ds"]:
            return (L("hoi.tv.sat.khong", "Tam phương tứ chính của Mệnh (Mệnh, Tài Bạch, Quan Lộc, Thiên Di) không có lục sát tinh "
                      "(Kình, Đà, Hỏa, Linh, Không, Kiếp) hay Hoá Kỵ."), None)
        ds = "; ".join(f"{_tc(x['cung'])}: {_dss(x['sao'])}" for x in m["ds"])
        return (L("hoi.tv.sat", "Sát tinh trong tam phương tứ chính của Mệnh — {ds}. Sát tinh không phải điềm dữ định sẵn: "
                  "chúng làm cung thêm sức ép và tính quyết liệt; gặp chính tinh sáng thì thành nghị lực, "
                  "gặp chính tinh hãm thì dễ vấp — đọc tiếp nghĩa từng sao bên dưới.", ds=ds), None)
    if l == "nhip_3_thang":
        tom = "; ".join(f"{_ten_thang(t)} — {t['nhan_muc']}" for t in m["thang"])
        s = L("hoi.tv.nhip", "Nhịp {n} tháng tới (lưu nguyệt theo phái {phai}): {tom}.", n=m["so_thang"], phai=m["ten_phai"],
              tom=tom)
        for t in m["thang"]:
            tt = _ten_thang(t)
            s += L("hoi.tv.nhip.thang", " {ten} (từ {tu} đến {den} dương lịch, Mệnh tháng ở cung {cung}): {muc} — {td}.",
                   ten=f"{tt[0].upper()}{tt[1:]}", tu=_ngay(t["tu"]), den=_ngay(t["den"]), cung=_tc(t["cung_goc"]),
                   muc=t["nhan_muc"], td=t["tieu_de_thang"].lower())
            if t["ly_do"]:
                s += " " + " ".join(t["ly_do"])
            s += f" {t['goi_y']}"
        s += L("hoi.tv.nhip.uu_tien", " Thứ tự ưu tiên khi đọc: {ut}", ut=m["uu_tien"])
        return s, m["thang"][0]["cau_tu_soi"] if m["thang"] else None
    if l == "goi_y_trang":
        s = ""
        if m["thang_thuan"]:
            s = L("hoi.tv.gyt.thuan", "Theo nhịp tứ hoá, tháng nổi lên mức Thuận trong ba tháng tới: {ds}. ",
                  ds=", ".join(_ten_thang(t) for t in m["thang_thuan"]))
        else:
            s = L("hoi.tv.gyt.khong", "Trong ba tháng tới chưa có tháng nào nổi lên mức Thuận theo nhịp tứ hoá — đó là tháng giữ "
                  "nhịp, không phải tháng xấu. ")
        return (s + L("hoi.tv.gyt", "Tử vi chỉ gợi ý nhịp tháng; muốn chọn ngày, giờ cụ thể (ngày hoàng đạo, giờ tốt, ngày nên "
                      "tránh theo tuổi), hãy dùng công cụ {ten} ({duong}). Thời điểm chỉ là một yếu tố, sự chuẩn bị của "
                      "bạn quan trọng hơn.", ten=m["ten"], duong=m["duong"])), None
    if l == "phi_hoa_y_dinh":
        s = ""
        if m.get("lai_nhan") and m["lai_nhan"].get("cung"):
            s = L("hoi.tv.phyd.lai_nhan", "Lai nhân cung của bạn là cung {cung} (can {can}, trùng can năm sinh) — mảng đời bạn "
                  "mang theo nhiều tâm sức nhất. ", cung=_tc(m["lai_nhan"]["cung"]), can=_ten.ten("can", m["lai_nhan"]["can"]))
        if not m["duong"]:
            return (s + L("hoi.tv.phyd.khong", "Theo phái phi tinh, không có đường bay Lộc hay Kỵ nổi bật chạm vào các cung của "
                          "câu hỏi này — đọc chính tinh và ba lớp hạn là đủ.")), None
        return s + L("hoi.tv.phyd", "Đường bay tứ hoá liên quan (phái phi tinh): ") + " ".join(_cau_duong(d) for d in m["duong"]), None
    if l == "luu_nien_phi_hoa":
        ds = ", ".join(L("hoi.tv.lnph.muc", "Hoá {hoa} ({sao}) vào cung {cung}", hoa=_thoa(h["hoa"]), sao=_ts(h["sao"]),
                         cung=_tc(h["den_cung"])) for h in m["hoa"] if h["den_cung"])
        s = L("hoi.tv.lnph", "Tứ hoá lưu niên năm {cc} theo can năm: {ds}.", cc=_tcc(m["can_chi"]), ds=ds)
        if m["cham"]:
            s += L("hoi.tv.lnph.cham", " Mảng bạn hỏi có {ds}.", ds=", ".join(
                L("hoi.tv.lnph.cham_muc", "Hoá {hoa} của năm ({y})", hoa=_thoa(h), y=L(f"hoi.tv.y_hoa.{_ma_ascii(h)}", phl._Y_HOA[h]))
                for h in m["cham"]))
        return s, None
    if l == "cung_checkpoint":
        if m["kieu"] == "nam":
            ds = "; ".join(f"{_tc(x['cung'])}: {_dss(x['chinh_tinh']) or L('hoi.tv.vcd_ngan', 'vô chính diệu')}"
                           + (L("hoi.tv.ckp.hoa_nam", " — Hoá {ds} của năm", ds=", ".join(_hoa_nam(h) for h in x["hoa_nam"]))
                              if x["hoa_nam"] else "") for x in m["ds"])
            return L("hoi.tv.ckp.nam", "Mười hai mảng để soi trong năm (cung gốc và chính tinh): {ds}.", ds=ds), None
        ds = "; ".join(f"{_tc(x['cung'])} ({x['chu_de']}): {_dss(x['chinh_tinh']) or L('hoi.tv.vcd_ngan', 'vô chính diệu')}"
                       for x in m["ds"])
        return L("hoi.tv.ckp", "Các cung chốt để hiểu toàn diện bản thân: {ds}.", ds=ds), None
    if l == "y_dinh":
        s = L("hoi.tv.yd", "Cách đọc nhóm câu hỏi “{ten}”: {cg}", ten=m["ten"], cg=m["cach_ghep"])
        if m["sao_trong_la"]:
            s += L("hoi.tv.yd.sao", " Sao nên soi cho câu này trong lá số của bạn: {ds}.", ds=", ".join(
                L("hoi.tv.yd.sao_muc", "{sao} ở {cung}", sao=_ts(x["sao"]), cung=_tc(x["cung"])) for x in m["sao_trong_la"]))
        return s, None
    if l == "phi_hoa_tong":
        ln_ = m["lai_nhan"]
        s = (L("hoi.tv.pht.lai_nhan", "Lai nhân cung của bạn là cung {cung} (can {can}, trùng can năm sinh).", cung=_tc(ln_["cung"]),
               can=_ten.ten("can", ln_["can"])) if ln_.get("cung") else "")
        if m["tu_hoa"]:
            s += L("hoi.tv.pht.tu_hoa", " Cung tự hoá trong lá số: {ds}.", ds="; ".join(
                L("hoi.tv.pht.tu_hoa_muc", "{cung} tự hoá {hoa} ({sao})", cung=_tc(d["tu_cung"]), hoa=_thoa(d["hoa"]),
                  sao=_ts(d["sao"])) for d in m["tu_hoa"]))
        else:
            s += L("hoi.tv.pht.khong_tu_hoa", " Lá số không có cung nào tự hoá.")
        if m["vao_menh"]:
            s += L("hoi.tv.pht.vao_menh", " Đường bay vào cung Mệnh: {ds}.", ds="; ".join(
                L("hoi.tv.pht.vao_menh_muc", "can {can} của cung {cung} hoá {sao} {hoa}", can=_ten.ten("can", d["can"]),
                  cung=_tc(d["tu_cung"]), sao=_ts(d["sao"]), hoa=_thoa(d["hoa"])) for d in m["vao_menh"]))
        else:
            s += L("hoi.tv.pht.khong_vao_menh", " Không có đường bay nào từ cung khác vào cung Mệnh.")
        return s.strip(), None
    if l == "phi_hoa_noi_bat":
        ds = " ".join(L("hoi.tv.phnb.muc", "{td}: {nghia} Việc nên làm: {viec}", td=x["tieu_de"], nghia=x["nghia"],
                        viec=x["viec_nen_lam"]) for x in m["ds"])
        tt = next((x["ghi_chu_tuan_triet"] for x in m["ds"] if x["ghi_chu_tuan_triet"]), None)
        if ds and tt:
            ds += L("hoi.tv.phnb.tt", " Lưu ý Tuần/Triệt: {tt}", tt=tt)
        return (L("hoi.tv.phnb", "Đường bay nổi bật — {ds}", ds=ds) if ds
                else L("hoi.tv.phnb.khong", "Lá số không có đường bay nổi bật theo luật đang dùng.")), \
            (m["ds"][0]["cau_tu_soi"] if m["ds"] else None)
    if l == "khai_niem_phi_hoa":
        return f"{m['ten']}: {m['giai_thich']}", None
    if l == "giai_thich":
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "cua_so":
        return chung.doan_cua_so(m), None
    if l == "so_nam":
        return chung.doan_so_nam(m["nam"]), None
    if l == "ghi_chu":
        return m["noi_dung"], None
    if l == "phuong_phap":
        return m["noi_dung"], None
    if l == "y_bo_sung":                         # TV-YBS: thân bài = doi_thuong; căn cứ = ý gốc (thuật ngữ được dùng)
        return m["can_cu"], None
    if l == "doi_song":
        return dsm.doan_doi_song(m), None
    if l == "sao_han":
        return chung.doan_sao_han(m), None
    return "", None


def _hoa_nam(h: str) -> str:
    """"Lộc (Thiên Cơ)" → theo ngôn ngữ."""
    m = re.fullmatch(r"(\S+) \((.+)\)", h) if isinstance(h, str) else None
    return f"{_thoa(m.group(1))} ({_ts(m.group(2))})" if m and not ngon_ngu.la_viet() else h


def _ghep(goi: dict) -> tuple[list[str], list[str], list[str]]:
    """→ (đoạn thân bài, câu tự soi, căn cứ). Mục có `doi_thuong` (lá của chính người hỏi): thân bài là lời đời
    thường, đoạn kỹ thuật (tên sao, độ sáng, "Mặt tối", định nghĩa cung…) chuyển vào căn cứ."""
    doan, soi, cu = [], [], []
    da_co_sao = {m["ten"] for m in goi["muc"] if m["loai"] == "chinh_tinh"}
    for i, m in enumerate(goi["muc"]):
        d, s = _doan(m, da_co_sao)
        if "doi_thuong" in m:
            if d:
                cu.append(d)
            d = m["doi_thuong"]
        if m["loai"] == "doi_song":
            cu.extend(m.get("can_cu_ds", []))
            d = dsm.doan_doi_song(m, "\n".join(doan), khoa=("hoi.tv", "ds", i))
        if d:
            doan.append(d)
        if s and not soi:
            soi.append(s)
    return doan, soi, list(dict.fromkeys(cu))


def goi_cho_llm(goi: dict) -> dict:
    """Gói cho tầng diễn đạt AI: mục lá của CHÍNH người hỏi chỉ mang lời đời thường (`doi_thuong`) + câu tự soi —
    đoạn kỹ thuật (độ sáng, "Mặt tối", định nghĩa cung) ở lại "Vì sao nói vậy", không đưa cho AI viết lại.
    Mục không có `doi_thuong` (câu hỏi kiến thức chung) giữ nguyên."""
    muc = []
    for m in goi["muc"]:
        if m.get("loai") in ("doi_song", "sao_han"):      # MT-ĐS B2/B3: căn cứ kỹ thuật ở lại "Vì sao nói vậy"
            muc.append({"loai": m["loai"], "noi_dung": dsm.doan_doi_song(m) if m["loai"] == "doi_song" else chung.doan_sao_han(m)})
        elif "doi_thuong" not in m:
            muc.append(m)
        elif m["doi_thuong"]:
            muc.append({"loai": m.get("loai"), "noi_dung": m["doi_thuong"], **({"ma": m["ma"]} if m.get("ma") else {}),
                        **({"cau_tu_soi": m["cau_tu_soi"]} if m.get("cau_tu_soi") else {})})
    return {**goi, "muc": muc}


def can_cu_template(goi: dict) -> list[str]:
    """Căn cứ kỹ thuật cho "Vì sao nói vậy" (rỗng khi câu trả lời không có mục lời đời thường)."""
    return [] if goi["mau"] and not goi["muc"] else _ghep(goi)[2]


def van_template(goi: dict) -> str:
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    doan, soi, _ = _ghep(goi)
    if goi["mau"]:
        doan.append(goi["mau"])
    if soi:
        doan.append(L("hoi.tu_soi", "Câu hỏi để tự soi: ") + soi[0])
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(L("hoi.ket", hoi_van.KET))
    return "\n\n".join(doan)


# ------------------------------------------------------------------ điểm vào
def _cong_nam(d: dt.date, n: int) -> dt.date:
    try:
        return d.replace(year=d.year + n)
    except ValueError:
        return d.replace(year=d.year + n, day=28)


def _them_so_nam(goi: dict, pl: dict, sinh: dict, ngay_xem: dt.date, ls: dict) -> None:
    """EN-3: câu nêu năm (một hay hai năm, "năm sau") → đoạn đầu nói mức của ĐÚNG các năm đó, lấy từ dòng 10 năm của
    báo cáo (`tuvi_doi_song.dong_muoi_nam` — cùng mức chương Vận hạn, một nguồn). Năm ngoài 10 năm tới bỏ qua."""
    from app.luangiai import tuvi_doi_song as tvd  # noqa: PLC0415
    nam_hoi = chung.nam_hoi_hh(pl["cau_chuan_hoa"], ngay_xem, "am")
    if not nam_hoi:
        return
    tz = sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ)
    nam_am_xem = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, config.CALENDAR_MERIDIAN_TZ)[2]
    nam_am_sinh = lunar.solar_to_lunar(sinh["ngay"].day, sinh["ngay"].month, sinh["ngay"].year, tz)[2]
    dong = tvd.dong_muoi_nam(ls, tvd.cham_cung(ls), nam_am_xem, nam_am_sinh, sinh.get("gioi_tinh"))
    chung.them_so_nam(goi, dong, nam_hoi, ("sao_han",))      # tập quán sao hạn giữ đứng đầu


def tra_loi(cau_hoi: str, che_do: str = "tham_khao", sinh: dict | None = None,
            ngay_xem: dt.date | None = None, dung_llm: bool = False, y_dinh_goi_y: str | None = None,
            nguoi_than: bool = False) -> dict:
    """`nguoi_than` (EN-ALL GĐ 4): lá số gửi lên là của NGƯỜI THÂN (web: mục "Đang xem" người thân) → lời hệ thống ngôi thứ
    ba + một dòng mở đầu nói rõ lá số của ai. Không gửi → như cũ (golden bản Việt không đổi)."""
    tok = NGUOI_THAN.set(bool(nguoi_than))
    try:
        kq = _tra_loi_ngon_ngu(cau_hoi, che_do, sinh, ngay_xem, dung_llm, y_dinh_goi_y)
    finally:
        NGUOI_THAN.reset(tok)
    return kq


def _tra_loi_ngon_ngu(cau_hoi: str, che_do: str = "tham_khao", sinh: dict | None = None,
                      ngay_xem: dt.date | None = None, dung_llm: bool = False, y_dinh_goi_y: str | None = None) -> dict:
    """`sinh` = {"ngay": date (dương, kinh tuyến UTC+7), "ti": 0..12, "gioi_tinh": "nam"|"nu"}.
    `y_dinh_goi_y`: xem phan_loai (mã lạ / câu đặc biệt / từ khoá đã nhận ra → bỏ qua)."""
    if che_do not in CHE_DO:
        raise ValueError(f"che_do phải là một trong {CHE_DO}")
    sinh = az.chuan_sinh(sinh)                  # EN-6 BI-2: giờ Tý muộn = ngày sau, giờ Tý (cùng ngày lá số)
    pl = phan_loai(cau_hoi, che_do, y_dinh_goi_y=y_dinh_goi_y)
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    if ngon_ngu.la_viet():
        return _tra_loi(pl, cau_hoi, sinh, ngay_xem, dung_llm)
    # EN-ALL GĐ 4 (mẫu hỏi đáp Bát tự): phân loại MỘT lần (câu gốc, đã dịch ý), dựng bản Việt trước để ghi các quyết định
    # dựa trên chữ (thứ tự đoạn, đoạn mở đầu, câu trùng — `doi_song_khuon.vi_quyet_dinh`), rồi dựng bản ngôn ngữ đó theo
    # đúng các quyết định ấy; cuối cùng đổi tên riêng trong gói bằng chứng sang ngôn ngữ đó (mã ở `phan_loai` giữ nguyên).
    kq = _hien(_tra_loi_theo_vi(pl, cau_hoi, sinh, ngay_xem, False))
    from app.luangiai import an_toan as _at  # noqa: PLC0415
    if pl["xu_ly"] != "an_toan" and _at.ho_tro_mem_en(cau_hoi):     # tầng hỗ trợ MỀM — chỉ bản ngôn ngữ khác tiếng Việt
        kq["ho_tro"] = _at.loi_ho_tro_mem()
    return kq


def _raw(pl: dict) -> str | None:
    """Câu gốc cho các bước đọc chữ (điều được hỏi, sao lưu được hỏi) — chỉ khi câu gốc chính là câu được phân loại (câu
    tiếng Việt). Câu ngôn ngữ khác đã dịch ý sang cụm từ khoá (`en_gloss`) → các bước đó đọc trên cụm từ khoá."""
    goc = pl.get("cau_goc")
    return goc if goc and chung.chuan_hoa_cau(goc) == pl.get("cau_chuan_hoa") else None


def _tra_loi(pl: dict, cau_hoi: str, sinh: dict | None, ngay_xem: dt.date, dung_llm: bool) -> dict:
    import copy  # noqa: PLC0415
    pl = copy.deepcopy(pl)
    ls = vh = vh_toi = lnm = None
    can_la_so = pl["loai"] in ("la_so", "han", "vi_tri_sao", "cach_cuc_la_so", "sat_tinh_la_so", "phi_hoa")
    yd = pl.get("y_dinh")
    ch = Y_DINH_CAU_HINH.get(yd, {})
    them: dict = {}
    if sinh and can_la_so:
        az.nap_truoc_sinh(sinh, ngay_xem)   # EN-4: một lời gọi iztro cho lá số + ngày xem + mốc lưu nguyệt
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
            lnm = lnm if ngon_ngu.la_viet() else _th.luu_nguyet(lnm)
        elif yd == "ba_thang_toi" and chung.co(pl["cau_chuan_hoa"], [r"tung thang", r"moi thang"]):
            pl["thang_hoi"] = thang_hoi("", ngay_xem, pl["nam_xem"], pl["han_sau"])
            lnm = lnl.lap_nam(sinh, pl["thang_hoi"]["nam_am"], sinh.get("luu_nguyet", ln.MAC_DINH), ls=ls)
            lnm = lnm if ngon_ngu.la_viet() else _th.luu_nguyet(lnm)
        if pl.get("sao_luu") and vh is not None:           # EN-5.2: sao lưu của đúng năm được hỏi
            xem_sl = dt.date.fromisoformat(vh["ngay_xem"])
            tz_sl = az.TZ_TRUNG if sinh.get("lich") == "trung" else config.CALENDAR_MERIDIAN_TZ   # cùng lịch với báo cáo
            sl_nam = lunar.solar_to_lunar(xem_sl.day, xem_sl.month, xem_sl.year, tz_sl)[2]
            them["sao_luu"] = {**tvsl.doc(ls, az.sao_luu_nam(
                sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], xem_sl, tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
                thang_nhuan=sinh.get("thang_nhuan", "thang_sau"), lich=sinh.get("lich", "viet")), sl_nam), "nam": sl_nam}
        if ch.get("nhip"):
            them["nhip"] = nhip3.lap(sinh, ngay_xem, sinh.get("luu_nguyet", ln.MAC_DINH), ls=ls)
        if (yd or pl["loai"] == "phi_hoa") and ls.get("can_nam"):
            xem_phi = dt.date.fromisoformat(vh["ngay_xem"]) if vh else ngay_xem
            nam_am = lunar.solar_to_lunar(xem_phi.day, xem_phi.month, xem_phi.year, config.CALENDAR_MERIDIAN_TZ)[2]
            them["phi"] = phl.lap(ls, ls["can_nam"], nam_am if (ch.get("han") or yd == "tong_quan_nam") else None)
    goi = goi_bang_chung(pl, ls, vh, vh_toi, lnm, them)
    if pl["loai"] in _LOAI_KIEN_THUC and pl.get("phuong_phap") and not goi["can_them"]:
        goi["muc"] += ybs.muc_phuong_phap(pl)          # TV-YBS: ý phương pháp (ý chung, đã viết lại) sau phần kiến thức
        chung.ket(goi)
    bc_ds = None
    if ls is not None and pl["loai"] in ("la_so", "han") and not goi["can_them"]:
        bc_ds = _them_doi_song(goi, pl, sinh, ngay_xem, ls, vh)
    if pl.get("sao_han") and sinh and not goi["can_them"]:
        nam_xem = pl["nam_xem"] or lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, config.CALENDAR_MERIDIAN_TZ)[2] \
            + (1 if pl["han_sau"] else 0)
        goi["muc"].insert(0, chung.muc_sao_han(nam_xem, sinh["ngay"].year, sinh["gioi_tinh"], sinh["ngay"].month, sinh["ngay"].day))
        chung.ket(goi)
    if ls is not None and sinh and not goi["can_them"] and pl["xu_ly"] in ("tra_loi", "tra_loi_kem_luu_y"):
        _them_so_nam(goi, pl, sinh, ngay_xem, ls)
        _them_chu_y(goi, pl, sinh, ngay_xem, ls, bc_ds)                  # CY-1
    if ls is not None and sinh:
        chung.them_cua_so(goi, pl, "tuvi", sinh, ngay_xem, ls, ("sao_han",))   # EN-5.4
    if sinh:
        ybs.them(goi, pl, ls, vh, sinh.get("gioi_tinh"), vh_toi)   # TV-YBS: "Một cách đọc thêm" — cuối câu trả lời chính
    if chung.xac_nhan(pl["cau_chuan_hoa"]) and goi["muc"]:
        goi["luu_y"] = kb.luu_y("xac_nhan") + (" " + goi["luu_y"] if goi.get("luu_y") else "")
        chung.ket(goi)
    van = chung.tra_loi_truoc(van_template(goi), goi["phan_loai"].get("cau_chuan_hoa") or chung.chuan_hoa_cau(cau_hoi),
                              khoa=("hoi.tv", "truoc"))   # EN-3
    if pl["xu_ly"] not in chung.DAC_BIET:            # EN-3b: đoạn mở đầu trả lời đúng điều được hỏi
        van = mo_dau.dat_dau(van, mo_dau.doi_song_mo(goi, pl["cau_chuan_hoa"], "tuvi", _raw(pl), khoa=("hoi.tv", "mo")), goi,
                             khoa=("hoi.tv", "dat"))
    van = ybs.xep_cuoi(van, mo_dau._CHAN + chung._CHAN, khoa=("hoi.tv", "xep"))
    if NGUOI_THAN.get() and ls is not None and pl["xu_ly"] not in chung.DAC_BIET:
        van = L("hoi.tv.nt.dau", "Đây là lá số của người thân bạn đang xem: mọi chữ “bạn” trong lời đọc bên dưới là nói về "
                "người đó, không phải về bạn.") + "\n\n" + van
    che_do_van, loi = "template", []
    if dung_llm and goi["muc"] and not goi["can_them"]:
        try:
            v = hoi_van._goi_llm(goi_cho_llm(goi), cau_hoi)
            loi = hoi_van.kiem_tra_dau_ra(v, goi, van)   # EN-4: bản mẫu là nguồn chữ
            che_do_van, van = ("llm", v) if not loi else ("template_fallback", van)
        except Exception as e:  # noqa: BLE001
            che_do_van, loi = "template_fallback", [f"llm lỗi: {mo_ta_loi(e)}"]
    co = []
    if ls is not None:
        co.append({"loai": "nam_phai", "chi_tiet": kb.luu_y("iztro")})
    dac_biet = pl["xu_ly"] in chung.DAC_BIET or bool(goi["can_them"])
    return {"hoi_lai": chung.hoi_lai_neu(pl, "tuvi"), "phan_loai": goi["phan_loai"], "van_han": vh, "bang_chung": goi, "cau_tra_loi": van,
            "can_cu": can_cu_template(goi), "truc_quan": truc_quan.tuvi(goi, ls), "hoi_tiep": truc_quan.hoi_tiep_tuvi(goi, ls),
            "che_do_van": che_do_van, "loi_kiem_tra": loi, "can_them": goi["can_them"],
            "co_canh_bao": co, "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong",
            # LG-ĐS: web chỉ tra kho vectơ khi co_the_goi_y (từ khoá không nhận ra, câu bản mệnh/hạn, không đặc biệt).
            "nhan_ra_y_dinh": bool(pl.get("nhan_ra_y_dinh")), "co_the_goi_y": bool(pl.get("co_the_goi_y")),
            "y_dinh_tu_goi_y": bool(pl.get("y_dinh_tu_goi_y"))}


def _tra_loi_theo_vi(*a, **kw):
    """`_tra_loi` bọc "bản Việt quyết, bản dịch theo" (import muộn — doi_song_khuon nạp nhiều module)."""
    from app.luangiai import doi_song_khuon as _dsk  # noqa: PLC0415
    return _dsk.vi_quyet_dinh(_tra_loi)(*a, **kw)


# ------------------------------------------------------------------ EN-ALL GĐ 4: gói bằng chứng theo ngôn ngữ
_KHOA_BO_QUA = {"ma", "loai", "ma_mau", "source_id", "school_id", "trang_thai", "phai", "lop", "vai", "kieu", "phan", "muc",
                "duong", "che_do", "xu_ly", "y_dinh", "chuong", "loai_noi_bat", "slug"}


def _hien_chuoi(k: str, v: str) -> str:
    if k == "chi":
        return _ten.ten("chi", v)
    if k == "can":
        return _ten.ten("can", v)
    if k.startswith("can_chi"):
        return _tcc(v)
    if k == "nhom":
        return _ten.ten("cat_hung", v) if v in ("cát", "hung") else L("hoi.tv.nhom.trung", v) if v == "trung" else _nhom_sao(v)
    if k == "ket":
        return _xh(v)
    if k == "cuc":
        return _ten.ten("cuc", v)
    if k == "do_sang":
        return _tsang(v)
    if k in ("hoa", "cham") and _ten.muc("hoa", v):
        return _thoa(v)
    if k == "hoa_nam":
        return _hoa_nam(v)
    for nhom in ("cung", "sao"):
        if _ten.muc(nhom, v):
            return _ten.ten(nhom, v)
    if " và " in v and all(_ten.muc("cung", c) for c in v.split(" và ")):
        return _tc(v)
    if re.fullmatch(r"(.+?) hoá (Lộc|Quyền|Khoa|Kỵ)|(.+?) \((.+)\)|Hoá (Lộc|Quyền|Khoa|Kỵ)", v):
        return _ts(v)
    return v


def _hien_goi(x, k: str = ""):
    if isinstance(x, dict):
        return {kk: (v if kk in _KHOA_BO_QUA and isinstance(v, str) else _hien_goi(v, kk)) for kk, v in x.items()}
    if isinstance(x, list):
        return [_hien_goi(v, k) for v in x]
    if isinstance(x, str):
        return _hien_chuoi(k, x)
    return x


def _hien(kq: dict) -> dict:
    """Bản ngôn ngữ khác: tên riêng trong gói bằng chứng (`bang_chung`, chỉ để hiển thị / kiểm tra) theo ngôn ngữ; mã ở
    `phan_loai` (web dùng làm khoá) giữ nguyên, tên hiển thị đi qua `ten_hien`."""
    import copy  # noqa: PLC0415
    kq = dict(kq)
    kq["bang_chung"] = _hien_goi(copy.deepcopy(kq["bang_chung"]))
    return kq
