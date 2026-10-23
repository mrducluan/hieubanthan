# Rà soát UI Kinh Dịch (UI-KD, 2026-10-23)

Khâu vòng tăng trưởng: **QUAY LẠI** (gieo lại cho việc mới, xem lại quẻ cũ) + **TRẢI NGHIỆM** (nghi thức gieo thay vì kết quả
bật ra) + **MỜI** (thẻ "Quẻ của tôi"). Đo: `chart_interacted{mo_dun=kinhdich, kind=coin_toss_started | coin_toss_completed
(ket_qua=du_6|bo_qua, nguon=cách ra quẻ) | que_replayed | cach_gieo}`, `share_created{kind=que|que_anh}` → `share_clicked{qu}`
→ `referral_signup`; `reading_started`/`reading_completed{kinhdich}` vẫn như cũ (Gate 1/2). Chỉ mã — không bao giờ gửi câu hỏi.

Ràng buộc giữ nguyên (CLAUDE.md): quẻ / hào động / quẻ biến / tên quẻ **do engine sinh** (`calc/kinhdich.py`, gieo CSPRNG ở tầng
API; LLM không chọn quẻ); web chỉ hiển thị và gom đầu vào; lời đời thường, không doạ, không "quẻ xấu"; chặn khủng hoảng / ngày
chết / xổ số vẫn ở engine; thẻ chia sẻ = mã HMAC không mang câu hỏi. **Không sửa engine** trong đợt này.

## 1. Hiện trạng trang `/kinh-dich` (trước UI-KD)

- Một khung chat (`KhungChat`) + bộ điều khiển: chip chủ đề (20), chế độ đọc (tự động / Nghĩa Lý / đầy đủ), cách ra quẻ
  (máy gieo · Mai Hoa giờ · Mai Hoa số · Mai Hoa phương · tự gieo), ô gõ "6 hào (6/7/8/9)".
- Kết quả: `VeQue` quẻ bản + quẻ biến (hào động vàng), dòng "Phái đọc · nguồn quẻ", dòng âm lịch Mai Hoa, `DocQue` hai tầng
  (đời thường hiện ngay; "Vì sao nói vậy", ba cách đọc, lời kinh, bản theo sách gập), chip "Hỏi tiếp", ứng kỳ + nhắc việc,
  gợi mở chéo, góp ý cuối bài, CTA cuối bài. Nhắc "đã hỏi câu này trong 30 ngày" (quẻ Mông) lưu trên máy.
- Trang **không** dùng bảng chữ ND-7 (`useChu`/`taoChu`) — chữ cứng trong `KinhDich.tsx`; SEO/H1/lời dẫn đã qua CMS
  `TrangCongCu`. Đợt này giữ chữ cứng (không mở rộng bảng chữ để không đụng `web/lib/chu/*` đang được đợt ND-7 quản).

## 2. Nỗi đau người xem Kinh Dịch ↔ UI hiện có

