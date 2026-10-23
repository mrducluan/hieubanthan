-- SEC-2 (migration 0023). Chạy SAU thu_sao.sql (đã grant all bảng cho anon/authenticated như mặc định Supabase — RLS
-- vẫn phải chặn) và thu_push_0019.sql.
\set K '''BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4'''
\set S '''BTBZMqHH6r4Tts7J_aSIgg'''
\set S2 '''ZZZZMqHH6r4Tts7J_aSIgg'''
grant all on all tables in schema public to anon, authenticated;
select 'bảng KB chưa RLS (phải 0)' t, count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
insert into sources (id, ten) values ('sec2_thu', 'nguồn thử SEC-2') on conflict (id) do nothing;
set role anon;
select 'anon vẫn ĐỌC được KB' t, count(*) >= 1 from sources where id = 'sec2_thu';
delete from sources where id = 'sec2_thu';
update sources set ten = 'bị sửa' where id = 'sec2_thu';
reset role;
select '→ anon xoá/sửa KB không tác dụng (RLS)' t, ten from sources where id = 'sec2_thu';
delete from sources where id = 'sec2_thu';
set role anon;
\set ON_ERROR_STOP 0
select 'anon gọi don_nhac_viec (phải lỗi permission denied)' t, don_nhac_viec();
\set ON_ERROR_STOP 1
reset role;

-- B biết endpoint Chrome của A nhưng không có khoá trình duyệt → không chiếm được.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
set role authenticated;
select 'A đăng ký thiết bị mới' t, dang_ky_push('https://fcm.googleapis.com/fcm/send/sec2', :K, :S);
reset role;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
set role authenticated;
select 'B đè bằng khoá khác' t, dang_ky_push('https://fcm.googleapis.com/fcm/send/sec2', :K, :S2);
reset role;
select '→ thiết bị vẫn của A, khoá cũ' t, user_id::text || '/' || auth from push_dang_ky
    where endpoint = 'https://fcm.googleapis.com/fcm/send/sec2';
set role authenticated;
select 'B đăng nhập trên chính trình duyệt đó (cùng khoá)' t, dang_ky_push('https://fcm.googleapis.com/fcm/send/sec2', :K, :S);
reset role;
select '→ chuyển sang B' t, user_id::text from push_dang_ky where endpoint = 'https://fcm.googleapis.com/fcm/send/sec2';
select 'sec2 (0023): OK' t;
