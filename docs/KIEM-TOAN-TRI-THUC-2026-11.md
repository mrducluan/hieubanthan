# Kiểm toán kho tri thức Tử vi · Bát tự · Kinh Dịch (2026-11-12)

> Chủ dự án giao: rà lại toàn bộ tri thức đã nạp, nguồn đã dùng, tìm phần thiếu, không nạp nguồn ít uy tín.
> Khâu của vòng tăng trưởng: **nền móng chất lượng** cho QUAY LẠI + NẠP Sao (lời luận đúng sách thì người dùng mới tin).
> Đo bằng: tỉ lệ mục KB có nguyên văn đối chiếu được (hôm nay ≈ 2 / 16 tệp), tỉ lệ "Đúng với mình" theo mã hộp, độ phủ holdout.
> Tài liệu này là **báo cáo + đề xuất**. Chưa sửa KB, chưa đổi phép tính.

## 1. Kết luận ngắn

1. **Phép tính (CALC) vững** — có golden đối chiếu oracle độc lập (1.000 lá Tử vi, 5.000 tứ trụ, tiết khí, lịch âm 1901–2099).
2. **Lời nghĩa (KB) rộng nhưng gần như toàn bộ là nháp chưa đối chiếu nguyên văn.** Trong 16 tệp KB ba môn, chỉ **2 tệp**
   có nguyên văn cổ thư thật: `kinhdich_hao.json` (quái từ, hào từ, Đại tượng, Thoán truyện) và `tuvi_co_thu.json`
   (84 câu Cốt Tuỷ Phú). 14 tệp còn lại ghi `nhap_ai` + `can_doi_chieu`, nguồn ghi "kiến thức phổ thông của sách X".
3. **Bát tự chưa có một dòng nguyên văn nào** trong repo — ba sách nền (Uyên Hải, Chân Thuyên, Trích Thiên Tuỷ) chỉ là tên.
4. **Đã tìm ra một lỗi thật**: bảng điều hậu `battu_dieu_hau.json` lệch **26 / 120 ô** so với bản đã đối chiếu từng ô với
   nguyên văn Cùng Thông Bảo Giám (mục 4).
5. **Em tự nạp được phần lớn cổ thư còn thiếu** (mục 5) sau khi anh duyệt mở `zh.wikisource.org` hôm nay. Phần em không tự
   lấy được — chủ yếu **sách Tử vi Việt Nam** và vài sách chưa có bản chữ — ở mục 6.

## 2. Kiểm kê: đang có gì, nguồn nào, tin được tới đâu

| Tệp KB | Nội dung | Nguồn ghi trong tệp | Nguyên văn trong repo? | Đánh giá |
|---|---|---|---|---|
| `tuvi_kb.json` | 12 cung, 14 chính tinh, 168 sao×cung, tứ hoá×cung, 26 phụ tinh | "nháp AI theo khung Nam phái + phổ thông Toàn Thư" | Không | Nghĩa phụ tinh mỗi sao chỉ 1 câu |
| `tuvi_doi_song_kb.json` | lời đời thường 14 sao × 12 cung × sáng/hãm, đại hạn, 75 cách | như trên | Không | Dày nhất, nhưng không truy được về câu sách nào |
| `tuvi_cach_cuc.json` | 75 cách cục + điều kiện | Toàn Thư, Cốt Tuỷ Phú "bản phổ thông" | 37 cách có cổ ca | Điều kiện đã test 1.000 lá; lời chưa đối chiếu |
| `tuvi_co_thu.json` | 84 câu Cốt Tuỷ Phú | Wikisource bản đóng băng, đối chiếu chéo 1.522 chữ | **Có** | Tốt. Còn chờ so bản khắc 1600 |
| `tuvi_phi_hoa_kb.json` | phi tinh tứ hoá, nhịp 3 tháng | "tài liệu chủ dự án gửi" + khung Phi tinh | Không | Phái Phi tinh hiện đại — không có cổ thư, cần ghi rõ |
| `tuvi_y_bo_sung.json` | 200 ý từ bài giảng hiện đại | bài giảng CC BY-NC-SA | Không (cố ý) | **Uy tín thấp nhất**; đã khoá 80 ý vào "Góc nhìn khác", 23 ý tắt — giữ nguyên cách khoá |
| `tuvi_sao_luu_kb.json`, `tuvi_hai_nguoi_kb.json` | sao lưu, điểm hai người | Toàn Thư / dân gian | Không | Điểm hai người là luật tự đặt — đã ghi "tham khảo" |
| `battu_kb.json` | 10 nhật chủ, 10 thập thần, 11 cách, nạp âm | "phổ thông Uyên Hải, Chân Thuyên, Trích Thiên Tuỷ" | Không | Mỏng (43 KB) |
| `battu_doi_song_kb.json` | lời đời thường, 18 thần sát, hỷ kỵ cách cục | như trên + Tam Mệnh Thông Hội | Không | Bảng hỷ/kỵ đang chờ người duyệt (BT-HK) |
| `battu_dieu_hau.json` | 120 ô điều hậu | Cùng Thông Bảo Giám "bản lưu hành" | Không | **Lệch 26 ô** (mục 4) |
| `kinhdich_hao.json` | 64 quẻ, 384 hào, Thoán, Đại tượng | Chu Dịch, bản số hoá MIT | **Có** | Tốt. Bản dịch Việt là nháp |
| `kinhdich_kb.json` | ý chính 64 quẻ, bát quái, thể dụng, dụng thần | Chu Dịch, Mai Hoa, Tăng San | Một phần | Phần Mai Hoa + Lục Hào chỉ 5 + 5 mục |
| `kinhdich_doi_song.json`, `kinhdich_tra_loi.json` | 27 chủ đề, xu hướng 384 hào, dụng thần theo việc | "khung Tăng San Bốc Dịch" | Không | Luật dụng thần chưa có câu sách đi kèm |

Nguồn đã dùng xếp theo độ tin:
- **A — cổ thư có nguyên văn kiểm được**: Chu Dịch; Cốt Tuỷ Phú; Tam Mệnh Thông Hội + Hiệp Kỷ Biện Phương Thư (đọc ở kho Tứ khố cho thần sát).
- **B — thư viện tính có oracle độc lập**: iztro, lasotuvi, lunar (chỉ phép tính, không phải lời nghĩa).
- **C — nháp AI "theo khung sách"**: phần lớn KB. Không sai rõ, nhưng không chứng minh được là đúng sách.
- **D — hiện đại / dân gian**: bài giảng hiện đại (200 ý), phi tinh, điểm hợp tuổi, nạp âm. Đã gắn nhãn; **không mở rộng thêm**.
- **Đã loại đúng**: "cổ thư" giả giọng cổ trong repo ziwei-doushu, mã AGPL, repo không giấy phép.

## 3. Phần còn thiếu (so với cổ thư chuẩn của từng môn)

### 3.1 Tử vi
| Thiếu | Chi tiết | Sách gốc |
|---|---|---|
| **45 / 93 sao engine an được nhưng KB không có nghĩa** | 18 tạp diệu (Âm Sát, Đài Phụ, Giải Thần, Thiên Vu, Thiên Nguyệt, Thiên Thương, Thiên Sứ, Phá Toái…), 8 sao vòng Bác Sĩ, 10 sao vòng Tướng tiền, 9 sao vòng Thái Tuế; vòng Trường Sinh chỉ nhắc tên | Toàn Thư q.2 (một phần); phần lớn chỉ có ở sách Việt (mục 6) |
| Phụ tinh chỉ 1 câu / sao | Lục cát, lục sát chưa có nghĩa theo cung như chính tinh | Toàn Thư q.1 "chư tinh vấn đáp" (37 bài), q.2 |
| 6 bài phú + luận ngoài Cốt Tuỷ Phú | Thái Vi Phú, Hình Tính Phú, Tinh Viên Luận, Đẩu Số Chuẩn Thằng, Phát Vi Luận, **Nữ Mệnh Cốt Tuỷ Phú** | Toàn Thư q.1 |
| Luận 12 cung từng sao theo sách | 246 đoạn "sao X ở cung Y" nguyên văn | Toàn Thư q.2 |
| Luận hạn theo sách | 20 thiên: đại hạn 10 năm, nhị hạn Thái Tuế, tiểu nhi, "hành hạn phân nam bắc đẩu", Kình Đà điệt tịnh, Thất Sát trùng phùng | Toàn Thư q.3 |
| Bảng miếu hãm theo Toàn Thư | Đang có bảng Nam phái Việt + bảng iztro; chưa có bảng của chính Toàn Thư để người dùng so | Toàn Thư q.2–3 |
| Phái Việt | Không có sách Việt nào được nạp có kiểm chứng; "khung Nam phái" đến từ skill `tuvi-vn` | mục 6 |

