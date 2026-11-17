# Thống kê sách đã nạp + sách nên bổ sung cho 7 mảng (TK-1, 17/11/2026)

Mục tiêu: lời luận giải có căn cứ hơn và có ích hơn cho người đọc. Tài liệu này trả lời ba câu:
(1) kho nguồn đang có gì, (2) còn thiếu sách quan trọng nào — cổ thư và sách 20–30 năm gần đây được dùng nhiều,
(3) sách nào em tự nạp được, sách nào cần anh tải lên Drive.

**Cách ghi độ tin trong tài liệu**: "đã mở" = em hoặc agent đã tải và nhìn thấy chữ trong phiên này; "nhớ" = từ trí nhớ, chưa kiểm
(năm mất của tác giả hiện đại, nhận định "phái nào phổ biến" phần lớn thuộc loại này). Không có khảo sát định lượng nào về
"sách nào được tin dùng nhất" — phần xếp hạng là đánh giá của em dựa trên nguồn tìm được, không phải số liệu.

## 0. Việc đã làm trong đợt này (đã vào nhánh, có test)

Mới là **kho nguồn** (`engine/fixtures/nguon/`, đều `can_doi_chieu`): chưa đổi KB, phép tính, lời hiển thị, `ENGINE_VERSION`.

| Mảng | Sách vừa nạp | Nguồn chữ | Dùng để làm gì ở bước sau |
|---|---|---|---|
| Thần số | Balliett ×3 (1905, 1908, 1917) · Cheiro's Book of Numbers (1926) · Sepharial, Kabala of Numbers (1911) · Westcott, Numbers (1890) | lớp chữ OCR bản quét Internet Archive | Thần số trước đây **không có một văn bản nguồn nào**. Nay đối chiếu được bảng chữ Chaldea + 43 số kép với chính sách Cheiro, số bậc thầy 11/22 với Balliett, và có "sách xưa nói gì" cho 12 trang Ý nghĩa số |
| Chỉ tay | Benham, Laws of Scientific Hand Reading (1900) · Cheiro's Language of the Hand (1894) · Saint-Germain, Practical Palmistry (1897) | như trên | Phái phương Tây cho `/chi-tay`: bảy gò, dáng bàn tay, đường phụ, dấu trên đường (hiện chỉ có 3 đường lớn tự soi theo sách tướng xưa) |
| Kinh Dịch | Legge, The Yî King (1882) · Tiêu Thị Dịch Lâm (bản Tứ khố) | Internet Archive · Kanseki | Legge là bản Anh công cộng duy nhất chép nguyên văn được cho `/en/i-ching`. Dịch Lâm: 4.096 bài từ theo cặp quẻ bản → quẻ biến |
| Bát tự | Tam Mệnh Thông Hội **đủ 12 quyển** (trước chỉ 34 thiên) · Lý Hư Trung Mệnh Thư, Ngọc Chiếu Định Chân Kinh, Lạc Lộc Tử (2 bản chú), Tam Mệnh Chỉ Mê Phú, Tinh Mệnh Tổng Quát | Kanseki (Tứ khố) | Quyển 8–9 luận ngày × giờ → lời riêng cho 60 trụ ngày; quyển 10–12 các bài phú |
| Chọn ngày | Hiệp Kỷ Biện Phương Thư **đủ bộ 35 quyển** (trước chỉ vài mục) · Tinh Lịch Khảo Nguyên | Kanseki (Tứ khố) | Căn cứ nguyên văn cho mọi thần sát ngày, việc nên / kiêng của Xem ngày tốt |

Bộ nạp: `engine/scripts/nap_archive_en.py`, `engine/scripts/nap_menh_ly_tu_kho.py`; test `engine/tests/test_tk1_kho_nguon_bo_sung.py`.
Chữ OCR tiếng Anh còn lỗi lặt vặt (vd "mshed" = "rushed") → trước khi trích câu nào ra lời phải soát câu ấy với ảnh quét.

## 1. Kho nguồn hiện có (sau đợt này: 52 tệp, khoảng 11 MB)

