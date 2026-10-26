# Thẻ & ảnh chia sẻ (TCS-1, 2026-10-21)

Khâu vòng tăng trưởng: **MỜI** (chính) — mọi ảnh rời khỏi site (xem trước link trên Zalo/Messenger, ảnh đăng story,
ảnh lá số tải về) đều mang **mã QR + chữ "hieuban.com"** để người thấy ảnh quay về được, kèm mã `?tu=` để đo
`share_clicked` → `referral_signup` (Gate 2, K-factor). Chỉ số: số `referral_signup` theo tiền tố `tu`
(`/quan-tri/tang-truong`), tỉ lệ `share_clicked / share_created` theo `kind`.

## Quy tắc chung

- **Dữ liệu trên thẻ chỉ từ mã có ký HMAC** (`lib/ma-moi.ts`, khoá `LOI_MOI_SECRET`, mỗi loại một tiền tố miền riêng:
  hồ sơ/lời mời không tiền tố, thẻ ngày `ngay|`, thẻ hai người `hai|`, thẻ Bản đồ 5 mảng `bd|`, thẻ nhà `nha|`, thẻ quẻ `que|`). Mã chỉ mang tên hiển thị người dùng tự gõ + con
  số engine đã tính — **không ngày sinh, không can chi / con giáp / mệnh** (đủ để suy năm sinh), không bảng DB, hết hạn
  90 ngày. Máy chủ tự gọi engine rồi mới ký (client không tự khai số). Web không tự tính.
- **Mã QR**: `lib/qr.ts` — bộ mã hoá tự viết (byte UTF-8, mức M, phiên bản 1–10, chọn mặt nạ theo luật N1–N4 của
  ISO/IEC 18004), không thêm thư viện. Golden `web/e2e/fixtures/qr-golden.json` sinh bằng hai bộ mã hoá độc lập
  (qrcodegen của Project Nayuki — so cả mặt nạ tự chọn; thư viện Python `qrcode` — ép cùng mặt nạ), kiểm từng ô ở
  `web/e2e/qr.spec.ts`; sinh lại bằng `web/scripts/qr-golden/` trong venv tạm (không phải dependency). Ô tối trên nền
  sáng, vùng yên tĩnh 4 ô.
- **QR trỏ đâu**: URL thẻ + `?tu=` nếu vừa **phiên bản 8** (≤ 152 byte — mã thưa, quét được cả khi ảnh bị nén); dài hơn
  thì URL dự phòng = bước kế tiếp của người nhận + cùng `?tu=` (`urlQr` trong `lib/the-chia-se.ts`). Mã `?tu=` có dạng
  `<2 chữ>.<10 hex>` (mẫu `MAU_TU`, khớp `GhiVaoTrang`): suy từ mã thẻ (`tuTuMa`, không cần lưu) hoặc do máy người gửi
  tạo ngẫu nhiên (thẻ ngày, ảnh tải về). Ảnh luôn ghi `hieuban.com` và QR luôn trỏ `https://hieuban.com` kể cả khi xem
  trên bản thử nghiệm.
- **Thiết kế**: "Đêm sao phương Đông", mỗi loại một concept; phông Be Vietnam Pro + Newsreader (OFL, `assets/fonts`)
  để có đủ dấu. 1200×630 cho xem trước link, **1080×1350** (`&khung=doc`) cho ảnh tải về / story. Phần dùng chung:
  `lib/og-chung.tsx` (phông, khối QR, chân QR, sao rải tất định). Lưu ý satori: thành phần con trong `<svg>` phải gọi
  như hàm, không dùng fragment, định vị bằng `top/left`.
- **Ảnh tải về từ trình duyệt** (`lib/tai-anh-svg.ts`, `lib/tai-anh-html.ts`) đi qua `lib/chan-anh.ts`: khung viền
  + dải chân (tên mảng, hieuban.com, QR `/<trang>?tu=ta.<ngẫu nhiên>`) theo giao diện đang xem (nền sáng → Giấy cổ,
  tối → Đêm sao); ảnh hẹp (điện thoại) xếp chữ ba dòng. Mọi nơi gọi tự có, không phải sửa từng trang.

## Danh mục thẻ / ảnh (đã rà toàn bộ `ImageResponse`, `app/og`, `app/the`, `app/chia-se`, `app/hop-doi/[ma]`,
`components/chia-se`, `lib/tai-anh-*`)

