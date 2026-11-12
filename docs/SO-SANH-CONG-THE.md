# Nhận thẻ Visa / Mastercard khi anh đang là CÁ NHÂN — so sánh SePay · Lemon Squeezy · Paddle (2026-11-12)

> **Đẩy khâu:** 5 · Nạp Sao (người mua không có app ngân hàng Việt Nam: kiều bào, người nước ngoài). **Đo bằng:** tỉ lệ
> `checkout_started` → `payment_succeeded` theo cách trả, tỉ lệ người rời `/nap-sao` khi không có cách trả hợp.
>
> Bối cảnh: anh chốt dùng **Pay2S** thay payOS cho chuyển khoản QR (đã làm, PAY2S-1). Pay2S **không có** thanh toán
> thẻ — tài liệu docs.pay2s.vn chỉ có Collection Link (VietQR), IPN, huỷ đơn, lịch sử giao dịch, hoá đơn điện tử. Nên
> thẻ Visa / Mastercard phải đi qua một cổng khác.

## 1. Kết luận ngắn

- **Có, nhận thẻ qua cổng Việt Nam thì bắt buộc đăng ký kinh doanh.** SePay ghi rõ hồ sơ thẻ quốc tế cần *giấy phép
  kinh doanh của doanh nghiệp + tài khoản ngân hàng doanh nghiệp + hợp đồng*. VNPAY, OnePay cũng ký hợp đồng với đơn vị
  có đăng ký kinh doanh. Cá nhân không mở được.
- **Paddle loại hẳn**: chính sách của Paddle cấm *"digital services associated with pseudo-science, including …
  horoscopes, fortune-telling"* — đúng ngành của hieuban.com.
- **Lemon Squeezy là cách duy nhất ở dạng cá nhân**, nhưng rủi ro cao: cấm *"services of any kind"* và *"any products
  restricted by our payment processing partners"*; bán Sao (credit để đọc luận giải trên web khác) dễ bị coi là dịch vụ.
  Bị khoá cửa hàng thì tiền đang giữ cũng bị giữ.

**Em đề xuất:** giữ Pay2S QR cho người Việt (đa số người mua) ngay bây giờ; muốn nhận thẻ thì **đăng ký hộ kinh doanh**
trước, rồi hỏi SePay có nhận hộ kinh doanh cho thẻ quốc tế không (trang của họ chỉ ghi "doanh nghiệp"). Lemon Squeezy
chỉ xét cho khách nước ngoài trả USD (đúng hướng QTE-1), và **chỉ sau khi** bộ phận hỗ trợ của họ trả lời bằng văn bản
là chấp nhận sản phẩm này.

## 2. Bảng so sánh

| | **SePay — cổng thẻ quốc tế** | **Lemon Squeezy** | **Paddle** |
|---|---|---|---|
| Cá nhân đăng ký được? | **Không** — hồ sơ: giấy phép kinh doanh doanh nghiệp, TK ngân hàng doanh nghiệp, hợp đồng | **Có** (cá nhân, nhận tiền qua ngân hàng — Việt Nam có trong danh sách — hoặc PayPal) | Có (xác minh danh tính cá nhân) |
| Hộ kinh doanh? | Chưa rõ — trang chỉ ghi "doanh nghiệp", **phải hỏi SePay** | Không cần | Không cần |
| Ngành tử vi / bói toán | Không thấy cấm; SePay duyệt hồ sơ 3–7 ngày | Không nêu tên, nhưng cấm "dịch vụ" + mọi thứ đối tác xử lý thẻ cấm → **phải hỏi trước** | **Cấm rõ** (horoscopes, fortune-telling) |
| Thẻ nhận | Visa, Mastercard, JCB (3-D Secure) | Thẻ quốc tế, PayPal, ví | — |
| Tiền về | VND, tài khoản ngân hàng doanh nghiệp, 1 lần/ngày | USD → ngân hàng / PayPal | — |
| Phí (theo trang công bố) | 2.200đ + 2,2%/giao dịch (phí tách riêng) — bảng khác ghi 1,6–2,2% tuỳ hợp đồng | Bán hộ (merchant of record) — phí % + phí cố định mỗi đơn, lo thuế bán hàng quốc tế thay anh; em chưa kiểm lại mức phí hôm nay | — |
| Thuế / hoá đơn | Anh tự xuất hoá đơn (hộ kinh doanh / doanh nghiệp) | Lemon Squeezy là bên bán với khách → họ lo VAT/sales tax nước ngoài; thu nhập anh nhận về vẫn phải kê khai ở Việt Nam | — |
| Khách hợp | Người Việt có thẻ, kiều bào, người nước ngoài | Người nước ngoài trả USD (`/en`) | — |
| Rủi ro chính | Phải có pháp nhân trước | Bị khoá cửa hàng + giữ tiền nếu họ coi là vi phạm; Stripe mua Lemon Squeezy (2024), chính sách có thể đổi | Không dùng được |

## 3. Việc của anh nếu muốn nhận thẻ

1. **Đăng ký hộ kinh doanh** (có MST) — điều kiện chung cho mọi cổng thẻ Việt Nam và cho hoá đơn điện tử (Pay2S có sẵn
   luồng hoá đơn điện tử theo đơn, em nối được khi có MST).
2. Gọi / nhắn **SePay**: "hộ kinh doanh có đăng ký được cổng thẻ quốc tế không, ngành nội dung tử vi – thần số học có
   được duyệt không, phí áp dụng". Được thì gửi hồ sơ (3–7 ngày), lấy khoá sandbox → báo em làm (một đường thanh toán
   mới cạnh Pay2S, có migration thêm cổng).
3. (Tuỳ chọn, cho khách nước ngoài) Gửi Lemon Squeezy support mô tả: *"digital credits used to unlock automatically
   generated numerology / astrology reading reports on our website"* — chỉ khi họ trả lời chấp nhận bằng văn bản mới
   làm.

## 4. Nguồn (đọc ngày 12/11/2026)

- SePay — Cổng thanh toán thẻ quốc tế: https://sepay.vn/cong-thanh-toan-the-quoc-te.html (mục "Thủ tục đăng ký", bảng
  so sánh phương thức).
- Lemon Squeezy — Prohibited products: https://docs.lemonsqueezy.com/help/getting-started/prohibited-products ;
  Supported countries: https://docs.lemonsqueezy.com/help/getting-started/supported-countries
- Paddle — What am I not allowed to sell: https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle
- Pay2S — tài liệu API: https://docs.pay2s.vn/api/collection-link.html (không có API thẻ).
