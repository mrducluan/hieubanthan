#!/usr/bin/env bash
# Thử trọn vòng sao lưu → khôi phục trên Postgres thử (CI job supabase): DB nguồn có mọi migration + dữ liệu mẫu (thu_sao,
# thu_nhat_ky_0031) → sao-luu.sh → DB đích trống (chỉ giả lập Supabase) → khoi-phuc.sh (đếm dòng từng bảng phải khớp) →
# kiểm RLS + quyền hàm còn nguyên, chạy lại bị chặn ghi đè, sai mật khẩu bị từ chối, tệp ra không chứa bản rõ.
#   PGHOST=localhost PGUSER=postgres ./supabase/sao-luu/thu-vong.sh
set -euo pipefail
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
cd "$(dirname "$0")/.."
A="sao_luu_nguon_$$"; B="sao_luu_dich_$$"; RA="$(mktemp -d)"
trap 'psql -d postgres -q -c "drop database if exists $A with (force)" -c "drop database if exists $B with (force)"; rm -rf "$RA"' EXIT
psql -d postgres -q -c "create database $A" -c "create database $B"
psql -d "$A" -q -v ON_ERROR_STOP=1 -f kiem_thu/gia_lap_supabase.sql >/dev/null
psql -d "$B" -q -v ON_ERROR_STOP=1 -f kiem_thu/gia_lap_supabase.sql >/dev/null
for f in $(ls migrations/*.sql | grep -v '\.down\.sql$' | sort); do psql -d "$A" -q -v ON_ERROR_STOP=1 -1 -f "$f" >/dev/null; done
psql -d "$A" -q -At -f kiem_thu/thu_sao.sql >/dev/null 2>&1 || true
psql -d "$A" -q -At -f kiem_thu/thu_nhat_ky_0031.sql >/dev/null 2>&1 || true
[ "$(psql -d "$A" -At -c 'select count(*) from so_cai_sao')" -gt 0 ] || { echo "DB nguồn chưa có dữ liệu mẫu"; exit 1; }

URL_A="postgresql:///$A"; URL_B="postgresql:///$B"; MK="mat-khau-thu-vong-sao-luu-0123456789"
SUPABASE_DB_URL="$URL_A" BACKUP_PASSPHRASE="$MK" sao-luu/sao-luu.sh "$RA"
TEP="$(ls "$RA"/*.tar.gpg)"
if tar -tf "$TEP" >/dev/null 2>&1 || grep -aq "so_cai_sao" "$TEP"; then echo "SAI: tệp sao lưu đọc được khi chưa giải mã"; exit 1; fi
DICH_DB_URL="$URL_B" BACKUP_PASSPHRASE="$MK" sao-luu/khoi-phuc.sh "$TEP"
kt() { [ "$2" = "$3" ] || { echo "SAI $1: có '$2', cần '$3'"; exit 1; }; echo "ok $1"; }
kt "RLS so_cai_sao" "$(psql -d "$B" -At -c "select relrowsecurity from pg_class where oid = 'public.so_cai_sao'::regclass")" t
kt "anon gọi được ghi_nhat_ky_hoi" "$(psql -d "$B" -At -c "select has_function_privilege('anon', 'ghi_nhat_ky_hoi(text,jsonb,text)', 'execute')")" t
kt "anon không đặt khoá nhật ký" "$(psql -d "$B" -At -c "select has_function_privilege('anon', 'dat_khoa_nhat_ky(text)', 'execute')")" f
kt "tài khoản về đủ" "$(psql -d "$B" -At -c 'select count(*) from auth.users')" "$(psql -d "$A" -At -c 'select count(*) from auth.users')"
set +e
DICH_DB_URL="$URL_B" BACKUP_PASSPHRASE="$MK" sao-luu/khoi-phuc.sh "$TEP" >/dev/null 2>&1; kt "chặn ghi đè DB có dữ liệu" "$?" 3
DICH_DB_URL="$URL_B" BACKUP_PASSPHRASE="sai-$MK" sao-luu/khoi-phuc.sh "$TEP" >/dev/null 2>&1; kt "sai mật khẩu" "$?" 5
SUPABASE_DB_URL="$URL_A" BACKUP_PASSPHRASE="ngan" sao-luu/sao-luu.sh "$RA" >/dev/null 2>&1; kt "mật khẩu ngắn" "$?" 2
set -e
echo "sao lưu ↔ khôi phục: OK"