| Mảng | Đã có nguyên văn | Mới chỉ tóm ý / chưa có |
|---|---|---|
| Tử vi | Tử Vi Đẩu Số Toàn Thư quyển 1–3 | Toàn Thư quyển 4 (mệnh mẫu) · Tử vi đẩu số tân biên, Tử vi tổng hợp (tóm ý) · 200 ý rút từ lời giảng hiện đại |
| Bát tự | Tử Bình Chân Thuyên · Cùng Thông Bảo Giám · Uyên Hải Tử Bình (bản lược) · Tam Mệnh Thông Hội đủ bộ · Trích Thiên Tuỷ + Xiển Vi · Thần Phong Thông Khảo · 6 sách Đường – Tống | Ba bộ bình chú Từ Lạc Ngô · Mệnh Lý Ước Ngôn |
| Kinh Dịch | Chu Dịch Truyện Nghĩa Đại Toàn · bản dịch Ngô Tất Tố · Tăng San Bốc Dịch · Hoàng Kim Sách · Hoả Châu Lâm · Kinh Thị Dịch Truyện · Mai Hoa Dịch Số · Dịch Lâm · Legge | Bốc Phệ Chính Tông · Dịch Học Khải Mông |
| Phong thuỷ | Táng Thư, Trạch Kinh, Thanh Nang (3), Thiên Ngọc Kinh, Địa Lý Biện Chính (một phần), Hám Long, Linh Thành, Thôi Quan, Phát Vi, Dương Trạch Thập Thư, Huyền Cơ Phú · Hiệp Kỷ đủ bộ | **Thẩm Thị Huyền Không Học**, **Dương Trạch Tam Yếu**, **Bát Trạch Minh Kính** (chỉ có tóm ý từ bản dịch Việt), Lỗ Ban Kinh, Địa Lý Ngũ Quyết, Tuyết Tâm Phú |
| Nhân tướng + chỉ tay | Thần Tướng Toàn Biên đủ bộ · Liễu Trang (bản gõ chưa hiệu đính) · Băng Giám, Tâm Tướng Thiên, Linh Khu Ngũ Sắc · 4 sách tướng Tứ khố · Chiếu Đảm Kinh · 3 sách chỉ tay phương Tây | Tương Lý Hành Chân · Ma Y bản sạch · Thuỷ Kính |
| Tarot | Waite 1910 · Book T · Liber 78 · Mathers 1888 · Papus 1892 · Case 1920 · Ouspensky 1913 | Lớp Thoth, Marseille, B.O.T.A. (tóm ý) |
| Thần số | 6 sách vừa nạp | Mọi sách sau 1930 (Jordan, Goodwin, Phillips, Decoz, Millman) |

Mức tin từng tệp KB: `docs/DO-TIN-KHO-TRI-THUC.md`.

## 2. Sách quan trọng còn thiếu — xếp theo giá trị cho người dùng

### 2.1 Cổ thư thuộc phạm vi công cộng nhưng KHÔNG có bản chữ trên mạng → cần anh gửi

Đây là nhóm đáng làm nhất: không vướng bản quyền, và lấp đúng chỗ engine đang phải ghi "chưa đối chiếu".

| Ưu tiên | Sách | Lấp chỗ nào trong engine | Tình trạng tìm kiếm |
|---|---|---|---|
| 1 | **沈氏玄空學** Thẩm Thị Huyền Không Học (bản 增廣, 4–6 quyển) | Toàn bộ Huyền Không: bảng thế tinh, ngưỡng kiêm hướng 3° hay 4,5°, sao 5 nhập trung, 81 cặp sao, thành môn; gỡ cờ `chua_doi_chieu_oracle` | Wikisource không có, Internet Archive tìm tên ra 0 (đã mở). Bản in 進源書局 (Đài Loan) còn bán |
| 1 | **宅運新案** + **二宅實驗** | Hàng chục căn nhà thật kèm vận, sơn hướng, bàn sao → bộ ca mẫu đối chiếu hạ quái + thế quái (hiện chưa có ca mẫu nào từ sách) | Không có bản chữ (đã mở) |
| 2 | **陽宅三要** · **八宅明鏡** · **地理五訣** bản chữ Hán | Cửa – chủ – bếp, du niên, ngũ quyết: đang chỉ có tóm ý từ bản dịch Việt | Có ảnh quét trên Internet Archive (`20260507_20260507_0914`, `20260507_20260507_0702`) nhưng lớp chữ nhận dạng là rác → cần bản gõ |
| 2 | **子平真詮評註 · 滴天髓補註 / 徵義 · 造化元鑰評註** (Từ Lạc Ngô, mất 1949) | Mỗi thiên có mệnh ví dụ → ca mẫu cho cách cục, hỷ kỵ, điều hậu; đây là bản người học Bát tự thực tế đọc | Không tìm thấy bản chữ miễn phí (đã mở Wikisource, Internet Archive) |
| 3 | **卜筮正宗** Bốc Phệ Chính Tông | «Thập bát vấn» chuẩn hoá dụng thần, phục thần, tiến thoái thần; quẻ ví dụ làm ca mẫu Lục hào | Wikisource mới gõ phần đầu; ảnh quét có trên Internet Archive (`20260507_20260507_0428`) |
| 3 | **相理衡真** Tương Lý Hành Chân · **麻衣相法** bản sạch | Sách tướng hệ thống nhất đời Thanh; KB đang theo 12 cung lối Ma Y mà chưa có nguyên văn Ma Y | Không có bản chữ (đã mở) |
| 3 | **命理約言** (Trần Tố Am) | Căn cứ để gắn nhãn thần sát nào đáng tin, điều kiện tòng / hoá | Không có bản chữ |
| 4 | **紫微斗數全書 quyển 4** · **紫微斗數全集** | Mệnh mẫu cổ làm ca đối chiếu cách cục; ghi chú dị bản Hoả Linh, Khôi Việt, tứ hoá Canh / Nhâm | Không tìm thấy |
| 4 | **魯班經** · **雪心賦** | Thước Lỗ Ban; bài phú hình thế hay được dẫn | Có ảnh quét (`02090255.cn`, `20260509_20260509_0800`), chưa có chữ |

