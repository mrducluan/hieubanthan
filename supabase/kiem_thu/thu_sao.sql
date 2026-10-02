-- Gọi thử hàm Sao (0008) như hai người dùng thật A, B. Dòng "phải bị chặn" PHẢI báo lỗi RLS.
\set ON_ERROR_STOP 1
-- Supabase tự cấp quyền bảng public cho authenticated; giả lập điều đó
grant all on all tables in schema public to authenticated;
insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222');
-- A
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select 'A chào mừng khi chưa lưu hồ sơ' t, nhan_chao_mung();
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc) values ('11111111-1111-1111-1111-111111111111','A','1990-05-17',now());
select 'A chào mừng' t, nhan_chao_mung();
select 'A chào mừng lần 2' t, nhan_chao_mung();
select 'A mã mời' t, lay_ma_gioi_thieu() as ma \gset
select :'ma' = lay_ma_gioi_thieu() as "mã ổn định";
select 'A tự mời' t, nhan_thuong_gioi_thieu(:'ma');
-- B
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc) values ('22222222-2222-2222-2222-222222222222','B','1991-01-01',now());
select 'B nhận lời mời' t, nhan_thuong_gioi_thieu(:'ma');
select 'B nhận lần 2' t, nhan_thuong_gioi_thieu(:'ma');
select 'B số dư' t, so_du_sao();
select 'B tiêu 15' t, dung_sao(15, 'lg-1', 'Luận giải');
select 'B tiêu lại cùng khoá' t, dung_sao(15, 'lg-1', 'Luận giải');
select 'B tiêu quá' t, dung_sao(100, 'lg-2', 'x');
select 'B thấy sổ cái của A?' t, count(*) from so_cai_sao where user_id='11111111-1111-1111-1111-111111111111';
select 'B tự cộng Sao (phải bị chặn)' t;
\set ON_ERROR_STOP 0
insert into so_cai_sao (user_id, so_luong, loai, khoa) values ('22222222-2222-2222-2222-222222222222', 999, 'dieu_chinh', 'gian');
\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select 'A số dư (10 chào mừng + 20 mời)' t, so_du_sao();
reset role;
select 'anon gọi được so_du_sao?' t, has_function_privilege('anon','so_du_sao()','execute');
