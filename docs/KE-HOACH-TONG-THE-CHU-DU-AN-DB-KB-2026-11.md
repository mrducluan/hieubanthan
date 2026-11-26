# BẢN KẾ HOẠCH TỔNG THỂ HOÀN CHỈNH (GÓC NHÌN CHỦ DỰ ÁN)
## Lấy "DB & KB Tri Thức Tự Tiến Hóa" Làm Gốc — Thỏa Mãn 95–99% Mọi Tò Mò & Trăn Trở Huyền Học Của Người Dùng

**Ngày chốt kế hoạch:** 2026-11-26  
**Vai trò thực thi:** Em đóng vai trò **Chủ dự án (Project Owner)** làm thay anh — suy nghĩ từ gốc rễ tài sản lõi, chịu trách nhiệm từ độ chuẩn xác của từng dòng tri thức trong DB/KB cho đến cảm giác *"À, đúng mình quá! Biết phải làm gì rồi!"* của người dùng cuối.

---

## 1. MỤC TIÊU TỐI THƯỢNG: EM LÀM ĐỂ LÀM GÌ? (KIM CHỈ NAM CỦA DỰ ÁN)

Nếu em làm thay anh với tư cách Chủ dự án, **em KHÔNG xây một trang xem bói mì ăn liền**, và cũng không lấy việc bán gói ngắn hạn làm gốc. Mục tiêu tối thượng của em gồm **3 tầng nhân – quả rõ ràng**:

1. **Tầng Gốc (Tài sản độc quyền không ai sao chép được):** Xây dựng **Hệ sinh thái `DB + KB Tri Thức Huyền Học Sống & Tự Nâng Cấp Thông Minh Hơn Mỗi Ngày`**.
   - Các chatbot AI (ChatGPT, Gemini) nói rất mượt nhưng tính sai lá số, bịa sao và **không có trí nhớ nghiệm lý** (hôm nay nói sai, năm sau vẫn nói sai y hệt).
   - Các trang tử vi/phong thủy truyền thống thì tính đúng lá số nhưng dùng **văn mẫu chết cứng hàng chục năm**, dọa dẫm, rời rạc từng môn.
   - **`hieubanthan` thắng tuyệt đối nhờ hợp nhất:** `Phép tính chuẩn 100% (CALC)` + `Kho tri thức cổ thư & đa phái đồ sộ (KB)` + `Cơ chế tự kiểm chứng & tự sàng lọc từ thực tế đời sống người Việt trên cơ sở dữ liệu (DB)`.
2. **Tầng Thân (Sứ mệnh phục vụ người dùng):** Dùng chính kho tri thức thông minh đó để **giải đáp thấu đáo, trúng tim đen 95–99% mọi sự tò mò, hoang mang và khát khao đời thực** khi một con người tìm đến huyền học:
   - *Tương lai & Thời vận:* Bao giờ khổ tận cam lai? Tháng nào thuận, tháng nào cần thủ?
   - *Vận hạn & Hóa giải:* Năm nay vướng rủi ro gì, **hóa giải sao cho hiệu quả** (cả theo hành vi thực tế lẫn theo Ngũ hành / Dụng thần / Phi tinh chính tông)?
   - *Tài lộc & Kinh doanh:* Kích tài lộc ở đâu? Tháng nào bung vốn làm ăn lớn, tháng nào giữ tiền? Đối tác / Co-founder này có bù khuyết và đáng đi đường dài cùng mình không? Mặt bằng này bố trí sao để tụ khí?
   - *Tình duyên & Gia đạo:* Độc thân bao giờ gặp đúng người? Sau ly hôn/đổ vỡ bao giờ lành vết thương và mở lòng lại? Vợ chồng đang lục đục khắc khẩu gỡ nút thắt thế nào? Nuôi dạy con ra sao?
   - *Học hành & Công danh:* Thi cử, đổi việc, thăng chức hay ra làm riêng?
   - *Niềm tin & Sự thật:* Đối chiếu quá khứ để tin tương lai; gỡ nỗi sợ khi bị nơi khác phán xấu (*"sát phu, vô chính diệu, tuyệt mệnh"*).
