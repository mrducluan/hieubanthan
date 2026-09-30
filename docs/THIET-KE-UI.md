# Thiết kế lại UI/UX — Hiểu Bản Thân (chuỗi UI-0 → UI-6)

> Tài liệu chuẩn cho đợt làm lại toàn bộ giao diện web. Quyết định chủ dự án ngày 2026-09-30
> (ghi trong CLAUDE.md). Mọi PR UI-x phải khớp tài liệu này; đổi hướng → sửa tài liệu trước.

## 1. Sản phẩm đang ở giai đoạn nào

Đối chiếu với **Technical Blueprint v1.1** và **Venture Architect v1.1** (gói AI Metaphysics):

| Hạng mục Blueprint | Trạng thái repo | Nhận xét |
|---|---|---|
| Phase 0 — Engine thần số deterministic, test chuẩn, KB v1, prompt v1 | **Xong** (golden, 2.000+ câu hỏi có nhãn, vòng tự cải thiện) | Gate 0 về kỹ thuật đạt; chưa có bằng chứng "20–50 người thật thấy giá trị" |
| Phase 1 — Landing → Nhập → Đang xử lý → Bài đọc → Metaphysics ID + Analytics + Feedback | **Chưa có** | Đây là trọng tâm đợt UI này |
| Phase 2 — Hợp đôi, thẻ chia sẻ, link mời, gán nguồn giới thiệu | Chưa có (chỉ có hỏi hợp đôi trong Q&A) | Chủ dự án duyệt làm **cùng đợt** |
| Phase 5 — Tử vi, Phong thuỷ | **Đã có engine + Q&A** (HH-1…HH-5) | Lệch Blueprint có chủ ý (chủ dự án chốt 4 mảng Huyền học) |

**Kết luận:** repo đang ở **cuối Phase 0 / đầu Phase 1**, phần engine đi trước. Đợt UI này dựng
Phase 1 đầy đủ và một phần Phase 2 theo quyết định chủ dự án.

**Chỗ vênh với Blueprint (đã báo, chủ dự án chốt):**
1. Làm hợp đôi + link mời (Phase 2) trước khi có số liệu Gate 1. Vì vậy **đo lường (UI-6) là
   bắt buộc cùng đợt**: phải tách được funnel Phase 1 và Phase 2 để khi đọc số không lẫn.
2. Bốn mảng Huyền học đã có, nhưng trên UI **không** làm cửa chính. Thần số là cửa chính; Huyền
   học nằm ở mục "Khám phá sâu hơn" sau khi có hồ sơ. Như vậy vẫn đo được giả thuyết H1/H2.
3. Tài khoản lưu ngày giờ sinh lên Supabase (Blueprint 8.2) chỉ khi người dùng **chủ động** bấm
   lưu. Điều này nới quy tắc "không lưu ngày sinh" trước đây; xem §8.

## 2. Nghiên cứu — người dùng thật sự muốn gì

Tách **SỰ THẬT** (có nguồn), **SUY LUẬN** (từ sự thật) và **GIẢ ĐỊNH** (cần kiểm bằng dữ liệu).

