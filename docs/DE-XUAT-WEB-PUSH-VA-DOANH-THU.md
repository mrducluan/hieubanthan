# Đề xuất: Web Push → thói quen quay lại → cài web app → doanh thu (2026-10-22, chờ chủ dự án duyệt)

Khung: vòng **Thu hút → "à, đúng mình" → Quay lại → Mời bạn → Nạp Sao** (`MUC-TIEU-TANG-TRUONG.md`). Ranh giới giữ nguyên:
không doạ, không đếm ngược giả, Sao không đổi ra tiền, thưởng mời một tầng, tối đa **một** thông báo/ngày, mọi thông báo
đều do người dùng tự bật và tắt được một chạm. Mỗi ý tưởng ghi: khâu đẩy · cách đo · cần gì · rủi ro. ★ = em đề xuất làm trước.

## 0. Vì sao Web Push là đòn bẩy lớn nhất đang có

- Mọi thứ "quay lại" hiện nay (Hôm nay, nhịp ngày, Tháng này nhà bạn, mốc nhắc) đều **chờ người dùng nhớ mà mở**. Push là
  kênh duy nhất site **chủ động** gọi được họ về mà không cần email/SMS (không cần thêm nhà cung cấp, không tốn tiền/lượt).
- Web Push trên Android/máy tính hoạt động ngay; trên iPhone chỉ khi **đã thêm vào màn hình chính** → Web Push tự nó là
  lý do thuyết phục người dùng iPhone cài web app (tỉ lệ cài web app là chỉ số anh hỏi).
- Thông báo đúng là "có giá trị mới mỗi ngày" (định nghĩa "nghiện" trong CLAUDE.md) **chỉ khi nội dung là của chính họ**
  và họ đã chọn nhận. Vì vậy mọi đề xuất dưới đây đều là **nhắc theo lựa chọn**, không phải "tin nóng".

## 1. Web Push — từ GĐ1 (nhắc mốc) lên "kênh nhịp cá nhân"

| # | Ý tưởng | Khâu | Đo | Cần gì | Rủi ro / ranh giới |
|---|---|---|---|---|---|
| 1.1 ★ | **"Sáng nay của bạn"** (tuỳ chọn thứ hai bên cạnh nhắc mốc): 7:30 sáng, một dòng = Ngày cá nhân N + câu tự soi của ngày + (nếu có) mốc hôm nay. Người dùng chọn **nhận mỗi ngày / chỉ ngày có mốc / tắt**. | QUAY LẠI | `push_mo` → `daily_viewed` cùng ngày; D7 của nhóm bật so với không bật | Thêm cột `nhan_hang_ngay` vào `push_dang_ky` (migration nhỏ); cron đã có; engine `/v1/thanso/hom-nay` đã có; cần hồ sơ trong tài khoản (ngày sinh) → chỉ người đã lưu hồ sơ | Nội dung do engine soạn (KB `ngay_ca_nhan_tu_soi`), không LLM. Gộp với nhắc mốc trong **một** thông báo/ngày. |
| 1.2 ★ | **Chọn giờ nhận** (sáng 7:30 · trưa 12:00 · tối 21:00) thay vì cố định 8:03. | QUAY LẠI | Tỉ lệ mở theo khung giờ | Cột `gio_nhan` (3 giá trị); 1 cron Hobby chỉ chạy 1 lần/ngày → **cần Vercel Pro** hoặc chạy cron 3 lần bằng cách... Hobby không cho → tạm chỉ 1 khung giờ cho tới khi lên Pro | Ghi rõ ở nút: "Hiện chỉ gửi buổi sáng" |
| 1.3 | **Nhắc theo nhịp đã có sẵn trong engine**: ngày đầu Tháng cá nhân mới (thần số), ngày giao tiết → tháng mới của nhà (Phong thuỷ), ngày Lập xuân / Tết (tuổi xông đất, hướng xấu năm), tháng lưu nguyệt mới (Tử vi). Người dùng tích từng loại. | QUAY LẠI | `push_mo{loai}` | KB nhãn ngắn cho từng loại; cron tính "hôm nay có phải mốc của người này" bằng engine (web máy chủ gọi engine theo lô) | Tất cả đều là mốc lịch khách quan, không dự báo sự kiện. |
| 1.4 | **Trả lời "Hôm nay bạn định làm gì?" vào hôm sau**: người đã chọn ý định hôm qua → sáng nay hỏi một chạm "Hôm qua việc X — thuận / không?" (hai nút ngay trên thông báo, Android hỗ trợ action buttons). Phiếu đi vào kiểm chứng ẩn danh (LG-ĐS), không chữ. | QUAY LẠI + HỌC | Tỉ lệ trả lời; số phiếu kiểm chứng/ngày | sw.js `actions` + route ghi phiếu (dùng `ghi_kiem_chung`) | Chỉ mã ý định + đúng/chưa đúng. |
| 1.5 | **Mời bạn qua thông báo của chính họ**: ngày người dùng là Ngày cá nhân 2 hoặc 6 (số của "kết nối" theo KB), gợi "Hôm nay hợp để rủ một người xem hợp đôi" → mở `/hop-doi`. ≤ 1 lần/tuần. | MỜI | `push_mo` → `compatibility_created` | Luật chọn ngày trong engine | Không spam: nằm trong thông báo sáng, không gửi thêm. |
| 1.6 | **Thống kê & kiểm soát ở `/quan-tri/tang-truong`**: số thiết bị bật, gửi/mở/tắt theo ngày, tỉ lệ `het_han`; nút "Tạm dừng gửi" (`cau_hinh` `push.bat`). | nền móng | — | Đọc `push_dang_ky` tổng số (không xem ai), PostHog | Bắt buộc có trước khi bật 1.1 cho nhiều người. |

