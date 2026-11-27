# Quy tắc làm video ngắn Hiểu Bản Thân

Đọc file này trước khi viết kịch bản hay dựng bất kỳ video nào trong `video-ngan/`.
Các quy tắc dưới đây do chủ dự án chốt khi duyệt lô v28–31 (26/11/2026). Lô nào vi phạm thì sửa lại trước khi gửi duyệt.

## 1. Nhân vật minh hoạ: không lặp lại ngày sinh

- **Không dùng lại ngày sinh 24/10/1988** (nhân vật Minh Anh của lô v6–27). Ngày này đã xuất hiện quá nhiều lần.
- Mỗi lô chọn **một ngày sinh mới**, rồi ghi vào bảng "Đã dùng" bên dưới. Không lấy lại ngày đã có trong bảng.
- Chọn ngày sinh của **người dùng tiềm năng**: năm sinh thuộc nhóm đông người, đang đi làm, đang lo chuyện kinh doanh, học thêm, mua nhà, mua xe,
  con nhỏ (ưu tiên sinh 1985–2000, tức 27–42 tuổi vào năm 2027). Ngày tháng chọn ngẫu nhiên. Tránh ngày đặc biệt dễ gây chú ý
  (ngày lễ, 29/02, giờ Tý sát nửa đêm) trừ khi video nói về chính trường hợp đó.
- Trên màn hình luôn ghi "Nhân vật minh hoạ" (hoặc "Một lần gieo minh hoạ") khi hiện ngày sinh.

| Lô | Nhân vật | Ngày giờ sinh | Nơi sinh |
|---|---|---|---|
| v6–27 | Minh Anh, nữ | 24/10/1988 · 9:30 | Hà Nội |
| v28–31 | Thu Hà, nữ | 12/09/1992 · 7:30 | TP. Hồ Chí Minh |

## 2. Không dùng từ kỹ thuật với người xem

- **Không có chữ "engine"** trong chữ trên màn hình, lời đọc và caption. Cũng không dùng: API, route, KB, CALC, model, hệ thống,
  "nháp AI", tên thư viện hay tên trường dữ liệu. Đây là từ nội bộ giữa chủ dự án và người dựng; người xem không hiểu và không quan tâm.
- Thay bằng: **"Hiểu Bản Thân"**, **"hieuban.com"** (lời đọc: "hiểu bản chấm com"), "lá số", "sách xưa", "trang Tử vi của hieuban.com".
- Phụ đề dựng từ lời đọc phải đổi "hiểu bản chấm com" về **"hieuban.com"**: trên màn hình chỉ có tên miền, không có cách đọc phiên âm (lỗi lô v28–31, đã sửa trong `phuDe` của `dung-ui.mjs`).
- **Demo trên giao diện thật hieuban.com** (chủ dự án yêu cầu 27/11/2026): chụp UI bằng `v28-31/chup-ui.mjs` (web + engine chạy trên máy, chặn mọi yêu cầu ra ngoài); chữ, số, tháng, ngày trên hình và trong lời đọc lấy từ chính giao diện. Không tự vẽ lại lá số hay bảng thay cho UI.
- **Phủ kín 9:16, không để mảng trống**: thương hiệu trên cùng → tiêu đề → khung trình duyệt chạy tới đáy màn (tự cuộn, khoanh sáng đúng chỗ đang đọc) → phụ đề đè lên khung (bộ dựng `v28-31/dung-ui.mjs`).
- **Kết hợp ảnh thật bên ngoài với UI**: mỗi việc mở bằng ảnh CC0 phủ kín màn rồi khung UI trượt lên; **giây đầu video giữ hình ngôi nhà** (`anh/nha_3.jpg`) với video có chuyện nhà cửa.
- Chỉnh âm lượng phải chạy qua `zsh -lc` (ffmpeg chỉ có trong PATH đăng nhập), rồi xem giờ sửa tệp xuất ra: bước này lỗi im lặng thì tệp cũ vẫn qua kiểm tra.
- **Có nhạc nền sôi động** (chủ dự án yêu cầu 27/11/2026): `v28-31/nhac.py` tự tổng hợp (trống 4/4 118 nhịp/phút, bass, giai điệu, tiếng chuyển cảnh), tự nhỏ khi có giọng đọc; không dùng nhạc có bản quyền.
- Dựng lại một lô: bật engine (8000) + web (3000) trên máy → `node chup-ui.mjs` → `python3 giong.py` → `node dung-ui.mjs` → trong `hf-<mã>/` chạy HyperFrames `render` → chỉnh âm lượng.
- Thu giọng xong thì so lời máy nghe lại (scribe) với kịch bản. Con số bị ghi thành chữ số là bình thường. Từ dễ nghe nhầm ("đuôi mắt" thành "đôi mắt", "qua Tết" thành "quà Tết") thì đổi cách nói cho rõ ngữ cảnh.
  Ví dụ: ~~"Mình hỏi engine Tử vi"~~ → "Mình xem trên hieuban.com"; ~~"engine dặn"~~ → "hieuban.com dặn" / "sách tử vi dặn".
