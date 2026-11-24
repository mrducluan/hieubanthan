-- Rollback 0042_li_xi_tet.sql
drop trigger if exists lx_don_da_tra_trg on don_nap;
drop function if exists hoan_don_li_xi(bigint, text);
drop function if exists ds_li_xi_cua_toi();
drop function if exists li_xi_hieu_luc();
drop function if exists nhan_li_xi_tet(text);
drop function if exists xem_li_xi_tet(text);
drop function if exists tao_don_li_xi(text, integer, text, text, text);
drop function if exists li_xi_thong_tin();
drop function if exists lx_don_da_tra();
drop function if exists lx_bat();
drop function if exists lx_gia_goi(integer);
drop table if exists li_xi_tet;
delete from public.cau_hinh where khoa in ('sao.li_xi.bat', 'sao.li_xi.gia_1', 'sao.li_xi.gia_3', 'sao.li_xi.gia_5');
alter table don_nap drop constraint if exists don_nap_loai_check;
alter table don_nap add constraint don_nap_loai_check check (loai in ('sao', 'hoi_vien', 'chuyen_gia'));
