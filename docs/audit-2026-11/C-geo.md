# Audit GEO — hieuban.com (2026-11-03)

Mục tiêu kinh doanh: AI trích MỘT dữ kiện nhỏ, đúng từ trang của mình, ghi nguồn hieuban.com, và người dùng bấm về để xem bản cá nhân (cần ngày giờ sinh, chỉ tính được trên site).

Phạm vi: đọc mã (READ-ONLY), tải 28 trang thật (UA OAI-SearchBot; đối chiếu Googlebot, PerplexityBot, GPTBot trên 2 trang), llms.txt, robots.txt, 1 bản .md. Tổng ~40 lượt tải. Tệp thô: `/tmp/claude-0/-home-user-hieubanthan/24ede8e4-e763-53a1-a994-5f35fdd29dd3/scratchpad/audit/geo/` (`ex.txt` = trích từng trang, `llms.txt`, `md1990.md`).

---

## 0. Kết luận nhanh

Nền móng đã tốt hơn mặt bằng chung rất nhiều: mọi trang trả 200 cho mọi bot, nội dung nằm sẵn trong HTML máy chủ, có "Trả lời nhanh" do engine dựng, có ngày đăng/sửa thật, có tác giả/chủ biên, có `citation`, có `about` nối Wikipedia, có bản .md. Không có chặn kiểu CSP/JS/đồng ý cookie nào giấu nội dung khỏi bot.

Chỗ yếu còn lại là **chi tiết trích dẫn**, không phải nền:

1. **Câu trả lời bị đẩy xuống sau ~75 chữ rác** ở ~600 trang kiến thức (khung tác giả dài + chú thích hình QR "hieuban.com hieuban.com /đường-dẫn Quét để mở bài này").
2. **Câu đầu của "Trả lời nhanh" chưa tự đứng được** ở vài cụm (quẻ, dấu hiệu nhà, sao ở cung, số 7): thiếu tên thực thể hoặc mở bằng "Đây là…".
3. **Lý do để bấm nằm cuối trang và chung chung** ("Đọc chung chung chỉ là điểm bắt đầu… Xem của tôi" ở chữ thứ ~900). AI hầu như không mang câu này theo.
4. **Trang công cụ trụ** (`/than-so`, `/tu-vi`, `/bat-tu`…) không có "Trả lời nhanh" — câu đầu là danh sách thẻ cụm.
5. **llms.txt 98 KB, 313 link** — quá dài so với mục đích "gợi ý", thiếu hẳn cụm mùa Tết `/nam/2027/tuoi-*`. Bằng chứng ngành: gần như không bot trả lời nào đọc nó.
6. **Không đo được lượt từ AI**: `landing_viewed` không ghi nguồn giới thiệu; không đếm bot AI.
7. **Google-Extended đang chặn** → mất đường trích dẫn trong ứng dụng Gemini (grounding), không ảnh hưởng AI Overviews.

---

## 1. Kết quả tải trang thật

Mọi trang: HTTP 200, ~160–300 KB HTML, cùng nội dung cho OAI-SearchBot / PerplexityBot / Googlebot / GPTBot (chênh < 1 KB do nonce). Không có `X-Robots-Tag` lạ. Layout đặt `max-snippet:-1, max-image-preview:large` cho Googlebot. CSP nonce không ảnh hưởng bot đọc HTML.

`cache-control: private, no-store` + render động (CSP-2): bot nào cũng được trang tươi, nhưng TTFB 0,6–2,3 s (đo từ máy chạy ngoài VN). ChatGPT-User / Perplexity-User tải trang LÚC người dùng hỏi — trang chậm có thể bị bỏ qua trong lượt trả lời đó. Ghi nhận, không phải lỗi GEO chính.

