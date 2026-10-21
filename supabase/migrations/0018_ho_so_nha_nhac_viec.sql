-- KC-2 + KC-4 (chủ dự án duyệt 2026-10-21): "hồ sơ nhà" và "nhắc việc" lưu trong TÀI KHOẢN, tuỳ chọn như ho_so (0006).
-- ho_so_nha: hướng cửa, năm xây, người cùng ở (chỉ năm sinh + giới tính, KHÔNG tên), bố cục đã khai — một hàng / người,
--   JSON ≤ 16 KB. Chỉ ghi khi người dùng bấm "Lưu nhà vào tài khoản" (dong_y_luc). Không lưu luận giải.
-- nhac_viec: mốc ngày người dùng tự bấm "Nhắc tôi hôm đó" (ứng kỳ quẻ, tháng nên sửa nhà…): ngày + mã tất định + nhãn do
--   ENGINE soạn (không câu hỏi, không chữ người dùng), ≤ 50 mốc / người, tự xoá sau 400 ngày (don_nhac_viec()).
-- RLS chủ sở hữu; xoá tài khoản → xoá theo. Rollback: 0018_ho_so_nha_nhac_viec.down.sql

create table if not exists ho_so_nha (
    user_id       uuid primary key references auth.users (id) on delete cascade,
    du_lieu       jsonb not null check (pg_column_size(du_lieu) <= 16384),
    dong_y_luc    timestamptz not null,
    tao_luc       timestamptz not null default now(),
    cap_nhat_luc  timestamptz not null default now()
);
alter table ho_so_nha enable row level security;
drop policy if exists "ho_so_nha chu doc" on ho_so_nha;
create policy "ho_so_nha chu doc" on ho_so_nha for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "ho_so_nha chu tao" on ho_so_nha;
create policy "ho_so_nha chu tao" on ho_so_nha for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "ho_so_nha chu sua" on ho_so_nha;
create policy "ho_so_nha chu sua" on ho_so_nha for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "ho_so_nha chu xoa" on ho_so_nha;
create policy "ho_so_nha chu xoa" on ho_so_nha for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function ho_so_nha_cap_nhat_luc() returns trigger language plpgsql set search_path = '' as $$
begin new.cap_nhat_luc := now(); return new; end; $$;
drop trigger if exists ho_so_nha_cap_nhat_luc on ho_so_nha;
create trigger ho_so_nha_cap_nhat_luc before update on ho_so_nha for each row execute function ho_so_nha_cap_nhat_luc();
comment on table ho_so_nha is 'Hồ sơ nhà người dùng tự lưu (hướng, năm xây, người cùng ở theo năm sinh, bố cục). RLS chủ sở hữu; không luận giải.';

create table if not exists nhac_viec (
    id        uuid primary key default gen_random_uuid(),
    user_id   uuid not null references auth.users (id) on delete cascade,
    ngay      date not null,
    ma        text not null check (ma ~ '^[a-z0-9_.+-]{3,80}$'),
    mo_dun    text not null check (mo_dun in ('kinhdich', 'phongthuy', 'thanso', 'tuvi', 'battu', 'hom_nay')),
    nhan      text not null check (char_length(nhan) between 1 and 80),
    duong     text check (duong is null or duong ~ '^/[a-z0-9/_?=&.-]{0,120}$'),
    tao_luc   timestamptz not null default now(),
    unique (user_id, ngay, ma)
);
alter table nhac_viec enable row level security;
drop policy if exists "nhac_viec chu doc" on nhac_viec;
create policy "nhac_viec chu doc" on nhac_viec for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "nhac_viec chu tao" on nhac_viec;
create policy "nhac_viec chu tao" on nhac_viec for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "nhac_viec chu xoa" on nhac_viec;
create policy "nhac_viec chu xoa" on nhac_viec for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists nhac_viec_user_ngay on nhac_viec (user_id, ngay);

-- Trần 50 mốc / người (chặn ở DB, không tin trình duyệt).
create or replace function nhac_viec_tran() returns trigger language plpgsql set search_path = '' as $$
begin
    if (select count(*) from public.nhac_viec where user_id = new.user_id) >= 50 then
        raise exception 'nhac_viec: toi da 50 moc moi nguoi' using errcode = 'check_violation';
    end if;
    return new;
end; $$;
drop trigger if exists nhac_viec_tran on nhac_viec;
create trigger nhac_viec_tran before insert on nhac_viec for each row execute function nhac_viec_tran();

-- Dọn mốc quá 400 ngày (gọi bằng service role từ cron ngày, cùng chỗ don_du_lieu_hoc).
create or replace function don_nhac_viec() returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
    delete from public.nhac_viec where ngay < (current_date - 400);
    get diagnostics n = row_count;
    return n;
end; $$;
revoke all on function don_nhac_viec() from public;
comment on table nhac_viec is 'Mốc nhắc việc người dùng tự bấm (ngày + mã + nhãn do engine soạn). RLS chủ sở hữu; không câu hỏi, không nội dung luận giải.';
