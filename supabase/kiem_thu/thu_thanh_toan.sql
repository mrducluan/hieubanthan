-- Gọi thử thanh toán nạp Sao (0012) như người dùng thật + máy chủ (service role). Dòng "phải bị chặn" PHẢI báo lỗi.
\set ON_ERROR_STOP 1
grant all on all tables in schema public to authenticated;
insert into auth.users (id, email) values ('55555555-5555-5555-5555-555555555555', 'e@vd.vn'),
    ('44444444-4444-4444-4444-444444444444', 'd@vd.vn') on conflict do nothing;
set role anon;
select 'anon thấy gói' t, count(*) from goi_sao;
reset role;
-- C mua
set role authenticated; select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',false);
select 'E gói lạ' t, tao_don_nap('khong_co', 'payos');
select 'E cổng lạ' t, tao_don_nap('pho_bien', 'stripe');
select (tao_don_nap('pho_bien', 'payos')->>'ma_don')::bigint as don1 \gset
select 'E đơn gia' t, tao_don_nap('thu','gia') ->> 'ket_qua';
select 'E xem đơn' t, ma_don, goi, so_tien, sao, trang_thai from don_nap where ma_don = :don1;
select 'E tự đánh dấu đã trả (phải bị chặn)' t;
\set ON_ERROR_STOP 0
select nap_sao_tu_cong(:don1, 99000, 'payos', 'gian');
update don_nap set trang_thai = 'da_tra' where ma_don = :don1;
insert into don_nap (user_id, goi, so_tien, sao, cong) values ('55555555-5555-5555-5555-555555555555','thu',1,9999,'gia');
\set ON_ERROR_STOP 1
select 'E đơn vẫn chờ' t, trang_thai from don_nap where ma_don = :don1;
select 'E spam đơn' t, (select array_agg(tao_don_nap('thu','gia')->>'ket_qua') from generate_series(1,5));
-- D không thấy đơn của E
select set_config('request.jwt.claim.sub','44444444-4444-4444-4444-444444444444',false);
select 'D thấy đơn của E?' t, count(*) from don_nap where user_id = '55555555-5555-5555-5555-555555555555';
select 'D huỷ đơn của E' t, huy_don_nap(:don1);
reset role;
-- Máy chủ nhận webhook
set role service_role;
select 'webhook đúng' t, nap_sao_tu_cong(:don1, 99000, 'payos', 'FT123');
select 'webhook gửi lại' t, nap_sao_tu_cong(:don1, 99000, 'payos', 'FT123');
select 'webhook sai cổng' t, nap_sao_tu_cong(:don1, 99000, 'gia', 'x');
select 'webhook không có đơn' t, nap_sao_tu_cong(999999999, 1, 'payos', 'x');
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',false);
select (tao_don_nap('gia_dinh', 'payos')->>'ma_don')::bigint as don2 \gset
select 'E huỷ đơn 2' t, huy_don_nap(:don2);
select 'E số dư sau khi nạp 110' t, so_du_sao();
reset role;
set role service_role;
select 'tiền về sau khi huỷ' t, nap_sao_tu_cong(:don2, 199000, 'payos', 'FT124');
select (select ma_don from don_nap where user_id='55555555-5555-5555-5555-555555555555' and goi='thu' and trang_thai='cho' limit 1) as don3 \gset
select 'webhook sai số tiền' t, nap_sao_tu_cong(:don3, 1000, 'gia', 'x');
select 'đơn sai tiền' t, trang_thai, ghi_chu from don_nap where ma_don = :don3;
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',false);
select 'E số dư (110 + 240)' t, so_du_sao();
select 'E sổ cái mua' t, string_agg(so_luong::text || ' ' || loai || ' ' || coalesce(het_han::text,'không hạn'), ', ') from so_cai_sao where loai='mua';
select 'E tự hoàn (phải bị chặn)' t;
\set ON_ERROR_STOP 0
select hoan_don_nap(:don1, 'tự hoàn tiền');
\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select 'A chủ sở hữu hoàn đơn 1 thiếu lý do' t, hoan_don_nap(:don1, 'x');
select 'A hoàn đơn 1' t, hoan_don_nap(:don1, 'Khách nhầm gói');
select 'A hoàn lại lần 2' t, hoan_don_nap(:don1, 'Khách nhầm gói');
select 'A xem đơn đã hoàn' t, jsonb_array_length(ds_don_nap('hoan', 10));
select set_config('request.jwt.claim.aal','aal1',false);
select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',false);
select 'E số dư sau hoàn (350 − 110)' t, so_du_sao();
reset role;
select 'authenticated gọi được nap_sao_tu_cong?' t, has_function_privilege('authenticated','nap_sao_tu_cong(bigint,integer,text,text)','execute');
select 'anon gọi được tao_don_nap?' t, has_function_privilege('anon','tao_don_nap(text,text)','execute');
