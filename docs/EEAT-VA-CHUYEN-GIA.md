# E-E-A-T và lộ trình chuyên gia — hieuban.com

> Chủ dự án hỏi (2026-10-09): đổi nhãn "nháp AI" thành tên tác giả **Đức Luân** (hơn 15 năm nghiên cứu thần số học,
> Tử vi, Bát tự, Phong thuỷ, Kinh Dịch)? Có cần trang hồ sơ riêng? Web có nên đi theo E-E-A-T? Chuyên gia xây dựng
> cộng đồng theo lộ trình thế nào? Tài liệu này là đánh giá + phần đã làm (EEAT-1) + lộ trình.

## 1. Kết luận ngắn

1. **Có, nên đi theo E-E-A-T** (Experience · Expertise · Authoritativeness · Trust). Nội dung huyền học chạm tới
   quyết định đời sống (hôn nhân, tiền, nhà cửa, sức khoẻ tinh thần) nên Google chấm kỹ phần "ai đứng sau, có đáng tin
   không". Hiện web có 627 trang, phần lớn dựng theo khuôn từ kho tri thức — đúng loại trang Google soi theo chính sách
   *scaled content*. Thứ cứu được loại trang này là **dấu vết của chuyên gia thật** trên từng bài.
2. **Không gắn "Tác giả: Đức Luân" lên những bài anh chưa đọc.** Kho tri thức hiện có ~530 nghìn ký tự, toàn bộ do AI
   soạn, chưa bài nào được duyệt. Ghi tên anh là tác giả lúc này là ghi sai người viết:
   - Google xếp "thông tin sai về tác giả / chuyên môn" vào nhóm **lừa người đọc** (Search Quality Rater Guidelines —
     mục Trust là yếu tố quan trọng nhất của E-E-A-T; trang lừa về người viết bị chấm "Lowest").
   - Hướng dẫn chính thức của Google về nội dung có AI: **nói rõ "Who / How / Why"** — ai chịu trách nhiệm, làm bằng
     cách nào (có tự động hoá / AI không). Che chuyện có AI không được cộng điểm, lộ ra thì mất điểm Trust.
   - Rủi ro thật cho anh: một bài sai (ví dụ một câu về bệnh tật, tiền bạc) mang tên "Tác giả: Đức Luân" là uy tín cá
     nhân anh đứng ra chịu. Luật Bảo vệ quyền lợi người tiêu dùng 2023 cũng cấm thông tin gây nhầm lẫn về dịch vụ.
3. **Cách làm đúng, và vẫn tăng uy tín mạnh hơn**: anh đứng tên ở **đúng vai trò** —
   - **Chủ biên** (mọi bài): người chịu trách nhiệm biên tập toàn site. Đúng sự thật ngay hôm nay.
   - **Tác giả** (bài anh tự viết): 12 trang ý nghĩa số thần số học — nội dung anh tự biên soạn.
   - **Thẩm định** (bài anh đã đọc, sửa, duyệt): ghi tên + ngày. Mỗi bài anh duyệt là một tín hiệu E-E-A-T thật.
   Thẩm định càng nhiều, web càng mạnh — và nhãn "chờ thẩm định" tự biến mất ở bài đã duyệt.

> **Cập nhật BM-1 (2026-10-09, chủ dự án yêu cầu):** bỏ chữ "AI" khỏi bài viết. Bài chưa thẩm định ghi
> "Ban biên tập Hiểu Bản Thân · Chủ biên: Đức Luân", không còn nhãn "chờ thẩm định"; bài đã thẩm định ghi
> "Biên soạn & thẩm định: Đức Luân" (schema `author` = Person). Nguyên tắc giữ nguyên: không ghi chuyên gia là tác giả
> bài họ chưa đọc. Chi tiết + đề xuất nội dung: `docs/DE-XUAT-CHAT-LUONG-NOI-DUNG.md`. Bảng dưới là trạng thái EEAT-1 gốc.

