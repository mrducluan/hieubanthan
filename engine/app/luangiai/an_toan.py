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

from app.luangiai import nhan_ngoai as _nn   # EN-AI: nhãn ngoài (AI phân loại câu tiếng Anh) — chỉ nâng mức

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
    # Review CY-1: tuổi thọ / sống chết — trước chỉ có ở bộ Huyền học (`hoidap.chung.TU_CHOI_THEM`), Thần số trả lời "Tôi
    # sống được bao lâu?" bằng chân dung số. Gom về bộ chung (cả 5 mảng). Không chặn "sống ở … lâu rồi", "sống bao lâu
    # thì nên mua nhà" (không có chủ ngữ người / không "được").
    (r"(toi|minh|em|con|bo|me|ba|ong|cha|chong|vo|be|no|chau|anh|chi|tui|to)( toi| em| minh)? (con )?(se )?song (duoc )?"
     r"(bao lau|them bao lau|den bao nhieu( tuoi)?|bao nhieu tuoi|may nam|duoc may|den may tuoi|den nam nao)"
     r"|song duoc (bao lau|bao nhieu tuoi|den bao nhieu|may nam|den may tuoi)|tho (duoc )?(bao nhieu|may tuoi|den bao nhieu)"
     r"|(nam|thang|ngay|luc|khi|tuoi) nao .{0,15}(chet|qua doi)(?!\w)|chet (som|tre|yeu|bat dac)(?!\w)|so chet (tre|som|bat)"
     r"|bat dac ky tu|(\d{2,3} tuoi|ong noi|ong ngoai|ba noi|ba ngoai|cu nha).{0,40}co (di|mat|ra di) (khong|ko)"
     r"|(con|be|no|ong|ba|bo|me|toi|minh|em|chau|vo|chong) (co )?song duoc (khong|ko)(?!\w)|nam nao .{0,30}co nguoi mat",
     r"(tôi|mình|em|con|bố|mẹ|ba|ông|bà|cha|chồng|vợ|bé|nó|cháu|anh|chị|tui|tớ)( tôi| em| mình)? (còn )?(sẽ )?sống (được )?"
     r"(bao lâu|thêm bao lâu|đến bao nhiêu( tuổi)?|bao nhiêu tuổi|mấy năm|được mấy|đến mấy tuổi|đến năm nào)"
     r"|sống được (bao lâu|bao nhiêu tuổi|đến bao nhiêu|mấy năm|đến mấy tuổi)|thọ (được )?(bao nhiêu|mấy tuổi|đến bao nhiêu)"
     r"|(năm|tháng|ngày|lúc|khi|tuổi) nào .{0,15}(chết|qua đời)(?!\w)|chết (sớm|trẻ|yểu|bất đắc)(?!\w)|số chết (trẻ|sớm|bất)"
     r"|bất đắc kỳ tử|(\d{2,3} tuổi|ông nội|ông ngoại|bà nội|bà ngoại|cụ nhà).{0,40}có (đi|mất|ra đi) (không|ko)"
     r"|(con|bé|nó|ông|bà|bố|mẹ|tôi|mình|em|cháu|vợ|chồng) (có )?sống được (không|ko)(?!\w)|năm nào .{0,30}có người mất",
     "du_doan_cu_the"),
    # Review CY-1: tuyển dụng trá hình ("tuổi nào hợp làm nhân viên kế toán cho tôi") — bộ chung cho cả 5 mảng.
    (r"(tuoi|nguoi tuoi|menh|con giap|nguoi sinh nam) (nao|gi) .{0,25}(lam|vao vi tri|vao lam) (nhan vien|ke toan|thu ky"
     r"|tro ly|quan ly|bao ve|tai xe|lai xe|giup viec|nhan su|ban hang|thu ngan|cong nhan)(?!\w).{0,30}"
     r"(cho|giup|o) (toi|em|minh|cong ty|cty|shop|cua hang|quan|xuong|doanh nghiep)"
     r"|(nen|co nen) tuyen (nguoi|nhan vien|ung vien|ke toan|thu ky)|tuyen (nguoi|nhan vien|ke toan|thu ky|nhan su) "
     r"(tuoi|menh|sinh nam|so)|tuyen ung vien|sa thai nhan vien|(chon|giu|loai) nhan vien",
     r"(tuổi|người tuổi|mệnh|con giáp|người sinh năm) (nào|gì) .{0,25}(làm|vào vị trí|vào làm) (nhân viên|kế toán|thư ký"
     r"|trợ lý|quản lý|bảo vệ|tài xế|lái xe|giúp việc|nhân sự|bán hàng|thu ngân|công nhân)(?!\w).{0,30}"
     r"(cho|giúp|ở) (tôi|em|mình|công ty|cty|shop|cửa hàng|quán|xưởng|doanh nghiệp)"
     r"|(nên|có nên) tuyển (người|nhân viên|ứng viên|kế toán|thư ký)|tuyển (người|nhân viên|kế toán|thư ký|nhân sự) "
     r"(tuổi|mệnh|sinh năm|số)|tuyển ứng viên|sa thải nhân viên|(chọn|giữ|loại) nhân viên",
     "tuyen_dung"),
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



# ------------------------------------------------------------------ QTE-2: câu hỏi TIẾNG ANH (bản /en)
# So trên câu đã thường hoá, bỏ dấu (`kd`) với ranh giới từ; từ tiếng Anh không trùng chữ Việt không dấu nào đáng kể.
# Bộ QTE-2 (giữ NGUYÊN — áp cho mọi câu như trước, để bản Việt không đổi). Câu TIẾNG ANH (lượt gọi `en` / câu nhận ra là
# tiếng Anh, `_la_en`) đi bộ EN-ALL GĐ 3c bên dưới (chặt hơn, viết theo Ý, có lỗi gõ / Singlish), không đi bộ QTE-2.
_I = r"(i|i m|im|i am|me|myself|my life)"
KHUNG_HOANG_EN: list[str] = [
    r"kill myself", r"killing myself", r"end(ing)? (my|it all|everything|my life)", r"take my (own )?life", r"(commit|committing|attempt(ed|ing)?) suicide",
    r"suicid(e|al)", r"want(ing)? to die", r"wish(ing)? i (was|were) dead", r"better off dead", r"(don t|dont|do not) want to (live|wake up|be here|exist)( anymore)?",
    r"(no|not any) (reason|point) (to|in) (live|living|go on|going on)", r"hurt(ing)? myself", r"self harm", r"cut(ting)? myself",
    r"i am a burden", r"i m a burden", r"im a burden", r"everyone would be better (off )?without me", r"(ending|end) things",
    r"(he|she|they|my (husband|wife|partner|boyfriend|girlfriend|father|mother|dad|mom|mum)) (hits|hit|beats|beat|is beating|abuses|abused|raped|is hurting|strangled|threatens to kill) me",
    r"(i was|i m being|i am being|being) (raped|abused|molested|assaulted)", r"(i|we) (am|are) (being )?(abused|assaulted)",
    r"overdos(e|ed|ing)", r"(i|i m|im) (so )?(depressed|suicidal)(?! (people|person|friend|book))",
]
# (mẫu, loại từ chối) — chẩn đoán bệnh / sống chết / bỏ thuốc / thai nhi / xổ số / tuyển người
TU_CHOI_EN: list[tuple[str, str]] = [
    (r"(do|will|am|could|might) i (have|get|develop) (cancer|a tumou?r|diabetes|hiv|aids|dementia|alzheimer|a stroke|a heart attack|covid)", "suc_khoe_the_chat"),
    (r"(is it|is this|could it be|do i have) (cancer|a tumou?r|benign|malignant|diabetes|depression|adhd|autism|bipolar|schizophrenia)", "suc_khoe_the_chat"),
    (r"(diagnos(e|is|ed)|prognosis|chemo(therapy)?|radiation therapy|surgery|operation|dialysis)(?! (room|date|of the|book))", "suc_khoe_the_chat"),
    (r"(stop|quit|skip|come off|go off) (taking )?(my )?(meds|medication|medicine|pills|antidepressants|insulin|chemo)", "suc_khoe_the_chat"),
    (r"(should|can) i (stop|quit) (my )?(treatment|therapy|medication)", "suc_khoe_the_chat"),
    (r"(when|how long) (will|do|am) i (going to )?(die|live|have left)", "du_doan_cu_the"), (r"how long (do|will) i live", "du_doan_cu_the"),
    (r"(am i|will i|is .{1,30}) going to die", "du_doan_cu_the"), (r"(my|the) (baby|fetus|foetus|unborn)( is| will| has)? (healthy|sick|disabled|ok|normal|down syndrome)", "suc_khoe_the_chat"),
    (r"am i pregnant", "suc_khoe_the_chat"), (r"(gender|sex) of (my|the) (baby|child)(?! name)", "suc_khoe_the_chat"),
    (r"(lottery|lotto|powerball|mega ?millions|jackpot|winning|lucky|betting|roulette|slot machine) numbers?", "may_rui"), (r"(numbers?|which number) (to|should i) (bet|play|pick)", "may_rui"),
    (r"(win|winning) (the )?(lottery|lotto|jackpot|bet|casino)", "may_rui"), (r"(stock|crypto|coin|bitcoin|share) (price|will go|to buy|should i buy|pump)", "may_rui"),
    (r"(which|what) (candidate|applicant|employee|person) (should i|to) (hire|fire|promote)", "ngoai_pham_vi"), (r"(hire|fire) (him|her|them|this (person|candidate|employee))", "ngoai_pham_vi"),
]
_CAP_CUU_EN = re.compile(r"(?<!\w)(chest pain|can t breathe|cant breathe|cannot breathe|trouble breathing|passed out|passing out|fainted|unconscious|seizure|stroke symptoms|"
                         r"slurred speech|numb (arm|face)|bleeding (heavily|won t stop|wont stop)|overdosed|swallowed pills)(?!\w)")
_EN_NGUOI_THAN = re.compile(r"(?<!\w)(my (mother|mom|mum|father|dad|husband|wife|partner|son|daughter|child|kid|brother|sister|grandma|grandpa|friend))"
                            r".{0,40}(cancer|sick|ill|disease|tumou?r|surgery|hospital|health|dying)(?!\w)")


def _en(kd: str, ds) -> bool:
    return any(re.search(r"(?<!\w)(?:" + m + r")(?!\w)", kd) for m in ds)


# ================================================================== EN-ALL GĐ 3c — bộ chặn TIẾNG ANH viết theo Ý
# Thước đo: fixtures/cau_hoi/en/an_toan_en.jsonl (khủng hoảng · cấp cứu · từ chối · câu thường dễ nhầm — thành ngữ "dying
# to know", "this job is killing me", "Death card", "Seven Killings", "bet on myself"…), chấm bằng
# `scripts/cham_en.py --an-toan`; test `tests/test_en_an_toan.py`. Mỗi nhóm mẫu viết theo NGHĨA (người nói muốn chết / tự
# hại / bị đánh; hỏi ngày chết, chẩn đoán, bỏ thuốc, số đánh bạc, chọn người làm theo lá số), không chép câu thử.

def _la_en(raw: str) -> bool:
    """Câu xét bằng bộ tiếng Anh GĐ 3c khi lượt gọi KHÔNG phải tiếng Việt, hoặc câu không có dấu tiếng Việt và có ≥ 2 từ
    chỉ tiếng Anh mới có (không trùng âm tiết Việt không dấu: bỏ "the", "my", "me", "do", "an", "to", "it", "be", "am",
    "not"). Câu tiếng Việt (có dấu, hoặc không dấu) → False → bản Việt giữ đúng hành vi cũ."""
    from app import ngon_ngu  # noqa: PLC0415 — module lá, không import gì của app
    if ngon_ngu.hien_tai() != "vi":
        return True
    cd, kd, co_dau = _hai_ban(raw)
    return not co_dau and len(set(_TU_ANH.findall(kd))) >= 2


_TU_ANH = re.compile(r"(?<!\w)(i|i m|im|you|your|is|are|was|were|will|would|should|could|want|wanna|what|why|when|where|which|"
                     r"who|with|without|and|of|for|this|that|have|has|does|don t|dont|can t|cant|just|feel|life|going|myself|"
                     r"anymore|everyone|nobody|please|pls|know|think|tonight|today|tomorrow|really|again|about|because)(?!\w)")

# Lỗi gõ / viết tắt / Singlish hay gặp trong tin nhắn (chỉ để SO KHỚP — câu gốc giữ nguyên). Mỗi dòng: chữ chuẩn ← biến thể.
_SUA_EN_BANG: dict[str, str] = {
    "want": "wnat|whant|wan|wnt", "want to": "wanna|wana|want2", "going to": "gonna|gona|goin to|going 2", "anymore": "anymroe|anymor|any more|anymre",
    "everyone": "evryone|every1|everyon|everybody|evry1", "better": "beter|bettr", "kill": "kil|kll", "chart": "chrat|chrt",
    "cut": "cutt|kut", "again": "agian|agin|agn", "husband": "husbnad|hubby|husbend|hsband", "took": "tok|tuk", "pills": "pils|pillz",
    "last": "lsat|lst", "uncle": "uncel|unkle", "touches": "touchs|tuches", "burden": "burdan|burdn|burdon", "parents": "parants|parnts",
    "point": "piont|pnt|pt", "disappear": "dissapear|disapear|dissappear", "forever": "forevr|4ever", "burn": "bern|brn",
    "cigarettes": "cigaretes|ciggs|cigs", "reason": "resson|reasn|reson", "going": "goin", "brother": "brothre|bro", "threatens": "threttens|thretens",
    "would": "wud|wld|would ve", "without": "w o|wo|w out|with out", "tomorrow": "tmrw|tmr|2moro|tmrow|tomorow|tommorow|2mr",
    "i do not want": "idw|idwt", "do not": "dont|don t|dun", "cannot": "cant|can t|cnt|cannt", "will not": "wont|won t", "i am": "im|i m",
    "was not": "wasnt|wasn t|wasnt", "did not": "didnt|didn t", "night": "nite|nyt", "tonight": "tn|tonite|2nite|tonigt",
    "you": "u|yu|yuo", "your": "ur|yr", "boyfriend": "bf|boifren", "girlfriend": "gf", "dizzy": "dizy", "overdosed on": "od d|odd on|od ed|o d d",
    "seriously": "srsly", "i will be": "ill be|i ll be", "they would": "theyd|they d", "should": "shld|shud|shoud|shd", "what": "wat|wut|whut",
    "what is": "wats|whats|what s", "about": "abt|abut", "stuff": "stuf", "too many": "to many|2 many|too much of", "please": "plz|pls|plese|pleas",
    "pregnant": "pregnent|pregant|preggo|preggers|preg", "miscarry": "misscarry|miscary|miscarrie", "miscarriage": "misscarriage|miscarage",
    "cancer": "cancr|canser", "diabetes": "diabeets|diabetis|diabetees|diabeties", "insulin": "insulen|insuline", "stop": "stopp|stp",
    "autism": "auttism|autisim|autizm", "heart": "hart", "heart disease": "heard disease", "breathe": "brethe|breath e|breth|breathe e", "seizure": "seezure|seizur|siezure",
    "candidate": "canditate|candidat|candidte", "employee": "emploee|employe|emplyee", "lottery": "lotery|lottry|lotto ry", "numbers": "nummbers|numbrs|nos|numba",
    # "dye" → "die" chỉ khi không có tân ngữ đi sau ("will i dye young", "what year will i dye"); "dye my clothes black",
    # "dye my hair" giữ nguyên (review GĐ 3d vòng 4).
    "die": r"dye(?=\s*(?:[,.!?;]|$)| (?:acording|accrding|according|acc to|at age|at \d|young|early|soon|before|in \d|by \d|when|"
           r"next year|this year|alone|of |from |or not))",
    "according to": "acording to|accrding to|acc to|according", "their birth": "there birth", "because": "becuase|bcos|bcoz|cuz|coz|bc",
    "have": "hv|hav|got to have", "baby": "bby|bebe|babi", "medicine": "medecine|medicin", "medication": "medicaton|medcation",
    "before": "b4|bfr", "years": "yrs|yeers|yeers", "year": "yr|yeer|yer", "be": "b", "live": "liv", "life": "lyf|lyfe", "hurt": "hrt",
    "myself": "my self|meself|myslf", "really": "rly|realy", "help": "halp|hlp", "nothing": "nuthin|nothin", "someone": "sm1|some1",
    "something": "somthing|smth|sth", "people": "ppl|ppls",
}
_SUA_EN = [(re.compile(rf"(?<!\w)(?:{bien})(?!\w)"), chuan) for chuan, bien in _SUA_EN_BANG.items()]
# Hạt từ Singlish / Manglish ở cuối vế (không mang nghĩa) — bỏ để mẫu khớp ("cannot stop one", "disappear lor").
_HAT = re.compile(r"(?<!\w)(lah|leh|lor|liao|sia|meh|hor|ah|one)(?=\s*(?:[,.!?;]|$))")


def _sua_en(kd: str) -> str:
    kd = _HAT.sub("", kd)
    for a, b in _SUA_EN:
        kd = a.sub(b, kd)
    return " ".join(kd.split())


def _rx_en(*ds: str) -> re.Pattern:
    return re.compile(r"(?<!\w)(?:" + "|".join(f"(?:{m})" for m in ds) + r")(?!\w)")


# Người (chủ ngữ của hành vi bạo lực / đe doạ) — người thân, bạn đời, người quen; KHÔNG gồm "it / this job / the exam".
_NGUOI_EN = (r"(?:he|she|they|someone|somebody|my (?:\w+ ){0,2}(?:husband|wife|partner|boyfriend|girlfriend|fiance|fiancee|ex|"
             r"father|dad|daddy|papa|mother|mom|mum|mummy|mama|stepdad|stepfather|stepmom|stepmother|step dad|step mom|uncle|"
             r"aunt|auntie|aunty|brother|sister|cousin|grandpa|grandma|grandfather|grandmother|son|daughter|boss|teacher|coach|"
             r"tutor|neighbou?r|landlord|in law|in laws|parents|family|bf|gf|roommate|flatmate|classmate|colleague|manager|"
             r"ah gong|ah ma|ah pa|ah ba)(?: s)?|(?:stepdad|stepfather|dad|father|mom|mum|uncle|husband|wife|boyfriend|ex)(?: s)?)")
_NGUOI_EN = r"(?<!\w)" + _NGUOI_EN + r"(?!\w)"
_DUA = r"(?:lol|lmao|lmfao|haha\w*|hehe|jk|joking|kidding|jokes|spoil|spoiler|literally|figuratively|xd)"

