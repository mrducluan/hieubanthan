# Persona C — máy trả lời AI (OAI-SearchBot) đọc HTML thô · http://localhost:3100 · 2026-11-03

Cách làm: curl UA `OAI-SearchBot/1.3`, không chạy JS; đọc /robots.txt, /llms.txt, /sitemap.xml (962 URL) + sitemap-ngay, sitemap-cum; ~60 request. Vị trí chữ = số từ (tách theo khoảng trắng) trong `<main>`, **tính cả** chữ nằm trong `data-nosnippet` (ghi [ns] khi có). HTML thô lưu ở `review/raw/`.

Tiêu chí (0–2 mỗi ô): A tìm được trang · B trả lời trong ~100 chữ đầu `<main>` · C câu tự đứng · D dữ kiện kiểm lại được · E móc về site (phần riêng) · F robots/canonical · G data-nosnippet đúng chỗ.

## Bảng điểm

| # | Câu | Trang nguồn | A | B | C | D | E | F | G | Σ/14 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sinh 1990 mệnh gì | /bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 12 |
| 2 | Nữ 1990 hợp hướng nào | /phong-thuy/huong-hop-tuoi (+ /cung-can-dong-bac) | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 13 |
| 3 | Cung Khảm hợp hướng nào | /phong-thuy/huong-hop-tuoi/cung-kham-bac | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 13 |
| 4 | 1985 làm nhà 2027 | /xem-tuoi-lam-nha/2027/tuoi-1985 | 2 | 2 | 1 | 2 | 1 | 2 | 2 | 12 |
| 5 | Xông đất Tết 2027 gia chủ 1988 | /tuoi-xong-dat/2027/tuoi-1988 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 13 |
| 6 | Tết 2027, tháng nhuận | /lich-am/2027 (+ /nam/2027) | 2 | 2 | 2 | 2 | 0 | 2 | 2 | 12 |
| 7 | Ngày cưới hỏi 12/2026 | /xem-ngay-tot/cuoi-hoi-thang-12-2026 | 2 | 2 | 2 | 1 | 1 | 2 | 2 | 12 |
| 8 | Mua xe 1/2027 | /xem-ngay-tot/mua-xe-thang-1-2027 (noindex) | 1 | 2 | 2 | 1 | 1 | 2 | 2 | 11 |
| 9 | Ý nghĩa số chủ đạo 7 | /than-so/y-nghia-so/so-7 | 2 | 2 | 1 | 1 | 1 | 2 | 1 | 10 |
| 10 | Thái Dương ở Phu Thê | /tu-vi/sao-o-cung/thai-duong-cung-phu-the | 2 | 2 | 2 | 1 | 1 | 2 | 1 | 11 |
| 11 | Quẻ 29 Thuần Khảm | /kinh-dich/que/que-29-kham | 1 | 2 | 2 | 2 | 1 | 2 | 1 | 11 |
| 12 | WC giữa nhà | /phong-thuy/dau-hieu/nha-ve-sinh-o-giua-nha | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 12 |
| 13 | Sao hạn 2027 nam 1990 | /nam/2027/tuoi-1990 (+ /xem-sao-han/2027) | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 12 |
| 14 | Tử vi 2027 Canh Ngọ | /nam/2027/tuoi-1990 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 13 |
| 15 | 1/1/2027 tốt hay xấu | /xem-ngay-tot/2027-01-01 | 2 | 2 | 1 | 1 | 1 | 2 | 2 | 11 |
| | **Tổng** | | | | | | | | | **178/210 (85%)** |

## Câu trả lời mẫu (chỉ dựa trên chữ trong HTML)

