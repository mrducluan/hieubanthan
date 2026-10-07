# Rà soát engine hỏi đáp 5 mảng — 2026-10-07

## Cách rà soát

Kho câu cũ (2.023 câu thần số, 2.031 câu huyền học) đã **bão hoà**: huyền học 100%, thần số 90%. Nhưng kho chỉ chấm
"có căn cứ / đúng lĩnh vực", không chấm **nội dung có đúng câu được hỏi không**.

Vì vậy em viết một bộ **55 câu mới** theo cách người dùng thật hay hỏi. Bộ này viết sau bộ định tuyến, có câu không dấu,
có câu kèm lời dẫn, có câu hỏi vị trí sao. Em chạy từng câu qua engine với một lá số cố định, đọc từng câu trả lời, rồi
**đối chiếu tay** với dữ liệu đã tính. Ca mẫu: nam 17/05/1990 giờ Ngọ; thần số Nguyễn Đức Luân 24/10/1988.

**Phần tính toán: đúng.** Các mục đã kiểm tay gồm:
- tứ trụ, đại vận, thập thần;
- tứ hoá Canh;
- Tuần/Triệt Canh Ngọ;
- cung phi Khảm (nam 1990) và Đoài (nữ 1992);
- Ngũ Hoàng, Thái Tuế, Tam Sát 2026/2027;
- Kim Lâu, Hoang Ốc tuổi 38;
- năm, tháng, ngày cá nhân;
- quẻ 10 từ hào 778779.

**Lỗi nằm ở tầng hiểu câu hỏi**: câu được trả lời "có căn cứ" nhưng **lạc đề**. Riêng Tử vi có thêm một chỗ thiếu sót
chuyên môn (Tuần/Triệt) ở bước dựng lá số gọn.

## Phát hiện và đã sửa

| Mảng | Lỗi phát hiện | Đã sửa |
|---|---|---|
| Kinh Dịch | "Quẻ Thuỷ Hoả Ký Tế nghĩa là gì", "quẻ số 64", "quẻ Càn hào 5" → engine **gieo quẻ mới** (ra quẻ Lý) thay vì tra quẻ được hỏi | Nhận tên đầy đủ 64 quẻ (thượng tượng + hạ tượng + tên, "Thuần X"), số quẻ, hào (số hoặc Sơ/Nhị…/Cửu Ngũ) → tra đúng quẻ và lời hào |
| Kinh Dịch | "Quẻ Truân có nên đầu tư không" → gieo quẻ khác | Đã nêu quẻ + hỏi quyết định → đọc chính quẻ đó |
| Kinh Dịch | "Mai hoa khác gì gieo đồng xu" → gieo quẻ | Thành câu kỹ thuật, KB bổ sung khác biệt cách ra quẻ |
| Tử vi | "Hoá Kỵ / Thiên Mã / Thái Âm của tôi ở cung nào" → trả lời chung về cung Mệnh | Loại câu mới **định vị sao**: tìm sao trên lá số, nêu cung, độ sáng, sao đồng cung, rồi nghĩa của sao tại đúng cung đó |
| Tử vi | **Tuần/Triệt chỉ ghi một cung** (iztro), bỏ sót Tuần đóng tại cung Mệnh | Bổ sung cung thứ hai theo cặp chi; áp dụng cho cả hỏi đáp và luận giải |
| Tử vi | "Lá số có cách cục gì" → đọc cung Mệnh | Liệt kê cách cục nhận diện được (62 cách), nói rõ khi không có |
| Tử vi | "Sát tinh chiếu mệnh không" → đọc cung Mệnh | Xét tam phương tứ chính (Mệnh, Tài, Quan, Di): lục sát + Hoá Kỵ, nêu từng sao |
| Tử vi | "Thân cư cung nào" | Trả lời thẳng cung Thân, Mệnh chủ, Thân chủ |
| Tử vi | "Mua đất / làm nhà năm sau" không gắn cung | → cung Điền Trạch |
| Tử vi | "Tháng 3 âm năm sau" → im lặng đưa bức tranh cả năm | Nói rõ chưa luận lưu nguyệt, rồi mới đưa cả năm |
| Bát tự | "Có Đào Hoa / quý nhân không" → trả lời nhật chủ | Đọc **thần sát đã tính**, nói rõ sao nào không có |
| Bát tự | "Tứ trụ có xung hợp gì" → trả lời nhật chủ | Liệt kê hợp, xung, hình, hại, phá, ngũ hợp can |
| Bát tự | "Có cách cục gì" → trả lời ngũ hành | Trả lời cách cục Tử Bình Chân Thuyên kèm hỷ/kỵ |
| Bát tự | Hỏi dụng thần, khối dụng thần nằm cuối | Đưa lên đầu |
| Phong thuỷ | "Bếp đặt hướng nào", "đầu giường hướng nào" → câu chung về Sinh Khí | Nguyên tắc "toạ hung hướng cát" cho bếp, đầu giường theo Thiên Y/Diên Niên/Phục Vị, đều dùng hướng của chính người hỏi |
| Phong thuỷ | "Gương đối diện cửa chính" → trả lời gương đối diện **giường** | Thêm mục KB riêng, sửa từ khoá |
| Phong thuỷ | "Nhà hướng Đông Bắc vận 9" → **không trả lời** | Nối vào bộ tính Huyền Không đã có: 3 sơn của hướng, cục từng sơn, nghĩa cục |
| Phong thuỷ | "Vợ tôi sinh 1992 chọn hướng theo ai" → câu chung | Tính mệnh quái người kia, so nhóm Đông/Tây tứ mệnh |
| Thần số | "Tôi có hợp làm sếp không", "mẹ bỉm hai con hợp nghề gì" → bị hiểu là **hợp đôi**, đòi ngày sinh người kia | Câu "hợp làm/hợp nghề" là câu sự nghiệp |
| Thần số | "Ngày 15 tháng sau có nên ký" → không tính ngày đó, tháng cá nhân lấy tháng hiện tại | Tính đúng ngày cá nhân và tháng cá nhân của ngày được hỏi |
| Thần số | "Số 13 có phải số xui" → trả lời tính cách bản thân | Thêm giải thích "không có số xui" và nợ nghiệp 13/4 |
| Thần số | "Số 7 và số 4 làm ăn chung" → gắn số 7 là "của bạn" | Ghi "người thứ nhất/thứ hai", thêm góc "trong vai đồng nghiệp/sếp/gia đình" |
| Thần số | Chân dung (mới thêm) chen trước khối biểu đồ khi hỏi về biểu đồ ngày sinh | Giữ khối kỹ thuật lên đầu |