KHUNG_HOANG_ANH: list[re.Pattern] = [
    # 1. nói thẳng ý tự tử / tự kết liễu
    _rx_en(r"suicid\w*", r"(?:kill|killing|killed|kil)(?:ing)? (?:myself|my self|meself)", r"kms", r"unaliv\w*", r"ctb",
           r"(?:end|ending|ended|take|taking|took) (?:my|own) (?:own )?life", r"(?:end|ending) (?:it|everything) all",
           r"(?:end|ending|ended) (?:it|things|everything)(?! (?:with|between|off|for (?:us|him|her|them)|on a|on good))",
           r"hang(?:ing|ed)? myself", r"(?:si|suicidal) (?:thoughts?|urges?|ideation)",
           r"jump(?:ing|ed)? (?:off|down|from|out of)(?: from)? (?:\w+ ){0,3}(?:bridge|building|block|roof|rooftop|balcony|window|"
           r"cliff|tower|hdb|floor|ledge|flat|apartment|car park|carpark)",
           r"jump(?:ing)? in front of (?:a |the )?(?:train|bus|car|truck|mrt|lorry)",
           r"(?:drive|driving|drove|crash\w*|steer\w*) (?:my car |the car )?(?:into|off) (?:a|the) (?:wall|bridge|cliff|tree|truck|"
           r"lorry|river|sea|barrier)",
           r"(?:sitting|sat|sit) in (?:my|the) car .{0,40}engine running", r"engine running .{0,30}(?:garage|closed)",
           r"(?:writing|wrote|written|write|left|leaving|leave) (?:a |my )?(?:suicide|goodbye|farewell) (?:note|letter)s?",
           r"wrote a note .{0,40}(?:drawer|desk|just in case|for my)",
           r"(?:letters?|notes?) (?:to|for) (?:my |all my )?(?:friends|family|everyone|parents|kids) .{0,20}just in case",
           r"(?:i )?have a plan and a date", r"(?:chose|picked|found|choose) (?:the|a) (?:place|spot|method)(?=\s*(?:[,.!?;]|$))",
           r"(?:bought|buy|got|getting) (?:a |some |the )?rope(?! for)",
           r"(?:staring|stared|stare|looking|sitting) (?:at|by|near) (?:the|a|my) (?:knife|knives|knife drawer|razor|razors|blade|blades|"
           r"rope|pills|ledge|edge of the (?:roof|building|bridge)|railing|tracks)",
           r"(?:holding|have|got) (?:a |the )?(?:knife|razor|blade) (?:to|against|on) my (?:wrist|throat|neck|skin|arm)",
           r"(?:the )?only (?:thing|reason|one) (?:stopping|keeping|holding) me(?: back| here| alive| going)?(?: now)?"
           r"(?= is| are|\s*(?:[,.!?;]|$)| from (?:killing|ending|doing it|going through|taking|jumping|hurting))",
           r"(?:taking|take|took) it as (?:permission|a sign to go)",
           r"(?:one more time|once more|one last time|one final time) before i (?:go|decide|leave|end)",
           r"want (?:this|it|this year|next year|\d{4}) to be my last"),
    # 2. muốn chết / muốn biến mất / không muốn sống
    _rx_en(r"(?:want|wanted|wish|wishing|ready|planning|plan|tryna|trying) to die(?! (?:my|your|her|his) hair| (?:it|for|of|laughing))",
           r"(?:i|me) (?:just )?wanna die", r"i want die",
           r"(?:want|wanna|wish|ready|going|plan\w*|need|better) (?:to |i )?(?:just )?(?:disappear|vanish|cease to exist|stop existing|not exist)"
           r"(?! (?:from|for|on|off) (?:social|insta|instagram|facebook|fb|tiktok|the internet|work|the office|a (?:while|bit|week|day)|"
           r"the (?:weekend|week|day)|holiday|a trip))",
           r"disappear forever", r"(?:better|best) (?:if )?i (?:just )?(?:disappear|die|was gone|were gone|go|leave)(?! (?:to|for|abroad|overseas|home|out))",
           r"(?:do not|did not|never|not) want to (?:live|be alive|exist|be here|wake up|continue|go on|keep going|keep living)"
           r"(?! (?:in|with|near|at|abroad|alone|together|there|here|like|under|on|next|close|anywhere|without|as a))",
           r"(?:do not|never) want to be alive", r"(?:rather|prefer to) (?:be|being) dead|(?:i d|i would) rather die|"
           r"(?:tired|sick) of (?:being alive|living|life|existing)|ways to (?:die|kill myself|end (?:it|my life))|"
           r"how (?:to|can i|do i) (?:die|kill myself|end my life)|painless (?:death|way to (?:die|go))|die painlessly", r"wish i (?:was|were|had)(?: not| never)? (?:dead|been born|born)",
           r"wish i (?:was|were) not (?:alive|here|born)", r"better off dead",
           r"(?:sleep|go to sleep|fall asleep) (?:and )?(?:never|not) wake up", r"sleep forever",
           r"(?:not|never|did not|do not) wake up (?:tomorrow|again|ever)", r"wish i (?:did not|didn t) (?:have to )?(?:wake up|come up)",
           r"hold\w* my breath under", r"waiting (?:for my body to (?:give up|stop|shut down|die)|to die)",
           r"(?:no|not any|any|without) (?:point|reason|purpose) (?:in |to |of |for )?(?:living|live|life|going on|go on|keep going|"
           r"keep living|continue|continuing|being alive|be alive|being here|trying anymore|anymore|exist|existing)",
           r"what is (?:even )?the point (?:of|in) (?:living|life|going on|trying|being alive|anything|it all|existing|continuing)",
           r"what is (?:even )?the point (?:anymore|now)", r"no point anymore", r"^(?:there is )?no point$",
           r"what for continue|why (?:should i )?(?:even )?(?:continue|keep going|go on|bother living|keep living)(?! (?:with|to|at|my|this|the))",
           r"(?:life|living) (?:is not|isn t|not) worth (?:living|it)", r"not worth living", r"nothing (?:left )?to live for",
           r"anything left for me", r"(?:was not|wasn t|were not|not) meant to (?:be here|be alive|exist|live|be born)",
           r"(?:cannot|can not|could not) (?:go on|take (?:it|this) anymore|do this anymore|keep going|survive)(?! (?:with|without|in|on|at|the|my|this|a|an))",
           r"(?:do not|cannot) see how i (?:can|could|will) (?:survive|go on|keep going)",
           r"(?:not|never) (?:going to|gonna) (?:stick|be) around", r"(?:will not|not|never) be (?:here|around|alive) (?:tomorrow|anymore|much longer|for long|next (?:week|month|year))",
           r"if i (?:will|i will|will still) (?:still )?be (?:here|around|alive) (?:tomorrow|next|by)", r"(?:will not|never) (?:make it|survive) (?:to|through|another|past)",
           r"(?:everyone|everybody|they|people|my (?:\w+ )?(?:family|parents|kids|friends|wife|husband|siblings)|the world) (?:would|will|d) be "
           r"(?:better|happier) (?:off )?(?:without me|if i (?:was|were|am|wasn t|weren t|was not|were not)(?: not)? (?:here|around|gone|alive|there))",
           r"(?:better|happier) (?:off )?without me", r"happier if i (?:go|left|leave|was gone|were gone|disappear|die|was not here|wasn t here|am gone)",
           r"(?:everyone|everybody|they) (?:would|will|d) (?:finally )?be (?:better|happier) off(?=\s*(?:[,.!?;]|$))",
           r"if i (?:was|were|am)(?: not| n t)? (?:not )?(?:here|around|alive|gone)(?=.{0,60}(?:better|happier|step up|notice|care|miss))",
           r"(?:nobody|no one|noone) (?:would|will|is going to|even|gonna)? ?(?:even )?(?:notice|care|miss me)(?: if i| when i)?(?=\s*(?:[,.!?;]|$))", r"(?:nobody|no one|noone) (?:would|will|is going to|even|gonna)? ?(?:even )?miss me",
           r"(?:nobody|no one|noone|anyone|anybody|people)(?: \w+){0,3} (?:notice|care|miss me|cry|come to my funeral)\w*(?: \w+){0,3} if i (?:died|die|was gone|were gone|"
           r"disappeared|vanished|was not here|wasn t here|was not around|wasn t around|killed myself|ended it)",
           r"no more me", r"(?:i am|feel|feeling|felt|am|i m|just) (?:like )?(?:a |such a |only a |nothing but a )?(?:burden|burdan)(?! of)",
           r"(?:my )?last (?:reading|time asking|question|card|tarot) (?:ever|before i go)", r"last reading ever",
           r"(?:my )?last time (?:ask|asking) (?:you|anything)", r"goodbye (?:everyone|everybody|world|all|cruel world)",
           r"(?:said|saying|say) goodbye to (?:everyone|everybody|all my|my family)", r"(?:i am|i m) done(?: with (?:life|everything|living|it all))?(?=\s*(?:[,.!?;]|$))",
           r"(?:i am|i m) done with (?:life|living|everything|it all)(?! (?:in|at|on|as|here|there|admin|insurance|coach\w*|"
           r"lessons|of|with|for)(?!\w))",
           r"ready to (?:leave this world|end it|die|end everything)"),
    # 3. tự hại
    _rx_en(r"self[- ]?harm\w*", r"(?:relapsed|relapse) (?:on )?sh", r"(?:tw|cw) sh", r"sh (?:urges?|again|last|tonight|relapse|scars?)",
           r"(?:cut|cutting|cuts|slit\w*|scratch\w*|harm\w*|hurt\w*|hit\w*|starv\w*) (?:myself|my self)",
           r"(?:cut|cutting|cuts|slit\w*) (?:my |both )?(?:arms?|legs?|wrists?|thighs?|stomach|veins?)",
           r"(?:cut|cutting|scratch\w*|burn\w*|hit\w*|punch\w*|bang\w*) (?:my )?(?:hands?|face|head|arms?|legs?|skin|wrists?|thighs?|body)"
           r" .{0,30}(?:when i|whenever i|until|till|to feel|so i (?:could|can) feel|again|cannot stop|on purpose|bleed)",
           r"burn\w* (?:myself|my (?:arms?|legs?|skin|wrists?|hands?|thighs?)) (?:with|using) (?:a |my )?(?:lighter|cigarettes?|match|matches|iron)",
           r"burn\w* myself", r"(?:^|[,.!?;] )(?:i )?cut again", r"cut again (?:tonight|today|last night)",
           r"(?:keep|kept|always|been|started) (?:cutting|burning|scratching|hurting|hitting) (?:my|myself)"),
    # 4. uống quá liều / tích thuốc
    _rx_en(r"overdos\w*", r"overdosed on", r"(?:took|take|taken|taking|swallowed|swallow|ate|eat|had|downed|popped|drank|drink) "
           r"(?:a |an |about |like |around |almost |maybe |way |far |way way |so )?(?:whole (?:box|bottle|pack|strip)|bottle|box|too many|too much|a lot|lot|bunch|"
           r"handful|all|twenty|thirty|fifty|dozen|\d+|more than)(?:.{0,30})(?:pills|meds|medication|tablets|paracetamol|panadol|"
           r"tylenol|ibuprofen|aspirin|antidepressants|sleeping pills|painkillers|pain killers|insulin)",
           r"(?:collect\w*|sav\w*|stockpil\w*|hoard\w*) (?:up )?(?:\w+ )?(?:pills|meds|tablets|sleeping pills|painkillers)",
           r"(?:took|take|taking|swallowed) (?:my )?(?:mother|mom|mum|mummy|father|dad|grandma|grandpa|grandmother|grandfather|"
           r"wife|husband|sister|brother|parents|friend|roommate|\w+ s)(?: s)? sleeping pills",     # thuốc ngủ của NGƯỜI KHÁC
           r"(?:steal\w*|stole|stealing) (?:my )?(?:\w+ )?(?:s )?sleeping pills",
           r"sleeping pills .{0,50}(?:want to take|going to take|take more|take again|also want)"),
    # 5. bạo lực / xâm hại đang xảy ra
    _rx_en(_NGUOI_EN + r" .{0,40}(?:hits|hit|hitting|beats|beat|beating|beaten|chokes|choked|choking|strangl\w*|slaps|slapped|slapping|"
           r"kicks|kicked|punch\w*|shoves|shoved|abuses|abused|abusing|rapes|raped|raping|molest\w*|assault\w*|attacks|attacked|"
           r"bruis\w*|throws things at|threw things at|burns|burned) (?:me|us|my (?:kids|children|son|daughter|mom|mum|mother|baby))"
           r"(?! (?:up|at (?:chess|cards|games?|tennis|badminton|football)|in (?:a|the) (?:game|race|match)|to it|back|with (?:a |the )?(?:question|deadline|news|fact)))",
           _NGUOI_EN + r" .{0,40}(?:touches|touched|touching|grabs|grabbed|watches|watching|forces|forced) me"
           r"(?! (?:deeply|so much|emotionally|to (?:study|work|eat|go|do (?:my )?homework|clean|practi[cs]e)))",
           _NGUOI_EN + r" .{0,40}(?:is |s |keeps |keep )?(?:hurting|hurts|hurt) me(?! (?:with (?:his|her|their|words)|by (?:saying|not)|emotionally|so much|deeply|feelings))",
           _NGUOI_EN + r" .{0,20}pushed me (?:down|into|against|off|onto|to the)",
           r"(?:touch\w*|watch\w*|came|comes|coming) (?:me |into )?.{0,30}(?:when i shower|while i shower|in the shower|the bathroom when|my room at night)",
           r"touching me since", r"forces? me to (?:have sex|sleep with|do (?:sexual|things))", r"forced me to have sex",
           r"(?:i was|i am|i m being|i am being|being|been|getting|get) (?:sexually |physically )?(?:raped|abused|molested|assaulted|beaten up|choked)",
           r"(?:i|we) (?:am|are) (?:being )?(?:abused|assaulted)", r"(?:beats|beat) (?:me|us) up", r"beat us", r"(?:mummy|mommy|mom|mum|we) also kena",
           r"(?:locks|locked) me (?:out|in)(?! of (?:my|the) (?:account|phone|app))", r"threaten\w* (?:me|my (?:kids|children|son|daughter|family)|to (?:kill|hurt|hit))",
           r"(?:scared|afraid|too scared|terrified) to go home", r"if i leave .{0,30}(?:he|she|they) (?:will|ll|would|is going to|going to) (?:find|hurt|kill)",
           r"(?:he|she|they) (?:will|ll|would|is going to|going to|s going to) (?:find|hurt|kill) (?:me|us|our|my)(?=.{0,40}(?:leave|go|if i))",
           r"(?:keeps? |is |been |always )?(?:following|stalking) me (?:home|everywhere|to work|at night)",
           r"(?:bruises|bruised|black eye) .{0,60}(?:husband|wife|partner|boyfriend|girlfriend|he|she)",
           r"(?:husband|wife|partner|boyfriend|girlfriend|he|she) .{0,80}(?:bruises|always bruised|are bruised|black eye)",
           r"(?:help me|please)[ ,]+(?:he|she|they|my \w+) (?:is |s )?(?:hurting|hitting|beating) me"),
]
# EN-ALL GĐ 3d (bộ dev2 viết độc lập, holdout v2): khủng hoảng NÓI TRÁNH hay đứng trước một câu hỏi lá số ("… which
# explains why I don't see the point of going on — what element should I add?") — khủng hoảng luôn thắng câu hỏi đi sau.
KHUNG_HOANG_ANH.append(_rx_en(
    # 6a. không còn thấy lý do sống / ý chí sống
    r"(?:do not|cannot|can not|no longer|fail to|never) see (?:the |any |a )?(?:point|reason|purpose|use) (?:of |in |to |for )?"
    r"(?:going on|living|live|life|being alive|staying alive|carrying on|continuing|keep going|keep living|existing|being here|anymore)",
    r"(?:no|not any|any|without) (?:point|reason|purpose) for me (?:to |in )?(?:live|living|keep living|go on|going on|keep going|"
    r"stay alive|be alive|be here|exist|continue|stay)",
    r"(?:lost|losing|lose|have no|got no|no) (?:the |my |all |any )?(?:will|desire|wish|reason|strength) to (?:live|go on|keep going|keep living|stay alive)",
    # 6b. biến mất hẳn / ngày cuối / không cần xem nữa
    r"(?:(?:i|me|myself)(?: (?:just|really|simply|could|would|should|want to|wanna|wish i could|keep|am|m|will))*|about|of) "
    r"disappear\w* (?:for good|forever|permanently)",
    r"disappear\w* (?:from|out of) (?:this|the) world|disappear\w* from everyone s li(?:fe|ves)",
    r"(?:this|tonight|today|tomorrow|this (?:weekend|week|month)) (?:is|will be|is going to be) my last(?=\s*(?:[,.!?;]|$))",
    r"my last (?:day|night|week|weekend|birthday|christmas) (?:alive|on earth|in this world|ever)",
    r"(?:will not|never|not going to|won t) (?:need|be needing) (?:a |any |another |more )?(?:readings?|charts?|advice|answers?|this|anything)"
    r" (?:after (?:this (?:week|weekend|month)|tonight|today|tomorrow|next week)|where i (?:am|m) going|where i will be)",
    r"(?:remove|removing|erase|erasing|take|taking) myself (?:from|out of) (?:everyone s|everybody s|their|this|the) (?:life|lives|world|picture)"
    r"(?: (?:permanently|forever|for good))?(?!\w)(?=.{0,30}(?:permanent|forever|for good|burden|better))",
    # 6c. "thế giới tốt hơn nếu tôi không ở đây" (mọi cách nói)
    r"(?:better|happier|easier|lighter) (?:off )?(?:for everyone |for them |for my family |for everybody )?if i (?:just |simply |only )?"
    r"(?:(?:was|were) (?:not |n t )?(?:here|around|alive|gone|in it|in the world|born|dead)|(?:wasn t|weren t) (?:here|around|alive|in it|"
    r"in the world|born)|did not exist|didn t exist|never existed|disappeared|died|vanished|left this world)",
    r"(?:nobody|no one|noone) (?:really )?(?:cares|would care|will care|would even care|gives a (?:damn|shit)) (?:if|whether) i (?:live|die|am alive|"
    r"am gone|exist|disappear|am here)",
    r"(?:maybe|so|perhaps|then|honestly) i (?:should|might as well|may as well) (?:just )?(?:die|disappear|end it|be dead)(?=\s*(?:[,.!?;]|$))",
    r"i (?:should|might as well|may as well) (?:just )?die(?=\s*(?:[,.!?;]|$))",
    # 6d. lên ban công / mép cao để bước xuống; nhịn thở mãi; dây thừng
    r"(?:step|stepping|stepped|throw\w* myself|let myself fall|lean\w* over|go over) (?:off |over |from |out of )?(?:the |a |my |our )?(?:\w+ ){0,2}"
    r"(?:balcony|ledge|roof|rooftop|bridge|edge|window|railing|cliff)",
    r"(?:standing|stand|stood|sitting|sat) on (?:the |a |my |our )?(?:\w+ ){0,2}(?:balcony|ledge|roof|rooftop|bridge|railing|edge)"
    r" .{0,40}(?:thinking|wondering|imagining) (?:about |of )?(?:jumping|stepping|falling|letting go|ending|going over|how easy)",
    r"stop breathing (?:forever|for good|permanently)|(?:want|wish|wanna|need) (?:to )?(?:just )?stop breathing|"
    r"(?:want|wish) my heart (?:to|would) (?:just )?stop",
    r"noose",
    # 6e. lên kế hoạch cái chết của mình
    r"plan\w* (?:out )?(?:how|when|where) (?:i (?:would|will|could|might|am going to|d|ll) |to )(?:die|end (?:it|things|my life)|kill myself|do it|go)",
    r"(?:keep|kept|always|constantly) (?:thinking|think) (?:about|of) (?:dying|my (?:own )?death|killing myself|ending it|not being here)",
    # 6f. muốn mọi thứ chấm dứt hẳn / chấm dứt khổ đau vĩnh viễn
    r"(?:end|ending|stop|stopping) (?:my|the|this|all (?:my|the|this)) (?:suffering|misery|torment)(?: \w+){0,2} (?:permanently|forever|for good|once and for all)",
    r"(?:permanently|forever|for good|once and for all) end\w* (?:my|the|this) (?:suffering|misery|life)",
))
# EN-ALL GĐ 4 (bộ câu Tử vi tiếng Anh viết độc lập, tuvi_dev): khủng hoảng nói tránh mới — không muốn tỉnh dậy, tự hại lại,
# "bình yên vĩnh viễn", tích thuốc, thư từ biệt kèm lo cho con, không đi tiếp được, không thấy tương lai, ngừng ăn, "thế
# giới có nhận ra nếu tôi biến mất", vũ trụ muốn tôi chết, lên kế hoạch "cách", cố ý uống thêm thuốc, "tôi cũng sẽ kết thúc".
KHUNG_HOANG_ANH.append(_rx_en(
    r"(?:think\w*|thought|dream\w*|wish\w*|pray\w*|want\w*|hop\w*) (?:about |of )?(?:just )?(?:not|never) waking up(?! (?:early|late|on time|tired))",
    r"(?:been|started|start|keep|kept|i m|i am|im) cutting (?:again|myself|my (?:arms?|wrists?|legs?|thighs?|skin|body|stomach))|"
    r"(?:i ve|i have|i) (?:been )?cutting again",
    r"(?:be|being|finally|find|rest) (?:at )?peace\W{0,3} (?:like )?(?:permanently|forever|for good)(?! (?:with|in|at|between))",
    r"(?:have|got|kept|keeping|saved|saving|stashed|hid|hidden) (?:the |my |some |all the |a few )?(?:\w+ )?(?:pills|meds) "
    r"(?:saved|stashed|hidden|put aside|set aside)(?: up)?",
    r"(?:written|wrote|writing|write) (?:goodbye |farewell )?(?:letters?|notes?) (?:to|for) (?:my |all my )?(?:kids|children|family|son|daughter|"
    r"wife|husband|parents)(?=.{0,60}(?:will (?:they|she|he) be (?:ok|okay|alright|fine)|after i m gone|when i m gone|take care of))",
    r"(?:do not|don t|cannot|can t|can not) (?:think i can |think i ll be able to |see how i can )?keep going(?! (?:to|with|at|on with))",
    r"(?:said|say|saying) goodbye to (?:\w+ ){0,2}(?:friends|family|kids|parents)(?=.{0,80}\b(?:next life|afterlife|after i die|other side))",
    r"(?:ready to|want to|going to|gonna|planning to|time to) check out(?: early)?(?=\s*(?:[,.!?;]|$))|"
    r"check out (?:early )?of (?:life|this world|here for good)",
    r"(?:do not|don t|cannot|can t|can not) see (?:a|any) future (?:for myself|for me)(?: (?:past|after|beyond) (?:this|next) (?:year|month|week))?",
    r"(?:thinking|thought|think) (?:of|about) (?:just )?(?:stopping|stop|quitting|quit) eating",
    r"(?:would|will|d) (?:the world|anyone|anybody|people|they) (?:even )?(?:notice|care|miss me) if i (?:was|were|m|am) (?:gone|not here|dead)"
    r"(?! (?:from|for|to|on|at|in) )",
    r"(?:universe|world|god|everyone|the stars|my chart) (?:wants|want) me (?:dead|to die|gone)",
    r"(?:started|start|been|am|i m) planning (?:how|it|the date|my exit|my death)(?=\s*(?:[,.!?;]|$| to | i ))",
    r"(?:took|take|taken|taking|swallowed) (?:a few |some |a couple of )?(?:extra|more) (?:of )?(?:my |the )?(?:\w+ )?(?:pills|tablets|meds) on purpose",
    r"(?:i ll|i will|i m going to|i am going to|gonna) end (?:too|as well|myself too|with it)(?= when| if| after|\s*(?:[,.!?;]|$))",
    r"(?:i ve|i have|i) decided (?:that )?i (?:ll|will) end(?: it| things| myself| my life)?(?= too| when| after| once|\s*(?:[,.!?;]|$))",
    r"die young .{0,20}(?:because|cause|cos|coz) i (?:kind of |kinda |sort of |really |just )?want(?: to| it)?",
    r"(?:have|got|bought|hid|hidden) (?:a |the |some )?rope (?:in|ready|hidden|set up)(?! (?:for|to tie))",
    r"(?:make sure|ensure) (?:she|he|they) (?:can t|cannot|won t|will not|never) (?:\w+ ){0,3}(?:again|anymore|ever)?(?=.{0,40}(?:ruin|win|chart))|"
    r"(?:ruin|ruined|ruining) my life .{0,30}(?:so )?i (?:m|am) going to make sure (?:she|he|they)",
    r"is there (?:any|even a|a) point(?=[,.!?;]?.{0,40}(?:my life|all of it|living|of it all|to anything))"
    r"(?!.{0,30}\b(?:career|job|work|business|degree|study|studies|relationship|marriage)\b)",
    # GĐ 4 (tự viết thêm theo nghĩa — không theo câu của bộ đo): không đáng tồn tại, được nghỉ mãi, buông bỏ cuộc sống,
    # chết bằng tay mình, thư từ biệt, nghĩ tới cái chết mỗi ngày, hỏi có nên nhảy, đời vô nghĩa, cho đi thú cưng, muốn
    # nỗi đau dừng hẳn, "sẵn sàng đi" khi tuyệt vọng, chọn ngày để chết
    r"(?:shouldn t|should not|don t deserve to|do not deserve to|wasn t meant to|was not meant to) (?:even )?(?:exist|be alive|live|be here)",
    r"(?:rest|sleep) forever|eternal (?:rest|sleep)|(?:finally )?(?:get to )?rest in peace(?! (?:grandma|grandpa|mom|dad|\w+ s))",
    r"give up on (?:life|living|everything|it all)(?! (?:in|at) | and (?:start|move|go|begin|try|travel|focus))",
    r"(?:die|dying|end (?:it|my life)) by my own hand|by my own hand",
    r"goodbye (?:notes?|letters?)|farewell (?:notes?|letters?)|(?:my )?will and (?:goodbye|farewell)",
    r"(?:think|thinking|thought) (?:about|of) (?:dying|death|my death|being dead) (?:every|all the|each) (?:day|night|time)|"
    r"(?:constant|daily) thoughts? (?:of|about) (?:dying|death)",
    r"(?:should i|if i should|whether i should|whether to) jump(?=\s*(?:[,.!?;]|$)| off| from| down)",
    r"life (?:is|feels|seems) (?:so |completely |totally )?(?:pointless|meaningless|not worth (?:it|living))",
    r"(?:can t|cannot|can not) keep (?:living|existing|going on)(?! (?:in|at|with) (?!this))",
    r"(?:given|gave|giving) away my (?:cat|dog|pets?|cats|dogs|things|stuff|belongings)",
    r"(?:want|need|wish) (?:the |all the |this )?(?:pain|suffering|hurt) to (?:end|stop) (?:permanently|forever|for good)",
    r"(?:no light|end of the tunnel|nothing left|hopeless|no point|no way out).{0,60}ready to go(?=\s*(?:[,.!?;]|$))",
    r"(?:good|best|right|lucky) (?:day|time|month|date|year) (?:for me )?to (?:die|end it|end my life)(?=\s*(?:[,.!?;]|$))|"
    r"(?:goodbye|farewell) (?:notes?|letters?).{0,40}(?:good|best|right) (?:day|time|month) to go",
    # không còn ở đây / rời thế giới / không định sống tới mốc
    r"(?:stop|quit|cease) existing(?! (?:for a|on|from|online|in (?:the )?group|at work))|leave this (?:world|earth|life)|(?:time|days) on (?:this )?earth (?:is|are) (?:up|over|done)|"
    r"(?:my )?time (?:here )?is up(?=\s*(?:[,.!?;]|$))",
    r"(?:rather|prefer to|d rather|would rather) not be (?:around|here|alive)(?=\s*(?:[,.!?;]|$)| anymore| any longer| in this world| for the next)",
    r"(?:don t|do not|won t|will not|never) (?:plan|intend|expect|want) (?:on |to )?(?:see|seeing|be around for|live to see|make it to) "
    r"(?:(?:19|20)\d\d|next (?:year|month|week|birthday|christmas)|my (?:next )?birthday|the new year|another year)",
    r"(?:worth|bother) (?:sticking|staying|being) (?:around|alive|here)(?: for)?(?! (?:at|in|with|until|till|for (?:this|the|my|a|another) "
    r"(?:job|company|team|city|place|role|project|promotion)))",
    r"(?:i ll|i will) be gone (?:before|by) (?:the next |next )?(?:lunar new year|chinese new year|new year|christmas|my (?:next )?birthday|"
    r"(?:19|20)\d\d|next year|the end of (?:the|this) year)",
    r"(?:won t|will not|don t think i ll|do not think i will) make it to (?:my )?(?:next )?(?:birthday|(?:19|20)\d\d|next year|new year)",
    r"(?:after|when) i m gone(?=.{0,60}(?:ok|okay|alright|fine|kids|children|family|cope|look after|take care))|"
    r"(?:kids|children|family|wife|husband) .{0,30}(?:be )?(?:ok|okay|alright|fine) (?:after|when|once) i m gone",
    r"(?:family|kids|children|everyone|they) (?:will|would|ll|d) be (?:fine|okay|ok|better) without me",
    r"(?:without me|after i m gone|when i m gone|if i die|when i die|after i die).{0,60}insurance|"
    r"insurance.{0,40}(?:when i m gone|after i m gone|if i die|when i die|after i die)",
    r"imagin\w* (?:my )?own funeral|(?:nobody|no one|noone) (?:would|will) (?:even )?(?:come|go|show up) to my funeral",
    r"punish (?:myself|my body)(?! (?:at|in|with|by|for not|for skipping|for eating|for missing))|"
    r"(?:what|something) i (?:might|may|could) do to myself",
    r"how many (?:\w+ )?(?:pills|tablets) (?:it )?(?:takes|would take|does it take|to die|to overdose)",
    r"(?:bottle|box|stash|pile) of (?:\w+ )?(?:pills|tablets|meds) .{0,40}(?:keep looking|staring|thinking about|tempting)",
    r"(?:drive|driving|drove|crash\w*|steer\w*) (?:my |the )?(?:car|bike|motorbike|truck) (?:off|into) .{0,20}on purpose|"
    r"(?:off|into) the (?:road|cliff|wall|river|barrier) on purpose",
    r"(?:stop the world and get off|get off this ride) (?:permanently|forever|for good)",
    r"(?:got|have) everything ready.{0,30}(?:right|the) (?:day|time|date)|"
    r"(?:ghost|dead|gone|disappear\w*|not here).{0,60}make it official",
    r"(?:die|death).{0,40}plan to go first|(?:i ll|i will|let me) go first before",
))
# Cặp mới (ý, ngữ cảnh) — GĐ 3d: "I want it to be over" chỉ là khủng hoảng khi câu nói về cuộc sống / khổ đau; dây thừng chỉ
# khi kèm cảnh nhìn / buộc / treo; ý làm hại người khác chỉ khi nói nghiêm túc (kế hoạch, vũ khí, "for real").
_KHUNG_HOANG_KEP_3D: list[tuple[re.Pattern, re.Pattern]] = [
    (_rx_en(r"(?:want|wish|need|ready for) (?:it|this|everything|my life|life|it all) (?:all )?(?:to )?(?:be over|end|stop|to end|to stop)"
            r"(?: (?:forever|for good|permanently))?(?=\s*(?:[,.!?;]|$))"),
     _rx_en(r"life|living|alive|pointless|meaningless|hopeless|worthless|suffer\w*|exist\w*|anymore|tired of|done with")),
    (_rx_en(r"life is (?:pointless|meaningless|worthless|hopeless|not worth it)|(?:i am|i m) (?:worthless|hopeless)"),
     _rx_en(r"(?:want|wish|need) .{0,20}(?:over|end|stop|gone|die|disappear)|give up on (?:life|living)|no reason|cannot go on")),
    (_rx_en(r"rope"), _rx_en(r"(?:keep |kept )?(?:looking|staring|stare) at it|around my neck|hang\w* (?:myself|it from|from)|ceiling|beam")),
    (_rx_en(r"(?:want|wanted|going|plan\w*|gonna|ready|thinking about how|think about how|thought about how|decided) (?:to )?"
            r"(?:kill|murder|stab|shoot|poison|strangle|seriously hurt|hurt) (?:my |the |that |this )?(?:\w+ ){0,2}"
            r"(?:boss|husband|wife|partner|ex|neighbou?r|colleague|coworker|co worker|father|dad|mother|mom|mum|stepdad|stepmom|"
            r"brother|sister|teacher|him|her|them|someone|people|everyone|family)"),
     _rx_en(r"for real|seriously|serious|thought about how|planned|planning|a plan|my plan|tonight|not joking|i mean it|"
            r"i will do it|how to do it|knife|gun|weapon|poison|really going to")),    # Đã chuẩn bị phương tiện ("bought the pills already", "the rope is ready") + hỏi THỜI ĐIỂM ("is tonight a good night") — khủng hoảng.
    (_rx_en(r"(?:bought|got|have|collected|saved|stocked up on|got hold of|picked up) (?:all |enough |the |my )?(?:\w+ )?"
            r"(?:pills|meds|sleeping pills|rope|noose|charcoal|razors?|blades?|gun|bullets?|poison|helium)(?: \w+){0,2} (?:already|ready)"
            r"|already (?:bought|got|have|collected|saved) (?:all |enough |the |my )?(?:\w+ )?(?:pills|tablets|meds|sleeping pills|rope|noose|"
            r"charcoal|razors?|blades?|gun|bullets?|poison|helium)"
            r"|(?:enough|all the|all my) (?:sleeping )?(?:pills|meds|tablets)(?: \w+){0,3} (?:saved|ready|collected|stocked)"
            r"|(?:pills|rope|noose|charcoal|gun|blades?|poison) (?:are|is) (?:ready|here|next to me|in front of me|all set)"),
     _rx_en(r"tonight|good night|good (?:day|time|hour|moment)|right (?:day|time|night|moment)|best (?:day|time|night)|when (?:should|to|do) i|"
            r"which (?:day|night|hour)|lucky (?:day|night|hour)|auspicious|already|ready|do it|go through with")),
]
# "I don't think I'll be here much longer" — khủng hoảng, trừ khi câu nói chuyện chuyển nhà / đi nước ngoài / nghỉ việc.
_KHONG_CON_O_DAY = _rx_en(r"(?:do not|don t|cannot|can t) (?:think|expect|see|plan on|plan to) (?:that )?(?:i will |i ll |i am going to |i ll still |"
                          r"myself |to )?(?:still )?(?:be|being|stick|sticking) (?:here|around|alive)(?: (?:much|any) longer| for (?:long|much longer)| anymore)")
