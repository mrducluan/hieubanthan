-- Ý1 (HTT-2 mục 8, chủ dự án duyệt 2026-11-09) — mốc Web Push mới 'thang_hai_la_so': ngày 1 dương lịch, một thông báo
-- "Tháng này Tử vi và Bát tự cùng thấy …" dựng tất định từ đúng hộp tháng của "Thời gian tới" (engine
-- /v1/push/thang-hai-la-so; không dự báo, không doạ). Người dùng TỰ TÍCH ở Hôm nay → Bật nhắc → Nhận thêm (không tích sẵn).
-- Dữ liệu cần: LÁ SỐ ĐẦY ĐỦ (ngày giờ sinh, giới tính, nơi sinh / múi giờ) → cron web (service role) đọc bảng ho_so
-- (0006/0007/0015/0033) CHỈ cho user đã tích mốc này, chỉ các cột lá số (không tên, không email), một lời gọi engine, không
-- ghi thêm gì — như Y3 đọc hướng nhà cho mốc giao tiết. Vẫn ≤ 1 thông báo / thiết bị / ngày; thứ tự: mốc tự đánh dấu >
-- mốc lịch (mốc này đứng trước 'thang_ca_nhan') > sáng nay. push_hang_doi_v2 (0020) không đổi: cột moc_lich trả về đã là
-- cờ để cron biết cần đọc hồ sơ. Chạy SAU 0020 (và 0034 theo thứ tự số). Rollback: 0035_push_thang_hai_la_so.down.sql.

alter table push_tuy_chon drop constraint if exists push_tuy_chon_moc_lich_check;
alter table push_tuy_chon add constraint push_tuy_chon_moc_lich_check
    check (moc_lich <@ array['thang_ca_nhan', 'giao_tiet', 'lap_xuan_tet', 'thang_hai_la_so']::text[]);
comment on column push_tuy_chon.moc_lich is
    'Mốc lịch người dùng tự tích: thang_ca_nhan · giao_tiet · lap_xuan_tet · thang_hai_la_so (0035: đầu tháng, cron đọc lá số trong ho_so của chính người đó).';
