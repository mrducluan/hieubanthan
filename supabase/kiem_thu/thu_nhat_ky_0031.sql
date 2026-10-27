-- 0031 — nhật ký hỏi đáp chỉ ghi bằng khoá riêng. Chạy cuối chay.sh.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;

\set KHOA '''khoa-nhat-ky-kiem-thu-0123456789abcdef'''
\set TS '''{"cau_hoi_da_loc":"Số chủ đạo 7 hợp nghề gì?","linh_vuc":"cong_viec","y_dinh":"nghe","doi_tuong":"ban_than","xu_ly":"tra_loi","do_phu":"du","khoi":["chan_dung"],"can_them":[],"che_do":"mau","loi_kiem_tra":[],"cau_tra_loi":"Hợp việc cần chiều sâu.","engine_version":"0.1.5"}'''
\set HH '''{"mo_dun":"tuvi","cau_hoi_da_loc":"Cung Mệnh nói gì?","loai":"cung","xu_ly":"tra_loi","che_do":"mau","do_phu":"du","co_du_lieu_sinh":true,"khoi":["cung"],"can_them":[],"loi_kiem_tra":[],"cau_tra_loi":null,"engine_version":"0.1.5"}'''

select pg_temp.kt('anon không còn chính sách INSERT (thần số)',
    exists (select 1 from pg_policies where tablename = 'thanso_hoi_nhat_ky' and cmd = 'INSERT' and 'anon' = any(roles)), false);
select pg_temp.kt('anon không còn chính sách INSERT (huyền học)',
    exists (select 1 from pg_policies where tablename = 'huyenhoc_hoi_nhat_ky' and cmd = 'INSERT' and 'anon' = any(roles)), false);
-- (thu_sec2_0023 cấp lại mọi quyền bảng cho anon để giả lập mặc định Supabase → lớp chặn thật là RLS không có chính sách ghi;
--  phép thử ghi thẳng bảng bên dưới + đếm dòng kiểm điều đó.)
select pg_temp.kt('RLS bật trên bảng nhật ký', (select relrowsecurity from pg_class where oid = 'public.thanso_hoi_nhat_ky'::regclass), true);
select pg_temp.kt('anon không đặt khoá', has_function_privilege('anon', 'dat_khoa_nhat_ky(text)', 'execute'), false);
select pg_temp.kt('authenticated không đặt khoá', has_function_privilege('authenticated', 'dat_khoa_nhat_ky(text)', 'execute'), false);
select pg_temp.kt('anon gọi được hàm ghi', has_function_privilege('anon', 'ghi_nhat_ky_hoi(text,jsonb,text)', 'execute'), true);

select count(*) as truoc_ts from thanso_hoi_nhat_ky \gset
select count(*) as truoc_hh from huyenhoc_hoi_nhat_ky \gset

-- Chưa đặt khoá → không ghi được, kể cả khoá "đúng".
delete from khoa_nhat_ky;
set role anon;
select pg_temp.kt('chưa đặt khoá → false', ghi_nhat_ky_hoi('thanso_hoi_nhat_ky', :TS::jsonb, :KHOA), false);
reset role;

-- Khoá quá ngắn bị từ chối khi đặt.
\set ON_ERROR_STOP 0
select dat_khoa_nhat_ky('ngan');
\set ON_ERROR_STOP 1
select pg_temp.kt('khoá ngắn không được đặt', (select count(*) from khoa_nhat_ky), 0::bigint);

select pg_temp.kt('đặt khoá', dat_khoa_nhat_ky(:KHOA), 'da_dat');
select pg_temp.kt('DB chỉ giữ mã băm 32 byte', (select length(khoa_bam) from khoa_nhat_ky), 32);
select pg_temp.kt('không lưu khoá dạng chữ', (select position(convert_to(:KHOA, 'UTF8') in khoa_bam) from khoa_nhat_ky), 0);
-- Supabase thật: anon bị thu quyền bảng (permission denied); bộ thử chay.sh cấp lại mọi quyền (thu_sec2_0023) → RLS trả 0 dòng.
create or replace function pg_temp.anon_doc_khoa() returns bigint language plpgsql as $$
begin
    return (select count(*) from public.khoa_nhat_ky);
exception when insufficient_privilege then return 0;
end $$;
set role anon;
select pg_temp.kt('anon không đọc được bảng khoá', pg_temp.anon_doc_khoa(), 0::bigint);
reset role;

set role anon;
\set ON_ERROR_STOP 0
insert into thanso_hoi_nhat_ky (cau_hoi_da_loc, linh_vuc, y_dinh, doi_tuong, xu_ly, do_phu, che_do, cau_tra_loi, engine_version)
    values ('rác', 'x', 'x', 'x', 'x', 'x', 'x', 'rác', 'x');
\set ON_ERROR_STOP 1
select pg_temp.kt('khoá sai → false', ghi_nhat_ky_hoi('thanso_hoi_nhat_ky', :TS::jsonb, 'sai-sai-sai-sai-sai-sai-sai-sai-sai-sai'), false);
select pg_temp.kt('không khoá → false', ghi_nhat_ky_hoi('thanso_hoi_nhat_ky', :TS::jsonb, null), false);
select pg_temp.kt('bảng lạ → false', ghi_nhat_ky_hoi('so_cai_sao', '{"so_luong":999}'::jsonb, :KHOA), false);
select pg_temp.kt('bản ghi không phải object → false', ghi_nhat_ky_hoi('thanso_hoi_nhat_ky', '[1,2]'::jsonb, :KHOA), false);
select pg_temp.kt('khoá đúng ghi thần số', ghi_nhat_ky_hoi('thanso_hoi_nhat_ky', :TS::jsonb, :KHOA), true);
select pg_temp.kt('khoá đúng ghi huyền học', ghi_nhat_ky_hoi('huyenhoc_hoi_nhat_ky', :HH::jsonb, :KHOA), true);
-- Trường lạ (id, created_at giả, user_id) bị bỏ qua — DB tự đặt id / created_at.
select pg_temp.kt('bỏ qua trường lạ', ghi_nhat_ky_hoi('thanso_hoi_nhat_ky',
    (:TS::jsonb || '{"id": 999999, "created_at": "2000-01-01T00:00:00Z", "user_id": "x"}'::jsonb), :KHOA), true);
reset role;

select pg_temp.kt('thần số thêm đúng 2 dòng (insert rác thẳng bảng bị chặn)', (select count(*) from thanso_hoi_nhat_ky) - :truoc_ts, 2::bigint);
select pg_temp.kt('huyền học thêm 1 dòng', (select count(*) from huyenhoc_hoi_nhat_ky) - :truoc_hh, 1::bigint);
select pg_temp.kt('id không lấy từ bản ghi', exists (select 1 from thanso_hoi_nhat_ky where id = 999999), false);
select pg_temp.kt('created_at do DB đặt', (select max(created_at) > now() - interval '1 minute' from thanso_hoi_nhat_ky), true);
select pg_temp.kt('câu trả lời rỗng của huyền học giữ null',
    (select cau_tra_loi is null from huyenhoc_hoi_nhat_ky order by id desc limit 1), true);

-- Đổi khoá: khoá cũ hết hiệu lực.
select pg_temp.kt('đổi khoá', dat_khoa_nhat_ky('khoa-moi-0123456789abcdef0123456789abcdef'), 'da_dat');
set role anon;
select pg_temp.kt('khoá cũ hết hiệu lực', ghi_nhat_ky_hoi('thanso_hoi_nhat_ky', :TS::jsonb, :KHOA), false);
reset role;
select 'nhật ký khoá riêng (0031): OK' t;
