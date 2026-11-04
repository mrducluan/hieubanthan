# -*- coding: utf-8 -*-
"""EN-1 (AT-1) — MỘT bộ chặn an toàn cho cả 5 mảng hỏi đáp (Thần số `luangiai.hoi`, Huyền học `hoidap.chung`),
`/v1/hoi/dac-biet` và ô "Hôm nay bạn định làm gì".

Vì sao so khớp CẢ chữ có dấu: bỏ dấu làm trùng nghĩa ("dạy/dậy", "mát/mất", "dùng/dừng", "thầy thuốc/thay thuốc",
"tự kỷ luật/tự kỷ", "thân suy/suy thận", "bảo hành/bạo hành") → bản đầu của EN-1 chặn nhầm 27 câu bình thường (review
độc lập). Mỗi luật là (mẫu không dấu, mẫu có dấu | None):
- câu người dùng gõ CÓ dấu → dùng mẫu có dấu nếu luật có (chính xác); không có → mẫu không dấu;
- câu gõ KHÔNG dấu → mẫu không dấu (chặt hơn ở chỗ mơ hồ, chấp nhận bỏ sót nhẹ hơn chặn nhầm).
Dấu câu , . ! ? ; được giữ để biết hết vế (`_H`). Không import module nào của app (tránh vòng import)."""
from __future__ import annotations

import re
import unicodedata

_H = r"(?=\s*[,.!?;]|\s*$)"          # hết vế câu
_AI = r"(tôi|em|mình|con|tớ|tao|t|mk)"
_AI_KD = r"(toi|em|minh|con|to|tao|t|mk)"

