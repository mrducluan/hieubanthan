-- 0030 SAO-HH: ngày nghỉ chuỗi miễn phí + huy hiệu thành tựu. Mỗi dòng "kt" SAI là lỗi ngay.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
grant all on all tables in schema public to authenticated;
delete from cau_hinh where khoa like 'sao.%';

-- X: người thử chuỗi + huy hiệu; Y1..Y5: năm người X mời.
insert into auth.users (id, email) values
    ('d0000000-0000-0000-0000-0000000000e1', 'hh-x@x'),
    ('d0000000-0000-0000-0000-0000000000e2', 'hh-y1@x'),
    ('d0000000-0000-0000-0000-0000000000e3', 'hh-y2@x'),
    ('d0000000-0000-0000-0000-0000000000e4', 'hh-y3@x'),
    ('d0000000-0000-0000-0000-0000000000e5', 'hh-y4@x'),
    ('d0000000-0000-0000-0000-0000000000e6', 'hh-y5@x')
on conflict do nothing;
\set X '''d0000000-0000-0000-0000-0000000000e1'''
select (now() at time zone 'Asia/Ho_Chi_Minh')::date as hom_nay \gset

-- ================================================================ (0) quyền
-- 0032 đổi chữ ký thành diem_danh(integer, text) — kiểm đúng bản đang có.
select pg_temp.kt('anon không gọi diem_danh', has_function_privilege('anon',
    coalesce(to_regprocedure('public.diem_danh(integer,text)'), to_regprocedure('public.diem_danh()')), 'execute'), false);
select pg_temp.kt('anon không gọi huy_hieu_cua_toi', has_function_privilege('anon', 'huy_hieu_cua_toi()', 'execute'), false);
select pg_temp.kt('authenticated gọi huy_hieu_cua_toi', has_function_privilege('authenticated', 'huy_hieu_cua_toi()', 'execute'), true);
select pg_temp.kt('cột nghi_cuoi có', exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'chuoi_ngay' and column_name = 'nghi_cuoi'), true);

-- ================================================================ (1) ngày nghỉ chuỗi
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select diem_danh() as d0 \gset
select pg_temp.kt('ngày đầu: chuỗi 1', (:'d0'::jsonb->>'chuoi')::int, 1);
select pg_temp.kt('ngày đầu: chưa nghỉ', (:'d0'::jsonb->>'da_nghi')::boolean, false);
select pg_temp.kt('ngày đầu: tuần này còn ngày nghỉ', (:'d0'::jsonb->>'nghi_con')::boolean, true);
reset role;
-- Bỏ đúng 1 ngày lần đầu (ghé lần cuối hôm kia, chuỗi 4) → chuỗi tiếp 5, ghi nghỉ = hôm qua.
update chuoi_ngay set ngay_cuoi = :'hom_nay'::date - 2, chuoi = 4, dai_nhat = 4 where user_id = :X;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select diem_danh() as d1 \gset
select pg_temp.kt('bỏ 1 ngày lần đầu: chuỗi tiếp 5', (:'d1'::jsonb->>'chuoi')::int, 5);
select pg_temp.kt('bỏ 1 ngày lần đầu: da_nghi', (:'d1'::jsonb->>'da_nghi')::boolean, true);
select pg_temp.kt('bỏ 1 ngày lần đầu: hết ngày nghỉ tuần này', (:'d1'::jsonb->>'nghi_con')::boolean, false);
select pg_temp.kt('bỏ 1 ngày lần đầu: dài nhất 5', (:'d1'::jsonb->>'dai_nhat')::int, 5);
select pg_temp.kt('gọi lại cùng ngày: không cộng, vẫn báo da_nghi', (diem_danh()->>'moi')::boolean || '/' || (diem_danh()->>'da_nghi'), 'false/true');
reset role;
select pg_temp.kt('nghi_cuoi = hôm qua', (select nghi_cuoi from chuoi_ngay where user_id = :X), :'hom_nay'::date - 1);
-- Bỏ 1 ngày LẦN HAI trong 7 ngày (nghỉ gần nhất mới 3 ngày trước) → về 1, không phạt gì khác.
update chuoi_ngay set ngay_cuoi = :'hom_nay'::date - 2, nghi_cuoi = :'hom_nay'::date - 3, chuoi = 5 where user_id = :X;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select diem_danh() as d2 \gset
select pg_temp.kt('bỏ 1 ngày lần hai trong tuần: về 1', (:'d2'::jsonb->>'chuoi')::int, 1);
select pg_temp.kt('bỏ 1 ngày lần hai: không da_nghi', (:'d2'::jsonb->>'da_nghi')::boolean, false);
select pg_temp.kt('bỏ 1 ngày lần hai: dài nhất giữ 5', (:'d2'::jsonb->>'dai_nhat')::int, 5);
reset role;
select pg_temp.kt('nghi_cuoi không đổi khi về 1', (select nghi_cuoi from chuoi_ngay where user_id = :X), :'hom_nay'::date - 3);
-- Bỏ 2 ngày (còn ngày nghỉ) → vẫn về 1.
update chuoi_ngay set ngay_cuoi = :'hom_nay'::date - 3, nghi_cuoi = null, chuoi = 9, dai_nhat = 9 where user_id = :X;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select diem_danh() as d3 \gset
select pg_temp.kt('bỏ 2 ngày: về 1', (:'d3'::jsonb->>'chuoi')::int, 1);
select pg_temp.kt('bỏ 2 ngày: không dùng ngày nghỉ', (:'d3'::jsonb->>'nghi_con')::boolean, true);
select pg_temp.kt('bỏ 2 ngày: dài nhất giữ 9', (:'d3'::jsonb->>'dai_nhat')::int, 9);
reset role;
-- Nghỉ đúng 8 ngày trước (< hôm nay − 7) → lại được nghỉ.
update chuoi_ngay set ngay_cuoi = :'hom_nay'::date - 2, nghi_cuoi = :'hom_nay'::date - 8, chuoi = 2 where user_id = :X;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select pg_temp.kt('nghỉ cách 8 ngày: được nghỉ lại, chuỗi 3', (diem_danh()->>'chuoi')::int, 3);
reset role;
-- Nghỉ đúng 7 ngày trước (= hôm nay − 7, chưa qua 7 ngày) → chưa được nghỉ lại.
update chuoi_ngay set ngay_cuoi = :'hom_nay'::date - 2, nghi_cuoi = :'hom_nay'::date - 7, chuoi = 2 where user_id = :X;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select pg_temp.kt('nghỉ cách 7 ngày: chưa được nghỉ lại, về 1', (diem_danh()->>'chuoi')::int, 1);
reset role;
-- Ghé hôm qua bình thường: nối tiếp, không tiêu ngày nghỉ.
update chuoi_ngay set ngay_cuoi = :'hom_nay'::date - 1, nghi_cuoi = null, chuoi = 3 where user_id = :X;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select diem_danh() as d4 \gset
select pg_temp.kt('ghé hôm qua: chuỗi 4', (:'d4'::jsonb->>'chuoi')::int, 4);
select pg_temp.kt('ghé hôm qua: còn ngày nghỉ', (:'d4'::jsonb->>'nghi_con')::boolean, true);
with u as (update chuoi_ngay set nghi_cuoi = null, chuoi = 999 returning 1)
    select pg_temp.kt('X sửa thẳng chuoi_ngay không tác dụng (RLS)', (select count(*) from u)::int, 0);