_CHUYEN_DI = _rx_en(r"mov\w*|relocat\w*|abroad|overseas|emigrat\w*|transfer\w*|new job|resign\w*|quit\w*|contract|lease|company|office|"
                    r"job|visa|university|school|city|country|town|travel\w*")
# Ý làm hại con nhỏ / người phụ thuộc mình (bản Việt: bạo lực, xâm hại) — luôn là khủng hoảng.
_HAI_CON = _rx_en(r"(?:thinking|thought|think|scared|afraid|urges?|tempted|going|want|wanted|planning|plan|imagin\w*|feel like)"
                  r" (?:about |of |to )?(?:hurting|harming|hitting|shaking|smothering|drowning|killing|strangling|hurt|harm|kill|"
                  r"smother|drown|strangle|shake) (?:my |our |the )?(?:own )?(?:baby|babies|newborn|infant|child|children|kid|kids|"
                  r"son|daughter|toddler)(?! s (?:feelings|chances|confidence|future)| feelings)")
_NHAY = re.compile(r"(?<!\w)jump\w* (?:off|down|from|out of)(?!\w)")
_NHAY_GT = _rx_en(r"bungee|cliff ?div\w*|skydiv\w*|parachut\w*|base jump\w*|high dive|diving board|zip ?lin\w*")
# Uống nhầm / quá liều NGOÀI Ý MUỐN → nhóm cấp cứu (khuyên đi khám ngay), không phải lời hỗ trợ khủng hoảng.
_NHAM = _rx_en(r"by (?:accident|mistake)|accidentally|accidental|mistakenly|did not mean to|didn t mean to|wrong (?:dose|medicine|pills|bottle)|"
               r"double dosed|forgot i (?:already )?took")
# Uống thuốc để CHỮA một chứng đau cụ thể ("for my toothache") mà quá liều — cũng là quá liều ngoài ý muốn (cấp cứu).
_VI_BENH = _rx_en(r"for (?:my |a |the |his |her )?(?:bad |sore )?(?:back|back pain|tooth\w*|headaches?|migraines?|pain|fever|cold|flu|"
                  r"period|cramps|cough|knee|arthritis|sore throat|injury|joints?|stomach ?ache)")


def _nham(k: str) -> bool:
    return bool(_NHAM.search(k) or _VI_BENH.search(k))


# Cặp (ý, ngữ cảnh): cụm chỉ là khủng hoảng khi cùng câu có ngữ cảnh chết / buông bỏ ("speed it up" + death; "ready to
# go" + peace / tired / done…; cho đi đồ đạc, thú cưng + lá cuối / trả hết nợ / tạm biệt).
_KHUNG_HOANG_KEP: list[tuple[re.Pattern, re.Pattern]] = [
    # "this is my last question / reading" chỉ là khủng hoảng khi câu có ý chết / chấm dứt / từ biệt ("This is my last
    # question: when will I get promoted?" là câu thường).
    (_rx_en(r"(?:this|it) (?:is|will be|s|might be|may be|is going to be)? ?(?:going to be )?my (?:last|final) (?:reading|question|"
            r"time asking|time|tarot|card|message)"),
     _rx_en(r"die|dying|death|dead|kill\w*|end (?:it|things|everything)|gone|goodbye|before i go|(?:won t|will not|not) (?:be (?:here|"
            r"around|alive)|need)|leave this world|ever|forever|last day|suicid\w*|no more me|(?:thank you|thanks) for ever\w*")),
    (_rx_en(r"speed it up|hurry it up|get it over with"), _rx_en(r"death|die|dying|dead|end")),
    (_rx_en(r"(?:i am|i m|am|finally) ready to (?:go|leave)(?=\s*(?:[,.!?;]|$))"),
     _rx_en(r"peace|tired|done|pain|suffer\w*|anymore|enough|goodbye|finally|rest|over")),
    (_rx_en(r"(?:giving|gave|give|given|pass\w*|rehom\w*) (?:away )?(?:all )?my (?:cat|dog|pets?|guitar|savings|car|jewelry|jewellery)"
            r"|(?:transferred|gave) my savings"),
     _rx_en(r"final|last|one last|paid off|goodbye|let go|love them|note|before i")),
]
# Cho đi đồ đạc của mình (dấu hiệu cảnh báo) — trừ khi nói rõ dọn nhà / quyên góp / chuyển nhà / bán.
_CHO_DO = _rx_en(r"(?:giving|gave|give|given|pass\w*) (?:away )?(?:all )?my (?:things|stuff|belongings|possessions)(?: away)?"
                 r"|my (?:things|stuff|belongings|possessions) away")
_CHO_DO_THUONG = _rx_en(r"declutter\w*|donat\w*|moving|move house|moving house|relocat\w*|marie kondo|spring clean\w*|sell\w*|garage sale|minimalis\w*")
# Lời doạ "X says he'll kill me" — chỉ khi người nói nghiêm túc (không kèm lol / jk / spoil…; có "believe", "scared"… thì vẫn tính).
_DOA_GIET = re.compile(_NGUOI_EN + r" (?:says?|said|told me|tells me|threaten\w*|swears?|swore|yells?|yelled|screams?|shouts?)"
                       r" .{0,25}(?:will|ll|gonna|going to|is going to|wants to|want to)? ?kill (?:me|us)")
