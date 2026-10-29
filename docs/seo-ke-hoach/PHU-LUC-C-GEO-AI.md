# Kế hoạch GEO/AEO cho hieuban.com — 29/10/2026

Người soạn: AI Citation Strategist (agent). Phạm vi: phân tích, không sửa repo.

> **Cách đọc độ tin cậy.** Mọi nhận định về "AI đang trích ai" trong file này dựa trên **WebSearch (chỉ mục web của công cụ tìm kiếm phía Mỹ)** ngày 29/10/2026, không phải ảnh chụp trực tiếp AI Overviews / Perplexity / ChatGPT / Gemini. Agent **không đăng nhập và không chạy được** bốn nền tảng đó. Kết quả tìm kiếm là chỉ báo gần đúng tốt cho Perplexity/ChatGPT Search (cả hai lấy nguồn từ chỉ mục web), kém chính xác hơn cho AI Overviews (theo chỉ mục Google, cá nhân hoá theo vùng VN). Chỗ nào chưa xác minh được, file ghi **[chưa xác minh]**. AI trả lời không tất định: mọi số là ảnh chụp một thời điểm.

---

## 0. Phát hiện quan trọng nhất (đọc trước)

| # | Phát hiện | Mức | Việc cần làm |
|---|---|---|---|
| F1 | Tìm `"hieuban.com" OR "Hiểu Bản Thân"` → **không ra trang nào của hieuban.com**; công cụ tìm kiếm gợi sang **hieubanthan.com** — một site KHÁC cũng tên "Hiểu Bản Thân" (bài test MBTI/IQ/EQ/DISC/Holland, email hieubanthan@gmail.com, logo nhắc "HapoDigital"). | **P0 — xung đột thực thể** | LLM gộp hai thực thể cùng tên → trích nhầm, hoặc "Hiểu Bản Thân" bị hiểu là site test tính cách. Xem mục 2.1 (định danh phân biệt). |
| F2 | Năm câu hỏi thử, nguồn được trả về gần như toàn **blog của nhà bán lẻ/fintech lớn** (fptshop, viettelstore, dienmayxanh, momo, shopee, didongviet, cellphones, hoanghamobile, dienmaycholon, mytour) + trang việc làm (vietnamworks, jobsgo, careerlink) + trang luật (luatminhkhue, thuvienphapluat) + **trang AI tiếng Việt máy dịch** (jenova.ai, masterseanchan). | Cao | Các domain này thắng nhờ **độ uy tín domain**, không nhờ độ sâu. Hieuban có lợi thế số liệu tính chính xác + bảng — phải biến thành "dữ kiện gốc dễ trích" (mục 3). |
| F3 | Nguồn hiện tại **mâu thuẫn nhau** (xemlicham vs chogia về ngày 12/12/2026; tam tai 2027 tuổi Mão; 29 hay 30 Tết 2027; năm 2027 có tháng nhuận không). Mô hình AI trả lời kèm "các nguồn chưa thống nhất". | Cơ hội lớn | Trang nào nói **rõ nhất, có căn cứ tính, có ngày cập nhật, có giải thích vì sao nguồn khác lệch** là trang AI thích trích khi gặp mâu thuẫn. Hieuban đã có engine Hồ Ngọc Đức + nhiều trường phái → đúng thế mạnh. |
| F4 | Wikipedia tiếng Việt "Thần số học" tồn tại (cập nhật 07/04/2026, ~1.100 chữ, nguồn chủ yếu nước ngoài, có mục "giả khoa học"). Không có liên kết ngoài nào tới site tiếng Việt chuyên môn ngoài Wiktionary. | Trung bình | Không chèn link hieuban vào Wikipedia (xung đột lợi ích, sẽ bị lùi sửa). Giá trị Wikipedia ở đây là **thực thể chủ đề**, không phải kênh link. |
| F5 | Sự kiện văn hoá ("tuổi xông đất 2027", "Tết Đinh Mùi") đang được báo/blog bán lẻ đăng **từ 3–4 tháng trước Tết**. Tết 2027 = 06/02/2027 → còn ~14 tuần. | **Theo mùa — gấp** | Cụm Tết 2027 phải đầy đủ + được nhắc đến bên ngoài trước 15/12/2026. |

---

## 1. Nguồn tiếng Việt AI đang trích, theo chủ đề

### 1.1 Bản đồ nguồn (từ WebSearch 29/10/2026)

| Câu hỏi thử | Nguồn top trả về | Loại nguồn | Hieuban có xuất hiện? |
|---|---|---|---|
| thần số học là gì | didongviet, viettelstore, vietnamworks, fptshop, shopee blog, dienmayxanh, momo (2 URL) | Blog bán lẻ / fintech / việc làm | Không |
| tuổi xông đất 2027 Đinh Mùi | dienmayxanh, cellphones, luatminhkhue, nongnghiepmoitruong (báo), fptshop, viettelstore | Bán lẻ + báo + luật | Không |
| cách gieo quẻ kinh dịch 3 đồng xu | App Store, ai-hay.vn, jenova.ai (3 URL), vnexpress (bài vật lý cũ), trang spam hồ sơ (comicvine, hashnode, docker hub) | **Khoảng trống — không có hướng dẫn chuẩn** | Không |
| bát tự là gì tứ trụ | fptshop, masterseanchan (3 URL), muaban, baodautu, jenova.ai | Bán lẻ + chuyên gia nước ngoài dịch máy | Không |
| lá số tử vi là gì 12 cung | luatminhkhue, jobsgo, fptshop, mytour, dienmaycholon, hoanghamobile (2), masterseanchan | Bán lẻ + luật + du lịch | Không |
| hướng nhà hợp tuổi 1990 | wiki.batdongsan (2), muaban, fptshop, careerlink (4), dienmayxanh | Bất động sản + việc làm | Không |
| xem ngày tốt cưới tháng 12/2026 | chogia.vn, xemlicham.com (4), fptshop | Lịch chuyên dụng + bán lẻ | Không |
| lịch âm 2027 / Tết Đinh Mùi | dienmayxanh, viettelstore, 24hstore, cellphones, tuyensinh247, thuvienphapluat | Bán lẻ + giáo dục + luật | Không |

