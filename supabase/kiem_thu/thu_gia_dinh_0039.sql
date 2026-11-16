-- GD-1 đợt 3 (migration 0039): "Nhà mình" trong tài khoản — chỉ vai + năm sinh + giới tính; DB chặn tên / ngày sinh.
-- Dòng "phải bị chặn" PHẢI báo lỗi; RLS: B không đọc / sửa / xoá được nhà của A.
\set ON_ERROR_STOP 1
grant all on all tables in schema public to authenticated;
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
insert into gia_dinh (user_id, du_lieu, dong_y_luc) values ('11111111-1111-1111-1111-111111111111',
  '[{"vai":"vo_chong","nam_sinh":1992,"gioi_tinh":"nu"},{"vai":"con","nam_sinh":2018}]', now());
select 'A lưu 2 người nhà' t, jsonb_array_length(du_lieu) from gia_dinh;
\set ON_ERROR_STOP 0
select 'có tên gọi (phải bị chặn)' t;
update gia_dinh set du_lieu = '[{"vai":"con","nam_sinh":2018,"ten_goi":"Na"}]';
select 'có ngày sinh (phải bị chặn)' t;
update gia_dinh set du_lieu = '[{"vai":"con","nam_sinh":2018,"ngay_sinh":"2018-05-01"}]';
select 'vai lạ (phải bị chặn)' t;
update gia_dinh set du_lieu = '[{"vai":"sep","nam_sinh":1980}]';
select 'hai vợ chồng (phải bị chặn)' t;
update gia_dinh set du_lieu = '[{"vai":"vo_chong","nam_sinh":1990},{"vai":"vo_chong","nam_sinh":1991}]';
select '8 người (phải bị chặn)' t;
update gia_dinh set du_lieu = (select jsonb_agg(jsonb_build_object('vai','con','nam_sinh',2000+i)) from generate_series(1,8) i);
select 'năm sinh dạng chữ (phải bị chặn)' t;
update gia_dinh set du_lieu = '[{"vai":"con","nam_sinh":"2018"}]';
\set ON_ERROR_STOP 1
select 'sau các lần bị chặn vẫn còn 2 người' t, jsonb_array_length(du_lieu) = 2 from gia_dinh;
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B đọc nhà A → 0 dòng' t, count(*) from gia_dinh;
with x as (delete from gia_dinh where user_id = '11111111-1111-1111-1111-111111111111' returning 1)
select 'B xoá nhà A → 0 dòng' t, count(*) from x;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
with x as (delete from gia_dinh returning 1) select 'A xoá nhà mình → 1 dòng' t, count(*) from x;
reset role;