Cách gửi dễ nhất: PDF **bôi đen được chữ**, mỗi tệp dưới 10 MB. Ảnh quét không chữ thì em đọc được từng trang nhưng rất chậm
và dễ sai chữ — chỉ nên dùng cho sách ngắn (Bát Trạch Minh Kính, Dương Trạch Tam Yếu).

### 2.2 Sách hiện đại (còn bản quyền) đáng dùng nhất — mỗi mảng 2–4 cuốn

Tiêu chí chọn: sách chạm thẳng vào một tính năng đang chạy và thêm được **phép tính hoặc quy tắc kiểm được**, không chỉ thêm lời.

| Mảng | Sách | Vì sao chọn | Thêm gì cho engine |
|---|---|---|---|
| Tử vi | Lương Nhược Du 梁若瑜, *飛星紫微斗數* (Đài Loan) | Tài liệu tham chiếu của phái phi tinh | Module phi hoá đã có 48 đường bay; thiếu luật **Kỵ chuyển Kỵ, Lộc theo Kỵ** → công tắc "đọc sâu đường bay" |
| Tử vi | Thiên Lương, *Tử vi nghiệm lý* | Đặc trưng lối Việt | Luật đọc vòng Thái Tuế + tam hợp tuổi (engine đã an vòng nhưng chỉ hiển thị) |
| Tử vi | Vương Đình Chi 王亭之, giáo trình phái Trung Châu | Chuẩn ở Hồng Kông | Đọc theo **tổ hợp 60 tinh hệ** thay vì từng sao rời |
| Tử vi | Tử Vân 紫雲, bộ *斗數論命* | Chuẩn thực hành Đài Loan | Luật đọc lưu niên, hợp tham hai người |
| Bát tự | Thiệu Vĩ Hoa, *Dự đoán theo tứ trụ* | Sách Bát tự người Việt đọc nhiều nhất (có trong thư viện đại học, đã mở bản ghi) | So cách chấm thân vượng của ông với thang điểm của engine; từ vựng người Việt quen |
| Bát tự | Lục Trí Cực 陸致極, *命運的求索* | Sách hiếm hoi dùng thống kê mẫu lớn | Căn cứ định lượng cho ngưỡng thân mạnh / yếu |
| Bát tự | Vi Thiên Lý, *千里命稿* | Nhập môn chuẩn Hồng Kông, Đài Loan; khoảng 100 mệnh có lời đoán | Ca mẫu + cách diễn đạt |
| Kinh Dịch | Thiệu Vĩ Hoa, *Chu Dịch với dự đoán học* · Vương Hổ Ứng, *六爻預測學* | Sách Lục hào phổ biến nhất ở VN / Trung Quốc | Thước đo cách nói người Việt quen; ca thực tế |
| Kinh Dịch | Nguyễn Hiến Lê, *Kinh Dịch – Đạo của người quân tử* | Bản Việt phổ biến nhất | Soát lời "Hiểu đơn giản" 64 quẻ, 384 hào |
| Phong thuỷ | Chung Nghĩa Minh 鍾義明, *玄空地理叢譚* · Joey Yap, *Xuan Kong Flying Stars* · Skinner, *Guide to the Feng Shui Compass* | Diễn giải Thẩm thị cho nhà hiện đại; chuẩn tiếng Anh về la bàn | Cách áp phi tinh cho căn hộ; thuật ngữ `/en/feng-shui` |
| Nhân tướng | Lillian Bridges, *Face Reading in Chinese Medicine* | Sách diện tướng tiếng Anh chuẩn mực nhất | Khung cho `/en/face-reading` |
| Chỉ tay | Johnny Fincham (2007) · Ellen Goldberg (2016) | Sách thực hành hiện đại | Dáng tay bốn nguyên tố — đo được bằng 21 điểm mốc engine đã có |
| Tarot | Mary K. Greer, *Complete Book of Tarot Reversals* · Anthony Louis, *Tarot Beyond the Basics* · Rachel Pollack, *78 Degrees of Wisdom* | Chuẩn về lá ngược; phẩm giá nguyên tố; "kinh thánh Tarot" | 12 cách đọc lá ngược; ví dụ tính phẩm giá làm ca mẫu |
| Thần số | **David A. Phillips**, *The Complete Book of Numerology* | Nền của làn sóng thần số ở VN (sách Việt bán 200.000 bản tự nhận 60 % dựa trên Phillips — nguồn báo, đã mở) | Người Việt đối chiếu với cuốn này: số chủ đạo 2–11 + 22/4, 4 đỉnh kiểu Phillips → **công tắc trường phái thứ ba** |
| Thần số | Matthew O. Goodwin, *Numerology: The Complete Guide* | Tài liệu kỹ thuật đầy đủ nhất | **Phép tính mới**: Transit + Essence theo chữ cái tên (dự báo theo năm), bảng cường độ, số tiềm thức |
| Thần số | Dan Millman, *The Life You Were Born to Live* | Hệ "số sinh" 29/11 rất phổ biến | **Phép tính mới**: số sinh có số nền |
| Thần số | Hans Decoz, *Numerology: Key to Your Inner Self* | Nguồn của cách cộng đang là mặc định web | Căn cứ; số cầu nối, số cân bằng |

