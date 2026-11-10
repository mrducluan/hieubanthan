# SEO-N — vì sao tìm "tử vi hieuban" Google trả trang chủ (audit 2026-11-10)

Khâu của vòng tăng trưởng: **THU HÚT**. Đo: Search Console → Hiệu suất → lọc truy vấn chứa "tử vi" / "bát tự" / "kinh dịch"… →
tab Trang: tỉ lệ hiển thị + nhấp của trang dịch vụ so với trang chủ (trước / sau 2–4 tuần).

## 1. Đã kiểm trên site thật (10/11/2026, tải bằng user-agent Googlebot)

| Hạng mục | `/tu-vi` | Kết luận |
|---|---|---|
| Mã trả về, robots, canonical | 200 · `index, follow` · canonical tự trỏ · thẻ nằm trong `<head>` | Không lỗi |
| Sitemap, robots.txt | Có trong `sitemap.xml`, không bị chặn | Không lỗi |
| Chuyển hướng | `/tu-vi/`, `http://` → 308 một bước | Không lỗi |
| Nội dung máy chủ | H1 + ~2.600 chữ, FAQ, breadcrumb, schema riêng | Đủ |

→ Không phải lỗi kỹ thuật. Nguyên nhân nằm ở **tín hiệu từ khoá**.

## 2. Nguyên nhân

1. **Trang chủ tranh từ khoá với trang dịch vụ.** Tiêu đề trang chủ là "Thần số học, **Tử vi**, Bát tự online miễn phí — Hiểu Bản Thân"
   (SEO-K mục 5): vừa có "Tử vi" vừa có thương hiệu → khớp truy vấn "tử vi hieuban" tốt hơn chính trang `/tu-vi`.
2. **Trang dịch vụ không mang thương hiệu.** Tiêu đề dài hơn 52 ký tự thì bỏ hậu tố "· Hiểu Bản Thân"; 20 trang dịch vụ / trang trụ rơi
   vào nhóm này (`/tu-vi`, `/bat-tu`, `/than-so`, `/kinh-dich`, `/phong-thuy`, `/nhan-tuong`, `/tarot`, `/huyen-hoc`, `/kien-thuc`, `/nam`,
   `/nam/{năm}`, `/xem-ngay-tot`, `/xem-tuoi-lam-nha`, `/tuoi-xong-dat`, `/xem-sao-han`, `/chan-dung`, `/tu-dien`, `/doi-lich-am-duong`…).
   Tiêu đề `/tu-vi` cũ ("Lập lá số Tử vi online: 12 cung, đại hạn…") cũng không có chữ "xem tử vi".
3. **Schema nói ứng dụng nằm ở trang chủ.** `WebApplication` của cả site (url = trang chủ, featureList có "Tử vi: lá số 12 cung…") phát trên
   MỌI trang, kể cả `/tu-vi`.
4. **Chữ liên kết nội bộ chung chung.** ~600 trang kiến thức trỏ về trang dịch vụ bằng "Xem của tôi", "Lá số của tôi".
5. **H1 một chữ trần** ở `/kinh-dich`, `/phong-thuy`, `/nhan-tuong`, `/tarot`.
6. (Không sửa được bằng code) Truy vấn có tên thương hiệu là truy vấn điều hướng — Google thường đặt trang chủ lên đầu và trang con ngay dưới.
   Site mới mở 08/10/2026, Google còn đang thu thập (xem `docs/AUDIT-INDEX-2026-11.md`).

## 3. Đã sửa (SEO-N)

- Tiêu đề trang chủ: **"Hiểu Bản Thân — Thần số học và huyền học online miễn phí"** (thương hiệu + cửa chính thần số; không còn "Tử vi, Bát tự").
- Tiêu đề trang dịch vụ: từ khoá đứng đầu + ≤ 54 ký tự để luôn có "· Hiểu Bản Thân" (ngưỡng hậu tố 52 → 54, tổng vẫn ≤ 70):