1. **Sinh 1990 mệnh gì** — từ ~92–125 (khung "Trả lời nhanh"; chữ 27–90 là khung tác giả [ns]): "Người sinh năm 1990 (tuổi Canh Ngọ) mệnh Lộ Bàng Thổ (路旁土) — hành Thổ… Sinh trước Tết (27/01/1990) thì tính tuổi Kỷ Tỵ, mệnh Đại Lâm Mộc." → Người sinh năm 1990 tuổi Canh Ngọ, mệnh Lộ Bàng Thổ (đất ven đường), hành Thổ. Ai sinh trước Tết 27/01/1990 thì thuộc tuổi Kỷ Tỵ, mệnh Đại Lâm Mộc. http://localhost:3100/bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi
2. **Nữ 1990 hướng nhà** — mục lục ~từ 40–60: "Ví dụ sinh năm 1990 (Canh Ngọ): nam cung Khảm, hướng tốt nhất Đông Nam; nữ cung Cấn, hướng tốt nhất Tây Nam. Sinh trước Lập xuân (04/02) thì tính theo năm trước." + trang Cấn ~từ 30: "hợp 4 hướng: Tây Nam (Sinh Khí), Tây Bắc (Thiên Y), Tây (Diên Niên), Đông Bắc (Phục Vị)… Nên tránh: Đông Nam, Bắc, Đông, Nam." → Nữ sinh 1990 (sinh sau Lập xuân 04/02/1990) có cung phi Cấn, hợp Tây Nam, Tây Bắc, Tây, Đông Bắc; tốt nhất Tây Nam; nên tránh Đông Nam, Bắc, Đông, Nam. http://localhost:3100/phong-thuy/huong-hop-tuoi/cung-can-dong-bac
3. **Cung Khảm** — ~từ 28: "hợp 4 hướng: Đông Nam (Sinh Khí), Đông (Thiên Y), Nam (Diên Niên), Bắc (Phục Vị) — tốt nhất là Đông Nam. Nên tránh: Tây Nam, Đông Bắc, Tây Bắc, Tây." → kèm danh sách năm sinh nam/nữ có cung Khảm. http://localhost:3100/phong-thuy/huong-hop-tuoi/cung-kham-bac
4. **1985 làm nhà 2027** — từ 16–40: "Năm 2027 tuổi 43 không phạm Kim lâu, Hoang ốc xấu hay Tam tai. Người sinh năm 1985 (Ất Sửu) tính tuổi mụ 43 vào năm 2027." Hoang ốc "Nhất Cát" ~từ 75; "Nếu bạn sinh trước Tết thì tuổi âm thuộc năm trước" ~từ 100. http://localhost:3100/xem-tuoi-lam-nha/2027/tuoi-1985
5. **Xông đất 1988** — từ 16–60: "Gia chủ sinh năm 1988 (Mậu Thìn) đón Tết Đinh Mùi có thể nhờ người tuổi 1966 (Bính Ngọ), 1981 (Tân Dậu), 1980 (Canh Thân) xông đất. Nên tránh tuổi Sửu, tuổi Tuất và các tuổi Mão, Mùi, Hợi đang Tam tai. Mùng 1 Tết (6/2/2027) giờ hoàng đạo đầu tiên là Dần (03:00–04:59)." http://localhost:3100/tuoi-xong-dat/2027/tuoi-1988
6. **Tết 2027** — từ 13–40: "Năm âm lịch Đinh Mùi 2027 bắt đầu từ Tết ngày 06/02/2027 và kết thúc ngày 25/01/2028 (dương lịch), gồm 12 tháng, không có tháng nhuận." http://localhost:3100/lich-am/2027
7. **Cưới hỏi 12/2026** — từ 20–75: "có 4 ngày tốt cho cưới hỏi theo hoàng lịch: 06/12/2026 (âm 28/10, Giáp Dần), 17/12/2026 (…Ất Sửu), 20/12/2026 (…Mậu Thìn), 24/12/2026 (…Nhâm Thân). Đẹp nhất: 17/12/2026… hoàng đạo, trực Trừ." + "Danh sách chưa xét tuổi". http://localhost:3100/xem-ngay-tot/cuoi-hoi-thang-12-2026
8. **Mua xe 1/2027** — trang CÓ, `noindex, follow`, không có trong sitemap; từ 20–45: "có 0 ngày tốt cho mua xe, tài sản theo hoàng lịch: không có ngày nào đủ điều kiện — nên xem tháng kế tiếp." Máy trả lời tôn trọng noindex sẽ không dẫn trang này; phải dẫn sang /xem-ngay-tot/mua-xe-thang-2-2027.
9. **Số 7** — từ 77–100: "Trong thần số học Pythagoras, số 7 gắn với: Phân tích, chiều sâu, độc lập tư tưởng. Mặt tối cần để ý: Xa cách, hoài nghi thành lười tin, phân tích thay hành động." Ý "đường đời = mạch chủ đạo" ở ~từ 130. http://localhost:3100/than-so/y-nghia-so/so-7
10. **Thái Dương Phu Thê** — từ 94–150: "Kỳ vọng người bạn đời đàng hoàng, có danh dự; dễ bận việc ngoài mà ít thời gian cho nhà…"; sáng/hãm theo chi ở ~từ 255–320 ("sáng… Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi"; "hãm… Tý, Thân, Dậu, Tuất, Hợi"). http://localhost:3100/tu-vi/sao-o-cung/thai-duong-cung-phu-the
11. **Quẻ 29** — từ 88–110: "Quẻ Khảm (坎), quẻ số 29: hiểm hãm trùng trùng; giữ lòng thành (hữu phu) thì tâm thông…"; "Hiểu đơn giản" ~từ 137. Chữ "Thuần Khảm" / "Khảm Vi Thủy" KHÔNG có trong HTML (chỉ "Tập Khảm" ×6). http://localhost:3100/kinh-dich/que/que-29-kham
12. **WC giữa nhà** — từ 94–160: "…dấu hiệu phong thuỷ nhà ở nên xử lý trước. Quan niệm: trung cung là 'tim' nhà… hút yếu là ẩm và mùi đọng… Việc không tốn tiền: Luôn đóng cửa, lau khô sàn sau khi tắm, không phơi đồ trong đó." http://localhost:3100/phong-thuy/dau-hieu/nha-ve-sinh-o-giua-nha
13. **Sao hạn 2027 nam 1990** — /nam/2027/tuoi-1990 ô tóm tắt từ ~49 + "Trả lời nhanh" ~từ 95: "Sao theo tục: nam Thổ Tú, nữ Vân Hán"; hạn Ngũ Mộ ~từ 412. Trang /xem-sao-han/2027: dòng 1990 ở **từ 587** ("1990 Canh Ngọ 38 Thổ Tú hạn Ngũ Mộ…"), "Trả lời nhanh" chỉ nói chung. Hai trang khớp nhau.
14. **Tử vi 2027 Canh Ngọ** — từ 60–110: "Năm 2027 (Đinh Mùi), người tuổi Canh Ngọ sinh 1990 (mệnh Lộ Bàng Thổ) bước vào tuổi mụ 38. Điểm thuận: tuổi Ngọ lục hợp với năm Mùi. Điều nên để ý: làm nhà năm này: dân gian thường cân nhắc; can Đinh khắc can Canh. Sao theo tục: nam Thổ Tú, nữ Vân Hán." + "Xem năm 2027 theo ngày giờ sinh của bạn". http://localhost:3100/nam/2027/tuoi-1990
15. **1/1/2027** — từ 13–55: "Thứ Sáu, 1/1/2027 (âm lịch 24/11, ngày Canh Thìn) là ngày hắc đạo (Thiên Lao), trực Định — hợp ký kết, cưới hỏi, nhập trạch. Sách lịch ghi nên: cưới hỏi… Xung tuổi Giáp Tuất. Giờ hoàng đạo: Dần, Thìn, Tỵ, Thân, Dậu, Hợi." http://localhost:3100/xem-ngay-tot/2027-01-01

