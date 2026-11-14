# Kế hoạch nạp hết nội dung có ích của sách xưa (SX-C)

Ngày 14/11/2026. Chủ dự án chốt: **lấy hết nội dung có ích** của các sách đã có kho nguồn, cho cả bốn môn (Nhân tướng,
Phong thuỷ, Tử vi, Bát tự) — không chỉ câu trung tính. Câu sách đoán nặng vẫn đưa vào, nhưng **hệ thống không tự phán**:
nói "sách xưa có nhắc…, hàm ý…", nói giảm, nói vòng, và luôn kèm một việc giữ gìn.

Khâu của vòng tăng trưởng: QUAY LẠI + NẠP Sao (bài đọc dày hơn, có chỗ dựa sách) và THU HÚT (trang kiến thức có nguyên văn).
Đo: số mục "sách xưa ghi" theo môn (`scripts/kiem_sach_ghi.py`), tỉ lệ "Đúng với mình" của các hộp mới, hiển thị / nhấp
Search Console các trang có mục "Sách xưa ghi".

## 1. Ba nhóm câu sách

| Nhóm | Sách nói gì | Cách đưa lên trang |
|---|---|---|
| **A** | Khen, mô tả, phân loại, dặn dò | Nói nguyên ý: "Sách xưa ghi «…» — …" |
| **B** | Chê chuyện tiền, việc, tính nết, quan hệ, thế nhà | "Sách xưa ghi «…» — … Nên chú ý …" + một việc cụ thể (như CY-1) |
| **C** | Đoán thọ / yểu, bệnh, hình khắc cha mẹ – vợ chồng – con, chuyện con cái, phẩm hạnh theo giới | "Sách xưa có nhắc «…». Hàm ý theo ghi chép xưa: …" — nói giảm; kèm việc giữ gìn; cuối khối có câu "Đây là ghi chép của người xưa… không phải lời đoán riêng cho bạn" |

Giữ nguyên, không đổi theo đợt này:

- **Câu hỏi trực tiếp** "tôi sống tới bao nhiêu tuổi", "năm nào tôi mất", "tôi có bị <tên bệnh> không": vẫn đi nhánh riêng
  (không số tuổi, không xác nhận bệnh). Sách không có phép tính nào ra số tuổi; nói ra một con số là bịa.
- **Câu khủng hoảng** luôn ưu tiên lời hỗ trợ.
- **Bùa trấn** (quyển 678 Dương Trạch Thập Thư): chỉ ghi nhận là sách có quyển này, không chép hình bùa, không hướng dẫn làm.
- Nhóm C **không** lên: tiêu đề hộp, câu tóm tắt chương, "Điều quan trọng nhất", thẻ chia sẻ, thông báo đẩy, lời nhắc AI;
  không hiện cho người dưới 18 tuổi (khi biết tuổi).

## 2. Bảng nói giảm (bắt buộc — bộ kiểm chặn từ ở cột trái)

| Chữ trong sách | Không viết | Viết |
|---|---|---|
| 夭, 壽短, 不壽 | yểu, chết sớm, tổn thọ | "sách gắn với sức bền về lâu dài chưa dày", "nên giữ sức và đi khám định kỳ" |
| 壽, 長壽 | (khen thọ thì viết được) | "người xưa xem là dấu của sức bền, tuổi già khoẻ" |
| 死, 亡, 惡死 | chết, chết dữ | "sách xếp vào dấu cần cẩn thận hơn về an toàn", "nên tránh việc liều" |
| 剋父母, 妨父母 | khắc cha mẹ, mồ côi | "duyên nương tựa cha mẹ mỏng hơn", "sớm tự lập", "nên chủ động vun với cha mẹ" |
| 剋妻, 剋夫, 妨夫 | khắc vợ / chồng, sát phu | "đường vợ chồng cần vun nhiều hơn người", "dễ lệch nhịp nếu không nói chuyện" |
| 剋子, 絕嗣, 無子 | khắc con, tuyệt tự, không con | "đường con cái sách ghi là đến muộn hoặc phải bỏ nhiều công", "mong con thì nên đi khám sớm" |
| 兄弟不足, 兄弟幾人 | đếm số anh em | "anh em ít dựa được nhau", "mỗi người một nơi" (không nêu con số) |
| 淫, 淫蕩, 好色 | dâm, lăng loàn | "đào hoa", "đa tình", "tình cảm nhiều ngả — nên rõ ràng trong quan hệ" |
| 賤, 下賤 | hạ tiện, hèn | "vất vả", "phải tự thân làm nhiều", "ít được nâng đỡ" |
| 貧, 窮, 破財, 破家 | nghèo hèn, phá sản | "tiền bạc lúc đầu chật", "của khó giữ — nên có khoản để dành tự động" |
| 牢獄, 官非, 訟 | tù tội | "dễ vướng chuyện giấy tờ, tranh chấp — nên làm gì cũng có văn bản; cần thì hỏi luật sư" |
| 疾, 病, 眼疾, 殘疾 | tên bệnh, tàn tật | "sách gắn với <bộ phận / hệ cơ quan>; nên chăm phần này và đi khám định kỳ" |
| 凶, 大凶, 禍 | đại hung, tai hoạ | "nên cẩn thận hơn", "sách xếp vào điều nên tránh" |
| 孤, 寡, 孤獨 | goá, cô độc suốt đời | "dễ thấy một mình", "nên chủ động giữ các mối thân" |
| 奸, 詐, 毒 | gian, độc ác | "tính toán kỹ", "kín", "nên thẳng thắn hơn để người khác dễ tin" |
| (mọi câu) | "bạn sẽ…", "chắc chắn…", "số bạn…" | "sách gắn với…", "người xưa xem là…", "hàm ý…" |

