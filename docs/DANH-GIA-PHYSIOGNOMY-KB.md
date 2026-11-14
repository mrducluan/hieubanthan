# Đánh giá bộ database "physiognomy-kb" (Nhân tướng · Phong thuỷ · Tarot) và cách nạp vào HieuBanThan

Ngày 14/11/2026. Căn cứ: tài liệu bàn giao anh gửi (bản cập nhật 14/11/2026) + kịch bản trích xuất trên Drive
("Python Script PyMuPDF + Vision AI") + kho tri thức đang chạy trong repo.

**Trạng thái (cập nhật cuối ngày 14/11): em ĐÃ đọc database** từ thư mục Drive anh chia sẻ (hai tệp `.sqlite`, tệp JSON
Tarot, mã trích xuất; thư mục ảnh `assets/diagrams/` không có trong bản tải lên). Kết quả kiểm trên dữ liệu thật và phần đã
nạp nằm ở **mục 8**; các mục 1–7 là đánh giá ban đầu theo tài liệu bàn giao, giữ lại để đối chiếu.

Mục tiêu sản phẩm: nền móng độ đúng cho khâu QUAY LẠI (lời luận truy được về sách) + khâu THU HÚT (trang kiến thức có
nguyên văn, đồ hình cổ). Đo: số phần ở mức "có nguyên văn đối chiếu" trong `docs/DO-TIN-KHO-TRI-THUC.md`
(Phong thuỷ hiện 0, Nhân tướng 0 phần trọn).

## 1. Kết luận ngắn

| Phần của database | Giá trị với HieuBanThan | Quyết định |
|---|---|---|
| **Dương Trạch Tam Yếu, Bát Trạch Minh Kính** | Rất cao — đúng hai sách em xin ở `docs/SACH-CAN-NAP-KB.md` nhóm A ưu tiên 1; Phong thuỷ hiện chưa có câu sách nào | Nạp trước, sau khi qua cổng kiểm mục 4 |
| **Thần Tướng Toàn Biên, Liễu Trang, Thuỷ Kính Tập** (≈ 1.000 tiết đoạn) | Cao — 17 câu ghi Ma Y / Liễu Trang đã phải bỏ ở KT-NT2 vì thiếu bản gõ tin được | Nạp, nhưng đây là phần **rủi ro sai chữ lớn nhất** (mục 3.1) |
| **326 đồ hình khắc gỗ** | Cao cho trang kiến thức + tìm kiếm hình ảnh; tranh khắc đã thuộc công chúng | Dùng, sau khi kiểm từng ảnh cắt đúng hình, ghi bản in gốc |
| Địa Lý Ngũ Quyết, Thuỷ Long Kinh, Tứ Đạn Tử, Tuyết Tâm Phú, Bạt Sa Kinh | Vừa — chủ yếu long mạch, huyệt mộ (công cụ **không mở âm trạch**); dùng được phần thế đất, dòng nước, đường quanh nhà | Chỉ lấy phần dương trạch / ngoại cảnh, làm sau |
| "Động cơ Ngũ Hành Loan Đầu" | Chưa rõ — phải xem từng luật có câu sách không | Xét sau khi đọc mã; luật không có câu sách thì không dùng |
| **Tarot** (Bunning + Pollack) | Thấp — HieuBanThan đã có 78 lá từ nguồn công chúng (Waite 1910, Book T, Mathers 1888), xuôi / ngược × 4 lĩnh vực, 624 việc, 7 trải bài | **Không nạp câu chữ** (mục 3.3) |

## 2. Đối chiếu với kho đang chạy

| Mảng | HieuBanThan đang có | Database của anh thêm được gì |
|---|---|---|
| Nhân tướng | 25 bộ vị, 100 vị lưu niên, 130 đặc điểm, 13 nốt ruồi; 43 câu sách khớp kho nguồn (Băng Giám, Tâm Tướng Thiên, Linh Khu, 4 sách tướng Tứ khố). **Chưa có** Thần Tướng Toàn Biên, Liễu Trang, Thuỷ Kính | Nguyên văn 3 sách gốc của lối Ma Y (lối mà 12 cung trên mặt của KB đang theo), đồ hình bộ vị, lưu niên, nốt ruồi |
| Phong thuỷ | 8 du niên, 8 quái, 54 mục bố trí, 81 tổ hợp Huyền Không — tất cả là **tóm ý, 0 câu nguyên văn** | Câu sách cho du niên, cửa – chủ – bếp, tĩnh / động / biến trạch |
| Tarot | Đủ, có nguyên văn đối chiếu | Gần như không; chỉ vài ý trình bày (mục 3.3) |