## Nhất quán giữa các trang (đã đối chiếu)

- Cung phi 1990: mệnh-theo-năm (nam Khảm / nữ Cấn, từ ~466) = mục lục `#tuoi-1990` (Khảm / Cấn) = trang Cấn (nữ 1990 có trong danh sách) = trang Khảm (nam 1990). **Khớp.**
- Tam tai 2027 = Hợi, Mão, Mùi: /nam/2027, /tuoi-xong-dat/2027, /tuoi-xong-dat/2027/tuoi-1988, danh sách 9 tuổi làm nhà ở /xem-tuoi-lam-nha/2027 (không có tuổi Hợi/Mão/Mùi). Trang mệnh 1990: Tam tai Ngọ = 2028–2030. **Khớp.**
- Sao hạn 1990: /xem-sao-han/2027 (Thổ Tú, Ngũ Mộ / Vân Hán, Ngũ Mộ) = /nam/2027/tuoi-1990. Hoang ốc 38 = Ngũ Thọ Tử ở cả /nam/2027/tuoi-1990 và /xem-tuoi-lam-nha/2027/tuoi-1990. **Khớp.**
- Tết 2027 = 06/02/2027 ở /lich-am/2027, /nam/2027, /tuoi-xong-dat/2027. **Khớp.**
- **KHÔNG khớp**: /xem-ngay-tot/2027-01-01 nói "hợp… cưới hỏi", "Sách lịch ghi nên: cưới hỏi", nhưng /xem-ngay-tot/cuoi-hoi-thang-1-2027 không có ngày 01/01 (lý do có trong HTML ngày: mục kiêng gồm "Nạp thái, Kết ước" — nhưng không được nói ra).