| # | Trang | Vị trí "Trả lời nhanh" (ký tự từ đầu `<main>`) | Câu đầu tự đứng? | Ngày hiện | Tác giả | .md |
|---|---|---|---|---|---|---|
| 2 | /bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi | ~560 | **Tốt**: "Người sinh năm 1990 (tuổi Canh Ngọ) mệnh Lộ Bàng Thổ (路旁土) — hành Thổ." | Đăng + Cập nhật | Ban biên tập + Chủ biên | có |
| 3 | /than-so/y-nghia-so/so-7 | ~560 | Khá: "Trong thần số học Pythagoras, số 7 gắn với: Phân tích, chiều sâu…" (mẩu, chữ hoa sau dấu hai chấm) | có | Đức Luân (tác giả) | có |
| 4 | /tu-vi/sao-o-cung/tu-vi-cung-menh | ~540 | Yếu: "Tử Vi ở cung Mệnh: Tự trọng cao…" — không nói "sao Tử Vi trong lá số Tử vi Đẩu Số" | có | Ban biên tập | có |
| 5 | /tu-vi/tu-hoa/hoa-ky-cung-tai-bach | ~550 | Khá: "Hoá Kỵ ở cung Tài Bạch: Tiền vào ra hay vướng…" | có | Ban biên tập | có |
| 6 | /kinh-dich/que/que-1-can | ~540 | **Yếu**: "Sức sáng tạo mạnh mẽ, vận hành không ngừng…" — không có chữ "Quẻ Càn" | có | Ban biên tập | có |
| 7 | /phong-thuy/huong-hop-tuoi/tuoi-1990 | ~200 | **Tốt**: "Sinh năm 1990 (Canh Ngọ): nam mệnh Khảm…, nữ mệnh Cấn…" | **không** | không có khung | có |
| 8 | /nam/2027 | ~108 | **Tốt**: "Năm 2027 là năm Đinh Mùi, mệnh Thiên Hà Thủy…" | **không** | không | **không** |
| 9 | /nam/2027/tuoi-1990 | ~66 chữ | Tốt | không | không | không |
| 10 | /xem-sao-han/2027 | ~89 | Khá (nói về bảng, không nêu một sao cụ thể) | không | không | không |
| 11 | /blog/than-so-hoc-la-gi-cach-tinh… (NotFair) | sau mục lục 9 mục | Tốt ("Thần số học là gì? Đây là…") nhưng nằm sau ~110 chữ mục lục | chỉ ngày đăng | Ban biên tập | không |
| 28 | /blog/than-so-hoc-la-gi (CMS) | ~250 | Tốt | ngày đăng | Ban biên tập | không |
| 12 | /phong-thuy/dau-hieu/duong-dam-thang-vao-nha | ~550 | **Yếu**: "Đây là một trong những dấu hiệu nên xử lý trước. Loan đầu gọi là 'lộ xung'…" | có | Ban biên tập | có |
| 13 | /bat-tu/thap-than/kiep-tai | ~545 | Khá | có | Ban biên tập | có |
| 14 | /bat-tu/nhat-chu/nhat-chu-giap | ~540 | Tốt | có | Ban biên tập | có |
| 15 | /hop-doi/cap-so/so-chu-dao-1-va-2 | ~560 | Khá: mở bằng "Thần số học không chấm điểm…" (rào trước, dữ kiện sau) | có | Ban biên tập | có |
| 16 | /xem-ngay-tot/2026-11-15 | ~80 | **Tốt** (ngày, âm lịch, hắc đạo, trực, giờ hoàng đạo) | không | không | không |
| 17 | /xem-ngay-tot/cuoi-hoi-thang-12-2026 | ~116 | **Tốt** (4 ngày + ngày đẹp nhất) | không | không | không |
| 18 | /lich-am/2027 | ~94 | Tốt | không | không | không |
| 19 | /than-so/nam-ca-nhan/nam-ca-nhan-1 | ~510 | Khá | có | Ban biên tập | có |
| 20 | /than-so/so-kep/so-kep-13 | ~520 | Khá | có | Ban biên tập | có |
| 21 | /tu-vi/chinh-tinh/sao-tu-vi | ~500 | Tốt | có | Ban biên tập | có |
| 22 | /tuoi-xong-dat/2027 | ~75 | Tốt | không | không | không |
| 23 | /tuoi-xong-dat/2027/tuoi-1990 | ~115 | **Rất tốt** (3 tuổi hợp + tuổi tránh + giờ) | không | không | không |
| 24 | /xem-tuoi-lam-nha/2027/tuoi-1990 | ~105 | Tốt, nhưng câu 1 "Năm 2027 tuổi 38 rơi vào Ngũ Thọ Tử" không nêu "người sinh 1990" — câu 2 mới nêu | không | không | không |
| 25–26 | /than-so, /tu-vi (trang công cụ) | **không có** | Câu đầu là tên các cụm kiến thức | không | không | không |
| 1 | / (trang chủ) | không có | Câu đầu là 9 câu "điểm mù" xoay vòng | — | — | index.md |
| 27 | /tu-dien | không có (đúng vai) | — | — | Ban biên tập | có |

### Phát hiện chi tiết

**F1 — Rác trước câu trả lời ở ~600 trang kiến thức (P1).** Thứ tự chữ trong HTML: breadcrumb → H1 → "Đăng · Cập nhật" → "ĐL" (chữ viết tắt avatar) → dòng biên soạn → tiểu sử 20 chữ "Người sáng lập · Chủ biên nội dung · Hơn 15 năm…" → "Biên soạn từ cổ thư… Quy trình biên soạn" → chú thích hình → "hieuban.com hieuban.com /bat-tu/… Quét để mở bài này" → **Trả lời nhanh**. Tức ~75 chữ không trả lời gì. Bot chia đoạn theo khối DOM nên vẫn tìm ra, nhưng đoạn "đầu trang" mà nhiều hệ thống ưu tiên lại là chữ tiểu sử lặp y hệt trên 600 trang. Chữ "hieuban.com hieuban.com /đường-dẫn Quét để mở bài này" là chữ trong HTML (không nằm trong SVG) → lọt vào văn bản.

