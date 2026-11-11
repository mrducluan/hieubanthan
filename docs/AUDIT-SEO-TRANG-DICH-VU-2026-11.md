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

## 4. Đợt 2 (SEO-N2, anh duyệt "làm mục 1 → 6", 2026-11-10)

### 4.1 Rà từ khoá

Không có công cụ đo lượng tìm (Google gợi ý, Trends, Keyword Planner đều bị chặn mạng trong phiên). Em dựa vào: tiêu đề các trang
đang xếp hạng cho từng cụm (tìm web 10/11), cách người dùng gõ trong kho câu hỏi hỏi đáp, và hiểu biết thị trường. **Cần đối chiếu lại bằng
Search Console → Hiệu suất → Truy vấn sau 4 tuần** — số thật thắng mọi phỏng đoán.

| Trang | Cụm chính người ta gõ | Cụm phụ | Tiêu đề chốt |
|---|---|---|---|
| `/tu-vi` | xem tử vi, lá số tử vi | lá số tử vi trọn đời, lập lá số tử vi miễn phí | Xem Tử vi online: lập lá số Tử vi trọn đời miễn phí |
| `/bat-tu` | xem bát tự, tứ trụ | lá số bát tự, mệnh thiếu hành gì, ngũ hành | Xem Bát tự online: lá số Tứ trụ, ngũ hành thiếu gì |
| `/than-so` | thần số học, tra cứu thần số học | số chủ đạo, thần số học theo ngày sinh | Tra cứu thần số học online: số chủ đạo theo ngày sinh |
| `/kinh-dich` | gieo quẻ, gieo quẻ kinh dịch | xin quẻ, 64 quẻ | Gieo quẻ Kinh Dịch online miễn phí: xin quẻ hỏi việc |
| `/phong-thuy` | xem hướng nhà hợp tuổi | phong thủy nhà ở, hướng nhà theo tuổi | Xem hướng nhà hợp tuổi: phong thuỷ nhà ở online |
| `/nhan-tuong` | xem tướng mặt | nhân tướng học khuôn mặt | Xem tướng mặt online: nhân tướng học khuôn mặt |
| `/tarot` | xem tarot, rút bài tarot | ý nghĩa lá bài tarot | Xem Tarot online miễn phí: rút bài, ý nghĩa 78 lá |
| `/hop-doi` | xem hợp đôi, hợp tuổi vợ chồng | thần số học hợp đôi | Xem hợp đôi theo ngày sinh: thần số học hai người |
| `/xem-ngay-tot` | xem ngày tốt, lịch vạn niên | giờ hoàng đạo, ngày hoàng đạo | Xem ngày tốt hôm nay: lịch vạn niên, giờ hoàng đạo |

Mô tả meta 6 trang chính viết lại quanh đúng cụm trên (≤ 160 ký tự). Site viết "thuỷ"; người dùng gõ "thủy" nhiều hơn — Google coi hai
kiểu là một, `TU_KHOA_SITE` đã có cả hai, không đổi chính tả site. "Bói" không đưa vào tiêu đề (trái tinh thần "tham khảo, không phán").

### 4.2 Sáu mục

1. **Trả lời nhanh dưới H1** — 8 trang dịch vụ có một câu hỏi + trả lời 54–65 chữ (`tra_loi_nhanh` trong `lib/so-trang.ts`) trong
   `<details>` ngay dưới H1: chữ có trong HTML máy chủ cho Google / bot AI, gập lại để form nhập vẫn ở màn đầu. Mỗi câu kèm 1–3 link
   xuống cụm kiến thức.
2. **`/tu-vi` → "Tử vi năm {năm} theo tuổi"** — link trong khối Trả lời nhanh, năm = năm trang theo tuổi đang index (`namTuoiSeo`, tự
   sang 2028 khi menu sang năm). Kèm "12 tháng tới theo lá số của bạn" (`/thoi-gian-toi`).
3. **Liên kết về đúng trang dịch vụ bằng đúng từ khoá** — đoạn cuối CMS tự thêm vào bài (chuẩn hoá NotFair) giờ dùng "lập lá số Tử vi
   trọn đời của bạn", "tra cứu thần số học của bạn", "xem Bát tự (Tứ trụ) của bạn", "gieo quẻ Kinh Dịch…"; nút CTA chân bài blog đổi
   tương ứng. Liên kết từ site NGOÀI (fanpage, diễn đàn, đối tác) vẫn là việc của anh — xem `VIEC-CUA-ANH.md` 4al.
