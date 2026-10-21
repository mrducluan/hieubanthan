-- Rollback cho 0018_ho_so_nha_nhac_viec.sql
drop function if exists don_nhac_viec();
drop trigger if exists nhac_viec_tran on nhac_viec;
drop function if exists nhac_viec_tran();
drop table if exists nhac_viec;
drop trigger if exists ho_so_nha_cap_nhat_luc on ho_so_nha;
drop function if exists ho_so_nha_cap_nhat_luc();
drop table if exists ho_so_nha;
