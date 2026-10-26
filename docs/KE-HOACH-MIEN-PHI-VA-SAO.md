# Khi nào miễn phí, khi nào cần Sao — quy trình và quy tắc (SAO-2, 2026-10-12)
> **Cập nhật 26/10/2026 (chủ dự án chốt):** giá Luận giải toàn bộ **29 Sao** (không còn 10), câu hỏi vượt lượt **3 Sao**; Sao chào mừng 10 giữ nguyên → không còn tự mở báo cáo đầu — thay bằng gói Khởi đầu 19 Sao / 19.000 ₫ (cùng chào mừng vừa đủ) hoặc nhận lời mời (10 + 20 = 30). Các con số "10 Sao" bên dưới là kế hoạch gốc.

> **Khâu:** 4 · Nạp Sao, nhưng không được làm hỏng khâu 1–3 (thu hút, quay lại, mời bạn).
> **Đo bằng:** phễu PostHog ở /quan-tri/tang-truong: `paywall_viewed` → `unlock_clicked` → `checkout_started` →
> `payment_succeeded` → `unlock_succeeded`, cùng `quota_reached`. Doanh thu, người nạp, gói, mời bạn có nạp không:
> /quan-tri/doanh-thu. Ngưỡng an toàn: chi phí AI / doanh thu < 20 %, tỷ lệ quay lại ngày 7 **không giảm** sau khi bật.

## 1. Quy tắc (đã cài, mọi công tắc ở /quan-tri/cai-dat — mặc định TẮT)

| Tính năng | Khách (chưa đăng nhập) | Có tài khoản | Khi vượt | Công tắc / số |
|---|---|---|---|---|
| Mọi phép tính, lá số, quẻ, hướng nhà, Hôm nay, hợp đôi, kiến thức, blog | ✅ miễn phí | ✅ | — | — |
| Hỏi đáp AI (5 mảng, tính chung) | 3 câu/ngày | 10 câu/ngày | khách → mời đăng nhập · có tài khoản → **1 Sao/câu**, hỏi đồng ý từng câu (hoặc "không hỏi lại trong phiên") | `sao.hoi.thu`, `sao.hoi.mien_phi_khach`, `sao.hoi.mien_phi_tk`, `sao.hoi.gia` |
| Luận giải toàn bộ Tử vi / Bát tự | chương 1 trọn + các chương sau hiện tiêu đề, **điểm nhấn đã tính**, **câu hỏi mở**, số phút đọc | như khách | **10 Sao** mở toàn bộ, xem lại cả ngày không trừ lần hai | `luan_giai.thu_sao`, `luan_giai.gia_sao`, `luan_giai.chuong_mien_phi` |
| Sao tặng | — | +10 khi lưu hồ sơ (đủ mở 1 báo cáo) · +20 mỗi bạn mời (hai phía, một tầng) | — | `sao.thuong.*` |

Không đếm được (chưa có `SUPABASE_SERVICE_ROLE_KEY` / `SAO_KHOA_SECRET` — lùi về `LOI_MOI_SECRET` nếu có) → **mở**: thà cho dùng miễn phí còn hơn chặn
nhầm. Engine lỗi → không trừ Sao. Trừ Sao luôn ở máy chủ, sau khi đã có câu trả lời / báo cáo.

## 2. Luồng người dùng (workflow)

```
Vào trang công cụ ─► tính lá số (miễn phí) ─► "Đọc miễn phí chương đầu"
   └► đọc chương 1 trọn vẹn ─► thấy "Đã đọc 1/8 chương" + 7 thẻ chương khoá
        mỗi thẻ: dữ kiện riêng của lá số (vd "Thiên Đồng ở cung Phu Thê (Đắc)") + câu hỏi mở về chính họ
        thanh dính đáy: "10 Sao mở 7 chương còn lại · xem lại cả ngày" + gợi ý theo tình trạng ví
   └► bấm "Mở toàn bộ · 10 Sao"
        ├ chưa đăng nhập → hộp: "Lưu hồ sơ: tặng 10 Sao — đủ mở báo cáo này" → đăng nhập (mã OTP) → quay về, TỰ MỞ
        │                  → ví 0 → hộp mời "Lưu hồ sơ · nhận 10 Sao" (người dùng BẤM, không tự lưu) → mở ngay
        ├ thiếu Sao      → hộp nạp nhanh: gói nhỏ nhất đủ dùng chọn sẵn → QR ngân hàng → tiền về →
        │                  /nap-sao/ket-qua tự đưa về đúng trang (2,5 giây) → TỰ MỞ báo cáo
        └ đủ Sao         → trừ 10 Sao (máy chủ) → báo cáo đầy đủ

Hỏi đáp: câu 1…N miễn phí (dưới câu trả lời báo "Còn 2 câu miễn phí hôm nay" khi gần hết)
   └► hết lượt: khách → hộp mời đăng nhập · có tài khoản → hộp "Câu này dùng 1 Sao · ví còn X" [Dùng 1 Sao] [Để mai]
```

