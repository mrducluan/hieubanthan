# Mục tiêu tăng trưởng — đối chiếu trước mỗi plan và mỗi task

> Chủ dự án giao 2026-10-10. CLAUDE.md có bản tóm tắt; đây là bản đầy đủ. Mọi plan/PR ghi một dòng
> **"Đẩy khâu: …, đo bằng: …"**. Nếu không đẩy khâu nào thì phải nói rõ vì sao vẫn cần làm (nền móng, bảo mật, pháp lý).

## Vòng tăng trưởng

```
 Thu hút ──▶ Trải nghiệm "à, đúng mình" ──▶ Quay lại mỗi ngày ──▶ Mời bạn bè ──▶ Nạp Sao
   ▲                                                                   │
   └──────────── bạn bè vào qua link mời / thẻ chia sẻ ◀───────────────┘
```

| Khâu | Người dùng làm gì | Chỉ số (PostHog / GSC / DB) | Đang có |
|---|---|---|---|
| 1. Thu hút | Tìm Google, AI trích, thấy thẻ chia sẻ | GSC lượt hiển thị/nhấp, `landing_viewed` | hơn 600 URL trong sitemap, llms.txt, thẻ OG |
| 2. Trải nghiệm | Lập lá số / thần số, đọc hết, hỏi | `reading_started` → `reading_completed`, `advisor_question_completed` | 5 mảng, hỏi đáp, lá số SVG |
| 3. Quay lại | Mở lại xem ngày/tháng/năm cá nhân, hỏi tiếp | Người quay lại 7 ngày (D7), số ngày hoạt động/tuần | Ngày/tháng/năm cá nhân, lưu nguyệt, hồ sơ lưu máy + tài khoản |
| 4. Mời | Hợp đôi, gửi link mời, chia sẻ thẻ | `share_clicked`, `referral_signup`, `compatibility_created`, **K = lời mời thành công / tài khoản mới** | Link mời HMAC, hợp đôi theo quan hệ, thưởng hai phía +20/+20 |
| 5. Nạp Sao | Dùng Sao cho luận giải sâu, mua thêm | `credit_earned`, Sao đã dùng, tỷ lệ trả tiền, ARPPU | Sổ cái Sao, giá 10 Sao/báo cáo (chưa thu), **chưa có cổng thanh toán** |

## Ranh giới (không đổi khi chưa có lý do mới — xem `DE-XUAT-KINH-TE-CONG-DONG.md`)

- "Token cộng đồng" = **Sao**: credit nội bộ, không đổi ra tiền, không chuyển nhượng, không phát hành crypto.
- Thưởng mời **một tầng**. Hoa hồng tiền mặt (đối tác) chỉ một tầng, có hợp đồng — giai đoạn sau.
- "Nghiện trang" = có **lý do mới để quay lại mỗi ngày** (nội dung theo ngày của chính họ, câu hỏi mới, bạn bè mới
  vào). Không dùng nỗi sợ: không phán hung, không "giải hạn", không đếm ngược giả, không khoá câu trả lời khủng hoảng.
- Phần cốt lõi đang miễn phí giữ miễn phí; Sao tiêu cho thứ có **chi phí biên thật** (AI sâu, báo cáo, ảnh).

## Hàng đợi ý tưởng (xếp theo khâu, ★ = em đề xuất làm sớm)

| Khâu | Ý tưởng | Cần gì |
|---|---|---|
| 3 ★ | **"Hôm nay của bạn"**: một thẻ mỗi ngày theo ngày cá nhân + lưu nhật Tử vi + quẻ ngày, có nút chia sẻ | Engine đã có số liệu; cần trang + thông báo |
| 3 ★ | **Chuỗi ngày ghé** (streak) + thưởng Sao nhỏ ngày thứ 7 — mất chuỗi không bị phạt | Bảng điểm danh (migration), trần Sao/tháng |
| 3 | Nhắc qua email / Web Push "thông điệp tuần" (người dùng tự bật) | SMTP / Web Push, trang huỷ đăng ký |
| 4 ★ | **Chiến dịch mời** chỉnh trong `/quan-tri/cai-dat`: đổi mức thưởng, dải thông báo toàn site | **Đã làm (QT-2)** |
| 4 ★ | "Xem hợp với ai": hợp đôi gửi link cho người kia tự nhập → cả hai thấy kết quả → hai tài khoản mới | Đã có hợp đôi + link mời; nối thành luồng |
| 4 | Thẻ chia sẻ theo dịp (Tết, sinh nhật, năm mới cá nhân) | Mẫu thẻ OG |
| 4 | Bảng xếp hạng người mời theo tháng (chỉ tên hiển thị, tự chọn hiện) | Không lộ dữ liệu sinh |
| 5 ★ | **Cổng nạp Sao** payOS/VietQR: gói 29k/99k/199k | Đăng ký kinh doanh, điều khoản hoàn tiền (VIEC-CUA-ANH mục E) |
| 5 | Nhiệm vụ kiếm Sao (lưu hồ sơ, hỏi 3 câu, mời 1 bạn) — dạy người dùng vòng lặp | Migration nhiệm vụ |
| 5 | Gói "Năm cá nhân" PDF (thần số + lưu niên Tử vi) | Engine đã có dữ liệu; cần dựng PDF |
| 1 | Trang kiến thức mới theo truy vấn GSC "nhiều hiển thị, ít nhấp" | **Đã làm (QT-4)**: `/quan-tri/tang-truong` liệt kê cơ hội |

## Công cụ đo trong `/quan-tri`

- `/quan-tri` — số tổng + **chuỗi tuần** (tài khoản mới, hồ sơ, lời mời, Sao, câu hỏi) + hệ số K (QT-2).
- `/quan-tri/tang-truong` — Search Console, GA4, phễu sự kiện PostHog (QT-4, cần khoá đọc).
- `/quan-tri/hoi-dap` — câu hỏi chưa trả lời tốt → biết phải viết thêm gì cho người dùng quay lại (QT-3).