Chỗ mua: nhà xuất bản / Amazon / books.com.tw / Tiki – Fahasa (bản Việt của Phillips, Thiệu Vĩ Hoa, Nguyễn Hiến Lê). Em không
mở được trang bán sách trong phiên này (bị chặn) nên không dán link chưa kiểm.

### 2.3 Em tự nạp được ở đợt sau (đã mở, có chữ)

Bốc Phệ Toàn Thư (14 phần, trong Cổ Kim Đồ Thư — đối chiếu độc lập nạp giáp, thế ứng, phục thần) · Đổng Công Tuyển Trạch Nhật
Yếu Lãm · Dịch Lâm Bổ Di (đoán theo việc) · Thuỷ Long Kinh, Quản Thị Địa Lý Chỉ Mông · Chu Dịch Chiết Trung · Dịch Học Khải
Mông (thiên khảo biến chiêm) · Hứa Phụ Tướng Pháp · Thần Tướng Thiết Quan Đao (bản giản thể, nhiều thiên giọng phán → chỉ
đối chiếu) · Etteilla (tiếng Pháp, gốc của nghĩa lá ngược) · Uyên Hải Tử Bình bản đủ + Ngũ Hành Tinh Kỷ (bản Wikisource chất
lượng thấp, đã loại ở WS-1 — chỉ dùng khi có bản khác để so).

### 2.4 Không nên nạp (và vì sao)

- Sách đại chúng diễn lại nguồn đã có: Lillian Too, Lý Cư Minh, Tô Dân Phong, Eden Gray, Biddy Tarot, Glynis McCants, Linda Goodman…
- Sách hành nghề giọng phán (trái CY-1, SK-1): Lý Hồng Thành, Lý Hàm Thần, Khúc Vĩ…
- Hệ engine không tính: Huyền Không đại quái, manh phái (không dùng thân vượng nhược — không trộn được với hai cách hiện có), thất chính tứ dư.
- Ngọc Hạp Ký, thiên bùa trấn của Lỗ Ban Kinh: bùa chú, trái quy tắc.
- Learning the Tarot (Joan Bunning): miễn phí đọc nhưng **không phải giấy phép mở**. Bộ bài CBD của Ben-Dov là giấy phép phi thương mại → site bán Sao không dùng được.

## 3. Về việc "nạp nguyên văn sách còn bản quyền, anh sẽ xin phép sau"

Em chưa làm theo hướng này, và đề nghị anh cân nhắc lại, vì ba lý do:

1. **Repo đang công khai.** Đưa nguyên văn sách còn bản quyền vào `engine/fixtures/nguon/` là phát hành lại sách đó cho mọi người,
   trước khi có giấy phép. Xin phép sau không hợp thức hoá việc đã phát hành.
