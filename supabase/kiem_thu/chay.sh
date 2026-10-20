#!/usr/bin/env bash
# Kiểm thử migration trên Postgres thật (giả lập schema auth + vai trò anon/authenticated của Supabase):
#   1) chạy mọi migration 3 vòng liên tiếp (phải chạy lại được),  2) chạy *.down.sql ngược rồi lên lại,
#   3) gọi thử các hàm Sao (thu_sao.sql) và quản trị QT-2 (thu_quan_tri.sql) như người dùng thật.
# Cần: psql + một Postgres ≥ 13 (tạo/xoá một database tạm). Kết nối theo biến libpq chuẩn:
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres ./supabase/kiem_thu/chay.sh
set -euo pipefail
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
cd "$(dirname "$0")/.."
DB="kiem_thu_migration_$$"
psql -d postgres -q -c "create database $DB"
trap 'psql -d postgres -q -c "drop database if exists $DB with (force)"' EXIT
P=(psql -d "$DB" -q -v ON_ERROR_STOP=1)
"${P[@]}" -f kiem_thu/gia_lap_supabase.sql
UP=$(ls migrations/*.sql | grep -v '\.down\.sql$' | sort)
for vong in 1 2 3; do for f in $UP; do "${P[@]}" -1 -f "$f" >/dev/null; done; echo "vòng $vong: OK"; done
for f in $(ls migrations/*.down.sql | sort -r); do "${P[@]}" -1 -f "$f" >/dev/null; done; echo "down: OK"
for f in $UP; do "${P[@]}" -1 -f "$f" >/dev/null; done; echo "lên lại: OK"
psql -d "$DB" -q -At -F ' | ' -f kiem_thu/thu_sao.sql
psql -d "$DB" -q -At -F ' | ' -f kiem_thu/thu_quan_tri.sql
psql -d "$DB" -q -At -F " | " -f kiem_thu/thu_thanh_toan.sql
psql -d "$DB" -q -At -F " | " -f kiem_thu/thu_sao_2.sql
psql -d "$DB" -q -At -F " | " -f kiem_thu/thu_nhiem_vu.sql
psql -d "$DB" -q -At -F " | " -f kiem_thu/thu_thanso_hoc.sql
