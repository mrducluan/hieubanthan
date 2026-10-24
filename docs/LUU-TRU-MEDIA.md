# Lưu ảnh/video cho CMS: Supabase Storage hay Cloudflare R2? (lập 2026-10-12)

> **Đẩy khâu:** 1 · Thu hút (ảnh nhanh, đúng cỡ → Core Web Vitals, Google Images). Nền móng chi phí.
> Giá dưới đây em ghi theo trang giá công khai mà em biết. **Anh mở supabase.com/pricing và
> developers.cloudflare.com/r2/pricing kiểm lại trước khi chốt**, vì hai bên đổi giá thường xuyên.

## 1. Kết luận ngắn

**Bây giờ dùng Supabase Storage** (bucket `cms-media`, như hướng dẫn mục CMS1). **Không** tự lưu video: video đăng
YouTube rồi chèn bằng khối "Video YouTube" trong CMS.

**Chuyển sang R2 khi** gặp một trong các mốc:

- ảnh vượt khoảng 50 GB;
- băng thông ảnh vượt khoảng 200 GB/tháng;
- buộc phải tự lưu video.

Lúc đó chỉ đổi biến `S3_*`, không sửa code.

## 2. So sánh

| Tiêu chí | Supabase Storage | Cloudflare R2 |
|---|---|---|
| Đã có tài khoản | **Có** (DB + Auth đang ở đây) | Phải tạo tài khoản Cloudflare + thẻ thanh toán |
| Miễn phí | Gói Free: khoảng 1 GB lưu + vài GB băng thông/tháng | 10 GB lưu/tháng, 1 triệu lệnh ghi + 10 triệu lệnh đọc/tháng |
| Lưu trữ khi vượt | Gói Pro (25 USD/tháng, GĐ2 đã định lên): khoảng 100 GB, sau đó khoảng 0,021 USD/GB | 0,015 USD/GB/tháng |
| **Băng thông ra (egress)** | Có tính phí khi vượt hạn mức gói; phần trúng cache CDN rẻ hơn | **0 USD** — điểm mạnh nhất của R2 |
| CDN | Có CDN sẵn cho bucket public | Cần gắn tên miền riêng (vd `anh.hieuban.com`) để có cache Cloudflare tốt |
| Payload CMS | `@payloadcms/storage-s3` qua cổng S3 của Supabase — **đã cấu hình** | Cùng plugin, chỉ đổi endpoint/khoá (R2 tương thích S3) |
| Vùng | Singapore (cùng DB) | Toàn cầu (Cloudflare tự phân phối) |
| Một nơi quản lý | Có — sao lưu, quyền, hoá đơn chung | Thêm một nhà cung cấp, thêm một hoá đơn |

**Ảnh của CMS đã được tối ưu trước khi lưu**:

- WebP chất lượng 78–82, nhiều cỡ 480/960/1600 px và ảnh chia sẻ 1200×630.
- Web dùng `srcset` nên điện thoại chỉ tải cỡ 480/960.

Một bài 5 ảnh tốn khoảng 1–2 MB lưu trữ. Mỗi lượt xem trên điện thoại tải khoảng 300–600 KB.

**Ước tính giai đoạn này:**

| Mốc | Lưu trữ | Băng thông |
|---|---|---|
| 200 bài | khoảng 0,3 GB | — |
| 50.000 lượt xem bài/tháng | — | khoảng 15–30 GB/tháng |

Gói Free của Supabase có thể chạm trần băng thông. Đến GĐ2 (lên Supabase Pro theo kế hoạch hạ tầng) thì hạn mức
Pro dư cho mức này.

## 3. Video

**Tự lưu video tốn kém và thiệt SEO:**

- Mỗi phút video HD khoảng 50–100 MB, mỗi lượt xem tải lại.
- Cần chuyển mã nhiều độ phân giải, ảnh bìa, phụ đề.
- Google xếp hạng video tốt nhất khi video ở YouTube (YouTube là công cụ tìm kiếm lớn thứ hai).

**Cách làm đã có trong CMS:**

