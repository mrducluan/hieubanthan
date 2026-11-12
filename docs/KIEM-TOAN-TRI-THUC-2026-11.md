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
