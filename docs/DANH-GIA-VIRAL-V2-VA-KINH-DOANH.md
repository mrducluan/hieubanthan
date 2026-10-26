# Đánh giá khắt khe V2 (viral: thẻ · URL · nạp Sao) + đề xuất kinh doanh mới (2026-10-26)

> Tiếp nối `docs/DANH-GIA-VIRAL-NAP-SAO.md` (2026-10-25, SAO-V đã merge #155). Mục đích cuối: user chia sẻ (viral) và
> nạp Sao. Số liệu ngành có nguồn + ngày trong §3; chỗ "cần luật sư" ghi rõ. Em KHÔNG tự sửa số hiệu luật trong chính
> sách công khai — chỉ đề xuất.

## 0. Kết luận một dòng

Vòng viral + nạp Sao về mặt **code đã đủ bộ phận**, nhưng đang **tắt toàn bộ** vì chưa bật tài khoản (Supabase Auth)
và **chưa có chống gian lận** — đây là hai nút thắt, không phải thiếu tính năng. Thẻ và URL đã tốt; chỗ nên cải thiện
là **cỡ gói nạp đầu** và **giảm bước** trong phễu.

## 1. Thẻ chia sẻ — đã tốt chỗ nào, còn hở chỗ nào

**Tốt (giữ):** mỗi loại thẻ có concept ảnh riêng + QR + hieuban.com; mã HMAC ký, không mang ngày sinh; `/the/*` noindex;
thẻ "Điểm hai người" đã bỏ tên người thứ hai (SAO-V). Trò "Đoán số" (Bản đồ 5 mảng) là mẫu viral mạnh nhất vì người
nhận chơi được ngay, không cần hồ sơ.

**Còn hở:**

1. **Khách chia sẻ không có `gt` → lời mời không thưởng ai.** Đã nêu ở V1 §1.2 (đính chính). Vì tài khoản chưa bật
   (CLAUDE.md 2026-10-08), **phần lớn người chia sẻ hiện là khách** → vòng Sao gần như bằng 0. Đây vẫn là hở lớn nhất,
   và nó **phụ thuộc việc bật tài khoản**, không sửa bằng code thêm được.
2. **Chưa đo được thẻ nào ra Sao.** Phễu theo loại thẻ đã thêm ở `/quan-tri/tang-truong` (SAO-V), nhưng cột "người gửi
   nhận Sao" luôn 0 vì `credit_earned{kind=moi_ban}` **chưa được ghi** ở web (chỉ `duoc_moi`, `chao_mung`, `nhiem_vu`,
   `chuoi`). → Việc nhỏ: ghi thêm sự kiện `credit_earned{kind=moi_ban}` cho người mời khi RPC trả `thuong_nguoi_moi`.
3. **Thẻ chưa nói "bạn nhận được gì".** Người nhận thấy nội dung nhưng không thấy "lưu hồ sơ để nhận N Sao chào mừng".
   SAO-V đã thêm dòng điều kiện ở nút chia sẻ (phía người gửi); còn **trang nhận** (`/the/*`, `/hop-doi/[ma]`) nên nói
   rõ phần thưởng của chính người nhận. Chỉ là chữ.

## 2. URL / silo — đánh giá

QH-URL (silo theo mảng) + SEO-K/L/M đã xong và rà 0 lỗi. Về **viral** (khác SEO), điểm cần nhìn:

- Trang nhận thẻ `/the/*` noindex là **đúng** (không để Google nuốt trang cá nhân hoá). Nhưng cần đo **tỉ lệ trang nhận
  → bấm CTA → nhập hồ sơ**; hiện chưa có khung đo riêng cho từng loại `/the/*`.
- Tham số `?tu=` theo tiền tố loại thẻ đã chuẩn. Đề xuất: thêm `?tu=` vào **mọi** nút chia sẻ còn thiếu (NutChiaSeNha,
  NutChiaSeQue — agent trước ghi là ngoài phạm vi SAO-V) để phễu đủ loại.
- Không có vấn đề URL nào chặn viral. Kết luận: **URL đã ổn**, việc còn lại là đo chuyển đổi của trang nhận.

## 3. Nạp Sao — "đã hoàn hảo chưa?" Chưa. Ba điểm sửa được.

**Đối chiếu chuẩn ngành (nguồn trong báo cáo nghiên cứu, 2025–2026):**

- Sao mua **không hết hạn** là đúng chuẩn (Suno: credit mua thêm không hết hạn; OpenAI tương tự). Sao tặng hạn 365 ngày
  cũng hợp lý.
