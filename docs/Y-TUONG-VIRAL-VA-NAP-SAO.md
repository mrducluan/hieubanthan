# Ý tưởng tăng trưởng lan truyền + nạp Sao (KC-5, 2026-10-21)

Khung: vòng **Thu hút → "à, đúng mình" → Quay lại → Mời bạn → Nạp Sao** (`docs/MUC-TIEU-TANG-TRUONG.md`). Ranh giới giữ
nguyên: không doạ, không đếm ngược giả, không đa cấp, Sao không đổi ra tiền. Mỗi ý tưởng ghi khâu, cách đo, cần gì.

## A. Đã làm trong đợt này (CTA cuối bài)
- Khối `CtaCuoiBai` sau góp ý ở mọi mảng: (1) **gợi mở chéo** theo từ điển ý định chung (KC-3) — "cùng chuyện này, Tử vi/Thần
  số/Phong thuỷ nói gì"; (2) **Đọc trọn luận giải** (miễn phí khi chưa thu; "chương đầu miễn phí · trọn bộ N Sao" khi bật thu);
  (3) **Rủ một người xem cùng** → `/hop-doi`; (4) **Nạp Sao** khi đang thu, **Ủng hộ** khi chưa thu. Đo `chart_interacted{kind=cta_*}`
  và `goi_mo:<mảng>` → biết CTA nào kéo được.
- **Nhắc việc** (KC-4) + **Tháng này nhà bạn** (KC-2) = hai lý do quay lại mới theo nhịp ngày/tháng.

## B. Lan truyền (khâu MỜI) — xếp theo tỉ lệ hiệu quả/công
1. ★ **Thẻ "Nhà mình tháng này"** (ảnh OG như thẻ ngày `/og/ngay`): hướng cửa + mức tháng + một câu việc nên làm. Người xem bấm
   vào → đo hướng nhà mình → có hồ sơ nhà. Cần: route OG + mã HMAC (như `kyMaNgay`), 1 ngày. Đo `share_created{kind=nha_thang}`.
2. ★ **"Hỏi hộ một người"**: sau câu trả lời Kinh Dịch/Tử vi, nút "Gửi câu hỏi này cho người ấy tự gieo" → link mang `chu_de`
   (không mang quẻ, không ngày sinh). Người nhận gieo quẻ của riêng họ → hai người so hai quẻ cùng chủ đề. Đo `referral_signup`.
3. **Hợp đôi theo quan hệ ở ngữ cảnh**: trong bài "Nhà của bạn" có người cùng ở → nút "Mời [vợ/chồng] xem phòng của họ" tạo link
   hợp đôi điền sẵn `quan_he=gia_dinh`. Cần: 0,5 ngày.
4. **Thẻ dịp**: sinh nhật (năm cá nhân mới), Tết (tuổi xông đất), Lập xuân (hướng xấu năm) — 3 mẫu OG + nhắc đúng dịp qua
   nhắc việc (tự thêm mốc khi người dùng đồng ý). Đo theo mùa.
5. **Thử thách 7 ngày Hôm nay** với bạn: hai người cùng chuỗi ngày ghé; bảng nhỏ chỉ hai người, không xếp hạng công khai.
   Cần tài khoản + bảng chuỗi (đã có ý trong hàng đợi).
6. **Trang kiến thức có "câu hỏi của bạn"**: cuối mỗi trang sao×cung / quẻ: "Lá số của bạn có sao này không?" → mở công cụ với
   hồ sơ → đo `landing_viewed → reading_started` cho khách từ Google (khâu THU HÚT → TRẢI NGHIỆM).

## C. Nạp Sao (khâu NẠP) — nguyên tắc: Sao mua thứ có chi phí biên thật hoặc giá trị tích luỹ
1. ★ **Bật thu Sao theo mảng, không bật đồng loạt**: bật trước ở **Bản đồ con số** (đã có bản xem trước tự tải, tò mò cao) và
   **Luận giải Tử vi đời sống** (12 chương, giá trị cảm nhận lớn). Giữ Kinh Dịch/Phong thuỷ miễn phí để làm cửa vào. Cần: công tắc
   `luan_giai.thu_sao` tách theo mô-đun trong `/quan-tri/cai-dat` (hiện là một công tắc chung) — 0,5 ngày.
2. ★ **Gói "Năm của tôi" (PDF/ảnh dài)**: thần số 12 tháng + Tử vi năm nay & 3 tháng tới + tháng sửa nhà, một tệp in được, 30 Sao.
   Chi phí biên = dựng PDF; giá trị = giữ lại, chia sẻ. Cần: engine đã có dữ liệu; web dựng bằng in trang (window.print CSS) trước,
   PDF server sau.
3. **Hỏi sâu bằng Sao** (đã có SAO-2): vượt 3/10 câu → 1 Sao/câu. Thêm **"gói 20 câu"** giá tốt hơn mua lẻ để người hay hỏi đỡ bị
   hỏi đồng ý từng câu (một lần đồng ý).
4. **Sao chào mừng gắn hành động**: tặng 10 Sao khi lưu hồ sơ (đã có) + **5 Sao khi lưu hồ sơ nhà** + 5 Sao khi đặt mốc nhắc đầu tiên
   (SAO-3 nhiệm vụ, thêm 2 nhiệm vụ, công tắc tắt mặc định).
5. **Thưởng mời gắn lần nạp đầu** (hàng đợi): người được mời nạp lần đầu → người mời +20% Sao của gói (một tầng, trần/tháng).
6. **Giá theo tâm lý**: gói 29k/99k/199k đã có; thêm nhãn "đủ 1 báo cáo" / "đủ 3 tháng hỏi" trên thẻ giá (chữ, không đếm ngược).
7. **Không làm**: khoá câu trả lời khủng hoảng, mờ nội dung bằng CSS, "ưu đãi hết hạn sau 10:00", gói theo nỗi sợ ("hoá giải").

## D. Thứ tự em đề xuất (4 tuần)
Tuần 1: bật thu Sao ở Bản đồ con số + Tử vi đời sống (công tắc theo mảng) · thẻ "Nhà mình tháng này" · đo CTA.
Tuần 2: "Hỏi hộ một người" · 2 nhiệm vụ Sao mới · nhãn gói giá.
Tuần 3–4: gói "Năm của tôi" (in trang) · thẻ dịp Lập xuân/Tết · quyết định Web Push theo số nhắc việc.
