# Nhắc việc opt-in và Web Push — nghiên cứu + lộ trình (KC-4, 2026-10-21)

Chủ dự án duyệt: "Ứng kỳ → nhắc việc opt-in … nghiên cứu có thể bắn notification web app để nhắc users".

## 1. Đã làm (GĐ0 — không cần máy chủ, không dependency)

| Việc | Ở đâu | Dữ liệu |
|---|---|---|
| Nút **"Nhắc tôi hôm đó"** ở ứng kỳ Lục Hào (Kinh Dịch) và tháng thuận sửa nhà (Phong thuỷ → `tu_ngay` tháng tiết) | `components/khung/NhacToi.tsx` | chỉ `ngay + mã + nhãn do engine/web soạn + đường dẫn trong site`; không câu hỏi, không lá số |
| Lưu **trên máy** (`localStorage` `hbt.nhac.v1`, ≤ 50 mốc) | `lib/nhac-viec.ts` | |
| Hiện ở **Hôm nay**: hôm nay / hôm qua / 7 ngày tới, xoá được | `components/khung/NhacHomNay.tsx` | |
| **"Vào lịch"**: tải tệp `.ics` một sự kiện cả ngày, báo 9:00 sáng → điện thoại/máy tính tự nhắc bằng ứng dụng Lịch (không cần Web Push, không cần tài khoản) | `icsCho()` | |
| Tài khoản (tuỳ chọn, người dùng bấm "cả trên tài khoản"): bảng `nhac_viec` **migration 0018** (RLS chủ sở hữu, ≤ 50, dọn sau 400 ngày) | `lib/tai-khoan-nhac.ts` | |

Đo: `chart_interacted{kind=nhac_viec}`; sau 2 tuần nhìn tỉ lệ người bấm nhắc quay lại Hôm nay đúng ngày (D-mốc).

## 2. Web Push — có làm được không, làm thế nào

**Cơ chế**: trình duyệt cấp một *subscription* (endpoint + khoá) khi người dùng bấm "Cho phép thông báo" → máy chủ lưu
subscription → khi tới ngày, máy chủ gửi gói đã mã hoá tới endpoint (Google/Apple/Mozilla relay) → **service worker** của
site nhận và hiện thông báo, kể cả khi tab đã đóng.

| Nền tảng | Hỗ trợ | Ghi chú |
|---|---|---|
| Android Chrome/Edge/Samsung, máy tính Chrome/Edge/Firefox | ✅ | Hoạt động ngay trên web, không cần cài |
| iOS/iPadOS Safari 16.4+ | ⚠️ chỉ khi người dùng **"Thêm vào màn hình chính"** (PWA) rồi bấm cho phép trong app đó | Trang đã có `manifest.ts`; cần thêm service worker + hướng dẫn 2 bước cho người dùng iPhone |
| macOS Safari 16+ | ✅ | |

**Cần làm (GĐ1, ~3–4 ngày)**:
1. **Service worker** `public/sw.js` (nhận `push`, hiện `showNotification`, bấm → mở `duong`). CSP hiện dùng nonce + `strict-dynamic`
   → đăng ký SW bằng script có nonce; thêm `worker-src 'self'` vào `lib/csp.ts`, kiểm bằng `e2e/csp.spec.ts`.
2. **Khoá VAPID** (cặp khoá ES256, tạo một lần) — env `VAPID_PUBLIC_KEY` (public, đưa xuống trình duyệt), `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT=mailto:contact@hieuban.com`. Không hardcode.
3. **Bảng `push_dang_ky`** (migration 0019, chờ duyệt): `user_id` (bắt buộc đăng nhập — để xoá được, không lưu ẩn danh),
   `endpoint`, `p256dh`, `auth`, `tao_luc`, `lan_cuoi_gui`; RLS chủ sở hữu; xoá khi 410 Gone. Không lưu nội dung nhắc trong
   bảng này (nội dung lấy từ `nhac_viec` lúc gửi).
4. **Gửi**: cron ngày (`/api/cron/nhac-day`, service role) — mỗi sáng 8:00 giờ VN gom `nhac_viec` có `ngay = hôm nay`
   của người có `push_dang_ky` → gửi `{title: nhãn, body: "Mốc bạn đã đánh dấu — nhịp gợi ý", url: duong}`. Giới hạn 1 thông báo/ngày/người.
