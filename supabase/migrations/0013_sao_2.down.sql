-- Rollback 0013_sao_2.sql. Hai khoá site.thong_bao* đã xoá không khôi phục (nội dung nay ở CMS).
drop function if exists thong_ke_doanh_thu(integer);
drop function if exists dung_luot_hoi(text, integer);
drop table if exists luot_hoi;
