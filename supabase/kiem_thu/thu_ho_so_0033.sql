-- EN-6 BI-3 (migration 0033): hồ sơ tài khoản lưu múi giờ nơi sinh (utc_noi_sinh) — chỉ khi sinh ở nước ngoài.
-- Chạy SAU thu_sao.sql (A đã có hồ sơ). Dòng "phải bị chặn" PHẢI báo lỗi; RLS: B không đọc / sửa được hồ sơ A.
\set ON_ERROR_STOP 1
grant all on all tables in schema public to authenticated;
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
with x as (update ho_so set noi_sinh = 'nuoc_ngoai', utc_noi_sinh = -5
           where user_id = '11111111-1111-1111-1111-111111111111' returning utc_noi_sinh)
select 'A sinh nước ngoài, UTC−5 → lưu' t, utc_noi_sinh from x;
with x as (update ho_so set utc_noi_sinh = 5.75
           where user_id = '11111111-1111-1111-1111-111111111111' returning utc_noi_sinh)
select 'A UTC+5:45 (Nepal, bước 0,25) → lưu' t, utc_noi_sinh from x;
select 'A múi giờ lẻ 0,1 giờ (phải bị chặn)' t;
\set ON_ERROR_STOP 0
update ho_so set utc_noi_sinh = 7.1 where user_id = '11111111-1111-1111-1111-111111111111';
select 'A múi giờ ngoài −12…14 (phải bị chặn)' t;
update ho_so set utc_noi_sinh = 15 where user_id = '11111111-1111-1111-1111-111111111111';
select 'A sinh trong nước mà có múi giờ (phải bị chặn)' t;
update ho_so set noi_sinh = 'ha-noi' where user_id = '11111111-1111-1111-1111-111111111111';
\set ON_ERROR_STOP 1
with x as (update ho_so set noi_sinh = 'ha-noi', utc_noi_sinh = null
           where user_id = '11111111-1111-1111-1111-111111111111' returning utc_noi_sinh)
select 'A đổi về sinh trong nước → múi giờ null' t, utc_noi_sinh is null from x;
-- B không thấy / không sửa được hồ sơ A (RLS 0006 giữ nguyên)
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B đọc hồ sơ A → 0 dòng' t, count(*) from ho_so where user_id = '11111111-1111-1111-1111-111111111111';
with x as (update ho_so set utc_noi_sinh = 1 where user_id = '11111111-1111-1111-1111-111111111111' returning 1)
select 'B sửa hồ sơ A → 0 dòng' t, count(*) from x;
reset role;
select 'cột utc_noi_sinh có ràng buộc' t, count(*) = 1 from pg_constraint where conname = 'ho_so_utc_noi_sinh_check';
