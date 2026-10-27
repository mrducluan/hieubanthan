-- Rollback 0031: bỏ hàm ghi bằng khoá riêng, trả lại chính sách anon INSERT của 0004/0005 (engine bản cũ ghi thẳng bảng).
drop function if exists ghi_nhat_ky_hoi(text, jsonb, text);
drop function if exists dat_khoa_nhat_ky(text);
drop table if exists khoa_nhat_ky;

grant insert on thanso_hoi_nhat_ky, huyenhoc_hoi_nhat_ky to anon;
drop policy if exists "anon insert thanso_hoi_nhat_ky" on thanso_hoi_nhat_ky;
create policy "anon insert thanso_hoi_nhat_ky" on thanso_hoi_nhat_ky for insert to anon with check (true);
drop policy if exists "anon insert huyenhoc_hoi_nhat_ky" on huyenhoc_hoi_nhat_ky;
create policy "anon insert huyenhoc_hoi_nhat_ky" on huyenhoc_hoi_nhat_ky for insert to anon with check (true);
