# Đánh Giá Khắt Khe Kế Hoạch "Tam Giác Ngược" & Cập Nhật Lộ Trình Triển Khai `hieuban.com` (24/11/2026)

> **Phạm vi đối chiếu:**
> - Tài liệu đầu vào: Google Doc *"Mô hình Tam giác ngược kết hợp AI + Token Community Economy + Mạng lưới Chuyên gia"* (`1R5ESuUND6IyxKci25-ZoIMhMdXQS3HNk8uIh4WCmITE`).
> - Hiện trạng thực tế codebase `projects/hieubanthan` tới **24/11/2026** (migrations `0001`–`0039`, `bang-gia/2026-11_gia_99.sql`, 90+ tệp KB, Engine FastAPI 5 tầng, Web Next.js 16, CMS Payload 3, `CLAUDE.md`, `VIEC-CUA-ANH.md`, `DE-XUAT-KINH-TE-CONG-DONG.md`, `KE-HOACH-CHUYEN-GIA.md`, `GOI-XEM-VA-GIA-2026-11.md`, `KE-HOACH-QUOC-TE.md`, `KIEM-TOAN-TRI-THUC-2026-11.md`, `AUDIT-INDEX-2026-11.md`, `PHAP-LY-2026.md`).
> - Nghiên cứu kiểm chứng pháp lý & thị trường tháng 11/2026 (`hieubanthan-tam-giac-nguoc-2026`).

---

## Phần 1: Đánh Giá Khắt Khe Bản Google Doc — 6 Lỗ Hổng Mới & Điểm Lệch Thực Tế

Bản Google Doc tư duy chiến lược tốt ở 4 điểm đúng hướng (cảnh báo Cold-Start Trap, Platform Leakage, Quá tải nhận thức ở Entry, và rủi ro Cash-out của User thường). **Tuy nhiên, khi soi chiếu khắt khe với thực tế pháp lý VN tháng 11/2026 và codebase `hieubanthan` hiện tại, bản Doc có 6 lỗ hổng chí mạng cần sửa ngay trước khi triển khai:**

### 1. Lỗ hổng Pháp lý #1 (Chí mạng): "Dual-Track: User trả Sao → Chuyên gia đổi VND/USD" VẪN VI PHẠM NĐ 52/2024 & Điều khoản Pay2S
- **Google Doc đề xuất:** User mua Sao → dùng Sao đặt câu hỏi / Bounty cho Chuyên gia → Hệ thống quy đổi Sao đó thành Thù lao dịch vụ (VND/USD) trả cho Chuyên gia.
- **Sự thật pháp lý (đã kiểm chứng 11/2026):**
  1. Theo **NĐ 52/2024/NĐ-CP** về thanh toán không dùng tiền mặt, khi điểm nội bộ (Sao) được dùng để thanh toán dịch vụ của **bên thứ ba (Chuyên gia)** rồi bên thứ ba đổi ra tiền mặt, Sao mất tính chất *closed-loop* và bị coi là **phương tiện thanh toán / ví điện tử không phép** (cần giấy phép Trung gian thanh toán của NHNN).
  2. **Pay2S** (cổng thanh toán đang tích hợp ở migration `0037`) **cấm trực tiếp trong Điều kiện & Hạn chế** việc dùng Pay2S để nhận tiền thay hoặc phân phối dòng tiền khi chưa có giấy phép trung gian thanh toán.
  3. **NĐ 117/2025 đã hết hiệu lực** và bị thay bằng **NĐ 252/2026/NĐ-CP** (hiệu lực 01/07/2026, Điều 43: nền tảng có đặt hàng + thanh toán phải khấu trừ, khai thay, nộp thay thuế). Ngoài ra **Luật TMĐT 122/2025** (hiệu lực 01/07/2026) xếp Marketplace chuyên gia là **nền tảng TMĐT trung gian** → bắt buộc xác thực danh tính người bán (eKYC) và đăng ký sàn với Bộ Công Thương.
- **Cách vá (khớp với `0029_chuyen_gia.sql` và `KE-HOACH-CHUYEN-GIA.md` đã thiết kế):**
  - **Tách tuyệt đối Sao và Tiền Chuyên gia:** Sao **chỉ** dùng cho tính năng của chính `hieuban.com` (AI, báo cáo tự động, câu hỏi AI vượt lượt). Dịch vụ có người thật (Hỏi chuyên gia / Tư vấn) thu **trực tiếp bằng VND** (hieuban.com đứng tên người bán dịch vụ trọn gói → ký hợp đồng CTV/dịch vụ B2B trả thù lao cho chuyên gia sau đối soát thuế TNCN, **không** vận hành kiểu "sàn thu hộ-chi hộ" hay đổi Sao ra tiền).

