-- KC-4 GĐ2 — Web Push thành "nhịp cá nhân" (chủ dự án duyệt 2026-10-22, docs/DE-XUAT-WEB-PUSH-VA-DOANH-THU.md mục 1).
-- push_tuy_chon: người dùng (đã bật nhắc trên ≥ 1 thiết bị) tự tích nhận thêm — KHÔNG tích sẵn:
--   sang_nay  — mỗi sáng một dòng: Ngày cá nhân + câu tự soi của ngày (cần hồ sơ đã lưu trong tài khoản, bảng ho_so);
--   moc_lich  — mốc lịch chung: 'thang_ca_nhan' (ngày 1 dương: tháng cá nhân mới), 'giao_tiet' (12 tiết đầu tháng theo
--               tiết khí), 'lap_xuan_tet' (Lập xuân + Tết âm lịch Việt).
-- Vẫn ≤ 1 thông báo / thiết bị / ngày: mốc người dùng tự đánh dấu (nhac_viec) > mốc lịch > sáng nay, gộp vào một thông báo.
-- push_hang_doi_v2: như push_hang_doi (0019) + tuỳ chọn + NGÀY-THÁNG sinh 'dd-mm' (không năm, không tên) và chỉ khi
--   người đó bật sang_nay hoặc 'thang_ca_nhan' — đủ để engine tính ngày/tháng cá nhân (mốc 1/1 dương). Không lưu gì thêm.
-- "Hôm qua việc X — đúng không?" không cần bảng: ý định hôm qua chỉ nằm trên máy (IndexedDB), câu trả lời đi vào phiếu
-- kiểm chứng có sẵn của 0017 (loại doi_song, mã ds.hn.*).
-- RLS chủ sở hữu; xoá tài khoản → xoá theo. Rollback: 0020_push_tuy_chon.down.sql

create table if not exists push_tuy_chon (
    user_id       uuid primary key references auth.users (id) on delete cascade,
    sang_nay      boolean not null default false,
    moc_lich      text[] not null default '{}'
                  check (moc_lich <@ array['thang_ca_nhan', 'giao_tiet', 'lap_xuan_tet']::text[]),
    cap_nhat_luc  timestamptz not null default now()
);
alter table push_tuy_chon enable row level security;
revoke all on push_tuy_chon from public, anon, authenticated;
grant select, insert, update, delete on push_tuy_chon to authenticated;
drop policy if exists "push_tuy_chon chu doc" on push_tuy_chon;
create policy "push_tuy_chon chu doc" on push_tuy_chon for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "push_tuy_chon chu tao" on push_tuy_chon;
create policy "push_tuy_chon chu tao" on push_tuy_chon for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "push_tuy_chon chu sua" on push_tuy_chon;
create policy "push_tuy_chon chu sua" on push_tuy_chon for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "push_tuy_chon chu xoa" on push_tuy_chon;
create policy "push_tuy_chon chu xoa" on push_tuy_chon for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function push_tuy_chon_cap_nhat_luc() returns trigger language plpgsql set search_path = '' as $$
begin new.cap_nhat_luc := now(); return new; end; $$;
drop trigger if exists push_tuy_chon_cap_nhat_luc on push_tuy_chon;
create trigger push_tuy_chon_cap_nhat_luc before insert or update on push_tuy_chon
    for each row execute function push_tuy_chon_cap_nhat_luc();
comment on table push_tuy_chon is 'Tuỳ chọn nhận thêm của Web Push (sáng nay, mốc lịch). Người dùng tự tích; RLS chủ sở hữu.';

-- Hàng đợi một ngày (giờ VN): người có thiết bị CHƯA nhận trong ngày và có ít nhất một thứ để báo (mốc tự đánh dấu hôm
-- nay, hoặc đã bật sáng nay / mốc lịch — cron bỏ qua nếu hôm nay không có mốc lịch và không đủ dữ kiện cho sáng nay).
create or replace function push_hang_doi_v2(p_ngay date)
returns table (user_id uuid, nhac jsonb, thiet_bi jsonb, sang_nay boolean, moc_lich text[], ngay_sinh text)
language sql stable security definer set search_path = '' as $$
    with ung_vien as (
        select distinct d.user_id from public.push_dang_ky d
         where d.lan_cuoi_gui is null or d.lan_cuoi_gui <> p_ngay
    )
    select u.user_id,
           coalesce((select jsonb_agg(distinct jsonb_build_object('nhan', n.nhan, 'duong', n.duong, 'ma', n.ma))
                       from public.nhac_viec n where n.user_id = u.user_id and n.ngay = p_ngay), '[]'::jsonb),
           (select jsonb_agg(jsonb_build_object('id', d.id, 'endpoint', d.endpoint, 'p256dh', d.p256dh, 'auth', d.auth))
              from public.push_dang_ky d
             where d.user_id = u.user_id and (d.lan_cuoi_gui is null or d.lan_cuoi_gui <> p_ngay)),
           coalesce(t.sang_nay, false),
           coalesce(t.moc_lich, '{}'),
           case when coalesce(t.sang_nay, false) or 'thang_ca_nhan' = any (coalesce(t.moc_lich, '{}'))
                then (select to_char(h.ngay_sinh, 'DD-MM') from public.ho_so h where h.user_id = u.user_id) end
    from ung_vien u
    left join public.push_tuy_chon t on t.user_id = u.user_id
    where exists (select 1 from public.nhac_viec n where n.user_id = u.user_id and n.ngay = p_ngay)
       or coalesce(t.sang_nay, false)
       or cardinality(coalesce(t.moc_lich, '{}')) > 0
$$;

revoke all on function push_hang_doi_v2(date), push_tuy_chon_cap_nhat_luc() from public, anon, authenticated;
grant execute on function push_hang_doi_v2(date) to service_role;