_DOA_GIET_2 = re.compile(r"(?:will|ll|gonna|going to|wants to) kill (?:me|us)(?=.{0,60}(?:believe|scared|afraid|terrified|knife|gun|"
                         r"means it|serious|following|stalk|if i leave|weapon))")
_DUA_RX = re.compile(r"(?<!\w)" + _DUA + r"(?!\w)")
_THAT = re.compile(r"(?<!\w)(believe|scared|afraid|terrified|serious|means it|knife|gun|weapon)(?!\w)")

# --- cấp cứu (triệu chứng cấp — khuyên đi khám / gọi cấp cứu NGAY)
_AI_DO = (r"(?:he|she|they|i|someone|my (?:\w+ ){0,2}(?:son|daughter|kid|child|baby|dad|father|mom|mum|mother|husband|wife|friend|"
          r"grandpa|grandma|grandfather|grandmother|brother|sister|partner|boyfriend|girlfriend|uncle|aunt|ah gong|ah ma))")
_CAP_CUU_ANH = _rx_en(
    r"(?:crushing |severe |sharp |bad |sudden )?chest (?:pain|pains|pressure|tightness)", r"chest (?:is |feels )?(?:tight|heavy|hurting|crushing)",
    r"pain (?:in|on) my chest", r"(?:cannot|can not|could not|unable to|hard to|trouble|difficulty|struggling to|struggle to) (?:breathe|breathing)",
    r"(?:not|isn t|is not|stopped|stop|no longer) breathing", r"can t breathe|cant breathe|cannot breathe",
    r"(?:lips|face|skin) (?:are |is )?(?:going |turning )?(?:blue|purple)", r"turning blue",
    r"(?:face|mouth|smile) (?:is )?droop\w*", r"one side of (?:his|her|my|the|their) (?:face|body) .{0,20}(?:droop\w*|numb|weak|cannot move|can t move)",
    r"slurred speech|stroke symptoms|(?:cannot|can t|could not) speak properly|suddenly (?:cannot|can t) (?:speak|talk|move|see)",
    r"sudden(?:ly)? numb\w*|numb (?:arm|face|leg|side)",
    _AI_DO + r" (?:just |suddenly |has |had )?(?:collapsed|fainted|passed out|blacked out)", r"fainted|passed out|passing out|unconscious|unresponsive",
    r"(?:not|isn t|is not|barely|stopped|no longer) respond\w*",
    r"(?:cannot|can t|could not|won t|will not) wake (?:him|her|them|my \w+|up)(?! (?:early|in the morning|on time|for|at|before|in time|with))",
    r"seizure\w*|seizing|convuls\w*|(?:won t|will not|cannot) stop shaking",
    r"(?:bleeding|bleed\w*) (?:heavily|a lot|so much|badly|won t stop|will not stop|nonstop|everywhere|from (?:the|his|her|my) head)",
    r"heavy bleeding|(?:head|nose) bleeding a lot|losing (?:a lot of )?blood",
    r"swallowed (?:a |an |some |the )?(?:battery|batteries|bleach|poison|magnets?|coin|detergent|chemicals?|button battery)",
    r"throat (?:is )?(?:swelling|swollen|closing)|tongue (?:is )?swelling|anaphyla\w*|severe allergic reaction",
    r"heart (?:is )?(?:pounding|racing) .{0,30}(?:cannot|can t|hard to) (?:breathe|stand)", r"overdosed|swallowed pills",
    # GĐ 3d: dấu hiệu cấp khác (đột quỵ, chấn thương đầu, nôn ra máu, sắp ngất, trẻ nuốt thuốc / hoá chất)
    r"worst headache (?:of (?:my|his|her) life|ever|i (?:have )?ever had)|thunderclap headache|"
    r"sudden(?:ly)? (?:severe|terrible|splitting|excruciating) headache",
    r"(?:my|his|her|their) (?:vision|eyesight|sight) (?:suddenly |just |has |is )?(?:went|gone|going|turned|became|become|is|got) "
    r"(?:blurry|blurred|black|dark|double)|(?:suddenly|all of a sudden) (?:lost|losing|cannot see|can t see)|"
    r"(?:lost|losing) (?:the )?(?:vision|sight) in one eye",
    r"(?:head|ear|ears|mouth|eye|eyes|wound|neck|stomach) (?:is |are |s |keeps |won t stop |will not stop |started )?(?:bleeding|gushing blood)",
    r"(?:vomit\w*|throw\w* up|threw up|cough\w* up|coughing) (?:up )?(?:blood|black stuff)|blood in (?:my |his |her )?(?:vomit|stool|poo)",
    r"(?:feel(?:ing)? like|about to|going to|gonna) (?:i m |i am |i will |i ll |he s |she s |he is |she is )?(?:going to |gonna |about to )?"
    r"(?:pass out|faint|collapse|black out)(?= (?:right now|now|any (?:second|minute)))",
    r"(?:heart|chest|dizzy|dizziness|cannot breathe) .{0,40}(?:going to|about to|gonna|feel like) (?:\w+ ){0,3}(?:pass out|faint|collapse|black out)",
    r"slurr\w* (?:speech|words|(?:his|her|their) words)|(?:speech|talking|voice) (?:is |was )?(?:\w+ )?slurr\w*|"
    r"(?:is|s|was|started|keeps|been|now|and) slurring",
    r"hit (?:his|her|my|their|the|its) head .{0,60}(?:confused|vomit\w*|unconscious|drowsy|sleepy|slurr\w*|cannot wake|can t wake|"
    r"bleeding|not making sense|throwing up)",
    r"(?:swallowed|ate|eaten|drank|drunk|got into|chewed) (?:a |an |some |the |my |his |her |our )?(?:\w+ ){0,2}(?:bleach|detergent|poison|"
    r"chemicals?|batter(?:y|ies)|cleaning (?:liquid|product)|pesticide|weed killer|antifreeze|laundry pods?|rat poison)",
    r"got into (?:my |his |her |our |the |grandma s |mom s |dad s )?(?:\w+ )?(?:pills|tablets|meds|medicine|medication)",
    r"(?:toddler|baby|child|kid|son|daughter|dog|cat|puppy) (?:\w+ ){0,3}(?:swallowed|ate|chewed|drank) (?:some |a handful of |a bunch of |"
    r"a lot of |my |the |grandma s |mom s |dad s )(?:\w+ )?(?:pills|tablets|meds|medicine|medication)",
    r"(?:took|taken|take|swallowed|had) (?:way |far |so |a bit |accidentally )?(?:too many|too much|a double dose|the wrong|an overdose)(?:.{0,30})(?:pills|meds|medication|tablets|"
    r"medicine|insulin|dose)(?=.{0,40}(?:accident|mistake|dizzy|faint|vomit|confused|drowsy|now|sick|numb))",
)
# Tai nạn đang xảy ra (chảy máu, bất tỉnh, không cử động được) — không tính chuyện tai nạn đã qua ("last year", "in 2019").
_TAI_NAN_NGAY = _rx_en(r"(?:in|had|got into|was in|been in|just had) (?:a |an )?(?:\w+ ){0,2}(?:crash|accident|collision)|hit by a (?:car|bus|truck|motorbike|bike)")
_TAI_NAN_NANG = _rx_en(r"bleed\w*|unconscious|cannot move|can t move|not breathing|not moving|bone sticking")
_DA_QUA = _rx_en(r"last (?:year|month|week)|years? ago|months? ago|in (?:19|20)\d\d|when i was|back in|childhood")

# --- từ chối
_BENH = (r"(?:cancer|tumou?rs?|diabetes|diabetic|lupus|thyroid(?: problems?| disease| issues?)?|adhd|autism|autistic|bipolar|"
         r"depression|schizophreni\w*|ocd|ptsd|dementia|alzheimer\w*|parkinson\w*|a stroke|stroke|heart (?:disease|problems?|condition|attack)|"
         r"(?:high )?blood pressure|hypertension|hiv|aids|stds?|stis?|hepatitis|kidney (?:disease|failure|problems?)|"
         r"liver (?:disease|problems?)|asthma|epilepsy|arthritis|infertil\w*|endometriosis|pcos|covid|leuka?emia|lymphoma|"
         r"(?:a |any )?(?:serious |chronic |terminal )?(?:disease|illness|sickness|condition)|an? std)")
_CONG_CU = (r"(?:chart|bazi|ba zi|tarot|cards?|reading|numerology|face reading|face|palm\w*|i ching|iching|zwds|zi wei|"
            r"horoscope|stars?|health palace|luck pillar|life path|lp|birth date|birthday|it|you|your site|astrology)")
_THUOC = (r"(?:meds|medication|medications|medicine|medicines|pills|tablets|antidepressants?|insulin|chemo\w*|antibiotics?|lithium|"
          r"statins?|treatment|prescription|inhaler|blood thinners?|depression medicine|blood pressure (?:medication|medicine|pills))")
_NGUNG = (r"(?:stop|stopping|quit|quitting|skip|skipping|come off|coming off|go off|get off|cut down|reduce|drop|discontinue|ditch|"
          r"throw away|(?:do not|no longer|not) need)")
_THAN = (r"(?:i|he|she|they|we|my (?:\w+ ){0,2}(?:mother|mom|mum|father|dad|husband|wife|partner|son|daughter|child|kid|brother|"
         r"sister|grandma|grandpa|grandmother|grandfather|uncle|aunt|auntie|boyfriend|girlfriend|bf|gf|friend|parents|ah ma|ah gong|"
         r"in law|cousin|baby)(?: s)?|her|him)")
_CHET = r"(?:die|pass away|pass on|be dead|be gone|death)"

_TUYEN = (r"(?:hire|hiring|hired|recruit\w*|sack\w*|lay off|laying off|layoffs?|dismiss\w*|interviewing|"
          r"(?:fire|firing) (?:my|him|her|them|the|this|that|an|a|our|ppl|people|staff|employees?|workers?|someone))")
_NHAN_SU = (r"(?:candidates?|applicants?|interns?|staff|employees?|workers?|assistants?|accountants?|nanny|nannies|maids?|helpers?|"
            r"managers?|resumes?|cvs?|new hires?|team members?|salesperson|drivers?|baristas?|cleaners?|tutors?)")
_LA_SO_HO = (r"(?:(?:their|his|her|candidates?|applicants?|staff|employees?|workers?|interns?|people|ppl|new hires?|assistant|accountant)"
             r"(?: s)? (?:zi ?wei |purple star |natal )?(?:bazi|charts?|zodiacs?|birth ?days?|birth ?dates?|elements?|numbers|life ?paths?|lp|signs?|horoscopes?)|"
             r"born (?:in )?(?:(?:19|20)\d\d|the year of|yr of|year of)|(?:zodiac|lp|life path|element|sign)s? (?:clash\w*|is bad|bad luck)|"
             r"born in (?:the |a )?\w+ (?:year|yr)|clash\w* (?:w|with) (?:mine|me|my)|by (?:their )?(?:zodiac|bazi|chart|day master)|"
             r"(?:candidates?|applicants?|interns?|staff|employees?|workers?|nanny|nannies) (?:(?!my )\S+ ){0,5}(?:bazi|charts?|zodiacs?|"
             r"birth ?dates?|life ?paths?|elements?|horoscopes?))")
_CHON_MEM = _rx_en(r"pick|choose|select|rank|filter|screen|reject|promote|let go|shortlist")

# ranh giới từ cho các mảnh ghép (đứng sau ".{0,n}" — tránh "ill" trong "pillar", "aids" trong "braids")
_BENH, _CONG_CU, _THUOC, _NGUNG, _THAN, _CHET, _TUYEN, _NHAN_SU, _LA_SO_HO = (
    r"(?<!\w)" + m + r"(?!\w)" for m in (_BENH, _CONG_CU, _THUOC, _NGUNG, _THAN, _CHET, _TUYEN, _NHAN_SU, _LA_SO_HO))

TU_CHOI_ANH: list[tuple[re.Pattern, str]] = [
    # sống chết / tuổi thọ
    (_rx_en(r"(?:when|what year|which year|what age|which (?:day|month|date|week)|what (?:date|day|month)|how old|at what age|by when|what time)"
            r" (?:will|would|is|does|do|am|are|can|shall)? ?.{0,40}" + _THAN + r" .{0,30}" + _CHET,
            r"(?:when|how) (?:will|would|is|does|do|am|can) (?:i|he|she|my \w+) (?:going to )?(?:die|pass away)",
            r"(?:death|dying) (?:year|date|age|day|time)", r"(?:year|date|age|day|time) of (?:my |his |her |their )?death",
            r"(?:lifespan|life span|life expectancy|longevity|die young|dying young|early death|short life)",
            r"(?:how long|how many (?:more )?(?:years|months)) .{0,30}(?:live|have left|has left|got left|to live|remaining)"
            r"(?! (?:in|of|on|until|till|before|for) (?:this|my|the|our))",
            r"live (?:past|to|until|beyond|longer than|till) (?:\d+|a hundred)", r"(?:will|would|can) " + _THAN + r" live (?:long|to old age|past)",
            r"(?:only )?(?:has|have|got) (?:one|two|three|a few|few|\d+)(?: or (?:two|three|\d+))? (?:more )?(?:years?|months?) (?:left|to live)",
            r"(?:will|would|is going to|s going to|gonna|going to) (?:die|pass away)(?! (?:of|from) (?:laughter|embarrassment|boredom|curiosity))",
            r"(?:am i|will i|is " + _THAN + r") (?:going to|gonna) (?:die|pass)",
            r"(?:gonna|going to|will) pass (?:away|on|before|b4)", r"(?:die|pass away) (?:at|by|before) (?:age |the age of )?\d+",
            r"(?:will|is|does) " + _THAN + r" (?:survive|recover|pull through|make it)(?! (?:the|this|my|his|her|a|an|in|at|without) (?!illness|cancer|surgery|operation|disease))"),
     "du_doan_cu_the"),
    # chẩn đoán / bệnh / bỏ thuốc / phẫu thuật
    (_rx_en(r"(?:do|does|did|will|would|could|might) (?:i|he|she|they|my \w+) (?:have|has|hv|got|get|develop|catch) (?:a |an )?" + _BENH,
            r"(?:am|is|are) (?:i|he|she|they|my \w+) (?:infertile|autistic|bipolar|diabetic|sick|ill|dying|depressed or)",
            r"(?:got|have|has|having) " + _BENH + r" or not", r"sure (?:got|have) " + _BENH,
            r"(?:can|could|does|do|will|would|is|did) (?:my |the |his |her |your )?" + _CONG_CU + r" .{0,30}(?:tell|show|say|says|shows|confirm|"
            r"detect|see|predict|know|reveal|check|indicate|diagnose|find|spot|mean) .{0,40}" + _BENH,
            _BENH + r" .{0,30}(?:according to|from|based on|in|on) (?:my |his |her |the )?" + _CONG_CU,
            _BENH + r" .{0,40}(?:can|could|does|do|will|would) (?:my |the |his |her |your )?" + _CONG_CU
            + r" (?:confirm|tell|show|say|see|detect|know|predict|check)",
            r"(?:what|which) (?:illness|disease|sickness|condition|health problem)s? .{0,40}(?:will|do|does|might|could|would|most likely|am i|i have|i will)",
            r"(?:is it|is this|could it be|might it be) (?:cancer|a tumou?r|benign|malignant|diabetes|depression|adhd|autism|bipolar|schizophrenia)",
            r"(?:can|could|does|will|would) .{0,30}diagnos\w*", r"what is my diagnosis", r"prognosis",
            r"(?:should|do|can|must) (?:i|we|he|she|my \w+) (?:have|get|do|go for|undergo|need|skip|refuse|delay|avoid) "
            r"(?:the |a |an |this |my |his |her )?(?:surgery|operation|chemo\w*|radiation|radiotherapy|dialysis|transplant|biopsy|c section|caesarean)",
            r"(?:surgery|operation) (?:go well|be (?:successful|ok|okay|fine|safe)|succeed|work)",
            _NGUNG + r" (?:taking )?(?:my |the |his |her |all )?.{0,25}" + _THUOC,
            _THUOC + r" .{0,70}(?:" + _NGUNG + r"|safe to stop|can stop|stop or not|skip it|stop it|quit it)",
            # thai sản / sinh nở (bác sĩ, không lá số) — như bản Việt (MT-ĐS, CY-1): KHÔNG đoán kết quả cơ thể (có thai chưa, trai hay gái,
            # sảy thai, IVF, thai khoẻ, vô sinh); hỏi "bao giờ có con / có con không" thì trả lời bằng mảng gia đình + ranh giới bác sĩ.
            r"am i pregnant", r"infertil\w*",
            r"(?:ivf|iui) .{0,20}(?:success|work|succeed|chance|or nah|or not|will)", r"miscarr\w*",
            r"(?:boy|son) or (?:a )?(?:girl|daughter)|(?:girl|daughter) or (?:a )?(?:boy|son)", r"baby (?:s )?(?:gender|sex)",
            r"gender (?:of|prediction|reveal prediction)", r"twins .{0,20}(?:pregnan\w*|baby|babies)|(?:pregnan\w*|expecting) .{0,30}twins",
            r"(?:labour|labor|delivery|childbirth|giving birth) .{0,15}(?:be |b )?(?:easy|smooth|safe|ok|okay|fine|go well|complicated|difficult|hard)",
            r"(?:my|the) (?:baby|fetus|foetus|unborn)(?: is| will| has)? (?:be )?(?:healthy|sick|disabled|ok|normal|down syndrome)",
            r"(?:gender|sex) of (?:my|the|our) (?:baby|child)(?! name)"),
     "suc_khoe_the_chat"),
    # may rủi / đánh bạc / số đánh
    (_rx_en(r"(?:lottery|lotto|toto|4d|mark six|powerball|mega ?millions|jackpot|sweepstakes) .{0,25}(?:numbers?|digits|ticket|win|draw|tonight|this week|"
            r"weekend|friday|saturday|sunday|thursday|wednesday|lucky|heng|huat|pick|buy)",
            r"(?:numbers?|digits|ticket) .{0,25}(?:lottery|lotto|toto|4d|mark six|powerball|jackpot)",
            r"(?:win|winning|won) (?:the )?(?:lottery|lotto|jackpot|toto|4d|mark six|bet|casino|sweepstakes)",
            r"(?:buy|play|strike|bet on|buying) (?:the )?(?:4d|toto|mark six|lotto|lottery tickets?|powerball)",
            r"scratch (?:card|cards|ticket|off)", r"(?:casino|genting|marina bay sands|las vegas|vegas|macau) .{0,30}(?:luck|lucky|win|table|tonight|number)",
            r"(?:which|what) (?:table|machine|slot|horse|team|number|dog) .{0,30}(?:lucky|bet|win|heng)",
            r"(?:sports|football|soccer|horse|race|basketball|online|match) (?:bet|betting|bets)", r"(?:bet|betting|wager|gamble|gambling) on (?:a |the |which )?"
            r"(?:horse|team|race|match|game|football|soccer|sports|numbers?|cards|dice)",
            r"(?:bet|betting|wager|gamble|gambling) (?:tonight|tomorrow|this (?:week|weekend))", r"(?:roulette|baccarat|blackjack|slot machines?|slots) .{0,20}(?:luck|lucky|win|number|tonight)",
            r"(?:gambl\w*|betting|casino) (?:luck|win|wins|lucky)", r"lucky (?:numbers?|digits) (?:for|at|in|to) (?:the )?(?:casino|lottery|lotto|toto|4d|draw|bet|betting|tonight)",
            r"(?:give|gimme|pick|tell) (?:me )?(?:the |some |a |four |six |\d+ )?(?:winning |lucky )?(?:numbers|digits)(?! (?:mean|meaning|of my|in my))",
            r"(?:give|gimme) (?:me )?(?:a |the )?(?:4d|toto|lotto|lottery) (?:number|nos)",
            r"(?:numbers?|which number) (?:to|should i|i should) (?:bet|play|pick|buy)",
            r"(?:stock|crypto|coin|bitcoin|share) (?:price|will go|to buy|should i buy|pump)",
            # GĐ 4: chọn mã cổ phiếu / coin "sẽ tăng gấp mười" theo lá số
            r"(?:which|what) (?:stocks?|coins?|crypto|tokens?|shares?|tickers?) (?:will|would|is going to|should i|to) .{0,25}"
            r"(?:10x|100x|moon|go up|rise|pump|double|skyrocket|buy)"),
     "may_rui"),
    # GĐ 4: yểm bùa / nguyền rủa người khác bằng lá số — không làm
    (_rx_en(r"(?:do|put|cast|place|make|perform) (?:a |an )?(?:curse|hex|spell|black magic|jinx) (?:on|against|for)",
            r"(?:curse|hex|jinx) (?:my |him|her|them|that|this)(?! (?:word|words))"),
     "ngoai_pham_vi"),
    # chọn / loại người làm theo lá số (của NGƯỜI ĐƯỢC CHỌN — "my bazi says hire next year" là câu thời điểm, không chặn)
    (_rx_en(_TUYEN + r" .{0,80}" + _LA_SO_HO, _LA_SO_HO + r" .{0,80}" + _TUYEN,
            r"(?:which|what) (?:candidate|applicant|employee|staff|person|intern|worker)s? (?:should i|to|i should) (?:hire|fire|promote|pick|choose|let go)",
            r"(?:hire|fire|sack) (?:him|her|them|this (?:person|candidate|employee)) (?:by|based on|according to|acc to|using|with) "
            r"(?:his |her |their )?(?:bazi|chart|zodiac|numerology|birth ?dates?|life ?path|lp)",
            r"(?:hire|fire) (?:him|her|them|this (?:person|candidate|employee))(?=\s*(?:[,.!?;]|$))",
            r"(?:use|using|with) (?:numerology|bazi|zodiac|charts?|life ?path numbers?|birth ?dates?) to (?:filter|screen|pick|choose|select|hire|reject|rank)",
            r"(?:filter|screen) (?:the )?(?:resumes?|cvs?|candidates|applicants) .{0,40}(?:numerology|zodiac|bazi|chart|birth)",
            r"(?:new |the )?staff (?:s )?(?:bazi|chart|zodiac) .{0,20}(?:before|to) (?:hire|hiring)"),
     "ngoai_pham_vi"),
]
# Sức khoẻ NGƯỜI THÂN hỏi tiên lượng ("will she recover", "his chart shows …") → từ chối (không đọc lá số người hỏi).
_THAN_BENH_ANH = re.compile(r"(?<!\w)(?:my (?:\w+ ){0,2}(?:mother|mom|mum|moter|father|dad|husband|wife|partner|son|daughter|child|kid|"
                            r"brother|sister|grandma|grandpa|grandmother|grandfather|friend|uncle|aunt|boyfriend|girlfriend))(?: s)?"
                            r".{0,60}(?<!\w)(?:cancer|sick|ill|illness|disease|tumou?r|surgery|hospital|stroke|dying|coma|icu)(?!\w)"
                            r".{0,60}(?<!\w)(?:recover|survive|get better|be (?:ok|okay|fine|alright)|make it|heal|be cured|pull through|how long|"
                            r"outcome|wake up|chart (?:says?|shows?)|bazi (?:says?|shows?))(?!\w)")


