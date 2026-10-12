# Kế hoạch chuyên gia & cộng đồng tác giả — doanh thu không đa cấp (CG-1, lập 2026-10-12)

> **Đẩy khâu:**
> - 1 · Thu hút: bài có chữ ký chuyên môn → E-E-A-T, AI trích.
> - 3 · Quay lại: chuyên gia mình theo dõi có bài mới.
> - 5 · Doanh thu: tư vấn 1:1, báo cáo chuyên sâu, gói hội viên.
>
> **Đo bằng:** bài cộng tác được duyệt/tháng, điểm kiểm định trung bình, lượt nhấp GSC của bài có chữ ký, số buổi tư
> vấn, doanh thu/chuyên gia, tỷ lệ hoàn tiền/khiếu nại.
>
> Đây là **kế hoạch**. Phần đã làm trong PR này: vai trò **Cộng tác viên** + quy trình duyệt trong CMS (mục 4). Các phần
> còn lại, mỗi bước một PR + migration chờ anh duyệt.

## 1. Anh hỏi: "hoa hồng nhiều tầng" có dùng được không?

**Em khuyên KHÔNG dùng hoa hồng nhiều tầng dưới bất kỳ hình thức nào** (tiền, Sao, điểm), kể cả cho chuyên gia.
Lý do theo hiểu biết của em (cần luật sư xác nhận trước khi chốt mô hình tiền thật):

| Điểm | Nội dung | Hệ quả với Hiểu Bản Thân |
|---|---|---|
| Định nghĩa | Nghị định 40/2018/NĐ-CP: kinh doanh đa cấp là dùng mạng lưới nhiều cấp, nhiều nhánh, trong đó người tham gia hưởng hoa hồng/lợi ích từ kết quả của **chính mình và của mạng lưới dưới mình** | Thưởng khi "người được mời của người được mời" mua → rơi đúng định nghĩa |
| Giấy phép | Phải có giấy chứng nhận đăng ký hoạt động bán hàng đa cấp, ký quỹ, vốn lớn; theo NĐ 40, đa cấp **chỉ áp dụng cho hàng hoá** — kinh doanh đa cấp **dịch vụ** bị cấm | Hiểu Bản Thân bán dịch vụ số → không có đường hợp pháp nào cho đa cấp |
| Hình sự | Điều 217a Bộ luật Hình sự: tổ chức kinh doanh đa cấp trái phép (phạt tiền tới hàng tỷ đồng hoặc tù). Năm 2025 Uỷ ban Cạnh tranh Quốc gia ghi nhận 11 vụ khởi tố, 95 bị can, hơn 13.000 tỷ đồng thiệt hại | Rủi ro cá nhân cho chủ dự án, không chỉ phạt hành chính |
| Ấn tượng | Mạng lưới + token + "thu nhập thụ động" là mô típ lừa đảo quen thuộc ở VN | Mất uy tín — trái với E-E-A-T đang xây |

**Một tầng thì được** (tiếp thị liên kết thông thường): người giới thiệu nhận thưởng từ người **mình trực tiếp** mời,
không có tầng thứ hai. Hiện web đã làm đúng như vậy (thưởng mời 20/20 Sao, một tầng, có trần).

## 2. Thay vào đó: kinh tế chuyên gia theo **kết quả của chính mình** (creator economy)

Nguyên tắc: **mỗi người chỉ được trả từ giá trị chính mình tạo ra** (bài mình viết, buổi tư vấn mình làm, người mình
trực tiếp mời). Không ai được trả từ người "dưới" mình.

### 2.1 Lộ trình thành chuyên gia (5 bậc)

| Bậc | Ai | Điều kiện lên bậc | Được gì |
|---|---|---|---|
| 0. Người đọc | Mọi người | — | Công cụ miễn phí, Sao chào mừng/mời bạn |
| 1. Người đóng góp | Người dùng có tài khoản, gửi bài | Đăng ký cộng tác + đồng ý quy tắc nội dung | Tài khoản CMS vai trò **Cộng tác viên**; bài được duyệt ghi tên "Người đóng góp" + **Sao thưởng** (vd 50 Sao/bài) |
| 2. Chuyên gia khách | Người đóng góp viết tốt | ≥ 5 bài được duyệt, điểm kiểm định TB ≥ 80, không vi phạm | Trang hồ sơ `/tac-gia/{tên}`, bài ký "Tác giả", được mời thẩm định bài cùng mảng |
| 3. Chuyên gia xác minh | Chuyên gia khách có kinh nghiệm thật | Xác minh danh tính + kinh nghiệm (KYC nhẹ, phỏng vấn), ký **hợp đồng cộng tác** | Huy hiệu "Đã xác minh", **mở tư vấn 1:1 trả phí**, bán báo cáo chuyên sâu, nhận chia sẻ doanh thu bằng tiền |
| 4. Chuyên gia đối tác | Chuyên gia xác minh có lượng khách ổn định | Doanh thu + đánh giá tốt 3 tháng | Tỷ lệ chia sẻ cao hơn, được đề xuất trên trang chủ, đồng sản xuất khoá học |