# ------------------------------------------------------------------ khủng hoảng (ý tự hại, bạo lực đang xảy ra)
KHUNG_HOANG: list[tuple[str, str | None]] = [
    # tự hại nói thẳng
    (r"(muon|nen|dinh|se|thi|de|thoi|toan) chet (di|cho|quach|luon|phut)", None), (r"chet di cho", None),
    (r"chet cho (xong|roi|do)", None), (r"(muon|het muon) chet", None), (r"nghi den (chuyen )?(tu tu|chet)", None),
    (r"(muon|nghi den|dinh|toan|se|nen|da|tinh) tu tu(?! (tim|tinh|lam|roi|hieu|xem|noi|thoi|ma))", r"tự tử|tự sát"),
    (r"tu sat", r"tự sát"), (r"ket lieu (ban than|doi|minh|cuoc)", None), (r"tu thieu", None),
    (r"tu (ket thuc|ket lieu) (doi|cuoc doi|cuoc song|ban than)", None),
    (r"muon ket thuc(?! (du an|hop dong|moi quan he|quan he|viec|cong viec|khoa hoc))", None),
    (r"ket thuc (cuoc doi|tat ca|het)( cho xong| di)?", None),
    # EN-3 (bộ dev): nói tránh — "đi luôn cho rảnh nợ", "kết thúc / buông hết mọi thứ cho xong" (không chặn "làm đi luôn
    # cho xong việc", "đi luôn cho kịp chuyến bay", "kết thúc mối quan hệ cho xong")
    (r"(?<!lam )(?<!noi )(?<!viet )di luon cho (ranh no|xong|nhe nguoi|nhe no|thoat)", None),
    (r"(ket thuc|buong (het|bo)|bo het) moi thu cho (xong|roi|nhe|ranh)(?! voi| (di|de) | dau| dau oc| long)", None),
    # review EN-3: nói tránh còn lọt — "tôi là gánh nặng", "muốn đi luôn" (hết câu), "không muốn tỉnh dậy", "chẳng
    # bằng chết", "mệt quá muốn buông hết" (không chặn "gánh nặng tài chính", "đi luôn chuyến bay sáng mai")
    (r"(toi|minh|em|con|tao|tui) (chi )?la (mot |cai )?ganh nang(?! (tai chinh|tien|cong viec|kinh te|no|gi))", None),
    # "đi luôn" chỉ là khủng hoảng khi đi cùng lời buồn chán / gánh nặng (code-review: "Mai mình định đi luôn")
    (r"(met|chan|ganh nang|buon|vo nghia|that vong|het chiu|kho qua|tuyet vong|khong thiet).{0,60}(muon|nen) di luon"
     r"( khong| nhi| cho xong)?" + _H, None),
    (r"khong muon (tinh|thuc) day( nua| luon| mai)?" + _H, None),
    (r"(chang|khong|thua) bang (chet|chet di|chet quach)", None),
    (r"met (qua|lam|moi|roi).{0,20}muon buong (het|xuoi|tay|bo het)" + _H
     + r"|muon buong xuoi (tat ca|het|cho xong)", None), (r"cham dut (tat ca|cuoc doi|moi thu|cuoc song)", None),
    (r"(uong|nuot) het (ca )?(vi |lo |hop )?(thuoc|vi thuoc)", None), (r"mua san thuoc ngu", None),
    (r"nhay (xuong|lau|cau|song)|nhay tu tang", r"nhảy (xuống|lầu|cầu|sông)|nhảy từ tầng"),
    (r"cat tay|rach tay|tu hai (ban than|minh)|tu lam dau|(muon|hay|thuong) lam dau (ban than|chinh minh)",
     r"cắt tay|rạch tay|tự hại (bản thân|mình)|tự làm đau|(muốn|hay|thường) làm đau (bản thân|chính mình)"),
    (r"thu tu biet|(viet|de lai) (san )?di thu|(tinh|muon|se|dinh) ra di (de|cho) (moi nguoi|ca nha|gia dinh|bo me) "
     r"(khoi|do|bot|nhe|thanh than|duoc thanh than)",
     r"thư từ biệt|(viết|để lại) (sẵn )?di thư|(tính|muốn|sẽ|định) ra đi (để|cho) (mọi người|cả nhà|gia đình|bố mẹ) "
     r"(khỏi|đỡ|bớt|nhẹ|thanh thản|được thanh thản)"),
    (r"(khong|chang) (con )?dang (song|duoc song)", r"(không|chẳng) (còn )?đáng (sống|được sống)"),
    (r"ra di cho (xong|nhe no|nhe nhang|nhe nguoi)", r"ra đi cho (xong|nhẹ nợ|nhẹ nhàng|nhẹ người)"),
    (r"bo di mai mai|luc toi ra di|nghi ngoi mai mai|ngu mai mai", r"bỏ đi mãi mãi|lúc tôi ra đi|nghỉ ngơi mãi mãi|ngủ mãi mãi"),
    (r"la nen buong tay|het chiu noi|lam luon cho xong|khong cho nua dau", None),
    (_AI_KD + r" (cu )?muon di theo", None),
    # không muốn sống / không muốn tồn tại (trừ "không muốn sống chung / ở …")
    (r"(chang|khong|ko|k|het) (con )?muon song( nua)?(?! (chung|o|voi|cung|gan|tai|trong|nhu|kieu|cuoc))",
     r"(chẳng|không|ko|k|hết) (còn )?muốn sống( nữa)?(?! (chung|ở|với|cùng|gần|tại|trong|như|kiểu|cuộc))"),
    (r"(chang|khong|ko|k) (con )?(thiet|muon) ton tai|gia nhu " + _AI_KD + r" (khong|chua) (ton tai|duoc sinh ra|co mat)",
     r"(chẳng|không|ko|k) (còn )?(thiết|muốn) tồn tại|giá như " + _AI + r" (không|chưa) (tồn tại|được sinh ra|có mặt)"),
    (r"(chang|khong|ko|k|het) (con )?thiet (song|tha (gi )?nua" + _H + r"|tha (gi )?(voi )?(cuoc song|cuoc doi|song))",
     r"(chẳng|không|ko|k|hết) (còn )?thiết (sống|tha (gì )?nữa" + _H + r"|tha (gì )?(với )?(cuộc sống|cuộc đời|sống))"),
    (r"chang con ly do|(khong|chang) con ly do (gi )?(de )?(song|tiep tuc)|con ly do de song", None),
    (r"bien mat (thi|cho|di)(?! (khoi|o|tren))", r"biến mất (thì|cho|đi)(?! (khỏi|ở|trên))"),
    (r"song (de )?lam gi( nua| ca)?" + _H + r"|song cung chang de lam gi|chan song", None),
    (r"(cuoc song|cuoc doi|song|moi thu) (that |qua |deu |thay |chang con |khong con )*(vo nghia|y nghia gi)(?! neu)",
     r"(cuộc sống|cuộc đời|sống|mọi thứ) (thật |quá |đều |thấy |chẳng còn |không còn )*(vô nghĩa|ý nghĩa gì)(?! nếu)"),
    (r"(chang|khong|ko|k) (con )?gi (de )?(luu luyen|tiec nuoi)", None),
    # không muốn tỉnh dậy (chỉ dạng "thức dậy" khi gõ không dấu — "dạy/dậy" trùng nhau)
    (r"(chang|khong|ko|k) muon thuc day( nua| vao sang mai)?",
     r"(chẳng|không|ko|k) muốn (thức )?dậy (nữa|vào sáng mai)"),
    (r"ngu (mot giac |luon |mai )?(khong|chang) (bao gio |con )?(tinh |thuc )?(day|tinh)( nua| lai)?",
     r"ngủ (một giấc |luôn |mãi )?(không|chẳng) (bao giờ |còn )?(tỉnh |thức )?(dậy|tỉnh)( nữa| lại)?"),
    # gánh nặng / mọi người tốt hơn nếu không có mình
    (r"(la|chi la|thanh|cai) ganh nang (cho|cua) (moi nguoi|gia dinh|bo me|ca nha|nguoi khac|tat ca)|chi la (cai )?ganh nang"
     r"|(sinh ra|ton tai) (la|chi la) ganh nang",
     r"(là|chỉ là|thành|cái) gánh nặng (cho|của) (mọi người|gia đình|bố mẹ|cả nhà|người khác|tất cả)|chỉ là (cái )?gánh nặng"
     r"|(sinh ra|tồn tại) (là|chỉ là) gánh nặng"),
    (r"moi nguoi (se )?(vui|nhe nhom|song tot|thanh than|hanh phuc) hon (neu|khi) (khong co|thieu) " + _AI_KD, None),
    (r"khong ai can " + _AI_KD + r"( ca| nua)?" + _H, r"không ai cần " + _AI + r"( cả| nữa)?" + _H),
    (r"di (dau do )?(that )?xa cho xong", r"đi (đâu đó )?(thật )?xa cho xong"),
    (r"(uong het|nhay|chet|ra di|bien mat|ket lieu).{0,25}cho xong", None),
    (r"(muon |dinh )?bien mat (khoi (cuoc doi|the gioi|tran gian|doi|coi doi)|mai mai|vinh vien)", None),
    (_AI_KD + r" (muon |chi muon )?bien mat" + _H, _AI + r" (muốn |chỉ muốn )?biến mất" + _H),
    (r"thay minh vo dung|ngu mot giac khong", None),
    # bạo lực, xâm hại đang xảy ra (lời hỗ trợ có số 113 / 111)
    (r"(bi|gia dinh|chong|vo|bo|me) bao hanh|bao hanh (gia dinh|tinh than|tinh duc)|bao luc (gia dinh|tinh duc)",
     r"bạo hành|bạo lực (gia đình|tình dục)"),
    (r"bi (danh dap|hanh ha|xam hai|cuong hiep|hiep dam)|cuong hiep|hiep dam|xam hai (tinh duc|than the)|so soang|bop co"
     r"|doa giet|de doa giet", r"bị (đánh đập|hành hạ|xâm hại|cưỡng hiếp|hiếp dâm)|cưỡng hiếp|hiếp dâm|xâm hại|sờ soạng"
     r"|bóp cổ|dọa giết|đe dọa giết|doạ giết|đe doạ giết"),
    (r"bi (chong|vo|bo|me|ba|nguoi yeu|ny|ban trai|ban gai|bo duong|me ke|cha duong) (toi |em |minh )?(danh|tat|dap|hanh ha)"
     r"(?! (gia|tieng|dau|tien|bai|co|dan|golf|cau))",
     r"bị (chồng|vợ|bố|mẹ|ba|người yêu|ny|bạn trai|bạn gái|bố dượng|mẹ kế|cha dượng) (tôi |em |mình )?(đánh|tát|đập|hành hạ)"
     r"(?! (giá|tiếng|dấu|tiền|bài|cờ|đàn|golf|cầu))"),
    (r"(chong|vo|bo|me|nguoi yeu|ny|ban trai|bo duong|cha duong) (toi |em |minh )?(hay |thuong |cu |suot ngay |da )?"
     r"(danh|tat|dap|hanh ha) (toi|em|minh)(?! (gia|tieng))",
     r"(chồng|vợ|bố|mẹ|người yêu|ny|bạn trai|bố dượng|cha dượng) (tôi |em |mình )?(hay |thường |cứ |suốt ngày |đã )?"
     r"(đánh|tát|đập|hành hạ) (tôi|em|mình)(?! (giá|tiếng))"),
    (r"danh (toi|em) (gay|chay mau|tim|bam)", r"đánh (tôi|em) (gãy|chảy máu|tím|bầm)"),
    # biến cố dồn dập (giữ từ bản cũ)
    (r"bi lua het tien|no nan chong chat", r"bị lừa hết tiền|nợ nần chồng chất"),
    # EN-3c (review độc lập): kể mình (hay người thân) ĐANG bị trầm cảm → lời hỗ trợ, không phải câu từ chối "ngoài phạm
    # vi". Câu hỏi thuốc ("dừng thuốc chống trầm cảm") vẫn ở nhóm từ chối bên dưới.
    # Câu hỏi chẩn đoán "có bị trầm cảm không" vẫn là từ chối (MT-ĐS) → loại khi theo sau là đuôi hỏi.
    (r"(?<!co )(bi|mac|dang bi|dang|toi|em|minh|to|tui) (benh )?tram cam(?! (la|co phai|khac|va|khong|ko|k|chua|hay khong))",
     r"(?<!có )(bị|mắc|đang bị|đang|tôi|em|mình|tớ|tui) (bệnh )?trầm cảm(?! (là|có phải|khác|và|không|ko|k|chưa|hay không))"),
    (r"(me|bo|con|chong|vo|ong|ba|anh|chi|em) (toi |minh |em )?vua mat(?! viec| tien| tich| ngu| dien| nuoc)",
     r"(mẹ|bố|con|chồng|vợ|ông|bà|anh|chị|em) (tôi |mình |em )?vừa mất(?! việc| tiền| tích| ngủ| điện| nước)"),
]

