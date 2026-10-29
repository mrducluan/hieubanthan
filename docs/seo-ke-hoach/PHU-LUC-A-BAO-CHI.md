# Kế hoạch backlink báo chí & Digital PR — hieuban.com (Hiểu Bản Thân)

Lập ngày 29/10/2026 · Phạm vi: 10/2026 → 03/2027 (đỉnh mùa Tết Đinh Mùi, mùng 1 = 06/02/2027)
Người đứng tên chuyên môn: **Đức Luân**, chủ biên ("hơn 15 năm nghiên cứu thần số học, Tử vi, Bát tự, Phong thuỷ và Kinh Dịch", theo hồ sơ đang hiện trên site; không ghi thêm danh hiệu nào chưa công bố) · Đơn vị vận hành: Hieu Ban Co Ltd.

> **Cách đọc mức độ kiểm chứng.** "Đã xác minh" = có URL công khai kèm theo. "Chưa xác minh" = suy luận nghề nghiệp, phải hỏi lại toà soạn hoặc đơn vị booking trước khi chi tiền. Giá báo chí VN gần như không công bố. Trong lần rà này em chỉ tìm được **một** bảng giá công khai (Batdongsan.com.vn).

---

## 0. Nguyên tắc nền (đọc trước khi làm bất cứ việc gì)

### 0.1. Ba luồng tách bạch, không trộn

| Luồng | Mục tiêu thật | Kiểu link mong đợi | Đo bằng |
|---|---|---|---|
| **(a) Earned media / Digital PR dữ liệu**: nhà báo tự viết vì có dữ liệu, câu chuyện, chuyên gia | Link tự nhiên (có thể dofollow), trích dẫn chuyên gia, thực thể (entity) | Do toà soạn quyết. Không được đòi dofollow, không được trả tiền đổi link | Referring domains mới, branded search, trích dẫn AI |
| **(b) Bài PR trả tiền (advertorial / booking)** | Nhắc thương hiệu, tín hiệu E-E-A-T (chuyên gia được báo lớn nhắc), traffic giới thiệu, độ phủ mùa Tết | **Phải là `rel="sponsored"` hoặc `nofollow`**. Không kỳ vọng PageRank | Lượt giới thiệu (GA4/PostHog `?tu=`/UTM), branded search, độ phủ |
| **(c) KHÔNG làm** | — | PBN, mua link dofollow, "gói 100 báo vệ tinh", guest post nhồi anchor từ khoá, đổi link tay ba | — |

**Căn cứ Google (đã xác minh):** trang Spam Policies của Google Search Central xếp "buying or selling links for ranking purposes", và cả "links with optimized anchor text in articles, guest posts, or press releases distributed on other sites" cũng như "advertorials or native advertising" có link truyền giá trị xếp hạng, vào nhóm link spam. Link trả tiền **không vi phạm** nếu gắn `rel="nofollow"` hoặc `rel="sponsored"`. Nguồn: <https://developers.google.com/search/docs/essentials/spam-policies>.

Hệ quả thực tế:
- Hợp đồng booking **không** được có điều khoản "cam kết dofollow". Đơn vị nào chào "backlink dofollow báo lớn" là bán thứ Google coi là spam, và rủi ro dồn về hieuban.com. Một bài trên Brands Vietnam (2021, ý kiến cá nhân, **chưa xác minh**) cũng cho rằng báo lớn thường để nofollow: <https://www.brandsvietnam.com/congdong/topic/319367-7-Cach-Dat-Backlink-Chat-Luong-Cho-Website-2021>.
- Nếu báo trả tiền tự để link dofollow thì **không** tự xin đổi, nhưng cũng không tính nó vào KPI link. Chỉ ghi nhận như brand mention.

### 0.2. Pháp lý Việt Nam: bắt buộc đưa vào brief mọi bài

1. **Nhận diện quảng cáo.** Luật Quảng cáo sửa đổi 2025 có hiệu lực **01/01/2026**. Quảng cáo trên báo điện tử / mạng phải "có dấu hiệu nhận diện rõ ràng" để phân biệt với nội dung không phải quảng cáo (khoản 16 Điều 1). Văn bản không quy định đúng một chữ, nên thông lệ an toàn là nhãn **"Thông tin quảng cáo"** hoặc **"Nội dung tài trợ"** ở đầu bài. Nguồn: <https://tapchitoaan.vn/mot-so-diem-moi-dang-chu-y-cua-luat-quang-cao-sua-doi-bo-sung-nam-202515012.html>; văn bản: <https://luatvietnam.vn/thuong-mai/luat-quang-cao-sua-doi-2025-so-75-2025-qh15-404208-d1.html>. Nghị định hướng dẫn (bài trên nhắc NĐ 342/2025) **chưa đọc nguyên văn → chưa xác minh** chi tiết nhãn. Phải nhờ luật sư xác nhận mẫu nhãn trước đợt chi tiền đầu tiên.
   → **Quy tắc của mình:** mọi bài luồng (b) phải có nhãn. Báo không gắn nhãn thì không ký.
2. **Cấm so sánh trực tiếp** giá, chất lượng, hiệu quả với sản phẩm cùng loại của tổ chức hay cá nhân khác (Điều 8 Luật Quảng cáo 2012; nguồn tư vấn đánh số khoản khác nhau nên cần đối chiếu văn bản gốc): <https://luatminhkhue.vn/so-sanh-truc-tiep-san-pham-voi-cong-ty-doi-thu-khi-quang-cao.aspx>. Cũng cấm "nhất / duy nhất / số một" khi không có tài liệu chứng minh.
   → Không viết "chính xác hơn app X", "duy nhất tại VN". Bảng so sánh với "chatbot AI đa năng" trên trang chủ (không nêu hãng) **không đưa nguyên vào bài báo**.