### Sự thật
- Người ta tìm đến chiêm tinh và bói toán chủ yếu để **giảm bất định và lo âu**; nhóm trẻ nhạy
  với điều này nhất ([in-mind.org](https://www.in-mind.org/article/horoscopes-why-we-believe-in-them)).
- **Hiệu ứng Barnum:** mô tả chung chung vẫn được cảm nhận là "đúng với mình". Người tin mạnh
  còn đánh giá quá cao mức khớp ([Cleveland Clinic](https://health.clevelandclinic.org/barnum-effect),
  [ResearchGate](https://www.researchgate.net/publication/238047697_Popular_Horoscopes_and_the_Barnum_Effect)).
- Chiêm tinh đóng vai **xây dựng bản sắc và cách đối phó (coping)**. Việc được "đọc trúng" góp
  phần tạo một khái niệm bản thân ổn định ([IJFMR 2024](https://www.ijfmr.com/papers/2024/4/26856.pdf),
  [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9932533/)).
- **Việt Nam:** giới trẻ dùng thần số và tarot để **chọn ngành, đổi nghề**; hỏi nhiều qua bình
  luận TikTok ([Tuổi Trẻ, 7/2024](https://tuoitre.vn/qua-lo-vi-gioi-tre-chon-nganh-nghe-theo-boi-bai-than-so-hoc-20240701092327235.htm)).
  Sự kiện HOROS thu hút hơn 4.000 người trẻ ([horos.vn](https://horos.vn/)).
- **Chia sẻ kết quả:** lý do chính là để thể hiện bản sắc ("được hiểu mà không phải tự giải
  thích"), vừa hoà vào nhóm vừa khác biệt (optimal distinctiveness — Brewer 1991), cộng nhu cầu
  so sánh xã hội ([The Conversation](https://theconversation.com/spotify-wrapped-is-about-more-than-what-songs-you-listen-to-its-about-what-makes-you-you-245019),
  [NoGood](https://nogood.io/blog/spotify-wrapped-marketing-strategy/)).
- **Hợp đôi là động cơ lan truyền:** The Pattern xếp mối quan hệ thành 6–7 hạng; người dùng tự
  quay video TikTok về các hạng đó. Có thể tạo hồ sơ cho người chưa dùng app
  ([App Store](https://apps.apple.com/us/app/the-pattern/id1071085727),
  [TikTok](https://www.tiktok.com/discover/the-pattern-bonds-explained)).
- **Bài học từ đối thủ (case study CHANI):**
  - Co–Star đọc lướt tốt nhưng lạnh về cảm xúc.
  - CHANI đẹp nhưng rối (collage, khối chữ dài); người dùng không nhớ "bài đọc hôm trước nằm ở
    đâu", nên cần một **trung tâm cố định dễ nhận ra**
    ([Medium case study](https://medium.com/@info_45537/tl-dr-14868841ed2c)).
- **Onboarding:** người hoàn thành **một hành động cốt lõi** ngay phiên đầu có khả năng ở lại cao
  hơn hẳn ([Appcues](https://www.appcues.com/blog/user-onboarding-ui-ux-patterns),
  [Chameleon](https://www.chameleon.io/blog/onboarding-ux-patterns)).

### Suy luận (từ trên)
1. **Nhu cầu sâu nhất là "được hiểu", không phải "được báo trước".** Khoảnh khắc giá trị là lúc
   người dùng thấy **một câu trúng mình**, nên màn đầu tiên phải đưa ra được câu đó thật nhanh.
2. Barnum là con dao hai lưỡi. Đối thủ dùng nó để giữ chân. Ta dùng **sự trung thực** (mặt tối,
   câu tự soi, nguồn, chỗ các trường phái không thống nhất) làm **khác biệt về niềm tin**. Tách
   rõ 3 lớp **ĐÃ TÍNH / DIỄN GIẢI / TỰ SOI** (Blueprint §17) chính là cách hiện sự trung thực đó
   lên giao diện.
3. Người trẻ Việt dùng thần số cho **quyết định lớn** (nghề, người yêu). UI phải có sẵn rào an
   toàn: không khẳng định tương lai, không hù doạ, có lối dẫn sang câu hỏi tự soi.
4. **Hồ sơ = trung tâm cố định** (bài học CHANI). Mọi mảng đọc từ một hồ sơ, người dùng không
   phải nhập lại ngày sinh (đây là điểm đau lớn nhất của UI hiện tại).
5. **Thẻ chia sẻ phải là "danh tính", không phải "kết quả":** một con số lớn + 3 từ khoá + một
   câu trúng, vừa khoe được vừa không lộ ngày sinh.

### Giả định (phải kiểm bằng UI-6)
- G1: Hé lộ từng lớp ("nghi thức") làm tăng tỉ lệ đọc hết so với đổ cả trang văn.
  Đo bằng `reading_completed / reading_started`.
- G2: Thẻ Metaphysics ID được chia sẻ ≥ 8% số người đọc xong. Đo bằng `share_created`.
- G3: Hợp đôi + link mời có K-factor > 0,15 ở giai đoạn đầu. Đo bằng `referral_signup / share_created`.
- G4: Phong cách "huyền bí, vũ trụ tối" không làm giảm cảm giác tin cậy. Đo bằng câu góp ý sau
  bài đọc ("Bài đọc này có giúp bạn hiểu mình hơn?").

## 3. Chân dung người dùng (giả định, cần phỏng vấn 20–50 người để xác nhận — Gate 0)

| Persona | Bối cảnh | Câu hỏi thật trong lòng | Điều cần thấy |
|---|---|---|---|
| **Linh, 21 — người tò mò** | Lướt TikTok thấy "số chủ đạo 7", mở bằng điện thoại | "Mình là kiểu người gì? Có ai giống mình không?" | Kết quả trong < 30 giây, một câu trúng, thứ để khoe |
| **Tuấn, 28 — người ở ngã rẽ** | Đang tính nghỉ việc / chia tay | "Mình có đang đi đúng hướng? Giai đoạn này nên tập trung gì?" | Chiều sâu (năm cá nhân, dải đời), hỏi đáp riêng; không bị hù doạ |
| **Mai, 25 — người tìm kết nối** | Mới quen một người | "Hai đứa có hợp không? Người ấy nghĩ gì?" | Hợp đôi nhanh, điểm hoà + điểm va + việc cùng làm; gửi được cho người kia |
| **Cô Hạnh, 45 — người thực dụng** | Sắp làm nhà, lo tuổi, lo hướng | "Năm nay làm nhà được không? Hướng nào hợp?" | Phong thuỷ rõ ràng, phân biệt cổ thư và dân gian, không bán vật phẩm hoá giải |

## 4. Nguyên tắc thiết kế

1. **Một câu trúng trước, chiều sâu sau.** Trình tự: số lớn → từ khoá → một câu → mở rộng dần
   (progressive disclosure).
2. **Ba lớp luôn tách bằng màu và biểu tượng:** ĐÃ TÍNH (ngọc, la bàn) · DIỄN GIẢI (vàng kim,
   cuốn sách) · TỰ SOI (ánh trăng, câu hỏi). Người dùng luôn biết câu nào là toán, câu nào là
   truyền thống, câu nào là để tự ngẫm.
3. **Nhập một lần, dùng mọi nơi.** Hồ sơ lưu trên máy, có tuỳ chọn lưu vào tài khoản. Chỉ hỏi
   thêm giờ sinh, giới tính, nơi sinh khi mảng cần đến (hỏi dần, đúng lúc).
4. **Huyền bí nhưng trung thực.** Không đồng hồ đếm ngược, không "tai hoạ", không "trả tiền để
   hoá giải". Hiệu ứng chỉ để tạo cảm giác nghi thức, không che giấu thông tin.
5. **Trung tâm cố định.** Tab "Bản thân" luôn là nhà; bài đọc, câu hỏi, hợp đôi đều quay về đó.
6. **Điện thoại trước.** 90% lưu lượng dự kiến từ TikTok/Facebook. Vùng chạm ≥ 44px, tab dưới,
   sheet trượt từ dưới, chữ ≥ 16px.
7. **Trợ năng là chuẩn tối thiểu:** tương phản WCAG AA trên nền tối, tôn trọng
   `prefers-reduced-motion`, dùng được bằng bàn phím, nhãn tiếng Việt cho trình đọc màn hình.
8. **Web không tự tính.** Mọi con số lấy từ engine qua route handler (giữ nguyên ranh giới
   CLAUDE.md).

## 5. Kiến trúc thông tin

```
/                      Trang chủ = landing + ô nhập (chưa có hồ sơ) | "Hôm nay của bạn" (đã có hồ sơ)
/ban-than              Metaphysics ID — trung tâm: thẻ danh tính, bài đọc thần số, lối vào các mảng
/than-so               Bài đọc thần số đầy đủ (3 lớp) + khung chat hỏi
/hop-doi               Tạo hợp đôi (bạn × người kia) → kết quả → chia sẻ / gửi lời mời
/hop-doi/[ma]          Trang người được mời: teaser → tạo hồ sơ → mở khoá đầy đủ
/kham-pha              4 mảng Huyền học (cần hồ sơ; hỏi thêm giờ sinh khi cần)
/tu-vi /kinh-dich /bat-tu /phong-thuy   Mỗi mảng: tóm tắt trực quan + khung chat
/dang-nhap             Email (link/OTP) · Google · SMS OTP
/tai-khoan             Hồ sơ đã lưu, xoá hồ sơ / xoá tài khoản, xuất dữ liệu
```

**Điều hướng:**
- Điện thoại: thanh tab dưới gồm **Bản thân · Hợp đôi · Khám phá · Tài khoản**.
- Máy tính: thanh trên cùng, cùng 4 mục.

## 6. Luồng chính

### 6.1 Phase 1 — Hút người (H1, H2)
```
Landing (hero: "Con số nói gì về bạn?")
  → Nhập: Họ tên + ngày sinh (2 trường, 1 màn)          [reading_started]
  → Nghi thức "đang tính" ~1,6 s: hiện đúng các bước engine thật làm
    (quy tên → cộng ngày sinh → rút gọn)                  (không giả vờ chậm; tắt nếu reduced-motion)
  → Hé lộ: số Đường đời cỡ lớn + từ khoá + một câu
  → Cuộn: 4 số cốt lõi (thẻ lật: ĐÃ TÍNH → DIỄN GIẢI → TỰ SOI)
  → Chiều sâu: dải đời, năm cá nhân, biểu đồ ngày sinh (thu gọn sẵn)   [reading_completed khi cuộn tới cuối]
  → Thẻ Metaphysics ID + 3 nút: Lưu hồ sơ · Chia sẻ · Xem hợp đôi      [profile_created, share_created]
  → Góp ý 1 chạm: "Bài đọc có giúp bạn hiểu mình hơn?"                  [feedback_submitted]
```

### 6.2 Phase 2 — Lan truyền (H3)
```
A: /hop-doi → nhập người kia (tên tuỳ chọn + ngày sinh)                 [compatibility_created]
   → kết quả: hạng mối quan hệ + điểm hoà / điểm va / việc cùng làm
   → "Gửi cho người ấy" → tạo mã mời (/hop-doi/[ma])                  [share_created{kind:invite}]
B: mở link                                                             [share_clicked]
   → teaser: tên hiển thị của A + số đường đời của A (A đã đồng ý khi tạo link; KHÔNG lộ ngày sinh A)
   → B nhập ngày sinh của mình → xem hợp đôi đầy đủ + bài đọc riêng     [referral_signup khi B tạo hồ sơ]
   → B có thể mời C
```

### 6.3 Huyền học (ngoài phễu chính)
Mở /kham-pha → chọn mảng → nếu thiếu dữ liệu thì sheet hỏi thêm (giờ sinh, giới tính, nơi sinh
trước 13/6/1975) → hiện tóm tắt trực quan (lá số / quẻ / tứ trụ / la bàn) → khung chat với câu
hỏi gợi ý.

## 7. Hệ thống thiết kế "Đêm sao phương Đông"

**Công nghệ** (chủ dự án duyệt 2026-09-30):
- Tailwind CSS 3.4 và thành phần theo mẫu shadcn/ui (Radix primitives, code nằm trong repo
  `web/components/ui`).
- `motion` (framer-motion) cho chuyển cảnh.
- `lucide-react` cho biểu tượng.
- Chọn Tailwind 3 vì shadcn ghi rõ nhánh v3 + React 18 được hỗ trợ; stack Next 14/React 18 đã
  chốt, không nâng.

**Màu (token CSS `--*`, tên theo vai trò):**

| Token | Giá trị | Vai trò |
|---|---|---|
| `--bg` | `#0a0a17` | Nền đêm (chàm thẫm) |
| `--surface` / `--surface-2` | `#12122a` / `#1a1a38` | Thẻ, sheet |
| `--line` | `#2a2a4d` | Viền |
| `--fg` / `--fg-muted` / `--fg-faint` | `#ecebf7` / `#b3b1cf` / `#8583a6` | Chữ (AA trên nền) |
| `--gold` | `#e9c46a` | Nhấn chính, DIỄN GIẢI |
| `--jade` | `#6fd3b5` | ĐÃ TÍNH |
| `--moon` | `#b9a7ff` | TỰ SOI |
| `--cinnabar` | `#ef8a6f` | Mặt tối / cảnh báo mềm |

**Chữ:**
- Newsreader (serif, chữ số đẹp) cho tiêu đề và con số lớn.
- Be Vietnam Pro cho nội dung.
- Giữ 2 font hiện có, không thêm font.

**Hình nền:**
- Trường sao vẽ bằng CSS (radial-gradient, không dùng ảnh).
- Vòng lạc thư / bát quái bằng SVG nét mảnh.
- Hào quang vàng rất nhẹ quanh con số chính.

**Chuyển động:**
- 150–400 ms, easing `[0.22, 1, 0.36, 1]`.
- Hé lộ theo stagger 60 ms.
- Tắt hết khi bật `prefers-reduced-motion`.

**Thành phần:**

| Nhóm | Thành phần |
|---|---|
| Cơ bản | Button, Input, Label, Select, Tabs, Dialog/Sheet, Accordion, Toast, Tooltip, Badge, Skeleton |
| Riêng | `NumberHero`, `LayerCard` (3 lớp), `IdentityCard`, `ChatPanel` (dùng cho 5 mảng), `BirthSheet` (hỏi thêm dữ liệu), `ReadingRitual`, `StarField`, `BottomNav`, `FeedbackPulse` |

## 8. Dữ liệu, quyền riêng tư, kết nối backend

- **Hồ sơ trên máy** (mặc định):
  - `localStorage["hbt.hoso.v1"]` = `{ho_ten[], ngay_sinh, gio_sinh?, gioi_tinh?, vung?, tao_luc}`.
  - Không gửi lên server trừ lúc gọi engine tính (như hiện nay).
- **Tài khoản** (tuỳ chọn, UI-4):
  - Supabase Auth: email OTP/magic link, Google, SMS OTP.
  - Migration `0006_ho_so` + `.down.sql`:
    - Bảng `ho_so(user_id pk → auth.users, ten_hien_thi, ho_ten jsonb, ngay_sinh date, gio_sinh time null, gioi_tinh, vung, tao_luc, cap_nhat_luc)`.
    - **RLS:** chỉ chủ sở hữu đọc/ghi.
  - Nút "Xoá hồ sơ" và "Xoá tài khoản" chạy ngay, không giữ bản sao.
  - **Vẫn cấm:** lưu nội dung luận giải gắn user_id; nhật ký hỏi vẫn ẩn danh (0004/0005 giữ nguyên).
- **Lời mời hợp đôi** (UI-5):
  - Migration `0007_loi_moi` + `.down.sql`: bảng `loi_moi(ma text pk, ten_hien_thi, so_duong_doi smallint, tao_luc, het_han, so_lan_mo int)`.
  - Chỉ lưu **tên hiển thị + số đường đời** người mời đã đồng ý công khai; không có ngày sinh,
    không có user_id.
  - Gán nguồn giới thiệu chỉ bằng `ma` trên sự kiện đo lường.
  - Ghi qua route handler bằng service key (server-side), RLS chặn client ghi trực tiếp.
- **Engine:**
  - Thêm `/v1/thanso/hop-doi` (deterministic, test trước) trả về số hai người, `cap` và nghĩa
    `thanso_cap_so`.
  - Các `/hoi` hiện có giữ nguyên hợp đồng.

## 9. Đo lường (UI-6, PostHog — chủ dự án duyệt)

- **Sự kiện** (Blueprint §19 và bộ sự kiện của venture pack):
  - Phase 1: `landing_viewed`, `reading_started`, `reading_completed`, `profile_created`, `feedback_submitted`.
  - Phase 2: `compatibility_created`, `share_created`, `share_clicked`, `referral_signup`.
  - Hỏi đáp: `advisor_question_started`, `advisor_question_completed`.
- **Thuộc tính cho phép:** `feature_version`, `mo_dun`, `kind`, `ma_moi`, `so_duong_doi`. Số đường
  đời chỉ là 1 trong 12 giá trị, không định danh được người.
- **Tuyệt đối không gửi:** ngày sinh, giờ sinh, họ tên, nội dung câu hỏi.
- Không có `NEXT_PUBLIC_POSTHOG_KEY` → không gửi gì, UI vẫn chạy bình thường.
- Tắt autocapture và session recording (tránh lộ ô nhập ngày sinh).

## 10. Kế hoạch

| PR | Nội dung | Chấp nhận khi |
|---|---|---|
| UI-0 | Tài liệu này, PROJECT_STATE, quyết định CLAUDE.md | Chủ dự án đọc |
| UI-1 | Nền tảng: Tailwind + shadcn/Radix + motion, token, app shell, tab dưới, hồ sơ trên máy, landing mới | typecheck, build, E2E cũ vẫn chạy/được cập nhật |
| UI-2 | Thần số: nhập → nghi thức → hé lộ 3 lớp → Metaphysics ID → ChatPanel | E2E luồng chính, Lighthouse a11y ≥ 95 trên điện thoại |
| UI-3 | 4 mảng Huyền học dùng hồ sơ + BirthSheet + ChatPanel + hình trực quan | E2E 4 mảng |
| UI-4 | Tài khoản Supabase + migration 0006 + đồng bộ + xoá | RLS test, E2E khi không có Supabase (ẩn nút) |
| UI-5 | Engine `/hop-doi` (test trước) + trang hợp đôi + thẻ chia sẻ (`next/og`) + link mời + migration 0007 | Golden hợp đôi, E2E luồng mời |
| UI-6 | PostHog + góp ý + bảng funnel | Sự kiện kiểm bằng test, không lộ PII |

**Chủ dự án cần chuẩn bị trước UI-4, UI-5, UI-6:**
- Bật Supabase Auth: email, Google OAuth client, nhà cung cấp SMS.
- Đặt `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server).
- Tạo `NEXT_PUBLIC_POSTHOG_KEY` (khuyến nghị PostHog EU hoặc US cloud).

## 11. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Phong cách tối huyền bí đẩy cảm nhận sang "bói toán" | Ba lớp ĐÃ TÍNH/DIỄN GIẢI/TỰ SOI luôn hiện; ngôn ngữ tự soi; đo bằng G4 |
| Lưu ngày sinh trên tài khoản (NĐ 13/2023 — dữ liệu cá nhân) | Chỉ khi người dùng bấm lưu; có đồng ý rõ ràng; RLS; xoá ngay; không lưu luận giải |
| Link mời lộ thông tin người mời | Chỉ tên hiển thị + số đường đời; người mời xem trước teaser và đồng ý |
| Làm Phase 2 trước Gate 1 che mất tín hiệu Phase 1 | Tách funnel theo `feature_version`; báo cáo Gate 1 riêng |
| Thư viện mới làm nặng bundle | Chỉ import primitives cần dùng; `motion` tải kèm trang cần; đo First Load JS mỗi PR |
