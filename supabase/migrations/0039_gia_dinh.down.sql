-- Rollback cho 0039_gia_dinh.sql
drop trigger if exists gia_dinh_cap_nhat_luc on gia_dinh;
drop function if exists gia_dinh_cap_nhat_luc();
drop table if exists gia_dinh;
drop function if exists gia_dinh_hop_le(jsonb);