## 2. Đã làm (EEAT-1)

| Hạng mục | Chi tiết |
|---|---|
| Dòng tác giả dưới mỗi tiêu đề | "Tác giả: Đức Luân" (bài anh viết) · "Chủ biên: Đức Luân" + "đã thẩm định · ngày" hoặc "biên soạn có AI hỗ trợ · đang chờ chuyên gia thẩm định". Link về hồ sơ, `rel="author"`. |
| Trang hồ sơ `/tac-gia/duc-luan` | Giới thiệu (chỉ điều anh đã công bố), lĩnh vực, số bài chủ biên / tự viết / đã thẩm định, danh sách bài, quy trình biên soạn 3 bước, góp ý. Schema `ProfilePage` + `Person`. |
| Trang `/tac-gia` | Đội ngũ chuyên gia — sẵn chỗ cho chuyên gia cộng đồng (mục 4). |
| Schema | Bài: `editor` = Đức Luân; `author` = Đức Luân chỉ khi anh tự viết, còn lại là tổ chức; bài đã duyệt có `WebPage.reviewedBy` + `lastReviewed`. Tổ chức: `founder` = Đức Luân. |
| Sổ thẩm định | `engine/app/kb/data/tham_dinh.json` + lệnh `python scripts/tham_dinh.py` (đánh dấu, bỏ, hàng đợi, thống kê). Duyệt → trang đổi "đã thẩm định", ngày cập nhật + sitemap `lastmod` đổi theo. |
| Nhãn toàn site | "bản nháp AI" → "biên soạn có AI hỗ trợ, đang chờ chuyên gia thẩm định" (khung hỏi đáp, luận giải, từ điển, bản .md cho bot AI, llms.txt, điều khoản, miễn trừ, chân trang, giới thiệu). |
| Sửa nhãn sai | 9 trang "Năm cá nhân số 1–9" trước ghi "đã duyệt" nhưng nội dung do AI soạn (`thanso_depth.json`) → nay "chờ thẩm định". |
| Bot AI đọc đúng tiêu đề | Next 15 đẩy `<title>` xuống cuối trang; bot không chạy JS (GPTBot, ClaudeBot, Perplexity…) đọc nhầm `<title>` của hình SVG. Nay mọi bot nhận metadata trong `<head>`; bộ rà SEO đọc như GPTBot và báo lỗi nếu `<title>` không nằm trong `<head>`. |

## 3. Quy trình thẩm định cho anh

**Cách nhanh nhất:** anh đọc bài trên web → nhắn em "duyệt bài <link>" (kèm chỗ cần sửa nếu có). Em sửa KB theo ý anh,
chạy `python scripts/tham_dinh.py danh-dau <link> --ngay <hôm nay> [--goc-nhin "…"]`, mở PR. Bài sửa nhiều thì em ghi
chú nội bộ vào sổ (`--ghi-chu`, không hiện trên web).

**Góc nhìn chuyên gia (GN-1):** anh gửi kèm 2–4 câu kinh nghiệm thật → hiện thành khung có chữ ký ngay sau "Trả lời
nhanh". Chỉ sửa chính tả, không thêm ý; luật nội dung kiểm tự động (`python scripts/tham_dinh.py kiem-goc-nhin "…"`):
60–800 ký tự, không cụm phán định, không bệnh tật/sống chết, không vật phẩm/giải hạn, không link/số điện thoại.
Câu mẫu do người khác viết **không** được gắn tên anh.

**Thứ tự gợi ý** (`python scripts/tham_dinh.py hang-doi`, hoặc theo số thật: `hang-doi --gsc Trang.csv`): trang trụ cột trước vì nhiều trang khác trỏ vào —
14 sao · 12 cung · 64 quẻ · 10 nhật chủ · 10 thập thần (**110 bài**), rồi hợp số, nghề, tình yêu, năm cá nhân, nợ
nghiệp (82), rồi cụm dài: tứ hoá × cung (48), mệnh theo năm (76), sao × cung (168).

