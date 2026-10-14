-- Rollback 0014_nhiem_vu.sql. Sao đã thưởng KHÔNG bị thu hồi: bút toán 'nhiem_vu' chuyển thành 'dieu_chinh'
-- (giữ số dư người dùng) rồi mới khôi phục ràng buộc loại cũ. Khoá cau_hinh sao.nhiem_vu.* giữ lại (vô hại).
drop function if exists nhan_thuong_nhiem_vu(text);
drop function if exists nhiem_vu_cua_toi();
drop function if exists ghi_cau_hoi_tai_khoan(uuid);
drop function if exists nv_tien_do(uuid, text);
drop function if exists nv_can(text);
drop function if exists nv_muc(text);
drop function if exists nv_bat();
drop table if exists nhiem_vu_sao;
drop table if exists dem_hoi_tai_khoan;
update so_cai_sao set loai = 'dieu_chinh' where loai = 'nhiem_vu';
alter table so_cai_sao drop constraint if exists so_cai_sao_loai_check;
alter table so_cai_sao add constraint so_cai_sao_loai_check
    check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh'));
