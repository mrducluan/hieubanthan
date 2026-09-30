# Đề xuất mô hình kinh tế cộng đồng — Hiểu Bản Thân

> Trạng thái: **ĐỀ XUẤT chờ chủ dự án duyệt** (2026-09-30). Phần credit + thưởng mời (bước 1) đã code trong PR CR-C
> nhưng **chưa có thanh toán**. Mọi nhận định pháp lý dưới đây là **khảo sát sơ bộ, cần luật sư xác nhận** trước khi
> mở thu tiền / trả tiền cho cộng đồng.
>
> Nhãn: **[SỰ THẬT]** có nguồn · **[SUY LUẬN]** lập luận từ sự thật · **[GIẢ ĐỊNH]** con số cần đo lại.

## 1. Câu hỏi của chủ dự án

Muốn một cơ chế "token / cộng đồng" để: (a) tăng người dùng, (b) người dùng trải nghiệm và **mua credit**,
(c) cộng đồng **kiếm tiền** dựa trên sản phẩm — xem cho người khác, mời người mới được token/credit **đổi ra tiền**.

## 2. Kết luận ngắn

**Không phát hành token đổi được ra tiền.** Thay bằng mô hình 3 tầng tách bạch *điểm* và *tiền*:

| Tầng | Người dùng nhận | Đổi ra tiền? | Khi nào |
|---|---|---|---|
| 1. **Sao** (credit nội bộ) | Mua bằng tiền, hoặc được tặng khi mời bạn / góp ý / đóng góp nội dung | **Không** — chỉ dùng trong app, không chuyển nhượng | Ngay (Phase 1–3) |
| 2. **Đối tác giới thiệu** (affiliate/KOC) | **Tiền mặt**: % doanh thu Sao của người họ mời, **một tầng**, 12 tháng | Có — qua hợp đồng, khấu trừ thuế | Khi đã có doanh thu Sao (Phase 4) |
| 3. **Người luận giải** (creator/master) | **Tiền mặt**: bán buổi tư vấn / báo cáo trên nền tảng, nền tảng thu phí | Có — qua nền tảng, khấu trừ thuế | Phase 6–7 (Blueprint: Marketplace) |

"Kiếm tiền từ sản phẩm" đi qua **tầng 2 và 3** (tiền thật, có hợp đồng), **không** qua việc quy đổi điểm.
Điểm (tầng 1) là công cụ tăng trưởng + tiêu dùng; tiền (tầng 2–3) là thu nhập của cộng đồng.

## 3. Vì sao không làm token đổi ra tiền / hoa hồng nhiều tầng

1. **Blueprint v1.1** xếp *Blockchain* và *Crypto token* vào **Non-goals**; *Credit ledger* là **bắt buộc trước khi
   kiếm tiền**; *Marketplace* ở **Phase 7 — HOLD**, cần rà soát pháp lý/niềm tin riêng. [SỰ THẬT — TECHNICAL-BLUEPRINT-v1.1 §2, §43, ADR]
2. **Tài sản mã hoá:** Luật Công nghiệp công nghệ số 2025 (hiệu lực 01/01/2026) mới công nhận tài sản số; thị trường
   tài sản mã hoá đang **thí điểm** theo Nghị quyết 05/2025/NQ-CP — chỉ tổ chức được Bộ Tài chính cấp phép với vốn rất
   lớn mới được tổ chức thị trường / chào bán. Một startup tự phát hành token đổi tiền nằm ngoài khung này. [SỰ THẬT —
   cần luật sư xác nhận chi tiết điều kiện]
3. **Điểm đổi được ra tiền ≈ ví điện tử / tiền điện tử**: giữ tiền của người dùng rồi trả lại là hoạt động trung gian
   thanh toán, cần giấy phép Ngân hàng Nhà nước (NĐ 52/2024/NĐ-CP về thanh toán không dùng tiền mặt). [SUY LUẬN — cần xác nhận]
4. **Hoa hồng nhiều tầng** (người mời được hưởng từ người được mời của người được mời…) là **kinh doanh theo phương
   thức đa cấp** — phải có giấy chứng nhận đăng ký, ký quỹ, đào tạo… (NĐ 40/2018/NĐ-CP, sửa đổi NĐ 18/2023/NĐ-CP).
   → Mọi thưởng chỉ **một tầng**. [SỰ THẬT về khung; áp dụng cụ thể cần luật sư]