# ------------------------------------------------------------------ từ chối nhẹ (chẩn đoán, tuổi chết, may rủi…)
TU_CHOI: list[tuple[str, str | None, str]] = [
    # bệnh nặng / chẩn đoán / bỏ thuốc
    (r"(bi|co|mac|chan doan|khoi) u (gan|phoi|nao|vu|xo|tuyen giap|da day|buong trung|tu cung)",
     r"(bị|có|mắc|chẩn đoán|khối) u (gan|phổi|não|vú|xơ|tuyến giáp|dạ dày|buồng trứng|tử cung)", "suc_khoe_the_chat"),
    (r"chan doan (u|ung thu|benh)|lanh hay ac|ung thu|xo gan|dot tu|dot quy|tai bien|vo sinh(?! (nam )?(19\d{2}|200\d|201\d)(?!\w))|tim bam sinh|tieu duong",
     r"chẩn đoán (u|ung thư|bệnh)|lành hay ác|ung thư|xơ gan|đột tử|đột quỵ|tai biến|vô sinh|tim bẩm sinh|tiểu đường",
     "suc_khoe_the_chat"),
    # EN-3d (bộ dev): triệu chứng tim mạch + hỏi bệnh ("đau ngực… có phải dễ bị bệnh tim") → khuyên đi khám, không luận số.
    (r"(?<!khoa )(?<!kham )benh (tim|phoi|gan|than|mau)(?! (la|nhu))|(bi|hay|thay|dang) (dau|tuc) nguc|(bi|hay|dang) kho tho(?! (vi|qua vi|voi))",
     r"(?<!khoa )(?<!khám )bệnh (tim|phổi|gan|thận|máu)|(bị|hay|thấy|đang) (đau|tức) ngực|(bị|hay|đang) khó thở(?! (vì|quá vì|với))", "suc_khoe_the_chat"),
    # SK-1: triệu chứng cấp ("Tôi đau ngực khó thở quá", "Tôi ngất xỉu") — xem `cap_cuu()` (kiểm TRƯỚC mọi luật từ chối).
    (r"(be|con|chau|bi) .{0,15}(sot cao|co giat)|co giat", r"(bé|con|cháu|bị|đang) .{0,15}sốt cao|sốt cao (co giật|liên tục|mấy ngày|không hạ|không dứt)|co giật", "suc_khoe_the_chat"),
    (r"(bi|benh|con|be|chau) .{0,12}dong kinh", r"động kinh", "suc_khoe_the_chat"),
    (r"tu ky(?! luat)", r"tự kỷ(?! luật)", "suc_khoe_the_chat"),
    (r"(bi|benh|chay) .{0,6}suy than|suy than (giai doan|man|cap)", r"suy thận(?! khí)|thận yếu", "suc_khoe_the_chat"),
    (r"(bi|mac|chua) tram cam|tram cam nang|thuoc (chong )?tram cam", r"trầm cảm|chống trầm cảm", "suc_khoe_the_chat"),
    (r"(hoi chung|bi) down", r"(hội chứng|bị) down", "suc_khoe_the_chat"),
    (r"(thai|be|con) .{0,25}di tat|di tat (bam sinh|thai)|bi di tat", r"dị tật", "suc_khoe_the_chat"),
    (r"(bo|ngung) (uong )?thuoc (dieu tri|huyet ap|tieu duong|ung thu|bac si|chong tram cam)|(bo|ngung) hoa tri"
     r"|ngung dieu tri|thuoc nam thay (cho )?thuoc|(uong|dung) thuoc nam (thay|de chua)",
     r"(bỏ|ngưng|ngừng|dừng) (uống )?thuốc (điều trị|huyết áp|tiểu đường|tim|ung thư|tây|bác sĩ|chống trầm cảm)"
     r"|(bỏ|ngưng|ngừng|dừng) (hoá|hóa) trị|(ngưng|ngừng|dừng|bỏ) điều trị|thay (cho )?thuốc (bác sĩ|điều trị)"
     r"|(uống|dùng) thuốc nam (thay|để chữa)", "suc_khoe_the_chat"),
    # EN-3 (bộ dev): quyết định mổ / phẫu thuật thay lời bác sĩ ("mổ" không dấu trùng "mở" → chữ không dấu cần ngữ cảnh y khoa)
    (r"(bac si|benh vien).{0,40}(nen|co nen) mo( (mat|ruot|tim|u|khoi u|soi|lay|tuyen|xuong|bung|de)\b|(?= khong| hay)"
     r"|(?=\s*[,.!?;]|\s*$))|(nen|co nen) (phau thuat|mo) hay (uong|chua|dieu tri|dung) thuoc"
     r"|phau thuat hay (uong|chua|dieu tri)|(co )?nen phau thuat (khong|hay)",
     r"(có )?nên mổ (không|hay)|mổ hay (uống|chữa|điều trị|dùng)|(có )?nên phẫu thuật|phẫu thuật hay (uống|chữa|điều trị)",
     "suc_khoe_the_chat"),
    (r"(chet|qua doi) vi benh gi|benh gi (se )?(chet|qua doi)", r"(chết|qua đời|mất) vì bệnh gì", "suc_khoe_the_chat"),
    # tuổi chết / sống được bao lâu (tương lai — không chặn câu hỏi về người đã mất, ngày giỗ)
    (r"may tuoi (thi |se )?(" + _AI_KD + r" )?(se )?(chet|qua doi)|(?:^|[,.!?;] )" + _AI_KD
     + r" (se )?(chet|qua doi) (nam|luc|khi) (may tuoi|nao)"
     r"|(nam|luc) (bao nhieu tuoi|may tuoi) (thi )?(" + _AI_KD + r" )?(se )?(chet|qua doi)",
     r"mấy tuổi (thì |sẽ )?(" + _AI + r" )?(sẽ )?(chết|qua đời|mất|ra đi)|(?:^|[,.!?;] )" + _AI
     + r" (sẽ )?(chết|qua đời|mất) (năm|lúc|khi) (mấy tuổi|nào)"
     r"|(năm|lúc) (bao nhiêu tuổi|mấy tuổi) (thì )?(" + _AI + r" )?(sẽ )?(chết|qua đời|mất)", "du_doan_cu_the"),
    (r"bao gio (thi )?(toi|em|bo toi|me toi|ong toi|ba toi|chong toi|vo toi|bo|me)? ?(chet|qua doi)",
     r"bao giờ (thì )?(tôi|em|bố tôi|mẹ tôi|ông tôi|bà tôi|chồng tôi|vợ tôi|bố|mẹ|ba tôi)? ?(chết|qua đời|mất)"
     r"(?! (việc|tiền|ngủ|điện|nước|lòng|giá|mạng|sóng|hút))", "du_doan_cu_the"),
    # EN-3c: "tôi chết năm nào", "qua đời vào tuổi bao nhiêu" (đảo trật tự của các mẫu trên)
    (r"(chet|qua doi) (vao )?(nam|thang|ngay|luc|tuoi) (nao|may|bao nhieu)",
     r"(chết|qua đời) (vào )?(năm|tháng|ngày|lúc|tuổi) (nào|mấy|bao nhiêu)", "du_doan_cu_the"),
    (r"(co|con) qua khoi (khong|ko|duoc)|song (duoc )?(qua|den het) nam nay|con bao lau|song (duoc )?(den )?bao nhieu tuoi",
     r"(có|còn) qua khỏi (không|ko|được)|sống (được )?(qua|đến hết) năm nay|còn bao lâu|sống (được )?(đến )?bao nhiêu tuổi",
     "du_doan_cu_the"),
    (r"(so|con so|xin so) (de|lo)(?! an| xuat)|lo de|danh de(?! an| xuat| nghi| tai| cu)|xo so|ve so|trung so|ca do|ca cuoc"
     r"|danh lo|so chot|danh con (gi|so)|(xem|soi|bat|cho) de (hom nay|ngay mai|toi nay|mien)|(?<!\w)de .{0,15}(ve|ra) con (gi|nao|so)", r"(số|con số|xin số) (đề|lô)(?! án| xuất)|lô đề|đánh đề(?! án| xuất| nghị| tài| cử)|xổ số|vé số|trúng số|cá độ|cá cược"
     r"|đánh lô|số chốt|đánh con (gì|số)|(xem|soi|bắt|cho) đề (hôm nay|ngày mai|tối nay|miền)|(?<!\w)đề .{0,15}(về|ra) con (gì|nào|số)", "may_rui"),
    (r"(gap|bi) tai nan (chet|nang|mat mang)|tai nan chet nguoi", r"(gặp|bị) tai nạn (chết|nặng|mất mạng)|tai nạn chết người",
     "du_doan_cu_the"),
]