### 1.2 Kết luận

1. **Không có "nhà chuyên môn" nào thống trị** — đây là thị trường bị chiếm bởi domain mạnh viết bài phổ thông. AI ghép câu trả lời từ 4–8 nguồn như vậy và thường **thêm câu cảnh báo khoa học**. Nguồn có giọng cân bằng ("tham khảo, không thay thế…") khớp với cách AI muốn trả lời → hieuban đã đúng giọng.
2. **Gieo quẻ Kinh Dịch là khoảng trống rõ nhất**: kết quả là quảng cáo app + trang spam; AI phải tự bổ sung bằng "kiến thức phổ biến". Một trang hướng dẫn chuẩn, có bảng 6/7/8/9 và ví dụ quẻ, có khả năng cao được trích **[chưa xác minh trên AI Overviews]**.
3. **Lịch và ngày tốt**: xemlicham, chogia thắng nhờ **một URL cho mỗi ngày/tháng** — hieuban đã có cấu trúc này (`/xem-ngay-tot/{ngày}`, `/{việc}-thang-…`, `/lich-am/{năm}`). Thiếu: được nhắc tên bên ngoài.
4. **Nguồn AI-dịch-máy (jenova.ai, masterseanchan)** đang chen vào kết quả tiếng Việt. Chúng yếu ở thuật ngữ Việt và lịch Việt (UTC+7, Tết Việt khác Tết Trung). Thông điệp phân biệt của hieuban: **"tính theo âm lịch Việt Nam"** — nên lặp lại rõ ràng trong mọi trang + mọi lần được nhắc tên.

### 1.3 Hieuban cần xuất hiện ở đâu (kể cả nhắc tên không link)

LLM học/trích "ai là nguồn uy tín" từ **đồng xuất hiện tên thương hiệu + chủ đề** trên nhiều domain độc lập. Ưu tiên theo khả năng được trích:

| Ưu tiên | Nơi | Vì sao | Cách hợp lệ |
|---|---|---|---|
| 1 | **Báo điện tử VN mục đời sống/văn hoá** (VnExpress Đời sống, Tuổi Trẻ, Thanh Niên, Dân trí, Zing/Znews, VietnamNet, Báo Nông nghiệp & Môi trường — đã thấy trong kết quả xông đất) | Domain uy tín cao, AI Overviews và Perplexity trích nhiều | Đề xuất **dữ kiện gốc** cho phóng viên mùa Tết (mục 3.4: "năm 2027 có/không tháng nhuận, giao thừa 29 Tết vì sao") — PR dữ liệu, không mua bài PR trá hình |
| 2 | **Các blog bán lẻ đang thắng** (fptshop "For Gamers", cellphones Sforum, dienmayxanh "Kinh nghiệm hay") | Chính họ là nguồn AI trích | Liên hệ biên tập: đề nghị dùng **bảng/ảnh tóm tắt có ghi nguồn** (ảnh `/og/y-chinh` đã có QR + hieuban.com) — họ cần nội dung đúng, mình cần được nhắc tên |
| 3 | **YouTube** (tiếng Việt, video ngắn + dài) | Gemini/AI Overviews trích YouTube nhiều; repo đã có pipeline `video-ngan/` | Mô tả video có định nghĩa + link trang trụ; tên kênh khớp tên thương hiệu |
| 4 | **Diễn đàn: Voz (f17 chuyện trò, góc tâm linh), Tinhte (thảo luận app), Webtretho (cưới hỏi, nhà cửa, xông đất), Reddit r/VietNam, r/vozforums** | Perplexity và ChatGPT Search trích Reddit/diễn đàn cho câu "nên dùng web nào" | Chỉ tham gia thật, xem mục 2.6 |
| 5 | **Danh bạ/hồ sơ**: Crunchbase, LinkedIn Company, Product Hunt (bản tiếng Anh), danh bạ startup VN | Giúp Knowledge Graph xác định thực thể | Mục 2.4 |
| 6 | **Podcast/phỏng vấn chuyên gia Đức Luân** | Tạo "người" có thực, gắn tên với chủ đề | Mục 2.3 |

---

## 2. Kế hoạch entity building

### 2.1 Bước 0 — sửa xung đột tên (P0, tuần này)

Vấn đề: "Hiểu Bản Thân" là tên chung, đã có hieubanthan.com dùng (test tính cách). LLM thấy hai site cùng tên, khác chủ đề.

| Việc | Chi tiết |
|---|---|
| Chốt **một dạng tên chuẩn** dùng ở mọi nơi bên ngoài | Đề xuất: **"Hiểu Bản Thân (hieuban.com)"** lần đầu nhắc, sau đó "hieuban.com". Domain là phần phân biệt duy nhất không trùng. |
| Schema Organization | Thêm `alternateName: ["hieuban.com", "HieuBan"]`, `legalName` (đã có Hieu Ban Co Ltd), `description` nêu rõ "thần số học, tử vi, bát tự, Kinh Dịch, phong thuỷ, lịch âm Việt Nam" — để mô tả thực thể khác hẳn site test MBTI. **Không** thêm `sameAs` tới hieubanthan.com. |
| Trang `/gioi-thieu` | Một câu định nghĩa thực thể 40–50 chữ: "Hiểu Bản Thân (hieuban.com) là website tiếng Việt do Hieu Ban Co Ltd vận hành, tính thần số học, lá số Tử vi, Bát tự, quẻ Kinh Dịch và phong thuỷ theo âm lịch Việt Nam…" — đây là câu LLM sẽ chép khi được hỏi "hieuban.com là gì". |
| Theo dõi | Hằng tháng hỏi 4 nền tảng: "hieuban.com là gì?" và "Hiểu Bản Thân là web gì?" — ghi nhận nhầm lẫn (câu hỏi Q37–Q38 ở mục 4). |