4. **Thương hiệu "hieuban"** — Organization + WebSite thêm `alternateName` "Hieuban", "Hiểu Bản"; chân trang ghi "Hiểu Bản Thân
   (hieuban.com)". `sameAs` mạng xã hội vẫn chờ anh đặt env `MXH_*` (không bịa link).
5. **Ảnh lá số mẫu** — `<img>` `/anh/la-so-tu-vi-mau.webp` (1024×1127, 94 KB, chụp từ lá số minh hoạ "Minh An" của
   `/tu-vi/la-so-mau/tu-phu-dong-cung`, không phải người thật) + alt "Lá số Tử vi mẫu 12 cung…", chú thích, `ImageObject`, mục
   "Lá số Tử vi trông thế nào?" cuối `/tu-vi`. Đổi giao diện lá số thì chụp lại.
6. **Cache HTML (Q-I3) — CHƯA làm, cần anh chọn** (xem 4.3).

### 4.3 Vì sao mục 6 chưa làm

Trang nhanh hơn chỉ đến từ việc **dựng sẵn HTML và cache ở CDN**. Nhưng toàn site đang dùng CSP-2: mỗi lượt xem một mã `nonce` mới để
chặn script lạ (XSS). Trang dựng sẵn thì không có nonce riêng từng lượt, nên muốn cache phải chọn một trong:

| Cách | Lợi | Đánh đổi |
|---|---|---|
| A. Trang kiến thức dùng CSP `'unsafe-inline'` cho script (bỏ nonce) | Phản hồi ~0,5 s → < 0,2 s cho ~600 trang | Lớp chặn XSS yếu đi trên 600 trang (đảo một phần CSP-2) |
| B. Tách root layout cho trang kiến thức + CSP theo hash | Giữ CSP chặt | Phải dời ~600 trang vào nhóm route mới; script nội dòng của Next đổi theo trang nên hash khó giữ — việc lớn, rủi ro vỡ đo lường GTM |
| C. Giữ nguyên, đo trước | Không rủi ro | Google vẫn tải ~0,5–0,6 s/trang |

Đo 10/11 (site thật, bot Googlebot, đã ấm): `/tu-vi` 0,51 s, trang sao ở cung 0,57–0,79 s, quẻ 0,64–0,98 s, trang ngày 0,60–0,80 s
(robots.txt 0,17 s = phần mạng). Em đề nghị **C tới mốc anh hẹn 19–26/11** (xem Thống kê thu thập: nếu "Thời gian phản hồi trung bình"
> 1.000 ms thì làm A cho riêng trang kiến thức; nếu < 600 ms thì không cần).

## 5. Đề xuất cũ (đã làm ở mục 4)


1. **Trang ý định "xem tử vi {năm}" / "tử vi trọn đời"**: `/nam/2027/tuoi-*` đã có; thêm một đoạn + link nổi bật từ `/tu-vi` sang "Tử vi năm 2027
   theo tuổi" (mùa Tết là đỉnh tìm kiếm của chữ "tử vi").
2. **Tên thương hiệu**: người dùng gõ "hieuban" nhưng thương hiệu hiển thị là "Hiểu Bản Thân". Thêm "hieuban.com" vào chân trang / trang giới
   thiệu dạng chữ, và khai `sameAs` mạng xã hội (env `MXH_*` còn trống) để Google dựng thực thể thương hiệu → có sitelinks dưới trang chủ.
3. **Liên kết ngoài về đúng trang dịch vụ**: bài NotFair / bài khách trỏ thẳng `/tu-vi`, `/bat-tu` bằng chữ "xem tử vi online", không trỏ trang chủ.
4. **GEO**: mỗi trang dịch vụ thêm khối "Trả lời nhanh" 40–60 chữ ngay dưới H1 (hiện chỉ trang kiến thức có) — câu AI dễ trích nhất.
5. **Q-I3 cache HTML** (đang chờ duyệt ở AUDIT-INDEX): phản hồi nhanh hơn → Google thu thập nhiều trang hơn mỗi ngày.
6. **Ảnh chụp lá số mẫu thật** (không phải SVG) trên `/tu-vi` có alt "lá số tử vi" → vào Google Hình ảnh, nơi chữ "lá số tử vi" có lượng tìm lớn.

## 6. Đợt 3 (SEO-O, 2026-11-10) — trang năm, lịch & tuổi trong menu "Năm" + "Huyền học"

**Đo trước khi sửa** (bản build cục bộ, đếm chữ trong `<main>`): không URL nào trong menu có `<img>` (chỉ SVG nội dòng — Google Hình ảnh không lấy); trang mỏng: `/lich-am` 188 chữ, `/lich-am/2027` 290, `/doi-lich-am-duong` 320, `/tuoi-xong-dat` 354, `/nam` 421, trang gốc công cụ ~450–500; các trang mục lục cụm (sao ở cung, mệnh theo năm, dấu hiệu…) không có câu trả lời ngắn.

