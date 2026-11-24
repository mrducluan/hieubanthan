# Soát PR #347 · #348 · #350 · #353 và cách đã sửa (25/11/2026)

Bốn PR đều xanh CI nhưng chưa PR nào merge được: lỗi nặng nhất nằm ở chỗ CI không chạy tới (tệp kiểm SQL không được gọi,
trang không có e2e chạm luồng tiền). Chủ dự án duyệt hướng sửa ở chat 25/11/2026. PR gộp mới gồm phần dùng được của
#348, #350, #353; #347 không dùng.

## 1. #350 Lì xì Tết 2027 (LX-2027) — đã sửa trong PR gộp

| Lỗi trong #350 | Đã sửa thế nào |
|---|---|
| Hàm tạo đơn ghi cột `so_tien_vnd` không tồn tại → không bán được đơn nào; tệp kiểm SQL không được gọi trong CI | Ghi đúng cột `so_tien`; `thu_li_xi_tet_0042.sql` nối vào `chay.sh` (32 dòng kiểm: tạo đơn → trả tiền qua `nap_sao_tu_cong` → nhận → dùng → hoàn → trần 5 đơn chờ) |
| Một bao mở `/thoi-gian-toi` vĩnh viễn, mọi ngày sinh, mọi năm | **Một bao = một người, năm 2027**: lần đầu người nhận BẤM mở báo cáo bằng bao, bao gắn với HMAC(bí mật máy chủ, ngày sinh) — DB không thấy ngày sinh; đọc lại cả năm không tốn thêm; người thứ hai cần bao thứ hai |
| Lọc số điện thoại trong SQL dùng `\b` (Postgres: backspace) → không chạy; tên không lọc gì | Một bộ lọc giống hệt nhau ở SQL (`lx_chu_bi_chan`) và web (`chuBiChan`): link cả khi không "http", email, dãy số dài, từ lừa đảo (stk, chuyển khoản, mã xác nhận…); tên không được có chữ số; máy chủ lọc lại trước SQL |
| Chữ người dùng gõ hiện ở tiêu đề, mô tả link, ảnh chia sẻ dưới tên hieuban.com | Lời chúc **tự viết** (chủ dự án muốn cho tự gõ) chỉ hiện TRONG trang bao kèm dòng "Hiểu Bản Thân không bao giờ nhắn bạn chuyển tiền"; ảnh xem trước / mô tả link chỉ dùng lời chúc mẫu |
| Mã bao chưa nhận lọt lên PostHog / Meta Pixel | `lamSachUrl` lọc `/li-xi/<mã>` và `?tiep=` |
| Hứa "hoàn tiền 100%" nhưng hàm hoàn không chạy được ở đâu, bỏ qua MFA, không khoá dòng, hoàn được đơn chưa trả | `hoan_don_li_xi` chỉ chạy ở SQL Editor, khoá đơn + bao, chỉ đơn đã trả, chưa bao nào được nhận; trigger chuyển bao sang `hoan` |
| Trả tiền xong không có gì xảy ra trên trang | Cổng đưa về `/nap-sao/ket-qua` như mọi đơn, trang kết quả hiểu đơn `li_xi` và dẫn về danh sách bao |
| Thiếu chốt của luồng nạp cũ (5 đơn chờ, huỷ đơn khi cổng lỗi, Meta / Google) | Có đủ, như `tao-don` |
| Bán quà cho báo cáo đang miễn phí; bày giá khi chưa mở bán; "tiết kiệm 17%" viết cứng (thật 16 %) | Chỉ mở bán khi Thời gian tới đang thu Sao; chưa mở thì không bày giá; "rẻ hơn x%" tính từ bảng giá |
| Khối "6 mảng" lộ mã nội bộ, hứa cả phần vốn miễn phí, không nói chuyện giờ sinh | Viết lại "Một bao lì xì mở được gì?" đúng 4 chương báo cáo, ghi chương nào miễn phí, cần giờ sinh cho Tử vi / Bát tự |
| Ảnh mẫu nằm dưới `/li-xi/` bị robots chặn; ảnh chia sẻ thiếu QR | Ảnh dời `/anh/li-xi/`; ảnh chia sẻ có QR về trang mua (không phải link bao — ai quét trước sẽ nhận mất) |
| Bảng có policy select; RLS thừa | Không policy, mọi truy cập qua hàm (như quà tặng chương 0025); mã 16 hex từ `sao_byte_ngau_nhien` (không cần pgcrypto) |
| Bản down xoá bảng kể cả khi đã bán | Down dừng lại nếu đã có đơn trả tiền / bao đã nhận |
| 4 tệp docs lạc đề trong repo công khai (tên đối thủ, tự nhận "chưa thông báo Bộ Công Thương") | Đã bỏ khỏi PR |

Chưa làm (ghi để sau): sáu ảnh JPG trông như ảnh AI tạo, chưa rõ nguồn — chủ dự án xác nhận nguồn hoặc thay; trang
không đọc CMS dù đã khai sổ trang; đơn lì xì làm mất gói "Lần đầu" 59k (đúng chữ 0040: mọi đơn đã trả đều tính).

## 2. #348 Chuyên gia — đã sửa trong PR gộp