### 3.2 Bát tự
| Thiếu | Sách gốc |
|---|---|
| Nguyên văn 3 sách nền (0 dòng) | Uyên Hải Tử Bình, Tử Bình Chân Thuyên, Trích Thiên Tuỷ (Xiển Vi) |
| Cách cục đặc biệt: tòng cách, hoá khí cách, chuyên vượng (Khúc Trực, Viêm Thượng…), lưỡng thần thành tượng | Trích Thiên Tuỷ "tòng hoá luận", Uyên Hải |
| Thông quan, bệnh – dược | Trích Thiên Tuỷ "thông cách luận"; Thần Phong Thông Khảo "bệnh dược thuyết" |
| Hợp hoá can, tam hội, lục hại, hình (chỉ có xung / hợp cơ bản) | Tam Mệnh Thông Hội q.2–6 |
| Nhân nguyên tư lệnh (can nắm lệnh theo ngày trong tháng) | Uyên Hải; Tam Mệnh Thông Hội |
| Thành – bại, cứu ứng của 8 cách; "luận hành vận", "luận cung phận lục thân" | Tử Bình Chân Thuyên (mới tóm ý thiên dụng thần) |
| 12 trường sinh chưa có nghĩa theo trụ | Tam Mệnh Thông Hội q.2 |
| Điều hậu: lời giải thích từng ô (vì sao cần can đó) | Cùng Thông Bảo Giám |

### 3.3 Kinh Dịch
| Thiếu | Sách gốc |
|---|---|
| Thập Dực còn 5/7: **Tiểu tượng 384 hào**, Văn Ngôn, Hệ Từ, **Thuyết Quái**, Tự Quái, Tạp Quái | Chu Dịch |
| Mai Hoa: vạn vật loại tượng 8 quái (người, vật, bệnh phận, phương, số…), tam yếu, thập ứng, ngoại ứng, tiên thiên / hậu thiên | Mai Hoa Dịch Số; gốc là Thuyết Quái |
| Lục Hào: tính chất quẻ (lục xung, lục hợp, du hồn, quy hồn), phản ngâm / phục ngâm cấp quẻ, tam hợp cục, độc phát / độc tĩnh, quái thân | Tăng San Bốc Dịch; Hoả Châu Lâm |
| Luận theo việc có câu sách (hôn nhân, cầu tài, xuất hành, tật bệnh, tố tụng, thất vật…) | Tăng San Bốc Dịch q.sau; Hoàng Kim Sách (trong Bốc Phệ Chính Tông) |
| Bản dịch Việt uy tín để soát bản dịch nháp | Ngô Tất Tố, Phan Bội Châu (đã hết bản quyền ở VN) — mục 6 |

## 4. Lỗi tìm thấy: bảng điều hậu Cùng Thông Bảo Giám

So `battu_dieu_hau.json` với bộ dữ liệu đã soát từng ô với nguyên văn (kho `tianzhi-classics`, mã + metadata MIT; 120 ô có
câu nguyên văn kèm): **94 ô trùng · 7 ô đúng can nhưng sai thứ tự · 19 ô khác can**. Thứ tự có nghĩa ("tiên Đinh hậu Canh").
Ví dụ rõ nhất:

| Nhật chủ – tháng | Engine đang ghi | Nguyên văn | Câu sách |
|---|---|---|---|
| Giáp – Mùi | Quý, Đinh, Canh | Đinh, Canh | 先丁后庚，无癸亦可 |
| Giáp – Thân | Canh, Đinh, Nhâm | Đinh, Canh | 丁火为尊，庚金次之 |
| Giáp – Tuất | Canh, **Giáp**, Đinh, Nhâm, Quý | Đinh, Nhâm, Quý (+ Canh) | 独爱丁火，壬癸滋扶 — "Giáp" là chính nhật chủ, không thể là dụng thần điều hậu |
| Canh – Dần | Mậu, Giáp, Nhâm, Bính, Đinh | Bính, Giáp | 先用丙暖庚性…须甲疏洩 |
| Tân – Tý | Bính, Mậu, Nhâm, Giáp | Bính (Nhâm) | 壬丙两透，不见戊癸 — sách bảo **tránh** Mậu |
| Tân – Mão | Nhâm, Giáp | Nhâm | 壬水为尊，见戊己为病 |

Bảng này đi vào dụng thần **cách 1** (lớp điều hậu) → sửa sẽ đổi "hành cần thêm" của một số lá số, kéo theo mức vài chương
Bát tự đời sống, golden mã kiểm chứng. **Cần anh duyệt** (câu hỏi Q1). Em đề xuất sửa, kèm test "mỗi ô có câu nguyên văn",
và tăng `ENGINE_VERSION` vì kết quả đổi.

## 5. Nguồn em TỰ NẠP được (đã thử truy cập hôm nay)

| Sách | Lấy ở đâu | Dùng để |
|---|---|---|
| **Tử Vi Đẩu Số Toàn Thư** q.1–3 (56 thiên q.1, 246 đoạn 12 cung, 43 quyết an sao, 20 thiên hạn, bảng miếu hãm, 240 câu đoán theo sao) | kho `tianzhi-classics` (đã cắt theo thiên, ghi chỗ khác bản khắc 1600) + Wikisource `紫微斗數全書` để đối chiếu | Lấp 3.1 (trừ sao lối Việt) |
| Tử Vi Đẩu Số bản Đạo Tạng (3 quyển, bản cổ hơn Toàn Thư) | kho Tứ khố / Đạo Tạng `KR5h0055`, Wikisource `紫微斗數` | Đối chiếu, ghi khác bản |
| **Cùng Thông Bảo Giám** 120 ô + câu nguyên văn | `tianzhi-classics` | Sửa mục 4, thêm lời giải thích |
| **Trích Thiên Tuỷ Xiển Vi** (Nhậm Thiết Tiều, ~400 nghìn chữ) | Wikisource `滴天髓闡微`, `滴天髓` | Tòng hoá, thông quan, vượng suy |
| **Uyên Hải Tử Bình** (bản Wikisource **chưa trọn** — tự ghi "chưa hoàn thành") | Wikisource `淵海子平` | Thập thần, cách cục cổ; phần thiếu → mục 6 |
| **Thần Phong Thông Khảo** | Wikisource `神峰通考` | Bệnh – dược |
| **Tam Mệnh Thông Hội** bản Tứ khố (12 quyển) | kho Tứ khố `KR3g0042` | Thần sát, nạp âm, hợp hoá hình hại, trường sinh |
| **Thập Dực** đủ 7 (Hệ Từ, Thuyết Quái, Tự Quái, Tạp Quái, Văn Ngôn, Tiểu tượng) | Wikisource `易傳/…`, `周易/文言` | Lấp 3.3 dòng 1–2 |
| **Tăng San Bốc Dịch** (~326 nghìn chữ) | Wikisource `增刪卜易` | Lục Hào theo việc |
| **Hoả Châu Lâm**, **Kinh Thị Dịch Truyện**, Mai Hoa Dịch Số (cần kiểm độ đủ), Bốc Phệ Chính Tông (cần kiểm) | Wikisource, kho Tứ khố `KR3g0030` | Bát cung, du hồn / quy hồn, loại tượng |

Không nạp: "Kim Bất Hoán đại vận" (không tìm được bản gốc), mọi bảng "packaged" chưa soát, văn giả cổ, blog / diễn đàn.

## 6. Nguồn em KHÔNG tự lấy được — nhờ anh gửi (Google Drive hoặc đính kèm)

Thứ tự ưu tiên từ trên xuống. PDF chữ (không phải ảnh quét) là tốt nhất; ảnh quét em vẫn đọc được nhưng chậm, ~20 trang / lượt.