- **Lai thuê bao + credit** đang là xu hướng; **gói năm giá thấp giữ chân tốt hơn hẳn** (RevenueCat 2025: gói năm giữ
  ~36% sau 1 năm, gói tháng giá cao chỉ 6,7%; ~41% thuê bao là gói năm).
- **Doanh thu lớn của app tâm linh đến từ người thật tư vấn** (Astrotalk FY2025 doanh thu ~₹1.176 crore, phần lớn là
  trả-theo-phút với chuyên gia), không từ máy. App chỉ-máy (Co-Star) nhỏ hơn hàng trăm lần.

**Ba điểm sửa (xếp theo tác động / công):**

1. **★ Gói nạp đầu vừa đúng 1 báo cáo.** Gói nhỏ nhất hiện 29k/30 Sao = gấp ~3 lần nhu cầu mở 1 Luận giải (10 Sao). Rào
   "phải nạp dư" làm rớt người ở đúng bước trả tiền. Thêm gói ~10–12k/10–12 Sao + **tặng thêm Sao cho lần nạp đầu** (lô
   Sao tặng). Chi phí: thấp (thêm dòng `goi_sao` + cài đặt). Đo: tỉ lệ từ màn khoá → trả tiền thành công.
2. **★ "Hội viên năm" trả trước bằng VND, không tự gia hạn** (QR payOS không trừ định kỳ được → cũng là lợi thế pháp
   lý): mở mọi chương Luận giải + X Sao/tháng (không cộng dồn, mẫu Suno) + Sao mua lẻ vẫn giữ. Khác "Nhịp của tôi"
   (15 Sao/tháng đang chờ duyệt) ở chỗ trả theo **năm, giá thấp**. Chi phí: vừa (migration bảng hội viên). Rủi ro: hợp
   đồng mẫu + hoàn tiền theo tỉ lệ thời gian; không gợi "năm hạn".
3. **Minh bạch giá EU-style:** luôn ghi VND cạnh Sao, không đếm ngược, không "chỉ còn N suất" (nguyên tắc EU 3/2025 về
   tiền ảo trong app; cũng tránh kiểu Temu mà EU đang nhắm).

## 4. Chống gian lận — điều kiện để BẬT SAO-V an toàn (nên làm trước khi bật hoa hồng)

SAO-V hiện chỉ chặn bằng email + trần. Nghiên cứu xác nhận giới hạn theo IP dễ lách; nhận dạng thiết bị + trùng phương
thức thanh toán bắt được phần lớn tự-mời-mình. Đề xuất (một migration riêng, chờ anh duyệt):

- Băm thiết bị có muối (FingerprintJS mã nguồn mở hoặc tự băm user-agent + vài tín hiệu; **là dữ liệu cá nhân → nêu
  trong chính sách**).
- Trần thưởng/hoa hồng **theo tuổi tài khoản người mời** (tài khoản mới mời ồ ạt = cờ).
- **Đồ thị mời**: phát hiện vòng khép kín (A↔B↔C) — một truy vấn SQL định kỳ, đánh dấu chờ người duyệt, không tự khoá.
- Hoa hồng: so **tài khoản ngân hàng người trả** giữa người mời và người được mời (nếu webhook payOS trả — **chưa kiểm,
  cần xác nhận**). Trùng tài khoản = cùng người.
- Đo: % thưởng bị chặn, % tài khoản được mời không lưu hồ sơ sau khi nhận thưởng.

## 5. Phễu thực tế (8 bước) và nơi rớt

Người chia sẻ S1 đăng nhập (cổng cứng với khách) · S2 tạo link · S3 chia sẻ. Người nhận R1 mở link (lưu `gt`) · R2 nhập
hồ sơ · R3 đăng nhập OTP · R4 lưu hồ sơ vào tài khoản · R5 tự nhận trong (nay bỏ 7 ngày). Rớt nhiều nhất: **S1** (mất
toàn bộ người không đăng nhập) và **R2→R4** (form + OTP + nút lưu thủ công). Giảm bước khả thi: cho khách chia sẻ có
`gt` tạm (sinh từ `?tu=` — cần chống gian lận trước), và gộp "lưu hồ sơ" vào ngay sau khi nhập để bớt một cú bấm.

## 6. Việc đề xuất, theo thứ tự