# ================================================================== EN-ALL GĐ 3d vòng 4 — bộ nhận NGHĨA theo nhóm tín hiệu
# Ba bộ câu viết độc lập liên tiếp đều lọt câu khủng hoảng vì danh sách cụm cứ dài thêm. Phần này nhận các NHÓM tín hiệu
# theo nghĩa rồi ghép theo luật (hợp với các mẫu cụm ở trên, không thay):
#   · PHƯƠNG TIỆN: thuốc (tên thuốc, "stash"), vật (dây, dao, súng, than, khí…), chỗ cao, đường ray / xe, sông biển.
#   · Ý CHẤM DỨT: mạnh (một mình đã đủ: muốn biến mất hẳn, muốn ngủ không dậy, "done with life", câu Tagalog / Malay /
#     Singlish) · cần thêm tín hiệu (không dậy nữa, uống hết, "end it", biến mất mãi, lời từ biệt cuối) · hành vi từ biệt
#     (cho đi thú cưng / đồ đạc, viết thư cho gia đình…) · "trông thật bình yên" sát một phương tiện.
#   · TỰ COI MÌNH VÔ DỤNG / GÁNH NẶNG / HẾT HY VỌNG.
#   · Ý LÀM HẠI NGƯỜI KHÁC: người nói định giết / đâm / bắn… một người (không tính thành ngữ, câu đùa, câu cường điệu).
# Khủng hoảng = ý mạnh · ý chấm dứt + phương tiện đúng loại trong ~15 từ (thứ tự nào cũng được) · hành động nhảy / bước khi
# đang nghĩ tới + chỗ cao / đường ray · vô dụng + ý chấm dứt · hai hành vi từ biệt · "bình yên" sát phương tiện + một tín hiệu
# khác · ý làm hại người khác. Chỉ MỘT tín hiệu yếu → không chặn câu hỏi, câu trả lời kèm đoạn hỗ trợ (`ho_tro_mem_en`).
# Uống nhầm / quá liều ngoài ý muốn → nhóm cấp cứu (`_QUA_LIEU_NHAM`). Thước đo: scripts/cham_en.py.

def _cac_vi_tri(rx: re.Pattern, k: str) -> list[int]:
    """Vị trí TỪ (đếm khoảng trắng; câu đã thường hoá một khoảng trắng) của mỗi chỗ khớp."""
    return [k.count(" ", 0, m.start()) for m in rx.finditer(k)]


def _gan(a: list[int], b: list[int], n: int = 15) -> bool:
    return any(abs(x - y) <= n for x in a for y in b)


_THUOC_TEN = (r"paracetamol|panadol|tylenol|acetaminophen|ibuprofen|nurofen|aspirin|codeine|tramadol|oxycodone|xanax|valium|ambien|"
              r"zolpidem|melatonin|benzos?|diazepam|antidepressants?|insulin|painkillers?|pain killers?|sleeping pills?")
_PT_THUOC = _rx_en(r"(?:sleeping |sleep |headache |bp |blood pressure |anxiety )?(?:pills?|tablets?|capsules?|meds|medications?|medicines?)",
                   _THUOC_TEN, r"stash|stockpile")
_PT_VAT = _rx_en(r"rope|noose|ligature|knife|knives|blade|blades|razors?|gun|pistol|rifle|bullets?|charcoal|helium|car exhaust|"
                 r"exhaust pipe|carbon monoxide|rat poison|poison|bleach|pesticide|weed killer|antifreeze")
_PT_CAO = _rx_en(r"bridge|ledge|roof|rooftop|balcony|cliff|parapet|railing|(?:top|highest|(?<!\d)\d+(?:st|nd|rd|th)?) floor|hdb|condo|car ?park|"
                 r"multi storey|building|tower block|window")
_PT_RAY = _rx_en(r"(?:train |railway |rail |mrt |subway |metro )?tracks?|(?:mrt|train|subway|metro|lrt) (?:platform|station|line)|"
                 r"platform|oncoming (?:train|traffic|car|bus|truck|lorry)|traffic|(?:a |the )(?:train|bus|lorry|truck|car)")
_PT_NUOC = _rx_en(r"river|sea|ocean|lake|reservoir|waves|canal")
# hành động gắn với chỗ cao / đường ray / nước — chỉ tính khi có ý nghĩ / ý muốn đứng trước (≤ 6 từ)
_HD_CAO = _rx_en(r"(?:step|stepping|stepped|steps) (?:off|in front)|(?:jump|jumping|jumped|jumps) (?:off|from|down|out of|out the|"
                 r"in front|onto the (?:tracks|rail))|(?:throw|throwing) myself|(?:fall|falling) (?:off|from)|(?:let|letting) myself (?:fall|go|slip)|"
                 r"go over the (?:edge|railing)")
_HD_NUOC = _rx_en(r"(?:walk|walking|walked) (?:into|in front)|drown\w*|(?:let|letting) myself (?:fall|go|slip|sink)|(?:throw|throwing) myself|"
                  r"let (?:the )?(?:river|sea|waves|water) take me")
_NGHI_DEN = _rx_en(r"think|thinks|thinking|thought|imagine|imagining|picture|picturing|tempted|tempting|urge|urges|want|wanted|wanna|"
                   r"wish|plan|planning|planned|going to|gonna|ready|feel like|could just|how easy|keep|kept|about to|dream\w*|fantasi[sz]\w*")
_GIAI_TRI = _rx_en(r"bungee|cliff ?div\w*|skydiv\w*|parachut\w*|zip ?lin\w*|base jump\w*|high dive|diving board|swim\w*|pool|fishing|"
                   r"sail\w*|boat\w*|kayak\w*|surf\w*|cruise|trip|holiday|vacation|beach|picnic|wedding|photos?|view|travel\w*|resort|"
                   r"hik\w*|camping|retreat|fireworks")
_KHONG_DAY = (r"(?:not|never|do not|don t|won t|will not|wouldn t|did not|didn t) wake up(?! (?:early|late|on time|in the (?:morning|night)|"
              r"at|for|before|till|until|refreshed|rested|tired|feeling|with|to|in time|again until|properly))")
_Y_MANH = _rx_en(
    r"(?:want|wanna|wish|wishing|feel like|feeling like|felt like|thinking (?:of|about)|dream\w* (?:of|about)|ready|planning|plan|"
    r"need|better if i|i) (?:to )?(?:just )?(?:disappear\w*|vanish\w*|cease to exist|stop existing) (?:forever|for good|permanently|"
    r"from (?:this|the) world|from existence|and never come back)",
    r"(?:want|wanna|wish|hope|hoping|pray|praying|rather|prefer|better if i) (?:to )?(?:just )?(?:sleep and )?(?:i )?" + _KHONG_DAY,
    r"(?:would it|does it|will it|to|it) take to (?:not|never) wake up|enough (?:\w+ )?to (?:not|never) wake up",
    r"(?:i m|i am|im|so|just|completely|totally|really|honestly) done (?:with )?(?:life|living|existing|being alive|this life)"
    r"(?=\s*(?:[,.!?;]|$|anymore|already|tbh|honestly|man|bro|ngl|fr))",
    r"(?:just |better |might as well |may as well |wanna |want to |let me )die already", r"sian until (?:want (?:to )?)?die",
    r"jump down (?:from )?(?:my |the |our )?(?:hdb|block|flat|building|condo)",
    r"mamatay|magpakamatay|nagpakamatay|ayoko na(?:ng)? mabuhay|ayaw ko na(?:ng)? mabuhay|tapusin (?:ko )?na (?:ang )?(?:lahat|buhay ko)|"
    r"patayin (?:ko )?(?:na lang )?(?:ang )?sarili ko",
    r"nak mati|mahu mati|ingin mati|bunuh diri|tak nak hidup|tak mahu hidup|(?:lebih )?baik aku mati|penat (?:nak )?hidup",
    r"(?:end|ending|ended|finish|finishing) (?:my|this) (?:own )?(?:life|existence)(?! (?:as|in|at) )",
    r"(?:i d|i would|i ll|i will) rather be dead")
_C_DAY = _rx_en(_KHONG_DAY)                                         # + thuốc / vật
_C_HET = _rx_en(r"(?:take|taking|took|swallow\w*|down|downing) (?:them|it|those|these) all|(?:take|taking|swallow\w*) all of (?:them|it|those)|"
                r"(?:take|taking|swallow\w*|down|downing) (?:the )?(?:whole|entire) (?:bottle|box|pack|packet|strip|stash|stockpile|lot)")   # + thuốc
_C_END = _rx_en(r"(?:end|ending) (?:it|everything|things)(?: all)?(?! (?:with|between|off|for (?:us|him|her|them)|on a|on good|early|"
                r"today at|now and go))")                           # + mọi phương tiện
_C_MAT = _rx_en(r"disappear\w* (?:forever|for good|permanently)|vanish\w* (?:forever|for good)|one last goodbye|final goodbye|goodbye forever")
_TU_BIET = [
    _rx_en(r"(?:gave|give|giving|given|rehom\w*|found (?:a )?new (?:home|owner)s? for) (?:away )?(?:all )?my (?:cat|cats|dog|dogs|pets?|"
           r"bird|fish|rabbit|hamster|things|stuff|belongings|possessions|savings|guitar|jewel\w*|clothes)(?: away)?"),
    _rx_en(r"(?:wrote|write|writing|written|left|leaving|leave) (?:a |some |my |the )?(?:goodbye |farewell |final )?(?:letters?|notes?) "
           r"(?:to|for) (?:my |all my )?(?:\w+ ){0,2}?(?:family|parents|kids|children|friends|wife|husband|mum|mom|mother|dad|father|"
           r"sister|brother|everyone|everybody|partner)"),
    _rx_en(r"(?:said|say|saying) goodbye to (?:everyone|everybody|all my|my (?:family|friends|parents|kids))|"
           r"(?:paid|paying|pay) off (?:all )?my debts? (?:so|before)|(?:sorted|sorting|wrote|writing|updated) (?:out )?my will (?:so|before)"),
]
_TU_BIET_THUONG = _rx_en(r"declutter\w*|donat\w*|moving|move (?:house|abroad|overseas|out|to)|relocat\w*|emigrat\w*|marie kondo|"
                         r"spring clean\w*|sell\w*|sold|garage sale|minimalis\w*|allerg\w*|new baby|landlord|lease|cny|chinese new year|"
                         r"christmas|tet|new year|birthday|wedding|graduation|anniversary|thank you")
_GAN_DAY = _rx_en(r"lately|recently|these days|nowadays|keeps?|kept|at night|more and more|sometimes|always|again|every (?:day|night)")
_Y_YEU = _rx_en(r"peaceful|calm|calming|quiet|inviting|tempting|so easy|beautiful down there")
# phương tiện "đang gọi mình" — sát phương tiện là đủ khủng hoảng (không cần tín hiệu thứ hai)
_Y_GOI = _rx_en(r"(?:calling|calls|called|keeps calling|been calling) (?:out )?(?:to )?(?:me|my name)")
_VO_DUNG = _rx_en(
    r"(?:i m|i am|im|i feel|feel|feeling|felt|(?:feel|feeling|felt) like|i ve been|calls? me|calling me|called me|says? i m|saying i m|said i m|says? i am|"
    r"think i m|thinks i m|tells? me i m|telling me i m|i m just|i m so|i m nothing but) "
    r"(?:so |completely |totally |just |really |utterly |only )*(?:useless|worthless|pathetic|unlovable|good for nothing|hopeless|"
    r"(?:a |such a |a total |a complete |nothing but a |just a )(?:failure|waste of (?:space|air|life)|disappointment|mistake|loser|burden)|"
    r"nothing|no good)(?! (?:at|in|with|for|of) (?!life|living|everything))",
    r"(?:not|no longer) (?:be )?a burden (?:to (?:anyone|anybody|everyone|everybody|them|my family) |on (?:anyone|everyone|them|my family) )?anymore|"
    r"burden (?:to|on) (?:everyone|everybody|anyone)",
    r"hate (?:myself|my life|being alive|being me)|(?:can t|cannot|can not) (?:go on|do this anymore|take (?:it|this) anymore|"
    r"cope anymore)|(?:no one|nobody|noone) (?:cares about me|cares if i|loves me|needs me|wants me|would care if i)|"
    r"(?:lost|losing|have no|got no) (?:all )?(?:hope|will to live|reason to live)(?! (?:in|of|for) (?!life|living))|"
    r"(?:there is |there s )?no way out(?=\s*(?:[,.!?;]|$))|(?:so )?empty inside|nothing matters (?:anymore|to me)|"
    r"(?:tired|sick|exhausted) of (?:everything|living|life|being me|being alive|existing)|give up on (?:myself|life|living)")
# --- ý làm hại NGƯỜI khác (người nói là chủ thể)
_HAI_DONG = (r"(?:kill|murder|stab|shoot|poison|strangle|choke|beat up|run over|burn|attack|hurt|harm)")
_HAI_DOI = (r"(?:my (?:\w+ ){0,2}(?:husband|wife|partner|boyfriend|girlfriend|ex|father|dad|mother|mom|mum|stepdad|stepfather|stepmom|"
            r"stepmother|step dad|step mom|uncle|aunt|brother|sister|cousin|boss|manager|teacher|coworker|co worker|colleague|neighbou?r|"
            r"landlord|roommate|flatmate|classmate|in laws?|son|daughter|kid|kids|baby|family|supervisor|bully|rival)|"
            r"(?:that|this) (?:\w+ )?(?:guy|girl|man|woman|kid|bastard|bitch|asshole|idiot|coworker|co worker|colleague|neighbou?r|boss|"
            r"teacher|bully)|the (?:\w+ )?(?:guy|girl|man|woman|bastard|bitch|asshole)|him|her|them|someone|somebody|everyone|people)")
_HAI_NGUOI = re.compile(r"(?<!\w)(?:want|wanna|going|gonna|plan|planning|planned|about|ready|decided|intend\w*|tryna|trying|will|ll|"
                        r"gotta|need|thinking (?:of|about)|fantasi[sz]\w* about|dream\w* (?:of|about))(?: to)? (?:really |seriously |"
                        r"just |go )?" + _HAI_DONG + r"(?:ing)? " + _HAI_DOI
                        + r"(?! s(?!\w))(?! (?:a|an|some|the|this) (?:text|message|email|msg|dm|note|line|look|glance|smile|question|call|"
                          r"quick|photo|picture|pic|video|shot)| (?:text|email|message|dm|msg)s?(?!\w))(?!\w)")
_PHU_DINH = re.compile(r"(?<!\w)(?:not|never|don t|do not|won t|will not|wouldn t|would not|didn t|did not|no)(?!\w)")
_TOI = re.compile(r"(?<!\w)(?:i|i m|im|i am|i ll|i d|i ve)(?!\w)")
_DUA_HAI = _rx_en(r"if (?:he|she|they|you|my \w+|it)|for (?:eating|taking|spoiling|being|not|forgetting|leaving|losing|breaking|using|"
                  r"drinking|telling|stealing|finishing|making)|when (?:he|she|they) (?:gets?|finds?|sees?|comes?)")
_THAT_HAI = _rx_en(r"deserves? it|deserve to die|revenge|for real|seriously|serious|not joking|i mean it|tonight|tomorrow|which day|"
                   r"lucky (?:day|date|time)|best (?:day|date|time)|good (?:day|date|time)|when should|knife|gun|weapon|poison|plan|planned|"
                   r"how to|get away with|humiliat\w*|hate (?:him|her|them)|again today|keeps? (?:hitting|abusing|hurting|bullying)")


