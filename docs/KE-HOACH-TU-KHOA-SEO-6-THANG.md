# Kế hoạch từ khoá SEO / GEO / AEO 6 tháng cho blog (KW-6T, 2026-11-11)

> Đẩy khâu: **THU HÚT → TRẢI NGHIỆM** (bài blog dẫn sang công cụ). Đo bằng: Search Console (số truy vấn câu hỏi có hiển thị,
> theo cụm), PostHog `cross_cta_clicked{tu: blog}` / `end_cta_clicked`, `reading_completed{mo_dun: blog}`, `reading_started`
> của mảng được dẫn tới, `landing_viewed.den_tu = ai`.
>
> Bảng chi tiết (88 bài, lịch 26 tuần, bài cũ, chỉ số, ý tưởng):
> - Google Sheet: https://docs.google.com/spreadsheets/d/18JAE8th9sMRVRHy_VdY_-FTlwKLq8M326XZaH9Oy_lg/edit
> - Trong repo: `docs/seo/ke-hoach-tu-khoa-6-thang.xlsx` + `docs/seo/ke-hoach-tu-khoa-6-thang.json` (máy đọc được, dùng để
>   tạo nháp CMS hoặc theo dõi trạng thái).

## 0. Dữ liệu: cái gì đã đo, cái gì là ước lượng

- **Chưa đo lượng tìm.** Phiên soạn kế hoạch không vào được Google Trends, Keyword Planner, gợi ý tìm kiếm (bị chặn mạng),
  và Search Console của hieuban.com **chưa nối** vào NotFair (NotFair chỉ có site nha khoa). Cột "Lượng tìm" và "Độ khó"
  vì thế là **cấp ước lượng** (Cao / TB / Thấp), không phải con số.