2. **Xin phép thường không dễ.** Tác giả như Phillips, Goodwin đã mất; quyền thuộc nhà xuất bản (Hay House, New Page…), và giấy phép
   trích dài cho mục đích thương mại hiếm khi được cấp, có cấp thì có phí và giới hạn số chữ.
3. **Người dùng không cần nguyên văn.** Thứ làm lời luận tốt lên là **quy tắc, phép tính, ca mẫu** — những thứ này không có bản quyền.
   Lời thì hệ thống tự viết theo giọng của mình (đời thường, không phán), vốn đã khác giọng sách.

Em đề xuất ba mức, anh chọn:

| Phương án | Làm gì | Rủi ro |
|---|---|---|
| **A (em khuyên)** | Sách còn bản quyền: anh mua bản in / ebook, gửi lên Drive để em **đọc**; em rút quy tắc + phép tính + ca mẫu, tự viết lời, ghi nguồn nội bộ. Không tệp sách, không câu chữ sách trong repo | Thấp — đúng cách đã làm với Tử vi tân biên, Tam Yếu |
| B | Như A, cộng thêm kho nguồn riêng **không nằm trong repo công khai** (thư mục Drive của anh hoặc một repo riêng tư) giữ nguyên văn để test đối chiếu nội bộ; chỉ bật khi anh đã có giấy phép bằng văn bản của từng cuốn | Trung bình — cần đổi cách CI đọc kho nguồn |
| C | Chép nguyên văn vào repo công khai ngay | Cao — em không làm khi chưa có giấy phép |

Việc "xem lại nguồn hiện tại có bản quyền không": các bản đang nằm trong repo đều là cổ thư, hoặc sách in trước 1929 có tác giả
mất trên 70 năm. Hai điểm cần anh biết: (a) bản dịch **Ngô Tất Tố** (mất 1954) hết bản quyền ở Việt Nam nhưng chưa chắc ở mọi nước;
(b) *The Book of Thoth* của Crowley (mất 1947) hết bản quyền ở các nước tính "đời + 70 năm", còn ở Mỹ thì chưa rõ — em **không nạp**,
lớp Thoth vẫn là tóm ý.

## 4. Đề xuất thứ tự làm tiếp (mỗi việc là một PR riêng, anh duyệt trước)

| # | Việc | Mảng | Người dùng được gì | Cần gì từ anh |
|---|---|---|---|---|
| 1 | Đối chiếu bảng Chaldea + 43 số kép với Cheiro; thêm "Sách xưa nói gì" (Westcott, Balliett) vào 12 trang Ý nghĩa số + 43 trang số kép | Thần số | Lời có căn cứ; phát hiện chỗ KB lệch sách | Không |
| 2 | Phái chỉ tay phương Tây trên `/chi-tay`: dáng tay 4 kiểu (đo từ 21 điểm mốc đã có), bảy gò, đường phụ — công tắc "sách tướng xưa / phương Tây" | Chỉ tay | Thêm một cách đọc quen với người trẻ | Không |
| 3 | Lời riêng cho 60 trụ ngày × giờ sinh từ Tam Mệnh quyển 8–9 (khuôn SX-C) | Bát tự | Báo cáo bớt chung chung | Không |
| 4 | `/en/i-ching` dùng nguyên văn Legge cho kinh văn | Kinh Dịch | Bản Anh có lời kinh thật | Không (cần soát lỗi OCR từng quẻ) |
| 5 | Bài từ Dịch Lâm cho quẻ có hào động | Kinh Dịch | Mỗi quẻ biến có thêm một bài thơ cổ | Không |
| 6 | Thần số kiểu Phillips thành trường phái thứ ba; Transit / Essence của Goodwin thành lớp "năm nay theo tên" | Thần số | Khớp với sách người Việt đang đọc; thêm dự báo theo năm | Mua 2 sách, gửi Drive (phương án A) |
| 7 | Luật Kỵ chuyển Kỵ / Lộc theo Kỵ; đọc vòng Thái Tuế | Tử vi | Đường bay và vòng Thái Tuế có lời đọc, không chỉ hiển thị | Mua sách Lương Nhược Du, Thiên Lương |
| 8 | Huyền Không: đối chiếu nguyên văn, ca mẫu nhà thật | Phong thuỷ | Gỡ cờ "chưa đối chiếu" | Gửi Thẩm thị + Trạch Vận Tân Án |

Việc 1–5 em làm được ngay khi anh gật. Việc 6–8 chờ sách.