### 2. Lỗ hổng Pháp lý #2: Đề xuất "Stripe Connect" không khả thi với pháp nhân Việt Nam
- **Google Doc đề xuất:** Dùng Stripe Connect trả USD cho chuyên gia Việt Nam tiếp cận khách Mỹ/Âu.
- **Sự thật (đã kiểm chứng 11/2026):** Stripe **chưa hỗ trợ mở tài khoản merchant/Connect cho pháp nhân Việt Nam**. Muốn thu USD và chia tiền quốc tế bắt buộc phải có **pháp nhân + tài khoản ngân hàng tại Singapore (hoặc Mỹ)**, hoặc dùng Merchant of Record (Paddle/Lemon Squeezy — hiện vẫn cần kiểm tra điều khoản cấm ngành *astrology/divination*).
- **Cách vá:** Giai đoạn 1–2 tập trung thu VND qua Pay2S (Việt Nam + kiều bào chuyển khoản VN) và làm rõ thủ tục MoR/Singapore entity ở tháng 3–4 (`KE-HOACH-QUOC-TE.md`). Không hứa hẹn "thu USD tự động qua Stripe Connect" khi tuyển 10 Founding Masters đợt đầu.

### 3. Lỗ hổng Pháp lý #3: Bounty Q&A công khai & Dữ liệu nhạy cảm theo Luật BVDLCN 91/2025 + NĐ 356/2025
- **Google Doc đề xuất:** Mở Bounty Q&A dạng Quora/StackOverflow, đính kèm tóm tắt lá số để thành viên cộng đồng và chuyên gia tự do vào luận giải nhằm tạo UGC cho SEO/GEO.
- **3 rủi ro bị bỏ sót:**
  1. **Luật BVDLCN 91/2025 & NĐ 356/2025 (hiệu lực 01/01/2026):** Dữ liệu gắn với tín ngưỡng/tâm linh có thể bị xếp nhóm **dữ liệu nhạy cảm**; **ân hạn 5 năm cho startup KHÔNG áp dụng khi xử lý dữ liệu nhạy cảm**; phạt tới **5% doanh thu** nếu chuyển dữ liệu xuyên biên giới trái phép. `CLAUDE.md` cũng cấm lưu nội dung luận giải/ngày sinh công khai gắn người dùng.
  2. **Rủi ro Mê tín dị đoan (NĐ 38/2021, phạt 15–20 triệu/tổ chức; Điều 320 BLHS):** Nếu mở cho user thường vào trả lời tự do trên Bounty Q&A, chỉ cần vài bình luận phán hung ("năm nay gặp hạn chết / ly hôn / mua bùa giải hạn") là cả nền tảng chịu trách nhiệm liên đới.
  3. **Rủi ro SEO Scaled/Spam UGC:** Google đánh tụt hạng nếu diễn đàn đầy câu trả lời mỏng, thiếu kiểm duyệt.
- **Cách vá:** Không mở forum/Bounty cho user thường tự do trả lời. Chuyển sang **Hỏi đáp Chuyên gia Ẩn danh có Kiểm duyệt (Curated Anonymous Q&A)**: chỉ xuất bản những ca khách **chủ động opt-in ẩn danh** (chỉ giữ cấu trúc sao/quẻ/trụ đã khử PII — bỏ tên, ngày giờ sinh thật), **chỉ chuyên gia xác minh / CTV CMS** được trả lời, bắt buộc đi qua bộ kiểm `cum_cam` + `sach_ghi` của engine trước khi đăng.

