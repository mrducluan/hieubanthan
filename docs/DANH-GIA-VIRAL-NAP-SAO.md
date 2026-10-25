# Đánh giá khắt khe: ý tưởng viral + nạp Sao (2026-10-25)

> Đối chiếu: `docs/Y-TUONG-VIRAL-VA-NAP-SAO.md`, `docs/MUC-TIEU-TANG-TRUONG.md`, `docs/KE-HOACH-MIEN-PHI-VA-SAO.md`.
> Mục đích cuối: người dùng **chia sẻ** và **nạp Sao**. Mọi số liệu dưới đây đã kiểm trong code (file:dòng), trừ mục nào ghi "chưa kiểm".

## 1. Kết luận ngắn

1. **Chưa có dòng tiền nào từ Sao, và chưa có vòng thưởng viral chạy được.** Đây là nút thắt, không phải thiếu ý tưởng.
   - Công tắc thu Sao mặc định **tắt** (`web/lib/cau-hinh.ts:34`, `macDinh: false`).
   - Nạp Sao cần migration 0012–0014 + khoá payOS + bật tài khoản (`docs/MUC-TIEU-TANG-TRUONG.md`, dòng "Nạp Sao").
2. **Kênh viral chưa thưởng được cho khách.** Thẻ chia sẻ đã gắn `?gt=<mã của người chia sẻ>` khi người chia sẻ **đã đăng nhập** (`NutChiaSe.tsx:45`, `NutTheBanDo.tsx:55`, `NutChiaSeHai.tsx:34`, qua `useMaCuaToi` trong `web/lib/sao.ts:55-63`). Vì vậy kênh này đã nối được thưởng với người có tài khoản. (Bản trước của tài liệu ghi nhầm là thẻ không mang `gt`.) Lỗ hổng thật: **khách không có mã nên link không có `gt`** — mà tài khoản chưa bật (CLAUDE.md 2026-10-08) nên phần lớn người chia sẻ hiện là khách. Vòng Sao hiện gần như bằng 0; `referral_signup` (đo qua `?tu=`) vẫn ghi nhận người vào, nên dashboard có thể báo "có lượt đăng ký qua lời mời" mà không ai nhận Sao.
3. **Chuỗi điều kiện thưởng quá dài.** Để người mời nhận Sao, người được mời phải: (a) tạo tài khoản trong 7 ngày (`supabase/migrations/0008_sao_credit.sql`, `tai_khoan_cu`), (b) lưu hồ sơ (`chua_luu_ho_so`), (c) mã phải là `gt=` đúng. Mỗi bước rơi người. Người mời có trần 20 lượt/30 ngày.
4. **Đường đi từ chia sẻ đến nạp Sao có ít nhất 7 bước** (xem §3). Ý tưởng mới đang thêm bước, chưa bớt bước.

## 2. Điểm mạnh cần giữ

- Thẻ "Đoán số" (Bản đồ 5 mảng) có cơ chế chơi, người nhận không cần hồ sơ để tham gia. Đây là mẫu viral tốt nhất hiện có.
- Chương 1 miễn phí + khoá "chỉ gửi tiêu đề + điểm nhấn" (`docs/KE-HOACH-MIEN-PHI-VA-SAO.md` §3): không lộ đoạn khoá, không có mờ CSS. Đúng ranh giới đạo đức.
- Không có đếm ngược, không doạ hạn. Giữ nguyên.
- Đo được: `share_created`, `referral_signup`, K = lời mời thành công / tài khoản mới (`docs/MUC-TIEU-TANG-TRUONG.md`).

## 3. Phễu thực tế: từ chia sẻ đến nạp Sao