### 2.2 Wikipedia / Wikidata — điều kiện thật

**Wikipedia tiếng Việt (bài về hieuban.com hoặc Đức Luân):** **chưa đủ điều kiện, không nên tạo.**
- Điều kiện độ nổi bật (WP:NOTABILITY / WP:ĐNB): **nhiều nguồn độc lập, đáng tin, viết đáng kể về chủ thể** (không phải thông cáo, không phải bài trả phí, không phải tự giới thiệu). Thường cần ≥ 3 bài báo chính thống viết *về* hieuban.com hoặc *về* Đức Luân (không chỉ trích một câu).
- Rủi ro nếu tạo sớm: bị đề nghị xoá + đánh dấu quảng cáo; người có quan hệ lợi ích viết bài vi phạm quy định xung đột lợi ích (phải khai báo). Một bài bị xoá còn tệ hơn không có.
- Mốc xét lại: khi có ≥ 3 bài báo độc lập viết về site/chuyên gia (mục tiêu GĐ: 6–12 tháng).
- Việc hợp lệ ngay: **không**. Không chèn link hieuban vào bài "Thần số học", "Tử vi", "Âm lịch Việt Nam".

**Wikidata:** ngưỡng thấp hơn Wikipedia nhưng vẫn cần "thực thể có thể nhận diện rõ, mô tả được bằng tham chiếu công khai nghiêm túc" (tiêu chí 2 của Wikidata:Notability).
- Khi có: đăng ký doanh nghiệp công khai (mã số thuế Hieu Ban Co Ltd tra được trên cổng quốc gia) + ít nhất 1–2 nguồn độc lập nhắc đến → có thể tạo item tổ chức (instance of: website; operator: Hieu Ban Co Ltd; official website; language: Vietnamese; main subject: numerology, Zi Wei Dou Shu, Four Pillars, I Ching, feng shui).
- Đề xuất: **chờ 1–2 bài báo độc lập**, rồi tạo item, khai trung thực. Không tạo item cho Đức Luân cho tới khi có nguồn ngoài về ông.

### 2.3 Hồ sơ chuyên gia Đức Luân (E-E-A-T bên ngoài site)

Hiện trạng: tên đứng trên site, chưa link ngoài → với LLM, "Đức Luân" là tên không xác minh được.

| Thứ tự | Việc | Kết quả mong đợi | Thời gian |
|---|---|---|---|
| 1 | Hồ sơ cá nhân thật: LinkedIn (tiêu đề nêu môn nghiên cứu + "Chủ biên Hiểu Bản Thân (hieuban.com)"), Facebook trang cá nhân công khai / trang tác giả, kênh YouTube hoặc mục "người dẫn" trên kênh thương hiệu | Có `sameAs` thật cho Person (env `CHUYEN_GIA_SAME_AS_DUC_LUAN`) | 2 tuần |
| 2 | **Bài viết đứng tên trên domain khác**: bài khách mời (guest column) ở báo/tạp chí mục văn hoá, Medium/Substack tiếng Việt, Spiderum (cộng đồng viết lớn ở VN) — chủ đề trung tính: "Vì sao năm 2027 giao thừa là 29 Tết", "Tết Việt và Tết Trung lệch nhau khi nào" | Đồng xuất hiện "Đức Luân + chủ đề"; Spiderum hay được AI trích cho câu giải thích | 1–3 tháng |
| 3 | **Podcast / livestream phỏng vấn** (kênh văn hoá, đời sống, khởi nghiệp) — nói về cách làm có kiểm chứng, không phán vận mệnh | Mô tả podcast + bản chép lời là văn bản AI đọc được | 2–4 tháng |
| 4 | **Trích dẫn trong bài báo** (nhờ PR dữ liệu mục 3.4) | Nguồn độc lập — nền cho Wikidata/Knowledge Panel | 2–6 tháng |
| 5 | Sách / ebook (tuỳ chọn, dài hạn): "Âm lịch Việt Nam cho người bận rộn" — có ISBN, có trên Google Books | Thực thể "tác giả" mạnh nhất | 6–12 tháng |

Quy tắc giữ nguyên EEAT-1/BM-1: chỉ ghi điều chuyên gia thật sự làm; không gắn "tác giả" cho bài ông chưa đọc.

### 2.4 Google Knowledge Panel

- Không "đăng ký" được — Google tự tạo khi thực thể đủ tín hiệu. Tín hiệu: Organization schema đầy đủ + `sameAs` tới hồ sơ thật, tên nhất quán, nguồn độc lập nhắc đến, (về sau) Wikidata.
- **Google Business Profile**: chỉ dùng nếu Hieu Ban Co Ltd có địa chỉ giao dịch thật nhận khách/thư (danh mục "Website" không có; doanh nghiệp online-only không đủ điều kiện GBP theo chính sách — không lập địa chỉ ảo).
- Khi Knowledge Panel xuất hiện: nhận quyền (claim) qua tài khoản Google đã xác minh Search Console.