## URL cũ

| URL | Kết quả |
|---|---|
| /phong-thuy/huong-hop-tuoi/tuoi-1990 | 308 → /phong-thuy/huong-hop-tuoi#tuoi-1990 (một bước, đích 200) |
| /phong-thuy/tuoi-1990-nu | 308 → /phong-thuy/huong-hop-tuoi#tuoi-1990 (một bước) |
| /phong-thuy/huong-hop-tuoi/tuoi-1990-nu, /phong-thuy/tuoi-1990-nam | 308 → cùng đích, một bước |
| /phong-thuy/tuoi-1990-nu.md | 308 → /phong-thuy/huong-hop-tuoi.md |
| /kien-thuc/menh-tuoi/sinh-nam-1990-menh-gi | 308 → /bat-tu/menh-theo-nam/… (một bước) |
| /huong-xau-nam/2027, /kham-pha | 308 một bước |

Ghi chú: đích `#tuoi-1990` mất thông tin giới tính (bản -nu/-nam cũ trỏ cùng một dòng) — chấp nhận được vì dòng có cả hai cột.

## llms.txt

- 12.469 byte (≤ 15 KB ✔). Cấu trúc tốt: công cụ, mùa Tết 2027, "Trả lời nhanh theo câu hỏi hay gặp", thư viện có số trang + ví dụ. Mọi link thật (≈ 60) trả 200 + `index, follow`.
- Lỗi nhỏ: URL viết trần trong câu, dính dấu câu ngay sau — `…/cung-kham-bac: 4 hướng tốt` và `…/tuoi-xong-dat/2027/tuoi-1990;` → bộ tách URL đơn giản lấy cả `:` / `;` → 404. Mẫu `{1950…2027}`, `{sao}-cung-{cung}`, `tuoi-{năm sinh}` cũng bị bóc như URL → 404 (nên ghi rõ "dạng" bằng mã inline hoặc ví dụ thật).
- Ví dụ "trang từng ngày dạng …/2026-11-03" là ngày dựng tệp — sẽ cũ; nên ghi mẫu `{yyyy-mm-dd}` + một ví dụ trong cửa sổ.
- Gợi ý "ngày tốt mua xe…" không cảnh báo tháng 0 ngày là noindex.

## Vấn đề (xếp theo mức nghiêm trọng)

