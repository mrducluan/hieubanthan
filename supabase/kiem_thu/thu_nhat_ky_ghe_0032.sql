-- 0032 KV-THANG: nhật ký ngày ghé + du_9_nhip. Mỗi dòng "kt" SAI là lỗi ngay. Chạy sau thu_chuoi_huy_hieu_0030.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
grant all on all tables in schema public to authenticated;
delete from cau_hinh where khoa like 'sao.%';

insert into auth.users (id, email) values
    ('d0000000-0000-0000-0000-0000000000f1', 'nk-a@x'),
    ('d0000000-0000-0000-0000-0000000000f2', 'nk-b@x')
on conflict do nothing;
\set A '''d0000000-0000-0000-0000-0000000000f1'''
\set B '''d0000000-0000-0000-0000-0000000000f2'''
select (now() at time zone 'Asia/Ho_Chi_Minh')::date as hom_nay \gset
select date_trunc('month', :'hom_nay'::date)::date as dau_thang \gset
delete from chuoi_ngay where user_id in (:A, :B);
delete from nhat_ky_ghe where user_id in (:A, :B);

-- ================================================================ (0) quyền + chữ ký hàm
select pg_temp.kt('diem_danh() cũ đã bỏ', to_regprocedure('public.diem_danh()') is null, true);
select pg_temp.kt('diem_danh(integer,text) có', to_regprocedure('public.diem_danh(integer,text)') is not null, true);
select pg_temp.kt('anon không gọi diem_danh', has_function_privilege('anon', 'diem_danh(integer,text)', 'execute'), false);
select pg_temp.kt('authenticated gọi diem_danh', has_function_privilege('authenticated', 'diem_danh(integer,text)', 'execute'), true);
select pg_temp.kt('RLS bật nhat_ky_ghe', (select relrowsecurity from pg_class where oid = 'public.nhat_ky_ghe'::regclass), true);

-- ================================================================ (1) ghi nhật ký qua diem_danh
set role authenticated; select set_config('request.jwt.claim.sub', :A, false);
select diem_danh(5, null) as d0 \gset
select pg_temp.kt('chuỗi vẫn như 0030: ngày đầu = 1', (:'d0'::jsonb->>'chuoi')::int, 1);
select pg_temp.kt('trả ngày ghé tháng này = [hôm nay]', :'d0'::jsonb->'ngay_ghe_thang', jsonb_build_array(extract(day from :'hom_nay'::date)::int));
select pg_temp.kt('tháng trước rỗng: so_ngay 0', (:'d0'::jsonb->'thang_truoc'->>'so_ngay')::int, 0);
select pg_temp.kt('tháng trước rỗng: ngay []', :'d0'::jsonb->'thang_truoc'->'ngay', '[]'::jsonb);
-- Gọi lại trong ngày với lá: không thêm dòng, bổ sung la; số giữ.
select diem_danh(null, 'viec') as d1 \gset
select pg_temp.kt('gọi lại: moi=false', (:'d1'::jsonb->>'moi')::boolean, false);
-- Gọi không tham số (web cũ / DB vừa chạy): vẫn chạy.
select pg_temp.kt('gọi không tham số được', (diem_danh()->>'chuoi')::int, 1);
-- Số ngoài 1–9 / lá lạ → bỏ qua, không lỗi, không ghi đè.
select pg_temp.kt('số lạ không lỗi', (diem_danh(42, 'xxx')->>'chuoi')::int, 1);
-- Chính mình đọc được qua RLS, người khác không thấy.
select pg_temp.kt('A đọc được dòng của mình', (select count(*) from nhat_ky_ghe), 1::bigint);
select pg_temp.kt('dòng hôm nay: so 5, la viec', (select so::text || '/' || la from nhat_ky_ghe where ngay = :'hom_nay'::date), '5/viec');
\set ON_ERROR_STOP 0
insert into nhat_ky_ghe (user_id, ngay, so) values (:A, :'hom_nay'::date - 1, 3);
update nhat_ky_ghe set so = 9;
delete from nhat_ky_ghe;
\set ON_ERROR_STOP 1
reset role;
select pg_temp.kt('không ghi thẳng được (RLS, 1 dòng, so vẫn 5)', (select count(*)::text || '/' || max(so) from nhat_ky_ghe where user_id = :A), '1/5');
set role authenticated; select set_config('request.jwt.claim.sub', :B, false);
select pg_temp.kt('B không thấy dòng của A', (select count(*) from nhat_ky_ghe), 0::bigint);
reset role;