1. Đăng video lên kênh YouTube của Hiểu Bản Thân, kèm tiêu đề, mô tả và link về bài viết.
2. Trong bài, chèn khối **"Video YouTube"**: dán link, ghi tiêu đề video.
   - Web nhúng qua `youtube-nocookie.com` (không cài cookie quảng cáo trước khi người đọc bấm phát).
   - Bộ lọc web chỉ nhận đúng dạng link này, các iframe khác bị bỏ.
   - Bản `.md` của bài ghi link video cho trợ lý AI.
3. Nếu sau này buộc phải tự lưu (video riêng tư, khoá học trả phí), dùng **Cloudflare Stream** hoặc R2 kèm trình
   phát HLS. Việc này cần thêm dependency, cập nhật CSP và một PR riêng.

## 4. Khi cần chuyển sang R2 (khoảng 30 phút, không sửa code)

Code đã sẵn cho R2 (cùng plugin `@payloadcms/storage-s3`, không thêm thư viện): "Kiểm tra kho ảnh" tự nhận R2 từ
endpoint, ký thử với vùng `auto`, báo endpoint dán kèm tên bucket, chỉ đúng chỗ tạo khoá trong bảng Cloudflare.

**Lưu ý tên miền ảnh:** R2 chỉ gắn **Custom domain** khi DNS của `hieuban.com` nằm ở Cloudflare (hiện ở GoDaddy). Hai cách:
(a) chuyển nameserver `hieuban.com` sang Cloudflare (miễn phí, giữ nguyên bản ghi; làm cẩn thận vì ảnh hưởng cả web +
email) rồi gắn `anh.hieuban.com`; (b) tạm dùng **r2.dev** (Settings → Public Development URL) — Cloudflare giới hạn tốc
độ và không khuyên dùng cho bản thật, chỉ để chạy trong lúc chờ (a).

1. Cloudflare → R2 → tạo bucket `cms-media`.
   - Settings → Public access → gắn **Custom domain** `anh.hieuban.com` (cách a) hoặc bật r2.dev (cách b).
2. R2 → Manage API tokens → tạo token quyền Object Read & Write cho bucket đó.
3. Chép ảnh cũ sang bằng `rclone copy` (hai đầu đều là S3). Giữ nguyên đường dẫn `cms/...`.
   (2026-10-24: Thư viện ảnh còn trống vì tải ảnh chưa từng chạy được → bỏ qua bước 3 và 6.)
4. Vercel project **cms**, đặt lại các biến:

   | Biến | Giá trị |
   |---|---|
   | `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
   | `S3_REGION` | `auto` |
   | `S3_BUCKET` | `cms-media` |
   | `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | khoá vừa tạo |
   | `S3_PUBLIC_URL` | `https://anh.hieuban.com` (hoặc `https://pub-….r2.dev` — gốc bucket, KHÔNG thêm `/cms-media`) |

   Sau đó Redeploy.
   Rồi CMS → Thư viện ảnh → **Kiểm tra kho ảnh** phải ra ✓ (dòng đầu ghi "Cloudflare R2").
5. Vercel project **web**: đổi `CMS_ANH_URL` = `https://anh.hieuban.com` (hoặc URL r2.dev) → Redeploy.
   - Bộ lọc HTML và CSP `img-src` đọc biến này nên tự nhận tên miền mới.
6. Ảnh trong bài cũ có URL cũ đã lưu trong HTML.
   - Bấm "Lưu" lại từng bài (hoặc em viết script dựng lại HTML) để đổi sang URL mới.
   - Giữ bucket Supabase vài tuần cho link cũ.

## 5. Sự cố tải ảnh 2026-10-24 và cách tự kiểm (BLOG-5)

- **Triệu chứng:** tạo ảnh trong CMS production báo "There was a problem while uploading the file." — Payload gom mọi
  lỗi trong bước xử lý ảnh thành một câu, chi tiết chỉ nằm trong log Vercel.
- **Nguyên nhân:** `@payloadcms/storage-s3` (bật khi đủ `S3_*`) thêm hai trường ẩn `prefix` + `_objectKey` vào collection
  Ảnh; migration được sinh lúc máy dev KHÔNG có S3 nên `cms.media` thiếu hai cột → câu select kiểm trùng tên tệp hỏng
  (`column "prefix" does not exist`). Tái hiện được bằng máy chủ S3 giả (`cms/tests/kho-anh-s3.ts`). Sửa: migration
  `20261024_045231_cot_kho_anh_s3` (up/down). **Bài học:** sinh migration cho collection Ảnh phải bật `S3_*` (giả cũng được).