5. **Mã hoá gói**: RFC 8291 (aes128gcm) + JWT VAPID (RFC 8292). Hai lựa chọn:
   - **Dependency `web-push` (MIT, ~0 dep ngoài)** — chuẩn, ít lỗi. **Cần anh duyệt dependency** (CLAUDE.md).
   - Tự viết bằng `node:crypto` (ECDH P-256 + HKDF + AES-128-GCM + ES256) — không thêm gói, ~200 dòng, phải có test vector.
     Em khuyên dùng `web-push` để giảm rủi ro mã hoá sai.
6. **Giao diện**: nút "Bật nhắc trên điện thoại" ở Hôm nay (chỉ khi đã đăng nhập), hướng dẫn riêng cho iPhone; trang Tài khoản
   có "Tắt nhắc" (xoá subscription). Không tự hỏi quyền khi vừa mở trang — chỉ khi người dùng bấm.

**Không làm**: gửi quảng cáo/khuyến mãi qua push; push ẩn danh không gắn tài khoản (không xoá được); hơn 1 thông báo/ngày.

**Thay thế rẻ hơn nếu chưa muốn Web Push**: email nhắc (SMTP/Resend, cũng cần dependency hoặc REST), hoặc chỉ `.ics` như hiện tại.

## 2b. GĐ1 — đã làm (chủ dự án duyệt 2026-10-21)

| Việc | Ở đâu |
|---|---|
| Mã hoá RFC 8291 (aes128gcm) + JWT VAPID ES256 bằng `node:crypto` — **không thêm dependency**: gói `web-push` thực tế là **MPL-2.0** (không phải MIT) và kéo 5 gói con. Khớp từng byte test vector RFC 8291 phụ lục A; đã đối chiếu `web-push` 3.6.7 / `http_ece` làm oracle ngoài repo | `web/lib/web-push.ts`, test `web/e2e/web-push.spec.ts` |
| Service worker chỉ cho push (không chặn fetch, không cache); chỉ đăng ký khi người dùng bấm "Bật nhắc" | `web/public/sw.js`, `web/lib/web-push-trinh-duyet.ts` |
| Bảng `push_dang_ky` **migration 0019**: bắt buộc đăng nhập, RLS chủ sở hữu (xem/xoá), ghi qua `dang_ky_push()`; endpoint chỉ nhận máy chủ push của Google/Mozilla/Apple/Microsoft (CHECK trong DB + kiểm lại khi gửi); ≤ 5 thiết bị/người; 404/410 hoặc lỗi 5 lần liền → xoá | `supabase/migrations/0019_push_dang_ky.sql`, test `supabase/kiem_thu/thu_push_0019.sql` |
| Cron 8:03 sáng giờ VN `/api/cron/nhac-day` (Bearer `CRON_SECRET`): `push_hang_doi(ngày)` → gửi → `push_ket_qua()`; ≤ 1 thông báo/người/ngày (chạy lại không trùng); nội dung = nhãn mốc + đường dẫn trong site | `web/app/api/cron/nhac-day/route.ts`, `web/vercel.json` |
| Khoá công khai `GET /api/push/khoa` (chưa đặt env → 404, nút tự ẩn) | `web/app/api/push/khoa/route.ts` |
| Nút "Bật nhắc trên điện thoại" dưới "Mốc bạn đã đánh dấu" (Hôm nay) và trong Tài khoản; chưa đăng nhập → mời đăng nhập; iPhone chưa cài → hướng dẫn 2 bước; bị chặn → chỉ cách mở lại. Bật = chép mốc sắp tới lên tài khoản; sau đó "Nhắc tôi" tự lưu lên tài khoản. Đăng xuất / xoá tài khoản → huỷ đăng ký thiết bị | `web/components/khung/BatNhacPush.tsx` |
| Sửa kèm: mã nhắc có dấu ("kd.ungky.tý") bị từ chối → bỏ dấu (`maKhongDau`) | `web/lib/nhac-viec.ts` |

Đo: `chart_interacted{kind=push_bat|push_tat|push_mo}` (`push_mo` = mở trang từ thông báo, link mang `?tu=push`).
Env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (tạo bằng `node web/scripts/tao-khoa-vapid.mjs`).

## 3. Thứ tự đề xuất
GĐ0 (xong) → đo 2–4 tuần → nếu ≥ 10% người có hồ sơ bấm "Nhắc tôi" → GĐ1 Web Push (anh duyệt `web-push` + migration 0019 + VAPID env).