| # | Bước | Rớt ở đâu | Đo bằng |
|---|---|---|---|
| 1 | Người A bấm chia sẻ thẻ | — | `share_created` |
| 2 | Người B mở link | Thẻ không đủ hấp dẫn; B không hiểu đây là gì | `landing_viewed` có `tu=` |
| 3 | B tự tính (cần ngày giờ sinh, nơi sinh) | Nhập liệu dài, nhiều người bỏ | `reading_started` |
| 4 | B đăng ký (OTP) | Ma sát đăng nhập | `referral_signup` |
| 5 | B lưu hồ sơ | Bước này mới nhận thưởng; không biết trước | `profile_created` |
| 6 | A nhận +20 | **Không đi qua thẻ** (xem §1.2) | `credit_earned` |
| 7 | Sao → nạp | Cần nạp tiền, cổng chưa bật | `checkout_started` |

**Gap 1 (thu hẹp):** với người đã đăng nhập, bước 6 đã có đường đi (`gt=`). Phần còn thiếu: khách chưa có mã nên link không mang `gt`, và link QR có thể vượt phiên bản 8 khi thêm `gt=` — **chưa kiểm** `web/lib/the-chia-se.ts` (`urlQr`) và `web/lib/og-chung.tsx`. Cách sửa không cần migration: cấp mã cho khách bằng cách sinh mã HMAC từ `?tu=` (hoặc chờ bật tài khoản); đây là quyết định của chủ dự án vì liên quan đến chống gian lận.

**Gap 2:** bước 2 không có lời hứa rõ. Người B thấy "điều này dành cho ai" nhưng không thấy "bạn nhận được 10 Sao khi lưu hồ sơ". Cần kiểm trang nhận lời mời có nói điều kiện không.

**Gap 3:** bước 5 là điểm rớt lớn nhất vì người mới không biết lưu hồ sơ là có thưởng. Đề xuất: nói rõ "lưu hồ sơ để nhận 10 Sao" ngay ở bước 3 (trước khi tính), không chỉ ở bước 5.

## 4. Đánh giá từng ý tưởng trong tài liệu

| Ý tưởng | Đánh giá | Yêu cầu trước khi làm |
|---|---|---|
| Thẻ "Nhà mình tháng này" | Viral vừa phải: nội dung gắn nhà, ít người muốn chia sẻ công khai. Tốt cho nhóm đang mua nhà. | Không đưa địa chỉ/hướng cụ thể lên thẻ công khai. Tên hiển thị + hướng là đủ. |
| "Hỏi hộ một người" (gieo quẻ) | Rủi ro: có thể thành trò đoán số phận người khác. | Chỉ gửi chủ đề, người nhận tự gieo; không kèm kết quả của người gửi. Cần ghi rõ trên trang. |
| Hợp đôi trong "Nhà của bạn" | Tốt nhưng hẹp (chỉ người cùng ở). | Không chấm điểm người kia; giữ quy tắc "không điểm hợp/khắc" ở hợp đôi thần số. |
| Thẻ dịp Tết / sinh nhật | Mùa vụ rõ, dễ viral dịp Tết. | Không đếm ngược "còn N ngày đến Tết" để thúc. Chỉ hiển thị mốc. |
| Thử thách 7 ngày với bạn | Mạnh về giữ chân, nhưng chuỗi ngày hiện chỉ đếm trên máy (HN-1). | **Cần bảng điểm danh ở máy chủ** (migration). Không bảng xếp hạng công khai. |
| Bật thu Sao theo mảng (Bản đồ con số trước) | Hợp lý: giá trị cảm nhận cao, chi phí AI thấp. | Chỉ bật sau khi có hạ tầng thanh toán. Đo: tỉ lệ `paywall_viewed → unlock_clicked`. |
| Gói "Năm của tôi" (in trang / PDF) | Giá trị giữ lại cao; chi phí biên thấp nếu in trang. | Bắt đầu bằng in trang (CSS print), PDF sau. Không dùng "chỉ còn" để thúc. |
| Gói 20 câu hỏi | Tốt cho người hỏi nhiều, giảm ma sát đồng ý từng câu. | Cần xác nhận cách trừ (trừ khi trả lời được) không đổi. |
| Sao chào mừng gắn hành động (lưu nhà, đặt mốc) | Tốt, nhưng mỗi thưởng mới là một điều kiện thêm, tăng độ phức tạp. | Gom thành một bảng nhiệm vụ (SAO-3 đã có khung). |
| Thưởng mời gắn lần nạp đầu | Đúng ý "một tầng", nhưng cần trần và không tạo tài khoản ảo. | Trần/tháng + chỉ khi tài khoản được mời có hồ sơ thật. Đã có trong hàng đợi. |
| Giá theo tâm lý (nhãn "đủ 1 báo cáo") | Rõ ràng, không thao túng. | Chữ thật, không "ưu đãi", không gạch giá giả. |
| Tặng bạn một chương | Viral tốt nhất trong danh sách Sao. | **Ràng buộc pháp lý**: quà là *nội dung*, không chuyển nhượng Sao; người nhận phải có hồ sơ của chính họ; trần 3 lần/tháng. |