### 4. Lệch thực tế Codebase: Google Doc đang thiết kế lại từ con số 0 những thứ Repo ĐÃ LÀM XONG
| Hạng mục trong Google Doc | Thực tế codebase `hieubanthan` (24/11/2026) | Kết luận |
|---|---|---|
| *"Tách bạch `paid_stars` và `bonus_stars` có hạn sử dụng"* | **ĐÃ CÓ** ở `0025_sao_viral.sql`: `sao_so_du_cua()` tính số dư theo lô (Sao tặng sắp hết hạn trừ trước, Sao mua không hết hạn trừ sau cùng). | **Không làm lại.** Chỉ cần hiển thị rõ 2 số dư trên UI Ví Sao. |
| *"Micro-transaction 49k–99k, tặng 50 Sao trải nghiệm"* | **ĐÃ CHỐT GIA-99** (`2026-11_gia_99.sql`): 99 Sao/báo cáo, 49 Sao Bản đồ con số, 5 Sao/câu vượt lượt, gói chim mồi 99k / 199k / 249k / 499k, Hội viên 599k / 1.990k, tặng 10 Sao chào mừng + 33/33 mời bạn + 20% nạp đầu. | **Giữ GIA-99** (đã có lý luận chim mồi & biên lợi nhuận tốt hơn). Không tặng 50 Sao miễn phí vì phá vỡ phễu 49 Sao Bản đồ con số. |
| *"Xây Nhật ký Ứng nghiệm từ đầu"* | **ĐÃ CÓ** nền móng: `kiem_chung_phieu` (`0021`, `0022`, `0034` — phiếu kiểm chứng đúng/chưa đúng ẩn danh HMAC cho mọi mảng) + `nhat_ky_ghe` (`0032`) + Web Push (`0018`–`0020`, `0035`–`0036`). | **Kế thừa & nối ống**, không tạo bảng dư thừa: thêm lịch nhắc sau 30–90 ngày nối vào `kiem_chung_phieu` + `cau_hoi_chuyen_gia.danh_gia`. |
| *"Xây luồng AI → Escalate to Expert"* | **ĐÃ CÓ** backend + UI nền: `0029_chuyen_gia.sql` (`cau_hoi_chuyen_gia`, trả VND, hạn 48h, đồng ý chia sẻ hồ sơ riêng, tự xoá ảnh chụp sau 30 ngày) + `/hoi-chuyen-gia` + `/quan-tri/chuyen-gia`. | **Chỉ cần đặt CTA ngữ cảnh** cuối báo cáo AI/hỏi đáp (truyền sẵn `mang` + cấu trúc tóm tắt lá số) và mở công tắc bán. |
| *"Xây CMS / Profile chuyên gia chuẩn SEO"* | **ĐÃ CÓ** `cms.hieuban.com` (Payload 3) với vai trò **Cộng tác viên**, kiểm định 30 luật SEO/GEO/E-E-A-T, kiểm trùng CG-6, MFA TOTP, và `/tac-gia/[slug]` có schema `Person` + `ProfilePage`. | **Chỉ cần nối CG-4** (đọc hồ sơ tác giả từ CMS thay mảng cứng `web/lib/chuyen-gia.ts`) + **CG-3** (email thông báo duyệt bài). |