**Nhịp đề xuất:** 10 bài/ngày → xong 110 bài trụ cột trong ~2 tuần. Khi có số Search Console, ưu tiên bài đang có
lượt hiển thị cao.

**Duyệt nghĩa là:** anh đồng ý nội dung đúng với hiểu biết và trường phái anh theo, không có câu phán bệnh tật / sống
chết / tiền bạc / "giải hạn", nguồn ghi đúng. Không cần đối chiếu nguyên văn chữ Hán (việc đó vẫn theo cờ
`can_doi_chieu` của từng file KB).

## 4. Lộ trình chuyên gia xây dựng cộng đồng

Nguyên tắc chung: **tên chuyên gia chỉ đứng ở việc người đó thật sự làm**; mọi chuyên gia ký bộ quy tắc hành nghề
(không phán bệnh tật / sống chết, không bán vật phẩm "hoá giải", không hứa kết quả, khai báo xung đột lợi ích); hợp đôi
vẫn **không chấm điểm** hợp/khắc.

| Giai đoạn | Khi nào | Chuyên gia làm gì | Kỹ thuật cần | Đo |
|---|---|---|---|---|
| **GĐ0 — Chủ biên** | Ngay bây giờ | Anh thẩm định 110 bài trụ cột; viết thêm bài ký tên (kinh nghiệm thật: ca hay gặp, hiểu lầm phổ biến — phần "Experience" mà AI không có). | Đã có (EEAT-1). | Số bài đã thẩm định; lượt hiển thị/click Search Console của bài đã duyệt so với bài chưa duyệt. |
| **GĐ1 — Chuyên gia thẩm định theo mảng** | Sau 2 tháng thử nghiệm, khi GĐ0 xong trụ cột | Mời 3–5 người, mỗi người một mảng (Tử vi · Bát tự · Phong thuỷ · Kinh Dịch · Thần số). Mỗi người có hồ sơ `/tac-gia/<slug>`, thẩm định bài trong mảng mình, ký tên. Anh vẫn là chủ biên. | Thêm hồ sơ vào `web/lib/chuyen-gia.ts` + mã vào `tham_dinh.json` (không cần DB). Hợp đồng cộng tác: quyền tác giả, nhuận bút, bảo mật. | Bài đã thẩm định/tuần; tỉ lệ sửa sau góp ý. |
| **GĐ2 — Hỏi đáp cộng đồng có chuyên gia** | Khi bật tài khoản + có ~1.000 người dùng quay lại/tháng | Câu hỏi hay (đã ẩn danh, đã lọc) thành bài hỏi–đáp công khai, chuyên gia trả lời ký tên; bài chuyên đề hằng tuần; người dùng góp ý, báo sai. | Bảng câu hỏi công khai + kiểm duyệt (migration mới, chờ duyệt); không lưu luận giải gắn user_id. | Câu hỏi/tuần, tỉ lệ được trả lời, lượt chia sẻ. |
| **GĐ3 — Không gian chuyên gia & tư vấn** | Khi qua cổng pháp lý (ĐKKD dịch vụ, thuế, hợp đồng) và Gate 2 | Như `DE-XUAT-KINH-TE-CONG-DONG.md` Tầng 3: công cụ Pro cho người luận giải, rồi đặt lịch tư vấn qua nền tảng (Sao/tiền thật), có đánh giá, hoàn tiền. | Thanh toán, đặt lịch, xác minh danh tính chuyên gia. | Doanh thu/chuyên gia, đánh giá, khiếu nại. |

## 5. Việc cần anh

Xem `docs/VIEC-CUA-ANH.md` mục **M**: bổ sung tiểu sử thật (chỉ điều anh muốn công bố), ảnh chân dung (tuỳ chọn),
link mạng xã hội/kênh của anh, và bắt đầu thẩm định theo hàng đợi.