### 2.5 Danh bạ uy tín (hợp lệ, không trả tiền đăng hàng loạt)

| Danh bạ | Vì sao | Ghi chú |
|---|---|---|
| Cổng thông tin đăng ký doanh nghiệp quốc gia / masothue | Nguồn công khai cho legalName | Tự có khi đăng ký; kiểm tên trùng khớp |
| **Đăng ký / thông báo website TMĐT với Bộ Công Thương (online.gov.vn)** | Bắt buộc khi có thanh toán (Sao, hội viên); logo "Đã thông báo" là tín hiệu tin cậy thật cho người Việt và là trang công khai mang tên + domain | Liên quan `docs/PHAP-LY-2026.md` |
| Crunchbase, LinkedIn Company | Knowledge Graph đọc | Mô tả giống câu định nghĩa thực thể |
| Product Hunt (ra mắt bản tiếng Anh nếu có), AlternativeTo | Diễn đàn/LLM tiếng Anh hay dẫn | Chỉ khi có trang tiếng Anh |
| App Store / Google Play (nếu đóng gói PWA) | Kết quả "cách gieo quẻ" hiện cả app | Dài hạn |

Tránh: danh bạ "link farm", hồ sơ spam trên hashnode/docker hub/leetcode/coursera (đối thủ đang làm — thấy trong kết quả; Google coi là spam, không giúp LLM).

### 2.6 Mạng xã hội và cộng đồng

| Kênh | Vai trò GEO | Nội dung | Tần suất |
|---|---|---|---|
| **YouTube** | Nguồn được Gemini/AI Overviews trích; bản chép lời là văn bản | Video ngắn (đã có pipeline) + 1 video dài/tháng "giải thích + làm thử công cụ"; mô tả có định nghĩa 40–60 chữ + link trang | 3 ngắn/tuần, 1 dài/tháng |
| **TikTok** | Tìm kiếm của người trẻ VN; ít được LLM trích trực tiếp | "Bạn là số mấy?", "Tết 2027 không có 30" | 3–5/tuần |
| **Facebook Page** | `sameAs`, người Việt tìm thương hiệu ở đây | Ảnh tóm tắt có QR, lịch tháng | 3/tuần |
| **Zalo OA** | Kênh quay lại (nhắc ngày tốt, giao tiết) — không phải GEO nhưng tạo thực thể "có thật" | Nhắc mốc lịch | Theo mốc |
| **Threads / X** | Tín hiệu thương hiệu, Perplexity đọc X | Dữ kiện ngắn có số | 3/tuần |
| **Reddit (r/VietNam, r/vozforums)**, **Voz**, **Tinhte**, **Webtretho**, **Facebook group** (cưới hỏi, xây nhà, thần số học) | Perplexity/ChatGPT trích thảo luận cho câu "web nào xem … chính xác" | Tài khoản cá nhân thật của người trong nhóm, **khai rõ là người làm hieuban.com**; trả lời câu hỏi bằng kiến thức trước, chỉ đưa link khi đúng câu hỏi; tối đa 1 link/10 câu trả lời; tuân luật từng nhóm/diễn đàn (Voz cấm quảng cáo ngoài khu vực cho phép) | 2–3 trả lời có giá trị/tuần |

Cấm: tài khoản ảo, tự hỏi tự trả lời, đăng hàng loạt, mua review — vừa vi phạm luật nền tảng, vừa bị LLM/Google coi là tín hiệu spam.

---

## 3. Kế hoạch nội dung GEO

### 3.1 Khuôn "đoạn trích được" (áp cho mọi trang trụ + trang cụm)

| Thành phần | Quy tắc | Ghi chú với hiện trạng |
|---|---|---|
| Định nghĩa đầu trang | 40–60 chữ, câu đầu dạng "X là …", có tên riêng + đối tượng + cách tính | "Trả lời nhanh" đã có; kiểm từng trang trụ có đúng dạng định nghĩa không |
| Câu "sự thật có ngày" | "Tính đến 29/10/2026, …"; "Theo âm lịch Việt Nam (UTC+7) …" | AI ưu tiên câu có mốc thời gian khi nguồn mâu thuẫn (F3) |
| Một bảng thật mỗi trang | Số do engine tính (đã có ở SEO-M) | Tiêu đề bảng là câu hỏi ("Tuổi nào xông đất hợp năm Đinh Mùi 2027?") |
| **Hộp "Vì sao các nguồn khác nói khác"** | 2–4 dòng: nguồn khác dùng lịch Trung Quốc / tam tai theo cách khác / tính 30 Tết sai… — không nêu tên đối thủ | **Khoảng trống lớn nhất** — đây là đoạn AI cần khi gặp mâu thuẫn |
| So sánh trường phái | Bảng 2 cột (Pitago vs Chaldea; Nam phái vs Trung Châu; lấy dụng thần 2 cách) | Đã có dữ liệu, cần đưa thành bảng tĩnh trong HTML |
| Hỏi đáp | 4–6 câu, mỗi câu trả lời ≤ 45 chữ, câu đầu trả lời thẳng | Đã có |
| Ngày cập nhật hiển thị | "Cập nhật 29/10/2026" thật (sổ `ngay_cap_nhat.json`) | Đã có |

### 3.2 Ví dụ cụ thể cho 5 mảng (+ lịch)

