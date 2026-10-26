#!/usr/bin/env bash
# Dựng "Supabase thu nhỏ" cho e2e-that: Postgres (có sẵn, biến libpq PGHOST/PGUSER/PGPASSWORD) + GoTrue (Auth) +
# PostgREST + SMTP hứng thư + cổng 54321. Chạy migration THẬT của dự án (supabase/migrations) rồi bật công tắc Sao.
# Không Docker: tải 2 tệp chạy chính chủ (GitHub release, ghim phiên bản) vào $SB_THU (mặc định /tmp/sb-thu).
set -euo pipefail
GOTRUE_V=v2.170.0
PGRST_V=v12.2.3
SB=${SB_THU:-/tmp/sb-thu}
DB=${SB_THU_DB:-sb_thu}
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$SB/mail"
export SB_THU_MAIL="$SB/mail"
cd "$SB"
[ -x auth ] || { curl -fsSL -o auth.tgz "https://github.com/supabase/auth/releases/download/$GOTRUE_V/auth-$GOTRUE_V-x86.tar.gz" && tar xzf auth.tgz && rm auth.tgz; }
[ -x postgrest ] || { curl -fsSL -o pg.tar.xz "https://github.com/PostgREST/postgrest/releases/download/$PGRST_V/postgrest-$PGRST_V-linux-static-x64.tar.xz" && tar xf pg.tar.xz && rm pg.tar.xz; }
JWT=$(node "$HERE/khoa.mjs" jwt)
PGH=${PGHOST:-127.0.0.1}; PGP=${PGPORT:-5432}

export PGOPTIONS="-c client_min_messages=warning"
psql -d postgres -q -v ON_ERROR_STOP=1 <<SQL
drop database if exists $DB with (force);
create database $DB;
do \$\$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator login password 'thu_pw' noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin login password 'thu_pw' createrole; end if;
end \$\$;
alter role service_role bypassrls;
alter role authenticator login password 'thu_pw';
alter role supabase_auth_admin login password 'thu_pw';
grant anon, authenticated, service_role to authenticator;
\c $DB
create schema auth authorization supabase_auth_admin;
grant create on database $DB to supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth;
create extension if not exists pgcrypto;
SQL

cat > gotrue.env <<ENV
GOTRUE_API_HOST=127.0.0.1
PORT=9999
API_EXTERNAL_URL=http://localhost:54321/auth/v1
GOTRUE_DB_DRIVER=postgres
DATABASE_URL="postgres://supabase_auth_admin:thu_pw@$PGH:$PGP/$DB?search_path=auth&sslmode=disable"
GOTRUE_SITE_URL=http://localhost:3000
GOTRUE_URI_ALLOW_LIST=http://localhost:3000/**
GOTRUE_JWT_SECRET=$JWT
GOTRUE_JWT_EXP=3600
GOTRUE_JWT_AUD=authenticated
GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated
GOTRUE_JWT_ADMIN_ROLES=service_role
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_MAILER_OTP_EXP=3600
GOTRUE_SMTP_HOST=127.0.0.1
GOTRUE_SMTP_PORT=2525
GOTRUE_SMTP_USER=thu
GOTRUE_SMTP_PASS=thu
GOTRUE_SMTP_ADMIN_EMAIL=noreply@thu.local
GOTRUE_RATE_LIMIT_EMAIL_SENT=1000
GOTRUE_RATE_LIMIT_OTP=1000
GOTRUE_LOG_LEVEL=warn
ENV
set -a; . ./gotrue.env; set +a
./auth migrate > gotrue-migrate.log 2>&1 || { tail -5 gotrue-migrate.log >&2; exit 1; }

# Quyền mặc định như Supabase: bảng public cấp cho anon/authenticated/service_role, RLS quyết định thấy gì.
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
SQL
for f in $(ls "$ROOT"/supabase/migrations/*.sql | grep -v '\.down\.sql$' | sort); do psql -d "$DB" -q -v ON_ERROR_STOP=1 -1 -f "$f" >/dev/null; done
# Công tắc Sao BẬT (mặc định production là tắt) + lượt miễn phí nhỏ để test nhanh.
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
insert into cau_hinh (khoa, gia_tri) values
  ('luan_giai.thu_sao', 'true'), ('sao.hoi.thu', 'true'), ('sao.hoi.mien_phi_khach', '2'), ('sao.hoi.mien_phi_tk', '2'),
  ('sao.nhiem_vu.bat', 'true'),
  -- Fixture: giá báo cáo 10 để chuỗi "10 Sao chào mừng → tự mở báo cáo" chạy được; mặc định production là 29
  -- (chủ dự án chốt 26/10/2026) — khi đó chào mừng KHÔNG đủ, người dùng nạp gói Khởi đầu 19 Sao (kiểm ở e2e/nap-dau.spec.ts).
  ('luan_giai.gia_sao', '10')
on conflict (khoa) do update set gia_tri = excluded.gia_tri;
SQL

cat > pgrst.conf <<CONF
db-uri = "postgres://authenticator:thu_pw@$PGH:$PGP/$DB"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$JWT"
server-host = "127.0.0.1"
server-port = 3002
CONF

nohup python3 "$HERE/smtp.py" > smtp.log 2>&1 &
nohup ./auth serve > gotrue.log 2>&1 &
nohup ./postgrest pgrst.conf > pgrst.log 2>&1 &
nohup node "$HERE/proxy.mjs" > proxy.log 2>&1 &
for i in $(seq 1 60); do
  curl -sf http://localhost:54321/auth/v1/health >/dev/null && curl -sf "http://localhost:54321/rest/v1/" -H "apikey: $(node "$HERE/khoa.mjs" anon)" >/dev/null && { echo "Supabase thu nhỏ sẵn sàng (DB $DB)"; exit 0; }
  sleep 0.5
done
echo "Supabase thu nhỏ KHÔNG lên được" >&2; tail -20 gotrue.log pgrst.log proxy.log >&2; exit 1
