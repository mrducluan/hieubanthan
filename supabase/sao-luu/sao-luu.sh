#!/usr/bin/env bash
# Sao lưu Postgres Supabase (schema public + cms đầy đủ, tài khoản auth.users/identities chỉ dữ liệu) → MỘT tệp mã hoá
# AES-256 bằng gpg (mật khẩu đối xứng). Repo công khai → KHÔNG BAO GIỜ để bản rõ rời khỏi máy chạy: bản rõ chỉ nằm trong
# thư mục tạm, xoá khi thoát kể cả lúc lỗi. Trong tệp mã hoá có kiem_dem.tsv (số dòng từng bảng) để khôi phục xong đối chiếu.
#   SUPABASE_DB_URL=postgresql://postgres.<ref>:<mk>@aws-0-<vùng>.pooler.supabase.com:5432/postgres \
#   BACKUP_PASSPHRASE='<≥ 20 ký tự>' supabase/sao-luu/sao-luu.sh <thư mục ra>
# Khôi phục: supabase/sao-luu/khoi-phuc.sh (docs/VIEC-CUA-ANH.md mục "Sao lưu DB").
set -euo pipefail
RA="${1:?Thiếu thư mục ra}"
: "${SUPABASE_DB_URL:?Thiếu SUPABASE_DB_URL}"
: "${BACKUP_PASSPHRASE:?Thiếu BACKUP_PASSPHRASE}"
if [ "${#BACKUP_PASSPHRASE}" -lt 20 ]; then echo "BACKUP_PASSPHRASE quá ngắn (cần ≥ 20 ký tự)." >&2; exit 2; fi
mkdir -p "$RA"
TAM="$(mktemp -d)"; chmod 700 "$TAM"
trap 'rm -rf "$TAM"' EXIT
NGAY="$(date -u +%Y-%m-%d)"
CHUOI_SCHEMA="${SAO_LUU_SCHEMA:-public cms}"

DS_N=(); for s in $CHUOI_SCHEMA; do DS_N+=(-n "$s"); done
pg_dump "$SUPABASE_DB_URL" -Fc --no-owner "${DS_N[@]}" -f "$TAM/du_lieu.dump"

# Tài khoản: chỉ dữ liệu (cấu trúc auth do Supabase dựng sẵn ở dự án mới). Không đọc được thì vẫn giữ phần dữ liệu chính.
TK="co"
if ! pg_dump "$SUPABASE_DB_URL" -Fc --data-only -t auth.users -t auth.identities -f "$TAM/tai_khoan.dump" 2>"$TAM/loi_tk.txt"; then
  TK="khong"; rm -f "$TAM/tai_khoan.dump"
  echo "::warning::Không sao lưu được auth.users/identities: $(head -c 300 "$TAM/loi_tk.txt")"
fi
rm -f "$TAM/loi_tk.txt"

SCHEMA_SQL="$(printf "'%s'," $CHUOI_SCHEMA)"; SCHEMA_SQL="${SCHEMA_SQL%,}"
psql "$SUPABASE_DB_URL" -X -q -At -F $'\t' -c "
  select table_schema || '.' || table_name,
         (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from %I.%I', table_schema, table_name), false, true, '')))[1]::text
  from information_schema.tables
  where table_schema in ($SCHEMA_SQL) and table_type = 'BASE TABLE'
  order by 1" > "$TAM/kiem_dem.tsv"
{ echo "ngay=$NGAY"; echo "schema=$CHUOI_SCHEMA"; echo "tai_khoan=$TK"; psql "$SUPABASE_DB_URL" -X -At -c "show server_version"; } > "$TAM/thong_tin.txt"

TEN="hbt-db-$NGAY.tar.gpg"
tar -C "$TAM" -cf - $(cd "$TAM" && ls) \
  | gpg --batch --yes --quiet --symmetric --cipher-algo AES256 --s2k-digest-algo SHA512 --s2k-count 65011712 \
        --pinentry-mode loopback --passphrase-fd 3 -o "$RA/$TEN" 3< <(printf '%s' "$BACKUP_PASSPHRASE")
echo "Đã ghi $RA/$TEN ($(wc -c < "$RA/$TEN") byte, $(wc -l < "$TAM/kiem_dem.tsv") bảng, tài khoản: $TK)"