## 5. Rủi ro chưa có trong tài liệu

- **Gian lận nhiều tài khoản:** thưởng chuỗi ngày và thưởng mời đều dễ bị lạm dụng. Cần: trần/tháng, liên kết với hồ sơ (đã có), và đo tỉ lệ tài khoản không lưu hồ sơ sau khi nhận thưởng.
- **Sao bị hiểu là tiền:** khi có nhiều cách kiếm Sao, người dùng dễ đòi đổi tiền. Giữ thông điệp: Sao là lượt dùng cho phần sâu, không đổi ra tiền (đã có trong `docs/MUC-TIEU-TANG-TRUONG.md`). Nên hiển thị ở trang nạp.
- **Lệ thuộc PostHog cho đo lường:** chặn quảng cáo (adblock) làm mất sự kiện. Đo doanh thu nên dựa vào bảng `don_nap` (máy chủ), không dựa vào PostHog.
- **Quá nhiều lời mời:** nhiều thẻ, nhiều CTA có thể gây mệt. Cần giới hạn số CTA mời trên mỗi trang (hiện có: CTA cuối bài, hộp Sao, thẻ chia sẻ, nhắc việc).

## 6. Đề xuất thứ tự (không cần migration trước)

1. **Nối thẻ chia sẻ với thưởng mời** (Gap 1): thêm `gt=` vào URL thẻ, kiểm QR. Đo: `referral_signup` có `kind` của thẻ gốc.
2. **Nói rõ điều kiện thưởng** ở trang nhận lời mời và trước bước tính (Gap 2, 3). Chỉ là chữ.
3. **Đo phễu theo từng loại thẻ** trong `/quan-tri/tang-truong`: từ `share_created{kind}` đến `credit_earned`. Chưa có bảng này; cần kiểm trước khi nói là đã có.
4. **Bật thu Sao theo mảng** (Bản đồ con số) khi hạ tầng thanh toán sẵn sàng.
5. Sau khi có số 2–4 tuần: quyết định thưởng chuỗi ngày và tặng chương (cần migration).

## 7. Quyết định của chủ dự án (2026-10-25) và việc đã làm

| Câu hỏi | Quyết định | Đã làm (migration 0025 + web) |
|---|---|---|
| Thứ tự bật thu Sao | Bản đồ con số trước | Công tắc riêng `luan_giai.thu_sao.{thanso,tuvi,battu}` |
| Migration chuỗi ngày + tặng chương | Duyệt cả hai | `diem_danh()` (chỉ lưu ngày ghé cuối + độ dài chuỗi), `qua_tang_chuong` |
| Nới thưởng mời | **Hướng A**: bỏ giới hạn 7 ngày, giữ "lưu hồ sơ" | + mỗi tài khoản được tính một lần trong đời, chặn mời vòng, tự nhận ngay sau khi lưu hồ sơ |
| Hoa hồng % lần nạp đầu | **Làm** — chủ dự án xác định là affiliate hợp pháp, tự chịu trách nhiệm pháp lý | Một tầng, trả bằng Sao tặng, N đơn đầu / M tháng / trần 30 ngày, thu hồi khi hoàn tiền; mặc định tắt |
| Sao mua có hết hạn? | **Không hết hạn** | Số dư theo lô: Sao tặng bị trừ trước, Sao mua sau cùng (sửa lỗi 8.1) |
| Thẻ "Điểm hai người" | (chưa trả lời — em làm bản an toàn) | Thẻ không mang tên người thứ hai; mã cũ có tên cũng không hiện |