_RX: dict[str, re.Pattern] = {}


def _rx(m: str) -> re.Pattern:
    if m not in _RX:
        _RX[m] = re.compile(r"(?<!\w)(?:" + m + r")(?!\w)")
    return _RX[m]


def _co_dau_thuong(raw: str) -> str:
    """Chữ thường, NFC, giữ dấu tiếng Việt và dấu ngắt vế , . ! ? ; — các ký tự khác thành khoảng trắng."""
    s = unicodedata.normalize("NFC", raw or "").lower()
    for a in "ðɖ":
        s = s.replace(a, "đ")
    s = re.sub(r"[^\w\s,.!?;]", " ", s)
    s = re.sub(r"([,.!?;])", r" \1 ", s)
    return re.sub(r"\s+", " ", s).strip()


def _bo_dau(s: str) -> str:
    s = s.replace("đ", "d")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def _hai_ban(raw: str) -> tuple[str, str, bool]:
    cd = _co_dau_thuong(raw)
    kd = _bo_dau(cd)
    return cd, kd, cd != kd


# EN-3d: mẫu KHÔNG DẤU ở các bộ chặn cũ (thần số `hoi.TU_CHOI`, Huyền học `chung.TU_CHOI_HH_TAT_CA`, `TAM_LINH`) mà khi bỏ
# dấu trùng chữ thường ("vợ sinh 1993" ≡ "vô sinh", "có cần quan tâm" ≡ "có căn quan"). Người dùng gõ CÓ dấu → mẫu chỉ
# áp khi câu có đúng chữ có dấu ở cột phải; gõ không dấu → vẫn áp như cũ (an toàn hơn chặn thiếu).
MO_HO: dict[str, str] = {
    r"vo sinh(?! (nam )?(19\d{2}|200\d|201\d)(?!\w))": r"vô sinh",
    r"(co|la|phai) can (co|cau|quan|tu|ong|nang)(?!\w)": r"căn",
    r"(?<!\w)(nang|nhieu) can(?!\w)": r"căn",
    r"can dong": r"căn đồng",
    r"(?<!tap )trung so": r"trúng số",
    r"(la|co|thay|bi|nhu) hon ma|hon ma (theo|o|ve|nao)": r"hồn ma",
}