3. **Tầng Quả (Kinh doanh bền vững tự nhiên):** Khi người dùng hỏi câu nào cũng thấy **sâu sắc, đúng hoàn cảnh thật của mình, có căn cứ sách xưa và làm theo thấy đời sống tốt lên**, họ sẽ tự khắc gắn bó nhiều năm, rủ người thân/đối tác cùng dùng và vui vẻ trả Sao / Hội viên. **Tri thức giỏi nhất chính là cỗ máy kinh doanh mạnh nhất.**

---

## 2. KIẾN TRÚC LÕI: LÀM SAO ĐỂ `DB + KB` LUÔN TỰ NÂNG CẤP THÔNG MINH HƠN?

Thay vì để `KB` (tệp JSON tĩnh trong `engine/app/kb/data/`) và `DB` (Supabase Postgres) nằm rời nhau, em vận hành chúng như **một vòng tuần hoàn khép kín 4 bánh răng (The Living Knowledge Flywheel)**:

```
[1. KHO NGUỒN TINH HOA] ──(Biên dịch quy tắc + Chuẩn SX-C)──► [2. KHO KB ĐA TẦNG TRONG ENGINE]
  • 60+ cổ thư đối chiếu                                        • Lớp Đời sống & Hành động
  • 15 kho *-kb vệ tinh                                         • Lớp Học thuật Cổ điển & Ngũ hành
  • 1.681 mệnh lệ + 610 ca nhà                                  • Đồ thị liên kết Tam Tài liên môn
          ▲                                                                  │
          │                                                       (Luận giải & Hỏi đáp
 (Cập nhật KB hàng tuần                                            gắn mã kiểm chứng ma_mau)
  qua /quan-tri/hoc → PR)                                                    ▼
[4. BỘ LỌC TỰ TIẾN HÓA TRÊN DB] ◄──(Tín hiệu thực chứng Zero-PII)── [3. TRẢI NGHIỆM GIẢI ĐÁP TÒ MÒ]
  • kiem_chung_phieu (Đúng/Chưa đúng)                             • Cố vấn Bản mệnh & Kinh doanh
  • kiem_chung_sau (Kết quả sau 30 ngày)                          • Hỏi đáp thống nhất 1 cửa
  • de_xuat_luat (Tự bắt hộp sai/mỏng)                            • Công tắc 2 Chế độ tức thì
  • nhat_ky_hoi (Bắt câu tò mò mới chưa có KB)                    • Nhịp đồng hành ngày/tháng
```

### 4 cơ chế giúp hệ thống thông minh lên theo thời gian (mà tuyệt đối không bị AI "ảo giác"):
1. **Tự thăng hạng nghiệm lý đúng & Tự hạ bậc nhận định trật (`kiem_chung_phieu` — Migration 0017/0021):**
   - Mỗi nhận định, mỗi cách hóa giải đều mang một mã định danh tất định `ma_mau` (không lưu ngày sinh/tên người dùng).
   - Nhận định nào được hàng trăm người có cùng cách cục xác nhận **"Đúng với mình" (≥ 75%)** → được ưu tiên đẩy lên hộp cốt lõi kèm huy hiệu thực chứng. Nhận định nào **< 40% đúng sau ≥ 100 phiếu** → tự động bị hạ xuống phần tham khảo phụ và đẩy vào bảng `de_xuat_luat` để nâng cấp KB!