Lời `y` viết đời thường, câu ngắn, không thuật ngữ. `viec` là việc nhỏ làm được trong tuần, không vật phẩm, không cúng lễ.

## 3. Khuôn dữ liệu và bộ kiểm

Một khuôn cho mọi môn — `engine/app/kb/sach_ghi.py` (mô tả trường ở đầu tệp), kiểm bằng:

```bash
cd engine && PYTHONPATH=. .venv/bin/python scripts/kiem_sach_ghi.py app/kb/data/<tệp>.json
```

Bộ kiểm bắt: câu Hán không có trong kho nguồn; câu có chữ nặng mà gắn nhóm A; nhóm B / C thiếu "nên chú ý" hoặc việc;
chủ đề sức khoẻ thiếu ý đi khám; lời Việt còn từ chưa nói giảm (bảng mục 2); lời Việt lẫn chữ Hán.

## 4. Các đợt

| Đợt | Môn | Nội dung | Kho nguồn | Trạng thái |
|---|---|---|---|---|
| 1a | Phong thuỷ | Quy tắc bố trí theo 8 cung mệnh (nhà, cửa, lối đi, giếng, bếp, cối, chuồng, thoát nước) | Dương Trạch Thập Thư q.1 | đợt này |
| 1b | Phong thuỷ | Các điều "phàm trạch…" về thế đất, đường, nước, cây, cửa + thiên nội hình | Dương Trạch Thập Thư q.1, q.3 | đợt này |
| 2a | Nhân tướng | Câu sách cho các nét tướng còn thiếu (kể cả nhóm B, C) + 12 cung trên mặt | Thần Tướng Toàn Biên q.1–4 | đợt này |
| 2b | Nhân tướng | 117 kiểu hình: mày, mắt, mũi, tai, miệng | Thần Tướng Toàn Biên q.3–4 | đợt này |
| 3a | Tử vi | 14 chính tinh × 12 cung theo sách | Toàn Thư q.3 | đợt này |
| 3b | Tử vi | 9 phụ tinh × 6 cung người thân, thân thể (trước đây bỏ) | Toàn Thư q.3 | đợt này |
| 4 | Bát tự | Thần sát khó, lục thân, tính tình, nữ mệnh, bệnh — phần trước đây bỏ | Tam Mệnh Thông Hội, Uyên Hải Tử Bình | đợt này |
| 5 | Nhân tướng | Khí sắc theo vùng, theo mùa, theo việc (117 mục) | Thần Tướng Toàn Biên q.13–14 | sau |
| 6 | Nhân tướng | Cách cục phú, quý, thọ, thành bại; xương thịt, dáng đi, ngồi, nằm, ăn; hình giống chim thú | Thần Tướng Toàn Biên q.3, q.5, q.11–12 | sau |
| 7 | Phong thuỷ | Mở cửa, thước cửa, thoát nước 24 sơn, xuyên cung cửu tinh, chọn ngày khởi công | Dương Trạch Thập Thư q.2–3 | sau |
| 8 | Nhân tướng | Liễu Trang (sau khi so mẫu với bản quét) | database chủ dự án | sau |
| 9 | Bàn tay | Mảng riêng — mục 5 | Thần Tướng Toàn Biên q.10 | kế hoạch |

## 5. Mảng bàn tay (chỉ tay, vân tay) — làm riêng

Thần Tướng Toàn Biên quyển 10 có 102 mục về bàn tay (luận tay, ngọc chưởng đồ, 70+ loại vân). Không trộn vào Nhân tướng mặt:

- **URL**: trang trụ `/chi-tay` (công cụ: người dùng tự soi bàn tay theo hình hướng dẫn, chọn loại vân mình có) + cụm kiến thức
  `/chi-tay/duong-chi` (các đường chính) và `/chi-tay/van-tay` (các loại vân trong sách). Bản tiếng Anh: `/en/palm-reading`.
- **Dữ liệu**: KB `chi_tay_kb.json` theo đúng khuôn mục 3; câu sách lấy ở quyển 10 (đã có trong kho nguồn).
- **Cần thêm trước khi làm**: hình vẽ bàn tay để người dùng đối chiếu (ảnh đồ hình cổ trong bộ database của chủ dự án — thư mục
  `assets/diagrams` chưa tải lên, có 19 hình bàn tay; hoặc vẽ SVG mới); bộ câu hỏi tự quan sát; đăng ký sổ trang, thanh
  mảng, menu, sitemap.
- **Ranh giới như Nhân tướng**: chỉ xem tay của chính mình; ảnh bàn tay nếu có chụp thì không rời máy; không điểm số.
- **"Vân tay" (dấu vân đầu ngón) kiểu sinh trắc học hiện đại** không có trong cổ thư và là dữ liệu sinh trắc → không làm;
  "vân tay" ở đây là các đường vân trong lòng bàn tay mà sách chép.

## 6. Nơi hiển thị

| Môn | Bài đọc | Hỏi đáp | Trang kiến thức |
|---|---|---|---|
| Nhân tướng | Chương mới "Sách xưa ghi gì về các nét của bạn" + dòng sách ở "Vì sao nói vậy" | theo bộ vị | trang bộ vị: câu sách + kiểu hình |
| Phong thuỷ | "Nhà của bạn": chương "Sách xưa dặn người cung …" | mệnh quái, dấu hiệu | 8 trang cung phi, trang dấu hiệu |
| Tử vi | Khối "Sách xưa nói gì về lá số của bạn" mở cho cả câu nhóm B, C | sao ở cung | trang sao ở cung |
| Bát tự | như trên | thần sát, lục thân | trang thập thần |