3. **Mê tín dị đoan.** Điều 9 Luật Báo chí 2016 có các nhóm hành vi bị cấm. Theo nguồn thứ cấp, trong đó có thông tin cổ suý mê tín, dị đoan; câu chữ chính xác **chưa xác minh** với văn bản gốc: <https://thuvienphapluat.vn/lao-dong-tien-luong/nha-bao-bi-cam-thuc-hien-dang-phat-nhung-thong-tin-nao-22780.html>. Tiền lệ đã xác minh: năm 2015 Thanh tra Bộ TT&TT xử phạt Báo điện tử Người Đưa Tin, trong đó có hành vi "nội dung mê tín dị đoan" (<https://thanhtra.com.vn/hoat-dong-nganh-91D9B9332/xu-phat-2-co-quan-bao-chi-co-vi-pham-8AC07398.html>). Năm 2024, Bộ trưởng TT&TT nói có thể xử lý nhanh khi Bộ VHTTDL xác định hành vi mê tín (<https://www.vtcnews.vn/bo-truong-tt-tt-co-the-xu-ly-hinh-su-hanh-vi-me-tin-di-doan-tren-mang-ar906917.html>). Đầu 2025, Cục An toàn thông tin cảnh báo lừa đảo "xem bói, giải hạn online" (<https://daibieunhandan.vn/tranh-sap-bay-xem-boi-giai-han-online-lua-dao-dip-dau-nam-10358540.html>).
   → **Hệ quả:** báo chính thống nghiêng về góc **văn hoá dân gian, phong tục, tâm lý, dữ liệu, khởi nghiệp công nghệ**. Họ có thể từ chối bài "tử vi phán vận". Mẫu an toàn đã xác minh: Tuổi Trẻ viết về tuổi xông đất 2026 và dẫn ý PGS.TS Phan Anh Tú (Trưởng khoa Văn hoá học, ĐH KHXH&NV TP.HCM): tục xông đất ban đầu "mang tính tự nhiên và ngẫu nhiên", nghi thức "tạo ra cảm giác an tâm". <https://tuoitre.vn/tuoi-nao-xong-dat-nam-binh-ngo-2026-de-ruoc-loc-vao-nha-20260214091718552.htm>