2. **Đo hiệu quả thực tế của lời khuyên / cách hóa giải sau 30 ngày (`kiem_chung_sau` — Migration 0022):**
   - Không chỉ hỏi *"nghe có đúng tính cách không"*, mà 30 ngày sau khi người dùng áp dụng lời khuyên/bố trí phong thủy, hệ thống hỏi lại: *"Bạn đã thử làm chưa? Thấy chuyển biến tốt hơn hay như cũ?"*. Cách hóa giải nào `≥ 60% như cũ` sẽ bị gắn cờ để viết lại sát thực tế hơn!
3. **Radar bắt "Tò mò mới của xã hội" (`nhat_ky_hoi` + `cau_hoi_vec` — Migration 0004/0005/0017/0031):**
   - Mọi câu hỏi người dùng gõ vào mà bộ hiểu câu chưa trả lời sâu đều được gom nhóm ẩn danh (chỉ giữ mã nhóm/câu đã lọc PII) tại `/quan-tri/hoc` → Chủ dự án nhìn thấy ngay mỗi tuần: *"À, tuần này có 400 người hỏi về việc hùn vốn mở quán / ly thân quay lại mà KB còn mỏng"* → bồi đắp đúng chỗ người dùng khát nhất!
4. **Hiệu chuẩn công thức chấm điểm bằng Kho Ca Mẫu Thực Tế (Offline Calibration):**
   - Dùng **1.681 mệnh lệ thật** (`bazi-kb` — chạy kiểm chuẩn offline) và **610 ca nhà thật** (*Trạch Vận Tân Án* 1928 trong `fengshui-xuankong-kb`) để đo và tinh chỉnh trọng số `RULES` trước mỗi đợt nâng cấp lớn.

---

## 3. BẢN ĐỒ TRI THỨC PHỤC VỤ NGƯỜI DÙNG: GIẢI ĐÁP MỌI TÒ MÒ HUYỀN HỌC NHƯ THẾ NÀO?

Mọi nhóm tò mò anh đặt ra ở yêu cầu đầu tiên (cộng thêm mảng Kinh doanh & các mạch tâm lý ẩn) đều được giải quyết bằng **sự phối hợp liên môn "Tam Tài Phân Vai Trực Giao"** *(không cho các môn bỏ phiếu máy móc vì thực nghiệm 1.000 lá số cho thấy $\kappa \approx 0$, mà để mỗi môn soi đúng 1 chiều sở trường)* + **Công tắc 2 Chế độ**:

