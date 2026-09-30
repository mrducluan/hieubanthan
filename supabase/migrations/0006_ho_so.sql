-- Hồ sơ bản thân lưu trong TÀI KHOẢN (UI-4, docs/THIET-KE-UI.md §8) — quyết định chủ dự án 2026-09-30.
-- Chỉ tạo khi người dùng đăng nhập VÀ bấm "Lưu hồ sơ vào tài khoản" (đồng ý rõ ràng → dong_y_luc).
-- Dữ liệu cá nhân (NĐ 13/2023): họ tên, ngày sinh, giờ sinh, giới tính. KHÔNG lưu luận giải, KHÔNG
-- lưu câu hỏi (CLAUDE.md: không lưu nội dung luận giải gắn user_id). Nhật ký 0004/0005 vẫn ẩn danh.
-- RLS: mỗi người chỉ đọc/ghi/xoá hàng của mình. Xoá tài khoản (auth.users) → xoá hồ sơ (cascade).
-- Rollback: 0006_ho_so.down.sql

create table if not exists ho_so (
    user_id       uuid primary key references auth.users (id) on delete cascade,
    ho_ten        text not null check (char_length(ho_ten) between 1 and 80),
    ten_khac      text check (ten_khac is null or char_length(ten_khac) <= 80),
    ngay_sinh     date not null check (ngay_sinh between date '1900-01-01' and date '2100-12-31'),
    gio_sinh      time,
    gioi_tinh     text check (gioi_tinh is null or gioi_tinh in ('nam', 'nu')),
    vung          text check (vung is null or vung in ('north', 'south')),
    dong_y_luc    timestamptz not null,
    tao_luc       timestamptz not null default now(),
    cap_nhat_luc  timestamptz not null default now()
);

alter table ho_so enable row level security;

create policy "ho_so chu doc" on ho_so
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "ho_so chu tao" on ho_so
    for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ho_so chu sua" on ho_so
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ho_so chu xoa" on ho_so
    for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function ho_so_cap_nhat_luc() returns trigger
    language plpgsql set search_path = '' as $$
begin
    new.cap_nhat_luc := now();
    return new;
end;
$$;

create trigger ho_so_cap_nhat_luc before update on ho_so
    for each row execute function ho_so_cap_nhat_luc();

comment on table ho_so is
    'Hồ sơ bản thân người dùng tự lưu (đồng ý tại dong_y_luc). Dữ liệu cá nhân — RLS chủ sở hữu; không lưu luận giải.';