| Thẻ / ảnh | Route ảnh · nơi tạo · trang nhận | Nội dung (chỉ từ mã ký) | Concept | QR trỏ | `?tu` / đo | Khâu |
|---|---|---|---|---|---|---|
| Thẻ hồ sơ (Metaphysics ID) | `/og?ma=` (+`&khung=doc` khi tải) · `/chia-se` (`NutChiaSe` loai card) · `/the/[ma]` | tên hiển thị, 4 số cốt lõi, từ khoá đường đời | Vòng số 1–9, bốn số nối thành chòm sao riêng | `/the/<mã>?tu=th.…` nếu vừa v8, thường dự phòng `/?tu=th.…` (tạo hồ sơ) | `share_created{card}`, `share_clicked{card}` (GhiMoThe) + `{th}` | MỜI |
| Lời mời hợp đôi (thần số) | `/og?ma=&kieu=moi` · `/hop-doi`, khung "Xem hợp với ai" (`NutChiaSe` invite) · `/hop-doi/[ma]` | tên người mời, số đường đời, từ khoá | Hai quỹ đạo đan nhau: một có số, một còn "?" | `/hop-doi/<mã>?tu=hd.…` nếu vừa, thường `/hop-doi?tu=hd.…` | `share_created{invite}`, `share_clicked{invite}` + `{hd}` | MỜI |
| Thẻ ngày "Hôm nay … là Ngày cá nhân N" (NHIP-1) | `/og/ngay?ma=&tu=` (+`&khung=doc` khi tải) · `NutChiaSeNgay` (trang chủ), nút chia sẻ ở `/hom-nay` · `/hom-nay?tu=&the=` | tên hiển thị, ngày cá nhân, chủ đề, số nổi bật, ngày xem | Đêm nay: trăng lưỡi liềm, dãy núi chân trời, số ngày như vì sao sáng nhất | `/hom-nay?tu=hn.…` (đúng mã của link đã gửi; thiếu thì suy từ mã thẻ) | `share_created{the_ngay / hom_nay}`, `share_clicked{hn}` | QUAY LẠI + MỜI |
| **Thẻ Điểm hai người (MỚI)** | `/og/hai?ma=` (+`&khung=doc` khi tải) · "Xem lá số 2 người" ở `/tu-vi` → "Chia sẻ thẻ điểm" (`NutChiaSeHai`, `POST /api/chia-se/hai`) · `/the/hai/[ma]` | tên NGƯỜI GỬI (tuỳ chọn, trống = "Bạn"); người kia KHÔNG ghi tên (SAO-V, NĐ 13/2023) — hiện theo quan hệ ("Người yêu", "Bạn đời", "Người bạn", "Đồng nghiệp", "Đối tác", còn lại "Người ấy"); mã cũ có tên người kia cũng không hiện; quan hệ, điểm 0–100, mức, ≤ 3 tiêu chí cao nhất (%) | Vòng điểm ở giữa + hai chòm sao hai bên nối vào nhau | `/the/hai/<mã>?tu=hp.…` (mã gói mảng + chữ ký 16 ký tự → ~135 byte, v7–8) | `share_created{hai_nguoi, hai_nguoi_anh}`, `share_clicked{hp}` (GhiTu/GhiVaoTrang), lời mời → `/tu-vi?tu=hp.…#hop-tham` (tự mở khối) | MỜI |
| **Thẻ Bản đồ 5 mảng (CTA-1, MỚI)** | `/og/ban-do?ma=` (+`&khung=doc` — bản chính khi tải) · khối "Đọc tiếp về bạn" cuối mọi trang công cụ → "Tạo thẻ “5 mảnh ghép làm nên tôi”" (`NutTheBanDo`/`KhungTheBanDo`, `POST /api/chia-se/ban-do` → engine `/v1/ban-do-5-mang`) · `/the/ban-do/[ma]` (noindex) | tên hiển thị (≤ 24), đường đời + từ khoá, nhật chủ + hình ảnh, chính tinh cung Mệnh, cung phi + hướng tốt, quẻ đầu ngày tạo thẻ, 3 lựa chọn trò đoán, mã biến thể câu mời — **không** ngày giờ sinh, can chi năm, con giáp, nạp âm | Chòm sao năm điểm sáng nối nhau (mỗi mảng một biểu tượng), ánh vàng; trên ảnh đường đời là "?" để người xem đoán | `/the/ban-do/<mã>?tu=bd.…` nếu vừa v8, thường dự phòng `/?tu=bd.…` (tạo hồ sơ) | `share_created{ban_do, ban_do_anh, bien_the}`, `share_clicked{bd}` (GhiTu), `guess_played{dung, bien_the}`, lời mời → `/?tu=bd.…` + `cross_cta_clicked{tu=the_ban_do, bien_the}` | MỜI |
| **Thẻ xông đất theo năm (TCS-XD, MỚI)** | `/og/xong-dat?nam=&tu=` (+`&khung=doc` khi tải; cũng là ảnh chia sẻ của trang `/tuoi-xong-dat/{năm}`) · `NutChiaSeXongDat` ở "Trả lời nhanh" của trang năm và dưới kết quả công cụ `/tuoi-xong-dat` · trang nhận = trang năm (index được) | **chỉ dữ liệu công khai của NĂM** (engine `/v1/tuoi/xong-dat-nam`): can chi năm, mùng 1 + can chi ngày, 4 giờ hoàng đạo đầu, Hỷ thần/Tài thần — **không** tuổi gia chủ, **không** danh sách tuổi hợp (suy ngược được con giáp gia chủ) → không cần ký mã | Bước chân đầu năm: cánh cửa ngày Tết hé ánh vàng, hai đèn lồng, nhành mai, dấu chân đi vào cửa | `/tuoi-xong-dat/{năm}?tu=xd.…` (năm ngoài bảng ≥ 2006 / engine lỗi → `/tuoi-xong-dat`) | `share_created{xong_dat}`, `share_clicked{xd}` (GhiVaoTrang) | MỜI (mùa Tết) |
| **Thẻ "Nhà của bạn" (UI-PT2 P7, MỚI)** | `/og/nha?ma=` (+`&khung=doc` khi tải) · dưới bài đọc "Nhà của bạn" ở `/phong-thuy` → "Chia sẻ sơ đồ nhà" (`NutChiaSeNha`, `POST /api/chia-se/nha` → máy chủ gọi engine `/v1/phongthuy/luan-giai` đọc lại rồi ký) · `/the/nha/[ma]` (noindex) | tên hiển thị (tuỳ chọn), **hướng nhà 1 trong 8** (không độ la bàn), loại nhà, mức chương "Ngôi nhà này với bạn", ≤ 6 phòng [phòng, phương, mức] — **không** địa chỉ, toạ độ, năm xây, năm sinh, mệnh quái (mệnh + giới tính suy ra khoảng năm sinh), người cùng ở | Sơ đồ Cửu cung 3×3 tô màu theo mức (lục · xám-lam · hổ phách, không đỏ), mũi tên vàng ở ô phía cửa, nền đêm sao xanh thẫm | `/the/nha/<mã>?tu=nh.…` nếu vừa v8, dự phòng `/phong-thuy?tu=nh.…` | `share_created{nha, nha_anh}`, `share_clicked{nh}` (GhiTu), lời mời → `/phong-thuy?tu=nh.…#nha-cua-ban` | MỜI |
| **Thẻ "Quẻ của tôi" (UI-KD 6, MỚI)** | `/og/que?ma=` (+`&khung=doc` khi tải) · dưới khối quẻ ở `/kinh-dich` → "Chia sẻ quẻ" (`NutChiaSeQue`, `POST /api/chia-se/que` → máy chủ gọi engine `/v1/kinhdich/khoi-que` với đúng 6 giá trị hào (gieo tay, tất định, không ghi nhật ký hỏi đáp) để lấy tên quẻ bản / biến rồi ký; tên chủ đề đối chiếu danh mục `/v1/kinhdich/chu-de`) · `/the/que/[ma]` (noindex) | tên hiển thị (tuỳ chọn, ≤ 24), **6 giá trị hào** (dữ kiện đã gieo), tên quẻ bản + quẻ biến, tên chủ đề — **không** câu hỏi, **không** giờ gieo, **không** lời đọc / mức / ứng kỳ | Sáu vạch quẻ dựng lớn giữa trời đêm, hào động vàng có quầng, mũi tên sang quẻ biến | `/the/que/<mã>?tu=qu.…` nếu vừa v8 (mã gói mảng + chữ ký 16 ký tự → ~90–110 byte), dự phòng `/kinh-dich?tu=qu.…` | `share_created{que, que_anh}`, `share_clicked{qu}` (GhiTu), lời mời → `/kinh-dich?tu=qu.…` | MỜI |
| Ảnh trang kiến thức / tác giả / lá số mẫu / tuổi hợp hướng | `/og?tieu_de=` (metadata `metaTrang`, `TrangKienThuc`, `TrangChuDe`, `tac-gia`, `la-so-mau`, `huong-hop-tuoi`, CMS) | tiêu đề bài (chữ công khai) | Trang sách mở dưới trời sao | `https://hieuban.com` | — | THU HÚT |
| Ảnh mặc định (không mã / mã hỏng) | `/og`, `/og/ngay`, `/og/hai` | lời mời chung | như concept từng loại | trang chủ / `/hom-nay` / `/tu-vi#hop-tham` | — | THU HÚT |
| Ảnh lá số Tử vi tải về | `taiAnhSvg` ở `app/tu-vi/TuVi.tsx` (client) | lá số đang xem | Khung Đêm sao / Giấy cổ theo giao diện đang chọn + dải chân | `/tu-vi?tu=ta.<ngẫu nhiên>` | `share_created{tai_anh}`, `share_clicked{ta}` | MỜI |
| Ảnh tứ trụ Bát tự tải về | `taiAnhHtml` ở `app/bat-tu/BatTu.tsx` (client — **không sửa file này**, tự có qua helper) | tứ trụ đang xem | như trên | `/bat-tu?tu=ta.<ngẫu nhiên>` | như trên | MỜI |
| **Hình minh hoạ trang kiến thức (2026-10-26, MỚI)** | SVG nội dòng `components/minh-hoa/MinhHoa.tsx` trên ~600 trang KB (`TrangKienThuc`) — dải chân `ChanHinh` | chỉ đường dẫn trang (công khai) | hình của từng loại trang (nền Đêm sao; cụm dấu hiệu nhà ở nền giấy sáng) + dải "hieuban.com · đường dẫn · Quét để mở bài này" | `https://hieuban.com<đường dẫn trang>` (QR cạnh = số ô × 2 px) | — | THU HÚT |
| **Ảnh vẽ cho bài blog (BLOG-7, 2026-10-26 thêm QR)** | `veAnhBia` / `veAnhTomTat` ở `cms/src/lib/anh-minh-hoa.ts` (chuẩn hoá bài NotFair) | tiêu đề, sapo, tiêu đề mục (chữ công khai) | nền giấy sáng + hoạ tiết mảng; chân: hieuban.com + link bài + QR (ô 3 px) | `https://hieuban.com/blog/<slug chuẩn>` | — | THU HÚT |
| **12 ảnh bài khởi tạo BLOG-6 (2026-10-26 thêm QR)** | tệp PNG `cms/src/bai-khoi-tao/anh/` (gắn một lần bằng sharp; ảnh thân bài nối dải chân 128 px, ảnh bìa QR góc dưới phải để giữ 1600×900) · migration dữ liệu `anh_qr_bai_khoi_tao` thay tệp ảnh đã nhập (giữ id) | như ảnh gốc | như ảnh gốc + link bài + QR | `https://hieuban.com/blog/<slug bài>` | — | THU HÚT |
| `app/apple-icon.tsx` | biểu tượng site | — | — | không áp dụng (không phải ảnh chia sẻ) | — | — |