**Đã làm:**
1. **Ảnh tóm tắt có chữ thật** `/og/tom-tat?kieu=…` (1080×1350, nền giấy sáng, QR + đường dẫn trang + hieuban.com) cho trang năm, sinh con, cưới hỏi, Tử vi theo tuổi, tuổi làm nhà (năm + tuổi), xông đất, sao hạn, hướng xấu, lịch âm, ngày, tháng. Ý chính do engine tính (`web/lib/tom-tat-anh.ts`, ≤ 6 dòng) — **cùng một hàm** dựng chữ trong ảnh, `alt`, chú thích và `ImageObject`, nên alt luôn khớp ảnh. `<img>` thật, có `width/height`, `loading=lazy`.
2. **Khối "… năm X: tóm tắt"** (`TomTatNam`) trên trang gốc công cụ (`/xem-tuoi-lam-nha`, `/tuoi-xong-dat`, `/xem-sao-han`, `/nam`, `/doi-lich-am-duong`, `/xem-ngay-tot`): câu trả lời nhanh của engine + ý chính + link bảng đầy đủ + ảnh. Trước đó trang gốc chỉ có ô nhập.
3. **Lịch âm**: engine `lich_nam` thêm ngày lễ âm lịch (Rằm tháng Giêng, Hàn thực, Giỗ Tổ, Phật đản, Đoan ngọ, Vu Lan, Trung thu, Hạ nguyên, ông Công ông Táo, giao thừa) + 4 câu hỏi đáp; route mới `GET /v1/lich/cac-nam` (bảng Tết nhiều năm). `/lich-am/{năm}` có bảng "Ngày lễ, ngày rằm", `/lich-am` có câu trả lời "Tết năm sau ngày nào", bảng Tết 15 năm, hỏi đáp FAQPage.
4. **Trang mục lục cụm** (`TrangChuDe`) có câu trả lời ngắn dưới lời dẫn (số trang lấy từ engine).

**Đo sau** (cục bộ): mọi URL trong hai ảnh menu có 1 ảnh có alt (trừ trang mục lục cụm — chỉ thêm câu trả lời); `/lich-am` 188 → 520 chữ, `/tuoi-xong-dat` 354 → 505, `/xem-tuoi-lam-nha` 519 → 696, `/nam` 421 → 567, `/doi-lich-am-duong` 320 → 424.

**Không làm (có lý do):** `/hop-doi`, `/thoi-gian-toi`, `/chan-dung` là công cụ cá nhân — ảnh tóm tắt cần dữ liệu người dùng, không có câu trả lời chung để vẽ. Dữ liệu lịch đã cache ở tầng fetch: URL engine thêm `?b=le` để bản cache cũ (thiếu `le`) không còn dùng sau deploy.

## 7. Đợt 4 (SEO-O2, 2026-11-11) — rà H1/H2/H3 cho AEO/GEO

Rà dàn ý heading 28 trang (năm, lịch & tuổi, ngày tốt, mục lục cụm, hub): **không lỗi cấu trúc** (đúng 1 H1, không nhảy cấp, không heading rỗng / trùng). Sửa phần nội dung heading để mỗi mục **tự đứng được** khi Google / AI trích riêng:
- Mục lục cụm: H2 "Tử Vi · 12", "1950–1959 · 10" → "Sao Tử Vi ở 12 cung", "Sinh năm 1950–1959 mệnh gì", "Số 3 hợp với số nào", "Ý nghĩa số kép 10–19", "Quẻ có quái trên Càn (Trời)", "Hoá Lộc ở 12 cung"; số trang dời ra ngoài H2.
- Trang ngày: "Giờ hoàng đạo", "Sách lịch ghi nên / kiêng", "Xuất hành", "Việc lớn hôm nay" (sai ở trang ngày khác) → "Giờ hoàng đạo ngày 20/11/2026", "Ngày 20/11/2026 nên làm gì / kiêng làm gì", "Hướng xuất hành ngày …", "Ngày … có hợp cưới hỏi, khai trương, động thổ?"; lịch tháng "Lịch âm dương tháng 11/2026".
- H1 dạng câu hỏi người ta gõ: `/nam`, `/lich-am`, `/phong-thuy/huong-xau-nam/{năm}`, `/tuoi-xong-dat/{năm}` (CMS vẫn ghi đè được).
- `/xem-ngay-tot`: khối tóm tắt hôm nay bỏ danh sách ý chính trùng thẻ ngày (giữ câu trả lời nhanh + ảnh).