Mọi bậc **không thu phí tham gia**. Thu phí để "được làm chuyên gia" kèm tuyển người là dấu hiệu đa cấp.

### 2.2 Dòng tiền (tất cả bằng **VND**, qua cổng thanh toán đã làm)

| Sản phẩm | Người dùng trả | Chuyên gia nhận | Nền tảng giữ |
|---|---|---|---|
| Tư vấn 1:1 (video/chat 30–60 phút, lịch hẹn) | Giá chuyên gia đặt trong khung (vd 200k–1tr) | 70–80% | 20–30% (cổng, CSKH, hoàn tiền, tiếp thị) |
| Báo cáo chuyên sâu do chuyên gia viết tay | Giá cố định | 70% | 30% |
| Bài/khoá học trả phí của chuyên gia | Giá cố định / hội viên | 60–70% | 30–40% |
| Quỹ nội dung (bài miễn phí kéo traffic) | — | Chia từ quỹ tháng theo lượt đọc thật (GSC + PostHog, lọc bot) | Quỹ = % doanh thu tháng |
| Gói Hội viên (tháng/năm): không giới hạn luận giải + bài trả phí | Phí tháng | Phần quỹ nội dung | Phần còn lại |

**Quan trọng — tách Sao khỏi tiền của chuyên gia:**

- **Sao vẫn không đổi ra tiền.** Người dùng **không** trả tư vấn 1:1 bằng Sao. Họ trả bằng VND ngay lúc đặt lịch.
- Lý do: nếu Sao đổi được ra dịch vụ của bên thứ ba mà bên đó nhận tiền thật, Sao bắt đầu giống phương tiện thanh
  toán / ví điện tử (cần giấy phép của Ngân hàng Nhà nước).
- Sao chỉ dùng cho tính năng **của chính nền tảng** (luận giải AI, báo cáo tự động). Thưởng bài cho bậc 1–2 trả bằng
  Sao, không trả bằng tiền.
- Chuyên gia bậc 3–4 nhận tiền theo hợp đồng.
  - Nền tảng khấu trừ thuế TNCN theo quy định (thường 10% với khoản chi từ 2 triệu đồng/lần cho cá nhân không ký
    HĐLĐ — **kế toán xác nhận**).
  - Có hoá đơn/chứng từ.

### 2.3 Thưởng mời gắn doanh thu (vẫn một tầng)

- Bạn được mời **nạp Sao lần đầu** → người mời nhận thêm Sao. Ví dụ: 10% số Sao của gói, trần 100 Sao/tháng.
  - Chỉ người mời trực tiếp được thưởng.
  - Không tính tiếp lên trên.
- Chuyên gia có **link giới thiệu riêng**: khách mới đặt tư vấn qua link → chuyên gia nhận thêm % của **chính buổi đó**
  (vì khách là của họ).
  - Không có hoa hồng từ khách của chuyên gia khác.

### 2.4 Rào chắn bắt buộc (đưa vào hợp đồng + quy tắc cộng đồng)

1. **Ranh giới nội dung giữ nguyên** cho cả tư vấn 1:1:
   - không phán hung, không "giải hạn", không bán vật phẩm/bùa;
   - không xổ số, không ngày chết, không chẩn đoán bệnh, không tuyển dụng thay người khác;
   - câu khủng hoảng → chuyển đường dây hỗ trợ.

   Vi phạm thì khoá ngay. Quy định xử phạt hành vi "hành nghề mê tín dị đoan" là rủi ro thật cho cả nền tảng.
