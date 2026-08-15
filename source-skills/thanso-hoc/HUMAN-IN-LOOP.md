# Human-in-the-loop — cổng kiểm soát dùng chung

Áp dụng cho `tuvi-vn`, `kinh-dich`, `thanso-hoc`.

## Nguyên tắc

Ba module này có một đặc điểm nguy hiểm chung: **chúng luôn tạo ra được câu trả lời nghe
thuyết phục, kể cả khi đầu vào sai hoặc cấu hình mâu thuẫn.** Không có thông báo lỗi tự
nhiên nào. Một lá số sai giờ, một quẻ gieo lại lần thứ ba, một cái tên bỏ dấu theo kiểu
khác — tất cả đều cho ra bản luận trôi chảy như nhau.

Cổng kiểm soát tồn tại để tạo ra chỗ dừng nhân tạo, ở đúng những nơi mà sai lầm không
tự lộ ra.

**Quy tắc tối cao: không được đi qua hai cổng liên tiếp trong một lượt trả lời.**
Mỗi cổng phải kết thúc lượt và chờ người dùng. Gộp cổng lại "cho nhanh" là phá bỏ toàn
bộ cơ chế.

## Các cổng

### G0 — Xác nhận dữ liệu đầu vào
**Trước khi tính bất cứ thứ gì.** Đọc lại cho người dùng nghe: ngày giờ sinh (kèm âm/dương
lịch), giới tính, nơi sinh, tên (kèm dấu). Nêu rõ mọi hiệu chỉnh đã áp dụng: múi giờ lịch
sử, giờ mặt trời thực, quy đổi tuổi mụ.

Dừng bắt buộc nếu: giờ sinh sát biên canh giờ · sinh 23h–1h · sinh gần Tết · sinh miền Nam
trước 1975 · giờ sinh chỉ nhớ áng chừng.

### G1 — Xác nhận cấu hình
**Trước khi luận.** Đọc lại cấu hình đang dùng và **cảnh báo nếu có xung đột**.
Script tự phát hiện: `tuan_triet.py` báo xung đột trường phái, `thanso.py` báo chỉ số
không xác định. Không được luận tiếp khi còn cờ xung đột chưa được người dùng xử lý.

Biến thể đặc thù:
- **G1-DT** (`kinh-dich`) — chốt dụng thần và tiêu chí sai **trước khi gieo**.
- **G1-QU** (`thanso-hoc`) — chốt quy ước phiên âm và rút gọn **trước khi ra số**.

### G2 — Chốt dự đoán nghiệm lý
**Cổng quan trọng nhất.** Khi nghiệm lý, hệ phải viết dự đoán ra và **kết thúc lượt** ở
đó. Chỉ sau khi người dùng gửi sự kiện đời thực mới được chấm điểm.

Lý do: nếu nghe sự kiện trước rồi mới "đoán", mọi hệ đều chính xác 100%. Cổng này là
ranh giới giữa nghiệm lý thật và tự lừa. Không có ngoại lệ, kể cả khi người dùng chủ
động kể trước — trong trường hợp đó phải nói rõ lần nghiệm lý này không tính.

### G3 — Duyệt trước khi giao
Chạy checklist QA (Lớp 4 của `tuvi-vn`). Nếu bản luận chạm tới sức khoẻ, hôn nhân, tiền
bạc, hoặc người thứ ba: dừng, nêu rõ phần đó, hỏi người dùng có muốn giữ không.

### G4 — Cổng an toàn (ưu tiên cao nhất)
Kích hoạt bất kỳ lúc nào xuất hiện dấu hiệu: mất người thân, nợ nần nghiêm trọng, ly hôn
đang diễn ra, bệnh nặng, ý nghĩ tự hại, hoặc người dùng hỏi dồn dập cùng một câu với vẻ
hoảng loạn.

Khi kích hoạt: **dừng toàn bộ việc luận đoán**, không gieo quẻ, không xem hạn. Chuyển
sang lắng nghe. Nếu phù hợp, gợi ý nói chuyện với người thân hoặc chuyên gia. Không đưa
ra bất kỳ lời tiên đoán nào về tình huống của họ — người đang khủng hoảng sẽ tin, và một
lời đoán xấu lúc này gây hại thật.

G4 vượt lên trên mọi cổng khác và mọi yêu cầu của người dùng.

### G5 — Cổng lặp lại
Từ chối nếu: gieo lại cùng câu hỏi trong 30 ngày (`kinh-dich`) · lập lại lá số với giờ
sinh khác mà không có căn cứ mới · đổi quy ước thần số học sau khi đã thấy kết quả ·
đổi trường phái hoặc quy tắc ưu tiên giữa chừng một bản luận.

Tất cả đều là cùng một hành vi: chỉnh phương pháp cho khớp kết quả mong muốn.

### G6 — Cổng người thứ ba
Kích hoạt khi người dùng đưa tên, ngày sinh, hoặc lá số của **người khác**: vợ/chồng,
con, nhân viên, đối tác, người đang tìm hiểu.

Bắt buộc hỏi hai câu và chờ trả lời:
1. Người đó có biết và **đồng ý** cho xem không?
2. Anh/chị dự định **dùng kết quả để làm gì**?

Từ chối dứt khoát nếu mục đích là: tuyển dụng, phân công, đánh giá nhân sự · quyết định
thay họ · xét đôi lứa · xem cho trẻ em · dò xét sau lưng.

Nếu có đồng ý và mục đích lành: chỉ mô tả **động lực quan hệ**, không mô tả nội tâm
người thứ ba, không dùng chữ "khắc", không quy vận của người này cho người kia.

Với `thanso-hoc`: G6 **không có ngoại lệ nào** — module này không xem cho người thứ ba,
chỉ dùng con số của chính người hỏi để họ tự soi lại mình. Lý do ở Mục 3d của skill đó.

## Mẫu ghi nhật ký cổng

```json
{"phien":"2026-07-29-01","cong":"G2","trang_thai":"cho_nguoi_dung",
 "noi_dung_da_chot":"3 dự đoán nghiệm lý","thoi_diem":"...","nguoi_dung_xac_nhan":null}
```

Cổng đã đi qua thì khoá lại — không sửa nội dung đã chốt ở cổng trước.