-- ================================================================ (2) tháng trước + du_9_nhip
-- Gieo tháng trước cho A: 12 ngày ghé, đủ 9 số, 4 lá; tháng trước nữa: 2 ngày (dưới ngưỡng).
insert into nhat_ky_ghe (user_id, ngay, so, la)
select :A, (:'dau_thang'::date - interval '1 month')::date + i, (i % 9) + 1, case when i < 4 then 'gio' end
from generate_series(0, 11) i;
insert into nhat_ky_ghe (user_id, ngay, so) values (:A, (:'dau_thang'::date - interval '2 month')::date, 1),
                                                  (:A, (:'dau_thang'::date - interval '2 month')::date + 1, 2);
set role authenticated; select set_config('request.jwt.claim.sub', :A, false);
select diem_danh() as d2 \gset
select pg_temp.kt('tháng trước: so_ngay 12', (:'d2'::jsonb->'thang_truoc'->>'so_ngay')::int, 12);
select pg_temp.kt('tháng trước: so_la 4', (:'d2'::jsonb->'thang_truoc'->>'so_la')::int, 4);
select pg_temp.kt('tháng trước: so_khac 9', (:'d2'::jsonb->'thang_truoc'->>'so_khac')::int, 9);
select pg_temp.kt('tháng trước: du_9', (:'d2'::jsonb->'thang_truoc'->>'du_9')::boolean, true);
select pg_temp.kt('tháng trước: ngay 1..12', :'d2'::jsonb->'thang_truoc'->'ngay', (select jsonb_agg(i) from generate_series(1, 12) i));
select pg_temp.kt('tháng trước: đúng tháng', (:'d2'::jsonb->'thang_truoc'->>'thang')::int, extract(month from :'dau_thang'::date - interval '1 month')::int);
select pg_temp.kt('huy hiệu du_9_nhip đạt', (select (h->>'dat')::boolean from jsonb_array_elements(huy_hieu_cua_toi()) h where h->>'ma' = 'du_9_nhip'), true);
select pg_temp.kt('du_9_nhip luc = ngày ghé cuối tháng đó', (select (h->>'luc')::date from jsonb_array_elements(huy_hieu_cua_toi()) h where h->>'ma' = 'du_9_nhip'),
    (:'dau_thang'::date - interval '1 month')::date + 11);
select pg_temp.kt('huy hiệu cũ vẫn đủ (8 mã)', jsonb_array_length(huy_hieu_cua_toi()), 8);
reset role;
-- B chỉ có 8 số khác nhau → chưa đạt.
insert into nhat_ky_ghe (user_id, ngay, so) select :B, (:'dau_thang'::date - interval '1 month')::date + i, (i % 8) + 1 from generate_series(0, 15) i;
set role authenticated; select set_config('request.jwt.claim.sub', :B, false);
select pg_temp.kt('8 số khác nhau: chưa du_9_nhip', (select (h->>'dat')::boolean from jsonb_array_elements(huy_hieu_cua_toi()) h where h->>'ma' = 'du_9_nhip'), false);
reset role;

-- ================================================================ (3) dọn > 400 ngày
insert into nhat_ky_ghe (user_id, ngay, so) values (:A, :'hom_nay'::date - 401, 1), (:A, :'hom_nay'::date - 400, 2);
set role authenticated; select set_config('request.jwt.claim.sub', :A, false);
select diem_danh();
reset role;
select pg_temp.kt('dòng > 400 ngày bị dọn, dòng = 400 giữ', (select count(*) from nhat_ky_ghe where user_id = :A and ngay <= :'hom_nay'::date - 400), 1::bigint);
select 'nhật ký ngày ghé (0032): OK' t;
