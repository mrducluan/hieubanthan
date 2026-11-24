-- 0041 QC-G: bảng google_don chỉ máy chủ (service_role) đọc / ghi; định dạng mã lượt bấm bị kiểm; xoá đơn → xoá theo.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
select pg_temp.kt('RLS bật', (select relrowsecurity from pg_class where relname = 'google_don'), true);
-- (các tệp thử trước có "grant all … to authenticated" → không kiểm quyền bảng; kiểm RLS: không policy = không đọc / ghi được)
select pg_temp.kt('không có policy nào', (select count(*) from pg_policies where tablename = 'google_don'), 0::bigint);
select pg_temp.kt('service_role ghi được', has_table_privilege('service_role', 'google_don', 'insert'), true);

insert into auth.users (id, email) values ('e0000000-0000-0000-0000-0000000000c2', 'google@x') on conflict do nothing;
set role authenticated;
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000c2', false);
select (tao_don_nap('thu', 'gia')->>'ma_don')::bigint as dm \gset
reset role;

set role service_role;
insert into google_don (ma_don, gclid) values (:dm, 'Cj0KCQiA_abc-123XYZ');
select pg_temp.kt('service_role đọc được', (select count(*) from google_don where ma_don = :dm), 1::bigint);
reset role;
grant all on google_don to anon, authenticated;   -- dù lỡ có quyền bảng, RLS vẫn chặn
set role anon;
select pg_temp.kt('anon không thấy dòng nào', (select count(*) from google_don), 0::bigint);
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000c2', false);
select pg_temp.kt('chủ đơn cũng không thấy', (select count(*) from google_don), 0::bigint);
do $$ begin
    begin
        insert into google_don (ma_don, gclid) values ((select max(ma_don) from don_nap), 'Cj0KCQiA_abc-123XYZ');
        raise exception 'SAI: authenticated ghi được google_don';
    exception when insufficient_privilege then null;
    end;
end $$;
reset role;
revoke all on google_don from anon, authenticated;
set role service_role;
do $$ begin
    begin
        insert into google_don (ma_don, gclid) values ((select max(ma_don) from don_nap), 'co dau cach <script>');
        raise exception 'SAI: gclid sai định dạng vẫn ghi được';
    exception when check_violation or unique_violation then null;
    end;
end $$;
do $$ begin
    begin
        insert into google_don (ma_don) values ((select max(ma_don) from don_nap));
        raise exception 'SAI: dòng không có mã nào vẫn ghi được';
    exception when check_violation or unique_violation then null;
    end;
end $$;
reset role;
delete from don_nap where ma_don = :dm;
select pg_temp.kt('xoá đơn → xoá dòng google', (select count(*) from google_don where ma_don = :dm), 0::bigint);
