-- GD-1 đợt 3 (2026-11-16, chủ dự án giao làm tiếp) — "Nhà mình" lưu trong TÀI KHOẢN, tuỳ chọn như ho_so_nha (0018).
-- CHỈ lớp cơ bản của người nhà: vai + năm sinh + giới tính. KHÔNG tên gọi, KHÔNG ngày giờ sinh, KHÔNG luận giải —
-- hàm gia_dinh_hop_le() chặn mọi khoá khác ngay trong DB (không tin web). ≤ 7 người, một hàng / tài khoản.
-- Chỉ ghi khi người dùng bấm "Lưu nhà mình vào tài khoản" và tự tích đồng ý (dong_y_luc). RLS chủ sở hữu; xoá tài khoản →
-- xoá theo. Rollback: 0039_gia_dinh.down.sql

create or replace function gia_dinh_hop_le(d jsonb) returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(d) = 'array' and jsonb_array_length(d) between 1 and 7
     and not exists (
       select 1 from jsonb_array_elements(d) x
       where jsonb_typeof(x) <> 'object'
          or (x - 'vai' - 'nam_sinh' - 'gioi_tinh') <> '{}'::jsonb
          or coalesce(x->>'vai', '') not in ('vo_chong','con','bo','me','anh_chi','em','ong_ba','chau','bo_me_ben_kia',
                                             'con_dau_re','nguoi_cung_nha')
          or jsonb_typeof(x->'nam_sinh') is distinct from 'number'
          or (x->>'nam_sinh') !~ '^(19|20)[0-9]{2}$'
          or (x ? 'gioi_tinh' and coalesce(x->>'gioi_tinh', '') not in ('nam','nu')))
     and (select count(*) from jsonb_array_elements(d) x where x->>'vai' = 'vo_chong') <= 1;
$$;

create table if not exists gia_dinh (
    user_id       uuid primary key references auth.users (id) on delete cascade,
    du_lieu       jsonb not null check (pg_column_size(du_lieu) <= 4096 and gia_dinh_hop_le(du_lieu)),
    dong_y_luc    timestamptz not null,
    tao_luc       timestamptz not null default now(),
    cap_nhat_luc  timestamptz not null default now()
);
alter table gia_dinh enable row level security;
drop policy if exists "gia_dinh chu doc" on gia_dinh;
create policy "gia_dinh chu doc" on gia_dinh for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "gia_dinh chu tao" on gia_dinh;
create policy "gia_dinh chu tao" on gia_dinh for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "gia_dinh chu sua" on gia_dinh;
create policy "gia_dinh chu sua" on gia_dinh for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "gia_dinh chu xoa" on gia_dinh;
create policy "gia_dinh chu xoa" on gia_dinh for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on gia_dinh from anon;
revoke truncate on gia_dinh from authenticated;

create or replace function gia_dinh_cap_nhat_luc() returns trigger language plpgsql set search_path = '' as $$
begin new.cap_nhat_luc := now(); return new; end; $$;
drop trigger if exists gia_dinh_cap_nhat_luc on gia_dinh;
create trigger gia_dinh_cap_nhat_luc before update on gia_dinh for each row execute function gia_dinh_cap_nhat_luc();
comment on table gia_dinh is 'Người nhà người dùng tự lưu (chỉ vai + năm sinh + giới tính; không tên, không ngày giờ sinh). RLS chủ sở hữu.';