| Mảng | Trang/đoạn ưu tiên | Đoạn mẫu cần có (định nghĩa 40–60 chữ hoặc dữ kiện) | Bảng |
|---|---|---|---|
| **Thần số học** | Trang trụ `/than-so` + "Số chủ đạo 33 hay 6?" | "Với ngày sinh 24/10/1988, cộng hết các chữ số ra 33; cộng rút gọn từng phần ngày–tháng–năm ra 6. Hai cách đều đang được dùng ở Việt Nam; hieuban.com cho chọn cả hai và ghi rõ đang dùng cách nào." | Bảng 10 ngày sinh mẫu × 2 cách cộng |
| **Tử vi** | "Lá số Tử vi là gì", 14 chính tinh, "Tử vi theo lịch Việt khác lịch Trung thế nào" | Số liệu gốc: "Trong 1930–2025 có 1.376 ngày sinh mà đổi theo lịch Trung Quốc ra sai tháng âm, kéo theo sai cung Mệnh/Cục" (đã đo trong LS60) | Bảng ví dụ 5 ngày lệch lịch |
| **Bát tự** | "Bát tự là gì", "Dụng thần: vì sao có hai cách" | "Bát tự (Tứ trụ) là tám chữ can chi của năm, tháng, ngày, giờ sinh; tháng tính theo tiết khí, năm đổi ở Lập xuân (khoảng 4/2), không phải mùng 1 Tết." | Bảng năm sinh đầu năm: Lập xuân vs Tết |
| **Kinh Dịch** | **"Cách gieo quẻ Kinh Dịch bằng 3 đồng xu"** (khoảng trống F2) | "Gieo 3 đồng xu 6 lần, ngửa = 3, sấp = 2. Tổng 6 hào âm động, 7 dương tĩnh, 8 âm tĩnh, 9 dương động; xếp từ dưới lên." + ảnh minh hoạ 4 trường hợp | Bảng 6/7/8/9 + một quẻ ví dụ đầy đủ |
| **Phong thuỷ** | Tuổi hợp hướng (46 trang), dấu hiệu (23 trang) | "Nam sinh 1990 (năm theo Lập xuân) thuộc cung Khảm, hợp Đông Nam, Đông, Nam, Bắc; người sinh 1/1–3/2/1990 tính theo năm 1989." — câu cuối là điểm các blog khác bỏ sót | Bảng 8 hướng × du niên |
| **Lịch / ngày tốt / Tết** | `/lich-am/2027`, `/tuoi-xong-dat/2027`, `/xem-ngay-tot/cuoi-hoi-thang-12-2026` | "Năm Đinh Mùi 2027: mùng 1 Tết là thứ Bảy 06/02/2027; tháng Chạp năm trước có 29 ngày nên giao thừa là đêm 29 Tết (05/02/2027)." (engine phải xác nhận số) | Bảng 12 tháng âm: mùng 1, đủ/thiếu, nhuận |

### 3.3 Trang mới đề xuất (ưu tiên theo khả năng được trích)

1. **"Tết 2027: những con số chắc chắn"** — mùng 1, giao thừa 29 Tết, có/không tháng nhuận, Lập xuân 2027, tuổi xông đất, hướng xuất hành — mỗi số kèm "tính theo Hồ Ngọc Đức, UTC+7". Hạn: **trước 15/11/2026**.
2. **"Âm lịch Việt Nam và Trung Quốc lệch nhau khi nào"** — danh sách các năm lệch Tết (ví dụ Tết 1985, 2007 lệch… — engine xuất), tác động tới tuổi, tử vi. Nội dung gốc duy nhất trên mạng tiếng Việt **[chưa xác minh độ độc nhất]**.
3. **"Bảng so sánh các trường phái thần số học"** (Pitago / Chaldea), **"Nam phái và Trung Châu phái Tử vi khác gì"**.
4. **"Cách gieo quẻ Kinh Dịch"** dạng HowTo văn bản (không cần rich result) + ảnh từng bước.

### 3.4 Dữ kiện gốc làm PR (cho báo trích)

| Dữ kiện | Nguồn trong hệ thống | Mùa |
|---|---|---|
| Năm 2027 giao thừa 29 Tết, Tết 06/02 | `/v1/lich/nam` | Tháng 11–1 |
| Số ngày tốt cưới hỏi mỗi tháng 2027 theo 12 trực / hoàng đạo | `chon_ngay` | Tháng 11–12 (mùa cưới) |
| "1.376 ngày sinh 1930–2025 lệch tháng âm nếu dùng lịch Trung Quốc" | LS60 | Bất kỳ |
| Tỉ lệ ngày sinh có số chủ đạo 33 khác 6 giữa hai cách cộng (mẫu 1940–2010) | `thanso_ty_le` | Bất kỳ |

Gửi kèm: bảng CSV + 1 ảnh có QR + câu "nguồn: hieuban.com tính theo âm lịch Việt Nam". Không cam kết "chính xác tuyệt đối".

### 3.5 Tần suất cập nhật

| Loại | Tần suất |
|---|---|
| Trang theo năm (lịch âm, xông đất, làm nhà, hướng xấu năm) | Dựng năm sau từ tháng 9 năm trước; rà lại tháng 11 và tháng 1 |
| Trang ngày tốt theo tháng/việc | Tự động (đã có), kiểm 12 tháng tới luôn có |
| Trang trụ 5 mảng | Rà "Trả lời nhanh" + hộp mâu thuẫn mỗi quý |
| Bài blog | 2 bài/tuần, ưu tiên câu hỏi có trong bộ theo dõi mục 4 mà hieuban chưa được trích |
| Dữ kiện PR | 1 gói/tháng, 3 gói trong mùa Tết |

---

## 4. Cách đo

### 4.1 Bộ 40 câu hỏi theo dõi hằng tháng

Ghi cho mỗi câu × mỗi nền tảng: (a) hieuban.com có được **trích link** không; (b) có được **nhắc tên** không; (c) nguồn nào được trích (ghi 3 domain đầu); (d) câu trả lời có **sai dữ kiện** không (ví dụ ghi 30 Tết).

