# Cửa Sao v2 — "Ba lối mở" (2026-10-27)

Chủ dự án hỏi: khi người dùng chạm cửa Sao (mở Luận giải toàn bộ, hỏi đáp vượt lượt), hộp hướng dẫn nạp Sao / thẻ chia
sẻ để nhận Sao có đủ hấp dẫn, có khiến người dùng hành động (nạp, hội viên, mời bạn) chưa. Khâu: **MỜI + NẠP**.

## 1. Hiện trạng (ảnh chụp chuỗi thật, điện thoại 390 px)

| Điểm chạm | Thấy gì | Vấn đề |
|---|---|---|
| Thanh dính cuối báo cáo | "29 Sao mở 12 chương còn lại · xem lại cả ngày không mất thêm" + "Đăng nhập và lưu hồ sơ: tặng 10 Sao — còn thiếu 19 Sao, nạp nhanh bằng QR." | Giá đứng trước giá trị; hai dòng chữ dày; không nhắc lối miễn phí (mời bạn) dù 10 + 20 Sao **đủ** mở báo cáo |
| Hộp đăng nhập (báo cáo) | "Lưu hồ sơ vào tài khoản: tặng 10 Sao ." · "Mời bạn bè: … cả hai cùng nhận Sao." | Lỗi khoảng trắng trước dấu chấm; không nói 10 Sao chưa đủ 29; lời mời **không có con số** |
| Hộp hết lượt hỏi (khách) | Như trên + "Có tài khoản: thêm câu hỏi miễn phí mỗi ngày" · nút "Đăng nhập để xem tiếp" | Không nói thêm bao nhiêu câu, 10 Sao = mấy câu; nút sai ngữ cảnh (đang hỏi, không phải xem) |
| Hộp nạp (đã đăng nhập, ví thiếu) | Khối quà + 4 gói xếp dọc + nút QR + (dưới đáy) dòng hội viên + chữ "mời bạn bè" dẫn sang /tai-khoan | Dài hơn 1 màn hình; lối mời bạn và hội viên khuất dưới đáy; mời bạn = rời trang, không có nút gửi |
| Sau nhận quà | "Ví còn thiếu 19 Sao — nạp thêm bên dưới hoặc mời bạn bè." | "mời bạn bè" không bấm được |

## 2. Ba phương án

**A — Viết lại lời tại chỗ.** Giữ bố cục, sửa câu, thêm con số (mời 1 bạn = 20 Sao), sửa lỗi khoảng trắng.
Rẻ, ít rủi ro; nhưng lối mời bạn vẫn là dòng chữ dẫn sang trang khác, hộp nạp vẫn dài, hội viên vẫn khuất.

**B — "Ba lối mở".** Thanh dính nói giá trị trước ("Đọc tiếp 11 chương"). Hộp thoại có thanh ví (có / cần) và ba
thẻ ngang hàng: **Đọc ngay** (một gói vừa đủ, nút QR; các gói khác gập), **Miễn phí — mời bạn** (con số thật lấy từ
cài đặt: "mời 1 bạn là đủ mở báo cáo này", nút gửi lời mời ngay trong hộp — link mời xem hợp đôi gắn mã mời),
**Hội viên năm** (khi công tắc bật). Khách: một bước "Đăng nhập 30 giây · nhận 10 Sao" kèm phép cộng lối miễn phí.

**C — "Chia sẻ để mở khoá ngay".** Bấm chia sẻ là mở thêm một chương tức thì.

## 3. Đánh giá khắt khe (1–5, cao = tốt)

| Tiêu chí | A | B | C |
|---|---|---|---|
| Người dùng hiểu ngay mình có những lựa chọn gì | 2 | **5** | 3 |
| Kích hành động nạp (đường ngắn nhất tới QR) | 3 | **5** | 2 (dạy người dùng "không cần trả") |
| Kích lan truyền có thật (bạn bè thật vào) | 2 | **4** | 3 (lượt bấm nhiều nhưng không kiểm được, dễ gửi bừa) |
| Trung thực / không mẹo tối (CLAUDE.md: không doạ, không khan hiếm giả) | 4 | **5** | 2 (thưởng cho cú bấm không kiểm chứng; "mở khoá" gây áp lực) |
| Đúng luật Sao (thưởng mời một tầng, kiểm trong SQL) | 5 | **5** | 1 (cần cơ chế thưởng mới, bỏ qua điều kiện "bạn lưu hồ sơ") |
| UI đẹp, gọn trên điện thoại | 2 | **4** | 4 |
| Rủi ro kỹ thuật / migration | **5** (không) | 4 (không migration) | 1 (cần migration + chống gian lận) |
| **Tổng** | 23 | **32** | 16 |

**Chọn B**, lấy thêm từ A (sửa câu, con số) và từ C ý "xem trước được thứ mình gửi" (lời nhắn có sẵn, gửi một chạm),
nhưng thưởng vẫn **chỉ khi bạn bè thật lưu hồ sơ** (hàm SQL quyết, như cũ).

## 4. Quy tắc giữ nguyên

- Không đếm ngược, không "chỉ còn hôm nay", không gạch giá giả, không tích sẵn đồng ý; luôn có lối "Để sau".
- Mọi con số (giá, quà chào mừng, thưởng mời, trần 30 ngày, giá hội viên) đọc từ cài đặt — câu chữ là hàm thuần
  `web/lib/loi-sao.ts` (e2e gọi thẳng).
- Sao không đổi ra tiền; thưởng mời một tầng; lời mời nói rõ điều kiện ("bạn ấy đăng nhập và lưu hồ sơ").
- Đo: `sao_prompt_answered{kind, ket_qua: moi_ban | nap | hoi_vien | dong_y | de_sau, nguon}` + `share_created{kind: invite, nguon: hop_sao, co_ma}`.
