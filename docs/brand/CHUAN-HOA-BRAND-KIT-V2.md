# KIỂM TOÁN THƯƠNG HIỆU 50 NĂM & QUY CHUẨN HỆ THỐNG BRAND KIT v2.0 — HIỂU BẢN THÂN (HIEUBAN.COM)

> **Phiên bản:** 2.0 (Chuẩn hóa Lưới Tỉ Lệ Vàng $\phi = 1.6180339887$ & Hệ sinh thái Truyền thông Đa kênh)  
> **Ngày ban hành:** 26/11/2026  
> **Định vị cốt lõi:** Nền tảng Thấu hiểu Bản thân qua Minh triết Đông – Tây · Tính toán minh bạch · Diễn giải có nguồn · Câu hỏi để tự soi chiếu.

---

## PHẦN 1. ĐÁNH GIÁ KHẮT KHE LOGO & BRAND KIT HIỆN TẠI (v1.0 — 30/10/2026)

Dưới góc nhìn khắt khe của 50 năm xây dựng kiến trúc thương hiệu (Brand Architecture) và kiến tạo tình yêu thương hiệu (Brand Love), biểu tượng hiện tại của **Hiểu Bản Thân** — **"Cửu Tinh Nhãn"** — đạt **8.5/10 về Ý tưởng cốt lõi (Core Concept)** nhưng mới chỉ đạt **6.5/10 về Kỹ thuật Hình học & Khả năng thích ứng (Geometric Execution & Scalability)**.

Chính tác giả của bộ Brand Kit v1.0 cũng đã để lại ghi chú trung thực trong tệp `DOC-TOI-TRUOC.txt`:
> *"Lưu ý: đây là bản phác thảo ý tưởng đã vẽ chuẩn vector. Trước khi đăng ký bảo hộ nên nhờ người thiết kế rà tỉ lệ nét."*

### 1.1. Kiểm chứng Toán học: Logo v1.0 đã theo Tỉ lệ vàng ($\phi \approx 1.618$) chưa?
**Kết luận thẳng thắn: CHƯA.** Đo đạc trực tiếp trên mã nguồn tọa độ vector của tệp `logo-dau-nen-toi-trong-suot.svg` (`viewBox="8 56 184 88"`, tâm tại `(100, 100)`) chỉ ra **4 sai số hình học lớn**:

| Thành phần | Thông số thực tế ở v1.0 | Tỉ lệ thực tế ở v1.0 | Chuẩn Tỉ lệ vàng ($\phi = 1.618$) | Hậu quả thị giác trên thực tế |
| :--- | :--- | :--- | :--- | :--- |
| **1. Khung mắt ngoài** | `M14 100 Q100 22 186 100 Q100 178 14 100 Z` ($W = 172$, $H = 78$, nét dày `7`) | $W / H = 172 / 78 = \mathbf{2.205}$ (phủ bì $184/88 = 2.091$) | $\phi = \mathbf{1.618}$ (hoặc Vesica Piscis $\sqrt{3} = 1.732$) | Dáng mắt bị kéo dẹt ngang quá mức, làm hẹp không gian dọc ở tâm mắt và dùng đường cong bậc 2 (`Q`) thay vì cung tròn đồng tâm (`A`). |
| **2. Vòng tròn 9 vạch (Cửu tinh)** | `cx="100" cy="100" r="33"`, `stroke-width="6"` ($D_{\text{tâm}} = 66$, $D_{\text{ngoài}} = 72$) | $H_{\text{mắt}} / D_{\text{vòng}} = 78 / 66 = \mathbf{1.182} \neq 1.618$ | $D_{\text{vòng}} = H_{\text{mắt}} / \phi = \mathbf{61.80}$ ($r = 30.90$) | **Lỗi chạm nét 0.5px:** Mép ngoài vòng tròn vươn tới $33 + 3 = 36$, trong khi mép trong mí mắt ở $39 - 3.5 = 35.5$. Vòng tròn đè 0.5px lên mí mắt trên và dưới, gây cảm giác chật chội, bí bức. |
| **3. Khe hở 9 vạch Cửu tinh** | `stroke-dasharray="18.9 4.14"` trên chu vi $2\pi \times 33 = 207.35$ | $\text{Vạch} / \text{Khe} = 18.9 / 4.14 = \mathbf{4.565}$ | `stroke-dasharray="10.00 11.5723"` (với đầu nét bo tròn `5.4px` $\Rightarrow$ vạch thị giác `15.40px`, khe trống thực `6.17px`) | Khe hở `4.14px` ở v1.0 quá hẹp so với nét dày `6px` khiến 9 vạch dính liền dưới `48px`. Bản v2.0 mở rộng khe trống thực lên `6.17px` giúp 9 vạch tách bạch từ `32px` trở lên (riêng cỡ siêu nhỏ `16×16px` dùng bản micro vòng liền `favicon-16.png` để tránh nhòe lưới pixel). |
| **4. Ngôi sao 4 cánh ở tâm** | Đỉnh sao từ `74` đến `126` ($D_{\text{sao}} = 52$, $r_{\text{sao}} = 26$) | $D_{\text{vòng}} / D_{\text{sao}} = 66 / 52 = \mathbf{1.269} \neq 1.618$ | $D_{\text{sao}} = D_{\text{vòng}} / \phi = \mathbf{38.20}$ ($r = 19.10$) | Cánh sao quá dài, chọc sát vào mép trong của vòng Cửu tinh (chỉ cách $30 - 26 = 4\text{px}$), thiếu khoảng không gian tĩnh lặng (negative space) quanh tâm sáng. |

