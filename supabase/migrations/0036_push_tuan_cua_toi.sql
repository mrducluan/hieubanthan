-- BT-UI đợt 3 (chủ dự án duyệt 2026-11-10) — mốc Web Push mới 'tuan_cua_toi': sáng THỨ HAI, một thông báo "Tuần này của bạn"
-- (câu tóm tắt tuần + ngày đáng để ý nhất) dựng tất định từ đúng dữ liệu của mục "Tuần này của bạn" trên Hôm nay (engine
-- /v1/push/tuan; không dự báo, không doạ). Người dùng TỰ TÍCH ở Hôm nay → Bật nhắc → Nhận thêm (không tích sẵn).
-- Dữ liệu cần: NGÀY SINH dương lịch đủ năm (năm để biết tuổi hợp / xung với từng ngày) → cron web (service role) đọc bảng
-- ho_so CHỈ cột ngay_sinh, CHỈ cho user đã tích mốc này (không tên, không giờ sinh, không email), một lời gọi engine, không
-- ghi thêm gì — như 0035. Vẫn ≤ 1 thông báo / thiết bị / ngày; thứ tự: mốc tự đánh dấu > mốc lịch (mốc này đứng SAU các mốc
-- hiếm hơn: giao tiết, Lập xuân / Tết, đầu tháng) > sáng nay. push_hang_doi_v2 (0020) không đổi.
-- Chạy SAU 0035. Chưa chạy: ô tích mới không ghi được (web báo "Chưa lưu được"), cron bỏ qua mốc này — không vỡ gì.

alter table push_tuy_chon drop constraint if exists push_tuy_chon_moc_lich_check;
alter table push_tuy_chon add constraint push_tuy_chon_moc_lich_check
    check (moc_lich <@ array['thang_ca_nhan', 'giao_tiet', 'lap_xuan_tet', 'thang_hai_la_so', 'tuan_cua_toi']::text[]);
comment on column push_tuy_chon.moc_lich is
    'Mốc lịch người dùng tự tích: thang_ca_nhan · giao_tiet · lap_xuan_tet · thang_hai_la_so (0035) · tuan_cua_toi (0036: sáng thứ Hai, cron đọc ngay_sinh trong ho_so của chính người đó).';