1. **[Cao] Mâu thuẫn ngày 01/01/2027 ↔ danh sách cưới hỏi tháng 1/2027.** /xem-ngay-tot/2027-01-01 "Trả lời nhanh" (từ 13–40): "ngày hắc đạo (Thiên Lao), trực Định — hợp ký kết, cưới hỏi…", trong khi /xem-ngay-tot/cuoi-hoi-thang-1-2027 không liệt kê 01/01. AI ghép hai nguồn sẽ ra câu trái nhau. Đề xuất: câu đầu trang ngày phải nêu kết luận theo cùng luật chọn ngày ("không vào danh sách cưới hỏi vì sách ghi kiêng Nạp thái, Kết ước") và bỏ "cưới hỏi" khỏi lời trực khi bị kiêng.
2. **[Cao] "Ngày tốt cưới hỏi" có ngày hắc đạo mà câu trả lời không nói.** /xem-ngay-tot/cuoi-hoi-thang-12-2026: 06/12 và 20/12 là "Thiên Lao" (hắc đạo) nhưng "Trả lời nhanh" gộp chung "4 ngày tốt". Câu cắt ra dễ bị người đọc bắt lỗi. Đề xuất: ghi "(hoàng đạo)" / "(hắc đạo nhưng sách ghi nên cưới)" cạnh từng ngày trong câu đầu.
3. **[Trung bình] Trang ngày không trả lời "tốt hay xấu".** /xem-ngay-tot/2027-01-01: câu đầu chỉ liệt kê "hắc đạo… hợp…". Đề xuất một câu kết luận một vế ("Ngày trung bình: hắc đạo nhưng trực Định; hợp …, kiêng …").
4. **[Trung bình] Quẻ 29 thiếu tên gọi phổ biến.** /kinh-dich/que/que-29-kham không có "Thuần Khảm" / "Khảm Vi Thủy" ở đâu (chỉ "Tập Khảm"). Truy vấn tên thường gọi khó khớp. Đề xuất: thêm tên đầy đủ (Thuần Khảm, Khảm vi Thủy) vào H1/câu đầu cho cả 64 quẻ (Bát Thuần Càn, Thủy Lôi Truân…).
5. **[Trung bình] /xem-sao-han/2027 — câu trả lời nằm ở từ 587.** "Trả lời nhanh" chỉ nói sao hạn là tập quán; người hỏi theo tuổi phải đọc bảng. Đề xuất: câu đầu nêu 2–3 ví dụ cụ thể (vd "nam 1990 Thổ Tú, nữ 1990 Vân Hán") và mỗi dòng bảng có `id="tuoi-1990"` như mục lục hướng hợp tuổi; dẫn sang /nam/2027/tuoi-{năm}.
6. **[Trung bình] "Giao thừa 25/01/2028" ở /nam/2027 (bảng "Thông tin năm 2027", ~từ 50).** Người Việt hỏi "giao thừa 2027" nghĩa là đêm 05/02/2027. Đề xuất: đổi nhãn "Ngày cuối năm âm (giao thừa sang 2028)" và thêm "Giao thừa đón Tết 2027: đêm 05/02/2027". Cùng bảng: "Hợp năm Tuổi Mão, Ngọ, Hợi" đứng gần "Tam tai Tuổi Hợi, Mão, Mùi" — AI dễ trích thành mâu thuẫn; nên thêm một câu giải thích.
7. **[Trung bình] Số 7 — câu trả lời mỏng, không tự đứng cho "số chủ đạo 7".** /than-so/y-nghia-so/so-7 "Trả lời nhanh" ~25 chữ, dạng danh sách từ khoá ("gắn với: Phân tích, chiều sâu…"), không nói số 7 khi là Đường đời/số chủ đạo. Đề xuất 2 câu hoàn chỉnh: "Người có số chủ đạo (đường đời) 7 thường… ; mặt tối… ; nghề/tình yêu xem …".
8. **[Thấp] CTA và chú thích hình không nằm trong data-nosnippet.** Ví dụ /bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi ~từ 985: "Đọc chung chung chỉ là điểm bắt đầu. Xem con số, lá số của chính bạn… Xem của tôi" nối liền ngay sau câu FAQ; /nam/2027 ~từ 135 "Xem năm 2027 của tôi"; /tuoi-xong-dat/2027 ~từ 60 "Rủ nhà khác xem tuổi xông đất". Chú thích hình (vd "Số 7 trong thần số học", "Sao Thái Dương (太陽) ở cung Phu Thê — vòng 12 cung Tử vi") lặp tiêu đề ngay trước khung QR. QR "Quét để mở bài này" và khung tác giả ĐÃ được che đúng. Đề xuất: bọc khối mời giữa/cuối trang + chú thích hình bằng `data-nosnippet`.
9. **[Thấp] Câu chữ rơi vụn khi cắt.** /xem-tuoi-lam-nha/2027/tuoi-1985 câu đầu "Năm 2027 tuổi 43 không phạm…" chưa nêu 1985 (câu sau mới nêu); /nam/2027/tuoi-1990 "Điều nên để ý: làm nhà năm này: dân gian thường cân nhắc; can Đinh khắc can Canh" (hai dấu hai chấm); /tu-vi/sao-o-cung/thai-duong-cung-phu-the "hành Hoả: quý tinh: rộng rãi"; "có 0 ngày tốt" ở trang mua xe. Đề xuất đảo câu để năm sinh đứng trước, bỏ dấu hai chấm lồng nhau, trang 0 ngày nêu luôn ngày đẹp nhất của tháng sau.
10. **[Thấp] llms.txt** — URL dính dấu câu (`cung-kham-bac:`, `tuoi-1990;`), mẫu `{…}` bị bóc thành URL 404, ví dụ ngày cố định 2026-11-03 sẽ cũ.

Điểm sáng: robots mở đúng bot trả lời, chặn bot huấn luyện; canonical tự trỏ trên mọi trang đã xem; noindex đúng ở tháng 0 ngày (và bị loại khỏi sitemap); 308 một bước cho mọi URL cũ; mốc Tết/Lập xuân có trong câu trả lời của trang mệnh, hướng hợp tuổi, cung phi; dữ kiện (cung phi, Tam tai, sao hạn, Hoang ốc, Tết) nhất quán giữa các trang.