_RX_DUNG: dict[str, re.Pattern] = {}


def _dung_dau(c: str) -> re.Pattern:
    """Mẫu CÓ dấu chấp nhận cả chữ gõ KHÔNG dấu, nhưng không chấp nhận chữ gõ SAI dấu: "vô sinh" → v[ôo] sinh — khớp
    "vô sinh", "vo sinh"; không khớp "vợ sinh". Review EN-3d: câu gõ dấu một phần ("Tôi bị vo sinh", "có trung so không",
    "đau nguc kho tho") không được lọt bộ chặn; câu gõ đủ dấu vẫn phân biệt "dạy/dậy", "cần/căn"."""
    if c in _RX_DUNG:
        return _RX_DUNG[c]
    out, trong_lop, i = [], False, 0
    while i < len(c):
        ch = c[i]
        if ch == "\\" and i + 1 < len(c):
            out.append(c[i:i + 2])
            i += 2
            continue
        if ch == "[":
            trong_lop = True
        elif ch == "]":
            trong_lop = False
        goc = _bo_dau(ch)
        if goc != ch and goc.isalpha():
            out.append(ch + goc if trong_lop else f"[{ch}{goc}]")
        else:
            out.append(ch)
        i += 1
    _RX_DUNG[c] = re.compile(r"(?<!\w)(?:" + "".join(out) + r")(?!\w)")
    return _RX_DUNG[c]


