-- 0037 PAY2S-1: cổng 'pay2s' được nhận ở ràng buộc + ba hàm tạo đơn; cổng lạ vẫn bị từ chối; IPN Pay2S cộng Sao đúng
-- một lần; IPN báo nhầm cổng không cộng. Mỗi dòng "kt" SAI là lỗi ngay.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
grant all on all tables in schema public to authenticated;
insert into auth.users (id, email) values ('e0000000-0000-0000-0000-0000000000b1', 'p2s@x') on conflict do nothing;

select pg_temp.kt('ràng buộc có pay2s', pg_get_constraintdef(oid) like '%pay2s%', true)
from pg_constraint where conname = 'don_nap_cong_check';
select pg_temp.kt('hàm ' || p.proname || ' nhận pay2s', pg_get_functiondef(p.oid) like '%''payos'', ''pay2s'', ''gia''%', true)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('tao_don_nap', 'tao_don_hoi_vien', 'tao_cau_hoi_chuyen_gia');
select pg_temp.kt('đủ ba hàm', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('tao_don_nap', 'tao_don_hoi_vien', 'tao_cau_hoi_chuyen_gia')
      and pg_get_functiondef(p.oid) like '%pay2s%'), 3::bigint);
select pg_temp.kt('quyền giữ nguyên: anon không tạo đơn', has_function_privilege('anon', 'tao_don_nap(text,text)', 'execute'), false);
select pg_temp.kt('quyền giữ nguyên: authenticated tạo đơn', has_function_privilege('authenticated', 'tao_don_nap(text,text)', 'execute'), true);
select pg_temp.kt('hàm vẫn security definer', (select prosecdef from pg_proc where proname = 'tao_don_nap'), true);

set role authenticated;
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000b1', false);
select pg_temp.kt('cổng lạ vẫn bị từ chối', tao_don_nap('thu', 'stripe')->>'ket_qua', 'cong_khong_hop_le');
select (tao_don_nap('thu', 'pay2s')->>'ma_don')::bigint as dp \gset
select pg_temp.kt('đơn pay2s đang chờ', (select cong || '/' || trang_thai from don_nap where ma_don = :dp), 'pay2s/cho');
reset role;

set role service_role;
select pg_temp.kt('IPN báo nhầm cổng', nap_sao_tu_cong(:dp, (select so_tien from don_nap where ma_don = :dp), 'payos', 'p2s:1')->>'ket_qua', 'sai_cong');
select pg_temp.kt('IPN Pay2S cộng Sao', nap_sao_tu_cong(:dp, (select so_tien from don_nap where ma_don = :dp), 'pay2s', 'p2s:1')->>'ket_qua', 'da_nap');
select pg_temp.kt('IPN gửi lại không cộng hai lần',
    nap_sao_tu_cong(:dp, (select so_tien from don_nap where ma_don = :dp), 'pay2s', 'p2s:1')->>'ket_qua' <> 'da_nap', true);
reset role;
select pg_temp.kt('đơn đã trả', (select trang_thai from don_nap where ma_don = :dp), 'da_tra');
select pg_temp.kt('sổ cái đúng một dòng mua', (select count(*) from so_cai_sao where user_id = 'e0000000-0000-0000-0000-0000000000b1' and loai = 'mua'), 1::bigint);
