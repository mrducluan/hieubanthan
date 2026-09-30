-- Rollback cho 0006_ho_so.sql
drop trigger if exists ho_so_cap_nhat_luc on ho_so;
drop function if exists ho_so_cap_nhat_luc();
drop table if exists ho_so;