def bo_qua_mo_ho(mau: str, raw: str | None) -> bool:
    """True khi mẫu không dấu `mau` là mẫu mơ hồ, câu gốc gõ có dấu, và câu KHÔNG có chữ cần chặn (kể cả gõ không dấu)
    — "vợ sinh 1993", "có cần quan tâm" bỏ qua; "Tôi bị vo sinh", "Tôi có can co" vẫn chặn."""
    if mau not in MO_HO or not raw:
        return False
    cd, _kd, co_dau = _hai_ban(raw)
    return co_dau and not _dung_dau(MO_HO[mau]).search(cd)


def _khop(k: str, c: str | None, cd: str, kd: str, co_dau: bool) -> bool:
    """Câu gõ có dấu → mẫu có dấu (chấp nhận chữ gõ không dấu, `_dung_dau`); câu không dấu → mẫu không dấu."""
    if not (co_dau and c):
        return bool(_rx(k).search(kd))
    return bool(_dung_dau(c).search(cd))


def khung_hoang(raw: str) -> bool:
    cd, kd, co_dau = _hai_ban(raw)
    return any(_khop(k, c, cd, kd, co_dau) for k, c in KHUNG_HOANG)


# ------------------------------------------------------------------ SK-1: triệu chứng cấp (kiểm TRƯỚC mọi luật từ chối)
# Review SK-1: trước đây chỉ xét sau khi câu đã bị luật khác xếp từ chối → "Tôi ngất xỉu mấy lần rồi" được đọc quẻ / số,
# "Tôi khó thở quá, sắp chết rồi" nhận lời "ngoài phạm vi". "Khó thở" chỉ tính khi nói về CƠ THỂ: người nói là chủ ngữ
# đầu vế ("Tôi khó thở quá"), "bị / đang khó thở", hoặc đi cùng đau ngực / ngất / tím tái — "Áp lực … làm tôi khó thở",
# "Không khí gia đình khó thở" là nghĩa bóng, trả lời bình thường.
_CAP_CUU: list[tuple[str, str | None]] = [
    (r"(dau|tuc|nhoi) nguc", r"(đau|tức|nhói) ngực"),
    (r"(?:^|[,.!?;] )" + _AI_KD + r" (dang |bi |thay |cu |tu nhien |hay bi )*kho tho(?! (vi|qua vi|voi|khi nghi|khi nhac))"
     r"|(bi|dang) kho tho(?! (vi|qua vi|voi))|kho tho .{0,20}(nguc|ngat|tim tai|choang)",
     r"(?:^|[,.!?;] )" + _AI + r" (đang |bị |thấy |cứ |tự nhiên |hay bị )*khó thở(?! (vì|quá vì|với|khi nghĩ|khi nhắc))"
     r"|(bị|đang) khó thở(?! (vì|quá vì|với))|khó thở .{0,20}(ngực|ngất|tím tái|choáng)|tím tái"),
    (r"ngat xiu|(bi|hay|bong|tu nhien) ngat( di| lim)?(?!\w)(?! (ngay|ngat|tho))|ngat lim|bat tinh|liet nua nguoi|co giat"
     r"|(be|con|chau|bi|dang|toi|em) .{0,15}sot cao(?! (gia|nha|dat|thi truong))",
     r"ngất xỉu|(bị|hay|bỗng|tự nhiên) ngất( đi| lịm)?(?!\w)(?! (ngây|ngất))|ngất lịm|bất tỉnh|liệt nửa người|co giật"
     r"|(bé|con|cháu|bị|đang|tôi|em) .{0,15}sốt cao|sốt cao (co giật|liên tục|mấy ngày|không hạ|không dứt)"),
]