## 3. Tâm lý học hành vi — dùng gì, cấm gì

**Dùng (đều trung thực, kiểm được):**
- *Khoảng trống tò mò* (curiosity gap): chương khoá cho thấy **dữ kiện thật của chính họ** + một câu hỏi mở đúng
  điều người ta hay băn khoăn (tình cảm, công việc, tiền, gia đình, bình an). Câu hỏi ở `CAU_HOI_MO`
  (`engine/app/luangiai/toan_bo.py`), điểm nhấn cắt từ chính chương (test bảo đảm không thêm dữ kiện).
- *Hiệu ứng tiến độ / Zeigarnik*: "Đã đọc 1/8 chương" + thanh tiến độ — việc dở dang thôi thúc làm tiếp.
- *Cá nhân hoá*: "Còn 7 chương viết riêng cho lá số của bạn", số phút đọc thật.
- *Tặng trước* (reciprocity): 10 Sao chào mừng đủ mở một báo cáo — lần trả tiền đầu tiên không phải tiền.
- *Neo giá và giảm ma sát*: giá ghi rõ trước khi bấm, "xem lại cả ngày không mất thêm", nạp ngay trong hộp, quay về
  đúng chỗ, tự mở — không bắt tìm lại.
- *Lối thay thế ngang hàng*: hết Sao luôn có "mời bạn bè nhận Sao" bên cạnh "nạp".

**Cấm** (CLAUDE.md: "không dọa, không phán hung để giữ chân"):
- Không doạ hạn / tai hoạ / "năm xấu" để bán (test `_CAM_DOA` chặn từ doạ trong lời mời).
- Không đếm ngược giả, không "chỉ còn 2 suất", không tích sẵn đồng ý trừ Sao.
- Không làm mờ dữ kiện tính toán (lá số, quẻ luôn hiện đủ); phần khoá **không gửi xuống trình duyệt** (không lộ qua
  tab Network) — không có chuyện "trả tiền để bỏ lớp mờ".
- Không thu Sao cho câu hỏi khủng hoảng (bộ lọc an toàn trả lời trước, không đi qua lời mời).

## 4. Lộ trình bật (mỗi bước đo 2 tuần)

| Bước | Việc | Ai | Điều kiện |
|---|---|---|---|
| S0 | Bật tài khoản (VIEC-CUA-ANH mục F) + chạy 0012, 0013 + payOS + `SUPABASE_SERVICE_ROLE_KEY`, `SAO_KHOA_SECRET` | Anh | — |
| S1 | Bật `luan_giai.thu_sao` (chương 1 miễn phí, 10 Sao) | Anh bấm ở /quan-tri/cai-dat | ≥ 200 lượt xem luận giải/tuần; quyết định 2026-10-01: sau 2 tháng thử nghiệm |
| S2 | Bật `sao.hoi.thu` (3/10 câu/ngày, 1 Sao/câu vượt) | Anh | Chi phí AI > 500k/tháng hoặc S1 có người trả |
| S3 | Hợp đôi chi tiết 5 Sao, luận giải năm 10 Sao, báo cáo bố cục nhà 10 Sao | Em | S1 tỷ lệ trả ≥ 2 % |
| S4 | Sao tặng hằng tháng theo ngày ghé (khâu quay lại) | Em | S2 ổn |

Một Sao mua ≈ 830–970đ. Chi phí AI một báo cáo ≈ 1–3 nghìn đồng (bản xem trước chỉ diễn đạt AI chương miễn phí
— `dien_dat_toi_da`) → biên > 60 % sau phí cổng.