### 1.2. Đánh giá Màu sắc, Bố cục, Ý tưởng & Sự lệch pha với Sản phẩm Web
1. **Ý tưởng cốt lõi ("Cửu Tinh Nhãn") — Tài sản Brand Love quý giá cần bảo tồn:**
   - **Con mắt nhìn vào bên trong:** Biểu trưng cho sự tự nhận thức, tỉnh thức và tự soi chiếu (*"Hiểu bản thân"*).
   - **Vòng tròn 9 vạch (Cửu tinh / Cửu cung):** Kết nối liền mạch cả Huyền học phương Đông (Cửu Tinh Lạc Thư, Cửu Cung Bát Quái, Phong Thủy Huyền Không) lẫn phương Tây (9 con số gốc từ 1–9 của Thần Số Học Pythagoras).
   - **Ngôi sao bốn cánh (Bắc Đẩu / Kim chỉ nam):** Ánh sáng dẫn đường và trực giác minh triết ở tâm.
   - **Hiệu ứng Living Logo (BR-2 trên web `globals.css`):** Nét mắt tự vẽ trong `1.3s`, vòng 9 vạch xoay chậm `48s/vòng`, sao 4 cánh thở nhịp `4.5s` là một thiết kế Kinetic Identity xuất sắc, tạo kết nối cảm xúc sâu sắc với người dùng.
2. **Điểm lệch pha về Định vị & Màu sắc giữa Brand Kit v1.0 và Sản phẩm thực tế (`hieuban.com`):**
   - Trong Brand Kit v1.0, ảnh bìa social (`anh-bia-social.svg`) chỉ ghi dòng phụ đề rất hẹp: *"THẦN SỐ HỌC · HUYỀN HỌC PHƯƠNG ĐÔNG"* hoặc *"LỊCH VẠN NIÊN · XEM NGÀY TỐT XẤU"*.
   - Trong khi đó, sản phẩm thực tế `hieuban.com` là một **Hệ sinh thái 7 Bộ môn Minh triết Đông – Tây toàn diện**: **Tử Vi Đẩu Số · Bát Tự (Tứ Trụ) · Kinh Dịch (64 Quẻ) · Phong Thủy · Thần Số Học · Nhân Tướng Học · Tarot & Lịch Vạn Niên**, vận hành trên nền tảng thuật toán minh bạch, có trích dẫn sách cổ và đặt câu hỏi để người đọc tự chiêm nghiệm.
   - Về màu sắc, web app đã phát triển lên hệ **Ngũ Sắc Huyền Học** gồm Vàng sao (`#E9C46A`), Lam đêm (`#3F7FE0`), Ngọc bích (`#6FD3B5`), Ánh trăng (`#B9A7FF`) và Chu sa (`#EF8A6F`), nhưng Brand Kit v1.0 mới chỉ có 2 màu Vàng và Lam.

