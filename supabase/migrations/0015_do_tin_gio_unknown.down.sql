-- Rollback 0015_do_tin_gio_unknown.sql: hồ sơ 'unknown' về như trước 0015 (do_tin_gio null, gio_sinh vẫn null
-- = chưa có giờ) rồi khôi phục ràng buộc cũ của 0007.

begin;

update ho_so set do_tin_gio = null where do_tin_gio = 'unknown';
alter table ho_so drop constraint if exists ho_so_do_tin_gio_check;
alter table ho_so add constraint ho_so_do_tin_gio_check
    check (do_tin_gio is null or do_tin_gio in ('exact', 'approx'));

commit;