| # | Việc | Migration? | Khâu | Chờ ai |
|---|---|---|---|---|
| 1 | Bật tài khoản (Supabase Auth) trên web | không (env) | nền cho MỌI viral | **anh** (quyết định lớn) |
| 2 | Chống gian lận trước khi bật hoa hồng (§4) | có (bảng tín hiệu thiết bị) | MỜI | anh duyệt |
| 3 | Gói nạp đầu nhỏ + tặng Sao lần đầu (§3.1) | nhẹ (dòng `goi_sao`) | NẠP | anh duyệt giá |
| 4 | Ghi `credit_earned{moi_ban}` + đo trang nhận thẻ (§1.2, §2) | không | đo | em làm được |
| 5 | Trang nhận thẻ nói rõ phần thưởng người nhận (§1.3) | không | MỜI | em làm được |
| 6 | Hội viên năm VND (§3.2) | có (bảng hội viên) | NẠP + QUAY LẠI | anh duyệt |
| 7 | Ngày nghỉ chuỗi miễn phí (Duolingo +40% người giữ chuỗi 7 ngày) | nhẹ (sửa `diem_danh`) | QUAY LẠI | anh duyệt |

## 7. Đề xuất kinh doanh mới (token economy mới nhất) — xếp hạng, ★ làm trước

Chi tiết số liệu + nguồn: báo cáo nghiên cứu kèm theo (lưu trong phiên). Tóm tắt:

1. **★ Hội viên năm VND + Sao/tháng** (§3.2). Căn cứ: gói năm giữ chân vượt trội (RevenueCat).
2. **★ "Hỏi chuyên gia" trả lời văn bản, giá VND cố định** — bước nhỏ nhất của CG-1: người dùng trả 99–199k, chuyên gia
   trả lời trong 48h (quá hạn hoàn 100%), nền tảng giữ 25–30%. **Trả bằng VND, KHÔNG bằng Sao** (NĐ 52/2024: credit trả
   cho bên thứ ba sẽ giống tiền điện tử). Căn cứ: tiền app tâm linh đến từ người thật (Astrotalk). Rủi ro: mê tín dị
   đoan (BLHS Đ.320) → quy tắc hành nghề CG-1 + không phán hung; thuế TNCN chuyên gia.
3. **★ Thiết kế lần nạp đầu** (§3.1).
4. **Mua tặng báo cáo bằng VND (sinh nhật, Tết):** người mua trả tiền, người nhận **tự** nhập hồ sơ của mình (NĐ 356:
   không nhập ngày sinh người khác). Khác "Tặng một chương" (đó là thưởng, đây là đơn mua).
5. **Công cụ "đặt tên cho con"** (thần số Pitago + Chaldea + ngũ hành tên) — SEO "đặt tên con" mạnh + báo cáo so 3–5 tên
   (~20 Sao). CALC đã có Chaldea; cần KB. Rủi ro thấp nếu không phán "tên xấu".
6. **Báo cáo phong thuỷ mang thương hiệu cho môi giới / kiến trúc (B2B)** — khách tự nhập qua link (NĐ 356). Bài toán
   bán hàng khó.
7. **Quỹ câu hỏi cộng đồng**, in lịch/poster theo yêu cầu (chỉ nội dung, không vật phẩm hoá giải) — ưu tiên thấp.

**KHÔNG làm:** gacha / vòng quay may rủi (khuyến mại may rủi phải đăng ký; EU đang nhắm Temu); "cược chuỗi" (giống cờ
bạc dù +14% giữ chân); tư vấn trả bằng Sao theo phút (Sao trả bên thứ ba → giống tiền điện tử); phát hành token/tài sản
số (ngoài khung NQ 05/2025); bán vật phẩm "hoá giải" (mê tín dị đoan).

## 8. Pháp lý cần cập nhật (QUAN TRỌNG — em không tự sửa chính sách công khai)

Theo nghiên cứu (khớp hiểu biết của em, nhưng **cần anh/luật sư xác nhận** trước khi sửa văn bản công khai):

1. **NĐ 13/2023 đã được thay** bằng **Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 + NĐ 356/2025** (hiệu lực **01/01/2026**).
   21 tệp trong repo còn dẫn NĐ 13/2023 (chủ yếu chú thích code + tài liệu nội bộ; chính sách riêng tư công khai không
   hard-cite số này). Phạt vi phạm nghiêm trọng có thể tới **5% doanh thu năm liền kề** → việc gửi ảnh nhà + câu hỏi cho
   AI nước ngoài phải rà lại theo NĐ 356.