**Thần số học (8)**
1. Thần số học là gì?
2. Cách tính số chủ đạo theo ngày sinh?
3. Sinh ngày 24/10/1988 số chủ đạo là mấy?
4. Số chủ đạo 33 có ý nghĩa gì?
5. Thần số học Pitago và Chaldea khác nhau thế nào?
6. Năm cá nhân 2027 của tôi là số mấy, cách tính?
7. Số chủ đạo 7 hợp nghề gì?
8. Web xem thần số học miễn phí nào chính xác?

**Tử vi (7)**
9. Lá số tử vi là gì?
10. Lập lá số tử vi online miễn phí ở đâu?
11. Cung Mệnh vô chính diệu là gì?
12. Tử vi Nam phái và Trung Châu phái khác nhau thế nào?
13. Sao Thái Âm ở cung Phu Thê nghĩa là gì?
14. Hoá Kỵ ở cung Tài Bạch có xấu không?
15. Không biết giờ sinh có xem tử vi được không?

**Bát tự (5)**
16. Bát tự là gì?
17. Bát tự và tử vi khác nhau thế nào?
18. Dụng thần là gì, cách tìm dụng thần?
19. Sinh năm 2000 mệnh gì? (cụm mệnh theo năm)
20. Sinh đầu tháng 2 thì tính tuổi năm nào trong bát tự?

**Kinh Dịch (5)**
21. Cách gieo quẻ Kinh Dịch bằng 3 đồng xu?
22. Hào động là gì?
23. Quẻ Thuần Càn nghĩa là gì?
24. Mai Hoa Dịch Số là gì, cách lập quẻ?
25. Gieo quẻ Kinh Dịch online ở đâu?

**Phong thuỷ (6)**
26. Nam sinh 1990 hợp hướng nhà nào?
27. Nữ 1985 hợp hướng nào?
28. Cách xác định hướng nhà bằng la bàn điện thoại?
29. Nhà chung cư tính hướng theo cửa chính hay ban công?
30. Năm 2027 hướng nào xấu (Tam Sát, Ngũ Hoàng)?
31. Gương đối diện cửa chính có sao không?

**Lịch / ngày tốt / Tết (7)**
32. Tuổi xông đất năm 2027?
33. Tuổi nào làm nhà năm 2027 được?
34. Mùng 1 Tết 2027 là ngày nào, có 30 Tết không?
35. Năm 2027 có tháng nhuận không?
36. Ngày tốt cưới hỏi tháng 12 năm 2026?
37. Đổi ngày âm sang dương lịch?
38. Kim lâu là gì, tuổi nào phạm kim lâu 2027?

**Thương hiệu (2)**
39. hieuban.com là gì? (đo xung đột F1)
40. Hiểu Bản Thân là web gì, có đáng tin không?

### 4.2 Nền tảng và cách chạy

| Nền tảng | Cách chạy | Lưu ý |
|---|---|---|
| Google AI Overviews / AI Mode | Trình duyệt ẩn danh, vùng VN (VPN VN nếu chạy từ nơi khác), tiếng Việt | Không phải câu nào cũng hiện AIO — ghi "không hiện" là một kết quả |
| ChatGPT (bật tìm kiếm) | Tài khoản sạch, không bộ nhớ, prompt nguyên văn | Ghi cả khi không tìm web |
| Gemini app | Tài khoản sạch | Kết quả chịu ảnh hưởng Google-Extended (mục 5) |
| Perplexity | Chế độ mặc định | Ghi danh sách nguồn đầy đủ |
| Copilot (Bing) | Tuỳ chọn thứ 5 | Bing Webmaster đã kết nối → có báo cáo AI performance trong Bing Webmaster **[chưa xác minh tính năng ở tài khoản này]** |

Chạy mỗi câu **2 lần** (AI không tất định), ghi "trích nếu ≥ 1/2 lần". Cùng ngày mỗi tháng (đề xuất ngày 1). Lưu ảnh chụp.

### 4.3 Chỉ số

| Chỉ số | Công thức | Mốc ban đầu (ước) | Mục tiêu 6 tháng |
|---|---|---|---|
| Tỉ lệ trích (citation rate) | số câu có link hieuban / 40, theo từng nền tảng | ~0% (F1: không thấy trên chỉ mục tìm kiếm) **[cần đo baseline thật]** | ≥ 15% trên Perplexity, ≥ 10% AIO |
| Tỉ lệ nhắc tên | câu có tên "hieuban.com"/"Hiểu Bản Thân (hieuban.com)" / 40 | ~0% | ≥ 20% |
| **Share of voice** | lượt hieuban được trích / tổng lượt trích mọi domain trong 40 câu × 4 nền tảng | — | Top 5 domain ở cụm Lịch/Tết và Kinh Dịch |
| Nền tảng phủ | số nền tảng có ≥ 1 lượt trích | 0/4 | ≥ 3/4 |
| Độ chính xác thương hiệu | câu 39–40 trả lời đúng (không nhầm hieubanthan.com) | **Rủi ro cao** | 4/4 nền tảng đúng |
| Lượt truy cập từ AI | GA4/PostHog nguồn chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com; GSC không tách AIO riêng | — | Tăng theo tháng |

Đối thủ đối chiếu share of voice: fptshop.com.vn, dienmayxanh.com, viettelstore.vn, momo.vn, xemlicham.com, chogia.vn, masterseanchan.com, jenova.ai.

### 4.4 Công cụ

