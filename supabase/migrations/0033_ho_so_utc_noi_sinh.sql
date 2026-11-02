-- EN-6 BI-3 (2026-11-02, chủ dự án giao "lưu múi giờ nơi sinh vào tài khoản"): hồ sơ tài khoản thêm cột utc_noi_sinh.
--   utc_noi_sinh  múi giờ CHUẨN nơi sinh (giờ so với UTC, −12 … +14, bước 0,25 giờ) — CHỈ khi noi_sinh = 'nuoc_ngoai'.
--                 Engine dùng để so mốc tiết khí Bát tự cho người sinh ở nước ngoài (trụ ngày / giờ vẫn giờ địa phương).
--                 Không phải toạ độ, không phải tên nước / thành phố — chỉ một con số.
-- Vẫn chỉ lưu khi người dùng bấm "Lưu vào tài khoản" + đồng ý; RLS 0006 giữ nguyên (chủ sở hữu đọc / ghi / xoá, xoá tài
-- khoản → cascade). Web chịu được khi CHƯA chạy file này: ghi lỗi thiếu cột → ghi lại không có cột này (như trước), đọc
-- lỗi → đọc bộ cột 0007. Quản trị nhận diện qua cột ho_so.utc_noi_sinh (web/lib/migration-qt.ts).
-- Chạy SAU 0007. Rollback: 0033_ho_so_utc_noi_sinh.down.sql

alter table ho_so add column if not exists utc_noi_sinh numeric(4, 2);

alter table ho_so drop constraint if exists ho_so_utc_noi_sinh_check;
alter table ho_so add constraint ho_so_utc_noi_sinh_check check (
    utc_noi_sinh is null
    or (noi_sinh = 'nuoc_ngoai' and utc_noi_sinh between -12 and 14 and utc_noi_sinh * 4 = trunc(utc_noi_sinh * 4))
);

comment on column ho_so.utc_noi_sinh is
    'EN-6 BI-3: múi giờ chuẩn nơi sinh (giờ, bước 0,25) — chỉ khi sinh ở nước ngoài; null = chưa khai / sinh trong nước';