| Lỗi | Đã sửa |
|---|---|
| Lời mời "Hỏi chuyên gia" hiện cả sau câu khủng hoảng, còn chép câu đó vào form trả tiền | `lib/moi-chuyen-gia.ts` (unit test): phiên có câu khủng hoảng / từ chối / dẫn hướng / đoạn hỗ trợ thì không bao giờ mời; chỉ đếm câu trả lời thường |
| "Chèn khung trả lời" chép ngày sinh âm + tứ trụ vào câu trả lời lưu vĩnh viễn (lời hứa "xoá sau 30 ngày" thành rỗng); gửi được khung còn chỗ trống | Khung chỉ còn tiêu đề + chỗ trống `[…]`; `kiemTraLoi` chặn gửi khi còn chỗ trống |
| Kinh Dịch bị tính thêm hồ sơ sinh của người hỏi | Kinh Dịch không tính hồ sơ (như trước) |
| Mảng nhìn thêm thiếu số thì biến mất không lý do; lỗi mạng nhớ cả phiên; ghi đè bản nháp đang viết; hạn 48 giờ viết cứng | Có ô kèm ghi chú; lỗi không nhớ; không ghi đè nháp; hạn lấy từ cấu hình; đo cả lượt thấy |
| Trang tuyển: lá số mẫu không thể có (Thiên Phủ ở Thìn đi với Vũ Khúc), dẫn "NĐ 252/2026" không kiểm được, lộ mã nội bộ, trộn "Founding Masters / Co-Pilot" | Viết lại bằng lời thường; khung minh hoạ chỉ có tên ô; bỏ số nghị định (điều khoản ở hợp đồng do luật sư soạn); link hiện ở `/tac-gia` (chủ dự án đã quyết làm) |

Giữ: con số "tới 80% tiền câu hỏi (sau phí thanh toán)" theo PR — chủ dự án xác nhận lại (VIEC-CUA-ANH mục 00).

## 3. #353 Thư viện `/hoi-dap` — đổi hướng

**Không dùng route `/hoi-dap`**: 12 bài luận viết thẳng trong tệp TS của web, tự lên sitemap, không qua kho tri thức, bộ
kiểm của engine hay CMS; 5 lỗi dữ kiện; nút chuyên gia mang mã mảng sai và dẫn vào ngõ cụt; khai sổ trang mà trang không
đọc CMS; bài 300–440 chữ, không dữ kiện riêng (rủi ro "nội dung hàng loạt").

**Đã làm**: 12 tình huống thành **bài nháp "Gửi duyệt"** trong CMS (lô HD-TH, `cms/src/bai-khoi-tao/hoi-dap-tinh-huong/`,
migration dữ liệu `20261125_090000_hd_th_tinh_huong`), không tự xuất bản; đã sửa: Tử vi gọi đại hạn; lưu nguyệt (không
phải "lưu niên 12 tháng"); Sứ mệnh (không có chỉ số "Biểu đạt"); hướng vợ chồng tính cho từng người (trước ngược kho tri
thức); «hoà vi quý» là Luận Ngữ; tháng đại lợi chỉ là tập quán; bỏ câu gán bừa cho Bát tự; lời tiền bạc có câu "không phải
lời khuyên đầu tư"; link công cụ đúng (Chân dung là 3 môn). Bộ kiểm CMS: 0 lỗi chặn, điểm 64–70 (bài còn mỏng).

## 4. Ý tưởng tốt hơn cho #353 (bước tiếp, cần duyệt)

**Tình huống gắn lá số mẫu do engine tính**: mỗi bài dựng quanh một người minh hoạ (ngày giờ sinh giả, ghi rõ), chạy đúng
engine để lấy dữ kiện thật (mức chương, năm nên chú ý, tháng thuận…) rồi Ban biên tập viết lời. Bài có dữ kiện riêng (hết
mỏng), cho người đọc thấy công cụ làm gì (E-E-A-T), không bịa "cả ba hệ thống đều cho thấy". Đi chung đường KW-6T (bài có
số liệu engine, ảnh có QR).

## 5. #347 Cache CDN + CSP — không dùng, đề xuất hướng khác

**Đo trên hieuban.com (25/11/2026, máy ở Mỹ như Googlebot)**: trang kiến thức trả byte đầu 0,46–0,6 giây; trong đó ~0,23 giây
là đường Mỹ → Singapore, render ~0,15–0,2 giây; mọi lượt `x-vercel-cache: MISS`.

| | #347 cache CDN 1 giờ | Dựng tĩnh trang kiến thức (ISR) |
|---|---|---|
| Googlebot trúng cache | Gần như không: cache theo vùng, mất khi deploy, TTL 1 giờ, mỗi URL vài tuần mới ghé lại | Có: trang dựng sẵn phát từ mọi vùng |
| Người đọc thật | Ít trúng (lưu lượng thấp, nhiều URL) | Trúng |
| Giá CSP | Cả phiên vào từ trang SEO chạy CSP không nonce (`'unsafe-inline'`), kể cả khi bấm sang `/tu-vi`, `/nap-sao` | Như vậy nhưng chỉ trang kiến thức; cần tách layout |
| Rủi ro khác | Bot ảnh xem trước (Facebook, Zalo) có thể nhận bản cache thiếu title / OG trong `<head>`; xuất bản CMS không xoá cache | Làm lại phần đầu layout (đọc header, nonce) — việc lớn, đụng CSP-2 |

Kết luận: lợi ích #347 gần như bằng không mà giá bảo mật là thật → đóng. Nếu muốn kéo thời gian phản hồi cho Googlebot
(trung bình 673 ms ở Search Console), hướng đúng là dự án riêng "dựng tĩnh trang kiến thức", ước 2–3 ngày, cần chủ dự án
duyệt vì đổi CSP-2 cho nhóm trang đó.

**Cập nhật 24/11/2026**: main đã làm Q-I3 bằng **nonce ổn định** (HMAC theo bản deploy + đường dẫn, giữ `'strict-dynamic'`) — xử lý đúng lý do bác #347 (mất nonce cả phiên). Hướng "dựng tĩnh" không cần nữa; #347 chỉ còn việc đóng.