| # | Nỗi đau (từ hỏi đáp, ma trận nỗi đau, persona) | UI trước UI-KD | Sau UI-KD |
|---|---|---|---|
| N1 | Muốn **tự gieo cho "thiêng"** nhưng ô "6 hào 6/7/8/9" không hiểu: 6 là gì, 9 là gì, ghi từ đâu | ✗ chỉ ô gõ số | ✅ bộ chọn `ChonHao`: mỗi lần gieo bấm đồng xu **ngửa** (ngửa 3 + sấp 2) hoặc bấm thẳng Âm · Dương · Âm động · Dương động; quẻ dựng dần; ô gõ nhanh vẫn còn |
| N2 | Muốn **thấy quá trình gieo**, không phải kết quả bật ra — "máy gieo" cảm giác như xem bói máy | ✗ kết quả hiện ngay | ✅ `GieoDongXu`: engine vẫn gieo (CSPRNG) nhưng web **lật từng lần** 1→6, ba đồng xu lật theo đúng giá trị engine, hào động sáng vàng, đủ 6 mới hiện tên quẻ + lời; "Bỏ qua, xem luôn" |
| N3 | **Không hiểu hào động / quẻ biến** (vì sao có hai quẻ, cái nào là "đáp án") | ◐ chỉ chú thích "động" nhỏ | ✅ một câu đời thường ngay dưới hai quẻ: "Vạch vàng là hào động (hào n) — chỗ việc đang chuyển; đổi vạch đó thì ra quẻ biến: xu hướng việc chuyển tới" (`giai-thich-dong`) |
| N4 | Muốn **xem lại quẻ đã gieo** (hôm trước gieo cho việc này, giờ muốn đọc lại thay vì gieo lại) | ✗ chỉ có nhắc "đã hỏi trong 30 ngày", không có cách xem lại | ✅ `LichSuQue` (≤ 20, `hbt.que.v1`, chỉ trên máy): câu hỏi ≤ 200 ký tự, 6 giá trị, cách, chủ đề, giờ, tên quẻ/biến; "Xem lại" gọi engine `gieo_tay` + đúng 6 giá trị (tất định, không gieo lại, không lưu thêm, không nghi thức); xoá từng quẻ / xoá hết |
| N5 | **Không biết hỏi thế nào cho đúng** (một việc? có mốc thời gian? câu có/không?) | ◐ lời chào + gợi ý câu + chip làm rõ của engine | ✅ "Hỏi thế nào cho đúng" trong `CachGieo`: 3 cặp Nên / Chưa rõ (một việc · mốc thời gian · không hỏi sống chết, bệnh, trúng số — hệ thống từ chối) |
| N6 | **Không biết gieo đồng xu thật** thế nào (mấy đồng, mấy lần, ghi từ trên hay dưới) | ✗ | ✅ "Cách gieo đồng xu thật (1 phút)": 3 bước có hình SVG nội dòng (chuẩn bị + câu hỏi · gieo 6 lần ghi từ DƯỚI lên · nhập) + quy ước đồng xu |
| N7 | **Không biết giờ gieo** đang được tính là lúc nào (Mai Hoa theo giờ, ngày Lục Hào) | ◐ dòng ngày âm + giờ chi cho Mai Hoa | ✅ Mai Hoa: thêm chi năm + "lúc HH:MM ngày dd/mm" (giờ VN **engine trả** trong `mai_hoa.dau_vao.thoi_diem`); máy gieo / tự gieo: "Gieo lúc HH:MM · dd/mm (giờ máy của bạn)" + chỉ dẫn ngày Lục Hào nằm ở "Ba cách đọc" (xem mục 6 — engine chưa trả can chi ngày/giờ ở trường riêng) |
| N8 | Muốn **gửi quẻ cho người khác** (bạn bè, người cùng cân nhắc) | ✗ | ✅ thẻ "Quẻ của tôi": mã HMAC `que|` (6 giá trị + tên quẻ/biến + chủ đề + tên hiển thị; **không** câu hỏi / giờ gieo / lời đọc), `/og/que`, `/the/que/[ma]` noindex, `/api/chia-se/que` máy chủ đọc lại qua engine rồi ký |

## 3. Phác thảo ý tưởng (G = giải nỗi đau 1–3 · V = giá trị vòng tăng trưởng · C = chi phí thấp 1–3 · R = rủi ro quy tắc thấp 1–3)

