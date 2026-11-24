# Lì Xì Báo Cáo Tết Đinh Mùi 2027 (LX-2027)

> **Trạng thái:** Chủ dự án duyệt Migration `0042_li_xi_tet.sql` + thang giá `99k / 249k / 399k` (24/11/2026).
> **Khâu tăng trưởng:** NẠP (doanh thu tiền mặt mùa Tết 12/2026–02/2027) + MỜI (viral 1 người mua kéo 1–5 người nhận mới) + QUAY LẠI.
> **Đo bằng:** `gift_purchased{goi, so_bao}`, `gift_claimed{mau_thiep}`, `share_created{kind: li_xi}`, tỉ lệ người nhận mở báo cáo 2027 và tỉ lệ gửi Lì Xì Đáp Lễ.

## 1. Insight & Pain Point người dùng dịp Tết Đinh Mùi 2027

Tết Đinh Mùi rơi vào **06/02/2027** (Thiên Hà Thuỷ; Hợi–Mão–Mùi năm cuối Tam tai; Mùi năm tuổi; Sửu xung Thái Tuế; Năm thế giới số 2). Người Việt tìm kiếm cao điểm từ tháng 12 đến hết tháng Giêng âm cho 6 nhóm nhu cầu — toàn bộ được giải quyết trực tiếp bằng **Engine tất định 5 tầng** đã có của `hieuban.com` (không LLM bịa dữ kiện):

1. **Công việc & Chuyển việc:** `thoi_gian_toi` (Quan Lộc lưu niên + Năm cá nhân 2027) + KH-1 `ke_hoach_thang` (`doi_viec`, `hoc_thi`) → chỉ rõ tháng thuận nhảy việc/nâng cấp.
2. **Tiền bạc, Mua bán & Kinh doanh:** Lưu niên Tài Bạch + Bát tự Tài tinh + KH-1 (`khoi_su`, `ky_ket`, `mua_nha`, `mua_xe`) + `chu_y_nam` nhắc giữ tiền.
3. **Tình cảm & Gia đình:** Lưu niên Phu Thê / Điền Trạch + Kim Lâu cưới hỏi + KH-1 (`cuoi_hoi`, `xay_nha`).
4. **Sức khoẻ phòng ngừa:** `suc_khoe_nam` (SK-1/SK-2) nhắc thời điểm khám tổng quát định kỳ & giữ nhịp sinh hoạt — luôn kèm lời khuyên gặp bác sĩ, tuyệt đối không chẩn đoán hay phán bệnh.
5. **Bản thân & Nhịp 12 tháng:** Giao thoa Tử vi + Bát tự + Thần số 12 tháng 2027 (chỉ rõ Tháng Vàng và Tháng cần đi chậm).
6. **Tập quán đầu năm 2027:** Sao hạn, Tam tai, Kim lâu, Hoàng ốc, Hướng xấu Ngũ Hoàng 2027 trình bày văn hoá tham khảo (không doạ, không bán vật phẩm giải hạn — NĐ 38/2021).

## 2. Nguyên tắc pháp lý & kỹ thuật (2026)

- **Tặng NỘI DUNG, KHÔNG phải tiền/Sao/voucher đổi tiền:** Người mua trả VND qua Pay2S để mua 1 / 3 / 5 mã mở trọn **Báo cáo Năm 2027** (`/thoi-gian-toi`). Mã không đổi ra tiền, không chuyển nhượng sau khi nhận, dùng 1 lần, hết hạn `2027-03-31` → an toàn với NĐ 52/2024 và điều khoản Pay2S.
- **Bảo vệ dữ liệu cá nhân (Luật 91/2025 + NĐ 356/2025):** Người tặng **KHÔNG** nhập ngày sinh của người nhận. Người nhận bấm `/li-xi/[ma]` (`noindex`, chặn trong `robots.ts`), tự nhập ngày giờ sinh của chính họ và đồng ý ngay trên trang.
- **Thẻ chia sẻ `/og/li-xi` Zero-PII:** Chỉ hiển thị tên người tặng (tuỳ chọn, ≤ 40 ký tự) + lời chúc (≤ 160 ký tự đã lọc link/SĐT), tuyệt đối không có ngày sinh hay thông tin cá nhân.
- **Hoàn tiền & thuế:** Chỉ hoàn tiền đơn khi **0 bao** trong đơn đã được nhận (`hoan_don_li_xi` — chủ sở hữu xử lý thủ công sau khi chuyển khoản ngoài). Xuất hoá đơn điện tử / kê khai thuế hộ kinh doanh xác nhận cùng kế toán khi doanh thu tăng.
- **Công tắc an toàn:** `sao.li_xi.bat` mặc định `false` trong DB — bật ở `/quan-tri/cai-dat` sau khi chạy migration `0042_li_xi_tet.sql` và kiểm thử xong.

## 3. Thang giá đã duyệt (24/11/2026)

| Gói | Số bao | Giá VND | Trung bình / bao | Vai trò |
|---|---:|---:|---:|---|
| 1 Bao Lì Xì Tết 2027 | 1 | **99.000 ₫** | 99.000 ₫ | Khớp giá báo cáo lẻ GIA-99 |
| Combo 3 Bao Gia Đình *(Phổ biến)* | 3 | **249.000 ₫** | ≈ 83.000 ₫ | Tiết kiệm 17%, tối ưu viral gia đình/bạn bè |
| Combo 5 Bao Doanh Nghiệp / Nhóm | 5 | **399.000 ₫** | ≈ 80.000 ₫ | Tiết kiệm 19%, dễ bán cho chủ shop / team lead |