reset role;

-- Mốc thưởng vẫn đúng khi đi qua ngày nghỉ: chuỗi 6, bỏ hôm qua, còn nghỉ → 7 = mốc → +2 Sao.
insert into cau_hinh (khoa, gia_tri) values ('sao.chuoi.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
update chuoi_ngay set ngay_cuoi = :'hom_nay'::date - 2, nghi_cuoi = null, chuoi = 6, dai_nhat = 9 where user_id = :X;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select diem_danh() as d5 \gset
select pg_temp.kt('qua ngày nghỉ chạm mốc 7: chuỗi 7', (:'d5'::jsonb->>'chuoi')::int, 7);
select pg_temp.kt('qua ngày nghỉ chạm mốc 7: +2 Sao', (:'d5'::jsonb->>'sao')::int, 2);
select pg_temp.kt('qua ngày nghỉ chạm mốc 7: còn 7 ngày tới mốc sau', (:'d5'::jsonb->>'con_ngay')::int, 7);
select pg_temp.kt('dài nhất vẫn 9', (:'d5'::jsonb->>'dai_nhat')::int, 9);
reset role;
select pg_temp.kt('sổ cái có bút toán chuoi', (select count(*) from so_cai_sao where user_id = :X and loai = 'chuoi')::int, 1);
-- Đi qua ngày nghỉ lên 31 → dài nhất 31 (cho huy hiệu chuoi_30).
update chuoi_ngay set ngay_cuoi = :'hom_nay'::date - 2, nghi_cuoi = :'hom_nay'::date - 20, chuoi = 30, dai_nhat = 30 where user_id = :X;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select diem_danh() as d6 \gset
select pg_temp.kt('chuỗi 31 qua ngày nghỉ', (:'d6'::jsonb->>'chuoi')::int, 31);
select pg_temp.kt('dài nhất 31', (:'d6'::jsonb->>'dai_nhat')::int, 31);
reset role;

-- ================================================================ (2) huy hiệu
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select huy_hieu_cua_toi() as h1 \gset
-- 0032 nối thêm du_9_nhip ở cuối — 7 mã của 0030 vẫn đứng đầu, đúng thứ tự.
select pg_temp.kt('7 huy hiệu, đúng thứ tự', (select string_agg(x->>'ma', ',') from (select x from jsonb_array_elements(:'h1'::jsonb) with ordinality as t(x, i) order by i limit 7) s),
    'chuoi_7,chuoi_30,da_luu_ho_so,hoi_3,moi_1,moi_5,hoi_vien');
select pg_temp.kt('chuoi_7 đạt', (select (x->>'dat')::boolean from jsonb_array_elements(:'h1'::jsonb) x where x->>'ma' = 'chuoi_7'), true);
select pg_temp.kt('chuoi_30 đạt', (select (x->>'dat')::boolean from jsonb_array_elements(:'h1'::jsonb) x where x->>'ma' = 'chuoi_30'), true);
select pg_temp.kt('chuoi_30 đạt lúc = ngày thứ 30 của chuỗi (hôm qua)',
    (select (x->>'luc')::date from jsonb_array_elements(:'h1'::jsonb) x where x->>'ma' = 'chuoi_30'), :'hom_nay'::date - 1);
select pg_temp.kt('chưa lưu hồ sơ', (select (x->>'dat')::boolean from jsonb_array_elements(:'h1'::jsonb) x where x->>'ma' = 'da_luu_ho_so'), false);
select pg_temp.kt('chưa hỏi 3 câu', (select (x->>'dat')::boolean from jsonb_array_elements(:'h1'::jsonb) x where x->>'ma' = 'hoi_3'), false);
select pg_temp.kt('chưa mời ai', (select (x->>'dat')::boolean from jsonb_array_elements(:'h1'::jsonb) x where x->>'ma' = 'moi_1'), false);
select pg_temp.kt('hoi_vien là boolean (hàm có hay chưa đều được)',
    (select jsonb_typeof(x->'dat') from jsonb_array_elements(:'h1'::jsonb) x where x->>'ma' = 'hoi_vien'), 'boolean');
reset role;
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc) values (:X, 'X', '1990-01-01', now()) on conflict do nothing;
insert into dem_hoi_tai_khoan (user_id, so) values (:X, 3) on conflict (user_id) do update set so = 3;
insert into gioi_thieu (duoc_moi_id, nguoi_moi_id, ma, thuong_nguoi_moi, tao_luc) values
    ('d0000000-0000-0000-0000-0000000000e2', :X, 'hh', false, now() - interval '5 days'),
    ('d0000000-0000-0000-0000-0000000000e3', :X, 'hh', false, now() - interval '4 days'),
    ('d0000000-0000-0000-0000-0000000000e4', :X, 'hh', false, now() - interval '3 days'),
    ('d0000000-0000-0000-0000-0000000000e5', :X, 'hh', false, now() - interval '2 days')
