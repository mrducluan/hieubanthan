-- SAO-2 (migration 0013): hạn mức hỏi miễn phí + thống kê doanh thu. Chạy SAU thu_thanh_toan.sql.
set role service_role;
select 'lượt 1/2' t, dung_luot_hoi('k:abcdef0123456789', 2) ->> 'duoc';
select 'lượt 2/2' t, dung_luot_hoi('k:abcdef0123456789', 2) ->> 'da_dung';
select 'lượt 3 (hết: false)' t, dung_luot_hoi('k:abcdef0123456789', 2) ->> 'duoc';
select 'trần tăng 3 → được thêm 1' t, dung_luot_hoi('k:abcdef0123456789', 3) ->> 'duoc';
select 'khoá khác độc lập' t, dung_luot_hoi('u:11111111-1111-1111-1111-111111111111', 2) ->> 'da_dung';
\set ON_ERROR_STOP 0
select 'khoá sai (phải lỗi khoa_khong_hop_le)' t, dung_luot_hoi('x;drop', 2);
\set ON_ERROR_STOP 1
reset role;
select 'authenticated gọi được dung_luot_hoi?' t, has_function_privilege('authenticated','dung_luot_hoi(text,integer)','execute');
select 'anon đọc được luot_hoi?' t, has_table_privilege('anon','luot_hoi','select');
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select 'A chủ sở hữu: doanh thu 30 ngày (đơn trả > 0)' t, (thong_ke_doanh_thu(30) -> 'tong' ->> 'don_tra')::int > 0;
select 'A: top nạp có email' t, thong_ke_doanh_thu(30) -> 'top_nap' -> 0 ? 'email';
select 'A: có theo_goi, sao, moi' t, thong_ke_doanh_thu(30) ?& array['theo_goi', 'sao', 'moi', 'theo_ngay', 'tieu_theo'];
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B biên tập xem doanh thu (phải bị chặn)' t;
\set ON_ERROR_STOP 0
select thong_ke_doanh_thu(30);
\set ON_ERROR_STOP 1
reset role;