def _hai_nguoi_khac(k: str) -> bool:
    """Người nói có ý giết / đâm / bắn… một NGƯỜI. Không tính: chủ thể là người khác ("my boss will kill me"), phủ định ("I
    would never hurt him"), thành ngữ (đích không phải người: "kill it", "kill time"), sở hữu ("shoot my sister's wedding"),
    nói đùa / cường điệu ("lol", "if she spoils the ending") — trừ khi câu có dấu hiệu nghiêm túc ("he deserves it",
    "which day", "revenge"…). "hurt / harm / burn / attack" chỉ tính khi có dấu hiệu nghiêm túc."""
    that = bool(_THAT_HAI.search(k))
    for m in _HAI_NGUOI.finditer(k):
        ve = re.split(r"[,.!?;]", k[max(0, m.start() - 50):m.start()])[-1].strip()   # vế trước động từ ý định
        if _PHU_DINH.search(ve):
            continue
        if not _TOI.search(ve) and len(ve.split()) > 2:
            continue                                  # chủ thể không phải người nói ("my boss is going to kill her")
        if re.search(r"(?<!\w)(?:hurt|harm|burn|attack|choke)(?!\w)", m.group(0)) and not that:
            continue
        if (_DUA_RX.search(k) or _DUA_HAI.search(k[m.end():m.end() + 60])) and not that:
            continue
        return True
    return False


def _tin_hieu_en(k: str) -> dict:
    nghi = _cac_vi_tri(_NGHI_DEN, k)
    giai_tri = bool(_GIAI_TRI.search(k))

    def _hd(rx):
        return [] if giai_tri else [p for p in _cac_vi_tri(rx, k) if any(0 <= p - q <= 6 for q in nghi)]
    return {"thuoc": _cac_vi_tri(_PT_THUOC, k), "vat": _cac_vi_tri(_PT_VAT, k), "cao": _cac_vi_tri(_PT_CAO, k) + _cac_vi_tri(_PT_RAY, k),
            "nuoc": _cac_vi_tri(_PT_NUOC, k), "hd_cao": _hd(_HD_CAO), "hd_nuoc": _hd(_HD_NUOC),
            "manh": bool(_Y_MANH.search(k)), "day": _cac_vi_tri(_C_DAY, k), "het": _cac_vi_tri(_C_HET, k),
            "end": _cac_vi_tri(_C_END, k), "mat": _cac_vi_tri(_C_MAT, k),
            "yeu": [] if giai_tri else _cac_vi_tri(_Y_YEU, k), "goi": [] if giai_tri else _cac_vi_tri(_Y_GOI, k), "vo_dung": bool(_VO_DUNG.search(k)),
            "tu_biet": 0 if _TU_BIET_THUONG.search(k) else sum(bool(r.search(k)) for r in _TU_BIET), "hai": _hai_nguoi_khac(k)}


def _khung_hoang_y(k: str) -> bool:
    t = _tin_hieu_en(k)
    if t["manh"] or t["hai"]:
        return True
    thuoc = [] if _nham(k) else t["thuoc"]                 # uống nhầm → cấp cứu (trừ khi có ý chấm dứt mạnh / vô dụng)
    vat, moi = thuoc + t["vat"], thuoc + t["vat"] + t["cao"] + t["nuoc"]
    if _gan(t["day"], vat) or _gan(t["het"], thuoc) or _gan(t["end"], moi) or _gan(t["mat"], moi):
        return True
    if _gan(t["hd_cao"], t["cao"], 10) or _gan(t["hd_nuoc"], t["nuoc"] + t["cao"], 10):
        return True
    if _gan(t["goi"], t["cao"] + t["nuoc"] + vat, 8):   # "the train tracks have been calling me"
        return True
    yeu = [p for p in t["yeu"] if _gan([p], t["cao"] + t["nuoc"] + vat, 8)]
    cuoi = t["day"] + t["het"] + t["end"] + t["mat"]
    if yeu and (t["vo_dung"] or cuoi or t["tu_biet"]):
        return True
    if t["vo_dung"] and (cuoi or t["hd_cao"] or t["hd_nuoc"]):
        return True
    return t["tu_biet"] >= 2 or bool(t["tu_biet"] and (t["vo_dung"] or vat or cuoi))


def _mem_y(k: str) -> bool:
    """Một tín hiệu yếu chưa đủ luật khủng hoảng: tự coi mình vô dụng / gánh nặng / hết hy vọng, một hành vi từ biệt, "trông
    thật bình yên" sát một phương tiện, muốn biến mất mãi, hành động nhảy / bước khi đang nghĩ tới (chưa nói nơi)."""
    t = _tin_hieu_en(k)
    # "bình yên" sát phương tiện chỉ tính khi kèm dấu hiệu lặp lại / gần đây ("lately the river looks peaceful") —
    # "the river near my house looks peaceful, good feng shui?" là câu thường
    yeu = [p for p in t["yeu"] if _gan([p], t["cao"] + t["nuoc"] + t["thuoc"] + t["vat"], 8)] if _GAN_DAY.search(k) else []
    return bool(t["vo_dung"] or t["tu_biet"] or yeu or t["mat"] or (t["hd_cao"] and not _GIAI_TRI.search(k)))


# Uống nhầm / quá liều NGOÀI Ý MUỐN (hai lần, quá nhiều, N viên trong vài giờ) + "nhầm" hoặc triệu chứng → cấp cứu.
_THUOC_UONG = (r"(?:(?:my |his |her |the |some |a few |\d+ |extra |more )?(?:\w+ )?(?:pills?|tablets?|capsules?|meds|medications?|"
               r"medicines?|doses?)|" + _THUOC_TEN + r")")
_QUA_LIEU = _rx_en(
    r"(?:took|taken|take|taking|swallowed|had|gave|given|double dosed|doubled up on) (?:\w+ ){0,4}?" + _THUOC_UONG
    + r"(?: \w+){0,5}? (?:twice|two times|again|double|a second time|two doses)",
    r"(?:took|taken|swallowed|had|gave|given) (?:\w+ ){0,3}?(?:too many|too much|a double dose|two doses|extra|more than (?:the |my )?"
    r"(?:dose|recommended|limit|prescribed))(?: \w+){0,3}? " + _THUOC_UONG,
    r"(?:took|taken|swallowed|had) (?:\w+ ){0,3}?(?:\d+|twelve|ten|eight|fifteen|twenty) (?:\w+ )?" + _THUOC_UONG
    + r"(?: \w+){0,6}? (?:in|within|over) (?:a few|few|\d+|two|three|four|a couple of) hours")
_TRIEU_CHUNG = _rx_en(r"faint\w*|dizzy|dizziness|light ?headed|vomit\w*|throwing up|threw up|nause\w*|sick|unwell|drowsy|sleepy|confused|"
                      r"numb|shaking|shaky|sweating|heart (?:is )?(?:racing|pounding)|palpitations?|stomach (?:pain|ache)|weird|strange|"
                      r"blurry|collaps\w*|can t stay awake")


# EN-ALL GĐ 4: "took like 20 paracetamol by accident" (nhiều viên, không nói "trong mấy giờ") — vẫn là uống nhầm cấp cứu.
_QUA_LIEU_GD4 = _rx_en(r"(?:took|taken|swallowed|had) (?:like |about |around |maybe |almost )?(?:[1-9]\d+|twelve|fifteen|twenty|thirty) "
                       r"(?:\w+ )?" + _THUOC_UONG)


def _qua_lieu_nham(k: str) -> bool:
    return bool((_QUA_LIEU.search(k) or _QUA_LIEU_GD4.search(k)) and (_nham(k) or _TRIEU_CHUNG.search(k)))


# EN-ALL GĐ 4: cấp cứu thai sản (đang mang thai + chảy máu / đau dữ dội) và bỏng nặng (da trắng, bong, cháy đen, phồng lớn).
_CAP_CUU_GD4 = _rx_en(
    # đang xảy ra (thì hiện tại tiếp diễn), không phải hỏi nguy cơ / chuyện đã qua / "stroke of luck"
    r"(?:i m|i am|im|he s|she s|he is|she is|they re|my (?:\w+ ){0,2}is|i think i m|i feel like i m|feel like i m|i think (?:he|she) s) "
    r"(?:\w+ )?having (?:a |an )?(?:heart attack|stroke)(?! of)",
    r"pregnan\w*(?: \d+ weeks?)?\W{0,2} (?:and |with |having |now )?(?:severe|heavy|bad) (?:\w+ ){0,2}(?:pain|bleeding|cramps?)",
    r"(?:i m|i am|im|she s|she is|my (?:wife|partner|sister|daughter|girlfriend) is) (?:\w+ ){0,3}pregnan\w* .{0,30}"
    r"(?:and |now |started )(?:bleeding|having contractions)|(?:my |her )?waters? (?:just )?broke",
    r"burn(?:ed|t|ing)? (?:my|his|her|their) (?:hand|hands|arm|arms|leg|legs|face|foot|feet|skin|fingers?|chest|back|neck) "
    r"(?:\w+ ){0,3}(?:badly|severely)(?! in )|"
    r"burn\w* (?:my|his|her|their) (?:hand|hands|arm|arms|leg|legs|face|foot|feet|skin|fingers?) .{0,50}"
    r"(?:skin (?:is |went |turned )?(?:white|peeling|charred|black|leathery)|huge blisters?)")
# một người KHÁC vừa quá liều / ngưng thở → cấp cứu (gọi cấp cứu ngay), không phải lời hỗ trợ khủng hoảng của người hỏi
_QUA_LIEU_NGUOI_KHAC = _rx_en(r"(?:my (?:\w+ ){0,2}(?:friend|son|daughter|kid|brother|sister|mother|mom|mum|father|dad|husband|wife|"
                              r"partner|roommate|boyfriend|girlfriend)|he|she) (?:has |just |had )?overdosed .{0,40}"
                              r"(?:barely breathing|not breathing|unconscious|unresponsive|not waking|turning blue)")


# GĐ 4: người nói tự phủ định ý tự hại ("not suicidal or anything, just tired of it") — bỏ cụm đó trước khi xét; mọi tín hiệu
# khác trong câu vẫn được xét như thường.
_KHONG_TU_HAI = re.compile(r"(?<!\w)(?:i m |im |i am )?(?<!not )not suicidal(?: or anything| at all| or something)?(?!\w)")
# Review GĐ 4: còn tín hiệu khác (hẹn giờ, "do it", "muốn tất cả kết thúc", "chưa / cho tới giờ / thường thì không / tối
# nay") → không bỏ — "I'm not suicidal yet", "not usually suicidal but tonight I am", "not suicidal, I just want it to end".
_KHONG_TU_HAI_GIU = re.compile(r"(?<!\w)(?:yet|until now|till now|usually|tonight|tomorrow|do it|to end|end it|end everything|"
                               r"kill|die|dying|dead|not not|but)(?!\w)")


def _bo_phu_dinh(kd: str) -> str:
    if not _KHONG_TU_HAI.search(kd):
        return kd
    con = _KHONG_TU_HAI.sub(" ", kd)
    return kd if _KHONG_TU_HAI_GIU.search(con) else con


# ------------------------------------------------------------------ EN-ALL GĐ 5 (hỏi đáp Phong thuỷ tiếng Anh)
# Bộ câu Phong thuỷ viết độc lập lọt các cách nói khủng hoảng gắn với nhà cửa: chủ đích "không tỉnh dậy" đặt sau "so",
# "done trying to live", "meant to die anyway", "I want to be with him soon" (người thân đã mất), người KHÁC nói muốn chết /
# tự hại, đứng ở ban công / cầu "ngay lúc này" sau mất mát, "take all of them" + "peaceful", vật nguy hiểm + "asking for
# reasons", "after I'm gone" + chuẩn bị cho người ở lại, "let it" sau một lời phán chết.
_KHUNG_HOANG_GD5 = _rx_en(
    r"so (?:that )?(?:i )?(?:just |can |will |would )?(?:not|never|do not|won t|will not) wake up(?! (?:early|late|on time|at|tired|"
    r"refreshed|with|for|in the))",
    r"(?:do not|don t|did not|didn t|never) (?:want|wanna|wish) to wake up(?! (?:early|so early|at(?! all)|on time|in the morning|for|"
    r"before|tired|groggy|with))",
    r"(?:peaceful|quiet|calm)\b.{0,40}(?:leave|write) (?:a |my )?(?:note|letter) (?:for|to) (?:my )?(?:family|kids|children|wife|husband|parents)",
    r"(?:done|tired|finished|through) (?:with )?trying to (?:live|stay alive|keep going|keep living|be alive)",
    r"(?:wanting|want|wants|wanted|wish|wishing) to (?:just )?(?:disappear|vanish|cease to exist) (?:forever|for good|permanently)",
    r"(?:meant|supposed|destined|fated|going) to die (?:\w+ ){0,4}(?:anyway|anyways|so why (?:fight|bother|try)|why (?:fight|bother|try))",
    r"(?:maybe|might as well|may as well) (?:it|the beam|the house|this house) (?:should|could|can|will) (?:just )?finish (?:the job|me off|me)",
    r"(?:want|wanna|going|ready|hope|hoping) to (?:be with|join|see) (?:him|her|them) (?:again )?soon",
    r"(?:wish|wishes|wished|wishing) (?:i|he|she|they|i d|he d|she d) (?:had |would have |d )?never (?:been born|existed)",
    r"(?:kill|hurt|harm|cut|cutting|hurting|harming|killing) (?:herself|himself|themselves)",
    r"(?:end|ending|take|taking) (?:his|her|their) (?:own )?life",
    r"(?:make|making) my death (?:painless|quick|peaceful|easy)|(?:painless|quick|peaceful) way to die",
    r"(?:think|thinking|thought) (?:about|of) jumping\b.{0,60}(?:window|balcony|\d+\w* floor|roof|ledge|bridge|building)\b|"
    r"(?:window|balcony|floor|roof|ledge|bridge)\b.{0,60}(?:think|thinking|thought) (?:about|of) jumping(?! (?:into|on|at) (?:the|a) "
    r"(?:market|chance|opportunity|deal|trend|bandwagon))",
    r"(?:can t|cannot|can not|do not|don t) see (?:a|any) way out",
    r"(?:best|right|good|peaceful|quietest|ideal) (?:spot|place|room|corner|direction) (?:in (?:the|my|this) (?:house|home|flat) )?to die",
    r"(?:stop |keep )?wanting to die|(?:i |i still |i just |i really )(?:want|wanna) to die",
    r"not (?:planning on|planning to be|going to be|gonna be) (?:being )?around (?:after|by|for|much longer|anymore|past)",
    r"(?:if|when|after|once) (?:i am|i m|im) gone\b.{0,60}(?:better|improve\w*|happier|luck\w*|take (?:my|the) room|(?:son|daughter|kids|wife|"
    r"husband) (?:take|have|get))",
    r"(?:where|how) (?:should|do|can) i (?:put|hang|tie|hide) (?:the |a |my )?(?:rope|noose)|(?:rope|noose)\b.{0,40}(?:not visible|hidden|"
    r"won t be seen|from the beam)",
    r"how high (?:does|do|is|should|must) (?:the |my |a |this )?(?:balcony|window|floor|roof|ledge|building|bridge)(?! rail\w*| fence\w*)"
    r"\b.{0,40}(?:make sure|be sure|certain)(?!.{0,40}(?:safe|safety|toddler|kid|child|baby|view))",
    r"(?:this is|it s|today is|tonight is) my (?:last|final) (?:week|day|night|month|weekend)(?=\s*(?:[,.!?;]|$))|"
    r"decided (?:this|today|tonight) is (?:the|my) (?:last|end)(?=\s*(?:[,.!?;]|$))",
    r"(?:i |i just |i only )?want (?:everything|it all|all of it|the pain) to (?:stop|end) (?:forever|for good|permanently)?(?=\s*(?:[,.!?;]|$))",
    r"(?:i am|i m) ready to go(?=\s*(?:[,.!?;]|$))",
    r"(?:she|he|they) (?:ll|will|would|is going to|s going to|says she ll|says he ll) (?:jump|kill (?:her|him|them)sel(?:f|ves))",
    r"voices (?:say|said|tell|told|telling|keep telling)|wants? me dead",
    r"make it look like an accident",
    r"charcoal\b.{0,60}(?:tape|airtight|seal\w*|close\w* (?:the|all the) (?:windows|room|door))|most airtight",
    r"(?:take|taking|swallow\w*) (?:them|it|those|these) all\b.{0,60}(?:peaceful|painless|quiet|calm)|"
    r"(?:take|taking|swallow\w*) all of (?:them|it|those)\b.{0,60}(?:peaceful|painless|quiet|calm)",
    r"(?:rope|noose|knife|blade|pills|tablets)\b.{0,60}asking for (?:reasons|no reason|a reason|personal reasons)",
    r"after (?:i am|i m|im) (?:gone|dead|no longer here|not here anymore)\b.{0,60}(?:set (?:it|things|everything|the room) up|"
    r"prepare|get (?:it|things) ready|arrange|for them|for my (?:family|kids|children|wife|husband))",
    r"(?:eats?|kills?|takes?) (?:the )?(?:eldest|oldest|youngest|first) (?:son|daughter|child)\b.{0,80}(?:maybe|might as well) "
    r"(?:i should )?(?:just )?let (?:it|them)(?: (?:happen|take me|have me|win))?\s*(?:[,.!?;]|$)",
)
_DUNG_CAO_NGAY = _rx_en(r"(?:i am|im|i m) (?:standing|sitting|sat|stood|leaning) (?:on|at|over) (?:the |my |a |our )?(?:edge|ledge|railing|parapet|"
                        r"roof|rooftop|balcony|bridge|window ?sill|top floor)(?: \w+){0,4} (?:now|right now|tonight)")
_MAT_MAT = _rx_en(r"(?:wife|husband|partner|girlfriend|boyfriend) (?:left|is gone|walked out)|(?:business|company|marriage|life|everything) "
                  r"(?:collapsed|fell apart|is gone|failed|is over)|lost (?:everything|the house|my house|my home|my job|it all)|"
                  r"nothing (?:left|helps)|no (?:hope|way out)")
_CAU_DUNG = _rx_en(r"(?:bridge|ledge|cliff|tracks|railway|river|overpass|flyover)\b.{0,40}(?:wanting|want|urge|tempted|wish\w*) to "
                   r"(?:stop|pull over|get out|jump|step)")


def _khung_hoang_gd5(k: str) -> bool:
    if _KHUNG_HOANG_GD5.search(k):
        return True
    if _DUNG_CAO_NGAY.search(k) and _MAT_MAT.search(k):
        return True
    return bool(_CAU_DUNG.search(k) and _GAN_DAY.search(k))


