-- Giả lập phần Supabase mà migration cần: schema auth (users, uid(), jwt()), vai trò anon/authenticated.
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, created_at timestamptz not null default now(), email text,
    last_sign_in_at timestamptz);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end $$;
grant usage on schema public, auth to anon, authenticated;
-- jwt(): claim sub + aal (0010: vai_tro_hieu_luc chỉ trả vai trò khi aal2). Đặt bằng request.jwt.claim.aal.
create or replace function auth.jwt() returns jsonb language sql stable as $$
    select jsonb_build_object('sub', current_setting('request.jwt.claim.sub', true),
                              'aal', coalesce(nullif(current_setting('request.jwt.claim.aal', true), ''), 'aal1')) $$;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated;
-- service_role của Supabase: bỏ qua RLS + có mọi quyền trên bảng public (máy chủ web dùng cho webhook thanh toán).
alter role service_role bypassrls;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
grant usage on schema public to service_role;