---

## PHẦN 2. XU HƯỚNG THIẾT KẾ LOGO & THỊ GIÁC MỚI NHẤT ĐỂ BỨT PHÁ BRAND LOVE

Để đưa **Hiểu Bản Thân** trở thành thương hiệu số 1 trong tâm trí người dùng trẻ lẫn giới nghiên cứu học thuật, thiết kế thị giác cần hội tụ **4 xu hướng nhận diện đương đại**:
1. **Sacred Mathematical Precision (Hình học Thiêng & Lưới Tỉ lệ vàng $\phi = 1.618$):** Mọi đường cong và khoảng trống âm (negative space) đều tuân theo chuỗi lũy thừa $\phi^n$, tạo cảm giác cân bằng tự nhiên, tĩnh tại ngay từ cái nhìn đầu tiên.
2. **Optical Tapered Terminals (Vuốt côn quang học kiểu Bút pháp phương Đông):** Thay vì nét đều cứng nhắc (monoline `stroke-width: 7` đồng nhất ở hai đầu), hai khóe mắt được vuốt nhọn tinh tế, gợi nét bút lông thư pháp và độ sắc sảo của ánh nhìn nội tâm.
3. **Micro-Scale Legibility (Chuẩn hóa hiển thị kích thước siêu nhỏ):** Mở rộng tỉ lệ khe thở của vòng 9 vạch để biểu tượng giữ nguyên đủ 9 vạch Cửu tinh từ kích thước biển bảng 3 mét xuống tận Favicon 16×16px mà không cần biến tướng thành vòng tròn liền.
4. **Quiet Mysticism & East-West Synthesis (Huyền học Tĩnh tại — Giao thoa Đông Tây):** Loại bỏ hoàn toàn màu sắc mê tín sặc sỡ; sử dụng nền Đêm vũ trụ sâu thẳm (`#080814` – `#0A0A17`) làm nổi bật hệ màu Ngũ Sắc phát sáng dịu như bản đồ sao.

---

## PHẦN 3. BA PHƯƠNG ÁN NÂNG CẤP LOGO v2.0 & LÝ DO CHỌN PHƯƠNG ÁN #1

Cả 3 phương án đều đã được xuất file Vector SVG và PNG độ phân giải cao tại thư mục `01-Ba-Phuong-An-Logo-Phi/`:

### ★ Phương án 01 (ĐỀ XUẤT CHỌN LÀM LOGO SỐ #1 CHÍNH THỨC): **"Cửu Tinh Nhãn $\phi$-Master"**
- **Cấu trúc Toán học Tỉ lệ vàng 5 cấp ($\phi = 1.6180339887$, tâm tại `100, 100`):**
  - **Cấp 1 — Chiều rộng Khung mắt ($W_{\text{eye}}$):** $100 \times \phi = \mathbf{161.80}$ (`x` từ `19.10` đến `180.90`).
  - **Cấp 2 — Chiều cao Khung mắt ($H_{\text{eye}}$):** $\mathbf{100.00}$ (`y` từ `50.00` đến `150.00`) $\Rightarrow W_{\text{eye}} / H_{\text{eye}} = \mathbf{1.6180} = \phi$. Được dựng bằng 2 cung tròn **Vesica Piscis** chuẩn xác có bán kính $R = \mathbf{90.4508}$, tâm đặt tại $(100, 100 \pm 40.4508)$ (trong đó độ lệch tâm $40.4508 = W_{\text{eye}} / 4$).
  - **Cấp 3 — Đường kính Vòng Cửu Tinh ($D_{\text{ring}}$):** $100 / \phi = \mathbf{61.80}$ (bán kính $r = \mathbf{30.90}$) $\Rightarrow H_{\text{eye}} / D_{\text{ring}} = \mathbf{1.6180} = \phi$. Khoảng thở từ mép ngoài vòng tròn đến mép trong mí mắt đạt **13.30 đơn vị** (xóa sổ hoàn toàn lỗi chạm nét 0.5px của v1.0).
  - **Cấp 4 — Đường kính Ngôi sao 4 cánh ($D_{\text{star}}$):** $61.80 / \phi = \mathbf{38.20}$ (bán kính đỉnh sao $r = \mathbf{19.10}$) $\Rightarrow D_{\text{ring}} / D_{\text{star}} = \mathbf{1.6180} = \phi$.
  - **Cấp 5 — Vòng Tâm Quang ($D_{\text{core}}$):** $38.20 / \phi = \mathbf{23.60}$ (bán kính $r = \mathbf{11.80}$) $\Rightarrow D_{\text{star}} / D_{\text{core}} = \mathbf{1.6180} = \phi$, điểm hạt Ngọc Bích (`#6FD3B5`) ở chính tâm $(100, 100)$.
