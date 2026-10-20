-- Rollback 0015_thanso_hoc.sql: xoá bảng góp ý, cụm, ký ức (dữ liệu học + ký ức người dùng mất hẳn — đúng ý rollback).
drop function if exists qt_cap_nhat_cum(bigint, text, text);
drop function if exists qt_cum_bat_thuong(text);
drop function if exists gui_phan_hoi_thanso(jsonb);
drop function if exists thanso_chu_ky_hop_le(jsonb);
drop trigger if exists ky_uc_gioi_han on ky_uc_nguoi_dung;
drop function if exists ky_uc_gioi_han();
drop table if exists ky_uc_nguoi_dung;
drop table if exists thanso_cum_bat_thuong;
drop table if exists thanso_phan_hoi;