# Nguy hiểm đang xảy ra TRONG NHÀ (rò gas, báo khí CO, khói / mùi khét từ ổ điện, cháy, nước tràn vào ổ điện, trần nứt
# võng, lan can lỏng có trẻ nhỏ) → coi như cấp cứu: ra ngoài / ngắt điện / gọi cứu hộ — không đọc phong thuỷ.
_NHA_NGUY = _rx_en(
    r"(?:smell|smells|smelling|smelt|smelled) (?:of )?(?:gas|burning|smoke)|gas (?:leak|leaking|is leaking|smell)|leaking gas",
    r"(?:co|carbon monoxide|smoke|fire|gas) (?:alarm|detector|sensor)s? (?:\w+ ){0,2}(?:beep\w*|going off|went off|goes off|sounding|ringing|"
    r"keeps (?:beeping|going off))",
    r"(?:smoke|sparks?|flames?) (?:\w+ ){0,2}(?:coming|came|pouring) (?:out )?(?:from|of|out of)|(?:sparks?|sparking) (?:from|in|at) (?:the )?"
    r"(?:plug|socket|outlet|wire|wiring|switch)",
    r"burning(?: \w+)? smell|smell of burning|(?:is |it s |are |keeps )sparking|smoke (?:is )?filling|full of smoke|filled with smoke",
    r"fire (?:started|broke out|is spreading|spread)(?! in the (?:fireplace|fire pit|grill|bbq|stove|oven))|started a fire|earthquake|(?:house|building|floor) is shaking",
    r"(?:on fire|caught fire|catching fire|set (?:\w+ ){0,3}on fire|is burning|are burning|house fire|kitchen fire)",
    r"water (?:\w+ ){0,3}(?:in|into|through|from|pouring through|coming out of) (?:the |an |my )?(?:electrical |power |plug )?(?:socket|outlet|"
    r"sockets|outlets|switch|fuse ?box|wiring)",
    r"(?:ceiling|roof|wall)(?: \w+){0,4} (?:is |are )?(?:\w+ )?(?:cracking|sagging|caving|collapsing|collapsed|caved in|bulging|"
    r"coming down|falling|fell in)",
    r"flood\w*\b.{0,60}(?:power|electric\w*|sockets?|outlets?|wiring)|water\b.{0,30}coming in\b.{0,40}(?:power|electric\w*)",
    r"(?:fell|fallen|collapsed|falls)\b.{0,40}(?:not moving|isn t moving|is not moving|won t wake|not responding|unresponsive)",
    r"(?:railing|balustrade|banister|handrail) (?:is |are )?(?:loose|broken|wobbly|coming off)",
    r"(?:headache|dizz\w*|nause\w*|vomit\w*|drowsy)\b.{0,80}(?:gas heater|heater|boiler|generator|stove|fireplace|charcoal)|"
    r"(?:gas heater|heater|boiler|generator|charcoal)\b.{0,80}(?:headache|dizz\w*|nause\w*|vomit\w*|drowsy)",
)
_NUOT_VAT = _rx_en(r"(?:toddler|baby|child|kid|son|daughter) (?:\w+ ){0,2}(?:drank|swallowed|ate|chewed)\b.{0,60}(?:vomit\w*|throwing up|"
                   r"threw up|choking|drowsy|unconscious|coughing|not breathing)",
                   r"(?:kid|child|toddler|baby|son|daughter|he|she) (?:\w+ ){0,3}(?:swallowed|choking on|choked on|ate) (?:\w+ ){0,8}?"
                   r"(?:crystals?|stones?|beads?|marbles?|coins?|magnets?|batter(?:y|ies)|gem\w*|pebbles?|pieces?)")


def nha_nguy_hiem(raw: str) -> bool:
    """Nguy hiểm đang xảy ra trong nhà (câu tiếng Anh) — xem `_NHA_NGUY`. Câu tiếng Việt → False (bản Việt không đổi)."""
    if not _la_en(raw):
        return False
    k = _sua_en(_hai_ban(raw)[1])
    return bool(_NHA_NGUY.search(k))


# Từ chối (câu tiếng Anh): chọn giới tính thai, tuyển người theo năm sinh, đoán bạn đời ngoại tình, dùng phong thuỷ / gương /
# dao làm hại người khác.
_TU_CHOI_GD5: list[tuple[re.Pattern, str]] = [
    (_rx_en(r"(?:pregnant|conceive|have) (?:with )?(?:a )?(?:baby )?(?:boy|girl)\b|(?:boy|girl) (?:baby|child) (?:\w+ ){0,3}(?:room|direction|bed)"),
     "suc_khoe_the_chat"),
    (_rx_en(r"(?:hire|hiring|recruit\w*|employ\w*|reject\w*|avoid hiring|only hire)\b.{0,60}(?:birth years?|born in|year of the|zodiac|"
            r"animal signs?|kua)|(?:birth years?|zodiac|year of the \w+)\b.{0,40}(?:hire|hiring|employees?|staff|tenants?|applicants?)"),
     "ngoai_pham_vi"),
    (_rx_en(r"(?:tell|know|see|show|find out|reveal)\b.{0,30}(?:if|whether) (?:my )?(?:husband|wife|partner|boyfriend|girlfriend|he|she) "
            r"(?:is |s )?(?:cheating|unfaithful|having an affair)"), "ngoai_pham_vi"),
    (_rx_en(r"so (?:that )?(?:the |my )?(?:person|people|neighbou?rs?|ex|boss|they|he|she|family)\b.{0,40}(?:gets? sick|get ill|"
            r"bad luck|suffers?|fails?|dies?|loses?)|(?:mirror|knife|blade|cannon|arrow)\b.{0,50}(?:so (?:that )?)?(?:my |the )?"
            r"(?:ex|neighbou?r|boss|rival)\w* (?:s )?(?:\w+ ){0,3}(?:gets?|has|have) (?:bad luck|sick|ill)|"
            r"(?:curse|hex|jinx) (?:my|the|our|that) (?:neighbou?r|ex|boss|rival|landlord|colleague)"), "ngoai_pham_vi"),
]


def _tu_choi_gd5(k: str) -> str | None:
    for rx, loai in _TU_CHOI_GD5:
        if rx.search(k):
            return loai
    return None


def _khung_hoang_anh(kd: str) -> bool:
    kd = _bo_phu_dinh(kd)
    k = _sua_en(kd)
    for i, rx in enumerate(KHUNG_HOANG_ANH):
        if any(rx.search(t) for t in (kd, k)):
            # nhảy bungee / lặn vách đá / nhảy cầu ở bể bơi: bỏ cụm "jump off …" rồi xét lại
            if i == 0 and _NHAY_GT.search(k) and not any(rx.search(_NHAY.sub(" ", t)) for t in (kd, k)):
                continue
            # GĐ 3d: quá liều NGOÀI Ý MUỐN ("took too many pills by accident") → cấp cứu, trừ khi câu có dấu hiệu khủng hoảng khác
            if i == 3 and _nham(k) and not any(r.search(k) for j, r in enumerate(KHUNG_HOANG_ANH) if j != 3):
                continue
            # GĐ 4: người KHÁC quá liều, đang ngưng thở → cấp cứu (bộ cấp cứu bắt), không phải khủng hoảng của người hỏi
            if i == 3 and _QUA_LIEU_NGUOI_KHAC.search(k) and not any(r.search(k) for j, r in enumerate(KHUNG_HOANG_ANH) if j != 3):
                continue
            return True
    if any(a.search(k) and b.search(k) for a, b in _KHUNG_HOANG_KEP + _KHUNG_HOANG_KEP_3D):
        return True
    if _HAI_CON.search(k) and (not _DUA_RX.search(k) or _THAT.search(k)):
        return True
    if _KHONG_CON_O_DAY.search(k) and not _CHUYEN_DI.search(k):
        return True
    if _CHO_DO.search(k) and not _CHO_DO_THUONG.search(k):
        return True
    if (_DOA_GIET.search(k) or _DOA_GIET_2.search(k)) and (not _DUA_RX.search(k) or _THAT.search(k)):
        return True
    if _khung_hoang_gd5(k):             # EN-ALL GĐ 5
        return True
    return _khung_hoang_y(k)            # GĐ 3d vòng 4: nhận theo nhóm tín hiệu


# --- từ chối theo NGHĨA (đồng xuất hiện trong câu hỏi), bổ sung cho các mẫu cụm ở trên
_CAU_HOI_EN = re.compile(r"(?<=[?])\s+|(?<=[.!])\s+")
_CHET_TOI = _rx_en(r"die|dies|pass away|passes away|be dead|fatal (year|age)|death (year|date|age|day|time)|year of (?:my |his |her )?death|"
                   r"the year (?:i|he|she) (?:will )?die|lifespan|life span|life expectancy|longevity|early death|die young|short life|"
                   r"life .{0,20}short|live (?:to|until|till|past|beyond|long enough to) (?:see|be|\d+|old|a hundred|reach)|live long|"
                   r"(?:years?|months?) (?:(?:do|does|did|will) (?:i|he|she|they|my \w+) )?(?:have|has|hv|got) left|"
                   r"(?:years?|months?) left to live|(?:has|have|hv|got) (?:only )?(?:\w+ ){0,3}(?:years?|months?) left|"
                   r"how long .{0,25}(?:live|have left|got left|has left)(?! (?:in|of|on) (?:this|my|the))|how long (?:i|he|she) (?:got|have) left|"
                   r"how much longer .{0,25}(?:live|have|got)|what age .{0,20}live to|live to what age|how old will (?:i|he|she) (?:live|get) to|"
                   r"kick the bucket|my time (?:is up|will come|comes)|(?:age|year) (?:i|he|she) (?:will )?(?:die|pass)|reach (?:the age of )?\d{2,3}(?! (?:followers|subscribers|k|clients))|make it past \d+|live through (?:this|the|next) (?:year|month|winter|week|night)|"
                   r"(?:survive|recover from|pull through|make it through) (?:the |his |her |my |this )?(?:operation|surgery|cancer|"
                   r"illness|disease|treatment|chemo|stroke|heart attack|coma|accident|tumou?r)|"
                   r"(?:my \w+(?: \w+)?|he|she|i) (?:can |will |gonna |going to |is going to )?pass (?:away|on)(?! (?:the|my|an?) (?:exam|test|interview|message))|"
                   r"(?:my )?(?:ah ma|ah gong|ah po|grandma|grandpa|grandmother|grandfather|granny|nana|old (?:mother|father|man|lady)) "
                   r"(?:can |will |gonna |going to |is going to )?pass (?:this year|soon|before|already)|"
                   r"(?:when|before|after) (?:i|he|she|my \w+) (?:will )?go(?=\s*(?:[,.!?;]|$))")
# Sống / qua khỏi trong ngữ cảnh bệnh nặng ("my dad gonna make it or not? doctor say 50 50")
_QUA_KHOI = _rx_en(r"make it|live through|survive|pull through|wake up from (?:his|her|the|a|my) coma|come out of (?:the |his |her )?coma|"
                   r"recover|get better")
_BENH_NANG = _rx_en(r"doctors?|doc|hospital|sick|icu|coma|surgery|operation|cancer|illness|ill|dying|stroke|chemo|tumou?r|ventilator|"
                    r"palliative|hospice|50 50|terminal|critical|intensive care")
_CHET_CUA = _rx_en(r"(?:predict|calculate|tell|see|know|show|find) (?:me )?(?:my|his|her|their|the) death|"
                   r"(?:my|his|her|their) death .{0,20}(?:when|year|age|date|soon|will|how|predict|show)|"
                   r"(?:when|what year|which year|how soon) .{0,25}(?:my|his|her|their) death|"
                   r"(?:i|he|she|they) (?:will|gonna|going to|might) (?:die|be dead)(?! (?:of|from) (?:laughter|embarrassment|boredom|curiosity))")
_CHET_SAU = _rx_en(r"after|since|cope|coping|grief|griev\w*|anniversary|mourn\w*|funeral|memorial|honou?r|passed|last (?:year|month|week)")
_CHET_THANH_NGU = _rx_en(r"dying to|die for|to die for|die (?:of|from) (?:laughter|laughing|embarrassment|boredom|curiosity|shame|cuteness)|"
                         r"death card|dead end|dead tired|dead to me|(?:dye|die) (?:my|her|his|your) hair|die hard|do or die|never die|the die is cast|"
                         r"die is cast|(?:plants?|flowers?|phone|battery|car|laptop|computer|business|company|startup|hopes?|dreams?) .{0,15}die|"
                         r"(?:luck|pillar|period|phase|contract|lease|loan|visa|cycle) .{0,15}left|pass (?:the|my|an?) (?:exam|test|interview|course)")
_CHET_HOI = _rx_en(r"will|when|which|what|predict|is there|is this|is it|might|going to|gonna|chart|bazi|show|shows|tell|can you|does|how|"
                   r"or not|anot|do you think|can")
_BAC = _rx_en(r"casino|casinos|gambl\w*|betting|roulette|baccarat|blackjack|slot machines?|slots|4d|toto|mark six|powerball|"
              r"mega ?millions|euro ?millions|lotto|4 d|mark 6|big sweep|keno|football pools|scratch(?:ies| (?:card|cards|ticket|tickets|off))|"
              r"horse racing|sports bet\w*|football bet\w*|"
              r"(?:place|placing|make|making) (?:a |my )?bets?|bet (?:on|for) (?:a |the |which )?(?:horse|horses|team|race|match|game|football|"
              r"soccer|numbers?|sports|cards|dice|red|black)|bet (?:money|tonight|tomorrow|big)|"
              r"(?:put|putting|place|placing) (?:money|cash|my savings|\$?\d+ ?k?) on (?:the )?(?:horses?|races?|a team|the game|the match|red|black|\d+)|"
              r"on the horses|at the races|"
              r"(?:win|winning|won|luck|lucky)(?: big| money| much| a lot)? (?:at|in|on|for) (?:mahjong|poker|cards|the casino|the races|gambling|betting)|"
              r"mahjong .{0,20}(?:win|luck|lucky|money)|poker .{0,20}(?:win|luck|lucky|tonight|money)|"
              r"(?:numbers?|digits) .{0,20}(?:come out|be drawn|drawn|draw)|next draw|"
              r"lottery(?! (?:job|offer|of (?:life|birth))| visa| housing)")
_BAC_KHONG = _rx_en(r"genetic lottery|visa lottery|housing lottery|a gamble (?:to|on|if)|take a gamble|is (?:it|this) a gamble|"
                    r"gamble on (?:myself|me|my (?:career|business|dream))|i bet\b|lost a bet|bet on myself")
_BENH_HOI = _rx_en(r"cancer|tumou?rs?|lumps?|diabetes|diabetic|thyroid|lupus|adhd|autism|autistic|bipolar|depression|"
                   r"schizophreni\w*|ocd|ptsd|dementia|alzheimer\w*|parkinson\w*|a stroke|heart (?:disease|attack|failure|condition)|"
                   r"(?:high )?blood pressure|high blood|blood sugar|hypertension|hiv|aids|stds?|stis?|hepatitis|"
                   r"(?:kidney|liver|lung|heart|stomach|thyroid|mental health) (?:disease|failure|stones?|problems?|issues?|condition)|"
                   r"liver (?:disease|cirrhosis)|diabeetes|diebetes|cancr|mental illness|cirrhosis|asthma|epilepsy|arthritis|infertil\w*|endometriosis|pcos|covid|"
                   r"leuka?emia|lymphoma|psoriasis|ulcers?|gout|osteoporosis|glaucoma|disease|diseases|illness|sickness|"
                   r"get sick|fall ill|seriously ill")
_BENH_VE = _rx_en(r"have|has|having|get|getting|got|develop\w*|show|shows|showing|mean|means|sign of|reason|cause|caused|about|trust|"
                  r"doctor|serious|is (?:my|it|this|that|the)|are (?:they|these|my)|"
                  r"prone|risk|likely|chance|going to|gonna|will|am i|do i|is it|is this|diagnos\w*|prevent|benign|malignant|"
                  r"predict|according to|based on|tell|confirm|indicate")
_BENH_HO_TRO = _rx_en(r"support (?:her|him|them|my)|(?:encourage|motivate|cheer up|remind|visit|look after) (?:her|him|them)|be strong for|help (?:her|him|them)|care for (?:her|him|them)|take care of (?:her|him|them)|"
                      r"comfort (?:her|him|them)|cope|be there for|not asking (?:for )?medical|room (?:more )?comfortable|"
                      r"understand (?:his|her|their) personality|honou?r|memory|grief")
_MO = _rx_en(r"surgery|operation|chemo\w*|radiotherapy|radiation therapy|transplant|biopsy|c section|caesarean|cesarean|dialysis|vaccin\w*|"
             r"ivf|iui|egg freezing|abortion|terminat\w* (?:the |my |a |her |this |our )?pregnancy|end (?:the |my |this |a |our )pregnancy|"
             r"keep the (?:baby|pregnancy)")
_MO_HOI = _rx_en(r"should|go ahead|go for|refuse|skip|delay|postpone|cancel|safe|succeed|success|successful|go well|survive|work|"
                 r"or not|anot|need to|do i need|necessary|"
                 r"good (?:day|date|month|time|year) (?:for|to)|best (?:day|date|month|time) (?:for|to)|according to|based on|chart|bazi")
_MO_KHONG = _rx_en(r"recovery celebration|business operations?|military operation|company operations?")
_THAI = _rx_en(r"(?:baby|unborn|fetus|foetus|pregnancy|bump) .{0,20}(?:is|be|will be|going to be) (?:a )?(?:boy|girl)|"
               r"(?:is|will) (?:it|she|he) be a (?:boy|girl)|(?:is|will) (?:my |our |the )?(?:unborn )?(?:baby|fetus|foetus|bump) (?:be )?(?:a )?(?:boy|girl)|"
               r"(?:am i|if i m|if i am|whether i m|whether i am|is she|if she is|whether she is) pregnant|pregnancy test|"
               r"baby .{0,15}(?:be |born )+(?:healthy|sick|ok|okay|normal|disabled|fine)|"
               r"miscarr\w*|stillbirth")
_THAI_HOI = _rx_en(r"will|can|could|when|which|chance|able|going to|gonna|ever|or not|predict|show|is|am i")
_NHAN_SU_RX = _rx_en(r"candidates?|applicants?|interns?|staff|employees?|workers?|assistants?|accountants?|nanny|nannies|maids?|"
                     r"domestic helpers?|new hires?|hires|recruits?|team members?|job seekers?|cvs?|resumes?|interviewees?|suppliers?|"
                     r"contractors?|vendors?|tenants?|investors?|co ?founders?|business partners?|subordinates?|"
                     r"(?:my |the |our )workers?|sales ?(?:people|staff|team)")
_LA_SO_HO_RX = _rx_en(r"(?:bazi|charts?|birth charts?|day masters?|elements?|zodiacs?|birth ?dates?|horoscopes?|numerology|life paths?) "
                      r"(?:of|for) (?:the |my |our |these |those |all |each |every |potential |new |some )?(?:\w+ )?(?:candidates?|applicants?|"
                      r"staff|employees?|workers?|interns?|hires?|team members?)|"
                      r"(?:their|his|her|staff s|employee s|employees s|candidate s|candidates s|applicant s|hire s|worker s|intern s|"
                      r"nanny s|people s) (?:\w+ )?(?:bazi|charts?|birth charts?|day masters?|elements?|zodiacs?|signs?|life paths?|"
                      r"numbers|horoscopes?|birth ?dates?|birthdays?|four pillars)|born in|born (?:19|20)\d\d|birth (?:dates|charts|days)|"
                      r"birthdates|birthdays|best (?:bazi|chart|day master|element|zodiac)|by (?:their )?(?:day master|zodiac|bazi|chart|element)|"
                      r"(?:zodiac|element|day master|chart|bazi|lp|life path|sign)s? (?:clash\w*|is bad|are bad|bring bad luck)|"
                      r"luckiest|most lucky|luckier|"
                      r"(?:employee|staff|candidate|applicant|worker|intern|nanny|hire)s? (?:bazi|charts?|zodiacs?|day masters?|elements?|birthdays?)")
_QUYET = _rx_en(r"which|who|best|rank|ranking|pick|choose|select|screen|filter|reject|hire|hiring|fire|firing|promote|promotion|"
                r"good fit|fit|suitable|right person|good choice|go with|take on|recruit\w*|"
                r"let go|lay off|sack|dismiss|trust|trustworthy|loyal|check|keep|shortlist|okay to|ok to")


