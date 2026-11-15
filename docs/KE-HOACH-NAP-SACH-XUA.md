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
| 疾, 病, 眼疾, 殘疾 | tàn tật, "sẽ bị / dễ mắc <bệnh>" | "sách gắn với <bộ phận>; nên khám để sớm nhận ra chứng … hay gặp ở phần này" (tên chứng thường gặp ĐƯỢC nêu — SX-C2; bệnh hiểm nghèo thì không) |
| 胎, 產, 墮胎, 難產 | sảy thai, khó sinh, hao người | "lúc mang thai, sinh nở cần giữ gìn kỹ; khám thai đúng lịch, sinh ở cơ sở y tế" (SX-C2: thai sản được nói, không đoán kết quả của thai) |
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
| 9 | Bàn tay | Mảng riêng — mục 5 | Thần Tướng Toàn Biên q.10 | xong (bản đầu, 15/11) |

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

## 7. Trạng thái (cập nhật 15/11/2026, sau chỉ tay)

| Việc | Trạng thái |
|---|---|
| Khuôn + bộ kiểm `kb/sach_ghi.py`, script `scripts/kiem_sach_ghi.py`, test `tests/test_sx_c_sach_ghi.py` | xong |
| Quy tắc SX-C trong `CLAUDE.md` (kèm câu nối ở quy tắc sức khoẻ) | xong |
| Tử vi: 434 câu Toàn Thư (sao × cung) → khối trên lá số | xong |
| Bát tự: 117 câu (thần sát, thập thần, lục thân, tính nết, thân thể) → khối trên lá số | xong (phần lục thân chưa hiện — cần phép tính vượng / suy của sao chỉ người thân) |
| Nhân tướng: 61 câu theo nét + 12 cung, 119 kiểu hình, 216 câu Liễu Trang → bài đọc + hỏi đáp | xong (trang kiến thức bộ vị chưa hiện kiểu hình) |
| Phong thuỷ: 116 điều thế nhà + 73 điều theo cung mệnh → mệnh quái + khảo sát nhà | xong |
| Dương Trạch Tam Yếu + Bát Trạch Minh Kính (tóm ý): 20 nguyên tắc, 64 nhà, 64 bếp, 68 điều Minh Kính; du niên 128/128 khớp engine | xong — khối "Cửa, phòng chính và bếp" ở khảo sát nhà |
| Tarot: nguồn Papus 1892 (78 lá), Case 1920 (22 ẩn chính), Ouspensky 1913 (22 ẩn chính); 144 câu trích; sửa 22 lời Marseille + 2 lời B.O.T.A. theo nguồn | xong |
| Lớp phủ đồ hình `/nhan-tuong/do-hinh`: 6 bản khắc (12 cung, 13 bộ vị, lưu niên, nốt ruồi nam / nữ, tam đình lục phủ), 233 điểm đo trên ảnh thật | xong |
| Hỏi đáp Tử vi / Bát tự / Phong thuỷ dùng lớp sách mới (SX-H) | xong — `hoidap/sach_ghi_hoi.py`: ≤ 2 câu theo chủ đề + phạm vi câu hỏi, không vào gói gửi AI; độ phủ đo bằng `scripts/do_sach_ghi_hoi.py` (Tử vi ~45 %, Bát tự 43–60 %, Phong thuỷ ~63 % câu về bản thân) |
| QC 15/11: câu khoanh địa chi chỉ hiện ở cung đúng chi; Bát tự chỉ điều kiện kiểm được; Tam Yếu nói giảm "chịu thiệt / sa sút" (~80 câu); thai sản, tên chứng hay gặp dạng gợi ý (SX-C2) | xong |
| Khí sắc (Toàn Biên quyển 13–14) | xong (SX-D) — 6 nét sắc mặt / ánh mắt của khảo sát có câu sách: sáng nhuận, xỉn tối, khô sạm, ba thứ sắc vàng / trắng / đỏ "còn khí – kém" (nhóm C, kèm đi khám), thần gấp; lời dặn xem sắc lúc sáng sớm. Phép "đoán ngày theo sắc từng bộ vị" (khí sắc xuất một) không nạp — toàn câu đoán việc, không có dữ kiện để chọn |
| Xương thịt – dáng – ngũ hình – giọng (Toàn Biên quyển 1, 3, 5, 10) | xong (SX-D) — 14 nét khảo sát: xương thịt (相骨肉), dáng đi / ngồi (相行論, 相坐), ngũ hình Kim Mộc Thuỷ Hoả Thổ (五行象說), giọng (論聲). Không nạp: phép so dáng với cầm thú ("rùa đi, rắn đi…" — đoán tính nết thô), "hình có dư / không đủ" (đoán thọ yểu cả bài) |
| Cách cục tướng (quyển 3: các "格") | chưa làm — phương án đề xuất ở mục 8 (chờ anh duyệt) |
| Dương Trạch Thập Thư phần còn lại | xong (SX-D) — mở cửa (cửa là chỗ khí ra vào, đổi cửa là việc lớn, tránh thứ đâm thẳng), thước Lỗ Ban (mục bố trí mới `thuoc_lo_ban`, hỏi đáp "kích thước cửa" không còn rơi sang hướng cá nhân), thoát nước (xem nước trước, nước sân một lối), bếp (火唵說, kèm khối "Cửa, phòng chính và bếp"), chia khu nhiều cửa (chung cư). Không nạp: chọn ngày sửa cửa, bùa trấn (quyển 678), phép xuyên cung theo tầng |
| Bàn tay `/chi-tay` (mục 5) | xong (bản đầu) — một trang `/chi-tay`: đồ hình «八卦十二宮圖» (Liễu Trang, 18 điểm đo trên bản khắc, câu Ngọc Chưởng Ký cho tám cung) + 67 hình vân quyển 10 (ảnh cắt từ trang sách, bài thơ nguyên văn, lời SX-C) + công cụ tự chọn vân → lời sách (chưa rõ tuổi / dưới 18 không có nhóm C). 5 hình sách đoán phẩm hạnh người vợ không đưa vào. Chưa làm: cụm trang con từng vân, hỏi đáp chỉ tay, bản tiếng Anh, đồ hình «三公奇紋» / «富貴奇紋» (chữ khắc mờ, không đọc chắc) |
| Bản tiếng Anh của lớp sách | chưa làm (khối chỉ có ở bản Việt) |
| Soát dấu câu các kho Wikisource nạp trước (Băng Giám, Tăng San Bốc Dịch, Cốt Tuỷ Phú) | xong (15/11) — `scripts/bo_dau_cau_kho_nguon.py` bỏ dấu câu thời nay ở 24 kho nguồn chữ Hán (Wikisource + bản điện tử hiện đại); test `test_kho_nguon_khong_dau_cau.py` chặn nạp lại còn dấu câu; mọi phép so khớp đi qua `sach_ghi.chuan` |
| Bộ nạp `nap_co_kim_do_thu.py` làm rơi đoạn | xong (15/11) — chữ trần ngoài `<p>` (chỗ ngắt trang + biểu tượng «考證») nay được đọc; nạp lại ba sách lấy thêm ~25 đoạn bị rơi (猴口, 八方坑坎歌, «眼上露堂», «坎巽二方房屋高大極富貴之兆»…); bỏ hai bản vá tay; test HTML mẫu không cần mạng |