2. **Luật Thương mại điện tử 122/2025** hiệu lực **01/07/2026** — thủ tục thông báo website với Bộ Công Thương có thể đã
   đổi; NĐ 52/2013 & 85/2021 nhiều khả năng đã bị thay.
3. **Ba câu hỏi cho luật sư trước khi bật thu tiền / hoa hồng:**
   - Sao có thuộc "hợp đồng theo mẫu / điều kiện giao dịch chung" phải đăng ký theo Luật BVNTD 2023 + NĐ 55/2024 không?
   - Hoa hồng Sao **một tầng** khi bạn bè nạp có an toàn theo NĐ 40/2018 (sửa bởi NĐ 18/2023 — đa cấp chỉ cho hàng hoá)?
   - Quảng cáo dịch vụ "thần số / tử vi / phong thuỷ" theo Luật Quảng cáo 75/2025 (hiệu lực 01/01/2026) có hạn chế gì?

Em đề xuất: cập nhật **chú thích code + tài liệu nội bộ** sang luật mới (rủi ro thấp, làm được ngay), còn **văn bản
pháp lý công khai** (Điều khoản, Chính sách riêng tư) chỉ sửa sau khi anh xác nhận, vì đó là khẳng định luật với người
dùng.

## 9. Ba cách tiếp cận cho 3 ý kinh doanh đã duyệt (2026-10-26) — chấm và chọn

Ba ý chủ dự án duyệt: (1) hội viên năm VND + Sao/tháng · (2) "Hỏi chuyên gia" trả lời văn bản giá VND · (3) thiết kế lần
nạp đầu. Ba cách tiếp cận = ba thứ tự triển khai khác nhau:

| | **A. Nạp đầu trước** | **B. Hội viên trước** | **C. Chuyên gia trước** |
|---|---|---|---|
| Làm gì trước | Gói khởi đầu vừa 1 báo cáo + tặng Sao lần nạp đầu + ghi VND cạnh Sao | Bảng hội viên năm, quyền mở mọi chương, Sao/tháng không cộng dồn | Form đặt câu hỏi + payOS + 1–3 chuyên gia trả lời tay trong 48h |
| Thời gian tới đồng tiền đầu | Ngay khi bật nạp (vài ngày) | Sau khi chốt giá + điều khoản hoàn tiền (1–2 tuần) | Sau khi tuyển chuyên gia + quy tắc hành nghề (2–4 tuần) |
| Công làm | Thấp (1 migration nhẹ + trang nạp) | Vừa (migration bảng mới + quyền + gia hạn tay) | Thấp về code, **cao về vận hành** (người trả lời, thuế TNCN chuyên gia) |
| Rủi ro pháp lý | Thấp (minh bạch giá, không đếm ngược) | Vừa (hợp đồng mẫu, hoàn tiền theo thời gian còn lại) | Cao nhất (nội dung tư vấn, mê tín dị đoan, trả cho bên thứ ba) |
| Phụ thuộc | Tài khoản + payOS (đã có code) | Như A + chốt giá | Như A + người thật |
| Đo được | `paywall_viewed → checkout_started → nạp thành công`, tỉ lệ nạp lần 2 trong 60 ngày | tỉ lệ hội viên/MAU, mua lại năm sau | tỉ lệ đặt câu hỏi, đánh giá, hoàn tiền |
| Trần doanh thu | Thấp–vừa | Vừa (giữ chân tốt nhất theo số liệu ngành) | Cao nhất (Astrotalk) |
| Có lợi cho 2 cách còn lại? | **Có** — mọi người mua hội viên / hỏi chuyên gia đều đi qua cùng trang nạp | Một phần | Không |

**Chọn: A trước (em làm ngay), B tiếp (cần anh chốt giá), C chạy thử bằng tay (không cần build lớn).**

Lý do: A là nút thắt chung — mọi đồng tiền đều đi qua trang nạp, và hiện gói nhỏ nhất (29k/30 Sao) gấp 3 lần nhu cầu
mở 1 báo cáo (10 Sao), nên người muốn trả lại bị chặn bởi "phải nạp dư". A rủi ro thấp, làm nhanh, đo được bằng sự kiện
đã có, và làm cho B, C hiệu quả hơn khi tới lượt. B có giữ chân tốt nhất nhưng cần anh chốt giá + chính sách hoàn tiền
trước. C có trần cao nhất nhưng là việc vận hành người thật — nên chạy thử tay với 1 chuyên gia trước khi viết code.
