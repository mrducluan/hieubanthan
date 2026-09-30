-- Rollback cho 0007_ho_so_noi_sinh.sql
alter table ho_so
    drop column if exists noi_sinh,
    drop column if exists gio_mua_he,
    drop column if exists do_tin_gio,
    drop column if exists lich_nhap,
    drop column if exists am_ngay,
    drop column if exists am_thang,
    drop column if exists am_nam,
    drop column if exists am_nhuan;