# ------------------------------------------------------------------ SK-1: hỏi "có mắc bệnh không" (mọi mảng)
# Review SK-1: bỏ chặn "bệnh gì / mắc bệnh" làm Kinh Dịch đọc quẻ "thuận lợi, làm tới" cho "Năm sau tôi có mắc bệnh
# không", Tử vi trả "mảng sức khoẻ ở mức thuận lợi" (đọc thành "không bệnh"). Câu hỏi CÓ / KHÔNG bệnh luôn là câu đặc
# biệt: không xác nhận, không phủ nhận, gợi hệ cơ quan (nếu lá số có) + đi khám. "Sức khoẻ của tôi năm nay thế nào",
# "năm nào nên chú ý sức khoẻ" KHÔNG thuộc nhóm này (trả lời bằng chương sức khoẻ + năm).
_HOI_BENH: list[tuple[str, str | None]] = [
    (r"benh gi|mac benh|do benh|(co|se|bi) (bi |mac )?benh (nang |nan y )?(khong|ko|k|nao|nang|chua)(?!\w)"
     r"|(bi|mac) benh (nang|nan y)|(co|se) bi om (nang |dau )?(khong|ko)|bi om nang|om dau (gi|khong|ko)",
     r"bệnh gì|mắc bệnh|đổ bệnh|(có|sẽ|bị) (bị |mắc )?bệnh (nặng |nan y )?(không|ko|k|nào|nặng|chưa)(?!\w)"
     r"|(bị|mắc) bệnh (nặng|nan y)|(có|sẽ) (bị )?ốm (nặng |đau )?(không|ko)|bị ốm nặng|ốm đau (gì|không|ko)"),
]

# ------------------------------------------------------------------ SK-1: sức khoẻ của NGƯỜI KHÁC
# Lá số / con số của người hỏi không nói được sức khoẻ người thân → không đọc, khuyên đưa người đó đi khám + gợi xem lá
# số riêng của họ (mục Người thân trên /tu-vi). So trên chữ bỏ dấu ("bà/ba tôi" đều là người thân).
_THAN = (r"(bo me|cha me|ong ba|bo|ba|cha|me|ong( noi| ngoai)?|ba( noi| ngoai)?|chong|vo|con( gai| trai)?|chau|"
         r"anh( trai)?|chi( gai)?|em( trai| gai)?|nguoi yeu|ny|nguoi than)")
_CUA = r" (toi|em|minh|to|tui|nha toi|nha em|nha minh)(?!\w)"
_NGUOI = r"(?<!\w)(" + _THAN + _CUA + r"|(anh|chi|co|chu|bac|ong|ba|ban|nguoi) ay)"
_SK = (r"(benh|suc khoe|om|khoe|(?<!\w)u(?!\w)|ung thu|dau|sot|tieu duong|xo gan|suy than|tram cam|dong kinh|tu ky|"
       r"dot quy|tai bien|kho tho|di tat|huyet ap|tim|gan|phoi|than|da day)")
_NGUOI_THAN = re.compile(_NGUOI + r".{0,40}?(?<!\w)" + _SK + r"(?!\w)|suc khoe (cua )?" + _NGUOI)
_HOI_SK_NGUOI = re.compile(
    _NGUOI + r".{0,40}?(suc khoe .{0,30}(the nao|ra sao|co tot|co on|co sao|co yeu|tot khong|on khong|yeu khong|"
    r"co van de)|benh gi|(co |se )(bi |mac )?benh|(co )?khoe (khong|ko|the nao|ra sao)|(co |se )(bi )?om (nang |dau )?(khong|ko)"
    r"|om dau the nao)"
    r"|suc khoe (cua )?" + _NGUOI + r".{0,30}(the nao|ra sao|co tot|co on|co sao|co yeu|tot khong|on khong|yeu khong|co van de)")


def cap_cuu(raw: str) -> bool:
    cd, kd, co_dau = _hai_ban(raw)
    return any(_khop(k, c, cd, kd, co_dau) for k, c in _CAP_CUU)