2. **Không hứa thu nhập** khi tuyển chuyên gia ("kiếm 50 triệu/tháng"). Quảng cáo tuyển chỉ nêu cách chia doanh thu.
3. **Bảo vệ người tiêu dùng**:
   - giá công khai trước khi đặt;
   - chính sách huỷ/hoàn rõ (huỷ trước 24 giờ hoàn 100%, chuyên gia vắng hoàn 100%);
   - khiếu nại qua nền tảng.
4. **Dữ liệu**:
   - chuyên gia chỉ thấy thông tin khách tự chọn chia sẻ cho buổi đó (ngày sinh, câu hỏi);
   - không xuất danh sách khách;
   - ghi âm/ghi hình chỉ khi hai bên đồng ý.
5. **Chống gian lận**:
   - lượt đọc cho quỹ nội dung lọc bot, trần mỗi bài;
   - tự đặt lịch với chính mình để rút tiền bị chặn (cùng thiết bị/thẻ);
   - giữ tiền chuyên gia 7 ngày trước khi chi để xử lý hoàn tiền.
6. **E-E-A-T giữ nguyên**: không ghi ai là tác giả/thẩm định bài họ chưa viết/đọc (EEAT-1). Bài của người đóng góp ghi
   đúng tên họ + "Chủ biên duyệt xuất bản".

## 3. Doanh thu — cách ước tính (công thức, không phải dự báo)

```
Doanh thu tháng ≈ MAU × tỷ lệ trả tiền × ARPPU
               + số buổi tư vấn × giá TB × take rate
               + hội viên × phí tháng
```

| Ví dụ minh hoạ (giả định, KHÔNG phải số đo) | Giá trị |
|---|---|
| MAU | 100.000 |
| Tỷ lệ nạp Sao | 1,5% → 1.500 người × ARPPU 99k ≈ **148 triệu** |
| Tư vấn 1:1 | 20 chuyên gia × 15 buổi × 400k × 25% ≈ **30 triệu** (chuyên gia nhận ≈ 90 triệu) |
| Hội viên | 0,5% MAU × 79k ≈ **40 triệu** |

Đòn bẩy theo thứ tự hiệu quả/công sức:

1. Bật tài khoản + payOS (đã có code).
2. Gói hội viên.
3. Thưởng mời gắn lần nạp đầu.
4. Tư vấn 1:1 với 3–5 chuyên gia xác minh đầu tiên (thủ công trước, tự động sau).
5. Quỹ nội dung khi có ≥ 20 người đóng góp.

## 4. CMS cho chuyên gia & người dùng đóng góp — review và việc đã làm

### 4.1 Đã có (CMS-1 + PR này)