### 5. Bỏ sót 4 Tài sản "Vũ khí hạng nặng" đang có trong Repo
1. **Mảng B2B Doanh Chủ (`/doanh-chu`, `/ban-do-doi-ngu`, PR #325–#329):** Lịch quyết định 12 tháng, Mặt bằng & Khai trương, Bản đồ đội ngũ. Đây là ngách **giá trị đơn hàng cao (high-ticket), khách sẵn sàng trả tiền, và ít rủi ro mê tín hơn B2C** — nhưng Google Doc không hề nhắc tới!
2. **Nhân Tướng CV 3D & Chỉ Tay 2 Bàn Tay (`feat/tuong-hoc-cv-upgrade`):** Chạy 100% trên máy khách (privacy-first), trích 23 đặc trưng 3D + hợp nhất Đông–Tây. Đây mới là "Aha! Moment trong 30 giây" mạnh nhất cho Tầng 1 Entry (nhanh hơn nhập ngày giờ sinh!).
3. **Kiến trúc 5 Tầng Tất Định + Cổ Thư `source_ref` (`feat/kb-duality-citation-pilot`):** Khác biệt sống còn của `hieuban.com` so với mọi app AI GPT wrapper là **CALC tất định + KB có trích dẫn nguyên văn cổ thư + luận 2 mặt (lưỡng cực)**. Chuyên gia thật sẽ chỉ tôn trọng và dùng Co-Pilot nếu thấy máy tính chuẩn xác và dẫn đúng sách gốc!
4. **Hồ sơ Gia đình (`0039_gia_dinh.sql`) + Hợp đôi 2 chiều (`PR #327`):** Là vòng lặp viral tự nhiên đã có sẵn dữ liệu và thẻ Story Zero-PII.

### 6. Bỏ sót "Nút thắt thực tế" & Độ vênh tài liệu trong chính Repo
Google Doc khuyên lập tức chạy chiến dịch tuyển 10 Founding Masters (Tuần 5–8) và đẩy Traffic (Tuần 9–12), nhưng bỏ qua 4 nút thắt đang khiến hệ thống **chưa kiếm được đồng nào dù code đã viết xong**:
1. **Chưa bật thu tiền thật:** Pay2S (`4aq`) chưa gắn 4 biến `PAY2S_*` và chưa chạy `2026-11_gia_99.sql` (`4au`) → toàn bộ phễu nạp Sao/Hội viên/Hỏi chuyên gia vẫn đang miễn phí/tắt.
2. **Chất lượng KB & Cổ thư:** 14/16 tệp KB 3 môn chính vẫn là `nhap_ai`, bảng điều hậu Bát tự lệch 26/120 ô (`KT-TT`), Pilot `source_ref` chưa bật cờ production. Nếu mời 10 Founding Masters giỏi vào lúc này, họ đọc thấy sai bảng điều hậu là mất uy tín ngay.
3. **Lập chỉ mục SEO (862 URL chưa crawl):** Do HTML `no-store` (nonce CSP) phản hồi 0,8–1,35s từ Googlebot Mỹ + **Supabase thực tế đang chạy ở Tokyo** (`KE-HOACH-HOAN-THIEN.md`, trong khi `CLAUDE.md` ghi `region SG` — cần đối chiếu lại trước khi mở rộng user).
4. **Pháp lý vận hành trước khi thu tiền:** Chưa hoàn tất HKD/MST, thông báo Bộ Công Thương theo Luật TMĐT 122/2025, và bộ hồ sơ Đánh giá tác động DLCN + Chuyển dữ liệu xuyên biên giới (Supabase Tokyo, Render, Vercel) theo Luật 91/2025 + NĐ 356/2025. Cần cập nhật `docs/DE-XUAT-KINH-TE-CONG-DONG.md` (đang dẫn **NĐ 117/2025** đã bị thay bởi **NĐ 252/2026/NĐ-CP** từ 01/07/2026).

> **Lưu ý về độ tin cậy nguồn & trạng thái nhánh git (24/11/2026):**
> - **Pháp lý:** Các mốc hiệu lực Luật 91/2025, NĐ 356/2025, Luật TMĐT 122/2025, NĐ 252/2026, Pay2S có độ tin cậy khá cao (đa nguồn độc lập), nhưng chủ yếu từ nguồn tóm tắt thứ cấp; **ranh giới hình sự Điều 320 BLHS / NĐ 38/2021 cho dịch vụ huyền học thu phí và khung pháp lý tài sản mã hoá (NQ 05/2025) CHƯA được kiểm chứng toàn văn** → bắt buộc có luật sư duyệt trước khi mở rộng Tầng 3.
> - **Stack thực tế:** `web/package.json` đang chạy **Next.js 16.4.6 + React 19.3.0** (một số tài liệu cũ ghi Next 15 đã lỗi thời).
> - **Trạng thái nhánh git:** PR #325–#328, #330–#334 (Doanh Chủ, Hợp đôi v2, RankYak, Tam Yếu 24 Sơn) đã merge vào `main`; **chưa merge** gồm `feat/kb-duality-citation-pilot` (Pilot `source_ref`), `feat/tuong-hoc-cv-upgrade` (Nhân Tướng 3D + Chỉ Tay 2 tay), và **PR #329 (`claude/b2b-mat-bang-khai-truong`)** đang giao Claude Code xử lý audit (tuyệt đối không push đè lên nhánh này).

---

## Phần 2: Ý Tưởng Nâng Cấp Tốt Hơn Cho Mô Hình "Tam Giác Ngược v2"

Thay vì ép `hieuban.com` thành một **Sàn giao dịch trung gian (Marketplace)** đầy rủi ro pháp lý (Luật TMĐT 122/2025, NĐ 252/2026, NĐ 52/2024, Pay2S), hãy nâng cấp thành mô hình **SaaS + Media + Managed Expert Service (Tam Giác Ngược v2 — An Toàn Pháp Lý & Biên Lợi Nhuận Cao)**:

| Tầng | Google Doc cũ | Nâng cấp **Tam Giác Ngược v2** (Khớp Repo & Luật 2026) |
|---|---|---|
| **Tầng 1: Entry (Aha! Moment 60s)** | Nhập ngày sinh → AI luận 80% → Paywall 20% | **3 cửa vào tốc độ cao:** (1) Quét mặt 3D / Chỉ tay 2 tay tại máy (zero-friction); (2) Lá số Tử vi/Bát tự/Kỳ Môn có **trích dẫn cổ thư** + **1 câu "Luận theo câu hỏi" miễn phí ở chương 1 (LH-3)**; (3) Hợp đôi Story Zero-PII & B2B Doanh chủ. Chạm paywall → **Cửa Sao v2 ("Ba lối mở")** với thang **GIA-99**. |
| **Tầng 2: Core (Giữ chân & Kiểm chứng)** | Forum Bounty Q&A (dễ spam & vi phạm luật) + Nhật ký ứng nghiệm xây mới | **(1) Nhật ký Ứng nghiệm v2:** Nối Web Push/Email nhắc sau 30/90 ngày thẳng vào `kiem_chung_phieu` + tặng Sao thưởng khi xác nhận thực tế → sinh điểm tin cậy thực tế cho từng mẫu KB & chuyên gia.<br>**(2) Hỏi đáp Chuyên gia Ẩn danh (Curated Q&A):** Trích từ các ca `cau_hoi_chuyen_gia` khách opt-in ẩn danh (0 PII), chỉ chuyên gia xác minh trả lời → tạo kho UGC siêu chất lượng cho SEO/GEO mà **0% rủi ro mê tín/spam**. |
| **Tầng 3: Inner Circle (Chuyên gia & B2B)** | Marketplace chia Sao → đổi tiền + Stripe Connect | **Đi theo 2 mũi nhọn hợp pháp 100%:**<br>**Mũi 3A — "Không gian Pro cho Thầy/Chuyên gia" (SaaS thu phí tháng/năm, làm TRƯỚC):** Bán gói công cụ AI Co-Pilot (tổng hợp 7 mảng + trích cổ thư `source_ref` + xuất báo cáo PDF gắn thương hiệu riêng của thầy + trang Profile chuẩn E-E-A-T `/tac-gia/<slug>`). **Không dính Luật sàn TMĐT 122/2025, không dính trung gian thanh toán Pay2S, thầy tự mang khách riêng vào!**<br>**Mũi 3B — "Hỏi Chuyên Gia" do `hieuban.com` đứng tên bán trực tiếp (Managed Service):** Khách trả **VND** (299k/câu lẻ hoặc gói Hội viên Chuyên gia 1.990k/năm) → `hieuban.com` điều phối tới Founding Masters theo hợp đồng CTV (trả thù lao định kỳ + khấu trừ thuế TNCN 10%). |
| **Tầng 4 (Mới): B2B Doanh Chủ** | *Không có* | Gói **Doanh Chủ Pro** (Bản đồ đội ngũ + Lịch quyết định 12 tháng + Mặt bằng & Khai trương) bán theo gói VND/năm hoặc hợp đồng dịch vụ tư vấn kèm chuyên gia — tăng ARPU gấp 5–10 lần B2C. |

### 3 Ý tưởng đột phá thêm vào kế hoạch:
1. **"Bệnh án Đa Hệ Thống 1 Trang" (Master Brief API):** Khi khách bấm "Hỏi chuyên gia" từ bất kỳ mảng nào, Engine tự gom một JSON tóm tắt **Tử vi + Bát tự + Thần số + Lưu niên hiện tại + Cổ thư trích dẫn (`source_ref`)** hiển thị ngay trong bảng điều khiển `/quan-tri/chuyen-gia`. Chuyên gia mất 3 phút đọc, 5 phút chốt lời khuyên — đúng tinh thần AI Co-Pilot 80/20 mà không lộ PII ra ngoài.
2. **Chiến dịch 10 Founding Masters gắn với "Thẩm định KB + Góc nhìn chuyên gia (GN-1)":** Đừng chỉ tuyển thầy về ngồi chờ câu hỏi (sẽ bị Cold-Start vì tuần đầu chưa có nhiều đơn 299k). Ngay tuần 1, mời 5–10 Founding Masters **thẩm định 10–20 trang trụ cột** trong mảng của họ + viết "Góc nhìn chuyên gia" (GN-1) → đổi lại họ nhận **Trang hồ sơ chuẩn Knowledge Graph (`/tac-gia/<slug>`)**, **gói Pro Workspace miễn phí 12 tháng**, và **ưu tiên nhận đơn Hỏi chuyên gia 299k / chia sẻ 80% thù lao CTV** (hợp pháp, vừa giải bài toán E-E-A-T & KB vừa giải Cold-Start!).
3. **Tự động hóa phễu Viral bằng "Quà 1 chương" (`0025`) + "Lì xì báo cáo Tết 2027":** Gần mùa Tết, tính năng mua tặng mã báo cáo bằng VND (người nhận tự nhập ngày sinh để tuân thủ Luật 91/2025) là đòn bẩy doanh thu & viral mạnh nhất quý tới.

---

## Phần 3: Lộ Trình Triển Khai Cập Nhật Theo Phụ Thuộc (DB → KB → Engine → CMS → Frontend UI → Vận Hành)

Lộ trình sắp xếp theo **đường găng phụ thuộc** (không làm dàn trải), mỗi hạng mục ghi rõ **Khâu tăng trưởng**, **Chỉ số đo**, và **Người thực hiện**.

### Giai đoạn 0: Mở Khoá Dòng Tiền & An Toàn Pháp Lý (Tuần 1–2 — Bắt buộc làm trước)
*Mục tiêu: Đưa toàn bộ code thanh toán/Sao đã viết vào kiếm tiền thật và đóng rủi ro pháp lý.*

| Lớp | Hạng mục cụ thể | Khâu đẩy | Chỉ số đo | Ai làm |
|---|---|---|---|---|
| **Hạ tầng / Vận hành** | Hoàn tất **Pay2S** (`4aq`): cấu hình 4 biến `PAY2S_*` + webhook ngân hàng trên Vercel; chạy `supabase/bang-gia/2026-11_gia_99.sql` (`4au`) kích hoạt bảng giá GIA-99. | NẠP | `payment_succeeded`, thời gian nhận Sao < 30s | **Anh** |
| **Hạ tầng** | Ổn định **Engine Render** gói Starter Singapore (`HT-2`) + gắn UptimeRobot & Sentry (`HT-9`); cấu hình RankYak env trên CMS (`4az`). | Mọi khâu | Uptime ≥ 99,5%, TTFB engine < 500ms | **Anh** |
| **Pháp lý** | Hoàn tất HKD/MST (`THONG_TIN_*` env), gửi luật sư 1 lần bộ câu hỏi cập nhật **Luật 91/2025 + NĐ 356/2025** (dữ liệu nhạy cảm, hồ sơ đánh giá tác động), **Luật TMĐT 122/2025 + NĐ 248/2026**, và **NĐ 252/2026** (thay NĐ 117/2025). | Nền móng | Văn bản xác nhận luật sư + link BCT ở footer | **Anh** (+ em soạn nháp hồ sơ DLCN) |
| **DB (Supabase)** | Chạy & kiểm tra đủ migrations tới `0039` qua `da_chay_chua.sql`; bật Supabase Auth Rate Limits + CAPTCHA (`SEC-2`); cấu hình backup tuần (`HT-10`). | Bảo mật & Ổn định | 0 migration thiếu, 0 cảnh báo Security Advisor | **Anh** (chạy) + **Em** (kiểm) |

---

### Giai đoạn 1: Làm Sạch Lõi Tri Thức (KB) & Tối Ưu Thu Hút (SEO/Index) (Tuần 2–4)
*Mục tiêu: Đảm bảo độ chuẩn xác cổ thư trước khi đưa Founding Masters vào; đẩy 862 URL vào chỉ mục Google.*

| Lớp | Hạng mục cụ thể | Khâu đẩy | Chỉ số đo | Ai làm |
|---|---|---|---|---|
| **KB** | **Sửa lỗi 26/120 ô bảng Điều hậu Bát tự** (`battu_dieu_hau.json`) theo nguyên văn *Cùng Thông Bảo Giám* + test nguyên văn + tăng `ENGINE_VERSION` (`KT-TT`). | QUAY LẠI & NẠP | 120/120 ô khớp nguyên văn, 0 hồi quy test | **Em** (anh duyệt Q1) |
| **KB** | Gộp nhánh `feat/kb-duality-citation-pilot` (đã push) & mở cờ hiển thị `source_ref` (trích dẫn cổ thư) + cập nhật Golden VI/EN. | THU HÚT & TIN CẬY | Tỉ lệ hộp luận có `source_ref` tăng lên 100% nhóm A/B | **Em** |
| **KB** | Gộp nhánh `feat/tuong-hoc-cv-upgrade` (Nhân Tướng 3D + Chỉ Tay 2 tay) và hoàn tất audit PR #328/#329 (B2B Doanh Chủ — đang do Claude Code xử lý). | THU HÚT (Aha! 60s) | `reading_started` ở `/nhan-tuong`, `/chi-tay`, `/doanh-chu` | **Em / Claude Code** |
| **Frontend / Infra** | Triển khai **Q-I3 (CDN Cache HTML cho trang kiến thức/ngày/tuổi)** — tách CSP hash cho trang tĩnh, giữ nonce cho trang công cụ/tài khoản để giảm TTFB Googlebot từ ~1,2s xuống < 0,2s. | THU HÚT (SEO) | Tỉ lệ index nhóm A trên GSC, TTFB Googlebot < 300ms | **Em** |
| **Frontend / Tracking** | Vá lỗi đo lường nhỏ: ghi `credit_earned{kind=moi_ban}` cho người mời; gắn `?tu=` cho mọi nút chia sẻ còn thiếu (`NutChiaSeNha`, `NutChiaSeQue`); thêm dòng lợi ích người nhận trên `/the/*`. | MỜI | Tỉ lệ `share_created → referral_signup` | **Em** |

---

### Giai đoạn 2: Nâng Cấp Hệ Sinh Thái Chuyên Gia & Vòng Kiểm Chứng (Tuần 5–8)
*Mục tiêu: Đóng gói AI Co-Pilot cho 5–10 Founding Masters và kích hoạt Validation Loop — tuân thủ 100% Luật 91/2025, 122/2025 và NĐ 252/2026.*

| Lớp | Hạng mục cụ thể | Khâu đẩy | Chỉ số đo | Ai làm |
|---|---|---|---|---|
| **DB (Migration `0040+`)** | 1. Bảng `chuyen_gia_doi_soat` (ghi nhận thù lao CTV theo từng câu `cau_hoi_chuyen_gia` đã hoàn tất + khấu trừ thuế TNCN, **thuần VND**, không dính Sao).<br>2. Bảng `hoi_dap_cong_khai` (cho **Curated Anonymous Q&A**: chỉ lưu câu hỏi đã khử PII + cấu trúc lá số dạng mã + câu trả lời chuyên gia đã qua lọc `cum_cam`, bắt buộc có `dong_y_cong_khai = true` từ khách).<br>3. Cột lịch nhắc kiểm chứng 30/90 ngày nối với `kiem_chung_phieu` + `cau_hoi_chuyen_gia`. | QUAY LẠI & DOANH THU | Số câu hỏi chuyên gia hoàn thành đúng hạn 48h; % phản hồi ứng nghiệm | **Em** (thiết kế + `.down.sql`, anh duyệt) |
| **Engine (FastAPI)** | 1. Endpoint **`POST /v1/chuyen-gia/tom-tat-da-mang`** (AI Co-Pilot Master Brief): nhận hồ sơ → chạy CALC+RULES 4–5 mảng (Tử vi + Bát tự + Thần số + Lưu niên) + lọc cổ thư `source_ref` → trả JSON bệnh án 1 trang giúp chuyên gia đọc trong 3 phút.<br>2. Nối **D2** (`RA-SOAT-LUAN-HOI-VA-THU-SAO.md`): bộ hỏi đáp AI dùng chung nhãn `luan_hoi` với báo cáo để không mâu thuẫn. | DOANH THU & GIỮ CHÂN | Thời gian trả lời TB của chuyên gia < 15 phút/ca | **Em** |
| **CMS (Payload 3)** | 1. **CG-3:** Gắn gửi email thông báo tự động (bài gửi duyệt / cần sửa / đã xuất bản / quên mật khẩu).<br>2. **CG-4:** Đọc hồ sơ chuyên gia (`/tac-gia/[slug]`) trực tiếp từ CMS collection thay vì danh sách cứng `web/lib/chuyen-gia.ts`.<br>3. **CG-5:** Thưởng Sao tự động khi bài cộng tác được xuất bản. | THU HÚT (E-E-A-T) | Số bài được thẩm định & ký tên/tuần | **Em** (anh duyệt dep email) |
| **Frontend UI** | 1. **Trang tuyển Founding Masters `/chuyen-gia` (VI/EN):** Trình bày rõ demo "Bệnh án AI 80/20", quyền lợi 0đ phí tham gia + 80% thù lao CTV + Profile Knowledge Graph (không hứa thu nhập cố định, không đa cấp).<br>2. **Nút CTA "Hỏi Chuyên Gia" theo ngữ cảnh:** Đặt cuối mỗi báo cáo AI & hộp hỏi đáp (truyền sẵn `mang` + tóm tắt cấu trúc sang `/hoi-chuyen-gia`).<br>3. **Nâng cấp `/quan-tri/chuyen-gia` thành Co-Pilot Workspace:** Hiển thị sẵn Bệnh án Đa Hệ Thống bên trái, khung soạn trả lời có bộ kiểm `cum_cam` bên phải.<br>4. **UI Ví Sao minh bạch:** Tách rõ hiển thị *Sao mua (vĩnh viễn)* vs *Sao tặng (còn hạn)* ngay trên thanh ví. | NẠP & DOANH THU | Tỉ lệ click `escalate_to_expert`, tỉ lệ hoàn thành đơn 299k | **Em** |

---

### Giai đoạn 3: Pro Workspace (SaaS), B2B Doanh Chủ & Mở Rộng Quốc Tế (Tháng 3–6)
*Mục tiêu: Tạo doanh thu định kỳ bền vững (SaaS + Hội viên + B2B) và mở cổng thu USD hợp pháp.*

| Lớp | Hạng mục cụ thể | Khâu đẩy | Chỉ số đo | Ai làm |
|---|---|---|---|---|
| **DB + Engine + UI** | **Pro Workspace cho Chuyên gia (Mũi 3A):** Gói thuê bao VND/năm (không tự gia hạn) cho phép chuyên gia lập lá số cho khách (khách tự nhập qua link để đúng Luật 91/2025), dùng AI Co-Pilot không giới hạn và **xuất báo cáo PDF gắn thương hiệu/chữ ký riêng**. | DOANH THU ĐỊNH KỲ | Tỉ lệ gia hạn Pro tháng 2 ≥ 60%, số user mới do thầy mang vào | **Em** |
| **Frontend + DB** | **Curated Anonymous Q&A (`/hoi-dap/[slug]`):** Xuất bản 50 case study mồi (25 VI, 25 EN) từ Founding Masters có schema `QAPage` để kéo SEO/GEO. | THU HÚT & MỜI | Organic traffic từ cụm câu hỏi đời sống | **Anh + Masters + Em** |
| **Thanh toán Quốc tế** | Kiểm tra chính sách Paddle / Lemon Squeezy với ngách Bát tự/Tử vi; nếu bị từ chối thì dùng phương án pháp nhân Singapore + Stripe (`KE-HOACH-QUOC-TE.md` mục 6). Bật thu tiền USD cho `/en/` và kiều bào. | DOANH THU GLOBAL | Đơn USD đầu tiên ở tháng 3, ≥ 1.000 organic visits/tuần ở `/en/` | **Anh + Em** |
| **B2B Doanh Chủ** | Đóng gói gói **Doanh Chủ Năm** (Bản đồ đội ngũ + Lịch 12 tháng + Mặt bằng) + xuất PDF báo cáo doanh nghiệp + tùy chọn đặt lịch tư vấn chuyên gia B2B. | DOANH THU CAO | ARPU B2B, số đơn gói Doanh chủ | **Em + Anh** |

---

## Phần 4: Tóm Tắt Hành Động Ngay Trong Tuần Này

1. **Anh (Vận hành — Ưu tiên #1):** Hoàn tất kết nối **Pay2S (`4aq`)** + chạy `2026-11_gia_99.sql` (`4au`) để hệ thống bắt đầu có giao dịch thật; đồng thời gửi luật sư bộ câu hỏi cập nhật **NĐ 252/2026 + Luật 122/2025 + Luật 91/2025**.
2. **Em (Kỹ thuật — Có thể bắt tay làm ngay khi anh chọn):**
   - **Lựa chọn A (Chất lượng lõi + SEO):** Sửa 26/120 ô bảng Điều hậu Bát tự (`KT-TT`) + mở cờ `source_ref` cổ thư + làm Q-I3 (CDN cache HTML) để gỡ 862 URL chưa index.
   - **Lựa chọn B (Chuyên gia & Co-Pilot):** Thiết kế migration `0040` + API `/v1/chuyen-gia/tom-tat-da-mang` (Bệnh án Đa Hệ Thống 80/20) + nâng cấp `/quan-tri/chuyen-gia` và trang tuyển Founding Masters `/chuyen-gia`.
   - **Lựa chọn C (Hoàn thiện phễu Sao & Viral):** Ghi sự kiện `credit_earned{moi_ban}`, gắn `?tu=` toàn bộ thẻ chia sẻ, tách hiển thị Sao mua/Sao tặng trên UI Ví Sao và gắn CTA "Hỏi Chuyên Gia" cuối mỗi báo cáo AI.
