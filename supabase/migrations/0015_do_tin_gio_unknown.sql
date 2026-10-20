-- TV-V2 (2026-10-19, chủ dự án duyệt): hồ sơ tài khoản lưu được "Không biết giờ".
--   do_tin_gio nhận thêm 'unknown' (0007 chỉ nhận 'exact' | 'approx'). Khi 'unknown', web để gio_sinh = null —
--   không lưu giờ đại diện 12:00 như thể là giờ thật; đọc lại thì web tự đặt 12:00 để an tạm lá số và mở định giờ 12 canh.
-- Ràng buộc 0007 viết nội dòng (không đặt tên) → Postgres tự đặt tên ho_so_do_tin_gio_check.
-- Web chịu được khi CHƯA chạy file này: vi phạm check (23514) → lưu lại như cũ (do_tin_gio null).
-- Vẫn chỉ lưu khi người dùng bấm "Lưu vào tài khoản" + đồng ý; RLS 0006 giữ nguyên (chủ sở hữu).
-- Chạy SAU 0007. Rollback: 0015_do_tin_gio_unknown.down.sql

alter table ho_so drop constraint if exists ho_so_do_tin_gio_check;
alter table ho_so add constraint ho_so_do_tin_gio_check
    check (do_tin_gio is null or do_tin_gio in ('exact', 'approx', 'unknown'));
