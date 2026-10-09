# Đề xuất nâng chất lượng nội dung + bảo vệ bí mật kinh doanh (BM-1, 2026-10-09)

## A. Bảo vệ bí mật kinh doanh — đã làm và còn lại

| Đã làm (PR BM-1) | Còn lại — cần anh quyết |
|---|---|
| Trang Giới thiệu, Quyền riêng tư, Miễn trừ, Điều khoản, Đội ngũ không còn tên thư viện, bộ đối chiếu, nhà cung cấp hạ tầng, tên khoá lưu trữ, phiên bản engine | **`/llms-full.txt` đang gom TOÀN BỘ kho tri thức vào một file** — ai cũng tải một lần là có cả kho. Đề xuất: bỏ file này, giữ `llms.txt` (mục lục) + `.md` từng trang. |
| Dòng "Nguồn" mỗi bài chỉ còn tên sách và trường phái (engine lọc mọi JSON qua `app/cong_khai.py`) | **Bot AI**: đang mở cho cả bot *huấn luyện* (GPTBot, Google-Extended, CCBot, Bytespider, meta-externalagent…). Đề xuất: chặn bot huấn luyện, giữ bot *trả lời/tìm kiếm* (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot…) — vẫn được AI trích dẫn, nhưng nội dung không bị nạp vào mô hình. |
| Điều khoản: cấm cào dữ liệu, dò ngược hệ thống tính, làm dịch vụ cạnh tranh | Tên trường kỹ thuật trong JSON mà trình duyệt nhận (ví dụ phiên bản thư viện an sao) — người rành vẫn đoán được. Đổi tên được, nhưng phải sửa schema web (việc vừa, không gấp). |
| Danh mục mã nguồn mở + giấy phép chuyển vào `docs/NGUON-MO.md` (repo riêng tư) | Hạn mức engine đang 120 yêu cầu/phút mỗi người — đủ chặn cào thô; có thể hạ khi thấy dấu hiệu. |

Lưu ý: nội dung bài kiến thức **bắt buộc công khai** để lên Google, nên không giấu được văn bản — chỉ bảo vệ được
*cách tạo ra* nó (engine, quy tắc, dữ liệu đối chiếu) và chặn sao chép hàng loạt.

## B. Nhãn AI — làm đến đâu và vì sao

- Bài viết: bỏ hết chữ "AI". Bài chưa thẩm định ghi **"Ban biên tập Hiểu Bản Thân · Chủ biên: Đức Luân"**; bài anh đã
  đọc–sửa–duyệt ghi **"Biên soạn & thẩm định: Đức Luân"** (schema `author` = anh). Mỗi bài anh duyệt là một bài đứng
  tên anh — cách nhanh nhất để tăng uy tín thật.
- **Không** ghi "Tác giả: Đức Luân" lên bài anh chưa đọc: Google chấm thông tin sai về người viết là lừa người đọc, và
  một câu sai trong bài đó là uy tín cá nhân anh chịu.
- Giữ chữ "AI"/"diễn đạt tự động" ở 2 chỗ: khung hỏi đáp/luận giải (người dùng đang tương tác trực tiếp với máy) và
  Chính sách riêng tư/Miễn trừ (phải nêu bên xử lý dữ liệu). Nhờ luật sư xác nhận khi rà mục E.

## C. Ý tưởng nâng chất lượng nội dung (xếp theo hiệu quả / công sức)

1. **"Ghi chú của chuyên gia" trên mỗi bài anh thẩm định** — 2–4 câu từ kinh nghiệm thật ("Trong các lá số tôi từng
   xem, người có … thường …", hiểu lầm hay gặp). Đây là chữ **E – Experience** mà máy không viết thay được, và là thứ
   khiến bài khác hẳn trang đối thủ. Kỹ thuật: thêm trường `ghi_chu` vào sổ thẩm định, hiện thành khung riêng có chữ ký.
2. **Thẩm định theo dữ liệu Search Console** thay vì theo thứ tự cố định: bài nào đang có nhiều lượt hiển thị mà ít
   click → anh duyệt + viết lại phần "Trả lời nhanh" trước. Em kéo danh sách hằng tuần qua kết nối Search Console.
3. **Chuyên đề theo mùa — Tết Đinh Mùi 2027**: lượt tìm "tử vi 2027", "tuổi xông nhà 2027", "hướng xuất hành",
   "sao chiếu mệnh 2027" tăng mạnh từ tháng 11. Engine tính sẵn được theo năm → làm cụm trang trước 15/11.
4. **Ca thực tế ẩn danh (có đồng ý)** thay dần lá số hư cấu: 1 ca/tuần, anh kể bối cảnh + cách đọc + điều đã xảy ra
   (không tên, không ngày sinh đầy đủ). Rất mạnh cho E-E-A-T và chia sẻ mạng xã hội.
5. **Mục "Hiểu lầm phổ biến"** ở trang trụ cột (sao, quẻ, số): mỗi trang 2–3 hiểu lầm + cách hiểu đúng theo sách —
   trả lời đúng kiểu câu hỏi người dùng gõ, dễ lên đoạn trích Google.
6. **Làm dày hoặc gộp trang mỏng**: 168 trang sao × cung và 76 trang mệnh theo năm có khung giống nhau. Ưu tiên làm
   giàu trang có lượt hiển thị; trang không ai tìm sau 3 tháng → gộp vào trang mẹ (tránh bị coi là nội dung hàng loạt).
7. **Video ngắn anh tự nói** (YouTube/TikTok, 60 giây/chủ đề) nhúng vào bài + gắn vào hồ sơ tác giả (`sameAs`) — tín
   hiệu người thật mạnh nhất với cả Google lẫn người đọc Việt.
8. **Nguyên văn cổ thư có đối chiếu**: mỗi bài trụ cột 1–2 câu nguyên văn chữ Hán + phiên âm + dịch nghĩa do anh duyệt
   (cần tra tay hoặc gói ctext có phí). Tạo độ "sách vở" mà trang đối thủ thường thiếu.

Đề xuất làm ngay: (1) + (2) trong tuần này, (3) bắt đầu trước 01/11.