5. **Rủi ro "mê tín dị đoan"**: Luật Tín ngưỡng, tôn giáo 2016 (Điều 5) cấm hoạt động mê tín dị đoan; NĐ 38/2021/NĐ-CP
   có chế tài. Dịch vụ "xem bói lấy tiền" dễ bị quy vào đây nếu hứa hẹn, phán điều xấu, bán vật phẩm hoá giải. →
   Định vị **văn hoá – tham khảo – phát triển bản thân**, cấm hứa hẹn/phán hung/bán bùa, giữ các chặn hiện có (khủng
   hoảng, ngày chết, bệnh, xổ số). Đây là rủi ro lớn nhất của tầng 3. [SỰ THẬT về khung; ranh giới cần luật sư]
6. **Thuế khi trả tiền cho cá nhân**: từ 01/07/2025 nền tảng số có chức năng thanh toán phải khấu trừ, nộp thay thuế
   cho cá nhân kinh doanh trên nền tảng (NĐ 117/2025/NĐ-CP). Trả hoa hồng/cát-xê còn liên quan thuế TNCN. [SỰ THẬT về
   khung — kế toán xác nhận cách áp dụng]
7. **Dữ liệu cá nhân**: ngày giờ sinh, nơi sinh là dữ liệu cá nhân (NĐ 13/2023; Luật Bảo vệ dữ liệu cá nhân 2025 hiệu
   lực 01/01/2026). Người luận giải xem hồ sơ khách = chia sẻ dữ liệu cho bên thứ ba → cần đồng ý riêng từng lần.

## 4. Mô hình đề xuất chi tiết

### Tầng 1 — Sao (credit nội bộ) · làm ngay

- **Kiếm Sao (miễn phí):**
  - Mời bạn: **cả hai +20 Sao** khi người được mời *tạo tài khoản + hoàn tất bài đọc đầu tiên* (thưởng hai phía — mô
    hình Dropbox/Uber; tăng tỷ lệ nhận lời mời). Trần **20 lượt thưởng/người mời/tháng**.
  - Chào mừng: +10 Sao khi lưu hồ sơ vào tài khoản.
  - Góp ý được duyệt, câu hỏi hay được đưa vào kho, đóng góp nội dung KB được chuyên gia duyệt: +10…+50 Sao.
- **Tiêu Sao** (chỉ cho thứ có **chi phí biên thật** — không khoá phần cốt lõi đang miễn phí):
  - Luận giải chi tiết bằng AI (LLM) cho câu hỏi riêng · báo cáo năm/tháng cá nhân (PDF) · hợp đôi chuyên sâu nhiều
    người · phong thuỷ xem ảnh/video (LLM thị giác — xem `docs/LO-TRINH-PHONG-THUY-HINH-ANH.md`).
- **Mua Sao** (Phase 3, khi đo được "muốn trả tiền"): gói gợi ý **29k = 30 Sao · 99k = 120 · 199k = 270**. [GIẢ ĐỊNH —
  thử giá A/B]. Cổng: payOS/VietQR (phí thấp), MoMo, VNPay.
- **Quy tắc bắt buộc:** Sao **không đổi ra tiền, không chuyển nhượng, không mua bán giữa người dùng**; Sao tặng có hạn
  12 tháng; Sao mua ghi rõ điều khoản hoàn tiền (Luật Bảo vệ quyền lợi người tiêu dùng 2023).
- **Kỹ thuật:** sổ cái bất biến (ledger) — số dư = tổng giao dịch, mỗi giao dịch có khoá chống ghi trùng (đã làm ở CR-C).

### Tầng 2 — Đối tác giới thiệu (tiền thật) · khi có doanh thu Sao

- Ai cũng đăng ký làm đối tác (KOC/TikToker/fanpage thần số, thầy/cô…), ký **hợp đồng dịch vụ điện tử**.
- Nhận **20–30% doanh thu Sao** từ người dùng họ mời trong **12 tháng**, **một tầng**. Ngưỡng rút 500.000đ, trả hàng
  tháng, khấu trừ thuế theo quy định.
- Chống gian lận: chỉ tính giao dịch thành công sau thời hạn hoàn tiền; chặn tự mời (cùng tài khoản thanh toán / thiết
  bị); đối soát thủ công khi vượt ngưỡng.
- Vì sao hiệu quả: tận dụng người có sẵn khán giả, **chỉ trả tiền khi đã có doanh thu** (không đốt tiền trước).

### Tầng 3 — Người luận giải (tiền thật) · Phase 6–7