| Ý tưởng | G | V | C | R | Quyết định |
|---|---|---|---|---|---|
| P1 Gieo 3 đồng xu có nghi thức (engine gieo, web lật từng lần) | 3 | TRẢI NGHIỆM/QUAY LẠI 3 | 3 | 3 (không đổi phép tính) | ✅ làm |
| P2 Bộ chọn tự gieo bằng đồng xu / kiểu hào | 3 | THU HÚT 2 | 3 | 3 | ✅ làm |
| P3 Cách gieo thật + hỏi cho đúng | 2 | THU HÚT 2 | 3 | 3 | ✅ làm |
| P4 Lịch sử quẻ trên máy + Xem lại tất định | 3 | QUAY LẠI 3 | 3 | 3 (chỉ localStorage) | ✅ làm |
| P5 Giờ gieo hiện rõ | 2 | 1 | 3 | 3 | ✅ làm; KD-2: engine trả `thoi_diem_gieo` {thời điểm giờ VN, can chi ngày, chi tháng, chi giờ, tuần không} cho MỌI cách ra quẻ — web hiện ở máy gieo / tự gieo / Mai Hoa số / phương; Xem lại gửi `thoi_diem` lúc gieo → Lục Hào đọc theo ngày gieo |
| P6 Thẻ "Quẻ của tôi" | 2 | MỜI 3 | 2 | 3 (mã không câu hỏi) | ✅ làm |
| P7 Lắc điện thoại để gieo (DeviceMotion → gọi engine) | 2 | 2 | 2 | 2 (quyền cảm biến, chỉ là nút bấm khác) | ✅ làm (KD-2, 2026-10-23): nút "Lắc điện thoại để gieo" trong `GieoDongXu`, iOS xin phép khi bấm, mỗi cú lắc (giật gia tốc > 12 m/s², cách ≥ 0,9 s) = một lần lật; sáu giá trị vẫn của engine, KHÔNG lấy số từ cảm biến; đo `coin_toss_shake` |
| P8 "Quẻ ngày của bạn" ghi vào Hôm nay (đã có quẻ đầu ngày chung) | 1 | QUAY LẠI 2 | 2 | 3 | ✅ làm (KD-2): **Mai Hoa theo hai số người dùng tự nghĩ tới** + chi giờ lúc khởi (`/v1/kinhdich/que-rieng`, cùng gói nghĩa nôm na với quẻ đầu ngày) — KHÔNG lấy số từ ngày sinh (không có công thức tự chế); nhớ trên máy theo ngày (`hbt.que_rieng.v1`, một ngày một quẻ), link "Đọc kỹ quẻ này" → `/kinh-dich?cach=mai_hoa_so&so=a,b` điền sẵn; đo `que_rieng` |
| P9 Nhật ký "quẻ ứng không?" — 30 ngày sau hỏi lại (đã có `kiem_chung_sau` Q7 cho Phong thuỷ) | 3 | HỌC 3 | 2 | 2 (cần nối mã `ds.kinhdich.*` với lịch sử trên máy) | ✅ làm (KD-2): gieo xong (không phải Xem lại) máy nhớ MÃ hộp lời đọc (`ds.kinhdich.*`, ưu tiên Lời khuyên / Nên để ý) + phái + nhãn "Quẻ X — chủ đề" vào `hbt.kc_sau.v1` (`loai_hoi: que`, không câu hỏi / sáu hào); ≥ 30 ngày sau Hôm nay **và** trang Kinh Dịch hỏi "Bạn có làm theo hướng quẻ gợi không? · Việc đó giờ ra sao?" → phiếu `/api/kiem-chung/sau` (chỉ mã + hai mức; DB chưa chạy 0022 thì `chua_bat`, không lỗi) |
| P10 Âm thanh đồng xu rơi | 1 | 1 | 2 | 2 (tự động phát âm thanh gây khó chịu) | ✗ không làm |

## 4. Đã làm (tệp)

- `web/lib/dong-xu.ts` — quy đổi hiển thị ba đồng xu ↔ 6/7/8/9 (`giaTriTuXu`, `xuTuGiaTri`, `docGoNhanh`, `giaTriTuQue`
  — đọc `que.gia_tri_hao_1_den_6` engine trả, dự phòng ánh xạ ngược một–một từ `am_duong` + `hao_dong`).
- `web/lib/lich-su-que.ts` — `hbt.que.v1`, ≤ 20, `luuQue` / `xoaQue` / `xoaHetQue` / `docLichSuQue`.
- `web/components/kinh-dich/DongXu.tsx` — `DongXu` (SVG đồng xu tròn lỗ vuông, `role=img` / nút bật tắt, `data-mat`),
  `VachHao`, `GieoDongXu` (nghi thức: nút "Gieo lần n" × 6, lật bằng `motion` rotateX, `useReducedMotion` → hiện ngay,
  `aria-live` đọc "Hào n: Dương động", "Bỏ qua, xem luôn").