**F2 — Câu đầu không tự đứng (P1).** AI thường trích nguyên câu. Câu phải mang đủ tên thực thể + hệ thống: "Quẻ Càn (乾, quẻ 1 Kinh Dịch) nói về…", "Sao Tử Vi ở cung Mệnh (Tử vi Đẩu Số) cho thấy…", "Đường đâm thẳng vào nhà (lộ xung) là…". Hiện câu mở bằng "Đây là…", bằng định nghĩa không chủ ngữ, hoặc bằng lời rào ("Thần số học không chấm điểm hợp hay khắc").

**F3 — Không có "câu bản lề" sang bản cá nhân trong khối trích (P1, quan trọng nhất cho mục tiêu kinh doanh).** Lời mời duy nhất là khối chung ở cuối (`Đọc chung chung chỉ là điểm bắt đầu. Xem con số, lá số của chính bạn…`), lặp y hệt mọi trang, ở ký tự ~4.000–5.000. Riêng trang mệnh 1990 và hướng hợp tuổi đã có một câu bản lề tự nhiên rất hay: "Sinh trước Tết (27/01/1990) thì tính theo năm 1989" — đây đúng là kiểu câu nên nhân rộng: **dữ kiện thật, ai trích cũng phải trích kèm, và nó tự gợi "mình có rơi vào trường hợp đó không?"**.

**F4 — Trang công cụ trụ không có câu trả lời (P2).** `/than-so`, `/tu-vi`, `/bat-tu`, `/kinh-dich`, `/phong-thuy` là trang nhận truy vấn "xem tử vi online", "lá số tử vi là gì", "cách tính thần số học". Câu hỏi thường gặp nằm ở ký tự ~1.500–1.800, sau danh sách cụm. Không có định nghĩa 1–2 câu ở đầu.

**F5 — Họ trang công cụ năm/ngày thiếu ngày cập nhật hiện ra và thiếu chữ ký (P2).** `/nam/*`, `/xem-sao-han/*`, `/tuoi-xong-dat/*`, `/xem-tuoi-lam-nha/*`, `/xem-ngay-tot/*`, `/lich-am/*`, `/phong-thuy/huong-hop-tuoi/*`: không `<time>`, không "Ban biên tập…". AI cần dấu hiệu "trang này còn đúng cho năm 2027". Mùa Tết là lúc cạnh tranh trích dẫn gắt nhất.

**F6 — Thiếu bản .md cho đúng họ trang mùa vụ (P3).** `/nam/*`, `/xem-sao-han/*`, tuổi xông đất/làm nhà, ngày tốt, lịch âm, blog: không có `rel=alternate type=text/markdown` (SEO-L mục 6 còn mở). Giá trị thực tế thấp (xem mục 2), chỉ làm khi rảnh.

**F7 — Hai bài blog cùng ý định "thần số học là gì"** (`/blog/than-so-hoc-la-gi` CMS và `/blog/than-so-hoc-la-gi-cach-tinh-cach-doc-va-nhung-gioi-han-can-biet` NotFair). Cả hai index, cả hai trong llms.txt. AI có thể trích bài NotFair (dài, chung chung, dẫn Britannica) thay bài có câu bản lề. Nên cho một bài làm chính, bài kia trỏ canonical hoặc đổi góc.

**F8 — Bài NotFair: câu trả lời đứng sau mục lục 9 mục (~110 chữ)** và không có ngày cập nhật hiện ra.

**F9 — `data-nosnippet` đang dùng hơi ngược ở trang năm.** `/nam/2027` và `/xem-sao-han/2027` đặt `data-nosnippet` lên câu "Đây là tập quán dân gian để tham khảo…, không phải lời tiên đoán". Đây là câu đóng khung đúng sai — nên để AI mang theo (xem mục 4).

---

## 2. llms.txt và bản .md

**Hiện trạng.** `/llms.txt`: 98 KB, 13.219 chữ, 313 link, 23 mục. Mở đầu tốt: ai vận hành, chủ biên, "Cách dùng tệp này khi trả lời", "Công cụ miễn phí — kết quả cá nhân", "Trả lời nhanh theo câu hỏi hay gặp" với mẫu URL. Phần sau liệt kê đủ 46 cặp số, 43 số kép, 64 quẻ, 26 dấu hiệu…