| Nhóm tò mò & trăn trở của User | Chiều 1: **Nội lực & Khí vận** (`Bát Tự` — cả 3 trụ & 4 trụ) | Chiều 2: **Tình huống & Con người** (`Tử Vi` / `Thần Số`) | Chiều 3: **Đòn bẩy Không gian & Thời khắc** (`Phong Thủy Vận 9` · `Hoàng Lịch` · `Kỳ Môn/Dịch`) | Giá trị vượt trội user nhận được (Ở cả 2 Chế độ) |
|---|---|---|---|---|
| **1. Tương lai sắp tới, Đại vận & Lưu nguyệt 12 tháng** | Đọc Đại vận 10 năm + Lưu niên + 12 tháng tiết khí theo Dụng thần (2 cách: cân sức & cách cục). | Đọc Đại hạn + Tiểu hạn + Lưu nguyệt 5 phái + Đường bay Tứ Hóa (Lộc/Quyền/Khoa/Kỵ). | Đọc Sao Lưu Niên đáo hướng nhà + Tháng/Ngày hợp việc dự định (`ke_hoach_thang`). | **Bản đồ Nhịp 12 Tháng** chỉ rõ *Tháng Vàng nên tiến* và *Tháng Trũng cần thủ*, kèm đối chiếu 3 năm quá khứ để kiểm chứng niềm tin ngay lập tức. |
| **2. Vận hạn rủi ro & Cách hóa giải hiệu quả** | Chỉ ra hành nào đang thái quá / xung khắc gây mất cân bằng năng lượng, sức khỏe hoặc hao tài. | Chỉ đích danh rủi ro nằm ở khâu nào: *giấy tờ (Quan Phù/Hóa Kỵ), đi lại (Thiên Mã/Kình Đà), hay quan hệ (Nô Bộc)* + đối chiếu Sao hạn/Tam tai dân gian. | Xác định cung nhà phạm **Ngũ Hoàng (5) / Nhị Hắc (2) / Thái Tuế** trong năm để tránh động thổ/ngồi lâu và dùng phép tiết khí. | **Công tắc 2 Chế độ:** (1) *Đời sống:* 3 hành động phòng ngừa thực tế; (2) *Học thuật Cổ điển:* Phép tiết khí Ngũ hành (màu sắc, chất liệu Kim/Thủy, hướng tránh, lịch khám/lùi việc) — **0% mê tín cúng bái**. |
| **3. Kích tài lộc & Chiến lược giữ tiền / kiếm tiền** | Phân biệt *Thân vượng Tài vượng* (bung sức được) với *Thân nhược Tài đa* ("tiền qua tay nhiều nhưng kiệt sức, dễ hụt vốn") + hành bổ khuyết. | Soi cung **Tài Bạch + Điền Trạch + Lộc Tồn / Hóa Lộc**: nguồn tiền hợp nhất đến từ chuyên môn, buôn bán, bất động sản hay quản lý. | Kích hoạt cung **Đương Vận Cửu Tử (9) & Sinh Khí Nhất Bạch (1)** tại nhà/bàn làm việc theo Huyền Không Vận 9. | Chỉ rõ: **Kiếm tiền bằng lối nào + Giữ tiền bằng cơ chế nào + Ngồi hướng nào / kích góc nào trong phòng làm việc**. |
| **4. Làm ăn lớn, Mở rộng kinh doanh & Soi Đối tác / Mặt bằng** | Tính độ bù khuyết 5 hành chuẩn (Tam Trụ/Tứ Trụ) giữa Chủ và Co-founder/Đối tác; tháng Tài/Thực Thương vượng để bung hàng. | Soi cung **Nô Bộc / Quan Lộc / Huynh Đệ** + hợp tham 2 lá số: đối tác mạnh khâu nào, dễ lệch nhau chuyện quyền lực hay tiền bạc. | Chấm **Mặt bằng kinh doanh** (cửa, quầy thu ngân, bàn chủ sự, Thế Quái >3°) + **5 ngày giờ đẹp** khai trương/ký kết (+ Kỳ Môn đàm phán ở Chặng 3). | **Không gian Cố vấn Kinh doanh & Đối tác:** Biết tháng nào đánh lớn, tháng nào thu công nợ; phân vai rõ *ai giữ két – ai mở thị trường* trước khi góp vốn. |
| **5. Tình duyên: Độc thân bao giờ gặp & Sau ly hôn bao giờ mở lòng?** | Soi Phu/Thê tinh (Tài/Quan Sát) + sự đóng/mở của Chi Ngày (cung phối ngẫu) theo từng năm/tháng. | Soi **Phu Thê + Hồng Loan / Đào Hoa / Thiên Hỷ** + Phi Hóa tình cảm; bóc tách mô thức lặp lại khiến chuyện cũ đổ vỡ. | Điều chỉnh bố cục phòng ngủ (tránh Cô Thần/Quả Tú/phòng tối lạnh, kích vị trí Đào Hoa/Diên Niên hợp mệnh). | Phân tách riêng **KB Độc thân** và **KB Sau đổ vỡ/Ly hôn** (chữa lành mô thức cũ trước, chỉ đúng giai đoạn duyên lành chín muồi tiếp theo). |
| **6. Hôn nhân & Gia đạo lục đục, Con cái** | Tìm điểm xung/hợp giữa 2 trụ ngày vợ chồng & hành trung gian ("thông quan") giúp 2 người dịu lại. | Đặt 2 lá số cạnh nhau (`tuvi_hai_nguoi` + `gia_dinh`): vì sao cùng thương nhau mà nói ra là cãi, tháng nào dễ căng để nhường nhau. | Kiểm tra **Cửa – Chủ – Bếp (`Tam Yếu`)** & hướng giường ngủ 2 vợ chồng có phạm Tuyệt Mệnh/Ngũ Quỷ/Hỏa Hại không; hiểu tính con cái. | Đưa ra **"Hành cầu nối" trong giao tiếp + Chỉnh lại góc bếp/phòng ngủ + Lịch các tháng nhạy cảm trong năm để vợ chồng chủ động hạ nhiệt**. |
| **7. Học hành, Thi cử, Đổi việc & Thăng tiến** | Xét **Ấn tinh (học thuật/bằng cấp), Quan Sát (chức vụ), Thực Thương (sáng tạo/nghề tự do)** để định vị vai trò chuẩn nhất. | Xét **Văn Xương / Văn Khúc / Hóa Khoa / Hóa Quyền / Quốc Ấn** lưu niên rơi vào tháng nào để nộp hồ sơ, thi cử hay đàm phán lương. | Đặt bàn học / bàn làm việc đón sao **Tứ Lục Văn Xương (4) + Nhất Bạch (1)** ("Một – Bốn đồng cung phát khoa danh"). | Trả lời dứt khoát: **Hợp làm chuyên gia, quản lý hay ra riêng + Thời điểm rơi điểm sáng thi cử/thăng chức + Cách kê bàn tăng độ tập trung**. |
| **8. Kiểm chứng Quá khứ & Gỡ hoang mang "Thầy khác dọa"** | Đối chiếu 3–5 năm biến cố đã qua (`battu_doi_chieu`) xem lá số phản ánh đúng đến đâu. | Dùng `tuvi_dinh_gio` khóa lại giờ sinh mơ hồ; giải thích minh bạch 2 mặt của *Vô Chính Diệu, Không Kiếp, Thất Sát* từ cổ thư đối chiếu 3 phái. | Kiểm chứng thực địa nhà đang ở ("Nhà hướng này mấy năm qua có phải hay hỏng vặt góc X, tiền vào cửa trước ra cửa sau không?"). | Biến nỗi sợ mù quáng thành sự thấu hiểu sáng suốt, có trích dẫn sách xưa đàng hoàng trong mục *"Vì sao nói vậy"*. |