- **Miễn phí, làm ngay**: bảng tính (Google Sheets) 40 câu × 4 nền tảng × tháng; GA4 + PostHog lọc nguồn AI; GSC; Bing Webmaster.
- **Trả phí (cần chủ dự án duyệt chi phí)**: Profound, Peec AI, Otterly.ai, Semrush AI Toolkit, Ahrefs Brand Radar — tự động chạy bộ câu hỏi; **kiểm hỗ trợ tiếng Việt và vùng VN trước khi mua** **[chưa xác minh]**. Với 40 câu/tháng, làm tay ~3 giờ — đủ trong 3 tháng đầu.
- Repo đã có skill `seo-geo`, `seo-profound` có thể dùng cho bước rà trang.

---

## 5. Quyết định treo: có nên mở Google-Extended?

### 5.1 Google-Extended điều khiển gì (theo nguồn thứ cấp, khớp tài liệu Google đã biết)

- Là **token trong robots.txt**, không phải bot riêng (Googlebot vẫn tải trang).
- Chặn → Google **không dùng nội dung để huấn luyện mô hình Gemini** VÀ **không dùng để "grounding" câu trả lời trong Gemini app / Gemini API**.
- **Không ảnh hưởng** Google Search, xếp hạng, **AI Overviews và AI Mode** (hai thứ này đi theo Googlebot). Muốn kiểm soát AIO thì dùng `nosnippet` / `data-nosnippet` / `max-snippet`.
- Không có hiệu lực ngược: dữ liệu đã thu trước khi chặn không chắc được loại bỏ.
- **Không tách được huấn luyện và grounding**: mở là mở cả hai.
- Có nguồn thứ cấp (hartzer.it.com) nói Search Console có điều khiển AI tạo sinh mới từ 17/06/2026 cho AIO/AI Mode — **[chưa xác minh với tài liệu Google; cần chủ dự án kiểm trong Search Console]**.

### 5.2 Lợi / hại với hieuban.com

| Lợi khi mở | Hại khi mở |
|---|---|
| Gemini app (cài sẵn trên Android, tích hợp Google — tỉ lệ dùng ở VN tăng) có thể trích + đưa link khi trả lời "xông đất 2027", "gieo quẻ" | Nội dung KB (hàng nghìn câu biên soạn) vào dữ liệu huấn luyện → Gemini trả lời được mà **không cần dẫn về** (đúng lo ngại BM-1/BM-2) |
| Đồng bộ với chính sách "mở bot trả lời" đã áp cho OpenAI/Anthropic/Perplexity | Không thu hồi được về sau |
| Giá trị cốt lõi của site là **công cụ tính cá nhân** (lá số, quẻ, hướng nhà) — mô hình học văn bản không sao chép được phép tính cho từng ngày sinh → rủi ro bị "thay thế" thấp hơn site thuần nội dung | Bài "nháp ban biên tập" chưa thẩm định bị học rồi lặp lại kèm sai sót mà không ghi nguồn |
| Gemini grounding là một trong 4 nền tảng cần phủ (quy tắc "audit đa nền tảng") — đang tự loại mình khỏi 1/4 | Lợi ích chưa đo được (chưa có baseline) |

### 5.3 Khuyến nghị: **mở có giới hạn theo đường dẫn, thử 90 ngày**

robots.txt cho phép Allow/Disallow theo đường dẫn với token Google-Extended. Đề xuất (chủ dự án quyết, sửa trong `web/app/robots.ts`):

```
User-agent: Google-Extended
Allow: /lich-am/
Allow: /tuoi-xong-dat/
Allow: /xem-tuoi-lam-nha/
Allow: /xem-ngay-tot/
Allow: /doi-lich-am-duong
Allow: /gioi-thieu
Disallow: /
```

Lý do chọn tập này: dữ kiện lịch/tuổi là **sự thật tính được** (khó "đánh cắp" giá trị, dễ được trích khi nguồn khác mâu thuẫn — F3), đúng mùa Tết 2027, và `/gioi-thieu` giúp Gemini định danh đúng thực thể (F1). Giữ chặn KB biên soạn (thần số, tử vi, bát tự, kinh dịch, phong thuỷ), blog, công cụ.

Điều kiện đánh giá sau 90 ngày (cuối tháng 1/2027, ngay trước Tết):
- Gemini app trích hieuban ở ≥ 3/7 câu nhóm Lịch/Tết (Q32–Q38) → cân nhắc mở thêm trang trụ 5 mảng (chỉ trang trụ, không cụm).
- Không có lượt trích nào → đóng lại; lợi ích không bù rủi ro.

Nếu chủ dự án muốn giữ nguyên tắc BM-2 tuyệt đối: **giữ chặn** là lựa chọn hợp lý — AI Overviews / AI Mode (kênh lớn hơn ở VN) không bị ảnh hưởng. Mất mát chỉ là Gemini app.

---

## 6. Lộ trình 90 ngày (ưu tiên theo tác động lên trích dẫn)

