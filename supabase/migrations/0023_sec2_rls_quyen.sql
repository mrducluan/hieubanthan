-- SEC-2 (rà bảo mật 2026-10-23, docs/BAO-MAT.md mục SEC-2). Chỉ siết quyền — không đổi cột, không đổi dữ liệu.
-- (1) Bảy bảng KB thần số đời đầu (0001, 0002) CHƯA bật RLS: Supabase mặc định cấp anon/authenticated mọi quyền trên
--     bảng mới ở schema public → ai có khoá anon công khai cũng xoá / sửa được nghĩa số qua REST. Bật RLS, chỉ cho ĐỌC
--     (engine đọc bằng khoá anon — giữ nguyên), thu quyền ghi. Bản gốc KB vẫn là JSON trong git.
-- (2) don_nhac_viec() (0018) chỉ revoke khỏi public → anon/authenticated vẫn gọi được qua quyền mặc định của Supabase.
-- (3) Thu TRUNCATE của anon/authenticated trên mọi bảng public (TRUNCATE bỏ qua RLS; PostgREST không có lệnh này,
--     đây là lớp phòng thủ thêm).
-- (4) dang_ky_push(): ai đăng nhập mà biết endpoint của người khác không chiếm được đăng ký (đè user_id + khoá mã hoá
--     → người kia mất nhắc). Chỉ chuyển chủ khi cùng tài khoản hoặc cùng cặp khoá trình duyệt (= đúng trình duyệt đó).
-- (5) ky_uc_nguoi_dung.ghi_chu: quy tắc (b) chỉ cho lưu MÃ câu → cấm chữ tự do (NOT VALID: không quét dòng cũ).

do $$ declare t text; begin
    foreach t in array array['sources', 'schools', 'thanso_so_meanings', 'thanso_vi_tri',
                             'thanso_dinh_cao', 'thanso_thu_thach', 'thanso_nam_ca_nhan'] loop
        if to_regclass('public.' || t) is null then continue; end if;
        execute format('alter table public.%I enable row level security', t);
        execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
        execute format('drop policy if exists %I on public.%I', 'sec2_doc_' || t, t);
        execute format('create policy %I on public.%I for select to anon, authenticated using (true)', 'sec2_doc_' || t, t);
    end loop;
end $$;

revoke all on function public.don_nhac_viec() from public, anon, authenticated;
grant execute on function public.don_nhac_viec() to service_role;

revoke truncate on all tables in schema public from anon, authenticated;

create or replace function dang_ky_push(p_endpoint text, p_p256dh text, p_auth text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
    if uid is null then raise exception 'push: can dang nhap' using errcode = 'insufficient_privilege'; end if;
    insert into public.push_dang_ky (user_id, endpoint, p256dh, auth, tao_luc)
    values (uid, p_endpoint, p_p256dh, p_auth, clock_timestamp())
    on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        tao_luc = excluded.tao_luc, so_lan_loi = 0
        where public.push_dang_ky.user_id = excluded.user_id
           or (public.push_dang_ky.p256dh = excluded.p256dh and public.push_dang_ky.auth = excluded.auth);
    -- ≤ 5 thiết bị: bỏ đăng ký cũ nhất.
    delete from public.push_dang_ky where id in (
        select id from public.push_dang_ky where user_id = uid order by tao_luc desc offset 5);
    return true;
end; $$;
revoke all on function dang_ky_push(text, text, text) from public, anon;
grant execute on function dang_ky_push(text, text, text) to authenticated;

alter table public.ky_uc_nguoi_dung drop constraint if exists ky_uc_chi_ma;
alter table public.ky_uc_nguoi_dung add constraint ky_uc_chi_ma check (ghi_chu is null) not valid;
