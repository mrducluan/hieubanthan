# Pháp lý 2026 — cần làm gì, làm thế nào (2026-10-26)

> Đối tượng: chủ dự án. Mức chắc chắn ghi từng mục. Em không phải luật sư — mục "cần luật sư" thì hỏi luật sư trước khi
> làm. Nguồn tra cứu: thuvienphapluat.vn, luatvietnam.vn, vbpl.vn (văn bản gốc).

## 0. Hiện trạng — đã đúng gì rồi

- **Chính sách quyền riêng tư công khai ĐÃ dẫn đúng** Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 01/01/2026) +
  Nghị định 356/2025/NĐ-CP (`web/app/chinh-sach-rieng-tu/page.tsx`), đã liệt kê bên xử lý thay + nơi đặt máy chủ ở nước
  ngoài, quyền của người dùng, cam kết báo sự cố. (Em đính chính: báo cáo trước nói "còn dẫn NĐ 13/2023" — chỉ đúng với
  4 chú thích trong code; em đã sửa 4 chỗ đó ngày 26/10.)
- Đồng ý tách theo mục đích, không tích sẵn (ảnh nhà, ghi chú góp ý, tự lưu bài, nhắc việc) — đúng tinh thần luật mới.
- Không lưu IP; mã băm thiết bị (chống gian lận) đã nêu trong chính sách, hiệu lực 26/10/2026.

## 1. Luật Bảo vệ dữ liệu cá nhân 91/2025 + NĐ 356/2025 — việc của anh

| # | Việc | Vì sao | Làm thế nào | Chắc chắn |
|---|---|---|---|---|
| 1.1 | **Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân** | Luật yêu cầu bên xử lý dữ liệu lập + lưu hồ sơ đánh giá tác động | Văn bản nội bộ: dữ liệu gì (ngày giờ sinh, tên, email, ảnh nhà khi đồng ý, mã băm thiết bị), mục đích, nơi lưu, thời hạn, biện pháp bảo vệ (RLS, mã hoá, không lưu IP), rủi ro. Phần lớn nội dung đã có trong Chính sách + `docs/BAO-MAT.md` → em soạn bản nháp được khi anh đồng ý. Nộp theo mẫu của Bộ Công an (Cục An ninh mạng — A05) | Trung bình — **cần luật sư** xem doanh nghiệp nhỏ / khởi nghiệp có được miễn hoặc hoãn nghĩa vụ này trong giai đoạn đầu không |
| 1.2 | **Hồ sơ chuyển dữ liệu cá nhân ra nước ngoài** | Máy chủ ở Singapore; AI, đo lường ở Hoa Kỳ/EU (đã ghi trong Chính sách) | Như 1.1 nhưng cho từng bên nhận ở nước ngoài: tên bên nhận, nước, dữ liệu gửi, căn cứ (đồng ý / hợp đồng). Danh sách bên xử lý đã có ở mục "Bên xử lý thay" | Trung bình — **cần luật sư** (cách nộp, thời hạn theo NĐ 356) |
| 1.3 | **Người / bộ phận phụ trách bảo vệ dữ liệu** | Luật yêu cầu chỉ định | Ghi tên người phụ trách (có thể là anh) + email `contact@hieuban.com` trong Chính sách | Trung bình — có thể được miễn với doanh nghiệp nhỏ, **hỏi luật sư** |
| 1.4 | **Quy trình báo sự cố trong 72 giờ** | Chính sách đã cam kết "theo thời hạn pháp luật" | Một trang quy trình nội bộ: ai phát hiện → báo ai → báo A05 + người dùng. Em soạn được | Cao (thời hạn báo sự cố có trong luật) |
| 1.5 | **Mức phạt** | Vi phạm nghiêm trọng có thể tới 5% doanh thu năm liền kề | — | Theo báo chí, **cần đọc văn bản gốc** |

## 2. Luật Thương mại điện tử 122/2025 (hiệu lực 01/07/2026) — việc của anh

hieuban.com **bán Sao** qua payOS → là website có chức năng bán hàng/dịch vụ trực tuyến.