Vẫn **không làm** (lý do ở 8.4): "Năm của tôi" / thẻ "hướng xấu năm" có nhãn hung trên thẻ công khai, "Thử thách 7 ngày với bạn" (chuỗi chung tạo áp lực).

## 8. Phần phản biện độc lập

Agent phản biện độc lập (chỉ đọc, không sửa file) đã trả kết quả. Những điểm dưới đây **đã đối chiếu code**; điểm chưa đối chiếu được ghi rõ.

### 8.1 Lỗi tiền — đã xác nhận (ưu tiên cao nhất)

`so_du_sao()` (`supabase/migrations/0008_sao_credit.sql:63-67`) cộng mọi khoản âm và chỉ khoản dương còn hạn, **không gán khoản tiêu vào khoản nào**. Ví dụ: mua 100 Sao (không hạn, 0012), tiêu 10 Sao từ "chào mừng" (hết hạn sau 365 ngày) → sau khi "chào mừng" hết hạn, số dư hiển thị 100 + 0 − 10 = **90**, trong khi 100 Sao đã mua vẫn còn nguyên. Sao đã trả tiền bị hiển thị thiếu. Chưa mở thu tiền nên chưa gây thiệt hại thật, nhưng **phải sửa trước khi bật `LUAN_GIAI_THU_SAO` hoặc nạp** (trừ theo thứ tự hết hạn: FIFO theo lô). Cần migration 0022 có rollback và test SQL trong `supabase/kiem_thu/`.

### 8.2 Điều kiện thưởng mời — đã xác nhận, cần quyết định

- Người được mời phải tạo tài khoản trong 7 ngày (0008:135), lưu hồ sơ vào tài khoản (0008:137) và mở `/tai-khoan` hoặc hộp Sao để nhận (`ViSao.tsx:43-60`). Người đăng ký sau 7 ngày không nhận gì và không ai được báo. `gt` lưu 30 ngày trong localStorage (`ma-gioi-thieu.ts:4`).
- `docs/DE-XUAT-KINH-TE-CONG-DONG.md` mục 4 ghi "hoàn tất bài đọc đầu tiên", lệch với code (lưu hồ sơ). Cần sửa tài liệu cho khớp, hoặc đổi code — quyết định của chủ dự án.
- Owner đã chọn "nới và thưởng cả hai phía". Việc nới cụ thể (bỏ 7 ngày? thay "lưu hồ sơ" bằng "tính một lá"?) vẫn cần chốt — thay đổi này là migration 0022 và có rủi ro gian lận cao hơn.

### 8.3 Gian lận — rủi ro thật, chưa có kiểm

Không thấy kiểm số điện thoại hay thiết bị trong 0008, 0011 và code web. Với trần 20 lượt/30 ngày, một người có thể gom khoảng 400 Sao/tháng từ nhiều tài khoản (10 chào mừng + 20 được mời + 20 người mời + 15 nhiệm vụ). Cần đo trước khi nới: số tài khoản mới cùng mã mời, cùng mẫu email, tỉ lệ không lưu hồ sơ sau khi nhận thưởng.

### 8.4 Pháp lý và đạo đức — cần luật sư / chủ dự án, không tự quyết

