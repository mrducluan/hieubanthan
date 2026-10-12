# Kế hoạch thanh toán nạp Sao — trong nước và quốc tế (TT-0 lập 2026-10-11 · TT-1/TT-2 ĐÃ LÀM 2026-10-12)

> **Đẩy khâu:** 5 · Nạp Sao. **Đo bằng:**
> - phễu `checkout_viewed` → `checkout_started` → `payment_succeeded`;
> - tỷ lệ trả tiền trên người dùng hoạt động, ARPPU;
> - tỷ lệ hoàn tiền / khiếu nại;
> - thời gian từ bấm "Nạp" tới khi có Sao (mục tiêu dưới 30 giây với QR).
>
> **2026-10-12 — anh chốt làm luôn theo hình thức CÁ NHÂN** (đăng ký hộ kinh doanh bổ sung sau). Đã làm TT-1 + TT-2
> (payOS/VietQR), xem mục 0b. Thẻ Visa/Master, ví, quốc tế (TT-3…TT-5) vẫn cần pháp nhân/hợp đồng cổng.

## 0b. Đã làm (2026-10-12) — anh bật thế nào

**Code (không thêm dependency):**

- **Migration `0012_thanh_toan`** (+ `.down.sql`):
  - Bảng `goi_sao`: 3 gói 29k/30 · 99k/110 · 199k/240 Sao.
  - Bảng `don_nap`.
  - Hàm `tao_don_nap`, `huy_don_nap`.
  - Hàm `nap_sao_tu_cong`: chỉ service role, idempotent theo mã đơn, sai số tiền thì không cộng.
  - Hàm `hoan_don_nap`: chủ sở hữu qua MFA, ghi bút toán trừ lại, ghi nhật ký.
  - Hàm `ds_don_nap`, `don_cho_doi_soat`.
  - Test SQL `supabase/kiem_thu/thu_thanh_toan.sql` chạy trong CI (job `supabase`).
- **payOS gọi REST trực tiếp** (`web/lib/thanh-toan/payos.ts`, `fetch` + `node:crypto`). Chữ ký đối chiếu vector sinh
  bằng SDK chính thức `@payos/node` (`web/e2e/thanh-toan.spec.ts`).
- **Trang người mua:**
  - `/nap-sao`: chọn gói, rồi sang trang payOS quét QR bằng app ngân hàng/ví bất kỳ.
  - `/nap-sao/ket-qua`: tự hỏi trạng thái; nếu webhook lỡ thì máy chủ tra thẳng payOS.
  - Nút **Nạp Sao** ở ví Sao.
  - Khi thiếu Sao lúc xem Luận giải, trang báo kèm lối tới `/nap-sao`.
- **Máy chủ:**
  - `/api/thanh-toan/webhook/payos`: chỉ tin chữ ký.
  - `/api/thanh-toan/doi-soat`: cron hằng ngày + tra khi người mua đang chờ.
  - Cổng **giả** `THANH_TOAN_GIA=1` để thử trọn luồng trên bản preview. Production không bao giờ bật cổng giả.
- Điều khoản mục Sao: thêm mua, hoàn tiền 7 ngày, không lưu số thẻ.
- Sự kiện PostHog: `checkout_viewed` → `checkout_started` → `payment_succeeded`.

**Anh làm (thứ tự):**

1. **Bật tài khoản** (VIEC-CUA-ANH mục F) — Sao gắn tài khoản. Chưa bật thì `/nap-sao` hiện gói + "đang chuẩn bị mở".
2. **Chạy migration `0012_thanh_toan.sql`** trên Supabase (SQL Editor). Kiểm bằng `supabase/kiem_thu/da_chay_chua.sql`.
3. **Đăng ký payOS** (payos.vn) bằng tài khoản ngân hàng **cá nhân** của anh.
   - Điều kiện cá nhân/hộ kinh doanh xem trên trang đăng ký payOS.
   - Nếu payOS chỉ nhận doanh nghiệp/hộ kinh doanh: làm hộ kinh doanh trước (TT-a) hoặc báo em chuyển sang cổng nhận
     tài khoản cá nhân (vd SePay — cùng giao diện `lib/thanh-toan`).
