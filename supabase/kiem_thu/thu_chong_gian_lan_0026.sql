-- 0026 SAO-GL: chống gian lận thưởng mời + hoa hồng theo mã băm thiết bị. Mỗi dòng "kt" SAI là lỗi ngay.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
grant all on all tables in schema public to authenticated;
delete from cau_hinh where khoa like 'sao.%';

\set D1 '''aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'''
\set D2 '''bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'''
\set D3 '''cccccccccccccccccccccccccccccccc'''

-- G1 mời; X1..X3 cùng thiết bị D1; H mời được G1 mời bằng D2; K nhận lời mời của H cũng bằng D2.
insert into auth.users (id, email) values
    ('b0000000-0000-0000-0000-0000000000a1', 'g1@x'),
    ('b0000000-0000-0000-0000-0000000000b1', 'x1@x'),
    ('b0000000-0000-0000-0000-0000000000b2', 'x2@x'),
    ('b0000000-0000-0000-0000-0000000000b3', 'x3@x'),
    ('b0000000-0000-0000-0000-0000000000c1', 'h@x'),
    ('b0000000-0000-0000-0000-0000000000c2', 'k@x'),
    ('b0000000-0000-0000-0000-0000000000d1', 'n0@x')
on conflict do nothing;
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc)
select id, 'T', '1990-01-01', now() from auth.users where email in ('g1@x','x1@x','x2@x','x3@x','h@x','k@x','n0@x')
on conflict do nothing;

set role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000a1',false);
select lay_ma_gioi_thieu() as ma_g1 \gset
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000c1',false);
select lay_ma_gioi_thieu() as ma_h \gset

-- (1) không có tín hiệu thiết bị → như trước
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000d1',false);
select pg_temp.kt('không có thiết bị: người mời được thưởng',
    (nhan_thuong_gioi_thieu(:'ma_g1')->>'thuong_nguoi_moi')::boolean, true);

-- (2) cùng thiết bị D1: tài khoản 1, 2 bình thường; tài khoản thứ 3 → người mời không được thưởng
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000b1',false);
select pg_temp.kt('D1 tài khoản 1', (nhan_thuong_gioi_thieu(:'ma_g1', :D1)->>'thuong_nguoi_moi')::boolean, true);
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000b2',false);
select pg_temp.kt('D1 tài khoản 2', (nhan_thuong_gioi_thieu(:'ma_g1', :D1)->>'thuong_nguoi_moi')::boolean, true);
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000b3',false);
select nhan_thuong_gioi_thieu(:'ma_g1', :D1) as r3 \gset
select pg_temp.kt('D1 tài khoản 3: người được mời vẫn nhận', :'r3'::jsonb->>'ket_qua', 'da_thuong');
select pg_temp.kt('D1 tài khoản 3: người mời KHÔNG được thưởng', (:'r3'::jsonb->>'thuong_nguoi_moi')::boolean, false);
select pg_temp.kt('không lộ cờ cho người dùng', :'r3'::jsonb ? 'co_gian_lan', false);
select pg_temp.kt('X3 vẫn có 20 Sao được mời', so_du_sao(), 20);

-- (3) cùng thiết bị giữa người mời và người được mời: H nhận lời mời của G1 bằng D2, rồi K nhận lời mời của H bằng D2
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000c1',false);
select pg_temp.kt('H nhận lời mời G1 bằng D2', nhan_thuong_gioi_thieu(:'ma_g1', :D2)->>'ket_qua', 'da_thuong');
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000c2',false);
select pg_temp.kt('K cùng thiết bị với H → H không được thưởng',
    (nhan_thuong_gioi_thieu(:'ma_h', :D2)->>'thuong_nguoi_moi')::boolean, false);
select pg_temp.kt('người dùng không đọc được cờ', (select count(*) from gian_lan_co)::int, 0);
reset role;

select pg_temp.kt('cờ nhiều tài khoản', (select count(*) from gian_lan_co where loai = 'nhieu_tai_khoan')::int, 1);
select pg_temp.kt('cờ cùng thiết bị', (select count(*) from gian_lan_co where loai = 'cung_thiet_bi')::int, 1);
select pg_temp.kt('dòng mời X3 mang cờ', (select co_gian_lan from gioi_thieu where duoc_moi_id = 'b0000000-0000-0000-0000-0000000000b3'), 'nhieu_tai_khoan');
select pg_temp.kt('G1 chỉ được thưởng 3 lần (d1, x1, x2) + h', (select count(*) from so_cai_sao
    where user_id = 'b0000000-0000-0000-0000-0000000000a1' and loai = 'moi_ban')::int, 4);