- **Thưởng % theo lần nạp đầu của người được mời** (hàng đợi "thưởng mời gắn lần nạp đầu"): giống hoa hồng theo doanh số người được tuyển. Tài liệu đã nói "một tầng", nhưng chưa có ý kiến luật sư (NĐ 40/2018). **Đề nghị tạm đóng băng.**
- **Thẻ "Điểm hai người"** đưa tên và điểm quan hệ của người thứ ba lên link công khai, chưa có đồng ý của họ (NĐ 13/2023). Đề nghị chỉ hiện tên người gửi, hoặc hỏi đồng ý trước khi tạo thẻ.
- **"Năm của tôi" (Tử vi năm nay, tháng sửa nhà)** và **thẻ dịp "hướng xấu năm"**: đi ngược "không doạ hạn / không phán hung / không tiên đoán năm" trong CLAUDE.md, và dễ thành nỗi sợ được bán. Nếu làm, chỉ dùng chữ trung tính, không có nhãn "Cần lưu ý" trên thẻ công khai.
- **"Thử thách 7 ngày với bạn"**: chuỗi chung tạo áp lực xã hội; trái với "không phạt khi mất chuỗi" (HN-1).
- **"Nhà mình tháng này"**: nếu ảnh chia sẻ có nhãn "Cần lưu ý" thì là phán hung trên ảnh công khai.
- **Thiếu test chặn chữ**: thêm test cụm cấm (xấu, hạn, tam tai, cần lưu ý) cho chữ trên thẻ công khai và ảnh OG.

### 8.5 Phễu thực tế — 8 bước (sửa §3)

Người chia sẻ: S1 đăng nhập (cổng cứng với khách), S2 bấm "Tạo link", S3 bấm chia sẻ. Người nhận: R1 mở link (lưu `gt`), R2 nhập hồ sơ (ngày, giờ, giới tính, nơi sinh), R3 đăng nhập OTP, R4 bấm "Lưu hồ sơ vào tài khoản", R5 tự nhận trong 7 ngày. Sao người mời đến sau R5.
Rớt nhiều nhất: **S1** (mất toàn bộ người không đăng nhập) và **R2→R4** (form dài + OTP + nút lưu thủ công). Chưa có số đo từng bước.

### 8.6 Việc làm trước (không cần migration)

1. **Đo lại phễu** bằng sự kiện có sẵn: `share_created` có/không `gt`; `credit_earned{kind=duoc_moi}` / `share_created`; `profile_created`. (~0,5 ngày). Quyết định có đáng mở S1 hay không.
2. **Ghi điều kiện ngay trên nút** chia sẻ và hộp Sao: "Cả hai nhận Sao khi bạn bè lưu hồ sơ trong 7 ngày, cần đăng nhập". Sửa mục 4 của DE-XUAT cho khớp code. (~0,5 ngày).
3. **Đóng băng trước khi có ý kiến luật sư**: thưởng % lần nạp đầu, thẻ "Điểm hai người" có tên người thứ ba, nhãn "Cần lưu ý" trên thẻ công khai. Kèm test cụm cấm. Tác động cao nhất vì giảm rủi ro pháp lý.
4. Sửa số dư (8.1) bằng migration 0022 — sau khi chủ dự án duyệt.

### 8.7 Câu hỏi cho chủ dự án

1. Khi nào bật Supabase Auth trên web? Chưa bật thì vòng Sao chưa chạy được.
2. Sao mua có hoàn tiền và có hết hạn không? 0008 (Sao tặng 365 ngày) và 0012 (Sao mua không hết hạn) đã đúng theo hai loại, nhưng `KE-HOACH-THANH-TOAN` cần khớp; quyết trước khi mở thu.
3. Đã có ý kiến luật sư về thưởng % lần nạp đầu và về thẻ "Điểm hai người" chưa? Nếu chưa, đề nghị tạm tắt hai mục này.

**Chưa kiểm chứng:** chi phí AI 1–3k/báo cáo và tỉ lệ rớt từng bước (lấy từ tài liệu). Cổng Supabase trên production chưa kiểm env.