4. payOS → Kênh thanh toán → lấy **Client ID, API Key, Checksum Key**.
5. Vercel (project web) → Environment Variables (**Production**, không `NEXT_PUBLIC_`):

   | Biến | Giá trị |
   |---|---|
   | `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | từ payOS |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (chỉ máy chủ dùng) |
   | `CRON_SECRET` | chuỗi ngẫu nhiên ≥ 16 ký tự |

   Sau đó Redeploy.
6. payOS → Kênh thanh toán → **Webhook URL** = `https://hieuban.com/api/thanh-toan/webhook/payos` → Lưu.
   - payOS gửi thử một webhook; web trả 200 là đạt.
7. Thử thật bằng gói 29k → thấy "Đã nhận 30 Sao". Hoàn tiền thủ công (nếu cần):
   - chuyển trả tiền ngoài hệ thống;
   - rồi gọi `hoan_don_nap(mã đơn, lý do)` (giao diện quản trị cho việc này nằm ở lộ trình QT).
8. Thuế/hoá đơn khi thu bằng tài khoản cá nhân: hỏi kế toán (doanh thu cá nhân kinh doanh vẫn phải kê khai).
   - Có hộ kinh doanh/MST thì em làm TT-6 hoá đơn điện tử.

## 0. Điều kiện trước khi thu tiền (chặn — không làm thì không bật)

1. **Pháp lý** (VIEC-CUA-ANH mục E):
   - đơn vị vận hành có MST;
   - thông báo website TMĐT bán hàng với Bộ Công Thương;
   - điều khoản: Sao là credit dùng trong dịch vụ, **không đổi ra tiền, không chuyển nhượng**, chính sách hoàn tiền;
   - hoá đơn điện tử cho mỗi lần nạp.
2. **Bật tài khoản** (mục F): Sao gắn với tài khoản. Hiện web chưa bật đăng nhập.
3. **Qua Gate 2** (mục L), hoặc anh chủ động quyết thu sớm.

## 1. Ranh giới sản phẩm (giữ nguyên)

- **Sao** = credit nội bộ. Không phát hành token hay crypto, không cho rút, không bán lại giữa người dùng.
- Phần cốt lõi giữ miễn phí. Sao dùng cho thứ có chi phí thật: Luận giải toàn bộ (10 Sao), AI sâu, báo cáo PDF.
- Không dùng dark pattern: không đếm ngược giả, không "sắp hết hạn" để ép nạp, giá luôn ghi bằng VND.

## 2. Gói đề xuất (đổi được trong `/quan-tri/cai-dat`, không cần sửa code)

| Gói | Giá | Sao | Ghi chú |
|---|---|---|---|
| Thử | 29.000 ₫ | 30 | đủ 3 báo cáo |
| Phổ biến | 99.000 ₫ | 110 | +10% (gắn nhãn "Phổ biến") |
| Gia đình | 199.000 ₫ | 240 | +20%, hợp người xem cho cả nhà / hợp đôi |
| Quốc tế | 4,99 USD / 9,99 USD | 50 / 110 | chỉ hiện khi chọn thanh toán quốc tế |

## 3. Cổng thanh toán — chọn theo người mua

| Người mua | Phương thức | Cổng đề xuất | Vì sao |
|---|---|---|---|
| Việt Nam, đa số | **Chuyển khoản QR (VietQR)** — quét bằng app ngân hàng bất kỳ | **payOS** (ưu tiên 1) | phí thấp nhất; Sao vào ngay qua webhook có chữ ký; không cần người mua có ví |
| Việt Nam | Ví MoMo / ZaloPay | MoMo (sau), ZaloPay (sau) | người trẻ quen dùng ví; mở deeplink trên điện thoại |
| Việt Nam + quốc tế | **Thẻ Visa / Mastercard / JCB** | **VNPay** hoặc **OnePay** (cổng thẻ quốc tế cấp phép tại VN) | nhận thẻ nước ngoài, tiền về tài khoản VND của pháp nhân VN |
| Kiều bào, người nước ngoài | PayPal, Apple Pay / Google Pay qua thẻ | PayPal; hoặc **merchant of record** (Paddle / Lemon Squeezy — kiểm tra có nhận pháp nhân VN không) | MoR lo thuế quốc tế; phí ~5% + 0,5 USD |
| Crypto (USDT…) | — | **Chưa làm** | xem mục 4 |