- **Xu hướng 12 tháng** là suy luận từ: mùa vụ âm lịch (Tết Đinh Mùi 6/2/2027, giao thừa 5/2, Rằm tháng Giêng 20/2), báo chí
  về Gen Z tìm Tarot như cách "chữa lành" ([Vietcetera](https://vietcetera.com/vn/tam-linh-40-co-dang-tro-thanh-lieu-phap-chua-lanh-cua-nguoi-tre)),
  Gen Z dùng Google để kiểm chứng điều thấy trên mạng xã hội ([Google Việt Nam, 4/2026](https://vietnamese.googleblog.com/2026/04/gen-z-tro-thanh-nhom-nguoi-dung-tich.html)),
  "tử vi", "thầy bói", "hợp mệnh" tăng mạnh dịp cuối năm ([Tuổi Trẻ, 12/2024](https://tuoitre.vn/thuc-khuya-moi-met-cung-len-mang-tim-thay-boi-thay-phan-tai-nguoi-am-theo-20241216140611137.htm)).
- **Đã đo:** 24 bài blog đang có (đọc sitemap + tiêu đề trên site thật 11/11/2026) → 3 cặp trùng từ khoá, 3 tiêu đề nhồi từ khoá.
- **Sau 4 tuần** đối chiếu bằng Search Console → Hiệu suất → Truy vấn; số thật thay cột ước lượng.

## 1. Bốn nguyên tắc anh giao, áp vào hieuban thế nào

| Nguyên tắc | Áp dụng |
|---|---|
| 1. Đuôi dài và câu hỏi | 100% từ khoá chính của blog là câu hỏi / cách làm / "cho người mới" / tình huống ("không biết giờ sinh…", "không có người hợp tuổi xông đất thì làm sao", "ở nhà thuê có cần…"). Từ "miễn phí" chỉ dùng khi ý định là dùng công cụ ngay. |
| 2. Ý định tìm kiếm | 3 nhóm: **Thông tin** (là gì, cách tính) → bài hướng dẫn + ví dụ · **So sánh – cân nhắc** (khác nhau thế nào, có đúng không, nên chọn) → bài có bảng so sánh · **Làm ngay** (xem ngày, tính năm cá nhân, đo hướng) → bài ngắn, công cụ ngay màn đầu. Ở site này "mua" = dùng công cụ rồi mở báo cáo bằng Sao, nên CTA cuối bài luôn trỏ một công cụ cụ thể. |
| 3. Xu hướng 12 tháng | Ưu tiên cụm đang lên: Tarot, nhân tướng (xem qua ảnh), hỏi AI xem tử vi, Bát tự "mệnh thiếu gì". Cụm mùa vụ (Tết, làm nhà, cưới) đăng **trước đỉnh 6–8 tuần**. Thần số học ổn định sau đỉnh 2021–22 nên chỉ viết câu hỏi chưa ai trả lời tốt (hai cách tính, tên có dấu, tự kiểm chứng). |
| 4. Cụm chủ đề | 11 cụm bám đúng silo URL đã có (QH-URL): mỗi cụm có **trang trụ** (công cụ), **trang lá** (kiến thức tự dựng) và **bài blog** (câu hỏi đuôi dài). Mỗi cụm ra ≥ 3 bài trong 4 tuần để Google thấy độ sâu cùng lúc. |

## 2. Quy tắc vàng — chống tự tranh từ khoá (quan trọng nhất)

Site đã có hơn 1.000 trang tự dựng: "sinh năm X mệnh gì", sao ở cung, tứ hoá ở cung, 64 quẻ, 78 lá Tarot, tuổi xông đất /
làm nhà / sao hạn theo năm, ngày tốt theo việc–tháng, cặp số… Các trang này đã nhắm **từ khoá chính**.

- **Từ khoá chính → trang công cụ / trang lá.** Blog **không** nhắm "tuổi xông đất 2027", "sinh năm 1990 mệnh gì", "ý nghĩa số 7".
- **Blog → câu hỏi xung quanh** ("cách chọn người xông đất", "không có người hợp tuổi thì làm sao") rồi dẫn về trang lá bằng
  chữ liên kết đúng từ khoá. Cột "Trang lá nối tới" trong bảng là nơi nhận từ khoá chính.
- Trước khi viết: tìm trong sitemap xem đã có trang nào nhắm đúng câu đó chưa. Có rồi → làm dày trang đó, không viết bài mới.

## 3. Mười một cụm

| Mã | Cụm | Trang trụ | Xu hướng (suy luận) | Bài mới |
|---|---|---|---|---|
| C8 | Năm 2027 & Tết Đinh Mùi | `/nam/2027` | ◷ đỉnh cuối 1 – đầu 2/2027 | 15 |
| C1 | Thần số học | `/than-so` | → ổn định | 12 |
| C2 | Tử vi | `/tu-vi` | ◷ đỉnh 12–2 | 9 |
| C6 | Tarot | `/tarot` | ↑ đang lên | 9 |
| C3 | Bát tự & ngũ hành | `/bat-tu` | ↑ tăng nhẹ | 8 |
| C4 | Phong thuỷ nhà ở | `/phong-thuy` | ◷ cao 9–1 | 8 |
| C5 | Kinh Dịch | `/kinh-dich` | → ổn định, ngách | 6 |
| C9 | Xem ngày tốt & âm lịch | `/xem-ngay-tot` | ◷ trước Tết + mùa cưới | 6 |
| C7 | Nhân tướng học | `/nhan-tuong` | ↑ đang lên | 5 |
| C10 | Hợp đôi & tình cảm | `/hop-doi` | ◷ trước 14/2 + mùa cưới | 5 |
| C11 | Huyền học, AI & cách nhìn | `/huyen-hoc` | ↑ đang lên | 5 |

## 4. Nhịp đăng

- **Tuần 1–10 (16/11/2026 → 24/1/2027): 4 bài mới/tuần** — mùa Tết, cần đủ bài trước đỉnh.
- **Tuần 11–26 (25/1 → 16/5/2027): 3 bài mới/tuần.**
- **Mỗi tuần thêm 1 lượt sửa / gộp bài cũ** (26 lượt).
- Theo tháng: 16 · 16 · 17 · 12 · 15 · 12 = **88 bài mới** trong 6 tháng (~15 bài/tháng).
- Vì sao không nhiều hơn: mỗi bài cần qua kiểm định CMS (≥ 85 điểm) và chủ biên đọc; 3–4 bài/tuần là mức giữ được chất lượng
  và chữ ký E-E-A-T. Viết nhiều mà mỏng thì hại cả cụm.

| Tháng | Tuần | Trọng tâm |
|---|---|---|
| 1 (16/11–13/12) | 1–4 | Tết đợt 1 (xông đất, Tam tai, Kim lâu, Hoang ốc, mượn tuổi, sao hạn) · nền thần số · định vị (AI, huyền học là gì) |
| 2 (14/12–10/1) | 5–8 | Tết đợt 2 (năm tuổi Mùi, năm phổ quát 11, xuất hành, khai trương, sinh con, Tử vi năm 2027) · ngày tốt · Bát tự năm 2027. **Hạn chót bài Tết: 10/1/2027** |
| 3 (11/1–14/2) | 9–13 | Hợp đôi trước Valentine · Tarot đợt 1 · thần số đợt 2 · so sánh Đông–Tây |
| 4 (15/2–14/3) | 14–17 | Tarot đợt 2 · phong thuỷ căn hộ, nhà thuê · Bát tự, Tử vi chiều sâu |
| 5 (15/3–18/4) | 18–22 | **Đợt Nhân tướng** (5 bài liền) · Kinh Dịch đợt 1 · thần số cho cha mẹ |
| 6 (19/4–16/5) | 23–26 | Hoàn thiện Tử vi, Bát tự, Kinh Dịch, Tarot · tổng kết, chọn cụm cho 6 tháng sau |

### Lịch từng tuần (tiêu đề đề xuất)

| Tuần | Từ | Bài |
|---|---|---|
| 1 | 16/11 | Cách chọn người xông đất đầu năm cho người mới: 4 bước, không cần thầy<br>Không tìm được người hợp tuổi xông đất thì làm sao? 5 cách tập quán vẫn dùng<br>Tam tai là gì? Cách tự tính Tam tai và năm 2027 những tuổi nào gặp<br>Kim lâu là gì? Cách tính tuổi Kim lâu khi cưới và làm nhà (có ví dụ) |
| 2 | 23/11 | Hoang ốc là gì? Cách đếm tuổi làm nhà bằng bàn tay cho người mới<br>Mượn tuổi làm nhà thế nào cho đúng tập quán: chọn ai, làm những bước gì<br>Gặp sao La Hầu, Kế Đô năm 2027: hiểu đúng và việc nên làm trong đời sống<br>Thần số học cho người mới bắt đầu: 4 con số cần biết trước tiên |
| 3 | 30/11 | Vì sao cùng ngày sinh mà trang này ra số 33, trang kia ra số 6?<br>Thần số học có đúng không? Cách tự kiểm chứng bằng 3 điểm mạnh, 3 điểm mù<br>Không biết giờ sinh có xem Tử vi được không? 3 cách xử lý<br>Mua nhà cũ: 12 điều phong thuỷ nên xem trước khi đặt cọc |
| 4 | 07/12 | Chuyển nhà, về nhà mới: tự chọn ngày và danh sách việc 0 đồng<br>Hỏi ChatGPT xem Tử vi được không? 4 chỗ AI hay tính sai và cách kiểm<br>Huyền học là gì, có phải mê tín không? Cách dùng tỉnh táo<br>7 môn huyền học cho người mới: nên bắt đầu từ môn nào (bảng so sánh) |
| 5 | 14/12 | Năm tuổi 2027 của người tuổi Mùi: nên làm gì, không cần lo gì<br>Năm 2027 theo thần số học: năm phổ quát 11 nói gì với bạn<br>Cách tính năm cá nhân 2027 theo thần số học trong 1 phút (có ví dụ)<br>Xuất hành đầu năm Đinh Mùi: cách tự chọn giờ hoàng đạo và hướng đi |
| 6 | 21/12 | Chọn ngày khai trương sau Tết: 5 bước tự xem và 3 lỗi hay gặp<br>Sinh con năm Đinh Mùi 2027: bố mẹ nên biết gì, điều gì không cần quá lo<br>Xem Tử vi năm 2027 cho riêng bạn: 4 chỗ cần nhìn trên lá số<br>Tử vi và Bát tự khác nhau thế nào? Nên xem môn nào trước |
| 7 | 28/12 | Mệnh thiếu hành gì? Vì sao mệnh năm sinh khác ngũ hành trong Bát tự<br>Lưu niên Bát tự: cách xem năm 2027 hợp hay khó với bạn<br>Giờ hoàng đạo là gì? Cách tự tính 6 giờ tốt trong ngày<br>Chọn ngày cưới hợp tuổi cả cô dâu, chú rể và bố mẹ: cách lọc ngày |
| 8 | 04/01 | Lập xuân là gì? Sinh trước Tết, sau Lập xuân thì tuổi Bát tự tính thế nào<br>Đặt bếp theo tuổi: 'toạ hung hướng cát' là gì, nhà chật thì làm sao<br>Ngày hắc đạo có làm được việc không? Hiểu đúng hoàng đạo – hắc đạo<br>Tam nương, Nguyệt kỵ là gì? Có cần kiêng khi đi xa, khai trương |
| 9 | 11/01 | Tarot cho người mới bắt đầu: 7 ngày tự học, từ 22 lá ẩn chính<br>Cách xào bài Tarot và đặt câu hỏi để lá bài trả lời đúng việc<br>Lá Tarot ngược có xấu không? Cách đọc lá ngược cho người mới<br>Hỏi Tarot 'người ấy nghĩ gì về mình': vì sao nên đổi câu hỏi và hỏi gì thay thế |
| 10 | 18/01 | Xem hợp tuổi vợ chồng: đọc sao cho tỉnh táo khi kết quả 'khắc'<br>Hợp đôi theo thần số học: tính cho hai người thế nào, đọc nhịp năm của cả hai<br>Tứ hành xung là gì? Hai người thuộc nhóm xung nhau nên hiểu thế nào<br>Tính thần số học theo tên khai sinh hay tên thường gọi? Tên tiếng Việt có dấu tính thế nào |
| 11 | 25/01 | Thần số học Pitago và Chaldea khác nhau ở đâu? Nên theo cách nào<br>Ngày cá nhân trong thần số học: thói quen 1 phút mỗi sáng<br>Sinh 23 giờ (giờ Tý muộn): lá số Tử vi tính sang ngày hôm sau hay không? |
| 12 | 01/02 | Vì sao lá số Tử vi mỗi trang một khác? Âm lịch Việt và lịch Trung Quốc lệch nhau<br>Tháng nhuận âm lịch là gì? Sinh tháng nhuận, làm giỗ tháng nhuận tính thế nào<br>Mệnh vợ chồng khắc nhau thì làm sao? Ngũ hành sinh khắc cho người mới |
| 13 | 08/02 | Xem hợp tuổi làm ăn: dùng để tham khảo, đừng dùng để chọn người<br>MBTI và thần số học khác nhau thế nào? Dùng cái nào để hiểu mình<br>Cung hoàng đạo và con giáp khác nhau thế nào? Phương Tây và phương Đông nhìn bạn ra sao |
| 14 | 15/02 | Phong thuỷ căn hộ chung cư cho người mới: đo hướng ở đâu, xử lý gì khi không đổi được cửa<br>Cách đo hướng nhà bằng la bàn điện thoại: 3 bước, tránh sai 15°<br>Cách đọc biểu đồ ngày sinh và các mũi tên cho người mới |
| 15 | 22/02 | Mệnh vô chính diệu là gì? Đọc thế nào cho đúng<br>Tứ hoá cho người mới: Lộc, Quyền, Khoa, Kỵ và cách nhìn trên lá số<br>Dụng thần là gì? Vì sao có hai cách lấy dụng thần |
| 16 | 01/03 | Thân vượng, thân nhược là gì? Cách tự nhận ra trên lá số<br>Ở nhà thuê có cần xem phong thuỷ? 7 việc 0 đồng nên làm<br>Trải bài 3 lá Tarot: cách đọc Quá khứ – Hiện tại – Sắp tới |
| 17 | 08/03 | Hỏi Tarot 'có hay không' được không? Cách hỏi để có câu trả lời dùng được<br>Xem Tarot online có chính xác không? Rút bài trên máy khác rút tay ở đâu<br>Số chủ đạo có thay đổi không? 7 câu người mới hay hỏi về thần số học |
| 18 | 15/03 | Xem tướng mặt qua ảnh có chính xác không? Điều máy đo được và không đo được<br>Dùng thần số học để hiểu con: cha mẹ nên làm và không nên làm gì<br>4 đỉnh cao trong thần số học: cách tính và đọc giai đoạn bạn đang đi |
| 19 | 22/03 | Đại vận trong Bát tự: cách biết mình đang đi vận nào, bao giờ đổi<br>Bổ khuyết ngũ hành bằng màu sắc, nghề nghiệp: đâu là dân gian, đâu là sách Tử Bình<br>Đặt bàn thờ trong căn hộ: 6 lỗi hay gặp và cách sửa không tốn tiền |
| 20 | 29/03 | Đầu giường quay hướng nào hợp tuổi? Cách tự tìm bằng điện thoại<br>Cách đặt câu hỏi khi gieo quẻ Kinh Dịch: 5 lỗi khiến quẻ 'không ứng'<br>Hào động, quẻ biến là gì? Đọc một quẻ có hào động cho người mới |
| 21 | 05/04 | Gieo quẻ online có chính xác không? Điều gì quyết định một quẻ<br>Tam đình, ngũ nhãn là gì? Cách tự đo trên khuôn mặt mình<br>Nốt ruồi trên mặt: sách xưa nói gì, và vì sao không nên tẩy vì sợ 'tướng xấu' |
| 22 | 12/04 | Nhân tướng học cho người mới: 12 cung trên khuôn mặt nói gì<br>Thiếu số trong biểu đồ ngày sinh: có phải điểm yếu không?<br>'Tướng tuỳ tâm sinh' nghĩa là gì? Gương mặt đổi theo cách sống thế nào |
| 23 | 19/04 | Đọc cung Phu Thê cho người mới: 5 bước, không phán hợp hay tan<br>Kinh Dịch cho người mới: đọc từ đâu, nhớ 64 quẻ thế nào<br>Gieo quẻ hỏi chuyện tình cảm: hỏi sao cho đúng, đọc quẻ thế nào |
| 24 | 26/04 | Linh hồn, Nhân cách, Sứ mệnh: ba chỉ số từ họ tên khác nhau ở đâu<br>Tuần, Triệt là gì trong lá số Tử vi? Hiểu đúng 'chậm' chứ không phải 'mất'<br>Cung Thân là gì? Thân cư cung nào nói gì về nửa sau cuộc đời |
| 25 | 03/05 | Cách cục Bát tự là gì? Đọc theo Tử Bình Chân Thuyên cho người mới<br>Đào Hoa, Văn Xương, Thiên Ất Quý Nhân: thần sát là gì, nên hiểu đến đâu<br>Phong thuỷ bàn làm việc ở văn phòng: chọn hướng ngồi khi không được chọn chỗ |
| 26 | 10/05 | Lục hào cho người mới: Thế, Ứng, dụng thần nói gì<br>Trải bài Celtic Cross 10 lá cho người mới: vị trí và cách đọc lá kề nhau<br>Rider–Waite, Marseille, Thoth: bộ Tarot nào hợp người mới |

## 5. Bài cũ: gộp, sửa, phân vai (tuần 1–8)

| Bài | Việc |
|---|---|
| `tu-vi-ly-so-la-gi…` | Gộp vào `tu-vi-la-gi-cau-truc-la-so…` (308 qua `slug_cu`) |
| `phong-thuy-nha-o-theo-tuoi…` | Gộp vào `cach-xem-huong-nha-hop-tuoi` |
| `xem-than-so-hoc-numerology…` | Gộp vào `cach-tinh-than-so-hoc-tu-ngay-sinh-va-ho-ten` |
| `xem-hop-doi-xem-tinh-yeu-boi-tinh-yeu-boi-nguoi-do…` | Sửa tiêu đề (nhồi 4 từ khoá; "bói người đó" trái ranh giới không đọc người khác) |
| `xem-boi-dong-nghiep-xem-boi-sep…` | Sửa tiêu đề + câu "không dùng để chọn người" |
| `xem-kinh-dich-huyen-khong-phi-tinh-bat-tu…` | Sửa tiêu đề thành bài so sánh "việc nào hỏi môn nào" |
| `luan-giai-la-so-tu-vi-tron-doi…` ↔ `cach-xem-tu-vi-lap-la-so…` | Phân vai: "lá số trọn đời" / "cách xem tử vi" |
| `vong-tron-ngu-hanh…` ↔ `ngu-hanh-la-gi…` | Phân vai: "tương sinh tương khắc" / "ngũ hành là gì" |

**Đã làm (2026-11-11, migration CMS `20261111_090000_kw6t_bai_cu`, chạy khi CMS deploy):** chủ dự án giao làm thẳng trong CMS.
Phiên làm việc không có tài khoản ghi CMS (Chủ biên phải qua 2 bước), nên sửa bằng migration dữ liệu như BLOG-6/7/10:
`cms/src/lib/kw6t-bai-cu.ts` (kế hoạch từng bài + hàm áp), có `down` khôi phục bản trước. Đã thử trên Postgres với bản sao
24 bài đang xuất bản (`cms/tests/kw6t-du-lieu-that.ts`): áp đủ 24/24, chạy lại không đổi thêm, hoàn tác về đúng bản cũ.

- Gộp 3 cặp (bài phụ thôi xuất bản, đường dẫn 308 về bài chính, phần riêng chuyển sang bài chính: "Tử vi lý số là gì",
  âm lịch Việt / Trung lệch nhau, đo hướng cửa hay ban công + bảng việc nên làm, hai cách cộng 33 / 6, đọc hồ sơ thần số).
- 3 bài đổi tiêu đề + đường dẫn mới (đường cũ 308), bỏ "bói người đó", vẽ lại ảnh bìa + 3 ảnh minh hoạ có in tiêu đề
  (ảnh cũ của bài Kinh Dịch còn lỗi "Kinh Dịnh").
- Rà soát cả 24 bài, sửa thêm: 22 link "Hiểu Bản Thân" về trang chủ → công cụ đúng mảng; ~20 bài trước chỉ link `/than-so`,
  `/hop-doi` nay có đoạn "Đọc tiếp" tới trang kiến thức + bài cùng cụm; mọi bài có "Bài liên quan"; 4 cặp từ khoá chính trùng
  → mỗi bài một từ khoá; mảng của 6 bài sửa lại (CTA cuối bài đúng công cụ); bài Mai Hoa thêm nguồn; câu "không phải lời
  khuyên đầu tư" cho bài tài lộc; Tử vi 2027 + Thời gian tới cho bài cách xem Tử vi; ranh giới "không dùng để chọn nhân viên".
- Bài có bản nháp đang sửa dở trong CMS thì máy **không đè** (ghi log). Chưa làm: chuyên mục (CMS chưa có chuyên mục nào).

Tuần 9–26: mỗi tuần cập nhật một bài (liên kết sang bài mới cùng cụm, thêm năm 2027, ranh giới CY-1/SK-1) — xem tab "Bài cũ".

## 6. Khuôn một bài (để AI soạn nháp + chủ biên duyệt)

1. **H1 = câu hỏi** đúng từ khoá chính; tiêu đề SEO ≤ 54 ký tự để còn hậu tố thương hiệu.
2. **Câu trả lời 40–60 chữ ngay đầu bài**, đứng riêng được (AI và đoạn trích nổi bật lấy đoạn này).
3. H2 = từng câu hỏi phụ trong cột "Từ khoá phụ".
4. **Một thứ trang khác không có**: ví dụ tính tay với một ngày sinh, bảng số do engine tính, hai cách tính ra hai số, ảnh tóm tắt có QR.
5. "Sách xưa nói gì" khi có nguồn công cộng (ghi tên sách); sách hiện đại chỉ tóm ý.
6. 3–5 câu hỏi thường gặp.
7. **Liên kết**: trang trụ + 3 trang lá (chữ liên kết đúng từ khoá của trang lá) + 1 bài cùng cụm + 1 bài cụm khác cùng nỗi lo.
8. CTA cuối bài theo cột "CTA" (một công cụ cụ thể, không chung chung).
9. Ranh giới: sức khoẻ có câu "không thay lời bác sĩ" (SK-1); tiền / pháp lý có câu ranh giới (CY-1); không phán, không doạ,
   không đọc người khác, không vật phẩm / giải hạn; tập quán ghi là tập quán.
10. Chuẩn chung: `docs/NOI-DUNG-BO-SUNG.md`, kiểm định CMS.

## 7. Ý tưởng nâng cấp ngoài 4 gợi ý

1. **Phân vai từ khoá** (mục 2) — tránh 88 bài mới tranh từ khoá với 1.000 trang đã có.
2. **Từ khoá đuôi dài từ người dùng thật**: kho câu hỏi có nhãn của engine (thần số + 5 mảng), mã ý định Hôm nay (HN-4),
   `/quan-tri/hoi-dap`. Mỗi tháng rút 5 câu hay gặp mà chưa có bài → thêm vào bảng. Đối thủ không có dữ liệu này.
3. **Lịch theo âm lịch**: bài mùa vụ đăng trước đỉnh 6–8 tuần (tab "Mốc mùa vụ").
4. **Thông tin mới trong từng bài**: tính tay, bảng engine, hai trường phái — lý do để Google xếp bài nhỏ lên trên bài lớn.
5. **AEO/GEO**: câu trả lời 40–60 chữ, H2 dạng câu hỏi, bảng, trích nguồn. AI Overviews làm giảm nhấp ở nhiều truy vấn; vì vậy
   đo thêm "được AI nhắc tên" và "bấm vào công cụ", không chỉ nhấp. Bing quan trọng (ChatGPT / Copilot tìm bằng Bing) —
   IndexNow đã chạy.
6. **Nối ngang theo nỗi lo**: cùng câu hỏi tiền / việc / tình / nhà có bài ở nhiều môn, liên kết chéo.
7. **Cầu nối Đông – Tây** ở chỗ người mới phân vân: Pitago ↔ Lạc Thư, Tarot ↔ Kinh Dịch, cung hoàng đạo ↔ con giáp, MBTI ↔ thần số.
8. **Sửa bài cũ trước khi viết thêm** (mục 5).
9. **Lời hứa tiêu đề = khác biệt + an toàn**: "tự kiểm chứng", "không cần thầy", "việc 0 đồng", "đọc sao cho tỉnh táo".
10. **Mỗi bài thành 3 mẩu phân phối**: ảnh tóm tắt có QR, video ngắn 30–45 giây, bài fanpage trỏ thẳng trang trụ.
11. **Quyết theo cụm sau 8–12 tuần**; bài 90 ngày không hiển thị → gộp hoặc noindex.
12. **Chiêm tinh phương Tây chưa mở cụm**: cung hoàng đạo được tìm nhiều nhưng site chưa có công cụ — chỉ 1–2 bài cầu nối.
    Muốn mở cụm này thì cần quyết làm công cụ trước (chờ anh).

## 8. Chỉ số

| Chỉ số | Ở đâu | Mục tiêu |
|---|---|---|
| % bài mới được lập chỉ mục sau 4 tuần | Search Console → Trang | ≥ 80% |
| Số truy vấn câu hỏi có hiển thị (regex `là gì\|cách\|có nên\|không\|vì sao\|làm sao`) | Search Console | tăng mỗi tháng — **chỉ số chính** |
| Thứ hạng TB từ khoá chính của bài | Search Console theo trang | ≤ 20 sau 8 tuần, ≤ 10 sau 16 tuần |
| Bấm CTA cuối bài | PostHog `cross_cta_clicked{tu: blog}`, `end_cta_clicked` | đặt mốc sau 4 tuần |
| Đọc hết bài | `reading_completed{mo_dun: blog}` | đặt mốc sau 4 tuần |
| AI nhắc tên | `landing_viewed.den_tu = ai` + kiểm tay 20 câu/tháng | tăng mỗi tháng |

## 9. Việc của anh để kế hoạch chính xác hơn

- Nối Search Console + GA4 của hieuban.com vào NotFair, hoặc gửi CSV "Truy vấn" + "Trang" 3 tháng → em thay cột ước lượng bằng số thật.
- Cho phép `trends.google.com` trong mạng môi trường (hoặc nối Keyword Planner) → em kiểm xu hướng 12 tháng của 88 từ khoá.
- Chọn người duyệt bài theo cụm (chủ biên đọc ≥ bài P1).

## Đã viết: tuần 1–2 (2026-11-11)

8 bài nháp "Gửi duyệt" nạp vào CMS bằng migration `20261111_150000_kw6t_tuan_1_2` (nguồn: `cms/src/bai-khoi-tao/kw6t/*.json`,
32 ảnh 1600×1028 có QR + đường dẫn bài, vẽ lại bằng `node cms/src/bai-khoi-tao/kw6t/ve-anh.mjs`). Mọi bài qua bộ kiểm định CMS
(test `bai.test.ts`), số liệu 2027 lấy từ engine. Không tự xuất bản — Chủ biên đọc rồi xuất bản cả cụm trong cùng tuần
(các bài link chéo nhau).

| Tuần | Bài | Từ khoá chính |
|---|---|---|
| 1 | Cách chọn người xông đất đầu năm | cách chọn người xông đất |
| 1 | Không có người hợp tuổi xông đất thì làm sao? | người hợp tuổi xông đất |
| 1 | Tam tai là gì? Cách tự tính | tam tai là gì |
| 1 | Kim lâu là gì? Cách tính tuổi Kim lâu | kim lâu là gì |
| 2 | Hoang ốc là gì? | hoang ốc là gì |
| 2 | Mượn tuổi làm nhà như thế nào? | mượn tuổi làm nhà |
| 2 | Sao La Hầu, Kế Đô năm 2027 nên làm gì | sao la hầu |
| 2 | Thần số học cho người mới bắt đầu | thần số học cho người mới |