- `web/components/kinh-dich/ChonHao.tsx` — bộ chọn 6 lần gieo (đồng xu bật/tắt + 4 kiểu hào cho lần đang chọn), quẻ dựng
  dần (`VeQueNho`), "Làm lại", ô gõ nhanh (giữ aria-label "Sáu hào tự gieo").
- `web/components/kinh-dich/CachGieo.tsx` — hướng dẫn gập 3 bước + "Hỏi thế nào cho đúng".
- `web/components/kinh-dich/LichSuQue.tsx` — danh sách quẻ đã gieo, Xem lại, xoá.
- `web/components/kinh-dich/KetQuaQue.tsx` — khung kết quả: nghi thức trước (may_gieo) → quẻ + lời chính + giải nghĩa +
  cảnh báo (vẽ ở đây để KhungChat không lộ tên quẻ sớm); `reading_started` bắn khi quẻ hiện.
- `web/components/kinh-dich/NutChiaSeQue.tsx`, `web/app/api/chia-se/que/route.ts`, `web/app/og/que/route.tsx`,
  `web/app/the/que/[ma]/page.tsx`, `kyMaQue`/`docMaQue` trong `web/lib/ma-moi.ts`.
- `web/components/huyen-hoc/VeQue.tsx` — thêm `VeQueNho` (vẽ 6 vạch từ 6 giá trị, không tên).
- `web/app/kinh-dich/KinhDich.tsx` — ghép; nhãn cách ra quẻ: "Máy gieo, tôi lật từng hào" · "Tôi gieo đồng xu thật".
- `web/e2e/kinh-dich.spec.ts` — 8 test cũ (2 test máy gieo bấm thêm "Bỏ qua") + 4 test mới (nghi thức · bộ chọn · lịch sử ·
  thẻ), mock bằng `page.route` đổi thân yêu cầu sang `gieo_tay` để engine thật trả quẻ cố định.

## 5. Bố cục trang sau UI-KD (điện thoại ≤ 390px)

1. Đầu trang (CMS) → 2. Khung chat: lời chào · gợi ý câu · chip chủ đề · chế độ · cách ra quẻ · (bộ chọn khi tự gieo) ·
"Cách gieo đồng xu thật (1 phút)" · ô câu hỏi → 3. Kết quả: nghi thức lật xu (máy gieo) → quẻ bản / biến + câu giải thích hào
động + phái đọc + giờ gieo + "Chia sẻ quẻ" → `DocQue` → 4. "Quẻ đã gieo" (gập, chỉ máy này) → 5. Góp ý + CTA cuối bài.
Lớp **ĐÃ TÍNH** (quẻ, hào, giờ) · **DIỄN GIẢI** (`DocQue` đời thường) · **TỰ SOI** (câu tự hỏi mình, kiểm chứng) giữ nguyên.

## 6. Engine đã bổ sung (KD-2, 2026-10-23)

1. **`thoi_diem_gieo`** trong `/v1/kinhdich/hoi` cho mọi cách ra quẻ: `{thoi_diem (ISO giờ VN), can_ngay, chi_ngay, chi_thang,
   chi_gio, tuan_khong}` (`hoidap/kinhdich.tra_loi`, một nguồn với căn cứ Lục Hào); route web `/api/kinhdich/hoi` nhận `thoi_diem`
   (giờ VN không múi) để "Xem lại" đọc theo ngày gieo.
2. **`POST /v1/kinhdich/que-rieng`** `{so: [a, b], thoi_diem?}` → quẻ Mai Hoa theo số + nghĩa nôm na KB (`luangiai/hom_nay.que_rieng`,
   dùng chung `_goi_que` với quẻ đầu ngày). Không câu hỏi, không hồ sơ, không nhật ký.
3. Chưa làm: `/khoi-que` nhận `chu_de` để thẻ quẻ bớt một lượt gọi (giá trị thấp).