4. **Bộ lọc nội dung của chính site, áp vào mọi bài báo:**
   - Luôn có câu "theo quan niệm dân gian / để tham khảo".
   - Không phán hung, không doạ ("đại kỵ", "tai hoạ"), không "năm nay đen".
   - Không bán hay gợi ý vật phẩm giải hạn, không "hoá giải chuẩn phong thuỷ" (đây là kiểu tít các trang tử vi đại trà hay dùng, ví dụ <https://doanhnghiephoinhap.vn/nua-cuoi-2025-cua-12-con-giap-van-han-nao-de-doa-manh-nhat-va-cach-hoa-giai-chuan-phong-thuy-110314.html>, **tránh đứng cạnh**).
   - Không tên bệnh, không chẩn đoán, không tiên đoán tuổi hay năm ốm.
   - Không xổ số, không ngày chết.
5. **Bí mật kinh doanh (BM-1).** Bài báo **không** nêu tên thư viện mã nguồn, bộ đối chiếu, nhà cung cấp hạ tầng hay AI, phiên bản engine. Chỉ nói "bộ tính toán của Hiểu Bản Thân, quy tắc công khai theo sách / trường phái X".
6. **Dữ liệu cá nhân.** Không hứa hay công bố số liệu người dùng (site không công bố). Mọi con số phải là **phép tính trên lịch / ngày tháng** (tất định), ghi rõ cách tính.
7. **Quảng cáo hội viên / Sao.** Bài PR trả tiền chỉ đưa đến **công cụ miễn phí**, không đẩy nạp Sao hay hội viên, cho đến khi tư vấn pháp lý về TMĐT (Luật TMĐT 2025 hiệu lực 01/07/2026) xong.

### 0.3. Tài sản dữ liệu có thể pitch (engine tính được, không phải dữ liệu người dùng)

| Mã | Tài sản | Câu chữ bắt buộc khi đưa báo |
|---|---|---|
| D1 | Tỉ lệ **ngày sinh** theo số Đường đời trên **mẫu mọi ngày lịch 01/01/1940 → 31/12/2010** | "Đây là phân bố trên lịch, **không phải thống kê dân số**: số trẻ sinh mỗi ngày không đều, nên con số không nói 'bao nhiêu người Việt mang số X'." |
| D2 | **Hai cách cộng Đường đời ra hai số khác nhau**: 24/10/1988 → **33** (cộng hết các chữ số) hoặc **6** (rút gọn từng phần) | "Không có cách nào 'đúng duy nhất'. Site cho người dùng chọn và luôn báo khi hai cách lệch." Đây là góc **kiểm chứng / chống ngộ nhận** rất hợp báo chính thống. |
| D3 | Bảng **46 tuổi (sinh 1960–2005)** xông đất & làm nhà năm Đinh Mùi 2027 (`/tuoi-xong-dat/2027`, `/xem-tuoi-lam-nha/2027`) | "Theo tục lệ dân gian (tam hợp, lục hợp, Kim lâu, Hoang ốc, Tam tai), để tham khảo; nhiều sách đếm khác nhau." |
| D4 | Tuổi **Kim lâu / Hoang ốc / Tam tai** năm 2027. Tam tai 2027 rơi vào Hợi – Mão – Mùi, khớp nguồn ngoài <https://viettelstore.vn/tin-tuc/nam-2026-tuoi-nao-tam-tai> | Nói rõ **tuổi mụ theo năm âm lịch Việt**. Có sách đếm Hoang ốc khác. |
| D5 | **Lịch âm 2027**: Tết 06/02/2027 (khớp nguồn ngoài <https://cellphones.com.vn/sforum/tet-dinh-mui-2027>), tháng đủ/thiếu, có hay không tháng nhuận | Lịch Việt tính theo **UTC+7** nên đôi năm khác lịch Trung Quốc. Đây là **góc tin "lịch Việt ≠ lịch Trung"** rất có giá trị báo chí. Kiểm lại số trên `/lich-am/2027` trước khi gửi. |
| D6 | **Ngày tốt cưới hỏi / khai trương / về nhà mới theo tháng** (11/2026 → 03/2027) | "Theo hoàng lịch truyền thống, chưa xét tuổi riêng từng người." |
| D7 | **Hướng xấu năm 2027**: Ngũ Hoàng, Nhị Hắc, Tam Sát, Thái Tuế, Tuế Phá (`/phong-thuy/huong-xau-nam/2027`) | "Năm phong thuỷ tính theo Lập xuân (≈ 04/02/2027), không theo Tết." Lời khuyên chỉ là "hạn chế động thổ lớn phía…", không doạ. Lấy số **từ trang**, không chép tay. |

> Trước mỗi pitch, xuất số từ trang đích. Chụp màn hình kèm URL, gửi nhà báo **bảng CSV/ảnh** để họ tự kiểm. Nhà báo tin con số tự kiểm được.

---

## 1. Danh sách báo theo 3 hạng

Chú thích cột **Link khả dĩ**: E = earned (toà soạn tự đặt link, có thể dofollow hoặc không) · S = trả tiền (phải sponsored/nofollow) · M = chỉ nhắc tên (mention), không link.

### Tier 1: uy tín cao, khó vào, giá trị chủ yếu là thương hiệu và trích dẫn

| Báo | Chuyên mục phù hợp | Bằng chứng đang đăng chủ đề liên quan | Góc bài đề xuất | Link khả dĩ | Giá ước tính | Rủi ro |
|---|---|---|---|---|---|---|
| **Tuổi Trẻ** | Văn hoá / Xã hội (Tết), Nhịp sống số | **Đã xác minh**: bài tuổi xông đất 2026 có dẫn PGS văn hoá học (link mục 0.2) | Phong tục xông đất qua dữ liệu lịch; "lịch Việt khác lịch Trung"; chuyên gia văn hoá + dữ liệu | E/M (ưu tiên) | PR trả tiền: **chưa xác minh** (có trên danh sách bookingpr.vn, không công bố giá) | Từ chối góc "tử vi". Chỉ pitch góc văn hoá / dữ liệu |
| **VnExpress** (kể cả Ngôi Sao) | Đời sống, Số hoá, Khởi nghiệp; Ngôi Sao có mục "Trắc nghiệm › Cung hoàng đạo" | Ngôi Sao: menu "Trắc nghiệm" có "Cung hoàng đạo" (quan sát trực tiếp khi tải ngoisao.vnexpress.net 29/10/2026; trang mục cụ thể trả 404). Bài xông đất trên VnExpress: **chưa xác minh** | Startup công nghệ VN số hoá lịch âm / hoàng lịch; "vì sao hai app ra hai con số Đường đời" (D2) | E (khó), S | **Chưa xác minh**. VnExpress bán gói đàm phán, không niêm yết; hồ sơ mua sắm của Vietnam Airlines ghi banner VnExpress "đàm phán" (<https://www.vietnamairlines.com/at/vi/vietnam-airlines/procurement/information/2023/1231-Ban-TT-KHMS-Quy-I-2024>) | Giá cao. Kiểm duyệt nội dung huyền học chặt |
| **Vietnamnet** | Gia đình, Đời sống, Bất động sản (Tư vấn) | **Đã xác minh**: tag "xông đất" có bài tháng 2/2026 "Tuổi xông đất, xông nhà năm Bính Ngọ 2026…" (<https://vietnamnet.vn/xong-dat-tag15310169971454007230.html>). Không có mục Tử vi riêng | Bảng tuổi xông đất 2027 kèm phần "vì sao các bài báo liệt kê khác nhau"; tuổi làm nhà 2027 cho mục BĐS | E, S | **Chưa xác minh** | Lặp lại bài cũ của họ → phải có góc mới (D2, D5) |
| **Znews** | Xã hội, Sống trẻ, Công nghệ | **Đã xác minh**: "Tuổi xông nhà cực đẹp năm Bính Ngọ 2026" (<https://znews.vn/tuoi-xong-nha-cuc-dep-nam-binh-ngo-2026-post1628611.html>); tử vi cung hoàng đạo (bài cũ) | Gen Z & tự soi bằng con số: góc tâm lý (hiệu ứng Barnum, tự phản tỉnh), có chuyên gia tâm lý độc lập | E, S | Có trên bookingpr.vn; giá **chưa xác minh** | Góc tâm lý có thể "phản biện" thần số. Phải chấp nhận bài cân bằng |
| **Thanh Niên** | Văn hoá, Đời sống, Giới trẻ | Bài xông đất 2026: **chưa xác minh** | Như Tuổi Trẻ: phong tục + dữ liệu | E, S | Có trên bookingpr.vn; **chưa xác minh** | Như trên |
| **Dân trí** | Đời sống, Công nghệ – Khởi nghiệp | Bài thần số / xông đất: **chưa xác minh** | Chỉ góc khởi nghiệp công nghệ / dữ liệu lịch | E, S | Có trên bookingpr.vn; **chưa xác minh** | Biên tập thận trọng với huyền học |
| **Lao Động / Tiền Phong** | Văn hoá, Đời sống | **Chưa xác minh** | Phong tục Tết; nghề làm lịch | E, S | **Chưa xác minh** | Như trên |

### Tier 2: chuyên mục đời sống, giải trí, tử vi; dễ nhận PR hơn, chủ yếu sponsored

| Báo / trang | Chuyên mục | Bằng chứng | Góc | Link | Giá | Rủi ro |
|---|---|---|---|---|---|---|
| **Kenh14** | Đời sống, Học đường, Xã hội | Bài thần số / cung hoàng đạo: **chưa xác minh** (tìm không ra). Có trên bookingpr.vn | Trend "tự soi" Gen Z; thẻ chia sẻ có QR; "Bạn là số mấy?" | S | **Chưa xác minh** | Giọng giật tít dễ thành "phán", phải duyệt tít |
| **Afamily** | Gia đình, Nhà đẹp, Tết | Bài thần số: **chưa xác minh**; Afamily có trong danh mục đối tác bookingpr.vn | Tết: xem ngày cưới, xông đất, sắm nhà | S | **Chưa xác minh** | Như trên |
| **24h.com.vn** | Bạn trẻ – Cuộc sống (tử vi hiện ở thanh bên) | Quan sát khi tải trang 24h: tử vi nằm ở thanh bên "Bạn trẻ – Cuộc sống"; mục riêng **chưa xác minh** | Lịch âm 2027, ngày tốt | S | Có trên bookingpr.vn; **chưa xác minh** | Đứng cạnh nội dung "phán" |
| **Eva.vn** | Làm mẹ, Nhà đẹp | Mục tử vi riêng: **chưa xác minh** (URL thử là mục Làm đẹp) | Đặt tên con và con số (trung tính, không chấm tốt/xấu) | S | **Chưa xác minh** | Giữ cấm "tên xấu" |
| **VTC News** | "Tử vi vui 12 con giáp" | **Đã xác minh**: loạt bài tử vi vui hằng ngày (<https://vtcnews.vn/tu-vi-12-con-giap-hom-nay-ngay-12-10-2024-mao-may-man-than-phat-trien-ar901374.html>) | Không làm tử vi ngày. Pitch D5 / D6 (lịch, ngày tốt) | S, E | **Chưa xác minh** | Nhãn "vui" ổn, nhưng tránh để tên mình gắn tử vi ngày |
| **Báo Quốc tế, Nông nghiệp & Môi trường** | Tử vi / cung hoàng đạo hằng ngày | **Đã xác minh**: baoquocte.vn có tử vi ngày; nongnghiepmoitruong.vn có tag "Tử vi 12 cung hoàng đạo hôm nay" (<https://nongnghiepmoitruong.vn/tu-vi-12-cung-hoang-dao-hom-nay-tag190127/>) | Chỉ D5 / D6 | S | **Chưa xác minh** | Như trên |
| **Gia đình & Xã hội, Phụ nữ VN, Ngôi Sao, Dân Việt** | Đời sống gia đình, Tết | **Chưa xác minh** (Dân Việt có bài phong thuỷ nhà ở 2022: <https://danviet.vn/phong-thuy-nha-o-bi-quyet-chon-nha-tot-de-gia-dao-khoe-manh-binh-an-su-nghiep-thang-tien-20221201133902195-d1060386.html>) | Sắm Tết, chọn ngày cưới, phong tục | S | **Chưa xác minh** | GĐ&XH thuộc hệ Sức khoẻ & Đời sống: tuyệt đối không câu sức khoẻ |

### Tier 3: ngách (bất động sản, gia đình, khởi nghiệp, công nghệ, địa phương)

| Báo / trang | Chuyên mục | Bằng chứng | Góc | Link | Giá | Rủi ro |
|---|---|---|---|---|---|---|
| **Batdongsan.com.vn** (+ wiki) | Tab **"Tư vấn và phong thủy"**; wiki "xem tuổi làm nhà" | **Đã xác minh, có giá**: bảng giá áp dụng từ 01/03/2023: "Bài Hot 4… hiển thị trên tab 'Tư vấn và phong thủy'" **5.500.000đ** (gồm VAT); "Bài tin tức trang trong" **2.200.000đ**; Hot 1 (24h trang chủ) 18.000.000đ (<https://cdn.document360.io/d99c0142-a8c9-4731-9303-e44ed3d5647f/Images/Documentation/BaogiaPR_27.02.2024.pdf>). Wiki 2026 có bài tuổi làm nhà (<https://wiki.batdongsan.com.vn/wiki/xem-tuoi-lam-nha-dep-790270>) | Tuổi làm nhà 2027 + hướng xấu 2027 + đo hướng nhà miễn phí | S. Wiki có thể nhận nguồn trích (E, **chưa xác minh**) | 2,2–5,5 tr/bài (giá 2023; hỏi giá 2026) | Giá có thể đã đổi. Ràng buộc "tối đa 1.000 từ" |
| **CafeF** (mục "Gia chủ", tag "chuyên gia phong thuỷ") | Gia chủ, BĐS | **Đã xác minh**: tag <https://cafef.vn/chuyen-gia-phong-thuy.html>, mục <https://cafef.vn/gia-chu/trang-2.html>; bài 2026 về tuổi làm nhà, Kim lâu, Hoang ốc | Đức Luân làm **nguồn chuyên gia** cho phóng viên Gia chủ: "chỉ cần tránh Kim lâu – Hoang ốc hay phải xét 5 tiêu chí?" kèm bảng D3 / D4 | E (ưu tiên), S | Có trên bookingpr.vn; **chưa xác minh** | Tag "chuyên gia phong thuỷ" đông người. Cần dữ liệu để khác biệt |
| **CafeLand** | BĐS, "xu hướng phong thuỷ" (theo phần tự giới thiệu) | Mục phong thuỷ: **chưa xác minh** (URL thử 404) | Như Batdongsan | S | **Chưa xác minh** | — |
| **Báo Đầu tư (mục BĐS)** | Tư vấn BĐS – phong thuỷ | **Đã xác minh**: bài Bát trạch / mệnh quái chọn chung cư (<https://baodautu.vn/batdongsan/tu-van-chon-nha-chung-cu-theo-phong-thuy-huong-va-phuong-phap-tinh-menh-trach-don-gian-d65587.html>) | "Đo hướng căn hộ ở ban công: sai đâu?", công cụ đo hướng trên máy tính | E, S | **Chưa xác minh** | — |
| **Doanh nghiệp & Tiếp thị, Brands Vietnam, Advertising Vietnam, ICTnews/VnEconomy Số** | Khởi nghiệp, sản phẩm số | Brands Vietnam / AdVN có mục bài cộng đồng & case (đã thấy trong kết quả tìm) | Case: "startup văn hoá số: tách phép tính tất định khỏi AI diễn đạt" (không nêu nhà cung cấp) | E, M | **Chưa xác minh** | Giữ BM-1 |
| **Báo địa phương** (Hà Tĩnh, Bắc Ninh, Nam Định, Thái Bình… nơi đậm phong tục) | Văn hoá – Tết | **Đã xác minh**: Báo Hà Tĩnh có "Tuổi đẹp xông đất năm Bính Ngọ 2026" và dẫn nhà nghiên cứu văn hoá (<https://baohatinh.vn/tuoi-dep-xong-dat-nam-binh-ngo-2026-post306005.html>) | Cung cấp **bảng tra miễn phí + trích chuyên gia** cho phóng viên địa phương | E | Thường 0đ (earned) | Mất công, phạm vi nhỏ, nhưng là link .vn báo Đảng uy tín |
| **Báo Pháp luật / Thư viện Pháp luật / Luật Minh Khuê** | Hỏi đáp, Đời sống | **Đã xác minh**: Báo Pháp luật có bài xem tuổi xông đất (<https://baophapluat.vn/xem-tuoi-xong-dat-xuat-hanh-dau-nam-post85612.html>); Thư viện Pháp luật có bài tuổi xây nhà 2026 kèm ghi chú "tham khảo" | "Xông đất, động thổ: phong tục nào gắn với pháp lý xây dựng?" (giấy phép, ngày động thổ thật vs ngày đẹp) | E | 0đ | Không được nói sai luật xây dựng. Cần người rà luật |

**Đơn vị booking trung gian (để xin báo giá, không phải để mua dofollow):** bookingpr.vn (UNO Media), cập nhật 01/2026, 4.316 vị trí, giá chưa VAT, chỉ lọc theo khung ngân sách (< 50tr … 250–300tr), không công bố giá từng báo, có mục "backlink" như phụ phí và **không nói** dofollow hay nofollow (<https://bookingpr.vn/bao-gia>). → Hỏi bằng văn bản: (1) có nhãn "Thông tin quảng cáo" không, (2) `rel` của link là gì, (3) bài lưu bao lâu, (4) có được sửa nếu sai số liệu không.

**Mốc giá tham khảo (ước lượng nghề nghiệp, CHƯA XÁC MINH, chỉ để lập ngân sách):** báo ngách / địa phương / BĐS 2–8 tr/bài; Tier 2 đời sống 8–30 tr/bài; Tier 1 điện tử 25–80 tr/bài trở lên tuỳ vị trí và giờ trang chủ. Mốc cũ có nguồn: Brands Vietnam (2021) ước 2–10 tr/bài PR báo "tuỳ độ lớn" (link mục 0.1, số cũ). **Bắt buộc lấy 2–3 báo giá thật trước khi chốt.**

---

## 2. 14 ý tưởng bài / pitch & lịch triển khai 10/2026 → 03/2027

Ký hiệu luồng: **(a)** earned · **(b)** PR trả tiền. Mỗi pitch: **một góc**, **một dữ liệu**, **một trang đích**.

| # | Thời điểm gửi | Tiêu đề kiểu báo chí (gợi ý) | Góc | Dữ liệu | Trang đích | Luồng · báo mục tiêu |
|---|---|---|---|---|---|---|
| 1 | 03–14/11/2026 | **"Cùng ngày sinh 24/10/1988, vì sao hai ứng dụng ra hai 'con số đời' khác nhau?"** | Kiểm chứng / hiểu đúng: thần số học là quy ước cộng số, không phải "bí mật vũ trụ" | D2 (33 vs 6) + bảng 10 ngày sinh mẫu lệch giữa 2 cách | /than-so | (a) Znews, Tuổi Trẻ Nhịp sống số, VnExpress Số hoá |
| 2 | 10–21/11/2026 | **"Lịch âm năm Đinh Mùi 2027: Tết ngày 6/2, tháng nào đủ, tháng nào thiếu"** | Tin dịch vụ + "vì sao lịch Việt có năm khác lịch Trung Quốc" (múi giờ UTC+7) | D5 | /lich-am/2027 (phụ: /doi-lich-am-duong) | (a) Vietnamnet, Thanh Niên, báo địa phương; (b) 24h, VTC |
| 3 | 17–28/11/2026 | **"Mùa cưới cuối năm: những ngày hoàng lịch xếp 'tốt' tháng 12/2026 – 1/2027, và điều sách xưa không nói"** | Phong tục chọn ngày + chuyên gia văn hoá: ngày tốt chung ≠ hợp tuổi | D6 | /xem-ngay-tot | (b) Afamily, Eva, Kenh14; (a) Gia đình & Xã hội |
| 4 | 24/11–05/12/2026 | **"Tuổi nào làm nhà năm 2027? Bảng 46 tuổi và lý do các bài báo liệt kê khác nhau"** | Giải thích quy tắc Kim lâu / Hoang ốc / Tam tai (mỗi sách đếm khác), lời "tham khảo" | D3 + D4 | /xem-tuoi-lam-nha/2027 | (a) CafeF Gia chủ (nguồn chuyên gia); (b) Batdongsan tab Tư vấn & phong thuỷ |
| 5 | 01–12/12/2026 | **"Năm 2027 'kiêng' động thổ phía nào? Đọc đúng Ngũ Hoàng, Tam Sát mà không hoảng"** | Giải nghĩa thuật ngữ phong thuỷ, khuyên nhẹ, không doạ | D7 | /phong-thuy/huong-xau-nam/2027 | (b) Batdongsan, CafeLand; (a) Báo Đầu tư BĐS |
| 6 | 08–19/12/2026 | **"Một ngày lịch không đều: số Đường đời nào 'phổ biến' nhất nếu xét mọi ngày từ 1940 đến 2010?"** | Dữ liệu thú vị + cảnh báo đọc số (không phải thống kê dân số) | D1 | /than-so | (a) Znews, Kenh14 (data story), VnExpress |
| 7 | 15/12/2026–05/01/2027 | **"Xông đất Tết Đinh Mùi: bảng 46 tuổi tham khảo và câu chuyện tục lệ 'người đầu tiên bước qua cửa'"** | Phong tục + chuyên gia văn hoá độc lập (mời một giảng viên văn hoá học bình luận) | D3 | /tuoi-xong-dat/2027 | (a) Tuổi Trẻ, Vietnamnet, báo địa phương; (b) 24h, Afamily |
| 8 | 22/12/2026–10/01/2027 | **"Startup Việt số hoá hoàng lịch: tách 'phép tính' khỏi 'lời diễn giải' để không phán bừa"** | Khởi nghiệp / sản phẩm số, triết lý "đã tính · diễn giải · tự soi", chống phán hung | Không số liệu người dùng; nêu ~1.000 trang kiến thức, công cụ miễn phí | /huyen-hoc | (a) Brands Vietnam, Advertising Vietnam, Doanh nghiệp & Tiếp thị, VnEconomy Số |
| 9 | 05–20/01/2027 | **"Tháng Chạp: ngày nào hoàng lịch xếp tốt để tất niên, khai trương đầu năm?"** | Dịch vụ thời vụ | D6 (khai trương, xuất hành) | /xem-ngay-tot | (b) VTC, 24h, Báo Quốc tế; (a) báo địa phương |
| 10 | 10–25/01/2027 | **"'Tam tai', 'Kim lâu' là gì? Giải nghĩa nôm na để bớt lo dịp Tết"** | Giáo dục văn hoá, giọng trấn an | D4 | /xem-tuoi-lam-nha/2027 (phụ: /huyen-hoc) | (a) Thanh Niên, Lao Động, Tiền Phong; (b) Gia đình & Xã hội |
| 11 | 15–30/01/2027 | **"Mua nhà, chuyển nhà trước Tết: đo hướng nhà bằng điện thoại và ảnh vệ tinh đúng cách"** | Hướng dẫn thực hành (chung cư đo ở ban công), không bán vật phẩm | Cách đo + Bát trạch theo năm sinh | /phong-thuy | (b) Batdongsan, CafeLand; (a) Báo Đầu tư |
| 12 | 01–10/02/2027 (trước giao thừa 05/02) | **"Đầu năm gieo một quẻ: người trẻ dùng Kinh Dịch như câu hỏi tự soi, không phải lời phán"** | Tâm lý học hành vi (nghi thức đầu năm, tự phản tỉnh) + chuyên gia tâm lý độc lập | Cách gieo 3 đồng xu; "nói nôm na" 64 quẻ | /kinh-dich | (a) Znews, Kenh14; (b) Kenh14 |
| 13 | 10–28/02/2027 | **"Sau Tết: thói quen 'xem hôm nay' của người trẻ, từ lịch vạn niên đến nhịp ngày cá nhân"** | Xu hướng / tâm lý (không số liệu người dùng). Dùng khảo sát công khai bên thứ ba nếu có, ghi nguồn | Mô tả tính năng Hôm nay | /hom-nay | (a) Kenh14, Znews; (b) Afamily |
| 14 | 01–31/03/2027 | **"Mùa cưới xuân 2027 và chuyện xem tuổi: chuyên gia nói gì về 'hợp – khắc'"** | Phong tục, nhấn mạnh tham khảo, không chấm "không nên lấy nhau" | D6 tháng 3–5 + giải thích tam hợp, lục xung trung tính | /xem-ngay-tot (phụ: /bat-tu) | (b) Afamily, Eva; (a) Gia đình & Xã hội |
| 15 (dự phòng) | 03/2027 | **"Bát tự, Tử vi khác gì nhau? Bản đồ nhập môn cho người mới"** (byline chuyên gia) | Thought leadership của Đức Luân | ~1.000 trang kiến thức | /tu-vi, /bat-tu | (a) byline Tier 2–3 nhận bài chuyên gia; (b) nếu không có chỗ |

**Nhịp tổng thể**
- **Tháng 11/2026:** nền móng dữ liệu (#1, #2, #3, #4). Mục tiêu 3–5 bài earned đầu tiên, 2 bài PR Tier 3 (Batdongsan).
- **Tháng 12/2026:** cao điểm "làm nhà / hướng xấu / xông đất" (#5, #6, #7, #8). Gửi bảng dữ liệu cho báo địa phương theo lô.
- **Tháng 1/2027:** đỉnh tìm kiếm Tết (#9, #10, #11). Nhận phỏng vấn nhanh, trả lời phóng viên **trong 2 giờ**.
- **Tháng 2/2027:** Tết (#12, #13). Báo chạy lại bài cũ; gửi bản cập nhật "đúng năm 2027".
- **Tháng 3/2027:** mùa cưới xuân + thought leadership (#14, #15); tổng kết, chọn báo hiệu quả để làm năm sau.

---

## 3. Quy tắc anchor text

Áp cho mọi link mình có quyền đề xuất (PR trả tiền, bài chuyên gia, hồ sơ, đối tác). Earned media: **không đòi** anchor, chỉ gửi tên thương hiệu + URL.

| Loại anchor | Tỉ lệ mục tiêu | Ví dụ |
|---|---|---|
| **Thương hiệu** | **45–55%** | Hiểu Bản Thân · Hieu Ban · Hiểu Bản Thân (hieuban.com) |
| **URL trần** | **20–25%** | hieuban.com · https://hieuban.com/lich-am/2027 |
| **Chung / điều hướng** | **15–20%** | xem tại đây · công cụ tra cứu miễn phí · bảng tra đầy đủ |
| **Từ khoá một phần (partial)** | **5–10%** | bảng tuổi xông đất của Hiểu Bản Thân · công cụ lịch âm 2027 |
| **Từ khoá chính xác (exact)** | **≤ 3%**, mỗi trang đích tối đa 1 lần trong toàn chiến dịch | tuổi xông đất 2027 |
| **Tên chuyên gia** | ngoài tỉ lệ trên (link về trang tác giả hoặc trang chủ) | Đức Luân, chủ biên Hiểu Bản Thân |

Quy tắc kèm theo:
- Mỗi bài **tối đa 1 link** về hieuban.com (bài PR có thể 2: trang chủ + 1 trang đích). Không chèn link vào chữ trong câu trích lời chuyên gia.
- Không dùng cùng một anchor partial cho 2 bài liên tiếp. Ghi mọi anchor vào bảng theo dõi.
- Link PR luôn kèm UTM: `?utm_source=<bao>&utm_medium=pr&utm_campaign=tet2027` (chỉ mã báo, không dữ liệu cá nhân). Earned thì dùng URL sạch.
- Không anchor có từ "chuẩn nhất / chính xác nhất / số 1" (Luật Quảng cáo + E-E-A-T).

---

## 4. Kênh ngoài báo

| Kênh | Việc làm cụ thể | Ghi chú kiểm chứng / rủi ro |
|---|---|---|
| **"HARO kiểu Việt Nam"** (nhà báo tìm chuyên gia) | Em **không tìm thấy** nền tảng kết nối phóng viên – chuyên gia nào đang hoạt động ở VN (chưa xác minh có tồn tại). Thay bằng: (1) danh sách 40–60 phóng viên mục Đời sống / Gia chủ / Văn hoá / Số hoá tự xây (đọc 10 bài gần nhất của từng người); (2) **"Bộ tư liệu báo chí Tết 2027"** trên một trang (bảng D3–D7 + ảnh + câu trích sẵn của Đức Luân + điện thoại / email báo chí); (3) theo dõi nhóm Facebook / Zalo của người làm báo, nơi phóng viên hay hỏi nguồn (**chưa xác minh** nhóm cụ thể); (4) Qwoted / Featured (quốc tế) cho câu hỏi văn hoá châu Á (chưa xác minh có câu hỏi tiếng Việt) | Trả lời nhanh, ngắn, có số. Không bao giờ trả tiền để được trích |
| **Podcast** | 6–8 lượt khách mời Q1/2027: podcast tâm lý, phát triển bản thân, văn hoá, khởi nghiệp. Chủ đề "tự soi không mê tín" | Danh sách cụ thể: chưa xác minh. Mỗi tập: link ở mô tả (thường nofollow, giá trị là thương hiệu) |
| **YouTube / Shorts / TikTok** | Repo đã có hệ thống video ngắn (`video-ngan/`). 3 series: "Lịch Việt 30 giây", "Tuổi xông đất 2027 theo năm sinh", "Hai cách cộng số đời". Hợp tác 3–5 creator văn hoá / Tết, gắn nhãn hợp tác có trả phí | Luật QC 2025: người dùng MXH quảng cáo "phải có dấu hiệu phân biệt" → creator phải ghi #hợptác / #quảngcáo |
| **Zalo OA** | OA "Hiểu Bản Thân": tin hằng tuần (lịch âm, ngày tốt tuần), không bán vật phẩm; nút về /hom-nay | Quy định Zalo về tin nhắn chủ động: chưa xác minh chi phí 2026 |
| **Cộng đồng** | Trả lời trên VOZ (mục Tết / BĐS), Reddit r/VietNam (tiếng Anh, văn hoá), nhóm Facebook mua nhà / chung cư, Tinhte (công cụ). Chỉ trả lời có giá trị, ghi rõ là người của site | Không seeding ảo, không nick clone |
| **Trường đại học / viện / bảo tàng** | (1) Mời giảng viên Văn hoá học (mô hình bài Tuổi Trẻ, ĐH KHXH&NV TP.HCM) **bình luận độc lập** cho bài #7 và #10, không trả tiền đổi phát ngôn; (2) đề xuất **dữ liệu lịch âm mở** (bảng Tết, tháng nhuận 1900–2100 dạng CSV, giấy phép mở) cho sinh viên nghiên cứu: kiểu link .edu.vn tự nhiên; (3) Bảo tàng Dân tộc học VN / bảo tàng địa phương: tài trợ nhỏ hoặc đồng tổ chức tọa đàm "Tục xông đất xưa và nay" dịp Tết (khả năng hợp tác: **chưa xác minh**) | Trình bày như văn hoá dân gian, tuyệt đối không "phán" trong sự kiện học thuật |
| **Sàn bất động sản** | Batdongsan (bài trả tiền tab phong thuỷ, đã có giá), wiki BĐS (đề xuất làm nguồn trích bảng tuổi làm nhà), Alonhadat / Nhà Tốt (mục tư vấn, **chưa xác minh**); chủ đầu tư / môi giới: widget "đo hướng căn hộ" nhúng link | Link widget phải nofollow hoặc sponsored nếu có trao đổi lợi ích |
| **Wikipedia / Wikidata** | **Không** tự viết bài về công ty (xung đột lợi ích). Chỉ bổ sung trích dẫn dữ liệu lịch khi có nguồn báo độc lập | Tuân thủ COI |
| **Bing / Google thực thể** | Đồng bộ NAP + `sameAs` (env `MXH_*`, `CHUYEN_GIA_SAME_AS_*` đã có trong code) sau khi có hồ sơ báo chí thật | Không bịa link |

---

## 5. Ngân sách theo quý & KPI

### 5.1. Ba mức ngân sách (VND, chưa VAT, ước lượng, giá báo **chưa xác minh** trừ Batdongsan)

| Hạng mục | Tiết kiệm Q4/2026 | Tiết kiệm Q1/2027 | Chuẩn Q4/2026 | Chuẩn Q1/2027 | Mạnh Q4/2026 | Mạnh Q1/2027 |
|---|---|---|---|---|---|---|
| Earned / Digital PR: nghiên cứu dữ liệu, bộ tư liệu, đồ hoạ, nhân sự liên hệ báo | 12 tr | 12 tr | 25 tr | 25 tr | 45 tr | 45 tr |
| PR trả tiền Tier 3 (BĐS / ngách / địa phương) | 2 × 5,5 tr = 11 tr | 2 bài ≈ 10 tr | 4 bài ≈ 22 tr | 4 bài ≈ 22 tr | 6 bài ≈ 35 tr | 6 bài ≈ 35 tr |
| PR trả tiền Tier 2 (đời sống) | 0 | 1 bài ≈ 15 tr | 2 bài ≈ 35 tr | 3 bài ≈ 50 tr | 4 bài ≈ 80 tr | 5 bài ≈ 100 tr |
| PR trả tiền Tier 1 (1 bài khởi nghiệp / Tết) | 0 | 0 | 0 | 1 bài ≈ 50 tr | 1 bài ≈ 60 tr | 2 bài ≈ 120 tr |
| Podcast / creator (có nhãn hợp tác) | 0 | 5 tr | 10 tr | 20 tr | 25 tr | 40 tr |
| Tư vấn pháp lý duyệt mẫu nhãn + brief (một lần) | 5 tr | 0 | 8 tr | 0 | 10 tr | 0 |
| Dự phòng (sửa bài, đăng lại, ảnh) | 2 tr | 3 tr | 5 tr | 8 tr | 10 tr | 15 tr |
| **Cộng quý** | **≈ 30 tr** | **≈ 45 tr** | **≈ 105 tr** | **≈ 175 tr** | **≈ 265 tr** | **≈ 355 tr** |

Nguyên tắc phân bổ: **≥ 40% ngân sách (mức tiết kiệm) / ≥ 25% (mức mạnh) cho earned**. Đây là chỗ duy nhất có link tự nhiên. Không tăng chi trả tiền nếu sau 6 tuần earned chưa ra kết quả: sửa góc pitch trước.

### 5.2. KPI (đo thật, không đo "số bài")

| KPI | Công cụ | Mốc nền (đo trước 05/11/2026) | Mục tiêu 31/03/2027 (Chuẩn) |
|---|---|---|---|
| Referring domains **mới từ báo / .edu / .gov / tổ chức** (loại trừ spam) | Ahrefs (cần kết nối; chưa xác thực trong phiên này), GSC Links | đo | +15–25 domain, trong đó ≥ 8 earned |
| Tỉ lệ earned / tổng bài có nhắc thương hiệu | Bảng theo dõi | — | ≥ 40% |
| **Branded search** ("hiểu bản thân", "hieuban") | GSC hiệu suất, lọc truy vấn thương hiệu | đo | ×2 hiển thị, ×1,8 nhấp so với tháng 10/2026 |
| Traffic giới thiệu từ báo | GA4 / PostHog (UTM + `landing_viewed`) | 0 | ≥ 5.000 phiên; tỉ lệ `reading_started` ≥ 30% |
| **Thứ hạng cụm Tết**: "tuổi xông đất 2027", "tuổi làm nhà 2027", "lịch âm 2027", "xem ngày tốt tháng 1 2027", "hướng xấu năm 2027" | GSC (vị trí TB theo trang đích), kiểm SERP tay hằng tuần | đo | Top 10 ≥ 3/5 cụm vào 20/01/2027 |
| **Trích dẫn AI** (ChatGPT search, Perplexity, Gemini / AI Overviews, Copilot) | Bộ 30 câu hỏi cố định ("tuổi xông đất 2027 cho gia chủ 1990", "Tết 2027 ngày nào"…) chạy tay 2 tuần / lần, ghi có hoặc không trích hieuban.com; báo cáo AI của Bing Webmaster nếu có | đo | Được trích ≥ 8/30 câu |
| Tỉ lệ pitch → đăng | Bảng theo dõi | — | ≥ 12–15% |
| Thời gian trả lời phóng viên | Bảng theo dõi | — | ≤ 2 giờ (giờ hành chính) mùa Tết |
| Tuân thủ | Rà từng bài | — | 100% bài trả tiền có nhãn quảng cáo + link sponsored/nofollow; 0 bài có câu phán hung / vật phẩm / tên bệnh |

Báo cáo **hằng tháng** (ngày 5): bài đã đăng, link (rel thực tế), lượt giới thiệu, branded search, hạng cụm Tết, trích dẫn AI, chi phí / phiên giới thiệu.

---

## 6. Mẫu email pitch nhà báo (tiếng Việt, ≤ 200 chữ)

**Mẫu A: earned, dữ liệu (dùng cho #1)**

> **Tiêu đề:** Cùng ngày sinh, vì sao hai app ra hai "số đời" khác nhau?
>
> Chào chị [Tên],
>
> Em đọc bài "[tên bài gần đây của chị]" về [chủ đề]. Em có một góc nhỏ có thể hợp mục của chị.
>
> Người sinh 24/10/1988 tra "thần số học" sẽ thấy có trang ra số 33, có trang ra số 6. Không trang nào tính sai. Đó là hai quy ước cộng số khác nhau. Bên em đã chạy cả hai cách cho mọi ngày từ 1940 đến 2010 và có bảng các ngày sinh bị lệch số (đây là phép tính trên lịch, không phải khảo sát người dùng).
>
> Em gửi được trong hôm nay: bảng số liệu (CSV + ảnh) để chị tự kiểm, kèm 15 phút trao đổi với anh Đức Luân, chủ biên Hiểu Bản Thân, hơn 15 năm nghiên cứu. Bọn em không yêu cầu đặt link.
>
> Chị có muốn em gửi bảng trước không ạ?
>
> [Tên] · Phụ trách báo chí, Hiểu Bản Thân (Hieu Ban Co Ltd) · [ĐT] · [email báo chí]

**Mẫu B: mùa Tết, phong tục (dùng cho #7, gửi phóng viên văn hoá / báo địa phương)**

> **Tiêu đề:** Bảng 46 tuổi xông đất Tết Đinh Mùi 2027 (để tham khảo)
>
> Chào anh [Tên],
>
> Tết Đinh Mùi rơi vào 06/02/2027, mùa bạn đọc tìm "tuổi xông đất" sắp bắt đầu. Bên em có bảng 46 tuổi (sinh 1960–2005) tính theo tục tam hợp, lục hợp và Tam tai. Kèm theo là ghi chú vì sao các bài liệt kê khác nhau (mỗi sách đếm một kiểu).
>
> Anh dùng tự do được, chỉ cần ghi nguồn "Hiểu Bản Thân". Nếu anh cần thêm một ý kiến chuyên gia về tục lệ (không phán, không bán vật phẩm), anh Đức Luân trả lời được trong ngày.
>
> Em gửi bảng ở đây: hieuban.com/tuoi-xong-dat/2027
>
> [Chữ ký như trên]

**Quy tắc gửi:** mỗi email một người, không CC; không đính kèm thông cáo ở lần đầu; gửi thứ Ba đến thứ Năm, 8:30–10:00; follow-up **một lần** sau 3–5 ngày làm việc rồi dừng; ghi lại mọi phản hồi. Nhà báo hỏi "có trả tiền không" → trả lời thật: earned thì không trả tiền; nếu muốn bài tài trợ thì chuyển phòng quảng cáo, có nhãn.

---

## Phụ lục: việc cần làm trước khi chi đồng đầu tiên

1. Luật sư xác nhận mẫu nhãn "Thông tin quảng cáo" theo Luật QC 2025 + nghị định hướng dẫn; duyệt brief nội dung (mục 0.2).
2. Xin ít nhất 3 báo giá văn bản (bookingpr.vn + 2 đơn vị khác + phòng quảng cáo Batdongsan cho giá 2026), có điều khoản `rel`, nhãn, thời hạn lưu bài.
3. Đo mốc KPI (GSC, GA4, kết nối Ahrefs, bộ 30 câu hỏi AI) trước 05/11/2026.
4. Dựng trang "Bộ tư liệu báo chí Tết 2027" + email báo chí riêng; chuẩn bị 5 câu trích sẵn của Đức Luân (đã qua bộ lọc cụm cấm).
5. Kiểm lại mọi con số D3–D7 trên trang đích đúng ngày gửi pitch (không chép tay).
