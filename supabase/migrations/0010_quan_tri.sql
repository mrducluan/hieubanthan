-- QT-0 (2026-10-09, chủ dự án duyệt: tự xây /quan-tri, tri thức xuất bản qua PR git — docs/KIEN-TRUC-QUAN-TRI.md).
--
-- Thiết kế:
--   vai_tro_quan_tri   ai được vào trang quản trị, với vai trò gì. Người thường KHÔNG có dòng nào ở đây.
--   nhat_ky_quan_tri   nhật ký thao tác quản trị — chỉ thêm, không sửa, không xoá (kể cả chủ sở hữu).
--   cau_hinh           cài đặt site KHÔNG bí mật (công tắc, hạn mức…). Khoá bí mật vẫn chỉ ở env.
--                      QT-0 chỉ tạo bảng + quyền đọc; ghi qua giao diện ở QT-2.
-- Mọi GHI đi qua hàm SECURITY DEFINER kiểm vai trò + phiên đã qua MFA (aal2). Bảng thống kê chỉ trả SỐ TỔNG — quản trị không đọc được
-- ngày giờ sinh hay hồ sơ của ai (NĐ 13/2023).
-- Cấp chủ sở hữu đầu tiên: chạy tay trong SQL Editor (docs/VIEC-CUA-ANH.md mục Q).
-- Chạy SAU 0006 + 0008. Rollback: 0010_quan_tri.down.sql

create table if not exists vai_tro_quan_tri (
    user_id  uuid primary key references auth.users (id) on delete cascade,
    vai_tro  text not null check (vai_tro in ('chu_so_huu', 'bien_tap', 'tham_dinh', 'ho_tro', 'xem')),
    cap_boi  uuid references auth.users (id) on delete set null,
    tao_luc  timestamptz not null default now()
);

create table if not exists nhat_ky_quan_tri (
    id         bigint generated always as identity primary key,
    user_id    uuid references auth.users (id) on delete set null,
    hanh_dong  text not null check (hanh_dong ~ '^[a-z0-9_.]{2,60}$'),
    doi_tuong  text check (doi_tuong is null or char_length(doi_tuong) <= 200),
    chi_tiet   jsonb check (chi_tiet is null or pg_column_size(chi_tiet) <= 16384),
    tao_luc    timestamptz not null default now()
);
create index if not exists nhat_ky_quan_tri_tao_luc_idx on nhat_ky_quan_tri (tao_luc desc);

create table if not exists cau_hinh (
    khoa          text primary key check (khoa ~ '^[a-z0-9_.]{2,60}$'),
    gia_tri       jsonb not null,
    mo_ta         text check (mo_ta is null or char_length(mo_ta) <= 300),
    cap_nhat_boi  uuid references auth.users (id) on delete set null,
    cap_nhat_luc  timestamptz not null default now()
);

alter table vai_tro_quan_tri enable row level security;
alter table nhat_ky_quan_tri enable row level security;
alter table cau_hinh enable row level security;

-- Vai trò của người đang gọi (null = không phải quản trị) — web dùng để dẫn vào bước MFA.
create or replace function vai_tro_cua_toi() returns text
    language sql stable security definer set search_path = '' as $$
    select vai_tro from public.vai_tro_quan_tri where user_id = (select auth.uid())
$$;

-- Vai trò CÓ HIỆU LỰC: chỉ khi phiên đã qua MFA (aal2). Mọi quyền đọc/ghi dữ liệu quản trị dùng hàm này →
-- lộ mật khẩu email/Google của quản trị viên cũng chưa đủ để đọc gì (chặn ở cơ sở dữ liệu, không chỉ ở web).
create or replace function vai_tro_hieu_luc() returns text
    language sql stable security definer set search_path = '' as $$
    select case when coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2' then public.vai_tro_cua_toi() end
$$;

drop policy if exists "vai_tro_quan_tri tu doc" on vai_tro_quan_tri;
create policy "vai_tro_quan_tri tu doc" on vai_tro_quan_tri
    for select to authenticated
    using ((select auth.uid()) = user_id or (select public.vai_tro_hieu_luc()) = 'chu_so_huu');

drop policy if exists "nhat_ky_quan_tri chu doc" on nhat_ky_quan_tri;
create policy "nhat_ky_quan_tri chu doc" on nhat_ky_quan_tri
    for select to authenticated using ((select public.vai_tro_hieu_luc()) = 'chu_so_huu');

drop policy if exists "cau_hinh quan tri doc" on cau_hinh;
create policy "cau_hinh quan tri doc" on cau_hinh
    for select to authenticated using ((select public.vai_tro_hieu_luc()) is not null);

-- Không có policy insert/update/delete → client không ghi thẳng được. Chặn thêm ở mức quyền bảng.
revoke insert, update, delete on vai_tro_quan_tri, nhat_ky_quan_tri, cau_hinh from anon, authenticated;

-- Ghi nhật ký: chỉ người có vai trò; user_id luôn là người gọi (không ghi hộ người khác).
create or replace function ghi_nhat_ky_quan_tri(p_hanh_dong text, p_doi_tuong text default null, p_chi_tiet jsonb default null)
    returns void language plpgsql security definer set search_path = '' as $$
begin
    if (select public.vai_tro_hieu_luc()) is null then raise exception 'khong_co_quyen'; end if;
    insert into public.nhat_ky_quan_tri (user_id, hanh_dong, doi_tuong, chi_tiet)
    values ((select auth.uid()), p_hanh_dong, p_doi_tuong, p_chi_tiet);
end
$$;

-- Thống kê cho bảng điều khiển: CHỈ số tổng, không trả dòng nào của người dùng.
create or replace function thong_ke_quan_tri() returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
begin
    if (select public.vai_tro_hieu_luc()) is null then raise exception 'khong_co_quyen'; end if;
    return jsonb_build_object(
        'tai_khoan',          (select count(*) from auth.users),
        'tai_khoan_7_ngay',   (select count(*) from auth.users where created_at >= now() - interval '7 days'),
        'dang_nhap_7_ngay',   (select count(*) from auth.users where last_sign_in_at >= now() - interval '7 days'),
        'ho_so',              (select count(*) from public.ho_so),
        'sao_da_tang',        (select coalesce(sum(so_luong), 0) from public.so_cai_sao where so_luong > 0),
        'sao_da_dung',        (select coalesce(-sum(so_luong), 0) from public.so_cai_sao where so_luong < 0),
        'loi_moi_thanh_cong', (select count(*) from public.gioi_thieu),
        'quan_tri',           (select count(*) from public.vai_tro_quan_tri)
    );
end
$$;

revoke execute on function vai_tro_cua_toi(), vai_tro_hieu_luc(), ghi_nhat_ky_quan_tri(text, text, jsonb), thong_ke_quan_tri() from public, anon;
grant execute on function vai_tro_cua_toi(), vai_tro_hieu_luc(), ghi_nhat_ky_quan_tri(text, text, jsonb), thong_ke_quan_tri() to authenticated;
