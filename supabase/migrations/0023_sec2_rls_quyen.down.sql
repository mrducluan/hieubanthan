-- Rollback 0023: trả quyền như trước SEC-2 (mở lại lỗ hổng — chỉ dùng khi cần gỡ khẩn).
alter table public.ky_uc_nguoi_dung drop constraint if exists ky_uc_chi_ma;

create or replace function dang_ky_push(p_endpoint text, p_p256dh text, p_auth text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
    if uid is null then raise exception 'push: can dang nhap' using errcode = 'insufficient_privilege'; end if;
    insert into public.push_dang_ky (user_id, endpoint, p256dh, auth, tao_luc)
    values (uid, p_endpoint, p_p256dh, p_auth, clock_timestamp())
    on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        tao_luc = excluded.tao_luc, so_lan_loi = 0;
    delete from public.push_dang_ky where id in (
        select id from public.push_dang_ky where user_id = uid order by tao_luc desc offset 5);
    return true;
end; $$;
revoke all on function dang_ky_push(text, text, text) from public, anon;
grant execute on function dang_ky_push(text, text, text) to authenticated;

grant execute on function public.don_nhac_viec() to anon, authenticated;
-- TRUNCATE: không cấp lại (Supabase không cần cho anon/authenticated).

do $$ declare t text; begin
    foreach t in array array['sources', 'schools', 'thanso_so_meanings', 'thanso_vi_tri',
                             'thanso_dinh_cao', 'thanso_thu_thach', 'thanso_nam_ca_nhan'] loop
        if to_regclass('public.' || t) is null then continue; end if;
        execute format('drop policy if exists %I on public.%I', 'sec2_doc_' || t, t);
        execute format('alter table public.%I disable row level security', t);
        execute format('grant insert, update, delete on public.%I to anon, authenticated', t);
    end loop;
end $$;
