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

1. Cloudflare → R2 → tạo bucket `cms-media`.
   - Settings → Public access → gắn **Custom domain** `anh.hieuban.com`. Không dùng `r2.dev` cho bản thật.
2. R2 → Manage API tokens → tạo token quyền Object Read & Write cho bucket đó.
3. Chép ảnh cũ sang bằng `rclone copy` (hai đầu đều là S3). Giữ nguyên đường dẫn `cms/...`.
4. Vercel project **cms**, đặt lại các biến:

   | Biến | Giá trị |
   |---|---|
   | `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
   | `S3_REGION` | `auto` |
   | `S3_BUCKET` | `cms-media` |
   | `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | khoá vừa tạo |
   | `S3_PUBLIC_URL` | `https://anh.hieuban.com` |

   Sau đó Redeploy.
5. Vercel project **web**: đổi `CMS_ANH_URL` = `https://anh.hieuban.com` → Redeploy.
   - Bộ lọc HTML và CSP `img-src` đọc biến này nên tự nhận tên miền mới.
6. Ảnh trong bài cũ có URL cũ đã lưu trong HTML.
   - Bấm "Lưu" lại từng bài (hoặc em viết script dựng lại HTML) để đổi sang URL mới.
   - Giữ bucket Supabase vài tuần cho link cũ.
