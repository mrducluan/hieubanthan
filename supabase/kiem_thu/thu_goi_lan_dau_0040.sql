-- 0040 CRO-1: gói "Lần đầu" 59.000 ₫ / 59 Sao — chỉ bán khi công tắc bật VÀ tài khoản chưa từng nạp. Mỗi dòng "kt" SAI là lỗi.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
grant all on all tables in schema public to authenticated;
delete from cau_hinh where khoa = 'sao.goi_lan_dau.bat';

insert into auth.users (id, email) values
    ('d0000000-0000-0000-0000-0000000000b1', 'ld-moi@x'),
    ('d0000000-0000-0000-0000-0000000000b2', 'ld-cu@x')
on conflict do nothing;

select pg_temp.kt('quyền: anon hỏi được', has_function_privilege('anon', 'goi_lan_dau_duoc_mua()', 'execute'), true);
select pg_temp.kt('bảng: 59.000 ₫ / 59 Sao, bat = false', (select gia_vnd || '/' || sao || '/' || bat from goi_sao where ma = 'lan_dau'), '59000/59/false');

-- (1) công tắc TẮT → không bán, không tạo đơn
set role anon;
select pg_temp.kt('tắt: khách không thấy gói', (select count(*) from goi_sao_dang_ban() where ma = 'lan_dau')::int, 0);
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000b1',false);
select pg_temp.kt('tắt: tạo đơn bị từ chối', tao_don_nap('lan_dau', 'gia')->>'ket_qua', 'goi_khong_hop_le');
reset role;

-- (2) bật: khách thấy, tài khoản mới tạo đơn được, giá lấy từ bảng
insert into cau_hinh (khoa, gia_tri) values ('sao.goi_lan_dau.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role anon;
select pg_temp.kt('bật: khách thấy gói', (select count(*) from goi_sao_dang_ban() where ma = 'lan_dau')::int, 1);
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000b1',false);
select pg_temp.kt('bật: tài khoản mới còn mua được', goi_lan_dau_duoc_mua(), true);
select tao_don_nap('lan_dau', 'gia') as t1 \gset
select pg_temp.kt('đơn Lần đầu lấy giá từ bảng', (:'t1'::jsonb->>'so_tien')::int || '/' || (:'t1'::jsonb->>'sao'), '59000/59');
select (:'t1'::jsonb->>'ma_don')::bigint as d1 \gset
reset role; set role service_role;
select pg_temp.kt('trả đúng 59.000 ₫ → cộng Sao', nap_sao_tu_cong(:d1, 59000, 'gia', 'LD1')->>'ket_qua', 'da_nap');
reset role;

-- (3) đã nạp → không còn thấy / không tạo đơn được nữa
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000b1',false);
select pg_temp.kt('đã nạp: hết quyền mua', goi_lan_dau_duoc_mua(), false);
select pg_temp.kt('đã nạp: không thấy gói', (select count(*) from goi_sao_dang_ban() where ma = 'lan_dau')::int, 0);
select pg_temp.kt('đã nạp: tạo đơn lần hai bị từ chối', tao_don_nap('lan_dau', 'gia')->>'ket_qua', 'goi_khong_hop_le');
select pg_temp.kt('đã nạp: gói thường vẫn mua được', tao_don_nap((select ma from goi_sao where bat and ma <> 'lan_dau' order by thu_tu limit 1), 'gia')->>'ket_qua', 'da_tao');
reset role;

-- (4) người từng nạp gói khác (trước khi có gói) → không được mua
insert into don_nap (user_id, goi, so_tien, sao, cong, trang_thai)
select 'd0000000-0000-0000-0000-0000000000b2', ma, gia_vnd, sao, 'gia', 'da_tra' from goi_sao where ma <> 'lan_dau' order by thu_tu limit 1;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000b2',false);
select pg_temp.kt('từng nạp gói khác: không mua được', goi_lan_dau_duoc_mua(), false);
reset role;

-- (5) bật cột bat bằng tay vẫn không lách được điều kiện "lần đầu"
update goi_sao set bat = true where ma = 'lan_dau';
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000b2',false);
select pg_temp.kt('bat = true không lách được', (select count(*) from goi_sao_dang_ban() where ma = 'lan_dau')::int, 0);
reset role;
update goi_sao set bat = false where ma = 'lan_dau';
delete from cau_hinh where khoa = 'sao.goi_lan_dau.bat';