- **Tự kiểm:** Thư viện ảnh → "Kiểm tra kho ảnh" (`GET /api/media/kiem-kho`, Chủ biên): sharp → ghi thử ảnh 16×16 → đọc
  lại URL công khai → xoá (dọn cả bản ghi mồ côi). Lỗi gốc được bắt từ logger, lọc khoá, dịch thành việc cần làm
  (`src/lib/kho-anh.ts`). Trên Vercel mà thiếu `S3_*` → chặn ngay với lời tiếng Việt (ổ đĩa chỉ đọc).
- **Trần cỡ ảnh 4,5 MB** (= giới hạn thân yêu cầu của hàm Vercel); CI chạy `npm run test:kho-anh` (S3 giả) + e2e tải ảnh
  bằng giao diện quản trị.

## 6. Sự cố lần 2 (2026-10-24): 403 SignatureDoesNotMatch — và lỗ hổng trong cách kiểm thử (BLOG-5b)

- **Triệu chứng:** sau khi có cột, "Kiểm tra kho ảnh" báo `SignatureDoesNotMatch` (HTTP 403); tạo ảnh báo "Something
  went wrong."; "Nhập vào CMS" bài NotFair báo "Chưa nhập được: The request signature we calculated does not match…".
- **Đọc mã Supabase Storage** (`src/storage/protocols/s3/signature-v4.ts`): mã khoá lạ → `AccessDenied "Invalid Access
  Key"`; còn `SignatureDoesNotMatch` nghĩa là mã khoá ĐÚNG nhưng (1) khoá bí mật sai / dính khoảng trắng, xuống dòng,
  ngoặc khi dán; hoặc (2) vùng khách ký khác vùng dự án (máy chủ ký lại bằng vùng của nó, trừ `auto` / `us-east-1`);
  hoặc (3) host endpoint khác host máy chủ dùng để ký.
- **Lỗ hổng kiểm thử của em:** S3 giả ở BLOG-5 **bỏ qua chữ ký** nên mọi khoá đều "đúng" — không bao giờ bắt được lỗi
  này. Nay `cms/tests/s3-gia.ts` **kiểm SigV4 như Supabase** (cả luật chọn vùng); `test:kho-anh` có ca khoá bí mật sai,
  sai vùng, mã khoá sai, biến dán bẩn, nhập bài NotFair khi kho lỗi — đã chạy với code cũ để chắc ca hỏng đúng chỗ.
- **Sửa:**
  1. `cauHinhS3()` — MỘT nguồn cấu hình cho plugin + bộ kiểm: bỏ khoảng trắng / xuống dòng / ngoặc thừa, gạch chéo cuối
     endpoint; checksum CRC32 mặc định của SDK chỉ gửi khi bắt buộc.
  2. "Kiểm tra kho ảnh" thêm bước **"Khoá + vùng S3 (ký thử, không ghi gì)"** — tự ký SigV4 một lệnh đọc bằng
     `node:crypto`; hỏng thì dò 17 vùng Supabase (R2: `auto`) và host còn lại của dự án → nói đúng biến cần sửa
     (`S3_SECRET_ACCESS_KEY` / `S3_REGION = …` / `S3_ENDPOINT` / `S3_ACCESS_KEY_ID` / bucket). Chỉ báo độ dài khoá.
  3. Lỗi THÔ của AWS SDK (plugin ném nguyên, Payload coi là 500 nên giấu thành "Something went wrong.") → `afterError`
     của Ảnh dịch sang tiếng Việt (viết liền: ô báo lỗi Payload cắt chữ ở ": " và ",").
  4. Nhập bài NotFair: ảnh tạo trong **giao dịch riêng** (trước dùng chung `req` → một ảnh lỗi huỷ cả bài); kho hỏng ở
     ảnh đầu thì dừng tải ảnh, **chữ vẫn nhập** thành nháp, ảnh thành đoạn `[Ảnh chưa nhập — <link>]` đúng chỗ; kiểm
     định chặn xuất bản khi còn đoạn đó (`anh_chua_nhap`).

