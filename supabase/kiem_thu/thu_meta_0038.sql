-- 0038 META-CAPI: bảng meta_don chỉ máy chủ (service_role) đọc / ghi; định dạng cookie Meta bị kiểm; xoá đơn → xoá theo.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
select pg_temp.kt('RLS bật', (select relrowsecurity from pg_class where relname = 'meta_don'), true);
-- (các tệp thử trước có "grant all … to authenticated" → không kiểm quyền bảng; kiểm RLS: không policy = không đọc / ghi được)
select pg_temp.kt('không có policy nào', (select count(*) from pg_policies where tablename = 'meta_don'), 0::bigint);
select pg_temp.kt('service_role ghi được', has_table_privilege('service_role', 'meta_don', 'insert'), true);

insert into auth.users (id, email) values ('e0000000-0000-0000-0000-0000000000c1', 'meta@x') on conflict do nothing;
set role authenticated;
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000c1', false);
select (tao_don_nap('thu', 'gia')->>'ma_don')::bigint as dm \gset
reset role;

set role service_role;
insert into meta_don (ma_don, fbp, fbc, ip, ua) values (:dm, 'fb.1.1700000000000.123456789', 'fb.1.1700000000000.IwAR0abc_DEF-1', '203.0.113.5', 'Mozilla/5.0');
select pg_temp.kt('service_role đọc được', (select count(*) from meta_don where ma_don = :dm), 1::bigint);
reset role;
grant all on meta_don to anon, authenticated;   -- dù lỡ có quyền bảng, RLS vẫn chặn
set role anon;
select pg_temp.kt('anon không thấy dòng nào', (select count(*) from meta_don), 0::bigint);
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000c1', false);
select pg_temp.kt('chủ đơn cũng không thấy', (select count(*) from meta_don), 0::bigint);
do $$ begin
    begin
        insert into meta_don (ma_don) values ((select max(ma_don) from don_nap));
        raise exception 'SAI: authenticated ghi được meta_don';
    exception when insufficient_privilege then null;
    end;
end $$;
reset role;
revoke all on meta_don from anon, authenticated;
set role service_role;
do $$ begin
    begin
        insert into meta_don (ma_don, fbp) values ((select max(ma_don) from don_nap), 'khong-phai-fbp');
        raise exception 'SAI: fbp sai định dạng vẫn ghi được';
    exception when check_violation or unique_violation then null;
    end;
end $$;
reset role;
delete from don_nap where ma_don = :dm;
select pg_temp.kt('xoá đơn → xoá dòng meta', (select count(*) from meta_don where ma_don = :dm), 0::bigint);