Ghi chú khi dùng:

- Phiên âm Hán Việt chỉ hiện ở mục nhóm A; nhóm B / C chỉ hiện chữ Hán (âm của câu nặng đọc lên vẫn nặng).
- Trong 434 câu Tử vi, mọi câu ở cung Huynh Đệ, Tử Nữ và phần lớn Phụ Mẫu, Tật Ách mang nhóm C kể cả khi sách nói điều
  tốt (bộ kiểm không cho chữ 克 / 刑 / 災 vào nhóm A) — nên khuôn hiển thị là "Hàm ý theo ghi chép xưa" dù ý tích cực.
- Kho Toàn Thư có chữ ngờ chép sai ở vài ô (vd `羊玲` / `羊铃` cho Kình Dương – Linh Tinh); các ô ấy đã tránh hoặc ghi rõ.
  Danh sách ở báo cáo của từng đợt soạn, cần người rành đọc lại khi duyệt.

## 8. Cách cục tướng (Toàn Biên quyển 3) — phương án đề xuất

Quyển 3 có ~50 thiên "格" (富格例, 大富格, 貴格例, 壽相格, 福德格例, 聰明, 穩厚, 伎巧, 勞碌格, 貪食格, 孤格, 刑剋, 剋妻妾,
惡死格, 溺水格…). Mỗi thiên là MỘT DANH SÁCH NÉT RỜI ("耳大貼肉、鼻如截筒、面黑身白… 主大富"), không phải tổ hợp có điều kiện
như cách cục Tử vi; khoảng một nửa số nét không có trong khảo sát (tiếng như chuông, đại tiện, hai tay chấm gối…), một phần ba
số thiên là đoán thọ yểu / hình khắc / chết nạn.

Đề xuất (chọn trong 3 cách):

1. **Không làm "chấm cách"** — gom đủ N nét thì phán "bạn thuộc Đại phú cách": độ chính xác giả, sách không có ngưỡng.
2. **"Nét của bạn sách xếp vào cách nào" (khuyên làm)** — bảng tay nối ~60 nét sách ↔ mã nét khảo sát đã có; khi người dùng
   chọn nét, bài đọc Nhân tướng thêm một dòng ở "Vì sao nói vậy": "Sách xếp nét này vào «Phú cách / Thông minh / Lao lục…»"
   theo khuôn SX-C (A / B / C), mỗi câu là chuỗi con kho nguồn; không đổi mức chương, không tiêu đề hộp. Thiên đoán chết nạn
   (惡死格, 溺水格, 火災格, 夭相) chỉ nhóm C, nói giảm thành lời dặn an toàn, hoặc bỏ.
3. Trang kiến thức "Cách cục tướng trong sách xưa" (thư viện từng cách + nguyên văn) — làm sau (2), dùng chung bảng.