| Nhóm | Tính năng |
|---|---|
| Soạn thảo tiếng Việt | Lexical: H2–H4, đậm/nghiêng/gạch, danh sách, bảng, đường kẻ, link nội bộ chọn bài, link ngoài. Khối riêng: ghi chú (lưu ý/mẹo/tự soi/tóm tắt), mời dùng công cụ, trích dẫn có nguồn + dịch nghĩa, **video YouTube (mới)**. Nháp tự lưu 2 giây, 50 phiên bản, hẹn giờ xuất bản, xem trước trên web thật |
| Chuẩn hoá tiếng Việt (mới) | Tự **NFC** khi lưu: chữ dán từ Word/Mac ở dạng tổ hợp làm sai tìm kiếm, đếm ký tự, slug. Tự gộp khoảng trắng thừa, bỏ khoảng trắng trước dấu câu. Cảnh báo **trộn kiểu bỏ dấu** (hoà/hòa, thuỷ/thủy). Slug bỏ dấu đúng cả chữ "đ" |
| Media | Tự nén **WebP**; sinh 480/960/**1600 (mới)** px + ảnh chia sẻ 1200×630; điểm lấy nét; alt bắt buộc; nguồn/bản quyền ảnh; `srcset` đúng cỡ màn hình; ảnh lazy. Video qua YouTube chế độ ít cookie (không tự lưu video — xem `docs/LUU-TRU-MEDIA.md`) |
| SEO · GEO · E-E-A-T | Khung Kiểm định chấm khi gõ (tiêu đề, mô tả, slug, từ khoá, H2, link nội bộ, CTA công cụ, alt, Trả lời nhanh, FAQ, nguồn, danh sách/bảng, câu định nghĩa, chữ ký). **Lỗi chặn** không cho xuất bản (và từ nay không cho **gửi duyệt**) |
| Vai trò | Quản trị · Chủ biên · Biên tập viên · **Cộng tác viên (mới)** · Máy đọc |
| Quy trình duyệt (mới) | Cộng tác viên viết → "Gửi duyệt" → Chủ biên ghi "Cần sửa" + ghi chú hoặc xuất bản (tự thành "Đã duyệt"). Tổng quan có ô **Chờ duyệt** |

**Cộng tác viên bị giới hạn ở máy chủ, không chỉ ẩn nút** (test tích hợp 23/23):

- chỉ thấy và sửa nháp của chính mình; điều kiện lọc chạy ở cơ sở dữ liệu nên không đoán id mà mở được bài người khác;
- không xuất bản được;
- không đặt chữ ký E-E-A-T, canonical, noindex, ngày xuất bản;
- không sửa được ghi chú của Chủ biên;
- không tự đánh dấu "Đã duyệt";
- trang Tổng quan chỉ hiện số liệu và bài của chính họ.

### 4.2 Còn thiếu — lộ trình

| Mã | Việc | Vì sao |
|---|---|---|
| CG-2 | Form **"Đăng ký cộng tác"** trên web (tài khoản Supabase). Quản trị duyệt thì tạo tài khoản CMS vai trò Cộng tác viên, gửi email đặt mật khẩu | Hiện quản trị phải tạo tay |
| CG-3 | Email báo: Chủ biên khi có bài "Gửi duyệt"; tác giả khi "Cần sửa"/"Đã xuất bản" (Payload email + SMTP/Resend — **cần duyệt dependency**) | Không ai phải mở CMS để biết có việc |
| CG-4 | Hồ sơ chuyên gia đọc từ CMS (collection Tác giả: ảnh, tiểu sử, mảng, năm kinh nghiệm, huy hiệu xác minh) thay danh sách cứng `web/lib/chuyen-gia.ts`; nối tài khoản CMS ↔ hồ sơ tác giả | Lộ trình bậc 2–3 |
| CG-5 | Thưởng Sao tự động khi bài cộng tác được xuất bản (CMS gọi web → hàm SQL có khoá chống trùng theo id bài) | Động lực bậc 1 |
| CG-6 ✅ | Kiểm trùng nội dung với bài đã có + kho tri thức (luật cố định, không gọi AI) — **đã làm 2026-10-12**: vân tay cụm 5 từ (bỏ dấu), trùng ≥ 50% → chặn cộng tác viên gửi duyệt, ban biên tập chỉ cảnh báo; 20–50% cảnh báo; nút "Kiểm trùng nội dung" trong khung Kiểm định | Chặn chép bài |
| CG-7 | MFA TOTP cho tài khoản CMS (nhất là Chủ biên/Quản trị) | Nhiều người ngoài vào CMS hơn |
| CG-8 | Tư vấn 1:1: lịch hẹn, thanh toán payOS theo buổi, phòng gọi video (bên thứ ba), đánh giá sau buổi, ví thu nhập chuyên gia + đối soát chi | Doanh thu bậc 3–4. Cần pháp nhân + hợp đồng mẫu + luật sư |
| CG-9 | Gói Hội viên (thanh toán định kỳ — payOS chưa hỗ trợ tự trừ; làm dạng "mua 1/3/12 tháng", nhắc gia hạn) | Doanh thu ổn định |

Trình soạn còn có thể thêm:

- Kiểm chính tả tiếng Việt: hiện dựa vào trình duyệt; bật từ điển tiếng Việt trong Chrome/Edge là chạy ngay trong ô soạn.
- Gợi ý link nội bộ khi gõ (CMS-4).
- AI soạn nháp từng đoạn (CMS-2). Người duyệt vẫn là người.

## 5. Việc của anh

- Đọc mục 1 và chốt: **giữ một tầng, không làm đa cấp**. Em đã ghi vào CLAUDE.md dạng đề xuất. Anh đồng ý thì em
  đánh "đã chốt".
- Khi muốn mở bậc 3 (tiền thật cho chuyên gia), cần ba thứ:
  - pháp nhân/hộ kinh doanh;
  - luật sư soạn hợp đồng cộng tác + quy tắc cộng đồng;
  - kế toán tư vấn khấu trừ thuế.
- Tạo tài khoản Cộng tác viên đầu tiên trong CMS (Ban biên tập → Tạo → vai trò "Cộng tác viên / chuyên gia") để thử
  quy trình duyệt.