Bộ 55 câu nay thành test hồi quy cố định: `engine/tests/test_hoi_dap_chuyen_gia.py` (38 ca). Test kiểm **nội dung**
câu trả lời khớp dữ liệu, không chỉ kiểm có trả lời.

## Số đo

| | Trước | Sau |
|---|---|---|
| Thần số — đúng lĩnh vực (2.023 câu) | 90,21% | 90,41% |
| Huyền học — có căn cứ (4 mảng, 2.031 câu) | 100% | 100% (không lùi) |
| Bộ chuyên gia mới (nội dung đúng) | ~20/55 câu lạc đề | 38/38 ca đạt |
| Engine toàn bộ | 2.159 test | 2.197 test đạt |

## Còn thiếu, chưa làm (đề xuất)

1. **Tử vi lưu nguyệt (từng tháng).** Các phái tính tháng hạn khác nhau (Đẩu quân, tháng theo tiểu hạn…). Cần anh
   chốt phái trước khi làm.
2. **Tử vi khoảng 66 sao (iztro) so với ~110 sao sách Nam phái.** Hỏi về sao chưa an thì engine nói thẳng "chưa an
   sao này".
3. **Phong thuỷ "vợ chồng sinh X và Y" (hai năm trong một câu).** Vẫn hỏi lại để rõ ai là chồng, ai là vợ. Chỉ tính
   khi câu nói rõ "vợ tôi sinh…".
4. **Thần số: còn ~9,6% câu lệch lĩnh vực** so với nhãn. Phần lớn là câu nằm giữa hai lĩnh vực (vd "Ngày nào hợp ký
   hợp đồng": thời vận hay sự nghiệp). Nên chạy vòng `thanso-tu-cai-thien` riêng.
5. **Lời văn LLM.** Bộ test chỉ chạy chế độ template. Khi bật OpenRouter, lớp kiểm "số lạ / cụm cấm" vẫn chặn được,
   nhưng nên chạy thử bộ 55 câu với LLM thật trước khi mở công khai.