| # | Việc | Làm thế nào | Chắc chắn |
|---|---|---|---|
| 2.1 | **Thông báo / đăng ký website với Bộ Công Thương** | Vào online.gov.vn (Cổng quản lý hoạt động TMĐT), tạo tài khoản, khai website. Xong đặt env `THONG_TIN_BO_CONG_THUONG_URL` trên Vercel → chân trang tự hiện liên kết tới trang thông báo (code đã có, `ChanTrang.tsx`) | Cao về nghĩa vụ; **thủ tục theo luật mới có thể đổi** — kiểm nghị định hướng dẫn trước khi nộp |
| 2.2 | **Thông tin bắt buộc trên website**: tên đơn vị, mã số thuế, địa chỉ, liên hệ | Đặt env `THONG_TIN_CHU_SO_HUU`, `THONG_TIN_MA_SO`, `THONG_TIN_DIA_CHI`, `THONG_TIN_EMAIL`, `THONG_TIN_DIEN_THOAI` trên Vercel (code đọc sẵn, `web/lib/van-hanh.ts`). Cần MST → đăng ký hộ kinh doanh (việc TT-a đang chờ) | Cao |
| 2.3 | **Chính sách hoàn tiền / khiếu nại rõ ràng** | Đã có trong Điều khoản (mục Sao + hoàn tiền thủ công). Khi bật hội viên năm cần thêm hoàn tiền theo thời gian còn lại | Cao |

## 3. Câu hỏi cho luật sư (gửi một lần, trả lời một lần)

1. hieuban.com (hộ kinh doanh / cá nhân, quy mô nhỏ) có được **miễn hoặc hoãn** hồ sơ đánh giá tác động (1.1), hồ sơ
   chuyển dữ liệu ra nước ngoài (1.2), người phụ trách bảo vệ dữ liệu (1.3) theo Luật 91/2025 + NĐ 356/2025 không?
2. Sao (credit nội bộ, không đổi tiền, không chuyển nhượng) có thuộc **hợp đồng theo mẫu / điều kiện giao dịch chung
   phải đăng ký** theo Luật Bảo vệ quyền lợi người tiêu dùng 2023 + NĐ 55/2024 không?
3. **Hoa hồng Sao một tầng** khi bạn bè nạp tiền (trả bằng Sao tặng, không tiền) có bị coi là kinh doanh đa cấp theo
   NĐ 40/2018 (sửa bởi NĐ 18/2023) không? (Anh đã quyết làm và tự chịu trách nhiệm — câu này để có văn bản xác nhận.)
4. Quảng cáo dịch vụ thần số / tử vi / phong thuỷ theo **Luật Quảng cáo sửa đổi 75/2025** có hạn chế gì?
5. Thủ tục **thông báo website TMĐT** theo Luật 122/2025 + nghị định hướng dẫn hiện hành.

## 4. Thuế (hỏi kế toán)

Từ 2026 bỏ thuế khoán, hộ kinh doanh kê khai theo doanh thu thực tế; ngưỡng không chịu thuế và mốc bắt buộc hoá đơn
điện tử có mã — nguồn báo chí còn lệch nhau → **hỏi kế toán** trước khi doanh thu nạp Sao vượt vài trăm triệu/năm.

## 5. Em đã làm / sẽ làm trong code

- [x] 26/10: sửa 4 chú thích code + 1 test engine đang dẫn NĐ 13/2023 → Luật BVDLCN 91/2025.
- [x] 26/10: Chính sách quyền riêng tư nêu mã băm thiết bị (chống gian lận), hiệu lực 26/10/2026.
- [ ] Khi anh đồng ý: em soạn **bản nháp hồ sơ đánh giá tác động** (1.1) + **hồ sơ chuyển ra nước ngoài** (1.2) +
  **quy trình báo sự cố 72 giờ** (1.4) từ dữ liệu đã có — anh/luật sư rà rồi nộp.
- [ ] Các dòng quyết định cũ trong CLAUDE.md giữ nguyên chữ "NĐ 13/2023" vì đó là ghi chép lịch sử đúng thời điểm;
  quyết định mới ghi luật hiện hành.