on conflict do nothing;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select huy_hieu_cua_toi() as h2 \gset
select pg_temp.kt('đã lưu hồ sơ', (select (x->>'dat')::boolean from jsonb_array_elements(:'h2'::jsonb) x where x->>'ma' = 'da_luu_ho_so'), true);
select pg_temp.kt('đã lưu hồ sơ: có ngày', (select (x->>'luc')::date from jsonb_array_elements(:'h2'::jsonb) x where x->>'ma' = 'da_luu_ho_so'), :'hom_nay'::date);
select pg_temp.kt('hỏi 3 câu đạt', (select (x->>'dat')::boolean from jsonb_array_elements(:'h2'::jsonb) x where x->>'ma' = 'hoi_3'), true);
select pg_temp.kt('mời 1 đạt, ngày = lần mời đầu', (select (x->>'luc')::date from jsonb_array_elements(:'h2'::jsonb) x where x->>'ma' = 'moi_1'),
    (:'hom_nay'::date - 5));
select pg_temp.kt('mời 5 chưa đạt (mới 4)', (select (x->>'dat')::boolean from jsonb_array_elements(:'h2'::jsonb) x where x->>'ma' = 'moi_5'), false);
reset role;
insert into gioi_thieu (duoc_moi_id, nguoi_moi_id, ma, thuong_nguoi_moi) values ('d0000000-0000-0000-0000-0000000000e6', :X, 'hh', false) on conflict do nothing;
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select pg_temp.kt('mời 5 đạt', (select (x->>'dat')::boolean from jsonb_array_elements(huy_hieu_cua_toi()) x where x->>'ma' = 'moi_5'), true);
-- Người khác (Y1) không thấy gì của X.
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-0000000000e2', false);
select pg_temp.kt('Y1 không có huy hiệu nào', (select count(*) from jsonb_array_elements(huy_hieu_cua_toi()) x where (x->>'dat')::boolean)::int, 0);
reset role;
-- Hội viên năm (0028) hiệu lực → huy hiệu hoi_vien đạt (dò đúng chữ ký hoi_vien_hieu_luc(uuid)).
reset role;
insert into hoi_vien (user_id, tu_ngay, den_ngay, gia_vnd) values (:X, current_date - 10, current_date + 355, 399000);
set role authenticated; select set_config('request.jwt.claim.sub', :X, false);
select pg_temp.kt('hội viên hiệu lực → huy hiệu hoi_vien đạt',
    (select (x->>'dat')::boolean from jsonb_array_elements(huy_hieu_cua_toi()) x where x->>'ma' = 'hoi_vien'), true);
reset role;
delete from hoi_vien where user_id = :X;
