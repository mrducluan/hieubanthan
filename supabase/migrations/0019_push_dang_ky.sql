-- KC-4 GĐ1 — Web Push (chủ dự án duyệt 2026-10-21, docs/NHAC-VIEC-VA-WEB-PUSH.md mục 2–3).
-- push_dang_ky: thiết bị người dùng đã bấm "Bật nhắc trên điện thoại" (subscription của trình duyệt: endpoint + khoá
--   công khai p256dh + auth). BẮT BUỘC đăng nhập (để xoá được) — không có đăng ký ẩn danh. KHÔNG lưu nội dung nhắc ở
--   đây: lúc gửi, cron lấy nhãn từ nhac_viec (0018). ≤ 5 thiết bị / người (thiết bị cũ nhất bị thay).
-- endpoint chỉ nhận máy chủ push của trình duyệt (Google FCM, Mozilla, Apple, Microsoft) — máy chủ web sẽ POST tới đây,
--   chặn để không biến thành công cụ gửi yêu cầu tới địa chỉ lạ.
-- Gửi: cron ngày (web /api/cron/nhac-day, service role) — push_hang_doi(ngày) → gửi → push_ket_qua(); ≤ 1 thông báo /
--   người / ngày; máy chủ push báo 404/410 (thiết bị đã huỷ) hoặc lỗi 5 lần liền → xoá đăng ký.
-- RLS chủ sở hữu (xem, xoá); ghi qua dang_ky_push() (một trình duyệt chỉ thuộc tài khoản đang đăng nhập trên nó).
-- Xoá tài khoản → xoá theo. Rollback: 0019_push_dang_ky.down.sql

create table if not exists push_dang_ky (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users (id) on delete cascade,
    endpoint      text not null unique check (char_length(endpoint) <= 1000 and endpoint ~ (
        '^https://(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com'
        || '|[a-z0-9-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/[^[:space:]]+$')),
    p256dh        text not null check (p256dh ~ '^[A-Za-z0-9_-]{86,88}$'),   -- 65 byte (điểm P-256) base64url
    auth          text not null check (auth ~ '^[A-Za-z0-9_-]{22,24}$'),     -- 16 byte base64url
    tao_luc       timestamptz not null default now(),
    lan_cuoi_gui  date,
    so_lan_loi    integer not null default 0 check (so_lan_loi >= 0)
);
create index if not exists push_dang_ky_user on push_dang_ky (user_id);
alter table push_dang_ky enable row level security;
revoke all on push_dang_ky from public, anon, authenticated;
grant select, delete on push_dang_ky to authenticated;
drop policy if exists "push_dang_ky chu doc" on push_dang_ky;
create policy "push_dang_ky chu doc" on push_dang_ky for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "push_dang_ky chu xoa" on push_dang_ky;
create policy "push_dang_ky chu xoa" on push_dang_ky for delete to authenticated using ((select auth.uid()) = user_id);
comment on table push_dang_ky is 'Thiết bị nhận nhắc Web Push (endpoint + khoá của trình duyệt). RLS chủ sở hữu; không nội dung nhắc.';

-- Người dùng (đã đăng nhập) đăng ký trình duyệt đang dùng. Trình duyệt đã đăng ký cho tài khoản khác (đổi tài khoản trên
-- cùng máy) → chuyển sang tài khoản hiện tại: chỉ trình duyệt giữ subscription mới biết endpoint + khoá.
create or replace function dang_ky_push(p_endpoint text, p_p256dh text, p_auth text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
    if uid is null then raise exception 'push: can dang nhap' using errcode = 'insufficient_privilege'; end if;
    insert into public.push_dang_ky (user_id, endpoint, p256dh, auth, tao_luc)
    values (uid, p_endpoint, p_p256dh, p_auth, clock_timestamp())
    on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        tao_luc = excluded.tao_luc, so_lan_loi = 0;
    -- ≤ 5 thiết bị: bỏ đăng ký cũ nhất.
    delete from public.push_dang_ky where id in (
        select id from public.push_dang_ky where user_id = uid order by tao_luc desc offset 5);
    return true;
end; $$;

-- Hàng đợi gửi của một ngày (giờ VN, cron truyền vào): người có mốc nhac_viec đúng ngày + có thiết bị, chưa được gửi
-- trong ngày đó (≤ 1 thông báo / người / ngày, chạy lại cron không gửi trùng). Chỉ nhãn + đường dẫn do engine soạn.
create or replace function push_hang_doi(p_ngay date) returns table (user_id uuid, nhac jsonb, thiet_bi jsonb)
language sql stable security definer set search_path = '' as $$
    select n.user_id,
           jsonb_agg(distinct jsonb_build_object('nhan', n.nhan, 'duong', n.duong, 'ma', n.ma)),
           (select jsonb_agg(jsonb_build_object('id', d.id, 'endpoint', d.endpoint, 'p256dh', d.p256dh, 'auth', d.auth))
              from public.push_dang_ky d where d.user_id = n.user_id)
    from public.nhac_viec n
    where n.ngay = p_ngay
      and exists (select 1 from public.push_dang_ky d where d.user_id = n.user_id)
      and not exists (select 1 from public.push_dang_ky d where d.user_id = n.user_id and d.lan_cuoi_gui = p_ngay)
    group by n.user_id
$$;

-- Ghi kết quả gửi cho MỘT thiết bị: ok → đánh dấu đã gửi ngày đó; het_han (404/410) → xoá; lỗi khác → đếm, 5 lần liền
-- thì xoá. Cùng người có thiết bị lỗi vẫn được đánh dấu "đã gửi" nếu thiết bị khác nhận được.
create or replace function push_ket_qua(p_id uuid, p_ngay date, p_ket_qua text) returns void
language plpgsql security definer set search_path = '' as $$
begin
    if p_ket_qua = 'ok' then
        update public.push_dang_ky set lan_cuoi_gui = p_ngay, so_lan_loi = 0 where id = p_id;
    elsif p_ket_qua = 'het_han' then
        delete from public.push_dang_ky where id = p_id;
    elsif p_ket_qua = 'loi' then
        update public.push_dang_ky set so_lan_loi = so_lan_loi + 1 where id = p_id;
        delete from public.push_dang_ky where id = p_id and so_lan_loi >= 5;
    else
        raise exception 'push_ket_qua: ket qua la %', p_ket_qua using errcode = 'invalid_parameter_value';
    end if;
end; $$;

revoke all on function dang_ky_push(text, text, text), push_hang_doi(date), push_ket_qua(uuid, date, text)
    from public, anon, authenticated;
grant execute on function dang_ky_push(text, text, text) to authenticated;
grant execute on function push_hang_doi(date), push_ket_qua(uuid, date, text) to service_role;
