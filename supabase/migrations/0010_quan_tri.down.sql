-- Rollback cho 0010_quan_tri.sql
drop function if exists thong_ke_quan_tri();
drop function if exists ghi_nhat_ky_quan_tri(text, text, jsonb);
drop table if exists cau_hinh;
drop table if exists nhat_ky_quan_tri;
drop table if exists vai_tro_quan_tri;
drop function if exists vai_tro_hieu_luc();
drop function if exists vai_tro_cua_toi();