-- (4) hoa hồng: X3 (có cờ) nạp → G1 không nhận hoa hồng, ghi cờ; X1 (không cờ) nạp → G1 nhận hoa hồng
insert into cau_hinh (khoa, gia_tri) values ('sao.hoa_hong.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000b3',false);
select (tao_don_nap('gia_dinh', 'gia')->>'ma_don')::bigint as dx3 \gset
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000b1',false);
select (tao_don_nap('gia_dinh', 'gia')->>'ma_don')::bigint as dx1 \gset
reset role; set role service_role;
select nap_sao_tu_cong(:dx3, 199000, 'gia', 'GX3') is not null;
select nap_sao_tu_cong(:dx1, 199000, 'gia', 'GX1') is not null;
reset role;
select pg_temp.kt('đơn X3: nghi_gian_lan, 0 Sao', (select trang_thai || ':' || sao from hoa_hong where ma_don = :dx3), 'nghi_gian_lan:0');
select pg_temp.kt('đơn X3: không có lô hoa hồng', (select count(*) from so_cai_sao where khoa = 'hoa_hong:' || :dx3)::int, 0);
select pg_temp.kt('cờ hoa_hong_nghi', (select count(*) from gian_lan_co where loai = 'hoa_hong_nghi')::int, 1);
select pg_temp.kt('đơn X1: cộng 48', (select sao from hoa_hong where ma_don = :dx1), 48);
select pg_temp.kt('người mua X3 vẫn nhận đủ 240 Sao', (select so_luong from so_cai_sao where khoa = 'mua:' || :dx3), 240);

-- (5) tắt công tắc chống gian lận → không gắn cờ
insert into cau_hinh (khoa, gia_tri) values ('sao.gian_lan.bat', 'false') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
insert into auth.users (id, email) values ('b0000000-0000-0000-0000-0000000000e1', 'e1@x') on conflict do nothing;
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc) values ('b0000000-0000-0000-0000-0000000000e1', 'E', '1990-01-01', now()) on conflict do nothing;
set role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000e1',false);
select pg_temp.kt('công tắc tắt: D1 lần 4 vẫn thưởng người mời',
    (nhan_thuong_gioi_thieu(:'ma_g1', :D1)->>'thuong_nguoi_moi')::boolean, true);
reset role;
delete from cau_hinh where khoa = 'sao.gian_lan.bat';

-- (6) thiết bị sai định dạng bị bỏ qua (không chèn rác)
insert into auth.users (id, email) values ('b0000000-0000-0000-0000-0000000000e2', 'e2@x') on conflict do nothing;
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc) values ('b0000000-0000-0000-0000-0000000000e2', 'E', '1990-01-01', now()) on conflict do nothing;
set role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000e2',false);
select pg_temp.kt('thiết bị sai định dạng → bỏ qua', nhan_thuong_gioi_thieu(:'ma_g1', 'x'' or 1=1 --')->>'ket_qua', 'da_thuong');
reset role;
select pg_temp.kt('không lưu chuỗi lạ', (select thiet_bi from gioi_thieu where duoc_moi_id = 'b0000000-0000-0000-0000-0000000000e2') is null, true);

-- (7) quyền
select pg_temp.kt('anon không gọi nhận thưởng', has_function_privilege('anon', 'nhan_thuong_gioi_thieu(text,text)', 'execute'), false);
select pg_temp.kt('authenticated không gọi gl_bat', has_function_privilege('authenticated', 'gl_bat()', 'execute'), false);
select pg_temp.kt('bản 1 tham số đã bỏ', to_regprocedure('public.nhan_thuong_gioi_thieu(text)') is null, true);
set role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-0000000000b1',false);
\set ON_ERROR_STOP 0
select 'người thường xem cờ (phải lỗi khong_co_quyen)' t, gian_lan_gan_day(30);
\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select pg_temp.kt('chủ sở hữu xem cờ', jsonb_array_length(gian_lan_gan_day(30)->'ds') >= 3, true);
select set_config('request.jwt.claim.aal','aal1',false);
reset role;
delete from cau_hinh where khoa like 'sao.%';
select 'thu_chong_gian_lan_0026: OK';