| # | Sách | Vì sao cần | Cách dùng (bản quyền) |
|---|---|---|---|
| 1 | **Tử vi đẩu số tân biên** — Vân Đằng Thái Thứ Lang (1956) | Sách gốc của lối Việt: nghĩa ~110 sao gồm vòng Thái Tuế, Bác Sĩ, Trường Sinh, tạp diệu — đúng 45 sao đang thiếu | Sách hiện đại: chỉ tóm ý + ghi nguồn, không chép |
| 2 | **Tử vi tổng hợp** — Nguyễn Phát Lộc | CLAUDE.md đã lấy ông làm cấu hình ưu tiên hạn, nhưng repo chưa có sách | như trên |
| 3 | **Tử vi nghiệm lý** — Thiên Lương | Vòng Thái Tuế, tam hợp tuổi — khác phái, cần ghi "hai góc nhìn" | như trên |
| 4 | **Tử Bình Chân Thuyên** bản chữ (子平真詮, hoặc bản *Bình chú* của Từ Lạc Ngô) | Wikisource không có; ctext chặn máy (res=413248). Anh mở ctext trên trình duyệt → lưu trang thành PDF / chép vào Google Doc | Cổ thư, dùng nguyên văn được |
| 5 | **Uyên Hải Tử Bình** bản đủ 5 quyển (ctext res=307303) | Bản Wikisource thiếu | Cổ thư |
| 6 | **Kinh Dịch — Ngô Tất Tố dịch** (kèm Trình truyện, Chu Hy bản nghĩa) và/hoặc **Chu Dịch — Phan Bội Châu** | Soát 64 + 384 bản dịch nháp bằng bản dịch Việt uy tín; hai dịch giả mất 1954 / 1940 → đã hết bản quyền ở VN | Trích được có ghi nguồn |
| 7 | **Mai Hoa Dịch Số** bản đủ (ctext res=778643) nếu bản Wikisource thiếu — em báo lại sau khi kiểm | Loại tượng, thập ứng | Cổ thư |
| 8 | (Tuỳ) **Tử Vi Đẩu Số Toàn Tập** (紫微斗數全集, đời Thanh) | Bản thứ hai cạnh Toàn Thư, nguồn của nhiều sao tạp | Cổ thư |
| 9 | (Tuỳ) Sách Bát tự / Lục Hào hiện đại anh tin dùng (Thiệu Vĩ Hoa, Vương Đình Chi…) | Chỉ rút quy tắc, luôn gắn nhãn "hiện đại" | Tóm ý |

Cách khác đỡ công anh: mở thêm tên miền trong môi trường (em gửi lời xin từng cái khi cần), ví dụ `commons.wikimedia.org`
+ `upload.wikimedia.org` để em đọc bản quét Thư viện Quốc gia Trung Quốc của Tử Bình Chân Thuyên (mục 4).

## 7. Đề xuất cách làm (em khuyên theo thứ tự này)

**K1 — "Kho nguồn" trước, lời sau.** Chép nguyên văn công cộng vào `engine/fixtures/nguon/<sách>.json` (đã làm vậy cho
Tarot: Waite, Book T, Mathers), mỗi đoạn có mã thiên / tiết + bản gốc + chỗ nghi vấn. Thêm test: *mọi trường `trich` trong KB
phải là chuỗi con của nguyên văn* — AI không thể "nhớ nhầm" câu sách nữa.

**K2 — Thang độ tin 4 bậc cho từng mục KB** (`do_tin`: `co_thu` · `truyen_thong_viet` · `hien_dai` · `dan_gian`), thay cờ
chung `can_doi_chieu`. RULES ưu tiên bậc cao khi hai mục cùng khớp; "Vì sao nói vậy" hiện đúng bậc. Không cần migration.