**Stripe** hiện không mở tài khoản cho pháp nhân Việt Nam. Muốn dùng phải có pháp nhân nước ngoài (Singapore/Mỹ), nên
để GĐ3 nếu doanh thu quốc tế đủ lớn.

## 4. Crypto — vì sao không làm THANH TOÁN bằng crypto (nhưng có trang ỦNG HỘ)

- Từ 01/01/2026, Luật Công nghiệp công nghệ số công nhận **tài sản số** là tài sản. Thị trường crypto đang thí điểm có
  cấp phép theo Nghị quyết 05/2025/NQ-CP (2025–2030).
- **Crypto vẫn không được dùng làm phương tiện thanh toán** tại Việt Nam (NHNN). Ngoại lệ duy nhất là thí điểm USDT cho
  khách du lịch ở Đà Nẵng.
- Nhận USDT để bán Sao cho người dùng Việt Nam = dùng crypto làm phương tiện thanh toán. **Rủi ro pháp lý cao, không làm.**
- Có thể xét lại khi có cả hai điều kiện:
  - được luật sư xác nhận;
  - thu qua đơn vị được cấp phép (sàn trong chương trình thí điểm, hoặc pháp nhân nước ngoài chỉ bán cho người mua
    ngoài Việt Nam).
- Người dùng quốc tế đã có thẻ, PayPal, ví điện tử nên không thiệt.

**Ủng hộ nhà phát triển (anh yêu cầu 2026-10-12) — đã làm:**

- Nơi hiển thị:
  - trang `/ung-ho`;
  - nút "Ủng hộ đội ngũ phát triển" ở chân trang;
  - thẻ nhỏ cuối bài blog, cuối `/hom-nay`, mục trong `/gioi-thieu`.
- Nội dung là **quà tặng tự nguyện**: không phải mua hàng, không đổi ra Sao, không kèm quyền lợi, không hoàn. Không
  gắn với tính năng nào nên không thành "thanh toán bằng crypto".
- Anh khai ở Vercel (env máy chủ):
  - `UNG_HO_VI` = mỗi ví một mục `Tên mạng|địa chỉ`, ngăn bằng `;`. Ví dụ:
    `USDT (TRC20)|T…;Bitcoin|bc1…`
  - (tuỳ chọn) `UNG_HO_NGAN_HANG` = `Ngân hàng|Số TK|Chủ TK`.
  - Chưa khai thì không hiện gì.
- Rủi ro còn lại, anh tự quyết:
  - tiền mã hoá nhận về vẫn là thu nhập phải kê khai;
  - đổi ra VND qua sàn chưa được cấp phép là rủi ro pháp lý;
  - hỏi kế toán/luật sư.

## 5. Trải nghiệm mua (một trang, ít bước nhất)

1. Bấm "Nạp Sao" ở ví Sao, hoặc khi thiếu Sao lúc xem Luận giải toàn bộ (giữ nguyên trang đang đọc).
2. Chọn gói. Mặc định chọn gói "Phổ biến", hiện giá VND và số Sao.
3. Chọn cách trả, theo tab (nhớ lựa chọn lần trước):
   - **QR ngân hàng** (mặc định ở VN);
   - **Ví**;
   - **Thẻ**;
   - **Quốc tế** (tự hiện trước nếu trình duyệt không ở VN).
4. Thanh toán và nhận Sao:
   - **QR:** hiện mã QR + số tiền + nội dung CK có sẵn. Trên điện thoại có nút "Mở app ngân hàng".
   - Đơn giữ 15 phút, trang tự cập nhật trạng thái.
   - Webhook về thì **cộng Sao ngay**, hiện "Đã nhận 110 Sao". Quay lại đúng trang đang dùng.
5. Sau khi thanh toán:
   - gửi email biên nhận + hoá đơn điện tử;
   - lịch sử nạp xem ở `/tai-khoan`.
6. Lỗi hoặc huỷ: báo rõ, giữ đơn, có nút thử lại. Nút liên hệ hỗ trợ có sẵn mã đơn.

## 6. Kiến trúc kỹ thuật (theo 4 tầng — thanh toán không chạm CALC)

