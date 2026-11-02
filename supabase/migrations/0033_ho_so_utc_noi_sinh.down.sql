-- Rollback 0033_ho_so_utc_noi_sinh.sql: bỏ cột múi giờ nơi sinh (hồ sơ về như trước — người dùng khai lại trên máy).
alter table ho_so drop constraint if exists ho_so_utc_noi_sinh_check;
alter table ho_so drop column if exists utc_noi_sinh;