---

## 4. NHƯ MỘT CHỦ DỰ ÁN LÀM THAY ANH, EM BẮT ĐẦU TỪ ĐÂU TRƯỚC? (VÀ VÌ SAO?)

Nếu hôm nay anh giao quyền điều hành cho em, **em sẽ KHÔNG bắt đầu bằng việc vẽ thêm trang mới hay nhồi thêm môn mới ngay**, mà em bắt đầu từ **"KHAI THÔNG TRỤC SỐNG `DB ↔ KB ↔ ENGINE`"** trong tuần đầu tiên, vì 3 lý do sống còn của người làm chủ sản phẩm:

1. **Bật "Trí nhớ Tự Học" trên DB trước tiên:** Hệ thống đã viết sẵn các bảng tự học rất hay (`0017` phiếu kiểm chứng, `0018` hồ sơ nhà, `0021` hợp đôi, `0022` kiểm chứng sau 30 ngày & hàng đợi đề xuất luật `de_xuat_luat`, `0034` lệch ngôn ngữ, `0035/0036` nhắc tháng/tuần), nhưng nhiều bảng đang chờ chạy đầy đủ trên môi trường thật. **Mỗi ngày mở web mà chưa bật hết chuỗi DB này là mỗi ngày ta đánh rơi hàng trăm dữ liệu nghiệm lý quý giá của người dùng!**
2. **Xóa ngay sự "hai lời" giữa Báo cáo và Hỏi đáp (`D2`) + Sửa lỗi toán học gốc (`doanh_chu.py`):** Một bậc thầy uy tín không thể trong bài viết nói một đằng, lúc khách hỏi lại nói một nẻo, càng không thể tính ngũ hành đối tác bằng cách gán bừa giờ Ngọ `12:00`. Phải khóa chặt **Một Nguồn Sự Thật Duy Nhất (Single Source of Truth)** trước khi đắp thêm tri thức mới.
3. **Tinh luyện Kho Tri Thức (Golden KB) của 3 môn trụ cột (Tử Vi · Bát Tự · Phong Thủy) trước khi mở rộng:** 90% câu hỏi sâu sắc nhất của người Việt xoay quanh 3 môn này. Làm cho KB của 3 môn này sâu gấp 5 lần hiện tại (đủ 81 cặp sao Huyền Không, đủ phép điều hòa Vận 9, đủ Kỵ chuyển Kỵ, đủ kịch bản Kinh doanh & Sau ly hôn, đủ 2 Chế độ) thì mọi tầng bên trên tự khắc tỏa sáng!

