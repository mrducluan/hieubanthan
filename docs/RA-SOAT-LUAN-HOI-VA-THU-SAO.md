# Rà soát: lớp "Luận theo câu hỏi" nối với thu Sao (2026-11-17)

Khâu của vòng tăng trưởng: **NẠP Sao** (chính), MỜI và QUAY LẠI (phụ). Tài liệu này trả lời câu "lớp luận mới đã nối với phần
kinh doanh chưa, cần bổ sung gì".

## 1. Hiện trạng sau LH-1 + LH-2

| Điểm chạm | Người chưa mở Sao thấy gì | Người đã mở thấy gì |
|---|---|---|
| Bản đồ "Người quanh bạn" (đầu báo cáo) | đủ 6–7 người với tên + mức; người thuộc chương khoá có ổ khoá, bấm ra lời dẫn tới phần mở chương | chân dung, cách đối đãi, hai chiều tác động |
| Thẻ chương khoá | **các câu hỏi chương trả lời** (bấm được, mở đúng hộp Sao) + "kèm chân dung N người và hướng hoá giải" | — |
| Dòng dẫn phần khoá | "trả lời thẳng N câu bạn hay hỏi, kèm hướng hoá giải từng mảng" | — |
| Trang `/goi-xem` | gói Tử vi và Bát tự nêu "27 câu hay hỏi", chân dung, hoá giải | — |

Câu trả lời, nhãn, chân dung của chương khoá **không xuống trình duyệt** (test engine + e2e). Câu hỏi là chữ cố định của kho
tri thức, giống nhau với mọi lá số, nên hiện ra không lộ gì về người xem.

Đo mới: `sao_cta_clicked{tu: cau_khoa, mo_dun, chuong, cau}` — biết **câu hỏi nào** khiến người đọc bấm mở.

## 2. Điều đã đúng, không cần đổi

- Giá 99 Sao một báo cáo: nội dung Tử vi và Bát tự dày lên khoảng 45 % (98 KB → 142 KB dữ liệu) mà giá giữ nguyên.
- Chương 1 miễn phí, mở cả báo cáo một lần, xem lại trong ngày không trừ thêm (SAO-2) — lớp mới đi đúng luồng này.
- Công tắc thu Sao vẫn chỉ có hiệu lực khi đã có cổng nạp; chưa có Pay2S thì mọi thứ vẫn miễn phí.

## 3. Rủi ro em thấy

1. **Kích thước bài lưu.** Bài lưu vào tài khoản bị chặn ở 256 KB. Báo cáo nay ~142 KB, còn dư ~110 KB. Bản có diễn đạt AI
   dài hơn. Đã thêm test chặn báo cáo vượt 190 KB; nếu sau này thêm lớp nữa phải gọt `can_cu` trùng giữa bản đồ và chương.
2. **Nhãn nặng nằm sau cổng trả tiền.** "Dễ hai lần đò", "giữ tiền kém" là thứ người ta trả tiền để đọc. Lời mời chương khoá
   chỉ nêu câu hỏi, không gợi "lá số bạn có vấn đề" — giữ đúng ranh giới không doạ để bán. Đừng đổi thành câu gây lo.
3. **Kho lời là nháp.** Bán nội dung chưa có chuyên gia soát là rủi ro uy tín. Nên đọc soát 27 câu × các nhãn trước ngày bật
   thu Sao (việc của anh, mục 4aw).

## 4. Đề xuất bổ sung — chờ anh chọn

| # | Việc | Khâu | Cần gì | Em khuyên |
|---|---|---|---|---|
| D1 | **Một câu trả lời mẫu miễn phí** ở chương 1 (ví dụ "Tôi hợp nghề gì?") để người đọc thấy chất lượng trước khi trả | NẠP | chỉ engine + web | **Đã làm 2026-11-17 (LH-3)** |
| D2 | **Hỏi đáp dùng cùng nhãn**: hỏi "tôi hợp nghề gì" trong khung chat thì trả đúng nhãn của báo cáo và dẫn tới chương | QUAY LẠI + NẠP | engine | Làm sau D1 |
| D3 | **Trang kiến thức theo câu hỏi** ("hợp nghề gì theo Tử vi", "số hai lần đò là gì") dẫn về công cụ | THU HÚT | engine + web, ~30 trang | Làm khi có số Search Console cho cụm này |
| D4 | **Thẻ chia sẻ "Người quanh tôi"** (chỉ tên vai + mức, không ngày sinh) | MỜI | web, mã HMAC mới | Chờ: mức của vợ/chồng, cha mẹ là chuyện riêng, dễ ngại chia sẻ |
| D5 | **Nối "Hỏi chuyên gia"** dưới câu trả lời mang nhãn nặng | NẠP (VND) | web | Chỉ khi anh sẵn sàng trả lời trong 48 giờ |
| D6 | **Gói ghép Tử vi + Bát tự** (hai báo cáo cùng khuôn, giá thấp hơn mua lẻ) | NẠP | hàm SQL mới | Chờ số liệu tỉ lệ người mở cả hai |

## 5. Chưa làm ở đợt này

- Bản tiếng Anh của lớp luận (kho lời chưa dịch).
- Thần số, Phong thuỷ, Nhân tướng, Tarot, Chỉ tay theo khuôn này (anh đã chọn Tử vi rồi Bát tự).

## 6. Việc tiếp theo sau D1 (xếp theo thứ tự em khuyên)

1. **Anh đọc soát kho lời** (27 câu × các nhãn, hai môn) — việc chặn ngày bật thu Sao; không ai làm thay được.
2. **Đo D1**: sau 2 tuần so tỉ lệ `paywall_viewed → unlock_succeeded` của Tử vi / Bát tự trước và sau; xem phiếu "Đúng với
   mình" của `ds.*.hoi.ben.hai_lan_do` và `ds.*.hoi.nguoi_thu_ba.*` — nếu < 40 % thấy đúng thì ngưỡng mới đang quá tay.
3. **D2 — hỏi đáp dùng cùng nhãn với báo cáo** (chỉ engine): hỏi "tôi hợp nghề gì", "có hai lần đò không" trong khung chat
   trả đúng nhãn của báo cáo và dẫn tới chương. Tránh cảnh chat nói một đằng, báo cáo nói một nẻo.
4. **Sửa lời còn gượng**: câu tóm tắt vài chương và chương "Mảng đời nào kéo mảng đời nào" còn lặp mẫu.
5. **D3 — trang kiến thức theo câu hỏi** khi Search Console có số cho cụm này.
6. **Bản tiếng Anh** của lớp luận (kho lời chưa dịch) và **các môn khác** (Thần số, Phong thuỷ, Nhân tướng) theo cùng khuôn.
7. D4, D5, D6: chờ số liệu / chờ anh sẵn sàng (xem bảng trên).