**Không làm**: thông báo khuyến mãi/giảm giá Sao, "bạn chưa vào 3 ngày rồi", thông báo gắn hung/kỵ ("hôm nay xung tuổi, cẩn
thận"), nhiều hơn một thông báo/ngày, gửi cho người chưa bật.

## 2. Tăng tỉ lệ cài web app ("Thêm vào màn hình chính")

Hiện `manifest.ts` có nhưng chưa ai được mời cài; sw.js mới chỉ đăng ký khi bật nhắc. Đề xuất:

| # | Ý tưởng | Đo | Cần gì |
|---|---|---|---|
| 2.1 ★ | **Mời cài đúng lúc, không mời lúc vừa vào**: sau khi người dùng (a) xem Hôm nay lần thứ 2 trong 7 ngày, hoặc (b) bấm "Nhắc tôi", hoặc (c) bật nhắc trên iPhone bị chặn vì chưa cài → hiện thẻ nhỏ "Cài Hiểu Bản Thân lên màn hình chính — mở nhanh, nhận nhắc". Android: bắt `beforeinstallprompt` → nút cài một chạm. iPhone: hướng dẫn 2 bước (đã có trong `BatNhacPush`). Đóng thì 30 ngày sau mới mời lại. | `pwa_prompted`, `pwa_installed` (sự kiện `appinstalled`), % phiên mở ở `display-mode: standalone` | Thêm 2 sự kiện PostHog; thẻ `MoiCaiApp.tsx`; manifest thêm `shortcuts` (Hôm nay · Hỏi · Xem ngày tốt), `screenshots`, biểu tượng PNG 192/512 maskable (hiện chỉ SVG — Chrome yêu cầu PNG để hiện nút cài) |
| 2.2 ★ | **Icon + màn hình chào**: `icon-192.png`, `icon-512.png` maskable sinh từ `icon.svg` lúc build (script Node, không dependency — dùng `sharp`? **có sẵn trong `cms/`, web chưa có** → dùng `ImageResponse` như `apple-icon.tsx` cho route `/icon-192`/`/icon-512`), `theme_color` khớp "Đêm sao". | Lighthouse PWA installable = pass | 0,5 ngày |
| 2.3 | **Trang mở nhanh khi offline**: sw.js cache **chỉ** một trang "đang ngoại tuyến" + icon (không cache dữ liệu lá số). Người dùng mở app lúc mất mạng vẫn thấy thương hiệu + mốc nhắc lưu trên máy. | — | Thêm `fetch` handler tối thiểu cho navigation khi offline (giữ nguyên "không cache trang" cho mọi trường hợp có mạng) |
| 2.4 | **Chuỗi ngày ghé thưởng Sao ngày 7** (đã có trong hàng đợi) — kết hợp 1.1: thông báo sáng ngày 6 nhắc "mai là ngày thứ 7". Chuỗi phải đếm ở máy chủ mới thưởng thật. | `credit_earned{kind=chuoi}` | Bảng điểm danh (migration), trần Sao/tháng ở `/quan-tri/cai-dat` |
| 2.5 | **Deep link từ thông báo mở đúng khối** (đã có `?tu=push`): thêm `#muc` để cuộn tới mốc/thẻ tương ứng → giảm "mở ra rồi đóng". | thời gian trên trang sau `push_mo` | nhỏ |

## 3. Doanh thu — nguyên tắc: Sao mua **giá trị tích luỹ hoặc chi phí biên thật**, không bán nỗi sợ

| # | Ý tưởng | Khâu | Đo | Cần gì | Ghi chú |
|---|---|---|---|---|---|
| 3.1 ★ | **Gói "Nhịp của tôi" (đăng ký tháng bằng Sao)**: 15 Sao/tháng mở (a) thông báo sáng có **thêm** "việc hợp hôm nay" theo ý định đã chọn (HN-2) và nhịp Bát tự lưu nhật, (b) 12 tháng tới của Bản đồ con số luôn mở, (c) nhịp 3 tháng Tử vi. Thông báo cơ bản (Ngày cá nhân + mốc) **vẫn miễn phí**. Tự gia hạn **tắt mặc định**, nhắc trước 3 ngày, hết Sao thì về bản miễn phí (không khoá gì đã trả). | NẠP | Tỉ lệ người bật push → mua gói; churn tháng | Bảng `goi_dang_ky` (migration), hàm trừ Sao hàng tháng bằng service role, công tắc + giá ở `/quan-tri/cai-dat` | Đây là nguồn thu **lặp lại** đầu tiên; thứ bán là *nhịp cá nhân hoá mỗi ngày* = đúng thứ Web Push đem lại. |
| 3.2 ★ | **Bật thu Sao theo mảng** (đã đề xuất `Y-TUONG-VIRAL` C.1): Bản đồ con số + Tử vi đời sống trước. | NẠP | `paywall_viewed → unlock_succeeded` theo mảng | Công tắc `luan_giai.thu_sao.<mảng>` | 0,5 ngày, làm ngay khi anh chốt. |
| 3.3 ★ | **Gói "Năm của tôi" in được** (PDF/ảnh dài) 30 Sao: thần số 12 tháng + Tử vi năm nay & 3 tháng tới + tháng sửa nhà + ngày tốt theo tuổi. Bán mạnh **mùa Tết/Lập xuân** — đúng lúc push 1.3 nhắc. | NẠP + MỜI (tệp dễ chia sẻ) | Doanh thu theo mùa | Dựng bằng in trang (CSS print) trước, PDF máy chủ sau | Chi phí biên thật = dựng tệp; giá trị giữ lại. |
| 3.4 | **Gói 20 câu hỏi** (SAO-2 đã có hỏi lẻ 1 Sao): 15 Sao/20 câu, đồng ý một lần. | NẠP | ARPPU, câu hỏi/người | Loại giao dịch mới trong sổ cái | Người hay hỏi là người trả tiền; bớt hộp hỏi đồng ý từng câu. |
| 3.5 | **Thưởng mời gắn lần nạp đầu** (hàng đợi): người được mời nạp lần đầu → người mời +20% Sao gói, trần/tháng, **một tầng**. | MỜI + NẠP | K-factor, % tài khoản mời có bạn nạp | Hàm SQL + cài đặt `sao.*` | Không đa cấp: chỉ 1 tầng, chỉ Sao, không tiền. |
| 3.6 | **Tư vấn 1:1 với chuyên gia** (CG-1): đặt lịch từ trang `/tac-gia/duc-luan`, trả VND qua payOS (không Sao), ghi âm/không lưu nội dung. | NẠP (VND) | Số buổi/tháng | Lịch rảnh trong CMS, đơn payOS loại mới | Doanh thu/giờ cao nhất, phụ thuộc thời gian anh; làm sau khi có ≥ 300 người bật push. |
| 3.7 | **Quà tặng Sao cho người khác** (tặng gói 29k cho bạn kèm lời nhắn ngắn đã lọc) — dịp sinh nhật/Tết. | NẠP + MỜI | Đơn quà/tháng | Đơn nạp có `nguoi_nhan` (email), Sao vào ví người nhận khi họ đăng nhập | Vẫn không chuyển nhượng Sao giữa ví; chỉ mua-tặng từ cổng thanh toán. |

**Không làm** (giữ ranh giới): bán "giải hạn/vật phẩm", gói theo nỗi sợ, đếm ngược giả, mờ nội dung bằng CSS, khoá câu trả
lời khủng hoảng, hoa hồng nhiều tầng, crypto.

## 4. Trạng thái + kế hoạch còn lại (cập nhật 2026-10-22, chủ dự án duyệt làm 1.1 · 1.3 · 1.4 · mục 2)

**Đã làm (GĐ2, nhánh sau PR #112)** — chờ anh chạy migration 0020:

| # | Việc | Ở đâu |
|---|---|---|
| 1.1 ✅ | "Sáng nay của bạn": người dùng tự tích, cần hồ sơ trong tài khoản; máy chủ chỉ đọc NGÀY-THÁNG sinh (không năm) → engine tính ngày cá nhân + câu tự soi | `engine/app/luangiai/sang_nay.py`, `/v1/push/sang-nay`, migration `0020_push_tuy_chon.sql`, `web/lib/cron.ts` |
| 1.3 ✅ | Mốc lịch tự chọn: đầu tháng cá nhân · giao tiết (12 tiết, giờ VN) · Lập xuân + Tết âm lịch Việt | cùng trên; KB `push_sang_nay.json` (nháp AI) |
| 1.4 ✅ | "Hôm qua việc X — đúng không?": ý định hôm qua chỉ nằm trên máy (IndexedDB) → hai nút ngay trên thông báo (Android/máy tính) hoặc khối "Hôm qua của bạn" ở Hôm nay (mọi máy, cả iPhone) → phiếu kiểm chứng ẩn danh có sẵn (mã `ds.hn.<ý định>.<nhịp>.n<số ngày>`, không migration) | `web/public/sw.js`, `web/lib/hom-qua.ts`, `components/khung/HoiHomQua.tsx` |
| — ✅ | Vẫn ≤ 1 thông báo / thiết bị / ngày: mốc tự đánh dấu > mốc lịch > sáng nay, gộp một | `ghepThongBao` trong `web/lib/web-push.ts` |
| 2.1 ✅ | Mời cài đúng lúc (ghé Hôm nay 2 ngày/7 ngày hoặc có mốc nhắc; Android nút một chạm, iPhone 2 bước; đóng → 30 ngày) | `components/khung/MoiCaiApp.tsx` |
| 2.2 ✅ | Biểu tượng PNG 192/512 + maskable, manifest `id`/`scope`/lối tắt, mở app vào `/hom-nay?tu=app` | `app/bieu-tuong/[co]`, `app/manifest.ts`, `lib/bieu-tuong.tsx` |
| đo ✅ | `chart_interacted{kind=push_tuy_chon\|pwa_moi\|pwa_cai\|pwa_tu_choi\|pwa_dong\|pwa_da_cai\|pwa_mo}`, `landing_viewed.app` (phiên mở từ app đã cài), `feedback_submitted{kind=hom_qua}` | |

**Còn lại (đề xuất thứ tự, mỗi bước chờ số đo của bước trước):**

| Đợt | Làm | Mốc đo để đi tiếp | Cần anh |
|---|---|---|---|
| A (ngay sau khi chạy 0020 + VAPID) | 1.6 khung số liệu push ở `/quan-tri/tang-truong` (thiết bị bật, gửi/mở/tắt, tỉ lệ 410) + nút tạm dừng gửi | ≥ 50 thiết bị bật nhắc | — |
| B (+1–2 tuần) | 2.5 mở thẳng khối tương ứng từ thông báo · 3.2 công tắc thu Sao theo mảng | Mở thông báo ≥ 25 %; D7 nhóm bật ≥ 1,5× nhóm không | chốt mảng thu Sao |
| C (+3–4 tuần) | 3.1 gói "Nhịp của tôi" 15 Sao/tháng (tự gia hạn tắt mặc định) · 3.4 gói 20 câu | ≥ 3 % người bật push mua gói trong 30 ngày | duyệt migration bảng gói |
| D (trước Tết) | 3.3 "Năm của tôi" in được · 3.5 thưởng mời gắn nạp đầu · 1.2 chọn giờ nhận | Doanh thu mùa Tết, K-factor | **Vercel Pro** (1.2 cần nhiều cron) |

Điều kiện kỹ thuật cần anh quyết sớm: **Vercel Pro** (nhiều cron/giờ gửi; Hobby cũng cấm dùng thương mại khi đã thu Sao —
`KIEN-TRUC-VAN-HANH.md` mục 6) và chạy migration 0018 → 0019 → 0020.
