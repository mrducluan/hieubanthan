-- Rollback cho 0003_kb_thanso_v2.sql
drop table if exists thanso_kb_khoi;
drop table if exists thanso_cap_so;
drop table if exists thanso_linh_vuc_nghia;
delete from sources where id = 'nhap_ai_2026';
