#!/usr/bin/env bash
# Khôi phục tệp sao lưu của sao-luu.sh vào một Postgres ĐÍCH (dự án Supabase mới, hoặc DB thử). Không bao giờ trỏ vào DB
# đang chạy thật: script từ chối nếu bảng public.so_cai_sao ở đích đã có dữ liệu (trừ khi KHOI_PHUC_DE=1).
#   BACKUP_PASSPHRASE='…' DICH_DB_URL=postgresql://… supabase/sao-luu/khoi-phuc.sh hbt-db-YYYY-MM-DD.tar.gpg
# Thứ tự: giải mã → (tài khoản auth, chỉ dữ liệu) → public + cms (cấu trúc + dữ liệu + RLS + quyền) → đếm dòng so với kiem_dem.tsv.
set -euo pipefail
TEP="${1:?Thiếu tệp .tar.gpg}"
: "${DICH_DB_URL:?Thiếu DICH_DB_URL}"
: "${BACKUP_PASSPHRASE:?Thiếu BACKUP_PASSPHRASE}"
TAM="$(mktemp -d)"; chmod 700 "$TAM"
trap 'rm -rf "$TAM"' EXIT
if ! gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 -o "$TAM/goi.tar" -d "$TEP" 3< <(printf '%s' "$BACKUP_PASSPHRASE") 2>/dev/null; then
  echo "Không giải mã được: sai BACKUP_PASSPHRASE hoặc tệp hỏng." >&2; exit 5
fi
tar -C "$TAM" -xf "$TAM/goi.tar" && rm -f "$TAM/goi.tar"
cat "$TAM/thong_tin.txt"
P=(psql "$DICH_DB_URL" -X -q -v ON_ERROR_STOP=1)
if [ "${KHOI_PHUC_DE:-0}" != "1" ] && [ "$("${P[@]}" -At -c "select coalesce((select 1 from public.so_cai_sao limit 1), 0)" 2>/dev/null || echo 0)" = "1" ]; then
  echo "DB đích đã có dữ liệu Sao — dừng để không ghi đè. Đặt KHOI_PHUC_DE=1 nếu chắc chắn." >&2; exit 3
fi
"${P[@]}" -c "create schema if not exists extensions; create extension if not exists vector with schema extensions;" || true
if [ -f "$TAM/tai_khoan.dump" ]; then pg_restore -d "$DICH_DB_URL" --no-owner --data-only --disable-triggers "$TAM/tai_khoan.dump" || echo "⚠ tài khoản: có lỗi khi khôi phục (xem trên)"; fi
# Schema public đã có sẵn ở dự án mới → bỏ mục tạo schema public khỏi danh sách khôi phục.
pg_restore -l "$TAM/du_lieu.dump" | grep -v -E ' SCHEMA - public | COMMENT - SCHEMA public ' > "$TAM/ds.txt"
pg_restore -d "$DICH_DB_URL" --no-owner --exit-on-error -L "$TAM/ds.txt" "$TAM/du_lieu.dump"
lech=0
while IFS=$'\t' read -r bang so; do
  co="$("${P[@]}" -At -c "select count(*) from $bang")"
  if [ "$co" != "$so" ]; then echo "LỆCH $bang: sao lưu $so, đích $co"; lech=1; fi
done < "$TAM/kiem_dem.tsv"
[ "$lech" = 0 ] && echo "Khôi phục xong: $(wc -l < "$TAM/kiem_dem.tsv") bảng khớp số dòng." || { echo "Có bảng lệch số dòng." >&2; exit 4; }