| Trang | Tiêu đề mới (chưa kể hậu tố) |
|---|---|
| `/tu-vi` | Xem Tử vi online: lập lá số Tử vi miễn phí |
| `/bat-tu` | Xem Bát tự online: lập lá số Tứ trụ miễn phí |
| `/than-so` | Thần số học online: tính số chủ đạo theo ngày sinh |
| `/kinh-dich` | Gieo quẻ Kinh Dịch online miễn phí: 64 quẻ, 384 hào |
| `/phong-thuy` | Xem phong thuỷ nhà ở: hướng hợp tuổi, bố cục nhà |
| `/nhan-tuong` | Xem tướng mặt online: Tam đình, Ngũ quan, 12 cung |
| `/tarot` | Xem Tarot online miễn phí: rút bài, ý nghĩa 78 lá |
| `/huyen-hoc` | Huyền học là gì? Bảy môn huyền học xem online miễn phí |
| `/kien-thuc` | Thư viện kiến thức huyền học và thần số học |
| `/nam`, `/nam/{năm}` | Xem theo năm: năm con gì, Tam tai, làm nhà, xông đất · Năm {năm} là năm con gì, mệnh gì? Tết, Tam tai |
| `/xem-sao-han`, `/chan-dung`, `/tu-dien`, `/doi-lich-am-duong`, `/hom-nay`, `/sinh-o-nuoc-ngoai`, bảng theo năm | rút gọn ≤ 54 ký tự |

- H1: "Gieo quẻ Kinh Dịch: việc này nên hay chưa?" · "Xem phong thuỷ: nhà này có hợp bạn không?" · "Xem tướng mặt: gương mặt bạn nói gì?" ·
  "Xem Tarot: rút bài cho điều bạn đang hỏi" (CMS vẫn ghi đè được).
- Schema: `WebApplication` của site chỉ phát ở trang chủ, có `hasPart` trỏ tới `WebApplication` của từng trang dịch vụ.
- Nút mời cuối trang kiến thức: "Lập lá số Tử vi của tôi", "Gieo quẻ Kinh Dịch", "Xem phong thuỷ nhà tôi"… theo trang đích.
- Sitemap: priority trang dịch vụ 0,7 → 0,9 (Google bỏ qua, Bing có đọc).
- Test: `web/e2e/seo-k.spec.ts` (hai ca SEO-N) khoá lại — 26 URL phải có thương hiệu trong tiêu đề, ≤ 70 ký tự, đúng một H1.

Chữ CMS đã xuất bản ở "Trang website" vẫn thắng mặc định trong code. Không engine, không migration, không dependency.

## 4. Đề xuất tiếp (chờ anh chọn)

1. **Trang ý định "xem tử vi {năm}" / "tử vi trọn đời"**: `/nam/2027/tuoi-*` đã có; thêm một đoạn + link nổi bật từ `/tu-vi` sang "Tử vi năm 2027
   theo tuổi" (mùa Tết là đỉnh tìm kiếm của chữ "tử vi").
2. **Tên thương hiệu**: người dùng gõ "hieuban" nhưng thương hiệu hiển thị là "Hiểu Bản Thân". Thêm "hieuban.com" vào chân trang / trang giới
   thiệu dạng chữ, và khai `sameAs` mạng xã hội (env `MXH_*` còn trống) để Google dựng thực thể thương hiệu → có sitelinks dưới trang chủ.
3. **Liên kết ngoài về đúng trang dịch vụ**: bài NotFair / bài khách trỏ thẳng `/tu-vi`, `/bat-tu` bằng chữ "xem tử vi online", không trỏ trang chủ.
4. **GEO**: mỗi trang dịch vụ thêm khối "Trả lời nhanh" 40–60 chữ ngay dưới H1 (hiện chỉ trang kiến thức có) — câu AI dễ trích nhất.
5. **Q-I3 cache HTML** (đang chờ duyệt ở AUDIT-INDEX): phản hồi nhanh hơn → Google thu thập nhiều trang hơn mỗi ngày.
6. **Ảnh chụp lá số mẫu thật** (không phải SVG) trên `/tu-vi` có alt "lá số tử vi" → vào Google Hình ảnh, nơi chữ "lá số tử vi" có lượng tìm lớn.
