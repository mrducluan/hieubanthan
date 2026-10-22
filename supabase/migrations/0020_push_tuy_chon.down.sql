-- Rollback cho 0020_push_tuy_chon.sql
drop function if exists push_hang_doi_v2(date);
drop trigger if exists push_tuy_chon_cap_nhat_luc on push_tuy_chon;
drop function if exists push_tuy_chon_cap_nhat_luc();
drop table if exists push_tuy_chon;
