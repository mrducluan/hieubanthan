-- 0031 — Nhật ký hỏi đáp chỉ ghi được bằng KHOÁ RIÊNG của engine (docs/BAO-MAT.md SEC-1 "Còn mở" #3).
-- Trước: 0004/0005 cho vai trò anon INSERT thẳng → khoá anon là công khai (nằm trong web khi bật tài khoản), người ngoài
-- ghi rác được vào nhật ký (nguyên liệu vòng tự cải thiện). Sau: bỏ quyền ghi của anon / authenticated; engine gọi
-- hàm ghi_nhat_ky_hoi(bảng, bản ghi, khoá) — khoá đúng mới ghi. DB chỉ giữ MÃ BĂM sha256 của khoá (bảng khoa_nhat_ky,
-- không ai đọc được qua API). Chủ dự án đặt khoá một lần trong SQL Editor:  select dat_khoa_nhat_ky('<chuỗi ngẫu nhiên ≥ 32 ký tự>');
-- và đặt cùng chuỗi vào Render (engine) biến NHAT_KY_KHOA. Không đổi cột, không xoá dữ liệu.
-- Rollback: 0031_nhat_ky_khoa_rieng.down.sql (trả lại chính sách anon INSERT như 0004/0005).

drop policy if exists "anon insert thanso_hoi_nhat_ky" on thanso_hoi_nhat_ky;
drop policy if exists "anon insert huyenhoc_hoi_nhat_ky" on huyenhoc_hoi_nhat_ky;
revoke insert, update, delete, truncate on thanso_hoi_nhat_ky, huyenhoc_hoi_nhat_ky from anon, authenticated;

create table if not exists khoa_nhat_ky (
    id        smallint primary key default 1 check (id = 1),
    khoa_bam  bytea not null check (length(khoa_bam) = 32),
    cap_nhat  timestamptz not null default now()
);
alter table khoa_nhat_ky enable row level security;          -- không chính sách nào → anon / authenticated không đọc, không ghi
revoke all on khoa_nhat_ky from anon, authenticated;

-- Đặt / đổi khoá — chỉ chạy được trong SQL Editor (vai trò chủ), không mở qua API.
create or replace function dat_khoa_nhat_ky(p_khoa text) returns text
language plpgsql security definer set search_path = '' as $$
begin
    if p_khoa is null or length(p_khoa) < 32 then
        raise exception 'khoa_qua_ngan' using hint = 'Khoá nhật ký cần ít nhất 32 ký tự (vd: openssl rand -hex 32).';
    end if;
    insert into public.khoa_nhat_ky (id, khoa_bam) values (1, sha256(convert_to(p_khoa, 'UTF8')))
    on conflict (id) do update set khoa_bam = excluded.khoa_bam, cap_nhat = now();
    return 'da_dat';
end $$;
revoke all on function dat_khoa_nhat_ky(text) from public, anon, authenticated;

-- Ghi một dòng nhật ký. Khoá sai / chưa đặt khoá / bảng lạ → false (không lỗi, engine không làm hỏng câu trả lời).
-- Chỉ nhận đúng cột của từng bảng (id, created_at do DB tự đặt); ràng buộc độ dài của bảng vẫn áp như cũ.
create or replace function ghi_nhat_ky_hoi(p_bang text, p_du_lieu jsonb, p_khoa text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
    b public.khoa_nhat_ky;
begin
    if p_khoa is null or length(p_khoa) < 32 or length(p_khoa) > 256 or jsonb_typeof(p_du_lieu) is distinct from 'object' then
        return false;
    end if;
    select * into b from public.khoa_nhat_ky where id = 1;
    if not found or b.khoa_bam <> sha256(convert_to(p_khoa, 'UTF8')) then
        return false;
    end if;
    if p_bang = 'thanso_hoi_nhat_ky' then
        insert into public.thanso_hoi_nhat_ky (cau_hoi_da_loc, linh_vuc, y_dinh, doi_tuong, xu_ly, do_phu, khoi, can_them,
                                               che_do, loi_kiem_tra, cau_tra_loi, engine_version)
        select r.cau_hoi_da_loc, r.linh_vuc, r.y_dinh, r.doi_tuong, r.xu_ly, r.do_phu, coalesce(r.khoi, '{}'),
               coalesce(r.can_them, '{}'), r.che_do, coalesce(r.loi_kiem_tra, '{}'), r.cau_tra_loi, r.engine_version
        from jsonb_populate_record(null::public.thanso_hoi_nhat_ky, p_du_lieu) r;
    elsif p_bang = 'huyenhoc_hoi_nhat_ky' then
        insert into public.huyenhoc_hoi_nhat_ky (mo_dun, cau_hoi_da_loc, loai, xu_ly, che_do, do_phu, co_du_lieu_sinh, khoi,
                                                 can_them, loi_kiem_tra, cau_tra_loi, engine_version)
        select r.mo_dun, r.cau_hoi_da_loc, r.loai, r.xu_ly, r.che_do, r.do_phu, coalesce(r.co_du_lieu_sinh, false),
               coalesce(r.khoi, '{}'), coalesce(r.can_them, '{}'), coalesce(r.loi_kiem_tra, '{}'), r.cau_tra_loi, r.engine_version
        from jsonb_populate_record(null::public.huyenhoc_hoi_nhat_ky, p_du_lieu) r;
    else
        return false;
    end if;
    return true;
end $$;
revoke all on function ghi_nhat_ky_hoi(text, jsonb, text) from public;
grant execute on function ghi_nhat_ky_hoi(text, jsonb, text) to anon, service_role;

comment on function ghi_nhat_ky_hoi(text, jsonb, text) is
    'Engine ghi nhật ký hỏi đáp (0004/0005) bằng khoá riêng NHAT_KY_KHOA; DB chỉ giữ sha256 của khoá (khoa_nhat_ky).';