Ảnh mẫu đã kiểm (OpenCV giải mã QR ra đúng URL trên mọi ảnh, kể cả ảnh tải về Giấy cổ, Đêm sao và bản điện thoại).
2026-10-26: 12 ảnh BLOG-6, ảnh bìa + tóm tắt CMS, hình minh hoạ trang kiến thức (màn hình thường 1×, điện thoại 3×, nền sáng + nền tối)
đều giải mã ra đúng URL trên ảnh nguyên. **Quy tắc**: cạnh QR = (số ô + 8 ô lề) × px NGUYÊN — cạnh lẻ (vd 2,67 px/ô) làm mờ cạnh ô,
máy quét khó đọc mã phiên bản lớn (link dài).

## Khi thêm thẻ mới

1. Hàm ký riêng miền trong `lib/ma-moi.ts` (tiền tố mới), mã ngắn nếu muốn QR trỏ thẳng thẻ.
2. Route ảnh dùng `lib/og-chung.tsx` → bắt buộc `ChanQr` (QR + hieuban.com); concept khác các thẻ đã có.
3. `?tu=` tiền tố 2 chữ mới, ghi vào bảng trên; e2e: ký/giải mã, mã giả bị chặn, trang nhận, ảnh 200 `image/png`,
   không lộ ngày sinh.

## Trò "Đoán số" + biến thể câu mời (CTA-1)

Trang nhận thẻ Bản đồ 5 mảng giấu đường đời của người gửi; người nhận chọn 1 trong 3 số (đáp án + 2 số khác do engine
chọn tất định, nằm trong mã đã ký) → thẻ lật ra đáp án + từ khoá (KB), đúng thì sao lấp lánh → "Giờ tới lượt bạn — 30
giây để có bản đồ của riêng mình". Không lưu gì. Câu chữ (tiêu đề thẻ, lời mời, câu đoán, câu sau đoán, nút) có 3 biến
thể trong `lib/the-ban-do.ts`; máy chủ chọn ngẫu nhiên lúc ký và ghi vào mã (`b`) → ảnh, trang nhận và sự kiện cùng một
biến thể; so ở `/quan-tri/tang-truong` (khung "Khối Đọc tiếp · thẻ Bản đồ 5 mảng"). Giữ biến thể thắng khi đủ ≥ 300 lượt
mỗi biến thể. Chuyển động (điểm sáng bật lần lượt, đường nối vẽ dần, số đếm lên, viền sáng chạy ở nút, lật thẻ) tắt khi
người dùng chọn giảm chuyển động.