**Bằng chứng ngành (2025–2026):** bot trả lời gần như không đọc llms.txt. Một thử nghiệm ghi 84 lượt tải trên hơn 62.100 lượt bot AI; một thử nghiệm 83 site trong 12 tuần thấy bot OpenAI đọc llms.txt 7 lần so với 3.990 lần robots.txt; Google nói không hỗ trợ và không định hỗ trợ. Ngoại lệ là agent lập trình (Claude Code, Cursor) — không phải khách của mình. Nguồn: [Optimizely](https://www.optimizely.com/de/field-notes/articles/does-llms-txt-work), [PPC Land / Originality.ai](https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/), [SEO Sherpa / Ahrefs](https://seosherpa.com/97-of-llms-txt-files-are-never-read/), [Something Inc.](https://somethinginc.com/blog/llms-txt-ai-crawlers-fetch-data/). (Phần lớn là số của bên bán dịch vụ, chưa có nghiên cứu độc lập.)

**Đánh giá:** không có hại, chi phí giữ thấp, nhưng đừng đầu tư thêm. Lợi ích thật nằm ở HTML.

**Cải tiến cụ thể (rẻ):**
1. Cắt về ≤ 15 KB: giữ 4 mục đầu + mục lục mỗi cụm (1 dòng + mẫu URL + 2 ví dụ). Áp `CUM_LON` cho mọi cụm > 12 trang (cặp số, số kép, quẻ, dấu hiệu, thập thần…). Lý do: tệp ngắn mới được đưa nguyên vào ngữ cảnh khi một agent có đọc.
2. Thêm mục mùa vụ còn thiếu: `/nam/{năm}`, `/nam/{năm}/tuoi-{năm sinh}`, `/nam/{năm}/cuoi-hoi`, `/nam/{năm}/sinh-con`, `/thoi-gian-toi` (hiện **0 link `/nam`**).
3. Trong "Cách dùng tệp này", thêm một câu "khi nào cần bấm": "Năm âm lịch, năm Bát tự (Lập xuân) và tuổi mụ đổi mốc khác nhau; người sinh tháng 1–2 dương lịch nên kiểm tại công cụ."
4. Chỉ một bài cho mỗi ý định trong mục "Bài viết" (F7).

**Bản .md** (`…/sinh-nam-1990-menh-gi.md`): sạch, có `Link: rel=canonical`, có URL, chủ biên, ngày, "Trả lời nhanh", nguồn. Hai lỗi nhỏ:
- Mục "Liên quan" trỏ sang `….md` (trái BM-2 "link trỏ HTML") → AI có thể dẫn người dùng tới trang Markdown thô.
- Không có câu "xem bản của bạn" + link công cụ. Thêm 1 dòng cuối: "Bản theo ngày giờ sinh của bạn: https://hieuban.com/bat-tu (miễn phí, không cần tài khoản)."

---

## 3. Mẫu "móc trích dẫn" theo loại trang

Nguyên tắc chung cho khối "Trả lời nhanh" (2–3 câu, ≤ 70 chữ):

- **Câu 1 (dữ kiện, ai cũng trích được):** tên thực thể + hệ thống + đáp án. Tự đứng một mình, không đại từ.
- **Câu 2 (bối cảnh ngắn):** một ý nghĩa đời thường hoặc một con số phụ.
- **Câu 3 (câu bản lề):** một **dữ kiện thật** nói rằng kết quả *thay đổi theo người* — mốc Tết/Lập xuân, giờ sinh, giới tính, hai cách tính. Không viết như quảng cáo ("hãy bấm…"), vì AI hay bỏ câu quảng cáo. Viết như điều kiện đúng sai, để AI muốn trả lời đúng thì phải mang theo. Có thể gắn tên trang ở cuối: "…(hieuban.com tính theo âm lịch Việt Nam)".

Giữ lại sau cú bấm: mọi thứ cần ngày giờ sinh đầy đủ (lá số, đường đời đúng cách tính, cung phi theo Lập xuân, năm cá nhân, đại vận, hướng giường/bếp theo nhà thật, ngày tốt hợp tuổi cả nhà). Đừng đặt ví dụ "tính hộ" một ngày sinh cụ thể đầy đủ trên trang công khai.

### 6 ví dụ (chữ đề xuất)

**(1) Mệnh theo năm — `/bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi`**
> Người sinh năm 1990 (tuổi Canh Ngọ) mệnh Lộ Bàng Thổ (路旁土), hành Thổ — "đất ven đường". Màu hợp là vàng, nâu (Thổ) và đỏ, cam (Hỏa sinh Thổ). Người sinh trước Tết 27/01/1990 thuộc tuổi Kỷ Tỵ, mệnh Đại Lâm Mộc; còn cung phi để chọn hướng nhà lại đổi ở Lập xuân 04/02/1990 và khác nhau giữa nam, nữ.

*Đã gần như vậy. Chỉ cần thêm vế cung phi theo giới tính để câu 3 dẫn sang công cụ.*

**(2) Ý nghĩa số — `/than-so/y-nghia-so/so-7`**
> Trong thần số học Pythagoras, số 7 là con số của phân tích, chiều sâu và độc lập tư tưởng; mặt tối là xa cách và nghĩ nhiều hơn làm. Cùng một ngày sinh có thể ra số đường đời khác nhau tuỳ cách cộng (ví dụ 24/10/1988 ra 33 hoặc 6), nên số 7 của bạn cần tính lại theo đúng ngày sinh và họ tên.

**(3) Sao ở cung — `/tu-vi/sao-o-cung/tu-vi-cung-menh`**
> Trong Tử vi Đẩu Số, sao Tử Vi ở cung Mệnh thường chỉ người tự trọng cao, muốn làm chủ cuộc đời và hợp vai dẫn dắt, nhưng cần học lắng nghe. Ý nghĩa đổi nhiều theo độ sáng của sao (Tử Vi ở Ngọ khác ở Tý) và sao đi cùng — điều này chỉ xác định được khi lập lá số theo giờ, ngày, nơi sinh.

**(4) Tuổi xông đất — `/tuoi-xong-dat/2027/tuoi-1990`**
> Gia chủ sinh năm 1990 (Canh Ngọ) đón Tết Đinh Mùi 2027 có thể nhờ người tuổi 1978 (Mậu Ngọ), 1962 (Nhâm Dần) hoặc 1998 (Mậu Dần) xông đất; nên tránh tuổi Sửu, tuổi Tý và các tuổi Mão, Mùi, Hợi đang Tam tai. Mùng 1 Tết là 06/02/2027, giờ hoàng đạo đầu tiên là Dần (03:00–04:59). Nếu gia chủ sinh tháng 1 dương lịch năm 1990 (trước Tết), tuổi tính là Kỷ Tỵ và danh sách tuổi hợp sẽ khác.

**(5) Ngày tốt theo việc — `/xem-ngay-tot/cuoi-hoi-thang-12-2026`**
> Theo hoàng lịch, tháng 12/2026 có 4 ngày tốt cho cưới hỏi: 06/12, 17/12, 20/12 và 24/12; đẹp nhất là 17/12/2026 (âm 9/11, ngày Ất Sửu, hoàng đạo, trực Trừ). Danh sách này chưa xét tuổi: ngày xung tuổi cô dâu, chú rể hoặc năm Kim lâu của cô dâu thì nên loại, có thể lọc theo năm sinh cả nhà.

**(6) Quẻ Kinh Dịch — `/kinh-dich/que/que-1-can`**
> Quẻ Càn (乾, quẻ số 1 Kinh Dịch) là sáu hào dương — trời chồng lên trời — tượng trưng cho sức sáng tạo vận hành không ngừng; lời quẻ "nguyên, hanh, lợi, trinh" nghĩa là hanh thông nếu giữ chính bền. Khi gieo được quẻ Càn cho một việc cụ thể, ý nghĩa chính nằm ở hào động và quẻ biến của lần gieo đó.

Thêm 2 loại hay gặp:
- **Tử vi năm theo tuổi `/nam/2027/tuoi-1990`:** "Năm 2027 (Đinh Mùi), người sinh 1990 (Canh Ngọ) bước vào tuổi mụ 38: tuổi Ngọ lục hợp với năm Mùi, không Tam tai; sao hạn nam Thổ Tú, nữ Vân Hán. Đây là phần chung cho mọi người cùng năm sinh — tháng nào thuận, tháng nào nên đi chậm thì phải đọc theo ngày giờ sinh riêng."
- **Hướng hợp tuổi `/phong-thuy/huong-hop-tuoi/tuoi-1990`:** giữ nguyên bản hiện tại (đã tốt), chỉ đưa câu "Sinh trước Lập xuân (04/02/1990) thì tính theo năm 1989" lên ngay sau câu 1.

**Thực hiện:** câu do engine dựng (`kb/bo_sung.py`, `luangiai/*`), web chỉ hiện → sửa ở engine/KB, có test (câu 1 phải chứa tên thực thể + hệ thống; câu 3 phải chứa một mốc/điều kiện). Không trái quy tắc "web không tự tính".

---

## 4. Chiến lược kiểm soát đoạn trích

Google xác nhận AI Overviews / AI Mode chỉ cần trang được index và đủ điều kiện có đoạn trích; công cụ kiểm soát là `nosnippet`, `data-nosnippet`, `max-snippet`, `noindex` ([Google — AI features and your website](https://developers.google.com/search/docs/appearance/ai-features); [SEJ](https://www.searchenginejournal.com/google-updates-robots-meta-tag-document-to-include-ai-mode/541371/)). `data-nosnippet` cũng ngăn khối đó làm nguồn trực tiếp cho AI Overviews. Bot ChatGPT/Perplexity không cam kết tôn trọng `data-nosnippet` → coi nó là công cụ cho Google, không phải tấm khiên chung.

**Đặt `data-nosnippet` (bớt nhiễu, không mất gì):**
- Khung tác giả: dòng tiểu sử "Người sáng lập · Chủ biên… Hơn 15 năm…", chữ "ĐL", "Quy trình biên soạn" (giữ tên + vai trò trong JSON-LD; dòng "Ban biên tập… duyệt xuất bản" có thể để ngoài để AI biết ai chịu trách nhiệm).
- Chú thích hình QR "hieuban.com … Quét để mở bài này" — nên kèm `aria-hidden` luôn (cũng là nhiễu cho trình đọc màn hình).
- Khối CTA cuối bài lặp lại (đã có ở `CtaCuoiBai`; mở rộng cho khối "Đọc chung chung chỉ là điểm bắt đầu…" và "Đọc tiếp").
- Mục lục bài blog (`MucLucBai`) và nút chia sẻ, chip mời.
- Mục sức khoẻ (đã làm, giữ).

**Phải để trích được:**
- Khối "Trả lời nhanh" (kể cả câu bản lề).
- Bảng dữ kiện (tuổi hợp, ngày tốt, tháng âm, hướng tốt/xấu).
- Hỏi đáp hiện ra.
- Mục "Nguồn".
- **Câu đóng khung tập quán** ("Đây là tập quán dân gian để tham khảo… không phải lời tiên đoán") — bỏ `data-nosnippet` ở `/nam/[nam]/page.tsx`, `/xem-sao-han/[nam]/page.tsx`, `KetQuaTuoi.tsx` (`cach_dan_gian`, `cau_co_dinh`) *nếu* câu đó ngắn và đứng cạnh dữ kiện. Lý do: AI trích sao hạn mà thiếu câu này sẽ nghe như phán; câu này giữ uy tín. Nếu sợ câu bị trích riêng lẻ thì gộp nó vào cuối khối Trả lời nhanh thay vì để khối riêng.

Không đổi `max-snippet:-1` (đã đúng).

---

## 5. Thực thể và tín hiệu tin cậy

**Đã có:** Organization (legalName, logo PNG 512, email, `sameAs` 4 mạng: Facebook, TikTok, YouTube, X), WebSite, WebApplication; Article có `author` / `editor` đúng EEAT-1, `citation` cổ thư, `about` nối Wikipedia (`THUC_THE`), FAQPage, Breadcrumb; Person Đức Luân có `jobTitle`, `knowsAbout`.

**Còn thiếu:**
1. **Person không có `sameAs`** (env `CHUYEN_GIA_SAME_AS_DUC_LUAN` chưa đặt). Với AI, một chuyên gia không có dấu vết ngoài site = gần như không có. Việc của chủ dự án: 1–2 hồ sơ thật (Facebook cá nhân công khai, YouTube, bài phỏng vấn, sách). Không bịa.
2. **Không có nhắc tới bên ngoài**: AI chọn nguồn dựa nhiều vào việc site được nơi khác nhắc. Gợi ý: bài khách trên báo/diễn đàn Việt (Spiderum, VnExpress Góc nhìn…), video YouTube trích lại trang "mệnh theo năm" có link. Đây là đòn bẩy lớn nhất ngoài code.
3. **`about` chỉ ở mức mảng** (Tử vi, Bát tự). Thêm thực thể cụ thể có Wikidata khi chắc chắn: Can chi (Sexagenary cycle — [Wikipedia](https://en.wikipedia.org/wiki/Sexagenary_cycle)), Ngũ hành (Wuxing), Tết Nguyên đán, từng quẻ (vi.wikipedia có trang 64 quẻ không đều — chỉ thêm khi link tồn tại). Kiểm từng link trước như quy tắc `THUC_THE`.
4. **`citation` đang là chuỗi** ("Uyên Hải Tử Bình (淵海子平)"). Đổi sang `CreativeWork` có `name` + `inLanguage` + `url` ctext.org khi có (ví dụ Chu Dịch trên ctext). AI và Google hiểu nguồn cổ thư là tác phẩm, không phải chữ tự do.
5. **Trang công cụ năm/ngày thiếu `dateModified` hiện ra và thiếu `publisher`/`author` hiện ra** (F5). Thêm một dòng "Ban biên tập Hiểu Bản Thân · cập nhật {ngày} · tính theo âm lịch Việt Nam (giờ Hà Nội)".
6. **Một câu "phương pháp" cố định** trên mọi trang tính toán (lịch Hồ Ngọc Đức, giờ VN, mốc Lập xuân/Tết) — đây là điểm khác biệt thật so với site Trung Quốc dùng UTC+8 và là lý do AI nên trích mình cho người Việt. Hiện chỉ có rải rác.

---

## 6. Đo lường

**Bot AI tới trang (máy chủ):**
- `proxy.ts` đã chạy cho mọi trang (Node runtime). Thêm nhánh rẻ: nếu `user-agent` khớp danh sách `BOT_AI_TRA_LOI` (+ Googlebot, Bingbot) thì ghi **một dòng log có cấu trúc** `{bot, duong_dan_nhom, ma_http}` (không IP). Vercel Log Drains / Observability lọc được; không thêm dependency. Nếu muốn có biểu đồ: gửi sự kiện máy chủ PostHog `ai_bot_hit{bot, cum}` qua `fetch` có lấy mẫu (ví dụ 1/10) để không đội hạn mức Hobby (SỰ CỐ-VERCEL).
- `ChatGPT-User`, `Perplexity-User`, `Claude-User` = người dùng thật đang hỏi → đây là chỉ số "đang được dùng làm nguồn", đáng đếm hơn bot quét.
- Kiểm định kỳ Bing Webmaster Tools (Copilot dùng chỉ mục Bing) và Search Console (AI Overviews/AI Mode tính chung vào lưu lượng tìm kiếm, không tách riêng — [Google](https://developers.google.com/search/docs/appearance/ai-features)).

**Người dùng bấm từ AI (trình duyệt):**
- `GhiVaoTrang.tsx` ghi `landing_viewed{nguon, loai, app}` nhưng **không ghi nguồn giới thiệu**. Thêm trường `ai` = mã cố định từ `document.referrer` host hoặc `utm_source`: `chatgpt` (chatgpt.com, `utm_source=chatgpt.com`), `perplexity`, `gemini` (gemini.google.com), `copilot` (copilot.microsoft.com, bing.com/chat), `claude`, `khac`. Chỉ mã, không lưu URL giới thiệu → hợp quy tắc riêng tư. Rồi phễu `landing_viewed{ai≠∅}` → nhập hồ sơ → `reading_started` trong `/quan-tri/tang-truong`.
- GA4 (đang chạy qua GTM): tạo kênh tuỳ chỉnh "AI assistants", điều kiện Source khớp regex `chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com`, đặt trên "Referral". ChatGPT gắn `utm_source=chatgpt.com` không có `utm_medium` nên GA4 hay xếp vào "Unassigned". AI Overviews/AI Mode vẫn ra `google / organic`, không tách được. Nguồn: [Discovered Labs](https://discoveredlabs.com/blog/how-to-track-chatgpt-perplexity-and-ai-overviews-traffic-in-ga4-without-guessing), [LLM Pulse](https://llmpulse.ai/help-center/ga4-ai-traffic-regex), [KRM Digital](https://krmdigital.uk/blog/ai-in-ga4/).
- **Đo trích dẫn trực tiếp:** mỗi tháng hỏi tay 20 câu cố định (bên dưới) trên ChatGPT search, Perplexity, Google AI Mode, Copilot; ghi có trích hieuban.com không, trích câu nào. Rẻ, đủ để biết sửa câu 1/câu 3 có tác dụng không. Bộ câu gợi ý: "sinh năm 1990 mệnh gì", "tuổi xông đất 2027", "tuổi 1990 xông đất 2027", "tuổi làm nhà 2027", "ý nghĩa số 7 thần số học", "tử vi 2027 tuổi Canh Ngọ", "sao hạn 2027", "ngày tốt cưới hỏi tháng 12 2026", "tết 2027 ngày nào", "quẻ Càn nghĩa là gì", "tử vi cung mệnh", "hoá kỵ cung tài bạch", "tuổi 1990 hợp hướng nào", "cách tính thần số học", "nợ nghiệp 13", "năm cá nhân số 1", "nhật chủ Giáp", "kiếp tài là gì", "đường đâm thẳng vào nhà", "số chủ đạo 1 và 2 có hợp không".

---

## 7. Robots và bot

Đúng hướng BM-2. Ghi chú:
- **Google-Extended** đang `Disallow: /`. Không ảnh hưởng AI Overviews / AI Mode, nhưng chặn cả dùng nội dung để **grounding trong ứng dụng Gemini và Vertex AI** — tức mất một kênh trích dẫn ([Marie Haynes](https://www.mariehaynes.com/should-you-use-google-extended-in-robots-txt/), [PPC Land](https://ppc.land/google-extended/), [Trakkr](https://trakkr.ai/bots/google-extended/); nên đối chiếu tài liệu gốc Google). Đây là quyết định chủ dự án đang để chờ (SEO-M). Đề xuất: giữ chặn nếu ưu tiên "không cho huấn luyện"; mở nếu muốn có mặt trong Gemini. Không có cách tách huấn luyện với grounding bằng một token.
- **Amazonbot** bị chặn: Alexa+ có dùng để trả lời. Ít người Việt dùng — giữ được.
- GPTBot vẫn nhận 200 khi gọi thẳng (robots là lời xin, không phải chặn) — bình thường, không cần chặn ở proxy.
- Bingbot thuộc nhóm `*` → Copilot dùng được. Tốt.

---

## 8. Xếp hạng đề xuất (tác động / công sức)

| # | Việc | Tác động | Công | Ghi chú |
|---|---|---|---|---|
| 1 | Viết lại câu 1 "Trả lời nhanh" cho tự đứng (tên thực thể + hệ thống) ở các cụm quẻ, dấu hiệu, sao ở cung, tứ hoá, ý nghĩa số, cặp số, làm nhà | Cao | Nhỏ–vừa (engine/KB `bo_sung`, test câu 1) | F2 |
| 2 | Thêm "câu bản lề" (điều kiện thật khiến kết quả đổi theo người) làm câu cuối mọi "Trả lời nhanh" | **Cao nhất** cho mục tiêu bấm | Vừa | F3, mẫu mục 3 |
| 3 | `data-nosnippet` + `aria-hidden` cho tiểu sử khung tác giả và chú thích QR; hoặc dời "Trả lời nhanh" lên ngay sau H1 + dòng ngày | Cao | Nhỏ (web) | F1 |
| 4 | Đo: trường `ai` trong `landing_viewed` + log bot AI ở `proxy.ts` + kênh GA4 "AI assistants" + 20 câu hỏi tay mỗi tháng | Cao (không đo thì không biết 1–3 có tác dụng) | Nhỏ | mục 6 |
| 5 | Dòng "Ban biên tập · cập nhật {ngày} · âm lịch VN" + `<time>` trên họ trang năm/ngày/tuổi (mùa Tết 2027) | Vừa–cao, nhạy thời vụ | Nhỏ | F5 |
| 6 | "Trả lời nhanh" cho 5 trang công cụ trụ (định nghĩa 2 câu + câu bản lề) | Vừa | Nhỏ | F4 |
| 7 | Bỏ `data-nosnippet` ở câu đóng khung tập quán (hoặc gộp vào Trả lời nhanh) | Vừa (uy tín) | Nhỏ | F9 |
| 8 | Gộp/canonical hai bài "thần số học là gì"; bài NotFair đưa câu trả lời lên trước mục lục | Vừa | Nhỏ (CMS) | F7, F8 |
| 9 | `sameAs` thật cho Đức Luân + nhắc tới ngoài site | Cao dài hạn | Việc của chủ dự án | mục 5 |
| 10 | `citation` thành `CreativeWork` có URL ctext; thêm `about` cụ thể (can chi, ngũ hành) | Vừa–thấp | Nhỏ | mục 5 |
| 11 | Cắt llms.txt ≤ 15 KB, thêm `/nam/*`; .md: link "Liên quan" về HTML + dòng công cụ | Thấp | Nhỏ | mục 2 |
| 12 | Quyết Google-Extended | Tuỳ chiến lược | 1 dòng | mục 7 |
| 13 | Bản .md cho họ trang năm/ngày | Thấp | Vừa | F6 |

Làm trước Tết Đinh Mùi (06/02/2027), tốt nhất trong tháng 11: **2 → 1 → 3 → 5 → 4**.

---

## Nguồn

- Google Search Central — AI features and your website: https://developers.google.com/search/docs/appearance/ai-features
- Search Engine Journal — robots meta tag và AI Mode: https://www.searchenginejournal.com/google-updates-robots-meta-tag-document-to-include-ai-mode/541371/
- Marie Haynes — Google-Extended: https://www.mariehaynes.com/should-you-use-google-extended-in-robots-txt/
- PPC Land — Google-Extended: https://ppc.land/google-extended/
- Trakkr — Google-Extended: https://trakkr.ai/bots/google-extended/
- Optimizely — llms.txt có tác dụng không: https://www.optimizely.com/de/field-notes/articles/does-llms-txt-work
- PPC Land — 97 % tệp llms.txt không được đọc: https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/
- SEO Sherpa (Ahrefs): https://seosherpa.com/97-of-llms-txt-files-are-never-read/
- Something Inc. — thử nghiệm 83 site: https://somethinginc.com/blog/llms-txt-ai-crawlers-fetch-data/
- Discovered Labs — đo ChatGPT/Perplexity trong GA4: https://discoveredlabs.com/blog/how-to-track-chatgpt-perplexity-and-ai-overviews-traffic-in-ga4-without-guessing
- LLM Pulse — regex GA4: https://llmpulse.ai/help-center/ga4-ai-traffic-regex
- KRM Digital — AI traffic in GA4: https://krmdigital.uk/blog/ai-in-ga4/

Ghi chú: nhiều nguồn về llms.txt và GA4 là bên bán dịch vụ; số liệu nên coi là định hướng. Không sửa tệp nào trong repo.