## 3. Ba điều cần biết trước khi nạp

### 3.1 Chữ Hán trong database có thể không phải chữ trên trang sách

Kịch bản trích xuất trên Drive dặn máy đọc ảnh: *"nếu có chữ bị mờ, hãy dùng tri thức nguyên tác để khôi phục đúng chữ"*.
Nghĩa là chỗ ảnh mờ, máy **viết theo trí nhớ** chứ không đọc trang — kết quả trông trôi chảy nhưng có thể là câu của bản
khác, hoặc câu không có trong sách. Dòng "0 lỗi `□`" trong tài liệu bàn giao vì thế không chứng minh chữ đúng; nó chỉ cho
biết máy không để trống.

Em đã gặp đúng chuyện này ở KT-NT1: 10 / 11 câu "trích sách" do AI nhớ lại không có trong sách. Quy tắc dự án ("kho nguồn
trước, lời sau") đòi nguyên văn phải kiểm được, nên phần này **phải qua kiểm mẫu với ảnh trang** rồi mới gọi là nguyên văn.

### 3.2 Bản dịch tiếng Việt trong database là máy dịch

Dương Trạch Tam Yếu và Bát Trạch Minh Kính ghi "đã dịch 100%". Bản dịch đó chưa ai rành Hán văn đọc lại, nên em dùng làm
**bản tham khảo** để viết tóm ý (trạng thái nháp, như mọi lời KB khác), không đưa nguyên vào trang. Việc để trống
`translation_vi` ở Thuỷ Kính và Toàn Biên là quyết định đúng.

Lọc nội dung như các đợt trước: sách tướng có nhiều câu phán nghèo, yểu, hình khắc, "tướng đàn bà" — không đưa vào lời luận.

### 3.3 Tarot: hai sách còn bản quyền

*Learning the Tarot* (Joan Bunning, 1998) và *Seventy-Eight Degrees of Wisdom* (Rachel Pollack, 1980) đều còn bản quyền.
Tài liệu bàn giao đã đúng khi chặn PDF và `tarot_raw_78.json` khỏi git. Em đi thêm một bước:

- **Không làm Module 1 theo cách đề xuất** ("đọc 375 nghìn ký tự của Pollack rồi diễn đạt lại 100% cho 56 lá"). Diễn đạt lại
  có hệ thống từng lá của một cuốn sách vẫn là tác phẩm phái sinh; đổi câu chữ không đổi được điều đó. Quy tắc dự án với sách
  hiện đại là tóm ý ở mức ý tưởng + ghi nguồn.
- Phần 22 lá ẩn chính đã viết trong database: em chỉ đọc để xem có **ý trình bày** nào hay (ví dụ đời thường cho từng lá),
  rồi tự viết từ nghĩa Waite 1910 nếu đáng làm.
- "Cặp lá tương hỗ / đối lập" của Bunning là bảng do tác giả tự lập → không chép. HieuBanThan đang tính bằng phẩm giá
  nguyên tố của Book T (nguồn công chúng, có test khớp nguyên văn).

Nguồn Tarot đáng làm tiếp là thứ anh đã để trên Drive: Papus 1919 và Paul Foster Case — để nâng lớp Marseille / B.O.T.A.
từ "tóm ý" lên có câu đối chiếu. Bản tiếng Anh của Wirth (dịch 1985) còn bản quyền dịch, chỉ tóm ý.

## 4. Bốn module trong tài liệu bàn giao

| Module | Quyết định | Lý do |
|---|---|---|
| 1. Diễn giải sâu 56 lá từ Pollack | Không làm theo cách đó | Mục 3.3; 56 lá đã có nghĩa xuôi / ngược × 4 lĩnh vực + 624 việc từ nguồn công chúng |
| 2. Đồ thị liên ngành (Ngũ hành ↔ 4 nguyên tố, bộ vị ↔ cung hoàng đạo) | Không làm | Không cổ thư nào ghép hai hệ này; dự án đã bác cùng loại ở CD-1 ("trục ngũ hành") và Q6. Liên môn hiện có dựa trên **mức đã chấm** của từng môn, không bịa phép quy đổi |
| 3. Trải bài 3 lá, Celtic Cross, tương tác lá | Đã có | 7 trải bài, kề cận, phẩm giá Book T, hướng nhìn Marseille (TR-1 → TR-5) |
| 4. Giao diện tra cứu | Đã có | `/tarot`, `/nhan-tuong`, `/phong-thuy`; phần mới đáng thêm là tra đồ hình (mục 6) |

## 5. Cách đưa database sang đây

Em cần: hai tệp `.sqlite`, `tarot_knowledge_base.json`, thư mục `assets/diagrams/`, mã trong `extractor/`. **Không cần** PDF,
`tarot_raw_78.json`, `.venv`.

**Cách A — nén rồi đưa lên Drive (em khuyên dùng, khoảng 2 phút).** Chạy trên máy anh:

```bash
cd /Users/mrducluan/aicoworker/openclaw/workspace-main/projects && zip -r physiognomy-kb-export.zip physiognomy-kb -x "*/.venv/*" "*/__pycache__/*" "*/.git/*" "*/data/downloads*/*" "*.pdf" "*/data/tarot_raw_78.json" "*/.env*" "*/tmp/*" "*.log"
```

Kéo tệp `physiognomy-kb-export.zip` lên Drive → Chia sẻ → "Bất kỳ ai có đường liên kết" → gửi em link (như bảng danh sách
sách hôm qua). Em tải về vùng làm việc tạm, không đưa tệp gốc vào repo.

**Cách B — kho GitHub riêng tư.** Đẩy thư mục lên một repo private (đã có `.gitignore` chặn PDF) rồi cho phiên này quyền đọc.
Hợp khi anh còn sửa database tiếp và muốn em luôn đọc bản mới.

**Cách C — mở phiên Claude Code ngay trên máy anh** trong thư mục `hieubanthan`. Phiên đó đọc thẳng được thư mục database,
không phải tải lên. Hợp khi tệp quá lớn (ảnh trang đầy đủ) hoặc anh không muốn dữ liệu rời máy.

## 6. Quy trình nạp khi có dữ liệu

Mỗi bước một PR; bước sau chỉ chạy khi bước trước qua.

1. **Kiểm kê**: đọc cấu trúc bảng, đếm lại theo sách, so với số trong tài liệu bàn giao; tìm tiết đoạn trùng, rỗng, lẫn hai sách.
2. **Kiểm trung thực chữ Hán** (cổng quyết định):
   - mỗi sách rút ngẫu nhiên ~30 tiết đoạn, so từng chữ với ảnh trang trong PDF trên Drive;
   - so tự động các đoạn trùng với kho Tứ khố đã có (Thái Thanh Thần Giám, Ngọc Quản Chiếu Thần Cục… chép chung nhiều
     câu với Thần Tướng Toàn Biên);
   - sai ≤ 1 % số chữ → vào kho nguồn với cờ `can_doi_chieu`; cao hơn → sách đó chỉ làm bản tra, không trích câu.
   Các sách chạy song song (mỗi sách một agent kiểm), em tổng hợp.
3. **Kho nguồn** `engine/fixtures/nguon/<sách>.json` theo quyển / thiên, giữ số trang để truy lại ảnh; test khớp nguyên văn.
4. **Nối vào KB**, theo thứ tự lợi ích:
   - Bát trạch: câu sách cho 8 du niên, cung phi → la bàn, 8 trang cung phi, "Nhà của bạn";
   - Dương Trạch Tam Yếu: cửa – chủ – bếp → KB `bo_tri`, cặp cửa – bếp;
   - Nhân tướng: khôi phục các câu Ma Y / Liễu Trang đã bỏ, thêm câu trung tính cho 25 bộ vị;
   - Đồ hình: ảnh cho trang bộ vị, lưu niên, nốt ruồi (ảnh vào `web/public`, ghi bản in + thư viện giữ bản).
5. Cập nhật sổ độ tin, golden đầu ra bản Việt (đổi có chủ đích), sổ ngày cập nhật.

Phép tính không đổi → không tăng `ENGINE_VERSION`. Không migration, không dependency.

## 7. Ý tưởng mới từ bộ dữ liệu này (chờ anh chọn)

1. **"Xem trang sách gốc"** — ở "Vì sao nói vậy" của Nhân tướng và Phong thuỷ, cạnh câu chữ Hán có nút mở **ảnh mảnh trang
   khắc gỗ** chứa đúng câu đó. Không trang xem tướng tiếng Việt nào làm được; là bằng chứng nhìn thấy cho lời "truy được
   về sách". Khâu QUAY LẠI + niềm tin; đo `chart_interacted{kind=xem_trang_goc}`.
2. **Cụm "Đồ hình cổ"** `/nhan-tuong/do-hinh/…` — mỗi đồ hình một trang: ảnh, chữ ghi trên hình, phiên âm, nghĩa, link bộ
   vị. Khâu THU HÚT qua tìm kiếm hình ảnh; đo Search Console loại Hình ảnh.
3. **Bản đồ mặt hai lớp** — bản đồ SVG hiện tại có công tắc "xem đồ hình gốc" (bách tuế lưu niên đồ) chồng cùng vị trí.
4. **"Cửa – Chủ – Bếp" ba chạm** — công cụ nhỏ theo đúng ba yếu tố của Dương Trạch Tam Yếu, kết quả kèm câu sách; dùng lại
   phép tính Bát trạch đang có (một bộ tính).

Ý 1 và 2 phụ thuộc chất lượng ảnh cắt và kết quả cổng kiểm mục 6.2.

## 8. Kết quả sau khi đọc dữ liệu thật (14/11/2026)

### 8.1 Database thật chứa gì

| Sách (mã) | Số đoạn | Lấy từ đâu | Chất lượng đo được | Dùng thế nào |
|---|---|---|---|---|
| Thần Tướng Toàn Biên (SXQB) | 602 | Wikisource, bản chép trong **Cổ Kim Đồ Thư Tập Thành** quyển 631–644 | Rất tốt: 598 / 602 đoạn trùng từng chữ với bản em tự tải lại; chỗ khác với sách Tứ khố là dị thể (決 / 决, 強 / 强) và dị bản, không phải chữ rác | **Đã nạp** (em tải lại thẳng từ Wikisource để kiểm được về sau) |
| Liễu Trang (YLZ) | 195 | ctext, bản người dùng gõ, lẫn chữ giản thể (准, 克) | Khá, chưa kiểm với bản quét | Chưa nạp — cần so 30 đoạn với PDF trên Drive |
| Thuỷ Kính Tập (SKJ) | 362 | ctext, chữ máy nhận dạng | Kém: nhiều đoạn chữ rác (độ tin tự ghi 0,65) | Không dùng |
| Thuỷ Long Kinh (SLK) | 78 + 221 hình | Wikisource, Tập Thành quyển 671–674 | Tốt | Chưa nạp — sách nói thế nước quanh mộ / nhà, ưu tiên thấp |
| Địa Lý Ngũ Quyết (DLWJ) | 242 | Máy đọc bản in hiện đại, chữ giản thể | Trung bình | Không dùng làm nguyên văn |
| **Dương Trạch Tam Yếu** (YZSY) | 162 | Máy đọc **bản dịch tiếng Việt** hiện đại | **Không có chữ Hán** (0 ký tự); lỗi nhận dạng dấu ("L' tư'ng ứng") | Không phải nguyên văn; bản dịch còn bản quyền → chỉ tham khảo |
| **Bát Trạch Minh Kính** (BTMK) | 171 | Máy đọc bản dịch NXB Hà Nội 2009 | **Không có chữ Hán**; lỗi chính tả ("Cưu tinh", "Bắt quái") | như trên |
| Tứ Đạn Tử, Tuyết Tâm Phú, Bạt Sa Kinh | 20 | Gõ tay vài đoạn | Ít | Chưa dùng |
| 150 "luật", 49 thuật ngữ | — | Máy tự rút / tự nhớ (`vlm_gemini`, `model_knowledge`) | Không có câu sách đi kèm; có luật kiểu "thai hèn" | Không dùng |
| Tarot 78 lá | 78 | Bunning, Pollack | Ô mô tả lá chép **nguyên văn tiếng Anh** của Bunning; tên Việt dạng "Nine of Wands — Chín Gậy"; từ khoá sai chính tả | Không dùng |

Hai điều khác với tài liệu bàn giao:

- "Dương Trạch Tam Yếu và Bát Trạch Minh Kính đã dịch 100 %" thực ra là **chỉ có bản dịch Việt**, không có nguyên văn —
  nên hai sách này chưa lấp được chỗ thiếu câu sách của Bát trạch.
- `tarot_knowledge_base.json` và `tarot_kb.sqlite` cũng chứa nguyên văn sách còn bản quyền, nhưng **chưa nằm trong danh
  sách `.gitignore`** của tài liệu bàn giao. Anh thêm hai tệp này vào trước khi đẩy thư mục đó lên GitHub công khai.

### 8.2 Phát hiện đáng giá nhất: database chỉ đường tới một nguồn tốt hơn

Thần Tướng Toàn Biên có bản gõ sạch trên Wikisource, nằm trong bộ Cổ Kim Đồ Thư Tập Thành (in 1726) — lần trước em tìm theo
tên sách nên không thấy. Cùng bộ đó, quyển 675–677 chép **Dương Trạch Thập Thư** (陽宅十書, đời Minh): sách có đúng phần
gốc của Bát trạch (Đông – Tây tứ mệnh, bài Đại du niên ca, bảng cung phi 180 năm). Em nạp cả hai từ Wikisource.

### 8.3 Đã nạp vào HieuBanThan (KT-NT3 + KT-PT1)

| Việc | Kết quả |
|---|---|
| Kho nguồn `than_tuong_toan_bien.json` | 14 quyển, 699 mục, ~151 nghìn chữ |
| Kho nguồn `duong_trach_thap_thu.json` | 3 quyển, 83 mục, ~30 nghìn chữ (quyển 4 toàn bùa trấn — không nạp) |
| Nhân tướng: câu sách có nguyên văn | 43 → **70** (27 câu trung tính mới cho các nét tướng trước đây chỉ ghi tên sách) |
| **Sửa lỗi** bảng lưu niên | Tuổi 10–11 là **Nhân Luân**, 12–14 là **Địa Luân** (KB cũ ghi Thiên Thành, Thiên Khuếch); 99 vị có chữ Hán, test khoá thứ tự theo bài «流年運氣部位歌» |
| Phong thuỷ: câu sách có nguyên văn | 0 → **15** (8 du niên + 7 dấu hiệu: tứ linh, minh đường, đường đâm, cây chắn cửa, ba cửa thẳng hàng, nhà sáng, nước ôm) |
| **Đối chiếu phép tính** Bát trạch với sách | Bảng du niên 8 quái × 8 hướng **khớp** bài Đại du niên ca; cung phi nam / nữ **khớp cả 180 năm** của bảng «三元甲子福德宮定局» (đã thử hai chu kỳ 1684–2043); không phải sửa phép tính nào |
| Hiển thị | Trang dấu hiệu có mục "Nguyên văn sách xưa"; hỏi đáp về du niên / dấu hiệu kèm câu sách; "Vì sao nói vậy" của Nhân tướng hiện chữ Hán |

Dấu chấm câu trên Wikisource do máy và người dùng thêm, phát hành theo giấy phép CC BY-SA; chính văn thì thuộc công chúng.
Vì vậy hai kho nguồn mới **bỏ hết dấu câu**, chỉ giữ chữ (như các sách Tứ khố). Mọi trang Wikisource của hai sách đang ở mức
"chưa hiệu đính" nên cả hai mang cờ `can_doi_chieu`.

Không đổi phép tính, không đổi mức → không tăng `ENGINE_VERSION`. Không migration, không dependency, web không đổi.

### 8.4 Chưa làm, theo thứ tự nên làm

1. **Ảnh đồ hình**: thư mục `assets/diagrams/` chưa có trên Drive. Anh tải thêm thư mục này thì em kiểm 76 hình tướng
   (bản đồ mặt, lưu niên, nốt ruồi) và làm ý tưởng 1–3 của mục 7.
2. **Liễu Trang**: so mẫu với bản quét rồi nạp làm kho nguồn thứ ba của lối Ma Y.
3. **Dương Trạch Thập Thư, phần còn lại**: «論宅外形» và «內形篇» còn khoảng 40 câu về dấu hiệu quanh nhà, trong nhà có thể
   gắn cho KB `bo_tri` (chỉ lấy câu trung tính; sách có nhiều câu đoán hoạ).
4. **Nguyên văn Dương Trạch Tam Yếu, Bát Trạch Minh Kính** (chữ Hán) vẫn thiếu — cần bản quét chữ Hán, không phải bản dịch.
5. Soát lại giấy phép dấu câu của các kho nguồn Wikisource đã nạp trước đây (Băng Giám, Tăng San Bốc Dịch, Cốt Tuỷ Phú…):
   nếu trang nguồn cũng ghi dấu câu theo CC BY-SA thì bỏ dấu câu như hai kho mới.