- Tên đầu vào kỹ thuật (route, tham số) chỉ ghi ở phần "Nguồn dữ liệu" trong file kịch bản cho người dựng đọc, không lên hình.

## 3. Nội dung phải cụ thể, dùng được ngay

- Mỗi video trả lời theo **việc cụ thể trong đời sống**: kinh doanh, công việc, học hành, mua nhà, mua xe, gặp gỡ đối tác,
  tình cảm, con cái. Không dừng ở câu chung chung như "làm việc lớn", "năng lượng thuận".
- Có **vận hạn** thì nêu (Tam tai, Kim lâu, Hoang ốc, sao hạn, Thái Tuế, Hoá Kỵ…) và nói rõ **tháng nên tránh** cho từng việc.
- Có **cảnh báo nhẹ để người xem tự soi**: "nếu bạn hay … thì thử để ý …". Không hù doạ, không phán chắc, không bán vật phẩm hoá giải.
- Kết bằng một câu tự soi và lời mời kiểm chứng trên hieuban.com.
- Câu trả lời trong video vẫn phải là **dữ liệu thật do hệ thống Hiểu Bản Thân tính ra** (chạy lại khi đổi nhân vật); không tự viết thêm
  dự đoán. Lời diễn giải đời thường được phép, nhưng phải bám đúng ý gốc.

## 4. Hình ảnh

- Không chỉ chữ trên nền trời sao. Mỗi cảnh có hình minh hoạ: hình dữ liệu (lá số, tứ trụ, la bàn, gương mặt) vẽ đúng số liệu,
  cộng ảnh/biểu tượng minh hoạ đời sống (nhà, xe, sổ sách, cái bắt tay…) và hiệu ứng chuyển cảnh.
- Ảnh lấy trên mạng chỉ dùng nguồn **miễn phí, được phép dùng thương mại** (Openverse CC0/CC BY, Pixabay, Unsplash…) và ghi nguồn
  trong file kịch bản. Không dùng ảnh người thật nổi tiếng, không dùng tranh bài/tranh tôn giáo có bản quyền.
- Ảnh AI tạo sinh làm nền hoặc chèn 1–2 giây, không để AI vẽ lại con số, lá số hay quẻ.
- Công cụ: HyperFrames (dựng HTML → video, khối hiệu ứng có sẵn), Remotion (khi cần React), ffmpeg-skill (cắt, chuẩn hoá −15 LUFS, kiểm định dạng TikTok/Reels).

## 5. Giọng đọc và kỹ thuật

- ElevenLabs, giọng Hanh (`pGapy9MNHCukzJtjavF0`), `eleven_v3`, stability 0.5, có thẻ cảm xúc ([warmly], [curious]…). Số đọc thành chữ.
- Dọc 1080×1920, 30 fps. Thời lượng cảnh = độ dài giọng thật + 0,55 giây; cảnh cuối thêm 1,4 giây. Âm lượng −15 LUFS.
- Gửi chủ dự án duyệt kịch bản (chữ + lời đọc + hình minh hoạ) trước khi thu giọng và dựng.
