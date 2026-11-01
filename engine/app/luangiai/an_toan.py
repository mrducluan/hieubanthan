# -*- coding: utf-8 -*-
"""EN-1 (AT-1) — danh sách an toàn DÙNG CHUNG cho cả 5 mảng hỏi đáp (Thần số `luangiai.hoi`, Huyền học `hoidap.chung`)
và `/v1/hoi/dac-biet`. Trước đây Thần số và Huyền học mỗi bên một bộ → câu khủng hoảng nói gián tiếp, bạo lực gia
đình, bệnh nặng / tuổi chết lọt 8/25 câu nhạy cảm (holdout_v2).

Mẫu viết trên câu đã chuẩn hoá (bỏ dấu, chữ thường), `luangiai.hoi._rx` tự bọc biên từ. Ưu tiên: khủng hoảng (kể cả bạo
lực đang xảy ra) THẮNG mọi thứ khác. Không import module nào khác (tránh vòng import)."""
from __future__ import annotations

# Ý tự hại nói GIÁN TIẾP — nghe như mệt mỏi thường ngày nhưng đi kèm "không muốn tồn tại / là gánh nặng / kết thúc".
GIAN_TIEP = [
    r"(moi thu|cuoc song|cuoc doi|song) (deu |that |qua |thay )?vo nghia", r"thay (moi thu )?vo nghia qua",
    r"(chang|khong|ko|k) muon (thuc )?day (nua|luon)", r"(chang|khong|ko) muon (tinh|thuc) (day|giac) nua",
    r"ngu (mot giac |luon )?(khong|chang) (bao gio |con )?(tinh |thuc )?(day|tinh) nua",
    r"ngu luon (khong|chang) (tinh|thuc) (day|giac)",
    r"(la|chi la|thanh) ganh nang (cho|cua) (moi nguoi|gia dinh|bo me|ca nha|nguoi khac|tat ca)",
    r"(sinh ra|ton tai) (la|chi la) ganh nang",
    r"di (dau do )?(that )?xa cho xong", r"cho xong (moi chuyen|het|tat ca)",
    r"(khong|ko|chang|het) con thiet tha( gi)?", r"het thiet tha",
    r"khong ai can (toi|em|minh|con)( ca| nua)?", r"song (de )?lam gi (nua|ca)",
    r"(chang|khong|ko) muon song", r"khong dang song", r"(chang|khong) con muon song",
    r"thu tu biet", r"(tinh|muon|se) ra di (de|cho) (moi nguoi|ca nha|gia dinh|bo me)",
    r"ra di cho (xong|nhe no|nhe nguoi)", r"(muon|hay|thuong) tu lam dau", r"lam dau (ban than|chinh minh)",
    r"nghi ngoi mai mai", r"bien mat (khoi|mai mai)",
]

# Bạo lực đang xảy ra — xếp vào khủng hoảng (lời hỗ trợ có số 113/111, không luận "có nên chịu đựng").
BAO_LUC = [
    r"bao luc (gia dinh|tinh duc)", r"bi (danh dap|hanh ha|bat nat|xam hai)",
    r"bi (chong|vo|bo|me|ba|nguoi yeu|ny|ban trai|ban gai|anh|chi|bo duong|me ke|cha duong) "
    r"(toi |em |minh )?(danh|tat|dap|hanh ha|bop co|de doa giet)",
    r"(chong|vo|bo|me|nguoi yeu|ny|ban trai|bo duong|cha duong) (toi |em |minh )?(hay |thuong |cu |suot ngay )?"
    r"(danh|tat|dap|hanh ha) (toi|em|minh|con)",
    r"(chong|bo|ban trai|nguoi yeu) (toi |em )?(hay |thuong )?danh (toi|em) (khi|moi|luc)",
]

KHUNG_HOANG = GIAN_TIEP + BAO_LUC

# Bệnh nặng / chẩn đoán / bỏ thuốc / tuổi chết — từ chối nhẹ ở MỌI mảng (không phán, không chẩn đoán).
SUC_KHOE = [
    r"(bi )?u (gan|phoi|nao|vu|xo|tuyen giap|da day|buong trung|tu cung)", r"chan doan (u|ung thu|benh)",
    r"(sot cao|co giat|dong kinh|tu ky|tram cam nang|dot quy|suy than)",
    r"(bo|ngung|dung) (uong )?thuoc (dieu tri|huyet ap|tieu duong|tim|ung thu|tay|bac si)",
    r"(ngung|bo) uong thuoc",
    r"(uong|dung) thuoc nam (thay|de chua)", r"thay thuoc (dieu tri|tay)",
    r"(thai|be|con) .{0,25}di tat", r"di tat (bam sinh|thai)", r"bi di tat",
]
TUOI_CHET = [
    r"may tuoi (thi |se )?(mat|chet|qua doi|ra di)", r"(mat|chet|qua doi) (nam|luc|khi) (may tuoi|nao)",
    r"(toi|em|minh) (se )?qua doi", r"bao gio (thi )?(mat|qua doi)", r"co qua khoi (khong|ko|duoc)",
]