---

## 5. LỘ TRÌNH HOÀN CHỈNH 5 CHẶNG (TỪ GỐC TRI THỨC ĐẾN ĐỈNH CAO ĐÔNG – TÂY)

### 🧱 CHẶNG 0 (Tuần 1–2): Khai Thông "Trục Sống DB ↔ KB" & Chuẩn Hóa Nguồn Sự Thật
*Mục tiêu: DB bắt đầu tự học 100%, Engine sạch lỗi toán học, Báo cáo và Chat nói chung một tiếng nói.*
- **Việc 0.1 (DB Tự học):** Rà và kích hoạt trọn bộ chuỗi migration tầng HỌC & Đồng hành trên Supabase (`0017`, `0018`, `0021`, `0022`, `0034`, `0035`, `0036`); dựng bảng theo dõi "Câu tò mò chưa có KB sâu" tại `/quan-tri/hoc`.
- **Việc 0.2 (Đồng nhất Tri thức — Mục `D2`):** Nối toàn bộ 27 nhãn câu hỏi thẳng (`tuvi_luan_hoi_kb`, `battu_luan_hoi_kb`) vào bộ máy Hỏi Đáp (`hoidap`) kèm mã kiểm chứng `ma_mau` để mọi câu trả lời trong chat cũng được người dùng bấm *"Đúng / Chưa đúng"* nuôi ngược về DB!
- **Việc 0.3 (Chuẩn hóa Toán học & Điểm nhấn đầu bài):**
  - Sửa `calc/doanh_chu.py:150` từ gán cứng `12:00` sang **Tam Trụ chuẩn xác khi khuyết giờ sinh (`khong_gio=True`)** + nhận giờ sinh thật khi có.
  - Điền hộp `cot_loi` ("Điều quan trọng nhất") đang để trống trên `/thoi-gian-toi`; đồng bộ lại `PROJECT_STATE.yaml`.

---

### 💎 CHẶNG 1 (Tuần 3–6): Đại Nâng Cấp Kho Golden KB 3 Môn Lõi & Công Tắc 2 Chế Độ
*Mục tiêu: Biến 15 kho `*-kb` vệ tinh thành tri thức tinh hoa thực chiến, mở Công tắc 2 Chế độ phục vụ trọn cả khách hiện đại lẫn khách mê học thuật chính tông.*
- **Việc 1.1 (Nâng cấp KB Phong Thủy Vận 9 toàn diện):**
  - Hoàn thiện nốt **53/81 cặp tổ hợp Phi Tinh** (nâng `phongthuy_huyen_khong.json` từ 28/81 lên **81/81 cặp** có nguyên văn cổ thư chuẩn `SX-C`) + đối chiếu bộ ca nhà thật *Trạch Vận Tân Án* (1928).
  - Biên dịch **Kho 25 Phép Điều Hòa & Kích Tài Lộc Ngũ Hành Vận 9** cho Cửa · Bếp · Giường · Bàn làm việc · Quầy thu ngân.