def hoi_benh(raw: str) -> bool:
    """Câu hỏi CÓ / KHÔNG bệnh ("có mắc bệnh không", "bệnh gì", "có ốm nặng không")."""
    cd, kd, co_dau = _hai_ban(raw)
    return any(_khop(k, c, cd, kd, co_dau) for k, c in _HOI_BENH)


def nguoi_than(raw: str) -> bool:
    """Câu nói về sức khoẻ của người thân / người khác (người đó đứng trước chữ sức khoẻ, bệnh, bộ phận…)."""
    return bool(_NGUOI_THAN.search(_hai_ban(raw)[1]))


def tu_choi(raw: str) -> str | None:
    """Loại từ chối ('suc_khoe_the_chat' | 'du_doan_cu_the' | 'may_rui') hoặc None. Triệu chứng cấp kiểm trước tiên
    (người gọi kiểm khủng hoảng trước hàm này — câu vừa khủng hoảng vừa cấp cứu nhận lời hỗ trợ khủng hoảng)."""
    if cap_cuu(raw):
        return "suc_khoe_the_chat"
    cd, kd, co_dau = _hai_ban(raw)
    for k, c, loai in TU_CHOI:
        if _khop(k, c, cd, kd, co_dau):
            return loai
    if hoi_benh(raw) or _HOI_SK_NGUOI.search(kd):
        return "suc_khoe_the_chat"
    return None


# ------------------------------------------------------------------ SK-1: câu từ chối thuộc nhóm sức khoẻ
# Chính sách SK-1 (chủ dự án duyệt 2026-11-04): câu NÊU tên bệnh / bộ phận ("tôi có bị … không", "đoán bệnh") vẫn không
# được xác nhận hay phủ nhận, nhưng lời đáp gợi HỆ CƠ QUAN + đi khám để bác sĩ kiểm tra (thay câu "ngoài phạm vi").
# Giữ lời từ chối cũ (không đổi): sống chết / tuổi thọ, bỏ thuốc / chữa trị / mổ, thai nhi, hỏi lành hay ác của khối
# đã có; triệu chứng cấp → khuyên đi khám NGAY (kiểm trước cả câu sống chết).
_GIU_TU_CHOI = [
    (r"chet|qua doi|tu vong|(co|con) qua khoi|qua (duoc|noi) (khong|ko|nam)|song (duoc|qua|den)|con bao lau|tho (bao|duoc)"
     r"|bao gio .{0,12}mat",
     r"chết|qua đời|tử vong|(có|còn) qua khỏi|qua (được|nổi) (không|ko|năm)|sống (được|qua|đến)|còn bao lâu|thọ (bao|được)"
     r"|bao giờ .{0,12}mất"),
    (r"(bo|ngung|dung) (uong )?thuoc|thuoc nam|hoa tri|xa tri|dieu tri|chua (duoc|khoi|bang)|khoi (duoc )?benh|cho khoi"
     r"|phau thuat|(nen|co nen) mo|chay than|nhap vien|uong thuoc gi",
     r"(bỏ|ngưng|ngừng|dừng) (uống )?thuốc|thuốc nam|(hoá|hóa) trị|xạ trị|điều trị|chữa (được|khỏi|bằng)|khỏi (được )?bệnh"
     r"|cho khỏi|phẫu thuật|(nên|có nên) mổ|chạy thận|nhập viện|uống thuốc gì"),
    (r"thai nhi|(co|mang) thai|thai (\d|may|thang|ky)|mang bau|di tat|(hoi chung|bi) down|be .{0,10}(sinh ra|trong bung)",
     r"thai|mang bầu|dị tật|(hội chứng|bị) down|bé .{0,10}(sinh ra|trong bụng)"),
    (r"lanh hay ac|giai doan (\d|cuoi|dau)|tu ky|dong kinh", r"lành hay ác|giai đoạn (\d|cuối|đầu)|tự kỷ|động kinh"),
]
_SUC_KHOE_KD = re.compile(r"(?<!\w)(benh|ung thu|khoi u|tieu duong|vo sinh|suc khoe|dau da day|xo gan|suy than)(?!\w)")


def nhom_suc_khoe(raw: str) -> str | None:
    """Câu đã bị xếp từ chối: 'cap_cuu' (triệu chứng cấp — khuyên đi khám ngay; xét TRƯỚC mọi nhóm khác) · 'nguoi_than'
    (sức khoẻ người khác — không đọc lá số người hỏi) · 'hoi_benh' (hỏi có bệnh / đoán bệnh — gợi hệ cơ quan + đi khám)
    · None (giữ lời từ chối cũ: sống chết, chữa trị, thai nhi, may rủi…)."""
    if cap_cuu(raw):
        return "cap_cuu"
    cd, kd, co_dau = _hai_ban(raw)
    if any(_khop(k, c, cd, kd, co_dau) for k, c in _GIU_TU_CHOI):
        return None
    loai = tu_choi(raw)
    if loai not in ("suc_khoe_the_chat", None):
        return None
    if loai is None and not (_SUC_KHOE_KD.search(kd) or hoi_benh(raw)):
        return None
    return "nguoi_than" if nguoi_than(raw) else "hoi_benh"