**K3 — Lấp chỗ thiếu theo giá trị với người hỏi**, không theo thứ tự sách:
1. Sửa điều hậu 26 ô (sau Q1).
2. Tử vi: nghĩa phụ tinh + luận hạn từ Toàn Thư q.1, q.3; 45 sao thiếu (chờ sách mục 6 #1 cho sao lối Việt; sao có trong Toàn Thư làm trước).
3. Kinh Dịch: Tiểu tượng 384 hào + Thuyết Quái → loại tượng Mai Hoa; tính chất quẻ Lục Hào (cần thêm phép tính nhỏ, test trước).
4. Bát tự: tòng / hoá / chuyên vượng, thông quan, bệnh dược — **trình bày như "cách đọc thứ ba"**, không đổi hai cách dụng thần đang có.

**K4 — Sổ "chỗ các sách nói khác nhau"** (`docs/` + KB): ví dụ Văn Xương hai cách khởi, miếu hãm Toàn Thư ≠ Nam phái Việt.
Sản phẩm đã có triết lý "hiện cả hai"; sổ này biến nó thành dữ liệu thay vì ghi chú rải rác.

Mỗi bước một PR, có số trước / sau (số mục có nguyên văn, holdout, golden mã kiểm chứng). Không dependency mới, không migration.

## 8. Câu hỏi cần anh quyết

- **Q1.** Duyệt sửa 26 ô điều hậu theo nguyên văn (đổi kết quả cách 1 của một số lá, tăng `ENGINE_VERSION`)?
- **Q2.** Nguyên văn cổ thư: chỉ dùng nội bộ để kiểm + trích ≤ 2 câu như hiện nay, hay mở thêm cụm trang đọc (như trang Cốt Tuỷ Phú) cho Thái Vi Phú, Nữ Mệnh Cốt Tuỷ Phú, Thuyết Quái… (thêm trang SEO, thêm việc dịch)?
- **Q3.** Thứ tự K3 như trên, hay anh muốn một môn trước?
- **Q4.** Sách mục 6: anh gửi được cuốn nào (ưu tiên #1, #4, #6)?

## 9. Tiến độ nạp (cập nhật 2026-11-12, đợt 1)

Chủ dự án đã: chỉ kho `kanripo/KR1a0091` (Chu Dịch Truyện Nghĩa Đại Toàn, 24 quyển) và gửi thư mục Drive 9 tệp sách.

### 9.1 Đã xong — Chu Dịch Truyện Nghĩa Đại Toàn (周易傳義大全, Hồ Quảng, đời Minh; bản Văn Uyên Các Tứ khố)

- **Kho nguồn** `engine/fixtures/nguon/chu_dich_truyen_nghia.json` (dựng bằng `engine/scripts/nap_truyen_nghia.py`, tất định):
  64 quẻ · 386 hào (kể Dụng cửu, Dụng lục) · 1.296 đoạn kinh văn, mỗi đoạn kèm **Trình Di truyện** (≈ 115 nghìn chữ) và
  **Chu Hy bản nghĩa** (≈ 31 nghìn chữ ở phần quẻ + ≈ 6,7 nghìn chữ ở Thập Dực), số tờ bản Tứ khố để tra lại.
  Có đủ: Thoán, Đại tượng, **Tiểu tượng từng hào**, **Văn Ngôn** (Càn, Khôn), **Hệ Từ thượng / hạ, Thuyết Quái, Tự Quái,
  Tạp Quái** — tức đã có nguyên văn cho toàn bộ phần Thập Dực còn thiếu ở mục 3.3.
- **Chưa nạp**: lời các nhà Tống – Nguyên in chữ nhỏ (≈ 387 nghìn chữ) và 6 thiên đầu sách (đồ thuyết, phệ nghi, cương lĩnh) —
  bộ cắt sách dựng lại được khi cần.
- Bản số hoá gõ nhầm ký hiệu quẻ Quan (䷓ thành ䷺) — đã sửa theo hai quái ghi kèm; vài chỗ sót chữ (vd. hào Sơ quẻ Khiêm
  thiếu chữ 吉) → không coi bản này là chuẩn duy nhất, chỗ lệch đều xét tay.
- **Soát KB bằng nguồn này → sửa 24 chỗ kinh văn chép sai trong `kinhdich_hao.json`** (bản số hoá cũ
  `fixtures/chu_dich/nguyen_van.json` mang sẵn lỗi): Càn thoán 大明終始; Mông 初筮告; Lý 定民志; Bác 山附於地; Vô Vọng 不耕穫;
  Đại Quá 得其士夫; Khảm 險之時用; Đại Tráng 非禮弗履; Tấn 鼫鼠; Minh Di 于出門庭; Gia Nhân 勿恤吉 (bỏ chữ 往 thừa — bản dịch
  cũng sửa); Tổn 利有攸往; Cách 革而信之; Phong 故豐 / 況於人乎; Tốn 利有攸往; Tiểu Quá 飛鳥遺之音; Ký Tế 豫防; Tuỳ 係 (3 chỗ
  chữ giản thể 系); Khốn 蒺藜; Tỉnh 甕, 洌. Năm câu dịch Việt sửa theo.
- **Test** `tests/test_nguon_chu_dich_truyen_nghia.py`: đủ 64 quẻ / 386 hào đều có Trình + Chu + Tiểu tượng; quái từ + hào từ
  trong KB phải trùng bản Tứ khố sau khi quy dị thể (12 chỗ khác bản đã xét tay nằm trong danh sách chấp nhận).
- Golden đầu ra bản Việt sinh lại có chủ đích (43 / 10.509 lượt, đều là Kinh Dịch + trang quẻ); sổ ngày cập nhật 20 trang quẻ.
- Phép tính không đổi → không tăng `ENGINE_VERSION`.

### 9.2 Thư mục Drive — đã tải về máy làm việc, CHƯA nạp vào repo

| Tệp | Dạng | Dùng thế nào |
|---|---|---|
| Kinh Dịch trọn bộ — Ngô Tất Tố (938 trang, có lớp chữ) | Bản dịch Việt của **chính cuốn Truyện Nghĩa Đại Toàn** (dịch âm, dịch nghĩa, truyện Trình Di, bản nghĩa Chu Hy) | Bước kế: ghép theo quẻ / hào với kho nguồn 9.1 → có lời Việt uy tín cho Trình / Chu, soát 64 + 384 câu dịch nháp |
| Tử Bình Chân Thuyên — nguyên tác (27 trang, chữ giản thể có chấm câu) | Cổ thư | Kho nguồn theo thiên; đối chiếu `cach_cuc_tbct` + bảng hỷ / kỵ đang chờ duyệt (BT-HK) |
| Tử Bình Chân Thuyên bình chú hợp san (166 trang, có lớp chữ) | Từ Lạc Ngô chú (mất 1949) | Lời giải thích từng cách, ví dụ mệnh |
| Tử Bình Chân Thuyên bình chú (287 trang) | **Ảnh quét, không có lớp chữ** | Không cần — hai bản trên đã đủ |
| Trích Thiên Tuỷ (235 trang) | **Bản dịch Việt hiện đại** | Chỉ tóm ý; nguyên văn lấy ở Wikisource `滴天髓闡微` |
| Tử vi đẩu số tân biên — Vân Đằng Thái Thứ Lang (277 trang, có lớp chữ) | Sách Việt hiện đại | Tóm ý nghĩa ~110 sao (45 sao đang thiếu), ghi nguồn, **không chép vào repo công khai** |
| Tử vi tổng hợp — Nguyễn Phát Lộc (443 trang) | Lớp chữ mã VNI (phải đổi sang Unicode) | như trên; đối chiếu cấu hình ưu tiên hạn |
| Tam Mệnh Thông Hội, Uyên Hải Tử Bình | Google Docs | **Chưa tải được** — Google xuất tài liệu qua máy chủ có tên đổi mỗi lần, môi trường không cho phép ký tự đại diện. Tam Mệnh em lấy ở kho Tứ khố `KR3g0042`; **Uyên Hải**: nhờ anh mở tài liệu → Tệp → Tải xuống → `.txt` (hoặc PDF) rồi thả lại vào thư mục |

### 9.3 Thứ tự làm tiếp (mỗi bước một PR)

1. **Kinh Dịch lớp lời Việt**: ghép Ngô Tất Tố ↔ kho nguồn; thêm vào bài đọc quẻ mục "Trình Di nói gì · Chu Hy nói gì" + Tiểu
   tượng 384 hào + Thuyết Quái → loại tượng tám quái cho Mai Hoa.
2. **Bát tự**: kho nguồn Tử Bình Chân Thuyên; sửa 26 ô điều hậu (chờ Q1); soát bảng hỷ / kỵ 8 cách theo nguyên văn.
3. **Tử vi**: kho nguồn Toàn Thư 3 quyển; nghĩa 45 sao thiếu + phụ tinh theo Tân Biên / Tổng Hợp (tóm ý, ghi nguồn, thang độ tin).
4. Tam Mệnh Thông Hội, Trích Thiên Tuỷ Xiển Vi, Tăng San Bốc Dịch.

## 10. Đợt 2 (2026-11-12) — chủ dự án duyệt Q1–Q3, giao làm cả ba môn

Khâu của vòng tăng trưởng: QUAY LẠI (bài đọc quẻ, lá số có thêm lớp nghĩa truy được về sách) + THU HÚT (64 trang quẻ dày hơn,
phần riêng tăng). Đo: `chart_interacted{mo_dun=kinhdich, kind=mo_loi_kinh}`, `chart_interacted{kind=chon_sao}`, hiển thị / nhấp
Search Console cụm `/kinh-dich/que`, `advisor_question_completed{tuvi}` cho câu hỏi về sao nhỏ.

**Đính chính mục 4**: bảng điều hậu Cùng Thông Bảo Giám chỉ dùng để HIỂN THỊ trên lá số Bát tự (`mo_rong.dieu_hau_ctbg`) và trong
hỏi đáp; dụng thần cách 1 của engine tính lớp điều hậu bằng quy tắc mùa riêng (`calc/battu.py`). Vì vậy sửa bảng **không** đổi "hành
cần thêm", không đổi mức chương nào, **không tăng `ENGINE_VERSION`** (trái với điều em viết ở mục 4 và Q1).

### 10.1 Kinh Dịch

| Việc | Kết quả | Người dùng thấy ở đâu |
|---|---|---|
| Ghép bản dịch **Ngô Tất Tố** với chữ Hán bản Tứ khố (`scripts/ghep_ngo_tat_to.py`, khớp chữ Hán theo thứ tự sách) | KB `kinhdich_truyen_nghia.json`: 1.106 / 1.118 đoạn ghép được; 367 / 384 hào có dịch nghĩa + lời Trình Di, 359 có lời Chu Hy, 369 có Tiểu tượng, 64 / 64 Đại tượng, 62 / 64 quái từ. Kiểm chéo: câu dịch tự nêu vị trí hào phải trùng hào được gắn — 2 chỗ lệch bị loại tự động | — |
| Bài đọc quẻ | Mỗi mục "Lời kinh" thêm **Tiểu tượng** (Hán + dịch), **Trình Di giảng**, **Chu Hy giảng** (trích trọn câu, ≤ 420 ký tự), ghi "theo bản dịch của Ngô Tất Tố" | `/kinh-dich` → khối gập "Lời kinh nguyên văn" |
| Trang quẻ | Hai mục mới: "Tiểu tượng truyện: lời giảng từng hào", "Trình Di và Chu Hy giảng quẻ này" | 64 trang `/kinh-dich/que/*` (+ bản .md) |
| **Loại tượng tám quái** từ Thuyết Quái (đức, người, thân thể, loài vật, 8–12 vật; mỗi quái kèm câu nguyên văn — test bắt là chuỗi con của kho nguồn) | `kinhdich_kb.bat_quai[*].loai_tuong` | Câu trả lời theo Mai Hoa: thêm đoạn "Quẻ Thể là phía bạn, quẻ Dụng là phía việc… Theo Thuyết Quái, Chấn là sấm…" — gợi ý người / vật / nơi chốn, không phải lời đoán |

Chưa làm: Văn Ngôn, Hệ Từ lên trang đọc (đã có nguyên văn trong kho nguồn; Ngô Tất Tố không dịch Hệ Từ trong bản này);
vạn vật loại tượng mở rộng của Mai Hoa Dịch Số (thời tiết, ăn uống, nơi chốn — ngoài Thuyết Quái); tính chất quẻ Lục Hào
(lục xung, lục hợp, du hồn, quy hồn — cần phép tính mới, test trước). Bản điện tử Ngô Tất Tố còn lỗi gõ lẻ tẻ; lời trích giữ nguyên.

### 10.2 Bát tự

- **Kho nguồn** `fixtures/nguon/tu_binh_chan_thuyen.json` (47 thiên, ≈ 25,5 nghìn chữ) và `fixtures/nguon/cung_thong_bao_giam.json`
  (120 ô: câu nguyên văn, can đọc từ câu, bảng điều hậu) — `scripts/nap_co_thu_bat_tu.py`.
- **Bảng điều hậu sửa 34 / 120 ô** theo nguyên tắc "thứ tự can theo đúng câu sách, can sách nêu ở đoạn sau xếp sau, nhật can không
  tự làm dụng thần cho mình khi sách không nêu" (26 ô lệch can + 8 ô lệch thứ tự so bản soát). Mỗi ô có `trich` — câu nguyên văn —
  trả kèm trong `mo_rong.dieu_hau_ctbg.trich`. `trang_thai: da_doi_chieu_nguyen_van`.
- **Bảng hỷ / kỵ cách cục (BT-HK) — 4 chỗ lệch thiên «Luận dụng thần» của Tử Bình Chân Thuyên, CHƯA sửa** (sửa sẽ đổi dụng thần
  cách 2 → mức chương, golden, `ENGINE_VERSION`; quyết định BT-HK yêu cầu người duyệt):

  | Cách | KB đang ghi | Nguyên văn | Đề xuất |
  |---|---|---|---|
  | Thất Sát | hỷ Thực Thương, **Ấn**; kỵ — | 七煞喜食神以制伏，忌財印以資扶 | hỷ Thực Thương; kỵ Tài (và cân nhắc Ấn — thiên «Luận thiên quan» có cách Sát Ấn tương sinh, nên Ấn để trung tính) |
  | Chính Ấn, Thiên Ấn | hỷ Quan Sát; kỵ Tài | 印喜官煞以相生，劫才以護印 | thêm hỷ Tỷ Kiếp |
  | Thực Thần | hỷ Tài; kỵ Ấn | 食喜身旺以相生，生財以護食 | thêm hỷ Tỷ Kiếp |
  | Thương Quan | hỷ Tài; kỵ Quan Sát | 傷官喜佩印以制伏，生財以化傷 | thêm hỷ Ấn |

  → **câu hỏi Q5** cho chủ dự án: duyệt sửa 4 chỗ này (em sẽ đo số lá mẫu đổi mức trước khi gộp).
- Uyên Hải Tử Bình: **đã nạp thử** — xem mục 10.5.

### 10.3 Tử vi

- **Kho nguồn** `fixtures/nguon/tu_vi_dau_so_toan_thu.json`: quyển 1 (56 thiên: Thái Vi Phú, Hình Tính Phú, chư tinh vấn đáp, Cốt
  Tuỷ Phú, Nữ Mệnh Cốt Tuỷ Phú, định cách…), an sao 43 quyết, luận 12 cung 289 đoạn, quyển 3 (20 thiên luận hạn), chư tinh đồng
  viên 34 nhóm câu — `scripts/nap_tu_vi_toan_thu.py`.
- **Nghĩa 74 sao nhỏ** (số thật là 79 tên engine an được mà KB chưa có mục nghĩa, không phải 45): tạp diệu, vòng Trường Sinh,
  vòng Bác Sĩ, vòng Tướng tiền, vòng Thái Tuế (cả tên phái Trung Châu lẫn tên lối Việt). KB `tuvi_kb.sao_nho` — 53 mục tóm ý
  từ *Tử vi đẩu số tân biên* (Vân Đằng Thái Thứ Lang, 1956; `do_tin: truyen_thong_viet`), 21 mục tên phái Trung Châu
  (`do_tin: hien_dai`, nháp ban biên tập). Lời viết lại theo giọng của sản phẩm: không phán, không tên bệnh, mục nhắc sức khoẻ
  kèm câu không thay lời bác sĩ. Test: **mọi sao engine an được đều có nghĩa**.
- Hiển thị: lá số trả `cung[].nghia_sao_nho`; bấm một sao nhỏ trong chi tiết cung hiện nghĩa; dòng "Trường sinh" có nghĩa đi kèm.
  Hỏi đáp: "Sao Tấu Thư là gì?" trả lời được. Mục `sao_nho` tách khỏi `phu_tinh` để tên một chữ ("Tử", "Mộ", "Bệnh") không làm
  lệch việc nhận tên sao; tên bỏ dấu trùng chữ thường ("Lâm Quan / làm quan", "Quan Đới / quân đội") chỉ nhận khi gõ đúng dấu.
- Chưa làm: đưa 289 đoạn luận 12 cung + 20 thiên luận hạn của Toàn Thư thành lời Việt (cần dịch + duyệt); *Tử vi tổng hợp*
  (Nguyễn Phát Lộc) — tệp chữ mã VNI, chưa đổi mã, chưa đọc.

### 10.4 Còn thiếu sau đợt này (xếp theo giá trị với người hỏi)

1. Tử vi: lời Việt cho luận hạn Toàn Thư quyển 3 và nghĩa phụ tinh theo cung (lục cát, lục sát) — hiện mỗi sao một câu.
2. Bát tự: cách cục đặc biệt (tòng, hoá khí, chuyên vượng), thông quan, bệnh – dược; sửa hỷ / kỵ sau Q5.
3. Kinh Dịch: tính chất quẻ Lục Hào; luận theo việc có câu Tăng San Bốc Dịch đi kèm.
4. Thang độ tin 4 bậc cho MỌI mục KB (đợt này mới gắn cho `sao_nho`).

### 10.5 Uyên Hải Tử Bình — nạp thử (2026-11-12, sau khi gộp đợt 2)

Chủ dự án tải lại tệp lên Drive (Google Docs `1zojmde…`), em tải được qua kết nối Drive (56.322 chữ).

- **Kho nguồn** `engine/fixtures/nguon/uyen_hai_tu_binh.json` (`scripts/nap_co_thu_bat_tu.py uyen_hai <tệp>`): 184 mục — luận nhật chủ, nguyệt lệnh, Thái Tuế, đại vận, tính tình, **can chi thể tượng** (10 can + 12 chi), mười thần (Thương Quan, Thực Thần, Tài, Quan, Sát, Ấn, Kiếp, Dương Nhận) kèm 77 bài thi quyết, nhật quý / nhật đức / khôi cương / kim thần, lục thân, nữ mệnh, Hỷ kỵ thiên, Tứ ngôn / Ngũ ngôn độc bộ, Lạc Lục Tử tiêu tức phú, các bài phú.
- **Độ tin của bản**: sách là cổ thư chuẩn, nhưng **bản này là bản điện tử lưu truyền** (giản thể, chấm câu hiện đại, đã lược bớt — không có Kế thiện thiên, phần thần sát, phần cách cục ngoại cách). Ghi `can_doi_chieu: true`; khi có bản khắc (ctext res=307303 hoặc bản Tứ khố) thì so lại.
- **Dùng ngay cho người đọc**: 10 trang nhật chủ (`/bat-tu/nhat-chu/*`, cả bản Anh) thêm mục «Uyên Hải Tử Bình tả can … thế nào» = tóm ý (ban biên tập viết, nháp, lời trung tính) + nguyên văn bài thơ. KB `battu_kb.co_tho`; test bắt nguyên văn trong KB phải có trong kho nguồn.
- **Chưa dùng** (đề xuất đợt sau, cần viết lời Việt + duyệt): thi quyết mười thần cho 10 trang thập thần; thiên «Luận tính tình» (đối chiếu chương Con người bạn); «Luận nhật vi chủ», «Luận nguyệt lệnh» làm trích dẫn cho "Vì sao nói vậy"; 12 bài địa chi thể tượng. **Không dùng**: «Luận tật bệnh» (tên bệnh — trái SK-1), «Cách cục sinh tử dẫn dụng», phần nữ mệnh "quý / tiện", "tiểu nhi quan sát" (phán sống chết, phán phẩm giá — trái quy tắc lời luận); để nguyên trong kho nguồn làm tư liệu, không đưa vào lời.

### 10.6 Q5 + thi văn mười thần (2026-11-12, chủ dự án giao em quyết theo thứ tự đề xuất)

**Q5 — bảng hỷ / kỵ cách cục (dụng thần cách 2).** Đọc lại hai thiên «Luận dụng thần» và «Luận dụng thần thành bại cứu ứng»:
trong 4 chỗ nghi lệch, chỉ **2 chỗ thật sự cần sửa** — hai chỗ kia KB đã thể hiện đúng ý sách qua nhánh thân yếu.

| Cách | Trước | Sau | Căn cứ |
|---|---|---|---|
| Thất Sát (thân không yếu) | hỷ Thực Thương, Ấn; kỵ — | hỷ Thực Thương; kỵ Tài; Ấn trung tính | «七煞喜食神以制伏，忌财印以资扶»; «七煞逢财无制，七煞格败也»; «七煞逢食制而又逢印» là "đái kỵ". Thân yếu giữ hỷ Ấn (Sát Ấn tương sinh) |
| Chính Ấn, Thiên Ấn (thân yếu, cân) | hỷ Quan Sát | hỷ Quan Sát, Tỷ Kiếp | «印喜官煞以相生，劫才以护印» |
| Thực Thần | — | **không sửa** | «食喜身旺以相生»: nhánh thân yếu đã hỷ Tỷ Kiếp |
| Thương Quan | — | **không sửa** | «伤官喜佩印以制伏»: nhánh thân yếu đã hỷ Ấn; thân mạnh dùng Tài («生财以化伤») |

Tác động đo trên 300 lá mẫu (`scripts/thong_ke_hy_ky.py --de-xuat`): 100 lá thuộc ba cách này; trong đó 5 % đổi nhãn "Con người",
8 % "Năng lượng", 4 % "Gia đình", 9 % đại vận; công việc / tiền bạc / tình cảm không đổi. Tính trên mọi lá: khoảng 3 % lá đổi một nhãn.
Phân bố nhãn vẫn trong ngưỡng 10–60 %. Tứ trụ, cách 1, cách cục không đổi. Đổi mức → **`ENGINE_VERSION` 0.1.8**.
Golden: 3/15 lá mẫu Bát tự đổi (đúng ba cách này); mã kiểm chứng của các lá đó sinh lại.

**Thi văn mười thần.** KB `battu_kb.co_van_thap_than`: mỗi thập thần 1–2 câu nguyên văn Uyên Hải Tử Bình (chuỗi con của kho nguồn — test)
+ tóm ý Việt và Anh (nháp, lời trung tính; bỏ các câu phán khắc vợ / khắc chồng / thọ yểu). Hiện ở 10 trang `/bat-tu/thap-than/*`.
Tỷ Kiên bản này chỉ có câu rất ngắn («比肩者，兄弟也») — đủ dùng, sẽ bổ sung khi có bản đủ.

### 10.7 Tử vi: phụ tinh ở từng cung theo Toàn Thư quyển 3 (2026-11-12)

Đánh giá trước khi làm: phần «luận mười hai cung» của Toàn Thư có 289 đoạn, nhưng **một nửa không dùng được cho người đọc** —
ở cung Huynh Đệ, Phu Thê, Tử Nữ, Phụ Mẫu, Tật Ách sách đoán số anh em, số con, hình khắc cha mẹ, thương tật ("三人", "刑克", "四肢必伤残").
Đưa các câu đó thành lời Việt là trái quy tắc lời luận (không phán, không doạ, SK-1). Vì vậy chỉ làm phần có ích:

- KB `tuvi_kb.phu_tinh_cung`: **52 mục = 9 phụ tinh** (Văn Xương, Văn Khúc, Tả Phù, Hữu Bật, Lộc Tồn, Kình Dương, Đà La, Hỏa Tinh,
  Linh Tinh) **× 6 cung về việc và nếp sống** (Tài Bạch, Quan Lộc, Thiên Di, Phúc Đức, Điền Trạch, Nô Bộc). Mỗi mục: `trich` =
  nguyên văn đoạn sách (test bắt phải là đoạn của kho nguồn) + `y` = tóm ý Việt bằng lời hành vi, kèm một việc nên làm (nháp).
- Người dùng thấy ở đâu: bấm một phụ tinh trong **chi tiết cung** của lá số → hiện nghĩa riêng ở cung đó (trước chỉ có một câu chung
  cho mọi cung); hỏi đáp "Kình Dương của tôi thế nào" → thêm câu "Riêng ở cung …, sách xưa ghi: …".
- Không đổi mức, không đổi phép tính, không đưa vào chấm hộp báo cáo (đợt sau, cần đo trước).
- **Chưa làm và vì sao**: lời Việt cho 14 chính tinh × 12 cung của Toàn Thư (KB đời sống đã có lời riêng 14 × 12 × sáng / hãm — thêm
  lớp nữa sẽ lặp, cần so từng ô với nguyên văn thay vì viết mới: việc của đợt đối chiếu); 20 thiên luận hạn quyển 3 (nhiều câu đoán
  hoạ, cần chọn lọc từng thiên); Địa Không / Địa Kiếp / Khôi Việt theo cung (sách chỉ có 1–4 đoạn, không đủ 6 cung).


### 10.8 Bát tự: cách cục đặc biệt theo «Luận tạp cách» (KT-TT4, 2026-11-12)

**Đánh giá trước khi làm.** Hệ thống chỉ định cách theo tháng sinh (bát chính cách + Lộc / Nhận). Sách Tử Bình Chân Thuyên có riêng
thiên «Luận tạp cách» cho lá số "tháng sinh không dùng được", trong đó bốn loại sách cho là có lý: một hành đắc thế (取五行一方秀气),
hoá khí (从化取格), bỏ mệnh theo Tài (弃命保财), bỏ mệnh theo Sát (弃命从煞). Với những lá này, cách đọc của sách **ngược** hẳn cách
"cân sức" (cách 1 bảo bù phần thiếu; sách bảo đi theo phần đang mạnh). Tác động: hiếm (30 / 5.000 lá mẫu ≈ 0,6 %) nhưng đúng chỗ
người có lá số ấy hay thấy "bài đọc không giống mình".

**Chọn cách làm** (3 hướng): (a) tự xếp lá vào cách đặc biệt và đổi hỷ / kỵ, mức — **loại**: ranh giới "thật tòng / giả tòng" các
nhà cãi nhau, đổi mức cần đo và tăng `ENGINE_VERSION`; (b) không làm — bỏ sót đúng nhóm người đọc khó tính nhất; (c) **làm**: chỉ
NHẬN DIỆN bằng điều kiện chặt theo chữ sách và thêm MỘT hộp "Một cách đọc khác" trong chương Năng lượng, có nguyên văn, nói rõ có
thể ngược hai cách trên, hệ thống không chọn thay. Không đổi cách cục, dụng thần, mức.

**Đã làm.**
- CALC `engine/app/calc/battu_ngoai_cach.py` (`nhan_dien(tru)`), test viết trước `tests/test_battu_ngoai_cach.py`: golden = chính
  4 mệnh ví dụ của sách (吴相公, mệnh 丁壬化木, 王十万, 李侍郎); ca phản chứng (lộ Quan Sát, không đắc lệnh, nhật chủ có gốc, lộ
  Thực / Ấn, chi ngoài cục là Sát); câu hỷ / kỵ `TRICH` phải là chuỗi con nguyên văn kho nguồn; trên 5.000 lá mẫu < 2 %.
- Điều kiện: chuyên vượng = sinh tháng cùng hành + đủ tam hợp / tam hội (Thổ: bốn chi Thổ) + can không lộ Quan Sát, chi không có
  Sát, Tài lộ ≤ 1; hoá khí = can ngày ngũ hợp can tháng / giờ + hành hoá đắc lệnh + đủ cục + không lộ hành khắc; tòng Tài / Sát =
  nhật chủ không gốc ở chi nào + tháng và ≥ 3 chi là hành ấy (chi còn lại sinh nó) + điều kiện "không tòng" của sách.
- **Không làm** các cách sách gọi "mượn chữ không có" (đảo xung, triều dương, hợp lộc, tỉnh lan, hình hợp, dao hợp) và loạt cách
  sách bảo bỏ (củng lộc, khôi cương, nhật đức…); chưa làm tòng nhi, giả tòng, hoá khí "thứ đẳng" (tháng Hợi / Mùi) — sách không nêu
  đủ điều kiện.
- RULES: `battu_doi_song._hop_ngoai_cach` — hộp `loi_khuyen`, mã `ds.bt.ngu_hanh.ngoai_cach.<mã>.<hành>.khuyen` (qua ràng buộc SQL
  sẵn có, vào vòng kiểm chứng "Đúng với mình"); lời đời thường ở KB `battu_doi_song_kb.ngoai_cach` (vi + en, nháp), thuật ngữ +
  nguyên văn chỉ ở "Vì sao nói vậy".
- Không đổi mức / phép tính cũ → không tăng `ENGINE_VERSION` (0.1.8). Web không đổi (hộp đi qua khung báo cáo có sẵn).
- **Đo tiếp**: tỉ lệ "Đúng với mình" của hộp này so với hộp Cách 1 / Cách 2 trên cùng lá — đủ phiếu thì mới xét đưa vào hỷ / kỵ.

### 10.9 Kinh Dịch: thế chung của quẻ theo Tăng San Bốc Dịch (KT-TT5, 2026-11-12)

**Đánh giá trước khi làm.** Bài đọc Lục Hào mới xét từng hào (dụng thần, động hoá, không / phá / mộ); chưa nói gì về tính chất của
CẢ quẻ — thứ người học Lục Hào nhìn đầu tiên: quẻ lục xung (10 quẻ), lục hợp (8 quẻ), du hồn (8), quy hồn (8), và quẻ biến từ
xung sang hợp / hợp sang xung. 34 / 64 quẻ có ít nhất một nét → hơn nửa số lần gieo có thêm một ý đúng sách, dễ hiểu ("việc dễ
tan / dễ kết / lúc đầu thuận về sau dễ rời").

**Nguồn.** Tăng San Bốc Dịch (增刪卜易, Dã Hạc lão nhân, đời Thanh — công cộng), bản Wikisource tiếng Trung: nạp 4 chương engine
đang dùng (六合, 六沖, 反伏, 歸魂遊魂) vào `engine/fixtures/nguon/tang_san_boc_dich.json` bằng `scripts/nap_tang_san_boc_dich.py`.
Bản gõ lại (trang ghi chất lượng 50 %) → `can_doi_chieu: true`.

**Đã làm.**
- CALC `luc_hao.tinh_chat_que(que)` (test viết trước, `tests/test_kt_tt5_tinh_chat_que.py`): lục xung / lục hợp tính từ địa chi nạp
  giáp ba cặp hào 1–4, 2–5, 3–6 (ra đúng 10 + 8 quẻ kinh điển); du hồn / quy hồn đọc từ bát cung đã có; biến xung ↔ hợp theo đúng
  các ví dụ của sách (乾之泰, 離之旅, 否之乾, 旅之賁).
- KB `kinhdich_tra_loi.tinh_chat_que` (nháp): mỗi nét một câu đời thường + câu sách (test: phải là chuỗi con nguyên văn).
- RULES `kinhdich_doi_song.the_que`: bài đọc thêm dòng "Thế chung của quẻ: …" + mục "Lục Hào — thế quẻ" ở "Vì sao nói vậy" (thuật
  ngữ + nguyên văn) + trường `tinh_chat_que`. Luôn kèm lời sách dặn «須以用神爲主» — chỉ là nét phụ.
- **Không đổi mức, không đổi mã kiểm chứng** (test khoá). Sách cho quẻ "lục xung biến lục hợp" được đoán tốt không cần xét dụng
  thần — hệ thống KHÔNG theo điểm này (chỉ nêu ý), tránh thành lời phán.
- Chưa làm: phản ngâm / phục ngâm cấp quẻ (chương 反伏 đã nạp, CALC mới có cấp hào), tam hợp cục trong quẻ, quẻ hợp xứ phùng xung
  theo ngày tháng.
- Golden đầu ra bản Việt đổi có chủ đích: 516 lượt, đều là Kinh Dịch. Không tăng `ENGINE_VERSION`.

### 10.10 Thang độ tin cho kho tri thức (KT-TT6, 2026-11-12)

**Đánh giá trước khi làm.** Ý ban đầu "gắn độ tin cho MỌI mục KB" (hàng nghìn mục) — **không làm theo kiểu đó**: máy tự dán nhãn
từng mục mà không đối chiếu được thì chính là nhãn giả. Cách có ích và trung thực: mức ghi theo TỆP / PHẦN, do người ghi, và mức
cao nhất phải chứng minh được bằng máy.

**Đã làm.**
- Sổ `engine/app/kb/do_tin.py`: 78 tệp KB + các phần riêng, thang năm mức — có nguyên văn đối chiếu · tóm ý cổ thư chưa khớp từng
  câu · tập quán / sách hiện đại tóm ý · ban biên tập soạn · tệp kỹ thuật.
- Test `tests/test_do_tin_kb.py`: tệp KB mới chưa vào sổ → đỏ; mức "có nguyên văn" phải nêu tệp kho nguồn CÓ THẬT và hàm test CÓ
  THẬT; phần ghi trong sổ phải tồn tại trong tệp; sổ không lộ ra API (BM-1).
- Báo cáo `docs/DO-TIN-KHO-TRI-THUC.md` dựng bằng `scripts/do_tin_kb.py` (test bắt quên chạy).
- Số hiện tại: 10 tệp / phần có nguyên văn đối chiếu (Bát tự 4 gồm bảng điều hậu, Kinh Dịch 4, Tử vi 1, Tarot 1); phần lớn lời đời
  thường là "ban biên tập soạn" — đúng bản chất, không tô thêm.
- Mức **không** phải "đã thẩm định" và không hiện cho người dùng; không đổi đầu ra nào của engine.

**Dùng để làm gì tiếp.** Thứ tự nâng mức đề xuất (mỗi việc = nạp nguyên văn + test): (1) `tuvi_co_thu.json` nối test với kho Toàn
Thư (Cốt Tuỷ Phú đã có nguyên văn); (2) `tuvi_cach_cuc.json` (cổ ca cách cục) ; (3) `nhan_tuong_kb.json` (130 câu trích, chưa có
kho nguồn Ma Y); (4) `phongthuy_huyen_khong.json` (Thẩm thị); (5) chương 反伏 của Tăng San Bốc Dịch → phản / phục ngâm cấp quẻ.

### 10.11 Tử vi: Cốt Tuỷ Phú và cách cục nối với kho nguồn Toàn Thư (KT-TT7, 2026-11-12)

Việc đầu trong thứ tự nâng mức của mục 10.10.

- **Cốt Tuỷ Phú**: 84 câu phồn thể trong `tuvi_co_thu.json` nay có test so TỪNG CHỮ với bài 斗数骨髓赋 trong kho nguồn Toàn Thư
  (bản chép giản thể): cùng 84 dòng, 1.522 / 1.522 chữ, chữ khác nhau chỉ được là 151 cặp giản → phồn đã đóng băng
  (`tests/test_tuvi_co_thu.py::test_nguyen_van_khop_kho_nguon_toan_thu_tung_chu`). Sổ độ tin: phần `cau` lên mức "có nguyên văn đối
  chiếu" (11 tệp / phần). Vẫn `can_doi_chieu` với bản khắc 1600.
- **Cách cục**: Toàn Thư quyển 1 có bốn danh sách «định phú cục / quý cục / bần tiện cục / tạp cục» (59 dòng). Chỉ **6 / 75** cách
  của hệ thống trùng tên và có điều kiện ghi rõ (16 dòng khác ghi "xem chú ở trên", còn lại là cách hệ thống không có). Sáu cách ấy
  nay có `sach_ghi` (nguyên văn + tóm ý), đi kèm lá số và gói bằng chứng hỏi đáp.
- **Bốn cách điều kiện đang KHÁC sách — CHƯA sửa, chờ anh quyết** (sửa = đổi kết quả nhận diện cách cục trên lá số):

| Cách | Hệ thống đang dùng | Toàn Thư ghi |
|---|---|---|
| Mã đầu đới kiếm | Kình Dương thủ Mệnh tại Ngọ | Thiên Mã đi cùng Kình Dương — "không phải cách ở Ngọ" |
| Quân thần khánh hội | Tử Vi thủ Mệnh, hội ≥ 3 trong 7 cát tinh | Tử Vi cùng Tả Phù, Hữu Bật thủ Mệnh |
| Nguyệt sinh thương hải | Thái Âm + Thiên Đồng thủ Mệnh tại Tý | Thái Âm ở Tý và cung ấy là Điền Trạch |
| Lộc Mã bội ấn | Lộc, Mã, Thiên Tướng hội tam phương Mệnh | Cung ngay trước Thiên Mã có Lộc và Thiên Tướng cùng ở |

  Ghi chú: "Mã đầu đới kiếm" có hai cách hiểu lưu hành; cách đang dùng là cách phổ biến ở sách Việt hiện nay. Em đề xuất: theo sách
  cho Quân thần khánh hội và Nguyệt sinh thương hải (đang nhận rộng hơn sách), giữ hai cách còn lại và ghi rõ "sách chép khác".

### 10.12 Tử vi: sửa hai cách cục theo Toàn Thư (KT-TT8, 2026-11-13)

Anh duyệt đề xuất ở mục 10.11.

- **Quân thần khánh hội** = Tử Vi cùng Tả Phù và Hữu Bật ở cung Mệnh (定贵局: 紫微左右同守命). Trước: Tử Vi thủ Mệnh hội ≥ 3 / 7
  cát tinh. Trên 1.000 lá mẫu: **43 → 1 lá**. Tả Hữu chỉ chiếu / giáp Mệnh là cách khác của sách («Phụ bật củng chủ») — hệ thống
  CHƯA có cách này; thêm sau nếu anh muốn.
- **Nguyệt sinh thương hải** = Thái Âm ở cung Tý và cung ấy là Điền Trạch (月在子宫守田宅). Trước: Thái Âm + Thiên Đồng thủ Mệnh
  tại Tý. Trên 1.000 lá: **5 → 12 lá**; lời đời thường đổi sang phúc nhà cửa, chỗ ở.
- **Mã đầu đới kiếm**, **Lộc Mã bội ấn**: giữ cách hiểu đang lưu hành ở sách Việt, vẫn gắn `khac_dieu_kien` ("sách chép khác").
- Đổi kết quả nhận diện trên lá số → **`ENGINE_VERSION` 0.1.9**; golden cách cục 1.000 lá + golden đầu ra bản Việt sinh lại có chủ đích.

### 10.13 Nhân tướng: kho nguồn đợt 1 và câu trích sai (KT-NT1, 2026-11-13)

- **Kho nguồn** `engine/fixtures/nguon/nhan_tuong_co_thu.json` (dựng bằng `scripts/nap_nhan_tuong_co_thu.py` từ Wikisource tiếng
  Trung, `can_doi_chieu: true`): 冰鑑 Băng Giám (7 chương), 心相篇 Tâm Tướng Thiên (bản giản thể), 靈樞經 · 五色第四十九 (bản Tứ khố).
- **Đối chiếu 11 câu trích của KB ghi ba sách này: chỉ 1 câu có thật** («一身精神，具乎兩目»). 10 câu kia là câu phú tự đặt rồi gán
  tên sách, kể cả cả 3 câu ghi Tâm Tướng Thiên. Đã sửa:
  - 8 câu thay bằng câu CÓ trong sách và hợp ý mục (Băng Giám: «光焰不發，珠玉與瓦礫同觀», «肥不熊餐，瘦不鵲寒», «靜若含珠，動若水發»,
    «欲辨邪正，先觀動靜», «在面以眉骨、顴骨為主», «始於丹田，發於喉»; Tâm Tướng Thiên: «心者貌之根，审心而善恶自见»; Linh Khu:
    «下極者，心也»). Mỗi câu có trường `han` (nguyên văn) để test so.
  - 2 câu bỏ hẳn (nếp dọc Ấn Đường, Pháp Lệnh): sách không bàn chuyện này.
  - Lời đời thường đi kèm sửa cho khớp, ví dụ Sơn Căn chỉ còn "tim mạch" vì Linh Khu không nói tiêu hoá.
- Test `engine/tests/test_kt_nt1_kho_nguon.py`: câu trích ghi một trong ba sách phải có `han` khớp nguyên văn (bỏ dấu câu).
- **Chưa kiểm**: 17 câu ghi Ma Y Thần Tướng / Thần Tướng Toàn Biên / Thuỷ Kính. Tỉ lệ sai ở đợt này cho thấy phần lớn chúng cũng sẽ
  sai, nên cần bản quét để đối chiếu (danh sách sách ở `docs/VIEC-CUA-ANH.md` mục KT-NT1).

### 10.14 Nhân tướng: kho nguồn đợt 2, mọi câu trích đều khớp sách (KT-NT2, 2026-11-13)

**Đánh giá nguồn anh gửi (Drive "nhân tướng")**

| Tệp | Chất lượng | Dùng được? |
|---|---|---|
| 3 tệp "Full text of …" (.html) — Thần Tướng Toàn Biên, Thuỷ Kính Tập, Liễu Trang | Chữ do máy archive.org tự nhận dạng từ bản khắc gỗ chữ dọc: toàn chữ giản thể vô nghĩa xen chữ Latin. Không có lần nào xuất hiện 三停, 印堂, 山根, 法令, 準頭… | **Không** — cần nạp lại |
| PDF Liễu Trang (袁柳莊先生神相全編, Quang Tự 15, 95 trang đôi, 46 MB) | Bản quét rõ nét, đọc được từng chữ khi phóng to; không có lớp chữ | Dùng làm bản gốc đối chiếu; muốn thành kho nguồn phải gõ lại |
| PDF Thần Tướng Toàn Biên (bản Minh, Trí Hoà đường, 562 MB) | Bản quét; không có lớp chữ | Như trên |
| Thuỷ Kính Tập | Chỉ có tệp chữ máy nhận dạng hỏng, không có PDF | Thiếu |

**Em lấy thay bằng bản gõ đã chấm lại**: bốn sách tướng thuật trong Tứ khố toàn thư (Kanseki Repository, bản Văn Uyên Các) —
月波洞中記 (Nguyệt Ba Động Trung Ký), 玉管照神局 (Ngọc Quản Chiếu Thần Cục), 太清神鑑 (Thái Thanh Thần Giám), 人倫大統賦
(Nhân Luân Đại Thống Phú, kèm chú Tiết Diên Niên). Thần Tướng Toàn Biên chép lại nhiều phần của bốn sách này. Nạp vào
`engine/fixtures/nguon/nhan_tuong_co_thu.json` bằng `engine/scripts/nap_nhan_tuong_co_thu.py`.

**Kết quả đối chiếu 17 câu còn lại** (ghi Ma Y / Thần Tướng Toàn Biên / Thuỷ Kính): không câu nào có đúng chữ trong các sách đã
có. 15 câu thay bằng câu CÓ THẬT trong bốn sách Tứ khố và hợp ý mục (vd «三停平等能和美», «日月角為父母宫», «準頭齊者心性慈»,
«目下臥蠶紋當生貴子孫», «地閣方停萬頃田»); 2 câu bỏ (Điền Trạch, mắt tam bạch — không tìm được câu sách hợp ý). Lời đi kèm sửa
cho khớp (bỏ "anh em hoà thuận" ở mục lông mày, "khẩu như giốc cung" → "miệng như cánh cung"…). Nay **cả 25 câu trích** của KB
Nhân tướng có nguyên văn chữ Hán (`han`) và test bắt buộc mọi câu trích ghi sách có kho nguồn
(`engine/tests/test_kt_nt1_kho_nguon.py`). Trường `nguon` cấp mục (Ma Y, Thần Tướng Toàn Biên) vẫn chỉ là ghi phái của phần tóm ý.

**Còn lại (không gấp)**: muốn đưa nội dung riêng của Liễu Trang / Ma Y vào lời luận thì phải có bản gõ; em có thể gõ dần từ PDF
Liễu Trang theo từng thiên khi cần (chậm, phải soát).

### 10.15 Ba việc dùng nguồn sẵn có (KT-N1, 2026-11-13)

Anh giao làm nhóm 1 của đề xuất; em đánh giá từng việc trước khi làm.

1. **Nhân tướng — thêm câu sách thật**: 105 nét chưa có câu trích. Phần lớn nét "cần lưu ý" chỉ có câu sách mang giọng phán
   (nghèo, yểu, hình khắc) → **không đưa**. Thêm 18 câu trung tính, đúng ý nét (năm hình Kim / Mộc / Thuỷ / Hoả / Thổ, mắt, mũi,
   môi, hàm, trán, xương – thịt, ánh mắt, quầng mắt, dáng mặt cân đối) → 43 câu, câu nào cũng có `han` khớp kho nguồn. Câu trích
   ở "Vì sao nói vậy" và trang bộ vị nay hiện cả chữ Hán. **12 cung trên mặt**: KB theo lối Ma Y (Tài Bạch ở mũi, Huynh Đệ ở mày,
   Quan Lộc ở trán); Thái Thanh Thần Giám chép lối cổ hơn (Tài Bạch ở Thiên Thương – Địa Khố, Huynh Đệ ở góc trán, Quan Lộc ở
   chính diện). Hai lối cùng tồn tại; giữ lối Ma Y vì phổ biến, ghi lại để người duyệt biết.
2. **Kinh Dịch — Tự Quái nguyên văn**: 64 trang quẻ có câu Tự Quái của đúng quẻ (cắt từ kho Truyện Nghĩa, test khớp nguyên văn);
   phần diễn ý giữ nguyên bên dưới.
3. **Tử vi — cách «Phụ Bật củng chủ»** (定贵局: «紫微守命二星来拱是也，夹之亦然»): Tử Vi thủ Mệnh, Tả Phù + Hữu Bật cùng về tam
   phương tứ chính hoặc kẹp Mệnh; cùng ở Mệnh vẫn là Quân Thần Khánh Hội. 1.000 lá mẫu: 14 lá (88 lá Tử Vi thủ Mệnh). Nối cuối
   danh sách (76 cách), cách cũ không đổi → không tăng `ENGINE_VERSION`. 16 dòng sách ghi "xem chú ở trên" là cách trùng tên câu
   phú đã có, chưa rà thêm.