# Dự đoán cụ thể ngoài phạm vi (bản Việt: "giá vàng", "đội nào thắng", "mấy đứa con", "tên gì") — giá, kết quả trận / bầu cử,
# số con, tên / ngày cụ thể của người sẽ gặp.
_DU_DOAN = _rx_en(r"(?:gold|bitcoin|btc|crypto|stock|stocks|share|shares|property|house|housing|oil|forex|usd|dollar) prices? "
                  r"(?:will|going to|gonna|next|in \d{4}|this year|tomorrow|go up|rise|fall|crash|drop)|"
                  r"will (?:gold|bitcoin|the stock market|the market|property prices|house prices|crypto|my stocks?|the (?:dollar|yen|ringgit)) "
                  r"(?:go up|rise|fall|crash|drop|recover|moon)|(?:which|what) (?:stocks?|coins?|crypto|shares) (?:to|should i|will) (?:buy|go up|moon)|"
                  r"(?:which|what) team (?:will )?win|who (?:will|is going to|gonna) win (?:the )?(?:match|game|election|world cup|league|final|"
                  r"cup|race|fight|derby|premier league)|"
                  r"how many (?:children|kids|kid|babies|sons|daughters) (?:will|am going to|would) (?:i|we|she)|"
                  r"(?:name|initials?|first letter) of my (?:future )?(?:husband|wife|spouse|soulmate|partner|boyfriend|girlfriend)|"
                  r"(?:what|which) (?:will|is) my (?:future )?(?:husband|wife|spouse|soulmate) s? ?name|"
                  r"exact (?:date|day|month|year) (?:i will|when i will|of my|that i will|i ll)")
# Yểm bùa / nguyền người khác (bản Việt TU_CHOI_THEM "yểm bùa") — từ chối; hỏi nhà mình có bị yểm thì là chuyện tâm linh khác.
_YEM = _rx_en(r"(?:put|cast|place|send) (?:a |an )?(?:curse|hex|spell|jinx|black magic) on (?!me\b|my house|my home|us\b)\w+|"
              r"(?:bring|send|cause|give|wish) (?:bad luck|misfortune|harm|illness|sickness|bad things|disaster|bad energy) "
              r"(?:to|on|upon|for|onto) (?:him|her|them|someone|somebody|(?:my|our|his|her|that|this) (?:\w+ )?(?:rival|enemy|enemies|ex|boss|"
              r"neighbou?r|colleague|coworker|competitor|husband|wife|sister|brother|friend|cousin|mother in law|father in law|in laws|"
              r"landlord|teacher|classmate|girl|guy|woman|man|family))|"
              r"(?:ritual|spell|charm|curse|hex|talisman|black magic)s? (?:to|that will|that can|for|which will) (?:harm|hurt|punish|ruin|destroy|"
              r"break (?:them |him |her )?up|curse|make (?:him|her|them) (?:sick|suffer|fail|leave|lose))|"
              r"(?:curse|hex|jinx) (?:him|her|them|my (?:ex|boss|neighbou?r|enemy|rival|colleague|coworker|husband|wife|mother in law))|"
              r"black magic (?:on|against|to hurt|to make)|make (?:him|her|them) (?:suffer|pay|sick|fail) (?:with|using|by) (?:a )?(?:spell|curse|ritual|charm)|"
              r"love spell (?:on|to make)|spell to make (?:him|her|them)")


# Tên bệnh chỉ nơi làm việc / tổ chức ("cancer ward", "cancer research") không phải câu hỏi có bệnh.
_BENH_NOI = re.compile(r"\s{0,5}(?:ward|unit|hospital|centre|center|research|charity|patients?|survivors?|awareness|foundation|clinic|"
                       r"department|nurse|doctor|specialist|society|fundrais\w*|walk|run)(?!\w)")


def _hoi_benh_anh(c: str) -> bool:
    """Câu hỏi có / sẽ mắc bệnh: tên bệnh + động từ hỏi (có, mắc, cho thấy, nghĩa là…) trong khoảng 45 ký tự quanh nó."""
    for m in _BENH_HOI.finditer(c):
        if _BENH_NOI.match(c, m.end()):
            continue
        if _BENH_VE.search(c[max(0, m.start() - 45):m.end() + 45]):
            return True
    return False


def _tung_cau(k: str) -> list[str]:
    cac = [c for c in _CAU_HOI_EN.split(k) if c.strip()]
    hoi = [c for c in cac if c.rstrip().endswith("?")]
    return hoi or [k]


# Đọc / phán xét NGƯỜI THỨ BA không có mặt (bản Việt: "đọc người khác cần sự đồng ý của họ"): nói rõ đọc lén ("secretly",
# "without telling her") hoặc lấy ngày sinh / lá số của đồng nghiệp, hàng xóm, người yêu cũ… để phán chuyện riêng của họ
# (ngoại tình, nói dối, ly hôn, còn yêu không) → từ chối. Câu về chồng / vợ / người yêu trong quan hệ của chính người hỏi
# ("will my husband cheat on me") không thuộc nhóm này.
_LEN = _rx_en(r"secretly|in secret|without (?:telling|asking|letting|informing) (?:him|her|them)|without (?:his|her|their) (?:knowledge|consent|"
              r"permission|knowing)|behind (?:his|her|their) back|(?:he|she|they) (?:will not|won t|must not|does not|doesn t|never) "
              r"(?:know|find out)|(?:do not|don t|not) tell (?:him|her|them)")
_NGUOI_NGOAI = _rx_en(r"(?:co ?workers?|colleagues?|neighbou?rs?|classmates?|roommates?|flatmates?|boss|manager|"
                      r"ex|ex (?:boyfriend|girlfriend|husband|wife|partner)|ex ?girlfriend|ex ?boyfriend|(?:sister|brother|mother|father|"
                      r"daughter|son) in law|friend s (?:husband|wife|boyfriend|girlfriend|partner)|crush|stranger|celebrity|landlord|tenant|"
                      r"employee|employer|teacher|student|cousin s (?:husband|wife))")
_PHAN_XET = _rx_en(r"cheat\w*|affair|lying|lies|lie to|liar|steal\w*|stole|betray\w*|divorc\w*|still (?:love|loves|like|likes|think|thinks)"
                   r"(?: about)? me|gay|pregnant|hiding (?:something|money)|in debt|faithful|loyal|seeing someone|sleeping with")
_LA_SO_NGUOI = _rx_en(r"(?:his|her|their|\w+ s) (?:bazi|chart|charts|day master|birth ?date|birthday|elements?|pillars?|horoscope)|"
                      r"(?!i\b)\w+ (?:was|were|is) born|born (?:on|in) .{0,25}(?:tell|is|will|does)|"
                      r"(?:read|check|look at|analy[sz]e) (?:his|her|their)")


# Dùng lá số của người khác để HẠI họ ("find his weak year so I can get him sacked") — từ chối (GĐ 3d vòng 4).
_HAI_QUA_LA_SO = _rx_en(r"(?:get|got|have) (?:him|her|them) (?:sacked|fired|demoted|dumped|kicked out|in trouble)|"
                        r"(?:bring|take) (?:him|her|them) down|(?:ruin|destroy|sabotage) (?:him|her|them|his|her|their)|"
                        r"(?:revenge|payback) on (?:him|her|them)|weak (?:year|point|spot|time|month)s? (?:to|so)")


def _doc_nguoi_khac(k: str) -> bool:
    if _LEN.search(k) and (_LA_SO_NGUOI.search(k) or _NGUOI_NGOAI.search(k)):
        return True
    if _LA_SO_NGUOI.search(k) and _HAI_QUA_LA_SO.search(k):
        return True
    return bool(_NGUOI_NGOAI.search(k) and _PHAN_XET.search(k) and _LA_SO_NGUOI.search(k))


def _tu_choi_nghia(k: str) -> str | None:
    # thành ngữ ("dying to know", "Death card") bỏ trước — câu thật đứng cạnh thành ngữ vẫn bị bắt
    if _CHET_TOI.search(_CHET_THANH_NGU.sub(" ", k)) and _CHET_HOI.search(k):
        return "du_doan_cu_the"
    if _CHET_CUA.search(_CHET_THANH_NGU.sub(" ", k)) and not _CHET_SAU.search(k):
        return "du_doan_cu_the"
    if _QUA_KHOI.search(k) and _BENH_NANG.search(k) and re.search(r"(?<!\w)(my \w+|he|she|they|him|her)(?!\w)", k) and \
            re.search(r"(?<!\w)(will|gonna|going to|or not|anot|can|chance|do you think)(?!\w)", k):
        return "du_doan_cu_the"
    if re.search(r"(?<!\w)(?:liver|kidneys?|heart|lungs?|organs?) (?:is |are )?(?:going to |gonna |will |about to )?fail", k):
        return "suc_khoe_the_chat"
    if _BAC.search(k) and not _BAC_KHONG.search(k):
        return "may_rui"
    if _DU_DOAN.search(k):
        return "du_doan_cu_the"
    if _YEM.search(k) or _doc_nguoi_khac(k):
        return "ngoai_pham_vi"
    for c in _tung_cau(k):
        if _hoi_benh_anh(c) and not _BENH_HO_TRO.search(k):
            return "suc_khoe_the_chat"
        if _MO.search(c) and _MO_HOI.search(c) and not _MO_KHONG.search(c):
            return "suc_khoe_the_chat"
        if _THAI.search(c) and _THAI_HOI.search(c):
            return "suc_khoe_the_chat"
    if _NHAN_SU_RX.search(k) and _LA_SO_HO_RX.search(k) and _QUYET.search(k):
        return "ngoai_pham_vi"
    if _NHAN_SU_RX.search(k) and re.search(r"(?<!\w)(dishonest|honest|steal\w*|stole|cheat\w*|trustworthy|loyal|betray\w*|lazy|"
                                           r"lying|liar|embezzl\w*|quit on me|leave me)(?!\w)", k) and \
            re.search(r"(?<!\w)(which|who|is|are|will|would|does|can)(?!\w)", k):
        return "ngoai_pham_vi"          # bản Việt "ai trung thực", "nhân viên … trung thực / giữ / chọn"
    return None


def _cap_cuu_anh(kd: str) -> bool:
    k = _sua_en(kd)
    if _CAP_CUU_ANH.search(k) or _CAP_CUU_ANH.search(kd) or _CAP_CUU_GD4.search(k):
        return True
    if _qua_lieu_nham(k):                # GĐ 3d vòng 4: uống nhầm / quá liều ngoài ý muốn
        return True
    if _NHA_NGUY.search(k) or _NUOT_VAT.search(k):     # EN-ALL GĐ 5: nguy hiểm trong nhà, trẻ nuốt vật nhỏ
        return True
    return bool(_TAI_NAN_NGAY.search(k) and _TAI_NAN_NANG.search(k) and not _DA_QUA.search(k))


def _tu_choi_anh(kd: str) -> str | None:
    k = _sua_en(kd)
    if _cap_cuu_anh(kd):
        return "suc_khoe_the_chat"
    if _THAN_BENH_ANH.search(k):          # tiên lượng bệnh của người thân ("will she recover") → nhóm sức khoẻ người thân
        return "suc_khoe_the_chat"
    for rx, loai in TU_CHOI_ANH:
        if rx.search(k) or rx.search(kd):
            return loai
    if _CHON_MEM.search(k) and re.search(r"(?<!\w)" + _NHAN_SU + r"(?!\w)", k) and re.search(r"(?<!\w)" + _LA_SO_HO + r"(?!\w)", k):
        return "ngoai_pham_vi"
    return _tu_choi_gd5(k) or _tu_choi_nghia(k)       # EN-ALL GĐ 5


def ho_tro_mem_en(raw: str) -> bool:
    """Tầng hỗ trợ MỀM (câu tiếng Anh): một tín hiệu buồn yếu (`_mem_y`) mà câu KHÔNG phải khủng hoảng / cấp cứu → câu hỏi
    vẫn được trả lời, kèm đoạn hỗ trợ ngắn (`loi_ho_tro_mem`). Câu tiếng Việt → False (bản Việt không đổi)."""
    if _nn.an_toan(raw) == "ho_tro_mem" and not khung_hoang(raw) and not cap_cuu(raw):
        return True               # EN-AI: nhãn ngoài nâng câu bình thường lên tầng mềm
    if not _la_en(raw):
        return False
    kd = _hai_ban(raw)[1]
    if _khung_hoang_anh(kd) or _cap_cuu_anh(kd):
        return False
    return _mem_y(_sua_en(kd))


def loi_ho_tro_mem() -> str:
    """Đoạn hỗ trợ mềm theo ngôn ngữ lượt gọi (mẫu câu `an_toan_mem.ho_tro`, kb/data/en/loi/an_toan_mem.json)."""
    from app.kb.loi import L  # noqa: PLC0415
    return L("an_toan_mem.ho_tro", (
        "Nghe như dạo này bạn đang mang một điều khá nặng. Bạn không phải gỡ một mình: nói với một người bạn tin, hoặc gọi "
        "đường dây hỗ trợ miễn phí, bảo mật. Nếu có lúc bạn nghĩ tới chuyện làm hại bản thân, hãy gọi 115 hoặc tới cơ sở y tế "
        "gần nhất."))


def khung_hoang_en(raw: str) -> bool:
    kd = _hai_ban(raw)[1]
    return _khung_hoang_anh(kd) if _la_en(raw) else _en(kd, KHUNG_HOANG_EN)


def tu_choi_en(raw: str) -> str | None:
    if _la_en(raw):
        return _tu_choi_anh(_hai_ban(raw)[1])
    kd = _hai_ban(raw)[1]
    if _CAP_CUU_EN.search(kd):
        return "suc_khoe_the_chat"
    for m, loai in TU_CHOI_EN:
        if re.search(r"(?<!\w)(?:" + m + r")(?!\w)", kd):
            return loai
    if _EN_NGUOI_THAN.search(kd):
        return "suc_khoe_the_chat"
    return None


def cap_cuu_en(raw: str) -> bool:
    kd = _hai_ban(raw)[1]
    if _la_en(raw):
        return _cap_cuu_anh(kd)
    return bool(_CAP_CUU_EN.search(kd))


def khung_hoang(raw: str) -> bool:
    cd, kd, co_dau = _hai_ban(raw)
    return any(_khop(k, c, cd, kd, co_dau) for k, c in KHUNG_HOANG) or khung_hoang_en(raw) or _nn.an_toan(raw) == "khung_hoang"


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
    # Review CY-1: hỏi THỜI ĐIỂM mắc một bệnh ("Năm nào tôi bị ung thư?", "Tôi bị đột quỵ khi nào?") — câu hỏi có / không
    # bệnh đội lốt câu chọn năm: không bao giờ trả lời bằng năm (đặt năm cạnh tên bệnh đọc thành lời đoán).
    (r"(nam|thang|khi|luc|tuoi|dip) nao .{0,25}(bi|mac|do|phat|nhiem|len con) (benh|ung thu|u|tieu duong|dot quy|tai bien"
     r"|xo gan|suy than|huyet ap|tim mach|dau tim|ung buou|alzheimer|parkinson|om)(?!\w)"
     r"|(bao gio|may tuoi|nam may) .{0,25}(bi|mac|do|phat|nhiem) (benh|ung thu|u|tieu duong|dot quy|tai bien|xo gan"
     r"|suy than|huyet ap|tim mach|dau tim|ung buou|om)(?!\w)"
     r"|(bi|mac|do|phat) (benh|ung thu|tieu duong|dot quy|tai bien|xo gan|suy than|huyet ap|ung buou)(?!\w).{0,20}"
     r"(nam nao|khi nao|bao gio|luc nao|may tuoi|thang nao)",
     r"(năm|tháng|khi|lúc|tuổi|dịp) nào .{0,25}(bị|mắc|đổ|phát|nhiễm|lên cơn) (bệnh|ung thư|u|tiểu đường|đột quỵ|tai biến"
     r"|xơ gan|suy thận|huyết áp|tim mạch|đau tim|ung bướu|alzheimer|parkinson|ốm)(?!\w)"
     r"|(bao giờ|mấy tuổi|năm mấy) .{0,25}(bị|mắc|đổ|phát|nhiễm) (bệnh|ung thư|u|tiểu đường|đột quỵ|tai biến|xơ gan"
     r"|suy thận|huyết áp|tim mạch|đau tim|ung bướu|ốm)(?!\w)"
     r"|(bị|mắc|đổ|phát) (bệnh|ung thư|tiểu đường|đột quỵ|tai biến|xơ gan|suy thận|huyết áp|ung bướu)(?!\w).{0,20}"
     r"(năm nào|khi nào|bao giờ|lúc nào|mấy tuổi|tháng nào)"),
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
    return any(_khop(k, c, cd, kd, co_dau) for k, c in _CAP_CUU) or cap_cuu_en(raw) or _nn.an_toan(raw) == "cap_cuu"


def hoi_benh(raw: str) -> bool:
    """Câu hỏi CÓ / KHÔNG bệnh ("có mắc bệnh không", "bệnh gì", "có ốm nặng không")."""
    cd, kd, co_dau = _hai_ban(raw)
    return any(_khop(k, c, cd, kd, co_dau) for k, c in _HOI_BENH)


def nguoi_than(raw: str) -> bool:
    """Câu nói về sức khoẻ của người thân / người khác (người đó đứng trước chữ sức khoẻ, bệnh, bộ phận…)."""
    kd = _hai_ban(raw)[1]
    return bool(_NGUOI_THAN.search(kd)) or bool(_EN_NGUOI_THAN.search(kd))


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
    return tu_choi_en(raw) or _nn.tu_choi(raw)     # EN-AI: nhãn ngoài chỉ thêm lời từ chối khi luật không có


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


# Bản tiếng Anh của `_GIU_TU_CHOI`: bỏ / ngừng thuốc, mổ / hoá trị, thai sản, sống chết → giữ lời từ chối cũ (không gợi
# hệ cơ quan); tiên lượng bệnh của người thân vẫn đi nhóm "nguoi_than".
_NGUNG_THUOC_ANH = _rx_en(_NGUNG + r" (?:taking )?(?:my |the |his |her |all )?.{0,25}" + _THUOC, _THUOC + r" .{0,70}(?:" + _NGUNG +
                          r"|safe to stop|can stop|stop or not|skip it|stop it|quit it)")


def _giu_tu_choi_anh(k: str) -> bool:
    if _THAN_BENH_ANH.search(k):
        return False
    return bool(_NGUNG_THUOC_ANH.search(k) or _THAI.search(k) or (_MO.search(k) and _MO_HOI.search(k))
                or TU_CHOI_ANH[0][0].search(k) or _CHET_TOI.search(_CHET_THANH_NGU.sub(" ", k)) or _CHET_CUA.search(k))


def nhom_suc_khoe(raw: str) -> str | None:
    """Câu đã bị xếp từ chối: 'cap_cuu' (triệu chứng cấp — khuyên đi khám ngay; xét TRƯỚC mọi nhóm khác) · 'nguoi_than'
    (sức khoẻ người khác — không đọc lá số người hỏi) · 'hoi_benh' (hỏi có bệnh / đoán bệnh — gợi hệ cơ quan + đi khám)
    · None (giữ lời từ chối cũ: sống chết, chữa trị, thai nhi, may rủi…)."""
    if cap_cuu(raw):
        return "cap_cuu"
    cd, kd, co_dau = _hai_ban(raw)
    if any(_khop(k, c, cd, kd, co_dau) for k, c in _GIU_TU_CHOI):
        return None
    if _la_en(raw) and _giu_tu_choi_anh(_sua_en(kd)):
        return None
    loai = tu_choi(raw)
    if loai not in ("suc_khoe_the_chat", None):
        return None
    if loai is None and not (_SUC_KHOE_KD.search(kd) or hoi_benh(raw)):
        return None
    return "nguoi_than" if nguoi_than(raw) else "hoi_benh"