- **3a. Không gian Pro cho người luận giải** (thuê bao, [GIẢ ĐỊNH] 199k–499k/tháng): lập lá số / thần số / bát tự cho
  khách bằng engine của mình, quản lý hồ sơ khách (khách đồng ý), xuất báo cáo PDF mang thương hiệu riêng, trang hồ sơ
  công khai. **Làm trước marketplace** vì: có doanh thu sớm, người luận giải tự mang khách tới (tăng user), rủi ro pháp
  lý thấp hơn (mình bán công cụ, không bán "xem bói").
- **3b. Marketplace tư vấn**: người dùng đặt buổi chat/gọi video với người luận giải đã xác minh; thanh toán qua nền tảng
  (giữ tiền tới khi xong buổi), nền tảng thu **20–25%**, có đánh giá, hoàn tiền, khiếu nại, kiểm duyệt. Bộ quy tắc hành
  nghề bắt buộc: không phán sống chết/bệnh tật, không bán vật phẩm hoá giải, không thu thêm ngoài nền tảng.

## 5. So sánh khả thi

Thang 1–5 (5 = tốt). Điểm do em chấm, cần chủ dự án điều chỉnh.

| Phương án | Pháp lý an toàn | Thời gian ra tiền | Chi phí làm | Hợp giai đoạn Blueprint | Tăng user | **Tổng** |
|---|---|---|---|---|---|---|
| Sao + thưởng mời hai phía (tầng 1) | 5 | 2 | 5 | 5 | 4 | **21** |
| Pro workspace cho người luận giải (3a) | 4 | 4 | 3 | 3 | 4 | **18** |
| Bán Sao cho nội dung chuyên sâu (tầng 1 trả phí) | 4 | 4 | 4 | 4 | 2 | **18** |
| Đối tác giới thiệu một tầng (tầng 2) | 3 | 3 | 3 | 3 | 5 | **17** |
| Marketplace tư vấn (3b) | 2 | 3 | 1 | 1 | 3 | **10** |
| Token đổi ra tiền / crypto | 1 | 1 | 1 | 1 | 3 | **7 — loại** |
| Hoa hồng nhiều tầng | 1 | 3 | 3 | 1 | 4 | **12 — loại (đa cấp)** |

## 6. Lộ trình gắn với Blueprint

| Giai đoạn | Việc | Cổng đi tiếp (đo bằng PostHog) |
|---|---|---|
| Phase 1 (hiện tại) | Sổ cái Sao + thưởng mời hai phía (**đã code, chưa thu tiền**) | ≥ 20–50 người thật dùng; tỷ lệ đọc xong, tỷ lệ chia sẻ |
| Phase 2 | Đo vòng lan: `share_clicked → referral_signup → compatibility_created` | K-factor, tỷ lệ nhận lời mời |
| Phase 3 | Mở mua Sao cho 1–2 nội dung chuyên sâu; thử giá | Tỷ lệ trả tiền, ARPPU, chi phí LLM/doanh thu < 20% |
| Phase 4 | Đối tác giới thiệu một tầng (hợp đồng + thuế) | Doanh thu qua đối tác, gian lận < 2% |
| Phase 6 | Pro workspace cho người luận giải (10 người thử nghiệm) | Giữ chân thuê bao tháng 2 ≥ 60% |
| Phase 7 | Marketplace tư vấn — sau rà soát pháp lý riêng | Tranh chấp, hoàn tiền, đánh giá |

## 7. Kinh tế đơn vị (ví dụ để đo, không phải dự báo)

[GIẢ ĐỊNH] Một câu trả lời LLM chi tiết ≈ 2–4 nghìn token → vài trăm đồng với model rẻ qua OpenRouter; một lần xem ảnh
phong thuỷ (5–10 ảnh, model thị giác) ≈ 1–5 nghìn đồng. Nếu 1 Sao ≈ 800đ và một lượt xem ảnh tốn 10 Sao (8.000đ) thì
biên gộp > 50% sau phí cổng thanh toán. Script `unit_economics.py` trong bộ Venture Architect dùng để tính lại khi có
số thật.

## 8. Việc cần chủ dự án quyết

1. Duyệt tên "Sao" và mức thưởng (20/20 khi mời, 10 chào mừng, trần 20 lượt/tháng).
2. Duyệt migration `0008_credit.sql` (đã có `.down.sql`) — chạy sau 0006/0007.
3. Thuê luật sư rà: (a) ranh giới "mê tín dị đoan" cho tầng 3, (b) hợp đồng đối tác + thuế, (c) điều khoản Sao.
4. Chọn cổng thanh toán cho Phase 3.