- **Lý do chọn làm Logo #1 chính thức:** Giữ trọn vẹn 100% linh hồn "Cửu Tinh Nhãn" và tương thích 100% với hiệu ứng chuyển động sống `BR-2` trên web, nhưng nâng tầm tỷ lệ lên chuẩn mực hoàn hảo để đăng ký bảo hộ thương hiệu, hiển thị sắc nét từ Favicon 16px, App Icon cho tới biển hiệu lớn.

### Phương án 02: **"Thiên Địa La Bàn" (Cosmic Astrolabe)**
- **Ý tưởng:** Tích hợp thêm vòng quỹ đạo thiên văn $r = 58$, trục la bàn Tứ Phương (Đông – Tây – Nam – Bắc) và 4 hạt ngọc Ngũ Hành (`#6FD3B5` Mộc, `#EF8A6F` Hỏa, `#E9C46A` Thổ/Kim, `#B9A7FF` Thủy) tại 4 cực của khung mắt.
- **Đánh giá & Vai trò:** Rất giàu chất học thuật Đông – Tây, cực kỳ phù hợp để làm **Đồ họa Hero Background / Minh họa chuyên mục Tử Vi – Phong Thủy – Kỳ Môn**, nhưng ở kích thước nhỏ dưới 32px trên thanh điều hướng thì nhiều chi tiết mảnh hơn Phương án 01.

### Phương án 03: **"Ấn Chương Minh Triết" (Sacred Octagonal Seal)**
- **Ý tưởng:** Đặt biểu tượng **Cửu Tinh Nhãn $\phi$-Master** vào bên trong khung **Ấn Bát Giác đều** (biểu trưng cho Bát Quái của Kinh Dịch và Ấn chương cổ truyền) kết hợp vòng tròn Thái Cực đứt đoạn.
- **Đánh giá & Vai trò:** Được giữ lại trong Brand Kit v2.0 làm **Secondary Seal / Badge chính thức** để đóng dấu bản quyền trên các bản xuất PDF Lá số, chứng nhận học thuật, Sticker và huy hiệu ứng dụng.

---

## PHẦN 4. MA TRẬN ẤN PHẨM SOCIAL MEDIA & THÔNG ĐIỆP ĐA KÊNH (v2.0)

Toàn bộ ấn phẩm trong thư mục `social/` đã được thiết kế mới và xuất ở cả 2 định dạng **Vector SVG** và **PNG chuẩn kích thước từng nền tảng**, truyền tải nhất quán **7 bộ môn cốt lõi** và **Sứ mệnh thương hiệu**:

