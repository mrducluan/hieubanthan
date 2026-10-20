-- TV-V2 (migration 0015): hồ sơ tài khoản nhận do_tin_gio = 'unknown' ("Không biết giờ").
-- Chạy SAU thu_sao.sql (A đã có hồ sơ). Dòng "phải bị chặn" PHẢI báo lỗi.
\set ON_ERROR_STOP 1
grant all on all tables in schema public to authenticated;
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
with x as (update ho_so set do_tin_gio = 'unknown', gio_sinh = null
           where user_id = '11111111-1111-1111-1111-111111111111' returning do_tin_gio, gio_sinh)
select 'A lưu Không biết giờ → unknown, giờ null' t, do_tin_gio, gio_sinh is null from x;
with x as (update ho_so set do_tin_gio = 'exact', gio_sinh = '08:15'
           where user_id = '11111111-1111-1111-1111-111111111111' returning do_tin_gio)
select 'A đổi lại exact' t, do_tin_gio from x;
select 'A giá trị lạ (phải bị chặn)' t;
\set ON_ERROR_STOP 0
update ho_so set do_tin_gio = 'abc' where user_id = '11111111-1111-1111-1111-111111111111';
\set ON_ERROR_STOP 1
update ho_so set do_tin_gio = 'unknown', gio_sinh = null where user_id = '11111111-1111-1111-1111-111111111111';
reset role;
select 'ràng buộc ho_so_do_tin_gio_check có unknown' t,
    pg_get_constraintdef(oid) like '%unknown%' from pg_constraint where conname = 'ho_so_do_tin_gio_check';