- **Việc 1.2 (Nâng cấp KB Tử Vi & Bát Tự theo chiều sâu đời sống):**
  - Rút luật **Kỵ chuyển Kỵ / Lộc theo Kỵ** (`ziwei-liang-kb`, lọc sạch dòng lỗi OCR) và luật **Đọc vòng Thái Tuế + Khóa giờ sinh qua biến cố** (`ziwei-ziyun-kb`) theo chuẩn `tom_y` an toàn bản quyền.
  - Chạy **hiệu chuẩn offline** thang điểm Bát Tự trên 1.681 mệnh lệ thật (`bazi-kb`); bổ sung từ `Tam Mệnh Thông Hội` quyển 8–9.
  - Viết chuyên sâu 4 cụm KB đang khuyết lớn nhất: **(a) Khôi phục & Tái hợp/Mở lòng sau ly hôn**, **(b) Hóa giải xung khắc vợ chồng theo tháng**, **(c) Hợp tác góp vốn & Phân vai đối tác**, **(d) Gỡ hoang mang các cách cục hay bị thầy dọa**.
- **Việc 1.3 (Công tắc 2 Chế độ "Zero-Bloat"):**
  - Xây dựng `ung_dung_co_dien_kb.json` (~20 KB, song ngữ Việt/Anh) và gắn công tắc `[Đời sống & Hành động]` ⇄ `[Học thuật Cổ điển & Ngũ hành]` xuyên suốt bài luận & hỏi đáp (chuyển đổi 0 ms, không làm phình dữ liệu lưu trữ quá trần 190 KB).

---

### 🧠 CHẶNG 2 (Tuần 7–10): Bộ Não Liên Mảng "Tam Tài Trực Giao" (`/co-van`), Cố Vấn Kinh Doanh & UI 5 Khối
*Mục tiêu: Người dùng vào chỉ cần hỏi nỗi trăn trở bằng lời đời thường — hệ thống tự huy động cả Tử Vi, Bát Tự, Phong Thủy, Hoàng Lịch để giải đáp trọn gói trên 1 màn hình.*
- **Việc 2.1 (Cổng Cố vấn Liên mảng `/co-van` — 0% ngõ cụt):**
  - Vận hành theo cơ chế **Tam Tài Phân Vai Trực Giao** (*Nội lực Bát Tự × Tình huống/Người quanh bạn Tử Vi × Đòn bẩy Phong Thủy & Ngày đẹp*).
  - Tự động thích nghi **3 mức đầu vào**: Chỉ có ngày sinh (chạy ngay Tam Trụ + Phong Thủy + Thần số + Hoàng lịch) → Thêm 3 mốc quá khứ để khóa giờ sinh → Thêm hướng nhà / ngày sinh đối tác.
- **Việc 2.2 (Không gian `/co-van-kinh-doanh` & Hồ sơ Gia đình bền vững):**
  - Phục vụ trọn vẹn chủ doanh nghiệp / người kinh doanh: *Lịch 12 tháng bung vốn vs giữ tiền · Soi bù khuyết Co-founder/Đối tác (kèm Link mời đối tác tự nhập Zero-PII) · Chấm mặt bằng & quầy thu ngân Vận 9 · Lưu "Bàn cờ Đối tác & Nhà cửa" mã hóa đầu-cuối (E2EE) trên trình duyệt*.
- **Việc 2.3 (Giao diện Trả lời 5 Khối Trực Quan & Nhịp Đồng Hành):**
  - *Khối 1: Kết luận thẳng 5 giây* → *Khối 2: Dải Nhịp 12 Tháng (Tiến / Giữ / Lùi)* → *Khối 3: Hộp Ứng dụng & Điều hòa 2 Chế độ* → *Khối 4: Biểu đồ Radar 5 Hành / Sơ đồ 9 Cung* → *Khối 5: "Vì sao sách xưa nói vậy" + Nút Nhắc việc đầu tháng thuận (Web Push)*.