## 5. Quản trị

- **/quan-tri/doanh-thu** (chỉ chủ sở hữu, MFA, ghi nhật ký mỗi lần xem): doanh thu 7/30/90 ngày, người nạp, người nạp
  lần đầu, tỷ lệ tạo đơn → trả, theo ngày, theo gói, **danh sách người nạp nhiều nhất** (email, tổng, số lần, số dư),
  **người mời nhiều nhất + bạn được mời có nạp không**, Sao bán / tặng / tiêu và tiêu vào đâu, 30 đơn gần nhất.
- **/quan-tri/tang-truong**: phễu PostHog có thêm các bước xem khoá → mở khoá → nạp.
- **/quan-tri/nguoi-dung**: tra ví theo email, điều chỉnh Sao có lý do (đã có).
- **/quan-tri/cai-dat**: mọi số và công tắc ở mục 1.

## 6. Trạng thái và kiểm thử chuỗi thật (2026-10-13)

**Code: xong, mặc định TẮT.** Bật = anh làm bước S0 rồi bấm công tắc ở /quan-tri/cai-dat (mục 4).

Chuỗi thật chạy trên "Supabase thu nhỏ" (GoTrue + PostgREST + Postgres với migration thật của dự án, thư OTP thật qua
SMTP hứng, cổng nạp giả) — `web/e2e-that/`, job CI **`sao-that`** chạy mỗi PR. Không giả lập route nào của web:

| Bước | Kiểm |
|---|---|
| Khách đọc chương 1 | chương khoá **không có đoạn văn** trong phản hồi mạng, chỉ tiêu đề + điểm nhấn + câu hỏi mở |
| Mở khoá khi chưa đăng nhập | hộp mời đăng nhập → sang /dang-nhap hộp tự đóng → OTP → quay về /tu-vi |
| Tự mở sau đăng nhập | ví 0 → hộp mời lưu hồ sơ nhận 10 Sao; **chưa bấm thì chưa lưu** hồ sơ; bấm → +10, −10, báo cáo đầy đủ |
| Xem lại trong ngày | đầy đủ ngay, sổ Sao vẫn 1 lần trừ |
| Thiếu Sao (Bát tự) | hộp nạp nhanh (có lối "mời bạn bè") → cổng giả trả → /nap-sao/ket-qua → tự về /bat-tu → tự mở, ví 30 − 10 |
| Hỏi đáp có tài khoản | 2 câu miễn phí (CI đặt 2) → câu 3 hỏi đồng ý → trừ đúng 1 Sao sau khi trả lời |
| Câu khủng hoảng khi hết lượt | trả lời, không hỏi Sao, không trừ |
| Khách hết lượt hỏi | mời đăng nhập; bấm "để sau" ở báo cáo → tải lại không tự bật hộp |

**Lỗi tìm ra khi chạy thật, đã sửa:** (1) hộp thoại vẫn đè lên trang đăng nhập sau khi bấm "Đăng nhập để xem tiếp"
(không đăng nhập được); (2) người mới đăng nhập quay về không nhận được 10 Sao đã hứa (quà chỉ trao ở /tai-khoan) →
hộp nạp có bước "Lưu hồ sơ · nhận 10 Sao"; (3) báo cáo chờ mở ở sessionStorage → mất khi mở link thư ở tab mới, và
"để sau" vẫn tự bật lại → localStorage gắn route + người (dữ liệu sinh, không theo trường phái), hạn 30 phút, "để sau" xoá; (4) thiếu bí mật ký khoá vẫn
khoá báo cáo rồi báo 503 → nay mở miễn phí (fail-open như quy tắc); (5) khoá "đã mở hôm nay" có gồm giá → đổi giá giữa
ngày bị trừ lần hai → bỏ giá khỏi khoá; (6) sự kiện đếm trùng (`paywall_viewed` hai lần, `unlock_succeeded` khi xem
lại miễn phí, `payment_succeeded` mỗi lần tải lại trang kết quả).

**Chấp nhận, ghi lại:** lượt hỏi miễn phí bị tính cả khi engine lỗi / câu khủng hoảng còn trong lượt (không mất Sao,
chỉ mất một lượt miễn phí trong ngày) — sửa cần thêm hàm SQL trả lượt, để khi có số liệu thật.