| Nền tảng / Ấn phẩm | Tên tệp trong Brand Kit v2.0 | Kích thước (px) | Thông điệp chủ đạo & Cấu trúc thị giác |
| :--- | :--- | :--- | :--- |
| **1. Facebook Fanpage Cover** | `facebook-cover-1640x624.png` / `.svg` (`anh-bia-social.png`) | `1640 × 624` | **NỀN TẢNG HUYỀN HỌC & THẤU HIỂU BẢN THÂN** · *Hiểu mình để làm chủ vận mệnh — Tinh hoa Huyền học Đông & Tây* · 7 Huy hiệu bộ môn (Tử Vi, Bát Tự, Kinh Dịch, Phong Thủy, Thần Số Học, Nhân Tướng, Tarot & Lịch) · Cam kết: *Tính toán minh bạch · Diễn giải có nguồn sách cổ · Câu hỏi để tự soi chiếu*. |
| **2. YouTube Channel Banner** | `youtube-banner-2560x1440.png` / `.svg` | `2560 × 1440` (Vùng an toàn `1546 × 423`) | **KÊNH MINH TRIẾT ĐÔNG TÂY & THẤU HIỂU BẢN THÂN** · Khung Safe-Zone trung tâm hiển thị trọn vẹn trên cả TV 4K, Desktop và Mobile cùng bản đồ La bàn Sao hai bên cánh. |
| **3. Instagram & Threads Square Post** | `instagram-threads-post-1080x1080.png` / `.svg` | `1080 × 1080` (Tỉ lệ 1:1) | **HỆ SINH THÁI HUYỀN HỌC KHOA HỌC & TỈNH THỨC** · Biểu tượng Cửu Tinh Nhãn $\phi$-Master đặt trên bàn xoay La bàn Thiên văn, 7 thẻ bộ môn chia 2 hàng cân xứng + CTA `KHÁM PHÁ NGAY TẠI HIEUBAN.COM`. |
| **4. Instagram & Facebook Portrait Cover** | `instagram-portrait-1080x1350.png` / `.svg` | `1080 × 1350` (Tỉ lệ 4:5) | **7 BỘ MÔN MINH TRIẾT ĐÔNG & TÂY HỘI TỤ** · Phân tách rõ 3 trụ cột giá trị: *(01) Huyền học phương Đông chính thống · (02) Chiêm nghiệm phương Tây & Lịch Vạn Niên · (03) Cam kết Ba Không tạo nên Brand Love*. |
| **5. TikTok / Reels / Shorts / Story Cover** | `tiktok-reels-story-1080x1920.png` / `.svg` | `1080 × 1920` (Tỉ lệ 9:16) | **Hiểu Mình Để Làm Chủ Vận Mệnh** · Bố cục dọc chuẩn 9:16 tối ưu vùng hiển thị không bị che bởi UI của TikTok/Reels, nổi bật 7 thẻ bộ môn Ngũ Sắc và nút kêu gọi hành động. |
| **6. Threads / X / LinkedIn Header** | `threads-x-header-1500x500.png` / `.svg` | `1500 × 500` (Tỉ lệ 3:1) | **MINH TRIẾT ĐÔNG TÂY · TÍNH TOÁN MINH BẠCH** · Bố cục ngang thanh lịch dành cho hồ sơ chuyên gia và trang chính thức trên Threads / X / LinkedIn. |
| **7. Open Graph / Zalo / Web Share Card** | `og-share-1200x630.png` / `.svg` (`anh-chia-se-og.png`) | `1200 × 630` (Tỉ lệ 1.91:1) | Ảnh đại diện tiêu chuẩn khi chia sẻ link `hieuban.com` lên Zalo, Messenger, Facebook, Telegram (sẵn sàng áp dụng khi chủ dự án duyệt). |
| **8. Avatar Đa nền tảng (Tối & Sáng)** | `avatar-nen-toi.png` & `avatar-nen-sang.png` | `1024 × 1024` (Tỉ lệ 1:1) | Biểu tượng Cửu Tinh Nhãn $\phi$-Master kèm vòng kim tuyến bảo hộ, hiển thị hoàn hảo trong cả khung tròn (TikTok, Instagram, Threads, YouTube) và khung bo góc (Zalo, App Icon). |

> **Lưu ý kỹ thuật về Font chữ & SVG:** Toàn bộ 23 file Logo trong thư mục `svg/` (bao gồm Logo dấu, Logo ngang, Logo dọc) đều đã được **chuyển thành đường cong Vector (`<path>`) 100%** (không chứa thẻ `<text>`), đảm bảo mở trên mọi máy tính hay phần mềm in ấn đều không bao giờ lỗi font. Các file thiết kế banner trong thư mục `social/*.svg` giữ thẻ `<text>` để đội ngũ Marketing dễ dàng sửa tiêu đề chiến dịch (cần cài 2 font đi kèm trong thư mục `fonts/`); trong khi các file `social/*.png` đã được kết xuất sẵn sắc nét đầy đủ dấu tiếng Việt.