---

### 🧭 CHẶNG 3 (Tuần 11–16): Hợp Nhất Toàn Hệ Sinh Thái 9 Môn Huyền Học Sẵn Có
*Mục tiêu: Khai thác hết phần còn lại của 15 kho `*-kb` để không một câu hỏi ngách hay sự vụ tức thời nào bị bỏ sót.*
- **Việc 3.1 (Kỳ Môn Độn Giáp & Kinh Dịch / Lục Hào — Tầng Chiến thuật Sự vụ):**
  - Nạp 430 mục cổ thư công cộng từ `qimen-miji-kb` + *Bốc Phệ Toàn Thư / Dịch Lâm* (`iching-kb`) và nối vào `/co-van` & `/co-van-kinh-doanh` cho các câu hỏi sự vụ tức thời (*"Thương vụ này đàm phán sao cho thắng?", "Việc đang chờ bao giờ ngã ngũ?"*).
- **Việc 3.2 (Nhân Tướng & Chỉ Tay Đông–Tây — Tầng Kiểm chứng Hiện tại):**
  - Bổ sung phái Chỉ tay phương Tây (4 dáng bàn tay nguyên tố + 7 gò từ 21 điểm mốc đã đo sẵn) và đối chiếu *Tướng mạo/Khí sắc hiện tại × Dụng thần lá số*.
- **Việc 3.3 (Thần Số Học Đa Phái & Tarot Chiều Sâu):**
  - Hoàn thiện đối chiếu Cheiro/Balliett/Phillips/Goodwin (Thần số) và 56 lá ngược Minor Arcana + phẩm giá nguyên tố (Tarot) làm phễu giải đáp nhanh dẫn người trẻ khám phá sang Tử Vi / Bát Tự.

---

### 🌍 CHẶNG 4 (Từ Tháng 5 trở đi): Chiêm Tinh Phương Tây (`pyswisseph`), Cầu Nối Đông – Tây & Trí Khôn Tập Thể
*Mục tiêu: Chạm ngưỡng 95–99% thỏa mãn toàn diện cả phương Đông lẫn phương Tây, trong nước lẫn quốc tế (`/en`).*
- **Việc 4.1 (Bộ máy `CALC` Chiêm Tinh Phương Tây tất định):**
  - Xây dựng trên `pyswisseph` (Swiss Ephemeris offline, sai số < 1 giây cung): `chiem_tinh_natal.py` (10 hành tinh, Cung Mọc, MC, Nodes, Chiron, Placidus/Whole Sign, Aspects), `chiem_tinh_transit.py` (Transit, Solar Return, Saturn Return), `chiem_tinh_synastry.py` (Synastry & Composite cho tình yêu/đối tác), và Vòng tròn Bản đồ sao SVG *Đêm sao*.
- **Việc 4.2 (6 Kho KB Chiêm Tinh + Cầu Nối Đông – Tây Độc Quyền):**
  - Xây dựng 5 kho nền (`planets_signs`, `houses`, `aspects`, `transits_timing`, `synastry`) + kho thứ 6 **`astro_east_west_bridge_kb.json`** đối chiếu trực tiếp Đông – Tây (*Tử Vi + Bát Tự ↔ Natal + Transit*).
- **Việc 4.3 (Bộ máy Bổ trợ & Tự Tiến Hóa Cấp Cao):**
  - Bổ sung **Trạch Nhật chuyên sâu** (*Đổng Công Tuyển Trạch + Hiệp Kỷ Biện Phương Thư 35 quyển*), vận hành vòng duyệt tự động hàng tuần từ dữ liệu thực chứng `kiem_chung_phieu` + `kiem_chung_sau` (cả tiếng Việt lẫn `/en`), đưa kho tri thức của `hieubanthan` trở thành tài sản trí tuệ ngày càng thông minh theo năm tháng.
