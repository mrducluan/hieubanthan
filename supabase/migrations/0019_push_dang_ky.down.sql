-- Rollback cho 0019_push_dang_ky.sql
drop function if exists push_ket_qua(uuid, date, text);
drop function if exists push_hang_doi(date);
drop function if exists dang_ky_push(text, text, text);
drop table if exists push_dang_ky;
-- Trả CHECK duong về bản 0018 (mốc có '#' đang lưu sẽ chặn lệnh này — xoá chúng trước nếu cần)
alter table nhac_viec drop constraint if exists nhac_viec_duong_check;
alter table nhac_viec add constraint nhac_viec_duong_check check (duong is null or duong ~ '^/[a-z0-9/_?=&.-]{0,120}$');