```
web /nap-sao ──► /api/thanh-toan/tao-don (máy chủ, phiên Supabase)
                   └─ bảng don_nap (migration, RLS chủ sở hữu) ── tạo link/QR ở cổng (khoá bí mật chỉ ở env)
cổng ──webhook──► /api/thanh-toan/webhook/{cong}
                   ├─ kiểm chữ ký (HMAC của cổng) + số tiền + trạng thái
                   └─ SQL SECURITY DEFINER nap_sao(ma_don) — idempotent theo mã đơn, ghi bút toán sổ cái Sao (đã có)
```

**Cơ sở dữ liệu**

- Migration `0012_thanh_toan` (+ `.down.sql`):
  - Bảng:
    - `goi_sao`: giá, Sao, tiền tệ, bật/tắt; sửa trong quản trị.
    - `don_nap`: mã đơn, người dùng, gói, số tiền, cổng, trạng thái, `ma_giao_dich_cong`, thời điểm.
  - Hàm `nap_sao()`:
    - chỉ cộng một lần cho mỗi đơn;
    - từ chối khi số tiền không khớp gói;
    - ghi `nhat_ky_quan_tri` khi quản trị hoàn tiền thủ công.
- **Không lưu số thẻ** (cổng giữ), không lưu thông tin ngân hàng người mua.

**Code web**

- `lib/thanh-toan/{payos,vnpay,momo,paypal}.ts`: mỗi cổng một bộ chuyển đổi chung giao diện
  `taoDon` / `kiemWebhook` / `traCuu`. Cổng nào chưa có khoá thì nút ẩn.
- Phần lớn cổng chỉ cần `fetch` + `node:crypto` (HMAC), **không cần thêm dependency**. Cần SDK thì hỏi trước.
- **Đối soát:** mỗi giờ một job tra cổng các đơn "đang chờ" quá 15 phút, để không mất Sao khi webhook lỡ.
  `/quan-tri/nguoi-dung` thêm tab "Đơn nạp" để tra cứu và hoàn tiền thủ công kèm lý do.

**Bảo mật**

- Webhook chỉ tin chữ ký, không tin tham số trên URL quay về.
- Số tiền luôn lấy từ bảng `goi_sao` ở máy chủ, không lấy từ trình duyệt.
- CSP: thêm tên miền cổng vào `lib/csp.ts` (`connect-src`, `frame-src` nếu cổng nhúng iframe) + test `e2e/csp.spec.ts`.

## 7. Thứ tự làm (mỗi bước một PR)

| Bước | Nội dung | Điều kiện |
|---|---|---|
| TT-1 ✅ | Migration 0012 + hàm nạp idempotent + test SQL; `/nap-sao` + cổng giả cho preview; sự kiện PostHog | bật tài khoản |
| TT-2 ✅ | payOS (VietQR) thật + webhook + đối soát (email biên nhận: sau, cần SMTP) | tài khoản payOS (cá nhân) + env |
| TT-3 | VNPay/OnePay (thẻ nội địa + Visa/Master/JCB) | hợp đồng cổng |
| TT-4 | MoMo / ZaloPay | hợp đồng ví |
| TT-5 | Quốc tế: PayPal hoặc MoR, giá USD | xác nhận cổng nhận pháp nhân VN |
| TT-6 | Hoá đơn điện tử tự động (nhà cung cấp HĐĐT anh chọn) | MST |

**Kiểm thử mỗi bước:**

- test SQL (cộng một lần, sai số tiền bị từ chối, hoàn tiền);
- e2e luồng mua với cổng giả: QR, webhook trùng, webhook sai chữ ký, hết hạn đơn;
- QX trên điện thoại 390 px.

## 8. Anh cần chuẩn bị

- Pháp nhân / hộ kinh doanh + MST.
- Tài khoản ngân hàng doanh nghiệp (payOS cần để nhận tiền).
- Đăng ký payOS (đơn giản nhất, làm trước).
- Liên hệ VNPay hoặc OnePay nếu muốn nhận thẻ quốc tế.
- Luật sư rà điều khoản Sao + hoàn tiền.
- Chọn nhà cung cấp hoá đơn điện tử.

Nguồn tham khảo về crypto:

- PwC (12/2025): khung pháp lý tiền mã hoá Việt Nam.
- Lexology: khung thí điểm tài sản mã hoá.
- CoinReporter (05/2026): Luật Công nghiệp công nghệ số có hiệu lực.
- Lightspark (2026): crypto tại Việt Nam.

Trước khi làm TT-5 / crypto cần kiểm lại với luật sư, vì quy định đang thay đổi.
