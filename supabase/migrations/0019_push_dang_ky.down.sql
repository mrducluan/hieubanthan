-- Rollback cho 0019_push_dang_ky.sql
drop function if exists push_ket_qua(uuid, date, text);
drop function if exists push_hang_doi(date);
drop function if exists dang_ky_push(text, text, text);
drop table if exists push_dang_ky;