| Tuần | Việc | Ai |
|---|---|---|
| 1 | Đo baseline 40 câu × 4 nền tảng (bắt buộc trước mọi sửa đổi) | Người vận hành |
| 1 | Sửa xung đột tên F1: dạng tên chuẩn, `alternateName`, câu định nghĩa ở `/gioi-thieu` | Dev |
| 1–2 | Lập hồ sơ thật: Facebook Page, YouTube, LinkedIn Đức Luân + Company → điền `MXH_*`, `CHUYEN_GIA_SAME_AS_*` | Chủ dự án |
| 2–3 | Trang "Tết 2027: những con số chắc chắn" + hộp "Vì sao nguồn khác nói khác" ở cụm lịch/tuổi | Dev + biên tập |
| 3 | Trang "Cách gieo quẻ Kinh Dịch bằng 3 đồng xu" (khoảng trống F2) | Biên tập |
| 3–4 | Quyết Google-Extended (mục 5) | Chủ dự án |
| 4–8 | Gói PR dữ liệu Tết gửi 10 báo + 5 blog bán lẻ; 1 bài khách mời Spiderum của Đức Luân | Chủ dự án |
| 4–12 | Cộng đồng: 2–3 trả lời có giá trị/tuần (Webtretho xông đất/cưới, Voz, Reddit), khai danh tính | Người vận hành |
| 6 | Đo lại (lần 2); 12 tuần đo lần 3 ngay trước Tết | Người vận hành |
| 12+ | Khi có ≥ 2 bài báo độc lập: tạo Wikidata item (khai trung thực). Wikipedia: chưa | Chủ dự án |

---

## Nguồn đã dùng (WebSearch / WebFetch 29/10/2026)

- Thần số học: [didongviet](https://didongviet.vn/dchannel/than-so-hoc-la-gi/), [viettelstore](https://viettelstore.vn/tin-tuc/than-so-hoc-la-gi), [vietnamworks](https://www.vietnamworks.com/hrinsider/than-so-hoc-la-gi.html), [fptshop](https://fptshop.com.vn/tin-tuc/thu-thuat/cach-tinh-than-so-hoc-157199), [shopee blog](https://shopee.vn/blog/than-so-hoc-la-gi/), [dienmayxanh](https://www.dienmayxanh.com/kinh-nghiem-hay/than-so-hoc-la-gi-1586675), [momo](https://www.momo.vn/blog/than-so-hoc-khoa-hoc-kham-pha-ban-than-thong-qua-nhung-con-so-c103dt180)
- Xông đất / Tết 2027: [dienmayxanh](https://www.dienmayxanh.com/kinh-nghiem-hay/con-bao-nhieu-ngay-nua-den-tet-2027-1589672), [cellphones](https://cellphones.com.vn/sforum/tet-dinh-mui-2027), [luatminhkhue](https://luatminhkhue.vn/ngay-mung-1-tet-dinh-mui-va-nhung-dieu-can-luu-y.aspx), [nongnghiepmoitruong](https://nongnghiepmoitruong.vn/xem-tuoi-xong-dat-xong-nha-nam-at-ty-2025-cho-gia-chu-tuoi-mui-d418956.html), [fptshop 2027](https://fptshop.com.vn/tin-tuc/for-gamers/2027-la-nam-con-gi-menh-gi-207401), [viettelstore 2027](https://viettelstore.vn/tin-tuc/2027-la-nam-con-gi), [thuvienphapluat](https://thuvienphapluat.vn/hoi-dap-phap-luat/mung-1-tet-2027-vao-ngay-nao-tet-am-lich-2027-co-ngay-30-khong-138080429.html), [24hstore](https://24hstore.vn/huong-dan-ky-thuat/bao-nhieu-ngay-nua-den-tet-n9836), [tuyensinh247](https://diemthi.tuyensinh247.com/dem-nguoc/tet-am-lich-2027-35.html)
- Kinh Dịch: [App Store Gieo Quẻ Dịch](https://apps.apple.com/us/app/-/id1046438802), [ai-hay.vn](https://ai-hay.vn/kinh-dich-kham-pha-bi-an-64-que-va-cach-luan-giai-hieu-qua-pN1UmH4kXxe), [jenova.ai](https://www.jenova.ai/vi/resources/free-ai-for-i-ching-readings), [vnexpress](https://vnexpress.net/dao-cua-vat-ly-phan-29-2021787.html)
- Bát tự: [fptshop](https://fptshop.com.vn/tin-tuc/for-gamers/bat-tu-la-gi-208864), [masterseanchan](https://www.masterseanchan.com/vi/blog/cach-doc-bieu-do-bazi-huong-dan-chi-tiet-tung-buoc/), [muaban](https://muaban.net/blog/bat-tu-la-gi-113599/), [baodautu](https://baodautu.vn/batdongsan/tim-hieu-ve-la-so-tu-tru-va-la-so-tu-vi-d94290.html)
- Tử vi: [luatminhkhue](https://luatminhkhue.vn/tu-vi-la-gi.aspx), [jobsgo](https://jobsgo.vn/blog/la-so-tu-vi-la-gi/), [mytour](https://mytour.vn/vi/blog/bai-viet/cach-xay-dung-la-so-tu-vi-theo-chuan-muc-nao.html), [hoanghamobile](https://hoanghamobile.com/tin-tuc/la-so-tu-vi/)
- Phong thuỷ: [wiki.batdongsan](https://wiki.batdongsan.com.vn/wiki/1990-hop-mau-gi-792506), [muaban](https://muaban.net/blog/1990-hop-huong-nha-nao-611059/), [careerlink](https://www.careerlink.vn/cam-nang-viec-lam/goc-ky-nang/1990-menh-gi)
- Ngày tốt: [chogia](https://chogia.vn/lich-am/ngay-tot/cuoi-hoi/thang-12-2026/), [xemlicham](https://www.xemlicham.com/am-lich/nam/2026/thang/12/ngay/12)
- Thực thể: [hieubanthan.com](https://hieubanthan.com/), [vi.wikipedia Thần số học](https://vi.wikipedia.org/wiki/Thần_số_học)
- Google-Extended: [Marie Haynes](https://www.mariehaynes.com/should-you-use-google-extended-in-robots-txt/), [trakkr](https://trakkr.ai/bots/google-extended/), [ppc.land](https://ppc.land/google-extended/), [hartzer (chưa xác minh)](https://hartzer.it.com/google-gemini/)
