-- TV-A (2026-09-30, chủ dự án chốt): hồ sơ tài khoản thêm dữ liệu Tử vi / Bát tự cần.
--   noi_sinh    mã tỉnh (engine /v1/dia-ly/tinh) hoặc 'nuoc_ngoai' — quyết định múi giờ lúc sinh.
--   gio_mua_he  chỉ khi sinh ở nước ngoài: đồng hồ nơi sinh đang là giờ mùa hè.
--   do_tin_gio  giờ sinh chính xác (giấy tờ) hay áng chừng.
--   lich_nhap   người dùng nhập theo lịch nào; ngay_sinh LUÔN là dương lịch (engine đổi).
--   am_*        ngày âm tương ứng (engine trả) để người dùng đối chiếu giấy tờ.
-- Vẫn chỉ lưu khi người dùng bấm "Lưu vào tài khoản" + đồng ý; RLS 0006 giữ nguyên (chủ sở hữu).
-- Chạy SAU 0006. Rollback: 0007_ho_so_noi_sinh.down.sql

alter table ho_so
    add column if not exists noi_sinh   text check (noi_sinh is null or noi_sinh ~ '^[a-z0-9_-]{2,40}$'),
    add column if not exists gio_mua_he boolean not null default false,
    add column if not exists do_tin_gio text check (do_tin_gio is null or do_tin_gio in ('exact', 'approx')),
    add column if not exists lich_nhap  text not null default 'duong' check (lich_nhap in ('duong', 'am')),
    add column if not exists am_ngay    smallint check (am_ngay is null or am_ngay between 1 and 30),
    add column if not exists am_thang   smallint check (am_thang is null or am_thang between 1 and 12),
    add column if not exists am_nam     smallint check (am_nam is null or am_nam between 1899 and 2100),
    add column if not exists am_nhuan   boolean not null default false;
